export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh'

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文'
}

export interface Translations {
  // Search
  search: string
  items: string
  noMatchingItems: string
  clipboardEmpty: string

  // Types
  all: string
  text: string
  link: string
  links: string
  image: string
  file: string
  files: string
  color: string
  colors: string

  // Actions
  paste: string
  plain: string
  preview: string
  quick: string
  toggle: string
  pin: string
  unpin: string
  delete: string
  close: string

  // Time
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string

  // Preview modal
  from: string
  colorValue: string
  pressToClose: string

  // Settings
  settings: string
  history: string
  maximumItems: string
  ignoreDuplicates: string
  ignoreDuplicatesDesc: string
  clearOnQuit: string
  clearOnQuitDesc: string
  behavior: string
  pollingInterval: string
  fast: string
  default: string
  slow: string
  launchAtLogin: string
  launchAtLoginDesc: string
  showInDock: string
  showInDockDesc: string
  playSoundOnCopy: string
  playSoundOnCopyDesc: string
  appearance: string
  panelPosition: string
  panelPositionDesc: string
  bottom: string
  top: string
  left: string
  right: string
  language: string
  languageDesc: string
  keyboard: string
  globalHotkey: string
  restartHotkey: string
  privacy: string
  ignorePasswordManagers: string
  ignorePasswordManagersDesc: string
  saveSettings: string
  settingsSaved: string
}

const en: Translations = {
  search: 'Search...',
  items: 'items',
  noMatchingItems: 'No matching items',
  clipboardEmpty: 'Clipboard history is empty',

  all: 'All',
  text: 'Text',
  link: 'Link',
  links: 'Links',
  image: 'Image',
  file: 'File',
  files: 'Files',
  color: 'Color',
  colors: 'Colors',

  paste: 'Paste',
  plain: 'Plain',
  preview: 'Preview',
  quick: 'Quick',
  toggle: 'to toggle',
  pin: 'Pin',
  unpin: 'Unpin',
  delete: 'Delete',
  close: 'Close',

  justNow: 'Just now',
  minutesAgo: 'm ago',
  hoursAgo: 'h ago',
  daysAgo: 'd ago',

  from: 'from',
  colorValue: 'Color value',
  pressToClose: 'Press Space or Esc to close',

  settings: 'Settings',
  history: 'History',
  maximumItems: 'Maximum items',
  ignoreDuplicates: 'Ignore duplicates',
  ignoreDuplicatesDesc: "Don't save consecutive identical copies",
  clearOnQuit: 'Clear history on quit',
  clearOnQuitDesc: 'Erase all data when closing',
  behavior: 'Behavior',
  pollingInterval: 'Polling interval',
  fast: 'Fast',
  default: 'Default',
  slow: 'Slow',
  launchAtLogin: 'Launch at login',
  launchAtLoginDesc: 'Start automatically when you log in',
  showInDock: 'Show in Dock',
  showInDockDesc: 'Display app icon in the Dock',
  playSoundOnCopy: 'Play sound on copy',
  playSoundOnCopyDesc: 'Audio feedback when saving to history',
  appearance: 'Appearance',
  panelPosition: 'Panel position',
  panelPositionDesc: 'Where the clipboard panel appears',
  bottom: 'Bottom',
  top: 'Top',
  left: 'Left',
  right: 'Right',
  language: 'Language',
  languageDesc: 'Interface language',
  keyboard: 'Keyboard',
  globalHotkey: 'Global hotkey',
  restartHotkey: 'Restart app after changing hotkey',
  privacy: 'Privacy',
  ignorePasswordManagers: 'Ignore password managers',
  ignorePasswordManagersDesc: "Don't capture from 1Password, Bitwarden, etc.",
  saveSettings: 'Save Settings',
  settingsSaved: 'Settings saved'
}

