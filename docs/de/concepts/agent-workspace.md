---
read_when:
    - Sie müssen den Agenten-Arbeitsbereich oder dessen Dateistruktur erklären
    - Sie möchten einen Agenten-Arbeitsbereich sichern oder migrieren
sidebarTitle: Agent workspace
summary: 'Agent-Arbeitsbereich: Speicherort, Struktur und Backup-Strategie'
title: Agenten-Arbeitsbereich
x-i18n:
    generated_at: "2026-05-06T06:42:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Der Workspace ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für Datei-Tools und für Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn als Speicher.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Zugangsdaten und Sitzungen gespeichert werden.

<Warning>
Der Workspace ist die **standardmäßige cwd**, keine harte Sandbox. Tools lösen relative Pfade gegen den Workspace auf, aber absolute Pfade können weiterhin andere Stellen auf dem Host erreichen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie [`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine Sandbox-Konfiguration pro Agent).

Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools innerhalb eines Sandbox-Workspace unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Workspace.
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

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellt den Workspace und legt die Bootstrap-Dateien an, falls sie fehlen.

<Note>
Sandbox-Seed-Kopien akzeptieren nur reguläre Dateien innerhalb des Workspace; Symlink-/Hardlink-Aliasse, die außerhalb des Quell-Workspace aufgelöst werden, werden ignoriert.
</Note>

Wenn Sie die Workspace-Dateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-Dateien deaktivieren:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Workspace-Verzeichnisse beizubehalten, kann zu verwirrender Authentifizierungs- oder Zustandsdrift führen, da immer nur ein Workspace aktiv ist.

<Note>
**Empfehlung:** Behalten Sie einen einzigen aktiven Workspace. Wenn Sie die zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`). Wenn Sie absichtlich mehrere Workspaces beibehalten, stellen Sie sicher, dass `agents.defaults.workspace` auf den aktiven verweist.

`openclaw doctor` warnt, wenn zusätzliche Workspace-Verzeichnisse erkannt werden.
</Note>

## Workspace-Dateiübersicht

Dies sind die Standarddateien, die OpenClaw innerhalb des Workspace erwartet:

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    Betriebsanweisungen für den Agenten und dazu, wie er Speicher verwenden soll. Wird zu Beginn jeder Sitzung geladen. Ein guter Ort für Regeln, Prioritäten und Details zum gewünschten Verhalten.
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    Persona, Ton und Grenzen. Wird in jeder Sitzung geladen. Anleitung: [SOUL.md-Persönlichkeitsleitfaden](/de/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - who the user is">
    Wer der Benutzer ist und wie er angesprochen werden soll. Wird in jeder Sitzung geladen.
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    Name, Stimmung und Emoji des Agenten. Wird während des Bootstrap-Rituals erstellt/aktualisiert.
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    Notizen zu Ihren lokalen Tools und Konventionen. Steuert nicht die Tool-Verfügbarkeit; es dient nur als Orientierung.
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Optionale kleine Checkliste für Heartbeat-Läufe. Halten Sie sie kurz, um Token-Verbrauch zu vermeiden.
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Optionale Start-Checkliste, die beim Neustart des Gateway automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind). Halten Sie sie kurz; verwenden Sie das Nachrichten-Tool für ausgehende Sendungen.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    Einmaliges Ritual für den ersten Lauf. Wird nur für einen komplett neuen Workspace erstellt. Löschen Sie es, nachdem das Ritual abgeschlossen ist.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    Tägliches Speicherprotokoll (eine Datei pro Tag). Empfohlen: heute und gestern beim Sitzungsstart lesen.
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    Kuratierter Langzeitspeicher. Nur in der privaten Hauptsitzung laden (nicht in geteilten/Gruppenkontexten). Siehe [Speicher](/de/concepts/memory) für den Workflow und das automatische Leeren des Speichers.
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    Workspace-spezifische Skills. Skill-Speicherort mit höchster Priorität für diesen Workspace. Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    Canvas-UI-Dateien für Node-Anzeigen (zum Beispiel `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Wenn eine Bootstrap-Datei fehlt, injiziert OpenClaw eine Markierung für „fehlende Datei“ in die Sitzung und fährt fort. Große Bootstrap-Dateien werden beim Injizieren gekürzt; passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 12000) und `agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an. `openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene Dateien zu überschreiben.
</Note>

## Was NICHT im Workspace liegt

Diese befinden sich unter `~/.openclaw/` und sollten NICHT in das Workspace-Repo committed werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Authentifizierungsprofile: OAuth + API-Schlüssel)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (Codex-Laufzeitkonto pro Agent, Konfiguration, Skills, Plugins und nativer Thread-Zustand)
- `~/.openclaw/credentials/` (Channel-/Provider-Zustand plus alte OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie aus der Versionsverwaltung heraus.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Workspace als privaten Speicher. Legen Sie ihn in ein **privates** Git-Repo, damit er gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf der Maschine aus, auf der der Gateway läuft (dort befindet sich der Workspace).

<Steps>
  <Step title="Initialize the repo">
    Wenn Git installiert ist, werden komplett neue Workspaces automatisch initialisiert. Wenn dieser Workspace noch kein Repo ist, führen Sie Folgendes aus:

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

- API-Schlüssel, OAuth-Token, Passwörter oder private Zugangsdaten.
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

## Workspace auf eine neue Maschine verschieben

<Steps>
  <Step title="Clone the repo">
    Klonen Sie das Repo an den gewünschten Pfad (Standard: `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
  </Step>
  <Step title="Seed missing files">
    Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien anzulegen.
  </Step>
  <Step title="Copy sessions (optional)">
    Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/sessions/` separat von der alten Maschine.
  </Step>
</Steps>

## Erweiterte Hinweise

- Multi-Agent-Routing kann unterschiedliche Workspaces pro Agent verwenden. Siehe [Channel-Routing](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen Sandbox-Workspaces pro Sitzung unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandte Themen

- [Heartbeat](/de/gateway/heartbeat) - HEARTBEAT.md-Workspace-Datei
- [Sandboxing](/de/gateway/sandboxing) - Workspace-Zugriff in Sandbox-Umgebungen
- [Sitzung](/de/concepts/session) - Pfade für Sitzungsspeicher
- [Standing Orders](/de/automation/standing-orders) - Persistente Anweisungen in Workspace-Dateien
