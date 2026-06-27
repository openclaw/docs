---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Waarom een hulpmiddel wordt geblokkeerd: sandbox-runtime, beleid voor toestaan/weigeren van hulpmiddelen en controles voor verhoogde uitvoering'
title: Sandbox versus toolbeleid versus verhoogd
x-i18n:
    generated_at: "2026-06-27T17:36:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw heeft drie verwante (maar verschillende) instellingen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) bepaalt **waar tools draaien** (sandbox-backend versus host).
2. **Toolbeleid** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) bepaalt **welke tools beschikbaar/toegestaan zijn**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) is een **alleen-voor-exec ontsnappingsroute** om buiten de sandbox te draaien wanneer je in een sandbox zit (standaard `gateway`, of `node` wanneer het exec-doel is geconfigureerd als `node`).

## Snel debuggen

Gebruik de inspector om te zien wat OpenClaw _daadwerkelijk_ doet:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Deze toont:

- effectieve sandboxmodus/scope/workspace-toegang
- of de sessie momenteel in een sandbox zit (main versus niet-main)
- effectieve allow/deny voor sandboxtools (en of dit afkomstig is van agent/globaal/standaard)
- elevated-gates en fix-it-sleutelpaden

## Sandbox: waar tools draaien

Sandboxing wordt beheerd door `agents.defaults.sandbox.mode`:

- `"off"`: alles draait op de host.
- `"non-main"`: alleen niet-main-sessies draaien in een sandbox (veelvoorkomende "verrassing" voor groepen/kanalen).
- `"all"`: alles draait in een sandbox.

Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige matrix (scope, workspace-mounts, images).

### Bind-mounts (snelle securitycontrole)

- `docker.binds` _doorbreekt_ het sandboxbestandssysteem: alles wat je mount is zichtbaar in de container met de modus die je instelt (`:ro` of `:rw`).
- Standaard is read-write als je de modus weglaat; geef de voorkeur aan `:ro` voor source/secrets.
- `scope: "shared"` negeert binds per agent (alleen globale binds zijn van toepassing).
- OpenClaw valideert bind-bronnen twee keer: eerst op het genormaliseerde bronpad, daarna opnieuw na resolve via de diepste bestaande ancestor. Escapes via symlink-parents omzeilen controles op geblokkeerde paden of toegestane roots niet.
- Niet-bestaande leaf-paden worden nog steeds veilig gecontroleerd. Als `/workspace/alias-out/new-file` via een gesymlinkte parent naar een geblokkeerd pad of buiten de geconfigureerde toegestane roots resolveert, wordt de bind geweigerd.
- Het binden van `/var/run/docker.sock` geeft de sandbox effectief controle over de host; doe dit alleen bewust.
- Workspace-toegang (`workspaceAccess: "ro"`/`"rw"`) staat los van bind-modi.

## Toolbeleid: welke tools bestaan/aanroepbaar zijn

Twee lagen zijn belangrijk:

