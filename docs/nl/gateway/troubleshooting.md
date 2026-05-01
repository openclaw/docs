---
read_when:
    - De hub voor probleemoplossing heeft je hierheen verwezen voor een diepgaandere diagnose
    - Je hebt stabiele symptoomgebaseerde runbooksecties met exacte commando's nodig
sidebarTitle: Troubleshooting
summary: Diepgaand runbook voor probleemoplossing voor Gateway, kanalen, automatisering, nodes en browser
title: Problemen oplossen
x-i18n:
    generated_at: "2026-05-01T11:18:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Deze pagina is het uitgebreide draaiboek. Begin bij [/help/troubleshooting](/nl/help/troubleshooting) als je eerst de snelle triageflow wilt.

## Commandoladder

Voer deze eerst uit, in deze volgorde:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Verwachte gezonde signalen:

- `openclaw gateway status` toont `Runtime: running`, `Connectivity probe: ok` en een regel `Capability: ...`.
- `openclaw doctor` meldt geen blokkerende config-/serviceproblemen.
- `openclaw channels status --probe` toont live transportstatus per account en, waar ondersteund, probe-/auditresultaten zoals `works` of `audit ok`.

## Split-brain-installaties en guard voor nieuwere config

Gebruik dit wanneer een Gateway-service onverwacht stopt na een update, of wanneer logs tonen dat één `openclaw`-binary ouder is dan de versie die `openclaw.json` voor het laatst heeft geschreven.

OpenClaw voorziet config-writes van een stempel met `meta.lastTouchedVersion`. Alleen-lezen-commando's kunnen nog steeds een config inspecteren die door een nieuwere OpenClaw is geschreven, maar proces- en servicemutaties weigeren door te gaan vanaf een oudere binary. Geblokkeerde acties zijn onder andere het starten, stoppen, herstarten en verwijderen van de Gateway-service, geforceerde serviceherinstallatie, Gateway-startup in servicemodus en `gateway --force`-poortopschoning.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH repareren">
    Repareer `PATH` zodat `openclaw` naar de nieuwere installatie verwijst, en voer de actie daarna opnieuw uit.
  </Step>
  <Step title="De Gateway-service opnieuw installeren">
    Installeer de bedoelde Gateway-service opnieuw vanuit de nieuwere installatie:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Verouderde wrappers verwijderen">
    Verwijder verouderde systeempakket- of oude wrapper-vermeldingen die nog steeds naar een oude `openclaw`-binary wijzen.
  </Step>
</Steps>

