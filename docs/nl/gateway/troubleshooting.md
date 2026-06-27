---
read_when:
    - De probleemoplossingshub heeft je hierheen verwezen voor diepere diagnose
    - Je hebt stabiele, op symptomen gebaseerde runbooksecties nodig met exacte opdrachten
sidebarTitle: Troubleshooting
summary: Uitgebreid troubleshooting-runbook voor Gateway, kanalen, automatisering, nodes en browser
title: Probleemoplossing
x-i18n:
    generated_at: "2026-06-27T17:38:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Deze pagina is het diepgaande runbook. Begin bij [/help/troubleshooting](/nl/help/troubleshooting) als je eerst de snelle triageflow wilt.

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

## Na een update

Gebruik dit wanneer een update is voltooid maar de Gateway offline is, kanalen leeg zijn, of
modelaanroepen beginnen te mislukken met 401's.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Let op:

- `Update restart` in `openclaw status` / `openclaw status --all`. Wachtende of
  mislukte overdrachten bevatten de volgende opdracht om uit te voeren.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  onder Kanalen. Dat betekent dat de kanaalconfiguratie nog bestaat, maar dat de Plugin-
  registratie mislukte voordat het kanaal kon laden.
- provider-401's na opnieuw authenticeren. `openclaw doctor --fix` controleert op verouderde
  OAuth-authschaduwen per agent en verwijdert de oude kopieën zodat alle agents
  het huidige gedeelde profiel gebruiken.

## Split-braininstallaties en nieuwere configuratiebeveiliging

Gebruik dit wanneer een Gateway-service onverwacht stopt na een update, of logs tonen dat één `openclaw`-binary ouder is dan de versie die voor het laatst `openclaw.json` heeft geschreven.

OpenClaw markeert configuratieschrijfacties met `meta.lastTouchedVersion`. Alleen-lezen-opdrachten kunnen nog steeds een configuratie inspecteren die door een nieuwere OpenClaw is geschreven, maar proces- en servicemutaties weigeren door te gaan vanaf een oudere binary. Geblokkeerde acties omvatten het starten, stoppen, herstarten en verwijderen van de Gateway-service, geforceerde serviceherinstallatie, Gateway-start in servicemodus en `gateway --force`-poortopschoning.

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
    Verwijder verouderde systeempakketten of oude wrappervermeldingen die nog steeds naar een oude `openclaw`-binary wijzen.
  </Step>
</Steps>

<Warning>
Alleen voor bewuste downgrade of noodherstel: stel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` in voor die ene opdracht. Laat dit niet ingesteld voor normaal gebruik.
</Warning>

## Protocolmismatch na rollback

Gebruik dit wanneer logs `protocol mismatch` blijven afdrukken nadat je OpenClaw hebt gedowngraded of teruggedraaid. Dit betekent dat een oudere Gateway draait, maar dat een nieuwer lokaal clientproces nog steeds probeert opnieuw verbinding te maken met een protocolbereik dat de oudere Gateway niet ondersteunt.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Let op:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` in Gateway-logs.
- `Established clients:` in `openclaw gateway status --deep` of `Gateway clients` in `openclaw doctor --deep`. Dit toont actieve TCP-clients die verbonden zijn met de Gateway-poort, inclusief PID's en opdrachtregels wanneer het besturingssysteem dat toestaat.
- Een clientproces waarvan de opdrachtregel wijst naar de nieuwere OpenClaw-installatie of wrapper waarvan je bent teruggedraaid.

Oplossing:

1. Stop of herstart het verouderde OpenClaw-clientproces dat door `gateway status --deep` wordt getoond.
2. Herstart apps of wrappers die OpenClaw insluiten, zoals lokale dashboards, editors, app-serverhelpers of langlopende `openclaw logs --follow`-shells.
3. Voer `openclaw gateway status --deep` of `openclaw doctor --deep` opnieuw uit en bevestig dat de verouderde client-PID verdwenen is.

Laat een oudere Gateway geen nieuwer incompatibel protocol accepteren. Protocolverhogingen beschermen het wire-contract; rollbackherstel is een proces-/versieopschoningsprobleem.

## Skills-symlink overgeslagen als padontsnapping

