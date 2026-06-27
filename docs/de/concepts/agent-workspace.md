---
read_when:
    - Sie müssen den Agent-Arbeitsbereich oder dessen Dateistruktur erklären
    - Sie möchten einen Agent-Arbeitsbereich sichern oder migrieren
sidebarTitle: Agent workspace
summary: 'Agent-Arbeitsbereich: Speicherort, Layout und Backup-Strategie'
title: Agent-Arbeitsbereich
x-i18n:
    generated_at: "2026-06-27T17:22:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Der Arbeitsbereich ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für Datei-Tools und für Arbeitsbereichskontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn als Gedächtnis.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldedaten und Sitzungen gespeichert werden.

<Warning>
Der Arbeitsbereich ist das **standardmäßige cwd**, keine harte Sandbox. Tools lösen relative Pfade relativ zum Arbeitsbereich auf, absolute Pfade können jedoch weiterhin andere Stellen auf dem Host erreichen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolierung benötigen, verwenden Sie [`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine Sandbox-Konfiguration pro Agent).

Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools in einem Sandbox-Arbeitsbereich unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Arbeitsbereich.
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

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellt den Arbeitsbereich und legt die Bootstrap-Dateien an, wenn sie fehlen.

<Note>
Sandbox-Seed-Kopien akzeptieren nur reguläre Dateien innerhalb des Arbeitsbereichs; Symlink-/Hardlink-Aliase, die außerhalb des Quellarbeitsbereichs aufgelöst werden, werden ignoriert.
</Note>

Wenn Sie die Arbeitsbereichsdateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-Dateien deaktivieren:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Arbeitsbereichsordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Arbeitsbereichsverzeichnisse parallel vorzuhalten, kann zu verwirrenden Authentifizierungs- oder Zustandsabweichungen führen, da immer nur ein Arbeitsbereich aktiv ist.

<Note>
**Empfehlung:** Verwenden Sie einen einzigen aktiven Arbeitsbereich. Wenn Sie die zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`). Wenn Sie absichtlich mehrere Arbeitsbereiche behalten, stellen Sie sicher, dass `agents.defaults.workspace` auf den aktiven verweist.

`openclaw doctor` warnt, wenn zusätzliche Arbeitsbereichsverzeichnisse erkannt werden.
</Note>

## Dateizuordnung des Arbeitsbereichs

Dies sind die Standarddateien, die OpenClaw im Arbeitsbereich erwartet:

