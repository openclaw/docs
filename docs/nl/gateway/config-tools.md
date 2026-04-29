---
read_when:
    - Configureren van `tools.*`-beleid, toelatingslijsten of experimentele functies
    - Aangepaste providers registreren of basis-URL's overschrijven
    - OpenAI-compatibele zelfgehoste eindpunten instellen
sidebarTitle: Tools and custom providers
summary: Toolconfiguratie (beleid, experimentele schakelaars, door providers ondersteunde tools) en aangepaste provider-/basis-URL-configuratie
title: Configuratie — hulpmiddelen en aangepaste providers
x-i18n:
    generated_at: "2026-04-29T22:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-configuratiesleutels en aangepaste provider- / base-URL-instelling. Zie voor agents, kanalen en andere configuratiesleutels op topniveau de [Configuratiereferentie](/nl/gateway/configuration-reference).

## Hulpmiddelen

### Hulpmiddelprofielen

`tools.profile` stelt een basis-toelatingslijst in vóór `tools.allow`/`tools.deny`:

<Note>
Lokale onboarding stelt nieuwe lokale configuraties standaard in op `tools.profile: "coding"` wanneer dit niet is ingesteld (bestaande expliciete profielen blijven behouden).
</Note>

| Profiel     | Bevat                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | alleen `session_status`                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Geen beperking (hetzelfde als niet ingesteld)                                                                                  |

### Hulpmiddelgroepen

| Groep              | Hulpmiddelen                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wordt geaccepteerd als alias voor `exec`)                                  |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                       |
| `group:openclaw`   | Alle ingebouwde hulpmiddelen (exclusief provider-Plugins)                                                               |

### `tools.allow` / `tools.deny`

Globaal toestaan/weigeren-beleid voor hulpmiddelen (weigeren wint). Niet hoofdlettergevoelig, ondersteunt `*`-wildcards. Wordt ook toegepast wanneer de Docker-sandbox uit staat.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Beperk hulpmiddelen verder voor specifieke providers of modellen. Volgorde: basisprofiel → providerprofiel → toestaan/weigeren.

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

- Override per agent (`agents.list[].tools.elevated`) kan alleen verder beperken.
- `/elevated on|off|ask|full` slaat de status per sessie op; inline instructies gelden voor één bericht.
- Verhoogde `exec` omzeilt sandboxing en gebruikt het geconfigureerde escape-pad (standaard `gateway`, of `node` wanneer het `exec`-doel `node` is).

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

