---
read_when:
    - '`tools.*`-beleid, allowlists of experimentele functies configureren'
    - Aangepaste providers registreren of basis-URL's overschrijven
    - Zelfgehoste OpenAI-compatibele endpoints instellen
sidebarTitle: Tools and custom providers
summary: Configuratie van tools (beleid, experimentele schakelaars, door providers ondersteunde tools) en installatie van aangepaste providers/basis-URL's
title: Configuratie — tools en aangepaste providers
x-i18n:
    generated_at: "2026-06-27T17:31:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-configuratiesleutels en aangepaste provider- / basis-URL-configuratie. Zie [Configuratiereferentie](/nl/gateway/configuration-reference) voor agents, channels en andere configuratiesleutels op het hoogste niveau.

## Hulpmiddelen

### Toolprofielen

`tools.profile` stelt een basis-allowlist in vóór `tools.allow`/`tools.deny`:

<Note>
Lokale onboarding zet nieuwe lokale configuraties standaard op `tools.profile: "coding"` wanneer dit niet is ingesteld (bestaande expliciete profielen blijven behouden).
</Note>

| Profiel     | Omvat                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | alleen `session_status`                                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Geen beperking (hetzelfde als niet ingesteld)                                                                                                    |

### Toolgroepen

| Groep              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wordt geaccepteerd als alias voor `exec`)                                   |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Alle ingebouwde tools (provider-Plugins uitgesloten)                                                                    |
| `group:plugins`    | Tools die eigendom zijn van geladen Plugins, inclusief geconfigureerde MCP-servers die via `bundle-mcp` worden aangeboden |

### MCP- en Plugin-tools binnen sandbox-toolbeleid

Geconfigureerde MCP-servers worden aangeboden als Plugin-eigen tools onder de Plugin-id `bundle-mcp`. Normale toolprofielen kunnen ze toestaan, maar `tools.sandbox.tools` is een extra poort voor sandboxsessies. Als de sandboxmodus `"all"` of `"non-main"` is, neem dan een van deze items op in de sandbox-tool-allowlist wanneer MCP-/Plugin-tools zichtbaar moeten zijn:

- `bundle-mcp` voor door OpenClaw beheerde MCP-servers uit `mcp.servers`
- de Plugin-id voor een specifieke native Plugin
- `group:plugins` voor alle geladen Plugin-eigen tools
- exacte MCP-servertoolnamen of serverglobs zoals `outlook__send_mail` of `outlook__*` wanneer je slechts één server wilt

Serverglobs gebruiken het providerveilige MCP-servervoorvoegsel, niet noodzakelijk de ruwe sleutel `mcp.servers`. Niet-`[A-Za-z0-9_-]`-tekens worden `-`, namen die niet met een letter beginnen krijgen een `mcp-`-voorvoegsel, en lange of dubbele voorvoegsels kunnen worden afgekapt of van een suffix voorzien; bijvoorbeeld, `mcp.servers["Outlook Graph"]` gebruikt een glob zoals `outlook-graph__*`.

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

Zonder dat item op sandboxlaag kan de MCP-server nog steeds succesvol laden, terwijl de tools vóór de providerrequest worden gefilterd. Gebruik `openclaw doctor` om deze vorm op te vangen voor door OpenClaw beheerde servers in `mcp.servers`. MCP-servers die worden geladen vanuit gebundelde Plugin-manifesten of Claude `.mcp.json` gebruiken dezelfde sandboxpoort, maar deze diagnose somt die bronnen nog niet op; gebruik dezelfde allowlist-items als hun tools verdwijnen in sandboxed beurten.

### `tools.codeMode`

`tools.codeMode` schakelt het generieke code-modusoppervlak van OpenClaw in. Wanneer dit
is ingeschakeld voor een run met tools, ziet het model alleen `exec` en `wait`; normale OpenClaw-
tools worden verplaatst achter de in-sandbox `tools.*`-catalogusbridge, en MCP-tools zijn
beschikbaar via de gegenereerde `MCP`-namespace.

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

MCP-declaraties worden in code-modus aangeboden via het alleen-lezen virtuele API-bestandsoppervlak.
Gastcode kan `API.list("mcp")` en
`API.read("mcp/<server>.d.ts")` aanroepen om TypeScript-achtige signatures te inspecteren voordat
`MCP.<server>.<tool>()` wordt aangeroepen. Zie [Code-modus](/nl/reference/code-mode) voor het
runtimecontract, de limieten en de debuggingstappen.

### `tools.allow` / `tools.deny`

