---
read_when:
    - Je hebt gestructureerde bestandsbewerkingen in meerdere bestanden nodig
    - Je wilt bewerkingen op basis van patches documenteren of debuggen
summary: Pas patches voor meerdere bestanden toe met het apply_patch-hulpmiddel
title: apply_patch-tool
x-i18n:
    generated_at: "2026-05-06T09:33:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
---

Pas bestandswijzigingen toe met een gestructureerde patchindeling. Dit is ideaal voor bewerkingen met meerdere bestanden
of meerdere hunks waarbij één enkele `edit`-aanroep kwetsbaar zou zijn.

De tool accepteert één `input`-tekenreeks die één of meer bestandsbewerkingen omvat:

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

- `input` (required): Volledige patchinhoud inclusief `*** Begin Patch` en `*** End Patch`.

## Opmerkingen

- Patchpaden ondersteunen relatieve paden (vanaf de werkruimtemap) en absolute paden.
- `tools.exec.applyPatch.workspaceOnly` is standaard `true` (binnen de werkruimte). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de werkruimtemap schrijft/verwijdert.
- Gebruik `*** Move to:` binnen een `*** Update File:`-hunk om bestanden te hernoemen.
- `*** End of File` markeert indien nodig een invoeging die alleen EOF betreft.
- Standaard beschikbaar voor OpenAI- en OpenAI Codex-modellen. Stel
  `tools.exec.applyPatch.enabled: false` in om dit uit te schakelen.
- Optioneel per model beperken via
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

<CardGroup cols={2}>
  <Card title="Diffs" href="/nl/tools/diffs" icon="code-compare">
    Alleen-lezen diffviewer voor wijzigingspresentatie.
  </Card>
  <Card title="Exec-tool" href="/nl/tools/exec" icon="terminal">
    Uitvoering van shellopdrachten vanuit de agent.
  </Card>
  <Card title="Code-uitvoering" href="/nl/tools/code-execution" icon="square-code">
    Gesandboxte externe Python-analyse met xAI.
  </Card>
</CardGroup>
