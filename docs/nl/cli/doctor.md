---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt een update uitgevoerd en wilt een snelle controle.
summary: CLI-referentie voor `openclaw doctor` (statuscontroles + begeleide reparaties)
title: Dokter
x-i18n:
    generated_at: "2026-07-16T15:19:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gezondheidscontroles en snelle oplossingen voor de Gateway, kanalen, plugins, Skills, modelroutering, lokale status en configuratiemigraties. Gebruik dit wanneer iets niet werkt zoals verwacht en je met één opdracht wilt laten uitleggen wat er mis is.

Gerelateerd:

- Probleemoplossing: [Probleemoplossing](/nl/gateway/troubleshooting)
- Beveiligingsaudit: [Beveiliging](/nl/gateway/security)

## Modi

Doctor heeft vijf modi:

| Modus                     | Opdracht                                  | Gedrag                                                                                         |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Inspectie                 | `openclaw doctor`                         | Controles voor mensen en begeleide prompts.                                                    |
| Reparatie                 | `openclaw doctor --fix`                   | Voert ondersteunde reparaties uit en gebruikt prompts, tenzij niet-interactieve reparatie veilig is. |
| Lint                      | `openclaw doctor --lint`                  | Alleen-lezen, gestructureerde bevindingen voor CI, voorafgaande controles en beoordelingspoorten. |
| Gedeeld SQLite-onderhoud  | `openclaw doctor --state-sqlite compact`  | Maakt expliciet een checkpoint, compacteert en verifieert de canonieke gedeelde statusdatabase. |
| SQLite-sessiemigratie     | `openclaw doctor --session-sqlite <mode>` | Inspecteert, importeert, valideert, compacteert, herstelt of zet sessiestatus terug.           |

Geef de voorkeur aan `--lint` wanneer automatisering een stabiel resultaat nodig heeft. Geef de voorkeur aan `--fix` wanneer een menselijke beheerder wil dat doctor de configuratie of status bewerkt.

## Voorbeelden

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Gebruik voor kanaalspecifieke machtigingen de kanaalprobes in plaats van `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` rapporteert de effectieve machtigingen van de bot voor een specifiek kanaaldoel. `channels status --probe` controleert alle geconfigureerde kanalen en doelen voor automatisch deelnemen aan spraak.

## Opties

