---
read_when:
    - Sie kommen von Hermes und möchten Ihre Modellkonfiguration, Prompts, Speicher und Skills beibehalten
    - Sie möchten wissen, was OpenClaw automatisch importiert und was nur im Archiv verbleibt
    - Sie benötigen einen sauberen, skriptgesteuerten Migrationspfad (CI, neu eingerichteter Laptop, Automatisierung)
summary: Wechseln Sie mit einem vorab geprüften, reversiblen Import von Hermes zu OpenClaw
title: Migration von Hermes
x-i18n:
    generated_at: "2026-04-30T07:01:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importiert den Hermes-Zustand über einen gebündelten Migrations-Provider. Der Provider zeigt vor jeder Zustandsänderung eine Vorschau an, redigiert Geheimnisse in Plänen und Berichten und erstellt vor der Anwendung ein verifiziertes Backup.

<Note>
Importe erfordern eine frische OpenClaw-Einrichtung. Wenn bereits lokaler OpenClaw-Zustand vorhanden ist, setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, oder verwenden Sie `openclaw migrate` direkt mit `--overwrite`, nachdem Sie den Plan geprüft haben.
</Note>

## Zwei Möglichkeiten für den Import

<Tabs>
  <Tab title="Onboarding-Assistent">
    Der schnellste Weg. Der Assistent erkennt Hermes unter `~/.hermes` und zeigt vor der Anwendung eine Vorschau an.

    ```bash
    openclaw onboard --flow import
    ```

    Oder geben Sie eine bestimmte Quelle an:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Verwenden Sie `openclaw migrate` für skriptgesteuerte oder wiederholbare Läufe. Die vollständige Referenz finden Sie unter [`openclaw migrate`](/de/cli/migrate).

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Fügen Sie `--from <path>` hinzu, wenn Hermes außerhalb von `~/.hermes` liegt.

  </Tab>
</Tabs>

## Was importiert wird

<AccordionGroup>
  <Accordion title="Modellkonfiguration">
    - Standard-Modellauswahl aus Hermes `config.yaml`.
    - Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.

  </Accordion>
  <Accordion title="MCP-Server">
    MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
  </Accordion>
  <Accordion title="Arbeitsbereichsdateien">
    - `SOUL.md` und `AGENTS.md` werden in den OpenClaw-Agent-Arbeitsbereich kopiert.
    - `memories/MEMORY.md` und `memories/USER.md` werden an die passenden OpenClaw-Speicherdateien **angehängt**, statt sie zu überschreiben.

  </Accordion>
  <Accordion title="Speicherkonfiguration">
    Standardwerte der Speicherkonfiguration für den OpenClaw-Dateispeicher. Externe Speicher-Provider wie Honcho werden als Archiv- oder manuell zu prüfende Einträge erfasst, damit Sie sie bewusst migrieren können.
  </Accordion>
  <Accordion title="Skills">
    Skills mit einer `SKILL.md`-Datei unter `skills/<name>/` werden zusammen mit Skill-spezifischen Konfigurationswerten aus `skills.config` kopiert.
  </Accordion>
  <Accordion title="API-Schlüssel (optional)">
    Setzen Sie `--include-secrets`, um unterstützte `.env`-Schlüssel zu importieren: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Ohne das Flag werden Geheimnisse nie kopiert.
  </Accordion>
</AccordionGroup>

## Was nur im Archiv bleibt

Der Provider kopiert diese Einträge zur manuellen Prüfung in das Migrationsberichtsverzeichnis, lädt sie aber **nicht** in die aktive OpenClaw-Konfiguration oder die Anmeldedaten:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw weigert sich, diesen Zustand automatisch auszuführen oder ihm zu vertrauen, weil Formate und Vertrauensannahmen zwischen Systemen abweichen können. Verschieben Sie benötigte Inhalte nach der Prüfung des Archivs manuell.

## Empfohlener Ablauf

