---
read_when:
    - Sie möchten OpenClaw mit einem lokalen vLLM-Server ausführen
    - Sie möchten OpenAI-kompatible /v1-Endpunkte mit Ihren eigenen Modellen
summary: OpenClaw mit vLLM ausführen (OpenAI-kompatibler lokaler Server)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:07:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM kann Open-Source-Modelle (und einige benutzerdefinierte Modelle) über eine **OpenAI-kompatible** HTTP-API bereitstellen. OpenClaw verbindet sich mit vLLM über die `openai-completions`-API.

OpenClaw kann verfügbare Modelle von vLLM auch **automatisch erkennen**, wenn Sie dies mit `VLLM_API_KEY` aktivieren (beliebiger Wert, wenn Ihr Server keine Authentifizierung erzwingt). Verwenden Sie `vllm/*` in `agents.defaults.models`, damit die Erkennung dynamisch bleibt, wenn Sie zusätzlich eine benutzerdefinierte vLLM-Basis-URL konfigurieren.

OpenClaw behandelt `vllm` als lokalen OpenAI-kompatiblen Provider, der
gestreamte Nutzungsabrechnung unterstützt, sodass sich Status-/Kontext-Tokenzahlen aus
`stream_options.include_usage`-Antworten aktualisieren können.

| Eigenschaft      | Wert                                     |
| ---------------- | ---------------------------------------- |
| Provider-ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI-kompatibel) |
| Auth             | Umgebungsvariable `VLLM_API_KEY`         |
| Standard-Basis-URL | `http://127.0.0.1:8000/v1`             |

## Erste Schritte

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Ihre Basis-URL sollte `/v1`-Endpunkte bereitstellen (z. B. `/v1/models`, `/v1/chat/completions`). vLLM läuft üblicherweise unter:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Modellerkennung (impliziter Provider)

Wenn `VLLM_API_KEY` gesetzt ist (oder ein Auth-Profil vorhanden ist) und Sie `models.providers.vllm` **nicht** definieren, fragt OpenClaw Folgendes ab:

