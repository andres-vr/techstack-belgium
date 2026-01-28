import type { Province } from "~~/types"
export const provinces: Province[] = [
  {
    id: "west-flanders",
    names: { nl: "West-Vlaanderen", fr: "Flandre-Occidentale", de: "Westflandern", en: "West Flanders" }
  },
  {
    id: "east-flanders",
    names: { nl: "Oost-Vlaanderen", fr: "Flandre-Orientale", de: "Ostflandern", en: "East Flanders" }
  },
  {
    id: "antwerp",
    names: { nl: "Antwerpen", fr: "Anvers", de: "Antwerpen", en: "Antwerp" }
  },
  {
    id: "brussels-capital",
    names: {
      nl: "Brussels Hoofdstedelijk Gewest",
      fr: "Région de Bruxelles-Capitale",
      de: "Region Brüssel-Hauptstadt",
      en: "Brussels-Capital Region"
    }
  },
  {
    id: "flemish-brabant",
    names: { nl: "Vlaams-Brabant", fr: "Brabant flamand", de: "Flämisch-Brabant", en: "Flemish Brabant" }
  },
  {
    id: "limburg",
    names: { nl: "Limburg", fr: "Limbourg", de: "Limburg", en: "Limburg" }
  },
  {
    id: "hainaut",
    names: { nl: "Henegouwen", fr: "Hainaut", de: "Hennegau", en: "Hainaut" }
  },
    {
    id: "walloon-brabant",
    names: { nl: "Waals-Brabant", fr: "Brabant wallon", de: "Wallonisch-Brabant", en: "Walloon Brabant" }
  },
  {
    id: "namur",
    names: { nl: "Namen", fr: "Namur", de: "Namen", en: "Namur" }
  },
  {
    id: "liege",
    names: { nl: "Luik", fr: "Liège", de: "Lüttich", en: "Liège" }
  },
  {
    id: "luxembourg",
    names: { nl: "Luxemburg", fr: "Luxembourg", de: "Luxemburg", en: "Luxembourg" }
  }
]

export default provinces

