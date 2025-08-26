const { BlobServiceClient } = require('@azure/storage-blob');
const stream = require('stream');

// Azure Blob Storage Configuration
const connectionString = process.env.ACCOUNT_STRING;
const containerName = process.env.CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Upload an image file to Azure Blob Storage
 * @param {object} file - The file object from multer (req.file)
 * @param {string} originalName - The original file name (used to determine file extension)
 * @param {string} category - The category of the product
 * @returns {Promise<string>} - The URL of the uploaded blob
 */
async function uploadImageToBlobStorage(file, originalName, category) {
  // Generate a unique blob name
  const extension = "png"; // Extract file extension
  const blobName = `${category}/${Date.now()}-${originalName}.${extension}`;
  const streamBuffer = new stream.PassThrough();
  streamBuffer.end(file.buffer); // Convert buffer to readable stream

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blockBlobClient.uploadStream(streamBuffer, file.buffer.length);
    return `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobName}`;
  } catch (error) {
    console.error(`Failed to upload image: ${error.message}`);
    throw new Error('Image upload failed');
  }
}

/**
 * Delete an image from Azure Blob Storage
 * @param {string} blobUrl - The URL of the blob to delete
 * @returns {Promise<void>}
 */
async function deleteImageFromBlobStorage(blobUrl) {
  try {
    // Extract the blob name from the URL
    const urlParts = blobUrl.split('/');
    const blobName = urlParts.slice(4).join('/'); // Adjust the index based on the URL structure
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.delete();
    console.log(`Successfully deleted image: ${blobUrl}`);
  } catch (error) {
    console.error(`Failed to delete image: ${error.message}`);
    throw new Error('Image deletion failed');
  }
}


module.exports = {
  uploadImageToBlobStorage,
  deleteImageFromBlobStorage
};