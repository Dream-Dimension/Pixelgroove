export enum FileType {
  VIDEO = 'video',
  IMAGE = 'image',
  TEXT = 'text'
};

interface P5File extends Blob {
  file: File
  type: FileType
  subtype: string
  name: string
  size: number
  data: string | ArrayBuffer | null
};

export default P5File;
