import type { CollectionConfig } from "payload";
import { publishedOrUser, writeAccess } from "../access";
import { slugFromTitle } from "../lib/slug";
import { newsEditor } from "./News";

/** Short club news: the three newest show at the top of the home page, all of them on /novosti. */
export const Announcements: CollectionConfig = {
  slug: "announcements",
  labels: { singular: "Novost", plural: "Novosti" },
  admin: {
    group: "Novosti i blog",
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt", "_status", "updatedAt"],
    description:
      "Kratke vijesti kluba. Tri najnovije se prikazuju na vrhu početne stranice, a sve na stranici /novosti. Novost je javna tek kad je objavljena (gumb Publish).",
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/${locale?.code ?? "hr"}/novosti/${data?.slug ?? ""}`,
    },
  },
  access: { read: publishedOrUser, ...writeAccess },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  defaultSort: "-publishedAt",
  fields: [
    { name: "title", label: "Naslov", type: "text", localized: true, required: true },
    {
      name: "slug",
      label: "Adresa (slug)",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Dio web adrese. Ako ostane prazno, napravi se iz naslova.",
      },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    {
      name: "publishedAt",
      label: "Datum objave",
      type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "tags",
      label: "Oznake",
      type: "text",
      hasMany: true,
      localized: true,
      admin: { position: "sidebar" },
    },
    { name: "cover", label: "Naslovna slika", type: "upload", relationTo: "media" },
    {
      name: "excerpt",
      label: "Sažetak",
      type: "textarea",
      localized: true,
      admin: {
        description:
          "Dvije do tri rečenice. Prikazuju se na kartici novosti.",
      },
    },
    { name: "body", label: "Tekst", type: "richText", localized: true, editor: newsEditor },
  ],
};
