---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
    - Sie möchten OpenRouter für die Videogenerierung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T21:01:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter stellt eine **einheitliche API** bereit, die Anfragen an viele Modelle hinter einem einzigen
Endpunkt und API-Schlüssel weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Ändern der Basis-URL.

## Erste Schritte

<Steps>
  <Step title="Get your API key">
    Erstellen Sie einen API-Schlüssel unter [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    Onboarding verwendet standardmäßig `openrouter/auto`. Wählen Sie später ein konkretes Modell aus:

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

Mitgelieferte Fallback-Beispiele:

| Modellreferenz                   | Hinweise                     |
| -------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatisches OpenRouter-Routing |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 über MoonshotAI    |

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

OpenClaw sendet Bildanfragen an OpenRouters Chat-Completions-Bild-API mit `modalities: ["image", "text"]`. Gemini-Bildmodelle erhalten unterstützte Hinweise zu `aspectRatio` und `resolution` über OpenRouters `image_config`. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere OpenRouter-Bildmodelle; der Parameter `timeoutMs` pro Aufruf des Tools `image_generate` hat weiterhin Vorrang.

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

OpenClaw sendet Text-zu-Video- und Bild-zu-Video-Aufträge an OpenRouter, fragt
die zurückgegebene `polling_url` ab und lädt das abgeschlossene Video von
OpenRouters `unsigned_urls` oder dem dokumentierten Endpunkt für Auftragsinhalte herunter.
Referenzbilder werden standardmäßig als Bilder für den ersten/letzten Frame gesendet; Bilder,
die mit `reference_image` markiert sind, werden als OpenRouter-Eingabereferenzen gesendet. Die
mitgelieferte Standardeinstellung `google/veo-3.1-fast` weist die derzeit unterstützten Dauern von 4/6/8
Sekunden, Auflösungen `720P`/`1080P` und Seitenverhältnisse `16:9`/`9:16` aus.
Video-zu-Video ist für OpenRouter nicht registriert, da die vorgelagerte
Videoerzeugungs-API derzeit Text- und Bildreferenzen akzeptiert.

## Text-to-Speech

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

OpenRouter verwendet im Hintergrund ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die von OpenRouter dokumentierten Header zur App-Zuordnung hinzu:

| Header                    | Wert                  |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL umleiten, fügt OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Markierungen **nicht** ein.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    OpenRouter-spezifischen Anthropic-`cache_control`-Markierungen, die OpenClaw für
    eine bessere Wiederverwendung des Prompt-Caches bei System-/Entwickler-Prompt-Blöcken verwendet.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Auf verifizierten OpenRouter-Routen entfernen Anthropic-Modellreferenzen mit aktiviertem Reasoning
    nachgestellte Assistant-Prefill-Turns, bevor die Anfrage OpenRouter erreicht,
    entsprechend Anthropics Anforderung, dass Reasoning-Unterhaltungen mit einem User-
    Turn enden.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Auf unterstützten Nicht-`auto`-Routen bildet OpenClaw die ausgewählte Denkstufe auf
    OpenRouter-Proxy-Reasoning-Payloads ab. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion. Hunter Alpha überspringt auch
    Proxy-Reasoning für veraltete konfigurierte Modellreferenzen, da OpenRouter
    für diese eingestellte Route endgültigen Antworttext in Reasoning-Feldern zurückgeben könnte.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Auf verifizierten OpenRouter-Routen füllen `openrouter/deepseek/deepseek-v4-flash` und
    `openrouter/deepseek/deepseek-v4-pro` fehlendes `reasoning_content` bei
    wiedergegebenen Assistant-Turns aus, damit Thinking-/Tool-Unterhaltungen die von DeepSeek V4
    erforderliche Folgeform beibehalten.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter läuft weiterhin über den proxyartigen OpenAI-kompatiblen Pfad, daher
    wird natives, nur für OpenAI bestimmtes Request-Shaping wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-Kompatibilitätspayloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Gemini-gestützte OpenRouter-Referenzen bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Bereinigung von Gemini-Denksignaturen bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    es als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
