---
read_when:
    - U hebt gedetailleerde gedragsinformatie nodig voor openclaw onboard
    - U debugt onboardingresultaten of integreert onboardingclients
sidebarTitle: CLI reference
summary: Volledige referentie voor de CLI-configuratiestroom, authenticatie-/modelconfiguratie, uitvoer en interne werking
title: CLI-installatiereferentie
x-i18n:
    generated_at: "2026-04-29T23:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Deze pagina is de volledige referentie voor `openclaw onboard`.
Zie voor de korte handleiding [Onboarding (CLI)](/nl/start/wizard).

## Wat de wizard doet

Lokale modus (standaard) leidt je door:

- Model- en authenticatie-instelling (OpenAI Code-abonnement OAuth, Anthropic Claude CLI of API-sleutel, plus opties voor MiniMax, GLM, Ollama, Moonshot, StepFun en AI Gateway)
- Werkruimtelocatie en bootstrapbestanden
- Gateway-instellingen (poort, binding, authenticatie, Tailscale)
- Kanalen en providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles en andere meegeleverde kanaalplugins)
- Daemoninstallatie (LaunchAgent, systemd-gebruikerseenheid of native Windows Scheduled Task met fallback via de map Startup)
- Gezondheidscontrole
- Skills-instelling

Externe modus configureert deze machine om verbinding te maken met een Gateway elders.
Deze installeert of wijzigt niets op de externe host.

## Details van de lokale flow

<Steps>
  <Step title="Bestaande configuratie detecteren">
    - Als `~/.openclaw/openclaw.json` bestaat, kies dan Keep, Modify of Reset.
    - De wizard opnieuw uitvoeren wist niets, tenzij je expliciet Reset kiest (of `--reset` doorgeeft).
    - CLI `--reset` gebruikt standaard `config+creds+sessions`; gebruik `--reset-scope full` om ook de werkruimte te verwijderen.
    - Als de configuratie ongeldig is of verouderde sleutels bevat, stopt de wizard en vraagt deze je om `openclaw doctor` uit te voeren voordat je verdergaat.
    - Reset gebruikt `trash` en biedt bereiken:
      - Alleen configuratie
      - Configuratie + inloggegevens + sessies
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
    - Vraagt om poort, binding, authenticatiemodus en Tailscale-blootstelling.
    - Aanbevolen: laat tokenauthenticatie ingeschakeld, zelfs voor loopback, zodat lokale WS-clients zich moeten authenticeren.
    - In tokenmodus biedt interactieve instelling:
      - **Platte-teksttoken genereren/opslaan** (standaard)
      - **SecretRef gebruiken** (opt-in)
    - In wachtwoordmodus ondersteunt interactieve instelling ook opslag als platte tekst of SecretRef.
    - Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
      - Vereist een niet-lege omgevingsvariabele in de omgeving van het onboardingproces.
      - Kan niet worden gecombineerd met `--gateway-token`.
    - Schakel authenticatie alleen uit als je elk lokaal proces volledig vertrouwt.
    - Niet-loopback-bindings vereisen nog steeds authenticatie.

  </Step>
  <Step title="Kanalen">
    - [WhatsApp](/nl/channels/whatsapp): optionele QR-login
    - [Telegram](/nl/channels/telegram): bottoken
    - [Discord](/nl/channels/discord): bottoken
    - [Google Chat](/nl/channels/googlechat): serviceaccount-JSON + webhookdoelgroep
    - [Mattermost](/nl/channels/mattermost): bottoken + basis-URL
    - [Signal](/nl/channels/signal): optionele `signal-cli`-installatie + accountconfiguratie
    - [BlueBubbles](/nl/channels/bluebubbles): aanbevolen voor iMessage; server-URL + wachtwoord + Webhook
    - [iMessage](/nl/channels/imessage): verouderd `imsg` CLI-pad + DB-toegang
    - DM-beveiliging: standaard is koppelen. De eerste DM verzendt een code; keur goed via
      `openclaw pairing approve <channel> <code>` of gebruik toestemmingslijsten.
  </Step>
  <Step title="Daemoninstallatie">
    - macOS: LaunchAgent
      - Vereist een aangemelde gebruikerssessie; gebruik voor headless een aangepaste LaunchDaemon (niet meegeleverd).
    - Linux en Windows via WSL2: systemd-gebruikerseenheid
      - De wizard probeert `loginctl enable-linger <user>`, zodat de Gateway actief blijft na uitloggen.
      - Kan om sudo vragen (schrijft `/var/lib/systemd/linger`); eerst probeert deze het zonder sudo.
    - Native Windows: eerst Scheduled Task
      - Als taakaanmaak wordt geweigerd, valt OpenClaw terug op een login-item per gebruiker in de map Startup en start het de Gateway meteen.
      - Scheduled Tasks blijven de voorkeur houden omdat ze betere supervisorstatus bieden.
    - Runtimeselectie: Node (aanbevolen; vereist voor WhatsApp en Telegram). Bun wordt niet aanbevolen.

  </Step>
  <Step title="Gezondheidscontrole">
    - Start de Gateway (indien nodig) en voert `openclaw health` uit.
    - `openclaw status --deep` voegt de live gezondheidsprobe van de Gateway toe aan de statusuitvoer, inclusief kanaalprobes wanneer ondersteund.

  </Step>
  <Step title="Skills">
    - Leest beschikbare Skills en controleert vereisten.
    - Laat je een nodebeheerder kiezen: npm, pnpm of bun.
    - Installeert optionele afhankelijkheden (sommige gebruiken Homebrew op macOS).

  </Step>
  <Step title="Afronden">
    - Samenvatting en volgende stappen, inclusief opties voor iOS-, Android- en macOS-apps.

  </Step>