<Steps>
  <Step title="Plan in der Vorschau anzeigen">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Der Plan listet alles auf, was geändert wird, einschließlich Konflikten, übersprungener Einträge und sensibler Einträge. Die Planausgabe redigiert verschachtelte Schlüssel, die wie Geheimnisse aussehen.

  </Step>
  <Step title="Mit Backup anwenden">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw erstellt und verifiziert vor der Anwendung ein Backup. Wenn API-Schlüssel importiert werden sollen, fügen Sie `--include-secrets` hinzu.

  </Step>
  <Step title="Doctor ausführen">
    ```bash
    openclaw doctor
    ```

    [Doctor](/de/gateway/doctor) wendet ausstehende Konfigurationsmigrationen erneut an und prüft auf Probleme, die während des Imports eingeführt wurden.

  </Step>
  <Step title="Neu starten und prüfen">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Bestätigen Sie, dass der Gateway fehlerfrei ist und Ihr importiertes Modell, Ihr Speicher und Ihre Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Die Anwendung wird verweigert, wenn der Plan Konflikte meldet (eine Datei oder ein Konfigurationswert existiert bereits am Ziel).

<Warning>
Führen Sie den Befehl nur dann mit `--overwrite` erneut aus, wenn das Ersetzen des vorhandenen Ziels beabsichtigt ist. Provider können weiterhin Backups auf Eintragsebene für überschriebene Dateien im Migrationsberichtsverzeichnis schreiben.
</Warning>

Bei einer frischen OpenClaw-Installation sind Konflikte ungewöhnlich. Sie treten typischerweise auf, wenn Sie den Import auf einer Einrichtung erneut ausführen, die bereits Benutzeränderungen enthält.

Wenn während der Anwendung ein Konflikt auftritt (zum Beispiel ein unerwarteter Wettlauf um eine Konfigurationsdatei), markiert Hermes verbleibende abhängige Konfigurationseinträge als `skipped` mit dem Grund `blocked by earlier apply conflict`, statt sie teilweise zu schreiben. Der Migrationsbericht erfasst jeden blockierten Eintrag, damit Sie den ursprünglichen Konflikt beheben und den Import erneut ausführen können.

## Geheimnisse

Geheimnisse werden standardmäßig nie importiert.

- Führen Sie zuerst `openclaw migrate apply hermes --yes` aus, um Zustand ohne Geheimnisse zu importieren.
- Wenn Sie auch unterstützte `.env`-Schlüssel kopieren möchten, führen Sie den Befehl erneut mit `--include-secrets` aus.
- Konfigurieren Sie für SecretRef-verwaltete Anmeldedaten die SecretRef-Quelle, nachdem der Import abgeschlossen ist.

## JSON-Ausgabe für Automatisierung

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Mit `--json` und ohne `--yes` gibt apply den Plan aus und verändert keinen Zustand. Dies ist der sicherste Modus für CI und gemeinsam genutzte Skripte.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Apply verweigert die Ausführung wegen Konflikten">
    Prüfen Sie die Planausgabe. Jeder Konflikt identifiziert den Quellpfad und das vorhandene Ziel. Entscheiden Sie pro Eintrag, ob Sie ihn überspringen, das Ziel bearbeiten oder den Befehl mit `--overwrite` erneut ausführen.
  </Accordion>
  <Accordion title="Hermes liegt außerhalb von ~/.hermes">
    Übergeben Sie `--from /actual/path` (CLI) oder `--import-source /actual/path` (Onboarding).
  </Accordion>
  <Accordion title="Onboarding verweigert den Import bei einer bestehenden Einrichtung">
    Onboarding-Importe erfordern eine frische Einrichtung. Setzen Sie entweder den Zustand zurück und führen Sie das Onboarding erneut aus, oder verwenden Sie direkt `openclaw migrate apply hermes`, das `--overwrite` und explizite Backup-Steuerung unterstützt.
  </Accordion>
  <Accordion title="API-Schlüssel wurden nicht importiert">
    `--include-secrets` ist erforderlich, und nur die oben aufgeführten Schlüssel werden erkannt. Andere Variablen in `.env` werden ignoriert.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Strukturen.
- [Onboarding](/de/cli/onboard): Assistentenablauf und nicht interaktive Flags.
- [Migration](/de/install/migrating): eine OpenClaw-Installation zwischen Rechnern verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach der Migration.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): wo `SOUL.md`, `AGENTS.md` und Speicherdateien liegen.
