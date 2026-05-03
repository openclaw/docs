---
read_when:
    - De hub voor probleemoplossing heeft u hierheen verwezen voor een diepgaandere diagnose
    - Je hebt stabiele, op symptomen gebaseerde runbook-secties met exacte opdrachten nodig
sidebarTitle: Troubleshooting
summary: Diepgaand runbook voor probleemoplossing voor Gateway, kanalen, automatisering, nodes en browser
title: Probleemoplossing
x-i18n:
    generated_at: "2026-05-03T21:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Deze pagina is het uitgebreide runbook. Begin bij [/help/troubleshooting](/nl/help/troubleshooting) als je eerst de snelle triageflow wilt.

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
- `openclaw doctor` meldt geen blokkerende configuratie- of serviceproblemen.
- `openclaw channels status --probe` toont live transportstatus per account en, waar ondersteund, probe-/auditresultaten zoals `works` of `audit ok`.

## Split-brain-installaties en guard voor nieuwere configuratie

Gebruik dit wanneer een gatewayservice onverwacht stopt na een update, of logs tonen dat een `openclaw`-binary ouder is dan de versie die als laatste `openclaw.json` heeft geschreven.

OpenClaw markeert configuratieschrijfacties met `meta.lastTouchedVersion`. Alleen-lezen-opdrachten kunnen nog steeds een configuratie inspecteren die door een nieuwere OpenClaw is geschreven, maar proces- en servicemutaties weigeren door te gaan vanuit een oudere binary. Geblokkeerde acties omvatten het starten, stoppen, herstarten en verwijderen van de gatewayservice, geforceerde herinstallatie van de service, gatewaystart in servicemodus en poortopruiming met `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH repareren">
    Repareer `PATH` zodat `openclaw` naar de nieuwere installatie verwijst en voer de actie daarna opnieuw uit.
  </Step>
  <Step title="De gatewayservice opnieuw installeren">
    Installeer de beoogde gatewayservice opnieuw vanuit de nieuwere installatie:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Verouderde wrappers verwijderen">
    Verwijder verouderde systeempakketten of oude wrapper-items die nog steeds naar een oude `openclaw`-binary wijzen.
  </Step>
</Steps>

<Warning>
Alleen voor opzettelijke downgrade of noodherstel: stel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` in voor die ene opdracht. Laat dit bij normaal gebruik uitgeschakeld.
</Warning>

## Anthropic 429 extra gebruik vereist voor lange context

Gebruik dit wanneer logs/fouten dit bevatten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Let op:

- Geselecteerd Anthropic Opus/Sonnet-model heeft `params.context1m: true`.
- Huidige Anthropic-referentie is niet geschikt voor gebruik met lange context.
- Verzoeken mislukken alleen bij lange sessies/modelruns die het 1M-bètapad nodig hebben.

Oplossingsopties:

<Steps>
  <Step title="context1m uitschakelen">
    Schakel `context1m` uit voor dat model om terug te vallen op het normale contextvenster.
  </Step>
  <Step title="Een geschikte referentie gebruiken">
    Gebruik een Anthropic-referentie die geschikt is voor verzoeken met lange context, of schakel over naar een Anthropic API-sleutel.
  </Step>
  <Step title="Fallbackmodellen configureren">
    Configureer fallbackmodellen zodat runs doorgaan wanneer Anthropic-verzoeken met lange context worden geweigerd.
  </Step>
</Steps>

