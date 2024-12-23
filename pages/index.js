import React, { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCompress = async () => {
    if (!file) return alert('Please select a file');
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/compress', {
      method: 'POST',
      body: formData,
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setIsProcessing(false);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Media Compressor</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleCompress} disabled={isProcessing}>
        {isProcessing ? 'Compressing...' : 'Compress'}
      </button>
      {downloadUrl && (
        <div>
          <a href={downloadUrl} download="compressed-media.mp4">Download Compressed Media</a>
        </div>
      )}
    </div>
  );
}
