# ResolveIT - Smart Grievance and Feedback Management System

ResolveIT is a full-stack web application designed to improve transparency and efficiency in handling IT (Information Technology) grievances. It provides a platform for users to submit, track, and manage complaints either anonymously or via verified login, while administrators can review, resolve, or escalate them.

## 🎯 Features

- **User Authentication**: JWT-based authentication with Spring Security
- **Role-Based Access Control**: Separate functionalities for Users and Admins
- **Anonymous Complaints**: Submit complaints without creating an account
- **Verified Complaints**: Track complaints with user accounts
- **File Upload**: Support for attaching evidence (images/documents)
- **Real-time Tracking**: Monitor complaint status (Pending → In Progress → Resolved)
- **Admin Dashboard**: Comprehensive complaint management with filters
- **Comments System**: Admins can add comments to complaints

## 🛠️ Tech Stack

### Backend
- **Spring Boot 3.1.5**: RESTful API framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Database ORM
- **Hibernate**: Object-relational mapping
- **JWT (jjwt 0.11.5)**: Token-based authentication
- **MySQL 8.0+**: Relational database
- **Maven**: Build and dependency management

### Frontend
- **React 18.2**: UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **CSS3**: Styling




## 👤 User Roles

### User Role
- Submit complaints (anonymous or verified)
- Track own complaints
- View complaint status and admin comments

### Admin Role
- View all complaints
- Filter complaints by status, category, urgency
- Update complaint status
- Add comments to complaints
- Access full complaint history

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: BCrypt password hashing
- **Role-Based Access**: Method-level security with Spring Security
- **CORS Configuration**: Configured for frontend-backend communication
- **File Upload Validation**: Max 10MB file size limit

## 📝 Usage

### For Users

1. **Create Account**: Sign up with username, email, and password
2. **Submit Complaint**: Fill out the complaint form with category, description, and urgency
3. **Track Complaints**: View status updates in "My Complaints"
4. **Anonymous Option**: Submit without login (cannot track later)

### For Admins

1. **Login**: Use admin credentials
2. **View Dashboard**: See all complaints with filters
3. **Update Status**: Change complaint status to Pending/In Progress/Resolved
4. **Add Comments**: Provide updates to users
5. **Filter & Search**: Find specific complaints by status, category, or urgency

