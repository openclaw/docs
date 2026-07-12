---
read_when:
    - Sie wechseln von Claude Code oder Claude Desktop und möchten Anweisungen, MCP-Server und Skills beibehalten
    - Sie müssen verstehen, was OpenClaw automatisch importiert und was ausschließlich im Archiv verbleibt.
summary: Migrieren Sie den lokalen Status von Claude Code und Claude Desktop mithilfe eines Imports mit Vorschau zu OpenClaw
title: Migration von Claude
x-i18n:
    generated_at: "2026-07-12T15:33:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importiert den lokalen Claude-Zustand über den mitgelieferten Claude-Migrations-Provider. Der Provider zeigt vor jeder Zustandsänderung eine Vorschau aller Elemente an, schwärzt Geheimnisse in Plänen und Berichten und erstellt vor der Anwendung eine verifizierte Sicherung.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Wenn bereits ein lokaler OpenClaw-Zustand vorhanden ist, setzen Sie zunächst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück. Alternativ können Sie nach Prüfung des Plans `openclaw migrate` direkt mit `--overwrite` verwenden.
</Note>

## Zwei Importmöglichkeiten

<Tabs>
  <Tab title="Onboarding-Assistent">
    Der Assistent bietet Claude an, wenn er einen lokalen Claude-Zustand erkennt.

    ```bash
    openclaw onboard --flow import
    ```

    Alternativ können Sie eine bestimmte Quelle angeben:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Verwenden Sie `openclaw migrate` für skriptgesteuerte oder wiederholbare Ausführungen. Die vollständige Referenz finden Sie unter [`openclaw migrate`](/de/cli/migrate).

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Fügen Sie `--from <path>` hinzu, um ein bestimmtes Claude-Code-Ausgangsverzeichnis oder Projektstammverzeichnis zu importieren.

  </Tab>
</Tabs>

## Was importiert wird

<AccordionGroup>
  <Accordion title="Anweisungen und Speicher">
    - Der Inhalt von `CLAUDE.md` und `.claude/CLAUDE.md` des Projekts wird in die Datei `AGENTS.md` des OpenClaw-Agentenarbeitsbereichs kopiert oder an sie angehängt.
    - Der Inhalt der Benutzerdatei `~/.claude/CLAUDE.md` wird an die Datei `USER.md` im Arbeitsbereich angehängt.

  </Accordion>
  <Accordion title="MCP-Server">
    MCP-Serverdefinitionen werden, sofern vorhanden, aus der Projektdatei `.mcp.json`, der Claude-Code-Datei `~/.claude.json` und der Claude-Desktop-Datei `claude_desktop_config.json` importiert.
  </Accordion>
  <Accordion title="Skills und Befehle">
    - Claude-Skills mit einer Datei namens `SKILL.md` werden in das Skills-Verzeichnis des OpenClaw-Arbeitsbereichs kopiert.
    - Markdown-Dateien mit Claude-Befehlen unter `.claude/commands/` oder `~/.claude/commands/` werden mit `disable-model-invocation: true` in OpenClaw-Skills umgewandelt.

  </Accordion>
</AccordionGroup>

## Was ausschließlich im Archiv verbleibt

Der Provider kopiert Folgendes zur manuellen Prüfung in den Migrationsbericht, lädt es jedoch **nicht** in die aktive OpenClaw-Konfiguration:

- Claude-Hooks
- Claude-Berechtigungen und umfassende Zulassungslisten für Tools
- Claude-Standardwerte für die Umgebung
- `CLAUDE.local.md`
- `.claude/rules/`
- Claude-Unteragenten unter `.claude/agents/` oder `~/.claude/agents/`
- Cache-, Plan- und Projektverlaufsverzeichnisse von Claude Code
- Claude-Desktop-Erweiterungen und im Betriebssystem gespeicherte Anmeldedaten

OpenClaw weigert sich, Hooks auszuführen, Berechtigungs-Zulassungslisten zu vertrauen oder undurchsichtige OAuth- und Desktop-Anmeldedatenzustände automatisch zu decodieren. Übertragen Sie benötigte Inhalte nach der Prüfung des Archivs manuell.

## Quellenauswahl

Ohne `--from` untersucht OpenClaw das standardmäßige Claude-Code-Ausgangsverzeichnis unter `~/.claude`, die stichprobenartig gelesene Claude-Code-Zustandsdatei `~/.claude.json` und unter macOS die MCP-Konfiguration von Claude Desktop.

