---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Status aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-06-27T17:19:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie State aus einem anderen Agent-System über einen Plugin-eigenen Migrations-Provider. Gebündelte Provider decken Codex CLI-State, [Claude](/de/install/migrating-claude) und [Hermes](/de/install/migrating-hermes) ab; Drittanbieter-Plugins können zusätzliche Provider registrieren.

<Tip>
Für nutzerorientierte Schritt-für-Schritt-Anleitungen siehe [Migration von Claude](/de/install/migrating-claude) und [Migration von Hermes](/de/install/migrating-hermes). Der [Migrations-Hub](/de/install/migrating) listet alle Pfade auf.
</Tip>

## Befehle

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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
  Erstellt den Plan und beendet den Vorgang, ohne State zu ändern.
</ParamField>
<ParamField path="--from <path>" type="string">
  Überschreibt das Quell-State-Verzeichnis. Hermes verwendet standardmäßig `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importiert unterstützte Anmeldedaten ohne Nachfrage. Interaktives Anwenden fragt vor dem Import erkannter Auth-Anmeldedaten nach, wobei Ja standardmäßig ausgewählt ist; nicht interaktives `--yes` erfordert `--include-secrets`, um sie zu importieren.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Überspringt den Import von Auth-Anmeldedaten einschließlich der interaktiven Nachfrage.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Erlaubt Anwenden, vorhandene Ziele zu ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Überspringt die Bestätigungsabfrage. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wählt ein Skill-Kopierelement nach Skill-Name oder Element-ID aus. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine Checkbox-Auswahl, und nicht interaktive Migrationen behalten alle geplanten Skills bei.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wählt ein Codex-Plugin-Installationselement nach Plugin-Name oder Element-ID aus. Wiederholen Sie das Flag, um mehrere Codex-Plugins zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine native Codex-Plugin-Checkbox-Auswahl, und nicht interaktive Migrationen behalten alle geplanten Plugins bei. Dies gilt nur für quellinstallierte `openai-curated` Codex-Plugins, die vom Codex-App-Server-Inventar erkannt wurden.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Nur Codex. Erzwingt vor der Planung der nativen Plugin-Aktivierung eine frische `app/list`-Traversal des Codex-Quell-App-Servers. Standardmäßig deaktiviert, damit die Migrationsplanung schnell bleibt.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Überspringt das Backup vor dem Anwenden. Erfordert `--force`, wenn lokaler OpenClaw-State vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Neben `--no-backup` erforderlich, wenn Anwenden andernfalls das Überspringen des Backups verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Gibt den Plan oder das Anwendeergebnis als JSON aus. Mit `--json` und ohne `--yes` gibt Anwenden den Plan aus und verändert keinen State.
</ParamField>

## Sicherheitsmodell

`openclaw migrate` arbeitet nach dem Prinzip Vorschau zuerst.

<AccordionGroup>
  <Accordion title="Vorschau vor dem Anwenden">
    Der Provider gibt einen aufgeschlüsselten Plan zurück, bevor sich etwas ändert, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Anwendeausgaben und Migrationsberichte schwärzen verschachtelte Schlüssel, die wie Geheimnisse aussehen, etwa API-Schlüssel, Tokens, Autorisierungs-Header, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt den Plan in der Vorschau an und fragt vor State-Änderungen nach, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert Anwenden `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Anwenden erstellt und verifiziert ein OpenClaw-Backup, bevor die Migration angewendet wird. Wenn noch kein lokaler OpenClaw-State existiert, wird der Backup-Schritt übersprungen und die Migration kann fortgesetzt werden. Um ein Backup bei vorhandenem State zu überspringen, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    Anwenden verweigert das Fortfahren, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Befehl dann erneut mit `--overwrite` aus, wenn das Ersetzen vorhandener Ziele beabsichtigt ist. Provider können weiterhin Backups auf Elementebene für überschriebene Dateien im Migrationsberichtsverzeichnis schreiben.
  </Accordion>
  <Accordion title="Geheimnisse">
    Interaktives Anwenden fragt, ob erkannte Auth-Anmeldedaten importiert werden sollen, wobei Ja standardmäßig ausgewählt ist. Verwenden Sie `--no-auth-credentials`, um sie zu überspringen, oder `--include-secrets` für den unbeaufsichtigten Import von Anmeldedaten mit `--yes`.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der gebündelte Claude-Provider erkennt Claude Code-State standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude Code-Home oder Projekt-Root zu importieren.

