import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

export type PostType = "casting_call" | "actor_seeking" | "staff_recruitment" | "general";
export type PostCategory =
  | "free"           // 자유
  | "review"         // 작품리뷰
  | "tech"           // 촬영팁
  | "equipment"      // 장비
  | "qna"            // Q&A
  | "casting_review" // 오디션후기
  | "casting"        // 캐스팅 (구)
  | "seeking"        // 구직 (구)
  | "collaboration"  // 협업 (구)
  | "general";       // 일반 (구) → 자유로 표시

export interface Post {
  id: string;
  type: PostType;
  authorId: string;
  authorRole: "filmmaker" | "actor" | "viewer" | "venue";
  title: string;
  content: string;
  category?: PostCategory;
  location?: string;
  requirements?: string[];
  movieId?: string;
  actorId?: string;
  isPublic: boolean;
  views: number;
  createdAt: any;
  updatedAt: any;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * 모든 게시글 가져오기
 */
export async function getPosts(options?: {
  type?: PostType;
  category?: PostCategory;
  limitCount?: number;
}): Promise<Post[]> {
  let q = query(
    collection(db, "posts"),
    where("isPublic", "==", true)
  );

  if (options?.type) {
    q = query(q, where("type", "==", options.type));
  }

  const snapshot = await getDocs(q);
  const posts: Post[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (data.isPublic === true) {
      posts.push({
        id: docSnapshot.id,
        ...data,
      } as Post);
    }
  });

  // 클라이언트 사이드에서 정렬 (최신순)
  posts.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime; // 내림차순 (최신순)
  });

  // 카테고리 필터링
  let filteredPosts = posts;
  if (options?.category) {
    filteredPosts = posts.filter((post) => post.category === options.category);
  }

  // limitCount가 있으면 제한
  if (options?.limitCount) {
    filteredPosts = filteredPosts.slice(0, options.limitCount);
  }

  return filteredPosts;
}

/**
 * 게시글 가져오기 (ID로)
 */
export async function getPostById(postId: string): Promise<Post | null> {
  const docRef = doc(db, "posts", postId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Post;
}

/**
 * 게시글 작성
 */
export async function createPost(
  authorId: string,
  authorRole: "filmmaker" | "actor" | "viewer" | "venue",
  data: {
    type: PostType;
    title: string;
    content: string;
    category?: PostCategory;
    location?: string;
    requirements?: string[];
    movieId?: string;
    actorId?: string;
    isPublic?: boolean;
  }
): Promise<string> {
  // undefined 값을 제거하여 Firestore에 저장할 데이터 생성
  const postData: any = {
    authorId,
    authorRole,
    type: data.type,
    title: data.title.trim(),
    content: data.content.trim(),
    isPublic: data.isPublic !== undefined ? data.isPublic : true,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 선택적 필드는 undefined가 아닐 때만 추가
  if (data.category !== undefined) {
    postData.category = data.category;
  }
  if (data.location !== undefined && data.location !== "") {
    postData.location = data.location;
  }
  if (data.requirements !== undefined && data.requirements.length > 0) {
    postData.requirements = data.requirements;
  }
  if (data.movieId !== undefined) {
    postData.movieId = data.movieId;
  }
  if (data.actorId !== undefined) {
    postData.actorId = data.actorId;
  }

  // 디버깅: 전송할 데이터 확인
  console.log("게시글 작성 데이터:", postData);
  console.log("authorId:", authorId);
  console.log("authorRole:", authorRole);

  const docRef = await addDoc(collection(db, "posts"), postData);

  return docRef.id;
}

/**
 * 게시글 수정
 */
export async function updatePost(
  postId: string,
  authorId: string,
  data: {
    title?: string;
    content?: string;
    category?: PostCategory;
    location?: string;
    requirements?: string[];
    isPublic?: boolean;
  }
): Promise<void> {
  const postRef = doc(db, "posts", postId);
  const post = await getPostById(postId);

  if (!post || post.authorId !== authorId) {
    throw new Error("권한이 없습니다.");
  }

  const updateData: any = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.content !== undefined) updateData.content = data.content.trim();
  if (data.category !== undefined) updateData.category = data.category;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.requirements !== undefined) updateData.requirements = data.requirements;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

  await updateDoc(postRef, updateData);
}

/**
 * 게시글 삭제
 */
export async function deletePost(postId: string, authorId: string): Promise<void> {
  const post = await getPostById(postId);

  if (!post || post.authorId !== authorId) {
    throw new Error("권한이 없습니다.");
  }

  await deleteDoc(doc(db, "posts", postId));
}

/**
 * 조회수 증가 - postViews.ts의 incrementPostViews 사용 권장 (누구나 호출 가능)
 * 기존 posts 문서의 views 필드는 createPost 시 0으로 초기화됨
 */
export { incrementPostViews } from "./postViews";

/**
 * 댓글 작성
 */
export async function createComment(
  postId: string,
  userId: string,
  content: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "posts", postId, "comments"), {
    userId,
    content: content.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * 댓글 가져오기
 */
export async function getComments(postId: string): Promise<PostComment[]> {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  const comments: PostComment[] = [];

  snapshot.forEach((docSnapshot) => {
    comments.push({
      id: docSnapshot.id,
      postId,
      ...docSnapshot.data(),
    } as PostComment);
  });

  return comments;
}

/**
 * 댓글 삭제
 */
export async function deleteComment(
  postId: string,
  commentId: string,
  userId: string
): Promise<void> {
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  const commentSnap = await getDoc(commentRef);

  if (!commentSnap.exists()) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  const commentData = commentSnap.data();
  if (commentData.userId !== userId) {
    throw new Error("권한이 없습니다.");
  }

  await deleteDoc(commentRef);
}

/**
 * 내가 작성한 게시글 가져오기
 */
export async function getMyPosts(userId: string): Promise<Post[]> {
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", userId)
  );

  const snapshot = await getDocs(q);
  const posts: Post[] = [];

  snapshot.forEach((docSnapshot) => {
    posts.push({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as Post);
  });

  // 최신순 정렬
  posts.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
    return bTime - aTime;
  });

  return posts;
}
