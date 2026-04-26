---
read_when:
    - Sie müssen den Agenten-Workspace oder sein Dateilayout erklären
    - Sie möchten einen Agenten-Workspace sichern oder migrieren
sidebarTitle: Agent workspace
summary: 'Agenten-Workspace: Speicherort, Layout und Backup-Strategie'
title: Agenten-Workspace
x-i18n:
    generated_at: "2026-04-26T11:26:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Der Workspace ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für Datei-Tools und für den Workspace-Kontext verwendet wird. Behandeln Sie ihn als privat und wie Memory.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldedaten und Sitzungen gespeichert werden.

<Warning>
Der Workspace ist das **Standard-cwd**, keine harte Sandbox. Tools lösen relative Pfade gegen den Workspace auf, aber absolute Pfade können weiterhin andere Bereiche des Hosts erreichen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie [`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder agentenspezifische Sandbox-Konfiguration).

Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools innerhalb eines Sandbox-Workspace unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Workspace.
</Warning>

## Standardspeicherort

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

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellen den Workspace und legen die Bootstrap-Dateien an, wenn sie fehlen.

<Note>
Kopien für Sandbox-Seeding akzeptieren nur reguläre Dateien innerhalb des Workspace; Symlink-/Hardlink-Aliasse, die außerhalb des Quell-Workspace aufgelöst werden, werden ignoriert.
</Note>

Wenn Sie die Workspace-Dateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-Dateien deaktivieren:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Workspace-Verzeichnisse können zu verwirrendem Drift bei Authentifizierung oder Status führen, weil immer nur ein Workspace gleichzeitig aktiv ist.

<Note>
**Empfehlung:** Halten Sie nur einen aktiven Workspace. Wenn Sie die zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`). Wenn Sie absichtlich mehrere Workspaces behalten, stellen Sie sicher, dass `agents.defaults.workspace` auf den aktiven zeigt.

`openclaw doctor` warnt, wenn zusätzliche Workspace-Verzeichnisse erkannt werden.
</Note>

## Dateiübersicht des Workspace

Dies sind die Standarddateien, die OpenClaw im Workspace erwartet:

