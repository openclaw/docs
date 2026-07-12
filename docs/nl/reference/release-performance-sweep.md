---
read_when:
    - U valideert de opschoning van de prestaties en pakketgrootte van mei 2026
    - Je hebt de cijfers achter de blogpost over de prestaties en afhankelijkheden van OpenClaw nodig
    - Je wijzigt releasepoorten, package-shrinkwrap of de afhankelijkheidsgrenzen van plugins
summary: Visueel overzicht en technisch bewijs voor de opschoning van prestaties, pakketgrootte, afhankelijkheden en shrinkwrap in mei 2026
title: Prestatiecontrole voor de release
x-i18n:
    generated_at: "2026-07-12T09:21:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Deze pagina bevat het bewijsmateriaal achter de opschoning van de prestaties,
pakketgrootte, afhankelijkheden en shrinkwrap van OpenClaw in mei 2026. Dit is
de technische aanvulling op de openbare blogpost.

Hier worden twee audits gecombineerd:

- **Doorlichting van releaseprestaties:** GitHub Releases vanaf `v2026.5.28`
  terug tot en met de stabiele versie `v2026.4.23`, met de workflow
  `OpenClaw Performance`, `profile=smoke` en de mock-provider-lane. De meeste
  tagrijen bevatten één meting; de rijen `v2026.5.27` en `v2026.5.28` gebruiken
  de nieuwste artefacten van drie herhalingen uit de releasetakken.
- **Eerdere context uit april:** gepubliceerde mock-provider-basiswaarden uit
  `clawgrit-reports` van `v2026.4.1` tot en met `v2026.5.2`, uitsluitend gebruikt
  om te voorkomen dat de defecte releases van eind april als openbare
  prestatiebasis worden beschouwd.
- **Doorlichting van de installatieomvang:** nieuwe installaties met
  `npm install --ignore-scripts` in tijdelijke pakketten, waarbij
  `du -sk node_modules` wordt gebruikt voor de grootte en `node_modules` wordt
  doorlopen om het aantal pakketinstanties te bepalen.
- **Doorlichting van de npm-pakketgrootte:**
  `npm pack openclaw@<version> --dry-run --json` voor gepubliceerde releases,
  waarbij de gecomprimeerde tarballgrootte, uitgepakte grootte en het aantal
  bestanden worden vastgelegd.

<Warning>
De belangrijkste prestatiedoorlichting gebruikt één smoke-meting per tag, met
uitzondering van de rijen `v2026.5.27` en `v2026.5.28`, die de nieuwste
artefacten van drie herhalingen uit de releasetakken gebruiken. De eerdere
context uit april gebruikt gepubliceerde medianen van drie herhalingen uit
`clawgrit-reports`. Beschouw de cijfers als bewijs voor trends en als signaal
voor het opsporen van regressies, niet als statistieken voor releasecriteria.
</Warning>

## Momentopname

