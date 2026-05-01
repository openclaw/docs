---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-achterwaarts compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-opdracht: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Diagnose
x-i18n:
    generated_at: "2026-05-01T11:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
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

    Accepteer standaardwaarden zonder prompts (inclusief herstart-/service-/sandboxreparatiestappen waar van toepassing).

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

Als je wijzigingen wilt controleren voordat je schrijft, open dan eerst het configuratiebestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele pre-flight update voor git-installaties (alleen interactief).
    - Controle op versheid van UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Skills-statussamenvatting (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Migratie van Talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en gereedheid voor Chrome MCP.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin-/tool-allowlist wanneer `plugins.allow` beperkend is maar het toolbeleid nog steeds om wildcard- of Plugin-eigen tools vraagt.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-auth).
    - Migratie van verouderde contractsleutel in Plugin-manifest (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cron-store (`jobId`, `schedule.cron`, delivery-/payloadvelden op topniveau, payload `provider`, eenvoudige `notify: true` webhook fallback-taken).
    - Migratie van verouderd runtimebeleid voor agents naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde Plugin-configuratie wanneer Plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor dubbele prompt-rewrite-branches die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van tombstones voor herstartherstel van vastgelopen subagents, met ondersteuning voor `--fix` om verouderde afgebroken herstelvlaggen te wissen zodat startup het child niet als door herstart afgebroken blijft behandelen.
    - Controles op statusintegriteit en machtigingen (sessies, transcripten, statusmap).
    - Controles op machtigingen van configuratiebestanden (chmod 600) bij lokaal uitvoeren.
    - Gezondheid van model-auth: controleert OAuth-verloop, kan bijna verlopende tokens vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra gateways.
    - Migratie van verouderde status voor Matrix-kanaal (in `--fix`- / `--repair`-modus).
    - Runtimecontroles voor Gateway (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Kanaalstatuswaarschuwingen (geprobed vanuit de actieve Gateway).
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor Gateway-services die shellwaarden voor `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Controles op best practices voor Gateway-runtime (Node versus Bun, paden van version-manager).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Auth, beveiliging en pairing">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authcontroles voor lokale tokenmodus (biedt tokengeneratie wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatpairing (openstaande eerste pairverzoeken, openstaande rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en auth-drift in gepairde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - Controle van systemd linger op Linux.
    - Controle van bestandsgrootte voor werkruimte-bootstrap (afkap-/bijna-limietwaarschuwingen voor contextbestanden).
    - Controle van shellcompletionstatus en automatische installatie/upgrade.
    - Gereedheidscontrole voor embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallaties (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams-UI-backfill en reset

De Dreams-scène in de Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de gegronde Dreaming-workflow. Deze acties gebruiken Gateway RPC-methoden in doctor-stijl, maar ze zijn **geen** onderdeel van de reparatie/migratie via de `openclaw doctor` CLI.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de gegronde REM-dagboekronde uit en schrijft omkeerbare backfill-vermeldingen naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekvermeldingen uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede gegronde kortetermijnvermeldingen die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen niet automatisch gegronde kandidaten naar de live kortetermijnpromotiestore, tenzij je eerst expliciet het gestagede CLI-pad uitvoert

Als je wilt dat gegronde historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget gegronde duurzame kandidaten naar de kortetermijn-Dreaming-store, terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om bij te werken (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor die naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige publieke Talk-configuratie is `talk.provider` + `talk.providers.<provider>`. Doctor herschrijft oude vormen van `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en het toolbeleid
    wildcard- of Plugin-eigen toolvermeldingen gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van Plugins die daadwerkelijk laden; het omzeilt de exclusieve Plugin-
    allowlist niet.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten uit te voeren en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert doctor-migraties ook automatisch uit bij het opstarten wanneer deze een verouderd configuratieformaat detecteert, zodat verouderde configuraties worden gerepareerd zonder handmatige tussenkomst. Migraties van de Cron job-store worden afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → topniveau `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - verouderd `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Voor kanalen met benoemde `accounts` maar achterblijvende topniveaukanaalwaarden voor een enkel account: verplaats die accountgebonden waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/default-doel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde relay-instelling voor extensies)
    - verouderd `models.providers.*.api: "openai"` → `"openai-completions"` (het opstarten van de Gateway slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook begeleiding voor standaardaccounts bij kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en toont het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dat de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen op de verkeerde API worden gedwongen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfiguratie nog steeds naar het verwijderde Chrome-extensiepad verwijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-koppelmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen voor automatisch verbinden
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer deze lager is dan Chrome 144
    - herinnert je eraan externe foutopsporing in de inspectiepagina van de browser in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een op Chromium gebaseerde browser 144+ op de Gateway/Node-host
    - dat de browser lokaal draait
    - externe foutopsporing ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor koppelen in de browser

    Gereedheid gaat hier alleen over vereisten voor lokaal koppelen. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of een raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. Vereisten voor OAuth TLS">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, peilt doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de peiling faalt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), toont doctor platformspecifieke herstelbegeleiding. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de peiling uitgevoerd, zelfs als de Gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverrides">
    Als je eerder verouderde OpenAI-transportinstellingen onder `models.providers.openai-codex` hebt toegevoegd, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxy's en overrides die alleen headers aanpassen, blijven ondersteund en veroorzaken deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex Plugin-routewaarschuwingen">
    Wanneer de meegeleverde Codex Plugin is ingeschakeld, controleert doctor ook of primaire modelreferenties van `openai-codex/*` nog steeds via de standaard PI-runner worden opgelost. Die combinatie is geldig wanneer je Codex OAuth-/abonnementsauthenticatie via PI wilt, maar is gemakkelijk te verwarren met de native Codex app-server-harness. Doctor waarschuwt en verwijst naar de expliciete app-server-vorm: `openai/*` plus `agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor herstelt dit niet automatisch omdat beide routes geldig zijn:

    - `openai-codex/*` + PI betekent "gebruik Codex OAuth-/abonnementsauthenticatie via de normale OpenClaw-runner."
    - `openai/*` + `runtime: "codex"` betekent "voer de ingesloten beurt uit via de native Codex app-server."
    - `/codex ...` betekent "beheer of koppel een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

    Als de waarschuwing verschijnt, kies je de route die je bedoelde en bewerk je de configuratie handmatig. Laat de waarschuwing ongewijzigd wanneer PI Codex OAuth bewust is gekozen.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere schijfindelingen migreren naar de huidige structuur:

    - Sessiestore + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agent-map:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authenticatiestatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het verouderde mappen als back-ups laat staan. De Gateway/CLI migreert ook automatisch de verouderde sessies + agent-map bij het opstarten, zodat geschiedenis/authenticatie/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. WhatsApp-authenticatie wordt bewust alleen via `openclaw doctor` gemigreerd. Normalisatie van talk-provider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen uit sleutelvolgorde bestaan niet langer herhaalde no-op-wijzigingen door `doctor --fix` veroorzaken.

  </Accordion>
  <Accordion title="3a. Verouderde Plugin-manifestmigraties">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde topniveau-capability-sleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt het aan ze naar het `contracts`-object te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de `contracts`-sleutel al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde Cron-storemigraties">
    Doctor controleert ook de Cron-taakstore (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude taakvormen die de scheduler nog steeds accepteert voor compatibiliteit.

    Huidige Cron-opruimingen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - topniveau payloadvelden (`message`, `model`, `thinking`, ...) → `payload`
    - topniveau afleveringsvelden (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider` afleveringsaliassen → expliciet `delivery.channel`
    - eenvoudige verouderde `notify: true` webhook-fallbacktaken → expliciet `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat zonder gedragswijziging kan. Als een taak verouderde notify-fallback combineert met een bestaande niet-webhook-aflevermodus, waarschuwt doctor en laat het die taak staan voor handmatige beoordeling.

  </Accordion>
  <Accordion title="3c. Opruimen van sessievergrendelingen">
    Doctor scant elke agentsessiemap op verouderde schrijfvergrendelingsbestanden — bestanden die zijn achtergebleven wanneer een sessie abnormaal is afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`-/`--repair`-modus verwijdert het verouderde vergrendelingsbestanden automatisch; anders toont het een opmerking en instrueert het je om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Reparatie van sessietranscript-branches">
    Doctor scant agentsessie-JSONL-bestanden op de gedupliceerde branchvorm die is aangemaakt door de transcript-herschrijffout voor prompts van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`-/`--repair`-modus maakt doctor naast elk getroffen bestand een back-up en herschrijft het de transcriptie naar de actieve branch, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, credentials, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw aan te maken, en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: controleert schrijfbaarheid; biedt aan om machtigingen te herstellen (en geeft een `chown`-hint wanneer een eigenaar-/groepmismatch wordt gedetecteerd).
    - **macOS-statusmap met cloudsynchronisatie**: waarschuwt wanneer de status uitkomt onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat paden met synchronisatie tragere I/O en lock-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer de status uitkomt op een `mmcblk*`-mountbron, omdat random I/O op SD of eMMC trager kan zijn en sneller kan slijten bij sessie- en credentialschrijfbewerkingen.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regel JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in verschillende thuismappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan over installaties worden verdeeld).
    - **Herinnering voor externe modus**: als `gateway.mode=remote` is, herinnert doctor je eraan om dit op de externe host uit te voeren (de status bevindt zich daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Status van modelauthenticatie (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de authenticatieopslag, waarschuwt wanneer tokens binnenkort verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen wanneer interactief wordt uitgevoerd (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die aangeeft dat je opnieuw moet inloggen), meldt doctor dat herauthenticatie vereist is en drukt het de exacte uit te voeren opdracht `openclaw models auth login --provider ...` af.

    Doctor meldt ook authenticatieprofielen die tijdelijk onbruikbaar zijn door:

    - korte afkoelperiodes (snelheidslimieten/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturerings-/kredietfouten)

  </Accordion>
  <Accordion title="6. Validatie van hooks-model">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer die niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar legacy-namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Runtime-afhankelijkheden van gebundelde Plugin">
    Doctor verifieert runtime-afhankelijkheden alleen voor gebundelde plugins die actief zijn in de huidige configuratie of zijn ingeschakeld door hun gebundelde manifeststandaard, bijvoorbeeld `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, geconfigureerde `models.providers.*` / agentmodelreferenties, of een standaard ingeschakelde gebundelde Plugin zonder provider-eigenaarschap. Als er ontbreken, meldt doctor de pakketten en installeert het ze in de modus `openclaw doctor --fix` / `openclaw doctor --repair`. Externe plugins gebruiken nog steeds `openclaw plugins install` / `openclaw plugins update`; doctor installeert geen afhankelijkheden voor willekeurige Plugin-paden.

    Tijdens doctor-herstel melden npm-installaties van gebundelde runtime-afhankelijkheden spinner-voortgang in TTY-sessies en periodieke regelvoortgang in gepipede/headless uitvoer. Gateway-opstart en configuratieherladen gaan de Plugin-planmodus in voordat runtime-modules van gebundelde plugins worden geïmporteerd; normale runtime-imports zijn alleen ter verificatie en starten geen package-manager-herstel. Deze installaties zijn beperkt tot de installatieroot van de Plugin-runtime, worden uitgevoerd met scripts uitgeschakeld, schrijven geen package lock, en worden bewaakt door een installatieroot-lock zodat gelijktijdige CLI- of Gateway-starts niet tegelijkertijd dezelfde `node_modules`-boom wijzigen. Verouderde legacy-locks van beëindigde Docker-/containerstarts worden teruggevorderd wanneer hun eigenaarsmetadata geen huidige procesincarnatie kunnen bewijzen en de lockbestanden oud zijn.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opruimhints">
    Doctor detecteert legacy gatewayservices (launchd/systemd/schtasks) en biedt aan ze te verwijderen en de OpenClaw-service te installeren met de huidige gatewaypoort. Het kan ook scannen naar extra gateway-achtige services en opruimhints afdrukken. Profielgenoemde OpenClaw-gatewayservices worden als eersteklas beschouwd en worden niet als "extra" gemarkeerd.

    Op Linux installeert doctor niet automatisch een tweede gebruikersservice als de gatewayservice op gebruikersniveau ontbreekt maar er een OpenClaw-gatewayservice op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systemsupervisor de Gateway-levenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Migratie van Startup Matrix">
    Wanneer een Matrix-kanaalaccount een wachtende of uitvoerbare legacy-statusmigratie heeft, maakt doctor (in de modus `--fix` / `--repair`) een snapshot vóór de migratie en voert daarna de best-effort migratiestappen uit: legacy Matrix-statusmigratie en voorbereiding van legacy versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezen modus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en authenticatiedrift">
    Doctor inspecteert nu de status van apparaatkoppeling als onderdeel van de normale gezondheidscontrole.

    Wat het meldt:

    - wachtende eerste koppelingsverzoeken
    - wachtende rolupgrades voor al gekoppelde apparaten
    - wachtende scope-upgrades voor al gekoppelde apparaten
    - herstel van publieke-sleutelmismatches waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet langer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline zijn afgedreven
    - lokale gecachete apparaat-tokenvermeldingen voor de huidige machine die ouder zijn dan een tokenrotatie aan Gateway-zijde of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaat-tokens niet automatisch. In plaats daarvan drukt het de exacte volgende stappen af:

    - inspecteer openstaande aanvragen met `openclaw devices list`
    - keur de exacte aanvraag goed met `openclaw devices approve <requestId>`
    - roteer een nieuw token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderde record en keur deze opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van openstaande rol-/scope-upgrades en van drift in verouderde tokens/apparaatidentiteit.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor privéberichten zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Bij uitvoering als systemd-gebruikersservice zorgt doctor ervoor dat lingering is ingeschakeld, zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en verouderde mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt geschikte Skills, Skills met ontbrekende vereisten en door de allowlist geblokkeerde Skills.
    - **Verouderde werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere verouderde werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/plugins met fouten; vermeldt plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van bundelplugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele waarschuwingen of fouten tijdens het laden die door het pluginregister zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of werkruimtebootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, oorzaak van afkapping (`max/file` of `max/total`) en totale geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaalplugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de loshangende kanaalgebonden configuratie die naar die plugin verwees: `channels.<id>`-vermeldingen, Heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is, maar de configuratie de gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shell-completion">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch completion-patroon gebruikt (`source <(openclaw completion ...)`), werkt doctor dit bij naar de snellere variant met cachebestand.
    - Als completion in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen completion is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig te regenereren.

  </Accordion>
  <Accordion title="12. Gateway-authenticatiecontroles (lokaal token)">
    Doctor controleert of lokale Gateway-tokenauthenticatie gereed is.

    - Als de tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder fail-fast-gedrag van de runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: reparatie van Telegram `allowFrom` / `groupAllowFrom` `@username` probeert geconfigureerde botreferenties te gebruiken wanneer beschikbaar.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, rapporteert doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat het automatische oplossing over in plaats van te crashen of het token onterecht als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de Gateway opnieuw te starten wanneer deze ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekfunctie gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of het `qmd`-binaire bestand beschikbaar is en kan worden gestart. Zo niet, dan worden herstelrichtlijnen afgedrukt, inclusief het npm-pakket en een handmatige optie voor het binaire pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als deze ontbreekt, wordt voorgesteld over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): verifieert dat er een API-sleutel aanwezig is in de omgeving of auth-opslag. Drukt uitvoerbare hersteltips af als deze ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van het lokale model en probeert daarna elke externe provider in de volgorde voor automatische selectie.

    Wanneer een gecachet Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de voor de CLI zichtbare configuratie en meldt het eventuele verschillen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik de opdracht voor diepe geheugenstatus wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om de gereedheid van embeddings tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Waarschuwingen voor kanaalstatus">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert het waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + herstel van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer het een afwijking vindt, beveelt het een update aan en kan het het servicebestand/de taak herschrijven naar de huidige standaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaard herstelprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de Gateway-service. Het rapporteert nog steeds servicestatus en voert niet-serviceherstel uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschoning van legacy-services over omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen opdracht-/entrypointmetadata terwijl de overeenkomende systemd-Gateway-unit actief is. Het negeert ook inactieve niet-legacy extra Gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoningsruis veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor service-installatie/herstel de SecretRef maar slaat het opgeloste plattetekst-tokenwaarden niet op in omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingebed en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer de serviceopdracht nog steeds een oude `--port` vastpint nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, blokkeert doctor het installatie-/herstelpad met uitvoerbare begeleiding.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/herstel totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units bevatten doctortoken-driftcontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen bij het vergelijken van serviceauthenticatiemetadata.
    - Doctor-serviceherstel weigert een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostiek voor Gateway-runtime + poort">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerpaden kunnen na upgrades breken omdat de service je shell-init niet laadt. Doctor biedt aan om te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of herstelde services behouden expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen van versiebeheerders worden alleen naar de service-PATH geschreven wanneer die mappen op schijf bestaan. Zo blijft de gegenereerde supervisor-PATH afgestemd op dezelfde minimale-PATH-audit die doctor later uitvoert.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart alle configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en toont een back-uptip als de werkruimte nog niet onder git valt.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen: private GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
