# 1. 데이터 모델링 이해 (`schema.sql`)

백엔드 개발의 시작은 데이터를 어떻게 저장하고 연관 지을지 구조를 설계하는 것입니다. 이 과정을 **데이터 모델링**이라고 합니다.

### 데이터베이스, SQL, 그리고 PostgreSQL

- **데이터베이스 (Database)**: 수많은 데이터를 안전하고 체계적으로 저장, 관리하는 가상의 창고입니다.
- **SQL (Structured Query Language)**: 데이터베이스와 대화하기 위한 표준 언어입니다. "회원 정보를 추가해 줘", "특정 게시물을 가져와 줘"와 같은 명령을 내릴 때 사용합니다.
- **PostgreSQL**: 안정성과 강력한 기능을 자랑하는 대표적인 오픈 소스 관계형 데이터베이스 관리 시스템(RDBMS)입니다. 정보를 엑셀 시트와 같은 '테이블' 형태로 저장하며, 데이터 간의 연결(관계)을 엄격하고 정확하게 다룰 수 있어 현업에서 매우 널리 쓰입니다.

이 프로젝트는 PostgreSQL 데이터베이스를 사용하며, 아래와 같이 프로젝트 루트의 `backend/schema.sql` 파일을 실행하여 초기 테이블을 생성합니다.

### 테이블 명세 및 코드 분석 (`schema.sql`)

