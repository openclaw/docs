---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Status aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-07-12T15:09:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie den Zustand aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Die gebündelten Provider unterstützen Claude, Codex CLI und [Hermes](/de/install/migrating-hermes); Plugins können zusätzliche Provider registrieren.

<Tip>
Benutzerorientierte Anleitungen finden Sie unter [Migration von Claude](/de/install/migrating-claude) und [Migration von Hermes](/de/install/migrating-hermes). Der [Migrations-Hub](/de/install/migrating) führt alle Pfade auf.
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

Wenn Sie `openclaw migrate <provider>` ohne weitere Flags ausführen, wird die Migration geplant und als Vorschau angezeigt; vor der Anwendung erfolgt (in einer TTY) eine Rückfrage. `openclaw migrate plan <provider>` und `openclaw migrate apply <provider>` teilen Vorschau und Anwendung in separate Unterbefehle mit denselben Flags auf.

<ParamField path="<provider>" type="string">
  Name eines registrierten Migrations-Providers, beispielsweise `hermes`. Führen Sie `openclaw migrate list` aus, um die installierten Provider anzuzeigen.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Erstellt den Plan und beendet den Vorgang, ohne den Zustand zu ändern.
</ParamField>
<ParamField path="--from <path>" type="string">
  Überschreibt das Quellverzeichnis für den Zustand. Hermes verwendet standardmäßig `~/.hermes`, Codex `~/.codex` (oder `$CODEX_HOME`) und Claude `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importiert unterstützte Anmeldedaten ohne Rückfrage. Bei der interaktiven Anwendung wird vor dem Import erkannter Authentifizierungsdaten nachgefragt, wobei „Ja“ standardmäßig ausgewählt ist; im nicht interaktiven Modus erfordert `--yes` zusätzlich `--include-secrets`, um sie zu importieren.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Überspringt den Import von Authentifizierungsdaten einschließlich der interaktiven Rückfrage.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Erlaubt der Anwendung, vorhandene Ziele zu ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Überspringt die Bestätigungsabfrage. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wählt anhand des Skill-Namens oder der Element-ID ein zu kopierendes Skill-Element aus. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Ohne dieses Flag zeigen interaktive Codex-Migrationen eine Auswahl mit Kontrollkästchen an, während nicht interaktive Migrationen alle geplanten Skills beibehalten.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wählt anhand des Plugin-Namens oder der Element-ID ein zu installierendes Codex-Plugin-Element aus. Wiederholen Sie das Flag, um mehrere Codex-Plugins zu migrieren. Ohne dieses Flag zeigen interaktive Codex-Migrationen eine native Codex-Plugin-Auswahl mit Kontrollkästchen an, während nicht interaktive Migrationen alle geplanten Plugins beibehalten. Gilt nur für quellinstallierte `openai-curated`-Codex-Plugins, die durch das Inventar des Codex-App-Servers erkannt wurden.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Nur Codex. Erzwingt vor der Planung der nativen Plugin-Aktivierung einen neuen `app/list`-Durchlauf des Quell-Codex-App-Servers. Standardmäßig deaktiviert, damit die Migrationsplanung schnell bleibt.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Pfad oder Verzeichnis für das Sicherungsarchiv vor der Migration. Wird an `openclaw backup create` weitergegeben.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Überspringt die Sicherung vor der Anwendung. Erfordert `--force`, wenn ein lokaler OpenClaw-Zustand vorhanden ist.
</ParamField>
<ParamField path="--force" type="boolean">
  Zusammen mit `--no-backup` erforderlich, wenn die Anwendung andernfalls das Überspringen der Sicherung verweigern würde.
</ParamField>
<ParamField path="--json" type="boolean">
  Gibt den Plan oder das Anwendungsergebnis als JSON aus. Mit `--json` und ohne `--yes` gibt die Anwendung den Plan aus und verändert den Zustand nicht.
</ParamField>

## Sicherheitsmodell

Bei `openclaw migrate` steht die Vorschau an erster Stelle.

<AccordionGroup>
  <Accordion title="Vorschau vor der Anwendung">
    Der Provider gibt einen nach Elementen aufgeschlüsselten Plan zurück, bevor Änderungen vorgenommen werden, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Anwendungsausgaben und Migrationsberichte schwärzen verschachtelte Schlüssel, die auf Geheimnisse hindeuten, beispielsweise API-Schlüssel, Token, Autorisierungsheader, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt eine Vorschau des Plans an und fragt vor der Änderung des Zustands nach, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert die Anwendung `--yes`.

  </Accordion>
  <Accordion title="Sicherungen">
    Vor der Anwendung der Migration erstellt und überprüft der Anwendungsvorgang eine OpenClaw-Sicherung. Wenn noch kein lokaler OpenClaw-Zustand vorhanden ist, wird der Sicherungsschritt übersprungen und die Migration fortgesetzt. Um eine Sicherung zu überspringen, wenn ein Zustand vorhanden ist, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    Die Anwendung verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Befehl anschließend erneut mit `--overwrite` aus, falls vorhandene Ziele absichtlich ersetzt werden sollen. Provider können im Verzeichnis des Migrationsberichts dennoch Sicherungen auf Elementebene für überschriebene Dateien erstellen.
  </Accordion>
  <Accordion title="Geheimnisse">
    Bei der interaktiven Anwendung wird gefragt, ob erkannte Authentifizierungsdaten importiert werden sollen, wobei „Ja“ standardmäßig ausgewählt ist. Verwenden Sie `--no-auth-credentials`, um sie zu überspringen, oder `--include-secrets`, um Anmeldedaten unbeaufsichtigt zusammen mit `--yes` zu importieren.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der gebündelte Claude-Provider erkennt den Claude-Code-Zustand standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Claude-Code-Basisverzeichnis oder Projektstammverzeichnis zu importieren.

<Tip>
Eine benutzerorientierte Anleitung finden Sie unter [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Was Claude importiert

- Projektdateien `CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agenten-Arbeitsbereich (`AGENTS.md`).
- Der Inhalt der Benutzerdatei `~/.claude/CLAUDE.md` wird an `USER.md` im Arbeitsbereich angehängt.
- MCP-Serverdefinitionen aus der Projektdatei `.mcp.json`, der Claude-Code-Datei `~/.claude.json` (einschließlich ihrer projektspezifischen Einträge) und der Claude-Desktop-Datei `claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die eine `SKILL.md` enthalten (Benutzerverzeichnis `~/.claude/skills` und Projektverzeichnis `.claude/skills`).
- Claude-Befehlsdateien im Markdown-Format (Benutzerverzeichnis `~/.claude/commands` und Projektverzeichnis `.claude/commands`), die in OpenClaw-Skills konvertiert werden, die nur manuell aufgerufen werden können.

### Archiv- und manuell zu prüfender Zustand

Claude-Hooks, Berechtigungen, Umgebungsvorgaben, die Projektdatei `CLAUDE.local.md`, `.claude/rules`, benutzer- und projektspezifische `agents/`-Verzeichnisse sowie der Projektverlauf (`projects`, `cache`, `plans` unter `~/.claude`) werden im Migrationsbericht aufbewahrt oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine weitreichenden Positivlisten und importiert den OAuth-/Desktop-Anmeldedatenzustand nicht automatisch.

## Codex-Provider

Der gebündelte Codex-Provider erkennt den Codex-CLI-Zustand standardmäßig unter `~/.codex` oder unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um ein bestimmtes Codex-Basisverzeichnis zu inventarisieren.

Verwenden Sie diesen Provider, wenn Sie zum OpenClaw-Codex-Harness wechseln und nützliche persönliche Codex-CLI-Ressourcen gezielt übernehmen möchten. Lokale Starts des Codex-App-Servers verwenden ein agentenspezifisches `CODEX_HOME` und lesen daher standardmäßig nicht Ihr persönliches `~/.codex`. Das normale Prozessverzeichnis `HOME` wird weiterhin vererbt, sodass Codex auf gemeinsam genutzte Skills und Plugin-Marktplatzeinträge unter `$HOME/.agents/*` zugreifen kann und Unterprozesse Konfigurationen und Token im Basisverzeichnis des Benutzers finden können.

Wenn Sie `openclaw migrate codex` in einem interaktiven Terminal ausführen, wird zunächst der vollständige Plan als Vorschau angezeigt. Anschließend werden vor der abschließenden Anwendungsbestätigung Auswahllisten mit Kontrollkästchen geöffnet. Zu kopierende Skill-Elemente werden zuerst abgefragt. Verwenden Sie `Toggle all on` oder `Toggle all off` für die Massenauswahl. Drücken Sie die Leertaste, um Zeilen umzuschalten, oder die Eingabetaste, um die hervorgehobene Zeile zu aktivieren und fortzufahren. Geplante Skills sind anfangs aktiviert, Skills mit Konflikten sind anfangs deaktiviert, und `Skip for now` überspringt das Kopieren von Skills für diesen Durchlauf, setzt den Vorgang jedoch mit der Plugin-Auswahl fort. Wenn quellinstallierte kuratierte Codex-Plugins migriert werden können und `--plugin` nicht angegeben wurde, fragt die Migration anschließend anhand des Plugin-Namens nach der nativen Aktivierung von Codex-Plugins. Plugin-Elemente sind anfangs aktiviert, sofern die Codex-Plugin-Konfiguration des OpenClaw-Ziels dieses Plugin nicht bereits enthält. Vorhandene Ziel-Plugins sind anfangs deaktiviert und zeigen einen Konflikthinweis wie `conflict: plugin exists` an. Wählen Sie `Toggle all off`, um in diesem Durchlauf keine nativen Codex-Plugins zu migrieren, oder `Skip for now`, um den Vorgang vor der Anwendung abzubrechen.

Wählen Sie für skriptgesteuerte oder exakt festgelegte Durchläufe ausdrücklich einen oder mehrere Skills oder Plugins aus:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Was Codex importiert

- Codex-CLI-Skill-Verzeichnisse unter `$CODEX_HOME/skills`, mit Ausnahme des `.system`-Caches von Codex.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, die zur agentenspezifischen Verwaltung in den aktuellen OpenClaw-Agenten-Arbeitsbereich kopiert werden.
- Quellinstallierte `openai-curated`-Codex-Plugins, die über `plugin/list` des Codex-App-Servers erkannt wurden. Bei der Planung wird für jedes aktivierte installierte Plugin `plugin/read` gelesen.

Für App-gestützte Plugin-Migrationen gelten zusätzliche Prüfungen:

- Für App-gestützte Plugins muss das Konto des Quell-Codex-App-Servers ein ChatGPT-Abonnementkonto sein. Antworten für Nicht-ChatGPT-Konten oder fehlende Konten werden mit `codex_subscription_required` übersprungen.
- Standardmäßig ruft die Migration `app/list` der Quelle nicht auf. Daher werden App-gestützte Plugins, welche die Kontoprüfung bestehen, ohne Überprüfung der App-Zugänglichkeit in der Quelle geplant; bei Übertragungsfehlern der Kontosuche erfolgt eine Überspringung mit `codex_account_unavailable`.
- Übergeben Sie `--verify-plugin-apps`, um einen neuen `app/list`-Schnappschuss der Quelle zu erzwingen und vor der Planung der nativen Aktivierung zu verlangen, dass jede zugehörige App vorhanden, aktiviert und zugänglich ist. In diesem Modus wird bei Übertragungsfehlern der Kontosuche ersatzweise die Überprüfung des App-Inventars der Quelle durchgeführt. Der Schnappschuss wird nur für den aktuellen Prozess im Arbeitsspeicher gehalten und niemals in die Migrationsausgabe oder Zielkonfiguration geschrieben.

Deaktivierte Plugins, nicht lesbare Plugin-Details, durch ein Abonnement beschränkte Quellkonten und – wenn `--verify-plugin-apps` gesetzt ist – fehlende, deaktivierte oder nicht zugängliche Apps werden anstelle von Zielkonfigurationseinträgen zu manuell zu prüfenden, übersprungenen Elementen mit typisierten Gründen. Die Anwendung ruft für jedes ausgewählte zulässige Plugin `plugin/install` des App-Servers auf, selbst wenn der Ziel-App-Server dieses Plugin bereits als installiert und aktiviert meldet. Migrierte Codex-Plugins können nur in Sitzungen verwendet werden, die den nativen Codex-Harness auswählen. Sie werden nicht für OpenClaw-Provider-Ausführungen, ACP-Konversationsbindungen oder andere Harnesses bereitgestellt.

### Manuell zu prüfender Codex-Zustand

Codex-`config.toml`, native `hooks/hooks.json`, nicht kuratierte Marktplätze, zwischengespeicherte Plugin-Pakete, bei denen es sich nicht um quellinstallierte kuratierte Plugins handelt, und quellinstallierte Plugins, welche die Abonnementprüfung der Quelle nicht bestehen, werden nicht automatisch aktiviert. Wenn `--verify-plugin-apps` gesetzt ist, werden auch Plugins übersprungen, welche die Prüfung des App-Inventars der Quelle nicht bestehen. All diese Elemente werden zur manuellen Prüfung in den Migrationsbericht kopiert oder dort gemeldet.

Für migrierte quellinstallierte kuratierte Plugins schreibt die Anwendung:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- einen ausdrücklichen Plugin-Eintrag mit `marketplaceName: "openai-curated"` und `pluginName` für jedes ausgewählte Plugin

Die Migration schreibt niemals `plugins["*"]` und speichert niemals lokale Cache-Pfade von Marktplätzen.

Übersprungene Plugins werden nicht in die Zielkonfiguration geschrieben. Fehler bei Abonnements auf der Quellseite werden bei manuellen Elementen mit typisierten Gründen gemeldet: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` oder `plugin_read_unavailable`. Mit `--verify-plugin-apps` können Fehler im App-Inventar der Quelle außerdem als `app_inaccessible`, `app_disabled`, `app_missing` oder `app_inventory_unavailable` erscheinen. Installationen auf der Zielseite, die eine Authentifizierung erfordern, werden beim betroffenen Plugin-Element mit `status: "skipped"`, `reason: "auth_required"` und bereinigten App-Kennungen gemeldet; ihre expliziten Konfigurationseinträge werden deaktiviert geschrieben, bis Sie sie erneut autorisieren und aktivieren. Andere Installationsfehler werden als elementspezifische `error`-Ergebnisse gemeldet.

Wenn das Plugin-Inventar des Codex-App-Servers während der Planung nicht verfügbar ist, greift die Migration auf zwischengespeicherte Hinweiselemente des Bundles zurück, anstatt die gesamte Migration abzubrechen.

## Hermes-Provider

Der mitgelieferte Hermes-Provider erkennt den Zustand standardmäßig unter `~/.hermes`. Verwenden Sie `--from <path>`, wenn sich Hermes an einem anderen Ort befindet.

### Was Hermes importiert

- Die Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agent-Arbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an die Speicherdateien des Arbeitsbereichs.
- Standardwerte der Speicherkonfiguration für den OpenClaw-Dateispeicher sowie Archiv- oder Elemente zur manuellen Prüfung für externe Speicher-Provider wie Honcho.
- Skills, die unter `skills/<name>/` eine `SKILL.md`-Datei enthalten.
- Skills-spezifische Konfigurationswerte aus `skills.config`.
- OpenAI-OAuth-Anmeldedaten von OpenCode aus der OpenCode-Datei `auth.json`, wenn die interaktive Migration von Anmeldedaten akzeptiert wird oder `--include-secrets` gesetzt ist. OAuth-Einträge in der Hermes-Datei `auth.json` sind Altzustände, die für eine manuelle erneute OpenAI-Authentifizierung oder eine Reparatur durch Doctor gemeldet werden.
- Unterstützte API-Schlüssel und Token aus der Hermes-Datei `.env` und der OpenCode-Datei `auth.json`, wenn die interaktive Migration von Anmeldedaten akzeptiert wird oder `--include-secrets` gesetzt ist.

### Unterstützte `.env`-Schlüssel

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Ausschließlich archivierter Zustand

Hermes-Zustände, die OpenClaw nicht sicher interpretieren kann, werden zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder die Anmeldedaten geladen. Dadurch bleiben undurchsichtige oder unsichere Zustände erhalten, ohne vorzugeben, OpenClaw könne sie automatisch ausführen oder ihnen vertrauen: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Der Kern ist für die CLI-Orchestrierung, die Sicherungsrichtlinie, Eingabeaufforderungen, die JSON-Ausgabe und die Konfliktvorprüfung zuständig. Der Kern übergibt den geprüften Plan an `apply(ctx, plan)`, und Provider dürfen den Plan aus Kompatibilitätsgründen nur neu erstellen, wenn dieses Argument fehlt.

Provider-Plugins können `openclaw/plugin-sdk/migration` zum Erstellen von Elementen und Ermitteln von Zusammenfassungszahlen sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, ausschließlich für Berichte bestimmte Archivkopien, zwischengespeicherte Konfigurations-Laufzeit-Wrapper und Migrationsberichte verwenden.

## Integration in das Onboarding

Das Onboarding kann eine Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen vor der Anwendung weiterhin eine Vorschau an.

<Note>
Onboarding-Importe erfordern eine neue OpenClaw-Einrichtung. Setzen Sie zuerst die Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, wenn bereits ein lokaler Zustand vorhanden ist. Importe mit Sicherung und Überschreiben oder Zusammenführen sind bei bestehenden Einrichtungen durch ein Feature-Gate beschränkt.
</Note>

## Verwandte Themen

- [Migration von Hermes](/de/install/migrating-hermes): Benutzerorientierte Anleitung.
- [Migration von Claude](/de/install/migrating-claude): Benutzerorientierte Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Rechner verschieben.
- [Doctor](/de/gateway/doctor): Zustandsprüfung nach der Anwendung einer Migration.
- [Plugins](/de/tools/plugin): Installation und Registrierung von Plugins.
