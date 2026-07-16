---
read_when:
    - Je wilt een broncodecheckout veilig bijwerken
    - Je debugt `openclaw update`-uitvoer of -opties
    - Je moet het gedrag van de afkorting `--update` begrijpen
summary: CLI-referentie voor `openclaw update` (redelijk veilige bronupdate + automatische herstart van de Gateway)
title: Bijwerken
x-i18n:
    generated_at: "2026-07-16T15:27:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Werk OpenClaw bij en schakel tussen de kanalen stable/extended-stable/beta/dev.

Als je via **npm/pnpm/bun** hebt geïnstalleerd (globale installatie, geen git-metadata),
verlopen updates via de pakketbeheerderprocedure die wordt beschreven in
[Bijwerken](/nl/install/updating).

## Gebruik

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` wordt herschreven naar `openclaw update` (nuttig voor shells en
startscripts).

## Opties

| Vlag                                             | Beschrijving                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Sla het opnieuw starten van de Gateway-service na een geslaagde update over. Bij pakketbeheerderupdates die de service wel opnieuw starten, wordt gecontroleerd of de opnieuw gestarte service de verwachte versie meldt voordat de opdracht slaagt.                                                                                             |
| `--channel <stable\|extended-stable\|beta\|dev>` | Stel het updatekanaal in en sla het op nadat de kernupdate is geslaagd. Extended-stable is alleen beschikbaar voor pakketten.                                                                                                                                                                                                                  |
| `--tag <dist-tag\|version\|spec>`                | Overschrijf het pakketdoel alleen voor deze update. Dit kan niet worden gecombineerd met een actief `extended-stable`-kanaal, waarvoor het geverifieerde exacte doel verplicht is. Voor andere pakketinstallaties wordt `main` omgezet naar `github:openclaw/openclaw#main`; GitHub-/git-bronspecificaties worden in een tijdelijk tarball verpakt vóór de gefaseerde globale npm-installatie. |
| `--dry-run`                                      | Bekijk een voorbeeld van de geplande acties (kanaal/tag/doel/herstartprocedure) zonder configuratie te schrijven, te installeren, plugins te synchroniseren of opnieuw te starten.                                                                                                                                                             |
| `--json`                                         | Druk machineleesbare `UpdateRunResult`-JSON af. Bevat `postUpdate.plugins.warnings` wanneer een beheerde plugin moet worden gerepareerd, details over de terugvaloptie voor plugins in het bètakanaal en `postUpdate.plugins.integrityDrifts` wanneer tijdens de synchronisatie na de update afwijkingen in npm-pluginartefacten worden gedetecteerd.                         |
| `--timeout <seconds>`                            | Time-out per stap. Standaard `1800`.                                                                                                                                                                                                                                                                                                          |
| `--yes`                                          | Sla bevestigingsvragen over (bijvoorbeeld de bevestiging van een downgrade).                                                                                                                                                                                                                                                                  |
| `--acknowledge-clawhub-risk`                     | Sta toe dat de pluginsynchronisatie na de update zonder interactieve bevestiging doorgaat na vertrouwenswaarschuwingen van de ClawHub-community. Zonder deze optie worden riskante communityreleases overgeslagen en ongewijzigd gelaten wanneer OpenClaw geen bevestiging kan vragen. Officiële ClawHub-pakketten en gebundelde pluginbronnen omzeilen deze vraag. |

Er is geen vlag `--verbose`. Gebruik `--dry-run` om een voorbeeld van geplande acties te bekijken,
`--json` voor machineleesbare resultaten en `openclaw update status --json`
alleen voor kanaal/beschikbaarheid. De uitvoerigheid van de Gateway-console (`--verbose`) en
het logniveau van bestanden (`logging.level: "debug"`/`"trace"`) zijn onafhankelijke instellingen; zie
[Gateway-logboekregistratie](/nl/gateway/logging).

