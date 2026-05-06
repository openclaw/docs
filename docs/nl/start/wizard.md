---
read_when:
    - CLI-introductie uitvoeren of configureren
    - Een nieuwe machine instellen
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-introductie: begeleide configuratie voor Gateway, werkruimte, kanalen en Skills'
title: Introductie (CLI)
x-i18n:
    generated_at: "2026-05-06T09:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI-onboarding is de **aanbevolen** manier om OpenClaw in te stellen op macOS,
Linux of Windows (via WSL2; sterk aanbevolen).
Hiermee configureer je een lokale Gateway of een externe Gateway-verbinding, plus kanalen, Skills,
en standaardinstellingen voor de werkruimte in één begeleide flow.

```bash
openclaw onboard
```

<Info>
Snelste eerste chat: open de Control UI (geen kanaalinstelling nodig). Voer
`openclaw dashboard` uit en chat in de browser. Documentatie: [Dashboard](/nl/web/dashboard).
</Info>

Later opnieuw configureren:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik voor scripts `--non-interactive`.
</Note>

<Tip>
CLI-onboarding bevat een webzoekstap waarin je een provider kunt kiezen
zoals Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG of Tavily. Sommige providers vereisen een
API-sleutel, terwijl andere geen sleutel nodig hebben. Je kunt dit later ook configureren met
`openclaw configure --section web`. Documentatie: [Webtools](/nl/tools/web).
</Tip>

## Snelstart versus geavanceerd

Onboarding begint met **Snelstart** (standaardinstellingen) versus **Geavanceerd** (volledige controle).

<Tabs>
  <Tab title="Snelstart (standaardinstellingen)">
    - Lokale Gateway (loopback)
    - Standaardwerkruimte (of bestaande werkruimte)
    - Gateway-poort **18789**
    - Gateway-authenticatie **Token** (automatisch gegenereerd, zelfs op loopback)
    - Standaard toolbeleid voor nieuwe lokale instellingen: `tools.profile: "coding"` (bestaand expliciet profiel blijft behouden)
    - Standaard DM-isolatie: lokale onboarding schrijft `session.dmScope: "per-channel-peer"` wanneer dit niet is ingesteld. Details: [CLI-installatiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-blootstelling **Uit**
    - Telegram- en WhatsApp-DM's gebruiken standaard **allowlist** (je wordt om je telefoonnummer gevraagd)

  </Tab>
  <Tab title="Geavanceerd (volledige controle)">
    - Toont elke stap (modus, werkruimte, Gateway, kanalen, daemon, Skills).

  </Tab>
</Tabs>

## Wat onboarding configureert

**Lokale modus (standaard)** leidt je door deze stappen:

1. **Model/authenticatie** — kies een ondersteunde provider/authenticatieflow (API-sleutel, OAuth of providerspecifieke handmatige authenticatie), inclusief Custom Provider
   (OpenAI-compatibel, Anthropic-compatibel of automatische detectie van Onbekend). Kies een standaardmodel.
   Beveiligingsopmerking: als deze agent tools uitvoert of Webhook-/hooks-inhoud verwerkt, kies dan bij voorkeur het sterkste beschikbare model van de nieuwste generatie en houd het toolbeleid strikt. Zwakkere/oudere niveaus zijn makkelijker te prompt-injecteren.
   Voor niet-interactieve uitvoeringen slaat `--secret-input-mode ref` omgevingsvariabele-ondersteunde refs op in authenticatieprofielen in plaats van API-sleutelwaarden in platte tekst.
   In niet-interactieve `ref`-modus moet de provider-omgevingsvariabele zijn ingesteld; inline sleutelvlaggen doorgeven zonder die omgevingsvariabele mislukt snel.
   In interactieve uitvoeringen kun je met geheime-referentiemodus wijzen naar een omgevingsvariabele of een geconfigureerde provider-ref (`file` of `exec`), met snelle preflightvalidatie voordat er wordt opgeslagen.
   Voor Anthropic biedt interactieve onboarding/configure **Anthropic Claude CLI** als het aanbevolen lokale pad en **Anthropic API key** als het aanbevolen productiepad. Anthropic setup-token blijft ook beschikbaar als ondersteund token-authenticatiepad.
2. **Werkruimte** — locatie voor agentbestanden (standaard `~/.openclaw/workspace`). Plaatst bootstrapbestanden.
3. **Gateway** — poort, bindadres, authenticatiemodus, Tailscale-blootstelling.
   Kies in interactieve tokenmodus standaard tokenopslag in platte tekst of kies voor SecretRef.
   Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanalen** — ingebouwde en meegeleverde chatkanalen zoals BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp en meer.
5. **Daemon** — installeert een LaunchAgent (macOS), systemd-gebruikerseenheid (Linux/WSL2) of native Windows Scheduled Task met fallback naar de Startup-map per gebruiker.
   Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert daemoninstallatie dit maar wordt het opgeloste token niet persistent opgeslagen in de metadata van de supervisor-serviceomgeving.
   Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, wordt daemoninstallatie geblokkeerd met uitvoerbare begeleiding.
   Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt daemoninstallatie geblokkeerd totdat de modus expliciet is ingesteld.
6. **Gezondheidscontrole** — start de Gateway en verifieert dat deze draait.
7. **Skills** — installeert aanbevolen Skills en optionele afhankelijkheden.

<Note>
Onboarding opnieuw uitvoeren wist **niets**, tenzij je expliciet **Reset** kiest (of `--reset` doorgeeft).
CLI `--reset` is standaard van toepassing op configuratie, referenties en sessies; gebruik `--reset-scope full` om de werkruimte mee te nemen.
Als de configuratie ongeldig is of verouderde sleutels bevat, vraagt onboarding je eerst `openclaw doctor` uit te voeren.
</Note>

**Externe modus** configureert alleen de lokale client om verbinding te maken met een Gateway elders.
Deze installeert of wijzigt **niets** op de externe host.

## Nog een agent toevoegen

Gebruik `openclaw agents add <name>` om een afzonderlijke agent te maken met een eigen werkruimte,
sessies en authenticatieprofielen. Uitvoeren zonder `--workspace` start onboarding.

Wat dit instelt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Opmerkingen:

- Standaardwerkruimten volgen `~/.openclaw/workspace-<agentId>`.
- Voeg `bindings` toe om inkomende berichten te routeren (onboarding kan dit doen).
- Niet-interactieve vlaggen: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Volledige referentie

Zie voor gedetailleerde stapsgewijze uitleg en configuratie-uitvoer de
[CLI-installatiereferentie](/nl/start/wizard-cli-reference).
Zie voor niet-interactieve voorbeelden [CLI-automatisering](/nl/start/wizard-cli-automation).
Zie voor de diepere technische referentie, inclusief RPC-details,
[Onboardingreferentie](/nl/reference/wizard).

## Gerelateerde documentatie

- CLI-opdrachtreferentie: [`openclaw onboard`](/nl/cli/onboard)
- Onboardingoverzicht: [Onboardingoverzicht](/nl/start/onboarding-overview)
- macOS-app-onboarding: [Onboarding](/nl/start/onboarding)
- Eerste-opstart-ritueel voor agent: [Agentbootstrapping](/nl/start/bootstrapping)
