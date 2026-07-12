---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Waarom een tool wordt geblokkeerd: sandboxruntime, beleid voor het toestaan/weigeren van tools en poorten voor uitvoering met verhoogde bevoegdheden'
title: Sandbox versus toolbeleid versus verhoogde bevoegdheden
x-i18n:
    generated_at: "2026-07-12T08:55:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw heeft drie verwante maar verschillende besturingselementen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) bepaalt **waar tools worden uitgevoerd** (sandboxbackend of host).
2. **Toolbeleid** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) bepaalt **welke tools beschikbaar/toegestaan zijn**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) is een **uitsluitend voor exec bedoelde uitweg** om buiten de sandbox uit te voeren wanneer je in een sandbox werkt (standaard `gateway`, of `node` wanneer het exec-doel is ingesteld op `node`).

## Snel debuggen

Gebruik de inspectietool om te zien wat OpenClaw _daadwerkelijk_ doet:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Deze toont:

- de effectieve sandboxmodus, het bereik en de werkruimtetoegang
- of de sessie momenteel in een sandbox wordt uitgevoerd (hoofd- of niet-hoofdsessie)
- de effectieve toestemmings- en weigeringsregels voor sandboxtools (en of deze afkomstig zijn van de agent, globale configuratie of standaardinstellingen)
- Elevated-controles en configuratiepaden voor oplossingen

## Sandbox: waar tools worden uitgevoerd

Sandboxing wordt bestuurd door `agents.defaults.sandbox.mode`:

- `"off"`: alles wordt op de host uitgevoerd.
- `"non-main"`: alleen niet-hoofdsessies worden in een sandbox uitgevoerd (een veelvoorkomende „verrassing” voor groepen/kanalen).
- `"all"`: alles wordt in een sandbox uitgevoerd.

`agents.defaults.sandbox.workspaceAccess` bepaalt wat de sandbox kan zien: `"none"`, `"ro"` of `"rw"`.

Zie [Sandboxing](/nl/gateway/sandboxing) voor de volledige matrix (bereik, werkruimtekoppelingen en images).

### Bind-mounts (snelle beveiligingscontrole)

- `docker.binds` _doorbreekt_ het bestandssysteem van de sandbox: alles wat je koppelt, is in de container zichtbaar met de ingestelde modus (`:ro` of `:rw`).
- Als je de modus weglaat, is de standaard lezen en schrijven; geef voor broncode/geheimen de voorkeur aan `:ro`.
- `scope: "shared"` negeert bind-mounts per agent (alleen globale bind-mounts zijn van toepassing).
- OpenClaw valideert bind-bronnen tweemaal: eerst op het genormaliseerde bronpad en daarna opnieuw nadat het pad via de diepste bestaande bovenliggende map is herleid. Ontsnappingen via bovenliggende symlinks omzeilen controles op geblokkeerde paden of toegestane hoofdmappen niet.
- Niet-bestaande eindpaden worden nog steeds veilig gecontroleerd. Als `/workspace/alias-out/new-file` via een bovenliggende symlink wordt herleid naar een geblokkeerd pad of buiten de geconfigureerde toegestane hoofdmappen, wordt de bind-mount geweigerd.
- Het koppelen van `/var/run/docker.sock` geeft de sandbox feitelijk controle over de host; doe dit alleen bewust.
- Werkruimtetoegang (`workspaceAccess`) staat los van de modi van bind-mounts.

## Toolbeleid: welke tools bestaan/aanroepbaar zijn

De volgende lagen zijn van belang:

- **Toolprofiel**: `tools.profile` en `agents.list[].tools.profile` (basislijst met toegestane tools)
- **Toolprofiel per provider**: `tools.byProvider[provider].profile` en `agents.list[].tools.byProvider[provider].profile`
- **Globaal toolbeleid/toolbeleid per agent**: `tools.allow`/`tools.deny` en `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Toolbeleid per provider**: `tools.byProvider[provider].allow/deny` en `agents.list[].tools.byProvider[provider].allow/deny`
- **Toolbeleid voor de sandbox** (alleen van toepassing binnen een sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` en `agents.list[].tools.sandbox.tools.*`

Vuistregels:

- `deny` heeft altijd voorrang.
- Als `allow` niet leeg is, wordt al het overige als geblokkeerd beschouwd.
- Het toolbeleid is de harde grens: `/exec` kan een geweigerde `exec`-tool niet alsnog toestaan.
- Het toolbeleid filtert de beschikbaarheid van tools op naam; het inspecteert geen neveneffecten binnen `exec`. Als `exec` is toegestaan, maakt het weigeren van `write`, `edit` of `apply_patch` shellopdrachten niet alleen-lezen.
- `/exec` wijzigt alleen de sessiestandaarden voor geautoriseerde afzenders; het verleent geen toegang tot tools.
- Tool-sleutels voor providers accepteren zowel `provider` (bijvoorbeeld `google-antigravity`) als `provider/model` (bijvoorbeeld `openai/gpt-5.4`).
- Gateway-logboeken bevatten `agents/tool-policy`-auditvermeldingen wanneer een stap in het toolbeleid tools verwijdert of wanneer sandboxbeleid voor tools een aanroep blokkeert. Gebruik `openclaw logs` om het regellabel, de configuratiesleutel en de betrokken toolnamen te bekijken.

