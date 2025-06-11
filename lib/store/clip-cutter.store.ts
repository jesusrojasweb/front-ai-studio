import { atom } from 'jotai'
import type { ClipEntity } from '@/lib/services/clips.service'
import type { JobEntity } from '@/lib/services/jobs.service'

// Current video being processed
export const currentVideoIdAtom = atom<string | null>(null)

// Current processing job
export const currentJobAtom = atom<JobEntity | null>(null)

// Job processing state
export type ProcessingState = 'idle' | 'analyzing' | 'completed' | 'failed'
export const processingStateAtom = atom<ProcessingState>('idle')

// Generated clips from the current video
export const currentClipsAtom = atom<ClipEntity[]>([])

// Selected clip for preview
export const selectedClipAtom = atom<ClipEntity | null>(null)

// Processing progress (0-100)
export const processingProgressAtom = atom<number>(0)

// Error message if processing fails
export const processingErrorAtom = atom<string | null>(null)

// Actions
export const setCurrentVideoAction = atom(null, (get, set, videoId: string) => {
  set(currentVideoIdAtom, videoId)
  // Reset other states when changing video
  set(currentJobAtom, null)
  set(processingStateAtom, 'idle')
  set(currentClipsAtom, [])
  set(selectedClipAtom, null)
  set(processingProgressAtom, 0)
  set(processingErrorAtom, null)
})

export const setJobAction = atom(null, (get, set, job: JobEntity) => {
  set(currentJobAtom, job)

  // Update processing state based on job state
  switch (job.state) {
    case 'WAITING':
      set(processingStateAtom, 'analyzing')
      set(processingProgressAtom, 10)
      break
    case 'RUNNING':
      set(processingStateAtom, 'analyzing')
      set(processingProgressAtom, 50)
      break
    case 'SUCCEEDED':
      set(processingStateAtom, 'completed')
      set(processingProgressAtom, 100)
      break
    case 'FAILED':
      set(processingStateAtom, 'failed')
      set(processingErrorAtom, job.error_msg || 'Job failed')
      break
  }
})

export const setClipsAction = atom(null, (get, set, clips: ClipEntity[]) => {
  set(currentClipsAtom, clips)

  // Auto-select first clip if none selected
  const currentSelected = get(selectedClipAtom)
  if (!currentSelected && clips.length > 0) {
    set(selectedClipAtom, clips[0])
  }
})

export const selectClipAction = atom(null, (get, set, clip: ClipEntity) => {
  set(selectedClipAtom, clip)
})

export const resetStateAction = atom(null, (get, set) => {
  set(currentVideoIdAtom, null)
  set(currentJobAtom, null)
  set(processingStateAtom, 'idle')
  set(currentClipsAtom, [])
  set(selectedClipAtom, null)
  set(processingProgressAtom, 0)
  set(processingErrorAtom, null)
})
