---
read_when:
    - Je wilt OpenClaw OAuth van begin tot eind begrijpen
    - Je ondervindt problemen met tokenongeldigheid of uitloggen
    - Je wilt Claude CLI- of OAuth-authenticatiestromen
    - Je wilt meerdere accounts of profielroutering
summary: 'OAuth in OpenClaw: tokenuitwisseling, opslag en patronen voor meerdere accounts'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T15:42:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw ondersteunt OAuth ("abonnementsauthenticatie") voor providers die dit aanbieden,
met name **OpenAI Codex (ChatGPT OAuth)** en **hergebruik van de Anthropic Claude CLI**.
Voor Anthropic is de praktische verdeling:

- **Anthropic API-sleutel**: normale facturering voor de Anthropic API.
- **Anthropic Claude CLI / abonnementsauthenticatie binnen OpenClaw**: medewerkers van Anthropic
  hebben ons laten weten dat dit gebruik weer is toegestaan, dus beschouwt OpenClaw hergebruik van de Claude CLI en
  het gebruik van `claude -p` als toegestaan voor deze integratie, tenzij Anthropic
  een nieuw beleid publiceert. Voor Anthropic in productie blijft authenticatie met een API-sleutel
  de veiligere aanbevolen optie.

OpenClaw slaat zowel authenticatie met een OpenAI API-sleutel als ChatGPT/Codex OAuth op onder de
canonieke provider-id `openai`. Oudere profiel-id's voor `openai-codex:*` en
vermeldingen voor `auth.order.openai-codex` zijn verouderde status die wordt hersteld door
`openclaw doctor --fix`; gebruik profiel-id's voor `openai:*` en `auth.order.openai` voor
nieuwe configuratie.

Deze pagina behandelt:

- hoe de OAuth-**tokenuitwisseling** werkt (PKCE)
- waar tokens worden **opgeslagen** (en waarom)
- hoe je **meerdere accounts** beheert (profielen + overschrijvingen per sessie)

Providerplugins die hun eigen OAuth- of API-sleutelprocedure leveren, worden via
hetzelfde toegangspunt uitgevoerd:

```bash
openclaw models auth login --provider <id>
```

## De tokenopvang (waarom deze bestaat)

OAuth-providers genereren doorgaans bij elke aanmelding/vernieuwing een nieuw vernieuwingstoken.
Sommige providers maken het vorige vernieuwingstoken ongeldig wanneer een nieuw token wordt
uitgegeven voor dezelfde gebruiker/app. Praktisch symptoom: je meldt je aan via OpenClaw _en_
via Claude Code / Codex CLI, waarna een van beide later willekeurig wordt afgemeld.

Om dit te beperken, behandelt OpenClaw de opslag voor authenticatieprofielen als een **tokenopvang**:

- de runtime leest aanmeldgegevens per agent vanaf één locatie
- meerdere profielen kunnen naast elkaar bestaan en deterministisch worden gerouteerd
- hergebruik van een externe CLI is providerspecifiek: zodra OpenClaw een lokaal OAuth-
  profiel voor een provider beheert, is het lokale vernieuwingstoken canoniek. Als dat lokale
  vernieuwingstoken wordt geweigerd, meldt OpenClaw dat het profiel opnieuw moet worden
  geauthenticeerd in plaats van terug te vallen op tokenmateriaal van een externe CLI.
  Het initiëren via Codex CLI is nog beperkter: hiermee kan alleen een leeg profiel
  in de stijl van `openai:default` worden gevuld voordat OpenClaw OAuth voor die
  provider beheert; daarna blijven door OpenClaw beheerde vernieuwingen canoniek
- status-/opstartpaden beperken de detectie van externe CLI's tot de providerset
  die al is geconfigureerd, zodat een niet-gerelateerde opslag met CLI-aanmeldingen niet wordt onderzocht bij een
  configuratie met één provider

## Opslag (waar tokens zich bevinden)

Geheimen bevinden zich per agent, geïndexeerd op de logische naam `auth-profiles.json` (de
onderliggende opslag is de SQLite-database van de agent; de JSON-naam blijft behouden voor
compatibiliteit en weergave in hulpmiddelen):

