---
read_when:
    - Sie möchten OpenClaw mit einem lokalen Inferrs-Server verwenden
    - Sie stellen Gemma oder ein anderes Modell über Inferrs bereit
    - Sie benötigen die genauen OpenClaw-Kompatibilitäts-Flags für Inferrs
summary: OpenClaw über inferrs ausführen (OpenAI-kompatibler lokaler Server)
title: Inferrs
x-i18n:
    generated_at: "2026-07-24T04:37:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) stellt lokale Modelle hinter einer OpenAI-kompatiblen `/v1`-API bereit. OpenClaw kommuniziert damit über den generischen `openai-completions`-Adapter.

| Eigenschaft            | Wert                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| Provider-ID            | `inferrs` (benutzerdefiniert; unter `models.providers.inferrs` konfigurieren) |
| Plugin                 | keines — kein gebündeltes OpenClaw-Provider-Plugin                            |
| Authentifizierungs-Umgebungsvariable | nicht erforderlich; jeder Wert funktioniert, wenn Ihr inferrs-Server keine Authentifizierung verwendet |
| API                    | OpenAI-kompatibel (`openai-completions`)                                        |
| Empfohlene Basis-URL   | `http://127.0.0.1:8080/v1` (oder die Adresse, an der Ihr inferrs-Server lauscht)       |

<Note>
  `inferrs` ist ein benutzerdefiniertes, selbst gehostetes OpenAI-kompatibles Backend und kein dediziertes OpenClaw-Provider-Plugin: Sie konfigurieren es unter `models.providers.inferrs`, statt bei der Ersteinrichtung eine Authentifizierungsoption auszuwählen. Informationen zu einem gebündelten Plugin mit automatischer Erkennung finden Sie unter [SGLang](/de/providers/sglang) oder [vLLM](/de/providers/vllm).
</Note>

## Erste Schritte

<Steps>
  <Step title="inferrs mit einem Modell starten">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Erreichbarkeit des Servers überprüfen">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Einen OpenClaw-Provider-Eintrag hinzufügen">
    Fügen Sie einen expliziten Provider-Eintrag hinzu und verweisen Sie mit Ihrem Standardmodell darauf. Siehe das nachfolgende Konfigurationsbeispiel.
  </Step>
</Steps>

## Vollständiges Konfigurationsbeispiel

Gemma 4 auf einem lokalen `inferrs`-Server:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Start bei Bedarf

OpenClaw kann `inferrs` nur dann selbst starten, wenn ein `inferrs/...`-Modell ausgewählt ist. Fügen Sie `localService` demselben Provider-Eintrag hinzu:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` muss ein absoluter Pfad sein. Führen Sie `which inferrs` auf dem Gateway-Host aus und verwenden Sie diesen Pfad. Vollständige Feldreferenz: [Lokale Modelldienste](/de/gateway/local-model-services).

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Warum requiresStringContent wichtig ist">
    Einige `inferrs`-Chat-Completions-Routen akzeptieren für `messages[].content` nur Zeichenfolgen und keine strukturierten Arrays aus Inhaltsbestandteilen.

    <Warning>
    Wenn OpenClaw-Ausführungen mit folgender Meldung fehlschlagen:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    legen Sie im Modelleintrag `compat.requiresStringContent: true` fest. OpenClaw reduziert dann vor dem Senden der Anfrage reine Textinhaltsbestandteile auf einfache Zeichenfolgen.
    </Warning>

  </Accordion>

  <Accordion title="Hinweis zu Gemma und Werkzeugschemas">
    Einige Kombinationen aus `inferrs` und Gemma akzeptieren kleine direkte `/v1/chat/completions`-Anfragen, schlagen jedoch bei vollständigen OpenClaw-Agent-Runtime-Durchläufen fehl. Versuchen Sie zunächst, die Werkzeugschema-Oberfläche zu deaktivieren:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Dies reduziert die Prompt-Belastung für restriktivere lokale Backends. Wenn kleine direkte Anfragen weiterhin funktionieren, normale OpenClaw-Agent-Durchläufe innerhalb von `inferrs` jedoch weiterhin abstürzen, behandeln Sie dies als Einschränkung des zugrunde liegenden Modells oder Servers und nicht als OpenClaw-Transportproblem.

  </Accordion>

  <Accordion title="Manueller Funktionstest">
    Testen Sie nach der Konfiguration beide Ebenen:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"Was ist 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "Was ist 2 + 2? Antworten Sie mit einem kurzen Satz." \
      --json
    ```

    Wenn der erste Befehl funktioniert, der zweite jedoch fehlschlägt, lesen Sie den nachfolgenden Abschnitt zur Fehlerbehebung.

  </Accordion>

  <Accordion title="Proxy-artiges Verhalten">
    Da `inferrs` den generischen `openai-completions`-Adapter (und nicht `openai-responses`) verwendet, wird keine ausschließlich für natives OpenAI vorgesehene Anfrageformatierung angewendet: Es werden weder `service_tier` noch Responses-`store`, Prompt-Cache-Hinweise oder OpenAI-Kompatibilitätsnutzdaten für logisches Schlussfolgern gesendet.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="curl /v1/models schlägt fehl">
    `inferrs` wird nicht ausgeführt, ist nicht erreichbar oder nicht an den konfigurierten Host beziehungsweise Port gebunden. Vergewissern Sie sich, dass der Server gestartet wurde und unter dieser Adresse lauscht.
  </Accordion>

  <Accordion title="messages[].content erwartet eine Zeichenfolge">
    Legen Sie im Modelleintrag `compat.requiresStringContent: true` fest (siehe oben).
  </Accordion>

  <Accordion title="Direkte /v1/chat/completions-Aufrufe funktionieren, aber openclaw infer model run schlägt fehl">
    Legen Sie `compat.supportsTools: false` fest, um die Werkzeugschema-Oberfläche zu deaktivieren (siehe den obigen Hinweis zu Gemma).
  </Accordion>

  <Accordion title="inferrs stürzt bei größeren Agent-Durchläufen weiterhin ab">
    Wenn keine Schemafehler mehr auftreten, `inferrs` bei größeren Agent-Durchläufen jedoch weiterhin abstürzt, behandeln Sie dies als Einschränkung von `inferrs` oder des Modells. Reduzieren Sie die Prompt-Belastung oder wechseln Sie das Backend beziehungsweise Modell.
  </Accordion>
</AccordionGroup>

<Tip>
Allgemeine Hilfe finden Sie unter [Fehlerbehebung](/de/help/troubleshooting) und [Häufig gestellte Fragen](/de/help/faq).
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Lokale Modelle" href="/de/gateway/local-models" icon="server">
    OpenClaw mit lokalen Modellservern ausführen.
  </Card>
  <Card title="Lokale Modelldienste" href="/de/gateway/local-model-services" icon="play">
    Lokale Modellserver bei Bedarf für konfigurierte Provider starten.
  </Card>
  <Card title="Gateway-Fehlerbehebung" href="/de/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Lokale OpenAI-kompatible Backends diagnostizieren, die direkte Tests bestehen, bei Agent-Durchläufen jedoch fehlschlagen.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Übersicht über alle Provider, Modellreferenzen und das Failover-Verhalten.
  </Card>
</CardGroup>
