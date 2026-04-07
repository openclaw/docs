---
read_when:
    - Vuoi comprendere OAuth end-to-end in OpenClaw
    - Hai problemi di invalidazione dei token / logout
    - Vuoi i flussi di autenticazione Claude CLI o OAuth
    - Vuoi usare più account o il routing dei profili
summary: 'OAuth in OpenClaw: scambio dei token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-04-07T08:12:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4117fee70e3e64fd3a762403454ac2b78de695d2b85a7146750c6de615921e02
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw supporta la “subscription auth” tramite OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per Anthropic, la distinzione
pratica ora è:

- **Chiave API Anthropic**: normale fatturazione API Anthropic
- **Autenticazione Anthropic Claude CLI / subscription auth dentro OpenClaw**: lo staff di Anthropic
  ci ha detto che questo utilizzo è di nuovo consentito

OpenAI Codex OAuth è esplicitamente supportato per l'uso in strumenti esterni come
OpenClaw. Questa pagina spiega:

Per Anthropic in produzione, l'autenticazione con chiave API è il percorso consigliato più sicuro.

- come funziona lo **scambio dei token** OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + override per sessione)

OpenClaw supporta anche **plugin provider** che includono i propri flussi OAuth o con chiave API.
Eseguili con:

```bash
openclaw models auth login --provider <id>
```

## Il sink dei token (perché esiste)

I provider OAuth spesso emettono un **nuovo refresh token** durante i flussi di login/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token meno recenti quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- fai login tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due in seguito viene “disconnesso” in modo apparentemente casuale

Per ridurre questo problema, OpenClaw tratta `auth-profiles.json` come un **sink dei token**:

- il runtime legge le credenziali da **un unico posto**
- possiamo mantenere più profili e instradarli in modo deterministico
- quando le credenziali vengono riutilizzate da una CLI esterna come Codex CLI, OpenClaw
  le rispecchia con provenienza e rilegge quella sorgente esterna invece di
  ruotare direttamente il proprio refresh token

## Archiviazione (dove vivono i token)

I segreti vengono archiviati **per agente**:

- Profili di autenticazione (OAuth + chiavi API + ref opzionali a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono ripulite quando rilevate)

File legacy solo per importazione (ancora supportato, ma non è l'archivio principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutto quanto sopra rispetta anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/it/gateway/configuration-reference#auth-storage)

Per i ref statici dei segreti e il comportamento di attivazione degli snapshot a runtime, vedi [Gestione dei segreti](/it/gateway/secrets).

## Compatibilità legacy dei token Anthropic

<Warning>
La documentazione pubblica di Claude Code di Anthropic afferma che l'uso diretto di Claude Code resta entro
i limiti dell'abbonamento Claude, e lo staff di Anthropic ci ha detto che l'uso di Claude
CLI in stile OpenClaw è di nuovo consentito. OpenClaw quindi tratta il riutilizzo di Claude CLI e
l'uso di `claude -p` come approvati per questa integrazione, a meno che Anthropic
non pubblichi una nuova policy.

Per la documentazione attuale di Anthropic sui piani direct-Claude-Code, vedi [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile subscription in OpenClaw, vedi [OpenAI
Codex](/it/providers/openai), [Qwen Cloud Coding
Plan](/it/providers/qwen), [MiniMax Coding Plan](/it/providers/minimax),
e [Z.AI / GLM Coding Plan](/it/providers/glm).
</Warning>

OpenClaw espone anche setup-token di Anthropic come percorso supportato di autenticazione tramite token, ma ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.

## Migrazione ad Anthropic Claude CLI

OpenClaw supporta di nuovo il riutilizzo di Anthropic Claude CLI. Se hai già un login
Claude locale sull'host, onboarding/configure può riutilizzarlo direttamente.

## Scambio OAuth (come funziona il login)

I flussi di login interattivi di OpenClaw sono implementati in `@mariozechner/pi-ai` e collegati ai wizard/comandi.

### Anthropic setup-token

Forma del flusso:

1. avvia Anthropic setup-token o paste-token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo di autenticazione
3. la selezione del modello rimane su `anthropic/...`
4. i profili di autenticazione Anthropic esistenti restano disponibili per rollback/controllo dell'ordine

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth è esplicitamente supportato per l'uso al di fuori di Codex CLI, inclusi i workflow OpenClaw.

Forma del flusso (PKCE):

1. genera verifier/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare il callback su `http://127.0.0.1:1455/auth/callback`
4. se il callback non può fare bind (o sei in remoto/headless), incolla l'URL di redirect/il codice
5. esegui lo scambio su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dal token di accesso e archivia `{ access, refresh, expires, accountId }`

Il percorso del wizard è `openclaw onboard` → scelta di autenticazione `openai-codex`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa il token di accesso archiviato
- se è scaduto → esegui il refresh (sotto file lock) e sovrascrivi le credenziali archiviate
- eccezione: le credenziali riutilizzate da CLI esterne restano gestite esternamente; OpenClaw
  rilegge l'archivio di autenticazione della CLI e non usa mai direttamente il refresh token copiato

Il flusso di refresh è automatico; in generale non devi gestire i token manualmente.

## Più account (profili) + routing

Due modelli:

### 1) Preferito: agenti separati

Se vuoi che “personale” e “lavoro” non interagiscano mai, usa agenti isolati (sessioni + credenziali + workspace separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Quindi configura l'autenticazione per agente (wizard) e instrada le chat all'agente corretto.

### 2) Avanzato: più profili in un agente

`auth-profiles.json` supporta più ID profilo per lo stesso provider.

Scegli quale profilo usare:

- globalmente tramite l'ordinamento di configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override di sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documenti correlati:

- [/concepts/model-failover](/it/concepts/model-failover) (regole di rotazione + cooldown)
- [/tools/slash-commands](/it/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Autenticazione](/it/gateway/authentication) — panoramica dell'autenticazione dei provider di modelli
- [Segreti](/it/gateway/secrets) — archiviazione delle credenziali e SecretRef
- [Riferimento alla configurazione](/it/gateway/configuration-reference#auth-storage) — chiavi di configurazione dell'autenticazione