<AccordionGroup>
  <Accordion title="AGENTS.md - Betriebsanweisungen">
    Betriebsanweisungen für den Agenten und wie er Gedächtnis verwenden soll. Wird zu Beginn jeder Sitzung geladen. Ein guter Ort für Regeln, Prioritäten und Details zum Verhalten.
  </Accordion>
  <Accordion title="SOUL.md - Persona und Ton">
    Persona, Ton und Grenzen. Wird in jeder Sitzung geladen. Anleitung: [SOUL.md-Persönlichkeitsleitfaden](/de/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - wer der Benutzer ist">
    Wer der Benutzer ist und wie er angesprochen werden soll. Wird in jeder Sitzung geladen.
  </Accordion>
  <Accordion title="IDENTITY.md - Name, Stimmung, Emoji">
    Name, Stimmung und Emoji des Agenten. Wird während des Bootstrap-Rituals erstellt/aktualisiert.
  </Accordion>
  <Accordion title="TOOLS.md - lokale Tool-Konventionen">
    Hinweise zu Ihren lokalen Tools und Konventionen. Steuert nicht die Tool-Verfügbarkeit; es dient nur als Orientierung.
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat-Checkliste">
    Optionale kleine Checkliste für Heartbeat-Läufe. Halten Sie sie kurz, um Token-Verbrauch zu vermeiden.
  </Accordion>
  <Accordion title="BOOT.md - Startcheckliste">
    Optionale Startcheckliste, die beim Neustart des Gateways automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind). Halten Sie sie kurz; verwenden Sie das Nachrichten-Tool für ausgehende Sendungen.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - Ritual beim ersten Lauf">
    Einmaliges Ritual beim ersten Lauf. Wird nur für einen brandneuen Arbeitsbereich erstellt. Löschen Sie es, nachdem das Ritual abgeschlossen ist.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - tägliches Gedächtnisprotokoll">
    Tägliches Gedächtnisprotokoll (eine Datei pro Tag). Empfohlen: heute + gestern beim Sitzungsstart lesen.
  </Accordion>
  <Accordion title="MEMORY.md - kuratiertes Langzeitgedächtnis (optional)">
    Kuratiertes Langzeitgedächtnis: dauerhafte Fakten, Präferenzen, Entscheidungen und kurze Zusammenfassungen. Bewahren Sie detaillierte Protokolle in `memory/YYYY-MM-DD.md` auf, damit Gedächtnis-Tools sie bei Bedarf abrufen können, ohne sie in jeden Prompt einzufügen. Laden Sie `MEMORY.md` nur in der privaten Hauptsitzung (nicht in geteilten/Gruppenkontexten). Siehe [Memory](/de/concepts/memory) für den Workflow und den automatischen Gedächtnis-Flush.
  </Accordion>
  <Accordion title="skills/ - Arbeitsbereichs-Skills (optional)">
    Arbeitsbereichsspezifische Skills. Skill-Speicherort mit höchster Priorität für diesen Arbeitsbereich. Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.
  </Accordion>
  <Accordion title="canvas/ - Canvas-UI-Dateien (optional)">
    Canvas-UI-Dateien für Knotenanzeigen (zum Beispiel `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw einen Marker für eine „fehlende Datei“ in die Sitzung ein und fährt fort. Große Bootstrap-Dateien werden beim Einfügen gekürzt; passen Sie die Grenzen mit `agents.defaults.bootstrapMaxChars` (Standard: 20000) und `agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an. `openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene Dateien zu überschreiben.
</Note>

## Was NICHT im Arbeitsbereich liegt

Diese Inhalte befinden sich unter `~/.openclaw/` und sollten NICHT in das Arbeitsbereichs-Repo committet werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Authentifizierungsprofile: OAuth + API-Schlüssel)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (agentenspezifisches Codex-Laufzeitkonto, Konfiguration, Skills, Plugins und nativer Thread-Zustand)
- `~/.openclaw/credentials/` (Channel-/Provider-Zustand plus Legacy-OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie aus der Versionskontrolle heraus.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Arbeitsbereich als privates Gedächtnis. Legen Sie ihn in einem **privaten** Git-Repo ab, damit er gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem der Gateway läuft (dort befindet sich der Arbeitsbereich).

<Steps>
  <Step title="Repo initialisieren">
    Wenn git installiert ist, werden brandneue Arbeitsbereiche automatisch initialisiert. Wenn dieser Arbeitsbereich noch kein Repo ist, führen Sie Folgendes aus:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Privates Remote hinzufügen">
    <Tabs>
      <Tab title="GitHub-Web-UI">
        1. Erstellen Sie ein neues **privates** Repository auf GitHub.
        2. Initialisieren Sie es nicht mit einer README (vermeidet Merge-Konflikte).
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
        1. Erstellen Sie ein neues **privates** Repository auf GitLab.
        2. Initialisieren Sie es nicht mit einer README (vermeidet Merge-Konflikte).
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

## Keine Secrets committen

<Warning>
Vermeiden Sie es selbst in einem privaten Repo, Secrets im Arbeitsbereich zu speichern:

- API-Schlüssel, OAuth-Tokens, Passwörter oder private Anmeldedaten.
- Alles unter `~/.openclaw/`.
- Roh-Dumps von Chats oder sensiblen Anhängen.

Wenn Sie sensible Referenzen speichern müssen, verwenden Sie Platzhalter und bewahren Sie das echte Secret an anderer Stelle auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).
</Warning>

Vorgeschlagener `.gitignore`-Starter:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Arbeitsbereich auf einen neuen Rechner verschieben

<Steps>
  <Step title="Repo klonen">
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

- Multi-Agent-Routing kann unterschiedliche Arbeitsbereiche pro Agent verwenden. Siehe [Channel-Routing](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen Sandbox-Arbeitsbereiche pro Sitzung unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandte Themen

- [Heartbeat](/de/gateway/heartbeat) - HEARTBEAT.md-Arbeitsbereichsdatei
- [Sandboxing](/de/gateway/sandboxing) - Arbeitsbereichszugriff in Sandbox-Umgebungen
- [Session](/de/concepts/session) - Sitzungsspeicherpfade
- [Standing Orders](/de/automation/standing-orders) - persistente Anweisungen in Arbeitsbereichsdateien
