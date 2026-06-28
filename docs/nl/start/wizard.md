---
read_when:
    - CLI-onboarding uitvoeren of configureren
    - Een nieuwe machine instellen
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-onboarding: begeleide configuratie voor Gateway, werkruimte, kanalen en Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

CLI-onboarding is het **aanbevolen** terminalinstallatiepad voor OpenClaw op
macOS, Linux of Windows. Windows-desktopgebruikers kunnen ook beginnen met
[Windows Hub](/nl/platforms/windows).
Het configureert een lokale Gateway of een externe Gateway-verbinding, plus kanalen, Skills
en standaardinstellingen voor de werkruimte in één begeleide flow.

```bash
openclaw onboard
```

Snelstart duurt meestal maar een paar minuten, maar volledige onboarding kan langer duren
wanneer inloggen bij een aanbieder, kanaalkoppeling, daemoninstallatie, netwerkdownloads,
Skills of optionele Plugins extra configuratie nodig hebben. De wizard toont deze tijdlijn
vooraf, en optionele stappen kunnen worden overgeslagen en later opnieuw worden geopend met
`openclaw configure`.

## Locale

De CLI-wizard lokaliseert vaste onboardingtekst. De locale wordt bepaald via
`OPENCLAW_LOCALE`, daarna `LC_ALL`, daarna `LC_MESSAGES`, daarna `LANG`, met
Engels als terugval. Ondersteunde wizardlocales zijn `en`, `zh-CN` en `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Namen en stabiele identifiers blijven letterlijk: `OpenClaw`, `Gateway`, `Tailscale`,
opdrachten, configuratiesleutels, URL's, aanbieder-ID's, model-ID's en Plugin-/kanaallabels
worden niet vertaald.

<Info>
Snelste eerste chat: open de Control UI (geen kanaalconfiguratie nodig). Voer
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
CLI-onboarding bevat een webzoekstap waarin je een aanbieder kunt kiezen,
zoals Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG of Tavily. Sommige aanbieders vereisen een
API-sleutel, terwijl andere geen sleutel nodig hebben. Je kunt dit later ook configureren met
`openclaw configure --section web`. Docs: [Webtools](/nl/tools/web).
</Tip>

## Snelstart versus Geavanceerd

Onboarding begint met **Snelstart** (standaardinstellingen) versus **Geavanceerd** (volledige controle).

<Tabs>
  <Tab title="Snelstart (standaardinstellingen)">
    - Lokale Gateway (loopback)
    - Standaardwerkruimte (of bestaande werkruimte)
    - Gateway-poort **18789**
    - Gateway-authenticatie **Token** (automatisch gegenereerd, zelfs op loopback)
    - Standaardtoolbeleid voor nieuwe lokale installaties: `tools.profile: "coding"` (bestaand expliciet profiel blijft behouden)
    - Standaard DM-isolatie: lokale onboarding schrijft `session.dmScope: "per-channel-peer"` wanneer niet ingesteld. Details: [CLI-installatiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-blootstelling **Uit**
    - Telegram- en WhatsApp-DM's gebruiken standaard een **toelatingslijst** (je wordt om je telefoonnummer gevraagd)

  </Tab>
  <Tab title="Geavanceerd (volledige controle)">
    - Toont elke stap (modus, werkruimte, Gateway, kanalen, daemon, Skills).

  </Tab>
</Tabs>

## Wat onboarding configureert

**Lokale modus (standaard)** leidt je door deze stappen:

1. **Model/Auth** — kies een ondersteunde aanbieder-/authenticatieflow (API-sleutel, OAuth of aanbieder-specifieke handmatige authenticatie), inclusief Custom Provider
   (OpenAI-compatibel, Anthropic-compatibel of Unknown automatische detectie). Kies een standaardmodel.
   Beveiligingsopmerking: als deze agent tools gaat uitvoeren of Webhook-/hooks-inhoud gaat verwerken, gebruik dan bij voorkeur het sterkste beschikbare model van de nieuwste generatie en houd het toolbeleid strikt. Zwakkere/oudere niveaus zijn makkelijker te prompt-injecteren.
   Voor niet-interactieve runs slaat `--secret-input-mode ref` omgevingsvariabele-ondersteunde refs op in auth-profielen in plaats van platte API-sleutelwaarden.
   In niet-interactieve `ref`-modus moet de omgevingsvariabele van de aanbieder zijn ingesteld; inline sleutelvlaggen doorgeven zonder die omgevingsvariabele faalt snel.
   In interactieve runs kun je met de geheime-referentiemodus verwijzen naar een omgevingsvariabele of een geconfigureerde aanbieder-ref (`file` of `exec`), met een snelle preflightvalidatie vóór het opslaan.
   Voor Anthropic biedt interactieve onboarding/configuratie **Anthropic Claude CLI** als het voorkeurs lokale pad en **Anthropic API key** als het aanbevolen productiepad. Anthropic setup-token blijft ook beschikbaar als ondersteund token-authenticatiepad.
2. **Werkruimte** — Locatie voor agentbestanden (standaard `~/.openclaw/workspace`). Plaatst bootstrapbestanden.
3. **Gateway** — Poort, bindadres, authenticatiemodus, Tailscale-blootstelling.
   Kies in interactieve tokenmodus standaard opslag van platteteksttokens of kies voor SecretRef.
   Niet-interactief token-SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanalen** — ingebouwde en officiële Plugin-chatkanalen zoals iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp en meer.
5. **Daemon** — Installeert een LaunchAgent (macOS), systemd-gebruikerseenheid (Linux/WSL2) of native Windows Scheduled Task met terugval via de Startup-map per gebruiker.
   Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert daemoninstallatie dit maar bewaart het opgeloste token niet in metagegevens van de supervisor-serviceomgeving.
   Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, wordt daemoninstallatie geblokkeerd met bruikbare aanwijzingen.
   Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt daemoninstallatie geblokkeerd totdat de modus expliciet is ingesteld.
6. **Gezondheidscontrole** — Start de Gateway en verifieert dat deze draait.
7. **Skills** — Installeert aanbevolen Skills en optionele afhankelijkheden.

<Note>
Onboarding opnieuw uitvoeren wist **niets**, tenzij je expliciet **Resetten** kiest (of `--reset` doorgeeft).
CLI `--reset` geldt standaard voor configuratie, referenties en sessies; gebruik `--reset-scope full` om de werkruimte mee te nemen.
Als de configuratie ongeldig is of verouderde sleutels bevat, vraagt onboarding je eerst `openclaw doctor` uit te voeren.
</Note>

**Externe modus** configureert alleen de lokale client om verbinding te maken met een Gateway elders.
Deze installeert of wijzigt **niets** op de externe host.

## Nog een agent toevoegen

Gebruik `openclaw agents add <name>` om een afzonderlijke agent te maken met een eigen werkruimte,
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

## Gerelateerde docs

- CLI-opdrachtenreferentie: [`openclaw onboard`](/nl/cli/onboard)
- Onboardingoverzicht: [Onboardingoverzicht](/nl/start/onboarding-overview)
- macOS-app-onboarding: [Onboarding](/nl/start/onboarding)
- Eerste-runritueel voor agent: [Agentbootstrapping](/nl/start/bootstrapping)
