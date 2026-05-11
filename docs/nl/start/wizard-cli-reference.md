---
read_when:
    - Je hebt gedetailleerd gedrag nodig voor openclaw onboard
    - Je debugt introductieresultaten of integreert introductieclients
sidebarTitle: CLI reference
summary: Volledige referentie voor de CLI-configuratiestroom, authenticatie- en modelconfiguratie, uitvoer en interne werking
title: Naslaginformatie voor CLI-configuratie
x-i18n:
    generated_at: "2026-05-11T20:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Deze pagina is de volledige referentie voor `openclaw onboard`.
Zie voor de korte handleiding [Onboarding (CLI)](/nl/start/wizard).

## Wat de wizard doet

Lokale modus (standaard) leidt je door:

- Model- en auth-configuratie (OpenAI Code-abonnement OAuth, Anthropic Claude CLI of API-sleutel, plus opties voor MiniMax, GLM, Ollama, Moonshot, StepFun en AI Gateway)
- Werkruimtelocatie en bootstrap-bestanden
- Gateway-instellingen (poort, bind, auth, tailscale)
- Kanalen en providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage en andere meegeleverde kanaalplugins)
- Daemon-installatie (LaunchAgent, systemd-gebruikerseenheid of native Windows Scheduled Task met Startup-mapfallback)
- Gezondheidscontrole
- Skills-configuratie

Externe modus configureert deze machine om verbinding te maken met een Gateway elders.
Deze installeert of wijzigt niets op de externe host.

## Details van de lokale flow

