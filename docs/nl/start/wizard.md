---
read_when:
    - CLI-onboarding uitvoeren of configureren
    - Een nieuwe machine instellen
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-onboarding: verifieer inferentie en laat Crestodian vervolgens de resterende configuratie afhandelen'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-07-12T09:26:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI-onboarding is het aanbevolen terminaltraject voor configuratie op macOS, Linux en
Windows (native of WSL2). Standaard detecteert het AI-toegang die al beschikbaar is op
de machine, verifieert het die met een echte voltooiing en start het Crestodian om
de werkruimte, Gateway en optionele functies te configureren. `openclaw setup` voert hetzelfde traject uit ([Configuratie](/nl/cli/setup) behandelt
de variant `--baseline`, die alleen de configuratie instelt). Gebruikers van de Windows-desktop kunnen ook beginnen
via [Windows Hub](/nl/platforms/windows).

Begeleide onboarding stelt eerst inferentie in. Het detecteert beschikbare AI-toegang,
vereist een echte voltooiing en start pas daarna [Crestodian](/nl/cli/crestodian)
om de rest van OpenClaw te configureren. In het begeleide traject is er geen Crestodian vóór
inferentie en geen mogelijkheid om AI over te slaan.

De klassieke wizard blijft beschikbaar voor aanmelding bij providers, configuratie van een externe Gateway,
kanaalkoppeling, daemonbesturing, Skills en imports. Start deze expliciet
met `openclaw onboard --classic`; het scherm met kandidaten voor begeleide inferentie
draagt de uitvoering niet eraan over. Nadat inferentie is geslaagd, kan Crestodian `open channel
wizard for <channel>` gebruiken om kanaalconfiguratie waarvoor geheimen nodig zijn over te dragen aan een gemaskeerde
terminalwizard. Als je de modelprovider of de authenticatie ervan wilt wijzigen, sluit je
Crestodian af en voer je `openclaw onboard` uit; Crestodian opent geen begeleide of
klassieke providertrajecten.

<Info>
Snelste eerste chat: voltooi de begeleide configuratie, voer `openclaw dashboard` uit en chat in
de browser via de Control UI. Documentatie: [Dashboard](/nl/web/dashboard).
</Info>

## Landinstelling

