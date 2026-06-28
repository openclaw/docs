---
read_when:
    - Sie möchten Zugriff auf von OpenCode gehostete Modelle
    - Sie möchten zwischen den Zen- und Go-Katalogen wählen
summary: OpenCode-Zen- und Go-Kataloge mit OpenClaw verwenden
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:44:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode stellt zwei gehostete Kataloge in OpenClaw bereit:

| Katalog | Präfix            | Runtime-Provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Beide Kataloge verwenden denselben OpenCode-API-Schlüssel. OpenClaw hält die Runtime-Provider-IDs
getrennt, damit das upstreamseitige Routing pro Modell korrekt bleibt, behandelt sie beim Onboarding und in der Dokumentation
aber als eine OpenCode-Einrichtung.

## Erste Schritte

<Tabs>
  <Tab title="Zen-Katalog">
    **Am besten geeignet für:** den kuratierten OpenCode-Multi-Modell-Proxy (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Ein Zen-Modell als Standard festlegen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go-Katalog">
    **Am besten geeignet für:** die von OpenCode gehostete Kimi-, GLM- und MiniMax-Modellreihe.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

| Eigenschaft      | Wert                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Runtime-Provider | `opencode`                                                                                    |
| Beispielmodelle  | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Eigenschaft      | Wert                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime-Provider | `opencode-go`                                                            |
| Beispielmodelle  | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="API-Schlüssel-Aliasse">
    `OPENCODE_ZEN_API_KEY` wird auch als Alias für `OPENCODE_API_KEY` unterstützt.
  </Accordion>

  <Accordion title="Gemeinsame Zugangsdaten">
    Wenn Sie während der Einrichtung einen OpenCode-Schlüssel eingeben, werden Zugangsdaten für beide Runtime-
    Provider gespeichert. Sie müssen die Kataloge nicht separat onboarden.
  </Accordion>

  <Accordion title="Abrechnung und Dashboard">
    Sie melden sich bei OpenCode an, fügen Abrechnungsdaten hinzu und kopieren Ihren API-Schlüssel. Abrechnung
    und Katalogverfügbarkeit werden über das OpenCode-Dashboard verwaltet.
  </Accordion>

  <Accordion title="Gemini-Replay-Verhalten">
    Gemini-gestützte OpenCode-Refs bleiben auf dem Proxy-Gemini-Pfad, sodass OpenClaw dort
    die Bereinigung der Gemini-Thought-Signature beibehält, ohne native Gemini-
    Replay-Validierung oder Bootstrap-Rewrites zu aktivieren.
  </Accordion>

  <Accordion title="Nicht-Gemini-Replay-Verhalten">
    Nicht-Gemini-OpenCode-Refs behalten die minimale OpenAI-kompatible Replay-Richtlinie bei.
  </Accordion>
</AccordionGroup>

<Tip>
Wenn Sie während der Einrichtung einen OpenCode-Schlüssel eingeben, werden Zugangsdaten für die Zen- und
Go-Runtime-Provider gespeichert, sodass Sie das Onboarding nur einmal ausführen müssen.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
