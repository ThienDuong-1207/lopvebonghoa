export function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

export function dayOfWeekLabel(dow: number): string {
  const labels = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  return labels[dow] ?? ''
}
