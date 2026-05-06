---
read_when:
    - Eine neue OpenClaw-Agentensitzung starten
    - Standard-Skills aktivieren oder prüfen
summary: Standardmäßige OpenClaw-Agentenanweisungen und Skills-Liste für die Einrichtung des persönlichen Assistenten
title: Standard-AGENTS.md
x-i18n:
    generated_at: "2026-05-06T07:02:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ecfafd0bee8b18f5787a0b8e273ce281c40c7d2d5754f15daa1f2b7cc7ecad0
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Erster Lauf (empfohlen)

OpenClaw verwendet ein dediziertes Workspace-Verzeichnis für den Agent. Standard: `~/.openclaw/workspace` (konfigurierbar über `agents.defaults.workspace`).

1. Erstellen Sie den Workspace (falls er noch nicht existiert):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Kopieren Sie die Standard-Workspace-Vorlagen in den Workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Optional: Wenn Sie die Skill-Liste des persönlichen Assistenten möchten, ersetzen Sie AGENTS.md durch diese Datei:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Optional: Wählen Sie einen anderen Workspace, indem Sie `agents.defaults.workspace` festlegen (unterstützt `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Sicherheitsstandards

- Geben Sie keine Verzeichnisse oder Geheimnisse im Chat aus.
- Führen Sie keine destruktiven Befehle aus, sofern nicht ausdrücklich darum gebeten wurde.
- Senden Sie keine teilweisen/streamingartigen Antworten an externe Messaging-Oberflächen (nur endgültige Antworten).

## Sitzungsstart (erforderlich)

- Lesen Sie `SOUL.md`, `USER.md` sowie heute+gestern in `memory/`.
- Lesen Sie `MEMORY.md`, wenn vorhanden.
- Tun Sie dies, bevor Sie antworten.

## Seele (erforderlich)

- `SOUL.md` definiert Identität, Ton und Grenzen. Halten Sie sie aktuell.
- Wenn Sie `SOUL.md` ändern, informieren Sie den Benutzer.
- Sie sind in jeder Sitzung eine neue Instanz; Kontinuität lebt in diesen Dateien.

## Gemeinsame Bereiche (empfohlen)

- Sie sind nicht die Stimme des Benutzers; seien Sie in Gruppenchats oder öffentlichen Kanälen vorsichtig.
- Teilen Sie keine privaten Daten, Kontaktdaten oder internen Notizen.

## Memory-System (empfohlen)

- Tagesprotokoll: `memory/YYYY-MM-DD.md` (erstellen Sie `memory/`, falls nötig).
- Langzeit-Memory: `MEMORY.md` für dauerhafte Fakten, Präferenzen und Entscheidungen.
- Kleingeschriebenes `memory.md` ist nur Legacy-Reparatureingabe; behalten Sie nicht absichtlich beide Root-Dateien.
- Lesen Sie beim Sitzungsstart heute + gestern + `MEMORY.md`, wenn vorhanden.
- Erfassen Sie: Entscheidungen, Präferenzen, Einschränkungen, offene Schleifen.
- Vermeiden Sie Geheimnisse, sofern nicht ausdrücklich angefordert.

## Tools und Skills

- Tools leben in Skills; befolgen Sie die jeweilige `SKILL.md`, wenn Sie sie benötigen.
- Bewahren Sie umgebungsspezifische Notizen in `TOOLS.md` auf (Notizen für Skills).

## Backup-Tipp (empfohlen)

Wenn Sie diesen Workspace als Clawds „Memory“ behandeln, machen Sie ihn zu einem Git-Repo (idealerweise privat), damit `AGENTS.md` und Ihre Memory-Dateien gesichert werden.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Was OpenClaw tut

- Führt WhatsApp-Gateway + Pi-Coding-Agent aus, damit der Assistent Chats lesen/schreiben, Kontext abrufen und Skills über den Host-Mac ausführen kann.
- Die macOS-App verwaltet Berechtigungen (Bildschirmaufnahme, Benachrichtigungen, Mikrofon) und stellt die `openclaw`-CLI über ihre gebündelte Binärdatei bereit.
- Direktchats werden standardmäßig in die `main`-Sitzung des Agent zusammengeführt; Gruppen bleiben als `agent:<agentId>:<channel>:group:<id>` isoliert (Räume/Kanäle: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats halten Hintergrundaufgaben am Leben.

## Kern-Skills (in Einstellungen → Skills aktivieren)

- **mcporter** - Tool-Server-Laufzeit/CLI zum Verwalten externer Skill-Backends.
- **Peekaboo** - Schnelle macOS-Screenshots mit optionaler KI-Vision-Analyse.
- **camsnap** - Frames, Clips oder Bewegungsalarme von RTSP/ONVIF-Sicherheitskameras erfassen.
- **oracle** - OpenAI-fähige Agent-CLI mit Sitzungswiedergabe und Browsersteuerung.
- **eightctl** - Steuern Sie Ihren Schlaf vom Terminal aus.
- **imsg** - iMessage & SMS senden, lesen und streamen.
- **wacli** - WhatsApp-CLI: synchronisieren, suchen, senden.
- **discord** - Discord-Aktionen: Reaktionen, Sticker, Umfragen. Verwenden Sie `user:<id>`- oder `channel:<id>`-Ziele (reine numerische IDs sind mehrdeutig).
- **gog** - Google Suite-CLI: Gmail, Kalender, Drive, Kontakte.
- **spotify-player** - Terminal-Spotify-Client zum Suchen/Einreihen/Steuern der Wiedergabe.
- **sag** - ElevenLabs-Sprachausgabe mit say-UX im Mac-Stil; streamt standardmäßig an Lautsprecher.
- **Sonos CLI** - Sonos-Lautsprecher (Erkennung/Status/Wiedergabe/Lautstärke/Gruppierung) aus Skripten steuern.
- **blucli** - BluOS-Player aus Skripten abspielen, gruppieren und automatisieren.
- **OpenHue CLI** - Philips-Hue-Lichtsteuerung für Szenen und Automatisierungen.
- **OpenAI Whisper** - Lokale Speech-to-Text-Umwandlung für schnelle Diktate und Voicemail-Transkripte.
- **Gemini CLI** - Google-Gemini-Modelle vom Terminal aus für schnelle Fragen und Antworten.
- **agent-tools** - Hilfs-Toolkit für Automatisierungen und Helferskripte.

## Nutzungshinweise

- Bevorzugen Sie die `openclaw`-CLI für Skripting; die Mac-App behandelt Berechtigungen.
- Führen Sie Installationen über den Tab Skills aus; er blendet die Schaltfläche aus, wenn bereits eine Binärdatei vorhanden ist.
- Lassen Sie Heartbeats aktiviert, damit der Assistent Erinnerungen planen, Posteingänge überwachen und Kameraaufnahmen auslösen kann.
- Die Canvas-UI läuft im Vollbildmodus mit nativen Overlays. Platzieren Sie kritische Steuerelemente nicht oben links, oben rechts oder an den unteren Rändern; fügen Sie explizite Abstände im Layout hinzu und verlassen Sie sich nicht auf Safe-Area-Inset-Werte.
- Verwenden Sie für browsergestützte Verifizierung `openclaw browser` (Tabs/Status/Screenshot) mit dem von OpenClaw verwalteten Chrome-Profil.
- Verwenden Sie für DOM-Inspektion `openclaw browser eval|query|dom|snapshot` (und `--json`/`--out`, wenn Sie maschinenlesbare Ausgabe benötigen).
- Verwenden Sie für Interaktionen `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type erfordern Snapshot-Refs; verwenden Sie `evaluate` für CSS-Selektoren).

## Verwandt

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Agent-Laufzeit](/de/concepts/agent)
