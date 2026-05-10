---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Waarom een tool wordt geblokkeerd: sandboxruntime, beleid voor toestaan/weigeren van tools en poorten voor verhoogde exec'
title: Sandbox versus toolbeleid versus verhoogde rechten
x-i18n:
    generated_at: "2026-05-10T19:37:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw heeft drie gerelateerde (maar verschillende) besturingen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) bepaalt **waar tools worden uitgevoerd** (sandbox-backend versus host).
2. **Toolbeleid** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) bepaalt **welke tools beschikbaar/toegestaan zijn**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) is een **alleen-voor-exec nooduitgang** om buiten de sandbox te draaien wanneer je in een sandbox zit (`gateway` standaard, of `node` wanneer het exec-doel is geconfigureerd als `node`).

## Snel debuggen

Gebruik de inspector om te zien wat OpenClaw _daadwerkelijk_ doet:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Deze toont:

- effectieve sandboxmodus/scope/workspacetoegang
- of de sessie momenteel in een sandbox zit (main versus niet-main)
- effectieve allow/deny voor sandbox-tools (en of die afkomstig is van agent/globaal/standaard)
- Elevated-gates en fix-it-sleutelpaden

## Sandbox: waar tools draaien

Sandboxing wordt beheerd door `agents.defaults.sandbox.mode`:

- `"off"`: alles draait op de host.
- `"non-main"`: alleen niet-main-sessies zitten in een sandbox (veelvoorkomende "verrassing" voor groepen/kanalen).
- `"all"`: alles zit in een sandbox.

Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige matrix (scope, workspace-mounts, images).

### Bind-mounts (snelle beveiligingscontrole)

- `docker.binds` _doorboort_ het sandboxbestandssysteem: alles wat je mount is zichtbaar binnen de container met de modus die je instelt (`:ro` of `:rw`).
- De standaard is read-write als je de modus weglaat; geef de voorkeur aan `:ro` voor broncode/geheimen.
- `scope: "shared"` negeert binds per agent (alleen globale binds gelden).
- OpenClaw valideert bind-bronnen tweemaal: eerst op het genormaliseerde bronpad, daarna opnieuw na resolutie via de diepste bestaande ancestor. Ontsnappingen via symlink-parents omzeilen geen controles op geblokkeerde paden of toegestane roots.
- Niet-bestaande leaf-paden worden nog steeds veilig gecontroleerd. Als `/workspace/alias-out/new-file` via een gesymlinkte parent resolveert naar een geblokkeerd pad of buiten de geconfigureerde toegestane roots, wordt de bind geweigerd.
- Het binden van `/var/run/docker.sock` geeft de sandbox effectief controle over de host; doe dit alleen bewust.
- Workspacetoegang (`workspaceAccess: "ro"`/`"rw"`) staat los van bind-modi.

## Toolbeleid: welke tools bestaan/aanroepbaar zijn

Twee lagen zijn van belang:

- **Toolprofiel**: `tools.profile` en `agents.list[].tools.profile` (basis-allowlist)
- **Provider-toolprofiel**: `tools.byProvider[provider].profile` en `agents.list[].tools.byProvider[provider].profile`
- **Globaal/per-agent toolbeleid**: `tools.allow`/`tools.deny` en `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-toolbeleid**: `tools.byProvider[provider].allow/deny` en `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-toolbeleid** (geldt alleen wanneer gesandboxed): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` en `agents.list[].tools.sandbox.tools.*`

Vuistregels:

- `deny` wint altijd.
- Als `allow` niet leeg is, wordt al het andere als geblokkeerd behandeld.
- Toolbeleid is de harde stop: `/exec` kan een geweigerde `exec`-tool niet overriden.
- Toolbeleid filtert toolbeschikbaarheid op naam; het inspecteert geen bijwerkingen binnen `exec`. Als `exec` is toegestaan, maakt het weigeren van `write`, `edit` of `apply_patch` shellcommando's niet read-only.
- `/exec` wijzigt alleen sessiestandaarden voor geautoriseerde afzenders; het verleent geen tooltoegang.
  Provider-toolsleutels accepteren ofwel `provider` (bijv. `google-antigravity`) of `provider/model` (bijv. `openai/gpt-5.4`).

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
  Voor read-only agents moet je `group:runtime` weigeren, evenals muterende bestandssysteemtools, tenzij sandbox-bestandssysteembeleid of een aparte host-grens de read-only-beperking afdwingt.
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

## Elevated: alleen-voor-exec "op host draaien"

Elevated verleent **geen** extra tools; het heeft alleen invloed op `exec`.

- Als je gesandboxed bent, draait `/elevated on` (of `exec` met `elevated: true`) buiten de sandbox (goedkeuringen kunnen nog steeds gelden).
- Gebruik `/elevated full` om exec-goedkeuringen voor de sessie over te slaan.
- Als je al direct draait, is Elevated effectief een no-op (nog steeds gated).
- Elevated is **niet** skill-scoped en overridet **niet** tool-allow/deny.
- Elevated verleent geen willekeurige cross-host overrides vanuit `host=auto`; het volgt de normale regels voor exec-doelen en behoudt alleen `node` wanneer het geconfigureerde/sessie-doel al `node` is.
- `/exec` staat los van Elevated. Het past alleen exec-standaarden per sessie aan voor geautoriseerde afzenders.

Gates:

- Inschakeling: `tools.elevated.enabled` (en optioneel `agents.list[].tools.elevated.enabled`)
- Allowlists voor afzenders: `tools.elevated.allowFrom.<provider>` (en optioneel `agents.list[].tools.elevated.allowFrom.<provider>`)

Zie [Elevated Mode](/nl/tools/elevated).

## Veelvoorkomende oplossingen voor "sandbox jail"

### "Tool X blocked by sandbox tool policy"

Fix-it-sleutels (kies er een):

- Sandbox uitschakelen: `agents.defaults.sandbox.mode=off` (of per agent `agents.list[].sandbox.mode=off`)
- De tool binnen de sandbox toestaan:
  - verwijder deze uit `tools.sandbox.tools.deny` (of per agent `agents.list[].tools.sandbox.tools.deny`)
  - of voeg deze toe aan `tools.sandbox.tools.allow` (of allow per agent)

### "I thought this was main, why is it sandboxed?"

In modus `"non-main"` zijn groep-/kanaalsleutels _niet_ main. Gebruik de main-sessiesleutel (getoond door `sandbox explain`) of schakel de modus naar `"off"`.

## Gerelateerd

- [Sandboxing](/nl/gateway/sandboxing) -- volledige sandboxreferentie (modi, scopes, backends, images)
- [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) -- overrides en prioriteit per agent
- [Elevated Mode](/nl/tools/elevated)
