import type { CollectionConfig } from "payload";
import { publishedOrUser, writeAccess } from "../access";
import { slugFromTitle } from "../lib/slug";
import { newsEditor } from "./News";

/** Short club news: the three newest show at the top of the home page, all of them on /novosti. */
export const Announcements: CollectionConfig = {
  slug: "announcements",
  labels: { singular: "News item", plural: "News" },
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt", "_status", "updatedAt"],
    description:
      "Short news. The three newest show at the top of the home page. Longer stories go to Blog.",
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/${locale?.code ?? "hr"}/novosti/${data?.slug ?? ""}`,
    },
  },
  access: { read: publishedOrUser, ...writeAccess },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  defaultSort: "-publishedAt",
  fields: [
    { name: "title", type: "text", localized: true, required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Used in the URL. It is made from the title when empty.",
      },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      localized: true,
      admin: { position: "sidebar" },
    },
    { name: "cover", type: "upload", relationTo: "media" },
    {
      name: "excerpt",
      type: "textarea",
      localized: true,
      admin: {
        description:
          "Two or three sentences. The card on the home page shows them.",
      },
    },
    { name: "body", type: "richText", localized: true, editor: newsEditor },
  ],
};
