### 1. 통신 구간에서의 평문 노출 (가장 큰 위험)

현재 구조에서는 브라우저가 비밀번호를 암호화하지 않고 서버로 보냅니다. 만약 이 과정이 일반적인 HTTP 환경에서 이루어진다면, 중간자 공격(Man-in-the-Middle)을 통해 해커가 네트워크 패킷을 가로채 사용자 비밀번호를 그대로 읽을 수 있습니다.

- **해결책**: 반드시 **HTTPS(SSL/TLS)**를 적용해야 합니다. HTTPS는 브라우저와 서버 사이의 통신 전체를 암호화하므로, 전송 중인 평문 비밀번호가 외부로 노출되지 않도록 보호합니다.

### 2. 클라이언트 측 암호화의 한계

"브라우저에서 미리 암호화해서 보내면 더 안전하지 않을까?"라고 생각할 수 있지만, 프론트엔드에서의 암호화는 생각보다 보안 효과가 크지 않습니다.

- **재전송 공격**: 브라우저에서 비밀번호를 해싱해서 보내더라도, 해커가 그 해시값 자체를 가로채서 서버에 보내면 서버는 이를 정상적인 비밀번호로 인식해 로그인을 허용할 수 있습니다.
- **결론**: 결국 서버에 도착한 데이터를 어떻게 처리하느냐가 더 중요하며, 전송 구간의 보안은 HTTPS에 맡기는 것이 웹 표준 방식입니다.

### 3. 서버 측 세션 관리의 취약점

현재 방식은 Flask의 `session` 객체를 사용하며, 이는 브라우저의 쿠키에 세션 ID를 저장하는 방식입니다.

- **세션 하이재킹 (Session Hijacking)**: 해커가 사용자의 쿠키를 탈취하면 해당 사용자로 위장하여 시스템에 접근할 수 있습니다.
- **보완**: 쿠키 설정 시 `HttpOnly`(자바스크립트로 쿠키 접근 불가), `Secure`(HTTPS에서만 전송), `SameSite`(교차 사이트 요청 방지) 옵션을 활성화해야 합니다.

- **CSRF (Cross-Site Request Forgery)**: 사용자가 로그인된 상태에서 악성 사이트를 방문했을 때, 본인도 모르게 게시글을 쓰거나 삭제하는 요청이 서버로 보내질 수 있습니다.
- **보완**: Flask-WTF 같은 라이브러리를 사용해 **CSRF 토큰**을 검증하는 로직을 추가해야 합니다.

### 4. 서버 측 비밀번호 해싱 방식

현재 `app.py`는 `generate_password_hash`를 사용하고 있습니다. 이는 단순한 암호화보다 훨씬 안전한 **단방향 해싱** 방식입니다.

- **안전한 점**: 서버 DB가 해킹당하더라도 해커는 복호화된 원래 비밀번호를 알 수 없습니다.
- **보완**: 해싱 알고리즘이 `pbkdf2:sha256`이나 `bcrypt` 같은 강력한 알고리즘을 사용하는지 확인하고, 작업 계수(Work Factor)를 높여 무차별 대입 공격(Brute-force)을 방어해야 합니다.

## 1. 회원가입: 사용자 정보의 저장

사용자가 회원가입 버튼을 누르면 데이터는 아래와 같은 경로로 흐릅니다.

- **프론트엔드 (`register/page.tsx`)**: 사용자가 입력한 데이터를 `api.ts`로 넘깁니다.
- **백엔드 API (`app.py`)**: `generate_password_hash`를 통해 비밀번호를 암호화한 뒤 DB에 저장합니다.

```python
# backend/app.py
password_hash = generate_password_hash(password) # 비밀번호 암호화
query_db(
    "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
    (username, email, password_hash),
)

```

## 2. 로그인: 세션의 생성

로그인이 성공하면 서버는 해당 사용자를 식별할 수 있는 정보를 **서버 메모리(세션)**에 저장합니다.

- **백엔드 세션 저장**: `session` 객체에 유저 ID를 기록합니다. 이때 Flask는 내부적으로 고유한 **세션 ID**를 생성하여 브라우저에 쿠키 형태로 전달합니다.

```python
# backend/app.py
@app.route("/api/auth/login", methods=["POST"])
def login():
    # ... 유저 확인 로직 ...
    session["user_id"] = user["id"] # 서버 측 세션에 저장
    session["username"] = user["username"]
    return jsonify({"message": "로그인 성공", "user": ...})

```

## 3. 로그인 유지: 쿠키와 세션의 결합 (Credentials)

사용자가 로그인 후 다른 페이지로 이동하거나 게시글을 쓸 때, 매번 아이디/비밀번호를 입력하지 않아도 되는 이유는 이 세션 방식 덕분입니다.

- **프론트엔드 요청 (`api.ts`)**: `credentials: "include"` 설정이 핵심입니다. 이 설정 덕분에 브라우저는 매 요청마다 서버가 준 세션 쿠키를 자동으로 함께 보냅니다.

```typescript
// frontend/src/lib/api.ts
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 브라우저에 저장된 세션 쿠키를 서버로 자동 전송
    ...options,
  });
  return res.json();
}
```

## 4. 인증 확인: 서버에서의 사용자 식별

서버는 들어온 요청에 포함된 쿠키(세션 ID)를 보고 "아, 이 사람은 아까 로그인한 user_id 1번 이종윤님이구나"라고 판단합니다.

- **권한 검사 (`app.py`)**: 게시글 작성이나 내 정보 조회 시 세션 값이 있는지 확인합니다.

```python
# backend/app.py
@app.route("/api/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id") # 쿠키를 통해 서버 세션에서 ID를 가져옴
    if user_id is None:
        return jsonify({"error": "로그인이 필요합니다."}), 401
    # ... 이후 유저 정보 반환

```
