---
read_when:
    - Sie möchten den OpenCode-Go-Katalog.
    - Sie benötigen die Laufzeit-Modellreferenzen für Go-gehostete Modelle.
summary: Verwenden Sie den OpenCode-Go-Katalog mit dem gemeinsamen OpenCode-Setup
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T18:21:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/de/providers/opencode).
Er verwendet denselben `OPENCODE_API_KEY` wie der Zen-Katalog, behält aber die Laufzeit-
Provider-ID `opencode-go` bei, damit das vorgelagerte Routing pro Modell korrekt bleibt.

| Eigenschaft      | Wert                            |
| ---------------- | ------------------------------- |
| Laufzeit-Provider | `opencode-go`                  |
| Authentifizierung | `OPENCODE_API_KEY`             |
| Übergeordnete Einrichtung | [OpenCode](/de/providers/opencode) |

## Integrierter Katalog

OpenClaw bezieht die meisten Zeilen des Go-Katalogs aus der gebündelten Pi-Modell-Registry und
ergänzt aktuelle vorgelagerte Zeilen, während die Registry aufholt. Führen Sie
`openclaw models list --provider opencode-go` aus, um die aktuelle Modellliste zu sehen.

Der Provider enthält:

| Modellreferenz                  | Name                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3x Limits) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

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
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Nicht interaktiv">
    <Steps>
      <Step title="Den Key direkt übergeben">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
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
  <Accordion title="Routing-Verhalten">
    OpenClaw übernimmt das Routing pro Modell automatisch, wenn die Modellreferenz
    `opencode-go/...` verwendet. Es ist keine zusätzliche Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Konvention für Laufzeitreferenzen">
    Laufzeitreferenzen bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für Go.
    Dadurch bleibt das vorgelagerte Routing pro Modell über beide Kataloge hinweg korrekt.
  </Accordion>

  <Accordion title="Gemeinsame Zugangsdaten">
    Derselbe `OPENCODE_API_KEY` wird sowohl vom Zen- als auch vom Go-Katalog verwendet. Wenn Sie
    den Key während der Einrichtung eingeben, werden Zugangsdaten für beide Laufzeit-Provider gespeichert.
  </Accordion>
</AccordionGroup>

<Tip>
Siehe [OpenCode](/de/providers/opencode) für die gemeinsame Onboarding-Übersicht und die vollständige
Referenz für Zen- und Go-Kataloge.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="OpenCode (übergeordnet)" href="/de/providers/opencode" icon="server">
    Gemeinsames Onboarding, Katalogübersicht und erweiterte Hinweise.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
