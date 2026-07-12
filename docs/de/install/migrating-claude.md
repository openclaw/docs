---
read_when:
    - Sie wechseln von Claude Code oder Claude Desktop und möchten Anweisungen, MCP-Server und Skills beibehalten
    - Sie müssen verstehen, was OpenClaw automatisch importiert und was ausschließlich im Archiv verbleibt.
summary: Verschieben Sie den lokalen Status von Claude Code und Claude Desktop mit einem vorab angezeigten Import nach OpenClaw
title: Migration von Claude
x-i18n:
    generated_at: "2026-07-12T01:46:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importiert den lokalen Claude-Status über den gebündelten Claude-Migrations-Provider. Der Provider zeigt vor jeder Statusänderung eine Vorschau aller Elemente an, schwärzt Geheimnisse in Plänen und Berichten und erstellt vor der Anwendung eine verifizierte Sicherung.

<Note>
Importe während des Onboardings erfordern eine neue OpenClaw-Einrichtung. Wenn bereits ein lokaler OpenClaw-Status vorhanden ist, setzen Sie zunächst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück oder verwenden Sie nach Prüfung des Plans direkt `openclaw migrate` mit `--overwrite`.
</Note>

## Zwei Importmöglichkeiten

<Tabs>
  <Tab title="Onboarding-Assistent">
    Der Assistent bietet Claude an, wenn er einen lokalen Claude-Status erkennt.

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

    Fügen Sie `--from <path>` hinzu, um ein bestimmtes Claude-Code-Stammverzeichnis oder Projektstammverzeichnis zu importieren.

  </Tab>
</Tabs>

## Was importiert wird

<AccordionGroup>
  <Accordion title="Anweisungen und Speicher">
    - Der Inhalt von `CLAUDE.md` und `.claude/CLAUDE.md` eines Projekts wird in die Datei `AGENTS.md` des OpenClaw-Agent-Arbeitsbereichs kopiert oder an sie angehängt.
    - Der Inhalt der Benutzerdatei `~/.claude/CLAUDE.md` wird an die Datei `USER.md` des Arbeitsbereichs angehängt.

  </Accordion>
  <Accordion title="MCP-Server">
    Definitionen von MCP-Servern werden, sofern vorhanden, aus der Projektdatei `.mcp.json`, der Claude-Code-Datei `~/.claude.json` und der Claude-Desktop-Datei `claude_desktop_config.json` importiert.
  </Accordion>
  <Accordion title="Skills und Befehle">
    - Claude-Skills mit einer `SKILL.md`-Datei werden in das Skills-Verzeichnis des OpenClaw-Arbeitsbereichs kopiert.
    - Markdown-Dateien mit Claude-Befehlen unter `.claude/commands/` oder `~/.claude/commands/` werden in OpenClaw-Skills mit `disable-model-invocation: true` umgewandelt.

  </Accordion>
</AccordionGroup>

## Was ausschließlich im Archiv verbleibt

Der Provider kopiert die folgenden Elemente zur manuellen Prüfung in den Migrationsbericht, lädt sie jedoch **nicht** in die aktive OpenClaw-Konfiguration:

- Claude-Hooks
- Claude-Berechtigungen und umfassende Werkzeug-Zulassungslisten
- Claude-Standardwerte für Umgebungsvariablen
- `CLAUDE.local.md`
- `.claude/rules/`
- Claude-Unteragenten unter `.claude/agents/` oder `~/.claude/agents/`
- Cache-, Plan- und Projektverlaufsverzeichnisse von Claude Code
- Claude-Desktop-Erweiterungen und im Betriebssystem gespeicherte Anmeldedaten

OpenClaw weigert sich, Hooks auszuführen, Berechtigungs-Zulassungslisten zu vertrauen oder undurchsichtige OAuth- und Desktop-Anmeldedaten automatisch zu entschlüsseln. Übertragen Sie benötigte Inhalte nach Prüfung des Archivs manuell.

## Quellenauswahl

Ohne `--from` untersucht OpenClaw das standardmäßige Claude-Code-Stammverzeichnis unter `~/.claude`, die stichprobenartig ausgewertete Claude-Code-Statusdatei `~/.claude.json` und unter macOS die MCP-Konfiguration von Claude Desktop.

