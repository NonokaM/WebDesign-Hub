import Link from "next/link";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import React, { useEffect, useState } from 'react';
import styles from '../styles/post.module.css';
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from '../lib/firebase';
import { Comment, CommentForm } from '../components/Comment';
import { onAuthStateChanged } from 'firebase/auth';

export default function Post({ url, screenshotName, comment, userId, postId, comments }) {
    const [imageURL, setImageURL] = useState(null);
    const [liked, setLiked] = useState(false);
    const [commentsState, setCommentsState] = useState(comments || []);
    const [currentUserId, setCurrentUserId] = useState(null);
    const storage = getStorage();
    let storageRef = ref(storage, `screenshots/${screenshotName}.png`);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            }
        });

        getDownloadURL(storageRef)
            .then((url) => {
                setImageURL(url);
            })
            .catch((error) => {
                switch (error.code) {
                    case 'storage/object-not-found':
                        break;
                    case 'storage/unauthorized':
                        break;
                    case 'storage/canceled':
                        break;
                }
            });

        if (currentUserId && postId) {
            const fetchLikes = async () => {
                const q = query(
                    collection(db, "likes"),
                    where("postId", "==", postId),
                    where("userId", "==", currentUserId)
                );
                const querySnapshot = await getDocs(q);
                setLiked(!querySnapshot.empty);
            };

            fetchLikes();
        }

        return () => {
            unsubscribe();
        };
    }, [currentUserId, postId]);

    const toggleLike = async () => {
        if (!currentUserId || !postId) return;

        if (liked) {
            const q = query(
                collection(db, "likes"),
                where("postId", "==", postId),
                where("userId", "==", currentUserId)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
        } else {
            await addDoc(collection(db, "likes"), {
                postId,
                userId: currentUserId
            });
        }
        setLiked(!liked);
    };


    return (
        <div className={styles.postContainer}>
            <div className={styles.leftContainer}>
                <Link href={url} target="_blank">
                    {imageURL && <img src={imageURL} alt="Screenshot" className={styles.urlImg}/>}
                    <h3>{url}</h3>
                </Link>
                <button onClick={toggleLike}>{liked ? 'いいね済' : 'いいね'}</button>
            </div>
            <div className={styles.righitContainer}>
                <h3 className={styles.huki}>{comment}</h3>
                {commentsState.map((comment, index) => (
                    <Comment key={index} comment={comment} />
                ))}
                <CommentForm
                postId={postId}
                comments={commentsState}
                setComments={setCommentsState} />
            </div>
        </div>
    );
}
