
import type { FileSystemItemType } from '@/types';
import { FileText, Folder, FileCode, Image as ImageIcon, FileJson, FileArchive, TerminalSquare } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface FileIconProps extends LucideProps {
  type: FileSystemItemType;
  name: string;
}

export function FileIcon({ type, name, ...props }: FileIconProps) {
  if (type === 'folder') {
    return <Folder {...props} />;
  }

  const extension = name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'html':
    case 'jsx':
    case 'tsx':
      return <FileCode {...props} color="orange" />;
    case 'css':
    case 'scss':
    case 'less':
      return <FileCode {...props} color="blue" />;
    case 'js':
    case 'ts':
      return <FileCode {...props} color="yellow" />;
    case 'json':
      return <FileJson {...props} color="green" />;
    case 'md':
      return <FileText {...props} color="gray" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <ImageIcon {...props} color="purple" />;
    case 'zip':
    case 'tar':
    case 'gz':
      return <FileArchive {...props} color="brown" />;
    case 'sh':
    case 'bash':
      return <TerminalSquare {...props} color="darkgreen"/>;
    default:
      return <FileText {...props} />;
  }
}
