import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
import styles from '../styles/create.module.css';
import { db, storage } from '../lib/firebase';
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Create({ isAuth }) {
    const [loading, setLoading] = useState(false);
    const [isUploaded, setUploaded] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [url, setUrl] = useState('');
    const [comment, setComment] = useState('');
    const [user, setUser] = useState(null);

    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            }
        });
    }, []);

    async function Screenshot(url) {
        try {
            const screenshotResponse = await axios.get(`/api/screenshot?url=${url}`, { responseType: 'arraybuffer' });
            const screenshotBuffer = new Uint8Array(screenshotResponse.data);

            const name = uuidv4();
            const screenshotPath = `screenshots/${name}.png`;
            const storageRef = ref(storage, screenshotPath);

            await uploadBytes(storageRef, screenshotBuffer);

            const screenshotUrl = await getDownloadURL(storageRef);

            console.log('Screenshot uploaded');
            return { screenshotName: name, screenshotUrl: screenshotUrl };
        } catch (err) {
            console.error(err);
        }
    }

    const handleUrlChange = (event) => {
        setUrl(event.target.value);
    }

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    }

    const handleSubmit = async () => {
        if (!user) { // If no user is logged in
            router.push("/login");
            return;
        }

        setLoading(true);

        const screenshot = await Screenshot(url);

        try {
            const docRef = await addDoc(collection(db, "posts"), {
                url: url,
                screenshotName: screenshot.screenshotName,
                comment: comment,
                createdAt: serverTimestamp(),
                userId: user.uid,
                userName: user.displayName
            });

            setImageUrl(screenshot.screenshotUrl);

            console.log("Document written with ID: ", docRef.id);
            setUploaded(true);
        } catch (err) {
            console.error("Error adding document: ", err);
        }

        setLoading(false);
    }


    return (
        <div className={styles.container}>
            <h2>良いと思ったWebデザインをコメント付きで共有しよう！ </h2>
            <input className={styles.huki} type="text" value={url} onChange={handleUrlChange} placeholder="https://example.com/"/>
            <input className={styles.huki} type="text" value={comment} onChange={handleCommentChange} placeholder="コメントを入力" />
            <button onClick={handleSubmit} className={styles.btn}>
                共有する
            </button>

            {loading ? (
                <h2>Uploading...</h2>
            ) : isUploaded ? (
                <h2>Complete</h2>
            ) : null}

            {imageUrl && <img src={imageUrl} alt="Screenshot" />}
        </div>
    );
}
