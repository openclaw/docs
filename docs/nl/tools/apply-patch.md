---
read_when:
    - Je hebt gestructureerde bestandsbewerkingen in meerdere bestanden nodig
    - Je wilt patchgebaseerde bewerkingen documenteren of debuggen
summary: Pas patches voor meerdere bestanden toe met de apply_patch-tool
title: apply_patch-hulpmiddel
x-i18n:
    generated_at: "2026-04-29T23:20:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 16
---

Pas bestandswijzigingen toe met een gestructureerde patch-indeling. Dit is ideaal voor bewerkingen in meerdere bestanden
of met meerdere hunks, waarbij één enkele `edit`-aanroep kwetsbaar zou zijn.

De tool accepteert één enkele `input`-tekenreeks die één of meer bestandsbewerkingen omvat:

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

## Parameters

- `input` (vereist): Volledige patchinhoud inclusief `*** Begin Patch` en `*** End Patch`.

## Opmerkingen

- Patchpaden ondersteunen relatieve paden (vanaf de werkruimtemap) en absolute paden.
- `tools.exec.applyPatch.workspaceOnly` staat standaard op `true` (beperkt tot de werkruimte). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de werkruimtemap schrijft/verwijdert.
- Gebruik `*** Move to:` binnen een `*** Update File:`-hunk om bestanden te hernoemen.
- `*** End of File` markeert indien nodig een invoeging alleen aan EOF.
- Standaard beschikbaar voor OpenAI- en OpenAI Codex-modellen. Stel
  `tools.exec.applyPatch.enabled: false` in om dit uit te schakelen.
- Optioneel per model afschermen via
  `tools.exec.applyPatch.allowModels`.
- Configuratie staat alleen onder `tools.exec`.

## Voorbeeld

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Gerelateerd

- [Diffs](/nl/tools/diffs)
- [Exec-tool](/nl/tools/exec)
- [Code-uitvoering](/nl/tools/code-execution)