- Authenticatieprofielen (OAuth + API-sleutels + optionele verwijzingen op waardeniveau):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Verouderd compatibiliteitsbestand: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische vermeldingen voor `api_key` worden bij detectie verwijderd)

Verouderd bestand dat alleen voor import wordt gebruikt (nog steeds ondersteund, maar niet de hoofdopslag):

- `~/.openclaw/credentials/oauth.json` (bij het eerste gebruik geïmporteerd in de opslag voor authenticatieprofielen)

Al het bovenstaande respecteert ook `$OPENCLAW_STATE_DIR` (overschrijving van de statusmap). Volledige naslag: [/gateway/configuration-reference#auth-storage](/nl/gateway/configuration-reference#auth-storage)

Zie [Geheimenbeheer](/nl/gateway/secrets) voor statische geheimverwijzingen en het activeringsgedrag van runtime-snapshots.

Wanneer een secundaire agent geen lokaal authenticatieprofiel heeft, gebruikt OpenClaw doorlees-
overerving vanuit de opslag van de standaard-/hoofdagent; bij het lezen wordt de opslag van de hoofdagent
niet gekloond. Vooral OAuth-vernieuwingstokens zijn gevoelig: normale
kopieerprocedures slaan ze standaard over, omdat sommige providers vernieuwingstokens na gebruik roteren of ongeldig
maken. Configureer een afzonderlijke OAuth-aanmelding voor een agent wanneer
die een onafhankelijk account nodig heeft.

## Hergebruik van de Anthropic Claude CLI

OpenClaw ondersteunt hergebruik van de Anthropic Claude CLI en `claude -p` als een toegestane
authenticatiemethode. Als er op de host al een lokale Claude-aanmelding bestaat,
kan de onboarding/configuratie deze direct hergebruiken. De Anthropic-installatietoken blijft
beschikbaar als ondersteunde authenticatiemethode met tokens, maar OpenClaw geeft de voorkeur aan hergebruik van de Claude CLI
wanneer dit beschikbaar is.

<Warning>
In de openbare Claude Code-documentatie van Anthropic staat dat rechtstreeks gebruik van Claude Code binnen
de limieten van Claude-abonnementen blijft, en medewerkers van Anthropic hebben ons laten weten dat Claude
CLI-gebruik in OpenClaw-stijl weer is toegestaan. OpenClaw beschouwt hergebruik van de Claude CLI en
het gebruik van `claude -p` daarom als toegestaan voor deze integratie, tenzij Anthropic
een nieuw beleid publiceert.

Zie voor de huidige abonnementsdocumentatie van Anthropic voor rechtstreeks gebruik van Claude Code [Claude Code
gebruiken met je Pro- of Max-
abonnement](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
en [Claude Code gebruiken met je Team- of Enterprise-
abonnement](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Als je andere abonnementsopties in OpenClaw wilt, raadpleeg dan [OpenAI
Codex](/nl/providers/openai), [Qwen Cloud Coding
Plan](/nl/providers/qwen), [MiniMax Coding Plan](/nl/providers/minimax)
en [Z.AI / GLM Coding Plan](/nl/providers/zai).
</Warning>

## OAuth-uitwisseling (hoe aanmelden werkt)

De interactieve aanmeldprocedures van OpenClaw zijn geïmplementeerd in `openclaw/plugin-sdk/llm.ts` en gekoppeld aan de wizards/opdrachten.

### Anthropic-installatietoken

Vorm van de procedure:

1. maak het token door `claude setup-token` uit te voeren op een willekeurige machine met Claude Code en start daarna Anthropic-installatietoken of token-plakken vanuit OpenClaw
2. OpenClaw slaat de resulterende Anthropic-aanmeldgegevens op in een authenticatieprofiel
3. de modelselectie blijft op `anthropic/...`
4. bestaande Anthropic-authenticatieprofielen blijven beschikbaar voor terugdraaien/volgordebeheer

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik buiten de Codex CLI, waaronder OpenClaw-workflows.

De aanmeldopdracht gebruikt de canonieke provider-id van OpenAI:

```bash
openclaw models auth login --provider openai
```

Gebruik `--profile-id openai:<name>` voor meerdere ChatGPT/Codex OAuth-accounts in
één agent. Gebruik `openai-codex:<name>` niet voor nieuwe profielen. Doctor migreert
dat oudere voorvoegsel naar een conflictvrije profiel-id `openai:*`; voer
`openclaw models auth list --provider openai` uit na het herstel voordat je
profiel-id's naar `auth.order` of `/model ...@<profileId>` kopieert.

Opbouw van de flow (PKCE):

1. genereer een PKCE-verifier/challenge en een willekeurige `state`
2. open `https://auth.openai.com/oauth/authorize?...` (bereik
   `openid profile email offline_access`)
3. probeer de callback op `http://localhost:1455/auth/callback` op te vangen (de
   callbackhost is standaard `localhost` en accepteert alleen loopbackhosts;
   overschrijf dit met `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. als je een code kunt plakken voordat de callback binnenkomt (of je
   op afstand/headless werkt en de callback niet kan binden), plak dan in plaats daarvan
   de omleidings-URL/code — handmatig plakken concurreert met de browsercallback en wat
   het eerst wordt voltooid, wint
5. wissel de code in bij `https://auth.openai.com/oauth/token`
6. extraheer `accountId` uit het toegangstoken en sla `{ access, refresh, expires, accountId }` op

Het wizardpad is `openclaw onboard` → authenticatiekeuze `openai`.

## Vernieuwing + vervaldatum

Profielen slaan een tijdstempel `expires` op. Tijdens runtime:

- als `expires` in de toekomst ligt, gebruik je het opgeslagen toegangstoken
- als het is verlopen, vernieuw je het (onder een bestandsvergrendeling) en overschrijf je de opgeslagen aanmeldgegevens
- als een secundaire agent een overgenomen OAuth-profiel van de hoofdagent leest,
  wordt de vernieuwing teruggeschreven naar de opslag van de hoofdagent in plaats van het vernieuwingstoken
  naar de opslag van de secundaire agent te kopiëren
- extern beheerde CLI-aanmeldgegevens (Claude CLI, beperkte bootstrap van de Codex CLI;
  zie [De tokenbestemming](#the-token-sink-why-it-exists)) worden opnieuw gelezen in plaats van
  een gekopieerd vernieuwingstoken te gebruiken. Als een beheerde vernieuwing mislukt, meldt OpenClaw
  welk profiel opnieuw moet worden geauthenticeerd in plaats van
  extern CLI-tokenmateriaal terug te geven.

De vernieuwingsflow verloopt automatisch; doorgaans hoef je tokens niet handmatig te beheren.

## Meerdere accounts (profielen) + routering

Twee patronen:

### 1) Aanbevolen: afzonderlijke agents

Als je wilt dat 'persoonlijk' en 'werk' nooit met elkaar interageren, gebruik je geïsoleerde agents (afzonderlijke sessies + aanmeldgegevens + werkruimte):

```bash
openclaw agents add work
openclaw agents add personal
```

Configureer vervolgens de authenticatie per agent (wizard) en routeer chats naar de juiste agent.

### 2) Geavanceerd: meerdere profielen in één agent

De opslag voor authenticatieprofielen ondersteunt meerdere profiel-id's voor dezelfde provider.
Kies welke wordt gebruikt:

- globaal via de configuratievolgorde (`auth.order`)
- per sessie via `/model ...@<profileId>`

Voorbeeld (sessie-overschrijving):

- `/model Opus@anthropic:work`

Geef bestaande profiel-id's weer met:

```bash
openclaw models auth list --provider <id>
```

Gerelateerde documentatie:

- [Model-failover](/nl/concepts/model-failover) (regels voor rotatie + afkoelperiode)
- [Slash-opdrachten](/nl/tools/slash-commands) (opdrachtinterface)

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) - overzicht van authenticatie bij modelproviders
- [Geheimen](/nl/gateway/secrets) - opslag van aanmeldgegevens en SecretRef
- [Configuratiereferentie](/nl/gateway/configuration-reference#auth-storage) - configuratiesleutels voor authenticatie
