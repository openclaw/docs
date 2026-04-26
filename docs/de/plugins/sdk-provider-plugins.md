---
read_when:
    - Sie erstellen ein neues Modellanbieter-Plugin.
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen.
    - Sie müssen Authentifizierung, Kataloge und Laufzeit-Hooks von Anbietern verstehen.
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modellanbieter-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-04-26T11:36:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Diese Anleitung führt Sie durch das Erstellen eines Provider-Plugins, das einen Modellanbieter
(LLM) zu OpenClaw hinzufügt. Am Ende haben Sie einen Provider mit Modellkatalog,
API-Key-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paket-
  struktur und die Einrichtung des Manifests.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon laufen muss, der Threads, Compaction oder Tool-
  Ereignisse besitzt, koppeln Sie den Provider mit einem [Agent-Harness](/de/plugins/sdk-agent-harness),
  statt Details des Daemon-Protokolls in den Core zu legen.
</Tip>

## Anleitung

<Steps>
  <Step title="Paket und Manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI-Modellanbieter",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI-API-Schlüssel",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI-API-Schlüssel"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Das Manifest deklariert `providerAuthEnvVars`, damit OpenClaw
    Zugangsdaten erkennen kann, ohne die Laufzeit Ihres Plugins zu laden. Fügen Sie `providerAuthAliases`
    hinzu, wenn eine Provider-Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport`
    ist optional und erlaubt es OpenClaw, Ihr Provider-Plugin aus Kurzformen
    von Modell-IDs wie `acme-large` automatisch zu laden, bevor Laufzeit-Hooks existieren. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Den Provider registrieren">
    Ein minimaler Provider benötigt eine `id`, `label`, `auth` und `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    Das ist ein funktionierender Provider. Benutzer können jetzt
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als Modell auswählen.

    Wenn der Upstream-Provider andere Steuer-Tokens als OpenClaw verwendet, fügen Sie
    eine kleine bidirektionale Texttransformation hinzu, statt den Stream-Pfad zu ersetzen:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` schreibt den endgültigen Systemprompt und den Textinhalt von Nachrichten vor dem
    Transport um. `output` schreibt Text-Deltas des Assistenten und endgültigen Text um, bevor
    OpenClaw seine eigenen Steuer-Markierungen oder die Kanalzustellung parst.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Key-
    Authentifizierung plus eine einzelne kataloggestützte Laufzeit registrieren, bevorzugen Sie den engeren
    Helper `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` ist der Live-Katalogpfad, der verwendet wird, wenn OpenClaw echte
    Provider-Authentifizierung auflösen kann. Er kann providerspezifische Discovery ausführen. Verwenden Sie
    `buildStaticProvider` nur für Offline-Zeilen, die sicher angezeigt werden können, bevor die Authentifizierung
    konfiguriert ist; es darf keine Zugangsdaten erfordern oder Netzwerkanfragen ausführen.
    Die Anzeige von `models list --all` in OpenClaw führt statische Kataloge derzeit
    nur für gebündelte Provider-Plugins aus, mit leerer Konfiguration, leerer Umgebung und ohne
    Agent-/Workspace-Pfade.

    Wenn Ihr Authentifizierungsablauf auch `models.providers.*`, Aliasse und
    das Standardmodell des Agenten während des Onboardings patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Providers gestreamte Nutzungsblöcke auf dem
    normalen Transport `openai-completions` unterstützt, bevorzugen Sie die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared`, statt Provider-ID-Prüfungen fest zu codieren.
    `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen Unterstützung aus der Endpoint-Capability-Map,
    sodass native Endpunkte im Stil von Moonshot/DashScope weiterhin Opt-in nutzen, auch wenn ein Plugin
    eine benutzerdefinierte Provider-ID verwendet.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn Ihr Provider beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
    fügen Sie `resolveDynamicModel` hinzu:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Wenn das Auflösen einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für asynchrones
    Warm-up — `resolveDynamicModel` wird erneut ausgeführt, nachdem es abgeschlossen ist.

  </Step>

  <Step title="Laufzeit-Hooks hinzufügen (nach Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, je nachdem, was Ihr Provider benötigt.

    Gemeinsame Helper-Builder decken jetzt die häufigsten Familien für Replay und Tool-Kompatibilität
    ab, sodass Plugins in der Regel nicht jeden Hook einzeln verdrahten müssen:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Verfügbare Replay-Familien heute:

    | Family | Was verdrahtet wird | Gebündelte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für Reihenfolgefehler bei „Assistant zuerst“ und generischer Validierung von Gemini-Turns, wenn der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, die anhand von `modelId` ausgewählt wird, sodass Anthropic-Message-Transporte Claude-spezifische Bereinigung von Thinking-Blöcken nur erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bereinigung von Bootstrap-Replay und getaggter Modus für die Ausgabe des Denkprozesses | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Bereinigung der Thought-Signatur von Gemini für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert weder native Gemini-Replay-Validierung noch Bootstrap-Umschreibungen | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die in einem Plugin Anthropic-Message- und OpenAI-kompatible Modelloberflächen mischen; optionales Entfernen von Thinking-Blöcken nur für Claude bleibt auf die Anthropic-Seite beschränkt | `minimax` |

    Verfügbare Stream-Familien heute:

    | Family | Was verdrahtet wird | Gebündelte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Payloads auf dem gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs injiziertes Thinking überspringen | `kilocode` |
    | `moonshot-thinking` | Mapping von nativer binärer Thinking-Payload von Moonshot aus Konfiguration + `/think`-Level | `moonshot` |
    | `minimax-fast-mode` | Umschreibung des Fast-Mode-Modells von MiniMax auf dem gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame Wrapper für native OpenAI-/Codex-Responses: Attribution-Header, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche, Payload-Shaping für Reasoning-Kompatibilität und Kontextverwaltung für Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen für nicht unterstützte Modelle/`auto` zentral behandelt wird | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming möchten, sofern es nicht explizit deaktiviert wird | `zai` |

    <Accordion title="SDK-Seams, die die Family-Builder antreiben">
      Jeder Family-Builder ist aus niedrigeren öffentlichen Helpern zusammengesetzt, die aus demselben Paket exportiert werden und auf die Sie zurückgreifen können, wenn ein Provider vom gemeinsamen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die rohen Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert auch Gemini-Replay-Helper (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) sowie Helper für Endpunkte/Modelle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus die gemeinsamen OpenAI-/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), der OpenAI-kompatible Wrapper für DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) sowie gemeinsame Wrapper für Proxys/Provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, zugrunde liegende Gemini-Schema-Helper (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) und xAI-Kompatibilitäts-Helper (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Das gebündelte xAI-Plugin verwendet damit `normalizeResolvedModel` + `contributeResolvedModelCompat`, um xAI-Regeln im Besitz des Providers zu halten.

      Einige Stream-Helper bleiben absichtlich providerlokal. `@openclaw/anthropic-provider` behält `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Wrapper-Builder auf niedrigerer Ebene für Anthropic in seinem eigenen öffentlichen Seam `api.ts` / `contract-api.ts`, weil sie Claude-OAuth-Beta-Handhabung und `context1m`-Gating kodieren. Das xAI-Plugin behält ebenso natives Shaping von xAI-Responses in seinem eigenen `wrapStreamFn` (`/fast`-Aliasse, Standard-`tool_stream`, Bereinigung nicht unterstützter strikter Tools, Entfernung xAI-spezifischer Reasoning-Payloads).

      Dasselbe Paket-Root-Muster stützt auch `@openclaw/openai-provider` (Provider-Builder, Helper für Standardmodelle, Builder für Realtime-Provider) und `@openclaw/openrouter-provider` (Provider-Builder plus Onboarding-/Konfigurations-Helper).
    </Accordion>

    <Tabs>
      <Tab title="Tokenaustausch">
        Für Provider, die vor jedem Inferenzaufruf einen Tokenaustausch benötigen:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Benutzerdefinierte Header">
        Für Provider, die benutzerdefinierte Request-Header oder Änderungen am Body benötigen:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Native Transportidentität">
        Für Provider, die native Request-/Sitzungs-Header oder Metadaten bei
        generischen HTTP- oder WebSocket-Transporten benötigen:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Nutzung und Abrechnung">
        Für Provider, die Daten zu Nutzung/Abrechnung bereitstellen:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Alle verfügbaren Provider-Hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2–3:

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für `baseUrl` |
      | 2 | `applyConfigDefaults` | Provider-eigene globale Standardwerte bei der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung von Aliasen für Legacy-/Preview-Modell-IDs vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für Provider-Familien vor generischer Modellassemblierung |
      | 5 | `normalizeConfig` | Normalisierung der Konfiguration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitäts-Umschreibungen für Konfigurationsprovider |
      | 7 | `resolveConfigApiKey` | Provider-eigene Auflösung von Env-Marker-Authentifizierung |
      | 8 | `resolveSyntheticAuth` | Synthetische Authentifizierung für lokal/self-hosted oder konfigurationsgestützte Setups |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische Platzhalter für gespeicherte Profile unter Env-/Konfigurationsauthentifizierung herabstufen |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchroner Abruf von Metadaten vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Anbietermodelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Legacy-Container für statische Fähigkeiten; nur Kompatibilität |
      | 15 | `normalizeToolSchemas` | Provider-eigene Bereinigung von Tool-Schemas vor der Registrierung |
      | 16 | `inspectToolSchemas` | Provider-eigene Diagnostik für Tool-Schemas |
      | 17 | `resolveReasoningOutputMode` | Vertrag für getaggte vs. native Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter `StreamFn`-Transport |
      | 20 | `wrapStreamFn` | Wrapper für benutzerdefinierte Header/Bodys auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Sitzungs-Header/Cool-down |
      | 23 | `formatApiKey` | Benutzerdefinierte Form von Laufzeit-Tokens |
      | 24 | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Reparatur von Authentifizierung |
      | 26 | `matchesContextOverflowError` | Provider-eigene Erkennung von Overflow |
      | 27 | `classifyFailoverReason` | Provider-eigene Klassifizierung von Rate-Limit/Überlastung |
      | 28 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | 30 | `suppressBuiltInModel` | Veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Zeilen für Vorwärtskompatibilität |
      | 32 | `resolveThinkingProfile` | Modellspezifische Optionsmenge für `/think` |
      | 33 | `isBinaryThinking` | Kompatibilität für binäres Thinking ein/aus |
      | 34 | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning-Unterstützung |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilität für Standardrichtlinie von `/think` |
      | 36 | `isModernModelRef` | Abgleich für Live-/Smoke-Modelle |
      | 37 | `prepareRuntimeAuth` | Tokenaustausch vor der Inferenz |
      | 38 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Zugangsdaten für Nutzung |
      | 39 | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungsendpunkt |
      | 40 | `createEmbeddingProvider` | Provider-eigener Embedding-Adapter für Memory/Suche |
      | 41 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transcript-Replay/Compaction |
      | 42 | `sanitizeReplayHistory` | Provider-spezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 43 | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 44 | `onModelSelected` | Callback nach Auswahl (z. B. Telemetrie) |

      Hinweise zum Laufzeit-Fallback:

      - `normalizeConfig` prüft zuerst den passenden Provider und danach andere hookfähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt, greift weiterhin der gebündelte Konfigurations-Normalisierer für Google.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er bereitgestellt wird. Der gebündelte Pfad `amazon-bedrock` hat hier zusätzlich einen eingebauten Resolver für AWS-Env-Marker, obwohl die Bedrock-Laufzeit-Authentifizierung selbst weiterhin die Standardkette des AWS SDK verwendet.
      - `resolveSystemPromptContribution` erlaubt es einem Provider, cachebewusste Systemprompt-Hinweise für eine Modellfamilie zu injizieren. Bevorzugen Sie dies gegenüber `before_prompt_build`, wenn das Verhalten zu einem Provider/einer Modellfamilie gehört und die stabile/dynamische Aufteilung des Caches erhalten bleiben soll.

      Für detaillierte Beschreibungen und Beispiele aus der Praxis siehe [Interna: Provider Runtime Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    Ein Provider-Plugin kann neben Text-Inferenz auch Speech, Realtime-Transkription, Realtime-
    Voice, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf
    und Websuche registrieren. OpenClaw klassifiziert dies als
    **hybrid-capability**-Plugin — das empfohlene Muster für Unternehmens-Plugins
    (ein Plugin pro Anbieter). Siehe
    [Interna: Ownership von Fähigkeiten](/de/plugins/architecture#capability-ownership-model).

    Registrieren Sie jede Fähigkeit innerhalb von `register(api)` neben Ihrem vorhandenen
    Aufruf `api.registerProvider(...)`. Wählen Sie nur die Tabs aus, die Sie benötigen:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Verwenden Sie `assertOkOrThrowProviderError(...)` für HTTP-Fehler von Providern, damit
        Plugins gemeinsame begrenzte Reads von Fehler-Bodys, JSON-Fehlerparsing und
        Request-ID-Suffixe verwenden.
      </Tab>
      <Tab title="Realtime-Transkription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` — der gemeinsame
        Helper übernimmt Proxy-Erfassung, Reconnect-Backoff, Flush beim Schließen, Ready-
        Handshakes, Audio-Queueing und Diagnostik von Close-Ereignissen. Ihr Plugin mappt
        nur Upstream-Ereignisse.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Batch-STT-Provider, die Multipart-Audio per POST senden, sollten
        `buildAudioTranscriptionFormData(...)` aus
        `openclaw/plugin-sdk/provider-http` verwenden. Der Helper normalisiert Upload-
        Dateinamen, einschließlich AAC-Uploads, die für kompatible
        Transkriptions-APIs einen Dateinamen im Stil von M4A benötigen.
      </Tab>
      <Tab title="Realtime-Voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
      </Tab>
      <Tab title="Medienverständnis">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Bild- und Videogenerierung">
        Videofähigkeiten verwenden eine **modusbewusste** Form: `generate`,
        `imageToVideo` und `videoToVideo`. Flache Aggregatfelder wie
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` reichen
        nicht aus, um Unterstützung für Transform-Modi oder deaktivierte Modi sauber
        zu deklarieren. Musikgenerierung folgt demselben Muster mit expliziten Blöcken
        `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web-Abruf und -Suche">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Seiten über Acmes Rendering-Backend abrufen.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Eine Seite über Acme Fetch abrufen.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Testen">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Auf ClawHub veröffentlichen

Provider-Plugins werden auf dieselbe Weise veröffentlicht wie jeder andere externe Code für Plugins:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den Legacy-Alias zum Veröffentlichen nur von Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referenz für die Reihenfolge des Katalogs

`catalog.order` steuert, wann Ihr Katalog relativ zu integrierten
Providern zusammengeführt wird:

| Reihenfolge | Wann         | Anwendungsfall                                |
| ----------- | ------------ | --------------------------------------------- |
| `simple`    | Erster Durchlauf | Einfache Provider mit API-Key                 |
| `profile`   | Nach simple  | Provider, die durch Auth-Profile gesteuert werden |
| `paired`    | Nach profile | Mehrere zusammengehörige Einträge synthetisieren |
| `late`      | Letzter Durchlauf | Vorhandene Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — `api.runtime`-Helper (TTS, Suche, Unteragent)
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [Plugin-Interna](/de/plugins/architecture-internals#provider-runtime-hooks) — Details zu Hooks und gebündelte Beispiele

## Verwandt

- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Kanal-Plugins erstellen](/de/plugins/sdk-channel-plugins)
