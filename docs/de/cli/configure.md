---
read_when:
    - Sie möchten Zugangsdaten, Geräte oder Agentenstandards interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-04-25T13:43:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktive Eingabeaufforderung zum Einrichten von Zugangsdaten, Geräten und Agentenstandards.

Hinweis: Der Abschnitt **Model** enthält jetzt eine Mehrfachauswahl für die Allowlist `agents.defaults.models` (was in `/model` und im Modellpicker angezeigt wird).
Providerbezogene Einrichtungsoptionen führen ihre ausgewählten Modelle mit der bestehenden Allowlist zusammen, anstatt nicht zusammenhängende Provider in der Konfiguration zu ersetzen.
Wenn Sie die Provider-Authentifizierung erneut über configure ausführen, bleibt ein vorhandenes `agents.defaults.model.primary` erhalten; verwenden Sie `openclaw models auth login --provider <id> --set-default`
oder `openclaw models set <model>`, wenn Sie das Standardmodell absichtlich ändern möchten.

Wenn configure über eine Provider-Authentifizierungsoption gestartet wird, bevorzugen der Standardmodell- und der Allowlist-Picker diesen Provider automatisch. Bei gekoppelten Providern wie Volcengine/BytePlus entspricht dieselbe Präferenz auch ihren Coding-Plan-Varianten
(`volcengine-plan/*`, `byteplus-plan/*`). Wenn der Filter für den bevorzugten Provider eine leere Liste erzeugen würde, greift configure auf den ungefilterten
Katalog zurück, anstatt einen leeren Picker anzuzeigen.

Tipp: `openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie
`openclaw config get|set|unset` für nicht interaktive Änderungen.

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider auswählen
und dessen Zugangsdaten konfigurieren. Einige Provider zeigen außerdem providerspezifische
nachgelagerte Eingabeaufforderungen an:

- **Grok** kann optional die Einrichtung von `x_search` mit demselben `XAI_API_KEY` anbieten und
  Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region fragen (`api.moonshot.ai` vs
  `api.moonshot.cn`) und nach dem Standard-Websuchmodell von Kimi.

Verwandt:

- Gateway-Konfigurationsreferenz: [Configuration](/de/gateway/configuration)
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

- Wenn Sie auswählen, wo das Gateway ausgeführt wird, wird immer `gateway.mode` aktualisiert. Sie können „Continue“ ohne weitere Abschnitte auswählen, wenn Sie nur das benötigen.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Kanal-/Raum-Allowlists. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Installationsschritt für den Daemon ausführen, die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert configure den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und der konfigurierte SecretRef für das Token nicht aufgelöst ist, blockiert configure die Daemon-Installation mit umsetzbaren Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert configure die Daemon-Installation, bis der Modus explizit gesetzt wird.

## Beispiele

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Configuration](/de/gateway/configuration)
