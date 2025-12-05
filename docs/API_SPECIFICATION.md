# API 명세서

## 개요

Ivory Backend API 명세서입니다. 이 문서는 Ivory 백엔드 서버에서 제공하는 모든 REST API 및 WebSocket 엔드포인트를 설명합니다.

## Base URL

```
http://localhost:8080
```

프로덕션 환경에서는 환경 변수로 설정된 URL을 사용합니다.

---

## 인증

현재 버전에서는 인증이 구현되어 있지 않습니다.

---

## API 엔드포인트

### 1. 함수 실행 요청

함수 실행을 요청하고 invocation을 생성합니다.

**엔드포인트:** `POST /api/invocations`

**요청 본문:**

```json
{
  "code": "def handler(event):\n    return {'message': 'hi'}\n",
  "runtime": "python",
  "handler": "main.handler",
  "payload": {
    "aa": "test"
  }
}
```

**요청 필드:**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `code` | string | ✅ | 실행할 함수 코드 |
| `runtime` | string | ✅ | 런타임 환경 (예: "python", "nodejs", "java") |
| `handler` | string | ✅ | 핸들러 함수 경로 (예: "main.handler", "index.handler") |
| `payload` | object | ✅ | 함수에 전달할 페이로드 데이터 |

**응답:**

```json
{
  "invocationId": "inv-20251201-abc123",
  "status": "REQUEST_RECEIVED"
}
```

**응답 필드:**

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `invocationId` | string | 생성된 invocation의 고유 ID |
| `status` | string | 현재 상태 (초기값: "REQUEST_RECEIVED") |

**상태 코드:**

- `200 OK`: 성공적으로 invocation이 생성됨

**동작:**

1. `invocationId` 생성 (형식: `inv-{YYYYMMDD}-{6자리랜덤문자}`)
2. 코드를 S3에 업로드 (`invocations/{invocationId}/code.{확장자}`)
3. DB에 invocation 정보 저장
4. Runner 서버에 실행 요청 전송 (`POST /internal/invocations`)

**파일 확장자 매핑:**

- `python` → `.py`
- `node` → `.js`
- `java` → `.java`
- 기타 → `.txt`

---

### 2. 실시간 로그 및 상태 스트림 (SSE)

함수 실행 중 발생하는 상태 변경 및 로그를 실시간으로 수신합니다.

**엔드포인트:** `GET /api/invocations/{invocationId}/stream`

**Content-Type:** `text/event-stream`

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `invocationId` | string | 조회할 invocation ID |

**응답 형식:**

SSE (Server-Sent Events) 형식으로 이벤트를 전송합니다.

**이벤트 타입:**

#### 2.1. STATUS 이벤트

상태 변경 시 전송됩니다.

```
event: STATUS
data: {"status":"EXECUTING"}
```

**가능한 상태값:**

- `REQUEST_RECEIVED`: 요청 수신 완료
- `CODE_FETCHING`: S3에서 코드 다운로드 중
- `SANDBOX_PREPARING`: 실행 환경 준비 중
- `EXECUTING`: 함수 실행 중
- `COMPLETED`: 실행 완료 (성공)
- `FAILED`: 실행 실패

#### 2.2. LOG 이벤트

함수 실행 중 로그 출력 시 전송됩니다.

```
event: LOG
data: {"line":"[USER] hello from server!"}
```

#### 2.3. COMPLETE 이벤트

함수 실행이 완료되면 전송됩니다. 성공 또는 실패 모두 이 이벤트로 전송됩니다.

**성공 시:**

```
event: COMPLETE
data: {"status":"COMPLETED","durationMs":934,"result":{"statusCode":200,"body":"{\"message\":\"Hello from Lambda!!!!\"}"}}
```

**실패 시:**

```
event: COMPLETE
data: {"status":"FAILED","durationMs":400,"errorMessage":"NameError: name 'x' is not defined"}
```

