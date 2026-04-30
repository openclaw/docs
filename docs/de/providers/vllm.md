---
read_when:
    - Sie möchten OpenClaw mit einem lokalen vLLM-Server ausführen
    - Sie möchten OpenAI-kompatible /v1-Endpunkte mit Ihren eigenen Modellen
summary: OpenClaw mit vLLM ausführen (OpenAI-kompatibler lokaler Server)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T07:12:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM kann Open-Source-Modelle (und einige benutzerdefinierte Modelle) über eine **OpenAI-kompatible** HTTP-API bereitstellen. OpenClaw verbindet sich mit vLLM über die `openai-completions`-API.

OpenClaw kann verfügbare Modelle auch **automatisch erkennen**, wenn Sie dies mit `VLLM_API_KEY` aktivieren (ein beliebiger Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt) und keinen expliziten Eintrag `models.providers.vllm` definieren.

OpenClaw behandelt `vllm` als lokalen OpenAI-kompatiblen Provider, der
gestreamte Nutzungsabrechnung unterstützt, sodass Status-/Kontext-Tokenzahlen aus
`stream_options.include_usage`-Antworten aktualisiert werden können.

| Eigenschaft       | Wert                                     |
| ----------------- | ---------------------------------------- |
| Provider-ID       | `vllm`                                   |
| API               | `openai-completions` (OpenAI-kompatibel) |
| Authentifizierung | Umgebungsvariable `VLLM_API_KEY`         |
| Standard-Basis-URL | `http://127.0.0.1:8000/v1`              |

## Erste Schritte

<Steps>
  <Step title="vLLM mit einem OpenAI-kompatiblen Server starten">
    Ihre Basis-URL sollte `/v1`-Endpunkte bereitstellen (z. B. `/v1/models`, `/v1/chat/completions`). vLLM läuft häufig unter:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API-Schlüssel-Umgebungsvariable setzen">
    Ein beliebiger Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Ein Modell auswählen">
    Ersetzen Sie dies durch eine Ihrer vLLM-Modell-IDs:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Modellerkennung (impliziter Provider)

Wenn `VLLM_API_KEY` gesetzt ist (oder ein Authentifizierungsprofil existiert) und Sie `models.providers.vllm` **nicht** definieren, fragt OpenClaw Folgendes ab:

