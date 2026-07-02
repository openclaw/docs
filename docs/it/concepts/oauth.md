---
read_when:
    - Vuoi comprendere OAuth di OpenClaw end-to-end
    - Riscontri problemi di invalidazione del token / disconnessione
    - Vuoi i flussi di autenticazione Claude CLI o OAuth
    - Vuoi più account o l'instradamento dei profili
summary: 'OAuth in OpenClaw: scambio di token, archiviazione e pattern multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:37:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw supporta "auth tramite abbonamento" via OAuth per i provider che la offrono
(in particolare **OpenAI Codex (ChatGPT OAuth)**). Per Anthropic, la distinzione pratica
ora è:

- **Chiave API Anthropic**: normale fatturazione dell'API Anthropic
- **Anthropic Claude CLI / auth tramite abbonamento dentro OpenClaw**: lo staff Anthropic
  ci ha comunicato che questo uso è di nuovo consentito

OpenAI Codex OAuth è esplicitamente supportato per l'uso in strumenti esterni come
OpenClaw.

OpenClaw archivia sia l'auth con chiave API OpenAI sia l'OAuth ChatGPT/Codex sotto
l'id provider canonico `openai`. Gli id profilo `openai-codex:*` più vecchi e le
voci `auth.order.openai-codex` sono stato legacy riparato da
`openclaw doctor --fix`; usa gli id profilo `openai:*` e `auth.order.openai` per
la nuova config.

Per Anthropic in produzione, l'auth con chiave API è il percorso consigliato più sicuro.

Questa pagina spiega:

- come funziona lo **scambio di token** OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + override per sessione)

OpenClaw supporta anche **Plugin provider** che forniscono i propri flussi OAuth
o con chiave API. Eseguili con:

```bash
openclaw models auth login --provider <id>
```

## Il token sink (perché esiste)

I provider OAuth spesso emettono un **nuovo refresh token** durante i flussi di login/refresh. Alcuni provider (o client OAuth) possono invalidare i refresh token precedenti quando ne viene emesso uno nuovo per lo stesso utente/app.

Sintomo pratico:

- accedi tramite OpenClaw _e_ tramite Claude Code / Codex CLI → uno dei due viene casualmente "disconnesso" in seguito

Per ridurre questo problema, OpenClaw tratta `auth-profiles.json` come un **token sink**:

- il runtime legge le credenziali da **un solo punto**
- possiamo mantenere più profili e instradarli in modo deterministico
- il riuso della CLI esterna è specifico del provider: Codex CLI può inizializzare
  un profilo `openai:default` vuoto, ma una volta che OpenClaw ha un profilo OAuth
  locale, il refresh token locale è canonico. Se quel refresh token locale viene
  rifiutato, OpenClaw segnala il profilo gestito per la riautenticazione invece di
  usare il materiale token di Codex CLI come fallback di runtime parallelo. Altre
  integrazioni possono rimanere gestite esternamente e rileggere il proprio store
  auth della CLI
- i percorsi di stato e avvio che conoscono già il set di provider configurato
  limitano la discovery della CLI esterna a quel set, quindi uno store di login
  CLI non correlato non viene sondato per una configurazione con un solo provider

## Archiviazione (dove vivono i token)

I segreti sono archiviati negli store auth degli agenti:

- Profili auth (OAuth + chiavi API + riferimenti opzionali a livello di valore): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono ripulite quando rilevate)

File legacy di sola importazione (ancora supportato, ma non lo store principale):

- `~/.openclaw/credentials/oauth.json` (importato in `auth-profiles.json` al primo utilizzo)

