---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-opdracht: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Dokter
x-i18n:
    generated_at: "2026-05-11T20:30:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is de reparatie- en migratietool voor OpenClaw. Het herstelt verouderde configuratie/status, controleert de gezondheid en biedt uitvoerbare reparatiestappen.

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

    Accepteer standaardwaarden zonder prompts (inclusief restart-/service-/sandbox-reparatiestappen wanneer van toepassing).

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

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + statusverplaatsingen op schijf). Slaat restart-/service-/sandbox-acties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra gatewayinstallaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Als je wijzigingen wilt bekijken voordat je schrijft, open dan eerst het configuratiebestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele preflight-update voor git-installaties (alleen interactief).
    - Controle op actualiteit van het UI-protocol (bouwt de Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + restart-prompt.
    - Skills-statussamenvatting (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Migratie van Talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en gereedheid van Chrome MCP.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-schaduwing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin-/tool-toelatingslijsten wanneer `plugins.allow` restrictief is maar toolbeleid nog steeds vraagt om wildcard- of Plugin-eigen tools.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-auth).
    - Migratie van verouderde Plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde Cron-opslag (`jobId`, `schedule.cron`, delivery-/payloadvelden op topniveau, payload `provider`, eenvoudige `notify: true` webhook-fallbacktaken).
    - Opschoning van verouderd runtimebeleid voor de hele agent; provider-/modelruntimebeleid is de actieve routekiezer.
    - Opschoning van verouderde Plugin-configuratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripts voor gedupliceerde prompt-herschrijftakken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van tombstones voor herstart-herstel van vastgelopen subagents, met `--fix`-ondersteuning om verouderde afgebroken herstelvlaggen te wissen zodat opstarten het kind niet blijft behandelen als door restart afgebroken.
    - Controles op statusintegriteit en machtigingen (sessies, transcripts, statusmap).
    - Controles op machtigingen van configuratiebestanden (chmod 600) bij lokaal uitvoeren.
    - Gezondheid van modelauth: controleert OAuth-verval, kan tokens die bijna verlopen vernieuwen, en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandboximage wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra gateways.
    - Migratie van verouderde status van Matrix-kanalen (in `--fix`- / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen over kanaalstatus (gepeild vanuit de draaiende gateway).
    - Kanaalspecifieke machtigingscontroles staan onder `openclaw channels capabilities`; bijvoorbeeld Discord-spraakkanaalmachtigingen worden gecontroleerd met `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - WhatsApp-responsiviteitscontroles voor verslechterde Gateway-event-loopgezondheid terwijl lokale TUI-clients nog draaien; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Codex-routereparatie voor verouderde `openai-codex/*`-modelverwijzingen in primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroute-pins; `--fix` herschrijft ze naar `openai/*`, verwijdert verouderde runtime-pins voor sessies/de hele agent, en laat canonieke OpenAI-agentverwijzingen op de standaard Codex-harness staan.
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxyomgeving voor gatewayservices die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Auth, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authcontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token SecretRef-configuraties).
    - Probleemdetectie voor apparaatkoppeling (openstaande eerste koppelverzoeken, openstaande rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en auth-drift van gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van bestandsgrootte van werkruimte-bootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Gereedheidscontrole van Skills voor de standaardagent; rapporteert toegestane skills met ontbrekende binaries, omgevingsvariabelen, configuratie- of OS-vereisten, en `--fix` kan niet-beschikbare skills uitschakelen in `skills.entries`.
    - Statuscontrole en automatische installatie/upgrade van shellcompletion.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallatie (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Dreams-scène van de Control UI bevat de acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde dreaming-workflow. Deze acties gebruiken RPC-methoden in doctor-stijl van de gateway, maar ze maken **geen** deel uit van `openclaw doctor` CLI-reparatie/migratie.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de gegronde REM-dagboekpass uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede, uitsluitend gegronde kortetermijnvermeldingen die uit historische replay kwamen en nog geen live-recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stage'en gegronde kandidaten niet automatisch naar de live kortetermijnpromotieopslag, tenzij je eerst expliciet het gestagede CLI-pad uitvoert

Als je wilt dat gegronde historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat stage't gegronde duurzame kandidaten naar de kortetermijn-dreamingopslag, terwijl `DREAMS.md` het reviewoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief draait, biedt het aan om te updaten (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor deze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-spraakconfiguratie is `talk.provider` + `talk.providers.<provider>`, en realtime spraakconfiguratie is `talk.realtime.*`. Doctor herschrijft oude vormen van `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap, en herschrijft verouderde realtime-selectors op topniveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en toolbeleid
    wildcard- of Plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve Plugin-
    toelatingslijst niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde
    verouderde toelatingslijstconfiguraties om bestaand gedrag van gebundelde providers te behouden, en
    verwijst vervolgens naar de striktere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere commando's uit te voeren en vragen ze je `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    Gateway-start weigert verouderde configuratieformaten en vraagt je `openclaw doctor --fix` uit te voeren; het herschrijft `openclaw.json` niet tijdens het opstarten. Migraties van Cron-taakopslag worden ook afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - geconfigureerde kanaalconfigs zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Voor kanalen met benoemde `accounts` maar achtergebleven kanaalwaarden op top-level voor één account: verplaats die account-scoped waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/default doel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde instelling voor extensierelay)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-startup slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)
    - verwijder `plugins.entries.codex.config.codexDynamicToolsProfile`; de Codex-appserver houdt Codex-native workspace-tools altijd native

    Doctor-waarschuwingen bevatten ook account-default-richtlijnen voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en toont het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@earendil-works/pi-ai`. Daardoor kunnen modellen op de verkeerde API worden gezet of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfig nog naar het verwijderde Chrome-extensiepad wijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-koppelmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan om remote debugging in de inspectiepagina van de browser in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor koppeling in de browser

    Gereedheid gaat hier alleen over lokale koppelvereisten. Existing-session behoudt de huidige Chrome MCP-routelimieten; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle geldt **niet** voor Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, peilt doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de peiling faalt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), print doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de peiling uitgevoerd, zelfs als de Gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen onder `models.providers.openai-codex` hebt toegevoegd, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxies en overschrijvingen met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex-routereparatie">
    Doctor controleert op verouderde `openai-codex/*`-modelrefs. Native Codex-harnessroutering gebruikt canonieke `openai/*`-modelrefs; OpenAI-agentbeurten lopen via de Codex-appserverharness in plaats van via het OpenClaw PI OpenAI-pad.

    In `--fix`- / `--repair`-modus herschrijft doctor betrokken refs voor default-agent en per-agent, waaronder primaire modellen, fallbacks, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en verouderde bewaarde sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - Codex-intentie verhuist naar provider-/model-scoped `agentRuntime.id: "codex"`-vermeldingen voor gerepareerde agentmodelrefs, zodat `openai-codex:...`-authprofielen nog steeds kunnen worden geselecteerd nadat de modelref `openai/*` wordt.
    - Verouderde runtimeconfig voor hele agents en bewaarde runtime-pins voor sessies worden verwijderd omdat runtimeselectie provider-/model-scoped is.
    - Bestaand provider-/modelruntimebeleid blijft behouden, tenzij de gerepareerde verouderde modelref Codex-routering nodig heeft om het oude authpad te behouden.
    - Bestaande modelfallbacklijsten blijven behouden met herschreven verouderde vermeldingen; gekopieerde instellingen per model verhuizen van de verouderde sleutel naar de canonieke `openai/*`-sleutel.
    - Bewaarde sessie-`modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen en authprofiel-pins worden gerepareerd in alle gevonden agentsessieopslagen.
    - `/codex ...` betekent "beheer of bind een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

  </Accordion>
  <Accordion title="2g. Opschoning van sessieroutes">
    Doctor scant gevonden agentsessieopslagen ook op verouderde automatisch aangemaakte routestatus nadat je geconfigureerde modellen of runtime weg verplaatst van een plugin-owned route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"`-modelpins, runtimemodelmetadata, vastgezette harness-ID's, CLI-sessiebindingen en automatische authprofieloverschrijvingen wanneer hun eigenaarroute niet langer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gemeld voor handmatige beoordeling en ongemoeid gelaten; wissel ze met `/model ...`, `/new` of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfstructuur)">
    Doctor kan oudere on-disk structuren naar de huidige structuur migreren:

    - Sessieopslag + transcripts:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het legacy-mappen als back-ups laat staan. De Gateway/CLI migreert de verouderde sessies + agentmap ook automatisch bij startup, zodat geschiedenis/auth/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. WhatsApp-auth wordt bewust alleen gemigreerd via `openclaw doctor`. Normalisatie van Talk-provider/provider-map vergelijkt nu op structurele gelijkheid, dus verschillen die alleen uit sleutelvolgorde bestaan activeren geen herhaalde no-op-`doctor --fix`-wijzigingen meer.

  </Accordion>
  <Accordion title="3a. Verouderde pluginmanifestmigraties">
    Doctor scant alle geïnstalleerde pluginmanifests op verouderde capability-sleutels op top-level (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt het aan om ze naar het `contracts`-object te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de sleutel `contracts` al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde cronopslagmigraties">
    Doctor controleert ook de Cron-taakopslag (`~/.openclaw/cron/jobs.json` standaard, of `cron.store` wanneer overschreven) op oude taakvormen die de scheduler nog steeds voor compatibiliteit accepteert.

    Huidige Cron-opschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op topniveau (`message`, `model`, `thinking`, ...) → `payload`
    - afleveringsvelden op topniveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-afleveringsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true` Webhook-terugvaltaken → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder het gedrag te veranderen. Als een taak verouderde notify-terugval combineert met een bestaande niet-Webhook-afleveringsmodus, geeft doctor een waarschuwing en laat die taak staan voor handmatige controle.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan onjuiste `Gateway inactive`-berichten schrijven naar `~/.openclaw/logs/whatsapp-health.log` wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor actuele gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Opschonen van sessievergrendelingen">
    Doctor scant elke agent-sessiemap op verouderde schrijfvergrendelingsbestanden: bestanden die zijn achtergebleven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden vergrendelingsbestand meldt het: het pad, PID, of de PID nog actief is, leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID, ouder dan 30 minuten, of een actieve PID waarvan kan worden bewezen dat deze bij een niet-OpenClaw-proces hoort). In `--fix`- / `--repair`-modus verwijdert het verouderde vergrendelingsbestanden automatisch; anders drukt het een opmerking af en instrueert het je om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Herstel van sessietranscriptvertakkingen">
    Doctor scant agent-sessie-JSONL-bestanden op de gedupliceerde vertakkingsvorm die is gemaakt door de prompttranscript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne OpenClaw-runtimecontext plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt doctor een back-up van elk getroffen bestand naast het origineel en herschrijft het transcript naar de actieve vertakking, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, referenties, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan om machtigingen te herstellen (en geeft een `chown`-hint wanneer een eigenaar-/groepsmismatch wordt gedetecteerd).
    - **macOS-cloudgesynchroniseerde statusmap**: waarschuwt wanneer status wordt opgelost onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat synchronisatie-ondersteunde paden tragere I/O en vergrendelings-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer status wordt opgelost naar een `mmcblk*`-mountbron, omdat willekeurige I/O op SD- of eMMC-opslag langzamer kan zijn en sneller kan slijten bij sessie- en referentiewrites.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regel JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis stapelt zich niet op).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in thuismappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar wijst (geschiedenis kan tussen installaties worden opgesplitst).
    - **Herinnering voor remote-modus**: als `gateway.mode=remote` is, herinnert doctor je eraan om het op de remotehost uit te voeren (de status staat daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan om dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens bijna verlopen of verlopen zijn en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen wanneer interactief wordt uitgevoerd (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant` of een provider die je vertelt opnieuw in te loggen), meldt doctor dat herauthenticatie vereist is en drukt het de exacte `openclaw models auth login --provider ...`-opdracht af die je moet uitvoeren.

    Doctor meldt ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte afkoelperiodes (snelheidslimieten/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/tegoedfouten)

  </Accordion>
  <Accordion title="6. Modelvalidatie voor hooks">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandbox-images">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar verouderde namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Opschonen van Plugin-installaties">
    Doctor verwijdert verouderde, door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in de modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dit omvat verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen, package-lokale resten van eerdere reparatiecode voor afhankelijkheden van gebundelde Plugins, en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-Plugins die het huidige gebundelde manifest kunnen overschaduwen.

    Doctor kan ook ontbrekende downloadbare Plugins opnieuw installeren wanneer configuratie ernaar verwijst maar het lokale Plugin-register ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen en geconfigureerde agent-runtimes. Tijdens package-updates vermijdt doctor het uitvoeren van package-manager-Plugin-reparatie terwijl het kernpackage wordt vervangen; voer `openclaw doctor --fix` opnieuw uit na de update als een geconfigureerde Plugin nog herstel nodig heeft. Gateway-opstart en configuratieherlaadacties voeren geen package managers uit; Plugin-installaties blijven expliciet doctor-/install-/updatewerk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opruimhints">
    Doctor detecteert verouderde Gateway-services (launchd/systemd/schtasks) en biedt aan om ze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opruimhints afdrukken. Profielbenoemde OpenClaw Gateway-services worden als eersteklas beschouwd en niet gemarkeerd als "extra."

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder vervolgens de duplicaatservice of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeemsupervisor eigenaar is van de Gateway-levenscyclus.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een pending of uitvoerbare verouderde statusmigratie heeft, maakt doctor (in `--fix`- / `--repair`-modus) een snapshot vóór de migratie en voert daarna de best-effort-migratiestappen uit: verouderde Matrix-statusmigratie en voorbereiding van verouderde versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-afwijking">
    Doctor inspecteert nu de apparaatkoppelingsstatus als onderdeel van de normale gezondheidspass.

    Wat het meldt:

    - pending eerste koppelingsverzoeken
    - pending rolupgrades voor al gekoppelde apparaten
    - pending scope-upgrades voor al gekoppelde apparaten
    - herstel van publieke-sleutelmismatchen waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet meer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actieve token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes afwijken van de goedgekeurde koppelingsbaseline
    - lokaal gecachete apparaat-tokenvermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan Gateway-zijde of verouderde scope-metadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte volgende stappen af:

    - inspecteer pending verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een verse token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderd record en keur het opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van pending rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsafwijking.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het als systemd-gebruikersservice draait, zorgt doctor ervoor dat lingering is ingeschakeld zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, Plugins en verouderde mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende, ontbrekende-vereisten- en allowlist-geblokkeerde Skills.
    - **Verouderde werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere verouderde werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/foutieve Plugins; vermeldt Plugin-ID's voor eventuele fouten; rapporteert capaciteiten van bundel-Plugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert Plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele waarschuwingen of fouten tijdens laden die door het Plugin-register zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of werkruimte-bootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en totale geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden worden afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschonen van verouderde kanaal-Plugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaal-Plugin verwijdert, verwijdert het ook de loshangende kanaalgescopete configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar configuratie de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shellaanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvulpatroon gebruikt (`source <(openclaw completion ...)`), upgradet doctor dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, genereert doctor de cache automatisch opnieuw.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om die te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-authcontroles (lokaal token)">
    Doctor controleert of lokale gateway-tokenauth klaar is voor gebruik.

    - Als de tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder het fail-fast-gedrag tijdens runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamilie-opdrachten voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram-reparatie van `allowFrom` / `groupAllowFrom` `@username` probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, meldt doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat het automatische oplossen over in plaats van te crashen of het token onjuist als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-statuscontrole + herstart">
    Doctor voert een statuscontrole uit en biedt aan de Gateway te herstarten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekactie">
    Doctor controleert of de geconfigureerde embedding-provider voor geheugenzoekacties klaar is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt hersteladvies afgedrukt, inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, wordt voorgesteld over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert of er een API-sleutel aanwezig is in de omgeving of auth-opslag. Drukt bruikbare hersteltips af als die ontbreekt.
    - **Automatische provider**: controleert eerst lokale modelbeschikbaarheid en probeert daarna elke externe provider in de volgorde voor automatische selectie.

    Wanneer een gecacht Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de CLI-zichtbare configuratie en meldt eventuele afwijkingen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik de opdracht voor diepe geheugenstatus wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om embedding-gereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer er een afwijking wordt gevonden, raadt doctor een update aan en kan het servicebestand/de taak herschrijven naar de huidige standaardwaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de Gateway-service. Het rapporteert nog steeds servicestatus en voert niet-service-reparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschoning van legacy-services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen opdracht-/entrypoint-metadata terwijl de overeenkomende systemd Gateway-unit actief is. Het negeert ook inactieve niet-legacy extra gateway-achtige units tijdens de scan op dubbele services, zodat aanvullende servicebestanden geen opschoningsruis veroorzaken.
    - Als tokenauth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor-service-installatie/reparatie de SecretRef maar worden opgeloste tokenwaarden in platte tekst niet opgeslagen in omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingebed en herschrijft de servicemetadata zodat die waarden vanuit de runtimebron worden geladen in plaats van vanuit de supervisordefinitie.
    - Doctor detecteert wanneer de serviceopdracht nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauth een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, blokkeert doctor het installatie-/reparatiepad met bruikbare begeleiding.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units omvatten doctortokendriftcontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van serviceauthmetadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving forceren via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste afsluitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en paden van versiebeheerders kunnen na upgrades stukgaan omdat de service je shell-init niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat door Homebrew beheerde systeembinaries beschikbaar blijven terwijl Volta-, asdf-, fnm-, pnpm- en andere versiebeheermappen niet veranderen welke Node-childprocessen worden opgelost. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dit ontbreekt en drukt een back-uptip af als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen: private GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
