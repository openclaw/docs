---
read_when:
    - Je wilt vanuit de terminal een blad in een werkruimtebestand lezen of schrijven
    - Je maakt scripts op basis van de werkruimtestatus en wilt een stabiel, type-agnostisch adresseringsschema
    - Je debugt een `oc://`-pad (valideer de syntaxis, bekijk waarnaar het wordt herleid)
summary: CLI-referentie voor `openclaw path` (werkruimtebestanden inspecteren en bewerken via het `oc://`-adresseringsschema)
title: Pad
x-i18n:
    generated_at: "2026-05-10T19:29:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Door plugins geleverde shelltoegang tot het `oc://`-adresseringssubstraat: één
op soort gedispatcht padschema voor het inspecteren en bewerken van adresseerbare workspace-
bestanden (markdown, jsonc, jsonl). Zelfhosters, pluginauteurs en editor-
extensies gebruiken het om een beperkte locatie te lezen, vinden of bij te werken zonder
per bestandstype eigen parsers te schrijven.

De CLI weerspiegelt de publieke werkwoorden van het substraat:

- `resolve` is concreet en levert één match op.
- `find` is het werkwoord voor meerdere matches voor wildcards, unions, predicates en
  positionele expansie.
- `set` accepteert alleen concrete paden of invoegmarkeringen; wildcardpatronen worden
  geweigerd voordat er wordt geschreven.

`path` wordt geleverd door de meegeleverde optionele `oc-path`-plugin. Schakel deze in vóór
het eerste gebruik:

```bash
openclaw plugins enable oc-path
```

## Waarom gebruiken

OpenClaw-status is verspreid over door mensen bewerkte markdown, JSONC-configuratie met commentaar
en append-only JSONL-logs. Shellscripts, hooks en agents hebben vaak één
kleine waarde uit die bestanden nodig: een frontmatter-sleutel, een plugininstelling, een logrecord-
veld of een bulletitem onder een benoemde sectie.

`openclaw path` geeft die callers een stabiel adres in plaats van een eenmalige grep,
regex of parser voor elk bestandstype. Hetzelfde `oc://`-pad kan worden gevalideerd,
opgelost, doorzocht, drooggedraaid en geschreven vanuit de terminal, wat beperkte
automatisering eenvoudiger te beoordelen en veiliger te herhalen maakt. Het is vooral nuttig wanneer
je één leaf wilt bijwerken terwijl de rest van de opmerkingen, regeleindes en
omliggende opmaak van het bestand behouden blijven.

Gebruik het wanneer wat je wilt een logisch adres heeft, maar de fysieke bestandsvorm
varieert:

- Een hook wil één instelling lezen uit JSONC met commentaar zonder opmerkingen te verliezen
  wanneer de waarde wordt teruggeschreven.
- Een onderhoudsscript wil elk overeenkomend eventveld in een JSONL-log vinden
  zonder het hele log in een aangepaste parser te laden.
- Een editor-extensie wil naar een markdownsectie of bulletitem springen op basis van
  slug, en daarna de exacte regel renderen waarnaar die is opgelost.
- Een agent wil een kleine workspace-bewerking droogdraaien voordat die wordt toegepast, met de
  gewijzigde bytes zichtbaar in review.

Je hebt `openclaw path` waarschijnlijk niet nodig voor gewone bewerkingen van volledige bestanden, rijke
configuratiemigraties of geheugenspecifieke writes. Die moeten de eigenaar-
command of plugin gebruiken. `path` is bedoeld voor kleine, adresseerbare bestandsbewerkingen waarbij een
herhaalbare terminalopdracht duidelijker is dan nog een op maat gemaakte parser.

## Hoe het wordt gebruikt

Lees één waarde uit een door mensen bewerkt configuratiebestand:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Bekijk een write vooraf zonder de schijf aan te raken:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Vind overeenkomende records in een append-only JSONL-log:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresseer een instructie in markdown per sectie en item in plaats van per regel-
nummer:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valideer een pad in CI of een preflightscript voordat het script leest of schrijft:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Deze opdrachten zijn bedoeld om naar shellscripts te kunnen kopiëren. Gebruik `--json` wanneer een
caller gestructureerde uitvoer nodig heeft en `--human` wanneer een persoon het
resultaat inspecteert.

## Hoe het werkt

`openclaw path` doet vier dingen:

1. Parset het `oc://`-adres naar slots: bestand, sectie, item, veld en
   optionele sessie.
2. Kiest de adapter voor het bestandstype op basis van de doelextensie (`.md`, `.jsonc`,
   `.jsonl` en gerelateerde aliassen).
3. Lost de slots op tegen de AST van dat bestandstype: markdownkoppen/items,
   JSONC-objectkeys/array-indexen of JSONL-regelrecords.