**COMPLETE 이벤트 필드:**

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `status` | string | 최종 상태 ("COMPLETED" 또는 "FAILED") |
| `durationMs` | number | 실행 소요 시간 (밀리초) |
| `result` | object | 성공 시 결과 (status가 "COMPLETED"일 때만) |
| `result.statusCode` | number | HTTP 상태 코드 |
| `result.body` | string | 함수 반환값 (JSON 문자열) |
| `errorMessage` | string | 실패 시 에러 메시지 (status가 "FAILED"일 때만) |

**상태 코드:**

- `200 OK`: SSE 스트림이 정상적으로 시작됨

**참고:**

- SSE 연결은 함수 실행이 완료되면 자동으로 종료됩니다.
- 여러 클라이언트가 동시에 같은 invocationId를 구독할 수 있습니다.
- 연결이 끊어지거나 타임아웃되면 자동으로 정리됩니다.

---

### 3. 런타임 목록 조회

사용 가능한 런타임 환경 목록을 조회합니다.

**엔드포인트:** `GET /api/runtimes`

**응답:**

```json
[
  {
    "name": "python",
    "runtime": "Python 3.10"
  },
  {
    "name": "nodejs",
    "runtime": "Node.js 18.x"
  },
  {
    "name": "java",
    "runtime": "Java 11"
  }
]
```

**응답 필드:**

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `name` | string | 런타임 식별자 |
| `runtime` | string | 런타임 설명 |

**상태 코드:**

- `200 OK`: 성공

---

## 내부 API (Runner 통신용)

### 4. Runner 실행 요청 (내부)

Runner 서버에 함수 실행을 요청합니다. 이 API는 백엔드 서버에서 Runner 서버로 호출하는 내부 API입니다.

**엔드포인트:** `POST /internal/invocations`

**요청 본문:**

```json
{
  "invocationId": "inv-20251201-abc123",
  "codeKey": "invocations/inv-20251201-abc123/code.py",
  "runtime": "python",
  "handler": "main.handler",
  "payload": {
    "aa": "test"
  }
}
```

**요청 필드:**

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `invocationId` | string | Invocation ID |
| `codeKey` | string | S3에 저장된 코드 파일의 키 |
| `runtime` | string | 런타임 환경 |
| `handler` | string | 핸들러 함수 경로 |
| `payload` | object | 함수에 전달할 페이로드 |

**상태 코드:**

- `200 OK`: 요청이 Runner 서버로 전달됨

---

## WebSocket API

### 5. Runner 이벤트 수신 (내부)

Runner 서버에서 발생하는 이벤트를 WebSocket을 통해 수신합니다.

**엔드포인트:** `WS /internal/ws/runner`

**연결 URL 예시:**

```
ws://api.internal/internal/ws/runner?runnerId=runner-1&token=...
```

**메시지 형식:**

Runner 서버에서 API 서버로 전송하는 메시지 형식:

```json
{
  "type": "STATUS" | "LOG" | "COMPLETE",
  "invocationId": "inv-20251201-abc123",
  "payload": { ... }
}
```

#### 5.1. STATUS 메시지

```json
{
  "type": "STATUS",
  "invocationId": "inv-20251201-abc123",
  "payload": {
    "status": "CODE_FETCHING"
  }
}
```

#### 5.2. LOG 메시지

```json
{
  "type": "LOG",
  "invocationId": "inv-20251201-abc123",
  "payload": {
    "line": "[USER] hello"
  }
}
```

#### 5.3. COMPLETE 메시지

**성공 시:**

```json
{
  "type": "COMPLETE",
  "invocationId": "inv-20251201-abc123",
  "payload": {
    "status": "COMPLETED",
    "result": {
      "statusCode": 200,
      "body": "{\"message\":\"Hello from Lambda!!!!\"}"
    },
    "durationMs": 934
  }
}
```

**실패 시:**

```json
{
  "type": "COMPLETE",
  "invocationId": "inv-20251201-abc123",
  "payload": {
    "status": "FAILED",
    "errorType": "RUNTIME_ERROR",
    "errorMessage": "NameError: name 'x' is not defined",
    "durationMs": 400
  }
}
```

