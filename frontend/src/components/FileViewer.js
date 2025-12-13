import React, { useState } from 'react';

const FileViewer = ({ attachmentPath }) => {
  const [error, setError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  if (!attachmentPath) return null;

  const fileUrl = `http://localhost:8081/api/complaints/files/${attachmentPath}`;
  const token = localStorage.getItem('token');
  
  // Get file extension
  const extension = attachmentPath.split('.').pop().toLowerCase();
  
  // Check if it's an image
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const isImage = imageExtensions.includes(extension);
  
  // Check if it's a video
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
  const isVideo = videoExtensions.includes(extension);
  
  // Check if it's a document
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt'];
  const isDocument = documentExtensions.includes(extension);

  const handleError = () => {
    setError(true);
  };

  const downloadFile = () => {
    fetch(fileUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachmentPath;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(err => {
      console.error('Download failed:', err);
      alert('Failed to download file');
    });
  };

  if (error) {
    return (
      <div style={{ padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        <p style={{ color: '#c62828', margin: 0 }}>
          <strong>Attachment:</strong> {attachmentPath}
          <button 
            onClick={downloadFile}
            style={{ 
              marginLeft: '10px', 
              padding: '4px 8px', 
              backgroundColor: '#2196f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📥 Download
          </button>
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <strong>Attachment:</strong>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setShowPreview(true)}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              👁️ Preview
            </button>
            <button 
              onClick={downloadFile}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#2196f3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📥 Download
            </button>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>📎 {attachmentPath}</p>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 20px',
              borderBottom: '1px solid #e0e0e0',
              flexShrink: 0
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📎 File Preview</h3>
              <button 
                onClick={() => setShowPreview(false)}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '20px',
              overflow: 'auto',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              {isImage && (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={fileUrl}
                    alt="Attachment Preview"
                    onError={handleError}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '70vh', 
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px', marginBottom: 0 }}>{attachmentPath}</p>
                </div>
              )}
              
              {isVideo && (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <video 
                    controls 
                    onError={handleError}
                    style={{ 
                      width: '100%',
                      maxHeight: '70vh', 
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                    autoPlay
                  >
                    <source src={fileUrl} type={`video/${extension}`} />
                    Your browser does not support the video tag.
                  </video>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px', marginBottom: 0 }}>{attachmentPath}</p>
                </div>
              )}
              
              {isDocument && (
                <div style={{ width: '100%' }}>
                  <p style={{ margin: '0 0 10px 0', color: '#333' }}>
                    📄 <strong>{attachmentPath}</strong>
                  </p>
                  {extension === 'pdf' && (
                    <iframe 
                      src={fileUrl}
                      onError={handleError}
                      style={{ 
                        width: '100%', 
                        height: '70vh', 
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                      title="PDF Viewer"
                    />
                  )}
                  {(extension === 'doc' || extension === 'docx') && (
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#666', margin: '10px 0' }}>
                        📄 This is a {extension.toUpperCase()} document
                      </p>
                      <p style={{ color: '#999', fontSize: '12px', margin: '10px 0' }}>
                        Document preview is not available in the browser. Please download the file to view it.
                      </p>
                      <button 
                        onClick={downloadFile}
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: '#2196f3', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        📥 Download to View
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {!isImage && !isVideo && !isDocument && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  <p style={{ color: '#666', margin: '10px 0' }}>
                    📎 <strong>{attachmentPath}</strong>
                  </p>
                  <p style={{ color: '#999', fontSize: '12px', margin: '10px 0' }}>
                    Preview not available for this file type
                  </p>
                  <button 
                    onClick={downloadFile}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#2196f3', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📥 Download File
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              borderTop: '1px solid #e0e0e0',
              padding: '15px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              backgroundColor: '#f9f9f9'
            }}>
              <span style={{ fontSize: '12px', color: '#666' }}>
                File: <strong>{attachmentPath}</strong>
              </span>
              <button 
                onClick={downloadFile}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileViewer;
