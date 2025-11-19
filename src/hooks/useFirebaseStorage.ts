import { useState, useCallback } from "react";
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTaskSnapshot,
  type FirebaseStorageError,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

type UploadProgress = {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
};

type UseFirebaseStorageResult = {
  uploadFile: (
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<string>;
  uploadFileResumable: (
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  getFileUrl: (path: string) => Promise<string>;
  uploading: boolean;
  error: FirebaseStorageError | null;
  progress: UploadProgress | null;
};

/**
 * Hook for Firebase Storage operations
 */
export const useFirebaseStorage = (): UseFirebaseStorageResult => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<FirebaseStorageError | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      path: string,
      onProgress?: (progress: UploadProgress) => void
    ): Promise<string> => {
      try {
        setUploading(true);
        setError(null);
        setProgress(null);

        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);

        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      } catch (err) {
        const storageError = err as FirebaseStorageError;
        setError(storageError);
        throw storageError;
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    []
  );

  const uploadFileResumable = useCallback(
    async (
      file: File,
      path: string,
      onProgress?: (progress: UploadProgress) => void
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          setUploading(true);
          setError(null);
          setProgress(null);

          const storageRef = ref(storage, path);
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            "state_changed",
            (snapshot: UploadTaskSnapshot) => {
              const progressData: UploadProgress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress:
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              };
              setProgress(progressData);
              onProgress?.(progressData);
            },
            (error) => {
              const storageError = error as FirebaseStorageError;
              setError(storageError);
              setUploading(false);
              setProgress(null);
              reject(storageError);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setUploading(false);
                setProgress(null);
                resolve(downloadURL);
              } catch (err) {
                const storageError = err as FirebaseStorageError;
                setError(storageError);
                setUploading(false);
                setProgress(null);
                reject(storageError);
              }
            }
          );
        } catch (err) {
          const storageError = err as FirebaseStorageError;
          setError(storageError);
          setUploading(false);
          setProgress(null);
          reject(storageError);
        }
      });
    },
    []
  );

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    try {
      setError(null);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err) {
      const storageError = err as FirebaseStorageError;
      setError(storageError);
      throw storageError;
    }
  }, []);

  const getFileUrl = useCallback(async (path: string): Promise<string> => {
    try {
      setError(null);
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (err) {
      const storageError = err as FirebaseStorageError;
      setError(storageError);
      throw storageError;
    }
  }, []);

  return {
    uploadFile,
    uploadFileResumable,
    deleteFile,
    getFileUrl,
    uploading,
    error,
    progress,
  };
};

