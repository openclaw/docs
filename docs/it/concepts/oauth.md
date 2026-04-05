---
read_when:
    - Vuoi comprendere OAuth in OpenClaw end-to-end
    - Hai riscontrato problemi di invalidazione dei token / logout
    - Vuoi i flussi di autenticazione Claude CLI o OAuth
    - Vuoi più account o instradamento dei profili
summary: 'OAuth in OpenClaw: scambio dei token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T13:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw supporta la “subscription auth” tramite OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per gli abbonamenti Anthropic, la nuova
configurazione dovrebbe usare il percorso di login locale **Claude CLI** sull'host gateway, ma
Anthropic distingue tra l'uso diretto di Claude Code e il percorso di riutilizzo di OpenClaw.
La documentazione pubblica di Anthropic per Claude Code afferma che l'uso diretto di Claude Code rientra
nei limiti dell'abbonamento Claude. Separatamente, Anthropic ha notificato agli utenti OpenClaw
il **4 aprile 2026 alle 12:00 PM PT / 8:00 PM BST** che OpenClaw è considerato
un harness di terze parti e ora richiede **Extra Usage** per quel traffico.
OpenAI Codex OAuth è esplicitamente supportato per l'uso in strumenti esterni come
OpenClaw. Questa pagina spiega:

Per Anthropic in produzione, l'autenticazione tramite chiave API è il percorso consigliato e più sicuro.

- come funziona lo **scambio** del token OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + override per sessione)

OpenClaw supporta anche **plugin provider** che distribuiscono i propri flussi OAuth o con chiave API.
Eseguili tramite:

```bash
openclaw models auth login --provider <id>
```

## Il token sink (perché esiste)

I provider OAuth spesso emettono un **nuovo refresh token** durante i flussi di login/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token più vecchi quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- effettui il login tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due in seguito risulta casualmente “disconnesso”

Per ridurre questo problema, OpenClaw tratta `auth-profiles.json` come un **token sink**:

- il runtime legge le credenziali da **un unico posto**
- possiamo mantenere più profili e instradarli in modo deterministico
- quando le credenziali vengono riutilizzate da una CLI esterna come Codex CLI, OpenClaw
  le rispecchia con provenienza e rilegge quella sorgente esterna invece di
  ruotare direttamente il refresh token

## Archiviazione (dove vivono i token)

I secret vengono archiviati **per agente**:

- Profili auth (OAuth + chiavi API + riferimenti facoltativi a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono ripulite quando rilevate)

File legacy solo per importazione (ancora supportato, ma non è l'archivio principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutto quanto sopra rispetta anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Per i riferimenti a secret statici e il comportamento di attivazione delle istantanee di runtime, vedi [Gestione dei secret](/gateway/secrets).

## Compatibilità legacy dei token Anthropic

<Warning>
La documentazione pubblica di Anthropic per Claude Code afferma che l'uso diretto di Claude Code rientra
nei limiti dell'abbonamento Claude. Separatamente, Anthropic ha comunicato agli utenti OpenClaw
il **4 aprile 2026 alle 12:00 PM PT / 8:00 PM BST** che **OpenClaw è considerato un
harness di terze parti**. I profili token Anthropic esistenti restano tecnicamente
utilizzabili in OpenClaw, ma Anthropic afferma che il percorso OpenClaw ora richiede **Extra
Usage** (pay-as-you-go fatturato separatamente dall'abbonamento) per quel
traffico.

Per la documentazione attuale di Anthropic sul piano diretto Claude Code, vedi [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile abbonamento in OpenClaw, vedi [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax),
e [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

OpenClaw ora espone di nuovo il setup-token Anthropic come percorso legacy/manuale.
L'avviso di fatturazione specifico per OpenClaw di Anthropic si applica ancora a quel percorso, quindi
usalo aspettandoti che Anthropic richieda **Extra Usage** per il
traffico Claude-login guidato da OpenClaw.

## Migrazione Anthropic Claude CLI

Se Claude CLI è già installato e autenticato sull'host gateway, puoi
spostare la selezione del modello Anthropic sul backend locale CLI. Questo è un
percorso OpenClaw supportato quando vuoi riutilizzare un login locale Claude CLI sullo
stesso host.

Prerequisiti:

- il binario `claude` è installato sull'host gateway
- Claude CLI è già autenticato lì tramite `claude auth login`

Comando di migrazione:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Scorciatoia di onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Questo mantiene i profili auth Anthropic esistenti per il rollback, ma riscrive il
percorso principale del modello predefinito da `anthropic/...` a `claude-cli/...`, riscrive
i fallback Anthropic Claude corrispondenti e aggiunge voci allowlist `claude-cli/...`
corrispondenti sotto `agents.defaults.models`.

Verifica:

```bash
openclaw models status
```

## Scambio OAuth (come funziona il login)

I flussi di login interattivo di OpenClaw sono implementati in `@mariozechner/pi-ai` e collegati alle procedure guidate/comandi.

### Anthropic Claude CLI

Forma del flusso:

Percorso Claude CLI:

1. accedi con `claude auth login` sull'host gateway
2. esegui `openclaw models auth login --provider anthropic --method cli --set-default`
3. non archiviare alcun nuovo profilo auth; sposta la selezione del modello su `claude-cli/...`
4. mantieni i profili auth Anthropic esistenti per il rollback

La documentazione pubblica di Anthropic per Claude Code descrive questo flusso diretto di
login all'abbonamento Claude per `claude` stesso. OpenClaw può riutilizzare quel login locale, ma
Anthropic classifica separatamente il percorso controllato da OpenClaw come utilizzo di harness di terze parti ai fini della fatturazione.

Percorso assistente interattivo:

- `openclaw onboard` / `openclaw configure` → scelta auth `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth è esplicitamente supportato per l'uso al di fuori di Codex CLI, inclusi i flussi di lavoro OpenClaw.

Forma del flusso (PKCE):

1. genera verifier/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare la callback su `http://127.0.0.1:1455/auth/callback`
4. se la callback non riesce a fare bind (o sei in remoto/headless), incolla l'URL/code di reindirizzamento
5. effettua lo scambio su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dall'access token e archivia `{ access, refresh, expires, accountId }`

Il percorso della procedura guidata è `openclaw onboard` → scelta auth `openai-codex`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa l'access token archiviato
- se è scaduto → esegui il refresh (con lock del file) e sovrascrivi le credenziali archiviate
- eccezione: le credenziali CLI esterne riutilizzate restano gestite esternamente; OpenClaw
  rilegge l'archivio auth della CLI e non consuma mai direttamente il refresh token copiato

Il flusso di refresh è automatico; in generale non devi gestire i token manualmente.

## Più account (profili) + instradamento

Due modelli:

### 1) Preferito: agenti separati

Se vuoi che “personale” e “lavoro” non interagiscano mai, usa agenti isolati (sessioni + credenziali + workspace separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Poi configura l'autenticazione per agente (procedura guidata) e instrada le chat verso l'agente corretto.

### 2) Avanzato: più profili in un solo agente

`auth-profiles.json` supporta più ID profilo per lo stesso provider.

Scegli quale profilo usare:

- globalmente tramite l'ordinamento nella configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override della sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documentazione correlata:

- [/concepts/model-failover](/concepts/model-failover) (regole di rotazione + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Autenticazione](/gateway/authentication) — panoramica dell'autenticazione dei provider di modelli
- [Secrets](/gateway/secrets) — archiviazione delle credenziali e SecretRef
- [Riferimento configurazione](/gateway/configuration-reference#auth-storage) — chiavi di configurazione auth
