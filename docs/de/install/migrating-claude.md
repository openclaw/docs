---
read_when:
    - Sie wechseln von Claude Code oder Claude Desktop und möchten Anweisungen, MCP-Server und Skills beibehalten
    - Sie müssen verstehen, was OpenClaw automatisch importiert und was ausschließlich im Archiv verbleibt.
summary: Lokalen Status von Claude Code und Claude Desktop mit einem Import samt Vorschau in OpenClaw übernehmen
title: Migration von Claude
x-i18n:
    generated_at: "2026-07-24T04:28:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d5a5e63727e1583fc3fa27ac45215c72df9074b21d7c5f6b33800bec916769b
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importiert den lokalen Claude-Zustand über den gebündelten Claude-Migrations-Provider. Der Provider zeigt jedes Element in einer Vorschau an, bevor er den Zustand ändert, und schwärzt Geheimnisse in Plänen und Berichten. Die eigenständige Ausführung von `openclaw migrate` erstellt eine verifizierte Sicherung; beim Ablauf für eine neue Ersteinrichtung wird der Import vorbereitet und erst veröffentlicht, nachdem die Verifizierung erfolgreich abgeschlossen wurde.

<Note>
Importe während der Ersteinrichtung erfordern eine neue OpenClaw-Einrichtung. Wenn bereits ein lokaler OpenClaw-Zustand vorhanden ist, setzen Sie zuerst die Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, oder verwenden Sie `openclaw migrate` nach Prüfung des Plans direkt mit `--overwrite`.
</Note>

## Zwei Importmöglichkeiten

<Tabs>
  <Tab title="Einrichtungsassistent">
    Der Assistent bietet Claude an, wenn er einen lokalen Claude-Zustand erkennt.

    ```bash
    openclaw onboard --flow import
    ```

    Oder geben Sie eine bestimmte Quelle an:

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

    Fügen Sie `--from <path>` hinzu, um ein bestimmtes Claude-Code-Basisverzeichnis oder Projektstammverzeichnis zu importieren.

  </Tab>
</Tabs>

## Was importiert wird

<AccordionGroup>
  <Accordion title="Anweisungen und Speicher">
    - Der Inhalt der Projektdateien `CLAUDE.md` und `.claude/CLAUDE.md` wird in die Datei `AGENTS.md` des OpenClaw-Agent-Arbeitsbereichs kopiert oder daran angehängt.
    - Der Inhalt der Benutzerdatei `~/.claude/CLAUDE.md` wird an die Datei `USER.md` des Arbeitsbereichs angehängt.

  </Accordion>
  <Accordion title="MCP-Server">
    MCP-Serverdefinitionen werden, sofern vorhanden, aus der Projektdatei `.mcp.json`, der Claude-Code-Datei `~/.claude.json` und der Claude-Desktop-Datei `claude_desktop_config.json` importiert.
  </Accordion>
  <Accordion title="Skills und Befehle">
    - Claude-Skills mit einer Datei namens `SKILL.md` werden in das Skills-Verzeichnis des OpenClaw-Arbeitsbereichs kopiert.
    - Claude-Befehlsdateien im Markdown-Format unter `.claude/commands/` oder `~/.claude/commands/` werden mit `disable-model-invocation: true` in OpenClaw-Skills konvertiert.

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

OpenClaw lehnt es ab, Hooks auszuführen, Berechtigungs-Zulassungslisten zu vertrauen oder undurchsichtige OAuth- und Desktop-Anmeldedatenzustände automatisch zu dekodieren. Übertragen Sie nach Prüfung des Archivs manuell, was Sie benötigen.

## Quellenauswahl

Ohne `--from` untersucht OpenClaw das standardmäßige Claude-Code-Basisverzeichnis unter `~/.claude`, die stichprobenartig ausgewählte Claude-Code-Zustandsdatei `~/.claude.json` und die MCP-Konfiguration von Claude Desktop unter macOS.

Wenn `--from` auf ein Projektstammverzeichnis verweist, importiert OpenClaw ausschließlich die Claude-Dateien dieses Projekts, beispielsweise `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` und `.mcp.json`. Bei einem Import aus einem Projektstammverzeichnis wird das globale Claude-Basisverzeichnis nicht gelesen.

## Empfohlener Ablauf

<Steps>
  <Step title="Plan in der Vorschau prüfen">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Der Plan führt alle bevorstehenden Änderungen auf, einschließlich Konflikten und übersprungenen Elementen sowie vertraulichen Werten, die in verschachtelten MCP-Feldern vom Typ `env` oder `headers` geschwärzt wurden.

  </Step>
  <Step title="Mit Sicherung anwenden">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw erstellt und verifiziert vor dem Anwenden eine Sicherung.

  </Step>
  <Step title="Doctor ausführen">
    ```bash
    openclaw doctor
    ```

    [Doctor](/de/gateway/doctor) prüft nach dem Import auf Probleme mit der Konfiguration oder dem Zustand.

  </Step>
  <Step title="Neu starten und überprüfen">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Vergewissern Sie sich, dass das Gateway fehlerfrei funktioniert und die importierten Anweisungen, MCP-Server und Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Der Vorgang zum Anwenden verweigert die Fortsetzung, wenn der Plan Konflikte meldet (am Ziel ist bereits eine Datei oder ein Konfigurationswert vorhanden).

<Warning>
Führen Sie den Vorgang nur dann erneut mit `--overwrite` aus, wenn das vorhandene Ziel absichtlich ersetzt werden soll. Provider können für überschriebene Dateien weiterhin Sicherungen auf Elementebene im Verzeichnis des Migrationsberichts erstellen.
</Warning>

Bei einer neuen OpenClaw-Installation sind Konflikte ungewöhnlich. Sie treten normalerweise auf, wenn der Import bei einer Einrichtung erneut ausgeführt wird, die bereits Änderungen von Benutzern enthält.

## JSON-Ausgabe für die Automatisierung

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` ist für `migrate apply` außerhalb eines interaktiven Terminals erforderlich. Ohne diese Option gibt OpenClaw einen Fehler aus, anstatt die Änderungen anzuwenden; Skripte und die CI müssen `--yes` daher ausdrücklich übergeben. Prüfen Sie zunächst die Vorschau mit `--dry-run --json` und wenden Sie die Änderungen anschließend mit `--json --yes` an, sobald der Plan korrekt aussieht.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Der Claude-Zustand befindet sich außerhalb von ~/.claude">
    Übergeben Sie `--from /actual/path` (CLI) oder `--import-source /actual/path` (Ersteinrichtung).
  </Accordion>
  <Accordion title="Die Ersteinrichtung verweigert den Import in eine vorhandene Einrichtung">
    Importe während der Ersteinrichtung erfordern eine neue Einrichtung. Setzen Sie entweder den Zustand zurück und führen Sie die Ersteinrichtung erneut durch, oder verwenden Sie direkt `openclaw migrate apply claude`, das `--overwrite` und die ausdrückliche Steuerung der Sicherung unterstützt.
  </Accordion>
  <Accordion title="MCP-Server aus Claude Desktop wurden nicht importiert">
    Claude Desktop liest `claude_desktop_config.json` aus einem plattformspezifischen Pfad. Lassen Sie `--from` auf das Verzeichnis dieser Datei verweisen, wenn OpenClaw sie nicht automatisch erkannt hat.
  </Accordion>
  <Accordion title="Claude-Befehle wurden zu Skills mit deaktiviertem Modellaufruf">
    Dies ist beabsichtigt. Claude-Befehle werden von Benutzern ausgelöst, daher importiert OpenClaw sie als Skills mit `disable-model-invocation: true`. Bearbeiten Sie das Frontmatter jedes Skills, wenn der Agent sie automatisch aufrufen soll.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Strukturen.
- [Migrationsleitfaden](/de/install/migrating): alle Migrationspfade.
- [Migration von Hermes](/de/install/migrating-hermes): der andere systemübergreifende Importpfad.
- [Ersteinrichtung](/de/cli/onboard): Assistentenablauf und Flags für die nicht interaktive Verwendung.
- [Doctor](/de/gateway/doctor): Funktionsprüfung nach der Migration.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): Speicherort von `AGENTS.md`, `USER.md` und Skills.
