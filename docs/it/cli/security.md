---
read_when:
    - Si desidera eseguire un rapido audit di sicurezza su configurazione/stato
    - Si desidera applicare suggerimenti di "correzione" sicuri (autorizzazioni, impostazioni predefinite più restrittive)
summary: Riferimento CLI per `openclaw security` (verifica e correzione degli errori comuni di configurazione della sicurezza)
title: Sicurezza
x-i18n:
    generated_at: "2026-07-16T14:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Strumenti di sicurezza: audit e correzioni sicure facoltative. Vedere anche: [Sicurezza](/it/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Modalità di audit

Il semplice `security audit` rimane nel percorso a freddo di configurazione/file system/sola lettura: non individua i raccoglitori di sicurezza del runtime dei Plugin, quindi gli audit di routine non caricano il runtime di ogni Plugin installato. `--deep` aggiunge verifiche live del Gateway con il criterio del massimo impegno e raccoglitori di audit di sicurezza di proprietà dei Plugin (anche i chiamanti interni espliciti possono scegliere di usare tali raccoglitori quando dispongono già di un ambito di runtime appropriato).

Se l'autenticazione tramite password del Gateway viene fornita solo all'avvio, passare lo stesso valore con `--auth password --password <password>` affinché l'audit possa verificarlo rispetto a `hooks.token`.

## Cosa verifica

**Modello di messaggi diretti/attendibilità**

- Avvisa quando più mittenti di messaggi diretti condividono la sessione principale e consiglia la modalità sicura per i messaggi diretti: `session.dmScope="per-channel-peer"` (oppure `per-account-channel-peer` per i canali con più account) per le caselle di posta condivise. Si tratta di un rafforzamento per ambienti cooperativi/con casella condivisa, non di isolamento per operatori reciprocamente non attendibili; in tal caso, separare i confini di attendibilità usando Gateway distinti (oppure utenti o host del sistema operativo distinti).
- Emette `security.trust_model.multi_user_heuristic` quando la configurazione suggerisce un probabile ingresso di più utenti (ad esempio criteri aperti per messaggi diretti/gruppi, destinazioni di gruppo configurate o regole con caratteri jolly per i mittenti): il modello di attendibilità predefinito di OpenClaw è quello di un assistente personale (un solo operatore), non l'isolamento multi-tenant in un ambiente ostile. Per configurazioni intenzionalmente condivise tra più utenti: eseguire tutte le sessioni in sandbox, limitare l'accesso al file system all'area di lavoro ed escludere dal runtime identità o credenziali personali/private.
- Avvisa quando si usano modelli piccoli (`<=300B` parametri) senza sandbox e con gli strumenti web/browser abilitati.

**Webhook/hook**

All'avvio viene registrato un avviso di sicurezza non irreversibile e l'audit segnala il riutilizzo `hooks.token` dei valori attivi di autenticazione tramite segreto condiviso del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Avvisa inoltre quando:

- `hooks.token` è breve
- `hooks.path="/"`
- `hooks.defaultSessionKey` non è impostato
- `hooks.allowedAgentIds` non è soggetto a restrizioni
- sono abilitate le sostituzioni di `sessionKey` della richiesta
- le sostituzioni sono abilitate senza `hooks.allowedSessionKeyPrefixes`

Eseguire `openclaw doctor --fix` per ruotare un `hooks.token` persistente riutilizzato, quindi aggiornare i mittenti esterni degli hook affinché usino il nuovo token.

**Sandbox/strumenti**

- Avvisa quando le impostazioni Docker della sandbox sono configurate mentre la modalità sandbox è disattivata.
- Avvisa quando `gateway.nodes.denyCommands` usa voci sconosciute o simili a pattern che non producono effetti (la corrispondenza avviene solo sul nome esatto del comando Node, non tramite il filtraggio del testo della shell).
- Avvisa quando `gateway.nodes.allowCommands` abilita esplicitamente comandi Node pericolosi.
- Avvisa quando il valore globale `tools.profile="minimal"` viene sostituito dai profili degli strumenti degli agenti.
- Avvisa quando gli strumenti di scrittura/modifica sono disabilitati, ma `exec` rimane disponibile senza un confine restrittivo del file system della sandbox.
- Avvisa quando messaggi diretti o gruppi aperti espongono gli strumenti di runtime/file system senza protezioni della sandbox/area di lavoro.
- Avvisa quando gli strumenti dei Plugin installati potrebbero essere accessibili con criteri permissivi per gli strumenti.

**Browser della sandbox**

