---
read_when:
    - Vuoi eseguire un rapido audit di sicurezza su configurazione/stato
    - Vuoi applicare suggerimenti di “correzione” sicuri (permessi, impostazioni predefinite più restrittive)
summary: Riferimento CLI per `openclaw security` (verifica e correzione delle insidie comuni per la sicurezza)
title: Sicurezza
x-i18n:
    generated_at: "2026-05-02T08:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
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

Il semplice `security audit` rimane sul percorso di configurazione/filesystem/sola lettura a freddo. Per impostazione predefinita non rileva i collector di sicurezza runtime dei Plugin, quindi gli audit ordinari non caricano il runtime di ogni Plugin installato. Usa `--deep` per includere probe live best-effort del Gateway e collector di audit della sicurezza di proprietà dei Plugin; anche i chiamanti interni espliciti possono scegliere di includere quei collector di proprietà dei Plugin quando hanno già un ambito runtime appropriato.

L'audit avvisa quando più mittenti DM condividono la sessione principale e consiglia la **modalità DM sicura**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` per canali multi-account) per caselle di posta condivise.
Questo serve a rafforzare caselle di posta cooperative/condivise. Un singolo Gateway condiviso da operatori reciprocamente non fidati/avversari non è una configurazione consigliata; separa i confini di fiducia con Gateway separati (o utenti/host OS separati).
Emette anche `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un ingresso probabilmente condiviso da più utenti (ad esempio policy DM/gruppo aperta, target di gruppo configurati o regole mittente con wildcard), e ricorda che OpenClaw è un modello di fiducia da assistente personale per impostazione predefinita.
Per configurazioni condivise intenzionali, la guida dell'audit è di eseguire tutte le sessioni in sandbox, mantenere l'accesso al filesystem limitato all'area di lavoro e tenere identità o credenziali personali/private fuori da quel runtime.
Avvisa anche quando modelli piccoli (`<=300B`) vengono usati senza sandboxing e con strumenti web/browser abilitati.
Per l'ingresso Webhook, avvisa quando `hooks.token` riutilizza il token del Gateway, quando `hooks.token` è breve, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` non è impostato, quando `hooks.allowedAgentIds` non ha restrizioni, quando gli override `sessionKey` della richiesta sono abilitati e quando gli override sono abilitati senza `hooks.allowedSessionKeyPrefixes`.
Avvisa anche quando le impostazioni Docker della sandbox sono configurate mentre la modalità sandbox è disattivata, quando `gateway.nodes.denyCommands` usa voci inefficaci simili a pattern/sconosciute (solo corrispondenza esatta del nome-comando del Node, non filtro del testo shell), quando `gateway.nodes.allowCommands` abilita esplicitamente comandi Node pericolosi, quando `tools.profile="minimal"` globale è sovrascritto dai profili degli strumenti dell'agente, quando gruppi aperti espongono strumenti runtime/filesystem senza protezioni sandbox/workspace e quando strumenti Plugin installati potrebbero essere raggiungibili con una policy degli strumenti permissiva.
Segnala anche `gateway.allowRealIpFallback=true` (rischio di spoofing degli header se i proxy sono configurati male) e `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
Avvisa anche quando il browser sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
Segnala anche modalità di rete Docker sandbox pericolose (incluse `host` e join di namespace `container:*`).
Avvisa anche quando container Docker del browser sandbox esistenti hanno etichette hash mancanti/obsolete (ad esempio container pre-migrazione senza `openclaw.browserConfigEpoch`) e consiglia `openclaw sandbox recreate --browser --all`.
Avvisa anche quando i record di installazione di Plugin/hook basati su npm non sono bloccati a una versione, mancano di metadati di integrità o divergono dalle versioni dei pacchetti attualmente installate.
Avvisa quando le allowlist dei canali si basano su nomi/email/tag modificabili invece che su ID stabili (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ambiti IRC dove applicabile).
Avvisa quando `gateway.auth.mode="none"` lascia le API HTTP del Gateway raggiungibili senza un segreto condiviso (`/tools/invoke` più qualsiasi endpoint `/v1/*` abilitato).
Le impostazioni con prefisso `dangerous`/`dangerously` sono override operatore espliciti di emergenza; abilitarne una non è, di per sé, una segnalazione di vulnerabilità di sicurezza.
Per l'inventario completo dei parametri pericolosi, vedi la sezione "Riepilogo dei flag non sicuri o pericolosi" in [Sicurezza](/it/gateway/security).

Comportamento SecretRef:

- `security audit` risolve i SecretRef supportati in modalità sola lettura per i suoi percorsi mirati.
- Se un SecretRef non è disponibile nel percorso del comando corrente, l'audit continua e riporta `secretDiagnostics` (invece di arrestarsi con errore).
- `--token` e `--password` sovrascrivono solo l'autenticazione dei probe profondi per quella invocazione del comando; non riscrivono la configurazione o le mappature SecretRef.

## Output JSON

Usa `--json` per controlli CI/policy:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Se `--fix` e `--json` vengono combinati, l'output include sia le azioni di correzione sia il report finale:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Cosa modifica `--fix`

`--fix` applica rimedi sicuri e deterministici:

- cambia i comuni `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse le varianti account nei canali supportati)
- quando la policy di gruppo WhatsApp passa a `allowlist`, inizializza `groupAllowFrom` dal
  file `allowFrom` archiviato quando quell'elenco esiste e la configurazione non
  definisce già `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- restringe i permessi per stato/configurazione e file sensibili comuni
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessione
  `*.jsonl`)
- restringe anche i file include di configurazione referenziati da `openclaw.json`
- usa `chmod` su host POSIX e reset `icacls` su Windows

`--fix` **non**:

- ruota token/password/chiavi API
- disabilita strumenti (`gateway`, `cron`, `exec`, ecc.)
- modifica le scelte di bind/autenticazione/esposizione di rete del gateway
- rimuove o riscrive Plugin/Skills

## Correlati

- [Riferimento CLI](/it/cli)
- [Audit di sicurezza](/it/gateway/security)