<Note>
In de Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn wijzigende uitvoeringen van `openclaw update` uitgeschakeld. Werk in plaats daarvan de Nix-bron of flake-invoer voor deze installatie bij; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` en `openclaw update --dry-run` blijven alleen-lezen.
</Note>

<Warning>
Downgrades vereisen bevestiging, omdat oudere versies de configuratie kunnen beschadigen.
Als de installatie sessies al naar SQLite heeft gemigreerd, herstel dan de gearchiveerde verouderde
transcriptartefacten voordat je een oudere bestandsgebaseerde versie start. Zie
[Doctor: downgraden na de SQLite-migratie van sessies](/nl/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Toon het actieve updatekanaal, de git-tag/branch/SHA (alleen broncheck-outs)
en de beschikbaarheid van updates.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Vlag                  | Standaard | Beschrijving                         |
| --------------------- | --------- | ------------------------------------ |
| `--json`              | `false` | Druk machineleesbare status-JSON af. |
| `--timeout <seconds>` | `3`     | Time-out voor controles.             |

Voor extended-stable-pakketinstallaties voert status dezelfde openbare selectie
en exacte pakketverificatie uit als een update op de voorgrond. Er kan
`ahead of extended-stable` worden gemeld wanneer de geïnstalleerde versie nieuwer is. JSON-fouten
bevatten `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` of `unsupported_git_channel`).

## `update repair`

Voer de afronding van de update opnieuw uit nadat het kernpakket al is gewijzigd, maar later
reparatiewerk niet correct is voltooid. Dit is het ondersteunde herstelpad wanneer
`openclaw update` het nieuwe kernpakket heeft geïnstalleerd, maar de pluginsynchronisatie na de kernupdate,
metadata van beheerde npm-plugins, de registervernieuwing of de Doctor-reparatie niet
tot een consistente toestand is gekomen.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Vlag                                             | Beschrijving                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Sla het updatekanaal van de kern vóór de reparatie op. Voor extended-stable richten geschikte officiële npm-plugins die kale/standaard- of `latest`-intentie volgen zich op de exacte geïnstalleerde kernversie. Extended-stable-reparatie wordt voor Git-check-outs geweigerd zonder de configuratie te wijzigen. |
| `--json`                                         | Druk machineleesbare JSON over de afronding af.                                                                                                                                                                                                                      |
| `--timeout <seconds>`                            | Time-out voor reparatiestappen. Standaard `1800`.                                                                                                                                                                                                                  |
| `--yes`                                          | Sla bevestigingsvragen over.                                                                                                                                                                                                                                         |
| `--acknowledge-clawhub-risk`                     | Hetzelfde gedrag als bij `openclaw update`.                                                                                                                                                                                                                         |
| `--no-restart`                                   | Geaccepteerd voor consistentie; reparatie start de Gateway nooit opnieuw.                                                                                                                                                                                            |

`update repair` voert `openclaw doctor --fix` uit, laadt de gerepareerde configuratie en
installatierecords opnieuw, synchroniseert bijgehouden plugins voor het actieve updatekanaal, werkt
installaties van beheerde npm-plugins bij, repareert ontbrekende geconfigureerde plugininhoud,
vernieuwt het pluginregister en schrijft consistente metadata voor installatierecords.
Er wordt geen nieuw kernpakket geïnstalleerd en de Gateway wordt niet opnieuw gestart.

## `update wizard`

Interactieve procedure om een updatekanaal te kiezen en te bevestigen of de
Gateway daarna opnieuw moet worden gestart (standaard: opnieuw starten). Als je `dev` selecteert zonder een git-
check-out, wordt aangeboden er een te maken.

| Vlag                  | Standaard | Beschrijving                       |
| --------------------- | --------- | ---------------------------------- |
| `--timeout <seconds>` | `1800`  | Time-out voor elke updatestap.     |

## Wat het doet

Door expliciet van kanaal te wisselen (`--channel ...`) blijft ook de installatiemethode
afgestemd:

- `dev` -> zorgt voor een git-check-out (standaard `~/openclaw`, of
  `$OPENCLAW_HOME/openclaw` wanneer `OPENCLAW_HOME` is ingesteld; overschrijf met
  `OPENCLAW_GIT_DIR`), werkt deze bij en installeert de globale CLI vanuit die
  check-out.
- `stable` -> installeert vanuit npm met `latest`.
- `extended-stable` -> verwerkt de openbare npm-selector `extended-stable`,
  verifieert het exact geselecteerde pakket en installeert die exacte versie. Er
  wordt niet teruggevallen op een andere selector en deze optie wordt geweigerd voor Git-check-outs.
- `beta` -> geeft de voorkeur aan npm-dist-tag `beta` en valt terug op `latest` wanneer bèta
  ontbreekt of ouder is dan de huidige stabiele release.

### Overdracht voor opnieuw starten

De automatische kernupdater van de Gateway (wanneer ingeschakeld via de configuratie) start het CLI-
updatepad buiten de actieve aanvraaghandler van de Gateway. Control-plane-
pakketbeheerderupdates via `update.run` en bewaakte updates van git-check-outs gebruiken
dezelfde overdracht aan de beheerde service, in plaats van de pakketstructuur te vervangen of
`dist/` opnieuw te bouwen binnen het actieve Gateway-proces: de Gateway start een
losgekoppeld hulpproces en sluit af, waarna dat hulpproces `openclaw update --yes --json`
buiten de processtructuur van de Gateway uitvoert. Als de overdracht niet beschikbaar is,
retourneert `update.run` een gestructureerd antwoord met de veilige shellopdracht die
handmatig moet worden uitgevoerd.

Opgeslagen extended-stable-selecties ontvangen alleen-lezen opstart- en 24-uurs
updatehints wanneer `update.checkOnStart` is ingeschakeld. Deze controles passen nooit een update toe,
starten geen overdracht, herstarten de Gateway niet, gebruiken geen stabiele vertraging/jitter en gebruiken
niet het pollinginterval van bèta. Expliciete updates op de voorgrond, kale updates op de voorgrond met
opgeslagen `update.channel: "extended-stable"`, status op aanvraag en de bijbehorende beheerde
Gateway-overdracht blijven ondersteund.

Wanneer een lokale beheerde Gateway-service is geïnstalleerd en herstarten is ingeschakeld,
stoppen updates via de pakketbeheerder en een Git-checkout de actieve service voordat
de pakketstructuur wordt vervangen of de checkout/builduitvoer wordt gewijzigd. Het updateprogramma
vernieuwt vervolgens de servicemetadata, herstart de service en verifieert de
herstartte Gateway voordat `Gateway: restarted and verified.` wordt gemeld.
Updates via de pakketbeheerder verifiëren daarnaast dat de herstartte Gateway de
verwachte pakketversie meldt; updates via een Git-checkout verifiëren na de rebuild
de status van de Gateway en de gereedheid van de service.

Updates via de pakketbeheerder blijven normaal gesproken het Node-binaire bestand gebruiken dat in de
beheerde service is vastgelegd. Als die Node de doelrelease niet kan uitvoeren, maar de huidige
CLI-Node dat wel kan en is aangetoond dat de service bij het bijgewerkte pakket hoort,
gebruikt een update met ingeschakelde herstart de huidige Node voor de voltooiing en herschrijft
de servicemetadata naar die runtime. `--no-restart` kan servicemetadata niet
herstellen, dus dezelfde runtime-mismatch stopt vóór pakketwijziging.

Op macOS verifieert de controle na de update ook dat de LaunchAgent voor
het actieve profiel is geladen/actief is en dat de geconfigureerde loopbackpoort
gezond is. Als de plist is geïnstalleerd maar launchd er geen toezicht op houdt, initialiseert OpenClaw
de LaunchAgent automatisch opnieuw en voert het de controles voor status/versie/
kanaalgereedheid opnieuw uit (een nieuwe initialisatie laadt de `RunAtLoad`-taak rechtstreeks,
zodat het herstel de nieuw gestarte Gateway niet onmiddellijk `kickstart -k`). Als
de Gateway nog steeds niet gezond wordt, sluit de opdracht af met een niet-nulstatus en
toont deze het pad naar het herstartlogboek plus instructies voor herstarten, opnieuw installeren en
het terugdraaien van het pakket.

Als herstarten niet kan worden uitgevoerd, toont de opdracht `Gateway: restart skipped (...)` of
`Gateway: restart failed: ...` met een handmatige `openclaw gateway restart`-hint.
Met `--no-restart` wordt de pakketvervanging of Git-rebuild nog steeds uitgevoerd, maar de
beheerde service wordt niet gestopt of herstart, zodat de actieve Gateway oude
code blijft gebruiken totdat je deze handmatig herstart.

### Structuur van het antwoord van het besturingsvlak

Wanneer `update.run` via het Gateway-besturingsvlak wordt uitgevoerd voor een installatie
via de pakketbeheerder of een bewaakte Git-checkout, meldt de handler het starten van de overdracht
afzonderlijk van de CLI-update die doorgaat nadat de Gateway is afgesloten:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` en
  `handoff.status: "started"`: de Gateway heeft de overdracht naar de beheerde service gemaakt
  en zijn eigen herstart gepland, zodat de losgekoppelde helper
  `openclaw update --yes --json` buiten het actieve serviceproces kan uitvoeren.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` en
  `handoff.status: "unavailable"`: OpenClaw kon geen bewakende
  servicegrens en duurzame service-identiteit vinden voor een veilige overdracht (voor
  een systemd-overdracht is bijvoorbeeld de identiteit van de `OPENCLAW_SYSTEMD_UNIT`-unit vereist,
  niet alleen omgevingsmarkeringen voor systemd-processen). Het antwoord bevat
  `handoff.command`, de shellopdracht die buiten de Gateway moet worden uitgevoerd.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: de Gateway
  probeerde de overdracht te maken, maar kon de losgekoppelde helper niet starten.

De `sentinel`-payload wordt geschreven voordat de Gateway wordt afgesloten en de CLI-
overdracht werkt dezelfde herstartsentinel bij nadat de statuscontroles na de herstart van de
beheerde service zijn voltooid. Tijdens de overdracht kan de sentinel
`stats.reason: "restart-health-pending"` bevatten zonder vervolgactie bij succes; de
herstartte Gateway controleert deze periodiek en activeert de vervolgactie pas nadat de CLI
de servicestatus heeft geverifieerd en de sentinel heeft herschreven met het uiteindelijke `ok`-resultaat.
`openclaw status` en `openclaw status --all` tonen een `Update restart`-rij
zolang die sentinel in behandeling of mislukt is, en `update.status` vernieuwt en
retourneert de nieuwste sentinel.

## Proces voor een Git-checkout

### Kanaalselectie

- `stable`: check de nieuwste niet-bèta-tag uit en voer vervolgens de build en doctor uit.
- `beta`: geef de voorkeur aan de nieuwste `-beta`-tag en val terug op de nieuwste stabiele tag
  wanneer bèta ontbreekt of ouder is.
- `dev`: check `main` uit en voer vervolgens fetch en rebase uit.
- `extended-stable`: niet ondersteund voor Git-checkouts; de checkout wordt
  niet gewijzigd.

### Updatestappen

<Steps>
  <Step title="Schone worktree verifiëren">
    Vereist dat er geen niet-vastgelegde wijzigingen zijn.
  </Step>
  <Step title="Van kanaal wisselen">
    Schakelt over naar het geselecteerde kanaal (tag of branch).
  </Step>
  <Step title="Upstream ophalen">
    Alleen voor ontwikkeling.
  </Step>
  <Step title="Voorafgaande buildcontrole (alleen ontwikkeling)">
    Voert de TypeScript-build uit in een tijdelijke worktree. Als de tip mislukt, wordt tot 10 commits teruggegaan om de nieuwste buildbare commit te vinden. Stel `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` in om tijdens deze voorafgaande controle ook lint uit te voeren; lint wordt in een beperkte seriële modus uitgevoerd, omdat hosts voor gebruikersupdates vaak kleiner zijn dan CI-runners.
  </Step>
  <Step title="Rebase uitvoeren">
    Voert een rebase uit op de geselecteerde commit (alleen ontwikkeling).
  </Step>
  <Step title="Afhankelijkheden installeren">
    Gebruikt de pakketbeheerder van de repository. Voor pnpm-checkouts initialiseert het updateprogramma `pnpm` op aanvraag (eerst via `corepack` en vervolgens met een tijdelijke `npm install pnpm@11`-terugvaloptie) in plaats van `npm run build` binnen een pnpm-workspace uit te voeren. Als het initialiseren van pnpm nog steeds mislukt, stopt het updateprogramma vroegtijdig met een pakketbeheerderspecifieke fout in plaats van `npm run build` in de checkout te proberen.
  </Step>
  <Step title="Control UI bouwen">
    Bouwt de Gateway en de Control UI.
  </Step>
  <Step title="Doctor uitvoeren">
    `openclaw doctor` wordt uitgevoerd als laatste controle voor een veilige update.
  </Step>
  <Step title="Plugins synchroniseren">
    Synchroniseert plugins met het actieve kanaal. Ontwikkeling gebruikt gebundelde plugins; stabiel en bèta gebruiken npm. Werkt bijgehouden plugininstallaties bij.
  </Step>
</Steps>

### Details van pluginsynchronisatie

Op het bètakanaal proberen bijgehouden npm- en ClawHub-plugininstallaties die de
standaard/nieuwste lijn volgen eerst een `@beta`-release van de plugin. Als de plugin geen
bètarelease heeft, valt OpenClaw terug op de vastgelegde standaard/nieuwste specificatie en
meldt het een waarschuwing. Voor npm-plugins valt OpenClaw ook terug wanneer het bètapakket
bestaat maar de installatievalidatie mislukt. Deze terugvalwaarschuwingen laten
de kernupdate niet mislukken. Exacte versies en expliciete tags worden nooit herschreven.

<Warning>
Als een exact vastgezette npm-pluginupdate wordt omgezet naar een artefact waarvan de integriteit afwijkt van de opgeslagen installatievermelding, breekt `openclaw update` die update van het pluginartefact af in plaats van het te installeren. Installeer de plugin alleen opnieuw of werk deze alleen expliciet bij nadat je hebt geverifieerd dat je het nieuwe artefact vertrouwt.
</Warning>

<Note>
Mislukkingen bij pluginsynchronisatie na de update die beperkt zijn tot een beheerde plugin en die het synchronisatiepad kan omzeilen (bijvoorbeeld een onbereikbaar npm-register voor een niet-essentiële plugin), worden als waarschuwingen gemeld nadat de kernupdate is geslaagd. Het JSON-resultaat behoudt de update-`status: "ok"` op het hoogste niveau en meldt `postUpdate.plugins.status: "warning"` met richtlijnen voor `openclaw update repair` en `openclaw plugins inspect <id> --runtime --json`. Onverwachte uitzonderingen in het updateprogramma of de synchronisatie laten het updateresultaat nog steeds mislukken. Los de installatie- of updatefout van de plugin op en voer vervolgens `openclaw update repair` opnieuw uit. Wanneer een mislukte update een beheerde plugin onbruikbaar achterlaat, schakelt OpenClaw de runtimevermelding ervan uit en stelt het actieve slots opnieuw in zonder het door de beheerder opgestelde `plugins.allow`- of `plugins.deny`-beleid te wijzigen.

Na de synchronisatiestap per plugin voert `openclaw update` een verplichte **convergentie na de kernupdate** uit voordat de Gateway wordt herstart: ontbrekende geconfigureerde pluginpayloads worden hersteld, elke _actieve_ bijgehouden installatievermelding op schijf wordt gevalideerd en er wordt statisch geverifieerd dat de bijbehorende `package.json` kan worden geparseerd (en dat elke expliciet gedeclareerde `main` bestaat). Mislukkingen tijdens deze controle en een ongeldige configuratiesnapshot retourneren `postUpdate.plugins.status: "error"` en wijzigen de update-`status` op het hoogste niveau in `"error"`, zodat `openclaw update` afsluit met een niet-nulstatus en de Gateway _niet_ wordt herstart met een niet-geverifieerde verzameling plugins. De fout bevat gestructureerde `postUpdate.plugins.warnings[].guidance`-regels die verwijzen naar `openclaw update repair` en `openclaw plugins inspect <id> --runtime --json`. Uitgeschakelde pluginvermeldingen en vermeldingen die geen aan een vertrouwde bron gekoppelde officiële synchronisatiedoelen zijn, worden hier overgeslagen (overeenkomstig het `skipDisabledPlugins`-beleid dat door de controle op ontbrekende payloads wordt gebruikt), zodat een verouderde vermelding van een uitgeschakelde plugin een verder geldige update niet kan blokkeren.

Wanneer de bijgewerkte Gateway start, is het laden van plugins uitsluitend ter verificatie: tijdens het opstarten worden geen pakketbeheerders uitgevoerd en worden afhankelijkheidsstructuren niet gewijzigd. Herstarts van `update.run` via de pakketbeheerder worden overgedragen aan het CLI-pad voor beheerde services, zodat de pakketwissel buiten het oude Gateway-proces plaatsvindt en de servicestatuscontroles bepalen of de update als voltooid kan worden gemeld.
</Note>

Nadat een extended-stable-kernupdate is geslaagd, richten de integriteits- en
convergentiecontroles voor plugins na de kernupdate zich op in aanmerking komende officiële npm-plugins met exact de
geïnstalleerde kernversie. Voor standaard/`latest`-intentie vraagt OpenClaw geen plugin-
`@extended-stable` op en valt het niet terug op npm-`latest`; de pakketversie wordt
afgeleid van de geïnstalleerde kern. Expliciete versie-pins, expliciete niet-`latest`-tags,
pakketten van derden en niet-npm-bronnen behouden hun bestaande intentie.

Voor installaties via de pakketbeheerder zet `openclaw update` de doelpakketversie om
voordat de pakketbeheerder wordt aangeroepen. Globale npm-installaties gebruiken een gefaseerde
installatie: OpenClaw installeert het nieuwe pakket in een tijdelijk npm-prefix,
laat het kandidaatpakket tijdens `preinstall` de Node-versie van de host valideren
en verifieert daar de verpakte `dist`-inventaris. Een verpakte voltooiingsbeveiliging
blijft buiten die inventaris totdat `preinstall` slaagt, zodat pakketbeheerders
die levenscyclusscripts overslaan ook vóór activering stoppen. Op npm 12 en nieuwer
keurt het updateprogramma alleen de levenscyclus van de kandidaat-OpenClaw goed; scripts van
transitieve afhankelijkheden blijven geblokkeerd. OpenClaw wisselt vervolgens de schone pakketstructuur
naar het werkelijke globale prefix. Als de verificatie mislukt, worden doctor na de update, plugin-
synchronisatie en herstartwerkzaamheden niet vanuit de verdachte structuur uitgevoerd. Zelfs wanneer de
geïnstalleerde versie al overeenkomt met het doel, vernieuwt de opdracht de
globale pakketinstallatie en voert vervolgens pluginsynchronisatie, het vernieuwen van voltooiingen voor kernopdrachten
en herstartwerkzaamheden uit. Hierdoor blijven verpakte sidecars en kanaalgebonden
pluginvermeldingen afgestemd op de geïnstalleerde OpenClaw-build, terwijl volledige
herbouwacties voor voltooiingen van pluginopdrachten worden overgelaten aan expliciete
uitvoeringen van `openclaw completion --write-state`.

## Gerelateerd

- `openclaw doctor` (biedt aan om bij Git-checkouts eerst de update uit te voeren)
- [Ontwikkelingskanalen](/nl/install/development-channels)
- [Bijwerken](/nl/install/updating)
- [CLI-referentie](/nl/cli)