Gebruik dit wanneer logs het volgende bevatten:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw behandelt elke Skills-root als een containmentgrens. Een symlink onder
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` of
`~/.openclaw/skills` wordt overgeslagen wanneer het echte doel buiten die root
uitkomt, tenzij het doel expliciet vertrouwd is.

Inspecteer de link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Als het doel bedoeld is, configureer dan zowel de directe Skills-root als het
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

Start daarna een nieuwe sessie of wacht tot de Skills-watcher ververst. Herstart de
Gateway als het draaiende proces van vóór de configuratiewijziging is.

Gebruik geen brede doelen zoals `~`, `/` of een volledige gesynchroniseerde projectmap.
Houd `allowSymlinkTargets` beperkt tot de echte Skills-root die vertrouwde
`SKILL.md`-mappen bevat.

Als Skill Workshop apply ook door die vertrouwde gesymlinkte
workspace-Skills-paden moet schrijven, schakel dan `skills.workshop.allowSymlinkTargetWrites` in. Houd
dit uitgeschakeld voor alleen-lezen gedeelde Skills-roots.

Gerelateerd:

- [Skills-configuratie](/nl/tools/skills-config#symlinked-skill-roots)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 extra gebruik vereist voor lange context

Gebruik dit wanneer logs/fouten bevatten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Let op:

- Geselecteerd Anthropic-model is een GA-geschikt 1M Claude 4.x-model, of het model heeft legacy `params.context1m: true`.
- Huidige Anthropic-referentie is niet geschikt voor gebruik met lange context.
- Verzoeken mislukken alleen bij lange sessies/modelruns die het 1M-contextpad nodig hebben.

Oplossingsopties:

<Steps>
  <Step title="Een standaard contextvenster gebruiken">
    Schakel over naar een model met standaardvenster, of verwijder legacy `context1m` uit oudere
    modelconfiguratie die niet GA-geschikt is voor 1M-context.
  </Step>
  <Step title="Een geschikte referentie gebruiken">
    Gebruik een Anthropic-referentie die geschikt is voor lange-contextverzoeken, of schakel over naar een Anthropic-API-sleutel.
  </Step>
  <Step title="Fallbackmodellen configureren">
    Configureer fallbackmodellen zodat runs doorgaan wanneer Anthropic-lange-contextverzoeken worden geweigerd.
  </Step>
</Steps>

Gerelateerd:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Waarom zie ik HTTP 429 van Anthropic?](/nl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Upstream 403-geblokkeerde reacties

Gebruik dit wanneer een upstream LLM-provider een generieke `403` retourneert, zoals
`Your request was blocked`.

Ga er niet van uit dat dit altijd een configuratieprobleem van OpenClaw is. De reactie kan
komen van een upstream beveiligingslaag zoals een CDN, WAF, botbeheerregel of
reverse proxy vóór een OpenAI-compatibel endpoint.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Let op:

- meerdere modellen onder dezelfde provider falen op dezelfde manier
- HTML of generieke beveiligingstekst in plaats van een normale provider-API-fout
- beveiligingsgebeurtenissen aan providerzijde voor hetzelfde verzoekmoment
- een kleine directe `curl`-probe slaagt terwijl normale SDK-vormige verzoeken mislukken

Los eerst de filtering aan providerzijde op wanneer het bewijs wijst op een WAF/CDN-
blokkade. Geef de voorkeur aan een nauw afgebakende allow- of skipregel voor het API-pad dat OpenClaw
gebruikt, en vermijd het uitschakelen van bescherming voor de hele site.

<Warning>
Een succesvolle minimale `curl` garandeert niet dat echte SDK-stijlverzoeken door
dezelfde upstream beveiligingslaag komen.
</Warning>

Gerelateerd:

- [OpenAI-compatibele endpoints](/nl/gateway/configuration-reference#openai-compatible-endpoints)
- [Providerconfiguratie](/nl/providers)
- [Logs](/nl/logging)

## Lokale OpenAI-compatibele backend slaagt voor directe probes maar agentruns mislukken

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
- `model_not_found`- of 404-fouten ook al werkt directe `/v1/chat/completions`
  met dezelfde kale model-id
- backendfouten over `messages[].content` die een string verwachten
- intermitterende waarschuwingen `incomplete turn detected ... stopReason=stop payloads=0` met een OpenAI-compatibele lokale backend
- backendcrashes die alleen verschijnen bij grotere prompt-tokenaantallen of volledige agent-runtimeprompts

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `model_not_found` met een lokale MLX-/vLLM-achtige server → controleer of `baseUrl` `/v1` bevat, `api` `"openai-completions"` is voor `/v1/chat/completions`-backends, en `models.providers.<provider>.models[].id` de kale provider-lokale id is. Selecteer deze één keer met het providerprefix, bijvoorbeeld `mlx/mlx-community/Qwen3-30B-A3B-6bit`; houd de catalogusvermelding als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend weigert gestructureerde Chat Completions-contentdelen. Oplossing: stel `models.providers.<provider>.models[].compat.requiresStringContent: true` in.
    - `validation.keys` of toegestane berichtsleutels zoals `["role","content"]` → backend weigert OpenAI-stijl replaymetadata op Chat Completions-berichten. Oplossing: stel `models.providers.<provider>.models[].compat.strictMessageKeys: true` in.
    - `incomplete turn detected ... stopReason=stop payloads=0` → de backend voltooide het Chat Completions-verzoek maar retourneerde geen voor de gebruiker zichtbare assistenttekst voor die beurt. OpenClaw probeert replay-veilige lege OpenAI-compatibele beurten één keer opnieuw; aanhoudende fouten betekenen meestal dat de backend lege/niet-tekstuele content uitzendt of finale-antwoordtekst onderdrukt.
    - directe kleine verzoeken slagen, maar OpenClaw-agentruns mislukken met backend-/modelcrashes (bijvoorbeeld Gemma op sommige `inferrs`-builds) → OpenClaw-transport is waarschijnlijk al correct; de backend faalt op de grotere promptvorm van de agentruntime.
    - fouten nemen af na het uitschakelen van tools maar verdwijnen niet → toolschema's maakten deel uit van de druk, maar het resterende probleem is nog steeds upstream model-/servercapaciteit of een backendbug.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Stel `compat.requiresStringContent: true` in voor string-only Chat Completions-backends.
    2. Stel `compat.strictMessageKeys: true` in voor strikte Chat Completions-backends die alleen `role` en `content` op elk bericht accepteren.
    3. Stel `compat.supportsTools: false` in voor modellen/backends die OpenClaw's toolschemaoppervlak niet betrouwbaar aankunnen.
    4. Verlaag promptdruk waar mogelijk: kleinere workspace-bootstrap, kortere sessiegeschiedenis, lichter lokaal model of een backend met sterkere ondersteuning voor lange context.
    5. Als kleine directe verzoeken blijven slagen terwijl OpenClaw-agentbeurten nog steeds binnen de backend crashen, behandel dit dan als een upstream server-/modelbeperking en dien daar een repro in met de geaccepteerde payloadvorm.
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
- Groepsvermelding-gating (`requireMention`, `mentionPatterns`).
- Mismatches in de allowlist voor kanaal/groep.

Veelvoorkomende kenmerken:

- `drop guild message (mention required` → groepsbericht genegeerd tot vermelding.
- `pairing request` → afzender heeft goedkeuring nodig.
- `blocked` / `allowlist` → afzender/kanaal is door beleid gefilterd.

Gerelateerd:

- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
- [Groepen](/nl/channels/groups)
- [Koppeling](/nl/channels/pairing)

## Connectiviteit van dashboard/control-UI

Wanneer de dashboard/control-UI geen verbinding maakt, valideer dan de URL, auth-modus en aannames over de veilige context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Let op:

- Juiste probe-URL en dashboard-URL.
- Mismatch in auth-modus/token tussen client en gateway.
- HTTP-gebruik waar apparaatidentiteit vereist is.

Als een lokale browser na een update geen verbinding kan maken met `127.0.0.1:18789`, herstel dan eerst de lokale Gateway-service en bevestig dat deze het dashboard serveert:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Als `curl` OpenClaw-HTML teruggeeft, werkt de Gateway en is het resterende probleem waarschijnlijk browsercache, een oude dieplink of verouderde tabbladstatus. Open `http://127.0.0.1:18789` rechtstreeks en navigeer vanaf het dashboard. Als herstarten de service niet actief laat, voer dan `openclaw gateway start` uit en controleer `openclaw gateway status` opnieuw.

<AccordionGroup>
  <Accordion title="Verbindings-/auth-kenmerken">
    - `device identity required` → niet-veilige context of ontbrekende apparaatauthenticatie.
    - `origin not allowed` → browser-`Origin` staat niet in `gateway.controlUi.allowedOrigins` (of je verbindt vanaf een niet-loopback browser-origin zonder expliciete allowlist).
    - `device nonce required` / `device nonce mismatch` → client voltooit de op challenge gebaseerde apparaatauthenticatiestroom niet (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client heeft de verkeerde payload (of een verouderde timestamp) ondertekend voor de huidige handshake.
    - `AUTH_TOKEN_MISMATCH` met `canRetryWithDeviceToken=true` → client kan één vertrouwde nieuwe poging doen met gecachte apparaattoken.
    - Die nieuwe poging met gecachte token hergebruikt de gecachte scopeset die is opgeslagen met de gekoppelde apparaattoken. Aanroepers met expliciete `deviceToken` / expliciete `scopes` behouden in plaats daarvan hun aangevraagde scopeset.
    - `AUTH_SCOPE_MISMATCH` → de apparaattoken is herkend, maar de goedgekeurde scopes dekken dit verbindingsverzoek niet; koppel opnieuw of keur het aangevraagde scopecontract goed in plaats van een gedeelde Gateway-token te roteren.
    - Buiten dat pad voor opnieuw proberen is de auth-prioriteit voor verbinden: eerst expliciete gedeelde token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstrap-token.
    - Op het asynchrone Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, ip}` geserialiseerd voordat de limiter de fout registreert. Twee slechte gelijktijdige nieuwe pogingen vanaf dezelfde client kunnen daarom bij de tweede poging `retry later` tonen in plaats van twee gewone mismatches.
    - `too many failed authentication attempts (retry later)` vanaf een browser-origin loopback-client → herhaalde fouten vanaf dezelfde genormaliseerde `Origin` worden tijdelijk buitengesloten; een andere localhost-origin gebruikt een aparte bucket.
    - herhaalde `unauthorized` na die nieuwe poging → drift in gedeelde token/apparaattoken; vernieuw de tokenconfiguratie en keur de apparaattoken indien nodig opnieuw goed of roteer deze.
    - `gateway connect failed:` → verkeerd host-/poort-/URL-doel.

  </Accordion>
</AccordionGroup>

### Snelle kaart voor auth-detailcodes

Gebruik `error.details.code` uit de mislukte `connect`-respons om de volgende actie te kiezen:

| Detailcode                   | Betekenis                                                                                                                                                                                    | Aanbevolen actie                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client heeft geen vereiste gedeelde token verzonden.                                                                                                                                         | Plak/stel de token in de client in en probeer opnieuw. Voor dashboardpaden: `openclaw config get gateway.auth.token` en plak daarna in de Control UI-instellingen.                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | Gedeelde token kwam niet overeen met de auth-token van de gateway.                                                                                                                           | Als `canRetryWithDeviceToken=true`, sta dan één vertrouwde nieuwe poging toe. Nieuwe pogingen met gecachte token hergebruiken opgeslagen goedgekeurde scopes; aanroepers met expliciete `deviceToken` / `scopes` behouden aangevraagde scopes. Als het nog steeds mislukt, voer dan de [checklist voor herstel van tokendrift](/nl/cli/devices#token-drift-recovery-checklist) uit. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Gecachte token per apparaat is verouderd of ingetrokken.                                                                                                                                     | Roteer/keur de apparaattoken opnieuw goed met de [apparaten-CLI](/nl/cli/devices), en verbind daarna opnieuw.                                                                                                                                                                                |
| `AUTH_SCOPE_MISMATCH`        | Apparaattoken is geldig, maar de goedgekeurde rol/scopes dekken dit verbindingsverzoek niet.                                                                                                | Koppel het apparaat opnieuw of keur het aangevraagde scopecontract goed; behandel dit niet als drift van gedeelde tokens.                                                                                                                                                                 |
| `PAIRING_REQUIRED`           | Apparaatidentiteit heeft goedkeuring nodig. Controleer `error.details.reason` voor `not-paired`, `scope-upgrade`, `role-upgrade` of `metadata-upgrade`, en gebruik `requestId` / `remediationHint` indien aanwezig. | Keur openstaand verzoek goed: `openclaw devices list` en daarna `openclaw devices approve <requestId>`. Scope-/rolupgrades gebruiken dezelfde stroom nadat je de aangevraagde toegang hebt beoordeeld.                                                                                  |

<Note>
Directe loopback-backend-RPC's die zijn geauthenticeerd met de gedeelde Gateway-token/het gedeelde Gateway-wachtwoord zouden niet afhankelijk moeten zijn van de scopebasislijn van gekoppelde apparaten van de CLI. Als subagenten of andere interne aanroepen nog steeds mislukken met `scope-upgrade`, controleer dan of de aanroeper `client.id: "gateway-client"` en `client.mode: "backend"` gebruikt en geen expliciete `deviceIdentity` of apparaattoken afdwingt.
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
    Client wacht op de door de gateway uitgegeven `connect.challenge`.
  </Step>
  <Step title="Onderteken de payload">
    Client ondertekent de aan de challenge gebonden payload.
  </Step>
  <Step title="Verzend de apparaatnonce">
    Client verzendt `connect.params.device.nonce` met dezelfde challenge-nonce.
  </Step>
</Steps>

Als `openclaw devices rotate` / `revoke` / `remove` onverwacht wordt geweigerd:

- gekoppelde-apparaattokensessies kunnen alleen **hun eigen** apparaat beheren, tenzij de aanroeper ook `operator.admin` heeft
- `openclaw devices rotate --scope ...` kan alleen operatorscopes aanvragen die de aanroepersessie al heeft

Gerelateerd:

- [Configuratie](/nl/gateway/configuration) (Gateway-auth-modi)
- [Control UI](/nl/web/control-ui)
- [Apparaten](/nl/cli/devices)
- [Externe toegang](/nl/gateway/remote)
- [Vertrouwde-proxy-auth](/nl/gateway/trusted-proxy-auth)

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

- `Runtime: stopped` met exithints.
- Mismatch in serviceconfiguratie (`Config (cli)` vs `Config (service)`).
- Poort-/listenerconflicten.
- Extra launchd/systemd/schtasks-installaties wanneer `--deep` wordt gebruikt.
- Opruimhints voor `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Veelvoorkomende kenmerken">
    - `Gateway start blocked: set gateway.mode=local` of `existing config is missing gateway.mode` → lokale gatewaymodus is niet ingeschakeld, of het configuratiebestand is overschreven en `gateway.mode` is verloren gegaan. Oplossing: stel `gateway.mode="local"` in je configuratie in, of voer `openclaw onboard --mode local` / `openclaw setup` opnieuw uit om de verwachte lokale-modusconfiguratie opnieuw te stempelen. Als je OpenClaw via Podman uitvoert, is het standaardconfiguratiepad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → niet-loopback bind zonder geldig Gateway-auth-pad (token/wachtwoord, of vertrouwde proxy waar geconfigureerd).
    - `another gateway instance is already listening` / `EADDRINUSE` → poortconflict.
    - `Other gateway-like services detected (best effort)` → er bestaan verouderde of parallelle launchd/systemd/schtasks-units. De meeste setups zouden één gateway per machine moeten houden; als je er toch meer dan één nodig hebt, isoleer dan poorten + configuratie/status/werkruimte. Zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` van doctor → er bestaat een systemd-systeemunit terwijl de service op gebruikersniveau ontbreekt. Verwijder of schakel het duplicaat uit voordat je doctor toestaat een gebruikersservice te installeren, of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in als de systeemunit de bedoelde supervisor is.
    - `Gateway service port does not match current gateway config` → de geïnstalleerde supervisor pint nog steeds de oude `--port`. Voer `openclaw doctor --fix` of `openclaw gateway install --force` uit en herstart daarna de Gateway-service.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Achtergrondexec en procestool](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Doctor](/nl/gateway/doctor)

## macOS-gateway reageert stilzwijgend niet meer en hervat daarna wanneer je het dashboard aanraakt

Gebruik dit wanneer kanalen (Telegram, WhatsApp, enz.) op een macOS-host minuten tot uren tegelijk stilvallen, en de gateway lijkt terug te komen zodra je de Control UI opent, via SSH inlogt of anderszins met de host interageert. Er is meestal geen duidelijk symptoom in `openclaw status`, omdat de gateway tegen de tijd dat je kijkt alweer leeft.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Let op:

- Een of meer `*-uncaught_exception.json`-bundels in `~/.openclaw/logs/stability/` waarbij `error.code` is ingesteld op een tijdelijke netwerkcode zoals `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` of `ECONNREFUSED`.
- `pmset -g log`-regels zoals `Entering Sleep state due to 'Maintenance Sleep'` of `en0 driver is slow (msg: WillChangeState to 0)` die samenvallen met de crashtijdstempels. Power Nap / Maintenance Sleep zet het wifi-stuurprogramma kort in status 0; elke uitgaande `connect()` die in dat venster valt, kan mislukken met `ENETDOWN`, zelfs op een host die verder volledige netwerkconnectiviteit heeft.
- `launchctl print`-uitvoer met `state = not running`, meerdere recente `runs` en een exitcode, vooral wanneer de periode tussen de crash en de volgende start eerder rond een uur ligt dan rond seconden. macOS launchd past na een crashreeks een niet-gedocumenteerde herstartbeveiliging toe die `KeepAlive=true` kan blijven negeren totdat een externe trigger, zoals interactief inloggen, een dashboardverbinding of `launchctl kickstart`, deze opnieuw activeert.

Veelvoorkomende signalen:

- Een stabiliteitsbundel waarvan `error.code` `ENETDOWN` of een verwante code is, met een callstack die wijst naar Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` en nieuwer classificeren deze als onschuldige tijdelijke netwerkfouten, zodat ze niet langer doorlopen naar de uncaught handler op topniveau; als je een oudere release gebruikt, upgrade dan eerst.
- Lange stille perioden die precies eindigen zodra je verbinding maakt met de Control UI of via SSH inlogt op de host: de gebruikerszichtbare activiteit is wat de herstartbeveiliging van launchd opnieuw activeert, niet iets wat het dashboard met de gateway doet.
- Een `runs`-aantal dat gedurende de dag oploopt zonder overeenkomstige regel `received SIG*; shutting down` in `~/Library/Logs/openclaw/gateway.log`: schone afsluitingen loggen een signaal; tijdelijke crashes doen dat niet.

Wat te doen:

1. **Upgrade de gateway** als je een release vóór `2026.5.26` gebruikt. Na de upgrade worden toekomstige `ENETDOWN`-fouten als waarschuwingen gelogd in plaats van het proces te beëindigen.
2. **Verminder onderhoudsslaapactiviteit** op Mac mini- / desktophosts die bedoeld zijn om als altijd-aan-servers te draaien:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Dit vermindert de onderliggende driverflap aanzienlijk, maar elimineert deze niet volledig. Het systeem kan nog steeds bepaalde onderhoudsslaapstanden uitvoeren voor TCP-keepalive en mDNS-onderhoud, ongeacht deze vlaggen.

3. **Voeg een liveness-watchdog toe**, zodat een toekomstige crashreeks die door launchd wordt geparkeerd snel wordt opgemerkt:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Het doel is om de herstartbeveiliging extern opnieuw te activeren; `KeepAlive=true` alleen is op macOS na een crashreeks niet voldoende.

Gerelateerd:

- [macOS-platformnotities](/nl/platforms/macos)
- [Logboekregistratie](/nl/logging)
- [Doctor](/nl/gateway/doctor)

## Gateway sluit af bij hoog geheugengebruik

Gebruik dit wanneer de Gateway onder belasting verdwijnt, de supervisor een OOM-achtige herstart meldt, of logs `critical memory pressure bundle written` vermelden.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Let op:

- `Reason: diagnostic.memory.pressure.critical` in de nieuwste stabiliteitsbundel.
- `Memory pressure:` met `critical/rss_threshold`, `critical/heap_threshold` of `critical/rss_growth`.
- `V8 heap:`-waarden dicht bij de heaplimiet.
- `Largest session files:`-items zoals `agents/<agent>/sessions/<session>.jsonl` of `sessions/<session>.jsonl`.
- Linux cgroup-geheugentellers wanneer de gateway in een container of service met geheugenlimiet draait.

Veelvoorkomende signalen:

- `critical memory pressure bundle written` verschijnt kort voor de herstart → OpenClaw heeft een pre-OOM-stabiliteitsbundel vastgelegd. Inspecteer deze met `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` verschijnt in gatewaylogs → OpenClaw heeft kritieke geheugendruk gedetecteerd, maar de pre-OOM-stabiliteitssnapshot staat uit.
- `Largest session files:` wijst naar een zeer groot geredigeerd transcriptpad → verminder de bewaarde sessiegeschiedenis, inspecteer sessiegroei, of verplaats oude transcripties uit de actieve opslag voordat je opnieuw start.
- Gebruikte bytes bij `V8 heap:` liggen dicht bij de heaplimiet → verlaag prompt-/sessiedruk, verminder gelijktijdig werk, of verhoog de Node-heaplimiet pas nadat je hebt bevestigd dat de workload verwacht is.
- `Memory pressure: critical/rss_growth` → geheugen groeide snel binnen één samplingvenster. Controleer de nieuwste logs op een grote import, ontspoorde tooluitvoer, herhaalde retries of een batch wachtrijwerk van agents.
- Kritieke geheugendruk verschijnt in logs maar er bestaat geen bundel → dit is de standaardinstelling. Stel `diagnostics.memoryPressureSnapshot: true` in om de pre-OOM-stabiliteitsbundel vast te leggen bij toekomstige kritieke geheugendrukgebeurtenissen.

De stabiliteitsbundel bevat geen payload. Deze bevat operationeel geheugenbewijs en geredigeerde relatieve bestandspaden, geen berichttekst, webhook-bodies, referenties, tokens, cookies of ruwe sessie-id's. Voeg de diagnostiekexport toe aan bugrapporten in plaats van ruwe logs te kopiëren.

Gerelateerd:

- [Gateway-gezondheid](/nl/gateway/health)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Sessies](/nl/cli/sessions)

