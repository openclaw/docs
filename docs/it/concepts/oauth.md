---
read_when:
    - Vuoi comprendere OAuth di OpenClaw end-to-end
    - Riscontri problemi di invalidazione del token / disconnessione
    - Desideri flussi di autenticazione Claude CLI o OAuth
    - Vuoi più account o il routing dei profili
summary: 'OAuth in OpenClaw: scambio dei token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:26:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw supporta l'"auth tramite abbonamento" tramite OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per Anthropic, la divisione pratica
ora è:

- **Chiave API Anthropic**: normale fatturazione dell'API Anthropic
- **Anthropic Claude CLI / auth tramite abbonamento dentro OpenClaw**: lo staff Anthropic
  ci ha comunicato che questo utilizzo è di nuovo consentito

OpenAI Codex OAuth è esplicitamente supportato per l'uso in strumenti esterni come
OpenClaw.

OpenClaw archivia sia l'autenticazione con chiave API OpenAI sia l'OAuth ChatGPT/Codex sotto
l'id provider canonico `openai`. Gli id profilo `openai-codex:*` più vecchi e le voci
`auth.order.openai-codex` sono stato legacy riparato da
`openclaw doctor --fix`; usa gli id profilo `openai:*` e `auth.order.openai` per
la nuova configurazione.

Per Anthropic in produzione, l'autenticazione con chiave API è il percorso consigliato più sicuro.

Questa pagina spiega:

- come funziona lo **scambio di token** OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + override per sessione)

OpenClaw supporta anche **provider Plugin** che forniscono i propri flussi OAuth o con chiave API.
Eseguili tramite:

```bash
openclaw models auth login --provider <id>
```

## Il pozzo dei token (perché esiste)

I provider OAuth generano comunemente un **nuovo refresh token** durante i flussi di accesso/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token precedenti quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- accedi tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due viene "disconnesso" casualmente più tardi

Per ridurre questo problema, OpenClaw tratta `auth-profiles.json` come un **pozzo dei token**:

- il runtime legge le credenziali da **un solo posto**
- possiamo mantenere più profili e instradarli in modo deterministico
- il riutilizzo della CLI esterna è specifico del provider: Codex CLI può inizializzare un profilo
  `openai:default` vuoto, ma una volta che OpenClaw ha un profilo OAuth locale,
  il refresh token locale è canonico. Se quel refresh token locale viene rifiutato,
  OpenClaw può usare un token Codex CLI utilizzabile dello stesso account come ripiego solo
  a runtime; le altre integrazioni possono restare gestite esternamente e rileggere il proprio
  archivio di autenticazione CLI
- i percorsi di stato e avvio che conoscono già l'insieme di provider configurato limitano
  la discovery della CLI esterna a tale insieme, così un archivio di accesso CLI non correlato non viene
  interrogato per una configurazione con un solo provider

## Archiviazione (dove vivono i token)

I segreti vengono archiviati negli archivi di autenticazione degli agenti:

- Profili di autenticazione (OAuth + chiavi API + riferimenti opzionali a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono ripulite quando rilevate)

