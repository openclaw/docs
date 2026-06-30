---
read_when:
    - Sie möchten Zugangsdaten, Geräte oder Agenten-Standardeinstellungen interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsaufforderungen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-06-30T22:10:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktive Eingabeaufforderung für gezielte Änderungen an einer bestehenden Einrichtung: Zugangsdaten, Geräte, Agent-Standardeinstellungen, Gateway, Kanäle, Plugins, Skills und Zustandsprüfungen.

Verwenden Sie `openclaw onboard` oder `openclaw setup` für die vollständig geführte Erstkonfiguration, `openclaw setup --baseline` nur für die Basiskonfiguration bzw. den Basis-Arbeitsbereich und `openclaw channels add`, wenn Sie nur ein Kanal-Konto einrichten müssen.

<Note>
Der Abschnitt **Modell** enthält eine Mehrfachauswahl für die Allowlist `agents.defaults.models` (was in `/model` und in der Modellauswahl angezeigt wird). Provider-bezogene Einrichtungsoptionen führen ihre ausgewählten Modelle mit der bestehenden Allowlist zusammen, anstatt nicht zugehörige Provider zu ersetzen, die bereits in der Konfiguration vorhanden sind.

Wenn Sie die Provider-Authentifizierung über configure erneut ausführen, bleibt ein vorhandenes `agents.defaults.model.primary` erhalten, selbst wenn der Authentifizierungsschritt des Providers einen Konfigurations-Patch mit einem eigenen empfohlenen Standardmodell zurückgibt. Das bedeutet, dass das Hinzufügen oder erneute Authentifizieren von xAI, OpenRouter oder einem anderen Provider das neue Modell verfügbar machen sollte, ohne Ihr aktuelles primäres Modell zu übernehmen. Verwenden Sie `openclaw models auth login --provider <id> --set-default` oder `openclaw models set <model>`, wenn Sie das Standardmodell bewusst ändern möchten.
</Note>

Wenn configure mit einer Provider-Authentifizierungsoption startet, bevorzugen die Auswahlfelder für Standardmodell und Allowlist automatisch diesen Provider. Bei gekoppelten Providern wie Volcengine und BytePlus werden auch deren Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`) von derselben Präferenz erfasst. Wenn der Filter für den bevorzugten Provider eine leere Liste ergeben würde, fällt configure auf den ungefilterten Katalog zurück, anstatt eine leere Auswahl anzuzeigen.

<Tip>
`openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie `openclaw config get|set|unset` für nicht interaktive Änderungen.
</Tip>

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider auswählen
und seine Zugangsdaten konfigurieren. Einige Provider zeigen außerdem Provider-spezifische
Folgeabfragen an:

- **Grok** kann eine optionale Einrichtung von `x_search` mit demselben xAI-OAuth-Profil
  oder API-Schlüssel anbieten und Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` oder
  `api.moonshot.cn`) und dem standardmäßigen Kimi-Websuchmodell fragen.

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

- Der vollständige Assistent und Gateway-bezogene Abschnitte fragen, wo das Gateway ausgeführt wird, und aktualisieren `gateway.mode`. Abschnittsfilter, die `gateway`, `daemon` oder `health` nicht enthalten, springen direkt zur angeforderten Einrichtung.
- Nach lokalen Schreibvorgängen in der Konfiguration installiert configure ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad sie erfordert. Remote-Gateway-Konfiguration installiert keine lokalen Plugin-Pakete.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Allowlists für Kanäle/Räume. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Schritt zur Daemon-Installation ausführen, Token-Authentifizierung ein Token erfordert und `gateway.auth.token` von SecretRef verwaltet wird, validiert configure den SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte dauerhaft in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert configure die Daemon-Installation mit umsetzbaren Hinweisen zur Behebung.
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
