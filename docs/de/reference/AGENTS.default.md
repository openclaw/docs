---
read_when:
    - Starten einer neuen OpenClaw-Agentensitzung
    - Standard-Skills aktivieren oder prüfen
summary: Standardmäßige OpenClaw-Agentenanweisungen und Skills-Übersicht für die Einrichtung des persönlichen Assistenten
title: Standard-AGENTS.md
x-i18n:
    generated_at: "2026-07-12T02:07:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Erster Start (empfohlen)

OpenClaw-Agenten verwenden ein Arbeitsbereichsverzeichnis. Standard: `~/.openclaw/workspace` (über `agents.defaults.workspace` konfigurierbar, unterstützt `~`).

1. Erstellen Sie den Arbeitsbereich:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Kopieren Sie die standardmäßigen Arbeitsbereichsvorlagen hinein:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Optional: Verwenden Sie statt der allgemeinen Vorlage die Liste der persönlichen Assistenz-Skills aus dieser Datei:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Optional: Geben Sie einen anderen Arbeitsbereich an:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Standardsicherheitseinstellungen

- Geben Sie keine Verzeichnisinhalte oder Geheimnisse im Chat aus.
- Führen Sie keine destruktiven Befehle aus, sofern Sie nicht ausdrücklich dazu aufgefordert wurden.
- Prüfen Sie vor Änderungen an der Konfiguration oder an Zeitplanern (crontab, systemd-Units, nginx-Konfigurationen, Shell-RC-Dateien) zunächst den bestehenden Zustand und behalten Sie ihn standardmäßig bei beziehungsweise führen Sie die Änderungen mit ihm zusammen.
- Senden Sie keine unvollständigen oder gestreamten Antworten an externe Messaging-Oberflächen (nur endgültige Antworten).

## Vorabprüfung vorhandener Lösungen

Bevor Sie ein benutzerdefiniertes System, eine Funktion, einen Workflow, ein Werkzeug, eine Integration oder eine Automatisierung vorschlagen oder entwickeln, prüfen Sie, ob Open-Source-Projekte, gepflegte Bibliotheken, vorhandene OpenClaw-Plugins oder kostenlose Plattformen das Problem bereits hinreichend lösen. Bevorzugen Sie diese, wenn sie geeignet sind. Entwickeln Sie nur dann eine eigene Lösung, wenn vorhandene Optionen ungeeignet, zu teuer, ungepflegt, unsicher oder nicht regelkonform sind oder der Benutzer ausdrücklich eine benutzerdefinierte Lösung verlangt. Vermeiden Sie Empfehlungen für kostenpflichtige Dienste, sofern der Benutzer den finanziellen Aufwand nicht ausdrücklich genehmigt. Halten Sie diese Prüfung knapp: Sie ist eine vorgelagerte Entscheidungsschranke, kein Rechercheauftrag.

## Sitzungsstart (erforderlich)

- Lesen Sie vor dem Antworten `SOUL.md`, `USER.md` sowie die Einträge für heute und gestern in `memory/`.
- Lesen Sie `MEMORY.md`, sofern vorhanden.

## Persönlichkeit (erforderlich)

- `SOUL.md` definiert Identität, Ton und Grenzen. Halten Sie die Datei aktuell.
- Wenn Sie `SOUL.md` ändern, informieren Sie den Benutzer.
- Sie sind in jeder Sitzung eine neue Instanz; die Kontinuität wird in diesen Dateien bewahrt.

## Gemeinsam genutzte Bereiche (empfohlen)

- Sie sprechen nicht im Namen des Benutzers; seien Sie in Gruppenchats oder öffentlichen Kanälen vorsichtig.
- Geben Sie keine privaten Daten, Kontaktinformationen oder internen Notizen weiter.

## Speichersystem (empfohlen)

- Tägliches Protokoll: `memory/YYYY-MM-DD.md` (erstellen Sie bei Bedarf `memory/`).
- Langzeitgedächtnis: `MEMORY.md` für dauerhafte Fakten, Präferenzen und Entscheidungen.
- Die kleingeschriebene Datei `memory.md` dient ausschließlich als Eingabe zur Reparatur veralteter Daten; behalten Sie nicht absichtlich beide Dateien im Stammverzeichnis bei.
- Lesen Sie beim Sitzungsstart die Einträge von heute und gestern sowie, falls vorhanden, `MEMORY.md`.
- Lesen Sie Speicherdateien vor dem Schreiben zunächst ein; schreiben Sie nur konkrete Aktualisierungen und niemals leere Platzhalter.
- Erfassen Sie Entscheidungen, Präferenzen, Einschränkungen und offene Vorgänge.
- Vermeiden Sie Geheimnisse, sofern deren Speicherung nicht ausdrücklich verlangt wird.

## Werkzeuge und Skills

- Werkzeuge befinden sich in Skills; befolgen Sie bei Bedarf die jeweilige `SKILL.md`.
- Bewahren Sie umgebungsspezifische Hinweise in `TOOLS.md` auf (Hinweise für Skills).

## Hinweis zur Datensicherung (empfohlen)