| Optie                           | Effect                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | Schakel suggesties voor werkruimtegeheugen en zoeken uit.                                                                                                                               |
| `--yes`                         | Accepteer standaardwaarden zonder prompts.                                                                                                                                              |
| `--repair` / `--fix`            | Voer aanbevolen reparaties buiten services uit zonder prompts (`--fix` is een alias). Installaties of herschrijvingen van de Gateway-service vereisen nog steeds interactieve bevestiging of expliciete `gateway`-opdrachten. |
| `--force`                       | Voer ingrijpende reparaties uit, inclusief het overschrijven van aangepaste serviceconfiguratie.                                                                                        |
| `--non-interactive`             | Voer uit zonder prompts; alleen veilige migraties en reparaties buiten services.                                                                                                        |
| `--generate-gateway-token`      | Genereer en configureer een Gateway-token.                                                                                                                                              |
| `--allow-exec`                  | Sta doctor toe geconfigureerde `exec` SecretRefs uit te voeren tijdens het verifiëren van geheimen.                                                                                   |
| `--deep`                        | Scan systeemservices op extra Gateway-installaties; rapporteer recente overdrachten bij herstarts door de Gateway-supervisor.                                                           |
| `--lint`                        | Voer gemoderniseerde gezondheidscontroles uit in alleen-lezenmodus en geef diagnostische bevindingen weer.                                                                              |
| `--post-upgrade`                | Voer compatibiliteitsprobes voor plugins na upgrades uit; bevindingen gaan naar stdout; afsluitcode 1 als er een bevinding op foutniveau aanwezig is.                                    |
| `--state-sqlite <mode>`         | Voer expliciet gedeeld SQLite-statusonderhoud uit. De enige modus is `compact`.                                                                                                         |
| `--session-sqlite <mode>`       | Voer de gerichte SQLite-sessiemigratiemodus uit: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` of `restore`.                                                         |
| `--session-sqlite-store <path>` | Met `--session-sqlite`: selecteer één pad naar een verouderde `sessions.json`-opslag.                                                                                                   |
| `--session-sqlite-agent <id>`   | Met `--session-sqlite`: selecteer één geconfigureerde agent.                                                                                                                             |
| `--session-sqlite-all-agents`   | Met `--session-sqlite`: selecteer geconfigureerde en ontdekte agentopslaglocaties.                                                                                                       |
| `--github-issue`                | Met `--session-sqlite recover`: bereid een opgeschoond probleemrapport voor openclaw/openclaw voor; doctor maakt het aan met `gh` na `--yes` of interactieve bevestiging.           |
| `--json`                        | Met `--lint`: JSON-bevindingen. Met `--post-upgrade`: `{ probesRun, findings }`. Met `--state-sqlite` of `--session-sqlite`: het onderhoudsrapport als JSON.                            |
| `--severity-min <level>`        | Met `--lint`: laat bevindingen onder `info`, `warning` of `error` weg.                                                                                              |
| `--all`                         | Met `--lint`: voer alle geregistreerde controles uit, inclusief optionele controles die van de standaardset zijn uitgesloten.                                                        |
| `--skip <id>`                   | Met `--lint`: sla een controle-id over. Herhaalbaar.                                                                                                                                    |
| `--only <id>`                   | Met `--lint`: voer alleen de opgegeven controle-id('s) uit. Herhaalbaar.                                                                                                               |

`--severity-min`, `--all`, `--only` en `--skip` worden alleen samen met `--lint` geaccepteerd; `--json` wordt geaccepteerd met `--lint`, `--post-upgrade`, `--state-sqlite` en `--session-sqlite`.

## Lintmodus

`openclaw doctor --lint` is alleen-lezen: geen prompts, geen reparatie en geen herschrijvingen van configuratie of status.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

De leesbare uitvoer is compact:

```text
doctor --lint: 6 controle(s) uitgevoerd, 1 bevinding(en)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is niet ingesteld; het starten van de Gateway wordt geblokkeerd.
    oplossing: Voer `openclaw configure` uit en stel de Gateway-modus in (lokaal/extern), of voer `openclaw config set gateway.mode local` uit.
```

JSON-uitvoer is de interface voor scripts:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is niet ingesteld; het starten van de Gateway wordt geblokkeerd.",
      "path": "gateway.mode",
      "fixHint": "Voer `openclaw configure` uit en stel de Gateway-modus in (lokaal/extern), of voer `openclaw config set gateway.mode local` uit."
    }
  ]
}
```

Afsluitcodes:

| Code | Betekenis                                                              |
| ---- | ---------------------------------------------------------------------- |
| `0`  | Geen bevindingen op of boven de geselecteerde ernstgrens.               |
| `1`  | Ten minste één bevinding voldoet aan de geselecteerde grens.            |
| `2`  | Opdracht- of runtimefout voordat lintbevindingen kunnen worden gemaakt. |

`--severity-min` bepaalt zowel welke bevindingen worden weergegeven als de afsluitgrens: `openclaw doctor --lint --severity-min error` kan niets weergeven en afsluiten met `0`, zelfs wanneer er bevindingen met een lagere ernst van `info`/`warning` bestaan.

`--all` bepaalt welke controles vóór de ernstfiltering worden geselecteerd. De standaard-lintuitvoering sluit controles uit die diepgaand of historisch zijn, of die waarschijnlijker herstelbare verouderde restanten aan het licht brengen; gebruik `--all` voor de volledige inventaris. `--only <id>` is de nauwkeurigste selector en kan elke geregistreerde controle op id uitvoeren.

`core/doctor/local-audio-acceleration` rapporteert de automatisch geselecteerde lokale STT-opdracht, afzonderlijk bewijs voor beschikbare/aangevraagde/waargenomen backends en de terugvalvolgorde, zonder een spraakmodel te laden. Deze geeft een informatieve bevinding, dus neem `--severity-min info` op om deze weer te geven.

## Gestructureerde gezondheidscontroles

