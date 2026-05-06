---
read_when:
    - Vuoi eseguire un rapido audit di sicurezza su configurazione/stato
    - Vuoi applicare suggerimenti di "correzione" sicuri (autorizzazioni, impostazioni predefinite più restrittive)
summary: Riferimento CLI per `openclaw security` (verifica e corregge le insidie comuni di sicurezza)
title: Sicurezza
x-i18n:
    generated_at: "2026-05-06T17:54:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Strumenti di sicurezza (audit + correzioni opzionali).

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

Il semplice `security audit` resta sul percorso freddo di configurazione/filesystem/sola lettura. Per impostazione predefinita non rileva i raccoglitori di sicurezza del runtime dei plugin, quindi gli audit di routine non caricano ogni runtime dei plugin installati. Usa `--deep` per includere sonde live del Gateway best-effort e raccoglitori di audit di sicurezza di proprietà dei plugin; anche chiamanti interni espliciti possono scegliere quei raccoglitori di proprietà dei plugin quando hanno già un ambito runtime appropriato.

L’audit avvisa quando più mittenti DM condividono la sessione principale e raccomanda la **modalità DM sicura**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` per canali multi-account) per caselle di posta condivise.
Questo serve a rafforzare caselle di posta cooperative/condivise. Un singolo Gateway condiviso da operatori reciprocamente non fidati/ostili non è una configurazione consigliata; separa i confini di fiducia con gateway separati (o utenti/host del sistema operativo separati).
Emette anche `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un ingresso probabilmente condiviso tra utenti (per esempio policy DM/gruppo aperte, target di gruppo configurati o regole mittente con wildcard) e ricorda che OpenClaw usa per impostazione predefinita un modello di fiducia da assistente personale.
Per configurazioni intenzionalmente condivise tra utenti, la guida dell’audit è eseguire tutte le sessioni in sandbox, mantenere l’accesso al filesystem limitato al workspace e tenere identità o credenziali personali/private fuori da quel runtime.
Avvisa anche quando modelli piccoli (`<=300B`) vengono usati senza sandboxing e con strumenti web/browser abilitati.
Per l’ingresso tramite webhook, avvisa quando `hooks.token` riusa il token del Gateway, quando `hooks.token` è breve, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` non è impostato, quando `hooks.allowedAgentIds` non ha restrizioni, quando gli override `sessionKey` della richiesta sono abilitati e quando gli override sono abilitati senza `hooks.allowedSessionKeyPrefixes`.
Avvisa anche quando le impostazioni Docker della sandbox sono configurate mentre la modalità sandbox è disattivata, quando `gateway.nodes.denyCommands` usa voci inefficaci simili a pattern/sconosciute (solo corrispondenza esatta del nome comando del nodo, non filtro del testo shell), quando `gateway.nodes.allowCommands` abilita esplicitamente comandi nodo pericolosi, quando `tools.profile="minimal"` globale viene sovrascritto dai profili strumenti dell’agente, quando gruppi aperti espongono strumenti runtime/filesystem senza protezioni sandbox/workspace e quando gli strumenti dei plugin installati possono essere raggiungibili con policy strumenti permissive.
Segnala anche `gateway.allowRealIpFallback=true` (rischio di spoofing degli header se i proxy sono configurati male) e `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
Avvisa anche quando il browser sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
Segnala anche modalità di rete Docker della sandbox pericolose (incluse `host` e join di namespace `container:*`).
Avvisa anche quando i container Docker esistenti del browser sandbox hanno etichette hash mancanti/obsolete (per esempio container pre-migrazione senza `openclaw.browserConfigEpoch`) e raccomanda `openclaw sandbox recreate --browser --all`.
Avvisa anche quando i record di installazione di plugin/hook basati su npm non sono bloccati a una versione, mancano di metadati di integrità o divergono dalle versioni dei pacchetti attualmente installate.
Avvisa quando gli allowlist dei canali si basano su nomi/email/tag mutabili invece che su ID stabili (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ambiti IRC dove applicabile).
Avvisa quando `gateway.auth.mode="none"` lascia le API HTTP del Gateway raggiungibili senza un segreto condiviso (`/tools/invoke` più qualsiasi endpoint `/v1/*` abilitato).
Le impostazioni con prefisso `dangerous`/`dangerously` sono override operatore espliciti di tipo break-glass; abilitarne una non è, di per sé, una segnalazione di vulnerabilità di sicurezza.
Per l’inventario completo dei parametri pericolosi, consulta la sezione "Riepilogo dei flag non sicuri o pericolosi" in [Sicurezza](/it/gateway/security).

Comportamento di SecretRef:

- `security audit` risolve i SecretRef supportati in modalità sola lettura per i suoi percorsi mirati.
- Se un SecretRef non è disponibile nel percorso del comando corrente, l’audit continua e riporta `secretDiagnostics` (invece di arrestarsi in modo anomalo).
- `--token` e `--password` sovrascrivono solo l’autenticazione della sonda profonda per quella invocazione del comando; non riscrivono la configurazione né le mappature SecretRef.

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

`--fix` applica rimedi sicuri e deterministici:

- cambia i comuni `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse varianti account nei canali supportati)
- quando la policy di gruppo di WhatsApp cambia in `allowlist`, inizializza `groupAllowFrom` dal
  file `allowFrom` archiviato quando quell’elenco esiste e la configurazione non
  definisce già `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- restringe i permessi per stato/configurazione e file sensibili comuni
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessione
  `*.jsonl`)
- restringe anche i file di inclusione della configurazione referenziati da `openclaw.json`
- usa `chmod` sugli host POSIX e reset `icacls` su Windows

`--fix` **non**:

- ruota token/password/chiavi API
- disabilita strumenti (`gateway`, `cron`, `exec`, ecc.)
- modifica le scelte di bind/auth/esposizione di rete del gateway
- rimuove o riscrive plugin/skills

## Correlati

- [Riferimento CLI](/it/cli)
- [Audit di sicurezza](/it/gateway/security)
