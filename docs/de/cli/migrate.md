---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Zustand aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-05-12T00:58:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie Zustand aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Gebündelte Provider decken den Zustand der Codex CLI, [Claude](/de/install/migrating-claude) und [Hermes](/de/install/migrating-hermes) ab; Drittanbieter-Plugins können zusätzliche Provider registrieren.

<Tip>
Benutzerorientierte Anleitungen finden Sie unter [Migration von Claude](/de/install/migrating-claude) und [Migration von Hermes](/de/install/migrating-hermes). Der [Migrations-Hub](/de/install/migrating) listet alle Pfade auf.
</Tip>

## Befehle

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
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
  Erlaubt Apply, vorhandene Ziele zu ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Überspringt die Bestätigungsabfrage. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wählt ein Skill-Kopierelement nach Skill-Name oder Element-ID aus. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine Checkbox-Auswahl, und nicht interaktive Migrationen behalten alle geplanten Skills bei.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wählt ein Installationselement für ein Codex-Plugin nach Plugin-Name oder Element-ID aus. Wiederholen Sie das Flag, um mehrere Codex-Plugins zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine native Checkbox-Auswahl für Codex-Plugins, und nicht interaktive Migrationen behalten alle geplanten Plugins bei. Dies gilt nur für quellinstallierte `openai-curated`-Codex-Plugins, die vom Inventar des Codex-App-Servers erkannt werden.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Überspringt das Backup vor Apply. Erfordert `--force`, wenn lokaler OpenClaw-Zustand vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Zusammen mit `--no-backup` erforderlich, wenn Apply andernfalls das Überspringen des Backups verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Gibt den Plan oder das Apply-Ergebnis als JSON aus. Mit `--json` und ohne `--yes` gibt Apply den Plan aus und verändert den Zustand nicht.
</ParamField>

## Sicherheitsmodell

`openclaw migrate` ist vorschauorientiert.