Veiligheidscontroles voor hulpmiddellussen zijn **standaard uitgeschakeld**. Stel `enabled: true` in om detectie te activeren. Instellingen kunnen globaal worden gedefinieerd in `tools.loopDetection` en per agent worden overschreven op `agents.list[].tools.loopDetection`.

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
  Maximale bewaarde geschiedenis van hulpmiddelaanroepen voor lusanalyse.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Drempel voor waarschuwingen bij herhalend patroon zonder voortgang.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Hogere herhalingsdrempel voor het blokkeren van kritieke lussen.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Harde stopdrempel voor elke uitvoering zonder voortgang.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Waarschuw bij herhaalde aanroepen met hetzelfde hulpmiddel/dezelfde argumenten.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Waarschuw/blokkeer bij bekende pollinghulpmiddelen (`process.poll`, `command_status`, enz.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Waarschuw/blokkeer bij afwisselende paarsgewijze patronen zonder voortgang.
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
        directSend: false, // opt-in: send finished async music/video directly to the channel
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
    **Providervermelding** (`type: "provider"` of weggelaten):

    - `provider`: API-provider-id (`openai`, `anthropic`, `google`/`gemini`, `groq`, enz.)
    - `model`: overschrijving van model-id
    - `profile` / `preferredProfile`: profielselectie voor `auth-profiles.json`

    **CLI-vermelding** (`type: "cli"`):

    - `command`: uitvoerbaar bestand om uit te voeren
    - `args`: args met sjabloonwaarden (ondersteunt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, enz.; `openclaw doctor --fix` migreert verouderde `{input}`-placeholders naar `{{MediaPath}}`)

    **Algemene velden:**

    - `capabilities`: optionele lijst (`image`, `audio`, `video`). Standaardwaarden: `openai`/`anthropic`/`minimax` → afbeelding, `google` → afbeelding+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overschrijvingen per vermelding.
    - `tools.media.image.timeoutSeconds` en overeenkomende vermeldingen voor afbeeldingsmodellen met `timeoutSeconds` zijn ook van toepassing wanneer de agent de expliciete `image`-tool aanroept.
    - Fouten vallen terug op de volgende vermelding.

    Providerauthenticatie volgt de standaardvolgorde: `auth-profiles.json` → omgevingsvariabelen → `models.providers.*.apiKey`.

    **Velden voor asynchrone voltooiing:**

    - `asyncCompletion.directSend`: wanneer `true`, proberen voltooide asynchrone `music_generate`- en `video_generate`-taken eerst rechtstreekse levering aan het kanaal. Standaard: `false` (legacy pad voor requester-session wake/modellevering).

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

Bepaalt welke sessies door de sessietools kunnen worden getarget (`sessions_list`, `sessions_history`, `sessions_send`).

Standaard: `tree` (huidige sessie + sessies die daardoor zijn gestart, zoals subagenten).

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
    - `agent`: elke sessie die bij de huidige agent-id hoort (kan andere gebruikers omvatten als u sessies per afzender onder dezelfde agent-id uitvoert).
    - `all`: elke sessie. Targeting tussen agents vereist nog steeds `tools.agentToAgent`.
    - Sandbox-afklemming: wanneer de huidige sessie in een sandbox draait en `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, wordt zichtbaarheid geforceerd naar `tree`, zelfs als `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Bepaalt ondersteuning voor inline bijlagen voor `sessions_spawn`.

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
    - Bijlagen worden alleen ondersteund voor `runtime: "subagent"`. ACP-runtime weigert ze.
    - Bestanden worden in de onderliggende workspace gematerialiseerd op `.openclaw/attachments/<uuid>/` met een `.manifest.json`.
    - Inhoud van bijlagen wordt automatisch geredigeerd uit transcriptpersistentie.
    - Base64-invoer wordt gevalideerd met strikte controles op alfabet/padding en een groottebeveiliging vóór het decoderen.
    - Bestandsmachtigingen zijn `0700` voor mappen en `0600` voor bestanden.
    - Opschonen volgt het `cleanup`-beleid: `delete` verwijdert bijlagen altijd; `keep` behoudt ze alleen wanneer `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentele ingebouwde toolvlaggen. Standaard uit, tenzij een regel voor automatisch inschakelen van strict-agentic GPT-5 van toepassing is.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: schakelt de gestructureerde tool `update_plan` in voor het volgen van niet-triviaal werk met meerdere stappen.
- Standaard: `false`, tenzij `agents.defaults.embeddedPi.executionContract` (of een override per agent) is ingesteld op `"strict-agentic"` voor een OpenAI- of OpenAI Codex-run uit de GPT-5-familie. Stel in op `true` om de tool buiten dat bereik af te dwingen, of op `false` om deze uitgeschakeld te houden, zelfs voor strict-agentic GPT-5-runs.
- Wanneer ingeschakeld, voegt de systeemprompt ook gebruiksrichtlijnen toe zodat het model de tool alleen gebruikt voor substantieel werk en maximaal één stap op `in_progress` houdt.

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

- `model`: standaardmodel voor gestarte subagenten. Indien weggelaten, erven subagenten het model van de aanroeper.
- `allowAgents`: standaard allowlist van doelagent-id's voor `sessions_spawn` wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt (`["*"]` = elk; standaard: alleen dezelfde agent).
- `runTimeoutSeconds`: standaardtimeout (seconden) voor `sessions_spawn` wanneer de toolaanroep `runTimeoutSeconds` weglaat. `0` betekent geen timeout.
- Toolbeleid per subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Aangepaste providers en basis-URL's

OpenClaw gebruikt de ingebouwde modelcatalogus. Voeg aangepaste providers toe via `models.providers` in de configuratie of `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Verificatie en merge-voorrang">
    - Gebruik `authHeader: true` + `headers` voor aangepaste verificatiebehoeften.
    - Overschrijf de hoofdmap van de agentconfiguratie met `OPENCLAW_AGENT_DIR` (of `PI_CODING_AGENT_DIR`, een alias voor een verouderde omgevingsvariabele).
    - Merge-voorrang voor overeenkomende provider-ID's:
      - Niet-lege waarden voor `baseUrl` in agent-`models.json` winnen.
      - Niet-lege agentwaarden voor `apiKey` winnen alleen wanneer die provider niet door SecretRef wordt beheerd in de huidige configuratie-/auth-profielcontext.
      - Door SecretRef beheerde providerwaarden voor `apiKey` worden vernieuwd vanuit bronmarkeringen (`ENV_VAR_NAME` voor env-verwijzingen, `secretref-managed` voor file-/exec-verwijzingen) in plaats van opgeloste geheimen te bewaren.
      - Door SecretRef beheerde providerheaderwaarden worden vernieuwd vanuit bronmarkeringen (`secretref-env:ENV_VAR_NAME` voor env-verwijzingen, `secretref-managed` voor file-/exec-verwijzingen).
      - Lege of ontbrekende agentwaarden voor `apiKey`/`baseUrl` vallen terug op `models.providers` in de configuratie.
      - Overeenkomende modelwaarden voor `contextWindow`/`maxTokens` gebruiken de hogere waarde van expliciete configuratie en impliciete cataloguswaarden.
      - Overeenkomende modelwaarden voor `contextTokens` behouden een expliciete runtimecap wanneer aanwezig; gebruik dit om effectieve context te beperken zonder native modelmetadata te wijzigen.
      - Gebruik `models.mode: "replace"` wanneer je wilt dat de configuratie `models.json` volledig herschrijft.
      - Markeringspersistentie is bronauthoritatief: markeringen worden geschreven vanuit de actieve bronconfiguratiesnapshot (voor resolutie), niet vanuit opgeloste runtimegeheimwaarden.

  </Accordion>
</AccordionGroup>

### Details van providervelden

<AccordionGroup>
  <Accordion title="Catalogus op topniveau">
    - `models.mode`: gedrag van providercatalogus (`merge` of `replace`).
    - `models.providers`: aangepaste providermap, gesleuteld op provider-id.
      - Veilige bewerkingen: gebruik `openclaw config set models.providers.<id> '<json>' --strict-json --merge` of `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` voor additieve updates. `config set` weigert destructieve vervangingen tenzij je `--replace` meegeeft.

  </Accordion>
  <Accordion title="Providerverbinding en verificatie">
    - `models.providers.*.api`: aanvraagadapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, enz.). Gebruik voor zelfgehoste `/v1/chat/completions`-backends zoals MLX, vLLM, SGLang en de meeste OpenAI-compatibele lokale servers `openai-completions`. Een aangepaste provider met `baseUrl` maar zonder `api` valt standaard terug op `openai-completions`; stel `openai-responses` alleen in wanneer de backend `/v1/responses` ondersteunt.
    - `models.providers.*.apiKey`: providerreferentie (bij voorkeur SecretRef/env-substitutie).
    - `models.providers.*.auth`: verificatiestrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standaard native contextvenster voor modellen onder deze provider wanneer de modelvermelding geen `contextWindow` instelt.
    - `models.providers.*.contextTokens`: standaard effectieve runtimecontextcap voor modellen onder deze provider wanneer de modelvermelding geen `contextTokens` instelt.
    - `models.providers.*.maxTokens`: standaard uitvoertokencap voor modellen onder deze provider wanneer de modelvermelding geen `maxTokens` instelt.
    - `models.providers.*.timeoutSeconds`: optionele HTTP-aanvraagtimeout per providermodel in seconden, inclusief verbinding, headers, body en afhandeling van afbreken van de totale aanvraag.
    - `models.providers.*.injectNumCtxForOpenAICompat`: injecteer voor Ollama + `openai-completions` `options.num_ctx` in aanvragen (standaard: `true`).
    - `models.providers.*.authHeader`: dwing referentietransport af in de header `Authorization` wanneer vereist.
    - `models.providers.*.baseUrl`: basis-URL van de upstream-API.
    - `models.providers.*.headers`: extra statische headers voor proxy-/tenantroutering.

  </Accordion>
  <Accordion title="Overrides voor aanvraagtransport">
    `models.providers.*.request`: transportoverrides voor HTTP-aanvragen aan modelproviders.

    - `request.headers`: extra headers (samengevoegd met providerstandaarden). Waarden accepteren SecretRef.
    - `request.auth`: override voor verificatiestrategie. Modi: `"provider-default"` (gebruik de ingebouwde verificatie van de provider), `"authorization-bearer"` (met `token`), `"header"` (met `headerName`, `value`, optioneel `prefix`).
    - `request.proxy`: override voor HTTP-proxy. Modi: `"env-proxy"` (gebruik env-vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (met `url`). Beide modi accepteren een optioneel subobject `tls`.
    - `request.tls`: TLS-override voor directe verbindingen. Velden: `ca`, `cert`, `key`, `passphrase` (allemaal accepteren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: wanneer `true`, HTTPS naar `baseUrl` toestaan wanneer DNS naar private, CGNAT- of vergelijkbare bereiken resolveert, via de HTTP-fetchguard van de provider (operator opt-in voor vertrouwde zelfgehoste OpenAI-compatibele eindpunten). Stream-URL's voor loopback-modelproviders zoals `localhost`, `127.0.0.1` en `[::1]` worden automatisch toegestaan, tenzij dit expliciet is ingesteld op `false`; LAN-, tailnet- en private DNS-hosts vereisen nog steeds opt-in. WebSocket gebruikt dezelfde `request` voor headers/TLS, maar niet die fetch-SSRF-poort. Standaard `false`.

  </Accordion>
  <Accordion title="Modelcatalogusvermeldingen">
    - `models.providers.*.models`: expliciete vermeldingen in de providermodelcatalogus.
    - `models.providers.*.models.*.input`: invoermodaliteiten van het model. Gebruik `["text"]` voor modellen met alleen tekst en `["text", "image"]` voor native image-/vision-modellen. Afbeeldingsbijlagen worden alleen in agentbeurten geïnjecteerd wanneer het geselecteerde model als image-capable is gemarkeerd.
    - `models.providers.*.models.*.contextWindow`: native metadata voor het contextvenster van het model. Dit overschrijft `contextWindow` op providerniveau voor dat model.
    - `models.providers.*.models.*.contextTokens`: optionele runtimecontextcap. Dit overschrijft `contextTokens` op providerniveau; gebruik dit wanneer je een kleiner effectief contextbudget wilt dan het native `contextWindow` van het model; `openclaw models list` toont beide waarden wanneer ze verschillen.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionele compatibiliteitshint. Voor `api: "openai-completions"` met een niet-lege niet-native `baseUrl` (host niet `api.openai.com`) dwingt OpenClaw dit tijdens runtime af naar `false`. Een lege/weggelaten `baseUrl` behoudt standaard OpenAI-gedrag.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionele compatibiliteitshint voor OpenAI-compatibele chat-eindpunten met alleen strings. Wanneer `true`, vlakt OpenClaw pure tekstarrays `messages[].content` af naar gewone strings voordat de aanvraag wordt verzonden.

  </Accordion>
  <Accordion title="Amazon Bedrock-detectie">
    - `plugins.entries.amazon-bedrock.config.discovery`: hoofdmap voor instellingen voor automatische Bedrock-detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: impliciete detectie in-/uitschakelen.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-regio voor detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optioneel provider-id-filter voor gerichte detectie.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: pollinginterval voor detectievernieuwing.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallback-contextvenster voor gedetecteerde modellen.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallback voor maximaal aantal uitvoertokens voor gedetecteerde modellen.

  </Accordion>
</AccordionGroup>

Interactieve onboarding voor aangepaste providers leidt afbeeldingsinvoer af voor veelvoorkomende vision-model-ID's zoals GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V en GLM-4V, en slaat de extra vraag over voor bekende tekst-only families. Onbekende model-ID's vragen nog steeds om image-ondersteuning. Niet-interactieve onboarding gebruikt dezelfde afleiding; geef `--custom-image-input` mee om image-capable metadata af te dwingen of `--custom-text-input` om metadata voor alleen tekst af te dwingen.

### Providervoorbeelden

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    De gebundelde provider-Plugin `cerebras` kan dit configureren via `openclaw onboard --auth-choice cerebras-api-key`. Gebruik expliciete providerconfiguratie alleen wanneer je standaarden overschrijft.

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic-compatibel, ingebouwde provider. Snelkoppeling: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Lokale modellen (LM Studio)">
    Zie [Lokale modellen](/nl/gateway/local-models). TL;DR: voer een groot lokaal model uit via de LM Studio Responses API op serieuze hardware; houd gehoste modellen samengevoegd voor fallback.
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

    Stel `MINIMAX_API_KEY` in. Snelkoppelingen: `openclaw onboard --auth-choice minimax-global-api` of `openclaw onboard --auth-choice minimax-cn-api`. De modelcatalogus gebruikt standaard alleen M2.7. Op het Anthropic-compatibele streamingpad schakelt OpenClaw MiniMax-denken standaard uit, tenzij je `thinking` zelf expliciet instelt. `/fast on` of `params.fastMode: true` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.

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

    Voor het China-endpoint: `baseUrl: "https://api.moonshot.cn/v1"` of `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Native Moonshot-endpoints adverteren compatibiliteit met streaminggebruik op het gedeelde `openai-completions`-transport, en OpenClaw baseert dat op endpointmogelijkheden in plaats van alleen op de ingebouwde provider-id.

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
  <Accordion title="Synthetisch (Anthropic-compatibel)">
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

    Basis-URL moet `/v1` weglaten (Anthropic-client voegt die toe). Snelkoppeling: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Stel `ZAI_API_KEY` in. `z.ai/*` en `z-ai/*` zijn geaccepteerde aliassen. Snelkoppeling: `openclaw onboard --auth-choice zai-api-key`.

    - Algemeen endpoint: `https://api.z.ai/api/paas/v4`
    - Coding-endpoint (standaard): `https://api.z.ai/api/coding/paas/v4`
    - Definieer voor het algemene endpoint een aangepaste provider met de basis-URL-override.

  </Accordion>
</AccordionGroup>

---

## Gerelateerd

- [Configuratie — agents](/nl/gateway/config-agents)
- [Configuratie — channels](/nl/gateway/config-channels)
- [Configuratiereferentie](/nl/gateway/configuration-reference) — andere sleutels op topniveau
- [Tools en plugins](/nl/tools)
