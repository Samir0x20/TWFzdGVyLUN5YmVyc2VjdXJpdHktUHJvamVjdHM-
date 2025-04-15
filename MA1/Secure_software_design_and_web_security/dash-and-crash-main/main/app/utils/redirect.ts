"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRedirect(url: string) {
  const router = useRouter();

  useEffect(() => {
    if (url) {
      router.push(url);
    }
  }, [url, router]);
}