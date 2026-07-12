---
read_when:
    - Debug dell'autenticazione del modello o della scadenza OAuth
    - Documentare l'autenticazione o l'archiviazione delle credenziali
summary: 'Autenticazione del modello: OAuth, chiavi API, riutilizzo della CLI di Claude e token di configurazione Anthropic'
title: Autenticazione
x-i18n:
    generated_at: "2026-07-12T07:02:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Questa pagina descrive l'autenticazione dei **provider di modelli** (chiavi API, OAuth, riutilizzo della CLI Claude, token di configurazione Anthropic). Per l'autenticazione della **connessione al Gateway** (token, password, proxy attendibile), consulta [Configurazione](/it/gateway/configuration) e [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e le chiavi API per i provider di modelli. Per un host Gateway sempre attivo, una chiave API è l'opzione più prevedibile; anche i flussi di abbonamento/OAuth funzionano quando sono compatibili con il modello di account del provider.

- Flusso OAuth completo e struttura di archiviazione: [/concepts/oauth](/it/concepts/oauth)
- Autenticazione basata su SecretRef (provider `env`/`file`/`exec`): [Gestione dei segreti](/it/gateway/secrets)
- Codici di idoneità/motivazione delle credenziali utilizzati da `models status --probe`: [Semantica delle credenziali di autenticazione](/it/auth-credential-semantics)

## Configurazione consigliata: chiave API (qualsiasi provider)

1. Crea una chiave API nella console del provider.
2. Inseriscila nell'**host Gateway** (la macchina che esegue `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se il Gateway viene eseguito tramite systemd/launchd, inserisci la chiave in `~/.openclaw/.env` affinché il daemon possa leggerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Riavvia il processo Gateway (o il daemon), quindi verifica nuovamente:

```bash
openclaw models status
openclaw doctor
```

