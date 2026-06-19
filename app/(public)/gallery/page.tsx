export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

export default async function GalleryPage() {
  const supabase = createClient()

  // Lấy danh sách file từ Supabase Storage bucket 'gallery'
  const { data: files } = await supabase.storage.from('gallery').list('', {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  const imageFiles = (files ?? []).filter(
    (f) => f.name !== '.emptyFolderPlaceholder' && f.metadata
  )

  function getPublicUrl(name: string) {
    const { data } = supabase.storage.from('gallery').getPublicUrl(name)
    return data.publicUrl
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#0D2545]">Gallery bài vẽ</h1>
        <p className="mt-2 text-gray-500">Những tác phẩm sáng tạo của các bé tại lớp</p>
      </div>

      {imageFiles.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed text-gray-400">
          <div className="text-center">
            <div className="text-4xl">🎨</div>
            <p className="mt-3">Gallery đang được cập nhật...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {imageFiles.map((file) => (
            <div
              key={file.name}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
            >
              <Image
                src={getPublicUrl(file.name)}
                alt="Bài vẽ học sinh"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
