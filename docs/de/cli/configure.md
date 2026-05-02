---
read_when:
    - Sie möchten Anmeldedaten, Geräte oder Agent-Standardeinstellungen interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-05-02T06:28:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktive Eingabeaufforderung zum Einrichten von Zugangsdaten, Geräten und Agent-Standardeinstellungen.

<Note>
Der Abschnitt **Modell** enthält eine Mehrfachauswahl für die Allowlist `agents.defaults.models` (was in `/model` und in der Modellauswahl angezeigt wird). Einrichtungsauswahlen mit Provider-Geltungsbereich führen ihre ausgewählten Modelle mit der vorhandenen Allowlist zusammen, statt bereits in der Konfiguration vorhandene, nicht zugehörige Provider zu ersetzen.

Wenn Sie die Provider-Authentifizierung erneut über configure ausführen, bleibt ein vorhandenes `agents.defaults.model.primary` erhalten, auch wenn der Authentifizierungsschritt des Providers einen Konfigurations-Patch mit einem eigenen empfohlenen Standardmodell zurückgibt. Das bedeutet, dass das Hinzufügen oder erneute Authentifizieren von xAI, OpenRouter oder einem anderen Provider das neue Modell verfügbar machen sollte, ohne Ihr aktuelles primäres Modell zu übernehmen. Verwenden Sie `openclaw models auth login --provider <id> --set-default` oder `openclaw models set <model>`, wenn Sie das Standardmodell absichtlich ändern möchten.
</Note>

Wenn configure über eine Provider-Authentifizierungsauswahl gestartet wird, bevorzugen die Standardmodell- und Allowlist-Auswahlen automatisch diesen Provider. Bei gekoppelten Providern wie Volcengine und BytePlus gilt dieselbe Präferenz auch für ihre Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Wenn der Filter für den bevorzugten Provider eine leere Liste ergeben würde, fällt configure auf den ungefilterten Katalog zurück, statt eine leere Auswahl anzuzeigen.

<Tip>
`openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie `openclaw config get|set|unset` für nicht interaktive Bearbeitungen.
</Tip>

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider auswählen
und dessen Zugangsdaten konfigurieren. Einige Provider zeigen außerdem Provider-spezifische
Folgeabfragen an:

- **Grok** kann eine optionale `x_search`-Einrichtung mit demselben `XAI_API_KEY` anbieten und
  Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` vs
  `api.moonshot.cn`) und dem Standardmodell für die Kimi-Websuche fragen.

Verwandt:

- Gateway-Konfigurationsreferenz: [Konfiguration](/de/gateway/configuration)
- Konfigurations-CLI: [Konfiguration](/de/cli/config)

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

- Die Auswahl, wo der Gateway ausgeführt wird, aktualisiert immer `gateway.mode`. Sie können „Fortfahren“ ohne weitere Abschnitte auswählen, wenn das alles ist, was Sie benötigen.
- Nach lokalen Konfigurationsschreibvorgängen installiert configure ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad sie erfordert. Remote-Gateway-Konfiguration installiert keine lokalen Plugin-Pakete.
- Channel-orientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Allowlists für Channels/Räume. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Daemon-Installationsschritt ausführen, die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` SecretRef-verwaltet ist, validiert configure die SecretRef, speichert jedoch keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert configure die Daemon-Installation mit umsetzbaren Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert configure die Daemon-Installation, bis der Modus ausdrücklich gesetzt wurde.

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
