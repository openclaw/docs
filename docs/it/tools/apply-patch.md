---
read_when:
    - Hai bisogno di modifiche strutturate ai file su più file
    - Vuoi documentare o fare debug di modifiche basate su patch
summary: Applicare patch multi-file con lo strumento apply_patch
title: strumento apply_patch
x-i18n:
    generated_at: "2026-04-24T09:03:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Applica modifiche ai file usando un formato di patch strutturato. È ideale per modifiche multi-file
o multi-hunk in cui una singola chiamata `edit` sarebbe fragile.

Lo strumento accetta una singola stringa `input` che racchiude una o più operazioni sui file:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parametri

- `input` (obbligatorio): contenuto completo della patch, inclusi `*** Begin Patch` e `*** End Patch`.

## Note

- I percorsi nella patch supportano percorsi relativi (dalla directory del workspace) e percorsi assoluti.
- `tools.exec.applyPatch.workspaceOnly` ha come predefinito `true` (contenuto nel workspace). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/elimini fuori dalla directory del workspace.
- Usa `*** Move to:` all'interno di un hunk `*** Update File:` per rinominare i file.
- `*** End of File` indica un inserimento solo-EOF quando necessario.
- Disponibile per impostazione predefinita per modelli OpenAI e OpenAI Codex. Imposta
  `tools.exec.applyPatch.enabled: false` per disabilitarlo.
- Facoltativamente puoi limitarlo per modello tramite
  `tools.exec.applyPatch.allowModels`.
- La configurazione si trova solo sotto `tools.exec`.

## Esempio

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Correlati

- [Diff](/it/tools/diffs)
- [Strumento exec](/it/tools/exec)
- [Esecuzione del codice](/it/tools/code-execution)