</Steps>

<Note>
Als er geen GUI wordt gedetecteerd, drukt de wizard SSH-port-forwardinstructies voor de Control UI af in plaats van een browser te openen.
Als Control UI-assets ontbreken, probeert de wizard ze te bouwen; de fallback is `pnpm ui:build` (installeert UI-afhankelijkheden automatisch).
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
  <Accordion title="Anthropic API-sleutel">
    Gebruikt `ANTHROPIC_API_KEY` als die aanwezig is of vraagt om een sleutel en slaat deze vervolgens op voor gebruik door de daemon.
  </Accordion>
  <Accordion title="OpenAI Code-abonnement (OAuth)">
    Browserflow; plak `code#state`.

    Stelt `agents.defaults.model` in op `openai-codex/gpt-5.5` wanneer model niet is ingesteld of al tot de OpenAI-familie behoort.

  </Accordion>
  <Accordion title="OpenAI Code-abonnement (apparaatkoppeling)">
    Browserkoppelingsflow met een kortlevende apparaatcode.

    Stelt `agents.defaults.model` in op `openai-codex/gpt-5.5` wanneer model niet is ingesteld of al tot de OpenAI-familie behoort.

  </Accordion>
  <Accordion title="OpenAI API-sleutel">
    Gebruikt `OPENAI_API_KEY` als die aanwezig is of vraagt om een sleutel en slaat de inloggegevens vervolgens op in authenticatieprofielen.

    Stelt `agents.defaults.model` in op `openai/gpt-5.5` wanneer model niet is ingesteld, `openai/*` is of `openai-codex/*` is.

  </Accordion>
  <Accordion title="xAI (Grok) API-sleutel">
    Vraagt om `XAI_API_KEY` en configureert xAI als modelprovider.
  </Accordion>
  <Accordion title="OpenCode">
    Vraagt om `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`) en laat je de Zen- of Go-catalogus kiezen.
    Instel-URL: [opencode.ai/auth](https://opencode.ai/auth).
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
    Configuratie wordt automatisch geschreven. Gehoste standaard is `MiniMax-M2.7`; API-sleutelinstelling gebruikt
    `minimax/...`, en OAuth-instelling gebruikt `minimax-portal/...`.
    Meer details: [MiniMax](/nl/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Configuratie wordt automatisch geschreven voor StepFun standard of Step Plan op Chinese of globale eindpunten.
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
    De host-ondersteunde modi vragen om een basis-URL (standaard `http://127.0.0.1:11434`), ontdekken beschikbare modellen en stellen standaardwaarden voor.
    `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
    Meer details: [Ollama](/nl/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot en Kimi Coding">
    Moonshot (Kimi K2)- en Kimi Coding-configuraties worden automatisch geschreven.
    Meer details: [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot).
  </Accordion>
  <Accordion title="Aangepaste provider">
    Werkt met OpenAI-compatibele en Anthropic-compatibele eindpunten.

    Interactieve onboarding ondersteunt dezelfde opslagkeuzes voor API-sleutels als andere API-sleutelflows voor providers:
    - **API-sleutel nu plakken** (platte tekst)
    - **Geheime referentie gebruiken** (env-ref of geconfigureerde provider-ref, met preflightvalidatie)

    Niet-interactieve flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optioneel; valt terug op `CUSTOM_API_KEY`)
    - `--custom-provider-id` (optioneel)
    - `--custom-compatibility <openai|anthropic>` (optioneel; standaard `openai`)
    - `--custom-image-input` / `--custom-text-input` (optioneel; overschrijft afgeleide invoercapaciteit van het model)

  </Accordion>
  <Accordion title="Overslaan">
    Laat authenticatie ongeconfigureerd.
  </Accordion>
</AccordionGroup>

Modelgedrag:

- Kies een standaardmodel uit gedetecteerde opties, of voer provider en model handmatig in.
- Onboarding voor aangepaste providers leidt beeldondersteuning af voor gangbare model-ID's en vraagt alleen wanneer de modelnaam onbekend is.
- Wanneer onboarding start vanuit een keuze voor providerauthenticatie, geeft de modelkiezer automatisch de voorkeur aan
  die provider. Voor Volcengine en BytePlus komt dezelfde voorkeur
  ook overeen met hun coding-plan-varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Als dat voorkeursproviderfilter leeg zou zijn, valt de kiezer terug op
  de volledige catalogus in plaats van geen modellen te tonen.
- De wizard voert een modelcontrole uit en waarschuwt als het geconfigureerde model onbekend is of authenticatie ontbreekt.

Paden voor inloggegevens en profielen:

- Authenticatieprofielen (API-sleutels + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Verouderde OAuth-import: `~/.openclaw/credentials/oauth.json`

Opslagmodus voor inloggegevens:

- Standaard onboardinggedrag bewaart API-sleutels als platte-tekstwaarden in authenticatieprofielen.
- `--secret-input-mode ref` schakelt referentiemodus in in plaats van opslag van sleutels als platte tekst.
  In interactieve instelling kun je een van beide kiezen:
  - omgevingsvariabele-ref (bijvoorbeeld `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - geconfigureerde provider-ref (`file` of `exec`) met provideralias + id
- Interactieve referentiemodus voert een snelle preflightvalidatie uit voordat wordt opgeslagen.
  - Env-refs: valideert variabelenaam + niet-lege waarde in de huidige onboardingomgeving.
  - Provider-refs: valideert providerconfiguratie en lost de gevraagde id op.
  - Als preflight mislukt, toont onboarding de fout en kun je het opnieuw proberen.
- In niet-interactieve modus is `--secret-input-mode ref` alleen env-ondersteund.
  - Stel de provideromgevingsvariabele in de omgeving van het onboardingproces in.
  - Inline sleutelflags (bijvoorbeeld `--openai-api-key`) vereisen dat die omgevingsvariabele is ingesteld; anders faalt onboarding snel.
  - Voor aangepaste providers slaat niet-interactieve `ref`-modus `models.providers.<id>.apiKey` op als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In dat geval voor aangepaste providers vereist `--custom-api-key` dat `CUSTOM_API_KEY` is ingesteld; anders faalt onboarding snel.
- Gateway-authenticatiegegevens ondersteunen keuzes voor platte tekst en SecretRef in interactieve instelling:
  - Tokenmodus: **Platte-teksttoken genereren/opslaan** (standaard) of **SecretRef gebruiken**.
  - Wachtwoordmodus: platte tekst of SecretRef.
- Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestaande platte-tekstinstellingen blijven ongewijzigd werken.

<Note>
Tip voor headless en server: voltooi OAuth op een machine met een browser en kopieer daarna
de `auth-profiles.json` van die agent (bijvoorbeeld
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, of het overeenkomende
`$OPENCLAW_STATE_DIR/...`-pad) naar de gateway-host. `credentials/oauth.json`
is alleen een verouderde importbron.
</Note>

## Uitvoer en internals

Typische velden in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` wanneer `--skip-bootstrap` wordt doorgegeven
- `agents.defaults.model` / `models.providers` (als Minimax is gekozen)
- `tools.profile` (lokale onboarding gebruikt standaard `"coding"` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
- `gateway.*` (modus, bind, auth, tailscale)
- `session.dmScope` (lokale onboarding stelt dit standaard in op `per-channel-peer` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
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

`openclaw agents add` schrijft `agents.list[]` en optionele `bindings`.

WhatsApp-inloggegevens komen onder `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sessies worden opgeslagen onder `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Sommige kanalen worden geleverd als plugins. Wanneer ze tijdens setup worden geselecteerd, vraagt de wizard
om de plugin (npm of lokaal pad) te installeren vóór de kanaalconfiguratie.
</Note>

RPC van Gateway-wizard:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-app en Control UI) kunnen stappen weergeven zonder onboardinglogica opnieuw te implementeren.

Gedrag van Signal-setup:

- Downloadt de juiste release-asset
- Slaat deze op onder `~/.openclaw/tools/signal-cli/<version>/`
- Schrijft `channels.signal.cliPath` in de configuratie
- JVM-builds vereisen Java 21
- Native builds worden gebruikt wanneer beschikbaar
- Windows gebruikt WSL2 en volgt de Linux signal-cli-flow binnen WSL

## Gerelateerde documentatie

- Onboarding-hub: [Onboarding (CLI)](/nl/start/wizard)
- Automatisering en scripts: [CLI-automatisering](/nl/start/wizard-cli-automation)
- Opdrachtenreferentie: [`openclaw onboard`](/nl/cli/onboard)
