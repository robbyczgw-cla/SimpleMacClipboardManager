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
  emptyHint: string
  noMatchHint: string
  recent: string
  saved: string
  collections: string
  renameCollection: string
  deleteCollection: string
  addToCollection: string

  // Types
  all: string
  text: string
  link: string
  links: string
  image: string
  images: string
  file: string
  files: string
  color: string
  colors: string

  // Actions
  paste: string
  plain: string
  preview: string
  copy: string
  openUrl: string
  merge: string
  toggle: string
  multiSelectHint: string
  pin: string
  unpin: string
  delete: string
  close: string
  copied: string

  // Time
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string

  // Preview modal
  from: string
  colorValue: string
  pressToClose: string
  actions: string
  openInBrowser: string
  copyUrl: string
  copyDomain: string
  raw: string
  copyAs: string
  transformUpper: string
  transformLower: string
  transformTitle: string
  transformTrim: string

  // Settings
  settings: string
  history: string
  maximumItems: string
  maxImageSize: string
  maxImageSizeDesc: string
  defaultSuffix: string
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
  pasteDirectly: string
  pasteDirectlyDesc: string
  appearance: string
  panelPosition: string
  panelPositionDesc: string
  bottom: string
  top: string
  left: string
  right: string
  language: string
  languageDesc: string
  cardSize: string
  cardSizeDesc: string
  small: string
  medium: string
  large: string
  keyboard: string
  globalHotkey: string
  restartHotkey: string
  recordShortcut: string
  recordingPrompt: string
  privacy: string
  pauseCapture: string
  pauseFor5Minutes: string
  pauseFor30Minutes: string
  pauseIndefinitely: string
  resumeCapture: string
  capturePaused: string
  retention: string
  retentionDesc: string
  never: string
  oneDay: string
  sevenDays: string
  thirtyDays: string
  appExclusions: string
  appExclusionsDesc: string
  appExclusionsPlaceholder: string
  ignorePasswordManagers: string
  ignorePasswordManagersDesc: string
  loadFavicons: string
  loadFaviconsDesc: string
  ignoredPasteboardTypes: string
  ignoredPasteboardTypesDesc: string
  resetToDefaults: string
  backup: string
  exportHistory: string
  exportHistoryDesc: string
  exportPrivacyWarning: string
  exportBtn: string
  importHistory: string
  importHistoryDesc: string
  importBtn: string
  settingsSaved: string
  quit: string

  // Error boundary
  somethingWrong: string
  errorHint: string
}

