---
read_when:
    - Sie möchten den OpenCode-Go-Katalog
    - Sie benötigen die Laufzeit-Modell-Refs für Go-gehostete Modelle
summary: Verwenden Sie den OpenCode-Go-Katalog mit dem gemeinsamen OpenCode-Setup
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:27:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/de/providers/opencode).
Er verwendet denselben `OPENCODE_API_KEY` wie der Zen-Katalog, behält aber die Laufzeit-
Anbieter-ID `opencode-go` bei, damit das Upstream-Routing pro Modell korrekt bleibt.

| Eigenschaft      | Wert                            |
| ---------------- | ------------------------------- |
| Laufzeitanbieter | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Übergeordnetes Setup | [OpenCode](/de/providers/opencode) |

## Unterstützte Modelle

OpenClaw bezieht den Go-Katalog aus der gebündelten pi-Modell-Registry. Führen Sie
`openclaw models list --provider opencode-go` aus, um die aktuelle Modellliste anzuzeigen.

Stand des gebündelten pi-Katalogs enthält der Anbieter:

| Modell-Ref                 | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (3x-Limits) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Erste Schritte

<Tabs>
  <Tab title="Interaktiv">
    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Ein Go-Modell als Standard setzen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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
      <Step title="Den Schlüssel direkt übergeben">
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Routing-Verhalten">
    OpenClaw übernimmt das Routing pro Modell automatisch, wenn der Modell-Ref
    `opencode-go/...` verwendet. Es ist keine zusätzliche Anbieterkonfiguration erforderlich.
  </Accordion>

  <Accordion title="Konvention für Laufzeit-Refs">
    Laufzeit-Refs bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für Go.
    Dadurch bleibt das Upstream-Routing pro Modell in beiden Katalogen korrekt.
  </Accordion>

  <Accordion title="Gemeinsame Anmeldedaten">
    Derselbe `OPENCODE_API_KEY` wird sowohl vom Zen- als auch vom Go-Katalog verwendet. Wenn Sie
    den Schlüssel während des Setups eingeben, werden Anmeldedaten für beide Laufzeitanbieter gespeichert.
  </Accordion>
</AccordionGroup>

<Tip>
Siehe [OpenCode](/de/providers/opencode) für die gemeinsame Onboarding-Übersicht und die vollständige
Referenz für Zen- + Go-Katalog.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="OpenCode (übergeordnet)" href="/de/providers/opencode" icon="server">
    Gemeinsames Onboarding, Katalogübersicht und erweiterte Hinweise.
  </Card>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Anbietern, Modell-Refs und Failover-Verhalten.
  </Card>
</CardGroup>
