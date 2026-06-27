---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Perché uno strumento è bloccato: runtime sandbox, policy di autorizzazione/negazione degli strumenti e gate di esecuzione con privilegi elevati'
title: Sandbox vs policy degli strumenti vs privilegi elevati
x-i18n:
    generated_at: "2026-06-27T17:34:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw ha tre controlli correlati (ma diversi):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dove vengono eseguiti gli strumenti** (backend sandbox rispetto all'host).
2. **Criterio degli strumenti** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quali strumenti sono disponibili/consentiti**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) è una **via di uscita solo per exec** per eseguire fuori dal sandbox quando sei in sandbox (`gateway` per impostazione predefinita, oppure `node` quando la destinazione di exec è configurata su `node`).

## Debug rapido

Usa l'ispettore per vedere cosa OpenClaw sta _davvero_ facendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Stampa:

- modalità/ambito/accesso al workspace effettivi del sandbox
- se la sessione è attualmente in sandbox (main rispetto a non-main)
- allow/deny effettivi degli strumenti sandbox (e se provengono da agente/globale/predefinito)
- gate Elevated e percorsi delle chiavi per la correzione

## Sandbox: dove vengono eseguiti gli strumenti

Il sandboxing è controllato da `agents.defaults.sandbox.mode`:

- `"off"`: tutto viene eseguito sull'host.
- `"non-main"`: solo le sessioni non-main sono in sandbox (una "sorpresa" comune per gruppi/canali).
- `"all"`: tutto è in sandbox.

Vedi [Sandboxing](/it/gateway/sandboxing) per la matrice completa (ambito, mount del workspace, immagini).

### Bind mount (controllo rapido di sicurezza)

- `docker.binds` _perfora_ il filesystem del sandbox: qualunque cosa monti è visibile dentro il container con la modalità che imposti (`:ro` o `:rw`).
- L'impostazione predefinita è lettura-scrittura se ometti la modalità; preferisci `:ro` per sorgenti/segreti.
- `scope: "shared"` ignora i bind per agente (si applicano solo i bind globali).
- OpenClaw valida due volte le sorgenti dei bind: prima sul percorso sorgente normalizzato, poi di nuovo dopo la risoluzione attraverso l'antenato esistente più profondo. Le uscite tramite genitori symlink non aggirano i controlli sui percorsi bloccati o sulle radici consentite.
- I percorsi foglia non esistenti vengono comunque controllati in modo sicuro. Se `/workspace/alias-out/new-file` si risolve attraverso un genitore symlink verso un percorso bloccato o fuori dalle radici consentite configurate, il bind viene rifiutato.
- Montare `/var/run/docker.sock` di fatto consegna il controllo dell'host al sandbox; fallo solo intenzionalmente.
- L'accesso al workspace (`workspaceAccess: "ro"`/`"rw"`) è indipendente dalle modalità dei bind.

## Criterio degli strumenti: quali strumenti esistono/sono richiamabili

Contano due livelli:

