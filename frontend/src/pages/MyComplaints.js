import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await complaintService.getMyComplaints();
      setComplaints(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch complaints');
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'NEW': 'status-new',
      'PENDING': 'status-pending',
      'ASSIGNED': 'status-assigned',
      'IN_PROGRESS': 'status-in-progress',
      'COMPLETED': 'status-completed',
      'RESOLVED': 'status-resolved',
      'ESCALATED': 'status-escalated',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-pending';
  };

  const getUrgencyClass = (urgency) => {
    const urgencyMap = {
      'HIGH': 'urgency-high',
      'MEDIUM': 'urgency-medium',
      'LOW': 'urgency-low'
    };
    return urgencyMap[urgency] || 'urgency-medium';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getDeadlineStatus = (deadline, status) => {
    if (!deadline) return null;
    
    // Don't show overdue for completed complaints
    if (status === 'COMPLETED' || status === 'RESOLVED' || status === 'CLOSED') {
      return null;
    }
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (deadlineDate < now) {
      return 'overdue';
    } else if ((deadlineDate - now) / (1000 * 60 * 60 * 24) <= 1) {
      return 'urgent';
    }
    return 'normal';
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h2>My Complaints Dashboard</h2>
      {error && <div className="error">{error}</div>}
      
      {/* Summary Stats */}
      {complaints.length > 0 && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#e3f2fd', minWidth: '120px' }}>
            <strong>Total Complaints:</strong> {complaints.length}
          </div>
          <div className="stat-card" style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#fff3e0', minWidth: '120px' }}>
            <strong>Pending:</strong> {complaints.filter(c => c.status === 'NEW' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length}
          </div>
          <div className="stat-card" style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#e8f5e8', minWidth: '120px' }}>
            <strong>Completed:</strong> {complaints.filter(c => c.status === 'COMPLETED' || c.status === 'RESOLVED').length}
          </div>
          <div className="stat-card" style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#ffebee', minWidth: '120px' }}>
            <strong>Escalated:</strong> {complaints.filter(c => c.status === 'ESCALATED').length}
          </div>
          <div className="stat-card" style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#f3e5f5', minWidth: '120px' }}>
            <strong>With Deadlines:</strong> {complaints.filter(c => c.deadline).length}
          </div>
        </div>
      )}
      
      {complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ color: '#666', marginBottom: '8px' }}>No complaints yet</h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            You haven't submitted any complaints yet. When you do, you'll be able to track their status here.
          </p>
          <div style={{ 
            padding: '12px 20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            border: '1px solid #ddd',
            display: 'inline-block'
          }}>
            <strong>💡 Tip:</strong> Use the "Submit Complaint" link in the navigation to file a new complaint
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Description</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Assigned Officer</th>
                <th>Deadline</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(complaint => (
                <tr key={complaint.id}>
                  <td>{complaint.id}</td>
                  <td>{complaint.category}</td>
                  <td style={{ maxWidth: '250px' }}>
                    {complaint.description.substring(0, 80)}
                    {complaint.description.length > 80 ? '...' : ''}
                  </td>
                  <td>
                    <span className={`urgency-badge ${getUrgencyClass(complaint.urgency)}`}>
                      {complaint.urgency}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(complaint.status)}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {complaint.assignedToUsername ? (
                      <span style={{ color: '#2196f3', fontWeight: 'bold' }}>
                        👮‍♂️ {complaint.assignedToUsername}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>
                        Not assigned
                      </span>
                    )}
                  </td>
                  <td>
                    {complaint.deadline ? (
                      <span 
                        className={`deadline-${getDeadlineStatus(complaint.deadline, complaint.status) || 'normal'}`}
                        style={{ 
                          fontWeight: getDeadlineStatus(complaint.deadline, complaint.status) === 'overdue' ? 'bold' : 'normal' 
                        }}
                      >
                        {getDeadlineStatus(complaint.deadline, complaint.status) === 'overdue' && '⚠️ '}
                        {formatDate(complaint.deadline)}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>
                        No deadline
                      </span>
                    )}
                  </td>
                  <td>{formatDate(complaint.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Custom styles for user dashboard */}
      <style jsx>{`
        .urgency-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .urgency-high { 
          background-color: #ffebee; 
          color: #c62828; 
        }
        .urgency-medium { 
          background-color: #fff3e0; 
          color: #ef6c00; 
        }
        .urgency-low { 
          background-color: #e8f5e8; 
          color: #2e7d32; 
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-new { 
          background-color: #e3f2fd; 
          color: #1565c0; 
        }
        .status-assigned { 
          background-color: #e8f5e8; 
          color: #2e7d32; 
        }
        .status-in-progress { 
          background-color: #fff3e0; 
          color: #ef6c00; 
        }
        .status-completed { 
          background-color: #e8f5e8; 
          color: #388e3c; 
        }
        .status-resolved { 
          background-color: #e8f5e8; 
          color: #388e3c; 
        }
        .status-escalated { 
          background-color: #ffebee; 
          color: #d32f2f; 
        }
        .status-closed { 
          background-color: #f3e5f5; 
          color: #7b1fa2; 
        }
        
        .deadline-overdue { 
          color: #d32f2f; 
          font-weight: bold; 
        }
        .deadline-urgent { 
          color: #ff9800; 
          font-weight: bold; 
        }
        .deadline-normal { 
          color: #388e3c; 
        }
        
        .table th, .table td {
          padding: 12px 8px;
          vertical-align: middle;
        }
        
        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
        }
        
        .table tr:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default MyComplaints;
