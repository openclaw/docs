---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Invoering van incompatibele configuratiewijzigingen
sidebarTitle: Doctor
summary: 'Doctor-opdracht: statuscontroles, configuratiemigraties en herstelstappen'
title: Diagnoseprogramma
x-i18n:
    generated_at: "2026-07-16T15:50:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is het reparatie- en migratiehulpmiddel voor OpenClaw. Het herstelt verouderde configuratie/status, controleert de systeemstatus en biedt uitvoerbare reparatiestappen.

## Snel aan de slag

```bash
openclaw doctor
```

### Headless- en automatiseringsmodi

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepteer standaardwaarden zonder prompts (inclusief stappen voor herstart, service- en sandboxreparatie indien van toepassing).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Pas aanbevolen reparaties toe zonder prompts (`--repair` is een alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Voer gestructureerde statuscontroles uit voor CI of preflight-automatisering. Alleen-lezen: geen
    prompts, reparaties, migraties, herstarts of schrijfbewerkingen naar de status.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Pas ook ingrijpende reparaties toe (overschrijft aangepaste supervisorconfiguraties).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie +
    verplaatsingen van status op schijf). Slaat herstart-, service- en sandboxacties over waarvoor menselijke
    bevestiging nodig is. Verouderde statusmigraties worden nog steeds automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra Gateway-installaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Open eerst het configuratiebestand om wijzigingen te bekijken voordat ze worden geschreven:

```bash
cat ~/.openclaw/openclaw.json
```

## Alleen-lezen-lintmodus

`openclaw doctor --lint` is de automatiseringsvriendelijke tegenhanger van
`openclaw doctor --fix`. Ze delen hetzelfde Doctor-regelregister, maar selecteren
regels niet op dezelfde manier en voeren er ook niet op dezelfde manier acties voor uit:

| Modus                     | Prompts   | Schrijft configuratie/status | Uitvoer                   | Gebruik hiervoor                         |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | ja        | nee                     | toegankelijk statusrapport | een persoon die de status controleert    |
| `openclaw doctor --fix`  | soms | ja, met reparatiebeleid | toegankelijk reparatielogboek | goedgekeurde reparaties toepassen        |
| `openclaw doctor --lint` | nee       | nee                     | gestructureerde bevindingen | CI, preflight- en beoordelingspoorten     |

Standaard voert `doctor --lint` het brede, veilige automatiseringsprofiel uit: controles die
statisch, lokaal en nuttig zijn in CI- of preflight-uitvoer. Opt-incontroles die
adviserend, omgevingsgevoelig, afhankelijk van live services, gericht op account-/workspace-
inventarisatie of historische opschoning zijn, worden overgeslagen. Gebruik `doctor --lint --all` wanneer je de
volledige geregistreerde lintaudit wilt, inclusief deze opt-incontroles, of `--only <id>` voor
een gerichte controle.

`doctor --fix` gebruikt het standaardprofiel voor lint niet en accepteert
`--all` niet. Het voert het geordende reparatiepad van Doctor uit: moderne statuscontroles kunnen
een optionele `repair()`-implementatie bieden, terwijl oudere onderdelen nog steeds hun verouderde
Doctor-reparatiestroom gebruiken. Sommige lintbevindingen zijn bewust uitsluitend diagnostisch, dus wanneer
een controle in `--lint --all` voorkomt, betekent dit niet dat `--fix` dat onderdeel zal wijzigen.
Het contract scheidt `detect()` (rapporteert bevindingen) van `repair()` (rapporteert
wijzigingen/diffs/neveneffecten), waardoor een pad openblijft voor een toekomstige
`doctor --fix --dry-run` zonder lintcontroles in wijzigingsplanners te veranderen.

Sommige ingebouwde controles zijn intern standaard uitgeschakeld, zodat ze beschikbaar blijven voor
`--all`, `--only` en Doctor-reparatiestromen zonder onderdeel te worden van het standaard
`doctor --lint`-automatiseringsprofiel. De ernst van bevindingen wordt nog steeds per
bevinding weergegeven (`info`, `warning` of `error`); standaardselectie is geen
ernstniveau.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Velden in JSON-uitvoer:

