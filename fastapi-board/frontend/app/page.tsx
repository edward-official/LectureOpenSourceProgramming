import Link from "next/link";
import { getPosts, Post } from "@/lib/api";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let posts: Post[] = [];
  try {
    posts = await getPosts();
  } catch {
    // API가 아직 준비되지 않은 경우 빈 목록 표시
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <header className="flex items-center justify-between mb-10 border-b border-black pb-6">
        <h1 className="text-2xl font-bold tracking-tight">게시판</h1>
        <Link
          href="/new"
          className="border border-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors duration-200"
        >
          글쓰기
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className="text-center text-sm opacity-50 py-20">
          아직 게시글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
