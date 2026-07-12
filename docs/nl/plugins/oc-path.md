---
read_when:
    - Je wilt vanuit de terminal één enkel eindelement in een werkruimtebestand bekijken of bewerken
    - U schrijft scripts voor de werkruimtestatus en hebt een stabiel adresseringsschema nodig dat onafhankelijk is van het type
    - U beslist of u de optionele `oc-path`-Plugin wilt inschakelen op een zelfgehoste Gateway
summary: 'Gebundelde `oc-path`-Plugin: levert de `openclaw path`-CLI voor het `oc://`-adresseringsschema voor werkruimtebestanden'
title: OC Path-plugin
x-i18n:
    generated_at: "2026-07-12T09:05:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

De gebundelde `oc-path`-Plugin voegt de [`openclaw path`](/nl/cli/path)-CLI toe voor het
`oc://`-adresseringsschema voor werkruimtebestanden. Deze wordt in de OpenClaw-repository geleverd onder
`extensions/oc-path/`, maar moet expliciet worden ingeschakeld: na installatie/build blijft de Plugin inactief totdat u
deze inschakelt.

`oc://`-adressen verwijzen naar één eindwaarde (of een verzameling eindwaarden met jokertekens) binnen
een werkruimtebestand. De Plugin ondersteunt vier bestandstypen:

- **markdown** (`.md`): frontmatter, secties, items, velden
- **jsonc** (`.jsonc`, `.json`): opmerkingen en opmaak blijven behouden
- **jsonl** (`.jsonl`, `.ndjson`): regelgeoriënteerde records
- **yaml** (`.yaml`, `.yml`, `.lobster`): knooppunten van het type mapping/reeks/scalair via de
  `Document`-API van het `yaml`-pakket

Zelfhosters en editoruitbreidingen gebruiken de CLI om één eindwaarde te lezen of schrijven
zonder rechtstreeks scripts tegen de SDK te schrijven; agents en hooks gebruiken deze als een
deterministische onderlaag, zodat bytegetrouwe heen-en-terugconversies en de
beveiliging met de redactiesentinel uniform op alle typen worden toegepast. Zie de
[CLI-referentie](/nl/cli/path) voor de volledige grammatica, de lijst met vlaggen per opdracht en
uitgewerkte voorbeelden per bestandstype; op deze pagina wordt uitgelegd waarom en hoe u de
Plugin inschakelt.

## Waarom inschakelen

Schakel `oc-path` in wanneer scripts, hooks of lokale agenttools moeten verwijzen naar
een exact onderdeel van de werkruimtestatus zonder een specifieke parser voor elke bestandsstructuur. Eén
`oc://`-adres kan een markdown-frontmattersleutel, een sectie-item, een
JSONC-configuratie-eindwaarde, een JSONL-gebeurtenisveld of een YAML-workflowstap aanduiden.

Dat is belangrijk voor onderhoudsworkflows waarin de wijziging klein,
controleerbaar en herhaalbaar moet blijven: inspecteer één waarde, zoek overeenkomende records, voer een
proefbewerking uit en pas vervolgens alleen die eindwaarde toe, terwijl opmerkingen, regeleinden en
nabijgelegen opmaak ongewijzigd blijven.

Veelvoorkomende redenen om deze Plugin in te schakelen:

- **Lokale automatisering**: shellscripts zoeken één werkruimtewaarde op of werken deze bij
  met `openclaw path … --json`, in plaats van afzonderlijke parseercode voor markdown, JSONC,
  JSONL en YAML te onderhouden.
- **Voor agents zichtbare bewerkingen**: een agent toont vóór het schrijven een proefdiff voor één geadresseerde
  eindwaarde, wat eenvoudiger te beoordelen is dan het vrij herschrijven van een volledig
  bestand.
- **Editorintegraties**: een editor koppelt `oc://AGENTS.md/tools/gh` aan het
  exacte markdown-knooppunt en regelnummer zonder te hoeven gokken op basis van koptekst.
- **Diagnostiek**: `emit` voert een bestand heen en terug door de parser en emitter,
  zodat u kunt controleren of een bestandstype bytegetrouw blijft voordat u op
  geautomatiseerde bewerkingen vertrouwt.

```bash
# Is de GitHub-Plugin in deze configuratie ingeschakeld?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Welke namen van toolaanroepen komen in dit sessielogboek voor?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Welke bytes zou deze kleine configuratiebewerking schrijven?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` is bewust niet verantwoordelijk voor semantiek op een hoger niveau. Geheugenplugins
blijven verantwoordelijk voor schrijfbewerkingen naar het geheugen, configuratieopdrachten blijven verantwoordelijk voor volledig configuratiebeheer
en herstel van de laatst bekende goede configuratie (LKG) blijft verantwoordelijk voor
herstel/promotie. `oc-path` is de beperkte laag voor adressering en
bytebehoudende bestandsbewerkingen waarop deze tools van een hoger niveau kunnen voortbouwen.

