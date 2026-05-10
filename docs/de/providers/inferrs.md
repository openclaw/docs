---
read_when:
    - Sie möchten OpenClaw mit einem lokalen inferrs-Server ausführen
    - Sie stellen Gemma oder ein anderes Modell über inferrs bereit
    - Sie benötigen die exakten OpenClaw-Kompatibilitäts-Flags für inferrs
summary: OpenClaw über inferrs ausführen (OpenAI-kompatibler lokaler Server)
title: Leitet ab
x-i18n:
    generated_at: "2026-05-10T19:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) kann lokale Modelle hinter einer OpenAI-kompatiblen `/v1`-API bereitstellen. OpenClaw funktioniert mit `inferrs` über den generischen `openai-completions`-Pfad.

| Eigenschaft        | Wert                                                               |
| ------------------ | ------------------------------------------------------------------ |
| Provider-ID        | `inferrs` (benutzerdefiniert; unter `models.providers.inferrs` konfigurieren) |
| Plugin             | keines — `inferrs` ist kein gebündeltes OpenClaw-Provider-Plugin   |
| Auth-Umgebungsvariable | Optional. Jeder Wert funktioniert, wenn Ihr inferrs-Server keine Authentifizierung hat |
| API                | OpenAI-kompatibel (`openai-completions`)                           |
| Empfohlene Basis-URL | `http://127.0.0.1:8080/v1` (oder dort, wo Ihr inferrs-Server läuft) |

<Note>
  `inferrs` sollte derzeit am besten als benutzerdefiniertes, selbst gehostetes OpenAI-kompatibles Backend behandelt werden, nicht als dediziertes OpenClaw-Provider-Plugin. Sie konfigurieren es über `models.providers.inferrs` und nicht über ein Auswahl-Flag beim Onboarding. Wenn Sie ein echtes gebündeltes Plugin mit automatischer Erkennung benötigen, siehe [SGLang](/de/providers/sglang) oder [vLLM](/de/providers/vllm).
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
  <Step title="Prüfen, ob der Server erreichbar ist">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Einen OpenClaw-Provider-Eintrag hinzufügen">
    Fügen Sie einen expliziten Provider-Eintrag hinzu und richten Sie Ihr Standardmodell darauf aus. Siehe das vollständige Konfigurationsbeispiel unten.
  </Step>
</Steps>

## Vollständiges Konfigurationsbeispiel

Dieses Beispiel verwendet Gemma 4 auf einem lokalen `inferrs`-Server.

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

Inferrs kann auch von OpenClaw nur dann gestartet werden, wenn ein `inferrs/...`-Modell
ausgewählt ist. Fügen Sie `localService` demselben Provider-Eintrag hinzu:

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

`command` muss absolut sein. Verwenden Sie `which inferrs` auf dem Gateway-Host und tragen Sie diesen
Pfad in die Konfiguration ein. Die vollständige Feldreferenz finden Sie unter
[Lokale Modelldienste](/de/gateway/local-model-services).

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Warum requiresStringContent wichtig ist">
    Einige `inferrs`-Chat-Completions-Routen akzeptieren nur stringbasierte
    `messages[].content`, keine strukturierten Content-Part-Arrays.

    <Warning>
    Wenn OpenClaw-Läufe mit einem Fehler wie diesem fehlschlagen:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    setzen Sie `compat.requiresStringContent: true` in Ihrem Modelleintrag.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw fasst reine Text-Content-Parts vor dem Senden der Anfrage zu einfachen Zeichenketten zusammen.

  </Accordion>

  <Accordion title="Hinweis zu Gemma und Tool-Schema">
    Einige aktuelle Kombinationen aus `inferrs` und Gemma akzeptieren kleine direkte
    `/v1/chat/completions`-Anfragen, schlagen aber weiterhin bei vollständigen OpenClaw-Agent-Runtime-
    Turns fehl.

    Wenn das geschieht, versuchen Sie zuerst Folgendes:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Dadurch wird die Tool-Schema-Oberfläche von OpenClaw für das Modell deaktiviert und die Prompt-
    Belastung für strengere lokale Backends kann reduziert werden.

    Wenn sehr kleine direkte Anfragen weiterhin funktionieren, normale OpenClaw-Agent-Turns jedoch
    innerhalb von `inferrs` abstürzen, liegt das verbleibende Problem in der Regel am Upstream-Modell-
    oder Serververhalten und nicht an der Transportschicht von OpenClaw.

  </Accordion>

  <Accordion title="Manueller Smoke-Test">
    Testen Sie nach der Konfiguration beide Ebenen:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Wenn der erste Befehl funktioniert, der zweite jedoch fehlschlägt, prüfen Sie den Abschnitt zur Fehlerbehebung unten.

  </Accordion>

  <Accordion title="Proxy-artiges Verhalten">
    `inferrs` wird als Proxy-artiges OpenAI-kompatibles `/v1`-Backend behandelt, nicht als
    nativer OpenAI-Endpunkt.

    - Native, nur für OpenAI geltende Anfrageformung wird hier nicht angewendet
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-Kompatibilitäts-Payload-Formung
    - Verborgene OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
      werden bei benutzerdefinierten `inferrs`-Basis-URLs nicht eingefügt

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="curl /v1/models schlägt fehl">
    `inferrs` läuft nicht, ist nicht erreichbar oder ist nicht an den erwarteten
    Host/Port gebunden. Stellen Sie sicher, dass der Server gestartet ist und auf der von Ihnen
    konfigurierten Adresse lauscht.
  </Accordion>

  <Accordion title="messages[].content erwartet eine Zeichenkette">
    Setzen Sie `compat.requiresStringContent: true` im Modelleintrag. Details finden Sie im
    Abschnitt zu `requiresStringContent` oben.
  </Accordion>

  <Accordion title="Direkte /v1/chat/completions-Aufrufe funktionieren, aber openclaw infer model run schlägt fehl">
    Versuchen Sie, `compat.supportsTools: false` zu setzen, um die Tool-Schema-Oberfläche zu deaktivieren.
    Siehe den Hinweis zum Gemma-Tool-Schema oben.
  </Accordion>

  <Accordion title="inferrs stürzt bei größeren Agent-Turns weiterhin ab">
    Wenn OpenClaw keine Schemafehler mehr erhält, `inferrs` bei größeren
    Agent-Turns aber weiterhin abstürzt, behandeln Sie dies als Upstream-`inferrs`- oder Modellbeschränkung. Reduzieren Sie
    die Prompt-Belastung oder wechseln Sie zu einem anderen lokalen Backend oder Modell.
  </Accordion>
</AccordionGroup>

<Tip>
Allgemeine Hilfe finden Sie unter [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
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
    Debugging lokaler OpenAI-kompatibler Backends, die Probes bestehen, aber bei Agent-Läufen fehlschlagen.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
