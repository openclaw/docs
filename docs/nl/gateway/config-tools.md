---
read_when:
    - Beleid, toelatingslijsten of experimentele functies voor `tools.*` configureren
    - Aangepaste providers registreren of basis-URL's overschrijven
    - OpenAI-compatibele zelfgehoste eindpunten instellen
sidebarTitle: Tools and custom providers
summary: Configuratie van tools (beleid, experimentele schakelaars, door providers ondersteunde tools) en aangepaste provider-/basis-URL-configuratie
title: Configuratie — tools en aangepaste providers
x-i18n:
    generated_at: "2026-07-12T08:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-configuratiesleutels en aangepaste provider-/basis-URL-instellingen. Zie [Configuratiereferentie](/nl/gateway/configuration-reference) voor agents, kanalen en andere configuratiesleutels op het hoogste niveau.

## Hulpmiddelen

### Hulpmiddelprofielen

`tools.profile` stelt een basislijst met toegestane hulpmiddelen in vóór `tools.allow`/`tools.deny`:

<Note>
Lokale onboarding stelt nieuwe lokale configuraties waarin dit niet is ingesteld standaard in op `tools.profile: "coding"` (bestaande expliciete profielen blijven behouden).
</Note>

| Profiel     | Omvat                                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Alleen `session_status`                                                                                                                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                     |
| `full`      | Geen beperking (hetzelfde als niet ingesteld)                                                                                                                                                                                |

`coding` en `messaging` staan impliciet ook `bundle-mcp` toe (geconfigureerde MCP-servers).

### Hulpmiddelgroepen

| Groep              | Hulpmiddelen                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wordt geaccepteerd als alias voor `exec`)                                                                 |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Alle bovenstaande ingebouwde hulpmiddelen, behalve `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (exclusief pluginhulpmiddelen)       |
| `group:plugins`    | Hulpmiddelen die eigendom zijn van geladen plugins, waaronder geconfigureerde MCP-servers die via `bundle-mcp` beschikbaar worden gesteld             |

Met `spawn_task` kan een codeeragent bevestigde vervolgwerkzaamheden voorstellen zonder deze te starten. De Control UI toont de titel en samenvatting als een uitvoerbare chip; een door de Gateway ondersteunde TUI toont een gelijkwaardige interactieve prompt. Als een van beide wordt geaccepteerd, wordt een nieuwe beheerde worktree-sessie aangemaakt en wordt de volledige prompt daarheen verzonden, terwijl de huidige beurt doorgaat. `dismiss_task` trekt een nog openstaande suggestie in via de tijdelijke `task_id` die door `spawn_task` is geretourneerd.

De hulpmiddelen worden alleen aangeboden wanneer het initiërende operatoroppervlak Gateway-gebeurtenissen voor taaksuggesties kan ontvangen en verwerken. Kanaalsessies en lokale/ingebedde TUI-sessies ontvangen deze niet; kanaaltransporten hebben een overdraagbare, getypeerde taakactie nodig voordat ze deze stroom veilig beschikbaar kunnen stellen. Suggesties zijn proceslokaal en verdwijnen wanneer de Gateway opnieuw wordt gestart. Beide hulpmiddelen blijven onderdeel van het profiel `coding` en `group:sessions`, zodat het normale beleid via `tools.allow` en `tools.deny` ze automatisch configureert wanneer het oppervlak ze ondersteunt.

### MCP- en pluginhulpmiddelen binnen het sandboxbeleid voor hulpmiddelen

Geconfigureerde MCP-servers worden als pluginhulpmiddelen beschikbaar gesteld onder de plugin-id `bundle-mcp`. Normale hulpmiddelprofielen kunnen ze toestaan, maar `tools.sandbox.tools` vormt een aanvullende controlelaag voor sandboxsessies. Als de sandboxmodus `"all"` of `"non-main"` is, neem dan een van deze vermeldingen op in de sandboxlijst met toegestane hulpmiddelen wanneer MCP-/pluginhulpmiddelen zichtbaar moeten zijn:

- `bundle-mcp` voor door OpenClaw beheerde MCP-servers uit `mcp.servers`
- de plugin-id voor een specifieke native plugin
- `group:plugins` voor alle geladen pluginhulpmiddelen
- exacte namen van MCP-serverhulpmiddelen of serverpatronen, zoals `outlook__send_mail` of `outlook__*`, wanneer u slechts één server wilt

Serverpatronen gebruiken het voor providers veilige MCP-servervoorvoegsel, niet noodzakelijkerwijs de onbewerkte sleutel uit `mcp.servers`. Tekens die niet tot `[A-Za-z0-9_-]` behoren, worden `-`, namen die niet met een letter beginnen krijgen het voorvoegsel `mcp-`, en lange of dubbele voorvoegsels kunnen worden ingekort of van een achtervoegsel worden voorzien; `mcp.servers["Outlook Graph"]` gebruikt bijvoorbeeld een patroon zoals `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Zonder die vermelding op sandboxniveau kan de MCP-server nog steeds met succes worden geladen, terwijl de hulpmiddelen ervan vóór het providerverzoek worden weggefilterd. Gebruik `openclaw doctor` om deze configuratievorm te detecteren voor door OpenClaw beheerde servers in `mcp.servers`. MCP-servers die vanuit gebundelde pluginmanifesten of Claude `.mcp.json` worden geladen, gebruiken dezelfde sandboxcontrole, maar deze diagnose inventariseert die bronnen nog niet; gebruik dezelfde vermeldingen in de lijst met toegestane hulpmiddelen als hun hulpmiddelen verdwijnen tijdens gesandboxte beurten.

