---
read_when:
    - Vuoi eseguire un rapido audit di sicurezza su configurazione/stato
    - Vuoi applicare suggerimenti di "fix" sicuri (permessi, impostazioni predefinite più restrittive)
summary: Riferimento CLI per `openclaw security` (verifica e correzione delle insidie di sicurezza comuni)
title: Sicurezza
x-i18n:
    generated_at: "2026-06-27T17:21:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Strumenti di sicurezza (verifica + correzioni opzionali).

Correlati:

- Guida alla sicurezza: [Sicurezza](/it/gateway/security)

## Verifica

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Il semplice `security audit` rimane sul percorso di configurazione/file system/a sola lettura a freddo. Per impostazione predefinita non rileva i collector di sicurezza del runtime dei Plugin, quindi le verifiche di routine non caricano ogni runtime dei Plugin installato. Usa `--deep` per includere probe live del Gateway best-effort e collector di verifica della sicurezza di proprietà dei Plugin; anche i chiamanti interni espliciti possono scegliere di usare quei collector di proprietà dei Plugin quando dispongono già di un ambito runtime appropriato.

La verifica avvisa quando più mittenti DM condividono la sessione principale e consiglia la **modalità DM sicura**: `session.dmScope="per-channel-peer"` (o `per-account-channel-peer` per i canali multi-account) per le caselle di posta condivise.
Questo serve per rafforzare caselle di posta cooperative/condivise. Un singolo Gateway condiviso da operatori reciprocamente non fidati/ostili non è una configurazione consigliata; separa i confini di fiducia con gateway separati (o utenti/host OS separati).
Emette anche `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un probabile ingresso con utenti condivisi (per esempio policy DM/gruppo aperte, target di gruppo configurati o regole mittente con wildcard), e ricorda che OpenClaw usa per impostazione predefinita un modello di fiducia da assistente personale.
Per configurazioni intenzionali con utenti condivisi, la guida della verifica è isolare in sandbox tutte le sessioni, mantenere l'accesso al file system limitato al workspace e tenere identità o credenziali personali/private fuori da quel runtime.
Avvisa anche quando modelli piccoli (`<=300B`) vengono usati senza sandboxing e con strumenti web/browser abilitati.
Per l'ingresso Webhook, l'avvio registra un avviso di sicurezza non fatale e la verifica segnala il riuso in `hooks.token` di valori attivi di autenticazione shared-secret del Gateway, inclusi `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` e `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Avvisa anche quando:

- `hooks.token` è corto
- `hooks.path="/"`
- `hooks.defaultSessionKey` non è impostato
- `hooks.allowedAgentIds` non ha restrizioni
- gli override `sessionKey` della richiesta sono abilitati
- gli override sono abilitati senza `hooks.allowedSessionKeyPrefixes`

Se l'autenticazione con password del Gateway viene fornita solo all'avvio, passa lo stesso valore a `openclaw security audit --auth password --password <password>` così la verifica può confrontarlo con `hooks.token`.
Esegui `openclaw doctor --fix` per ruotare un `hooks.token` persistito e riutilizzato, quindi aggiorna i mittenti hook esterni per usare il nuovo token hook.

Avvisa anche quando le impostazioni Docker della sandbox sono configurate mentre la modalità sandbox è disattivata, quando `gateway.nodes.denyCommands` usa voci inefficaci simili a pattern/sconosciute (solo corrispondenza esatta del nome comando del nodo, non filtro del testo shell), quando `gateway.nodes.allowCommands` abilita esplicitamente comandi nodo pericolosi, quando il valore globale `tools.profile="minimal"` viene sovrascritto dai profili strumenti degli agenti, quando gli strumenti di scrittura/modifica sono disabilitati ma `exec` è ancora disponibile senza un confine vincolante del file system sandbox, quando DM o gruppi aperti espongono strumenti runtime/file system senza protezioni sandbox/workspace e quando gli strumenti dei Plugin installati possono essere raggiungibili con una policy strumenti permissiva.
Segnala anche `gateway.allowRealIpFallback=true` (rischio di spoofing degli header se i proxy sono configurati male) e `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
Avvisa anche quando il browser sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
Segnala anche modalità di rete Docker sandbox pericolose (incluse `host` e join di namespace `container:*`).
Avvisa anche quando i container Docker browser sandbox esistenti hanno etichette hash mancanti/obsolete (per esempio container pre-migrazione senza `openclaw.browserConfigEpoch`) e consiglia `openclaw sandbox recreate --browser --all`.
Avvisa anche quando i record di installazione Plugin/hook basati su npm non sono fissati, mancano di metadati di integrità o divergono dalle versioni dei pacchetti attualmente installate.
Avvisa quando le allowlist dei canali si basano su nomi/email/tag mutabili invece che su ID stabili (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ambiti IRC dove applicabile).
Avvisa quando `gateway.auth.mode="none"` lascia le API HTTP del Gateway raggiungibili senza uno shared secret (`/tools/invoke` più qualunque endpoint `/v1/*` abilitato).
Le impostazioni con prefisso `dangerous`/`dangerously` sono override operatore espliciti di emergenza; abilitarne uno non è, di per sé, una segnalazione di vulnerabilità di sicurezza.
Per l'inventario completo dei parametri pericolosi, consulta la sezione "Riepilogo dei flag non sicuri o pericolosi" in [Sicurezza](/it/gateway/security).

I risultati intenzionali permanenti possono essere accettati con `security.audit.suppressions`.
Ogni soppressione corrisponde a un `checkId` esatto e può essere ristretta con
sottostringhe senza distinzione tra maiuscole e minuscole `titleIncludes` e/o `detailIncludes`:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

I risultati soppressi vengono rimossi dal `summary` attivo e dall'elenco `findings`.
L'output JSON li mantiene sotto `suppressedFindings` per verificabilità.
Quando le soppressioni sono configurate, anche l'output attivo mantiene un risultato informativo
`security.audit.suppressions.active` non sopprimibile, così i lettori possono capire che la verifica
è stata filtrata. I flag di configurazione pericolosi vengono emessi uno per risultato, quindi
accettare un flag pericoloso non nasconde altri flag abilitati che condividono lo
stesso `config.insecure_or_dangerous_flags` `checkId`.
Poiché le soppressioni possono nascondere rischi permanenti, aggiungerle o rimuoverle tramite
comandi shell eseguiti dall'agente richiede approvazione exec, a meno che exec non sia già in esecuzione
con `security="full"` e `ask="off"` per automazione locale fidata.

Comportamento SecretRef:

- `security audit` risolve i SecretRef supportati in modalità sola lettura per i suoi percorsi mirati.
- Se un SecretRef non è disponibile nel percorso del comando corrente, la verifica continua e riporta `secretDiagnostics` (invece di andare in crash).
- `--token` e `--password` sovrascrivono solo l'autenticazione del probe profondo per quell'invocazione del comando; non riscrivono la configurazione o le mappature SecretRef.

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

## Cosa cambia `--fix`

`--fix` applica remediation sicure e deterministiche:

- cambia i comuni `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse le varianti account nei canali supportati)
- quando la policy gruppi di WhatsApp passa ad `allowlist`, inizializza `groupAllowFrom` dal
  file `allowFrom` memorizzato quando quell'elenco esiste e la configurazione non definisce già
  `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- restringe i permessi per file di stato/configurazione e file sensibili comuni
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessioni
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
- [Verifica di sicurezza](/it/gateway/security)
