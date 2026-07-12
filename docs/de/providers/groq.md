---
read_when:
    - Sie möchten Groq mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die Authentifizierungsauswahl der CLI.
    - Sie konfigurieren die Whisper-Audiotranskription auf Groq
summary: Groq-Einrichtung (Authentifizierung + Modellauswahl + Whisper-Transkription)
title: Groq
x-i18n:
    generated_at: "2026-07-12T15:43:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) bietet mithilfe speziell entwickelter LPU-Hardware ultraschnelle Inferenz für Open-Weight-Modelle (Llama, Gemma, Kimi, Qwen, GPT OSS und weitere). Das Groq-Plugin registriert sowohl einen OpenAI-kompatiblen Chat-Provider als auch einen Provider für das Medienverständnis von Audiodaten.

| Eigenschaft                    | Wert                                     |
| ------------------------------ | ---------------------------------------- |
| Provider-ID                    | `groq`                                   |
| Plugin                         | offizielles externes Paket               |
| Umgebungsvariable für Authentifizierung | `GROQ_API_KEY`                  |
| API                            | OpenAI-kompatibel (`openai-completions`) |
| Basis-URL                      | `https://api.groq.com/openai/v1`         |
| Audiotranskription             | `whisper-large-v3-turbo` (Standard)      |
| Empfohlenes Standard-Chatmodell | `groq/llama-3.3-70b-versatile`          |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie unter [console.groq.com/keys](https://console.groq.com/keys) einen API-Schlüssel.
  </Step>
  <Step title="API-Schlüssel festlegen">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Standardmodell festlegen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Erreichbarkeit des Katalogs überprüfen">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Beispiel für eine Konfigurationsdatei

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Integrierter Katalog

OpenClaw enthält einen manifestgestützten Groq-Katalog mit Einträgen für Modelle mit und ohne logisches Schlussfolgern. Führen Sie `openclaw models list --provider groq` aus, um die statischen Einträge Ihrer installierten Version anzuzeigen, oder rufen Sie [console.groq.com/docs/models](https://console.groq.com/docs/models) auf, um die maßgebliche Liste von Groq einzusehen.

| Modellreferenz                                    | Name                    | Logisches Schlussfolgern | Eingabe      | Kontext |
| ------------------------------------------------ | ----------------------- | ------------------------ | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | nein                     | Text         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | nein                     | Text         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | nein                     | Text + Bild  | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ja                       | Text         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ja                       | Text         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | ja                       | Text         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ja                       | Text         | 131,072 |
| `groq/groq/compound`                             | Compound                | ja                       | Text         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ja                       | Text         | 131,072 |

<Tip>
  Der Katalog entwickelt sich mit jeder OpenClaw-Version weiter. `openclaw models list --provider groq` zeigt die Einträge an, die Ihrer installierten Version bekannt sind. Gleichen Sie diese mit [console.groq.com/docs/models](https://console.groq.com/docs/models) ab, um neu hinzugefügte oder veraltete Modelle zu ermitteln.
</Tip>

## Modelle für logisches Schlussfolgern

Groq-Modelle für logisches Schlussfolgern (`reasoning: true` in der obigen Tabelle) ordnen die gemeinsamen `/think`-Stufen von OpenClaw den `reasoning_effort`-Werten `low`, `medium` oder `high` zu. Bei `/think off` oder `/think none` wird `reasoning_effort` in der Anfrage weggelassen, anstatt einen deaktivierten Wert zu senden.

Unter [Denkmodi](/de/tools/thinking) finden Sie Informationen zu den gemeinsamen `/think`-Stufen und dazu, wie OpenClaw sie für jeden Provider übersetzt.

## Audiotranskription

Das Groq-Plugin registriert außerdem einen **Provider für das Medienverständnis von Audiodaten**, sodass Sprachnachrichten über die gemeinsame `tools.media.audio`-Schnittstelle transkribiert werden können.

| Eigenschaft               | Wert                                      |
| ------------------------- | ----------------------------------------- |
| Gemeinsamer Konfigurationspfad | `tools.media.audio`                  |
| Standard-Basis-URL        | `https://api.groq.com/openai/v1`          |
| Standardmodell            | `whisper-large-v3-turbo`                  |
| Automatische Priorität    | 20                                        |
| API-Endpunkt              | OpenAI-kompatibel `/audio/transcriptions` |

So legen Sie Groq als Standard-Backend für Audio fest:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verfügbarkeit der Umgebung für den Daemon">
    Wenn der Gateway als verwalteter Dienst ausgeführt wird (launchd, systemd, Docker), muss `GROQ_API_KEY` für diesen Prozess sichtbar sein – nicht nur für Ihre interaktive Shell.

    <Warning>
      Ein ausschließlich in einer interaktiven Shell exportierter Schlüssel hilft einem launchd- oder systemd-Daemon nicht, sofern diese Umgebung nicht auch dort importiert wird. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit der Gateway-Prozess darauf zugreifen kann.
    </Warning>

  </Accordion>

  <Accordion title="Benutzerdefinierte Groq-Modell-IDs">
    OpenClaw akzeptiert zur Laufzeit jede Groq-Modell-ID. Verwenden Sie die von Groq angezeigte exakte ID und stellen Sie ihr `groq/` voran. Der statische Katalog deckt die gängigen Fälle ab; nicht katalogisierte IDs verwenden die standardmäßige OpenAI-kompatible Vorlage.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    Stufen des Schlussfolgerungsaufwands und Zusammenspiel mit Provider-Richtlinien.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider- und Audioeinstellungen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-Dashboard, API-Dokumentation und Preise.
  </Card>
</CardGroup>
