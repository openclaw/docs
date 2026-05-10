---
read_when:
    - Beleid voor `tools.*`, toelatingslijsten of experimentele functies configureren
    - Aangepaste providers registreren of basis-URL's overschrijven
    - OpenAI-compatibele zelfgehoste eindpunten instellen
sidebarTitle: Tools and custom providers
summary: Configuratie van hulpmiddelen (beleid, experimentele schakelaars, door aanbieders ondersteunde hulpmiddelen) en aangepaste aanbieder-/basis-URL-configuratie
title: Configuratie — hulpmiddelen en aangepaste aanbieders
x-i18n:
    generated_at: "2026-05-10T19:35:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c02dad1d895afe90baf99487b37d29968ebd944890075511e1cb057776b29ec6
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-configuratiesleutels en aangepaste provider- / base-URL-configuratie. Voor agents, kanalen en andere configuratiesleutels op topniveau, zie [Configuratiereferentie](/nl/gateway/configuration-reference).

## Tools

### Toolprofielen

`tools.profile` stelt een basis-allowlist in vóór `tools.allow`/`tools.deny`:

<Note>
Lokale onboarding stelt nieuwe lokale configuraties standaard in op `tools.profile: "coding"` wanneer dit niet is ingesteld (bestaande expliciete profielen blijven behouden).
</Note>

| Profiel     | Omvat                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Alleen `session_status`                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Geen beperking (zelfde als niet ingesteld)                                                                                      |

### Toolgroepen

| Groep              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wordt geaccepteerd als alias voor `exec`)                                  |
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
| `group:openclaw`   | Alle ingebouwde tools (exclusief providerplugins)                                                                       |

### `tools.allow` / `tools.deny`

