---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-opdracht: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Dokter
x-i18n:
    generated_at: "2026-06-27T17:33:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is de reparatie- en migratietool voor OpenClaw. Deze herstelt verouderde configuratie/status, controleert de gezondheid en biedt uitvoerbare reparatiestappen.

## Snel starten

```bash
openclaw doctor
```

### Headless- en automatiseringsmodi

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepteer standaardwaarden zonder vragen (inclusief stappen voor herstart/service/sandbox-reparatie wanneer van toepassing).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Pas aanbevolen reparaties toe zonder vragen (reparaties + herstarts waar veilig).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Voer gestructureerde gezondheidscontroles uit voor CI of preflight-automatisering. Deze modus is
    alleen-lezen: hij stelt geen vragen, repareert niets, migreert geen configuratie, herstart geen services en
    raakt geen status aan.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Pas ook agressieve reparaties toe (overschrijft aangepaste supervisorconfiguraties).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + statusverplaatsingen op schijf). Slaat herstart-/service-/sandbox-acties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra gateway-installaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Als je wijzigingen wilt bekijken voordat je schrijft, open dan eerst het configuratiebestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Alleen-lezen lintmodus

`openclaw doctor --lint` is de automatiseringsvriendelijke tegenhanger van
`openclaw doctor --fix`. Beide gebruiken gezondheidscontroles van doctor, maar hun houding is
anders:

| Modus                    | Prompts   | Schrijft configuratie/status | Uitvoer                    | Gebruik dit voor                       |
| ------------------------ | --------- | ---------------------------- | -------------------------- | -------------------------------------- |
| `openclaw doctor`        | ja        | nee                          | vriendelijk gezondheidsrapport | een mens die de status controleert |
| `openclaw doctor --fix`  | soms      | ja, met reparatiebeleid      | vriendelijk reparatielog   | goedgekeurde reparaties toepassen      |
| `openclaw doctor --lint` | nee       | nee                          | gestructureerde bevindingen | CI, preflight en reviewpoorten         |

Gemoderniseerde gezondheidscontroles kunnen een optionele `repair()`-implementatie bieden.
`doctor --fix` past die reparaties toe wanneer ze bestaan en blijft de
bestaande doctor-reparatiestroom gebruiken voor controles die nog niet zijn gemigreerd.
Het gestructureerde reparatiecontract scheidt ook reparagerapportage van detectie:
`detect()` rapporteert huidige bevindingen, terwijl `repair()` wijzigingen,
configuratie-/bestandsdiffs en niet-bestandsgebonden neveneffecten kan rapporteren. Dat houdt het migratiepad open
voor toekomstige `doctor --fix --dry-run`- en diff-uitvoer zonder lintcontroles
mutaties te laten plannen.

Voorbeelden:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON-uitvoer bevat:

- `ok`: of een zichtbare bevinding aan de geselecteerde ernstgrens voldeed
- `checksRun`: aantal uitgevoerde gezondheidscontroles
- `checksSkipped`: controles overgeslagen door het geselecteerde profiel, `--only` of `--skip`
- `findings`: gestructureerde diagnostiek met `checkId`, `severity`, `message` en
  optioneel `path`, `line`, `column`, `ocPath` en `fixHint`

Exitcodes:

- `0`: geen bevindingen op of boven de geselecteerde grens
- `1`: een of meer bevindingen voldeden aan de geselecteerde grens
- `2`: opdracht-/runtimefout voordat lintbevindingen konden worden uitgevoerd

