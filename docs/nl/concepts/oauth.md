---
read_when:
    - Je wilt OpenClaw OAuth van begin tot eind begrijpen
    - Je loopt tegen problemen met tokeninvalidatie / uitloggen aan
    - Je wilt authenticatiestromen voor Claude CLI of OAuth
    - Je wilt meerdere accounts of profielroutering
summary: 'OAuth in OpenClaw: tokenuitwisseling, opslag en patronen voor meerdere accounts'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:28:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw ondersteunt "abonnementsauthenticatie" via OAuth voor providers die dit aanbieden
(met name **OpenAI Codex (ChatGPT OAuth)**). Voor Anthropic is de praktische verdeling
nu:

- **Anthropic API-sleutel**: normale facturering voor de Anthropic API
- **Anthropic Claude CLI / abonnementsauthenticatie binnen OpenClaw**: Anthropic-medewerkers
  hebben ons verteld dat dit gebruik weer is toegestaan

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik in externe tools zoals
OpenClaw. Deze pagina legt uit:

Voor Anthropic in productie is authenticatie met API-sleutel de veiligere aanbevolen route.

- hoe de OAuth-**tokenuitwisseling** werkt (PKCE)
- waar tokens worden **opgeslagen** (en waarom)
- hoe je **meerdere accounts** afhandelt (profielen + overschrijvingen per sessie)

OpenClaw ondersteunt ook **provider-plugins** die hun eigen OAuth- of API-sleutel-
flows meeleveren. Voer ze uit via:

```bash
openclaw models auth login --provider <id>
```

## De tokenopvang (waarom die bestaat)

OAuth-providers maken vaak een **nieuw vernieuwingstoken** aan tijdens login- of vernieuwingsflows. Sommige providers (of OAuth-clients) kunnen oudere vernieuwingstokens ongeldig maken wanneer er een nieuw token voor dezelfde gebruiker/app wordt uitgegeven.

Praktisch symptoom:

- je logt in via OpenClaw _en_ via Claude Code / Codex CLI → een van beide wordt later willekeurig "uitgelogd"

Om dat te verminderen behandelt OpenClaw `auth-profiles.json` als een **tokenopvang**:

- de runtime leest referenties vanaf **één plek**
- we kunnen meerdere profielen behouden en ze deterministisch routeren
- hergebruik van externe CLI is providerspecifiek: Codex CLI kan een leeg
  `openai-codex:default`-profiel initialiseren, maar zodra OpenClaw een lokaal OAuth-profiel heeft,
  is het lokale vernieuwingstoken canoniek; andere integraties kunnen extern
  beheerd blijven en hun CLI-authenticatieopslag opnieuw lezen
- status- en opstartpaden die de geconfigureerde providerset al kennen, beperken
  externe CLI-detectie tot die set, zodat een niet-gerelateerde CLI-loginopslag niet
  wordt onderzocht voor een setup met één provider

## Opslag (waar tokens staan)

Geheimen worden opgeslagen in authenticatieopslag van agents:

- Authenticatieprofielen (OAuth + API-sleutels + optionele refs op waardeniveau): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Compatibiliteitsbestand voor legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-items worden opgeschoond wanneer ze worden gevonden)

Legacy-bestand alleen voor import (nog steeds ondersteund, maar niet de hoofdopslag):

- `~/.openclaw/credentials/oauth.json` (bij eerste gebruik geïmporteerd in `auth-profiles.json`)

