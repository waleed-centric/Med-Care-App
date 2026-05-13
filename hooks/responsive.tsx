import { useState, useEffect } from 'react'

export const useResponsiveMenu = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobileWidth = window.innerWidth < 1024
      setIsMobile(mobileWidth)
      if (!mobileWidth) {
        setIsMenuOpen(false) // Auto-close on desktop
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return { isMobile, isMenuOpen, setIsMenuOpen }
}

export const useResponsiveLayout = () => {
  const [layout, setLayout] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth
      if (width < 768) setLayout('mobile')
      else if (width < 1024) setLayout('tablet')
      else setLayout('desktop')
    }

    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  return layout
}

export const useTouchTarget = () => {
  return {
    minTouch: 'min-h-[44px] min-w-[44px]', // 44px minimum touch target
    largeTouch: 'min-h-[18] min-w-[18]', // 72px large touch target
  }
}