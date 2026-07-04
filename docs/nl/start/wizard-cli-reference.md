---
read_when:
    - Je hebt gedetailleerd gedrag nodig voor openclaw onboard
    - Je debugt onboardingresultaten of integreert onboardingclients
sidebarTitle: CLI reference
summary: Volledige referentie voor de CLI-installatiestroom, auth/model-installatie, uitvoer en interne werking
title: CLI-installatiereferentie
x-i18n:
    generated_at: "2026-07-04T06:41:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Deze pagina is de volledige referentie voor `openclaw onboard`.
Zie voor de korte gids [Onboarding (CLI)](/nl/start/wizard).

## Wat de wizard doet

Lokale modus (standaard) leidt je door:

- Model- en authenticatie-instelling (OAuth voor OpenAI Code-abonnement, Anthropic Claude CLI of API-sleutel, plus opties voor MiniMax, GLM, Ollama, Moonshot, StepFun en AI Gateway)
- Werkruimtelocatie en bootstrapbestanden
- Gateway-instellingen (poort, bind, authenticatie, tailscale)
- Kanalen en providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage en andere meegeleverde kanaalplugins)
- Daemoninstallatie (LaunchAgent, systemd-gebruikerseenheid of native Windows Scheduled Task met Startup-map als fallback)
- Gezondheidscontrole
- Skills-instelling

Externe modus configureert deze machine om verbinding te maken met een Gateway elders.
Deze installeert of wijzigt niets op de externe host.

## Details van lokale flow