<Tip>
Für eine nutzerorientierte Schritt-für-Schritt-Anleitung siehe [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projekt-`CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agent-Arbeitsbereich.
- Benutzer-`~/.claude/CLAUDE.md`, angehängt an die Arbeitsbereichsdatei `USER.md`.
- MCP-Serverdefinitionen aus Projekt-`.mcp.json`, Claude Code-`~/.claude.json` und Claude Desktop-`claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten.
- Claude-Befehls-Markdown-Dateien, konvertiert in OpenClaw-Skills nur mit manueller Ausführung.

### Archiv- und manuell zu prüfender State

Claude-Hooks, Berechtigungen, Umgebungsstandards, lokaler Memory, pfadbezogene Regeln, Subagents, Caches, Pläne und Projekthistorie werden im Migrationsbericht beibehalten oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine breiten Allowlists und importiert OAuth-/Desktop-Anmeldedaten-State nicht automatisch.

## Codex-Provider

Der gebündelte Codex-Provider erkennt Codex CLI-State standardmäßig unter `~/.codex` oder
unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um
ein bestimmtes Codex-Home zu inventarisieren.

Verwenden Sie diesen Provider, wenn Sie zum OpenClaw Codex-Harness wechseln und nützliche
persönliche Codex CLI-Assets gezielt übernehmen möchten. Lokale Codex-App-Server-Starts
verwenden ein agentenspezifisches `CODEX_HOME`, lesen daher standardmäßig nicht Ihr persönliches
`~/.codex`. Das normale Prozess-`HOME` wird weiterhin vererbt, sodass Codex
gemeinsame `$HOME/.agents/*`-Skills/Plugin-Marktplatzeinträge sehen kann und
Subprozesse Benutzer-Home-Konfiguration und Tokens finden können.

Das Ausführen von `openclaw migrate codex` in einem interaktiven Terminal zeigt zuerst den vollständigen
Plan in der Vorschau an und öffnet dann Checkbox-Auswahlen vor der abschließenden Anwende-Bestätigung. Skill-
Kopierelemente werden zuerst abgefragt. Verwenden Sie `Toggle all on` oder `Toggle all off` für Massen-
auswahl. Drücken Sie die Leertaste, um Zeilen umzuschalten, oder Enter, um die hervorgehobene
Zeile zu aktivieren und fortzufahren. Geplante Skills sind anfangs aktiviert, konfliktbehaftete Skills anfangs deaktiviert, und
`Skip for now` überspringt Skill-Kopien für diesen Lauf, fährt aber dennoch mit der Plugin-
Auswahl fort. Wenn quellinstallierte kuratierte Codex-Plugins migrierbar sind und
`--plugin` nicht angegeben wurde, fragt die Migration anschließend nach der nativen Codex-Plugin-
Aktivierung nach Plugin-Name. Plugin-Elemente
sind anfangs aktiviert, sofern die Zielkonfiguration des OpenClaw Codex-Plugins dieses
Plugin noch nicht enthält. Vorhandene Ziel-Plugins sind anfangs deaktiviert und zeigen einen Konflikthinweis wie
`conflict: plugin exists`; wählen Sie `Toggle all off`, um in diesem Lauf keine nativen Codex-
Plugins zu migrieren, oder `Skip for now`, um vor dem Anwenden zu stoppen. Für geskriptete oder
exakte Läufe übergeben Sie `--skill <name>` einmal pro Skill, zum Beispiel:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Verwenden Sie `--plugin <name>`, um die native Codex-Plugin-Migration nicht interaktiv
auf ein oder mehrere quellinstallierte kuratierte Plugins zu begrenzen:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Was Codex importiert

- Codex CLI-Skill-Verzeichnisse unter `$CODEX_HOME/skills`, mit Ausnahme des
  `.system`-Caches von Codex.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, kopiert in den aktuellen
  OpenClaw-Agent-Arbeitsbereich, wenn Sie agentenspezifische Ownership wünschen.
- Quellinstallierte `openai-curated` Codex-Plugins, die über Codex-
  App-Server-`plugin/list` erkannt wurden. Die Planung liest `plugin/read` für jedes aktivierte
  installierte Plugin. App-gestützte Plugins erfordern, dass die Kontoantwort des Codex-Quell-App-Servers
  ein ChatGPT-Abonnementkonto ist; nicht-ChatGPT- oder fehlende
  Kontoantworten werden mit `codex_subscription_required` übersprungen. Standardmäßig
  ruft die Migration kein Quell-`app/list` auf, sodass app-gestützte Plugins, die das
  Konto-Gate bestehen, ohne Verifizierung der Barrierefreiheit der Quell-App geplant werden, und
  Transportfehler bei der Kontoabfrage mit `codex_account_unavailable` übersprungen werden. Übergeben Sie
  `--verify-plugin-apps`, wenn die Migration einen frischen Quell-
  `app/list`-Snapshot erzwingen und erfordern soll, dass jede eigene App vorhanden, aktiviert und
  zugänglich ist, bevor die native Aktivierung geplant wird. In diesem Modus fallen
  Transportfehler bei der Kontoabfrage auf die Verifizierung des Quell-App-Inventars zurück. Der
  Quell-App-Inventar-Snapshot wird für den aktuellen Prozess im Speicher gehalten; er
  wird nicht in die Migrationsausgabe oder Zielkonfiguration geschrieben. Deaktivierte Plugins,
  nicht lesbare Plugin-Details, durch Abonnement beschränkte Quellkonten sowie, wenn
  Verifizierung angefordert wurde, fehlende Apps, deaktivierte Apps, unzugängliche Apps oder
  Fehler im Quell-App-Inventar werden zu manuell übersprungenen Elementen mit typisierten Gründen
  statt zu Zielkonfigurationseinträgen.
  Anwenden ruft App-Server-`plugin/install` für jedes ausgewählte berechtigte Plugin auf,
  selbst wenn der Ziel-App-Server dieses Plugin bereits als installiert und
  aktiviert meldet. Migrierte Codex-Plugins sind nur in Sitzungen nutzbar, die das
  native Codex-Harness auswählen; sie werden nicht für OpenClaw-Provider-Läufe,
  ACP-Konversationsbindungen oder andere Harnesses bereitgestellt.

### Manuell zu prüfender Codex-State

Codex-`config.toml`, native `hooks/hooks.json`, nicht kuratierte Marktplätze, gecachte
Plugin-Bundles, die keine quellinstallierten kuratierten Plugins sind, und quellinstallierte
Plugins, die das Quellabonnement-Gate nicht bestehen, werden nicht automatisch aktiviert.
Wenn `--verify-plugin-apps` gesetzt ist, werden Plugins, die das Quell-App-Inventar-
Gate nicht bestehen, ebenfalls übersprungen. Sie werden in den Migrationsbericht kopiert oder dort
zur manuellen Prüfung gemeldet.

Für migrierte quellinstallierte kuratierte Plugins schreibt Anwenden:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- einen expliziten Plugin-Eintrag mit `marketplaceName: "openai-curated"` und
  `pluginName` für jedes ausgewählte Plugin

Migration schreibt niemals `plugins["*"]` und speichert niemals lokale Marketplace-Cache-Pfade. Fehler bei Source-seitigen Subscriptions werden bei manuellen Elementen mit typisierten Gründen gemeldet, etwa `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` oder `plugin_read_unavailable`. Mit `--verify-plugin-apps` können Source-App-Inventarfehler auch als `app_inaccessible`, `app_disabled`, `app_missing` oder `app_inventory_unavailable` erscheinen. Übersprungene Plugins werden nicht in die Zielkonfiguration geschrieben.
Auth-required-Installationen auf Zielseite werden beim betroffenen Plugin-Element mit `status: "skipped"`, `reason: "auth_required"` und bereinigten App-IDs gemeldet. Ihre expliziten Konfigurationseinträge werden deaktiviert geschrieben, bis Sie sie erneut autorisieren und aktivieren. Andere Installationsfehler sind elementbezogene `error`-Ergebnisse.

Wenn das Codex-App-Server-Plugin-Inventar während der Planung nicht verfügbar ist, greift die Migration auf zwischengespeicherte Bundle-Hinweiselemente zurück, statt die gesamte Migration fehlschlagen zu lassen.

## Hermes-Provider

Der gebündelte Hermes-Provider erkennt den Zustand standardmäßig unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn Hermes anderswo liegt.

### Was Hermes importiert

- Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agent-Arbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an Arbeitsbereich-Speicherdateien.
- Standards der Speicherkonfiguration für OpenClaw-Dateispeicher sowie Archiv- oder manuelle Review-Elemente für externe Speicher-Provider wie Honcho.
- Skills, die eine `SKILL.md`-Datei unter `skills/<name>/` enthalten.
- Skill-spezifische Konfigurationswerte aus `skills.config`.
- OpenCode-OpenAI-OAuth-Anmeldedaten aus OpenCode `auth.json`, wenn die interaktive Migration von Anmeldedaten akzeptiert wird oder wenn `--include-secrets` gesetzt ist. Hermes-`auth.json`-OAuth-Einträge sind Legacy-Zustand, der für manuelle OpenAI-Neuautorisierung oder Doctor-Reparatur gemeldet wird.
- Unterstützte API-Schlüssel und Tokens aus Hermes `.env` und OpenCode `auth.json`, wenn die interaktive Migration von Anmeldedaten akzeptiert wird oder wenn `--include-secrets` gesetzt ist.

### Unterstützte `.env`-Schlüssel

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Nur-Archiv-Zustand

Hermes-Zustand, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder in Anmeldedaten geladen. Dadurch bleibt undurchsichtiger oder unsicherer Zustand erhalten, ohne vorzugeben, dass OpenClaw ihn automatisch ausführen oder ihm vertrauen kann:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Core besitzt CLI-Orchestrierung, Backup-Richtlinie, Prompts, JSON-Ausgabe und Konflikt-Preflight. Core übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan nur dann neu erstellen, wenn dieses Argument aus Kompatibilitätsgründen fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` für Elementerstellung und Zusammenfassungszähler sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, reine Archivberichtskopien, zwischengespeicherte Config-Runtime-Wrapper und Migrationsberichte verwenden.

## Onboarding-Integration

Onboarding kann Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrationsprovider und zeigen vor dem Anwenden weiterhin eine Vorschau an.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, wenn Sie bereits lokalen Zustand haben. Backup-plus-Overwrite- oder Zusammenführungsimporte sind für bestehende Setups Feature-gated.
</Note>

## Verwandt

- [Migration von Hermes](/de/install/migrating-hermes): benutzerorientierte Anleitung.
- [Migration von Claude](/de/install/migrating-claude): benutzerorientierte Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Rechner verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach dem Anwenden einer Migration.
- [Plugins](/de/tools/plugin): Plugin-Installation und Registrierung.
