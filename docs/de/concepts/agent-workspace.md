---
read_when:
    - Sie müssen den Agent-Workspace oder dessen Dateiaufbau erklären
    - Sie möchten einen Agent-Workspace sichern oder migrieren
summary: 'Agent-Workspace: Speicherort, Aufbau und Backup-Strategie'
title: Agent-Workspace
x-i18n:
    generated_at: "2026-04-25T13:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Der Workspace ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für Dateitools und für den Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn wie Erinnerung.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Zugangsdaten und Sitzungen gespeichert werden.

**Wichtig:** Der Workspace ist das **Standard-cwd**, keine harte Sandbox. Tools
lösen relative Pfade gegen den Workspace auf, aber absolute Pfade können
weiterhin andere Bereiche des Hosts erreichen, sofern keine Sandbox aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
[`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine Sandbox-Konfiguration pro Agent).
Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools
innerhalb eines Sandbox-Workspace unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Workspace.

## Standardspeicherort

- Standard: `~/.openclaw/workspace`
- Wenn `OPENCLAW_PROFILE` gesetzt ist und nicht `"default"` ist, wird der Standard zu
  `~/.openclaw/workspace-<profile>`.
- Überschreiben in `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellen den
Workspace und legen die Bootstrap-Dateien an, wenn sie fehlen.
Seed-Kopien für die Sandbox akzeptieren nur reguläre Dateien innerhalb des Workspace; Symlink-/Hardlink-
Aliasse, die außerhalb des Quell-Workspace aufgelöst werden, werden ignoriert.

Wenn Sie die Workspace-Dateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-
Dateien deaktivieren:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere vorhandene
Workspace-Verzeichnisse können zu verwirrenden Abweichungen bei Authentifizierung oder Zustand führen,
weil immer nur ein Workspace aktiv ist.

**Empfehlung:** Behalten Sie einen einzigen aktiven Workspace. Wenn Sie die
zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`).
Wenn Sie absichtlich mehrere Workspaces behalten, stellen Sie sicher, dass
`agents.defaults.workspace` auf den aktiven zeigt.

`openclaw doctor` warnt, wenn zusätzliche Workspace-Verzeichnisse erkannt werden.

## Workspace-Dateizuordnung (Bedeutung der einzelnen Dateien)

Dies sind die Standarddateien, die OpenClaw innerhalb des Workspace erwartet:

- `AGENTS.md`
  - Betriebsanweisungen für den Agenten und wie er Erinnerung verwenden soll.
  - Wird zu Beginn jeder Sitzung geladen.
  - Ein guter Ort für Regeln, Prioritäten und Details dazu, „wie man sich verhalten soll“.

- `SOUL.md`
  - Persona, Ton und Grenzen.
  - Wird in jeder Sitzung geladen.
  - Leitfaden: [SOUL.md Personality Guide](/de/concepts/soul)

- `USER.md`
  - Wer der Benutzer ist und wie er angesprochen werden soll.
  - Wird in jeder Sitzung geladen.

- `IDENTITY.md`
  - Name, Vibe und Emoji des Agenten.
  - Wird während des Bootstrap-Rituals erstellt/aktualisiert.

- `TOOLS.md`
  - Hinweise zu Ihren lokalen Tools und Konventionen.
  - Steuert nicht die Verfügbarkeit von Tools; dient nur als Orientierung.

- `HEARTBEAT.md`
  - Optionale kleine Checkliste für Heartbeat-Läufe.
  - Kurz halten, um Tokenverbrauch zu vermeiden.

- `BOOT.md`
  - Optionale Start-Checkliste, die beim Gateway-Neustart automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind).
  - Kurz halten; für ausgehende Sendungen das Nachrichtentool verwenden.

- `BOOTSTRAP.md`
  - Einmaliges Ritual für den ersten Start.
  - Wird nur für einen brandneuen Workspace erstellt.
  - Nach Abschluss des Rituals löschen.

- `memory/YYYY-MM-DD.md`
  - Tägliches Erinnerungsprotokoll (eine Datei pro Tag).
  - Empfohlen: heute + gestern beim Sitzungsstart lesen.

- `MEMORY.md` (optional)
  - Kuratierte Langzeiterinnerung.
  - Nur in der privaten Hauptsitzung laden (nicht in geteilten/Gruppenkontexten).

Siehe [Memory](/de/concepts/memory) für den Workflow und das automatische Leeren der Erinnerung.

- `skills/` (optional)
  - Workspace-spezifische Skills.
  - Speicherort mit der höchsten Priorität für Skills in diesem Workspace.
  - Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.

- `canvas/` (optional)
  - Canvas-UI-Dateien für Node-Anzeigen (zum Beispiel `canvas/index.html`).

Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw der
Sitzung einen Marker für die fehlende Datei hinzu und fährt fort. Große Bootstrap-Dateien werden beim Einfügen gekürzt;
passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 12000) und
`agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an.
`openclaw setup` kann fehlende Standarddateien neu erstellen, ohne bestehende
Dateien zu überschreiben.

## Was sich NICHT im Workspace befindet

Diese Dinge liegen unter `~/.openclaw/` und sollten NICHT in das Workspace-Repository eingecheckt werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Auth-Profile: OAuth + API-Keys)
- `~/.openclaw/credentials/` (Kanal-/Provider-Zustand plus veraltete OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie
außerhalb der Versionsverwaltung.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Workspace als private Erinnerung. Legen Sie ihn in einem **privaten** Git-Repository ab, damit er
gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem das Gateway läuft (dort befindet sich der
Workspace).

### 1) Das Repository initialisieren

Wenn Git installiert ist, werden brandneue Workspaces automatisch initialisiert. Wenn dieser
Workspace noch kein Repository ist, führen Sie aus:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Ein privates Remote hinzufügen (einsteigerfreundliche Optionen)

Option A: GitHub-Web-UI

1. Erstellen Sie ein neues **privates** Repository auf GitHub.
2. Nicht mit einer README initialisieren (vermeidet Merge-Konflikte).
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

Option C: GitLab-Web-UI

1. Erstellen Sie ein neues **privates** Repository auf GitLab.
2. Nicht mit einer README initialisieren (vermeidet Merge-Konflikte).
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

## Keine Geheimnisse committen

Selbst in einem privaten Repository sollten Sie vermeiden, Geheimnisse im Workspace zu speichern:

- API-Keys, OAuth-Tokens, Passwörter oder private Zugangsdaten.
- Alles unter `~/.openclaw/`.
- Rohauszüge aus Chats oder sensible Anhänge.

Wenn Sie sensible Referenzen speichern müssen, verwenden Sie Platzhalter und bewahren Sie das eigentliche
Geheimnis anderswo auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).

Vorgeschlagener Start für `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Den Workspace auf einen neuen Rechner verschieben

1. Klonen Sie das Repository in den gewünschten Pfad (standardmäßig `~/.openclaw/workspace`).
2. Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
3. Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien anzulegen.
4. Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/sessions/` vom
   alten Rechner separat.

## Erweiterte Hinweise

- Multi-Agent-Routing kann verschiedene Workspaces pro Agent verwenden. Siehe
  [Channel routing](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen per Sitzung Sandbox-
  Workspaces unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandt

- [Standing Orders](/de/automation/standing-orders) — persistente Anweisungen in Workspace-Dateien
- [Heartbeat](/de/gateway/heartbeat) — Workspace-Datei `HEARTBEAT.md`
- [Session](/de/concepts/session) — Speicherpfade für Sitzungen
- [Sandboxing](/de/gateway/sandboxing) — Workspace-Zugriff in Sandbox-Umgebungen
