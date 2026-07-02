---
read_when:
    - Je wilt OpenClaw OAuth end-to-end begrijpen
    - Je loopt tegen problemen met tokenongeldigmaking / uitloggen aan
    - Je wilt Claude CLI- of OAuth-authenticatiestromen
    - Je wilt meerdere accounts of profielroutering
summary: 'OAuth in OpenClaw: tokenuitwisseling, opslag en patronen voor meerdere accounts'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:39:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
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
OpenClaw.

OpenClaw slaat zowel OpenAI API-sleutel-authenticatie als ChatGPT/Codex OAuth op onder de
canonieke provider-id `openai`. Oudere `openai-codex:*`-profiel-id's en
`auth.order.openai-codex`-items zijn legacy-status die wordt gerepareerd door
`openclaw doctor --fix`; gebruik `openai:*`-profiel-id's en `auth.order.openai` voor
nieuwe configuratie.

Voor Anthropic in productie is API-sleutel-authenticatie het veiliger aanbevolen pad.

Deze pagina legt uit:

- hoe de OAuth-**tokenuitwisseling** werkt (PKCE)
- waar tokens worden **opgeslagen** (en waarom)
- hoe je **meerdere accounts** beheert (profielen + overrides per sessie)

OpenClaw ondersteunt ook **provider-plugins** die hun eigen OAuth- of API-sleutel-
flows meeleveren. Voer ze uit via:

```bash
openclaw models auth login --provider <id>
```

## De tokenopvang (waarom die bestaat)

OAuth-providers geven vaak een **nieuw refresh token** uit tijdens login-/refresh-flows. Sommige providers (of OAuth-clients) kunnen oudere refresh tokens ongeldig maken wanneer er een nieuwe wordt uitgegeven voor dezelfde gebruiker/app.

Praktisch symptoom:

- je logt in via OpenClaw _en_ via Claude Code / Codex CLI → een van beide wordt later willekeurig "uitgelogd"

Om dat te beperken, behandelt OpenClaw `auth-profiles.json` als een **tokenopvang**:

- de runtime leest credentials uit **één plek**
- we kunnen meerdere profielen behouden en ze deterministisch routeren
- hergebruik van externe CLI is providerspecifiek: Codex CLI kan een leeg
  `openai:default`-profiel initialiseren, maar zodra OpenClaw een lokaal OAuth-profiel heeft,
  is het lokale refresh token canoniek. Als dat lokale refresh token wordt geweigerd,
  meldt OpenClaw het beheerde profiel voor herauthenticatie in plaats van
  Codex CLI-tokenmateriaal te gebruiken als sibling-runtime-fallback. Andere integraties kunnen
  extern beheerd blijven en hun CLI-auth-store opnieuw inlezen
- status- en opstartpaden die de geconfigureerde providerset al kennen, beperken
  externe CLI-detectie tot die set, zodat een niet-gerelateerde CLI-login-store niet
  wordt onderzocht voor een setup met één provider

## Opslag (waar tokens staan)

Geheimen worden opgeslagen in auth-stores van agents:

- Auth-profielen (OAuth + API-sleutels + optionele refs op waardeniveau): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-compatibiliteitsbestand: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-items worden verwijderd wanneer ze worden ontdekt)

Legacy-bestand alleen voor import (nog steeds ondersteund, maar niet de hoofdopslag):

- `~/.openclaw/credentials/oauth.json` (bij eerste gebruik geïmporteerd in `auth-profiles.json`)