const en: Translations = {
  search: 'Search…',
  items: 'items',
  noMatchingItems: 'No matching items',
  clipboardEmpty: 'Clipboard history is empty',
  emptyHint: 'Copy something to get started',
  noMatchHint: 'Try a different search or filter',
  recent: 'Recent',
  saved: 'Saved',
  collections: 'Collections',
  renameCollection: 'Rename',
  deleteCollection: 'Delete',
  addToCollection: 'Add to collection',

  all: 'All',
  text: 'Text',
  link: 'Link',
  links: 'Links',
  image: 'Image',
  images: 'Images',
  file: 'File',
  files: 'Files',
  color: 'Color',
  colors: 'Colors',

  paste: 'Paste',
  plain: 'Plain',
  preview: 'Preview',
  copy: 'Copy',
  openUrl: 'Open URL',
  merge: 'Merge',
  toggle: 'to toggle',
  multiSelectHint: '⇧Click to multi-select',
  pin: 'Pin',
  unpin: 'Unpin',
  delete: 'Delete',
  close: 'Close',
  copied: 'Copied',

  justNow: 'Just now',
  minutesAgo: 'm ago',
  hoursAgo: 'h ago',
  daysAgo: 'd ago',

  from: 'from',
  colorValue: 'Color value',
  pressToClose: 'Press Space or Esc to close',
  actions: 'Actions',
  openInBrowser: 'Open in Browser',
  copyUrl: 'Copy URL',
  copyDomain: 'Copy Domain',
  raw: 'Raw',
  copyAs: 'Copy as',
  transformUpper: 'UPPERCASE',
  transformLower: 'lowercase',
  transformTitle: 'Title Case',
  transformTrim: 'Trim Whitespace',

  settings: 'Settings',
  history: 'History',
  maximumItems: 'Maximum items',
  maxImageSize: 'Max image size',
  maxImageSizeDesc: 'Larger clipboard images will be downscaled before saving.',
  defaultSuffix: 'default',
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
  pasteDirectly: 'Paste directly',
  pasteDirectlyDesc: 'Auto-paste when selecting (off = copy only)',
  appearance: 'Appearance',
  panelPosition: 'Panel position',
  panelPositionDesc: 'Where the clipboard panel appears',
  bottom: 'Bottom',
  top: 'Top',
  left: 'Left',
  right: 'Right',
  language: 'Language',
  languageDesc: 'Interface language',
  cardSize: 'Card size',
  cardSizeDesc: 'Size of clipboard item cards',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  keyboard: 'Keyboard',
  globalHotkey: 'Global hotkey',
  restartHotkey: 'Applied immediately — no restart needed',
  recordShortcut: 'Record',
  recordingPrompt: 'Press keys…',
  privacy: 'Privacy',
  pauseCapture: 'Pause capture',
  pauseFor5Minutes: 'Pause for 5 minutes',
  pauseFor30Minutes: 'Pause for 30 minutes',
  pauseIndefinitely: 'Pause indefinitely',
  resumeCapture: 'Resume capture',
  capturePaused: 'Capture paused',
  retention: 'Recent retention',
  retentionDesc: 'Saved items are always kept.',
  never: 'Never',
  oneDay: '1 day',
  sevenDays: '7 days',
  thirtyDays: '30 days',
  appExclusions: 'Ignored apps',
  appExclusionsDesc: 'One app name or bundle identifier per line. Bundle IDs are more reliable.',
  appExclusionsPlaceholder: 'com.example.App\nExample App',
  ignorePasswordManagers: 'Ignore password managers',
  ignorePasswordManagersDesc: "Don't capture from 1Password, Bitwarden, etc.",
  loadFavicons: 'Load favicons for links',
  loadFaviconsDesc: 'If enabled, link domains may be requested from a favicon service.',
  ignoredPasteboardTypes: 'Ignored pasteboard types',
  ignoredPasteboardTypesDesc: 'One type per line. Matches Maccy defaults.',
  resetToDefaults: 'Reset to defaults',
  backup: 'Backup',
  exportHistory: 'Export History',
  exportHistoryDesc: 'Save clipboard history as JSON file',
  exportPrivacyWarning: 'Exports contain clipboard contents and may include sensitive information. Continue?',
  exportBtn: 'Export',
  importHistory: 'Import History',
  importHistoryDesc: 'Load clipboard history from JSON file',
  importBtn: 'Import',
  settingsSaved: 'Settings saved',
  quit: 'Quit',

  somethingWrong: 'Something went wrong',
  errorHint: 'Press Esc to close and try again'
}