<Steps>
  <Step title="Bestaande configuratie detecteren">
    - Als `~/.openclaw/openclaw.json` bestaat, kies je Behouden, Wijzigen of Resetten.
    - De wizard opnieuw uitvoeren wist niets tenzij je expliciet Resetten kiest (of `--reset` meegeeft).
    - CLI `--reset` gebruikt standaard `config+creds+sessions`; gebruik `--reset-scope full` om ook de werkruimte te verwijderen.
    - Als de configuratie ongeldig is of legacy-sleutels bevat, stopt de wizard en vraagt deze je om `openclaw doctor` uit te voeren voordat je doorgaat.
    - Resetten gebruikt `trash` en biedt scopes:
      - Alleen configuratie
      - Configuratie + referenties + sessies
      - Volledige reset (verwijdert ook de werkruimte)

  </Step>
  <Step title="Model en auth">
    - De volledige optiematrix staat in [Auth- en modelopties](#auth-and-model-options).

  </Step>
  <Step title="Werkruimte">
    - Standaard `~/.openclaw/workspace` (configureerbaar).
    - Plaatst de werkruimtebestanden die nodig zijn voor het bootstrap-ritueel bij de eerste uitvoering.
    - Werkruimte-indeling: [Agentwerkruimte](/nl/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Vraagt om poort, bind, auth-modus en tailscale-blootstelling.
    - Aanbevolen: laat token-auth ingeschakeld, zelfs voor loopback, zodat lokale WS-clients zich moeten authenticeren.
    - In tokenmodus biedt interactieve configuratie:
      - **Platteteksttoken genereren/opslaan** (standaard)
      - **SecretRef gebruiken** (opt-in)
    - In wachtwoordmodus ondersteunt interactieve configuratie ook opslag als plattetekst of SecretRef.
    - Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
      - Vereist een niet-lege env-var in de onboardingprocesomgeving.
      - Kan niet worden gecombineerd met `--gateway-token`.
    - Schakel auth alleen uit als je elk lokaal proces volledig vertrouwt.
    - Niet-loopback-binds vereisen nog steeds auth.

  </Step>
  <Step title="Kanalen">
    - [WhatsApp](/nl/channels/whatsapp): optionele QR-login
    - [Telegram](/nl/channels/telegram): bottoken
    - [Discord](/nl/channels/discord): bottoken
    - [Google Chat](/nl/channels/googlechat): serviceaccount-JSON + webhookdoelgroep
    - [Mattermost](/nl/channels/mattermost): bottoken + basis-URL
    - [Signal](/nl/channels/signal): optionele `signal-cli`-installatie + accountconfiguratie
    - [iMessage](/nl/channels/imessage): `imsg` CLI-pad + toegang tot Messages-DB; gebruik een SSH-wrapper wanneer de Gateway niet op een Mac draait
    - DM-beveiliging: standaard is koppelen. De eerste DM stuurt een code; keur goed via
      `openclaw pairing approve <channel> <code>` of gebruik allowlists.
  </Step>
  <Step title="Daemon-installatie">
    - macOS: LaunchAgent
      - Vereist een ingelogde gebruikerssessie; gebruik voor headless een aangepaste LaunchDaemon (niet meegeleverd).
    - Linux en Windows via WSL2: systemd-gebruikerseenheid
      - De wizard probeert `loginctl enable-linger <user>` zodat de Gateway actief blijft na uitloggen.
      - Kan om sudo vragen (schrijft `/var/lib/systemd/linger`); probeert het eerst zonder sudo.
    - Native Windows: eerst Scheduled Task
      - Als taakaanmaak wordt geweigerd, valt OpenClaw terug op een login-item in de Startup-map per gebruiker en start de Gateway direct.
      - Scheduled Tasks blijven aanbevolen omdat ze een betere supervisorstatus bieden.
    - Runtime-selectie: Node (aanbevolen; vereist voor WhatsApp en Telegram). Bun wordt niet aanbevolen.

  </Step>
  <Step title="Gezondheidscontrole">
    - Start de Gateway (indien nodig) en voert `openclaw health` uit.
    - `openclaw status --deep` voegt de live Gateway-gezondheidsprobe toe aan de statusuitvoer, inclusief kanaalprobes wanneer ondersteund.

  </Step>
  <Step title="Skills">
    - Leest beschikbare Skills en controleert vereisten.
    - Laat je een node-manager kiezen: npm, pnpm of bun.
    - Installeert optionele afhankelijkheden (sommige gebruiken Homebrew op macOS).

  </Step>
  <Step title="Afronden">
    - Samenvatting en volgende stappen, inclusief iOS-, Android- en macOS-appopties.

  </Step>
</Steps>

<Note>
Als er geen GUI wordt gedetecteerd, drukt de wizard SSH-port-forward-instructies voor de Control UI af in plaats van een browser te openen.
Als Control UI-assets ontbreken, probeert de wizard ze te bouwen; fallback is `pnpm ui:build` (installeert UI-afhankelijkheden automatisch).
</Note>

## Details van externe modus

Externe modus configureert deze machine om verbinding te maken met een Gateway elders.

<Info>
Externe modus installeert of wijzigt niets op de externe host.
</Info>

Wat je instelt:

- Externe Gateway-URL (`ws://...`)
- Token als externe Gateway-auth vereist is (aanbevolen)

<Note>
- Als de Gateway alleen loopback is, gebruik dan SSH-tunneling of een tailnet.
- Discovery-hints:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Auth- en modelopties

<AccordionGroup>
  <Accordion title="Anthropic API-sleutel">
    Gebruikt `ANTHROPIC_API_KEY` als die aanwezig is of vraagt om een sleutel en slaat deze daarna op voor daemongebruik.
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
    Gebruikt `OPENAI_API_KEY` als die aanwezig is of vraagt om een sleutel en slaat de referentie daarna op in auth-profielen.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` wanneer het model niet is ingesteld, `openai/*` is of `openai-codex/*` is.

  </Accordion>
  <Accordion title="xAI (Grok) API-sleutel">
    Vraagt om `XAI_API_KEY` en configureert xAI als modelprovider.
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
    Meer detail: [Vercel AI Gateway](/nl/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Vraagt om account-ID, Gateway-ID en `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Meer detail: [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Configuratie wordt automatisch geschreven. De gehoste standaard is `MiniMax-M2.7`; configuratie met API-sleutel gebruikt
    `minimax/...`, en OAuth-configuratie gebruikt `minimax-portal/...`.
    Meer detail: [MiniMax](/nl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Configuratie wordt automatisch geschreven voor StepFun Standard of Step Plan op Chinese of wereldwijde endpoints.
    Standard bevat momenteel `step-3.5-flash`, en Step Plan bevat ook `step-3.5-flash-2603`.
    Meer detail: [StepFun](/nl/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatibel)">
    Vraagt om `SYNTHETIC_API_KEY`.
    Meer detail: [Synthetic](/nl/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud en lokale open modellen)">
    Vraagt eerst om `Cloud + Local`, `Cloud only` of `Local only`.
    `Cloud only` gebruikt `OLLAMA_API_KEY` met `https://ollama.com`.
    De host-backed modi vragen om een basis-URL (standaard `http://127.0.0.1:11434`), ontdekken beschikbare modellen en stellen standaarden voor.
    `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
    Meer detail: [Ollama](/nl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot en Kimi Coding">
    Configuraties voor Moonshot (Kimi K2) en Kimi Coding worden automatisch geschreven.
    Meer detail: [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot).
  </Accordion>
  <Accordion title="Aangepaste provider">
    Werkt met OpenAI-compatibele en Anthropic-compatibele endpoints.

    Interactieve onboarding ondersteunt dezelfde opslagkeuzes voor API-sleutels als andere provider-API-sleutelflows:
    - **API-sleutel nu plakken** (plattetekst)
    - **Geheime verwijzing gebruiken** (env-ref of geconfigureerde provider-ref, met preflightvalidatie)

    Niet-interactieve flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optioneel; valt terug op `CUSTOM_API_KEY`)
    - `--custom-provider-id` (optioneel)
    - `--custom-compatibility <openai|anthropic>` (optioneel; standaard `openai`)
    - `--custom-image-input` / `--custom-text-input` (optioneel; overschrijft afgeleide modelinvoercapaciteit)

  </Accordion>
  <Accordion title="Overslaan">
    Laat auth ongeconfigureerd.
  </Accordion>
</AccordionGroup>

Modelgedrag:

- Kies het standaardmodel uit gedetecteerde opties, of voer provider en model handmatig in.
- Onboarding voor aangepaste providers leidt beeldondersteuning af voor gangbare model-ID's en vraagt alleen wanneer de modelnaam onbekend is.
- Wanneer onboarding start vanuit een provider-auth-keuze, geeft de modelkiezer automatisch
  voorkeur aan die provider. Voor Volcengine en BytePlus komt dezelfde voorkeur
  ook overeen met hun coding-plan-varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Als dat voorkeursproviderfilter leeg zou zijn, valt de kiezer terug op
  de volledige catalogus in plaats van geen modellen te tonen.
- De wizard voert een modelcontrole uit en waarschuwt als het geconfigureerde model onbekend is of auth mist.

Paden voor referenties en profielen:

- Auth-profielen (API-sleutels + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy OAuth-import: `~/.openclaw/credentials/oauth.json`

Opslagmodus voor referenties:

- Standaard onboardinggedrag bewaart API-sleutels als plattetekstwaarden in auth-profielen.
- `--secret-input-mode ref` schakelt referentiemodus in in plaats van opslag van plattetekstsleutels.
  In interactieve configuratie kun je kiezen uit:
  - omgevingsvariabele-ref (bijvoorbeeld `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - geconfigureerde provider-ref (`file` of `exec`) met provideralias + id
- Interactieve referentiemodus voert een snelle preflightvalidatie uit voordat wordt opgeslagen.
  - Env-refs: valideert variabelenaam + niet-lege waarde in de huidige onboardingomgeving.
  - Provider-refs: valideert providerconfiguratie en lost de gevraagde id op.
  - Als preflight mislukt, toont onboarding de fout en kun je het opnieuw proberen.
- In niet-interactieve modus is `--secret-input-mode ref` alleen env-backed.
  - Stel de provider-env-var in de onboardingprocesomgeving in.
  - Inline-sleutelflags (bijvoorbeeld `--openai-api-key`) vereisen dat die env-var is ingesteld; anders mislukt onboarding snel.
  - Voor aangepaste providers slaat niet-interactieve `ref`-modus `models.providers.<id>.apiKey` op als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In dat aangepaste-providergeval vereist `--custom-api-key` dat `CUSTOM_API_KEY` is ingesteld; anders mislukt onboarding snel.
- Gateway-auth-referenties ondersteunen keuzes voor plattetekst en SecretRef in interactieve configuratie:
  - Tokenmodus: **Platteteksttoken genereren/opslaan** (standaard) of **SecretRef gebruiken**.
  - Wachtwoordmodus: plattetekst of SecretRef.
- Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestaande plattetekstconfiguraties blijven ongewijzigd werken.

<Note>
Tip voor omgevingen zonder grafische interface en servers: voltooi OAuth op een machine met een browser en kopieer vervolgens
het `auth-profiles.json` van die agent (bijvoorbeeld
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, of het bijbehorende
`$OPENCLAW_STATE_DIR/...`-pad) naar de Gateway-host. `credentials/oauth.json`
is alleen een verouderde importbron.
</Note>

## Uitvoer en interne details

Typische velden in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` wanneer `--skip-bootstrap` wordt meegegeven
- `agents.defaults.model` / `models.providers` (als Minimax is gekozen)
- `tools.profile` (lokale introductie gebruikt standaard `"coding"` wanneer dit niet is ingesteld; bestaande expliciete waarden blijven behouden)
- `gateway.*` (modus, bind, auth, tailscale)
- `session.dmScope` (lokale introductie gebruikt hiervoor standaard `per-channel-peer` wanneer dit niet is ingesteld; bestaande expliciete waarden blijven behouden)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanaal-allowlists (Slack, Discord, Matrix, Microsoft Teams) wanneer je je hiervoor aanmeldt tijdens prompts (namen worden waar mogelijk omgezet naar ID's)
- `skills.install.nodeManager`
  - De vlag `setup --node-manager` accepteert `npm`, `pnpm` of `bun`.
  - Handmatige configuratie kan later nog steeds `skills.install.nodeManager: "yarn"` instellen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schrijft `agents.list[]` en optionele `bindings`.

WhatsApp-referenties komen onder `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sessies worden opgeslagen onder `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Sommige kanalen worden geleverd als plugins. Wanneer ze tijdens de configuratie worden geselecteerd, vraagt de wizard
om de plugin te installeren (npm of lokaal pad) vóór de kanaalconfiguratie.
</Note>

Gateway-wizard-RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-app en Control UI) kunnen stappen renderen zonder de introductielogica opnieuw te implementeren.

Signal-configuratiegedrag:

- Downloadt de juiste release-asset
- Slaat deze op onder `~/.openclaw/tools/signal-cli/<version>/`
- Schrijft `channels.signal.cliPath` in de configuratie
- JVM-builds vereisen Java 21
- Native builds worden gebruikt wanneer beschikbaar
- Windows gebruikt WSL2 en volgt de Linux signal-cli-flow binnen WSL

## Gerelateerde documentatie

- Introductiehub: [Introductie (CLI)](/nl/start/wizard)
- Automatisering en scripts: [CLI-automatisering](/nl/start/wizard-cli-automation)
- Opdrachtenreferentie: [`openclaw onboard`](/nl/cli/onboard)
