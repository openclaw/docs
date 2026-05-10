---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs verwenden
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
    - Sie möchten OpenRouter zur Videogenerierung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:50:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter stellt eine **vereinheitlichte API** bereit, die Anfragen an viele Modelle hinter einem einzigen
Endpunkt und API-Schlüssel weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI-SDKs durch Wechsel der Basis-URL funktionieren.

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

| Modellreferenz                   | Hinweise                     |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatisches OpenRouter-Routing |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 über MoonshotAI    |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 über MoonshotAI    |

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

OpenClaw sendet Bildanfragen an OpenRouters Chat-Completions-Bild-API mit `modalities: ["image", "text"]`. Gemini-Bildmodelle erhalten unterstützte `aspectRatio`- und `resolution`-Hinweise über OpenRouters `image_config`. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere OpenRouter-Bildmodelle; der `timeoutMs`-Parameter pro Aufruf des Tools `image_generate` hat weiterhin Vorrang.

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

OpenClaw übermittelt Text-zu-Video- und Bild-zu-Video-Jobs an OpenRouter, fragt
die zurückgegebene `polling_url` ab und lädt das fertige Video von
OpenRouters `unsigned_urls` oder dem dokumentierten Endpunkt für Job-Inhalte herunter.
Referenzbilder werden standardmäßig als erste/letzte Frame-Bilder gesendet; Bilder,
die mit `reference_image` markiert sind, werden als OpenRouter-Eingabereferenzen gesendet. Der
gebündelte Standard `google/veo-3.1-fast` gibt die derzeit unterstützten Dauern von 4/6/8
Sekunden, Auflösungen `720P`/`1080P` und Seitenverhältnisse `16:9`/`9:16`
an. Video-zu-Video ist für OpenRouter nicht registriert, da die vorgelagerte
Videoerzeugungs-API derzeit Text- und Bildreferenzen akzeptiert.

## Text-zu-Sprache

OpenRouter kann auch als TTS-Provider über seinen OpenAI-kompatiblen
Endpunkt `/audio/speech` verwendet werden.

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
`models.providers.openrouter.apiKey` und danach `OPENROUTER_API_KEY`.

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten App-Attributions-Header von OpenRouter hinzu:

| Header                    | Wert                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL umleiten, injiziert OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker **nicht**.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Antwort-Caching">
    OpenRouter-Antwort-Caching ist optional. Aktivieren Sie es pro OpenRouter-Modell mit
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

    OpenClaw sendet `X-OpenRouter-Cache: true` und, falls konfiguriert,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` erzwingt eine Aktualisierung für
    die aktuelle Anfrage und speichert die Ersatzantwort. Snake_case-Aliase
    (`response_cache`, `response_cache_ttl_seconds` und
    `response_cache_clear`) werden ebenfalls akzeptiert.

    Dies ist getrennt vom Prompt-Caching des Providers und von OpenRouters
    Anthropic-`cache_control`-Markern. Es wird nur auf verifizierten
    `openrouter.ai`-Routen angewendet, nicht auf benutzerdefinierte Proxy-Basis-URLs.

  </Accordion>

  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    OpenRouter-spezifischen Anthropic-`cache_control`-Marker bei, die OpenClaw für
    bessere Wiederverwendung des Prompt-Cache bei System-/Developer-Prompt-Blöcken nutzt.
  </Accordion>

  <Accordion title="Anthropic-Reasoning-Prefill">
    Auf verifizierten OpenRouter-Routen entfernen Anthropic-Modellreferenzen mit aktiviertem Reasoning
    nachgestellte Assistant-Prefill-Turns, bevor die Anfrage OpenRouter erreicht,
    entsprechend der Anthropic-Anforderung, dass Reasoning-Konversationen mit einem User-
    Turn enden.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen ordnet OpenClaw die ausgewählte Thinking-Stufe
    den OpenRouter-Proxy-Reasoning-Payloads zu. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion. Hunter Alpha überspringt außerdem
    Proxy-Reasoning für veraltete konfigurierte Modellreferenzen, da OpenRouter
    für diese zurückgezogene Route endgültigen Antworttext in Reasoning-Feldern zurückgeben könnte.
  </Accordion>

  <Accordion title="DeepSeek V4-Reasoning-Wiedergabe">
    Auf verifizierten OpenRouter-Routen füllen `openrouter/deepseek/deepseek-v4-flash` und
    `openrouter/deepseek/deepseek-v4-pro` fehlende `reasoning_content` in
    wiedergegebenen Assistant-Turns auf, damit Thinking-/Tool-Konversationen die von DeepSeek V4
    erforderliche Follow-up-Form beibehalten. OpenClaw sendet von OpenRouter unterstützte
    `reasoning_effort`-Werte für diese Routen; `xhigh` ist die höchste beworbene
    Stufe, und veraltete `max`-Überschreibungen werden auf `xhigh` abgebildet.
  </Accordion>

  <Accordion title="Nur-OpenAI-Anfrageformung">
    OpenRouter läuft weiterhin über den proxyartigen OpenAI-kompatiblen Pfad, daher
    werden native, nur für OpenAI bestimmte Anfrageformungen wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-kompatible Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Referenzen bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Bereinigung der Gemini-Thought-Signaturen bei, aktiviert aber keine native Gemini-
    Wiedergabevalidierung oder Bootstrap-Umschreibungen.
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
