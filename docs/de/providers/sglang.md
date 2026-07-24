---
read_when:
    - Sie möchten OpenClaw mit einem lokalen SGLang-Server verwenden
    - Sie möchten OpenAI-kompatible /v1-Endpunkte mit Ihren eigenen Modellen.
summary: OpenClaw mit SGLang ausführen (OpenAI-kompatibler selbst gehosteter Server)
title: SGLang
x-i18n:
    generated_at: "2026-07-24T04:05:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang stellt Open-Weight-Modelle über eine OpenAI-kompatible HTTP-API bereit. OpenClaw verbindet sich mithilfe der Provider-Familie `openai-completions` mit SGLang und erkennt verfügbare Modelle automatisch.

| Eigenschaft               | Wert                                                         |
| ------------------------- | ------------------------------------------------------------ |
| Provider-ID               | `sglang`                                                     |
| Plugin                    | gebündelt, `enabledByDefault: true`                            |
| Umgebungsvariable für Authentifizierung | `SGLANG_API_KEY` (beliebiger nicht leerer Wert, wenn der Server keine Authentifizierung verwendet) |
| Onboarding-Flag           | `--auth-choice sglang`                                       |
| API                       | OpenAI-kompatibel (`openai-completions`)                     |
| Standard-Basis-URL        | `http://127.0.0.1:30000/v1`                                  |
| Platzhalter für das Standardmodell | `sglang/Qwen/Qwen3-8B`                                       |
| Streaming-Nutzung        | Ja (`supportsStreamingUsage: true`)                         |
| Preisgestaltung           | Als extern-kostenlos gekennzeichnet (`modelPricing.external: false`)        |

OpenClaw **erkennt** verfügbare Modelle von SGLang außerdem **automatisch**, wenn Sie dies mit `SGLANG_API_KEY` aktivieren. Verwenden Sie `sglang/*` in `agents.defaults.models`, damit die Erkennung dynamisch bleibt, wenn Sie zusätzlich eine benutzerdefinierte SGLang-Basis-URL konfigurieren. Weitere Informationen finden Sie unten unter [Modellerkennung (impliziter Provider)](#model-discovery-implicit-provider).

## Erste Schritte

<Steps>
  <Step title="SGLang starten">
    Starten Sie SGLang mit einem OpenAI-kompatiblen Server. Ihre Basis-URL sollte
    `/v1`-Endpunkte bereitstellen (zum Beispiel `/v1/models`, `/v1/chat/completions`). SGLang
    wird üblicherweise ausgeführt unter:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API-Schlüssel festlegen">
    Wenn auf Ihrem Server keine Authentifizierung konfiguriert ist, funktioniert jeder beliebige Wert:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding ausführen oder ein Modell direkt festlegen">
    ```bash
    openclaw onboard
    ```

    Alternativ können Sie das Modell manuell konfigurieren:

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

Wenn `SGLANG_API_KEY` festgelegt ist (oder ein Authentifizierungsprofil vorhanden ist) und Sie
`models.providers.sglang` **nicht** definieren, fragt OpenClaw Folgendes ab:

- `GET http://127.0.0.1:30000/v1/models`

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.sglang` ausdrücklich festlegen, verwendet OpenClaw standardmäßig die von Ihnen deklarierten
Modelle. Fügen Sie `"sglang/*": {}` zu `agents.defaults.models` hinzu, wenn
OpenClaw den `/models`-Endpunkt dieses konfigurierten Providers abfragen und
alle angekündigten SGLang-Modelle einbeziehen soll.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie eine explizite Konfiguration, wenn:

- SGLang auf einem anderen Host oder Port ausgeführt wird.
- Sie Werte für `contextWindow`/`maxTokens` fest vorgeben möchten.
- Ihr Server einen echten API-Schlüssel erfordert (oder Sie die Header steuern möchten).

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
  <Accordion title="Proxy-ähnliches Verhalten">
    SGLang wird als Proxy-ähnliches OpenAI-kompatibles `/v1`-Backend behandelt, nicht als
    nativer OpenAI-Endpunkt.

    | Verhalten | SGLang |
    |----------|--------|
    | Ausschließlich für OpenAI vorgesehene Anfrageformung | Nicht angewendet |
    | `service_tier`, Responses `store`, Hinweise zum Prompt-Cache | Nicht gesendet |
    | Reasoning-Kompatibilitätsformung der Nutzlast | Nicht angewendet |
    | Verborgene Zuordnungs-Header (`originator`, `version`, `User-Agent`) | Werden bei benutzerdefinierten SGLang-Basis-URLs nicht eingefügt |

  </Accordion>

  <Accordion title="Fehlerbehebung">
    **Server nicht erreichbar**

    Überprüfen Sie, ob der Server ausgeführt wird und antwortet:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Authentifizierungsfehler**

    Wenn Anfragen aufgrund von Authentifizierungsfehlern fehlschlagen, legen Sie einen echten `SGLANG_API_KEY` fest, der Ihrer
    Serverkonfiguration entspricht, oder konfigurieren Sie den Provider ausdrücklich unter
    `models.providers.sglang`.

    <Tip>
    Wenn Sie SGLang ohne Authentifizierung ausführen, genügt ein beliebiger nicht leerer Wert für
    `SGLANG_API_KEY`, um die Modellerkennung zu aktivieren.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einträgen.
  </Card>
</CardGroup>
