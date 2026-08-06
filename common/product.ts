/**
 * Product metadata is intentionally centralized while the final commercial
 * name remains a deliberate owner decision. Update this module together with
 * package.json/electron-builder.json when the naming sanity check is complete.
 */
export const productMetadata = {
  workingName: 'ClipShelf',
  displayName: 'SimpleMacClipboardManager',
  productCategory: 'Visual Clipboard Shelf for Mac',
  appId: 'com.simplemacclipboardmanager.app',
  executableName: 'SimpleMacClipboardManager',
  updateChannel: 'stable',
  supportUrl: 'https://github.com/robbyczgw-cla/SimpleMacClipboardManager/issues',
  purchaseUrl: '',
  privacyUrl: 'https://github.com/robbyczgw-cla/SimpleMacClipboardManager/blob/main/PRIVACY.md'
} as const
