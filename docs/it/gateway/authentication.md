---
read_when:
    - Debug dell'autenticazione del modello o della scadenza OAuth
    - Documentare l'autenticazione o l'archiviazione delle credenziali
summary: 'Autenticazione dei modelli: OAuth, chiavi API, riutilizzo della CLI Claude e setup-token di Anthropic'
title: Autenticazione
x-i18n:
    generated_at: "2026-06-27T17:29:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Questa pagina è il riferimento per l'autenticazione dei **provider di modelli** (chiavi API, OAuth, riuso della Claude CLI e setup-token Anthropic). Per l'autenticazione della **connessione Gateway** (token, password, trusted-proxy), consulta [Configurazione](/it/gateway/configuration) e [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e chiavi API per i provider di modelli. Per gli host
Gateway always-on, le chiavi API sono in genere l'opzione più prevedibile. Sono
supportati anche i flussi con abbonamento/OAuth quando corrispondono al modello
di account del tuo provider.

Consulta [/concepts/oauth](/it/concepts/oauth) per il flusso OAuth completo e il
layout di archiviazione.
Per l'autenticazione basata su SecretRef (provider `env`/`file`/`exec`), consulta [Gestione dei segreti](/it/gateway/secrets).
Per le regole di idoneità delle credenziali/codici motivo usate da `models status --probe`, consulta
[Semantica delle credenziali di autenticazione](/it/auth-credential-semantics).

## Configurazione consigliata (chiave API, qualsiasi provider)

Se esegui un Gateway a lunga durata, inizia con una chiave API per il provider
scelto.
Per Anthropic in particolare, l'autenticazione con chiave API resta la
configurazione server più prevedibile, ma OpenClaw supporta anche il riuso di un
login locale della Claude CLI.

1. Crea una chiave API nella console del tuo provider.
2. Inseriscila sull'**host Gateway** (la macchina che esegue `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se il Gateway viene eseguito sotto systemd/launchd, preferisci inserire la chiave in
   `~/.openclaw/.env` così il daemon può leggerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Poi riavvia il daemon (o riavvia il processo Gateway) e ricontrolla:

```bash
openclaw models status
openclaw doctor
```

Se preferisci non gestire personalmente le variabili d'ambiente, l'onboarding può salvare
le chiavi API per l'uso da parte del daemon: `openclaw onboard`.

