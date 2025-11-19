import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type QueryConstraint,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type UseFirestoreOptions<T> = {
  collectionName: string;
  documentId?: string;
  queryConstraints?: QueryConstraint[];
  enabled?: boolean;
  transform?: (data: DocumentData) => T;
};

type UseFirestoreResult<T> = {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
  refetch: () => Promise<void>;
};

/**
 * Hook for fetching a single document from Firestore
 */
export const useFirestoreDocument = <T = DocumentData>({
  collectionName,
  documentId,
  enabled = true,
  transform,
}: Omit<UseFirestoreOptions<T>, "queryConstraints">): UseFirestoreResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !documentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = docSnap.data();
        const transformedData = transform
          ? transform(docData)
          : ({ id: docSnap.id, ...docData } as T);
        setData(transformedData);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err as FirestoreError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [collectionName, documentId, enabled, transform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching multiple documents from Firestore
 */
export const useFirestoreCollection = <T = DocumentData>({
  collectionName,
  queryConstraints = [],
  enabled = true,
  transform,
}: Omit<UseFirestoreOptions<T>, "documentId">): UseFirestoreResult<T[]> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const docs = querySnapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        return transform
          ? transform(docData)
          : ({ id: docSnap.id, ...docData } as T);
      });

      setData(docs);
    } catch (err) {
      setError(err as FirestoreError);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [collectionName, queryConstraints, enabled, transform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for real-time document updates
 */
export const useFirestoreDocumentRealtime = <T = DocumentData>({
  collectionName,
  documentId,
  enabled = true,
  transform,
}: Omit<UseFirestoreOptions<T>, "queryConstraints">): UseFirestoreResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!enabled || !documentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, collectionName, documentId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const docData = docSnap.data();
          const transformedData = transform
            ? transform(docData)
            : ({ id: docSnap.id, ...docData } as T);
          setData(transformedData);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId, enabled, transform]);

  const refetch = useCallback(async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = docSnap.data();
        const transformedData = transform
          ? transform(docData)
          : ({ id: docSnap.id, ...docData } as T);
        setData(transformedData);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err as FirestoreError);
    } finally {
      setLoading(false);
    }
  }, [collectionName, documentId, transform]);

  return { data, loading, error, refetch };
};

/**
 * Hook for real-time collection updates
 */
export const useFirestoreCollectionRealtime = <T = DocumentData>({
  collectionName,
  queryConstraints = [],
  enabled = true,
  transform,
}: Omit<UseFirestoreOptions<T>, "documentId">): UseFirestoreResult<T[]> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, collectionName), ...queryConstraints);
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map((docSnap) => {
          const docData = docSnap.data();
          return transform
            ? transform(docData)
            : ({ id: docSnap.id, ...docData } as T);
        });
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, queryConstraints, enabled, transform]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        return transform
          ? transform(docData)
          : ({ id: docSnap.id, ...docData } as T);
      });
      setData(docs);
    } catch (err) {
      setError(err as FirestoreError);
    } finally {
      setLoading(false);
    }
  }, [collectionName, queryConstraints, transform]);

  return { data, loading, error, refetch };
};

/**
 * Hook for CRUD operations
 */
export const useFirestoreMutation = <T = DocumentData>(
  collectionName: string
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);

  const create = useCallback(
    async (data: Partial<T>): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef.id;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        setError(firestoreError);
        throw firestoreError;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const update = useCallback(
    async (documentId: string, data: Partial<T>): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const docRef = doc(db, collectionName, documentId);
        await updateDoc(docRef, data);
      } catch (err) {
        const firestoreError = err as FirestoreError;
        setError(firestoreError);
        throw firestoreError;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  const remove = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const docRef = doc(db, collectionName, documentId);
        await deleteDoc(docRef);
      } catch (err) {
        const firestoreError = err as FirestoreError;
        setError(firestoreError);
        throw firestoreError;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return { create, update, remove, loading, error };
};

