---
read_when:
    - Je hebt gestructureerde bestandsbewerkingen in meerdere bestanden nodig
    - U wilt patchgebaseerde bewerkingen documenteren of debuggen
summary: Pas patches op meerdere bestanden toe met de tool apply_patch
title: apply_patch-tool
x-i18n:
    generated_at: "2026-07-12T09:20:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Pas bestandswijzigingen toe met een gestructureerde patchindeling. Dit is ideaal voor bewerkingen in meerdere bestanden
of met meerdere hunks, waarbij één `edit`-aanroep kwetsbaar zou zijn.

De tool accepteert één `input`-tekenreeks die een of meer bestandsbewerkingen omvat:

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

## Parameters

- `input` (vereist): Volledige patchinhoud, inclusief `*** Begin Patch` en `*** End Patch`.

## Opmerkingen

- Patchpaden ondersteunen relatieve paden (vanaf de werkruimtemap) en absolute paden.
- `tools.exec.applyPatch.workspaceOnly` is standaard ingesteld op `true` (beperkt tot de werkruimte). Stel dit alleen in op `false` als je bewust wilt dat `apply_patch` buiten de werkruimtemap schrijft of bestanden verwijdert.
- Gebruik `*** Move to:` binnen een `*** Update File:`-hunk om bestanden te hernoemen.
- `*** End of File` markeert indien nodig een invoeging die uitsluitend aan het einde van het bestand plaatsvindt.
- Standaard ingeschakeld voor elk model. Stel `tools.exec.applyPatch.enabled: false`
  in om dit uit te schakelen, of beperk het tot specifieke modellen met
  `tools.exec.applyPatch.allowModels` (accepteert onbewerkte id's zoals `gpt-5.4` of volledige
  id's zoals `openai/gpt-5.4`).
- De configuratie staat onder `tools.exec.applyPatch.*`.

## Voorbeeld

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Verschillen" href="/nl/tools/diffs" icon="code-compare">
    Alleen-lezen verschilweergave voor het presenteren van wijzigingen.
  </Card>
  <Card title="Exec-tool" href="/nl/tools/exec" icon="terminal">
    Uitvoering van shellopdrachten vanuit de agent.
  </Card>
  <Card title="Code-uitvoering" href="/nl/tools/code-execution" icon="square-code">
    Analyse met Python op afstand in een sandbox met xAI.
  </Card>
</CardGroup>
