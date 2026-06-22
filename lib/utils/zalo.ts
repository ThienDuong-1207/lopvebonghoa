export type AlertTemplate = 'package_ended' | 'near_end' | 'inactive'

interface ZaloParams {
  phone: string
  parentName: string
  childName: string
  sessionsUsed: number
  sessionsTotal: number
  sessionsLeft: number
  lastSessionDate: string | null  // YYYY-MM-DD từ DB
  alertType: AlertTemplate
}

function formatDate(iso: string | null): string {
  if (!iso) return '___/___/______'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const BANK_INFO = `Ngân hàng Techcombank
NGUYEN THI QUYNH MY
19033822467012
Nội dung ck: chỉ cần ghi tên bé thôi ạ`

export function buildZaloContent(p: ZaloParams): string {
  if (p.alertType === 'package_ended') {
    return `Dạ chị ơi, bé ${p.childName} đã học hết số buổi của tháng cũ vào ngày "${formatDate(p.lastSessionDate)}" và bắt buổi đầu tiên của tháng mới vào ngày "___/___/______", phụ huynh cho em thu học phí tháng mới của bé ạ.

Phụ huynh tiếp tục đăng kí cho bé có thể gửi học phí vào STK sau giúp em chị nhen:
${BANK_INFO}
Em cảm ơn chị nhiều`
  }

  if (p.alertType === 'near_end') {
    return `Dạ chị ơi, bé ${p.childName} đang học buổi ${p.sessionsUsed}/${p.sessionsTotal} rồi ạ. Khi bé học hết gói mình có thể đóng tiếp để bé học liên mạch nhé ạ.

Phụ huynh có thể gửi học phí vào STK sau giúp em chị nhen:
${BANK_INFO}
Em cảm ơn chị nhiều`
  }

  // inactive
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
