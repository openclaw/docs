---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Zustand aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-05-12T23:30:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie Zustand aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Gebündelte Provider decken den Codex-CLI-Zustand, [Claude](/de/install/migrating-claude) und [Hermes](/de/install/migrating-hermes) ab; Drittanbieter-Plugins können zusätzliche Provider registrieren.

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
  Den Plan erstellen und beenden, ohne den Zustand zu ändern.
</ParamField>
<ParamField path="--from <path>" type="string">
  Das Quell-Zustandsverzeichnis überschreiben. Hermes verwendet standardmäßig `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Unterstützte Zugangsdaten importieren. Standardmäßig deaktiviert.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Anwenden darf vorhandene Ziele ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Die Bestätigungsabfrage überspringen. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Ein Skills-Kopierelement nach Skill-Name oder Element-ID auswählen. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine Kontrollkästchenauswahl an, und nicht interaktive Migrationen behalten alle geplanten Skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Ein Codex-Plugin-Installationselement nach Plugin-Name oder Element-ID auswählen. Wiederholen Sie das Flag, um mehrere Codex-Plugins zu migrieren. Wenn es weggelassen wird, zeigen interaktive Codex-Migrationen eine native Codex-Plugin-Kontrollkästchenauswahl an, und nicht interaktive Migrationen behalten alle geplanten Plugins. Dies gilt nur für quellinstallierte `openai-curated`-Codex-Plugins, die vom Codex-App-Server-Inventar erkannt wurden.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Nur Codex. Vor der Planung der nativen Plugin-Aktivierung eine frische `app/list`-Durchquerung des Quell-Codex-App-Servers erzwingen. Standardmäßig deaktiviert, damit die Migrationsplanung schnell bleibt.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Das Backup vor dem Anwenden überspringen. Erfordert `--force`, wenn lokaler OpenClaw-Zustand vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Zusammen mit `--no-backup` erforderlich, wenn das Anwenden das Überspringen des Backups sonst verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Den Plan oder das Anwendeergebnis als JSON ausgeben. Mit `--json` und ohne `--yes` gibt das Anwenden den Plan aus und verändert keinen Zustand.
</ParamField>

## Sicherheitsmodell

`openclaw migrate` arbeitet zuerst mit einer Vorschau.

<AccordionGroup>
  <Accordion title="Preview before apply">
    Der Provider gibt einen nach Elementen aufgeschlüsselten Plan zurück, bevor sich irgendetwas ändert, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Anwendeausgaben und Migrationsberichte redigieren verschachtelte, geheimnisähnliche Schlüssel wie API-Schlüssel, Tokens, Autorisierungs-Header, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt den Plan in der Vorschau an und fragt vor Zustandsänderungen nach, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert das Anwenden `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Anwenden erstellt und überprüft ein OpenClaw-Backup, bevor die Migration angewendet wird. Wenn noch kein lokaler OpenClaw-Zustand vorhanden ist, wird der Backup-Schritt übersprungen und die Migration kann fortgesetzt werden. Um ein Backup bei vorhandenem Zustand zu überspringen, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Conflicts">
    Anwenden verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Befehl dann mit `--overwrite` erneut aus, wenn das Ersetzen vorhandener Ziele beabsichtigt ist. Provider können weiterhin Backups auf Elementebene für überschriebene Dateien im Migrationsberichtsverzeichnis schreiben.
  </Accordion>
  <Accordion title="Secrets">
    Secrets werden standardmäßig nie importiert. Verwenden Sie `--include-secrets`, um unterstützte Zugangsdaten zu importieren.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der gebündelte Claude-Provider erkennt standardmäßig den Claude-Code-Zustand unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude-Code-Home oder ein bestimmtes Projekt-Root zu importieren.

