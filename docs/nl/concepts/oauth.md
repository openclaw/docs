---
read_when:
    - Je wilt OpenClaw OAuth van begin tot eind begrijpen
    - Je loopt tegen problemen met tokenongeldigmaking / uitloggen aan
    - Je wilt Claude CLI- of OAuth-authenticatiestromen
    - Je wilt meerdere accounts of profielroutering
summary: 'OAuth in OpenClaw: tokenuitwisseling, opslag en patronen voor meerdere accounts'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:28:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw ondersteunt "subscription auth" via OAuth voor providers die dit aanbieden
(met name **OpenAI Codex (ChatGPT OAuth)**). Voor Anthropic is de praktische verdeling
nu:

- **Anthropic API-sleutel**: normale Anthropic API-facturering
- **Anthropic Claude CLI / subscription auth binnen OpenClaw**: Anthropic-medewerkers
  hebben ons verteld dat dit gebruik weer is toegestaan

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik in externe tools zoals
OpenClaw.

OpenClaw slaat zowel OpenAI API-sleutel-authenticatie als ChatGPT/Codex OAuth op onder de
canonieke provider-id `openai`. Oudere `openai-codex:*` profiel-id's en
`auth.order.openai-codex`-vermeldingen zijn legacy-status die wordt hersteld door
`openclaw doctor --fix`; gebruik `openai:*` profiel-id's en `auth.order.openai` voor
nieuwe configuratie.

Voor Anthropic in productie is authenticatie met een API-sleutel de veiliger aanbevolen route.

Deze pagina legt uit:

- hoe de OAuth-**tokenuitwisseling** werkt (PKCE)
- waar tokens worden **opgeslagen** (en waarom)
- hoe je **meerdere accounts** afhandelt (profielen + overschrijvingen per sessie)

OpenClaw ondersteunt ook **provider-plugins** die hun eigen OAuth- of API-sleutelstromen
meeleveren. Voer ze uit via:

```bash
openclaw models auth login --provider <id>
```

## De token-sink (waarom die bestaat)

OAuth-providers geven vaak een **nieuw refreshtoken** uit tijdens login-/refreshstromen. Sommige providers (of OAuth-clients) kunnen oudere refreshtokens ongeldig maken wanneer er een nieuw token wordt uitgegeven voor dezelfde gebruiker/app.

Praktisch symptoom:

- je logt in via OpenClaw _en_ via Claude Code / Codex CLI → een van beide wordt later willekeurig "uitgelogd"

Om dat te verminderen, behandelt OpenClaw `auth-profiles.json` als een **token-sink**:

- de runtime leest referenties vanaf **één plek**
- we kunnen meerdere profielen bewaren en ze deterministisch routeren
- extern CLI-hergebruik is providerspecifiek: Codex CLI kan een leeg
  `openai:default`-profiel initialiseren, maar zodra OpenClaw een lokaal OAuth-profiel heeft,
  is het lokale refreshtoken canoniek. Als dat lokale refreshtoken wordt geweigerd,
  kan OpenClaw een bruikbaar Codex CLI-token voor hetzelfde account gebruiken als runtime-only
  terugval; andere integraties kunnen extern beheerd blijven en hun
  CLI-authenticatieopslag opnieuw lezen
- status- en opstartpaden die de geconfigureerde providerset al kennen, beperken
  externe CLI-detectie tot die set, zodat een niet-gerelateerde CLI-loginopslag niet
  wordt onderzocht voor een configuratie met één provider

## Opslag (waar tokens staan)

Geheimen worden opgeslagen in agent-authenticatieopslagen:

- Authenticatieprofielen (OAuth + API-sleutels + optionele refs op waardeniveau): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-compatibiliteitsbestand: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-vermeldingen worden opgeschoond wanneer ze worden ontdekt)

Legacy-bestand alleen voor import (nog steeds ondersteund, maar niet de hoofdopslag):

- `~/.openclaw/credentials/oauth.json` (bij eerste gebruik geïmporteerd in `auth-profiles.json`)

