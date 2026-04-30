---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden
    - Sie benötigen die API-Schlüssel-Umgebungsvariable oder die CLI-Authentifizierungsoption
summary: DeepSeek-Einrichtung (Authentifizierung + Modellauswahl)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T07:10:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) bietet leistungsstarke KI-Modelle mit einer OpenAI-kompatiblen API.

| Eigenschaft | Wert                       |
| ----------- | -------------------------- |
| Provider    | `deepseek`                 |
| Auth        | `DEEPSEEK_API_KEY`         |
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

    Dadurch werden Sie zur Eingabe Ihres API-Schlüssels aufgefordert und `deepseek/deepseek-v4-flash` als Standardmodell festgelegt.

  </Step>
  <Step title="Prüfen, ob Modelle verfügbar sind">
    ```bash
    openclaw models list --provider deepseek
    ```

    Um den gebündelten statischen Katalog zu prüfen, ohne einen laufenden Gateway zu benötigen,
    verwenden Sie:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Nichtinteraktive Einrichtung">
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
Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `DEEPSEEK_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
</Warning>

## Integrierter Katalog

| Modellreferenz              | Name              | Eingabe | Kontext  | Maximale Ausgabe | Hinweise                                     |
| ---------------------------- | ----------------- | ------- | -------- | ---------------- | -------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000          | Standardmodell; V4-Oberfläche mit Thinking-Funktion |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000          | V4-Oberfläche mit Thinking-Funktion          |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072  | 8,192            | DeepSeek V3.2-Oberfläche ohne Thinking       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072  | 65,536           | V3.2-Oberfläche mit Reasoning                |

<Tip>
V4-Modelle unterstützen DeepSeeks `thinking`-Steuerung. OpenClaw spielt außerdem
DeepSeek-`reasoning_content` in Folgeturns erneut ein, sodass Thinking-Sitzungen mit Tool-
Aufrufen fortgesetzt werden können.
</Tip>

## Thinking und Tools

DeepSeek-V4-Thinking-Sitzungen haben einen strengeren Replay-Vertrag als die meisten
OpenAI-kompatiblen Provider: Nachdem ein Turn mit aktiviertem Thinking Tools verwendet hat, erwartet DeepSeek,
dass erneut eingespielte Assistant-Nachrichten aus diesem Turn bei Folgeanfragen
`reasoning_content` enthalten. OpenClaw behandelt dies innerhalb des
DeepSeek-Plugins, sodass normale Tool-Nutzung über mehrere Turns hinweg mit
`deepseek/deepseek-v4-flash` und `deepseek/deepseek-v4-pro` funktioniert.

Wenn Sie eine vorhandene Sitzung von einem anderen OpenAI-kompatiblen Provider auf ein
DeepSeek-V4-Modell umstellen, haben ältere Assistant-Tool-Call-Turns möglicherweise kein natives
DeepSeek-`reasoning_content`. OpenClaw ergänzt dieses fehlende Feld beim erneuten Einspielen von
Assistant-Nachrichten für DeepSeek-V4-Thinking-Anfragen, sodass der Provider
den Verlauf akzeptieren kann, ohne `/new` zu erfordern.

Wenn Thinking in OpenClaw deaktiviert ist (einschließlich der UI-Auswahl **None**),
sendet OpenClaw an DeepSeek `thinking: { type: "disabled" }` und entfernt erneut eingespieltes
`reasoning_content` aus dem ausgehenden Verlauf. Dadurch bleiben Sitzungen mit deaktiviertem Thinking
auf dem DeepSeek-Pfad ohne Thinking.

Verwenden Sie `deepseek/deepseek-v4-flash` für den standardmäßigen schnellen Pfad. Verwenden Sie
`deepseek/deepseek-v4-pro`, wenn Sie das stärkere V4-Modell möchten und
höhere Kosten oder Latenz akzeptieren können.

## Live-Tests

Die direkte Live-Modellsuite umfasst DeepSeek V4 im modernen Modellsatz. Um
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
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
