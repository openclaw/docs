---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-achterwaarts compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-opdracht: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Diagnose
x-i18n:
    generated_at: "2026-05-05T01:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is de reparatie- en migratietool voor OpenClaw. Het herstelt verouderde configuratie/status, controleert de gezondheid en geeft uitvoerbare reparatiestappen.

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

    Pas ook ingrijpende reparaties toe (overschrijft aangepaste supervisorconfiguraties).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie en statusverplaatsingen op schijf). Slaat herstart-/service-/sandboxacties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

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
    - Versheidscontrole van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Skills-statussamenvatting (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Migratie van Talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin-/tool-allowlists wanneer `plugins.allow` restrictief is maar het toolbeleid nog steeds om wildcard- of Plugin-eigen tools vraagt.
    - Verouderde statusmigratie op schijf (sessies/agentmap/WhatsApp-auth).
    - Migratie van verouderde Plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cron-opslag (`jobId`, `schedule.cron`, delivery-/payloadvelden op topniveau, payload `provider`, eenvoudige `notify: true` Webhook-fallbacktaken).
    - Migratie van verouderd agentruntimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde Plugin-configuratie wanneer Plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containmentconfiguratie en bewaard.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor gedupliceerde prompt-herschrijftakken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van tombstones voor herstart-herstel van vastgelopen subagents, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken herstelvlaggen zodat het opstarten het childproces niet blijft behandelen als herstart-afgebroken.
    - Statusintegriteits- en machtigingscontroles (sessies, transcripten, statusmap).
    - Machtigingscontroles voor configuratiebestanden (chmod 600) bij lokaal uitvoeren.
    - Gezondheid van modelauthenticatie: controleert OAuth-verval, kan tokens die bijna verlopen vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van authprofielen.
    - Detectie van extra werkruimtemappen (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandboximages wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra Gateways.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix`- / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen over kanaalstatus (gepeild vanuit de actieve Gateway).
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor Gateway-services die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Probleemdetectie voor apparaatkoppeling (openstaande eerste koppelverzoeken, openstaande rol-/scope-upgrades, verouderde drift in lokale apparaattokencache en authenticatiedrift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van de bestandsgrootte van werkruimte-bootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Controle van Skills-gereedheid voor de standaardagent; rapporteert toegestane Skills met ontbrekende binaries, env, config of OS-vereisten, en `--fix` kan niet-beschikbare Skills uitschakelen in `skills.entries`.
    - Statuscontrole en automatische installatie/upgrade van shellaanvulling.
    - Gereedheidscontrole voor embeddingprovider van geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallaties (mismatch in pnpm-werkruimte, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Dreams-scène van Control UI bevat de acties **Backfill**, **Reset** en **Clear Grounded** voor de grounded dreaming-workflow. Deze acties gebruiken RPC-methoden in Gateway-doctorstijl, maar ze maken **geen** deel uit van de `openclaw doctor` CLI-reparatie/-migratie.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de grounded REM-dagboekpass uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gefaseerde grounded-only kortetermijnvermeldingen die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze faseren niet automatisch grounded kandidaten in de live kortetermijn-promotieopslag, tenzij je eerst expliciet het gefaseerde CLI-pad uitvoert

Als je wilt dat grounded historische replay invloed heeft op de normale deep promotion-lane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat faseert grounded duurzame kandidaten in de kortetermijn-Dreaming-opslag, terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om bij te werken (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor die naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-configuratie is `talk.provider` + `talk.providers.<provider>`. Doctor herschrijft oude `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey`-vormen naar de providermap.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en het toolbeleid
    wildcard- of Plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van Plugins die daadwerkelijk laden; het omzeilt de exclusieve Plugin-
    allowlist niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde
    verouderde allowlist-configuraties om bestaand gedrag van gebundelde providers te behouden, en
    verwijst daarna naar de striktere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert doctor-migraties ook automatisch uit bij het opstarten wanneer een verouderd configuratieformaat wordt gedetecteerd, zodat verouderde configuraties zonder handmatige tussenkomst worden gerepareerd. Cron-taakopslagmigraties worden afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configs voor geconfigureerde kanalen zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` op hoogste niveau
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - verouderde `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Voor kanalen met benoemde `accounts` maar resterende kanaalwaarden op het hoogste niveau voor één account, verplaats die accountgebonden waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/standaarddoel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde instelling voor extension-relay)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-start slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook richtlijnen voor accountstandaarden voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-items zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Dat kan modellen naar de verkeerde API dwingen of kosten op nul zetten. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en gereedheid voor Chrome MCP">
    Als je browserconfiguratie nog steeds naar het verwijderde Chrome-extensiepad wijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-aanhechtmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer deze lager is dan Chrome 144
    - herinnert je eraan remote debugging in de inspectiepagina van de browser in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway-/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor aanhechten in de browser

    Gereedheid gaat hier alleen over lokale aanhechtvereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, peilt doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de peiling faalt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, een verlopen certificaat of een zelfondertekend certificaat), toont doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de peiling uitgevoerd, zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxy's en overschrijvingen met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Waarschuwingen voor Codex-pluginroutes">
    Wanneer de meegeleverde Codex-plugin is ingeschakeld, controleert doctor ook of primaire modelreferenties van `openai-codex/*` nog steeds via de standaard PI-runner worden opgelost. Die combinatie is geldig wanneer je Codex OAuth-/abonnementsauthenticatie via PI wilt, maar is gemakkelijk te verwarren met de native Codex app-server-harness. Doctor waarschuwt en wijst naar de expliciete app-server-vorm: `openai/*` plus `agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor herstelt dit niet automatisch omdat beide routes geldig zijn:

    - `openai-codex/*` + PI betekent "gebruik Codex OAuth-/abonnementsauthenticatie via de normale OpenClaw-runner."
    - `openai/*` + `agentRuntime.id: "codex"` betekent "voer de embedded beurt uit via de native Codex app-server."
    - `/codex ...` betekent "beheer of koppel een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

    Als de waarschuwing verschijnt, kies dan de route die je bedoelde en bewerk de configuratie handmatig. Laat de waarschuwing ongewijzigd wanneer PI Codex OAuth bewust is gekozen.

  </Accordion>
  <Accordion title="2g. Opschoning van sessieroutes">
    Doctor scant ook de actieve sessieopslag op verouderde, automatisch aangemaakte routestatus nadat je het geconfigureerde standaard-/fallbackmodel of de runtime hebt verplaatst weg van een plugin-eigen route zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"`-modelpins, runtimemodelmetadata, vastgezette harness-ID's, CLI-sessiekoppelingen en automatische auth-profieloverschrijvingen wanneer hun eigenaarroute niet langer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gemeld voor handmatige beoordeling en blijven onaangeroerd; schakel ze om met `/model ...`, `/new`, of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf naar de huidige structuur migreren:

    - Sessieopslag + transcripts:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het verouderde mappen als back-ups achterlaat. De Gateway/CLI migreert ook automatisch de verouderde sessies + agentmap bij het opstarten, zodat geschiedenis/auth/modellen in het pad per agent terechtkomen zonder een handmatige doctor-run. Normalisatie van talk-provider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen uit sleutelvolgorde bestaan geen herhaalde no-op-wijzigingen door `doctor --fix` meer veroorzaken.

  </Accordion>
  <Accordion title="3a. Migraties van verouderde pluginmanifesten">
    Doctor scant alle geïnstalleerde pluginmanifesten op verouderde capabilities-sleutels op het hoogste niveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt het aan ze naar het object `contracts` te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de sleutel `contracts` al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Migraties van verouderde cronopslag">
    Doctor controleert ook de cronjobopslag (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude jobvormen die de planner nog steeds accepteert voor compatibiliteit.

    Huidige cronopschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op het hoogste niveau (`message`, `model`, `thinking`, ...) → `payload`
    - afleveringsvelden op het hoogste niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-afleveringsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true`-webhookfallbackjobs → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-jobs alleen automatisch wanneer dit kan zonder gedrag te wijzigen. Als een job verouderde notify-fallback combineert met een bestaande niet-webhook-afleveringsmodus, waarschuwt doctor en laat het die job staan voor handmatige beoordeling.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds de verouderde `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan foutieve `Gateway inactive`-berichten naar `~/.openclaw/logs/whatsapp-health.log` schrijven wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor actuele gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke agentsessiemap op verouderde schrijfvergrendelingsbestanden — bestanden die achterblijven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert het verouderde vergrendelingsbestanden automatisch; anders drukt het een opmerking af en geeft het de instructie om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Herstel van sessietranscript-branch">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde branch-vorm die is gemaakt door de prompttranscript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve branch, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, referenties, logboeken en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan om machtigingen te herstellen (en geeft een `chown`-hint wanneer een eigenaar-/groepmismatch wordt gedetecteerd).
    - **macOS-cloudgesynchroniseerde statusmap**: waarschuwt wanneer status wordt opgelost onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat door synchronisatie ondersteunde paden tragere I/O en vergrendelings-/synchronisatieraces kunnen veroorzaken.
    - **Linux-SD- of eMMC-statusmap**: waarschuwt wanneer status wordt opgelost naar een `mmcblk*`-mountbron, omdat willekeurige I/O op SD- of eMMC-opslag trager kan zijn en sneller kan slijten onder sessie- en referentiewrites.
    - **Sessiemappen ontbreken**: `sessions/` en de sessiestoremap zijn vereist om geschiedenis persistent te maken en `ENOENT`-crashes te voorkomen.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regelige JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in homedirectory's of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan worden gesplitst tussen installaties).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan om het op de externe host uit te voeren (de status bevindt zich daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de auth-store, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic-API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen bij interactief uitvoeren (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant` of een provider die aangeeft dat je opnieuw moet inloggen), rapporteert doctor dat herauthenticatie vereist is en drukt het de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte cooldowns (snelheidslimieten/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/tegoedfouten)

  </Accordion>
  <Accordion title="6. Validatie van hooks-model">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandboximage">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar verouderde namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Opschoning van Plugin-installaties">
    Doctor verwijdert verouderde door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Dit omvat verouderde gegenereerde dependency-roots, oude install-stage-mappen, pakketlokale resten van eerdere herstelcode voor gebundelde-Plugin-afhankelijkheden en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-plugins die het huidige gebundelde manifest kunnen overschaduwen.

    Doctor kan ook ontbrekende downloadbare plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale Plugin-register ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen en geconfigureerde agentruntimes. Tijdens pakketupdates vermijdt doctor het uitvoeren van pakketmanager-Plugin-herstel terwijl het kernpakket wordt vervangen; voer `openclaw doctor --fix` opnieuw uit na de update als een geconfigureerde Plugin nog steeds herstel nodig heeft. Gateway-opstart en configuratieherladen voeren geen pakketmanagers uit; Plugin-installaties blijven expliciet doctor-/installatie-/updatewerk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opschoonhints">
    Doctor detecteert verouderde Gateway-services (launchd/systemd/schtasks) en biedt aan om ze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opschoonhints afdrukken. OpenClaw Gateway-services met profielnamen worden als eersteklas beschouwd en worden niet gemarkeerd als "extra."

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeemsupervisor de Gateway-levenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een pending of uitvoerbare verouderde statusmigratie heeft, maakt doctor (in `--fix`- / `--repair`-modus) een pre-migratiesnapshot en voert het daarna de best-effort migratiestappen uit: verouderde Matrix-statusmigratie en voorbereiding van verouderde versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu de apparaatkoppelingsstatus als onderdeel van de normale gezondheidspass.

    Wat het rapporteert:

    - pending eerste koppelingsverzoeken
    - pending rolupgrades voor al gekoppelde apparaten
    - pending scope-upgrades voor al gekoppelde apparaten
    - herstel van publieke-sleutelmismatches waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet meer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline driften
    - lokaal gecachte apparaattokenvermeldingen voor de huidige machine die dateren van vóór een tokenrotatie aan Gateway-zijde of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte vervolgstappen af:

    - inspecteer pending verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een vers token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderd record en keur het opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van pending rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd-linger (Linux)">
    Als OpenClaw als systemd-gebruikersservice draait, zorgt doctor ervoor dat lingering is ingeschakeld zodat de Gateway na uitloggen actief blijft.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en verouderde mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt geschikte, met ontbrekende vereisten en door allowlist geblokkeerde skills.
    - **Verouderde werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere verouderde werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/foutieve plugins; vermeldt Plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundelplugins.
    - **Waarschuwingen voor Plugin-compatibiliteit**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont alle waarschuwingen of fouten tijdens het laden die door het Plugin-register worden uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of werkruimte-bootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en totale geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstellen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaal-Plugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaal-Plugin verwijdert, verwijdert het ook de loshangende kanaalgescopeerde configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, Heartbeat-doelen die het kanaal noemden, en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime weg is maar de configuratie de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shellaanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), upgradet doctor dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-authcontroles (lokaal token)">
    Doctor controleert gereedheid van lokale Gateway-tokenauthenticatie.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste herstellingen">
    Sommige herstelstromen moeten geconfigureerde referenties inspecteren zonder het fail-fast-gedrag van de runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als de Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat automatische oplossing over in plaats van te crashen of de token ten onrechte als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-statuscontrole + herstart">
    Doctor voert een statuscontrole uit en biedt aan de gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekactie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekacties klaar is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: test of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt hersteladvies weergegeven, inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, wordt voorgesteld over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-store. Geeft bruikbare hersteltips als die ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van lokale modellen en probeert daarna elke externe provider in volgorde van automatische selectie.

    Wanneer een gecachet resultaat van een Gateway-probe beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de voor de CLI zichtbare configuratie en meldt eventuele verschillen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik het diepe geheugenstatuscommando wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om de gereedheid van embeddings tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer een afwijking wordt gevonden, raadt doctor een update aan en kan het servicebestand/de taak naar de huidige standaarden herschrijven.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat de supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de Gateway-service. Het rapporteert nog steeds de servicestatus en voert niet-servicegerelateerde reparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijvingen van supervisorconfiguratie en opschoning van legacy-services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen commando-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Het negeert ook inactieve niet-legacy extra Gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoningsruis veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert de service-installatie/reparatie van doctor de SecretRef maar slaat geen opgeloste plaintext-tokenwaarden op in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-gebaseerde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingesloten, en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met bruikbaar advies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units nemen doctor-tokenafwijkingscontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen mee bij het vergelijken van service-authmetadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service op Bun of een versiebeheerd Node-pad draait (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerpaden kunnen na upgrades breken omdat de service je shell-init niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van de interactieve shell-PATH te kopiëren, zodat Volta, asdf, fnm, pnpm en andere versiebeheermappen niet wijzigen welke Node-childprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar gegiste fallbackmappen van versiebeheerders worden alleen naar de service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een geheugensysteem voor de werkruimte voor wanneer dat ontbreekt en toont een back-uptip als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids over werkruimtestructuur en git-back-up (aanbevolen: privé-GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
