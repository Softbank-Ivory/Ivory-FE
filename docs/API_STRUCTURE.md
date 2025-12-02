# BE 설계



## 흐름



1. **REQUEST_RECEIVED** – 요청 수신 & 기본 검증

2. **CODE_FETCHING** – S3에서 코드 내려받고 파일 시스템 준비

3. **SANDBOX_PREPARING** – 컨테이너/격리 환경 구성

4. **EXECUTING** – 유저 코드 실행 + 로그 수집

5. **COMPLETED** – 성공 결과 콜백 & 자원 정리

6. **FAILED** – 오류/타임아웃 등 실패 처리 & 에러 로그 콜백



## 아키텍처



```java

                             ┌──────────────────────────┐

                             │     User Browser (FE)    │

                             │   React / TypeScript     │

                             └───────────┬──────────────┘

                                         │

                           1) 실행요청    │   4) SSE로 상태/로그 수신

                           POST /invocations

                                         │

                            HTTPS        │    SSE: GET /stream/invocations/{id}

                                         │

                     ┌───────────────────▼───────────────────┐

                     │        API Server EC2 (Spring)        │

                     │----------------------------------------│

                     │  - POST /invocations                  │

                     │  - GET  /stream/invocations/{id} (SSE)│

                     │  - (내부용) Runner 호출 클라이언트     │

                     │  - (내부용) WS 서버: /internal/ws/runner│

                     └───────────┬───────────────┬───────────┘

                                 │               │

                        2) 실행요청 전달         │

                        POST /internal/run       │

                                 │               │ WebSocket

                                 │               │ (STATUS / LOG / COMPLETE)

                                 │               │

                     ┌───────────▼───────────┐   │

                     │   Runner EC2          │◀──┘

                     │  (우리 Lambda 엔진)   │

                     │-----------------------│

                     │  - HTTP: POST /internal/run  (서버)   │

                     │  - WS  : /internal/ws/runner (클라)   │

                     │  - 코드 파일/컨테이너 실행           │

                     └───────────┬───────────┘

                                 │

                    코드/페이로드/로그/결과 파일

                                 │

         ┌───────────────────────┴─────────────────────────┐

         │                                                 │

┌────────▼───────────┐                           ┌─────────▼───────────┐

│      RDS (DB)      │                           │      S3 Bucket      │

│  invocations 테이블 │                           │  invocations/{id}/  │

│  - id              │                           │   - code.zip        │

│  - status          │                           │   - payload.json    │

│  - runtime         │                           │   - logs.txt        │

│  - handler         │                           │   - result.json     │

│  - duration_ms ... │                           └──────────────────────┘

└────────────────────┘

```



## API



<aside> 💡