Consulta [Guida](/it/help) per dettagli sull'ereditarietà dell'ambiente (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI e compatibilità dei token

L'autenticazione setup-token di Anthropic è ancora disponibile in OpenClaw come
percorso token supportato. Da allora lo staff Anthropic ci ha comunicato che
l'uso della Claude CLI in stile OpenClaw è nuovamente consentito, quindi OpenClaw
considera il riuso della Claude CLI e l'uso di `claude -p` approvati per questa
integrazione, salvo pubblicazione di una nuova policy da parte di Anthropic.
Quando il riuso della Claude CLI è disponibile sull'host, ora è il percorso
preferito.

Per host Gateway a lunga durata, una chiave API Anthropic resta comunque la
configurazione più prevedibile. Se vuoi riutilizzare un login Claude esistente
sullo stesso host, usa il percorso Anthropic Claude CLI in onboarding/configure.

Configurazione host consigliata per il riuso della Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Questa è una configurazione in due passaggi:

1. Accedi con Claude Code stesso ad Anthropic sull'host Gateway.
2. Indica a OpenClaw di passare la selezione del modello Anthropic al backend locale `claude-cli`
   e di salvare il profilo di autenticazione OpenClaw corrispondente.

Se `claude` non è in `PATH`, installa prima Claude Code oppure imposta
`agents.defaults.cliBackends.claude-cli.command` sul percorso reale del binario.

Inserimento manuale del token (qualsiasi provider; scrive lo store di autenticazione SQLite per agente + aggiorna la configurazione):

```bash
openclaw models auth paste-token --provider openrouter
```

Lo store dei profili di autenticazione conserva solo le credenziali. I file legacy `auth-profiles.json` usavano questa forma canonica:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw ora legge i profili di autenticazione dal `openclaw-agent.sqlite` di ciascun agente. Se un'installazione più vecchia ha ancora `auth-profiles.json`, `auth-state.json` o un file di profilo di autenticazione piatto come `{ "openrouter": { "apiKey": "..." } }`, esegui `openclaw doctor --fix` per importarlo in SQLite; doctor conserva backup con timestamp accanto ai file JSON originali. I dettagli degli endpoint come `baseUrl`, `api`, ID dei modelli, header e timeout appartengono a `models.providers.<id>` in `openclaw.json` o `models.json`, non nei profili di autenticazione.

Anche le route di autenticazione esterne come Bedrock `auth: "aws-sdk"` non sono credenziali. Se vuoi una route Bedrock con nome, inserisci `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json`; non scrivere `type: "aws-sdk"` nello store dei profili di autenticazione. `openclaw doctor --fix` sposta i marker legacy AWS SDK dallo store delle credenziali ai metadati di configurazione.

I riferimenti ai profili di autenticazione sono supportati anche per credenziali statiche:

- le credenziali `api_key` possono usare `keyRef: { source, provider, id }`
- le credenziali `token` possono usare `tokenRef: { source, provider, id }`
- i profili in modalità OAuth non supportano credenziali SecretRef; se `auth.profiles.<id>.mode` è impostato su `"oauth"`, l'input `keyRef`/`tokenRef` basato su SecretRef per quel profilo viene rifiutato.

Controllo adatto all'automazione (exit `1` quando scaduto/mancante, `2` quando in scadenza):

```bash
openclaw models status --check
```

Probe di autenticazione live:

```bash
openclaw models status --probe
```

Note:

- Le righe dei probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
- Se `auth.order.<provider>` esplicito omette un profilo salvato, il probe segnala
  `excluded_by_auth_order` per quel profilo invece di provarlo.
- Se l'autenticazione esiste ma OpenClaw non riesce a risolvere un candidato modello
  verificabile per quel provider, il probe segnala `status: no_model`.
- I cooldown dei limiti di frequenza possono essere a livello di modello. Un profilo in cooldown per un
  modello può essere ancora utilizzabile per un modello sibling sullo stesso provider.

Gli script operativi opzionali (systemd/Termux) sono documentati qui:
[Script di monitoraggio dell'autenticazione](/it/help/scripts#auth-monitoring-scripts)

## Nota su Anthropic

Il backend Anthropic `claude-cli` è di nuovo supportato.

- Lo staff Anthropic ci ha comunicato che questo percorso di integrazione OpenClaw è nuovamente consentito.
- OpenClaw quindi considera il riuso della Claude CLI e l'uso di `claude -p` approvati
  per le esecuzioni basate su Anthropic, salvo pubblicazione di una nuova policy da parte di Anthropic.
- Le chiavi API Anthropic restano la scelta più prevedibile per host Gateway
  a lunga durata e per il controllo esplicito della fatturazione lato server.

## Controllo dello stato dell'autenticazione dei modelli

```bash
openclaw models status
openclaw doctor
```

## Comportamento di rotazione delle chiavi API (Gateway)

Alcuni provider supportano il nuovo tentativo di una richiesta con chiavi alternative quando una chiamata API
raggiunge un limite di frequenza del provider.

- Ordine di priorità:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override singolo)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- I provider Google includono anche `GOOGLE_API_KEY` come fallback aggiuntivo.
- Lo stesso elenco di chiavi viene deduplicato prima dell'uso.
- OpenClaw riprova con la chiave successiva solo per errori di limite di frequenza (per esempio
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` o
  `workers_ai ... quota limit exceeded`).
- Gli errori non dovuti a limiti di frequenza non vengono riprovati con chiavi alternative.
- Se tutte le chiavi falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Rimozione dell'autenticazione del provider mentre il Gateway è in esecuzione

Quando l'autenticazione del provider viene rimossa tramite il piano di controllo del Gateway, OpenClaw elimina
i profili di autenticazione salvati per quel provider e interrompe le chat o le esecuzioni agente attive
il cui provider del modello selezionato corrisponde al provider rimosso. Le esecuzioni interrotte emettono
i normali eventi di annullamento chat e ciclo di vita con
`stopReason: "auth-revoked"`, così i client connessi possono mostrare che l'esecuzione è stata
arrestata perché le credenziali sono state rimosse.

La rimozione dell'autenticazione salvata non revoca le chiavi presso il provider. Ruota o revoca la
chiave nella dashboard del provider quando hai bisogno di invalidazione lato provider.

## Controllare quale credenziale viene usata

### OpenAI e ID legacy `openai-codex`

I profili con chiave API OpenAI e i profili OAuth ChatGPT/Codex usano entrambi l'ID provider canonico
`openai`. La nuova configurazione dovrebbe usare ID profilo `openai:*` e
`auth.order.openai`.

Se vedi `openai-codex` in una configurazione più vecchia, negli ID dei profili di autenticazione o in
`auth.order.openai-codex`, trattalo come input di migrazione legacy. Non creare nuovi
profili `openai-codex`. Esegui:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor riscrive gli ID profilo legacy `openai-codex:*` e le voci
`auth.order.openai-codex` nella route di autenticazione canonica `openai`. Per
il routing di modelli/runtime specifico di OpenAI, consulta [OpenAI](/it/providers/openai).

### Durante il login (CLI)

Usa `openclaw models auth login --provider <id> --profile-id <profileId>` per
i provider che supportano profili di autenticazione con nome durante il login.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Questo è il modo più semplice per mantenere separati più login OAuth per lo stesso provider
all'interno di un agente.

Usa `--force` quando un profilo provider salvato è bloccato, scaduto o collegato
all'account sbagliato e il normale comando di login continua a riutilizzarlo. `--force` elimina
i profili di autenticazione salvati per quel provider nella directory agente selezionata, poi
esegue di nuovo lo stesso flusso di autenticazione del provider. Non revoca le credenziali presso il
provider; ruotale o revocale nella dashboard del provider quando hai bisogno di
invalidazione lato provider.

```bash
openclaw models auth login --provider anthropic --force
```

### Per sessione (comando chat)

Usa `/model <alias-or-id>@<profileId>` per fissare una credenziale provider specifica per la sessione corrente (ID profilo di esempio: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) per un selettore compatto; usa `/model status` per la vista completa (candidati + prossimo profilo di autenticazione, più dettagli dell'endpoint del provider quando configurati).

### Per agente (override CLI)

Imposta un override esplicito dell'ordine dei profili di autenticazione per un agente (salvato nello stato di autenticazione SQLite di quell'agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` per scegliere un agente specifico; omettilo per usare l'agente predefinito configurato.
Quando esegui il debug di problemi di ordine, `openclaw models status --probe` mostra i profili
salvati omessi come `excluded_by_auth_order` invece di saltarli silenziosamente.
Quando esegui il debug di problemi di cooldown, ricorda che i cooldown dei limiti di frequenza possono essere legati
a un ID modello invece che all'intero profilo provider.

Se cambi l'ordine di autenticazione o il pinning del profilo per una chat già in esecuzione,
invia `/new` o `/reset` in quella chat per avviare una nuova sessione. Le sessioni
esistenti possono mantenere la selezione attuale di modello/profilo fino al reset.

## Risoluzione dei problemi

### "No credentials found"

Se il profilo Anthropic manca, configura una chiave API Anthropic sull'
**host Gateway** oppure configura il percorso setup-token Anthropic, poi ricontrolla:

```bash
openclaw models status
```

### Token in scadenza/scaduto

Esegui `openclaw models status` per confermare quale profilo è in scadenza. Se un
profilo token Anthropic manca o è scaduto, aggiorna quella configurazione tramite
setup-token oppure migra a una chiave API Anthropic.

## Correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Accesso remoto](/it/gateway/remote)
- [Archiviazione dell'autenticazione](/it/concepts/oauth)
