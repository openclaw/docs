---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Doctor
x-i18n:
    generated_at: "2026-05-07T01:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
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

    Accepteer standaardwaarden zonder prompts (inclusief stappen voor herstart-, service- en sandboxreparatie waar van toepassing).

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

    Pas ook agressieve reparaties toe (overschrijft aangepaste supervisorconfiguraties).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + verplaatsingen van status op schijf). Slaat herstart-/service-/sandboxacties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

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

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele pre-flight-update voor git-installaties (alleen interactief).
    - Controle op actualiteit van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + prompt voor herstart.
    - Statussamenvatting van Skills (geschikt/ontbrekend/geblokkeerd) en pluginstatus.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Migratie van Talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin-/tool-allowlists wanneer `plugins.allow` beperkend is maar het toolbeleid nog steeds om wildcard- of plugin-eigen tools vraagt.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-authenticatie).
    - Migratie van verouderde contractsleutels in pluginmanifesten (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cron-store (`jobId`, `schedule.cron`, delivery-/payloadvelden op topniveau, payload `provider`, eenvoudige `notify: true` webhook-fallbacktaken).
    - Migratie van verouderd agent-runtimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde pluginconfiguratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde pluginverwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor gedupliceerde prompt-rewrite-branches die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van tombstones voor restart-recovery van vastgelopen subagents, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken herstelvlaggen zodat startup het kind niet blijft behandelen als restart-aborted.
    - Statusintegriteit en permissiecontroles (sessies, transcripten, statusmap).
    - Controle van permissies voor configuratiebestanden (chmod 600) wanneer lokaal uitgevoerd.
    - Model-authenticatiegezondheid: controleert OAuth-verloop, kan bijna verlopen tokens vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van authenticatieprofielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandboximage wanneer sandboxing is ingeschakeld.
    - Verouderde servicemigratie en detectie van extra gateways.
    - Migratie van verouderde status voor Matrix-kanaal (in `--fix`- / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (gepeild vanuit de actieve gateway).
    - Responsiviteitscontroles voor WhatsApp bij verslechterde Gateway-event-loopgezondheid terwijl lokale TUI-clients nog draaien; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Reparatie van Codex-routes voor verouderde `openai-codex/*`-modelrefs in primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroutepinnen; `--fix` herschrijft ze naar `openai/*` en selecteert `agentRuntime.id: "codex"` alleen wanneer de Codex-plugin is geïnstalleerd, ingeschakeld, de `codex`-harness bijdraagt en bruikbare OAuth heeft. Anders selecteert het `agentRuntime.id: "pi"`.
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor gatewayservices die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden voor versiemanagers).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelingsverzoeken, openstaande rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en authenticatiedrift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van bestandsgrootte voor werkruimte-bootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Gereedheidscontrole van Skills voor de standaardagent; rapporteert toegestane skills met ontbrekende binaries, env, config of OS-vereisten, en `--fix` kan niet-beschikbare skills uitschakelen in `skills.entries`.
    - Statuscontrole van shellaanvulling en automatische installatie/upgrade.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallaties (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Backfill en reset voor Dreams UI

De Dreams-scene van de Control UI bevat acties voor **Backfill**, **Reset** en **Clear Grounded** voor de grounded dreaming-workflow. Deze acties gebruiken RPC-methoden in gateway-doctorstijl, maar ze maken **geen** deel uit van CLI-reparatie/migratie van `openclaw doctor`.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de grounded REM-dagboekpass uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen staged grounded-only kortetermijnvermeldingen die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen grounded candidates niet automatisch in de live short-term promotion store, tenzij je eerst expliciet het staged CLI-pad uitvoert

Als je wilt dat grounded historische replay invloed heeft op de normale deep promotion-lane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget grounded duurzame candidates in de short-term dreaming store terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief draait, biedt het aan om te updaten (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor die naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-spraakconfiguratie is `talk.provider` + `talk.providers.<provider>`, en realtime-spraakconfiguratie is `talk.realtime.*`. Doctor herschrijft oude vormen `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap, en herschrijft verouderde realtime-selectors op topniveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en toolbeleid wildcard- of plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools van plugins die daadwerkelijk laden; het omzeilt de exclusieve plugin-allowlist niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde verouderde allowlistconfiguraties om bestaand gedrag van gebundelde providers te behouden, en wijst daarna naar de strengere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    Gateway-startup weigert verouderde configuratieformaten en vraagt je om `openclaw doctor --fix` uit te voeren; het herschrijft `openclaw.json` niet bij startup. Migraties van de Cron-taakstore worden ook afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - geconfigureerde kanaalconfiguraties zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Voor kanalen met benoemde `accounts` maar achtergebleven top-level kanaalwaarden voor een enkel account: verplaats die accountgebonden waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/default-doel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde relayinstelling voor extensies)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-start slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook account-default-begeleiding voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routing een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt hij geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen op de verkeerde API terechtkomen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routing + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfiguratie nog naar het verwijderde Chrome-extensiepad wijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-koppelmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geinstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan remote debugging in te schakelen op de inspectiepagina van de browser (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor koppelen in de browser

    Gereedheid gaat hier alleen over lokale koppelvereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of een raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless-flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-endpoint om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de probe faalt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, een verlopen certificaat of een zelfondertekend certificaat), toont doctor platformspecifieke herstelbegeleiding. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de probe uitgevoerd, zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen onder `models.providers.openai-codex` hebt toegevoegd, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer hij die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routing-/fallbackgedrag kunt herstellen. Aangepaste proxy's en overschrijvingen met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex-routereparatie">
    Doctor controleert op verouderde `openai-codex/*`-modelverwijzingen. Native Codex-harness-routing gebruikt canonieke `openai/*`-modelverwijzingen plus `agentRuntime.id: "codex"`, zodat de beurt via de Codex app-server-harness gaat in plaats van via het OpenClaw PI OpenAI-pad.

    In `--fix` / `--repair`-modus herschrijft doctor betrokken verwijzingen voor de standaardagent en per agent, inclusief primaire modellen, fallbacks, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en verouderde persistente sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - De overeenkomende agentruntime wordt alleen `agentRuntime.id: "codex"` wanneer Codex is geinstalleerd, ingeschakeld, de `codex`-harness levert en bruikbare OAuth heeft.
    - Anders wordt de overeenkomende agentruntime `agentRuntime.id: "pi"`.
    - Bestaande modelfallbacklijsten worden behouden met herschreven verouderde vermeldingen; gekopieerde instellingen per model worden verplaatst van de verouderde sleutel naar de canonieke `openai/*`-sleutel.
    - Persistente sessievelden `modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen, auth-profiel-pins en Codex-harness-pins worden gerepareerd in alle ontdekte sessiestores van agents.
    - `/codex ...` betekent "beheer of bind een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

  </Accordion>
  <Accordion title="2g. Opschoning van sessieroutes">
    Doctor scant ook ontdekte sessiestores van agents op verouderde automatisch aangemaakte routestatus nadat je geconfigureerde modellen of runtime hebt verplaatst weg van een Plugin-beheerde route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"`-modelpins, runtime-modelmetadata, vastgezette harness-ID's, CLI-sessiebindingen en automatische auth-profieloverschrijvingen wanneer hun eigenaarsroute niet meer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gerapporteerd voor handmatige beoordeling en blijven onaangeroerd; wijzig ze met `/model ...`, `/new` of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf migreren naar de huidige structuur:

    - Sessieopslag + transcripten:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-auth-status (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaard account-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer hij verouderde mappen als back-ups achterlaat. De Gateway/CLI migreert de verouderde sessies + agentmap ook automatisch bij het opstarten, zodat geschiedenis/auth/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. Normalisatie van Talk-provider/provider-map vergelijkt nu op structurele gelijkheid, waardoor verschillen die alleen uit sleutelvolgorde bestaan niet langer herhaalde no-op-wijzigingen door `doctor --fix` activeren.

  </Accordion>
  <Accordion title="3a. Verouderde Plugin-manifestmigraties">
    Doctor scant alle geinstalleerde Plugin-manifesten op verouderde top-level capability-sleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer die worden gevonden, biedt hij aan ze naar het `contracts`-object te verplaatsen en het manifestbestand in-place te herschrijven. Deze migratie is idempotent; als de `contracts`-sleutel al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de data te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde cron-storemigraties">
    Doctor controleert ook de Cron-jobstore (`~/.openclaw/cron/jobs.json` standaard, of `cron.store` wanneer overschreven) op oude jobvormen die de scheduler nog steeds accepteert voor compatibiliteit.

    Huidige Cron-opschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - top-level payloadvelden (`message`, `model`, `thinking`, ...) → `payload`
    - top-level afleveringsvelden (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-afleveringsaliassen → expliciete `delivery.channel`
    - ongeldige persistente Cron-`payload.model`-sentinels (`"default"`, `"null"`, lege strings, JSON `null`) → verwijderde modeloverschrijving
    - eenvoudige verouderde `notify: true` webhook-fallbackjobs → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder gedrag te wijzigen. Als een taak legacy notify-fallback combineert met een bestaande niet-webhook-bezorgmodus, geeft doctor een waarschuwing en laat die taak staan voor handmatige beoordeling.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan onjuiste `Gateway inactive`-berichten schrijven naar `~/.openclaw/logs/whatsapp-health.log` wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor actuele gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Sessievergrendeling opschonen">
    Doctor scant elke agentsessiemap op verouderde write-lock-bestanden — bestanden die achterblijven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden lockbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert het verouderde lockbestanden automatisch; anders drukt het een opmerking af en geeft het de instructie om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Branchherstel voor sessietranscript">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde branchvorm die is ontstaan door de bug in de prompttranscriptherschrijving van 2026.4.24: een verlaten gebruikersbeurt met interne OpenClaw-runtimecontext plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve branch, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, inloggegevens, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan om machtigingen te herstellen (en geeft een `chown`-hint wanneer een eigenaar-/groepmismatch wordt gedetecteerd).
    - **Door macOS-cloud gesynchroniseerde statusmap**: waarschuwt wanneer status wordt opgelost onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat door synchronisatie ondersteunde paden tragere I/O en lock-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer status wordt opgelost naar een `mmcblk*`-mountbron, omdat door SD of eMMC ondersteunde willekeurige I/O trager kan zijn en sneller kan slijten onder sessie- en credentialschrijfbewerkingen.
    - **Sessiemappen ontbreken**: `sessions/` en de sessiestoremap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regel JSONL"**: markeert wanneer het hoofdtranscript maar één regel heeft (geschiedenis stapelt zich niet op).
    - **Meerdere statusmappen**: waarschuwt wanneer er meerdere `~/.openclaw`-mappen bestaan in verschillende thuismappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan over installaties worden gesplitst).
    - **Herinnering voor remote modus**: als `gateway.mode=remote`, herinnert doctor je eraan om het op de remote host uit te voeren (de status leeft daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan om dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Modelauthenticatiegezondheid (OAuth-verloop)">
    Doctor inspecteert OAuth-profielen in de auth-store, waarschuwt wanneer tokens binnenkort verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen bij interactief uitvoeren (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die zegt dat je opnieuw moet inloggen), meldt doctor dat herauthenticatie vereist is en drukt het de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte cooldowns (ratelimieten/time-outs/auth-fouten)
    - langere uitschakelingen (facturatie-/kredietfouten)

  </Accordion>
  <Accordion title="6. Hooks-modelvalidatie">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Sandbox-imageherstel">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar legacy namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Plugin-installatie opschonen">
    Doctor verwijdert legacy door OpenClaw gegenereerde stagingstatus voor plugin-afhankelijkheden in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Dit dekt verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen, pakketlokale resten van eerdere herstelcode voor gebundelde-plugin-afhankelijkheden, en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-plugins die het huidige gebundelde manifest kunnen overschaduwen.

    Doctor kan ook ontbrekende downloadbare plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale pluginregister ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen en geconfigureerde agentruntimes. Tijdens pakketupdates vermijdt doctor het uitvoeren van pakketbeheer-pluginherstel terwijl het kernpakket wordt vervangen; voer `openclaw doctor --fix` opnieuw uit na de update als een geconfigureerde plugin nog herstel nodig heeft. Gateway-opstart en configuratieherladen voeren geen pakketbeheerders uit; plugin-installaties blijven expliciet doctor-/installatie-/updatewerk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opruimhints">
    Doctor detecteert legacy Gateway-services (launchd/systemd/schtasks) en biedt aan om ze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opruimhints afdrukken. OpenClaw Gateway-services met profielnamen worden als eersteklas beschouwd en niet gemarkeerd als "extra."

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder vervolgens het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeemsupervisor de Gateway-levenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een wachtende of uitvoerbare legacy statusmigratie heeft, maakt doctor (in `--fix`- / `--repair`-modus) een pre-migratiesnapshot en voert daarna de best-effort migratiestappen uit: legacy Matrix-statusmigratie en legacy voorbereiding van versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu apparaatkoppelingsstatus als onderdeel van de normale gezondheidspass.

    Wat het rapporteert:

    - wachtende eerste koppelingsverzoeken
    - wachtende rolupgrades voor al gekoppelde apparaten
    - wachtende scope-upgrades voor al gekoppelde apparaten
    - public-key-mismatchreparaties waarbij de device id nog overeenkomt maar de apparaatidentiteit niet meer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actieve token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline driften
    - lokaal gecachte device-tokenvermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan Gateway-zijde of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte volgende stappen af:

    - inspecteer wachtende verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een verse token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder en keur een verouderd record opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds pairing required krijgen": doctor onderscheidt nu eerste koppeling van wachtende rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het wordt uitgevoerd als een systemd-gebruikersservice, zorgt doctor ervoor dat lingering is ingeschakeld zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en legacy mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende, met ontbrekende vereisten, en door allowlist geblokkeerde skills.
    - **Legacy werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere legacy werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/met fouten geëindigde plugins; vermeldt plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundleplugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele laadwaarschuwingen of fouten die door het pluginregister zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of werkruimte-bootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) in de buurt van of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappercentage, afkapoorzaak (`max/file` of `max/total`) en totaal geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Verouderde kanaalplugin opruimen">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de loshangende kanaalgescopete configuratie die naar die plugin verwees: `channels.<id>`-vermeldingen, heartbeat-doelen die het kanaal noemden, en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar de configuratie de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shell-aanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), upgradet doctor dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-authenticatiecontroles (lokale token)">
    Doctor controleert gereedheid van lokale Gateway-tokenauthenticatie.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. SecretRef-bewuste reparaties in alleen-lezenmodus">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder het fail-fast-gedrag tijdens runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat automatische oplossing over in plaats van te crashen of het token ten onrechte als ontbrekend te melden.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid voor geheugenzoekopdrachten">
    Doctor controleert of de geconfigureerde embedding-provider voor geheugenzoekopdrachten klaar is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt reparatieadvies afgedrukt, inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, wordt voorgesteld over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-store. Drukt uitvoerbare reparatietips af als die ontbreekt.
    - **Automatische provider**: controleert eerst lokale modelbeschikbaarheid en probeert daarna elke externe provider in de automatische selectievolgorde.

    Wanneer een gecachet Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de CLI-zichtbare configuratie en vermeldt eventuele afwijkingen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik het diepe geheugenstatuscommando wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om embedding-gereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en meldt waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer er een afwijking wordt gevonden, beveelt doctor een update aan en kan het servicebestand/de taak naar de huidige standaardwaarden worden herschreven.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat de supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de Gateway-service. Het meldt nog steeds servicestatus en voert reparaties uit die geen service betreffen, maar slaat service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opruiming van legacy services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen command-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Het negeert ook inactieve niet-legacy extra gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opruimruis veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor service-installatie/reparatie de SecretRef maar bewaart het opgeloste token niet als platte tekst in omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline insloten en herschrijft de servicemetadata zodat die waarden vanuit de runtimebron worden geladen in plaats van vanuit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastpint nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met uitvoerbare aanwijzingen.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units omvatten doctor-controles op tokenafwijking nu zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van service-authmetadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste afsluitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en meldt waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service op Bun of een versiebeheerd Node-pad draait (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerpaden kunnen na upgrades breken omdat de service je shell-init niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat Volta-, asdf-, fnm-, pnpm- en andere versiebeheermappen niet veranderen welke Node-kindprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen voor versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart alle configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en drukt een back-uptip af als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen: privé-GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
