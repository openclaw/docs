---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
    - Sie möchten OpenRouter für die Videogenerierung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T07:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter stellt eine **einheitliche API** bereit, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI-SDKs durch Wechsel der Basis-URL funktionieren.

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
    Beim Onboarding wird standardmäßig `openrouter/auto` verwendet. Wählen Sie später ein konkretes Modell aus:

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

OpenClaw sendet Bildanfragen mit `modalities: ["image", "text"]` an die Chat-Completions-Bild-API von OpenRouter. Gemini-Bildmodelle erhalten unterstützte Hinweise für `aspectRatio` und `resolution` über OpenRouters `image_config`. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere OpenRouter-Bildmodelle; der `timeoutMs`-Parameter pro Aufruf des Tools `image_generate` hat weiterhin Vorrang.

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

OpenClaw übermittelt Text-zu-Video- und Bild-zu-Video-Aufträge an OpenRouter, fragt
die zurückgegebene `polling_url` ab und lädt das abgeschlossene Video von
OpenRouters `unsigned_urls` oder dem dokumentierten Inhaltsendpunkt für Aufträge herunter.
Referenzbilder werden standardmäßig als Bilder für das erste/letzte Frame gesendet; Bilder,
die mit `reference_image` markiert sind, werden als OpenRouter-Eingabereferenzen gesendet. Der
gebündelte Standard `google/veo-3.1-fast` weist auf die derzeit unterstützten Dauern von 4/6/8
Sekunden, `720P`/`1080P`-Auflösungen und `16:9`/`9:16`-Seitenverhältnisse hin. Video-zu-Video ist für OpenRouter nicht registriert, da die Upstream-API
zur Videoerzeugung derzeit Text- und Bildreferenzen akzeptiert.

## Text-zu-Sprache

OpenRouter kann auch als TTS-Provider über seinen OpenAI-kompatiblen
`/audio/speech`-Endpunkt verwendet werden.

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

Wenn `messages.tts.providers.openrouter.apiKey` weggelassen wird, verwendet TTS erneut
`models.providers.openrouter.apiKey` und danach `OPENROUTER_API_KEY`.

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten App-Attributions-Header von OpenRouter hinzu:

| Header                    | Wert                  |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL umstellen, fügt OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Markierungen **nicht** ein.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anthropic-Cache-Markierungen">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    OpenRouter-spezifischen Anthropic-`cache_control`-Markierungen bei, die OpenClaw für
    eine bessere Wiederverwendung des Prompt-Caches bei System-/Developer-Prompt-Blöcken verwendet.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen ordnet OpenClaw die ausgewählte Thinking-Stufe
    den Reasoning-Payloads des OpenRouter-Proxys zu. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion. Hunter Alpha überspringt außerdem
    Proxy-Reasoning für veraltete konfigurierte Modellreferenzen, weil OpenRouter
    für diese eingestellte Route endgültigen Antworttext in Reasoning-Feldern zurückgeben könnte.
  </Accordion>

  <Accordion title="Nur-OpenAI-Anfrageformung">
    OpenRouter läuft weiterhin über den proxyartigen OpenAI-kompatiblen Pfad, sodass
    native Nur-OpenAI-Anfrageformung wie `serviceTier`, Responses-`store`,
    OpenAI-Reasoning-Kompatibilitätspayloads und Prompt-Cache-Hinweise nicht weitergeleitet werden.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Referenzen bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Bereinigung von Gemini-Gedankensignaturen bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    es als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
