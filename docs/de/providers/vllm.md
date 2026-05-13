---
read_when:
    - Sie möchten OpenClaw mit einem lokalen vLLM-Server ausführen
    - Sie möchten OpenAI-kompatible /v1-Endpunkte mit Ihren eigenen Modellen
summary: OpenClaw mit vLLM ausführen (OpenAI-kompatibler lokaler Server)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM kann Open-Source-Modelle (und einige benutzerdefinierte Modelle) über eine **OpenAI-kompatible** HTTP-API bereitstellen. OpenClaw verbindet sich über die `openai-completions`-API mit vLLM.

OpenClaw kann verfügbare Modelle auch **automatisch erkennen**, wenn Sie dies mit `VLLM_API_KEY` aktivieren (ein beliebiger Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt). Verwenden Sie `vllm/*` in `agents.defaults.models`, um die Erkennung dynamisch zu halten, wenn Sie auch eine benutzerdefinierte vLLM-Basis-URL konfigurieren.

OpenClaw behandelt `vllm` als lokalen OpenAI-kompatiblen Provider, der
gestreamte Nutzungsabrechnung unterstützt, sodass Status-/Kontext-Token-Zählungen aus
`stream_options.include_usage`-Antworten aktualisiert werden können.

| Eigenschaft       | Wert                                     |
| ----------------- | ---------------------------------------- |
| Provider-ID       | `vllm`                                   |
| API               | `openai-completions` (OpenAI-kompatibel) |
| Authentifizierung | `VLLM_API_KEY`-Umgebungsvariable         |
| Standard-Basis-URL | `http://127.0.0.1:8000/v1`              |

## Erste Schritte

<Steps>
  <Step title="vLLM mit einem OpenAI-kompatiblen Server starten">
    Ihre Basis-URL sollte `/v1`-Endpunkte bereitstellen (z. B. `/v1/models`, `/v1/chat/completions`). vLLM läuft häufig unter:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Die API-Schlüssel-Umgebungsvariable festlegen">
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

Wenn `VLLM_API_KEY` gesetzt ist (oder ein Authentifizierungsprofil vorhanden ist) und Sie `models.providers.vllm` **nicht** definieren, fragt OpenClaw Folgendes ab:

```
GET http://127.0.0.1:8000/v1/models
```

und konvertiert die zurückgegebenen IDs in Modelleinträge.

<Note>
Wenn Sie `models.providers.vllm` explizit festlegen, verwendet OpenClaw standardmäßig Ihre deklarierten Modelle. Fügen Sie `"vllm/*": {}` zu `agents.defaults.models` hinzu, wenn OpenClaw den `/models`-Endpunkt dieses konfigurierten Providers abfragen und alle beworbenen vLLM-Modelle einbeziehen soll.
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

