---
read_when:
    - Sie möchten modellgehosteten Zugriff über OpenCode.
    - Sie möchten zwischen den Zen- und Go-Katalogen wählen.
summary: OpenCode-Zen- und Go-Kataloge mit OpenClaw verwenden
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:55:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode stellt in OpenClaw zwei gehostete Kataloge bereit:

| Katalog | Präfix            | Laufzeitanbieter |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Beide Kataloge verwenden denselben OpenCode-API-Schlüssel. OpenClaw hält die IDs der Laufzeitanbieter getrennt, damit das upstream Routing pro Modell korrekt bleibt, aber Onboarding und Dokumentation behandeln sie als ein gemeinsames OpenCode-Setup.

## Erste Schritte

<Tabs>
  <Tab title="Zen catalog">
    **Am besten geeignet für:** den kuratierten OpenCode-Multimodell-Proxy (Claude, GPT, Gemini).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **Am besten geeignet für:** die von OpenCode gehostete Auswahl von Kimi, GLM und MiniMax.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
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
</Tabs>

## Konfigurationsbeispiel

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Integrierte Kataloge

### Zen

| Eigenschaft       | Wert                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| Laufzeitanbieter  | `opencode`                                                              |
| Beispielmodelle   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Eigenschaft       | Wert                                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| Laufzeitanbieter  | `opencode-go`                                                            |
| Beispielmodelle   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` wird ebenfalls als Alias für `OPENCODE_API_KEY` unterstützt.
  </Accordion>

  <Accordion title="Shared credentials">
    Wenn Sie während der Einrichtung einen OpenCode-Schlüssel eingeben, werden Anmeldedaten für beide Laufzeitanbieter gespeichert. Sie müssen nicht jeden Katalog separat onboarden.
  </Accordion>

  <Accordion title="Billing and dashboard">
    Sie melden sich bei OpenCode an, hinterlegen Abrechnungsdaten und kopieren Ihren API-Schlüssel. Abrechnung und Katalogverfügbarkeit werden über das OpenCode-Dashboard verwaltet.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Von Gemini unterstützte OpenCode-Referenzen bleiben auf dem Proxy-Gemini-Pfad, daher behält OpenClaw dort die Bereinigung von Gemini-Thought-Signaturen bei, ohne die native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    OpenCode-Referenzen ohne Gemini behalten die minimale OpenAI-kompatible Replay-Richtlinie bei.
  </Accordion>
</AccordionGroup>

<Tip>
Wenn Sie während der Einrichtung einen OpenCode-Schlüssel eingeben, werden Anmeldedaten für beide Laufzeitanbieter Zen und Go gespeichert, sodass Sie das Onboarding nur einmal durchführen müssen.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Anbietern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Anbieter.
  </Card>
</CardGroup>