[API 명세서](https://www.notion.so/API-2bbc403885128092a4b6f3ecda2b6b92?pvs=21)



</aside>



- **(API → Runner 실행 요청) 기능 → 서연 (Runner에서 요청 처리 API: 성년님)**

    

    ```java

    **(POST /internal/run**  

    {

      "invocationId": "inv-20251201-0001",

      "code": "def handler(event):\\n    return {'msg': 'hi'}\\n",

      "runtime": "python3.10",

      "handler": "main.handler",

      "payload": {

        "name": "seoyeon",

        "value": 10

      },

      "timeoutMs": 5000

    }

    ```

    

- **함수 실행 요청 POST /invocations → 서연** request

    

    ```java

    {

      "code": "def handler(event):\\n  return {'message': 'hi'}\\n",

      "runtime": "python3.10",

      "handler": "main.handler",

      "payload": { // 논의 필요

        "aa": "test"

      }

    }

    ```

    

    response

    

    ```java

    {

      "invocationId": "inv-20251130-0001",

      "status": "REQUEST_RECEIVED"

    }

    ```

    

- **실시간 로그 & 상태 스트림 (SSE) GET /stream/invocations/{invocationId} → 서연**

    



response



```java

event: STATUS

data: {"status":"EXECUTING"}



event: STATUS

data: {"status":"COMPLETED"}

```



- **~~(HTTP) Runner 콜백 API (Runner → API Server 내부라인)~~ [비상용]**

    

    - **(HTTP) Runner 콜백 API (Runner → API Server 내부라인)**

        

        - **상태 변경 콜백 POST /internal/invocations/{invocationId}/status**

            

            - **설명**

                

                Runner가 단계가 바뀔 때마다 호출:

                

                - REQUEST_RECEIVED

                - CODE_FETCHING

                - SANDBOX_PREPARING

                - EXECUTING

            

            request

            

            ```java

            {

              "status": "CODE_FETCHING"

            }

            ```

            

            - API 서버는:

                - DB에 status 업데이트

                - SSE 스트림이 열려 있으면 event: STATUS로 push

        - **로그 콜백 POST /internal/invocations/{invocationId}/log**

            

            - Runner가 컨테이너 stdout/stderr 한 줄 읽을 때마다 보내는 API.

            

            request

            

            ```java

            {

              "line": "[USER] hello"

            }

            ```

            

            - API 서버는:

                - 로그를 메모리/DB/S3에 append (선택)

                - 동시에 SSE로 event: LOG push

        - **실행 완료 콜백:** POST /internal/invocations/{invocationId}/complete

            

        

        ```java

        // 실패

        {

          "status": "FAILED",

          "errorType": "RUNTIME_ERROR",

          "errorMessage": "NameError: name 'x' is not defined",

          "logsTail": [

            "Traceback (most recent call last):",

            "  File \\"runner_entry.py\\", line 12, in <module>",

            "NameError: name 'x' is not defined"

          ],

          "durationMs": 400

        }

        ```

        

- **(Websocket) Runner 콜백 API (Runner → API Server 내부라인) → 시훈**

    

    - **WebSocket 엔드포인트 예시**

    

    ```java

    WS /internal/ws/runner

    ```

    

    - Runner EC2가 시작할 때:

    

    ```java

    ws://api.internal/internal/ws/runner?runnerId=runner-1&token=...

    ```

    

    - **WebSocket으로 주고받는 메시지 타입 설계**

        

        - **공통 메시지 포맷**

        

        ```java

        {

          "type": "STATUS" | "LOG" | "COMPLETE",

          "invocationId": "inv-20251130-0001",

          "payload": { ... }

        }

        ```

        

        - **STATUS 메시지**

        

        ```java

        {

          "type": "STATUS",

          "invocationId": "inv-20251130-0001",

          "payload": {

            "status": "CODE_FETCHING"  // REQUEST_RECEIVED / CODE_FETCHING / ...

          }

        }

        ```

        

        API 서버가 하는 일:

        

        - DB에 상태 업데이트

        - 해당 invocationId를 구독 중인 SSE 스트림에 event: STATUS로 push

        - **LOG 메시지**

        

        ```java

        {

          "type": "LOG",

          "invocationId": "inv-20251130-0001",

          "payload": {

            "line": "[USER] hello"

          }

        }

        ```

        

        - **COMPLETE 메시지**

            

            - 성공

            

            ```java

            {

              "type": "COMPLETE",

              "invocationId": "inv-20251130-0001",

              "payload": {

                "status": "COMPLETED",

                "result": {

                  "statusCode": 200,

                  "body": "{\\"message\\":\\"Hello from Lambda!!!!\\"}"

                },

                "durationMs": 934

              }

            }

            ```

            

            - 실패

            

            ```java

            {

              "type": "COMPLETE",

              "invocationId": "inv-20251130-0002",

              "payload": {

                "status": "FAILED",

                "errorType": "RUNTIME_ERROR",

                "errorMessage": "NameError: name 'x' is not defined",

                "durationMs": 400

              }

            }

            ```

            

            API 서버:

            

            - DB에 상태/결과/에러 저장

            - SSE로 마지막 STATUS 이벤트 (COMPLETED / FAILED) push

            - 이후 FE에서 “배송 완료/실패” 상태 표시 가능

- **런타임 조회 API: GET → 시훈**

    



## DB



- **invocation 테이블**

    

    - id (PK)

        - = invocationId

    - status (enum)

        - REQUEST_RECEIVED / CODE_FETCHING / SANDBOX_PREPARING / EXECUTING / COMPLETED / FAILED

    - runtime

        - “python3.10”, “nodejs20”, “java21” …

    - handler

        - “main.handler”, “index.handler”, “com.example.Handler::handle” …

    - created_at

    - started_at

    - finished_at

    - duration_ms

- handler 테이블

    



## S3



- code_s3_key

    - invocations/{invocationId}/code.zip

- payload_s3_key

    - invocations/{invocationId}/payload.json

- logs_s3_key

    - invocations/{invocationId}/logs.txt

- result_s3_key

    - invocations/{invocationId}/result.json