<Warning>
Stel alleen voor een bewuste downgrade of noodherstel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` in voor dat ene commando. Laat dit uitgeschakeld voor normale werking.
</Warning>

## Anthropic 429 extra gebruik vereist voor lange context

Gebruik dit wanneer logs/fouten dit bevatten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Let op:

- Het geselecteerde Anthropic Opus-/Sonnet-model heeft `params.context1m: true`.
- De huidige Anthropic-referentie is niet geschikt voor long-context-gebruik.
- Verzoeken mislukken alleen bij lange sessies/modelruns die het 1M-beta-pad nodig hebben.

Oplossingen:

<Steps>
  <Step title="context1m uitschakelen">
    Schakel `context1m` voor dat model uit om terug te vallen op het normale contextvenster.
  </Step>
  <Step title="Een geschikte referentie gebruiken">
    Gebruik een Anthropic-referentie die geschikt is voor long-context-verzoeken, of schakel over naar een Anthropic API-sleutel.
  </Step>
  <Step title="Fallback-modellen configureren">
    Configureer fallback-modellen zodat runs doorgaan wanneer Anthropic long-context-verzoeken worden geweigerd.
  </Step>
</Steps>

Gerelateerd:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Waarom zie ik HTTP 429 van Anthropic?](/nl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokale OpenAI-compatibele backend slaagt voor directe probes, maar agent-runs mislukken

Gebruik dit wanneer:

- `curl ... /v1/models` werkt
- kleine directe `/v1/chat/completions`-calls werken
- OpenClaw-modelruns alleen mislukken bij normale agent-beurten

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Let op:

- directe kleine calls slagen, maar OpenClaw-runs mislukken alleen bij grotere prompts
- `model_not_found`- of 404-fouten, ook al werkt directe `/v1/chat/completions`
  met dezelfde kale model-id
- backendfouten over `messages[].content` die een string verwachten
- intermitterende waarschuwingen `incomplete turn detected ... stopReason=stop payloads=0` met een OpenAI-compatibele lokale backend
- backendcrashes die alleen optreden bij grotere prompt-tokenaantallen of volledige agent-runtimeprompts

<AccordionGroup>
  <Accordion title="Veelvoorkomende signatures">
    - `model_not_found` met een lokale MLX/vLLM-achtige server → controleer of `baseUrl` `/v1` bevat, `api` `"openai-completions"` is voor `/v1/chat/completions`-backends en `models.providers.<provider>.models[].id` de kale provider-lokale id is. Selecteer die één keer met de providerprefix, bijvoorbeeld `mlx/mlx-community/Qwen3-30B-A3B-6bit`; houd de catalogusvermelding als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend weigert gestructureerde Chat Completions-contentonderdelen. Oplossing: stel `models.providers.<provider>.models[].compat.requiresStringContent: true` in.
    - `incomplete turn detected ... stopReason=stop payloads=0` → de backend heeft het Chat Completions-verzoek voltooid, maar gaf geen voor de gebruiker zichtbare assistenttekst voor die beurt terug. OpenClaw probeert replay-veilige lege OpenAI-compatibele beurten één keer opnieuw; aanhoudende fouten betekenen meestal dat de backend lege/niet-tekstuele content uitzendt of tekst voor het eindantwoord onderdrukt.
    - directe kleine verzoeken slagen, maar OpenClaw-agent-runs mislukken met backend-/modelcrashes (bijvoorbeeld Gemma op sommige `inferrs`-builds) → het OpenClaw-transport is waarschijnlijk al correct; de backend faalt op de grotere promptvorm van de agent-runtime.
    - fouten nemen af na het uitschakelen van tools, maar verdwijnen niet → toolschema's waren een deel van de druk, maar het resterende probleem is nog steeds upstream model-/servercapaciteit of een backendbug.

  </Accordion>
  <Accordion title="Oplossingen">
    1. Stel `compat.requiresStringContent: true` in voor string-only Chat Completions-backends.
    2. Stel `compat.supportsTools: false` in voor modellen/backends die OpenClaw's toolschema-oppervlak niet betrouwbaar kunnen verwerken.
    3. Verlaag waar mogelijk de promptdruk: kleinere workspace-bootstrap, kortere sessiegeschiedenis, lichter lokaal model of een backend met sterkere long-context-ondersteuning.
    4. Als kleine directe verzoeken blijven slagen terwijl OpenClaw-agent-beurten nog steeds crashen binnen de backend, behandel dit dan als een upstream server-/modelbeperking en dien daar een repro in met de geaccepteerde payloadvorm.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Configuratie](/nl/gateway/configuration)
- [Lokale modellen](/nl/gateway/local-models)
- [OpenAI-compatibele endpoints](/nl/gateway/configuration-reference#openai-compatible-endpoints)

## Geen antwoorden

Als kanalen actief zijn maar niets antwoordt, controleer dan routing en beleid voordat je iets opnieuw verbindt.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Let op:

- Pairing in behandeling voor DM-afzenders.
- Groepsvermeldingsgating (`requireMention`, `mentionPatterns`).
- Mismatches in channel-/groeps-allowlists.

Veelvoorkomende signatures:

- `drop guild message (mention required` → groepsbericht genegeerd tot vermelding.
- `pairing request` → afzender heeft goedkeuring nodig.
- `blocked` / `allowlist` → afzender/kanaal is door beleid gefilterd.

Gerelateerd:

- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
- [Groepen](/nl/channels/groups)
- [Pairing](/nl/channels/pairing)

## Connectiviteit van dashboard-control-UI

Wanneer de dashboard-/control-UI geen verbinding maakt, valideer dan URL, auth-modus en aannames over veilige context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Let op:

- Correcte probe-URL en dashboard-URL.
- Mismatch in auth-modus/token tussen client en Gateway.
- HTTP-gebruik waar apparaatidentiteit vereist is.

<AccordionGroup>
  <Accordion title="Connect-/auth-signatures">
    - `device identity required` → niet-veilige context of ontbrekende apparaatauth.
    - `origin not allowed` → browser-`Origin` staat niet in `gateway.controlUi.allowedOrigins` (of je maakt verbinding vanaf een niet-loopback-browser-origin zonder expliciete allowlist).
    - `device nonce required` / `device nonce mismatch` → client voltooit de challenge-gebaseerde apparaatauthflow niet (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client heeft de verkeerde payload (of verouderde timestamp) ondertekend voor de huidige handshake.
    - `AUTH_TOKEN_MISMATCH` met `canRetryWithDeviceToken=true` → client kan één vertrouwde retry doen met gecachte device token.
    - Die retry met gecachte token hergebruikt de gecachte scopeset die met de gepairde device token is opgeslagen. Callers met expliciete `deviceToken` / expliciete `scopes` behouden in plaats daarvan hun aangevraagde scopeset.
    - Buiten dat retry-pad is de voorrang van connect-auth eerst expliciete gedeelde token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen device token, daarna bootstrap-token.
    - Op het async Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, ip}` geserialiseerd voordat de limiter de fout registreert. Twee slechte gelijktijdige retries vanaf dezelfde client kunnen daarom bij de tweede poging `retry later` tonen in plaats van twee gewone mismatches.
    - `too many failed authentication attempts (retry later)` vanaf een browser-origin loopback-client → herhaalde fouten vanaf diezelfde genormaliseerde `Origin` worden tijdelijk geblokkeerd; een andere localhost-origin gebruikt een aparte bucket.
    - herhaalde `unauthorized` na die retry → drift in gedeelde token/device token; vernieuw de tokenconfig en keur device token indien nodig opnieuw goed of roteer die.
    - `gateway connect failed:` → verkeerde host/poort/url-doel.

  </Accordion>
</AccordionGroup>

### Snelle kaart voor auth-detailcodes

Gebruik `error.details.code` uit de mislukte `connect`-respons om de volgende actie te kiezen:

| Detailcode                  | Betekenis                                                                                                                                                                                      | Aanbevolen actie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client heeft geen vereiste gedeelde token verzonden.                                                                                                                                                 | Plak/stel de token in de client in en probeer opnieuw. Voor dashboardpaden: `openclaw config get gateway.auth.token` en plak deze daarna in de instellingen van Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Gedeelde token kwam niet overeen met de Gateway-authenticatietoken.                                                                                                                                               | Als `canRetryWithDeviceToken=true`, sta één vertrouwde nieuwe poging toe. Pogingen met gecachte tokens hergebruiken opgeslagen goedgekeurde scopes; expliciete `deviceToken`- / `scopes`-aanroepen behouden de aangevraagde scopes. Als het nog steeds mislukt, voer dan de [checklist voor herstel van token-drift](/nl/cli/devices#token-drift-recovery-checklist) uit. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Gecachte token per apparaat is verouderd of ingetrokken.                                                                                                                                                 | Roteer/keur de apparaattoken opnieuw goed met de [apparaten-CLI](/nl/cli/devices) en maak daarna opnieuw verbinding.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Apparaatidentiteit moet worden goedgekeurd. Controleer `error.details.reason` op `not-paired`, `scope-upgrade`, `role-upgrade` of `metadata-upgrade`, en gebruik `requestId` / `remediationHint` wanneer aanwezig. | Keur het openstaande verzoek goed: `openclaw devices list` en daarna `openclaw devices approve <requestId>`. Scope-/rolupgrades gebruiken dezelfde flow nadat je de aangevraagde toegang hebt beoordeeld.                                                                                                               |

<Note>
Directe backend-RPC's via loopback die zijn geauthenticeerd met de gedeelde Gateway-token/het gedeelde Gateway-wachtwoord mogen niet afhankelijk zijn van de scope-baseline voor gekoppelde apparaten van de CLI. Als subagents of andere interne aanroepen nog steeds mislukken met `scope-upgrade`, controleer dan of de aanroeper `client.id: "gateway-client"` en `client.mode: "backend"` gebruikt en geen expliciete `deviceIdentity` of apparaattoken afdwingt.
</Note>

Migratiecontrole voor apparaatauth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Als logs nonce-/handtekeningfouten tonen, werk dan de verbindende client bij en verifieer deze:

<Steps>
  <Step title="Wacht op connect.challenge">
    Client wacht op de door de Gateway uitgegeven `connect.challenge`.
  </Step>
  <Step title="Onderteken de payload">
    Client ondertekent de aan challenge gebonden payload.
  </Step>
  <Step title="Verzend de apparaat-nonce">
    Client verzendt `connect.params.device.nonce` met dezelfde challenge-nonce.
  </Step>
</Steps>

Als `openclaw devices rotate` / `revoke` / `remove` onverwacht wordt geweigerd:

- tokensessies voor gekoppelde apparaten kunnen alleen **hun eigen** apparaat beheren, tenzij de aanroeper ook `operator.admin` heeft
- `openclaw devices rotate --scope ...` kan alleen operator-scopes aanvragen die de aanroepersessie al bezit

Gerelateerd:

- [Configuratie](/nl/gateway/configuration) (Gateway-authenticatiemodi)
- [Control UI](/nl/web/control-ui)
- [Apparaten](/nl/cli/devices)
- [Externe toegang](/nl/gateway/remote)
- [Vertrouwde-proxy-authenticatie](/nl/gateway/trusted-proxy-auth)

## Gateway-service draait niet

Gebruik dit wanneer de service is geïnstalleerd, maar het proces niet actief blijft.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Let op:

- `Runtime: stopped` met exit-hints.
- Mismatch in serviceconfiguratie (`Config (cli)` versus `Config (service)`).
- Poort-/listenerconflicten.
- Extra launchd-/systemd-/schtasks-installaties wanneer `--deep` wordt gebruikt.
- Opschoningshints voor `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `Gateway start blocked: set gateway.mode=local` of `existing config is missing gateway.mode` → lokale Gateway-modus is niet ingeschakeld, of het configuratiebestand is overschreven en is `gateway.mode` kwijtgeraakt. Oplossing: stel `gateway.mode="local"` in je configuratie in, of voer `openclaw onboard --mode local` / `openclaw setup` opnieuw uit om de verwachte configuratie voor lokale modus opnieuw te stempelen. Als je OpenClaw via Podman uitvoert, is het standaardconfiguratiepad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig Gateway-authenticatiepad (token/wachtwoord, of vertrouwde proxy waar geconfigureerd).
    - `another gateway instance is already listening` / `EADDRINUSE` → poortconflict.
    - `Other gateway-like services detected (best effort)` → verouderde of parallelle launchd-/systemd-/schtasks-units bestaan. De meeste setups zouden één Gateway per machine moeten houden; als je er toch meer dan één nodig hebt, isoleer dan poorten + configuratie/status/werkruimte. Zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` van doctor → er bestaat een systemd-systeemunit terwijl de service op gebruikersniveau ontbreekt. Verwijder of schakel het duplicaat uit voordat je doctor toestaat een gebruikersservice te installeren, of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in als de systeemunit de bedoelde supervisor is.
    - `Gateway service port does not match current gateway config` → de geïnstalleerde supervisor pint nog steeds de oude `--port`. Voer `openclaw doctor --fix` of `openclaw gateway install --force` uit en herstart daarna de Gateway-service.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Achtergronduitvoering en procestool](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Doctor](/nl/gateway/doctor)

## Gateway heeft laatst bekende goede configuratie hersteld

Gebruik dit wanneer de Gateway start, maar logs melden dat `openclaw.json` is hersteld.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Let op:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Een getimestampet `openclaw.json.clobbered.*`-bestand naast de actieve configuratie
- Een systeemgebeurtenis van de hoofdagent die begint met `Config recovery warning`

<AccordionGroup>
  <Accordion title="Wat is er gebeurd">
    - De geweigerde configuratie valideerde niet tijdens opstarten of hot reload.
    - OpenClaw heeft de geweigerde payload bewaard als `.clobbered.*`.
    - De actieve configuratie is hersteld vanuit de laatst gevalideerde laatst bekende goede kopie.
    - De volgende beurt van de hoofdagent wordt gewaarschuwd om de geweigerde configuratie niet blind opnieuw te schrijven.
    - Als alle validatieproblemen onder `plugins.entries.<id>...` zaten, zou OpenClaw niet het hele bestand herstellen. Plugin-lokale fouten blijven duidelijk zichtbaar terwijl niet-gerelateerde gebruikersinstellingen in de actieve configuratie blijven.

  </Accordion>
  <Accordion title="Inspecteren en herstellen">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Veelvoorkomende signalen">
    - `.clobbered.*` bestaat → een externe directe bewerking of opstartleesactie is hersteld.
    - `.rejected.*` bestaat → een door OpenClaw beheerde configuratieschrijfactie faalde schema- of clobber-controles vóór commit.
    - `Config write rejected:` → de schrijfactie probeerde de vereiste vorm te laten vallen, het bestand sterk te verkleinen of ongeldige configuratie op te slaan.
    - `Rejected validation details:` → het herstellog of de melding van de hoofdagent bevat het schemapad dat het herstel veroorzaakte, zoals `agents.defaults.execution` of `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` of `size-drop-vs-last-good:*` → bij opstarten werd het huidige bestand behandeld als overschreven omdat het velden of omvang verloor vergeleken met de laatst bekende goede back-up.
    - `Config last-known-good promotion skipped` → de kandidaat bevatte geredigeerde geheime placeholders zoals `***`.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Behoud de herstelde actieve configuratie als die correct is.
    2. Kopieer alleen de bedoelde sleutels uit `.clobbered.*` of `.rejected.*` en pas ze daarna toe met `openclaw config set` of `config.patch`.
    3. Voer `openclaw config validate` uit vóór herstarten.
    4. Als je handmatig bewerkt, behoud dan de volledige JSON5-configuratie, niet alleen het gedeeltelijke object dat je wilde wijzigen.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Config](/nl/cli/config)
