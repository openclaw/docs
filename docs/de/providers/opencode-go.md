---
read_when:
    - Sie möchten den OpenCode-Go-Katalog
    - Sie benötigen die Laufzeit-Modellreferenzen für in Go gehostete Modelle
summary: Verwenden Sie den OpenCode-Go-Katalog mit der gemeinsamen OpenCode-Einrichtung
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T02:06:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/de/providers/opencode). Er verwendet
dieselben `OPENCODE_API_KEY`-Anmeldedaten wie der Zen-Katalog, behält jedoch seine eigene
Laufzeit-Provider-ID (`opencode-go`), damit das vorgelagerte modellspezifische Routing
korrekt bleibt.

| Eigenschaft      | Wert                                               |
| ---------------- | -------------------------------------------------- |
| Laufzeit-Provider | `opencode-go`                                     |
| Authentifizierung | `OPENCODE_API_KEY` (Alias: `OPENCODE_ZEN_API_KEY`) |
| Übergeordnete Einrichtung | [OpenCode](/de/providers/opencode)           |

## Erste Schritte

<Tabs>
  <Tab title="Interaktiv">
    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Ein Go-Modell als Standard festlegen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Nicht interaktiv">
    <Steps>
      <Step title="Schlüssel direkt übergeben">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Konfigurationsbeispiel

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Integrierter Katalog

Führen Sie `openclaw models list --provider opencode-go` aus, um die aktuelle Modellliste anzuzeigen.
Mitgelieferte Einträge:

| Modellreferenz                  | Name              | Kontext   | Maximale Ausgabe | Bildeingabe |
| ------------------------------- | ----------------- | --------- | ---------------- | ----------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K             | Nein        |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K             | Nein        |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768           | Nein        |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768           | Nein        |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072          | Nein        |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768           | Nein        |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536           | Ja          |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536           | Ja          |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144          | Ja          |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000          | Ja          |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000          | Nein        |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536           | Nein        |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072          | Nein        |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072          | Nein        |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536           | Ja          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536           | Ja          |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536           | Nein        |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536           | Ja          |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Routing-Verhalten">
    OpenClaw leitet jede Modellreferenz vom Typ `opencode-go/...` automatisch weiter. Es ist keine zusätzliche
    Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Konvention für Laufzeitreferenzen">
    Laufzeitreferenzen bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für
    Go. Dadurch bleibt das vorgelagerte modellspezifische Routing für beide Kataloge korrekt.
  </Accordion>

  <Accordion title="Gemeinsam verwendete Anmeldedaten">
    Ein `OPENCODE_API_KEY` gilt sowohl für den Zen- als auch für den Go-Katalog. Wenn Sie den
    Schlüssel während der Einrichtung eingeben, werden die Anmeldedaten für beide Laufzeit-Provider gespeichert.
  </Accordion>
</AccordionGroup>

<Tip>
Unter [OpenCode](/de/providers/opencode) finden Sie die gemeinsame Onboarding-Übersicht und die vollständige
Katalogreferenz für Zen und Go.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="OpenCode (übergeordnet)" href="/de/providers/opencode" icon="server">
    Gemeinsames Onboarding, Katalogübersicht und erweiterte Hinweise.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern und Modellreferenzen sowie Failover-Verhalten.
  </Card>
</CardGroup>