Gebruik `--severity-min info|warning|error` om te bepalen wat wordt afgedrukt en wat
een niet-nul lint-exit veroorzaakt. Gebruik `--all` om de volledige lintinventaris uit te voeren,
inclusief diepere opt-in-controles die van de standaard automatiseringsset zijn uitgesloten. Gebruik `--only <id>` voor smalle preflight-poorten en
`--skip <id>` om een rumoerige controle tijdelijk uit te sluiten terwijl de rest van de
lint-run actief blijft.
Lint-uitvoeropties zoals `--json`, `--severity-min`, `--all`, `--only` en
`--skip` moeten worden gecombineerd met `--lint`; normale doctor- en reparatieruns weigeren
ze.

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele preflight-update voor git-installaties (alleen interactief).
    - Versheidscontrole van UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Skills-statussamenvatting (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Talk-configuratiemigratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migratie van verouderde OpenAI Codex-provider/-profiel (`openai-codex` → `openai`) en schaduwwaarschuwingen voor verouderde `models.providers.openai-codex`.
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin-/tool-allowlists wanneer `plugins.allow` beperkend is, maar het toolbeleid nog steeds om wildcard- of Plugin-eigen tools vraagt.
    - Migratie van verouderde status op schijf (sessions/agent dir/WhatsApp-auth).
    - Migratie van verouderde contractsleutels in Plugin-manifest (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cron-opslag (`jobId`, `schedule.cron`, top-level delivery/payload-velden, payload `provider`, `notify: true` webhook-fallbacktaken).
    - Opschoning van verouderd runtimebeleid voor volledige agents; provider-/modelruntimebeleid is de actieve routekiezer.
    - Opschoning van verouderde Plugin-configuratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor dubbele prompt-herschrijftakken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van vastgelopen subagent-herstarthersteltombstones, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken herstelvlaggen zodat opstarten het kind niet als herstart-afgebroken blijft behandelen.
    - Statusintegriteits- en machtigingscontroles (sessies, transcripties, statusmap).
    - Machtigingscontroles voor configuratiebestanden (chmod 600) wanneer lokaal uitgevoerd.
    - Model-auth-gezondheid: controleert OAuth-verloop, kan bijna verlopende tokens verversen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra Gateway.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix` / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Kanaalstatuswaarschuwingen (gepeild vanuit de actieve Gateway).
    - Kanaalspecifieke machtigingscontroles staan onder `openclaw channels capabilities`; Discord-spraakkanaalmachtigingen worden bijvoorbeeld gecontroleerd met `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - WhatsApp-responsiviteitscontroles voor verslechterde Gateway-event-loopgezondheid terwijl lokale TUI-clients nog draaien; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Codex-routereparatie voor verouderde `openai-codex/*`-modelrefs in primaire modellen, fallbacks, beeld-/videogeneratiemodellen, heartbeat-/subagent-/compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroutepins; `--fix` herschrijft ze naar `openai/*`, migreert `openai-codex:*`-authprofielen/-volgorde naar `openai:*`, verwijdert verouderde sessie-/volledige-agentruntimepins en laat canonieke OpenAI-agentrefs op de standaard Codex-harness staan.
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van ingesloten proxyomgeving voor Gateway-services die shell-waarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Auth, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-auth-controles voor lokale tokenmodus (biedt tokengeneratie wanneer er geen tokenbron bestaat; overschrijft geen token SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (lopende eerste koppelverzoeken, lopende rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en auth-drift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van de grootte van werkruimte-bootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Skills-gereedheidscontrole voor de standaardagent; rapporteert toegestane skills met ontbrekende bins, env, config of OS-vereisten, en `--fix` kan niet-beschikbare skills uitschakelen in `skills.entries`.
    - Statuscontrole en automatische installatie/upgrade van shell-aanvulling.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallatie (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Dreams-scène van Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de grounded dreaming-workflow. Deze acties gebruiken doctor-achtige RPC-methoden van de Gateway, maar ze maken **geen** deel uit van de reparatie/migratie via de `openclaw doctor` CLI.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de grounded REM-dagboekpass uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede grounded-only kortetermijnvermeldingen die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen grounded kandidaten niet automatisch naar de live kortetermijnpromotieopslag, tenzij je eerst expliciet het gestagede CLI-pad uitvoert

Als je wilt dat grounded historische replay de normale diepe promotielaan beïnvloedt, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget grounded duurzame kandidaten naar de kortetermijn-dreamingopslag, terwijl `DREAMS.md` het review-oppervlak blijft.

## Gedetailleerd gedrag en onderbouwing

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief draait, biedt het aan om te updaten (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder een kanaalspecifieke overschrijving), normaliseert doctor deze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige publieke Talk-spraakconfiguratie is `talk.provider` + `talk.providers.<provider>`, en realtime stemconfiguratie is `talk.realtime.*`. Doctor herschrijft oude vormen `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap, en herschrijft verouderde top-level realtime-selectors (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en het toolbeleid
    wildcard- of plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve plugin-allowlist niet.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    Gateway-start weigert verouderde configuratie-indelingen en vraagt je `openclaw doctor --fix` uit te voeren; het herschrijft `openclaw.json` niet bij het opstarten. Migraties van de Cron-taakopslag worden ook afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - verwijder gepensioneerde `channels.webchat` en `gateway.webchat`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → top-level `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - verouderde `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - verouderde top-level realtime Talk-selectors (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` en `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` en `messages.tts.providers.microsoft`
    - TTS-sprekerselectievelden (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` en `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` en `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Voor kanalen met benoemde `accounts` maar achtergebleven top-level kanaalwaarden voor één account, verplaats die account-scoped waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand passend benoemd/standaarddoel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor trage provider-/model-time-outs en houd de agent-/run-time-out boven die waarde wanneer de hele run langer moet duren
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde extensie-relayinstelling)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-start slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van fail-closed te eindigen)
    - verwijder `plugins.entries.codex.config.codexDynamicToolsProfile`; Codex app-server houdt Codex-native werkruimtetools altijd native

    Doctor-waarschuwingen bevatten ook account-standaardadvies voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus uit `openclaw/plugin-sdk/llm`. Daardoor kunnen modellen naar de verkeerde API worden gedwongen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en gereedheid voor Chrome MCP">
    Als je browserconfiguratie nog naar het verwijderde Chrome-extensiepad wijst, normaliseert doctor die naar het huidige host-lokale Chrome MCP-attachmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatisch verbinden
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan remote debugging in te schakelen op de browserinspectiepagina (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway-/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste attach-toestemmingsprompt in de browser

    Gereedheid gaat hier alleen over lokale attach-vereisten. Existing-session behoudt de huidige Chrome MCP-routelimieten; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), print doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` draait de test zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen onder `models.providers.openai-codex` hebt toegevoegd, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag kunt terugkrijgen. Aangepaste proxy's en overschrijvingen met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex-routereparatie">
    Doctor controleert op verouderde `openai-codex/*`-modelrefs. Native Codex-harnessroutering gebruikt canonieke `openai/*`-modelrefs; OpenAI-agentbeurten lopen via de Codex app-server-harness in plaats van via het OpenClaw OpenAI-providerpad.

    In de modus `--fix` / `--repair` herschrijft doctor getroffen standaardagent- en per-agentrefs, inclusief primaire modellen, fallbacks, modellen voor beeld-/videogeneratie, heartbeat-/subagent-/compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en verouderde opgeslagen sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - Codex-intent verhuist naar provider-/model-scoped `agentRuntime.id: "codex"`-vermeldingen voor gerepareerde agentmodelrefs.
    - Verouderde whole-agent runtimeconfiguratie en opgeslagen sessie-runtimepins worden verwijderd omdat runtimeselectie provider-/model-scoped is.
    - Bestaand provider-/model-runtimebeleid blijft behouden, tenzij de gerepareerde verouderde modelref Codex-routering nodig heeft om het oude auth-pad te behouden.
    - Bestaande model-fallbacklijsten blijven behouden met hun verouderde vermeldingen herschreven; gekopieerde per-modelinstellingen verhuizen van de verouderde sleutel naar de canonieke `openai/*`-sleutel.
    - Opgeslagen sessie-`modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen en auth-profielpins worden gerepareerd in alle ontdekte agentsessieopslagen.
    - `/codex ...` betekent "beheer of bind een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

  </Accordion>
  <Accordion title="2g. Opschoning van sessieroutes">
    Doctor scant ook ontdekte agentsessieopslagen op verouderde automatisch aangemaakte routestatus nadat je geconfigureerde modellen of runtime hebt verplaatst weg van een plugin-eigen route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"`-modelpins, runtime-modelmetadata, vastgezette harness-ID's, CLI-sessiebindingen en automatische auth-profieloverschrijvingen wanneer hun eigenaarroute niet langer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gemeld voor handmatige beoordeling en blijven onaangeraakt; wijzig ze met `/model ...`, `/new` of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Migraties van verouderde status (schijfindeling)">
    Doctor kan oudere on-disk indelingen naar de huidige structuur migreren:

    - Sessiesopslag + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaard account-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het verouderde mappen als back-ups laat staan. De Gateway/CLI migreert ook automatisch de verouderde sessies + agentmap bij het opstarten, zodat geschiedenis/auth/modellen in het per-agentpad terechtkomen zonder een handmatige doctor-run. WhatsApp-auth wordt bewust alleen via `openclaw doctor` gemigreerd. Talk-provider-/provider-mapnormalisatie vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen uit sleutelvolgorde bestaan geen herhaalde no-op `doctor --fix`-wijzigingen meer veroorzaken.

  </Accordion>
  <Accordion title="3a. Migraties van verouderde Plugin-manifesten">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde capability-sleutels op topniveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer deze worden gevonden, biedt het aan ze naar het object `contracts` te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de sleutel `contracts` al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Migraties van verouderde cron-opslag">
    Doctor controleert ook de opslag voor cron-taken (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude taakvormen die de scheduler nog accepteert voor compatibiliteit.

    Huidige cron-opschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op topniveau (`message`, `model`, `thinking`, ...) → `payload`
    - bezorgingsvelden op topniveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-bezorgingsaliassen → expliciete `delivery.channel`
    - verouderde `notify: true` Webhook-fallbacktaken → expliciete Webhook-bezorging vanuit `cron.webhook` wanneer ingesteld; aankondigingstaken behouden hun chatbezorging en krijgen `delivery.completionDestination`. Wanneer `cron.webhook` niet is ingesteld, wordt de inerte `notify`-markering op topniveau verwijderd voor taken zonder doel (bestaande bezorging, inclusief aankondiging, blijft behouden), omdat runtime-bezorging deze nooit leest

    De Gateway schoont ook misvormde cron-rijen op tijdens het laden, zodat geldige taken blijven draaien. Ruwe misvormde rijen worden gekopieerd naar `jobs-quarantine.json` naast de actieve opslag voordat ze uit `jobs.json` worden verwijderd; doctor rapporteert in quarantaine geplaatste rijen zodat je ze handmatig kunt beoordelen of repareren.

    Bij het opstarten normaliseert de Gateway de runtime-projectie en negeert de `notify`-markering op topniveau, maar laat de opgeslagen cron-configuratie staan voor reparatie door doctor. Wanneer `cron.webhook` niet is ingesteld, verwijdert doctor de inerte markering voor taken zonder migratiedoel (`delivery.mode` none/afwezig, een onbruikbaar Webhook-doel, of bestaande aankondigings-/chatbezorging), waarbij de bestaande bezorging ongemoeid blijft, zodat herhaalde `doctor --fix`-runs niet langer opnieuw waarschuwen over dezelfde taak. Als `cron.webhook` is ingesteld maar geen geldige HTTP(S)-URL is, waarschuwt doctor nog steeds en laat het de markering staan zodat je de URL kunt herstellen.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan onjuiste `Gateway inactive`-berichten schrijven naar `~/.openclaw/logs/whatsapp-health.log` wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor huidige gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke agentsessiemap op verouderde schrijfvergrendelingsbestanden — bestanden die zijn achtergebleven wanneer een sessie abnormaal werd afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID, misvormde eigenaarsmetadata, ouder dan 30 minuten, of een live PID waarvan kan worden bewezen dat deze bij een niet-OpenClaw-proces hoort). In de modus `--fix` / `--repair` verwijdert het automatisch vergrendelingen met dode, verweesde, hergebruikte, misvormd-oude of niet-OpenClaw-eigenaars. Oude vergrendelingen die nog steeds eigendom zijn van een live OpenClaw-proces worden gerapporteerd maar blijven staan, zodat doctor geen actieve transcriptieschrijver onderbreekt.
  </Accordion>
  <Accordion title="3d. Reparatie van sessietranscript-branches">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde branch-vorm die is gemaakt door de bug in de prompttranscript-herschrijving van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In de modus `--fix` / `--repair` maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve branch, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van state (sessiepersistentie, routing en veiligheid)">
    De state-map is de operationele hersenstam. Als deze verdwijnt, verlies je sessies, referenties, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **State-map ontbreekt**: waarschuwt voor catastrofaal state-verlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van state-map**: verifieert schrijfbaarheid; biedt aan machtigingen te repareren (en geeft een `chown`-hint wanneer een mismatch in eigenaar/groep wordt gedetecteerd).
    - **macOS-cloudgesynchroniseerde state-map**: waarschuwt wanneer state wordt opgelost onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat paden met synchronisatie tragere I/O en lock-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-state-map**: waarschuwt wanneer state wordt opgelost naar een `mmcblk*`-mountbron, omdat willekeurige I/O op SD of eMMC trager kan zijn en sneller kan slijten bij het schrijven van sessies en referenties.
    - **Linux-vluchtige state-map**: waarschuwt wanneer state wordt opgelost naar `tmpfs` of `ramfs`, omdat sessies, referenties, configuratie en SQLite-state met de bijbehorende WAL-/journaal-sidecars bij herstart verdwijnen. Docker-`overlay`-mounts worden bewust niet gemarkeerd, omdat hun beschrijfbare lagen host-herstarts overleven zolang de container blijft bestaan.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regelige JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere state-mappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in verschillende thuismappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naartoe wijst (geschiedenis kan tussen installaties worden opgesplitst).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan het op de externe host uit te voeren (de state bevindt zich daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verloop)">
    Doctor inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen bij interactief gebruik (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die aangeeft dat je opnieuw moet inloggen), meldt doctor dat herauthenticatie vereist is en drukt het de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte cooldowns (rate limits/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/tegoedfouten)

    Verouderde Codex OAuth-profielen waarvan de tokens in macOS Keychain staan (oudere onboarding vóór de bestandsgebaseerde sidecar-indeling) worden alleen door doctor gerepareerd. Voer één keer `openclaw doctor --fix` uit vanuit een interactieve terminal om verouderde Keychain-backed tokens inline naar `auth-profiles.json` te migreren; daarna lossen embedded beurten (Telegram, cron, sub-agentdispatch) ze op als canonieke OpenAI OAuth-profielen.

  </Accordion>
  <Accordion title="6. Validatie van Hooks-model">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Reparatie van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar verouderde namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Opschoning van Plugin-installaties">
    Doctor verwijdert verouderde door OpenClaw gegenereerde staging-state voor Plugin-afhankelijkheden in de modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dit dekt verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen, pakketlokale resten van eerdere reparatiecode voor afhankelijkheden van gebundelde Plugins, en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-Plugins die het huidige gebundelde manifest kunnen overschaduwen. Doctor koppelt ook het hostpakket `openclaw` opnieuw aan beheerde npm-Plugins die `peerDependencies.openclaw` declareren, zodat pakketlokale runtime-imports zoals `openclaw/plugin-sdk/*` na updates of npm-reparaties blijven oplossen.

    Doctor kan ook ontbrekende downloadbare Plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale Plugin-register ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde channel-/provider-/zoekinstellingen en geconfigureerde agentruntimes. Tijdens pakketupdates vermijdt doctor het uitvoeren van pakketmanager-Plugin-reparatie terwijl het kernpakket wordt vervangen; voer na de update opnieuw `openclaw doctor --fix` uit als een geconfigureerde Plugin nog steeds herstel nodig heeft. Gateway-opstart en configuratieherlading voeren geen pakketmanagers uit; Plugin-installaties blijven expliciet doctor-/installatie-/updatewerk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opschoonhints">
    Doctor detecteert verouderde Gateway-services (launchd/systemd/schtasks) en biedt aan ze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opschoonhints afdrukken. OpenClaw Gateway-services met profielnamen worden als eersteklas beschouwd en worden niet als "extra" gemarkeerd.

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder vervolgens het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeem-supervisor eigenaar is van de Gateway-lifecycle.

  </Accordion>
  <Accordion title="8b. Migratie van Startup Matrix">
    Wanneer een Matrix-channelaccount een lopende of uitvoerbare verouderde state-migratie heeft, maakt doctor (in de modus `--fix` / `--repair`) een pre-migratiesnapshot en voert het daarna de best-effort migratiestappen uit: verouderde Matrix-state-migratie en verouderde voorbereiding van versleutelde state. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu device-pairing-state als onderdeel van de normale gezondheidsronde.

    Wat het rapporteert:

    - lopende eerste koppelingsverzoeken
    - lopende rolupgrades voor al gekoppelde apparaten
    - lopende scope-upgrades voor al gekoppelde apparaten
    - reparaties van public-key-mismatches waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet langer overeenkomt met de goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan scopes afwijken van de goedgekeurde pairing-baseline
    - lokaal gecachete apparaat-tokenvermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan Gateway-zijde of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte volgende stappen af:

    - inspecteer lopende verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een nieuw token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderde record en keur deze opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van wachtende rol-/scope-upgrades en van verlopen token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een aanbieder openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd-linger (Linux)">
    Als dit als systemd-gebruikersservice draait, zorgt doctor ervoor dat linger is ingeschakeld zodat de Gateway na afmelden actief blijft.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en TaskFlows)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende Skills, Skills met ontbrekende vereisten en door allowlist geblokkeerde Skills.
    - **Pluginstatus**: telt ingeschakelde/uitgeschakelde/foutieve plugins; vermeldt Plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundelplugins.
    - **Plugincompatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugindiagnostiek**: toont eventuele waarschuwingen of fouten tijdens het laden die door het Plugin-register zijn uitgegeven.
    - **TaskFlow-herstel**: toont verdachte beheerde TaskFlows die handmatige inspectie of annulering nodig hebben.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestanden">
    Doctor controleert of bootstrapbestanden van de werkruimte (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en totaal aantal geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden worden afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaalplugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de loshangende kanaalgebonden configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, Heartbeat-doelen die het kanaal noemden, en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is, maar de configuratie de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shellaanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), werkt doctor dit bij naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, genereert doctor de cache automatisch opnieuw.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-authenticatiecontroles (lokaal token)">
    Doctor controleert of lokale Gateway-tokenauthenticatie gereed is.

    - Als de tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` dwingt generatie alleen af wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde inloggegevens inspecteren zonder het fail-fastgedrag van de runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botinloggegevens te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de inloggegevens geconfigureerd-maar-niet-beschikbaar zijn en slaat automatische resolutie over in plaats van te crashen of het token onterecht als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de Gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embedding-aanbieder voor geheugenzoekfunctie gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en aanbieder:

    - **QMD-backend**: peilt of de `qmd`-binary beschikbaar en startbaar is. Zo niet, drukt het reparatieadvies af, inclusief het npm-pakket en een optie voor een handmatig binarypad.
    - **Expliciete lokale aanbieder**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, stelt het voor over te schakelen naar een externe aanbieder.
    - **Expliciete externe aanbieder** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-opslag. Drukt uitvoerbare reparatietips af als die ontbreekt.
    - **Verouderde automatische aanbieder**: behandelt `memorySearch.provider: "auto"` als OpenAI, controleert OpenAI-gereedheid, en `doctor --fix` herschrijft dit naar `provider: "openai"`.

    Wanneer een gecachet Gateway-peilresultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de voor de CLI zichtbare configuratie en vermeldt eventuele verschillen. Doctor start geen verse embedding-ping op het standaardpad; gebruik het diepe geheugenstatuscommando wanneer je een live aanbiedercontrole wilt.

    Gebruik `openclaw memory status --deep` om embeddinggereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatuspeiling uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer het een afwijking vindt, beveelt het een update aan en kan het het servicebestand/de taak herschrijven naar de huidige standaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --fix` past aanbevolen oplossingen zonder prompts toe (`--repair` is een alias).
    - `openclaw doctor --fix --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de Gateway-servicelevenscyclus. Het rapporteert nog steeds servicestatus en voert niet-servicereparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijvingen van supervisorconfiguratie en opschoning van verouderde services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen commando-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Het negeert ook inactieve niet-verouderde extra Gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoonruis veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor-service-installatie/-reparatie de SecretRef maar bewaart het opgeloste tokenwaarden in platte tekst niet in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`-/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingesloten en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met uitvoerbare begeleiding.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units omvatten doctor-tokenafwijkingscontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van authmetadata van services.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, te stoppen of opnieuw te starten wanneer de configuratie het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste afsluitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Beste praktijken voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service op Bun draait of op een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerderspaden kunnen na upgrades breken omdat de service je shell-initialisatie niet laadt. Doctor biedt aan te migreren naar een systeem-Node-installatie wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat door Homebrew beheerde systeembinaries beschikbaar blijven terwijl Volta-, asdf-, fnm-, pnpm- en andere versiebeheerdersmappen niet wijzigen welke Node-subprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie wegschrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en drukt een back-uptip af als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen privé-GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
