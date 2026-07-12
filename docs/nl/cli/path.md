---
read_when:
    - Je wilt vanuit de terminal een eindwaarde in een werkruimtebestand lezen of schrijven
    - Je schrijft scripts voor de werkruimtestatus en wilt een stabiel adresseringsschema dat onafhankelijk is van het type
    - Je bent een `oc://`-pad aan het debuggen (valideer de syntaxis en kijk waarnaar het wordt omgezet)
summary: CLI-referentie voor `openclaw path` (werkruimtebestanden inspecteren en bewerken via het `oc://`-adresseringsschema)
title: Pad
x-i18n:
    generated_at: "2026-07-12T08:46:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Shelltoegang tot het `oc://`-adresseringsschema: één padsyntaxis met dispatch op bestandstype
voor het inspecteren en bewerken van adresseerbare werkruimtebestanden (markdown, jsonc,
jsonl, yaml/yml/lobster). Self-hosters, Plugin-auteurs en editorextensies
gebruiken deze om een specifieke locatie te lezen, zoeken of bij te werken zonder handmatig
voor elk bestandstype een parser te schrijven.

`path` wordt geleverd door de gebundelde optionele Plugin `oc-path`. Schakel deze vóór
het eerste gebruik in:

```bash
openclaw plugins enable oc-path
```

De CLI-werkwoorden weerspiegelen het adresseringsmodel:

- `resolve` is concreet en levert één overeenkomst.
- `find` is het werkwoord voor meerdere overeenkomsten bij jokertekens, unies, predicaten en
  positionele uitbreiding.
- `set` accepteert alleen concrete paden of invoegmarkeringen; patronen met jokertekens
  worden vóór het schrijven geweigerd.
- `validate` parseert een pad zonder toegang tot het bestandssysteem.
- `emit` voert een bestand via parseren + uitvoeren heen en terug (diagnose van bytegetrouwheid).

## Waarom dit gebruiken

De status van OpenClaw is verspreid over handmatig bewerkte markdown, JSONC-configuratie
met commentaar, uitsluitend uitbreidbare JSONL-logboeken en YAML-workflow-/specificatiebestanden.
Scripts, hooks en agents hebben vaak één kleine waarde uit die bestanden nodig: een
frontmatter-sleutel, een Plugin-instelling, een veld van een logboekrecord, een YAML-stap of
een opsommingselement onder een benoemde sectie.

`openclaw path` biedt deze aanroepers een stabiel adres in plaats van een eenmalige
grep, reguliere expressie of parser per bestandstype. Hetzelfde `oc://`-pad kan vanuit de
terminal worden gevalideerd, herleid, doorzocht, als proef worden uitgevoerd en geschreven,
waardoor gerichte automatisering controleerbaar en herhaalbaar blijft. De rest van het bestand
blijft behouden, zodat het schrijven van één eindwaarde geen invloed heeft op opmerkingen,
regeleinden of nabijgelegen opmaak.

Gebruik dit wanneer hetgeen u zoekt een logisch adres heeft, maar de bestandsvorm
varieert:

- Een hook leest één instelling uit JSONC met commentaar zonder opmerkingen te verliezen wanneer
  de waarde wordt teruggeschreven.
- Een onderhoudsscript vindt elk overeenkomend gebeurtenisveld in een uitsluitend uitbreidbaar JSONL-logboek
  zonder het hele logboek in een aangepaste parser te laden.
- Een editor springt op basis van een slug naar een markdownsectie of opsommingselement en geeft vervolgens
  de exacte herleide regel weer.
- Een agent voert een kleine bewerking van de werkruimte als proef uit voordat deze wordt toegepast, waarbij de
  gewijzigde bytes zichtbaar zijn tijdens de beoordeling.

Gebruik `openclaw path` niet voor gewone bewerkingen van volledige bestanden, uitgebreide
configuratiemigraties of geheugenspecifieke schrijfbewerkingen; gebruik daarvoor de opdracht of
Plugin van de eigenaar. `path` is bedoeld voor kleine, adresseerbare bestandsbewerkingen waarbij
een herhaalbare terminalopdracht beter is dan nog een parser op maat.