const es: Translations = {
  search: 'Buscar...',
  items: 'elementos',
  noMatchingItems: 'No hay elementos coincidentes',
  clipboardEmpty: 'El historial está vacío',

  all: 'Todo',
  text: 'Texto',
  link: 'Enlace',
  links: 'Enlaces',
  image: 'Imagen',
  file: 'Archivo',
  files: 'Archivos',
  color: 'Color',
  colors: 'Colores',

  paste: 'Pegar',
  plain: 'Plano',
  preview: 'Vista previa',
  quick: 'Rápido',
  toggle: 'para alternar',
  pin: 'Fijar',
  unpin: 'Desfijar',
  delete: 'Eliminar',
  close: 'Cerrar',

  justNow: 'Ahora',
  minutesAgo: 'm',
  hoursAgo: 'h',
  daysAgo: 'd',

  from: 'de',
  colorValue: 'Valor del color',
  pressToClose: 'Presiona Espacio o Esc para cerrar',

  settings: 'Ajustes',
  history: 'Historial',
  maximumItems: 'Elementos máximos',
  ignoreDuplicates: 'Ignorar duplicados',
  ignoreDuplicatesDesc: 'No guardar copias idénticas consecutivas',
  clearOnQuit: 'Borrar al salir',
  clearOnQuitDesc: 'Eliminar datos al cerrar',
  behavior: 'Comportamiento',
  pollingInterval: 'Intervalo de sondeo',
  fast: 'Rápido',
  default: 'Normal',
  slow: 'Lento',
  launchAtLogin: 'Iniciar al arrancar',
  launchAtLoginDesc: 'Iniciar automáticamente al iniciar sesión',
  showInDock: 'Mostrar en el Dock',
  showInDockDesc: 'Mostrar icono en el Dock',
  playSoundOnCopy: 'Sonido al copiar',
  playSoundOnCopyDesc: 'Retroalimentación de audio al guardar',
  appearance: 'Apariencia',
  panelPosition: 'Posición del panel',
  panelPositionDesc: 'Dónde aparece el panel',
  bottom: 'Abajo',
  top: 'Arriba',
  left: 'Izquierda',
  right: 'Derecha',
  language: 'Idioma',
  languageDesc: 'Idioma de la interfaz',
  keyboard: 'Teclado',
  globalHotkey: 'Atajo global',
  restartHotkey: 'Reiniciar después de cambiar el atajo',
  privacy: 'Privacidad',
  ignorePasswordManagers: 'Ignorar gestores de contraseñas',
  ignorePasswordManagersDesc: 'No capturar de 1Password, Bitwarden, etc.',
  saveSettings: 'Guardar ajustes',
  settingsSaved: 'Ajustes guardados'
}

const fr: Translations = {
  search: 'Rechercher...',
  items: 'éléments',
  noMatchingItems: 'Aucun élément correspondant',
  clipboardEmpty: "L'historique est vide",

  all: 'Tout',
  text: 'Texte',
  link: 'Lien',
  links: 'Liens',
  image: 'Image',
  file: 'Fichier',
  files: 'Fichiers',
  color: 'Couleur',
  colors: 'Couleurs',

  paste: 'Coller',
  plain: 'Brut',
  preview: 'Aperçu',
  quick: 'Rapide',
  toggle: 'pour basculer',
  pin: 'Épingler',
  unpin: 'Désépingler',
  delete: 'Supprimer',
  close: 'Fermer',

  justNow: "À l'instant",
  minutesAgo: 'min',
  hoursAgo: 'h',
  daysAgo: 'j',

  from: 'de',
  colorValue: 'Valeur de couleur',
  pressToClose: 'Appuyez sur Espace ou Échap pour fermer',

  settings: 'Paramètres',
  history: 'Historique',
  maximumItems: "Nombre maximum d'éléments",
  ignoreDuplicates: 'Ignorer les doublons',
  ignoreDuplicatesDesc: 'Ne pas enregistrer les copies identiques consécutives',
  clearOnQuit: 'Effacer à la fermeture',
  clearOnQuitDesc: 'Supprimer les données à la fermeture',
  behavior: 'Comportement',
  pollingInterval: 'Intervalle de vérification',
  fast: 'Rapide',
  default: 'Normal',
  slow: 'Lent',
  launchAtLogin: 'Lancer au démarrage',
  launchAtLoginDesc: 'Démarrer automatiquement à la connexion',
  showInDock: 'Afficher dans le Dock',
  showInDockDesc: "Afficher l'icône dans le Dock",
  playSoundOnCopy: 'Son à la copie',
  playSoundOnCopyDesc: "Retour audio lors de l'enregistrement",
  appearance: 'Apparence',
  panelPosition: 'Position du panneau',
  panelPositionDesc: 'Où le panneau apparaît',
  bottom: 'Bas',
  top: 'Haut',
  left: 'Gauche',
  right: 'Droite',
  language: 'Langue',
  languageDesc: "Langue de l'interface",
  keyboard: 'Clavier',
  globalHotkey: 'Raccourci global',
  restartHotkey: "Redémarrer après avoir changé le raccourci",
  privacy: 'Confidentialité',
  ignorePasswordManagers: 'Ignorer les gestionnaires de mots de passe',
  ignorePasswordManagersDesc: 'Ne pas capturer depuis 1Password, Bitwarden, etc.',
  saveSettings: 'Enregistrer',
  settingsSaved: 'Paramètres enregistrés'
}

