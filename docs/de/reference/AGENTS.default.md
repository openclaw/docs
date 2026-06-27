---
read_when:
    - Neue OpenClaw-Agentensitzung starten
    - Standard-Skills aktivieren oder prüfen
summary: Standardmäßige OpenClaw-Agentenanweisungen und Skills-Liste für die Einrichtung des persönlichen Assistenten
title: Standard-AGENTS.md
x-i18n:
    generated_at: "2026-06-27T18:08:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Erster Lauf (empfohlen)

OpenClaw verwendet ein eigenes Workspace-Verzeichnis für den Agent. Standard: `~/.openclaw/workspace` (konfigurierbar über `agents.defaults.workspace`).

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

4. Optional: Wählen Sie einen anderen Workspace, indem Sie `agents.defaults.workspace` setzen (unterstützt `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Sicherheitsstandards

- Geben Sie keine Verzeichnisse oder Secrets im Chat aus.
- Führen Sie keine destruktiven Befehle aus, sofern Sie nicht ausdrücklich darum gebeten werden.
- Prüfen Sie vor dem Ändern von Konfigurationen oder Schedulern (zum Beispiel crontab, systemd-Units, nginx-Konfigurationen oder Shell-rc-Dateien) zuerst den bestehenden Zustand und bewahren/führen Sie standardmäßig zusammen.
- Senden Sie keine teilweisen/streamenden Antworten an externe Messaging-Oberflächen (nur finale Antworten).

## Vorabprüfung vorhandener Lösungen

Bevor Sie ein eigenes System, Feature, einen Workflow, ein Tool, eine Integration oder eine Automatisierung vorschlagen oder bauen, prüfen Sie kurz, ob Open-Source-Projekte, gepflegte Bibliotheken, vorhandene OpenClaw-Plugins oder kostenlose Plattformen dies bereits gut genug lösen. Bevorzugen Sie diese, wenn sie geeignet sind. Bauen Sie nur dann individuell, wenn vorhandene Optionen ungeeignet, zu teuer, ungepflegt, unsicher, nicht konform sind oder der Benutzer ausdrücklich eine individuelle Lösung verlangt. Vermeiden Sie Empfehlungen für kostenpflichtige Dienste, sofern der Benutzer Ausgaben nicht ausdrücklich genehmigt. Halten Sie dies schlank: eine Vorabprüfung, kein umfassender Rechercheauftrag.

## Sitzungsstart (erforderlich)

- Lesen Sie `SOUL.md`, `USER.md` sowie heute+gestern in `memory/`.
- Lesen Sie `MEMORY.md`, falls vorhanden.
- Tun Sie dies vor der Antwort.

## Soul (erforderlich)

- `SOUL.md` definiert Identität, Ton und Grenzen. Halten Sie sie aktuell.
- Wenn Sie `SOUL.md` ändern, sagen Sie es dem Benutzer.
- Sie sind in jeder Sitzung eine neue Instanz; Kontinuität lebt in diesen Dateien.

## Gemeinsame Bereiche (empfohlen)

- Sie sind nicht die Stimme des Benutzers; seien Sie in Gruppenchats oder öffentlichen Kanälen vorsichtig.
- Teilen Sie keine privaten Daten, Kontaktdaten oder internen Notizen.

## Memory-System (empfohlen)

- Tagesprotokoll: `memory/YYYY-MM-DD.md` (erstellen Sie bei Bedarf `memory/`).
- Langzeit-Memory: `MEMORY.md` für dauerhafte Fakten, Präferenzen und Entscheidungen.
- Kleingeschriebenes `memory.md` ist nur Eingabe für Legacy-Reparaturen; behalten Sie nicht absichtlich beide Root-Dateien.
- Lesen Sie beim Sitzungsstart heute + gestern + `MEMORY.md`, falls vorhanden.
- Lesen Sie Memory-Dateien vor dem Schreiben zuerst; schreiben Sie nur konkrete Aktualisierungen, nie leere Platzhalter.
- Erfassen: Entscheidungen, Präferenzen, Einschränkungen, offene Schleifen.
- Vermeiden Sie Secrets, sofern nicht ausdrücklich angefordert.

## Tools und Skills

- Tools befinden sich in Skills; folgen Sie bei Bedarf der jeweiligen `SKILL.md` des Skills.
- Halten Sie umgebungsspezifische Notizen in `TOOLS.md` (Notizen für Skills).

## Backup-Tipp (empfohlen)

Wenn Sie diesen Workspace als „Memory“ von Clawd behandeln, machen Sie ihn zu einem Git-Repo (idealerweise privat), damit `AGENTS.md` und Ihre Memory-Dateien gesichert sind.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Was OpenClaw macht

- Führt WhatsApp-Gateway + eingebetteten OpenClaw-Agent aus, damit der Assistent Chats lesen/schreiben, Kontext abrufen und Skills über den Host-Mac ausführen kann.
- Die macOS-App verwaltet Berechtigungen (Bildschirmaufnahme, Benachrichtigungen, Mikrofon) und stellt die `openclaw`-CLI über ihre gebündelte Binärdatei bereit.
- Direkte Chats werden standardmäßig in die `main`-Sitzung des Agent zusammengeführt; Gruppen bleiben als `agent:<agentId>:<channel>:group:<id>` isoliert (Räume/Kanäle: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats halten Hintergrundaufgaben aktiv.

## Kern-Skills (in Einstellungen → Skills aktivieren)

- **mcporter** - Tool-Server-Runtime/CLI zum Verwalten externer Skill-Backends.
- **Peekaboo** - Schnelle macOS-Screenshots mit optionaler KI-Bildanalyse.
- **camsnap** - Frames, Clips oder Bewegungsalarme von RTSP/ONVIF-Überwachungskameras erfassen.
- **oracle** - OpenAI-fähige Agent-CLI mit Sitzungswiedergabe und Browsersteuerung.
- **eightctl** - Steuern Sie Ihren Schlaf über das Terminal.
- **imsg** - iMessage & SMS senden, lesen und streamen.
- **wacli** - WhatsApp-CLI: synchronisieren, suchen, senden.
- **discord** - Discord-Aktionen: Reaktionen, Sticker, Umfragen. Verwenden Sie Ziele wie `user:<id>` oder `channel:<id>` (bloße numerische IDs sind mehrdeutig).
- **gog** - Google-Suite-CLI: Gmail, Kalender, Drive, Kontakte.
- **spotify-player** - Terminal-Spotify-Client zum Suchen, Einreihen und Steuern der Wiedergabe.
- **sag** - ElevenLabs-Sprachausgabe mit mac-ähnlicher say-UX; streamt standardmäßig an Lautsprecher.
- **Sonos CLI** - Sonos-Lautsprecher (Entdeckung/Status/Wiedergabe/Lautstärke/Gruppierung) aus Skripten steuern.
- **blucli** - BluOS-Player aus Skripten abspielen, gruppieren und automatisieren.
- **OpenHue CLI** - Philips-Hue-Lichtsteuerung für Szenen und Automatisierungen.
- **OpenAI Whisper** - Lokale Sprache-zu-Text-Umwandlung für schnelle Diktate und Voicemail-Transkripte.
- **Gemini CLI** - Google-Gemini-Modelle aus dem Terminal für schnelle Fragen und Antworten.
- **agent-tools** - Hilfs-Toolkit für Automatisierungen und Hilfsskripte.

## Nutzungshinweise

- Bevorzugen Sie die `openclaw`-CLI für Skripting; die Mac-App übernimmt Berechtigungen.
- Führen Sie Installationen über den Skills-Tab aus; er blendet die Schaltfläche aus, wenn bereits eine Binärdatei vorhanden ist.
- Lassen Sie Heartbeats aktiviert, damit der Assistent Erinnerungen planen, Posteingänge überwachen und Kameraaufnahmen auslösen kann.
- Die Canvas-UI läuft im Vollbildmodus mit nativen Overlays. Platzieren Sie keine kritischen Bedienelemente am oberen linken, oberen rechten oder unteren Rand; fügen Sie explizite Innenabstände im Layout hinzu und verlassen Sie sich nicht auf Safe-Area-Inset-Werte.
- Verwenden Sie für browsergestützte Verifikation `openclaw browser` (Tabs/Status/Screenshot) mit dem von OpenClaw verwalteten Chrome-Profil.
- Verwenden Sie für DOM-Inspektion `openclaw browser eval|query|dom|snapshot` (und `--json`/`--out`, wenn Sie maschinenlesbare Ausgabe benötigen).
- Verwenden Sie für Interaktionen `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type erfordern Snapshot-Refs; verwenden Sie `evaluate` für CSS-Selektoren).

## Verwandt

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Agent-Runtime](/de/concepts/agent)
