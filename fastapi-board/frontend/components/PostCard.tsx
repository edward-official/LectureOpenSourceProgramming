import { Post } from "@/lib/api";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const date = new Date(post.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <article className="border border-black p-5 hover:bg-black hover:text-white transition-colors duration-200 cursor-default">
      <h2 className="text-lg font-semibold mb-2 truncate">{post.title}</h2>
      <p className="text-sm opacity-70 line-clamp-2 mb-4">{post.content}</p>
      <time className="text-xs opacity-50">{date}</time>
    </article>
  );
}
