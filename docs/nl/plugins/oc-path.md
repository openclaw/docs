---
read_when:
    - Je wilt één enkel bladonderdeel in een werkruimtebestand vanuit de terminal inspecteren of bewerken
    - U script tegen de werkruimtestatus en hebt een stabiel, soort-agnostisch adresseringsschema nodig
    - Je beslist of je de optionele `oc-path`-Plugin wilt inschakelen op een zelf gehoste Gateway
summary: 'Gebundelde `oc-path` Plugin: levert de `openclaw path` CLI voor het `oc://` adresseringsschema voor werkruimtebestanden'
title: OC Path Plugin
x-i18n:
    generated_at: "2026-06-27T17:56:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

De gebundelde `oc-path`-Plugin voegt de [`openclaw path`](/nl/cli/path) CLI toe voor het
`oc://` adresseringsschema voor werkruimtebestanden. Het wordt meegeleverd in de OpenClaw-repo onder
`extensions/oc-path/`, maar is opt-in: installeren/bouwen laat het slapend totdat je
het inschakelt.

`oc://`-adressen wijzen naar een enkel blad (of een wildcardset van bladeren) binnen
een werkruimtebestand. De Plugin begrijpt vandaag vier soorten bestanden:

- **markdown** (`.md`, `.mdx`): frontmatter, secties, items, velden
- **jsonc** (`.jsonc`, `.json5`, `.json`): opmerkingen en opmaak blijven behouden
- **jsonl** (`.jsonl`, `.ndjson`): regelgeoriënteerde records
- **yaml** (`.yaml`, `.yml`, `.lobster`): mapping-/sequentie-/scalaire knooppunten via de
  YAML-document-API

Zelfhosters en editorextensies gebruiken de CLI om een enkel blad te lezen of te schrijven
zonder rechtstreeks tegen de SDK te scripten; agents en hooks behandelen het als een
deterministische onderlaag, zodat bytegetrouwe round-trips en de
redactie-sentinelbeveiliging uniform gelden voor alle soorten.

## Waarom je het inschakelt

Schakel `oc-path` in wanneer je scripts, hooks of lokale agent-tooling wilt laten wijzen
naar een exact stuk werkruimtestatus zonder voor elke bestandsvorm een parser te verzinnen.
Een enkel `oc://`-adres kan een markdown-frontmatter-sleutel, een sectie-item,
een JSONC-configuratieblad, een JSONL-gebeurtenisveld of een YAML-workflowstap benoemen.

Dat is belangrijk voor maintainer-workflows waarbij de wijziging klein,
controleerbaar en herhaalbaar moet zijn: inspecteer één waarde, vind overeenkomende records, voer een
dry-run van een schrijfactie uit en pas daarna alleen dat blad toe terwijl opmerkingen, regeleinden en
nabije opmaak ongemoeid blijven. Door dit als opt-in-Plugin te houden, krijgen power users de
adresseringsonderlaag zonder parser-afhankelijkheden of CLI-oppervlak in
core te plaatsen voor installaties die het nooit nodig hebben.

Veelvoorkomende redenen om het in te schakelen:

- **Lokale automatisering**: shellscripts kunnen één werkruimtewaarde oplossen of bijwerken
  met `openclaw path … --json` in plaats van aparte markdown-, JSONC-,
  JSONL- en YAML-parsingcode mee te dragen.
- **Agent-zichtbare bewerkingen**: een agent kan een dry-run-diff tonen voor één geadresseerd
  blad voordat er wordt geschreven, wat eenvoudiger te beoordelen is dan een vrije herschrijving van een bestand.
- **Editorintegraties**: een editor kan `oc://AGENTS.md/tools/gh` koppelen aan het
  exacte markdown-knooppunt en regelnummer zonder te gokken op basis van koptekst.
- **Diagnostiek**: `emit` laat een bestand via de parser en emitter rondgaan, zodat
  je kunt controleren of een bestandstype byte-stabiel is voordat je op geautomatiseerde
  bewerkingen vertrouwt.

Concrete voorbeelden:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