Prestatiedekking: **77 aangevraagde releases**, **74 door artefacten onderbouwde
meetpunten** en **3 niet-beschikbare CI-runs**. Nieuwste gemeten stabiele punt:
`v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stabiele agentbeurt" icon="gauge">
    **5,1x snellere koude beurt**

    - `v2026.4.14`: 9,8 s
    - `v2026.5.28`: 1,9 s

  </Card>
  <Card title="Gepubliceerd pakket" icon="package">
    **Tarball van 17,9 MB**

    Het nieuwste stabiele pakket, afgenomen ten opzichte van de piek van
    43,3 MB voor de pakketgrootte in maart.

  </Card>
  <Card title="Nieuwste stabiele installatie" icon="hard-drive">
    **Nieuwe installatie van 361,7 MiB**

    Verkleint de geneste afhankelijkheidsboom van OpenClaw aanzienlijk ten
    opzichte van de piek bij de introductie van shrinkwrap in `2026.5.22`,
    hoewel in de lokale installatie-audit nog steeds een kleinere geneste boom
    van 259,7 MiB overblijft.

  </Card>
  <Card title="Afhankelijkheidsgraaf" icon="boxes">
    **300 geïnstalleerde pakketten**

    Gemeten als unieke combinaties van pakketnaam en versieroot in een nieuwe
    installatie met uitgeschakelde scripts; 71 minder roots dan in de vorige
    stabiele release.

  </Card>
</CardGroup>

## Wat is gewijzigd in 5.28

De opschoning tussen `v2026.5.27` en `v2026.5.28` verkleinde de graaf van de
standaardinstallatie in plaats van de mogelijkheden zelf te verwijderen.

<CardGroup cols={2}>
  <Card title="Standaardgraaf vanaf de root" icon="git-branch">
    Het aantal unieke combinaties van pakketnaam en versieroot daalde van
    **371** naar **300**. Het aantal pakketinstanties daalde van **372** naar
    **301**.
  </Card>
  <Card title="Geneste boom" icon="unplug">
    De geneste `openclaw/node_modules` daalde in dezelfde lokale
    installatie-audit van **656,1 MiB** naar **259,7 MiB**.
  </Card>
  <Card title="Optionele native afhankelijkheidskegels" icon="cpu">
    De native pakketkegel van `@napi-rs/canvas` voor alle platforms wordt niet
    langer in de standaardinstallatie opgenomen.
  </Card>
  <Card title="Oppervlak van de toeleveringsketen" icon="shield">
    Minder standaardpakketten betekent dat standaard minder tarballs,
    beheerders, native binaire bestanden, installatietijdgedrag en transitieve
    updatepaden hoeven te worden vertrouwd.
  </Card>
</CardGroup>

<Tip>
Shrinkwrap was op zichzelf niet het probleem. De slechte pakketvorm was dat
wel. `v2026.5.28` levert nog steeds shrinkwrap mee, maar de geneste
afhankelijkheidsboom is veel kleiner en de canvas-uitwaaiering voor alle
platforms is in de lokale audit verdwenen.
</Tip>

## Belangrijkste cijfers

Gebruik de defecte rijen van eind april niet als openbare prestatiebasis.
`v2026.4.23` en `v2026.4.29` zijn nuttig bewijs voor regressies, maar de grote
verschillen van het type `14x` beschrijven voornamelijk het herstel van een
slechte reeks releases.

Gebruik voor het verhaal in de blog de eerder gepubliceerde basiswaarde uit
april als schaal. De basiswaarde is `v2026.4.14` uit de gepubliceerde
mock-provider-run van `clawgrit-reports` (drie herhalingen; die run mislukte
alleen omdat de diagnostische tijdlijn niet werd uitgevoerd, waardoor de
mediane waarden voor koud, warm en RSS nog steeds bruikbaar zijn als grove
schaal). Beschouw dit als verhalende context, niet als statistiek voor een
releasecriterium.

| Metriek          | Eerdere basiswaarde uit april | `v2026.5.28` |                     Verschil |
| ---------------- | ----------------------------: | -----------: | ---------------------------: |
| Koude agentbeurt |                       9.819 ms |     1.908 ms | 80,6% lager, 5,1x sneller    |
| Warme agentbeurt |                       7.458 ms |     1.870 ms | 74,9% lager, 4,0x sneller    |
| Piek-RSS agent   |                        686,2 MB |      581,0 MB |                 15,3% lager |

Binnen de doorlichting van mei veranderde de nieuwste rij uit de releasetakken
aanzienlijk ten opzichte van `v2026.5.2`:

| Metriek          | `v2026.5.2` | `v2026.5.28` |    Verschil |
| ---------------- | ----------: | -----------: | ----------: |
| Koude agentbeurt |    3.897 ms |     1.908 ms | 51,0% lager |
| Warme agentbeurt |    3.610 ms |     1.870 ms | 48,2% lager |
| Piek-RSS agent   |     613,7 MB |      581,0 MB |  5,3% lager |

Vergeleken met de vorige stabiele release:

| Metriek          | `v2026.5.27` | `v2026.5.28` |    Verschil |
| ---------------- | -----------: | -----------: | ----------: |
| Koude agentbeurt |     2.231 ms |     1.908 ms | 14,5% lager |
| Warme agentbeurt |     2.226 ms |     1.870 ms | 16,0% lager |
| Piek-RSS agent   |      649,0 MB |      581,0 MB | 10,5% lager |

### Installatieomvang

| Metriek                                        | Basiswaarde | `v2026.5.28` |    Verschil |
| ---------------------------------------------- | ----------: | -----------: | ----------: |
| Installatiegrootte vanaf piek `2026.5.22`      |  1.020,6 MB |    361,7 MiB | 64,6% lager |
| Installatiegrootte vanaf nieuwste release `2026.5.27` | 767,1 MiB | 361,7 MiB | 52,8% lager |
| Afhankelijkheden vanaf maandpiek `2026.2.26`   |         645 |          300 | 53,5% lager |
| Afhankelijkheden vanaf nieuwste release `2026.5.27` |      371 |          300 | 19,1% lager |
| Geneste `openclaw/node_modules` vanaf `2026.5.22` | 911,8 MB |    259,7 MiB | 71,5% lager |
| Geneste `openclaw/node_modules` vanaf `2026.5.27` | 656,1 MiB |   259,7 MiB | 60,4% lager |

### Grootte van het npm-pakket

| Versie      | Gecomprimeerde tarball | Uitgepakt pakket | Bestanden | Opmerkingen                                  |
| ----------- | ----------------------: | ---------------: | ---------: | -------------------------------------------- |
| `2026.1.30` |                 12,8 MB |          33,5 MB |      4.607 | vroeg pakket na naamswijziging               |
| `2026.2.26` |                 23,6 MB |          82,9 MB |     10.125 | groei van functionaliteit                    |
| `2026.3.31` |                 43,3 MB |         182,6 MB |     21.037 | piek van de pakketgrootte                    |
| `2026.4.29` |                 22,9 MB |          74,6 MB |      9.309 | opschoning van pakketten zichtbaar           |
| `2026.5.12` |                 23,4 MB |          80,1 MB |     12.035 | grote afsplitsing van externe plugins        |
| `2026.5.22` |                 17,2 MB |          76,9 MB |     12.386 | documentatie/assets uitgesloten van pakket   |
| `2026.5.27` |                 17,8 MB |          79,0 MB |     12.509 | vorig stabiel pakket                         |
| `2026.5.28` |                 17,9 MB |          81,0 MB |      9.082 | nieuwste stabiele pakket                     |

`2026.5.12` is de zichtbare mijlpaal voor Plugin-extractie in het
wijzigingslogboek: Amazon Bedrock, Bedrock Mantle, Slack, OpenShell-sandbox,
Anthropic Vertex, Matrix en WhatsApp zijn uit het kernpad voor afhankelijkheden
verplaatst, zodat hun afhankelijkheidskegels met die plugins worden
geïnstalleerd in plaats van met elke kerninstallatie.

## Samenvatting van Kova-agentbeurten

De stabiele reeks van april bevat twee verschillende verhalen. Eerder in april
was deze traag maar herkenbaar. Eind april ontstond een scherpe regressie.
`v2026.5.2` is het punt waarop de mock-provider-lane voor het eerst daalt naar
het bereik van 3–5 s en in de aangeleverde doorlichting consistent begint te
slagen.

Eerdere gepubliceerde context:

| Release      | Kova | Koude beurt | Warme beurt | Piek-RSS agent |
| ------------ | ---- | ----------: | ----------: | -------------: |
| `v2026.4.10` | MISLUKT |  11.031 ms |   7.962 ms |       679,0 MB |
| `v2026.4.12` | MISLUKT |  11.965 ms |   8.289 ms |       713,5 MB |
| `v2026.4.14` | MISLUKT |   9.819 ms |   7.458 ms |       686,2 MB |
| `v2026.4.20` | MISLUKT |  22.314 ms |  18.811 ms |       810,8 MB |
| `v2026.4.22` | MISLUKT |   9.630 ms |   7.459 ms |       743,0 MB |

Aangeleverde doorlichting:

| Release             | Kova | Koude beurt | Warme beurt | Piek-RSS agent |
| ------------------- | ---- | ----------: | ----------: | -------------: |
| `v2026.4.23`        | MISLUKT |  47.847 ms |   8.010 ms |     1.082,7 MB |
| `v2026.4.24`        | MISLUKT |  48.264 ms |  25.483 ms |       996,0 MB |
| `v2026.4.25`        | MISLUKT |  81.080 ms |  59.172 ms |     1.113,9 MB |
| `v2026.4.26`        | MISLUKT |  76.771 ms |  54.941 ms |     1.140,8 MB |
| `v2026.4.27`        | MISLUKT |  60.902 ms |  33.699 ms |     1.156,0 MB |
| `v2026.4.29`        | MISLUKT |  94.031 ms |  57.334 ms |     3.613,7 MB |
| `v2026.5.2`         | GESLAAGD |   3.897 ms |   3.610 ms |       613,7 MB |
| `v2026.5.7`         | GESLAAGD |   3.923 ms |   3.693 ms |       654,1 MB |
| `v2026.5.12`        | GESLAAGD |   7.248 ms |   6.629 ms |       834,8 MB |
| `v2026.5.18`        | GESLAAGD |   3.301 ms |   2.913 ms |       630,3 MB |
| `v2026.5.20`        | GESLAAGD |   3.413 ms |   2.952 ms |       643,2 MB |
| `v2026.5.22`        | GESLAAGD |   4.494 ms |   4.093 ms |       654,3 MB |
| `v2026.5.26`        | GESLAAGD |   2.626 ms |   2.282 ms |       660,4 MB |
| `v2026.5.27-beta.1` | GESLAAGD |   2.575 ms |   2.217 ms |       635,3 MB |
| `v2026.5.27`        | GESLAAGD |   2.231 ms |   2.226 ms |       649,0 MB |
| `v2026.5.28`        | GESLAAGD |   1.908 ms |   1.870 ms |       581,0 MB |

## Bronprobes

Bronprobes zijn overgeslagen voor 17 geslaagde oudere refs, omdat die
bronstructuren nog niet over de vereiste probe-ingangspunten beschikten. Voor
die refs bestaan nog steeds metrieken voor agentbeurten.

Representatieve bronprobepunten:

| Release             | Standaard `readyz` p50 | 50 plugins `readyz` p50 | CLI-status p50 | Maximale RSS Plugin |
| ------------------- | ---------------------: | ----------------------: | -------------: | -------------------: |
| `v2026.4.29`        |               2.819 ms |                2.618 ms |       1.679 ms |             389,0 MB |
| `v2026.5.2`         |               2.324 ms |                2.013 ms |       1.384 ms |             377,2 MB |
| `v2026.5.7`         |               1.649 ms |                1.540 ms |       1.175 ms |             387,6 MB |
| `v2026.5.18`        |               1.942 ms |                1.927 ms |         607 ms |             426,5 MB |
| `v2026.5.20`        |               1.966 ms |                1.987 ms |         621 ms |             455,0 MB |
| `v2026.5.22`        |               2.081 ms |                1.884 ms |       5.095 ms |             444,2 MB |
| `v2026.5.26`        |               1.546 ms |                1.634 ms |         656 ms |             400,4 MB |
| `v2026.5.27-beta.1` |               1.462 ms |                1.548 ms |         548 ms |             394,0 MB |
| `v2026.5.27`        |               1.491 ms |                1.571 ms |         553 ms |             401,5 MB |
| `v2026.5.28`        |               1.457 ms |                1.474 ms |         623 ms |             386,1 MB |

De piek in de CLI-status van `v2026.5.22` is in deze tabel zichtbaar, hoewel de
lane voor agentbeurten nog steeds slaagde. Behoud de bronprobes bij onderzoek
naar gerichte CLI- of Gateway-regressies.

## Audit van de installatieomvang

Voor de afhankelijkheidsmetingen wordt één stabiele release per maand
gebruikt, plus de introductie van shrinkwrap in `2026.5.22` en de nieuwste
release `2026.5.28`.

| Meetpunt           | Geïnstalleerde afhankelijkheden | Nieuwe installatie | OpenClaw-pakket | Geneste `openclaw/node_modules` | Root-shrinkwrap | Canvas-installatiegedrag                  |
| ------------------ | -------------------------------: | ------------------: | ---------------: | ------------------------------: | --------------- | ----------------------------------------- |
| jan. `2026.1.30`   |                              605 |             438.4MB |           45.8MB |                           2.4MB | nee             | wrapper op hoofdniveau + `darwin-arm64`   |
| feb. `2026.2.26`   |                              645 |             575.7MB |          110.1MB |                           3.5MB | nee             | wrapper op hoofdniveau + `darwin-arm64`   |
| mrt. `2026.3.31`   |                              438 |             584.1MB |          234.8MB |                             0MB | nee             | wrapper op hoofdniveau + `darwin-arm64`   |
| apr. `2026.4.29`   |                              392 |             335.0MB |           97.4MB |                             0MB | nee             | niets geïnstalleerd                       |
| `2026.5.22`        |                              401 |           1,020.6MB |        1,020.4MB |                         911.8MB | ja              | genest: alle 12 `@napi-rs/canvas`-pakketten |
| mei `2026.5.26`    |                              371 |             767.5MB |          767.4MB |                         656.4MB | ja              | genest: alle 12 `@napi-rs/canvas`-pakketten |
| `2026.5.27`        |                              371 |            767.1MiB |         766.9MiB |                        656.1MiB | ja              | genest: alle 12 `@napi-rs/canvas`-pakketten |
| Nieuwste `2026.5.28` |                            300 |            361.7MiB |         361.6MiB |                        259.7MiB | ja              | niets geïnstalleerd                       |

### Shrinkwrap-grens

`2026.5.20` werd uitgebracht zonder root-shrinkwrap en zonder grote geneste
afhankelijkheidsboom van OpenClaw. `2026.5.22` introduceerde root-shrinkwrap en
installeerde 911.8MB onder de geneste `openclaw/node_modules`. `2026.5.28`
behoudt shrinkwrap en installeert nog steeds 259.7MiB onder de geneste
`openclaw/node_modules`, maar installeert bij de lokale controle van een nieuwe
installatie geen `@napi-rs/canvas`-pakketten meer.

Inspectie van de gepubliceerde tarball bevestigt de grens:

| Versie      | Als stabiel gepubliceerd? | Root-`npm-shrinkwrap.json` | Opmerkingen                                  |
| ----------- | -------------------------- | -------------------------- | -------------------------------------------- |
| `2026.5.20` | ja                         | nee                        | laatste stabiele release vóór shrinkwrap     |
| `2026.5.21` | nee                        | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.22` | ja                         | ja                         | shrinkwrap geïntroduceerd                    |
| `2026.5.23` | nee                        | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.24` | nee                        | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.25` | nee                        | n.v.t.                     | geen stabiele npm-release                    |
| `2026.5.26` | ja                         | ja                         | geneste afhankelijkheidsboom nog aanwezig   |
| `2026.5.27` | ja                         | ja                         | geneste afhankelijkheidsboom nog aanwezig   |
| `2026.5.28` | ja                         | ja                         | geneste afhankelijkheidsboom veel kleiner   |