Globaal beleid voor toestaan/weigeren van tools (weigeren wint). Niet hoofdlettergevoelig, ondersteunt `*`-wildcards. Wordt toegepast zelfs wanneer Docker-sandbox uit staat.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` en `apply_patch` zijn afzonderlijke tool-id's. `allow: ["write"]` schakelt ook `apply_patch` in voor compatibele modellen, maar `deny: ["write"]` weigert `apply_patch` niet. Om alle bestandsmutatie te blokkeren, weiger `group:fs` of vermeld elke muterende tool expliciet:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

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

Beperkt tools voor een specifieke requester-identiteit. Dit is defense-in-depth bovenop channel-toegangscontrole; sender-waarden moeten uit de channeladapter komen, niet uit berichttekst.

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

Sleutels gebruiken expliciete voorvoegsels: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` of `"*"`. Channel-id's zijn canonieke OpenClaw-id's; aliassen zoals `teams` worden genormaliseerd naar `msteams`. Legacy sleutels zonder voorvoegsel worden alleen als `id:` geaccepteerd. De matchvolgorde is channel+id, id, e164, username, name en daarna wildcard.

Per-agent `agents.list[].tools.toolsBySender` overschrijft de globale sender-match wanneer die matcht, zelfs met een leeg `{}`-beleid.

### `tools.elevated`

Regelt verhoogde exec-toegang buiten de sandbox:

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

- Per-agent override (`agents.list[].tools.elevated`) kan alleen verder beperken.
- `/elevated on|off|ask|full` slaat status per sessie op; inline directives gelden voor één bericht.
- Verhoogde `exec` omzeilt sandboxing en gebruikt het geconfigureerde ontsnappingspad (`gateway` standaard, of `node` wanneer het exec-doel `node` is).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Veiligheidscontroles voor tool-loops zijn **standaard uitgeschakeld**. Stel `enabled: true` in om detectie te activeren. Instellingen kunnen globaal worden gedefinieerd in `tools.loopDetection` en per agent worden overschreven op `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Maximale tool-call-geschiedenis die wordt bewaard voor loopanalyse.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Drempel voor herhalend patroon zonder voortgang voor waarschuwingen.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Hogere herhalingsdrempel voor het blokkeren van kritieke loops.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Harde stopdrempel voor elke run zonder voortgang.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Waarschuw bij herhaalde aanroepen met dezelfde tool/dezelfde args.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Waarschuw/blokkeer bij bekende polltools (`process.poll`, `command_status`, enz.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Waarschuw/blokkeer bij afwisselende paarpatronen zonder voortgang.
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
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

Configureert begrip van inkomende media (afbeelding/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // verouderd: voltooiingen blijven via de agent verlopen
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

<AccordionGroup>
  <Accordion title="Velden voor mediamodelvermeldingen">
    **Providervermelding** (`type: "provider"` of weggelaten):

    - `provider`: API-provider-id (`openai`, `anthropic`, `google`/`gemini`, `groq`, enz.)
    - `model`: overschrijving van model-id
    - `profile` / `preferredProfile`: profielselectie uit `auth-profiles.json`

    **CLI-vermelding** (`type: "cli"`):

    - `command`: uit te voeren uitvoerbaar bestand
    - `args`: args met sjablonen (ondersteunt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, enz.; `openclaw doctor --fix` migreert verouderde `{input}`-placeholders naar `{{MediaPath}}`)

    **Algemene velden:**

    - `capabilities`: optionele lijst (`image`, `audio`, `video`). Standaarden: `openai`/`anthropic`/`minimax` → afbeelding, `google` → afbeelding+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overschrijvingen per vermelding.
    - `tools.media.image.timeoutSeconds` en overeenkomende afbeeldingsmodelvermeldingen voor `timeoutSeconds` gelden ook wanneer de agent de expliciete `image`-tool aanroept. Voor beeldbegrip geldt deze time-out voor het verzoek zelf en wordt deze niet verminderd door eerder voorbereidingswerk.
    - Mislukkingen vallen terug op de volgende vermelding.

    Provider-authenticatie volgt de standaardvolgorde: `auth-profiles.json` → env-vars → `models.providers.*.apiKey`.

    **Velden voor asynchrone voltooiing:**

    - `asyncCompletion.directSend`: verouderde compatibiliteitsvlag. Voltooide asynchrone mediataken blijven via de aanvraagsessie verlopen, zodat de agent het resultaat ontvangt, beslist hoe de gebruiker wordt geïnformeerd en de berichtentool gebruikt wanneer levering via de bron dit vereist.

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

Bepaalt welke sessies kunnen worden gericht door de sessietools (`sessions_list`, `sessions_history`, `sessions_send`).

Standaard: `tree` (huidige sessie + sessies die hierdoor zijn gestart, zoals subagents).

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
  <Accordion title="Zichtbaarheidsbereiken">
    - `self`: alleen de huidige sessiesleutel.
    - `tree`: huidige sessie + sessies die door de huidige sessie zijn gestart (subagents).
    - `agent`: elke sessie die bij de huidige agent-id hoort (kan andere gebruikers omvatten als u sessies per afzender onder dezelfde agent-id uitvoert).
    - `all`: elke sessie. Richten op andere agents vereist nog steeds `tools.agentToAgent`.
    - Sandbox-klem: wanneer de huidige sessie in een sandbox draait en `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, wordt zichtbaarheid gedwongen naar `tree`, zelfs als `tools.sessions.visibility="all"`.
    - Wanneer dit niet `all` is, bevat `sessions_list` een compact veld `visibility`
      dat de effectieve modus beschrijft en waarschuwt dat sommige sessies
      buiten het huidige bereik kunnen zijn weggelaten.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Bepaalt ondersteuning voor inline bijlagen voor `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: stel in op true om inline bestandsbijlagen toe te staan
        maxTotalBytes: 5242880, // totaal 5 MB over alle bestanden
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per bestand
        retainOnSessionKeep: false, // behoud bijlagen wanneer cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Opmerkingen over bijlagen">
    - Bijlagen vereisen `enabled: true`.
    - Subagent-bijlagen worden gematerialiseerd in de child-werkruimte op `.openclaw/attachments/<uuid>/` met een `.manifest.json`.
    - ACP-bijlagen zijn alleen afbeeldingen en worden inline doorgestuurd naar de ACP-runtime nadat dezelfde limieten voor aantal bestanden, bytes per bestand en totaal aantal bytes zijn gehaald.
    - Inhoud van bijlagen wordt automatisch geredigeerd uit transcriptpersistentie.
    - Base64-invoer wordt gevalideerd met strikte alfabet-/paddingcontroles en een groottecontrole vóór decodering.
    - Bestandsrechten voor subagent-bijlagen zijn `0700` voor mappen en `0600` voor bestanden.
    - Opschonen van subagents volgt het `cleanup`-beleid: `delete` verwijdert bijlagen altijd; `keep` behoudt ze alleen wanneer `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentele ingebouwde toolvlaggen. Standaard uit, tenzij een strikte agentic GPT-5-regel voor automatisch inschakelen van toepassing is.

