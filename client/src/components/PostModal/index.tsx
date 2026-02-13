'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import compressImage from 'browser-image-compression'
import { fetchSigunguByPoint } from '@/lib/api/sigungu'
import { createPost, uploadThumbnail } from '@/lib/api/posts'
import type { Loc } from '@/hooks/useGeolocation'

interface SigunguInfo {
  sig_cd: number
  sig_eng_nm: string
  full_nm: string
  sig_kor_nm: string
}

interface PostModalProps {
  open: boolean
  loc: Loc | null
  onClose: () => void
  onPosted: () => void
}

function pickMaybeGeoJson(raw: any) {
  return (
    raw?.response?.result?.featureCollection ??
    raw?.result?.featureCollection ??
    raw?.response?.result ??
    raw?.result ??
    raw?.featureCollection ??
    raw
  )
}

function extractAddressFromRaw(raw: any): SigunguInfo | null {
  const maybe =
    raw?.response?.result?.featureCollection ??
    raw?.result?.featureCollection ??
    raw?.response?.result ??
    raw?.result ??
    raw?.featureCollection ??
    raw

  const features = maybe?.features ?? []
  const props = features[0]?.properties ?? {}

  const sig_cd = props.sig_cd ?? props.SIG_CD
  const sig_eng_nm = props.sig_eng_nm ?? props.SIG_ENG_NM
  const full_nm = props.full_nm ?? props.FULL_NM
  const sig_kor_nm = props.sig_kor_nm ?? props.SIG_KOR_NM

  if (!sig_cd || !sig_eng_nm) return null
  return { sig_cd: Number(sig_cd), sig_eng_nm, full_nm: full_nm ?? '', sig_kor_nm: sig_kor_nm ?? '' }
}

export default function PostModal({ open, loc, onClose, onPosted }: PostModalProps) {
  const [sigungu, setSigungu] = useState<SigunguInfo | null>(null)
  const [sigunguLoading, setSigunguLoading] = useState(false)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 모달이 열릴 때 딱 한 번만 sigungu 조회
  useEffect(() => {
    if (!open || !loc) return
    setSigungu(null)
    setSigunguLoading(true)

    fetchSigunguByPoint(loc.lat, loc.lng)
      .then((raw) => {
        const info = extractAddressFromRaw(raw)
        setSigungu(info)
        if (!info) toast.error('행정구역 정보를 가져오지 못했습니다.')
      })
      .catch(() => toast.error('행정구역 정보를 가져오지 못했습니다.'))
      .finally(() => setSigunguLoading(false))
  }, [open]) // loc 변경에는 재조회 안 함

  // 모달 닫힐 때 상태 리셋
  useEffect(() => {
    if (!open) {
      setContent('')
      setImages([])
      setPreviews([])
      setSigungu(null)
    }
  }, [open])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const compressed = await Promise.all(
      files.map((f) =>
        compressImage(f, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true }).catch(() => f),
      ),
    )

    setImages((prev) => [...prev, ...compressed])
    const urls = compressed.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...urls])

    // input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = ''
  }

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('내용을 입력해 주세요.')
      return
    }
    if (!sigungu) {
      toast.error('행정구역 정보가 없습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    if (!loc) {
      toast.error('위치 정보가 없습니다.')
      return
    }

    setSubmitting(true)
    try {
      // 이미지 업로드 (첫 번째 이미지만 thumbnail로 사용)
      let thumbnailUrl: string | null = null
      if (images.length > 0) {
        thumbnailUrl = await uploadThumbnail(images[0])
      }

      await createPost({
        content: content.trim(),
        thumbnail: thumbnailUrl,
        latitude: loc.lat,
        longitude: loc.lng,
        sig_cd: sigungu.sig_cd,
        sig_eng_nm: sigungu.sig_eng_nm,
        full_nm: sigungu.full_nm,
        sig_kor_nm: sigungu.sig_kor_nm,
      })

      toast.success(`${sigungu.sig_kor_nm}에 나무를 심었어요! 🌱`)
      onPosted()
      onClose()
    } catch (e: any) {
      console.error(e)
      toast.error('게시글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key='backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm'
            onClick={onClose}
          />

          {/* Modal Sheet */}
          <motion.div
            key='modal'
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-2xl shadow-2xl max-h-[90dvh] flex flex-col'
          >
            {/* Handle bar */}
            <div className='flex justify-center pt-3 pb-1'>
              <div className='w-10 h-1 rounded-full bg-gray-300' />
            </div>

            {/* Header */}
            <div className='flex items-center justify-between px-5 py-3 border-b border-gray-100'>
              <h2 className='text-base font-semibold text-gray-800'>새 게시글</h2>
              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer'
              >
                ×
              </button>
            </div>

            {/* 행정구역 표시 */}
            <div className='px-5 py-2.5 bg-green-50 border-b border-green-100'>
              {sigunguLoading ? (
                <span className='text-sm text-green-600 animate-pulse'>위치 확인 중...</span>
              ) : sigungu ? (
                <div className='flex items-center gap-1.5'>
                  <span className='text-green-600 text-base'>🌿</span>
                  <span className='text-sm font-medium text-green-700'>{sigungu.full_nm}</span>
                  <span className='text-xs text-green-500'>에 나무를 심어요</span>
                </div>
              ) : !loc ? (
                <span className='text-sm text-red-500'>위치 정보가 필요합니다</span>
              ) : (
                <span className='text-sm text-red-500'>행정구역 정보를 가져오지 못했습니다</span>
              )}
            </div>

            {/* 내용 입력 */}
            <div className='flex-1 overflow-y-auto px-5 py-4 min-h-0'>
              <textarea
                className='w-full h-32 resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none'
                placeholder='지금 이 동네에서 무슨 일이 있나요?'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
              />
              <div className='text-right text-xs text-gray-400'>{content.length}/500</div>

              {/* 이미지 미리보기 */}
              {previews.length > 0 && (
                <div className='flex gap-2 flex-wrap mt-2'>
                  {previews.map((url, idx) => (
                    <div key={url} className='relative w-20 h-20'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt='preview' className='w-full h-full object-cover rounded-lg' />
                      <button
                        onClick={() => removeImage(idx)}
                        className='absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center cursor-pointer'
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 액션 */}
            <div className='px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3'>
              <button
                onClick={() => fileInputRef.current?.click()}
                className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 cursor-pointer transition-colors'
              >
                <span className='text-lg'>📷</span>
                <span>사진 추가</span>
                {images.length > 0 && (
                  <span className='bg-green-100 text-green-700 text-xs rounded-full px-1.5 py-0.5'>
                    {images.length}
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={handleImageChange}
              />

              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim() || !sigungu}
                className='bg-green-500 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2 rounded-full cursor-pointer disabled:cursor-not-allowed transition-colors hover:bg-green-600'
              >
                {submitting ? '업로드 중...' : '나무 심기 🌱'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
