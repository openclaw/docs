---
read_when:
    - doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Dokter
x-i18n:
    generated_at: "2026-05-12T08:45:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is de reparatie- en migratietool voor OpenClaw. Deze tool herstelt verouderde configuratie/status, controleert de gezondheid en biedt uitvoerbare reparatiestappen.

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

    Accepteer standaardwaarden zonder prompts (inclusief herstart-/service-/sandboxreparatiestappen wanneer van toepassing).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Pas aanbevolen reparaties toe zonder prompts (reparaties en herstarts waar veilig).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Pas ook agressieve reparaties toe (overschrijft aangepaste supervisorconfiguraties).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie en verplaatsingen van status op schijf). Slaat herstart-/service-/sandboxacties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra gateway-installaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Als je wijzigingen wilt controleren voordat je schrijft, open dan eerst het configuratiebestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele pre-flight-update voor git-installaties (alleen interactief).
    - Controle op versheid van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole en herstartprompt.
    - Skills-statussamenvatting (geschikt/ontbrekend/geblokkeerd) en pluginstatus.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Migratie van Talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle op OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor plugin-/tool-allowlist wanneer `plugins.allow` beperkend is maar het toolbeleid nog steeds vraagt om wildcard- of plugin-eigen tools.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-auth).
    - Migratie van verouderde contractkeys in pluginmanifesten (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cron-opslag (`jobId`, `schedule.cron`, afleverings-/payloadvelden op topniveau, payload `provider`, eenvoudige `notify: true` webhook-fallbacktaken).
    - Opschoning van verouderd runtimebeleid voor de hele agent; runtimebeleid voor provider/model is de actieve routekiezer.
    - Opschoning van verouderde pluginconfiguratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde pluginverwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor gedupliceerde prompt-rewrite-takken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van restart-recovery-tombstones voor vastgelopen subagents, met `--fix`-ondersteuning om verouderde afgebroken recoveryvlaggen te wissen zodat startup het kind niet blijft behandelen als afgebroken door herstart.
    - Controles op statusintegriteit en rechten (sessies, transcripten, statusmap).
    - Controles op rechten van configuratiebestanden (chmod 600) bij lokaal uitvoeren.
    - Gezondheid van modelauthenticatie: controleert OAuth-verloop, kan tokens vernieuwen die bijna verlopen, en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde service en detectie van extra gateways.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix`- / `--repair`-modus).
    - Runtimecontroles voor Gateway (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (gepeild vanuit de actieve Gateway).
    - Kanaalspecifieke rechtencontroles staan onder `openclaw channels capabilities`; bijvoorbeeld Discord-spraakkanaalrechten worden geaudit met `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - WhatsApp-responsiviteitscontroles voor verslechterde Gateway-eventloopgezondheid terwijl lokale TUI-clients nog actief zijn; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Codex-routereparatie voor verouderde `openai-codex/*`-modelrefs in primaire modellen, fallbacks, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroutepins; `--fix` herschrijft ze naar `openai/*`, verwijdert verouderde runtimepins voor sessie/hele agent, en laat canonieke OpenAI-agentrefs op de standaard Codex-harness staan.
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor gatewayservices die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Auth, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authcontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (wachtende eerste koppelverzoeken, wachtende rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en auth-drift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van de bestandsgrootte van werkruimte-bootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Gereedheidscontrole voor Skills voor de standaardagent; rapporteert toegestane Skills met ontbrekende binaries, env, configuratie of OS-vereisten, en `--fix` kan niet-beschikbare Skills uitschakelen in `skills.entries`.
    - Statuscontrole van shell-aanvulling en automatische installatie/upgrade.
    - Gereedheidscontrole voor embeddingprovider voor geheugenz zoeken (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallatie (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie en wizardmetadata.

  </Accordion>
</AccordionGroup>

## Backfill en reset van Dreams UI

De Dreams-scene in Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde Dreaming-workflow. Deze acties gebruiken RPC-methoden in doctor-stijl van de Gateway, maar maken **geen** deel uit van de reparatie/migratie van de `openclaw doctor`-CLI.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de gegronde REM-dagboekpassage uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede gegronde short-term-vermeldingen die uitsluitend uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze zelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen gegronde kandidaten niet automatisch in de live short-term-promotieopslag, tenzij je eerst expliciet het gestagede CLI-pad uitvoert

Als je wilt dat gegronde historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget gegronde duurzame kandidaten in de short-term Dreaming-opslag en behoudt `DREAMS.md` als beoordelingsoppervlak.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om bij te werken (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor deze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-spraakconfiguratie is `talk.provider` + `talk.providers.<provider>`, en realtime stemconfiguratie is `talk.realtime.*`. Doctor herschrijft oude `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey`-vormen naar de providermap, en herschrijft verouderde realtime selectors op topniveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en het toolbeleid
    wildcard- of plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve plugin-
    allowlist niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde
    verouderde allowlistconfiguraties om bestaand gedrag van gebundelde providers te behouden, en
    verwijst daarna naar de striktere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiekeys">
    Wanneer de configuratie verouderde keys bevat, weigeren andere commando's te draaien en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde keys zijn gevonden.
    - De migratie tonen die is toegepast.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    Gateway-startup weigert verouderde configuratie-indelingen en vraagt je om `openclaw doctor --fix` uit te voeren; het herschrijft `openclaw.json` niet bij startup. Migraties van Cron-taakopslag worden ook afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configured-channel-configuraties zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → top-level `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - verouderde `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - verouderde top-level realtime Talk-selectors (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` en `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` en `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` en `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` en `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Voor kanalen met benoemde `accounts` maar achtergebleven single-account top-level kanaalwaarden: verplaats die account-scoped waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/default doel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde extensie-relay-instelling)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-startup slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde in plaats van gesloten te falen)
    - verwijder `plugins.entries.codex.config.codexDynamicToolsProfile`; Codex app-server houdt Codex-native werkruimtetools altijd native

    Doctor-waarschuwingen bevatten ook account-default-richtlijnen voor multi-account kanalen:

    - Als twee of meer `channels.<channel>.accounts`-items zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en toont het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@earendil-works/pi-ai`. Daardoor kunnen modellen naar de verkeerde API worden gedwongen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en de API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfiguratie nog naar het verwijderde Chrome-extensiepad verwijst, normaliseert doctor dit naar het huidige host-local Chrome MCP-attachmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-local Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaard auto-connect-profielen
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan remote debugging in te schakelen op de inspect-pagina van de browser (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de instelling aan de Chrome-kant niet voor je inschakelen. Host-local Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway/node-host
    - de browser draait lokaal
    - remote debugging is ingeschakeld in die browser
    - goedkeuring van de eerste attach-toestemmingsprompt in de browser

    Gereedheid hier gaat alleen over lokale attach-vereisten. Existing-session behoudt de huidige Chrome MCP-routelimieten; geavanceerde routes zoals `responsebody`, PDF-export, downloadinterceptie en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless-flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), toont doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test uitgevoerd, zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverrides">
    Als je eerder verouderde OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverride kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxies en header-only overrides worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex-routereparatie">
    Doctor controleert op verouderde `openai-codex/*` modelrefs. Native Codex-harnasroutering gebruikt canonieke `openai/*` modelrefs; OpenAI-agentbeurten lopen via het Codex app-server-harnas in plaats van via het OpenClaw PI OpenAI-pad.

    In `--fix` / `--repair`-modus herschrijft doctor betrokken default-agent- en per-agent-refs, inclusief primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overrides, hooks, kanaalmodeloverrides en verouderde vastgelegde sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - Codex-intentie verhuist naar provider/model-scoped `agentRuntime.id: "codex"`-items voor gerepareerde agentmodelrefs, zodat `openai-codex:...`-authprofielen nog steeds kunnen worden geselecteerd nadat de modelref `openai/*` wordt.
    - Verouderde whole-agent-runtimeconfiguratie en vastgelegde sessieruntimepins worden verwijderd omdat runtimeselectie provider/model-scoped is.
    - Bestaand provider/model-runtimebeleid blijft behouden, tenzij de gerepareerde verouderde modelref Codex-routering nodig heeft om het oude auth-pad te behouden.
    - Bestaande modelfallbacklijsten blijven behouden met herschreven verouderde items; gekopieerde per-model-instellingen verhuizen van de verouderde sleutel naar de canonieke `openai/*`-sleutel.
    - Vastgelegde sessie-`modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen en auth-profielpins worden gerepareerd in alle ontdekte agentsessiestores.
    - `/codex ...` betekent "een native Codex-gesprek vanuit chat beheren of binden."
    - `/acp ...` of `runtime: "acp"` betekent "de externe ACP/acpx-adapter gebruiken."

  </Accordion>
  <Accordion title="2g. Sessieroute-opschoning">
    Doctor scant ook ontdekte agentsessiestores op verouderde automatisch aangemaakte routestatus nadat je geconfigureerde modellen of runtime hebt verplaatst weg van een plugin-owned route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"` modelpins, runtimemodelmetadata, gepinde harnas-ID's, CLI-sessiebindingen en automatische auth-profieloverrides wanneer hun eigenaarroute niet meer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gerapporteerd voor handmatige beoordeling en ongemoeid gelaten; wijzig ze met `/model ...`, `/new`, of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Migraties van verouderde status (schijfindeling)">
    Doctor kan oudere indelingen op schijf naar de huidige structuur migreren:

    - Sessiestore + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaard account-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het verouderde mappen als back-ups laat staan. De Gateway/CLI migreert ook automatisch de verouderde sessies + agentmap bij startup, zodat geschiedenis/auth/modellen in het per-agent-pad terechtkomen zonder handmatige doctor-run. WhatsApp-auth wordt bewust alleen gemigreerd via `openclaw doctor`. Normalisatie van Talk-provider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen uit sleutelvolgorde bestaan niet langer herhaalde no-op `doctor --fix`-wijzigingen veroorzaken.

  </Accordion>
  <Accordion title="3a. Migraties van verouderde Plugin-manifesten">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde top-level capabilities-sleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt het aan ze naar het `contracts`-object te verplaatsen en het manifestbestand in-place te herschrijven. Deze migratie is idempotent; als de `contracts`-sleutel al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Migraties van verouderde cronstore">
    Doctor controleert ook de cronjobstore (`~/.openclaw/cron/jobs.json` standaard, of `cron.store` wanneer overschreven) op oude jobvormen die de scheduler nog steeds accepteert voor compatibiliteit.

    Huidige cron-opschoningen bevatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op topniveau (`message`, `model`, `thinking`, ...) → `payload`
    - afleveringsvelden op topniveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-afleveringsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true` Webhook-fallbacktaken → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder het gedrag te wijzigen. Als een taak verouderde notify-fallback combineert met een bestaande niet-Webhook-afleveringsmodus, geeft doctor een waarschuwing en laat die taak staan voor handmatige controle.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan onjuiste `Gateway inactive`-berichten naar `~/.openclaw/logs/whatsapp-health.log` schrijven wanneer Cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-regel met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor actuele statuscontroles.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke agent-sessiemap op verouderde write-lock-bestanden — bestanden die zijn achtergelaten toen een sessie abnormaal werd afgesloten. Voor elk gevonden lockbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID, ouder dan 30 minuten, of een live PID waarvan kan worden bewezen dat die bij een niet-OpenClaw-proces hoort). In `--fix`- / `--repair`-modus verwijdert het verouderde lockbestanden automatisch; anders drukt het een notitie af en geeft het de instructie om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Herstel van transcriptvertakkingen van sessies">
    Doctor scant JSONL-bestanden van agent-sessies op de gedupliceerde vertakkingsvorm die is gemaakt door de bug in de prompttranscript-herschrijving van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve vertakking, zodat Gateway-geschiedenis en geheugenuitlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verliest u sessies, referenties, logs en configuratie (tenzij u elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert u eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen voor statusmap**: controleert schrijfbaarheid; biedt aan om machtigingen te herstellen (en geeft een `chown`-hint wanneer een mismatch in eigenaar/groep wordt gedetecteerd).
    - **Door macOS-cloud gesynchroniseerde statusmap**: waarschuwt wanneer status onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...` uitkomt, omdat door synchronisatie ondersteunde paden langzamere I/O en lock-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer status uitkomt op een `mmcblk*`-mountbron, omdat willekeurige I/O op SD of eMMC langzamer kan zijn en sneller kan slijten bij sessie- en referentiewrites.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te vermijden.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessie-items ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regel JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis stapelt zich niet op).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in thuismappen of wanneer `OPENCLAW_STATE_DIR` elders naar verwijst (geschiedenis kan zich splitsen tussen installaties).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor u eraan om het op de externe host uit te voeren (de status staat daar).
    - **Machtigingen voor configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan om dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Status van modelauthenticatie (OAuth-verloop)">
    Doctor inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens binnenkort verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen wanneer interactief wordt uitgevoerd (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant` of een provider die aangeeft dat u opnieuw moet inloggen), rapporteert doctor dat herauthenticatie vereist is en drukt het de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte afkoelperiodes (ratelimieten/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/kredietfouten)

  </Accordion>
  <Accordion title="6. Validatie van hooks-model">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar verouderde namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Opschoning van Plugin-installaties">
    Doctor verwijdert verouderde door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in de modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dit omvat verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen, pakketlokale rommel van eerdere herstelcode voor afhankelijkheden van gebundelde Plugins, en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-Plugins die het huidige gebundelde manifest kunnen overschaduwen. Doctor koppelt ook het hostpakket `openclaw` opnieuw aan beheerde npm-Plugins die `peerDependencies.openclaw` declareren, zodat pakketlokale runtime-imports zoals `openclaw/plugin-sdk/*` blijven werken na updates of npm-reparaties.

    Doctor kan ook ontbrekende downloadbare Plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale Plugin-register ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde channel-/provider-/zoekinstellingen en geconfigureerde agent-runtimes. Tijdens pakketupdates vermijdt doctor het uitvoeren van Plugin-herstel via de pakketbeheerder terwijl het core-pakket wordt vervangen; voer `openclaw doctor --fix` opnieuw uit na de update als een geconfigureerde Plugin nog herstel nodig heeft. Gateway-start en herladen van configuratie voeren geen pakketbeheerders uit; Plugin-installaties blijven expliciet doctor-/install-/updatewerk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opschoonhints">
    Doctor detecteert verouderde gatewayservices (launchd/systemd/schtasks) en biedt aan om ze te verwijderen en de OpenClaw-service te installeren met de huidige gatewaypoort. Het kan ook scannen op extra gatewayachtige services en opschoonhints afdrukken. OpenClaw-gatewayservices met profielnaam worden als volwaardig beschouwd en niet gemarkeerd als "extra."

    Op Linux installeert doctor niet automatisch een tweede gebruikersniveau-service als de gatewayservice op gebruikersniveau ontbreekt maar er een OpenClaw-gatewayservice op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder vervolgens het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeem-supervisor de levenscyclus van de gateway beheert.

  </Accordion>
  <Accordion title="8b. Migratie van Matrix-opstart">
    Wanneer een Matrix-channelaccount een in behandeling zijnde of uitvoerbare verouderde statusmigratie heeft, maakt doctor (in `--fix`- / `--repair`-modus) een snapshot voorafgaand aan de migratie en voert het daarna de best-effort-migratiestappen uit: verouderde Matrix-statusmigratie en voorbereiding van verouderde versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu de apparaatkoppelingsstatus als onderdeel van de normale statuscontrole.

    Wat het rapporteert:

    - in behandeling zijnde eerste koppelingsverzoeken
    - in behandeling zijnde rolupgrades voor al gekoppelde apparaten
    - in behandeling zijnde scope-upgrades voor al gekoppelde apparaten
    - herstel van public-key-mismatch waarbij de apparaat-id nog overeenkomt maar de apparaatidentiteit niet langer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan scopes afwijken van de goedgekeurde koppelingsbaseline
    - lokaal gecachte apparaat-tokenitems voor de huidige machine die ouder zijn dan een gatewayzijdige tokenrotatie of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. In plaats daarvan drukt het de exacte vervolgstappen af:

    - inspecteer in behandeling zijnde verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een nieuw token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderd record en keur het opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van in behandeling zijnde rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het als systemd-gebruikersservice wordt uitgevoerd, zorgt doctor ervoor dat lingering is ingeschakeld zodat de gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, Plugins en verouderde mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende, met ontbrekende vereisten en door allowlist geblokkeerde Skills.
    - **Verouderde werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere verouderde werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/met fouten geladen Plugins; vermeldt Plugin-id's voor eventuele fouten; rapporteert mogelijkheden van gebundelde Plugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert Plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont waarschuwingen of fouten tijdens laden die door het Plugin-register zijn uitgezonden.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of werkruimte-bootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, truncatiepercentage, truncatieoorzaak (`max/file` of `max/total`) en totaal aantal geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde channel-Plugin">
    Wanneer `openclaw doctor --fix` een ontbrekende channel-Plugin verwijdert, verwijdert het ook de loshangende channel-scoped configuratie die naar die Plugin verwees: `channels.<id>`-items, Heartbeat-doelen die het channel benoemden, en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de channel-runtime weg is maar de configuratie de gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shellaanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch completionpatroon gebruikt (`source <(openclaw completion ...)`), werkt doctor dit bij naar de snellere variant met gecachet bestand.
    - Als completion in het profiel is geconfigureerd maar het cachebestand ontbreekt, genereert doctor de cache automatisch opnieuw.
    - Als er helemaal geen completion is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-auth-controles (lokaal token)">
    Doctor controleert of lokale Gateway-tokenauthenticatie gereed is.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het deze niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder het fail-fast-gedrag tijdens runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamilie-opdrachten voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, meldt doctor dat de referentie geconfigureerd maar niet beschikbaar is en slaat automatische oplossing over in plaats van te crashen of het token ten onrechte als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de Gateway opnieuw te starten wanneer deze ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid voor geheugenzoeken">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoeken gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: onderzoekt of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt hersteladvies weergegeven, inclusief het npm-pakket en een optie voor een handmatig binarypad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als deze ontbreekt, wordt voorgesteld om over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-store. Toont uitvoerbare hersteltips als die ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van lokale modellen en probeert daarna elke externe provider in automatische selectievolgorde.

    Wanneer een gecachet Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de CLI-zichtbare configuratie en noteert eventuele verschillen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik de opdracht voor diepe geheugenstatus wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om embeddinggereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + reparatie van supervisorconfiguratie">
    Doctor controleert de geinstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer er een afwijking wordt gevonden, wordt een update aanbevolen en kan het servicebestand/de taak worden herschreven naar de huidige standaardwaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de Gateway-servicelevenscyclus. Servicegezondheid wordt nog steeds gerapporteerd en niet-service-reparaties worden uitgevoerd, maar service-installatie/start/herstart/bootstrap, herschrijvingen van supervisorconfiguratie en opschoning van legacy-services worden overgeslagen omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen opdracht-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Ook worden inactieve niet-legacy extra Gateway-achtige units genegeerd tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoningsruis veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor service-installatie/-reparatie de SecretRef maar bewaart het opgeloste tokenwaarden in platte tekst niet in omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingesloten en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer de serviceopdracht nog steeds een oude `--port` vastpint nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met uitvoerbare begeleiding.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units nemen doctor-tokenafwijkingscontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen mee bij het vergelijken van serviceauthenticatiemetadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of opnieuw te starten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving forceren via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geinstalleerd maar niet daadwerkelijk draait. Er wordt ook gecontroleerd op poortconflicten op de Gateway-poort (standaard `18789`) en waarschijnlijke oorzaken worden gerapporteerd (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Beste praktijken voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.) draait. WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerpaden kunnen na upgrades stukgaan omdat de service je shell-init niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geinstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopieren, zodat door Homebrew beheerde systeembinaries beschikbaar blijven terwijl Volta, asdf, fnm, pnpm en andere versiebeheermappen niet wijzigen welke Node-childprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratieschrijven + wizardmetadata">
    Doctor bewaart alle configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en toont een back-uptip als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen: private GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