## Gateway heeft ongeldige configuratie geweigerd

Gebruik dit wanneer het opstarten van de Gateway mislukt met `Invalid config` of hot-reloadlogs zeggen
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
- Een getijdstempeld bestand `openclaw.json.rejected.*` naast de actieve configuratie
- Een getijdstempeld bestand `openclaw.json.clobbered.*` als `doctor --fix` een kapotte directe bewerking heeft gerepareerd
- OpenClaw bewaart de nieuwste 32 `.clobbered.*`-bestanden voor elk configuratiepad en roteert oudere bestanden

<AccordionGroup>
  <Accordion title="What happened">
    - De configuratie valideerde niet tijdens het opstarten, hot reload, of een schrijfactie die eigendom is van OpenClaw.
    - Het opstarten van de Gateway faalt gesloten in plaats van `openclaw.json` te herschrijven.
    - Hot reload slaat ongeldige externe bewerkingen over en houdt de huidige runtimeconfiguratie actief.
    - Schrijfacties die eigendom zijn van OpenClaw weigeren ongeldige/destructieve payloads vóór commit en slaan `.rejected.*` op.
    - `openclaw doctor --fix` is eigenaar van reparatie. Het kan niet-JSON-prefixen verwijderen of de laatst bekende goede kopie herstellen, terwijl de geweigerde payload als `.clobbered.*` behouden blijft.
    - Wanneer er veel reparaties plaatsvinden voor één configuratiepad, roteert OpenClaw oudere `.clobbered.*`-bestanden zodat de nieuwste gerepareerde payload beschikbaar blijft.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` bestaat → doctor heeft een kapotte externe bewerking behouden terwijl de actieve configuratie werd gerepareerd.
    - `.rejected.*` bestaat → een configuratieschrijfactie die eigendom is van OpenClaw faalde schema- of clobbercontroles vóór commit.
    - `Config write rejected:` → de schrijfactie probeerde de vereiste vorm te laten vallen, het bestand sterk te verkleinen, of ongeldige configuratie vast te leggen.
    - `config reload skipped (invalid config):` → een directe bewerking faalde validatie en werd genegeerd door de draaiende Gateway.
    - `Invalid config at ...` → opstarten faalde voordat Gateway-services werden gestart.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` of `size-drop-vs-last-good:*` → een schrijfactie die eigendom is van OpenClaw werd geweigerd omdat velden of grootte verloren gingen vergeleken met de laatst bekende goede back-up.
    - `Config last-known-good promotion skipped` → de kandidaat bevatte geredigeerde geheime placeholders zoals `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Voer `openclaw doctor --fix` uit om doctor prefixed/clobbered-configuratie te laten repareren of last-known-good te laten herstellen.
    2. Kopieer alleen de bedoelde sleutels uit `.clobbered.*` of `.rejected.*` en pas ze vervolgens toe met `openclaw config set` of `config.patch`.
    3. Voer `openclaw config validate` uit voordat je opnieuw start.
    4. Als je handmatig bewerkt, behoud dan de volledige JSON5-configuratie, niet alleen het gedeeltelijke object dat je wilde wijzigen.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Configuratie](/nl/cli/config)
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
- Of de waarschuwing gaat over SSH-fallback, meerdere gateways, ontbrekende scopes of onopgeloste auth-refs.

Veelvoorkomende signalen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-configuratie faalde, maar de opdracht probeerde nog steeds directe geconfigureerde/local loopback-doelen.
- `multiple reachable gateway identities detected` → verschillende gateways hebben geantwoord, of OpenClaw kon niet bewijzen dat bereikbare doelen dezelfde gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde externe URL naar dezelfde gateway wordt behandeld als één gateway met meerdere transports, zelfs wanneer transportpoorten verschillen.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → verbinden werkte, maar detail-RPC is beperkt door scopes; koppel apparaatidentiteit of gebruik referenties met `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → verbinden werkte, maar de volledige set diagnostische RPC's kreeg een timeout of faalde. Behandel dit als een bereikbare Gateway met gedegradeerde diagnostiek; vergelijk `connect.ok` en `connect.rpcOk` in `--json`-uitvoer.
- `Capability: pairing-pending` of `gateway closed (1008): pairing required` → de gateway antwoordde, maar deze client moet nog worden gekoppeld/goedgekeurd vóór normale operatortoegang.
- onopgeloste waarschuwingstekst voor `gateway.auth.*` / `gateway.remote.*` SecretRef → auth-materiaal was in dit opdrachtpad niet beschikbaar voor het mislukte doel.

