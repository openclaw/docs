---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Zustand aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-04-30T06:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie Zustand aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Mitgelieferte Provider decken [Claude](/de/install/migrating-claude) und [Hermes](/de/install/migrating-hermes) ab; Drittanbieter-Plugins können zusätzliche Provider registrieren.

<Tip>
Benutzerorientierte Schritt-für-Schritt-Anleitungen finden Sie unter [Migration von Claude](/de/install/migrating-claude) und [Migration von Hermes](/de/install/migrating-hermes). Der [Migrations-Hub](/de/install/migrating) listet alle Pfade auf.
</Tip>

## Befehle

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  Importiert unterstützte Anmeldedaten. Standardmäßig deaktiviert.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Erlaubt `apply`, vorhandene Ziele zu ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Überspringt die Bestätigungsabfrage. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Überspringt das Backup vor der Anwendung. Erfordert `--force`, wenn lokaler OpenClaw-Zustand vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Erforderlich zusammen mit `--no-backup`, wenn `apply` andernfalls das Überspringen des Backups verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Gibt den Plan oder das Anwendungsergebnis als JSON aus. Mit `--json` und ohne `--yes` gibt `apply` den Plan aus und verändert den Zustand nicht.
</ParamField>

## Sicherheitsmodell

`openclaw migrate` folgt dem Prinzip Vorschau zuerst.

<AccordionGroup>
  <Accordion title="Vorschau vor der Anwendung">
    Der Provider gibt einen aufgeschlüsselten Plan zurück, bevor etwas geändert wird, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Anwendungsausgaben und Migrationsberichte schwärzen verschachtelte Schlüssel, die wie Geheimnisse aussehen, etwa API-Schlüssel, Tokens, Autorisierungs-Header, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt eine Vorschau des Plans an und fragt vor Zustandsänderungen nach, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert `apply` `--yes`.

  </Accordion>
  <Accordion title="Backups">
    `apply` erstellt und verifiziert ein OpenClaw-Backup, bevor die Migration angewendet wird. Wenn noch kein lokaler OpenClaw-Zustand vorhanden ist, wird der Backup-Schritt übersprungen und die Migration kann fortgesetzt werden. Um ein Backup zu überspringen, wenn Zustand vorhanden ist, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    `apply` verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Befehl anschließend erneut mit `--overwrite` aus, wenn das Ersetzen vorhandener Ziele beabsichtigt ist. Provider können weiterhin Backups auf Elementebene für überschriebene Dateien im Verzeichnis des Migrationsberichts schreiben.
  </Accordion>
  <Accordion title="Geheimnisse">
    Geheimnisse werden standardmäßig nie importiert. Verwenden Sie `--include-secrets`, um unterstützte Anmeldedaten zu importieren.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der mitgelieferte Claude-Provider erkennt Claude Code-Zustand standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude Code-Home oder Projektstammverzeichnis zu importieren.

<Tip>
Eine benutzerorientierte Schritt-für-Schritt-Anleitung finden Sie unter [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projekt-`CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agentenarbeitsbereich.
- Benutzer-`~/.claude/CLAUDE.md`, angehängt an `USER.md` im Arbeitsbereich.
- MCP-Serverdefinitionen aus Projekt-`.mcp.json`, Claude Code-`~/.claude.json` und Claude Desktop-`claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten.
- Claude-Befehls-Markdown-Dateien, konvertiert in OpenClaw-Skills mit ausschließlich manueller Ausführung.

### Archiv- und manuell zu prüfender Zustand

Claude-Hooks, Berechtigungen, Umgebungsstandards, lokaler Speicher, pfadbezogene Regeln, Subagenten, Caches, Pläne und Projekthistorie werden im Migrationsbericht bewahrt oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt keine Hooks aus, kopiert keine breiten Allowlists und importiert keinen OAuth-/Desktop-Anmeldedatenzustand automatisch.

## Hermes-Provider

Der mitgelieferte Hermes-Provider erkennt Zustand standardmäßig unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn Hermes an einem anderen Ort liegt.

### Was Hermes importiert

- Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agentenarbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an Speicherdateien des Arbeitsbereichs.
- Standards der Speicherkonfiguration für OpenClaw-Dateispeicher sowie Archiv- oder manuell zu prüfende Elemente für externe Speicher-Provider wie Honcho.
- Skills, die eine `SKILL.md`-Datei unter `skills/<name>/` enthalten.
- Konfigurationswerte pro Skill aus `skills.config`.
- Unterstützte API-Schlüssel aus `.env`, nur mit `--include-secrets`.

### Unterstützte `.env`-Schlüssel

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Nur archivierter Zustand

Hermes-Zustand, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder Anmeldedaten geladen. Dadurch wird undurchsichtiger oder unsicherer Zustand bewahrt, ohne vorzugeben, dass OpenClaw ihn automatisch ausführen oder ihm vertrauen kann:

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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Core übernimmt CLI-Orchestrierung, Backup-Richtlinie, Eingabeaufforderungen, JSON-Ausgabe und Konfliktvorprüfung. Core übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan nur dann aus Kompatibilitätsgründen neu erstellen, wenn dieses Argument fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` für Elementerstellung und Zusammenfassungszahlen sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, reine Archivberichtskopien, zwischengespeicherte Config-Runtime-Wrapper und Migrationsberichte verwenden.

## Onboarding-Integration

Onboarding kann eine Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen vor der Anwendung weiterhin eine Vorschau an.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, wenn bereits lokaler Zustand vorhanden ist. Backup-plus-Überschreiben oder zusammenführende Importe sind für vorhandene Einrichtungen per Feature-Gate geschützt.
</Note>

## Verwandte Themen

- [Migration von Hermes](/de/install/migrating-hermes): benutzerorientierte Schritt-für-Schritt-Anleitung.
- [Migration von Claude](/de/install/migrating-claude): benutzerorientierte Schritt-für-Schritt-Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Rechner umziehen.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach Anwendung einer Migration.
- [Plugins](/de/tools/plugin): Plugin-Installation und -Registrierung.