<Steps>
  <Step title="Existing config detection">
    - Als `~/.openclaw/openclaw.json` bestaat, kies je Behouden, Wijzigen of Resetten.
    - Het opnieuw uitvoeren van de wizard wist niets, tenzij je expliciet Resetten kiest (of `--reset` meegeeft).
    - CLI `--reset` gebruikt standaard `config+creds+sessions`; gebruik `--reset-scope full` om ook de werkruimte te verwijderen.
    - Als de configuratie ongeldig is of verouderde sleutels bevat, stopt de wizard en vraagt deze je om `openclaw doctor` uit te voeren voordat je doorgaat.
    - Reset gebruikt `trash` en biedt scopes:
      - Alleen configuratie
      - Configuratie + inloggegevens + sessies
      - Volledige reset (verwijdert ook de werkruimte)

  </Step>
  <Step title="Model and auth">
    - De volledige optiematrix staat in [Authenticatie- en modelopties](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Standaard `~/.openclaw/workspace` (configureerbaar).
    - Vult de werkruimte met bestanden die nodig zijn voor het bootstrapritueel bij de eerste uitvoering.
    - Werkruimte-indeling: [Agent-werkruimte](/nl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Vraagt om poort, bind, authenticatiemodus en tailscale-blootstelling.
    - Aanbevolen: houd tokenauthenticatie ingeschakeld, zelfs voor loopback, zodat lokale WS-clients zich moeten authenticeren.
    - In tokenmodus biedt interactieve instelling:
      - **Platteteksttoken genereren/opslaan** (standaard)
      - **SecretRef gebruiken** (opt-in)
    - In wachtwoordmodus ondersteunt interactieve instelling ook opslag als plattetekst of SecretRef.
    - Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
      - Vereist een niet-lege env-var in de procesomgeving van de onboarding.
      - Kan niet worden gecombineerd met `--gateway-token`.
    - Schakel authenticatie alleen uit als je elk lokaal proces volledig vertrouwt.
    - Niet-loopback-binds vereisen nog steeds authenticatie.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/nl/channels/whatsapp): optionele QR-login
    - [Telegram](/nl/channels/telegram): bottoken
    - [Discord](/nl/channels/discord): bottoken
    - [Google Chat](/nl/channels/googlechat): serviceaccount-JSON + Webhook-doelgroep
    - [Mattermost](/nl/channels/mattermost): bottoken + basis-URL
    - [Signal](/nl/channels/signal): optionele `signal-cli`-installatie + accountconfiguratie
    - [iMessage](/nl/channels/imessage): `imsg` CLI-pad + toegang tot Messages DB; gebruik een SSH-wrapper wanneer de Gateway buiten de Mac draait
    - DM-beveiliging: standaard is koppelen. De eerste DM stuurt een code; keur goed via
      `openclaw pairing approve <channel> <code>` of gebruik allowlists.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Vereist een aangemelde gebruikerssessie; gebruik voor headless een aangepaste LaunchDaemon (niet meegeleverd).
    - Linux en Windows via WSL2: systemd-gebruikerseenheid
      - De wizard probeert `loginctl enable-linger <user>` zodat de Gateway actief blijft na uitloggen.
      - Kan om sudo vragen (schrijft `/var/lib/systemd/linger`); probeert het eerst zonder sudo.
    - Native Windows: eerst Scheduled Task
      - Als taakaanmaak wordt geweigerd, valt OpenClaw terug op een login-item in de Startup-map per gebruiker en start het de Gateway onmiddellijk.
      - Scheduled Tasks blijven de voorkeur houden omdat ze betere supervisorstatus bieden.
    - Runtimeselectie: Node (aanbevolen; vereist voor WhatsApp en Telegram). Bun wordt niet aanbevolen.

  </Step>
  <Step title="Health check">
    - Start de Gateway (indien nodig) en voert `openclaw health` uit.
    - `openclaw status --deep` voegt de live Gateway-gezondheidsprobe toe aan de statusuitvoer, inclusief kanaalprobes wanneer ondersteund.

  </Step>
  <Step title="Skills">
    - Leest beschikbare Skills en controleert vereisten.
    - Laat je nodebeheerder kiezen: npm, pnpm of bun.
    - Installeert optionele afhankelijkheden voor vertrouwde meegeleverde Skills wanneer het vereiste
      installatieprogramma beschikbaar is.
    - Slaat niet-beschikbare Homebrew-, uv- en Go-installatieprogramma's over en groepeert daarna de getroffen
      Skills met handmatige installatie-instructies. Voer `openclaw doctor` uit nadat je
      de ontbrekende vereisten hebt geïnstalleerd.

  </Step>
  <Step title="Finish">
    - Samenvatting en volgende stappen, inclusief iOS-, Android- en macOS-appopties.

  </Step>
</Steps>

<Note>
Als er geen GUI wordt gedetecteerd, drukt de wizard SSH-port-forward-instructies af voor de Control UI in plaats van een browser te openen.
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
- Als de Gateway alleen loopback is, gebruik dan SSH-tunneling of een tailnet.
- Discovery-hints:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Authenticatie- en modelopties

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Gebruikt `ANTHROPIC_API_KEY` als deze aanwezig is, of vraagt om een sleutel, en slaat deze daarna op voor daemongebruik.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Browserflow; plak `code#state`.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` via de Codex-runtime wanneer het model niet is ingesteld of al tot de OpenAI-familie behoort.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    Browserkoppelingsflow met een kortlevende apparaatcode.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` via de Codex-runtime wanneer het model niet is ingesteld of al tot de OpenAI-familie behoort.

  </Accordion>
  <Accordion title="OpenAI API key">
    Gebruikt `OPENAI_API_KEY` als deze aanwezig is, of vraagt om een sleutel, en slaat de inloggegevens daarna op in authenticatieprofielen.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` wanneer het model niet is ingesteld, `openai/*` is, of verouderde Codex-modelrefs gebruikt.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Browseraanmelding voor in aanmerking komende SuperGrok- of X Premium-accounts. Dit is het
    aanbevolen xAI-pad voor de meeste gebruikers. OpenClaw slaat het resulterende authenticatieprofiel
    op voor Grok-modellen, Grok `web_search`, `x_search` en `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    Extern-vriendelijke browseraanmelding met een korte code in plaats van een localhost-
    callback. Gebruik dit vanaf SSH-, Docker- of VPS-hosts.
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Vraagt om `XAI_API_KEY` en configureert xAI als modelprovider. Gebruik dit
    wanneer je een xAI Console API-sleutel wilt in plaats van abonnements-OAuth.
  </Accordion>
  <Accordion title="OpenCode">
    Vraagt om `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`) en laat je de Zen- of Go-catalogus kiezen.
    Installatie-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
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
    Configuratie wordt automatisch geschreven. Gehoste standaard is `MiniMax-M3`; instelling met API-sleutel gebruikt
    `minimax/...`, en OAuth-instelling gebruikt `minimax-portal/...`.
    Meer details: [MiniMax](/nl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Configuratie wordt automatisch geschreven voor StepFun Standard of Step Plan op Chinese of wereldwijde endpoints.
    Standard bevat momenteel `step-3.5-flash`, en Step Plan bevat ook `step-3.5-flash-2603`.
    Meer details: [StepFun](/nl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    Vraagt om `SYNTHETIC_API_KEY`.
    Meer details: [Synthetic](/nl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    Vraagt eerst om `Cloud + Local`, `Cloud only` of `Local only`.
    `Cloud only` gebruikt `OLLAMA_API_KEY` met `https://ollama.com`.
    De host-backed modi vragen om een basis-URL (standaard `http://127.0.0.1:11434`), ontdekken beschikbare modellen en stellen standaarden voor.
    `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
    Meer details: [Ollama](/nl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot (Kimi K2)- en Kimi Coding-configuraties worden automatisch geschreven.
    Meer details: [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    Werkt met OpenAI-compatibele en Anthropic-compatibele endpoints.

    Interactieve onboarding ondersteunt dezelfde opslagkeuzes voor API-sleutels als andere API-sleutelflows voor providers:
    - **API-sleutel nu plakken** (plattetekst)
    - **Geheime referentie gebruiken** (env-ref of geconfigureerde provider-ref, met preflightvalidatie)

    Niet-interactieve vlaggen:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optioneel; valt terug op `CUSTOM_API_KEY`)
    - `--custom-provider-id` (optioneel)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optioneel; standaard `openai`)
    - `--custom-image-input` / `--custom-text-input` (optioneel; overschrijft afgeleide modelinvoercapaciteit)

  </Accordion>
  <Accordion title="Skip">
    Laat authenticatie ongeconfigureerd.
  </Accordion>
</AccordionGroup>

Modelgedrag:

- Kies het standaardmodel uit de gedetecteerde opties, of voer provider en model handmatig in.
- Onboarding voor aangepaste providers leidt beeldondersteuning af voor gangbare model-ID's en vraagt alleen wanneer de modelnaam onbekend is.
- Wanneer onboarding start vanuit een provider-authenticatiekeuze, geeft de modelkiezer automatisch
  de voorkeur aan die provider. Voor Volcengine en BytePlus komt dezelfde voorkeur
  ook overeen met hun coding-plan-varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Als dat voorkeursproviderfilter leeg zou zijn, valt de kiezer terug op
  de volledige catalogus in plaats van geen modellen te tonen.
- De wizard voert een modelcontrole uit en waarschuwt als het geconfigureerde model onbekend is of authenticatie mist.

Paden voor inloggegevens en profielen:

- Authenticatieprofielen (API-sleutels + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import van verouderde OAuth: `~/.openclaw/credentials/oauth.json`

Opslagmodus voor inloggegevens:

- Standaard onboardinggedrag bewaart API-sleutels als plattetekstwaarden in auth-profielen.
- `--secret-input-mode ref` schakelt referentiemodus in in plaats van opslag van sleutels in platte tekst.
  In interactieve setup kun je kiezen uit:
  - omgevingsvariabele-ref (bijvoorbeeld `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - geconfigureerde provider-ref (`file` of `exec`) met provideralias + id
- Interactieve referentiemodus voert een snelle preflightvalidatie uit voordat er wordt opgeslagen.
  - Env-refs: valideert variabelenaam + niet-lege waarde in de huidige onboardingomgeving.
  - Provider-refs: valideert providerconfiguratie en resolveert de gevraagde id.
  - Als preflight mislukt, toont onboarding de fout en kun je het opnieuw proberen.
- In niet-interactieve modus wordt `--secret-input-mode ref` alleen door env ondersteund.
  - Stel de provider-env-var in de procesomgeving voor onboarding in.
  - Inline sleutelvlaggen (bijvoorbeeld `--openai-api-key`) vereisen dat die env-var is ingesteld; anders faalt onboarding direct.
  - Voor aangepaste providers slaat niet-interactieve `ref`-modus `models.providers.<id>.apiKey` op als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In dat geval met een aangepaste provider vereist `--custom-api-key` dat `CUSTOM_API_KEY` is ingesteld; anders faalt onboarding direct.
- Gateway-authreferenties ondersteunen keuzes voor platte tekst en SecretRef in interactieve setup:
  - Tokenmodus: **Platteteksttoken genereren/opslaan** (standaard) of **SecretRef gebruiken**.
  - Wachtwoordmodus: platte tekst of SecretRef.
- Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestaande setups met platte tekst blijven ongewijzigd werken.

<Note>
Tip voor headless en servers: voltooi OAuth op een machine met een browser en kopieer daarna
de `auth-profiles.json` van die agent (bijvoorbeeld
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, of het bijbehorende
`$OPENCLAW_STATE_DIR/...`-pad) naar de gatewayhost. `credentials/oauth.json`
is alleen een oudere importbron.
</Note>

## Uitvoer en internals

Typische velden in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` wanneer `--skip-bootstrap` wordt meegegeven
- `agents.defaults.model` / `models.providers` (als Minimax is gekozen)
- `tools.profile` (lokale onboarding gebruikt standaard `"coding"` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
- `gateway.*` (modus, bind, auth, tailscale)
- `session.dmScope` (lokale onboarding stelt dit standaard in op `per-channel-peer` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanaal-allowlists (Slack, Discord, Matrix, Microsoft Teams) wanneer je hiervoor kiest tijdens prompts (namen worden waar mogelijk naar ID's omgezet)
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
Sommige kanalen worden geleverd als plugins. Wanneer ze tijdens setup worden geselecteerd, vraagt de wizard
om de plugin te installeren (npm of lokaal pad) vóór kanaalconfiguratie.
</Note>

Gateway-wizard-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-app en Control UI) kunnen stappen renderen zonder onboardinglogica opnieuw te implementeren.

Signal-setupgedrag:

- Downloadt de juiste release-asset
- Slaat deze op onder `~/.openclaw/tools/signal-cli/<version>/`
- Schrijft `channels.signal.cliPath` in config
- JVM-builds vereisen Java 21
- Native builds worden gebruikt wanneer beschikbaar
- Windows gebruikt WSL2 en volgt de Linux signal-cli-flow binnen WSL

## Gerelateerde docs

- Onboardinghub: [Onboarding (CLI)](/nl/start/wizard)
- Automatisering en scripts: [CLI-automatisering](/nl/start/wizard-cli-automation)
- Commandoreferentie: [`openclaw onboard`](/nl/cli/onboard)
