import os
import psycopg2
import psycopg2.extras
import bcrypt
import secrets
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import json
import bleach

ALLOWED_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th']
ALLOWED_ATTRS = {'a': ['href', 'title'], 'img': ['src', 'alt', 'width', 'height'], '*': ['style', 'class']}

def sanitize_html(html_str):
    if not html_str:
        return html_str
    return bleach.clean(html_str, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)

app = FastAPI()

FRONTEND_URL = os.environ.get("REPLIT_DEV_DOMAIN", "")
allowed_origins = []
if FRONTEND_URL:
    allowed_origins.append(f"https://{FRONTEND_URL}")
allowed_origins.append("http://localhost:5000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    try:
        yield conn
    finally:
        conn.close()

def get_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def get_current_user(request: Request, conn=None):
    token = request.cookies.get("session_token")
    if not token:
        return None
    if conn is None:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT u.id, u.email, u.full_name, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()", (token,))
        user = cur.fetchone()
        conn.close()
        return dict(user) if user else None
    cur = get_cursor(conn)
    cur.execute("SELECT u.id, u.email, u.full_name, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()", (token,))
    user = cur.fetchone()
    return dict(user) if user else None

def require_auth(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

def require_role(request: Request, roles: list):
    user = require_auth(request)
    if user["role"] not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class CourseCreate(BaseModel):
    title: str
    short_description: str = ""
    full_description: str = ""
    image_url: str = ""
    tags: str = ""
    visibility: str = "public"
    access: str = "free"
    price: float = 0
    published: bool = False

class LessonCreate(BaseModel):
    title: str
    lesson_type: str = "document"
    content: str = ""
    duration: int = 0
    order_index: int = 0

class QuizCreate(BaseModel):
    title: str
    timer_seconds: int = 0
    pass_score: int = 70

class QuestionCreate(BaseModel):
    prompt: str
    options: list
    correct_index: int

class QuizSubmit(BaseModel):
    answers: dict


@app.post("/api/auth/signup")
def signup(data: SignupRequest, response: Response):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT id FROM users WHERE email = %s", (data.email.lower(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, 'learner') RETURNING id, email, full_name, role",
            (data.full_name, data.email.lower(), hashed)
        )
        user = dict(cur.fetchone())
        
        token = secrets.token_urlsafe(48)
        cur.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user["id"], token, datetime.utcnow() + timedelta(days=30))
        )
        conn.commit()
        
        response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=30*24*3600)
        return {"user": user}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/auth/login")
def login(data: LoginRequest, response: Response):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT id, email, full_name, role, password_hash FROM users WHERE email = %s", (data.email.lower(),))
        user = cur.fetchone()
        if not user or not bcrypt.checkpw(data.password.encode(), user["password_hash"].encode()):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        token = secrets.token_urlsafe(48)
        cur.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user["id"], token, datetime.utcnow() + timedelta(days=30))
        )
        conn.commit()
        
        user_data = {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}
        response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=30*24*3600)
        return {"user": user_data}
    except HTTPException:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("DELETE FROM sessions WHERE token = %s", (token,))
        conn.commit()
        conn.close()
    response.delete_cookie("session_token")
    return {"ok": True}


@app.get("/api/auth/me")
def me(request: Request):
    user = get_current_user(request)
    if not user:
        return {"user": None}
    return {"user": user}


