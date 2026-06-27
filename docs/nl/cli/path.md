---
read_when:
    - Je wilt vanuit de terminal een blad binnen een werkruimtebestand lezen of schrijven
    - Je script tegen werkruimtestatus aan en wilt een stabiel, soort-agnostisch adresseringsschema
    - Je debugt een `oc://`-pad (valideer de syntaxis, kijk waarnaar het wordt omgezet)
summary: CLI-referentie voor `openclaw path` (inspecteer en bewerk werkruimtebestanden via het `oc://`-adresseringsschema)
title: Pad
x-i18n:
    generated_at: "2026-06-27T17:22:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Door Plugin geleverde shelltoegang tot de `oc://`-adresseringslaag: één
op soort gedispatcht padschema voor het inspecteren en bewerken van adresseerbare werkruimtebestanden
(markdown, jsonc, jsonl, yaml/yml/lobster). Zelfhosters, Plugin-auteurs
en editor-extensies gebruiken het om een smalle locatie te lezen, vinden of bij te werken
zonder per bestandstype eigen parsers te schrijven.

De CLI weerspiegelt de openbare werkwoorden van de laag:

- `resolve` is concreet en levert één match op.
- `find` is het werkwoord voor meerdere matches bij jokertekens, unions, predicaten en
  positionele uitbreiding.
- `set` accepteert alleen concrete paden of invoegmarkeringen; jokertekenpatronen worden
  vóór het schrijven geweigerd.

`path` wordt geleverd door de meegeleverde optionele `oc-path`-Plugin. Schakel deze in vóór
het eerste gebruik:

```bash
openclaw plugins enable oc-path
```

## Waarom dit gebruiken

OpenClaw-status is verspreid over door mensen bewerkte markdown, JSONC-configuratie met opmerkingen,
alleen-toevoegen JSONL-logboeken en YAML-workflow-/specificatiebestanden. Shellscripts, hooks
en agents hebben vaak één kleine waarde uit die bestanden nodig: een frontmatter-sleutel, een
Plugin-instelling, een logrecordveld, een YAML-stap of een opsommingitem onder een benoemde
sectie.

`openclaw path` geeft die aanroepers een stabiel adres in plaats van een eenmalige grep,
regex of parser voor elk bestandstype. Hetzelfde `oc://`-pad kan vanuit de terminal worden
gevalideerd, opgelost, doorzocht, droog uitgevoerd en geschreven, waardoor smalle
automatisering eenvoudiger te beoordelen en veiliger opnieuw af te spelen is. Het is vooral
nuttig wanneer je één blad wilt bijwerken terwijl de rest van de opmerkingen, regeleinden
en omringende opmaak van het bestand behouden blijven.

Gebruik het wanneer wat je wilt een logisch adres heeft, maar de fysieke bestandsvorm
varieert:

- Een hook wil één instelling lezen uit JSONC met opmerkingen zonder opmerkingen te verliezen
  wanneer de waarde wordt teruggeschreven.
- Een onderhoudsscript wil elk overeenkomend eventveld in een JSONL-logboek vinden
  zonder het hele logboek in een aangepaste parser te laden.
- Een editor-extensie wil naar een markdownsectie of opsommingitem springen op basis van
  slug, en daarna de exacte regel weergeven waarnaar het is opgelost.
- Een agent wil een kleine werkruimtebewerking droog uitvoeren voordat die wordt toegepast, met de
  gewijzigde bytes zichtbaar in de beoordeling.

Je hebt `openclaw path` waarschijnlijk niet nodig voor gewone bewerkingen van hele bestanden, uitgebreide
configuratiemigraties of geheugenspecifieke schrijfacties. Die moeten de eigenaarsopdracht
of Plugin gebruiken. `path` is bedoeld voor kleine, adresseerbare bestandsbewerkingen waarbij een
herhaalbare terminalopdracht duidelijker is dan nog een specifieke parser.

## Hoe het wordt gebruikt

