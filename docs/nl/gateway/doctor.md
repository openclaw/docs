---
read_when:
    - Doctor-migraties toevoegen of wijzigen
    - Niet-compatibele configuratiewijzigingen introduceren
sidebarTitle: Doctor
summary: 'Doctor-commando: gezondheidscontroles, configuratiemigraties en herstelstappen'
title: Diagnose
x-i18n:
    generated_at: "2026-05-07T13:17:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
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

    Accepteer standaardwaarden zonder prompts (inclusief reparatiestappen voor herstart/service/sandbox wanneer van toepassing).

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

    Voer uit zonder prompts en pas alleen veilige migraties toe (configuratienormalisatie + verplaatsingen van status op schijf). Slaat herstart-/service-/sandboxacties over die menselijke bevestiging vereisen. Migraties van verouderde status worden automatisch uitgevoerd wanneer ze worden gedetecteerd.

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
    - Versheidscontrole van het UI-protocol (bouwt Control UI opnieuw wanneer het protocolschema nieuwer is).
    - Gezondheidscontrole + herstartprompt.
    - Statussamenvatting van Skills (geschikt/ontbrekend/geblokkeerd) en Plugin-status.

  </Accordion>
  <Accordion title="Configuratie en migraties">
    - Configuratienormalisatie voor verouderde waarden.
    - Migratie van talk-configuratie van verouderde platte `talk.*`-velden naar `talk.provider` + `talk.providers.<provider>`.
    - Browsermigratiecontroles voor verouderde Chrome-extensieconfiguraties en gereedheid voor Chrome MCP.
    - Waarschuwingen voor OpenCode-provideroverrides (`models.providers.opencode` / `models.providers.opencode-go`).
    - Waarschuwingen voor Codex OAuth-shadowing (`models.providers.openai-codex`).
    - Controle van OAuth TLS-vereisten voor OpenAI Codex OAuth-profielen.
    - Waarschuwingen voor Plugin/tool-allowlists wanneer `plugins.allow` beperkend is, maar het toolbeleid nog steeds om wildcard- of Plugin-eigen tools vraagt.
    - Migratie van verouderde status op schijf (sessies/agentmap/WhatsApp-authenticatie).
    - Migratie van verouderde Plugin-manifestcontractsleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migratie van verouderde Cron-store (`jobId`, `schedule.cron`, velden voor levering/payload op topniveau, payload `provider`, eenvoudige fallbacktaken voor `notify: true` Webhook).
    - Migratie van verouderd agent-runtimebeleid naar `agents.defaults.agentRuntime` en `agents.list[].agentRuntime`.
    - Opschoning van verouderde Plugin-configuratie wanneer plugins zijn ingeschakeld; wanneer `plugins.enabled=false`, worden verouderde Plugin-verwijzingen behandeld als inerte containmentconfiguratie en behouden.

  </Accordion>
  <Accordion title="Status en integriteit">
    - Inspectie van sessievergrendelingsbestanden en opschoning van verouderde vergrendelingen.
    - Reparatie van sessietranscripten voor dubbele prompt-herschrijftakken die zijn gemaakt door getroffen 2026.4.24-builds.
    - Detectie van tombstones voor herstart-herstel van vastgelopen subagents, met ondersteuning voor `--fix` om verouderde afgebroken herstelflags te wissen zodat het opstarten het kind niet blijft behandelen als door herstart afgebroken.
    - Controles op statusintegriteit en machtigingen (sessies, transcripten, statusmap).
    - Controles op machtigingen van configuratiebestanden (chmod 600) wanneer lokaal uitgevoerd.
    - Gezondheid van modelauthenticatie: controleert OAuth-verval, kan bijna verlopen tokens verversen en rapporteert cooldown-/uitgeschakelde statussen van auth-profielen.
    - Detectie van extra werkruimtemap (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services en supervisors">
    - Sandbox-imageherstel wanneer sandboxing is ingeschakeld.
    - Migratie van legacy-services en extra Gateway-detectie.
    - Migratie van legacy-status voor Matrix-kanalen (in `--fix`- / `--repair`-modus).
    - Gateway-runtimecontroles (service geinstalleerd maar niet actief; gecachet launchd-label).
    - Waarschuwingen voor kanaalstatus (gepeild vanuit de actieve Gateway).
    - Kanaalspecifieke toestemmingscontroles staan onder `openclaw channels capabilities`; Discord-spraakkanaaltoestemmingen worden bijvoorbeeld geaudit met `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - WhatsApp-responsiviteitscontroles voor verslechterde gezondheid van de Gateway-eventloop terwijl lokale TUI-clients nog actief zijn; `--fix` stopt alleen geverifieerde lokale TUI-clients.
    - Codex-routeherstel voor legacy `openai-codex/*`-modelrefs in primaire modellen, fallbacks, Heartbeat/subagent/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en sessieroutepins; `--fix` herschrijft ze naar `openai/*` en selecteert `agentRuntime.id: "codex"` alleen wanneer de Codex-plugin is geinstalleerd, ingeschakeld, het `codex`-harnas bijdraagt en bruikbare OAuth heeft. Anders selecteert het `agentRuntime.id: "pi"`.
    - Supervisor-configuratieaudit (launchd/systemd/schtasks) met optioneel herstel.
    - Opschoning van de embedded-proxyomgeving voor Gateway-services die tijdens installatie of update shellwaarden voor `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` hebben vastgelegd.
    - Best-practicecontroles voor de Gateway-runtime (Node versus Bun, paden van versiebeheerders).
    - Diagnostiek voor Gateway-poortconflicten (standaard `18789`).

  </Accordion>
  <Accordion title="Authenticatie, beveiliging en koppeling">
    - Beveiligingswaarschuwingen voor open DM-beleid.
    - Gateway-authenticatiecontroles voor lokale tokenmodus (biedt tokengeneratie wanneer er geen tokenbron bestaat; overschrijft geen token-SecretRef-configuraties).
    - Detectie van problemen met apparaatkoppeling (openstaande eerste koppelverzoeken, openstaande rol-/scope-upgrades, verlopen drift in de lokale apparaat-token-cache en authenticatiedrift in gekoppelde records).

  </Accordion>
  <Accordion title="Werkruimte en shell">
    - systemd-lingercontrole op Linux.
    - Controle van bestandsgrootte voor werkruimte-bootstrapbestanden (waarschuwingen voor afkapping/bijna-limiet voor contextbestanden).
    - Gereedheidscontrole voor Skills voor de standaardagent; rapporteert toegestane Skills met ontbrekende binaries, omgevingsvariabelen, configuratie of OS-vereisten, en `--fix` kan niet-beschikbare Skills uitschakelen in `skills.entries`.
    - Statuscontrole en automatische installatie/upgrade van shellaanvulling.
    - Gereedheidscontrole voor embeddingprovider voor geheugenzoekopdrachten (lokaal model, externe API-sleutel of QMD-binary).
    - Controles voor broninstallaties (pnpm-werkruimte komt niet overeen, ontbrekende UI-assets, ontbrekende tsx-binary).
    - Schrijft bijgewerkte configuratie + wizardmetadata.

  </Accordion>
</AccordionGroup>

## Dreams-UI-backfill en reset

De Dreams-scene in de Control UI bevat acties **Backfill**, **Reset** en **Clear Grounded** voor de grounded dreaming-workflow. Deze acties gebruiken Gateway doctor-achtige RPC-methoden, maar maken **geen** deel uit van `openclaw doctor` CLI-herstel/migratie.

Wat ze doen:

- **Backfill** scant historische `memory/YYYY-MM-DD.md`-bestanden in de actieve werkruimte, voert de grounded REM-dagboekpass uit en schrijft omkeerbare backfill-items naar `DREAMS.md`.
- **Reset** verwijdert alleen die gemarkeerde backfill-dagboekitems uit `DREAMS.md`.
- **Clear Grounded** verwijdert alleen voorbereide grounded-only kortetermijnitems die uit historische replay kwamen en nog geen live recall of dagelijkse ondersteuning hebben opgebouwd.

Wat ze op zichzelf **niet** doen:

- ze bewerken `MEMORY.md` niet
- ze voeren geen volledige doctor-migraties uit
- ze bereiden niet automatisch grounded-kandidaten voor in de live kortetermijn-promotiestore, tenzij je eerst expliciet het voorbereide CLI-pad uitvoert

Als je wilt dat grounded historische replay de normale deep promotion-lane beinvloedt, gebruik dan in plaats daarvan de CLI-flow:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Dat bereidt grounded duurzame kandidaten voor in de kortetermijn-dreaming-store, terwijl `DREAMS.md` het beoordelingsoppervlak blijft.

## Gedetailleerd gedrag en rationale

<AccordionGroup>
  <Accordion title="0. Optionele update (git-installaties)">
    Als dit een git-checkout is en doctor interactief wordt uitgevoerd, biedt het aan om bij te werken (fetch/rebase/build) voordat doctor wordt uitgevoerd.
  </Accordion>
  <Accordion title="1. Configuratienormalisatie">
    Als de configuratie legacy-waardevormen bevat (bijvoorbeeld `messages.ackReaction` zonder kanaalspecifieke overschrijving), normaliseert doctor deze naar het huidige schema.

    Dat omvat legacy platte Talk-velden. De huidige openbare Talk-spraakconfiguratie is `talk.provider` + `talk.providers.<provider>`, en realtime spraakconfiguratie is `talk.realtime.*`. Doctor herschrijft oude vormen van `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` naar de provider-map, en herschrijft legacy realtime-selectors op topniveau (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) naar `talk.realtime`.

    Doctor waarschuwt ook wanneer `plugins.allow` niet leeg is en toolbeleid wildcard- of plugin-owned toolitems gebruikt. `tools.allow: ["*"]` matcht alleen tools van plugins die daadwerkelijk laden; het omzeilt de exclusieve plugin-allowlist niet. Doctor schrijft `plugins.bundledDiscovery: "compat"` voor gemigreerde legacy allowlist-configuraties om bestaand gedrag van gebundelde providers te behouden, en verwijst daarna naar de strengere instelling `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy-configuratiesleutelmigraties">
    Wanneer de configuratie verouderde sleutels bevat, weigeren andere opdrachten te draaien en vragen ze je om `openclaw doctor` uit te voeren.

    Doctor zal:

    - Uitleggen welke legacy-sleutels zijn gevonden.
    - De toegepaste migratie tonen.
    - `~/.openclaw/openclaw.json` herschrijven met het bijgewerkte schema.

    Gateway-opstart weigert legacy-configuratieformaten en vraagt je om `openclaw doctor --fix` uit te voeren; het herschrijft `openclaw.json` niet bij het opstarten. Migraties van Cron-jobstores worden ook afgehandeld door `openclaw doctor --fix`.

    Huidige migraties:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configuraties voor geconfigureerde kanalen zonder zichtbaar antwoordbeleid → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Voor kanalen met benoemde `accounts` maar achterblijvende kanaalwaarden op top-level voor één account, verplaats je die account-scoped waarden naar het gepromote account dat voor dat kanaal is gekozen (`accounts.default` voor de meeste kanalen; Matrix kan een bestaand overeenkomend benoemd/default-doel behouden)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - verwijder `agents.defaults.llm`; gebruik `models.providers.<id>.timeoutSeconds` voor trage provider-/model-time-outs
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - verwijder `browser.relayBindHost` (verouderde relay-instelling voor extensies)
    - verouderde `models.providers.*.api: "openai"` → `"openai-completions"` (bij het opstarten van de Gateway worden providers waarvan `api` is ingesteld op een toekomstige of onbekende enumwaarde ook overgeslagen in plaats van gesloten te falen)

    Doctor-waarschuwingen bevatten ook account-default-richtlijnen voor kanalen met meerdere accounts:

    - Als twee of meer `channels.<channel>.accounts`-items zijn geconfigureerd zonder `channels.<channel>.defaultAccount` of `accounts.default`, waarschuwt doctor dat fallback-routering een onverwacht account kan kiezen.
    - Als `channels.<channel>.defaultAccount` is ingesteld op een onbekende account-ID, waarschuwt doctor en toont het de geconfigureerde account-ID's.

  </Accordion>
  <Accordion title="2b. OpenCode-provideroverschrijvingen">
    Als je `models.providers.opencode`, `opencode-zen` of `opencode-go` handmatig hebt toegevoegd, overschrijft dit de ingebouwde OpenCode-catalogus van `@mariozechner/pi-ai`. Daardoor kunnen modellen naar de verkeerde API worden geforceerd of kosten op nul worden gezet. Doctor waarschuwt zodat je de overschrijving kunt verwijderen en API-routering + kosten per model kunt herstellen.
  </Accordion>
  <Accordion title="2c. Browsermigratie en Chrome MCP-gereedheid">
    Als je browserconfiguratie nog naar het verwijderde Chrome-extensiepad verwijst, normaliseert doctor die naar het huidige host-local Chrome MCP-koppelmodel:

    - `browser.profiles.*.driver: "extension"` wordt `"existing-session"`
    - `browser.relayBindHost` wordt verwijderd

    Doctor controleert ook het host-local Chrome MCP-pad wanneer je `defaultProfile: "user"` of een geconfigureerd `existing-session`-profiel gebruikt:

    - controleert of Google Chrome op dezelfde host is geïnstalleerd voor standaardprofielen met automatische verbinding
    - controleert de gedetecteerde Chrome-versie en waarschuwt wanneer die lager is dan Chrome 144
    - herinnert je eraan remote debugging in de browserinspectiepagina in te schakelen (bijvoorbeeld `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` of `edge://inspect/#remote-debugging`)

    Doctor kan de Chrome-instelling niet voor je inschakelen. Host-local Chrome MCP vereist nog steeds:

    - een Chromium-gebaseerde browser 144+ op de gateway-/node-host
    - de browser die lokaal draait
    - remote debugging ingeschakeld in die browser
    - goedkeuring van de eerste toestemmingsprompt voor koppelen in de browser

    Gereedheid hier gaat alleen over lokale koppelvereisten. Existing-session behoudt de huidige Chrome MCP-routelimieten; geavanceerde routes zoals `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of raw CDP-profiel.

    Deze controle is **niet** van toepassing op Docker-, sandbox-, remote-browser- of andere headless flows. Die blijven raw CDP gebruiken.

  </Accordion>
  <Accordion title="2d. OAuth TLS-vereisten">
    Wanneer een OpenAI Codex OAuth-profiel is geconfigureerd, peilt doctor het OpenAI-autorisatie-eindpunt om te verifiëren dat de lokale Node/OpenSSL TLS-stack de certificaatketen kan valideren. Als de probe mislukt met een certificaatfout (bijvoorbeeld `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, verlopen certificaat of zelfondertekend certificaat), print doctor platformspecifieke herstelrichtlijnen. Op macOS met een Homebrew Node is de oplossing meestal `brew postinstall ca-certificates`. Met `--deep` wordt de probe uitgevoerd, zelfs als de gateway gezond is.
  </Accordion>
  <Accordion title="2e. Codex OAuth-provideroverschrijvingen">
    Als je eerder verouderde OpenAI-transportinstellingen onder `models.providers.openai-codex` hebt toegevoegd, kunnen die het ingebouwde Codex OAuth-providerpad overschaduwen dat nieuwere releases automatisch gebruiken. Doctor waarschuwt wanneer het die oude transportinstellingen naast Codex OAuth ziet, zodat je de verouderde transportoverschrijving kunt verwijderen of herschrijven en het ingebouwde routerings-/fallbackgedrag kunt terugkrijgen. Aangepaste proxies en overschrijvingen met alleen headers worden nog steeds ondersteund en activeren deze waarschuwing niet.
  </Accordion>
  <Accordion title="2f. Codex-routereparatie">
    Doctor controleert op verouderde `openai-codex/*`-modelrefs. Native Codex-harnessroutering gebruikt canonieke `openai/*`-modelrefs; OpenAI-agentbeurten lopen via de Codex app-server-harness in plaats van via het OpenClaw PI OpenAI-pad.

    In de modus `--fix` / `--repair` herschrijft doctor betrokken refs voor standaardagents en per-agent refs, inclusief primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en verouderde persistente sessieroutestatus:

    - `openai-codex/gpt-*` wordt `openai/gpt-*`.
    - De overeenkomende agentruntime wordt alleen `agentRuntime.id: "codex"` wanneer Codex is geïnstalleerd, ingeschakeld, de `codex`-harness bijdraagt en bruikbare OAuth heeft.
    - Anders wordt de overeenkomende agentruntime `agentRuntime.id: "pi"`.
    - Bestaande lijsten met model-fallbacks blijven behouden met hun verouderde items herschreven; gekopieerde instellingen per model worden verplaatst van de verouderde sleutel naar de canonieke `openai/*`-sleutel.
    - Persistente sessie-`modelProvider`/`providerOverride`, `model`/`modelOverride`, fallbackmeldingen, auth-profielpinnen en Codex-harnesspinnen worden gerepareerd in alle gevonden agentsessie-stores.
    - `/codex ...` betekent "een native Codex-gesprek vanuit chat beheren of binden."
    - `/acp ...` of `runtime: "acp"` betekent "de externe ACP/acpx-adapter gebruiken."

  </Accordion>
  <Accordion title="2g. Sessieroute-opschoning">
    Doctor scant ook gevonden agentsessie-stores op verouderde automatisch aangemaakte routestatus nadat je geconfigureerde modellen of runtime hebt verplaatst weg van een route die eigendom is van een plugin, zoals Codex.

    `openclaw doctor --fix` kan automatisch aangemaakte verouderde status wissen, zoals `modelOverrideSource: "auto"`-modelpinnen, runtimemodelmetadata, vastgezette harness-ID's, CLI-sessiebindingen en automatische auth-profieloverschrijvingen wanneer hun eigenaarroute niet langer is geconfigureerd. Expliciete gebruikers- of verouderde sessiemodelkeuzes worden gerapporteerd voor handmatige beoordeling en blijven onaangeroerd; wissel ze met `/model ...`, `/new` of reset de sessie wanneer die route niet langer bedoeld is.

  </Accordion>
  <Accordion title="3. Verouderde statusmigraties (schijfindeling)">
    Doctor kan oudere indelingen op schijf migreren naar de huidige structuur:

    - Sessie-store + transcripties:
      - van `~/.openclaw/sessions/` naar `~/.openclaw/agents/<agentId>/sessions/`
    - Agentmap:
      - van `~/.openclaw/agent/` naar `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp-authstatus (Baileys):
      - van verouderde `~/.openclaw/credentials/*.json` (behalve `oauth.json`)
      - naar `~/.openclaw/credentials/whatsapp/<accountId>/...` (standaardaccount-ID: `default`)

    Deze migraties zijn best-effort en idempotent; doctor geeft waarschuwingen wanneer het verouderde mappen als back-ups achterlaat. De Gateway/CLI migreert de verouderde sessies + agentmap ook automatisch bij het opstarten, zodat geschiedenis/auth/modellen in het pad per agent terechtkomen zonder handmatige doctor-run. WhatsApp-auth wordt bewust alleen via `openclaw doctor` gemigreerd. Normalisatie van Talk-provider/provider-map vergelijkt nu op structurele gelijkheid, zodat verschillen die alleen uit sleutelvolgorde bestaan niet langer herhaalde no-op-wijzigingen door `doctor --fix` activeren.

  </Accordion>
  <Accordion title="3a. Verouderde pluginmanifestmigraties">
    Doctor scant alle geïnstalleerde pluginmanifesten op verouderde top-level capability-sleutels (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Wanneer die worden gevonden, biedt het aan ze naar het `contracts`-object te verplaatsen en het manifestbestand in-place te herschrijven. Deze migratie is idempotent; als de sleutel `contracts` al dezelfde waarden heeft, wordt de verouderde sleutel verwijderd zonder de gegevens te dupliceren.
  </Accordion>
  <Accordion title="3b. Verouderde cron-store-migraties">
    Doctor controleert ook de cron-job-store (standaard `~/.openclaw/cron/jobs.json`, of `cron.store` wanneer overschreven) op oude jobvormen die de scheduler nog steeds accepteert voor compatibiliteit.

    Huidige cron-opschoningen omvatten:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - top-level payloadvelden (`message`, `model`, `thinking`, ...) → `payload`
    - top-level delivery-velden (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload-`provider`-delivery-aliassen → expliciete `delivery.channel`
    - eenvoudige verouderde `notify: true` webhook-fallbackjobs → expliciete `delivery.mode="webhook"` met `delivery.to=cron.webhook`

    Doctor migreert `notify: true`-taken alleen automatisch wanneer dat kan zonder het gedrag te wijzigen. Als een taak legacy notify-fallback combineert met een bestaande niet-webhook-aflevermodus, geeft doctor een waarschuwing en laat die taak over voor handmatige beoordeling.

    Op Linux waarschuwt doctor ook wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` aanroept. Dat host-lokale script wordt niet onderhouden door de huidige OpenClaw en kan onterechte `Gateway inactive`-berichten naar `~/.openclaw/logs/whatsapp-health.log` schrijven wanneer cron de systemd-gebruikersbus niet kan bereiken. Verwijder de verouderde crontab-vermelding met `crontab -e`; gebruik `openclaw channels status --probe`, `openclaw doctor` en `openclaw gateway status` voor actuele healthchecks.

  </Accordion>
  <Accordion title="3c. Sessievergrendeling opschonen">
    Doctor scant elke agentsessiemap op verouderde write-lock-bestanden — bestanden die zijn achtergebleven toen een sessie abnormaal werd afgesloten. Voor elk gevonden vergrendelingsbestand rapporteert het: het pad, de PID, of de PID nog leeft, de leeftijd van de vergrendeling en of deze als verouderd wordt beschouwd (dode PID of ouder dan 30 minuten). In `--fix`- / `--repair`-modus verwijdert het verouderde vergrendelingsbestanden automatisch; anders drukt het een opmerking af en instrueert het je om opnieuw uit te voeren met `--fix`.
  </Accordion>
  <Accordion title="3d. Transcriptvertakking van sessie repareren">
    Doctor scant agentsessie-JSONL-bestanden op de gedupliceerde vertakkingsvorm die is ontstaan door de prompttranscript-herschrijffout van 2026.4.24: een verlaten gebruikersbeurt met interne runtimecontext van OpenClaw plus een actieve sibling met dezelfde zichtbare gebruikersprompt. In `--fix`- / `--repair`-modus maakt doctor naast het origineel een back-up van elk getroffen bestand en herschrijft het transcript naar de actieve vertakking, zodat Gateway-geschiedenis en geheugenlezers geen dubbele beurten meer zien.
  </Accordion>
  <Accordion title="4. Integriteitscontroles van state (sessiepersistentie, routering en veiligheid)">
    De state-map is de operationele hersenstam. Als die verdwijnt, verlies je sessies, referenties, logs en configuratie (tenzij je elders back-ups hebt).

    Doctor controleert:

    - **State-map ontbreekt**: waarschuwt voor catastrofaal state-verlies, vraagt om de map opnieuw te maken en herinnert je eraan dat het ontbrekende gegevens niet kan herstellen.
    - **Machtigingen voor state-map**: verifieert schrijfbaarheid; biedt aan om machtigingen te repareren (en geeft een `chown`-hint wanneer een mismatch in eigenaar/groep wordt gedetecteerd).
    - **macOS-cloudgesynchroniseerde state-map**: waarschuwt wanneer state onder iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) of `~/Library/CloudStorage/...` wordt gevonden, omdat sync-backed paden tragere I/O en lock-/sync-races kunnen veroorzaken.
    - **Linux SD- of eMMC-state-map**: waarschuwt wanneer state naar een `mmcblk*`-mountbron verwijst, omdat willekeurige I/O op SD of eMMC trager kan zijn en sneller kan slijten bij sessie- en referentieschrijfacties.
    - **Sessiemappen ontbreken**: `sessions/` en de sessiestoremap zijn vereist om geschiedenis te bewaren en `ENOENT`-crashes te vermijden.
    - **Transcriptmismatch**: waarschuwt wanneer recente sessievermeldingen ontbrekende transcriptbestanden hebben.
    - **Hoofdsessie "1-line JSONL"**: markeert wanneer het hoofdtranscript slechts één regel heeft (geschiedenis stapelt zich niet op).
    - **Meerdere state-mappen**: waarschuwt wanneer meerdere `~/.openclaw`-mappen bestaan in home-mappen of wanneer `OPENCLAW_STATE_DIR` ergens anders naar wijst (geschiedenis kan tussen installaties worden opgesplitst).
    - **Herinnering voor externe modus**: als `gateway.mode=remote`, herinnert doctor je eraan om het op de externe host uit te voeren (de state leeft daar).
    - **Machtigingen voor configuratiebestand**: waarschuwt als `~/.openclaw/openclaw.json` leesbaar is voor groep/wereld en biedt aan dit aan te scherpen naar `600`.

  </Accordion>
  <Accordion title="5. Modelauthenticatiegezondheid (OAuth-verval)">
    Doctor inspecteert OAuth-profielen in de auth-store, waarschuwt wanneer tokens bijna verlopen of verlopen zijn, en kan ze vernieuwen wanneer dat veilig is. Als het Anthropic OAuth-/tokenprofiel verouderd is, stelt het een Anthropic API-sleutel of het Anthropic setup-tokenpad voor. Vernieuwingsprompts verschijnen alleen wanneer interactief wordt uitgevoerd (TTY); `--non-interactive` slaat vernieuwingspogingen over.

    Wanneer een OAuth-vernieuwing permanent mislukt (bijvoorbeeld `refresh_token_reused`, `invalid_grant`, of een provider die zegt dat je opnieuw moet inloggen), rapporteert doctor dat herauthenticatie vereist is en drukt het de exacte opdracht `openclaw models auth login --provider ...` af om uit te voeren.

    Doctor rapporteert ook auth-profielen die tijdelijk onbruikbaar zijn door:

    - korte cooldowns (ratelimits/time-outs/authenticatiefouten)
    - langere uitschakelingen (facturatie-/tegoedfouten)

  </Accordion>
  <Accordion title="6. Modelvalidatie voor hooks">
    Als `hooks.gmail.model` is ingesteld, valideert doctor de modelreferentie aan de hand van de catalogus en allowlist en waarschuwt het wanneer deze niet kan worden opgelost of niet is toegestaan.
  </Accordion>
  <Accordion title="7. Sandboximage repareren">
    Wanneer sandboxing is ingeschakeld, controleert doctor Docker-images en biedt het aan om te bouwen of over te schakelen naar legacy namen als de huidige image ontbreekt.
  </Accordion>
  <Accordion title="7b. Plugin-installatie opschonen">
    Doctor verwijdert legacy door OpenClaw gegenereerde staging-state voor plugin-afhankelijkheden in `openclaw doctor --fix`- / `openclaw doctor --repair`-modus. Dit dekt verouderde gegenereerde afhankelijkheidsroots, oude install-stage-mappen, package-lokale resten van eerdere reparatiecode voor afhankelijkheden van gebundelde plugins, en verweesde of herstelde beheerde npm-kopieën van gebundelde `@openclaw/*`-plugins die het huidige gebundelde manifest kunnen overschaduwen.

    Doctor kan ook ontbrekende downloadbare plugins opnieuw installeren wanneer configuratie ernaar verwijst maar het lokale pluginregister ze niet kan vinden. Voorbeelden zijn materiële `plugins.entries`, geconfigureerde kanaal-/provider-/zoekinstellingen en geconfigureerde agent-runtimes. Tijdens package-updates vermijdt doctor het uitvoeren van pakketmanager-pluginreparatie terwijl het core-package wordt vervangen; voer na de update opnieuw `openclaw doctor --fix` uit als een geconfigureerde plugin nog steeds herstel nodig heeft. Gateway-startup en configuratieherlading voeren geen pakketmanagers uit; plugininstallaties blijven expliciet doctor-/install-/update-werk.

  </Accordion>
  <Accordion title="8. Gateway-servicemigraties en opschoonhints">
    Doctor detecteert legacy Gateway-services (launchd/systemd/schtasks) en biedt aan deze te verwijderen en de OpenClaw-service te installeren met de huidige Gateway-poort. Het kan ook scannen op extra Gateway-achtige services en opschoonhints afdrukken. Profielbenoemde OpenClaw Gateway-services worden als eersteklas beschouwd en worden niet gemarkeerd als "extra."

    Op Linux installeert doctor niet automatisch een tweede service op gebruikersniveau als de Gateway-service op gebruikersniveau ontbreekt maar er een OpenClaw Gateway-service op systeemniveau bestaat. Inspecteer met `openclaw gateway status --deep` of `openclaw doctor --deep`, verwijder daarna het duplicaat of stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een systeem-supervisor de Gateway-levenscyclus beheert.

  </Accordion>
  <Accordion title="8b. Startup Matrix-migratie">
    Wanneer een Matrix-kanaalaccount een wachtende of uitvoerbare legacy state-migratie heeft, maakt doctor (in `--fix`- / `--repair`-modus) een pre-migratiesnapshot en voert daarna de best-effort migratiestappen uit: legacy Matrix-state-migratie en voorbereiding van legacy versleutelde state. Beide stappen zijn niet-fataal; fouten worden gelogd en startup gaat door. In alleen-lezenmodus (`openclaw doctor` zonder `--fix`) wordt deze controle volledig overgeslagen.
  </Accordion>
  <Accordion title="8c. Apparaatkoppeling en auth-drift">
    Doctor inspecteert nu de status van apparaatkoppeling als onderdeel van de normale health-pass.

    Wat het rapporteert:

    - wachtende eerste koppelingsverzoeken
    - wachtende rolupgrades voor al gekoppelde apparaten
    - wachtende scope-upgrades voor al gekoppelde apparaten
    - public-key mismatch-reparaties waarbij de apparaat-id nog steeds overeenkomt maar de apparaatidentiteit niet langer overeenkomt met het goedgekeurde record
    - gekoppelde records zonder actief token voor een goedgekeurde rol
    - gekoppelde tokens waarvan de scopes buiten de goedgekeurde koppelingsbaseline zijn verschoven
    - lokaal gecachete device-token-vermeldingen voor de huidige machine die dateren van vóór een tokenrotatie aan Gateway-zijde of verouderde scopemetadata bevatten

    Doctor keurt koppelingsverzoeken niet automatisch goed en roteert apparaattokens niet automatisch. Het drukt in plaats daarvan de exacte volgende stappen af:

    - inspecteer wachtende verzoeken met `openclaw devices list`
    - keur het exacte verzoek goed met `openclaw devices approve <requestId>`
    - roteer een vers token met `openclaw devices rotate --device <deviceId> --role <role>`
    - verwijder een verouderd record en keur het opnieuw goed met `openclaw devices remove <deviceId>`

    Dit sluit het veelvoorkomende gat "al gekoppeld maar nog steeds pairing required": doctor onderscheidt nu eerste koppeling van wachtende rol-/scope-upgrades en van verouderde token-/apparaatidentiteit-drift.

  </Accordion>
  <Accordion title="9. Beveiligingswaarschuwingen">
    Doctor geeft waarschuwingen wanneer een provider openstaat voor DM's zonder allowlist, of wanneer een beleid op een gevaarlijke manier is geconfigureerd.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Als het als systemd-gebruikersservice draait, zorgt doctor ervoor dat lingering is ingeschakeld zodat de Gateway actief blijft na uitloggen.
  </Accordion>
  <Accordion title="11. Werkruimtestatus (Skills, plugins en legacy mappen)">
    Doctor drukt een samenvatting af van de werkruimtestatus voor de standaardagent:

    - **Skills-status**: telt geschikte, missing-requirements- en allowlist-geblokkeerde skills.
    - **Legacy werkruimtemappen**: waarschuwt wanneer `~/openclaw` of andere legacy werkruimtemappen naast de huidige werkruimte bestaan.
    - **Plugin-status**: telt ingeschakelde/uitgeschakelde/foutieve plugins; vermeldt plugin-ID's voor eventuele fouten; rapporteert capaciteiten van bundelplugins.
    - **Plugin-compatibiliteitswaarschuwingen**: markeert plugins die compatibiliteitsproblemen hebben met de huidige runtime.
    - **Plugin-diagnostiek**: toont eventuele laad-tijdwaarschuwingen of fouten die door het pluginregister zijn uitgegeven.

  </Accordion>
  <Accordion title="11b. Grootte van bootstrapbestand">
    Doctor controleert of werkruimte-bootstrapbestanden (bijvoorbeeld `AGENTS.md`, `CLAUDE.md` of andere geïnjecteerde contextbestanden) dicht bij of boven het geconfigureerde tekenbudget zitten. Het rapporteert per bestand ruwe versus geïnjecteerde tekentellingen, truncatiepercentage, truncatieoorzaak (`max/file` of `max/total`) en totale geïnjecteerde tekens als fractie van het totale budget. Wanneer bestanden worden afgekapt of dicht bij de limiet zitten, drukt doctor tips af voor het afstemmen van `agents.defaults.bootstrapMaxChars` en `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Verouderde kanaalplugin opschonen">
    Wanneer `openclaw doctor --fix` een ontbrekende kanaalplugin verwijdert, verwijdert het ook de bungelende kanaal-scoped configuratie die naar die plugin verwees: `channels.<id>`-vermeldingen, heartbeat-targets die het kanaal benoemden, en `agents.*.models["<channel>/*"]`-overrides. Dit voorkomt Gateway-opstartlussen waarbij de kanaalruntime weg is maar configuratie de Gateway nog steeds vraagt eraan te binden.
  </Accordion>
  <Accordion title="11c. Shellaanvulling">
    Doctor controleert of tabaanvulling is geïnstalleerd voor de huidige shell (zsh, bash, fish of PowerShell):

    - Als het shellprofiel een traag dynamisch aanvullingspatroon gebruikt (`source <(openclaw completion ...)`), upgradet doctor dit naar de snellere gecachete bestandsvariant.
    - Als aanvulling in het profiel is geconfigureerd maar het cachebestand ontbreekt, regenereert doctor de cache automatisch.
    - Als er helemaal geen aanvulling is geconfigureerd, vraagt doctor om deze te installeren (alleen interactieve modus; overgeslagen met `--non-interactive`).

    Voer `openclaw completion --write-state` uit om de cache handmatig te regenereren.

  </Accordion>
  <Accordion title="12. Gateway-auth-controles (lokaal token)">
    Doctor controleert de gereedheid van lokale Gateway-tokenauthenticatie.

    - Als tokenmodus een token nodig heeft en er geen tokenbron bestaat, biedt doctor aan er een te genereren.
    - Als `gateway.auth.token` door SecretRef wordt beheerd maar niet beschikbaar is, waarschuwt doctor en overschrijft het dit niet met platte tekst.
    - `openclaw doctor --generate-gateway-token` forceert generatie alleen wanneer er geen token-SecretRef is geconfigureerd.

  </Accordion>
  <Accordion title="12b. Alleen-lezen SecretRef-bewuste reparaties">
    Sommige reparatiestromen moeten geconfigureerde referenties inspecteren zonder het fail-fast-gedrag tijdens runtime te verzwakken.

    - `openclaw doctor --fix` gebruikt nu hetzelfde alleen-lezen SecretRef-samenvattingsmodel als statusfamiliecommando's voor gerichte configuratiereparaties.
    - Voorbeeld: Telegram `allowFrom` / `groupAllowFrom` `@username`-reparatie probeert geconfigureerde botreferenties te gebruiken wanneer die beschikbaar zijn.
    - Als het Telegram-bottoken via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, meldt doctor dat de referentie geconfigureerd-maar-niet-beschikbaar is en slaat automatische oplossing over in plaats van te crashen of het token onterecht als ontbrekend te melden.

  </Accordion>
  <Accordion title="13. Gateway-gezondheidscontrole + herstart">
    Doctor voert een gezondheidscontrole uit en biedt aan de gateway opnieuw te starten wanneer die ongezond lijkt.
  </Accordion>
  <Accordion title="13b. Gereedheid van geheugenzoekfunctie">
    Doctor controleert of de geconfigureerde embeddingprovider voor geheugenzoekopdrachten klaar is voor de standaardagent. Het gedrag hangt af van de geconfigureerde backend en provider:

    - **QMD-backend**: peilt of de `qmd`-binary beschikbaar en startbaar is. Zo niet, dan wordt hersteladvies weergegeven, inclusief het npm-pakket en een optie voor een handmatig binary-pad.
    - **Expliciete lokale provider**: controleert op een lokaal modelbestand of een herkende URL voor een extern/downloadbaar model. Als die ontbreekt, wordt voorgesteld om over te schakelen naar een externe provider.
    - **Expliciete externe provider** (`openai`, `voyage`, enz.): controleert of er een API-sleutel aanwezig is in de omgeving of auth-opslag. Toont uitvoerbare herstelhints als die ontbreekt.
    - **Automatische provider**: controleert eerst de beschikbaarheid van lokale modellen en probeert daarna elke externe provider in auto-selectievolgorde.

    Wanneer een gecachet gateway-peilresultaat beschikbaar is (de gateway was gezond op het moment van de controle), vergelijkt doctor het resultaat met de CLI-zichtbare configuratie en vermeldt eventuele afwijkingen. Doctor start geen nieuwe embedding-ping op het standaardpad; gebruik het deep-geheugenstatuscommando wanneer je een live providercontrole wilt.

    Gebruik `openclaw memory status --deep` om de embeddinggereedheid tijdens runtime te verifiëren.

  </Accordion>
  <Accordion title="14. Kanaalstatuswaarschuwingen">
    Als de gateway gezond is, voert doctor een kanaalstatuspeiling uit en meldt waarschuwingen met voorgestelde oplossingen.
  </Accordion>
  <Accordion title="15. Audit + reparatie van supervisorconfiguratie">
    Doctor controleert de geïnstalleerde supervisorconfiguratie (launchd/systemd/schtasks) op ontbrekende of verouderde standaardwaarden (bijv. systemd network-online-afhankelijkheden en herstartvertraging). Wanneer er een afwijking wordt gevonden, wordt een update aanbevolen en kan het servicebestand/de taak naar de huidige standaardwaarden worden herschreven.

    Opmerkingen:

    - `openclaw doctor` vraagt om bevestiging voordat de supervisorconfiguratie wordt herschreven.
    - `openclaw doctor --yes` accepteert de standaardreparatieprompts.
    - `openclaw doctor --repair` past aanbevolen oplossingen zonder prompts toe.
    - `openclaw doctor --repair --force` overschrijft aangepaste supervisorconfiguraties.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` houdt doctor alleen-lezen voor de levenscyclus van de gatewayservice. De servicegezondheid wordt nog steeds gemeld en niet-service-reparaties worden uitgevoerd, maar service-installatie/start/herstart/bootstrap, herschrijven van supervisorconfiguratie en opschonen van legacyservices worden overgeslagen omdat een externe supervisor die levenscyclus beheert.
    - Op Linux herschrijft doctor geen commando-/entrypointmetadata terwijl de overeenkomende systemd gateway-unit actief is. Ook worden inactieve niet-legacy extra gateway-achtige units genegeerd tijdens de scan op dubbele services, zodat begeleidende servicebestanden geen opschoonruis veroorzaken.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert doctor-service-installatie/-reparatie de SecretRef maar worden opgeloste plaintext tokenwaarden niet opgeslagen in de omgevingsmetadata van de supervisorservice.
    - Doctor detecteert beheerde `.env`/SecretRef-ondersteunde serviceomgevingswaarden die oudere LaunchAgent-, systemd- of Windows Scheduled Task-installaties inline hebben ingebed en herschrijft de servicemetadata zodat die waarden uit de runtimebron worden geladen in plaats van uit de supervisordefinitie.
    - Doctor detecteert wanneer het servicecommando nog steeds een oude `--port` vastzet nadat `gateway.port` is gewijzigd en herschrijft de servicemetadata naar de huidige poort.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, blokkeert doctor het installatie-/reparatiepad met uitvoerbaar advies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert doctor installatie/reparatie totdat de modus expliciet is ingesteld.
    - Voor Linux user-systemd-units nemen doctortokendriftcontroles nu zowel `Environment=`- als `EnvironmentFile=`-bronnen mee bij het vergelijken van serviceauthmetadata.
    - Doctor-servicereparaties weigeren een gatewayservice van een oudere OpenClaw-binary te herschrijven, stoppen of herstarten wanneer de configuratie voor het laatst door een nieuwere versie is geschreven. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Je kunt altijd een volledige herschrijving afdwingen via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Gateway-runtime + poortdiagnostiek">
    Doctor inspecteert de serviceruntime (PID, laatste exitstatus) en waarschuwt wanneer de service is geïnstalleerd maar niet daadwerkelijk draait. Ook wordt gecontroleerd op poortconflicten op de gatewaypoort (standaard `18789`) en worden waarschijnlijke oorzaken gemeld (gateway draait al, SSH-tunnel).
  </Accordion>
  <Accordion title="17. Best practices voor Gateway-runtime">
    Doctor waarschuwt wanneer de gatewayservice draait op Bun of een versiebeheerd Node-pad (`nvm`, `fnm`, `volta`, `asdf`, enz.). WhatsApp- en Telegram-kanalen vereisen Node, en versiebeheerpaden kunnen na upgrades breken omdat de service je shell-init niet laadt. Doctor biedt aan om naar een systeeminstallatie van Node te migreren wanneer die beschikbaar is (Homebrew/apt/choco).

    Nieuw geïnstalleerde of gerepareerde macOS LaunchAgents gebruiken een canoniek systeem-PATH (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) in plaats van het interactieve shell-PATH te kopiëren, zodat Volta, asdf, fnm, pnpm en andere versiebeheermappen niet veranderen welke Node-childprocessen worden opgelost. Linux-services behouden nog steeds expliciete omgevingsroots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) en stabiele user-bin-mappen, maar geraden fallbackmappen voor versiebeheer worden alleen naar het service-PATH geschreven wanneer die mappen op schijf bestaan.

  </Accordion>
  <Accordion title="18. Configuratie schrijven + wizardmetadata">
    Doctor bewaart eventuele configuratiewijzigingen en stempelt wizardmetadata om de doctor-run vast te leggen.
  </Accordion>
  <Accordion title="19. Werkruimtetips (back-up + geheugensysteem)">
    Doctor stelt een geheugensysteem voor de werkruimte voor wanneer dat ontbreekt en toont een back-uptip als de werkruimte nog niet onder git staat.

    Zie [/concepts/agent-workspace](/nl/concepts/agent-workspace) voor een volledige gids over werkruimtestructuur en git-back-up (aanbevolen: private GitHub of GitLab).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
