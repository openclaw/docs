---
read_when:
    - Sie möchten Groq mit OpenClaw verwenden
    - Sie benötigen die API-Schlüssel-Umgebungsvariable oder die Auswahl der CLI-Authentifizierung
summary: Groq-Einrichtung (Authentifizierung + Modellauswahl)
title: Groq
x-i18n:
    generated_at: "2026-04-30T07:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) bietet ultraschnelle Inferenz für Open-Source-Modelle
(Llama, Gemma, Mistral und weitere) mit spezieller LPU-Hardware. OpenClaw stellt
über die OpenAI-kompatible API eine Verbindung zu Groq her.

| Eigenschaft | Wert              |
| ----------- | ----------------- |
| Provider    | `groq`            |
| Authentifizierung | `GROQ_API_KEY`    |
| API         | OpenAI-kompatibel |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="API-Schlüssel festlegen">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

Der Modellkatalog von Groq ändert sich häufig. Führen Sie `openclaw models list | grep groq`
aus, um die derzeit verfügbaren Modelle anzuzeigen, oder prüfen Sie
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modell                      | Hinweise                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Allgemeiner Einsatz, großer Kontext |
| **Llama 3.1 8B Instant**    | Schnell, leichtgewichtig           |
| **Gemma 2 9B**              | Kompakt, effizient                 |
| **Mixtral 8x7B**            | MoE-Architektur, starkes Reasoning |

<Tip>
Verwenden Sie `openclaw models list --provider groq`, um die aktuellste Liste der
für Ihr Konto verfügbaren Modelle zu erhalten.
</Tip>

## Reasoning-Modelle

OpenClaw ordnet seine gemeinsamen `/think`-Stufen den modellspezifischen
`reasoning_effort`-Werten von Groq zu. Für `qwen/qwen3-32b` sendet deaktiviertes
Denken `none` und aktiviertes Denken `default`. Für Groq GPT-OSS-Reasoning-Modelle
sendet OpenClaw `low`, `medium` oder `high`; bei deaktiviertem Denken wird
`reasoning_effort` ausgelassen, da diese Modelle keinen deaktivierten Wert
unterstützen.

## Audiotranskription

Groq bietet außerdem schnelle Whisper-basierte Audiotranskription. Wenn Groq als
Provider für Medienverständnis konfiguriert ist, verwendet OpenClaw das
`whisper-large-v3-turbo`-Modell von Groq, um Sprachnachrichten über die gemeinsame
`tools.media.audio`-Oberfläche zu transkribieren.

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
  <Accordion title="Details zur Audiotranskription">
    | Eigenschaft | Wert |
    |----------|-------|
    | Gemeinsamer Konfigurationspfad | `tools.media.audio` |
    | Standard-Basis-URL | `https://api.groq.com/openai/v1` |
    | Standardmodell | `whisper-large-v3-turbo` |
    | API-Endpunkt | OpenAI-kompatibel `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `GROQ_API_KEY`
    für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für vom Daemon verwaltete
    Gateway-Prozesse nicht sichtbar. Verwenden Sie die Konfiguration `~/.openclaw/.env` oder
    `env.shellEnv` für dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider- und Audioeinstellungen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-Dashboard, API-Dokumentation und Preise.
  </Card>
  <Card title="Groq-Modellliste" href="https://console.groq.com/docs/models" icon="list">
    Offizieller Modellkatalog von Groq.
  </Card>
</CardGroup>