<AccordionGroup>
  <Accordion title="AGENTS.md — Betriebsanweisungen">
    Betriebsanweisungen für den Agenten und dazu, wie er Memory verwenden soll. Werden zu Beginn jeder Sitzung geladen. Ein guter Ort für Regeln, Prioritäten und Details dazu, „wie man sich verhalten soll“.
  </Accordion>
  <Accordion title="SOUL.md — Persona und Ton">
    Persona, Ton und Grenzen. Wird in jeder Sitzung geladen. Leitfaden: [SOUL.md personality guide](/de/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — wer der Benutzer ist">
    Wer der Benutzer ist und wie er angesprochen werden soll. Wird in jeder Sitzung geladen.
  </Accordion>
  <Accordion title="IDENTITY.md — Name, Vibe, Emoji">
    Name, Vibe und Emoji des Agenten. Wird während des Bootstrap-Rituals erstellt/aktualisiert.
  </Accordion>
  <Accordion title="TOOLS.md — lokale Tool-Konventionen">
    Hinweise zu Ihren lokalen Tools und Konventionen. Steuert nicht die Verfügbarkeit von Tools; dient nur als Orientierung.
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat-Checkliste">
    Optionale kleine Checkliste für Heartbeat-Durchläufe. Halten Sie sie kurz, um keinen Token-Verbrauch zu verschwenden.
  </Accordion>
  <Accordion title="BOOT.md — Start-Checkliste">
    Optionale Start-Checkliste, die beim Gateway-Neustart automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind). Halten Sie sie kurz; verwenden Sie das Nachrichten-Tool für ausgehende Sendungen.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — Ritual beim ersten Start">
    Einmaliges Ritual beim ersten Start. Wird nur für einen brandneuen Workspace erstellt. Löschen Sie die Datei, nachdem das Ritual abgeschlossen ist.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — tägliches Memory-Protokoll">
    Tägliches Memory-Protokoll (eine Datei pro Tag). Empfohlen wird, beim Sitzungsstart heute + gestern zu lesen.
  </Accordion>
  <Accordion title="MEMORY.md — kuratiertes Langzeit-Memory (optional)">
    Kuratiertes Langzeit-Memory. Nur in der privaten Hauptsitzung laden (nicht in gemeinsamen/Gruppenkontexten). Siehe [Memory](/de/concepts/memory) für den Workflow und das automatische Leeren von Memory.
  </Accordion>
  <Accordion title="skills/ — Workspace-Skills (optional)">
    Workspace-spezifische Skills. Skill-Speicherort mit der höchsten Priorität für diesen Workspace. Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.
  </Accordion>
  <Accordion title="canvas/ — Canvas-UI-Dateien (optional)">
    Canvas-UI-Dateien für Node-Displays (zum Beispiel `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Wenn eine Bootstrap-Datei fehlt, injiziert OpenClaw einen „missing file“-Marker in die Sitzung und fährt fort. Große Bootstrap-Dateien werden beim Injizieren abgeschnitten; passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 12000) und `agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an. `openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene Dateien zu überschreiben.
</Note>

## Was NICHT im Workspace ist

Diese Dateien liegen unter `~/.openclaw/` und sollten NICHT in das Workspace-Repo eingecheckt werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Authentifizierungsprofile für Modelle: OAuth + API-Schlüssel)
- `~/.openclaw/credentials/` (Kanal-/Provider-Status plus veraltete OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie aus der Versionsverwaltung heraus.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Workspace als privates Memory. Legen Sie ihn in ein **privates** Git-Repo, damit er gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem das Gateway läuft (dort befindet sich der Workspace).

<Steps>
  <Step title="Das Repo initialisieren">
    Wenn Git installiert ist, werden brandneue Workspaces automatisch initialisiert. Wenn dieser Workspace noch kein Repo ist, führen Sie aus:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Ein privates Remote hinzufügen">
    <Tabs>
      <Tab title="GitHub-Web-UI">
        1. Erstellen Sie auf GitHub ein neues **privates** Repository.
        2. Initialisieren Sie es nicht mit einer README-Datei (vermeidet Merge-Konflikte).
        3. Kopieren Sie die HTTPS-Remote-URL.
        4. Fügen Sie das Remote hinzu und pushen Sie:

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
      <Tab title="GitLab-Web-UI">
        1. Erstellen Sie auf GitLab ein neues **privates** Repository.
        2. Initialisieren Sie es nicht mit einer README-Datei (vermeidet Merge-Konflikte).
        3. Kopieren Sie die HTTPS-Remote-URL.
        4. Fügen Sie das Remote hinzu und pushen Sie:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Laufende Aktualisierungen">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Geheimnisse nicht committen

<Warning>
Auch in einem privaten Repo sollten Sie keine Geheimnisse im Workspace speichern:

- API-Schlüssel, OAuth-Tokens, Passwörter oder private Anmeldedaten.
- Alles unter `~/.openclaw/`.
- Rohdumps von Chats oder sensible Anhänge.

Wenn Sie sensible Referenzen speichern müssen, verwenden Sie Platzhalter und bewahren Sie das echte Geheimnis an anderer Stelle auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).
</Warning>

Empfohlene `.gitignore`-Vorlage:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Workspace auf einen neuen Rechner verschieben

<Steps>
  <Step title="Das Repo klonen">
    Klonen Sie das Repo an den gewünschten Pfad (Standard `~/.openclaw/workspace`).
  </Step>
  <Step title="Konfiguration aktualisieren">
    Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
  </Step>
  <Step title="Fehlende Dateien anlegen">
    Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien anzulegen.
  </Step>
  <Step title="Sitzungen kopieren (optional)">
    Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/sessions/` separat vom alten Rechner.
  </Step>
</Steps>

## Erweiterte Hinweise

- Multi-Agent-Routing kann für verschiedene Agenten unterschiedliche Workspaces verwenden. Siehe [Kanal-Routing](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen pro Sitzung Sandbox-Workspaces unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandt

- [Heartbeat](/de/gateway/heartbeat) — Workspace-Datei HEARTBEAT.md
- [Sandboxing](/de/gateway/sandboxing) — Workspace-Zugriff in sandboxed Umgebungen
- [Session](/de/concepts/session) — Pfade für Sitzungsspeicher
- [Standing orders](/de/automation/standing-orders) — persistente Anweisungen in Workspace-Dateien
