---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-achterwaarts compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Dokter
x-i18n:
    generated_at: "2026-05-02T11:16:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d306099cda1d7f6079ab94ce8bd4a716b8ccf9ab3637e14743c8a1c83db35ca6
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

    Accepteer standaardwaarden zonder prompts (inclusief herstart-/service-/sandboxreparatiestappen wanneer van toepassing).

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

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + statusverplaatsingen op schijf). Slaat herstart-/service-/sandboxacties over die menselijke bevestiging vereisen. Verouderde statusmigraties worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

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
    - Controle op actualiteit van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Statussamenvatting van Skills (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Talk-configuratiemigratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-schaduwing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin/tool-allowlists wanneer `plugins.allow` restrictief is maar het toolbeleid nog steeds om wildcard- of Plugin-eigen tools vraagt.
    - Verouderde statusmigratie op schijf (sessies/agentmap/WhatsApp-authenticatie).
    - Migratie van verouderde Plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde Cron-store (`jobId`, `schedule.cron`, velden voor levering/payload op hoogste niveau, payload `provider`, eenvoudige `notify: true` Webhook-fallbacktaken).
    - Migratie van verouderd agent-runtimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde Plugin-configuratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor dubbele prompt-herschrijftakken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van vastgelopen tombstones voor herstartherstel van subagents, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken herstelflags zodat het opstarten het kind niet blijft behandelen als door herstart afgebroken.
    - Integriteits- en machtigingscontroles voor status (sessies, transcripten, statusmap).
    - Machtigingscontroles voor configuratiebestanden (chmod 600) wanneer lokaal uitgevoerd.
    - Gezondheid van modelauthenticatie: controleert OAuth-verval, kan bijna verlopen tokens vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra Gateway-instanties.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix`- / `--repair`-modus).
    - Gateway-runtimecontroles (service geïnstalleerd maar niet actief; gecachet launchd-label).
    - Kanaalstatuswaarschuwingen (gepeild vanuit de actieve Gateway).
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschoning van embedded proxy-omgeving voor Gateway-services die shellwaarden `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Controles van Gateway-runtimebest practices (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale-tokenmodus (biedt tokengeneratie wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelverzoeken, openstaande rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en authenticatiedrift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - Controle van systemd-linger op Linux.
    - Controle van bestandsgrootte voor werkruimte-bootstrap (waarschuwingen voor truncatie/bijna-limiet voor contextbestanden).
    - Statuscontrole en automatische installatie/upgrade van shellaanvulling.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallatie (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Control UI Dreams-scène bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de grounded dreaming-workflow. Deze acties gebruiken doctor-achtige RPC-methoden van de Gateway, maar ze maken **geen** deel uit van de reparatie/migratie van de `openclaw doctor` CLI.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de grounded REM-dagboekpassage uit en schrijft omkeerbare backfill-items naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekitems uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gestagede grounded-only kortetermijnitems die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze zelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze stagen grounded kandidaten niet automatisch in de live kortetermijnpromotiestore, tenzij je eerst expliciet het gestagede CLI-pad uitvoert

Als je wilt dat grounded historische replay invloed heeft op de normale diepe promotielane, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat staget grounded duurzame kandidaten in de kortetermijn-dreaming-store, terwijl `DREAMS.md` het reviewoppervlak blijft.

## Gedetailleerd gedrag en onderbouwing

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om te updaten (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor deze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-configuratie is `talk.provider` + `talk.providers.<provider>`. Doctor herschrijft oude vormen `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de provider-map.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en het toolbeleid
    wildcard- of Plugin-eigen toolitems gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve Plugin-
    allowlist niet.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere commando's uit te voeren en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert doctor-migraties ook automatisch uit bij het opstarten wanneer een verouderd configuratieformaat wordt gedetecteerd, zodat verouderde configuraties zonder handmatige tussenkomst worden gerepareerd. Migraties van Cron-taakstores worden afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → bovenste-niveau `bindings`
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
    - Verplaats voor kanalen met benoemde `accounts` maar achtergebleven kanaalwaarden op bovenste niveau voor één account die accountspecifieke waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/standaarddoel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor time-outs van trage providers/modellen
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (legacy relay-instelling voor extensies)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-startup slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde in plaats van fail-closed te stoppen)

    Doctor-waarschuwingen bevatten ook account-standaardadvies voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-items zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en toont het geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen naar de verkeerde API worden gedwongen of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfiguratie nog naar het verwijderde Chrome-extensiepad verwijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-attachmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan externe debugging in de inspectiepagina van de browser in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een op Chromium gebaseerde browser 144+ op de gateway-/node-host
    - de browser draait lokaal
    - externe debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor attach in de browser

    Gereedheid gaat hier alleen over lokale attach-vereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle geldt **niet** voor Docker-, sandbox-, remote-browser- of andere headless-flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, onderzoekt doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), toont doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` draait de test zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder legacy OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxy's en overschrijvingen met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex Plugin-routewaarschuwingen">
    Wanneer de gebundelde Codex Plugin is ingeschakeld, controleert doctor ook of primaire modelverwijzingen voor `openai-codex/*` nog steeds via de standaard PI-runner worden opgelost. Die combinatie is geldig wanneer je Codex OAuth-/abonnementsauthenticatie via PI wilt, maar is gemakkelijk te verwarren met de native Codex app-server-harness. Doctor waarschuwt en verwijst naar de expliciete app-servervorm: `openai/*` plus `agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repareert dit niet automatisch omdat beide routes geldig zijn:

    - `openai-codex/*` + PI betekent "gebruik Codex OAuth-/abonnementsauthenticatie via de normale OpenClaw-runner."
    - `openai/*` + `agentRuntime.id: "codex"` betekent "voer de ingesloten beurt uit via native Codex app-server."
    - `/codex ...` betekent "beheer of bind een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

    Als de waarschuwing verschijnt, kies dan de route die je bedoelde en bewerk de configuratie handmatig. Laat de waarschuwing ongewijzigd wanneer PI Codex OAuth bewust is gekozen.

  </Accordion>
  <Accordion title="3. Legacy statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf migreren naar de huidige structuur:

    - Sessiesopslag + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authenticatiestatus (Baileys):
      - van legacy `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaard account-id: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het legacy mappen als back-ups laat staan. De Gateway/CLI migreert de legacy sessies + agentmap ook automatisch bij het opstarten, zodat geschiedenis/authenticatie/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. WhatsApp-authenticatie wordt bewust alleen gemigreerd via `openclaw doctor`. Normalisatie van talk-provider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen door sleutelvolgorde ontstaan geen herhaalde no-op-wijzigingen door `doctor --fix` meer activeren.

  </Accordion>
  <Accordion title="3a. Legacy Plugin-manifestmigraties">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde capability-sleutels op bovenste niveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt het aan ze naar het `contracts`-object te verplaatsen en het manifestbestand ter plekke te herschrijven. Deze migratie is idempotent; als de `contracts`-sleutel al dezelfde waarden heeft, wordt de legacy sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Legacy Cron-opslagmigraties">
    Doctor controleert ook de Cron-taakopslag (`~/.openclaw/cron/jobs.json` standaard, of `cron.store` wanneer overschreven) op oude taakvormen die de planner nog steeds accepteert voor compatibiliteit.

    Huidige Cron-opruimingen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op bovenste niveau (`message`, `model`, `thinking`, ...) → `payload`
    - afleveringsvelden op bovenste niveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider` afleveringsaliassen → expliciete `delivery.channel`
    - eenvoudige legacy `notify: true` webhook-fallbacktaken → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder gedrag te wijzigen. Als een taak legacy notify-fallback combineert met een bestaande niet-webhook-afleveringsmodus, waarschuwt doctor en laat het die taak staan voor handmatige beoordeling.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan valse `Gateway inactive`-berichten schrijven naar `~/.openclaw/logs/whatsapp-health.log` wanneer Cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor huidige gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Sessievergrendelingen opschonen">
    Doctor scant elke agentsessiemap op verouderde write-lock-bestanden — bestanden die zijn achtergebleven toen een sessie abnormaal werd afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert het verouderde vergrendelingsbestanden automatisch; anders drukt het een opmerking af en geeft het de instructie om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Herstel van transcriptvertakking van sessies">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde vertakkingsvorm die is gemaakt door de prompttranscript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling die dezelfde zichtbare gebruikersprompt bevat. In `--fix`- / `--repair`-modus maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve vertakking, zodat gatewaygeschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routing en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, inloggegevens, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Machtigingen van statusmap**: verifieert schrijfbaarheid; biedt aan machtigingen te herstellen (en geeft een `chown`-hint wanneer een mismatch tussen eigenaar/groep wordt gedetecteerd).
    - **Door macOS-cloud gesynchroniseerde statusmap**: waarschuwt wanneer de status wordt opgelost onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat synchronisatiepaden tragere I/O en vergrendelings-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer de status wordt opgelost naar een `mmcblk*`-mountbron, omdat door SD of eMMC ondersteunde willekeurige I/O trager kan zijn en sneller kan slijten bij sessie- en inloggegevenswrites.
    - **Sessiemappen ontbreken**: `sessions/` en de sessiestoremap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te vermijden.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regel JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis wordt niet opgebouwd).
    - **Meerdere statusmappen**: waarschuwt wanneer er meerdere `~/.openclaw`-mappen bestaan in homemappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan tussen installaties worden gesplitst).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan om het op de externe host uit te voeren (de status bevindt zich daar).
    - **Machtigingen van configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de auth-store, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, suggereert het een Anthropic API-sleutel of het Anthropic setup-tokenpad. Vernieuwingsprompts verschijnen alleen bij interactief uitvoeren (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die aangeeft dat je opnieuw moet inloggen), meldt doctor dat opnieuw authenticeren vereist is en drukt het de exacte opdracht `openclaw models auth login --provider ...` af om uit te voeren.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn vanwege:

    - korte afkoelperioden (rate limits/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturatie-/kredietfouten)

  </Accordion>
  <Accordion title="6. Modelvalidatie voor hooks">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Sandbox-image herstellen">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om legacy-namen te bouwen of ernaar over te schakelen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Plugin-installatie opschonen">
    Doctor verwijdert legacy door OpenClaw gegenereerde stagingstatus voor pluginafhankelijkheden in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Dit dekt verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen en pakketlokale resten van eerdere reparatiecode voor afhankelijkheden van gebundelde plugins.

    Doctor kan ook geconfigureerde downloadbare plugins opnieuw installeren wanneer de configuratie ernaar verwijst maar het lokale pluginregister ze niet kan vinden. Gateway-opstart en configuratieherlaadacties voeren geen package managers uit; plugininstallaties blijven expliciet doctor-/install-/updatewerk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opschoonhints">
    Doctor detecteert legacy gatewayservices (launchd/systemd/schtasks) en biedt aan ze te verwijderen en de OpenClaw-service te installeren met de huidige gatewaypoort. Het kan ook scannen op extra gatewayachtige services en opschoonhints afdrukken. OpenClaw-gatewayservices met profielnaam worden als eersteklas beschouwd en niet als "extra" gemarkeerd.

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de gatewayservice op gebruikersniveau ontbreekt maar er een OpenClaw-gatewayservice op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systemsupervisor de gatewaylevenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een lopende of uitvoerbare legacy-statusmigratie heeft, maakt doctor (in `--fix`- / `--repair`-modus) een pre-migratiesnapshot en voert het daarna de best-effort migratiestappen uit: legacy Matrix-statusmigratie en voorbereiding van legacy versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu de status van apparaatkoppelingen als onderdeel van de normale gezondheidscontrole.

    Wat het rapporteert:

    - openstaande eerste koppelingsverzoeken
    - openstaande rolupgrades voor al gekoppelde apparaten
    - openstaande scope-upgrades voor al gekoppelde apparaten
    - herstel van public-key-mismatches waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet meer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline zijn gedrift
    - lokaal gecachete device-token-vermeldingen voor de huidige machine die dateren van vóór een tokenrotatie aan gatewayzijde of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. In plaats daarvan drukt het de exacte volgende stappen af:

    - inspecteer openstaande verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een vers token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderd record en keur opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van openstaande rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid gevaarlijk is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het draait als systemd-gebruikersservice, zorgt doctor ervoor dat lingering is ingeschakeld zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en legacy-mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt geschikte Skills, Skills met ontbrekende vereisten en door allowlist geblokkeerde Skills.
    - **Legacy-werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere legacy-werkruimtemappen naast de huidige werkruimte bestaan.
    - **Pluginstatus**: telt ingeschakelde/uitgeschakelde/foutieve plugins; vermeldt plugin-id's voor fouten; rapporteert bundelplugincapabilities.
    - **Plugincompatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugindiagnostiek**: toont eventuele waarschuwingen of fouten tijdens laden die door het pluginregister zijn afgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of werkruimte-bootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, afkappingspercentage, afkappingsoorzaak (`max/file` of `max/total`) en totaal aantal geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Verouderde kanaalplugin opschonen">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de hangende kanaalscopeconfiguratie die naar die plugin verwees: `channels.<id>`-vermeldingen, heartbeatdoelen die het kanaal noemden, en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime verdwenen is maar de configuratie de gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shell-aanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), upgradet doctor dit naar de snellere variant met gecachet bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-auth-controles (lokaal token)">
    Doctor controleert of lokale gateway-tokenauthenticatie gereed is.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met plaintext.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde inloggegevens inspecteren zonder het fail-fast gedrag van de runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamilieopdrachten voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botinloggegevens te gebruiken wanneer beschikbaar.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, rapporteert doctor dat de inloggegevens geconfigureerd-maar-niet-beschikbaar zijn en slaat het automatische oplossing over in plaats van te crashen of het token ten onrechte als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de Gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekopdrachten gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt hersteladvies weergegeven, inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als dit ontbreekt, wordt voorgesteld om over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): controleert of er een API-sleutel aanwezig is in de omgeving of auth-store. Geeft bruikbare hersteltips weer als deze ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van lokale modellen en probeert daarna elke externe provider in de volgorde voor automatische selectie.

    Wanneer een gecachet Gateway-proberesultaat beschikbaar is (de Gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de CLI-zichtbare configuratie en meldt eventuele verschillen. Doctor start standaard geen nieuwe embedding-ping; gebruik de deep memory-statusopdracht wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om te verifiëren of embeddings tijdens runtime gereed zijn.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de Gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit en reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardinstellingen (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer een afwijking wordt gevonden, beveelt doctor een update aan en kan het servicebestand/de taak worden herschreven naar de huidige standaardinstellingen.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaard reparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de Gateway-service. De servicegezondheid wordt nog steeds gerapporteerd en niet-service-reparaties worden uitgevoerd, maar service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschonen van legacy-services worden overgeslagen omdat een externe supervisor eigenaar is van die levenscyclus.
    - Op Linux herschrijft doctor geen opdracht-/entrypoint-metadata terwijl de overeenkomende systemd-Gateway-unit actief is. Doctor negeert ook inactieve, niet-legacy extra Gateway-achtige units tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoningsruis veroorzaken.
    - Als token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor service-installatie/-reparatie de SecretRef maar slaat geen opgeloste plattetekst-tokenwaarden op in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`-/SecretRef-gebaseerde service-omgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingebed en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer de serviceopdracht nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, blokkeert doctor het installatie-/reparatiepad met bruikbaar advies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units nemen doctor-tokenafwijkingscontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen mee bij het vergelijken van service-auth-metadata.
    - Doctor-servicereparaties weigeren een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime en poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Doctor controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (Gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service op Bun draait of op een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en paden van versiebeheerders kunnen na upgrades breken omdat de service je shell-initialisatie niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat Volta-, asdf-, fnm-, pnpm- en andere versiebeheerdersmappen niet wijzigen welke Node-childprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar gegiste fallbackmappen van versiebeheerders worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven en wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up en geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dit ontbreekt en geeft een back-uptip weer als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids voor werkruimtestructuur en git-back-up (aanbevolen: privé-GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
