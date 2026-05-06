---
read_when:
    - Sie möchten OpenClaw mit einem lokalen inferrs-Server ausführen
    - Sie stellen Gemma oder ein anderes Modell über inferrs bereit
    - Sie benötigen die exakten OpenClaw-Kompatibilitäts-Flags für inferrs
summary: OpenClaw über inferrs ausführen (OpenAI-kompatibler lokaler Server)
title: Leitet ab
x-i18n:
    generated_at: "2026-05-06T07:01:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) kann lokale Modelle hinter einer OpenAI-kompatiblen `/v1`-API bereitstellen. OpenClaw funktioniert mit `inferrs` über den generischen `openai-completions`-Pfad.

| Eigenschaft             | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| Provider-ID             | `inferrs` (benutzerdefiniert; unter `models.providers.inferrs` konfigurieren) |
| Plugin                  | keines — `inferrs` ist kein gebündeltes OpenClaw-Provider-Plugin     |
| Auth-Umgebungsvariable  | Optional. Jeder Wert funktioniert, wenn Ihr inferrs-Server keine Authentifizierung verwendet |
| API                     | OpenAI-kompatibel (`openai-completions`)                             |
| Vorgeschlagene Basis-URL | `http://127.0.0.1:8080/v1` (oder dort, wo Ihr inferrs-Server läuft) |

<Note>
  `inferrs` sollte derzeit am besten als benutzerdefiniertes selbst gehostetes OpenAI-kompatibles Backend behandelt werden, nicht als dediziertes OpenClaw-Provider-Plugin. Sie konfigurieren es über `models.providers.inferrs` statt über ein Onboarding-Auswahl-Flag. Wenn Sie ein echtes gebündeltes Plugin mit automatischer Erkennung benötigen, siehe [SGLang](/de/providers/sglang) oder [vLLM](/de/providers/vllm).
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
    Fügen Sie einen expliziten Provider-Eintrag hinzu und verweisen Sie mit Ihrem Standardmodell darauf. Siehe das vollständige Konfigurationsbeispiel unten.
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

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Warum requiresStringContent wichtig ist">
    Einige `inferrs`-Chat-Completions-Routen akzeptieren nur string
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

    OpenClaw reduziert reine Text-Content-Parts auf einfache Strings, bevor die
    Anfrage gesendet wird.

  </Accordion>

  <Accordion title="Hinweis zu Gemma und Tool-Schema">
    Einige aktuelle Kombinationen aus `inferrs` und Gemma akzeptieren kleine direkte
    `/v1/chat/completions`-Anfragen, schlagen aber bei vollständigen OpenClaw-Agent-Runtime-
    Durchläufen weiterhin fehl.

    Wenn das passiert, versuchen Sie zuerst Folgendes:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Dadurch wird die Tool-Schema-Oberfläche von OpenClaw für das Modell deaktiviert und kann den Prompt-
    Druck auf strengere lokale Backends verringern.

    Wenn sehr kleine direkte Anfragen weiterhin funktionieren, normale OpenClaw-Agent-Durchläufe aber
    weiterhin innerhalb von `inferrs` abstürzen, liegt das verbleibende Problem meist am Verhalten des
    Upstream-Modells oder -Servers und nicht an der Transportschicht von OpenClaw.

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

    Wenn der erste Befehl funktioniert, der zweite aber fehlschlägt, prüfen Sie den Abschnitt zur Fehlerbehebung unten.

  </Accordion>

  <Accordion title="Proxy-ähnliches Verhalten">
    `inferrs` wird als Proxy-ähnliches OpenAI-kompatibles `/v1`-Backend behandelt, nicht als
    nativer OpenAI-Endpunkt.

    - Nur für natives OpenAI geltende Anfrageformung gilt hier nicht
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-Kompatibilitäts-Payload-Formung
    - Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
      werden bei benutzerdefinierten `inferrs`-Basis-URLs nicht injiziert

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="curl /v1/models schlägt fehl">
    `inferrs` läuft nicht, ist nicht erreichbar oder ist nicht an den erwarteten
    Host/Port gebunden. Stellen Sie sicher, dass der Server gestartet ist und auf der von Ihnen
    konfigurierten Adresse lauscht.
  </Accordion>

  <Accordion title="messages[].content erwartet einen string">
    Setzen Sie `compat.requiresStringContent: true` im Modelleintrag. Weitere Details finden Sie
    oben im Abschnitt `requiresStringContent`.
  </Accordion>

  <Accordion title="Direkte /v1/chat/completions-Aufrufe funktionieren, aber openclaw infer model run schlägt fehl">
    Versuchen Sie, `compat.supportsTools: false` zu setzen, um die Tool-Schema-Oberfläche zu deaktivieren.
    Siehe den Hinweis zum Gemma-Tool-Schema oben.
  </Accordion>

  <Accordion title="inferrs stürzt bei größeren Agent-Durchläufen weiterhin ab">
    Wenn OpenClaw keine Schemafehler mehr erhält, `inferrs` aber bei größeren
    Agent-Durchläufen weiterhin abstürzt, behandeln Sie dies als Upstream-`inferrs`- oder Modellbeschränkung. Verringern Sie
    den Prompt-Druck oder wechseln Sie zu einem anderen lokalen Backend oder Modell.
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
  <Card title="Gateway-Fehlerbehebung" href="/de/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Fehlerbehebung für lokale OpenAI-kompatible Backends, die Probes bestehen, aber bei Agent-Läufen fehlschlagen.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