Gerelateerd:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Waarom zie ik HTTP 429 van Anthropic?](/nl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokale OpenAI-compatibele backend slaagt voor directe probes, maar agentruns mislukken

Gebruik dit wanneer:

- `curl ... /v1/models` werkt
- kleine directe `/v1/chat/completions`-aanroepen werken
- OpenClaw-modelruns alleen mislukken bij normale agentbeurten

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Let op:

- directe kleine aanroepen slagen, maar OpenClaw-runs mislukken alleen bij grotere prompts
- `model_not_found`- of 404-fouten, ook al werkt directe `/v1/chat/completions`
  met dezelfde kale model-id
- backendfouten over `messages[].content` die een string verwachten
- intermitterende waarschuwingen `incomplete turn detected ... stopReason=stop payloads=0` met een OpenAI-compatibele lokale backend
- backendcrashes die alleen verschijnen bij grotere aantallen prompttokens of volledige agent-runtimeprompts

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `model_not_found` met een lokale MLX/vLLM-achtige server → verifieer dat `baseUrl` `/v1` bevat, `api` `"openai-completions"` is voor `/v1/chat/completions`-backends, en `models.providers.<provider>.models[].id` de kale provider-lokale id is. Selecteer deze één keer met het providerprefix, bijvoorbeeld `mlx/mlx-community/Qwen3-30B-A3B-6bit`; houd de catalogusvermelding als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend weigert gestructureerde Chat Completions-contentonderdelen. Oplossing: stel `models.providers.<provider>.models[].compat.requiresStringContent: true` in.
    - `incomplete turn detected ... stopReason=stop payloads=0` → de backend heeft het Chat Completions-verzoek voltooid, maar gaf geen voor de gebruiker zichtbare assistenttekst terug voor die beurt. OpenClaw probeert replay-veilige lege OpenAI-compatibele beurten één keer opnieuw; aanhoudende fouten betekenen meestal dat de backend lege/niet-tekstuele content uitgeeft of uiteindelijke antwoordtekst onderdrukt.
    - directe kleine verzoeken slagen, maar OpenClaw-agentruns mislukken met backend-/modelcrashes (bijvoorbeeld Gemma op sommige `inferrs`-builds) → OpenClaw-transport is waarschijnlijk al correct; de backend faalt op de grotere promptvorm van de agentruntime.
    - fouten nemen af na het uitschakelen van tools, maar verdwijnen niet → toolschema's maakten deel uit van de druk, maar het resterende probleem is nog steeds upstream model-/servercapaciteit of een backendbug.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Stel `compat.requiresStringContent: true` in voor Chat Completions-backends die alleen strings ondersteunen.
    2. Stel `compat.supportsTools: false` in voor modellen/backends die OpenClaw's toolschema-oppervlak niet betrouwbaar aankunnen.
    3. Verlaag promptdruk waar mogelijk: kleinere workspace-bootstrap, kortere sessiegeschiedenis, lichter lokaal model of een backend met sterkere ondersteuning voor lange context.
    4. Als kleine directe verzoeken blijven slagen terwijl OpenClaw-agentbeurten nog steeds binnen de backend crashen, behandel dit dan als een upstream server-/modelbeperking en dien daar een repro in met de geaccepteerde payloadvorm.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Configuratie](/nl/gateway/configuration)