- Avvisa quando il browser della sandbox usa la rete Docker `bridge` senza `sandbox.browser.cdpSourceRange`.
- Segnala le modalità di rete Docker pericolose della sandbox, incluse le unioni degli spazi dei nomi `host` e `container:*`.
- Avvisa quando i contenitori Docker esistenti del browser della sandbox presentano etichette hash mancanti/obsolete (ad esempio contenitori precedenti alla migrazione privi di `openclaw.browserConfigEpoch`) e consiglia `openclaw sandbox recreate --browser --all`.

**Rete/individuazione**

- Segnala `gateway.allowRealIpFallback=true` (rischio di spoofing delle intestazioni se i proxy non sono configurati correttamente).
- Segnala `discovery.mdns.mode="full"` (perdita di metadati tramite record TXT mDNS).
- Avvisa quando `gateway.auth.mode="none"` rende accessibili le API HTTP del Gateway senza un segreto condiviso (`/tools/invoke` e qualsiasi endpoint `/v1/*` abilitato).

**Plugin/canali**

- Avvisa quando i record di installazione di Plugin/hook basati su npm non sono bloccati su una versione specifica, non contengono metadati di integrità o differiscono dalle versioni dei pacchetti attualmente installate.
- Avvisa quando gli elenchi consentiti dei canali si basano su nomi/e-mail/tag modificabili anziché su ID stabili (ambiti di Discord, Slack, Google Chat, Microsoft Teams, Mattermost e IRC, ove applicabile).

Le impostazioni con prefisso `dangerous`/`dangerously` sono sostituzioni esplicite di emergenza a disposizione dell'operatore; abilitarne una non costituisce, di per sé, la segnalazione di una vulnerabilità di sicurezza. Per l'inventario completo dei parametri pericolosi, consultare «Riepilogo dei flag non sicuri o pericolosi» in [Sicurezza](/it/gateway/security).

## Comportamento di SecretRef

`security audit` risolve i SecretRef supportati in modalità di sola lettura per i percorsi interessati. Se un SecretRef non è disponibile nel percorso del comando corrente, l'audit prosegue e segnala `secretDiagnostics` invece di interrompersi. `--token` e `--password` sostituiscono esclusivamente l'autenticazione delle verifiche approfondite per quella specifica invocazione del comando; non riscrivono la configurazione né le mappature SecretRef.

## Soppressioni

Accettare i risultati persistenti intenzionali con `security.audit.suppressions`. Ogni soppressione corrisponde a un `checkId` esatto e può essere circoscritta mediante sottostringhe `titleIncludes` e/o `detailIncludes` senza distinzione tra maiuscole e minuscole:

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

I risultati soppressi vengono rimossi dagli elenchi attivi `summary` e `findings`. L'output JSON li conserva in `suppressedFindings` ai fini della verificabilità dell'audit. Quando sono configurate soppressioni, l'output attivo conserva anche un risultato informativo `security.audit.suppressions.active`, non sopprimibile, affinché sia evidente che l'audit è stato filtrato. I flag di configurazione pericolosi vengono emessi come un risultato distinto per ciascun flag; pertanto, accettare un flag pericoloso non nasconde altri flag abilitati che condividono lo stesso checkId `config.insecure_or_dangerous_flags`.

Poiché le soppressioni possono nascondere rischi persistenti, la loro aggiunta o rimozione tramite comandi di shell eseguiti dall'agente richiede l'approvazione dell'esecuzione, a meno che questa non sia già in corso con `security="full"` e `ask="off"` per un'automazione locale attendibile.

## Output JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Con `--fix --json`, l'output include sia le azioni correttive sia il rapporto finale:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Cosa modifica `--fix`

Applica correzioni sicure e deterministiche:

- cambia i valori comuni `groupPolicy="open"` in `groupPolicy="allowlist"` (incluse le varianti per account nei canali supportati)
- quando il criterio dei gruppi WhatsApp passa a `allowlist`, inizializza `groupAllowFrom` dal file `allowFrom` archiviato, se tale elenco esiste e la configurazione non definisce già `allowFrom`
- imposta `logging.redactSensitive` da `"off"` a `"tools"`
- rende più restrittivi i permessi dello stato/della configurazione e dei comuni file sensibili (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` e artefatti delle sessioni legacy)
- rende inoltre più restrittivi i file di inclusione della configurazione a cui fa riferimento `openclaw.json`
- usa `chmod` sugli host POSIX e le reimpostazioni `icacls` su Windows

`--fix` **non**:

- ruota token/password/chiavi API
- disabilita gli strumenti (`gateway`, `cron`, `exec` e così via)
- modifica le scelte relative al binding, all'autenticazione o all'esposizione di rete del Gateway
- rimuove o riscrive Plugin/Skills

## Risorse correlate

- [Riferimento della CLI](/it/cli)
- [Audit di sicurezza](/it/gateway/security)
