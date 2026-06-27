---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een controle op gezond verstand
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide reparaties)
title: Dokter
x-i18n:
    generated_at: "2026-06-27T17:19:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gezondheidscontroles + snelle oplossingen voor de Gateway en kanalen.

Gerelateerd:

- Probleemoplossing: [Probleemoplossing](/nl/gateway/troubleshooting)
- Beveiligingsaudit: [Beveiliging](/nl/gateway/security)

## Waarom Gebruiken

`openclaw doctor` is het gezondheidsoppervlak van OpenClaw. Gebruik het wanneer de Gateway,
kanalen, plugins, Skills, modelroutering, lokale status of configuratiemigraties zich
niet gedragen zoals verwacht en je één opdracht wilt die kan uitleggen wat er
mis is.

Doctor heeft drie modi:

| Modus        | Opdracht                 | Gedrag                                                                               |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------ |
| Inspecteren  | `openclaw doctor`        | Mensgerichte controles en begeleide prompts.                                         |
| Repareren    | `openclaw doctor --fix`  | Past ondersteunde reparaties toe, met prompts tenzij niet-interactieve reparatie veilig is. |
| Lint         | `openclaw doctor --lint` | Alleen-lezen gestructureerde bevindingen voor CI, preflight en review-gates.          |

Geef de voorkeur aan `--lint` wanneer automatisering een stabiel resultaat nodig heeft. Geef de voorkeur aan `--fix` wanneer een
menselijke operator bewust wil dat doctor config of status bewerkt.

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
```

Gebruik voor kanaalspecifieke machtigingen de kanaalprobes in plaats van `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

De gerichte Discord-capabilities-probe rapporteert de effectieve kanaalmachtigingen van de bot; de statusprobe controleert geconfigureerde Discord-kanalen en doelen voor automatisch deelnemen aan spraakkanalen.

## Opties

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoeken uit
- `--yes`: accepteer standaardwaarden zonder prompt
- `--repair`: pas aanbevolen niet-service-reparaties toe zonder prompt; installaties en herschrijvingen van Gateway-services vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: pas agressieve reparaties toe, inclusief het overschrijven van aangepaste serviceconfig wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en niet-service-reparaties
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--allow-exec`: sta doctor toe geconfigureerde exec SecretRefs uit te voeren tijdens het verifiëren van secrets
- `--deep`: scan systeemservices op extra Gateway-installaties en rapporteer recente Gateway-supervisor-herstartoverdrachten
- `--lint`: voer gemoderniseerde gezondheidscontroles uit in alleen-lezen modus en geef diagnostische bevindingen uit
- `--post-upgrade`: voer post-upgrade-compatibiliteitsprobes voor plugins uit; geeft bevindingen uit naar stdout; eindigt met code 1 als er bevindingen op error-niveau aanwezig zijn
- `--json`: geef met `--lint` JSON-bevindingen uit in plaats van menselijke uitvoer; geef met `--post-upgrade` een machineleesbare JSON-envelop uit (`{ probesRun, findings }`)
- `--severity-min <level>`: laat met `--lint` bevindingen onder `info`, `warning` of `error` weg
- `--all`: voer met `--lint` alle geregistreerde controles uit, inclusief opt-in-controles die zijn uitgesloten van de standaard automatiseringsset
- `--skip <id>`: sla met `--lint` een controle-id over; herhaal om meer dan één over te slaan
- `--only <id>`: voer met `--lint` alleen een controle-id uit; herhaal om een kleine geselecteerde set uit te voeren

## Lint-modus

`openclaw doctor --lint` is de alleen-lezen automatiseringsmodus voor doctor-controles.
Het gebruikt het gestructureerde gezondheidscontrolepad, vraagt niet om invoer en repareert
of herschrijft geen config/status. Gebruik het in CI, preflight-scripts en reviewworkflows
wanneer je machineleesbare bevindingen wilt in plaats van begeleide reparatieprompts.
Lint-uitvoeropties zoals `--json`, `--severity-min`, `--all`, `--only` en `--skip`
worden alleen geaccepteerd met `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Menselijke uitvoer is compact:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON-uitvoer is het scriptingoppervlak voor lint-runs:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Afsluitgedrag:

