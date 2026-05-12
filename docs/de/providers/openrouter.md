---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
    - Sie möchten OpenRouter für die Videogenerierung verwenden
summary: Verwenden Sie die vereinheitlichte API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter stellt eine **einheitliche API** bereit, die Anfragen über einen einzelnen
Endpoint und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Wechsel der Basis-URL.

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Onboarding ausführen">
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
Modellreferenzen folgen dem Muster `openrouter/<provider>/<model>`. Die vollständige Liste der
verfügbaren Provider und Modelle finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
</Note>

Gebündelte Fallback-Beispiele:

| Modellreferenz                  | Hinweise                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatisches Routing von OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 über MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 über MoonshotAI     |

## Bildgenerierung

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

OpenClaw sendet Bildanfragen an OpenRouters Chat-Completions-Bild-API mit `modalities: ["image", "text"]`. Gemini-Bildmodelle erhalten unterstützte Hinweise zu `aspectRatio` und `resolution` über OpenRouters `image_config`. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere OpenRouter-Bildmodelle; der Pro-Aufruf-Parameter `timeoutMs` des Tools `image_generate` hat weiterhin Vorrang.

## Videogenerierung

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

OpenClaw übermittelt Text-zu-Video- und Bild-zu-Video-Jobs an OpenRouter, pollt
die zurückgegebene `polling_url` und lädt das fertige Video von
OpenRouters `unsigned_urls` oder dem dokumentierten Job-Content-Endpoint herunter.
Referenzbilder werden standardmäßig als Bilder für das erste/letzte Frame gesendet; Bilder,
die mit `reference_image` markiert sind, werden als OpenRouter-Eingabereferenzen gesendet. Der
gebündelte Standard `google/veo-3.1-fast` gibt die derzeit unterstützten Dauern von 4/6/8
Sekunden, Auflösungen `720P`/`1080P` und Seitenverhältnisse `16:9`/`9:16` an.
Video-zu-Video ist für OpenRouter nicht registriert, weil die vorgelagerte
Videogenerierungs-API derzeit Text- und Bildreferenzen akzeptiert.

## Text-to-Speech

OpenRouter kann auch als TTS-Provider über seinen OpenAI-kompatiblen
`/audio/speech`-Endpoint verwendet werden.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Wenn `messages.tts.providers.openrouter.apiKey` ausgelassen wird, verwendet TTS erneut
`models.providers.openrouter.apiKey`, dann `OPENROUTER_API_KEY`.

## Speech-to-Text (eingehendes Audio)

OpenRouter kann eingehende Sprach-/Audioanhänge über den gemeinsamen
Pfad `tools.media.audio` mit seinem STT-Endpoint (`/audio/transcriptions`) transkribieren.
Dies gilt für jedes Channel-Plugin, das eingehende Sprach-/Audiodaten an den
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
`input_audio` (OpenRouter-STT-Vertrag), nicht als mehrteilige OpenAI-Formular-Uploads.

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten App-Attributions-Header von OpenRouter hinzu:

| Header                    | Wert                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL umstellen, injiziert OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker **nicht**.
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
    `openrouter.ai`-Routen angewendet, nicht auf benutzerdefinierte Proxy-Basis-URLs.

  </Accordion>

  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    OpenRouter-spezifischen Anthropic-`cache_control`-Marker bei, die OpenClaw für
    bessere Prompt-Cache-Wiederverwendung bei System-/Developer-Prompt-Blöcken nutzt.
  </Accordion>

  <Accordion title="Anthropic-Reasoning-Prefill">
    Auf verifizierten OpenRouter-Routen entfernen Anthropic-Modellreferenzen mit aktiviertem Reasoning
    nachgestellte Assistant-Prefill-Turns, bevor die Anfrage OpenRouter erreicht,
    entsprechend Anthropics Anforderung, dass Reasoning-Konversationen mit einem User-
    Turn enden.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen ordnet OpenClaw die ausgewählte Thinking-Stufe
    OpenRouter-Proxy-Reasoning-Payloads zu. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion. Hunter Alpha überspringt außerdem
    Proxy-Reasoning für veraltete konfigurierte Modellreferenzen, weil OpenRouter
    für diese ausgemusterte Route endgültigen Antworttext in Reasoning-Feldern zurückgeben könnte.
  </Accordion>

  <Accordion title="DeepSeek-V4-Reasoning-Replay">
    Auf verifizierten OpenRouter-Routen füllen `openrouter/deepseek/deepseek-v4-flash` und
    `openrouter/deepseek/deepseek-v4-pro` fehlendes `reasoning_content` bei
    wiedergegebenen Assistant-Turns auf, damit Thinking-/Tool-Konversationen die für DeepSeek V4
    erforderliche Follow-up-Form beibehalten. OpenClaw sendet von OpenRouter unterstützte
    `reasoning_effort`-Werte für diese Routen; `xhigh` ist die höchste beworbene
    Stufe, und veraltete `max`-Overrides werden auf `xhigh` abgebildet.
  </Accordion>

  <Accordion title="Nur-OpenAI-Anfrageformung">
    OpenRouter läuft weiterhin über den Proxy-artigen OpenAI-kompatiblen Pfad, daher
    wird native nur für OpenAI geltende Anfrageformung wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-Kompatibilitäts-Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Referenzen bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Gemini-Thought-Signature-Bereinigung bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Rewrites.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    es als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
