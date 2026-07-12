---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die Authentifizierungsauswahl der CLI
summary: DeepSeek-Einrichtung (Authentifizierung + Modellauswahl)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T15:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
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

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie unter [platform.deepseek.com](https://platform.deepseek.com/api_keys) einen API-Schlüssel.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Fragt Ihren API-Schlüssel ab und legt `deepseek/deepseek-v4-flash` als Standardmodell fest.

  </Step>
  <Step title="Verfügbarkeit der Modelle überprüfen">
    ```bash
    openclaw models list --provider deepseek
    ```

    So prüfen Sie den statischen Katalog des Plugins ohne laufenden Gateway:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Nicht interaktive Einrichtung">
    Übergeben Sie für skriptgesteuerte oder monitorlose Installationen alle Flags direkt:

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
Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass
`DEEPSEEK_API_KEY` für diesen Prozess verfügbar ist (beispielsweise in
`~/.openclaw/.env` oder über `env.shellEnv`).
</Warning>

## Integrierter Katalog

| Modellreferenz               | Name              | Eingabe | Kontext   | Maximale Ausgabe | Hinweise                                                 |
| ---------------------------- | ----------------- | ------- | --------- | ---------------- | -------------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | Text    | 1,000,000 | 384,000          | Standardmodell; V4-Oberfläche mit Denkfunktion           |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | Text    | 1,000,000 | 384,000          | V4-Oberfläche mit Denkfunktion                           |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | Text    | 1,000,000 | 384,000          | Veralteter Kompatibilitätsname für V4 Flash ohne Denken  |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | Text    | 1,000,000 | 384,000          | Veralteter Kompatibilitätsname für V4 Flash mit Denken   |

<Warning>
DeepSeek wird `deepseek-chat` und `deepseek-reasoner` am 24. Juli 2026
um 15:59 UTC außer Betrieb nehmen. Sie werden derzeit im Modus ohne Denken
beziehungsweise im Denkmodus an DeepSeek V4 Flash weitergeleitet. Stellen Sie konfigurierte Modellreferenzen
vor diesem Zeitpunkt auf `deepseek/deepseek-v4-flash` oder `deepseek/deepseek-v4-pro` um.
</Warning>

Die lokalen Kostenschätzungen von OpenClaw basieren auf den von DeepSeek veröffentlichten
Tarifen für Cache-Treffer, Cache-Fehlschläge und Ausgaben. DeepSeek kann diese Tarife ändern; die Seite
[Modelle und Preise](https://api-docs.deepseek.com/quick_start/pricing/) ist
für die Abrechnung maßgeblich.

<Tip>
V4-Modelle unterstützen die `thinking`-Steuerung von DeepSeek. OpenClaw gibt außerdem
DeepSeek-`reasoning_content` bei nachfolgenden Durchläufen erneut wieder, sodass Denksitzungen mit
Tool-Aufrufen fortgesetzt werden können.
Verwenden Sie `/think xhigh` oder `/think max` mit DeepSeek-V4-Modellen, um den maximalen
`reasoning_effort` von DeepSeek anzufordern; beide werden auf `"max"` abgebildet.
</Tip>

## Denken und Tools

Bei DeepSeek-V4-Denksitzungen müssen wiedergegebene Assistentennachrichten aus einem
Durchlauf mit aktivierter Denkfunktion in nachfolgenden Anfragen `reasoning_content` enthalten.
Das DeepSeek-Plugin von OpenClaw ergänzt dieses Feld automatisch, sodass die normale
Tool-Nutzung über mehrere Durchläufe mit `deepseek/deepseek-v4-flash` und
`deepseek/deepseek-v4-pro` funktioniert, selbst wenn der Verlauf von einem anderen
OpenAI-kompatiblen Provider (ohne natives `reasoning_content`) oder aus einer einfachen
Assistentennachricht stammt. Nach einem Provider-Wechsel während einer Sitzung ist kein `/new` erforderlich.

Wenn die Denkfunktion deaktiviert ist (einschließlich der UI-Auswahl **None**), sendet OpenClaw
`thinking: { type: "disabled" }` und entfernt wiedergegebenes `reasoning_content`
aus dem ausgehenden Verlauf, sodass die Sitzung auf dem DeepSeek-Pfad ohne Denken bleibt.

Verwenden Sie `deepseek/deepseek-v4-flash` als standardmäßigen schnellen Pfad. Verwenden Sie
`deepseek/deepseek-v4-pro` für das leistungsstärkere Modell, wenn Sie höhere
Kosten oder Latenzen akzeptieren können.

## Live-Tests

So führen Sie ausschließlich die direkten DeepSeek-V4-Modellprüfungen aus der modernen Live-Modelltestsuite aus:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Überprüft, ob beide V4-Modelle erfolgreich abschließen und ob nachfolgende Durchläufe mit Denkfunktion und Tools
die von DeepSeek benötigte Wiedergabe-Nutzlast beibehalten.

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
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