Tutto quanto sopra rispetta anche `$OPENCLAW_STATE_DIR` (override della directory di stato). Riferimento completo: [/gateway/configuration](/it/gateway/configuration-reference#auth-storage)

Per i riferimenti statici ai segreti e il comportamento di attivazione degli snapshot runtime, vedi [Gestione dei segreti](/it/gateway/secrets).

Quando un agente secondario non ha un profilo auth locale, OpenClaw usa
ereditarietà read-through dallo store dell'agente predefinito/principale. Non clona
`auth-profiles.json` dell'agente principale in lettura. I refresh token OAuth sono
particolarmente sensibili: i normali flussi di copia li saltano per impostazione
predefinita perché alcuni provider ruotano o invalidano i refresh token dopo l'uso.
Configura un login OAuth separato per un agente quando gli serve un account
indipendente.

## Compatibilità con token legacy Anthropic

<Warning>
La documentazione pubblica di Anthropic per Claude Code dice che l'uso diretto
di Claude Code rimane entro i limiti dell'abbonamento Claude, e lo staff Anthropic
ci ha comunicato che l'uso della Claude CLI in stile OpenClaw è di nuovo consentito.
OpenClaw quindi considera il riuso della Claude CLI e l'uso di `claude -p` come
autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova
policy.

Per la documentazione attuale di Anthropic sui piani direct-Claude-Code, vedi [Uso di Claude Code
con il tuo piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Uso di Claude Code con il tuo piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se vuoi altre opzioni in stile abbonamento in OpenClaw, vedi [OpenAI
Codex](/it/providers/openai), [Qwen Cloud Coding
Plan](/it/providers/qwen), [MiniMax Coding Plan](/it/providers/minimax),
e [Z.AI / GLM Coding Plan](/it/providers/zai).
</Warning>

OpenClaw espone anche il setup-token Anthropic come percorso di auth con token supportato, ma ora preferisce il riuso della Claude CLI e `claude -p` quando disponibili.

## Migrazione di Anthropic Claude CLI

OpenClaw supporta di nuovo il riuso di Anthropic Claude CLI. Se hai già un login
Claude locale sull'host, onboarding/configure può riutilizzarlo direttamente.

## Scambio OAuth (come funziona il login)

I flussi di login interattivi di OpenClaw sono implementati in `openclaw/plugin-sdk/llm` e collegati alle procedure guidate/ai comandi.

### setup-token Anthropic

Forma del flusso:

1. avvia setup-token Anthropic o paste-token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo auth
3. la selezione del modello rimane su `anthropic/...`
4. i profili auth Anthropic esistenti rimangono disponibili per rollback/controllo dell'ordine

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth è esplicitamente supportato per l'uso al di fuori della Codex CLI, inclusi i workflow OpenClaw.

Il comando di login usa ancora l'id provider OpenAI canonico:

```bash
openclaw models auth login --provider openai
```

Usa `--profile-id openai:<name>` per più account ChatGPT/Codex OAuth in
un agente. Non usare `openai-codex:<name>` per nuovi profili. Doctor migra
quel prefisso più vecchio a un id profilo `openai:*` senza collisioni; esegui
`openclaw models auth list --provider openai` dopo la riparazione prima di copiare
gli id profilo in `auth.order` o `/model ...@<profileId>`.

Forma del flusso (PKCE):

1. genera verifier/challenge PKCE + `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...`
3. prova a catturare il callback su `http://127.0.0.1:1455/auth/callback`
4. se il callback non può fare bind (o sei remoto/headless), incolla l'URL/codice di reindirizzamento
5. esegui lo scambio su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dall'access token e archivia `{ access, refresh, expires, accountId }`

Il percorso della procedura guidata è `openclaw onboard` → scelta auth `openai`.

## Refresh + scadenza

I profili archiviano un timestamp `expires`.

A runtime:

- se `expires` è nel futuro → usa l'access token archiviato
- se è scaduto → esegue il refresh (sotto file lock) e sovrascrive le credenziali archiviate
- se un agente secondario legge un profilo OAuth ereditato dall'agente principale,
  il refresh riscrive nello store dell'agente principale invece di copiare il refresh token
  nello store dell'agente secondario
- eccezione: alcune credenziali CLI esterne restano gestite esternamente; OpenClaw
  rilegge quegli store auth CLI invece di consumare refresh token copiati.
  Il bootstrap di Codex CLI è intenzionalmente più ristretto: può popolare un
  `openai:default` vuoto o un profilo OpenAI richiesto esplicitamente solo prima che
  OpenClaw possieda OAuth per il provider. Dopo di che, i refresh di proprietà di
  OpenClaw mantengono canonici i profili locali e la discovery non aggiunge auth
  Codex CLI in alcuno slot parallelo. Se un refresh gestito fallisce, OpenClaw
  segnala il profilo interessato per la riautenticazione invece di restituire
  materiale token dalla CLI esterna.

Il flusso di refresh è automatico; in genere non devi gestire i token manualmente.

## Più account (profili) + routing

Due pattern:

### 1) Preferito: agenti separati

Se vuoi che "personale" e "lavoro" non interagiscano mai, usa agenti isolati (sessioni + credenziali + workspace separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Poi configura l'auth per agente (procedura guidata) e instrada le chat all'agente corretto.

### 2) Avanzato: più profili in un agente

`auth-profiles.json` supporta più ID profilo per lo stesso provider.

Scegli quale profilo viene usato:

- globalmente tramite ordinamento della config (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (override di sessione):

- `/model Opus@anthropic:work`

Come vedere quali ID profilo esistono:

- `openclaw channels list --json` (mostra `auth[]`)

Documenti correlati:

- [Failover del modello](/it/concepts/model-failover) (regole di rotazione + cooldown)
- [Comandi slash](/it/tools/slash-commands) (superficie dei comandi)

## Correlati

- [Autenticazione](/it/gateway/authentication) - panoramica dell'auth dei provider di modelli
- [Segreti](/it/gateway/secrets) - archiviazione delle credenziali e SecretRef
- [Riferimento della configurazione](/it/gateway/configuration-reference#auth-storage) - chiavi di config auth