const es: Translations = {
  search: 'Buscar…',
  items: 'elementos',
  noMatchingItems: 'No hay elementos coincidentes',
  clipboardEmpty: 'El historial está vacío',
  emptyHint: 'Copia algo para empezar',
  noMatchHint: 'Prueba otra búsqueda o filtro',
  recent: 'Recientes',
  saved: 'Guardado',
  collections: 'Colecciones',
  renameCollection: 'Renombrar',
  deleteCollection: 'Eliminar',
  addToCollection: 'Añadir a la colección',

  all: 'Todo',
  text: 'Texto',
  link: 'Enlace',
  links: 'Enlaces',
  image: 'Imagen',
  images: 'Imágenes',
  file: 'Archivo',
  files: 'Archivos',
  color: 'Color',
  colors: 'Colores',

  paste: 'Pegar',
  plain: 'Plano',
  preview: 'Vista previa',
  copy: 'Copiar',
  openUrl: 'Abrir URL',
  merge: 'Combinar',
  toggle: 'para alternar',
  multiSelectHint: '⇧Clic para multiselección',
  pin: 'Fijar',
  unpin: 'Desfijar',
  delete: 'Eliminar',
  close: 'Cerrar',
  copied: 'Copiado',

  justNow: 'Ahora',
  minutesAgo: 'm',
  hoursAgo: 'h',
  daysAgo: 'd',

  from: 'de',
  colorValue: 'Valor del color',
  pressToClose: 'Presiona Espacio o Esc para cerrar',
  actions: 'Acciones',
  openInBrowser: 'Abrir en el navegador',
  copyUrl: 'Copiar URL',
  copyDomain: 'Copiar dominio',
  raw: 'Crudo',
  copyAs: 'Copiar como',
  transformUpper: 'MAYÚSCULAS',
  transformLower: 'minúsculas',
  transformTitle: 'Tipo Título',
  transformTrim: 'Quitar espacios',

  settings: 'Ajustes',
  history: 'Historial',
  maximumItems: 'Elementos máximos',
  maxImageSize: 'Tamaño máx. de imagen',
  maxImageSizeDesc: 'Las imágenes más grandes se reducirán antes de guardarse.',
  defaultSuffix: 'predeterminado',
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
  pasteDirectly: 'Pegar directamente',
  pasteDirectlyDesc: 'Pegar automáticamente al seleccionar (desactivado = solo copiar)',
  appearance: 'Apariencia',
  panelPosition: 'Posición del panel',
  panelPositionDesc: 'Dónde aparece el panel',
  bottom: 'Abajo',
  top: 'Arriba',
  left: 'Izquierda',
  right: 'Derecha',
  language: 'Idioma',
  languageDesc: 'Idioma de la interfaz',
  cardSize: 'Tamaño de tarjeta',
  cardSizeDesc: 'Tamaño de las tarjetas del portapapeles',
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
  keyboard: 'Teclado',
  globalHotkey: 'Atajo global',
  restartHotkey: 'Se aplica al instante, sin reiniciar',
  recordShortcut: 'Grabar',
  recordingPrompt: 'Pulsa teclas…',
  privacy: 'Privacidad',
  pauseCapture: 'Pausar captura',
  pauseFor5Minutes: 'Pausar 5 minutos',
  pauseFor30Minutes: 'Pausar 30 minutos',
  pauseIndefinitely: 'Pausar indefinidamente',
  resumeCapture: 'Reanudar captura',
  capturePaused: 'Captura pausada',
  retention: 'Retención de recientes',
  retentionDesc: 'Los elementos guardados siempre se conservan.',
  never: 'Nunca',
  oneDay: '1 día',
  sevenDays: '7 días',
  thirtyDays: '30 días',
  appExclusions: 'Aplicaciones ignoradas',
  appExclusionsDesc: 'Un nombre o identificador de paquete por línea. Los identificadores son más fiables.',
  appExclusionsPlaceholder: 'com.example.App\nAplicación',
  ignorePasswordManagers: 'Ignorar gestores de contraseñas',
  ignorePasswordManagersDesc: 'No capturar de 1Password, Bitwarden, etc.',
  loadFavicons: 'Cargar favicons de enlaces',
  loadFaviconsDesc: 'Si se activa, los dominios pueden solicitarse a un servicio de favicons.',
  ignoredPasteboardTypes: 'Tipos de portapapeles ignorados',
  ignoredPasteboardTypesDesc: 'Un tipo por línea. Coincide con los valores de Maccy.',
  resetToDefaults: 'Restablecer',
  backup: 'Copia de seguridad',
  exportHistory: 'Exportar historial',
  exportHistoryDesc: 'Guardar el historial como archivo JSON',
  exportPrivacyWarning: 'Las exportaciones contienen el portapapeles y pueden incluir información sensible. ¿Continuar?',
  exportBtn: 'Exportar',
  importHistory: 'Importar historial',
  importHistoryDesc: 'Cargar el historial desde un archivo JSON',
  importBtn: 'Importar',
  settingsSaved: 'Ajustes guardados',
  quit: 'Salir',

  somethingWrong: 'Algo salió mal',
  errorHint: 'Pulsa Esc para cerrar e inténtalo de nuevo'
}

