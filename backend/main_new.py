"""
LearnSphere Backend - Complete Implementation with All Features
"""
import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client, Client
import json

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = "https://aqrlbobkgsrklyyuvcuf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmxib2JrZ3Nya2x5eXV2Y3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzMxMDksImV4cCI6MjA4NjA0OTEwOX0.3ElshxBiStMxpnUdXGEhw8z5z20zluTbTQi6lDsiP-A"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================
# PYDANTIC MODELS
# ============================================================

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = "learner"

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "learner"

class CourseCreate(BaseModel):
    title: str
    subject_name: Optional[str] = ""
    tagline: Optional[str] = ""
    short_description: Optional[str] = ""
    full_description: Optional[str] = ""
    image_url: Optional[str] = ""
    video_url: Optional[str] = ""
    audio_url: Optional[str] = ""
    tags: Optional[str] = ""
    published: bool = False

class LessonCreate(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = ""
    content: Optional[str] = ""
    video_url: Optional[str] = ""
    audio_url: Optional[str] = ""
    image_url: Optional[str] = ""
    duration: int = 0
    order_index: int = 0
    lesson_type: str = "video"

class MessageCreate(BaseModel):
    recipient_id: int
    course_id: Optional[int] = None
    message: str
    message_type: str = "general"

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        return None
    
    try:
        result = supabase.table("sessions").select("*, users(*)").eq("token", token).gt("expires_at", datetime.now(timezone.utc).isoformat()).execute()
        if result.data and len(result.data) > 0:
            session = result.data[0]
            user = session.get("users")
            if user:
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "is_approved": user.get("is_approved", True)
                }
    except:
        pass
    
    return None

def require_auth(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

def require_admin(request: Request):
    user = require_auth(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_instructor(request: Request):
    user = require_auth(request)
    if user["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Instructor access required")
    if not user.get("is_approved", False):
        raise HTTPException(status_code=403, detail="Your account is pending admin approval")
    return user

# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {"message": "LearnSphere API - Complete Version", "version": "2.0"}

@app.get("/api/auth/me")
def me(request: Request):
    user = get_current_user(request)
    return {"user": user}

@app.post("/api/auth/login")
async def login(data: LoginRequest, response: Response, request: Request):
    try:
        # Get user
        result = supabase.table("users").select("*").eq("email", data.email.lower()).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = result.data[0]
        
        # Verify password
        if not bcrypt.checkpw(data.password.encode(), user['password_hash'].encode()):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if instructor is approved
        if user['role'] == 'instructor' and not user.get('is_approved', False):
            raise HTTPException(status_code=403, detail="Your account is pending admin approval. Please contact the administrator.")
        
        # Log instructor login
        if user['role'] == 'instructor':
            try:
                supabase.table("instructor_login_logs").insert({
                    "instructor_id": user['id'],
                    "login_time": datetime.now(timezone.utc).isoformat(),
                    "ip_address": request.client.host if request.client else "unknown",
                    "user_agent": request.headers.get("user-agent", "unknown")
                }).execute()
            except:
                pass  # Don't fail login if logging fails
        
        # Create session
        token = secrets.token_urlsafe(48)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        
        supabase.table("sessions").insert({
            "user_id": user['id'],
            "token": token,
            "expires_at": expires_at
        }).execute()
        
        user_data = {
            "id": user['id'],
            "email": user['email'],
            "full_name": user['full_name'],
            "role": user['role'],
            "is_approved": user.get('is_approved', True)
        }
        
        response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=30*24*3600)
        return {"user": user_data}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/signup")
def signup(data: SignupRequest, response: Response):
    try:
        # Validate role
        if data.role not in ['learner', 'instructor', 'admin']:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Check if email already exists
        existing = supabase.table("users").select("id").eq("email", data.email.lower()).execute()
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
        
        # Create user (instructors need approval)
        user_data = {
            "full_name": data.full_name,
            "email": data.email.lower(),
            "password_hash": password_hash,
            "role": data.role,
            "is_approved": True if data.role != 'instructor' else False
        }
        
        result = supabase.table("users").insert(user_data).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        user = result.data[0]
        
        # Create session
        token = secrets.token_urlsafe(48)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        
        supabase.table("sessions").insert({
            "user_id": user['id'],
            "token": token,
            "expires_at": expires_at
        }).execute()
        
        user_data = {
            "id": user['id'],
            "email": user['email'],
            "full_name": user['full_name'],
            "role": user['role'],
            "is_approved": user.get('is_approved', False)
        }
        
        response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=30*24*3600)
        return {"user": user_data, "message": "Account created successfully" + (" - Pending admin approval" if data.role == 'instructor' else "")}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        try:
            supabase.table("sessions").delete().eq("token", token).execute()
        except:
            pass
    response.delete_cookie("session_token")
    return {"ok": True}

# ============================================================
# ADMIN ENDPOINTS - User Management
# ============================================================

@app.get("/api/admin/users")
def get_admin_users_legacy(request: Request):
    """Legacy endpoint - redirects to /all"""
    return get_all_users_with_enrollments(request)

@app.get("/api/admin/users/all")
def get_all_users_with_enrollments(request: Request):
    """Get all users with their enrollment counts"""
    admin = require_admin(request)
    
    try:
        # Get all users
        users_result = supabase.table("users").select("id, full_name, email, role, is_approved, created_at").order("created_at", desc=True).execute()
        
        users = []
        for user in users_result.data:
            # Count enrollments for each user
            enrollments_count = 0
            if user['role'] == 'learner':
                try:
                    enroll_result = supabase.table("enrollments").select("id").eq("user_id", user['id']).execute()
                    enrollments_count = len(enroll_result.data) if enroll_result.data else 0
                except:
                    enrollments_count = 0
            
            user_dict = dict(user)
            user_dict['enrollment_count'] = enrollments_count
            users.append(user_dict)
        
        return {"users": users}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users/{user_id}/enrollments")
def get_user_enrollments(user_id: int, request: Request):
    """Get detailed enrollment information for a specific user"""
    admin = require_admin(request)
    
    try:
        result = supabase.table("enrollments").select("*, courses(id, title, instructor_id, users(full_name))").eq("user_id", user_id).execute()
        
        enrollments = []
        for enrollment in result.data:
            e = dict(enrollment)
            if 'courses' in e and e['courses']:
                course = e['courses']
                e['course_title'] = course['title']
                e['instructor_name'] = course['users']['full_name'] if 'users' in course and course['users'] else 'Unknown'
                del e['courses']
            enrollments.append(e)
        
        return {"enrollments": enrollments}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# ADMIN ENDPOINTS - Course Management
# ============================================================

@app.get("/api/admin/courses")
def get_admin_courses_legacy(request: Request):
    """Legacy endpoint - redirects to /all"""
    return get_all_courses_admin(request)

