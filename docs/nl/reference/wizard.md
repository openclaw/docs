---
read_when:
    - Een specifieke onboardingstap of vlag opzoeken
    - Onboarding automatiseren met niet-interactieve modus
    - Onboardinggedrag debuggen
sidebarTitle: Onboarding Reference
summary: 'Volledige referentie voor CLI-onboarding: elke stap, flag en configuratieveld'
title: Onboardingreferentie
x-i18n:
    generated_at: "2026-05-11T20:49:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

Dit is de volledige referentie voor `openclaw onboard`.
Voor een overzicht op hoofdlijnen, zie [Onboarding (CLI)](/nl/start/wizard).

## Flowdetails (lokale modus)

<Steps>
  <Step title="Detectie van bestaande configuratie">
    - Als `~/.openclaw/openclaw.json` bestaat, kies je **Huidige waarden behouden**, **Controleren en bijwerken** of **Resetten vóór configuratie**.
    - Onboarding opnieuw uitvoeren wist **niets**, tenzij je expliciet **Resetten** kiest
      (of `--reset` meegeeft).
    - CLI `--reset` gebruikt standaard `config+creds+sessions`; gebruik `--reset-scope full`
      om ook de werkruimte te verwijderen.
    - Als de configuratie ongeldig is of verouderde sleutels bevat, stopt de wizard en vraagt
      hij je `openclaw doctor` uit te voeren voordat je doorgaat.
    - Reset gebruikt `trash` (nooit `rm`) en biedt scopes:
      - Alleen configuratie
      - Configuratie + referenties + sessies
      - Volledige reset (verwijdert ook de werkruimte)

  </Step>
  <Step title="Model/authenticatie">
    - **Anthropic API-sleutel**: gebruikt `ANTHROPIC_API_KEY` als die aanwezig is, of vraagt om een sleutel, en slaat die vervolgens op voor gebruik door de daemon.
    - **Anthropic API-sleutel**: aanbevolen Anthropic-assistentkeuze in onboarding/configuratie.
    - **Anthropic setup-token**: nog steeds beschikbaar in onboarding/configuratie, hoewel OpenClaw nu de voorkeur geeft aan hergebruik van Claude CLI wanneer beschikbaar.
    - **OpenAI Code (Codex)-abonnement (OAuth)**: browserflow; plak de `code#state`.
      - Zet `agents.defaults.model` op `openai/gpt-5.5` via de Codex-runtime wanneer het model niet is ingesteld of al tot de OpenAI-familie behoort.
    - **OpenAI Code (Codex)-abonnement (apparaatkoppeling)**: browserkoppelingsflow met een kortlevende apparaatcode.
      - Zet `agents.defaults.model` op `openai/gpt-5.5` via de Codex-runtime wanneer het model niet is ingesteld of al tot de OpenAI-familie behoort.
    - **OpenAI API-sleutel**: gebruikt `OPENAI_API_KEY` als die aanwezig is, of vraagt om een sleutel, en slaat die vervolgens op in authenticatieprofielen.
      - Zet `agents.defaults.model` op `openai/gpt-5.5` wanneer het model niet is ingesteld, `openai/*` is, of `openai-codex/*` is.
    - **xAI (Grok) API-sleutel**: vraagt om `XAI_API_KEY` en configureert xAI als modelprovider.
    - **OpenCode**: vraagt om `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`, verkrijgbaar via https://opencode.ai/auth) en laat je de Zen- of Go-catalogus kiezen.
    - **Ollama**: biedt eerst **Cloud + lokaal**, **Alleen cloud** of **Alleen lokaal**. `Cloud only` vraagt om `OLLAMA_API_KEY` en gebruikt `https://ollama.com`; de hostgebaseerde modi vragen om de Ollama-basis-URL, ontdekken beschikbare modellen en halen het geselecteerde lokale model automatisch op wanneer nodig; `Cloud + Local` controleert ook of die Ollama-host is aangemeld voor cloudtoegang.
    - Meer details: [Ollama](/nl/providers/ollama)
    - **API-sleutel**: slaat de sleutel voor je op.
    - **Vercel AI Gateway (multi-modelproxy)**: vraagt om `AI_GATEWAY_API_KEY`.
    - Meer details: [Vercel AI Gateway](/nl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: vraagt om Account ID, Gateway ID en `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Meer details: [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
    - **MiniMax**: configuratie wordt automatisch geschreven; de gehoste standaardwaarde is `MiniMax-M2.7`.
      API-sleutelconfiguratie gebruikt `minimax/...`, en OAuth-configuratie gebruikt
      `minimax-portal/...`.
    - Meer details: [MiniMax](/nl/providers/minimax)
    - **StepFun**: configuratie wordt automatisch geschreven voor StepFun standard of Step Plan op Chinese of globale eindpunten.
    - Standard bevat momenteel `step-3.5-flash`, en Step Plan bevat ook `step-3.5-flash-2603`.
    - Meer details: [StepFun](/nl/providers/stepfun)
    - **Synthetic (Anthropic-compatibel)**: vraagt om `SYNTHETIC_API_KEY`.
    - Meer details: [Synthetic](/nl/providers/synthetic)
    - **Moonshot (Kimi K2)**: configuratie wordt automatisch geschreven.
    - **Kimi Coding**: configuratie wordt automatisch geschreven.
    - Meer details: [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot)
    - **Overslaan**: nog geen authenticatie geconfigureerd.
    - Kies een standaardmodel uit de gedetecteerde opties (of voer provider/model handmatig in). Kies voor de beste kwaliteit en een lager risico op prompt-injectie het sterkste model van de nieuwste generatie dat beschikbaar is in je providerstack.
    - Onboarding voert een modelcontrole uit en waarschuwt als het geconfigureerde model onbekend is of authenticatie ontbreekt.
    - De opslagmodus voor API-sleutels gebruikt standaard plattetekstwaarden in authenticatieprofielen. Gebruik `--secret-input-mode ref` om in plaats daarvan door de omgeving ondersteunde refs op te slaan (bijvoorbeeld `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Authenticatieprofielen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-sleutels + OAuth). `~/.openclaw/credentials/oauth.json` is alleen een verouderde importbron.
    - Meer details: [/concepts/oauth](/nl/concepts/oauth)
    <Note>
    Tip voor headless/server: voltooi OAuth op een machine met een browser en kopieer daarna
    de `auth-profiles.json` van die agent (bijvoorbeeld
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, of het bijbehorende
    `$OPENCLAW_STATE_DIR/...`-pad) naar de gatewayhost. `credentials/oauth.json`
    is alleen een verouderde importbron.
    </Note>
  </Step>
  <Step title="Werkruimte">
    - Standaard `~/.openclaw/workspace` (configureerbaar).
    - Plaatst de werkruimtebestanden die nodig zijn voor het agent-bootstrapritueel.
    - Volledige werkruimte-indeling + back-upgids: [Agentwerkruimte](/nl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Poort, bind, authenticatiemodus, Tailscale-blootstelling.
    - Authenticatieaanbeveling: behoud **Token**, zelfs voor loopback, zodat lokale WS-clients zich moeten authenticeren.
    - In tokenmodus biedt interactieve configuratie:
      - **Platteteksttoken genereren/opslaan** (standaard)
      - **SecretRef gebruiken** (opt-in)
      - Quickstart hergebruikt bestaande `gateway.auth.token` SecretRefs via `env`-, `file`- en `exec`-providers voor onboardingprobe/dashboardbootstrap.
      - Als die SecretRef is geconfigureerd maar niet kan worden opgelost, faalt onboarding vroeg met een duidelijke herstelmelding in plaats van stilzwijgend runtime-authenticatie te verzwakken.
    - In wachtwoordmodus ondersteunt interactieve configuratie ook opslag als plattetekst of SecretRef.
    - Niet-interactief SecretRef-pad voor token: `--gateway-token-ref-env <ENV_VAR>`.
      - Vereist een niet-lege omgevingsvariabele in de procesomgeving van onboarding.
      - Kan niet worden gecombineerd met `--gateway-token`.
    - Schakel authenticatie alleen uit als je elk lokaal proces volledig vertrouwt.
    - Niet-loopback-binds vereisen nog steeds authenticatie.

  </Step>
  <Step title="Kanalen">
    - [WhatsApp](/nl/channels/whatsapp): optionele QR-login.
    - [Telegram](/nl/channels/telegram): bottoken.
    - [Discord](/nl/channels/discord): bottoken.
    - [Google Chat](/nl/channels/googlechat): serviceaccount-JSON + webhookdoelgroep.
    - [Mattermost](/nl/channels/mattermost) (Plugin): bottoken + basis-URL.
    - [Signal](/nl/channels/signal): optionele installatie van `signal-cli` + accountconfiguratie.
    - [iMessage](/nl/channels/imessage): `imsg` CLI-pad + toegang tot Messages DB; gebruik een SSH-wrapper wanneer de Gateway niet op een Mac draait.
    - DM-beveiliging: standaard is koppeling. De eerste DM stuurt een code; keur goed via `openclaw pairing approve <channel> <code>` of gebruik toelatingslijsten.

  </Step>
  <Step title="Zoeken op het web">
    - Kies een ondersteunde provider zoals Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG of Tavily (of sla over).
    - API-gebaseerde providers kunnen omgevingsvariabelen of bestaande configuratie gebruiken voor snelle configuratie; providers zonder sleutel gebruiken in plaats daarvan hun providerspecifieke vereisten.
    - Sla over met `--skip-search`.
    - Later configureren: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon installeren">
    - macOS: LaunchAgent
      - Vereist een aangemelde gebruikerssessie; gebruik voor headless een aangepaste LaunchDaemon (niet meegeleverd).
    - Linux (en Windows via WSL2): systemd-gebruikerseenheid
      - Onboarding probeert lingering in te schakelen via `loginctl enable-linger <user>`, zodat de Gateway actief blijft na uitloggen.
      - Kan om sudo vragen (schrijft `/var/lib/systemd/linger`); het probeert het eerst zonder sudo.
    - **Runtimekeuze:** Node (aanbevolen; vereist voor WhatsApp/Telegram). Bun wordt **niet aanbevolen**.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert daemoninstallatie dit maar bewaart geen opgeloste platteteksttokenwaarden in omgevingsmetadata van de supervisorservice.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, wordt daemoninstallatie geblokkeerd met bruikbare begeleiding.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt daemoninstallatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Step>
  <Step title="Gezondheidscontrole">
    - Start de Gateway (indien nodig) en voert `openclaw health` uit.
    - Tip: `openclaw status --deep` voegt de live gatewaygezondheidsprobe toe aan de statusuitvoer, inclusief kanaalprobes wanneer ondersteund (vereist een bereikbare gateway).

  </Step>
  <Step title="Skills (aanbevolen)">
    - Leest de beschikbare Skills en controleert vereisten.
    - Laat je een nodebeheerder kiezen: **npm / pnpm** (bun niet aanbevolen).
    - Installeert optionele afhankelijkheden (sommige gebruiken Homebrew op macOS).

  </Step>
  <Step title="Afronden">
    - Samenvatting + volgende stappen, inclusief de prompt **Hoe wil je je agent uitbroeden?** voor Terminal, Browser of later.

  </Step>
</Steps>

<Note>
Als er geen GUI wordt gedetecteerd, drukt onboarding SSH-port-forwardinstructies af voor de Control UI in plaats van een browser te openen.
Als de Control UI-assets ontbreken, probeert onboarding ze te bouwen; de fallback is `pnpm ui:build` (installeert UI-afhankelijkheden automatisch).
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

Gateway-token SecretRef in niet-interactieve modus:

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
`--json` impliceert **niet** de niet-interactieve modus. Gebruik `--non-interactive` (en `--workspace`) voor scripts.
</Note>

Providerspecifieke opdrachtvoorbeelden staan in [CLI-automatisering](/nl/start/wizard-cli-automation#provider-specific-examples).
Gebruik deze referentiepagina voor vlagsemantiek en stapvolgorde.

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

- Downloadt het juiste release-asset.
- Slaat het op onder `~/.openclaw/tools/signal-cli/<version>/`.
- Schrijft `channels.signal.cliPath` naar je configuratie.

Opmerkingen:

- JVM-builds vereisen **Java 21**.
- Native builds worden gebruikt wanneer beschikbaar.
- Windows gebruikt WSL2; installatie van signal-cli volgt de Linux-flow binnen WSL.

## Wat de wizard schrijft

Typische velden in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (als Minimax is gekozen)
- `tools.profile` (lokale introductie gebruikt standaard `"coding"` wanneer niet ingesteld; bestaande expliciete waarden blijven behouden)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (gedragsdetails: [CLI-configuratiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Toegestane kanalenlijsten (Slack/Discord/Matrix/Microsoft Teams) wanneer je je tijdens de prompts aanmeldt (namen worden waar mogelijk omgezet naar ID's).
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

Sommige kanalen worden geleverd als plugins. Wanneer je er tijdens de configuratie
een kiest, vraagt de introductie om deze te installeren (npm of een lokaal pad) voordat deze kan worden geconfigureerd.

## Gerelateerde documentatie

- Overzicht van introductie: [Introductie (CLI)](/nl/start/wizard)
- Introductie voor macOS-app: [Introductie](/nl/start/onboarding)
- Configuratiereferentie: [Gateway-configuratie](/nl/gateway/configuration)
- Providers: [WhatsApp](/nl/channels/whatsapp), [Telegram](/nl/channels/telegram), [Discord](/nl/channels/discord), [Google Chat](/nl/channels/googlechat), [Signal](/nl/channels/signal), [iMessage](/nl/channels/imessage)
- Skills: [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config)
