---
read_when:
    - Je hebt gedetailleerd gedrag nodig voor openclaw onboard
    - Je debugt onboardingresultaten of integreert onboardingclients
sidebarTitle: CLI reference
summary: Volledige referentie voor de CLI-installatiestroom, auth-/modelinstallatie, uitvoer en interne werking
title: CLI-installatiereferentie
x-i18n:
    generated_at: "2026-06-30T22:24:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Deze pagina is de volledige referentie voor `openclaw onboard`.
Zie voor de korte gids [Onboarding (CLI)](/nl/start/wizard).

## Wat de wizard doet

Lokale modus (standaard) leidt je door:

- Model- en authenticatieconfiguratie (OAuth voor OpenAI Code-abonnement, Anthropic Claude CLI of API-sleutel, plus opties voor MiniMax, GLM, Ollama, Moonshot, StepFun en AI Gateway)
- Werkruimtelocatie en bootstrapbestanden
- Gateway-instellingen (poort, bind, authenticatie, Tailscale)
- Kanalen en providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage en andere meegeleverde kanaal-plugins)
- Daemoninstallatie (LaunchAgent, systemd-gebruikerseenheid of native Windows Scheduled Task met fallback naar de Startup-map)
- Gezondheidscontrole
- Skills-configuratie

Externe modus configureert deze machine om verbinding te maken met een Gateway elders.
Deze installeert of wijzigt niets op de externe host.

## Details van de lokale flow