@app.get("/api/admin/courses/all")
def get_all_courses_admin(request: Request):
    """Get all courses with full details for admin"""
    admin = require_admin(request)
    
    try:
        result = supabase.table("courses").select("*, users(full_name, email)").order("created_at", desc=True).execute()
        
        courses = []
        for course in result.data:
            c = dict(course)
            if 'users' in c and c['users']:
                c['instructor_name'] = c['users']['full_name']
                c['instructor_email'] = c['users']['email']
                del c['users']
            
            # Count lessons - use len() instead of count
            try:
                lessons_result = supabase.table("lessons").select("id").eq("course_id", c['id']).execute()
                c['lesson_count'] = len(lessons_result.data) if lessons_result.data else 0
            except:
                c['lesson_count'] = 0
            
            # Count enrollments - use len() instead of count
            try:
                enroll_result = supabase.table("enrollments").select("id").eq("course_id", c['id']).execute()
                c['enrollment_count'] = len(enroll_result.data) if enroll_result.data else 0
            except:
                c['enrollment_count'] = 0
            
            courses.append(c)
        
        return {"courses": courses}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/courses/{course_id}/full")
def get_course_full_details(course_id: int, request: Request):
    """Get complete course details including lessons"""
    admin = require_admin(request)
    
    try:
        # Get course
        course_result = supabase.table("courses").select("*, users(full_name, email)").eq("id", course_id).execute()
        
        if not course_result.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course = dict(course_result.data[0])
        if 'users' in course and course['users']:
            course['instructor_name'] = course['users']['full_name']
            course['instructor_email'] = course['users']['email']
            del course['users']
        
        # Get lessons
        lessons_result = supabase.table("lessons").select("*").eq("course_id", course_id).order("order_index").execute()
        course['lessons'] = lessons_result.data
        
        # Get enrollments
        enroll_result = supabase.table("enrollments").select("*, users(full_name, email)").eq("course_id", course_id).execute()
        course['enrollments'] = enroll_result.data
        
        return {"course": course}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/courses/{course_id}")
