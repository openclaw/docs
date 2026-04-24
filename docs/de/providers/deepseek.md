---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden.
    - Sie benötigen die API-Schlüssel-Umgebungsvariable oder die CLI-Authentifizierungsoption.
summary: DeepSeek-Einrichtung (Authentifizierung + Modellauswahl)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) bietet leistungsstarke KI-Modelle mit einer OpenAI-kompatiblen API.

| Eigenschaft | Wert                       |
| ----------- | -------------------------- |
| Anbieter    | `deepseek`                 |
| Authentifizierung | `DEEPSEEK_API_KEY`   |
| API         | OpenAI-kompatibel          |
| Basis-URL   | `https://api.deepseek.com` |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Sie werden dann zur Eingabe Ihres API-Schlüssels aufgefordert, und `deepseek/deepseek-v4-flash` wird als Standardmodell festgelegt.

  </Step>
  <Step title="Prüfen, ob Modelle verfügbar sind">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Nicht-interaktive Einrichtung">
    Übergeben Sie bei skriptgesteuerten oder Headless-Installationen alle Flags direkt:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `DEEPSEEK_API_KEY`
diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
</Warning>

## Integrierter Katalog

| Modell-Ref                   | Name              | Eingabe | Kontext   | Maximale Ausgabe | Hinweise                                   |
| ---------------------------- | ----------------- | ------- | --------- | ---------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000          | Standardmodell; V4-Oberfläche mit Denkfähigkeit |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000          | V4-Oberfläche mit Denkfähigkeit            |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192            | Nicht-denkende Oberfläche von DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536           | Oberfläche von V3.2 mit Schlussfolgerungsfunktion |

<Tip>
V4-Modelle unterstützen die `thinking`-Steuerung von DeepSeek. OpenClaw gibt außerdem
DeepSeek-`reasoning_content` in Folgerunden erneut wieder, sodass Denk-Sitzungen mit Tool-Aufrufen
fortgesetzt werden können.
</Tip>

## Konfigurationsbeispiel

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Anbietern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Anbieter.
  </Card>
</CardGroup>
