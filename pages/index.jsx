import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from '../lib/firebase';
import styles from '../styles/gallery.module.css';
import Post from '../components/Post';
import React, { useEffect, useState } from 'react';

export default function Home() {
  const [postList, setPostList] = useState([]);

  useEffect(() => {
    const getPostsAndComments = async () => {
      const data = await getDocs(collection(db, "posts"));
      const posts = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      for (let post of posts) {
        const commentsSnapshot = await getDocs(query(collection(db, "comments"), where("postId", "==", post.id)));
        post.comments = commentsSnapshot.docs.map(doc => doc.data());
      }

      setPostList(posts);
    };

    getPostsAndComments();
  }, []);

  return (
    <>
      {postList.map((post) => {
        return post.screenshotName ? (
          <Post
            key={post.id}
            postId={post.id}
            url={post.url}
            screenshotName={post.screenshotName}
            comment={post.comment}
            userId={post.userId}
            comments={post.comments}
          />
        ) : null;
      })}
    </>
  );
}
