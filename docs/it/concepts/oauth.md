---
read_when:
    - Vuoi comprendere il funzionamento completo di OAuth in OpenClaw
    - Si verificano problemi di invalidazione del token / disconnessione
    - Vuoi i flussi di autenticazione tramite Claude CLI o OAuth
    - Vuoi più account o l'instradamento dei profili
summary: 'OAuth in OpenClaw: scambio dei token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T07:01:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw supporta OAuth ("autenticazione tramite abbonamento") per i provider che lo offrono,
in particolare **OpenAI Codex (OAuth di ChatGPT)** e **riutilizzo della CLI Anthropic Claude**.
Per Anthropic, la distinzione pratica è:

- **Chiave API Anthropic**: normale fatturazione dell'API Anthropic.
- **CLI Anthropic Claude / autenticazione tramite abbonamento in OpenClaw**: il personale di Anthropic
  ci ha comunicato che questo utilizzo è nuovamente consentito, quindi OpenClaw considera autorizzati il riutilizzo della CLI Claude e
  l'uso di `claude -p` per questa integrazione, a meno che Anthropic
  non pubblichi una nuova politica. Per Anthropic in produzione, l'autenticazione con chiave API rimane
  comunque il percorso consigliato più sicuro.

OpenClaw archivia sia l'autenticazione tramite chiave API OpenAI sia OAuth di ChatGPT/Codex con
l'ID canonico del provider `openai`. Gli ID di profilo `openai-codex:*` meno recenti e
le voci `auth.order.openai-codex` sono uno stato legacy corretto da
`openclaw doctor --fix`; per le nuove configurazioni, usa gli ID di profilo `openai:*` e `auth.order.openai`.

Questa pagina descrive:

- come funziona lo **scambio di token** OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + sostituzioni specifiche per sessione)

I Plugin dei provider che includono un proprio flusso OAuth o con chiave API passano dallo
stesso punto di ingresso:

```bash
openclaw models auth login --provider <id>
```

## Il collettore di token (perché esiste)

I provider OAuth generano comunemente un nuovo token di aggiornamento a ogni accesso/aggiornamento.
Alcuni provider invalidano il token di aggiornamento precedente quando ne viene
emesso uno nuovo per lo stesso utente/app. Sintomo pratico: accedi tramite OpenClaw _e_
tramite Claude Code / CLI Codex e, in seguito, uno dei due viene disconnesso in modo apparentemente casuale.

Per ridurre questo problema, OpenClaw considera l'archivio dei profili di autenticazione un **collettore di token**:

- il runtime legge le credenziali da un'unica posizione per agente
- più profili possono coesistere ed essere instradati in modo deterministico
- il riutilizzo di CLI esterne dipende dal provider: quando OpenClaw possiede un profilo OAuth
  locale per un provider, il token di aggiornamento locale è canonico. Se tale token di
  aggiornamento locale viene rifiutato, OpenClaw segnala il profilo affinché venga
  autenticato nuovamente, anziché ricorrere al materiale dei token della CLI esterna.
  L'inizializzazione tramite CLI Codex è ancora più limitata: può soltanto popolare un profilo vuoto
  nello stile `openai:default` prima che OpenClaw acquisisca la gestione di OAuth per quel
  provider; successivamente, gli aggiornamenti gestiti da OpenClaw rimangono canonici
- i percorsi di stato/avvio limitano il rilevamento delle CLI esterne all'insieme di provider
  già configurati, perciò l'archivio di accesso di una CLI non correlata non viene esaminato in una
  configurazione con un solo provider

## Archiviazione (dove risiedono i token)

I segreti risiedono per ogni agente e sono identificati dal nome logico `auth-profiles.json`
(l'archivio sottostante è il database SQLite dell'agente; il nome JSON viene mantenuto per
compatibilità e visualizzazione negli strumenti):

- Profili di autenticazione (OAuth + chiavi API + riferimenti facoltativi a livello di valore):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono rimosse quando rilevate)

File legacy destinato esclusivamente all'importazione (ancora supportato, ma non è l'archivio principale):

