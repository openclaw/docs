---
read_when:
    - Vuoi eseguire un rapido audit di sicurezza su configurazione/stato
    - Vuoi applicare suggerimenti di “fix” sicuri (permessi, impostazioni predefinite più restrittive)
summary: Riferimento CLI per `openclaw security` (audit e correzione dei comuni errori di sicurezza)
title: security
x-i18n:
    generated_at: "2026-04-05T13:48:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Strumenti di sicurezza (audit + correzioni facoltative).

Correlati:

- Guida alla sicurezza: [Security](/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

L'audit avvisa quando più mittenti DM condividono la sessione principale e consiglia la **modalità DM sicura**: `session.dmScope="per-channel-peer"` (oppure `per-account-channel-peer` per i canali multi-account) per le inbox condivise.
Questo serve per l'hardening di inbox cooperative/condivise. Un singolo gateway condiviso da operatori reciprocamente non fidati/avversari non è una configurazione consigliata; separa i confini di fiducia con gateway distinti (o utenti/host OS separati).
Emette anche `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un probabile ingresso condiviso da più utenti (ad esempio policy DM/gruppo aperta, target di gruppo configurati o regole mittente wildcard), e ricorda che il modello di fiducia predefinito di OpenClaw è quello di un assistente personale.
Per configurazioni intenzionalmente multiutente, la guida dell'audit consiste nel sandboxare tutte le sessioni, mantenere l'accesso al filesystem limitato al workspace e tenere identità o credenziali personali/private fuori da quel runtime.
Avvisa inoltre quando vengono usati modelli piccoli (`<=300B`) senza sandboxing e con strumenti web/browser abilitati.
Per l'ingresso webhook, avvisa quando `hooks.token` riutilizza il token del gateway, quando `hooks.token` è corto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` non è impostato, quando `hooks.allowedAgentIds` non è limitato, quando sono abilitati gli override della `sessionKey` della richiesta e quando gli override sono abilitati senza `hooks.allowedSessionKeyPrefixes`.
Avvisa inoltre quando sono configurate impostazioni sandbox Docker mentre la modalità sandbox è disattivata, quando `gateway.nodes.denyCommands` usa voci inefficaci simili a pattern/sconosciute (solo corrispondenza esatta sul nome del comando del nodo, non filtraggio del testo shell), quando `gateway.nodes.allowCommands` abilita esplicitamente comandi nodo pericolosi, quando `tools.profile="minimal"` globale viene sovrascritto da profili strumenti a livello agente, quando gruppi aperti espongono strumenti runtime/filesystem senza protezioni sandbox/workspace e quando gli strumenti dei plugin di estensione installati potrebbero essere raggiungibili con una policy strumenti permissiva.
Segnala anche `gateway.allowRealIpFallback=true` (rischio di spoofing degli header se i proxy sono configurati male) e `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
Avvisa inoltre quando il browser sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
Segnala anche modalità di rete sandbox Docker pericolose (incluse unioni di namespace `host` e `container:*`).
Avvisa inoltre quando i container Docker esistenti del browser sandbox hanno etichette hash mancanti/obsolete (ad esempio container precedenti alla migrazione senza `openclaw.browserConfigEpoch`) e consiglia `openclaw sandbox recreate --browser --all`.
Avvisa inoltre quando i record di installazione di plugin/hook basati su npm non sono fissati a una versione, non hanno metadati di integrità o divergono dalle versioni dei pacchetti attualmente installate.
Avvisa quando le allowlist dei canali si basano su nomi/email/tag modificabili invece che su ID stabili (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ambiti IRC ove applicabile).
Avvisa quando `gateway.auth.mode="none"` lascia le API HTTP del gateway raggiungibili senza un segreto condiviso (`/tools/invoke` più qualunque endpoint `/v1/*` abilitato).
Le impostazioni con prefisso `dangerous`/`dangerously` sono override espliciti dell'operatore da usare in casi estremi; abilitarne una non costituisce, di per sé, una segnalazione di vulnerabilità di sicurezza.
Per l'inventario completo dei parametri pericolosi, vedi la sezione "Insecure or dangerous flags summary" in [Security](/gateway/security).

Comportamento di SecretRef:

- `security audit` risolve i SecretRef supportati in modalità sola lettura per i relativi percorsi target.
- Se un SecretRef non è disponibile nel percorso di comando corrente, l'audit continua e riporta `secretDiagnostics` (invece di andare in crash).
- `--token` e `--password` sovrascrivono solo l'autenticazione per la probe approfondita per quell'invocazione del comando; non riscrivono la configurazione né le mappature SecretRef.

## Output JSON

Usa `--json` per controlli CI/policy:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` sono combinati, l'output include sia le azioni di correzione sia il report finale:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Cosa cambia `--fix`

`--fix` applica rimedi sicuri e deterministici:

- cambia i comuni `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse le varianti per account nei canali supportati)
- quando la policy di gruppo di WhatsApp viene cambiata in `allowlist`, inizializza `groupAllowFrom` dal
  file `allowFrom` memorizzato quando tale elenco esiste e la configurazione non
  definisce già `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- rende più restrittivi i permessi per file di stato/configurazione e file sensibili comuni
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessione
  `*.jsonl`)
- rende inoltre più restrittivi i file inclusi nella configurazione referenziati da `openclaw.json`
- usa `chmod` sugli host POSIX e reset `icacls` su Windows

`--fix` **non**:

- ruota token/password/chiavi API
- disabilita strumenti (`gateway`, `cron`, `exec`, ecc.)
- modifica le scelte di bind/auth/esposizione di rete del gateway
- rimuove o riscrive plugin/Skills
