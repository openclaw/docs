---
read_when:
    - De probleemoplossingshub heeft je hierheen verwezen voor een diepgaandere diagnose
    - Je hebt stabiele, op symptomen gebaseerde runbooksecties met exacte commando's nodig
sidebarTitle: Troubleshooting
summary: Diepgaand probleemoplossingsdraaiboek voor Gateway, kanalen, automatisering, knooppunten en browser
title: Problemen oplossen
x-i18n:
    generated_at: "2026-04-29T22:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Deze pagina is het uitgebreide runbook. Begin bij [/help/troubleshooting](/nl/help/troubleshooting) als je eerst de snelle triageflow wilt.

## Commandladder

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

## Split-brain-installaties en bewaking tegen nieuwere configuratie

Gebruik dit wanneer een Gateway-service onverwacht stopt na een update, of logs tonen dat een `openclaw`-binary ouder is dan de versie die als laatste `openclaw.json` heeft geschreven.

OpenClaw markeert configuratieschrijfacties met `meta.lastTouchedVersion`. Alleen-lezen-commando's kunnen nog steeds een configuratie inspecteren die door een nieuwere OpenClaw is geschreven, maar proces- en servicemutaties weigeren door te gaan vanuit een oudere binary. Geblokkeerde acties omvatten Gateway-service starten, stoppen, herstarten, verwijderen, geforceerde serviceherinstallatie, Gateway-start in servicemodus en poortopschoning met `gateway --force`.

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
    Verwijder verouderde systeempakketten of oude wrapper-vermeldingen die nog naar een oude `openclaw`-binary wijzen.
  </Step>
</Steps>

