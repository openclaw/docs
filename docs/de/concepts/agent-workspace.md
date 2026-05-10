---
read_when:
    - Sie müssen den Agent-Arbeitsbereich oder dessen Dateistruktur erklären
    - Sie möchten einen Agent-Arbeitsbereich sichern oder migrieren
sidebarTitle: Agent workspace
summary: 'Agenten-Arbeitsbereich: Speicherort, Struktur und Sicherungsstrategie'
title: Agenten-Arbeitsbereich
x-i18n:
    generated_at: "2026-05-10T19:30:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Der Workspace ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für Datei-Tools und Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn als Gedächtnis.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldedaten und Sitzungen gespeichert werden.

<Warning>
Der Workspace ist das **standardmäßige cwd**, keine harte Sandbox. Tools lösen relative Pfade relativ zum Workspace auf, aber absolute Pfade können weiterhin andere Stellen auf dem Host erreichen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie [`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine agentenspezifische Sandbox-Konfiguration).

Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools in einem Sandbox-Workspace unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Workspace.
</Warning>

## Standardort

- Standard: `~/.openclaw/workspace`
- Wenn `OPENCLAW_PROFILE` gesetzt ist und nicht `"default"` ist, wird der Standard zu `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellt den Workspace und befüllt die Bootstrap-Dateien, falls sie fehlen.

<Note>
Sandbox-Seed-Kopien akzeptieren nur reguläre Dateien innerhalb des Workspace; Symlink-/Hardlink-Aliase, die außerhalb des Quell-Workspace auflösen, werden ignoriert.
</Note>

Wenn Sie die Workspace-Dateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-Dateien deaktivieren:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Workspace-Verzeichnisse beizubehalten kann zu verwirrenden Authentifizierungs- oder Zustandsabweichungen führen, da immer nur ein Workspace aktiv ist.

<Note>
**Empfehlung:** Behalten Sie einen einzigen aktiven Workspace. Wenn Sie die zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`). Wenn Sie absichtlich mehrere Workspaces behalten, stellen Sie sicher, dass `agents.defaults.workspace` auf den aktiven zeigt.

`openclaw doctor` warnt, wenn zusätzliche Workspace-Verzeichnisse erkannt werden.
</Note>

## Workspace-Dateizuordnung

Dies sind die Standarddateien, die OpenClaw innerhalb des Workspace erwartet:

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    Betriebsanweisungen für den Agenten und dazu, wie er das Gedächtnis verwenden soll. Wird zu Beginn jeder Sitzung geladen. Ein guter Ort für Regeln, Prioritäten und Details dazu, „wie er sich verhalten soll“.
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    Persona, Ton und Grenzen. Wird in jeder Sitzung geladen. Leitfaden: [SOUL.md-Persönlichkeitsleitfaden](/de/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - who the user is">
    Wer der Benutzer ist und wie er angesprochen werden soll. Wird in jeder Sitzung geladen.
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    Name, Stimmung und Emoji des Agenten. Wird während des Bootstrap-Rituals erstellt/aktualisiert.
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    Notizen zu Ihren lokalen Tools und Konventionen. Steuert nicht die Tool-Verfügbarkeit; es dient nur als Anleitung.
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Optionale kleine Checkliste für Heartbeat-Läufe. Halten Sie sie kurz, um Token-Verbrauch zu vermeiden.
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Optionale Startcheckliste, die beim Neustart des Gateway automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind). Halten Sie sie kurz; verwenden Sie das Nachrichten-Tool für ausgehende Sendungen.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    Einmaliges Ritual beim ersten Start. Wird nur für einen brandneuen Workspace erstellt. Löschen Sie es, nachdem das Ritual abgeschlossen ist.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    Tägliches Gedächtnisprotokoll (eine Datei pro Tag). Empfohlen wird, beim Sitzungsstart heute + gestern zu lesen.
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    Kuratiertes Langzeitgedächtnis: dauerhafte Fakten, Präferenzen, Entscheidungen und kurze Zusammenfassungen. Bewahren Sie detaillierte Protokolle in `memory/YYYY-MM-DD.md` auf, damit Gedächtnis-Tools sie bei Bedarf abrufen können, ohne sie in jeden Prompt einzufügen. Laden Sie `MEMORY.md` nur in der privaten Hauptsitzung (nicht in geteilten/Gruppenkontexten). Siehe [Gedächtnis](/de/concepts/memory) für den Workflow und das automatische Leeren des Gedächtnisses.
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    Workspace-spezifische Skills. Skill-Speicherort mit höchster Priorität für diesen Workspace. Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    Canvas-UI-Dateien für Node-Anzeigen (zum Beispiel `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw eine Markierung „fehlende Datei“ in die Sitzung ein und fährt fort. Große Bootstrap-Dateien werden beim Einfügen gekürzt; passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 12000) und `agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an. `openclaw setup` kann fehlende Standards neu erstellen, ohne vorhandene Dateien zu überschreiben.
</Note>

## Was NICHT im Workspace liegt

Diese befinden sich unter `~/.openclaw/` und sollten NICHT in das Workspace-Repo committed werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Authentifizierungsprofile: OAuth + API-Schlüssel)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (agentenspezifisches Codex-Laufzeitkonto, Konfiguration, Skills, Plugins und nativer Thread-Zustand)
- `~/.openclaw/credentials/` (Kanal-/Provider-Zustand plus ältere OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie aus der Versionskontrolle heraus.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Workspace als privates Gedächtnis. Legen Sie ihn in einem **privaten** Git-Repo ab, damit er gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem das Gateway läuft (dort befindet sich der Workspace).

<Steps>
  <Step title="Initialize the repo">
    Wenn Git installiert ist, werden brandneue Workspaces automatisch initialisiert. Wenn dieser Workspace noch kein Repo ist, führen Sie Folgendes aus:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Erstellen Sie ein neues **privates** Repository auf GitHub.
        2. Nicht mit einer README initialisieren (vermeidet Merge-Konflikte).
        3. Kopieren Sie die HTTPS-Remote-URL.
        4. Fügen Sie den Remote hinzu und pushen Sie:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. Erstellen Sie ein neues **privates** Repository auf GitLab.
        2. Nicht mit einer README initialisieren (vermeidet Merge-Konflikte).
        3. Kopieren Sie die HTTPS-Remote-URL.
        4. Fügen Sie den Remote hinzu und pushen Sie:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Keine Secrets committen

<Warning>
Vermeiden Sie auch in einem privaten Repo, Secrets im Workspace zu speichern:

- API-Schlüssel, OAuth-Token, Passwörter oder private Anmeldedaten.
- Alles unter `~/.openclaw/`.
- Roh-Dumps von Chats oder sensiblen Anhängen.

Wenn Sie sensible Referenzen speichern müssen, verwenden Sie Platzhalter und bewahren Sie das echte Secret an anderer Stelle auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).
</Warning>

Vorgeschlagener `.gitignore`-Start:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Workspace auf einen neuen Rechner verschieben

<Steps>
  <Step title="Clone the repo">
    Klonen Sie das Repo in den gewünschten Pfad (Standard `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
  </Step>
  <Step title="Seed missing files">
    Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien zu befüllen.
  </Step>
  <Step title="Copy sessions (optional)">
    Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/sessions/` separat vom alten Rechner.
  </Step>
</Steps>

## Erweiterte Hinweise

- Multi-Agent-Routing kann unterschiedliche Workspaces pro Agent verwenden. Siehe [Kanalrouting](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen sitzungsspezifische Sandbox-Workspaces unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandt

- [Heartbeat](/de/gateway/heartbeat) - HEARTBEAT.md-Workspace-Datei
- [Sandboxing](/de/gateway/sandboxing) - Workspace-Zugriff in Sandbox-Umgebungen
- [Sitzung](/de/concepts/session) - Speicherpfade für Sitzungen
- [Dauerhafte Anweisungen](/de/automation/standing-orders) - persistente Anweisungen in Workspace-Dateien
