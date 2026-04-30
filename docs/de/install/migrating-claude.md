---
read_when:
    - Sie kommen von Claude Code oder Claude Desktop und möchten Anweisungen, MCP-Server und Skills beibehalten
    - Sie müssen verstehen, was OpenClaw automatisch importiert und was ausschließlich im Archiv verbleibt
summary: Verschieben Sie den lokalen Zustand von Claude Code und Claude Desktop mit einem Import mit Vorschau nach OpenClaw
title: Migration von Claude
x-i18n:
    generated_at: "2026-04-30T07:01:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importiert lokalen Claude-Zustand über den gebündelten Claude-Migrations-Provider. Der Provider zeigt jedes Element vor einer Zustandsänderung in einer Vorschau an, schwärzt Geheimnisse in Plänen und Berichten und erstellt vor der Anwendung ein verifiziertes Backup.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Wenn Sie bereits lokalen OpenClaw-Zustand haben, setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, oder verwenden Sie `openclaw migrate` nach Prüfung des Plans direkt mit `--overwrite`.
</Note>

## Zwei Wege zum Importieren

<Tabs>
  <Tab title="Onboarding-Assistent">
    Der Assistent bietet Claude an, wenn er lokalen Claude-Zustand erkennt.

    ```bash
    openclaw onboard --flow import
    ```

    Oder geben Sie eine bestimmte Quelle an:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Verwenden Sie `openclaw migrate` für skriptgesteuerte oder wiederholbare Läufe. Die vollständige Referenz finden Sie unter [`openclaw migrate`](/de/cli/migrate).

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Fügen Sie `--from <path>` hinzu, um ein bestimmtes Claude Code-Home oder Projektstammverzeichnis zu importieren.

  </Tab>
</Tabs>

## Was importiert wird

<AccordionGroup>
  <Accordion title="Anweisungen und Memory">
    - Inhalte aus Projekt-`CLAUDE.md` und `.claude/CLAUDE.md` werden in den OpenClaw-Agentenarbeitsbereich `AGENTS.md` kopiert oder dort angehängt.
    - Inhalte aus Benutzer-`~/.claude/CLAUDE.md` werden an Arbeitsbereich-`USER.md` angehängt.

  </Accordion>
  <Accordion title="MCP-Server">
    MCP-Serverdefinitionen werden aus Projekt-`.mcp.json`, Claude Code-`~/.claude.json` und Claude Desktop-`claude_desktop_config.json` importiert, wenn sie vorhanden sind.
  </Accordion>
  <Accordion title="Skills und Befehle">
    - Claude-Skills mit einer `SKILL.md`-Datei werden in das Skills-Verzeichnis des OpenClaw-Arbeitsbereichs kopiert.
    - Claude-Befehls-Markdown-Dateien unter `.claude/commands/` oder `~/.claude/commands/` werden in OpenClaw-Skills mit `disable-model-invocation: true` umgewandelt.

  </Accordion>
</AccordionGroup>

## Was nur archiviert bleibt

Der Provider kopiert diese Elemente zur manuellen Prüfung in den Migrationsbericht, lädt sie aber **nicht** in die aktive OpenClaw-Konfiguration:

- Claude-Hooks
- Claude-Berechtigungen und umfassende Tool-Zulassungslisten
- Claude-Umgebungsstandards
- `CLAUDE.local.md`
- `.claude/rules/`
- Claude-Subagents unter `.claude/agents/` oder `~/.claude/agents/`
- Claude Code-Caches, Pläne und Projektverlaufsverzeichnisse
- Claude Desktop-Erweiterungen und vom Betriebssystem gespeicherte Anmeldedaten

OpenClaw verweigert es, Hooks auszuführen, Berechtigungs-Zulassungslisten zu vertrauen oder undurchsichtigen OAuth- und Desktop-Anmeldedatenzustand automatisch zu dekodieren. Verschieben Sie das, was Sie benötigen, nach Prüfung des Archivs manuell.

