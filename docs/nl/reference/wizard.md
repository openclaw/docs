---
read_when:
    - Een specifieke onboardingstap of vlag opzoeken
    - Onboarding automatiseren met niet-interactieve modus
    - Onboardinggedrag debuggen
sidebarTitle: Onboarding Reference
summary: 'Volledige referentie voor CLI-onboarding: elke stap, flag en configuratieveld'
title: Onboardingreferentie
x-i18n:
    generated_at: "2026-06-27T18:21:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Dit is de volledige referentie voor `openclaw onboard`.
Zie [Onboarding (CLI)](/nl/start/wizard) voor een overzicht op hoofdlijnen.

## Flowdetails (lokale modus)

<Steps>
  <Step title="Existing config detection">
    - Als `~/.openclaw/openclaw.json` bestaat, kies je **Huidige waarden behouden**, **Bekijken en bijwerken** of **Resetten vóór configuratie**.
    - Onboarding opnieuw uitvoeren wist **niets**, tenzij je expliciet **Reset** kiest
      (of `--reset` meegeeft).
    - CLI `--reset` gebruikt standaard `config+creds+sessions`; gebruik `--reset-scope full`
      om ook de werkruimte te verwijderen.
    - Als de configuratie ongeldig is of verouderde sleutels bevat, stopt de wizard en vraagt die
      je om `openclaw doctor` uit te voeren voordat je doorgaat.
    - Reset gebruikt `trash` (nooit `rm`) en biedt scopes:
      - Alleen configuratie
      - Configuratie + referenties + sessies
      - Volledige reset (verwijdert ook de werkruimte)

  </Step>
  <Step title="Model/Auth">
    - **Anthropic API-sleutel**: gebruikt `ANTHROPIC_API_KEY` als die aanwezig is of vraagt om een sleutel, en slaat die vervolgens op voor gebruik door de daemon.
    - **Anthropic API-sleutel**: voorkeurskeuze voor de Anthropic-assistent in onboarding/configure.
    - **Anthropic setup-token**: nog steeds beschikbaar in onboarding/configure, hoewel OpenClaw nu de voorkeur geeft aan hergebruik van Claude CLI wanneer beschikbaar.
    - **OpenAI Code (Codex)-abonnement (OAuth)**: browserflow; plak de `code#state`.
      - Stelt `agents.defaults.model` via de Codex-runtime in op `openai/gpt-5.5` wanneer model niet is ingesteld of al tot de OpenAI-familie behoort.
    - **OpenAI Code (Codex)-abonnement (apparaatkoppeling)**: browserkoppelingsflow met een kortlevende apparaatcode.
      - Stelt `agents.defaults.model` via de Codex-runtime in op `openai/gpt-5.5` wanneer model niet is ingesteld of al tot de OpenAI-familie behoort.
    - **OpenAI API-sleutel**: gebruikt `OPENAI_API_KEY` als die aanwezig is of vraagt om een sleutel, en slaat die vervolgens op in auth-profielen.
      - Stelt `agents.defaults.model` in op `openai/gpt-5.5` wanneer model niet is ingesteld, `openai/*` is, of verouderde Codex-modelreferenties gebruikt.
    - **xAI (Grok) OAuth / API-sleutel**: meldt aan met xAI OAuth wanneer gekozen, of vraagt om `XAI_API_KEY` op het API-sleutelpad, en configureert xAI als modelprovider.
    - **OpenCode**: vraagt om `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`, verkrijg die op https://opencode.ai/auth) en laat je de Zen- of Go-catalogus kiezen.
    - **Ollama**: biedt eerst **Cloud + Lokaal**, **Alleen cloud** of **Alleen lokaal**. `Cloud only` vraagt om `OLLAMA_API_KEY` en gebruikt `https://ollama.com`; de host-backed modi vragen om de Ollama-basis-URL, ontdekken beschikbare modellen en halen het geselecteerde lokale model automatisch op wanneer nodig; `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
    - Meer details: [Ollama](/nl/providers/ollama)
    - **API-sleutel**: slaat de sleutel voor je op.
    - **Vercel AI Gateway (proxy voor meerdere modellen)**: vraagt om `AI_GATEWAY_API_KEY`.
    - Meer details: [Vercel AI Gateway](/nl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: vraagt om Account-ID, Gateway-ID en `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Meer details: [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
    - **MiniMax**: configuratie wordt automatisch geschreven; gehoste standaard is `MiniMax-M3`.
      API-sleutelconfiguratie gebruikt `minimax/...`, en OAuth-configuratie gebruikt
      `minimax-portal/...`.
    - Meer details: [MiniMax](/nl/providers/minimax)
    - **StepFun**: configuratie wordt automatisch geschreven voor StepFun standard of Step Plan op Chinese of wereldwijde eindpunten.
    - Standard bevat momenteel `step-3.5-flash`, en Step Plan bevat ook `step-3.5-flash-2603`.
    - Meer details: [StepFun](/nl/providers/stepfun)
    - **Synthetic (Anthropic-compatibel)**: vraagt om `SYNTHETIC_API_KEY`.
    - Meer details: [Synthetic](/nl/providers/synthetic)
    - **Moonshot (Kimi K2)**: configuratie wordt automatisch geschreven.
    - **Kimi Coding**: configuratie wordt automatisch geschreven.
    - Meer details: [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot)
    - **Overslaan**: nog geen auth geconfigureerd.
    - Kies een standaardmodel uit de gedetecteerde opties (of voer provider/model handmatig in). Kies voor de beste kwaliteit en lager risico op promptinjectie het sterkste model van de nieuwste generatie dat beschikbaar is in je providerstack.
    - Onboarding voert een modelcontrole uit en waarschuwt als het geconfigureerde model onbekend is of auth ontbreekt.
    - De opslagmodus voor API-sleutels gebruikt standaard platte-tekstwaarden in auth-profielen. Gebruik `--secret-input-mode ref` om in plaats daarvan env-backed refs op te slaan (bijvoorbeeld `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth-profielen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-sleutels + OAuth). `~/.openclaw/credentials/oauth.json` is alleen een verouderde importbron.
    - Meer details: [/concepts/oauth](/nl/concepts/oauth)
    <Note>
    Tip voor headless/server: voltooi OAuth op een machine met een browser en kopieer vervolgens
    de `auth-profiles.json` van die agent (bijvoorbeeld
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, of het bijbehorende
    `$OPENCLAW_STATE_DIR/...`-pad) naar de Gateway-host. `credentials/oauth.json`
    is alleen een verouderde importbron.
    </Note>
  </Step>
  <Step title="Workspace">
    - Standaard `~/.openclaw/workspace` (configureerbaar).
    - Zet de werkruimtebestanden klaar die nodig zijn voor het bootstrapritueel van de agent.
    - Volledige werkruimte-indeling + back-upgids: [Agentwerkruimte](/nl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Poort, bind, auth-modus, Tailscale-blootstelling.
    - Auth-aanbeveling: behoud **Token**, zelfs voor loopback, zodat lokale WS-clients zich moeten authenticeren.
    - In tokenmodus biedt interactieve configuratie:
      - **Platte-teksttoken genereren/opslaan** (standaard)
      - **SecretRef gebruiken** (opt-in)
      - Quickstart hergebruikt bestaande `gateway.auth.token` SecretRefs voor `env`-, `file`- en `exec`-providers voor onboardingprobe/dashboard-bootstrap.
      - Als die SecretRef is geconfigureerd maar niet kan worden opgelost, faalt onboarding vroeg met een duidelijke herstelmelding in plaats van runtime-auth stilzwijgend te degraderen.
    - In wachtwoordmodus ondersteunt interactieve configuratie ook opslag als platte tekst of SecretRef.
    - Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
      - Vereist een niet-lege omgevingsvariabele in de procesomgeving van onboarding.
      - Kan niet worden gecombineerd met `--gateway-token`.
    - Schakel auth alleen uit als je elk lokaal proces volledig vertrouwt.
    - Niet-loopback binds vereisen nog steeds auth.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/nl/channels/whatsapp): optionele QR-login.
    - [Telegram](/nl/channels/telegram): bottoken.
    - [Discord](/nl/channels/discord): bottoken.
    - [Google Chat](/nl/channels/googlechat): serviceaccount-JSON + webhookpubliek.
    - [Mattermost](/nl/channels/mattermost) (plugin): bottoken + basis-URL.
    - [Signal](/nl/channels/signal): optionele installatie van `signal-cli` + accountconfiguratie.
    - [iMessage](/nl/channels/imessage): `imsg` CLI-pad + toegang tot Messages DB; gebruik een SSH-wrapper wanneer de Gateway buiten de Mac draait.
    - DM-beveiliging: standaard is koppeling. De eerste DM stuurt een code; keur goed via `openclaw pairing approve <channel> <code>` of gebruik allowlists.

  </Step>
  <Step title="Web search">
    - Kies een ondersteunde provider zoals Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG of Tavily (of sla over).
    - API-backed providers kunnen env-vars of bestaande configuratie gebruiken voor snelle configuratie; sleutelvrije providers gebruiken in plaats daarvan hun providerspecifieke vereisten.
    - Sla over met `--skip-search`.
    - Later configureren: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Vereist een aangemelde gebruikerssessie; gebruik voor headless een aangepaste LaunchDaemon (niet meegeleverd).
    - Linux (en Windows via WSL2): systemd-gebruikerseenheid
      - Onboarding probeert lingering in te schakelen via `loginctl enable-linger <user>`, zodat de Gateway actief blijft na uitloggen.
      - Kan om sudo vragen (schrijft `/var/lib/systemd/linger`); het probeert eerst zonder sudo.
    - **Runtimeselectie:** Node (aanbevolen; vereist voor WhatsApp/Telegram). Bun wordt **niet aanbevolen**.
    - Als token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert daemoninstallatie dit maar bewaart geen opgeloste platte-teksttokenwaarden in metadata van de supervisorserviceomgeving.
    - Als token-auth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, wordt daemoninstallatie geblokkeerd met uitvoerbare aanwijzingen.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt daemoninstallatie geblokkeerd totdat modus expliciet is ingesteld.

  </Step>
  <Step title="Health check">
    - Start de Gateway (indien nodig) en voert `openclaw health` uit.
    - Tip: `openclaw status --deep` voegt de live gateway-gezondheidsprobe toe aan statusuitvoer, inclusief kanaalprobes wanneer ondersteund (vereist een bereikbare gateway).

  </Step>
  <Step title="Skills (recommended)">
    - Leest de beschikbare Skills en controleert vereisten.
    - Laat je een node manager kiezen: **npm / pnpm** (bun niet aanbevolen).
    - Installeert optionele afhankelijkheden (sommige gebruiken Homebrew op macOS).

  </Step>
  <Step title="Finish">
    - Samenvatting + volgende stappen, inclusief de prompt **Hoe wil je je agent uitbroeden?** voor Terminal, Browser of later.

  </Step>
</Steps>

<Note>
Als er geen GUI wordt gedetecteerd, print onboarding SSH-port-forwardinstructies voor de Control UI in plaats van een browser te openen.
Als de Control UI-assets ontbreken, probeert onboarding ze te bouwen; fallback is `pnpm ui:build` (installeert UI-deps automatisch).
</Note>

## Niet-interactieve modus

Gebruik `--non-interactive` om onboarding te automatiseren of te scripten:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Voeg `--json` toe voor een machineleesbare samenvatting.

Gateway-token-SecretRef in niet-interactieve modus:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` en `--gateway-token-ref-env` sluiten elkaar uit.

<Note>
`--json` impliceert **geen** niet-interactieve modus. Gebruik `--non-interactive` (en `--workspace`) voor scripts.
</Note>

Providerspecifieke commandovoorbeelden staan in [CLI-automatisering](/nl/start/wizard-cli-automation#provider-specific-examples).
Gebruik deze referentiepagina voor de semantiek van flags en de volgorde van stappen.

### Agent toevoegen (niet-interactief)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway-wizard-RPC

De Gateway stelt de onboardingflow beschikbaar via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-app, Control UI) kunnen stappen renderen zonder onboardinglogica opnieuw te implementeren.

## Signal-configuratie (signal-cli)

Onboarding kan `signal-cli` installeren vanuit GitHub-releases:

- Downloadt de juiste release-asset.
- Slaat die op onder `~/.openclaw/tools/signal-cli/<version>/`.
- Schrijft `channels.signal.cliPath` naar je configuratie.

Opmerkingen:

- JVM-builds vereisen **Java 21**.
- Native builds worden gebruikt wanneer beschikbaar.
- Windows gebruikt WSL2; installatie van signal-cli volgt de Linux-flow binnen WSL.

## Wat de wizard schrijft

Typische velden in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (als Minimax is gekozen)
- `tools.profile` (lokale onboarding gebruikt standaard `"coding"` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
- `gateway.*` (modus, binding, verificatie, tailscale)
- `session.dmScope` (gedragsdetails: [CLI-installatiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanaal-toelatingslijsten (Slack/Discord/Matrix/Microsoft Teams) wanneer je je tijdens de prompts aanmeldt (namen worden waar mogelijk naar ID's herleid).
- `skills.install.nodeManager`
  - `setup --node-manager` accepteert `npm`, `pnpm` of `bun`.
  - Handmatige configuratie kan nog steeds `yarn` gebruiken door `skills.install.nodeManager` rechtstreeks in te stellen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` schrijft `agents.list[]` en optionele `bindings`.

WhatsApp-referenties komen onder `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sessies worden opgeslagen onder `~/.openclaw/agents/<agentId>/sessions/`.

Sommige kanalen worden als plugins geleverd. Wanneer je er tijdens de installatie een kiest, vraagt onboarding
om deze te installeren (npm of een lokaal pad) voordat deze kan worden geconfigureerd.

## Gerelateerde documentatie

- Onboarding-overzicht: [Onboarding (CLI)](/nl/start/wizard)
- Onboarding van macOS-app: [Onboarding](/nl/start/onboarding)
- Configuratiereferentie: [Gateway-configuratie](/nl/gateway/configuration)
- Aanbieders: [WhatsApp](/nl/channels/whatsapp), [Telegram](/nl/channels/telegram), [Discord](/nl/channels/discord), [Google Chat](/nl/channels/googlechat), [Signal](/nl/channels/signal), [iMessage](/nl/channels/imessage)
- Skills: [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config)
