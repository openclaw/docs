---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Perché uno strumento è bloccato: runtime della sandbox, criteri di autorizzazione/divieto degli strumenti e controlli per l''esecuzione con privilegi elevati'
title: Sandbox vs criteri degli strumenti vs privilegi elevati
x-i18n:
    generated_at: "2026-07-12T07:06:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw dispone di tre controlli correlati ma distinti:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) determina **dove vengono eseguiti gli strumenti** (backend della sandbox oppure host).
2. **Criteri degli strumenti** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) determina **quali strumenti sono disponibili/consentiti**.
3. **Modalità con privilegi elevati** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) è una **via di fuga riservata a `exec`** per eseguire operazioni all'esterno della sandbox quando la sessione è isolata (`gateway` per impostazione predefinita oppure `node` quando la destinazione di exec è configurata come `node`).

## Debug rapido

Usa lo strumento di ispezione per vedere cosa sta facendo _effettivamente_ OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Mostra:

- modalità, ambito e accesso all'area di lavoro effettivi della sandbox
- se la sessione è attualmente isolata nella sandbox (principale o non principale)
- regole effettive di autorizzazione/negazione degli strumenti nella sandbox (e se derivano dall'agente, dalla configurazione globale o da quella predefinita)
- vincoli della modalità con privilegi elevati e percorsi delle chiavi da correggere

## Sandbox: dove vengono eseguiti gli strumenti

L'isolamento nella sandbox è controllato da `agents.defaults.sandbox.mode`:

- `"off"`: tutto viene eseguito sull'host.
- `"non-main"`: solo le sessioni non principali sono isolate nella sandbox (una comune "sorpresa" per gruppi/canali).
- `"all"`: tutto viene isolato nella sandbox.

`agents.defaults.sandbox.workspaceAccess` controlla ciò che la sandbox può vedere: `"none"`, `"ro"` o `"rw"`.

Consulta [Isolamento nella sandbox](/it/gateway/sandboxing) per la matrice completa (ambito, montaggi dell'area di lavoro, immagini).

### Montaggi bind (controllo rapido della sicurezza)

- `docker.binds` _perfora_ il file system della sandbox: tutto ciò che monti è visibile all'interno del contenitore con la modalità impostata (`:ro` o `:rw`).
- Se ometti la modalità, l'impostazione predefinita è lettura-scrittura; preferisci `:ro` per codice sorgente/segreti.
- `scope: "shared"` ignora i montaggi specifici per agente (si applicano solo quelli globali).
- OpenClaw convalida due volte le origini dei montaggi bind: prima sul percorso di origine normalizzato, poi nuovamente dopo averlo risolto attraverso l'antenato esistente più profondo. Le vie di fuga tramite directory principali costituite da collegamenti simbolici non eludono i controlli sui percorsi bloccati o sulle radici consentite.
- Anche i percorsi foglia inesistenti vengono controllati in modo sicuro. Se `/workspace/alias-out/new-file` viene risolto attraverso una directory principale simbolica verso un percorso bloccato o esterno alle radici consentite configurate, il montaggio bind viene rifiutato.
- Il montaggio di `/var/run/docker.sock` concede di fatto alla sandbox il controllo dell'host; fallo solo intenzionalmente.
- L'accesso all'area di lavoro (`workspaceAccess`) è indipendente dalle modalità dei montaggi bind.

## Criteri degli strumenti: quali strumenti esistono/possono essere richiamati

Sono rilevanti due livelli:

- **Profilo degli strumenti**: `tools.profile` e `agents.list[].tools.profile` (elenco base dei consentiti)
- **Profilo degli strumenti del provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Criteri globali/per agente degli strumenti**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Criteri degli strumenti del provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Criteri degli strumenti della sandbox** (si applicano solo durante l'isolamento nella sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regole pratiche:

- `deny` prevale sempre.
- Se `allow` non è vuoto, tutto il resto viene considerato bloccato.
- I criteri degli strumenti costituiscono il blocco definitivo: `/exec` non può ignorare il divieto dello strumento `exec`.
- I criteri degli strumenti filtrano la disponibilità degli strumenti in base al nome; non esaminano gli effetti collaterali all'interno di `exec`. Se `exec` è consentito, negare `write`, `edit` o `apply_patch` non rende i comandi della shell di sola lettura.
- `/exec` modifica solo le impostazioni predefinite della sessione per i mittenti autorizzati; non concede l'accesso agli strumenti.
- Le chiavi degli strumenti del provider accettano `provider` (ad esempio `google-antigravity`) oppure `provider/model` (ad esempio `openai/gpt-5.4`).
- I log del Gateway includono voci di controllo `agents/tool-policy` quando un passaggio dei criteri degli strumenti rimuove degli strumenti o quando i criteri degli strumenti della sandbox bloccano una chiamata. Usa `openclaw logs` per visualizzare l'etichetta della regola, la chiave di configurazione e i nomi degli strumenti interessati.

### Gruppi di strumenti (abbreviazioni)

I criteri degli strumenti (globali, dell'agente e della sandbox) supportano voci `group:*` che si espandono in più strumenti:

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

| Gruppo             | Strumenti                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                                                                                                                                  |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                         |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                                                                                        |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                  |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                          |
| `group:ui`         | `browser`, `canvas`                                                                                                                                                                                                            |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                         |
| `group:messaging`  | `message`                                                                                                                                                                                                                      |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                            |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                                                                                       |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                           |
| `group:openclaw`   | la maggior parte degli strumenti integrati di OpenClaw (esclude le primitive di file system e runtime `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` e i plugin dei provider)                                   |
| `group:plugins`    | tutti gli strumenti caricati di proprietà dei plugin, inclusi i server MCP configurati esposti tramite `bundle-mcp`                                                                                                            |

Per gli agenti di sola lettura, nega `group:runtime` oltre agli strumenti che modificano il file system, a meno che i criteri del file system della sandbox o un confine host separato non impongano il vincolo di sola lettura.

Per i server MCP isolati nella sandbox, i criteri degli strumenti della sandbox costituiscono un secondo controllo di autorizzazione. Se `mcp.servers` è configurato ma le interazioni isolate nella sandbox mostrano solo gli strumenti integrati, aggiungi `bundle-mcp`, `group:plugins` oppure un nome/glob di strumento MCP con prefisso del server, come `outlook__send_mail` o `outlook__*`, a `tools.sandbox.tools.alsoAllow`, quindi riavvia/ricarica il Gateway e acquisisci nuovamente l'elenco degli strumenti. I glob dei server utilizzano il prefisso del server MCP sicuro per il provider: i caratteri diversi da `[A-Za-z0-9_-]` diventano `-`, i nomi che non iniziano con una lettera ricevono il prefisso `mcp-` e i prefissi lunghi o duplicati possono essere troncati o ricevere un suffisso.

Attualmente `openclaw doctor` controlla questa struttura per i server gestiti da OpenClaw in `mcp.servers`. I server MCP caricati dai manifest dei plugin inclusi o da `.mcp.json` di Claude utilizzano lo stesso controllo della sandbox, ma questa diagnostica non elenca ancora tali origini; usa le stesse voci dell'elenco dei consentiti se i relativi strumenti scompaiono nelle interazioni isolate nella sandbox.

## Modalità con privilegi elevati: "esecuzione sull'host" riservata a exec

La modalità con privilegi elevati **non** concede strumenti aggiuntivi; influisce solo su `exec`.

- Se la sessione è isolata nella sandbox, `/elevated on` (oppure `exec` con `elevated: true`) esegue le operazioni all'esterno della sandbox (potrebbero comunque essere necessarie approvazioni).
- Usa `/elevated full` per ignorare le approvazioni di exec per la sessione.
- Se l'esecuzione è già diretta, la modalità con privilegi elevati di fatto non produce alcun effetto (rimane comunque soggetta ai controlli).
- La modalità con privilegi elevati **non** è limitata alle Skills e **non** ignora le regole di autorizzazione/negazione degli strumenti.
- La modalità con privilegi elevati non concede sostituzioni arbitrarie tra host diversi da `host=auto`; segue le normali regole della destinazione di exec e mantiene `node` solo quando la destinazione configurata/della sessione è già `node`.
- `/exec` è separato dalla modalità con privilegi elevati. Regola solo le impostazioni predefinite di exec per sessione per i mittenti autorizzati.

Controlli:

- Attivazione: `tools.elevated.enabled` (e facoltativamente `agents.list[].tools.elevated.enabled`)
- Elenchi dei mittenti consentiti: `tools.elevated.allowFrom.<provider>` (e facoltativamente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulta [Modalità con privilegi elevati](/it/tools/elevated).

## Correzioni comuni per la "prigione della sandbox"

### "Strumento X bloccato dai criteri degli strumenti della sandbox"

Chiavi da correggere (scegline una):

- Disabilita la sandbox: `agents.defaults.sandbox.mode=off` (oppure, per agente, `agents.list[].sandbox.mode=off`)
- Consenti lo strumento all'interno della sandbox:
  - rimuovilo da `tools.sandbox.tools.deny` (oppure, per agente, `agents.list[].tools.sandbox.tools.deny`)
  - oppure aggiungilo a `tools.sandbox.tools.allow` (o all'elenco dei consentiti per agente)
- Controlla `openclaw logs` per la voce `agents/tool-policy`. Registra la modalità della sandbox e indica se lo strumento è stato bloccato dalla regola di autorizzazione o di negazione.

### "Pensavo che questa fosse la sessione principale: perché è isolata nella sandbox?"

In modalità `"non-main"`, le chiavi di gruppo/canale _non_ sono principali. Usa la chiave della sessione principale (mostrata da `sandbox explain`) oppure imposta la modalità su `"off"`.

## Contenuti correlati

- [Isolamento nella sandbox](/it/gateway/sandboxing) -- riferimento completo sulla sandbox (modalità, ambiti, backend, immagini)
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- sostituzioni per agente e precedenza
- [Modalità con privilegi elevati](/it/tools/elevated)