Al het bovenstaande respecteert ook `$OPENCLAW_STATE_DIR` (overschrijving van de statusmap). Volledige referentie: [/gateway/configuration](/nl/gateway/configuration-reference#auth-storage)

Zie [Geheimenbeheer](/nl/gateway/secrets) voor statische geheime refs en activeringsgedrag van runtimesnapshots.

Wanneer een secundaire agent geen lokaal authenticatieprofiel heeft, gebruikt OpenClaw read-through
overerving vanuit de standaard-/hoofdagentopslag. Het kloont de `auth-profiles.json` van de hoofdagent
niet bij het lezen. OAuth-vernieuwingstokens zijn extra gevoelig:
normale kopieerflows slaan ze standaard over omdat sommige providers vernieuwingstokens na gebruik roteren
of ongeldig maken. Configureer een aparte OAuth-login voor een
agent wanneer die een onafhankelijk account nodig heeft.

## Compatibiliteit met Anthropic legacy-tokens

<Warning>
Anthropic's openbare Claude Code-documentatie zegt dat direct gebruik van Claude Code binnen
Claude-abonnementslimieten blijft, en Anthropic-medewerkers hebben ons verteld dat OpenClaw-achtig Claude
CLI-gebruik weer is toegestaan. OpenClaw behandelt hergebruik van Claude CLI en
gebruik van `claude -p` daarom als goedgekeurd voor deze integratie, tenzij Anthropic
een nieuw beleid publiceert.

Zie voor Anthropic's huidige documentatie over directe Claude Code-abonnementen [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
en [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Als je andere abonnementachtige opties in OpenClaw wilt, zie [OpenAI
Codex](/nl/providers/openai), [Qwen Cloud Coding
Plan](/nl/providers/qwen), [MiniMax Coding Plan](/nl/providers/minimax),
en [Z.AI / GLM Coding Plan](/nl/providers/glm).
</Warning>

OpenClaw stelt Anthropic setup-token ook beschikbaar als ondersteund token-authenticatiepad, maar geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Migratie naar Anthropic Claude CLI

OpenClaw ondersteunt hergebruik van Anthropic Claude CLI weer. Als je al een lokale
Claude-login op de host hebt, kan onboarding/configuratie die direct hergebruiken.

## OAuth-uitwisseling (hoe login werkt)

OpenClaw's interactieve loginflows zijn geïmplementeerd in `@earendil-works/pi-ai` en gekoppeld aan de wizards/commando's.

### Anthropic setup-token

Flowvorm:

1. start Anthropic setup-token of paste-token vanuit OpenClaw
2. OpenClaw slaat de resulterende Anthropic-referentie op in een authenticatieprofiel
3. modelselectie blijft op `anthropic/...`
4. bestaande Anthropic-authenticatieprofielen blijven beschikbaar voor rollback-/volgordebeheer

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik buiten de Codex CLI, inclusief OpenClaw-workflows.

Flowvorm (PKCE):

1. genereer PKCE verifier/challenge + willekeurige `state`
2. open `https://auth.openai.com/oauth/authorize?...`
3. probeer de callback op te vangen op `http://127.0.0.1:1455/auth/callback`
4. als callback niet kan binden (of je werkt remote/headless), plak dan de redirect-URL/code
5. wissel uit bij `https://auth.openai.com/oauth/token`
6. extraheer `accountId` uit het toegangstoken en sla `{ access, refresh, expires, accountId }` op

Wizardpad is `openclaw onboard` → authenticatiekeuze `openai-codex`.

## Vernieuwen + verlopen

Profielen slaan een `expires`-tijdstempel op.

Tijdens runtime:

- als `expires` in de toekomst ligt → gebruik het opgeslagen toegangstoken
- als het verlopen is → vernieuw (onder een bestandslock) en overschrijf de opgeslagen referenties
- als een secundaire agent een overgeërfd OAuth-profiel van de hoofdagent leest, schrijft
  vernieuwen terug naar de hoofdagentopslag in plaats van het vernieuwingstoken naar
  de opslag van de secundaire agent te kopiëren
- uitzondering: sommige externe CLI-referenties blijven extern beheerd; OpenClaw
  leest die CLI-authenticatieopslagen opnieuw in plaats van gekopieerde vernieuwingstokens te verbruiken.
  Codex CLI-bootstrap is bewust smaller: die seedt een leeg
  `openai-codex:default`-profiel, waarna door OpenClaw beheerde vernieuwingen het lokale
  profiel canoniek houden.

De vernieuwingsflow is automatisch; meestal hoef je tokens niet handmatig te beheren.

## Meerdere accounts (profielen) + routering

Twee patronen:

### 1) Aanbevolen: aparte agents

Als je wilt dat "persoonlijk" en "werk" nooit met elkaar interacteren, gebruik dan geïsoleerde agents (aparte sessies + referenties + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Configureer daarna authenticatie per agent (wizard) en routeer chats naar de juiste agent.

### 2) Geavanceerd: meerdere profielen in één agent

`auth-profiles.json` ondersteunt meerdere profiel-ID's voor dezelfde provider.

Kies welk profiel wordt gebruikt:

- globaal via configuratievolgorde (`auth.order`)
- per sessie via `/model ...@<profileId>`

Voorbeeld (sessie-overschrijving):

- `/model Opus@anthropic:work`

Hoe je ziet welke profiel-ID's bestaan:

- `openclaw channels list --json` (toont `auth[]`)

Gerelateerde documentatie:

- [Modelfailover](/nl/concepts/model-failover) (rotatie- en cooldownregels)
- [Slash-commando's](/nl/tools/slash-commands) (commandosurface)

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) - overzicht van authenticatie voor modelproviders
- [Geheimen](/nl/gateway/secrets) - opslag van referenties en SecretRef
- [Configuratiereferentie](/nl/gateway/configuration-reference#auth-storage) - authenticatieconfiguratiesleutels
