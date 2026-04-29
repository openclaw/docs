---
read_when:
    - CLI-introductie uitvoeren of configureren
    - Een nieuwe machine instellen
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-onboarding: begeleide configuratie voor Gateway, werkruimte, kanalen en Skills'
title: Introductie (CLI)
x-i18n:
    generated_at: "2026-04-29T23:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI-onboarding is de **aanbevolen** manier om OpenClaw in te stellen op macOS,
Linux of Windows (via WSL2; sterk aanbevolen).
Het configureert een lokale Gateway of een externe Gateway-verbinding, plus kanalen, Skills
en werkruimte-standaarden in één begeleide flow.

```bash
openclaw onboard
```

<Info>
Snelste eerste chat: open de Control UI (geen kanaalconfiguratie nodig). Voer
`openclaw dashboard` uit en chat in de browser. Documentatie: [Dashboard](/nl/web/dashboard).
</Info>

Om later opnieuw te configureren:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik voor scripts `--non-interactive`.
</Note>

<Tip>
CLI-onboarding bevat een stap voor webzoekopdrachten waarin je een provider kunt kiezen,
zoals Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG of Tavily. Sommige providers vereisen een
API-sleutel, terwijl andere geen sleutel nodig hebben. Je kunt dit later ook configureren met
`openclaw configure --section web`. Documentatie: [Webtools](/nl/tools/web).
</Tip>

## QuickStart versus Advanced

Onboarding begint met **QuickStart** (standaarden) versus **Advanced** (volledige controle).

<Tabs>
  <Tab title="QuickStart (standaarden)">
    - Lokale gateway (loopback)
    - Werkruimte-standaard (of bestaande werkruimte)
    - Gateway-poort **18789**
    - Gateway-authenticatie **Token** (automatisch gegenereerd, zelfs op loopback)
    - Standaard toolbeleid voor nieuwe lokale installaties: `tools.profile: "coding"` (bestaand expliciet profiel blijft behouden)
    - Standaard DM-isolatie: lokale onboarding schrijft `session.dmScope: "per-channel-peer"` wanneer niet ingesteld. Details: [CLI-installatiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-blootstelling **Uit**
    - Telegram- en WhatsApp-DM's gebruiken standaard **allowlist** (je wordt om je telefoonnummer gevraagd)

  </Tab>
  <Tab title="Advanced (volledige controle)">
    - Toont elke stap (modus, werkruimte, gateway, kanalen, daemon, Skills).

  </Tab>
</Tabs>

## Wat onboarding configureert

**Lokale modus (standaard)** leidt je door deze stappen:

1. **Model/Auth** — kies een ondersteunde provider/auth-flow (API-sleutel, OAuth of providerspecifieke handmatige auth), inclusief Custom Provider
   (OpenAI-compatibel, Anthropic-compatibel of Unknown automatische detectie). Kies een standaardmodel.
   Beveiligingsopmerking: als deze agent tools gaat uitvoeren of Webhook-/hooks-inhoud verwerkt, geef dan de voorkeur aan het sterkste beschikbare model van de nieuwste generatie en houd het toolbeleid strikt. Zwakkere/oudere niveaus zijn gemakkelijker via prompts te injecteren.
   Voor niet-interactieve runs slaat `--secret-input-mode ref` env-ondersteunde refs op in auth-profielen in plaats van platte-tekstwaarden van API-sleutels.
   In niet-interactieve `ref`-modus moet de provider-env-var zijn ingesteld; inline sleutelvlaggen doorgeven zonder die env-var faalt direct.
   In interactieve runs kun je met de modus voor geheime referenties verwijzen naar een omgevingsvariabele of een geconfigureerde provider-ref (`file` of `exec`), met een snelle preflightvalidatie voordat wordt opgeslagen.
   Voor Anthropic biedt interactieve onboarding/configure **Anthropic Claude CLI** als de voorkeursroute lokaal en **Anthropic API key** als de aanbevolen productieroute. Anthropic setup-token blijft ook beschikbaar als ondersteund pad voor token-auth.
2. **Werkruimte** — locatie voor agentbestanden (standaard `~/.openclaw/workspace`). Plaatst bootstrapbestanden.
3. **Gateway** — poort, bindadres, auth-modus, Tailscale-blootstelling.
   Kies in interactieve tokenmodus standaardopslag van tokens als platte tekst of kies voor SecretRef.
   Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanalen** — ingebouwde en gebundelde chatkanalen zoals BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp en meer.
5. **Daemon** — installeert een LaunchAgent (macOS), systemd-gebruikerseenheid (Linux/WSL2) of native Windows Scheduled Task met per-gebruiker Startup-mapfallback.
   Als token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert de daemoninstallatie dit maar blijft het opgeloste token niet bewaard in metadata van de supervisor-serviceomgeving.
   Als token-auth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, wordt daemoninstallatie geblokkeerd met uitvoerbare aanwijzingen.
   Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt daemoninstallatie geblokkeerd totdat de modus expliciet is ingesteld.
6. **Gezondheidscontrole** — start de Gateway en verifieert dat deze draait.
7. **Skills** — installeert aanbevolen Skills en optionele afhankelijkheden.

<Note>
Onboarding opnieuw uitvoeren wist **niets**, tenzij je expliciet **Reset** kiest (of `--reset` doorgeeft).
CLI `--reset` gebruikt standaard configuratie, referenties en sessies; gebruik `--reset-scope full` om de werkruimte mee te nemen.
Als de configuratie ongeldig is of verouderde sleutels bevat, vraagt onboarding je eerst `openclaw doctor` uit te voeren.
</Note>

**Externe modus** configureert alleen de lokale client om verbinding te maken met een Gateway elders.
Deze installeert of wijzigt **niets** op de externe host.

## Nog een agent toevoegen

Gebruik `openclaw agents add <name>` om een aparte agent te maken met een eigen werkruimte,
sessies en auth-profielen. Uitvoeren zonder `--workspace` start onboarding.

Wat dit instelt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Opmerkingen:

- Standaardwerkruimten volgen `~/.openclaw/workspace-<agentId>`.
- Voeg `bindings` toe om inkomende berichten te routeren (onboarding kan dit doen).
- Niet-interactieve vlaggen: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Volledige referentie

Zie voor gedetailleerde stapsgewijze uitsplitsingen en configuratie-uitvoer
[CLI-installatiereferentie](/nl/start/wizard-cli-reference).
Zie voor niet-interactieve voorbeelden [CLI-automatisering](/nl/start/wizard-cli-automation).
Zie voor de diepere technische referentie, inclusief RPC-details,
[Onboardingreferentie](/nl/reference/wizard).

## Gerelateerde documentatie

- CLI-opdrachtenreferentie: [`openclaw onboard`](/nl/cli/onboard)
- Onboarding-overzicht: [Onboarding-overzicht](/nl/start/onboarding-overview)
- macOS-app-onboarding: [Onboarding](/nl/start/onboarding)
- Ritueel voor eerste agentstart: [Agent-bootstrapping](/nl/start/bootstrapping)
