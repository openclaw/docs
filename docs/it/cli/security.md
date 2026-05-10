---
read_when:
    - Vuoi eseguire un rapido audit di sicurezza su configurazione/stato
    - Vuoi applicare suggerimenti sicuri di "correzione" (autorizzazioni, impostazioni predefinite più restrittive)
summary: Riferimento CLI per `openclaw security` (verifica e correggi le comuni insidie di sicurezza)
title: Sicurezza
x-i18n:
    generated_at: "2026-05-10T19:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Strumenti di sicurezza (audit + correzioni facoltative).

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

Il semplice `security audit` resta sul percorso a freddo di configurazione/filesystem/sola lettura. Per impostazione predefinita non rileva i collector di sicurezza del runtime dei Plugin, quindi gli audit di routine non caricano ogni runtime dei Plugin installati. Usa `--deep` per includere probe live Gateway best-effort e collector di audit di sicurezza di proprietà dei Plugin; i chiamanti interni espliciti possono anche scegliere di includere quei collector di proprietà dei Plugin quando hanno già un ambito di runtime appropriato.

L'audit avvisa quando più mittenti DM condividono la sessione principale e consiglia la **modalità DM sicura**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` per canali multi-account) per caselle di posta condivise.
Questo serve a rafforzare caselle di posta cooperative/condivise. Un singolo Gateway condiviso da operatori reciprocamente non fidati/avversariali non è una configurazione consigliata; separa i confini di fiducia con gateway separati (o utenti/host OS separati).
Emette anche `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un probabile ingresso multi-utente condiviso (per esempio policy DM/gruppo aperta, destinazioni di gruppo configurate o regole mittente con carattere jolly), e ricorda che OpenClaw è per impostazione predefinita un modello di fiducia da assistente personale.
Per configurazioni multi-utente condivise intenzionali, la guida dell'audit consiste nel sandboxare tutte le sessioni, mantenere l'accesso al filesystem limitato allo spazio di lavoro e tenere identità o credenziali personali/private fuori da quel runtime.
Avvisa anche quando vengono usati modelli piccoli (`<=300B`) senza sandboxing e con strumenti web/browser abilitati.
Per l'ingresso webhook, avvisa quando `hooks.token` riutilizza il token Gateway, quando `hooks.token` è breve, quando `hooks.path="/"`, quando `hooks.defaultSessionKey` non è impostato, quando `hooks.allowedAgentIds` non ha restrizioni, quando gli override `sessionKey` della richiesta sono abilitati e quando gli override sono abilitati senza `hooks.allowedSessionKeyPrefixes`.
Avvisa anche quando le impostazioni Docker della sandbox sono configurate mentre la modalità sandbox è disattivata, quando `gateway.nodes.denyCommands` usa voci inefficaci simili a pattern/sconosciute (solo corrispondenza esatta del nome comando Node, non filtraggio del testo shell), quando `gateway.nodes.allowCommands` abilita esplicitamente comandi Node pericolosi, quando `tools.profile="minimal"` globale è sovrascritto dai profili strumenti degli agenti, quando gli strumenti di scrittura/modifica sono disabilitati ma `exec` è ancora disponibile senza un confine di filesystem sandbox vincolante, quando gruppi aperti espongono strumenti di runtime/filesystem senza guardrail sandbox/spazio di lavoro e quando gli strumenti dei Plugin installati possono essere raggiungibili con una policy strumenti permissiva.
Segnala anche `gateway.allowRealIpFallback=true` (rischio di spoofing degli header se i proxy sono configurati in modo errato) e `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
Avvisa anche quando il browser sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
Segnala anche modalità di rete Docker sandbox pericolose (incluse `host` e join di namespace `container:*`).
Avvisa anche quando container Docker browser sandbox esistenti hanno etichette hash mancanti/obsolete (per esempio container pre-migrazione senza `openclaw.browserConfigEpoch`) e consiglia `openclaw sandbox recreate --browser --all`.
Avvisa anche quando i record di installazione di Plugin/hook basati su npm non sono bloccati, mancano di metadati di integrità o divergono dalle versioni dei pacchetti attualmente installate.
Avvisa quando gli allowlist dei canali si basano su nomi/email/tag mutabili invece che su ID stabili (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ambiti IRC dove applicabile).
Avvisa quando `gateway.auth.mode="none"` lascia le API HTTP Gateway raggiungibili senza un segreto condiviso (`/tools/invoke` più qualsiasi endpoint `/v1/*` abilitato).
Le impostazioni con prefisso `dangerous`/`dangerously` sono override espliciti di emergenza dell'operatore; abilitarne una non è, di per sé, una segnalazione di vulnerabilità di sicurezza.
Per l'inventario completo dei parametri pericolosi, consulta la sezione "Riepilogo dei flag non sicuri o pericolosi" in [Sicurezza](/it/gateway/security).

Comportamento SecretRef:

- `security audit` risolve le SecretRef supportate in modalità sola lettura per i suoi percorsi mirati.
- Se una SecretRef non è disponibile nel percorso del comando corrente, l'audit continua e segnala `secretDiagnostics` (invece di arrestarsi in modo anomalo).
- `--token` e `--password` sovrascrivono solo l'autenticazione del probe profondo per quella invocazione del comando; non riscrivono la configurazione o le mappature SecretRef.

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

## Cosa modifica `--fix`

`--fix` applica rimedi sicuri e deterministici:

- cambia il comune `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse le varianti account nei canali supportati)
- quando la policy di gruppo WhatsApp passa a `allowlist`, inizializza `groupAllowFrom` dal
  file `allowFrom` salvato quando quell'elenco esiste e la configurazione non definisce già
  `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- restringe i permessi per stato/configurazione e file sensibili comuni
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessione
  `*.jsonl`)
- restringe anche i file di include della configurazione referenziati da `openclaw.json`
- usa `chmod` sugli host POSIX e reset `icacls` su Windows

`--fix` **non**:

- ruota token/password/chiavi API
- disabilita strumenti (`gateway`, `cron`, `exec`, ecc.)
- modifica le scelte di bind/auth/esposizione di rete del gateway
- rimuove o riscrive Plugin/Skills

## Correlati

- [Riferimento CLI](/it/cli)
- [Audit di sicurezza](/it/gateway/security)
