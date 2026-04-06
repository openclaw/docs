---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Sie müssen Provider-Authentifizierung, Kataloge und Laufzeit-Hooks verstehen
sidebarTitle: Provider Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-04-06T03:11:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69500f46aa2cfdfe16e85b0ed9ee3c0032074be46f2d9c9d2940d18ae1095f47
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Provider-Plugins erstellen

Diese Anleitung führt Sie durch die Erstellung eines Provider-Plugins, das einen Modell-Provider
(LLM) zu OpenClaw hinzufügt. Am Ende haben Sie einen Provider mit einem Modellkatalog,
API-Key-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Einrichtung des Manifests.
</Info>

## Anleitung

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
    Anmeldedaten erkennen kann, ohne Ihre Plugin-Laufzeit zu laden. `modelSupport` ist optional
    und ermöglicht es OpenClaw, Ihr Provider-Plugin anhand von Kurzform-Modell-IDs
    wie `acme-large` automatisch zu laden, bevor Laufzeit-Hooks vorhanden sind. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
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
    `acme-ai/acme-large` als Modell auswählen.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Key-
    Authentifizierung und einer einzelnen kataloggestützten Laufzeit registrieren, sollten Sie den enger gefassten
    Helper `defineSingleProviderPluginEntry(...)` bevorzugen:

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
        },
      },
    });
    ```

    Wenn Ihr Auth-Ablauf auch `models.providers.*`, Aliasse und
    das Standardmodell des Agenten während des Onboardings patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn ein nativer Endpoint eines Providers gestreamte Usage-Blöcke auf dem
    normalen Transport `openai-completions` unterstützt, sollten Sie die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared` bevorzugen, statt Provider-ID-Prüfungen fest zu codieren.
    `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen die Unterstützung anhand der
    Endpoint-Fähigkeitszuordnung, sodass native Endpoints im Stil von Moonshot/DashScope sich weiterhin
    einschalten, auch wenn ein Plugin eine benutzerdefinierte Provider-ID verwendet.

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

    Wenn für die Auflösung ein Netzwerkaufruf erforderlich ist, verwenden Sie `prepareDynamicModel` für asynchrones
    Aufwärmen — `resolveDynamicModel` wird nach dessen Abschluss erneut ausgeführt.

  </Step>

  <Step title="Laufzeit-Hooks hinzufügen (nach Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Helper-Builder decken jetzt die häufigsten Familien für Replay- und Tool-Kompatibilität ab,
    sodass Plugins normalerweise nicht jeden Hook einzeln verdrahten müssen:

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

    | Family | Was sie verdrahtet |
    | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen der Reihenfolge „Assistent zuerst“ und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, ausgewählt nach `modelId`, sodass Transports für Anthropic-Nachrichten nur dann Claude-spezifische Bereinigung von Thinking-Blöcken erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bootstrap-Replay-Bereinigung und markierter Modus für Reasoning-Ausgaben |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signatures für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert keine native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die Anthropic-Nachrichtenoberflächen und OpenAI-kompatible Modelloberflächen in einem Plugin kombinieren; optionales Verwerfen von nur-Claude-Thinking-Blöcken bleibt auf den Anthropic-Teil beschränkt |

    Echte gebündelte Beispiele:

    - `google`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` und `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` und `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` und `zai`: `openai-compatible`

    Verfügbare Stream-Familien heute:

    | Family | Was sie verdrahtet |
    | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Payloads auf dem gemeinsamen Stream-Pfad |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs eingefügtes Thinking überspringen |
    | `moonshot-thinking` | Zuordnung nativer binärer Thinking-Payloads von Moonshot aus Konfiguration + `/think`-Level |
    | `minimax-fast-mode` | Umschreibung von MiniMax-Fast-Mode-Modellen auf dem gemeinsamen Stream-Pfad |
    | `openai-responses-defaults` | Gemeinsame native OpenAI/Codex-Responses-Wrapper: Attribution-Header, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Web-Suche, Reasoning-kompatible Payload-Formung und Context-Management für Responses |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen für nicht unterstützte Modelle/`auto` zentral behandelt wird |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming möchten, sofern es nicht explizit deaktiviert wird |

    Echte gebündelte Beispiele:

    - `google`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` und `minimax-portal`: `minimax-fast-mode`
    - `openai` und `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exportiert auch das Enum der Replay-Familien sowie die gemeinsamen Helper, aus denen diese Familien aufgebaut sind. Häufige öffentliche Exporte
    umfassen:

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
    umfassen:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - gemeinsame OpenAI/Codex-Wrapper wie
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` und
      `createCodexNativeWebSearchWrapper(...)`
    - gemeinsame Proxy-/Provider-Wrapper wie `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` und `createMinimaxFastModeWrapper(...)`

    Einige Stream-Helper bleiben absichtlich Provider-lokal. Aktuelles gebündeltes
    Beispiel: `@openclaw/anthropic-provider` exportiert
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` sowie die
    darunterliegenden Anthropic-Wrapper-Builder über seine öffentliche Nahtstelle `api.ts` /
    `contract-api.ts`. Diese Helper bleiben Anthropic-spezifisch, weil
    sie auch die Behandlung von Claude-OAuth-Betas und `context1m`-Steuerung kodieren.

    Andere gebündelte Provider behalten ebenfalls transportspezifische Wrapper lokal, wenn
    sich das Verhalten nicht sauber über Familien hinweg teilen lässt. Aktuelles Beispiel: das
    gebündelte xAI-Plugin behält die native Formung von xAI-Responses in seinem eigenen
    `wrapStreamFn`, einschließlich Umschreibungen von `/fast`-Aliasen, standardmäßigem `tool_stream`,
    Bereinigung nicht unterstützter Strict-Tools und xAI-spezifischer Entfernung von
    Reasoning-Payloads.

    `openclaw/plugin-sdk/provider-tools` stellt derzeit eine gemeinsame
    Tool-Schema-Familie sowie gemeinsame Schema-/Kompatibilitäts-Helper bereit:

    - `ProviderToolCompatFamily` dokumentiert heute das gemeinsame Familieninventar.
    - `buildProviderToolCompatFamilyHooks("gemini")` verdrahtet Gemini-Schema-
      Bereinigung + Diagnose für Provider, die Gemini-sichere Tool-Schemas benötigen.
    - `normalizeGeminiToolSchemas(...)` und `inspectGeminiToolSchemas(...)`
      sind die zugrunde liegenden öffentlichen Gemini-Schema-Helper.
    - `resolveXaiModelCompatPatch()` gibt den gebündelten xAI-Kompatibilitätspatch zurück:
      `toolSchemaProfile: "xai"`, nicht unterstützte Schema-Schlüsselwörter, native
      Unterstützung für `web_search` und Dekodierung von Tool-Call-Argumenten mit HTML-Entities.
    - `applyXaiModelCompat(model)` wendet denselben xAI-Kompatibilitätspatch auf ein
      aufgelöstes Modell an, bevor es den Runner erreicht.

    Echtes gebündeltes Beispiel: Das xAI-Plugin verwendet `normalizeResolvedModel` plus
    `contributeResolvedModelCompat`, um diese Kompatibilitätsmetadaten im Besitz des
    Providers zu halten, statt xAI-Regeln im Core fest zu codieren.

    Dasselbe Muster am Paket-Root unterstützt auch andere gebündelte Provider:

    - `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
      Helper für Standardmodelle und Realtime-Provider-Builder
    - `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder
      sowie Helper für Onboarding/Konfiguration

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
        Für Provider, die native Request-/Session-Header oder Metadaten auf
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
      | 1 | `catalog` | Modellkatalog oder Standardwerte für Base URL |
      | 2 | `applyConfigDefaults` | Provider-eigene globale Standardwerte bei der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung veralteter/Vorschau-Aliasse von Modell-IDs vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für die Provider-Familie vor der generischen Modellzusammenstellung |
      | 5 | `normalizeConfig` | Normalisiert die Konfiguration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitätsumschreibungen für Konfigurations-Provider |
      | 7 | `resolveConfigApiKey` | Provider-eigene Auflösung von Env-Marker-Authentifizierung |
      | 8 | `resolveSyntheticAuth` | Synthetische lokale/self-hosted oder konfigurationsgestützte Authentifizierung |
      | 9 | `shouldDeferSyntheticProfileAuth` | Ordnet synthetische gespeicherte Profil-Platzhalter unter Env-/Konfigurations-Auth ein |
      | 10 | `resolveDynamicModel` | Akzeptiert beliebige Upstream-Modell-IDs |
      | 11 | `prepareDynamicModel` | Asynchrones Abrufen von Metadaten vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |

    Hinweise zum Laufzeit-Fallback:

    - `normalizeConfig` prüft zuerst den passenden Provider und dann andere
      Provider-Plugins mit Hook-Fähigkeit, bis eines die Konfiguration tatsächlich ändert.
      Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt,
      wird weiterhin der gebündelte Google-Konfigurations-Normalizer angewendet.
    - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er verfügbar ist. Der gebündelte
      Pfad `amazon-bedrock` hat hier außerdem einen integrierten AWS-Resolver für Env-Marker,
      obwohl die Bedrock-Laufzeit-Authentifizierung selbst weiterhin die Standardkette des AWS SDK verwendet.
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Veraltete statische Capability-Bag; nur zur Kompatibilität |
      | 15 | `normalizeToolSchemas` | Provider-eigene Bereinigung von Tool-Schemas vor der Registrierung |
      | 16 | `inspectToolSchemas` | Provider-eigene Diagnose von Tool-Schemas |
      | 17 | `resolveReasoningOutputMode` | Vertrag für markierte vs. native Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Session-Header/Cooldown |
      | 23 | `formatApiKey` | Benutzerdefinierte Form des Laufzeit-Tokens |
      | 24 | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Auth-Reparatur |
      | 26 | `matchesContextOverflowError` | Provider-eigene Erkennung von Kontextüberlauf |
      | 27 | `classifyFailoverReason` | Provider-eigene Klassifizierung von Rate-Limit/Überlastung |
      | 28 | `isCacheTtlEligible` | Steuerung der TTL für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Auth |
      | 30 | `suppressBuiltInModel` | Versteckt veraltete Upstream-Zeilen |
      | 31 | `augmentModelCatalog` | Synthetische Zeilen für Vorwärtskompatibilität |
      | 32 | `isBinaryThinking` | Binäres Thinking ein/aus |
      | 33 | `supportsXHighThinking` | Unterstützung für `xhigh`-Reasoning |
      | 34 | `resolveDefaultThinkingLevel` | Standardrichtlinie für `/think` |
      | 35 | `isModernModelRef` | Modellabgleich für Live-/Smoke-Tests |
      | 36 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 37 | `resolveUsageAuth` | Benutzerdefinierte Verarbeitung von Usage-Anmeldedaten |
      | 38 | `fetchUsageSnapshot` | Benutzerdefinierter Usage-Endpoint |
      | 39 | `createEmbeddingProvider` | Provider-eigener Embedding-Adapter für Memory/Search |
      | 40 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Replay/Kompaktierung von Transkripten |
      | 41 | `sanitizeReplayHistory` | Provider-spezifische Replay-Umschreibungen nach allgemeiner Bereinigung |
      | 42 | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 43 | `onModelSelected` | Callback nach der Auswahl (z. B. Telemetrie) |

      Hinweis zur Prompt-Abstimmung:

      - `resolveSystemPromptContribution` ermöglicht einem Provider, Cache-bewusste
        System-Prompt-Hinweise für eine Modellfamilie einzuschleusen. Bevorzugen Sie dies gegenüber
        `before_prompt_build`, wenn das Verhalten zu einer bestimmten Provider-/Modellfamilie gehört
        und die stabile/dynamische Aufteilung des Cache erhalten bleiben soll.

      Detaillierte Beschreibungen und Beispiele aus der Praxis finden Sie unter
      [Interna: Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    <a id="step-5-add-extra-capabilities"></a>
    Ein Provider-Plugin kann neben Textinferenz auch Speech, Realtime-Transkription, Realtime-
    Voice, Media Understanding, Bildgenerierung, Videogenerierung, Web-Fetch
    und Web Search registrieren:

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
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw klassifiziert dies als Plugin mit **hybriden Fähigkeiten**. Dies ist das
    empfohlene Muster für Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe
    [Interna: Fähigkeitszuordnung](/de/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Testen">
    <a id="step-6-test"></a>
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

Provider-Plugins werden auf dieselbe Weise veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den veralteten, nur für Skills gedachten Publish-Alias; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage-Endpoint (optional)
```

## Referenz zur Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog im Verhältnis zu integrierten
Providern zusammengeführt wird:

| Order     | Wann         | Anwendungsfall                               |
| --------- | ------------ | -------------------------------------------- |
| `simple`  | Erster Durchlauf | Einfache Provider mit API-Key                 |
| `profile` | Nach `simple` | Provider, die von Auth-Profilen abhängig sind |
| `paired`  | Nach `profile` | Erzeugt mehrere zusammengehörige Einträge     |
| `late`    | Letzter Durchlauf | Überschreibt vorhandene Provider (gewinnt bei Kollision) |

## Nächste Schritte

- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK-Laufzeit](/de/plugins/sdk-runtime) — Helper für `api.runtime` (TTS, Suche, Subagent)
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [Plugin-Interna](/de/plugins/architecture#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele
