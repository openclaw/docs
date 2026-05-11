---
read_when:
    - De hub voor probleemoplossing heeft je hierheen verwezen voor een diepgaandere diagnose
    - Je hebt stabiele, op symptomen gebaseerde runbooksecties met exacte commando's nodig
sidebarTitle: Troubleshooting
summary: Diepgaand draaiboek voor probleemoplossing van Gateway, kanalen, automatisering, nodes en browser
title: Probleemoplossing
x-i18n:
    generated_at: "2026-05-11T20:33:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
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

## Split-brain-installaties en nieuwere configuratiebeveiliging

Gebruik dit wanneer een Gateway-service onverwacht stopt na een update, of wanneer logs tonen dat één `openclaw`-binary ouder is dan de versie die als laatste `openclaw.json` heeft geschreven.

OpenClaw voorziet configuratieschrijfacties van een stempel met `meta.lastTouchedVersion`. Alleen-lezen-opdrachten kunnen nog steeds een configuratie inspecteren die door een nieuwere OpenClaw is geschreven, maar proces- en servicemutaties weigeren door te gaan vanaf een oudere binary. Geblokkeerde acties omvatten het starten, stoppen, herstarten, verwijderen, geforceerd opnieuw installeren van de Gateway-service, Gateway-opstart in servicemodus en poortopruiming met `gateway --force`.

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
  <Step title="De Gateway-service opnieuw installeren">
    Installeer de bedoelde Gateway-service opnieuw vanuit de nieuwere installatie:

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
Alleen voor een bewuste downgrade of noodherstel: stel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` in voor die ene opdracht. Laat dit bij normaal gebruik uitgeschakeld.
</Warning>

## Skill-symlink overgeslagen als padontsnapping

Gebruik dit wanneer logs het volgende bevatten:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw behandelt elke Skill-root als een afgebakende containmentgrens. Een symlink onder
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` of
`~/.openclaw/skills` wordt overgeslagen wanneer het echte doel buiten die root uitkomt,
tenzij het doel expliciet vertrouwd is.

Inspecteer de link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Als het doel bewust is gekozen, configureer dan zowel de directe Skill-root als het
toegestane symlinkdoel:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Start daarna een nieuwe sessie of wacht tot de Skills-watcher is vernieuwd. Herstart de
Gateway als het lopende proces ouder is dan de configuratiewijziging.

Gebruik geen brede doelen zoals `~`, `/` of een hele gesynchroniseerde projectmap.
Houd `allowSymlinkTargets` beperkt tot de echte Skill-root die vertrouwde
`SKILL.md`-mappen bevat.

Gerelateerd:

- [Skills-configuratie](/nl/tools/skills-config#symlinked-sibling-repos)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 vereist extra gebruik voor lange context

Gebruik dit wanneer logs/fouten het volgende bevatten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Let op:

- Geselecteerd Anthropic Opus/Sonnet-model heeft `params.context1m: true`.
- Huidige Anthropic-referentie komt niet in aanmerking voor gebruik met lange context.
- Verzoeken mislukken alleen bij lange sessies/modelruns die het 1M-bètapad nodig hebben.

Oplossingsopties:

<Steps>
  <Step title="context1m uitschakelen">
    Schakel `context1m` uit voor dat model om terug te vallen op het normale contextvenster.
  </Step>
  <Step title="Een in aanmerking komende referentie gebruiken">
    Gebruik een Anthropic-referentie die in aanmerking komt voor lange-contextverzoeken, of schakel over naar een Anthropic API-sleutel.
  </Step>
  <Step title="Fallbackmodellen configureren">
    Configureer fallbackmodellen zodat runs doorgaan wanneer Anthropic-lange-contextverzoeken worden geweigerd.
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
- incidentele waarschuwingen `incomplete turn detected ... stopReason=stop payloads=0` met een OpenAI-compatibele lokale backend
- backendcrashes die alleen optreden bij grotere prompt-tokentellingen of volledige agentruntime-prompts

<AccordionGroup>
  <Accordion title="Veelvoorkomende signatures">
    - `model_not_found` met een lokale server in MLX-/vLLM-stijl → controleer of `baseUrl` `/v1` bevat, `api` `"openai-completions"` is voor `/v1/chat/completions`-backends, en `models.providers.<provider>.models[].id` de kale provider-lokale id is. Selecteer deze één keer met de providerprefix, bijvoorbeeld `mlx/mlx-community/Qwen3-30B-A3B-6bit`; houd de catalogusentry als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend weigert gestructureerde Chat Completions-contentonderdelen. Oplossing: stel `models.providers.<provider>.models[].compat.requiresStringContent: true` in.
    - `validation.keys` of toegestane berichtsleutels zoals `["role","content"]` → backend weigert OpenAI-stijl replaymetadata op Chat Completions-berichten. Oplossing: stel `models.providers.<provider>.models[].compat.strictMessageKeys: true` in.
    - `incomplete turn detected ... stopReason=stop payloads=0` → de backend heeft het Chat Completions-verzoek voltooid maar gaf voor die beurt geen voor de gebruiker zichtbare assistenttekst terug. OpenClaw probeert replay-veilige lege OpenAI-compatibele beurten één keer opnieuw; aanhoudende fouten betekenen meestal dat de backend lege/niet-tekstuele content uitzendt of final-answer-tekst onderdrukt.
    - directe kleine verzoeken slagen, maar OpenClaw-agentruns mislukken met backend-/modelcrashes (bijvoorbeeld Gemma op sommige `inferrs`-builds) → het OpenClaw-transport is waarschijnlijk al correct; de backend faalt op de grotere promptvorm van de agentruntime.
    - fouten nemen af na het uitschakelen van tools maar verdwijnen niet → toolschema's maakten deel uit van de druk, maar het resterende probleem is nog steeds capaciteit van het upstreammodel/de server of een backendbug.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Stel `compat.requiresStringContent: true` in voor string-only Chat Completions-backends.
    2. Stel `compat.strictMessageKeys: true` in voor strikte Chat Completions-backends die alleen `role` en `content` op elk bericht accepteren.
    3. Stel `compat.supportsTools: false` in voor modellen/backends die OpenClaw's toolschema-oppervlak niet betrouwbaar kunnen verwerken.
    4. Verlaag waar mogelijk de promptdruk: kleinere workspace-bootstrap, kortere sessiegeschiedenis, lichter lokaal model of een backend met sterkere ondersteuning voor lange context.
    5. Als kleine directe verzoeken blijven slagen terwijl OpenClaw-agentbeurten nog steeds binnen de backend crashen, behandel dit dan als een upstream server-/modelbeperking en dien daar een repro in met de geaccepteerde payloadvorm.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Configuratie](/nl/gateway/configuration)
