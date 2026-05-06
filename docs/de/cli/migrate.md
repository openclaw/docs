---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Zustand aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-05-06T06:42:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie Status aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Mitgelieferte Provider decken Codex CLI-Status, [Claude](/de/install/migrating-claude) und [Hermes](/de/install/migrating-hermes) ab; Drittanbieter-Plugins können zusätzliche Provider registrieren.

<Tip>
Benutzerorientierte Anleitungen finden Sie unter [Migration von Claude](/de/install/migrating-claude) und [Migration von Hermes](/de/install/migrating-hermes). Der [Migrations-Hub](/de/install/migrating) listet alle Pfade auf.
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
  Erstellt den Plan und beendet den Vorgang, ohne den Status zu ändern.
</ParamField>
<ParamField path="--from <path>" type="string">
  Überschreibt das Quellverzeichnis für den Status. Hermes verwendet standardmäßig `~/.hermes`.
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
  Wählt ein einzelnes Skill-Kopierelement anhand des Skill-Namens oder der Element-ID aus. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Wenn es ausgelassen wird, zeigen interaktive Codex-Migrationen eine Checkbox-Auswahl, und nicht interaktive Migrationen behalten alle geplanten Skills bei.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Überspringt die Sicherung vor dem Anwenden. Erfordert `--force`, wenn lokaler OpenClaw-Status vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Erforderlich zusammen mit `--no-backup`, wenn `apply` andernfalls das Überspringen der Sicherung verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Gibt den Plan oder das Anwendungsergebnis als JSON aus. Mit `--json` und ohne `--yes` gibt `apply` den Plan aus und verändert keinen Status.
</ParamField>

## Sicherheitsmodell

`openclaw migrate` ist auf Vorschau zuerst ausgelegt.

<AccordionGroup>
  <Accordion title="Vorschau vor dem Anwenden">
    Der Provider gibt einen aufgeschlüsselten Plan zurück, bevor sich etwas ändert, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Anwendungsausgaben und Migrationsberichte schwärzen verschachtelte schlüsselartige geheime Werte wie API-Schlüssel, Tokens, Autorisierungs-Header, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt eine Vorschau des Plans und fragt nach, bevor Status geändert wird, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert `apply` `--yes`.

  </Accordion>
  <Accordion title="Sicherungen">
    `apply` erstellt und verifiziert eine OpenClaw-Sicherung, bevor die Migration angewendet wird. Wenn noch kein lokaler OpenClaw-Status vorhanden ist, wird der Sicherungsschritt übersprungen und die Migration kann fortgesetzt werden. Um eine Sicherung zu überspringen, wenn Status vorhanden ist, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    `apply` verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Befehl dann mit `--overwrite` erneut aus, wenn das Ersetzen vorhandener Ziele beabsichtigt ist. Provider können für überschriebene Dateien weiterhin Sicherungen auf Elementebene im Verzeichnis des Migrationsberichts schreiben.
  </Accordion>
  <Accordion title="Secrets">
    Secrets werden standardmäßig nie importiert. Verwenden Sie `--include-secrets`, um unterstützte Zugangsdaten zu importieren.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der mitgelieferte Claude-Provider erkennt Claude Code-Status standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude Code-Home oder Projekt-Root zu importieren.

