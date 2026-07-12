---
read_when:
    - Sie möchten Anmeldedaten, Geräte oder Agent-Standardwerte interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-07-12T01:30:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktive Eingabeaufforderungen für gezielte Änderungen an einer bestehenden Einrichtung: Anmeldedaten, Geräte, Agent-Standardeinstellungen, Gateway, Kanäle, Plugins, Skills und Zustandsprüfungen.

Verwenden Sie `openclaw onboard` oder `openclaw setup` für die vollständige geführte Ersteinrichtung, `openclaw setup --baseline` nur für die Basiskonfiguration und den Arbeitsbereich und `openclaw channels add`, wenn Sie lediglich ein Kanalkonto einrichten müssen.

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

Wenn Sie `gateway`, `daemon` oder `health` auswählen (oder den vollständigen Assistenten ohne `--section` ausführen), werden Sie gefragt, wo das Gateway ausgeführt wird, und `gateway.mode` wird aktualisiert. Abschnittsfilter, die alle drei überspringen, führen direkt zur gewünschten Einrichtung, ohne nach dem Gateway-Modus zu fragen. Bei Auswahl des Remote-Gateway-Modus wird die Remote-Konfiguration geschrieben und der Assistent sofort beendet; ausschließlich lokale Schritte wie Plugin-Installationen werden nicht ausgeführt.

<Note>
`openclaw configure` erfordert ein interaktives Terminal (sowohl stdin als auch stdout müssen TTYs sein). Ohne ein solches Terminal gibt der Befehl die entsprechenden nicht interaktiven Befehle `openclaw config get|set|patch|validate` aus und wird mit einem Fehler beendet, statt nur teilweise ausgeführt zu werden.
</Note>

## Modellabschnitt

<Note>
**Modell** enthält eine Mehrfachauswahl für die Positivliste `agents.defaults.models` (die Modelle, die in `/model` und der Modellauswahl angezeigt werden). Provider-spezifische Einrichtungsoptionen führen die ausgewählten Modelle mit der bestehenden Positivliste zusammen, statt bereits konfigurierte, nicht betroffene Provider zu ersetzen.

Wenn Sie die Provider-Authentifizierung über die Konfiguration erneut ausführen, bleibt ein vorhandener Wert für `agents.defaults.model.primary` erhalten, selbst wenn der Authentifizierungsschritt des Providers einen Konfigurations-Patch mit einem eigenen empfohlenen Standardmodell zurückgibt. Wenn Sie einen Provider hinzufügen oder erneut authentifizieren, werden dessen Modelle verfügbar, ohne Ihr aktuelles primäres Modell zu übernehmen. Verwenden Sie `openclaw models auth login --provider <id> --set-default` oder `openclaw models set <model>`, um das Standardmodell bewusst zu ändern.
</Note>

Wenn die Konfiguration über eine Provider-Authentifizierungsoption gestartet wird, bevorzugen die Auswahlfelder für das Standardmodell und die Positivliste automatisch diesen Provider. Bei gekoppelten Providern wie Volcengine und BytePlus berücksichtigt diese Präferenz auch deren Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Falls der Filter für den bevorzugten Provider eine leere Liste ergeben würde, verwendet die Konfiguration stattdessen den ungefilterten Katalog, anstatt ein leeres Auswahlfeld anzuzeigen.

## Webabschnitt

`openclaw configure --section web` wählt einen Provider für die Websuche aus und konfiguriert dessen Anmeldedaten. Einige Provider zeigen Provider-spezifische Folgeoptionen an:

- **Grok** kann die optionale Einrichtung von `x_search` mit demselben xAI-OAuth-Profil oder API-Schlüssel anbieten und ermöglicht Ihnen die Auswahl eines `x_search`-Modells.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` oder `api.moonshot.cn`) und dem standardmäßigen Kimi-Modell für die Websuche fragen.

## Weitere Hinweise

- Nach lokalen Änderungen an der Konfiguration installiert der Konfigurationsassistent ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad diese erfordert. Bei einer Remote-Gateway-Konfiguration werden keine lokalen Plugin-Pakete installiert.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Positivlisten für Kanäle und Räume. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Schritt zur Installation des Daemons ausführen, ist für die Token-Authentifizierung ein Token erforderlich. Wenn `gateway.auth.token` über SecretRef verwaltet wird, validiert der Konfigurationsassistent die SecretRef, speichert jedoch keine aufgelösten Token-Klartextwerte in den Umgebungsmetadaten des Supervisor-Dienstes. Wenn die SecretRef nicht aufgelöst werden kann, blockiert der Konfigurationsassistent die Daemon-Installation und zeigt konkrete Hinweise zur Behebung an.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht festgelegt ist, blockiert der Konfigurationsassistent die Daemon-Installation, bis Sie den Modus ausdrücklich festlegen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
- Konfigurations-CLI: [Konfiguration](/de/cli/config)