const fr: Translations = {
  search: 'Rechercher…',
  items: 'éléments',
  noMatchingItems: 'Aucun élément correspondant',
  clipboardEmpty: "L'historique est vide",
  emptyHint: 'Copiez quelque chose pour commencer',
  noMatchHint: 'Essayez une autre recherche ou un filtre',
  recent: 'Récents',
  saved: 'Enregistrés',
  collections: 'Collections',
  renameCollection: 'Renommer',
  deleteCollection: 'Supprimer',
  addToCollection: 'Ajouter à la collection',

  all: 'Tout',
  text: 'Texte',
  link: 'Lien',
  links: 'Liens',
  image: 'Image',
  images: 'Images',
  file: 'Fichier',
  files: 'Fichiers',
  color: 'Couleur',
  colors: 'Couleurs',

  paste: 'Coller',
  plain: 'Brut',
  preview: 'Aperçu',
  copy: 'Copier',
  openUrl: 'Ouvrir URL',
  merge: 'Fusionner',
  toggle: 'pour basculer',
  multiSelectHint: '⇧Clic pour multi-sélection',
  pin: 'Épingler',
  unpin: 'Désépingler',
  delete: 'Supprimer',
  close: 'Fermer',
  copied: 'Copié',

  justNow: "À l'instant",
  minutesAgo: 'min',
  hoursAgo: 'h',
  daysAgo: 'j',

  from: 'de',
  colorValue: 'Valeur de couleur',
  pressToClose: 'Appuyez sur Espace ou Échap pour fermer',
  actions: 'Actions',
  openInBrowser: 'Ouvrir dans le navigateur',
  copyUrl: "Copier l'URL",
  copyDomain: 'Copier le domaine',
  raw: 'Brut',
  copyAs: 'Copier comme',
  transformUpper: 'MAJUSCULES',
  transformLower: 'minuscules',
  transformTitle: 'Casse de Titre',
  transformTrim: 'Supprimer les espaces',

  settings: 'Paramètres',
  history: 'Historique',
  maximumItems: "Nombre maximum d'éléments",
  maxImageSize: "Taille max. d'image",
  maxImageSizeDesc: 'Les images plus grandes seront réduites avant enregistrement.',
  defaultSuffix: 'par défaut',
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
  pasteDirectly: 'Coller directement',
  pasteDirectlyDesc: 'Coller automatiquement à la sélection (désactivé = copie seule)',
  appearance: 'Apparence',
  panelPosition: 'Position du panneau',
  panelPositionDesc: 'Où le panneau apparaît',
  bottom: 'Bas',
  top: 'Haut',
  left: 'Gauche',
  right: 'Droite',
  language: 'Langue',
  languageDesc: "Langue de l'interface",
  cardSize: 'Taille des cartes',
  cardSizeDesc: 'Taille des cartes du presse-papiers',
  small: 'Petite',
  medium: 'Moyenne',
  large: 'Grande',
  keyboard: 'Clavier',
  globalHotkey: 'Raccourci global',
  restartHotkey: 'Appliqué immédiatement, sans redémarrage',
  recordShortcut: 'Enregistrer',
  recordingPrompt: 'Appuyez sur des touches…',
  privacy: 'Confidentialité',
  pauseCapture: 'Mettre en pause la capture',
  pauseFor5Minutes: 'Pause de 5 minutes',
  pauseFor30Minutes: 'Pause de 30 minutes',
  pauseIndefinitely: 'Pause indéfinie',
  resumeCapture: 'Reprendre la capture',
  capturePaused: 'Capture en pause',
  retention: 'Rétention des récents',
  retentionDesc: 'Les éléments enregistrés sont toujours conservés.',
  never: 'Jamais',
  oneDay: '1 jour',
  sevenDays: '7 jours',
  thirtyDays: '30 jours',
  appExclusions: 'Applications ignorées',
  appExclusionsDesc: 'Un nom ou identifiant de bundle par ligne. Les identifiants sont plus fiables.',
  appExclusionsPlaceholder: 'com.example.App\nApplication',
  ignorePasswordManagers: 'Ignorer les gestionnaires de mots de passe',
  ignorePasswordManagersDesc: 'Ne pas capturer depuis 1Password, Bitwarden, etc.',
  loadFavicons: 'Charger les favicons des liens',
  loadFaviconsDesc: 'Si activé, les domaines peuvent être demandés à un service de favicons.',
  ignoredPasteboardTypes: 'Types de presse-papiers ignorés',
  ignoredPasteboardTypesDesc: 'Un type par ligne. Correspond aux valeurs de Maccy.',
  resetToDefaults: 'Réinitialiser',
  backup: 'Sauvegarde',
  exportHistory: "Exporter l'historique",
  exportHistoryDesc: "Enregistrer l'historique en JSON",
  exportPrivacyWarning: 'Les exports contiennent le presse-papiers et peuvent inclure des informations sensibles. Continuer ?',
  exportBtn: 'Exporter',
  importHistory: "Importer l'historique",
  importHistoryDesc: "Charger l'historique depuis un JSON",
  importBtn: 'Importer',
  settingsSaved: 'Paramètres enregistrés',
  quit: 'Quitter',

  somethingWrong: "Une erreur s'est produite",
  errorHint: 'Appuyez sur Échap pour fermer et réessayer'
}

