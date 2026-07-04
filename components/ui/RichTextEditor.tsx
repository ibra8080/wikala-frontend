'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  dir?: 'ltr' | 'rtl'
}

export default function RichTextEditor({ value, onChange, placeholder, dir = 'ltr' }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'wk-editor min-h-[140px] px-3 py-2 focus:outline-none',
        dir,
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  return (
    <div className="border border-[#E0DDDA] rounded-lg bg-white overflow-hidden focus-within:ring-1 focus-within:ring-[#1B2A4A]">
      <div className="flex gap-1 px-2 py-1.5 border-b border-[#E0DDDA] bg-[#FAFAF8]">
        <ToolBtn
          active={editor?.isActive('bold') ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn
          active={editor?.isActive('italic') ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </ToolBtn>
        <ToolBtn
          active={editor?.isActive('heading', { level: 3 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading"
        >
          H
        </ToolBtn>
        <ToolBtn
          active={editor?.isActive('bulletList') ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          •—
        </ToolBtn>
        <ToolBtn
          active={editor?.isActive('orderedList') ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
        >
          1—
        </ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={`px-2 py-0.5 rounded text-xs transition ${
        active
          ? 'bg-[#1B2A4A] text-white'
          : 'text-[#6B6560] hover:bg-[#EEECEA]'
      }`}
    >
      {children}
    </button>
  )
}