- **Profilo degli strumenti**: `tools.profile` e `agents.list[].tools.profile` (allowlist di base)
- **Profilo degli strumenti del provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Criterio globale/per agente degli strumenti**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Criterio degli strumenti del provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Criterio degli strumenti del sandbox** (si applica solo quando si è in sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regole pratiche:

- `deny` vince sempre.
- Se `allow` non è vuoto, tutto il resto viene considerato bloccato.
- Il criterio degli strumenti è il blocco definitivo: `/exec` non può sovrascrivere uno strumento `exec` negato.
- Il criterio degli strumenti filtra la disponibilità degli strumenti per nome; non ispeziona gli effetti collaterali dentro `exec`. Se `exec` è consentito, negare `write`, `edit` o `apply_patch` non rende i comandi shell di sola lettura.
- `/exec` cambia solo i valori predefiniti della sessione per mittenti autorizzati; non concede accesso agli strumenti.
  Le chiavi degli strumenti del provider accettano sia `provider` (ad es. `google-antigravity`) sia `provider/model` (ad es. `openai/gpt-5.4`).
- I log del Gateway includono voci di audit `agents/tool-policy` quando un passaggio del criterio degli strumenti rimuove strumenti o un criterio degli strumenti del sandbox blocca una chiamata. Usa `openclaw logs` per vedere l'etichetta della regola, la chiave di configurazione e i nomi degli strumenti interessati.

### Gruppi di strumenti (scorciatoie)

I criteri degli strumenti (globali, agente, sandbox) supportano voci `group:*` che si espandono in più strumenti:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Gruppi disponibili:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` è accettato come
  alias per `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  Per agenti di sola lettura, nega `group:runtime` oltre agli strumenti del filesystem che modificano dati, a meno che il criterio del filesystem del sandbox o un confine host separato non imponga il vincolo di sola lettura.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: tutti gli strumenti OpenClaw integrati (esclude i plugin dei provider)
- `group:plugins`: tutti gli strumenti caricati di proprietà dei plugin, inclusi i server MCP configurati esposti tramite `bundle-mcp`

Per i server MCP in sandbox, il criterio degli strumenti del sandbox è un secondo gate di consenso. Se `mcp.servers` è configurato ma i turni in sandbox mostrano solo strumenti integrati, aggiungi `bundle-mcp`, `group:plugins` o un nome/glob di strumento MCP con prefisso del server come `outlook__send_mail` o `outlook__*` a `tools.sandbox.tools.alsoAllow`, poi riavvia/ricarica il gateway e acquisisci di nuovo l'elenco degli strumenti. I glob del server usano il prefisso del server MCP sicuro per il provider: i caratteri non ` [A-Za-z0-9_-]` diventano `-`, i nomi che non iniziano con una lettera ricevono un prefisso `mcp-`, e i prefissi lunghi o duplicati possono essere troncati o avere un suffisso.

`openclaw doctor` attualmente controlla questa forma per i server gestiti da OpenClaw in `mcp.servers`. I server MCP caricati dai manifest dei plugin in bundle o da `.mcp.json` di Claude usano lo stesso gate del sandbox, ma questa diagnostica non enumera ancora quelle sorgenti; usa le stesse voci di allowlist se i loro strumenti scompaiono nei turni in sandbox.

## Elevated: "esegui sull'host" solo per exec

Elevated **non** concede strumenti aggiuntivi; influisce solo su `exec`.

- Se sei in sandbox, `/elevated on` (o `exec` con `elevated: true`) viene eseguito fuori dal sandbox (le approvazioni possono comunque applicarsi).
- Usa `/elevated full` per saltare le approvazioni exec per la sessione.
- Se stai già eseguendo direttamente, Elevated è di fatto un no-op (comunque soggetto a gate).
- Elevated **non** è legato alle Skills e **non** sovrascrive allow/deny degli strumenti.
- Elevated non concede override arbitrari tra host da `host=auto`; segue le normali regole della destinazione exec e preserva `node` solo quando la destinazione configurata/di sessione è già `node`.
- `/exec` è separato da Elevated. Regola solo i valori predefiniti di exec per sessione per mittenti autorizzati.

Gate:

- Abilitazione: `tools.elevated.enabled` (e facoltativamente `agents.list[].tools.elevated.enabled`)
- Allowlist dei mittenti: `tools.elevated.allowFrom.<provider>` (e facoltativamente `agents.list[].tools.elevated.allowFrom.<provider>`)

Vedi [Modalità Elevated](/it/tools/elevated).

## Correzioni comuni della "prigione del sandbox"

### "Strumento X bloccato dal criterio degli strumenti del sandbox"

Chiavi per la correzione (scegline una):

- Disabilita il sandbox: `agents.defaults.sandbox.mode=off` (o per agente `agents.list[].sandbox.mode=off`)
- Consenti lo strumento dentro il sandbox:
  - rimuovilo da `tools.sandbox.tools.deny` (o dal per-agente `agents.list[].tools.sandbox.tools.deny`)
  - oppure aggiungilo a `tools.sandbox.tools.allow` (o all'allow per agente)
- Controlla `openclaw logs` per la voce `agents/tool-policy`. Registra la modalità sandbox e se è stata la regola allow o deny a bloccare lo strumento.

### "Pensavo che fosse main, perché è in sandbox?"

In modalità `"non-main"`, le chiavi di gruppo/canale _non_ sono main. Usa la chiave della sessione main (mostrata da `sandbox explain`) oppure cambia la modalità in `"off"`.

## Correlati

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo del sandbox (modalità, ambiti, backend, immagini)
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Modalità Elevated](/it/tools/elevated)