```sql
-- 1. 사용자 테이블 (users)
CREATE TABLE IF NOT EXISTS users (
    -- id: 각 사용자를 구별하는 고유 식별자.
    -- SERIAL: 데이터가 추가될 때 자동으로 1, 2, 3... 번호를 부여함
    -- PRIMARY KEY: 테이블 내에서 유일하고 필수적인 값(기본 키)으로 지정
    id SERIAL PRIMARY KEY,

    -- username, email: 사용자 이름과 이메일.
    -- UNIQUE: 동일한 값이 중복되어 가입되는 것을 시스템적으로 차단
    -- NOT NULL: 필수 입력 데이터로 빈 값을 허용하지 않음
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,

    -- password_hash: 사용자의 평문 비밀번호 대신 안전하게 해싱(암호화)된 값을 저장
    password_hash VARCHAR(256) NOT NULL,

    -- created_at: 회원가입 시간. 별도 입력이 없어도 저장 시점의 시간이 기본으로 들어감
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 게시글 테이블 (posts)
CREATE TABLE IF NOT EXISTS posts (
    -- id, title, content: 게시글 식별 아이디, 제목, 본문
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    -- user_id: 이 게시글의 작성자를 가리키는 고유 식별자 (users 테이블의 id)
    -- REFERENCES users(id): users 테이블의 id를 가리키는 외래 키(Foreign Key) 설정
    -- ON DELETE CASCADE: 작성자(users 레코드)가 탈퇴(삭제)되면, 해당 게시물도 연쇄적으로 삭제됨
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- created_at, updated_at: 게시글 생성 및 최근 수정 시간
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

# 2. 데이터베이스 연동 로직 (`db.py`)

파이썬 백엔드(`Flask`)가 PostgreSQL 데이터베이스와 어떻게 연결되고 통신하는지를 담당하는 코어 파일입니다.

### 핵심 기능 및 코드 분석 (`db.py`)

````python
import os
import psycopg2
import psycopg2.extras
from flask import g

def get_db():
    """현재 요청에 대한 DB 연결을 반환 (Flask g 객체에 캐싱)"""
    # g는 Flask에서 제공하는 글로벌 전용 저장소입니다. 한 번 접속한 DB 파이프를
    # 매번 새로 만들지 않고 g 객체에 임시 저장(캐싱)해 둔 뒤 재사용합니다.
    if "db" not in g:
        g.db = psycopg2.connect(
            # os.environ.get을 통해 도커(docker-compose) 설정에 주입된 환경 변수를 가져와 연결합니다.
            host=os.environ.get("DB_HOST", "localhost"),
            port=os.environ.get("DB_PORT", "5432"),
            dbname=os.environ.get("DB_NAME", "knu_open"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", "postgres"),
        )
        # 쿼리가 실행될 때마다 자동으로 결과가 저장(commit)되도록 설정합니다.
        g.db.autocommit = True
    return g.db

def close_db(e=None):
    """요청 종료 시 DB 연결 닫기"""
    # 사용자의 단일 요청(API 호출)이 완전히 끝나면 연결을 안전하게 끊어줍니다.
    # 사용하지 않는 DB 접속이 누적되어 자원(메모리 등)이 낭비되는 것을 방지합니다.
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db(app):
    """schema.sql을 실행하여 테이블 초기화"""
    # 앱이 처음 켜질 때 자동으로 데이터베이스 뼈대(테이블)를 만드는 함수입니다.
    with app.app_context():
        db = get_db()
        cur = db.cursor()
        # db.py 파일이 위치한 현재 폴더 경로를 찾아 "schema.sql"을 연결합니다.
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, "r") as f:
            # 파일 안의 모든 SQL 명령어를 DB로 전송하여 실행합니다.
            cur.execute(f.read())
        cur.close()

def query_db(query, args=(), one=False):
    """SQL 쿼리 실행 후 딕셔너리 형태로 결과 반환"""
    db = get_db()
    # RealDictCursor를 사용해 데이터베이스 쿼리 파싱 결과를 단순 리스트가 아닌
    # 파이썬의 딕셔너리(Dictionary) 형태로 조립합니다. (예: row['username'])
    cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query, args)

    # 만약 데이터베이스에서 정보를 가져오는 "SELECT" 명령어라면 결과를 반환하고,
    if query.strip().upper().startswith("SELECT"):
        rv = cur.fetchall()
        cur.close()
        # one=True면 결과 중 맨 첫 번째 1개만 반환, 아니면 전체 목록 반환
        if one:
            return rv[0] if rv else None
        return rv
    else:
        # 정보를 삽입/수정/삭제하는 명령어(INSERT, UPDATE 등)라면 반환값 없이 끝냅니다.
        cur.close()
        return None

# 3. 비즈니스 로직 및 API 분석 (`app.py`)

클라이언트(프론트엔드)의 요청에 따라 실제 기능을 수행하는 핵심 데이터 처리 및 API 응답 로직입니다. 본 프로젝트의 백엔드에서는 Python의 `Flask` 웹 프레임워크를 기반으로 각 API 엔드포인트(URL 경로)마다 함수를 매핑하여 동작합니다.

### 3.1. 사용자 인증 및 보안 (Auth)

사용자의 회원가입, 로그인 등을 처리하며 시스템 내부적으로 세션(Session)을 이용해 로그인 상태를 유지합니다.

#### 회원가입 API 로직
```python
@app.route("/api/auth/register", methods=["POST"])
def register():
    # 1. 프론트엔드에서 보낸 JSON 데이터를 파싱합니다.
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    # ... (유효성 검사 로직 생략) ...

    # 2. 중복 확인: 이메일이나 사용자명이 이미 DB에 존재하는지 검사합니다.
    existing = query_db(
        "SELECT id FROM users WHERE email = %s OR username = %s",
        (email, username),
        one=True,
    )
    if existing:
        return jsonify({"error": "이미 사용 중인 이메일 또는 사용자명입니다."}), 409

    # 3. 사용자 생성: werkzeug.security 가 제공하는 generate_password_hash 함수로
    # 평문 비밀번호를 안전하게 해싱(암호화)한 뒤 DB에 저장합니다.
    password_hash = generate_password_hash(password)
    query_db(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
        (username, email, password_hash),
    )

    return jsonify({"message": "회원가입이 완료되었습니다."}), 201
````

#### 로그인 및 세션 관리 로직

