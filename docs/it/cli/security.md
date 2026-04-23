---
read_when:
    - Vuoi eseguire un rapido audit di sicurezza su configurazione/stato
    - Vuoi applicare suggerimenti di “fix” sicuri (permessi, rafforzare i valori predefiniti)
summary: Riferimento CLI per `openclaw security` (controlla e correggi i comuni errori di sicurezza)
title: security
x-i18n:
    generated_at: "2026-04-23T08:27:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Strumenti di sicurezza (audit + fix facoltativi).

Correlati:

- Guida alla sicurezza: [Sicurezza](/it/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

L'audit avvisa quando più mittenti DM condividono la sessione principale e consiglia la **modalità DM sicura**: `session.dmScope="per-channel-peer"` (oppure `per-account-channel-peer` per canali multi-account) per inbox condivise.
Questo serve per l'hardening di inbox cooperative/condivise. Un singolo Gateway condiviso da operatori reciprocamente non fidati/avversari non è una configurazione consigliata; separa i confini di fiducia con Gateway distinti (oppure utenti OS/host separati).
Emette inoltre `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un probabile ingresso da utenti condivisi (ad esempio policy DM/gruppi aperta, destinazioni di gruppo configurate o regole mittente wildcard) e ricorda che OpenClaw adotta per impostazione predefinita un modello di fiducia da assistente personale.
Per configurazioni intenzionalmente condivise tra più utenti, la guida dell'audit consiglia di isolare tutte le sessioni in sandbox, mantenere l'accesso al filesystem limitato al workspace e tenere identità o credenziali personali/private fuori da quel runtime.
Avvisa inoltre quando modelli piccoli (`<=300B`) vengono usati senza sandboxing e con strumenti web/browser abilitati.
Per l'ingresso Webhook, avvisa quando `hooks.token` riutilizza il token del Gateway, quando `hooks.token` è corto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` non è impostato, quando `hooks.allowedAgentIds` non è limitato, quando sono abilitati override della richiesta `sessionKey` e quando gli override sono abilitati senza `hooks.allowedSessionKeyPrefixes`.
Avvisa inoltre quando le impostazioni Docker della sandbox sono configurate mentre la modalità sandbox è disattivata, quando `gateway.nodes.denyCommands` usa voci inefficaci in stile pattern/sconosciute (solo corrispondenza esatta del nome comando del Node, non filtraggio del testo shell), quando `gateway.nodes.allowCommands` abilita esplicitamente comandi Node pericolosi, quando il globale `tools.profile="minimal"` viene sovrascritto dai profili tool degli agenti, quando gruppi aperti espongono strumenti runtime/filesystem senza protezioni sandbox/workspace e quando i tool dei Plugin installati possono essere raggiungibili con una policy tool permissiva.
Segnala inoltre `gateway.allowRealIpFallback=true` (rischio di spoofing header se i proxy sono configurati male) e `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
Avvisa inoltre quando il browser sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
Segnala inoltre modalità di rete Docker sandbox pericolose (incluse `host` e unioni di namespace `container:*`).
Avvisa inoltre quando i container Docker esistenti del browser sandbox hanno etichette hash mancanti/obsolete (ad esempio container pre-migrazione senza `openclaw.browserConfigEpoch`) e consiglia `openclaw sandbox recreate --browser --all`.
Avvisa quando i record di installazione Plugin/hook basati su npm non sono fissati, non hanno metadati di integrità o divergono dalle versioni dei pacchetti attualmente installate.
Avvisa quando le allowlist dei canali si basano su nomi/email/tag mutabili invece che su ID stabili (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ambiti IRC dove applicabile).
Avvisa quando `gateway.auth.mode="none"` lascia le API HTTP del Gateway raggiungibili senza un segreto condiviso (`/tools/invoke` più qualsiasi endpoint `/v1/*` abilitato).
Le impostazioni con prefisso `dangerous`/`dangerously` sono override espliciti di emergenza per l'operatore; abilitarne uno non costituisce, di per sé, una segnalazione di vulnerabilità di sicurezza.
Per l'inventario completo dei parametri pericolosi, vedi la sezione "Insecure or dangerous flags summary" in [Sicurezza](/it/gateway/security).

Comportamento SecretRef:

- `security audit` risolve i SecretRef supportati in modalità sola lettura per i relativi percorsi mirati.
- Se un SecretRef non è disponibile nel percorso di comando corrente, l'audit continua e segnala `secretDiagnostics` (invece di interrompersi).
- `--token` e `--password` sovrascrivono solo l'autenticazione del deep probe per quella invocazione del comando; non riscrivono la configurazione né le mappature SecretRef.

## Output JSON

Usa `--json` per controlli CI/policy:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` sono combinati, l'output include sia le azioni di fix sia il report finale:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Cosa modifica `--fix`

`--fix` applica remediation sicure e deterministiche:

- cambia il comune `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse le varianti per account nei canali supportati)
- quando la policy di gruppo WhatsApp passa a `allowlist`, inizializza `groupAllowFrom` dal
  file `allowFrom` memorizzato quando quella lista esiste e la configurazione non
  definisce già `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- restringe i permessi per stato/configurazione e file sensibili comuni
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessione
  `*.jsonl`)
- restringe inoltre i file include di configurazione referenziati da `openclaw.json`
- usa `chmod` su host POSIX e reset `icacls` su Windows

`--fix` **non**:

- ruota token/password/API key
- disabilita tool (`gateway`, `cron`, `exec`, ecc.)
- modifica le scelte di bind/auth/esposizione di rete del Gateway
- rimuove o riscrive Plugin/Skills