Globaal allow/deny-beleid voor tools (deny wint). Hoofdletterongevoelig, ondersteunt `*`-jokertekens. Wordt toegepast zelfs wanneer de Docker-sandbox uitstaat.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` en `apply_patch` zijn afzonderlijke tool-id's. `allow: ["write"]` schakelt ook `apply_patch` in voor compatibele modellen, maar `deny: ["write"]` weigert `apply_patch` niet. Om alle bestandsmutaties te blokkeren, weiger `group:fs` of vermeld elke muterende tool expliciet:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Beperk tools verder voor specifieke providers of modellen. Volgorde: basisprofiel → providerprofiel → allow/deny.

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

- Override per agent (`agents.list[].tools.elevated`) kan alleen verder beperken.
- `/elevated on|off|ask|full` bewaart de status per sessie; inline-instructies gelden voor één bericht.
- Verhoogde `exec` omzeilt sandboxing en gebruikt het geconfigureerde ontsnappingspad (standaard `gateway`, of `node` wanneer het exec-doel `node` is).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Veiligheidscontroles voor tool-lussen zijn **standaard uitgeschakeld**. Stel `enabled: true` in om detectie te activeren. Instellingen kunnen globaal worden gedefinieerd in `tools.loopDetection` en per agent worden overschreven via `agents.list[].tools.loopDetection`.

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
  Maximale geschiedenis van tool-calls die wordt bewaard voor lusanalyse.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Drempel voor herhalende patronen zonder voortgang voor waarschuwingen.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Hogere herhalingsdrempel voor het blokkeren van kritieke lussen.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Harde stopdrempel voor elke run zonder voortgang.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Waarschuw bij herhaalde calls met dezelfde tool/dezelfde argumenten.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Waarschuw/blokkeer bij bekende poll-tools (`process.poll`, `command_status`, enz.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Waarschuw/blokkeer bij afwisselende parenpatronen zonder voortgang.
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

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Provider-vermelding** (`type: "provider"` of weggelaten):

    - `provider`: API-provider-id (`openai`, `anthropic`, `google`/`gemini`, `groq`, enz.)
    - `model`: overschrijving van model-id
    - `profile` / `preferredProfile`: profielselectie voor `auth-profiles.json`

    **CLI-vermelding** (`type: "cli"`):

    - `command`: uitvoerbaar bestand om uit te voeren
    - `args`: getemplatiseerde argumenten (ondersteunt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, enz.; `openclaw doctor --fix` migreert verouderde `{input}`-placeholders naar `{{MediaPath}}`)

    **Algemene velden:**

    - `capabilities`: optionele lijst (`image`, `audio`, `video`). Standaardwaarden: `openai`/`anthropic`/`minimax` → afbeelding, `google` → afbeelding+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overschrijvingen per vermelding.
    - `tools.media.image.timeoutSeconds` en overeenkomende `timeoutSeconds`-vermeldingen voor afbeeldingsmodellen zijn ook van toepassing wanneer de agent de expliciete `image`-tool aanroept.
    - Fouten vallen terug op de volgende vermelding.

    Provider-authenticatie volgt de standaardvolgorde: `auth-profiles.json` → env-vars → `models.providers.*.apiKey`.

    **Velden voor asynchrone voltooiing:**

    - `asyncCompletion.directSend`: verouderde compatibiliteitsvlag. Voltooide asynchrone mediataken blijven via de aanvragersessie lopen, zodat de agent het resultaat ontvangt, beslist hoe de gebruiker wordt geïnformeerd en de berichttool gebruikt wanneer levering via de bron dat vereist.

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

Bepaalt welke sessies kunnen worden benaderd door de sessietools (`sessions_list`, `sessions_history`, `sessions_send`).

Standaard: `tree` (huidige sessie + sessies die hierdoor zijn gestart, zoals subagenten).

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
    - `tree`: huidige sessie + sessies die door de huidige sessie zijn gestart (subagenten).
    - `agent`: elke sessie die bij de huidige agent-id hoort (kan andere gebruikers omvatten als je sessies per afzender uitvoert onder dezelfde agent-id).
    - `all`: elke sessie. Targeting over meerdere agenten heen vereist nog steeds `tools.agentToAgent`.
    - Sandbox-afklemming: wanneer de huidige sessie gesandboxed is en `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, wordt zichtbaarheid geforceerd naar `tree`, zelfs als `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Regelt ondersteuning voor inline bijlagen voor `sessions_spawn`.

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
  <Accordion title="Opmerkingen bij bijlagen">
    - Bijlagen worden alleen ondersteund voor `runtime: "subagent"`. De ACP-runtime weigert ze.
    - Bestanden worden in de child-werkruimte geplaatst op `.openclaw/attachments/<uuid>/` met een `.manifest.json`.
    - Inhoud van bijlagen wordt automatisch geredigeerd uit transcriptpersistentie.
    - Base64-invoer wordt gevalideerd met strikte controles op alfabet/padding en een groottecontrole vóór decodering.
    - Bestandsrechten zijn `0700` voor mappen en `0600` voor bestanden.
    - Opschonen volgt het `cleanup`-beleid: `delete` verwijdert bijlagen altijd; `keep` bewaart ze alleen wanneer `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentele ingebouwde toolvlaggen. Standaard uit, tenzij een strict-agentic GPT-5-regel voor automatisch inschakelen van toepassing is.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: schakelt de gestructureerde `update_plan`-tool in voor niet-triviale meerstapswerktracking.
- Standaard: `false`, tenzij `agents.defaults.embeddedPi.executionContract` (of een override per agent) is ingesteld op `"strict-agentic"` voor een OpenAI- of OpenAI Codex GPT-5-familierun. Stel in op `true` om de tool buiten dat bereik geforceerd in te schakelen, of op `false` om hem uitgeschakeld te houden, zelfs voor strict-agentic GPT-5-runs.
- Wanneer ingeschakeld, voegt de systeemprompt ook gebruiksrichtlijnen toe, zodat het model de tool alleen gebruikt voor substantieel werk en maximaal één stap `in_progress` houdt.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: standaardmodel voor aangemaakte subagents. Indien weggelaten, erven subagents het model van de aanroeper.
- `allowAgents`: standaard allowlist van doelagent-id's voor `sessions_spawn` wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt (`["*"]` = elke; standaard: alleen dezelfde agent).
- `runTimeoutSeconds`: standaardtime-out (seconden) voor `sessions_spawn` wanneer de toolaanroep `runTimeoutSeconds` weglaat. `0` betekent geen time-out.
- Toolbeleid per subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Aangepaste providers en basis-URL's

