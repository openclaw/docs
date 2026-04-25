---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin.
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen.
    - Sie müssen Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen.
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Erstellen von Provider-Plugins
x-i18n:
    generated_at: "2026-04-25T13:53:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Diese Anleitung führt Sie Schritt für Schritt durch das Erstellen eines Provider-Plugins, das einen Modell-Provider
(LLM) zu OpenClaw hinzufügt. Am Ende haben Sie einen Provider mit Modellkatalog,
API-Key-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paket-
  struktur und die Einrichtung des Manifests.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zum normalen Inferenz-Loop von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon laufen muss, der Threads, Compaction oder Tool-
  Ereignisse besitzt, kombinieren Sie den Provider stattdessen mit einem [agent harness](/de/plugins/sdk-agent-harness),
  anstatt Protokolldetails des Daemons in den Core einzubauen.
</Tip>

## Walkthrough

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
    Anmeldedaten erkennen kann, ohne Ihre Plugin-Runtime zu laden. Fügen Sie `providerAuthAliases`
    hinzu, wenn eine Provider-Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport`
    ist optional und ermöglicht OpenClaw, Ihr Provider-Plugin automatisch aus Kurzformen
    von Modell-IDs wie `acme-large` zu laden, bevor Runtime-Hooks existieren. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind die Felder `openclaw.compat` und `openclaw.build`
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

    Damit haben Sie einen funktionierenden Provider. Benutzer können jetzt
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als ihr Modell auswählen.

    Wenn der Upstream-Provider andere Steuertokens als OpenClaw verwendet, fügen Sie
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

    `input` schreibt den endgültigen System-Prompt und den Inhalt von Textnachrichten vor
    dem Transport um. `output` schreibt Assistant-Textdeltas und endgültigen Text um, bevor
    OpenClaw seine eigenen Kontrollmarker oder die Channel-Zustellung parst.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Key-
    Authentifizierung plus eine einzelne kataloggestützte Runtime registrieren, bevorzugen Sie den engeren
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
    `buildStaticProvider` nur für Offline-Zeilen, die vor der Konfiguration der Authentifizierung sicher angezeigt werden können; es darf weder Anmeldedaten benötigen noch Netzwerkanfragen ausführen.
    Die Anzeige `models list --all` von OpenClaw führt derzeit statische Kataloge
    nur für gebündelte Provider-Plugins aus, mit leerer Konfiguration, leerer env und ohne
    Agent-/Workspace-Pfade.

    Wenn Ihr Auth-Flow auch `models.providers.*`, Aliasse und das Standardmodell
    des Agent während des Onboardings patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn ein nativer Endpunkt eines Providers gestreamte Nutzungsblöcke auf dem
    normalen Transport `openai-completions` unterstützt, bevorzugen Sie die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared`, statt provider-id-Prüfungen fest zu codieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen Unterstützung aus der
    Endpunkt-Fähigkeitszuordnung, sodass native Endpunkte im Stil von Moonshot/DashScope weiterhin Opt-in aktivieren, selbst wenn ein Plugin eine benutzerdefinierte Provider-ID verwendet.

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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für asynchrones
    Warm-up — `resolveDynamicModel` wird nach dessen Abschluss erneut ausgeführt.

  </Step>

  <Step title="Runtime-Hooks hinzufügen (nach Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Helper-Builder decken nun die häufigsten Familien für Replay/Tool-Kompatibilität ab,
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

    Heute verfügbare Replay-Familien:

    | Familie | Was sie verdrahtet | Gebündelte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen der Reihenfolge „Assistant zuerst“ und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, gewählt anhand von `modelId`, sodass Transporte für Anthropic-Nachrichten nur dann Claude-spezifische Bereinigung von Thinking-Blöcken erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bereinigung von Bootstrap-Replays und markierter Modus für Reasoning-Ausgaben | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert weder native Gemini-Replay-Validierung noch Bootstrap-Umschreibungen | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die Oberflächen für Anthropic-Nachrichten und OpenAI-kompatible Modelle in einem Plugin mischen; optionales Verwerfen von Thinking-Blöcken nur für Claude bleibt auf die Anthropic-Seite beschränkt | `minimax` |

    Heute verfügbare Stream-Familien:

    | Familie | Was sie verdrahtet | Gebündelte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Nutzlasten auf dem gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs eingefügtes Thinking überspringen | `kilocode` |
    | `moonshot-thinking` | Zuordnung binärer nativer Thinking-Nutzlasten von Moonshot aus Konfiguration + `/think`-Level | `moonshot` |
    | `minimax-fast-mode` | Umschreiben des MiniMax-Fast-Mode-Modells auf dem gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame native OpenAI-/Codex-Responses-Wrapper: Attributions-Header, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche, Reasoning-kompatible Nutzlastformung und Kontextverwaltung für Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen bei nicht unterstützten Modellen/`auto` zentral behandelt wird | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming möchten, sofern es nicht explizit deaktiviert ist | `zai` |

    <Accordion title="SDK-Nähte, die die Family-Builder antreiben">
      Jeder Family-Builder ist aus Low-Level-Public-Helpern zusammengesetzt, die aus demselben Paket exportiert werden und auf die Sie zurückgreifen können, wenn ein Provider vom gemeinsamen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die rohen Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert außerdem Gemini-Replay-Helper (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) und Endpunkt-/Modell-Helper (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` sowie die gemeinsamen OpenAI-/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) und gemeinsame Proxy-/Provider-Wrapper (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, zugrunde liegende Gemini-Schema-Helper (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) und xAI-Kompatibilitäts-Helper (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Das gebündelte xAI-Plugin verwendet `normalizeResolvedModel` + `contributeResolvedModelCompat` zusammen mit diesen, damit xAI-Regeln dem Provider zugeordnet bleiben.

      Einige Stream-Helper bleiben absichtlich providerlokal. `@openclaw/anthropic-provider` behält `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-Builder für Anthropic-Wrapper in seiner eigenen öffentlichen Nahtstelle `api.ts` / `contract-api.ts`, weil sie die Claude-OAuth-Beta-Behandlung und `context1m`-Gating kodieren. Das xAI-Plugin behält ähnlich die native Formung von xAI-Responses in seinem eigenen `wrapStreamFn` (Aliasse für `/fast`, standardmäßiges `tool_stream`, Bereinigung nicht unterstützter strikter Tools, Entfernen von xAI-spezifischen Reasoning-Nutzlasten).

      Dasselbe Muster auf Paket-Root-Ebene steckt auch hinter `@openclaw/openai-provider` (Provider-Builder, Helper für Standardmodelle, Builder für Realtime-Provider) und `@openclaw/openrouter-provider` (Provider-Builder plus Helper für Onboarding/Konfiguration).
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
        Für Provider, die native Request-/Sitzungs-Header oder Metadaten auf
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
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2-3:

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für `baseUrl` |
      | 2 | `applyConfigDefaults` | Provider-eigene globale Standardwerte während der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung veralteter/Vorschau-Aliasse für Modell-IDs vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für Provider-Familien vor der generischen Modellzusammenstellung |
      | 5 | `normalizeConfig` | Normalisierung der Konfiguration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Kompatibilitäts-Umschreibungen für natives Streaming-Usage bei Konfigurations-Providern |
      | 7 | `resolveConfigApiKey` | Provider-eigene Auflösung von env-Markern für Authentifizierung |
      | 8 | `resolveSyntheticAuth` | Synthetische Authentifizierung lokal/selbst gehostet oder konfigurationsgestützt |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische Platzhalter für gespeicherte Profile hinter env-/Config-Authentifizierung niedriger priorisieren |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchrones Abrufen von Metadaten vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Veralteter statischer Capability-Bag; nur zur Kompatibilität |
      | 15 | `normalizeToolSchemas` | Provider-eigene Bereinigung von Tool-Schemas vor der Registrierung |
      | 16 | `inspectToolSchemas` | Provider-eigene Diagnose von Tool-Schemas |
      | 17 | `resolveReasoningOutputMode` | Vertrag für markierte vs. native Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Wrapper für benutzerdefinierte Header/Bodys auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Sitzungs-Header/Abklingzeit |
      | 23 | `formatApiKey` | Benutzerdefinierte Form von Runtime-Tokens |
      | 24 | `refreshOAuth` | Benutzerdefiniertes OAuth-Refresh |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Reparatur der Authentifizierung |
      | 26 | `matchesContextOverflowError` | Provider-eigene Erkennung von Overflow |
      | 27 | `classifyFailoverReason` | Provider-eigene Klassifizierung von Ratenlimit/Überlastung |
      | 28 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | 30 | `suppressBuiltInModel` | Veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Zeilen für Vorwärtskompatibilität |
      | 32 | `resolveThinkingProfile` | Modellspezifische Menge von `/think`-Optionen |
      | 33 | `isBinaryThinking` | Kompatibilität für binäres Thinking an/aus |
      | 34 | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning-Unterstützung |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilität für Standardrichtlinie von `/think` |
      | 36 | `isModernModelRef` | Abgleich von Live-/Smoke-Modellen |
      | 37 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 38 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Nutzung-Anmeldedaten |
      | 39 | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungs-Endpunkt |
      | 40 | `createEmbeddingProvider` | Provider-eigener Embedding-Adapter für Memory/Suche |
      | 41 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Replay/Compaction von Transkripten |
      | 42 | `sanitizeReplayHistory` | Providerspezifische Umschreibungen von Replay nach generischer Bereinigung |
      | 43 | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 44 | `onModelSelected` | Callback nach der Auswahl (z. B. Telemetrie) |

      Hinweise zu Runtime-Fallbacks:

      - `normalizeConfig` prüft zuerst den passenden Provider, dann andere Hook-fähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt, wird weiterhin der gebündelte Google-Konfigurations-Normalizer angewendet.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er verfügbar gemacht wird. Der gebündelte Pfad `amazon-bedrock` hat hier außerdem einen integrierten Resolver für AWS-env-Marker, obwohl die Runtime-Authentifizierung von Bedrock selbst weiterhin die AWS-SDK-Standardkette verwendet.
      - `resolveSystemPromptContribution` erlaubt es einem Provider, cachebewusste System-Prompt-Hinweise für eine Modellfamilie einzuschleusen. Bevorzugen Sie dies gegenüber `before_prompt_build`, wenn das Verhalten zu einer einzelnen Provider-/Modellfamilie gehört und die stabile/dynamische Cache-Aufteilung erhalten bleiben soll.

      Detaillierte Beschreibungen und Beispiele aus der Praxis finden Sie unter [Internals: Provider Runtime Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    Ein Provider-Plugin kann Sprache, Realtime-Transkription, Realtime-
    Sprache, Medienverständnis, Bildgenerierung, Videogenerierung, Web Fetch
    und Websuche neben der Textinferenz registrieren. OpenClaw klassifiziert dies als
    **hybrid-capability**-Plugin — das empfohlene Muster für Unternehmens-Plugins
    (ein Plugin pro Vendor). Siehe
    [Internals: Capability Ownership](/de/plugins/architecture#capability-ownership-model).

    Registrieren Sie jede Fähigkeit innerhalb von `register(api)` neben Ihrem bestehenden
    Aufruf `api.registerProvider(...)`. Wählen Sie nur die Tabs aus, die Sie benötigen:

    <Tabs>
      <Tab title="Sprache (TTS)">
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
        Plugins gemeinsame begrenzte Fehlertext-Lesevorgänge, JSON-Fehleranalyse und
        Request-ID-Suffixe nutzen.
      </Tab>
      <Tab title="Echtzeit-Transkription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` — der gemeinsame
        Helfer übernimmt Proxy-Erfassung, Wiederverbindungs-Backoff, Flush beim Schließen, Ready-
        Handshakes, Audio-Warteschlangen und Diagnosen von Close-Events. Ihr Plugin
        ordnet nur Upstream-Ereignisse zu.

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
        `openclaw/plugin-sdk/provider-http` verwenden. Der Helfer normalisiert Upload-
        Dateinamen, einschließlich AAC-Uploads, die für kompatible Transkriptions-APIs
        einen Dateinamen im M4A-Stil benötigen.
      </Tab>
      <Tab title="Echtzeit-Stimme">
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
        Videofunktionen verwenden eine **modusbewusste** Form: `generate`,
        `imageToVideo` und `videoToVideo`. Flache aggregierte Felder wie
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` reichen
        nicht aus, um Unterstützung für Transformationsmodi oder deaktivierte Modi sauber
        anzugeben. Musikgenerierung folgt demselben Muster mit expliziten Blöcken
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
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
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
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportieren Sie Ihr Provider-Konfigurationsobjekt aus index.ts oder einer dedizierten Datei
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

Provider-Plugins werden auf dieselbe Weise veröffentlicht wie jeder andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den veralteten reinen-Skills-Veröffentlichungsalias; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit Provider-Auth-Metadaten
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage-Endpunkt (optional)
```

## Referenz zur Catalog-Reihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu integrierten
Providern zusammengeführt wird:

| Reihenfolge | Zeitpunkt     | Anwendungsfall                                |
| ----------- | ------------- | --------------------------------------------- |
| `simple`    | Erster Durchlauf | Einfache Provider mit API-Schlüssel        |
| `profile`   | Nach simple   | Provider, die von Auth-Profilen abhängen      |
| `paired`    | Nach profile  | Mehrere zusammengehörige Einträge synthetisieren |
| `late`      | Zuletzt       | Vorhandene Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — `api.runtime`-Helfer (TTS, Suche, Subagent)
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [Plugin Internals](/de/plugins/architecture-internals#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele

## Verwandt

- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
- [Building channel plugins](/de/plugins/sdk-channel-plugins)
