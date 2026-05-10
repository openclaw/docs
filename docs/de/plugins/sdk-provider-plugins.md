---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Sie müssen Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-05-10T19:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Diese Anleitung führt Sie durch das Erstellen eines Provider-Plugins, das OpenClaw einen Modell-Provider
(LLM) hinzufügt. Am Ende verfügen Sie über einen Provider mit einem Modellkatalog,
API-Schlüssel-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und Manifest-Einrichtung.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon ausgeführt werden muss, der Threads, Compaction oder Tool-
  Ereignisse besitzt, kombinieren Sie den Provider mit einem [Agent-Harness](/de/plugins/sdk-agent-harness),
  anstatt Daemon-Protokolldetails in den Kern zu legen.
</Tip>

## Exemplarische Anleitung

<Steps>
  <Step title="Paket und Manifest">
    ### Schritt 1: Paket und Manifest

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
      "description": "Acme AI model provider",
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
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
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
    Zugangsdaten erkennen kann, ohne die Runtime Ihres Plugins zu laden. Fügen Sie `providerAuthAliases`
    hinzu, wenn eine Provider-Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport`
    ist optional und ermöglicht OpenClaw, Ihr Provider-Plugin aus Kurzform-
    Modell-IDs wie `acme-large` automatisch zu laden, bevor Runtime-Hooks vorhanden sind. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Provider registrieren">
    Ein minimaler Text-Provider benötigt eine `id`, ein `label`, `auth` und `catalog`.
    `catalog` ist der providerseitige Runtime-/Konfigurations-Hook; er kann Live-
    Hersteller-APIs aufrufen und gibt `models.providers`-Einträge zurück.

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

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` ist die neuere Control-Plane-Katalogoberfläche
    für Listen-, Hilfe- und Auswahl-UI. Verwenden Sie sie für Zeilen zu Text, Bilderzeugung,
    Videoerzeugung und Musikerzeugung. Belassen Sie Hersteller-Endpunktaufrufe und
    Antwortzuordnung im Plugin; OpenClaw besitzt die gemeinsame Zeilenform, Quell-
    Labels und Hilfe-Rendering.

    Damit ist ein funktionsfähiger Provider vorhanden. Benutzer können nun
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als Modell auswählen.

    Wenn der vorgelagerte Provider andere Steuerungstokens als OpenClaw verwendet, fügen Sie eine
    kleine bidirektionale Texttransformation hinzu, anstatt den Stream-Pfad zu ersetzen:

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

    `input` schreibt den endgültigen System-Prompt und den Inhalt von Textnachrichten vor
    dem Transport um. `output` schreibt Assistenten-Text-Deltas und den endgültigen Text um,
    bevor OpenClaw seine eigenen Steuerungsmarker oder die Kanalauslieferung parst.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Schlüssel-
    Authentifizierung sowie einer einzelnen kataloggestützten Runtime registrieren, verwenden Sie bevorzugt den enger gefassten
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
    Provider-Authentifizierung auflösen kann. Er kann providerspezifische Erkennung durchführen. Verwenden Sie
    `buildStaticProvider` nur für Offline-Zeilen, die vor der Konfiguration der Authentifizierung sicher angezeigt werden können;
    er darf keine Zugangsdaten erfordern und keine Netzwerkanfragen stellen.
    Die Anzeige `models list --all` von OpenClaw führt statische Kataloge derzeit
    nur für gebündelte Provider-Plugins aus, mit leerer Konfiguration, leerer Umgebung und ohne
    Agent-/Workspace-Pfade.

    Wenn Ihr Authentifizierungsablauf außerdem `models.providers.*`, Aliasse und
    das Standardmodell des Agents während des Onboardings patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn ein nativer Endpunkt eines Providers gestreamte Nutzungsblöcke über den
    normalen `openai-completions`-Transport unterstützt, verwenden Sie bevorzugt die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared`, anstatt
    Provider-ID-Prüfungen fest zu codieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen Unterstützung anhand der
    Endpunkt-Capability-Map, sodass native Endpunkte im Moonshot-/DashScope-Stil weiterhin
    opt-in verwenden, selbst wenn ein Plugin eine benutzerdefinierte Provider-ID nutzt.

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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für asynchrone
    Vorbereitung - `resolveDynamicModel` wird nach Abschluss erneut ausgeführt.

  </Step>

  <Step title="Runtime-Hooks hinzufügen (bei Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Helper-Builder decken inzwischen die häufigsten Replay-/Tool-Kompatibilitäts-
    Familien ab, sodass Plugins normalerweise nicht jeden Hook einzeln verdrahten müssen:

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

    Heute verfügbare Replay-Familien:

    | Familie | Was sie einbindet | Mitgelieferte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame OpenAI-artige Replay-Policy für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für Assistant-First-Reihenfolge und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewusste Replay-Policy, ausgewählt per `modelId`, sodass Anthropic-Message-Transporte Claude-spezifische Thinking-Block-Bereinigung nur erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-Replay-Policy plus Bootstrap-Replay-Bereinigung und Modus für getaggte Reasoning-Ausgabe | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Gemini-Thought-Signature-Bereinigung für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert keine native Gemini-Replay-Validierung oder Bootstrap-Neuschreibungen | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride Policy für Provider, die Anthropic-Message- und OpenAI-kompatible Modelloberflächen in einem Plugin mischen; optionales Entfernen von Thinking-Blocks nur für Claude bleibt auf die Anthropic-Seite beschränkt | `minimax` |

    Heute verfügbare Stream-Familien:

    | Familie | Was sie einbindet | Mitgelieferte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Payloads im gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper im gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs injiziertes Thinking überspringen | `kilocode` |
    | `moonshot-thinking` | Zuordnung nativer Moonshot-Binary-Thinking-Payloads aus Konfiguration + `/think`-Stufe | `moonshot` |
    | `minimax-fast-mode` | MiniMax-Fast-Mode-Modellumschreibung im gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame native OpenAI/Codex-Responses-Wrapper: Attributions-Header, `/fast`/`serviceTier`, Text-Ausführlichkeit, native Codex-Websuche, Reasoning-kompatible Payload-Formung und Responses-Kontextverwaltung | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen bei nicht unterstützten Modellen/`auto` zentral gehandhabt wird | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming wünschen, sofern es nicht explizit deaktiviert ist | `zai` |

    <Accordion title="SDK-Seams, die die Family Builder antreiben">
      Jeder Family Builder besteht aus öffentlichen Low-Level-Helfern, die aus demselben Paket exportiert werden und auf die Sie zurückgreifen können, wenn ein Provider vom gemeinsamen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die rohen Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert außerdem Gemini-Replay-Helfer (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) und Endpunkt-/Modell-Helfer (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` sowie die gemeinsamen OpenAI/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek-V4-OpenAI-kompatibler Wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic-Messages-Thinking-Prefill-Bereinigung (`createAnthropicThinkingPrefillPayloadWrapper`) und gemeinsame Proxy-/Provider-Wrapper (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")` und zugrunde liegende Gemini-Schema-Helfer (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`).

      Einige Stream-Helfer bleiben absichtlich providerlokal. `@openclaw/anthropic-provider` behält `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-Anthropic-Wrapper-Builder in seinem eigenen öffentlichen `api.ts`-/`contract-api.ts`-Seam, weil sie Claude-OAuth-Beta-Behandlung und `context1m`-Gating kodieren. Das xAI-Plugin behält ähnlich die native xAI-Responses-Formung in seinem eigenen `wrapStreamFn` (`/fast`-Aliasse, Standard-`tool_stream`, Bereinigung nicht unterstützter Strict-Tools, xAI-spezifisches Entfernen von Reasoning-Payloads).

      Dasselbe Package-Root-Muster stützt auch `@openclaw/openai-provider` (Provider-Builder, Default-Model-Helfer, Realtime-Provider-Builder) und `@openclaw/openrouter-provider` (Provider-Builder plus Onboarding-/Konfigurationshelfer).
    </Accordion>

    <Tabs>
      <Tab title="Token-Austausch">
        Für Provider, die vor jedem Inferenzaufruf einen Token-Austausch benötigen:

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
        Für Provider, die benutzerdefinierte Request-Header oder Body-Änderungen benötigen:

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
      <Tab title="Native transport identity">
        Für Provider, die native Anfrage-/Sitzungs-Header oder Metadaten auf
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
      <Tab title="Usage and billing">
        Für Provider, die Nutzungs-/Abrechnungsdaten bereitstellen:

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

    <Accordion title="All available provider hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2-3:
      Nur der Kompatibilität dienende Provider-Felder, die OpenClaw nicht mehr aufruft, wie
      `ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier nicht aufgeführt.

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für die Basis-URL |
      | 2 | `applyConfigDefaults` | Provider-eigene globale Standardwerte während der Konfigurationsmaterialisierung |
      | 3 | `normalizeModelId` | Bereinigung von Aliasen für Legacy-/Preview-Modell-IDs vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` der Provider-Familie vor der generischen Modellassemblierung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Kompatibilitäts-Umschreibungen für native Streaming-Nutzung bei Konfigurations-Providern |
      | 7 | `resolveConfigApiKey` | Provider-eigene Authentifizierungsauflösung für Env-Marker |
      | 8 | `resolveSyntheticAuth` | Lokale/selbst gehostete oder konfigurationsgestützte synthetische Authentifizierung |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische Platzhalter für gespeicherte Profile hinter Env-/Konfigurationsauthentifizierung zurückstufen |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchroner Metadatenabruf vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `normalizeToolSchemas` | Provider-eigene Bereinigung von Tool-Schemata vor der Registrierung |
      | 15 | `inspectToolSchemas` | Provider-eigene Diagnosen für Tool-Schemata |
      | 16 | `resolveReasoningOutputMode` | Vertrag für getaggte vs. native Reasoning-Ausgabe |
      | 17 | `prepareExtraParams` | Standard-Anfrageparameter |
      | 18 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 19 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 20 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS-Sitzungs-Header/Cool-down |
      | 22 | `formatApiKey` | Benutzerdefinierte Runtime-Token-Form |
      | 23 | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | 24 | `buildAuthDoctorHint` | Anleitung zur Authentifizierungsreparatur |
      | 25 | `matchesContextOverflowError` | Provider-eigene Overflow-Erkennung |
      | 26 | `classifyFailoverReason` | Provider-eigene Klassifizierung von Rate-Limits/Überlastung |
      | 27 | `isCacheTtlEligible` | Prompt-Cache-TTL-Gating |
      | 28 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | 29 | `augmentModelCatalog` | Synthetische Forward-Compat-Zeilen |
      | 30 | `resolveThinkingProfile` | Modellspezifisches `/think`-Optionsset |
      | 31 | `isBinaryThinking` | Binäre Thinking-Ein/Aus-Kompatibilität |
      | 32 | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning-Unterstützung |
      | 33 | `resolveDefaultThinkingLevel` | Kompatibilität der Standard-`/think`-Richtlinie |
      | 34 | `isModernModelRef` | Live-/Smoke-Modellabgleich |
      | 35 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 36 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Nutzungsanmeldedaten |
      | 37 | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungs-Endpunkt |
      | 38 | `createEmbeddingProvider` | Provider-eigener Embedding-Adapter für Speicher/Suche |
      | 39 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transcript-Replay/Compaction |
      | 40 | `sanitizeReplayHistory` | Provider-spezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 41 | `validateReplayTurns` | Strikte Replay-Turn-Validierung vor dem eingebetteten Runner |
      | 42 | `onModelSelected` | Callback nach der Auswahl (z. B. Telemetrie) |

      Hinweise zu Runtime-Fallbacks:

      - `normalizeConfig` prüft zuerst den passenden Provider und dann andere hook-fähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein Provider-Hook einen unterstützten Google-Family-Konfigurationseintrag umschreibt, greift weiterhin der gebündelte Google-Konfigurationsnormalisierer.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er bereitgestellt wird. Der gebündelte `amazon-bedrock`-Pfad hat hier außerdem einen integrierten AWS-Env-Marker-Resolver, obwohl die Bedrock-Runtime-Authentifizierung selbst weiterhin die Standardkette des AWS SDK verwendet.
      - `resolveSystemPromptContribution` ermöglicht einem Provider, cache-bewusste System-Prompt-Anleitung für eine Modellfamilie einzuschleusen. Bevorzugen Sie dies gegenüber `before_prompt_build`, wenn das Verhalten zu einem Provider/einer Modellfamilie gehört und die stabile/dynamische Cache-Aufteilung erhalten soll.

      Detaillierte Beschreibungen und Beispiele aus der Praxis finden Sie unter [Interna: Provider-Runtime-Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Schritt 5: Zusätzliche Fähigkeiten hinzufügen

    Ein Provider-Plugin kann Sprachausgabe, Echtzeittranskription, Echtzeit-Voice, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf und Websuche neben Textinferenz registrieren. OpenClaw klassifiziert dies als **Hybrid-Capability**-Plugin - das empfohlene Muster für Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe [Interna: Capability-Zuständigkeit](/de/plugins/architecture#capability-ownership-model).

    Registrieren Sie jede Capability in `register(api)` neben Ihrem bestehenden `api.registerProvider(...)`-Aufruf. Wählen Sie nur die Tabs aus, die Sie benötigen:

    <Tabs>
      <Tab title="Sprachausgabe (TTS)">
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

        Verwenden Sie `assertOkOrThrowProviderError(...)` für HTTP-Fehler von Providern, damit Plugins begrenzte Fehlertext-Lesevorgänge, JSON-Fehleranalyse und Request-ID-Suffixe gemeinsam nutzen.
      </Tab>
      <Tab title="Echtzeittranskription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` - der gemeinsame Helper übernimmt Proxy-Erfassung, Reconnect-Backoff, Flush beim Schließen, Ready-Handshakes, Audio-Queueing und Diagnosen für Close-Events. Ihr Plugin ordnet nur Upstream-Events zu.

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

        Batch-STT-Provider, die Multipart-Audio per POST senden, sollten `buildAudioTranscriptionFormData(...)` aus `openclaw/plugin-sdk/provider-http` verwenden. Der Helper normalisiert Upload-Dateinamen, einschließlich AAC-Uploads, die für kompatible Transkriptions-APIs einen Dateinamen im M4A-Stil benötigen.
      </Tab>
      <Tab title="Echtzeit-Voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Deklarieren Sie `capabilities`, damit `talk.catalog` gültige Modi, Transports, Audioformate und Feature-Flags für Browser- und native Talk-Clients verfügbar machen kann. Implementieren Sie `handleBargeIn`, wenn ein Transport erkennen kann, dass ein Mensch die Wiedergabe des Assistenten unterbricht und der Provider das Kürzen oder Löschen der aktiven Audioantwort unterstützt.
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
        Video-Capabilities verwenden eine **modusbewusste** Struktur: `generate`, `imageToVideo` und `videoToVideo`. Flache Aggregatfelder wie `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` reichen nicht aus, um Unterstützung für Transformationsmodi oder deaktivierte Modi sauber auszuweisen. Musikgenerierung folgt demselben Muster mit expliziten `generate`- / `edit`-Blöcken.

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
      <Tab title="Web-Abruf und Suche">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
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
            description: "Fetch a page through Acme Fetch.",
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
    ### Schritt 6: Testen

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

## In ClawHub veröffentlichen

Provider-Plugins werden genauso veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den alten Alias nur für Skills; Plugin-Pakete sollten `clawhub package publish` verwenden.

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

## Referenz zur Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu integrierten Providern zusammengeführt wird:

| Reihenfolge | Zeitpunkt       | Anwendungsfall                                  |
| ----------- | --------------- | ----------------------------------------------- |
| `simple`    | Erster Durchlauf | Einfache API-Key-Provider                       |
| `profile`   | Nach simple      | Provider, die durch Auth-Profile gesteuert sind |
| `paired`    | Nach profile     | Mehrere verwandte Einträge synthetisieren       |
| `late`      | Letzter Durchlauf | Bestehende Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - wenn Ihr Plugin auch einen Channel bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) - `api.runtime`-Helper (TTS, Suche, Subagent)
- [SDK-Überblick](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Imports
- [Plugin-Interna](/de/plugins/architecture-internals#provider-runtime-hooks) - Hook-Details und gebündelte Beispiele

## Verwandt

- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Channel-Plugins erstellen](/de/plugins/sdk-channel-plugins)
