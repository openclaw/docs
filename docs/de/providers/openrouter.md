---
read_when:
    - Sie möchten einen einzelnen API-Key für viele LLMs გამოიყენել
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:27:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter bietet eine **einheitliche API**, die Anfragen über einen einzigen
Endpunkt und API-Key an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Umstellen der Base-URL.

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
    Beim Onboarding wird standardmäßig `openrouter/auto` verwendet. Wählen Sie später ein konkretes Modell:

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

Beispiele für gebündelte Fallbacks:

| Modellreferenz                       | Hinweise                      |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Automatisches Routing von OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 über MoonshotAI     |
| `openrouter/openrouter/healer-alpha` | OpenRouter-Healer-Alpha-Route |
| `openrouter/openrouter/hunter-alpha` | OpenRouter-Hunter-Alpha-Route |

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Key.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die von OpenRouter dokumentierten App-Attribution-Header hinzu:

| Header                    | Wert                  |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Base-URL umstellen, injiziert OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker **nicht**.
</Warning>

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    OpenRouter-spezifischen Anthropic-`cache_control`-Marker, die OpenClaw für
    eine bessere Wiederverwendung des Prompt-Caches bei System-/Developer-Prompt-Blöcken verwendet.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen bildet OpenClaw das ausgewählte Thinking-Level auf
    OpenRouter-Proxy-Reasoning-Payloads ab. Hinweise auf nicht unterstützte Modelle und
    `openrouter/auto` überspringen diese Reasoning-Injektion.
  </Accordion>

  <Accordion title="Nur für OpenAI bestimmte Request-Formung">
    OpenRouter läuft weiterhin über den Proxy-artigen OpenAI-kompatiblen Pfad, daher
    werden native nur für OpenAI bestimmte Request-Formungen wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-kompatible Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Referenzen bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält dort
    die Bereinigung von Gemini-Thought-Signaturen bei, aktiviert jedoch keine native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    diese als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
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