- [Configuratie: hot reload](/nl/gateway/configuration#config-hot-reload)
- [Configuratie: strikte validatie](/nl/gateway/configuration#strict-validation)
- [Doctor](/nl/gateway/doctor)

## Gateway-probewaarschuwingen

Gebruik dit wanneer `openclaw gateway probe` iets bereikt, maar nog steeds een waarschuwingsblok afdrukt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Let op:

- `warnings[].code` en `primaryTargetId` in JSON-uitvoer.
- Of de waarschuwing gaat over SSH-fallback, meerdere Gateways, ontbrekende scopes of niet-opgeloste auth-referenties.

Veelvoorkomende signalen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-installatie is mislukt, maar de opdracht heeft nog steeds directe geconfigureerde/loopback-doelen geprobeerd.
- `multiple reachable gateways detected` → meer dan één doel heeft geantwoord. Meestal betekent dit een opzettelijke multi-Gateway-setup of verouderde/duplicaatlisteners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → verbinden werkte, maar detail-RPC is beperkt door scopes; koppel apparaatidentiteit of gebruik inloggegevens met `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → verbinden werkte, maar de volledige diagnostische RPC-set is verlopen of mislukt. Behandel dit als een bereikbare Gateway met gedegradeerde diagnostiek; vergelijk `connect.ok` en `connect.rpcOk` in `--json`-uitvoer.
- `Capability: pairing-pending` of `gateway closed (1008): pairing required` → de Gateway heeft geantwoord, maar deze client heeft nog steeds koppeling/goedkeuring nodig vóór normale operatortoegang.
- niet-opgeloste waarschuwingstekst voor `gateway.auth.*` / `gateway.remote.*` SecretRef → authenticatiemateriaal was in dit opdrachtpad niet beschikbaar voor het mislukte doel.

Gerelateerd:

- [Gateway](/nl/cli/gateway)
- [Meerdere Gateways op dezelfde host](/nl/gateway#multiple-gateways-same-host)
- [Externe toegang](/nl/gateway/remote)

## Kanaal verbonden, berichten stromen niet

Als de kanaalstatus verbonden is maar de berichtenstroom dood is, richt je dan op beleid, machtigingen en kanaalspecifieke bezorgregels.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Let op:

- DM-beleid (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist voor groepen en vermeldingseisen.
- Ontbrekende kanaal-API-machtigingen/scopes.

Veelvoorkomende signalen:

- `mention required` → bericht genegeerd door groepsvermeldingsbeleid.
- `pairing` / sporen van wachtende goedkeuring → afzender is niet goedgekeurd.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → probleem met kanaalauthenticatie/-machtigingen.

Gerelateerd:

- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
- [Discord](/nl/channels/discord)
- [Telegram](/nl/channels/telegram)
- [WhatsApp](/nl/channels/whatsapp)

## Cron- en heartbeat-aflevering

Als Cron of Heartbeat niet is uitgevoerd of niet heeft afgeleverd, controleer dan eerst de schedulerstatus en daarna het afleverdoel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Let op:

- Cron ingeschakeld en volgende wekmoment aanwezig.
- Status van jobuitvoeringsgeschiedenis (`ok`, `skipped`, `error`).
- Heartbeat-oversla-redenen (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron uitgeschakeld.
    - `cron: timer tick failed` → scheduler-tick mislukt; controleer bestands-/log-/runtimefouten.
    - `heartbeat skipped` met `reason=quiet-hours` → buiten het venster met actieve uren.
    - `heartbeat skipped` met `reason=empty-heartbeat-file` → `HEARTBEAT.md` bestaat, maar bevat alleen lege regels / markdownkoppen, waardoor OpenClaw de modelaanroep overslaat.
    - `heartbeat skipped` met `reason=no-tasks-due` → `HEARTBEAT.md` bevat een `tasks:`-blok, maar geen van de taken is verschuldigd bij deze tick.
    - `heartbeat: unknown accountId` → ongeldig account-id voor Heartbeat-afleverdoel.
    - `heartbeat skipped` met `reason=dm-blocked` → Heartbeat-doel is omgezet naar een DM-achtige bestemming terwijl `agents.defaults.heartbeat.directPolicy` (of override per agent) is ingesteld op `block`.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [Geplande taken: probleemoplossing](/nl/automation/cron-jobs#troubleshooting)

## Node gekoppeld, tool mislukt

Als een Node is gekoppeld maar tools mislukken, isoleer dan de voorgrond-, machtigings- en goedkeuringsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Let op:

- Node online met verwachte mogelijkheden.
- OS-machtigingen voor camera/microfoon/locatie/scherm.
- Exec-goedkeuringen en allowliststatus.

Veelvoorkomende signalen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-app moet op de voorgrond staan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ontbrekende OS-machtiging.
- `SYSTEM_RUN_DENIED: approval required` → exec-goedkeuring in behandeling.
- `SYSTEM_RUN_DENIED: allowlist miss` → opdracht geblokkeerd door allowlist.

Gerelateerd:

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Node-probleemoplossing](/nl/nodes/troubleshooting)
- [Nodes](/nl/nodes/index)

## Browsertool mislukt

Gebruik dit wanneer browsertoolacties mislukken, ook al is de Gateway zelf gezond.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Let op:

- Of `plugins.allow` is ingesteld en `browser` bevat.
- Geldig pad naar browseruitvoerbaar bestand.
- Bereikbaarheid van CDP-profiel.
- Beschikbaarheid van lokale Chrome voor `existing-session`- / `user`-profielen.

<AccordionGroup>
  <Accordion title="Plugin- / uitvoerbare-bestandssignalen">
    - `unknown command "browser"` of `unknown command 'browser'` → de gebundelde browser-Plugin wordt uitgesloten door `plugins.allow`.
    - browsertool ontbreekt / niet beschikbaar terwijl `browser.enabled=true` → `plugins.allow` sluit `browser` uit, waardoor de Plugin nooit is geladen.
    - `Failed to start Chrome CDP on port` → browserproces kon niet starten.
    - `browser.executablePath not found` → geconfigureerd pad is ongeldig.
    - `browser.cdpUrl must be http(s) or ws(s)` → de geconfigureerde CDP-URL gebruikt een niet-ondersteund schema zoals `file:` of `ftp:`.
    - `browser.cdpUrl has invalid port` → de geconfigureerde CDP-URL heeft een ongeldige poort of een poort buiten bereik.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → de huidige Gateway-installatie mist de `playwright-core`-runtimeafhankelijkheid van de gebundelde browser-Plugin; voer `openclaw doctor --fix` uit en herstart daarna de Gateway. ARIA-snapshots en eenvoudige paginaschermafbeeldingen kunnen nog werken, maar navigatie, AI-snapshots, schermafbeeldingen van CSS-selectorelementen en PDF-export blijven niet beschikbaar.

  </Accordion>
  <Accordion title="Chrome MCP- / existing-session-signalen">
    - `Could not find DevToolsActivePort for chrome` → bestaande sessie van Chrome MCP kon nog niet koppelen aan de geselecteerde browserdatamap. Open de inspectiepagina van de browser, schakel remote debugging in, houd de browser open, keur de eerste koppelingsprompt goed en probeer opnieuw. Als ingelogde status niet vereist is, geef dan de voorkeur aan het beheerde `openclaw`-profiel.
    - `No Chrome tabs found for profile="user"` → het Chrome MCP-koppelprofiel heeft geen geopende lokale Chrome-tabbladen.
    - `Remote CDP for profile "<name>" is not reachable` → het geconfigureerde externe CDP-eindpunt is niet bereikbaar vanaf de Gateway-host.
    - `Browser attachOnly is enabled ... not reachable` of `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only-profiel heeft geen bereikbaar doel, of het HTTP-eindpunt antwoordde maar de CDP-WebSocket kon nog steeds niet worden geopend.

  </Accordion>
  <Accordion title="Element- / screenshot- / uploadsignalen">
    - `fullPage is not supported for element screenshots` → screenshotverzoek combineerde `--full-page` met `--ref` of `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → screenshotaanroepen van Chrome MCP / `existing-session` moeten pagina-opname of een snapshot-`--ref` gebruiken, geen CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → uploadhooks van Chrome MCP hebben snapshotrefs nodig, geen CSS-selectors.
    - `existing-session file uploads currently support one file at a time.` → stuur één upload per aanroep op Chrome MCP-profielen.
    - `existing-session dialog handling does not support timeoutMs.` → dialooghooks op Chrome MCP-profielen ondersteunen geen timeout-overrides.
    - `existing-session type does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:type` op `profile="user"` / Chrome MCP-existing-session-profielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `existing-session evaluate does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:evaluate` op `profile="user"` / Chrome MCP-existing-session-profielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vereist nog steeds een beheerde browser of raw CDP-profiel.
    - verouderde viewport- / dark-mode- / locale- / offline-overrides op attach-only- of externe CDP-profielen → voer `openclaw browser stop --browser-profile <name>` uit om de actieve controlesessie te sluiten en de Playwright-/CDP-emulatiestatus vrij te geven zonder de hele Gateway te herstarten.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Browser (door OpenClaw beheerd)](/nl/tools/browser)
- [Browserprobleemoplossing](/nl/tools/browser-linux-troubleshooting)

## Als je hebt geüpgraded en er plots iets kapotging

De meeste problemen na een upgrade zijn configdrift of strengere defaults die nu worden afgedwongen.

<AccordionGroup>
  <Accordion title="1. Gedrag voor auth- en URL-overrides is gewijzigd">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Wat te controleren:

    - Als `gateway.mode=remote`, kunnen CLI-aanroepen naar remote verwijzen terwijl je lokale service in orde is.
    - Expliciete `--url`-aanroepen vallen niet terug op opgeslagen referenties.

    Veelvoorkomende signalen:

    - `gateway connect failed:` → verkeerd URL-doel.
    - `unauthorized` → eindpunt bereikbaar, maar verkeerde auth.

  </Accordion>
  <Accordion title="2. Bind- en auth-guardrails zijn strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Wat te controleren:

    - Niet-loopback-binds (`lan`, `tailnet`, `custom`) hebben een geldig Gateway-authpad nodig: gedeelde token-/wachtwoordauth, of een correct geconfigureerde niet-loopback-`trusted-proxy`-deployment.
    - Oude sleutels zoals `gateway.token` vervangen `gateway.auth.token` niet.

    Veelvoorkomende signalen:

    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig Gateway-authpad.
    - `Connectivity probe: failed` terwijl runtime draait → Gateway leeft, maar is niet toegankelijk met huidige auth/url.

  </Accordion>
  <Accordion title="3. Status van koppeling en apparaatidentiteit is gewijzigd">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Wat te controleren:

    - Wachtende apparaatgoedkeuringen voor dashboard/nodes.
    - Wachtende DM-koppelingsgoedkeuringen na beleids- of identiteitswijzigingen.

    Veelvoorkomende signalen:

    - `device identity required` → apparaatauth niet voldaan.
    - `pairing required` → afzender/apparaat moet worden goedgekeurd.

  </Accordion>
</AccordionGroup>

Als de serviceconfig en runtime na controles nog steeds verschillen, installeer dan servicemetadata opnieuw vanuit dezelfde profiel-/statusmap:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Gerelateerd:

- [Authenticatie](/nl/gateway/authentication)
- [Achtergrond-exec en procestool](/nl/gateway/background-process)
- [Door Gateway beheerde koppeling](/nl/gateway/pairing)

## Gerelateerd

- [Doctor](/nl/gateway/doctor)
- [FAQ](/nl/help/faq)
- [Gateway-runbook](/nl/gateway)