- `~/.openclaw/credentials/oauth.json` (importato nell'archivio dei profili di autenticazione al primo utilizzo)

Tutti i percorsi precedenti rispettano anche `$OPENCLAW_STATE_DIR` (sostituzione della directory di stato). Riferimento completo: [/gateway/configuration-reference#auth-storage](/it/gateway/configuration-reference#auth-storage)

Per i riferimenti statici ai segreti e il comportamento di attivazione delle istantanee del runtime, consulta [Gestione dei segreti](/it/gateway/secrets).

Quando un agente secondario non dispone di un profilo di autenticazione locale, OpenClaw usa l'ereditarietà
in lettura dall'archivio dell'agente predefinito/principale; durante la lettura non clona l'archivio
dell'agente principale. I token di aggiornamento OAuth sono particolarmente sensibili: i normali
flussi di copia li ignorano per impostazione predefinita perché alcuni provider ruotano o invalidano
i token di aggiornamento dopo l'uso. Configura un accesso OAuth separato per un agente quando
necessita di un account indipendente.

## Riutilizzo della CLI Anthropic Claude

OpenClaw supporta il riutilizzo della CLI Anthropic Claude e `claude -p` come percorso di
autenticazione autorizzato. Se sull'host è già presente un accesso locale a Claude,
la procedura iniziale/configurazione può riutilizzarlo direttamente. Il token di configurazione Anthropic rimane
disponibile come percorso supportato per l'autenticazione tramite token, ma OpenClaw preferisce il riutilizzo della CLI Claude
quando è disponibile.

<Warning>
La documentazione pubblica di Anthropic relativa a Claude Code afferma che l'uso diretto di Claude Code rimane entro
i limiti dell'abbonamento Claude, e il personale di Anthropic ci ha comunicato che l'uso della CLI Claude
nello stile di OpenClaw è nuovamente consentito. OpenClaw considera quindi autorizzati il riutilizzo della CLI Claude e
l'uso di `claude -p` per questa integrazione, a meno che Anthropic
non pubblichi una nuova politica.

Per la documentazione attuale di Anthropic sui piani per l'uso diretto di Claude Code, consulta [Utilizzo di Claude Code
con il piano Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Utilizzo di Claude Code con il piano Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se desideri altre opzioni basate su abbonamento in OpenClaw, consulta [OpenAI
Codex](/it/providers/openai), [Piano di programmazione Qwen Cloud](/it/providers/qwen), [Piano di programmazione MiniMax](/it/providers/minimax)
e [Piano di programmazione Z.AI / GLM](/it/providers/zai).
</Warning>

## Scambio OAuth (come funziona l'accesso)

I flussi di accesso interattivi di OpenClaw sono implementati in `openclaw/plugin-sdk/llm.ts` e collegati alle procedure guidate/ai comandi.

### Token di configurazione Anthropic

Struttura del flusso:

1. avvia il token di configurazione o l'inserimento del token di Anthropic da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo di autenticazione
3. la selezione del modello rimane su `anthropic/...`
4. i profili di autenticazione Anthropic esistenti restano disponibili per il ripristino/controllo dell'ordine

### OpenAI Codex (OAuth di ChatGPT)

OAuth di OpenAI Codex è esplicitamente supportato per l'uso esterno alla CLI Codex, inclusi i flussi di lavoro OpenClaw.

Il comando di accesso usa l'ID canonico del provider OpenAI:

```bash
openclaw models auth login --provider openai
```

Usa `--profile-id openai:<name>` per più account OAuth ChatGPT/Codex in
un singolo agente. Non usare `openai-codex:<name>` per i nuovi profili. Doctor migra
il prefisso precedente a un ID di profilo `openai:*` privo di collisioni; esegui
`openclaw models auth list --provider openai` dopo la correzione, prima di copiare
gli ID di profilo in `auth.order` o `/model ...@<profileId>`.

Struttura del flusso (PKCE):

1. genera un verificatore/una challenge PKCE e un valore `state` casuale
2. apri `https://auth.openai.com/oauth/authorize?...` (ambito
   `openid profile email offline_access`)
3. prova ad acquisire la richiamata su `http://localhost:1455/auth/callback` (l'host della
   richiamata è per impostazione predefinita `localhost` e accetta solo host local loopback;
   sostituiscilo con `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. se puoi incollare un codice prima che arrivi la richiamata (oppure operi
   da remoto/senza interfaccia grafica e non è possibile associare la richiamata), incolla invece l'URL/il codice di reindirizzamento:
   l'inserimento manuale compete con la richiamata del browser e prevale quello che
   termina per primo
5. scambia il codice su `https://auth.openai.com/oauth/token`
6. estrai `accountId` dal token di accesso e archivia `{ access, refresh, expires, accountId }`

Il percorso della procedura guidata è `openclaw onboard` → scelta di autenticazione `openai`.

## Aggiornamento + scadenza

I profili archiviano una marca temporale `expires`. Durante l'esecuzione:

- se `expires` è nel futuro, usa il token di accesso archiviato
- se è scaduto, esegui l'aggiornamento (con un blocco del file) e sovrascrivi le credenziali archiviate
- se un agente secondario legge un profilo OAuth ereditato dall'agente principale,
  l'aggiornamento viene scritto nell'archivio dell'agente principale, anziché copiare il token di aggiornamento
  nell'archivio dell'agente secondario
- le credenziali CLI gestite esternamente (CLI Claude, inizializzazione limitata tramite CLI Codex;
  consulta [Il collettore di token](#the-token-sink-why-it-exists)) vengono rilette anziché
  utilizzare un token di aggiornamento copiato. Se un aggiornamento gestito non riesce, OpenClaw
  segnala il profilo interessato affinché venga autenticato nuovamente, anziché restituire
  il materiale dei token della CLI esterna.

Il flusso di aggiornamento è automatico; in genere non è necessario gestire manualmente i token.

## Più account (profili) + instradamento

Due modelli:

### 1) Opzione preferita: agenti separati

Se vuoi che gli account "personale" e "lavoro" non interagiscano mai, usa agenti isolati (sessioni + credenziali + spazio di lavoro separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Quindi configura l'autenticazione per ogni agente (procedura guidata) e instrada le chat verso l'agente corretto.

### 2) Opzione avanzata: più profili in un singolo agente

L'archivio dei profili di autenticazione supporta più ID di profilo per lo stesso provider.
Scegli quale utilizzare:

- globalmente tramite l'ordinamento della configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (sostituzione per sessione):

- `/model Opus@anthropic:work`

Elenca gli ID di profilo esistenti con:

```bash
openclaw models auth list --provider <id>
```

Documentazione correlata:

- [Failover dei modelli](/it/concepts/model-failover) (regole di rotazione + periodo di attesa)
- [Comandi slash](/it/tools/slash-commands) (superficie dei comandi)

## Contenuti correlati

- [Autenticazione](/it/gateway/authentication) - panoramica dell'autenticazione dei provider di modelli
- [Segreti](/it/gateway/secrets) - archiviazione delle credenziali e SecretRef
- [Riferimento di configurazione](/it/gateway/configuration-reference#auth-storage) - chiavi di configurazione dell'autenticazione