```json5
{
  tools: {
    experimental: {
      planTool: true, // schakel experimentele update_plan in
    },
  },
}
```

- `planTool`: schakelt de gestructureerde `update_plan`-tool in voor het volgen van niet-triviaal werk met meerdere stappen.
- Standaard: `false`, tenzij `agents.defaults.embeddedAgent.executionContract` (of een overschrijving per agent) is ingesteld op `"strict-agentic"` voor een OpenAI- of OpenAI Codex-run uit de GPT-5-familie. Stel in op `true` om de tool buiten dat bereik af te dwingen, of op `false` om deze zelfs voor strikte agentic GPT-5-runs uitgeschakeld te houden.
- Wanneer ingeschakeld, voegt de systeemprompt ook gebruiksrichtlijnen toe zodat het model deze alleen voor substantieel werk gebruikt en maximaal één stap op `in_progress` houdt.

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

- `model`: standaardmodel voor gestarte subagents. Indien weggelaten, erven subagents het model van de aanroeper.
- `allowAgents`: standaard-allowlist van geconfigureerde doelagent-id's voor `sessions_spawn` wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt (`["*"]` = elk geconfigureerd doel; standaard: alleen dezelfde agent). Verouderde vermeldingen waarvan de agentconfiguratie is verwijderd, worden door `sessions_spawn` afgewezen en uit `agents_list` weggelaten; voer `openclaw doctor --fix` uit om ze op te ruimen.
- `runTimeoutSeconds`: standaardtime-out (seconden) voor `sessions_spawn`. `0` betekent geen time-out.
- `announceTimeoutMs`: time-out per aanroep (milliseconden) voor Gateway-pogingen tot levering van `agent`-aankondigingen. Standaard: `120000`. Tijdelijke nieuwe pogingen kunnen de totale wachttijd voor de aankondiging langer maken dan één geconfigureerde time-out.
- Toolbeleid per subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Aangepaste providers en basis-URL's

