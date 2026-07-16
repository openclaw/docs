---
read_when:
    - CLI-onboarding uitvoeren of configureren
    - Een nieuwe machine instellen
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-onboarding: verifieer inferentie en laat de resterende configuratie vervolgens over aan OpenClaw'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-07-16T16:28:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI-onboarding is het aanbevolen installatietraject via de terminal op macOS, Linux en
Windows (native of WSL2). Standaard detecteert het AI-toegang die al beschikbaar is op
de machine, verifieert het die met een echte voltooiing en start het OpenClaw om
de werkruimte, Gateway en optionele functies te configureren. `openclaw setup` voert hetzelfde traject uit ([Installatie](/nl/cli/setup) behandelt
de `--baseline`-variant die alleen de configuratie aanpast). Gebruikers van de Windows-desktop kunnen ook beginnen
via [Windows Hub](/nl/platforms/windows).

Begeleide onboarding stelt eerst inferentie in. Deze detecteert beschikbare AI-toegang,
vereist een echte voltooiing en start pas daarna [OpenClaw](/cli/openclaw)
om de rest van OpenClaw te configureren. Als je **Voorlopig overslaan** kiest, wordt onboarding
afgesloten zonder OpenClaw te starten.

De klassieke wizard blijft beschikbaar voor aangepaste providers, externe Gateway-
installatie, kanaalkoppeling, daemonbeheer, Skills en imports. Start deze expliciet
met `openclaw onboard --classic`; de begeleide inferentiekiezer delegeert
niet hieraan. Nadat inferentie is geslaagd, kan OpenClaw `open channel wizard for
<channel>` gebruiken om kanaalinstallatie waarvoor geheimen nodig zijn, over te dragen aan een afgeschermde terminalwizard.
Als je de modelprovider of de authenticatie ervan wilt wijzigen, sluit je OpenClaw af en voer je
`openclaw onboard` uit; OpenClaw opent geen begeleide of klassieke providertrajecten.

<Info>
Snelste eerste chat: voltooi de begeleide installatie, voer `openclaw dashboard` uit en chat in
de browser via de Control UI. Documentatie: [Dashboard](/nl/web/dashboard).
</Info>

## Landinstelling

De wizard lokaliseert vaste onboardingtekst. Volgorde van bepaling: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, daarna Engels. Ondersteunde landinstellingen: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Productnamen, opdrachten, configuratiesleutels, URL's, provider-ID's, model-ID's en
Plugin-/kanaallabels blijven ongeacht de landinstelling in het Engels.

Om instellingen die niet met inferentie te maken hebben later opnieuw te configureren:

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

Een gewone `openclaw onboard` volgt dit traject:

1. Accepteer de beveiligingsmelding.
2. Detecteer geconfigureerde modellen, omgevingsvariabelen voor API-sleutels, ondersteunde lokale AI-
   CLI's en reeds geïnstalleerde modellen met hulpmiddelen van bereikbare Ollama- of LM
   Studio-servers op de Gateway-host. Deze alleen-lezencontrole downloadt nooit een
   model. Installaties van Gemini CLI en Antigravity worden gemeld, maar niet automatisch getest,
   omdat ze geen controle zonder hulpmiddelen kunnen afdwingen.
3. Test de eerst gedetecteerde kandidaat met een echte voltooiing. Toon bij een fout de
   reden en ga verder met de volgende bruikbare kandidaat.
4. Als de detectie niets meer oplevert, kies je OpenAI, Anthropic, xAI (Grok), Google of
   OpenRouter, of kies je **Meer…** voor de overige providers. De regio's,
   abonnementen en ondersteunde methoden via browser, apparaat, API-sleutel of token van elke provider
   verschijnen in een tweede menu en worden met dezelfde echte voltooiing getest.
   Kies **Voorlopig overslaan** om af te sluiten zonder OpenClaw te starten.
5. Sla alleen de geverifieerde modelroute en eventuele vereiste referentie-/Pluginstatus
   op. Instellingen voor de werkruimte en Gateway blijven ongewijzigd.
6. Start OpenClaw met het geverifieerde model, zodat het de werkruimte,
   Gateway, kanalen, agents, plugins en de overige optionele installatie kan configureren.

