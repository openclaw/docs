---
read_when:
    - Je valideert de prestatie- en pakketgrootteopschoning van mei 2026
    - Je hebt de cijfers achter de blogpost over OpenClaw-prestaties en afhankelijkheden nodig
    - Je wijzigt releasepoorten, package-shrinkwrap of grenzen voor Plugin-afhankelijkheden
summary: Visuele samenvatting en technisch bewijs voor de opschoning van prestaties, pakketgrootte, afhankelijkheden en shrinkwrap in mei 2026
title: Release-prestatiesweep
x-i18n:
    generated_at: "2026-06-27T18:18:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Deze pagina legt het bewijs vast achter de opschoning van prestaties,
pakketgrootte, afhankelijkheden en shrinkwrap in OpenClaw van mei 2026. Het is de technische aanvulling
op het openbare blogbericht.

Twee audits worden hier gecombineerd:

- **Release-prestatiesweep:** GitHub Releases van `v2026.5.28` terug tot en met
  stabiele `v2026.4.23`, met de workflow `OpenClaw Performance`,
  `profile=smoke`, mock-provider-lane. De meeste tagrijen zijn één sample; de
  rijen `v2026.5.27` en `v2026.5.28` gebruiken de nieuwste repeat-3-artefacten
  van de release-branch.
- **Eerdere context van april:** gepubliceerde mock-provider-baselines van
  `clawgrit-reports` van `v2026.4.1` tot en met `v2026.5.2`, alleen gebruikt om te voorkomen
  dat de kapotte releases van eind april als openbare prestatiebaseline worden behandeld.
- **Sweep van installatievoetafdruk:** verse `npm install --ignore-scripts`-installaties
  in tijdelijke pakketten, met `du -sk node_modules` voor grootte en een
  `node_modules`-doorloop voor aantallen pakketinstanties.
- **Sweep van npm-pakketgrootte:** `npm pack openclaw@<version> --dry-run --json`
  voor gepubliceerde releases, waarbij gecomprimeerde tarballgrootte, uitgepakte grootte en
  bestandsaantal worden vastgelegd.

<Warning>
De hoofdprestatie-sweep gebruikt één smoke-sample per tag, behalve de
rijen `v2026.5.27` en `v2026.5.28`, die de nieuwste repeat-3-artefacten
van de release-branch gebruiken. Eerdere context van april gebruikt gepubliceerde repeat-3-medianen
uit `clawgrit-reports`. Behandel de cijfers als trendbewijs en
signaal voor regressieonderzoek, niet als release-gate-statistieken.
</Warning>

## Momentopname

Prestatiedekking: **77 aangevraagde releases**, **74 punten met artefactonderbouwing**,
en **3 niet-beschikbare CI-runs**. Nieuwste gemeten stabiele punt: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **5,1x snellere koude beurt**

    - `v2026.4.14`: 9,8s
    - `v2026.5.28`: 1,9s

  </Card>
  <Card title="Published package" icon="package">
    **17,9MB tarball**

    Nieuwste stabiele pakket, gedaald vanaf de piek van 43,3MB in pakketgrootte in maart.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **361,7MiB verse installatie**

    `v2026.5.28` verkleint de geneste OpenClaw-afhankelijkheidsboom sterk, maar er
    blijft in de lokale installatie-audit nog steeds een kleinere geneste boom van 259,7MiB over.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 geïnstalleerde pakketten**

    Nieuwste stabiele release, gemeten als unieke pakketnaam-/versie-roots in een
    verse installatie met scripts uitgeschakeld.

  </Card>
</CardGroup>

## Tijdlijn Van Installatievoetafdruk

