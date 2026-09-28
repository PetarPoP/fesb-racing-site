import { useEffect, useRef, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from 'lucide-react'
import { cx } from '../ui'

type Props = {
  label: string
  value: string
  onChange: (html: string) => void
  onUpload: (file: File) => Promise<string>
}

export function RichEditor({ label, value, onChange, onUpload }: Props) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Image,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChangeRef.current(editor.isEmpty ? '' : editor.getHTML()),
    editorProps: { attributes: { class: 'rich min-h-[240px] p-4 outline-none', 'aria-label': label, 'aria-multiline': 'true', role: 'textbox' } },
  })

  // Vanjska promjena (npr. generirani prijevod) — upiši je u editor bez okidanja onChange.
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (value !== current) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e && {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        strike: e.isActive('strike'),
        h2: e.isActive('heading', { level: 2 }),
        h3: e.isActive('heading', { level: 3 }),
        ul: e.isActive('bulletList'),
        ol: e.isActive('orderedList'),
        quote: e.isActive('blockquote'),
        link: e.isActive('link'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      },
  })

  const chain = () => editor!.chain().focus()

  function setLink() {
    const prev = editor!.getAttributes('link').href as string | undefined
    const url = window.prompt('Adresa linka (https://…)', prev ?? 'https://')
    if (url === null) return
    if (!url.trim()) chain().extendMarkRange('link').unsetLink().run()
    else chain().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  async function pickImage(file: File | undefined) {
    if (!file) return
    try {
      const src = await onUpload(file)
      chain().setImage({ src, alt: '' }).run()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const btn = (title: string, icon: ReactNode, onClick: () => void, active = false, disabled = false) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={!editor || disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        'grid size-8 cursor-pointer place-items-center transition-colors disabled:cursor-default disabled:opacity-40',
        active ? 'bg-fg text-bg' : 'text-fg hover:bg-ph',
      )}
    >
      {icon}
    </button>
  )

  const s = state ?? undefined
  return (
    <div className="border border-line focus-within:border-acc">
      <div role="toolbar" aria-label={`${label} — alati`} className="flex flex-wrap gap-0.5 border-b border-line p-1">
        {btn('Podebljano', <Bold size={16} />, () => chain().toggleBold().run(), s?.bold)}
        {btn('Kurziv', <Italic size={16} />, () => chain().toggleItalic().run(), s?.italic)}
        {btn('Precrtano', <Strikethrough size={16} />, () => chain().toggleStrike().run(), s?.strike)}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden="true" />
        {btn('Naslov', <Heading2 size={16} />, () => chain().toggleHeading({ level: 2 }).run(), s?.h2)}
        {btn('Podnaslov', <Heading3 size={16} />, () => chain().toggleHeading({ level: 3 }).run(), s?.h3)}
        {btn('Popis', <List size={16} />, () => chain().toggleBulletList().run(), s?.ul)}
        {btn('Numerirani popis', <ListOrdered size={16} />, () => chain().toggleOrderedList().run(), s?.ol)}
        {btn('Citat', <Quote size={16} />, () => chain().toggleBlockquote().run(), s?.quote)}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden="true" />
        {btn('Link', <Link size={16} />, setLink, s?.link)}
        {btn('Ukloni link', <Unlink size={16} />, () => chain().unsetLink().run(), false, !s?.link)}
        {btn('Slika', <ImagePlus size={16} />, () => fileRef.current?.click())}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden="true" />
        {btn('Poništi', <Undo2 size={16} />, () => chain().undo().run(), false, !s?.canUndo)}
        {btn('Ponovi', <Redo2 size={16} />, () => chain().redo().run(), false, !s?.canRedo)}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          hidden
          onChange={(e) => pickImage(e.target.files?.[0])}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