De Plugin is bewust niet de eigenaar van semantiek op hoger niveau. Memory-
Plugins blijven eigenaar van memory-schrijfacties, config-commando's blijven eigenaar van volledig
configuratiebeheer, en LKG-logica blijft eigenaar van herstel/promotie. `oc-path` is de smalle
adresserings- en bytebehoudende bestandsbewerkingslaag waar die tools op hoger niveau
omheen kunnen bouwen.

## Waar het draait

De Plugin draait **in-process binnen de `openclaw` CLI** op de host waar je
de opdracht uitvoert. Het heeft geen draaiende Gateway nodig en opent geen
netwerksockets: elk werkwoord is een pure transformatie over een bestand waarnaar je wijst.

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

`onStartup: false` houdt de Plugin buiten het hete pad van de Gateway. `onCommands:
["path"]` vertelt de CLI dat de Plugin lazy geladen moet worden wanneer je voor het eerst
`openclaw path …` uitvoert, zodat installaties die het werkwoord nooit gebruiken geen kosten betalen.

## Inschakelen

```bash
openclaw plugins enable oc-path
```

Herstart de Gateway (als je er een draait), zodat de manifest-snapshot de nieuwe
status oppikt. Losse `openclaw path`-aanroepen werken direct op dezelfde host:
de CLI laadt de Plugin op aanvraag.

Uitschakelen met:

```bash
openclaw plugins disable oc-path
```

## Afhankelijkheden

Alle parser-afhankelijkheden zijn Plugin-lokaal: het inschakelen van `oc-path` trekt geen
nieuwe pakketten de core-runtime in:

| Afhankelijkheid | Doel                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `commander`     | Subcommand-bedrading voor `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser`  | JSONC-parsing + bladbewerkingen met behoud van opmerkingen en trailing komma's. |
| `markdown-it`   | Markdown-tokenisatie voor het sectie-/item-/veldmodel.                 |
| `yaml`          | YAML `Document` parsen / emitten / bewerken met behoud van opmerkingen en flowstijl. |

JSONL blijft handgeschreven: regelgeoriënteerde parsing is eenvoudiger dan welke
afhankelijkheid ook, en de JSONC-parsing per regel loopt al via `jsonc-parser`.

## Wat het biedt

| Oppervlak                      | Geboden door                                            |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` parser / formatter     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parse / emit / bewerking per soort | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Universeel resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Redactie-sentinelbeveiliging   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

De CLI is vandaag het enige publieke oppervlak. De onderliggende werkwoorden zijn privé voor
de Plugin; consumenten gebruiken de CLI (of bouwen hun eigen Plugin tegen de SDK).

## Relatie met andere Plugins

- **`memory-*`**: memory-schrijfacties lopen via de memory-Plugins, niet via `oc-path`.
  `oc-path` is een generieke bestandsonderlaag; memory-Plugins leggen daar hun eigen
  semantiek bovenop.
- **LKG**: `path` weet niets over Last-Known-Good-configuratieherstel. Als een
  bestand door LKG wordt gevolgd, beslist de volgende `observe`-aanroep of er gepromoveerd of
  hersteld moet worden; `set --batch` voor atomische multi-set via de LKG-promote/recover-
  levenscyclus is gepland naast de LKG-herstelonderlaag.

## Veiligheid

`set` schrijft ruwe bytes via het emit-pad van de onderlaag, dat automatisch de
redactie-sentinelbeveiliging toepast. Een blad met
`__OPENCLAW_REDACTED__` (letterlijk of als substring) wordt tijdens het schrijven geweigerd
met `OC_EMIT_SENTINEL`. De CLI verwijdert ook de letterlijke sentinel uit alle
menselijke of JSON-output die hij afdrukt, en vervangt die door `[REDACTED]`, zodat terminal-
captures en pipelines de marker nooit lekken.

## Gerelateerd

- [`openclaw path` CLI-referentie](/nl/cli/path)
- [Plugins beheren](/nl/plugins/manage-plugins)
- [Plugins bouwen](/nl/plugins/building-plugins)