Moderne doctor-controles gebruiken een klein opgesplitst contract:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` stuurt `doctor --lint` aan. `repair()` is optioneel en wordt alleen uitgevoerd onder `doctor --fix` / `doctor --repair`. Controles die nog niet naar deze vorm zijn gemigreerd, gebruiken nog steeds de verouderde bijdragestroom van doctor.

Reparatiecontexten kunnen `dryRun`/`diff`-verzoeken bevatten; reparatieresultaten kunnen gestructureerde `diffs` (bewerkingen van configuratie/bestanden) en `effects` (neveneffecten voor services, processen, pakketten, status of andere zaken) retourneren, zodat geconverteerde controles naar `doctor --fix --dry-run` kunnen doorgroeien zonder mutatieplanning naar `detect()` te verplaatsen.

`repair()` rapporteert `status: "repaired" | "skipped" | "failed"` (een weggelaten status betekent `repaired`). Wanneer herstel `skipped` of `failed` retourneert, rapporteert doctor de reden en slaat het de validatie voor die controle over. Na een geslaagd herstel voert doctor `detect()` opnieuw uit, beperkt tot de herstelde bevindingen; als de bevinding nog steeds aanwezig is, rapporteert doctor een herstelwaarschuwing in plaats van de wijziging als voltooid te beschouwen.

Een bevinding bevat:

| Veld              | Doel                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Stabiele id voor skip/only-filters en CI-toelatingslijsten. |
| `severity`        | `info`, `warning` of `error`.                          |
| `message`         | Voor mensen leesbare probleembeschrijving.             |
| `path`            | Configuratie-, bestands- of logisch pad, indien beschikbaar. |
| `line` / `column` | Bronlocatie, indien beschikbaar.                       |
| `ocPath`          | Nauwkeurig `oc://`-adres wanneer een controle er een kan aanwijzen. |
| `fixHint`         | Voorgestelde actie voor de beheerder of samenvatting van het herstel. |

Gemoderniseerde doctor-controles in de kern blijven gekoppeld aan de geordende doctor-bijdrage die eigenaar is van hun menselijke `doctor`-/`doctor --fix`-gedrag. Het gedeelde register voor gestructureerde statuscontroles is het uitbreidingspunt: gebundelde en door plugins ondersteunde controles worden na de doctor-controles van de kern uitgevoerd zodra hun pakket ze in het actieve opdrachtpad registreert. `openclaw/plugin-sdk/health` stelt hetzelfde contract beschikbaar aan auteurs van plugins.

## Controles selecteren

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` en `--skip` accepteren volledige controle-id's en mogen worden herhaald. Als een `--only`-id niet is geregistreerd, wordt voor die id geen controle uitgevoerd; gebruik `checksRun`/`checksSkipped` in de uitvoer om te bevestigen dat een gerichte poort de verwachte controles selecteert.

## Modus na upgrade

`openclaw doctor --post-upgrade` voert compatibiliteitscontroles voor plugins uit om na een build of upgrade te koppelen. Bevindingen gaan naar stdout; de afsluitcode is 1 als een bevinding `level: "error"` heeft. Voeg `--json` toe voor een machineleesbare envelop (`{ probesRun, findings }`), geschikt voor CI, de `fork-upgrade`-skill van de community en andere rooktesttools voor na upgrades. Als de index met geïnstalleerde plugins ontbreekt of ongeldig is, geeft de JSON-modus nog steeds de envelop uit met een `plugin.index_unavailable`-foutbevinding.

Het starten van de containerimage vormt een uitzondering op de gebruikelijke stroom 'doctor uitvoeren na
bijwerken'. Wanneer `openclaw gateway run` met een nieuwe OpenClaw-versie start, voert het
veilige reparaties van status en plugins uit voordat het meldt gereed te zijn. Als het herstel niet
veilig kan worden voltooid, wordt het opstarten beëindigd en krijg je de instructie om dezelfde image eenmaal uit te voeren met
`openclaw doctor --fix` voor dezelfde gekoppelde status/configuratie voordat je
de container normaal opnieuw start.

## Compaction van SQLite voor gedeelde status

`openclaw doctor --state-sqlite compact` is expliciet offlineonderhoud voor
de canonieke database voor gedeelde status op
`<state-dir>/state/openclaw.sqlite`. Het accepteert geen willekeurig databasepad,
wordt nooit aangeroepen door normale Gateway-werking en maakt geen deel uit van
`openclaw doctor --fix`. De opdracht verkrijgt dezelfde eigendomsvergrendeling voor de status als
bij het starten van de Gateway en houdt deze vast tijdens validatie, checkpointing, `VACUUM` en
de laatste integriteitscontroles. De opdracht weigert te worden uitgevoerd zolang een Gateway of een andere
SQLite-onderhoudsopdracht die vergrendeling bezit. De statusvergrendeling blijft actief wanneer
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` de Gateway-singleton per configuratie overslaat, zodat een
beheerdersshell de omgeving van de Gateway-service niet hoeft te erven om
deze tijdens onderhoud te detecteren.