Provider-Plugins publiceren hun eigen rijen in de modelcatalogus. Voeg aangepaste providers toe via `models.providers` in de configuratie of `~/.openclaw/agents/<agentId>/agent/models.json`.

Het configureren van een aangepaste/lokale provider-`baseUrl` is ook de nauwe netwerkvertrouwensbeslissing voor HTTP-modelverzoeken: OpenClaw staat die exacte oorsprong `scheme://host:port` toe via het bewaakte fetch-pad, zonder een afzonderlijke configuratieoptie toe te voegen of andere privé-origins te vertrouwen.

```json5
{
  models: {
    mode: "merge", // merge (standaard) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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
  <Accordion title="Authenticatie en merge-volgorde">
    - Gebruik `authHeader: true` + `headers` voor aangepaste authenticatiebehoeften.
    - Overschrijf de root van de agentconfiguratie met `OPENCLAW_AGENT_DIR`.
    - Merge-volgorde voor overeenkomende provider-ID's:
      - Niet-lege agentwaarden voor `models.json` `baseUrl` winnen.
      - Niet-lege agentwaarden voor `apiKey` winnen alleen wanneer die provider niet door SecretRef wordt beheerd in de huidige configuratie-/auth-profielcontext.
      - Door SecretRef beheerde providerwaarden voor `apiKey` worden vernieuwd vanuit bronmarkeringen (`ENV_VAR_NAME` voor env-refs, `secretref-managed` voor bestands-/exec-refs) in plaats van opgeloste geheimen persistent op te slaan.
      - Door SecretRef beheerde providerheaderwaarden worden vernieuwd vanuit bronmarkeringen (`secretref-env:ENV_VAR_NAME` voor env-refs, `secretref-managed` voor bestands-/exec-refs).
      - Lege of ontbrekende agentwaarden voor `apiKey`/`baseUrl` vallen terug op `models.providers` in de configuratie.
      - Overeenkomende modelwaarden voor `contextWindow`/`maxTokens` gebruiken de hogere waarde tussen expliciete configuratie en impliciete cataloguswaarden.
      - Overeenkomende modelwaarden voor `contextTokens` behouden een expliciete runtime-limiet wanneer aanwezig; gebruik dit om de effectieve context te beperken zonder native modelmetadata te wijzigen.
      - Catalogi van provider-Plugins worden opgeslagen als gegenereerde Plugin-eigen catalogusshards onder de Plugin-status van de agent.
      - Gebruik `models.mode: "replace"` wanneer u wilt dat de configuratie `models.json` en actieve Plugin-catalogusshards volledig herschrijft.
      - Markerpersistentie is brongezaghebbend: markers worden geschreven vanuit de actieve bronconfiguratiesnapshot (vóór oplossing), niet vanuit opgeloste runtime-geheimwaarden.

  </Accordion>
</AccordionGroup>

### Details van providervelden

<AccordionGroup>
  <Accordion title="Catalogus op topniveau">
    - `models.mode`: gedrag van providercatalogus (`merge` of `replace`).
    - `models.providers`: aangepaste providermap met provider-id als sleutel.
      - Veilige bewerkingen: gebruik `openclaw config set models.providers.<id> '<json>' --strict-json --merge` of `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` voor additieve updates. `config set` weigert destructieve vervangingen tenzij u `--replace` doorgeeft.

  </Accordion>
  <Accordion title="Providerverbinding en authenticatie">
    - `models.providers.*.api`: verzoekadapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, enzovoort). Gebruik voor zelf gehoste `/v1/chat/completions`-backends zoals MLX, vLLM, SGLang en de meeste OpenAI-compatibele lokale servers `openai-completions`. Een aangepaste provider met `baseUrl` maar zonder `api` gebruikt standaard `openai-completions`; stel `openai-responses` alleen in wanneer de backend `/v1/responses` ondersteunt.
    - `models.providers.*.apiKey`: providerreferentie (bij voorkeur SecretRef/env-vervanging).
    - `models.providers.*.auth`: authenticatiestrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standaard native contextvenster voor modellen onder deze provider wanneer de modelvermelding geen `contextWindow` instelt.
    - `models.providers.*.contextTokens`: standaard effectieve runtime-contextlimiet voor modellen onder deze provider wanneer de modelvermelding geen `contextTokens` instelt.
    - `models.providers.*.maxTokens`: standaard limiet voor outputtokens voor modellen onder deze provider wanneer de modelvermelding geen `maxTokens` instelt.
    - `models.providers.*.timeoutSeconds`: optionele HTTP-verzoektime-out per provider-model in seconden, inclusief verbinding, headers, body en afhandeling van het afbreken van het totale verzoek.
    - `models.providers.*.injectNumCtxForOpenAICompat`: injecteer voor Ollama + `openai-completions` `options.num_ctx` in verzoeken (standaard: `true`).
    - `models.providers.*.authHeader`: forceer referentietransport in de `Authorization`-header wanneer vereist.
    - `models.providers.*.baseUrl`: basis-URL van de upstream-API.
    - `models.providers.*.headers`: extra statische headers voor proxy-/tenantroutering.

  </Accordion>
  <Accordion title="Overschrijvingen voor verzoektransport">
    `models.providers.*.request`: transportoverschrijvingen voor HTTP-verzoeken naar modelproviders.

    - `request.headers`: extra headers (samengevoegd met providerstandaarden). Waarden accepteren SecretRef.
    - `request.auth`: overschrijving van de authenticatiestrategie. Modi: `"provider-default"` (gebruik de ingebouwde authenticatie van de provider), `"authorization-bearer"` (met `token`), `"header"` (met `headerName`, `value`, optioneel `prefix`).
    - `request.proxy`: overschrijving voor HTTP-proxy. Modi: `"env-proxy"` (gebruik `HTTP_PROXY`/`HTTPS_PROXY`-env-vars), `"explicit-proxy"` (met `url`). Beide modi accepteren een optioneel `tls`-subobject.
    - `request.tls`: TLS-overschrijving voor directe verbindingen. Velden: `ca`, `cert`, `key`, `passphrase` (allemaal accepteren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: sta, wanneer `true`, HTTP-verzoeken naar modelproviders toe naar private, CGNAT- of vergelijkbare reeksen via de HTTP-fetchguard van de provider. Aangepaste/lokale providerbasis-URL's vertrouwen de exact geconfigureerde oorsprong al, behalve metadata-/link-local-oorsprongen, die geblokkeerd blijven zonder expliciete opt-in. Stel dit in op `false` om exact-origin-vertrouwen uit te schakelen. WebSocket gebruikt dezelfde `request` voor headers/TLS, maar niet die fetch-SSRF-poort. Standaard `false`.

  </Accordion>
  <Accordion title="Modelcatalogusvermeldingen">
    - `models.providers.*.models`: expliciete modelcatalogusvermeldingen van de provider.
    - `models.providers.*.models.*.input`: invoermodaliteiten van het model. Gebruik `["text"]` voor modellen met alleen tekst en `["text", "image"]` voor native image-/vision-modellen. Afbeeldingsbijlagen worden alleen in agentbeurten geïnjecteerd wanneer het geselecteerde model als image-capable is gemarkeerd.
    - `models.providers.*.models.*.contextWindow`: metadata van het native modelcontextvenster. Dit overschrijft `contextWindow` op providerniveau voor dat model.
    - `models.providers.*.models.*.contextTokens`: optionele runtime-contextlimiet. Dit overschrijft `contextTokens` op providerniveau; gebruik dit wanneer je een kleiner effectief contextbudget wilt dan het native `contextWindow` van het model; `openclaw models list` toont beide waarden wanneer ze verschillen.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionele compatibiliteitshint. Voor `api: "openai-completions"` met een niet-lege niet-native `baseUrl` (host niet `api.openai.com`) forceert OpenClaw dit tijdens runtime naar `false`. Een lege/weggelaten `baseUrl` behoudt standaard OpenAI-gedrag.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionele compatibiliteitshint voor string-only OpenAI-compatibele chat-eindpunten. Wanneer `true`, vlakt OpenClaw zuivere tekstarrays in `messages[].content` af naar gewone strings voordat het verzoek wordt verzonden.
    - `models.providers.*.models.*.compat.strictMessageKeys`: optionele compatibiliteitshint voor strikte OpenAI-compatibele chat-eindpunten. Wanneer `true`, beperkt OpenClaw uitgaande Chat Completions-berichtobjecten tot `role` en `content` voordat het verzoek wordt verzonden.
    - `models.providers.*.models.*.compat.thinkingFormat`: optionele hint voor thinking-payload. Gebruik `"together"` voor Together-stijl `reasoning.enabled`, `"qwen"` voor top-level `enable_thinking`, of `"qwen-chat-template"` voor `chat_template_kwargs.enable_thinking` op Qwen-familie OpenAI-compatibele servers die chat-template-kwargs op verzoekniveau ondersteunen, zoals vLLM. Geconfigureerde vLLM Qwen-modellen tonen binaire `/think`-keuzes (`off`, `on`) voor deze formats.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: optionele compatibiliteitshint voor DeepSeek-stijl Chat Completions-backends die vereisen dat eerdere assistant-berichten `reasoning_content` behouden bij opnieuw afspelen. Wanneer `true`, behoudt OpenClaw dat veld op uitgaande assistant-berichten. Gebruik dit wanneer je een aangepaste DeepSeek-compatibele proxy aansluit die verzoeken weigert nadat reasoning is verwijderd. Standaard `false`.

  </Accordion>
  <Accordion title="Amazon Bedrock-detectie">
    - `plugins.entries.amazon-bedrock.config.discovery`: root voor Bedrock-instellingen voor automatische detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: schakel impliciete detectie in/uit.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-regio voor detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optioneel provider-id-filter voor gerichte detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: pollinginterval voor detectieverversing.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: terugvalcontextvenster voor ontdekte modellen.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: terugvallimiet voor maximale outputtokens voor ontdekte modellen.

  </Accordion>
</AccordionGroup>

Interactieve onboarding voor aangepaste providers leidt afbeeldingsinvoer af voor gangbare vision-model-ID's zoals GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V en GLM-4V, en slaat de extra vraag over voor bekende families met alleen tekst. Onbekende model-ID's vragen nog steeds om afbeeldingsondersteuning. Niet-interactieve onboarding gebruikt dezelfde inferentie; geef `--custom-image-input` mee om image-capable metadata af te dwingen of `--custom-text-input` om metadata voor alleen tekst af te dwingen.

### Providervoorbeelden

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    De officiële externe `cerebras`-providerplugin kan dit configureren via `openclaw onboard --auth-choice cerebras-api-key`. Gebruik expliciete providerconfiguratie alleen wanneer je standaarden overschrijft.

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

    Gebruik `cerebras/zai-glm-4.7` voor Cerebras; `zai/glm-4.7` voor Z.AI direct.

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
    Zie [Lokale modellen](/nl/gateway/local-models). Kort samengevat: draai een groot lokaal model via de LM Studio Responses API op serieuze hardware; houd gehoste modellen samengevoegd als terugval.
  </Accordion>
  <Accordion title="MiniMax M3 (direct)">
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

    Stel `MINIMAX_API_KEY` in. Snelkoppelingen: `openclaw onboard --auth-choice minimax-global-api` of `openclaw onboard --auth-choice minimax-cn-api`. De modelcatalogus gebruikt standaard M3 en bevat ook de M2.7-varianten. Op het Anthropic-compatibele streamingpad schakelt OpenClaw MiniMax M2.x-thinking standaard uit, tenzij je `thinking` expliciet zelf instelt; MiniMax-M3 (en M3.x) blijft standaard op het weggelaten/adaptieve thinkingpad van de provider. `/fast on` of `params.fastMode: true` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.

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

    Voor het China-eindpunt: `baseUrl: "https://api.moonshot.cn/v1"` of `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Native Moonshot-eindpunten adverteren compatibiliteit voor streaminggebruik op het gedeelde `openai-completions`-transport, en OpenClaw baseert dat op eindpuntmogelijkheden in plaats van alleen op de ingebouwde provider-id.

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

    Stel `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`) in. Gebruik `opencode/...`-refs voor de Zen-catalogus of `opencode-go/...`-refs voor de Go-catalogus. Snelkoppeling: `openclaw onboard --auth-choice opencode-zen` of `openclaw onboard --auth-choice opencode-go`.

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

    De basis-URL moet `/v1` weglaten (de Anthropic-client voegt deze toe). Snelkoppeling: `openclaw onboard --auth-choice synthetic-api-key`.

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

    - Algemeen endpoint: `https://api.z.ai/api/paas/v4`
    - Coding-endpoint (standaard): `https://api.z.ai/api/coding/paas/v4`
    - Definieer voor het algemene endpoint een aangepaste provider met de overschrijving voor de basis-URL.

  </Accordion>
</AccordionGroup>

---

## Gerelateerd

- [Configuratie — agents](/nl/gateway/config-agents)
- [Configuratie — channels](/nl/gateway/config-channels)
- [Configuratiereferentie](/nl/gateway/configuration-reference) — andere sleutels op het hoogste niveau
- [Tools en plugins](/nl/tools)