- `ok`: of een bevinding aan de geselecteerde ernstgrens voldeed
- `checksRun` / `checksSkipped`: aantallen (overgeslagen vanwege het profiel, `--only` of `--skip`)
- `findings`: gestructureerde diagnostiek met `checkId`, `severity`, `message` en optioneel `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Afsluitcodes:

| Code | Betekenis                                                |
| ---- | -------------------------------------------------------- |
| `0`  | geen bevindingen op of boven de geselecteerde grens      |
| `1`  | een of meer bevindingen voldeden aan de geselecteerde grens |
| `2`  | opdracht-/runtimefout voordat bevindingen konden worden weergegeven |

Vlaggen:

- `--severity-min info|warning|error` (standaard `warning`): bepaalt zowel wat wordt weergegeven als wat een afsluitcode anders dan nul veroorzaakt.
- `--all`: voert elke geregistreerde lintcontrole uit, inclusief opt-incontroles die van de standaard automatiseringsset zijn uitgesloten.
- `--only <id>` (herhaalbaar): voer alleen de genoemde controle-id('s) uit; een onbekende id wordt als foutbevinding gerapporteerd.
- `--skip <id>` (herhaalbaar): sluit een controle uit terwijl de rest van de uitvoering actief blijft.
- `--json`, `--severity-min`, `--all`, `--only` en `--skip` vereisen `--lint`; gewone uitvoeringen van `openclaw doctor` en `--fix` wijzen ze af.

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Status, UI en updates">
    - Optionele preflight-update voor git-installaties (alleen interactief).
    - Controle op actualiteit van het UI-protocol (bouwt de Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Statuscontrole + prompt voor herstart.
    - Alleen opmerkingen over problematische Skills en Plugins; een gezonde inventaris blijft in `openclaw skills check` en `openclaw plugins list`.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waardevormen.
    - Migratie van Talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en gereedheid van Chrome MCP.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migratie van verouderde OpenAI Codex-provider/profiel (`openai-codex` → `openai`) en waarschuwingen voor overschaduwing door verouderde `models.providers.openai-codex`.
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor toelatingslijsten van Plugins/hulpmiddelen wanneer `plugins.allow` beperkend is, maar het hulpmiddelenbeleid nog steeds om jokertekens of hulpmiddelen van Plugins vraagt.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-authenticatie).
    - Migratie van verouderde contractsleutels voor Plugin-manifesten (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde Cron-opslag (`jobId`, `schedule.cron`, leverings-/payloadvelden op het hoogste niveau, payload `provider`, `notify: true` Webhook-terugvaltaken).
    - Herstel van runtimepin voor Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) in `agents.defaults`, `agents.list[]` en `models.providers.*` (inclusief vermeldingen per model).
    - Opschoning van verouderde Plugin-configuratie wanneer Plugins zijn ingeschakeld; bij `plugins.enabled=false` blijven verouderde Plugin-verwijzingen behouden als inactieve inperkingsconfiguratie.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Herstel van sessietranscripten voor gedupliceerde prompt-herschrijvingstakken die door getroffen 2026.4.24-builds zijn gemaakt.
    - Detectie van tombstones voor herstartherstel van vastgelopen subagents, met ondersteuning voor `--fix` om verouderde afgebroken herstelvlaggen te wissen, zodat de opstartprocedure het onderliggende proces niet als afgebroken door een herstart blijft behandelen.
    - Controles van statusintegriteit en machtigingen (sessies, transcripten, statusmap).
    - Machtigingscontroles voor configuratiebestanden (chmod 600) bij lokale uitvoering.
    - Status van modelauthenticatie: controleert het verlopen van OAuth, kan bijna verlopen tokens vernieuwen en rapporteert afkoelings-/uitgeschakelde statussen van authenticatieprofielen.

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Herstel van sandboxinstallatiekopieën wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra Gateways.
    - Migratie van verouderde status van het Matrix-kanaal (in de modus `--fix` / `--repair`).
    - Runtimecontroles van de Gateway (service geïnstalleerd maar niet actief; launchd-label in cache).
    - Waarschuwingen over kanaalstatus (opgevraagd bij de actieve Gateway).
    - Kanaalspecifieke machtigingscontroles bevinden zich onder `openclaw channels capabilities`; machtigingen voor Discord-spraakkanalen worden bijvoorbeeld gecontroleerd met `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Responsiviteitscontroles voor WhatsApp bij een verslechterde status van de Gateway-eventloop terwijl lokale TUI-clients nog actief zijn; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Herstel van Codex-routes voor verouderde `openai-codex/*`-modelverwijzingen in primaire modellen, terugvalopties, modellen voor beeld-/videogeneratie, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroutepins; `--fix` herschrijft ze naar `openai/*`, migreert `openai-codex:*`-authenticatieprofielen/-volgorde naar `openai:*`, verwijdert verouderde runtimepins voor sessies/volledige agents en laat de herstelde effectieve route bepalen of Codex compatibel is.
    - Audit van supervisorconfiguraties (launchd/systemd/schtasks) met optioneel herstel.
    - Opschoning van ingebedde proxyomgevingen voor Gateway-services die tijdens installatie of update `HTTP_PROXY`- / `HTTPS_PROXY`- / `NO_PROXY`-waarden uit de shell hebben overgenomen.
    - Runtimecontroles van de Gateway (niet-ondersteunde verouderde Bun-services, paden van versiebeheerders).
    - Diagnostiek van Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen SecretRef-configuraties voor tokens).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelingsverzoeken, openstaande rol-/scope-upgrades, afwijkingen in verouderde lokale cache voor apparaattokens en authenticatieafwijkingen in gekoppelde records).

  </Accordion>
  <Accordion title="Workspace en shell">
    - Controle van systemd-linger op Linux.
    - Controle van de bestandsgrootte voor workspace-bootstrapbestanden (waarschuwingen voor afkapping/bijna bereikte limiet voor contextbestanden).
    - Gereedheidscontrole van Skills voor de standaardagent; rapporteert toegestane Skills waarvoor binaries, omgevingsvariabelen, configuratie of OS-vereisten ontbreken, en `--fix` kan niet-beschikbare Skills uitschakelen in `skills.entries`.
    - Statuscontrole en automatische installatie/upgrade van shellaanvulling.
    - Gereedheidscontrole van de embeddingprovider voor zoeken in het geheugen (lokaal model, externe API-sleutel of QMD-binary).
    - Controles van broninstallaties (niet-overeenkomende pnpm-workspace, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Aanvulling en reset van de Dreams-UI

De Control UI-scène Dreams bevat de acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde Dreaming-workflow. Deze gebruiken RPC-methoden in Gateway-doctorstijl, maar maken **geen** deel uit van CLI-reparatie/-migratie met `openclaw doctor`.

| Actie          | Wat deze doet                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | Scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de gegronde REM-dagboekpassage uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`. |
| Reset          | Verwijdert alleen de gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.                                                                                                  |
| Clear Grounded | Verwijdert alleen klaargezette, uitsluitend gegronde kortetermijnvermeldingen uit historische herhaling die nog geen actieve herinnering of dagelijkse ondersteuning hebben opgebouwd.                           |

Geen van deze acties bewerkt `MEMORY.md`, voert volledige doctor-migraties uit of zet zelfstandig gegronde kandidaten klaar in het actieve kortetermijnarchief voor promotie. Gebruik in plaats daarvan de CLI-flow om gegronde historische herhaling naar het normale pad voor diepe promotie te sturen:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Hiermee worden gegronde duurzame kandidaten klaargezet in het kortetermijnarchief voor Dreaming, terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, wordt aangeboden eerst een update uit te voeren (ophalen/rebasen/bouwen) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Doctor normaliseert verouderde waardevormen naar het huidige schema. De huidige spraakconfiguratie voor Talk is `talk.provider` + `talk.providers.<provider>`, met de realtime spraakconfiguratie onder `talk.realtime.*`. Doctor herschrijft oude `talk.voiceId`- / `talk.voiceAliases`- / `talk.modelId`- / `talk.outputFormat`- / `talk.apiKey`-vormen naar de providerkaart en herschrijft verouderde realtime-selectors op het hoogste niveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en het toolbeleid jokertekens of toolvermeldingen van Plugins gebruikt. `tools.allow: ["*"]` komt alleen overeen met tools van Plugins die daadwerkelijk worden geladen; hiermee wordt de exclusieve toestemmingslijst voor Plugins niet omzeild.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie een verouderde sleutel met een actieve migratie bevat, weigeren andere opdrachten te worden uitgevoerd en vragen ze je `openclaw doctor` uit te voeren. Doctor legt uit welke verouderde sleutels zijn gevonden, toont de toegepaste migratie en herschrijft `~/.openclaw/openclaw.json` met het bijgewerkte schema. De Gateway weigert bij het opstarten verouderde configuratie-indelingen en vraagt je `openclaw doctor --fix` uit te voeren; `openclaw.json` wordt bij het opstarten niet herschreven. Migraties van het Cron-takenarchief worden ook verwerkt door `openclaw doctor --fix`.

    <Note>
      Doctor biedt automatische migraties slechts ongeveer twee maanden nadat een
      sleutel buiten gebruik is gesteld. Oudere verouderde sleutels (bijvoorbeeld de oorspronkelijke
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` op het hoogste niveau of `identity` op het hoogste niveau
      uit de configuratievorm van vóór meerdere agents) hebben geen migratiepad meer;
      configuraties waarin ze worden gebruikt, slagen nu niet voor validatie in plaats van te worden herschreven. Corrigeer
      die sleutels handmatig aan de hand van de huidige configuratiereferentie voordat doctor
      kan doorgaan.
    </Note>

    Actieve migraties:

    | Verouderde sleutel                                                                                    | Huidige sleutel                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | verwijderd (WebChat is buiten gebruik gesteld)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (en per account)      | `...threadBindings.idleHours`                                               |
    | verouderde `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | verouderde realtime-selectors voor Talk op het hoogste niveau (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS-luidsprekervelden `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (alle kanalen behalve Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (alle kanalen, inclusief Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (bij het opstarten slaat de Gateway ook providers over waarvan `api` een toekomstige/onbekende enumwaarde is, in plaats van gesloten te falen) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | verwijderd (verouderde relayinstelling voor de Chrome-extensie)                             |
    | `mcp.servers.*.type` (CLI-native aliassen)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | verwijderd (de Codex-appserver houdt Codex-native werkruimtetools altijd native) |
    | `commands.modelsWrite`                                                                           | verwijderd (`/models add` is verouderd)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | verwijderd (exacte `NO_REPLY` wordt niet langer herschreven naar zichtbare terugvaltekst)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | verwijderd (OpenClaw beheert de gegenereerde systeemprompt)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | verwijderd (gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage modellen/providers, onder de time-outlimiet van de agent/run gehouden) |
    | `memorySearch` op het hoogste niveau                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (elk niveau)                                                            | verwijderd (geheugenindexen bevinden zich in elke agentdatabase)                       |
    | `heartbeat` op het hoogste niveau                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | beleids-ID's van `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | verwijderd (verouderd)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      De bovenstaande `plugins.entries.voice-call.config.*`-rijen worden bij elke configuratielading door
      de Voice Call-plugin zelf genormaliseerd, niet door `openclaw
      doctor`. De Plugin registreert ook een opstartwaarschuwing die naar `openclaw
      doctor --fix` verwijst, maar doctor herschrijft
      `openclaw.json` momenteel niet voor deze sleutels; de normalisatie van de Plugin zelf
      past de wijziging tijdens runtime toe.
    </Note>

    Richtlijnen voor standaardaccounts bij kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat terugvalroutering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en geeft deze de geconfigureerde account-ID's weer.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus uit `openclaw/plugin-sdk/llm`. Daardoor kunnen modellen gedwongen worden de verkeerde API te gebruiken of kunnen kosten op nul worden gezet. Doctor waarschuwt, zodat je de overschrijving kunt verwijderen en de API-routering en kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en gereedheid van Chrome MCP">
    Als je browserconfiguratie nog naar het verwijderde Chrome-extensiepad verwijst, normaliseert doctor dit naar het huidige hostlokale Chrome MCP-koppelingsmodel (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` verwijderd).

    Doctor controleert ook het hostlokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer deze lager is dan Chrome 144
    - herinnert je eraan externe foutopsporing in te schakelen op de inspectiepagina van de browser (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de instelling aan de Chrome-zijde niet voor je inschakelen. Voor hostlokale Chrome MCP is nog steeds een op Chromium gebaseerde browser 144+ vereist die lokaal op de Gateway-/Node-host draait, met externe foutopsporing ingeschakeld en waarbij het eerste toestemmingsverzoek voor koppeling in de browser is goedgekeurd.

    De gereedheidscontrole hier omvat alleen de lokale koppelingsvereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of een onbewerkt CDP-profiel. Deze controle is niet van toepassing op Docker-, sandbox-, externe-browser- of andere headless-processen, die onbewerkt CDP blijven gebruiken.

  </Accordion>
  <Accordion title="2d. TLS-vereisten voor OAuth">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te controleren of de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, een verlopen certificaat of een zelfondertekend certificaat), toont doctor platformspecifieke instructies om dit op te lossen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test ook uitgevoerd als de Gateway in orde is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen onder `models.providers.openai-codex` hebt toegevoegd, kunnen deze het ingebouwde providerpad voor Codex OAuth overschaduwen. Doctor waarschuwt wanneer deze oude transportinstellingen naast Codex OAuth worden aangetroffen, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het huidige routeringsgedrag kunt herstellen. Aangepaste proxy's en overschrijvingen met alleen headers blijven ondersteund en activeren deze waarschuwing niet, maar deze handmatig gedefinieerde aanvraagroutes komen niet in aanmerking voor impliciete Codex-selectie.
  </Accordion>
  <Accordion title="2f. Reparatie van Codex-routes">
    Doctor controleert op verouderde `openai-codex/*`-modelverwijzingen. Systeemeigen routering van de Codex-harness gebruikt canonieke `openai/*`-modelverwijzingen, maar alleen het voorvoegsel selecteert Codex nooit. Als het runtimebeleid niet is ingesteld of `auto` is, komt alleen een exacte officiële HTTPS-route voor Platform Responses of ChatGPT Responses zonder handmatig gedefinieerde aanvraagoverschrijving in aanmerking. Zie [Impliciete OpenAI-agentruntime](/nl/providers/openai#implicit-agent-runtime).

    In de modus `--fix` / `--repair` herschrijft doctor de betrokken verwijzingen voor de standaardagent en afzonderlijke agents, waaronder primaire modellen, fallbacks, modellen voor het genereren van afbeeldingen/video's, overschrijvingen voor Heartbeat/subagent/Compaction, hooks, kanaalmodeloverschrijvingen en verouderde opgeslagen sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - Codex-intentie wordt verplaatst naar provider-/modelgebonden `agentRuntime.id: "codex"`-vermeldingen voor gerepareerde agentmodelverwijzingen.
    - Verouderde runtimeconfiguratie voor de volledige agent en opgeslagen runtimepinnen van sessies worden verwijderd, omdat runtimeselectie provider-/modelgebonden is.
    - Bestaand runtimebeleid voor provider/model blijft behouden, tenzij de gerepareerde verouderde modelverwijzing Codex-routering nodig heeft om het oude authenticatiepad te behouden.
    - Bestaande lijsten met modelfallbacks blijven behouden, waarbij hun verouderde vermeldingen worden herschreven; gekopieerde instellingen per model worden van de verouderde sleutel naar de canonieke sleutel `openai/*` verplaatst.
    - Opgeslagen sessiegegevens voor `modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen en authenticatieprofielpinnen worden in alle gevonden sessieopslagen van agents gerepareerd.
    - Doctor repareert afzonderlijk verouderde `agentRuntime.id: "codex-cli"`-pinnen (een afzonderlijke verouderde runtime-id) naar `"codex"` in modelvermeldingen van `agents.defaults`, `agents.list[]` en `models.providers.*`.
    - `/codex ...` betekent "een systeemeigen Codex-gesprek vanuit de chat beheren of eraan koppelen."
    - `/acp ...` of `runtime: "acp"` betekent "de externe ACP/acpx-adapter gebruiken."

  </Accordion>
  <Accordion title="2g. Opschoning van sessieroutes">
    Doctor scant gevonden sessieopslagen van agents ook op verouderde, automatisch aangemaakte routestatus nadat je geconfigureerde modellen of de runtime hebt verplaatst van een Plugin-beheerde route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"`-modelpinnen, runtimemodelmetadata, vastgezette harness-id's, CLI-sessiekoppelingen en automatische authenticatieprofieloverschrijvingen wanneer de route die ze beheert niet meer is geconfigureerd. Expliciete modelkeuzes van gebruikers of verouderde sessies worden gemeld voor handmatige controle en blijven ongewijzigd; wissel ze met `/model ...`, `/new` of stel de sessie opnieuw in wanneer die route niet meer bedoeld is.

  </Accordion>
  <Accordion title="3. Migraties van verouderde status (schijfindeling)">
    Doctor kan oudere schijfindelingen naar de huidige structuur migreren:

    - Sessieopslag en transcripties: van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap: van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authenticatiestatus (Baileys): van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`) naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-id: `default`)

    Deze migraties worden naar beste vermogen uitgevoerd en zijn idempotent; doctor geeft waarschuwingen wanneer verouderde mappen als back-up achterblijven. De Gateway/CLI migreert de verouderde sessies en agentmap bij het opstarten ook automatisch, zodat geschiedenis/authenticatie/modellen zonder handmatige doctor-uitvoering in het pad per agent terechtkomen. WhatsApp-authenticatie wordt bewust alleen via `openclaw doctor` gemigreerd. De normalisatie van Talk-providers/provider-toewijzingen vergelijkt op structurele gelijkheid, zodat verschillen die alleen de sleutelvolgorde betreffen niet langer herhaaldelijk nutteloze `doctor --fix`-wijzigingen activeren.

  </Accordion>
  <Accordion title="3a. Migraties van verouderde Plugin-manifesten">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde mogelijkhedenleutels op het hoogste niveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer deze worden gevonden, biedt doctor aan ze naar het object `contracts` te verplaatsen en het manifestbestand ter plaatse te herschrijven. Deze migratie is idempotent; als `contracts` al dezelfde waarden bevat, wordt de verouderde sleutel verwijderd zonder gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Migraties van verouderde Cron-opslag">
    Doctor controleert ook de opslag voor Cron-taken (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude taakstructuren die de planner nog steeds accepteert voor compatibiliteit.

    De huidige Cron-opschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op het hoogste niveau (`message`, `model`, `thinking`, ...) → `payload`
    - afleveringsvelden op het hoogste niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-aliassen voor `provider`-aflevering → expliciete `delivery.channel`
    - verouderde `notify: true`-Webhook-fallbacktaken → expliciete Webhook-aflevering vanuit `cron.webhook` wanneer ingesteld; aankondigingstaken behouden hun chataflevering en krijgen `delivery.completionDestination`. Wanneer `cron.webhook` niet is ingesteld, wordt de inactieve markering `notify` op het hoogste niveau verwijderd voor taken zonder doel (bestaande aflevering, inclusief aankondigingen, blijft behouden), omdat de runtimeaflevering deze nooit leest.

    De Gateway schoont bij het laden ook onjuist gevormde Cron-rijen op, zodat geldige taken blijven worden uitgevoerd. Onbewerkte onjuist gevormde rijen worden vóór verwijdering uit `jobs.json` gekopieerd naar `jobs-quarantine.json` naast de actieve opslag; doctor meldt in quarantaine geplaatste rijen, zodat je ze handmatig kunt controleren of repareren.

    Bij het opstarten normaliseert de Gateway de runtimeprojectie en negeert deze de markering `notify` op het hoogste niveau, maar laat de opgeslagen Cron-configuratie intact voor reparatie door doctor. Wanneer `cron.webhook` niet is ingesteld, verwijdert doctor de inactieve markering voor taken zonder migratiedoel (`delivery.mode` geen/afwezig, een onbruikbaar Webhook-doel of bestaande aankondigings-/chataflevering), waarbij de bestaande aflevering ongewijzigd blijft, zodat herhaalde uitvoeringen van `doctor --fix` niet langer opnieuw voor dezelfde taak waarschuwen. Als `cron.webhook` is ingesteld maar geen geldige HTTP(S)-URL is, blijft doctor waarschuwen en laat deze de markering staan, zodat je de URL kunt corrigeren.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat hostlokale script wordt niet onderhouden door de huidige OpenClaw-versie en kan onjuiste `Gateway inactive`-meldingen naar `~/.openclaw/logs/whatsapp-health.log` schrijven wanneer Cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor de huidige statuscontroles.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke agentsessiemap op verouderde schrijfvergrendelingsbestanden die zijn achtergebleven nadat een sessie abnormaal werd beëindigd. Voor elk gevonden vergrendelingsbestand meldt doctor: het pad, de PID, of de PID nog actief is, de ouderdom van de vergrendeling en of deze als verouderd wordt beschouwd (inactieve PID, onjuist gevormde metadata van de eigenaar, ouder dan 30 minuten of een actieve PID waarvan is aangetoond dat deze bij een niet-OpenClaw-proces hoort). In de modus `--fix` / `--repair` verwijdert doctor automatisch vergrendelingen met inactieve, verweesde, hergebruikte, oude onjuist gevormde of niet-OpenClaw-eigenaren. Oude vergrendelingen die nog bij een actief OpenClaw-proces horen, worden gemeld maar blijven staan, zodat doctor een actieve transcriptschrijver niet afbreekt.
  </Accordion>
  <Accordion title="3d. Reparatie van sessietranscriptvertakkingen">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde vertakkingsstructuur die is ontstaan door de fout bij het herschrijven van prompttranscripties in 2026.4.24: een verlaten gebruikersbeurt met interne OpenClaw-runtimecontext en een actieve nevenvertakking met dezelfde zichtbare gebruikersprompt. In de modus `--fix` / `--repair` maakt doctor naast het origineel een back-up van elk betrokken bestand en herschrijft deze het transcript naar de actieve vertakking, zodat lezers van Gateway-geschiedenis en geheugen geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessieopslag, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als deze verdwijnt, verlies je sessies, aanmeldgegevens, logboeken en configuratie, tenzij je elders back-ups hebt.

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal verlies van statusgegevens, vraagt om de map opnieuw aan te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: controleert de schrijfbaarheid; biedt aan de machtigingen te herstellen (en geeft een `chown`-hint wanneer een verschil in eigenaar/groep wordt gedetecteerd).
    - **Via de cloud gesynchroniseerde statusmap in macOS**: waarschuwt wanneer de status onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...` wordt gevonden, omdat door synchronisatie ondersteunde paden tragere I/O en vergrendelings-/synchronisatieraces kunnen veroorzaken.
    - **Statusmap op Linux-SD of -eMMC**: waarschuwt wanneer de status naar een `mmcblk*`-aankoppelbron wordt herleid, omdat willekeurige I/O op SD/eMMC trager kan zijn en sneller slijtage kan veroorzaken bij het schrijven van sessies en referenties.
    - **Vluchtige statusmap in Linux**: waarschuwt wanneer de status naar `tmpfs` of `ramfs` wordt herleid, omdat sessies, referenties, configuratie en SQLite-status (met WAL-/journaal-zijbestanden) bij opnieuw opstarten verdwijnen. Docker-`overlay`-aankoppelingen worden bewust niet gemarkeerd, omdat hun schrijfbare lagen behouden blijven wanneer de host opnieuw wordt opgestart zolang de container blijft bestaan.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om de geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcript komt niet overeen**: waarschuwt wanneer transcriptbestanden ontbreken voor recente sessievermeldingen.
    - **Hoofdsessie met "JSONL van 1 regel"**: markeert wanneer het hoofdtranscript slechts één regel bevat (de geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen in thuismappen bestaan of wanneer `OPENCLAW_STATE_DIR` naar elders verwijst (de geschiedenis kan over installaties worden verdeeld).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan om het op de externe host uit te voeren (de status bevindt zich daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor de groep/iedereen en biedt aan de machtigingen aan te scherpen tot `600`.

  </Accordion>
  <Accordion title="5. Status van modelauthenticatie (verlopen van OAuth)">
    Doctor inspecteert OAuth-profielen in de authenticatieopslag, waarschuwt wanneer tokens binnenkort verlopen of al verlopen zijn en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic-installatietokenpad voor. Vragen om te vernieuwen verschijnen alleen bij interactieve uitvoering (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant` of wanneer een provider aangeeft dat je opnieuw moet inloggen), meldt doctor dat herauthenticatie vereist is en toont het de exacte uit te voeren opdracht `openclaw models auth login --provider ...`.

    Doctor meldt ook authenticatieprofielen die tijdelijk onbruikbaar zijn vanwege korte afkoelperioden (snelheidslimieten/time-outs/authenticatiefouten) of langere uitschakelingen (facturerings-/tegoedfouten).

    Verouderde Codex OAuth-profielen waarvan de tokens zich in macOS Keychain bevinden (oudere onboarding van vóór de bestandsgebaseerde zijbestandsindeling), worden alleen door doctor hersteld. Voer `openclaw doctor --fix` eenmaal uit vanuit een interactieve terminal om verouderde, door Keychain ondersteunde tokens rechtstreeks naar `auth-profiles.json` te migreren; daarna worden ze bij ingebedde beurten (Telegram, cron, verzending naar subagenten) als canonieke OpenAI OAuth-profielen herkend.

  </Accordion>
  <Accordion title="6. Modelvalidatie voor hooks">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelverwijzing aan de hand van de catalogus en toelatingslijst en waarschuwt het wanneer deze niet kan worden herkend of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar verouderde namen als het huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Opschoning van Plugin-installatie">
    Doctor verwijdert verouderde, door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in de modus `openclaw doctor --fix` / `openclaw doctor --repair`: verouderde gegenereerde afhankelijkheidsroots, oude installatiestagingmappen, pakketlokale restanten van eerdere herstelcode voor afhankelijkheden van gebundelde Plugins en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-Plugins die het huidige gebundelde manifest kunnen overschaduwen. Doctor koppelt ook het `openclaw`-hostpakket opnieuw aan beheerde npm-Plugins die `peerDependencies.openclaw` declareren, zodat pakketlokale runtime-imports zoals `openclaw/plugin-sdk/*` na updates of npm-reparaties blijven werken.

    Doctor kan ook ontbrekende downloadbare Plugins opnieuw installeren wanneer de configuratie ernaar verwijst, maar het lokale Plugin-register ze niet kan vinden (materiële `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen, geconfigureerde agentruntimes). Tijdens pakketupdates vermijdt doctor het opnieuw installeren van Plugin-pakketten terwijl het kernpakket wordt vervangen; voer `openclaw doctor --fix` na de update opnieuw uit als een geconfigureerde Plugin nog steeds moet worden hersteld. Buiten de onderstaande uitzondering voor het opstarten van het container-image voeren het opstarten van de Gateway en het opnieuw laden van de configuratie geen pakketherstel uit; Plugin-installaties blijven expliciet doctor-/installatie-/updatewerk.

    Het opstarten van een gecontaineriseerde Gateway heeft een beperkte upgrade-uitzondering: wanneer `openclaw gateway run` op een nieuwe OpenClaw-versie start, voert het vóór gereedheid veilige statusmigraties en de bestaande convergentie na de kernupdate van Plugins uit en registreert het vervolgens een controlepunt per versie. Deze opstartcyclus kan verouderde records van gebundelde Plugins opschonen, lokale Plugin-koppelingen herstellen, geconfigureerde Plugin-pakketten opnieuw installeren wanneer het convergentiepad dat vereist en actieve Plugin-payloads controleren. Als het opstarten geen veilig herstel kan uitvoeren, voer je hetzelfde image eenmaal uit met `openclaw doctor --fix` voor dezelfde aangekoppelde status/configuratie voordat je de container normaal opnieuw opstart.

  </Accordion>
  <Accordion title="8. Migraties van Gateway-service en opschoonhints">
    Doctor detecteert verouderde Gateway-services (launchd/systemd/schtasks) en biedt aan deze te verwijderen en de OpenClaw-service met de huidige Gateway-poort te installeren. Het kan ook zoeken naar extra Gateway-achtige services en opschoonhints tonen. OpenClaw Gateway-services met een profielnaam worden als volwaardig beschouwd en niet als "extra" gemarkeerd.

    Als op Linux de Gateway-service op gebruikersniveau ontbreekt, maar er een OpenClaw Gateway-service op systeemniveau bestaat, installeert doctor niet automatisch een tweede service op gebruikersniveau. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep` en verwijder vervolgens het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeemsupervisor de levenscyclus van de Gateway beheert.

  </Accordion>
  <Accordion title="8b. Matrix-migratie bij opstarten">
    Wanneer een Matrix-kanaalaccount een wachtende of uitvoerbare migratie van verouderde status heeft, maakt doctor (in de modus `--fix` / `--repair`) een momentopname van vóór de migratie en voert het vervolgens naar beste vermogen de migratiestappen uit: migratie van verouderde Matrix-status en voorbereiding van verouderde versleutelde status. Beide stappen zijn niet-fataal; fouten worden geregistreerd en het opstarten gaat door. In de alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en authenticatieafwijking">
    Doctor inspecteert de status van apparaatkoppelingen als onderdeel van de normale statuscontrole en meldt:

    - wachtende aanvragen voor een eerste koppeling
    - wachtende upgrades van rollen of bereiken voor reeds gekoppelde apparaten
    - herstel van verschillen in openbare sleutels waarbij de apparaat-id nog overeenkomt, maar de apparaatidentiteit niet langer overeenkomt met de goedgekeurde registratie
    - gekoppelde registraties zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de bereiken buiten de goedgekeurde koppelingsbasislijn zijn geraakt
    - lokaal gecachete apparaattokenvermeldingen voor de huidige machine die dateren van vóór een tokenrotatie aan de Gateway-zijde of verouderde bereikmetadata bevatten

    Doctor keurt koppelingsaanvragen niet automatisch goed en roteert apparaattokens niet automatisch. Het toont de exacte vervolgstappen:

    - inspecteer wachtende aanvragen met `openclaw devices list`
    - keur de exacte aanvraag goed met `openclaw devices approve <requestId>`
    - roteer een nieuw token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderde registratie en keur deze opnieuw goed met `openclaw devices remove <deviceId>`

    Dit maakt onderscheid tussen een eerste koppeling, wachtende upgrades van rollen/bereiken en afwijkingen door verouderde tokens/apparaatidentiteiten, waardoor het veelvoorkomende gat "al gekoppeld maar nog steeds de melding krijgen dat koppeling vereist is" wordt gedicht.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft alleen een beveiligingsmelding wanneer het een waarschuwing aantreft, zoals een provider die zonder toelatingslijst openstaat voor privéberichten of een gevaarlijk geconfigureerd beleid. Gebruik `openclaw security audit` voor de volledige beveiligingsinventaris.
  </Accordion>
  <Accordion title="10. systemd-linger (Linux)">
    Bij uitvoering als een systemd-gebruikersservice zorgt doctor ervoor dat lingering is ingeschakeld, zodat de Gateway na afmelden actief blijft.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, Plugins en TaskFlows)">
    Doctor toont problemen en acties voor de standaardagent, niet de inventaris voor een gezonde status:

    - **Skills**: vermeldt namen van toegestane maar onbruikbare Skills; gebruik `openclaw skills check` voor details over vereisten en volledige aantallen.
    - **Plugins**: meldt alleen Plugin-id's met fouten; gebruik `openclaw plugins list` voor de inventaris van geladen, geïmporteerde, uitgeschakelde en gebundelde Plugins.
    - **Waarschuwingen voor Plugin-compatibiliteit**: markeert Plugins die compatibiliteitsproblemen met de huidige runtime hebben.
    - **Plugin-diagnostiek**: toont alle waarschuwingen of fouten tijdens het laden die door het Plugin-register zijn gegenereerd.
    - **TaskFlow-herstel**: toont verdachte beheerde TaskFlows die handmatige inspectie of annulering vereisen.
    - **Claude CLI**: meldt alleen problemen met het binaire bestand, de authenticatie, het profiel, de werkruimte of de projectmap; details van geslaagde controles worden weggelaten.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestanden">
    Doctor controleert of bootstrapbestanden van de werkruimte (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) in de buurt van of boven het geconfigureerde tekenbudget zitten. Het meldt per bestand de onbewerkte versus geïnjecteerde aantallen tekens, het afkappingspercentage, de oorzaak van de afkapping (`max/file` of `max/total`) en het totale aantal geïnjecteerde tekens als deel van het totale budget. Wanneer bestanden zijn afgekapt of bijna de limiet bereiken, toont doctor tips voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Shell-aanvulling">
    Doctor controleert of tabaanvulling voor de huidige shell is geïnstalleerd (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), werkt doctor dit bij naar de snellere variant met een gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd, maar het cachebestand ontbreekt, genereert doctor de cache automatisch opnieuw.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen in interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaal-Plugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaal-Plugin verwijdert, verwijdert het ook de loshangende kanaalspecifieke configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, Heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overschrijvingen. Dit voorkomt opstartlussen van de Gateway waarbij de kanaalruntime verdwenen is, maar de configuratie de Gateway nog steeds vraagt eraan te koppelen.
  </Accordion>
  <Accordion title="12. Gateway-authenticatiecontroles (lokaal token)">
    Doctor controleert of lokale Gateway-tokenauthenticatie gereed is.

    - Als de tokenmodus een token vereist en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het deze niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` dwingt het genereren alleen af wanneer geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen, SecretRef-bewuste reparaties">
    Sommige herstelstromen moeten geconfigureerde referenties inspecteren zonder het snelle falen van de runtime af te zwakken.

    - `openclaw doctor --fix` gebruikt hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusgerelateerde opdrachten voor gerichte configuratiereparaties.
    - Voorbeeld: reparatie van Telegram `allowFrom` / `groupAllowFrom` `@username` probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, meldt doctor dat de referentie geconfigureerd maar niet beschikbaar is en slaat automatische oplossing over, in plaats van te crashen of ten onrechte te melden dat het token ontbreekt.

  </Accordion>
  <Accordion title="13. Gateway-statuscontrole en herstart">
    Doctor voert een statuscontrole uit en biedt aan de Gateway opnieuw te starten wanneer deze niet goed lijkt te functioneren.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor de geheugenzoekfunctie gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of het binaire bestand `qmd` beschikbaar en startbaar is. Zo niet, dan worden reparatie-instructies weergegeven, waaronder `npm install -g @tobilu/qmd` (of het Bun-equivalent) en een optie voor een handmatig pad naar het binaire bestand.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als deze ontbreekt, wordt voorgesteld over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enzovoort): controleert of er een API-sleutel aanwezig is in de omgeving of de authenticatieopslag. Geeft bruikbare reparatietips weer als deze ontbreekt.
    - **Verouderde automatische provider**: behandelt `memorySearch.provider: "auto"` als OpenAI, controleert of OpenAI gereed is en herschrijft deze met `doctor --fix` naar `provider: "openai"`.

    Wanneer een gecachet resultaat van een Gateway-controle beschikbaar is (de Gateway functioneerde goed op het moment van de controle), vergelijkt doctor dit resultaat met de via de CLI zichtbare configuratie en vermeldt eventuele afwijkingen. Doctor start in het standaardpad geen nieuwe embedding-ping; gebruik de diepgaande geheugenstatusopdracht wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om tijdens runtime te controleren of embeddings gereed zijn.

  </Accordion>
  <Accordion title="14. Waarschuwingen over kanaalstatus">
    Als de Gateway goed functioneert, voert doctor een kanaalstatuscontrole uit en meldt het waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit en reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijvoorbeeld systemd-afhankelijkheden voor network-online en de vertraging voor opnieuw starten). Wanneer een afwijking wordt gevonden, wordt een update aanbevolen en kan doctor het servicebestand/de taak herschrijven met de huidige standaardwaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat de supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardvragen voor reparatie.
    - `openclaw doctor --fix` past aanbevolen oplossingen toe zonder vragen (`--repair` is een alias).
    - `openclaw doctor --fix --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de Gateway-service. Het meldt nog steeds de servicestatus en voert reparaties uit die niet met de service samenhangen, maar slaat service-installatie/-start/-herstart/-bootstrap, het herschrijven van de supervisorconfiguratie en het opschonen van verouderde services over, omdat een externe supervisor eigenaar is van die levenscyclus.
    - Op Linux herschrijft doctor geen metadata voor opdrachten/toegangspunten zolang de overeenkomende systemd-eenheid van de Gateway actief is. Tijdens de scan naar dubbele services negeert het ook inactieve, niet-verouderde extra Gateway-achtige eenheden, zodat aanvullende servicebestanden geen onnodige opschoningsmeldingen veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert de installatie/reparatie van de doctor-service de SecretRef, maar worden opgeloste platte-tekstwaarden van tokens niet opgeslagen in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde, door `.env`/SecretRef ondersteunde serviceomgevingswaarden die door oudere installaties van LaunchAgent, systemd of Windows Scheduled Task inline zijn ingesloten, en herschrijft de servicemetadata zodat deze waarden vanuit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer de serviceopdracht na wijzigingen in `gateway.port` nog steeds een oude `--port` vastlegt en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde SecretRef voor het token niet kan worden opgelost, blokkeert doctor het installatie-/reparatiepad met bruikbare instructies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux-eenheden van systemd voor gebruikers omvatten de controles van doctor op tokenafwijkingen zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van authenticatiemetadata van de service.
    - Reparaties van de doctor-service weigeren een Gateway-service vanuit een ouder binair bestand van OpenClaw te herschrijven, stoppen of opnieuw te starten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostiek van Gateway-runtime en poort">
    Doctor inspecteert de serviceruntime (PID, laatste afsluitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk actief is. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en meldt waarschijnlijke oorzaken (Gateway is al actief, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor de Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service op Bun of via een door een versiebeheerder beheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enzovoort) wordt uitgevoerd. Bun kan de `node:sqlite`-statusopslag van OpenClaw niet openen, dus bij reparaties worden verouderde Bun-services naar Node gemigreerd. Paden van versiebeheerders kunnen na upgrades niet meer werken, omdat de service je shell-initialisatie niet laadt. Doctor biedt aan om naar een systeeminstallatie van Node te migreren wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat door Homebrew beheerde systeembinaire bestanden beschikbaar blijven, terwijl mappen van Volta, asdf, fnm, pnpm en andere versiebeheerders niet wijzigen welke onderliggende Node-processen worden gevonden. Linux-services behouden nog steeds expliciete omgevingshoofdmappen (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele gebruikersmappen voor binaire bestanden, maar veronderstelde terugvalmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie opslaan en wizardmetadata">
    Doctor slaat alle configuratiewijzigingen op en voegt wizardmetadata toe om de uitvoering van doctor vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up en geheugensysteem)">
    Doctor stelt een geheugensysteem voor de werkruimte voor wanneer dit ontbreekt en geeft een back-uptip weer als de werkruimte nog niet onder git-versiebeheer staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige handleiding over de werkruimtestructuur en git-back-ups (een privé-opslagplaats op GitHub of GitLab wordt aanbevolen).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-draaiboek](/nl/gateway)
- [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting)
