---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-achterwaarts compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-opdracht: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T17:55:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is de reparatie- en migratietool voor OpenClaw. Het herstelt verouderde configuratie/status, controleert de gezondheid en biedt uitvoerbare reparatiestappen.

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

    Accepteer standaardwaarden zonder prompts (inclusief stappen voor herstart/service/sandbox-reparatie waar van toepassing).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Pas aanbevolen reparaties toe zonder prompts (reparaties + herstarts waar veilig).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Pas ook ingrijpende reparaties toe (overschrijft aangepaste supervisorconfiguraties).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + statusverplaatsingen op schijf). Slaat herstart-/service-/sandbox-acties over waarvoor menselijke bevestiging vereist is. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra Gateway-installaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Als je wijzigingen wilt bekijken voordat je schrijft, open dan eerst het configuratiebestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele pre-flight-update voor git-installaties (alleen interactief).
    - UI-protocolversheidscontrole (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Skills-statusoverzicht (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Talk-configuratiemigratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin-/tool-allowlists wanneer `plugins.allow` restrictief is maar het toolbeleid nog steeds om wildcard- of Plugin-eigen tools vraagt.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-auth).
    - Migratie van verouderde Plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde Cron-opslag (`jobId`, `schedule.cron`, toplevel bezorg-/payloadvelden, payload `provider`, eenvoudige `notify: true` Webhook-fallbacktaken).
    - Migratie van verouderd agent-runtimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde Plugin-configuratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containment-configuratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor gedupliceerde prompt-rewrite-branches die zijn aangemaakt door getroffen 2026.4.24-builds.
    - Detectie van vastgelopen subagent-herstartrecovery-tombstones, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken recovery-vlaggen zodat het opstarten het childproces niet blijft behandelen als door herstart afgebroken.
    - Integriteits- en machtigingscontroles voor status (sessies, transcripten, statusmap).
    - Controles van configuratiebestandsmachtigingen (chmod 600) bij lokale uitvoering.
    - Model-auth-gezondheid: controleert OAuth-verval, kan bijna verlopen tokens vernieuwen en rapporteert cooldown-/uitgeschakelde toestanden van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra Gateway.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix`- / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (gepeild vanaf de draaiende Gateway).
    - WhatsApp-responsiviteitscontroles voor verslechterde Gateway event-loop-gezondheid terwijl lokale TUI-clients nog draaien; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Codex-routereparatie voor verouderde `openai-codex/*`-modelverwijzingen in primaire modellen, fallbacks, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroutepinnen; `--fix` herschrijft ze naar `openai/*` en selecteert `agentRuntime.id: "codex"` alleen wanneer de Codex-Plugin is geïnstalleerd, ingeschakeld, de `codex`-harness bijdraagt en bruikbare OAuth heeft. Anders selecteert het `agentRuntime.id: "pi"`.
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor Gateway-services die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Gateway-runtimecontroles voor best practices (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Auth, beveiliging en koppelen">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-auth-controles voor lokale-tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft token-SecretRef-configuraties niet).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelverzoeken, openstaande rol-/scope-upgrades, verouderde drift in lokale apparaat-tokencache en auth-drift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van bestandsgrootte voor werkruimte-bootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet bij contextbestanden).
    - Skills-gereedheidscontrole voor de standaardagent; rapporteert toegestane skills met ontbrekende bins, env, config of OS-vereisten, en `--fix` kan niet-beschikbare skills uitschakelen in `skills.entries`.
    - Statuscontrole voor shellaanvulling en automatische installatie/upgrade.
    - Gereedheidscontrole voor provider van memory-search-embeddings (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallaties (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Backfill en reset van Dreams UI

De Dreams-scene van Control UI bevat de acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde Dreaming-workflow. Deze acties gebruiken Gateway-RPC-methoden in doctor-stijl, maar ze maken **geen** deel uit van de `openclaw doctor` CLI-reparatie/migratie.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de gegronde REM-dagboekpass uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede, uitsluitend gegronde kortetermijnvermeldingen die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen gegronde kandidaten niet automatisch in de live kortetermijnpromotieopslag, tenzij je eerst expliciet het gestagede CLI-pad uitvoert

Als je wilt dat gegronde historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget gegronde duurzame kandidaten in de kortetermijn-Dreaming-opslag terwijl `DREAMS.md` als beoordelingsoppervlak behouden blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief draait, biedt het aan om te updaten (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor die naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-spraakconfiguratie is `talk.provider` + `talk.providers.<provider>`, en realtime spraakconfiguratie is `talk.realtime.*`. Doctor herschrijft oude vormen van `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap, en herschrijft verouderde realtime-selectors op toplevel (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en toolbeleid
    wildcard- of Plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve Plugin-
    allowlist niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde
    verouderde allowlist-configuraties om bestaand gedrag van gebundelde providers te behouden, en
    wijst vervolgens naar de striktere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De migratie tonen die is toegepast.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    Gateway-opstarten weigert verouderde configuratieformaten en vraagt je `openclaw doctor --fix` uit te voeren; het herschrijft `openclaw.json` niet bij het opstarten. Migraties van Cron-taakopslag worden ook afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - geconfigureerde kanaalconfiguraties zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → bovenliggend `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - verouderde `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - verouderde realtime Talk-selectors op bovenliggend niveau (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Voor kanalen met benoemde `accounts` maar achtergebleven kanaalwaarden op bovenliggend niveau voor één account, verplaats je die accountgebonden waarden naar het gepromote account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/standaarddoel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde instelling voor extension-relay)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-opstart slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook richtlijnen voor accountstandaarden voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-items zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Dat kan modellen naar de verkeerde API dwingen of kosten op nul zetten. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Als je browserconfiguratie nog steeds naar het verwijderde Chrome-extensiepad verwijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-attachmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geinstalleerd voor standaardprofielen met automatisch verbinden
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan om remote debugging in de inspectiepagina van de browser in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor attachen in de browser

    Gereedheid gaat hier alleen over lokale attach-vereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te controleren of de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of self-signed certificaat), drukt doctor platformspecifieke herstelrichtlijnen af. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test uitgevoerd, zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Als je eerder verouderde OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen ziet naast Codex OAuth, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxies en overrides met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor controleert op verouderde `openai-codex/*`-modelreferenties. Native Codex-harnessroutering gebruikt canonieke `openai/*`-modelreferenties plus `agentRuntime.id: "codex"`, zodat de beurt via de Codex app-server-harness loopt in plaats van via het OpenClaw PI OpenAI-pad.

    In `--fix` / `--repair`-modus herschrijft doctor betrokken standaardagent- en per-agentreferenties, inclusief primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overrides, hooks, kanaalmodeloverrides en verouderde bewaarde sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - De overeenkomende agentruntime wordt alleen `agentRuntime.id: "codex"` wanneer Codex is geinstalleerd, ingeschakeld, de `codex`-harness bijdraagt en bruikbare OAuth heeft.
    - Anders wordt de overeenkomende agentruntime `agentRuntime.id: "pi"`.
    - Bestaande modelfallbacklijsten blijven behouden met hun verouderde items herschreven; gekopieerde instellingen per model verhuizen van de verouderde sleutel naar de canonieke `openai/*`-sleutel.
    - Bewaarde sessievelden `modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen, auth-profiel-pins en Codex-harness-pins worden gerepareerd in alle gevonden sessiestores van agents.
    - `/codex ...` betekent "beheer of bind een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor scant ook gevonden sessiestores van agents op verouderde automatisch aangemaakte routestatus nadat je geconfigureerde modellen of runtime hebt verplaatst weg van een route die eigendom is van een Plugin, zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status opschonen, zoals `modelOverrideSource: "auto"`-modelpins, runtimemodelmetadata, vastgezette harness-ID's, CLI-sessiebindingen en automatische auth-profieloverrides wanneer de eigenaarroute niet meer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gemeld voor handmatige review en blijven ongewijzigd; schakel ze om met `/model ...`, `/new` of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor kan oudere schijfindelingen migreren naar de huidige structuur:

    - Sessiestore + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het verouderde mappen als back-up laat staan. De Gateway/CLI migreert de verouderde sessies + agentmap ook automatisch bij het opstarten, zodat geschiedenis/auth/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. Normalisatie van Talk-provider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen uit sleutelvolgorde bestaan geen herhaalde no-op `doctor --fix`-wijzigingen meer veroorzaken.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor scant alle geinstalleerde Plugin-manifesten op verouderde capabilitiesleutels op bovenliggend niveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer die worden gevonden, biedt het aan ze naar het object `contracts` te verplaatsen en het manifestbestand in-place te herschrijven. Deze migratie is idempotent; als de sleutel `contracts` al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor controleert ook de cron-jobstore (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude jobvormen die de scheduler nog steeds accepteert voor compatibiliteit.

    Huidige cron-opruimingen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op bovenliggend niveau (`message`, `model`, `thinking`, ...) → `payload`
    - afleveringsvelden op bovenliggend niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-afleveringsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde fallbackjobs voor `notify: true`-webhooks → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder het gedrag te wijzigen. Als een taak de verouderde notify-fallback combineert met een bestaande niet-webhookbezorgmodus, waarschuwt Doctor en laat die taak staan voor handmatige beoordeling.

    Op Linux waarschuwt Doctor ook wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan valse `Gateway inactive`-berichten naar `~/.openclaw/logs/whatsapp-health.log` schrijven wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor huidige gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Sessievergrendelingen opschonen">
    Doctor scant elke agentsessiemap op verouderde write-lockbestanden — bestanden die achterblijven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden lockbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de lock en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert het verouderde lockbestanden automatisch; anders drukt het een notitie af en instrueert het u om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Sessietranscripttak repareren">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde takvorm die is gemaakt door de prompttranscriptherschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve zustertak met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt Doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het het transcript naar de actieve tak, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van de status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als deze verdwijnt, verliest u sessies, inloggegevens, logs en configuratie (tenzij u elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw aan te maken en herinnert u eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan machtigingen te repareren (en geeft een `chown`-hint wanneer een mismatch in eigenaar/groep wordt gedetecteerd).
    - **Door macOS-cloud gesynchroniseerde statusmap**: waarschuwt wanneer de status wordt omgezet onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat door synchronisatie ondersteunde paden tragere I/O en lock-/synchronisatieraces kunnen veroorzaken.
    - **Linux-SD- of eMMC-statusmap**: waarschuwt wanneer de status wordt omgezet naar een `mmcblk*`-mountbron, omdat door SD of eMMC ondersteunde willekeurige I/O trager kan zijn en sneller kan slijten bij sessie- en inloggegevensschrijfacties.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te vermijden.
    - **Transcript komt niet overeen**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "JSONL met 1 regel"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in verschillende thuismappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naartoe wijst (geschiedenis kan tussen installaties worden gesplitst).
    - **Herinnering voor remote-modus**: als `gateway.mode=remote`, herinnert Doctor u eraan het op de externe host uit te voeren (de status leeft daar).
    - **Machtigingen voor configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-token-pad voor. Prompts voor vernieuwen verschijnen alleen bij interactieve uitvoering (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant` of een provider die zegt dat u opnieuw moet inloggen), meldt Doctor dat opnieuw authenticeren vereist is en drukt het de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte cooldowns (snelheidslimieten/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/kredietfouten)

  </Accordion>
  <Accordion title="6. Modelvalidatie voor hooks">
    Als `hooks.gmail.model` is ingesteld, valideert Doctor de modelverwijzing tegen de catalogus en de toegestane lijst en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Sandbox-image repareren">
    Wanneer sandboxing is ingeschakeld, controleert Doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar verouderde namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Plugin-installatie opschonen">
    Doctor verwijdert verouderde door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Dit omvat verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen, pakketlokale restanten van eerdere reparatiecode voor gebundelde Plugin-afhankelijkheden en verweesde of herstelde beheerde npm-kopieen van gebundelde `@openclaw/*`-plugins die het huidige gebundelde manifest kunnen overschaduwen.

    Doctor kan ook ontbrekende downloadbare plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale Plugin-register ze niet kan vinden. Voorbeelden zijn daadwerkelijke `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen en geconfigureerde agentruntimes. Tijdens pakketupdates vermijdt Doctor Plugin-reparatie via de pakketbeheerder terwijl het kernpakket wordt vervangen; voer `openclaw doctor --fix` na de update opnieuw uit als een geconfigureerde Plugin nog steeds herstel nodig heeft. Bij het opstarten van Gateway en het opnieuw laden van configuratie worden geen pakketbeheerders uitgevoerd; Plugin-installaties blijven expliciet doctor-/install-/update-werk.

  </Accordion>
  <Accordion title="8. Migraties van Gateway-services en opschoonhints">
    Doctor detecteert verouderde Gateway-services (launchd/systemd/schtasks) en biedt aan deze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opschoonhints afdrukken. OpenClaw Gateway-services met profielnamen worden als eersteklas beschouwd en niet als "extra" gemarkeerd.

    Op Linux installeert Doctor niet automatisch een tweede service op gebruikersniveau als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeem-supervisor de levenscyclus van de Gateway beheert.

  </Accordion>
  <Accordion title="8b. Matrix-migratie bij opstarten">
    Wanneer een Matrix-kanaalaccount een openstaande of uitvoerbare verouderde statusmigratie heeft, maakt Doctor (in `--fix`- / `--repair`-modus) een snapshot van voor de migratie en voert het daarna de best-effort migratiestappen uit: verouderde Matrix-statusmigratie en voorbereiding van verouderde versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-afwijking">
    Doctor inspecteert nu de apparaatkoppelingsstatus als onderdeel van de normale gezondheidspass.

    Wat het rapporteert:

    - openstaande eerste koppelingsverzoeken
    - openstaande rolupgrades voor al gekoppelde apparaten
    - openstaande scope-upgrades voor al gekoppelde apparaten
    - reparaties van mismatches met openbare sleutels waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet langer overeenkomt met de goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes afwijken van de goedgekeurde koppelingsbaseline
    - lokaal gecachete apparaat-tokenvermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan de Gateway-zijde of verouderde scopemetadata dragen

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte vervolgstappen af:

    - inspecteer openstaande verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een vers token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderde record en keur deze opnieuw goed met `openclaw devices remove <deviceId>`

    Dit verhelpt het veelvoorkomende probleem "al gekoppeld maar nog steeds koppeling vereist krijgen": Doctor onderscheidt nu eerste koppeling van openstaande rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsafwijking.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder toegestane lijst, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd-linger (Linux)">
    Als het als systemd-gebruikersservice draait, zorgt Doctor ervoor dat linger is ingeschakeld zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en verouderde mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt geschikte Skills, Skills met ontbrekende vereisten en door de toegestane lijst geblokkeerde Skills.
    - **Verouderde werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere verouderde werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde, uitgeschakelde en foutgevende plugins; vermeldt Plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundelplugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont waarschuwingen of fouten tijdens het laden die door het Plugin-register worden uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestanden">
    Doctor controleert of bootstrapbestanden voor de werkruimte (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geinjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geinjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en het totale aantal geinjecteerde tekens als fractie van het totale budget. Wanneer bestanden worden afgekapt of dicht bij de limiet zitten, drukt Doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Verouderde kanaalplugin opschonen">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de loshangende kanaalspecifieke configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, Heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overschrijvingen. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar de configuratie de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shellcompletion">
    Doctor controleert of tabaanvulling is geinstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een langzaam dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), upgradet Doctor dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, genereert Doctor de cache automatisch opnieuw.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt Doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-authenticatiecontroles (lokaal token)">
    Doctor controleert de gereedheid van lokale Gateway-tokenauthenticatie.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt Doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt Doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` dwingt generatie alleen af wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder het fail-fast-gedrag tijdens runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamilie-opdrachten voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, meldt doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat automatische oplossing over in plaats van te crashen of het token ten onrechte als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-statuscontrole + herstart">
    Doctor voert een statuscontrole uit en biedt aan de Gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoc">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekopdrachten gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of de `qmd`-binary beschikbaar is en kan starten. Zo niet, dan wordt hersteladvies weergegeven, inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, wordt voorgesteld over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-opslag. Geeft uitvoerbare hersteltips weer als die ontbreekt.
    - **Automatische provider**: controleert eerst lokale modelbeschikbaarheid en probeert daarna elke externe provider in de volgorde voor automatische selectie.

    Wanneer een gecacht Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de configuratie die zichtbaar is voor de CLI en noteert eventuele discrepanties. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik de opdracht voor diepe geheugenstatus wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om embeddinggereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Supervisor-configuratieaudit + reparatie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer een afwijking wordt gevonden, beveelt doctor een update aan en kan het servicebestand/de taak naar de huidige standaarden herschrijven.

    Notities:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de Gateway-service. Doctor rapporteert nog steeds servicestatus en voert niet-servicegerelateerde reparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschoning van legacy-services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen opdracht-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Doctor negeert ook inactieve niet-legacy extra Gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoonruis veroorzaken.
    - Als tokenauth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor bij service-installatie/reparatie de SecretRef maar bewaart geen opgeloste platteteksttokenwaarden in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline insloten, en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer de serviceopdracht nog een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met uitvoerbare begeleiding.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units bevatten doctor-tokenafwijkingscontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van service-authmetadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving forceren via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Doctor controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en paden van versiebeheerders kunnen na upgrades breken omdat de service je shell-init niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat Volta-, asdf-, fnm-, pnpm- en andere versiebeheerdersmappen niet wijzigen welke Node-childprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en voorziet wizardmetadata van een stempel om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en geeft een back-uptip weer als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen: privé GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
