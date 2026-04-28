---
read_when:
    - Sie möchten OpenClaw gegen einen lokalen SGLang-Server ausführen.
    - Sie möchten OpenAI-kompatible `/v1`-Endpunkte mit Ihren eigenen Modellen.
summary: OpenClaw mit SGLang ausführen (OpenAI-kompatibler selbstgehosteter Server)
title: SGLang
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang kann Open-Source-Modelle über eine **OpenAI-kompatible** HTTP-API bereitstellen.
OpenClaw kann sich über die API `openai-completions` mit SGLang verbinden.

OpenClaw kann verfügbare Modelle von SGLang auch **automatisch erkennen**, wenn Sie
mit `SGLANG_API_KEY` aktiv opt-in setzen (jeder beliebige Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt) und Sie keinen expliziten Eintrag `models.providers.sglang` definieren.

OpenClaw behandelt `sglang` als lokalen OpenAI-kompatiblen Provider, der
Accounting für gestreamte Nutzung unterstützt, sodass Token-Zählungen für Status/Kontext über Antworten von `stream_options.include_usage` aktualisiert werden können.

## Erste Schritte

<Steps>
  <Step title="SGLang starten">
    Starten Sie SGLang mit einem OpenAI-kompatiblen Server. Ihre Base URL sollte
    Endpunkte unter `/v1` bereitstellen (zum Beispiel `/v1/models`, `/v1/chat/completions`). SGLang läuft häufig auf:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Einen API-Key setzen">
    Jeder beliebige Wert funktioniert, wenn auf Ihrem Server keine Authentifizierung konfiguriert ist:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding ausführen oder ein Modell direkt setzen">
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

## Modellerkennung (impliziter Provider)

Wenn `SGLANG_API_KEY` gesetzt ist (oder ein Auth-Profil existiert) und Sie **nicht**
`models.providers.sglang` definieren, fragt OpenClaw Folgendes ab:

- `GET http://127.0.0.1:30000/v1/models`

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.sglang` explizit setzen, wird die automatische Erkennung übersprungen und
Sie müssen Modelle manuell definieren.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie explizite Konfiguration, wenn:

- SGLang auf einem anderen Host/Port läuft.
- Sie Werte für `contextWindow`/`maxTokens` festlegen möchten.
- Ihr Server einen echten API-Key erfordert (oder Sie Header steuern möchten).

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
            name: "Local SGLang Model",
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
    nativer OpenAI-Endpunkt.

    | Verhalten | SGLang |
    |----------|--------|
    | Nur für OpenAI geltendes Request-Shaping | Nicht angewendet |
    | `service_tier`, Responses `store`, Prompt-Cache-Hinweise | Nicht gesendet |
    | Reasoning-kompatibles Payload-Shaping | Nicht angewendet |
    | Versteckte Attribution-Header (`originator`, `version`, `User-Agent`) | Bei benutzerdefinierten SGLang-Base-URLs nicht injiziert |

  </Accordion>

  <Accordion title="Fehlerbehebung">
    **Server nicht erreichbar**

    Prüfen Sie, ob der Server läuft und antwortet:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Authentifizierungsfehler**

    Wenn Anfragen mit Authentifizierungsfehlern fehlschlagen, setzen Sie einen echten `SGLANG_API_KEY`, der
    zur Konfiguration Ihres Servers passt, oder konfigurieren Sie den Provider explizit unter
    `models.providers.sglang`.

    <Tip>
    Wenn Sie SGLang ohne Authentifizierung ausführen, reicht ein beliebiger nicht leerer Wert für
    `SGLANG_API_KEY` aus, um sich für die Modellerkennung anzumelden.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Providereinträgen.
  </Card>
</CardGroup>
