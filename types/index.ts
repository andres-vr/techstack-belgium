export enum CategoryKey {
  CLOUD = 'cloud',
  COMMUNICATION = 'communication',
  BACKEND = 'backend',
  DATABASE = 'database',
  DEVOPS = 'devops',
  FRONTEND = 'frontend',
  MOBILE = 'mobile',
}

export enum Derives {
  CSHARP = 'C#',
  ELIXIR = 'Elixir',
  JAVA = 'Java',
  NODEJS = 'Node.js',
  NOSQL = 'NoSQL',
  PHP = 'PHP',
  PYTHON = 'Python',
  REACT = 'React',
  RUBY = 'Ruby',
  SQL = 'SQL',
  VUE = 'Vue',
}

export enum TechType {
  FRAMEWORK = 'framework',
  LANGUAGE = 'language',
}

export type Company = {
  cbe?: string,
  name: string
  site: string
  locations: Location[]
  tech: string[]
  employees?: number
  founded?: number
  proof?: Proof[]
  emailVerified?: boolean
  lastUpdated: string
}

export type Locale = 'nl' | 'fr' | 'de' | 'en'

export type Location = {
  province: ProvinceId | null
  municipality: string | null
  address: string
  coords?: [number, number]
}

export type Municipality = {
  id: string
  province: ProvinceId
  names: Record<Locale, string>
}

export type ProvinceId =
  | 'antwerp'
  | 'brussels-capital'
  | 'east-flanders'
  | 'flemish-brabant'
  | 'hainaut'
  | 'liege'
  | 'limburg'
  | 'luxembourg'
  | 'namur'
  | 'walloon-brabant'
  | 'west-flanders'

export type Province = {
  id: ProvinceId
  names: Record<Locale, string>
}

export type Proof = {
  url: string
  image?: string
}

export type SEOProps = {
  count?: number
  province?: string
  municipality?: string
  tech?: string
  selectedTechs?: string[]
  companies?: Company[]
}

export type SubmissionPayload = {
  companyName: string
  website: string
  locations: Location[]
  techStack: string[]
  proofUrls: string[]
  cbe?: string
  employees?: number
  founded?: number
  verified?: boolean
  verifiedByEmail?: boolean
  emailVerified?: boolean
}

export type AddPayload = {
  cbe: string           // Required - user enters this
  techStack: string[]   // User selects tech
  proofUrls: string[]   // User provides proof URLs
  website: string
  emailVerified?: boolean // Whether email verification was completed client-side
}

export type Tech = {
  name: string
  category: CategoryKey
  type?: TechType
  derives?: Derives[]
}

export type TechCategory = {
  key: CategoryKey
  label: string
}

export enum SortCriterion {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  FOUNDED_ASC = 'founded_asc',
  FOUNDED_DESC = 'founded_desc',
  EMPLOYEES_ASC = 'employees_asc',
  EMPLOYEES_DESC = 'employees_desc',
}