### `tools.codeMode`

`tools.codeMode` schakelt het algemene codemodusoppervlak van OpenClaw in. Wanneer dit
is ingeschakeld voor een uitvoering met hulpmiddelen, worden normale OpenClaw-hulpmiddelen achter de
`tools.*`-catalogusbrug in de sandbox geplaatst en zijn MCP-hulpmiddelen beschikbaar via de gegenereerde
`MCP`-naamruimte. Het model ziet normaal gesproken `exec` en `wait`; hulpmiddelen zoals `computer`
waarvan de gestructureerde resultaten niet via de uitsluitend-JSON-brug kunnen worden doorgegeven, blijven rechtstreeks beschikbaar.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

De verkorte notatie wordt ook geaccepteerd:

```json5
{
  tools: { codeMode: true },
}
```

MCP-declaraties worden in de codemodus beschikbaar gesteld via het alleen-lezen virtuele API-bestandsoppervlak.
Gastcode kan `API.list("mcp")` en
`API.read("mcp/<server>.d.ts")` aanroepen om TypeScript-achtige signaturen te inspecteren voordat
`MCP.<server>.<tool>()` wordt aangeroepen. Zie [Codemodus](/nl/reference/code-mode) voor het
runtimecontract, de beperkingen en de stappen voor foutopsporing.

### `tools.allow` / `tools.deny`