Al het bovenstaande respecteert ook `$OPENCLAW_STATE_DIR` (overschrijving van statusmap). Volledige referentie: [/gateway/configuration](/nl/gateway/configuration-reference#auth-storage)

Voor statische geheime refs en runtime-snapshotactivatiegedrag, zie [Geheimenbeheer](/nl/gateway/secrets).

Wanneer een secundaire agent geen lokaal authenticatieprofiel heeft, gebruikt OpenClaw read-through
overerving vanuit de standaard-/hoofdagentopslag. Het kloont de
`auth-profiles.json` van de hoofdagent niet bij lezen. OAuth-refreshtokens zijn bijzonder
gevoelig: normale kopieerstromen slaan ze standaard over, omdat sommige providers
refreshtokens roteren of ongeldig maken na gebruik. Configureer een aparte OAuth-login voor een
agent wanneer die een onafhankelijk account nodig heeft.

## Compatibiliteit met Anthropic legacy-token

<Warning>
Anthropic's openbare Claude Code-documentatie zegt dat direct Claude Code-gebruik binnen
Claude-abonnementslimieten blijft, en Anthropic-medewerkers hebben ons verteld dat Claude
CLI-gebruik in OpenClaw-stijl weer is toegestaan. OpenClaw behandelt Claude CLI-hergebruik en
`claude -p`-gebruik daarom als toegestaan voor deze integratie, tenzij Anthropic
een nieuw beleid publiceert.

Voor Anthropic's huidige documentatie over directe Claude Code-abonnementen, zie [Claude Code gebruiken
met je Pro- of Max-
abonnement](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
en [Claude Code gebruiken met je Team- of Enterprise-
abonnement](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Als je andere abonnement-achtige opties in OpenClaw wilt, zie [OpenAI
Codex](/nl/providers/openai), [Qwen Cloud Coding
Plan](/nl/providers/qwen), [MiniMax Coding Plan](/nl/providers/minimax),
en [Z.AI / GLM Coding Plan](/nl/providers/zai).
</Warning>

OpenClaw biedt ook Anthropic setup-token aan als ondersteund token-authenticatiepad, maar geeft nu de voorkeur aan Claude CLI-hergebruik en `claude -p` wanneer beschikbaar.

## Migratie voor Anthropic Claude CLI

OpenClaw ondersteunt Anthropic Claude CLI-hergebruik weer. Als je al een lokale
Claude-login op de host hebt, kan onboarding/configure die direct hergebruiken.

## OAuth-uitwisseling (hoe inloggen werkt)

De interactieve login-stromen van OpenClaw zijn geïmplementeerd in `openclaw/plugin-sdk/llm` en gekoppeld aan de wizards/commando's.

### Anthropic setup-token

Stroomvorm:

1. start Anthropic setup-token of paste-token vanuit OpenClaw
2. OpenClaw slaat de resulterende Anthropic-referentie op in een authenticatieprofiel
3. modelselectie blijft op `anthropic/...`
4. bestaande Anthropic-authenticatieprofielen blijven beschikbaar voor rollback-/volgordebeheer

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wordt expliciet ondersteund voor gebruik buiten de Codex CLI, inclusief OpenClaw-workflows.

Het login-commando gebruikt nog steeds de canonieke OpenAI provider-id:

```bash
openclaw models auth login --provider openai
```

Gebruik `--profile-id openai:<name>` voor meerdere ChatGPT/Codex OAuth-accounts in
één agent. Gebruik `openai-codex:<name>` niet voor nieuwe profielen. Doctor migreert
dat oudere voorvoegsel naar een botsingsvrije `openai:*` profiel-id; voer
`openclaw models auth list --provider openai` uit na herstel voordat je
profiel-id's kopieert naar `auth.order` of `/model ...@<profileId>`.

Stroomvorm (PKCE):

1. genereer PKCE-verifier/challenge + willekeurige `state`
2. open `https://auth.openai.com/oauth/authorize?...`
3. probeer callback op te vangen op `http://127.0.0.1:1455/auth/callback`
4. als callback niet kan binden (of je werkt remote/headless), plak dan de redirect-URL/code
5. wissel uit bij `https://auth.openai.com/oauth/token`
6. haal `accountId` uit het toegangstoken en sla `{ access, refresh, expires, accountId }` op

Wizardpad is `openclaw onboard` → authenticatiekeuze `openai`.

## Refresh + vervaldatum

Profielen slaan een `expires`-tijdstempel op.

Tijdens runtime:

- als `expires` in de toekomst ligt → gebruik het opgeslagen toegangstoken
- als het verlopen is → refresh (onder een bestandslock) en overschrijf de opgeslagen referenties
- als een secundaire agent een geërfd OAuth-profiel van de hoofdagent leest, schrijft refresh
  terug naar de hoofdagentopslag in plaats van het refreshtoken naar
  de secundaire agentopslag te kopiëren
- uitzondering: sommige externe CLI-referenties blijven extern beheerd; OpenClaw
  leest die CLI-authenticatieopslagen opnieuw in plaats van gekopieerde refreshtokens te verbruiken.
  Codex CLI-bootstrap is bewust smaller: het seeddt een leeg
  `openai:default`-profiel, waarna OpenClaw-eigen refreshes het lokale
  profiel canoniek houden. Als de lokale Codex-refresh mislukt en Codex CLI een
  bruikbaar token voor hetzelfde account heeft, kan OpenClaw dat token gebruiken voor het huidige
  runtime-verzoek zonder het terug te schrijven naar `auth-profiles.json`.

De refreshstroom is automatisch; je hoeft tokens meestal niet handmatig te beheren.

## Meerdere accounts (profielen) + routering

Twee patronen:

### 1) Aanbevolen: aparte agents

Als je wilt dat "persoonlijk" en "werk" nooit met elkaar interageren, gebruik dan geïsoleerde agents (aparte sessies + referenties + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Configureer vervolgens authenticatie per agent (wizard) en routeer chats naar de juiste agent.

### 2) Geavanceerd: meerdere profielen in één agent

`auth-profiles.json` ondersteunt meerdere profiel-ID's voor dezelfde provider.

Kies welk profiel wordt gebruikt:

- globaal via configuratievolgorde (`auth.order`)
- per sessie via `/model ...@<profileId>`

Voorbeeld (sessie-overschrijving):

- `/model Opus@anthropic:work`

Zo zie je welke profiel-ID's bestaan:

- `openclaw channels list --json` (toont `auth[]`)

Gerelateerde docs:

- [Model-failover](/nl/concepts/model-failover) (rotatie- + cooldownregels)
- [Slash-commando's](/nl/tools/slash-commands) (commandosurface)

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) - overzicht van authenticatie voor modelproviders
- [Geheimen](/nl/gateway/secrets) - opslag van referenties en SecretRef
- [Configuratiereferentie](/nl/gateway/configuration-reference#auth-storage) - authenticatieconfiguratiesleutels
