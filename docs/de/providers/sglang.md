---
read_when:
    - Sie möchten OpenClaw gegen einen lokalen SGLang-Server ausführen
    - Sie möchten OpenAI-kompatible `/v1`-Endpoints mit Ihren eigenen Modellen
summary: OpenClaw mit SGLang ausführen (OpenAI-kompatibler selbstgehosteter Server)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T06:34:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang kann Open-Source-Modelle über eine **OpenAI-kompatible** HTTP-API bereitstellen.
OpenClaw kann sich über die API `openai-completions` mit SGLang verbinden.

OpenClaw kann verfügbare Modelle aus SGLang auch **automatisch erkennen**, wenn Sie
mit `SGLANG_API_KEY` Opt-in aktivieren (beliebiger Wert funktioniert, wenn Ihr Server keine Auth erzwingt)
und Sie keinen expliziten Eintrag `models.providers.sglang` definieren.

OpenClaw behandelt `sglang` als lokalen OpenAI-kompatiblen Provider, der
gestreamtes Usage-Accounting unterstützt, sodass Status-/Kontext-Token-Zählungen aus
Antworten von `stream_options.include_usage` aktualisiert werden können.

## Erste Schritte

<Steps>
  <Step title="SGLang starten">
    Starten Sie SGLang mit einem OpenAI-kompatiblen Server. Ihre Base-URL sollte
    `/v1`-Endpoints bereitstellen (zum Beispiel `/v1/models`, `/v1/chat/completions`). SGLang
    läuft üblicherweise unter:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API-Schlüssel setzen">
    Beliebiger Wert funktioniert, wenn auf Ihrem Server keine Auth konfiguriert ist:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding ausführen oder direkt ein Modell setzen">
    ```bash
    openclaw onboard
    ```

    Oder das Modell manuell konfigurieren:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Modell-Discovery (impliziter Provider)

Wenn `SGLANG_API_KEY` gesetzt ist (oder ein Auth-Profil existiert) und Sie **nicht**
`models.providers.sglang` definieren, fragt OpenClaw ab:

- `GET http://127.0.0.1:30000/v1/models`

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.sglang` explizit setzen, wird die automatische Discovery übersprungen und
Sie müssen Modelle manuell definieren.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie eine explizite Konfiguration, wenn:

- SGLang auf einem anderen Host/Port läuft.
- Sie Werte für `contextWindow`/`maxTokens` festlegen möchten.
- Ihr Server einen echten API-Schlüssel erfordert (oder Sie Header steuern möchten).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Lokales SGLang-Modell",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verhalten im Proxy-Stil">
    SGLang wird als OpenAI-kompatibles `/v1`-Backend im Proxy-Stil behandelt, nicht als
    nativer OpenAI-Endpoint.

    | Verhalten | SGLang |
    |----------|--------|
    | Nur für OpenAI geltendes Request-Shaping | Nicht angewendet |
    | `service_tier`, Responses `store`, Prompt-Cache-Hinweise | Nicht gesendet |
    | Reasoning-kompatibles Payload-Shaping | Nicht angewendet |
    | Versteckte Attributions-Header (`originator`, `version`, `User-Agent`) | Werden bei benutzerdefinierten SGLang-Base-URLs nicht injiziert |

  </Accordion>

  <Accordion title="Fehlerbehebung">
    **Server nicht erreichbar**

    Prüfen Sie, ob der Server läuft und antwortet:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Auth-Fehler**

    Wenn Anfragen mit Auth-Fehlern fehlschlagen, setzen Sie einen echten `SGLANG_API_KEY`, der zu
    Ihrer Serverkonfiguration passt, oder konfigurieren Sie den Provider explizit unter
    `models.providers.sglang`.

    <Tip>
    Wenn Sie SGLang ohne Authentifizierung ausführen, reicht ein beliebiger nicht leerer Wert für
    `SGLANG_API_KEY` aus, um Opt-in für die Modell-Discovery zu aktivieren.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einträgen.
  </Card>
</CardGroup>
