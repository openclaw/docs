---
read_when:
    - Sie möchten Fireworks mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Fireworks-API-Schlüssel oder die Standardmodell-ID
    - Sie debuggen das Thinking-off-Verhalten von Kimi auf Fireworks
summary: Fireworks-Einrichtung (Authentifizierung + Modellauswahl)
title: Feuerwerk
x-i18n:
    generated_at: "2026-05-06T07:00:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) stellt Open-Weight- und geroutete Modelle über eine OpenAI-kompatible API bereit. OpenClaw enthält ein gebündeltes Fireworks-Provider-Plugin, das mit zwei vorkatalogisierten Kimi-Modellen ausgeliefert wird und zur Laufzeit jede Fireworks-Modell- oder Router-ID akzeptiert.

| Eigenschaft       | Wert                                                   |
| ----------------- | ------------------------------------------------------ |
| Provider-ID       | `fireworks` (Alias: `fireworks-ai`)                    |
| Plugin            | gebündelt, `enabledByDefault: true`                    |
| Auth-Env-Var      | `FIREWORKS_API_KEY`                                    |
| Einrichtungs-Flag | `--auth-choice fireworks-api-key`                      |
| Direktes CLI-Flag | `--fireworks-api-key <key>`                            |
| API               | OpenAI-kompatibel (`openai-completions`)               |
| Basis-URL         | `https://api.fireworks.ai/inference/v1`                |
| Standardmodell    | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Standardalias     | `Kimi K2.5 Turbo`                                      |

## Erste Schritte

<Steps>
  <Step title="Fireworks-API-Schlüssel festlegen">
    <CodeGroup>

```bash Einrichtung
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

    Die Einrichtung speichert den Schlüssel für den `fireworks`-Provider in Ihren Auth-Profilen und legt den **Fire Pass**-Router Kimi K2.5 Turbo als Standardmodell fest.

  </Step>
  <Step title="Verfügbarkeit des Modells prüfen">
    ```bash
    openclaw models list --provider fireworks
    ```

    Die Liste sollte `Kimi K2.6` und `Kimi K2.5 Turbo (Fire Pass)` enthalten. Wenn `FIREWORKS_API_KEY` nicht aufgelöst wird, meldet `openclaw models status --json` die fehlenden Zugangsdaten unter `auth.unusableProfiles`.

  </Step>
</Steps>

## Nicht interaktive Einrichtung

Für skriptgesteuerte oder CI-Installationen übergeben Sie alles über die Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Integrierter Katalog

| Modellreferenz                                         | Name                        | Eingabe      | Kontext | Maximale Ausgabe | Denken                         |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------------- | ------------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | Text + Bild  | 262,144 | 262,144          | Erzwungen deaktiviert          |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | Text + Bild  | 256,000 | 256,000          | Erzwungen deaktiviert (Standard) |

<Note>
  OpenClaw setzt alle Fireworks-Kimi-Modelle auf `thinking: off`, weil Fireworks Kimi-Denkparameter in der Produktion ablehnt. Wenn dasselbe Modell direkt über [Moonshot](/de/providers/moonshot) geroutet wird, bleibt die Kimi-Reasoning-Ausgabe erhalten. Informationen zum Wechseln zwischen Providern finden Sie unter [Denkmodi](/de/tools/thinking).
</Note>

## Benutzerdefinierte Fireworks-Modell-IDs

OpenClaw akzeptiert zur Laufzeit jede Fireworks-Modell- oder Router-ID. Verwenden Sie die exakte von Fireworks angezeigte ID und stellen Sie ihr `fireworks/` voran. Die dynamische Auflösung klont die Fire-Pass-Vorlage (Text- und Bildeingabe, OpenAI-kompatible API, Standardkosten null) und deaktiviert das Denken automatisch, wenn die ID dem Kimi-Muster entspricht.

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
  <Accordion title="So funktioniert das Voranstellen des Modell-ID-Präfixes">
    Jede Fireworks-Modellreferenz in OpenClaw beginnt mit `fireworks/`, gefolgt von der exakten ID oder dem Router-Pfad von der Fireworks-Plattform. Beispiel:

    - Router-Modell: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direktes Modell: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw entfernt beim Erstellen der API-Anfrage das Präfix `fireworks/` und sendet den verbleibenden Pfad als OpenAI-kompatibles Feld `model` an den Fireworks-Endpunkt.

  </Accordion>

  <Accordion title="Warum Denken für Kimi erzwungen deaktiviert ist">
    Fireworks K2.6 gibt einen 400-Fehler zurück, wenn die Anfrage `reasoning_*`-Parameter enthält, obwohl Kimi Denken über Moonshots eigene API unterstützt. Die gebündelte Richtlinie (`extensions/fireworks/thinking-policy.ts`) weist für Kimi-Modell-IDs nur die Denklstufe `off` aus, sodass manuelle `/think`-Wechsel und Provider-Richtlinienoberflächen mit dem Laufzeitvertrag abgestimmt bleiben.

    Um Kimi-Reasoning durchgängig zu verwenden, konfigurieren Sie den [Moonshot-Provider](/de/providers/moonshot) und routen Sie dasselbe Modell darüber.

  </Accordion>

  <Accordion title="Umgebungsverfügbarkeit für den Daemon">
    Wenn der Gateway als verwalteter Dienst läuft (launchd, systemd, Docker), muss der Fireworks-Schlüssel für diesen Prozess sichtbar sein, nicht nur für Ihre interaktive Shell.

    <Warning>
      Ein Schlüssel, der nur in `~/.profile` steht, hilft einem launchd- oder systemd-Daemon nicht, es sei denn, diese Umgebung wird auch dort importiert. Legen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit er vom Gateway-Prozess gelesen werden kann.
    </Warning>

    Unter macOS bindet `openclaw gateway install` `~/.openclaw/.env` bereits in die LaunchAgent-Umgebungsdatei ein. Führen Sie die Installation nach dem Rotieren des Schlüssels erneut aus (oder `openclaw doctor --fix`).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    `/think`-Stufen, Provider-Richtlinien und Routing von Reasoning-fähigen Modellen.
  </Card>
  <Card title="Moonshot" href="/de/providers/moonshot" icon="moon">
    Führen Sie Kimi mit nativer Denkausgabe über Moonshots eigene API aus.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