Gerelateerd:

- [Gateway](/nl/cli/gateway)
- [Meerdere gateways op dezelfde host](/nl/gateway#multiple-gateways-same-host)
- [Externe toegang](/nl/gateway/remote)

## Kanaal verbonden, berichten stromen niet

Als de kanaalstatus verbonden is maar de berichtenstroom dood is, focus dan op beleid, machtigingen en kanaalspecifieke bezorgregels.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Let op:

- DM-beleid (`pairing`, `allowlist`, `open`, `disabled`).
- Groepsallowlist en vermeldingsvereisten.
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

## Cron- en Heartbeat-bezorging

Als cron of heartbeat niet heeft gedraaid of niet is bezorgd, verifieer dan eerst de schedulerstatus en daarna het bezorgdoel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Let op:

- Cron ingeschakeld en volgende activering aanwezig.
- Status van taakuitvoeringsgeschiedenis (`ok`, `skipped`, `error`).
- Redenen voor overgeslagen Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Veelvoorkomende signalen">
    - `cron: scheduler disabled; jobs will not run automatically` → cron uitgeschakeld.
    - `cron: timer tick failed` → plannertick mislukt; controleer bestands-, log- en runtimefouten.
    - `heartbeat skipped` met `reason=quiet-hours` → buiten het venster met actieve uren.
    - `heartbeat skipped` met `reason=empty-heartbeat-file` → `HEARTBEAT.md` bestaat maar bevat alleen lege, commentaar-, kop-, fence- of lege-checkliststructuur, dus OpenClaw slaat de modelaanroep over.
    - `heartbeat skipped` met `reason=no-tasks-due` → `HEARTBEAT.md` bevat een `tasks:`-blok, maar geen van de taken is aan de beurt bij deze tick.
    - `heartbeat: unknown accountId` → ongeldig account-id voor Heartbeat-afleverdoel.
    - `heartbeat skipped` met `reason=dm-blocked` → Heartbeat-doel is herleid tot een DM-achtige bestemming terwijl `agents.defaults.heartbeat.directPolicy` (of een override per agent) is ingesteld op `block`.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [Geplande taken: probleemoplossing](/nl/automation/cron-jobs#troubleshooting)

## Node gekoppeld, tool mislukt

Als een Node gekoppeld is maar tools mislukken, isoleer dan voorgrond-, toestemmings- en goedkeuringsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Let op:

- Node online met verwachte mogelijkheden.
- OS-toestemmingen voor camera/microfoon/locatie/scherm.
- Exec-goedkeuringen en allowlist-status.

Veelvoorkomende signalen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-app moet op de voorgrond staan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ontbrekende OS-toestemming.
- `SYSTEM_RUN_DENIED: approval required` → exec-goedkeuring in behandeling.
- `SYSTEM_RUN_DENIED: allowlist miss` → opdracht geblokkeerd door allowlist.

Gerelateerd:

- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- [Node-probleemoplossing](/nl/nodes/troubleshooting)
- [Nodes](/nl/nodes/index)

## Browsertool mislukt

Gebruik dit wanneer acties van de browsertool mislukken, ook al is de Gateway zelf gezond.

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
  <Accordion title="Plugin- / uitvoerbaar-bestandssignalen">
    - `unknown command "browser"` of `unknown command 'browser'` → de meegeleverde browser-Plugin is uitgesloten door `plugins.allow`.
    - browsertool ontbreekt / is niet beschikbaar terwijl `browser.enabled=true` → `plugins.allow` sluit `browser` uit, waardoor de Plugin nooit is geladen.
    - `Failed to start Chrome CDP on port` → browserproces kon niet worden gestart.
    - `browser.executablePath not found` → geconfigureerd pad is ongeldig.
    - `browser.cdpUrl must be http(s) or ws(s)` → de geconfigureerde CDP-URL gebruikt een niet-ondersteund schema zoals `file:` of `ftp:`.
    - `browser.cdpUrl has invalid port` → de geconfigureerde CDP-URL heeft een ongeldige poort of een poort buiten bereik.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → de huidige Gateway-installatie mist de kernruntimeafhankelijkheid voor de browser; installeer OpenClaw opnieuw of werk het bij en herstart daarna de Gateway. ARIA-snapshots en eenvoudige paginaschermafbeeldingen kunnen nog werken, maar navigatie, AI-snapshots, schermafbeeldingen van elementen via CSS-selectors en PDF-export blijven niet beschikbaar.

  </Accordion>
  <Accordion title="Chrome MCP- / existing-session-signalen">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session kon nog niet koppelen aan de geselecteerde browsergegevensmap. Open de inspectiepagina van de browser, schakel remote debugging in, houd de browser open, keur de eerste koppelprompt goed en probeer het opnieuw. Als aangemelde status niet vereist is, geef dan de voorkeur aan het beheerde `openclaw`-profiel.
    - `No Chrome tabs found for profile="user"` → het Chrome MCP-koppelprofiel heeft geen geopende lokale Chrome-tabbladen.
    - `Remote CDP for profile "<name>" is not reachable` → het geconfigureerde externe CDP-eindpunt is niet bereikbaar vanaf de Gateway-host.
    - `Browser attachOnly is enabled ... not reachable` of `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only-profiel heeft geen bereikbaar doel, of het HTTP-eindpunt antwoordde maar de CDP-WebSocket kon nog steeds niet worden geopend.

  </Accordion>
  <Accordion title="Element- / schermafbeelding- / uploadsignalen">
    - `fullPage is not supported for element screenshots` → schermafbeeldingsverzoek combineerde `--full-page` met `--ref` of `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP- / `existing-session`-schermafbeeldingsaanroepen moeten paginacapture of een snapshot-`--ref` gebruiken, niet CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP-uploadhooks hebben snapshotrefs nodig, geen CSS-selectors.
    - `existing-session file uploads currently support one file at a time.` → verstuur één upload per aanroep op Chrome MCP-profielen.
    - `existing-session dialog handling does not support timeoutMs.` → dialooghooks op Chrome MCP-profielen ondersteunen geen timeout-overrides.
    - `existing-session type does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:type` op `profile="user"`- / Chrome MCP existing-session-profielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `existing-session evaluate does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:evaluate` op `profile="user"`- / Chrome MCP existing-session-profielen, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste timeout vereist is.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vereist nog steeds een beheerde browser of raw CDP-profiel.
    - verouderde viewport- / dark-mode- / locale- / offline-overrides op attach-only- of externe CDP-profielen → voer `openclaw browser stop --browser-profile <name>` uit om de actieve controlesessie te sluiten en de Playwright/CDP-emulatiestatus vrij te geven zonder de hele Gateway opnieuw te starten.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Browser (beheerd door OpenClaw)](/nl/tools/browser)
- [Browser-probleemoplossing](/nl/tools/browser-linux-troubleshooting)

## Als je hebt geüpgraded en er plotseling iets stukging

De meeste breuken na een upgrade zijn configuratiedrift of strengere defaults die nu worden afgedwongen.

<AccordionGroup>
  <Accordion title="1. Gedrag voor auth en URL-override is gewijzigd">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Wat te controleren:

    - Als `gateway.mode=remote`, kunnen CLI-aanroepen op remote gericht zijn terwijl je lokale service in orde is.
    - Expliciete `--url`-aanroepen vallen niet terug op opgeslagen referenties.

    Veelvoorkomende signalen:

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

    - Niet-loopback-binds (`lan`, `tailnet`, `custom`) hebben een geldig Gateway-auth-pad nodig: gedeelde token-/wachtwoordauth, of een correct geconfigureerde niet-loopback-`trusted-proxy`-implementatie.
    - Oude sleutels zoals `gateway.token` vervangen `gateway.auth.token` niet.

    Veelvoorkomende signalen:

    - `refusing to bind gateway ... without auth` → niet-loopback-bind zonder geldig Gateway-auth-pad.
    - `Connectivity probe: failed` terwijl runtime draait → Gateway leeft maar is niet toegankelijk met huidige auth/url.

  </Accordion>
  <Accordion title="3. Koppeling en apparaatidentiteitsstatus zijn gewijzigd">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Wat te controleren:

    - Apparaatgoedkeuringen in behandeling voor dashboard/nodes.
    - DM-koppelingsgoedkeuringen in behandeling na beleids- of identiteitswijzigingen.

    Veelvoorkomende signalen:

    - `device identity required` → apparaat-auth niet voldaan.
    - `pairing required` → afzender/apparaat moet worden goedgekeurd.

  </Accordion>
</AccordionGroup>

Als serviceconfiguratie en runtime na controles nog steeds niet overeenkomen, installeer dan servicemetadata opnieuw vanuit dezelfde profiel-/statusmap:

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