<CardGroup cols={2}>
  <Card title="Monthly high" icon="triangle-alert">
    **645 afhankelijkheden**

    `2026.2.26` was in deze sample de maandelijkse piek in aantal afhankelijkheden.

  </Card>
  <Card title="Shrinkwrap introduced" icon="lock">
    **1.020,6MB installatie**

    `2026.5.22` voegde root-shrinkwrap toe en legde een probleem met de pakketvorm bloot:
    911,8MB kwam terecht onder geneste `openclaw/node_modules`.

  </Card>
  <Card title="Latest stable" icon="tag">
    **361,7MiB installatie**

    `2026.5.28` verkleint de verse installatiegrootte met 52,8% ten opzichte van `2026.5.27`, maar installeert nog steeds
    een geneste OpenClaw-boom van 259,7MiB.

  </Card>
  <Card title="Dependency graph" icon="scissors">
    **300 pakket-roots**

    `2026.5.28` installeert 71 minder unieke pakketnaam-/versie-roots dan
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Shrinkwrap was op zichzelf niet het probleem. De slechte pakketvorm was dat wel.
`v2026.5.28` levert nog steeds shrinkwrap mee, maar de geneste afhankelijkheidsboom is veel
kleiner en de canvas-fanout voor alle platforms is verdwenen in de lokale audit.
</Tip>

## Wat Veranderde In 5.28

De opschoning tussen `v2026.5.27` en `v2026.5.28` verkleinde de afhankelijkheidsgraaf van de standaardinstallatie
in plaats van de mogelijkheden zelf te verwijderen.

<CardGroup cols={2}>
  <Card title="Standaardgraaf op rootniveau" icon="git-branch">
    Unieke roots op pakketnaam/versie daalden van **371** naar **300**. Pakketinstanties
    daalden van **372** naar **301**.
  </Card>
  <Card title="Geneste boom" icon="unplug">
    Geneste `openclaw/node_modules` daalde van **656.1MiB** naar **259.7MiB** in
    dezelfde lokale installatie-audit.
  </Card>
  <Card title="Native optionele afhankelijkheidscones" icon="cpu">
    De all-platform native pakketcone van `@napi-rs/canvas` kwam niet langer in
    de standaardinstallatie terecht.
  </Card>
  <Card title="Supply-chainoppervlak" icon="shield">
    Minder standaardpakketten betekent minder tarballs, maintainers, native binaries,
    installatiegedrag en transitieve updatepaden die standaard vertrouwd moeten worden.
  </Card>
</CardGroup>

## Belangrijkste Cijfers

Gebruik de defecte rijen van eind april niet als publieke prestatiebaselines.
`v2026.4.23` en `v2026.4.29` zijn nuttig regressiebewijs, maar de grote
deltas in `14x`-stijl beschrijven vooral het herstel van een slechte releaselijn.

Gebruik voor het blogverhaal de eerder in april gepubliceerde baseline als schaal:

| Metriek         | Eerdere aprilbaseline | `v2026.5.28` |                    Delta |
| --------------- | --------------------: | -----------: | -----------------------: |
| Koude agentbeurt |               9,819ms |      1,908ms | 80.6% lager, 5.1x sneller |
| Warme agentbeurt |               7,458ms |      1,870ms | 74.9% lager, 4.0x sneller |
| Agent-piek-RSS  |                686.2MB |      581.0MB |              15.3% lager |

De eerdere aprilbaseline is `v2026.4.14` uit de gepubliceerde
`clawgrit-reports` mock-provider-run. Die run gebruikte repeat 3 en faalde alleen
omdat de diagnostische tijdlijn niet werd uitgegeven; de medianen voor koud, warm en RSS
zijn nog steeds bruikbaar als ruwe schaal. Behandel dit als narratieve context, niet als
release-gate-statistiek.

Binnen de sweep van mei verschoof de nieuwste release-branch-rij materieel vanaf
`v2026.5.2`:

| Metriek         | `v2026.5.2` | `v2026.5.28` |       Delta |
| --------------- | ----------: | -----------: | ----------: |
| Koude agentbeurt |     3,897ms |      1,908ms | 51.0% lager |
| Warme agentbeurt |     3,610ms |      1,870ms | 48.2% lager |
| Agent-piek-RSS  |     613.7MB |      581.0MB |  5.3% lager |

Vergeleken met de vorige stabiele release:

| Metriek         | `v2026.5.27` | `v2026.5.28` |       Delta |
| --------------- | -----------: | -----------: | ----------: |
| Koude agentbeurt |      2,231ms |      1,908ms | 14.5% lager |
| Warme agentbeurt |      2,226ms |      1,870ms | 16.0% lager |
| Agent-piek-RSS  |      649.0MB |      581.0MB | 10.5% lager |

