---
read_when:
    - Sie möchten Anmeldedaten, Geräte oder Agent-Standardeinstellungen interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-07-24T04:50:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5980d06e75a5df9e5269d0ef78431f730d6f5fd050dca74784ef3426fb0433d8
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktive Eingabeaufforderungen für gezielte Änderungen an einer bestehenden Einrichtung: Anmeldedaten, Geräte, Agent-Standardwerte, Gateway, Kanäle, Plugins, Skills und Zustandsprüfungen.

Verwenden Sie `openclaw onboard` oder `openclaw setup` für den vollständigen geführten Ersteinrichtungsablauf, `openclaw setup --baseline` nur für die Basiskonfiguration und den Workspace und `openclaw channels add`, wenn Sie lediglich Kanalkonten einrichten müssen.

<Tip>
`openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie `openclaw config get|set|unset` für nicht interaktive Änderungen.
</Tip>

## Optionen

`--section <section>`: wiederholbarer Abschnittsfilter. Verfügbare Abschnitte:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Bei Auswahl von `gateway`, `daemon` oder `health` (oder beim Ausführen des vollständigen Assistenten ohne `--section`) wird abgefragt, wo das Gateway ausgeführt wird, und `gateway.mode` wird aktualisiert. Abschnittsfilter, die alle drei überspringen, führen ohne Abfrage des Gateway-Modus direkt zur angeforderten Einrichtung. Bei Auswahl des Remote-Gateway-Modus wird die Remote-Konfiguration geschrieben und der Vorgang sofort beendet; rein lokale Schritte wie Plugin-Installationen werden nicht ausgeführt.

<Note>
`openclaw configure` erfordert ein interaktives Terminal (sowohl stdin als auch stdout müssen TTYs sein). Ohne ein solches Terminal gibt es die entsprechenden nicht interaktiven `openclaw config get|set|patch|validate`-Befehle aus und wird mit einem Fehler beendet, anstatt den Vorgang teilweise auszuführen.
</Note>

## Modellabschnitt

<Note>
**Modell** enthält eine Mehrfachauswahl für die explizite Liste `agents.defaults.modelPolicy.allow` (die Einträge, die in `/model` und in der Modellauswahl angezeigt werden). Provider-spezifische Einrichtungsoptionen führen die ausgewählten Modelle mit der vorhandenen Liste zusammen, anstatt bereits in der Konfiguration enthaltene, nicht zugehörige Provider zu ersetzen. Modellspezifische Aliasse und Parameter verbleiben unter `agents.defaults.models`; diese Einträge schränken Modellüberschreibungen nicht von sich aus ein.

Wird die Provider-Authentifizierung über die Konfiguration erneut ausgeführt, bleibt ein vorhandenes `agents.defaults.model.primary` erhalten, selbst wenn der Authentifizierungsschritt des Providers einen Konfigurations-Patch mit einem eigenen empfohlenen Standardmodell zurückgibt. Durch das Hinzufügen oder erneute Authentifizieren eines Providers werden dessen Modelle verfügbar, ohne Ihr aktuelles primäres Modell zu übernehmen. Verwenden Sie `openclaw models auth login --provider <id> --set-default` oder `openclaw models set <model>`, um das Standardmodell gezielt zu ändern.
</Note>

Wenn die Konfiguration über eine Provider-Authentifizierungsoption gestartet wird, bevorzugen die Auswahlfelder für Standardmodell und Modellrichtlinie automatisch diesen Provider. Bei gekoppelten Providern wie Volcengine und BytePlus umfasst diese Präferenz auch deren Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Würde der Filter für den bevorzugten Provider eine leere Liste ergeben, verwendet die Konfiguration stattdessen den ungefilterten Katalog, anstatt ein leeres Auswahlfeld anzuzeigen.

## Webabschnitt

`openclaw configure --section web` wählt einen Provider für die Websuche aus und konfiguriert dessen Anmeldedaten. Einige Provider zeigen Provider-spezifische Folgeoptionen an:

- **Grok** kann eine optionale Einrichtung von `x_search` mit demselben xAI-OAuth-Profil oder API-Schlüssel anbieten und die Auswahl eines `x_search`-Modells ermöglichen.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` oder `api.moonshot.cn`) und dem standardmäßigen Kimi-Modell für die Websuche fragen.

## Weitere Hinweise

- Nach dem Schreiben der lokalen Konfiguration installiert die Konfiguration ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungsablauf diese erfordert. Bei einer Remote-Gateway-Konfiguration werden keine lokalen Plugin-Pakete installiert.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Zulassungslisten für Kanäle beziehungsweise Räume. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Schritt zur Daemon-Installation ausführen, ist für die Token-Authentifizierung ein Token erforderlich. Wenn `gateway.auth.token` durch SecretRef verwaltet wird, validiert die Konfiguration die SecretRef, speichert jedoch die aufgelösten Klartext-Tokenwerte nicht dauerhaft in den Umgebungsmetadaten des Supervisor-Dienstes. Wenn die SecretRef nicht aufgelöst werden kann, blockiert die Konfiguration die Daemon-Installation und zeigt konkrete Anweisungen zur Behebung an.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, blockiert die Konfiguration die Daemon-Installation, bis Sie den Modus ausdrücklich festlegen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
- Konfigurations-CLI: [Konfiguration](/de/cli/config)
