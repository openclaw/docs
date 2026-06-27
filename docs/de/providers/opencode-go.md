---
read_when:
    - Sie möchten den OpenCode Go-Katalog
    - Sie benötigen die Runtime-Modellreferenzen für in Go gehostete Modelle
summary: Verwenden Sie den OpenCode-Go-Katalog mit der gemeinsamen OpenCode-Einrichtung
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:06:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/de/providers/opencode).
Er verwendet denselben `OPENCODE_API_KEY` wie der Zen-Katalog, behält aber die
Runtime-Provider-ID `opencode-go` bei, damit das Upstream-Routing pro Modell korrekt bleibt.

| Eigenschaft      | Wert                            |
| ---------------- | ------------------------------- |
| Runtime-Provider | `opencode-go`                   |
| Authentifizierung | `OPENCODE_API_KEY`             |
| Übergeordnetes Setup | [OpenCode](/de/providers/opencode) |

## Integrierter Katalog

OpenClaw bezieht die meisten Zeilen des Go-Katalogs aus der gebündelten OpenClaw-Modellregistrierung und
ergänzt aktuelle Upstream-Zeilen, während die Registrierung aufholt. Führen Sie
`openclaw models list --provider opencode-go` aus, um die aktuelle Modellliste anzuzeigen.

Der Provider enthält:

| Modellreferenz                  | Name                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3x limits) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 verwendet ein Kontextfenster mit 1 Mio. Token und unterstützt bis zu 131.000 Ausgabe-Token.

## Erste Schritte

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
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

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Routing behavior">
    OpenClaw verarbeitet das Routing pro Modell automatisch, wenn die Modellreferenz
    `opencode-go/...` verwendet. Es ist keine zusätzliche Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Runtime ref convention">
    Runtime-Referenzen bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für Go.
    Dadurch bleibt das Upstream-Routing pro Modell in beiden Katalogen korrekt.
  </Accordion>

  <Accordion title="Shared credentials">
    Derselbe `OPENCODE_API_KEY` wird sowohl vom Zen- als auch vom Go-Katalog verwendet. Wenn Sie
    den Schlüssel während der Einrichtung eingeben, werden Anmeldedaten für beide Runtime-Provider gespeichert.
  </Accordion>
</AccordionGroup>

<Tip>
Weitere Informationen zur gemeinsamen Onboarding-Übersicht und zur vollständigen
Zen- und Go-Katalogreferenz finden Sie unter [OpenCode](/de/providers/opencode).
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/de/providers/opencode" icon="server">
    Gemeinsames Onboarding, Katalogübersicht und erweiterte Hinweise.
  </Card>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
</CardGroup>