## Hoe het wordt gebruikt

Lees één waarde uit een handmatig bewerkt configuratiebestand:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Bekijk een schrijfbewerking vooraf zonder de schijf te wijzigen:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Zoek overeenkomende records in een uitsluitend uitbreidbaar JSONL-logboek:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresseer een instructie in markdown op basis van sectie en element in plaats van
regelnummer:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valideer een pad in CI of een voorbereidende scriptcontrole voordat het script leest of
schrijft:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Deze opdrachten zijn bedoeld om naar shellscripts te kunnen worden gekopieerd. Gebruik `--json` wanneer
een aanroeper gestructureerde uitvoer nodig heeft en `--human` wanneer iemand het resultaat
inspecteert.

## Hoe het werkt

1. Parseert het `oc://`-adres in posities: bestand, sectie, element, veld en een
   optionele sessiequery.
2. Kiest de adapter voor het bestandstype aan de hand van de doelbestandsextensie (`.md`, `.jsonc`,
   `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Herleidt de posities op basis van de structuur van dat bestandstype: markdown-
   koppen/-elementen, JSONC-objectsleutels/-array-indexen, JSONL-regelrecords of
   YAML-map-/sequentieknooppunten.
4. Voor `set` worden de bewerkte bytes via dezelfde adapter uitgevoerd, zodat onaangeroerde delen
   van het bestand hun opmerkingen, regeleinden en nabijgelegen opmaak behouden waar
   het bestandstype dit ondersteunt.

`resolve` en `set` vereisen één concreet doel. `find` is het verkennende
werkwoord: het breidt jokertekens, unies, predicaten en rangnummers uit tot de concrete
overeenkomsten die u kunt inspecteren voordat u er één kiest om te schrijven.

## Subopdrachten

| Subopdracht              | Doel                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| `resolve <oc-path>`      | Druk de concrete overeenkomst op het pad af (of "niet gevonden").           |
| `find <pattern>`         | Som overeenkomsten voor een pad met jokerteken / unie / predicaat op.       |
| `set <oc-path> <value>`  | Schrijf een eindwaarde of invoegdoel op een concreet pad. Ondersteunt `--dry-run`. |
| `validate <oc-path>`     | Alleen parseren; druk de structurele indeling af (bestand / sectie / element / veld). |
| `emit <file>`            | Voer een bestand via parseren + uitvoeren heen en terug (diagnose van bytegetrouwheid). |

## Algemene vlaggen

| Vlag            | Van toepassing op                 | Doel                                                                        |
| --------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit`  | Herleid de bestandspositie ten opzichte van deze map (standaard: `process.cwd()`). |
| `--file <path>` | `resolve`, `find`, `set`, `emit`  | Overschrijf het herleide pad van de bestandspositie (absolute toegang).      |
| `--json`        | alles                             | Dwing JSON-uitvoer af (standaard wanneer stdout geen TTY is).                |
| `--human`       | alles                             | Dwing voor mensen leesbare uitvoer af (standaard wanneer stdout een TTY is). |
| `--value-json`  | `set`                             | Parseer `<value>` als JSON voor vervanging van een JSON/JSONC/JSONL-eindwaarde. |
| `--dry-run`     | `set`                             | Druk de bytes af die zouden worden geschreven, zonder te schrijven.          |
| `--diff`        | `set` (vereist `--dry-run`)       | Druk een uniforme diff af in plaats van de volledige bytes.                  |

`validate` accepteert alleen `--json` / `--human`; deze opdracht gebruikt het bestandssysteem niet,
dus `--cwd` en `--file` zijn niet van toepassing.

## `oc://`-syntaxis

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Positieregels: `field` vereist `item` en `item` vereist `section`. Voor
alle vier posities geldt:

- **Aangehaalde segmenten** — `"a/b.c"` blijft intact bij de scheidingstekens `/` en `.`. De inhoud is
  byteletterlijk; `"` en `\` zijn niet toegestaan binnen aanhalingstekens. De bestandspositie houdt
  ook rekening met aanhalingstekens: `oc://"skills/email-drafter"/Tools/$last` behandelt
  `skills/email-drafter` als één bestandspad.
- **Predicaten** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`.
  Numerieke operatoren vereisen dat beide zijden naar eindige getallen kunnen worden geconverteerd.
- **Unies** — `{a,b,c}` komt overeen met elk van de alternatieven.
- **Jokertekens** — `*` (één subsegment) en `**` (nul of meer,
  recursief). `find` accepteert deze; `resolve` en `set` weigeren ze als
  dubbelzinnig.
- **Positioneel** — `$first` / `$last` herleiden naar de eerste / laatste index of
  gedeclareerde sleutel.
- **Rangnummer** — `#N` voor de N-de overeenkomst in documentvolgorde.
- **Invoegmarkeringen** — `+`, `+key`, `+nnn` voor invoegen op basis van sleutel / index
  (te gebruiken met `set`).
- **Sessiebereik** — `?session=cron-daily` enzovoort. Staat los van de nesting van posities.
  Sessiewaarden zijn onbewerkt en worden niet procentgedecodeerd; ze mogen geen besturings-
  tekens of gereserveerde queryscheidingstekens (`?`, `&`, `%`) bevatten.

Gereserveerde tekens (`?`, `&`, `%`) buiten aangehaalde segmenten, predicaten of unies
worden geweigerd. Besturingstekens (U+0000-U+001F, U+007F) worden
overal geweigerd, ook in de waarde van de `session`-query.

`formatOcPath(parseOcPath(path)) === path` wordt gegarandeerd voor canonieke paden.
Niet-canonieke queryparameters worden genegeerd, behalve de eerste niet-lege
`session=`-waarde.

Harde limieten: een pad is begrensd op 4096 bytes, maximaal 4 posities (bestand/sectie/element/
veld), maximaal 64 door punten gescheiden subsegmenten per positie en maximaal 256 geneste
traverseringsniveaus voor diepe JSON-paden. Daarnaast wordt elk JSONC/JSON-invoerbestand
groter dan 16 MiB geweigerd met een parsediagnose in plaats van geparseerd, voor
elk werkwoord dat dat bestand laadt.

## Adressering per bestandstype

| Type          | Bestandsextensies            | Adresseringsmodel                                                                                   |
| ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                        | H2-secties op slug, opsommingselementen op slug of `#N`, frontmatter via `[frontmatter]`.           |
| JSONC/JSON    | `.jsonc`, `.json`            | Objectsleutels en array-indexen; punten splitsen geneste subsegmenten, tenzij aangehaald.            |
| JSONL         | `.jsonl`, `.ndjson`          | Adressen van regels op het hoogste niveau (`L1`, `L2`, `$first`, `$last`), daarna afdaling in JSONC-stijl binnen de regel. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`  | Mapsleutels en sequentie-indexen; opmerkingen en flowstijl worden verwerkt door de YAML-document-API. |

`resolve` retourneert een gestructureerde overeenkomst: `root`, `node`, `leaf` of
`insertion-point`, met een regelnummer vanaf 1. Eindwaarden worden beschikbaar gemaakt als
tekst plus een `leafType`, zodat Plugin-auteurs voorvertoningen kunnen weergeven zonder
afhankelijk te zijn van de AST-vorm per bestandstype.

## Mutatiecontract

`set` schrijft één concreet doel:

- Markdown-frontmatterwaarden en `- key: value`-elementvelden zijn tekenreeks-
  eindwaarden. Markdown-invoegingen voegen secties, frontmatter-sleutels of sectie-
  elementen toe en geven een canonieke markdownvorm voor het gewijzigde bestand weer. Sectie-
  inhouden zijn niet als geheel schrijfbaar via `set`.
- Bij schrijfbewerkingen van JSONC-eindwaarden wordt de tekenreekswaarde geconverteerd naar het bestaande type van de eindwaarde
  (`string`, eindige `number`, `true`/`false` of `null`). Gebruik `--value-json`
  wanneer een vervanging van een JSONC/JSON/JSONL-eindwaarde `<value>` als JSON moet parseren en
  van vorm mag veranderen, bijvoorbeeld bij het vervangen van een verkorte tekenreeksverwijzing naar een geheim door een
  object. JSONC-object- en array-invoegingen parseren `<value>` als JSON en gebruiken
  het bewerkingspad van `jsonc-parser` voor gewone schrijfbewerkingen van eindwaarden, waarbij opmerkingen
  en nabijgelegen opmaak behouden blijven.
- Bij schrijfbewerkingen van JSONL-eindwaarden wordt binnen een regel op dezelfde manier geconverteerd als bij JSONC. Vervanging van
  volledige regels en toevoegen parseren `<value>` als JSON. Weergegeven JSONL behoudt de
  dominante LF/CRLF-conventie voor regeleinden van het bestand (meerderheidsbesluit over de
  regeleinden in het bestand, zodat een bestand dat grotendeels CRLF gebruikt CRLF blijft gebruiken, zelfs met enkele afwijkende LF's).
- Bij schrijfbewerkingen van YAML-eindwaarden wordt geconverteerd naar het bestaande scalaire type (`string`, eindige
  `number`, `true`/`false` of `null`). YAML-invoegingen gebruiken de document-API
  van het gebundelde pakket `yaml` voor updates van maps/sequenties. Ongeldige YAML-
  documenten met parserfouten worden vóór mutatie geweigerd met
  `parse-error`.

Gebruik `--dry-run` vóór voor gebruikers zichtbare schrijfbewerkingen wanneer de exacte bytes van belang zijn. JSONC-
en YAML-bewerkingen passen het bestaande document aan (via `jsonc-parser` of de document-API van `yaml`),
zodat onaangeroerde bytes doorgaans behouden blijven; bij elke bewerking bouwt markdown het bestand
opnieuw op vanuit de geparseerde structuur, waardoor bijkomstige opmaak buiten de gewijzigde
eindwaarde kan worden genormaliseerd. Voeg `--diff` toe wanneer u het voorbeeld als een gerichte
voor/na-patch wilt zien in plaats van het volledig weergegeven bestand.

## Voorbeelden

```bash
# Een pad valideren (geen toegang tot het bestandssysteem)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Een eindwaarde lezen
openclaw path resolve 'oc://gateway.jsonc/version'

# Zoeken met jokertekens
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Een schrijfbewerking als proef uitvoeren
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Een schrijfbewerking als uniforme diff proefuitvoeren
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# De schrijfbewerking toepassen
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Bytegetrouwe heen-en-terugconversie (diagnose)
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

Dezelfde vijf werkwoorden werken voor alle typen; het adresseringsschema kiest op basis van
de bestandsextensie de juiste verwerking.

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
komt via de slug overeen met de kop `## Tools`, en itembladeren behouden hun slugvorm,
zelfs wanneer de bron onderstrepingstekens gebruikt (`send_email` wordt `send-email`).

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

JSONC-bewerkingen verlopen via `jsonc-parser`, zodat opmerkingen en witruimte een
`set` overleven. Voer de opdracht eerst uit met `--dry-run` om de bytes te controleren voordat je de wijziging definitief maakt.
`.json`-bestanden gebruiken dezelfde adapter en hetzelfde bewerkingspad als `.jsonc`.

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

Elke regel is een record. Adresseer met een predicaat (`[event=action]`) wanneer je
het regelnummer niet kent, of met het canonieke `LN`-segment wanneer je het wel kent.
`.ndjson`-bestanden gebruiken dezelfde adapter als `.jsonl`.

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

YAML gebruikt de `Document`-API van het `yaml`-pakket in plaats van een
zelfgeschreven parser, zodat normale parseer-/uitvoerrondgangen opmerkingen en de
oorspronkelijke vorm behouden, terwijl opgeloste paden hetzelfde model voor
mapsleutels en reeksindexen gebruiken als JSONC. Dezelfde adapter verwerkt
`.yaml`-, `.yml`- en `.lobster`-bestanden.

## Naslaginformatie voor subopdrachten

### `resolve <oc-path>`

Lees één blad of knooppunt. Jokertekens worden geweigerd — gebruik daarvoor `find`.
Eindigt met `0` bij een overeenkomst, `1` wanneer er zonder fout geen overeenkomst is en `2` bij een parseerfout of geweigerd
patroon.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Som elke overeenkomst voor een jokerteken-, predicaat- of uniepatroon op. Eindigt met `0`
bij ten minste één overeenkomst en met `1` bij nul overeenkomsten. Jokertekens voor de bestandspositie worden geweigerd met
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — geef een concreet bestand op (globpatronen
voor meerdere bestanden zijn een toekomstige functie).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Schrijf een blad. Combineer dit met `--dry-run` om een voorbeeld van de te schrijven
bytes te bekijken zonder het bestand te wijzigen. Voeg `--diff` toe voor een voorbeeld als uniforme diff.
Eindigt met `0` na een geslaagde schrijfactie, `1` als de onderliggende laag de actie weigert (bijvoorbeeld wanneer een
sentinelcontrole wordt geactiveerd) en `2` bij parseerfouten.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

De invoegmarkering `+key` maakt het genoemde onderliggende element aan als dit nog niet
bestaat; `+nnn` en een losse `+` dienen respectievelijk voor geïndexeerd invoegen en
achteraan toevoegen.

### `validate <oc-path>`

Controle waarbij alleen wordt geparseerd. Geen toegang tot het bestandssysteem. Nuttig wanneer je wilt bevestigen dat een
sjabloonpad correct is gevormd voordat je variabelen vervangt, of wanneer je
de structurele opbouw nodig hebt voor foutopsporing:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Eindigt met `0` wanneer het pad geldig is, `1` wanneer het ongeldig is (met een gestructureerde `code` en
`message`) en `2` bij argumentfouten.

### `emit <file>`

Laat een bestand een volledige rondgang door de parser en uitvoerder voor het betreffende type maken. De uitvoer hoort
byte voor byte identiek te zijn aan de invoer bij een geldig bestand; een verschil wijst op een
parserfout of een geactiveerde sentinelcontrole. Nuttig om het gedrag van de onderliggende laag met
praktijkinvoer te onderzoeken.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Afsluitcodes

| Code | Betekenis                                                                  |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Geslaagd. (`resolve` / `find`: ten minste één overeenkomst. `set`: schrijven geslaagd.) |
| `1`  | Geen overeenkomst, of `set` is door de onderliggende laag geweigerd (geen fout op systeemniveau). |
| `2`  | Argument- of parseerfout.                                                  |

## Uitvoermodus

`openclaw path` houdt rekening met de TTY: leesbare uitvoer voor mensen in een terminal en JSON wanneer
stdout via een pipe wordt doorgegeven of wordt omgeleid. `--json` en `--human` overschrijven de
automatische detectie.

## Opmerkingen

- `set` schrijft bytes via het uitvoerpad van de onderliggende laag, dat de
  controle op redactie-sentinels automatisch toepast. Een blad dat
  `__OPENCLAW_REDACTED__` bevat (letterlijk of als deeltekenreeks), wordt tijdens het schrijven
  geweigerd.
- Voor het parseren van JSONC en het bewerken van bladeren wordt de lokale Plugin-afhankelijkheid
  `jsonc-parser` gebruikt, zodat opmerkingen en opmaak bij normale schrijfacties naar bladeren
  behouden blijven in plaats van een zelfgeschreven parseer-/herweergavepad te doorlopen.
- `path` is niet op de hoogte van het bijhouden of herstellen van de laatst bekende geldige configuratie (LKG);
  die levenscyclus wordt elders beheerd. Als een bestand dat je via `path` bewerkt
  ook via LKG wordt bijgehouden, bepaalt de volgende configuratielezing of het wordt bevorderd of
  hersteld; behandel een `path`-bewerking hetzelfde als elke andere rechtstreekse schrijfactie naar
  dat bestand.

## Gerelateerd

- [CLI-naslaginformatie](/nl/cli)