const de: Translations = {
  search: 'Suchen…',
  items: 'Elemente',
  noMatchingItems: 'Keine passenden Elemente',
  clipboardEmpty: 'Zwischenablage ist leer',
  emptyHint: 'Kopiere etwas, um zu starten',
  noMatchHint: 'Andere Suche oder Filter versuchen',
  recent: 'Zuletzt',
  saved: 'Gespeichert',
  collections: 'Sammlungen',
  renameCollection: 'Umbenennen',
  deleteCollection: 'Löschen',
  addToCollection: 'Zur Sammlung hinzufügen',

  all: 'Alle',
  text: 'Text',
  link: 'Link',
  links: 'Links',
  image: 'Bild',
  images: 'Bilder',
  file: 'Datei',
  files: 'Dateien',
  color: 'Farbe',
  colors: 'Farben',

  paste: 'Einfügen',
  plain: 'Nur Text',
  preview: 'Vorschau',
  copy: 'Kopieren',
  openUrl: 'URL öffnen',
  merge: 'Zusammenführen',
  toggle: 'umschalten',
  multiSelectHint: '⇧Klick für Mehrfachauswahl',
  pin: 'Anheften',
  unpin: 'Lösen',
  delete: 'Löschen',
  close: 'Schließen',
  copied: 'Kopiert',

  justNow: 'Gerade eben',
  minutesAgo: 'Min',
  hoursAgo: 'Std',
  daysAgo: 'T',

  from: 'von',
  colorValue: 'Farbwert',
  pressToClose: 'Leertaste oder Esc zum Schließen',
  actions: 'Aktionen',
  openInBrowser: 'Im Browser öffnen',
  copyUrl: 'URL kopieren',
  copyDomain: 'Domain kopieren',
  raw: 'Roh',
  copyAs: 'Kopieren als',
  transformUpper: 'GROSSBUCHSTABEN',
  transformLower: 'kleinbuchstaben',
  transformTitle: 'Wortanfänge Groß',
  transformTrim: 'Leerzeichen entfernen',

  settings: 'Einstellungen',
  history: 'Verlauf',
  maximumItems: 'Maximale Anzahl',
  maxImageSize: 'Max. Bildgröße',
  maxImageSizeDesc: 'Größere Bilder werden vor dem Speichern verkleinert.',
  defaultSuffix: 'Standard',
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
  pasteDirectly: 'Direkt einfügen',
  pasteDirectlyDesc: 'Beim Auswählen automatisch einfügen (aus = nur kopieren)',
  appearance: 'Darstellung',
  panelPosition: 'Panel-Position',
  panelPositionDesc: 'Wo das Panel erscheint',
  bottom: 'Unten',
  top: 'Oben',
  left: 'Links',
  right: 'Rechts',
  language: 'Sprache',
  languageDesc: 'Oberflächensprache',
  cardSize: 'Kartengröße',
  cardSizeDesc: 'Größe der Zwischenablage-Karten',
  small: 'Klein',
  medium: 'Mittel',
  large: 'Groß',
  keyboard: 'Tastatur',
  globalHotkey: 'Globaler Shortcut',
  restartHotkey: 'Wird sofort angewendet – kein Neustart nötig',
  recordShortcut: 'Aufnehmen',
  recordingPrompt: 'Tasten drücken…',
  privacy: 'Datenschutz',
  pauseCapture: 'Aufzeichnung pausieren',
  pauseFor5Minutes: '5 Minuten pausieren',
  pauseFor30Minutes: '30 Minuten pausieren',
  pauseIndefinitely: 'Unbegrenzt pausieren',
  resumeCapture: 'Aufzeichnung fortsetzen',
  capturePaused: 'Aufzeichnung pausiert',
  retention: 'Aufbewahrung für „Zuletzt“',
  retentionDesc: 'Gespeicherte Einträge bleiben immer erhalten.',
  never: 'Nie',
  oneDay: '1 Tag',
  sevenDays: '7 Tage',
  thirtyDays: '30 Tage',
  appExclusions: 'Ignorierte Apps',
  appExclusionsDesc: 'Ein App-Name oder eine Bundle-ID pro Zeile. Bundle-IDs sind zuverlässiger.',
  appExclusionsPlaceholder: 'com.example.App\nBeispiel-App',
  ignorePasswordManagers: 'Passwort-Manager ignorieren',
  ignorePasswordManagersDesc: 'Nicht von 1Password, Bitwarden usw. erfassen',
  loadFavicons: 'Favicons für Links laden',
  loadFaviconsDesc: 'Wenn aktiv, werden Domains ggf. an einen Favicon-Dienst gesendet.',
  ignoredPasteboardTypes: 'Ignorierte Pasteboard-Typen',
  ignoredPasteboardTypesDesc: 'Ein Typ pro Zeile. Entspricht den Maccy-Standards.',
  resetToDefaults: 'Zurücksetzen',
  backup: 'Sicherung',
  exportHistory: 'Verlauf exportieren',
  exportHistoryDesc: 'Verlauf als JSON-Datei speichern',
  exportPrivacyWarning: 'Exporte enthalten Zwischenablageinhalte und können sensible Informationen enthalten. Fortfahren?',
  exportBtn: 'Exportieren',
  importHistory: 'Verlauf importieren',
  importHistoryDesc: 'Verlauf aus JSON-Datei laden',
  importBtn: 'Importieren',
  settingsSaved: 'Einstellungen gespeichert',
  quit: 'Beenden',

  somethingWrong: 'Etwas ist schiefgelaufen',
  errorHint: 'Esc drücken zum Schließen und erneut versuchen'
}

