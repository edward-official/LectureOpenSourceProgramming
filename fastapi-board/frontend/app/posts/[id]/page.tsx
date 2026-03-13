import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/api";
import PostActions from "@/components/PostActions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const postId = Number(id);

  let post;
  try {
    post = await getPost(postId);
  } catch {
    notFound();
  }

  const date = new Date(post.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <header className="flex items-center justify-between mb-10 border-b border-black pb-6">
        <Link
          href="/"
          className="text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          ← 목록으로
        </Link>
      </header>

      <article>
        <h1 className="text-2xl font-bold mb-3">{post.title}</h1>
        <time className="text-xs opacity-50 block mb-8">{date}</time>
        <p className="text-sm leading-7 whitespace-pre-wrap">{post.content}</p>
      </article>

      <PostActions postId={post.id} />
    </main>
  );
}
