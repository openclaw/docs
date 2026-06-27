---
read_when:
    - Sie möchten Groq mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die Authentifizierungsauswahl der CLI
    - Sie konfigurieren die Whisper-Audiotranskription auf Groq
summary: Groq-Einrichtung (Authentifizierung + Modellauswahl + Whisper-Transkription)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:04:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) bietet ultraschnelle Inferenz auf Open-Weight-Modellen (Llama, Gemma, Kimi, Qwen, GPT OSS und mehr) mit benutzerdefinierter LPU-Hardware. Das Groq-Plugin registriert sowohl einen OpenAI-kompatiblen Chat-Provider als auch einen Provider für Audio-Medienverständnis.

| Eigenschaft            | Wert                                     |
| ---------------------- | ---------------------------------------- |
| Provider-ID            | `groq`                                   |
| Plugin                 | offizielles externes Paket               |
| Auth-Umgebungsvariable | `GROQ_API_KEY`                           |
| API                    | OpenAI-kompatibel (`openai-completions`) |
| Basis-URL              | `https://api.groq.com/openai/v1`         |
| Audio-Transkription    | `whisper-large-v3-turbo` (Standard)      |
| Empfohlener Chat-Standard | `groq/llama-3.3-70b-versatile`        |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [console.groq.com/keys](https://console.groq.com/keys).
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
  <Step title="Prüfen, ob der Katalog erreichbar ist">
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

OpenClaw liefert einen manifestgestützten Groq-Katalog mit Reasoning- und Nicht-Reasoning-Einträgen aus. Führen Sie `openclaw models list --provider groq` aus, um die statischen Zeilen Ihrer installierten Version anzuzeigen, oder prüfen Sie [console.groq.com/docs/models](https://console.groq.com/docs/models) für Groqs maßgebliche Liste.

| Modellreferenz                                   | Name                    | Reasoning | Eingabe      | Kontext |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | nein      | Text         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | nein      | Text         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | nein      | Text + Bild  | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ja        | Text         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ja        | Text         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | ja        | Text         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ja        | Text         | 131,072 |
| `groq/groq/compound`                             | Compound                | ja        | Text         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ja        | Text         | 131,072 |

<Tip>
  Der Katalog entwickelt sich mit jeder OpenClaw-Version weiter. `openclaw models list --provider groq` zeigt die Zeilen, die Ihrer installierten Version bekannt sind; gleichen Sie dies mit [console.groq.com/docs/models](https://console.groq.com/docs/models) ab, um neu hinzugefügte oder veraltete Modelle zu prüfen.
</Tip>

## Reasoning-Modelle

OpenClaw ordnet seine gemeinsamen `/think`-Stufen den modellspezifischen `reasoning_effort`-Werten von Groq zu:

- Für `qwen/qwen3-32b` sendet deaktiviertes Denken `none` und aktiviertes Denken `default`.
- Für Groq-GPT-OSS-Reasoning-Modelle (`openai/gpt-oss-*`) sendet OpenClaw je nach `/think`-Stufe `low`, `medium` oder `high`. Bei deaktiviertem Denken wird `reasoning_effort` ausgelassen, da diese Modelle keinen deaktivierten Wert unterstützen.
- DeepSeek R1 Distill, Qwen QwQ und Compound verwenden Groqs native Reasoning-Oberfläche; `/think` steuert die Sichtbarkeit, aber das Modell denkt immer.

Siehe [Denkmodi](/de/tools/thinking) für die gemeinsamen `/think`-Stufen und wie OpenClaw sie pro Provider übersetzt.

## Audio-Transkription

Das Groq-Plugin registriert außerdem einen **Provider für Audio-Medienverständnis**, damit Sprachnachrichten über die gemeinsame Oberfläche `tools.media.audio` transkribiert werden können.

| Eigenschaft                 | Wert                                      |
| --------------------------- | ----------------------------------------- |
| Gemeinsamer Konfigurationspfad | `tools.media.audio`                    |
| Standard-Basis-URL          | `https://api.groq.com/openai/v1`          |
| Standardmodell              | `whisper-large-v3-turbo`                  |
| Automatische Priorität      | 20                                        |
| API-Endpunkt                | OpenAI-kompatibel `/audio/transcriptions` |

So machen Sie Groq zum Standard-Audio-Backend:

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
  <Accordion title="Umgebungsverfügbarkeit für den Daemon">
    Wenn der Gateway als verwalteter Dienst ausgeführt wird (launchd, systemd, Docker), muss `GROQ_API_KEY` für diesen Prozess sichtbar sein – nicht nur für Ihre interaktive Shell.

    <Warning>
      Ein nur in einer interaktiven Shell exportierter Schlüssel hilft einem launchd- oder systemd-Daemon nicht, sofern diese Umgebung dort nicht ebenfalls importiert wird. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit er vom Gateway-Prozess gelesen werden kann.
    </Warning>

  </Accordion>

  <Accordion title="Benutzerdefinierte Groq-Modell-IDs">
    OpenClaw akzeptiert zur Laufzeit jede Groq-Modell-ID. Verwenden Sie die exakte von Groq angezeigte ID und stellen Sie ihr `groq/` voran. Der statische Katalog deckt die üblichen Fälle ab; nicht katalogisierte IDs fallen auf die standardmäßige OpenAI-kompatible Vorlage zurück.

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
    Reasoning-Aufwandsstufen und Interaktion mit Provider-Richtlinien.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider- und Audio-Einstellungen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-Dashboard, API-Dokumentation und Preise.
  </Card>
</CardGroup>