OpenClaw gebruikt de ingebouwde modelcatalogus. Voeg aangepaste providers toe via `models.providers` in configuratie of `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
  <Accordion title="Authenticatie en samenvoegprioriteit">
    - Gebruik `authHeader: true` + `headers` voor aangepaste authenticatiebehoeften.
    - Overschrijf de root van de agentconfiguratie met `OPENCLAW_AGENT_DIR` (of `PI_CODING_AGENT_DIR`, een alias voor een legacy-omgevingsvariabele).
    - Samenvoegprioriteit voor overeenkomende provider-id's:
      - Niet-lege agentwaarden voor `models.json` `baseUrl` winnen.
      - Niet-lege agentwaarden voor `apiKey` winnen alleen wanneer die provider niet door SecretRef wordt beheerd in de huidige configuratie-/auth-profielcontext.
      - Door SecretRef beheerde providerwaarden voor `apiKey` worden vernieuwd vanuit bronmarkeringen (`ENV_VAR_NAME` voor env-verwijzingen, `secretref-managed` voor bestand-/exec-verwijzingen) in plaats van opgeloste geheimen persistent op te slaan.
      - Door SecretRef beheerde providerheaderwaarden worden vernieuwd vanuit bronmarkeringen (`secretref-env:ENV_VAR_NAME` voor env-verwijzingen, `secretref-managed` voor bestand-/exec-verwijzingen).
      - Lege of ontbrekende agentwaarden voor `apiKey`/`baseUrl` vallen terug op `models.providers` in de configuratie.
      - Overeenkomende modelwaarden voor `contextWindow`/`maxTokens` gebruiken de hogere waarde van expliciete configuratie en impliciete cataloguswaarden.
      - Overeenkomende modelwaarden voor `contextTokens` behouden een expliciete runtime-limiet wanneer aanwezig; gebruik dit om effectieve context te beperken zonder native modelmetadata te wijzigen.
      - Gebruik `models.mode: "replace"` wanneer je wilt dat configuratie `models.json` volledig herschrijft.
      - Markerpersistentie is bron-autoritatief: markers worden geschreven vanuit de actieve bronconfiguratiesnapshot (vóór oplossing), niet vanuit opgeloste runtime-geheimwaarden.

  </Accordion>
</AccordionGroup>

### Details van providervelden

<AccordionGroup>
  <Accordion title="Catalogus op topniveau">
    - `models.mode`: gedrag van providercatalogus (`merge` of `replace`).
    - `models.providers`: aangepaste providermap, geïndexeerd op provider-id.
      - Veilige bewerkingen: gebruik `openclaw config set models.providers.<id> '<json>' --strict-json --merge` of `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` voor additieve updates. `config set` weigert destructieve vervangingen tenzij je `--replace` meegeeft.

  </Accordion>
  <Accordion title="Providerverbinding en authenticatie">
    - `models.providers.*.api`: requestadapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, enz.). Voor zelfgehoste `/v1/chat/completions`-backends zoals MLX, vLLM, SGLang en de meeste OpenAI-compatibele lokale servers gebruik je `openai-completions`. Een aangepaste provider met `baseUrl` maar zonder `api` gebruikt standaard `openai-completions`; stel `openai-responses` alleen in wanneer de backend `/v1/responses` ondersteunt.
    - `models.providers.*.apiKey`: providerreferentie (bij voorkeur SecretRef/env-substitutie).
    - `models.providers.*.auth`: authenticatiestrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standaard native contextvenster voor modellen onder deze provider wanneer de modelvermelding `contextWindow` niet instelt.
    - `models.providers.*.contextTokens`: standaard effectieve runtime-contextlimiet voor modellen onder deze provider wanneer de modelvermelding `contextTokens` niet instelt.
    - `models.providers.*.maxTokens`: standaardlimiet voor uitvoertokens voor modellen onder deze provider wanneer de modelvermelding `maxTokens` niet instelt.
    - `models.providers.*.timeoutSeconds`: optionele HTTP-requesttime-out per provider voor modellen in seconden, inclusief verbinding, headers, body en afhandeling van totale requestafbreking.
    - `models.providers.*.injectNumCtxForOpenAICompat`: injecteer voor Ollama + `openai-completions` `options.num_ctx` in requests (standaard: `true`).
    - `models.providers.*.authHeader`: forceer credentialtransport in de `Authorization`-header wanneer vereist.
    - `models.providers.*.baseUrl`: basis-URL van de upstream-API.
    - `models.providers.*.headers`: extra statische headers voor proxy-/tenantrouting.

  </Accordion>
  <Accordion title="Overrides voor requesttransport">
    `models.providers.*.request`: transportoverrides voor HTTP-requests naar modelproviders.

    - `request.headers`: extra headers (samengevoegd met providerstandaarden). Waarden accepteren SecretRef.
    - `request.auth`: override voor authenticatiestrategie. Modi: `"provider-default"` (gebruik de ingebouwde authenticatie van de provider), `"authorization-bearer"` (met `token`), `"header"` (met `headerName`, `value`, optionele `prefix`).
    - `request.proxy`: HTTP-proxy-override. Modi: `"env-proxy"` (gebruik `HTTP_PROXY`/`HTTPS_PROXY`-omgevingsvariabelen), `"explicit-proxy"` (met `url`). Beide modi accepteren een optioneel `tls`-subobject.
    - `request.tls`: TLS-override voor directe verbindingen. Velden: `ca`, `cert`, `key`, `passphrase` (allemaal accepteren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: wanneer `true`, sta HTTPS naar `baseUrl` toe wanneer DNS naar private, CGNAT- of vergelijkbare bereiken resolveert, via de HTTP-fetchguard van de provider (operator-opt-in voor vertrouwde zelfgehoste OpenAI-compatibele eindpunten). Loopback-modelproviderstream-URL's zoals `localhost`, `127.0.0.1` en `[::1]` worden automatisch toegestaan tenzij dit expliciet op `false` is ingesteld; LAN-, tailnet- en private DNS-hosts vereisen nog steeds opt-in. WebSocket gebruikt dezelfde `request` voor headers/TLS, maar niet die fetch-SSRF-gate. Standaard `false`.

  </Accordion>
  <Accordion title="Modelcatalogusvermeldingen">
    - `models.providers.*.models`: expliciete modelcatalogusvermeldingen van de provider.
    - `models.providers.*.models.*.input`: invoermodaliteiten van het model. Gebruik `["text"]` voor alleen-tekstmodellen en `["text", "image"]` voor native image-/vision-modellen. Afbeeldingsbijlagen worden alleen in agentbeurten geïnjecteerd wanneer het geselecteerde model als image-capable is gemarkeerd.
    - `models.providers.*.models.*.contextWindow`: metadata voor het native contextvenster van het model. Dit overschrijft `contextWindow` op providerniveau voor dat model.
    - `models.providers.*.models.*.contextTokens`: optionele runtime-contextlimiet. Dit overschrijft `contextTokens` op providerniveau; gebruik dit wanneer je een kleiner effectief contextbudget wilt dan het native `contextWindow` van het model; `openclaw models list` toont beide waarden wanneer ze verschillen.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionele compatibiliteitshint. Voor `api: "openai-completions"` met een niet-lege niet-native `baseUrl` (host niet `api.openai.com`) forceert OpenClaw dit tijdens runtime naar `false`. Een lege/weggelaten `baseUrl` behoudt standaard OpenAI-gedrag.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionele compatibiliteitshint voor OpenAI-compatibele chat-eindpunten die alleen strings ondersteunen. Wanneer `true`, vlakt OpenClaw pure-tekst `messages[].content`-arrays af naar platte strings voordat het request wordt verzonden.
    - `models.providers.*.models.*.compat.strictMessageKeys`: optionele compatibiliteitshint voor strikte OpenAI-compatibele chat-eindpunten. Wanneer `true`, stript OpenClaw uitgaande Chat Completions-berichtobjecten tot `role` en `content` voordat het request wordt verzonden.
    - `models.providers.*.models.*.compat.thinkingFormat`: optionele hint voor thinking-payload. Gebruik `"qwen"` voor topniveau `enable_thinking`, of `"qwen-chat-template"` voor `chat_template_kwargs.enable_thinking` op OpenAI-compatibele servers uit de Qwen-familie die chat-template-kwargs op requestniveau ondersteunen, zoals vLLM.

  </Accordion>
  <Accordion title="Amazon Bedrock-discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: root van instellingen voor Bedrock-autodiscovery.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: impliciete discovery aan/uit zetten.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-regio voor discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optioneel provider-id-filter voor gerichte discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: pollinginterval voor discovery-verversing.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallbackcontextvenster voor ontdekte modellen.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallbackmaximum voor uitvoertokens voor ontdekte modellen.

  </Accordion>
</AccordionGroup>

Interactieve onboarding voor aangepaste providers leidt image-invoer af voor gangbare vision-model-id's zoals GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V en GLM-4V, en slaat de extra vraag over voor bekende alleen-tekstfamilies. Onbekende model-id's vragen nog steeds om image-ondersteuning. Niet-interactieve onboarding gebruikt dezelfde afleiding; geef `--custom-image-input` mee om image-capable metadata te forceren of `--custom-text-input` om alleen-tekstmetadata te forceren.

### Providervoorbeelden

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    De gebundelde `cerebras`-provider-Plugin kan dit configureren via `openclaw onboard --auth-choice cerebras-api-key`. Gebruik expliciete providerconfiguratie alleen wanneer je standaardwaarden overschrijft.

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

    Gebruik `cerebras/zai-glm-4.7` voor Cerebras; `zai/glm-4.7` voor Z.AI rechtstreeks.

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
  <Accordion title="Local models (LM Studio)">
    Zie [Lokale modellen](/nl/gateway/local-models). TL;DR: voer een groot lokaal model uit via de LM Studio Responses API op serieuze hardware; houd gehoste modellen samengevoegd als fallback.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Stel `MINIMAX_API_KEY` in. Snelkoppelingen: `openclaw onboard --auth-choice minimax-global-api` of `openclaw onboard --auth-choice minimax-cn-api`. De modelcatalogus staat standaard alleen op M2.7. Op het Anthropic-compatibele streamingpad schakelt OpenClaw MiniMax-denken standaard uit, tenzij je `thinking` zelf expliciet instelt. `/fast on` of `params.fastMode: true` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.

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

    Native Moonshot-eindpunten adverteren compatibiliteit met streaminggebruik op het gedeelde `openai-completions`-transport, en OpenClaw baseert dat op eindpuntcapaciteiten in plaats van alleen op de ingebouwde provider-id.

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
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    Basis-URL moet `/v1` weglaten (de Anthropic-client voegt die toe). Snelkoppeling: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Stel `ZAI_API_KEY` in. `z.ai/*` en `z-ai/*` worden geaccepteerd als aliassen. Snelkoppeling: `openclaw onboard --auth-choice zai-api-key`.

    - Algemeen eindpunt: `https://api.z.ai/api/paas/v4`
    - Coding-eindpunt (standaard): `https://api.z.ai/api/coding/paas/v4`
    - Definieer voor het algemene eindpunt een aangepaste provider met de overschrijving van de basis-URL.

  </Accordion>
</AccordionGroup>

---

## Gerelateerd

- [Configuratie — agents](/nl/gateway/config-agents)
- [Configuratie — kanalen](/nl/gateway/config-channels)
- [Configuratiereferentie](/nl/gateway/configuration-reference) — andere sleutels op topniveau
- [Tools en plugins](/nl/tools)
