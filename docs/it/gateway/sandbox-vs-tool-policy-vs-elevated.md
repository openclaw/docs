---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Perché uno strumento è bloccato: runtime sandbox, criterio di autorizzazione/negazione degli strumenti e controlli di esecuzione con privilegi elevati'
title: Sandbox vs policy degli strumenti vs privilegi elevati
x-i18n:
    generated_at: "2026-05-10T19:36:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw ha tre controlli correlati (ma diversi):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dove vengono eseguiti gli strumenti** (backend sandbox o host).
2. **Criterio degli strumenti** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quali strumenti sono disponibili/consentiti**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) è una **via di fuga solo per exec** per eseguire fuori dalla sandbox quando sei in sandbox (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è configurata su `node`).

## Debug rapido

Usa l’ispettore per vedere cosa OpenClaw sta facendo _effettivamente_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Stampa:

- modalità/scope/accesso al workspace effettivi della sandbox
- se la sessione è attualmente in sandbox (main rispetto a non-main)
- allow/deny effettivi degli strumenti sandbox (e se provengono da agent/global/default)
- gate elevated e percorsi delle chiavi di correzione

## Sandbox: dove vengono eseguiti gli strumenti

La sandbox è controllata da `agents.defaults.sandbox.mode`:

- `"off"`: tutto viene eseguito sull’host.
- `"non-main"`: solo le sessioni non-main sono in sandbox (una "sorpresa" comune per gruppi/canali).
- `"all"`: tutto è in sandbox.

Vedi [Sandboxing](/it/gateway/sandboxing) per la matrice completa (scope, mount del workspace, immagini).

### Bind mount (verifica rapida di sicurezza)

- `docker.binds` _perfora_ il filesystem della sandbox: tutto ciò che monti è visibile dentro il container con la modalità impostata (`:ro` o `:rw`).
- Il valore predefinito è lettura-scrittura se ometti la modalità; preferisci `:ro` per sorgenti/segreti.
- `scope: "shared"` ignora i bind per agente (si applicano solo i bind globali).
- OpenClaw valida due volte le origini dei bind: prima sul percorso sorgente normalizzato, poi di nuovo dopo la risoluzione tramite l’antenato esistente più profondo. Le fughe tramite genitori symlink non aggirano i controlli su percorsi bloccati o radici consentite.
- I percorsi foglia inesistenti vengono comunque controllati in modo sicuro. Se `/workspace/alias-out/new-file` si risolve tramite un genitore symlink verso un percorso bloccato o fuori dalle radici consentite configurate, il bind viene rifiutato.
- Eseguire il bind di `/var/run/docker.sock` concede di fatto alla sandbox il controllo dell’host; fallo solo intenzionalmente.
- L’accesso al workspace (`workspaceAccess: "ro"`/`"rw"`) è indipendente dalle modalità dei bind.

## Criterio degli strumenti: quali strumenti esistono/sono richiamabili

Contano due livelli:

- **Profilo strumenti**: `tools.profile` e `agents.list[].tools.profile` (allowlist di base)
- **Profilo strumenti del provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Criterio strumenti globale/per agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Criterio strumenti del provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Criterio strumenti della sandbox** (si applica solo quando in sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regole pratiche:

- `deny` vince sempre.
- Se `allow` non è vuoto, tutto il resto viene trattato come bloccato.
- Il criterio degli strumenti è il blocco definitivo: `/exec` non può sovrascrivere uno strumento `exec` negato.
- Il criterio degli strumenti filtra la disponibilità degli strumenti per nome; non ispeziona gli effetti collaterali dentro `exec`. Se `exec` è consentito, negare `write`, `edit` o `apply_patch` non rende i comandi shell di sola lettura.
- `/exec` cambia solo i valori predefiniti della sessione per mittenti autorizzati; non concede accesso agli strumenti.
  Le chiavi strumenti del provider accettano `provider` (per esempio `google-antigravity`) oppure `provider/model` (per esempio `openai/gpt-5.4`).

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
  Per agenti di sola lettura, nega `group:runtime` oltre agli strumenti filesystem mutanti, a meno che il criterio filesystem della sandbox o un confine host separato non applichi il vincolo di sola lettura.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: tutti gli strumenti integrati di OpenClaw (esclude i Plugin provider)

## Elevated: "esegui sull’host" solo per exec

Elevated **non** concede strumenti aggiuntivi; influisce solo su `exec`.

- Se sei in sandbox, `/elevated on` (o `exec` con `elevated: true`) esegue fuori dalla sandbox (le approvazioni possono comunque applicarsi).
- Usa `/elevated full` per saltare le approvazioni exec per la sessione.
- Se stai già eseguendo in modalità diretta, elevated è di fatto un no-op (resta comunque soggetto a gate).
- Elevated **non** è limitato allo scope di una skill e **non** sovrascrive allow/deny degli strumenti.
- Elevated non concede override arbitrari tra host da `host=auto`; segue le normali regole della destinazione exec e conserva `node` solo quando la destinazione configurata/di sessione è già `node`.
- `/exec` è separato da elevated. Regola solo i valori predefiniti exec per sessione per mittenti autorizzati.

Gate:

- Abilitazione: `tools.elevated.enabled` (e facoltativamente `agents.list[].tools.elevated.enabled`)
- Allowlist dei mittenti: `tools.elevated.allowFrom.<provider>` (e facoltativamente `agents.list[].tools.elevated.allowFrom.<provider>`)

Vedi [Modalità Elevated](/it/tools/elevated).

## Correzioni comuni per la "prigione sandbox"

### "Strumento X bloccato dal criterio strumenti della sandbox"

Chiavi di correzione (scegline una):

- Disabilita la sandbox: `agents.defaults.sandbox.mode=off` (o per agente `agents.list[].sandbox.mode=off`)
- Consenti lo strumento dentro la sandbox:
  - rimuovilo da `tools.sandbox.tools.deny` (o per agente `agents.list[].tools.sandbox.tools.deny`)
  - oppure aggiungilo a `tools.sandbox.tools.allow` (o all’allow per agente)

### "Pensavo fosse main, perché è in sandbox?"

In modalità `"non-main"`, le chiavi di gruppo/canale _non_ sono main. Usa la chiave della sessione main (mostrata da `sandbox explain`) oppure passa la modalità a `"off"`.

## Correlati

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo della sandbox (modalità, scope, backend, immagini)
- [Sandbox e strumenti multi-agent](/it/tools/multi-agent-sandbox-tools) -- override e precedenza per agente
- [Modalità Elevated](/it/tools/elevated)
