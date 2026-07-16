---
read_when:
    - Si desidera comprendere il flusso OAuth di OpenClaw end-to-end
    - Si verificano problemi di invalidazione del token / disconnessione
    - Si desiderano flussi di autenticazione tramite Claude CLI o OAuth
    - Si desiderano più account o l'instradamento dei profili
summary: 'OAuth in OpenClaw: scambio di token, archiviazione e modelli multi-account'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T14:19:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw supporta OAuth ("autenticazione tramite abbonamento") per i provider che lo offrono,
in particolare **OpenAI Codex (OAuth di ChatGPT)** e **riutilizzo della CLI di Anthropic Claude**.
Per Anthropic, la distinzione pratica è:

- **Chiave API Anthropic**: normale fatturazione dell'API Anthropic.
- **CLI di Anthropic Claude / autenticazione tramite abbonamento in OpenClaw**: il personale di Anthropic
  ha comunicato che questo utilizzo è nuovamente consentito, quindi OpenClaw considera il riutilizzo della CLI di Claude e
  l'utilizzo di `claude -p` autorizzati per questa integrazione, a meno che Anthropic
  non pubblichi una nuova politica. Per Anthropic in produzione, l'autenticazione tramite chiave API resta
  il percorso consigliato più sicuro.

OpenClaw archivia sia l'autenticazione con chiave API OpenAI sia OAuth di ChatGPT/Codex con
l'ID provider canonico `openai`. Gli ID profilo `openai-codex:*` e le
voci `auth.order.openai-codex` meno recenti sono uno stato legacy corretto da
`openclaw doctor --fix`; utilizzare ID profilo `openai:*` e `auth.order.openai` per
le nuove configurazioni.

Questa pagina descrive:

- come funziona lo **scambio dei token** OAuth (PKCE)
- dove vengono **archiviati** i token (e perché)
- come gestire **più account** (profili + sostituzioni per sessione)

I Plugin dei provider che includono un proprio flusso OAuth o con chiave API utilizzano lo
stesso punto di ingresso:

```bash
openclaw models auth login --provider <id>
```

## Il collettore di token (perché esiste)

I provider OAuth generano comunemente un nuovo token di aggiornamento a ogni accesso/aggiornamento.
Alcuni provider invalidano il token di aggiornamento precedente quando ne viene
emesso uno nuovo per lo stesso utente/app. Sintomo pratico: si accede tramite OpenClaw _e_
tramite Claude Code / Codex CLI e, in seguito, una delle due sessioni viene disconnessa casualmente.

Per ridurre questo problema, OpenClaw considera l'archivio dei profili di autenticazione un **collettore di token**:

- il runtime legge le credenziali da un'unica posizione per agente
- più profili possono coesistere ed essere instradati in modo deterministico
- il riutilizzo di CLI esterne è specifico del provider: quando OpenClaw possiede un profilo OAuth
  locale per un provider, il token di aggiornamento locale è quello canonico. Se tale
  token di aggiornamento locale viene rifiutato, OpenClaw segnala che il profilo richiede
  una nuova autenticazione anziché ripiegare sul materiale dei token della CLI esterna.
  Il bootstrap della Codex CLI è ancora più limitato: può solo inizializzare un profilo vuoto
  in stile `openai:default` prima che OpenClaw assuma il controllo di OAuth per quel
  provider; successivamente, gli aggiornamenti gestiti da OpenClaw restano canonici
- i percorsi di stato/avvio limitano il rilevamento delle CLI esterne all'insieme di provider
  già configurato, evitando di esaminare l'archivio degli accessi di una CLI non correlata in una
  configurazione con un solo provider

## Archiviazione (dove risiedono i token)

I segreti risiedono a livello di agente, identificati dal nome logico `auth-profiles.json` (l'
archivio sottostante è il database SQLite dell'agente; il nome JSON viene mantenuto per
compatibilità e visualizzazione negli strumenti):

