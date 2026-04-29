---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Diagnose
x-i18n:
    generated_at: "2026-04-29T22:44:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347ce9a2f87632292319aa740389dca8763bd26dd398fb0edeb5b70cc16b949a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is het reparatie- en migratiehulpmiddel voor OpenClaw. Het herstelt verouderde configuratie/status, controleert de gezondheid en geeft uitvoerbare reparatiestappen.

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

    Accepteer standaardwaarden zonder prompt (inclusief stappen voor herstart/service-/sandboxreparatie wanneer van toepassing).

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
    - Versheidscontrole van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Samenvatting van Skills-status (geschikt/ontbrekend/geblokkeerd) en pluginstatus.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Talk-configuratiemigratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Verouderde statusmigratie op schijf (sessies/agentmap/WhatsApp-auth).
    - Migratie van verouderde Plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cronopslag (`jobId`, `schedule.cron`, velden voor levering/payload op topniveau, payload `provider`, eenvoudige `notify: true` webhook-fallbacktaken).
    - Migratie van verouderd agent-runtimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschonen van verouderde pluginconfiguratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde pluginverwijzingen behandeld als inerte containmentconfiguratie en bewaard.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor dubbele prompt-herschrijftakken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Integriteits- en machtigingscontroles voor status (sessies, transcripten, statusmap).
    - Machtigingscontroles voor configuratiebestanden (chmod 600) bij lokale uitvoering.
    - Gezondheid van modelauthenticatie: controleert OAuth-verval, kan bijna vervallen tokens vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandboximage wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra gateways.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix` / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (gepeild via de actieve gateway).
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van ingesloten proxy-omgeving voor gatewayservices die tijdens installatie of update shellwaarden voor `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelverzoeken, openstaande rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en authdrift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van de grootte van het bootstrapbestand voor de werkruimte (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Statuscontrole en automatische installatie/upgrade van shellaanvulling.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallaties (mismatch in pnpm-werkruimte, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Backfill en reset voor Dreams-UI

De Dreams-scene van de Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde dreaming-workflow. Deze acties gebruiken gateway-RPC-methoden in doctor-stijl, maar ze maken **geen** deel uit van de reparatie/migratie via de `openclaw doctor` CLI.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de gegronde REM-dagboekpass uit en schrijft omkeerbare backfill-items naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekitems uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gefaseerde, uitsluitend gegronde kortetermijnitems die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze zelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze zetten gegronde kandidaten niet automatisch klaar in de live opslag voor kortetermijnpromotie, tenzij je eerst expliciet het gefaseerde CLI-pad uitvoert

Als je wilt dat gegronde historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat zet gegronde duurzame kandidaten klaar in de kortetermijn-dreamingopslag terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om bij te werken (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor ze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-configuratie is `talk.provider` + `talk.providers.<provider>`. Doctor herschrijft oude vormen `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten uit te voeren en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert doctor-migraties ook automatisch uit bij het opstarten wanneer deze een verouderd configuratieformaat detecteert, zodat verouderde configuraties zonder handmatige tussenkomst worden gerepareerd. Migraties van Cron-taakopslag worden afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` op topniveau
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
    - Voor kanalen met benoemde `accounts` maar achtergebleven topniveau-kanaalwaarden voor één account, verplaats die account-scoped waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/standaarddoel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde instelling voor extensierelay)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (gateway-opstart slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook richtlijnen voor accountstandaarden voor kanalen met meerdere accounts:

    - Als twee of meer items in `channels.<channel>.accounts` zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallbackroutering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en toont het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen naar de verkeerde API worden gedwongen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfiguratie nog steeds verwijst naar het verwijderde pad van de Chrome-extensie, normaliseert doctor dit naar het huidige hostlokale Chrome MCP-koppelmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het hostlokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geinstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan om foutopsporing op afstand in de inspectiepagina van de browser in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de instelling aan Chrome-zijde niet voor je inschakelen. Hostlokale Chrome MCP vereist nog steeds:

    - een op Chromium gebaseerde browser 144+ op de gateway-/node-host
    - de browser die lokaal draait
    - foutopsporing op afstand ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor koppelen in de browser

    Gereedheid gaat hier alleen over lokale koppelvereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of een raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless-flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te controleren of de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), toont doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test uitgevoerd, zelfs als de Gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag kunt terugkrijgen. Aangepaste proxy's en overschrijvingen met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Waarschuwingen voor Codex Plugin-routes">
    Wanneer de gebundelde Codex Plugin is ingeschakeld, controleert doctor ook of primaire modelverwijzingen van `openai-codex/*` nog steeds via de standaard PI-runner worden opgelost. Die combinatie is geldig wanneer je Codex OAuth-/abonnementsauthenticatie via PI wilt gebruiken, maar is gemakkelijk te verwarren met de native Codex app-server-harness. Doctor waarschuwt en verwijst naar de expliciete app-server-vorm: `openai/*` plus `agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor herstelt dit niet automatisch omdat beide routes geldig zijn:

    - `openai-codex/*` + PI betekent "gebruik Codex OAuth-/abonnementsauthenticatie via de normale OpenClaw-runner."
    - `openai/*` + `runtime: "codex"` betekent "voer de ingesloten beurt uit via de native Codex app-server."
    - `/codex ...` betekent "beheer of koppel een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

    Als de waarschuwing verschijnt, kies dan de route die je bedoelde en bewerk de configuratie handmatig. Laat de waarschuwing ongewijzigd wanneer PI Codex OAuth opzettelijk is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf migreren naar de huidige structuur:

    - Sessiesopslag + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-map:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authenticatiestatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaard account-id: `default`)

    Deze migraties worden naar beste vermogen uitgevoerd en zijn idempotent; doctor geeft waarschuwingen wanneer er verouderde mappen als back-ups achterblijven. De Gateway/CLI migreert de verouderde sessies + agent-map ook automatisch bij het opstarten, zodat geschiedenis/authenticatie/modellen in het pad per agent terechtkomen zonder handmatige doctor-uitvoering. WhatsApp-authenticatie wordt bewust alleen gemigreerd via `openclaw doctor`. Normalisatie van praatprovider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen door sleutelvolgorde komen niet langer herhaalde `doctor --fix`-wijzigingen zonder effect veroorzaken.

  </Accordion>
  <Accordion title="3a. Verouderde Plugin-manifestmigraties">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde capability-sleutels op het hoogste niveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt doctor aan om ze naar het object `contracts` te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de sleutel `contracts` al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde Cron-opslagmigraties">
    Doctor controleert ook de opslag voor Cron-taken (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude taakvormen die de scheduler nog steeds voor compatibiliteit accepteert.

    Huidige Cron-opschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op het hoogste niveau (`message`, `model`, `thinking`, ...) → `payload`
    - leveringsvelden op het hoogste niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-leveringsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true` Webhook-terugvaltaken → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder het gedrag te wijzigen. Als een taak verouderde notificatie-terugval combineert met een bestaande niet-Webhook-leveringsmodus, waarschuwt doctor en laat die taak staan voor handmatige beoordeling.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke agentsessiemap op verouderde schrijfvergrendelingsbestanden — bestanden die achterblijven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert doctor: het pad, de PID, of de PID nog actief is, de vergrendelingsleeftijd en of het als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In de modus `--fix` / `--repair` verwijdert doctor verouderde vergrendelingsbestanden automatisch; anders wordt er een opmerking afgedrukt met de instructie om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Reparatie van sessietranscript-branches">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde branch-vorm die is ontstaan door de prompttranscript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne OpenClaw-runtimecontext plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In de modus `--fix` / `--repair` maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft doctor het transcript naar de actieve branch, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, referenties, logs en configuratie (tenzij je elders back-ups hebt).

    Doctorcontroles:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw aan te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan om machtigingen te herstellen (en geeft een `chown`-hint wanneer een mismatch in eigenaar/groep wordt gedetecteerd).
    - **macOS-cloudgesynchroniseerde statusmap**: waarschuwt wanneer de status onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...` uitkomt, omdat paden met synchronisatie tragere I/O en lock-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer de status uitkomt op een `mmcblk*`-mountbron, omdat willekeurige I/O op SD- of eMMC-opslag trager kan zijn en sneller kan slijten onder sessie- en referentiewrites.
    - **Sessiemappen ontbreken**: `sessions/` en de sessiestoremap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcript-mismatch**: waarschuwt wanneer recente sessie-items ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-line JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in homedirectory's of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan worden gesplitst tussen installaties).
    - **Herinnering voor externe modus**: als `gateway.mode=remote` is, herinnert doctor je eraan om het op de externe host uit te voeren (de status staat daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de auth-store, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen bij interactieve uitvoering (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die aangeeft dat je opnieuw moet inloggen), meldt doctor dat herauthenticatie vereist is en print het de exacte opdracht `openclaw models auth login --provider ...` die je moet uitvoeren.

    Doctor meldt ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte cooldowns (rate limits/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturatie-/tegoedfouten)

  </Accordion>
  <Accordion title="6. Modelvalidatie voor hooks">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Reparatie van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar legacy-namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Runtime-afhankelijkheden van gebundelde plugins">
    Doctor verifieert runtime-afhankelijkheden alleen voor gebundelde plugins die actief zijn in de huidige configuratie of ingeschakeld zijn via hun standaardwaarde in het gebundelde manifest, bijvoorbeeld `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, of een standaard ingeschakelde gebundelde provider. Als er afhankelijkheden ontbreken, meldt doctor de pakketten en installeert het ze in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Externe plugins gebruiken nog steeds `openclaw plugins install` / `openclaw plugins update`; doctor installeert geen afhankelijkheden voor willekeurige pluginpaden.

    Tijdens doctor-reparatie melden gebundelde npm-installaties voor runtime-afhankelijkheden spinner-voortgang in TTY-sessies en periodieke regelvoortgang in gepipete/headless uitvoer. De Gateway en lokale CLI kunnen ook actieve gebundelde Plugin-runtime-afhankelijkheden op aanvraag repareren voordat een gebundelde Plugin wordt geïmporteerd. Deze installaties zijn beperkt tot de installatieroot van de Plugin-runtime, worden uitgevoerd met uitgeschakelde scripts, schrijven geen package lock en worden bewaakt door een installatieroot-lock zodat gelijktijdige CLI- of Gateway-starts niet tegelijk dezelfde `node_modules`-boom wijzigen.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opschoonhints">
    Doctor detecteert verouderde gateway-services (launchd/systemd/schtasks) en biedt aan ze te verwijderen en de OpenClaw-service te installeren met de huidige gateway-poort. Het kan ook scannen op extra gateway-achtige services en opschoonhints tonen. OpenClaw-gateway-services met profielnamen worden als volwaardig beschouwd en niet als "extra" gemarkeerd.

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw-gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeem-supervisor de gateway-levenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Migratie van Startup Matrix">
    Wanneer een Matrix-kanaalaccount een wachtende of uitvoerbare verouderde statusmigratie heeft, maakt doctor (in `--fix` / `--repair`-modus) een snapshot vóór de migratie en voert daarna de best-effort migratiestappen uit: migratie van verouderde Matrix-status en voorbereiding van verouderde versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu de staat van apparaatkoppelingen als onderdeel van de normale gezondheidscontrole.

    Wat het rapporteert:

    - wachtende eerste koppelingsverzoeken
    - wachtende rol-upgrades voor al gekoppelde apparaten
    - wachtende scope-upgrades voor al gekoppelde apparaten
    - reparaties voor openbare-sleutel-mismatches waarbij de apparaat-id nog overeenkomt maar de apparaatidentiteit niet langer overeenkomt met de goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes afwijken van de goedgekeurde koppelingsbaseline
    - lokaal gecachte apparaattoken-vermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan gateway-zijde of verouderde scope-metadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het toont in plaats daarvan de exacte volgende stappen:

    - inspecteer wachtende verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een vers token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder en keur een verouderde record opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van wachtende rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het als systemd-gebruikersservice draait, zorgt doctor ervoor dat lingering is ingeschakeld zodat de gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en verouderde mappen)">
    Doctor toont een samenvatting van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende, ontbrekende-vereisten- en allowlist-geblokkeerde skills.
    - **Verouderde werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere verouderde werkruimtemappen naast de huidige werkruimte bestaan.
    - **Pluginstatus**: telt ingeschakelde/uitgeschakelde/foutieve plugins; toont Plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundelplugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele waarschuwingen of fouten tijdens het laden die door het Plugin-register zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestanden">
    Doctor controleert of bootstrapbestanden van de werkruimte (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en het totale aantal geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden worden afgekapt of dicht bij de limiet zitten, toont doctor tips voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaalplugins">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de loshangende kanaalgebonden configuratie die naar die Plugin verwees: `channels.<id>`-vermeldingen, heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar de configuratie de gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shell-aanvulling">
    Doctor controleert of tab-aanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shell-profiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), werkt doctor dit bij naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, genereert doctor de cache automatisch opnieuw.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-auth-controles (lokaal token)">
    Doctor controleert of lokale gateway-tokenauth gereed is.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder runtime fail-fast-gedrag te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat het automatische resolutie over in plaats van te crashen of het token ten onrechte als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de gateway opnieuw te starten wanneer deze ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoeken gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: peilt of de `qmd`-binary beschikbaar en startbaar is. Zo niet, toont het hersteladvies inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, stelt het voor over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): controleert of er een API-sleutel aanwezig is in de omgeving of auth-store. Toont bruikbare herstelhints als die ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van het lokale model en probeert daarna elke externe provider in volgorde van automatische selectie.

    Wanneer een gecachet gateway-peilresultaat beschikbaar is (gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de voor de CLI zichtbare configuratie en meldt het eventuele verschillen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik het deep memory-statuscommando wanneer u een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om de embeddinggereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Waarschuwingen voor kanaalstatus">
    Als de gateway gezond is, voert doctor een kanaalstatuspeiling uit en rapporteert het waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer het een mismatch vindt, raadt het een update aan en kan het het servicebestand/de taak herschrijven naar de huidige standaardwaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de gateway-service. Het rapporteert nog steeds servicestatus en voert niet-service-reparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschoning van verouderde services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen commando-/entrypoint-metadata terwijl de overeenkomende systemd-gateway-unit actief is. Het negeert ook inactieve niet-verouderde extra gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoonruis veroorzaken.
    - Als tokenauth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor service-installatie/reparatie de SecretRef maar bewaart het opgeloste tokenwaarden in platte tekst niet in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`-/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline insloten en herschrijft de servicemetadata zodat die waarden vanuit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauth een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, blokkeert doctor het installatie-/reparatiepad met bruikbaar advies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units omvatten de token-driftcontroles van doctor nu zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van service-auth-metadata.
    - Doctor-servicereparaties weigeren een gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - U kunt altijd een volledige herschrijving forceren via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste afsluitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Ook controleert Doctor op poortconflicten op de gatewaypoort (standaard `18789`) en meldt waarschijnlijke oorzaken (gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de gatewayservice draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerpaden kunnen na upgrades stuklopen omdat de service je shell-initialisatie niet laadt. Doctor biedt aan om te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde services behouden expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen voor versiebeheerders worden alleen naar de service-PATH geschreven wanneer die mappen op schijf bestaan. Dit houdt de gegenereerde supervisor-PATH afgestemd op dezelfde minimale-PATH-audit die Doctor later uitvoert.

  </Accordion>
  <Accordion title="18. Configuratie wegschrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en toont een back-uptip als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids over werkruimtestructuur en git-back-up (aanbevolen: private GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