Stop eerst de Gateway en maak een geverifieerde back-up:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

De opdracht:

1. Vereist een regulier bestand op het canonieke pad voor gedeelde status. Een ontbrekende
   database wordt gerapporteerd als `skipped` en wordt met succes afgesloten.
2. Valideert de huidige ondersteunde schemaversie en
   `schema_meta.role = "global"` voordat een checkpoint wordt gemaakt of het bestand wordt gewijzigd.
3. Vereist een niet-bezette `wal_checkpoint(TRUNCATE)`. Stop elk resterend OpenClaw-
   proces en probeer het opnieuw als het checkpoint bezet is.
4. Stelt `auto_vacuum` in op `INCREMENTAL`, voert een volledige `VACUUM` uit en maakt
   opnieuw een checkpoint.
5. Voert `quick_check`, `integrity_check` en `foreign_key_check` uit en
   past daarna opnieuw alleen-eigenaarmachtigingen toe op de database en SQLite-sidecarbestanden.

JSON-uitvoer rapporteert de grootte van de database en WAL, freelist-pagina's, paginagrootte en
de waarde van `auto_vacuum` vóór en na Compaction, plus de vrijgemaakte bytes en de
resultaten van `quick_check` en `integrity_check`. `foreign_key_check` wordt
fail-closed afgedwongen en heeft geen afzonderlijk succesveld. SQLite rapporteert `auto_vacuum` als
`0` voor geen, `1` voor volledig en `2` voor incrementeel.

Compaction mislukt zonder wijzigingen wanneer het schema oud is, nieuwer is dan de
actieve OpenClaw-build of bij een agentdatabase hoort. Voer voor een ouder schema voor gedeelde status
eerst `openclaw doctor --fix` uit. Herstel een
compatibele back-up of upgrade OpenClaw voor een nieuwer schema.

## SQLite-migratie van sessies

