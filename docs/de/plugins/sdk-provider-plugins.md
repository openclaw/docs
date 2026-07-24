---
read_when:
    - Sie erstellen ein neues Plugin für einen Modell-Provider
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Sie müssen die Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-07-24T04:05:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d175fafc034bd52e996d47e047df104f079f2aba66662b22e8dbdf6c21e7e0
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Erstellen Sie ein Provider-Plugin, um OpenClaw einen Modell-Provider (LLM) hinzuzufügen: einen Modellkatalog, API-Schlüssel-Authentifizierung und dynamische Modellauflösung.

<Info>
  Neu bei OpenClaw-Plugins? Lesen Sie zuerst [Erste Schritte](/de/plugins/building-plugins),
  um mehr über die Paketstruktur und die Einrichtung des Manifests zu erfahren.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das
  Modell über einen nativen Agent-Daemon ausgeführt werden muss, der Threads, Compaction
  oder Tool-Ereignisse verwaltet, kombinieren Sie den Provider mit einem [Agent-
  Harness](/de/plugins/sdk-agent-harness), anstatt Details des Daemon-Protokolls
  im Kern unterzubringen.
</Tip>

## Schritt-für-Schritt-Anleitung

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
      "description": "Modell-Provider von Acme AI",
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
          "choiceLabel": "API-Schlüssel für Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "API-Schlüssel für Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` ermöglicht OpenClaw, Anmeldedaten zu erkennen, ohne
    die Laufzeit Ihres Plugins zu laden. Fügen Sie `providerAuthAliases` hinzu, wenn eine Provider-
    Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport` ist
    optional und ermöglicht OpenClaw, Ihr Provider-Plugin automatisch anhand verkürzter
    Modell-IDs wie `acme-large` zu laden, bevor Laufzeit-Hooks vorhanden sind. `openclaw.compat`
    und `openclaw.build` in `package.json` sind für die Veröffentlichung auf ClawHub
    erforderlich (`openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`
    sind die beiden Pflichtfelder; `minGatewayVersion` greift auf
    `openclaw.install.minHostVersion` zurück, wenn es nicht angegeben ist).

  </Step>

  <Step title="Provider registrieren">
    Ein minimaler Text-Provider benötigt `id`, `label`, `auth` und `catalog`.
    `catalog` ist der vom Provider verwaltete Laufzeit-/Konfigurations-Hook; er kann Live-
    APIs des Anbieters aufrufen und gibt `models.providers`-Einträge zurück.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Modell-Provider von Acme AI",
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
              label: "API-Schlüssel für Acme AI",
              hint: "API-Schlüssel aus Ihrem Acme-AI-Dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Geben Sie Ihren API-Schlüssel für Acme AI ein",
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
    für Listen-, Hilfe- und Auswahloberflächen und deckt `text`-, `voice`-, `image_generation`-,
    `video_generation`- und `music_generation`-Zeilen ab. Belassen Sie Aufrufe von Anbieter-Endpunkten
    und die Zuordnung der Antworten im Plugin; OpenClaw verwaltet die gemeinsame
    Zeilenstruktur, Herkunftsbezeichnungen und Darstellung der Hilfe.

    Damit steht ein funktionsfähiger Provider bereit. Benutzer können nun
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als Modell auswählen.

    ### Live-Modellerkennung

    Wenn Ihr Provider eine OpenAI-kompatible `/models`-API bereitstellt, aktivieren Sie für den
    Einzel-Provider-Helper die gemeinsame Erkennung:

    ```typescript
    catalog: {
      buildProvider: () => ({
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        models: [...STATIC_MODELS],
      }),
      buildStaticProvider: () => ({
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        models: [...STATIC_MODELS],
      }),
      liveModelDiscovery: true,
    },
    ```

    `liveModelDiscovery: true` ist ein öffentlicher Vertrag des Plugin SDK mit folgenden
    Verhaltensweisen:

    | Bereich | Vertrag |
    | --- | --- |
    | Anmeldedaten | Die Erkennung verwendet die aufgelösten Provider-Anmeldedaten des Katalogs und bevorzugt `discoveryApiKey`, wenn die Authentifizierung solche bereitstellt. Markierungen für Secret-Referenzen werden niemals als Token gesendet. Die Standardanfrage verwendet `Authorization: Bearer <token>`; verwenden Sie `buildRequestHeaders` für ein anderes Authentifizierungsschema des Anbieters. |
    | Endpunkt | Die Standard-URL ist `models` relativ zur effektiven Provider-`baseUrl`, einschließlich einer Betreiberüberschreibung, wenn `allowExplicitBaseUrl` aktiviert ist. Verwenden Sie `endpointPath` für einen anderen relativen Pfad. Verwenden Sie `endpointUrl: { url, requireBaseUrl }` nur für eine feste Anbieter-URL; die Erkennung wird übersprungen, sofern die effektive Basis-URL nicht weiterhin `requireBaseUrl` entspricht, damit die Anmeldedaten eines benutzerdefinierten Proxys nicht an den Anbieter gesendet werden. |
    | Netzwerkgrenzen | Abrufe verwenden den SSRF-Schutz von OpenClaw, ein gemeinsames Zeitüberschreitungsbudget von 5 Sekunden für die gesamte Paginierung, eine Antwortbegrenzung von 4 MiB pro Seite und eine Begrenzung auf 50 Seiten. Paginierungslinks zu anderen Ursprüngen werden abgelehnt; Anmeldedaten werden nach einer ursprungsübergreifenden Weiterleitung entfernt. |
    | Cache | Erfolgreiche, nicht leere Kataloge werden nach Provider, Endpunkt und aufgelösten Anmeldedaten 60 Sekunden lang zwischengespeichert. Leere oder unbrauchbare Ergebnisse werden nicht zwischengespeichert. |
    | Filterung | Exakte Live-IDs behalten ihre vertrauenswürdigen statischen Metadaten. Neue Zeilen werden konservativ als Text-/Chatmodelle abgebildet. Deaktivierte, archivierte, veraltete, ausdrücklich nicht für Chats vorgesehene sowie Embedding-, Reranking-, Moderations-, Sprach-, reine Bild- und reine Videomodelle werden ausgeschlossen. Verwenden Sie `readRows` nur, um Zeilen aus einer nicht standardmäßigen Antwortstruktur auszuwählen; providerspezifische Modellsemantik gehört weiterhin in einen benutzerdefinierten Katalog. |
    | Fehler | Die Live-Erkennung ist unverbindlich. Fehler bei Authentifizierung, Netzwerk, Zeitüberschreitung, Paginierung, Parsing, leeren Katalogen und Filterung geben den vom Provider verwalteten statischen Ausgangsbestand zurück, anstatt den Provider zu entfernen. |

    Übergeben Sie für einen Nicht-Bearer- oder nicht standardmäßigen Listenendpunkt Optionen anstelle von
    `true`:

    ```typescript
    liveModelDiscovery: {
      endpointPath: "model-catalog",
      buildRequestHeaders: ({ apiKey, discoveryApiKey }) => ({
        "vendor-version": "2026-01-01",
        "x-api-key": discoveryApiKey ?? apiKey ?? "",
      }),
      readRows: (body) =>
        body && typeof body === "object" &&
        Array.isArray((body as { models?: unknown }).models)
          ? (body as { models: unknown[] }).models
          : [],
    },
    ```

    Verwenden Sie `endpointUrl` nicht als bedingungslosen alternativen Host. Die
    `requireBaseUrl`-Prüfung bildet die Grenze zur Isolation der Anmeldedaten für Provider,
    deren Host für Modelllisten vom Inferenz-Host abweicht.

    Wenn der Provider anstelle der konservativen OpenAI-kompatiblen Abbildung eine
    benutzerdefinierte Modellsemantik benötigt, belassen Sie diese Abbildung im Plugin und verwenden Sie
    `openclaw/plugin-sdk/provider-catalog-live-runtime` für den gemeinsamen Abruf-
    Lebenszyklus. Der Helper stellt geschützte HTTP-Abrufe, Provider-Authentifizierungsheader,
    strukturierte HTTP-Fehler, TTL-Caching und statisches Fallback-Verhalten bereit, ohne
    Provider-Richtlinien im OpenClaw-Kern unterzubringen.

    Verwenden Sie `buildLiveModelProviderConfig`, wenn die Live-API Ihnen lediglich mitteilt, welche
    Zeilen des vom Provider verwalteten statischen Katalogs derzeit verfügbar sind:

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
    Modelldefinitionen überführen muss:

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

    `run` sollte weiterhin durch Authentifizierung geschützt sein und `null` zurückgeben, wenn keine verwendbaren Anmeldedaten
    verfügbar sind. Behalten Sie einen Offline-`staticRun` oder statischen Fallback bei, damit Einrichtung, Dokumentation,
    Tests und Auswahloberflächen nicht vom Live-Netzwerkzugriff abhängen. Verwenden Sie eine TTL,
    die der Aktualität der Modellliste angemessen ist, vermeiden Sie Dateisystemabfragen zur Anfragezeit
    und übergeben Sie einen providerspezifischen `readRows` / `readModelId` nur, wenn die
    vorgelagerte Antwort keine OpenAI-kompatible `{ data: [{ id, object }] }`-
    Struktur aufweist.

    Wenn der vorgelagerte Provider andere Steuerungstoken als OpenClaw verwendet, fügen Sie eine
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
    der Übertragung um. `output` schreibt Text-Deltas des Assistenten und den endgültigen Text um, bevor
    OpenClaw seine eigenen Steuerungsmarker analysiert oder die Kanalauslieferung erfolgt.

    Bevorzugen Sie für gebündelte Provider, die nur einen Text-Provider mit API-Schlüssel-
    Authentifizierung sowie eine einzelne kataloggestützte Laufzeit registrieren, den enger gefassten
    Hilfsbaustein `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme-AI-Modell-Provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme-AI-API-Schlüssel",
            hint: "API-Schlüssel aus Ihrem Acme-AI-Dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Geben Sie Ihren Acme-AI-API-Schlüssel ein",
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
    Provider-Authentifizierung auflösen kann. Er kann eine providerspezifische Erkennung durchführen. Verwenden Sie
    `buildStaticProvider` nur für Offline-Zeilen, die vor der Konfiguration der Authentifizierung sicher angezeigt
    werden können; sie dürfen weder Anmeldedaten erfordern noch Netzwerkanfragen ausführen.
    Die `models list --all`-Anzeige von OpenClaw führt statische Kataloge derzeit
    nur für gebündelte Provider-Plugins aus, mit einer leeren Konfiguration, einer leeren Umgebung und ohne
    Agenten-/Arbeitsbereichspfade.

    Wenn Ihr Authentifizierungsablauf während des Onboardings außerdem `models.providers.*`, Aliasse und
    das Standardmodell des Agenten anpassen muss, verwenden Sie die voreingestellten Hilfsbausteine aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Hilfsbausteine sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Providers gestreamte Nutzungsblöcke über den
    normalen `openai-completions`-Transport unterstützt, bevorzugen Sie die gemeinsamen Katalog-Hilfsbausteine in
    `openclaw/plugin-sdk/provider-catalog-shared`, anstatt
    Prüfungen auf Provider-IDs fest zu codieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen die Unterstützung anhand der
    Endpunkt-Fähigkeitszuordnung, sodass native Endpunkte im Moonshot-/DashScope-Stil weiterhin
    aktiviert werden, selbst wenn ein Plugin eine benutzerdefinierte Provider-ID verwendet.

    Die obigen Beispiele für die Live-Erkennung decken Provider-APIs im Stil von `/models` ab. Belassen Sie
    diese Erkennung innerhalb von `catalog.run`, geschützt durch verwendbare Authentifizierung, und halten Sie
    `staticRun` für die Offline-Kataloggenerierung netzwerkfrei.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn Ihr Provider beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
    fügen Sie `resolveDynamicModel` hinzu:

    ```typescript
    api.registerProvider({
      // ... ID, Bezeichnung, Authentifizierung und Katalog von oben

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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für die asynchrone
    Vorinitialisierung – `resolveDynamicModel` wird nach deren Abschluss erneut ausgeführt.

  </Step>

  <Step title="Laufzeit-Hooks hinzufügen (nach Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Hilfsbausteine decken jetzt die gängigsten Familien für Replay-/Tool-Kompatibilität
    ab, sodass Plugins normalerweise nicht mehr jeden Hook einzeln manuell verdrahten müssen:

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

    | Familie | Was eingebunden wird | Gebündelte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Aufruf-IDs, Korrekturen der Assistent-zuerst-Reihenfolge und generischer Validierung von Gemini-Dialogzügen, sofern der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Von `modelId` ausgewählte Claude-spezifische Replay-Richtlinie, sodass Transporte für Anthropic-Nachrichten die Claude-spezifische Bereinigung von Denkblöcken nur erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock` |
    | `native-anthropic-by-model` | Dieselbe modellabhängige Claude-Richtlinie wie `anthropic-by-model`, ergänzt um die Bereinigung von Tool-Aufruf-IDs und die Beibehaltung nativer Anthropic-Tool-Nutzungs-IDs für Transporte, die herstellernative IDs beibehalten müssen | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Native Gemini-Replay-Richtlinie einschließlich Bereinigung des Bootstrap-Replays. Die gemeinsame Familie belässt die Gemini CLI mit Textausgabe bei markiertem Reasoning; der direkte `google`-Provider überschreibt `resolveReasoningOutputMode` mit `native`, da das Denken der Gemini API als native Gedankenteile eingeht. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Bereinigung von Gemini-Gedankensignaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte ausgeführt werden; aktiviert weder die native Gemini-Replay-Validierung noch Bootstrap-Umschreibungen | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die Anthropic-Nachrichten- und OpenAI-kompatible Modelloberflächen in einem Plugin kombinieren; das optionale, ausschließlich Claude betreffende Verwerfen von Denkblöcken bleibt auf die Anthropic-Seite beschränkt | `minimax` |

    Derzeit verfügbare Stream-Familien:

    | Familie | Was sie einbindet | Mitgelieferte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Normalisierung der Gemini-Thinking-Nutzlast auf dem gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo-auto/balanced` und nicht unterstützte Proxy-Reasoning-IDs das injizierte Thinking überspringen | `kilocode` |
    | `moonshot-thinking` | Zuordnung der binären nativen Thinking-Nutzlast von Moonshot anhand der Konfiguration und der Stufe `/think` | `moonshot` |
    | `minimax-fast-mode` | Modellumschreibung für den MiniMax-Schnellmodus auf dem gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame native OpenAI/Codex-Responses-Wrapper: Attributionsheader, `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Websuche, Reasoning-Kompatibilitätsformung der Nutzlast und Responses-Kontextverwaltung | `openai` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Ausnahmen für nicht unterstützte Modelle/`auto` zentral behandelt werden | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming verwenden sollen, sofern es nicht ausdrücklich deaktiviert wurde | `zai` |

    <Accordion title="SDK-Schnittstellen für die Familien-Builder">
      Jeder Familien-Builder setzt sich aus öffentlichen Hilfsfunktionen niedrigerer Ebene zusammen, die aus demselben Paket exportiert werden und verwendet werden können, wenn ein Provider vom üblichen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die unverarbeiteten Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert außerdem Gemini-Replay-Hilfsfunktionen (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) und Endpunkt-/Modell-Hilfsfunktionen (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, außerdem die gemeinsamen OpenAI/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), der OpenAI-kompatible DeepSeek-V4-Wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), die Bereinigung des Thinking-Prefills für Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), die Kompatibilität für Nur-Text-Tool-Aufrufe (`createPlainTextToolCallCompatWrapper`) und gemeinsame Proxy-/Provider-Wrapper (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - leichtgewichtige Nutzlast- und Ereignis-Wrapper für häufig ausgeführte Provider-Pfade, einschließlich `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` und `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` und zugrunde liegende Provider-Schema-Hilfsfunktionen.

      Bei Providern der Gemini-Familie muss der Modus der Reasoning-Ausgabe auf
      den Transport abgestimmt bleiben. Provider, die direkt die Google Gemini API verwenden, sollten die
      Reasoning-Ausgabe `native` verwenden, damit OpenClaw native Thought-Teile verarbeitet, ohne
      die Prompt-Direktiven `<think>` / `<final>` hinzuzufügen. Reine Text-Backends im Stil der Gemini CLI,
      die eine abschließende JSON-/Textantwort parsen, können den gemeinsamen
      getaggten Vertrag `google-gemini` beibehalten.

      Einige Stream-Hilfsfunktionen bleiben absichtlich providerspezifisch. `@openclaw/anthropic-provider` belässt `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Anthropic-Wrapper-Builder niedrigerer Ebene in seiner eigenen öffentlichen `api.ts`- / `contract-api.ts`-Schnittstelle, da sie die Verarbeitung der Claude-OAuth-Beta und die `context1m`-Steuerung codieren. Das xAI-Plugin belässt analog dazu die Formung nativer xAI-Responses in seiner eigenen `wrapStreamFn` (`/fast`-Aliasse, Standardwert `tool_stream`, Bereinigung nicht unterstützter strikter Tools, xAI-spezifische Entfernung der Reasoning-Nutzlast).

      Dasselbe Paketstamm-Muster dient auch als Grundlage für `@openclaw/openai-provider` (Provider-Builder, Hilfsfunktionen für Standardmodelle, Echtzeit-Provider-Builder) und `@openclaw/openrouter-provider` (Provider-Builder sowie Onboarding-/Konfigurationshilfsfunktionen).
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
        Für Provider, die benutzerdefinierte Anfrageheader oder Änderungen am Body benötigen:

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
        Für Provider, die native Anfrage-/Sitzungsheader oder Metadaten auf
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

        `resolveUsageAuth` hat drei mögliche Ergebnisse. Geben Sie
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` zurück, wenn der
        Provider über einen Berechtigungsnachweis für Nutzung/Abrechnung verfügt (die optionalen Felder übertragen
        nicht geheime Tarifmetadaten aus dem aufgelösten Profil in
        `fetchUsageSnapshot`). Geben Sie
        `{ handled: true }` nur zurück, wenn der Provider die Nutzungs-
        authentifizierung definitiv verarbeitet hat, aber über keinen verwendbaren Nutzungstoken verfügt, und OpenClaw den generischen
        API-Schlüssel-/OAuth-Fallback überspringen muss. Geben Sie `null` oder `undefined` zurück, wenn der Provider die
        Anfrage nicht verarbeitet hat und OpenClaw mit dem generischen Fallback fortfahren soll.

        Deklarieren Sie die Provider-ID in `contracts.usageProviders`. Wenn dieser Manifest-
        vertrag und **beide** Hooks vorhanden sind, nimmt OpenClaw den
        Provider automatisch in die Nutzungserfassung auf, ohne nicht zugehörige Provider-
        Plugins zu laden. Eine Aktualisierung der Core-Zulassungsliste ist nicht erforderlich.
        `fetchUsageSnapshot` gibt die gemeinsame providerneutrale Struktur zurück:

        - `plan`: vom Provider gemeldetes Abonnement- oder Schlüssellabel
        - `windows`: zurücksetzbare Kontingentfenster als verbrauchte Prozentsätze
        - `billing`: typisierte Einträge `balance`, `spend` oder `budget`; `unit` kann
          eine ISO-Währung oder eine Provider-Einheit wie `credits` sein
        - `summary`: kompakter providerspezifischer Kontext, der nicht in diese
          strukturierten Felder passt

        Die Währungssemantik muss exakt bleiben. Ein Provider-Guthaben entspricht nicht USD, sofern der
        Upstream-Vertrag dies nicht festlegt. Ein Plugin, das nur
        `fetchUsageSnapshot` implementiert, bleibt für explizite/synthetische Aufrufer verfügbar, wird jedoch
        nicht automatisch erkannt, da OpenClaw seinen Nutzungsberechtigungsnachweis nicht auflösen kann.
      </Tab>
    </Tabs>

    <Accordion title="Gängige Provider-Hooks">
      OpenClaw ruft Hooks für Modell-/Provider-Plugins ungefähr in dieser Reihenfolge auf.
      Die meisten Provider verwenden nur 2–3. Dies ist nicht der vollständige Vertrag `ProviderPlugin` –
      die vollständige, derzeit aktuelle Hook-Liste und Hinweise zu Fallbacks finden Sie unter
      [Interna: Provider-Runtime-
      Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
      Reine Kompatibilitätsfelder für Provider, die OpenClaw nicht mehr aufruft, etwa
      `ProviderPlugin.capabilities` und `suppressBuiltInModel`, sind hier nicht
      aufgeführt.

      | Hook | Verwendungszweck |
      | --- | --- |
      | `catalog` | Modellkatalog oder Standardwerte für die Basis-URL |
      | `applyConfigDefaults` | Providereigene globale Standardwerte während der Konfigurationsmaterialisierung |
      | `normalizeModelId` | Bereinigung von Aliasen für alte/Vorschau-Modell-IDs vor der Suche |
      | `normalizeTransport` | Bereinigung von `api` / `baseUrl` der Provider-Familie vor der generischen Modellzusammenstellung |
      | `normalizeConfig` | Konfiguration `models.providers.<id>` normalisieren |
      | `applyNativeStreamingUsageCompat` | Native Kompatibilitätsumschreibungen der Streaming-Nutzung für Konfigurationsprovider |
      | `resolveConfigApiKey` | Providereigene Authentifizierungsauflösung für Umgebungsmarker |
      | `resolveSyntheticAuth` | Synthetische Authentifizierung für lokale/selbst gehostete oder konfigurationsgestützte Provider |
      | `resolveExternalAuthProfiles` | Providereigene externe Authentifizierungsprofile für von CLI/App verwaltete Anmeldedaten überlagern |
      | `shouldDeferSyntheticProfileAuth` | Synthetische Platzhalter gespeicherter Profile hinter Umgebungs-/Konfigurationsauthentifizierung nachrangig behandeln |
      | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | `prepareDynamicModel` | Asynchroner Abruf von Metadaten vor der Auflösung |
      | `normalizeResolvedModel` | Transportumschreibungen vor dem Runner |
      | `normalizeToolSchemas` | Providereigene Bereinigung des Tool-Schemas vor der Registrierung |
      | `inspectToolSchemas` | Providereigene Tool-Schema-Diagnose |
      | `resolveReasoningOutputMode` | Vertrag für getaggte gegenüber nativer Reasoning-Ausgabe |
      | `prepareExtraParams` | Standardparameter für Anfragen |
      | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | `wrapStreamFn` | Wrapper für benutzerdefinierte Header/Body auf dem normalen Stream-Pfad |
      | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | `resolveWebSocketSessionPolicy` | Native WS-Sitzungsheader/Abklingzeit |
      | `formatApiKey` | Benutzerdefinierte Runtime-Token-Struktur |
      | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | `buildAuthDoctorHint` | Anleitung zur Reparatur der Authentifizierung |
      | `matchesContextOverflowError` | Providereigene Überlauferkennung |
      | `classifyFailoverReason` | Providereigene Klassifizierung von Ratenbegrenzung/Überlastung |
      | `isCacheTtlEligible` | TTL-Steuerung des Prompt-Caches |
      | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | `augmentModelCatalog` | Synthetische Zeilen für Vorwärtskompatibilität (veraltet – bevorzugt `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Modellspezifischer Optionssatz `/think` |
      | `isBinaryThinking` | Kompatibilität zum Ein-/Ausschalten von binärem Thinking (veraltet – bevorzugt `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Kompatibilität der Reasoning-Unterstützung `xhigh` (veraltet – bevorzugt `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Kompatibilität der Standardrichtlinie `/think` (veraltet – bevorzugt `resolveThinkingProfile`) |
      | `isModernModelRef` | Modellabgleich für Live-/Smoke-Tests |
      | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Nutzungsberechtigungsnachweisen |
      | `fetchUsageSnapshot` | Benutzerdefinierter Nutzungsendpunkt |
      | `createEmbeddingProvider` | Providereigener Embedding-Adapter für Speicher/Suche |
      | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transkript-Replay/Compaction |
      | `sanitizeReplayHistory` | Providerspezifische Replay-Umschreibungen nach der generischen Bereinigung |
      | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | `onModelSelected` | Callback nach der Auswahl (z. B. Telemetrie) |

      Hinweise zu Runtime-Fallbacks:

      - `normalizeConfig` ermittelt pro Provider-ID genau ein zuständiges Plugin (zuerst gebündelte Provider, dann das passende Laufzeit-Plugin) und ruft nur diesen Hook auf – es erfolgt keine Suche über andere Provider hinweg. Googles eigener `normalizeConfig`-Hook normalisiert die Konfigurationseinträge `google` / `google-vertex` / `google-antigravity`; er ist kein separater Core-Fallback.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn dieser verfügbar ist. Amazon Bedrock behält die Auflösung von AWS-Umgebungsmarkierungen in seinem Provider-Plugin; die Laufzeitauthentifizierung selbst verwendet bei einer Konfiguration mit `auth: "aws-sdk"` weiterhin die Standardkette des AWS SDK.
      - `resolveThinkingProfile(ctx)` erhält die ausgewählten `provider`, `modelId`, den optional zusammengeführten Kataloghinweis `reasoning` und die optional zusammengeführten Modelldaten `compat`. Verwenden Sie `compat` nur zur Auswahl der Denkoberfläche bzw. des Denkprofils des Providers.
      - `resolveSystemPromptContribution` ermöglicht einem Provider, cachebezogene Anleitungen für den System-Prompt einer Modellfamilie einzufügen. Bevorzugen Sie dies gegenüber dem veralteten Plugin-weiten `before_prompt_build`-Hook, wenn das Verhalten zu einer einzelnen Provider-/Modellfamilie gehört und die stabile/dynamische Cache-Aufteilung beibehalten werden soll.

    </Accordion>

  </Step>

  <Step title="Zusätzliche Funktionen hinzufügen (optional)">
    ### Schritt 5: Zusätzliche Funktionen hinzufügen

    Ein Provider-Plugin kann zusätzlich zur Textinferenz Embeddings, Sprache,
    Echtzeittranskription, Echtzeitsprachkommunikation, Medienverständnis,
    Bildgenerierung, Videogenerierung, Webabruf und Websuche registrieren.
    OpenClaw klassifiziert dies als **Hybridfunktions-Plugin** – das empfohlene
    Muster für Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe
    [Interna: Zuständigkeit für Funktionen](/de/plugins/architecture#capability-ownership-model).

    Registrieren Sie jede Funktion innerhalb von `register(api)` zusammen mit
    Ihrem bestehenden `api.registerProvider(...)`-Aufruf. Wählen Sie nur die benötigten
    Registerkarten aus:

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

        Verwenden Sie `assertOkOrThrowProviderError(...)` für HTTP-Fehler des Providers, damit
        Plugins begrenztes Lesen von Fehlertexten, die Analyse von JSON-Fehlern
        und Request-ID-Suffixe gemeinsam nutzen.
      </Tab>
      <Tab title="Echtzeittranskription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` – die gemeinsam genutzte
        Hilfsfunktion übernimmt Proxy-Erfassung, Wiederverbindungsverzögerungen,
        das Leeren beim Schließen, Bereitschafts-Handshakes, Audio-Warteschlangen
        und Diagnosen für Schließereignisse. Ihr Plugin ordnet lediglich
        vorgelagerte Ereignisse zu.

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

        Batch-STT-Provider, die mehrteilige Audiodaten per POST senden, sollten
        `buildAudioTranscriptionFormData(...)` aus
        `openclaw/plugin-sdk/provider-http` verwenden. Die Hilfsfunktion normalisiert
        Upload-Dateinamen, einschließlich AAC-Uploads, die für kompatible
        Transkriptions-APIs einen Dateinamen im M4A-Stil benötigen.
      </Tab>
      <Tab title="Echtzeitsprachkommunikation">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Legen Sie dies nur fest, wenn der Provider mehrere Tool-Antworten
            // für einen Aufruf akzeptiert, beispielsweise eine sofortige
            // „In Bearbeitung“-Antwort, gefolgt vom endgültigen Ergebnis.
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

        Deklarieren Sie `capabilities`, damit `talk.catalog` gültige Modi,
        Transportarten, Audioformate und Funktionsschalter für Browser- und native
        Talk-Clients bereitstellen kann. Implementieren Sie `handleBargeIn`, wenn
        eine Transportart erkennen kann, dass ein Mensch die Wiedergabe des
        Assistenten unterbricht, und der Provider das Kürzen oder Löschen der
        aktiven Audioantwort unterstützt.
        `submitToolResult` kann für eine synchrone Übermittlung `void` oder
        eine `Promise<void>` für eine asynchrone Abschlussgrenze zurückgeben,
        die die Provider-Bridge bereitstellen kann. Gateway-Relay-Sitzungen warten
        auf dieses Promise, bevor sie ein endgültiges Ergebnis bestätigen oder
        den verknüpften Lauf löschen; lehnen Sie es ab, wenn die Übermittlung
        fehlschlägt.
        Legen Sie `supportsToolResultSuppression: false` fest, wenn der Provider
        `options.suppressResponse` nicht einhalten kann. OpenClaw vermeidet dann die
        Unterdrückung bei internen Ergebnissen erzwungener Konsultationen und
        Abbrüchen und lehnt direkte Anforderungen unterdrückter Ergebnisse ab,
        anstatt stillschweigend eine Antwort zu starten.
        Nutzer von `createRealtimeVoiceBridgeSession` können ebenso ein
        Promise aus `onToolCall` zurückgeben; synchrone Ausnahmen und
        Ablehnungen werden an den `onError`-Callback der Sitzung
        weitergeleitet.
        Legen Sie `handlesInputAudioBargeIn` nur fest, wenn die VAD des Providers eine
        Unterbrechung durch Aufruf von `onClearAudio("barge-in")` bestätigt. Provider, die
        das Flag weglassen, verwenden OpenClaws lokale Fallback-Erkennung für
        eingehende Audiodaten.
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

        Lokale oder selbst gehostete Medien-Provider, die absichtlich keine
        Anmeldedaten benötigen, können `resolveAuth` bereitstellen und
        `kind: "none"` zurückgeben. OpenClaw behält für Provider, die sich
        nicht ausdrücklich dafür entscheiden, weiterhin die normale
        Authentifizierungsschranke bei. Bestehende Provider können weiterhin
        `req.apiKey` lesen; neue Provider sollten `req.auth`
        bevorzugen.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
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
        allgemeine Embedding-Vertrag für wiederverwendbare Vektorgenerierung,
        einschließlich der Speichersuche. `registerMemoryEmbeddingProvider(...)` ist eine veraltete
        Kompatibilitätsschnittstelle für bestehende speicherspezifische Adapter.
      </Tab>
      <Tab title="Bild- und Videogenerierung">
        Bild- und Videofunktionen verwenden eine **modusbezogene** Struktur.
        Bild-Provider deklarieren die erforderlichen Funktionsblöcke
        `generate` und `edit`; Video-Provider deklarieren
        `generate`, `imageToVideo` und
        `videoToVideo`. Flache, aggregierte Felder wie `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` reichen nicht aus, um die
        Unterstützung des Transformationsmodus oder deaktivierte Modi eindeutig
        anzugeben. Die Musikgenerierung folgt demselben Muster
        `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme-Bilder",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme-Video",
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

        Verwenden Sie `catalogByModel`, wenn die statischen Modi oder Fähigkeiten eines aufgeführten Modells
        von den Standardeinstellungen des Providers abweichen. Diese Metadaten halten
        `video_generate action=list` und Modellkataloge korrekt, ohne
        Provider-Code aufzurufen. Die Ermittlung und Durchsetzung von Fähigkeiten zur Anfragezeit
        gehören weiterhin in `resolveModelCapabilities` und `generateVideo`; verwenden Sie nach Möglichkeit
        für beide Pfade dieselbe Fähigkeitskonstante.
      </Tab>
      <Tab title="Webabruf und -suche">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme-Abruf",
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
            description: "Eine Seite über Acme-Abruf abrufen.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme-Suche",
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
            description: "Das Web über Acme-Suche durchsuchen.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Beide Provider-Typen verwenden dieselbe Struktur zur Einbindung von Anmeldedaten:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` und `createTool` sind alle
        erforderlich.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Testen">
    ### Schritt 6: Testen

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportieren Sie Ihr Provider-Konfigurationsobjekt aus index.ts oder einer eigenen Datei
    import { acmeProvider } from "./provider.js";

    describe("acme-ai-Provider", () => {
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

`clawhub skill publish <path>` ist ein anderer Befehl zum Veröffentlichen eines Skills-Ordners
und nicht eines Plugin-Pakets – verwenden Sie ihn hier nicht.

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

| Reihenfolge     | Zeitpunkt          | Anwendungsfall                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Erster Durchlauf    | Einfache Provider mit API-Schlüssel                         |
| `profile` | Nach einfachen Providern  | Provider, die Authentifizierungsprofile voraussetzen                |
| `paired`  | Nach Profilen | Mehrere zusammengehörige Einträge erzeugen             |
| `late`    | Letzter Durchlauf     | Vorhandene Provider überschreiben (gewinnt bei Kollisionen) |

## Nächste Schritte

- [Channel-Plugins](/de/plugins/sdk-channel-plugins) – wenn Ihr Plugin auch einen Channel bereitstellt
- [SDK-Laufzeit](/de/plugins/sdk-runtime) – `api.runtime`-Hilfsfunktionen (TTS, Suche, Subagent)
- [SDK-Übersicht](/de/plugins/sdk-overview) – vollständige Referenz für Subpfadimporte
- [Plugin-Interna](/de/plugins/architecture-internals#provider-runtime-hooks) – Hook-Details und gebündelte Beispiele

## Verwandte Themen

- [Plugin-SDK einrichten](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Channel-Plugins erstellen](/de/plugins/sdk-channel-plugins)