Het belangrijke onderscheid: **shrinkwrap zelf is niet het probleem**.
`v2026.5.28` wordt nog steeds met root-shrinkwrap geleverd. Het probleem was de
pakketstructuur waardoor npm een grote geneste afhankelijkheidsboom van
OpenClaw en alle 12 platformspecifieke `@napi-rs/canvas`-pakketten
materialiseerde. De geneste boom is kleiner in `v2026.5.28` en de uitwaaiering
van Canvas-platformpakketten komt niet meer voor in de lokale controle.

Zie [npm-shrinkwrap](/nl/gateway/security/shrinkwrap) voor een begrijpelijke uitleg
van shrinkwrap en de pakketcontroles voor beheerders.

## Interpretatie voor de toeleveringsketen

Het aantal afhankelijkheden is een operationele beveiligingsmaatstaf, niet
alleen een maatstaf voor de installatiegrootte. Elk pakket vergroot de
verzameling beheerders, tarballs, transitieve updates, optionele native
binaire bestanden en gedragingen tijdens de installatie die operators moeten
vertrouwen.

De richting van de opschoning is:

- houd zware en optionele mogelijkheden buiten de standaardinstallatie van de kern
- laat Plugin-pakketten hun eigen runtime-afhankelijkheidsgraaf beheren
- vermijd herstel door de pakketbeheerder tijdens het starten van de Gateway
- behoud deterministische installaties zonder native pakketten voor alle
  platforms te materialiseren
- houd installatiescripts uitgeschakeld in acceptatie- en meettrajecten voor pakketten
- detecteer geneste afhankelijkheidsbomen en explosieve groei van optionele
  native afhankelijkheden vóór publicatie

Gerelateerde documentatie:

- [Afhankelijkheden van Plugins oplossen](/nl/plugins/dependency-resolution)
- [Plugin-inventaris](/nl/plugins/plugin-inventory)
- [Volledige releasevalidatie](/nl/reference/full-release-validation)
