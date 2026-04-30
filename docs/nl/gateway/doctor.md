---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Dokter
x-i18n:
    generated_at: "2026-04-30T09:36:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` is het reparatie- en migratiehulpmiddel voor OpenClaw. Het repareert verouderde configuratie/status, controleert de gezondheid en biedt uitvoerbare reparatiestappen.

## Snelstart

```bash
openclaw doctor
```

### Modi zonder interface en voor automatisering

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accepteer standaardwaarden zonder prompts (inclusief herstart-/service-/sandbox-reparatiestappen waar van toepassing).

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

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + statusverplaatsingen op schijf). Slaat herstart-/service-/sandbox-acties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

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
    - Optionele preflight-update voor git-installaties (alleen interactief).
    - Controle op actualiteit van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Skills-statussamenvatting (geschikt/ontbrekend/geblokkeerd) en pluginstatus.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Talk-configuratiemigratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-schaduwwerking (`models.providers.openai-codex`).
    - Controle op OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Verouderde statusmigratie op schijf (sessies/agentmap/WhatsApp-authenticatie).
    - Migratie van verouderde plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cron-opslag (`jobId`, `schedule.cron`, velden voor bezorging/payload op topniveau, payload `provider`, eenvoudige `notify: true` webhook-terugvaltaken).
    - Migratie van verouderd runtimebeleid voor agents naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde pluginconfiguratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde pluginverwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor dubbele prompt-herschrijftakken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Controles op statusintegriteit en machtigingen (sessies, transcripten, statusmap).
    - Controles van configuratiebestandsmachtigingen (chmod 600) bij lokale uitvoering.
    - Gezondheid van modelauthenticatie: controleert OAuth-verval, kan tokens vernieuwen die bijna verlopen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra Gateways.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix` / `--repair`-modus).
    - Runtimecontroles voor Gateway (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (gepeild vanuit de actieve Gateway).
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor Gateway-services die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Best-practicecontroles voor Gateway-runtime (Node versus Bun, paden van version managers).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelingsverzoeken, openstaande rol-/scope-upgrades, drift in verouderde lokale apparaattokencache en authenticatiedrift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van bestandsgrootte voor werkruimtebootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Statuscontrole van shellcompletion en automatische installatie/upgrade.
    - Controle op gereedheid van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles van broninstallatie (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Dreams-scene in Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde dreaming-workflow. Deze acties gebruiken RPC-methoden in doctor-stijl van de Gateway, maar ze maken **geen** deel uit van de CLI-reparatie/-migratie van `openclaw doctor`.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de gegronde REM-dagboekpass uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede, uitsluitend gegronde kortetermijnvermeldingen die afkomstig zijn uit historische replay en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze plaatsen gegronde kandidaten niet automatisch in de live promotieopslag voor korte termijn, tenzij je eerst expliciet het gestagede CLI-pad uitvoert

Als je wilt dat gegronde historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat plaatst gegronde duurzame kandidaten in de dreaming-opslag voor korte termijn terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om bij te werken (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor ze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-configuratie is `talk.provider` + `talk.providers.<provider>`. Doctor herschrijft oude vormen van `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert doctor-migraties ook automatisch uit bij het opstarten wanneer het een verouderde configuratie-indeling detecteert, zodat verouderde configuraties zonder handmatige tussenkomst worden gerepareerd. Migraties van de Cron-taakopslag worden afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → topniveau `bindings`
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
    - Voor kanalen met benoemde `accounts` maar achterblijvende kanaalwaarden op topniveau voor één account: verplaats die accountspecifieke waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/standaarddoel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor trage provider-/modeltimeouts
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde instelling voor extensierelay)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-opstart slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)

    Doctor-waarschuwingen omvatten ook richtlijnen voor accountstandaarden voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat terugvalroutering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt het geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen naar de verkeerde API worden gedwongen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfiguratie nog steeds verwijst naar het verwijderde Chrome-extensiepad, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-koppelmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer deze lager is dan Chrome 144
    - herinnert je eraan om foutopsporing op afstand in te schakelen op de inspectiepagina van de browser (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway-/nodehost
    - de browser die lokaal draait
    - foutopsporing op afstand ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor koppelen in de browser

    Gereedheid gaat hier alleen over lokale koppelvereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of een raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, externe-browser- of andere headless-stromen. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), toont doctor platformspecifieke herstelinstructies. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test uitgevoerd, zelfs als de Gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxy's en alleen-headeroverschrijvingen worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex Plugin-routewaarschuwingen">
    Wanneer de gebundelde Codex Plugin is ingeschakeld, controleert doctor ook of `openai-codex/*` primaire modelverwijzingen nog steeds via de standaard PI-runner worden opgelost. Die combinatie is geldig wanneer je Codex OAuth-/abonnementsauthenticatie via PI wilt, maar is gemakkelijk te verwarren met de native Codex-app-serverharnas. Doctor waarschuwt en verwijst naar de expliciete app-servervorm: `openai/*` plus `agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor herstelt dit niet automatisch omdat beide routes geldig zijn:

    - `openai-codex/*` + PI betekent "gebruik Codex OAuth-/abonnementsauthenticatie via de normale OpenClaw-runner."
    - `openai/*` + `runtime: "codex"` betekent "voer de ingesloten beurt uit via native Codex-app-server."
    - `/codex ...` betekent "beheer of koppel een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

    Als de waarschuwing verschijnt, kies dan de route die je bedoelde en bewerk de configuratie handmatig. Laat de waarschuwing ongewijzigd wanneer PI Codex OAuth opzettelijk is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf migreren naar de huidige structuur:

    - Sessiesopslag + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authenticatiestatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaard account-id: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer er verouderde mappen als back-ups achterblijven. De Gateway/CLI migreert ook automatisch de verouderde sessies + agentmap bij het opstarten, zodat geschiedenis/authenticatie/modellen in het pad per agent terechtkomen zonder een handmatige doctor-run. WhatsApp-authenticatie wordt bewust alleen gemigreerd via `openclaw doctor`. Normalisatie van talkprovider/provider-map vergelijkt nu op structurele gelijkheid, dus verschillen die alleen uit sleutelvolgorde bestaan activeren niet langer herhaalde no-op-wijzigingen door `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Verouderde Plugin-manifestmigraties">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde capability-sleutels op topniveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt het aan om ze naar het `contracts`-object te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de `contracts`-sleutel al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde Cron-opslagmigraties">
    Doctor controleert ook de Cron-taakopslag (`~/.openclaw/cron/jobs.json` standaard, of `cron.store` wanneer overschreven) op oude taakvormen die de planner nog steeds accepteert voor compatibiliteit.

    Huidige Cron-opruimingen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op topniveau (`message`, `model`, `thinking`, ...) → `payload`
    - afleveringsvelden op topniveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-afleveringsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true` Webhook-fallbacktaken → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder gedrag te wijzigen. Als een taak verouderde notify-fallback combineert met een bestaande niet-webhook-afleveringsmodus, waarschuwt doctor en laat het die taak staan voor handmatige beoordeling.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke agentsessiemap op verouderde schrijfvergrendelingsbestanden — bestanden die zijn achtergebleven wanneer een sessie abnormaal werd afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, PID, of de PID nog leeft, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert het verouderde vergrendelingsbestanden automatisch; anders toont het een opmerking en instrueert het je om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Herstel van sessietranscriptietakken">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde takvorm die is gemaakt door de prompttranscriptieherschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne OpenClaw-runtimecontext plus een actieve zustertak met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt doctor een back-up van elk getroffen bestand naast het origineel en herschrijft het de transcriptie naar de actieve tak, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als deze verdwijnt, verlies je sessies, inloggegevens, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat het ontbrekende gegevens niet kan herstellen.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan machtigingen te herstellen (en geeft een `chown`-hint wanneer een eigenaar-/groepmismatch wordt gedetecteerd).
    - **macOS-statusmap met cloudsynchronisatie**: waarschuwt wanneer status wordt opgelost onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat paden met synchronisatie tragere I/O en vergrendelings-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer status wordt opgelost naar een `mmcblk*`-aankoppelpuntbron, omdat door SD of eMMC ondersteunde willekeurige I/O trager kan zijn en sneller kan slijten bij sessie- en inloggegevensschrijfbewerkingen.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis te behouden en `ENOENT`-crashes te vermijden.
    - **Transcriptiemismatch**: waarschuwt wanneer recente sessie-items ontbrekende transcriptiebestanden hebben.
    - **Hoofdsessie "1-regel JSONL"**: markeert wanneer de hoofdtranscriptie slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in home-mappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan tussen installaties worden gesplitst).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan om het op de externe host uit te voeren (de status leeft daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verloop)">
    Doctor inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze verversen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen wanneer interactief wordt uitgevoerd (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant` of een provider die je vertelt opnieuw in te loggen), meldt doctor dat opnieuw authenticeren vereist is en toont het de exacte opdracht `openclaw models auth login --provider ...` die moet worden uitgevoerd.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte afkoelperiodes (snelheidslimieten/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/tegoedfouten)

  </Accordion>
  <Accordion title="6. Validatie van hooks-model">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelverwijzing tegen de catalogus en allowlist en waarschuwt wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar verouderde namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Runtime-afhankelijkheden van gebundelde Plugins">
    Doctor verifieert runtime-afhankelijkheden alleen voor gebundelde Plugins die actief zijn in de huidige configuratie of zijn ingeschakeld door hun gebundelde manifeststandaard, bijvoorbeeld `plugins.entries.discord.enabled: true`, verouderde `channels.discord.enabled: true`, geconfigureerde `models.providers.*` / agentmodelverwijzingen, of een standaard ingeschakelde gebundelde Plugin zonder provider-eigenaarschap. Als er ontbreken, rapporteert doctor de pakketten en installeert ze in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Externe Plugins gebruiken nog steeds `openclaw plugins install` / `openclaw plugins update`; doctor installeert geen afhankelijkheden voor willekeurige Plugin-paden.

    Tijdens doctor-reparatie melden gebundelde npm-installaties voor runtime-afhankelijkheden spinner-voortgang in TTY-sessies en periodieke regelvoortgang in gepijpte/headless uitvoer. De Gateway en lokale CLI kunnen ook actieve runtime-afhankelijkheden van gebundelde plugins op aanvraag repareren voordat een gebundelde plugin wordt geïmporteerd. Deze installaties zijn beperkt tot de installatieroot van de plugin-runtime, worden uitgevoerd met scripts uitgeschakeld, schrijven geen package lock en worden beschermd door een installatieroot-lock zodat gelijktijdige CLI- of Gateway-starts niet tegelijk dezelfde `node_modules`-boom wijzigen.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opruimhints">
    Doctor detecteert verouderde gateway-services (launchd/systemd/schtasks) en biedt aan ze te verwijderen en de OpenClaw-service te installeren met de huidige gateway-poort. Het kan ook scannen op extra gateway-achtige services en opruimhints afdrukken. OpenClaw-gateway-services met profielnaam worden als eersteklas beschouwd en niet als "extra" gemarkeerd.

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw-gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeemsupervisor eigenaar is van de gateway-levenscyclus.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een wachtende of uitvoerbare migratie van verouderde toestand heeft, maakt doctor (in `--fix`- / `--repair`-modus) een pre-migratie-snapshot en voert daarna de best-effort migratiestappen uit: migratie van verouderde Matrix-toestand en voorbereiding van verouderde versleutelde toestand. Beide stappen zijn niet-fataal; fouten worden gelogd en startup gaat door. In alleen-lezen modus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-afwijking">
    Doctor inspecteert nu de toestand van apparaatkoppeling als onderdeel van de normale gezondheidscontrole.

    Wat het rapporteert:

    - wachtende eerste koppelingsverzoeken
    - wachtende rol-upgrades voor al gekoppelde apparaten
    - wachtende scope-upgrades voor al gekoppelde apparaten
    - reparaties voor publieke-sleutel-mismatch waarbij de apparaat-id nog overeenkomt maar de apparaatidentiteit niet meer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan scopes buiten de goedgekeurde koppelingsbasislijn afwijken
    - lokaal gecachte apparaat-tokenvermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan gateway-zijde of verouderde scope-metadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte volgende stappen af:

    - inspecteer wachtende verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een nieuw token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder en keur een verouderd record opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van wachtende rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsafwijking.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als doctor als systemd-gebruikersservice wordt uitgevoerd, zorgt het ervoor dat lingering is ingeschakeld zodat de gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (skills, plugins en verouderde mappen)">
    Doctor drukt een samenvatting af van de werkruimtetoestand voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende, met ontbrekende vereisten en door allowlist geblokkeerde Skills.
    - **Verouderde werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere verouderde werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/met fouten gestopte plugins; vermeldt plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundelplugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele waarschuwingen of fouten tijdens het laden die door het pluginregister zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of bootstrapbestanden van de werkruimte (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, truncatiepercentage, truncatieoorzaak (`max/file` of `max/total`) en totaal aantal geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden worden afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaalplugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de loshangende kanaalgebonden configuratie die naar die plugin verwees: `channels.<id>`-vermeldingen, heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overschrijvingen. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar de configuratie de gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shellaanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), upgradet doctor dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-auth-controles (lokaal token)">
    Doctor controleert gereedheid voor lokale gateway-token-auth.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het niet met plaintext.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde credentials inspecteren zonder het fail-fast runtimegedrag te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom`- / `groupAllowFrom`-`@username`-reparatie probeert geconfigureerde botcredentials te gebruiken wanneer beschikbaar.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de credential geconfigureerd-maar-niet-beschikbaar is en slaat het automatische oplossing over in plaats van te crashen of het token onterecht als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de gateway opnieuw te starten wanneer deze ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekfunctie gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: onderzoekt of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan worden herstelrichtlijnen afgedrukt, inclusief het npm-pakket en een optie voor een handmatig binarypad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, stelt het voor over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-store. Drukt uitvoerbare herstelhints af als deze ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van het lokale model en probeert daarna elke externe provider in automatische-selectievolgorde.

    Wanneer een gecachet gateway-proberesultaat beschikbaar is (gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de voor de CLI zichtbare configuratie en vermeldt het eventuele afwijkingen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik het diepe geheugenstatuscommando wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om embedding-gereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert het waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Supervisor-configuratieaudit + reparatie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd-afhankelijkheden voor network-online en herstartvertraging). Wanneer het een mismatch vindt, raadt het een update aan en kan het het servicebestand/de taak herschrijven naar de huidige standaardwaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaard reparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de gateway-service. Het rapporteert nog steeds servicegezondheid en voert niet-servicegerelateerde reparaties uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijvingen van supervisorconfiguratie en opschoning van verouderde services over omdat een externe supervisor eigenaar is van die levenscyclus.
    - Op Linux herschrijft doctor geen commando-/entrypoint-metadata terwijl de overeenkomende systemd-gateway-unit actief is. Het negeert ook inactieve niet-verouderde extra gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opruimruis veroorzaken.
    - Als token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor-service-installatie/reparatie de SecretRef maar bewaart het geen opgeloste plaintext-tokenwaarden in omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`-/SecretRef-gebackte serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hadden ingebed en herschrijft de servicemetadata zodat die waarden vanuit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastpint nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert doctor het installatie-/reparatiepad met uitvoerbare richtlijnen.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units bevatten doctor-tokenafwijkingscontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van service-auth-metadata.
    - Doctor-servicereparaties weigeren een gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving forceren via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste afsluitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de gatewaypoort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de gatewayservice draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en paden van versiebeheerders kunnen na upgrades kapotgaan omdat de service je shell-initialisatie niet laadt. Doctor biedt aan om te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde services behouden expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-directory's, maar geraden fallbackdirectory's van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die directory's op schijf bestaan. Dit houdt het gegenereerde supervisor-PATH afgestemd op dezelfde minimale PATH-audit die doctor later uitvoert.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart alle configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een geheugensysteem voor de werkruimte voor wanneer dat ontbreekt en drukt een back-uptip af als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen: private GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
