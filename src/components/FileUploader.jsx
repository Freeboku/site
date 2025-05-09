
import React, { useState, useRef } from "react";
import { Upload, X, FileArchive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import JSZip from 'jszip';

const FileUploader = ({ onFilesUploaded, onZipExtracted, acceptZip = false, customMessage }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const extractChapterNumberFromName = (folderName) => {
    const cleanedName = folderName.replace(/\/$/, ''); 
    const match = cleanedName.match(/(\d+(\.\d+)?)/);
    return match ? match[1] : null;
  };

  const processZipFile = async (zipFile) => {
    console.log("Processing ZIP file:", zipFile.name);
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const extractedChapters = [];
      const chapterFolders = {};

      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) {
          const chapterNumber = extractChapterNumberFromName(zipEntry.name);
          if (chapterNumber) {
            console.log(`Found chapter folder: ${zipEntry.name} -> Chapter Number: ${chapterNumber}`);
            if (!chapterFolders[chapterNumber]) {
              chapterFolders[chapterNumber] = {
                id: Math.random().toString(36).substring(2, 11),
                number: chapterNumber,
                pages: [],
                thumbnailFile: null,
                thumbnailPreview: '',
                uploadProgress: 0,
                uploadStatus: null,
                uploadError: null,
                rawFolderName: zipEntry.name
              };
            }
          }
        }
      });
      
      const pageProcessingPromises = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && (zipEntry.name.match(/\.(jpg|jpeg|png|webp)$/i))) {
          const pathParts = relativePath.split('/');
          if (pathParts.length > 1) {
            const potentialChapterFolderName = pathParts.slice(0, -1).join('/') + '/';
            let chapterNumberForPage = null;

            for (const num in chapterFolders) {
                if (chapterFolders[num].rawFolderName === potentialChapterFolderName) {
                    chapterNumberForPage = num;
                    break;
                }
            }
            
            if (chapterNumberForPage && chapterFolders[chapterNumberForPage]) {
              console.log(`Found page: ${zipEntry.name} for chapter folder: ${potentialChapterFolderName} (Chapter ${chapterNumberForPage})`);
              pageProcessingPromises.push(
                zipEntry.async('blob').then(blob => {
                  const file = new File([blob], pathParts.pop(), { type: blob.type });
                  chapterFolders[chapterNumberForPage].pages.push({
                    file,
                    preview: URL.createObjectURL(file),
                    id: Math.random().toString(36).substring(2, 11),
                    name: file.name,
                    size: file.size,
                    uploadDate: new Date().toISOString()
                  });
                  console.log(`Added page ${file.name} to Chapter ${chapterNumberForPage}`);
                }).catch(err => console.error(`Error processing page ${zipEntry.name}:`, err))
              );
            } else {
               console.log(`Skipping page ${zipEntry.name}, no matching chapter folder found or chapter number not extracted for folder ${potentialChapterFolderName}`);
            }
          }
        }
      });

      await Promise.all(pageProcessingPromises);
      console.log("All page processing promises resolved.");

      for (const chapterNumber in chapterFolders) {
        const chapter = chapterFolders[chapterNumber];
        if (chapter.pages.length > 0) {
          chapter.pages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
          extractedChapters.push(chapter);
          console.log(`Chapter ${chapter.number} has ${chapter.pages.length} pages after sorting.`);
        } else {
          console.log(`Chapter ${chapter.number} has no pages, not adding to extractedChapters.`);
        }
      }
      
      if (extractedChapters.length > 0) {
        extractedChapters.sort((a,b) => parseFloat(a.number) - parseFloat(b.number));
        console.log("Final extracted chapters:", extractedChapters);
        onZipExtracted(extractedChapters);
        toast({
          title: "ZIP Traité",
          description: `${extractedChapters.length} chapitre(s) avec des pages extrait(s) du fichier ZIP.`,
        });
      } else {
        console.log("No valid chapters with pages found in ZIP.");
        toast({
          title: "ZIP Vide ou Invalide",
          description: "Aucun chapitre valide (ex: 'Chapitre 01') avec des images n'a été trouvé dans le ZIP, ou les dossiers de chapitre étaient vides.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing ZIP file:", error);
      toast({
        title: "Erreur ZIP",
        description: `Impossible de traiter le fichier ZIP: ${error.message}`,
        variant: "destructive",
      });
    }
  };


  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (acceptZip && droppedFiles.length === 1 && droppedFiles[0].name.endsWith('.zip')) {
      processZipFile(droppedFiles[0]);
    } else {
      const imageFiles = droppedFiles.filter(file => 
        file.type.startsWith("image/")
      );
      
      if (imageFiles.length === 0 && !acceptZip) {
        toast({
          title: "Erreur",
          description: "Veuillez déposer uniquement des fichiers image.",
          variant: "destructive",
        });
        return;
      }
      if (imageFiles.length > 0) addFiles(imageFiles);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (acceptZip && selectedFiles.length === 1 && selectedFiles[0].name.endsWith('.zip')) {
      processZipFile(selectedFiles[0]);
    } else {
      addFiles(selectedFiles.filter(file => file.type.startsWith("image/")));
    }
    e.target.value = null; 
  };

  const addFiles = (newFiles) => {
    const filesWithPreviews = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
      size: file.size,
      uploadDate: new Date().toISOString()
    }));
    
    const updatedFiles = [...files, ...filesWithPreviews];
    setFiles(updatedFiles);
    
    if (onFilesUploaded) {
      onFilesUploaded(updatedFiles);
    }
  };

  const removeFile = (idToRemove) => {
    const fileToRemove = files.find(f => f.id === idToRemove);
    if (fileToRemove && fileToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.preview);
    }
    const updatedFiles = files.filter(f => f.id !== idToRemove);
    setFiles(updatedFiles);
    
    if (onFilesUploaded) {
      onFilesUploaded(updatedFiles);
    }
  };

  const acceptedFileTypes = acceptZip ? "image/png, image/jpeg, image/webp, application/zip" : "image/png, image/jpeg, image/webp";
  const defaultDescriptionText = acceptZip ? "Formats: PNG, JPG, WEBP ou un fichier .ZIP contenant des chapitres." : "Formats: PNG, JPG, WEBP. L'ordre est important.";
  const descriptionText = customMessage || defaultDescriptionText;
  const titleText = acceptZip ? "Déposez un fichier .ZIP ou des images ici" : "Déposez les pages ici ou cliquez pour parcourir";


  return (
    <div className="w-full space-y-4">
      <div
        className={`upload-drop-zone p-6 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/70 transition-colors duration-200 rounded-lg ${
          isDragging ? "border-primary bg-primary/10" : "bg-muted/10"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {acceptZip ? <FileArchive className="h-10 w-10 mb-3 text-primary" /> : <Upload className="h-10 w-10 mb-3 text-primary" />}
        </motion.div>
        <h3 className="text-md font-medium mb-1 text-center">
          {titleText}
        </h3>
        <p className="text-xs text-muted-foreground text-center">
          {descriptionText}
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={acceptedFileTypes}
          multiple={!acceptZip} 
        />
      </div>

      {files.length > 0 && !acceptZip && (
        <div className="space-y-3">
           <p className="text-sm font-medium">{files.length} page(s) sélectionnée(s):</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <AnimatePresence>
              {files.map((fileObj, index) => (
                <motion.div
                  key={fileObj.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="file-preview relative aspect-[3/4] rounded-md overflow-hidden border border-border group"
                >
                  <img
                    src={fileObj.preview}
                    alt={fileObj.name}
                    className="w-full h-full object-cover"
                  />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-1">
                     <span className="text-white text-xs font-bold bg-black/70 px-1 py-0.5 rounded mb-1">Page {index + 1}</span>
                     <Button
                       variant="destructive"
                       size="icon"
                       className="remove-button h-6 w-6 rounded-full opacity-100"
                       onClick={(e) => {
                         e.stopPropagation();
                         removeFile(fileObj.id);
                       }}
                       title="Supprimer cette page"
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
