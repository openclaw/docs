---
read_when:
    - De hub voor probleemoplossing heeft je hierheen verwezen voor een grondigere diagnose
    - Je hebt stabiele, op symptomen gebaseerde runbooksecties met exacte commando's nodig
sidebarTitle: Troubleshooting
summary: Uitgebreid draaiboek voor probleemoplossing voor Gateway, kanalen, automatisering, Nodes en browser
title: Probleemoplossing
x-i18n:
    generated_at: "2026-07-16T15:53:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Dit is het uitgebreide draaiboek. Begin eerst bij [/help/probleemoplossing](/nl/help/troubleshooting) voor het snelle triageproces.

## Opdrachtvolgorde

Voer dit in deze volgorde uit:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signalen dat alles goed werkt:

- `openclaw gateway status` toont `Runtime: running`, `Connectivity probe: ok` en een regel `Capability: ...`.
- `openclaw doctor` meldt geen blokkerende configuratie- of serviceproblemen.
- `openclaw channels status --probe` toont de actuele transportstatus per account en, waar ondersteund, `works` of `audit ok`.

## Na een update

Gebruik dit wanneer een update is voltooid, maar de Gateway niet actief is, kanalen leeg zijn of modelaanroepen mislukken met 401-fouten.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Let op:

- `Update restart` in `openclaw status` / `openclaw status --all`. Openstaande of mislukte overdrachten vermelden de volgende opdracht die je moet uitvoeren.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` onder Kanalen: de kanaalconfiguratie bestaat nog, maar de registratie van de Plugin is mislukt voordat het kanaal kon worden geladen.
- 401-fouten van providers na herauthenticatie: `openclaw doctor --fix` controleert op verouderde OAuth-authenticatieschaduwen per agent en verwijdert oude kopieën, zodat alle agents het huidige gedeelde profiel gebruiken.

## Gesplitste installaties en beveiliging tegen nieuwere configuratie

Gebruik dit wanneer een Gateway-service na een update onverwacht stopt, of wanneer uit de logboeken blijkt dat een `openclaw`-binair bestand ouder is dan de versie die `openclaw.json` het laatst heeft geschreven.

OpenClaw voorziet configuratiewijzigingen van `meta.lastTouchedVersion`. Alleen-lezenopdrachten kunnen een configuratie inspecteren die door een nieuwere OpenClaw is geschreven, maar proces- en servicemutaties kunnen niet vanuit een ouder binair bestand worden uitgevoerd. Geblokkeerde acties: de Gateway-service starten/stoppen/herstarten/verwijderen, gedwongen herinstallatie van de service, opstarten van de Gateway in servicemodus en het opschonen van poorten via `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH herstellen">
    Herstel `PATH` zodat `openclaw` naar de nieuwere installatie verwijst en voer de actie daarna opnieuw uit.
  </Step>
  <Step title="De Gateway-service opnieuw installeren">
    Installeer de bedoelde Gateway-service opnieuw vanuit de nieuwere installatie:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Verouderde wrappers verwijderen">
    Verwijder verouderde systeempakketten of oude wrappervermeldingen die nog naar een oud binair bestand van `openclaw` verwijzen.
  </Step>
</Steps>

<Warning>
Stel `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` alleen voor de afzonderlijke opdracht in bij een opzettelijke downgrade of noodherstel. Laat deze variabele bij normaal gebruik uitgeschakeld.
</Warning>

## Protocol komt na terugdraaiing niet overeen

