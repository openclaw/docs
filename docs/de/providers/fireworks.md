---
read_when:
    - Du möchtest Fireworks mit OpenClaw verwenden
    - Du benötigst die Umgebungsvariable für den Fireworks-API-Schlüssel oder die Standard-Modell-ID
summary: Fireworks-Einrichtung (Authentifizierung + Modellauswahl)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) stellt Open-Weight- und geroutete Modelle über eine OpenAI-kompatible API bereit. OpenClaw enthält ein gebündeltes Fireworks-Provider-Plugin.

| Eigenschaft   | Wert                                                   |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI-kompatibler Chat/Completions                    |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Standardmodell | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Erste Schritte

<Steps>
  <Step title="Fireworks-Authentifizierung über das Onboarding einrichten">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Dadurch wird dein Fireworks-Schlüssel in der OpenClaw-Konfiguration gespeichert und das Fire-Pass-Startermodell als Standard gesetzt.

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

Für skriptgesteuerte oder CI-Setups übergib alle Werte in der Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Integrierter Katalog

| Modell-Ref                                             | Name                        | Eingabe    | Kontext | Max. Ausgabe | Hinweise                                                                                                                                            |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144      | Neuestes Kimi-Modell auf Fireworks. Thinking ist für Fireworks-K2.6-Anfragen deaktiviert; route stattdessen direkt über Moonshot, wenn du Kimi-Thinking-Ausgabe brauchst. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000      | Standardmäßig gebündeltes Startermodell auf Fireworks                                                                                                |

<Tip>
Wenn Fireworks ein neueres Modell veröffentlicht, etwa ein frisches Qwen- oder Gemma-Release, kannst du direkt darauf umstellen, indem du seine Fireworks-Modell-ID verwendest, ohne auf ein Update des gebündelten Katalogs warten zu müssen.
</Tip>

## Benutzerdefinierte Fireworks-Modell-IDs

OpenClaw akzeptiert auch dynamische Fireworks-Modell-IDs. Verwende die exakte Modell- oder Router-ID, die Fireworks anzeigt, und stelle `fireworks/` voran.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="So funktioniert das Präfix für Modell-IDs">
    Jede Fireworks-Modell-Ref in OpenClaw beginnt mit `fireworks/`, gefolgt von der exakten ID oder dem Router-Pfad von der Fireworks-Plattform. Zum Beispiel:

    - Router-Modell: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direktes Modell: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw entfernt das Präfix `fireworks/` beim Erstellen der API-Anfrage und sendet den verbleibenden Pfad an den Fireworks-Endpunkt.

  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway außerhalb deiner interaktiven Shell läuft, stelle sicher, dass `FIREWORKS_API_KEY` auch für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` liegt, hilft einem `launchd`-/`systemd`-Daemon nicht, wenn diese Umgebung dort nicht ebenfalls importiert wird. Setze den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
