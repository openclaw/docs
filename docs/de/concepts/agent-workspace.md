---
read_when:
    - Sie müssen den Arbeitsbereich des Agenten oder dessen Dateistruktur erläutern.
    - Sie möchten einen Agenten-Workspace sichern oder migrieren
sidebarTitle: Agent workspace
summary: 'Agent-Arbeitsbereich: Speicherort, Struktur und Sicherungsstrategie'
title: Agent-Arbeitsbereich
x-i18n:
    generated_at: "2026-07-24T04:52:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b58ead9079c3dda4bcaec3253f8d55e67e7e554d5c5b87ccfec6b08ec4ba038f
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Der Workspace ist das Zuhause des Agenten: das Arbeitsverzeichnis, das für Dateiwerkzeuge
und den Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn als Gedächtnis.

Dies ist von `~/.openclaw/` getrennt, wo Konfiguration, Anmeldedaten und Sitzungen gespeichert werden.

<Warning>
Der Workspace ist das **standardmäßige aktuelle Arbeitsverzeichnis (cwd)**, keine feste Sandbox. Werkzeuge lösen relative Pfade anhand des Workspace auf, absolute Pfade können jedoch weiterhin auf andere Bereiche des Hosts zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie [`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine agentenspezifische Sandbox-Konfiguration).

Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, werden Werkzeuge in einem Sandbox-Workspace unter `~/.openclaw/sandboxes` ausgeführt, nicht in Ihrem Host-Workspace.
</Warning>

## Standardspeicherort

- Standard: `~/.openclaw/workspace`
- Wenn `OPENCLAW_PROFILE` gesetzt und nicht `"default"` ist, wird `~/.openclaw/workspace-<profile>` zum Standard.
- `OPENCLAW_WORKSPACE_DIR` überschreibt beide vorstehenden Einstellungen, wenn es gesetzt ist.
- Nicht standardmäßige Agenten (`agents.entries.*`) ohne expliziten Workspace werden in `<state-dir>/workspace-<agentId>` aufgelöst, nicht in den gemeinsamen Standard-Workspace.

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

Agentenspezifische Überschreibung: `agents.entries.*.workspace`.

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellen den Workspace und legen die Bootstrap-Dateien an, falls sie fehlen.

<Note>
Beim Anlegen der Sandbox werden nur reguläre Dateien innerhalb des Workspace kopiert; Symlink-/Hardlink-Aliasse, die auf Ziele außerhalb des Quell-Workspace verweisen, werden ignoriert.
</Note>

Wenn Sie die Workspace-Dateien bereits selbst verwalten, deaktivieren Sie die Erstellung von Bootstrap-Dateien:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere vorhandene Workspace-Verzeichnisse können zu verwirrender Abweichung bei Authentifizierung oder Status führen, da jeweils nur ein Workspace aktiv ist.

<Note>
**Empfehlung:** Verwenden Sie nur einen aktiven Workspace. Wenn Sie die zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`). Wenn Sie absichtlich mehrere Workspaces beibehalten, stellen Sie sicher, dass `agents.defaults.workspace` (oder der agentenspezifische Schlüssel `workspace`) auf den aktiven Workspace verweist.
</Note>

## Übersicht der Workspace-Dateien

Standarddateien, die OpenClaw im Workspace erwartet:

