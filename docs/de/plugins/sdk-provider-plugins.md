---
read_when:
    - Du erstellst ein neues Modell-Provider-Plugin
    - Du möchtest einen mit OpenAI kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Du musst Provider-Auth, Kataloge und Laufzeit-Hooks verstehen
sidebarTitle: Provider Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider Plugins erstellen
x-i18n:
    generated_at: "2026-04-23T06:32:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Provider Plugins erstellen

Diese Anleitung führt dich durch das Erstellen eines Provider Plugins, das einen Modell-Provider
(LLM) zu OpenClaw hinzufügt. Am Ende hast du einen Provider mit Modellkatalog,
API-Key-Auth und dynamischer Modellauflösung.

<Info>
  Wenn du noch nie ein OpenClaw-Plugin erstellt hast, lies zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende Paket-
  Struktur und die Manifest-Einrichtung.
</Info>

<Tip>
  Provider Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon laufen muss, der Threads, Compaction oder Tool-
  Ereignisse besitzt, kombiniere den Provider stattdessen mit einem [agent harness](/de/plugins/sdk-agent-harness), anstatt Details des Daemon-Protokolls in den Core zu legen.
</Tip>

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
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
    Anmeldedaten erkennen kann, ohne deine Plugin-Laufzeit zu laden. Füge `providerAuthAliases`
    hinzu, wenn eine Provider-Variante die Auth einer anderen Provider-ID wiederverwenden soll. `modelSupport`
    ist optional und erlaubt OpenClaw, dein Provider Plugin automatisch aus verkürzten
    Modell-IDs wie `acme-large` zu laden, bevor Laufzeit-Hooks existieren. Wenn du den
    Provider auf ClawHub veröffentlichst, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Den Provider registrieren">
    Ein minimaler Provider benötigt `id`, `label`, `auth` und `catalog`:

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
    `acme-ai/acme-large` als ihr Modell auswählen.

    Wenn der Upstream-Provider andere Steuerungstokens als OpenClaw verwendet, füge eine
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

    `input` schreibt den finalen System Prompt und den Textinhalt von Nachrichten vor dem
    Transport um. `output` schreibt Assistant-Text-Deltas und finalen Text um, bevor
    OpenClaw seine eigenen Steuerungsmarker oder die Kanalzustellung parst.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Key-
    Auth plus eine einzelne kataloggestützte Laufzeit registrieren, bevorzuge den engeren
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
    Provider-Auth auflösen kann. Er kann providerspezifische Erkennung durchführen. Verwende
    `buildStaticProvider` nur für Offline-Zeilen, die vor der Konfiguration von Auth sicher angezeigt werden können; er darf weder Anmeldedaten erfordern noch Netzwerkanfragen stellen.
    Die Anzeige von OpenClaw `models list --all` führt derzeit statische Kataloge
    nur für gebündelte Provider Plugins aus, mit leerer Konfiguration, leerer Env und ohne
    Agent-/Workspace-Pfade.

    Wenn dein Auth-Ablauf während des Onboardings auch `models.providers.*`, Aliasse und
    das Standardmodell des Agenten patchen muss, verwende die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Providers gestreamte Nutzungsblöcke auf dem
    normalen Transport `openai-completions` unterstützt, bevorzuge die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared`, anstatt Provider-ID-Prüfungen hart zu kodieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen Unterstützung über die Endpoint-Fähigkeitszuordnung, sodass native Endpunkte im Stil von Moonshot/DashScope weiterhin aktiviert werden, selbst wenn ein Plugin eine benutzerdefinierte Provider-ID verwendet.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn dein Provider beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
    füge `resolveDynamicModel` hinzu:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog von oben

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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwende `prepareDynamicModel` für asynchrones
    Warm-up — `resolveDynamicModel` wird danach erneut ausgeführt.

  </Step>

  <Step title="Laufzeit-Hooks hinzufügen (bei Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Füge Hooks
    schrittweise hinzu, wenn dein Provider sie erfordert.

    Gemeinsame Helper-Builder decken jetzt die häufigsten Familien für Replay/Tool-Kompatibilität
    ab, sodass Plugins normalerweise nicht jeden Hook einzeln verdrahten müssen:

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

    | Familie | Was sie verdrahtet |
    | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für Assistant-first-Reihenfolge und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, ausgewählt nach `modelId`, sodass Transporte im Anthropic-Message-Stil Claude-spezifische Bereinigung von Thinking-Blöcken nur erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bootstrap-Replay-Bereinigung und getaggter Modus für Reasoning-Ausgabe |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signatures für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert weder native Gemini-Replay-Validierung noch Bootstrap-Umschreibungen |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die in einem Plugin Oberflächen im Stil von Anthropic-Message und OpenAI-kompatibel mischen; optionales Fallenlassen von Thinking-Blöcken nur für Claude bleibt auf die Anthropic-Seite begrenzt |

    Reale gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` und `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` und `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` und `zai`: `openai-compatible`

    Heute verfügbare Stream-Familien:

    | Familie | Was sie verdrahtet |
    | --- | --- |
    | `google-thinking` | Gemini-Thinking-Payload-Normalisierung auf dem gemeinsamen Stream-Pfad |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs injiziertes Thinking überspringen |
    | `moonshot-thinking` | Moonshot-Binär-Native-Thinking-Payload-Mapping aus Konfiguration + `/think`-Stufe |
    | `minimax-fast-mode` | MiniMax-Fast-Mode-Modell-Umschreibung auf dem gemeinsamen Stream-Pfad |
    | `openai-responses-defaults` | Gemeinsame native OpenAI-/Codex-Responses-Wrapper: Attributionsheader, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche, Reasoning-Kompat-Payload-Shaping und Responses-Kontextverwaltung |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen für nicht unterstützte Modelle/`auto` zentral behandelt wird |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie z.ai, die Tool-Streaming wünschen, sofern es nicht explizit deaktiviert wird |

    Reale gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` und `minimax-portal`: `minimax-fast-mode`
    - `openai` und `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exportiert außerdem das Replay-Familien-
    Enum sowie die gemeinsamen Helper, auf denen diese Familien aufbauen. Häufige öffentliche
    Exporte sind:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - gemeinsame Replay-Builder wie `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` und
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini-Replay-Helper wie `sanitizeGoogleGeminiReplayHistory(...)`
      und `resolveTaggedReasoningOutputMode()`
    - Endpoint-/Modell-Helper wie `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` und
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` stellt sowohl den Familien-Builder als auch
    die öffentlichen Wrapper-Helper bereit, die diese Familien wiederverwenden. Häufige öffentliche Exporte
    sind:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - gemeinsame OpenAI-/Codex-Wrapper wie
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` und
      `createCodexNativeWebSearchWrapper(...)`
    - gemeinsame Proxy-/Provider-Wrapper wie `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` und `createMinimaxFastModeWrapper(...)`

    Einige Stream-Helper bleiben absichtlich providerlokal. Aktuelles gebündeltes
    Beispiel: `@openclaw/anthropic-provider` exportiert
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die
    niedrigerstufigen Anthropic-Wrapper-Builder über seine öffentliche Seam `api.ts` /
    `contract-api.ts`. Diese Helper bleiben Anthropic-spezifisch, weil
    sie auch das Claude-OAuth-Beta-Handling und `context1m`-Gating kodieren.

    Andere gebündelte Provider behalten ebenfalls transportspezifische Wrapper lokal, wenn
    das Verhalten nicht sauber über Familien hinweg geteilt wird. Aktuelles Beispiel: das
    gebündelte xAI-Plugin behält natives xAI-Responses-Shaping in seinem eigenen
    `wrapStreamFn`, einschließlich Umschreibungen für `/fast`-Aliasse, standardmäßigem `tool_stream`,
    Bereinigung nicht unterstützter Strict-Tool-Fälle und xAI-spezifischer Entfernung von Reasoning-Payloads.

    `openclaw/plugin-sdk/provider-tools` stellt derzeit eine gemeinsame
    Tool-Schema-Familie plus gemeinsame Schema-/Kompat-Helper bereit:

    - `ProviderToolCompatFamily` dokumentiert heute das gemeinsame Familieninventar.
    - `buildProviderToolCompatFamilyHooks("gemini")` verdrahtet Gemini-Schema-
      Bereinigung + Diagnose für Provider, die Gemini-sichere Tool-Schemata benötigen.
    - `normalizeGeminiToolSchemas(...)` und `inspectGeminiToolSchemas(...)`
      sind die zugrunde liegenden öffentlichen Gemini-Schema-Helper.
    - `resolveXaiModelCompatPatch()` gibt den gebündelten xAI-Kompat-Patch zurück:
      `toolSchemaProfile: "xai"`, nicht unterstützte Schema-Keywords, native
      Unterstützung für `web_search` und HTML-Entity-Dekodierung von Tool-Call-Argumenten.
    - `applyXaiModelCompat(model)` wendet denselben xAI-Kompat-Patch auf ein
      aufgelöstes Modell an, bevor es den Runner erreicht.

    Reales gebündeltes Beispiel: Das xAI-Plugin verwendet `normalizeResolvedModel` plus
    `contributeResolvedModelCompat`, um diese Kompat-Metadaten beim
    Provider zu belassen, statt xAI-Regeln im Core hart zu kodieren.

    Dasselbe Muster auf Paket-Root-Ebene unterstützt auch andere gebündelte Provider:

    - `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
      Helper für Standardmodelle und Realtime-Provider-Builder
    - `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder
      plus Onboarding-/Konfigurations-Helper

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
        Für Provider, die benutzerdefinierte Anfrage-Header oder Body-Änderungen benötigen:

        ```typescript
        // wrapStreamFn gibt eine aus ctx.streamFn abgeleitete StreamFn zurück
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
      <Tab title="Nutzung und Abrechnung">
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

    <Accordion title="Alle verfügbaren Provider-Hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2-3:

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für Base-URL |
      | 2 | `applyConfigDefaults` | Providereigene globale Standardwerte während der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung von Legacy-/Preview-Modell-ID-Aliasen vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von Providereigenschaften `api` / `baseUrl` vor generischer Modellzusammenstellung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Nutzungs-Kompat-Umschreibungen für Konfigurations-Provider |
      | 7 | `resolveConfigApiKey` | Providereigene Env-Marker-Auth-Auflösung |
      | 8 | `resolveSyntheticAuth` | Synthetische Auth für lokal/selbst gehostet oder aus Konfiguration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische Platzhalter für gespeicherte Profile hinter Env-/Konfigurations-Auth priorisieren |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchrones Abrufen von Metadaten vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |

    Laufzeit-Fallback-Hinweise:

    - `normalizeConfig` prüft zuerst den passenden Provider, dann andere
      Provider Plugins mit Hook-Unterstützung, bis eines die Konfiguration tatsächlich ändert.
      Wenn kein Provider-Hook einen unterstützten Konfigurationseintrag der Google-Familie umschreibt, wird weiterhin
      der gebündelte Google-Konfigurations-Normalisierer angewendet.
    - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er bereitgestellt wird. Der gebündelte
      Pfad `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver,
      obwohl Bedrock-Laufzeit-Auth selbst weiterhin die Standard-
      Chain des AWS SDK verwendet.
      | 13 | `contributeResolvedModelCompat` | Kompat-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Legacy-statischer Capabilities-Bag; nur für Kompatibilität |
      | 15 | `normalizeToolSchemas` | Providereigene Bereinigung von Tool-Schemata vor der Registrierung |
      | 16 | `inspectToolSchemas` | Providereigene Diagnosen für Tool-Schemata |
      | 17 | `resolveReasoningOutputMode` | Vertrag für getaggte vs. native Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Anfrageparameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Sitzungs-Header/Cool-down |
      | 23 | `formatApiKey` | Benutzerdefinierte Laufzeit-Token-Form |
      | 24 | `refreshOAuth` | Benutzerdefiniertes OAuth-Refresh |
      | 25 | `buildAuthDoctorHint` | Anleitung zur Reparatur von Auth |
      | 26 | `matchesContextOverflowError` | Providereigene Erkennung von Overflow |
      | 27 | `classifyFailoverReason` | Providereigene Klassifizierung von Rate-Limit/Überlastung |
      | 28 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Auth |
      | 30 | `suppressBuiltInModel` | Veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Forward-Compat-Zeilen |
      | 32 | `resolveThinkingProfile` | Modellspezifische `/think`-Optionsmenge |
      | 33 | `isBinaryThinking` | Kompatibilität für binäres Thinking ein/aus |
      | 34 | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning-Unterstützung |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilität für die Standardrichtlinie von `/think` |
      | 36 | `isModernModelRef` | Abgleich für Live-/Smoke-Modelle |
      | 37 | `prepareRuntimeAuth` | Token-Austausch vor Inferenz |
      | 38 | `resolveUsageAuth` | Benutzerdefiniertes Parsing von Nutzungs-Anmeldedaten |
      | 39 | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungs-Endpoint |
      | 40 | `createEmbeddingProvider` | Providereigener Embedding-Adapter für Memory/Suche |
      | 41 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transcript-Replay/Compaction |
      | 42 | `sanitizeReplayHistory` | Providerspezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 43 | `validateReplayTurns` | Strikte Replay-Turn-Validierung vor dem eingebetteten Runner |
      | 44 | `onModelSelected` | Callback nach Auswahl (z. B. Telemetrie) |

      Hinweis zum Prompt-Tuning:

      - `resolveSystemPromptContribution` erlaubt einem Provider, cachebewusste
        System-Prompt-Hinweise für eine Modellfamilie zu injizieren. Bevorzuge es gegenüber
        `before_prompt_build`, wenn das Verhalten zu einer Provider-/Modell-
        Familie gehört und die stabile/dynamische Cache-Aufteilung beibehalten werden soll.

      Detaillierte Beschreibungen und Beispiele aus der Praxis findest du unter
      [Internals: Provider Runtime Hooks](/de/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Funktionen hinzufügen (optional)">
    <a id="step-5-add-extra-capabilities"></a>
    Ein Provider Plugin kann zusätzlich zur Textinferenz Sprachsynthese, Realtime-Transkription, Realtime-
    Sprache, Medienverständnis, Bilderzeugung, Videoerzeugung, Webabruf
    und Websuche registrieren:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw klassifiziert dies als Plugin mit **hybrid-capability**. Das ist das
    empfohlene Muster für Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe
    [Internals: Capability Ownership](/de/plugins/architecture#capability-ownership-model).

    Für die Videoerzeugung bevorzuge die oben gezeigte, modusbewusste Capabilities-Form:
    `generate`, `imageToVideo` und `videoToVideo`. Flache aggregierte Felder wie
    `maxInputImages`, `maxInputVideos` und `maxDurationSeconds` reichen nicht
    aus, um Unterstützung für Transformationsmodi oder deaktivierte Modi sauber zu bewerben.

    Bevorzuge den gemeinsamen WebSocket-Helper für streamende STT-Provider. Er hält
    Proxy-Capture, Reconnect-Backoff, Flush bei Close, Ready-Handshakes, Audio-
    Queueing und Diagnose von Close-Ereignissen über Provider hinweg konsistent, während
    der Providercode nur für das Mapping der Upstream-Ereignisse verantwortlich bleibt.

    Batch-STT-Provider, die Multipart-Audio per POST senden, sollten
    `buildAudioTranscriptionFormData(...)` aus
    `openclaw/plugin-sdk/provider-http` zusammen mit den HTTP-Anfrage-
    Helpern für Provider verwenden. Der Form-Helper normalisiert Upload-Dateinamen, einschließlich AAC-Uploads,
    die für kompatible Transkriptions-APIs einen Dateinamen im Stil von M4A benötigen.

    Provider für Musikerzeugung sollten demselben Muster folgen:
    `generate` für promptbasierte Erzeugung und `edit` für referenzbildbasierte
    Erzeugung. Flache aggregierte Felder wie `maxInputImages`,
    `supportsLyrics` und `supportsFormat` reichen nicht aus, um Unterstützung für `edit`
    zu bewerben; explizite Blöcke `generate` / `edit` sind der erwartete Vertrag.

  </Step>

  <Step title="Testen">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportiere dein Provider-Konfigurationsobjekt aus index.ts oder einer dedizierten Datei
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

Provider Plugins werden genauso veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwende hier nicht den veralteten Alias zum Veröffentlichen nur für Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit Provider-Auth-Metadaten
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Nutzungs-Endpoint (optional)
```

## Referenz für Katalogreihenfolge

`catalog.order` steuert, wann dein Katalog relativ zu integrierten
Providern zusammengeführt wird:

| Reihenfolge | Wann          | Anwendungsfall                                 |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Erster Durchlauf | Einfache Provider mit API-Key                |
| `profile` | Nach `simple` | Provider, die von Auth-Profilen abhängig sind |
| `paired`  | Nach `profile` | Mehrere zusammengehörige Einträge synthetisieren |
| `late`    | Letzter Durchlauf | Vorhandene Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel Plugins](/de/plugins/sdk-channel-plugins) — wenn dein Plugin auch einen Kanal bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — Helper `api.runtime` (TTS, Suche, Subagent)
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [Plugin Internals](/de/plugins/architecture#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele
