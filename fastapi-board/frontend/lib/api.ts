const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface PostCreate {
  title: string;
  content: string;
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API_URL}/api/posts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function createPost(data: PostCreate): Promise<Post> {
  const res = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}