- `0`: geen bevindingen op of boven de geselecteerde ernstgrens
- `1`: ten minste één bevinding voldoet aan de geselecteerde grens
- `2`: opdracht-/runtimefout voordat lint-bevindingen kunnen worden geproduceerd

`--severity-min` bepaalt zowel zichtbare bevindingen als de afsluitgrens. Bijvoorbeeld:
`openclaw doctor --lint --severity-min error` kan geen bevindingen afdrukken en
afsluiten met `0`, zelfs wanneer bevindingen met lagere ernst `info` of `warning` bestaan.

`--all` bepaalt welke controles worden geselecteerd vóór ernstfiltering. De
standaard lint-run is de stabiele automatiseringsgate en sluit controles uit die
bewust opt-in zijn omdat ze diepgaand of historisch zijn, of eerder
repareerbare legacy-resten aan het licht brengen. Gebruik `--all` wanneer je de volledige lint-
inventaris wilt zonder elke controle-id op te sommen. `--only <id>` blijft de meest precieze
selector en kan elke geregistreerde controle op id uitvoeren.

## Gestructureerde Gezondheidscontroles

Moderne doctor-controles gebruiken een klein gestructureerd contract:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` voedt `doctor --lint`. `repair()` is optioneel en wordt alleen overwogen
door `doctor --fix` / `doctor --repair`. Controles die nog niet naar deze
vorm zijn gemigreerd, blijven de legacy doctor-bijdrageflow gebruiken.

De scheiding is bewust: `detect()` is eigenaar van diagnose, terwijl `repair()` eigenaar is van
het rapporteren wat het heeft gewijzigd of zou wijzigen. Reparatiecontexten kunnen
`dryRun`/`diff`-verzoeken bevatten, en reparatieresultaten kunnen gestructureerde `diffs` retourneren voor
config-/bestandsbewerkingen plus `effects` voor service, proces, package, status of andere
bijwerkingen. Daardoor kunnen geconverteerde controles doorgroeien naar `doctor --fix --dry-run`
en diff-rapportage zonder mutatieplanning naar `detect()` te verplaatsen.

`repair()` rapporteert of het de gevraagde reparatie heeft geprobeerd met `status:
"repaired" | "skipped" | "failed"`. Een weggelaten status betekent `repaired`, dus eenvoudige
reparatiecontroles hoeven alleen wijzigingen te retourneren. Wanneer reparatie `skipped` of
`failed` retourneert, rapporteert doctor de reden en voert het geen validatie uit voor die controle.

Na een geslaagde gestructureerde reparatie voert doctor `detect()` opnieuw uit met de
gerepareerde bevindingen als scope. Controles kunnen geselecteerde bevindingen, paden of `ocPath`-
waarden gebruiken voor gerichte validatie. Als de bevinding nog steeds aanwezig is, rapporteert doctor een
reparatiewaarschuwing in plaats van de wijziging stilzwijgend als voltooid te behandelen.

Een bevinding bevat:

| Veld              | Doel                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Stabiele id voor skip-/only-filters en CI-allowlists.  |
| `severity`        | `info`, `warning` of `error`.                          |
| `message`         | Menselijk leesbare probleembeschrijving.               |
| `path`            | Config-, bestands- of logisch pad wanneer beschikbaar. |
| `line` / `column` | Bronlocatie wanneer beschikbaar.                       |
| `ocPath`          | Precies `oc://`-adres wanneer een controle ernaar kan verwijzen. |
| `fixHint`         | Voorgestelde operatoractie of reparatiesamenvatting.   |

Gemoderniseerde core doctor-controles blijven gekoppeld aan de geordende doctor-bijdrage
die eigenaar is van hun menselijke `doctor` / `doctor --fix`-gedrag. Het gedeelde gestructureerde
gezondheidsregister is het uitbreidingspunt: gebundelde en plugin-ondersteunde controles worden
na core doctor-controles uitgevoerd zodra hun eigenaarspackage ze registreert in het actieve
opdrachtpad. Het subpad `openclaw/plugin-sdk/health` stelt hetzelfde
contract beschikbaar voor die uitbreidingsconsumenten.