- Profili di autenticazione (OAuth + chiavi API + riferimenti facoltativi a livello di valore):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File di compatibilità legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (le voci statiche `api_key` vengono eliminate quando rilevate)

File legacy di sola importazione (ancora supportato, ma non è l'archivio principale):

- `~/.openclaw/credentials/oauth.json` (importato nell'archivio dei profili di autenticazione al primo utilizzo)

Tutti gli elementi precedenti rispettano anche `$OPENCLAW_STATE_DIR` (sostituzione della directory di stato). Riferimento completo: [/gateway/configuration-reference#auth-storage](/it/gateway/configuration-reference#auth-storage)

Per i riferimenti statici ai segreti e il comportamento di attivazione delle istantanee in fase di runtime, consultare [Gestione dei segreti](/it/gateway/secrets).

Quando un agente secondario non dispone di un profilo di autenticazione locale, OpenClaw utilizza l'
ereditarietà con lettura diretta dall'archivio dell'agente predefinito/principale; durante la lettura non clona l'
archivio dell'agente principale. I token di aggiornamento OAuth sono particolarmente sensibili: i normali
flussi di copia li ignorano per impostazione predefinita, perché alcuni provider ruotano o invalidano i
token di aggiornamento dopo l'utilizzo. Configurare un accesso OAuth separato per un agente quando
necessita di un account indipendente.

## Riutilizzo della CLI di Anthropic Claude

OpenClaw supporta il riutilizzo della CLI di Anthropic Claude e `claude -p` come percorso di
autenticazione autorizzato. Se sull'host è già presente un accesso locale a Claude,
la procedura iniziale/configurazione può riutilizzarlo direttamente. Il token di configurazione Anthropic resta
disponibile come percorso supportato di autenticazione tramite token, ma OpenClaw preferisce il riutilizzo della CLI di Claude
quando disponibile.

<Warning>
La documentazione pubblica di Anthropic relativa a Claude Code indica che l'utilizzo diretto di Claude Code resta entro
i limiti dell'abbonamento Claude, e il personale di Anthropic ha comunicato che l'utilizzo della CLI di Claude nello stile di OpenClaw
è nuovamente consentito. OpenClaw considera quindi il riutilizzo della CLI di Claude e
l'utilizzo di `claude -p` autorizzati per questa integrazione, a meno che Anthropic
non pubblichi una nuova politica.

Per la documentazione corrente di Anthropic sui piani per l'utilizzo diretto di Claude Code, consultare [Utilizzo di Claude Code
con il piano Pro o Max
](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Utilizzo di Claude Code con il piano Team o Enterprise
](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Per altre opzioni basate su abbonamento in OpenClaw, consultare [OpenAI
Codex](/it/providers/openai), [Piano di programmazione Qwen Cloud
](/it/providers/qwen), [Piano di programmazione MiniMax](/it/providers/minimax),
e [Piano di programmazione Z.AI / GLM](/it/providers/zai).
</Warning>

## Scambio OAuth (come funziona l'accesso)

I flussi di accesso interattivi di OpenClaw sono implementati in `openclaw/plugin-sdk/llm.ts` e collegati alle procedure guidate/ai comandi.

### Token di configurazione Anthropic

Struttura del flusso:

1. creare il token eseguendo `claude setup-token` su qualsiasi macchina con Claude Code, quindi avviare il token di configurazione Anthropic o l'inserimento del token da OpenClaw
2. OpenClaw archivia la credenziale Anthropic risultante in un profilo di autenticazione
3. la selezione del modello resta su `anthropic/...`
4. i profili di autenticazione Anthropic esistenti restano disponibili per il ripristino/controllo dell'ordine

### OpenAI Codex (OAuth di ChatGPT)

OAuth di OpenAI Codex è esplicitamente supportato per l'utilizzo al di fuori della Codex CLI, inclusi i flussi di lavoro OpenClaw.

Il comando di accesso utilizza l'ID provider OpenAI canonico:

```bash
openclaw models auth login --provider openai
```

Utilizzare `--profile-id openai:<name>` per più account OAuth di ChatGPT/Codex in
un singolo agente. Non utilizzare `openai-codex:<name>` per i nuovi profili. Doctor migra
quel prefisso meno recente a un ID profilo `openai:*` privo di collisioni; eseguire
`openclaw models auth list --provider openai` dopo la correzione, prima di copiare
gli ID profilo in `auth.order` o `/model ...@<profileId>`.

Struttura del flusso (PKCE):

1. generare un verificatore/una richiesta PKCE e un `state` casuale
2. aprire `https://auth.openai.com/oauth/authorize?...` (ambito
   `openid profile email offline_access`)
3. tentare di acquisire il callback su `http://localhost:1455/auth/callback` (l'
   host del callback utilizza per impostazione predefinita `localhost` e accetta solo host di loopback;
   sostituirlo con `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. se è possibile incollare un codice prima dell'arrivo del callback (oppure si opera
   da remoto/senza interfaccia e non è possibile associare il callback), incollare invece l'URL/il codice di reindirizzamento
   — l'inserimento manuale compete con il callback del browser e prevale quello
   che viene completato per primo
5. scambiare il codice presso `https://auth.openai.com/oauth/token`
6. estrarre `accountId` dal token di accesso e archiviare `{ access, refresh, expires, accountId }`

Il percorso della procedura guidata è `openclaw onboard` → scelta dell'autenticazione `openai`.

## Aggiornamento + scadenza

I profili archiviano una marca temporale `expires`. In fase di runtime:

- se `expires` è nel futuro, utilizzare il token di accesso archiviato
- se è scaduto, aggiornarlo (con un blocco del file) e sovrascrivere le credenziali archiviate
- se un agente secondario legge un profilo OAuth ereditato dall'agente principale, l'
  aggiornamento viene scritto nell'archivio dell'agente principale anziché copiare il token di aggiornamento
  nell'archivio dell'agente secondario
- le credenziali della CLI gestite esternamente (CLI di Claude, bootstrap limitato della Codex CLI;
  consultare [Il collettore di token](#the-token-sink-why-it-exists)) vengono rilette anziché
  consumare un token di aggiornamento copiato. Se un aggiornamento gestito non riesce, OpenClaw
  segnala che il profilo interessato richiede una nuova autenticazione anziché restituire
  il materiale dei token della CLI esterna.

Il flusso di aggiornamento è automatico; in genere non è necessario gestire manualmente i token.

## Più account (profili) + instradamento

Due modelli:

### 1) Preferibile: agenti separati

Se si desidera che gli account "personale" e "lavoro" non interagiscano mai, utilizzare agenti isolati (sessioni + credenziali + spazio di lavoro separati):

```bash
openclaw agents add work
openclaw agents add personal
```

Configurare quindi l'autenticazione per ciascun agente (procedura guidata) e instradare le chat all'agente corretto.

### 2) Avanzato: più profili in un singolo agente

L'archivio dei profili di autenticazione supporta più ID profilo per lo stesso provider.
Scegliere quale utilizzare:

- globalmente tramite l'ordinamento della configurazione (`auth.order`)
- per sessione tramite `/model ...@<profileId>`

Esempio (sostituzione per sessione):

- `/model Opus@anthropic:work`

Elencare gli ID profilo esistenti con:

```bash
openclaw models auth list --provider <id>
```

Documentazione correlata:

- [Failover del modello](/it/concepts/model-failover) (regole di rotazione + attesa)
- [Comandi slash](/it/tools/slash-commands) (superficie dei comandi)

## Argomenti correlati

- [Autenticazione](/it/gateway/authentication) - panoramica dell'autenticazione dei provider di modelli
- [Segreti](/it/gateway/secrets) - archiviazione delle credenziali e SecretRef
- [Riferimento della configurazione](/it/gateway/configuration-reference#auth-storage) - chiavi di configurazione dell'autenticazione