<Warning>
Alleen voor een bedoelde downgrade of noodherstel: stel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` in voor dat ene commando. Laat dit voor normaal gebruik uitgeschakeld.
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
- De huidige Anthropic-referentie is niet geschikt voor gebruik met lange context.
- Verzoeken mislukken alleen bij lange sessies/modelruns die het 1M-bètapad nodig hebben.

Oplossingsopties:

<Steps>
  <Step title="context1m uitschakelen">
    Schakel `context1m` uit voor dat model om terug te vallen op het normale contextvenster.
  </Step>
  <Step title="Een geschikte referentie gebruiken">
    Gebruik een Anthropic-referentie die geschikt is voor verzoeken met lange context, of schakel over naar een Anthropic-API-sleutel.
  </Step>
  <Step title="Fallbackmodellen configureren">
    Configureer fallbackmodellen zodat runs doorgaan wanneer Anthropic-verzoeken met lange context worden geweigerd.
  </Step>
</Steps>

Gerelateerd:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Waarom zie ik HTTP 429 van Anthropic?](/nl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokale OpenAI-compatibele backend slaagt voor directe probes maar agentruns mislukken

Gebruik dit wanneer:

- `curl ... /v1/models` werkt
- kleine directe `/v1/chat/completions`-aanroepen werken
- OpenClaw-modelruns alleen mislukken tijdens normale agentbeurten

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
- backendcrashes die alleen optreden bij grotere prompttokentellingen of volledige agentruntimeprompts

<AccordionGroup>
  <Accordion title="Veelvoorkomende signatures">
    - `model_not_found` met een lokale MLX-/vLLM-achtige server → controleer of `baseUrl` `/v1` bevat, `api` `"openai-completions"` is voor `/v1/chat/completions`-backends, en `models.providers.<provider>.models[].id` de kale providerlokale id is. Selecteer het eenmaal met de providerprefix, bijvoorbeeld `mlx/mlx-community/Qwen3-30B-A3B-6bit`; houd de catalogusvermelding als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend weigert gestructureerde Chat Completions-contentdelen. Oplossing: stel `models.providers.<provider>.models[].compat.requiresStringContent: true` in.
    - `incomplete turn detected ... stopReason=stop payloads=0` → de backend voltooide het Chat Completions-verzoek maar retourneerde geen voor de gebruiker zichtbare assistenttekst voor die beurt. OpenClaw probeert replay-veilige lege OpenAI-compatibele beurten eenmaal opnieuw; aanhoudende fouten betekenen meestal dat de backend lege/niet-tekstuele content uitstoot of uiteindelijke antwoordtekst onderdrukt.
    - directe kleine verzoeken slagen, maar OpenClaw-agentruns mislukken met backend-/modelcrashes (bijvoorbeeld Gemma op sommige `inferrs`-builds) → het OpenClaw-transport is waarschijnlijk al correct; de backend faalt op de grotere promptvorm van de agentruntime.
    - fouten nemen af na het uitschakelen van tools maar verdwijnen niet → toolschema's waren deel van de druk, maar het resterende probleem is nog steeds upstream model-/servercapaciteit of een backendbug.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Stel `compat.requiresStringContent: true` in voor string-only Chat Completions-backends.
    2. Stel `compat.supportsTools: false` in voor modellen/backends die het toolschema-oppervlak van OpenClaw niet betrouwbaar aankunnen.
    3. Verlaag waar mogelijk de promptdruk: kleinere workspace-bootstrap, kortere sessiegeschiedenis, lichter lokaal model, of een backend met sterkere ondersteuning voor lange context.
    4. Als kleine directe verzoeken blijven slagen terwijl OpenClaw-agentbeurten nog steeds binnen de backend crashen, behandel dit dan als een upstream server-/modelbeperking en dien daar een reproductie in met de geaccepteerde payloadvorm.
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

- Koppeling in behandeling voor DM-afzenders.
- Groepsvermeldingsgate (`requireMention`, `mentionPatterns`).
- Mismatches in allowlist voor kanaal/groep.

Veelvoorkomende signatures:

- `drop guild message (mention required` → groepsbericht genegeerd tot vermelding.
- `pairing request` → afzender heeft goedkeuring nodig.
- `blocked` / `allowlist` → afzender/kanaal is door beleid gefilterd.

Gerelateerd:

- [Kanaalproblemen oplossen](/nl/channels/troubleshooting)
- [Groepen](/nl/channels/groups)
- [Koppeling](/nl/channels/pairing)

## Connectiviteit van dashboardbesturings-UI

Wanneer de dashboard-/besturings-UI geen verbinding maakt, valideer dan URL, authmodus en aannames over veilige context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Let op:

- Juiste probe-URL en dashboard-URL.
- Mismatch in authmodus/token tussen client en Gateway.
- HTTP-gebruik waar apparaatidentiteit vereist is.

<AccordionGroup>
  <Accordion title="Connect-/auth-signatures">
    - `device identity required` → niet-veilige context of ontbrekende apparaatauth.
    - `origin not allowed` → browser-`Origin` staat niet in `gateway.controlUi.allowedOrigins` (of je verbindt vanuit een niet-loopback-browserorigin zonder expliciete allowlist).
    - `device nonce required` / `device nonce mismatch` → client voltooit de challenge-gebaseerde apparaatauthflow niet (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client heeft de verkeerde payload (of verouderde timestamp) ondertekend voor de huidige handshake.
    - `AUTH_TOKEN_MISMATCH` met `canRetryWithDeviceToken=true` → client kan eenmalig een vertrouwde retry uitvoeren met gecachete apparaattoken.
    - Die retry met gecachete token hergebruikt de gecachete scopeset die bij de gekoppelde apparaattoken is opgeslagen. Callers met expliciete `deviceToken` / expliciete `scopes` behouden in plaats daarvan hun aangevraagde scopeset.
    - Buiten dat retrypad is de authprioriteit voor connect: eerst expliciete gedeelde token/wachtwoord, dan expliciete `deviceToken`, dan opgeslagen apparaattoken, dan bootstrap-token.
    - Op het async Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, ip}` geserialiseerd voordat de limiter de fout registreert. Twee foutieve gelijktijdige retries van dezelfde client kunnen daardoor `retry later` op de tweede poging opleveren in plaats van twee gewone mismatches.
    - `too many failed authentication attempts (retry later)` vanuit een browser-origin local loopback-client → herhaalde fouten vanaf dezelfde genormaliseerde `Origin` worden tijdelijk geblokkeerd; een andere localhost-origin gebruikt een aparte bucket.
    - herhaald `unauthorized` na die retry → gedeelde token/apparaattoken is verschoven; vernieuw de tokenconfiguratie en keur de apparaattoken zo nodig opnieuw goed of roteer deze.
    - `gateway connect failed:` → verkeerd host-/poort-/url-doel.

  </Accordion>
</AccordionGroup>

### Snelle kaart voor auth-detailcodes

Gebruik `error.details.code` uit de mislukte `connect`-response om de volgende actie te kiezen:

| Detailcode                  | Betekenis                                                                                                                                                                                      | Aanbevolen actie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client heeft geen vereist gedeeld token verzonden.                                                                                                                                                 | Plak/stel token in de client in en probeer opnieuw. Voor dashboardpaden: `openclaw config get gateway.auth.token` en plak dit vervolgens in Control UI-instellingen.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Gedeeld token kwam niet overeen met gateway-auth-token.                                                                                                                                               | Als `canRetryWithDeviceToken=true`, sta één vertrouwde nieuwe poging toe. Nieuwe pogingen met gecachet token hergebruiken opgeslagen goedgekeurde scopes; expliciete `deviceToken` / `scopes`-aanroepers behouden aangevraagde scopes. Als dit nog steeds mislukt, voer dan de [checklist voor herstel bij tokendrift](/nl/cli/devices#token-drift-recovery-checklist) uit. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Gecachet token per apparaat is verouderd of ingetrokken.                                                                                                                                                 | Roteer/keur het apparaattoken opnieuw goed met [devices CLI](/nl/cli/devices) en verbind daarna opnieuw.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Apparaatidentiteit moet worden goedgekeurd. Controleer `error.details.reason` op `not-paired`, `scope-upgrade`, `role-upgrade` of `metadata-upgrade`, en gebruik `requestId` / `remediationHint` wanneer aanwezig. | Keur openstaand verzoek goed: `openclaw devices list` en daarna `openclaw devices approve <requestId>`. Scope-/rolupgrades gebruiken dezelfde flow nadat je de aangevraagde toegang hebt beoordeeld.                                                                                                               |

<Note>
Directe backend-RPC's via loopback die zijn geauthenticeerd met het gedeelde gateway-token/wachtwoord mogen niet afhankelijk zijn van de gekoppelde-apparaat-scopebaseline van de CLI. Als subagents of andere interne aanroepen nog steeds mislukken met `scope-upgrade`, controleer dan of de aanroeper `client.id: "gateway-client"` en `client.mode: "backend"` gebruikt en niet expliciet een `deviceIdentity` of apparaattoken afdwingt.
</Note>

Controle voor migratie naar apparaat-auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Als logs nonce-/handtekeningfouten tonen, werk dan de verbindende client bij en verifieer deze:

<Steps>
  <Step title="Wacht op connect.challenge">
    Client wacht op de door de gateway uitgegeven `connect.challenge`.
  </Step>
  <Step title="Onderteken de payload">
    Client ondertekent de aan de challenge gekoppelde payload.
  </Step>
  <Step title="Verzend de apparaat-nonce">
    Client verzendt `connect.params.device.nonce` met dezelfde challenge-nonce.
  </Step>
</Steps>

Als `openclaw devices rotate` / `revoke` / `remove` onverwacht wordt geweigerd:

- gekoppelde-apparaat-tokensessies kunnen alleen **hun eigen** apparaat beheren, tenzij de aanroeper ook `operator.admin` heeft
- `openclaw devices rotate --scope ...` kan alleen operator-scopes aanvragen die de aanroepersessie al bezit

Gerelateerd:

- [Configuratie](/nl/gateway/configuration) (gateway-auth-modi)
- [Control UI](/nl/web/control-ui)
- [Apparaten](/nl/cli/devices)
- [Externe toegang](/nl/gateway/remote)
- [Vertrouwde-proxy-auth](/nl/gateway/trusted-proxy-auth)

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

- `Runtime: stopped` met exithints.
- Mismatch in serviceconfiguratie (`Config (cli)` versus `Config (service)`).
- Poort-/listenerconflicten.
- Extra launchd/systemd/schtasks-installaties wanneer `--deep` wordt gebruikt.
- Opschoonhints voor `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Veelvoorkomende signatures">
    - `Gateway start blocked: set gateway.mode=local` of `existing config is missing gateway.mode` → lokale gateway-modus is niet ingeschakeld, of het configuratiebestand is overschreven en `gateway.mode` is verloren gegaan. Oplossing: stel `gateway.mode="local"` in je configuratie in, of voer `openclaw onboard --mode local` / `openclaw setup` opnieuw uit om de verwachte lokale-modusconfiguratie opnieuw te stempelen. Als je OpenClaw via Podman uitvoert, is het standaardconfiguratiepad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig gateway-auth-pad (token/wachtwoord, of trusted-proxy waar geconfigureerd).
    - `another gateway instance is already listening` / `EADDRINUSE` → poortconflict.
    - `Other gateway-like services detected (best effort)` → verouderde of parallelle launchd/systemd/schtasks-units bestaan. De meeste setups moeten één gateway per machine houden; als je er toch meer dan één nodig hebt, isoleer dan poorten + configuratie/status/werkruimte. Zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` van doctor → er bestaat een systemd-systeemunit terwijl de service op gebruikersniveau ontbreekt. Verwijder of schakel het duplicaat uit voordat je doctor toestaat een gebruikersservice te installeren, of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in als de systeemunit de bedoelde supervisor is.
    - `Gateway service port does not match current gateway config` → de geïnstalleerde supervisor pint nog steeds de oude `--port`. Voer `openclaw doctor --fix` of `openclaw gateway install --force` uit en herstart daarna de gateway-service.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Achtergronduitvoering en procestool](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Doctor](/nl/gateway/doctor)

## Gateway heeft laatst bekende goede configuratie hersteld

Gebruik dit wanneer de Gateway start, maar logs zeggen dat `openclaw.json` is hersteld.

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
- Een bestand met tijdstempel `openclaw.json.clobbered.*` naast de actieve configuratie
- Een systeemevent van de hoofdagent dat begint met `Config recovery warning`

<AccordionGroup>
  <Accordion title="Wat is er gebeurd">
    - De geweigerde configuratie valideerde niet tijdens opstarten of hot reload.
    - OpenClaw heeft de geweigerde payload bewaard als `.clobbered.*`.
    - De actieve configuratie is hersteld vanuit de laatst gevalideerde laatst bekende goede kopie.
    - De volgende beurt van de hoofdagent wordt gewaarschuwd om de geweigerde configuratie niet blind opnieuw te schrijven.
    - Als alle validatieproblemen onder `plugins.entries.<id>...` vielen, zou OpenClaw niet het hele bestand herstellen. Plugin-lokale fouten blijven duidelijk zichtbaar terwijl niet-gerelateerde gebruikersinstellingen in de actieve configuratie blijven.

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
  <Accordion title="Veelvoorkomende signatures">
    - `.clobbered.*` bestaat → een externe directe bewerking of opstartlezing is hersteld.
    - `.rejected.*` bestaat → een door OpenClaw beheerde configuratieschrijving faalde op schema- of clobbercontroles vóór commit.
    - `Config write rejected:` → de schrijfactie probeerde vereiste vorm te verwijderen, het bestand sterk te verkleinen of ongeldige configuratie te bewaren.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` of `size-drop-vs-last-good:*` → opstarten behandelde het huidige bestand als overschreven omdat het velden of grootte verloor vergeleken met de laatst bekende goede back-up.
    - `Config last-known-good promotion skipped` → de kandidaat bevatte geredigeerde geheime placeholders zoals `***`.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Behoud de herstelde actieve configuratie als die correct is.
    2. Kopieer alleen de bedoelde sleutels uit `.clobbered.*` of `.rejected.*` en pas ze daarna toe met `openclaw config set` of `config.patch`.
    3. Voer `openclaw config validate` uit voordat je opnieuw start.
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
- Of de waarschuwing gaat over SSH-fallback, meerdere gateways, ontbrekende scopes of niet-opgeloste auth-verwijzingen.

Veelvoorkomende signatures:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-setup is mislukt, maar de opdracht heeft nog steeds directe geconfigureerde/loopback-doelen geprobeerd.
- `multiple reachable gateways detected` → meer dan één doel heeft geantwoord. Meestal betekent dit een opzettelijke multi-gateway-setup of verouderde/duplicaatlisteners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → verbinden werkte, maar detail-RPC is scopebeperkt; koppel apparaatidentiteit of gebruik credentials met `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → verbinden werkte, maar de volledige diagnostische RPC-set is getime-out of mislukt. Behandel dit als een bereikbare Gateway met gedegradeerde diagnostiek; vergelijk `connect.ok` en `connect.rpcOk` in `--json`-uitvoer.
- `Capability: pairing-pending` of `gateway closed (1008): pairing required` → de gateway antwoordde, maar deze client heeft nog steeds koppeling/goedkeuring nodig vóór normale operatortoegang.
- onopgeloste `gateway.auth.*` / `gateway.remote.*` SecretRef-waarschuwingstekst → auth-materiaal was niet beschikbaar in dit opdrachtpad voor het mislukte doel.

Gerelateerd:

- [Gateway](/nl/cli/gateway)
- [Meerdere gateways op dezelfde host](/nl/gateway#multiple-gateways-same-host)
- [Externe toegang](/nl/gateway/remote)

## Kanaal verbonden, berichten stromen niet

Als de kanaalstatus verbonden is maar de berichtenstroom stilvalt, focus dan op beleid, machtigingen en kanaalspecifieke afleverregels.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Let op:

- DM-beleid (`pairing`, `allowlist`, `open`, `disabled`).
- Groeps-allowlist en vermeldingsvereisten.
- Ontbrekende API-machtigingen/scopes voor het kanaal.

Veelvoorkomende signatures:

- `mention required` → bericht genegeerd door beleid voor groepsvermeldingen.
- `pairing` / sporen van wachtende goedkeuring → afzender is niet goedgekeurd.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → probleem met kanaalauthenticatie/-machtigingen.

Gerelateerd:

- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
- [Discord](/nl/channels/discord)
- [Telegram](/nl/channels/telegram)
- [WhatsApp](/nl/channels/whatsapp)

## Cron- en Heartbeat-bezorging

Als Cron of Heartbeat niet is uitgevoerd of niet heeft bezorgd, controleer dan eerst de schedulerstatus en daarna het bezorgdoel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Zoek naar:

- Cron ingeschakeld en volgende wekactie aanwezig.
- Status van taakuitvoeringsgeschiedenis (`ok`, `skipped`, `error`).
- Redenen voor overgeslagen Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Veelvoorkomende signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron uitgeschakeld.
    - `cron: timer tick failed` → schedulertick mislukt; controleer bestands-/log-/runtimefouten.
    - `heartbeat skipped` met `reason=quiet-hours` → buiten venster met actieve uren.
    - `heartbeat skipped` met `reason=empty-heartbeat-file` → `HEARTBEAT.md` bestaat, maar bevat alleen lege regels / markdownkoppen, dus OpenClaw slaat de modelaanroep over.
    - `heartbeat skipped` met `reason=no-tasks-due` → `HEARTBEAT.md` bevat een `tasks:`-blok, maar geen van de taken is op deze tick aan de beurt.
    - `heartbeat: unknown accountId` → ongeldige account-id voor Heartbeat-bezorgdoel.
    - `heartbeat skipped` met `reason=dm-blocked` → Heartbeat-doel is herleid tot een DM-achtige bestemming terwijl `agents.defaults.heartbeat.directPolicy` (of override per agent) is ingesteld op `block`.

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

Zoek naar:

- Node online met verwachte mogelijkheden.
- OS-machtigingen voor camera/microfoon/locatie/scherm.
- Uitvoeringsgoedkeuringen en allowliststatus.

Veelvoorkomende signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-app moet op de voorgrond staan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ontbrekende OS-machtiging.
- `SYSTEM_RUN_DENIED: approval required` → uitvoeringsgoedkeuring in behandeling.
- `SYSTEM_RUN_DENIED: allowlist miss` → opdracht geblokkeerd door allowlist.

Gerelateerd:

- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)
- [Node-probleemoplossing](/nl/nodes/troubleshooting)
- [Nodes](/nl/nodes/index)

## Browsertool faalt

Gebruik dit wanneer browsertoolacties falen, ook al is de Gateway zelf gezond.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Zoek naar:

- Of `plugins.allow` is ingesteld en `browser` bevat.
- Geldig pad naar browseruitvoerbaar bestand.
- Bereikbaarheid van CDP-profiel.
- Beschikbaarheid van lokale Chrome voor `existing-session`- / `user`-profielen.

<AccordionGroup>
  <Accordion title="Plugin- / uitvoerbaar-bestandssignaturen">
    - `unknown command "browser"` of `unknown command 'browser'` → de gebundelde browser-Plugin is uitgesloten door `plugins.allow`.
    - browsertool ontbreekt / niet beschikbaar terwijl `browser.enabled=true` → `plugins.allow` sluit `browser` uit, waardoor de Plugin nooit is geladen.
    - `Failed to start Chrome CDP on port` → browserproces kon niet starten.
    - `browser.executablePath not found` → geconfigureerd pad is ongeldig.
    - `browser.cdpUrl must be http(s) or ws(s)` → de geconfigureerde CDP-URL gebruikt een niet-ondersteund schema zoals `file:` of `ftp:`.
    - `browser.cdpUrl has invalid port` → de geconfigureerde CDP-URL heeft een ongeldige poort of een poort buiten bereik.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → de huidige Gateway-installatie mist de `playwright-core`-runtimeafhankelijkheid van de gebundelde browser-Plugin; voer `openclaw doctor --fix` uit en herstart daarna de Gateway. ARIA-snapshots en eenvoudige paginaschermafbeeldingen kunnen nog steeds werken, maar navigatie, AI-snapshots, schermafbeeldingen van CSS-selector-elementen en PDF-export blijven niet beschikbaar.

  </Accordion>
  <Accordion title="Chrome MCP- / bestaande-sessiesignaturen">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP bestaande sessie kon nog niet koppelen aan de geselecteerde browsergegevensmap. Open de inspectiepagina van de browser, schakel remote debugging in, houd de browser open, keur de eerste koppelingsprompt goed en probeer het opnieuw. Als aangemelde status niet vereist is, geef dan de voorkeur aan het beheerde `openclaw`-profiel.
    - `No Chrome tabs found for profile="user"` → het Chrome MCP-koppelingsprofiel heeft geen geopende lokale Chrome-tabbladen.
    - `Remote CDP for profile "<name>" is not reachable` → het geconfigureerde externe CDP-eindpunt is niet bereikbaar vanaf de Gateway-host.
    - `Browser attachOnly is enabled ... not reachable` of `Browser attachOnly is enabled and CDP websocket ... is not reachable` → koppelingsprofiel heeft geen bereikbaar doel, of het HTTP-eindpunt antwoordde maar de CDP-WebSocket kon nog steeds niet worden geopend.

  </Accordion>
  <Accordion title="Element- / schermafbeeldings- / uploadsignaturen">
    - `fullPage is not supported for element screenshots` → schermafbeeldingsverzoek combineerde `--full-page` met `--ref` of `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP- / `existing-session`-schermafbeeldingsaanroepen moeten paginavastlegging of een snapshot-`--ref` gebruiken, geen CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP-uploadhooks hebben snapshotrefs nodig, geen CSS-selectors.
    - `existing-session file uploads currently support one file at a time.` → verzend één upload per aanroep op Chrome MCP-profielen.
    - `existing-session dialog handling does not support timeoutMs.` → dialooghooks op Chrome MCP-profielen ondersteunen geen timeoutoverrides.
    - `existing-session type does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:type` op `profile="user"`- / Chrome MCP-bestaande-sessieprofielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `existing-session evaluate does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:evaluate` op `profile="user"`- / Chrome MCP-bestaande-sessieprofielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vereist nog steeds een beheerde browser of onbewerkt CDP-profiel.
    - verouderde viewport- / donkere-modus- / locale- / offline-overrides op koppelings- of externe CDP-profielen → voer `openclaw browser stop --browser-profile <name>` uit om de actieve controlesessie te sluiten en Playwright-/CDP-emulatiestatus vrij te geven zonder de hele Gateway te herstarten.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Browser (beheerd door OpenClaw)](/nl/tools/browser)
- [Browserprobleemoplossing](/nl/tools/browser-linux-troubleshooting)

## Als je hebt geüpgraded en er plotseling iets kapotging

De meeste problemen na een upgrade zijn configuratiedrift of strengere standaarden die nu worden afgedwongen.

<AccordionGroup>
  <Accordion title="1. Gedrag voor authenticatie en URL-override is gewijzigd">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Wat te controleren:

    - Als `gateway.mode=remote`, kunnen CLI-aanroepen naar extern worden gericht terwijl je lokale service in orde is.
    - Expliciete `--url`-aanroepen vallen niet terug op opgeslagen referenties.

    Veelvoorkomende signaturen:

    - `gateway connect failed:` → verkeerd URL-doel.
    - `unauthorized` → eindpunt bereikbaar, maar verkeerde authenticatie.

  </Accordion>
  <Accordion title="2. Bind- en authenticatiebeschermingen zijn strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Wat te controleren:

    - Niet-loopback-binds (`lan`, `tailnet`, `custom`) hebben een geldig Gateway-authenticatiepad nodig: gedeeld token-/wachtwoordauthenticatie, of een correct geconfigureerde niet-loopback-`trusted-proxy`-implementatie.
    - Oude sleutels zoals `gateway.token` vervangen `gateway.auth.token` niet.

    Veelvoorkomende signaturen:

    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig Gateway-authenticatiepad.
    - `Connectivity probe: failed` terwijl runtime actief is → Gateway leeft, maar is ontoegankelijk met huidige authenticatie/URL.

  </Accordion>
  <Accordion title="3. Koppelings- en apparaatidentiteitsstatus is gewijzigd">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Wat te controleren:

    - Wachtende apparaatgoedkeuringen voor dashboard/Nodes.
    - Wachtende DM-koppelingsgoedkeuringen na beleids- of identiteitswijzigingen.

    Veelvoorkomende signaturen:

    - `device identity required` → apparaatauthenticatie niet voldaan.
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
- [Achtergronduitvoering en procestool](/nl/gateway/background-process)
- [Gateway-beheerde koppeling](/nl/gateway/pairing)

## Gerelateerd

- [Doctor](/nl/gateway/doctor)
- [FAQ](/nl/help/faq)
- [Gateway-runbook](/nl/gateway)