4. Voor `set` worden bewerkte bytes via dezelfde adapter uitgegeven, zodat de onaangeraakte
   delen van het bestand hun opmerkingen, regeleindes en nabije opmaak behouden
   waar het type dat ondersteunt.

`resolve` en `set` vereisen één concreet doel. `find` is het verkennende
werkwoord: het breidt wildcards, unions, predicates en ordinalen uit naar de concrete
matches die je kunt inspecteren voordat je er één kiest om te schrijven.

## Subcommands

| Subcommand              | Doel                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Print de concrete match op het pad (of "niet gevonden").                    |
| `find <pattern>`        | Som matches op voor een wildcard- / union- / predicate-pad.                  |
| `set <oc-path> <value>` | Schrijf een leaf of invoegdoel op een concreet pad. Ondersteunt `--dry-run`. |
| `validate <oc-path>`    | Alleen parsen; print structurele ontleding (bestand / sectie / item / veld). |
| `emit <file>`           | Roundtrip een bestand via `parseXxx` + `emitXxx` (diagnose voor bytegetrouwheid). |

## Globale flags

| Flag            | Doel                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `--cwd <dir>`   | Los de bestandsslot op tegen deze directory (standaard: `process.cwd()`). |
| `--file <path>` | Overschrijf het opgeloste pad van de bestandsslot (absolute toegang).     |
| `--json`        | Forceer JSON-uitvoer (standaard wanneer stdout geen TTY is).              |
| `--human`       | Forceer menselijke uitvoer (standaard wanneer stdout een TTY is).         |
| `--dry-run`     | (alleen bij `set`) print de bytes die zouden worden geschreven zonder te schrijven. |

## `oc://`-syntaxis

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Slotregels: `field` vereist `item`, en `item` vereist `section`. Over alle
vier slots:

- **Gequote segmenten** — `"a/b.c"` overleeft `/`- en `.`-scheidingstekens.
  Inhoud is byte-letterlijk; `"` en `\` zijn niet toegestaan binnen quotes.
  De bestandsslot is ook quote-aware: `oc://"skills/email-drafter"/Tools/$last`
  behandelt `skills/email-drafter` als één bestandspad.
- **Predicates** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Numerieke operaties vereisen dat beide kanten naar eindige getallen kunnen worden omgezet.
- **Unions** — `{a,b,c}` matcht elk van de alternatieven.
- **Wildcards** — `*` (één subsegment) en `**` (nul of meer,
  recursief). `find` accepteert deze; `resolve` en `set` weigeren ze als
  ambigu.
- **Positioneel** — `$last` lost op naar de laatste index / laatst gedeclareerde key.
- **Ordinaal** — `#N` voor de N-de match in documentvolgorde.
- **Invoegmarkeringen** — `+`, `+key`, `+nnn` voor invoegen met key / index
  (gebruik met `set`).
- **Sessiescope** — `?session=cron-daily` enz. Orthogonaal aan slot-
  nesting. Sessiewaarden zijn raw, niet percent-decoded; ze mogen geen
  controletekens of gereserveerde queryscheidingstekens (`?`, `&`, `%`) bevatten.

Gereserveerde tekens (`?`, `&`, `%`) buiten gequote, predicate- of union-
segmenten worden geweigerd. Controletekens (U+0000-U+001F, U+007F) worden
overal geweigerd, inclusief de `session`-querywaarde.

`formatOcPath(parseOcPath(path)) === path` is gegarandeerd voor canonieke paden.
Niet-canonieke queryparameters worden genegeerd, behalve de eerste niet-lege
`session=`-waarde.

## Adressering per bestandstype

| Type       | Adresseringsmodel                                                                       |
| ---------- | ---------------------------------------------------------------------------------------- |
| Markdown   | H2-secties per slug, bulletitems per slug of `#N`, frontmatter via `[frontmatter]`.       |
| JSONC/JSON | Objectkeys en array-indexen; punten splitsen geneste subsegmenten tenzij gequote.        |
| JSONL      | Regeladressen op topniveau (`L1`, `L2`, `$last`), daarna JSONC-achtige afdaling in de regel. |

`resolve` retourneert een gestructureerde match: `root`, `node`, `leaf` of
`insertion-point`, met een 1-gebaseerd regelnummer. Leafwaarden worden weergegeven als tekst
plus een `leafType`, zodat pluginauteurs previews kunnen renderen zonder afhankelijk te zijn van
de AST-vorm per type.

## Mutatiecontract

`set` schrijft één concreet doel:

- Markdown-frontmatterwaarden en `- key: value`-itemvelden zijn string-leaves.
  Markdown-invoegingen voegen secties, frontmatterkeys of sectie-items toe en
  renderen een canonieke markdownvorm voor het gewijzigde bestand.