### Toolgroepen (verkorte notaties)

Toolbeleid (globaal, per agent en voor de sandbox) ondersteunt `group:*`-vermeldingen die naar meerdere tools worden uitgebreid:

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

| Groep              | Tools                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wordt geaccepteerd als alias voor `exec`)                                                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                    |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                              |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                      |
| `group:ui`         | `browser`, `canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                        |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                       |
| `group:openclaw`   | de meeste ingebouwde OpenClaw-tools (met uitzondering van de bestandssysteem- en runtimeprimitieven `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` en providerplugins) |
| `group:plugins`    | alle geladen tools die eigendom zijn van plugins, inclusief geconfigureerde MCP-servers die via `bundle-mcp` beschikbaar worden gesteld                     |

Weiger voor alleen-lezen-agents zowel `group:runtime` als tools die het bestandssysteem wijzigen, tenzij het sandboxbeleid voor het bestandssysteem of een afzonderlijke hostgrens de alleen-lezenbeperking afdwingt.

Voor MCP-servers in een sandbox vormt het sandboxbeleid voor tools een tweede toelatingscontrole. Als `mcp.servers` is geconfigureerd maar sandboxbewerkingen alleen ingebouwde tools tonen, voeg dan `bundle-mcp`, `group:plugins` of een MCP-toolnaam/-patroon met servervoorvoegsel, zoals `outlook__send_mail` of `outlook__*`, toe aan `tools.sandbox.tools.alsoAllow`. Start of laad vervolgens de Gateway opnieuw en leg de toollijst opnieuw vast. Serverpatronen gebruiken het providerveilige MCP-servervoorvoegsel: tekens die niet tot `[A-Za-z0-9_-]` behoren, worden `-`, namen die niet met een letter beginnen krijgen het voorvoegsel `mcp-`, en lange of dubbele voorvoegsels kunnen worden ingekort of van een achtervoegsel worden voorzien.

`openclaw doctor` controleert deze vorm momenteel voor door OpenClaw beheerde servers in `mcp.servers`. MCP-servers die vanuit gebundelde pluginmanifesten of Claude `.mcp.json` worden geladen, gebruiken dezelfde sandboxcontrole, maar deze diagnose somt die bronnen nog niet op; gebruik dezelfde vermeldingen in de lijst met toegestane tools als hun tools uit sandboxbewerkingen verdwijnen.

## Elevated: uitsluitend voor exec „uitvoeren op host”

Elevated verleent **geen** extra tools; het is alleen van invloed op `exec`.

- Als je in een sandbox werkt, wordt met `/elevated on` (of `exec` met `elevated: true`) buiten de sandbox uitgevoerd (goedkeuringen kunnen nog steeds van toepassing zijn).
- Gebruik `/elevated full` om exec-goedkeuringen voor de sessie over te slaan.
- Als je al rechtstreeks uitvoert, heeft Elevated feitelijk geen effect (de controles blijven van toepassing).
- Elevated is **niet** beperkt tot een Skill en omzeilt **geen** toestemmings- of weigeringsregels voor tools.
- Elevated verleent vanuit `host=auto` geen willekeurige mogelijkheid om een andere host te kiezen; het volgt de normale regels voor exec-doelen en behoudt `node` alleen wanneer het geconfigureerde doel of sessiedoel al `node` is.
- `/exec` staat los van Elevated. Het past alleen de exec-standaarden per sessie aan voor geautoriseerde afzenders.

Controles:

- Inschakeling: `tools.elevated.enabled` (en optioneel `agents.list[].tools.elevated.enabled`)
- Lijsten met toegestane afzenders: `tools.elevated.allowFrom.<provider>` (en optioneel `agents.list[].tools.elevated.allowFrom.<provider>`)

Zie [Elevated-modus](/nl/tools/elevated).

## Veelvoorkomende oplossingen voor „opgesloten in de sandbox”

### „Tool X geblokkeerd door het sandboxbeleid voor tools”

Configuratiesleutels voor oplossingen (kies er één):

- Schakel de sandbox uit: `agents.defaults.sandbox.mode=off` (of per agent `agents.list[].sandbox.mode=off`)
- Sta de tool binnen de sandbox toe:
  - verwijder deze uit `tools.sandbox.tools.deny` (of per agent uit `agents.list[].tools.sandbox.tools.deny`)
  - of voeg deze toe aan `tools.sandbox.tools.allow` (of aan de lijst met toegestane tools per agent)
- Controleer `openclaw logs` op de `agents/tool-policy`-vermelding. Deze registreert de sandboxmodus en of de toestemmings- of weigeringsregel de tool heeft geblokkeerd.

### „Ik dacht dat dit de hoofdsessie was; waarom wordt deze in een sandbox uitgevoerd?”

In de modus `"non-main"` zijn groeps-/kanaalsleutels _geen_ hoofdsessie. Gebruik de sleutel van de hoofdsessie (weergegeven door `sandbox explain`) of wijzig de modus in `"off"`.

## Gerelateerd

- [Sandboxing](/nl/gateway/sandboxing) -- volledige sandboxreferentie (modi, bereiken, backends en images)
- [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) -- overschrijvingen per agent en voorrangsregels
- [Elevated-modus](/nl/tools/elevated)
