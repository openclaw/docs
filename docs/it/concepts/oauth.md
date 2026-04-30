---
read_when:
    - Vuoi comprendere OAuth di OpenClaw dall'inizio alla fine
    - Riscontri problemi di invalidazione dei token / disconnessione
    - Vuoi flussi di autenticazione tramite Claude CLI o OAuth
    - Vuoi più account o l’instradamento dei profili
summary: 'OAuth in OpenClaw: scambio di token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T08:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw supporta l’“autenticazione tramite abbonamento” via OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per Anthropic, la distinzione pratica
ora è:

- **Chiave API Anthropic**: normale fatturazione API Anthropic
- **Anthropic Claude CLI / autenticazione tramite abbonamento dentro OpenClaw**: lo staff di Anthropic
  ci ha comunicato che questo utilizzo è nuovamente consentito

OAuth di OpenAI Codex è esplicitamente supportato per l’uso in strumenti esterni come
OpenClaw. Questa pagina spiega:

Per Anthropic in produzione, l’autenticazione con chiave API è il percorso consigliato più sicuro.

- come funziona lo **scambio di token** OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + override per sessione)

OpenClaw supporta anche **Plugin di provider** che includono i propri flussi OAuth o con chiave API.
Eseguili con:

```bash
openclaw models auth login --provider <id>
```

## Il token sink (perché esiste)

I provider OAuth spesso generano un **nuovo refresh token** durante i flussi di accesso/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token precedenti quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- accedi tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due viene “disconnesso” casualmente più tardi

Per ridurre questo rischio, OpenClaw tratta `auth-profiles.json` come un **token sink**:

- il runtime legge le credenziali da **un unico posto**
- possiamo mantenere più profili e instradarli in modo deterministico
- il riutilizzo di CLI esterne è specifico del provider: Codex CLI può inizializzare un profilo vuoto
  `openai-codex:default`, ma una volta che OpenClaw ha un profilo OAuth locale,
  il refresh token locale è canonico; altre integrazioni possono restare
  gestite esternamente e rileggere il proprio archivio di autenticazione CLI
- i percorsi di stato e avvio che conoscono già l’insieme di provider configurati limitano
  il rilevamento delle CLI esterne a quell’insieme, così un archivio di login CLI non correlato non viene
  ispezionato per una configurazione con un solo provider

## Archiviazione (dove si trovano i token)

I segreti sono archiviati negli store di autenticazione dell’agente:

- Profili di autenticazione (OAuth + chiavi API + riferimenti opzionali a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono ripulite quando rilevate)

File legacy solo per importazione (ancora supportato, ma non è lo store principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutti i percorsi precedenti rispettano anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/it/gateway/configuration-reference#auth-storage)

Per i riferimenti statici ai segreti e il comportamento di attivazione degli snapshot a runtime, consulta [Gestione dei segreti](/it/gateway/secrets).

Quando un agente secondario non ha un profilo di autenticazione locale, OpenClaw usa l’ereditarietà in lettura
dallo store dell’agente predefinito/principale. Non clona `auth-profiles.json` dell’agente principale
durante la lettura. I refresh token OAuth sono particolarmente sensibili:
i normali flussi di copia li saltano per impostazione predefinita perché alcuni provider ruotano
o invalidano i refresh token dopo l’uso. Configura un login OAuth separato per un
agente quando gli serve un account indipendente.

## Compatibilità con token legacy Anthropic

<Warning>
La documentazione pubblica di Anthropic su Claude Code afferma che l’uso diretto di Claude Code resta entro
i limiti dell’abbonamento Claude, e lo staff di Anthropic ci ha comunicato che l’uso di tipo OpenClaw di Claude
CLI è nuovamente consentito. OpenClaw quindi considera il riutilizzo di Claude CLI e
l’uso di `claude -p` come autorizzati per questa integrazione, salvo che Anthropic
pubblichi una nuova policy.

Per la documentazione attuale di Anthropic sui piani direct-Claude-Code, consulta [Usare Claude Code
con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Usare Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile abbonamento in OpenClaw, consulta [OpenAI
Codex](/it/providers/openai), [Qwen Cloud Coding
Plan](/it/providers/qwen), [MiniMax Coding Plan](/it/providers/minimax),
e [Z.AI / GLM Coding Plan](/it/providers/glm).
</Warning>

OpenClaw espone anche il setup-token Anthropic come percorso supportato di autenticazione tramite token, ma ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.

## Migrazione ad Anthropic Claude CLI

OpenClaw supporta di nuovo il riutilizzo di Anthropic Claude CLI. Se hai già un login Claude locale
sull’host, l’onboarding/configurazione può riutilizzarlo direttamente.

## Scambio OAuth (come funziona il login)

I flussi di login interattivi di OpenClaw sono implementati in `@mariozechner/pi-ai` e collegati a procedure guidate/comandi.

### setup-token Anthropic

Forma del flusso:

1. avvia setup-token Anthropic o paste-token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo di autenticazione
3. la selezione del modello resta su `anthropic/...`
4. i profili di autenticazione Anthropic esistenti restano disponibili per rollback/controllo dell’ordine

### OpenAI Codex (ChatGPT OAuth)

OAuth di OpenAI Codex è esplicitamente supportato per l’uso fuori da Codex CLI, inclusi i workflow OpenClaw.

Forma del flusso (PKCE):

1. genera verifier/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare il callback su `http://127.0.0.1:1455/auth/callback`
4. se il callback non riesce a fare bind (o sei remoto/headless), incolla l’URL/codice di reindirizzamento
5. esegui lo scambio su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dal token di accesso e archivia `{ access, refresh, expires, accountId }`

Il percorso della procedura guidata è `openclaw onboard` → scelta di autenticazione `openai-codex`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa il token di accesso archiviato
- se è scaduto → esegui il refresh (sotto file lock) e sovrascrivi le credenziali archiviate
- se un agente secondario legge un profilo OAuth ereditato dall’agente principale, il refresh
  scrive nello store dell’agente principale invece di copiare il refresh token nello
  store dell’agente secondario
- eccezione: alcune credenziali CLI esterne restano gestite esternamente; OpenClaw
  rilegge quegli store di autenticazione CLI invece di consumare refresh token copiati.
  L’inizializzazione da Codex CLI è intenzionalmente più ristretta: crea un profilo vuoto
  `openai-codex:default`, poi i refresh di proprietà di OpenClaw mantengono canonico il profilo
  locale.

Il flusso di refresh è automatico; in genere non devi gestire i token manualmente.

## Più account (profili) + instradamento

Due pattern:

### 1) Preferito: agenti separati

Se vuoi che “personale” e “lavoro” non interagiscano mai, usa agenti isolati (sessioni + credenziali + workspace separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Poi configura l’autenticazione per agente (procedura guidata) e instrada le chat all’agente corretto.

### 2) Avanzato: più profili in un solo agente

`auth-profiles.json` supporta più ID profilo per lo stesso provider.

Scegli quale profilo viene usato:

- globalmente tramite l’ordine di configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override di sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documenti correlati:

- [Failover dei modelli](/it/concepts/model-failover) (regole di rotazione + cooldown)
- [Comandi slash](/it/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Autenticazione](/it/gateway/authentication) — panoramica dell’autenticazione dei provider di modelli
- [Segreti](/it/gateway/secrets) — archiviazione delle credenziali e SecretRef
- [Riferimento di configurazione](/it/gateway/configuration-reference#auth-storage) — chiavi di configurazione dell’autenticazione
