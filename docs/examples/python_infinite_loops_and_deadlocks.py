# Python 무한 루프 및 데드락 패턴 예시 코드
# 이 파일은 정적 분석 도구가 감지할 수 있는 패턴들을 보여줍니다.
# 모든 예시는 handler 함수로 감싸져 있습니다.

import threading
import time

# ============================================
# 1. 무한 루프 패턴
# ============================================

# 패턴 1: while True (경고 발생)
def handler(event):
    while True:
        print("This will run forever")
        # break 조건이 없음 - 정적 분석 도구가 경고
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 2: while 1 (경고 발생)
def handler(event):
    while 1:
        print("This will also run forever")
        # break 조건이 없음
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 3: while 1 == 1 (경고 발생)
def handler(event):
    while 1 == 1:
        print("This will also run forever")
        # break 조건이 없음
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 4: iter(int, 1)를 사용한 무한 이터레이터 (경고 발생)
def handler(event):
    for i in iter(int, 1):
        print("Infinite iterator")
        # iter(int, 1)는 무한 이터레이터를 생성
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# ============================================
# 2. 데드락 패턴
# ============================================

# 패턴 1: Lock을 acquire한 후 release하지 않음 (경고 발생)
def handler(event):
    lock = threading.Lock()
    lock.acquire()
    # release()가 없음 - 정적 분석 도구가 경고
    print("This code will deadlock if another thread tries to acquire")
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 2: RLock을 acquire한 후 release하지 않음 (경고 발생)
def handler(event):
    rlock = threading.RLock()
    rlock.acquire()
    # release()가 없음
    print("RLock acquired but not released")
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 3: Semaphore를 acquire한 후 release하지 않음 (경고 발생)
def handler(event):
    semaphore = threading.Semaphore(1)
    semaphore.acquire()
    # release()가 없음
    print("Semaphore acquired but not released")
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 4: 매우 긴 sleep 시간 (경고 발생)
def handler(event):
    time.sleep(500)  # 500초 = 8분 이상 - 정적 분석 도구가 경고
    print("This will sleep for a very long time")
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 5: 여러 락 사용 (데드락 가능성 경고)
def handler(event):
    lock1 = threading.Lock()
    lock2 = threading.Lock()
    
    # 여러 락이 사용되면 데드락 가능성 경고
    lock1.acquire()
    lock2.acquire()
    # ... 작업 수행
    lock2.release()
    lock1.release()
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 패턴 6: Condition을 사용한 wait() 후 notify() 없음 (경고 발생)
def handler(event):
    condition = threading.Condition()
    condition.acquire()
    condition.wait()  # notify()가 없으면 영원히 대기
    # notify()가 없음 - 정적 분석 도구가 경고
    condition.release()
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# ============================================
# 3. 올바른 패턴 (경고 없음)
# ============================================

# 올바른 무한 루프: break 조건이 있음
def handler(event):
    counter = 0
    while True:
        counter += 1
        if counter > 100:
            break  # break 조건이 있음 - 경고 없음
        print(counter)
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 올바른 락 사용: acquire 후 release
def handler(event):
    lock = threading.Lock()
    lock.acquire()
    try:
        print("Critical section")
    finally:
        lock.release()  # 항상 release - 경고 없음
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 올바른 sleep: 짧은 시간
def handler(event):
    time.sleep(1)  # 1초 - 경고 없음
    print("Short sleep")
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# 올바른 Condition 사용: notify() 포함
def handler(event):
    condition = threading.Condition()
    condition.acquire()
    try:
        condition.wait(timeout=5)  # timeout 사용
        condition.notify()  # notify() 있음 - 경고 없음
    finally:
        condition.release()
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}

# ============================================
# 4. 재귀 호출 패턴 (무한 재귀 가능성)
# ============================================

# 재귀 함수가 여러 번 호출되는 경우 (경고 발생)
def handler(event):
    def recursive_function(n):
        if n <= 0:
            return 1
        return recursive_function(n - 1) * recursive_function(n - 2)  # 여러 번 재귀 호출
    
    result = recursive_function(10)
    return {"statusCode": 200, "body": f"Result: {result}"}

# ============================================
# 5. 복합 패턴 (무한 루프 + 데드락)
# ============================================

def handler(event):
    lock = threading.Lock()
    while True:  # 무한 루프
        lock.acquire()  # 락 획득
        # release()가 없음 - 데드락
        print("This will deadlock in an infinite loop")
    return {"statusCode": 200, "body": "Hello from Ivory Express!"}
