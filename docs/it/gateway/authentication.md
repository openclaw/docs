---
read_when:
    - Risoluzione dei problemi relativi all'autenticazione del modello o alla scadenza OAuth
    - Documentazione dell'autenticazione o dell'archiviazione delle credenziali
summary: 'Autenticazione dei modelli: OAuth, chiavi API, riutilizzo della CLI Claude e setup-token di Anthropic'
title: Autenticazione
x-i18n:
    generated_at: "2026-04-30T08:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Questa pagina è il riferimento per l’autenticazione dei **provider di modelli** (chiavi API, OAuth, riuso di Claude CLI e setup-token Anthropic). Per l’autenticazione della **connessione al Gateway** (token, password, trusted-proxy), consulta [Configurazione](/it/gateway/configuration) e [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).
</Note>

OpenClaw supporta OAuth e le chiavi API per i provider di modelli. Per gli host Gateway
sempre attivi, le chiavi API sono di solito l’opzione più prevedibile. Sono supportati
anche i flussi con sottoscrizione/OAuth quando corrispondono al modello di account del tuo provider.

Consulta [/concepts/oauth](/it/concepts/oauth) per il flusso OAuth completo e il layout
di archiviazione.
Per l’autenticazione basata su SecretRef (provider `env`/`file`/`exec`), consulta [Gestione dei segreti](/it/gateway/secrets).
Per le regole di idoneità delle credenziali e dei codici motivo usate da `models status --probe`, consulta
[Semantica delle credenziali di autenticazione](/it/auth-credential-semantics).

## Configurazione consigliata (chiave API, qualsiasi provider)

Se esegui un Gateway di lunga durata, inizia con una chiave API per il provider
scelto.
Per Anthropic in particolare, l’autenticazione con chiave API resta comunque la configurazione server
più prevedibile, ma OpenClaw supporta anche il riuso di un accesso locale a Claude CLI.