Lees één waarde uit een door mensen bewerkt configuratiebestand:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Bekijk een schrijfactie vooraf zonder de schijf aan te raken:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Vind overeenkomende records in een alleen-toevoegen JSONL-logboek:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresseer een instructie in markdown via sectie en item in plaats van via regelnummer:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valideer een pad in CI of een preflightscript voordat het script leest of schrijft:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Deze opdrachten zijn bedoeld om in shellscripts te kunnen worden gekopieerd. Gebruik `--json` wanneer een
aanroeper gestructureerde uitvoer nodig heeft en `--human` wanneer een persoon het
resultaat inspecteert.

## Hoe het werkt

`openclaw path` doet vier dingen:

1. Parseert het `oc://`-adres naar slots: bestand, sectie, item, veld en
   optionele sessie.
2. Kiest de adapter voor het bestandstype op basis van de doelextensie (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster` en gerelateerde aliassen).
3. Lost de slots op tegen de AST van dat bestandstype: markdownkoppen/-items,
   JSONC-objectsleutels/array-indexen, JSONL-regelrecords of YAML-map-/sequencenodes.
4. Voor `set` geeft het bewerkte bytes uit via dezelfde adapter, zodat de onaangeraakte
   delen van het bestand hun opmerkingen, regeleinden en nabije opmaak behouden
   waar het type dat ondersteunt.

`resolve` en `set` vereisen één concreet doel. `find` is het verkennende
werkwoord: het breidt jokertekens, unions, predicaten en rangnummers uit naar de concrete
matches die je kunt inspecteren voordat je er één kiest om te schrijven.

## Subopdrachten

| Subopdracht             | Doel                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Druk de concrete match op het pad af (of "niet gevonden").                   |
| `find <pattern>`        | Som matches op voor een jokerteken-/union-/predicaatpad.                     |
| `set <oc-path> <value>` | Schrijf een blad- of invoegdoel op een concreet pad. Ondersteunt `--dry-run`. |
| `validate <oc-path>`    | Alleen parseren; druk structurele uitsplitsing af (bestand / sectie / item / veld). |
| `emit <file>`           | Laat een bestand heen en terug gaan via `parseXxx` + `emitXxx` (diagnose voor bytegetrouwheid). |

## Globale vlaggen

| Vlag            | Doel                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Los de bestandsslot op tegen deze directory (standaard: `process.cwd()`). |
| `--file <path>` | Overschrijf het opgeloste pad van de bestandsslot (absolute toegang).     |
| `--json`        | Forceer JSON-uitvoer (standaard wanneer stdout geen TTY is).              |
| `--human`       | Forceer menselijke uitvoer (standaard wanneer stdout een TTY is).         |
| `--dry-run`     | (alleen op `set`) druk de bytes af die zouden worden geschreven zonder te schrijven. |
| `--diff`        | (met `set --dry-run`) druk een unified diff af in plaats van de volledige bytes. |

## `oc://`-syntaxis

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Slotregels: `field` vereist `item`, en `item` vereist `section`. Over alle
vier slots:

- **Gequote segmenten** — `"a/b.c"` overleeft `/`- en `.`-scheidingstekens.
  Inhoud is byte-letterlijk; `"` en `\` zijn niet toegestaan binnen quotes.
  De bestandsslot is ook quote-bewust: `oc://"skills/email-drafter"/Tools/$last`
  behandelt `skills/email-drafter` als één bestandspad.
- **Predicaten** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Numerieke bewerkingen vereisen dat beide kanten naar eindige getallen kunnen worden geconverteerd.
- **Unions** — `{a,b,c}` matcht een van de alternatieven.
- **Jokertekens** — `*` (één subsegment) en `**` (nul of meer,
  recursief). `find` accepteert deze; `resolve` en `set` weigeren ze als
  ambigu.
- **Positioneel** — `$first` / `$last` lossen op naar de eerste / laatste index of
  gedeclareerde sleutel.
- **Rangnummer** — `#N` voor de N-de match in documentvolgorde.
- **Invoegmarkeringen** — `+`, `+key`, `+nnn` voor invoeging op sleutel / index
  (gebruik met `set`).
- **Sessiebereik** — `?session=cron-daily` enz. Orthogonaal aan slotnesting.
  Sessiewaarden zijn onbewerkt, niet percent-gedecodeerd; ze mogen geen
  besturingstekens of gereserveerde queryscheidingstekens bevatten (`?`, `&`, `%`).

Gereserveerde tekens (`?`, `&`, `%`) buiten gequote, predicaat- of unionsegmenten
worden geweigerd. Besturingstekens (U+0000-U+001F, U+007F) worden overal geweigerd,
ook in de `session`-querywaarde.

`formatOcPath(parseOcPath(path)) === path` is gegarandeerd voor canonieke paden.
Niet-canonieke queryparameters worden genegeerd, behalve de eerste niet-lege
`session=`-waarde.

## Adressering per bestandstype

| Type              | Adresseringsmodel                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | H2-secties op slug, opsommingitems op slug of `#N`, frontmatter via `[frontmatter]`.                |
| JSONC/JSON        | Objectsleutels en array-indexen; punten splitsen geneste subsegmenten tenzij gequote.              |
| JSONL             | Top-level regeladressen (`L1`, `L2`, `$first`, `$last`), daarna JSONC-achtige afdaling binnen de regel. |
| YAML/YML/.lobster | Mapsleutels en sequence-indexen; opmerkingen en flowstijl worden afgehandeld door de YAML-document-API. |

`resolve` retourneert een gestructureerde match: `root`, `node`, `leaf` of
`insertion-point`, met een 1-gebaseerd regelnummer. Bladwaarden worden als tekst
plus een `leafType` aangeboden, zodat Plugin-auteurs previews kunnen renderen zonder afhankelijk te zijn van
de AST-vorm per type.

## Mutatiecontract

`set` schrijft één concreet doel:

- Markdown-frontmatterwaarden en `- key: value`-itemvelden zijn stringbladeren.
  Markdown-invoegingen voegen secties, frontmatter-sleutels of sectie-items toe en
  renderen een canonieke markdownvorm voor het gewijzigde bestand.
- JSONC-bladschrijfacties converteren de stringwaarde naar het bestaande bladtype
  (`string`, eindige `number`, `true`/`false` of `null`). Gebruik `--value-json`
  wanneer een JSONC/JSON/JSONL-bladvervanging `<value>` als JSON moet parsen en
  van vorm mag veranderen, zoals het vervangen van een string-SecretRef-shorthand door een
  object. JSONC-object- en array-invoegingen parsen `<value>` als JSON en gebruiken het
  `jsonc-parser`-bewerkpad voor gewone bladschrijfacties, waarbij opmerkingen en
  nabije opmaak behouden blijven.
- JSONL-bladschrijfacties converteren zoals JSONC binnen een regel. Vervanging van hele regels en
  toevoegen parsen `<value>` als JSON. Gerenderde JSONL behoudt de dominante
  LF/CRLF-regeleindconventie van het bestand.
- YAML-bladschrijfacties converteren naar het bestaande scalaire type (`string`, eindige
  `number`, `true`/`false` of `null`). YAML-invoegingen gebruiken de meegeleverde
  document-API van het `yaml`-pakket voor map-/sequence-updates. Misvormde YAML-
  documenten met parserfouten worden vóór mutatie geweigerd met `parse-error`.

Gebruik `--dry-run` vóór gebruikerszichtbare schrijfacties wanneer de exacte bytes ertoe doen. De
laag behoudt byte-identieke uitvoer voor parse-/emit-rondreizen, maar een
mutatie kan het bewerkte gebied of bestand canoniseren, afhankelijk van het type.
Voeg `--diff` toe wanneer je de preview als een gerichte voor/na-patch wilt
in plaats van het volledige gerenderde bestand.

## Voorbeelden

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Meer grammaticavoorbeelden:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Recepten per bestandstype

Dezelfde vijf werkwoorden werken voor alle typen; het adresseringsschema kiest op basis van de
bestandsextensie. De voorbeelden hieronder gebruiken de fixtures uit de PR-beschrijving.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Het predicaat `[frontmatter]` adresseert het YAML-frontmatterblok; `tools`
komt overeen met de kop `## Tools` via de slug, en itembladen behouden hun slugvorm
zelfs wanneer de bron underscores gebruikt (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC-bewerkingen lopen via `jsonc-parser`, waardoor opmerkingen en witruimte een
`set` overleven. Voer eerst uit met `--dry-run` om de bytes te inspecteren voordat je vastlegt.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Elke regel is een record. Adresseer via predicaat (`[event=action]`) wanneer je het
regelnummer niet kent, of via het canonieke `LN`-segment wanneer je dat wel weet.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML gebruikt de `Document`-API van het `yaml`-pakket in plaats van een zelfgebouwde parser,
zodat gewone parseer-/emit-rondgangen opmerkingen en schrijfstructuur behouden, terwijl
opgeloste paden hetzelfde model met mapsleutel / reeksindex gebruiken als JSONC. Dezelfde
adapter verwerkt `.yaml`-, `.yml`- en `.lobster`-bestanden.

## Subcommando-overzicht

### `resolve <oc-path>`

Lees één blad of knooppunt. Jokertekens worden geweigerd — gebruik daarvoor `find`.
Sluit af met `0` bij een overeenkomst, `1` bij een nette misser, `2` bij een parseerfout of geweigerd
patroon.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Som elke overeenkomst op voor een jokerteken- / predicaat- / union-patroon. Sluit af met `0`
bij minstens één overeenkomst, `1` bij nul. Jokertekens voor bestandsposities worden geweigerd met
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — geef een concreet bestand door (globbing over meerdere bestanden
is een vervolgfuntie).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Schrijf een blad. Combineer met `--dry-run` om vooraf de bytes te bekijken die zouden worden
geschreven zonder het bestand aan te raken. Voeg `--diff` toe voor een voorbeeldweergave als unified diff.
Sluit af met `0` bij een geslaagde schrijfopdracht, `1` als het substraat weigert (bijvoorbeeld als een
sentinelbewaking wordt geraakt), `2` bij parsefouten.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

De invoegmarkering `+key` maakt het genoemde kind aan als het nog niet
bestaat; `+nnn` en kale `+` werken respectievelijk voor geïndexeerde invoeging en invoeging achteraan.

### `validate <oc-path>`

Controle met alleen parsen. Geen bestandssysteemtoegang. Nuttig wanneer je wilt bevestigen dat een
sjabloonpad correct is opgebouwd voordat je variabelen vervangt, of wanneer je
de structurele opsplitsing wilt voor foutopsporing:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Sluit af met `0` wanneer geldig, `1` wanneer ongeldig (met een gestructureerde `code` en
`message`), `2` bij argumentfouten.

### `emit <file>`

Voer een bestand heen en terug door de soortspecifieke parser en uitvoergenerator. De uitvoer hoort
byte-identiek te zijn aan de invoer bij een correct bestand — afwijking wijst op een
parserbug of een geraakte sentinel. Nuttig voor foutopsporing van substraatgedrag op
praktijkinvoer.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Afsluitcodes

| Code | Betekenis                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Succes. (`resolve` / `find`: minstens één overeenkomst. `set`: schrijven geslaagd.) |
| `1`  | Geen overeenkomst, of `set` geweigerd door het substraat (geen fout op systeemniveau).      |
| `2`  | Argument- of parsefout.                                                   |

## Uitvoermodus

`openclaw path` is TTY-bewust: menselijk leesbare uitvoer op een terminal, JSON wanneer
stdout wordt doorgesluisd of omgeleid. `--json` en `--human` overschrijven de
automatische detectie.

## Opmerkingen

- `set` schrijft bytes via het uitvoerpad van het substraat, dat de
  redactie-sentinelbewaking automatisch toepast. Een blad dat
  `__OPENCLAW_REDACTED__` bevat (letterlijk of als deeltekenreeks), wordt tijdens het schrijven
  geweigerd.
- JSONC-parsing en bladbewerkingen gebruiken de plugin-lokale afhankelijkheid `jsonc-parser`,
  zodat opmerkingen en opmaak behouden blijven bij gewone bladschrijfacties
  in plaats van via een handgeschreven parser-/her-renderpad te gaan.
- `path` weet niets van LKG. Als het bestand door LKG wordt gevolgd, bepaalt de volgende
  observe-aanroep of er wordt gepromoveerd / hersteld. `set --batch` voor
  atomaire multi-set via de LKG-promotie-/herstellevenscyclus staat gepland
  naast het LKG-herstelsubstraat.

## Gerelateerd

- [CLI-referentie](/nl/cli)