## Quellenauswahl

Ohne `--from` untersucht OpenClaw das standardmäßige Claude Code-Home unter `~/.claude`, die stichprobenartige Claude Code-Zustandsdatei `~/.claude.json` und die Claude Desktop-MCP-Konfiguration unter macOS.

Wenn `--from` auf ein Projektstammverzeichnis zeigt, importiert OpenClaw nur die Claude-Dateien dieses Projekts, etwa `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` und `.mcp.json`. Ihr globales Claude-Home wird während eines Imports aus einem Projektstammverzeichnis nicht gelesen.

## Empfohlener Ablauf

<Steps>
  <Step title="Planvorschau anzeigen">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Der Plan listet alles auf, was geändert wird, einschließlich Konflikten, übersprungenen Elementen und sensiblen Werten, die aus verschachtelten MCP-`env`- oder `headers`-Feldern geschwärzt wurden.

  </Step>
  <Step title="Mit Backup anwenden">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw erstellt und verifiziert vor der Anwendung ein Backup.

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

    Bestätigen Sie, dass der Gateway fehlerfrei ist und Ihre importierten Anweisungen, MCP-Server und Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Die Anwendung verweigert die Fortsetzung, wenn der Plan Konflikte meldet (eine Datei oder ein Konfigurationswert existiert bereits am Ziel).

<Warning>
Führen Sie den Vorgang nur dann erneut mit `--overwrite` aus, wenn das Ersetzen des vorhandenen Ziels beabsichtigt ist. Provider können weiterhin Backups auf Elementebene für überschriebene Dateien im Verzeichnis des Migrationsberichts schreiben.
</Warning>

Bei einer frischen OpenClaw-Installation sind Konflikte ungewöhnlich. Sie treten typischerweise auf, wenn Sie den Import auf einer Einrichtung erneut ausführen, die bereits Benutzeränderungen enthält.

## JSON-Ausgabe für Automatisierung

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Mit `--json` und ohne `--yes` gibt die Anwendung den Plan aus und verändert keinen Zustand. Dies ist der sicherste Modus für CI und gemeinsam genutzte Skripte.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Claude-Zustand liegt außerhalb von ~/.claude">
    Übergeben Sie `--from /actual/path` (CLI) oder `--import-source /actual/path` (Onboarding).
  </Accordion>
  <Accordion title="Onboarding verweigert den Import in eine vorhandene Einrichtung">
    Onboarding-Importe erfordern eine frische Einrichtung. Setzen Sie entweder den Zustand zurück und führen Sie das Onboarding erneut durch, oder verwenden Sie direkt `openclaw migrate apply claude`, das `--overwrite` und explizite Backup-Steuerung unterstützt.
  </Accordion>
  <Accordion title="MCP-Server aus Claude Desktop wurden nicht importiert">
    Claude Desktop liest `claude_desktop_config.json` aus einem plattformspezifischen Pfad. Richten Sie `--from` auf das Verzeichnis dieser Datei, wenn OpenClaw sie nicht automatisch erkannt hat.
  </Accordion>
  <Accordion title="Claude-Befehle wurden zu Skills mit deaktiviertem Modellaufruf">
    Dies ist beabsichtigt. Claude-Befehle werden vom Benutzer ausgelöst, daher importiert OpenClaw sie als Skills mit `disable-model-invocation: true`. Bearbeiten Sie das Frontmatter jedes Skills, wenn der Agent sie automatisch aufrufen soll.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Strukturen.
- [Migrationsleitfaden](/de/install/migrating): alle Migrationspfade.
- [Migration von Hermes](/de/install/migrating-hermes): der andere systemübergreifende Importpfad.
- [Onboarding](/de/cli/onboard): Assistentenablauf und nicht interaktive Flags.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach der Migration.
- [Agentenarbeitsbereich](/de/concepts/agent-workspace): wo `AGENTS.md`, `USER.md` und Skills gespeichert sind.
