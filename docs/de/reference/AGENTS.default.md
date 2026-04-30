---
read_when:
    - Eine neue OpenClaw-Agentensitzung starten
    - Standardmäßige Skills aktivieren oder prüfen
summary: Standardmäßige OpenClaw-Agentenanweisungen und Skills-Liste für die Einrichtung des persönlichen Assistenten
title: Standard-AGENTS.md
x-i18n:
    generated_at: "2026-04-30T07:12:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - OpenClaw Persönlicher Assistent (Standard)

## Erster Start (empfohlen)

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

3. Optional: Wenn Sie die Skill-Liste für den persönlichen Assistenten möchten, ersetzen Sie AGENTS.md durch diese Datei:

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

- Geben Sie keine Verzeichnisse oder Secrets in den Chat aus.
- Führen Sie keine destruktiven Befehle aus, sofern nicht ausdrücklich darum gebeten wurde.
- Senden Sie keine Teil- oder Streaming-Antworten an externe Messaging-Oberflächen (nur finale Antworten).

## Sitzungsstart (erforderlich)

- Lesen Sie `SOUL.md`, `USER.md` und heute+gestern in `memory/`.
- Lesen Sie `MEMORY.md`, falls vorhanden.
- Tun Sie dies vor dem Antworten.

## Seele (erforderlich)

- `SOUL.md` definiert Identität, Ton und Grenzen. Halten Sie sie aktuell.
- Wenn Sie `SOUL.md` ändern, informieren Sie den Benutzer.
- Sie sind in jeder Sitzung eine neue Instanz; Kontinuität lebt in diesen Dateien.

## Gemeinsame Bereiche (empfohlen)

- Sie sind nicht die Stimme des Benutzers; seien Sie in Gruppenchats oder öffentlichen Kanälen vorsichtig.
- Teilen Sie keine privaten Daten, Kontaktinformationen oder internen Notizen.

## Speichersystem (empfohlen)

- Tagesprotokoll: `memory/YYYY-MM-DD.md` (erstellen Sie bei Bedarf `memory/`).
- Langzeitspeicher: `MEMORY.md` für dauerhafte Fakten, Präferenzen und Entscheidungen.
- Kleingeschriebenes `memory.md` ist nur Legacy-Reparatureingabe; behalten Sie nicht absichtlich beide Root-Dateien.
- Lesen Sie beim Sitzungsstart heute + gestern + `MEMORY.md`, falls vorhanden.
- Erfassen Sie: Entscheidungen, Präferenzen, Einschränkungen, offene Schleifen.
- Vermeiden Sie Secrets, sofern nicht ausdrücklich angefordert.

## Tools & Skills

- Tools befinden sich in Skills; folgen Sie dem jeweiligen `SKILL.md`, wenn Sie es benötigen.
- Bewahren Sie umgebungsspezifische Notizen in `TOOLS.md` auf (Notizen für Skills).

## Backup-Tipp (empfohlen)

Wenn Sie diesen Workspace als „Speicher“ von Clawd behandeln, machen Sie ihn zu einem Git-Repo (idealerweise privat), damit `AGENTS.md` und Ihre Speicherdateien gesichert sind.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Was OpenClaw tut

- Führt das WhatsApp-Gateway + den Pi-Coding-Agent aus, damit der Assistent Chats lesen/schreiben, Kontext abrufen und Skills über den Host-Mac ausführen kann.
- Die macOS-App verwaltet Berechtigungen (Bildschirmaufnahme, Benachrichtigungen, Mikrofon) und stellt die `openclaw`-CLI über ihr gebündeltes Binary bereit.
- Direkte Chats werden standardmäßig in die `main`-Sitzung des Agent zusammengeführt; Gruppen bleiben isoliert als `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats halten Hintergrundaufgaben aktiv.

## Core-Skills (in Einstellungen → Skills aktivieren)

- **mcporter** — Tool-Server-Laufzeit/CLI zum Verwalten externer Skill-Backends.
- **Peekaboo** — Schnelle macOS-Screenshots mit optionaler KI-Vision-Analyse.
- **camsnap** — Erfasst Frames, Clips oder Bewegungsalarme von RTSP/ONVIF-Sicherheitskameras.
- **oracle** — OpenAI-fähige Agent-CLI mit Sitzungswiedergabe und Browser-Steuerung.
- **eightctl** — Steuern Sie Ihren Schlaf über das Terminal.
- **imsg** — iMessage & SMS senden, lesen und streamen.
- **wacli** — WhatsApp-CLI: synchronisieren, suchen, senden.
- **discord** — Discord-Aktionen: Reaktionen, Sticker, Umfragen. Verwenden Sie Ziele im Format `user:<id>` oder `channel:<id>` (bloße numerische IDs sind mehrdeutig).
- **gog** — Google-Suite-CLI: Gmail, Kalender, Drive, Kontakte.
- **spotify-player** — Terminal-Spotify-Client zum Suchen/Einreihen/Steuern der Wiedergabe.
- **sag** — ElevenLabs-Sprache mit mac-artiger say-UX; streamt standardmäßig an Lautsprecher.
- **Sonos CLI** — Steuern Sie Sonos-Lautsprecher (Erkennung/Status/Wiedergabe/Lautstärke/Gruppierung) aus Skripten.
- **blucli** — BluOS-Player aus Skripten abspielen, gruppieren und automatisieren.
- **OpenHue CLI** — Philips-Hue-Beleuchtungssteuerung für Szenen und Automatisierungen.
- **OpenAI Whisper** — Lokale Sprache-zu-Text-Umwandlung für schnelle Diktate und Voicemail-Transkripte.
- **Gemini CLI** — Google-Gemini-Modelle über das Terminal für schnelle Fragen und Antworten.
- **agent-tools** — Utility-Toolkit für Automatisierungen und Hilfsskripte.

## Nutzungshinweise

- Bevorzugen Sie die `openclaw`-CLI für Skripting; die Mac-App verwaltet Berechtigungen.
- Führen Sie Installationen über den Skills-Tab aus; er blendet die Schaltfläche aus, wenn bereits ein Binary vorhanden ist.
- Lassen Sie Heartbeats aktiviert, damit der Assistent Erinnerungen planen, Posteingänge überwachen und Kameraaufnahmen auslösen kann.
- Die Canvas-UI läuft im Vollbildmodus mit nativen Overlays. Platzieren Sie kritische Bedienelemente nicht an den oberen linken/rechten oder unteren Rändern; fügen Sie explizite Ränder im Layout hinzu und verlassen Sie sich nicht auf Safe-Area-Inset-Werte.
- Verwenden Sie für browsergestützte Verifizierung `openclaw browser` (Tabs/Status/Screenshot) mit dem von OpenClaw verwalteten Chrome-Profil.
- Verwenden Sie für DOM-Inspektion `openclaw browser eval|query|dom|snapshot` (und `--json`/`--out`, wenn Sie maschinenlesbare Ausgabe benötigen).
- Verwenden Sie für Interaktionen `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type erfordern Snapshot-Referenzen; verwenden Sie `evaluate` für CSS-Selektoren).

## Verwandt

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Agent-Laufzeit](/de/concepts/agent)
