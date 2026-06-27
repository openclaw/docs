---
read_when:
    - Sie möchten Fireworks mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Fireworks-API-Schlüssel oder die Standardmodell-ID
    - Sie debuggen das Thinking-off-Verhalten von Kimi auf Fireworks
summary: Fireworks-Einrichtung (Authentifizierung + Modellauswahl)
title: Feuerwerk
x-i18n:
    generated_at: "2026-06-27T18:03:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) stellt Open-Weight-Modelle und geroutete Modelle über eine OpenAI-kompatible API bereit. Installieren Sie das offizielle Fireworks-Provider-Plugin, um zwei vorkatalogisierte Kimi-Modelle und jede Fireworks-Modell- oder Router-ID zur Laufzeit zu verwenden.

| Eigenschaft     | Wert                                                   |
| --------------- | ------------------------------------------------------ |
| Provider-ID     | `fireworks` (Alias: `fireworks-ai`)                    |
| Paket           | `@openclaw/fireworks-provider`                         |
| Auth-Umgebungsvariable | `FIREWORKS_API_KEY`                             |
| Onboarding-Flag | `--auth-choice fireworks-api-key`                      |
| Direktes CLI-Flag | `--fireworks-api-key <key>`                          |
| API             | OpenAI-kompatibel (`openai-completions`)               |
| Basis-URL       | `https://api.fireworks.ai/inference/v1`                |
| Standardmodell  | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Standardalias   | `Kimi K2.5 Turbo`                                      |

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

```bash Nur Env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Das Onboarding speichert den Schlüssel für den `fireworks`-Provider in Ihren Auth-Profilen und legt den **Fire Pass** Kimi K2.5 Turbo Router als Standardmodell fest.

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider fireworks
    ```

    Die Liste sollte `Kimi K2.6` und `Kimi K2.5 Turbo (Fire Pass)` enthalten. Wenn `FIREWORKS_API_KEY` nicht aufgelöst werden kann, meldet `openclaw models status --json` die fehlende Anmeldeinformation unter `auth.unusableProfiles`.

  </Step>
</Steps>

## Nicht interaktive Einrichtung

Für skriptgesteuerte Installationen oder CI-Installationen übergeben Sie alles über die Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Integrierter Katalog

| Modell-Ref                                             | Name                        | Eingabe      | Kontext | Max. Ausgabe | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ------------ | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | Text + Bild  | 262,144 | 262,144      | Erzwungen aus        |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | Text + Bild  | 256,000 | 256,000      | Erzwungen aus (Standard) |

<Note>
  OpenClaw setzt alle Fireworks-Kimi-Modelle fest auf `thinking: off`, weil Fireworks Kimi-Thinking-Parameter in Produktion ablehnt. Wenn Sie dasselbe Modell direkt über [Moonshot](/de/providers/moonshot) routen, bleibt die Kimi-Reasoning-Ausgabe erhalten. Siehe [Thinking-Modi](/de/tools/thinking) zum Wechseln zwischen Providern.
</Note>

## Benutzerdefinierte Fireworks-Modell-IDs

OpenClaw akzeptiert zur Laufzeit jede Fireworks-Modell- oder Router-ID. Verwenden Sie die exakte ID, die Fireworks anzeigt, und stellen Sie ihr `fireworks/` voran. Die dynamische Auflösung klont die Fire-Pass-Vorlage (Text- + Bildeingabe, OpenAI-kompatible API, Standardkosten null) und deaktiviert Thinking automatisch, wenn die ID dem Kimi-Muster entspricht. Dynamische GLM-IDs werden als reine Textmodelle markiert, sofern Sie keinen benutzerdefinierten Modelleintrag mit Bildeingabe konfigurieren.

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
  <Accordion title="So funktioniert das Präfix für Modell-IDs">
    Jede Fireworks-Modell-Ref in OpenClaw beginnt mit `fireworks/`, gefolgt von der exakten ID oder dem Router-Pfad aus der Fireworks-Plattform. Zum Beispiel:

    - Router-Modell: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direktes Modell: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw entfernt das Präfix `fireworks/` beim Erstellen der API-Anfrage und sendet den verbleibenden Pfad als OpenAI-kompatibles Feld `model` an den Fireworks-Endpunkt.

  </Accordion>

  <Accordion title="Warum Thinking für Kimi erzwungen ausgeschaltet ist">
    Fireworks K2.6 gibt einen 400-Fehler zurück, wenn die Anfrage `reasoning_*`-Parameter enthält, obwohl Kimi Thinking über Moonshots eigene API unterstützt. Die Provider-Richtlinie (`extensions/fireworks/thinking-policy.ts`) bewirbt für Kimi-Modell-IDs nur die Thinking-Stufe `off`, damit manuelle `/think`-Wechsel und Provider-Richtlinienoberflächen mit dem Laufzeitvertrag übereinstimmen.

    Um Kimi-Reasoning durchgängig zu verwenden, konfigurieren Sie den [Moonshot-Provider](/de/providers/moonshot) und routen Sie dasselbe Modell darüber.

  </Accordion>

  <Accordion title="Umgebungsverfügbarkeit für den Daemon">
    Wenn der Gateway als verwalteter Dienst ausgeführt wird (launchd, systemd, Docker), muss der Fireworks-Schlüssel für diesen Prozess sichtbar sein — nicht nur für Ihre interaktive Shell.

    <Warning>
      Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, hilft einem launchd- oder systemd-Daemon nicht, sofern diese Umgebung dort nicht ebenfalls importiert wird. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit er vom Gateway-Prozess gelesen werden kann.
    </Warning>

    Unter macOS bindet `openclaw gateway install` `~/.openclaw/.env` bereits in die LaunchAgent-Umgebungsdatei ein. Führen Sie die Installation nach dem Rotieren des Schlüssels erneut aus (oder `openclaw doctor --fix`).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Thinking-Modi" href="/de/tools/thinking" icon="brain">
    `/think`-Stufen, Provider-Richtlinien und das Routing von reasoning-fähigen Modellen.
  </Card>
  <Card title="Moonshot" href="/de/providers/moonshot" icon="moon">
    Führen Sie Kimi mit nativer Thinking-Ausgabe über Moonshots eigene API aus.
  </Card>
  <Card title="Problembehandlung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Problembehandlung und FAQ.
  </Card>
</CardGroup>