Behandeln Sie diesen Arbeitsbereich als Gedächtnis des Assistenten: Machen Sie daraus ein Git-Repository (idealerweise ein privates), damit `AGENTS.md` und die Speicherdateien gesichert werden.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Arbeitsbereich hinzufügen"
# Optional: ein privates Remote-Repository hinzufügen und Änderungen übertragen
```

## Funktionsweise von OpenClaw

- OpenClaw betreibt ein Gateway für Messaging-Kanäle (WhatsApp, Telegram, Discord, Signal, iMessage, Slack und weitere) sowie einen eingebetteten Agenten, sodass der Assistent Chats lesen und schreiben, Kontext abrufen und Skills über den Hostrechner ausführen kann.
- Die macOS-App verwaltet Berechtigungen (Bildschirmaufnahme, Benachrichtigungen, Mikrofon) und stellt die `openclaw`-CLI über die enthaltene Binärdatei bereit.
- Direkte Chats werden standardmäßig in der `main`-Sitzung des Agenten zusammengeführt; Gruppen und Kanäle beziehungsweise Räume erhalten jeweils eigene Sitzungsschlüssel. Die genauen Schlüsselformate finden Sie unter [Kanal-Routing](/de/channels/channel-routing). Heartbeats halten Hintergrundaufgaben aktiv.

## Zentrale Skills (unter Settings → Skills aktivieren)

Beispielauswahl für einen Arbeitsbereich eines persönlichen Assistenten; ersetzen Sie sie durch die Skills, die zu Ihrer Einrichtung passen.

- **mcporter** – Laufzeitumgebung/CLI für Werkzeugserver zur Verwaltung externer Skill-Backends.
- **Peekaboo** – schnelle macOS-Bildschirmaufnahmen mit optionaler KI-Bildanalyse.
- **camsnap** – erfasst Einzelbilder, Clips oder Bewegungswarnungen von RTSP-/ONVIF-Sicherheitskameras.
- **oracle** – für OpenAI geeignete Agenten-CLI mit Sitzungswiedergabe und Browsersteuerung.
- **eightctl** – steuert Ihren Schlaf über das Terminal.
- **imsg** – sendet, liest und streamt iMessage und SMS.
- **wacli** – WhatsApp-CLI zum Synchronisieren, Suchen und Senden.
- **discord** – Discord-Aktionen: Reaktionen, Sticker und Umfragen. Verwenden Sie Ziele im Format `user:<id>` oder `channel:<id>` (rein numerische IDs sind mehrdeutig).
- **gog** – CLI für Google Suite: Gmail, Calendar, Drive und Contacts.
- **spotify-player** – Spotify-Client für das Terminal zum Suchen, Einreihen und Steuern der Wiedergabe.
- **sag** – ElevenLabs-Sprachausgabe mit einer macOS-ähnlichen `say`-Bedienung; gibt Audio standardmäßig über die Lautsprecher aus.
- **Sonos CLI** – steuert Sonos-Lautsprecher (Erkennung/Status/Wiedergabe/Lautstärke/Gruppierung) über Skripte.
- **blucli** – gibt Inhalte auf BluOS-Playern wieder und gruppiert und automatisiert diese über Skripte.
- **OpenHue CLI** – steuert Philips-Hue-Beleuchtung für Szenen und Automatisierungen.
- **OpenAI Whisper** – lokale Sprache-zu-Text-Umwandlung für schnelle Diktate und Transkripte von Sprachnachrichten.
- **Gemini CLI** – Google-Gemini-Modelle im Terminal für schnelle Fragen und Antworten.
- **agent-tools** – Werkzeugsammlung für Automatisierungen und Hilfsskripte.

## Nutzungshinweise

- Bevorzugen Sie die `openclaw`-CLI für Skripte; die Desktop-App verwaltet die Berechtigungen.
- Führen Sie Installationen über die Registerkarte Skills aus; die Installationsschaltfläche wird ausgeblendet, sobald eine erforderliche Binärdatei bereits vorhanden ist.
- Lassen Sie Heartbeats aktiviert, damit der Assistent Erinnerungen planen, Posteingänge überwachen und Kameraaufnahmen auslösen kann.
- Die Canvas-Benutzeroberfläche wird im Vollbildmodus mit nativen Überlagerungen ausgeführt. Platzieren Sie wichtige Bedienelemente nicht am oberen linken, oberen rechten oder unteren Rand; fügen Sie stattdessen explizite Layout-Abstände hinzu, anstatt sich auf Safe-Area-Einzüge zu verlassen.
- Verwenden Sie für browsergestützte Überprüfungen die CLI `openclaw browser` (enthaltenes `browser`-Plugin) mit dem von OpenClaw verwalteten Chrome-/Brave-/Edge-/Chromium-Profil.
- Verwalten: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Prüfen: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Ausführen: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Aktionen benötigen eine `ref` aus `snapshot` (CSS-Selektoren werden für Aktionen nicht akzeptiert); verwenden Sie `evaluate`, wenn Sie eine Zielauswahl nach Art von `document.querySelector` benötigen.
- Fügen Sie jedem Prüfungsbefehl `--json` hinzu, um eine maschinenlesbare Ausgabe zu erhalten.

## Verwandte Themen

- [Agenten-Arbeitsbereich](/de/concepts/agent-workspace)
- [Agenten-Laufzeitumgebung](/de/concepts/agent)
- [Kanal-Routing](/de/channels/channel-routing)
