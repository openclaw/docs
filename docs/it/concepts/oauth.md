---
read_when:
    - Vuoi comprendere OAuth di OpenClaw dall'inizio alla fine
    - Riscontri problemi di invalidazione del token / disconnessione
    - Si desiderano flussi di autenticazione tramite Claude CLI o OAuth
    - Vuoi più account o il routing dei profili
summary: 'OAuth in OpenClaw: scambio dei token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T08:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw supporta l'"autenticazione tramite abbonamento" via OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per Anthropic, la distinzione pratica
ora è:

- **Chiave API Anthropic**: normale fatturazione dell'API Anthropic
- **Anthropic Claude CLI / autenticazione tramite abbonamento dentro OpenClaw**: lo staff di Anthropic
  ci ha comunicato che questo utilizzo è di nuovo consentito

OpenAI Codex OAuth è esplicitamente supportato per l'uso in strumenti esterni come
OpenClaw. Questa pagina spiega:

Per Anthropic in produzione, l'autenticazione con chiave API è il percorso consigliato più sicuro.

- come funziona lo **scambio di token** OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + override per sessione)

OpenClaw supporta anche **Plugin dei provider** che includono i propri flussi OAuth o con chiave API.
Eseguili tramite:

```bash
openclaw models auth login --provider <id>
```

## Il token sink (perché esiste)

I provider OAuth generano comunemente un **nuovo refresh token** durante i flussi di accesso/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token precedenti quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- accedi tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due in seguito risulta "disconnesso" in modo casuale

Per ridurre questo problema, OpenClaw tratta `auth-profiles.json` come un **token sink**:

- il runtime legge le credenziali da **un solo punto**
- possiamo mantenere più profili e instradarli in modo deterministico
- il riutilizzo di CLI esterne è specifico del provider: Codex CLI può inizializzare un profilo
  `openai-codex:default` vuoto, ma una volta che OpenClaw ha un profilo OAuth locale,
  il refresh token locale è canonico; le altre integrazioni possono restare
  gestite esternamente e rileggere il proprio archivio di autenticazione CLI
- i percorsi di stato e avvio che conoscono già l'insieme dei provider configurati limitano
  l'individuazione delle CLI esterne a quell'insieme, quindi l'archivio di accesso CLI non correlato
  non viene interrogato per una configurazione con un solo provider

## Archiviazione (dove risiedono i token)

I segreti sono archiviati negli archivi di autenticazione degli agenti:

- Profili di autenticazione (OAuth + chiavi API + riferimenti opzionali a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono rimosse quando rilevate)

File legacy solo per importazione (ancora supportato, ma non è l'archivio principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutti i percorsi precedenti rispettano anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/it/gateway/configuration-reference#auth-storage)

Per i riferimenti statici ai segreti e il comportamento di attivazione degli snapshot a runtime, consulta [Gestione dei segreti](/it/gateway/secrets).

Quando un agente secondario non ha un profilo di autenticazione locale, OpenClaw usa l'ereditarietà
in lettura dall'archivio dell'agente predefinito/principale. Non clona `auth-profiles.json`
dell'agente principale in lettura. I refresh token OAuth sono particolarmente
sensibili: i normali flussi di copia li ignorano per impostazione predefinita perché alcuni provider ruotano
o invalidano i refresh token dopo l'uso. Configura un accesso OAuth separato per un
agente quando ha bisogno di un account indipendente.

## Compatibilità con i token legacy di Anthropic

<Warning>
La documentazione pubblica di Anthropic per Claude Code dice che l'uso diretto di Claude Code resta entro
i limiti dell'abbonamento Claude, e lo staff di Anthropic ci ha comunicato che l'utilizzo in stile OpenClaw della Claude
CLI è di nuovo consentito. OpenClaw quindi considera il riutilizzo della Claude CLI e
l'uso di `claude -p` come approvati per questa integrazione, salvo pubblicazione da parte di Anthropic
di una nuova policy.

Per la documentazione attuale di Anthropic sui piani direct-Claude-Code, consulta [Usare Claude Code
con il tuo piano Pro o Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Usare Claude Code con il tuo piano Team o Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile abbonamento in OpenClaw, consulta [OpenAI
Codex](/it/providers/openai), [Piano Qwen Cloud Coding
Plan](/it/providers/qwen), [Piano MiniMax Coding Plan](/it/providers/minimax),
e [Piano Z.AI / GLM Coding Plan](/it/providers/glm).
</Warning>

OpenClaw espone anche il token di configurazione Anthropic come percorso di autenticazione con token supportato, ma ora preferisce il riutilizzo della Claude CLI e `claude -p` quando disponibili.

## Migrazione della Claude CLI di Anthropic

OpenClaw supporta di nuovo il riutilizzo della Claude CLI di Anthropic. Se hai già un accesso locale
a Claude sull'host, onboarding/configure può riutilizzarlo direttamente.

## Scambio OAuth (come funziona l'accesso)

I flussi di accesso interattivi di OpenClaw sono implementati in `@mariozechner/pi-ai` e collegati a wizard/comandi.

### Token di configurazione Anthropic

Forma del flusso:

1. avvia il token di configurazione Anthropic o incolla il token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo di autenticazione
3. la selezione del modello resta su `anthropic/...`
4. i profili di autenticazione Anthropic esistenti restano disponibili per rollback/controllo dell'ordine

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth è esplicitamente supportato per l'uso fuori dalla Codex CLI, inclusi i flussi di lavoro OpenClaw.

Forma del flusso (PKCE):

1. genera verificatore/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare il callback su `http://127.0.0.1:1455/auth/callback`
4. se il callback non riesce a collegarsi (o sei remoto/headless), incolla l'URL/codice di redirect
5. esegui lo scambio su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dal token di accesso e archivia `{ access, refresh, expires, accountId }`

Il percorso del wizard è `openclaw onboard` → scelta di autenticazione `openai-codex`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa il token di accesso archiviato
- se è scaduto → esegui il refresh (sotto file lock) e sovrascrivi le credenziali archiviate
- se un agente secondario legge un profilo OAuth ereditato dall'agente principale, il refresh
  scrive nell'archivio dell'agente principale invece di copiare il refresh token nell'archivio
  dell'agente secondario
- eccezione: alcune credenziali CLI esterne restano gestite esternamente; OpenClaw
  rilegge quegli archivi di autenticazione CLI invece di consumare refresh token copiati.
  L'inizializzazione di Codex CLI è intenzionalmente più ristretta: crea un profilo
  `openai-codex:default` vuoto, poi i refresh gestiti da OpenClaw mantengono canonico
  il profilo locale.

Il flusso di refresh è automatico; in genere non devi gestire i token manualmente.

## Più account (profili) + instradamento

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

Scegli quale profilo usare:

- globalmente tramite l'ordine di configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override di sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documentazione correlata:

- [Failover dei modelli](/it/concepts/model-failover) (regole di rotazione + cooldown)
- [Comandi slash](/it/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Autenticazione](/it/gateway/authentication) - panoramica sull'autenticazione dei provider di modelli
- [Segreti](/it/gateway/secrets) - archiviazione delle credenziali e SecretRef
- [Riferimento alla configurazione](/it/gateway/configuration-reference#auth-storage) - chiavi di configurazione dell'autenticazione
