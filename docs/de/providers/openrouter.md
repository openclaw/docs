---
read_when:
    - Sie möchten einen einzelnen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bilderzeugung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T18:21:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter bietet eine **einheitliche API**, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Umstellen der Base-URL.

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
    Beim Onboarding wird standardmäßig `openrouter/auto` gesetzt. Wählen Sie später ein konkretes Modell:

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

| Model ref                            | Notes                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter automatisches Routing |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 über MoonshotAI     |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha-Route |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha-Route |

## Bilderzeugung

OpenRouter kann auch das Werkzeug `image_generate` unterstützen. Verwenden Sie ein OpenRouter-Bildmodell unter `agents.defaults.imageGenerationModel`:

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

OpenClaw sendet Bildanfragen an OpenRouters Chat-Completions-Bild-API mit `modalities: ["image", "text"]`. Gemini-Bildmodelle erhalten unterstützte Hinweise zu `aspectRatio` und `resolution` über OpenRouters `image_config`. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere OpenRouter-Bildmodelle; der pro Aufruf gesetzte Parameter `timeoutMs` des Werkzeugs `image_generate` hat weiterhin Vorrang.

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

Wenn `messages.tts.providers.openrouter.apiKey` weggelassen wird, verwendet TTS stattdessen
`models.providers.openrouter.apiKey` und danach `OPENROUTER_API_KEY`.

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten OpenRouter-Header für Anwendungszuordnung hinzu:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Base-URL umleiten, fügt OpenClaw
diese OpenRouter-spezifischen Header und Anthropic-Cache-Markierungen **nicht** ein.
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
    OpenRouter-Proxy-Reasoning-Payloads zu. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion.
  </Accordion>

  <Accordion title="Nur für OpenAI geltende Anfrageformung">
    OpenRouter läuft weiterhin über den proxyartigen OpenAI-kompatiblen Pfad, daher
    werden ausschließlich native OpenAI-Anfrageformungen wie `serviceTier`, Responses-`store`,
    OpenAI-Reasoning-Kompatibilitäts-Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    OpenRouter-Referenzen, die auf Gemini basieren, bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält dort
    die Bereinigung von Gemini-Thought-Signaturen bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    es als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
