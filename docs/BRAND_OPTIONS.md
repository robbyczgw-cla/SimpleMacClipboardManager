# Brand Options and Naming Sanity Check

## Current decision

`ClipShelf` remains a private working name only. It should not become the
shipping name without a proper legal search: an App Store listing already uses
“ClipShelf” for a clipboard shelf, and `clipshelf.app` has an existing product
and privacy page.

This is a practical sanity check, not trademark or legal advice. Before a
rename, check the relevant jurisdictions, App Store records, domains, social
handles and repository availability again.

## Candidate scan

| Candidate | Initial signal | Main risk | Verdict |
| --- | --- | --- | --- |
| ClipShelf | Existing App Store product and clipshelf.app | High confusion and trademark risk | Reject |
| ClipDock | Existing macOS clipboard-shelf repository | Existing software collision | Reject |
| PastePocket | Descriptive and easy to say | “Paste” is crowded; generic | Keep as backup |
| CopyCove | Friendly, visual and local-first | “Cove” is common in software names | Keep as backup |
| ClipHarbor | Conveys a safe place for clips | Longer name; domain needs checking | Strong candidate |
| Shelfmark | Conveys saved references | “Shelfmark” is an established word | Medium risk |
| ClipNest | Conveys saved items and collections | Similar names likely in productivity tools | Medium risk |
| RecallShelf | Explains retrieval and shelf behavior | Less compact for an app name | Medium risk |
| SnippetHarbor | Strong for reusable text | Undersells images and files | Niche candidate |
| LocalClip | Clear privacy signal | Generic and likely crowded | Medium risk |

## Recommendation

Use `ClipHarbor` as the next placeholder for design exploration, with
`CopyCove` and `PastePocket` as alternatives. Do not rename the repository,
bundle identifier or shipped executable until the owner selects a name after a
legal/domain check. Runtime metadata is centralized in
`common/product.ts`; the build manifest remains intentionally unchanged until
that decision is made.

## Sources checked

- Existing [ClipShelf App Store listing](https://apps.apple.com/us/app/clipshelf/id6759576164)
- Existing [ClipShelf privacy site](https://www.clipshelf.app/privacy-policy/)
- Existing [ClipDock repository](https://github.com/appdev/ClipDock)

The candidate names above are not cleared names. Search results are evidence of
possible collisions, not a legal availability opinion.