### Installatievoetafdruk

| Metriek                                         |  Baseline | `v2026.5.28` |       Delta |
| ----------------------------------------------- | --------: | -----------: | ----------: |
| Installatiegrootte vanaf `2026.5.22`-piek       | 1,020.6MB |     361.7MiB | 64.6% lager |
| Installatiegrootte vanaf nieuwste release `2026.5.27` |  767.1MiB |     361.7MiB | 52.8% lager |
| Afhankelijkheden vanaf maandelijkse piek `2026.2.26` |       645 |          300 | 53.5% lager |
| Afhankelijkheden vanaf nieuwste release `2026.5.27` |       371 |          300 | 19.1% lager |
| Geneste `openclaw/node_modules` vanaf `2026.5.22` |   911.8MB |     259.7MiB | 71.5% lager |
| Geneste `openclaw/node_modules` vanaf `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% lager |

### npm-pakketgrootte

| Versie      | Gecomprimeerde tarball | Uitgepakt pakket | Bestanden | Opmerkingen                       |
| ----------- | ---------------------: | ---------------: | --------: | --------------------------------- |
| `2026.1.30` |                 12.8MB |           33.5MB |     4,607 | vroeg hernoemd pakket             |
| `2026.2.26` |                 23.6MB |           82.9MB |    10,125 | functiegroei                      |
| `2026.3.31` |                 43.3MB |          182.6MB |    21,037 | hoogtepunt van pakketgrootte      |
| `2026.4.29` |                 22.9MB |           74.6MB |     9,309 | pakketsnoei zichtbaar             |
| `2026.5.12` |                 23.4MB |           80.1MB |    12,035 | grote splitsing van externe plugins |
| `2026.5.22` |                 17.2MB |           76.9MB |    12,386 | docs/assets uitgesloten van pakket |
| `2026.5.27` |                 17.8MB |           79.0MB |    12,509 | vorig stabiel pakket              |
| `2026.5.28` |                 17.9MB |           81.0MB |     9,082 | nieuwste stabiele pakket          |

`2026.5.12` is de zichtbare mijlpaal voor plugin-extractie in de changelog:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix en WhatsApp verhuisden uit het afhankelijkheidspad van de core, zodat hun afhankelijkheidscones
met die plugins installeren in plaats van bij elke core-installatie.

## Samenvatting van Kova-agentbeurten

De stabiele lijn van april bevat twee verschillende verhalen. Begin april was traag
maar herkenbaar. Eind april werd een regressieklif. `v2026.5.2` is waar
de mock-provider-lane voor het eerst naar het bereik van 3-5s zakt en consistent begint te slagen
in de aangeleverde sweep.

Eerder gepubliceerde context:

| Release      | Kova | Koude beurt | Warme beurt | Agent-piek-RSS |
| ------------ | ---- | ----------: | ----------: | -------------: |
| `v2026.4.10` | FAIL |    11,031ms |     7,962ms |        679.0MB |
| `v2026.4.12` | FAIL |    11,965ms |     8,289ms |        713.5MB |
| `v2026.4.14` | FAIL |     9,819ms |     7,458ms |        686.2MB |
| `v2026.4.20` | FAIL |    22,314ms |    18,811ms |        810.8MB |
| `v2026.4.22` | FAIL |     9,630ms |     7,459ms |        743.0MB |

Aangeleverde sweep:

| Release             | Kova | Koude beurt | Warme beurt | Agent-piek-RSS |
| ------------------- | ---- | ----------: | ----------: | -------------: |
| `v2026.4.23`        | FAIL |    47,847ms |     8,010ms |      1,082.7MB |
| `v2026.4.24`        | FAIL |    48,264ms |    25,483ms |        996.0MB |
| `v2026.4.25`        | FAIL |    81,080ms |    59,172ms |      1,113.9MB |
| `v2026.4.26`        | FAIL |    76,771ms |    54,941ms |      1,140.8MB |
| `v2026.4.27`        | FAIL |    60,902ms |    33,699ms |      1,156.0MB |
| `v2026.4.29`        | FAIL |    94,031ms |    57,334ms |      3,613.7MB |
| `v2026.5.2`         | PASS |     3,897ms |     3,610ms |        613.7MB |
| `v2026.5.7`         | PASS |     3,923ms |     3,693ms |        654.1MB |
| `v2026.5.12`        | PASS |     7,248ms |     6,629ms |        834.8MB |
| `v2026.5.18`        | PASS |     3,301ms |     2,913ms |        630.3MB |
| `v2026.5.20`        | PASS |     3,413ms |     2,952ms |        643.2MB |
| `v2026.5.22`        | PASS |     4,494ms |     4,093ms |        654.3MB |
| `v2026.5.26`        | PASS |     2,626ms |     2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | PASS |     2,575ms |     2,217ms |        635.3MB |
| `v2026.5.27`        | PASS |     2,231ms |     2,226ms |        649.0MB |
| `v2026.5.28`        | PASS |     1,908ms |     1,870ms |        581.0MB |

## Bronprobes

Bronprobes werden overgeslagen voor 17 succesvolle oudere refs omdat die bronbomen
de vereiste probe-entrypoints nog niet hadden. Agentbeurtstatistieken bestaan nog steeds
voor die refs.

Representatieve bronprobe-punten:

| Release             | Standaard `readyz` p50 | 50 plugins `readyz` p50 | CLI-health p50 | Plugin max RSS |
| ------------------- | ---------------------: | ----------------------: | -------------: | -------------: |
| `v2026.4.29`        |                2,819ms |                 2,618ms |        1,679ms |        389.0MB |
| `v2026.5.2`         |                2,324ms |                 2,013ms |        1,384ms |        377.2MB |
| `v2026.5.7`         |                1,649ms |                 1,540ms |        1,175ms |        387.6MB |
| `v2026.5.18`        |                1,942ms |                 1,927ms |          607ms |        426.5MB |
| `v2026.5.20`        |                1,966ms |                 1,987ms |          621ms |        455.0MB |
| `v2026.5.22`        |                2,081ms |                 1,884ms |        5,095ms |        444.2MB |
| `v2026.5.26`        |                1,546ms |                 1,634ms |          656ms |        400.4MB |
| `v2026.5.27-beta.1` |                1,462ms |                 1,548ms |          548ms |        394.0MB |
| `v2026.5.27`        |                1,491ms |                 1,571ms |          553ms |        401.5MB |
| `v2026.5.28`        |                1,457ms |                 1,474ms |          623ms |        386.1MB |

De CLI-gezondheidspiek in `v2026.5.22` is zichtbaar in deze tabel, ook al is de
agent-turn-lane nog steeds geslaagd. Bewaar de bronprobes bij onderzoek naar
gerichte CLI- of Gateway-regressies.

## Audit van installatievoetafdruk

Afhankelijkheidssamples gebruiken één stabiele release per maand, plus het
`2026.5.22`-event waarbij shrinkwrap werd geïntroduceerd en de nieuwste release
`2026.5.28`.

| Punt               | Geïnstalleerde deps | Verse installatie | OpenClaw-pakket | Geneste `openclaw/node_modules` | Root-shrinkwrap | Installatiegedrag van Canvas              |
| ------------------ | ------------------: | ----------------: | --------------: | ------------------------------: | --------------- | ----------------------------------------- |
| Jan `2026.1.30`    |                 605 |           438.4MB |          45.8MB |                           2.4MB | nee             | wrapper op topniveau + `darwin-arm64`     |
| Feb `2026.2.26`    |                 645 |           575.7MB |         110.1MB |                           3.5MB | nee             | wrapper op topniveau + `darwin-arm64`     |
| Mrt `2026.3.31`    |                 438 |           584.1MB |         234.8MB |                             0MB | nee             | wrapper op topniveau + `darwin-arm64`     |
| Apr `2026.4.29`    |                 392 |           335.0MB |          97.4MB |                             0MB | nee             | niets geïnstalleerd                       |
| `2026.5.22`        |                 401 |         1,020.6MB |       1,020.4MB |                         911.8MB | ja              | genest: alle 12 `@napi-rs/canvas`-pakketten |
| Mei `2026.5.26`    |                 371 |           767.5MB |         767.4MB |                         656.4MB | ja              | genest: alle 12 `@napi-rs/canvas`-pakketten |
| `2026.5.27`        |                 371 |          767.1MiB |        766.9MiB |                        656.1MiB | ja              | genest: alle 12 `@napi-rs/canvas`-pakketten |
| Nieuwste `2026.5.28` |               300 |          361.7MiB |        361.6MiB |                        259.7MiB | ja              | niets geïnstalleerd                       |

### Shrinkwrap-grens

<CardGroup cols={2}>
  <Card title="Before shrinkwrap" icon="unlock">
    `2026.5.20` heeft geen root-shrinkwrap en geen grote geneste
    afhankelijkheidsboom van OpenClaw.
  </Card>
  <Card title="Introduced" icon="lock">
    `2026.5.22` voegt root-shrinkwrap toe en installeert 911.8MB onder geneste
    `openclaw/node_modules`.
  </Card>
  <Card title="Latest stable" icon="tag">
    `2026.5.28` behoudt shrinkwrap en installeert nog steeds 259.7MiB onder
    geneste `openclaw/node_modules`.
  </Card>
  <Card title="Canvas fanout fixed" icon="check">
    `2026.5.28` installeert geen `@napi-rs/canvas`-pakketten meer in de lokale
    audit van een verse installatie.
  </Card>
</CardGroup>

Inspectie van gepubliceerde tarballs verifieert de grens:

| Versie      | Gepubliceerd stabiel? | Root-`npm-shrinkwrap.json` | Opmerkingen                                  |
| ----------- | --------------------- | -------------------------- | -------------------------------------------- |
| `2026.5.20` | ja                    | nee                        | laatste stabiele release vóór shrinkwrap     |
| `2026.5.21` | nee                   | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.22` | ja                    | ja                         | shrinkwrap geïntroduceerd                    |
| `2026.5.23` | nee                   | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.24` | nee                   | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.25` | nee                   | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.26` | ja                    | ja                         | geneste afhankelijkheidsboom nog aanwezig    |
| `2026.5.27` | ja                    | ja                         | geneste afhankelijkheidsboom nog aanwezig    |
| `2026.5.28` | ja                    | ja                         | geneste afhankelijkheidsboom veel kleiner    |

Het belangrijke onderscheid: **shrinkwrap zelf is niet het probleem**.
`v2026.5.28` levert nog steeds root-shrinkwrap mee. Het probleem was de
pakketvorm waardoor npm een grote geneste afhankelijkheidsboom van OpenClaw en
alle 12 platformpakketten van `@napi-rs/canvas` materialiseerde. De geneste boom
is kleiner in `v2026.5.28`, en de platform-fanout van canvas komt niet meer in
de lokale audit terecht.

Zie [npm-shrinkwrap](/nl/gateway/security/shrinkwrap) voor een uitleg in gewone
taal over shrinkwrap en pakketcontroles op maintainer-niveau.

## Interpretatie voor supply chain

Het aantal afhankelijkheden is een operationele beveiligingsmetriek, niet alleen
een metriek voor installatiegrootte. Elk pakket vergroot de set maintainers,
tarballs, transitieve updates, optionele native binaries en gedragingen tijdens
installatie die operators moeten vertrouwen.

De richting van de opschoning is:

- houd zware en optionele mogelijkheden buiten de standaard core-installatie
- laat Plugin-pakketten eigenaar zijn van hun runtime-afhankelijkheidsgrafiek
- vermijd herstel via de package manager tijdens het starten van de Gateway
- behoud deterministische installaties zonder materialisatie van native pakketten
  voor alle platforms te veroorzaken
- houd installatiescripts uitgeschakeld in paden voor pakketacceptatie en meting
- vang geneste afhankelijkheidsbomen en explosies van native optionele
  afhankelijkheden op vóór publicatie

Gerelateerde docs:

- [Resolutie van Plugin-afhankelijkheden](/nl/plugins/dependency-resolution)
- [Plugin-inventaris](/nl/plugins/plugin-inventory)
- [Volledige releasevalidatie](/nl/reference/full-release-validation)
