import { CategoryKey, Derives, TechType, type Tech } from '../../types';

export const tech: Tech[] = [
  // FRONTEND

  // CSS
  { name: 'Bootstrap', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'SASS', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Tailwind CSS', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },

  // JS
  { name: 'Alpine.js', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Angular', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Astro', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Backbone.js', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Ember', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'jQuery', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Next.js', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK, derives: [Derives.REACT] },
  { name: 'Nuxt', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK, derives: [Derives.VUE] },
  { name: 'Qwik', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'React', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'SolidJS', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Svelte', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },
  { name: 'Vue', category: CategoryKey.FRONTEND, type: TechType.FRAMEWORK },

  // BACKEND

  // Languages
  { name: 'C#', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'Elixir', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'Go', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'Java', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'Node.js', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'PHP', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'Python', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'Ruby', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'Rust', category: CategoryKey.BACKEND, type: TechType.LANGUAGE },
  { name: 'TypeScript', category: CategoryKey.BACKEND, type: TechType.LANGUAGE, derives: [Derives.NODEJS] },

  // Frameworks
  { name: 'AdonisJS', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.NODEJS] },
  { name: 'ASP.NET', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.CSHARP] },
  { name: 'CakePHP', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.PHP] },
  { name: 'Django', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.PYTHON] },
  { name: 'FastAPI', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.PYTHON] },
  { name: 'Fastify', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.NODEJS] },
  { name: 'Express', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.NODEJS] },
  { name: 'Flask', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.PYTHON] },
  { name: 'Koa', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.NODEJS] },
  { name: 'Laravel', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.PHP] },
  { name: 'NestJS', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.NODEJS] },
  { name: 'Phoenix', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.ELIXIR] },
  { name: 'Ruby on Rails', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.RUBY] },
  { name: 'Spring Boot', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.JAVA] },
  { name: 'Symfony', category: CategoryKey.BACKEND, type: TechType.FRAMEWORK, derives: [Derives.PHP] },

  // Communication
  { name: 'REST', category: CategoryKey.COMMUNICATION },
  { name: 'GraphQL', category: CategoryKey.COMMUNICATION },
  { name: 'gRPC', category: CategoryKey.COMMUNICATION },

  { name: 'Kafka', category: CategoryKey.COMMUNICATION },
  { name: 'RabbitMQ', category: CategoryKey.COMMUNICATION },

  { name: 'WebSockets', category: CategoryKey.COMMUNICATION },

  // DATABASES
  { name: 'Cassandra', category: CategoryKey.DATABASE, derives: [Derives.NOSQL] },
  { name: 'CouchDB', category: CategoryKey.DATABASE, derives: [Derives.NOSQL] },
  { name: 'Elasticsearch', category: CategoryKey.DATABASE, derives: [Derives.NOSQL] },
  { name: 'MongoDB', category: CategoryKey.DATABASE, derives: [Derives.NOSQL] },
  { name: 'Redis', category: CategoryKey.DATABASE, derives: [Derives.NOSQL] },
  { name: 'PostgreSQL', category: CategoryKey.DATABASE, derives: [Derives.SQL] },
  { name: 'MariaDB', category: CategoryKey.DATABASE, derives: [Derives.SQL] },
  { name: 'MySQL', category: CategoryKey.DATABASE, derives: [Derives.SQL] },
  { name: 'SQLite', category: CategoryKey.DATABASE, derives: [Derives.SQL] },

  // DEVOPS
  { name: 'Ansible', category: CategoryKey.DEVOPS },
  { name: 'Docker', category: CategoryKey.DEVOPS },
  { name: 'GitHub Actions', category: CategoryKey.DEVOPS },
  { name: 'GitLab CI', category: CategoryKey.DEVOPS },
  { name: 'Jenkins', category: CategoryKey.DEVOPS },
  { name: 'Kubernetes', category: CategoryKey.DEVOPS },
  { name: 'Terraform', category: CategoryKey.DEVOPS },
  // CLOUD
  { name: 'AWS', category: CategoryKey.CLOUD },
  { name: 'Azure', category: CategoryKey.CLOUD },
  { name: 'GCP', category: CategoryKey.CLOUD },

  // MOBILE
  { name: '.NET MAUI', category: CategoryKey.MOBILE },
  { name: 'Flutter', category: CategoryKey.MOBILE },
  { name: 'Kotlin', category: CategoryKey.MOBILE },
  { name: 'React Native', category: CategoryKey.MOBILE },
  { name: 'Swift', category: CategoryKey.MOBILE },
];


// Language derivation map for backend filtering
export const languageDeriveMap: Record<string, Derives> = {
  "Node.js": Derives.NODEJS,
  TypeScript: Derives.NODEJS,
  Python: Derives.PYTHON,
  PHP: Derives.PHP,
  Java: Derives.JAVA,
  "C#": Derives.CSHARP,
  Elixir: Derives.ELIXIR,
  Ruby: Derives.RUBY,
};

export default tech;
