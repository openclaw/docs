---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Perché uno strumento è bloccato: runtime sandbox, policy di allow/deny degli strumenti e gate per exec elevato'
title: Sandbox vs Policy degli strumenti vs Exec elevato
x-i18n:
    generated_at: "2026-04-21T08:23:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs Policy degli strumenti vs Exec elevato

OpenClaw ha tre controlli correlati (ma diversi):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dove vengono eseguiti gli strumenti** (backend sandbox vs host).
2. **Policy degli strumenti** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quali strumenti sono disponibili/consentiti**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) è una **via di fuga solo per exec** per eseguire fuori dalla sandbox quando sei in sandbox (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è configurata su `node`).

## Debug rapido

Usa l'inspector per vedere cosa OpenClaw sta _effettivamente_ facendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Stampa:

- modalità sandbox/scope/accesso workspace effettivi
- se la sessione è attualmente in sandbox (main vs non-main)
- allow/deny effettivi degli strumenti in sandbox (e se provengono da agent/global/default)
- gate elevated e percorsi chiave fix-it

## Sandbox: dove vengono eseguiti gli strumenti

Il sandboxing è controllato da `agents.defaults.sandbox.mode`:

- `"off"`: tutto viene eseguito sull'host.
- `"non-main"`: solo le sessioni non-main sono in sandbox (comune “sorpresa” per gruppi/canali).
- `"all"`: tutto è in sandbox.

Vedi [Sandboxing](/it/gateway/sandboxing) per la matrice completa (scope, mount del workspace, immagini).

### Bind mount (controllo rapido di sicurezza)

- `docker.binds` _buca_ il filesystem della sandbox: tutto ciò che monti è visibile dentro il container con la modalità impostata (`:ro` o `:rw`).
- L'impostazione predefinita è lettura-scrittura se ometti la modalità; preferisci `:ro` per sorgenti/segreti.
- `scope: "shared"` ignora i bind per-agent (si applicano solo i bind globali).
- OpenClaw valida due volte le sorgenti dei bind: prima sul percorso sorgente normalizzato, poi di nuovo dopo la risoluzione tramite l'antenato esistente più profondo. Le fughe tramite parent symlink non aggirano i controlli su percorsi bloccati o root consentite.
- I percorsi leaf inesistenti vengono comunque controllati in sicurezza. Se `/workspace/alias-out/new-file` si risolve tramite un parent con symlink in un percorso bloccato o fuori dalle root consentite configurate, il bind viene rifiutato.
- Fare il bind di `/var/run/docker.sock` di fatto consegna il controllo dell'host alla sandbox; fallo solo intenzionalmente.
- L'accesso al workspace (`workspaceAccess: "ro"`/`"rw"`) è indipendente dalle modalità dei bind.

## Policy degli strumenti: quali strumenti esistono/sono richiamabili

Contano due livelli:

- **Profilo strumenti**: `tools.profile` e `agents.list[].tools.profile` (allowlist di base)
- **Profilo strumenti del provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Policy strumenti globale/per-agent**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Policy strumenti del provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Policy strumenti della sandbox** (si applica solo quando sei in sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regole pratiche:

- `deny` ha sempre la precedenza.
- Se `allow` non è vuoto, tutto il resto viene trattato come bloccato.
- La policy degli strumenti è il blocco rigido: `/exec` non può aggirare uno strumento `exec` negato.
- `/exec` cambia solo i valori predefiniti della sessione per mittenti autorizzati; non concede accesso agli strumenti.
  Le chiavi degli strumenti del provider accettano `provider` (ad es. `google-antigravity`) oppure `provider/model` (ad es. `openai/gpt-5.4`).

### Gruppi di strumenti (scorciatoie)

Le policy degli strumenti (globali, agent, sandbox) supportano voci `group:*` che si espandono in più strumenti:

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
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: tutti gli strumenti OpenClaw integrati (esclude i plugin provider)

## Elevated: "esegui sull'host" solo per exec

Elevated **non** concede strumenti aggiuntivi; influisce solo su `exec`.

- Se sei in sandbox, `/elevated on` (oppure `exec` con `elevated: true`) esegue fuori dalla sandbox (le approvazioni possono comunque applicarsi).
- Usa `/elevated full` per saltare le approvazioni exec per la sessione.
- Se stai già eseguendo direttamente, elevated di fatto non ha effetto (resta comunque soggetto ai gate).
- Elevated **non** è limitato alle skill e **non** aggira allow/deny degli strumenti.
- Elevated non concede override arbitrari cross-host da `host=auto`; segue le normali regole della destinazione exec e preserva `node` solo quando la destinazione configurata/della sessione è già `node`.
- `/exec` è separato da elevated. Regola solo i valori predefiniti exec per sessione per mittenti autorizzati.

Gate:

- Abilitazione: `tools.elevated.enabled` (e facoltativamente `agents.list[].tools.elevated.enabled`)
- Allowlist mittenti: `tools.elevated.allowFrom.<provider>` (e facoltativamente `agents.list[].tools.elevated.allowFrom.<provider>`)

Vedi [Elevated Mode](/it/tools/elevated).

## Correzioni comuni per la "prigione sandbox"

### "Strumento X bloccato dalla policy strumenti della sandbox"

Chiavi fix-it (scegline una):

- Disabilita la sandbox: `agents.defaults.sandbox.mode=off` (oppure per-agent `agents.list[].sandbox.mode=off`)
- Consenti lo strumento nella sandbox:
  - rimuovilo da `tools.sandbox.tools.deny` (oppure per-agent `agents.list[].tools.sandbox.tools.deny`)
  - oppure aggiungilo a `tools.sandbox.tools.allow` (oppure alla allow per-agent)

### "Pensavo che questo fosse main, perché è in sandbox?"

In modalità `"non-main"`, le chiavi gruppo/canale _non_ sono main. Usa la chiave della sessione main (mostrata da `sandbox explain`) oppure cambia modalità in `"off"`.

## Vedi anche

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo sulla sandbox (modalità, scope, backend, immagini)
- [Multi-Agent Sandbox & Tools](/it/tools/multi-agent-sandbox-tools) -- override per-agent e precedenza
- [Elevated Mode](/it/tools/elevated)
