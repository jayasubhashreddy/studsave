# Admin Guide - View All Folder Locks

## Quick Start

Admin can view all subject locks (folders) through these API endpoints:

### Endpoint 1: Get All Locked Folders
```
GET /api/admin/locks
```

**Response:**
```json
{
  "total": 5,
  "locks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "folderName": "Data Structures - Important",
      "academicYear": "2024-2025",
      "semester": "Fall",
      "isLocked": true,
      "passwordHash": "$2b$10$abcdefghijklmnopqrstuvwxyz...",
      "lockedSince": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "folderName": "Algorithms - Confidential",
      "academicYear": "2024-2025",
      "semester": "Fall",
      "isLocked": true,
      "passwordHash": "$2b$10$zyxwvutsrqponmlkjihgfedcb...",
      "lockedSince": "2024-02-20T14:45:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "folderName": "Physics Notes",
      "academicYear": "2024-2025",
      "semester": "Spring",
      "isLocked": true,
      "passwordHash": "$2b$10$mnopqrstuvwxyzabcdefghijkl...",
      "lockedSince": "2024-01-10T09:15:00Z"
    }
  ]
}
```

---

### Endpoint 2: Get All Folders (with lock status)
```
GET /api/admin/all-subjects
```

**Response:**
```json
{
  "totalSubjects": 12,
  "lockedCount": 5,
  "byAcademic": {
    "2024-2025": {
      "Fall": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "folder": "Data Structures - Important",
          "academic": "2024-2025",
          "semester": "Fall",
          "locked": true,
          "passwordHash": "$2b$10$abcdefghijklmnopqrstuvwxyz..."
        },
        {
          "_id": "507f1f77bcf86cd799439021",
          "folder": "Web Development",
          "academic": "2024-2025",
          "semester": "Fall",
          "locked": false,
          "passwordHash": null
        }
      ],
      "Spring": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "folder": "Physics Notes",
          "academic": "2024-2025",
          "semester": "Spring",
          "locked": true,
          "passwordHash": "$2b$10$mnopqrstuvwxyzabcdefghijkl..."
        }
      ]
    },
    "2023-2024": {
      "Fall": [
        {
          "_id": "507f1f77bcf86cd799439031",
          "folder": "Old Chemistry",
          "academic": "2023-2024",
          "semester": "Fall",
          "locked": false,
          "passwordHash": null
        }
      ]
    }
  }
}
```

---

## Using cURL to Test

### Test Endpoint 1 - Get All Locked Folders
```bash
curl -X GET http://localhost:5000/api/admin/locks
```

### Test Endpoint 2 - Get All Folders Grouped
```bash
curl -X GET http://localhost:5000/api/admin/all-subjects
```

### Pretty Print JSON Response
```bash
curl -X GET http://localhost:5000/api/admin/locks | json_pp
```

---

## What You Can See in Admin Panel

✅ **Folder Name** - The subject/folder that's locked  
✅ **Academic Year** - Which year the folder belongs to  
✅ **Semester** - Which semester (Fall, Spring, etc.)  
✅ **Lock Status** - Boolean: locked or unlocked  
✅ **Password Hash** - Bcrypt hash (for reference/audit)  
✅ **Lock Date** - When the lock was created  

---

## Database Query (Alternative Method)

If you need to query MongoDB directly:

```javascript
// Find all locked subjects
db.subjects.find({ isLocked: true })

// Find locked subjects for specific year
db.subjects.find({ 
  isLocked: true,
  academicId: ObjectId("507f1f77bcf86cd799439001")
})

// View folder name and password hash
db.subjects.find(
  { isLocked: true },
  { name: 1, pinHash: 1, isLocked: 1, semesterId: 1 }
)
```

---

## Understanding Password Hash

The `passwordHash` field contains a bcrypt hash. For example:
```
$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

- **$2b$** - bcrypt algorithm identifier
- **$10$** - cost factor (10)
- **Rest** - salt + hashed password

**Important:** The actual PIN is **never stored**. Only the hash is kept.  
You cannot reverse-engineer the PIN from the hash.

---

## Lock System Behavior

### When User Sets a Lock:
1. User enters PIN (e.g., "12345")
2. PIN is sent to backend: `POST /api/subjects/{id}/lock`
3. Backend bcrypt hashes the PIN
4. Hash is stored in `Subject.pinHash` field
5. `isLocked` is set to `true`

### When User Tries to Access Locked Folder:
1. User clicks on locked subject
2. PIN dialog appears
3. User enters PIN
4. Backend compares: `bcrypt.compare(enteredPin, pinHash)`
5. If match → unlock for this session
6. If no match → "Incorrect PIN" error

---

## Admin Responsibilities

- **Monitor Locks:** Use `/api/admin/locks` to see which folders are locked
- **Audit Trail:** Check when locks were created (`lockedSince`)
- **Inventory:** Use `/api/admin/all-subjects` to see overall lock status
- **Reference:** Password hashes are for reference only (cannot be reversed)

---

## Integration with Admin Dashboard (Optional)

You can create a simple admin dashboard by:

1. Create a new frontend page: `/frontend/src/pages/AdminPanel.tsx`
2. Call both endpoints periodically
3. Display tables showing:
   - All locked folders
   - Lock creation dates
   - Academic year organization
4. Add export as CSV for audit purposes

Example implementation:
```typescript
// Admin panel component
const AdminPanel = () => {
  const [locks, setLocks] = useState([]);

  useEffect(() => {
    const fetchLocks = async () => {
      const response = await api.get('/admin/locks');
      setLocks(response.data.locks);
    };
    fetchLocks();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Folder Name</th>
          <th>Year</th>
          <th>Semester</th>
          <th>Password Hash</th>
          <th>Locked Since</th>
        </tr>
      </thead>
      <tbody>
        {locks.map(lock => (
          <tr key={lock._id}>
            <td>{lock.folderName}</td>
            <td>{lock.academicYear}</td>
            <td>{lock.semester}</td>
            <td><code>{lock.passwordHash.substring(0, 20)}...</code></td>
            <td>{new Date(lock.lockedSince).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## Security Notes

✅ **PINs never stored in plain text**  
✅ **Bcrypt prevents PIN recovery**  
✅ **Admin can see lock status & hashes**  
✅ **Admin cannot see actual PINs**  
✅ **Locks persist across sessions**  
✅ **Single-user app (no inter-user concerns)**  