Als je de opdracht opnieuw uitvoert op een geconfigureerde installatie, wordt eerst het huidige standaardmodel
getest, waardoor het begeleide traject als verificatie- en herstelprocedure dient. Een mislukte
controle vervangt het geconfigureerde model nooit automatisch; onboarding stopt en
vraagt hoe verder te gaan. Voer `openclaw channels add` of `openclaw configure` uit voor
latere toevoegingen die niet met inferentie te maken hebben; gebruik `openclaw onboard` voor wijzigingen aan de provider- of authenticatieroute.

## Klassieke wizard: QuickStart tegenover Advanced

Voer `openclaw onboard --classic` uit om de volledige wizard te openen. Deze begint met een
keuze tussen **QuickStart** (standaardinstellingen) en **Advanced** (volledige controle). Geef
`--flow quickstart` of `--flow advanced` (alias `manual`) door om het klassieke
traject te selecteren en die vraag over te slaan.

<Tabs>
  <Tab title="QuickStart (standaardinstellingen)">
    - Lokale Gateway, loopback-binding
    - Standaardwerkruimte (of bestaande werkruimte)
    - Gateway-poort **18789**
    - Gateway-authenticatie **Token** (automatisch gegenereerd, zelfs bij loopback)
    - Hulpmiddelenbeleid: `tools.profile: "coding"` voor nieuwe installaties (een bestaand expliciet profiel blijft behouden)
    - DM-isolatie: `session.dmScope: "per-channel-peer"` voor nieuwe installaties. Details: [Referentie voor CLI-installatie](/nl/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-blootstelling **Off**
    - DM's van Telegram en WhatsApp gebruiken standaard een **allowlist**: Telegram vraagt om een numerieke Telegram-gebruikers-ID, WhatsApp vraagt om een telefoonnummer

  </Tab>
  <Tab title="Advanced (volledige controle)">
    - Toont elke stap: modus, werkruimte, Gateway, kanalen, daemon, Skills

  </Tab>
</Tabs>

Externe modus (`--mode remote`) gebruikt altijd het geavanceerde traject; deze
configureert alleen deze machine om verbinding te maken met een Gateway elders en installeert of
wijzigt nooit iets op de externe host.

## Wat klassieke onboarding configureert

De lokale modus (standaard) doorloopt deze stappen:

1. **Model/authenticatie** - kies een authenticatietraject voor een provider (API-sleutel, OAuth of
   providerspecifieke handmatige authenticatie), waaronder Aangepaste provider
   (OpenAI-compatibel, compatibel met OpenAI Responses, Anthropic-compatibel of
   automatische detectie als Onbekend). Kies een standaardmodel.
   Een nieuwe installatie met een OpenAI API-sleutel gebruikt standaard `openai/gpt-5.6` (de kale directe-API-
   ID wordt omgezet naar Sol); een nieuwe ChatGPT-/Codex-installatie gebruikt standaard
   `openai/gpt-5.6-sol`. Als je de installatie opnieuw uitvoert, blijft een bestaand expliciet model behouden,
   waaronder `openai/gpt-5.5`. Selecteer `openai/gpt-5.5` expliciet als het
   account geen GPT-5.6 beschikbaar stelt.
   Beveiligingsopmerking: als deze agent hulpmiddelen uitvoert of Webhook-/hook-
   inhoud verwerkt, kies dan bij voorkeur het sterkste beschikbare model van de nieuwste generatie en houd
   het hulpmiddelenbeleid strikt; zwakkere of oudere niveaus zijn gemakkelijker vatbaar voor promptinjectie.
   Voor niet-interactieve uitvoeringen slaat `--secret-input-mode ref` door omgevingsvariabelen ondersteunde verwijzingen
   op in plaats van API-sleutelwaarden in platte tekst; de omgevingsvariabele waarnaar wordt verwezen moet al
   ingesteld zijn, anders mislukt onboarding direct. De interactieve modus voor geheime verwijzingen kan
   verwijzen naar een omgevingsvariabele of een geconfigureerde providerverwijzing (`file` of
   `exec`), met een snelle voorafgaande controle vóór het opslaan. Na het instellen van model/authenticatie
   biedt de wizard een optionele live voltooiingstest; bij een fout kan één keer worden teruggekeerd naar
   de installatie van model/authenticatie, of kan de fout worden genegeerd zonder de rest van de
   klassieke wizard te blokkeren. Negeren ontgrendelt OpenClaw niet; voor gespreksgestuurde installatie
   blijft een geslaagde inferentiecontrole vereist.
2. **Werkruimte** - map voor agentbestanden (standaard `~/.openclaw/workspace`). Maakt initiële bootstrapbestanden aan.
3. **Gateway** - poort, bindadres, authenticatiemodus, Tailscale-blootstelling. Kies in
   interactieve tokenmodus voor opslag van het token in platte tekst (standaard) of kies
   voor een SecretRef. Niet-interactief SecretRef-pad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanalen** - ingebouwde chatkanalen en chatkanalen van officiële plugins, waaronder
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp en meer.
5. **Daemon** - installeert een LaunchAgent (macOS), een systemd-gebruikerseenheid
   (Linux/WSL2) of een native geplande Windows-taak met een terugvaloptie
   per gebruiker in de opstartmap.
   Als tokenauthenticatie vereist is en `gateway.auth.token` door SecretRef wordt beheerd,
   valideert de daemoninstallatie deze, maar slaat ze geen opgelost token op in
   de omgevingsmetadata van de supervisordienst; een niet-opgeloste SecretRef blokkeert
   de installatie met instructies. Als zowel `gateway.auth.token` als
   `gateway.auth.password` zijn ingesteld terwijl `gateway.auth.mode` niet is ingesteld, wordt de installatie
   geblokkeerd totdat je de modus expliciet instelt.
6. **Statuscontrole** - start de Gateway en verifieert dat deze bereikbaar is.
7. **Skills** - installeert aanbevolen Skills en hun optionele afhankelijkheden.

<Note>
Als je onboarding opnieuw uitvoert, wordt er **niets** gewist tenzij je expliciet
**Reset** kiest (of `--reset` doorgeeft). CLI `--reset` verwerkt standaard configuratie, referenties
en sessies; gebruik `--reset-scope full` om ook de werkruimte te verwijderen. Als de
configuratie ongeldig is of verouderde sleutels bevat, vraagt onboarding je eerst
`openclaw doctor` uit te voeren.
</Note>

`--flow import` voert een gedetecteerd migratietraject uit (bijvoorbeeld Hermes) in de
klassieke wizard in plaats van een nieuwe installatie; zie [Migreren](/nl/cli/migrate) en de migratiehandleidingen onder
[Installeren](/nl/install/migrating-hermes). `openclaw onboard --modern` is een
compatibiliteitsalias voor [OpenClaw](/cli/openclaw). Deze gebruikt dezelfde
inferentiepoort als `openclaw setup`: geverifieerde inferentie start de
assistent, terwijl een interactieve fout terugkeert naar de begeleide inferentie-installatie.

## Nog een agent toevoegen

Gebruik `openclaw agents add <name>` om een afzonderlijke agent te maken met een eigen
werkruimte, sessies en authenticatieprofielen. Uitvoeren zonder `--workspace` start
een interactief traject voor naam, werkruimte, authenticatie, kanalen en bindingen; dit is
niet de volledige `openclaw onboard`-wizard.

Wat het instelt:

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
[Referentie voor CLI-installatie](/nl/start/wizard-cli-reference).
Zie voor niet-interactieve voorbeelden [CLI-automatisering](/nl/start/wizard-cli-automation).
Zie voor de volledige vlagreferentie [`openclaw onboard`](/nl/cli/onboard).

## Gerelateerde documentatie

- Referentie voor CLI-opdrachten: [`openclaw onboard`](/nl/cli/onboard)
- Overzicht van onboarding: [Overzicht van onboarding](/nl/start/onboarding-overview)
- Onboarding voor de macOS-app: [Onboarding](/nl/start/onboarding)
- Eerste-uitvoeringsritueel voor agents: [Agent-bootstrap](/nl/start/bootstrapping)
