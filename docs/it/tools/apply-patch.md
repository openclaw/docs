---
read_when:
    - Sono necessarie modifiche strutturate ai file in più file
    - Vuoi documentare o eseguire il debug di modifiche basate su patch
summary: Applica patch su più file con lo strumento apply_patch
title: strumento apply_patch
x-i18n:
    generated_at: "2026-05-06T09:09:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Applica modifiche ai file usando un formato di patch strutturato. È ideale per
modifiche su più file o con più blocchi, dove una singola chiamata `edit` sarebbe fragile.

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

- I percorsi delle patch supportano percorsi relativi (dalla directory dell'area di lavoro) e percorsi assoluti.
- `tools.exec.applyPatch.workspaceOnly` ha valore predefinito `true` (limitato all'area di lavoro). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/eliminini file al di fuori della directory dell'area di lavoro.
- Usa `*** Move to:` all'interno di un blocco `*** Update File:` per rinominare i file.
- `*** End of File` indica un inserimento solo EOF quando necessario.
- Disponibile per impostazione predefinita per i modelli OpenAI e OpenAI Codex. Imposta
  `tools.exec.applyPatch.enabled: false` per disabilitarlo.
- Facoltativamente, limita per modello tramite
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

<CardGroup cols={2}>
  <Card title="Diffs" href="/it/tools/diffs" icon="code-compare">
    Visualizzatore diff in sola lettura per la presentazione delle modifiche.
  </Card>
  <Card title="Exec tool" href="/it/tools/exec" icon="terminal">
    Esecuzione di comandi shell dall'agente.
  </Card>
  <Card title="Code execution" href="/it/tools/code-execution" icon="square-code">
    Analisi Python remota in sandbox con xAI.
  </Card>
</CardGroup>