Gebruik dit wanneer de logboeken na een downgrade of terugdraaiing `protocol mismatch` blijven weergeven. Er draait een oudere Gateway, maar een nieuwer lokaal clientproces probeert nog steeds opnieuw verbinding te maken met een protocolbereik dat de oudere Gateway niet ondersteunt.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Let op:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` in de Gateway-logboeken.
- `Established clients:` in `openclaw gateway status --deep` of `Gateway clients` in `openclaw doctor --deep`: actieve TCP-clients die met de Gateway-poort zijn verbonden, met PID's en opdrachtregels wanneer het besturingssysteem dit toestaat.
- Een clientproces waarvan de opdrachtregel verwijst naar de nieuwere OpenClaw-installatie of wrapper waarvan je bent teruggedraaid.

Oplossing:

1. Stop of herstart het verouderde OpenClaw-clientproces dat door `gateway status --deep` wordt weergegeven.
2. Herstart apps of wrappers waarin OpenClaw is ingebed: lokale dashboards, editors, appserverhelpers of langlopende `openclaw logs --follow`-shells.
3. Voer `openclaw gateway status --deep` of `openclaw doctor --deep` opnieuw uit en controleer of de PID van de verouderde client verdwenen is.

Laat een oudere Gateway geen nieuwer, incompatibel protocol accepteren. Protocolverhogingen beschermen het communicatiecontract; herstel na een terugdraaiing is een probleem met het opschonen van processen en versies.

## Symlink van een Skill overgeslagen vanwege ontsnapping uit het pad

Gebruik dit wanneer de logboeken het volgende bevatten:

```text
Skill-pad buiten de geconfigureerde hoofdmap overgeslagen: ... reason=symlink-escape
```

Elke hoofdmap van een Skill vormt een insluitingsgrens. Een symlink onder `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` of `~/.openclaw/skills` wordt overgeslagen wanneer het werkelijke doel buiten die hoofdmap valt, tenzij het doel expliciet wordt vertrouwd.

Inspecteer de koppeling:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Als het doel bewust is gekozen, configureer je zowel de directe hoofdmap van de Skill als het toegestane symlinkdoel:

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

Start daarna een nieuwe sessie of wacht tot de Skills-watcher is vernieuwd. Herstart de Gateway als het actieve proces van vóór de configuratiewijziging dateert.

Gebruik geen brede doelen zoals `~`, `/` of een volledige gesynchroniseerde projectmap. Beperk `allowSymlinkTargets` tot de werkelijke hoofdmap van de Skill die vertrouwde `SKILL.md`-mappen bevat.

Als toepassen vanuit Skill Workshop ook via die vertrouwde, met symlinks gekoppelde Skill-paden in de werkruimte moet schrijven, schakel je `skills.workshop.allowSymlinkTargetWrites` in. Houd dit uitgeschakeld voor gedeelde Skill-hoofdmappen die alleen-lezen zijn.

Gerelateerd:

- [Skills-configuratie](/nl/tools/skills-config#symlinked-skill-roots)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Voor Anthropic 429 is extra gebruik vereist voor een lange context

Gebruik dit wanneer logboeken/fouten het volgende bevatten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Let op:

- Het geselecteerde Anthropic-model is een GA-geschikt Claude 4.x-model met 1M context (Opus 4.6/4.7/4.8, Sonnet 4.6), of de modelconfiguratie bevat nog de verouderde `params.context1m: true`.
- De huidige Anthropic-referentie is niet geschikt voor gebruik met een lange context.
- Aanvragen mislukken alleen bij lange sessies/modeluitvoeringen waarvoor het 1M-contextpad nodig is.

Oplossingsmogelijkheden:

<Steps>
  <Step title="Een standaardcontextvenster gebruiken">
    Schakel over naar een model met een standaardvenster of verwijder de verouderde `context1m` uit een oudere
    modelconfiguratie die niet GA-geschikt is voor 1M context.
  </Step>
  <Step title="Een geschikte referentie gebruiken">
    Gebruik een Anthropic-referentie die geschikt is voor aanvragen met een lange context of schakel over naar een Anthropic-API-sleutel.
  </Step>
  <Step title="Terugvalmodellen configureren">
    Configureer terugvalmodellen zodat uitvoeringen doorgaan wanneer Anthropic-aanvragen met een lange context worden geweigerd.
  </Step>
</Steps>

Gerelateerd:

- [Anthropic](/nl/providers/anthropic)
- [Tokengebruik en kosten](/nl/reference/token-use)
- [Waarom zie ik HTTP 429 van Anthropic?](/nl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Geblokkeerde 403-responsen van upstream

Gebruik dit wanneer een upstream LLM-provider een algemene `403` retourneert, zoals `Your request was blocked`.

Ga er niet van uit dat dit altijd een configuratieprobleem van OpenClaw is. De respons kan afkomstig zijn van een upstream beveiligingslaag, zoals een CDN, WAF, regel voor botbeheer of reverse proxy vóór een OpenAI-compatibel eindpunt.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Let op:

- Meerdere modellen van dezelfde provider mislukken op dezelfde manier.
- HTML of algemene beveiligingstekst in plaats van een normale API-fout van de provider.
- Beveiligingsgebeurtenissen aan de kant van de provider voor hetzelfde aanvraagtijdstip.
- Een minimale rechtstreekse `curl`-controle slaagt, terwijl normale aanvragen in SDK-vorm mislukken.

Herstel eerst de filtering aan de kant van de provider wanneer het bewijs op een WAF/CDN-blokkade wijst. Geef de voorkeur aan een nauwkeurig afgebakende toestemmings- of overslaregel voor het API-pad dat OpenClaw gebruikt en schakel de beveiliging niet voor de hele site uit.

<Warning>
Een geslaagde minimale `curl` garandeert niet dat echte aanvragen in SDK-stijl door dezelfde upstream beveiligingslaag komen.
</Warning>

Gerelateerd:

- [OpenAI-compatibele eindpunten](/nl/gateway/configuration-reference#openai-compatible-endpoints)
- [Providerconfiguratie](/nl/providers)
- [Logboeken](/nl/logging)

## Lokale OpenAI-compatibele backend slaagt voor directe controles, maar agentuitvoeringen mislukken

Gebruik dit wanneer:

- `curl ... /v1/models` werkt.
- Kleine rechtstreekse `/v1/chat/completions`-aanroepen werken.
- OpenClaw-modeluitvoeringen mislukken alleen bij normale agentbeurten.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Let op:

- Kleine rechtstreekse aanroepen slagen, maar OpenClaw-uitvoeringen mislukken alleen bij grotere prompts.
- `model_not_found`- of 404-fouten, hoewel rechtstreekse `/v1/chat/completions` met dezelfde kale model-ID werkt.
- Backendfouten waarin staat dat `messages[].content` een tekenreeks verwacht.
- Onregelmatige `incomplete turn detected ... stopReason=stop payloads=0`-waarschuwingen bij een OpenAI-compatibele lokale backend.
- Backendcrashes die alleen optreden bij grotere aantallen prompttokens of volledige prompts van de agentruntime.

<AccordionGroup>
  <Accordion title="Veelvoorkomende kenmerken">
    - `model_not_found` met een lokale server in MLX/vLLM-stijl: controleer of `baseUrl` `/v1` bevat, `api` voor `/v1/chat/completions`-backends `"openai-completions"` is en `models.providers.<provider>.models[].id` de kale providerlokale ID is. Selecteer deze eenmaal met het providervoorvoegsel, bijvoorbeeld `mlx/mlx-community/Qwen3-30B-A3B-6bit`; behoud de catalogusvermelding als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: de backend weigert gestructureerde inhoudsdelen van Chat Completions. Oplossing: stel `models.providers.<provider>.models[].compat.requiresStringContent: true` in.
    - `validation.keys` of toegestane berichtsleutels zoals `["role","content"]`: de backend weigert replaymetadata in OpenAI-stijl in Chat Completions-berichten. Oplossing: stel `models.providers.<provider>.models[].compat.strictMessageKeys: true` in.
    - `incomplete turn detected ... stopReason=stop payloads=0`: de backend heeft de Chat Completions-aanvraag voltooid, maar voor die beurt geen voor de gebruiker zichtbare assistenttekst geretourneerd. OpenClaw probeert replay-veilige, lege OpenAI-compatibele beurten eenmaal opnieuw; aanhoudende fouten betekenen meestal dat de backend lege/niet-tekstuele inhoud uitvoert of de tekst van het definitieve antwoord onderdrukt.
    - Kleine rechtstreekse aanvragen slagen, maar OpenClaw-agentuitvoeringen mislukken door crashes van de backend/het model (bijvoorbeeld Gemma bij sommige `inferrs`-builds): het OpenClaw-transport is waarschijnlijk al correct; de backend faalt bij de grotere promptvorm van de agentruntime.
    - Fouten nemen af nadat tools zijn uitgeschakeld, maar verdwijnen niet: toolschema's droegen bij aan de belasting, maar het resterende probleem is nog steeds de capaciteit van het upstream model/de upstream server of een backendfout.

  </Accordion>
  <Accordion title="Oplossingsmogelijkheden">
    1. Stel `compat.requiresStringContent: true` in voor Chat Completions-backends die alleen tekenreeksen ondersteunen.
    2. Stel `compat.strictMessageKeys: true` in voor strikte Chat Completions-backends die per bericht alleen `role` en `content` accepteren.
    3. Stel `compat.supportsTools: false` in voor modellen/backends die het toolschema-oppervlak van OpenClaw niet betrouwbaar kunnen verwerken.
    4. Verminder waar mogelijk de promptbelasting: een kleinere werkruimtebootstrap, een kortere sessiegeschiedenis, een lichter lokaal model of een backend met betere ondersteuning voor een lange context.
    5. Als kleine rechtstreekse aanvragen blijven slagen terwijl OpenClaw-agentbeurten nog steeds binnen de backend crashen, behandel dit dan als een beperking van de upstream server/het upstream model en dien daar een reproduceerbaar voorbeeld in met de geaccepteerde payloadvorm.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Configuratie](/nl/gateway/configuration)
- [Lokale modellen](/nl/gateway/local-models)
- [OpenAI-compatibele eindpunten](/nl/gateway/configuration-reference#openai-compatible-endpoints)

## Geen antwoorden

Als kanalen actief zijn maar er niets antwoordt, controleer dan de routering en het beleid voordat je iets opnieuw verbindt.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Let op:

- Koppeling in afwachting voor afzenders van privéberichten.
- Vereiste groepsvermelding (`requireMention`, `mentionPatterns`).
- Niet-overeenkomende toelatingslijsten voor kanalen/groepen.

Veelvoorkomende meldingen:

- `drop guild message (mention required` → groepsbericht genegeerd totdat er een vermelding is.
- `pairing request` → afzender heeft goedkeuring nodig.
- `blocked` / `allowlist` → afzender/kanaal is door beleid gefilterd.

Gerelateerd:

- [Problemen met kanalen oplossen](/nl/channels/troubleshooting)
- [Groepen](/nl/channels/groups)
- [Koppeling](/nl/channels/pairing)

## Connectiviteit van het dashboard en de beheerinterface

Als het dashboard/de beheerinterface geen verbinding maakt, controleer dan de URL, de authenticatiemodus en de aannames over een beveiligde context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Let op:

- Juiste probe-URL en dashboard-URL.
- Niet-overeenkomende authenticatiemodus/token tussen client en Gateway.
- Gebruik van HTTP waar een apparaatidentiteit vereist is.

Als een lokale browser na een update geen verbinding kan maken met `127.0.0.1:18789`, herstel dan eerst de lokale Gateway-service en controleer of deze het dashboard aanbiedt:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Als `curl` OpenClaw-HTML retourneert, werkt de Gateway en is het resterende probleem waarschijnlijk de browsercache, een oude deep link of verouderde tabbladstatus. Open `http://127.0.0.1:18789` rechtstreeks en navigeer vanuit het dashboard. Als de service na het opnieuw starten niet actief blijft, voer dan `openclaw gateway start` uit en controleer `openclaw gateway status` opnieuw.

<AccordionGroup>
  <Accordion title="Verbindings-/authenticatiemeldingen">
    - `device identity required` → onbeveiligde context of ontbrekende apparaatauthenticatie.
    - `origin not allowed` → browser-`Origin` staat niet in `gateway.controlUi.allowedOrigins` (of je maakt verbinding vanaf een browseroorsprong die geen loopback gebruikt, zonder expliciete toelatingslijst).
    - `device nonce required` / `device nonce mismatch` → client voltooit de op uitdagingen gebaseerde apparaatauthenticatiestroom niet (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client heeft de verkeerde payload (of een verouderd tijdstempel) voor de huidige handshake ondertekend.
    - `AUTH_TOKEN_MISMATCH` met `canRetryWithDeviceToken=true` → client kan één vertrouwde nieuwe poging uitvoeren met de gecachte apparaattoken.
    - Die nieuwe poging met de gecachte token hergebruikt de gecachte set bereiken die met de gekoppelde apparaattoken is opgeslagen. Aanroepers met expliciete `deviceToken` / expliciete `scopes` behouden in plaats daarvan hun aangevraagde set bereiken.
    - `AUTH_SCOPE_MISMATCH` → de apparaattoken is herkend, maar de goedgekeurde bereiken dekken dit verbindingsverzoek niet; koppel opnieuw of keur het aangevraagde bereikcontract goed in plaats van een gedeelde Gateway-token te roteren.
    - Buiten dat pad voor opnieuw proberen geldt voor verbindingsauthenticatie de volgende prioriteit: eerst expliciete gedeelde token/wachtwoord, daarna expliciete `deviceToken`, vervolgens de opgeslagen apparaattoken en ten slotte de bootstrap-token.
    - In het asynchrone Tailscale Serve-pad van de beheerinterface worden mislukte pogingen voor dezelfde `{scope, ip}` geserialiseerd voordat de begrenzer de mislukking registreert. Twee gelijktijdige foutieve nieuwe pogingen van dezelfde client kunnen daardoor bij de tweede poging `retry later` opleveren in plaats van twee gewone niet-overeenkomsten.
    - `too many failed authentication attempts (retry later)` van een loopback-client met browseroorsprong → herhaalde mislukkingen vanaf dezelfde genormaliseerde `Origin` worden tijdelijk geblokkeerd; een andere localhost-oorsprong gebruikt een aparte bucket.
    - Herhaalde `unauthorized` na die nieuwe poging → afwijking tussen gedeelde token en apparaattoken; vernieuw de tokenconfiguratie en keur de apparaattoken indien nodig opnieuw goed of roteer deze.
    - `gateway connect failed:` → onjuist doel voor host/poort/URL.

  </Accordion>
</AccordionGroup>

### Sneloverzicht van detailcodes voor authenticatie

Gebruik `error.details.code` uit het mislukte `connect`-antwoord om de volgende actie te kiezen:

| Detailcode                  | Betekenis                                                                                                                                                                                      | Aanbevolen actie                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client heeft een vereiste gedeelde token niet verzonden.                                                                                                                                                 | Plak/stel de token in de client in en probeer het opnieuw. Voor dashboardpaden: `openclaw config get gateway.auth.token` en plak deze vervolgens in de instellingen van de beheerinterface.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Gedeelde token kwam niet overeen met de authenticatietoken van de Gateway.                                                                                                                                               | Als `canRetryWithDeviceToken=true`, sta dan één vertrouwde nieuwe poging toe. Nieuwe pogingen met een gecachte token hergebruiken opgeslagen goedgekeurde bereiken; aanroepers met expliciete `deviceToken` / `scopes` behouden aangevraagde bereiken. Als het nog steeds mislukt, voer dan de [controlelijst voor herstel van tokenafwijkingen](/nl/cli/devices#token-drift-recovery-checklist) uit. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Gecachte token per apparaat is verouderd of ingetrokken.                                                                                                                                                 | Roteer/keur de apparaattoken opnieuw goed met de [apparaten-CLI](/nl/cli/devices) en maak vervolgens opnieuw verbinding.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Apparaattoken is geldig, maar de goedgekeurde rol/bereiken dekken dit verbindingsverzoek niet.                                                                                                       | Koppel het apparaat opnieuw of keur het aangevraagde bereikcontract goed; behandel dit niet als een afwijking van de gedeelde token.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Apparaatidentiteit moet worden goedgekeurd. Controleer `error.details.reason` op `not-paired`, `scope-upgrade`, `role-upgrade` of `metadata-upgrade`, en gebruik `requestId` / `remediationHint` indien aanwezig. | Keur het openstaande verzoek goed: `openclaw devices list` en daarna `openclaw devices approve <requestId>`. Upgrades van bereik/rol gebruiken dezelfde stroom nadat je de aangevraagde toegang hebt beoordeeld.                                                                                                               |

<Note>
Rechtstreekse RPC's naar de loopback-backend die zijn geauthenticeerd met de gedeelde Gateway-token/het gedeelde Gateway-wachtwoord, mogen niet afhankelijk zijn van de basisset bereiken van gekoppelde apparaten van de CLI. Als subagents of andere interne aanroepen nog steeds mislukken met `scope-upgrade`, controleer dan of de aanroeper `client.id: "gateway-client"` en `client.mode: "backend"` gebruikt en niet een expliciete `deviceIdentity` of apparaattoken afdwingt.
</Note>

Controle van de migratie naar apparaatauthenticatie v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Als logboeken nonce-/handtekeningfouten tonen, werk dan de verbindende client bij en controleer deze:

<Steps>
  <Step title="Wacht op connect.challenge">
    Client wacht op de door de Gateway uitgegeven `connect.challenge`.
  </Step>
  <Step title="Onderteken de payload">
    Client ondertekent de aan de uitdaging gebonden payload.
  </Step>
  <Step title="Verzend de apparaatnonce">
    Client verzendt `connect.params.device.nonce` met dezelfde uitdagingsnonce.
  </Step>
</Steps>

Als `openclaw devices rotate` / `revoke` / `remove` onverwacht wordt geweigerd:

- Sessies met tokens van gekoppelde apparaten kunnen alleen **hun eigen** apparaat beheren, tenzij de aanroeper ook `operator.admin` heeft.
- `openclaw devices rotate --scope ...` kan alleen operatorbereiken aanvragen die de sessie van de aanroeper al heeft.

Gerelateerd:

- [Configuratie](/nl/gateway/configuration) (authenticatiemodi van de Gateway)
- [Beheerinterface](/nl/web/control-ui)
- [Apparaten](/nl/cli/devices)
- [Externe toegang](/nl/gateway/remote)
- [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth)

## Gateway-service is niet actief

Gebruik dit wanneer de service is geïnstalleerd, maar het proces niet actief blijft.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # ook services op systeemniveau scannen
```

Let op:

- `Runtime: stopped` met aanwijzingen over afsluiten.
- Niet-overeenkomende serviceconfiguratie (`Config (cli)` versus `Config (service)`).
- Conflicten met poorten/listeners.
- Extra installaties van launchd/systemd/schtasks wanneer `--deep` wordt gebruikt.
- Aanwijzingen voor het opschonen van `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Veelvoorkomende meldingen">
    - `Gateway start blocked: set gateway.mode=local` of `existing config is missing gateway.mode` → lokale Gateway-modus is niet ingeschakeld, of het configuratiebestand is overschreven en `gateway.mode` is verloren gegaan. Oplossing: stel `gateway.mode="local"` in je configuratie in, of voer `openclaw onboard --mode local` / `openclaw setup` opnieuw uit om de verwachte configuratie voor lokale modus opnieuw vast te leggen. Als je OpenClaw via Podman uitvoert, is het standaardconfiguratiepad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → binding buiten loopback zonder een geldig authenticatiepad voor de Gateway (token/wachtwoord, of vertrouwde proxy indien geconfigureerd).
    - `another gateway instance is already listening` / `EADDRINUSE` → poortconflict.
    - `Other gateway-like services detected (best effort)` → er bestaan verouderde of parallelle launchd-/systemd-/schtasks-eenheden. De meeste installaties moeten één Gateway per machine behouden; als je er toch meer dan één nodig hebt, isoleer dan poorten + configuratie/status/werkruimte. Zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` van doctor → er bestaat een systemd-systeemeenheid terwijl de service op gebruikersniveau ontbreekt. Verwijder of schakel het duplicaat uit voordat je doctor een gebruikersservice laat installeren, of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in als de systeemeenheid de bedoelde supervisor is.
    - `Gateway service port does not match current gateway config` → de geïnstalleerde supervisor legt nog steeds de oude `--port` vast. Voer `openclaw doctor --fix` of `openclaw gateway install --force` uit en start vervolgens de Gateway-service opnieuw.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Uitvoering op de achtergrond en procestool](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Doctor](/nl/gateway/doctor)

## macOS-Gateway reageert ongemerkt niet meer en hervat wanneer je het dashboard aanraakt

Gebruik dit wanneer kanalen (Telegram, WhatsApp enz.) op een macOS-host minuten- tot urenlang stilvallen en de Gateway weer actief lijkt te worden zodra je de Control UI opent, via SSH verbinding maakt of op een andere manier interactie met de host hebt. Gewoonlijk is er geen duidelijk symptoom in `openclaw status`, omdat de Gateway tegen de tijd dat je kijkt alweer actief is.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Let op:

- Een of meer `*-uncaught_exception.json`-bundels in `~/.openclaw/logs/stability/` waarbij `error.code` is ingesteld op een tijdelijke netwerkcode zoals `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` of `ECONNREFUSED`.
- `pmset -g log`-regels zoals `Entering Sleep state due to 'Maintenance Sleep'` of `en0 driver is slow (msg: WillChangeState to 0)` die samenvallen met de tijdstempels van de crashes. Power Nap / Maintenance Sleep zet het wifi-stuurprogramma kort in status 0; elke uitgaande `connect()` die in dat tijdvenster valt, kan mislukken met `ENETDOWN`, zelfs op een host die verder volledige netwerkverbinding heeft.
- `launchctl print`-uitvoer die `state = not running` toont met meerdere recente `runs` en een afsluitcode, vooral wanneer er tussen de crash en de volgende start ongeveer een uur zit in plaats van enkele seconden. macOS launchd past na een reeks crashes een niet-gedocumenteerde beveiliging tegen herhaald starten toe, waardoor `KeepAlive=true` mogelijk niet meer wordt gehonoreerd totdat een externe trigger, zoals een interactieve aanmelding, een dashboardverbinding of `launchctl kickstart`, deze opnieuw activeert.

Veelvoorkomende kenmerken:

- Een stabiliteitsbundel waarvan `error.code` gelijk is aan `ENETDOWN` of een verwante code, waarbij de aanroepstack verwijst naar Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` en nieuwer classificeren deze als onschuldige tijdelijke netwerkfouten, zodat ze niet langer worden doorgegeven aan de niet-afgevangen handler op het hoogste niveau; voer eerst een upgrade uit als je een oudere release gebruikt.
- Lange stille perioden die onmiddellijk eindigen wanneer je verbinding maakt met de Control UI of via SSH met de host: de voor de gebruiker zichtbare activiteit activeert de beveiliging van launchd tegen herhaald starten opnieuw, niet iets wat het dashboard met de Gateway doet.
- Het aantal `runs` loopt gedurende de dag op zonder bijbehorende `received SIG*; shutting down`-regel in `~/Library/Logs/openclaw/gateway.log`: bij een normale afsluiting wordt een signaal vastgelegd; bij tijdelijke crashes niet.

Wat te doen:

1. **Upgrade de Gateway** als je een release van vóór `2026.5.26` gebruikt. Na de upgrade worden toekomstige `ENETDOWN`-fouten als waarschuwingen vastgelegd in plaats van het proces te beëindigen.
2. **Verminder activiteit door onderhoudsslaap** op Mac mini-/desktophosts die als permanent actieve servers moeten werken:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Dit vermindert de onderliggende onderbreking van het stuurprogramma aanzienlijk, maar voorkomt deze niet volledig. Het systeem kan, ongeacht deze vlaggen, nog steeds bepaalde onderhoudsslaapcycli uitvoeren voor TCP-keepalive en mDNS-onderhoud.

3. **Voeg een bewakingsmechanisme voor beschikbaarheid toe**, zodat een toekomstige reeks crashes die door launchd wordt geblokkeerd snel wordt gedetecteerd:

   ```bash
   # Voorbeeld van een launchd-bewuste beschikbaarheidscontrole, geschikt voor een Cron of LaunchAgent die elke 5 minuten wordt uitgevoerd
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Het doel is de beveiliging tegen herhaald starten extern opnieuw te activeren; alleen `KeepAlive=true` is op macOS na een reeks crashes niet voldoende.

Gerelateerd:

- [macOS-platformnotities](/nl/platforms/macos)
- [Logboekregistratie](/nl/logging)
- [Doctor](/nl/gateway/doctor)

## macOS launchd-supervisorlus met dubbele Gateway-/Node-LaunchAgents

Gebruik dit wanneer een macOS-installatie om de paar seconden opnieuw wordt gestart, `openclaw`-
statuscontroles wisselen tussen beschikbaar en niet beschikbaar en de kanaalverzending vastloopt,
hoewel de service actief lijkt te zijn.

Dit is waargenomen bij oudere installaties waarbij zowel de LaunchAgent `ai.openclaw.gateway` als
`ai.openclaw.node` actief was en beide
`OPENCLAW_LAUNCHD_LABEL` injecteerden. In die toestand kan OpenClaw launchd-
supervisie detecteren, proberen het opnieuw starten terug aan launchd over te dragen en in een snelle
`EADDRINUSE`-/herstartlus terechtkomen in plaats van één stabiel Gateway-proces te behouden.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Let op:

- Meer dan één Gateway-PID tijdens de steekproef van 30 seconden in plaats van één stabiel
  proces.
- `EADDRINUSE`, `another gateway instance is already listening` of herhaalde
  regels over opnieuw starten/overdracht in `gateway.log`.
- Zowel `~/Library/LaunchAgents/ai.openclaw.gateway.plist` als
  `~/Library/LaunchAgents/ai.openclaw.node.plist` zijn tegelijkertijd geladen op een
  host waarop slechts één beheerde Gateway-service hoort te worden uitgevoerd.

Wat te doen:

1. Als op deze host alleen de Gateway-service hoort te worden uitgevoerd, verwijder je de beheerde Node-
   service via OpenClaw. **Sla deze stap over** als je actief afhankelijk bent van de Node-
   service voor functies van externe Nodes; als je deze verwijdert, stoppen die functies op
   deze host:

   ```bash
   openclaw node uninstall
   ```

2. Installeer een permanente Gateway-wrapper die de overgenomen launchd-
   markeringen wist voordat OpenClaw wordt gestart. Gebruik de ondersteunde optie `--wrapper`; bewerk
   het gegenereerde bestand onder `~/.openclaw/service-env/` niet, omdat dit bestand bij herinstallatie
   en updates van de service en bij reparatie door Doctor opnieuw wordt gegenereerd:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` bewaart het wrapperpad bij gedwongen herinstallaties,
   updates en reparaties door Doctor.

3. Controleer of de Gateway stabiel is en RPC bedient, en niet alleen luistert:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   De PID-steekproef moet één stabiel proces tonen in plaats van een wisselende reeks
   PID's, en de inkomende kanaalverzending moet worden hervat.

4. Verwijder na een upgrade naar een release waarin de onderliggende lus met dubbele LaunchAgents is
   opgelost de tijdelijke oplossing en installeer de normale beheerde service opnieuw:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Gerelateerd:

- [macOS-platformnotities](/nl/platforms/mac/bundled-gateway)
- [Doctor](/nl/gateway/doctor)
- [Gateway-CLI](/nl/cli/gateway)

## Gateway wordt afgesloten bij hoog geheugengebruik

Gebruik dit wanneer de Gateway onder belasting verdwijnt, de supervisor een herstart in OOM-stijl meldt of de logboeken `critical memory pressure bundle written` vermelden.

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
- `Largest session files:`-vermeldingen zoals `agents/<agent>/sessions/<session>.jsonl` of `sessions/<session>.jsonl`.
- Linux-cgroup-geheugentellers wanneer de Gateway in een container of service met een geheugenlimiet wordt uitgevoerd.

Veelvoorkomende kenmerken:

- `critical memory pressure bundle written` verschijnt kort vóór de herstart → OpenClaw heeft vóór de OOM een stabiliteitsbundel vastgelegd. Inspecteer deze met `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` verschijnt in de Gateway-logboeken → OpenClaw heeft kritieke geheugendruk gedetecteerd, maar de stabiliteitsmomentopname vóór de OOM is uitgeschakeld.
- `Largest session files:` verwijst naar een zeer groot geredigeerd transcriptpad → beperk de bewaarde sessiegeschiedenis, onderzoek de groei van de sessie of verplaats oude transcripties uit de actieve opslag voordat je opnieuw start.
- Het aantal gebruikte bytes in `V8 heap:` ligt dicht bij de heaplimiet → verlaag de prompt-/sessiedruk, verminder het aantal gelijktijdige taken of verhoog de Node-heaplimiet pas nadat je hebt bevestigd dat de werklast wordt verwacht.
- `Memory pressure: critical/rss_growth` → het geheugengebruik is binnen één meetvenster snel gegroeid. Controleer de nieuwste logboeken op een grote import, uit de hand gelopen tooluitvoer, herhaalde pogingen of een reeks agenttaken in de wachtrij.
- Kritieke geheugendruk verschijnt in de logboeken, maar er bestaat geen bundel → dit is de standaardinstelling. Stel `diagnostics.memoryPressureSnapshot: true` in om bij toekomstige gebeurtenissen met kritieke geheugendruk de stabiliteitsbundel vóór de OOM vast te leggen.

De stabiliteitsbundel bevat geen payloads. Deze bevat operationeel bewijs over het geheugen en geredigeerde relatieve bestandspaden, maar geen berichttekst, Webhook-bodies, aanmeldgegevens, tokens, cookies of onbewerkte sessie-id's. Voeg de diagnostische export toe aan foutrapporten in plaats van onbewerkte logboeken te kopiëren.

Gerelateerd:

- [Gateway-status](/nl/gateway/health)
- [Diagnostische export](/nl/gateway/diagnostics)
- [Sessies](/nl/cli/sessions)

## Gateway heeft ongeldige configuratie geweigerd

Gebruik dit wanneer het starten van de Gateway mislukt met `Invalid config` of wanneer logboeken voor dynamisch herladen melden dat een ongeldige wijziging is overgeslagen.

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
- Een bestand `openclaw.json.rejected.*` met een tijdstempel naast de actieve configuratie.
- Een bestand `openclaw.json.clobbered.*` met een tijdstempel als `doctor --fix` een beschadigde rechtstreekse wijziging heeft gerepareerd.
- OpenClaw bewaart voor elk configuratiepad de nieuwste 32 `.clobbered.*`-bestanden en roteert oudere bestanden.

<AccordionGroup>
  <Accordion title="Wat er is gebeurd">
    - De configuratie is niet gevalideerd tijdens het starten, dynamisch herladen of een door OpenClaw beheerde schrijfbewerking.
    - Het starten van de Gateway mislukt veilig in plaats van `openclaw.json` te herschrijven.
    - Bij dynamisch herladen worden ongeldige externe wijzigingen overgeslagen en blijft de huidige runtimeconfiguratie actief.
    - Door OpenClaw beheerde schrijfbewerkingen weigeren ongeldige/destructieve payloads vóór het vastleggen en slaan `.rejected.*` op.
    - `openclaw doctor --fix` beheert de reparatie. Deze kan niet-JSON-voorvoegsels verwijderen of de laatst bekende geldige kopie herstellen, terwijl de geweigerde payload als `.clobbered.*` behouden blijft.
    - Wanneer voor één configuratiepad veel reparaties plaatsvinden, roteert OpenClaw oudere `.clobbered.*`-bestanden, zodat de nieuwste gerepareerde payload beschikbaar blijft.

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
  <Accordion title="Veelvoorkomende kenmerken">
    - `.clobbered.*` bestaat → doctor heeft een defecte externe bewerking behouden tijdens het herstellen van de actieve configuratie.
    - `.rejected.*` bestaat → een door OpenClaw beheerde configuratieschrijfactie heeft vóór het vastleggen de schema- of overschrijvingscontroles niet doorstaan.
    - `Config write rejected:` → de schrijfactie probeerde de vereiste structuur te verwijderen, het bestand sterk te verkleinen of een ongeldige configuratie op te slaan.
    - `config reload skipped (invalid config):` → een rechtstreekse bewerking heeft de validatie niet doorstaan en is door de actieve Gateway genegeerd.
    - `Invalid config at ...` → het opstarten is mislukt voordat de Gateway-services waren gestart.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` of `size-drop-vs-last-good:*` → een door OpenClaw beheerde schrijfactie is geweigerd omdat deze velden of omvang verloor ten opzichte van de laatst bekende werkende back-up.
    - `Config last-known-good promotion skipped` → de kandidaat bevatte geredigeerde placeholders voor geheimen, zoals `***`.

  </Accordion>
  <Accordion title="Oplossingsopties">
    1. Voer `openclaw doctor --fix` uit om doctor configuraties met voorvoegsels of overschrijvingen te laten herstellen, of om de laatst bekende werkende versie terug te zetten.
    2. Kopieer alleen de bedoelde sleutels uit `.clobbered.*` of `.rejected.*` en pas ze vervolgens toe met `openclaw config set` of `config.patch`.
    3. Voer `openclaw config validate` uit voordat je opnieuw opstart.
    4. Als je handmatig bewerkt, behoud dan de volledige JSON5-configuratie en niet alleen het gedeeltelijke object dat je wilde wijzigen.
  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Configuratie](/nl/cli/config)
- [Configuratie: hot reload](/nl/gateway/configuration#config-hot-reload)
- [Configuratie: strikte validatie](/nl/gateway/configuration#strict-validation)
- [Doctor](/nl/gateway/doctor)

## Waarschuwingen van de Gateway-controle

Gebruik dit wanneer `openclaw gateway probe` iets bereikt, maar nog steeds een waarschuwingsblok weergeeft.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Let op:

- `warnings[].code` en `primaryTargetId` in de JSON-uitvoer.
- Of de waarschuwing betrekking heeft op SSH-terugval, meerdere gateways, ontbrekende scopes of niet-opgeloste authenticatiereferenties.

Veelvoorkomende kenmerken:

- `SSH tunnel failed to start; falling back to direct probes.` → de SSH-configuratie is mislukt, maar de opdracht heeft nog steeds rechtstreeks geconfigureerde of loopback-doelen geprobeerd.
- `multiple reachable gateway identities detected` → verschillende gateways hebben geantwoord, of OpenClaw kon niet aantonen dat de bereikbare doelen dezelfde Gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde externe URL naar dezelfde Gateway wordt behandeld als één Gateway met meerdere transporten, zelfs wanneer de transportpoorten verschillen.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → de verbinding werkte, maar de gedetailleerde RPC is beperkt door scopes; koppel de apparaatidentiteit of gebruik aanmeldgegevens met `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → de verbinding werkte, maar er trad een time-out of fout op bij de volledige set diagnostische RPC's. Behandel dit als een bereikbare Gateway met beperkte diagnostiek; vergelijk `connect.ok` en `connect.rpcOk` in de uitvoer van `--json`.
- `Capability: pairing-pending` of `gateway closed (1008): pairing required` → de Gateway heeft geantwoord, maar deze client moet nog worden gekoppeld of goedgekeurd voordat normale beheerderstoegang mogelijk is.
- Niet-opgeloste waarschuwingstekst voor `gateway.auth.*` / `gateway.remote.*` SecretRef → het authenticatiemateriaal was in dit opdrachtpad niet beschikbaar voor het mislukte doel.

Gerelateerd:

- [Gateway](/nl/cli/gateway)
- [Meerdere gateways op dezelfde host](/nl/gateway#multiple-gateways-same-host)
- [Externe toegang](/nl/gateway/remote)

## Kanaal verbonden, maar berichten worden niet verwerkt

Als de kanaalstatus verbonden is, maar de berichtenstroom stilligt, richt je dan op beleid, machtigingen en kanaalspecifieke bezorgingsregels.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Let op:

- DM-beleid (`pairing`, `allowlist`, `open`, `disabled`).
- Toestaanlijst voor groepen en vereisten voor vermeldingen.
- Ontbrekende API-machtigingen/scopes voor het kanaal.

Veelvoorkomende kenmerken:

- `mention required` → bericht genegeerd vanwege het groepsbeleid voor vermeldingen.
- `pairing` / sporen van een wachtende goedkeuring → de afzender is niet goedgekeurd.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → probleem met de authenticatie/machtigingen van het kanaal.

Gerelateerd:

- [Problemen met kanalen oplossen](/nl/channels/troubleshooting)
- [Discord](/nl/channels/discord)
- [Telegram](/nl/channels/telegram)
- [WhatsApp](/nl/channels/whatsapp)

## Bezorging via Cron en Heartbeat

Als Cron of Heartbeat niet is uitgevoerd of niets heeft bezorgd, controleer dan eerst de status van de planner en daarna het bezorgingsdoel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Let op:

- Cron is ingeschakeld en het volgende activeringsmoment is aanwezig.
- Status van de uitvoeringsgeschiedenis van de taak (`ok`, `skipped`, `error`).
- Redenen voor het overslaan van Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Veelvoorkomende kenmerken">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron is uitgeschakeld.
    - `cron: timer tick failed` → de plannertick is mislukt; controleer fouten in bestanden, logboeken of de runtime.
    - `heartbeat skipped` met `reason=quiet-hours` → buiten het venster met actieve uren.
    - `heartbeat skipped` met `reason=empty-heartbeat-file` → `HEARTBEAT.md` bestaat, maar bevat alleen lege tekst, opmerkingen, een kop, een codeblok of een lege checkliststructuur, waardoor OpenClaw de modelaanroep overslaat.
    - `heartbeat skipped` met `reason=no-tasks-due` → `HEARTBEAT.md` bevat een `tasks:`-blok, maar geen van de taken is bij deze tick aan de beurt.
    - `heartbeat: unknown accountId` → ongeldig account-ID voor het bezorgingsdoel van Heartbeat.
    - `heartbeat skipped` met `reason=dm-blocked` → het Heartbeat-doel is omgezet naar een DM-achtige bestemming terwijl `agents.defaults.heartbeat.directPolicy` (of de overschrijving per agent) is ingesteld op `block`.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
- [Geplande taken: probleemoplossing](/nl/automation/cron-jobs#troubleshooting)

## Node gekoppeld, maar hulpmiddel mislukt

Als een Node is gekoppeld, maar hulpmiddelen mislukken, isoleer dan de status van de voorgrond, machtigingen en goedkeuringen.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Let op:

- Node is online met de verwachte mogelijkheden.
- Toekenningen van OS-machtigingen voor camera/microfoon/locatie/scherm.
- Status van uitvoeringsgoedkeuringen en de toestaanlijst.

Veelvoorkomende kenmerken:

- `NODE_BACKGROUND_UNAVAILABLE` → de Node-app moet op de voorgrond staan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ontbrekende OS-machtiging.
- `SYSTEM_RUN_DENIED: approval required` → uitvoeringsgoedkeuring is in behandeling.
- `SYSTEM_RUN_DENIED: allowlist miss` → opdracht geblokkeerd door de toestaanlijst.

Gerelateerd:

- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)
- [Problemen met Nodes oplossen](/nl/nodes/troubleshooting)
- [Nodes](/nl/nodes/index)

## Browserhulpmiddel mislukt

Gebruik dit wanneer acties van het browserhulpmiddel mislukken, hoewel de Gateway zelf naar behoren werkt.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Let op:

- Of `plugins.allow` is ingesteld en `browser` bevat.
- Geldig pad naar het uitvoerbare browserbestand.
- Bereikbaarheid van het CDP-profiel.
- Lokale beschikbaarheid van Chrome voor `existing-session`- / `user`-profielen.

<AccordionGroup>
  <Accordion title="Kenmerken van de Plugin / het uitvoerbare bestand">
    - `unknown command "browser"` of `unknown command 'browser'` → de meegeleverde browser-Plugin wordt uitgesloten door `plugins.allow`.
    - Browserhulpmiddel ontbreekt / is niet beschikbaar terwijl `browser.enabled=true` → `plugins.allow` sluit `browser` uit, waardoor de Plugin nooit is geladen.
    - `Failed to start Chrome CDP on port` → het browserproces kon niet worden gestart.
    - `browser.executablePath not found` → het geconfigureerde pad is ongeldig.
    - `browser.cdpUrl must be http(s) or ws(s)` → de geconfigureerde CDP-URL gebruikt een niet-ondersteund schema, zoals `file:` of `ftp:`.
    - `browser.cdpUrl has invalid port` → de geconfigureerde CDP-URL heeft een onjuiste poort of een poort buiten het geldige bereik.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → de huidige Gateway-installatie mist de kernruntime-afhankelijkheid voor de browser; installeer OpenClaw opnieuw of werk het bij en start daarna de Gateway opnieuw. ARIA-snapshots en eenvoudige schermafbeeldingen van pagina's kunnen nog steeds werken, maar navigatie, AI-snapshots, schermafbeeldingen van elementen met CSS-selectors en PDF-export blijven niet beschikbaar.

  </Accordion>
  <Accordion title="Kenmerken van Chrome MCP / bestaande sessies">
    - `Could not find DevToolsActivePort for chrome` → de bestaande sessie van Chrome MCP kon nog geen verbinding maken met de geselecteerde browsergegevensmap. Open de inspectiepagina van de browser, schakel externe foutopsporing in, houd de browser geopend, keur de eerste verbindingsprompt goed en probeer het opnieuw. Als een aangemelde status niet vereist is, gebruik dan bij voorkeur het beheerde `openclaw`-profiel.
    - `No browser tabs found for profile="user"` → het koppelprofiel van Chrome MCP heeft geen geopende lokale Chrome-tabbladen.
    - `Remote CDP for profile "<name>" is not reachable` → het geconfigureerde externe CDP-eindpunt is niet bereikbaar vanaf de Gateway-host.
    - `Browser attachOnly is enabled ... not reachable` of `Browser attachOnly is enabled and CDP websocket ... is not reachable` → het profiel dat alleen koppelen ondersteunt heeft geen bereikbaar doel, of het HTTP-eindpunt heeft geantwoord maar de CDP-WebSocket kon nog steeds niet worden geopend.

  </Accordion>
  <Accordion title="Kenmerken van elementen / schermafbeeldingen / uploads">
    - `fullPage is not supported for element screenshots` → de aanvraag voor een schermafbeelding combineerde `--full-page` met `--ref` of `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → aanroepen voor schermafbeeldingen van Chrome MCP / `existing-session` moeten paginaopname of een snapshot-`--ref` gebruiken, niet de CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → uploadhooks van Chrome MCP hebben snapshotreferenties nodig, geen CSS-selectors.
    - `existing-session file uploads currently support one file at a time.` → verstuur bij Chrome MCP-profielen één upload per aanroep.
    - `existing-session dialog handling does not support timeoutMs.` → dialooghooks bij Chrome MCP-profielen ondersteunen geen overschrijvingen van time-outs.
    - `existing-session type does not support timeoutMs overrides.` → laat `timeoutMs` weg voor `act:type` bij `profile="user"`- / bestaande-sessieprofielen van Chrome MCP, of gebruik een beheerd/CDP-browserprofiel wanneer een aangepaste time-out vereist is.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vereist nog steeds een beheerd browserprofiel of een onbewerkt CDP-profiel.
    - Verouderde overschrijvingen voor viewport / donkere modus / landinstelling / offlinemodus bij profielen die alleen koppelen ondersteunen of externe CDP-profielen → voer `openclaw browser stop --browser-profile <name>` uit om de actieve besturingssessie te sluiten en de emulatiestatus van Playwright/CDP vrij te geven zonder de volledige Gateway opnieuw te starten.

  </Accordion>
</AccordionGroup>

Gerelateerd:

- [Browser (beheerd door OpenClaw)](/nl/tools/browser)
- [Problemen met de browser oplossen](/nl/tools/browser-linux-troubleshooting)

## Als je een upgrade hebt uitgevoerd en er plotseling iets niet meer werkt

De meeste problemen na een upgrade worden veroorzaakt door configuratieafwijkingen of strengere standaardinstellingen die nu worden afgedwongen.

<AccordionGroup>
  <Accordion title="1. Gedrag voor authenticatie en URL-overschrijving is gewijzigd">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Wat je moet controleren:

    - Als `gateway.mode=remote`, zijn CLI-aanroepen mogelijk op de externe service gericht terwijl je lokale service correct werkt.
    - Expliciete `--url`-aanroepen vallen niet terug op opgeslagen aanmeldgegevens.

    Veelvoorkomende meldingen:

    - `gateway connect failed:` → onjuist URL-doel.
    - `unauthorized` → eindpunt bereikbaar, maar onjuiste authenticatie.

  </Accordion>
  <Accordion title="2. Beveiligingsregels voor binding en authenticatie zijn strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Wat je moet controleren:

    - Niet-loopbackbindingen (`lan`, `tailnet`, `custom`) vereisen een geldig authenticatiepad voor de Gateway: authenticatie met een gedeeld token/wachtwoord of een correct geconfigureerde niet-loopback-`trusted-proxy`-implementatie.
    - Oude sleutels zoals `gateway.token` vervangen `gateway.auth.token` niet.

    Veelvoorkomende meldingen:

    - `refusing to bind gateway ... without auth` → niet-loopbackbinding zonder een geldig authenticatiepad voor de Gateway.
    - `Connectivity probe: failed` terwijl de runtime actief is → Gateway is actief, maar niet toegankelijk met de huidige authenticatie/URL.

  </Accordion>
  <Accordion title="3. Status van koppeling en apparaatidentiteit is gewijzigd">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Wat je moet controleren:

    - Openstaande apparaatgoedkeuringen voor dashboard/nodes.
    - Openstaande goedkeuringen voor DM-koppelingen na wijzigingen in beleid of identiteit.

    Veelvoorkomende meldingen:

    - `device identity required` → niet voldaan aan apparaatauthenticatie.
    - `pairing required` → afzender/apparaat moet worden goedgekeurd.

  </Accordion>
</AccordionGroup>

Als de serviceconfiguratie en runtime na de controles nog steeds niet overeenkomen, installeer je de servicemetadata opnieuw vanuit dezelfde profiel-/statusmap:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Gerelateerd:

- [Authenticatie](/nl/gateway/authentication)
- [Uitvoering op de achtergrond en procestool](/nl/gateway/background-process)
- [Node-koppeling](/nl/gateway/pairing)

## Gerelateerd

- [Doctor](/nl/gateway/doctor)
- [Veelgestelde vragen](/nl/help/faq)
- [Gateway-draaiboek](/nl/gateway)
