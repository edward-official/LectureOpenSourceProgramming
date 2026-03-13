"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPost } from "@/lib/api";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createPost({ title, content });
      router.push("/");
      router.refresh();
    } catch {
      setError("게시글 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <header className="flex items-center justify-between mb-10 border-b border-black pb-6">
        <h1 className="text-2xl font-bold tracking-tight">글쓰기</h1>
        <Link
          href="/"
          className="text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          ← 목록으로
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-medium">
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="border border-black px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black placeholder:opacity-30"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="content" className="text-sm font-medium">
            내용
          </label>
          <textarea
            id="content"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            className="border border-black px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black resize-none placeholder:opacity-30"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="border border-black px-6 py-3 text-sm font-medium bg-black text-white hover:bg-white hover:text-black transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </main>
  );
}
