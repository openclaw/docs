---
read_when:
    - Sie möchten einen einzigen API-Key für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
summary: Die einheitliche API von OpenRouter verwenden, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:55:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter bietet eine **einheitliche API**, die Anfragen über einen einzigen
Endpunkt und API-Key an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch einfaches Umschalten der Base-URL.

## Erste Schritte

<Steps>
  <Step title="Ihren API-Key abrufen">
    Erstellen Sie einen API-Key unter [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Zu einem bestimmten Modell wechseln">
    Das Onboarding verwendet standardmäßig `openrouter/auto`. Wählen Sie später ein konkretes Modell:

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
Modellreferenzen folgen dem Muster `openrouter/<provider>/<model>`. Die vollständige Liste
verfügbarer Provider und Modelle finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
</Note>

Beispiele für gebündelte Fallbacks:

| Model ref                            | Hinweise                     |
| ------------------------------------ | ---------------------------- |
| `openrouter/auto`                    | Automatisches Routing von OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 über MoonshotAI    |
| `openrouter/openrouter/healer-alpha` | OpenRouter-Healer-Alpha-Route |
| `openrouter/openrouter/hunter-alpha` | OpenRouter-Hunter-Alpha-Route |

## Bildgenerierung

OpenRouter kann auch das Tool `image_generate` antreiben. Verwenden Sie ein OpenRouter-Bildmodell unter `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw sendet Bildanfragen an die Bild-API für Chat Completions von OpenRouter mit `modalities: ["image", "text"]`. Gemini-Bildmodelle erhalten unterstützte Hinweise für `aspectRatio` und `resolution` über `image_config` von OpenRouter.

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

Wenn `messages.tts.providers.openrouter.apiKey` nicht gesetzt ist, verwendet TTS
zuerst `models.providers.openrouter.apiKey`, dann `OPENROUTER_API_KEY`.

## Authentifizierung und Header

OpenRouter verwendet unter der Haube ein Bearer-Token mit Ihrem API-Key.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die von OpenRouter dokumentierten Header für App-Attribution hinzu:

| Header                    | Wert                  |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Base-URL umleiten, fügt OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker **nicht** ein.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    OpenRouter-spezifischen Anthropic-`cache_control`-Marker, die OpenClaw für
    bessere Wiederverwendung des Prompt-Cache auf Blöcken mit System-/Entwickler-Prompts verwendet.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen bildet OpenClaw das ausgewählte Thinking-Level auf
    Reasoning-Payloads des OpenRouter-Proxys ab. Nicht unterstützte Modell-Hints und
    `openrouter/auto` überspringen diese Reasoning-Injektion.
  </Accordion>

  <Accordion title="Nur für OpenAI geltende Request-Formung">
    OpenRouter läuft weiterhin über den proxyartigen OpenAI-kompatiblen Pfad, daher
    werden native nur für OpenAI geltende Request-Formungen wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-kompatible Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    OpenRouter-Referenzen auf Basis von Gemini bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Bereinigung von Gemini-Thought-Signaturen bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie Provider-Routing von OpenRouter unter Modellparametern übergeben, leitet OpenClaw
    diese als Routing-Metadaten von OpenRouter weiter, bevor die gemeinsamen Stream-Wrapper laufen.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