<Tip>
Eine benutzerorientierte Schritt-für-Schritt-Anleitung finden Sie unter [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projekt-`CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agentenarbeitsbereich.
- Benutzer-`~/.claude/CLAUDE.md`, angehängt an die Arbeitsbereichsdatei `USER.md`.
- MCP-Serverdefinitionen aus Projekt-`.mcp.json`, Claude Code `~/.claude.json` und Claude Desktop `claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten.
- Claude-Befehls-Markdown-Dateien, die in OpenClaw-Skills mit ausschließlich manueller Auslösung konvertiert werden.

### Archiv- und Manuelle-Prüfung-Zustand

Claude-Hooks, Berechtigungen, Umgebungsstandards, lokaler Speicher, pfadbezogene Regeln, Subagenten, Caches, Pläne und Projektverlauf werden im Migrationsbericht beibehalten oder als Elemente zur manuellen Prüfung gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine breiten Allowlists und importiert OAuth-/Desktop-Zugangsdatenzustand nicht automatisch.

## Codex-Provider

Der gebündelte Codex-Provider erkennt standardmäßig Codex-CLI-Zustand unter `~/.codex` oder
unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um
ein bestimmtes Codex-Home zu inventarisieren.

Verwenden Sie diesen Provider, wenn Sie zum OpenClaw-Codex-Harness wechseln und nützliche persönliche Codex-CLI-Assets bewusst übernehmen möchten. Lokale Codex-App-Server-Starts verwenden agentenspezifische `CODEX_HOME`- und `HOME`-Verzeichnisse und lesen daher standardmäßig nicht Ihren persönlichen Codex-CLI-Zustand.

Das Ausführen von `openclaw migrate codex` in einem interaktiven Terminal zeigt den vollständigen
Plan in der Vorschau an und öffnet dann Kontrollkästchenauswahlen vor der abschließenden Bestätigung zum Anwenden. Skill-
Kopierelemente werden zuerst abgefragt. Verwenden Sie `Toggle all on` oder `Toggle all off` für eine Massen-
auswahl. Drücken Sie die Leertaste, um Zeilen umzuschalten, oder drücken Sie die Eingabetaste, um die hervorgehobene
Zeile zu aktivieren und fortzufahren. Geplante Skills starten ausgewählt, Konflikt-Skills starten nicht ausgewählt, und
`Skip for now` überspringt Skill-Kopien für diesen Lauf, während dennoch mit der Plugin-
Auswahl fortgefahren wird. Wenn quellinstallierte kuratierte Codex-Plugins migrierbar sind und
`--plugin` nicht angegeben wurde, fragt die Migration anschließend die native Codex-Plugin-
Aktivierung nach Plugin-Name ab. Plugin-Elemente
starten ausgewählt, sofern die Ziel-OpenClaw-Codex-Plugin-Konfiguration dieses
Plugin nicht bereits enthält. Vorhandene Ziel-Plugins starten nicht ausgewählt und zeigen einen Konflikthinweis wie
`conflict: plugin exists`; wählen Sie `Toggle all off`, um in diesem Lauf keine nativen Codex-
Plugins zu migrieren, oder `Skip for now`, um vor dem Anwenden zu stoppen. Für skriptgesteuerte oder
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

- Codex-CLI-Skill-Verzeichnisse unter `$CODEX_HOME/skills`, ausgenommen Codexs
  `.system`-Cache.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, die in den aktuellen
  OpenClaw-Agentenarbeitsbereich kopiert werden, wenn Sie agentenspezifische Eigentümerschaft wünschen.
- Quellinstallierte `openai-curated`-Codex-Plugins, die über Codex
  App-Server `plugin/list` erkannt wurden. Die Planung liest `plugin/read` für jedes aktivierte
  installierte Plugin. App-gestützte Plugins erfordern, dass die Kontoantwort des Quell-Codex-App-Servers
  ein ChatGPT-Abonnementkonto ist; Nicht-ChatGPT- oder fehlende
  Kontoantworten werden mit `codex_subscription_required` übersprungen. Standardmäßig
  ruft die Migration kein Quell-`app/list` auf, sodass app-gestützte Plugins, die die
  Konto-Gate-Prüfung bestehen, ohne Überprüfung der Quell-App-Zugänglichkeit geplant werden, und
  Transportfehler bei der Kontoabfrage mit `codex_account_unavailable` übersprungen werden. Übergeben Sie
  `--verify-plugin-apps`, wenn die Migration eine frische Quell-
  `app/list`-Momentaufnahme erzwingen und verlangen soll, dass jede eigene App vorhanden, aktiviert und
  zugänglich ist, bevor die native Aktivierung geplant wird. In diesem Modus fallen Transportfehler bei der
  Kontoabfrage auf die Überprüfung des Quell-App-Inventars zurück. Die
  Quell-App-Inventar-Momentaufnahme wird für den aktuellen Prozess im Arbeitsspeicher gehalten; sie
  wird nicht in die Migrationsausgabe oder Zielkonfiguration geschrieben. Deaktivierte Plugins,
  nicht lesbare Plugin-Details, abonnementbeschränkte Quellkonten und, wenn
  Verifizierung angefordert wird, fehlende Apps, deaktivierte Apps, unzugängliche Apps oder
  Quell-App-Inventarfehler werden zu manuell übersprungenen Elementen mit typisierten Gründen
  anstelle von Zielkonfigurationseinträgen.
  Anwenden ruft App-Server `plugin/install` für jedes ausgewählte berechtigte Plugin auf,
  selbst wenn der Ziel-App-Server dieses Plugin bereits als installiert und
  aktiviert meldet. Migrierte Codex-Plugins sind nur in Sitzungen verwendbar, die den
  nativen Codex-Harness auswählen; sie werden Pi, normalen OpenAI-Provider-Läufen,
  ACP-Konversationsbindungen oder anderen Harnesses nicht bereitgestellt.

### Codex-Zustand zur manuellen Prüfung

Codex `config.toml`, native `hooks/hooks.json`, nicht kuratierte Marketplaces, zwischengespeicherte
Plugin-Bundles, die keine quellinstallierten kuratierten Plugins sind, und quellinstallierte
Plugins, die das Quell-Abonnement-Gate nicht bestehen, werden nicht automatisch aktiviert.
Wenn `--verify-plugin-apps` gesetzt ist, werden Plugins, die das Quell-App-Inventar-
Gate nicht bestehen, ebenfalls übersprungen. Sie werden kopiert oder im Migrationsbericht zur
manuellen Prüfung gemeldet.

Für migrierte quellinstallierte kuratierte Plugins schreibt Anwenden:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- einen expliziten Plugin-Eintrag mit `marketplaceName: "openai-curated"` und
  `pluginName` für jedes ausgewählte Plugin

Migration schreibt niemals `plugins["*"]` und speichert niemals lokale Marketplace-Cache-
Pfade. Quellseitige Abonnementfehler werden bei manuellen Elementen mit typisierten
Gründen wie `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` oder `plugin_read_unavailable` gemeldet. Mit `--verify-plugin-apps`
können Quell-App-Inventarfehler auch als `app_inaccessible`,
`app_disabled`, `app_missing` oder `app_inventory_unavailable` erscheinen. Übersprungene Plugins
werden nicht in die Zielkonfiguration geschrieben.
Zielseitige Installationen mit erforderlicher Authentifizierung werden beim betroffenen Plugin-Element mit
`status: "skipped"`, `reason: "auth_required"` und bereinigten App-Kennungen gemeldet.
Ihre expliziten Konfigurationseinträge werden deaktiviert geschrieben, bis Sie erneut autorisieren und
sie aktivieren. Andere Installationsfehler sind elementbezogene `error`-Ergebnisse.

Wenn das Codex-App-Server-Plugin-Inventar während der Planung nicht verfügbar ist, fällt die Migration
auf beratende Elemente aus zwischengespeicherten Bundles zurück, anstatt die gesamte
Migration fehlschlagen zu lassen.

## Hermes-Provider

Der gebündelte Hermes-Provider erkennt standardmäßig Zustand unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn Hermes an einem anderen Ort liegt.

### Was Hermes importiert

- Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agent-Arbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an Arbeitsbereich-Speicherdateien.
- Standards für die Speicherkonfiguration für OpenClaw-Dateispeicher sowie Archiv- oder manuell zu prüfende Elemente für externe Speicher-Provider wie Honcho.
- Skills, die eine `SKILL.md`-Datei unter `skills/<name>/` enthalten.
- Konfigurationswerte pro Skill aus `skills.config`.
- Unterstützte API-Schlüssel aus `.env`, nur mit `--include-secrets`.

### Unterstützte `.env`-Schlüssel

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Nur archivierter Zustand

Hermes-Zustand, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder in Anmeldedaten geladen. Dadurch bleibt undurchsichtiger oder unsicherer Zustand erhalten, ohne vorzugeben, OpenClaw könne ihn automatisch ausführen oder ihm vertrauen:

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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Core besitzt CLI-Orchestrierung, Backup-Richtlinie, Eingabeaufforderungen, JSON-Ausgabe und Konflikt-Preflight. Core übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan aus Kompatibilitätsgründen nur dann neu erstellen, wenn dieses Argument fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` für die Erstellung von Elementen und Zusammenfassungszählungen verwenden sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, nur archivierte Berichtskopien, gecachte Config-Runtime-Wrapper und Migrationsberichte.

## Onboarding-Integration

Onboarding kann eine Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen vor dem Anwenden weiterhin eine Vorschau an.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, wenn bereits lokaler Zustand vorhanden ist. Backup-plus-Überschreiben- oder Zusammenführen-Importe sind für bestehende Setups durch Feature Gates geschützt.
</Note>

## Verwandte Themen

- [Migration von Hermes](/de/install/migrating-hermes): benutzerorientierte Schritt-für-Schritt-Anleitung.
- [Migration von Claude](/de/install/migrating-claude): benutzerorientierte Schritt-für-Schritt-Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Rechner verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach dem Anwenden einer Migration.
- [Plugins](/de/tools/plugin): Plugin-Installation und -Registrierung.
