---
read_when:
    - Sie möchten OpenClaw gegen einen lokalen vLLM-Server ausführen
    - Sie möchten OpenAI-kompatible `/v1`-Endpunkte mit Ihren eigenen Modellen օգտագործen
summary: OpenClaw mit vLLM ausführen (OpenAI-kompatibler lokaler Server)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM kann Open-Source-Modelle (und einige benutzerdefinierte Modelle) über eine **OpenAI-kompatible** HTTP-API bereitstellen. OpenClaw verbindet sich mit vLLM über die API `openai-completions`.

OpenClaw kann verfügbare Modelle von vLLM auch **automatisch erkennen**, wenn Sie dies mit `VLLM_API_KEY` aktivieren (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt) und Sie keinen expliziten Eintrag `models.providers.vllm` definieren.

OpenClaw behandelt `vllm` als lokalen OpenAI-kompatiblen Provider, der
Usage Accounting im Stream unterstützt, sodass Status-/Kontext-Token-Anzahlen aus
Antworten von `stream_options.include_usage` aktualisiert werden können.

| Eigenschaft      | Wert                                     |
| ---------------- | ---------------------------------------- |
| Provider-ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI-kompatibel) |
| Auth             | Umgebungsvariable `VLLM_API_KEY`         |
| Standard-base URL | `http://127.0.0.1:8000/v1`              |

## Erste Schritte

<Steps>
  <Step title="vLLM mit einem OpenAI-kompatiblen Server starten">
    Ihre base URL sollte Endpunkte unter `/v1` bereitstellen (z. B. `/v1/models`, `/v1/chat/completions`). vLLM läuft häufig unter:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Die Umgebungsvariable für den API-Schlüssel setzen">
    Jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt:

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

Wenn `VLLM_API_KEY` gesetzt ist (oder ein Auth-Profil existiert) und Sie **nicht** `models.providers.vllm` definieren, fragt OpenClaw Folgendes ab:

```
GET http://127.0.0.1:8000/v1/models
```

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.vllm` explizit setzen, wird die automatische Erkennung übersprungen und Sie müssen Modelle manuell definieren.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie explizite Konfiguration, wenn:

- vLLM auf einem anderen Host oder Port läuft
- Sie Werte für `contextWindow` oder `maxTokens` festlegen möchten
- Ihr Server einen echten API-Schlüssel erfordert (oder Sie Header steuern möchten)
- Sie sich mit einem vertrauenswürdigen local loopback-, LAN- oder Tailscale-vLLM-Endpunkt verbinden

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Lokales vLLM-Modell",
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
    vLLM wird als Proxy-ähnliches OpenAI-kompatibles `/v1`-Backend behandelt, nicht als nativer
    OpenAI-Endpunkt. Das bedeutet:

    | Verhalten | Angewendet? |
    |----------|-------------|
    | Native OpenAI-Request-Aufbereitung | Nein |
    | `service_tier` | Wird nicht gesendet |
    | Responses `store` | Wird nicht gesendet |
    | Prompt-Cache-Hinweise | Werden nicht gesendet |
    | OpenAI-Reasoning-kompatible Nutzlastaufbereitung | Wird nicht angewendet |
    | Versteckte OpenClaw-Attributions-Header | Werden bei benutzerdefinierten base URLs nicht injiziert |

  </Accordion>

  <Accordion title="Thinking-Steuerung für Nemotron 3">
    vLLM/Nemotron 3 kann Chat-Template-Kwargs verwenden, um zu steuern, ob Reasoning
    als verborgenes Reasoning oder als sichtbarer Antworttext zurückgegeben wird. Wenn eine OpenClaw-Sitzung
    `vllm/nemotron-3-*` mit deaktiviertem Thinking verwendet, sendet OpenClaw:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Um diese Werte anzupassen, setzen Sie `chat_template_kwargs` unter den Modellparametern.
    Wenn Sie außerdem `params.extra_body.chat_template_kwargs` setzen, hat dieser Wert
    die endgültige Priorität, weil `extra_body` die letzte Überschreibung des Request-Bodys ist.

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

  <Accordion title="Benutzerdefinierte base URL">
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
            models: [
              {
                id: "my-custom-model",
                name: "Remote-vLLM-Modell",
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
  <Accordion title="Server nicht erreichbar">
    Prüfen Sie, ob der vLLM-Server läuft und erreichbar ist:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Wenn Sie einen Verbindungsfehler sehen, prüfen Sie Host, Port und ob vLLM im OpenAI-kompatiblen Servermodus gestartet wurde.
    Für explizite local loopback-, LAN- oder Tailscale-Endpunkte setzen Sie außerdem
    `models.providers.vllm.request.allowPrivateNetwork: true`; Provider-
    Anfragen blockieren standardmäßig URLs in privaten Netzwerken, sofern dem Provider
    nicht explizit vertraut wird.

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
</AccordionGroup>

<Warning>
Weitere Hilfe: [Troubleshooting](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Fallback-Verhalten auswählen.
  </Card>
  <Card title="OpenAI" href="/de/providers/openai" icon="bolt">
    Nativer OpenAI-Provider und Verhalten der OpenAI-kompatiblen Route.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Details zu Authentifizierung und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie sie behoben werden.
  </Card>
</CardGroup>
