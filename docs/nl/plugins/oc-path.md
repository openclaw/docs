---
read_when:
    - Je wilt één afzonderlijk eindknooppunt in een werkruimtebestand vanuit de terminal inspecteren of bewerken
    - Je schrijft scripts die werken met de werkruimtestatus en hebt een stabiel, soortagnostisch adresseringsschema nodig
    - Je bepaalt of je de optionele `oc-path` Plugin wilt inschakelen op een zelfgehoste Gateway
summary: 'Gebundelde `oc-path`-Plugin: levert de `openclaw path` CLI mee voor het `oc://`-adresseringsschema voor werkruimtebestanden'
title: OC Path Plugin
x-i18n:
    generated_at: "2026-05-11T20:41:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

De meegeleverde `oc-path` Plugin voegt de [`openclaw path`](/nl/cli/path) CLI toe voor het
`oc://`-adresseringsschema voor workspace-bestanden. Het wordt meegeleverd in de OpenClaw-repo onder
`extensions/oc-path/`, maar is opt-in: install/build laat het slapend totdat je het
inschakelt.

`oc://`-adressen verwijzen naar een enkel blad (of een wildcard-set van bladeren) binnen
een workspace-bestand. De Plugin begrijpt momenteel drie soorten bestanden:

- **markdown** (`.md`, `.mdx`): frontmatter, secties, items, velden
- **jsonc** (`.jsonc`, `.json5`, `.json`): opmerkingen en opmaak blijven behouden
- **jsonl** (`.jsonl`, `.ndjson`): regelgeorienteerde records

Self-hosters en editor-extensies gebruiken de CLI om een enkel blad te lezen of schrijven
zonder rechtstreeks tegen de SDK te scripten; agents en hooks behandelen het als een
deterministische basis zodat byte-getrouwe roundtrips en de redaction-sentinelbescherming
uniform gelden voor alle soorten.

## Waarom inschakelen

Schakel `oc-path` in wanneer je scripts, hooks of lokale agent-tooling wilt laten wijzen
naar een precies stukje workspace-status zonder voor elke bestandsvorm een parser te
bedenken. Een enkel `oc://`-adres kan een markdown-frontmatter-sleutel, een sectie-item,
een JSONC-configuratieblad of een JSONL-eventveld benoemen.

Dat is belangrijk voor maintainer-workflows waarbij de wijziging klein,
controleerbaar en herhaalbaar moet zijn: inspecteer een waarde, vind overeenkomende
records, voer een dry-run van een schrijfactie uit en pas daarna alleen dat blad toe,
terwijl opmerkingen, regeleinden en nabije opmaak ongemoeid blijven. Door dit als
opt-in Plugin te houden, krijgen powerusers de adresseringsbasis zonder parserdependencies
of CLI-oppervlak in core te plaatsen voor installaties die die nooit nodig hebben.

Veelvoorkomende redenen om het in te schakelen:

- **Lokale automatisering**: shellscripts kunnen een workspace-waarde oplossen of bijwerken
  met `openclaw path … --json` in plaats van aparte markdown-, JSONC- en JSONL-parsecode
  mee te dragen.
- **Agent-zichtbare bewerkingen**: een agent kan een dry-run-diff tonen voor een
  geadresseerd blad voordat er wordt geschreven, wat makkelijker te beoordelen is dan een
  vrije herschrijving van een bestand.
- **Editor-integraties**: een editor kan `oc://AGENTS.md/tools/gh` koppelen aan de
  exacte markdown-node en het regelnummer zonder te gokken op basis van koptekst.
- **Diagnostiek**: `emit` laat een bestand roundtrippen via de parser en emitter, zodat
  je kunt controleren of een bestandstype byte-stabiel is voordat je vertrouwt op
  geautomatiseerde bewerkingen.

Concrete voorbeelden:

