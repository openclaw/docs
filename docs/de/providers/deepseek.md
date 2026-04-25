---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden.
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die Auswahl der CLI-Authentifizierung.
summary: DeepSeek-Einrichtung (Authentifizierung + Modellauswahl)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) bietet leistungsstarke KI-Modelle mit einer OpenAI-kompatiblen API.

| Property | Wert                       |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| Auth     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI-kompatibel          |
| Base URL | `https://api.deepseek.com` |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Sie werden dann nach Ihrem API-Schlüssel gefragt, und `deepseek/deepseek-v4-flash` wird als Standardmodell festgelegt.

  </Step>
  <Step title="Prüfen, ob Modelle verfügbar sind">
    ```bash
    openclaw models list --provider deepseek
    ```

    Um den gebündelten statischen Katalog zu prüfen, ohne ein laufendes Gateway zu benötigen,
    verwenden Sie:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Nicht-interaktive Einrichtung">
    Für skriptgesteuerte oder Headless-Installationen übergeben Sie alle Flags direkt:

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
Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `DEEPSEEK_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
</Warning>

## Integrierter Katalog

| Model ref                    | Name              | Input | Kontext   | Maximale Ausgabe | Hinweise                                   |
| ---------------------------- | ----------------- | ----- | --------- | ---------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000          | Standardmodell; V4-Oberfläche mit Thinking-Unterstützung |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000          | V4-Oberfläche mit Thinking-Unterstützung   |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192            | Nicht-Thinking-Oberfläche von DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536           | Oberfläche von V3.2 mit Reasoning-Unterstützung |

<Tip>
V4-Modelle unterstützen DeepSeeks Steuerung `thinking`. OpenClaw spielt außerdem
DeepSeek-`reasoning_content` in Folgerunden erneut ab, sodass Thinking-Sitzungen mit Tool-Aufrufen
fortgesetzt werden können.
</Tip>

## Thinking und Tools

DeepSeek-V4-Thinking-Sitzungen haben einen strengeren Replay-Vertrag als die meisten
OpenAI-kompatiblen Anbieter: Wenn eine Thinking-aktivierte Assistant-Nachricht Tool-Aufrufe enthält,
erwartet DeepSeek, dass das vorherige Assistant-`reasoning_content` bei der Folgeanfrage
erneut mitgesendet wird. OpenClaw übernimmt dies innerhalb des DeepSeek-Plugins,
sodass die normale Multi-Turn-Tool-Nutzung mit `deepseek/deepseek-v4-flash` und
`deepseek/deepseek-v4-pro` funktioniert.

Wenn Sie eine bestehende Sitzung von einem anderen OpenAI-kompatiblen Anbieter auf ein
DeepSeek-V4-Modell umstellen, enthalten ältere Assistant-Runden mit Tool-Aufrufen möglicherweise kein natives
DeepSeek-`reasoning_content`. OpenClaw ergänzt dieses fehlende Feld für DeepSeek-V4-
Thinking-Anfragen, sodass der Anbieter den erneut abgespielten Verlauf der Tool-Aufrufe
ohne `/new` akzeptieren kann.

Wenn Thinking in OpenClaw deaktiviert ist (einschließlich der UI-Auswahl **None**),
sendet OpenClaw DeepSeek `thinking: { type: "disabled" }` und entfernt erneut abgespieltes
`reasoning_content` aus dem ausgehenden Verlauf. Dadurch bleiben Sitzungen mit deaktiviertem Thinking
auf dem Nicht-Thinking-Pfad von DeepSeek.

Verwenden Sie `deepseek/deepseek-v4-flash` als schnellen Standardpfad. Verwenden Sie
`deepseek/deepseek-v4-pro`, wenn Sie das stärkere V4-Modell möchten und höhere Kosten
oder Latenz akzeptieren können.

## Live-Tests

Die direkte Live-Modellsuite enthält DeepSeek V4 im modernen Modellsatz. Um
nur die direkten Modellprüfungen für DeepSeek V4 auszuführen:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Dieser Live-Check prüft, dass beide V4-Modelle abgeschlossen werden können und dass Thinking-/Tool-
Folgerunden die Replay-Nutzlast beibehalten, die DeepSeek verlangt.

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
    Anbieter, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Anbieter.
  </Card>
</CardGroup>
