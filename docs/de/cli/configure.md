---
read_when:
    - Sie möchten Anmeldedaten, Geräte oder Agent-Standardeinstellungen interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsaufforderungen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-06-27T17:17:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktive Eingabeaufforderung für gezielte Änderungen an einer bestehenden Einrichtung: Zugangsdaten, Geräte, Agent-Standardeinstellungen, Gateway, Kanäle, Plugins, Skills und Integritätsprüfungen.

Verwenden Sie `openclaw onboard` für die vollständig geführte Ersteinrichtung, `openclaw setup` nur für die Basis-Konfiguration/den Arbeitsbereich und `openclaw channels add`, wenn Sie nur die Einrichtung eines Kanalkontos benötigen.

<Note>
Der Abschnitt **Modell** enthält eine Mehrfachauswahl für die Allowlist `agents.defaults.models` (was in `/model` und in der Modellauswahl angezeigt wird). Provider-bezogene Einrichtungsauswahlen führen ihre ausgewählten Modelle mit der bestehenden Allowlist zusammen, statt nicht verwandte Provider zu ersetzen, die bereits in der Konfiguration vorhanden sind.

Wenn Sie die Provider-Authentifizierung über configure erneut ausführen, bleibt ein vorhandenes `agents.defaults.model.primary` erhalten, selbst wenn der Authentifizierungsschritt des Providers einen Konfigurations-Patch mit seinem eigenen empfohlenen Standardmodell zurückgibt. Das bedeutet, dass das Hinzufügen oder erneute Authentifizieren von xAI, OpenRouter oder einem anderen Provider das neue Modell verfügbar machen sollte, ohne Ihr aktuelles Primärmodell zu übernehmen. Verwenden Sie `openclaw models auth login --provider <id> --set-default` oder `openclaw models set <model>`, wenn Sie das Standardmodell bewusst ändern möchten.
</Note>

Wenn configure mit einer Provider-Authentifizierungsauswahl startet, bevorzugen die Auswahlfelder für Standardmodell und Allowlist diesen Provider automatisch. Bei gekoppelten Providern wie Volcengine und BytePlus entspricht dieselbe Präferenz auch ihren Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Wenn der Filter für den bevorzugten Provider eine leere Liste erzeugen würde, fällt configure auf den ungefilterten Katalog zurück, statt eine leere Auswahl anzuzeigen.

<Tip>
`openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie `openclaw config get|set|unset` für nicht interaktive Änderungen.
</Tip>

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider auswählen
und dessen Zugangsdaten konfigurieren. Einige Provider zeigen außerdem Provider-spezifische
Folgeabfragen an:

- **Grok** kann eine optionale Einrichtung von `x_search` mit demselben xAI-OAuth-Profil
  oder API-Schlüssel anbieten und Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` gegenüber
  `api.moonshot.cn`) und dem standardmäßigen Kimi-Websuchmodell fragen.

Verwandt:

- Referenz zur Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
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

- Der vollständige Assistent und Gateway-bezogene Abschnitte fragen, wo das Gateway ausgeführt wird, und aktualisieren `gateway.mode`. Abschnittsfilter, die `gateway`, `daemon` oder `health` nicht enthalten, gehen direkt zur angeforderten Einrichtung.
- Nach lokalen Konfigurationsschreibvorgängen installiert configure ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad sie erfordert. Eine Remote-Gateway-Konfiguration installiert keine lokalen Plugin-Pakete.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Allowlists für Kanäle/Räume. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Installationsschritt für den Daemon ausführen, die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert configure die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte dauerhaft in Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert configure die Daemon-Installation mit umsetzbaren Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert configure die Daemon-Installation, bis der Modus ausdrücklich gesetzt wird.

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
