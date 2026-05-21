import { reactive } from 'vue'

export const toastState = reactive({ msg: '', visible: false })
let t = null

export function toast(msg) {
  toastState.msg = msg
  toastState.visible = true
  clearTimeout(t)
  t = setTimeout(() => {
    toastState.visible = false
  }, 1800)
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    toast('복사했어요 ✶')
    return true
  } catch (e) {
    // fallback
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      toast('복사했어요 ✶')
      return true
    } catch (err) {
      toast('복사에 실패했어요')
      return false
    }
  }
}
