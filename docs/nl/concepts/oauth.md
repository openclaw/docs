---
read_when:
    - Je wilt OpenClaw OAuth end-to-end begrijpen
    - Je loopt tegen problemen met tokeninvalidatie / uitloggen aan
    - Je wilt Claude CLI- of OAuth-authenticatiestromen
    - Je wilt meerdere accounts of profielroutering
summary: 'OAuth in OpenClaw: tokenuitwisseling, opslag en patronen voor meerdere accounts'
title: OAuth
x-i18n:
    generated_at: "2026-04-29T22:39:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw ondersteunt “abonnement-auth” via OAuth voor providers die dit aanbieden
(met name **OpenAI Codex (ChatGPT OAuth)**). Voor Anthropic is de praktische verdeling
nu:

- **Anthropic API-sleutel**: normale Anthropic API-facturering
- **Anthropic Claude CLI / abonnement-auth binnen OpenClaw**: Anthropic-medewerkers
  hebben ons verteld dat dit gebruik weer is toegestaan

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik in externe tools zoals
OpenClaw. Deze pagina legt uit:

Voor Anthropic in productie is API-sleutel-auth de veiligere aanbevolen route.

- hoe de OAuth-**tokenuitwisseling** werkt (PKCE)
- waar tokens worden **opgeslagen** (en waarom)
- hoe je **meerdere accounts** afhandelt (profielen + overschrijvingen per sessie)

OpenClaw ondersteunt ook **provider-plugins** die hun eigen OAuth- of API-sleutel-
flows leveren. Voer ze uit via:

```bash
openclaw models auth login --provider <id>
```

## De token-sink (waarom die bestaat)

OAuth-providers maken vaak een **nieuw refreshtoken** aan tijdens login-/refreshflows. Sommige providers (of OAuth-clients) kunnen oudere refreshtokens ongeldig maken wanneer er een nieuw token voor dezelfde gebruiker/app wordt uitgegeven.

Praktisch symptoom:

- je logt in via OpenClaw _en_ via Claude Code / Codex CLI → een van beide raakt later willekeurig “uitgelogd”

Om dat te beperken behandelt OpenClaw `auth-profiles.json` als een **token-sink**:

- de runtime leest inloggegevens vanaf **één plek**
- we kunnen meerdere profielen bewaren en ze deterministisch routeren
- hergebruik van externe CLI’s is provider-specifiek: Codex CLI kan een leeg
  `openai-codex:default`-profiel bootstrappen, maar zodra OpenClaw een lokaal OAuth-profiel heeft,
  is het lokale refreshtoken canoniek; andere integraties kunnen extern beheerd blijven
  en hun CLI-auth-opslag opnieuw lezen
- status- en opstartpaden die de geconfigureerde providerset al kennen, beperken
  externe CLI-detectie tot die set, zodat een niet-gerelateerde CLI-loginopslag niet
  wordt onderzocht voor een setup met één provider

## Opslag (waar tokens staan)

Geheimen worden opgeslagen in auth-opslagen van agents:

- Auth-profielen (OAuth + API-sleutels + optionele refs op waardeniveau): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-compatibiliteitsbestand: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-items worden opgeschoond wanneer ze worden gevonden)

Legacy-bestand alleen voor import (nog steeds ondersteund, maar niet de hoofdopslag):

- `~/.openclaw/credentials/oauth.json` (wordt bij eerste gebruik geïmporteerd in `auth-profiles.json`)

