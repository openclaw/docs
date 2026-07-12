---
read_when:
    - Sie möchten Fireworks mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Fireworks-API-Schlüssel oder die Standardmodell-ID
    - Sie debuggen das Verhalten von Kimi bei deaktiviertem Denkmodus auf Fireworks
summary: Fireworks-Einrichtung (Authentifizierung + Modellauswahl)
title: Fireworks
x-i18n:
    generated_at: "2026-07-12T02:04:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) stellt Modelle mit offenen Gewichten und geroutete Modelle über eine OpenAI-kompatible API bereit. Installieren Sie das offizielle Fireworks-Provider-Plugin, um zwei vorkatalogisierte Kimi-Modelle sowie beliebige Fireworks-Modell- oder Router-IDs zur Laufzeit zu verwenden.

| Eigenschaft            | Wert                                                   |
| ---------------------- | ------------------------------------------------------ |
| Provider-ID            | `fireworks` (Alias: `fireworks-ai`)                    |
| Paket                  | `@openclaw/fireworks-provider`                         |
| Umgebungsvariable zur Authentifizierung | `FIREWORKS_API_KEY`                    |
| Onboarding-Flag        | `--auth-choice fireworks-api-key`                      |
| Direktes CLI-Flag      | `--fireworks-api-key <key>`                            |
| API                    | OpenAI-kompatibel (`openai-completions`)               |
| Basis-URL              | `https://api.fireworks.ai/inference/v1`                |
| Standardmodell         | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Standardalias          | `Kimi K2.5 Turbo`                                      |

## Erste Schritte

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Fireworks-API-Schlüssel festlegen">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direktes Flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Nur Umgebungsvariable
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Das Onboarding speichert den Schlüssel für den Provider `fireworks` in Ihren Authentifizierungsprofilen und legt den Kimi-K2.5-Turbo-Router **Fire Pass** als Standardmodell fest.

  </Step>
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider fireworks
    ```

    Die Liste sollte `Kimi K2.6` und `Kimi K2.5 Turbo (Fire Pass)` enthalten. Wenn `FIREWORKS_API_KEY` nicht aufgelöst werden kann, meldet `openclaw models status --json` die fehlenden Anmeldedaten unter `auth.unusableProfiles`.

  </Step>
</Steps>

## Nicht interaktive Einrichtung

Übergeben Sie bei skriptgesteuerten oder CI-Installationen alle Angaben über die Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Integrierter Katalog

| Modellreferenz                                         | Name                        | Eingabe      | Kontext | Maximale Ausgabe | Denkmodus                  |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------------- | -------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | Text + Bild  | 262,144 | 262,144          | Erzwungen deaktiviert      |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | Text + Bild  | 256,000 | 256,000          | Erzwungen deaktiviert (Standard) |

<Note>
  OpenClaw setzt alle Fireworks-Kimi-Modelle fest auf `thinking: off`, da Kimi bei Fireworks Gedankengänge in der sichtbaren Antwort offenlegen kann, sofern die Anfrage den Denkmodus nicht ausdrücklich deaktiviert. Wenn dasselbe Modell direkt über [Moonshot](/de/providers/moonshot) geroutet wird, bleibt die Reasoning-Ausgabe von Kimi erhalten. Informationen zum Wechsel zwischen Providern finden Sie unter [Denkmodi](/de/tools/thinking).
</Note>

## Benutzerdefinierte Fireworks-Modell-IDs

OpenClaw akzeptiert zur Laufzeit beliebige Fireworks-Modell- oder Router-IDs. Verwenden Sie die von Fireworks angezeigte exakte ID und stellen Sie ihr `fireworks/` voran. Die dynamische Auflösung kopiert die Fire-Pass-Vorlage (Text- und Bildeingabe, OpenAI-kompatible API, standardmäßig keine Kosten) und deaktiviert den Denkmodus automatisch, wenn die ID dem Kimi-Muster entspricht. Dynamische GLM-IDs werden als reine Textmodelle gekennzeichnet, sofern Sie keinen benutzerdefinierten Modelleintrag mit Bildeingabe konfigurieren.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Funktionsweise des Modell-ID-Präfixes">
    Jede Fireworks-Modellreferenz in OpenClaw beginnt mit `fireworks/`, gefolgt von der exakten ID oder dem Router-Pfad der Fireworks-Plattform. Beispiele:

    - Router-Modell: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direktes Modell: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw entfernt beim Erstellen der API-Anfrage das Präfix `fireworks/` und sendet den verbleibenden Pfad als OpenAI-kompatibles Feld `model` an den Fireworks-Endpunkt.

  </Accordion>

  <Accordion title="Warum der Denkmodus für Kimi erzwungen deaktiviert wird">
    Fireworks stellt Kimi ohne separaten Reasoning-Kanal bereit, sodass Gedankengänge im sichtbaren `content`-Stream erscheinen können. Bei jeder Fireworks-Kimi-Anfrage sendet OpenClaw `thinking: { type: "disabled" }` und entfernt `reasoning`, `reasoning_effort` sowie `reasoningEffort` aus der Nutzlast (`extensions/fireworks/stream.ts`). Die Provider-Richtlinie (`extensions/fireworks/thinking-policy.ts`) gibt für Kimi-Modell-IDs ausschließlich die Denkstufe `off` an. Dadurch bleiben manuelle `/think`-Wechsel und die Oberflächen für Provider-Richtlinien mit dem Laufzeitvertrag abgestimmt.

    Um Kimi-Reasoning durchgängig zu verwenden, konfigurieren Sie den [Moonshot-Provider](/de/providers/moonshot) und routen Sie dasselbe Modell darüber.

  </Accordion>

  <Accordion title="Verfügbarkeit der Umgebung für den Daemon">
    Wenn der Gateway als verwalteter Dienst ausgeführt wird (launchd, systemd, Docker), muss der Fireworks-Schlüssel für diesen Prozess sichtbar sein – nicht nur für Ihre interaktive Shell.

    <Warning>
      Ein ausschließlich in einer interaktiven Shell exportierter Schlüssel steht einem launchd- oder systemd-Daemon nicht zur Verfügung, sofern die Umgebung nicht auch dort importiert wird. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit der Gateway-Prozess darauf zugreifen kann.
    </Warning>

    OpenClaw lädt `~/.openclaw/.env` beim Laden der Konfiguration. Daher erreichen dort gespeicherte Schlüssel verwaltete Gateway-Dienste auf jeder Plattform. Starten Sie den Gateway nach dem Austausch des Schlüssels neu oder führen Sie `openclaw doctor --fix` erneut aus.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    `/think`-Stufen, Provider-Richtlinien und das Routing Reasoning-fähiger Modelle.
  </Card>
  <Card title="Moonshot" href="/de/providers/moonshot" icon="moon">
    Führen Sie Kimi mit nativer Denkmodus-Ausgabe über die eigene API von Moonshot aus.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und häufig gestellte Fragen.
  </Card>
</CardGroup>