<AccordionGroup>
  <Accordion title="Vorschau vor Apply">
    Der Provider gibt einen aufgeschlüsselten Plan zurück, bevor sich etwas ändert, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Apply-Ausgaben und Migrationsberichte schwärzen verschachtelte, geheimnisähnliche Schlüssel wie API-Schlüssel, Tokens, Autorisierungs-Header, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt eine Vorschau des Plans an und fragt nach, bevor der Zustand geändert wird, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert Apply `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Apply erstellt und verifiziert ein OpenClaw-Backup, bevor die Migration angewendet wird. Wenn noch kein lokaler OpenClaw-Zustand vorhanden ist, wird der Backup-Schritt übersprungen und die Migration kann fortfahren. Um ein Backup zu überspringen, wenn Zustand vorhanden ist, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    Apply verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Befehl anschließend mit `--overwrite` erneut aus, wenn das Ersetzen vorhandener Ziele beabsichtigt ist. Provider können weiterhin Backups auf Elementebene für überschriebene Dateien im Verzeichnis des Migrationsberichts schreiben.
  </Accordion>
  <Accordion title="Secrets">
    Secrets werden standardmäßig nie importiert. Verwenden Sie `--include-secrets`, um unterstützte Zugangsdaten zu importieren.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der gebündelte Claude-Provider erkennt den Zustand von Claude Code standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude-Code-Home oder Projektstammverzeichnis zu importieren.

<Tip>
Eine benutzerorientierte Anleitung finden Sie unter [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projektdateien `CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agentenarbeitsbereich.
- Benutzerdatei `~/.claude/CLAUDE.md`, angehängt an `USER.md` im Arbeitsbereich.
- MCP-Serverdefinitionen aus der Projektdatei `.mcp.json`, Claude Code `~/.claude.json` und Claude Desktop `claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten.
- Claude-Befehls-Markdown-Dateien, die in OpenClaw-Skills mit ausschließlich manueller Auslösung umgewandelt werden.

### Archiv- und manuell zu prüfender Zustand

Claude-Hooks, Berechtigungen, Umgebungsstandardwerte, lokaler Speicher, pfadbezogene Regeln, Subagenten, Caches, Pläne und Projekthistorie werden im Migrationsbericht beibehalten oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine breiten Allowlists und importiert keinen OAuth-/Desktop-Zugangsdatenzustand automatisch.

## Codex-Provider

Der gebündelte Codex-Provider erkennt den Zustand der Codex CLI standardmäßig unter `~/.codex` oder unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um ein bestimmtes Codex-Home zu inventarisieren.

Verwenden Sie diesen Provider, wenn Sie zum OpenClaw-Codex-Harness wechseln und nützliche persönliche Codex-CLI-Assets gezielt übernehmen möchten. Lokale Starts des Codex-App-Servers verwenden agentenspezifische Verzeichnisse für `CODEX_HOME` und `HOME`, sodass sie Ihren persönlichen Codex-CLI-Zustand standardmäßig nicht lesen.

Wenn `openclaw migrate codex` in einem interaktiven Terminal ausgeführt wird, zeigt es eine Vorschau des vollständigen Plans und öffnet danach Checkbox-Auswahlen vor der endgültigen Apply-Bestätigung. Skill-Kopierelemente werden zuerst abgefragt. Verwenden Sie `Toggle all on` oder `Toggle all off` für die Massenauswahl; geplante Skills sind anfangs ausgewählt, konfliktbehaftete Skills sind anfangs nicht ausgewählt, und `Skip for now` überspringt Skill-Kopien für diesen Lauf, während die Plugin-Auswahl trotzdem fortgesetzt wird. Wenn quellinstallierte kuratierte Codex-Plugins migrierbar sind und `--plugin` nicht angegeben wurde, fragt die Migration anschließend nach der Aktivierung nativer Codex-Plugins nach Plugin-Name. Plugin-Elemente sind anfangs ausgewählt, sofern die Zielkonfiguration des OpenClaw-Codex-Plugins dieses Plugin nicht bereits enthält. Vorhandene Ziel-Plugins sind anfangs nicht ausgewählt und zeigen einen Konflikthinweis wie `conflict: plugin exists`; wählen Sie `Toggle all off`, um in diesem Lauf keine nativen Codex-Plugins zu migrieren, oder `Skip for now`, um vor dem Anwenden zu stoppen. Für skriptgesteuerte oder exakte Läufe übergeben Sie `--skill <name>` einmal pro Skill, zum Beispiel:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Verwenden Sie `--plugin <name>`, um die Migration nativer Codex-Plugins nicht interaktiv auf ein oder mehrere quellinstallierte kuratierte Plugins zu beschränken:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Was Codex importiert

- Codex-CLI-Skill-Verzeichnisse unter `$CODEX_HOME/skills`, ausgenommen der `.system`-Cache von Codex.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, kopiert in den aktuellen OpenClaw-Agentenarbeitsbereich, wenn Sie agentenspezifische Eigentümerschaft wünschen.
- Quellinstallierte `openai-curated`-Codex-Plugins, die über `plugin/list` des Codex-App-Servers erkannt werden. Apply ruft `plugin/install` des App-Servers für jedes ausgewählte Plugin auf, selbst wenn der Ziel-App-Server dieses Plugin bereits als installiert und aktiviert meldet. Migrierte Codex-Plugins sind nur in Sitzungen nutzbar, die das native Codex-Harness auswählen; sie werden Pi, normalen OpenAI-Provider-Läufen, ACP-Konversationsbindungen oder anderen Harnesses nicht zugänglich gemacht.

### Manuell zu prüfender Codex-Zustand

Codex `config.toml`, native `hooks/hooks.json`, nicht kuratierte Marketplaces und zwischengespeicherte Plugin-Bundles, die keine quellinstallierten kuratierten Plugins sind, werden nicht automatisch aktiviert. Sie werden für die manuelle Prüfung in den Migrationsbericht kopiert oder dort gemeldet.

Für migrierte quellinstallierte kuratierte Plugins schreibt Apply:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- einen expliziten Plugin-Eintrag mit `marketplaceName: "openai-curated"` und `pluginName` für jedes ausgewählte Plugin

Die Migration schreibt niemals `plugins["*"]` und speichert niemals lokale Marketplace-Cache-Pfade. Installationen, die Authentifizierung erfordern, werden am betroffenen Plugin-Element mit `status: "skipped"`, `reason: "auth_required"` und bereinigten App-Kennungen gemeldet. Ihre expliziten Konfigurationseinträge werden deaktiviert geschrieben, bis Sie sie erneut autorisieren und aktivieren. Andere Installationsfehler sind elementbezogene `error`-Ergebnisse.

Wenn das Plugin-Inventar des Codex-App-Servers während der Planung nicht verfügbar ist, fällt die Migration auf beratende Elemente aus zwischengespeicherten Bundles zurück, statt die gesamte Migration fehlschlagen zu lassen.

## Hermes-Provider

Der gebündelte Hermes-Provider erkennt Zustand standardmäßig unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn Hermes an einem anderen Ort liegt.

### Was Hermes importiert

- Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agentenarbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an Speicherdateien im Arbeitsbereich.
- Standardwerte der Speicherkonfiguration für OpenClaw-Dateispeicher sowie Archiv- oder manuell zu prüfende Elemente für externe Speicher-Provider wie Honcho.
- Skills, die eine Datei `SKILL.md` unter `skills/<name>/` enthalten.
- Konfigurationswerte pro Skill aus `skills.config`.
- Unterstützte API-Schlüssel aus `.env`, nur mit `--include-secrets`.

### Unterstützte `.env`-Schlüssel

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Nur archivierter Zustand

Hermes-Zustand, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die Live-Konfiguration oder Zugangsdaten von OpenClaw geladen. Dadurch wird undurchsichtiger oder unsicherer Zustand bewahrt, ohne vorzugeben, dass OpenClaw ihn automatisch ausführen oder ihm automatisch vertrauen kann:

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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Core besitzt die CLI-Orchestrierung, Backup-Richtlinie, Abfragen, JSON-Ausgabe und Konfliktvorprüfung. Core übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan nur dann neu erstellen, wenn dieses Argument aus Kompatibilitätsgründen fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` für die Elementerstellung und Zusammenfassungszählungen sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, nur archivierte Berichtskopien, zwischengespeicherte Config-Runtime-Wrapper und Migrationsberichte verwenden.

## Onboarding-Integration

Onboarding kann eine Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen weiterhin eine Vorschau, bevor etwas angewendet wird.

<Note>
Onboarding-Importe erfordern ein frisches OpenClaw-Setup. Setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, wenn bereits lokaler Zustand vorhanden ist. Importe mit Backup und Überschreiben oder Zusammenführen sind für bestehende Setups durch ein Feature-Gate geschützt.
</Note>

## Verwandte Themen

- [Migration von Hermes](/de/install/migrating-hermes): benutzerorientierte Schritt-für-Schritt-Anleitung.
- [Migration von Claude](/de/install/migrating-claude): benutzerorientierte Schritt-für-Schritt-Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Computer verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach dem Anwenden einer Migration.
- [Plugins](/de/tools/plugin): Plugin-Installation und -Registrierung.
