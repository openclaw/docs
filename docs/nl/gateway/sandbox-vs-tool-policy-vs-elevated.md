---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Waarom een hulpmiddel wordt geblokkeerd: sandbox-runtimeomgeving, beleid voor toestaan/weigeren van hulpmiddelen en toegangspoorten voor uitvoering met verhoogde rechten'
title: Sandbox versus toolbeleid versus verhoogd
x-i18n:
    generated_at: "2026-05-06T09:15:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw heeft drie gerelateerde (maar verschillende) controles:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) bepaalt **waar tools worden uitgevoerd** (sandbox-backend versus host).
2. **Toolbeleid** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) bepaalt **welke tools beschikbaar/toegestaan zijn**.
3. **Verhoogd** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) is een **alleen-voor-exec ontsnappingsroute** om buiten de sandbox uit te voeren wanneer je in een sandbox zit (standaard `gateway`, of `node` wanneer het exec-doel is geconfigureerd als `node`).

## Snel debuggen

Gebruik de inspector om te zien wat OpenClaw _daadwerkelijk_ doet:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Deze toont:

- effectieve sandboxmodus/-scope/werkruimtetoegang
- of de sessie momenteel in een sandbox zit (main versus niet-main)
- effectieve toestaan/weigeren-regels voor sandboxtools (en of die van agent/globaal/standaard komen)
- verhoogde gates en sleutelpaths voor oplossingen

## Sandbox: waar tools worden uitgevoerd

Sandboxing wordt beheerd door `agents.defaults.sandbox.mode`:

- `"off"`: alles wordt uitgevoerd op de host.
- `"non-main"`: alleen niet-main-sessies zitten in een sandbox (veelvoorkomende "verrassing" voor groepen/kanalen).
- `"all"`: alles zit in een sandbox.

Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige matrix (scope, werkruimte-mounts, images).

### Bind mounts (snelle beveiligingscontrole)

- `docker.binds` _doorboort_ het sandboxbestandssysteem: alles wat je mount, is zichtbaar binnen de container met de modus die je instelt (`:ro` of `:rw`).
- Standaard is lezen-schrijven als je de modus weglaat; geef de voorkeur aan `:ro` voor bronbestanden/geheimen.
- `scope: "shared"` negeert binds per agent (alleen globale binds zijn van toepassing).
- OpenClaw valideert bind-bronnen twee keer: eerst op het genormaliseerde bronpad, daarna opnieuw na resolving via de diepste bestaande voorouder. Escapes via symlink-ouders omzeilen controles op geblokkeerde paden of toegestane roots niet.
- Niet-bestaande leaf-paden worden nog steeds veilig gecontroleerd. Als `/workspace/alias-out/new-file` via een gesymlinkte ouder resolved naar een geblokkeerd pad of buiten de geconfigureerde toegestane roots, wordt de bind geweigerd.
- Het binden van `/var/run/docker.sock` geeft de sandbox feitelijk controle over de host; doe dit alleen bewust.
- Werkruimtetoegang (`workspaceAccess: "ro"`/`"rw"`) staat los van bind-modi.

## Toolbeleid: welke tools bestaan/aanroepbaar zijn

Twee lagen zijn belangrijk:

- **Toolprofiel**: `tools.profile` en `agents.list[].tools.profile` (basis-allowlist)
- **Provider-toolprofiel**: `tools.byProvider[provider].profile` en `agents.list[].tools.byProvider[provider].profile`
- **Globaal/per-agent-toolbeleid**: `tools.allow`/`tools.deny` en `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-toolbeleid**: `tools.byProvider[provider].allow/deny` en `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-toolbeleid** (alleen van toepassing wanneer sandboxed): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` en `agents.list[].tools.sandbox.tools.*`

Vuistregels:

- `deny` wint altijd.
- Als `allow` niet leeg is, wordt al het andere als geblokkeerd behandeld.
- Toolbeleid is de harde stop: `/exec` kan een geweigerde `exec`-tool niet overriden.
- `/exec` wijzigt alleen sessiestandaarden voor geautoriseerde afzenders; het verleent geen tooltoegang.
  Provider-toolkeys accepteren `provider` (bijv. `google-antigravity`) of `provider/model` (bijv. `openai/gpt-5.4`).

### Toolgroepen (shorthands)

Toolbeleid (globaal, agent, sandbox) ondersteunt `group:*`-items die uitvouwen naar meerdere tools:

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

Beschikbare groepen:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` wordt geaccepteerd als
  alias voor `exec`)
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
- `group:openclaw`: alle ingebouwde OpenClaw-tools (exclusief provider-plugins)

## Verhoogd: alleen voor exec "op host uitvoeren"

Verhoogd verleent **geen** extra tools; het beïnvloedt alleen `exec`.

- Als je in een sandbox zit, voert `/elevated on` (of `exec` met `elevated: true`) buiten de sandbox uit (goedkeuringen kunnen nog steeds gelden).
- Gebruik `/elevated full` om exec-goedkeuringen voor de sessie over te slaan.
- Als je al direct uitvoert, is verhoogd effectief een no-op (nog steeds gated).
- Verhoogd is **niet** skill-scoped en overridet **niet** toestaan/weigeren-regels voor tools.
- Verhoogd verleent geen willekeurige cross-host-overrides vanuit `host=auto`; het volgt de normale regels voor exec-doelen en behoudt `node` alleen wanneer het geconfigureerde/sessie-doel al `node` is.
- `/exec` staat los van verhoogd. Het past alleen exec-standaarden per sessie aan voor geautoriseerde afzenders.

Gates:

- Inschakeling: `tools.elevated.enabled` (en optioneel `agents.list[].tools.elevated.enabled`)
- Afzender-allowlists: `tools.elevated.allowFrom.<provider>` (en optioneel `agents.list[].tools.elevated.allowFrom.<provider>`)

Zie [Verhoogde modus](/nl/tools/elevated).

## Veelvoorkomende oplossingen voor "sandbox jail"

### "Tool X geblokkeerd door sandbox-toolbeleid"

Sleutels voor oplossing (kies er een):

- Sandbox uitschakelen: `agents.defaults.sandbox.mode=off` (of per agent `agents.list[].sandbox.mode=off`)
- De tool toestaan binnen de sandbox:
  - verwijder deze uit `tools.sandbox.tools.deny` (of per agent `agents.list[].tools.sandbox.tools.deny`)
  - of voeg deze toe aan `tools.sandbox.tools.allow` (of allow per agent)

### "Ik dacht dat dit main was, waarom zit het in een sandbox?"

In `"non-main"`-modus zijn groeps-/kanaalkeys _niet_ main. Gebruik de main-sessiekey (getoond door `sandbox explain`) of schakel de modus naar `"off"`.

## Gerelateerd

- [Sandboxing](/nl/gateway/sandboxing) -- volledige sandboxreferentie (modi, scopes, backends, images)
- [Multi-Agent Sandbox en tools](/nl/tools/multi-agent-sandbox-tools) -- overrides en prioriteit per agent
- [Verhoogde modus](/nl/tools/elevated)
