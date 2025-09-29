const FileUploadSection = ({ file, setFile, required }) => (
  <div className="border rounded-lg p-4">
    <h3 className="text-lg font-semibold mb-4">File Upload</h3>
    <input
      type="file"
      onChange={(e) => setFile(e.target.files?.[0] || null)}
      className="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100"
    />
    {required && !file && (
      <p className="text-red-500 text-sm mt-2">File upload is required</p>
    )}
  </div>
);

export default FileUploadSection;