```python
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    # 1. DB에서 이메일로 검색하여 사용자의 암호화된 비밀번호 등 정보를 불러옵니다.
    user = query_db(
        "SELECT id, username, email, password_hash FROM users WHERE email = %s",
        (email,),
        one=True,
    )

    # 2. check_password_hash를 이용해 사용자가 방금 입력한 평문 비밀번호와
    # DB에 저장되어 있던 해시값을 안전하게 비교하여 올바른지 검증합니다.
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "이메일 또는 비밀번호가 올바르지 않습니다."}), 401

    # 3. 검증 성공 시, Flask 세션 객체(session)에 사용자 식별자(user_id)와 이름을 기록합니다.
    # Flask는 이를 기반으로 암호화된 쿠키를 만들어 프론트엔드로 전달하고,
    # 이후 클라이언트 요청마다 쿠키를 받아 로그인 상태를 확인/유지합니다.
    session["user_id"] = user["id"]
    session["username"] = user["username"]

    return jsonify({
        "message": "로그인 성공",
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]}
    })
```

### 3.2. 게시판 핵심 기능 (CRUD)

데이터베이스에서 게시물을 읽고, 쓰고, 조작하는 핵심 기능입니다. `LIMIT`, `OFFSET`을 이용한 페이지네이션과 세션 정보를 이용한 수정/삭제 권한 검증에 주목합니다.

#### 게시글 목록 조회 (페이지네이션)

```python
@app.route("/api/posts", methods=["GET"])
def get_posts():
    # 1. URL의 쿼리 파라미터에서 현재 페이지 번호 'page' 값을 가져옵니다. (기본값 1)
    # 예: /api/posts?page=2
    page = request.args.get("page", 1, type=int)

    # 2. OFFSET 계산: 2페이지라면 앞의 10개(POSTS_PER_PAGE)를 건너뛰도록 계산합니다.
    # 즉, DB에서 11번째 데이터부터 가져오게 됩니다.
    offset = (page - 1) * POSTS_PER_PAGE

    # ... (전체 글 수 확인 생략) ...

    # 3. 글 목록 조회: LIMIT와 OFFSET을 SQL문 안에 주입하여 필요한 만큼만 가져옵니다.
    posts = query_db(
        """
        SELECT p.id, p.title, p.created_at, p.updated_at,
               u.id AS user_id, u.username
        FROM posts p
        JOIN users u ON p.user_id = u.id   -- 작성자 이름을 함께 가져오기 위해 users 테이블 조인
        ORDER BY p.created_at DESC         -- 최신 작성글이 먼저 오도록 내림차순(DESC) 정렬
        LIMIT %s OFFSET %s                 -- 페이지당 글 갯수 제한(LIMIT) 및 시작점 타겟 설정(OFFSET)
        """,
        (POSTS_PER_PAGE, offset),
    )

    # ... JSON 데이터로 조립 후 반환 ...
```

#### 게시글 조작 및 권한 체크 (방어 로직)

```python
@app.route("/api/posts/<int:post_id>", methods=["PUT"])
def update_post(post_id):
    # 1. 권한 체크 1단계: 세션에 user_id 값이 존재하는지 확인하여 로그인 유무를 파악합니다.
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "로그인이 필요합니다."}), 401

    # 2. 수정 대상 게시물을 찾습니다.
    post = query_db("SELECT id, user_id FROM posts WHERE id = %s", (post_id,), one=True)
    if post is None:
        return jsonify({"error": "게시글을 찾을 수 없습니다."}), 404

    # 3. 권한 체크 2단계: 현재 로그인한 사용자(user_id)와 변경하려는 게시물의 실제 작성자(post["user_id"])가
    # 일치하는지 비교합니다. 타인이거나 본인의 글이 아니라면 403 인증 거부 에러를 반환합니다.
    if post["user_id"] != user_id:
        return jsonify({"error": "수정 권한이 없습니다."}), 403

    # ... 이후 프론트엔드가 보낸 데이터를 확인하여 실제 DB UPDATE 쿼리를 실행 ...
```