async def admin_update_course(course_id: int, request: Request):
    """Admin can edit any course"""
    admin = require_admin(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        # Update course
        supabase.table("courses").update(data).eq("id", course_id).execute()
        
        return {"ok": True, "message": "Course updated successfully"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/courses/{course_id}")
def admin_delete_course(course_id: int, request: Request):
    """Admin can delete any course"""
    admin = require_admin(request)
    
    try:
        supabase.table("courses").delete().eq("id", course_id).execute()
        return {"ok": True, "message": "Course deleted successfully"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/courses/{course_id}/toggle")
async def admin_toggle_course(course_id: int, request: Request):
    """Admin can activate/deactivate any course"""
    admin = require_admin(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        published = data.get('published', False)
        
        # Update course published status
        supabase.table("courses").update({"published": published}).eq("id", course_id).execute()
        
        return {"ok": True, "message": f"Course {'activated' if published else 'deactivated'} successfully"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# ADMIN ENDPOINTS - Instructor Management
# ============================================================

@app.get("/api/admin/instructors")
def get_all_instructors(request: Request):
    """Get all instructors with their approval status"""
    admin = require_admin(request)
    
    try:
        result = supabase.table("users").select("id, full_name, email, is_approved, created_at").eq("role", "instructor").order("created_at", desc=True).execute()
        
        instructors = []
        for instructor in result.data:
            i = dict(instructor)
            
            # Count courses - use len() instead of count
            try:
                courses_result = supabase.table("courses").select("id").eq("instructor_id", i['id']).execute()
                i['course_count'] = len(courses_result.data) if courses_result.data else 0
            except:
                i['course_count'] = 0
            
            instructors.append(i)
        
        return {"instructors": instructors}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/instructors/{instructor_id}/approve")
async def approve_instructor(instructor_id: int, request: Request):
    """Approve or deny instructor access"""
    admin = require_admin(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        is_approved = data.get('is_approved', False)
        
        supabase.table("users").update({"is_approved": is_approved}).eq("id", instructor_id).execute()
        
        # Create notification for instructor
        message = "Your account has been approved! You can now create courses." if is_approved else "Your account approval has been revoked."
        supabase.table("notifications").insert({
            "user_id": instructor_id,
            "title": "Account Status Updated",
            "message": message,
            "notification_type": "success" if is_approved else "warning"
        }).execute()
        
        return {"ok": True, "message": f"Instructor {'approved' if is_approved else 'denied'} successfully"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# ADMIN ENDPOINTS - Messaging
# ============================================================

@app.post("/api/admin/messages/send")
async def admin_send_message(request: Request):
    """Admin sends message to instructor"""
    admin = require_admin(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        message_data = {
            "admin_id": admin['id'],
            "instructor_id": data['instructor_id'],
            "course_id": data.get('course_id'),
            "message": data['message'],
            "message_type": data.get('message_type', 'general')
        }
        
        supabase.table("admin_messages").insert(message_data).execute()
        
        # Create notification for instructor
        supabase.table("notifications").insert({
            "user_id": data['instructor_id'],
            "title": "New Message from Admin",
            "message": data['message'][:100] + "..." if len(data['message']) > 100 else data['message'],
            "notification_type": "info",
            "link_url": "/instructor/messages"
        }).execute()
        
        return {"ok": True, "message": "Message sent successfully"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/messages/received")
def admin_get_messages(request: Request):
    """Get all messages for admin (sent and received)"""
    admin = require_admin(request)
    
    try:
        # Get messages FROM instructors TO admin
        received_result = supabase.table("instructor_messages").select("*, users!instructor_messages_instructor_id_fkey(full_name, email), courses(title)").eq("admin_id", admin['id']).order("created_at", desc=True).execute()
        
        received_messages = []
        for msg in received_result.data:
            message_dict = dict(msg)
            if 'users' in message_dict and message_dict['users']:
                message_dict['instructor_name'] = message_dict['users']['full_name']
                del message_dict['users']
            if 'courses' in message_dict and message_dict['courses']:
                message_dict['course_title'] = message_dict['courses']['title']
                del message_dict['courses']
            message_dict['from_admin'] = False
            received_messages.append(message_dict)
        
        # Get messages FROM admin TO instructors
        sent_result = supabase.table("admin_messages").select("*, users!admin_messages_instructor_id_fkey(full_name, email)").eq("admin_id", admin['id']).order("created_at", desc=True).execute()
        
        sent_messages = []
        for msg in sent_result.data:
            message_dict = dict(msg)
            if 'users' in message_dict and message_dict['users']:
                message_dict['instructor_name'] = message_dict['users']['full_name']
                del message_dict['users']
            message_dict['from_admin'] = True
            sent_messages.append(message_dict)
        
        # Combine both lists
        all_messages = received_messages + sent_messages
        # Sort by created_at
        all_messages.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {"messages": all_messages}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/messages/{message_id}/read")
def admin_mark_message_read(message_id: int, request: Request):
    """Mark instructor message as read"""
    admin = require_admin(request)
    
    try:
        supabase.table("instructor_messages").update({"is_read": True}).eq("id", message_id).execute()
        return {"ok": True}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/instructor-logins")
def get_instructor_logins(request: Request):
    """Get instructor login logs"""
    admin = require_admin(request)
    
    try:
        result = supabase.table("instructor_login_logs").select("*, users(full_name, email)").order("login_time", desc=True).limit(100).execute()
        
        logs = []
        for log in result.data:
            l = dict(log)
            if 'users' in l and l['users']:
                l['instructor_name'] = l['users']['full_name']
                l['instructor_email'] = l['users']['email']
                del l['users']
            logs.append(l)
        
        return {"logs": logs}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# ADMIN ENDPOINTS - Settings
# ============================================================

@app.get("/api/admin/settings")
def get_admin_settings(request: Request):
    """Get admin settings"""
    admin = require_admin(request)
    
    try:
        result = supabase.table("admin_settings").select("*").eq("admin_id", admin['id']).execute()
        
        if result.data and len(result.data) > 0:
            return {"settings": result.data[0]}
        else:
            # Create default settings
            default_settings = {
                "admin_id": admin['id'],
                "theme": "light",
                "settings": {}
            }
            supabase.table("admin_settings").insert(default_settings).execute()
            return {"settings": default_settings}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/settings")
async def update_admin_settings(request: Request):
    """Update admin settings"""
    admin = require_admin(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        # Check if settings exist
        result = supabase.table("admin_settings").select("id").eq("admin_id", admin['id']).execute()
        
        if result.data and len(result.data) > 0:
            # Update existing
            supabase.table("admin_settings").update(data).eq("admin_id", admin['id']).execute()
        else:
            # Create new
            data['admin_id'] = admin['id']
            supabase.table("admin_settings").insert(data).execute()
        
        return {"ok": True, "message": "Settings updated successfully"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# INSTRUCTOR ENDPOINTS - Status & Courses
# ============================================================

@app.get("/api/instructor/status")
def check_instructor_status(request: Request):
    """Check if instructor is approved"""
    user = require_auth(request)
    
    if user['role'] != 'instructor':
        raise HTTPException(status_code=403, detail="Not an instructor")
    
    return {
        "is_approved": user.get('is_approved', False),
        "message": "Approved" if user.get('is_approved', False) else "Pending admin approval"
    }

@app.get("/api/instructor/courses")
def get_instructor_courses(request: Request):
    """Get courses created by the logged-in instructor"""
    instructor = require_instructor(request)
    
    try:
        result = supabase.table("courses").select("*").eq("instructor_id", instructor["id"]).order("created_at", desc=True).execute()
        
        courses = []
        for course in result.data:
            c = dict(course)
            c['instructor_name'] = instructor['full_name']
            
            # Count lessons - use len() instead of count
            try:
                lessons_result = supabase.table("lessons").select("id").eq("course_id", c['id']).execute()
                c['lesson_count'] = len(lessons_result.data) if lessons_result.data else 0
            except:
                c['lesson_count'] = 0
            
            # Count enrollments - use len() instead of count
            try:
                enroll_result = supabase.table("enrollments").select("id").eq("course_id", c['id']).execute()
                c['enrollment_count'] = len(enroll_result.data) if enroll_result.data else 0
            except:
                c['enrollment_count'] = 0
            
            courses.append(c)
        
        return {"courses": courses}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/instructor/courses")
async def create_course(request: Request):
    """Create a new course"""
    instructor = require_instructor(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        # Extract lessons if provided
        lessons_data = data.pop("lessons", [])
        
        course_data = {
            "instructor_id": instructor["id"],
            "title": data.get("title", ""),
            "subject_name": data.get("subject_name", ""),
            "tagline": data.get("tagline", ""),
            "short_description": data.get("short_description", ""),
            "full_description": data.get("full_description", ""),
            "image_url": data.get("image_url", ""),
            "video_url": data.get("video_url", ""),
            "audio_url": data.get("audio_url", ""),
            "tags": data.get("tags", ""),
            "visibility": data.get("visibility", "public"),
            "access": data.get("access", "free"),
            "price": data.get("price", 0),
            "published": data.get("published", False)
        }
        
        result = supabase.table("courses").insert(course_data).execute()
        
        if result.data and len(result.data) > 0:
            course = result.data[0]
            course_id = course['id']
            
            # Create lessons if provided
            if lessons_data:
                for lesson in lessons_data:
                    lesson_data = {
                        "course_id": course_id,
                        "title": lesson.get("title", ""),
                        "description": lesson.get("description", ""),
                        "content": lesson.get("content", ""),
                        "video_url": lesson.get("video_url", ""),
                        "content_type": lesson.get("content_type", "video"),
                        "duration": lesson.get("duration", 0),
                        "order_index": lesson.get("order_index", 0)
                    }
                    supabase.table("lessons").insert(lesson_data).execute()
            
            return {"ok": True, "course": course, "message": f"Course created with {len(lessons_data)} lessons"}
        else:
            raise HTTPException(status_code=500, detail="Failed to create course")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating course: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/instructor/courses/{course_id}")
def get_instructor_course(course_id: int, request: Request):
    """Get a specific course with lessons"""
    instructor = require_instructor(request)
    
    try:
        # Get course
        result = supabase.table("courses").select("*").eq("id", course_id).eq("instructor_id", instructor["id"]).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course = dict(result.data[0])
        course['instructor_name'] = instructor['full_name']
        
        # Get lessons
        lessons_result = supabase.table("lessons").select("*").eq("course_id", course_id).order("order_index").execute()
        course['lessons'] = lessons_result.data
        
        return {"course": course}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/instructor/courses/{course_id}")
async def update_course(course_id: int, request: Request):
    """Update a course"""
    instructor = require_instructor(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        # Verify ownership
        check = supabase.table("courses").select("id").eq("id", course_id).eq("instructor_id", instructor["id"]).execute()
        if not check.data or len(check.data) == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Extract lessons if provided
        lessons_data = data.pop("lessons", None)
        
        # Update course (only course fields, not lessons)
        course_update = {
            "title": data.get("title"),
            "subject_name": data.get("subject_name"),
            "tagline": data.get("tagline"),
            "short_description": data.get("short_description"),
            "full_description": data.get("full_description"),
            "image_url": data.get("image_url"),
            "video_url": data.get("video_url"),
            "audio_url": data.get("audio_url"),
            "tags": data.get("tags"),
            "visibility": data.get("visibility"),
            "access": data.get("access"),
            "price": data.get("price"),
            "published": data.get("published")
        }
        
        # Remove None values
        course_update = {k: v for k, v in course_update.items() if v is not None}
        
        supabase.table("courses").update(course_update).eq("id", course_id).execute()
        
        # Handle lessons if provided
        if lessons_data is not None:
            # Delete existing lessons
            supabase.table("lessons").delete().eq("course_id", course_id).execute()
            
            # Create new lessons
            for lesson in lessons_data:
                lesson_data = {
                    "course_id": course_id,
                    "title": lesson.get("title", ""),
                    "description": lesson.get("description", ""),
                    "content": lesson.get("content", ""),
                    "video_url": lesson.get("video_url", ""),
                    "content_type": lesson.get("content_type", "video"),
                    "duration": lesson.get("duration", 0),
                    "order_index": lesson.get("order_index", 0)
                }
                supabase.table("lessons").insert(lesson_data).execute()
        
        return {"ok": True, "message": f"Course updated with {len(lessons_data) if lessons_data else 0} lessons"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/instructor/courses/{course_id}")
def delete_course(course_id: int, request: Request):
    """Delete a course"""
    instructor = require_instructor(request)
    
    try:
        # Verify ownership
        check = supabase.table("courses").select("id").eq("id", course_id).eq("instructor_id", instructor["id"]).execute()
        if not check.data or len(check.data) == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        supabase.table("courses").delete().eq("id", course_id).execute()
        
        return {"ok": True, "message": "Course deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/instructor/courses/{course_id}/toggle")
async def instructor_toggle_course(course_id: int, request: Request):
    """Instructor can activate/deactivate their own course"""
    instructor = require_instructor(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        published = data.get('published', False)
        
        # Verify ownership
        check = supabase.table("courses").select("id").eq("id", course_id).eq("instructor_id", instructor["id"]).execute()
        if not check.data or len(check.data) == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Update course published status
        supabase.table("courses").update({"published": published}).eq("id", course_id).execute()
        
        return {"ok": True, "message": f"Course {'activated' if published else 'deactivated'} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# INSTRUCTOR ENDPOINTS - Lessons
# ============================================================

@app.post("/api/instructor/lessons")
async def create_lesson(request: Request):
    """Add lesson to course"""
    instructor = require_instructor(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        # Verify course ownership
        course_check = supabase.table("courses").select("id").eq("id", data['course_id']).eq("instructor_id", instructor["id"]).execute()
        if not course_check.data:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        lesson_data = {
            "course_id": data['course_id'],
            "title": data['title'],
            "description": data.get('description', ''),
            "content": data.get('content', ''),
            "video_url": data.get('video_url', ''),
            "audio_url": data.get('audio_url', ''),
            "image_url": data.get('image_url', ''),
            "duration": data.get('duration', 0),
            "order_index": data.get('order_index', 0),
            "lesson_type": data.get('lesson_type', 'video')
        }
        
        result = supabase.table("lessons").insert(lesson_data).execute()
        
        return {"ok": True, "lesson": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/instructor/lessons/{lesson_id}")
async def update_lesson(lesson_id: int, request: Request):
    """Update lesson"""
    instructor = require_instructor(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        # Verify ownership through course
        lesson_check = supabase.table("lessons").select("course_id").eq("id", lesson_id).execute()
        if not lesson_check.data:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        course_id = lesson_check.data[0]['course_id']
        course_check = supabase.table("courses").select("id").eq("id", course_id).eq("instructor_id", instructor["id"]).execute()
        if not course_check.data:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        supabase.table("lessons").update(data).eq("id", lesson_id).execute()
        
        return {"ok": True, "message": "Lesson updated"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/instructor/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, request: Request):
    """Delete lesson"""
    instructor = require_instructor(request)
    
    try:
        # Verify ownership through course
        lesson_check = supabase.table("lessons").select("course_id").eq("id", lesson_id).execute()
        if not lesson_check.data:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        course_id = lesson_check.data[0]['course_id']
        course_check = supabase.table("courses").select("id").eq("id", course_id).eq("instructor_id", instructor["id"]).execute()
        if not course_check.data:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        supabase.table("lessons").delete().eq("id", lesson_id).execute()
        
        return {"ok": True, "message": "Lesson deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# INSTRUCTOR ENDPOINTS - Messaging
# ============================================================

@app.post("/api/instructor/messages/send")
async def instructor_send_message(request: Request):
    """Instructor sends message to admin"""
    instructor = require_instructor(request)
    
    try:
        body = await request.body()
        data = json.loads(body.decode())
        
        # Get first admin
        admin_result = supabase.table("users").select("id").eq("role", "admin").limit(1).execute()
        if not admin_result.data:
            raise HTTPException(status_code=404, detail="No admin found")
        
        admin_id = admin_result.data[0]['id']
        
        message_data = {
            "instructor_id": instructor['id'],
            "admin_id": admin_id,
            "course_id": data.get('course_id'),
            "message": data['message'],
            "message_type": data.get('message_type', 'general')
        }
        
        supabase.table("instructor_messages").insert(message_data).execute()
        
        # Create notification for admin
        supabase.table("notifications").insert({
            "user_id": admin_id,
            "title": f"New Message from {instructor['full_name']}",
            "message": data['message'][:100] + "..." if len(data['message']) > 100 else data['message'],
            "notification_type": "info",
            "link_url": "/admin/messages"
        }).execute()
        
        return {"ok": True, "message": "Message sent successfully"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/instructor/messages/received")
def instructor_get_messages(request: Request):
    """Get messages from admin"""
    instructor = require_instructor(request)
    
    try:
        result = supabase.table("admin_messages").select("*, courses(title)").eq("instructor_id", instructor['id']).order("created_at", desc=True).execute()
        
        messages = []
        for msg in result.data:
            m = dict(msg)
            if 'courses' in m and m['courses']:
                m['course_title'] = m['courses']['title']
                del m['courses']
            messages.append(m)
        
        return {"messages": messages}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/instructor/messages/{message_id}/complete")
def instructor_complete_message(message_id: int, request: Request):
    """Mark admin message as completed"""
    instructor = require_instructor(request)
    
    try:
        supabase.table("admin_messages").update({
            "is_completed": True,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", message_id).eq("instructor_id", instructor['id']).execute()
        
        return {"ok": True, "message": "Marked as completed"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# INSTRUCTOR ENDPOINTS - Notifications
# ============================================================

@app.get("/api/instructor/notifications")
def get_instructor_notifications(request: Request):
    """Get notifications for instructor"""
    instructor = require_instructor(request)
    
    try:
        result = supabase.table("notifications").select("*").eq("user_id", instructor['id']).order("created_at", desc=True).limit(50).execute()
        
        return {"notifications": result.data}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/instructor/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, request: Request):
    """Mark notification as read"""
    instructor = require_instructor(request)
    
    try:
        supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", instructor['id']).execute()
        
        return {"ok": True}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# LEARNER ENDPOINTS
# ============================================================

@app.get("/api/learner/courses")
def get_learner_courses(request: Request):
    """Get courses for learner based on visibility and enrollment"""
    try:
        user = get_current_user(request)
        
        # Get all published courses
        if user:
            # Logged in - show public + signed-in courses
            result = supabase.table("courses").select("*, users(full_name)").eq("published", True).order("created_at", desc=True).execute()
        else:
            # Not logged in - show only public courses
            result = supabase.table("courses").select("*, users(full_name)").eq("published", True).eq("visibility", "public").order("created_at", desc=True).execute()
        
        courses = []
        for course in result.data:
            c = dict(course)
            if 'users' in c and c['users']:
                c['instructor_name'] = c['users']['full_name']
                del c['users']
            
            # Check enrollment status if user is logged in
            if user:
                enrollment = supabase.table("enrollments").select("*").eq("user_id", user['id']).eq("course_id", c['id']).execute()
                if enrollment.data and len(enrollment.data) > 0:
                    c['enrolled'] = True
                    c['progress_percentage'] = enrollment.data[0].get('progress_percentage', 0)
                    c['is_paid'] = enrollment.data[0].get('is_paid', False)
                else:
                    c['enrolled'] = False
                    c['progress_percentage'] = 0
            else:
                c['enrolled'] = False
                c['progress_percentage'] = 0
            
            courses.append(c)
        
        return {"courses": courses}
    except Exception as e:
        print(f"Error: {e}")
        return {"courses": []}

@app.get("/api/learner/my-courses")
def get_my_courses(request: Request):
    """Get enrolled courses for learner"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = supabase.table("enrollments").select("*, courses(*, users(full_name))").eq("user_id", user['id']).execute()
        
        courses = []
        for enrollment in result.data:
            if 'courses' in enrollment and enrollment['courses']:
                course = dict(enrollment['courses'])
                course['progress_percentage'] = enrollment.get('progress_percentage', 0)
                course['status'] = enrollment.get('status', 'active')
                course['is_paid'] = enrollment.get('is_paid', False)
                course['enrolled_at'] = enrollment.get('enrolled_at')
                
                if 'users' in course and course['users']:
                    course['instructor_name'] = course['users']['full_name']
                    del course['users']
                
                courses.append(course)
        
        # Sort by enrolled_at if available, otherwise by id
        courses.sort(key=lambda x: x.get('enrolled_at') or '', reverse=True)
        
        return {"courses": courses}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/learner/courses/{course_id}")
def get_course_detail(course_id: int, request: Request):
    """Get course details with lessons and progress"""
    try:
        user = get_current_user(request)
        
        # Get course
        course_result = supabase.table("courses").select("*, users(full_name)").eq("id", course_id).execute()
        if not course_result.data or len(course_result.data) == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course = dict(course_result.data[0])
        if 'users' in course and course['users']:
            course['instructor_name'] = course['users']['full_name']
            del course['users']
        
        # Get lessons
        lessons_result = supabase.table("lessons").select("*").eq("course_id", course_id).order("order_index").execute()
        course['lessons'] = lessons_result.data
        course['total_lessons'] = len(lessons_result.data)
        
        # Get enrollment and progress if user is logged in
        if user:
            enrollment = supabase.table("enrollments").select("*").eq("user_id", user['id']).eq("course_id", course_id).execute()
            if enrollment.data and len(enrollment.data) > 0:
                course['enrolled'] = True
                course['progress_percentage'] = enrollment.data[0].get('progress_percentage', 0)
                course['is_paid'] = enrollment.data[0].get('is_paid', False)
                course['status'] = enrollment.data[0].get('status', 'active')
                course['completed_lessons'] = []
                course['completed_count'] = 0
            else:
                course['enrolled'] = False
                course['progress_percentage'] = 0
                course['completed_lessons'] = []
                course['completed_count'] = 0
        else:
            course['enrolled'] = False
            course['progress_percentage'] = 0
            course['completed_lessons'] = []
            course['completed_count'] = 0
        
        return {"course": course}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/learner/courses/{course_id}/enroll")
def enroll_in_course(course_id: int, request: Request):
    """Enroll learner in a course"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Check if already enrolled
        existing = supabase.table("enrollments").select("id").eq("user_id", user['id']).eq("course_id", course_id).execute()
        if existing.data and len(existing.data) > 0:
            return {"ok": True, "message": "Already enrolled"}
        
        # Get course to check if paid
        course = supabase.table("courses").select("access, price").eq("id", course_id).execute()
        if not course.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        is_paid = course.data[0]['access'] == 'free'
        
        # Create enrollment
        supabase.table("enrollments").insert({
            "user_id": user['id'],
            "course_id": course_id,
            "progress_percentage": 0,
            "status": "active",
            "is_paid": is_paid
        }).execute()
        
        return {"ok": True, "message": "Enrolled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/learner/profile")
def get_learner_profile(request: Request):
    """Get learner profile with points and badges"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Get user data
        user_data = supabase.table("users").select("*").eq("id", user['id']).execute()
        if not user_data.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        profile = dict(user_data.data[0])
        
        # Get all enrollments
        enrollments = supabase.table("enrollments").select("progress_percentage, status").eq("user_id", user['id']).execute()
        
        # Count completed courses
        completed_courses = len([e for e in enrollments.data if e.get('status') == 'completed'])
        
        # Calculate total points from user_points table
        try:
            points_result = supabase.table("user_points").select("points").eq("user_id", user['id']).execute()
            total_points = sum([p.get('points', 0) for p in points_result.data]) if points_result.data else 0
        except:
            total_points = 0
        
        # Determine badge level based on completed courses and points
        if completed_courses == 0:
            badge_level = "Newbie"
        elif completed_courses < 3:
            badge_level = "Beginner"
        elif completed_courses < 5:
            badge_level = "Intermediate"
        elif completed_courses < 10:
            badge_level = "Advanced"
        else:
            badge_level = "Master"
        
        profile['total_points'] = total_points
        profile['badge_level'] = badge_level
        profile['total_courses'] = len(enrollments.data)
        profile['completed_courses'] = completed_courses
        profile['in_progress_courses'] = len([e for e in enrollments.data if e.get('status') == 'in_progress'])
        
        return {"profile": profile}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# PUBLIC ENDPOINTS
# ============================================================

@app.get("/api/courses")
def list_courses():
    """Get all published courses"""
    try:
        result = supabase.table("courses").select("*, users(full_name)").eq("published", True).order("created_at", desc=True).execute()
        
        courses = []
        for course in result.data:
            c = dict(course)
            if 'users' in c and c['users']:
                c['instructor_name'] = c['users']['full_name']
                del c['users']
            courses.append(c)
        
        return {"courses": courses}
    except Exception as e:
        print(f"Error: {e}")
        return {"courses": []}

@app.get("/api/courses/published")
def list_published_courses():
    """Legacy endpoint - redirects to /api/courses"""
    return list_courses()

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("🚀 LearnSphere Backend - Complete Version 2.0")
    print("=" * 70)
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ============================================================
# LESSON PROGRESS ENDPOINTS
# ============================================================

@app.post("/api/learner/lessons/{lesson_id}/start")
def start_lesson(lesson_id: int, request: Request):
    """Mark lesson as started/in progress"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Get lesson to find course_id
        lesson = supabase.table("lessons").select("course_id").eq("id", lesson_id).execute()
        if not lesson.data:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        course_id = lesson.data[0]['course_id']
        
        # Check if progress exists
        existing = supabase.table("lesson_progress").select("id").eq("user_id", user['id']).eq("lesson_id", lesson_id).execute()
        
        if existing.data:
            # Update status
            supabase.table("lesson_progress").update({
                "status": "in_progress"
            }).eq("id", existing.data[0]['id']).execute()
        else:
            # Create new progress
            supabase.table("lesson_progress").insert({
                "user_id": user['id'],
                "course_id": course_id,
                "lesson_id": lesson_id,
                "status": "in_progress"
            }).execute()
        
        return {"ok": True, "message": "Lesson started"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/learner/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int, request: Request):
    """Mark lesson as completed"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Get lesson to find course_id
        lesson = supabase.table("lessons").select("course_id, title").eq("id", lesson_id).execute()
        if not lesson.data:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        course_id = lesson.data[0]['course_id']
        lesson_title = lesson.data[0]['title']
        
        # Update or create progress
        existing = supabase.table("lesson_progress").select("id").eq("user_id", user['id']).eq("lesson_id", lesson_id).execute()
        
        if existing.data:
            supabase.table("lesson_progress").update({
                "status": "completed",
                "is_completed": True,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", existing.data[0]['id']).execute()
        else:
            supabase.table("lesson_progress").insert({
                "user_id": user['id'],
                "course_id": course_id,
                "lesson_id": lesson_id,
                "status": "completed",
                "is_completed": True,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            
            # Award points for completing lesson (only on first completion)
            try:
                supabase.table("user_points").insert({
                    "user_id": user['id'],
                    "points": 10,
                    "reason": f"Completed lesson: {lesson_title}",
                    "earned_date": datetime.now(timezone.utc).isoformat()
                }).execute()
            except Exception as e:
                print(f"Error awarding points: {e}")
        
        # Update course progress (this will auto-generate certificate if 100%)
        update_course_progress(user['id'], course_id)
        
        # Check if course is now 100% complete
        enrollment = supabase.table("enrollments").select("progress_percentage").eq("user_id", user['id']).eq("course_id", course_id).execute()
        
        response_data = {"ok": True, "message": "Lesson completed"}
        
        # If course just reached 100%, return certificate info
        if enrollment.data and enrollment.data[0]['progress_percentage'] == 100:
            cert = supabase.table("certificates").select("*").eq("user_id", user['id']).eq("course_id", course_id).execute()
            if cert.data:
                response_data['course_completed'] = True
                response_data['certificate'] = cert.data[0]
                response_data['message'] = "🎉 Congratulations! You've completed the course and earned a certificate!"
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/learner/lessons/{lesson_id}/position")
def save_lesson_position(lesson_id: int, data: dict, request: Request):
    """Save last position for video/document"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        position = data.get('position', 0)
        
        existing = supabase.table("lesson_progress").select("id").eq("user_id", user['id']).eq("lesson_id", lesson_id).execute()
        
        if existing.data:
            supabase.table("lesson_progress").update({
                "last_position": position
            }).eq("id", existing.data[0]['id']).execute()
        
        return {"ok": True}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def update_course_progress(user_id: int, course_id: int):
    """Calculate and update course completion percentage"""
    try:
        # Get total lessons
        lessons = supabase.table("lessons").select("id").eq("course_id", course_id).execute()
        total_lessons = len(lessons.data)
        
        if total_lessons == 0:
            return
        
        # Get completed lessons
        completed = supabase.table("lesson_progress").select("id").eq("user_id", user_id).eq("course_id", course_id).eq("is_completed", True).execute()
        completed_count = len(completed.data)
        
        # Calculate percentage
        progress_percentage = int((completed_count / total_lessons) * 100)
        
        # Determine status
        if progress_percentage == 0:
            status = "not_started"
        elif progress_percentage == 100:
            status = "completed"
        else:
            status = "in_progress"
        
        # Update enrollment
        supabase.table("enrollments").update({
            "progress_percentage": progress_percentage,
            "status": status,
            "completion_date": datetime.now(timezone.utc).isoformat() if status == "completed" else None
        }).eq("user_id", user_id).eq("course_id", course_id).execute()
        
        # Auto-generate certificate and badge when reaching 100%
        if progress_percentage == 100:
            # Check if certificate already exists
            existing_cert = supabase.table("certificates").select("id").eq("user_id", user_id).eq("course_id", course_id).execute()
            
            if not existing_cert.data:
                # Get course details
                course = supabase.table("courses").select("title").eq("id", course_id).execute()
                course_title = course.data[0]['title'] if course.data else "Course"
                
                # Generate certificate
                cert_number = f"CERT-{user_id}-{course_id}-{int(datetime.now(timezone.utc).timestamp())}"
                supabase.table("certificates").insert({
                    "user_id": user_id,
                    "course_id": course_id,
                    "certificate_number": cert_number,
                    "issued_date": datetime.now(timezone.utc).isoformat(),
                    "grade": "A"
                }).execute()
                
                # Award "Course Completed" badge
                course_badge = supabase.table("badges").select("id").eq("name", "Course Completed").execute()
                if course_badge.data:
                    badge_id = course_badge.data[0]['id']
                    # Check if user already has this badge
                    existing_badge = supabase.table("user_badges").select("id").eq("user_id", user_id).eq("badge_id", badge_id).execute()
                    if not existing_badge.data:
                        supabase.table("user_badges").insert({
                            "user_id": user_id,
                            "badge_id": badge_id,
                            "earned_date": datetime.now(timezone.utc).isoformat()
                        }).execute()
                
                # Add points for course completion
                supabase.table("user_points").insert({
                    "user_id": user_id,
                    "points": 100,
                    "reason": f"Completed course: {course_title}",
                    "earned_date": datetime.now(timezone.utc).isoformat()
                }).execute()
                
                print(f"✅ Auto-generated certificate and badge for user {user_id}, course {course_id}")
        
    except Exception as e:
        print(f"Error updating course progress: {e}")

# ============================================================
# QUIZ ENDPOINTS
# ============================================================

@app.get("/api/learner/quizzes/{quiz_id}")
def get_quiz(quiz_id: int, request: Request):
    """Get quiz details"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        quiz = supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
        if not quiz.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        quiz_data = dict(quiz.data[0])
        
        # Get attempt count
        attempts = supabase.table("quiz_attempts").select("id").eq("user_id", user['id']).eq("quiz_id", quiz_id).execute()
        quiz_data['attempt_count'] = len(attempts.data)
        
        return {"quiz": quiz_data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/learner/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: int, data: dict, request: Request):
    """Submit quiz attempt"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        answers = data.get('answers', [])
        
        # Get quiz
        quiz = supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
        if not quiz.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        quiz_data = quiz.data[0]
        questions = quiz_data.get('questions', [])
        
        # Calculate score
        correct_count = 0
        for i, answer in enumerate(answers):
            if i < len(questions) and answer == questions[i].get('correct_answer'):
                correct_count += 1
        
        score = int((correct_count / len(questions)) * 100) if questions else 0
        
        # Get attempt number
        attempts = supabase.table("quiz_attempts").select("attempt_number").eq("user_id", user['id']).eq("quiz_id", quiz_id).execute()
        attempt_number = len(attempts.data) + 1
        
        # Calculate points
        attempt_rewards = quiz_data.get('attempt_rewards', {})
        points_earned = attempt_rewards.get(f'attempt_{attempt_number}', attempt_rewards.get('attempt_4', 25))
        
        # Save attempt
        supabase.table("quiz_attempts").insert({
            "user_id": user['id'],
            "quiz_id": quiz_id,
            "course_id": quiz_data['course_id'],
            "attempt_number": attempt_number,
            "score": score,
            "total_questions": len(questions),
            "answers": answers,
            "points_earned": points_earned
        }).execute()
        
        # Update user points
        user_points = supabase.table("user_points").select("*").eq("user_id", user['id']).execute()
        if user_points.data:
            new_total = user_points.data[0]['total_points'] + points_earned
            badge_level = calculate_badge_level(new_total)
            
            supabase.table("user_points").update({
                "total_points": new_total,
                "badge_level": badge_level,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("user_id", user['id']).execute()
        else:
            badge_level = calculate_badge_level(points_earned)
            supabase.table("user_points").insert({
                "user_id": user['id'],
                "total_points": points_earned,
                "badge_level": badge_level
            }).execute()
        
        # Mark lesson as completed
        lesson_id = quiz_data.get('lesson_id')
        if lesson_id:
            complete_lesson(lesson_id, request)
        
        return {
            "ok": True,
            "score": score,
            "correct_count": correct_count,
            "total_questions": len(questions),
            "points_earned": points_earned,
            "attempt_number": attempt_number
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_badge_level(points: int) -> str:
    """Calculate badge level based on points"""
    if points < 20:
        return "Newbie"
    elif points < 40:
        return "Explorer"
    elif points < 60:
        return "Achiever"
    elif points < 80:
        return "Specialist"
    elif points < 100:
        return "Expert"
    elif points < 120:
        return "Master"
    else:
        return "Legend"

# ============================================================
# COURSE COMPLETION ENDPOINTS
# ============================================================

@app.post("/api/learner/courses/{course_id}/complete")
def complete_course(course_id: int, request: Request):
    """Mark course as completed"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        supabase.table("enrollments").update({
            "status": "completed",
            "completed_date": datetime.now(timezone.utc).isoformat(),
            "progress_percentage": 100
        }).eq("user_id", user['id']).eq("course_id", course_id).execute()
        
        return {"ok": True, "message": "Course completed!"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# REVIEWS ENDPOINTS
# ============================================================

@app.get("/api/courses/{course_id}/reviews")
def get_course_reviews(course_id: int):
    """Get all reviews for a course"""
    try:
        reviews = supabase.table("course_reviews").select("*, users(full_name)").eq("course_id", course_id).order("created_at", desc=True).execute()
        
        review_list = []
        for review in reviews.data:
            r = dict(review)
            if 'users' in r and r['users']:
                r['user_name'] = r['users']['full_name']
                del r['users']
            review_list.append(r)
        
        return {"reviews": review_list}
    except Exception as e:
        print(f"Error: {e}")
        return {"reviews": []}

@app.post("/api/courses/{course_id}/reviews")
def add_course_review(course_id: int, data: dict, request: Request):
    """Add or update course review"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        rating = data.get('rating')
        review_text = data.get('review_text', '')
        
        if not rating or rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # Check if review exists
        existing = supabase.table("course_reviews").select("id").eq("user_id", user['id']).eq("course_id", course_id).execute()
        
        if existing.data:
            # Update existing review
            supabase.table("course_reviews").update({
                "rating": rating,
                "review_text": review_text,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", existing.data[0]['id']).execute()
        else:
            # Create new review
            supabase.table("course_reviews").insert({
                "user_id": user['id'],
                "course_id": course_id,
                "rating": rating,
                "review_text": review_text
            }).execute()
        
        # Update course average rating
        update_course_rating(course_id)
        
        return {"ok": True, "message": "Review submitted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/courses/{course_id}/reviews/{review_id}")
def delete_review(course_id: int, review_id: int, request: Request):
    """Delete own review"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        supabase.table("course_reviews").delete().eq("id", review_id).eq("user_id", user['id']).execute()
        update_course_rating(course_id)
        
        return {"ok": True, "message": "Review deleted"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def update_course_rating(course_id: int):
    """Update course average rating"""
    try:
        reviews = supabase.table("course_reviews").select("rating").eq("course_id", course_id).execute()
        
        if reviews.data:
            total_rating = sum([r['rating'] for r in reviews.data])
            average_rating = round(total_rating / len(reviews.data), 2)
            total_reviews = len(reviews.data)
        else:
            average_rating = 0.0
            total_reviews = 0
        
        supabase.table("courses").update({
            "average_rating": average_rating,
            "total_reviews": total_reviews
        }).eq("id", course_id).execute()
    except Exception as e:
        print(f"Error updating course rating: {e}")

# ============================================================
# LESSON ATTACHMENTS ENDPOINTS
# ============================================================

@app.get("/api/lessons/{lesson_id}/attachments")
def get_lesson_attachments(lesson_id: int):
    """Get attachments for a lesson"""
    try:
        attachments = supabase.table("lesson_attachments").select("*").eq("lesson_id", lesson_id).execute()
        return {"attachments": attachments.data}
    except Exception as e:
        print(f"Error: {e}")
        return {"attachments": []}

@app.post("/api/instructor/lessons/{lesson_id}/attachments")
def add_lesson_attachment(lesson_id: int, data: dict, request: Request):
    """Add attachment to lesson"""
    instructor = require_instructor(request)
    
    try:
        supabase.table("lesson_attachments").insert({
            "lesson_id": lesson_id,
            "file_name": data.get('file_name'),
            "file_url": data.get('file_url'),
            "file_type": data.get('file_type'),
            "file_size": data.get('file_size', 0)
        }).execute()
        
        return {"ok": True, "message": "Attachment added"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# ACCESS CONTROL ENDPOINTS
# ============================================================

@app.get("/api/learner/courses/{course_id}/access")
def check_course_access(course_id: int, request: Request):
    """Check if user has access to course"""
    user = get_current_user(request)
    
    try:
        course = supabase.table("courses").select("access, price").eq("id", course_id).execute()
        if not course.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        access_type = course.data[0]['access']
        
        if access_type == 'open':
            return {"has_access": True, "reason": "open"}
        
        if not user:
            return {"has_access": False, "reason": "login_required"}
        
        # Check enrollment
        enrollment = supabase.table("enrollments").select("is_paid").eq("user_id", user['id']).eq("course_id", course_id).execute()
        
        if enrollment.data:
            if access_type == 'payment':
                return {"has_access": enrollment.data[0]['is_paid'], "reason": "payment_required" if not enrollment.data[0]['is_paid'] else "enrolled"}
            return {"has_access": True, "reason": "enrolled"}
        
        if access_type == 'invitation':
            # Check invitation
            invitation = supabase.table("course_invitations").select("status").eq("user_id", user['id']).eq("course_id", course_id).execute()
            if invitation.data and invitation.data[0]['status'] == 'accepted':
                return {"has_access": True, "reason": "invited"}
            return {"has_access": False, "reason": "invitation_required"}
        
        if access_type == 'payment':
            return {"has_access": False, "reason": "payment_required"}
        
        return {"has_access": False, "reason": "unknown"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# LESSON & QUIZ HELPER ENDPOINTS
# ============================================================

@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: int):
    """Get lesson details"""
    try:
        lesson = supabase.table("lessons").select("*").eq("id", lesson_id).execute()
        if not lesson.data:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        return {"lesson": lesson.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quizzes")
def get_quizzes(lesson_id: int = None):
    """Get quizzes, optionally filtered by lesson_id"""
    try:
        query = supabase.table("quizzes").select("*")
        if lesson_id:
            query = query.eq("lesson_id", lesson_id)
        
        result = query.execute()
        return {"quizzes": result.data}
    except Exception as e:
        print(f"Error: {e}")
        return {"quizzes": []}


# ============================================================
# GAMIFICATION & ACHIEVEMENTS ENDPOINTS
# ============================================================

@app.get("/api/learner/achievements")
def get_user_achievements(request: Request):
    """Get user's achievements and badges"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Get user badges
        badges_result = supabase.table("user_badges").select("*, badges(*)").eq("user_id", user['id']).order("earned_date", desc=True).execute()
        
        # Get achievements
        achievements_result = supabase.table("achievements").select("*").eq("user_id", user['id']).order("achieved_date", desc=True).execute()
        
        # Get certificates
        certificates_result = supabase.table("certificates").select("*, courses(title)").eq("user_id", user['id']).order("issued_date", desc=True).execute()
        
        # Calculate stats from enrollments and lesson progress
        enrollments = supabase.table("enrollments").select("status, progress_percentage").eq("user_id", user['id']).execute()
        completed_courses = len([e for e in enrollments.data if e.get('status') == 'completed'])
        
        # Get total points
        try:
            points_records = supabase.table("user_points").select("*").eq("user_id", user['id']).execute()
            total_points = sum([p.get('points', 0) for p in points_records.data]) if points_records.data else 0
        except:
            total_points = 0
        
        # Get completed lessons count
        lesson_progress = supabase.table("lesson_progress").select("id").eq("user_id", user['id']).eq("is_completed", True).execute()
        lessons_completed = len(lesson_progress.data)
        
        # Calculate learning streak
        streak_data = calculate_learning_streak(user['id'])
        
        points_data = {
            "total_points": total_points,
            "badge_level": "Beginner" if completed_courses > 0 else "Newbie",
            "courses_completed": completed_courses,
            "quizzes_passed": 0,  # TODO: implement quiz tracking
            "lessons_completed": lessons_completed
        }
        
        return {
            "badges": badges_result.data,
            "achievements": achievements_result.data,
            "certificates": certificates_result.data,
            "points": points_data,
            "streak": streak_data
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_learning_streak(user_id: int):
    """Calculate user's learning streak based on lesson completion dates"""
    try:
        # Get all lesson completion dates
        progress = supabase.table("lesson_progress").select("completed_at").eq("user_id", user_id).eq("is_completed", True).order("completed_at", desc=False).execute()
        
        if not progress.data:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_active_days": 0,
                "activity_calendar": []
            }
        
        # Extract unique dates (ignore time)
        from datetime import datetime, timedelta, timezone
        active_dates = set()
        for record in progress.data:
            if record.get('completed_at'):
                date_obj = datetime.fromisoformat(record['completed_at'].replace('Z', '+00:00'))
                date_str = date_obj.date().isoformat()
                active_dates.add(date_str)
        
        active_dates_list = sorted(list(active_dates))
        total_active_days = len(active_dates_list)
        
        if not active_dates_list:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_active_days": 0,
                "activity_calendar": []
            }
        
        # Calculate current streak (from today backwards)
        today = datetime.now(timezone.utc).date()
        current_streak = 0
        check_date = today
        
        # Allow 1 day grace period (if missed yesterday, streak continues)
        # But if missed 2 consecutive days, streak resets
        missed_days = 0
        
        while missed_days < 2:
            date_str = check_date.isoformat()
            if date_str in active_dates:
                current_streak += 1
                missed_days = 0  # Reset missed days counter
            else:
                missed_days += 1
            check_date = check_date - timedelta(days=1)
            
            # Stop if we've gone back too far
            if check_date < datetime.fromisoformat(active_dates_list[0]).date():
                break
        
        # Calculate longest streak
        longest_streak = 0
        temp_streak = 1
        
        for i in range(1, len(active_dates_list)):
            prev_date = datetime.fromisoformat(active_dates_list[i-1]).date()
            curr_date = datetime.fromisoformat(active_dates_list[i]).date()
            diff = (curr_date - prev_date).days
            
            if diff == 1:
                temp_streak += 1
            elif diff <= 2:  # Allow 1 day gap
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        
        longest_streak = max(longest_streak, temp_streak)
        
        # Get last 60 days for calendar
        calendar_dates = []
        for i in range(60):
            date = today - timedelta(days=i)
            if date.isoformat() in active_dates:
                calendar_dates.append(date.isoformat())
        
        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_active_days": total_active_days,
            "activity_calendar": active_dates_list  # All active dates for calendar
        }
    except Exception as e:
        print(f"Error calculating streak: {e}")
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "total_active_days": 0,
            "activity_calendar": []
        }

@app.post("/api/learner/courses/{course_id}/complete")
async def complete_course(course_id: int, request: Request):
    """Mark course as completed and generate certificate"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Check if certificate already exists
        existing_cert = supabase.table("certificates").select("id").eq("user_id", user['id']).eq("course_id", course_id).execute()
        if existing_cert.data:
            raise HTTPException(status_code=400, detail="Course already completed")
        
        # Update enrollment
        supabase.table("enrollments").update({
            "status": "completed",
            "progress_percentage": 100,
            "completed_date": datetime.now(timezone.utc).isoformat()
        }).eq("user_id", user['id']).eq("course_id", course_id).execute()
        
        # Generate certificate
        cert_number = f"LS-{datetime.now().year}-{user['id']:06d}-{course_id:04d}"
        
        certificate_data = {
            "user_id": user['id'],
            "course_id": course_id,
            "certificate_number": cert_number,
            "issued_date": datetime.now(timezone.utc).isoformat(),
            "completion_date": datetime.now(timezone.utc).isoformat(),
            "grade": "A"
        }
        
        cert_result = supabase.table("certificates").insert(certificate_data).execute()
        
        # Award achievement
        supabase.table("achievements").insert({
            "user_id": user['id'],
            "achievement_type": "course_completion",
            "title": "Course Completed!",
            "description": f"Completed course #{course_id}",
            "icon": "🏆",
            "points_earned": 100
        }).execute()
        
        # Update user points
        points_result = supabase.table("user_points").select("*").eq("user_id", user['id']).execute()
        if points_result.data:
            current_points = points_result.data[0]
            new_total = current_points.get('total_points', 0) + 100
            new_courses = current_points.get('courses_completed', 0) + 1
            
            # Determine badge level
            if new_total >= 2000:
                badge_level = "Legend"
            elif new_total >= 1000:
                badge_level = "Master"
            elif new_total >= 500:
                badge_level = "Expert"
            elif new_total >= 200:
                badge_level = "Specialist"
            elif new_total >= 100:
                badge_level = "Achiever"
            elif new_total >= 50:
                badge_level = "Explorer"
            else:
                badge_level = "Newbie"
            
            supabase.table("user_points").update({
                "total_points": new_total,
                "courses_completed": new_courses,
                "badge_level": badge_level
            }).eq("user_id", user['id']).execute()
        
        return {
            "ok": True,
            "message": "Course completed!",
            "certificate": cert_result.data[0] if cert_result.data else None,
            "points_earned": 100
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/learner/certificates/{certificate_id}")
def get_certificate(certificate_id: int, request: Request):
    """Get certificate details"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        cert = supabase.table("certificates").select("*, courses(title), users(full_name)").eq("id", certificate_id).eq("user_id", user['id']).execute()
        
        if not cert.data:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        return {"certificate": cert.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/learner/certificates/{certificate_id}/download")
def mark_certificate_downloaded(certificate_id: int, request: Request):
    """Mark certificate as downloaded"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        supabase.table("certificates").update({
            "is_downloaded": True
        }).eq("id", certificate_id).eq("user_id", user['id']).execute()
        
        return {"ok": True}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/learner/badges/new")
def get_new_badges(request: Request):
    """Get new badges that haven't been viewed"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        badges = supabase.table("user_badges").select("*, badges(*)").eq("user_id", user['id']).eq("is_new", True).execute()
        return {"badges": badges.data}
    except Exception as e:
        print(f"Error: {e}")
        return {"badges": []}

@app.put("/api/learner/badges/{badge_id}/viewed")
def mark_badge_viewed(badge_id: int, request: Request):
    """Mark badge as viewed"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        supabase.table("user_badges").update({
            "is_new": False
        }).eq("id", badge_id).eq("user_id", user['id']).execute()
        
        return {"ok": True}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
