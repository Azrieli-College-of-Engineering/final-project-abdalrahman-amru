interface MarkdownToolbarProps {
  onInsert: (before: string, after: string, defaultText?: string) => void;
}

export default function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const tools = [
    {
      icon: 'format_bold',
      label: 'Bold',
      action: () => onInsert('**', '**', 'bold text'),
    },
    {
      icon: 'format_italic',
      label: 'Italic',
      action: () => onInsert('_', '_', 'italic text'),
    },
    {
      icon: 'format_strikethrough',
      label: 'Strikethrough',
      action: () => onInsert('~~', '~~', 'strikethrough text'),
    },
    {
      icon: 'title',
      label: 'Heading',
      action: () => onInsert('## ', '', 'Heading'),
    },
    {
      icon: 'format_list_bulleted',
      label: 'Bullet List',
      action: () => onInsert('- ', '', 'List item'),
    },
    {
      icon: 'format_list_numbered',
      label: 'Numbered List',
      action: () => onInsert('1. ', '', 'List item'),
    },
    {
      icon: 'check_box',
      label: 'Checklist',
      action: () => onInsert('- [ ] ', '', 'Todo item'),
    },
    {
      icon: 'code',
      label: 'Inline Code',
      action: () => onInsert('`', '`', 'code'),
    },
    {
      icon: 'code_blocks',
      label: 'Code Block',
      action: () => onInsert('```\n', '\n```', 'code block'),
    },
    {
      icon: 'format_quote',
      label: 'Quote',
      action: () => onInsert('> ', '', 'Quote'),
    },
    {
      icon: 'link',
      label: 'Link',
      action: () => onInsert('[', '](url)', 'link text'),
    },
    {
      icon: 'horizontal_rule',
      label: 'Divider',
      action: () => onInsert('\n---\n', '', ''),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[#e5e7eb] dark:border-[#2d3748] bg-[#f9fafb] dark:bg-[#171923]">
      {tools.map((tool, index) => (
        <button
          key={index}
          onClick={tool.action}
          title={tool.label}
          className="p-2 rounded hover:bg-white dark:hover:bg-[#1a202c] text-[#617589] dark:text-[#a0aec0] hover:text-primary dark:hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2 text-xs text-[#617589] dark:text-[#a0aec0] px-2">
        <span className="material-symbols-outlined text-[16px]">info</span>
        <span className="hidden sm:inline">Markdown supported</span>
      </div>
    </div>
  );
}