```bash
# Is de GitHub-Plugin ingeschakeld in deze configuratie?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Welke tool-call-namen komen voor in dit sessielog?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Welke bytes zou deze kleine configuratiebewerking schrijven?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

De Plugin is bewust niet de eigenaar van hogere semantiek. Memory-plugins blijven
eigenaar van memory-writes, configuratiecommando's blijven eigenaar van volledig
configuratiebeheer, en LKG-logica blijft eigenaar van restore/promotie. `oc-path` is de
smalle laag voor adressering en byte-behoudende bestandsbewerkingen waar die
hogere tools omheen kunnen bouwen.

## Waar het draait

De Plugin draait **in-process binnen de `openclaw` CLI** op de host waarop je
het commando aanroept. Het heeft geen draaiende Gateway nodig en opent geen
netwerksockets: elk werkwoord is een pure transformatie over een bestand dat je aanwijst.

De Plugin-metadata staat in `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` houdt de Plugin uit het hot path van de Gateway. `onCommands:
["path"]` vertelt de CLI om de Plugin lazy te laden de eerste keer dat je
`openclaw path …` uitvoert, zodat installaties die het werkwoord nooit gebruiken geen
kosten betalen.

## Inschakelen

```bash
openclaw plugins enable oc-path
```

Herstart de Gateway (als je er een draait) zodat de manifest-snapshot de nieuwe status
oppikt. Losse `openclaw path`-aanroepen werken onmiddellijk op dezelfde host:
de CLI laadt de Plugin op aanvraag.

Uitschakelen met:

```bash
openclaw plugins disable oc-path
```

## Dependencies

Alle parserdependencies zijn Plugin-lokaal: het inschakelen van `oc-path` haalt geen
nieuwe packages binnen in de core runtime:

| Dependency     | Doel                                                                |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | Subcommand-wiring voor `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | JSONC-parse + bladbewerking met behoud van opmerkingen en trailing commas. |
| `markdown-it`  | Markdown-tokenisatie voor het sectie-/item-/veldmodel.              |

JSONL blijft handgeschreven: regelgeorienteerd parsen is eenvoudiger dan welke
dependency dan ook, en de JSONC-parse per regel loopt al via `jsonc-parser`.

## Wat het biedt

| Oppervlak                     | Geleverd door                                           |
| ----------------------------- | ------------------------------------------------------- |
| `openclaw path` CLI           | `extensions/oc-path/cli-registration.ts`                |
| `oc://` parser / formatter    | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parse / emit / edit per soort | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Universele resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Redaction-sentinelbescherming | `extensions/oc-path/src/oc-path/sentinel.ts`            |

De CLI is vandaag het enige publieke oppervlak. De basiswerkwoorden zijn prive voor
de Plugin; consumers gebruiken de CLI (of bouwen hun eigen Plugin tegen de SDK).

## Relatie tot andere Plugins

- **`memory-*`**: memory-writes lopen via de memory-Plugins, niet via `oc-path`.
  `oc-path` is een generieke bestandsbasis; memory-Plugins leggen daar hun eigen
  semantiek bovenop.
- **LKG**: `path` weet niets van Last-Known-Good-configuratieherstel. Als een
  bestand door LKG wordt gevolgd, bepaalt de volgende `observe`-aanroep of er wordt
  gepromoveerd of hersteld; `set --batch` voor atomische multi-set via de LKG-promote/recover-
  lifecycle is gepland naast de LKG-recoverybasis.

## Veiligheid

`set` schrijft ruwe bytes via het emit-pad van de basis, dat automatisch de
redaction-sentinelbescherming toepast. Een blad dat
`__OPENCLAW_REDACTED__` bevat (letterlijk of als substring), wordt bij het schrijven
geweigerd met `OC_EMIT_SENTINEL`. De CLI scrubt ook de letterlijke sentinel uit elke
menselijke of JSON-output die het print, en vervangt die door `[REDACTED]` zodat
terminalcaptures en pipelines de marker nooit lekken.

## Gerelateerd

- [`openclaw path` CLI-referentie](/nl/cli/path)
- [Plugins beheren](/nl/plugins/manage-plugins)
- [Plugins bouwen](/nl/plugins/building-plugins)
