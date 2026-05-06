---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Brekende configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en reparatiestappen'
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T09:13:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is de reparatie- en migratietool voor OpenClaw. Het herstelt verouderde config/status, controleert de gezondheid en biedt uitvoerbare reparatiestappen.

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

    Accepteer standaardwaarden zonder prompt (inclusief reparatiestappen voor herstart/service/sandbox wanneer van toepassing).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Pas aanbevolen reparaties toe zonder prompt (reparaties + herstarts waar veilig).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Pas ook agressieve reparaties toe (overschrijft aangepaste supervisorconfigs).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (confignormalisatie + verplaatsingen van status op schijf). Slaat herstart-/service-/sandboxacties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra gatewayinstallaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Als je wijzigingen wilt bekijken voordat je schrijft, open dan eerst het configbestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Optionele preflight-update voor git-installaties (alleen interactief).
    - Versheidscontrole van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Statussamenvatting voor Skills (geschikt/ontbrekend/geblokkeerd) en pluginstatus.

  </Accordion>
  <Accordion title="Config and migrations">
    - Confignormalisatie voor verouderde waarden.
    - Migratie van Talk-config van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfigs en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor plugin-/tool-allowlist wanneer `plugins.allow` restrictief is maar het toolbeleid nog steeds wildcard- of plugin-eigen tools vraagt.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-auth).
    - Migratie van verouderde pluginmanifest-contractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cronopslag (`jobId`, `schedule.cron`, delivery-/payloadvelden op topniveau, payload `provider`, eenvoudige `notify: true` webhookfallbacktaken).
    - Migratie van verouderd runtimebeleid voor agents naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde pluginconfig wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde pluginverwijzingen behandeld als inerte containmentconfig en behouden.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspectie van sessielockbestanden en opschoning van verouderde locks.
    - Reparatie van sessietranscripties voor dubbele prompt-rewrite-branches die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van restart-recovery-tombstones voor vastgelopen subagents, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken recoveryvlaggen zodat startup het kind niet blijft behandelen als afgebroken door herstart.
    - Controles van statusintegriteit en machtigingen (sessies, transcripties, statusmap).
    - Controles van configbestandsmachtigingen (chmod 600) bij lokale uitvoering.
    - Gezondheid van modelauth: controleert OAuth-verval, kan bijna verlopen tokens vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparatie van sandboximage wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde service en detectie van extra gateways.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix`- / `--repair`-modus).
    - Runtimecontroles voor Gateway (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (geprobed vanuit de actieve gateway).
    - Responsiviteitscontroles voor WhatsApp bij verslechterde Gateway-eventloopgezondheid terwijl lokale TUI-clients nog actief zijn; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Codex-routereparatie voor verouderde `openai-codex/*`-modelrefs in primaire modellen, fallbacks, Heartbeat-/subagent-/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroutepins; `--fix` herschrijft ze naar `openai/*` en selecteert `agentRuntime.id: "codex"` alleen wanneer de Codex-plugin is geïnstalleerd, ingeschakeld, de `codex`-harness bijdraagt en bruikbare OAuth heeft. Anders selecteert het `agentRuntime.id: "pi"`.
    - Audit van supervisorconfig (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxyomgeving voor gatewayservices die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden van version-managers).
    - Diagnose van Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authcontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token SecretRef-configs).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelverzoeken, openstaande rol-/scope-upgrades, verouderde lokale apparaat-token-cacheafwijking en auth-afwijking in gekoppelde records).

  </Accordion>
  <Accordion title="Workspace and shell">
    - systemd-lingercontrole op Linux.
    - Controle van bestandsgrootte voor werkruimtebootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Gereedheidscontrole van Skills voor de standaardagent; rapporteert toegestane skills met ontbrekende bins, env, config of OS-vereisten, en `--fix` kan niet-beschikbare skills uitschakelen in `skills.entries`.
    - Statuscontrole van shellcompletion en automatische installatie/upgrade.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekfunctie (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallatie (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte config + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Control UI Dreams-scene bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de grounded dreaming-workflow. Deze acties gebruiken RPC-methoden in doctor-stijl van de gateway, maar ze maken **geen** deel uit van `openclaw doctor` CLI-reparatie/migratie.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de grounded REM-dagboekpass uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede grounded-only kortetermijnvermeldingen die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen grounded kandidaten niet automatisch naar de live kortetermijn-promotieopslag tenzij je eerst expliciet het staged CLI-pad uitvoert

Als je wilt dat grounded historische replay de normale diepe promotielane beïnvloedt, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget grounded duurzame kandidaten naar de kortetermijn-dreamingopslag terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om te updaten (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Config normalization">
    Als de config verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor ze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-speechconfig is `talk.provider` + `talk.providers.<provider>`, en realtime voiceconfig is `talk.realtime.*`. Doctor herschrijft oude vormen van `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap, en herschrijft verouderde realtime-selectors op topniveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en toolbeleid
    wildcard- of plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve plugin-
    allowlist niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde
    verouderde allowlistconfigs om bestaand gedrag van gebundelde providers te behouden, en
    wijst daarna naar de strengere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Wanneer de config verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De migratie tonen die is toegepast.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert doctor-migraties ook automatisch uit bij startup wanneer deze een verouderd configformaat detecteert, zodat verouderde configs zonder handmatige ingreep worden gerepareerd. Migraties van de Cron-taakopslag worden afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configs voor geconfigureerde kanalen zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` op topniveau
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - verouderde `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - verouderde realtime Talk-selectors op topniveau (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Verplaats bij kanalen met benoemde `accounts` maar overgebleven topniveaukanaalwaarden voor één account die accountgebonden waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaande overeenkomende benoemde/standaarddoel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde instelling voor extensierelay)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-opstart slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook richtlijnen voor accountstandaarden voor multi-accountkanalen:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverrides">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen naar de verkeerde API worden gedwongen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de override kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en gereedheid voor Chrome MCP">
    Als je browserconfig nog steeds naar het verwijderde Chrome-extensiepad verwijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-koppelmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan om remote debugging in te schakelen op de inspectiepagina van de browser (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een op Chromium gebaseerde browser 144+ op de gateway-/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor koppelen in de browser

    Gereedheid gaat hier alleen over lokale koppelvereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless-flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. Vereisten voor OAuth TLS">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), toont doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test uitgevoerd, zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverrides">
    Als je eerder verouderde OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverride kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxy's en overrides met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Herstel van Codex-routes">
    Doctor controleert op verouderde `openai-codex/*`-modelrefs. Native Codex-harnasroutering gebruikt canonieke `openai/*`-modelrefs plus `agentRuntime.id: "codex"`, zodat de beurt via het Codex app-serverharnas loopt in plaats van via het OpenClaw PI OpenAI-pad.

    In de modus `--fix` / `--repair` herschrijft doctor getroffen refs voor de standaardagent en per agent, inclusief primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overrides, hooks, kanaalmodeloverrides en verouderde vastgelegde sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - De overeenkomende agentruntime wordt alleen `agentRuntime.id: "codex"` wanneer Codex is geïnstalleerd, ingeschakeld, het `codex`-harnas bijdraagt en bruikbare OAuth heeft.
    - Anders wordt de overeenkomende agentruntime `agentRuntime.id: "pi"`.
    - Bestaande lijsten met modelfallbacks blijven behouden met hun verouderde vermeldingen herschreven; gekopieerde instellingen per model worden verplaatst van de verouderde sleutel naar de canonieke `openai/*`-sleutel.
    - Vastgelegde sessie-`modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen, auth-profielpins en Codex-harnaspins worden hersteld in alle ontdekte sessiestores van agents.
    - `/codex ...` betekent "een native Codex-gesprek vanuit chat beheren of binden."
    - `/acp ...` of `runtime: "acp"` betekent "de externe ACP/acpx-adapter gebruiken."

  </Accordion>
  <Accordion title="2g. Opschoning van sessieroutes">
    Doctor scant ook ontdekte sessiestores van agents op verouderde automatisch aangemaakte routestatus nadat je geconfigureerde modellen of runtime weg hebt verplaatst van een Plugin-eigen route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"`-modelpins, runtime-modelmetadata, gepinde harnas-ID's, CLI-sessiebindingen en automatische auth-profieloverrides wanneer hun eigenaarroute niet langer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gerapporteerd voor handmatige beoordeling en blijven onaangeroerd; wissel ze met `/model ...`, `/new` of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf migreren naar de huidige structuur:

    - Sessiestore + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het verouderde mappen als back-ups achterlaat. De Gateway/CLI migreert de verouderde sessies + agentmap ook automatisch bij het opstarten, zodat geschiedenis/auth/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. Normalisatie van Talk-provider/provider-map vergelijkt nu op structurele gelijkheid, dus verschillen alleen in sleutelvolgorde activeren niet langer herhaalde no-op-wijzigingen door `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Verouderde Plugin-manifestmigraties">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde capaciteitssleutels op topniveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt het aan ze naar het `contracts`-object te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de `contracts`-sleutel al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde cron-storemigraties">
    Doctor controleert ook de cron-taakstore (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude taakvormen die de planner nog steeds accepteert voor compatibiliteit.

    Huidige cron-opschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op topniveau (`message`, `model`, `thinking`, ...) → `payload`
    - bezorgingsvelden op topniveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-bezorgingsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true` webhook-fallbacktaken → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder gedrag te wijzigen. Als een taak legacy notify-fallback combineert met een bestaande niet-webhook-bezorgmodus, waarschuwt doctor en laat die taak staan voor handmatige controle.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan onjuiste `Gateway inactive`-berichten naar `~/.openclaw/logs/whatsapp-health.log` schrijven wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor huidige gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke agent-sessiemap op verouderde schrijfvergrendelingsbestanden — bestanden die achterblijven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In de modus `--fix` / `--repair` verwijdert het verouderde vergrendelingsbestanden automatisch; anders drukt het een notitie af en instrueert het je om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Herstel van sessietranscript-branch">
    Doctor scant agent-sessie-JSONL-bestanden op de gedupliceerde branch-vorm die is gemaakt door de prompttranscript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne OpenClaw-runtimecontext plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In de modus `--fix` / `--repair` maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve branch, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, referenties, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen voor statusmap**: verifieert schrijfbaarheid; biedt aan machtigingen te herstellen (en geeft een `chown`-hint wanneer een mismatch in eigenaar/groep wordt gedetecteerd).
    - **macOS-cloudgesynchroniseerde statusmap**: waarschuwt wanneer status wordt herleid naar iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat synchronisatiepaden tragere I/O en vergrendelings-/synchronisatieraces kunnen veroorzaken.
    - **Linux-SD- of eMMC-statusmap**: waarschuwt wanneer status wordt herleid naar een `mmcblk*`-mountbron, omdat willekeurige I/O op SD- of eMMC-opslag trager kan zijn en sneller kan slijten bij sessie- en referentiewrites.
    - **Sessiemappen ontbreken**: `sessions/` en de map voor de sessieopslag zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcript-mismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regel JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in home-mappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan tussen installaties worden opgesplitst).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan het op de externe host uit te voeren (de status leeft daar).
    - **Machtigingen voor configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens binnenkort verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen bij interactieve uitvoering (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die je vraagt opnieuw in te loggen), rapporteert doctor dat herauthenticatie vereist is en drukt het de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte afkoelperiodes (snelheidslimieten/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/kredietfouten)

  </Accordion>
  <Accordion title="6. Modelvalidatie voor hooks">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan ze te bouwen of over te schakelen naar legacy namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Opschoning van Plugin-installaties">
    Doctor verwijdert legacy door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in de modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dit omvat verouderde gegenereerde dependency roots, oude install-stage-mappen, pakketlokale resten van eerdere herstelcode voor gebundelde Plugin-afhankelijkheden, en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-Plugins die het huidige gebundelde manifest kunnen overschaduwen.

    Doctor kan ook ontbrekende downloadbare Plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale Plugin-register ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen en geconfigureerde agent-runtimes. Tijdens pakketupdates vermijdt doctor het uitvoeren van pakketbeheerder-Plugin-herstel terwijl het kernpakket wordt vervangen; voer `openclaw doctor --fix` opnieuw uit na de update als een geconfigureerde Plugin nog herstel nodig heeft. Gateway-opstart en configuratieherlaadacties voeren geen pakketbeheerders uit; Plugin-installaties blijven expliciet doctor-/installatie-/updatewerk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opschoonhints">
    Doctor detecteert legacy Gateway-services (launchd/systemd/schtasks) en biedt aan ze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opschoonhints afdrukken. OpenClaw Gateway-services met profielnamen worden als eersteklas beschouwd en niet gemarkeerd als "extra."

    Op Linux installeert doctor niet automatisch een tweede gebruikersservice als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeem-supervisor de Gateway-levenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een lopende of uitvoerbare legacy statusmigratie heeft, maakt doctor (in de modus `--fix` / `--repair`) een pre-migratiesnapshot en voert daarna de best-effort migratiestappen uit: legacy Matrix-statusmigratie en voorbereiding van legacy versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu de apparaatkoppelingsstatus als onderdeel van de normale gezondheidspas.

    Wat het rapporteert:

    - lopende eerste koppelingsverzoeken
    - lopende rolupgrades voor al gekoppelde apparaten
    - lopende scope-upgrades voor al gekoppelde apparaten
    - public-key-mismatch-herstellingen waarbij de apparaat-id nog overeenkomt maar de apparaatidentiteit niet meer overeenkomt met de goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline afdrijven
    - lokaal gecachte device-token-vermeldingen voor de huidige machine die dateren van vóór een tokenrotatie aan Gateway-zijde of verouderde scope-metadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaat-tokens niet automatisch. Het drukt in plaats daarvan de exacte volgende stappen af:

    - inspecteer lopende verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een vers token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderde record en keur deze opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit de veelvoorkomende opening "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van lopende rol-/scope-upgrades en van verouderde token-/apparaatidentiteit-drift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het draait als een systemd-gebruikersservice, zorgt doctor ervoor dat linger is ingeschakeld zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, Plugins en legacy mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende Skills, Skills met ontbrekende vereisten en door allowlist geblokkeerde Skills.
    - **Legacy werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere legacy werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/foutieve Plugins; vermeldt Plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundle-Plugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert Plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele waarschuwingen of fouten tijdens het laden die door het Plugin-register zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrap-bestand">
    Doctor controleert of bootstrap-bestanden van de werkruimte (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en totale geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaal-Plugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaal-Plugin verwijdert, verwijdert het ook de loshangende kanaalspecifieke configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, Heartbeat-doelen die het kanaal noemden, en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar de configuratie de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shell-aanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvulpatroon gebruikt (`source <(openclaw completion ...)`), upgradet doctor dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-authenticatiecontroles (lokaal token)">
    Doctor controleert de gereedheid van lokale Gateway-tokenauthenticatie.

    - Als de tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder het fail-fastgedrag tijdens runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de referentie geconfigureerd maar niet beschikbaar is en slaat automatische oplossing over in plaats van te crashen of onterecht te melden dat het token ontbreekt.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de Gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekopdrachten gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt hersteladvies weergegeven, inclusief het npm-pakket en een optie voor een handmatig binarypad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, wordt voorgesteld over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-store. Geeft bruikbare hersteltips weer als die ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van lokale modellen en probeert daarna elke externe provider in de volgorde voor automatische selectie.

    Wanneer een gecachet Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de configuratie die zichtbaar is voor de CLI en noteert eventuele verschillen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik het diepe geheugenstatuscommando wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om embeddinggereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Supervisorconfiguratie-audit + reparatie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer er een verschil wordt gevonden, beveelt doctor een update aan en kan het servicebestand/de taak worden herschreven naar de huidige standaardwaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de Gateway-servicelevenscyclus. Het rapporteert nog steeds servicestatus en voert niet-servicegerelateerde reparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijvingen van supervisorconfiguratie en opschoning van legacy-services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen commando-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Het negeert ook inactieve niet-legacy extra Gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoningsruis veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor bij service-installatie/reparatie de SecretRef maar slaat het opgeloste platteteksttoken niet op in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-gebaseerde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingebed en herschrijft de servicemetadata zodat die waarden vanuit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastpint nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met bruikbaar advies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units nemen doctor-tokendriftcontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen mee bij het vergelijken van serviceauthenticatiemetadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en paden van versiebeheerders kunnen na upgrades breken omdat de service je shell-init niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat Volta-, asdf-, fnm-, pnpm- en andere versiebeheerdersmappen niet veranderen welke Node-subprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-uitvoering vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en toont een back-uptip als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids over werkruimtestructuur en git-back-up (aanbevolen: privé GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