- [Lokale modellen](/nl/gateway/local-models)
- [OpenAI-compatibele eindpunten](/nl/gateway/configuration-reference#openai-compatible-endpoints)

## Geen antwoorden

Als kanalen actief zijn maar niets antwoordt, controleer routering en beleid voordat je iets opnieuw verbindt.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Let op:

- Koppeling in afwachting voor DM-afzenders.
- Groepsvermeldingsgating (`requireMention`, `mentionPatterns`).
- Mismatches in allowlist voor kanaal/groep.

Veelvoorkomende signalen:

- `drop guild message (mention required` → groepsbericht genegeerd tot vermelding.
- `pairing request` → afzender heeft goedkeuring nodig.
- `blocked` / `allowlist` → afzender/kanaal is door beleid gefilterd.

Gerelateerd:

- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
- [Groepen](/nl/channels/groups)
- [Koppeling](/nl/channels/pairing)

## Connectiviteit van dashboard-control-UI

Wanneer de dashboard-/control-UI geen verbinding maakt, valideer dan URL, authmodus en aannames over veilige context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Let op:

- Correcte probe-URL en dashboard-URL.
- Mismatch in authmodus/token tussen client en gateway.
- HTTP-gebruik waar apparaatidentiteit vereist is.

<AccordionGroup>
  <Accordion title="Connect-/auth-signalen">
    - `device identity required` → niet-veilige context of ontbrekende apparaatauthenticatie.
    - `origin not allowed` → browser-`Origin` staat niet in `gateway.controlUi.allowedOrigins` (of je maakt verbinding vanaf een niet-loopback browser-origin zonder expliciete allowlist).
    - `device nonce required` / `device nonce mismatch` → client voltooit de challenge-gebaseerde apparaatauthenticatieflow niet (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client heeft de verkeerde payload (of verouderde timestamp) ondertekend voor de huidige handshake.
    - `AUTH_TOKEN_MISMATCH` met `canRetryWithDeviceToken=true` → client kan één vertrouwde retry doen met gecachte apparaattoken.
    - Die retry met gecachte token hergebruikt de gecachte scopeset die met de gekoppelde apparaattoken is opgeslagen. Aanroepers met expliciete `deviceToken` / expliciete `scopes` behouden in plaats daarvan hun aangevraagde scopeset.
    - Buiten dat retrypad is de voorrang voor connect-authenticatie eerst expliciete gedeelde token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstraptoken.
    - Op het asynchrone Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, ip}` geserialiseerd voordat de limiter de fout registreert. Twee slechte gelijktijdige retries vanaf dezelfde client kunnen daarom bij de tweede poging `retry later` tonen in plaats van twee gewone mismatches.
    - `too many failed authentication attempts (retry later)` vanaf een browser-origin loopback-client → herhaalde fouten vanaf dezelfde genormaliseerde `Origin` worden tijdelijk buitengesloten; een andere localhost-origin gebruikt een aparte bucket.
    - herhaalde `unauthorized` na die retry → drift in gedeelde token/apparaattoken; vernieuw tokenconfiguratie en keur de apparaattoken indien nodig opnieuw goed of roteer deze.
    - `gateway connect failed:` → verkeerde host-/poort-/URL-doel.

  </Accordion>
</AccordionGroup>

### Snelle kaart voor auth-detailcodes

Gebruik `error.details.code` uit de mislukte `connect`-respons om de volgende actie te kiezen:

| Detailcode                  | Betekenis                                                                                                                                                                                      | Aanbevolen actie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client heeft geen vereist gedeeld token verzonden.                                                                                                                                                 | Plak/stel het token in de client in en probeer opnieuw. Voor dashboardpaden: `openclaw config get gateway.auth.token` en plak dit daarna in de instellingen van Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Gedeeld token kwam niet overeen met het gateway-authenticatietoken.                                                                                                                                               | Als `canRetryWithDeviceToken=true`, sta dan één vertrouwde nieuwe poging toe. Nieuwe pogingen met gecachte tokens hergebruiken opgeslagen goedgekeurde scopes; expliciete aanroepen met `deviceToken` / `scopes` behouden aangevraagde scopes. Als het nog steeds mislukt, voer dan de [checklist voor herstel van tokenafwijking](/nl/cli/devices#token-drift-recovery-checklist) uit. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Gecacht token per apparaat is verouderd of ingetrokken.                                                                                                                                                 | Roteer/keur het apparaattoken opnieuw goed met de [apparaten-CLI](/nl/cli/devices), en maak daarna opnieuw verbinding.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Apparaatidentiteit heeft goedkeuring nodig. Controleer `error.details.reason` op `not-paired`, `scope-upgrade`, `role-upgrade` of `metadata-upgrade`, en gebruik `requestId` / `remediationHint` wanneer aanwezig. | Keur de openstaande aanvraag goed: `openclaw devices list` en daarna `openclaw devices approve <requestId>`. Scope-/rolupgrades gebruiken dezelfde flow nadat u de aangevraagde toegang hebt gecontroleerd.                                                                                                               |

<Note>
Directe loopback-backend-RPC's die zijn geauthenticeerd met het gedeelde Gateway-token/wachtwoord mogen niet afhankelijk zijn van de gekoppelde-apparaat-scopebaseline van de CLI. Als subagents of andere interne aanroepen nog steeds mislukken met `scope-upgrade`, controleer dan of de aanroeper `client.id: "gateway-client"` en `client.mode: "backend"` gebruikt en geen expliciete `deviceIdentity` of apparaattoken afdwingt.
</Note>

Migratiecontrole voor apparaatauthenticatie v2:

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

- gekoppelde-apparaat-tokensessies kunnen alleen **hun eigen** apparaat beheren, tenzij de aanroeper ook `operator.admin` heeft
- `openclaw devices rotate --scope ...` kan alleen operator-scopes aanvragen die de aanroepersessie al heeft

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
- Serviceconfiguratie komt niet overeen (`Config (cli)` versus `Config (service)`).
- Poort-/listenerconflicten.
- Extra launchd/systemd/schtasks-installaties wanneer `--deep` wordt gebruikt.
- Opschoonhints voor `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `Gateway start blocked: set gateway.mode=local` of `existing config is missing gateway.mode` → lokale Gateway-modus is niet ingeschakeld, of het configuratiebestand is overschreven en heeft `gateway.mode` verloren. Oplossing: stel `gateway.mode="local"` in uw configuratie in, of voer `openclaw onboard --mode local` / `openclaw setup` opnieuw uit om de verwachte lokale-modusconfiguratie opnieuw te stempelen. Als u OpenClaw via Podman draait, is het standaardconfiguratiepad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig Gateway-authenticatiepad (token/wachtwoord, of trusted-proxy waar geconfigureerd).
    - `another gateway instance is already listening` / `EADDRINUSE` → poortconflict.
    - `Other gateway-like services detected (best effort)` → er bestaan verouderde of parallelle launchd/systemd/schtasks-units. De meeste setups horen één Gateway per machine te behouden; als u er wel meer dan één nodig hebt, isoleer dan poorten + configuratie/status/werkruimte. Zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` van doctor → er bestaat een systemd-systeemunit terwijl de service op gebruikersniveau ontbreekt. Verwijder of schakel het duplicaat uit voordat u doctor toestaat een gebruikersservice te installeren, of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in als de systeemunit de bedoelde supervisor is.
    - `Gateway service port does not match current gateway config` → de geïnstalleerde supervisor pint nog steeds de oude `--port`. Voer `openclaw doctor --fix` of `openclaw gateway install --force` uit en herstart daarna de Gateway-service.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Achtergronduitvoering en procestool](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Doctor](/nl/gateway/doctor)

## Gateway heeft ongeldige configuratie geweigerd

Gebruik dit wanneer het opstarten van Gateway mislukt met `Invalid config` of hot-reloadlogs zeggen dat
een ongeldige wijziging is overgeslagen.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Let op:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Een van een tijdstempel voorzien `openclaw.json.rejected.*`-bestand naast de actieve configuratie
- Een van een tijdstempel voorzien `openclaw.json.clobbered.*`-bestand als `doctor --fix` een kapotte directe wijziging heeft gerepareerd

<AccordionGroup>
  <Accordion title="Wat er is gebeurd">
    - De configuratie is niet gevalideerd tijdens het opstarten, hot reload of een door OpenClaw beheerde schrijfactie.
    - Gateway-opstarten faalt gesloten in plaats van `openclaw.json` te herschrijven.
    - Hot reload slaat ongeldige externe wijzigingen over en houdt de huidige runtimeconfiguratie actief.
    - Door OpenClaw beheerde schrijfacties weigeren ongeldige/destructieve payloads vóór commit en slaan `.rejected.*` op.
    - `openclaw doctor --fix` beheert reparatie. Het kan niet-JSON-prefixen verwijderen of de laatste bekende goede kopie herstellen terwijl de geweigerde payload als `.clobbered.*` behouden blijft.

  </Accordion>
  <Accordion title="Inspecteren en repareren">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Veelvoorkomende signalen">
    - `.clobbered.*` bestaat → doctor heeft een kapotte externe wijziging behouden terwijl de actieve configuratie werd gerepareerd.
    - `.rejected.*` bestaat → een door OpenClaw beheerde configuratieschrijfactie is vóór commit mislukt op schema- of clobbercontroles.
    - `Config write rejected:` → de schrijfactie probeerde de vereiste structuur te verwijderen, het bestand sterk te verkleinen of ongeldige configuratie op te slaan.
    - `config reload skipped (invalid config):` → een directe wijziging is niet door validatie gekomen en is genegeerd door de draaiende Gateway.
    - `Invalid config at ...` → opstarten is mislukt voordat Gateway-services zijn gestart.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` of `size-drop-vs-last-good:*` → een door OpenClaw beheerde schrijfactie is geweigerd omdat velden of omvang verloren gingen ten opzichte van de laatste bekende goede back-up.
    - `Config last-known-good promotion skipped` → de kandidaat bevatte geredigeerde geheimplaatshouders zoals `***`.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Voer `openclaw doctor --fix` uit om doctor geprefixte/geclobberde configuratie te laten repareren of de laatste bekende goede configuratie te herstellen.
    2. Kopieer alleen de bedoelde sleutels uit `.clobbered.*` of `.rejected.*` en pas ze daarna toe met `openclaw config set` of `config.patch`.
    3. Voer `openclaw config validate` uit voordat u opnieuw start.
    4. Als u handmatig bewerkt, behoud dan de volledige JSON5-configuratie, niet alleen het deelobject dat u wilde wijzigen.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Config](/nl/cli/config)
