---
read_when:
    - Sie möchten den OpenCode-Go-Katalog
    - Sie benötigen die Runtime-Modell-Refs für Go-gehostete Modelle
summary: Den OpenCode-Go-Katalog mit dem gemeinsamen OpenCode-Setup verwenden
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:55:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/de/providers/opencode).
Er verwendet denselben `OPENCODE_API_KEY` wie der Zen-Katalog, behält aber die Runtime-
Provider-ID `opencode-go`, damit das Upstream-Routing pro Modell korrekt bleibt.

| Eigenschaft      | Wert                            |
| ---------------- | ------------------------------- |
| Runtime-Provider | `opencode-go`                   |
| Authentifizierung | `OPENCODE_API_KEY`             |
| Übergeordnetes Setup | [OpenCode](/de/providers/opencode) |

## Gebündelter Katalog

OpenClaw bezieht den Go-Katalog aus der gebündelten Pi-Modell-Registry. Führen Sie
`openclaw models list --provider opencode-go` aus, um die aktuelle Modellliste anzuzeigen.

Stand des gebündelten Pi-Katalogs: Der Provider enthält:

| Modell-Ref                 | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (3x Limits) |
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Routing-Verhalten">
    OpenClaw übernimmt das Routing pro Modell automatisch, wenn die Modell-Ref
    `opencode-go/...` verwendet. Zusätzliche Provider-Konfiguration ist nicht erforderlich.
  </Accordion>

  <Accordion title="Konvention für Runtime-Refs">
    Runtime-Refs bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für Go.
    Dadurch bleibt das Upstream-Routing pro Modell über beide Kataloge hinweg korrekt.
  </Accordion>

  <Accordion title="Gemeinsam genutzte Anmeldedaten">
    Derselbe `OPENCODE_API_KEY` wird sowohl vom Zen- als auch vom Go-Katalog verwendet. Das Eingeben
    des Schlüssels während des Setups speichert Anmeldedaten für beide Runtime-Provider.
  </Accordion>
</AccordionGroup>

<Tip>
Siehe [OpenCode](/de/providers/opencode) für den gemeinsamen Überblick zum Onboarding und die vollständige
Referenz für den Zen- und Go-Katalog.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/de/providers/opencode" icon="server">
    Gemeinsames Onboarding, Katalogüberblick und erweiterte Hinweise.
  </Card>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
</CardGroup>
