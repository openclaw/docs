---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
    - Sie möchten OpenRouter für die Musikgenerierung verwenden
    - Sie möchten OpenRouter für die Videogenerierung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:06:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter stellt eine **einheitliche API** bereit, die Anfragen an viele Modelle hinter einem einzigen
Endpoint und API-Schlüssel weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs, indem die Basis-URL geändert wird.

## Erste Schritte

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth-Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw öffnet den Browser-Anmeldefluss von OpenRouter, tauscht den PKCE-
        Code gegen einen OpenRouter-API-Schlüssel aus und speichert diesen Schlüssel im standardmäßigen
        OpenRouter-Authentifizierungsprofil. Auf Remote- oder Headless-Hosts gibt OpenClaw die
        Anmelde-URL aus und bittet Sie, nach der Anmeldung die Weiterleitungs-URL einzufügen.
      </Step>
      <Step title="(Optional) Zu einem bestimmten Modell wechseln">
        Das Onboarding verwendet standardmäßig `openrouter/auto`. Wählen Sie später ein konkretes Modell aus:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API-Schlüssel">
    <Steps>
      <Step title="Ihren API-Schlüssel abrufen">
        Erstellen Sie einen API-Schlüssel unter [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="API-Schlüssel-Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Zu einem bestimmten Modell wechseln">
        Das Onboarding verwendet standardmäßig `openrouter/auto`. Wählen Sie später ein konkretes Modell aus:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfigurationsbeispiel

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Modellreferenzen

<Note>
Modellrefs folgen dem Muster `openrouter/<provider>/<model>`. Die vollständige Liste der
verfügbaren Provider und Modelle finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
</Note>

Gebündelte Fallback-Beispiele:

| Modellref                         | Hinweise                       |
| --------------------------------- | ------------------------------ |
| `openrouter/auto`                 | Automatisches OpenRouter-Routing |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion-Router       |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 über MoonshotAI      |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 über MoonshotAI      |

## Bilderzeugung

OpenRouter kann auch das Tool `image_generate` unterstützen. Verwenden Sie ein OpenRouter-Bildmodell unter `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw sendet Bildanfragen mit `modalities: ["image", "text"]` an die Chat-Completions-Bild-API von OpenRouter. Gemini-Bildmodelle erhalten unterstützte Hinweise zu `aspectRatio` und `resolution` über `image_config` von OpenRouter. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere OpenRouter-Bildmodelle; der Pro-Aufruf-Parameter `timeoutMs` des Tools `image_generate` hat weiterhin Vorrang.

## Videoerzeugung

OpenRouter kann auch das Tool `video_generate` über seine asynchrone `/videos`-API unterstützen. Verwenden Sie ein OpenRouter-Videomodell unter `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw reicht Text-zu-Video- und Bild-zu-Video-Aufträge bei OpenRouter ein, fragt
die zurückgegebene `polling_url` ab und lädt das fertiggestellte Video von
OpenRouters `unsigned_urls` oder dem dokumentierten Endpoint für Auftragsinhalte herunter.
Referenzbilder werden standardmäßig als Erst- oder Letztframe-Bilder gesendet; Bilder,
die mit `reference_image` markiert sind, werden als OpenRouter-Eingabereferenzen gesendet. Der
gebündelte Standard `google/veo-3.1-fast` weist auf die aktuell unterstützten Dauern von 4/6/8
Sekunden, die Auflösungen `720P`/`1080P` und die Seitenverhältnisse `16:9`/`9:16` hin.
Video-zu-Video ist für OpenRouter nicht registriert, da die vorgelagerte
Videoerzeugungs-API derzeit Text- und Bildreferenzen akzeptiert.

## Musikerzeugung

OpenRouter kann auch das Tool `music_generate` über Audioausgabe aus Chat Completions
unterstützen. Verwenden Sie ein OpenRouter-Audiomodell unter
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Der gebündelte OpenRouter-Musik-Provider verwendet standardmäßig
`google/lyria-3-pro-preview` und stellt außerdem
`google/lyria-3-clip-preview` bereit. OpenClaw sendet `modalities: ["text",
"audio"]`, aktiviert Streaming, sammelt die gestreamten Audioblöcke und speichert
das Ergebnis als generiertes Medium für die Zustellung über Kanäle. Referenzbilder werden
für Lyria-Modelle über den gemeinsamen Parameter `music_generate image=...`
akzeptiert.

## Text-to-speech

OpenRouter kann auch als TTS-Provider über seinen OpenAI-kompatiblen
Endpoint `/audio/speech` verwendet werden.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Wenn `messages.tts.providers.openrouter.apiKey` weggelassen wird, verwendet TTS erneut
`models.providers.openrouter.apiKey` und danach `OPENROUTER_API_KEY`.

## Speech-to-text (eingehendes Audio)

OpenRouter kann eingehende Sprach- oder Audioanhänge über den gemeinsamen
Pfad `tools.media.audio` mit seinem STT-Endpoint (`/audio/transcriptions`) transkribieren.
Dies gilt für jedes Kanal-Plugin, das eingehende Sprach- oder Audiodaten an den
Media-Understanding-Preflight weiterleitet.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw sendet OpenRouter-STT-Anfragen als JSON mit Base64-Audio unter
`input_audio` (OpenRouter-STT-Vertrag), nicht als Multipart-OpenAI-Formular-Uploads.

## Fusion-Router

Verwenden Sie OpenRouter Fusion, wenn eine OpenClaw-Modellref mehrere
OpenRouter-Modelle parallel anfragen, OpenRouter deren Antworten bewerten und eine
einzige finale Antwort über den normalen OpenRouter-Provider-Endpoint zurückgeben soll. Da
der vorgelagerte Modell-Slug `openrouter/fusion` lautet, enthält die OpenClaw-Modellref
sowohl das OpenClaw-Provider-Präfix als auch den vorgelagerten OpenRouter-Namespace:

```bash
openclaw models set openrouter/openrouter/fusion
```

Konfigurieren Sie das Panel und das Bewertungsmodell von Fusion über `params.extraBody` des Modells. Diese
Felder werden in den OpenRouter-Chat-Completions-Anfragetext weitergeleitet. Fusion
funktioniert sowohl mit OpenRouter-OAuth-Onboarding als auch mit API-Schlüssel-Onboarding; wenn Sie
OAuth verwenden, lassen Sie die Zeile `env.OPENROUTER_API_KEY` im folgenden Beispiel weg.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

Die Liste `analysis_models` ist das parallele Panel, und `model` innerhalb der Fusion-
Plugin-Konfiguration ist das Bewertungsmodell. Setzen Sie `tool_choice` auf oberster Ebene in normalen OpenClaw-Agenten- oder Chat-Turns nicht auf
`"required"`, um zu versuchen, Fusion zu erzwingen;
OpenClaw-Turns können OpenClaw-Tooldefinitionen enthalten, und eine auf oberster Ebene erforderliche
Tool-Auswahl kann eines dieser Tools statt des Fusion-Routers erzwingen. Wenn
diese Fusion-Plugin-Konfiguration vorhanden ist, fügt OpenClaw außerdem einen bereinigten
System-Prompt-Hinweis mit den konfigurierten Analysemodellen und dem Bewertungsmodell hinzu, damit der
Agent Fragen zu seinem aktuellen Fusion-Panel beantworten kann. Andere `extraBody`-
Felder werden nicht in den Prompt kopiert.

Fusion ist bewusst langsamer. OpenRouter kann denselben OpenClaw-Prompt an
mehrere Analysemodelle senden und anschließend einen finalen Bewertungs- oder Syntheseschritt ausführen, daher ist die Latenz
normalerweise höher als bei einer direkten Anfrage an ein einzelnes Modell. Verwenden Sie Fusion für wohlüberlegte,
hochwertige Antworten oder Eskalationspfade, nicht als Standard für
latenzempfindlichen Chat. Für schnellere Antworten halten Sie das Panel klein und wählen
schnellere Analyse- und Bewertungsmodelle.

Testen Sie die konfigurierte Ref mit einem einmaligen lokalen Modellaufruf:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel. OpenRouter-
OAuth ist ein PKCE-Anmeldefluss, der einen OpenRouter-API-Schlüssel ausstellt, daher speichert OpenClaw
das Ergebnis als dasselbe `openrouter:default`-API-Schlüssel-Authentifizierungsprofil, das auch vom
manuellen API-Schlüssel-Einrichtungspfad verwendet wird.

Melden Sie sich bei einer vorhandenen Installation an oder rotieren Sie den gespeicherten OpenRouter-Schlüssel, ohne
das vollständige Onboarding erneut auszuführen:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Verwenden Sie `openclaw models auth login --provider openrouter --method api-key`, wenn
Sie einen Schlüssel einfügen möchten, den Sie manuell bei OpenRouter erstellt haben.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten App-Attributions-Header von OpenRouter hinzu:

| Header                    | Wert                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL umstellen, fügt OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker **nicht** ein.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Antwort-Caching">
    OpenRouter-Antwort-Caching ist Opt-in. Aktivieren Sie es pro OpenRouter-Modell mit
    Modellparametern:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw sendet `X-OpenRouter-Cache: true` und, wenn konfiguriert,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` erzwingt eine Aktualisierung für
    die aktuelle Anfrage und speichert die Ersatzantwort. Snake_case-Aliasse
    (`response_cache`, `response_cache_ttl_seconds` und
    `response_cache_clear`) werden ebenfalls akzeptiert.

    Dies ist getrennt vom Provider-Prompt-Caching und von OpenRouters
    Anthropic-`cache_control`-Markern. Es wird nur auf verifizierten
    `openrouter.ai`-Routen angewendet, nicht auf benutzerdefinierten Proxy-Basis-URLs.

  </Accordion>

  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellrefs die
    OpenRouter-spezifischen Anthropic-`cache_control`-Marker, die OpenClaw für
    bessere Wiederverwendung des Prompt-Caches bei System- und Developer-Prompt-Blöcken verwendet.
  </Accordion>

  <Accordion title="Anthropic-Reasoning-Prefill">
    Auf verifizierten OpenRouter-Routen entfernen Anthropic-Modell-Refs mit aktiviertem Reasoning
    nachgestellte Assistant-Prefill-Turns, bevor die Anfrage OpenRouter erreicht.
    Das entspricht der Anthropic-Anforderung, dass Reasoning-Konversationen mit einem User-
    Turn enden.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen ordnet OpenClaw die ausgewählte Denkstufe
    OpenRouter-Proxy-Reasoning-Payloads zu. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion. Hunter Alpha überspringt
    Proxy-Reasoning außerdem für veraltete konfigurierte Modell-Refs, weil OpenRouter
    für diese eingestellte Route finalen Antworttext in Reasoning-Feldern zurückgeben könnte.
  </Accordion>

  <Accordion title="DeepSeek-V4-Reasoning-Replay">
    Auf verifizierten OpenRouter-Routen füllen `openrouter/deepseek/deepseek-v4-flash` und
    `openrouter/deepseek/deepseek-v4-pro` fehlendes `reasoning_content` bei
    wiedergegebenen Assistant-Turns auf, damit Thinking-/Tool-Konversationen die von DeepSeek V4
    erforderliche Follow-up-Form beibehalten. OpenClaw sendet von OpenRouter unterstützte
    `reasoning_effort`-Werte für diese Routen; `xhigh` ist die höchste beworbene
    Stufe, und veraltete `max`-Overrides werden `xhigh` zugeordnet.
  </Accordion>

  <Accordion title="Nur-OpenAI-Anfrageformung">
    OpenRouter läuft weiterhin über den Proxy-artigen OpenAI-kompatiblen Pfad, daher
    wird native, nur OpenAI betreffende Anfrageformung wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-Kompatibilitätspayloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Refs bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Gemini-Thought-Signature-Bereinigung bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Rewrites.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    OpenRouter unterstützt ein `provider`-Anfrageobjekt für das Routing zum zugrunde liegenden Provider.
    Konfigurieren Sie eine Standardrichtlinie für alle OpenRouter-Textmodell-Anfragen
    mit `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw leitet dieses Objekt als `provider`-Payload der Anfrage an OpenRouter weiter.
    Verwenden Sie die von OpenRouter dokumentierten snake_case-Felder, einschließlich `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` und `enforce_distillable_text`.

    Parameter pro Modell überschreiben weiterhin das Provider-weite Routing-Objekt:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Dies gilt nur für OpenRouter-Chat-Completions-Routen. Direkte Anthropic-,
    Google-, OpenAI- oder benutzerdefinierte Provider-Routen ignorieren OpenRouter-Routing-Parameter.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
