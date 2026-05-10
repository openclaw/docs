---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Zustand aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-05-10T19:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie Zustand aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Mitgelieferte Provider decken Codex-CLI-Zustand, [Claude](/de/install/migrating-claude) und [Hermes](/de/install/migrating-hermes) ab; Drittanbieter-Plugins können zusätzliche Provider registrieren.

<Tip>
Benutzerorientierte Schritt-für-Schritt-Anleitungen finden Sie unter [Migration von Claude](/de/install/migrating-claude) und [Migration von Hermes](/de/install/migrating-hermes). Der [Migrations-Hub](/de/install/migrating) listet alle Pfade auf.
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
  Plan erstellen und beenden, ohne den Zustand zu ändern.
</ParamField>
<ParamField path="--from <path>" type="string">
  Überschreibt das Quellverzeichnis für den Zustand. Hermes verwendet standardmäßig `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Unterstützte Anmeldedaten importieren. Standardmäßig deaktiviert.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Erlaubt Apply, vorhandene Ziele zu ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Bestätigungsaufforderung überspringen. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wählt ein Skill-Kopierelement nach Skill-Name oder Element-ID aus. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine Checkbox-Auswahl an, und nicht interaktive Migrationen behalten alle geplanten Skills bei.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wählt ein Codex-Plugin-Installationselement nach Plugin-Name oder Element-ID aus. Wiederholen Sie das Flag, um mehrere Codex-Plugins zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine native Codex-Plugin-Checkbox-Auswahl an, und nicht interaktive Migrationen behalten alle geplanten Plugins bei. Dies gilt nur für aus der Quelle installierte `openai-curated`-Codex-Plugins, die vom Codex-App-Server-Inventar gefunden wurden.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Backup vor Apply überspringen. Erfordert `--force`, wenn lokaler OpenClaw-Zustand vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Zusammen mit `--no-backup` erforderlich, wenn Apply das Überspringen des Backups andernfalls verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Plan oder Apply-Ergebnis als JSON ausgeben. Mit `--json` und ohne `--yes` gibt Apply den Plan aus und verändert den Zustand nicht.
</ParamField>

## Sicherheitsmodell

`openclaw migrate` ist vorschauorientiert.

<AccordionGroup>
  <Accordion title="Vorschau vor Apply">
    Der Provider gibt einen detaillierten Plan zurück, bevor irgendetwas geändert wird, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Apply-Ausgabe und Migrationsberichte schwärzen verschachtelte, geheimnisartig aussehende Schlüssel wie API-Schlüssel, Token, Autorisierungs-Header, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt eine Vorschau des Plans an und fragt vor Zustandsänderungen nach, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert Apply `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Apply erstellt und verifiziert ein OpenClaw-Backup, bevor die Migration angewendet wird. Wenn noch kein lokaler OpenClaw-Zustand vorhanden ist, wird der Backup-Schritt übersprungen, und die Migration kann fortfahren. Um ein Backup zu überspringen, wenn Zustand vorhanden ist, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    Apply verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan, und führen Sie den Befehl anschließend mit `--overwrite` erneut aus, wenn das Ersetzen vorhandener Ziele beabsichtigt ist. Provider können weiterhin Backups auf Elementebene für überschriebene Dateien im Migrationsberichtverzeichnis schreiben.
  </Accordion>
  <Accordion title="Secrets">
    Secrets werden standardmäßig nie importiert. Verwenden Sie `--include-secrets`, um unterstützte Anmeldedaten zu importieren.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der mitgelieferte Claude-Provider erkennt Claude-Code-Zustand standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude-Code-Home oder Projekt-Root zu importieren.