Anche `openclaw onboard` può archiviare le chiavi API per l'uso da parte del daemon, se non vuoi gestire personalmente le variabili di ambiente. Consulta [Variabili di ambiente](/it/help/environment) per la precedenza completa del caricamento dell'ambiente (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: riutilizzo della CLI Claude

L'autenticazione tramite token di configurazione Anthropic rimane un percorso supportato. È consentito anche il riutilizzo della CLI Claude (utilizzo in stile `claude -p`) per questa integrazione; quando sull'host è disponibile un accesso alla CLI Claude, questo è il percorso preferito per l'uso locale/desktop. Per gli host Gateway di lunga durata, una chiave API Anthropic rimane comunque la scelta più prevedibile, con un controllo esplicito della fatturazione lato server.

Configurazione dell'host per il riutilizzo della CLI Claude:

```bash
# Esegui sull'host Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Sono necessari due passaggi: accedere ad Anthropic con Claude Code sull'host, quindi indicare a OpenClaw di instradare la selezione dei modelli Anthropic attraverso il backend locale `claude-cli` e di archiviare il profilo di autenticazione OpenClaw corrispondente.

Se `claude` non è presente in `PATH`, installa Claude Code oppure imposta `agents.defaults.cliBackends.claude-cli.command` sul percorso del file binario.

## Immissione manuale del token

Funziona con qualsiasi provider; scrive nell'archivio di autenticazione SQLite del singolo agente e aggiorna la configurazione:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw legge i profili di autenticazione dal file `openclaw-agent.sqlite` di ciascun agente. I dettagli dell'endpoint (`baseUrl`, `api`, ID dei modelli, intestazioni, timeout) devono essere definiti in `models.providers.<id>` in `openclaw.json` o `models.json`, non nei profili di autenticazione.

Se un'installazione precedente contiene ancora `auth-profiles.json`, `auth-state.json` o una struttura piatta come `{ "openrouter": { "apiKey": "..." } }`, esegui `openclaw doctor --fix` per importarla in SQLite; doctor conserva backup con data e ora accanto ai file JSON originali.

Le modalità di autenticazione esterne, come `auth: "aws-sdk"` di Bedrock, non sono credenziali. Per una modalità Bedrock denominata, imposta `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json`: non scrivere `type: "aws-sdk"` nell'archivio dei profili di autenticazione. `openclaw doctor --fix` migra i marcatori AWS SDK precedenti dall'archivio delle credenziali ai metadati di configurazione.

### Credenziali basate su SecretRef

- Le credenziali `api_key` possono utilizzare `keyRef: { source, provider, id }`
- Le credenziali `token` possono utilizzare `tokenRef: { source, provider, id }`
- I profili in modalità OAuth rifiutano le credenziali SecretRef: se `auth.profiles.<id>.mode` è `"oauth"`, un `keyRef`/`tokenRef` basato su SecretRef per tale profilo viene rifiutato.

## Verifica dello stato di autenticazione dei modelli

```bash
openclaw models status
openclaw doctor
```

Verifica adatta all'automazione, con codice di uscita `1` in caso di credenziali scadute/mancanti e `2` in caso di credenziali prossime alla scadenza:

```bash
openclaw models status --check
```

Verifiche di autenticazione in tempo reale (aggiungi `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` o `--probe-max-tokens` per restringere l'ambito):

```bash
openclaw models status --probe
```

Note:

- Le righe della verifica possono provenire dai profili di autenticazione, dalle credenziali di ambiente o da `models.json`.
- Se `auth.order.<provider>` omette un profilo archiviato, la verifica segnala `excluded_by_auth_order` per tale profilo anziché provarlo.
- Se l'autenticazione esiste ma OpenClaw non riesce a individuare un modello verificabile per quel provider, la verifica segnala `status: no_model`.
- I periodi di attesa dovuti ai limiti di frequenza possono essere specifici per modello: un profilo in attesa per un modello può comunque servire un modello correlato sullo stesso provider.

Script operativi facoltativi (systemd/Termux): [Script di monitoraggio dell'autenticazione](/it/help/scripts#auth-monitoring-scripts).

## Rotazione delle chiavi API (Gateway)

Alcuni provider riprovano una richiesta con una chiave alternativa configurata quando una chiamata raggiunge un limite di frequenza del provider.

Ordine di priorità delle chiavi per provider:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (singola sostituzione, fissa una chiave)
2. `<PROVIDER>_API_KEYS` (elenco separato da virgole/spazi/punti e virgola)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (qualsiasi variabile di ambiente con questo prefisso)

I provider Google (`google`, `google-vertex`) utilizzano inoltre `GOOGLE_API_KEY` come ripiego. L'elenco combinato viene deduplicato prima dell'uso.

OpenClaw passa alla chiave successiva solo quando il messaggio di errore corrisponde a: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` o `too many requests`. Gli altri errori non vengono riprovati con chiavi alternative. Se tutte le chiavi non funzionano, viene restituito l'errore finale dell'ultimo tentativo.

<Note>
Le espressioni specifiche del provider, come `ThrottlingException`, `concurrency limit reached` o `workers_ai ... quota limit exceeded`, determinano la **classificazione del failover/nuovo tentativo** (passaggio ad altri modelli o provider in caso di errori ripetuti), un meccanismo distinto dalla rotazione delle chiavi API descritta sopra.
</Note>

La rimozione dell'autenticazione salvata non revoca la chiave presso il provider: quando è necessaria l'invalidazione lato provider, ruotala o revocala nel pannello di controllo del provider.

## Rimozione dell'autenticazione di un provider mentre il Gateway è in esecuzione

Quando rimuovi l'autenticazione di un provider tramite il piano di controllo del Gateway, OpenClaw elimina i profili di autenticazione salvati per quel provider e interrompe le esecuzioni attive di chat/agenti il cui provider del modello selezionato corrisponde a quello rimosso. Le esecuzioni interrotte emettono i normali eventi di annullamento/ciclo di vita con `stopReason: "auth-revoked"`, consentendo ai client connessi di mostrare che l'esecuzione è stata arrestata perché le credenziali sono state rimosse.

## Controllo della credenziale utilizzata

### OpenAI e ID precedenti `openai-codex`

I profili con chiave API OpenAI e i profili OAuth ChatGPT/Codex utilizzano entrambi l'ID provider canonico `openai`. Per le nuove configurazioni, utilizza ID profilo `openai:*` e `auth.order.openai`.

Se trovi `openai-codex` in configurazioni precedenti, ID dei profili di autenticazione o `auth.order.openai-codex`, consideralo un input di migrazione precedente: non creare nuovi profili `openai-codex`. Esegui:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor riscrive gli ID profilo precedenti `openai-codex:*` e le voci `auth.order.openai-codex` nel percorso canonico `openai`. Per l'instradamento di modelli/runtime specifico di OpenAI, consulta [OpenAI](/it/providers/openai).

### Durante l'accesso (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` mantiene separati più accessi OAuth allo stesso provider all'interno di un singolo agente.

`--force` elimina i profili di autenticazione salvati per quel provider nella directory dell'agente selezionato, quindi riesegue lo stesso flusso di autenticazione. Utilizzalo quando un profilo salvato è bloccato, scaduto o associato all'account errato. Non revoca le credenziali presso il provider.

```bash
openclaw models auth login --provider anthropic --force
```

### Per sessione (comando di chat)

- `/model <alias-or-id>@<profileId>` fissa una credenziale specifica del provider per la sessione corrente (esempi di ID profilo: `anthropic:default`, `anthropic:work`).
- `/model` (o `/model list`) mostra un selettore compatto; `/model status` mostra la visualizzazione completa (candidati + profilo di autenticazione successivo, oltre ai dettagli dell'endpoint del provider, se configurati).

Se modifichi l'ordine di autenticazione o il profilo fissato per una chat già in esecuzione, invia `/new` o `/reset` per avviare una nuova sessione: le sessioni esistenti mantengono la selezione corrente di modello/profilo fino alla reimpostazione.

### Per agente (sostituzione tramite CLI)

Le sostituzioni dell'ordine di autenticazione vengono archiviate nello stato di autenticazione SQLite dell'agente:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilizza `--agent <id>` per specificare un agente; omettelo per utilizzare l'agente predefinito configurato. `openclaw models status --probe` mostra i profili archiviati omessi come `excluded_by_auth_order` anziché ignorarli silenziosamente.

## Risoluzione dei problemi

### "Nessuna credenziale trovata"

Configura una chiave API Anthropic sull'**host Gateway** oppure configura il percorso del token di configurazione Anthropic, quindi verifica nuovamente:

```bash
openclaw models status
```

### Token prossimo alla scadenza/scaduto

Esegui `openclaw models status` per vedere quale profilo è prossimo alla scadenza. Se un profilo token Anthropic è mancante o scaduto, aggiornalo tramite il token di configurazione oppure esegui la migrazione a una chiave API Anthropic.

## Contenuti correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Accesso remoto](/it/gateway/remote)
- [Archiviazione dell'autenticazione](/it/concepts/oauth)
