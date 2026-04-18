---
read_when:
    - Sie müssen den Arbeitsbereich des Agenten oder dessen Dateilayout erklären.
    - Sie möchten einen Arbeitsbereich eines Agenten sichern oder migrieren.
summary: 'Arbeitsbereich des Agenten: Speicherort, Layout und Backup-Strategie'
title: Arbeitsbereich des Agenten
x-i18n:
    generated_at: "2026-04-18T06:12:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Arbeitsbereich des Agenten

Der Arbeitsbereich ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für
Datei-Tools und für den Arbeitsbereichskontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn wie Speicher.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldedaten und
Sitzungen gespeichert werden.

**Wichtig:** Der Arbeitsbereich ist das **standardmäßige cwd**, keine harte Sandbox. Tools
lösen relative Pfade relativ zum Arbeitsbereich auf, aber absolute Pfade können weiterhin
andere Bereiche des Hosts erreichen, sofern keine Sandbox aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
[`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine Sandbox-Konfiguration pro Agent).
Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools
innerhalb eines Sandbox-Arbeitsbereichs unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Arbeitsbereich.

## Standardpfad

- Standard: `~/.openclaw/workspace`
- Wenn `OPENCLAW_PROFILE` gesetzt ist und nicht `"default"` lautet, wird der Standardpfad
  zu `~/.openclaw/workspace-<profile>`.
- Überschreiben in `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellen den
Arbeitsbereich und legen die Bootstrap-Dateien an, wenn sie fehlen.
Kopien für den Sandbox-Seed akzeptieren nur reguläre Dateien innerhalb des Arbeitsbereichs; Symlink-/Hardlink-
Aliasse, die außerhalb des Quell-Arbeitsbereichs aufgelöst werden, werden ignoriert.

Wenn Sie die Dateien im Arbeitsbereich bereits selbst verwalten, können Sie die Erstellung von Bootstrap-Dateien deaktivieren:

```json5
{ agent: { skipBootstrap: true } }
```

## Zusätzliche Arbeitsbereichsordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Arbeitsbereichsverzeichnisse
gleichzeitig zu behalten, kann zu verwirrender Drift bei Authentifizierung oder Status führen, da jeweils
nur ein Arbeitsbereich aktiv ist.

**Empfehlung:** Behalten Sie einen einzelnen aktiven Arbeitsbereich. Wenn Sie die
zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`).
Wenn Sie absichtlich mehrere Arbeitsbereiche behalten, stellen Sie sicher, dass
`agents.defaults.workspace` auf den aktiven zeigt.

`openclaw doctor` warnt, wenn zusätzliche Arbeitsbereichsverzeichnisse erkannt werden.

## Dateizuordnung des Arbeitsbereichs (was jede Datei bedeutet)

Dies sind die Standarddateien, die OpenClaw im Arbeitsbereich erwartet:

- `AGENTS.md`
  - Betriebsanweisungen für den Agenten und wie er Speicher verwenden soll.
  - Wird zu Beginn jeder Sitzung geladen.
  - Ein guter Ort für Regeln, Prioritäten und Details dazu, „wie man sich verhalten soll“.

- `SOUL.md`
  - Persona, Tonfall und Grenzen.
  - Wird in jeder Sitzung geladen.
  - Leitfaden: [SOUL.md Personality Guide](/de/concepts/soul)

- `USER.md`
  - Wer der Benutzer ist und wie er angesprochen werden soll.
  - Wird in jeder Sitzung geladen.

- `IDENTITY.md`
  - Name, Ausstrahlung und Emoji des Agenten.
  - Wird während des Bootstrap-Rituals erstellt/aktualisiert.

- `TOOLS.md`
  - Hinweise zu Ihren lokalen Tools und Konventionen.
  - Steuert nicht die Verfügbarkeit von Tools; es dient nur als Orientierung.

- `HEARTBEAT.md`
  - Optionale kleine Checkliste für Heartbeat-Läufe.
  - Halten Sie sie kurz, um Token-Verbrauch zu vermeiden.

- `BOOT.md`
  - Optionale Start-Checkliste, die beim Neustart des Gateway ausgeführt wird, wenn interne Hooks aktiviert sind.
  - Halten Sie sie kurz; verwenden Sie das Nachrichtentool für ausgehende Nachrichten.

- `BOOTSTRAP.md`
  - Einmaliges Ritual beim ersten Start.
  - Wird nur für einen brandneuen Arbeitsbereich erstellt.
  - Löschen Sie sie, nachdem das Ritual abgeschlossen ist.

- `memory/YYYY-MM-DD.md`
  - Tägliches Speicherprotokoll (eine Datei pro Tag).
  - Empfohlen: beim Sitzungsstart den heutigen und den gestrigen Eintrag lesen.

- `MEMORY.md` (optional)
  - Kuratierter Langzeitspeicher.
  - Nur in der Hauptsitzung im privaten Kontext laden (nicht in geteilten/Gruppenkontexten).

Siehe [Memory](/de/concepts/memory) für den Workflow und das automatische Speichern von Speicherinhalten.

- `skills/` (optional)
  - Arbeitsbereichsspezifische Skills.
  - Speicherort mit der höchsten Priorität für Skills in diesem Arbeitsbereich.
  - Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.

- `canvas/` (optional)
  - Canvas-UI-Dateien für Node-Anzeigen (zum Beispiel `canvas/index.html`).

Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw der Sitzung einen Marker für eine „fehlende Datei“ hinzu
und fährt fort. Große Bootstrap-Dateien werden beim Einfügen gekürzt;
passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 12000) und
`agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an.
`openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene
Dateien zu überschreiben.

## Was NICHT im Arbeitsbereich ist

Diese befinden sich unter `~/.openclaw/` und sollten NICHT in das Arbeitsbereichs-Repo eingecheckt werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Authentifizierungsprofile: OAuth + API-Schlüssel)
- `~/.openclaw/credentials/` (Kanal-/Provider-Status plus ältere OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie
aus der Versionskontrolle heraus.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Arbeitsbereich als privaten Speicher. Legen Sie ihn in ein **privates** Git-Repo, damit er
gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem das Gateway läuft (dort befindet sich der
Arbeitsbereich).

### 1) Das Repo initialisieren

Wenn Git installiert ist, werden brandneue Arbeitsbereiche automatisch initialisiert. Wenn dieser
Arbeitsbereich noch kein Repo ist, führen Sie Folgendes aus:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Ein privates Remote hinzufügen (einsteigerfreundliche Optionen)

Option A: GitHub-Weboberfläche

1. Erstellen Sie ein neues **privates** Repository auf GitHub.
2. Initialisieren Sie es nicht mit einer README-Datei (vermeidet Merge-Konflikte).
3. Kopieren Sie die HTTPS-Remote-URL.
4. Fügen Sie das Remote hinzu und pushen Sie:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Option B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Option C: GitLab-Weboberfläche

1. Erstellen Sie ein neues **privates** Repository auf GitLab.
2. Initialisieren Sie es nicht mit einer README-Datei (vermeidet Merge-Konflikte).
3. Kopieren Sie die HTTPS-Remote-URL.
4. Fügen Sie das Remote hinzu und pushen Sie:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Laufende Aktualisierungen

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Keine Geheimnisse einchecken

Selbst in einem privaten Repo sollten Sie keine Geheimnisse im Arbeitsbereich speichern:

- API-Schlüssel, OAuth-Token, Passwörter oder private Anmeldedaten.
- Alles unter `~/.openclaw/`.
- Rohe Dumps von Chats oder sensible Anhänge.

Wenn Sie sensible Verweise speichern müssen, verwenden Sie Platzhalter und bewahren Sie das eigentliche
Geheimnis an anderer Stelle auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).

Vorgeschlagener Starter für `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Den Arbeitsbereich auf einen neuen Rechner verschieben

1. Klonen Sie das Repo an den gewünschten Pfad (Standard: `~/.openclaw/workspace`).
2. Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
3. Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien anzulegen.
4. Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/sessions/` vom
   alten Rechner separat.

## Erweiterte Hinweise

- Multi-Agent-Routing kann unterschiedliche Arbeitsbereiche pro Agent verwenden. Siehe
  [Channel routing](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen Sandbox-
  Arbeitsbereiche pro Sitzung unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandt

- [Standing Orders](/de/automation/standing-orders) — persistente Anweisungen in Arbeitsbereichsdateien
- [Heartbeat](/de/gateway/heartbeat) — `HEARTBEAT.md`-Datei im Arbeitsbereich
- [Session](/de/concepts/session) — Speicherpfade für Sitzungen
- [Sandboxing](/de/gateway/sandboxing) — Arbeitsbereichszugriff in Sandbox-Umgebungen
