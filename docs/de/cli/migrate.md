---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Zustand aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-04-30T20:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie Zustand aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Gebündelte Provider decken Codex-CLI-Zustand, [Claude](/de/install/migrating-claude) und [Hermes](/de/install/migrating-hermes) ab; Drittanbieter-Plugins können zusätzliche Provider registrieren.

<Tip>
Für nutzerorientierte Anleitungen siehe [Migration von Claude](/de/install/migrating-claude) und [Migration von Hermes](/de/install/migrating-hermes). Der [Migrations-Hub](/de/install/migrating) listet alle Pfade auf.
</Tip>

## Befehle

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Name eines registrierten Migrations-Providers, zum Beispiel `hermes`. Führen Sie `openclaw migrate list` aus, um installierte Provider anzuzeigen.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Erstellt den Plan und beendet den Vorgang, ohne den Zustand zu ändern.
</ParamField>
<ParamField path="--from <path>" type="string">
  Überschreibt das Quellverzeichnis für den Zustand. Hermes verwendet standardmäßig `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importiert unterstützte Zugangsdaten. Standardmäßig deaktiviert.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Erlaubt `apply`, vorhandene Ziele zu ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Überspringt die Bestätigungsabfrage. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wählt ein Skill-Kopierelement nach Skill-Name oder Element-ID aus. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Wenn es ausgelassen wird, zeigen interaktive Codex-Migrationen eine Checkbox-Auswahl an, und nicht interaktive Migrationen behalten alle geplanten Skills bei.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Überspringt das Backup vor der Anwendung. Erfordert `--force`, wenn lokaler OpenClaw-Zustand vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Erforderlich zusammen mit `--no-backup`, wenn `apply` das Überspringen des Backups andernfalls verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Gibt den Plan oder das Anwendungsergebnis als JSON aus. Mit `--json` und ohne `--yes` gibt `apply` den Plan aus und verändert keinen Zustand.
</ParamField>

## Sicherheitsmodell

`openclaw migrate` folgt dem Vorschau-zuerst-Prinzip.

<AccordionGroup>
  <Accordion title="Vorschau vor apply">
    Der Provider gibt einen aufgeschlüsselten Plan zurück, bevor sich etwas ändert, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Anwendungsausgaben und Migrationsberichte schwärzen verschachtelte, geheimnisähnliche Schlüssel wie API-Schlüssel, Tokens, Autorisierungsheader, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt den Plan in der Vorschau an und fragt vor Zustandsänderungen nach, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert `apply` `--yes`.

  </Accordion>
  <Accordion title="Backups">
    `apply` erstellt und verifiziert ein OpenClaw-Backup, bevor die Migration angewendet wird. Wenn noch kein lokaler OpenClaw-Zustand vorhanden ist, wird der Backup-Schritt übersprungen und die Migration kann fortgesetzt werden. Um ein Backup zu überspringen, wenn Zustand vorhanden ist, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    `apply` verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Befehl anschließend mit `--overwrite` erneut aus, wenn das Ersetzen vorhandener Ziele beabsichtigt ist. Provider können im Migrationsberichtverzeichnis weiterhin Backups auf Elementebene für überschriebene Dateien schreiben.
  </Accordion>
  <Accordion title="Secrets">
    Secrets werden standardmäßig nie importiert. Verwenden Sie `--include-secrets`, um unterstützte Zugangsdaten zu importieren.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der gebündelte Claude-Provider erkennt Claude-Code-Zustand standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude-Code-Home oder Projekt-Root zu importieren.

<Tip>
Für eine nutzerorientierte Anleitung siehe [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projekt-`CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agenten-Arbeitsbereich.
- Nutzer-`~/.claude/CLAUDE.md`, angehängt an `USER.md` im Arbeitsbereich.
- MCP-Serverdefinitionen aus Projekt-`.mcp.json`, Claude Code `~/.claude.json` und Claude Desktop `claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten.
- Claude-Befehls-Markdown-Dateien, konvertiert in OpenClaw-Skills mit ausschließlich manueller Ausführung.

### Archiv- und manuell zu prüfender Zustand

Claude-Hooks, Berechtigungen, Umgebungs-Defaults, lokaler Speicher, pfadgebundene Regeln, Subagents, Caches, Pläne und Projekthistorie werden im Migrationsbericht aufbewahrt oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine breiten Allowlisten und importiert OAuth-/Desktop-Zugangsdatenzustand nicht automatisch.

## Codex-Provider

Der gebündelte Codex-Provider erkennt Codex-CLI-Zustand standardmäßig unter `~/.codex` oder
unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um
ein bestimmtes Codex-Home zu inventarisieren.

Verwenden Sie diesen Provider beim Wechsel zum OpenClaw-Codex-Harness, wenn Sie
nützliche persönliche Codex-CLI-Ressourcen bewusst übernehmen möchten. Lokale Codex-App-Server-
Starts verwenden agentenspezifische `CODEX_HOME`- und `HOME`-Verzeichnisse, sodass sie Ihren
persönlichen Codex-CLI-Zustand standardmäßig nicht lesen.

Wenn Sie `openclaw migrate codex` in einem interaktiven Terminal ausführen, wird der vollständige
Plan angezeigt; anschließend öffnet sich vor der abschließenden
Anwendungsbestätigung eine Checkbox-Auswahl für Skill-Kopierelemente. Alle Skills sind anfangs ausgewählt; deaktivieren Sie jeden Skill, den Sie nicht
in diesen Agenten kopieren möchten. Für skriptgesteuerte oder exakte Läufe übergeben Sie `--skill <name>` einmal
pro Skill, zum Beispiel:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Was Codex importiert

- Codex-CLI-Skill-Verzeichnisse unter `$CODEX_HOME/skills`, ausgenommen der
  `.system`-Cache von Codex.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, kopiert in den aktuellen
  OpenClaw-Agenten-Arbeitsbereich, wenn Sie agentenspezifische Zuständigkeit wünschen.

### Manuell zu prüfender Codex-Zustand

Native Codex-Plugins, `config.toml` und native `hooks/hooks.json` werden nicht
automatisch aktiviert. Plugins können MCP-Server, Apps, Hooks oder anderes
ausführbares Verhalten bereitstellen, daher meldet der Provider sie zur Prüfung, statt sie
in OpenClaw zu laden. Konfigurations- und Hook-Dateien werden zur manuellen Prüfung
in den Migrationsbericht kopiert.

## Hermes-Provider

Der gebündelte Hermes-Provider erkennt Zustand standardmäßig unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn Hermes an anderer Stelle liegt.

### Was Hermes importiert

- Standard-Modellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agenten-Arbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an die Speicherdateien im Arbeitsbereich.
- Speicher-Konfigurationsdefaults für OpenClaw-Dateispeicher sowie Archiv- oder manuell zu prüfende Elemente für externe Speicher-Provider wie Honcho.
- Skills, die eine `SKILL.md`-Datei unter `skills/<name>/` enthalten.
- Konfigurationswerte pro Skill aus `skills.config`.
- Unterstützte API-Schlüssel aus `.env`, nur mit `--include-secrets`.

### Unterstützte `.env`-Schlüssel

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Nur archivierter Zustand

Hermes-Zustand, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder Zugangsdaten geladen. So bleibt undurchsichtiger oder unsicherer Zustand erhalten, ohne vorzugeben, OpenClaw könne ihn automatisch ausführen oder ihm vertrauen:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Nach der Anwendung

```bash
openclaw doctor
```

## Plugin-Vertrag

Migrationsquellen sind Plugins. Ein Plugin deklariert seine Provider-IDs in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Core besitzt CLI-Orchestrierung, Backup-Richtlinie, Abfragen, JSON-Ausgabe und Konflikt-Preflight. Core übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan nur dann neu erstellen, wenn dieses Argument aus Kompatibilitätsgründen fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` für Elementerstellung und Zusammenfassungszählungen verwenden, sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, reine Archivkopien für Berichte, gecachte Config-Runtime-Wrapper und Migrationsberichte.

## Onboarding-Integration

Onboarding kann Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen vor der Anwendung weiterhin eine Vorschau an.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Setzen Sie zuerst Konfiguration, Zugangsdaten, Sitzungen und den Arbeitsbereich zurück, wenn bereits lokaler Zustand vorhanden ist. Backup-plus-Überschreiben oder Merge-Importe sind für bestehende Einrichtungen Feature-gated.
</Note>

## Verwandt

- [Migration von Hermes](/de/install/migrating-hermes): nutzerorientierte Anleitung.
- [Migration von Claude](/de/install/migrating-claude): nutzerorientierte Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Rechner verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach Anwendung einer Migration.
- [Plugins](/de/tools/plugin): Plugin-Installation und Registrierung.
