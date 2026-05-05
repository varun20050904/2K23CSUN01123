# Stage 1

## Objective
Develop a RESTful API that provides real-time notifications to students about Placements, Events, and Results on campus.

---

## Key Functionalities


The key functionalities of the Notification Platform are: 
- Retrieve all notifications for a student
- Retrieve only unread notifications
- Mark a notification has been read
- Mark all notifications has been read
- Create a notification (by admin/HR)
- Delete a notification
## API Endpoints

### 1. Get All Notifications
**GET** `/api/notifications`

**Headers:**
```json
{
  "Authorization": "Bearer ",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Placement",
      "message": "Google is hiring! Apply before 10th May.",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}
```

---

### 2. Get Unread Notifications
**GET** `/api/notifications/unread`

**Headers:**
```json
{
  "Authorization": "Bearer ",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "unreadCount": 3,
  "data": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Result",
      "message": "mid-sem results are out.",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}
```

---

### 3. Mark One Notification as Read
**PATCH** `/api/notifications/:id/read`

**Headers:**
```json
{
  "Authorization": "Bearer ",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "isRead": true
  }
}
```

---

### 4. Mark All Notifications as Read
**PATCH** `/api/notifications/read-all`

**Headers:**
```json
{
  "Authorization": "Bearer ",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 5. Create Notification (Admin/HR only)
**POST** `/api/notifications`

**Headers:**
```json
{
  "Authorization": "Bearer ",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "type": "Placement",
  "message": "Amazon hiring drive on 15th May",
  "targetAudience": "all"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "a1b2c3d4-0000-4a34-9e69-3900a14576bc",
    "type": "Placement",
    "message": "Amazon hiring drive on 15th May",
    "createdAt": "2026-05-05T10:00:00Z"
  }
}
```

---

### 6. Delete a Notification (Admin only)
**DELETE** `/api/notifications/:id`

**Headers:**
```json
{
  "Authorization": "Bearer ",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Real-Time Notification Mechanism

### Approach: WebSockets (Socket.io)

When a student logs in, the frontend opens a WebSocket connection to the server.
When HR/admin creates a new notification, the server emits an event to all 
connected students instantly — no polling needed.

### Flow:
1. Student logs in → frontend connects to WebSocket server
2. Student joins their own room: `socket.join(studentId)`
3. Admin creates notification → server emits to all rooms
4. Frontend receives event and displays notification instantly

### WebSocket Events:

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client → Server | Student connects on login |
| `join_room` | Client → Server | Student joins their room |
| `new_notification` | Server → Client | Server pushes new notification |
| `disconnect` | Client → Server | Student logs out |

### Example Server Emit:
```json
{
  "event": "new_notification",
  "data": {
    "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "type": "Placement",
    "message": "Google is hiring!",
    "createdAt": "2026-05-05T10:00:00Z"
  }
}
```

---

# Stage 2 


Why use PostgreSQL?
- The notifications being monitored will have a well-defined pattern, which fits into the relational database structure
- We will be able to search based on the attributes of the notification — studentID, type of notification, read status, createdAt — SQL will provide for these queries
- We need the ability to access large data areas very quickly with indexing capability — PostgreSQL provides a robust way to create indexes
- PostgreSQL has built-in support for ensuring that all notifications are created or deleted properly through the concept of ACID (Atomicity, Consistency, Isolation, Durability).

Database Structure:
The following information is the database structure needed for this project:

Students Table:
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  rollNo VARCHAR(50) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

Notifications Table:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Placement', 'Event', 'Result')),
  message TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

Student-Notification Table:
```sql
CREATE TABLE student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID REFERENCES students(id) ON DELETE CASCADE,
  notificationId UUID REFERENCES notifications(id) ON DELETE CASCADE,
  isRead BOOLEAN DEFAULT FALSE,
  readAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

Queries Needed to Support Stage 1 APIs:
### 1. Retrieve All Notifications for a Student:
```sql
SELECT 
  n.id,
  n.type,
  n.message,
  sn.isRead,
  n.createdAt
FROM notifications n
JOIN student_notifications sn ON n.id = sn.notificationId
WHERE sn.studentId = ''
ORDER BY n.createdAt;


### 2. Get Unread Notifications
```sql
SELECT 
  n.id,
  n.type,
  n.message,
  sn.isRead,
  n.createdAt
FROM notifications n
JOIN student_notifications sn ON n.id = sn.notificationId
WHERE sn.studentId = '' AND sn.isRead = FALSE
ORDER BY n.createdAt DESC;
```

### 3. Mark One Notification as Read
```sql
UPDATE student_notifications
SET isRead = TRUE, readAt = NOW()
WHERE studentId = '' 
AND notificationId = '';
```

### 4. Mark All Notifications as Read
```sql
UPDATE student_notifications
SET isRead = TRUE, readAt = NOW()
WHERE studentId = '' AND isRead = FALSE;
```
## Scaling Problems & Solutions

### Problem 1: Too many rows as data grows
- 50,000 students × many notifications = millions of rows in student_notifications
- Queries slow down without proper indexing

**Solution: Add Indexes**
```sql
CREATE INDEX idx_student_notifications_studentId 
ON student_notifications(studentId);

CREATE INDEX idx_student_notifications_isRead 
ON student_notifications(studentId, isRead);

CREATE INDEX idx_notifications_createdAt 
ON notifications(createdAt DESC);
```

### Problem 2: Sending notification to all 50,000 students is slow
- Inserting 50,000 rows one by one is very slow

**Solution: Batch inserts using a single query**
```sql
INSERT INTO student_notifications (studentId, notificationId)
SELECT id, '' FROM students;
```

### Problem 3: Read queries become slow at scale
- JOIN between notifications and student_notifications gets expensive

**Solution: Pagination**
```sql
SELECT n.id, n.type, n.message, sn.isRead, n.createdAt
FROM notifications n
JOIN student_notifications sn ON n.id = sn.notificationId
WHERE sn.studentId = ''
ORDER BY n.createdAt DESC
LIMIT 20 OFFSET 0;
```
---