Um diesen Provider dynamisch zu halten, ohne jedes Modell manuell aufzulisten, fügen Sie dem sichtbaren Modellkatalog einen Provider-Wildcard hinzu:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Proxy-artiges Verhalten">
    vLLM wird als proxy-artiges OpenAI-kompatibles `/v1`-Backend behandelt, nicht als nativer
    OpenAI-Endpunkt. Das bedeutet:

    | Verhalten | Angewendet? |
    |----------|----------|
    | Native OpenAI-Anfrageformung | Nein |
    | `service_tier` | Nicht gesendet |
    | Responses `store` | Nicht gesendet |
    | Prompt-Cache-Hinweise | Nicht gesendet |
    | OpenAI-Reasoning-Kompatibilitäts-Payload-Formung | Nicht angewendet |
    | Verborgene OpenClaw-Zuordnungsheader | Bei benutzerdefinierten Basis-URLs nicht eingefügt |

  </Accordion>

  <Accordion title="Qwen-Thinking-Steuerungen">
    Legen Sie für Qwen-Modelle, die über vLLM bereitgestellt werden,
    `params.qwenThinkingFormat: "chat-template"` im Modelleintrag fest, wenn der
    Server Qwen-Chat-Template-Kwargs erwartet. OpenClaw ordnet `/think off` Folgendem zu:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Thinking-Stufen außer `off` senden `enable_thinking: true`. Wenn Ihr Endpunkt
    stattdessen DashScope-artige Top-Level-Flags erwartet, verwenden Sie
    `params.qwenThinkingFormat: "top-level"`, um `enable_thinking` im
    Anfrage-Root zu senden. Snake-Case `params.qwen_thinking_format` wird ebenfalls akzeptiert.

  </Accordion>

  <Accordion title="Nemotron-3-Thinking-Steuerungen">
    vLLM/Nemotron 3 kann Chat-Template-Kwargs verwenden, um zu steuern, ob Reasoning
    als verborgenes Reasoning oder sichtbarer Antworttext zurückgegeben wird. Wenn eine OpenClaw-Sitzung
    `vllm/nemotron-3-*` mit deaktiviertem Thinking verwendet, sendet das gebündelte vLLM-Plugin:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Um diese Werte anzupassen, legen Sie `chat_template_kwargs` unter den Modellparametern fest.
    Wenn Sie auch `params.extra_body.chat_template_kwargs` festlegen, hat dieser Wert
    endgültigen Vorrang, da `extra_body` die letzte Request-Body-Überschreibung ist.

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

  <Accordion title="Qwen-Tool-Calls erscheinen als Text">
    Stellen Sie zuerst sicher, dass vLLM mit dem richtigen Tool-Call-Parser und Chat-
    Template für das Modell gestartet wurde. Beispielsweise dokumentiert vLLM `hermes` für Qwen2.5-
    Modelle und `qwen3_xml` für Qwen3-Coder-Modelle.

    Symptome:

    - Skills oder Tools werden nie ausgeführt
    - der Assistent gibt rohes JSON/XML wie `{"name":"read","arguments":...}` aus
    - vLLM gibt ein leeres `tool_calls`-Array zurück, wenn OpenClaw
      `tool_choice: "auto"` sendet

    Einige Qwen/vLLM-Kombinationen geben strukturierte Tool-Calls nur zurück, wenn die
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

    Ersetzen Sie `Qwen-Qwen2.5-Coder-32B-Instruct` durch die exakte ID, die zurückgegeben wird von:

    ```bash
    openclaw models list --provider vllm
    ```

    Sie können dieselbe Überschreibung über die CLI anwenden:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Dies ist ein explizit zu aktivierender Kompatibilitäts-Workaround. Er bewirkt, dass jede Modellrunde mit
    Tools einen Tool-Call erfordert. Verwenden Sie ihn daher nur für einen dedizierten lokalen Modelleintrag,
    bei dem dieses Verhalten akzeptabel ist. Verwenden Sie ihn nicht als globalen Standard für alle
    vLLM-Modelle, und verwenden Sie keinen Proxy, der beliebigen
    Assistententext blind in ausführbare Tool-Calls umwandelt.

  </Accordion>

  <Accordion title="Benutzerdefinierte Basis-URL">
    Wenn Ihr vLLM-Server auf einem nicht standardmäßigen Host oder Port läuft, legen Sie `baseUrl` in der expliziten Provider-Konfiguration fest:

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
    Legen Sie für große lokale Modelle, Remote-LAN-Hosts oder Tailnet-Verbindungen ein
    Provider-spezifisches Anfrage-Timeout fest:

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
    Verbindungsaufbau, Antwortheadern, Body-Streaming und dem gesamten
    abgesicherten Fetch-Abbruch. Ziehen Sie dies einer Erhöhung von
    `agents.defaults.timeoutSeconds` vor, das den gesamten Agent-Lauf steuert.

  </Accordion>

  <Accordion title="Server nicht erreichbar">
    Prüfen Sie, ob der vLLM-Server läuft und erreichbar ist:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Wenn ein Verbindungsfehler angezeigt wird, prüfen Sie Host, Port und ob vLLM im OpenAI-kompatiblen Servermodus gestartet wurde.
    Legen Sie für explizite loopback-, LAN- oder Tailscale-Endpunkte außerdem
    `models.providers.vllm.request.allowPrivateNetwork: true` fest; Provider-
    Anfragen blockieren URLs in privaten Netzwerken standardmäßig, sofern der Provider nicht
    explizit als vertrauenswürdig gilt.

  </Accordion>

  <Accordion title="Authentifizierungsfehler bei Anfragen">
    Wenn Anfragen mit Authentifizierungsfehlern fehlschlagen, legen Sie einen echten `VLLM_API_KEY` fest, der Ihrer Serverkonfiguration entspricht, oder konfigurieren Sie den Provider explizit unter `models.providers.vllm`.

    <Tip>
    Wenn Ihr vLLM-Server keine Authentifizierung erzwingt, funktioniert jeder nicht leere Wert für `VLLM_API_KEY` als Aktivierungssignal für OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Keine Modelle erkannt">
    Die automatische Erkennung erfordert, dass `VLLM_API_KEY` gesetzt ist. Wenn Sie `models.providers.vllm` definiert haben, verwendet OpenClaw nur Ihre deklarierten Modelle, es sei denn, `agents.defaults.models` enthält `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools werden als roher Text dargestellt">
    Wenn ein Qwen-Modell JSON/XML-Tool-Syntax ausgibt, statt einen Skill auszuführen,
    prüfen Sie die Qwen-Hinweise in der erweiterten Konfiguration oben. Die übliche Lösung ist:

    - vLLM mit dem richtigen Parser/Template für dieses Modell starten
    - die exakte Modell-ID mit `openclaw models list --provider vllm` bestätigen
    - nur dann eine dedizierte modellbezogene Überschreibung `params.extra_body.tool_choice: "required"`
      hinzufügen, wenn `tool_choice: "auto"` weiterhin leere oder nur textbasierte
      Tool-Calls zurückgibt

  </Accordion>
</AccordionGroup>

<Warning>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Warning>

## Verwandt

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
