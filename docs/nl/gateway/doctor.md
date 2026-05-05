---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-opdracht: gezondheidscontroles, configuratiemigraties en reparatiestappen'
title: Diagnose
x-i18n:
    generated_at: "2026-05-05T08:25:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is het reparatie- en migratiehulpmiddel voor OpenClaw. Het herstelt verouderde configuratie/status, controleert de gezondheid en geeft uitvoerbare reparatiestappen.

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

    Accepteer standaardwaarden zonder prompts (inclusief stappen voor herstart/service/sandbox-reparatie wanneer van toepassing).

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

    Pas ook agressieve reparaties toe (overschrijft aangepaste supervisor-configuraties).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + statusverplaatsingen op schijf). Slaat herstart-/service-/sandbox-acties over waarvoor menselijke bevestiging nodig is. Migraties van legacy-status worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra Gateway-installaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Als je wijzigingen wilt bekijken voordat je schrijft, open je eerst het configuratiebestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele pre-flight-update voor git-installaties (alleen interactief).
    - Controle op actualiteit van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Skills-statussamenvatting (geschikt/ontbrekend/geblokkeerd) en pluginstatus.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor legacy-waarden.
    - Migratie van Talk-configuratie van legacy platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor legacy Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor plugin-/tool-allowlists wanneer `plugins.allow` restrictief is maar toolbeleid nog steeds vraagt om wildcard- of plugin-eigen tools.
    - Migratie van legacy-status op schijf (sessions/agentmap/WhatsApp-auth).
    - Migratie van legacy-contractsleutels in pluginmanifesten (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van legacy-cronopslag (`jobId`, `schedule.cron`, velden op topniveau voor delivery/payload, payload `provider`, eenvoudige `notify: true` webhook-fallbackjobs).
    - Migratie van legacy-agent-runtimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde pluginconfiguratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde pluginverwijzingen behandeld als inerte containment-configuratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van session-vergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van session-transcripten voor gedupliceerde prompt-rewrite-branches die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van tombstones voor herstart-herstel van vastgelopen subagents, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken-herstelvlaggen zodat startup het kind niet blijft behandelen als door herstart afgebroken.
    - Controles van statusintegriteit en machtigingen (sessions, transcripten, statusmap).
    - Controles van configuratiebestandsmachtigingen (chmod 600) bij lokale uitvoering.
    - Gezondheid van modelauthenticatie: controleert OAuth-verval, kan bijna verlopen tokens vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra workspace-map (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van legacy-services en detectie van extra gateways.
    - Migratie van legacy-status van het Matrix-kanaal (in `--fix` / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (gepeild vanuit de actieve Gateway).
    - WhatsApp-responsiviteitscontroles voor verslechterde gezondheid van de Gateway-eventloop terwijl lokale TUI-clients nog actief zijn; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Audit van supervisor-configuratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor Gateway-services die shellwaarden voor `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Controles van best practices voor Gateway-runtime (Node versus Bun, paden van version managers).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Auth, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authcontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (wachtende eerste koppelverzoeken, wachtende rol-/scope-upgrades, drift in verouderde lokale device-token-cache en auth-drift van gekoppelde records).

  </Accordion>
  <Accordion title="Workspace en shell">
    - systemd-linger-controle op Linux.
    - Controle van bestandsgrootte voor workspace-bootstrap (waarschuwingen voor afkapping/bijna-limiet bij contextbestanden).
    - Gereedheidscontrole van Skills voor de standaardagent; rapporteert toegestane Skills met ontbrekende binaries, omgeving, configuratie of OS-vereisten, en `--fix` kan niet-beschikbare Skills in `skills.entries` uitschakelen.
    - Statuscontrole van shell-aanvulling en automatische installatie/upgrade.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallaties (pnpm-workspace-mismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Dreams-scène in Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde Dreaming-workflow. Deze acties gebruiken RPC-methoden in doctor-stijl van de Gateway, maar ze zijn **geen** onderdeel van CLI-reparatie/-migratie met `openclaw doctor`.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve workspace, voert de gegronde REM-dagboekpass uit en schrijft omkeerbare backfill-items naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekitems uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen staged gegronde korte-termijnitems die uit historische replay kwamen en nog geen live-recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze uit zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen gegronde kandidaten niet automatisch naar de live korte-termijn-promotieopslag, tenzij je eerst expliciet het staged CLI-pad uitvoert

Als je wilt dat gegronde historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget gegronde duurzame kandidaten naar de korte-termijn-Dreaming-opslag, terwijl `DREAMS.md` het review-oppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om te updaten (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie legacy-waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor die naar het huidige schema.

    Dat omvat legacy platte Talk-velden. De huidige openbare Talk-configuratie is `talk.provider` + `talk.providers.<provider>`. Doctor herschrijft oude vormen van `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en toolbeleid
    wildcard- of plugin-eigen toolitems gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve plugin-
    allowlist niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde
    legacy-allowlistconfiguraties om bestaand gedrag van gebundelde providers te behouden, en
    verwijst daarna naar de striktere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraties van legacy-configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke legacy-sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert doctor-migraties ook automatisch uit bij startup wanneer een legacy-configuratieformaat wordt gedetecteerd, zodat verouderde configuraties zonder handmatige tussenkomst worden gerepareerd. Migraties van Cron-jobopslag worden afgehandeld door `openclaw doctor --fix`.

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
    - legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Voor kanalen met benoemde `accounts` maar achtergebleven top-level kanaalwaarden voor een enkel account: verplaats die account-gebonden waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/default-doel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (legacy instelling voor extension-relay)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-start slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook account-default-richtlijnen voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-items zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode provider-overschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen op de verkeerde API terechtkomen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfig nog naar het verwijderde Chrome-extensionpad verwijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-attachmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan remote debugging in de inspectiepagina van de browser in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de instelling aan Chrome-zijde niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor attach in de browser

    Gereedheid gaat hier alleen over lokale attach-vereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), geeft doctor platformspecifieke herstelrichtlijnen weer. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test uitgevoerd, ook als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder legacy OpenAI-transportinstellingen onder `models.providers.openai-codex` hebt toegevoegd, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxy's en header-only overschrijvingen worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Waarschuwingen voor Codex Plugin-routes">
    Wanneer de gebundelde Codex Plugin is ingeschakeld, controleert doctor ook of primaire modelrefs `openai-codex/*` nog steeds via de standaard PI-runner worden opgelost. Die combinatie is geldig wanneer je Codex OAuth-/abonnementsauthenticatie via PI wilt, maar is makkelijk te verwarren met de native Codex app-server-harness. Doctor waarschuwt en verwijst naar de expliciete app-server-vorm: `openai/*` plus `agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repareert dit niet automatisch omdat beide routes geldig zijn:

    - `openai-codex/*` + PI betekent "gebruik Codex OAuth-/abonnementsauthenticatie via de normale OpenClaw-runner."
    - `openai/*` + `agentRuntime.id: "codex"` betekent "voer de ingebedde turn uit via native Codex app-server."
    - `/codex ...` betekent "beheer of koppel een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

    Als de waarschuwing verschijnt, kies dan de route die je bedoelde en bewerk de config handmatig. Laat de waarschuwing ongewijzigd wanneer PI Codex OAuth bedoeld is.

  </Accordion>
  <Accordion title="2g. Opschoning van sessieroutes">
    Doctor scant ook de opslag voor actieve sessies op verouderde automatisch aangemaakte routestatus nadat je het geconfigureerde standaard-/fallbackmodel of de runtime hebt verplaatst van een Plugin-eigen route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals modelpinnen met `modelOverrideSource: "auto"`, runtimemodelmetadata, vastgezette harness-ID's, CLI-sessiekoppelingen en automatische auth-profile-overschrijvingen wanneer de eigenaarroute niet meer is geconfigureerd. Expliciete gebruikers- of legacy sessiemodelkeuzes worden gemeld voor handmatige beoordeling en ongemoeid gelaten; wissel ze met `/model ...`, `/new` of reset de sessie wanneer die route niet meer bedoeld is.

  </Accordion>
  <Accordion title="3. Legacy statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf migreren naar de huidige structuur:

    - Sessiesopslag + transcripts:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van legacy `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het legacy mappen als back-ups achterlaat. De Gateway/CLI migreert de legacy sessies + agentmap ook automatisch bij het starten, zodat geschiedenis/auth/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. WhatsApp-auth wordt bewust alleen via `openclaw doctor` gemigreerd. Normalisatie van talk-provider/provider-map vergelijkt nu op structurele gelijkheid, waardoor verschillen die alleen uit sleutelvolgorde bestaan niet langer herhaalde no-op-wijzigingen door `doctor --fix` activeren.

  </Accordion>
  <Accordion title="3a. Legacy Plugin-manifestmigraties">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde top-level capability-sleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer die worden gevonden, biedt het aan ze naar het object `contracts` te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de sleutel `contracts` al dezelfde waarden heeft, wordt de legacy sleutel verwijderd zonder de data te dupliceren.
  </Accordion>
  <Accordion title="3b. Legacy Cron-opslagmigraties">
    Doctor controleert ook de Cron-taakopslag (`~/.openclaw/cron/jobs.json` standaard, of `cron.store` wanneer overschreven) op oude taakvormen die de planner nog steeds accepteert voor compatibiliteit.

    Huidige Cron-opruimingen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - top-level payloadvelden (`message`, `model`, `thinking`, ...) → `payload`
    - top-level bezorgingsvelden (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider` bezorgingsaliassen → expliciet `delivery.channel`
    - eenvoudige legacy `notify: true` Webhook-fallbacktaken → expliciet `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder gedrag te veranderen. Als een taak legacy notify-fallback combineert met een bestaande niet-webhook bezorgingsmodus, waarschuwt doctor en laat het die taak staan voor handmatige beoordeling.

    Op Linux waarschuwt de diagnosefunctie ook wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan onjuiste `Gateway inactive`-berichten naar `~/.openclaw/logs/whatsapp-health.log` schrijven wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor actuele gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Sessievergrendeling opschonen">
    De diagnosefunctie scant elke agentsessiemap op verouderde write-lock-bestanden — bestanden die zijn achtergebleven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden lock-bestand meldt deze: het pad, de PID, of de PID nog actief is, de leeftijd van de lock en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert de diagnosefunctie verouderde lock-bestanden automatisch; anders drukt deze een opmerking af en instrueert je om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Transcriptvertakking van sessie repareren">
    De diagnosefunctie scant JSONL-bestanden van agentsessies op de gedupliceerde vertakkingsvorm die is gemaakt door de prompt-transcript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt de diagnosefunctie naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve vertakking, zodat Gateway-geschiedenis en geheugengebruikers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, referenties, logs en configuratie (tenzij je elders back-ups hebt).

    De diagnosefunctie controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan om machtigingen te repareren (en geeft een `chown`-hint wanneer een mismatch in eigenaar/groep wordt gedetecteerd).
    - **macOS-statusmap met cloudsynchronisatie**: waarschuwt wanneer status wordt herleid onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat paden met synchronisatie langzamere I/O en lock-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer status wordt herleid naar een `mmcblk*`-mountbron, omdat willekeurige I/O op SD of eMMC trager kan zijn en sneller kan slijten bij sessie- en referentieschrijfacties.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis persistent te maken en `ENOENT`-crashes te voorkomen.
    - **Transcript-mismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regelige JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in verschillende thuismappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan tussen installaties worden opgesplitst).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert de diagnosefunctie je eraan deze op de externe host uit te voeren (de status bevindt zich daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verloop)">
    De diagnosefunctie inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens bijna verlopen of verlopen zijn en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt deze een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen bij interactieve uitvoering (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die zegt dat je opnieuw moet inloggen), meldt de diagnosefunctie dat opnieuw authenticeren vereist is en drukt deze de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    De diagnosefunctie meldt ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte cool-downs (rate limits/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/tegoedfouten)

  </Accordion>
  <Accordion title="6. Validatie van Hooks-model">
    Als `hooks.gmail.model` is ingesteld, valideert de diagnosefunctie de modelreferentie tegen de catalogus en allowlist en waarschuwt deze wanneer die niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Sandbox-image repareren">
    Wanneer sandboxing is ingeschakeld, controleert de diagnosefunctie Docker-images en biedt deze aan om te bouwen of over te schakelen naar legacy namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Plugin-installatie opschonen">
    De diagnosefunctie verwijdert legacy, door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in de modus `openclaw doctor --fix` / `openclaw doctor --repair`. Dit omvat verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen, package-lokale resten van eerdere reparatiecode voor afhankelijkheden van gebundelde Plugins, en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-Plugins die het huidige gebundelde manifest kunnen overschaduwen.

    De diagnosefunctie kan ook ontbrekende downloadbare Plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale Plugin-register ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen en geconfigureerde agentruntimes. Tijdens package-updates vermijdt de diagnosefunctie het uitvoeren van package-manager-Plugin-reparatie terwijl het kernpackage wordt vervangen; voer `openclaw doctor --fix` opnieuw uit na de update als een geconfigureerde Plugin nog herstel nodig heeft. Gateway-opstart en configuratieherladen voeren geen package managers uit; Plugin-installaties blijven expliciet doctor-/install-/update-werk.

  </Accordion>
  <Accordion title="8. Migraties van Gateway-service en opruimhints">
    De diagnosefunctie detecteert legacy Gateway-services (launchd/systemd/schtasks) en biedt aan om ze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Deze kan ook scannen op extra Gateway-achtige services en opruimhints afdrukken. OpenClaw Gateway-services met profielnaam worden als volwaardig beschouwd en worden niet als "extra" gemarkeerd.

    Op Linux installeert de diagnosefunctie niet automatisch een tweede gebruikersniveau-service als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeemsupervisor de Gateway-levenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een openstaande of uitvoerbare legacy-statusmigratie heeft, maakt de diagnosefunctie (in `--fix`- / `--repair`-modus) een pre-migratiesnapshot en voert daarna de best-effort-migratiestappen uit: legacy Matrix-statusmigratie en legacy voorbereiding van versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    De diagnosefunctie inspecteert nu de apparaatkoppelingsstatus als onderdeel van de normale gezondheidspass.

    Wat deze meldt:

    - openstaande eerste koppelingsverzoeken
    - openstaande rolupgrades voor al gekoppelde apparaten
    - openstaande scope-upgrades voor al gekoppelde apparaten
    - reparaties voor public-key-mismatch waarbij de apparaat-id nog overeenkomt, maar de apparaatidentiteit niet meer overeenkomt met de goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline zijn gedrift
    - lokale gecachete device-token-vermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan Gateway-zijde of verouderde scope-metadata bevatten

    De diagnosefunctie keurt koppelingsverzoeken niet automatisch goed en roteert apparaat-tokens niet automatisch. In plaats daarvan drukt deze de exacte volgende stappen af:

    - inspecteer openstaande verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een nieuw token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder en keur een verouderde record opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": de diagnosefunctie onderscheidt nu eerste koppeling van openstaande rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    De diagnosefunctie geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Bij uitvoering als systemd-gebruikersservice zorgt de diagnosefunctie ervoor dat linger is ingeschakeld, zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, Plugins en legacy mappen)">
    De diagnosefunctie drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende Skills, Skills met ontbrekende vereisten en door allowlist geblokkeerde Skills.
    - **Legacy werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere legacy werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/defecte Plugins; vermeldt Plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundel-Plugins.
    - **Waarschuwingen voor Plugin-compatibiliteit**: markeert Plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont alle laadtijdwaarschuwingen of -fouten die door het Plugin-register zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    De diagnosefunctie controleert of werkruimte-bootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Deze rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en totale geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt de diagnosefunctie tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Verouderde kanaal-Plugin opschonen">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaal-Plugin verwijdert, verwijdert het ook de losse kanaalgescopeerde configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, Heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar de configuratie de Gateway nog steeds vraagt zich eraan te binden.
  </Accordion>
  <Accordion title="11c. Shell-aanvulling">
    De diagnosefunctie controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shell-profiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), upgradet de diagnosefunctie dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, genereert de diagnosefunctie de cache automatisch opnieuw.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt de diagnosefunctie om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-authcontroles (lokaal token)">
    De diagnosefunctie controleert gereedheid van lokale Gateway-tokenauthenticatie.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt de diagnosefunctie aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt de diagnosefunctie en overschrijft deze het niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder het fail-fast-gedrag van de runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat auto-oplossing over in plaats van te crashen of het token ten onrechte als ontbrekend te melden.

  </Accordion>
  <Accordion title="13. Gateway-statuscontrole + herstart">
    Doctor voert een statuscontrole uit en biedt aan de Gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekopdrachten gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt reparatieadvies afgedrukt, inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, stelt dit voor over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-opslag. Drukt bruikbare reparatietips af als die ontbreekt.
    - **Automatische provider**: controleert eerst lokale modelbeschikbaarheid en probeert daarna elke externe provider in auto-selectievolgorde.

    Wanneer een gecachet Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de voor de CLI zichtbare configuratie en meldt eventuele afwijkingen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik het deep-geheugenstatuscommando wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om embeddinggereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en meldt waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Supervisorconfiguratie-audit + reparatie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer een afwijking wordt gevonden, beveelt dit een update aan en kan het servicebestand/de taak naar de huidige standaardwaarden herschrijven.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de Gateway-servicelevenscyclus. Het meldt nog steeds servicestatus en voert niet-servicereparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschonen van legacy services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen commando-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Het negeert ook inactieve niet-legacy extra Gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoningsruis veroorzaken.
    - Als token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor-service-installatie/reparatie de SecretRef, maar blijven opgeloste platteteksttokenwaarden niet bewaard in omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingesloten en herschrijft de servicemetadata zodat die waarden vanuit de runtimebron worden geladen in plaats van vanuit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met bruikbare instructies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units nemen doctor-controles op tokendrift nu zowel `Environment=`- als `EnvironmentFile=`-bronnen mee bij het vergelijken van service-authmetadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en meldt waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service op Bun of een versiebeheerd Node-pad draait (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerpaden kunnen na upgrades breken omdat de service je shell-init niet laadt. Doctor biedt aan om naar een systeeminstallatie van Node te migreren wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat Volta-, asdf-, fnm-, pnpm- en andere versiebeheermappen niet veranderen welke Node-childprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraamde fallbackmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een geheugensysteem voor de werkruimte voor wanneer dat ontbreekt en drukt een back-uptip af als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen privé-GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