Al het bovenstaande respecteert ook `$OPENCLAW_STATE_DIR` (override voor state-dir). Volledige referentie: [/gateway/configuration](/nl/gateway/configuration-reference#auth-storage)

Voor statische secret-refs en runtimegedrag voor snapshot-activering, zie [Geheimenbeheer](/nl/gateway/secrets).

Wanneer een secundaire agent geen lokaal auth-profiel heeft, gebruikt OpenClaw read-through-
overerving vanuit de standaard-/hoofdopslag van de agent. Het kloont de
`auth-profiles.json` van de hoofdagent niet bij het lezen. OAuth-refreshtokens zijn bijzonder
gevoelig: normale kopieerflows slaan ze standaard over omdat sommige providers refreshtokens
na gebruik roteren of ongeldig maken. Configureer een aparte OAuth-login voor een
agent wanneer die een onafhankelijk account nodig heeft.

## Compatibiliteit met Anthropic legacy-tokens

<Warning>
Anthropic's publieke Claude Code-documentatie zegt dat direct Claude Code-gebruik binnen
Claude-abonnementslimieten blijft, en Anthropic-medewerkers hebben ons verteld dat Claude
CLI-gebruik in OpenClaw-stijl weer is toegestaan. OpenClaw behandelt hergebruik van Claude CLI en
`claude -p`-gebruik daarom als toegestaan voor deze integratie, tenzij Anthropic
nieuw beleid publiceert.

Voor Anthropic's huidige documentatie voor directe Claude Code-abonnementen, zie [Claude Code
gebruiken met je Pro- of Max-
abonnement](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
en [Claude Code gebruiken met je Team- of Enterprise-
abonnement](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Als je andere abonnementsachtige opties in OpenClaw wilt, zie [OpenAI
Codex](/nl/providers/openai), [Qwen Cloud Coding
Plan](/nl/providers/qwen), [MiniMax Coding Plan](/nl/providers/minimax),
en [Z.AI / GLM Coding Plan](/nl/providers/glm).
</Warning>

OpenClaw biedt ook Anthropic setup-token aan als ondersteund token-auth-pad, maar geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Migratie naar Anthropic Claude CLI

OpenClaw ondersteunt hergebruik van Anthropic Claude CLI weer. Als je al een lokale
Claude-login op de host hebt, kan onboarding/configuratie die direct hergebruiken.

## OAuth-uitwisseling (hoe login werkt)

De interactieve loginflows van OpenClaw zijn geïmplementeerd in `@mariozechner/pi-ai` en gekoppeld aan de wizards/commando’s.

### Anthropic setup-token

Flowvorm:

1. start Anthropic setup-token of paste-token vanuit OpenClaw
2. OpenClaw slaat de resulterende Anthropic-inloggegevens op in een auth-profiel
3. modelselectie blijft op `anthropic/...`
4. bestaande Anthropic-auth-profielen blijven beschikbaar voor rollback-/volgordebeheer

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik buiten de Codex CLI, inclusief OpenClaw-workflows.

Flowvorm (PKCE):

1. genereer PKCE-verifier/challenge + willekeurige `state`
2. open `https://auth.openai.com/oauth/authorize?...`
3. probeer de callback op `http://127.0.0.1:1455/auth/callback` op te vangen
4. als callback niet kan binden (of je werkt remote/headless), plak de redirect-URL/code
5. wissel uit bij `https://auth.openai.com/oauth/token`
6. haal `accountId` uit het access token en sla `{ access, refresh, expires, accountId }` op

Wizardpad is `openclaw onboard` → auth-keuze `openai-codex`.

## Refresh + vervaldatum

Profielen slaan een `expires`-tijdstempel op.

Tijdens runtime:

- als `expires` in de toekomst ligt → gebruik het opgeslagen access token
- als het verlopen is → refresh (onder een bestandslock) en overschrijf de opgeslagen inloggegevens
- als een secundaire agent een overgeërfd OAuth-profiel van de hoofdagent leest, schrijft refresh
  terug naar de opslag van de hoofdagent in plaats van het refreshtoken naar
  de opslag van de secundaire agent te kopiëren
- uitzondering: sommige externe CLI-inloggegevens blijven extern beheerd; OpenClaw
  leest die CLI-auth-opslagen opnieuw in plaats van gekopieerde refreshtokens te gebruiken.
  Codex CLI-bootstrap is bewust smaller: het seedt een leeg
  `openai-codex:default`-profiel, waarna OpenClaw-beheerde refreshes het lokale
  profiel canoniek houden.

De refreshflow is automatisch; meestal hoef je tokens niet handmatig te beheren.

## Meerdere accounts (profielen) + routering

Twee patronen:

### 1) Aanbevolen: aparte agents

Als je wilt dat “persoonlijk” en “werk” nooit met elkaar interacteren, gebruik dan geïsoleerde agents (aparte sessies + inloggegevens + werkruimte):

```bash
openclaw agents add work
openclaw agents add personal
```

Configureer daarna auth per agent (wizard) en routeer chats naar de juiste agent.

### 2) Geavanceerd: meerdere profielen in één agent

`auth-profiles.json` ondersteunt meerdere profiel-ID’s voor dezelfde provider.

Kies welk profiel wordt gebruikt:

- globaal via configuratievolgorde (`auth.order`)
- per sessie via `/model ...@<profileId>`

Voorbeeld (sessie-override):

- `/model Opus@anthropic:work`

Zo zie je welke profiel-ID’s bestaan:

- `openclaw channels list --json` (toont `auth[]`)

Gerelateerde docs:

- [Model-failover](/nl/concepts/model-failover) (rotatie- en cooldownregels)
- [Slash-commando’s](/nl/tools/slash-commands) (commandosurface)

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) — overzicht van auth voor modelproviders
- [Geheimen](/nl/gateway/secrets) — opslag van inloggegevens en SecretRef
- [Configuratiereferentie](/nl/gateway/configuration-reference#auth-storage) — auth-configuratiesleutels