Globaal beleid voor het toestaan/weigeren van tools (weigeren heeft voorrang). Niet hoofdlettergevoelig en ondersteunt jokertekens met `*`. Wordt ook toegepast wanneer de Docker-sandbox is uitgeschakeld.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` en `apply_patch` zijn afzonderlijke tool-id's. `allow: ["write"]` schakelt voor compatibele modellen ook `apply_patch` in, maar `deny: ["write"]` weigert `apply_patch` niet. Om alle bestandswijzigingen te blokkeren, weigert u `group:fs` of vermeldt u elke wijzigende tool expliciet:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` en `alsoAllow` kunnen niet beide binnen hetzelfde bereik worden ingesteld (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — de configuratievalidatie wijst dit af. Voeg vermeldingen uit `alsoAllow` samen in `allow`, of laat `allow` weg en gebruik in plaats daarvan `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Beperk tools verder voor specifieke providers of modellen. Volgorde: basisprofiel → providerprofiel → toestaan/weigeren.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Beperkt tools voor een specifieke identiteit van de aanvrager. Dit biedt extra beveiliging boven op de toegangscontrole van het kanaal; afzenderwaarden moeten afkomstig zijn van de kanaaladapter, niet uit de berichttekst.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Sleutels gebruiken expliciete voorvoegsels: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` of `"*"`. Kanaal-id's zijn canonieke OpenClaw-id's; aliassen zoals `teams` worden genormaliseerd naar `msteams`. Verouderde sleutels zonder voorvoegsel worden alleen geaccepteerd als `id:`. De overeenkomingsvolgorde is kanaal+id, id, e164, gebruikersnaam, naam en vervolgens het jokerteken.

`agents.list[].tools.toolsBySender` per agent overschrijft de globale afzenderovereenkomst wanneer deze overeenkomt, zelfs met een leeg `{}`-beleid.

### `tools.elevated`

Regelt verhoogde `exec`-toegang buiten de sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Een overschrijving per agent (`agents.list[].tools.elevated`) kan alleen verdere beperkingen opleggen.
- `/elevated on|off|ask|full` slaat de status per sessie op; inline-instructies gelden voor één bericht.
- Verhoogde `exec` omzeilt de sandbox en gebruikt het geconfigureerde ontsnappingspad (standaard `gateway`, of `node` wanneer het `exec`-doel `node` is).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

De weergegeven waarden zijn standaardwaarden, behalve `applyPatch.allowModels` (standaard leeg/niet ingesteld, wat betekent dat elk compatibel model `apply_patch` mag gebruiken). `approvalRunningNoticeMs` geeft een melding dat de uitvoering nog bezig is wanneer een `exec` waarvoor goedkeuring is verleend lang duurt; `0` schakelt dit uit.

### `tools.loopDetection`

Veiligheidscontroles voor tool-lussen zijn **standaard uitgeschakeld**. Stel `enabled: true` in om detectie te activeren. Instellingen kunnen globaal worden gedefinieerd in `tools.loopDetection` en per agent worden overschreven via `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Maximale geschiedenis van toolaanroepen die wordt bewaard voor lusanalyse.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Drempelwaarde voor waarschuwingen bij herhalende patronen zonder voortgang.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Blokkeert herhaalde aanroepen van dezelfde niet-beschikbare of onbekende toolnaam na dit aantal mislukte pogingen.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Hogere herhalingsdrempel voor het blokkeren van kritieke lussen.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Drempelwaarde voor een harde stop van elke uitvoering zonder voortgang.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Waarschuwt bij herhaalde aanroepen met dezelfde tool en dezelfde argumenten.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Waarschuwt of blokkeert bij bekende pollingtools (`process.poll`, `command_status`, enzovoort).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Waarschuwt of blokkeert bij afwisselende paren van patronen zonder voortgang.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Het aantal pogingen na automatische Compaction waarvoor de beveiliging actief blijft; breekt af als de agent binnen dat venster dezelfde combinatie van tool, argumenten en resultaat herhaalt.
</ParamField>

<Warning>
Als `warningThreshold >= criticalThreshold` of `criticalThreshold >= globalCircuitBreakerThreshold`, mislukt de validatie.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

De weergegeven waarden zijn standaardwaarden, behalve `provider` en `userAgent`. `maxResponseBytes` wordt begrensd op 32000–10000000; `maxChars` wordt begrensd op `maxCharsCap` (verhoog `maxCharsCap` om grotere antwoorden toe te staan).

### `tools.media`

Configureert het interpreteren van inkomende media (afbeeldingen/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (standaard `2`), `audio.maxBytes` (standaard 20 MB) en `video.maxBytes` (standaard 50 MB) worden met hun standaardwaarden weergegeven; `image.maxBytes` is standaard 10 MB. Standaardtime-outs per aanvraag en capaciteit: afbeelding/audio `60` s, video `120` s.

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Providervermelding** (`type: "provider"` of weggelaten):

    - `provider`: id van de API-provider (`openai`, `anthropic`, `google`/`gemini`, `groq`, enzovoort)
    - `model`: overschrijving van de model-id
    - `profile` / `preferredProfile`: profielselectie uit `auth-profiles.json`

    **CLI-vermelding** (`type: "cli"`):

    - `command`: uit te voeren programma
    - `args`: argumentsjablonen (ondersteunt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, enzovoort; `openclaw doctor --fix` migreert verouderde tijdelijke aanduidingen `{input}` naar `{{MediaPath}}`)

    **Gemeenschappelijke velden:**

    - `capabilities`: optionele lijst (`image`, `audio`, `video`). Elke provider-Plugin declareert zijn eigen standaardset van capaciteiten; de meegeleverde provider `openai` gebruikt bijvoorbeeld standaard afbeelding+audio, `anthropic`/`minimax` afbeelding, `google` afbeelding+audio+video en `groq` audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overschrijvingen per vermelding.
    - `tools.media.image.timeoutSeconds` en overeenkomende vermeldingen voor het afbeeldingsmodel met `timeoutSeconds` zijn ook van toepassing wanneer de agent de expliciete tool `image` aanroept. Voor het interpreteren van afbeeldingen geldt deze time-out voor de aanvraag zelf en wordt deze niet verkort door eerder voorbereidingswerk.
    - Bij fouten wordt teruggevallen op de volgende vermelding.

    Providerauthenticatie volgt de standaardvolgorde: `auth-profiles.json` → omgevingsvariabelen → `models.providers.*.apiKey`.

    **Velden voor asynchrone voltooiing:**

    - `asyncCompletion.directSend`: verouderde compatibiliteitsvlag. Voltooide asynchrone mediataken blijven via de sessie van de aanvrager verlopen, zodat de agent het resultaat ontvangt, bepaalt hoe dit aan de gebruiker wordt gemeld en de berichtentool gebruikt wanneer levering via de bron dit vereist.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Bepaalt op welke sessies de sessietools (`sessions_list`, `sessions_history`, `sessions_send`) kunnen worden gericht.

Standaard: `tree` (de huidige sessie plus sessies die daaruit zijn gestart, zoals subagents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Visibility scopes">
    - `self`: alleen de huidige sessiesleutel.
    - `tree`: de huidige sessie plus sessies die door de huidige sessie zijn gestart (subagents).
    - `agent`: elke sessie die bij de huidige agent-id hoort (kan andere gebruikers omvatten als u sessies per afzender uitvoert onder dezelfde agent-id).
    - `all`: elke sessie. Voor het richten op andere agents is nog steeds `tools.agentToAgent` vereist.
    - Sandboxbegrenzing: wanneer de huidige sessie in een sandbox wordt uitgevoerd en `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (de standaardwaarde), wordt de zichtbaarheid gedwongen ingesteld op `tree`, zelfs als `tools.sessions.visibility="all"`.
    - Wanneer de waarde niet `all` is, bevat `sessions_list` een compact veld `visibility`
      dat de effectieve modus beschrijft en waarschuwt dat sommige sessies buiten
      het huidige bereik mogelijk zijn weggelaten.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Bepaalt de ondersteuning voor inlinebijlagen bij `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - Voor bijlagen is `enabled: true` vereist.
    - Bijlagen van subagents worden in de onderliggende werkruimte aangemaakt in `.openclaw/attachments/<uuid>/`, met een `.manifest.json`.
    - ACP-bijlagen mogen alleen afbeeldingen bevatten en worden inline doorgestuurd naar de ACP-runtime nadat aan dezelfde limieten voor het aantal bestanden, het aantal bytes per bestand en het totale aantal bytes is voldaan.
    - De inhoud van bijlagen wordt automatisch geredigeerd bij het permanent opslaan van transcripten.
    - Base64-invoer wordt gevalideerd met strikte controles op alfabet en opvulling, plus een groottecontrole vóór het decoderen.
    - Bestandsmachtigingen voor bijlagen van subagents zijn `0700` voor mappen en `0600` voor bestanden.
    - Het opruimen van subagentbijlagen volgt het beleid `cleanup`: `delete` verwijdert bijlagen altijd; `keep` behoudt ze alleen wanneer `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentele vlaggen voor ingebouwde tools. Standaard uitgeschakeld, tenzij een regel voor automatische inschakeling bij strikt agentische GPT-5-uitvoeringen van toepassing is.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: schakelt de gestructureerde tool `update_plan` in voor het bijhouden van niet-triviaal werk met meerdere stappen.
- Standaard: `false`, tenzij `agents.defaults.embeddedAgent.executionContract` (of een overschrijving per agent) is ingesteld op `"strict-agentic"` voor een uitvoering met een `openai`-provider en een model-id uit de GPT-5-familie (dit omvat ook uitvoeringen met OpenAI Codex CLI, aangezien de authenticatie en modelroutering van Codex onder de provider `openai` vallen). Stel dit in op `true` om de tool buiten dat bereik geforceerd in te schakelen, of op `false` om deze zelfs voor strikt agentische GPT-5-uitvoeringen uitgeschakeld te houden.
- Wanneer dit is ingeschakeld, voegt de systeemprompt ook gebruiksrichtlijnen toe, zodat het model de tool alleen voor substantieel werk gebruikt en maximaal één stap op `in_progress` houdt.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: standaardmodel voor gestarte subagents. Indien weggelaten, nemen subagents het model van de aanroeper over.
- `allowAgents`: standaardtoestaanlijst met geconfigureerde doelagent-id's voor `sessions_spawn` wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt (`["*"]` = elke geconfigureerde doelagent; standaard: alleen dezelfde agent). Verouderde vermeldingen waarvan de agentconfiguratie is verwijderd, worden door `sessions_spawn` geweigerd en uit `agents_list` weggelaten; voer `openclaw doctor --fix` uit om ze op te ruimen.
- `maxConcurrent`: maximaal aantal gelijktijdige uitvoeringen van subagents. Standaard: `8`.
- `runTimeoutSeconds`: time-out (in seconden) voor `sessions_spawn` wanneer de aanroeper geen eigen overschrijving doorgeeft. Standaard: `0` (geen time-out); de hierboven weergegeven `900` is een veelgebruikte expliciete instelling, niet de ingebouwde standaardwaarde.
- `announceTimeoutMs`: time-out per aanroep (in milliseconden) voor afleverpogingen van Gateway-aankondigingen via `agent`. Standaard: `120000`. Tijdelijke nieuwe pogingen kunnen ervoor zorgen dat de totale wachttijd voor de aankondiging langer is dan één geconfigureerde time-out.
- `archiveAfterMinutes`: het aantal minuten na voltooiing van een subagentsessie voordat deze automatisch wordt gearchiveerd. Standaard: `60`; `0` schakelt automatisch archiveren uit.
- Toolbeleid per subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Aangepaste providers en basis-URL's

Provider-Plugins publiceren hun eigen modelcatalogusregels. Voeg aangepaste providers toe via `models.providers` in de configuratie of via `~/.openclaw/agents/<agentId>/agent/models.json`.

Het configureren van een `baseUrl` voor een aangepaste of lokale provider is tevens de beperkte beslissing over netwerkvertrouwen voor HTTP-modelaanvragen: OpenClaw staat die exacte oorsprong met `scheme://host:port` toe via het beveiligde ophaalpad, zonder een afzonderlijke configuratieoptie toe te voegen of andere privé-oorsprongen te vertrouwen.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Authenticatie en samenvoegprioriteit">
    - Gebruik `authHeader: true` + `headers` voor aangepaste authenticatievereisten.
    - Overschrijf de hoofdmap van de agentconfiguratie met `OPENCLAW_AGENT_DIR`.
    - Samenvoegprioriteit voor overeenkomende provider-id's:
      - Niet-lege `baseUrl`-waarden in `models.json` van de agent hebben voorrang.
      - Niet-lege `apiKey`-waarden van de agent hebben alleen voorrang wanneer die provider niet door SecretRef wordt beheerd in de huidige configuratie-/authenticatieprofielcontext.
      - Door SecretRef beheerde `apiKey`-waarden van providers worden vernieuwd vanuit bronmarkeringen (`ENV_VAR_NAME` voor omgevingsverwijzingen, `secretref-managed` voor bestands-/uitvoeringsverwijzingen) in plaats van opgeloste geheimen permanent op te slaan.
      - Door SecretRef beheerde headerwaarden van providers worden vernieuwd vanuit bronmarkeringen (`secretref-env:ENV_VAR_NAME` voor omgevingsverwijzingen, `secretref-managed` voor bestands-/uitvoeringsverwijzingen).
      - Lege of ontbrekende `apiKey`-/`baseUrl`-waarden van de agent vallen terug op `models.providers` in de configuratie.
      - Voor overeenkomende `contextWindow`/`maxTokens` van een model heeft de expliciete configuratiewaarde voorrang wanneer deze aanwezig en geldig is (een positief eindig getal); anders wordt de impliciete/gegenereerde cataloguswaarde gebruikt.
      - Overeenkomende `contextTokens` van een model volgen dezelfde regel waarbij expliciet voorrang heeft en anders impliciet wordt gebruikt; gebruik dit om de effectieve context te beperken zonder de ingebouwde modelmetagegevens te wijzigen.
      - Catalogi van provider-Plugins worden als gegenereerde, door de Plugin beheerde catalogussegmenten opgeslagen in de Plugin-status van de agent.
      - Gebruik `models.mode: "replace"` wanneer de configuratie `models.json` volledig moet herschrijven en het samenvoegen van door Plugins beheerde catalogussegmenten moet overslaan.
      - Het permanent opslaan van markeringen is bronauthoritatief: markeringen worden geschreven vanuit de momentopname van de actieve bronconfiguratie (vóór oplossing), niet vanuit opgeloste geheime runtimewaarden.

  </Accordion>
</AccordionGroup>

### Details van providervelden

<AccordionGroup>
  <Accordion title="Catalogus op hoofdniveau">
    - `models.mode`: gedrag van de providercatalogus (`merge` of `replace`).
    - `models.providers`: aangepaste providertoewijzing, geïndexeerd op provider-id.
      - Veilige bewerkingen: gebruik `openclaw config set models.providers.<id> '<json>' --strict-json --merge` of `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` voor aanvullende updates. `config set` weigert destructieve vervangingen tenzij u `--replace` doorgeeft.

  </Accordion>
  <Accordion title="Providerverbinding en authenticatie">
    - `models.providers.*.api`: aanvraagadapter (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Gebruik voor zelfgehoste `/v1/chat/completions`-backends zoals MLX, vLLM, SGLang en de meeste lokale OpenAI-compatibele servers `openai-completions`. Een aangepaste provider met `baseUrl` maar zonder `api` gebruikt standaard `openai-completions`; stel `openai-responses` alleen in wanneer de backend `/v1/responses` ondersteunt.
    - `models.providers.*.apiKey`: providerreferentie (geef de voorkeur aan SecretRef-/omgevingssubstitutie).
    - `models.providers.*.auth`: authenticatiestrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standaard ingebouwd contextvenster voor modellen onder deze provider wanneer het modelitem geen `contextWindow` instelt.
    - `models.providers.*.contextTokens`: standaard effectieve runtimecontextlimiet voor modellen onder deze provider wanneer het modelitem geen `contextTokens` instelt.
    - `models.providers.*.maxTokens`: standaardlimiet voor uitvoertokens voor modellen onder deze provider wanneer het modelitem geen `maxTokens` instelt.
    - `models.providers.*.timeoutSeconds`: optionele time-out per provider voor HTTP-modelaanvragen in seconden, inclusief verbinding, headers, hoofdtekst en verwerking voor het afbreken van de volledige aanvraag.
    - `models.providers.*.injectNumCtxForOpenAICompat`: voeg voor Ollama + `openai-completions` `options.num_ctx` toe aan aanvragen (standaard: `true`).
    - `models.providers.*.authHeader`: dwing indien vereist het verzenden van referenties in de `Authorization`-header af.
    - `models.providers.*.baseUrl`: basis-URL van de bovenliggende API.
    - `models.providers.*.headers`: aanvullende statische headers voor proxy-/tenantroutering.

  </Accordion>
  <Accordion title="Overschrijvingen voor aanvraagtransport">
    `models.providers.*.request`: transportoverschrijvingen voor HTTP-aanvragen aan modelproviders.

    - `request.headers`: aanvullende headers (samengevoegd met de standaardwaarden van de provider). Waarden ondersteunen SecretRef.
    - `request.auth`: overschrijving van de authenticatiestrategie. Modi: `"provider-default"` (gebruik de ingebouwde authenticatie van de provider), `"authorization-bearer"` (met `token`), `"header"` (met `headerName`, `value`, optioneel `prefix`).
    - `request.proxy`: overschrijving van de HTTP-proxy. Modi: `"env-proxy"` (gebruik de omgevingsvariabelen `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (met `url`). Beide modi ondersteunen een optioneel `tls`-subobject.
    - `request.tls`: TLS-overschrijving voor rechtstreekse verbindingen. Velden: `ca`, `cert`, `key`, `passphrase` (ondersteunen allemaal SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: sta bij `true` toe dat HTTP-aanvragen aan modelproviders via de HTTP-ophaalbeveiliging van de provider naar privé-, CGNAT- of vergelijkbare bereiken gaan. Aangepaste/lokale basis-URL's van providers vertrouwen de exact geconfigureerde oorsprong al, behalve metadata-/link-local-oorsprongen, die zonder expliciete aanmelding geblokkeerd blijven. Stel dit in op `false` om het vertrouwen van de exacte oorsprong uit te schakelen. WebSocket gebruikt dezelfde `request` voor headers/TLS, maar niet die SSRF-beveiliging voor ophalen. Standaard `false`.

  </Accordion>
  <Accordion title="Modelcatalogusitems">
    - `models.providers.*.models`: expliciete modelcatalogusitems van de provider.
    - `models.providers.*.models.*.input`: modelinvoermodaliteiten. Gebruik `["text"]` voor modellen die alleen tekst ondersteunen en `["text", "image"]` voor modellen met ingebouwde ondersteuning voor afbeeldingen/visuele invoer. Afbeeldingsbijlagen worden alleen aan agentbeurten toegevoegd wanneer het geselecteerde model als afbeeldingsgeschikt is gemarkeerd.
    - `models.providers.*.models.*.contextWindow`: metagegevens van het ingebouwde contextvenster van het model. Dit overschrijft `contextWindow` op providerniveau voor dat model.
    - `models.providers.*.models.*.contextTokens`: optionele runtimecontextlimiet. Dit overschrijft `contextTokens` op providerniveau; gebruik dit wanneer u een kleiner effectief contextbudget wilt dan de ingebouwde `contextWindow` van het model; `openclaw models list` toont beide waarden wanneer ze verschillen.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionele compatibiliteitsaanwijzing. Voor `api: "openai-completions"` met een niet-lege, niet-ingebouwde `baseUrl` (host is niet `api.openai.com`) dwingt OpenClaw dit tijdens runtime af op `false`. Een lege/weggelaten `baseUrl` behoudt het standaardgedrag van OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionele compatibiliteitsaanwijzing voor OpenAI-compatibele chateindpunten die alleen tekenreeksen ondersteunen. Wanneer dit `true` is, zet OpenClaw `messages[].content`-arrays die uitsluitend tekst bevatten om in gewone tekenreeksen voordat de aanvraag wordt verzonden.
    - `models.providers.*.models.*.compat.strictMessageKeys`: optionele compatibiliteitsaanwijzing voor strikte OpenAI-compatibele chateindpunten. Wanneer dit `true` is, beperkt OpenClaw uitgaande Chat Completions-berichtobjecten tot `role` en `content` voordat de aanvraag wordt verzonden.
    - `models.providers.*.models.*.compat.thinkingFormat`: optionele aanwijzing voor de payload van het denkproces. Gebruik `"together"` voor `reasoning.enabled` in Together-stijl, `"qwen"` voor `enable_thinking` op hoofdniveau of `"qwen-chat-template"` voor `chat_template_kwargs.enable_thinking` op OpenAI-compatibele servers uit de Qwen-familie die chat-sjabloonargumenten op aanvraagniveau ondersteunen, zoals vLLM. Geconfigureerde vLLM Qwen-modellen bieden voor deze indelingen binaire `/think`-keuzes (`off`, `on`).
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: optionele compatibiliteitsaanwijzing voor Chat Completions-backends in DeepSeek-stijl die vereisen dat eerdere assistentberichten bij opnieuw afspelen `reasoning_content` behouden. Wanneer dit `true` is, behoudt OpenClaw dat veld in uitgaande assistentberichten. Gebruik dit bij het aansluiten van een aangepaste DeepSeek-compatibele proxy die aanvragen weigert nadat de redenering is verwijderd. Standaard `false`.

  </Accordion>
  <Accordion title="Amazon Bedrock-detectie">
    - `plugins.entries.amazon-bedrock.config.discovery`: hoofdinstelling voor automatische Bedrock-detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: schakel impliciete detectie in/uit.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-regio voor detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optioneel provider-id-filter voor gerichte detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: peilinterval voor het vernieuwen van detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: terugvalcontextvenster voor gedetecteerde modellen.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: maximaal aantal uitvoertokens bij terugval voor gedetecteerde modellen.

  </Accordion>
</AccordionGroup>

Interactieve onboarding voor aangepaste providers leidt afbeeldingsinvoer af voor bekende patronen van model-id's met visuele ondersteuning, waaronder GPT-4o/GPT-4.1/GPT-5+, de redeneringsfamilies `o1`/`o3`/`o4`, Claude, Gemini, elke id met het achtervoegsel `-vl` (Qwen-VL en vergelijkbare modellen) en benoemde families zoals LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V en GLM-4V; de aanvullende vraag wordt overgeslagen voor bekende families die alleen tekst ondersteunen (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama en kale Qwen-id's zonder het achtervoegsel vl/vision). Bij onbekende model-id's wordt nog steeds naar ondersteuning voor afbeeldingen gevraagd. Niet-interactieve onboarding gebruikt dezelfde afleiding; geef `--custom-image-input` door om metagegevens voor afbeeldingsgeschiktheid af te dwingen of `--custom-text-input` om metagegevens voor uitsluitend tekst af te dwingen.

### Providervoorbeelden

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    De officiële externe `cerebras`-provider-Plugin kan dit configureren via `openclaw onboard --auth-choice cerebras-api-key`. Gebruik alleen een expliciete providerconfiguratie wanneer u standaardwaarden overschrijft.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Gebruik `cerebras/zai-glm-4.7` voor Cerebras; `zai/glm-4.7` voor een rechtstreekse verbinding met Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic-compatibele, ingebouwde provider. Snelkoppeling: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Lokale modellen (LM Studio)">
    Zie [Lokale modellen](/nl/gateway/local-models). Kort gezegd: voer via de LM Studio Responses API een groot lokaal model uit op krachtige hardware; behoud samengevoegde gehoste modellen als terugvaloptie.
  </Accordion>
  <Accordion title="MiniMax M3 (rechtstreeks)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Stel `MINIMAX_API_KEY` in. Snelkoppelingen: `openclaw onboard --auth-choice minimax-global-api` of `openclaw onboard --auth-choice minimax-cn-api`. De modelcatalogus gebruikt standaard M3 en bevat ook de M2.7-varianten. Op het Anthropic-compatibele streamingpad schakelt OpenClaw het denkproces van MiniMax M2.x standaard uit, tenzij je `thinking` zelf expliciet instelt; MiniMax-M3 (en M3.x) blijft standaard op het weggelaten/adaptieve denkpad van de provider. `/fast on` of `params.fastMode: true` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Voor het Chinese eindpunt: `baseUrl: "https://api.moonshot.cn/v1"` of `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Native Moonshot-eindpunten geven aan dat ze compatibel zijn met streamingverbruiksgegevens via het gedeelde `openai-completions`-transport. OpenClaw baseert dit op de mogelijkheden van het eindpunt en niet uitsluitend op de ingebouwde provider-ID.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Stel `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`) in. Gebruik `opencode/...`-verwijzingen voor de Zen-catalogus of `opencode-go/...`-verwijzingen voor de Go-catalogus. Snelkoppeling: `openclaw onboard --auth-choice opencode-zen` of `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatibel)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    De basis-URL moet `/v1` weglaten (de Anthropic-client voegt dit toe). Snelkoppeling: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Stel `ZAI_API_KEY` in. Modelverwijzingen gebruiken de canonieke provider-ID `zai/*`. Snelkoppeling: `openclaw onboard --auth-choice zai-api-key`.

    - Algemeen eindpunt: `https://api.z.ai/api/paas/v4`
    - Programmeereindpunt: `https://api.z.ai/api/coding/paas/v4`
    - De standaardauthenticatiekeuze `zai-api-key` test je sleutel en detecteert automatisch bij welk eindpunt deze hoort (als detectie geen uitsluitsel geeft, wordt teruggevallen op een vraag met Global als standaardwaarde). Er zijn ook afzonderlijke authenticatiekeuzes voor CN en Coding-Plan beschikbaar voor expliciete selectie.
    - Definieer voor het algemene eindpunt een aangepaste provider met een overschrijving van de basis-URL.

  </Accordion>
</AccordionGroup>

---

## Gerelateerd

- [Configuratie — agents](/nl/gateway/config-agents)
- [Configuratie — kanalen](/nl/gateway/config-channels)
- [Configuratiereferentie](/nl/gateway/configuration-reference) — overige sleutels op het hoogste niveau
- [Hulpmiddelen en plugins](/nl/tools)
