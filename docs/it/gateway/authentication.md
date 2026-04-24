---
read_when:
    - Debug dell'autenticazione del modello o della scadenza OAuth
    - Documentazione dell'autenticazione o dell'archiviazione delle credenziali
summary: 'Autenticazione del modello: OAuth, chiavi API, riutilizzo di Claude CLI e setup-token Anthropic'
title: Autenticazione
x-i18n:
    generated_at: "2026-04-24T08:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticazione (Provider di modelli)

<Note>
Questa pagina copre l'autenticazione dei **provider di modelli** (chiavi API, OAuth, riutilizzo di Claude CLI e setup-token Anthropic). Per l'autenticazione della **connessione al gateway** (token, password, trusted-proxy), vedi [Configurazione](/it/gateway/configuration) e [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e chiavi API per i provider di modelli. Per host gateway sempre attivi,
le chiavi API sono di solito l'opzione più prevedibile. Sono supportati anche i
flussi subscription/OAuth quando corrispondono al modello di account del provider.

Vedi [/concepts/oauth](/it/concepts/oauth) per il flusso OAuth completo e la struttura
di archiviazione.
Per l'autenticazione basata su SecretRef (provider `env`/`file`/`exec`), vedi [Gestione dei secret](/it/gateway/secrets).
Per le regole di idoneità/codice motivo delle credenziali usate da `models status --probe`, vedi
[Semantica delle credenziali di autenticazione](/it/auth-credential-semantics).

## Configurazione consigliata (chiave API, qualsiasi provider)

Se stai eseguendo un gateway a lunga durata, inizia con una chiave API per il provider
scelto.
Per Anthropic in particolare, l'autenticazione con chiave API resta la configurazione server
più prevedibile, ma OpenClaw supporta anche il riutilizzo di un login Claude CLI locale.

1. Crea una chiave API nella console del tuo provider.
2. Inseriscila sull'**host del gateway** (la macchina che esegue `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se il Gateway viene eseguito sotto systemd/launchd, è preferibile inserire la chiave in
   `~/.openclaw/.env` in modo che il demone possa leggerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Quindi riavvia il demone (oppure riavvia il processo Gateway) e ricontrolla:

```bash
openclaw models status
openclaw doctor
```

Se preferisci non gestire tu stesso le variabili env, l'onboarding può archiviare
chiavi API per l'uso del demone: `openclaw onboard`.

Vedi [Aiuto](/it/help) per i dettagli sull'ereditarietà env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI e compatibilità dei token

L'autenticazione setup-token Anthropic è ancora disponibile in OpenClaw come percorso
token supportato. Da allora, lo staff Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è
di nuovo consentito, quindi OpenClaw tratta il riutilizzo di Claude CLI e l'uso di `claude -p` come
approvati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Quando
il riutilizzo di Claude CLI è disponibile sull'host, questo è ora il percorso preferito.

Per host gateway a lunga durata, una chiave API Anthropic resta la configurazione
più prevedibile. Se vuoi riutilizzare un login Claude esistente sullo stesso host, usa il
percorso Anthropic Claude CLI in onboarding/configure.

Configurazione host consigliata per il riutilizzo di Claude CLI:

```bash
# Esegui sull'host del gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Questa è una configurazione in due passaggi:

1. Esegui il login di Claude Code stesso su Anthropic sull'host del gateway.
2. Dì a OpenClaw di passare la selezione del modello Anthropic al backend locale `claude-cli`
   e archivia il profilo auth OpenClaw corrispondente.

Se `claude` non è su `PATH`, installa prima Claude Code oppure imposta
`agents.defaults.cliBackends.claude-cli.command` sul percorso reale del binario.

Inserimento manuale del token (qualsiasi provider; scrive `auth-profiles.json` + aggiorna la configurazione):

```bash
openclaw models auth paste-token --provider openrouter
```

Sono supportati anche i ref dei profili auth per credenziali statiche:

- le credenziali `api_key` possono usare `keyRef: { source, provider, id }`
- le credenziali `token` possono usare `tokenRef: { source, provider, id }`
- i profili in modalità OAuth non supportano credenziali SecretRef; se `auth.profiles.<id>.mode` è impostato su `"oauth"`, l'input `keyRef`/`tokenRef` supportato da SecretRef per quel profilo viene rifiutato.

Controllo adatto all'automazione (exit `1` quando manca/scaduto, `2` quando in scadenza):

```bash
openclaw models status --check
```

Probe auth live:

```bash
openclaw models status --probe
```

Note:

- Le righe del probe possono provenire da profili auth, credenziali env o `models.json`.
- Se `auth.order.<provider>` esplicito omette un profilo archiviato, il probe segnala
  `excluded_by_auth_order` per quel profilo invece di provarlo.
- Se l'autenticazione esiste ma OpenClaw non riesce a risolvere un candidato di modello sondeggiabile per
  quel provider, il probe segnala `status: no_model`.
- I cooldown dei limiti di frequenza possono essere legati al modello. Un profilo in cooldown per un
  modello può comunque essere utilizzabile per un modello sibling sullo stesso provider.

Gli script operativi facoltativi (systemd/Termux) sono documentati qui:
[Script di monitoraggio dell'autenticazione](/it/help/scripts#auth-monitoring-scripts)

## Nota Anthropic

Il backend Anthropic `claude-cli` è di nuovo supportato.

- Lo staff Anthropic ci ha detto che questo percorso di integrazione OpenClaw è di nuovo consentito.
- OpenClaw quindi tratta il riutilizzo di Claude CLI e l'uso di `claude -p` come approvati
  per le esecuzioni basate su Anthropic, a meno che Anthropic non pubblichi una nuova policy.
- Le chiavi API Anthropic restano la scelta più prevedibile per host gateway a lunga durata
  e per un controllo esplicito della fatturazione lato server.

## Controllare lo stato dell'autenticazione del modello

```bash
openclaw models status
openclaw doctor
```

## Comportamento della rotazione delle chiavi API (gateway)

Alcuni provider supportano il retry di una richiesta con chiavi alternative quando una chiamata API
incontra un limite di frequenza del provider.

- Ordine di priorità:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- I provider Google includono anche `GOOGLE_API_KEY` come fallback aggiuntivo.
- Lo stesso elenco di chiavi viene deduplicato prima dell'uso.
- OpenClaw ritenta con la chiave successiva solo per errori di limite di frequenza (ad esempio
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oppure
  `workers_ai ... quota limit exceeded`).
- Gli errori non legati ai limiti di frequenza non vengono ritentati con chiavi alternative.
- Se tutte le chiavi falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Controllare quale credenziale viene usata

### Per sessione (comando chat)

Usa `/model <alias-or-id>@<profileId>` per fissare una credenziale provider specifica per la sessione corrente (esempi di ID profilo: `anthropic:default`, `anthropic:work`).

Usa `/model` (oppure `/model list`) per un selettore compatto; usa `/model status` per la vista completa (candidati + prossimo profilo auth, più dettagli dell'endpoint del provider quando configurati).

### Per agente (override CLI)

Imposta un override esplicito dell'ordine dei profili auth per un agente (memorizzato in `auth-state.json` di quell'agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` per puntare a un agente specifico; omettilo per usare l'agente predefinito configurato.
Quando esegui il debug dei problemi di ordine, `openclaw models status --probe` mostra i profili archiviati
omessi come `excluded_by_auth_order` invece di saltarli silenziosamente.
Quando esegui il debug dei problemi di cooldown, ricorda che i cooldown dei limiti di frequenza possono essere legati
a un singolo model id invece che all'intero profilo provider.

## Risoluzione dei problemi

### "No credentials found"

Se il profilo Anthropic manca, configura una chiave API Anthropic sull'
**host del gateway** oppure imposta il percorso setup-token Anthropic, quindi ricontrolla:

```bash
openclaw models status
```

### Token in scadenza/scaduto

Esegui `openclaw models status` per confermare quale profilo è in scadenza. Se un
profilo token Anthropic manca o è scaduto, aggiorna quella configurazione tramite
setup-token oppure migra a una chiave API Anthropic.

## Correlati

- [Gestione dei secret](/it/gateway/secrets)
- [Accesso remoto](/it/gateway/remote)
- [Archiviazione auth](/it/concepts/oauth)