- **Toolprofiel**: `tools.profile` en `agents.list[].tools.profile` (basis-allowlist)
- **Provider-toolprofiel**: `tools.byProvider[provider].profile` en `agents.list[].tools.byProvider[provider].profile`
- **Globaal/per-agent toolbeleid**: `tools.allow`/`tools.deny` en `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-toolbeleid**: `tools.byProvider[provider].allow/deny` en `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-toolbeleid** (alleen van toepassing in een sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` en `agents.list[].tools.sandbox.tools.*`

Vuistregels:

- `deny` wint altijd.
- Als `allow` niet leeg is, wordt al het andere als geblokkeerd behandeld.
- Toolbeleid is de harde stop: `/exec` kan een geweigerde `exec`-tool niet overrulen.
- Toolbeleid filtert toolbeschikbaarheid op naam; het inspecteert geen neveneffecten binnen `exec`. Als `exec` is toegestaan, maakt het weigeren van `write`, `edit` of `apply_patch` shellcommando's niet read-only.
- `/exec` wijzigt alleen sessiestandaarden voor geautoriseerde afzenders; het verleent geen tooltoegang.
  Provider-toolsleutels accepteren zowel `provider` (bijv. `google-antigravity`) als `provider/model` (bijv. `openai/gpt-5.4`).
- Gateway-logs bevatten auditvermeldingen voor `agents/tool-policy` wanneer een toolbeleidsstap tools verwijdert of een sandbox-toolbeleid een aanroep blokkeert. Gebruik `openclaw logs` om het regellabel, de config-sleutel en de betrokken toolnamen te zien.

### Toolgroepen (shorthands)

Toolbeleid (globaal, agent, sandbox) ondersteunt `group:*`-vermeldingen die uitklappen naar meerdere tools:

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
  Weiger voor read-only agents ook `group:runtime` naast muterende bestandssysteemtools, tenzij het sandboxbestandssysteembeleid of een afzonderlijke hostgrens de read-only-beperking afdwingt.
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
- `group:plugins`: alle geladen tools die eigendom zijn van een plugin, inclusief geconfigureerde MCP-servers die via `bundle-mcp` worden aangeboden

Voor MCP-servers in een sandbox is het sandbox-toolbeleid een tweede allow-gate. Als `mcp.servers` is geconfigureerd maar sandboxbeurten alleen ingebouwde tools tonen, voeg dan `bundle-mcp`, `group:plugins` of een server-geprefixte MCP-toolnaam/glob zoals `outlook__send_mail` of `outlook__*` toe aan `tools.sandbox.tools.alsoAllow`, herstart/herlaad daarna de gateway en leg de toollijst opnieuw vast. Server-globs gebruiken de provider-veilige MCP-serverprefix: niet-`[A-Za-z0-9_-]`-tekens worden `-`, namen die niet met een letter beginnen krijgen een `mcp-`-prefix, en lange of dubbele prefixes kunnen worden afgekapt of een suffix krijgen.

`openclaw doctor` controleert momenteel deze vorm voor door OpenClaw beheerde servers in `mcp.servers`. MCP-servers die worden geladen vanuit gebundelde pluginmanifesten of Claude `.mcp.json` gebruiken dezelfde sandbox-gate, maar deze diagnose somt die bronnen nog niet op; gebruik dezelfde allowlist-vermeldingen als hun tools verdwijnen in sandboxbeurten.

## Elevated: alleen-voor-exec "op host draaien"

Elevated verleent **geen** extra tools; het beïnvloedt alleen `exec`.

- Als je in een sandbox zit, draait `/elevated on` (of `exec` met `elevated: true`) buiten de sandbox (approvals kunnen nog steeds gelden).
- Gebruik `/elevated full` om exec-approvals voor de sessie over te slaan.
- Als je al direct draait, is elevated effectief een no-op (nog steeds gated).
- Elevated is **niet** skill-scoped en overrult tool-allow/deny **niet**.
- Elevated verleent geen willekeurige cross-host overrides vanuit `host=auto`; het volgt de normale regels voor exec-doelen en behoudt alleen `node` wanneer het geconfigureerde/sessie-doel al `node` is.
- `/exec` staat los van elevated. Het past alleen exec-standaarden per sessie aan voor geautoriseerde afzenders.

Gates:

- Inschakeling: `tools.elevated.enabled` (en optioneel `agents.list[].tools.elevated.enabled`)
- Afzender-allowlists: `tools.elevated.allowFrom.<provider>` (en optioneel `agents.list[].tools.elevated.allowFrom.<provider>`)

Zie [Elevated Mode](/nl/tools/elevated).

## Veelvoorkomende oplossingen voor "sandbox jail"

### "Tool X blocked by sandbox tool policy"

Fix-it-sleutels (kies er een):

- Schakel sandbox uit: `agents.defaults.sandbox.mode=off` (of per agent `agents.list[].sandbox.mode=off`)
- Sta de tool toe binnen de sandbox:
  - verwijder deze uit `tools.sandbox.tools.deny` (of per agent `agents.list[].tools.sandbox.tools.deny`)
  - of voeg deze toe aan `tools.sandbox.tools.allow` (of allow per agent)
- Controleer `openclaw logs` op de `agents/tool-policy`-vermelding. Deze registreert de sandboxmodus en of de allow- of deny-regel de tool heeft geblokkeerd.

### "I thought this was main, why is it sandboxed?"

In de modus `"non-main"` zijn groeps-/kanaalsleutels _niet_ main. Gebruik de main-sessiesleutel (getoond door `sandbox explain`) of schakel de modus naar `"off"`.

## Gerelateerd

- [Sandboxing](/nl/gateway/sandboxing) -- volledige sandboxreferentie (modi, scopes, backends, images)
- [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) -- overrides en prioriteit per agent
- [Elevated Mode](/nl/tools/elevated)