@app.get("/api/courses")
def list_courses(request: Request):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT c.*, u.full_name as instructor_name 
        FROM courses c 
        JOIN users u ON c.instructor_id = u.id 
        WHERE c.published = true 
        ORDER BY c.created_at DESC
    """)
    courses = [dict(r) for r in cur.fetchall()]
    for c in courses:
        if c.get("created_at"):
            c["created_at"] = c["created_at"].isoformat()
    conn.close()
    return {"courses": courses}


@app.get("/api/courses/{course_id}")
def get_course(course_id: int, request: Request):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT c.*, u.full_name as instructor_name 
        FROM courses c 
        JOIN users u ON c.instructor_id = u.id 
        WHERE c.id = %s
    """, (course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")
    course = dict(course)
    if course.get("created_at"):
        course["created_at"] = course["created_at"].isoformat()
    
    cur.execute("SELECT * FROM lessons WHERE course_id = %s ORDER BY order_index", (course_id,))
    lessons = [dict(r) for r in cur.fetchall()]
    
    user = get_current_user(request, conn)
    enrolled = False
    progress = 0
    if user:
        cur.execute("SELECT * FROM enrollments WHERE user_id = %s AND course_id = %s", (user["id"], course_id))
        enrollment = cur.fetchone()
        if enrollment:
            enrolled = True
            progress = dict(enrollment).get("progress_pct", 0)
    
    conn.close()
    return {"course": course, "lessons": lessons, "enrolled": enrolled, "progress": progress}


@app.post("/api/courses/{course_id}/enroll")
def enroll(course_id: int, request: Request):
    user = require_auth(request)
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT id FROM enrollments WHERE user_id = %s AND course_id = %s", (user["id"], course_id))
        if cur.fetchone():
            conn.close()
            return {"ok": True, "message": "Already enrolled"}
        cur.execute(
            "INSERT INTO enrollments (user_id, course_id, status, progress_pct) VALUES (%s, %s, 'active', 0) RETURNING id",
            (user["id"], course_id)
        )
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/my-courses")
def my_courses(request: Request):
    user = require_auth(request)
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT c.*, e.progress_pct, e.status as enrollment_status, e.last_lesson_id, u.full_name as instructor_name
        FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        JOIN users u ON c.instructor_id = u.id
        WHERE e.user_id = %s 
        ORDER BY e.created_at DESC
    """, (user["id"],))
    courses = [dict(r) for r in cur.fetchall()]
    for c in courses:
        if c.get("created_at"):
            c["created_at"] = c["created_at"].isoformat()
    conn.close()
    return {"courses": courses}


@app.get("/api/learn/{course_id}/{lesson_id}")
def get_lesson(course_id: int, lesson_id: int, request: Request):
    user = require_auth(request)
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cur.execute("SELECT id FROM enrollments WHERE user_id = %s AND course_id = %s", (user["id"], course_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    cur.execute("SELECT * FROM lessons WHERE id = %s AND course_id = %s", (lesson_id, course_id))
    lesson = cur.fetchone()
    if not lesson:
        conn.close()
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson = dict(lesson)
    
    cur.execute("SELECT * FROM lessons WHERE course_id = %s ORDER BY order_index", (course_id,))
    all_lessons = [dict(r) for r in cur.fetchall()]
    
    cur.execute("SELECT lesson_id, status FROM lesson_progress WHERE user_id = %s AND lesson_id IN (SELECT id FROM lessons WHERE course_id = %s)", (user["id"], course_id))
    progress_map = {r["lesson_id"]: r["status"] for r in cur.fetchall()}
    
    quiz = None
    if lesson["lesson_type"] == "quiz":
        cur.execute("SELECT * FROM quizzes WHERE lesson_id = %s", (lesson_id,))
        q = cur.fetchone()
        if q:
            quiz = dict(q)
            cur.execute("SELECT id, prompt, options FROM quiz_questions WHERE quiz_id = %s ORDER BY id", (quiz["id"],))
            quiz["questions"] = [dict(r) for r in cur.fetchall()]
    
    conn.close()
    return {"lesson": lesson, "all_lessons": all_lessons, "progress": progress_map, "quiz": quiz}


@app.post("/api/learn/{course_id}/{lesson_id}/complete")
def complete_lesson(course_id: int, lesson_id: int, request: Request):
    user = require_auth(request)
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT id FROM enrollments WHERE user_id = %s AND course_id = %s", (user["id"], course_id))
        enrollment = cur.fetchone()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled")
        
        cur.execute("SELECT id FROM lesson_progress WHERE user_id = %s AND lesson_id = %s", (user["id"], lesson_id))
        if cur.fetchone():
            cur.execute("UPDATE lesson_progress SET status = 'completed', completed_at = NOW() WHERE user_id = %s AND lesson_id = %s", (user["id"], lesson_id))
        else:
            cur.execute("INSERT INTO lesson_progress (user_id, lesson_id, enrollment_id, status, completed_at) VALUES (%s, %s, %s, 'completed', NOW())", (user["id"], lesson_id, enrollment["id"]))
        
        cur.execute("SELECT COUNT(*) as total FROM lessons WHERE course_id = %s", (course_id,))
        total = cur.fetchone()["total"]
        cur.execute("SELECT COUNT(*) as done FROM lesson_progress WHERE user_id = %s AND status = 'completed' AND lesson_id IN (SELECT id FROM lessons WHERE course_id = %s)", (user["id"], course_id))
        done = cur.fetchone()["done"]
        
        pct = int((done / total) * 100) if total > 0 else 0
        status = "completed" if pct == 100 else "active"
        cur.execute("UPDATE enrollments SET progress_pct = %s, last_lesson_id = %s, status = %s WHERE user_id = %s AND course_id = %s", (pct, lesson_id, status, user["id"], course_id))
        
        conn.commit()
        return {"ok": True, "progress_pct": pct}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: int, data: QuizSubmit, request: Request):
    user = require_auth(request)
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT * FROM quizzes WHERE id = %s", (quiz_id,))
        quiz = cur.fetchone()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        quiz = dict(quiz)
        
        cur.execute("SELECT id, correct_index FROM quiz_questions WHERE quiz_id = %s", (quiz_id,))
        questions = cur.fetchall()
        
        correct = 0
        total = len(questions)
        for q in questions:
            qid = str(q["id"])
            if qid in data.answers and data.answers[qid] == q["correct_index"]:
                correct += 1
        
        score = int((correct / total) * 100) if total > 0 else 0
        passed = score >= quiz["pass_score"]
        
        cur.execute(
            "INSERT INTO quiz_attempts (user_id, quiz_id, score, passed) VALUES (%s, %s, %s, %s) RETURNING id",
            (user["id"], quiz_id, score, passed)
        )
        conn.commit()
        return {"score": score, "passed": passed, "correct": correct, "total": total}
    except HTTPException:
        conn.rollback()
        raise
    finally:
        conn.close()


# INSTRUCTOR ENDPOINTS
@app.get("/api/instructor/courses")
def instructor_courses(request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM courses WHERE instructor_id = %s ORDER BY created_at DESC", (user["id"],))
    courses = [dict(r) for r in cur.fetchall()]
    for c in courses:
        if c.get("created_at"):
            c["created_at"] = c["created_at"].isoformat()
        cur.execute("SELECT COUNT(*) as cnt FROM enrollments WHERE course_id = %s", (c["id"],))
        c["enrollment_count"] = cur.fetchone()["cnt"]
    conn.close()
    return {"courses": courses}


@app.post("/api/instructor/courses")
def create_course(data: CourseCreate, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO courses (instructor_id, title, short_description, full_description, image_url, tags, visibility, access, price, published)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (user["id"], data.title, data.short_description, sanitize_html(data.full_description), data.image_url, data.tags, data.visibility, data.access, data.price, data.published))
        course = dict(cur.fetchone())
        if course.get("created_at"):
            course["created_at"] = course["created_at"].isoformat()
        conn.commit()
        return {"course": course}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.put("/api/instructor/courses/{course_id}")
def update_course(course_id: int, data: CourseCreate, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT instructor_id FROM courses WHERE id = %s", (course_id,))
        course = cur.fetchone()
        if not course or (course["instructor_id"] != user["id"] and user["role"] != "admin"):
            raise HTTPException(status_code=403, detail="Not authorized")
        
        cur.execute("""
            UPDATE courses SET title=%s, short_description=%s, full_description=%s, image_url=%s, tags=%s, visibility=%s, access=%s, price=%s, published=%s
            WHERE id=%s RETURNING *
        """, (data.title, data.short_description, sanitize_html(data.full_description), data.image_url, data.tags, data.visibility, data.access, data.price, data.published, course_id))
        updated = dict(cur.fetchone())
        if updated.get("created_at"):
            updated["created_at"] = updated["created_at"].isoformat()
        conn.commit()
        return {"course": updated}
    except HTTPException:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.delete("/api/instructor/courses/{course_id}")
def delete_course(course_id: int, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM courses WHERE id = %s AND (instructor_id = %s OR %s = 'admin')", (course_id, user["id"], user["role"]))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/instructor/courses/{course_id}/lessons")
def get_course_lessons(course_id: int, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM lessons WHERE course_id = %s ORDER BY order_index", (course_id,))
    lessons = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"lessons": lessons}


@app.post("/api/instructor/courses/{course_id}/lessons")
def create_lesson(course_id: int, data: LessonCreate, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT MAX(order_index) as mx FROM lessons WHERE course_id = %s", (course_id,))
        mx = cur.fetchone()["mx"] or 0
        order = data.order_index if data.order_index > 0 else mx + 1
        
        cur.execute("""
            INSERT INTO lessons (course_id, title, lesson_type, content, duration, order_index)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
        """, (course_id, data.title, data.lesson_type, sanitize_html(data.content), data.duration, order))
        lesson = dict(cur.fetchone())
        conn.commit()
        return {"lesson": lesson}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.put("/api/instructor/lessons/{lesson_id}")
def update_lesson(lesson_id: int, data: LessonCreate, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            UPDATE lessons SET title=%s, lesson_type=%s, content=%s, duration=%s, order_index=%s
            WHERE id=%s RETURNING *
        """, (data.title, data.lesson_type, sanitize_html(data.content), data.duration, data.order_index, lesson_id))
        lesson = cur.fetchone()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        conn.commit()
        return {"lesson": dict(lesson)}
    except HTTPException:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.delete("/api/instructor/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM lessons WHERE id = %s", (lesson_id,))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/instructor/lessons/{lesson_id}/quiz")