<Tip>
Eine benutzerorientierte Schritt-für-Schritt-Anleitung finden Sie unter [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projekt-`CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agent-Workspace.
- Benutzer-`~/.claude/CLAUDE.md`, angehängt an Workspace-`USER.md`.
- MCP-Serverdefinitionen aus Projekt-`.mcp.json`, Claude Code `~/.claude.json` und Claude Desktop `claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten.
- Claude-Befehls-Markdown-Dateien, konvertiert in OpenClaw-Skills mit ausschließlich manueller Invocation.

### Archiv- und manuell zu prüfender Zustand

Claude-Hooks, Berechtigungen, Umgebungsstandards, lokaler Speicher, pfadbezogene Regeln, Subagents, Caches, Pläne und Projekthistorie werden im Migrationsbericht beibehalten oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine breiten Allowlists und importiert OAuth-/Desktop-Anmeldedatenzustand nicht automatisch.

## Codex-Provider

Der mitgelieferte Codex-Provider erkennt Codex-CLI-Zustand standardmäßig unter `~/.codex` oder
unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um
ein bestimmtes Codex-Home zu inventarisieren.

Verwenden Sie diesen Provider, wenn Sie zum OpenClaw-Codex-Harness wechseln und
nützliche persönliche Codex-CLI-Assets bewusst übernehmen möchten. Lokale Codex-App-Server-
Starts verwenden pro Agent eigene `CODEX_HOME`- und `HOME`-Verzeichnisse, sodass sie
Ihren persönlichen Codex-CLI-Zustand standardmäßig nicht lesen.

Wenn `openclaw migrate codex` in einem interaktiven Terminal ausgeführt wird, zeigt es zunächst den vollständigen
Plan an und öffnet dann Checkbox-Auswahlen vor der finalen Apply-Bestätigung. Skill-
Kopierelemente werden zuerst abgefragt. Verwenden Sie `Toggle all on` oder `Toggle all off` für die Massen-
Auswahl; geplante Skills starten ausgewählt, konfliktbehaftete Skills starten nicht ausgewählt, und
`Skip for now` überspringt Skill-Kopien für diesen Lauf, fährt aber trotzdem mit der Plugin-
Auswahl fort. Wenn aus der Quelle installierte kuratierte Codex-Plugins migrierbar sind und
`--plugin` nicht angegeben wurde, fragt die Migration anschließend die native Codex-Plugin-
Aktivierung nach Plugin-Namen ab. Plugin-Elemente
starten ausgewählt, sofern die Zielkonfiguration des OpenClaw-Codex-Plugins dieses
Plugin nicht bereits enthält. Vorhandene Ziel-Plugins starten nicht ausgewählt und zeigen einen Konflikthinweis wie
`conflict: plugin exists`; wählen Sie `Toggle all off`, um in diesem Lauf keine nativen Codex-
Plugins zu migrieren, oder `Skip for now`, um vor dem Anwenden zu stoppen. Für skriptgesteuerte oder
exakte Läufe übergeben Sie `--skill <name>` einmal pro Skill, zum Beispiel:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Verwenden Sie `--plugin <name>`, um die Migration nativer Codex-Plugins nicht interaktiv
auf ein oder mehrere aus der Quelle installierte kuratierte Plugins zu begrenzen:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Was Codex importiert

- Codex-CLI-Skill-Verzeichnisse unter `$CODEX_HOME/skills`, ausgenommen Codex'
  `.system`-Cache.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, kopiert in den aktuellen
  OpenClaw-Agent-Workspace, wenn Sie Eigentümerschaft pro Agent wünschen.
- Aus der Quelle installierte `openai-curated`-Codex-Plugins, gefunden über Codex-
  App-Server `plugin/list`. Apply ruft App-Server `plugin/install` für jedes
  ausgewählte Plugin auf, selbst wenn der Ziel-App-Server dieses Plugin bereits als
  installiert und aktiviert meldet. Migrierte Codex-Plugins sind nur in Sitzungen nutzbar, die
  das native Codex-Harness auswählen; sie werden nicht für Pi, normale OpenAI-
  Provider-Läufe, ACP-Konversationsbindungen oder andere Harnesses verfügbar gemacht.

### Manuell zu prüfender Codex-Zustand

Codex `config.toml`, native `hooks/hooks.json`, nicht kuratierte Marketplaces und
zwischengespeicherte Plugin-Bundles, die keine aus der Quelle installierten kuratierten Plugins sind, werden nicht
automatisch aktiviert. Sie werden zur manuellen Prüfung in den Migrationsbericht kopiert oder dort gemeldet.

Für migrierte aus der Quelle installierte kuratierte Plugins schreibt Apply:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- einen expliziten Plugin-Eintrag mit `marketplaceName: "openai-curated"` und
  `pluginName` für jedes ausgewählte Plugin

Die Migration schreibt niemals `plugins["*"]` und speichert niemals lokale Marketplace-Cache-
Pfade. Installationen mit Authentifizierungspflicht werden beim betroffenen Plugin-Element mit
`status: "skipped"`, `reason: "auth_required"` und bereinigten App-Bezeichnern gemeldet.
Ihre expliziten Konfigurationseinträge werden deaktiviert geschrieben, bis Sie sie erneut autorisieren und
aktivieren. Andere Installationsfehler sind elementbezogene `error`-Ergebnisse.

Wenn das Codex-App-Server-Plugin-Inventar während der Planung nicht verfügbar ist, greift die Migration
auf Beratungs-Elemente aus zwischengespeicherten Bundles zurück, statt die gesamte
Migration fehlschlagen zu lassen.

## Hermes-Provider

Der mitgelieferte Hermes-Provider erkennt Zustand standardmäßig unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn Hermes an einem anderen Ort liegt.

### Was Hermes importiert

- Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agent-Workspace.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an Workspace-Speicherdateien.
- Speicher-Konfigurationsstandards für OpenClaw-Dateispeicher, plus Archiv- oder manuell zu prüfende Elemente für externe Speicher-Provider wie Honcho.
- Skills, die eine `SKILL.md`-Datei unter `skills/<name>/` enthalten.
- Konfigurationswerte pro Skill aus `skills.config`.
- Unterstützte API-Schlüssel aus `.env`, nur mit `--include-secrets`.

### Unterstützte `.env`-Schlüssel

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Nur-Archiv-Zustand

Hermes-Zustand, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder Anmeldedaten geladen. Dadurch wird undurchsichtiger oder unsicherer Zustand bewahrt, ohne vorzugeben, OpenClaw könne ihn automatisch ausführen oder ihm vertrauen:

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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Core besitzt CLI-Orchestrierung, Backup-Policy, Prompts, JSON-Ausgabe und Konflikt-Preflight. Core übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan nur dann aus Kompatibilitätsgründen neu erstellen, wenn dieses Argument fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` für Elementerstellung und Zusammenfassungszählungen sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, Nur-Archiv-Berichtskopien, zwischengespeicherte Config-Runtime-Wrapper und Migrationsberichte verwenden.

## Onboarding-Integration

Onboarding kann Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen vor dem Anwenden weiterhin eine Vorschau an.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Workspace zurück, wenn Sie bereits lokalen Zustand haben. Backup-plus-Überschreiben- oder Zusammenführungsimporte sind für bestehende Einrichtungen feature-gated.
</Note>

## Verwandt

- [Migration von Hermes](/de/install/migrating-hermes): benutzerorientierte Anleitung.
- [Migration von Claude](/de/install/migrating-claude): benutzerorientierte Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Rechner verschieben.
- [Doctor](/de/gateway/doctor): Zustandsprüfung nach Anwendung einer Migration.
- [Plugin](/de/tools/plugin): Plugin-Installation und Registrierung.