- [Lokale modellen](/nl/gateway/local-models)
- [OpenAI-compatibele endpoints](/nl/gateway/configuration-reference#openai-compatible-endpoints)

## Geen antwoorden

Als kanalen up zijn maar niets antwoordt, controleer dan routing en beleid voordat je iets opnieuw verbindt.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Let op:

- Koppeling in behandeling voor DM-afzenders.
- Groepsmention-gating (`requireMention`, `mentionPatterns`).
- Mismatches in allowlist voor kanaal/groep.

Veelvoorkomende signatures:

- `drop guild message (mention required` → groepsbericht genegeerd tot een mention.
- `pairing request` → afzender heeft goedkeuring nodig.
- `blocked` / `allowlist` → afzender/kanaal werd door beleid gefilterd.

Gerelateerd:

- [Probleemoplossing voor kanalen](/nl/channels/troubleshooting)
- [Groepen](/nl/channels/groups)
- [Koppeling](/nl/channels/pairing)

## Connectiviteit van Dashboard-control-UI

Wanneer Dashboard/control-UI geen verbinding maakt, valideer dan URL, authenticatiemodus en aannames over secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Let op:

- Juiste probe-URL en Dashboard-URL.
- Mismatch in authenticatiemodus/token tussen client en Gateway.
- HTTP-gebruik waar apparaatidentiteit vereist is.

<AccordionGroup>
  <Accordion title="Connect-/auth-signatures">
    - `device identity required` → niet-secure context of ontbrekende apparaatauthenticatie.
    - `origin not allowed` → browser-`Origin` staat niet in `gateway.controlUi.allowedOrigins` (of je verbindt vanaf een niet-loopback-browserorigin zonder expliciete allowlist).
    - `device nonce required` / `device nonce mismatch` → client voltooit de challenge-based apparaatauthflow niet (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client heeft de verkeerde payload (of verouderde timestamp) ondertekend voor de huidige handshake.
    - `AUTH_TOKEN_MISMATCH` met `canRetryWithDeviceToken=true` → client kan één vertrouwde retry doen met gecachte apparaattoken.
    - Die gecachte-tokenretry hergebruikt de gecachte scopeset die met de gekoppelde apparaattoken is opgeslagen. Callers met expliciete `deviceToken` / expliciete `scopes` behouden in plaats daarvan hun gevraagde scopeset.
    - `AUTH_SCOPE_MISMATCH` → de apparaattoken werd herkend, maar de goedgekeurde scopes dekken dit connect-verzoek niet; koppel opnieuw of keur het gevraagde scopecontract goed in plaats van een gedeelde Gateway-token te roteren.
    - Buiten dat retrypad is de connect-authenticatieprioriteit: eerst expliciete gedeelde token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken en daarna bootstrap-token.
    - Op het async Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, ip}` geserialiseerd voordat de limiter de fout registreert. Twee slechte gelijktijdige retries van dezelfde client kunnen daarom bij de tweede poging `retry later` tonen in plaats van twee gewone mismatches.
    - `too many failed authentication attempts (retry later)` van een browser-origin local loopback-client → herhaalde fouten vanaf dezelfde genormaliseerde `Origin` worden tijdelijk vergrendeld; een andere localhost-origin gebruikt een aparte bucket.
    - herhaalde `unauthorized` na die retry → drift in gedeelde token/apparaattoken; vernieuw tokenconfiguratie en keur de apparaattoken indien nodig opnieuw goed of roteer deze.
    - `gateway connect failed:` → verkeerd host-/poort-/URL-doel.

  </Accordion>
</AccordionGroup>

### Snelle kaart voor auth-detailcodes

Gebruik `error.details.code` uit de mislukte `connect`-respons om de volgende actie te kiezen:

| Detailcode                  | Betekenis                                                                                                                                                                                      | Aanbevolen actie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client heeft geen vereist gedeeld token verzonden.                                                                                                                                                 | Plak/stel het token in de client in en probeer het opnieuw. Voor dashboardpaden: `openclaw config get gateway.auth.token` en plak dit daarna in de instellingen van de Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Gedeeld token kwam niet overeen met het auth-token van de Gateway.                                                                                                                                               | Als `canRetryWithDeviceToken=true`, sta dan één vertrouwde nieuwe poging toe. Nieuwe pogingen met gecacht token hergebruiken opgeslagen goedgekeurde scopes; aanroepers met expliciete `deviceToken` / `scopes` behouden de aangevraagde scopes. Als dit nog steeds mislukt, voer dan de [checklist voor herstel van tokenverloop](/nl/cli/devices#token-drift-recovery-checklist) uit. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Gecacht token per apparaat is verouderd of ingetrokken.                                                                                                                                                 | Roteer/keur het apparaattoken opnieuw goed met de [apparaten-CLI](/nl/cli/devices) en maak daarna opnieuw verbinding.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Apparaattoken is geldig, maar de goedgekeurde rol/scopes dekken dit verbindingsverzoek niet.                                                                                                       | Koppel het apparaat opnieuw of keur het aangevraagde scopecontract goed; behandel dit niet als verloop van het gedeelde token.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Apparaatidentiteit heeft goedkeuring nodig. Controleer `error.details.reason` op `not-paired`, `scope-upgrade`, `role-upgrade` of `metadata-upgrade`, en gebruik `requestId` / `remediationHint` wanneer aanwezig. | Keur de wachtende aanvraag goed: `openclaw devices list` en daarna `openclaw devices approve <requestId>`. Scope-/rolupgrades gebruiken dezelfde flow nadat je de aangevraagde toegang hebt gecontroleerd.                                                                                                               |

<Note>
Directe loopback-backend-RPC's die zijn geauthenticeerd met het gedeelde Gateway-token/wachtwoord mogen niet afhankelijk zijn van de scopebaseline voor gekoppelde apparaten van de CLI. Als subagents of andere interne aanroepen nog steeds mislukken met `scope-upgrade`, controleer dan of de aanroeper `client.id: "gateway-client"` en `client.mode: "backend"` gebruikt en geen expliciete `deviceIdentity` of apparaattoken forceert.
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
    Client ondertekent de aan de challenge gebonden payload.
  </Step>
  <Step title="Verzend de apparaatnonce">
    Client verzendt `connect.params.device.nonce` met dezelfde challenge-nonce.
  </Step>
</Steps>

Als `openclaw devices rotate` / `revoke` / `remove` onverwacht wordt geweigerd:

- gekoppelde-apparaat-tokensessies kunnen alleen **hun eigen** apparaat beheren, tenzij de aanroeper ook `operator.admin` heeft
- `openclaw devices rotate --scope ...` kan alleen operatorscopes aanvragen die de aanroepersessie al heeft

Gerelateerd:

- [Configuratie](/nl/gateway/configuration) (Gateway-authmodi)
- [Control UI](/nl/web/control-ui)
- [Apparaten](/nl/cli/devices)
- [Externe toegang](/nl/gateway/remote)
- [Vertrouwde proxy-auth](/nl/gateway/trusted-proxy-auth)

## Gateway-service draait niet

Gebruik dit wanneer de service is geïnstalleerd maar het proces niet actief blijft.

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
- Conflicten met poorten/listeners.
- Extra launchd/systemd/schtasks-installaties wanneer `--deep` wordt gebruikt.
- Opruimhints van `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `Gateway start blocked: set gateway.mode=local` of `existing config is missing gateway.mode` → lokale Gateway-modus is niet ingeschakeld, of het configuratiebestand is overschreven en is `gateway.mode` kwijtgeraakt. Oplossing: stel `gateway.mode="local"` in je configuratie in, of voer `openclaw onboard --mode local` / `openclaw setup` opnieuw uit om de verwachte lokale-modusconfiguratie opnieuw te stempelen. Als je OpenClaw via Podman uitvoert, is het standaardconfiguratiepad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → non-loopback-bind zonder geldig Gateway-authpad (token/wachtwoord, of trusted-proxy waar geconfigureerd).
    - `another gateway instance is already listening` / `EADDRINUSE` → poortconflict.
    - `Other gateway-like services detected (best effort)` → verouderde of parallelle launchd/systemd/schtasks-units bestaan. De meeste setups moeten één Gateway per machine behouden; als je er toch meer dan één nodig hebt, isoleer dan poorten + configuratie/status/werkruimte. Zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` van doctor → er bestaat een systemd-systeemunit terwijl de service op gebruikersniveau ontbreekt. Verwijder of schakel het duplicaat uit voordat je doctor toestaat een gebruikersservice te installeren, of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in als de systeemunit de bedoelde supervisor is.
    - `Gateway service port does not match current gateway config` → de geïnstalleerde supervisor pint nog steeds de oude `--port`. Voer `openclaw doctor --fix` of `openclaw gateway install --force` uit en herstart daarna de Gateway-service.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Achtergrond-exec en procestool](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Doctor](/nl/gateway/doctor)

## Gateway heeft ongeldige configuratie geweigerd

Gebruik dit wanneer het starten van de Gateway mislukt met `Invalid config` of hot-reloadlogs zeggen
dat een ongeldige bewerking is overgeslagen.

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
- Een tijdgestempeld `openclaw.json.rejected.*`-bestand naast de actieve configuratie
- Een tijdgestempeld `openclaw.json.clobbered.*`-bestand als `doctor --fix` een kapotte directe bewerking heeft gerepareerd

<AccordionGroup>
  <Accordion title="Wat er is gebeurd">
    - De configuratie is niet gevalideerd tijdens het opstarten, hot reload of een door OpenClaw beheerde schrijfactie.
    - Het starten van de Gateway faalt gesloten in plaats van `openclaw.json` te herschrijven.
    - Hot reload slaat ongeldige externe bewerkingen over en houdt de huidige runtimeconfiguratie actief.
    - Door OpenClaw beheerde schrijfacties weigeren ongeldige/destructieve payloads vóór commit en slaan `.rejected.*` op.
    - `openclaw doctor --fix` beheert herstel. Het kan niet-JSON-prefixen verwijderen of de laatst bekende goede kopie herstellen terwijl de geweigerde payload als `.clobbered.*` behouden blijft.

  </Accordion>
  <Accordion title="Inspecteer en herstel">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Veelvoorkomende signalen">
    - `.clobbered.*` bestaat → doctor heeft een kapotte externe bewerking behouden tijdens het repareren van de actieve configuratie.
    - `.rejected.*` bestaat → een door OpenClaw beheerde configuratieschrijfactie is vóór commit mislukt op schema- of overschrijvingscontroles.
    - `Config write rejected:` → de schrijfactie probeerde vereiste vorm te verwijderen, het bestand sterk te verkleinen of ongeldige configuratie op te slaan.
    - `config reload skipped (invalid config):` → een directe bewerking faalde bij validatie en werd genegeerd door de draaiende Gateway.
    - `Invalid config at ...` → opstarten mislukte voordat Gateway-services waren gestart.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` of `size-drop-vs-last-good:*` → een door OpenClaw beheerde schrijfactie werd geweigerd omdat velden of grootte verloren gingen ten opzichte van de laatst bekende goede back-up.
    - `Config last-known-good promotion skipped` → de kandidaat bevatte geredigeerde geheime placeholders zoals `***`.

  </Accordion>
  <Accordion title="Herstelopties">
    1. Voer `openclaw doctor --fix` uit om doctor prefixed/clobbered-configuratie te laten repareren of de laatst bekende goede configuratie te herstellen.
    2. Kopieer alleen de bedoelde sleutels uit `.clobbered.*` of `.rejected.*` en pas ze daarna toe met `openclaw config set` of `config.patch`.
    3. Voer `openclaw config validate` uit voordat je herstart.
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
- Of de waarschuwing gaat over SSH-fallback, meerdere Gateways, ontbrekende scopes of onopgeloste auth-refs.

Veelvoorkomende signalen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-setup is mislukt, maar de opdracht heeft nog steeds directe geconfigureerde/loopback-doelen geprobeerd.
- `multiple reachable gateways detected` → meer dan één doel heeft geantwoord. Meestal betekent dit een bedoelde multi-Gateway-setup of verouderde/duplicaatlisteners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → verbinding werkte, maar detail-RPC is scopebeperkt; koppel apparaatidentiteit of gebruik referenties met `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → verbinding werkte, maar de volledige diagnostische RPC-set is verlopen of mislukt. Behandel dit als een bereikbare Gateway met gedegradeerde diagnostiek; vergelijk `connect.ok` en `connect.rpcOk` in `--json`-uitvoer.
- `Capability: pairing-pending` of `gateway closed (1008): pairing required` → de Gateway heeft geantwoord, maar deze client heeft nog steeds koppeling/goedkeuring nodig vóór normale operatortoegang.
- onopgeloste waarschuwingstekst voor `gateway.auth.*` / `gateway.remote.*` SecretRef → auth-materiaal was niet beschikbaar in dit opdrachtpad voor het mislukte doel.

Gerelateerd:

- [Gateway](/nl/cli/gateway)
- [Meerdere gateways op dezelfde host](/nl/gateway#multiple-gateways-same-host)
- [Externe toegang](/nl/gateway/remote)

## Kanaal verbonden, berichten stromen niet

Als de kanaalstatus verbonden is maar de berichtenstroom stilvalt, richt je dan op beleid, machtigingen en kanaalspecifieke afleverregels.

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
- Ontbrekende kanaal-API-machtigingen/scopes.

Veelvoorkomende signalen:

- `mention required` → bericht genegeerd door groepsvermeldingsbeleid.
- `pairing` / sporen van wachtende goedkeuring → afzender is niet goedgekeurd.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → probleem met kanaal-authenticatie/machtigingen.

Gerelateerd:

- [Probleemoplossing voor kanalen](/nl/channels/troubleshooting)
- [Discord](/nl/channels/discord)
- [Telegram](/nl/channels/telegram)
- [WhatsApp](/nl/channels/whatsapp)

## Cron- en Heartbeat-aflevering

Als Cron of Heartbeat niet is uitgevoerd of niet heeft afgeleverd, controleer dan eerst de plannerstatus en daarna het afleverdoel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Let op:

- Cron ingeschakeld en volgende wekmoment aanwezig.
- Status van taakuitvoeringsgeschiedenis (`ok`, `skipped`, `error`).
- Redenen waarom Heartbeat is overgeslagen (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `cron: scheduler disabled; jobs will not run automatically` → cron uitgeschakeld.
    - `cron: timer tick failed` → plannertick mislukt; controleer bestands-, log- of runtimefouten.
    - `heartbeat skipped` met `reason=quiet-hours` → buiten het actieve urenvenster.
    - `heartbeat skipped` met `reason=empty-heartbeat-file` → `HEARTBEAT.md` bestaat maar bevat alleen lege regels / markdownkoppen, dus OpenClaw slaat de modelaanroep over.
    - `heartbeat skipped` met `reason=no-tasks-due` → `HEARTBEAT.md` bevat een `tasks:`-blok, maar geen van de taken is verschuldigd bij deze tick.
    - `heartbeat: unknown accountId` → ongeldig account-id voor Heartbeat-afleverdoel.
    - `heartbeat skipped` met `reason=dm-blocked` → Heartbeat-doel is omgezet naar een DM-achtige bestemming terwijl `agents.defaults.heartbeat.directPolicy` (of een override per agent) is ingesteld op `block`.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [Geplande taken: probleemoplossing](/nl/automation/cron-jobs#troubleshooting)

## Node gekoppeld, tool faalt

Als een Node is gekoppeld maar tools falen, isoleer dan voorgrond-, machtigings- en goedkeuringsstatus.

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

Veelvoorkomende signalen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-app moet op de voorgrond staan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ontbrekende OS-machtiging.
- `SYSTEM_RUN_DENIED: approval required` → exec-goedkeuring in behandeling.
- `SYSTEM_RUN_DENIED: allowlist miss` → opdracht geblokkeerd door allowlist.

Gerelateerd:

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Probleemoplossing voor Node](/nl/nodes/troubleshooting)
- [Nodes](/nl/nodes/index)

## Browser-tool faalt

Gebruik dit wanneer browser-toolacties falen terwijl de Gateway zelf gezond is.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Let op:

- Of `plugins.allow` is ingesteld en `browser` bevat.
- Geldig pad naar browser-uitvoerbaar bestand.
- Bereikbaarheid van CDP-profiel.
- Beschikbaarheid van lokale Chrome voor `existing-session` / `user`-profielen.

<AccordionGroup>
  <Accordion title="Plugin- / uitvoerbaar-bestand-signalen">
    - `unknown command "browser"` of `unknown command 'browser'` → de gebundelde browser-Plugin is uitgesloten door `plugins.allow`.
    - browser-tool ontbreekt / is niet beschikbaar terwijl `browser.enabled=true` → `plugins.allow` sluit `browser` uit, waardoor de Plugin nooit is geladen.
    - `Failed to start Chrome CDP on port` → browserproces kon niet starten.
    - `browser.executablePath not found` → geconfigureerd pad is ongeldig.
    - `browser.cdpUrl must be http(s) or ws(s)` → de geconfigureerde CDP-URL gebruikt een niet-ondersteund schema zoals `file:` of `ftp:`.
    - `browser.cdpUrl has invalid port` → de geconfigureerde CDP-URL heeft een ongeldige poort of een poort buiten bereik.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → de huidige Gateway-installatie mist de core browser-runtime-afhankelijkheid; installeer OpenClaw opnieuw of werk OpenClaw bij en herstart daarna de Gateway. ARIA-snapshots en eenvoudige pagina-screenshots kunnen nog steeds werken, maar navigatie, AI-snapshots, element-screenshots met CSS-selector en PDF-export blijven niet beschikbaar.

  </Accordion>
  <Accordion title="Chrome MCP- / existing-session-signalen">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session kon nog niet koppelen aan de geselecteerde browsergegevensmap. Open de inspectiepagina van de browser, schakel remote debugging in, houd de browser open, keur de eerste koppelingsprompt goed en probeer opnieuw. Als aangemelde status niet vereist is, geef dan de voorkeur aan het beheerde `openclaw`-profiel.
    - `No Chrome tabs found for profile="user"` → het Chrome MCP-koppelprofiel heeft geen geopende lokale Chrome-tabbladen.
    - `Remote CDP for profile "<name>" is not reachable` → het geconfigureerde externe CDP-eindpunt is niet bereikbaar vanaf de Gateway-host.
    - `Browser attachOnly is enabled ... not reachable` of `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only-profiel heeft geen bereikbaar doel, of het HTTP-eindpunt antwoordde maar de CDP WebSocket kon nog steeds niet worden geopend.

  </Accordion>
  <Accordion title="Element- / screenshot- / uploadsignalen">
    - `fullPage is not supported for element screenshots` → screenshotverzoek combineerde `--full-page` met `--ref` of `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP- / `existing-session`-screenshotaanroepen moeten paginacaptatie of een snapshot-`--ref` gebruiken, niet CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP-uploadhooks hebben snapshotreferenties nodig, geen CSS-selectors.
    - `existing-session file uploads currently support one file at a time.` → stuur één upload per aanroep op Chrome MCP-profielen.
    - `existing-session dialog handling does not support timeoutMs.` → dialooghooks op Chrome MCP-profielen ondersteunen geen timeout-overrides.
    - `existing-session type does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:type` op `profile="user"` / Chrome MCP existing-session-profielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `existing-session evaluate does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:evaluate` op `profile="user"` / Chrome MCP existing-session-profielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vereist nog steeds een beheerde browser of raw CDP-profiel.
    - verouderde viewport- / dark-mode- / locale- / offline-overrides op attach-only- of externe CDP-profielen → voer `openclaw browser stop --browser-profile <name>` uit om de actieve controlesessie te sluiten en Playwright/CDP-emulatiestatus vrij te geven zonder de hele Gateway te herstarten.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Browser (door OpenClaw beheerd)](/nl/tools/browser)
- [Probleemoplossing voor Browser op Linux](/nl/tools/browser-linux-troubleshooting)

## Als je hebt geüpgraded en er plots iets kapotging

De meeste breuken na een upgrade zijn configuratieafwijkingen of strengere defaults die nu worden afgedwongen.

<AccordionGroup>
  <Accordion title="1. Gedrag voor auth- en URL-overrides is gewijzigd">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Wat te controleren:

    - Als `gateway.mode=remote`, kunnen CLI-aanroepen op remote gericht zijn terwijl je lokale service in orde is.
    - Expliciete `--url`-aanroepen vallen niet terug op opgeslagen inloggegevens.

    Veelvoorkomende signalen:

    - `gateway connect failed:` → verkeerd URL-doel.
    - `unauthorized` → eindpunt bereikbaar maar verkeerde auth.

  </Accordion>
  <Accordion title="2. Bind- en auth-vangrails zijn strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Wat te controleren:

    - Niet-loopback-binds (`lan`, `tailnet`, `custom`) hebben een geldig Gateway-auth-pad nodig: gedeeld token/wachtwoord-auth, of een correct geconfigureerde niet-loopback `trusted-proxy`-deployment.
    - Oude sleutels zoals `gateway.token` vervangen `gateway.auth.token` niet.

    Veelvoorkomende signalen:

    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig Gateway-auth-pad.
    - `Connectivity probe: failed` terwijl runtime draait → Gateway leeft maar is niet toegankelijk met huidige auth/url.

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

    - `device identity required` → apparaat-auth niet voldaan.
    - `pairing required` → afzender/apparaat moet worden goedgekeurd.

  </Accordion>
</AccordionGroup>

Als de serviceconfiguratie en runtime na controles nog steeds niet overeenkomen, installeer dan de servicemetadata opnieuw vanuit dezelfde profiel-/statusmap:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Gerelateerd:

- [Authenticatie](/nl/gateway/authentication)
- [Achtergrond-exec en procestool](/nl/gateway/background-process)
- [Gateway-beheerde koppeling](/nl/gateway/pairing)

## Gerelateerd

- [Doctor](/nl/gateway/doctor)
- [FAQ](/nl/help/faq)
- [Gateway-runbook](/nl/gateway)
