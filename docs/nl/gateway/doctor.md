---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Incompatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en reparatiestappen'
title: Doctor
x-i18n:
    generated_at: "2026-05-03T11:09:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
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

    Accepteer standaardwaarden zonder prompts (inclusief herstart-, service- en sandboxreparatiestappen wanneer van toepassing).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Pas aanbevolen reparaties toe zonder prompts (reparaties en herstarts waar dat veilig is).

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

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie en verplaatsingen van status op schijf). Slaat herstart-, service- en sandboxacties over die menselijke bevestiging vereisen. Migraties van verouderde status worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scan systeemservices op extra gateway-installaties (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Als je wijzigingen wilt beoordelen voordat ze worden weggeschreven, open dan eerst het configuratiebestand:

```bash
cat ~/.openclaw/openclaw.json
```

## Wat het doet (samenvatting)

<AccordionGroup>
  <Accordion title="Gezondheid, UI en updates">
    - Optionele pre-flight-update voor git-installaties (alleen interactief).
    - Controle van UI-protocolactualiteit (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole en prompt om opnieuw te starten.
    - Statusoverzicht van Skills (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Migratie van Talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en Chrome MCP-gereedheid.
    - Waarschuwingen voor OpenCode-provideroverschrijvingen (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin-/tool-allowlists wanneer `plugins.allow` beperkend is maar het toolbeleid nog steeds om wildcard- of Plugin-eigen tools vraagt.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-authenticatie).
    - Migratie van verouderde Plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde cron-opslag (`jobId`, `schedule.cron`, velden voor levering/payload op topniveau, payload `provider`, eenvoudige `notify: true` webhook-fallbacktaken).
    - Migratie van verouderd agent-runtimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opruimen van verouderde Plugin-configuratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opruimen van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor dubbele prompt-rewrite-branches die zijn aangemaakt door getroffen 2026.4.24-builds.
    - Detectie van tombstones voor herstart-herstel van vastgelopen subagents, met `--fix`-ondersteuning voor het wissen van verouderde afgebroken herstelvlaggen zodat startup het kind niet als herstart-afgebroken blijft behandelen.
    - Controles van statusintegriteit en machtigingen (sessies, transcripten, statusmap).
    - Controles van configuratiebestandsmachtigingen (chmod 600) wanneer lokaal uitgevoerd.
    - Gezondheid van modelauthenticatie: controleert OAuth-verval, kan bijna vervallen tokens vernieuwen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Reparatie van sandbox-image wanneer sandboxing is ingeschakeld.
    - Migratie van verouderde services en detectie van extra gateways.
    - Migratie van verouderde Matrix-kanaalstatus (in `--fix`- / `--repair`-modus).
    - Runtimecontroles van Gateway (service geïnstalleerd maar niet actief; launchd-label in cache).
    - Waarschuwingen over kanaalstatus (gepeild vanaf de actieve gateway).
    - Audit van supervisorconfiguratie (launchd/systemd/schtasks) met optionele reparatie.
    - Opschonen van embedded proxy-omgeving voor Gateway-services die shellwaarden voor `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd tijdens installatie of update.
    - Controles van best practices voor Gateway-runtime (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale tokenmodus (biedt tokengeneratie aan wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (wachtende eerste koppelingsverzoeken, wachtende rol-/scope-upgrades, verouderde drift in lokale apparaat-token-cache en authenticatiedrift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - Controle van systemd-linger op Linux.
    - Controle van bestandsgrootte van werkruimte-bootstrap (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Gereedheidscontrole van Skills voor de standaardagent; rapporteert toegestane Skills met ontbrekende bins, env, configuratie of OS-vereisten, en `--fix` kan niet-beschikbare Skills uitschakelen in `skills.entries`.
    - Statuscontrole en automatische installatie/upgrade van shell completion.
    - Gereedheidscontrole van embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles van broninstallatie (pnpm-werkruimtemismatch, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie en wizardmetadata weg.

  </Accordion>
</AccordionGroup>

## Dreams UI-backfill en reset

De Dreams-scène van Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de grounded dreaming-workflow. Deze acties gebruiken RPC-methoden in Gateway doctor-stijl, maar ze maken **geen** deel uit van reparatie/migratie via de `openclaw doctor` CLI.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de grounded REM-dagboekpass uit en schrijft omkeerbare backfill-items naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekitems uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen gefaseerde grounded-only kortetermijnitems die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze zelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze faseren grounded candidates niet automatisch in de live kortetermijn-promotieopslag, tenzij je eerst expliciet het gefaseerde CLI-pad uitvoert

Als je wilt dat grounded historische replay de normale deep-promotion-lane beïnvloedt, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat faseert grounded duurzame candidates in de kortetermijn-Dreaming-opslag, terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om bij te werken (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie verouderde waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor deze naar het huidige schema.

    Dat omvat verouderde platte Talk-velden. De huidige openbare Talk-configuratie is `talk.provider` + `talk.providers.<provider>`. Doctor herschrijft oude vormen `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de providermap.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en toolbeleid
    wildcard- of Plugin-eigen toolitems gebruikt. `tools.allow: ["*"]` matcht alleen tools
    van plugins die daadwerkelijk laden; het omzeilt de exclusieve Plugin-
    allowlist niet.

  </Accordion>
  <Accordion title="2. Migraties van verouderde configuratiesleutels">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten uit te voeren en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke verouderde sleutels zijn gevonden.
    - De migratie tonen die is toegepast.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    De Gateway voert ook automatisch doctor-migraties uit bij het opstarten wanneer een verouderd configuratieformaat wordt gedetecteerd, zodat verouderde configuraties zonder handmatige tussenkomst worden gerepareerd. Migraties van Cron-taakopslag worden afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - geconfigureerde kanaalconfiguraties zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → top-level `bindings`
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
    - Voor kanalen met benoemde `accounts` maar resterende single-accountwaarden op topniveau voor het kanaal: verplaats die accountgebonden waarden naar het gepromoveerde account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/default doel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor trage provider-/model-time-outs
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde extension-relayinstelling)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway-start slaat ook providers over waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde, in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook account-default-begeleiding voor multi-accountkanalen:

    - Als twee of meer `channels.<channel>.accounts`-vermeldingen zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en vermeldt hij de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen naar de verkeerde API worden geforceerd of kunnen kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en gereedheid voor Chrome MCP">
    Als je browserconfiguratie nog naar het verwijderde Chrome-extensionpad verwijst, normaliseert doctor dit naar het huidige host-lokale Chrome MCP-attachmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-lokale Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor default auto-connect-profielen
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer deze lager is dan Chrome 144
    - herinnert je eraan remote debugging in te schakelen op de inspectiepagina van de browser (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-lokale Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway-/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste attach-toestemmingsprompt in de browser

    Gereedheid gaat hier alleen over lokale attach-vereisten. Existing-session behoudt de huidige routelimieten van Chrome MCP; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, test doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de test mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), toont doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de test uitgevoerd, zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen hebt toegevoegd onder `models.providers.openai-codex`, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer hij die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag terugkrijgt. Aangepaste proxy's en alleen-headeroverschrijvingen worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex Plugin-routewaarschuwingen">
    Wanneer de gebundelde Codex Plugin is ingeschakeld, controleert doctor ook of primaire modelrefs van `openai-codex/*` nog steeds via de default PI-runner worden opgelost. Die combinatie is geldig wanneer je Codex OAuth-/abonnementsauthenticatie via PI wilt, maar is gemakkelijk te verwarren met de native Codex app-server-harness. Doctor waarschuwt en verwijst naar de expliciete app-server-vorm: `openai/*` plus `agentRuntime.id: "codex"` of `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor repareert dit niet automatisch omdat beide routes geldig zijn:

    - `openai-codex/*` + PI betekent "gebruik Codex OAuth-/abonnementsauthenticatie via de normale OpenClaw-runner."
    - `openai/*` + `agentRuntime.id: "codex"` betekent "voer de ingebedde beurt uit via native Codex app-server."
    - `/codex ...` betekent "beheer of bind een native Codex-gesprek vanuit chat."
    - `/acp ...` of `runtime: "acp"` betekent "gebruik de externe ACP/acpx-adapter."

    Als de waarschuwing verschijnt, kies je de bedoelde route en bewerk je de configuratie handmatig. Laat de waarschuwing ongewijzigd wanneer PI Codex OAuth de bedoeling is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere on-disk indelingen migreren naar de huidige structuur:

    - Sessiesopslag + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authenticatiestatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (default account-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer hij verouderde mappen als back-up achterlaat. De Gateway/CLI migreert de verouderde sessies + agentmap ook automatisch bij het opstarten, zodat geschiedenis/authenticatie/modellen in het per-agentpad terechtkomen zonder handmatige doctor-run. WhatsApp-authenticatie wordt bewust alleen via `openclaw doctor` gemigreerd. Normalisatie van talk-provider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen uit sleutelvolgorde bestaan niet langer herhaaldelijk no-op `doctor --fix`-wijzigingen activeren.

  </Accordion>
  <Accordion title="3a. Verouderde Plugin-manifestmigraties">
    Doctor scant alle geïnstalleerde Plugin-manifesten op verouderde capability-sleutels op topniveau (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer ze worden gevonden, biedt hij aan ze naar het `contracts`-object te verplaatsen en het manifestbestand in-place te herschrijven. Deze migratie is idempotent; als de `contracts`-sleutel al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de data te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde Cron-opslagmigraties">
    Doctor controleert ook de cron-jobopslag (`~/.openclaw/cron/jobs.json` standaard, of `cron.store` wanneer overschreven) op oude jobvormen die de scheduler nog steeds accepteert voor compatibiliteit.

    Huidige cron-opruimingen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - payloadvelden op topniveau (`message`, `model`, `thinking`, ...) → `payload`
    - leveringsvelden op topniveau (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-leveringsaliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true` webhook-fallbackjobs → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-jobs alleen automatisch wanneer dat kan zonder gedrag te wijzigen. Als een job verouderde notify-fallback combineert met een bestaande niet-webhook-leveringsmodus, waarschuwt doctor en laat hij die job staan voor handmatige review.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan valse `Gateway inactive`-berichten schrijven naar `~/.openclaw/logs/whatsapp-health.log` wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontabvermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor huidige gezondheidscontroles.

  </Accordion>
  <Accordion title="3c. Opschoning van sessievergrendelingen">
    Doctor scant elke sessiemap van agents op verouderde schrijfvergrendelingsbestanden — bestanden die achterbleven toen een sessie abnormaal werd afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, de PID, of de PID nog actief is, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert het verouderde vergrendelingsbestanden automatisch; anders drukt het een opmerking af en instrueert het je om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Herstel van transcript-branches voor sessies">
    Doctor scant JSONL-bestanden van agentsessies op de gedupliceerde branch-vorm die is gemaakt door de prompttranscript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het het transcript naar de actieve branch, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van status (sessiepersistentie, routering en veiligheid)">
    De statusmap is de operationele hersenstam. Als die verdwijnt, verlies je sessies, referenties, logs en config (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **Statusmap ontbreekt**: waarschuwt voor catastrofaal statusverlies, vraagt om de map opnieuw te maken en herinnert je eraan dat ontbrekende gegevens niet kunnen worden hersteld.
    - **Rechten van statusmap**: verifieert schrijfbaarheid; biedt aan om rechten te herstellen (en geeft een `chown`-hint wanneer een eigenaar-/groepmismatch wordt gedetecteerd).
    - **macOS-cloudgesynchroniseerde statusmap**: waarschuwt wanneer status wordt opgelost onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...`, omdat door synchronisatie ondersteunde paden tragere I/O en vergrendelings-/synchronisatieraces kunnen veroorzaken.
    - **Linux SD- of eMMC-statusmap**: waarschuwt wanneer status wordt opgelost naar een `mmcblk*`-mountbron, omdat door SD of eMMC ondersteunde willekeurige I/O langzamer kan zijn en sneller kan slijten bij sessie- en referentieschrijfbewerkingen.
    - **Sessiemappen ontbreken**: `sessions/` en de sessieopslagmap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te voorkomen.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessie-items ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-regelige JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis stapelt zich niet op).
    - **Meerdere statusmappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in verschillende home-directories of wanneer `OPENCLAW_STATE_DIR` ergens anders naar verwijst (geschiedenis kan over installaties worden verdeeld).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan het op de externe host uit te voeren (de status bevindt zich daar).
    - **Rechten van configbestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Gezondheid van modelauthenticatie (OAuth-verloop)">
    Doctor inspecteert OAuth-profielen in de auth-opslag, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, suggereert het een Anthropic API-sleutel of het Anthropic setup-tokenpad. Vernieuwingsprompts verschijnen alleen bij interactief uitvoeren (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die je vraagt opnieuw in te loggen), rapporteert doctor dat opnieuw authenticeren vereist is en drukt het de exacte opdracht `openclaw models auth login --provider ...` af die je moet uitvoeren.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte afkoelperiodes (ratelimieten/time-outs/auth-fouten)
    - langere uitschakelingen (facturerings-/tegoedfouten)

  </Accordion>
  <Accordion title="6. Validatie van hooks-model">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie tegen de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Herstel van sandbox-image">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar legacy-namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Opschoning van Plugin-installatie">
    Doctor verwijdert legacy door OpenClaw gegenereerde stagingstatus voor Plugin-afhankelijkheden in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Dit dekt verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen en pakketlokale resten uit eerdere reparatiecode voor afhankelijkheden van gebundelde plugins.

    Doctor kan ook geconfigureerde downloadbare plugins opnieuw installeren wanneer de config ernaar verwijst maar het lokale pluginregister ze niet kan vinden. Voor de externalisatie van gebundelde plugins in 2026.5.2 installeert doctor automatisch downloadbare plugins die de bestaande config al gebruikt en vertrouwt het daarna op `meta.lastTouchedVersion` om die releasepass slechts één keer uit te voeren. Gateway-opstart en config-herladen voeren geen pakketmanagers uit; plugininstallaties blijven expliciet doctor-/install-/updatewerk.

  </Accordion>
  <Accordion title="8. Migraties en opschoonhints voor Gateway-service">
    Doctor detecteert legacy Gateway-services (launchd/systemd/schtasks) en biedt aan deze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opschoonhints afdrukken. Profielbenoemde OpenClaw Gateway-services worden als eersteklas beschouwd en worden niet als "extra" gemarkeerd.

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeem-supervisor de levenscyclus van de Gateway beheert.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een openstaande of uitvoerbare legacy-statusmigratie heeft, maakt doctor (in `--fix`- / `--repair`-modus) een pre-migratie-snapshot en voert het daarna de best-effort migratiestappen uit: legacy Matrix-statusmigratie en legacy voorbereiding van versleutelde status. Beide stappen zijn niet-fataal; fouten worden gelogd en het opstarten gaat door. In alleen-lezen-modus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu de status van apparaatkoppeling als onderdeel van de normale gezondheidspass.

    Wat het rapporteert:

    - openstaande eerste koppelingsverzoeken
    - openstaande rolupgrades voor al gekoppelde apparaten
    - openstaande scope-upgrades voor al gekoppelde apparaten
    - herstel van public-key-mismatches waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet meer overeenkomt met de goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline zijn gedrift
    - lokale gecachte device-token-items voor de huidige machine die ouder zijn dan een Gateway-side tokenrotatie of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte vervolgstappen af:

    - inspecteer openstaande verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een vers token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderd record en keur opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds koppeling vereist": doctor onderscheidt nu eerste koppeling van openstaande rol-/scope-upgrades en van verouderde token-/apparaatidentiteitsdrift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het draait als een systemd-gebruikersservice, zorgt doctor ervoor dat lingering is ingeschakeld zodat de Gateway na uitloggen actief blijft.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en legacy-mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt in aanmerking komende Skills, Skills met ontbrekende vereisten en door allowlist geblokkeerde Skills.
    - **Legacy-werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere legacy-werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/foutieve plugins; vermeldt plugin-ID's voor eventuele fouten; rapporteert mogelijkheden van gebundelde plugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele laadwaarschuwingen of -fouten die door het pluginregister worden uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of bootstrapbestanden van de werkruimte (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, truncatiepercentage, truncatieoorzaak (`max/file` of `max/total`) en totale geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden zijn afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Opschoning van verouderde kanaalplugin">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de loshangende kanaalgescopeerde config die naar die plugin verwees: `channels.<id>`-items, heartbeat-doelen die het kanaal noemden en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime weg is maar de config de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shell-aanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), werkt doctor dit bij naar de snellere variant met gecacht bestand.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig opnieuw te genereren.

  </Accordion>
  <Accordion title="12. Gateway-auth-controles (lokaal token)">
    Doctor controleert de gereedheid van lokale Gateway-tokenauth.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder runtime-fail-fastgedrag te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamilieopdrachten voor gerichte configreparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer beschikbaar.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, rapporteert doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat het automatische oplossing over in plaats van te crashen of het token ten onrechte als ontbrekend te rapporteren.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekopdrachten gereed is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: controleert of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt hersteladvies weergegeven, inclusief het npm-pakket en een optie voor een handmatig binarypad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende externe/downloadbare model-URL. Als die ontbreekt, wordt voorgesteld om over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): controleert of er een API-sleutel aanwezig is in de omgeving of auth-store. Geeft uitvoerbare hersteltips weer als die ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van het lokale model en probeert daarna elke externe provider in de volgorde voor automatische selectie.

    Wanneer een gecachet Gateway-proberesultaat beschikbaar is (de gateway was gezond op het moment van de controle), vergelijkt doctor dat resultaat met de voor de CLI zichtbare configuratie en vermeldt eventuele afwijkingen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik de opdracht voor diepe geheugenstatus wanneer u een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om de gereedheid van embeddings tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Waarschuwingen over kanaalstatus">
    Als de gateway gezond is, voert doctor een kanaalstatusprobe uit en rapporteert waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + herstel van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer er een mismatch wordt gevonden, beveelt doctor een update aan en kan het servicebestand/de taak worden herschreven naar de huidige standaardwaarden.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardherstelprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen toe zonder prompts.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de lifecycle van de Gateway-service. Het rapporteert nog steeds servicestatus en voert niet-serviceherstel uit, maar slaat service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschonen van legacy-services over omdat een externe supervisor die lifecycle beheert.
    - Op Linux herschrijft doctor geen opdracht-/entrypointmetadata terwijl de overeenkomende systemd Gateway-unit actief is. Het negeert ook inactieve niet-legacy extra gateway-achtige units tijdens de scan op dubbele services, zodat bijbehorende servicebestanden geen opschoonruis veroorzaken.
    - Als token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor bij service-installatie/herstel de SecretRef, maar blijven opgeloste platteteksttokenwaarden niet bewaard in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`-/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingesloten en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer de serviceopdracht nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, blokkeert doctor het installatie-/herstelpad met uitvoerbare begeleiding.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/herstel totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units nemen doctor-tokenafwijkingscontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen mee bij het vergelijken van service-auth-metadata.
    - Doctor-serviceherstel weigert een Gateway-service van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - U kunt altijd een volledige herschrijving forceren via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostiek voor Gateway-runtime + poort">
    Doctor inspecteert de serviceruntime (PID, laatste afsluitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Het controleert ook op poortconflicten op de Gateway-poort (standaard `18789`) en rapporteert waarschijnlijke oorzaken (gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de Gateway-service draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en paden van versiebeheerders kunnen na upgrades breken omdat de service uw shell-init niet laadt. Doctor biedt aan te migreren naar een systeeminstallatie van Node wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of herstelde macOS LaunchAgents gebruiken een canonieke systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van de interactieve shell-PATH te kopiëren, zodat Volta, asdf, fnm, pnpm en andere mappen van versiebeheerders niet wijzigen welke Node-childprocessen worden gevonden. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen van versiebeheerders worden alleen naar de service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een werkruimtegeheugensysteem voor wanneer dat ontbreekt en geeft een back-uptip weer als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige handleiding voor werkruimtestructuur en git-back-up (aanbevolen privé-GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