Al het bovenstaande respecteert ook `$OPENCLAW_STATE_DIR` (override voor state-dir). Volledige referentie: [/gateway/configuration](/nl/gateway/configuration-reference#auth-storage)

Voor statische secret-refs en het gedrag voor runtime-snapshotactivatie, zie [Geheimenbeheer](/nl/gateway/secrets).

Wanneer een secundaire agent geen lokaal auth-profiel heeft, gebruikt OpenClaw read-through-
overerving vanuit de standaard-/hoofd-agent-store. Het kloont de
`auth-profiles.json` van de hoofd-agent niet bij het lezen. OAuth-refresh tokens zijn extra
gevoelig: normale kopieerflows slaan ze standaard over omdat sommige providers refresh tokens
na gebruik roteren of ongeldig maken. Configureer een aparte OAuth-login voor een
agent wanneer die een onafhankelijk account nodig heeft.

## Compatibiliteit met legacy Anthropic-tokens

<Warning>
De openbare Claude Code-documentatie van Anthropic zegt dat direct gebruik van Claude Code binnen
Claude-abonnementslimieten blijft, en Anthropic-medewerkers hebben ons verteld dat OpenClaw-achtig Claude
CLI-gebruik weer is toegestaan. OpenClaw behandelt hergebruik van Claude CLI en
`claude -p`-gebruik daarom als goedgekeurd voor deze integratie, tenzij Anthropic
nieuw beleid publiceert.

Zie voor Anthropic's huidige documentatie voor directe Claude Code-abonnementen [Claude Code gebruiken
met je Pro- of Max-
abonnement](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
en [Claude Code gebruiken met je Team- of Enterprise-
abonnement](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Als je andere opties in abonnementsstijl in OpenClaw wilt, zie [OpenAI
Codex](/nl/providers/openai), [Qwen Cloud Coding
Plan](/nl/providers/qwen), [MiniMax Coding Plan](/nl/providers/minimax),
en [Z.AI / GLM Coding Plan](/nl/providers/zai).
</Warning>

OpenClaw stelt Anthropic setup-token ook beschikbaar als ondersteund token-authenticatiepad, maar geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.

## Migratie van Anthropic Claude CLI

OpenClaw ondersteunt hergebruik van Anthropic Claude CLI weer. Als je al een lokale
Claude-login op de host hebt, kan onboarding/configure die direct hergebruiken.

## OAuth-uitwisseling (hoe login werkt)

De interactieve login-flows van OpenClaw zijn geïmplementeerd in `openclaw/plugin-sdk/llm` en gekoppeld aan de wizards/commands.

### Anthropic setup-token

Flowvorm:

1. start Anthropic setup-token of paste-token vanuit OpenClaw
2. OpenClaw slaat de resulterende Anthropic-credential op in een auth-profiel
3. modelselectie blijft op `anthropic/...`
4. bestaande Anthropic-auth-profielen blijven beschikbaar voor rollback-/volgordebeheer

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik buiten de Codex CLI, inclusief OpenClaw-workflows.

De login-command gebruikt nog steeds de canonieke OpenAI-provider-id:

```bash
openclaw models auth login --provider openai
```

Gebruik `--profile-id openai:<name>` voor meerdere ChatGPT/Codex OAuth-accounts in
één agent. Gebruik geen `openai-codex:<name>` voor nieuwe profielen. Doctor migreert
dat oudere prefix naar een botsingsvrije `openai:*`-profiel-id; voer
`openclaw models auth list --provider openai` uit na reparatie voordat je
profiel-id's kopieert naar `auth.order` of `/model ...@<profileId>`.

Flowvorm (PKCE):

1. genereer PKCE-verifier/challenge + willekeurige `state`
2. open `https://auth.openai.com/oauth/authorize?...`
3. probeer de callback op te vangen op `http://127.0.0.1:1455/auth/callback`
4. als de callback niet kan binden (of je werkt remote/headless), plak dan de redirect-URL/code
5. wissel uit bij `https://auth.openai.com/oauth/token`
6. haal `accountId` uit het access token en sla `{ access, refresh, expires, accountId }` op

Het wizardpad is `openclaw onboard` → auth-keuze `openai`.

## Refresh + verlopen

Profielen slaan een `expires`-timestamp op.

Tijdens runtime:

- als `expires` in de toekomst ligt → gebruik het opgeslagen access token
- als het is verlopen → refresh (onder een file lock) en overschrijf de opgeslagen credentials
- als een secundaire agent een overgeërfd OAuth-profiel van de hoofd-agent leest, schrijft
  refresh terug naar de hoofd-agent-store in plaats van het refresh token te kopiëren naar
  de store van de secundaire agent
- uitzondering: sommige externe CLI-credentials blijven extern beheerd; OpenClaw
  leest die CLI-auth-stores opnieuw in in plaats van gekopieerde refresh tokens te gebruiken.
  Codex CLI-bootstrap is bewust nauwer: het kan alleen een leeg
  `openai:default` of expliciet aangevraagd OpenAI-profiel seed-en voordat OpenClaw
  eigenaar is van OAuth voor de provider. Daarna houden door OpenClaw beheerde refreshes lokale
  profielen canoniek en voegt detectie geen Codex CLI-auth toe in een sibling-
  slot. Als een beheerde refresh mislukt, meldt OpenClaw het getroffen profiel voor
  herauthenticatie in plaats van extern CLI-tokenmateriaal terug te geven.

De refresh-flow is automatisch; meestal hoef je tokens niet handmatig te beheren.

## Meerdere accounts (profielen) + routering

Twee patronen:

### 1) Voorkeur: aparte agents

Als je wilt dat "persoonlijk" en "werk" nooit met elkaar interageren, gebruik dan geïsoleerde agents (aparte sessies + credentials + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Configureer daarna auth per agent (wizard) en routeer chats naar de juiste agent.

### 2) Geavanceerd: meerdere profielen in één agent

`auth-profiles.json` ondersteunt meerdere profiel-ID's voor dezelfde provider.

Kies welk profiel wordt gebruikt:

- globaal via configuratievolgorde (`auth.order`)
- per sessie via `/model ...@<profileId>`

Voorbeeld (sessie-override):

- `/model Opus@anthropic:work`

Zo zie je welke profiel-ID's bestaan:

- `openclaw channels list --json` (toont `auth[]`)

Gerelateerde documentatie:

- [Model-failover](/nl/concepts/model-failover) (rotatie- + cooldownregels)
- [Slash commands](/nl/tools/slash-commands) (command-oppervlak)

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) - overzicht van authenticatie voor modelproviders
- [Geheimen](/nl/gateway/secrets) - credentialopslag en SecretRef
- [Configuratiereferentie](/nl/gateway/configuration-reference#auth-storage) - auth-configuratiesleutels