const zh: Translations = {
  search: '搜索…',
  items: '项',
  noMatchingItems: '没有匹配的项目',
  clipboardEmpty: '剪贴板历史为空',
  emptyHint: '复制内容即可开始',
  noMatchHint: '尝试其他搜索或筛选',
  recent: '最近',
  saved: '已保存',
  collections: '收藏夹',
  renameCollection: '重命名',
  deleteCollection: '删除',
  addToCollection: '添加到收藏夹',

  all: '全部',
  text: '文本',
  link: '链接',
  links: '链接',
  image: '图片',
  images: '图片',
  file: '文件',
  files: '文件',
  color: '颜色',
  colors: '颜色',

  paste: '粘贴',
  plain: '纯文本',
  preview: '预览',
  copy: '复制',
  openUrl: '打开链接',
  merge: '合并',
  toggle: '切换',
  multiSelectHint: '⇧点击多选',
  pin: '固定',
  unpin: '取消固定',
  delete: '删除',
  close: '关闭',
  copied: '已复制',

  justNow: '刚刚',
  minutesAgo: '分钟前',
  hoursAgo: '小时前',
  daysAgo: '天前',

  from: '来自',
  colorValue: '颜色值',
  pressToClose: '按空格键或 Esc 关闭',
  actions: '操作',
  openInBrowser: '在浏览器中打开',
  copyUrl: '复制链接',
  copyDomain: '复制域名',
  raw: '原始',
  copyAs: '复制为',
  transformUpper: '大写',
  transformLower: '小写',
  transformTitle: '标题格式',
  transformTrim: '去除空格',

  settings: '设置',
  history: '历史记录',
  maximumItems: '最大数量',
  maxImageSize: '最大图片大小',
  maxImageSizeDesc: '较大的图片在保存前会被缩小。',
  defaultSuffix: '默认',
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
  showInDock: '在 Dock 中显示',
  showInDockDesc: '在 Dock 中显示应用图标',
  playSoundOnCopy: '复制时播放声音',
  playSoundOnCopyDesc: '保存时的音频反馈',
  pasteDirectly: '直接粘贴',
  pasteDirectlyDesc: '选择时自动粘贴（关闭 = 仅复制）',
  appearance: '外观',
  panelPosition: '面板位置',
  panelPositionDesc: '面板出现的位置',
  bottom: '底部',
  top: '顶部',
  left: '左侧',
  right: '右侧',
  language: '语言',
  languageDesc: '界面语言',
  cardSize: '卡片大小',
  cardSizeDesc: '剪贴板卡片的大小',
  small: '小',
  medium: '中',
  large: '大',
  keyboard: '键盘',
  globalHotkey: '全局快捷键',
  restartHotkey: '立即生效，无需重启',
  recordShortcut: '录制',
  recordingPrompt: '请按键…',
  privacy: '隐私',
  pauseCapture: '暂停捕获',
  pauseFor5Minutes: '暂停 5 分钟',
  pauseFor30Minutes: '暂停 30 分钟',
  pauseIndefinitely: '无限期暂停',
  resumeCapture: '恢复捕获',
  capturePaused: '捕获已暂停',
  retention: '最近记录保留时间',
  retentionDesc: '已保存的项目始终保留。',
  never: '永不',
  oneDay: '1 天',
  sevenDays: '7 天',
  thirtyDays: '30 天',
  appExclusions: '忽略的应用',
  appExclusionsDesc: '每行填写一个应用名称或包标识符。包标识符更可靠。',
  appExclusionsPlaceholder: 'com.example.App\n示例应用',
  ignorePasswordManagers: '忽略密码管理器',
  ignorePasswordManagersDesc: '不从 1Password、Bitwarden 等捕获',
  loadFavicons: '加载链接的网站图标',
  loadFaviconsDesc: '如果启用，域名可能会请求到图标服务。',
  ignoredPasteboardTypes: '忽略的剪贴板类型',
  ignoredPasteboardTypesDesc: '每行一个类型。与 Maccy 默认值一致。',
  resetToDefaults: '恢复默认',
  backup: '备份',
  exportHistory: '导出历史',
  exportHistoryDesc: '将剪贴板历史保存为 JSON 文件',
  exportPrivacyWarning: '导出文件包含剪贴板内容，可能含有敏感信息。继续吗？',
  exportBtn: '导出',
  importHistory: '导入历史',
  importHistoryDesc: '从 JSON 文件加载剪贴板历史',
  importBtn: '导入',
  settingsSaved: '设置已保存',
  quit: '退出',

  somethingWrong: '出现错误',
  errorHint: '按 Esc 关闭并重试'
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
