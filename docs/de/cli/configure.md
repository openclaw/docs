---
read_when:
    - Sie möchten Zugangsdaten, Geräte oder Standardeinstellungen für Agenten interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsaufforderungen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-04-30T06:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktive Eingabeaufforderung zum Einrichten von Zugangsdaten, Geräten und Agent-Standardeinstellungen.

<Note>
Der Abschnitt **Modell** enthält eine Mehrfachauswahl für die Allowlist `agents.defaults.models` (was in `/model` und in der Modellauswahl angezeigt wird). Providerbezogene Einrichtungsoptionen führen ihre ausgewählten Modelle mit der bestehenden Allowlist zusammen, statt nicht zusammengehörige Provider zu ersetzen, die bereits in der Konfiguration vorhanden sind. Wenn Sie die Provider-Authentifizierung aus configure erneut ausführen, bleibt ein bestehendes `agents.defaults.model.primary` erhalten. Verwenden Sie `openclaw models auth login --provider <id> --set-default` oder `openclaw models set <model>`, wenn Sie das Standardmodell absichtlich ändern möchten.
</Note>

Wenn configure über eine Provider-Authentifizierungsoption gestartet wird, bevorzugen die Auswahl für Standardmodell und Allowlist automatisch diesen Provider. Bei gekoppelten Providern wie Volcengine und BytePlus gilt dieselbe Präferenz auch für deren Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Wenn der bevorzugte Provider-Filter eine leere Liste ergeben würde, fällt configure auf den ungefilterten Katalog zurück, statt eine leere Auswahl anzuzeigen.

<Tip>
`openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie `openclaw config get|set|unset` für nicht interaktive Änderungen.
</Tip>

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider auswählen
und dessen Zugangsdaten konfigurieren. Einige Provider zeigen außerdem providerspezifische
Folgeabfragen an:

- **Grok** kann eine optionale Einrichtung von `x_search` mit demselben `XAI_API_KEY` anbieten und
  Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` vs
  `api.moonshot.cn`) und dem Standardmodell für die Kimi-Websuche fragen.

Verwandt:

- Referenz zur Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
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

- Die Auswahl, wo das Gateway ausgeführt wird, aktualisiert immer `gateway.mode`. Sie können „Weiter“ ohne andere Abschnitte auswählen, wenn das alles ist, was Sie benötigen.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Allowlists für Kanäle/Räume. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Schritt zur Daemon-Installation ausführen, die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert configure die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert configure die Daemon-Installation mit konkreten Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert configure die Daemon-Installation, bis der Modus explizit gesetzt wurde.

## Beispiele

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