- [Configuratie: hot reload](/nl/gateway/configuration#config-hot-reload)
- [Configuratie: strikte validatie](/nl/gateway/configuration#strict-validation)
- [Doctor](/nl/gateway/doctor)

## Gateway-probewaarschuwingen

Gebruik dit wanneer `openclaw gateway probe` iets bereikt, maar toch een waarschuwingsblok afdrukt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Let op:

- `warnings[].code` en `primaryTargetId` in JSON-uitvoer.
- Of de waarschuwing gaat over SSH-fallback, meerdere Gateways, ontbrekende scopes of niet-opgeloste authenticatieverwijzingen.

Veelvoorkomende signalen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-setup is mislukt, maar de opdracht heeft nog steeds directe geconfigureerde/loopback-doelen geprobeerd.
- `multiple reachable gateways detected` → meer dan één doel heeft geantwoord. Meestal betekent dit een bedoelde multi-Gateway-setup of verouderde/duplicaatlisteners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → verbinden werkte, maar de detail-RPC is scopebeperkt; koppel apparaatidentiteit of gebruik referenties met `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → verbinden werkte, maar de volledige set diagnostische RPC's is verlopen of mislukt. Behandel dit als een bereikbare Gateway met beperkte diagnostiek; vergelijk `connect.ok` en `connect.rpcOk` in `--json`-uitvoer.
- `Capability: pairing-pending` of `gateway closed (1008): pairing required` → de Gateway heeft geantwoord, maar deze client heeft nog steeds koppeling/goedkeuring nodig vóór normale operatortoegang.
- niet-opgeloste `gateway.auth.*` / `gateway.remote.*` SecretRef-waarschuwingstekst → authenticatiemateriaal was in dit opdrachtpad niet beschikbaar voor het mislukte doel.

Gerelateerd:

- [Gateway](/nl/cli/gateway)
- [Meerdere Gateways op dezelfde host](/nl/gateway#multiple-gateways-same-host)
- [Externe toegang](/nl/gateway/remote)

## Kanaal verbonden, berichten stromen niet

Als de kanaalstatus verbonden is maar de berichtenstroom dood is, richt u dan op beleid, machtigingen en kanaalspecifieke leveringsregels.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Let op:

- DM-beleid (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist voor groepen en vermeldingsvereisten.
- Ontbrekende API-machtigingen/scopes voor kanalen.

Veelvoorkomende signaturen:

- `mention required` → bericht genegeerd door groepsvermeldingsbeleid.
- `pairing` / sporen van wachtende goedkeuring → afzender is niet goedgekeurd.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → probleem met kanaalauthenticatie/machtigingen.

Gerelateerd:

- [Probleemoplossing voor kanalen](/nl/channels/troubleshooting)
- [Discord](/nl/channels/discord)
- [Telegram](/nl/channels/telegram)
- [WhatsApp](/nl/channels/whatsapp)

## Cron- en heartbeat-bezorging

Als Cron of Heartbeat niet is uitgevoerd of niet heeft bezorgd, controleer dan eerst de schedulerstatus en daarna het bezorgdoel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Let op:

- Cron ingeschakeld en volgende wake aanwezig.
- Status van taakuitvoeringsgeschiedenis (`ok`, `skipped`, `error`).
- Redenen voor het overslaan van Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Veelvoorkomende signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → cron uitgeschakeld.
    - `cron: timer tick failed` → schedulertick mislukt; controleer bestands-/log-/runtimefouten.
    - `heartbeat skipped` met `reason=quiet-hours` → buiten het actieve urenvenster.
    - `heartbeat skipped` met `reason=empty-heartbeat-file` → `HEARTBEAT.md` bestaat maar bevat alleen lege regels / markdownkoppen, dus OpenClaw slaat de modelaanroep over.
    - `heartbeat skipped` met `reason=no-tasks-due` → `HEARTBEAT.md` bevat een `tasks:`-blok, maar geen van de taken is verschuldigd op deze tick.
    - `heartbeat: unknown accountId` → ongeldig account-id voor bezorgdoel van Heartbeat.
    - `heartbeat skipped` met `reason=dm-blocked` → Heartbeat-doel is omgezet naar een DM-achtige bestemming terwijl `agents.defaults.heartbeat.directPolicy` (of override per agent) is ingesteld op `block`.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [Geplande taken: probleemoplossing](/nl/automation/cron-jobs#troubleshooting)

## Node gekoppeld, tool faalt

Als een Node is gekoppeld maar tools falen, isoleer dan de voorgrond-, machtigings- en goedkeuringsstatus.

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
- Exec-goedkeuringen en allowlist-status.

Veelvoorkomende signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-app moet op de voorgrond staan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ontbrekende OS-machtiging.
- `SYSTEM_RUN_DENIED: approval required` → exec-goedkeuring in behandeling.
- `SYSTEM_RUN_DENIED: allowlist miss` → opdracht geblokkeerd door allowlist.

Gerelateerd:

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Node-probleemoplossing](/nl/nodes/troubleshooting)
- [Nodes](/nl/nodes/index)

## Browsertool faalt

Gebruik dit wanneer browsertoolacties falen terwijl de Gateway zelf gezond is.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Let op:

- Of `plugins.allow` is ingesteld en `browser` bevat.
- Geldig pad naar uitvoerbaar browserbestand.
- Bereikbaarheid van CDP-profiel.
- Beschikbaarheid van lokale Chrome voor `existing-session`- / `user`-profielen.

<AccordionGroup>
  <Accordion title="Plugin- / uitvoerbare-bestandssignaturen">
    - `unknown command "browser"` of `unknown command 'browser'` → de meegeleverde browser-Plugin is uitgesloten door `plugins.allow`.
    - browsertool ontbreekt / is niet beschikbaar terwijl `browser.enabled=true` → `plugins.allow` sluit `browser` uit, dus de Plugin is nooit geladen.
    - `Failed to start Chrome CDP on port` → browserproces kon niet starten.
    - `browser.executablePath not found` → geconfigureerd pad is ongeldig.
    - `browser.cdpUrl must be http(s) or ws(s)` → de geconfigureerde CDP-URL gebruikt een niet-ondersteund schema zoals `file:` of `ftp:`.
    - `browser.cdpUrl has invalid port` → de geconfigureerde CDP-URL heeft een slechte of buiten bereik vallende poort.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → de huidige Gateway-installatie mist de kernruntime-afhankelijkheid voor browsers; installeer OpenClaw opnieuw of werk OpenClaw bij en herstart daarna de Gateway. ARIA-snapshots en eenvoudige paginaschermafbeeldingen kunnen nog werken, maar navigatie, AI-snapshots, schermafbeeldingen van elementen via CSS-selectors en PDF-export blijven niet beschikbaar.

  </Accordion>
  <Accordion title="Chrome MCP- / bestaande-sessie-signaturen">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP bestaande sessie kon nog niet koppelen aan de geselecteerde browserdatamap. Open de inspectiepagina van de browser, schakel remote debugging in, houd de browser open, keur de eerste koppelprompt goed en probeer het opnieuw. Als aangemelde status niet vereist is, geef dan de voorkeur aan het beheerde `openclaw`-profiel.
    - `No Chrome tabs found for profile="user"` → het Chrome MCP-koppelprofiel heeft geen geopende lokale Chrome-tabbladen.
    - `Remote CDP for profile "<name>" is not reachable` → het geconfigureerde externe CDP-eindpunt is niet bereikbaar vanaf de Gateway-host.
    - `Browser attachOnly is enabled ... not reachable` of `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only-profiel heeft geen bereikbaar doel, of het HTTP-eindpunt antwoordde maar de CDP-WebSocket kon nog steeds niet worden geopend.

  </Accordion>
  <Accordion title="Element- / schermafbeelding- / uploadsignaturen">
    - `fullPage is not supported for element screenshots` → schermafbeeldingsverzoek combineerde `--full-page` met `--ref` of `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP- / `existing-session`-schermafbeeldingsaanroepen moeten pagina-opname of een snapshot-`--ref` gebruiken, niet CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP-uploadhooks hebben snapshotrefs nodig, geen CSS-selectors.
    - `existing-session file uploads currently support one file at a time.` → verstuur één upload per aanroep op Chrome MCP-profielen.
    - `existing-session dialog handling does not support timeoutMs.` → dialooghooks op Chrome MCP-profielen ondersteunen geen timeout-overrides.
    - `existing-session type does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:type` op `profile="user"` / Chrome MCP-profielen met bestaande sessie, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `existing-session evaluate does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:evaluate` op `profile="user"` / Chrome MCP-profielen met bestaande sessie, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vereist nog steeds een beheerde browser of raw CDP-profiel.
    - verouderde viewport- / dark-mode- / locale- / offline-overrides op attach-only- of externe CDP-profielen → voer `openclaw browser stop --browser-profile <name>` uit om de actieve controlesessie te sluiten en de Playwright-/CDP-emulatiestatus vrij te geven zonder de hele Gateway opnieuw te starten.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Browser (beheerd door OpenClaw)](/nl/tools/browser)
- [Browserprobleemoplossing](/nl/tools/browser-linux-troubleshooting)

## Als je hebt geüpgraded en er plotseling iets stukging

De meeste breuken na een upgrade komen door configdrift of strengere standaardinstellingen die nu worden afgedwongen.

<AccordionGroup>
  <Accordion title="1. Gedrag van auth- en URL-override is gewijzigd">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Wat te controleren:

    - Als `gateway.mode=remote`, kunnen CLI-aanroepen naar remote gaan terwijl je lokale service in orde is.
    - Expliciete `--url`-aanroepen vallen niet terug op opgeslagen credentials.

    Veelvoorkomende signaturen:

    - `gateway connect failed:` → verkeerd URL-doel.
    - `unauthorized` → eindpunt bereikbaar maar verkeerde auth.

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

    Veelvoorkomende signaturen:

    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig Gateway-authpad.
    - `Connectivity probe: failed` terwijl runtime draait → Gateway leeft maar is niet toegankelijk met huidige auth/url.

  </Accordion>
  <Accordion title="3. Koppelings- en apparaatidentiteitsstatus is gewijzigd">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Wat te controleren:

    - Wachtende apparaatgoedkeuringen voor dashboard/nodes.
    - Wachtende DM-koppelingsgoedkeuringen na beleids- of identiteitswijzigingen.

    Veelvoorkomende signaturen:

    - `device identity required` → apparaatauth niet voldaan.
    - `pairing required` → afzender/apparaat moet worden goedgekeurd.

  </Accordion>
</AccordionGroup>

Als de serviceconfiguratie en runtime na controles nog steeds niet overeenkomen, installeer dan servicemetadata opnieuw vanuit dezelfde profiel-/statusmap:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Gerelateerd:

- [Authenticatie](/nl/gateway/authentication)
- [Achtergrond-exec en procestool](/nl/gateway/background-process)
- [Gateway-eigen koppeling](/nl/gateway/pairing)

## Gerelateerd

- [Doctor](/nl/gateway/doctor)
- [FAQ](/nl/help/faq)
- [Gateway-runbook](/nl/gateway)
