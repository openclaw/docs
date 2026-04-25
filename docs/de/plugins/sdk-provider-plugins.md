---
read_when:
    - Sie erstellen ein neues Modellanbieter-Plugin.
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen.
    - Sie müssen Anbieter-Authentifizierung, Kataloge und Laufzeit-Hooks verstehen.
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modellanbieter-Plugins für OpenClaw
title: Erstellen von Anbieter-Plugins
x-i18n:
    generated_at: "2026-04-25T18:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Diese Anleitung führt Sie Schritt für Schritt durch das Erstellen eines Anbieter-Plugins, das einen Modellanbieter (LLM) zu OpenClaw hinzufügt. Am Ende haben Sie einen Anbieter mit Modellkatalog, API-Key-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch nie zuvor ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende
  Paketstruktur und die Einrichtung des Manifests.
</Info>

<Tip>
  Anbieter-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon laufen muss, der Threads, Compaction oder Tool-
  Ereignisse verwaltet, kombinieren Sie den Anbieter mit einem [agent harness](/de/plugins/sdk-agent-harness),
  statt Protokolldetails des Daemons im Core unterzubringen.
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
    Anmeldedaten erkennen kann, ohne die Laufzeit Ihres Plugins zu laden. Fügen Sie `providerAuthAliases`
    hinzu, wenn eine Anbietervariante die Authentifizierung einer anderen Anbieter-ID wiederverwenden soll. `modelSupport`
    ist optional und erlaubt OpenClaw, Ihr Anbieter-Plugin automatisch aus Kurzform-
    Modell-IDs wie `acme-large` zu laden, bevor Laufzeit-Hooks existieren. Wenn Sie den
    Anbieter auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Anbieter registrieren">
    Ein minimaler Anbieter benötigt `id`, `label`, `auth` und `catalog`:

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

    Das ist ein funktionierender Anbieter. Benutzer können jetzt
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als ihr Modell auswählen.

    Wenn der Upstream-Anbieter andere Kontroll-Token als OpenClaw verwendet, fügen Sie eine
    kleine bidirektionale Texttransformation hinzu, statt den Stream-Pfad zu ersetzen:

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

    `input` schreibt den endgültigen System-Prompt und den Textnachrichteninhalt vor dem
    Transport um. `output` schreibt Text-Deltas des Assistenten und den endgültigen Text um, bevor
    OpenClaw seine eigenen Kontrollmarker oder die Kanalzustellung verarbeitet.

    Für gebündelte Anbieter, die nur einen Textanbieter mit API-Key-
    Authentifizierung plus eine einzelne kataloggestützte Laufzeit registrieren, verwenden Sie vorzugsweise den engeren
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
    Anbieter-Authentifizierung auflösen kann. Er kann anbieterspezifische Erkennung ausführen. Verwenden Sie
    `buildStaticProvider` nur für Offline-Zeilen, die vor der Authentifizierung gefahrlos angezeigt werden können;
    dafür dürfen weder Anmeldedaten erforderlich sein noch Netzwerkanfragen gestellt werden.
    Die Anzeige `models list --all` von OpenClaw führt statische Kataloge derzeit
    nur für gebündelte Anbieter-Plugins aus, mit leerer Konfiguration, leerer Umgebung und ohne
    Agent-/Workspace-Pfade.

    Wenn Ihr Authentifizierungsablauf außerdem `models.providers.*`, Aliase und
    das Standardmodell des Agenten während des Onboardings patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Anbieters Streamed-Usage-Blöcke auf dem
    normalen Transport `openai-completions` unterstützt, verwenden Sie vorzugsweise die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared`, statt Prüfungen auf Anbieter-IDs hart zu codieren.
    `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen die Unterstützung anhand der Endpunkt-Fähigkeitszuordnung,
    sodass native Endpunkte im Stil von Moonshot/DashScope weiterhin aktiviert werden, selbst wenn ein Plugin
    eine benutzerdefinierte Anbieter-ID verwendet.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn Ihr Anbieter beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
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
    Aufwärmen — `resolveDynamicModel` wird nach Abschluss erneut ausgeführt.

  </Step>

  <Step title="Laufzeit-Hooks hinzufügen (nach Bedarf)">
    Die meisten Anbieter benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Anbieter sie benötigt.

    Gemeinsame Helper-Builder decken jetzt die häufigsten Familien für Wiederholung/Tool-Kompatibilität ab,
    sodass Plugins normalerweise nicht mehr jeden Hook einzeln verdrahten müssen:

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

    Derzeit verfügbare Wiederholungsfamilien:

    | Family | Was dadurch verdrahtet wird | Gebündelte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame Wiederholungsrichtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für die Reihenfolge „Assistent zuerst“ und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-spezifische Wiederholungsrichtlinie, die nach `modelId` ausgewählt wird, sodass Transporte für Anthropic-Messages nur dann Claude-spezifische Bereinigung von Thinking-Blöcken erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-Wiederholungsrichtlinie plus Bootstrap-Bereinigung für Wiederholung und getaggter Modus für Reasoning-Ausgaben | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert weder native Gemini-Wiederholungsvalidierung noch Bootstrap-Umschreibungen | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybridrichtlinie für Anbieter, die in einem Plugin Anthropic-Message- und OpenAI-kompatible Modelloberflächen mischen; optionales Entfernen von Thinking-Blöcken nur für Claude bleibt auf die Anthropic-Seite beschränkt | `minimax` |

    Derzeit verfügbare Stream-Familien:

    | Family | Was dadurch verdrahtet wird | Gebündelte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Payloads auf dem gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und IDs ohne unterstütztes Proxy-Reasoning injiziertes Thinking überspringen | `kilocode` |
    | `moonshot-thinking` | Binäre native-Thinking-Payload-Zuordnung von Moonshot aus Konfiguration + `/think`-Stufe | `moonshot` |
    | `minimax-fast-mode` | Umschreiben von MiniMax-Fast-Mode-Modellen auf dem gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame native OpenAI-/Codex-Responses-Wrapper: Attributionsheader, `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Websuche, Reasoning-kompatible Payload-Anpassung und Responses-Kontextverwaltung | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen bei nicht unterstützten Modellen/`auto` zentral behandelt wird | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Anbieter wie Z.AI, die Tool-Streaming möchten, sofern es nicht ausdrücklich deaktiviert wird | `zai` |

    <Accordion title="SDK-Seams, die die Family-Builder antreiben">
      Jeder Family-Builder ist aus niedrigeren öffentlichen Helpern zusammengesetzt, die aus demselben Paket exportiert werden und auf die Sie zurückgreifen können, wenn ein Anbieter vom üblichen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die rohen Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert außerdem Gemini-Replay-Helper (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) sowie Endpunkt-/Modell-Helper (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` sowie die gemeinsamen OpenAI-/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), den OpenAI-kompatiblen DeepSeek-V4-Wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) und gemeinsame Proxy-/Anbieter-Wrapper (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, zugrunde liegende Gemini-Schema-Helper (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) und xAI-Kompatibilitäts-Helper (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Das gebündelte xAI-Plugin verwendet `normalizeResolvedModel` + `contributeResolvedModelCompat` zusammen mit diesen, damit xAI-Regeln im Besitz des Anbieters bleiben.

      Einige Stream-Helper bleiben absichtlich anbieterlokal. `@openclaw/anthropic-provider` behält `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die niedrigeren Anthropic-Wrapper-Builder in seinem eigenen öffentlichen Seam `api.ts` / `contract-api.ts`, weil sie das Claude-OAuth-Beta-Handling und das `context1m`-Gating kodieren. Das xAI-Plugin behält ebenso die native xAI-Responses-Anpassung in seinem eigenen `wrapStreamFn` (Aliasnamen für `/fast`, standardmäßiges `tool_stream`, Bereinigung nicht unterstützter Strict-Tools, Entfernen xAI-spezifischer Reasoning-Payloads).

      Dasselbe Muster auf Paketwurzelebene unterstützt auch `@openclaw/openai-provider` (Provider-Builder, Default-Model-Helper, Realtime-Provider-Builder) und `@openclaw/openrouter-provider` (Provider-Builder plus Onboarding-/Konfigurations-Helper).
    </Accordion>

    <Tabs>
      <Tab title="Token-Austausch">
        Für Anbieter, die vor jedem Inferenzaufruf einen Token-Austausch benötigen:

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
        Für Anbieter, die benutzerdefinierte Request-Header oder Änderungen am Body benötigen:

        ```typescript
        // wrapStreamFn gibt eine von ctx.streamFn abgeleitete StreamFn zurück
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
        Für Anbieter, die native Request-/Sitzungs-Header oder Metadaten auf
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
        Für Anbieter, die Nutzungs-/Abrechnungsdaten bereitstellen:

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

    <Accordion title="Alle verfügbaren Anbieter-Hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Anbieter verwenden nur 2–3:

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für Basis-URL |
      | 2 | `applyConfigDefaults` | Anbieterverwaltete globale Standardwerte bei der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung veralteter/Vorschau-Modell-ID-Aliase vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für die Anbieterfamilie vor dem generischen Modellaufbau |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitäts-Umschreibungen für Konfigurationsanbieter |
      | 7 | `resolveConfigApiKey` | Anbieterverwaltete Auflösung von Env-Marker-Authentifizierung |
      | 8 | `resolveSyntheticAuth` | Synthetische Authentifizierung lokal/selbstgehostet oder konfigurationsgestützt |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische Platzhalter für gespeicherte Profile hinter Env-/Konfigurationsauthentifizierung absenken |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchrones Abrufen von Metadaten vor dem Auflösen |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Anbietermodelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Veralteter statischer Capability-Bag; nur Kompatibilität |
      | 15 | `normalizeToolSchemas` | Anbieterverwaltete Bereinigung von Tool-Schemata vor der Registrierung |
      | 16 | `inspectToolSchemas` | Anbieterverwaltete Diagnostik für Tool-Schemata |
      | 17 | `resolveReasoningOutputMode` | Vertrag für getaggte vs. native Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Zug |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Sitzungs-Header/Cool-down |
      | 23 | `formatApiKey` | Benutzerdefinierte Form von Laufzeit-Token |
      | 24 | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Reparatur der Authentifizierung |
      | 26 | `matchesContextOverflowError` | Anbieterverwaltete Erkennung von Overflow |
      | 27 | `classifyFailoverReason` | Anbieterverwaltete Klassifizierung von Rate-Limit/Überlastung |
      | 28 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | 30 | `suppressBuiltInModel` | Veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Vorwärtskompatibilitäts-Zeilen |
      | 32 | `resolveThinkingProfile` | Modellspezifischer Optionssatz für `/think` |
      | 33 | `isBinaryThinking` | Kompatibilität für binäres Thinking an/aus |
      | 34 | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning-Unterstützung |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilität für Standardrichtlinie von `/think` |
      | 36 | `isModernModelRef` | Abgleich für Live-/Smoke-Modelle |
      | 37 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 38 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Nutzungs-Anmeldedaten |
      | 39 | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungsendpunkt |
      | 40 | `createEmbeddingProvider` | Anbieterverwalteter Embedding-Adapter für Speicher/Suche |
      | 41 | `buildReplayPolicy` | Benutzerdefinierte Replay-/Compaction-Richtlinie für Transkripte |
      | 42 | `sanitizeReplayHistory` | Anbieterspezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 43 | `validateReplayTurns` | Strikte Validierung von Replay-Zügen vor dem eingebetteten Runner |
      | 44 | `onModelSelected` | Callback nach Auswahl (z. B. Telemetrie) |

      Hinweise zu Laufzeit-Fallbacks:

      - `normalizeConfig` prüft zuerst den passenden Anbieter, dann andere Anbieter-Plugins mit Hook-Unterstützung, bis eines die Konfiguration tatsächlich ändert. Wenn kein Anbieter-Hook einen unterstützten Konfigurationseintrag der Google-Familie umschreibt, gilt weiterhin der gebündelte Google-Konfigurations-Normalisierer.
      - `resolveConfigApiKey` verwendet den Anbieter-Hook, wenn er verfügbar ist. Der gebündelte Pfad `amazon-bedrock` hat hier außerdem einen integrierten AWS-Env-Marker-Resolver, obwohl die Bedrock-Laufzeit-Authentifizierung selbst weiterhin die AWS-SDK-Default-Chain verwendet.
      - `resolveSystemPromptContribution` erlaubt einem Anbieter, cachebewusste System-Prompt-Hinweise für eine Modellfamilie zu injizieren. Bevorzugen Sie dies gegenüber `before_prompt_build`, wenn das Verhalten zu einer Anbieter-/Modellfamilie gehört und die stabile/dynamische Cache-Aufteilung erhalten bleiben soll.

      Detaillierte Beschreibungen und Praxisbeispiele finden Sie unter [Internals: Provider Runtime Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    Ein Anbieter-Plugin kann neben Textinferenz auch Sprache, Realtime-Transkription, Realtime-
    Stimme, Medienverständnis, Bildgenerierung, Videogenerierung, Webabruf
    und Websuche registrieren. OpenClaw klassifiziert dies als
    Plugin mit **hybrid-capability** — das empfohlene Muster für Unternehmens-Plugins
    (ein Plugin pro Anbieter). Siehe
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

        Verwenden Sie `assertOkOrThrowProviderError(...)` für HTTP-Fehler von Anbietern, damit
        Plugins gemeinsame Begrenzungen beim Lesen von Fehler-Bodys, JSON-Fehlerparsing und
        Request-ID-Suffixe nutzen.
      </Tab>
      <Tab title="Echtzeit-Transkription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` — der gemeinsame
        Helper übernimmt Proxy-Erfassung, Reconnect-Backoff, Flush beim Schließen, Ready-
        Handshakes, Audio-Queueing und Diagnostik zu Close-Events. Ihr Plugin bildet
        nur Upstream-Ereignisse ab.

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

        Batch-STT-Anbieter, die Multipart-Audio per POST senden, sollten
        `buildAudioTranscriptionFormData(...)` aus
        `openclaw/plugin-sdk/provider-http` verwenden. Der Helper normalisiert Upload-
        Dateinamen, einschließlich AAC-Uploads, die für kompatible
        Transkriptions-APIs einen Dateinamen im Stil von M4A benötigen.
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
        Videofähigkeiten verwenden eine **modusbewusste** Form: `generate`,
        `imageToVideo` und `videoToVideo`. Flache aggregierte Felder wie
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` reichen nicht aus,
        um Unterstützung für Transformationsmodi oder deaktivierte Modi sauber
        auszuweisen. Musikgenerierung folgt demselben Muster mit expliziten Blöcken
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
      <Tab title="Webabruf und Suche">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Seiten über das Rendering-Backend von Acme abrufen.",
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

## In ClawHub veröffentlichen

Anbieter-Plugins werden auf dieselbe Weise veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den veralteten Alias zum Veröffentlichen nur für Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit Anbieter-Authentifizierungsmetadaten
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Nutzungsendpunkt (optional)
```

## Referenz zur Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu integrierten
Anbietern zusammengeführt wird:

| Reihenfolge | Wann          | Anwendungsfall                               |
| ----------- | ------------- | -------------------------------------------- |
| `simple`    | Erster Durchlauf | Einfache Anbieter mit API-Key              |
| `profile`   | Nach simple   | Anbieter, die von Auth-Profilen abhängen     |
| `paired`    | Nach profile  | Mehrere zusammengehörige Einträge synthetisieren |
| `late`      | Letzter Durchlauf | Vorhandene Anbieter überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — `api.runtime`-Helper (TTS, Suche, Unteragent)
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [Plugin Internals](/de/plugins/architecture-internals#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele

## Verwandt

- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
- [Building channel plugins](/de/plugins/sdk-channel-plugins)
