---
read_when:
    - Sie müssen den Arbeitsbereich des Agenten oder dessen Dateistruktur erläutern.
    - Sie möchten einen Agenten-Arbeitsbereich sichern oder migrieren
sidebarTitle: Agent workspace
summary: 'Agent-Arbeitsbereich: Speicherort, Struktur und Sicherungsstrategie'
title: Agenten-Arbeitsbereich
x-i18n:
    generated_at: "2026-07-12T15:12:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e09c26d19dd7926b379ae4d094c98c2a2f5b37b9453a4cc2048c3b212ae5a9c2
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Der Workspace ist das Zuhause des Agenten: das Arbeitsverzeichnis, das für Datei-Tools
und den Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn als Gedächtnis.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldedaten und Sitzungen gespeichert werden.

<Warning>
Der Workspace ist das **standardmäßige cwd**, keine strikte Sandbox. Tools lösen relative Pfade anhand des Workspace auf, absolute Pfade können jedoch weiterhin auf andere Bereiche des Hosts zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie [`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine agentenspezifische Sandbox-Konfiguration).

Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools in einem Sandbox-Workspace unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Workspace.
</Warning>

## Standardspeicherort

- Standard: `~/.openclaw/workspace`
- Wenn `OPENCLAW_PROFILE` gesetzt und nicht `"default"` ist, wird `~/.openclaw/workspace-<profile>` zum Standard.
- Wenn `OPENCLAW_WORKSPACE_DIR` gesetzt ist, überschreibt es beide vorstehenden Einstellungen.
- Nicht standardmäßige Agenten (`agents.list[]`) ohne expliziten Workspace werden zu `<state-dir>/workspace-<agentId>` aufgelöst, nicht zum gemeinsamen Standard-Workspace.

Überschreiben Sie dies in `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Agentenspezifische Überschreibung: `agents.list[].workspace`.

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellen den Workspace und legen die Bootstrap-Dateien an, wenn sie fehlen.

<Note>
Beim Befüllen der Sandbox werden nur reguläre Dateien innerhalb des Workspace kopiert; Symlink-/Hardlink-Aliasse, die auf Ziele außerhalb des Quell-Workspace verweisen, werden ignoriert.
</Note>

Wenn Sie die Workspace-Dateien bereits selbst verwalten, deaktivieren Sie die Erstellung von Bootstrap-Dateien:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Workspace-Verzeichnisse können zu verwirrenden Abweichungen bei Authentifizierung oder Zustand führen, da jeweils nur ein Workspace aktiv ist.

<Note>
**Empfehlung:** Behalten Sie einen einzigen aktiven Workspace. Wenn Sie die zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`). Wenn Sie absichtlich mehrere Workspaces beibehalten, stellen Sie sicher, dass `agents.defaults.workspace` (oder der agentenspezifische Schlüssel `workspace`) auf den aktiven Workspace verweist.
</Note>

## Übersicht der Workspace-Dateien

Standarddateien, die OpenClaw im Workspace erwartet:

<AccordionGroup>
  <Accordion title="AGENTS.md – Betriebsanweisungen">
    Betriebsanweisungen für den Agenten und zur Verwendung des Gedächtnisses. Wird zu Beginn jeder Sitzung geladen. Ein guter Ort für Regeln, Prioritäten und Details zum gewünschten Verhalten.
  </Accordion>
  <Accordion title="SOUL.md – Persönlichkeit und Ton">
    Persönlichkeit, Ton und Grenzen. Wird in jeder Sitzung geladen. Leitfaden: [Leitfaden zur Persönlichkeit in SOUL.md](/de/concepts/soul).
  </Accordion>
  <Accordion title="USER.md – Informationen zum Benutzer">
    Wer der Benutzer ist und wie er angesprochen werden soll. Wird in jeder Sitzung geladen.
  </Accordion>
  <Accordion title="IDENTITY.md – Name, Ausstrahlung, Emoji">
    Name, Ausstrahlung und Emoji des Agenten. Wird während des Bootstrap-Rituals erstellt oder aktualisiert.
  </Accordion>
  <Accordion title="TOOLS.md – lokale Tool-Konventionen">
    Hinweise zu Ihren lokalen Tools und Konventionen. Steuert nicht die Verfügbarkeit von Tools, sondern dient nur als Orientierung.
  </Accordion>
  <Accordion title="HEARTBEAT.md – Heartbeat-Checkliste">
    Optionale kurze Checkliste für Heartbeat-Ausführungen. Halten Sie sie kurz, um unnötigen Tokenverbrauch zu vermeiden.
  </Accordion>
  <Accordion title="BOOT.md – Startcheckliste">
    Optionale Startcheckliste, die bei einem Neustart des Gateway automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind). Halten Sie sie kurz; verwenden Sie das Nachrichten-Tool für ausgehende Nachrichten.
  </Accordion>
  <Accordion title="BOOTSTRAP.md – Ritual bei der ersten Ausführung">
    Einmaliges Ritual bei der ersten Ausführung. Wird nur für einen völlig neuen Workspace erstellt. Löschen Sie die Datei, nachdem das Ritual abgeschlossen ist.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md – tägliches Gedächtnisprotokoll">
    Tägliches Gedächtnisprotokoll (eine Datei pro Tag). Es wird empfohlen, beim Sitzungsstart die Einträge von heute und gestern zu lesen.
  </Accordion>
  <Accordion title="MEMORY.md – kuratiertes Langzeitgedächtnis (optional)">
    Kuratiertes Langzeitgedächtnis: dauerhafte Fakten, Präferenzen, Entscheidungen und kurze Zusammenfassungen. Bewahren Sie detaillierte Protokolle in `memory/YYYY-MM-DD.md` auf, damit Gedächtnis-Tools sie bei Bedarf abrufen können, ohne sie in jeden Prompt einzufügen. Laden Sie `MEMORY.md` nur in der privaten Hauptsitzung (nicht in gemeinsamen oder Gruppenkontexten). Siehe [Gedächtnis](/de/concepts/memory) für den Arbeitsablauf und die automatische Speicherung des Gedächtnisses.
  </Accordion>
  <Accordion title="skills/ – Workspace-Skills (optional)">
    Workspace-spezifische Skills. Der Skill-Speicherort mit der höchsten Priorität für diesen Workspace, noch vor Projekt-Agenten-Skills, persönlichen Agenten-Skills, verwalteten Skills, mitgelieferten Skills und `skills.load.extraDirs`, wenn Namen kollidieren.
  </Accordion>
  <Accordion title="canvas/ – Canvas-UI-Dateien (optional)">
    Canvas-UI-Dateien für Node-Anzeigen (zum Beispiel `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw eine Markierung für eine „fehlende Datei“ in die Sitzung ein und fährt fort. Große Bootstrap-Dateien werden beim Einfügen gekürzt; passen Sie die Grenzen mit `agents.defaults.bootstrapMaxChars` (Standard: `20000`) und `agents.defaults.bootstrapTotalMaxChars` (Standard: `60000`) an. `openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene Dateien zu überschreiben.
</Note>

## Was sich NICHT im Workspace befindet

Diese Elemente befinden sich unter `~/.openclaw/` und sollten NICHT in das Workspace-Repository eingecheckt werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Authentifizierungsprofile: OAuth + API-Schlüssel)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (Sitzungszeilen, Transkripte und agentenspezifischer Laufzeitzustand)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (agentenspezifisches Codex-Laufzeitkonto, Konfiguration, Skills, Plugins und nativer Thread-Zustand)
- `~/.openclaw/credentials/` (Kanal-/Provider-Zustand sowie ältere OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Quellen für ältere Migrationen und Archiv-/Support-Artefakte)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfigurationen migrieren müssen, kopieren Sie sie separat und halten Sie sie von der Versionsverwaltung fern.

## Git-Sicherung (empfohlen, privat)

Behandeln Sie den Workspace als privates Gedächtnis. Legen Sie ihn in einem **privaten** Git-Repository ab, damit er gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Computer aus, auf dem der Gateway läuft (dort befindet sich der Workspace).

<Steps>
  <Step title="Repository initialisieren">
    Wenn Git installiert ist, werden völlig neue Workspaces automatisch initialisiert. Falls dieser Workspace noch kein Repository ist, führen Sie Folgendes aus:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Privates Remote-Repository hinzufügen">
    <Tabs>
      <Tab title="GitHub-Weboberfläche">
        1. Erstellen Sie auf GitHub ein neues **privates** Repository.
        2. Initialisieren Sie es nicht mit einer README (dies vermeidet Merge-Konflikte).
        3. Kopieren Sie die HTTPS-Remote-URL.
        4. Fügen Sie das Remote-Repository hinzu und übertragen Sie die Änderungen:

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
      <Tab title="GitLab-Weboberfläche">
        1. Erstellen Sie auf GitLab ein neues **privates** Repository.
        2. Initialisieren Sie es nicht mit einer README (dies vermeidet Merge-Konflikte).
        3. Kopieren Sie die HTTPS-Remote-URL.
        4. Fügen Sie das Remote-Repository hinzu und übertragen Sie die Änderungen:

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

## Keine Geheimnisse einchecken

<Warning>
Vermeiden Sie es selbst in einem privaten Repository, Geheimnisse im Workspace zu speichern:

- API-Schlüssel, OAuth-Token, Passwörter oder private Anmeldedaten.
- Jegliche Inhalte unter `~/.openclaw/`.
- Ungefilterte Exporte von Chats oder vertraulichen Anhängen.

Wenn Sie vertrauliche Verweise speichern müssen, verwenden Sie Platzhalter und bewahren Sie das eigentliche Geheimnis an einem anderen Ort auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).
</Warning>

Vorschlag für eine `.gitignore`-Ausgangsdatei:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Workspace auf einen neuen Computer verschieben

<Steps>
  <Step title="Repository klonen">
    Klonen Sie das Repository in den gewünschten Pfad (standardmäßig `~/.openclaw/workspace`).
  </Step>
  <Step title="Konfiguration aktualisieren">
    Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
  </Step>
  <Step title="Fehlende Dateien anlegen">
    Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien anzulegen.
  </Step>
  <Step title="Sitzungen kopieren (optional)">
    Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
    separat vom alten Computer. Kopieren Sie `~/.openclaw/agents/<agentId>/sessions/`
    nur, wenn Sie auch Eingaben für ältere Migrationen oder Archiv-/Support-Artefakte benötigen.
  </Step>
</Steps>

## Erweiterte Hinweise

- Beim Multi-Agent-Routing können über `agents.list[].workspace` unterschiedliche Workspaces pro Agent verwendet werden. Informationen zur Routing-Konfiguration finden Sie unter [Kanal-Routing](/de/channels/channel-routing).
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen sitzungsspezifische Sandbox-Workspaces unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandte Themen

- [Heartbeat](/de/gateway/heartbeat) – Workspace-Datei HEARTBEAT.md
- [Sandboxing](/de/gateway/sandboxing) – Workspace-Zugriff in Sandbox-Umgebungen
- [Sitzung](/de/concepts/session) – Speicherpfade für Sitzungen
- [Dauerhafte Anweisungen](/de/automation/standing-orders) – persistente Anweisungen in Workspace-Dateien
