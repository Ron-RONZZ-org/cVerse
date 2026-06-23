import type { Country } from '~/types/cv'
import en from './countriesEn.json'
import fr from './countriesFr.json'

const countries: Record<string, Country[]> = { en, fr }
export function useCountries(locale: string): Country[] {
  return countries[locale] || countries.en
}
