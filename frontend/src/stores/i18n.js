import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { messages } from '../i18n/messages'

const storageKey = 'lcode_locale'
const supportedLocales = ['zh', 'en']

function resolveInitialLocale() {
  const saved = localStorage.getItem(storageKey)
  return supportedLocales.includes(saved) ? saved : 'zh'
}

function format(template, params = {}) {
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  )
}

export const useI18nStore = defineStore('i18n', () => {
  const locale = ref(resolveInitialLocale())
  const isEnglish = computed(() => locale.value === 'en')

  function syncDocumentLanguage() {
    document.documentElement.lang = locale.value === 'en' ? 'en' : 'zh-CN'
  }

  function setLocale(nextLocale) {
    locale.value = supportedLocales.includes(nextLocale) ? nextLocale : 'zh'
    localStorage.setItem(storageKey, locale.value)
    syncDocumentLanguage()
  }

  function toggleLocale() {
    setLocale(locale.value === 'zh' ? 'en' : 'zh')
  }

  function t(key, params = {}) {
    const template = messages[locale.value]?.[key] ?? messages.zh[key] ?? key
    return format(template, params)
  }

  syncDocumentLanguage()

  return {
    locale,
    isEnglish,
    setLocale,
    toggleLocale,
    t,
  }
})