OpenClaw importeert verouderde sessierijen en transcriptgeschiedenis automatisch in de
SQLite-database van elke agent tijdens het starten van de Gateway en tijdens
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` is het
gerichte inspectie- en validatiehulpmiddel voor die migratie. Actuele
sessierijen tijdens runtime staan in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Verouderde
`sessions.json`-bestanden zijn migratiebronnen. Actieve JSONL-transcriptbestanden worden
geïmporteerd en na een geslaagde import buiten de map met actieve sessies
gearchiveerd; JSONL-bestanden in de archieflaag blijven ondersteuningsartefacten, geen
runtimefallbacks.

Modi:

| Modus      | Gedrag                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Leest aantallen voor verouderde gegevens en SQLite, plus niet-gerefereerde JSONL-bestanden, zonder te importeren.      |
| `dry-run`  | Parseert verouderde vermeldingen en JSONL-transcriptbestanden, telt importeerbare rijen en rapporteert problemen zonder SQLite-rijen te schrijven. |
| `import`   | Importeert verouderde vermeldingen en transcriptgebeurtenissen in SQLite voor de geselecteerde doelen.                |
| `validate` | Vergelijkt de geselecteerde verouderde bronnen met SQLite-rijen en aantallen transcriptgebeurtenissen.                 |
| `compact`  | Maakt checkpoints en voert VACUUM uit op geselecteerde SQLite-databases van agents om vrije pagina's terug te winnen na grote verwijderingen of opschoning van het archief. |
| `recover`  | Herstelt de recentste mislukte migratie-uitvoering, valideert de doelen daarvan en bereidt een opgeschoond GitHub-issuereport voor. |
| `restore`  | Herstelt gearchiveerde transcriptartefacten vanuit vastgelegde migratiemanifesten zonder SQLite-gegevens te verwijderen. |

Selectoren:

- Standaard: de geconfigureerde standaardopslag van de agent, wanneer dat verouderde opslagbestand bestaat.
- `--session-sqlite-agent <id>`: één geconfigureerde agent.
- `--session-sqlite-all-agents`: geconfigureerde agentopslaglocaties plus ontdekte agentopslaglocaties.
- `--session-sqlite-store <path>`: één expliciet verouderd `sessions.json`-pad.

Handmatige inspectievolgorde:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Maak een back-up van de OpenClaw-statusmap voordat je `import` uitvoert op een installatie met
belangrijke geschiedenis. `validate` wordt afgesloten met een niet-nulcode wanneer een geselecteerde verouderde vermelding
ontbreekt in SQLite, een sessie-id afwijkt of het aantal transcriptgebeurtenissen afwijkt.
Controleer bij gebruik van `--session-sqlite-store <path>` of het rapport het
verwachte aantal doelen bevat; een niet-bestaand expliciet opslagpad selecteert geen doelen.

Bij verwijderingen in SQLite worden eerst pagina's binnen de database teruggewonnen; hierdoor
wordt het databasebestand niet noodzakelijk onmiddellijk kleiner. Voer na het verwijderen of archiveren van grote
transcripten `openclaw doctor --session-sqlite compact --session-sqlite-all-agents` uit
om checkpoints voor WAL-bestanden te maken, `VACUUM` uit te voeren en de grootte van de database en WAL
vóór en na afloop te rapporteren. Compaction vereist een regulier bestand met het huidige agentschema, de
duurzame eigenaarsmetadata van de geselecteerde agent en geen open ingang in het doctor-
proces. De destructieve modi `import`, `compact`, `recover` en `restore`
houden tijdens hun volledige werking dezelfde eigendomsvergrendeling voor de status vast als bij het starten van de Gateway;
`inspect`, `dry-run` en `validate` blijven alleen-lezen en verkrijgen deze niet. Stop
eerst de Gateway. Destructieve modi mislukken in plaats van te concurreren met live schrijfbewerkingen of
een andere onderhoudsopdracht. Een destructief `--session-sqlite-store`-
doel moet zich binnen de actieve statusmap bevinden; stel `OPENCLAW_STATE_DIR` in op
de statusmap die eigenaar is van de opslag voordat je een andere installatie onderhoudt.
Bestaande doelen met harde koppelingen worden geweigerd, omdat een ander pad dezelfde
database-inode buiten de vergrendelde statusmap kan delen. Dezelfde eigendomscontroles
gelden voor SQLite-sidecars voor WAL, gedeeld geheugen en terugdraaijournalen.

Elke import schrijft een manifest onder
`~/.openclaw/session-sqlite-migration-runs/` voordat transcriptartefacten
naar het archief worden verplaatst. Als bij het starten een mislukte SQLite-migratie van sessies wordt gemeld nadat
artefacten zijn verplaatst, voer dan herstel uit:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Herstel selecteert het recentste manifest van een mislukte migratie, herstelt alleen de
gearchiveerde artefacten van het manifest, valideert de betrokken doelen, vernieuwt de
opgeschoonde rapporten `.failure.md` en `.failure.json` en bereidt een GitHub-issue-
tekst voor zonder transcriptinhoud, onbewerkte omgeving, geheimen en onbegrensde
configuratie. Wanneer er geen manifest van een mislukte migratie bestaat, maar een geselecteerde SQLite-
database van een agent beschadigd is, geen database is of journalsidecars zonder een hoofd-
database heeft, kopieert herstel de volledige bestandenset naar een tijdelijke inspectie-
map. SQLite kan een geldig actief journal in die wegwerpkopie terugdraaien
voordat `quick_check`, `integrity_check` en `foreign_key_check` worden uitgevoerd, terwijl de
oorspronkelijke forensische bestanden onaangeroerd blijven. Mislukte integriteitscontroles of verweesde
sidecars behouden de DB-, WAL-, SHM- en terugdraaijournaalbestanden door de
volledige ontdekte set te hernoemen met één `.corrupt-<timestamp>`-achtervoegsel. Bij een opgevangen fout tijdens het hernoemen
worden reeds verplaatste bestanden teruggezet voordat de fout wordt gerapporteerd, zodat een
herstelbare bestandenset niet ongemerkt wordt opgesplitst. Stop de Gateway vóór herstel;
het kopiëren of hernoemen van een actief wijzigende SQLite-bestandenset is onveilig en gedraagt zich
verschillend per besturingssysteem. Met `--github-issue --yes` gebruikt doctor
de GitHub CLI om het issue in `openclaw/openclaw` aan te maken; zonder bevestiging
schrijft het het lokale ondersteuningsrapport en drukt het een vooraf ingevulde issue-URL af.

`restore` blijft de onderliggende ongedaanmaakbewerking. Deze gebruikt de
`sourcePath -> archivePath`-records uit het manifest, verplaatst gearchiveerde artefacten alleen terug wanneer het
oorspronkelijke pad ontbreekt, rapporteert conflicten wanneer beide paden bestaan en laat
de SQLite-database staan.

### Downgraden na SQLite-migratie van sessies

Herstel de gearchiveerde verouderde transcriptartefacten voordat je een oudere bestandsgebaseerde
OpenClaw-versie start:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Oudere versies lezen `sessions.json`-vermeldingen en de `sessionFile`-paden die
in die vermeldingen zijn vastgelegd. Na de SQLite-migratie worden bij geslaagde imports actieve JSONL-
transcripten naar `session-sqlite-import-archive/` verplaatst, waardoor de oudere runtime
die geschiedenis pas kan zien nadat herstel de in het manifest vastgelegde artefacten naar
hun oorspronkelijke paden heeft teruggezet.

Herstel verwijdert geen SQLite-gegevens. Sessies die na de overstap naar SQLite zijn gemaakt,
bestaan alleen in SQLite en verschijnen niet in de oudere runtime. Als je later
opnieuw een upgrade uitvoert, voer dan de normale bovenstaande migratievalidatiereeks uit, zodat OpenClaw
de herstelde verouderde artefacten met de SQLite-rijen kan vergelijken voordat ze worden geïmporteerd.

## Opmerkingen

- In Nix-modus (`OPENCLAW_NIX_MODE=1`) werken alleen-lezencontroles van doctor nog steeds, maar `doctor --fix`, `doctor --repair`, `doctor --yes` en `doctor --generate-gateway-token` zijn uitgeschakeld omdat `openclaw.json` onveranderlijk is. Bewerk in plaats daarvan de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agentgerichte [snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interactieve prompts (oplossingen voor sleutelhanger/OAuth enzovoort) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless-uitvoeringen (cron, Telegram, geen terminal) slaan prompts over.
- Niet-interactieve `doctor`-uitvoeringen slaan het vroegtijdig laden van plugins over, zodat headless-statuscontroles snel blijven. Interactieve sessies laden nog steeds de pluginoppervlakken die nodig zijn voor de verouderde status-/herstelstroom.
- `--lint` is strenger dan `--non-interactive`: altijd alleen-lezen, toont nooit prompts en past nooit veilige migraties toe. Gebruik `doctor --fix` of `doctor --repair` als doctor wijzigingen moet aanbrengen.
- Doctor voert standaard geen `exec`-SecretRefs uit tijdens het controleren van geheimen. Gebruik `--allow-exec` (met of zonder `--lint`) alleen wanneer je bewust wilt dat doctor die geconfigureerde geheimoplossers uitvoert.
- Elke configuratieschrijfactie (inclusief een `--fix`-herstel) roteert een back-up naar `~/.openclaw/openclaw.json.bak` (met een genummerde `.bak.1`..`.bak.4`-reeks). `--fix` verwijdert ook onbekende configuratiesleutels die door schemavalidatie zijn gemeld en vermeldt elke verwijdering; tijdens een update wordt dit overgeslagen, zodat een gedeeltelijk geschreven upgradestatus niet wordt verwijderd voordat de migratie is voltooid.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de levenscyclus van de Gateway beheert. Doctor rapporteert nog steeds de status van de Gateway/service en past herstelbewerkingen buiten de service toe, maar slaat installatie/start/herstart/bootstrap van de service en opschoning van de verouderde service over.
- Op Linux negeert doctor inactieve extra systemd-eenheden die op een Gateway lijken en herschrijft tijdens herstel geen opdracht-/entrypointmetadata voor een actieve systemd-Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` om het actieve startprogramma te vervangen.
- `doctor --fix --non-interactive` meldt ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft deze niet buiten de updateherstelmodus. Voer `openclaw gateway install` uit voor een ontbrekende service of `openclaw gateway install --force` om het startprogramma te vervangen.
- Statusintegriteitscontroles detecteren verweesde transcriptbestanden in de sessiemap. Voor archivering als `.deleted.<timestamp>` is interactieve bevestiging vereist; `--fix`, `--yes` en headless-uitvoeringen laten ze staan.
- Doctor scant `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde vormen van cron-taken en herschrijft deze voordat canonieke rijen in SQLite worden geïmporteerd.
- Doctor meldt cron-taken met een expliciete `payload.model`-overschrijving, inclusief aantallen per providernamespace en afwijkingen van `agents.defaults.model`, zodat geplande taken die het standaardmodel niet overnemen zichtbaar zijn tijdens onderzoeken naar authenticatie of facturering.
- Doctor meldt cron-taken die nog als actief (`state.runningAtMs`) zijn gemarkeerd, waardoor `openclaw cron list` ze als `running` kan weergeven. Deze controle is alleen-lezen: als momenteel geen Gateway een gemarkeerde taak uitvoert, registreert de cron-service bij de volgende start de onderbroken uitvoering en wist de markering.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds de niet-onderhouden verouderde `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert, die `Gateway inactive` onjuist kan rapporteren wanneer cron de systemd-gebruikersbusomgeving niet heeft.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een verslechterde Gateway-gebeurtenislus terwijl lokale `openclaw-tui`-clients nog actief zijn. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients, zodat WhatsApp-antwoorden niet achter verouderde TUI-verversingslussen in de wachtrij komen.
- Doctor herschrijft verouderde `codex/*`- en `openai-codex/*`-modelverwijzingen naar canonieke `openai/*`-verwijzingen voor primaire modellen, terugvalmodellen, toegestane modellen, modellen voor het genereren van afbeeldingen/video's, overschrijvingen voor Heartbeat/subagent/Compaction, hooks, kanaalmodeloverschrijvingen, cron-payloads en verouderde routevastleggingen voor sessies/transcripten. `--fix` voegt ook verouderde `models.providers.codex`- en `models.providers.openai-codex`-configuratie samen wanneer dat veilig is, migreert verouderde `openai-codex:*`-authenticatieprofielen en `auth.order.openai-codex`-vermeldingen naar `openai:*`, verplaatst Codex-intentie naar provider-/modelgebonden `agentRuntime.id: "codex"`-vermeldingen, verwijdert verouderde runtimevastleggingen voor volledige agents/sessies en houdt herstelde OpenAI-agentverwijzingen op Codex-authenticatieroutering in plaats van rechtstreekse authenticatie met een OpenAI-API-sleutel.
- Doctor meldt niet-lege `auth.order.<provider>`-lijsten waarvan alle genoemde profielen verdwenen zijn terwijl compatibele opgeslagen referenties beschikbaar zijn. `doctor --fix` verwijdert alleen die verouderde overschrijvingen en herstelt zo de automatische selectie van referenties per agent; expliciete lege volgordes, gedeeltelijk actieve lijsten en volgordes zonder compatibele opgeslagen referentie blijven ongewijzigd. Als een actieve SQLite-authenticatieopslag onleesbaar of ongeldig is, legt doctor uit waarom dit herstel is overgeslagen. Herstart een actieve Gateway voordat je de authenticatiestatus opnieuw controleert als de configuratieherlaadmodus de schrijfactie niet automatisch toepast.
- Doctor ruimt de verouderde stagingstatus van plugin-afhankelijkheden uit oudere OpenClaw-versies op en koppelt het `openclaw`-pakket van de host opnieuw voor beheerde npm-plugins die het als peer-afhankelijkheid declareren. Ook herstelt het ontbrekende downloadbare plugins waarnaar de configuratie verwijst (`plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen, geconfigureerde agentruntimes). Tijdens pakketupdates slaat doctor plugin-herstel via de pakketbeheerder over totdat de pakketwissel is voltooid; voer daarna `openclaw doctor --fix` opnieuw uit als een geconfigureerde plugin nog moet worden hersteld. Als een download mislukt, meldt doctor de installatiefout en bewaart het de geconfigureerde pluginvermelding voor de volgende herstelpoging.
- Doctor herstelt verouderde pluginconfiguratie door ontbrekende plugin-id's uit `plugins.allow`/`plugins.deny`/`plugins.entries` te verwijderen, samen met overeenkomende verweesde kanaalconfiguratie, Heartbeat-doelen en kanaalmodeloverschrijvingen, wanneer plugin-detectie correct werkt.
- Doctor plaatst ongeldige pluginconfiguratie in quarantaine door de betreffende `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Bij het starten slaat de Gateway alleen die defecte plugin al over, zodat andere plugins en kanalen actief blijven.
- Doctor verwijdert de buiten gebruik gestelde `plugins.entries.codex.config.codexDynamicToolsProfile`; de Codex-appserver houdt Codex-eigen werkruimtetools altijd native.
- Doctor migreert verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante configuratie) automatisch naar `talk.provider` + `talk.providers.<provider>`. Herhaalde `doctor --fix`-uitvoeringen melden/passen Talk-normalisatie niet langer toe wanneer alleen de volgorde van objectsleutels verschilt.
- Doctor bevat een gereedheidscontrole voor geheugenzoekopdrachten en kan `openclaw configure --section model` aanbevelen wanneer referenties voor embeddings ontbreken.
- Doctor waarschuwt wanneer geen opdrachteigenaar is geconfigureerd. De opdrachteigenaar is het account van de menselijke operator dat opdrachten voor uitsluitend de eigenaar mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling staat alleen toe dat iemand met de bot praat; als je een afzender hebt goedgekeurd voordat de bootstrap voor de eerste eigenaar bestond, stel dan expliciet `commands.ownerAllowFrom` in.
- Doctor toont een informatieve melding wanneer agents in Codex-modus zijn geconfigureerd en persoonlijke Codex CLI-assets aanwezig zijn in de Codex-hoofdmap van de operator. Lokale Codex-appserverstarts gebruiken geïsoleerde hoofdmappen per agent; installeer indien nodig eerst de Codex-plugin en gebruik vervolgens `openclaw migrate plan codex` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtimeomgeving (ontbrekende binaire bestanden, omgevingsvariabelen, configuratie of besturingssysteemvereisten). `doctor --fix` kan die niet-beschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste als je de Skill actief wilt houden.
- Als de sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, meldt doctor een duidelijke waarschuwing met hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als verouderde sandboxregisterbestanden of shardmappen aanwezig zijn (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` of `~/.openclaw/sandbox/browsers/`), meldt doctor deze; `--fix` migreert geldige vermeldingen naar SQLite en plaatst ongeldige verouderde bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, meldt doctor een alleen-lezenwaarschuwing en schrijft het geen terugvalreferenties in platte tekst. Voor door exec ondersteunde SecretRefs slaat doctor de uitvoering over tenzij `--allow-exec` aanwezig is.
- Als inspectie van kanaal-SecretRefs in een herstelpad mislukt, gaat doctor door en meldt het een waarschuwing in plaats van voortijdig af te sluiten.
- Na migraties van statusmappen waarschuwt doctor wanneer ingeschakelde standaardaccounts voor Telegram of Discord afhankelijk zijn van een omgevingsfallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Voor automatische omzetting van Telegram-gebruikersnamen voor `allowFrom` (`doctor --fix`) is een omzetbaar Telegram-token in het huidige opdrachtpad vereist. Als tokeninspectie niet beschikbaar is, meldt doctor een waarschuwing en slaat het automatische omzetting voor die uitvoering over.

## macOS: `launchctl`-omgevingsoverschrijvingen

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende fouten met "niet geautoriseerd" veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
