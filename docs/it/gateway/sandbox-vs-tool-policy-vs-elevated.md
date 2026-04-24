---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Perché uno strumento è bloccato: runtime sandbox, policy allow/deny degli strumenti e controlli exec elevated'
title: Sandbox vs policy degli strumenti vs elevated
x-i18n:
    generated_at: "2026-04-24T08:42:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw ha tre controlli correlati (ma diversi):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dove vengono eseguiti gli strumenti** (backend sandbox vs host).
2. **Policy degli strumenti** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quali strumenti sono disponibili/consentiti**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) è una **via di fuga solo per exec** per eseguire fuori dalla sandbox quando sei in sandbox (`gateway` per impostazione predefinita, oppure `node` quando il target exec è configurato su `node`).

## Debug rapido

Usa l'inspector per vedere cosa OpenClaw sta _effettivamente_ facendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Stampa:

- modalità/ambito/accesso al workspace effettivi della sandbox
- se la sessione è attualmente in sandbox (main vs non-main)
- allow/deny effettivi degli strumenti sandbox (e se provengono da agente/globale/predefinito)
- controlli elevated e percorsi chiave per la correzione

## Sandbox: dove vengono eseguiti gli strumenti

Il sandboxing è controllato da `agents.defaults.sandbox.mode`:

- `"off"`: tutto viene eseguito sull'host.
- `"non-main"`: solo le sessioni non-main sono in sandbox (comune “sorpresa” per gruppi/canali).
- `"all"`: tutto è in sandbox.

Vedi [Sandboxing](/it/gateway/sandboxing) per la matrice completa (ambito, mount del workspace, immagini).

### Bind mount (controllo rapido di sicurezza)

- `docker.binds` _buca_ il filesystem della sandbox: qualunque cosa monti è visibile dentro il container con la modalità che imposti (`:ro` o `:rw`).
- Il valore predefinito è lettura-scrittura se ometti la modalità; preferisci `:ro` per sorgenti/segreti.
- `scope: "shared"` ignora i bind per agente (si applicano solo i bind globali).
- OpenClaw convalida due volte le sorgenti dei bind: prima sul percorso sorgente normalizzato, poi di nuovo dopo la risoluzione attraverso l'antenato esistente più profondo. Le fughe tramite parent symlink non aggirano i controlli di percorso bloccato o root consentita.
- I percorsi leaf inesistenti vengono comunque controllati in modo sicuro. Se `/workspace/alias-out/new-file` si risolve tramite un parent symlink a un percorso bloccato o fuori dalle root consentite configurate, il bind viene rifiutato.
- Bindare `/var/run/docker.sock` consegna di fatto il controllo dell'host alla sandbox; fallo solo intenzionalmente.
- L'accesso al workspace (`workspaceAccess: "ro"`/`"rw"`) è indipendente dalle modalità dei bind.

## Policy degli strumenti: quali strumenti esistono/sono invocabili

Contano due livelli:

- **Profilo strumenti**: `tools.profile` e `agents.list[].tools.profile` (allowlist di base)
- **Profilo strumenti del provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Policy strumenti globale/per-agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Policy strumenti del provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Policy strumenti sandbox** (si applica solo quando sei in sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regole pratiche:

- `deny` vince sempre.
- Se `allow` non è vuoto, tutto il resto viene trattato come bloccato.
- La policy degli strumenti è lo stop rigido: `/exec` non può bypassare uno strumento `exec` negato.
- `/exec` cambia solo i valori predefiniti della sessione per mittenti autorizzati; non concede accesso agli strumenti.
  Le chiavi degli strumenti del provider accettano `provider` (ad esempio `google-antigravity`) oppure `provider/model` (ad esempio `openai/gpt-5.4`).

### Gruppi di strumenti (scorciatoie)

Le policy degli strumenti (globali, agente, sandbox) supportano voci `group:*` che si espandono in più strumenti:

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
- `group:openclaw`: tutti gli strumenti OpenClaw integrati (esclude i Plugin provider)

## Elevated: "esegui sull'host" solo per exec

Elevated **non** concede strumenti aggiuntivi; influisce solo su `exec`.

- Se sei in sandbox, `/elevated on` (o `exec` con `elevated: true`) esegue fuori dalla sandbox (potrebbero comunque servire approvazioni).
- Usa `/elevated full` per saltare le approvazioni exec per la sessione.
- Se stai già eseguendo direttamente, elevated è di fatto un no-op (resta comunque soggetto a controlli).
- Elevated **non** è delimitato per skill e **non** sovrascrive allow/deny degli strumenti.
- Elevated non concede override arbitrari cross-host da `host=auto`; segue le normali regole del target exec e preserva `node` solo quando il target configurato/di sessione è già `node`.
- `/exec` è separato da elevated. Regola solo i valori predefiniti exec per sessione per mittenti autorizzati.

Controlli:

- Abilitazione: `tools.elevated.enabled` (e facoltativamente `agents.list[].tools.elevated.enabled`)
- Allowlist mittenti: `tools.elevated.allowFrom.<provider>` (e facoltativamente `agents.list[].tools.elevated.allowFrom.<provider>`)

Vedi [Modalità elevated](/it/tools/elevated).

## Correzioni comuni della "prigione sandbox"

### "Strumento X bloccato dalla policy degli strumenti sandbox"

Chiavi di correzione (scegline una):

- Disabilita la sandbox: `agents.defaults.sandbox.mode=off` (oppure per agente `agents.list[].sandbox.mode=off`)
- Consenti lo strumento nella sandbox:
  - rimuovilo da `tools.sandbox.tools.deny` (oppure da `agents.list[].tools.sandbox.tools.deny` per agente)
  - oppure aggiungilo a `tools.sandbox.tools.allow` (oppure all'allow per agente)

### "Pensavo fosse main, perché è in sandbox?"

In modalità `"non-main"`, le chiavi gruppo/canale _non_ sono main. Usa la chiave della sessione main (mostrata da `sandbox explain`) oppure cambia la modalità in `"off"`.

## Correlati

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo della sandbox (modalità, ambiti, backend, immagini)
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Modalità elevated](/it/tools/elevated)
