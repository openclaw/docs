---
read_when:
    - Vuoi comprendere OAuth in OpenClaw end-to-end
    - Hai riscontrato problemi di invalidazione del token / logout
    - Vuoi flussi di autenticazione Claude CLI o OAuth
    - Vuoi più account o instradamento dei profili
summary: 'OAuth in OpenClaw: scambio dei token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T08:37:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw supporta la “subscription auth” tramite OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per Anthropic, la distinzione pratica
ora è:

- **Chiave API Anthropic**: normale fatturazione API Anthropic
- **Anthropic Claude CLI / subscription auth dentro OpenClaw**: lo staff Anthropic
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

I provider OAuth spesso emettono un **nuovo refresh token** durante i flussi di login/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token più vecchi quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- fai login tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due in seguito viene “disconnesso” in modo casuale

Per ridurre questo problema, OpenClaw tratta `auth-profiles.json` come un **sink dei token**:

- il runtime legge le credenziali da **un solo posto**
- possiamo mantenere più profili e instradarli in modo deterministico
- quando le credenziali vengono riutilizzate da una CLI esterna come Codex CLI, OpenClaw
  le replica con la provenienza e rilegge quella sorgente esterna invece di
  ruotare da solo il refresh token

## Archiviazione (dove vivono i token)

I secret vengono archiviati **per agente**:

- Profili auth (OAuth + chiavi API + ref facoltativi a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono ripulite quando vengono trovate)

File legacy solo per importazione (ancora supportato, ma non è lo store principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutti i percorsi sopra rispettano anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/it/gateway/configuration-reference#auth-storage)

Per i ref di secret statici e il comportamento di attivazione dello snapshot a runtime, vedi [Gestione dei secret](/it/gateway/secrets).

## Compatibilità legacy del token Anthropic

<Warning>
La documentazione pubblica di Claude Code di Anthropic afferma che l'uso diretto di Claude Code resta entro
i limiti dell'abbonamento Claude, e lo staff Anthropic ci ha detto che l'uso in stile Claude
CLI di OpenClaw è di nuovo consentito. OpenClaw quindi tratta il riutilizzo di Claude CLI e
l'uso di `claude -p` come approvati per questa integrazione, a meno che Anthropic
non pubblichi una nuova policy.

Per la documentazione attuale di Anthropic sui piani diretti Claude Code, vedi [Uso di Claude Code
con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Uso di Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile subscription in OpenClaw, vedi [OpenAI
Codex](/it/providers/openai), [Qwen Cloud Coding
Plan](/it/providers/qwen), [MiniMax Coding Plan](/it/providers/minimax),
e [Z.AI / GLM Coding Plan](/it/providers/glm).
</Warning>

OpenClaw espone anche setup-token Anthropic come percorso supportato di autenticazione con token, ma ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.

## Migrazione Anthropic Claude CLI

OpenClaw supporta di nuovo il riutilizzo di Anthropic Claude CLI. Se hai già un login
Claude locale sull'host, l'onboarding/configure può riutilizzarlo direttamente.

## Scambio OAuth (come funziona il login)

I flussi di login interattivi di OpenClaw sono implementati in `@mariozechner/pi-ai` e collegati ai wizard/comandi.

### Setup-token Anthropic

Forma del flusso:

1. avvia setup-token Anthropic o paste-token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo auth
3. la selezione del modello resta su `anthropic/...`
4. i profili auth Anthropic esistenti restano disponibili per rollback/controllo dell'ordine

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth è esplicitamente supportato per l'uso al di fuori della Codex CLI, inclusi i flussi di lavoro OpenClaw.

Forma del flusso (PKCE):

1. genera verifier/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare il callback su `http://127.0.0.1:1455/auth/callback`
4. se il callback non può fare bind (oppure sei in remoto/headless), incolla l'URL/codice di redirect
5. esegui lo scambio su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dall'access token e archivia `{ access, refresh, expires, accountId }`

Il percorso del wizard è `openclaw onboard` → scelta auth `openai-codex`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa l'access token archiviato
- se è scaduto → fai refresh (sotto lock file) e sovrascrivi le credenziali archiviate
- eccezione: le credenziali CLI esterne riutilizzate restano gestite esternamente; OpenClaw
  rilegge lo store auth della CLI e non consuma mai da solo il refresh token copiato

Il flusso di refresh è automatico; in generale non devi gestire i token manualmente.

## Più account (profili) + instradamento

Due modelli:

### 1) Preferito: agenti separati

Se vuoi che “personale” e “lavoro” non interagiscano mai, usa agenti isolati (sessioni + credenziali + spazio di lavoro separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Poi configura l'auth per agente (wizard) e instrada le chat verso l'agente corretto.

### 2) Avanzato: più profili in un agente

`auth-profiles.json` supporta più ID profilo per lo stesso provider.

Scegli quale profilo usare:

- globalmente tramite l'ordine della configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override di sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documenti correlati:

- [/concepts/model-failover](/it/concepts/model-failover) (regole di rotazione + cooldown)
- [/tools/slash-commands](/it/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Autenticazione](/it/gateway/authentication) — panoramica dell'autenticazione del provider del modello
- [Secret](/it/gateway/secrets) — archiviazione delle credenziali e SecretRef
- [Riferimento configurazione](/it/gateway/configuration-reference#auth-storage) — chiavi di configurazione auth
