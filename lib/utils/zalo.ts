export type AlertTemplate = 'package_ended' | 'near_end' | 'inactive'

interface ZaloParams {
  phone: string
  parentName: string
  childName: string
  sessionsUsed: number
  sessionsLeft: number
  alertType: AlertTemplate
}

export function buildZaloContent(p: ZaloParams): string {
  if (p.alertType === 'package_ended') {
    return `Chào ${p.parentName} ạ, bé ${p.childName} đã học xong 8 buổi rồi ạ. Anh/Chị có muốn đăng ký tiếp cho bé không ạ? Học phí 1.200.000đ/8 buổi ạ.`
  }
  if (p.alertType === 'near_end') {
    return `Chào ${p.parentName} ạ, bé ${p.childName} đang học buổi ${p.sessionsUsed}/8 rồi ạ. Khi bé học hết gói mình có thể đóng tiếp để bé học liên mạch nhé.`
  }
  return `Chào ${p.parentName} ạ, lâu rồi không thấy bé ${p.childName} đến vẽ. Bé còn ${p.sessionsLeft} buổi trong gói, mình nhớ bé lắm ạ.`
}

export function buildZaloUrl(phone: string, content: string): string {
  if (typeof window === 'undefined') return `https://zalo.me/${phone}`
  const isAndroid = /android/i.test(navigator.userAgent)
  const isIOS = /iphone|ipad/i.test(navigator.userAgent)
  if (isAndroid || isIOS) {
    return `zalo://forward?to=${phone}&text=${encodeURIComponent(content)}`
  }
  return `https://zalo.me/${phone}`
}

export async function openZalo(phone: string, content: string) {
  const url = buildZaloUrl(phone, content)
  if (url.startsWith('https://')) {
    await navigator.clipboard.writeText(content)
  }
  window.open(url, '_blank')
}
