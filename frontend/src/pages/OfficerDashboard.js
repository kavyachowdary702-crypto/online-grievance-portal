import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';
import FileViewer from '../components/FileViewer';
import './AdminDashboard.css'; // Reusing the same styles

const OfficerDashboard = () => {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getAssignedComplaints();
      setAssignedComplaints(res.data || []);
    } catch (err) {
      setError('Failed to fetch assigned complaints');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (id) => {
    try {
      await complaintService.markCompleted(id);
      setSuccess('Complaint marked as completed successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchAssignedComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(prev => ({ ...prev, status: 'COMPLETED' }));
      }
    } catch (err) {
      setError('Failed to mark complaint as completed');
      console.error(err);
    }
  };

  const updateDeadline = async (id, newDeadline) => {
    try {
      const deadlineRequest = {
        deadline: newDeadline,
        comment: 'Deadline updated by officer'
      };
      await complaintService.updateDeadline(id, deadlineRequest);
      setSuccess('Deadline updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchAssignedComplaints();
    } catch (err) {
      setError('Failed to update deadline');
      console.error(err);
    }
  };

  const addInternalNote = async (id) => {
    if (!comment.trim()) return;
    try {
      const noteRequest = {
        comment: comment,
        isInternalNote: true
      };
      await complaintService.addInternalNote(id, noteRequest);
      setSuccess('Internal note added successfully');
      setComment('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add internal note');
      console.error(err);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      NEW: 'status-new',
      UNDER_REVIEW: 'status-under-review',
      ASSIGNED: 'status-assigned',
      IN_PROGRESS: 'status-in-progress',
      COMPLETED: 'status-completed',
      ESCALATED: 'status-escalated',
      RESOLVED: 'status-resolved',
      CLOSED: 'status-closed',
    };
    return map[status] || 'status-new';
  };

  const getUrgencyClass = (urgency) => {
    const map = {
      HIGH: 'urgency-high',
      MEDIUM: 'urgency-medium',
      LOW: 'urgency-low',
    };
    return map[urgency] || 'urgency-medium';
  };

  const isOverdue = (deadline, status) => {
    if (!deadline) return false;
    // Don't consider completed complaints as overdue
    if (status === 'COMPLETED' || status === 'RESOLVED' || status === 'CLOSED') return false;
    return new Date(deadline) < new Date();
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineClass = (deadline, status) => {
    // Don't apply warning colors to completed complaints
    if (status === 'COMPLETED' || status === 'RESOLVED' || status === 'CLOSED') {
      return 'deadline-completed';
    }
    
    const days = getDaysUntilDeadline(deadline);
    if (days === null) return '';
    if (days < 0) return 'deadline-overdue';
    if (days <= 1) return 'deadline-urgent';
    if (days <= 3) return 'deadline-warning';
    return 'deadline-normal';
  };

  return (
    <div className="container">
      <h2>Officer Dashboard</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {loading ? (
        <div className="loading">Loading assigned complaints...</div>
      ) : (
        <>
          <div className="card">
            <h3>My Assigned Complaints ({assignedComplaints.length})</h3>
            
            {/* Summary Stats */}
            <div className="complaint-stats" style={{ marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div className="stat-card" style={{ padding: 10, borderRadius: 5, backgroundColor: '#e3f2fd' }}>
                <strong>Total Assigned:</strong> {assignedComplaints.length}
              </div>
              <div className="stat-card" style={{ padding: 10, borderRadius: 5, backgroundColor: '#fff3e0' }}>
                <strong>Pending:</strong> {assignedComplaints.filter(c => c.status !== 'COMPLETED' && c.status !== 'RESOLVED').length}
              </div>
              <div className="stat-card" style={{ padding: 10, borderRadius: 5, backgroundColor: '#ffebee' }}>
                <strong>Overdue:</strong> {assignedComplaints.filter(c => isOverdue(c.deadline, c.status)).length}
              </div>
              <div className="stat-card" style={{ padding: 10, borderRadius: 5, backgroundColor: '#e8f5e8' }}>
                <strong>Completed:</strong> {assignedComplaints.filter(c => c.status === 'COMPLETED').length}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Days Left</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedComplaints.map((complaint) => {
                    const daysLeft = getDaysUntilDeadline(complaint.deadline);
                    return (
                      <tr key={complaint.id} className={isOverdue(complaint.deadline, complaint.status) ? 'row-overdue' : ''}>
                        <td>{complaint.id}</td>
                        <td>{complaint.username}</td>
                        <td>{complaint.category}</td>
                        <td style={{ maxWidth: 200 }}>
                          {(complaint.description || '').substring(0, 50)}
                          {(complaint.description || '').length > 50 ? '...' : ''}
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
                          {complaint.deadline ? (
                            <span className={getDeadlineClass(complaint.deadline, complaint.status)}>
                              {new Date(complaint.deadline).toLocaleDateString()}
                            </span>
                          ) : (
                            <span style={{ color: '#666' }}>No deadline</span>
                          )}
                        </td>
                        <td>
                          {daysLeft !== null ? (
                            <span className={getDeadlineClass(complaint.deadline, complaint.status)}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 
                               daysLeft === 0 ? 'Today' : 
                               `${daysLeft} days left`}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => setSelectedComplaint(complaint)} 
                              className="btn btn-primary" 
                              style={{ fontSize: 12, padding: '5px 10px' }}
                            >
                              View
                            </button>
                            {complaint.status !== 'COMPLETED' && complaint.status !== 'RESOLVED' && (
                              <button 
                                onClick={() => markCompleted(complaint.id)} 
                                className="btn btn-success" 
                                style={{ fontSize: 12, padding: '5px 10px' }}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {assignedComplaints.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                <h4>No complaints assigned to you yet</h4>
                <p>Assigned complaints will appear here when an admin assigns them to you.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card modal-content" style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto', margin: 20 }}>
            <h3>Complaint Details</h3>
            
            <div className="details">
              <p><strong>ID:</strong> {selectedComplaint.id}</p>
              <p><strong>User:</strong> {selectedComplaint.username}</p>
              <p><strong>Category:</strong> {selectedComplaint.category}</p>
              <p><strong>Urgency:</strong> <span className={`urgency-badge ${getUrgencyClass(selectedComplaint.urgency)}`}>{selectedComplaint.urgency}</span></p>
              <p><strong>Status:</strong> <span className={`status-badge ${getStatusClass(selectedComplaint.status)}`}>{selectedComplaint.status.replace('_', ' ')}</span></p>
              
              {selectedComplaint.deadline && (
                <p><strong>Deadline:</strong> 
                  <span className={getDeadlineClass(selectedComplaint.deadline, selectedComplaint.status)} style={{ marginLeft: 10 }}>
                    {new Date(selectedComplaint.deadline).toLocaleString()}
                    {isOverdue(selectedComplaint.deadline, selectedComplaint.status) && <span style={{ color: 'red', fontWeight: 'bold' }}> (OVERDUE)</span>}
                  </span>
                </p>
              )}
              
              <p><strong>Assigned Date:</strong> {selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString() : '-'}</p>
              <p><strong>Description:</strong></p>
              <p className="description">{selectedComplaint.description}</p>
              
              <FileViewer attachmentPath={selectedComplaint.attachmentPath} />
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: 20 }}>
              <h4>Actions</h4>
              <div className="action-buttons" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                {selectedComplaint.status !== 'COMPLETED' && selectedComplaint.status !== 'RESOLVED' && (
                  <button 
                    onClick={() => markCompleted(selectedComplaint.id)} 
                    className="btn btn-success"
                  >
                    Mark as Completed
                  </button>
                )}
                
                {selectedComplaint.deadline && (
                  <input
                    type="datetime-local"
                    onChange={(e) => updateDeadline(selectedComplaint.id, e.target.value)}
                    style={{ padding: '8px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    title="Update deadline"
                  />
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div style={{ marginTop: 20 }}>
              <h4>Add Internal Note</h4>
              <div className="form-group" style={{ marginTop: 10 }}>
                <textarea 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder="Add an internal note (visible to officers and admins only)..." 
                  style={{ minHeight: 60, width: '100%' }} 
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button 
                    onClick={() => addInternalNote(selectedComplaint.id)} 
                    className="btn btn-primary"
                  >
                    Add Internal Note
                  </button>
                  <button 
                    onClick={() => setSelectedComplaint(null)} 
                    className="btn btn-danger" 
                    style={{ marginLeft: 'auto' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for additional styling */}
      <style jsx>{`
        .urgency-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .urgency-high { background-color: #ffebee; color: #c62828; }
        .urgency-medium { background-color: #fff3e0; color: #ef6c00; }
        .urgency-low { background-color: #e8f5e8; color: #2e7d32; }
        
        .deadline-overdue { color: #d32f2f; font-weight: bold; }
        .deadline-urgent { color: #ff9800; font-weight: bold; }
        .deadline-warning { color: #f57c00; }
        .deadline-normal { color: #388e3c; }
        .deadline-completed { color: #666; font-style: italic; }
        
        .row-overdue { background-color: #ffebee; }
        
        .status-assigned { background-color: #e3f2fd; color: #1565c0; }
        .status-completed { background-color: #e8f5e8; color: #2e7d32; }
        
        .stat-card {
          min-width: 120px;
          text-align: center;
          border: 1px solid #ddd;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default OfficerDashboard;