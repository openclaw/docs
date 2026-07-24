---
read_when:
    - Sie möchten von Hermes oder einem anderen Agentensystem zu OpenClaw migrieren
    - Sie fügen einen Plugin-eigenen Migrations-Provider hinzu
summary: CLI-Referenz für `openclaw migrate` (Status aus einem anderen Agentensystem importieren)
title: Migrieren
x-i18n:
    generated_at: "2026-07-24T04:50:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f492535019f8a69706ff918462ba74cf5d26e733d2e4e9493b3c76bd77f2584d
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importieren Sie den Zustand aus einem anderen Agentensystem über einen Plugin-eigenen Migrations-Provider. Mitgelieferte Provider decken Claude, Codex CLI und [Hermes](/de/install/migrating-hermes) ab; Plugins können zusätzliche Provider registrieren.

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

Wird `openclaw migrate <provider>` ohne weitere Flags ausgeführt, wird die Migration geplant und in einer Vorschau angezeigt; vor der Anwendung erfolgt (in einer TTY) eine Abfrage. `openclaw migrate plan <provider>` und `openclaw migrate apply <provider>` teilen Vorschau und Anwendung in separate Unterbefehle mit denselben Flags auf.

<ParamField path="<provider>" type="string">
  Name eines registrierten Migrations-Providers, beispielsweise `hermes`. Führen Sie `openclaw migrate list` aus, um die installierten Provider anzuzeigen.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Erstellt den Plan und beendet den Vorgang, ohne den Zustand zu ändern.
