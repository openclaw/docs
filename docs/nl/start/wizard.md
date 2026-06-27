---
read_when:
    - CLI-onboarding uitvoeren of configureren
    - Een nieuwe machine instellen
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-onboarding: begeleide configuratie voor Gateway, werkruimte, kanalen en Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-06-27T18:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI-onboarding is het **aanbevolen** installatiepad via de terminal voor OpenClaw op
macOS, Linux of Windows. Windows-desktopgebruikers kunnen ook beginnen met
[Windows Hub](/nl/platforms/windows).
Het configureert een lokale Gateway of een externe Gateway-verbinding, plus kanalen, Skills
en standaardinstellingen voor de werkruimte in één begeleide flow.

```bash
openclaw onboard
```

## Locale

De CLI-wizard lokaliseert vaste onboardingtekst. De locale wordt bepaald via
`OPENCLAW_LOCALE`, daarna `LC_ALL`, daarna `LC_MESSAGES`, daarna `LANG`, en valt
terug op Engels. Ondersteunde wizard-locales zijn `en`, `zh-CN` en `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Namen en stabiele identifiers blijven letterlijk: `OpenClaw`, `Gateway`, `Tailscale`,
commando's, configuratiesleutels, URL's, provider-ID's, model-ID's en plugin-/kanaallabels
worden niet vertaald.

<Info>
Snelste eerste chat: open de Control UI (geen kanaalinstallatie nodig). Voer
`openclaw dashboard` uit en chat in de browser. Docs: [Dashboard](/nl/web/dashboard).
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
`openclaw configure --section web`. Docs: [Webtools](/nl/tools/web).
</Tip>

## QuickStart versus Geavanceerd

Onboarding begint met **QuickStart** (standaardinstellingen) versus **Geavanceerd** (volledige controle).

<Tabs>
  <Tab title="QuickStart (standaardinstellingen)">
    - Lokale Gateway (loopback)
    - Standaardwerkruimte (of bestaande werkruimte)
    - Gateway-poort **18789**
    - Gateway-authenticatie **Token** (automatisch gegenereerd, zelfs op loopback)
    - Standaard toolbeleid voor nieuwe lokale installaties: `tools.profile: "coding"` (bestaand expliciet profiel blijft behouden)
    - Standaard DM-isolatie: lokale onboarding schrijft `session.dmScope: "per-channel-peer"` wanneer niet ingesteld. Details: [CLI-installatiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-blootstelling **Uit**
    - Telegram- en WhatsApp-DM's gebruiken standaard **allowlist** (je wordt om je telefoonnummer gevraagd)

  </Tab>
  <Tab title="Geavanceerd (volledige controle)">
    - Toont elke stap (modus, werkruimte, Gateway, kanalen, daemon, Skills).

  </Tab>
</Tabs>

## Wat onboarding configureert

**Lokale modus (standaard)** leidt je door deze stappen:

1. **Model/authenticatie** — kies een ondersteunde provider-/authenticatieflow (API-sleutel, OAuth of providerspecifieke handmatige authenticatie), inclusief Custom Provider
   (OpenAI-compatibel, Anthropic-compatibel of Unknown automatische detectie). Kies een standaardmodel.
   Beveiligingsopmerking: als deze agent tools gaat uitvoeren of Webhook-/hookinhoud gaat verwerken, geef dan de voorkeur aan het sterkste beschikbare model van de nieuwste generatie en houd het toolbeleid strikt. Zwakkere/oudere niveaus zijn makkelijker te prompt-injecteren.
   Voor niet-interactieve runs slaat `--secret-input-mode ref` door env ondersteunde refs op in authenticatieprofielen in plaats van platte-tekst API-sleutelwaarden.
   In niet-interactieve `ref`-modus moet de provider-env-var zijn ingesteld; inline sleutelvlaggen doorgeven zonder die env-var mislukt direct.
   In interactieve runs kun je met de geheime-referentiemodus wijzen naar een omgevingsvariabele of een geconfigureerde provider-ref (`file` of `exec`), met een snelle preflightvalidatie voordat wordt opgeslagen.
   Voor Anthropic biedt interactieve onboarding/configure **Anthropic Claude CLI** als het aanbevolen lokale pad en **Anthropic API key** als het aanbevolen productiepad. Anthropic setup-token blijft ook beschikbaar als ondersteund token-authenticatiepad.
2. **Werkruimte** — locatie voor agentbestanden (standaard `~/.openclaw/workspace`). Plaatst bootstrapbestanden.
3. **Gateway** — poort, bindadres, authenticatiemodus, Tailscale-blootstelling.
   Kies in interactieve tokenmodus standaard platte-tekst tokenopslag of kies voor SecretRef.
   Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanalen** — ingebouwde en officiële Plugin-chatkanalen zoals iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp en meer.
5. **Daemon** — installeert een LaunchAgent (macOS), systemd-gebruikerseenheid (Linux/WSL2) of native Windows Scheduled Task met per-gebruiker fallback via de Startup-map.
   Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert de daemoninstallatie dit maar bewaart het opgeloste token niet in metadata van de supervisor-serviceomgeving.
   Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, wordt daemoninstallatie geblokkeerd met uitvoerbare begeleiding.
   Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt daemoninstallatie geblokkeerd totdat de modus expliciet is ingesteld.
6. **Gezondheidscontrole** — start de Gateway en verifieert dat deze actief is.
7. **Skills** — installeert aanbevolen Skills en optionele afhankelijkheden.

<Note>
Onboarding opnieuw uitvoeren wist **niets**, tenzij je expliciet **Resetten** kiest (of `--reset` doorgeeft).
CLI `--reset` is standaard van toepassing op configuratie, referenties en sessies; gebruik `--reset-scope full` om de werkruimte mee te nemen.
Als de configuratie ongeldig is of legacy-sleutels bevat, vraagt onboarding je eerst `openclaw doctor` uit te voeren.
</Note>

**Externe modus** configureert alleen de lokale client om verbinding te maken met een Gateway elders.
Het installeert of wijzigt **niets** op de externe host.

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

Zie voor gedetailleerde stapsgewijze uitsplitsingen en configuratie-uitvoer
[CLI-installatiereferentie](/nl/start/wizard-cli-reference).
Zie voor niet-interactieve voorbeelden [CLI-automatisering](/nl/start/wizard-cli-automation).
Zie voor de diepere technische referentie, inclusief RPC-details,
[Onboardingreferentie](/nl/reference/wizard).

## Gerelateerde docs

- CLI-commandoreferentie: [`openclaw onboard`](/nl/cli/onboard)
- Onboardingoverzicht: [Onboardingoverzicht](/nl/start/onboarding-overview)
- macOS-app-onboarding: [Onboarding](/nl/start/onboarding)
- Eerste-run-ritueel voor agent: [Agent-bootstrapping](/nl/start/bootstrapping)
