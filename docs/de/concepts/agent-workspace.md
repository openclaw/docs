---
read_when:
    - Sie müssen den Agenten-Arbeitsbereich oder seine Dateistruktur erklären
    - Sie möchten einen Agent-Arbeitsbereich sichern oder migrieren
sidebarTitle: Agent workspace
summary: 'Agent-Arbeitsbereich: Speicherort, Struktur und Backup-Strategie'
title: Agent-Arbeitsbereich
x-i18n:
    generated_at: "2026-04-30T20:05:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Der Arbeitsbereich ist das Zuhause des Agents. Er ist das einzige Arbeitsverzeichnis, das für Datei-Tools und den Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn als Memory.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldedaten und Sitzungen gespeichert werden.

<Warning>
Der Arbeitsbereich ist das **Standard-cwd**, keine harte Sandbox. Tools lösen relative Pfade relativ zum Arbeitsbereich auf, aber absolute Pfade können weiterhin andere Stellen auf dem Host erreichen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie [`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder eine agentenspezifische Sandbox-Konfiguration).

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

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellt den Arbeitsbereich und legt die Bootstrap-Dateien an, falls sie fehlen.

<Note>
Sandbox-Seed-Kopien akzeptieren nur normale Dateien innerhalb des Arbeitsbereichs; Symlink-/Hardlink-Aliase, die außerhalb des Quell-Arbeitsbereichs aufgelöst werden, werden ignoriert.
</Note>

Wenn Sie die Arbeitsbereichsdateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-Dateien deaktivieren:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Zusätzliche Arbeitsbereichsordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Arbeitsbereichsverzeichnisse parallel können zu verwirrender Authentifizierungs- oder Zustandsdrift führen, da immer nur ein Arbeitsbereich aktiv ist.

<Note>
**Empfehlung:** Behalten Sie einen einzigen aktiven Arbeitsbereich. Wenn Sie die zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`). Wenn Sie absichtlich mehrere Arbeitsbereiche behalten, stellen Sie sicher, dass `agents.defaults.workspace` auf den aktiven verweist.

`openclaw doctor` warnt, wenn zusätzliche Arbeitsbereichsverzeichnisse erkannt werden.
</Note>

## Dateizuordnung des Arbeitsbereichs

Dies sind die Standarddateien, die OpenClaw im Arbeitsbereich erwartet:

<AccordionGroup>
  <Accordion title="AGENTS.md — Betriebsanweisungen">
    Betriebsanweisungen für den Agent und dazu, wie er Memory verwenden soll. Wird zu Beginn jeder Sitzung geladen. Ein guter Ort für Regeln, Prioritäten und Details zum gewünschten Verhalten.
  </Accordion>
  <Accordion title="SOUL.md — Persona und Ton">
    Persona, Ton und Grenzen. Wird in jeder Sitzung geladen. Leitfaden: [SOUL.md-Persönlichkeitsleitfaden](/de/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — wer der Benutzer ist">
    Wer der Benutzer ist und wie er angesprochen werden soll. Wird in jeder Sitzung geladen.
  </Accordion>
  <Accordion title="IDENTITY.md — Name, Stimmung, Emoji">
    Name, Stimmung und Emoji des Agents. Wird während des Bootstrap-Rituals erstellt/aktualisiert.
  </Accordion>
  <Accordion title="TOOLS.md — lokale Tool-Konventionen">
    Hinweise zu Ihren lokalen Tools und Konventionen. Steuert nicht die Tool-Verfügbarkeit; es ist nur eine Anleitung.
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat-Checkliste">
    Optionale kleine Checkliste für Heartbeat-Läufe. Halten Sie sie kurz, um Token-Verbrauch zu vermeiden.
  </Accordion>
  <Accordion title="BOOT.md — Start-Checkliste">
    Optionale Start-Checkliste, die beim Gateway-Neustart automatisch ausgeführt wird (wenn [interne Hooks](/de/automation/hooks) aktiviert sind). Halten Sie sie kurz; verwenden Sie das Message-Tool für ausgehende Sends.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — Ritual beim ersten Lauf">
    Einmaliges Ritual beim ersten Lauf. Wird nur für einen brandneuen Arbeitsbereich erstellt. Löschen Sie es, nachdem das Ritual abgeschlossen ist.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — tägliches Memory-Protokoll">
    Tägliches Memory-Protokoll (eine Datei pro Tag). Empfohlen: heute + gestern beim Sitzungsstart lesen.
  </Accordion>
  <Accordion title="MEMORY.md — kuratiertes langfristiges Memory (optional)">
    Kuratiertes langfristiges Memory. Nur in der privaten Hauptsitzung laden (nicht in geteilten/Gruppenkontexten). Siehe [Memory](/de/concepts/memory) für den Workflow und den automatischen Memory-Flush.
  </Accordion>
  <Accordion title="skills/ — Workspace-Skills (optional)">
    Arbeitsbereichsspezifische Skills. Skill-Speicherort mit höchster Priorität für diesen Arbeitsbereich. Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.
  </Accordion>
  <Accordion title="canvas/ — Canvas-UI-Dateien (optional)">
    Canvas-UI-Dateien für Node-Anzeigen (zum Beispiel `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw einen Marker für „fehlende Datei“ in die Sitzung ein und fährt fort. Große Bootstrap-Dateien werden beim Einfügen gekürzt; passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 12000) und `agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an. `openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene Dateien zu überschreiben.
</Note>

## Was NICHT im Arbeitsbereich liegt

Diese Dateien liegen unter `~/.openclaw/` und sollten NICHT in das Arbeitsbereichs-Repo committed werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Auth-Profile: OAuth + API-Schlüssel)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (agentenspezifisches Codex-Laufzeitkonto, Konfiguration, Skills, Plugins und nativer Thread-Zustand)
- `~/.openclaw/credentials/` (Kanal-/Provider-Zustand plus Legacy-OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie diese separat und halten Sie sie aus der Versionskontrolle heraus.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Arbeitsbereich als privates Memory. Legen Sie ihn in ein **privates** Git-Repo, damit er gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem der Gateway läuft (dort befindet sich der Arbeitsbereich).

<Steps>
  <Step title="Repo initialisieren">
    Wenn Git installiert ist, werden brandneue Arbeitsbereiche automatisch initialisiert. Wenn dieser Arbeitsbereich noch kein Repo ist, führen Sie Folgendes aus:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Privaten Remote hinzufügen">
    <Tabs>
      <Tab title="GitHub-Web-UI">
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
      <Tab title="GitLab-Web-UI">
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
Vermeiden Sie auch in einem privaten Repo, Secrets im Arbeitsbereich zu speichern:

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
    Klonen Sie das Repo in den gewünschten Pfad (Standard `~/.openclaw/workspace`).
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

- Multi-Agent-Routing kann unterschiedliche Arbeitsbereiche pro Agent verwenden. Siehe [Kanalrouting](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen sitzungsspezifische Sandbox-Arbeitsbereiche unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandt

- [Heartbeat](/de/gateway/heartbeat) — HEARTBEAT.md-Arbeitsbereichsdatei
- [Sandboxing](/de/gateway/sandboxing) — Arbeitsbereichszugriff in sandboxierten Umgebungen
- [Sitzung](/de/concepts/session) — Speicherpfade für Sitzungen
- [Standing Orders](/de/automation/standing-orders) — persistente Anweisungen in Arbeitsbereichsdateien
