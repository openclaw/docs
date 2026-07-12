---
read_when:
    - U wilt OpenClaw OAuth van begin tot eind begrijpen
    - Je ondervindt problemen met het ongeldig worden van tokens / uitloggen
    - Je wilt Claude CLI- of OAuth-authenticatiestromen
    - U wilt meerdere accounts of profielroutering
summary: 'OAuth in OpenClaw: tokenuitwisseling, opslag en patronen voor meerdere accounts'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T08:50:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw ondersteunt OAuth ("abonnementsauthenticatie") voor providers die dit aanbieden,
met name **OpenAI Codex (ChatGPT OAuth)** en **hergebruik van Anthropic Claude CLI**.
Voor Anthropic geldt in de praktijk het volgende onderscheid:

- **Anthropic-API-sleutel**: normale facturering via de Anthropic-API.
- **Anthropic Claude CLI-/abonnementsauthenticatie binnen OpenClaw**: medewerkers van Anthropic
  hebben ons verteld dat dit gebruik weer is toegestaan. Daarom beschouwt OpenClaw hergebruik van Claude CLI en
  het gebruik van `claude -p` als toegestaan voor deze integratie, tenzij Anthropic
  een nieuw beleid publiceert. Voor Anthropic in productie blijft authenticatie met een API-sleutel
  de veiligere aanbevolen aanpak.

OpenClaw slaat zowel authenticatie met een OpenAI-API-sleutel als ChatGPT/Codex OAuth op onder de
canonieke provider-id `openai`. Oudere profiel-id's met `openai-codex:*` en
vermeldingen van `auth.order.openai-codex` zijn verouderde status die wordt hersteld door
`openclaw doctor --fix`; gebruik profiel-id's met `openai:*` en `auth.order.openai` voor
nieuwe configuratie.

Deze pagina behandelt:

- hoe de OAuth-**tokenuitwisseling** werkt (PKCE)
- waar tokens worden **opgeslagen** (en waarom)
- hoe u **meerdere accounts** beheert (profielen + overschrijvingen per sessie)

Providerplugins die hun eigen OAuth- of API-sleutelprocedure leveren, gebruiken hetzelfde
ingangspunt:

```bash
openclaw models auth login --provider <id>
```

## De tokenopvang (waarom deze bestaat)

OAuth-providers genereren doorgaans bij elke aanmelding/vernieuwing een nieuw vernieuwingstoken.
Sommige providers maken het vorige vernieuwingstoken ongeldig wanneer voor dezelfde
gebruiker/app een nieuw token wordt uitgegeven. Praktisch gevolg: u meldt zich aan via OpenClaw _en_
via Claude Code / Codex CLI, waarna een van beide later willekeurig wordt afgemeld.

Om dit te beperken, behandelt OpenClaw de opslag voor authenticatieprofielen als een **tokenopvang**:

- de runtime leest de aanmeldgegevens voor elke agent vanaf één locatie
- meerdere profielen kunnen naast elkaar bestaan en deterministisch worden gerouteerd
- hergebruik van externe CLI's is providerspecifiek: zodra OpenClaw een lokaal OAuth-profiel
  voor een provider beheert, is het lokale vernieuwingstoken canoniek. Als dat lokale
  vernieuwingstoken wordt geweigerd, meldt OpenClaw dat het profiel opnieuw moet worden
  geverifieerd, in plaats van terug te vallen op tokenmateriaal van een externe CLI.
  Het opstarten via Codex CLI is nog beperkter: daarmee kan alleen een leeg profiel in de stijl van
  `openai:default` worden gevuld voordat OpenClaw OAuth voor die
  provider beheert; daarna blijven door OpenClaw beheerde vernieuwingen canoniek
- status- en opstartpaden beperken het zoeken naar externe CLI's tot de providerset
  die al is geconfigureerd, zodat bij een configuratie met één provider geen
  niet-gerelateerde CLI-aanmeldingsopslag wordt onderzocht

## Opslag (waar tokens zich bevinden)

