import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { complaintService } from '../services/api';
import AutoEscalationDashboard from '../components/AutoEscalationDashboard';
import FileViewer from '../components/FileViewer';
import './AdminDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [escalatedComplaints, setEscalatedComplaints] = useState([]);
  const [unresolvedComplaints, setUnresolvedComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, escalated, unresolved
  const [filters, setFilters] = useState({ status: '', category: '', urgency: '' });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [officers, setOfficers] = useState([]);
  const [officersAndAdmins, setOfficersAndAdmins] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showAutoEscalationDashboard, setShowAutoEscalationDashboard] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    complaintId: null,
    officerId: '',
    deadline: '',
    comment: ''
  });
  const [escalationData, setEscalationData] = useState({
    complaintId: null,
    escalateToUserId: '',
    reason: '',
    priority: 'HIGH',
    comment: ''
  });

  useEffect(() => {
    fetchComplaints();
    fetchOfficers();
    fetchOfficersAndAdmins();
    if (activeTab === 'escalated') {
      fetchEscalatedComplaints();
    } else if (activeTab === 'unresolved') {
      fetchUnresolvedComplaints();
    }
  }, [activeTab]);

  const fetchComplaints = async () => {
    try {
      const res = await complaintService.getAllComplaints();
      setComplaints(res.data || []);
    } catch (err) {
      setError('Failed to fetch complaints');
      console.error(err);
    }
  };

  const fetchEscalatedComplaints = async () => {
    try {
      const res = await complaintService.getEscalatedComplaints();
      setEscalatedComplaints(res.data || []);
    } catch (err) {
      setError('Failed to fetch escalated complaints');
      console.error(err);
    }
  };

  const fetchUnresolvedComplaints = async () => {
    try {
      const res = await complaintService.getUnresolvedComplaints();
      setUnresolvedComplaints(res.data || []);
    } catch (err) {
      setError('Failed to fetch unresolved complaints');
      console.error(err);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await complaintService.getAllOfficers();
      setOfficers(res.data || []);
    } catch (err) {
      setError('Failed to fetch officers');
      console.error(err);
    }
  };

  const fetchOfficersAndAdmins = async () => {
    try {
      const res = await complaintService.getAllOfficersAndAdmins();
      setOfficersAndAdmins(res.data || []);
    } catch (err) {
      setError('Failed to fetch officers and admins');
      console.error(err);
    }
  };

  const applyFilters = async () => {
    try {
      const res = await complaintService.filterComplaints(filters.status, filters.category, filters.urgency);
      setComplaints(res.data || []);
    } catch (err) {
      setError('Failed to filter complaints');
      console.error(err);
    }
  };

  const clearFilters = async () => {
    setFilters({ status: '', category: '', urgency: '' });
    await fetchComplaints();
  };

  const updateStatus = async (id, newStatus) => {
    console.log(`=== Updating Status ===`);
    console.log(`Complaint ID: ${id}`);
    console.log(`New Status: ${newStatus}`);
    
    try {
      setError('');
      setSuccess('');
      
      const response = await complaintService.updateComplaintStatus(id, newStatus);
      console.log('Status update response:', response);
      
      setSuccess(`Status updated to "${newStatus.replace('_', ' ')}" successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh complaints list
      fetchComplaints();
      
      // Update selected complaint if it's the one being updated
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((s) => ({ ...s, status: newStatus }));
      }
      
    } catch (err) {
      console.error('❌ Status update failed:', err);
      console.error('❌ Error response:', err.response?.data);
      
      let errorMessage = 'Failed to update status';
      if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage += ': Access denied. Admin privileges required.';
      } else if (err.response?.status === 404) {
        errorMessage += ': Complaint not found.';
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    }
  };

  const addComment = async (id) => {
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
      fetchComplaints();
    } catch (err) {
      setError('Failed to add internal note');
      console.error(err);
    }
  };

    const openAssignModal = (complaintId) => {
    console.log('Opening assign modal for complaint:', complaintId);
    console.log('Available officers:', officers);
    setAssignmentData({
      complaintId: complaintId,
      officerId: '',
      deadline: '',
      comment: ''
    });
    setError('');
    setSuccess('');
    setShowAssignModal(true);
  };

  const assignComplaint = async () => {
    console.log('=== Assignment Process Started ===');
    console.log('Current assignmentData:', assignmentData);
    console.log('Available officers:', officers);
    
    if (!assignmentData.officerId) {
      console.log('❌ No officer selected');
      setError('Please select an officer to assign');
      return;
    }

    if (!assignmentData.complaintId) {
      console.log('❌ No complaint ID');
      setError('No complaint selected for assignment');
      return;
    }

    // Validate officer exists
    const selectedOfficer = officers.find(o => o.id.toString() === assignmentData.officerId.toString());
    if (!selectedOfficer) {
      console.log('❌ Invalid officer ID:', assignmentData.officerId);
      setError('Selected officer not found');
      return;
    }
    
    console.log('✅ Selected officer:', selectedOfficer);

    try {
      setError('');
      setSuccess('');
      
      const assignRequest = {
        assignToUserId: parseInt(assignmentData.officerId),
        deadline: assignmentData.deadline ? new Date(assignmentData.deadline).toISOString() : null,
        comment: assignmentData.comment || 'Complaint assigned by admin'
      };

      console.log('📤 Sending assign request:', assignRequest);
      console.log('📋 Complaint ID:', assignmentData.complaintId);
      console.log('🌐 API URL will be:', `/complaints/assign/${assignmentData.complaintId}`);

      const response = await complaintService.assignComplaint(assignmentData.complaintId, assignRequest);
      console.log('✅ Assignment successful, response:', response);
      
      setSuccess('Complaint assigned successfully!');
      setTimeout(() => {
        setSuccess('');
        setShowAssignModal(false);
        // Clear assignment data
        setAssignmentData({
          complaintId: null,
          officerId: '',
          deadline: '',
          comment: ''
        });
      }, 2000);
      
      fetchComplaints();
      
      // Update the selected complaint if it's the one being assigned
      if (selectedComplaint && selectedComplaint.id === assignmentData.complaintId) {
        const officer = officers.find(o => o.id === parseInt(assignmentData.officerId));
        setSelectedComplaint(prev => ({
          ...prev, 
          status: 'ASSIGNED',
          assignedToUsername: officer ? officer.fullName : 'Unknown',
          deadline: assignmentData.deadline
        }));
      }
    } catch (err) {
      console.error('❌ Assignment Failed:', err);
      console.error('❌ Error Response Data:', err.response?.data);
      console.error('❌ Error Response Status:', err.response?.status);
      console.error('❌ Error Response Headers:', err.response?.headers);
      console.error('❌ Full Error Object:', err);
      
      let errorMessage = 'Failed to assign complaint';
      if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage += ': Access denied. Please check your permissions.';
      } else if (err.response?.status === 404) {
        errorMessage += ': Complaint or officer not found.';
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    }
  };

  const unassignComplaint = async (id) => {
    try {
      await complaintService.unassignComplaint(id);
      setSuccess('Complaint unassigned successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchComplaints();
      
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(prev => ({
          ...prev, 
          status: 'UNDER_REVIEW',
          assignedToUsername: null,
          deadline: null
        }));
      }
    } catch (err) {
      setError('Failed to unassign complaint');
      console.error(err);
    }
  };

  const markResolved = async (id) => {
    try {
      await complaintService.markResolved(id);
      setSuccess('Complaint marked as resolved');
      setTimeout(() => setSuccess(''), 3000);
      fetchComplaints();
      
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(prev => ({ ...prev, status: 'RESOLVED' }));
      }
    } catch (err) {
      setError('Failed to resolve complaint');
      console.error(err);
    }
  };

  // Escalation Functions
  const openEscalateModal = (complaintId) => {
    console.log('Opening escalate modal for complaint:', complaintId);
    setEscalationData({
      complaintId: complaintId,
      escalateToUserId: '',
      reason: '',
      priority: 'HIGH',
      comment: ''
    });
    setError('');
    setSuccess('');
    setShowEscalateModal(true);
  };

  const escalateComplaint = async () => {
    console.log('=== Escalation Process Started ===');
    console.log('Current escalationData:', escalationData);
    
    if (!escalationData.reason.trim()) {
      setError('Please provide a reason for escalation');
      return;
    }

    if (!escalationData.complaintId) {
      setError('No complaint selected for escalation');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const escalationRequest = {
        escalateToUserId: escalationData.escalateToUserId || null,
        reason: escalationData.reason,
        priority: escalationData.priority,
        comment: escalationData.comment || '',
        notifyImmediately: true
      };

      console.log('📤 Sending escalation request:', escalationRequest);
      console.log('📋 Complaint ID:', escalationData.complaintId);

      const response = await complaintService.escalateComplaint(escalationData.complaintId, escalationRequest);
      console.log('✅ Escalation successful, response:', response);
      
      setSuccess('Complaint escalated successfully!');
      setTimeout(() => {
        setSuccess('');
        setShowEscalateModal(false);
        setEscalationData({
          complaintId: null,
          escalateToUserId: '',
          reason: '',
          priority: 'HIGH',
          comment: ''
        });
      }, 2000);
      
      fetchComplaints();
      fetchEscalatedComplaints();
      
      // Update the selected complaint if it's the one being escalated
      if (selectedComplaint && selectedComplaint.id === escalationData.complaintId) {
        setSelectedComplaint(prev => ({
          ...prev, 
          status: 'ESCALATED',
          isEscalated: true,
          escalatedAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error('❌ Escalation Failed:', err);
      console.error('❌ Error Response Data:', err.response?.data);
      
      let errorMessage = 'Failed to escalate complaint';
      if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage += ': Access denied. Admin privileges required.';
      } else if (err.response?.status === 404) {
        errorMessage += ': Complaint not found.';
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    }
  };

  const deEscalateComplaint = async (id, comment) => {
    try {
      await complaintService.deEscalateComplaint(id, comment);
      setSuccess('Complaint de-escalated successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchComplaints();
      fetchEscalatedComplaints();
      
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(prev => ({
          ...prev, 
          status: prev.assignedToUsername ? 'ASSIGNED' : 'UNDER_REVIEW',
          isEscalated: false,
          escalatedAt: null,
          escalatedToUsername: null
        }));
      }
    } catch (err) {
      setError('Failed to de-escalate complaint');
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getCurrentComplaints = () => {
    switch (activeTab) {
      case 'escalated':
        return escalatedComplaints;
      case 'unresolved':
        return unresolvedComplaints;
      case 'all':
      default:
        return complaints;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'escalated':
        return `Escalated Complaints (${escalatedComplaints.length})`;
      case 'unresolved':
        return `Unresolved Complaints (${unresolvedComplaints.length})`;
      case 'all':
      default:
        return `All Complaints (${complaints.length})`;
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'escalated':
        return 'These are complaints that have been escalated to higher authorities due to severity, delays, or special handling requirements.';
      case 'unresolved':
        return 'These are complaints that may need escalation due to being overdue, stuck in progress, or unassigned for too long.';
      case 'all':
      default:
        return 'Complete overview of all complaints in the system.';
    }
  };

  const getRowBackgroundColor = (complaint) => {
    // Don't apply warning colors to completed, resolved, or closed complaints
    if (complaint.status === 'COMPLETED' || complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') {
      return 'transparent';
    }
    
    if (complaint.isEscalated) {
      return '#fff3cd'; // Escalated - yellow
    }
    
    if (complaint.deadline && new Date(complaint.deadline) < new Date()) {
      return '#f8d7da'; // Overdue - light red
    }
    
    // Check if complaint might be auto-escalated soon
    const now = new Date();
    const created = new Date(complaint.createdAt);
    const hoursOld = (now - created) / (1000 * 60 * 60);
    
    // Warning for complaints approaching auto-escalation thresholds
    if (!complaint.assignedToUsername && hoursOld > 36) { // 36 hours (approaching 48h threshold)
      return '#fff3cd'; // Warning yellow
    }
    
    if (complaint.urgency === 'HIGH' && hoursOld > 18) { // Approaching 24h threshold
      return '#ffe6e6'; // Light warning red
    }
    
    return 'transparent';
  };

  const getEscalationWarning = (complaint) => {
    // Don't show warnings for escalated or completed complaints
    if (complaint.isEscalated || complaint.status === 'COMPLETED' || complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') {
      return null;
    }
    
    const now = new Date();
    const created = new Date(complaint.createdAt);
    const hoursOld = (now - created) / (1000 * 60 * 60);
    
    if (!complaint.assignedToUsername && hoursOld > 36) {
      return { text: 'Auto-escalation in ~12h', color: '#f0ad4e' };
    }
    
    if (complaint.urgency === 'HIGH' && hoursOld > 18) {
      return { text: 'Auto-escalation in ~6h', color: '#d9534f' };
    }
    
    if (complaint.deadline && new Date(complaint.deadline) < new Date()) {
      const overdueDays = Math.floor((now - new Date(complaint.deadline)) / (1000 * 60 * 60 * 24));
      if (overdueDays >= 1) {
        return { text: 'Auto-escalation pending', color: '#d9534f' };
      }
    }
    
    return null;
  };

  const getStatusClass = (status) => {
    const map = {
      NEW: 'status-new',
      UNDER_REVIEW: 'status-under-review',
      IN_PROGRESS: 'status-in-progress',
      ESCALATED: 'status-escalated',
      RESOLVED: 'status-resolved',
      CLOSED: 'status-closed',
    };
    return map[status] || 'status-new';
  };

  const getChartData = () => {
    if (!complaints || complaints.length === 0) {
      return {
        categoryChartData: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        statusChartData: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
      };
    }

    const categoryStats = {};
    const statusStats = {};
    complaints.forEach((c) => {
      categoryStats[c.category] = (categoryStats[c.category] || 0) + 1;
      statusStats[c.status] = (statusStats[c.status] || 0) + 1;
    });

    const backgroundColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#2ECC71', '#E74C3C', '#3498DB', '#F1C40F', '#8E44AD',
    ];

    const categoryChartData = {
      labels: Object.keys(categoryStats),
      datasets: [{
        data: Object.values(categoryStats),
        backgroundColor: backgroundColors.slice(0, Object.keys(categoryStats).length),
        label: 'Categories',
      }],
    };

    const statusChartData = {
      labels: Object.keys(statusStats),
      datasets: [{
        data: Object.values(statusStats),
        backgroundColor: backgroundColors.slice(0, Object.keys(statusStats).length),
        label: 'Status',
      }],
    };

    return { categoryChartData, statusChartData };
  };

  const { categoryChartData, statusChartData } = getChartData();

  const currentComplaints = getCurrentComplaints();

  return (
      <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Admin Dashboard</h2>
        <button 
          onClick={() => setShowAutoEscalationDashboard(true)}
          className="btn"
          style={{
            backgroundColor: '#6f42c1', color: 'white', padding: '10px 20px',
            borderRadius: '6px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          🤖 Auto-Escalation System
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Navigation Tabs */}
      <div className="card">
        <div className="tab-navigation" style={{ 
          display: 'flex', 
          borderBottom: '2px solid #e0e0e0',
          marginBottom: '20px'
        }}>
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'all' ? '#007bff' : 'transparent',
              color: activeTab === 'all' ? 'white' : '#333',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'all' ? 'bold' : 'normal',
              marginRight: '5px'
            }}
          >
            📊 All Complaints ({complaints.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'escalated' ? 'active' : ''}`}
            onClick={() => setActiveTab('escalated')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'escalated' ? '#dc3545' : 'transparent',
              color: activeTab === 'escalated' ? 'white' : '#333',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'escalated' ? 'bold' : 'normal',
              marginRight: '5px'
            }}
          >
            🔺 Escalated ({escalatedComplaints.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'unresolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('unresolved')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'unresolved' ? '#ffc107' : 'transparent',
              color: activeTab === 'unresolved' ? 'black' : '#333',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'unresolved' ? 'bold' : 'normal'
            }}
          >
            ⚠️ Need Attention ({unresolvedComplaints.length})
          </button>
        </div>
        
        <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            <strong>{getTabTitle()}</strong> - {getTabDescription()}
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Filters</h3>
        <div className="filter-section" style={{ color:'black' }}>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">All Categories</option>
            <option value="TECHNICAL">Technical</option>
            <option value="BILLING">Billing</option>
            <option value="SERVICE_QUALITY">Service Quality</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PRODUCT_QUALITY">Product Quality</option>
            <option value="CUSTOMER_SERVICE">Customer Service</option>
            <option value="WEBSITE">Website</option>
            <option value="MOBILE_APP">Mobile App</option>
            <option value="SECURITY">Security</option>
            <option value="FEEDBACK">Feedback</option>
            <option value="OTHER">Other</option>
          </select>

          <select name="urgency" value={filters.urgency} onChange={handleFilterChange}>
            <option value="">All Urgency</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <button onClick={applyFilters} className="btn btn-primary">Apply Filters</button>
          <button onClick={clearFilters} className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }}>Clear</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Complaint Statistics</h3>
        {complaints && complaints.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ width: '45%' }}>
              <h4>Complaints by Category</h4>
              <div className="chart-container" style={{ height: 300 }}>
                <Pie
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { padding: 20 } },
                      title: { display: true, text: 'Distribution by Category' },
                    },
                  }}
                />
              </div>
            </div>

            <div style={{ width: '45%' }}>
              <h4>Complaints by Status</h4>
              <div className="chart-container" style={{ height: 300 }}>
                <Pie
                  data={statusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { padding: 20 } },
                      title: { display: true, text: 'Distribution by Status' },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p>No complaints data available to display statistics</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>{getTabTitle()}</h3>
        <div className="complaint-stats" style={{ marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {Object.entries(currentComplaints.reduce((acc, complaint) => {
            acc[complaint.status] = (acc[complaint.status] || 0) + 1;
            return acc;
          }, {})).map(([status, count]) => (
            <div key={status} className={`status-stat ${getStatusClass(status)}`} style={{ padding: 10, borderRadius: 5 }}>
              <strong>{status.replace('_', ' ')}:</strong> {count}
            </div>
          ))}
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
                <th>Assigned To</th>
                {activeTab === 'escalated' && <th>Escalated To</th>}
                <th>Deadline</th>
                <th>Date</th>
                {activeTab === 'escalated' && <th>Escalated Date</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentComplaints.map((c) => {
                const warning = getEscalationWarning(c);
                return (
                <tr key={c.id} style={{
                  backgroundColor: getRowBackgroundColor(c)
                }}>
                  <td>
                    {c.id}
                    {c.isEscalated && <span style={{ marginLeft: '5px', color: '#dc3545', fontSize: '12px' }}>🔺</span>}
                    {warning && (
                      <div style={{ fontSize: '10px', color: warning.color, fontWeight: 'bold', marginTop: '2px' }}>
                        ⚠️ {warning.text}
                      </div>
                    )}
                  </td>
                  <td>{c.username}</td>
                  <td>{c.category}</td>
                  <td style={{ maxWidth: 200 }}>{(c.description || '').substring(0, 50)}{(c.description || '').length > 50 ? '...' : ''}</td>
                  <td>
                    <span className={`urgency-badge urgency-${c.urgency.toLowerCase()}`}>
                      {c.urgency}
                    </span>
                  </td>
                  <td><span className={`status-badge ${getStatusClass(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                  <td>
                    {c.assignedToUsername ? (
                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                        {c.assignedToUsername}
                      </span>
                    ) : (
                      <span style={{ color: '#666', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  {activeTab === 'escalated' && (
                    <td>
                      {c.escalatedToUsername ? (
                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                          {c.escalatedToUsername}
                        </span>
                      ) : (
                        <span style={{ color: '#dc3545', fontStyle: 'italic' }}>General Escalation</span>
                      )}
                    </td>
                  )}
                  <td>
                    {c.deadline ? (
                      <span style={{ 
                        color: new Date(c.deadline) < new Date() ? '#d32f2f' : '#1976d2',
                        fontWeight: new Date(c.deadline) < new Date() ? 'bold' : 'normal'
                      }}>
                        {new Date(c.deadline).toLocaleDateString()}
                        {new Date(c.deadline) < new Date() && 
                          <span style={{ marginLeft: '5px', color: '#d32f2f' }}>⏰</span>}
                      </span>
                    ) : (
                      <span style={{ color: '#666' }}>-</span>
                    )}
                  </td>
                  <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                  {activeTab === 'escalated' && (
                    <td>
                      {c.escalatedAt ? (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                          {new Date(c.escalatedAt).toLocaleDateString()}
                        </span>
                      ) : '-'}
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setSelectedComplaint(c)} 
                        className="btn btn-primary" 
                        style={{ fontSize: 12, padding: '5px 10px' }}
                      >
                        View
                      </button>
                      {activeTab === 'unresolved' && !c.isEscalated && (
                        <button 
                          onClick={() => openEscalateModal(c.id)} 
                          className="btn" 
                          style={{ fontSize: 12, padding: '5px 10px', backgroundColor: '#dc3545', color: 'white' }}
                        >
                          🔺 Escalate
                        </button>
                      )}
                      {!c.assignedToUsername && c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                        <button 
                          onClick={() => openAssignModal(c.id)} 
                          className="btn" 
                          style={{ fontSize: 12, padding: '5px 10px', backgroundColor: '#4caf50', color: 'white' }}
                        >
                          Assign
                        </button>
                      )}
                      {c.assignedToUsername && c.status !== 'COMPLETED' && c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                        <button 
                          onClick={() => unassignComplaint(c.id)} 
                          className="btn" 
                          style={{ fontSize: 12, padding: '5px 10px', backgroundColor: '#ff9800', color: 'white' }}
                        >
                          Unassign
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
      </div>

      {selectedComplaint && (
        <div className="modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card modal-content" style={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto', margin: 20 }}>
            <h3>Complaint Details</h3>
            <div className="details">
              <p><strong>ID:</strong> {selectedComplaint.id}</p>
              <p><strong>User:</strong> {selectedComplaint.username}</p>
              <p><strong>Category:</strong> {selectedComplaint.category}</p>
              <p><strong>Urgency:</strong> 
                <span className={`urgency-badge urgency-${selectedComplaint.urgency.toLowerCase()}`} style={{ marginLeft: 10 }}>
                  {selectedComplaint.urgency}
                </span>
              </p>
              <p><strong>Status:</strong> <span className={`status-badge ${getStatusClass(selectedComplaint.status)}`}>{selectedComplaint.status.replace('_', ' ')}</span></p>
              
              {selectedComplaint.assignedToUsername && (
                <p><strong>Assigned To:</strong> 
                  <span style={{ color: '#2e7d32', fontWeight: 'bold', marginLeft: 10 }}>
                    {selectedComplaint.assignedToUsername}
                  </span>
                </p>
              )}
              
              {selectedComplaint.deadline && (
                <p><strong>Deadline:</strong> 
                  <span style={{ 
                    marginLeft: 10,
                    color: new Date(selectedComplaint.deadline) < new Date() ? '#d32f2f' : '#1976d2',
                    fontWeight: new Date(selectedComplaint.deadline) < new Date() ? 'bold' : 'normal'
                  }}>
                    {new Date(selectedComplaint.deadline).toLocaleString()}
                    {new Date(selectedComplaint.deadline) < new Date() && 
                      <span style={{ color: '#d32f2f', marginLeft: 5 }}>(OVERDUE)</span>}
                  </span>
                </p>
              )}

              {/* Escalation Information */}
              {selectedComplaint.isEscalated && (
                <div style={{ 
                  backgroundColor: '#fff3cd', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: '1px solid #ffeaa7',
                  margin: '10px 0'
                }}>
                  <p style={{ margin: '0 0 5px 0', color: '#856404', fontWeight: 'bold' }}>
                    🔺 <strong>ESCALATED COMPLAINT</strong>
                    {selectedComplaint.escalatedAt && 
                     selectedComplaint.escalatedAt.includes('AUTOMATED') && 
                     <span style={{ marginLeft: '10px', fontSize: '12px', backgroundColor: '#6f42c1', color: 'white', padding: '2px 6px', borderRadius: '3px' }}>
                       🤖 AUTO
                     </span>
                    }
                  </p>
                  {selectedComplaint.escalatedToUsername && (
                    <p style={{ margin: '0 0 5px 0' }}><strong>Escalated To:</strong> 
                      <span style={{ color: '#dc3545', fontWeight: 'bold', marginLeft: 5 }}>
                        {selectedComplaint.escalatedToUsername}
                      </span>
                    </p>
                  )}
                  {selectedComplaint.escalatedAt && (
                    <p style={{ margin: '0' }}><strong>Escalated On:</strong> 
                      <span style={{ marginLeft: 5 }}>
                        {new Date(selectedComplaint.escalatedAt).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              )}
              
              <p><strong>Created:</strong> {selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString() : '-'}</p>
              <p><strong>Description:</strong></p>
              <p className="description">{selectedComplaint.description}</p>
              <FileViewer attachmentPath={selectedComplaint.attachmentPath} />
            </div>

            <div style={{ 
              marginTop: 'var(--space-6)',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--gray-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--space-4)'
              }}>
                <h4 style={{ 
                  color: 'var(--gray-800)', 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  margin: 0
                }}>
                  ⚡ Admin Actions
                </h4>
                <div style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary-200)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--primary-700)'
                }}>
                  Current Status: <span className={`status-badge status-${selectedComplaint.status.toLowerCase()}`}>
                    {selectedComplaint.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="action-buttons" style={{ 
                display: 'flex', 
                gap: 'var(--space-3)', 
                flexWrap: 'wrap', 
                alignItems: 'center'
              }}>
                {/* Escalation Actions */}
                {!selectedComplaint.isEscalated && selectedComplaint.status !== 'RESOLVED' && selectedComplaint.status !== 'CLOSED' && (
                  <button 
                    onClick={() => openEscalateModal(selectedComplaint.id)} 
                    className="btn btn-danger btn-sm"
                  >
                    � Escalate
                  </button>
                )}
                
                {selectedComplaint.isEscalated && (
                  <button 
                    onClick={() => deEscalateComplaint(selectedComplaint.id, 'Resolved by admin')} 
                    className="btn btn-warning btn-sm"
                  >
                    � De-escalate
                  </button>
                )}
                
                {/* Assignment Actions */}
                {!selectedComplaint.assignedToUsername && selectedComplaint.status !== 'RESOLVED' && selectedComplaint.status !== 'CLOSED' && (
                  <button 
                    onClick={() => openAssignModal(selectedComplaint.id)} 
                    className="btn btn-success btn-sm"
                  >
                    👤 Assign to Officer
                  </button>
                )}
                
                {selectedComplaint.assignedToUsername && selectedComplaint.status !== 'COMPLETED' && selectedComplaint.status !== 'RESOLVED' && selectedComplaint.status !== 'CLOSED' && (
                  <button 
                    onClick={() => unassignComplaint(selectedComplaint.id)} 
                    className="btn btn-warning btn-sm"
                  >
                    🔄 Unassign
                  </button>
                )}
                
                {/* Status Actions */}
                {selectedComplaint.status === 'COMPLETED' && (
                  <button 
                    onClick={() => markResolved(selectedComplaint.id)} 
                    className="btn btn-success btn-sm"
                  >
                    ✅ Mark as Resolved
                  </button>
                )}
                
                {!selectedComplaint.isEscalated && selectedComplaint.status !== 'RESOLVED' && selectedComplaint.status !== 'CLOSED' && (
                  <button 
                    onClick={() => openEscalateModal(selectedComplaint.id)} 
                    className="btn btn-danger btn-sm"
                  >
                    🔺 Escalate Complaint
                  </button>
                )}
                
                {selectedComplaint.isEscalated && (
                  <button 
                    onClick={() => deEscalateComplaint(selectedComplaint.id, 'De-escalated by admin')} 
                    className="btn btn-warning btn-sm"
                  >
                    🔻 De-escalate
                  </button>
                )}
                
                <button 
                  onClick={() => updateStatus(selectedComplaint.id, 'UNDER_REVIEW')} 
                  className="btn btn-primary btn-sm"
                  disabled={selectedComplaint.status === 'UNDER_REVIEW'}
                >
                  🔍 Under Review
                </button>
                <button 
                  onClick={() => updateStatus(selectedComplaint.id, 'IN_PROGRESS')} 
                  className="btn btn-warning btn-sm"
                  disabled={selectedComplaint.status === 'IN_PROGRESS'}
                >
                  ⚙️ In Progress
                </button>
                <button 
                  onClick={() => updateStatus(selectedComplaint.id, 'CLOSED')} 
                  className="btn btn-secondary btn-sm"
                  disabled={selectedComplaint.status === 'CLOSED'}
                >
                  ❌ Close
                </button>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h4>Internal Notes</h4>
              {selectedComplaint.comments && selectedComplaint.comments.length > 0 ? (
                <ul>
                  {selectedComplaint.comments.map((c, idx) => <li key={idx} style={{ marginBottom: 5 }}>{c}</li>)}
                </ul>
              ) : <p>No internal notes yet</p>}

              <div className="form-group" style={{ marginTop: 10  }}>
                <textarea 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder="Add an internal note (visible to officers and admins only)..." 
                  style={{ minHeight: 60, width: '100%' }} 
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button onClick={() => addComment(selectedComplaint.id)} className="btn btn-primary">Add Internal Note</button>
                  <button onClick={() => setSelectedComplaint(null)} className="btn btn-danger" style={{ marginLeft: 'auto' }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card modal-content" style={{ maxWidth: 500, margin: 20 }}>
            <h3>Assign Complaint to Officer</h3>
            
            {error && (
              <div style={{ 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                padding: 10, 
                borderRadius: 4, 
                marginBottom: 15, 
                border: '1px solid #ef5350' 
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                color: '#2e7d32', 
                padding: 10, 
                borderRadius: 4, 
                marginBottom: 15, 
                border: '1px solid #4caf50' 
              }}>
                {success}
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 15 }}>
              <label><strong>Select Officer:</strong></label>
              <select 
                value={assignmentData.officerId} 
                onChange={(e) => setAssignmentData(prev => ({ ...prev, officerId: e.target.value }))}
                style={{ width: '100%', padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 4 }}
              >
                <option value="">Choose an officer...</option>
                {officers.map(officer => (
                  <option key={officer.id} value={officer.id}>
                    {officer.fullName} ({officer.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 15 }}>
              <label><strong>Deadline (Optional):</strong></label>
              <input
                type="datetime-local"
                value={assignmentData.deadline}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, deadline: e.target.value }))}
                style={{ width: '100%', padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 4 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 15 }}>
              <label><strong>Assignment Comment (Optional):</strong></label>
              <textarea
                value={assignmentData.comment}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Add a comment about this assignment..."
                style={{ width: '100%', minHeight: 60, padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 4 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="btn" 
                style={{ backgroundColor: '#6c757d', color: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Assign button clicked');
                  console.log('Current assignment data:', assignmentData);
                  assignComplaint();
                }} 
                className="btn btn-primary"
                disabled={!assignmentData.officerId}
              >
                Assign Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card modal-content" style={{ maxWidth: 500, margin: 20 }}>
            <h3>🔺 Escalate Complaint</h3>
            
            {error && (
              <div style={{ 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                padding: 10, 
                borderRadius: 4, 
                marginBottom: 15, 
                border: '1px solid #ef5350' 
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                color: '#2e7d32', 
                padding: 10, 
                borderRadius: 4, 
                marginBottom: 15, 
                border: '1px solid #4caf50' 
              }}>
                {success}
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 15 }}>
              <label><strong>Escalation Reason: <span style={{color: 'red'}}>*</span></strong></label>
              <select 
                value={escalationData.reason} 
                onChange={(e) => setEscalationData(prev => ({ ...prev, reason: e.target.value }))}
                style={{ width: '100%', padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 4 }}
              >
                <option value="">Select escalation reason...</option>
                <option value="Overdue Deadline">Overdue Deadline - Past deadline without resolution</option>
                <option value="High Priority">High Priority - Requires immediate attention</option>
                <option value="Complex Issue">Complex Issue - Needs senior expertise</option>
                <option value="Customer Escalation">Customer Escalation - Escalated by customer</option>
                <option value="Unresponsive Officer">Unresponsive Officer - No progress updates</option>
                <option value="Resource Constraints">Resource Constraints - Needs additional resources</option>
                <option value="Policy Decision">Policy Decision - Requires management decision</option>
                <option value="Legal/Compliance">Legal/Compliance - Legal or compliance issue</option>
                <option value="Other">Other - See additional comments</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 15 }}>
              <label><strong>Priority Level:</strong></label>
              <select 
                value={escalationData.priority} 
                onChange={(e) => setEscalationData(prev => ({ ...prev, priority: e.target.value }))}
                style={{ width: '100%', padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 4 }}
              >
                <option value="HIGH">🟡 HIGH - Standard escalation</option>
                <option value="URGENT">🟠 URGENT - Requires quick action</option>
                <option value="CRITICAL">🔴 CRITICAL - Immediate attention required</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 15 }}>
              <label><strong>Escalate To (Optional):</strong></label>
              <select 
                value={escalationData.escalateToUserId} 
                onChange={(e) => setEscalationData(prev => ({ ...prev, escalateToUserId: e.target.value }))}
                style={{ width: '100%', padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 4 }}
              >
                <option value="">General escalation (no specific user)</option>
                {officersAndAdmins.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email}) - {user.roles || 'Officer/Admin'}
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Leave blank for general escalation, or select a specific admin/officer to handle this escalation.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: 15 }}>
              <label><strong>Additional Comments:</strong></label>
              <textarea
                value={escalationData.comment}
                onChange={(e) => setEscalationData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Provide additional context about why this complaint needs escalation..."
                style={{ width: '100%', minHeight: 80, padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 4 }}
              />
            </div>

            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              border: '1px solid #ffeaa7'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                <strong>⚠️ Note:</strong> Escalating this complaint will mark it as "ESCALATED" status and notify relevant stakeholders. 
                This action will be recorded in the complaint timeline.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowEscalateModal(false)} 
                className="btn" 
                style={{ backgroundColor: '#6c757d', color: 'white' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Escalate button clicked');
                  console.log('Current escalation data:', escalationData);
                  escalateComplaint();
                }} 
                className="btn btn-danger"
                disabled={!escalationData.reason}
                style={{
                  backgroundColor: !escalationData.reason ? '#ccc' : '#dc3545',
                  cursor: !escalationData.reason ? 'not-allowed' : 'pointer'
                }}
              >
                🔺 Escalate Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Escalation Dashboard */}
      {showAutoEscalationDashboard && (
        <AutoEscalationDashboard onClose={() => setShowAutoEscalationDashboard(false)} />
      )}

      {/* Additional CSS for new elements */}
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
      `}</style>
    </div>
  );
};

export default AdminDashboard;