```
GET http://127.0.0.1:8000/v1/models
```

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.vllm` explizit setzen, wird die automatische Erkennung übersprungen und Sie müssen Modelle manuell definieren.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie eine explizite Konfiguration, wenn:

- vLLM auf einem anderen Host oder Port läuft
- Sie `contextWindow`- oder `maxTokens`-Werte festlegen möchten
- Ihr Server einen echten API-Schlüssel erfordert (oder Sie Header steuern möchten)
- Sie eine Verbindung zu einem vertrauenswürdigen loopback-, LAN- oder Tailscale-vLLM-Endpunkt herstellen

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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
    vLLM wird als Proxy-artiges OpenAI-kompatibles `/v1`-Backend behandelt, nicht als nativer
    OpenAI-Endpunkt. Das bedeutet:

    | Verhalten | Angewendet? |
    |----------|----------|
    | Native OpenAI-Anfrageformung | Nein |
    | `service_tier` | Nicht gesendet |
    | Responses `store` | Nicht gesendet |
    | Prompt-Cache-Hinweise | Nicht gesendet |
    | OpenAI-Reasoning-Kompatibilitäts-Payload-Formung | Nicht angewendet |
    | Versteckte OpenClaw-Attributions-Header | Bei benutzerdefinierten Basis-URLs nicht eingefügt |

  </Accordion>

  <Accordion title="Qwen-Thinking-Steuerungen">
    Für über vLLM bereitgestellte Qwen-Modelle setzen Sie
    `params.qwenThinkingFormat: "chat-template"` im Modelleintrag, wenn der
    Server Qwen-Chat-Template-Kwargs erwartet. OpenClaw ordnet `/think off` Folgendem zu:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Nicht-`off`-Thinking-Stufen senden `enable_thinking: true`. Wenn Ihr Endpunkt
    stattdessen DashScope-artige Top-Level-Flags erwartet, verwenden Sie
    `params.qwenThinkingFormat: "top-level"`, um `enable_thinking` im
    Anfrage-Root zu senden. Snake-Case `params.qwen_thinking_format` wird ebenfalls akzeptiert.

  </Accordion>

  <Accordion title="Nemotron-3-Thinking-Steuerungen">
    vLLM/Nemotron 3 kann Chat-Template-Kwargs verwenden, um zu steuern, ob Reasoning
    als verstecktes Reasoning oder sichtbarer Antworttext zurückgegeben wird. Wenn eine OpenClaw-Sitzung
    `vllm/nemotron-3-*` mit deaktiviertem Thinking verwendet, sendet das gebündelte vLLM-Plugin:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Um diese Werte anzupassen, setzen Sie `chat_template_kwargs` unter den Modellparametern.
    Wenn Sie zusätzlich `params.extra_body.chat_template_kwargs` setzen, hat dieser Wert
    endgültigen Vorrang, weil `extra_body` die letzte Überschreibung des Anfragebodys ist.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen-Tool-Aufrufe erscheinen als Text">
    Stellen Sie zuerst sicher, dass vLLM mit dem richtigen Tool-Call-Parser und Chat-
    Template für das Modell gestartet wurde. Beispielsweise dokumentiert vLLM `hermes` für Qwen2.5-
    Modelle und `qwen3_xml` für Qwen3-Coder-Modelle.

    Symptome:

    - Skills oder Tools werden nie ausgeführt
    - der Assistent gibt rohes JSON/XML wie `{"name":"read","arguments":...}` aus
    - vLLM gibt ein leeres `tool_calls`-Array zurück, wenn OpenClaw
      `tool_choice: "auto"` sendet

    Einige Qwen/vLLM-Kombinationen geben strukturierte Tool-Aufrufe nur zurück, wenn die
    Anfrage `tool_choice: "required"` verwendet. Erzwingen Sie für diese Modelleinträge das
    OpenAI-kompatible Anfragefeld mit `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Ersetzen Sie `Qwen-Qwen2.5-Coder-32B-Instruct` durch die genaue ID, die zurückgegeben wird von:

    ```bash
    openclaw models list --provider vllm
    ```

    Sie können dieselbe Überschreibung über die CLI anwenden:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Dies ist ein Opt-in-Kompatibilitäts-Workaround. Er bewirkt, dass jede Modellrunde mit
    Tools einen Tool-Aufruf erfordert. Verwenden Sie ihn daher nur für einen dedizierten lokalen Modelleintrag,
    bei dem dieses Verhalten akzeptabel ist. Verwenden Sie ihn nicht als globalen Standard für alle
    vLLM-Modelle und verwenden Sie keinen Proxy, der beliebigen
    Assistententext blind in ausführbare Tool-Aufrufe umwandelt.

  </Accordion>

  <Accordion title="Benutzerdefinierte Basis-URL">
    Wenn Ihr vLLM-Server auf einem nicht standardmäßigen Host oder Port läuft, setzen Sie `baseUrl` in der expliziten Provider-Konfiguration:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Langsame erste Antwort oder Timeout des Remote-Servers">
    Für große lokale Modelle, Remote-LAN-Hosts oder Tailnet-Verbindungen setzen Sie ein
    Provider-bezogenes Anfrage-Timeout:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` gilt nur für HTTP-Anfragen an vLLM-Modelle, einschließlich
    Verbindungsaufbau, Antwort-Headern, Body-Streaming und dem gesamten
    abgesicherten Fetch-Abbruch. Ziehen Sie dies dem Erhöhen von
    `agents.defaults.timeoutSeconds` vor, das den gesamten Agentenlauf steuert.

  </Accordion>

  <Accordion title="Server nicht erreichbar">
    Prüfen Sie, ob der vLLM-Server läuft und erreichbar ist:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Wenn Sie einen Verbindungsfehler sehen, prüfen Sie den Host, den Port und ob vLLM im OpenAI-kompatiblen Servermodus gestartet wurde.
    Für explizite loopback-, LAN- oder Tailscale-Endpunkte setzen Sie außerdem
    `models.providers.vllm.request.allowPrivateNetwork: true`; Provider-
    Anfragen blockieren private Netzwerk-URLs standardmäßig, sofern der Provider nicht
    explizit als vertrauenswürdig eingestuft ist.

  </Accordion>

  <Accordion title="Authentifizierungsfehler bei Anfragen">
    Wenn Anfragen mit Authentifizierungsfehlern fehlschlagen, setzen Sie einen echten `VLLM_API_KEY`, der zu Ihrer Serverkonfiguration passt, oder konfigurieren Sie den Provider explizit unter `models.providers.vllm`.

    <Tip>
    Wenn Ihr vLLM-Server keine Authentifizierung erzwingt, funktioniert jeder nicht leere Wert für `VLLM_API_KEY` als Opt-in-Signal für OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Keine Modelle erkannt">
    Die automatische Erkennung erfordert, dass `VLLM_API_KEY` gesetzt ist **und** kein expliziter Konfigurationseintrag `models.providers.vllm` vorhanden ist. Wenn Sie den Provider manuell definiert haben, überspringt OpenClaw die Erkennung und verwendet nur Ihre deklarierten Modelle.
  </Accordion>

  <Accordion title="Tools werden als Rohtext gerendert">
    Wenn ein Qwen-Modell JSON/XML-Tool-Syntax ausgibt, statt einen Skill auszuführen,
    lesen Sie die Qwen-Hinweise in der erweiterten Konfiguration oben. Die übliche Lösung ist:

    - vLLM mit dem korrekten Parser/Template für dieses Modell starten
    - die genaue Modell-ID mit `openclaw models list --provider vllm` bestätigen
    - eine dedizierte modellbezogene Überschreibung `params.extra_body.tool_choice: "required"`
      nur hinzufügen, wenn `tool_choice: "auto"` weiterhin leere oder reine Text-
      Tool-Aufrufe zurückgibt

  </Accordion>
</AccordionGroup>

<Warning>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Warning>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="OpenAI" href="/de/providers/openai" icon="bolt">
    Nativer OpenAI-Provider und OpenAI-kompatibles Routenverhalten.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie Sie sie beheben.
  </Card>
</CardGroup>