Wenn `--from` auf ein Projektstammverzeichnis verweist, importiert OpenClaw ausschließlich die Claude-Dateien dieses Projekts, beispielsweise `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` und `.mcp.json`. Bei einem Import aus einem Projektstammverzeichnis wird das globale Claude-Stammverzeichnis nicht gelesen.

## Empfohlener Ablauf

<Steps>
  <Step title="Plan in der Vorschau anzeigen">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Der Plan führt alle bevorstehenden Änderungen auf, einschließlich Konflikten, übersprungenen Elementen und vertraulichen Werten, die in verschachtelten MCP-Feldern namens `env` oder `headers` geschwärzt wurden.

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

    [Doctor](/de/gateway/doctor) prüft nach dem Import auf Konfigurations- oder Statusprobleme.

  </Step>
  <Step title="Neu starten und überprüfen">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Vergewissern Sie sich, dass das Gateway ordnungsgemäß funktioniert und Ihre importierten Anweisungen, MCP-Server und Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Die Anwendung wird nicht fortgesetzt, wenn der Plan Konflikte meldet, weil am Ziel bereits eine Datei oder ein Konfigurationswert vorhanden ist.

<Warning>
Führen Sie den Vorgang nur dann erneut mit `--overwrite` aus, wenn das vorhandene Ziel absichtlich ersetzt werden soll. Provider können für überschriebene Dateien weiterhin Sicherungen auf Elementebene im Verzeichnis des Migrationsberichts erstellen.
</Warning>

Bei einer neuen OpenClaw-Installation sind Konflikte ungewöhnlich. Sie treten normalerweise auf, wenn Sie den Import für eine Einrichtung wiederholen, die bereits Benutzeränderungen enthält.

## JSON-Ausgabe für die Automatisierung

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Außerhalb eines interaktiven Terminals ist `--yes` für `migrate apply` erforderlich. Ohne dieses Flag gibt OpenClaw einen Fehler aus, statt die Änderungen anzuwenden. Skripte und CI müssen `--yes` daher ausdrücklich übergeben. Zeigen Sie zunächst mit `--dry-run --json` eine Vorschau an und wenden Sie die Änderungen anschließend mit `--json --yes` an, sobald der Plan korrekt aussieht.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Der Claude-Status befindet sich außerhalb von ~/.claude">
    Übergeben Sie `--from /actual/path` über die CLI oder `--import-source /actual/path` beim Onboarding.
  </Accordion>
  <Accordion title="Das Onboarding verweigert den Import in eine bestehende Einrichtung">
    Importe während des Onboardings erfordern eine neue Einrichtung. Setzen Sie entweder den Status zurück und führen Sie das Onboarding erneut aus oder verwenden Sie direkt `openclaw migrate apply claude`, das `--overwrite` und eine explizite Sicherungssteuerung unterstützt.
  </Accordion>
  <Accordion title="MCP-Server aus Claude Desktop wurden nicht importiert">
    Claude Desktop liest `claude_desktop_config.json` aus einem plattformspezifischen Pfad. Lassen Sie `--from` auf das Verzeichnis dieser Datei verweisen, wenn OpenClaw sie nicht automatisch erkannt hat.
  </Accordion>
  <Accordion title="Claude-Befehle wurden zu Skills mit deaktiviertem Modellaufruf">
    Dies ist beabsichtigt. Claude-Befehle werden vom Benutzer ausgelöst. Deshalb importiert OpenClaw sie als Skills mit `disable-model-invocation: true`. Bearbeiten Sie den Frontmatter-Block des jeweiligen Skills, wenn der Agent sie automatisch aufrufen soll.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Strukturen.
- [Migrationsleitfaden](/de/install/migrating): alle Migrationspfade.
- [Migration von Hermes](/de/install/migrating-hermes): der andere systemübergreifende Importpfad.
- [Onboarding](/de/cli/onboard): Assistentenablauf und Flags für die nicht interaktive Verwendung.
- [Doctor](/de/gateway/doctor): Zustandsprüfung nach der Migration.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): Speicherort von `AGENTS.md`, `USER.md` und Skills.
