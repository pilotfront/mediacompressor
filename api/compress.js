const multer = require('multer');
const express = require('express');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: '/tmp/uploads/' });

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(500).send('File upload failed.');
      }

      const file = req.file;
      if (!file) {
        return res.status(400).send('No file uploaded.');
      }

      // Example response to indicate file upload success
      res.status(200).send('File uploaded successfully!');
    });
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