File legacy di sola importazione (ancora supportato, ma non è l'archivio principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutto quanto sopra rispetta anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/it/gateway/configuration-reference#auth-storage)

Per i riferimenti statici ai segreti e il comportamento di attivazione degli snapshot a runtime, vedi [Gestione dei segreti](/it/gateway/secrets).

Quando un agente secondario non ha un profilo di autenticazione locale, OpenClaw usa l'ereditarietà in lettura
dall'archivio dell'agente predefinito/principale. Non clona `auth-profiles.json` dell'agente principale
in lettura. I refresh token OAuth sono particolarmente sensibili: i normali flussi di copia li saltano per impostazione predefinita
perché alcuni provider ruotano o invalidano i refresh token dopo l'uso. Configura un accesso OAuth separato per un
agente quando richiede un account indipendente.

## Compatibilità dei token legacy Anthropic

<Warning>
La documentazione pubblica Claude Code di Anthropic afferma che l'uso diretto di Claude Code resta entro
i limiti dell'abbonamento Claude, e lo staff Anthropic ci ha comunicato che l'uso della Claude
CLI in stile OpenClaw è di nuovo consentito. OpenClaw quindi considera il riutilizzo della Claude CLI e
l'uso di `claude -p` autorizzati per questa integrazione, salvo che Anthropic
pubblichi una nuova policy.

Per la documentazione attuale dei piani direct-Claude-Code di Anthropic, vedi [Usare Claude Code
con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Usare Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile abbonamento in OpenClaw, vedi [OpenAI
Codex](/it/providers/openai), [Qwen Cloud Coding
Plan](/it/providers/qwen), [MiniMax Coding Plan](/it/providers/minimax),
e [Z.AI / GLM Coding Plan](/it/providers/zai).
</Warning>

OpenClaw espone anche il setup-token Anthropic come percorso di token-auth supportato, ma ora preferisce il riutilizzo della Claude CLI e `claude -p` quando disponibili.

## Migrazione Anthropic Claude CLI

OpenClaw supporta di nuovo il riutilizzo di Anthropic Claude CLI. Se hai già un accesso Claude locale
sull'host, onboarding/configure può riutilizzarlo direttamente.

## Scambio OAuth (come funziona l'accesso)

I flussi di accesso interattivi di OpenClaw sono implementati in `openclaw/plugin-sdk/llm` e collegati ai wizard/comandi.

### setup-token Anthropic

Forma del flusso:

1. avvia setup-token Anthropic o paste-token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo di autenticazione
3. la selezione del modello resta su `anthropic/...`
4. i profili di autenticazione Anthropic esistenti restano disponibili per rollback/controllo dell'ordine

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth è esplicitamente supportato per l'uso al di fuori di Codex CLI, inclusi i workflow OpenClaw.

Il comando di accesso usa ancora l'id provider OpenAI canonico:

```bash
openclaw models auth login --provider openai
```

Usa `--profile-id openai:<name>` per più account ChatGPT/Codex OAuth in
un agente. Non usare `openai-codex:<name>` per i nuovi profili. Doctor migra
quel prefisso più vecchio a un id profilo `openai:*` senza collisioni; esegui
`openclaw models auth list --provider openai` dopo la riparazione prima di copiare
gli id profilo in `auth.order` o `/model ...@<profileId>`.

Forma del flusso (PKCE):

1. genera verifier/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare la callback su `http://127.0.0.1:1455/auth/callback`
4. se la callback non può fare bind (o sei remoto/headless), incolla l'URL/codice di redirect
5. scambia presso `https://auth.openai.com/oauth/token`
6. estrai `accountId` dall'access token e archivia `{ access, refresh, expires, accountId }`

Il percorso del wizard è `openclaw onboard` → scelta di autenticazione `openai`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa l'access token archiviato
- se è scaduto → esegui il refresh (sotto file lock) e sovrascrivi le credenziali archiviate
- se un agente secondario legge un profilo OAuth dell'agente principale ereditato, il refresh
  scrive di nuovo nell'archivio dell'agente principale invece di copiare il refresh token nell'archivio
  dell'agente secondario
- eccezione: alcune credenziali CLI esterne restano gestite esternamente; OpenClaw
  rilegge quegli archivi di autenticazione CLI invece di consumare refresh token copiati.
  L'inizializzazione di Codex CLI è volutamente più ristretta: semina un profilo
  `openai:default` vuoto, poi i refresh di proprietà di OpenClaw mantengono canonico
  il profilo locale. Se il refresh locale di Codex fallisce e Codex CLI ha un
  token utilizzabile per lo stesso account, OpenClaw può usare quel token per la richiesta
  runtime corrente senza riscriverlo in `auth-profiles.json`.

Il flusso di refresh è automatico; in genere non devi gestire i token manualmente.

## Più account (profili) + routing

Due schemi:

### 1) Preferito: agenti separati

Se vuoi che "personale" e "lavoro" non interagiscano mai, usa agenti isolati (sessioni + credenziali + workspace separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Poi configura l'autenticazione per agente (wizard) e instrada le chat all'agente corretto.

### 2) Avanzato: più profili in un agente

`auth-profiles.json` supporta più ID profilo per lo stesso provider.

Scegli quale profilo viene usato:

- globalmente tramite ordinamento di configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override di sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documentazione correlata:

- [Failover del modello](/it/concepts/model-failover) (regole di rotazione + cooldown)
- [Comandi slash](/it/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Autenticazione](/it/gateway/authentication) - panoramica dell'autenticazione dei provider di modelli
- [Segreti](/it/gateway/secrets) - archiviazione delle credenziali e SecretRef
- [Riferimento di configurazione](/it/gateway/configuration-reference#auth-storage) - chiavi di configurazione dell'autenticazione