<AccordionGroup>
  <Accordion title="AGENTS.md – Betriebsanweisungen">
    Betriebsanweisungen für den Agenten und dazu, wie er das Gedächtnis verwenden soll. Wird zu Beginn jeder Sitzung geladen. Ein guter Ort für Regeln, Prioritäten und Details zum gewünschten Verhalten.
  </Accordion>
  <Accordion title="SOUL.md – Persönlichkeit und Ton">
    Persönlichkeit, Ton und Grenzen. Wird in jeder Sitzung geladen. Leitfaden: [Persönlichkeitsleitfaden für SOUL.md](/de/concepts/soul).
  </Accordion>
  <Accordion title="USER.md – Informationen über den Benutzer">
    Informationen darüber, wer der Benutzer ist und wie er angesprochen werden soll. Wird in jeder Sitzung geladen.
  </Accordion>
  <Accordion title="IDENTITY.md – Name, Ausstrahlung, Emoji">
    Name, Ausstrahlung und Emoji des Agenten. Wird während des Bootstrap-Rituals erstellt oder aktualisiert.
  </Accordion>
  <Accordion title="TOOLS.md – lokale Werkzeugkonventionen">
    Hinweise zu Ihren lokalen Werkzeugen und Konventionen. Steuert nicht die Verfügbarkeit von Werkzeugen, sondern dient lediglich als Orientierung.
  </Accordion>
  <Accordion title="HEARTBEAT.md – Heartbeat-Checkliste">
    Optionale kleine Checkliste für Heartbeat-Ausführungen. Halten Sie sie kurz, um unnötigen Token-Verbrauch zu vermeiden.
  </Accordion>
  <Accordion title="BOOT.md – Startcheckliste">
    Optionale Startcheckliste, die bei einem Neustart des Gateway automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind). Halten Sie sie kurz; verwenden Sie das Nachrichtenwerkzeug für ausgehende Nachrichten.
  </Accordion>
  <Accordion title="BOOTSTRAP.md – Ritual für die erste Ausführung">
    Einmaliges Ritual für die erste Ausführung. Wird nur für einen völlig neuen Workspace erstellt. Löschen Sie die Datei nach Abschluss des Rituals.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md – tägliches Gedächtnisprotokoll">
    Tägliches Gedächtnisprotokoll (eine Datei pro Tag). Es wird empfohlen, beim Sitzungsstart die Einträge von heute und gestern zu lesen.
  </Accordion>
  <Accordion title="MEMORY.md – kuratiertes Langzeitgedächtnis (optional)">
    Kuratiertes Langzeitgedächtnis: dauerhafte Fakten, Präferenzen, Entscheidungen und kurze Zusammenfassungen. Bewahren Sie detaillierte Protokolle in `memory/YYYY-MM-DD.md` auf, damit Gedächtniswerkzeuge sie bei Bedarf abrufen können, ohne sie in jeden Prompt einzufügen. Laden Sie `MEMORY.md` nur in der privaten Hauptsitzung (nicht in gemeinsamen oder Gruppenkontexten). Unter [Gedächtnis](/de/concepts/memory) finden Sie Informationen zum Arbeitsablauf und zur automatischen Speicherung des Gedächtnisses.
  </Accordion>
  <Accordion title="skills/ – Workspace-spezifische Skills (optional)">
    Workspace-spezifische Skills. Der Skill-Speicherort mit der höchsten Priorität für diesen Workspace, vor Projekt-Agenten-Skills, persönlichen Agenten-Skills, verwalteten Skills, mitgelieferten Skills und `skills.load.extraDirs`, wenn Namen kollidieren.
  </Accordion>
  <Accordion title="canvas/ – Dateien der Canvas-Benutzeroberfläche (optional)">
    Dateien der Canvas-Benutzeroberfläche für Node-Anzeigen (zum Beispiel `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw eine Markierung für eine „fehlende Datei“ in die Sitzung ein und fährt fort. Große Bootstrap-Dateien werden beim Einfügen gekürzt; passen Sie die Grenzwerte mit `agents.defaults.bootstrapMaxChars` (Standard: `20000`) und `agents.defaults.bootstrapTotalMaxChars` (Standard: `60000`) an. `openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene Dateien zu überschreiben.
</Note>

## Was NICHT im Workspace enthalten ist

Die folgenden Elemente befinden sich unter `~/.openclaw/` und sollten NICHT in das Workspace-Repository eingecheckt werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/state/openclaw.sqlite` (gemeinsamer Einrichtungsstatus und Bestätigungen des Workspace)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Authentifizierungsprofile für Modelle: OAuth und API-Schlüssel)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (Sitzungszeilen, Transkripte und agentenspezifischer Laufzeitstatus)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (agentenspezifisches Codex-Laufzeitkonto, Konfiguration, Skills, Plugins und nativer Thread-Status)
- `~/.openclaw/credentials/` (Kanal-/Provider-Status sowie ältere OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Quellen für ältere Migrationen sowie Archiv-/Support-Artefakte)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder die Konfiguration migrieren müssen, kopieren Sie diese separat und schließen Sie sie von der Versionskontrolle aus.

Ältere OpenClaw-Versionen schrieben die Workspace-Begleitdateien `openclaw-workspace-state.json`,
`.openclaw/workspace-state.json` und `.attested`. Die aktuelle
Laufzeit verwendet für diesen Status ausschließlich die gemeinsame SQLite-Datenbank. Wenn Doctor
eine dieser Dateien meldet, führen Sie `openclaw doctor --fix` aus; Doctor importiert gültigen älteren
Status und löscht eine Quelldatei erst nach der Überprüfung der Datenbankzeilen.

## Git-Sicherung (empfohlen, privat)

Behandeln Sie den Workspace als privates Gedächtnis. Legen Sie ihn in einem **privaten** Git-Repository ab, damit er gesichert ist und wiederhergestellt werden kann.

Führen Sie diese Schritte auf dem Computer aus, auf dem das Gateway läuft (dort befindet sich der Workspace).

<Steps>
  <Step title="Repository initialisieren">
    Wenn Git installiert ist, werden völlig neue Workspaces automatisch initialisiert. Wenn dieser Workspace noch kein Repository ist, führen Sie Folgendes aus:

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
        1. Erstellen Sie ein neues **privates** Repository auf GitHub.
        2. Initialisieren Sie es nicht mit einer README-Datei (dadurch werden Merge-Konflikte vermieden).
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
        1. Erstellen Sie ein neues **privates** Repository auf GitLab.
        2. Initialisieren Sie es nicht mit einer README-Datei (dadurch werden Merge-Konflikte vermieden).
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
  <Step title="Fortlaufende Aktualisierungen">
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
Vermeiden Sie es, selbst in einem privaten Repository Geheimnisse im Workspace zu speichern:

- API-Schlüssel, OAuth-Token, Passwörter oder private Anmeldedaten.
- Alles unter `~/.openclaw/`.
- Unbearbeitete Exporte von Chats oder sensiblen Anhängen.

Wenn Sie sensible Verweise speichern müssen, verwenden Sie Platzhalter und bewahren Sie das eigentliche Geheimnis an einem anderen Ort auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).
</Warning>

Empfohlener Ausgangspunkt für `.gitignore`:

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
    Klonen Sie das Repository in den gewünschten Pfad (Standard: `~/.openclaw/workspace`).
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

- Beim Multi-Agent-Routing können über `agents.entries.*.workspace` unterschiedliche Workspaces pro Agent verwendet werden. Informationen zur Routing-Konfiguration finden Sie unter [Kanal-Routing](/de/channels/channel-routing).
- Wenn `agents.defaults.sandbox` aktiviert ist, können Sitzungen außerhalb der Hauptsitzung sitzungsspezifische Sandbox-Workspaces unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandte Themen

- [Heartbeat](/de/gateway/heartbeat) – Workspace-Datei HEARTBEAT.md
- [Sandboxing](/de/gateway/sandboxing) – Workspace-Zugriff in Sandbox-Umgebungen
- [Sitzung](/de/concepts/session) – Speicherpfade für Sitzungen
- [Dauerhafte Anweisungen](/de/automation/standing-orders) – persistente Anweisungen in Workspace-Dateien