## Waar deze wordt uitgevoerd

De Plugin wordt **in hetzelfde proces binnen de `openclaw`-CLI** uitgevoerd op de host waarop u
de opdracht aanroept. Er is geen actieve Gateway nodig en er worden geen
netwerksockets geopend; elke opdracht is een zuivere transformatie van een bestand waarnaar u verwijst.

De metadata van de Plugin staat in `extensions/oc-path/openclaw.plugin.json`:

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

`onStartup: false` houdt de Plugin buiten het opstartpad van de Gateway.
`commandAliases` en `activation.onCommands` geven de CLI opdracht de Plugin
uitgesteld te laden wanneer u voor het eerst `openclaw path …` uitvoert, zodat installaties die
de opdracht nooit gebruiken geen extra kosten ondervinden.

## Inschakelen

```bash
openclaw plugins enable oc-path
```

Start de Gateway opnieuw (als u er een uitvoert), zodat de manifestsnapshot de nieuwe
status overneemt. Losse aanroepen van `openclaw path` werken onmiddellijk op dezelfde host;
de CLI laadt de Plugin wanneer dat nodig is.

Uitschakelen doet u met:

```bash
openclaw plugins disable oc-path
```

## Afhankelijkheden

Alle parserafhankelijkheden zijn lokaal voor de Plugin; het inschakelen van `oc-path` voegt geen
nieuwe pakketten toe aan de kernruntime:

| Afhankelijkheid | Doel                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `commander`     | Koppeling van subopdrachten voor `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser`  | JSONC parseren en eindwaarden bewerken met behoud van opmerkingen en afsluitende komma's. |
| `markdown-it`   | Markdown-tokenisatie voor het sectie-/item-/veldmodel.                 |
| `yaml`          | YAML `Document` parseren/emitteren/bewerken met behoud van opmerkingen en flowstijl. |

JSONL blijft handmatig geïmplementeerd: regelgeoriënteerd parseren is eenvoudiger dan welke
afhankelijkheid ook, en het parseren per regel verloopt al via `jsonc-parser`.

## Wat deze biedt

| Oppervlak                      | Geleverd door                                            |
| ------------------------------ | -------------------------------------------------------- |
| `openclaw path`-CLI            | `extensions/oc-path/cli-registration.ts`                 |
| `oc://`-parser/-formatter      | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Parseren/emitteren/bewerken per type | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Universeel opzoeken/zoeken/instellen | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Beveiliging met redactiesentinel | `extensions/oc-path/src/oc-path/sentinel.ts`           |

De CLI is momenteel het enige openbare oppervlak. De onderliggende opdrachten zijn privé voor
de Plugin; gebruikers gebruiken de CLI (of bouwen hun eigen Plugin tegen de
SDK).

## Relatie tot andere plugins

- **`memory-*`**: schrijfbewerkingen naar het geheugen verlopen via de geheugenplugins, niet via
  `oc-path`. `oc-path` is een generieke bestandsonderlaag; geheugenplugins voegen
  daar hun eigen semantiek aan toe.
- **LKG**: `path` kent het herstel van de laatst bekende goede configuratie niet. Als een
  bestand dat u via `path` bewerkt ook door LKG wordt gevolgd, bepaalt de volgende observatiecyclus
  van de configuratie of het wordt gepromoveerd of hersteld; behandel een `path`-bewerking
  hetzelfde als elke andere rechtstreekse schrijfbewerking naar dat bestand.

## Veiligheid

`set` schrijft onbewerkte bytes via het emit-pad van de onderlaag, dat automatisch de
beveiliging met de redactiesentinel toepast. Een eindwaarde die
`__OPENCLAW_REDACTED__` bevat (letterlijk of als deeltekenreeks), wordt tijdens het schrijven
geweigerd met `OC_EMIT_SENTINEL`. De CLI verwijdert de letterlijke sentinel ook uit alle
menselijk leesbare of JSON-uitvoer die wordt afgedrukt en vervangt deze door `[REDACTED]`, zodat
terminalopnamen en pijplijnen de markering nooit lekken.

## Gerelateerd

- [CLI-referentie voor `openclaw path`](/nl/cli/path)
- [Plugins beheren](/nl/plugins/manage-plugins)
- [Plugins bouwen](/nl/plugins/building-plugins)