const de: Translations = {
  search: 'Suchen...',
  items: 'Elemente',
  noMatchingItems: 'Keine passenden Elemente',
  clipboardEmpty: 'Zwischenablage ist leer',

  all: 'Alle',
  text: 'Text',
  link: 'Link',
  links: 'Links',
  image: 'Bild',
  file: 'Datei',
  files: 'Dateien',
  color: 'Farbe',
  colors: 'Farben',

  paste: 'Einfügen',
  plain: 'Nur Text',
  preview: 'Vorschau',
  quick: 'Schnell',
  toggle: 'umschalten',
  pin: 'Anheften',
  unpin: 'Lösen',
  delete: 'Löschen',
  close: 'Schließen',

  justNow: 'Gerade eben',
  minutesAgo: 'Min',
  hoursAgo: 'Std',
  daysAgo: 'T',

  from: 'von',
  colorValue: 'Farbwert',
  pressToClose: 'Leertaste oder Esc zum Schließen',

  settings: 'Einstellungen',
  history: 'Verlauf',
  maximumItems: 'Maximale Anzahl',
  ignoreDuplicates: 'Duplikate ignorieren',
  ignoreDuplicatesDesc: 'Keine aufeinanderfolgenden identischen Kopien speichern',
  clearOnQuit: 'Beim Beenden löschen',
  clearOnQuitDesc: 'Alle Daten beim Schließen löschen',
  behavior: 'Verhalten',
  pollingInterval: 'Abfrageintervall',
  fast: 'Schnell',
  default: 'Standard',
  slow: 'Langsam',
  launchAtLogin: 'Bei Anmeldung starten',
  launchAtLoginDesc: 'Automatisch bei Anmeldung starten',
  showInDock: 'Im Dock anzeigen',
  showInDockDesc: 'App-Symbol im Dock anzeigen',
  playSoundOnCopy: 'Ton beim Kopieren',
  playSoundOnCopyDesc: 'Akustisches Feedback beim Speichern',
  appearance: 'Darstellung',
  panelPosition: 'Panel-Position',
  panelPositionDesc: 'Wo das Panel erscheint',
  bottom: 'Unten',
  top: 'Oben',
  left: 'Links',
  right: 'Rechts',
  language: 'Sprache',
  languageDesc: 'Oberflächensprache',
  keyboard: 'Tastatur',
  globalHotkey: 'Globaler Shortcut',
  restartHotkey: 'Nach Änderung des Shortcuts neu starten',
  privacy: 'Datenschutz',
  ignorePasswordManagers: 'Passwort-Manager ignorieren',
  ignorePasswordManagersDesc: 'Nicht von 1Password, Bitwarden usw. erfassen',
  saveSettings: 'Speichern',
  settingsSaved: 'Einstellungen gespeichert'
}

const zh: Translations = {
  search: '搜索...',
  items: '项',
  noMatchingItems: '没有匹配的项目',
  clipboardEmpty: '剪贴板历史为空',

  all: '全部',
  text: '文本',
  link: '链接',
  links: '链接',
  image: '图片',
  file: '文件',
  files: '文件',
  color: '颜色',
  colors: '颜色',

  paste: '粘贴',
  plain: '纯文本',
  preview: '预览',
  quick: '快速',
  toggle: '切换',
  pin: '固定',
  unpin: '取消固定',
  delete: '删除',
  close: '关闭',

  justNow: '刚刚',
  minutesAgo: '分钟前',
  hoursAgo: '小时前',
  daysAgo: '天前',

  from: '来自',
  colorValue: '颜色值',
  pressToClose: '按空格键或Esc关闭',

  settings: '设置',
  history: '历史记录',
  maximumItems: '最大数量',
  ignoreDuplicates: '忽略重复',
  ignoreDuplicatesDesc: '不保存连续相同的复制',
  clearOnQuit: '退出时清除',
  clearOnQuitDesc: '关闭时删除所有数据',
  behavior: '行为',
  pollingInterval: '轮询间隔',
  fast: '快速',
  default: '默认',
  slow: '慢速',
  launchAtLogin: '登录时启动',
  launchAtLoginDesc: '登录时自动启动',
  showInDock: '在Dock中显示',
  showInDockDesc: '在Dock中显示应用图标',
  playSoundOnCopy: '复制时播放声音',
  playSoundOnCopyDesc: '保存时的音频反馈',
  appearance: '外观',
  panelPosition: '面板位置',
  panelPositionDesc: '面板出现的位置',
  bottom: '底部',
  top: '顶部',
  left: '左侧',
  right: '右侧',
  language: '语言',
  languageDesc: '界面语言',
  keyboard: '键盘',
  globalHotkey: '全局快捷键',
  restartHotkey: '更改快捷键后重启应用',
  privacy: '隐私',
  ignorePasswordManagers: '忽略密码管理器',
  ignorePasswordManagersDesc: '不从1Password、Bitwarden等捕获',
  saveSettings: '保存设置',
  settingsSaved: '设置已保存'
}

export const translations: Record<Language, Translations> = {
  en,
  es,
  fr,
  de,
  zh
}

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.en
}