<Tip>
Eine benutzerorientierte Anleitung finden Sie unter [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projekt-`CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agent-Arbeitsbereich.
- Benutzer-`~/.claude/CLAUDE.md`, angehängt an die Arbeitsbereichsdatei `USER.md`.
- MCP-Serverdefinitionen aus Projekt-`.mcp.json`, Claude Code `~/.claude.json` und Claude Desktop `claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten.
- Claude-Befehls-Markdown-Dateien, die in OpenClaw-Skills mit ausschließlich manueller Ausführung konvertiert werden.

### Archiv- und manuell zu prüfender Status

Claude-Hooks, Berechtigungen, Umgebungsstandardwerte, lokaler Speicher, pfadbezogene Regeln, Subagents, Caches, Pläne und Projekthistorie werden im Migrationsbericht aufbewahrt oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine breiten Zulassungslisten und importiert OAuth-/Desktop-Zugangsdatenstatus nicht automatisch.

## Codex-Provider

Der mitgelieferte Codex-Provider erkennt Codex CLI-Status standardmäßig unter `~/.codex` oder
unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um
ein bestimmtes Codex-Home zu inventarisieren.

Verwenden Sie diesen Provider, wenn Sie zum OpenClaw-Codex-Harness wechseln und
nützliche persönliche Codex CLI-Assets bewusst übernehmen möchten. Lokale Codex-App-Server-
Starts verwenden agentenspezifische `CODEX_HOME`- und `HOME`-Verzeichnisse, sodass sie Ihren
persönlichen Codex CLI-Status standardmäßig nicht lesen.

Wenn Sie `openclaw migrate codex` in einem interaktiven Terminal ausführen, wird der vollständige
Plan angezeigt, danach öffnet sich eine Checkbox-Auswahl für Skill-Kopierelemente vor der endgültigen
Bestätigung zum Anwenden. Verwenden Sie `Toggle all on` oder `Toggle all off` für die Massenauswahl;
geplante Skills sind zunächst aktiviert, Skills mit Konflikten zunächst deaktiviert, und `Skip for now`
lässt Skills unverändert, ohne anzuwenden. Für skriptgesteuerte oder exakte Läufe übergeben Sie
`--skill <name>` einmal pro Skill, zum Beispiel:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Was Codex importiert

- Codex CLI-Skill-Verzeichnisse unter `$CODEX_HOME/skills`, ausgenommen Codex'
  `.system`-Cache.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, kopiert in den aktuellen
  OpenClaw-Agent-Arbeitsbereich, wenn Sie agentenspezifische Eigentümerschaft wünschen.

### Manuell zu prüfender Codex-Status

Codex-native Plugins, `config.toml` und native `hooks/hooks.json` werden nicht
automatisch aktiviert. Plugins können MCP-Server, Apps, Hooks oder anderes
ausführbares Verhalten bereitstellen, daher meldet der Provider sie zur Prüfung, statt sie
in OpenClaw zu laden. Konfigurations- und Hook-Dateien werden zur manuellen Prüfung in den Migrationsbericht
kopiert.

## Hermes-Provider

Der mitgelieferte Hermes-Provider erkennt Status standardmäßig unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn Hermes an einem anderen Ort liegt.

### Was Hermes importiert

- Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agent-Arbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an Arbeitsbereichsspeicherdateien.
- Standardwerte der Speicherkonfiguration für OpenClaw-Dateispeicher sowie Archiv- oder manuell zu prüfende Elemente für externe Speicher-Provider wie Honcho.
- Skills, die eine `SKILL.md`-Datei unter `skills/<name>/` enthalten.
- Pro-Skill-Konfigurationswerte aus `skills.config`.
- Unterstützte API-Schlüssel aus `.env`, nur mit `--include-secrets`.

### Unterstützte `.env`-Schlüssel

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Nur-Archiv-Status

Hermes-Status, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder Zugangsdaten geladen. Dadurch bleibt opaker oder unsicherer Status erhalten, ohne vorzugeben, OpenClaw könne ihn automatisch ausführen oder ihm vertrauen:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Nach dem Anwenden

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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Core besitzt CLI-Orchestrierung, Sicherungsrichtlinie, Eingabeaufforderungen, JSON-Ausgabe und Konflikt-Preflight. Core übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan nur dann aus Kompatibilitätsgründen neu erstellen, wenn dieses Argument fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` für Elementerstellung und Zusammenfassungszählungen verwenden, plus `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, reine Archiv-Berichtskopien, zwischengespeicherte Config-Runtime-Wrapper und Migrationsberichte.

## Onboarding-Integration

Onboarding kann eine Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen weiterhin eine Vorschau vor dem Anwenden.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Setzen Sie zuerst Konfiguration, Zugangsdaten, Sitzungen und den Arbeitsbereich zurück, wenn Sie bereits lokalen Status haben. Backup-plus-Overwrite- oder Merge-Importe sind für vorhandene Einrichtungen Feature-gated.
</Note>

## Verwandt

- [Migration von Hermes](/de/install/migrating-hermes): benutzerorientierte Anleitung.
- [Migration von Claude](/de/install/migrating-claude): benutzerorientierte Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Computer verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach dem Anwenden einer Migration.
- [Plugins](/de/tools/plugin): Plugin-Installation und Registrierung.