**동작:**

- WebSocket으로 수신한 메시지는 `RunnerEventService`에서 처리됩니다.
- 각 메시지 타입에 따라 SSE 스트림으로 클라이언트에 전달됩니다.
- DB 상태도 함께 업데이트됩니다.

---

## 테스트 엔드포인트

개발 및 테스트 목적으로 제공되는 엔드포인트입니다.

### 6. 상태 전송 테스트

**엔드포인트:** `POST /test/send/status`

**동작:**

하드코딩된 invocationId("1234")에 대해 "EXECUTING" 상태를 SSE로 전송합니다.

**상태 코드:**

- `200 OK`: 성공

---

### 7. 로그 전송 테스트

**엔드포인트:** `POST /test/send/log`

**동작:**

하드코딩된 invocationId("1234")에 대해 테스트 로그를 SSE로 전송합니다.

**상태 코드:**

- `200 OK`: 성공

---

### 8. 완료 이벤트 전송 테스트

**엔드포인트:** `POST /test/send/complete`

**동작:**

하드코딩된 invocationId("1234")에 대해 성공 완료 이벤트를 SSE로 전송합니다.

**상태 코드:**

- `200 OK`: 성공

---

## 데이터 모델

### Invocation 엔티티

DB에 저장되는 invocation 정보입니다.

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `id` | Long | Primary Key (자동 생성) |
| `invocationId` | String | 고유 Invocation ID |
| `runtime` | String | 런타임 환경 |
| `handler` | String | 핸들러 함수 경로 |
| `payload` | String | 페이로드 (JSON 문자열) |
| `status` | String | 현재 상태 |
| `createdAt` | LocalDateTime | 생성 시간 |
| `updatedAt` | LocalDateTime | 최종 업데이트 시간 |

---

## 에러 처리

현재 버전에서는 명시적인 에러 응답 형식이 정의되어 있지 않습니다. 일반적인 HTTP 상태 코드를 사용합니다.

**일반적인 상태 코드:**

- `200 OK`: 요청 성공
- `400 Bad Request`: 잘못된 요청
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류

---

## CORS 설정

CORS는 다음 설정으로 구성되어 있습니다:

- **허용 Origin:** `http://localhost:3000`, 환경 변수로 설정된 프론트엔드 URL
- **허용 메서드:** GET, POST, PATCH, DELETE, HEAD, OPTIONS, PUT
- **허용 헤더:** 모든 헤더
- **노출 헤더:** Authorization
- **Credentials:** 허용

---

## 실행 흐름

1. **REQUEST_RECEIVED** – 요청 수신 및 기본 검증
2. **CODE_FETCHING** – S3에서 코드 다운로드
3. **SANDBOX_PREPARING** – 컨테이너/격리 환경 구성
4. **EXECUTING** – 사용자 코드 실행 및 로그 수집
5. **COMPLETED** – 성공 결과 반환 및 자원 정리
6. **FAILED** – 오류/타임아웃 등 실패 처리 및 에러 로그 반환

---

## S3 저장 구조

코드 및 관련 파일은 다음 구조로 S3에 저장됩니다:

```
invocations/
  └── {invocationId}/
      ├── code.{ext}      # 사용자 코드 파일
      ├── payload.json    # 페이로드 (향후 구현)
      ├── logs.txt        # 실행 로그 (향후 구현)
      └── result.json     # 실행 결과 (향후 구현)
```

---

## 참고사항

- 모든 시간은 서버 시간대를 따릅니다.
- SSE 연결은 장시간 유지될 수 있으므로 적절한 타임아웃 설정이 필요합니다.
- WebSocket 연결은 Runner 서버와의 내부 통신용이므로 외부에서 직접 접근할 수 없습니다.
- 테스트 엔드포인트는 프로덕션 환경에서 비활성화하는 것을 권장합니다.