</ParamField>
<ParamField path="--from <path>" type="string">
  Überschreibt das Verzeichnis des Quellzustands. Hermes berücksichtigt `$HERMES_HOME` und das aktive Profil und verwendet anschließend den Plattformstandard (`~/.hermes` oder `%LOCALAPPDATA%\hermes`). Codex verwendet standardmäßig `~/.codex` (oder `$CODEX_HOME`), Claude standardmäßig `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importiert unterstützte Anmeldedaten ohne Abfrage. Bei interaktiver Anwendung wird vor dem Import erkannter Authentifizierungsdaten gefragt, wobei „Ja“ standardmäßig ausgewählt ist; im nicht interaktiven Modus erfordert `--yes` die Option `--include-secrets`, um sie zu importieren.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Überspringt den Import von Authentifizierungsdaten einschließlich der interaktiven Abfrage.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Erlaubt der Anwendung, vorhandene Ziele zu ersetzen, wenn der Plan Konflikte meldet.
</ParamField>
<ParamField path="--yes" type="boolean">
  Überspringt die Bestätigungsabfrage. Im nicht interaktiven Modus erforderlich.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wählt anhand des Skill-Namens oder der Element-ID ein zu kopierendes Skill-Element aus. Wiederholen Sie das Flag, um mehrere Skills zu migrieren. Ohne diese Angabe zeigen interaktive Codex-Migrationen eine Kontrollkästchenauswahl an, während nicht interaktive Migrationen alle geplanten Skills beibehalten.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wählt anhand des Plugin-Namens oder der Element-ID ein zu installierendes Codex-Plugin-Element aus. Wiederholen Sie das Flag, um mehrere Codex-Plugins zu migrieren. Ohne diese Angabe zeigen interaktive Codex-Migrationen eine native Kontrollkästchenauswahl für Codex-Plugins an, während nicht interaktive Migrationen alle geplanten Plugins beibehalten. Gilt nur für aus dem Quellcode installierte `openai-curated`-Codex-Plugins, die vom Inventar des Codex-App-Servers erkannt wurden.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Nur Codex. Erzwingt vor der Planung der nativen Plugin-Aktivierung eine neue `app/list`-Durchsuchung des Codex-App-Servers der Quelle. Standardmäßig deaktiviert, damit die Migrationsplanung schnell bleibt.
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

`openclaw migrate` folgt dem Prinzip „Vorschau zuerst“.

<AccordionGroup>
  <Accordion title="Vorschau vor der Anwendung">
    Der Provider gibt einen aufgeschlüsselten Plan zurück, bevor Änderungen vorgenommen werden, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. JSON-Pläne, Anwendungsausgaben und Migrationsberichte schwärzen verschachtelte Schlüssel, die wie Geheimnisse aussehen, etwa API-Schlüssel, Tokens, Autorisierungsheader, Cookies und Passwörter.

    `openclaw migrate apply <provider>` zeigt eine Vorschau des Plans an und fragt vor einer Zustandsänderung nach, sofern `--yes` nicht gesetzt ist. Im nicht interaktiven Modus erfordert die Anwendung `--yes`.

  </Accordion>
  <Accordion title="Sicherungen">
    Vor der Anwendung der Migration erstellt und überprüft der Anwendungsvorgang eine OpenClaw-Sicherung. Ist noch kein lokaler OpenClaw-Zustand vorhanden, wird der Sicherungsschritt übersprungen und die Migration fortgesetzt. Um eine Sicherung bei vorhandenem Zustand zu überspringen, übergeben Sie sowohl `--no-backup` als auch `--force`.
  </Accordion>
  <Accordion title="Konflikte">
    Die Anwendung verweigert die Fortsetzung, wenn der Plan Konflikte enthält. Prüfen Sie den Plan und führen Sie den Vorgang anschließend mit `--overwrite` erneut aus, falls vorhandene Ziele absichtlich ersetzt werden sollen. Provider können für überschriebene Dateien weiterhin Sicherungen auf Elementebene im Verzeichnis des Migrationsberichts erstellen.
  </Accordion>
  <Accordion title="Geheimnisse">
    Bei interaktiver Anwendung wird gefragt, ob erkannte Authentifizierungsdaten importiert werden sollen, wobei „Ja“ standardmäßig ausgewählt ist. Verwenden Sie `--no-auth-credentials`, um sie zu überspringen, oder `--include-secrets` zusammen mit `--yes` für einen unbeaufsichtigten Import von Anmeldedaten.
  </Accordion>
</AccordionGroup>

## Claude-Provider

Der mitgelieferte Claude-Provider erkennt den Zustand von Claude Code standardmäßig unter `~/.claude`. Verwenden Sie `--from <path>`, um ein bestimmtes Stammverzeichnis von Claude Code oder Projektstammverzeichnis zu importieren.

<Tip>
Eine benutzerorientierte Anleitung finden Sie unter [Migration von Claude](/de/install/migrating-claude).
</Tip>

### Von Claude importierte Elemente

- Markdown-Dateien des automatischen Speichers von Claude Code aus `~/.claude/projects/*/memory` und einem
  benutzerdefinierten `autoMemoryDirectory`, die für den indizierten
  Abruf unter `memory/imports/claude-code/` kopiert werden.
- Projektdateien `CLAUDE.md` und `.claude/CLAUDE.md` in den OpenClaw-Agentenarbeitsbereich (`AGENTS.md`).
- Benutzerdatei `~/.claude/CLAUDE.md`, die an die Arbeitsbereichsdatei `USER.md` angehängt wird.
- MCP-Serverdefinitionen aus der Projektdatei `.mcp.json`, der Claude-Code-Datei `~/.claude.json` (einschließlich ihrer projektspezifischen Einträge) und der Claude-Desktop-Datei `claude_desktop_config.json`.
- Claude-Skill-Verzeichnisse, die `SKILL.md` enthalten (Benutzerverzeichnis `~/.claude/skills` und Projektverzeichnis `.claude/skills`).
- Markdown-Dateien mit Claude-Befehlen (Benutzerdateien unter `~/.claude/commands` und Projektdateien unter `.claude/commands`), die in OpenClaw-Skills umgewandelt werden und nur manuell aufgerufen werden können.

### Archivierter und manuell zu prüfender Zustand

Claude-Hooks, Berechtigungen, Umgebungsstandards, die Projektdateien `CLAUDE.local.md` und `.claude/rules`, Benutzer- und Projektverzeichnisse `agents/` sowie der Projektverlauf (`projects`, `cache` und `plans` unter `~/.claude`) werden im Migrationsbericht aufbewahrt oder als manuell zu prüfende Elemente gemeldet. OpenClaw führt Hooks nicht aus, kopiert keine umfassenden Positivlisten und importiert den Zustand von OAuth-/Desktop-Anmeldedaten nicht automatisch.

## Codex-Provider

Der mitgelieferte Codex-Provider erkennt den Zustand der Codex CLI standardmäßig unter `~/.codex` oder unter `CODEX_HOME`, wenn diese Umgebungsvariable gesetzt ist. Verwenden Sie `--from <path>`, um ein bestimmtes Codex-Stammverzeichnis zu inventarisieren.

Verwenden Sie diesen Provider beim Wechsel zum OpenClaw-Codex-Harness, wenn Sie nützliche persönliche Ressourcen der Codex CLI gezielt übernehmen möchten. Lokale Starts des Codex-App-Servers verwenden ein agentenspezifisches `CODEX_HOME` und lesen daher standardmäßig nicht Ihr persönliches `~/.codex`. Der reguläre Prozess `HOME` wird weiterhin vererbt, sodass Codex gemeinsame Skills und Plugin-Marktplatzeinträge unter `$HOME/.agents/*` erkennen kann und Unterprozesse Konfigurationen und Tokens im Benutzerverzeichnis finden können.

Wird `openclaw migrate codex` in einem interaktiven Terminal ausgeführt, erscheint zunächst eine Vorschau des vollständigen Plans; anschließend werden vor der abschließenden Anwendungsbestätigung Kontrollkästchenauswahlen geöffnet. Zuerst werden zu kopierende Skill-Elemente abgefragt. Verwenden Sie `Toggle all on` oder `Toggle all off` für eine Massenauswahl. Drücken Sie die Leertaste, um Zeilen umzuschalten, oder die Eingabetaste, um die hervorgehobene Zeile zu aktivieren und fortzufahren. Geplante Skills sind anfangs ausgewählt, Skills mit Konflikten nicht, und `Skip for now` überspringt das Kopieren von Skills für diesen Durchlauf, setzt den Vorgang aber mit der Plugin-Auswahl fort. Wenn aus dem Quellcode installierte, kuratierte Codex-Plugins migriert werden können und `--plugin` nicht angegeben wurde, wird anschließend anhand des Plugin-Namens nach der nativen Aktivierung von Codex-Plugins gefragt. Plugin-Elemente sind anfangs ausgewählt, sofern dieses Plugin nicht bereits in der Zielkonfiguration für OpenClaw-Codex-Plugins enthalten ist. Bereits im Ziel vorhandene Plugins sind anfangs nicht ausgewählt und zeigen einen Konflikthinweis wie `conflict: plugin exists` an; wählen Sie `Toggle all off`, um in diesem Durchlauf keine nativen Codex-Plugins zu migrieren, oder `Skip for now`, um den Vorgang vor der Anwendung abzubrechen.

Wählen Sie für skriptgesteuerte oder exakt festgelegte Durchläufe ausdrücklich mindestens einen Skill oder mindestens ein Plugin aus:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Von Codex importierte Elemente

- Konsolidierte Codex-Dateien `MEMORY.md` und `memory_summary.md` aus
  `$CODEX_HOME/memories`, die für den indizierten Abruf unter
  `memory/imports/codex/` kopiert werden. Unverarbeiteter Rollout-Speicher wird nicht importiert.
- Skill-Verzeichnisse der Codex CLI unter `$CODEX_HOME/skills`, ausgenommen der `.system`-Cache von Codex.
- Persönliche AgentSkills unter `$HOME/.agents/skills`, die zur agentenspezifischen Verwaltung in den aktuellen OpenClaw-Agentenarbeitsbereich kopiert werden.
- Aus dem Quellcode installierte `openai-curated`-Codex-Plugins, die über `plugin/list` des Codex-App-Servers erkannt werden. Bei der Planung wird `plugin/read` für jedes aktivierte installierte Plugin gelesen.

Für die Migration App-gestützter Plugins gelten zusätzliche Prüfungen:

- App-gestützte Plugins setzen voraus, dass das Konto des Codex-App-Servers der Quelle ein ChatGPT-Abonnementkonto ist. Antworten für Konten ohne ChatGPT-Abonnement oder fehlende Kontoantworten werden mit `codex_subscription_required` übersprungen.
- Standardmäßig ruft die Migration `app/list` der Quelle nicht auf. Daher werden App-gestützte Plugins, die die Kontoprüfung bestehen, ohne Prüfung der App-Zugänglichkeit in der Quelle eingeplant, während Transportfehler bei der Kontoabfrage mit `codex_account_unavailable` zum Überspringen führen.
- Übergeben Sie `--verify-plugin-apps`, um einen neuen Snapshot von `app/list` der Quelle zu erzwingen und vor der Planung der nativen Aktivierung zu verlangen, dass jede eigene App vorhanden, aktiviert und zugänglich ist. In diesem Modus wird bei Transportfehlern der Kontoabfrage stattdessen die Prüfung des App-Inventars der Quelle ausgeführt. Der Snapshot wird nur für den aktuellen Prozess im Arbeitsspeicher gehalten und niemals in die Migrationsausgabe oder Zielkonfiguration geschrieben.

Deaktivierte Plugins, nicht lesbare Plugin-Details, durch ein Abonnement eingeschränkte Quellkonten sowie – wenn `--verify-plugin-apps` gesetzt ist – fehlende, deaktivierte oder unzugängliche Apps werden statt Einträgen in der Zielkonfiguration zu manuell zu prüfenden, übersprungenen Elementen mit typisierten Gründen. Bei der Anwendung wird für jedes ausgewählte geeignete Plugin `plugin/install` des App-Servers aufgerufen, selbst wenn der Ziel-App-Server dieses Plugin bereits als installiert und aktiviert meldet. Migrierte Codex-Plugins können nur in Sitzungen verwendet werden, die den nativen Codex-Harness auswählen; sie stehen weder OpenClaw-Provider-Ausführungen noch ACP-Konversationsbindungen oder anderen Harnesses zur Verfügung.

### Manuell zu prüfender Codex-Zustand

Codex `config.toml`, native `hooks/hooks.json`, nicht kuratierte Marketplaces, zwischengespeicherte Plugin-Bundles, die keine aus dem Quellcode installierten kuratierten Plugins sind, sowie aus dem Quellcode installierte Plugins, die die Quellabonnement-Prüfung nicht bestehen, werden nicht automatisch aktiviert. Wenn `--verify-plugin-apps` festgelegt ist, werden Plugins, die die App-Bestandsprüfung der Quelle nicht bestehen, ebenfalls übersprungen. Alle diese Elemente werden kopiert oder im Migrationsbericht zur manuellen Prüfung aufgeführt.

Für migrierte, aus dem Quellcode installierte kuratierte Plugins werden folgende Schreibvorgänge ausgeführt:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- ein expliziter Plugin-Eintrag mit `marketplaceName: "openai-curated"` und `pluginName` für jedes ausgewählte Plugin

Die Migration schreibt niemals `plugins["*"]` und speichert niemals lokale Marketplace-Cache-Pfade.

Übersprungene Plugins werden nicht in die Zielkonfiguration geschrieben. Fehler bei quellseitigen Abonnementprüfungen werden in manuellen Elementen mit typisierten Gründen gemeldet: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` oder `plugin_read_unavailable`. Mit `--verify-plugin-apps` können Fehler bei der App-Bestandsprüfung der Quelle außerdem als `app_inaccessible`, `app_disabled`, `app_missing` oder `app_inventory_unavailable` erscheinen. Zielseitige Installationen, die eine Authentifizierung erfordern, werden beim betroffenen Plugin-Element mit `status: "skipped"`, `reason: "auth_required"` und bereinigten App-Kennungen gemeldet; ihre expliziten Konfigurationseinträge werden deaktiviert geschrieben, bis Sie sie erneut autorisieren und aktivieren. Andere Installationsfehler werden als elementbezogene `error`-Ergebnisse gemeldet.

Wenn der Plugin-Bestand des Codex-App-Servers während der Planung nicht verfügbar ist, greift die Migration auf Hinweise zu zwischengespeicherten Bundles zurück, statt die gesamte Migration fehlschlagen zu lassen.

## Hermes-Provider

Der gebündelte Hermes-Provider folgt `$HERMES_HOME` und dem aktiven Profil und verwendet anschließend den Plattformstandard (`~/.hermes` oder `%LOCALAPPDATA%\hermes`). Verwenden Sie `--from <path>`, um die Erkennung zu überschreiben.

### Was Hermes importiert

- Standardmodellkonfiguration aus `config.yaml`.
- Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `model`, `providers` und `custom_providers`.
- MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`. Exakte OpenClaw-Zuordnungen decken das standardmäßige Streamable-HTTP-Routing, den OAuth-Bereich, die boolesche TLS-Verifizierung, separate Pfade für Clientzertifikat und -schlüssel sowie die Hermes-Richtlinie für native Tools, Ressourcen-Tools und Prompt-Tools ab. Nicht unterstützte, ausschließlich Hermes-spezifische Laufzeit- oder Anmeldedatenfelder werden zur manuellen Prüfung gemeldet.
- `SOUL.md` und `AGENTS.md` in den OpenClaw-Agent-Arbeitsbereich.
- `memories/MEMORY.md` und `memories/USER.md`, angehängt an die Speicherdateien des Arbeitsbereichs.
  Ausschließlich für den Speicher bestimmte Oberflächen (die Speicher-Seite des Onboardings und die Speicher-
  Importseite der Control UI) kopieren diese Dateien stattdessen unter `memory/imports/hermes/`, um
  einen indizierten Abruf zu ermöglichen, ohne den bestehenden Arbeitsbereichsspeicher zu verändern.
- Standardeinstellungen der Speicherkonfiguration für den OpenClaw-Dateispeicher sowie Archiv- oder manuell zu prüfende Elemente für externe Speicher-Provider wie Honcho.
- Skills, die irgendwo unter `skills/` eine `SKILL.md`-Datei enthalten; verschachtelte Skills werden in das Skill-Verzeichnis des Arbeitsbereichs abgeflacht.
- Skill-spezifische Konfigurationswerte aus `skills.config`.
- Aktuelle Hermes-OpenAI-Codex-OAuth-Anmeldedaten und OpenCode-OpenAI-OAuth-Anmeldedaten, wenn die interaktive Migration von Anmeldedaten akzeptiert wird oder wenn `--include-secrets` festgelegt ist. Hermes und OpenClaw dürfen nicht dasselbe importierte Aktualisierungs-Grant verwenden.
- Unterstützte API-Schlüssel und Token aus Hermes `.env` und OpenCode `auth.json`, wenn die interaktive Migration von Anmeldedaten akzeptiert wird oder wenn `--include-secrets` festgelegt ist.

### Unterstützte `.env`-Schlüssel

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `KIMI_CODING_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Nur zur Archivierung vorgesehener Zustand

Hermes-Zustand, den OpenClaw nicht sicher interpretieren kann, wird zur manuellen Prüfung in den Migrationsbericht kopiert, aber nicht in die aktive OpenClaw-Konfiguration oder die Anmeldedaten geladen. Dazu gehören `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `plans/`, `workspace/`, `skins/`, `kanban/`, Kopplungs-/Plattformzustand, Gateway-Routing-/Prozesszustand und die erkannten Hermes-SQLite-Datenbanken.

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

Zur Laufzeit ruft das Plugin `api.registerMigrationProvider(...)` auf. Der Provider implementiert `detect`, `plan` und `apply`. Der Core ist für die CLI-Orchestrierung, Sicherungsrichtlinie, Eingabeaufforderungen, JSON-Ausgabe und Konflikt-Vorabprüfung zuständig. Der Core übergibt den geprüften Plan an `apply(ctx, plan)`; Provider dürfen den Plan aus Kompatibilitätsgründen nur neu erstellen, wenn dieses Argument fehlt. Migrationselemente können `applyPhase: "after-promotion"` für externe Aktivierungseffekte festlegen, die das Onboarding aufschieben muss, bis die bereitgestellten lokalen Daten dauerhaft veröffentlicht wurden. Diese Provider müssen `deferredApply: { retrySafe: true }` deklarieren und jeden aufgeschobenen Effekt so gestalten, dass er nach einem unterbrochenen Prozess sicher erneut ausgeführt werden kann; das Onboarding lehnt nicht deklarierte aufgeschobene Effekte ab. Eine idempotente Operation ohne Wirkung sollte ein nicht mutierendes Element mit `deferredCompletion: true` zurückgeben, damit die Wiederherstellung es als abgeschlossen vermerken kann. Eigenständiges `openclaw migrate` wendet den vollständigen Plan weiterhin über seinen normalen, durch Sicherungen geschützten Ablauf an.

Provider-Plugins können `openclaw/plugin-sdk/migration` für die Elementerstellung und Zusammenfassungszähler sowie `openclaw/plugin-sdk/migration-runtime` für konfliktbewusste Dateikopien, ausschließlich zur Archivierung bestimmte Berichtskopien, zwischengespeicherte Konfigurations-Laufzeit-Wrapper und Migrationsberichte verwenden.

## Onboarding-Integration

Das Onboarding kann eine Migration anbieten, wenn ein Provider eine bekannte Quelle erkennt. Sowohl `openclaw onboard --flow import` als auch `openclaw setup --wizard --import-from hermes` verwenden denselben Plugin-Migrations-Provider und zeigen vor der Anwendung weiterhin eine Vorschau an. Anders als bei der eigenständigen Migration stellt der Onboarding-Pfad für ein frisches Ziel lokale Artefakte und importierte Anmeldedaten bereit, verifiziert oder repariert die importierte Inferenz innerhalb der Bereitstellungsumgebung und überführt anschließend den Arbeitsbereichs- und Agent-Zustand, bevor die Konfiguration festgeschrieben wird. Ein Übertragungsjournal im Modus `0600` ermöglicht es dem nächsten Lauf, eine unterbrochene Veröffentlichung einschließlich aufgeschobener externer Aktivierungen abzuschließen oder zurückzusetzen, ohne importierte lokale Daten erneut einzuspielen.

<Note>
Onboarding-Importe erfordern eine frische OpenClaw-Einrichtung. Setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, wenn bereits lokaler Zustand vorhanden ist. Importe mit Sicherung und Überschreiben oder Zusammenführen sind für bestehende Einrichtungen funktionsbeschränkt.
</Note>

## Verwandte Themen

- [Migration von Hermes](/de/install/migrating-hermes): benutzerorientierte Anleitung.
- [Migration von Claude](/de/install/migrating-claude): benutzerorientierte Anleitung.
- [Migration](/de/install/migrating): OpenClaw auf einen neuen Computer verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach der Anwendung einer Migration.
- [Plugins](/de/tools/plugin): Installation und Registrierung von Plugins.