<Steps>
  <Step title="Bestaande configuratie detecteren">
    - Als `~/.openclaw/openclaw.json` bestaat, kies je Keep, Modify of Reset.
    - De wizard opnieuw uitvoeren wist niets, tenzij je expliciet Reset kiest (of `--reset` meegeeft).
    - CLI `--reset` staat standaard op `config+creds+sessions`; gebruik `--reset-scope full` om ook de werkruimte te verwijderen.
    - Als de configuratie ongeldig is of verouderde sleutels bevat, stopt de wizard en vraagt deze je om `openclaw doctor` uit te voeren voordat je doorgaat.
    - Reset gebruikt `trash` en biedt scopes:
      - Alleen configuratie
      - Configuratie + referenties + sessies
      - Volledige reset (verwijdert ook de werkruimte)

  </Step>
  <Step title="Model en authenticatie">
    - De volledige optiematrix staat in [Authenticatie- en modelopties](#auth-and-model-options).

  </Step>
  <Step title="Werkruimte">
    - Standaard `~/.openclaw/workspace` (configureerbaar).
    - Plaatst werkruimtebestanden die nodig zijn voor het bootstrapritueel bij de eerste uitvoering.
    - Werkruimte-indeling: [Agentwerkruimte](/nl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Vraagt om poort, bind, authenticatiemodus en Tailscale-blootstelling.
    - Aanbevolen: laat tokenauthenticatie ingeschakeld, zelfs voor loopback, zodat lokale WS-clients zich moeten authenticeren.
    - In tokenmodus biedt interactieve configuratie:
      - **Token in platte tekst genereren/opslaan** (standaard)
      - **SecretRef gebruiken** (opt-in)
    - In wachtwoordmodus ondersteunt interactieve configuratie ook opslag in platte tekst of via SecretRef.
    - Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
      - Vereist een niet-lege env-var in de procesomgeving van onboarding.
      - Kan niet worden gecombineerd met `--gateway-token`.
    - Schakel authenticatie alleen uit als je elk lokaal proces volledig vertrouwt.
    - Niet-loopback-binds vereisen nog steeds authenticatie.

  </Step>
  <Step title="Kanalen">
    - [WhatsApp](/nl/channels/whatsapp): optionele QR-login
    - [Telegram](/nl/channels/telegram): bot-token
    - [Discord](/nl/channels/discord): bot-token
    - [Google Chat](/nl/channels/googlechat): serviceaccount-JSON + Webhook-doelgroep
    - [Mattermost](/nl/channels/mattermost): bot-token + basis-URL
    - [Signal](/nl/channels/signal): optionele installatie van `signal-cli` + accountconfiguratie
    - [iMessage](/nl/channels/imessage): `imsg` CLI-pad + toegang tot de Messages-DB; gebruik een SSH-wrapper wanneer de Gateway niet op een Mac draait
    - DM-beveiliging: standaard is koppeling. De eerste DM stuurt een code; keur goed via
      `openclaw pairing approve <channel> <code>` of gebruik allowlists.
  </Step>
  <Step title="Daemoninstallatie">
    - macOS: LaunchAgent
      - Vereist een aangemelde gebruikerssessie; gebruik voor headless een aangepaste LaunchDaemon (niet meegeleverd).
    - Linux en Windows via WSL2: systemd-gebruikerseenheid
      - De wizard probeert `loginctl enable-linger <user>` zodat de Gateway actief blijft na uitloggen.
      - Kan om sudo vragen (schrijft `/var/lib/systemd/linger`); probeert het eerst zonder sudo.
    - Native Windows: eerst Scheduled Task
      - Als het maken van de taak wordt geweigerd, valt OpenClaw terug op een login-item per gebruiker in de Startup-map en start de Gateway meteen.
      - Scheduled Tasks blijven de voorkeur houden omdat ze betere supervisorstatus bieden.
    - Runtimekeuze: Node (aanbevolen; vereist voor WhatsApp en Telegram). Bun wordt niet aanbevolen.

  </Step>
  <Step title="Gezondheidscontrole">
    - Start de Gateway (indien nodig) en voert `openclaw health` uit.
    - `openclaw status --deep` voegt de live Gateway-gezondheidsprobe toe aan de statusuitvoer, inclusief kanaalprobes wanneer ondersteund.

  </Step>
  <Step title="Skills">
    - Leest beschikbare Skills en controleert vereisten.
    - Laat je de Node-manager kiezen: npm, pnpm of bun.
    - Installeert optionele afhankelijkheden (sommige gebruiken Homebrew op macOS).

  </Step>
  <Step title="Afronden">
    - Samenvatting en volgende stappen, inclusief opties voor iOS-, Android- en macOS-apps.

  </Step>
</Steps>

<Note>
Als er geen GUI wordt gedetecteerd, toont de wizard SSH-port-forward-instructies voor de Control UI in plaats van een browser te openen.
Als Control UI-assets ontbreken, probeert de wizard ze te bouwen; fallback is `pnpm ui:build` (installeert UI-afhankelijkheden automatisch).
</Note>

## Details van externe modus

Externe modus configureert deze machine om verbinding te maken met een Gateway elders.

<Info>
Externe modus installeert of wijzigt niets op de externe host.
</Info>

Wat je instelt:

- Externe Gateway-URL (`ws://...`)
- Token als authenticatie voor de externe Gateway vereist is (aanbevolen)

<Note>
- Als de Gateway alleen loopback gebruikt, gebruik dan SSH-tunneling of een tailnet.
- Discovery-hints:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Authenticatie- en modelopties

<AccordionGroup>
  <Accordion title="Anthropic API-sleutel">
    Gebruikt `ANTHROPIC_API_KEY` als deze aanwezig is, of vraagt om een sleutel en slaat die daarna op voor daemongebruik.
  </Accordion>
  <Accordion title="OpenAI Code-abonnement (OAuth)">
    Browserflow; plak `code#state`.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` via de Codex-runtime wanneer het model niet is ingesteld of al tot de OpenAI-familie behoort.

  </Accordion>
  <Accordion title="OpenAI Code-abonnement (apparaatkoppeling)">
    Browserkoppelingsflow met een kortlevende apparaatcode.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` via de Codex-runtime wanneer het model niet is ingesteld of al tot de OpenAI-familie behoort.

  </Accordion>
  <Accordion title="OpenAI API-sleutel">
    Gebruikt `OPENAI_API_KEY` als deze aanwezig is, of vraagt om een sleutel en slaat de referentie daarna op in authenticatieprofielen.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` wanneer het model niet is ingesteld, `openai/*` is, of verouderde Codex-modelreferenties gebruikt.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Browseraanmelding voor in aanmerking komende SuperGrok- of X Premium-accounts. Dit is het
    aanbevolen xAI-pad voor de meeste gebruikers. OpenClaw slaat het resulterende authenticatieprofiel
    op voor Grok-modellen, Grok `web_search`, `x_search` en `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) apparaatcode">
    Extern-vriendelijke browseraanmelding met een korte code in plaats van een localhost-
    callback. Gebruik dit vanaf SSH-, Docker- of VPS-hosts.
  </Accordion>
  <Accordion title="xAI (Grok) API-sleutel">
    Vraagt om `XAI_API_KEY` en configureert xAI als modelprovider. Gebruik dit
    wanneer je een xAI Console API-sleutel wilt in plaats van OAuth via een abonnement.
  </Accordion>
  <Accordion title="OpenCode">
    Vraagt om `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`) en laat je de Zen- of Go-catalogus kiezen.
    Configuratie-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-sleutel (generiek)">
    Slaat de sleutel voor je op.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Vraagt om `AI_GATEWAY_API_KEY`.
    Meer details: [Vercel AI Gateway](/nl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Vraagt om account-ID, Gateway-ID en `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Meer details: [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Configuratie wordt automatisch geschreven. Gehoste standaard is `MiniMax-M3`; configuratie met API-sleutel gebruikt
    `minimax/...`, en OAuth-configuratie gebruikt `minimax-portal/...`.
    Meer details: [MiniMax](/nl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Configuratie wordt automatisch geschreven voor StepFun Standard of Step Plan op Chinese of globale endpoints.
    Standard bevat momenteel `step-3.5-flash`, en Step Plan bevat ook `step-3.5-flash-2603`.
    Meer details: [StepFun](/nl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatibel)">
    Vraagt om `SYNTHETIC_API_KEY`.
    Meer details: [Synthetic](/nl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (cloud en lokale open modellen)">
    Vraagt eerst om `Cloud + Local`, `Cloud only` of `Local only`.
    `Cloud only` gebruikt `OLLAMA_API_KEY` met `https://ollama.com`.
    De hostgebaseerde modi vragen om een basis-URL (standaard `http://127.0.0.1:11434`), ontdekken beschikbare modellen en stellen standaardwaarden voor.
    `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
    Meer details: [Ollama](/nl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot en Kimi Coding">
    Configuraties voor Moonshot (Kimi K2) en Kimi Coding worden automatisch geschreven.
    Meer details: [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot).
  </Accordion>
  <Accordion title="Aangepaste provider">
    Werkt met OpenAI-compatibele en Anthropic-compatibele endpoints.

    Interactieve onboarding ondersteunt dezelfde opslagkeuzes voor API-sleutels als andere provider-API-sleutelflows:
    - **API-sleutel nu plakken** (platte tekst)
    - **Geheime referentie gebruiken** (env-ref of geconfigureerde provider-ref, met preflightvalidatie)

    Niet-interactieve flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optioneel; valt terug op `CUSTOM_API_KEY`)
    - `--custom-provider-id` (optioneel)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optioneel; standaard `openai`)
    - `--custom-image-input` / `--custom-text-input` (optioneel; overschrijft afgeleide modelinvoercapaciteit)

  </Accordion>
  <Accordion title="Overslaan">
    Laat authenticatie ongeconfigureerd.
  </Accordion>
</AccordionGroup>

Modelgedrag:

- Kies het standaardmodel uit gedetecteerde opties, of voer provider en model handmatig in.
- Onboarding voor aangepaste providers leidt beeldondersteuning af voor gangbare model-ID's en vraagt alleen wanneer de modelnaam onbekend is.
- Wanneer onboarding start vanuit een provider-authenticatiekeuze, geeft de modelkiezer
  automatisch de voorkeur aan die provider. Voor Volcengine en BytePlus komt dezelfde voorkeur
  ook overeen met hun coding-plan-varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Als die voorkeursproviderfilter leeg zou zijn, valt de kiezer terug op
  de volledige catalogus in plaats van geen modellen te tonen.
- De wizard voert een modelcontrole uit en waarschuwt als het geconfigureerde model onbekend is of authenticatie ontbreekt.

Paden voor referenties en profielen:

- Authenticatieprofielen (API-sleutels + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Verouderde OAuth-import: `~/.openclaw/credentials/oauth.json`

Opslagmodus voor referenties:

- Standaard onboardinggedrag bewaart API-sleutels als plaintext-waarden in auth-profielen.
- `--secret-input-mode ref` schakelt referentiemodus in in plaats van opslag van plaintext-sleutels.
  In interactieve setup kun je kiezen uit:
  - omgevingsvariabele-ref (bijvoorbeeld `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - geconfigureerde provider-ref (`file` of `exec`) met provideralias + id
- Interactieve referentiemodus voert een snelle preflightvalidatie uit vóór het opslaan.
  - Env-refs: valideert variabelenaam + niet-lege waarde in de huidige onboardingsomgeving.
  - Provider-refs: valideert providerconfiguratie en lost de aangevraagde id op.
  - Als preflight mislukt, toont onboarding de fout en kun je het opnieuw proberen.
- In niet-interactieve modus wordt `--secret-input-mode ref` alleen door env ondersteund.
  - Stel de provider-env-var in de procesomgeving van onboarding in.
  - Inline sleutelvlaggen (bijvoorbeeld `--openai-api-key`) vereisen dat die env-var is ingesteld; anders faalt onboarding snel.
  - Voor aangepaste providers slaat niet-interactieve `ref`-modus `models.providers.<id>.apiKey` op als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In dat geval met een aangepaste provider vereist `--custom-api-key` dat `CUSTOM_API_KEY` is ingesteld; anders faalt onboarding snel.
- Gateway-authreferenties ondersteunen plaintext- en SecretRef-keuzes in interactieve setup:
  - Tokenmodus: **Plaintext-token genereren/opslaan** (standaard) of **SecretRef gebruiken**.
  - Wachtwoordmodus: plaintext of SecretRef.
- Niet-interactief Token SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestaande plaintext-setups blijven ongewijzigd werken.

<Note>
Tip voor headless en servers: voltooi OAuth op een machine met een browser en kopieer daarna
de `auth-profiles.json` van die agent (bijvoorbeeld
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, of het overeenkomende
`$OPENCLAW_STATE_DIR/...`-pad) naar de gatewayhost. `credentials/oauth.json`
is alleen een verouderde importbron.
</Note>

## Uitvoer en internals

Typische velden in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` wanneer `--skip-bootstrap` wordt doorgegeven
- `agents.defaults.model` / `models.providers` (als Minimax is gekozen)
- `tools.profile` (lokale onboarding gebruikt standaard `"coding"` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (lokale onboarding zet dit standaard op `per-channel-peer` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanaal-allowlists (Slack, Discord, Matrix, Microsoft Teams) wanneer je je tijdens prompts aanmeldt (namen worden waar mogelijk naar ID's omgezet)
- `skills.install.nodeManager`
  - De vlag `setup --node-manager` accepteert `npm`, `pnpm` of `bun`.
  - Handmatige configuratie kan later nog steeds `skills.install.nodeManager: "yarn"` instellen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` schrijft `agents.list[]` en optionele `bindings`.

WhatsApp-referenties komen onder `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sessies worden opgeslagen onder `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Sommige kanalen worden als plugins geleverd. Wanneer ze tijdens setup worden geselecteerd, vraagt de wizard
om de plugin (npm of lokaal pad) te installeren vóór kanaalconfiguratie.
</Note>

Gateway-wizard-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-app en Control UI) kunnen stappen renderen zonder onboardingslogica opnieuw te implementeren.

Signal-setupgedrag:

- Downloadt de juiste release-asset
- Slaat die op onder `~/.openclaw/tools/signal-cli/<version>/`
- Schrijft `channels.signal.cliPath` in de configuratie
- JVM-builds vereisen Java 21
- Native builds worden gebruikt wanneer beschikbaar
- Windows gebruikt WSL2 en volgt de Linux signal-cli-flow binnen WSL

## Gerelateerde docs

- Onboardinghub: [Onboarding (CLI)](/nl/start/wizard)
- Automatisering en scripts: [CLI-automatisering](/nl/start/wizard-cli-automation)
- Commandoreferentie: [`openclaw onboard`](/nl/cli/onboard)
