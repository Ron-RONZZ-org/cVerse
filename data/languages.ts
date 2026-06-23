import type { Language } from '~/types/cv'
import en from './languagesEn.json'
import fr from './languagesFr.json'

const languages: Record<string, Language[]> = { en, fr }
export function useLanguages(locale: string): Language[] {
  return languages[locale] || languages.en
}