- JSONC-leaf-writes zetten de stringwaarde om naar het bestaande leaftype
  (`string`, eindige `number`, `true`/`false` of `null`). JSONC-object- en array-
  invoegingen parsen `<value>` als JSON en gebruiken het bewerkingspad van `jsonc-parser` voor
  gewone leaf-writes, waarbij opmerkingen en nabije opmaak behouden blijven.
- JSONL-leaf-writes zetten net als JSONC binnen een regel om. Vervanging en
  append van volledige regels parsen `<value>` als JSON. Gerenderde JSONL behoudt de dominante
  LF/CRLF-regeleindeconventie van het bestand.

Gebruik `--dry-run` vóór gebruikerszichtbare writes wanneer de exacte bytes ertoe doen. Het
substraat behoudt byte-identieke uitvoer voor parse/emit-roundtrips, maar een
mutatie kan de bewerkte regio of het bestand canoniek maken, afhankelijk van het type.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Meer grammaticavoorbeelden:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

Dezelfde vijf werkwoorden werken voor alle typen; het adresseringsschema dispatcht op de
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

De `[frontmatter]`-predicate adresseert het YAML-frontmatterblok; `tools`
matcht de `## Tools`-kop via slug, en itemleaves behouden hun slugvorm
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

JSONC-bewerkingen lopen via `jsonc-parser`, dus opmerkingen en witruimte blijven behouden na een
`set`. Voer eerst uit met `--dry-run` om de bytes te inspecteren voordat je vastlegt.

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

Elke regel is een record. Adresseer via predicaat (`[event=action]`) wanneer je het regelnummer niet
kent, of via het canonieke `LN`-segment wanneer je dat wel weet.

## Referentie voor subopdrachten

### `resolve <oc-path>`

Lees één blad of knooppunt. Jokertekens worden geweigerd — gebruik daarvoor `find`.
Sluit af met `0` bij een overeenkomst, `1` bij een nette misser, `2` bij een parseerfout of geweigerd
patroon.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Som elke overeenkomst voor een jokerteken-, predicaat- of uniepatroon op. Sluit af met `0`
bij ten minste één overeenkomst, `1` bij nul. Jokertekens in het bestandssegment worden geweigerd met
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — geef een concreet bestand door (globbing over meerdere bestanden is een vervolgfase).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Schrijf een blad. Combineer met `--dry-run` om de bytes te bekijken die zouden worden
geschreven zonder het bestand aan te raken. Sluit af met `0` bij een geslaagde schrijfactie, `1` als
het substraat weigert (bijvoorbeeld wanneer een sentinelbeveiliging wordt geraakt), `2` bij parseerfouten.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

De invoegmarkering `+key` maakt het benoemde kind aan als het nog niet
bestaat; `+nnn` en kale `+` werken respectievelijk voor geïndexeerd invoegen en toevoegen.

### `validate <oc-path>`

Controle die alleen parseert. Geen bestandssysteemtoegang. Nuttig wanneer je wilt bevestigen dat een
sjabloonpad correct gevormd is voordat je variabelen invult, of wanneer je
de structurele uitsplitsing wilt voor foutopsporing:

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

Laat een bestand heen en terug gaan via de parser en emitter per soort. De uitvoer zou
byte-identiek moeten zijn aan de invoer bij een correct bestand — afwijking wijst op een
parserbug of een geraakte sentinel. Nuttig om substraatgedrag op
praktijkinvoer te debuggen.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Afsluitcodes

| Code | Betekenis                                                                 |
| ---- | ------------------------------------------------------------------------- |
| `0`  | Succes. (`resolve` / `find`: ten minste één overeenkomst. `set`: schrijven geslaagd.) |
| `1`  | Geen overeenkomst, of `set` geweigerd door het substraat (geen fout op systeemniveau). |
| `2`  | Argument- of parseerfout.                                                 |

## Uitvoermodus

`openclaw path` is TTY-bewust: menselijk leesbare uitvoer op een terminal, JSON wanneer
stdout wordt gepiped of omgeleid. `--json` en `--human` overschrijven de
automatische detectie.

## Notities

- `set` schrijft bytes via het emit-pad van het substraat, dat de
  redaction-sentinelbeveiliging automatisch toepast. Een blad dat
  `__OPENCLAW_REDACTED__` bevat (letterlijk of als substring) wordt tijdens het schrijven
  geweigerd.
- JSONC-parsing en bladbewerkingen gebruiken de Plugin-lokale `jsonc-parser`
  afhankelijkheid, zodat opmerkingen en opmaak behouden blijven bij gewone
  bladschrijfacties in plaats van via een zelfgemaakte parser-/her-renderroute te lopen.
- `path` weet niets over LKG. Als het bestand door LKG wordt gevolgd, beslist de volgende
  observe-aanroep of promotie/herstel plaatsvindt. `set --batch` voor
  atomische multi-set via de LKG-promote/recover-levenscyclus is gepland
  naast het LKG-herstel-substraat.

## Gerelateerd

- [CLI-referentie](/nl/cli)
