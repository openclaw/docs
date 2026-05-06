---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Perché uno strumento è bloccato: ambiente di esecuzione sandbox, criterio di autorizzazione/negazione degli strumenti e controlli per exec con privilegi elevati'
title: Sandbox vs politica degli strumenti vs privilegi elevati
x-i18n:
    generated_at: "2026-05-06T08:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw ha tre controlli correlati (ma diversi):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dove vengono eseguiti gli strumenti** (backend sandbox o host).
2. **Criterio degli strumenti** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quali strumenti sono disponibili/consentiti**.
3. **Modalità elevata** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) è una **via di uscita solo per exec** per eseguire fuori dalla sandbox quando sei in sandbox (`gateway` per impostazione predefinita, oppure `node` quando il target exec è configurato su `node`).

## Debug rapido

Usa l'ispettore per vedere cosa OpenClaw sta _effettivamente_ facendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Stampa:

- modalità/ambito/accesso al workspace della sandbox effettivi
- se la sessione è attualmente in sandbox (main rispetto a non-main)
- allow/deny effettivi degli strumenti sandbox (e se provengono da agente/globale/predefinito)
- gate della modalità elevata e percorsi delle chiavi di correzione

## Sandbox: dove vengono eseguiti gli strumenti

La sandbox è controllata da `agents.defaults.sandbox.mode`:

- `"off"`: tutto viene eseguito sull'host.
- `"non-main"`: solo le sessioni non-main sono in sandbox (una "sorpresa" comune per gruppi/canali).
- `"all"`: tutto è in sandbox.

Vedi [Sandboxing](/it/gateway/sandboxing) per la matrice completa (ambito, mount del workspace, immagini).

### Bind mount (controllo rapido di sicurezza)

- `docker.binds` _attraversa_ il filesystem della sandbox: qualunque cosa monti è visibile dentro il container con la modalità impostata (`:ro` o `:rw`).
- L'impostazione predefinita è lettura-scrittura se ometti la modalità; preferisci `:ro` per sorgenti/segreti.
- `scope: "shared"` ignora i bind per agente (si applicano solo i bind globali).
- OpenClaw convalida due volte le sorgenti dei bind: prima sul percorso sorgente normalizzato, poi di nuovo dopo la risoluzione attraverso l'antenato esistente più profondo. Le fughe tramite genitori symlink non aggirano i controlli su percorsi bloccati o radici consentite.
- I percorsi foglia inesistenti vengono comunque controllati in modo sicuro. Se `/workspace/alias-out/new-file` si risolve attraverso un genitore symlink verso un percorso bloccato o fuori dalle radici consentite configurate, il bind viene rifiutato.
- Montare `/var/run/docker.sock` di fatto consegna il controllo dell'host alla sandbox; fallo solo intenzionalmente.
- L'accesso al workspace (`workspaceAccess: "ro"`/`"rw"`) è indipendente dalle modalità dei bind.

## Criterio degli strumenti: quali strumenti esistono/sono richiamabili

Contano due livelli:

- **Profilo strumenti**: `tools.profile` e `agents.list[].tools.profile` (allowlist di base)
- **Profilo strumenti del provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Criterio strumenti globale/per agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Criterio strumenti del provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Criterio strumenti sandbox** (si applica solo quando si è in sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regole pratiche:

- `deny` vince sempre.
- Se `allow` non è vuoto, tutto il resto viene trattato come bloccato.
- Il criterio degli strumenti è il blocco definitivo: `/exec` non può sovrascrivere uno strumento `exec` negato.
- `/exec` cambia solo le impostazioni predefinite della sessione per mittenti autorizzati; non concede accesso agli strumenti.
  Le chiavi degli strumenti del provider accettano sia `provider` (ad es. `google-antigravity`) sia `provider/model` (ad es. `openai/gpt-5.4`).

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
  alias di `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: tutti gli strumenti OpenClaw integrati (esclude i Plugin provider)

## Modalità elevata: "esegui sull'host" solo per exec

La modalità elevata **non** concede strumenti aggiuntivi; influisce solo su `exec`.

- Se sei in sandbox, `/elevated on` (o `exec` con `elevated: true`) esegue fuori dalla sandbox (le approvazioni possono comunque applicarsi).
- Usa `/elevated full` per saltare le approvazioni exec per la sessione.
- Se stai già eseguendo direttamente, la modalità elevata è di fatto un no-op (rimane soggetta a gate).
- La modalità elevata **non** è circoscritta alle Skills e **non** sovrascrive allow/deny degli strumenti.
- La modalità elevata non concede override arbitrari tra host da `host=auto`; segue le normali regole del target exec e preserva `node` solo quando il target configurato/di sessione è già `node`.
- `/exec` è separato dalla modalità elevata. Regola solo le impostazioni predefinite exec per sessione per mittenti autorizzati.

Gate:

- Abilitazione: `tools.elevated.enabled` (e opzionalmente `agents.list[].tools.elevated.enabled`)
- Allowlist dei mittenti: `tools.elevated.allowFrom.<provider>` (e opzionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Vedi [Modalità elevata](/it/tools/elevated).

## Correzioni comuni per la "prigione sandbox"

### "Strumento X bloccato dal criterio strumenti sandbox"

Chiavi di correzione (scegline una):

- Disabilita la sandbox: `agents.defaults.sandbox.mode=off` (o per agente `agents.list[].sandbox.mode=off`)
- Consenti lo strumento dentro la sandbox:
  - rimuovilo da `tools.sandbox.tools.deny` (o per agente `agents.list[].tools.sandbox.tools.deny`)
  - oppure aggiungilo a `tools.sandbox.tools.allow` (o all'allow per agente)

### "Pensavo fosse main, perché è in sandbox?"

In modalità `"non-main"`, le chiavi di gruppo/canale _non_ sono main. Usa la chiave della sessione main (mostrata da `sandbox explain`) oppure cambia modalità in `"off"`.

## Correlati

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo della sandbox (modalità, ambiti, backend, immagini)
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Modalità elevata](/it/tools/elevated)
