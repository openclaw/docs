---
read_when:
    - Sie möchten OpenClaw mit einem lokalen SGLang-Server ausführen
    - Sie möchten OpenAI-kompatible /v1-Endpunkte mit Ihren eigenen Modellen
summary: OpenClaw mit SGLang ausführen (OpenAI-kompatibler, selbst gehosteter Server)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SGLang stellt Open-Weight-Modelle über eine OpenAI-kompatible HTTP-API bereit. OpenClaw verbindet sich mit SGLang über die Provider-Familie `openai-completions` mit automatischer Erkennung verfügbarer Modelle.

| Eigenschaft               | Wert                                                         |
| ------------------------- | ------------------------------------------------------------ |
| Provider-ID               | `sglang`                                                     |
| Plugin                    | gebündelt, `enabledByDefault: true`                          |
| Auth-Umgebungsvariable    | `SGLANG_API_KEY` (beliebiger nicht leerer Wert, wenn der Server keine Authentifizierung hat) |
| Onboarding-Flag           | `--auth-choice sglang`                                       |
| API                       | OpenAI-kompatibel (`openai-completions`)                     |
| Standard-Basis-URL        | `http://127.0.0.1:30000/v1`                                  |
| Standardmodell-Platzhalter | `sglang/Qwen/Qwen3-8B`                                      |
| Streaming-Nutzung         | Ja (`supportsStreamingUsage: true`)                          |
| Preisgestaltung           | Als extern kostenlos markiert (`modelPricing.external: false`) |

OpenClaw **erkennt** verfügbare Modelle von SGLang außerdem automatisch, wenn Sie sich mit `SGLANG_API_KEY` dafür entscheiden. Verwenden Sie `sglang/*` in `agents.defaults.models`, um die Erkennung dynamisch zu halten, wenn Sie auch eine benutzerdefinierte SGLang-Basis-URL konfigurieren. Siehe [Modellerkennung (impliziter Provider)](#model-discovery-implicit-provider) unten.

## Erste Schritte

<Steps>
  <Step title="SGLang starten">
    Starten Sie SGLang mit einem OpenAI-kompatiblen Server. Ihre Basis-URL sollte
    `/v1`-Endpunkte bereitstellen (zum Beispiel `/v1/models`, `/v1/chat/completions`). SGLang
    läuft häufig auf:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API-Schlüssel setzen">
    Jeder Wert funktioniert, wenn auf Ihrem Server keine Authentifizierung konfiguriert ist:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding ausführen oder ein Modell direkt festlegen">
    ```bash
    openclaw onboard
    ```

    Oder konfigurieren Sie das Modell manuell:

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

Wenn `SGLANG_API_KEY` gesetzt ist (oder ein Auth-Profil vorhanden ist) und Sie
`models.providers.sglang` **nicht** definieren, fragt OpenClaw Folgendes ab:

- `GET http://127.0.0.1:30000/v1/models`

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.sglang` explizit festlegen, verwendet OpenClaw standardmäßig Ihre deklarierten
Modelle. Fügen Sie `"sglang/*": {}` zu `agents.defaults.models` hinzu, wenn Sie
möchten, dass OpenClaw den `/models`-Endpunkt dieses konfigurierten Providers abfragt und
alle angekündigten SGLang-Modelle einschließt.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie eine explizite Konfiguration, wenn:

- SGLang auf einem anderen Host/Port läuft.
- Sie `contextWindow`-/`maxTokens`-Werte fest anheften möchten.
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
  <Accordion title="Proxy-artiges Verhalten">
    SGLang wird als proxy-artiges OpenAI-kompatibles `/v1`-Backend behandelt, nicht als
    nativer OpenAI-Endpunkt.

    | Verhalten | SGLang |
    |----------|--------|
    | Nur-OpenAI-Anfrageformung | Nicht angewendet |
    | `service_tier`, Responses `store`, Prompt-Cache-Hinweise | Nicht gesendet |
    | Reasoning-kompatible Payload-Formung | Nicht angewendet |
    | Versteckte Attributions-Header (`originator`, `version`, `User-Agent`) | Bei benutzerdefinierten SGLang-Basis-URLs nicht eingefügt |

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
    Wenn Sie SGLang ohne Authentifizierung ausführen, reicht jeder nicht leere Wert für
    `SGLANG_API_KEY` aus, um die Modellerkennung zu aktivieren.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einträgen.
  </Card>
</CardGroup>
