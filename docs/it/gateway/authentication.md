---
read_when:
    - Debug dell'autenticazione del modello o della scadenza OAuth
    - Documentazione dell'autenticazione o dell'archiviazione delle credenziali
summary: 'Autenticazione del modello: OAuth, chiavi API e riutilizzo di Claude CLI'
title: Autenticazione
x-i18n:
    generated_at: "2026-04-05T13:51:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticazione (provider di modelli)

<Note>
Questa pagina copre l'autenticazione dei **provider di modelli** (chiavi API, OAuth, riutilizzo di Claude CLI). Per l'autenticazione della **connessione gateway** (token, password, trusted-proxy), vedi [Configuration](/gateway/configuration) e [Trusted Proxy Auth](/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e chiavi API per i provider di modelli. Per host gateway
sempre attivi, le chiavi API sono in genere l'opzione più prevedibile. Sono
supportati anche i flussi subscription/OAuth quando corrispondono al modello di account del provider.

Vedi [/concepts/oauth](/concepts/oauth) per il flusso OAuth completo e il layout
di archiviazione.
Per l'autenticazione basata su SecretRef (provider `env`/`file`/`exec`), vedi [Secrets Management](/gateway/secrets).
Per le regole di idoneità/codice motivo delle credenziali usate da `models status --probe`, vedi
[Auth Credential Semantics](/it/auth-credential-semantics).

## Configurazione consigliata (chiave API, qualsiasi provider)

Se stai eseguendo un gateway di lunga durata, inizia con una chiave API per il provider
scelto.
Per Anthropic in particolare, l'autenticazione con chiave API è il percorso sicuro. Il riutilizzo di Claude CLI è
l'altro percorso di configurazione supportato in stile subscription.

1. Crea una chiave API nella console del tuo provider.
2. Inseriscila sull'**host gateway** (la macchina che esegue `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se il Gateway è eseguito sotto systemd/launchd, è preferibile inserire la chiave in
   `~/.openclaw/.env` in modo che il demone possa leggerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Poi riavvia il demone (o riavvia il processo Gateway) e ricontrolla:

```bash
openclaw models status
openclaw doctor
```

Se preferisci non gestire personalmente le variabili env, l'onboarding può archiviare
le chiavi API per l'uso da parte del demone: `openclaw onboard`.

Vedi [Help](/help) per i dettagli sull'ereditarietà env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilità con token legacy

L'autenticazione setup-token di Anthropic è ancora disponibile in OpenClaw come
percorso legacy/manuale. La documentazione pubblica di Claude Code di Anthropic continua a trattare l'uso diretto
del terminale Claude Code sotto i piani Claude, ma Anthropic ha comunicato separatamente agli
utenti di OpenClaw che il percorso di login Claude di **OpenClaw** conta come utilizzo di harness
di terze parti e richiede **Extra Usage** fatturato separatamente rispetto
all'abbonamento.

Per il percorso di configurazione più chiaro, usa una chiave API Anthropic o migra a Claude CLI
sull'host gateway.

Inserimento manuale del token (qualsiasi provider; scrive `auth-profiles.json` + aggiorna la config):

```bash
openclaw models auth paste-token --provider openrouter
```

Sono supportati anche i riferimenti dei profili di autenticazione per credenziali statiche:

- le credenziali `api_key` possono usare `keyRef: { source, provider, id }`
- le credenziali `token` possono usare `tokenRef: { source, provider, id }`
- i profili in modalità OAuth non supportano credenziali SecretRef; se `auth.profiles.<id>.mode` è impostato su `"oauth"`, l'input `keyRef`/`tokenRef` basato su SecretRef per quel profilo viene rifiutato.

Controllo adatto all'automazione (uscita `1` quando scaduto/mancante, `2` quando in scadenza):

```bash
openclaw models status --check
```

Probe di autenticazione live:

```bash
openclaw models status --probe
```

Note:

- Le righe delle probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
- Se `auth.order.<provider>` esplicito omette un profilo memorizzato, la probe segnala
  `excluded_by_auth_order` per quel profilo invece di provarlo.
- Se l'autenticazione esiste ma OpenClaw non riesce a risolvere un candidato modello interrogabile per
  quel provider, la probe segnala `status: no_model`.
- I cooldown dei rate limit possono essere specifici del modello. Un profilo in cooldown per un
  modello può comunque essere utilizzabile per un modello correlato sullo stesso provider.

Gli script operativi facoltativi (systemd/Termux) sono documentati qui:
[Auth monitoring scripts](/help/scripts#auth-monitoring-scripts)

## Anthropic: migrazione a Claude CLI

Se Claude CLI è già installato ed è autenticato sull'host gateway, puoi
passare una configurazione Anthropic esistente al backend CLI. Questo è un
percorso di migrazione OpenClaw supportato per riutilizzare un login Claude CLI locale su quell'host.

Prerequisiti:

- `claude` installato sull'host gateway
- Claude CLI già autenticato lì con `claude auth login`

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Questo conserva i tuoi profili di autenticazione Anthropic esistenti per eventuale rollback, ma cambia la
selezione del modello predefinito in `claude-cli/...` e aggiunge voci allowlist Claude CLI
corrispondenti sotto `agents.defaults.models`.

Verifica:

```bash
openclaw models status
```

Scorciatoia onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

`openclaw onboard` e `openclaw configure` interattivi continuano a preferire Claude CLI
per Anthropic, ma setup-token di Anthropic è di nuovo disponibile come
percorso legacy/manuale e dovrebbe essere usato con l'aspettativa di fatturazione Extra Usage.

## Verifica dello stato di autenticazione del modello

```bash
openclaw models status
openclaw doctor
```

## Comportamento di rotazione delle chiavi API (gateway)

Alcuni provider supportano il ritentativo di una richiesta con chiavi alternative quando una chiamata API
incontra un rate limit del provider.

- Ordine di priorità:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- I provider Google includono anche `GOOGLE_API_KEY` come fallback aggiuntivo.
- Lo stesso elenco di chiavi viene deduplicato prima dell'uso.
- OpenClaw ritenta con la chiave successiva solo per errori di rate limit (ad esempio
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, oppure
  `workers_ai ... quota limit exceeded`).
- Gli errori non dovuti a rate limit non vengono ritentati con chiavi alternative.
- Se tutte le chiavi falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Controllo della credenziale utilizzata

### Per sessione (comando chat)

Usa `/model <alias-or-id>@<profileId>` per fissare una credenziale provider specifica per la sessione corrente (id profilo di esempio: `anthropic:default`, `anthropic:work`).

Usa `/model` (oppure `/model list`) per un selettore compatto; usa `/model status` per la vista completa (candidati + profilo di autenticazione successivo, più i dettagli dell'endpoint provider quando configurati).

### Per agente (override CLI)

Imposta un override esplicito dell'ordine dei profili di autenticazione per un agente (memorizzato in `auth-profiles.json` di quell'agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` per puntare a un agente specifico; omettilo per usare l'agente predefinito configurato.
Quando esegui il debug di problemi di ordine, `openclaw models status --probe` mostra i profili
memorizzati omessi come `excluded_by_auth_order` invece di saltarli silenziosamente.
Quando esegui il debug di problemi di cooldown, ricorda che i cooldown dei rate limit possono essere legati
a un id modello invece che all'intero profilo provider.

## Risoluzione dei problemi

### "No credentials found"

Se il profilo Anthropic manca, migra quella configurazione a Claude CLI o a una chiave API
sull'**host gateway**, poi ricontrolla:

```bash
openclaw models status
```

### Token in scadenza/scaduto

Esegui `openclaw models status` per confermare quale profilo è in scadenza. Se un profilo
token Anthropic legacy manca o è scaduto, migra quella configurazione a Claude CLI
o a una chiave API.

## Requisiti Claude CLI

Necessari solo per il percorso di riutilizzo Anthropic Claude CLI:

- Claude Code CLI installato (comando `claude` disponibile)