Wenn `--from` auf ein Projektstammverzeichnis verweist, importiert OpenClaw nur die Claude-Dateien dieses Projekts, beispielsweise `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` und `.mcp.json`. Bei einem Import aus einem Projektstammverzeichnis wird Ihr globales Claude-Ausgangsverzeichnis nicht gelesen.

## Empfohlener Ablauf

<Steps>
  <Step title="Plan in der Vorschau prüfen">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Der Plan führt alle Änderungen auf, einschließlich Konflikten, übersprungenen Elementen und sensiblen Werten, die in verschachtelten MCP-Feldern wie `env` oder `headers` geschwärzt wurden.

  </Step>
  <Step title="Mit Sicherung anwenden">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw erstellt und verifiziert vor der Anwendung eine Sicherung.

  </Step>
  <Step title="Doctor ausführen">
    ```bash
    openclaw doctor
    ```

    [Doctor](/de/gateway/doctor) prüft nach dem Import auf Konfigurations- oder Zustandsprobleme.

  </Step>
  <Step title="Neu starten und überprüfen">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Vergewissern Sie sich, dass das Gateway fehlerfrei funktioniert und Ihre importierten Anweisungen, MCP-Server und Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Die Anwendung wird nicht fortgesetzt, wenn der Plan Konflikte meldet, also wenn eine Datei oder ein Konfigurationswert am Ziel bereits vorhanden ist.

<Warning>
Führen Sie den Vorgang nur dann erneut mit `--overwrite` aus, wenn das Ersetzen des vorhandenen Ziels beabsichtigt ist. Provider können im Verzeichnis des Migrationsberichts weiterhin Sicherungen einzelner überschriebener Dateien anlegen.
</Warning>

Bei einer frischen OpenClaw-Installation sind Konflikte ungewöhnlich. Sie treten normalerweise auf, wenn Sie den Import für eine Einrichtung erneut ausführen, die bereits Benutzeränderungen enthält.

## JSON-Ausgabe für die Automatisierung

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Außerhalb eines interaktiven Terminals ist `--yes` für `migrate apply` erforderlich. Ohne diese Option meldet OpenClaw einen Fehler, statt die Änderungen anzuwenden. Skripte und CI müssen `--yes` daher ausdrücklich übergeben. Prüfen Sie zunächst die Vorschau mit `--dry-run --json` und wenden Sie die Änderungen anschließend mit `--json --yes` an, sobald der Plan korrekt aussieht.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Der Claude-Zustand befindet sich außerhalb von ~/.claude">
    Übergeben Sie `--from /actual/path` (CLI) oder `--import-source /actual/path` (Onboarding).
  </Accordion>
  <Accordion title="Onboarding verweigert den Import in eine vorhandene Einrichtung">
    Onboarding-Importe erfordern eine frische Einrichtung. Setzen Sie entweder den Zustand zurück und führen Sie das Onboarding erneut aus oder verwenden Sie direkt `openclaw migrate apply claude`, das `--overwrite` und eine explizite Steuerung der Sicherung unterstützt.
  </Accordion>
  <Accordion title="MCP-Server aus Claude Desktop wurden nicht importiert">
    Claude Desktop liest `claude_desktop_config.json` aus einem plattformspezifischen Pfad. Lassen Sie `--from` auf das Verzeichnis dieser Datei verweisen, wenn OpenClaw sie nicht automatisch erkannt hat.
  </Accordion>
  <Accordion title="Claude-Befehle wurden zu Skills mit deaktiviertem Modellaufruf">
    Dies ist beabsichtigt. Claude-Befehle werden durch Benutzer ausgelöst, daher importiert OpenClaw sie als Skills mit `disable-model-invocation: true`. Bearbeiten Sie die Frontmatter jedes Skills, wenn der Agent sie automatisch aufrufen soll.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Strukturen.
- [Migrationsleitfaden](/de/install/migrating): alle Migrationspfade.
- [Migration von Hermes](/de/install/migrating-hermes): der andere systemübergreifende Importpfad.
- [Onboarding](/de/cli/onboard): Ablauf des Assistenten und Flags für die nicht interaktive Ausführung.
- [Doctor](/de/gateway/doctor): Zustandsprüfung nach der Migration.
- [Agentenarbeitsbereich](/de/concepts/agent-workspace): Speicherort von `AGENTS.md`, `USER.md` und Skills.