1. Crea una chiave API nella console del tuo provider.
2. Inseriscila nell’**host Gateway** (la macchina che esegue `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Se il Gateway viene eseguito con systemd/launchd, preferisci inserire la chiave in
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

Se preferisci non gestire autonomamente le variabili d’ambiente, l’onboarding può archiviare
le chiavi API per l’uso da parte del daemon: `openclaw onboard`.

Consulta [Aiuto](/it/help) per i dettagli sull’ereditarietà dell’ambiente (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilità con Claude CLI e token

L’autenticazione setup-token di Anthropic è ancora disponibile in OpenClaw come percorso token
supportato. Lo staff di Anthropic ci ha poi comunicato che l’uso di Claude CLI in stile OpenClaw è
di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l’uso di `claude -p`
come approvati per questa integrazione, salvo pubblicazione di una nuova policy da parte di Anthropic. Quando
il riuso di Claude CLI è disponibile sull’host, questo è ora il percorso preferito.

Per gli host Gateway di lunga durata, una chiave API Anthropic resta comunque la configurazione
più prevedibile. Se vuoi riutilizzare un accesso Claude esistente sullo stesso host, usa il
percorso Anthropic Claude CLI nell’onboarding/configurazione.

Configurazione host consigliata per il riuso di Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Questa è una configurazione in due passaggi:

1. Accedi ad Anthropic con Claude Code stesso sull’host Gateway.
2. Indica a OpenClaw di passare la selezione dei modelli Anthropic al backend locale `claude-cli`
   e archivia il profilo di autenticazione OpenClaw corrispondente.

Se `claude` non è in `PATH`, installa prima Claude Code oppure imposta
`agents.defaults.cliBackends.claude-cli.command` sul percorso reale del binario.

Inserimento manuale del token (qualsiasi provider; scrive `auth-profiles.json` + aggiorna la configurazione):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` archivia solo credenziali. La forma canonica è:

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

OpenClaw si aspetta la forma canonica `version` + `profiles` a runtime. Se un’installazione precedente ha ancora un file piatto come `{ "openrouter": { "apiKey": "..." } }`, esegui `openclaw doctor --fix` per riscriverlo come profilo chiave API `openrouter:default`; doctor conserva una copia `.legacy-flat.*.bak` accanto all’originale. Dettagli dell’endpoint come `baseUrl`, `api`, ID modello, header e timeout vanno inseriti sotto `models.providers.<id>` in `openclaw.json` o `models.json`, non in `auth-profiles.json`.

I riferimenti ai profili di autenticazione sono supportati anche per credenziali statiche:

- Le credenziali `api_key` possono usare `keyRef: { source, provider, id }`
- Le credenziali `token` possono usare `tokenRef: { source, provider, id }`
- I profili in modalità OAuth non supportano credenziali SecretRef; se `auth.profiles.<id>.mode` è impostato su `"oauth"`, l’input `keyRef`/`tokenRef` basato su SecretRef per quel profilo viene rifiutato.

Controllo adatto all’automazione (uscita `1` quando scaduto/mancante, `2` quando in scadenza):

```bash
openclaw models status --check
```

Probe di autenticazione live:

```bash
openclaw models status --probe
```

Note:

- Le righe dei probe possono provenire da profili di autenticazione, credenziali d’ambiente o `models.json`.
- Se `auth.order.<provider>` esplicito omette un profilo archiviato, il probe segnala
  `excluded_by_auth_order` per quel profilo invece di provarlo.
- Se l’autenticazione esiste ma OpenClaw non riesce a risolvere un candidato modello interrogabile per
  quel provider, il probe segnala `status: no_model`.
- I cooldown dei limiti di frequenza possono essere specifici del modello. Un profilo in cooldown per un
  modello può comunque essere utilizzabile per un modello affine sullo stesso provider.

Gli script operativi opzionali (systemd/Termux) sono documentati qui:
[Script di monitoraggio autenticazione](/it/help/scripts#auth-monitoring-scripts)

## Nota su Anthropic

Il backend Anthropic `claude-cli` è di nuovo supportato.

- Lo staff di Anthropic ci ha comunicato che questo percorso di integrazione OpenClaw è di nuovo consentito.
- OpenClaw quindi considera il riuso di Claude CLI e l’uso di `claude -p` come approvati
  per le esecuzioni basate su Anthropic, salvo pubblicazione di una nuova policy da parte di Anthropic.
- Le chiavi API Anthropic restano la scelta più prevedibile per gli host Gateway
  di lunga durata e per un controllo esplicito della fatturazione lato server.

## Controllare lo stato dell’autenticazione dei modelli

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
- Lo stesso elenco di chiavi viene deduplicato prima dell’uso.
- OpenClaw riprova con la chiave successiva solo per errori di limite di frequenza (per esempio
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` o
  `workers_ai ... quota limit exceeded`).
- Gli errori non legati ai limiti di frequenza non vengono ritentati con chiavi alternative.
- Se tutte le chiavi falliscono, viene restituito l’errore finale dell’ultimo tentativo.

## Controllare quale credenziale viene usata

### Per sessione (comando chat)

Usa `/model <alias-or-id>@<profileId>` per fissare una credenziale provider specifica per la sessione corrente (ID profilo di esempio: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) per un selettore compatto; usa `/model status` per la vista completa (candidati + prossimo profilo di autenticazione, più dettagli endpoint del provider quando configurati).

### Per agente (override CLI)

Imposta un override esplicito dell’ordine dei profili di autenticazione per un agente (archiviato in `auth-state.json` di quell’agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` per indirizzare un agente specifico; omettilo per usare l’agente predefinito configurato.
Quando esegui il debug di problemi di ordine, `openclaw models status --probe` mostra i profili
archiviati omessi come `excluded_by_auth_order` invece di saltarli silenziosamente.
Quando esegui il debug di problemi di cooldown, ricorda che i cooldown dei limiti di frequenza possono essere legati
a un singolo ID modello invece che all’intero profilo provider.

## Risoluzione dei problemi

### "Nessuna credenziale trovata"

Se il profilo Anthropic manca, configura una chiave API Anthropic sull’
**host Gateway** oppure configura il percorso setup-token Anthropic, quindi ricontrolla:

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
- [Archiviazione autenticazione](/it/concepts/oauth)