Geheimen worden per agent opgeslagen onder de logische naam `auth-profiles.json` (de
onderliggende opslag is de SQLite-database van de agent; de JSON-naam blijft behouden voor
compatibiliteit en weergave in hulpprogramma's):

- Authenticatieprofielen (OAuth + API-sleutels + optionele verwijzingen op waardeniveau):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Verouderd compatibiliteitsbestand: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-vermeldingen worden bij ontdekking verwijderd)

Verouderd bestand dat uitsluitend voor import wordt gebruikt (nog steeds ondersteund, maar niet de hoofdopslag):

- `~/.openclaw/credentials/oauth.json` (bij het eerste gebruik geïmporteerd in de opslag voor authenticatieprofielen)

Al het bovenstaande houdt ook rekening met `$OPENCLAW_STATE_DIR` (overschrijving van de statusmap). Volledige naslag: [/gateway/configuration-reference#auth-storage](/nl/gateway/configuration-reference#auth-storage)

Zie [Geheimenbeheer](/nl/gateway/secrets) voor statische geheimverwijzingen en het activeringsgedrag van runtime-snapshots.

Wanneer een secundaire agent geen lokaal authenticatieprofiel heeft, gebruikt OpenClaw transparante
overerving vanuit de opslag van de standaard-/hoofdagent; de opslag van de hoofdagent wordt bij
het lezen niet gekloond. OAuth-vernieuwingstokens zijn bijzonder gevoelig: normale
kopieerprocedures slaan deze standaard over, omdat sommige providers vernieuwingstokens na gebruik
roteren of ongeldig maken. Configureer voor een agent een afzonderlijke OAuth-aanmelding wanneer
deze een onafhankelijk account nodig heeft.

## Hergebruik van Anthropic Claude CLI

OpenClaw ondersteunt hergebruik van Anthropic Claude CLI en `claude -p` als een toegestane
authenticatiemethode. Als u al een lokale Claude-aanmelding op de host hebt,
kan de onboarding/configuratie deze rechtstreeks hergebruiken. Het Anthropic-installatietoken blijft
beschikbaar als ondersteunde methode voor tokenauthenticatie, maar OpenClaw geeft de voorkeur aan
hergebruik van Claude CLI wanneer dit beschikbaar is.

<Warning>
In de openbare documentatie van Anthropic over Claude Code staat dat rechtstreeks gebruik van Claude Code binnen
de limieten van het Claude-abonnement blijft, en medewerkers van Anthropic hebben ons verteld dat gebruik van Claude
CLI in de stijl van OpenClaw weer is toegestaan. OpenClaw beschouwt hergebruik van Claude CLI en
het gebruik van `claude -p` daarom als toegestaan voor deze integratie, tenzij Anthropic
een nieuw beleid publiceert.

Zie voor de huidige documentatie van Anthropic over abonnementen voor rechtstreeks gebruik van Claude Code [Claude Code gebruiken
met uw Pro- of Max-
abonnement](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
en [Claude Code gebruiken met uw Team- of Enterprise-
abonnement](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Zie [OpenAI
Codex](/nl/providers/openai), [Qwen Cloud Coding
Plan](/nl/providers/qwen), [MiniMax Coding Plan](/nl/providers/minimax)
en [Z.AI / GLM Coding Plan](/nl/providers/zai) als u andere abonnementsopties in OpenClaw wilt.
</Warning>

## OAuth-uitwisseling (hoe aanmelden werkt)

De interactieve aanmeldingsprocedures van OpenClaw zijn geïmplementeerd in `openclaw/plugin-sdk/llm.ts` en gekoppeld aan de wizards/opdrachten.

### Anthropic-installatietoken

Proces:

1. start het Anthropic-installatietoken of plaktoken vanuit OpenClaw
2. OpenClaw slaat de resulterende Anthropic-aanmeldgegevens op in een authenticatieprofiel
3. de modelselectie blijft op `anthropic/...`
4. bestaande Anthropic-authenticatieprofielen blijven beschikbaar voor terugdraaien/volgordebeheer

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik buiten Codex CLI, waaronder OpenClaw-workflows.

De aanmeldingsopdracht gebruikt de canonieke OpenAI-provider-id:

```bash
openclaw models auth login --provider openai
```

Gebruik `--profile-id openai:<name>` voor meerdere ChatGPT/Codex OAuth-accounts binnen
één agent. Gebruik `openai-codex:<name>` niet voor nieuwe profielen. Doctor migreert
dat oudere voorvoegsel naar een conflictvrije profiel-id met `openai:*`; voer
`openclaw models auth list --provider openai` uit na het herstel en voordat u
profiel-id's naar `auth.order` of `/model ...@<profileId>` kopieert.

Proces (PKCE):

1. genereer een PKCE-verificatiecode/-uitdaging en een willekeurige `state`
2. open `https://auth.openai.com/oauth/authorize?...` (bereik
   `openid profile email offline_access`)
3. probeer de callback op `http://localhost:1455/auth/callback` op te vangen (de
   callbackhost is standaard `localhost` en accepteert alleen local loopback-hosts;
   overschrijf dit met `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. als u een code kunt plakken voordat de callback binnenkomt (of als u
   op afstand/headless werkt en de callback niet kan binden), plakt u in plaats daarvan de omleidings-URL/code
   - handmatig plakken concurreert met de browsercallback en wat het eerst is voltooid,
   wint
5. wissel de code uit via `https://auth.openai.com/oauth/token`
6. haal `accountId` uit het toegangstoken en sla `{ access, refresh, expires, accountId }` op

Het wizardpad is `openclaw onboard` → authenticatiekeuze `openai`.

## Vernieuwing + vervaldatum

Profielen slaan een `expires`-tijdstempel op. Tijdens runtime:

- als `expires` in de toekomst ligt, gebruikt u het opgeslagen toegangstoken
- als het is verlopen, vernieuwt u het (onder een bestandsvergrendeling) en overschrijft u de opgeslagen aanmeldgegevens
- als een secundaire agent een overgeërfd OAuth-profiel van de hoofdagent leest, schrijft de
  vernieuwing terug naar de opslag van de hoofdagent in plaats van het vernieuwingstoken
  naar de opslag van de secundaire agent te kopiëren
- extern beheerde CLI-aanmeldgegevens (Claude CLI, beperkte initialisatie via Codex CLI;
  zie [De tokenopvang](#the-token-sink-why-it-exists)) worden opnieuw gelezen in plaats van
  een gekopieerd vernieuwingstoken te gebruiken. Als een beheerde vernieuwing mislukt, meldt OpenClaw
  dat het betreffende profiel opnieuw moet worden geverifieerd in plaats van
  tokenmateriaal van een externe CLI terug te geven.

De vernieuwingsprocedure verloopt automatisch; doorgaans hoeft u tokens niet handmatig te beheren.

## Meerdere accounts (profielen) + routering

Twee patronen:

### 1) Aanbevolen: afzonderlijke agents

Als u wilt dat "persoonlijk" en "werk" nooit met elkaar in aanraking komen, gebruikt u geïsoleerde agents (afzonderlijke sessies + aanmeldgegevens + werkruimte):

```bash
openclaw agents add work
openclaw agents add personal
```

Configureer vervolgens de authenticatie per agent (wizard) en routeer chats naar de juiste agent.

### 2) Geavanceerd: meerdere profielen in één agent

De opslag voor authenticatieprofielen ondersteunt meerdere profiel-id's voor dezelfde provider.
Kies welk profiel wordt gebruikt:

- globaal via de configuratievolgorde (`auth.order`)
- per sessie via `/model ...@<profileId>`

Voorbeeld (overschrijving voor sessie):

- `/model Opus@anthropic:work`

Geef bestaande profiel-id's weer met:

```bash
openclaw models auth list --provider <id>
```

Gerelateerde documentatie:

- [Model-failover](/nl/concepts/model-failover) (regels voor rotatie + afkoelperiode)
- [Slash-opdrachten](/nl/tools/slash-commands) (opdrachtinterface)

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) - overzicht van authenticatie voor modelproviders
- [Geheimen](/nl/gateway/secrets) - opslag van aanmeldgegevens en SecretRef
- [Configuratienaslag](/nl/gateway/configuration-reference#auth-storage) - configuratiesleutels voor authenticatie