De wizard lokaliseert vaste onboardingtekst. Volgorde voor bepaling: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG` en vervolgens Engels. Ondersteunde landinstellingen: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Productnamen, opdrachten, configuratiesleutels, URL's, provider-ID's, model-ID's en
Plugin-/kanaallabels blijven ongeacht de landinstelling in het Engels.

Om niet-inferentie-instellingen later opnieuw te configureren:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik voor scripts `--non-interactive` (zie [CLI-automatisering](/nl/start/wizard-cli-automation)).
</Note>

<Tip>
De klassieke wizard bevat een stap voor zoeken op het web waarin je een provider kunt kiezen: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG of Tavily. Sommige vereisen een API-sleutel; andere werken
zonder sleutel. Configureer dit later met `openclaw configure --section web`. Documentatie:
[Webhulpmiddelen](/nl/tools/web).
</Tip>

## Begeleide standaardinstelling

Een gewone uitvoering van `openclaw onboard` volgt dit traject:

1. Accepteer de beveiligingsmelding.
2. Detecteer geconfigureerde modellen, omgevingsvariabelen voor API-sleutels en ondersteunde lokale
   AI-CLI's.
3. Test de eerste gedetecteerde kandidaat met een echte voltooiing. Toon bij een fout de
   reden en ga door naar de volgende bruikbare kandidaat.
4. Als alle detectiemogelijkheden zijn uitgeput, probeer dan opnieuw een gedetecteerde kandidaat of voer een
   API-sleutel van een provider in via een gemaskeerde prompt. Begeleide onboarding
   biedt Crestodian of een optie om AI over te slaan pas aan nadat inferentie werkt.
5. Sla alleen de geverifieerde modelroute en eventueel vereiste referentie-/Pluginstatus
   permanent op. Instellingen voor de werkruimte en Gateway blijven ongewijzigd.
6. Start Crestodian met het geverifieerde model, zodat het de werkruimte,
   Gateway, kanalen, agents, Plugins en de resterende optionele configuratie kan instellen.

Als de opdracht opnieuw wordt uitgevoerd op een geconfigureerde installatie, wordt eerst het huidige standaardmodel
getest, waardoor het begeleide traject als verificatie- en herstelronde dient. Een mislukte
controle vervangt het geconfigureerde model nooit automatisch; onboarding stopt en
vraagt hoe verder te gaan. Voer `openclaw channels add` of `openclaw configure` uit voor
latere toevoegingen die niet met inferentie te maken hebben; gebruik `openclaw onboard` voor wijzigingen aan
provider- of authenticatieroutes.

## Klassieke wizard: Snelle start versus Geavanceerd

Voer `openclaw onboard --classic` uit om de volledige wizard te openen. Deze begint met een
keuze tussen **Snelle start** (standaardinstellingen) en **Geavanceerd** (volledige controle). Geef
`--flow quickstart` of `--flow advanced` (alias `manual`) door om het klassieke
traject te selecteren en die prompt over te slaan.

<Tabs>
  <Tab title="Snelle start (standaardinstellingen)">
    - Lokale Gateway, binding aan local loopback
    - Standaardwerkruimte (of bestaande werkruimte)
    - Gateway-poort **18789**
    - Gateway-authenticatie **Token** (automatisch gegenereerd, ook bij local loopback)
    - Hulpmiddelenbeleid: `tools.profile: "coding"` voor nieuwe configuraties (een bestaand expliciet profiel blijft behouden)
    - DM-isolatie: `session.dmScope: "per-channel-peer"` voor nieuwe configuraties. Details: [Referentie voor CLI-configuratie](/nl/start/wizard-cli-reference#outputs-and-internals)
    - Beschikbaarstelling via Tailscale **Uit**
    - DM's van Telegram en WhatsApp gebruiken standaard een **toelatingslijst**: Telegram vraagt om een numerieke Telegram-gebruikers-ID, WhatsApp vraagt om een telefoonnummer

  </Tab>
  <Tab title="Geavanceerd (volledige controle)">
    - Toont elke stap: modus, werkruimte, Gateway, kanalen, daemon, Skills

  </Tab>
</Tabs>

De externe modus (`--mode remote`) gebruikt altijd het geavanceerde traject; deze
configureert deze machine alleen om verbinding te maken met een Gateway elders en installeert of
wijzigt nooit iets op de externe host.

## Wat klassieke onboarding configureert

De lokale modus (standaard) doorloopt deze stappen:

1. **Model/authenticatie** - kies een authenticatietraject van een provider (API-sleutel, OAuth of
   providerspecifieke handmatige authenticatie), waaronder een aangepaste provider
   (compatibel met OpenAI, compatibel met OpenAI Responses, compatibel met Anthropic of
   automatische detectie van onbekend type). Kies een standaardmodel.
   Een nieuwe configuratie met een OpenAI-API-sleutel gebruikt standaard `openai/gpt-5.6` (de kale ID voor de directe API
   wordt omgezet naar Sol); een nieuwe ChatGPT-/Codex-configuratie gebruikt standaard
   `openai/gpt-5.6-sol`. Als de configuratie opnieuw wordt uitgevoerd, blijft een bestaand expliciet model behouden,
   waaronder `openai/gpt-5.5`. Selecteer `openai/gpt-5.5` expliciet als het
   account geen toegang biedt tot GPT-5.6.
   Beveiligingsopmerking: als deze agent hulpmiddelen uitvoert of inhoud van webhooks/hooks
   verwerkt, gebruik dan bij voorkeur het krachtigste beschikbare model van de nieuwste generatie en houd
   het hulpmiddelenbeleid strikt: zwakkere of oudere niveaus zijn vatbaarder voor promptinjectie.
   Voor niet-interactieve uitvoeringen slaat `--secret-input-mode ref` door omgevingsvariabelen ondersteunde verwijzingen
   op in plaats van API-sleutelwaarden in platte tekst; de omgevingsvariabele waarnaar wordt verwezen moet al
   zijn ingesteld, anders mislukt onboarding onmiddellijk. De interactieve modus voor verwijzingen naar geheimen kan
   verwijzen naar een omgevingsvariabele of een geconfigureerde providerverwijzing (`file` of
   `exec`), met een snelle voorafgaande controle vóór het opslaan. Na de configuratie van model/authenticatie
   biedt de wizard een optionele live voltooiingstest aan; na een fout kan één keer worden teruggekeerd naar
   de configuratie van model/authenticatie, of de fout kan worden genegeerd zonder de rest van de
   klassieke wizard te blokkeren. Negeren ontgrendelt Crestodian niet; conversationele configuratie
   vereist nog steeds een geslaagde inferentiecontrole.
2. **Werkruimte** - map voor agentbestanden (standaard `~/.openclaw/workspace`). Maakt initiële opstartbestanden aan.
3. **Gateway** - poort, bindingsadres, authenticatiemodus, beschikbaarstelling via Tailscale. Kies in
   de interactieve tokenmodus voor opslag van het token in platte tekst (standaard) of kies
   voor een SecretRef. Niet-interactief SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanalen** - ingebouwde chatkanalen en chatkanalen van officiële Plugins, waaronder
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp en meer.
5. **Daemon** - installeert een LaunchAgent (macOS), een systemd-gebruikerseenheid
   (Linux/WSL2) of een native geplande Windows-taak met een terugvaloptie per gebruiker
   via de map Opstarten.
   Als tokenauthenticatie vereist is en `gateway.auth.token` door SecretRef wordt beheerd,
   valideert de daemoninstallatie deze, maar slaat geen herleid token op in
   omgevingsmetadata van de supervisorservice; een niet-opgeloste SecretRef blokkeert
   de installatie en toont instructies. Als zowel `gateway.auth.token` als
   `gateway.auth.password` zijn ingesteld terwijl `gateway.auth.mode` niet is ingesteld, wordt de installatie
   geblokkeerd totdat je de modus expliciet instelt.
6. **Statuscontrole** - start de Gateway en controleert of deze bereikbaar is.
7. **Skills** - installeert aanbevolen Skills en hun optionele afhankelijkheden.

<Note>
Als onboarding opnieuw wordt uitgevoerd, wordt **niets** gewist tenzij je expliciet
**Opnieuw instellen** kiest (of `--reset` doorgeeft). CLI-`--reset` geldt standaard voor configuratie, referenties
en sessies; gebruik `--reset-scope full` om ook de werkruimte te verwijderen. Als de
configuratie ongeldig is of verouderde sleutels bevat, vraagt onboarding je eerst
`openclaw doctor` uit te voeren.
</Note>

`--flow import` voert in de klassieke wizard een gedetecteerd migratietraject uit (bijvoorbeeld Hermes) in plaats van
een nieuwe configuratie; zie [Migreren](/nl/cli/migrate) en de migratiehandleidingen onder
[Installeren](/nl/install/migrating-hermes). `openclaw onboard --modern` is een
compatibiliteitsalias voor [Crestodian](/nl/cli/crestodian). Deze gebruikt dezelfde
inferentiepoort als `openclaw crestodian`: geverifieerde inferentie start de
assistent, terwijl een interactieve fout terugkeert naar de begeleide inferentieconfiguratie.

## Nog een agent toevoegen

Gebruik `openclaw agents add <name>` om een afzonderlijke agent te maken met een eigen
werkruimte, sessies en authenticatieprofielen. Uitvoering zonder `--workspace` start
een interactief traject voor naam, werkruimte, authenticatie, kanalen en bindingen; dit is
niet de volledige wizard van `openclaw onboard`.

Wat hiermee wordt ingesteld:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Opmerkingen:

- Standaardwerkruimte: `~/.openclaw/workspace-<agentId>` (of onder
  `agents.defaults.workspace` als dat is ingesteld).
- Voeg `bindings` toe om inkomende berichten naar deze agent te routeren (onboarding kan dit voor je doen).
- Niet-interactieve vlaggen: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Volledige referentie

Zie voor gedetailleerd stapsgewijs gedrag en configuratie-uitvoer
[Referentie voor CLI-configuratie](/nl/start/wizard-cli-reference).
Zie voor niet-interactieve voorbeelden [CLI-automatisering](/nl/start/wizard-cli-automation).
Zie voor de volledige vlaggenreferentie [`openclaw onboard`](/nl/cli/onboard).

## Gerelateerde documentatie

- Referentie voor CLI-opdrachten: [`openclaw onboard`](/nl/cli/onboard)
- Overzicht van onboarding: [Overzicht van onboarding](/nl/start/onboarding-overview)
- Onboarding voor de macOS-app: [Onboarding](/nl/start/onboarding)
- Eerste-opstartritueel van de agent: [Agentinitialisatie](/nl/start/bootstrapping)
