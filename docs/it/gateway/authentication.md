---
read_when:
    - Debug dell'autenticazione del modello o della scadenza di OAuth
    - Documentazione dell'autenticazione o dell'archiviazione delle credenziali
summary: 'Autenticazione dei modelli: OAuth, chiavi API, riutilizzo di Claude CLI e setup-token di Anthropic'
title: Autenticazione
x-i18n:
    generated_at: "2026-04-07T08:12:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db0ad9eccd7e3e3ca328adaad260bc4288a8ccdbe2dc0c24d9fd049b7ab9231
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticazione (provider di modelli)

<Note>
Questa pagina copre l'autenticazione dei **provider di modelli** (chiavi API, OAuth, riutilizzo di Claude CLI e setup-token di Anthropic). Per l'autenticazione della **connessione gateway** (token, password, trusted-proxy), vedi [Configurazione](/it/gateway/configuration) e [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e chiavi API per i provider di modelli. Per host gateway sempre attivi, le chiavi API sono in genere l'opzione più prevedibile. Sono supportati anche i flussi di sottoscrizione/OAuth quando corrispondono al modello di account del provider.

Vedi [/concepts/oauth](/it/concepts/oauth) per il flusso OAuth completo e il layout di archiviazione.
Per l'autenticazione basata su SecretRef (provider `env`/`file`/`exec`), vedi [Gestione dei segreti](/it/gateway/secrets).
Per le regole di idoneità delle credenziali e dei codici motivo usate da `models status --probe`, vedi [Semantica delle credenziali di autenticazione](/it/auth-credential-semantics).

## Configurazione consigliata (chiave API, qualsiasi provider)

Se stai eseguendo un gateway di lunga durata, inizia con una chiave API per il provider scelto.
Per Anthropic in particolare, l'autenticazione con chiave API resta la configurazione server più prevedibile, ma OpenClaw supporta anche il riutilizzo di un accesso locale a Claude CLI.

1. Crea una chiave API nella console del tuo provider.
2. Inseriscila sull'**host gateway** (la macchina che esegue `openclaw gateway`).

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

Poi riavvia il demone (oppure riavvia il tuo processo Gateway) e ricontrolla:

```bash
openclaw models status
openclaw doctor
```

Se preferisci non gestire tu stesso le variabili d'ambiente, l'onboarding può archiviare
le chiavi API per l'uso da parte del demone: `openclaw onboard`.

Vedi [Guida](/it/help) per i dettagli sull'ereditarietà dell'ambiente (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilità tra Claude CLI e token

L'autenticazione Anthropic setup-token è ancora disponibile in OpenClaw come percorso token supportato. Da allora, il personale Anthropic ci ha comunicato che l'uso di Claude CLI in stile OpenClaw è nuovamente consentito, quindi OpenClaw considera il riutilizzo di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Quando il riutilizzo di Claude CLI è disponibile sull'host, questo è ora il percorso preferito.

Per host gateway di lunga durata, una chiave API Anthropic resta comunque la configurazione più prevedibile.
Se vuoi riutilizzare un accesso Claude esistente sullo stesso host, usa il percorso Anthropic Claude CLI in onboarding/configure.

Inserimento manuale del token (qualsiasi provider; scrive `auth-profiles.json` e aggiorna la configurazione):

```bash
openclaw models auth paste-token --provider openrouter
```

Sono supportati anche riferimenti a profili auth per credenziali statiche:

- le credenziali `api_key` possono usare `keyRef: { source, provider, id }`
- le credenziali `token` possono usare `tokenRef: { source, provider, id }`
- i profili in modalità OAuth non supportano credenziali SecretRef; se `auth.profiles.<id>.mode` è impostato su `"oauth"`, l'input `keyRef`/`tokenRef` supportato da SecretRef per quel profilo viene rifiutato.

Controllo adatto all'automazione (uscita `1` se scaduto/mancante, `2` se in scadenza):

```bash
openclaw models status --check
```

Probe di autenticazione live:

```bash
openclaw models status --probe
```

Note:

- Le righe della probe possono provenire da profili auth, credenziali env o `models.json`.
- Se `auth.order.<provider>` esplicito omette un profilo archiviato, la probe riporta
  `excluded_by_auth_order` per quel profilo invece di provarlo.
- Se l'autenticazione esiste ma OpenClaw non riesce a risolvere un candidato di modello sondabile per
  quel provider, la probe riporta `status: no_model`.
- I cooldown del rate limit possono essere limitati al modello. Un profilo in cooldown per un
  modello può comunque essere utilizzabile per un modello correlato dello stesso provider.

Gli script operativi facoltativi (systemd/Termux) sono documentati qui:
[Script di monitoraggio dell'autenticazione](/it/help/scripts#auth-monitoring-scripts)

## Nota su Anthropic

Il backend Anthropic `claude-cli` è di nuovo supportato.

- Il personale Anthropic ci ha comunicato che questo percorso di integrazione OpenClaw è nuovamente consentito.
- OpenClaw quindi considera il riutilizzo di Claude CLI e l'uso di `claude -p` come autorizzati
  per esecuzioni basate su Anthropic, a meno che Anthropic non pubblichi una nuova policy.
- Le chiavi API Anthropic restano la scelta più prevedibile per host gateway
  di lunga durata e per un controllo esplicito della fatturazione lato server.

## Verifica dello stato di autenticazione del modello

```bash
openclaw models status
openclaw doctor
```

## Comportamento di rotazione delle chiavi API (gateway)

Alcuni provider supportano il nuovo tentativo di una richiesta con chiavi alternative quando una chiamata API
incontra un limite di frequenza del provider.

- Ordine di priorità:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- I provider Google includono anche `GOOGLE_API_KEY` come fallback aggiuntivo.
- Lo stesso elenco di chiavi viene deduplicato prima dell'uso.
- OpenClaw riprova con la chiave successiva solo per errori di rate limit (per esempio
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, o
  `workers_ai ... quota limit exceeded`).
- Gli errori non legati al rate limit non vengono ritentati con chiavi alternative.
- Se tutte le chiavi falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Controllare quale credenziale viene usata

### Per sessione (comando chat)

Usa `/model <alias-or-id>@<profileId>` per fissare una credenziale provider specifica per la sessione corrente (esempi di ID profilo: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) per un selettore compatto; usa `/model status` per la vista completa (candidati + profilo auth successivo, più dettagli dell'endpoint provider quando configurati).

### Per agente (override CLI)

Imposta un override esplicito dell'ordine dei profili auth per un agente (archiviato nell'`auth-state.json` di quell'agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` per indirizzare un agente specifico; omettilo per usare l'agente predefinito configurato.
Quando esegui il debug di problemi di ordine, `openclaw models status --probe` mostra i profili
archiviati omessi come `excluded_by_auth_order` invece di saltarli silenziosamente.
Quando esegui il debug di problemi di cooldown, ricorda che i cooldown del rate limit possono essere associati
a un ID modello invece che all'intero profilo provider.

## Risoluzione dei problemi

### "No credentials found"

Se il profilo Anthropic manca, configura una chiave API Anthropic sull'**host gateway** oppure imposta il percorso setup-token di Anthropic, poi ricontrolla:

```bash
openclaw models status
```

### Token in scadenza/scaduto

Esegui `openclaw models status` per confermare quale profilo è in scadenza. Se un
profilo token Anthropic manca o è scaduto, aggiorna tale configurazione tramite
setup-token oppure passa a una chiave API Anthropic.
