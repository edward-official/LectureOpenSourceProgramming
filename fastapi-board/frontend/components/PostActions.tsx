"use client";

import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/api";
import Link from "next/link";

interface PostActionsProps {
  postId: number;
}

export default function PostActions({ postId }: PostActionsProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deletePost(postId);
      router.push("/");
      router.refresh();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="flex gap-3 mt-8 pt-6 border-t border-black">
      <Link
        href={`/posts/${postId}/edit`}
        className="border border-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors duration-200"
      >
        수정
      </Link>
      <button
        onClick={handleDelete}
        className="border border-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors duration-200"
      >
        삭제
      </button>
    </div>
  );
}
