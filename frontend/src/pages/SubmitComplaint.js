import React, { useState } from 'react';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SubmitComplaint = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    urgency: 'LOW',
    anonymous: false
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Check file size (50MB = 50 * 1024 * 1024 bytes)
      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('File size exceeds 50MB. Please choose a smaller file.');
        e.target.value = ''; // Reset input
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'image/', 'video/', 'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      const isAllowed = allowedTypes.some(type => selectedFile.type.startsWith(type));
      if (!isAllowed) {
        setError('Invalid file type. Please upload an image, video, PDF, or DOC file.');
        e.target.value = ''; // Reset input
        return;
      }
      
      setError(''); // Clear any previous errors
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('urgency', formData.urgency);
      data.append('anonymous', formData.anonymous);
      if (file) {
        data.append('file', file);
      }

      await complaintService.createComplaint(data);
      setSuccess('Complaint submitted successfully! You can track it in "My Complaints"');
      setFormData({ category: '', description: '', urgency: 'LOW', anonymous: false });
      setFile(null);
      e.target.reset();
    } catch (err) {
      console.error('Error submitting complaint:', err);
      if (err.response?.status === 413) {
        setError('File size is too large. Please upload a file smaller than 50MB.');
      } else if (err.response?.status === 415) {
        setError('Unsupported file type. Please upload an image, video, PDF, or DOC file.');
      } else {
        setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
      }
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '700px', margin: '50px auto' }}>
        <h2>Submit Complaint</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Logged in as: <strong>{user?.username}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select Category</option>
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
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe your complaint in detail..."
            />
          </div>
          <div className="form-group">
            <label>Urgency</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange} required>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Attachment (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Supported formats: Images, Videos (MP4, AVI, MOV, etc.), PDF, DOC, DOCX. Max size: 50MB
            </small>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="anonymous"
                checked={formData.anonymous}
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              Submit as Anonymous (won't be able to track)
            </label>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Submit Complaint
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
