---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die CLI-Authentifizierungsauswahl
summary: DeepSeek-Einrichtung (Authentifizierung + Modellauswahl)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:03:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) stellt leistungsstarke KI-Modelle mit einer OpenAI-kompatiblen API bereit.

| Eigenschaft | Wert                       |
| ----------- | -------------------------- |
| Provider    | `deepseek`                 |
| Auth        | `DEEPSEEK_API_KEY`         |
| API         | OpenAI-kompatibel          |
| Basis-URL   | `https://api.deepseek.com` |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie dann den Gateway neu:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="Get your API key">
    Erstellen Sie einen API-Schlüssel unter [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Dadurch werden Sie zur Eingabe Ihres API-Schlüssels aufgefordert, und `deepseek/deepseek-v4-flash` wird als Standardmodell festgelegt.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Um den statischen Katalog des Plugins zu prüfen, ohne dass ein laufender Gateway erforderlich ist,
    verwenden Sie:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Für skriptgesteuerte oder headless Installationen übergeben Sie alle Flags direkt:

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
Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `DEEPSEEK_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
</Warning>

## Integrierter Katalog

| Modell-Ref                   | Name              | Eingabe | Kontext  | Maximale Ausgabe | Hinweise                                       |
| ---------------------------- | ----------------- | ------- | -------- | ---------------- | ---------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | Text    | 1,000,000 | 384,000          | Standardmodell; V4-Oberfläche mit Thinking-Unterstützung |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | Text    | 1,000,000 | 384,000          | V4-Oberfläche mit Thinking-Unterstützung       |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | Text    | 131,072  | 8,192            | DeepSeek V3.2-Oberfläche ohne Thinking         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | Text    | 131,072  | 65,536           | V3.2-Oberfläche mit Reasoning-Unterstützung    |

<Tip>
V4-Modelle unterstützen die `thinking`-Steuerung von DeepSeek. OpenClaw spielt außerdem
DeepSeek-`reasoning_content` in Folgeturns erneut ein, damit Thinking-Sitzungen mit Tool-
Aufrufen fortgesetzt werden können.
Verwenden Sie `/think xhigh` oder `/think max` mit DeepSeek-V4-Modellen, um DeepSeeks
maximales `reasoning_effort` anzufordern.
</Tip>

## Thinking und Tools

DeepSeek-V4-Thinking-Sitzungen haben einen strengeren Replay-Vertrag als die meisten
OpenAI-kompatiblen Provider: Nachdem ein Turn mit aktiviertem Thinking Tools verwendet hat, erwartet DeepSeek,
dass erneut eingespielte Assistant-Nachrichten aus diesem Turn bei Folgeanfragen
`reasoning_content` enthalten. OpenClaw verarbeitet dies innerhalb des
DeepSeek-Plugins, sodass normale Tool-Nutzung über mehrere Turns hinweg mit
`deepseek/deepseek-v4-flash` und `deepseek/deepseek-v4-pro` funktioniert.

Wenn Sie eine bestehende Sitzung von einem anderen OpenAI-kompatiblen Provider auf ein
DeepSeek-V4-Modell umstellen, haben ältere Assistant-Turns mit Tool-Aufrufen möglicherweise kein natives
DeepSeek-`reasoning_content`. OpenClaw ergänzt dieses fehlende Feld in erneut eingespielten
Assistant-Nachrichten für DeepSeek-V4-Thinking-Anfragen, damit der Provider
den Verlauf akzeptieren kann, ohne `/new` zu erfordern.

Wenn Thinking in OpenClaw deaktiviert ist (einschließlich der UI-Auswahl **None**),
sendet OpenClaw DeepSeek `thinking: { type: "disabled" }` und entfernt erneut eingespieltes
`reasoning_content` aus dem ausgehenden Verlauf. Dadurch bleiben Sitzungen mit deaktiviertem Thinking
auf dem DeepSeek-Pfad ohne Thinking.

Verwenden Sie `deepseek/deepseek-v4-flash` für den standardmäßigen schnellen Pfad. Verwenden Sie
`deepseek/deepseek-v4-pro`, wenn Sie das stärkere V4-Modell möchten und
höhere Kosten oder Latenz akzeptieren können.

## Live-Tests

Die direkte Live-Modellsuite enthält DeepSeek V4 im modernen Modellset. Um
nur die direkten Modellprüfungen für DeepSeek V4 auszuführen:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Diese Live-Prüfung verifiziert, dass beide V4-Modelle abschließen können und dass Thinking-/Tool-
Folgeturns die von DeepSeek benötigte Replay-Nutzlast beibehalten.

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

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
