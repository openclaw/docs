---
read_when:
    - Sie möchten Zugriff auf von OpenCode gehostete Modelle
    - Sie möchten zwischen den Katalogen Zen und Go wählen
summary: OpenCode-Zen- und Go-Kataloge mit OpenClaw verwenden
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T15:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode stellt in OpenClaw zwei gehostete Kataloge bereit:

| Katalog | Präfix            | Runtime-Provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Beide Kataloge verwenden denselben OpenCode-API-Schlüssel (`OPENCODE_API_KEY`, Alias
`OPENCODE_ZEN_API_KEY`). OpenClaw hält die Runtime-Provider-IDs getrennt, damit
das vorgelagerte Routing pro Modell korrekt bleibt, behandelt sie beim Onboarding und in der Dokumentation jedoch als
eine gemeinsame OpenCode-Einrichtung.

## Erste Schritte

<Tabs>
  <Tab title="Zen-Katalog">
    **Am besten geeignet für:** den kuratierten OpenCode-Multi-Modell-Proxy (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

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
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go-Katalog">
    **Am besten geeignet für:** die von OpenCode gehostete Auswahl an Kimi-, GLM-, MiniMax-, Qwen- und DeepSeek-Modellen.

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

Führen Sie `openclaw models list --provider opencode` aus, um die vollständige aktuelle Liste anzuzeigen. Diese
enthält auch Einträge der kostenlosen Stufe wie `opencode/big-pickle` und
`opencode/deepseek-v4-flash-free`.

### Go

| Eigenschaft      | Wert                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime-Provider | `opencode-go`                                                            |
| Beispielmodelle  | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Die vollständige Go-Modelltabelle finden Sie unter [OpenCode Go](/de/providers/opencode-go).

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Aliasse für API-Schlüssel">
    `OPENCODE_ZEN_API_KEY` wird ebenfalls als Alias für `OPENCODE_API_KEY` akzeptiert.
  </Accordion>

  <Accordion title="Gemeinsame Anmeldedaten">
    Wenn Sie während der Einrichtung einen OpenCode-Schlüssel eingeben, werden die Anmeldedaten für beide Runtime-
    Provider gespeichert. Sie müssen das Onboarding nicht für jeden Katalog einzeln durchführen.
  </Accordion>

  <Accordion title="API-Schlüssel abrufen">
    Erstellen Sie ein OpenCode-Konto und generieren Sie unter
    [opencode.ai/auth](https://opencode.ai/auth) einen API-Schlüssel. Abrechnung und Katalog-
    verfügbarkeit werden über das OpenCode-Dashboard verwaltet.
  </Accordion>

  <Accordion title="Gemini-Replay-Verhalten">
    Gemini-basierte OpenCode-Referenzen verbleiben auf dem Proxy-Gemini-Pfad, sodass OpenClaw dort
    weiterhin Gemini-Gedankensignaturen bereinigt, ohne die native Gemini-
    Replay-Validierung oder Bootstrap-Neuschreibungen zu aktivieren.
  </Accordion>

  <Accordion title="Replay-Verhalten für Nicht-Gemini-Modelle">
    Nicht auf Gemini basierende OpenCode-Referenzen verwenden weiterhin die minimale OpenAI-kompatible Replay-Richtlinie.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/de/providers/opencode-go" icon="server">
    Vollständige Referenz zum Go-Katalog.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern und Modellreferenzen sowie Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
