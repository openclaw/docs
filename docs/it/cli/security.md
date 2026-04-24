---
read_when:
    - Vuoi eseguire un controllo di sicurezza rapido su configurazione/stato
    - Vuoi applicare suggerimenti di correzione sicuri (permessi, rendere più restrittivi i valori predefiniti)
summary: Riferimento CLI per `openclaw security` (verificare e correggere errori comuni di sicurezza)
title: Sicurezza
x-i18n:
    generated_at: "2026-04-24T08:35:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Strumenti di sicurezza (audit + correzioni opzionali).

Correlati:

- Guida alla sicurezza: [Security](/it/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

L’audit avvisa quando più mittenti DM condividono la sessione principale e raccomanda la **modalità DM sicura**: `session.dmScope="per-channel-peer"` (oppure `per-account-channel-peer` per canali multi-account) per caselle condivise.
Questo serve a rafforzare le caselle condivise/cooperative. Un singolo Gateway condiviso da operatori reciprocamente non fidati/avversari non è una configurazione consigliata; separa i confini di fiducia con gateway distinti (o utenti OS/host separati).
Emette anche `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un probabile ingresso multiutente condiviso (per esempio policy DM/group aperte, destinazioni di gruppo configurate o regole mittente wildcard) e ricorda che OpenClaw usa per impostazione predefinita un modello di fiducia da assistente personale.
Per configurazioni multiutente intenzionali, le indicazioni dell’audit sono di isolare tutte le sessioni in sandbox, mantenere l’accesso filesystem limitato al workspace e tenere identità o credenziali personali/private fuori da quel runtime.
Avvisa anche quando piccoli modelli (`<=300B`) vengono usati senza sandboxing e con strumenti web/browser abilitati.
Per l’ingresso Webhook, avvisa quando `hooks.token` riusa il token del Gateway, quando `hooks.token` è corto, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` non è impostato, quando `hooks.allowedAgentIds` non è limitato, quando gli override `sessionKey` della richiesta sono abilitati e quando gli override sono abilitati senza `hooks.allowedSessionKeyPrefixes`.
Avvisa anche quando sono configurate impostazioni Docker sandbox mentre la modalità sandbox è disattivata, quando `gateway.nodes.denyCommands` usa voci inefficaci simili a pattern/sconosciute (solo corrispondenza esatta del nome comando Node, non filtraggio del testo shell), quando `gateway.nodes.allowCommands` abilita esplicitamente comandi Node pericolosi, quando il `tools.profile="minimal"` globale viene sostituito dai profili strumenti degli agenti, quando gruppi aperti espongono strumenti runtime/filesystem senza protezioni sandbox/workspace e quando gli strumenti dei Plugin installati possono essere raggiungibili con policy strumenti permissive.
Segnala anche `gateway.allowRealIpFallback=true` (rischio di spoofing delle intestazioni se i proxy sono configurati male) e `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
Avvisa inoltre quando il browser sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
Segnala inoltre modalità di rete Docker sandbox pericolose (inclusi `host` e join di namespace `container:*`).
Avvisa inoltre quando i container Docker browser sandbox esistenti hanno etichette hash mancanti/obsolete (per esempio container pre-migrazione senza `openclaw.browserConfigEpoch`) e raccomanda `openclaw sandbox recreate --browser --all`.
Avvisa inoltre quando i record di installazione Plugin/hook basati su npm non sono bloccati a versione, non hanno metadati di integrità o divergono dalle versioni dei pacchetti attualmente installati.
Avvisa quando le allowlist dei canali si basano su nomi/email/tag modificabili invece che su ID stabili (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ambiti IRC dove applicabile).
Avvisa quando `gateway.auth.mode="none"` lascia le API HTTP del Gateway raggiungibili senza un segreto condiviso (`/tools/invoke` più qualsiasi endpoint `/v1/*` abilitato).
Le impostazioni con prefisso `dangerous`/`dangerously` sono override operatore espliciti di emergenza; abilitarne una non costituisce, di per sé, una segnalazione di vulnerabilità di sicurezza.
Per l’inventario completo dei parametri pericolosi, vedi la sezione "Insecure or dangerous flags summary" in [Security](/it/gateway/security).

Comportamento di SecretRef:

- `security audit` risolve i SecretRef supportati in modalità di sola lettura per i percorsi di destinazione.
- Se un SecretRef non è disponibile nel percorso di comando corrente, l’audit continua e segnala `secretDiagnostics` (invece di arrestarsi in errore).
- `--token` e `--password` sostituiscono solo l’autenticazione del probe profondo per quella invocazione del comando; non riscrivono la configurazione né le mappature SecretRef.

## Output JSON

Usa `--json` per controlli CI/policy:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` sono combinati, l’output include sia le azioni di correzione sia il report finale:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Cosa cambia `--fix`

`--fix` applica correzioni sicure e deterministiche:

- cambia le comuni `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse le varianti account nei canali supportati)
- quando la policy dei gruppi WhatsApp passa a `allowlist`, inizializza `groupAllowFrom` a partire
  dal file `allowFrom` memorizzato quando quell’elenco esiste e la configurazione non definisce già
  `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- rende più restrittivi i permessi per stato/configurazione e per file sensibili comuni
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessione
  `*.jsonl`)
- rende più restrittivi anche i file include di configurazione referenziati da `openclaw.json`
- usa `chmod` su host POSIX e reset `icacls` su Windows

`--fix` **non**:

- ruota token/password/API key
- disabilita strumenti (`gateway`, `cron`, `exec`, ecc.)
- modifica scelte di bind/auth/esposizione di rete del gateway
- rimuove o riscrive Plugin/Skills

## Correlati

- [Riferimento CLI](/it/cli)
- [Audit di sicurezza](/it/gateway/security)
