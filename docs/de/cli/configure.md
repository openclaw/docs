---
read_when:
    - Sie möchten Anmeldedaten, Geräte oder Agent-Standardwerte interaktiv anpassen.
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: konfigurieren
x-i18n:
    generated_at: "2026-04-23T06:26:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktive Abfrage zum Einrichten von Anmeldedaten, Geräten und Agent-Standardwerten.

Hinweis: Der Abschnitt **Model** enthält jetzt eine Mehrfachauswahl für die
Zulassungsliste `agents.defaults.models` (was in `/model` und im Modell-Auswahlfeld angezeigt wird).
Providerspezifische Einrichtungsoptionen führen ihre ausgewählten Modelle mit der vorhandenen
Zulassungsliste zusammen, anstatt nicht zusammenhängende Provider zu ersetzen, die bereits in der Konfiguration vorhanden sind.

Wenn configure über eine Provider-Authentifizierungsauswahl gestartet wird, werden für die Standardmodell- und
Zulassungslisten-Auswahlfelder automatisch Modelle dieses Providers bevorzugt. Bei gekoppelten Providern wie
Volcengine/BytePlus gilt dieselbe Bevorzugung auch für ihre coding-plan-
Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Wenn der bevorzugte-Provider-
Filter zu einer leeren Liste führen würde, greift configure auf den ungefilterten
Katalog zurück, anstatt ein leeres Auswahlfeld anzuzeigen.

Tipp: `openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie
`openclaw config get|set|unset` für nicht interaktive Änderungen.

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider
auswählen und dessen Anmeldedaten konfigurieren. Einige Provider zeigen außerdem providerspezifische
Folgeabfragen an:

- **Grok** kann ein optionales `x_search`-Setup mit demselben `XAI_API_KEY` anbieten und
  Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region fragen (`api.moonshot.ai` vs
  `api.moonshot.cn`) und nach dem Standard-Kimi-Websuchmodell.

Verwandt:

- Gateway-Konfigurationsreferenz: [Konfiguration](/de/gateway/configuration)
- Config-CLI: [Config](/de/cli/config)

## Optionen

- `--section <section>`: wiederholbarer Abschnittsfilter

Verfügbare Abschnitte:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Hinweise:

- Die Auswahl, wo das Gateway ausgeführt wird, aktualisiert immer `gateway.mode`. Sie können „Weiter“ ohne andere Abschnitte auswählen, wenn Sie nur das benötigen.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Kanal-/Raum-Zulassungslisten. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Installationsschritt für den Daemon ausführen, erfordert die Token-Authentifizierung ein Token, und `gateway.auth.token` wird über SecretRef verwaltet; configure validiert den SecretRef, speichert jedoch keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert configure die Daemon-Installation mit umsetzbaren Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert configure die Daemon-Installation, bis der Modus explizit gesetzt wird.

## Beispiele

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
