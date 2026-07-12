---
read_when:
    - Hai bisogno di modifiche strutturate ai file in più file
    - Vuoi documentare o eseguire il debug delle modifiche basate su patch
summary: Applica patch a più file con lo strumento apply_patch
title: strumento apply_patch
x-i18n:
    generated_at: "2026-07-12T07:31:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Applica le modifiche ai file usando un formato di patch strutturato. È ideale per modifiche
su più file o con più blocchi, per le quali una singola chiamata `edit` sarebbe fragile.

Lo strumento accetta un'unica stringa `input` che racchiude una o più operazioni sui file:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parametri

- `input` (obbligatorio): contenuto completo della patch, inclusi `*** Begin Patch` e `*** End Patch`.

## Note

- I percorsi della patch supportano percorsi relativi (dalla directory dell'area di lavoro) e percorsi assoluti.
- Il valore predefinito di `tools.exec.applyPatch.workspaceOnly` è `true` (limitato all'area di lavoro). Impostalo su `false` solo se desideri intenzionalmente che `apply_patch` scriva o elimini elementi al di fuori della directory dell'area di lavoro.
- Usa `*** Move to:` all'interno di un blocco `*** Update File:` per rinominare i file.
- `*** End of File` contrassegna, quando necessario, un inserimento esclusivamente alla fine del file.
- È abilitato per impostazione predefinita per ogni modello. Imposta `tools.exec.applyPatch.enabled: false`
  per disabilitarlo oppure limitalo a modelli specifici con
  `tools.exec.applyPatch.allowModels` (accetta ID non qualificati come `gpt-5.4` o ID completi
  come `openai/gpt-5.4`).
- La configurazione si trova in `tools.exec.applyPatch.*`.

## Esempio

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Diff" href="/it/tools/diffs" icon="code-compare">
    Visualizzatore di diff in sola lettura per presentare le modifiche.
  </Card>
  <Card title="Strumento Exec" href="/it/tools/exec" icon="terminal">
    Esecuzione di comandi shell da parte dell'agente.
  </Card>
  <Card title="Esecuzione del codice" href="/it/tools/code-execution" icon="square-code">
    Analisi Python remota in ambiente isolato con xAI.
  </Card>
</CardGroup>