## Selectie Van Controles

Gebruik `--only` en `--skip` wanneer een workflow een gerichte gate wil:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` en `--skip` accepteren volledige controle-id's en mogen worden herhaald. Als een `--only`-
id niet is geregistreerd, wordt er geen controle uitgevoerd voor die id; gebruik de velden `checksRun`
en `checksSkipped` van de opdracht om te verifiëren dat een gerichte gate de controles selecteert die je
verwacht.

## Post-upgrade-modus

`openclaw doctor --post-upgrade` voert plugin-compatibiliteitsprobes uit die bedoeld zijn om te worden
gekoppeld na een build of upgrade. Bevindingen worden naar stdout uitgegeven; de opdracht
eindigt met code 1 als een bevinding `level: "error"` heeft. Voeg `--json` toe om een
machineleesbare envelop (`{ probesRun, findings }`) te ontvangen die geschikt is voor CI, de
community-`fork-upgrade`-skill en andere post-upgrade smoke-tooling. Als de
geïnstalleerde plugin-index ontbreekt of ongeldig is, geeft JSON-modus nog steeds die
envelop uit met een `plugin.index_unavailable`-errorbevinding.

Opmerkingen:

- In Nix-modus (`OPENCLAW_NIX_MODE=1`) werken alleen-lezen doctor-controles nog steeds, maar `doctor --fix`, `doctor --repair`, `doctor --yes` en `doctor --generate-gateway-token` zijn uitgeschakeld omdat `openclaw.json` onveranderlijk is. Bewerk in plaats daarvan de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interactieve prompts (zoals keychain-/OAuth-reparaties) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless runs (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-runs slaan eager Plugin-laden over, zodat headless health checks snel blijven. Interactieve doctor-sessies laden nog steeds de Plugin-oppervlakken die nodig zijn voor de legacy health- en reparatieflow.
- `--lint` is strenger dan `--non-interactive`: het is altijd alleen-lezen, vraagt nooit om invoer en past nooit veilige migraties toe. Voer `doctor --fix` of `doctor --repair` uit wanneer je wilt dat doctor wijzigingen aanbrengt.
- Standaard voert doctor geen `exec` SecretRefs uit tijdens het controleren van geheimen. Gebruik `openclaw doctor --allow-exec` of `openclaw doctor --lint --allow-exec` alleen wanneer je bewust wilt dat doctor die geconfigureerde geheime resolvers uitvoert.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- Gemoderniseerde health checks kunnen een `repair()`-pad beschikbaar maken voor `doctor --fix`; controles die er geen beschikbaar maken, lopen door via de bestaande doctor-reparatieflow.
- `doctor --fix --non-interactive` meldt ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de modus voor updatereparatie. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je bewust de launcher wilt vervangen.
- Controles op statusintegriteit detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist een interactieve bevestiging; `--fix`, `--yes` en headless runs laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op legacy Cron-taakvormen en herschrijft die voordat canonieke rijen in SQLite worden geïmporteerd.
- Doctor meldt Cron-taken met expliciete `payload.model`-overrides, inclusief aantallen per provider-namespace en afwijkingen ten opzichte van `agents.defaults.model`, zodat geplande taken die het standaardmodel niet erven zichtbaar zijn tijdens auth- of facturatieonderzoeken.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog legacy `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet meer onderhouden en kan valse WhatsApp Gateway-storingen loggen wanneer Cron de systemd user-bus-omgeving mist.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een gedegradeerde Gateway-eventloop met lokale `openclaw-tui`-clients die nog draaien. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients, zodat WhatsApp-antwoorden niet achter verouderde TUI-refreshloops in de wachtrij komen.
- Doctor herschrijft legacy `openai-codex/*`-modelrefs naar canonieke `openai/*`-refs voor primaire modellen, fallbacks, image-/video-generatiemodellen, Heartbeat-/subagent-/Compaction-overrides, hooks, channel-modeloverrides en verouderde sessieroute-pins. `--fix` migreert ook legacy `openai-codex:*`-authprofielen en `auth.order.openai-codex`-items naar `openai:*`, verplaatst Codex-intentie naar provider-/model-scoped `agentRuntime.id: "codex"`-items, verwijdert verouderde whole-agent-/sessie-runtime-pins en houdt gerepareerde OpenAI-agentrefs op Codex-authroutering in plaats van directe OpenAI API-key-auth.
- Doctor ruimt legacy stagingstatus voor Plugin-afhankelijkheden op die door oudere OpenClaw-versies is gemaakt en linkt het hostpakket `openclaw` opnieuw voor beheerde npm-Plugins die het als peer dependency declareren. Het repareert ook ontbrekende downloadbare Plugins waarnaar vanuit configuratie wordt verwezen, zoals `plugins.entries`, geconfigureerde channels, geconfigureerde provider-/zoekinstellingen of geconfigureerde agent-runtimes. Tijdens pakketupdates slaat doctor pakketbeheer-Plugin-reparatie over totdat de pakketwissel is voltooid; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde Plugin nog herstel nodig heeft. Als de download mislukt, meldt doctor de installatiefout en behoudt het de geconfigureerde Plugin-vermelding voor de volgende reparatiepoging.
- Doctor repareert verouderde Plugin-configuratie door ontbrekende Plugin-id's te verwijderen uit `plugins.allow`/`plugins.deny`/`plugins.entries`, plus bijbehorende loshangende channel-configuratie, Heartbeat-doelen en channel-modeloverrides wanneer Plugin-discovery gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de getroffen `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Gateway-startup slaat al alleen die slechte Plugin over, zodat andere Plugins en channels kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de Gateway-levenscyclus beheert. Doctor meldt nog steeds Gateway-/servicegezondheid en past niet-service-reparaties toe, maar slaat service-installatie/start/herstart/bootstrap en legacy service-opruiming over.
- Op Linux negeert doctor inactieve extra gateway-achtige systemd-units en herschrijft het tijdens reparatie geen command-/entrypoint-metadata voor een draaiende systemd Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je bewust de actieve launcher wilt vervangen.
- Doctor migreert legacy platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en vergelijkbare velden) automatisch naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-runs melden/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoekopdrachten en kan `openclaw configure --section model` aanbevelen wanneer embeddingreferenties ontbreken.
- Doctor waarschuwt wanneer er geen commando-eigenaar is geconfigureerd. De commando-eigenaar is het menselijke operatoraccount dat owner-only commando's mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat first-owner bootstrap bestond, stel dan expliciet `commands.ownerAllowFrom` in.
- Doctor meldt een infonotitie wanneer Codex-modus-agenten zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale Codex app-server-starts gebruiken geïsoleerde homes per agent, dus installeer indien nodig eerst de Codex-Plugin en gebruik daarna `openclaw migrate plan codex` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor verwijdert de uitgefaseerde `plugins.entries.codex.config.codexDynamicToolsProfile`; Codex app-server houdt Codex-native workspace-tools altijd native.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtime-omgeving omdat bins, env vars, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de Skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, meldt doctor een duidelijke waarschuwing met oplossing (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als legacy sandbox-registerbestanden of shardmappen aanwezig zijn (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` of `~/.openclaw/sandbox/browsers/`), meldt doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar SQLite en plaatst ongeldige legacy bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige commandopad, meldt doctor een alleen-lezen waarschuwing en schrijft het geen plaintext fallback-referenties. Voor exec-backed SecretRefs slaat doctor uitvoering over tenzij `--allow-exec` aanwezig is.
- Als channel-SecretRef-inspectie mislukt in een fix-pad, gaat doctor door en meldt het een waarschuwing in plaats van vroegtijdig te stoppen.
- Na state-directory-migraties waarschuwt doctor wanneer ingeschakelde standaardaccounts voor Telegram of Discord afhankelijk zijn van env fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbare Telegram-token in het huidige commandopad. Als tokeninspectie niet beschikbaar is, meldt doctor een waarschuwing en slaat het automatische resolutie voor die passage over.

## macOS: `launchctl` env-overrides

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende "unauthorized"-fouten veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