```
GET http://127.0.0.1:8000/v1/models
```

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.vllm` explizit festlegen, verwendet OpenClaw standardmäßig Ihre deklarierten Modelle. Fügen Sie `"vllm/*": {}` zu `agents.defaults.models` hinzu, wenn OpenClaw den `/models`-Endpunkt dieses konfigurierten Providers abfragen und alle beworbenen vLLM-Modelle einbeziehen soll.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie eine explizite Konfiguration, wenn:

- vLLM auf einem anderen Host oder Port läuft
- Sie Werte für `contextWindow` oder `maxTokens` festlegen möchten
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

Damit dieser Provider dynamisch bleibt, ohne jedes Modell manuell aufzulisten, fügen Sie dem sichtbaren Modellkatalog einen Provider-Wildcard-Eintrag hinzu:

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
  <Accordion title="Proxy-style behavior">
    vLLM wird als proxyartiges OpenAI-kompatibles `/v1`-Backend behandelt, nicht als nativer
    OpenAI-Endpunkt. Das bedeutet:

    | Verhalten | Angewendet? |
    |----------|----------|
    | Native OpenAI-Anfrageformung | Nein |
    | `service_tier` | Nicht gesendet |
    | Responses `store` | Nicht gesendet |
    | Prompt-Cache-Hinweise | Nicht gesendet |
    | OpenAI-Reasoning-Kompatibilitäts-Payload-Formung | Nicht angewendet |
    | Verborgene OpenClaw-Zuordnungs-Header | Bei benutzerdefinierten Basis-URLs nicht injiziert |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Legen Sie für Qwen-Modelle, die über vLLM bereitgestellt werden,
    `compat.thinkingFormat: "qwen-chat-template"` in der konfigurierten Provider-
    Modellzeile fest, wenn der Server Qwen-Chat-Template-kwargs erwartet. Auf diese Weise
    konfigurierte Modelle stellen ein binäres `/think`-Profil (`off`, `on`) bereit, weil
    Qwen-Template-Thinking ein Ein/Aus-Anfrageflag ist und keine OpenAI-artige
    Aufwandsleiter.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw ordnet `/think off` Folgendem zu:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Nicht-`off`-Thinking-Stufen senden `enable_thinking: true`. Wenn Ihr Endpunkt stattdessen
    DashScope-artige Flags auf oberster Ebene erwartet, verwenden Sie
    `compat.thinkingFormat: "qwen"`, um `enable_thinking` im Anfrage-Root zu senden.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 kann Chat-Template-kwargs verwenden, um zu steuern, ob Reasoning als
    verborgenes Reasoning oder sichtbarer Antworttext zurückgegeben wird. Wenn eine OpenClaw-Sitzung
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
    Wenn Sie zusätzlich `params.extra_body.chat_template_kwargs` festlegen, hat dieser Wert
    endgültigen Vorrang, da `extra_body` die letzte Überschreibung des Anfrage-Bodys ist.

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

  <Accordion title="Qwen tool calls appear as text">
    Stellen Sie zunächst sicher, dass vLLM mit dem richtigen Tool-Call-Parser und Chat-
    Template für das Modell gestartet wurde. Beispielsweise dokumentiert vLLM `hermes` für Qwen2.5-
    Modelle und `qwen3_xml` für Qwen3-Coder-Modelle.

    Symptome:

    - Skills oder Tools werden nie ausgeführt
    - der Assistent gibt rohes JSON/XML wie `{"name":"read","arguments":...}` aus
    - vLLM gibt ein leeres `tool_calls`-Array zurück, wenn OpenClaw
      `tool_choice: "auto"` sendet

    Einige Qwen/vLLM-Kombinationen geben strukturierte Tool Calls nur zurück, wenn die
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

    Ersetzen Sie `Qwen-Qwen2.5-Coder-32B-Instruct` durch die exakte ID, die Folgendes zurückgibt:

    ```bash
    openclaw models list --provider vllm
    ```

    Sie können dieselbe Überschreibung über die CLI anwenden:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Dies ist ein explizit zu aktivierender Kompatibilitäts-Workaround. Er sorgt dafür, dass jede Modellrunde mit
    Tools einen Tool Call erfordert. Verwenden Sie ihn daher nur für einen dedizierten lokalen Modelleintrag,
    bei dem dieses Verhalten akzeptabel ist. Verwenden Sie ihn nicht als globalen Standard für alle
    vLLM-Modelle und verwenden Sie keinen Proxy, der beliebigen
    Assistententext blind in ausführbare Tool Calls umwandelt.

  </Accordion>

  <Accordion title="Custom base URL">
    Wenn Ihr vLLM-Server auf einem nicht standardmäßigen Host oder Port läuft, legen Sie `baseUrl` in der expliziten Provider-Konfiguration fest:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
  <Accordion title="Slow first response or remote server timeout">
    Legen Sie für große lokale Modelle, Remote-LAN-Hosts oder Tailnet-Verbindungen ein
    Provider-bezogenes Anfrage-Timeout fest:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` gilt nur für HTTP-Anfragen an vLLM-Modelle, einschließlich
    Verbindungsaufbau, Antwort-Headern, Body-Streaming und dem gesamten
    guarded-fetch-Abbruch. Bevorzugen Sie dies, bevor Sie
    `agents.defaults.timeoutSeconds` erhöhen, das den gesamten Agent-Lauf steuert.

  </Accordion>

  <Accordion title="Server not reachable">
    Prüfen Sie, ob der vLLM-Server läuft und erreichbar ist:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Wenn Sie einen Verbindungsfehler sehen, prüfen Sie Host, Port und ob vLLM im OpenAI-kompatiblen Servermodus gestartet wurde.
    Für explizite loopback-, LAN- oder Tailscale-Endpunkte vertraut OpenClaw dem
    exakt konfigurierten Ursprung `models.providers.vllm.baseUrl` für geschützte Modellanfragen.
    Metadata-/Link-Local-Ursprünge bleiben ohne explizite
    Aktivierung blockiert. Setzen Sie `models.providers.vllm.request.allowPrivateNetwork: true` nur,
    wenn vLLM-Anfragen einen anderen privaten Ursprung erreichen müssen, und setzen Sie es auf `false`,
    um dem Vertrauen in den exakten Ursprung zu widersprechen.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Wenn Anfragen mit Authentifizierungsfehlern fehlschlagen, legen Sie einen echten `VLLM_API_KEY` fest, der zu Ihrer Serverkonfiguration passt, oder konfigurieren Sie den Provider explizit unter `models.providers.vllm`.

    <Tip>
    Wenn Ihr vLLM-Server keine Authentifizierung erzwingt, funktioniert jeder nicht leere Wert für `VLLM_API_KEY` als Opt-in-Signal für OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Die automatische Erkennung erfordert, dass `VLLM_API_KEY` gesetzt ist. Wenn Sie `models.providers.vllm` definiert haben, verwendet OpenClaw nur Ihre deklarierten Modelle, es sei denn, `agents.defaults.models` enthält `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Wenn ein Qwen-Modell JSON/XML-Tool-Syntax ausgibt, statt einen Skill auszuführen,
    prüfen Sie die Qwen-Hinweise in der erweiterten Konfiguration oben. Die übliche Lösung ist:

    - vLLM mit dem richtigen Parser/Template für dieses Modell starten
    - die exakte Modell-ID mit `openclaw models list --provider vllm` bestätigen
    - eine dedizierte, modellspezifische Überschreibung `params.extra_body.tool_choice: "required"`
      nur hinzufügen, wenn `tool_choice: "auto"` weiterhin leere oder reine Text-
      Tool Calls zurückgibt

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
    Nativer OpenAI-Provider und Verhalten OpenAI-kompatibler Routen.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie Sie sie beheben.
  </Card>
</CardGroup>
