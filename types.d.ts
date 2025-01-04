declare type TagTag = {
  title: string;
  text: string;
};

declare type TextPosition = {
  line: number;
  column: number;
};

declare type Doclet = {
  classes?: Doclet[];
  modules?: Doclet[];
  functions?: Doclet[];
  parameters?: Doclet[];
  members?: Doclet[];
  constants?: Doclet[];
  returns?: Doclet[];
  kind?: string;
  undocumented?: boolean;
  included?: boolean;
  classdesc?: string;
  isDefault?: boolean;
  description?: string;
  tocDescription?: string;
  category?: string;
  scope?: string;
  access?: string;
  name?: string;
  type?: { names: string[] };
  comment?: string;
  longname?: string;
  memberof?: string;
  meta?: {
    filename?: string;
    path?: string;
    code?: {
      name?: string;
      node?: {
        kind?: string;
        loc?: {
          start?: TextPosition;
          end?: TextPosition;
        };
      };
    };
  };
  params?: Doclet[];
  tags?: TagTag[];
};

declare type Salty = {
  (query: any): SaltyDatabase;
};

declare type SaltyDatabase = {
  remove(): void;
  get(): Doclet[];
};

declare type DocletProcessorStep = {
  condition?: (d: Doclet) => boolean;
  process?: (d: Doclet) => void;
  value?: (d: Doclet) => any;
};

declare type DocletProcessorConfiguration = Record<string, DocletProcessorStep>;

declare type JsDocPluginEventHandlers = {
  parseComplete: (parseCompleteEvent: { doclets: Doclet[] }) => void;
  newDoclet: (newDocletEvent: { doclet: Doclet }) => void;
};

declare type DocletTagger = {
  onTagged: (doclet: Doclet, tag: TagTag) => void;
};

declare type JsDocDictionary = {
  defineTag: (tag: string, callback: DocletTagger) => void;
};

declare type JsDocPluginTagCreator = {
  (dictionary: JsDocDictionary): void;
};
