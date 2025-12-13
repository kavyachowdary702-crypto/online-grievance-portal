import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';

const AutoEscalationDashboard = ({ onClose }) => {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    checkUserRole();
    fetchAllData();
  }, []);

  const checkUserRole = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Decode JWT token to check user role
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({
          username: payload.sub,
          roles: payload.roles || [],
          exp: payload.exp
        });
        console.log('Current user info:', {
          username: payload.sub,
          roles: payload.roles,
          isAdmin: payload.roles?.includes('ADMIN')
        });
      } else {
        console.warn('No authentication token found');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      console.log('Fetching auto-escalation data...');
      console.log('API Base URL:', 'http://localhost:8081/api');
      
      const [statsRes, candidatesRes, configRes] = await Promise.all([
        complaintService.getEscalationStats(),
        complaintService.getEscalationCandidates(),
        complaintService.getEscalationConfig()
      ]);

      console.log('Successfully fetched escalation data');
      setStats(statsRes.data);
      setCandidates(candidatesRes.data || []);
      setConfig(configRes.data);
      setError('');
    } catch (err) {
      console.error('Failed to load auto-escalation data:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMessage = 'Failed to load auto-escalation data';
      if (err.response?.status === 404) {
        errorMessage += ': Auto-escalation endpoints not found. Check if backend is running with latest code.';
      } else if (err.response?.status === 403) {
        errorMessage += ': Access denied. Please ensure you are logged in as an admin.';
      } else if (err.response?.status === 401) {
        errorMessage += ': Authentication failed. Please login again.';
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage += ': Cannot connect to backend. Please ensure the backend server is running on port 8081.';
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualCheck = async () => {
    try {
      setError('');
      setSuccess('');
      console.log('Triggering manual escalation check...');
      
      const response = await complaintService.triggerEscalationCheck();
      console.log('Manual escalation response:', response);
      
      setSuccess('Manual escalation check triggered successfully!');
      setTimeout(() => {
        setSuccess('');
        fetchAllData(); // Refresh data
      }, 2000);
    } catch (err) {
      console.error('Error triggering escalation check:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Failed to trigger escalation check';
      if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage += ': Access denied. Admin privileges required.';
      } else if (err.response?.status === 404) {
        errorMessage += ': Endpoint not found. Check if backend is running.';
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    }
  };

  const testService = async () => {
    try {
      setError('');
      setSuccess('');
      console.log('Testing auto-escalation service...');
      
      const response = await complaintService.testAutoEscalationService();
      console.log('Test service response:', response);
      
      setSuccess('Service test completed: ' + response.data.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error testing service:', err);
      
      let errorMessage = 'Service test failed';
      if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage += ': Access denied. Admin privileges required.';
      } else if (err.response?.status === 404) {
        errorMessage += ': Endpoint not found. Check if backend is running.';
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    }
  };

  const testConnection = async () => {
    try {
      setError('');
      setSuccess('');
      console.log('Testing connection to auto-escalation service...');
      
      const response = await complaintService.autoEscalationHealthCheck();
      console.log('Connection test response:', response);
      
      const healthData = response.data;
      let message = '✅ Connection successful';
      
      if (healthData.message) {
        message += `: ${healthData.message}`;
      } else if (healthData.status === 'UP') {
        message += ': Auto-escalation service is running';
      }
      
      if (healthData.timestamp) {
        message += ` (${new Date(healthData.timestamp).toLocaleString()})`;
      }
      
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Connection test failed:', err);
      
      let errorMessage = '❌ Connection test failed';
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage += ': Cannot connect to backend server. Please ensure the backend is running on http://localhost:8081';
      } else if (err.response?.status === 404) {
        errorMessage += ': Auto-escalation endpoints not found. Backend may not have the latest code.';
      } else if (err.response?.status === 403) {
        errorMessage += ': Access denied. This should not happen for health check - please check security configuration.';
      } else if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    }
  };

  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency?.toUpperCase()) {
      case 'HIGH': return '#dc3545';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getTimeSinceCreated = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading auto-escalation data...</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '8px', maxWidth: '1000px',
        maxHeight: '90vh', overflow: 'auto', margin: '20px', width: '100%'
      }}>
        <div style={{
          padding: '20px', borderBottom: '1px solid #e0e0e0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>🤖 Automated Escalation System</h2>
            {userInfo && (
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Logged in as: <strong>{userInfo.username}</strong> 
                {userInfo.roles && userInfo.roles.length > 0 && (
                  <span> ({userInfo.roles.join(', ')})</span>
                )}
                {!userInfo.roles?.includes('ADMIN') && (
                  <span style={{ color: '#dc3545', fontWeight: 'bold' }}> ⚠️ ADMIN role required</span>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: '#dc3545', color: 'white', border: 'none',
              padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {error && (
            <div style={{
              backgroundColor: '#f8d7da', color: '#721c24', padding: '10px',
              borderRadius: '4px', marginBottom: '15px', border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#d4edda', color: '#155724', padding: '10px',
              borderRadius: '4px', marginBottom: '15px', border: '1px solid #c3e6cb'
            }}>
              {success}
            </div>
          )}

          {/* Statistics Section */}
          {stats && (
            <div style={{ marginBottom: '30px' }}>
              <h3>📊 Escalation Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{
                  backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px',
                  border: '1px solid #e9ecef', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                    {stats.totalEscalated}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '14px' }}>Total Escalated</div>
                </div>
                <div style={{
                  backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px',
                  border: '1px solid #e9ecef', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
                    {stats.escalatedLast24Hours}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '14px' }}>Last 24 Hours</div>
                </div>
                <div style={{
                  backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px',
                  border: '1px solid #e9ecef', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6610f2' }}>
                    {stats.escalatedLastWeek}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '14px' }}>Last Week</div>
                </div>
                <div style={{
                  backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px',
                  border: '1px solid #ffeaa7', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
                    {stats.pendingEscalation}
                  </div>
                  <div style={{ color: '#856404', fontSize: '14px' }}>⚠️ Pending Escalation</div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Section */}
          {config && (
            <div style={{ marginBottom: '30px' }}>
              <h3>⚙️ Escalation Configuration</h3>
              <div style={{
                backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                  <div><strong>Unassigned threshold:</strong> {config.unassignedThresholdHours}h</div>
                  <div><strong>Overdue threshold:</strong> {config.overdueThresholdHours}h</div>
                  <div><strong>Stuck threshold:</strong> {config.stuckThresholdHours}h</div>
                  <div><strong>High urgency:</strong> {config.highUrgencyThresholdHours}h</div>
                  <div><strong>Medium urgency:</strong> {config.mediumUrgencyThresholdHours}h</div>
                  <div><strong>Low urgency:</strong> {config.lowUrgencyThresholdHours}h</div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
                  <strong>Scheduling:</strong> {config.schedulingInterval}
                </div>
              </div>
            </div>
          )}

          {/* Manual Trigger Section */}
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={testConnection}
                style={{
                  backgroundColor: '#17a2b8', color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 'bold'
                }}
              >
                🔗 Test Connection
              </button>
              <button
                onClick={testService}
                style={{
                  backgroundColor: '#28a745', color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 'bold'
                }}
              >
                🔍 Test Service
              </button>
              <button
                onClick={triggerManualCheck}
                style={{
                  backgroundColor: '#007bff', color: 'white', border: 'none',
                  padding: '12px 24px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '16px', fontWeight: 'bold'
                }}
              >
                🔄 Trigger Manual Escalation Check
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
              Test connection first, then test service functionality, then manually run escalation check
            </div>
          </div>

          {/* Escalation Candidates Section */}
          <div>
            <h3>⚠️ Escalation Candidates ({candidates.length})</h3>
            {candidates.length === 0 ? (
              <div style={{
                backgroundColor: '#d1ecf1', color: '#0c5460', padding: '15px',
                borderRadius: '4px', border: '1px solid #bee5eb'
              }}>
                ✅ No complaints currently require escalation
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Urgency</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Assigned To</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Age</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((complaint) => (
                      <tr key={complaint.id} style={{ backgroundColor: 'white' }}>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>#{complaint.id}</td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6', maxWidth: '200px' }}>
                          {complaint.description?.substring(0, 80)}
                          {complaint.description?.length > 80 ? '...' : ''}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px',
                            backgroundColor: '#fff3cd', color: '#856404'
                          }}>
                            {complaint.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px',
                            backgroundColor: getUrgencyBadgeColor(complaint.urgency) + '20',
                            color: getUrgencyBadgeColor(complaint.urgency)
                          }}>
                            {complaint.urgency}
                          </span>
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {complaint.assignedToUsername || (
                            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {getTimeSinceCreated(complaint.createdAt)}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {complaint.deadline ? (
                            <span style={{
                              color: new Date(complaint.deadline) < new Date() ? '#dc3545' : '#28a745',
                              fontWeight: new Date(complaint.deadline) < new Date() ? 'bold' : 'normal'
                            }}>
                              {new Date(complaint.deadline).toLocaleDateString()}
                              {new Date(complaint.deadline) < new Date() && ' ⚠️'}
                            </span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{
            marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef',
            borderRadius: '4px', fontSize: '12px', color: '#495057'
          }}>
            <strong>ℹ️ How it works:</strong><br/>
            • The system automatically checks for escalation candidates every hour<br/>
            • Complaints are escalated based on time thresholds, urgency levels, and deadlines<br/>
            • Escalated complaints are assigned to available admins or senior officers<br/>
            • All escalation actions are logged in the complaint timeline
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoEscalationDashboard;