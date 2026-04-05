---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Perché uno strumento è bloccato: runtime sandbox, policy di autorizzazione/blocco degli strumenti e controlli exec elevati'
title: Sandbox vs policy degli strumenti vs Elevated
x-i18n:
    generated_at: "2026-04-05T13:53:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs policy degli strumenti vs Elevated

OpenClaw ha tre controlli correlati (ma diversi):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dove vengono eseguiti gli strumenti** (Docker vs host).
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

- modalità/ambito sandbox/accesso al workspace effettivi
- se la sessione è attualmente in sandbox (main vs non-main)
- autorizzazione/blocco effettivi degli strumenti sandbox (e se provengono da agent/globale/predefinito)
- controlli elevated e percorsi chiave per la correzione

## Sandbox: dove vengono eseguiti gli strumenti

Il sandboxing è controllato da `agents.defaults.sandbox.mode`:

- `"off"`: tutto viene eseguito sull'host.
- `"non-main"`: solo le sessioni non-main sono in sandbox (comune “sorpresa” per gruppi/canali).
- `"all"`: tutto è in sandbox.

Vedi [Sandboxing](/gateway/sandboxing) per la matrice completa (ambito, mount del workspace, immagini).

### Bind mount (controllo rapido di sicurezza)

- `docker.binds` _buca_ il filesystem sandbox: tutto ciò che monti è visibile all'interno del container con la modalità impostata (`:ro` o `:rw`).
- Il valore predefinito è lettura-scrittura se ometti la modalità; preferisci `:ro` per sorgenti/segreti.
- `scope: "shared"` ignora i bind per agente (si applicano solo i bind globali).
- OpenClaw valida due volte le sorgenti dei bind: prima sul percorso sorgente normalizzato, poi di nuovo dopo la risoluzione attraverso l'antenato esistente più profondo. Le escape tramite symlink del genitore non aggirano i controlli di percorso bloccato o root consentita.
- I percorsi leaf inesistenti vengono comunque controllati in sicurezza. Se `/workspace/alias-out/new-file` si risolve tramite un genitore con symlink verso un percorso bloccato o fuori dalle root consentite configurate, il bind viene rifiutato.
- Montare `/var/run/docker.sock` consegna di fatto il controllo dell'host alla sandbox; fallo solo intenzionalmente.
- L'accesso al workspace (`workspaceAccess: "ro"`/`"rw"`) è indipendente dalle modalità dei bind.

## Policy degli strumenti: quali strumenti esistono/sono richiamabili

Contano due livelli:

- **Profilo strumenti**: `tools.profile` e `agents.list[].tools.profile` (allowlist di base)
- **Profilo strumenti del provider**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Policy strumenti globale/per agente**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Policy strumenti del provider**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Policy strumenti sandbox** (si applica solo quando si è in sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regole pratiche:

- `deny` vince sempre.
- Se `allow` non è vuoto, tutto il resto viene trattato come bloccato.
- La policy degli strumenti è il blocco definitivo: `/exec` non può sovrascrivere uno strumento `exec` negato.
- `/exec` cambia solo i valori predefiniti della sessione per mittenti autorizzati; non concede accesso agli strumenti.
  Le chiavi degli strumenti provider accettano sia `provider` (ad es. `google-antigravity`) sia `provider/model` (ad es. `openai/gpt-5.4`).

### Gruppi di strumenti (abbreviazioni)

Le policy degli strumenti (globali, per agente, sandbox) supportano voci `group:*` che si espandono in più strumenti:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `tts`
- `group:openclaw`: tutti gli strumenti OpenClaw integrati (esclude i plugin provider)

## Elevated: "esegui sull'host" solo per exec

Elevated **non** concede strumenti aggiuntivi; influisce solo su `exec`.

- Se sei in sandbox, `/elevated on` (o `exec` con `elevated: true`) esegue fuori dalla sandbox (potrebbero comunque applicarsi approvazioni).
- Usa `/elevated full` per saltare le approvazioni exec per la sessione.
- Se stai già eseguendo in modo diretto, elevated è di fatto una no-op (comunque soggetta a controlli).
- Elevated **non** è limitato alle Skills e **non** sovrascrive allow/deny degli strumenti.
- Elevated non concede override arbitrari cross-host da `host=auto`; segue le normali regole del target exec e preserva `node` solo quando il target configurato/della sessione è già `node`.
- `/exec` è separato da elevated. Regola solo i valori predefiniti exec per sessione per i mittenti autorizzati.

Controlli:

- Abilitazione: `tools.elevated.enabled` (e facoltativamente `agents.list[].tools.elevated.enabled`)
- Allowlist dei mittenti: `tools.elevated.allowFrom.<provider>` (e facoltativamente `agents.list[].tools.elevated.allowFrom.<provider>`)

Vedi [Elevated Mode](/tools/elevated).

## Correzioni comuni della "prigione sandbox"

### "Strumento X bloccato dalla policy strumenti sandbox"

Chiavi di correzione (scegline una):

- Disabilita sandbox: `agents.defaults.sandbox.mode=off` (o per agente `agents.list[].sandbox.mode=off`)
- Consenti lo strumento nella sandbox:
  - rimuovilo da `tools.sandbox.tools.deny` (o per agente `agents.list[].tools.sandbox.tools.deny`)
  - oppure aggiungilo a `tools.sandbox.tools.allow` (o all'allow per agente)

### "Pensavo che questo fosse main, perché è in sandbox?"

In modalità `"non-main"`, le chiavi di gruppo/canale _non_ sono main. Usa la chiave della sessione main (mostrata da `sandbox explain`) o cambia la modalità in `"off"`.

## Vedi anche

- [Sandboxing](/gateway/sandboxing) -- riferimento completo della sandbox (modalità, ambiti, backend, immagini)
- [Sandbox e strumenti multi-agente](/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Elevated Mode](/tools/elevated)
