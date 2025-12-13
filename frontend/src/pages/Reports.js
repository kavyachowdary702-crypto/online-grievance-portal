import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './Reports.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState({ csv: false, pdf: false });
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    categories: [],
    statuses: [],
    urgencies: [],
    assignedTo: '',
    includeAnonymous: true,
    groupBy: 'category'
  });

  // Add connection status check
  const [connectionStatus, setConnectionStatus] = useState('checking');
  
  const checkConnection = async () => {
    try {
      await reportService.getFilterOptions();
      setConnectionStatus('connected');
    } catch (err) {
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Check if user has access - improved role checking
  const hasAccess = React.useMemo(() => {
    if (!user) return false;
    
    // Handle different possible role formats
    const userRoles = user.roles || [];
    const hasAdminRole = isAdmin() || userRoles.includes('ADMIN') || userRoles.includes('ROLE_ADMIN');
    const hasOfficerRole = isOfficer() || userRoles.includes('OFFICER') || userRoles.includes('ROLE_OFFICER');
    
    return hasAdminRole || hasOfficerRole;
  }, [user, isAdmin, isOfficer]);
  
  // Add debug logging
  React.useEffect(() => {
    if (user) {
      console.log('Reports - Current user:', user);
      console.log('Reports - User roles:', user.roles);
      console.log('Reports - Roles type:', typeof user.roles, Array.isArray(user.roles));
      console.log('Reports - isAdmin():', isAdmin());
      console.log('Reports - isOfficer():', isOfficer());
      console.log('Reports - hasAccess:', hasAccess);
      
      // Test individual role checks
      const userRoles = user.roles || [];
      console.log('Reports - Role checks:');
      console.log('  - ADMIN in roles:', userRoles.includes('ADMIN'));
      console.log('  - ROLE_ADMIN in roles:', userRoles.includes('ROLE_ADMIN'));
      console.log('  - OFFICER in roles:', userRoles.includes('OFFICER'));
      console.log('  - ROLE_OFFICER in roles:', userRoles.includes('ROLE_OFFICER'));
    } else {
      console.log('Reports - No user found');
    }
  }, [user, isAdmin, isOfficer, hasAccess]);

  useEffect(() => {
    if (hasAccess) {
      loadInitialData();
    }
  }, [hasAccess]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log('Loading dashboard data with filters:', filters);
      
      const [dashboardResponse, filtersResponse] = await Promise.all([
        reportService.getDashboardStats(filters),
        reportService.getFilterOptions()
      ]);
      
      console.log('Dashboard response:', dashboardResponse);
      console.log('Filters response:', filtersResponse);
      
      setDashboardData(dashboardResponse.data);
      setFilterOptions(filtersResponse.data);
    } catch (err) {
      console.error('Dashboard loading error details:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to load dashboard data';
      
      if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = '🔌 Cannot connect to server. Please ensure the backend is running on port 8081.';
      } else if (err.response?.status === 401) {
        errorMessage = '🔐 Authentication failed. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = '⛔ Access denied. You need Admin or Officer privileges.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('Applying filters:', filters);
      const response = await reportService.getDashboardStats(filters);
      console.log('Filter response:', response);
      
      setDashboardData(response.data);
      
      // Show success message briefly
      const successMsg = 'Filters applied successfully!';
      setError(successMsg);
      setTimeout(() => setError(null), 2000);
      
    } catch (err) {
      console.error('Filter error details:', err);
      
      let errorMessage = 'Failed to apply filters';
      
      if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = '🔌 Cannot connect to server. Please ensure the backend is running.';
      } else if (err.response?.status === 401) {
        errorMessage = '🔐 Session expired. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = '⛔ Access denied. You need proper privileges.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(prev => ({ ...prev, [format]: true }));
      
      console.log(`Starting ${format.toUpperCase()} export with filters:`, filters);
      
      let response;
      if (format === 'csv') {
        response = await reportService.exportCSV(filters);
      } else {
        response = await reportService.exportPDF(filters);
      }
      
      console.log(`${format.toUpperCase()} export response:`, response);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `complaints_report_${filters.startDate}_to_${filters.endDate}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`${format.toUpperCase()} export completed successfully`);
      
    } catch (err) {
      console.error(`${format.toUpperCase()} export error details:`, err);
      console.error('Error response:', err.response);
      setError(`Failed to export ${format.toUpperCase()}: ` + (err.response?.data?.message || err.message));
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }));
    }
  };

  const resetFilters = async () => {
    const defaultFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      categories: [],
      statuses: [],
      urgencies: [],
      assignedTo: '',
      includeAnonymous: true,
      groupBy: 'category'
    };
    
    setFilters(defaultFilters);
    
    // Auto-apply default filters
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getDashboardStats(defaultFilters);
      setDashboardData(response.data);
      
      // Show success message
      setError('Filters reset successfully!');
      setTimeout(() => setError(null), 1500);
      
    } catch (err) {
      console.error('Reset error:', err);
      setError('Failed to reset filters: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const getComplaintsTrendChart = () => {
    if (!dashboardData?.complaintsByDate) return null;
    
    return {
      labels: dashboardData.complaintsByDate.map(item => item.date),
      datasets: [
        {
          label: 'Total Complaints',
          data: dashboardData.complaintsByDate.map(item => item.count),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Resolved',
          data: dashboardData.complaintsByDate.map(item => item.resolved),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  const getCategoryChart = () => {
    if (!dashboardData?.complaintsByCategory) return null;
    
    return {
      labels: dashboardData.complaintsByCategory.map(item => item.category),
      datasets: [
        {
          label: 'Complaints by Category',
          data: dashboardData.complaintsByCategory.map(item => item.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)'
          ]
        }
      ]
    };
  };

  const getStatusChart = () => {
    if (!dashboardData?.complaintsByStatus) return null;
    
    return {
      labels: dashboardData.complaintsByStatus.map(item => item.status),
      datasets: [
        {
          data: dashboardData.complaintsByStatus.map(item => item.count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ]
        }
      ]
    };
  };

  if (!hasAccess) {
    return (
      <div className="reports-container">
        <div className="reports-content">
          <div className="access-denied">
            <h2>🔐 Access Denied</h2>
            <p>You need Admin or Officer privileges to access reports.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className="reports-container">
        <div className="reports-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-content">
        <div className="reports-header">
          <div className="header-content">
            <h1 className="reports-title"> 📊 Reports & Analytics</h1>
            <p className="reports-subtitle">Complaint trends, performance metrics, and export tools</p>
          </div>
          <div className="connection-status">
            <div className={`status-indicator ${connectionStatus}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {connectionStatus === 'connected' && '🟢 Connected'}
                {connectionStatus === 'disconnected' && '🔴 Disconnected'}
                {connectionStatus === 'checking' && '🟡 Checking...'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className={`message ${error.includes('successfully') || error.includes('🔌') ? 'message-info' : 'message-error'}`}>
            <p>{error}</p>
            {error.includes('🔌') && (
              <div className="connection-help">
                <p><strong>Quick Fix:</strong></p>
                <ol>
                  <li>Open a terminal in the backend folder</li>
                  <li>Run: <code>mvn spring-boot:run</code></li>
                  <li>Wait for "Started ResolveItApplication" message</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
            {(error.includes('🔐') || error.includes('⛔')) && (
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
                style={{ marginTop: '10px' }}
              >
                Refresh Page
              </button>
            )}
          </div>
        )}

        {/* Filters Section */}
        <div className="filters-card">
          <h2 className="filters-title">Filters</h2>
          
          <div className="filters-grid">
            {/* Date Range */}
            <div className="filter-group">
              <label className="filter-label">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Categories */}
            {filterOptions?.categories && (
              <div className="filter-group">
                <label className="filter-label">Categories</label>
                <select
                  multiple
                  value={filters.categories}
                  onChange={(e) => handleFilterChange('categories', Array.from(e.target.selectedOptions, option => option.value))}
                  className="filter-select"
                  style={{ height: '80px' }}
                >
                  {filterOptions.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Statuses */}
            {filterOptions?.statuses && (
              <div className="filter-group">
                <label className="filter-label">Statuses</label>
                <select
                  multiple
                  value={filters.statuses}
                  onChange={(e) => handleFilterChange('statuses', Array.from(e.target.selectedOptions, option => option.value))}
                  className="filter-select"
                  style={{ height: '80px' }}
                >
                  {filterOptions.statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="filters-actions">
            <div className="filters-buttons">
              <button
                onClick={applyFilters}
                disabled={loading}
                className={`btn-primary ${loading ? 'btn-disabled' : ''}`}
              >
                {loading ? 'Applying...' : 'Apply Filters'}
              </button>
              
              <button
                onClick={resetFilters}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? 'Resetting...' : 'Reset'}
              </button>
              
              <button
                onClick={loadInitialData}
                disabled={loading}
                className="btn-retry"
                title="Retry loading dashboard data"
              >
                {loading ? '🔄' : '🔄 Retry'}
              </button>
            </div>

            {/* Export buttons */}
            <div className="export-buttons">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting.csv || loading}
                className={`btn-export-csv ${(exporting.csv || loading) ? 'btn-disabled' : ''}`}
              >
                {exporting.csv ? 'Exporting...' : 'Export CSV'}
              </button>
              
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting.pdf || loading}
                className={`btn-export-pdf ${(exporting.pdf || loading) ? 'btn-disabled' : ''}`}
              >
                {exporting.pdf ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        {dashboardData && (
          <>
            {/* Summary Statistics */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3 className="stat-title">Total Complaints</h3>
                <p className="stat-value total">{dashboardData.totalComplaints}</p>
              </div>
              
              <div className="stat-card">
                <h3 className="stat-title">Resolution Rate</h3>
                <p className="stat-value resolution">{dashboardData.resolutionRate?.toFixed(1)}%</p>
              </div>
              
              <div className="stat-card">
                <h3 className="stat-title">Avg Resolution Days</h3>
                <p className="stat-value average">{dashboardData.averageResolutionDays?.toFixed(1)}</p>
              </div>
              
              <div className="stat-card">
                <h3 className="stat-title">Escalated</h3>
                <p className="stat-value escalated">{dashboardData.escalatedComplaints}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              {/* Complaints Trend */}
              <div className="chart-card">
                <h3 className="chart-title">📈 Complaints Trend</h3>
                {getComplaintsTrendChart() && (
                  <div className="chart-container">
                    <Line 
                      data={getComplaintsTrendChart()} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top'
                          }
                        },
                        elements: {
                          point: {
                            radius: 6,
                            hoverRadius: 8
                          }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Category Distribution */}
              <div className="chart-card">
                <h3 className="chart-title">📋 Complaints by Category</h3>
                {getCategoryChart() && (
                  <div className="chart-container">
                    <Bar 
                      data={getCategoryChart()} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Status Distribution */}
              <div className="chart-card">
                <h3 className="chart-title">🎯 Status Distribution</h3>
                {getStatusChart() && (
                  <div className="chart-container">
                    <Doughnut 
                      data={getStatusChart()} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Officer Performance */}
              {dashboardData.officerPerformance && dashboardData.officerPerformance.length > 0 && (
                <div className="chart-card">
                  <h3 className="chart-title">👮‍♂️ Officer Performance</h3>
                  <div className="performance-list">
                    {dashboardData.officerPerformance.slice(0, 5).map((officer, index) => (
                      <div key={index} className="performance-item">
                        <div className="officer-info">
                          <h4>{officer.officerName}</h4>
                          <p>{officer.resolvedComplaints}/{officer.assignedComplaints} resolved</p>
                        </div>
                        <div className="officer-stats">
                          <p className="resolution-rate">{officer.resolutionRate?.toFixed(1)}%</p>
                          <p className="avg-days">{officer.averageResolutionDays?.toFixed(1)} days avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Details Table */}
            {dashboardData.complaintsByCategory && dashboardData.complaintsByCategory.length > 0 && (
              <div className="table-card">
                <h3 className="chart-title">📊 Category Breakdown</h3>
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Total</th>
                        <th>Resolved</th>
                        <th>Resolution Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.complaintsByCategory.map((category, index) => (
                        <tr key={index}>
                          <td>{category.category}</td>
                          <td>{category.count}</td>
                          <td>{category.resolved}</td>
                          <td>
                            <span className={`resolution-badge ${
                              category.resolutionRate >= 80 ? 'high' :
                              category.resolutionRate >= 60 ? 'medium' : 'low'
                            }`}>
                              {category.resolutionRate?.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;