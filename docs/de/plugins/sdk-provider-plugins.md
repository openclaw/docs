---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin
    - Sie möchten OpenClaw einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM hinzufügen
    - Sie müssen die Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen.
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-07-12T15:48:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Erstellen Sie ein Provider-Plugin, um OpenClaw einen Modell-Provider (LLM) hinzuzufügen: einen Modellkatalog, API-Schlüssel-Authentifizierung und dynamische Modellauflösung.

<Info>
  Neu bei OpenClaw-Plugins? Lesen Sie zuerst [Erste Schritte](/de/plugins/building-plugins),
  um Informationen zur Paketstruktur und zur Einrichtung des Manifests zu erhalten.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das
  Modell über einen nativen Agent-Daemon ausgeführt werden muss, der Threads, Compaction
  oder Tool-Ereignisse verwaltet, kombinieren Sie den Provider mit einem [Agent-
  Harness](/de/plugins/sdk-agent-harness), statt Details des Daemon-Protokolls
  in den Core zu integrieren.
</Tip>

## Anleitung

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
      "description": "Acme-AI-Modell-Provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme-AI-API-Schlüssel",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme-AI-API-Schlüssel"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Mit `setup.providers[].envVars` kann OpenClaw Zugangsdaten erkennen, ohne
    die Laufzeit Ihres Plugins zu laden. Fügen Sie `providerAuthAliases` hinzu, wenn eine Provider-
    Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport` ist
    optional und ermöglicht OpenClaw, Ihr Provider-Plugin anhand verkürzter
    Modell-IDs wie `acme-large` automatisch zu laden, bevor Laufzeit-Hooks vorhanden sind. `openclaw.compat`
    und `openclaw.build` in `package.json` sind für die Veröffentlichung auf ClawHub
    erforderlich (`openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`
    sind die beiden Pflichtfelder; `minGatewayVersion` greift bei Auslassung auf
    `openclaw.install.minHostVersion` zurück).

  </Step>

  <Step title="Provider registrieren">
    Ein minimaler Text-Provider benötigt `id`, `label`, `auth` und `catalog`.
    `catalog` ist der vom Provider verwaltete Laufzeit-/Konfigurations-Hook; er kann aktive
    Anbieter-APIs aufrufen und Einträge für `models.providers` zurückgeben.

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

    `registerModelCatalogProvider` ist die neuere Katalogoberfläche der Steuerungsebene
    für Listen-, Hilfe- und Auswahloberflächen und deckt Zeilen der Typen `text`, `voice`, `image_generation`,
    `video_generation` und `music_generation` ab. Belassen Sie Aufrufe von Anbieter-Endpunkten
    und die Zuordnung der Antworten im Plugin; OpenClaw verwaltet die gemeinsame Zeilenstruktur,
    Quellenbezeichnungen und die Darstellung der Hilfe.

    Damit ist der Provider funktionsfähig. Benutzer können nun
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als Modell auswählen.

    ### Dynamische Modellerkennung

    Wenn Ihr Provider eine API im Stil von `/models` bereitstellt, belassen Sie den Provider-spezifischen
    Endpunkt und die Zeilenprojektion in Ihrem Plugin und verwenden Sie
    `openclaw/plugin-sdk/provider-catalog-live-runtime` für den gemeinsamen Abruf-
    Lebenszyklus. Der Helfer bietet Ihnen abgesicherte HTTP-Abrufe, Provider-Authentifizierungsheader,
    strukturierte HTTP-Fehler, TTL-Caching und statisches Fallback-Verhalten, ohne
    Provider-Richtlinien in den OpenClaw-Core zu integrieren.

    Verwenden Sie `buildLiveModelProviderConfig`, wenn die Live-API Ihnen nur mitteilt, welche
    vom Provider verwalteten statischen Katalogzeilen derzeit verfügbar sind:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    Verwenden Sie `getCachedLiveProviderModelRows`, wenn die Provider-API umfangreichere
    Metadaten zurückgibt und das Plugin die Zeilen selbst in OpenClaw-
    Modelldefinitionen projizieren muss:

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` sollte weiterhin durch die Authentifizierung geschützt sein und `null` zurückgeben, wenn keine verwendbaren Zugangsdaten
    verfügbar sind. Behalten Sie ein Offline-`staticRun` oder einen statischen Fallback bei, damit Einrichtung, Dokumentation,
    Tests und Auswahloberflächen nicht von einem aktiven Netzwerkzugriff abhängen. Verwenden Sie eine TTL,
    die für die Aktualität der Modellliste angemessen ist, vermeiden Sie Dateisystemabfragen zur Anfragezeit
    und übergeben Sie ein Provider-spezifisches `readRows` / `readModelId` nur, wenn die
    vorgelagerte Antwort nicht die OpenAI-kompatible Struktur `{ data: [{ id, object }] }`
    aufweist.

    Wenn der vorgelagerte Provider andere Steuerungstoken als OpenClaw verwendet, fügen Sie eine
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

    `input` schreibt den endgültigen System-Prompt und den Inhalt von Textnachrichten vor dem
    Transport um. `output` schreibt Text-Deltas des Assistenten und den endgültigen Text um, bevor
    OpenClaw seine eigenen Steuerungsmarker analysiert oder die Zustellung an den Kanal durchführt.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Schlüssel-
    Authentifizierung und einer einzelnen kataloggestützten Laufzeit registrieren, verwenden Sie vorzugsweise den spezielleren
    Helfer `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` ist der Live-Katalogpfad, der verwendet wird, wenn OpenClaw eine echte
    Provider-Authentifizierung auflösen kann. Er kann eine Provider-spezifische Erkennung
    durchführen. Verwenden Sie `buildStaticProvider` nur für Offline-Einträge, die vor der
    Konfiguration der Authentifizierung sicher angezeigt werden können; er darf weder
    Anmeldedaten erfordern noch Netzwerkanfragen stellen. Die Anzeige von OpenClaws
    `models list --all` führt statische Kataloge derzeit nur für mitgelieferte
    Provider-Plugins aus, mit einer leeren Konfiguration, einer leeren Umgebung und ohne
    Agent-/Arbeitsbereichspfade.

    Wenn Ihr Authentifizierungsablauf während des Onboardings außerdem
    `models.providers.*`, Aliasse und das Standardmodell des Agenten aktualisieren muss,
    verwenden Sie die Voreinstellungshelfer aus
    `openclaw/plugin-sdk/provider-onboard`. Die spezifischsten Helfer sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Providers gestreamte Nutzungsblöcke über den
    normalen `openai-completions`-Transport unterstützt, verwenden Sie vorzugsweise die
    gemeinsamen Kataloghelfer in
    `openclaw/plugin-sdk/provider-catalog-shared`, anstatt Prüfungen der
    Provider-ID fest zu codieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen die Unterstützung anhand
    der Endpunkt-Fähigkeitszuordnung, sodass native Endpunkte im Stil von
    Moonshot/DashScope weiterhin aktiviert werden, selbst wenn ein Plugin eine
    benutzerdefinierte Provider-ID verwendet.

    Die obigen Beispiele für die Live-Erkennung decken Provider-APIs im Stil von
    `/models` ab. Belassen Sie diese Erkennung innerhalb von `catalog.run`, beschränkt
    auf verwendbare Authentifizierung, und halten Sie `staticRun` für die
    Offline-Kataloggenerierung netzwerkfrei.

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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie
    `prepareDynamicModel` für die asynchrone Vorbereitung – `resolveDynamicModel`
    wird nach deren Abschluss erneut ausgeführt.

  </Step>

  <Step title="Runtime-Hooks hinzufügen (nach Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie
    Hooks schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Helper-Builder decken nun die häufigsten Familien für
    Replay-/Tool-Kompatibilität ab, sodass Plugins normalerweise nicht mehr jeden Hook
    einzeln manuell verdrahten müssen:

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

    Derzeit verfügbare Replay-Familien:

    | Familie | Eingebundene Funktionen | Mitgelieferte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Aufruf-IDs, Korrekturen der Reihenfolge mit Assistent zuerst und generischer Validierung von Gemini-Zügen, wo der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | An Claude angepasste Replay-Richtlinie, die anhand von `modelId` ausgewählt wird, sodass Transporte für Anthropic-Nachrichten die Claude-spezifische Bereinigung von Denkblöcken nur erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock` |
    | `native-anthropic-by-model` | Dieselbe modellabhängige Claude-Richtlinie wie `anthropic-by-model`, ergänzt um die Bereinigung von Tool-Aufruf-IDs und die Beibehaltung nativer Anthropic-Tool-Nutzungs-IDs für Transporte, die herstellernative IDs beibehalten müssen | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bereinigung des Bootstrap-Replays. Die gemeinsame Familie belässt die textausgebende Gemini CLI beim markierten Reasoning; der direkte Provider `google` überschreibt `resolveReasoningOutputMode` mit `native`, da das Denken der Gemini API als native Gedankenteile eintrifft. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Bereinigung von Gemini-Gedankensignaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte ausgeführt werden; aktiviert weder die native Gemini-Replay-Validierung noch Bootstrap-Umschreibungen | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die Oberflächen für Anthropic-Nachrichten und OpenAI-kompatible Modelle in einem Plugin kombinieren; das optionale Verwerfen von Denkblöcken ausschließlich für Claude bleibt auf die Anthropic-Seite beschränkt | `minimax` |

    Derzeit verfügbare Stream-Familien:

    | Familie | Eingebundene Funktionen | Mitgelieferte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Denkinhalten im gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper im gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs das eingefügte Denken überspringen | `kilocode` |
    | `moonshot-thinking` | Zuordnung binärer nativer Moonshot-Denkinhalte aus Konfiguration + `/think`-Stufe | `moonshot` |
    | `minimax-fast-mode` | Umschreiben des MiniMax-Fast-Mode-Modells im gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame native OpenAI-/Codex-Responses-Wrapper: Zuordnungs-Header, `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Websuche, Reasoning-Kompatibilitätsaufbereitung der Nutzlast und Responses-Kontextverwaltung | `openai` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei das Überspringen nicht unterstützter Modelle/`auto` zentral behandelt wird | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming verwenden möchten, sofern es nicht ausdrücklich deaktiviert ist | `zai` |

    <Accordion title="SDK-Schnittstellen hinter den Familien-Buildern">
      Jeder Familien-Builder setzt sich aus öffentlichen Helfern niedrigerer Ebene
      zusammen, die aus demselben Paket exportiert werden und auf die Sie zurückgreifen
      können, wenn ein Provider vom üblichen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` – `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die direkten Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert außerdem Gemini-Replay-Helfer (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) und Endpunkt-/Modellhelfer (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` – `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` sowie die gemeinsamen OpenAI-/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), der OpenAI-kompatible DeepSeek-V4-Wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), die Bereinigung der Denkvorbelegung für Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), die Kompatibilität für Tool-Aufrufe im Klartext (`createPlainTextToolCallCompatWrapper`) und gemeinsame Proxy-/Provider-Wrapper (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` – schlanke Nutzlast- und Ereignis-Wrapper für häufig ausgeführte Provider-Pfade, darunter `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` und `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` – `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` und die zugrunde liegenden Provider-Schemahelfer.

      Halten Sie bei Providern der Gemini-Familie den Ausgabemodus für Reasoning
      auf den Transport abgestimmt. Direkte Provider für die Google Gemini API sollten
      die Reasoning-Ausgabe `native` verwenden, damit OpenClaw native Gedankenteile
      verarbeitet, ohne die Prompt-Direktiven `<think>` / `<final>` hinzuzufügen.
      Reine Text-Backends im Stil der Gemini CLI, die eine abschließende
      JSON-/Textantwort parsen, können den gemeinsamen markierten Vertrag
      `google-gemini` beibehalten.

      Einige Stream-Helfer bleiben absichtlich Provider-lokal. `@openclaw/anthropic-provider`
      behält `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
      `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die
      Anthropic-Wrapper-Builder niedrigerer Ebene in seiner eigenen öffentlichen
      `api.ts`-/`contract-api.ts`-Schnittstelle, da sie die Verarbeitung von
      Claude-OAuth-Betaversionen und die Beschränkung von `context1m` abbilden. Das
      xAI-Plugin behält die native Aufbereitung von xAI Responses auf ähnliche Weise
      in seinem eigenen `wrapStreamFn` (`/fast`-Aliasse, standardmäßiges
      `tool_stream`, Bereinigung nicht unterstützter strikter Tools, xAI-spezifische
      Entfernung der Reasoning-Nutzlast).

      Dasselbe Muster auf Paketstammebene bildet auch die Grundlage für
      `@openclaw/openai-provider` (Provider-Builder, Standardmodell-Helfer,
      Echtzeit-Provider-Builder) und `@openclaw/openrouter-provider`
      (Provider-Builder sowie Onboarding-/Konfigurationshelfer).
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
        Für Provider, die benutzerdefinierte Anfrage-Header oder Änderungen am
        Anfragekörper benötigen:

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
        Für Provider, die native Anfrage-/Sitzungs-Header oder Metadaten für
        generische HTTP- oder WebSocket-Transporte benötigen:

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

        `resolveUsageAuth` hat drei mögliche Ergebnisse. Geben Sie
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` zurück, wenn der
        Provider über Anmeldedaten für Nutzung/Abrechnung verfügt (die optionalen Felder
        übertragen nicht geheime Tarifmetadaten aus dem aufgelösten Profil an
        `fetchUsageSnapshot`). Geben Sie
        `{ handled: true }` nur zurück, wenn der Provider die Authentifizierung für die
        Nutzung definitiv verarbeitet hat, aber über kein verwendbares Nutzungstoken
        verfügt und OpenClaw den generischen API-Schlüssel-/OAuth-Fallback überspringen
        muss. Geben Sie `null` oder `undefined` zurück, wenn der Provider die Anfrage
        nicht verarbeitet hat und OpenClaw mit dem generischen Fallback fortfahren soll.

        Deklarieren Sie die Provider-ID in `contracts.usageProviders`. Wenn dieser
        Manifest-Vertrag und **beide** Hooks vorhanden sind, nimmt OpenClaw den
        Provider automatisch in die Nutzungserfassung auf, ohne nicht zugehörige
        Provider-Plugins zu laden. Eine Aktualisierung der Allowlist im Kern ist nicht
        erforderlich.
        `fetchUsageSnapshot` gibt die gemeinsame providerneutrale Struktur zurück:

        - `plan`: vom Provider gemeldete Abonnement- oder Schlüsselbezeichnung
        - `windows`: zurücksetzbare Kontingentzeitfenster als verwendete Prozentwerte
        - `billing`: typisierte Einträge für `balance`, `spend` oder `budget`; `unit`
          kann eine ISO-Währung oder eine Provider-Einheit wie `credits` sein
        - `summary`: kompakter providerspezifischer Kontext, der nicht in diese
          strukturierten Felder passt

        Behalten Sie die Währungssemantik exakt bei. Ein Provider-Guthaben entspricht
        nicht USD, sofern der Upstream-Vertrag dies nicht ausdrücklich festlegt. Ein
        Plugin, das nur `fetchUsageSnapshot` implementiert, bleibt für explizite/synthetische
        Aufrufer verfügbar, wird aber nicht automatisch erkannt, da OpenClaw seine
        Anmeldedaten für die Nutzung nicht auflösen kann.
      </Tab>
    </Tabs>

    <Accordion title="Allgemeine Provider-Hooks">
      OpenClaw ruft Hooks für Modell-/Provider-Plugins ungefähr in dieser Reihenfolge auf.
      Die meisten Provider verwenden nur 2-3. Dies ist nicht der vollständige Vertrag
      von `ProviderPlugin` – die vollständige, derzeit aktuelle Hook-Liste und Hinweise
      zu Fallbacks finden Sie unter [Interna: Provider-Laufzeit-
      Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
      Provider-Felder, die nur der Kompatibilität dienen und von OpenClaw nicht mehr
      aufgerufen werden, beispielsweise `ProviderPlugin.capabilities` und
      `suppressBuiltInModel`, sind hier nicht aufgeführt.

      | Hook | Verwendungszweck |
      | --- | --- |
      | `catalog` | Modellkatalog oder Standardwerte für die Basis-URL |
      | `applyConfigDefaults` | Providereigene globale Standardwerte bei der Materialisierung der Konfiguration |
      | `normalizeModelId` | Bereinigung von Aliasen für ältere/Vorschau-Modell-IDs vor der Suche |
      | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für die Provider-Familie vor der generischen Modellzusammenstellung |
      | `normalizeConfig` | Konfiguration `models.providers.<id>` normalisieren |
      | `applyNativeStreamingUsageCompat` | Native Kompatibilitätsumschreibungen für die Streaming-Nutzung bei konfigurierten Providern |
      | `resolveConfigApiKey` | Providereigene Auflösung der Authentifizierung über Umgebungsmarker |
      | `resolveSyntheticAuth` | Synthetische Authentifizierung für lokale/selbst gehostete oder konfigurationsgestützte Umgebungen |
      | `resolveExternalAuthProfiles` | Providereigene externe Authentifizierungsprofile für CLI-/App-verwaltete Anmeldedaten überlagern |
      | `shouldDeferSyntheticProfileAuth` | Synthetische Platzhalter gespeicherter Profile hinter Umgebungs-/Konfigurationsauthentifizierung zurückstufen |
      | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | `prepareDynamicModel` | Asynchroner Metadatenabruf vor der Auflösung |
      | `normalizeResolvedModel` | Transportumschreibungen vor dem Runner |
      | `normalizeToolSchemas` | Providereigene Bereinigung von Tool-Schemas vor der Registrierung |
      | `inspectToolSchemas` | Providereigene Diagnose von Tool-Schemas |
      | `resolveReasoningOutputMode` | Vertrag für markierte gegenüber nativer Reasoning-Ausgabe |
      | `prepareExtraParams` | Standardmäßige Anfrageparameter |
      | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper im normalen Stream-Pfad |
      | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | `resolveWebSocketSessionPolicy` | Native WS-Sitzungsheader/-Abkühlzeit |
      | `formatApiKey` | Benutzerdefinierte Laufzeit-Tokenstruktur |
      | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | `buildAuthDoctorHint` | Anleitung zur Reparatur der Authentifizierung |
      | `matchesContextOverflowError` | Providereigene Erkennung von Kontextüberläufen |
      | `classifyFailoverReason` | Providereigene Klassifizierung von Ratenbegrenzung/Überlastung |
      | `isCacheTtlEligible` | TTL-Steuerung für den Prompt-Cache |
      | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | `augmentModelCatalog` | Synthetische Zeilen für Vorwärtskompatibilität (veraltet – bevorzugen Sie `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Modellspezifischer Optionssatz für `/think` |
      | `isBinaryThinking` | Kompatibilität für binäres Ein-/Ausschalten des Denkens (veraltet – bevorzugen Sie `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning-Unterstützung (veraltet – bevorzugen Sie `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Kompatibilität für die standardmäßige `/think`-Richtlinie (veraltet – bevorzugen Sie `resolveThinkingProfile`) |
      | `isModernModelRef` | Modellabgleich für Live-/Smoke-Tests |
      | `prepareRuntimeAuth` | Tokenaustausch vor der Inferenz |
      | `resolveUsageAuth` | Benutzerdefinierte Verarbeitung von Anmeldedaten für die Nutzung |
      | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungsendpunkt |
      | `createEmbeddingProvider` | Providereigener Embedding-Adapter für Speicher/Suche |
      | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transkriptwiedergabe/Compaction |
      | `sanitizeReplayHistory` | Providerspezifische Umschreibungen der Wiedergabe nach der generischen Bereinigung |
      | `validateReplayTurns` | Strikte Validierung der Wiedergabe-Turns vor dem eingebetteten Runner |
      | `onModelSelected` | Rückruf nach der Auswahl (z. B. Telemetrie) |

      Hinweise zu Laufzeit-Fallbacks:

      - `normalizeConfig` ermittelt pro Provider-ID ein zuständiges Plugin (zuerst gebündelte Provider, dann das passende Laufzeit-Plugin) und ruft ausschließlich diesen Hook auf – andere Provider werden nicht durchsucht. Googles eigener `normalizeConfig`-Hook normalisiert die Konfigurationseinträge `google` / `google-vertex` / `google-antigravity`; dies ist kein separater Kern-Fallback.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn dieser bereitgestellt wird. Amazon Bedrock behält die Auflösung von AWS-Umgebungsmarkern in seinem Provider-Plugin; die Laufzeitauthentifizierung selbst verwendet bei einer Konfiguration mit `auth: "aws-sdk"` weiterhin die Standardkette des AWS SDK.
      - `resolveThinkingProfile(ctx)` erhält den ausgewählten `provider`, die `modelId`, einen optional zusammengeführten `reasoning`-Kataloghinweis und optional zusammengeführte `compat`-Fakten des Modells. Verwenden Sie `compat` nur zur Auswahl der Denkoberfläche/des Denkprofils des Providers.
      - `resolveSystemPromptContribution` ermöglicht es einem Provider, cachebewusste System-Prompt-Anleitungen für eine Modellfamilie einzufügen. Bevorzugen Sie dies gegenüber dem älteren pluginweiten Hook `before_prompt_build`, wenn das Verhalten zu einer einzelnen Provider-/Modellfamilie gehört und die stabile/dynamische Cache-Aufteilung beibehalten werden soll.

    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    ### Schritt 5: Zusätzliche Fähigkeiten hinzufügen

    Ein Provider-Plugin kann neben der Textinferenz Embeddings, Sprache,
    Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bilderzeugung,
    Videoerzeugung, Webabruf und Websuche registrieren. OpenClaw klassifiziert dies
    als Plugin mit **hybriden Fähigkeiten** – das empfohlene Muster für
    Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe
    [Interna: Zuständigkeit für Fähigkeiten](/de/plugins/architecture#capability-ownership-model).

    Registrieren Sie jede Fähigkeit innerhalb von `register(api)` neben Ihrem
    vorhandenen Aufruf `api.registerProvider(...)`. Wählen Sie nur die benötigten
    Tabs aus:

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
          defaultTimeoutMs: 120_000,
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

        Verwenden Sie `assertOkOrThrowProviderError(...)` bei HTTP-Fehlern des
        Providers, damit Plugins begrenzte Fehlertext-Lesevorgänge, die
        JSON-Fehlerverarbeitung und Anfrage-ID-Suffixe gemeinsam nutzen.
      </Tab>
      <Tab title="Echtzeittranskription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` – der
        gemeinsame Helfer übernimmt Proxy-Erfassung, exponentielle Verzögerung bei
        erneuten Verbindungen, das Leeren beim Schließen, Bereitschafts-Handshakes,
        Audio-Warteschlangen und die Diagnose von Schließereignissen. Ihr Plugin
        ordnet lediglich Upstream-Ereignisse zu.

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
        `openclaw/plugin-sdk/provider-http` verwenden. Die Hilfsfunktion normalisiert die
        Dateinamen von Uploads, einschließlich AAC-Uploads, die für
        kompatible Transkriptions-APIs einen Dateinamen im M4A-Stil benötigen.
      </Tab>
      <Tab title="Echtzeit-Spracheingabe">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
        ```
        ```typescript
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
        ```
        ```typescript
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
        ```
        ```typescript
            // Legen Sie dies nur fest, wenn der Provider mehrere Tool-Antworten akzeptiert für
        ```
        ```typescript
            // ein Aufruf, zum Beispiel eine sofortige „wird bearbeitet“-Antwort, gefolgt von
        ```
        ```typescript
            // das Endergebnis.
        ```
        ```typescript
            supportsToolResultContinuation: false,
            connect: async () => {},
        ```
        ```typescript
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
        ```
        ```typescript
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
        Deklarieren Sie `capabilities`, damit `talk.catalog` gültige Modi,
        Übertragungsarten, Audioformate und Feature-Flags für browserbasierte und native Talk-
        Clients bereitstellen kann. Implementieren Sie `handleBargeIn`, wenn eine Übertragungsart erkennen kann, dass ein
        Mensch die Wiedergabe des Assistenten unterbricht, und der Provider das
        Kürzen oder Löschen der aktiven Audioantwort unterstützt.
        `submitToolResult` kann für eine synchrone Übermittlung `void` oder für eine
        asynchrone Abschlussgrenze, die die Provider-
        Bridge bereitstellen kann, `Promise<void>` zurückgeben. Gateway-Relay-Sitzungen warten auf dieses Promise, bevor
        sie ein endgültiges Ergebnis bestätigen oder den verknüpften Lauf löschen; lehnen Sie es ab, wenn
        die Übermittlung fehlschlägt.
        Legen Sie `supportsToolResultSuppression: false` fest, wenn der Provider
        `options.suppressResponse` nicht berücksichtigen kann. OpenClaw vermeidet dann die Unterdrückung für
        interne Ergebnisse aus erzwungener Konsultation und Abbruch und lehnt direkte
        Anforderungen unterdrückter Ergebnisse ab, statt stillschweigend eine Antwort zu starten.
        Nutzer von `createRealtimeVoiceBridgeSession` können ebenfalls ein
        Promise von `onToolCall` zurückgeben; synchrone Ausnahmen und Ablehnungen werden an
        den `onError`-Callback der Sitzung weitergeleitet.
        Legen Sie `handlesInputAudioBargeIn` nur fest, wenn die VAD des Providers eine
        Unterbrechung durch den Aufruf von `onClearAudio("barge-in")` bestätigt. Provider, die
        das Flag weglassen, verwenden die lokale Erkennung von Eingabeaudio-Unterbrechungen von OpenClaw.
      </Tab>
      <Tab title="Medienverständnis">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
        ```
        ```typescript
          describeImage: async (req) => ({ text: "Ein Foto von..." }),
        ```
        ```typescript
          transcribeAudio: async (req) => ({ text: "Transkript..." }),
        ```
        ```typescript
        });
        ```
        Lokale oder selbst gehostete Medien-Provider, die absichtlich keine
        Anmeldedaten erfordern, können `resolveAuth` bereitstellen und `kind: "none"`
        zurückgeben. OpenClaw behält weiterhin die normale Authentifizierungsprüfung
        für Provider bei, die sich nicht ausdrücklich dafür entscheiden. Bestehende
        Provider können weiterhin `req.apiKey` auslesen; neue Provider sollten
        `req.auth` bevorzugen.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
        ```
        ```typescript
            source: "local-audio plugin no-auth",
        ```
        ```typescript
          }),
        ```
        ```typescript
          transcribeAudio: async (req) => ({ text: "Transkript..." }),
        ```
        ```typescript
        });
        ```
      </Tab>
      <Tab title="Einbettungen">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```
        Deklarieren Sie dieselbe ID in `contracts.embeddingProviders`. Dies ist der
        allgemeine Embedding-Vertrag für die wiederverwendbare Vektorgenerierung,
        einschließlich der Speichersuche. `registerMemoryEmbeddingProvider(...)` ist
        eine veraltete Kompatibilitätsschnittstelle für bestehende speicherspezifische Adapter.
      </Tab>
      <Tab title="Bild- und Videogenerierung">
        Bild- und Videofunktionen verwenden eine **modusabhängige** Struktur. Bild-
        Provider deklarieren erforderliche `generate`- und `edit`-Funktionsblöcke;
        Video-Provider deklarieren `generate`, `imageToVideo` und
        `videoToVideo`. Flache aggregierte Felder wie `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` reichen nicht aus, um die
        Unterstützung von Transformationsmodi oder deaktivierte Modi eindeutig
        anzugeben. Die Musikgenerierung folgt demselben Muster aus `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` ist für beide Provider-Typen erforderlich; `edit` und die
        Videotransformationsblöcke (`imageToVideo`, `videoToVideo`) benötigen immer ein
        explizites `enabled`-Flag.

        Verwenden Sie `catalogByModel`, wenn die statischen Modi oder Fähigkeiten
        eines aufgeführten Modells von den Standardeinstellungen des Providers abweichen. Diese Metadaten sorgen dafür, dass
        `video_generate action=list` und Modellkataloge korrekt bleiben, ohne
        Provider-Code aufzurufen. Die Ermittlung und Durchsetzung von Fähigkeiten
        zur Anfragezeit gehören weiterhin in `resolveModelCapabilities` und `generateVideo`; verwenden Sie
        nach Möglichkeit für beide Pfade dieselbe Fähigkeitskonstante.
      </Tab>
      <Tab title="Webabruf und -suche">
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
          hint: "Das Web über das Such-Backend von Acme durchsuchen.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Das Web über Acme Search durchsuchen.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Beide Provider-Typen verwenden dieselbe Struktur für die Anbindung von Zugangsdaten:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` und `createTool` sind sämtlich
        erforderlich.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### Schritt 6: Test

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportieren Sie Ihr Provider-Konfigurationsobjekt aus index.ts oder einer separaten Datei
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("löst dynamische Modelle auf", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("gibt den Katalog zurück, wenn ein Schlüssel verfügbar ist", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("gibt einen Null-Katalog zurück, wenn kein Schlüssel vorhanden ist", async () => {
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

Provider-Plugins werden genauso veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` ist ein anderer Befehl zum Veröffentlichen eines
Skill-Ordners und nicht eines Plugin-Pakets – verwenden Sie ihn hier nicht.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit Metadaten zur Provider-Authentifizierung
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Nutzungsendpunkt (optional)
```

## Referenz zur Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu integrierten
Providern zusammengeführt wird:

| Reihenfolge | Zeitpunkt       | Anwendungsfall                                                   |
| ----------- | --------------- | ---------------------------------------------------------------- |
| `simple`    | Erster Durchlauf | Einfache Provider mit API-Schlüssel                              |
| `profile`   | Nach simple     | Provider, die Authentifizierungsprofile voraussetzen             |
| `paired`    | Nach profile    | Mehrere zusammengehörige Einträge synthetisieren                 |
| `late`      | Letzter Durchlauf | Vorhandene Provider überschreiben (hat bei Kollisionen Vorrang) |

## Nächste Schritte

- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) - wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK-Laufzeit](/de/plugins/sdk-runtime) - Hilfsfunktionen von `api.runtime` (TTS, Suche, Subagent)
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Referenz für Subpfadimporte
- [Plugin-Interna](/de/plugins/architecture-internals#provider-runtime-hooks) - Details zu Hooks und gebündelte Beispiele

## Verwandte Themen

- [Einrichtung des Plugin-SDK](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Kanal-Plugins erstellen](/de/plugins/sdk-channel-plugins)
