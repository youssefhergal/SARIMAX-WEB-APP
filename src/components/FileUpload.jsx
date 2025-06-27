import { createSignal } from 'solid-js';
import { useApp } from '../context/AppContext';

function FileUpload(props) {
  const { handleTrainFileUpload, handleTestFileUpload, trainFile, testFile } = useApp();
  const [isDragOver, setIsDragOver] = createSignal(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (props.type === 'train') {
        handleTrainFileUpload(file);
      } else {
        handleTestFileUpload(file);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (props.type === 'train') {
        handleTrainFileUpload(file);
      } else {
        handleTestFileUpload(file);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const currentFile = () => {
    return props.type === 'train' ? trainFile() : testFile();
  };

  const fileName = () => {
    const file = currentFile();
    return file ? file.name : null;
  };

  return (
    <div class="space-y-2">
      <label class="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <i class={props.icon + " text-gradient-start"}></i>
        <span>{props.label}</span>
      </label>
      
      <div
        class="file-upload-zone"
        classList={{
          'dragover': isDragOver(),
          'border-green-300 bg-green-50': fileName()
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById(`file-${props.type}`).click()}
      >
        <input
          id={`file-${props.type}`}
          type="file"
          accept={props.accept}
          onChange={handleFileSelect}
          class="hidden"
        />
        
        <div class="flex flex-col items-center space-y-2">
          <i class={`fas ${fileName() ? 'fa-check-circle text-green-500' : 'fa-cloud-upload-alt text-gray-400'} text-2xl`}></i>
          
          <div class="text-center">
            {fileName() ? (
              <>
                <p class="text-sm font-medium text-green-700">{fileName()}</p>
                <p class="text-xs text-green-600">File uploaded successfully</p>
              </>
            ) : (
              <>
                <p class="text-sm font-medium text-gray-600">
                  Drop your {props.label.toLowerCase()} here
                </p>
                <p class="text-xs text-gray-500">
                  or click to browse ({props.accept})
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUpload; 