def create_quiz(lesson_id: int, data: QuizCreate, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("UPDATE lessons SET lesson_type = 'quiz' WHERE id = %s", (lesson_id,))
        cur.execute("DELETE FROM quizzes WHERE lesson_id = %s", (lesson_id,))
        cur.execute("""
            INSERT INTO quizzes (lesson_id, title, timer_seconds, pass_score)
            VALUES (%s, %s, %s, %s) RETURNING *
        """, (lesson_id, data.title, data.timer_seconds, data.pass_score))
        quiz = dict(cur.fetchone())
        conn.commit()
        return {"quiz": quiz}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/instructor/quizzes/{quiz_id}/questions")
def add_question(quiz_id: int, data: QuestionCreate, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO quiz_questions (quiz_id, prompt, options, correct_index)
            VALUES (%s, %s, %s, %s) RETURNING *
        """, (quiz_id, data.prompt, json.dumps(data.options), data.correct_index))
        question = dict(cur.fetchone())
        if isinstance(question.get("options"), str):
            question["options"] = json.loads(question["options"])
        conn.commit()
        return {"question": question}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/instructor/courses/{course_id}/students")
def get_students(course_id: int, request: Request):
    user = require_role(request, ["instructor", "admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT u.id, u.full_name, u.email, e.progress_pct, e.status, e.created_at
        FROM enrollments e JOIN users u ON e.user_id = u.id
        WHERE e.course_id = %s ORDER BY e.created_at DESC
    """, (course_id,))
    students = [dict(r) for r in cur.fetchall()]
    for s in students:
        if s.get("created_at"):
            s["created_at"] = s["created_at"].isoformat()
    conn.close()
    return {"students": students}


# ADMIN ENDPOINTS
@app.get("/api/admin/users")
def admin_users(request: Request):
    user = require_role(request, ["admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC")
    users = [dict(r) for r in cur.fetchall()]
    for u in users:
        if u.get("created_at"):
            u["created_at"] = u["created_at"].isoformat()
    conn.close()
    return {"users": users}


@app.patch("/api/admin/users/{user_id}/role")
def update_role(user_id: int, request: Request):
    import json as j
    admin = require_role(request, ["admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        import asyncio
        body_bytes = None
        
        content_type = request.headers.get("content-type", "")
        return _update_role_sync(user_id, admin, conn, cur)
    except HTTPException:
        conn.rollback()
        raise
    finally:
        conn.close()

def _update_role_sync(user_id, admin, conn, cur):
    raise HTTPException(status_code=400, detail="Use the dedicated endpoint")


@app.post("/api/admin/users/{user_id}/role")
def update_role_post(user_id: int, request: Request):
    admin = require_role(request, ["admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return {"ok": True}


class RoleUpdate(BaseModel):
    role: str

@app.put("/api/admin/users/{user_id}/role")
def update_user_role(user_id: int, data: RoleUpdate, request: Request):
    admin = require_role(request, ["admin"])
    if data.role not in ["learner", "instructor", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("UPDATE users SET role = %s WHERE id = %s RETURNING id, full_name, email, role", (data.role, user_id))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        conn.commit()
        return {"user": dict(user)}
    except HTTPException:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.get("/api/admin/courses")
def admin_courses(request: Request):
    admin = require_role(request, ["admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT c.*, u.full_name as instructor_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
        FROM courses c JOIN users u ON c.instructor_id = u.id
        ORDER BY c.created_at DESC
    """)
    courses = [dict(r) for r in cur.fetchall()]
    for c in courses:
        if c.get("created_at"):
            c["created_at"] = c["created_at"].isoformat()
    conn.close()
    return {"courses": courses}


class CourseDisable(BaseModel):
    published: bool

@app.put("/api/admin/courses/{course_id}/toggle")
def toggle_course(course_id: int, data: CourseDisable, request: Request):
    admin = require_role(request, ["admin"])
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    try:
        cur.execute("UPDATE courses SET published = %s WHERE id = %s", (data.published, course_id))
        conn.commit()
        return {"ok": True}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
