---
read_when:
    - Sie kommen von Hermes und möchten Ihre Modellkonfiguration, Prompts, Ihren Speicher und Skills behalten
    - Sie möchten wissen, was OpenClaw automatisch importiert und was nur im Archiv bleibt
    - Sie benötigen einen sauberen, skriptgesteuerten Migrationspfad (CI, neuer Laptop, Automatisierung)
summary: Wechseln Sie von Hermes zu OpenClaw mit einem vorab geprüften, umkehrbaren Import
title: Migration von Hermes
x-i18n:
    generated_at: "2026-06-27T17:38:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importiert den Hermes-Zustand über einen gebündelten Migrations-Provider. Der Provider zeigt vor jeder Zustandsänderung eine Vorschau an, schwärzt Geheimnisse in Plänen und Berichten und erstellt vor der Anwendung ein verifiziertes Backup.

<Note>
Importe erfordern eine frische OpenClaw-Einrichtung. Wenn Sie bereits lokalen OpenClaw-Zustand haben, setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, oder verwenden Sie `openclaw migrate` direkt mit `--overwrite`, nachdem Sie den Plan geprüft haben.
</Note>

## Zwei Wege zum Import

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
    Verwenden Sie `openclaw migrate` für geskriptete oder wiederholbare Läufe. Die vollständige Referenz finden Sie unter [`openclaw migrate`](/de/cli/migrate).

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
    - Standardmäßige Modellauswahl aus Hermes `config.yaml`.
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
    Standards für die Speicherkonfiguration für OpenClaw-Dateispeicher. Externe Speicher-Provider wie Honcho werden als Archiv- oder Elemente für die manuelle Prüfung erfasst, damit Sie sie bewusst verschieben können.
  </Accordion>
  <Accordion title="Skills">
    Skills mit einer `SKILL.md`-Datei unter `skills/<name>/` werden zusammen mit den Skill-spezifischen Konfigurationswerten aus `skills.config` kopiert.
  </Accordion>
  <Accordion title="Auth-Anmeldedaten">
    Das interaktive `openclaw migrate` fragt vor dem Import von Auth-Anmeldedaten, wobei Ja standardmäßig ausgewählt ist. Akzeptierte Importe umfassen OpenCode-OpenAI-OAuth-Anmeldedaten aus OpenCode `auth.json`, OpenCode- und GitHub-Copilot-Einträge aus OpenCode `auth.json` sowie die [unterstützten `.env`-Schlüssel](/de/cli/migrate#supported-env-keys). Hermes-`auth.json`-OAuth-Einträge sind Legacy-Zustand und werden als manuelle Reauthentifizierung oder Doctor-Arbeit angezeigt, statt in die Live-Authentifizierung importiert zu werden. Verwenden Sie `--include-secrets` für den nicht interaktiven Import von Anmeldedaten mit `openclaw migrate`, `--no-auth-credentials`, um ihn zu überspringen, oder beim Import über den Onboarding-Assistenten `--import-secrets`.
  </Accordion>
</AccordionGroup>

## Was nur archiviert bleibt

Der Provider kopiert diese Elemente zur manuellen Prüfung in das Verzeichnis des Migrationsberichts, lädt sie aber **nicht** in die Live-Konfiguration oder Anmeldedaten von OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw weigert sich, diesen Zustand automatisch auszuführen oder ihm zu vertrauen, weil sich Formate und Vertrauensannahmen zwischen Systemen unterscheiden können. Verschieben Sie nach der Prüfung des Archivs von Hand, was Sie benötigen.

## Empfohlener Ablauf

<Steps>
  <Step title="Plan in der Vorschau prüfen">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Der Plan listet alles auf, was geändert wird, einschließlich Konflikten, übersprungenen Elementen und sensiblen Elementen. Die Planausgabe schwärzt verschachtelte Schlüssel, die wie Geheimnisse aussehen.

  </Step>
  <Step title="Mit Backup anwenden">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw erstellt und verifiziert vor der Anwendung ein Backup. Dieses nicht interaktive Beispiel importiert nicht geheime Zustände. Führen Sie den Befehl ohne `--yes` aus, um die Abfrage zu Anmeldedaten zu beantworten, oder fügen Sie `--include-secrets` hinzu, um unterstützte Anmeldedaten in unbeaufsichtigten Läufen einzuschließen.

  </Step>
  <Step title="Doctor ausführen">
    ```bash
    openclaw doctor
    ```

    [Doctor](/de/gateway/doctor) wendet ausstehende Konfigurationsmigrationen erneut an und prüft auf Probleme, die während des Imports eingeführt wurden.

  </Step>
  <Step title="Neu starten und verifizieren">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Bestätigen Sie, dass der Gateway fehlerfrei ist und Ihr importiertes Modell, Ihr Speicher und Ihre Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Die Anwendung wird nicht fortgesetzt, wenn der Plan Konflikte meldet, also wenn eine Datei oder ein Konfigurationswert am Ziel bereits vorhanden ist.

<Warning>
Führen Sie den Vorgang nur dann erneut mit `--overwrite` aus, wenn das Ersetzen des vorhandenen Ziels beabsichtigt ist. Provider können weiterhin Backups auf Elementebene für überschriebene Dateien im Verzeichnis des Migrationsberichts schreiben.
</Warning>

Bei einer frischen OpenClaw-Installation sind Konflikte ungewöhnlich. Sie treten typischerweise auf, wenn Sie den Import auf einer Einrichtung erneut ausführen, die bereits Benutzeränderungen enthält.

Wenn mitten in der Anwendung ein Konflikt auftritt, zum Beispiel ein unerwartetes Race bei einer Konfigurationsdatei, markiert Hermes die verbleibenden abhängigen Konfigurationselemente als `skipped` mit dem Grund `blocked by earlier apply conflict`, statt sie teilweise zu schreiben. Der Migrationsbericht erfasst jedes blockierte Element, damit Sie den ursprünglichen Konflikt beheben und den Import erneut ausführen können.

## Geheimnisse

Das interaktive `openclaw migrate` fragt, ob erkannte Auth-Anmeldedaten importiert werden sollen, wobei Ja standardmäßig ausgewählt ist.

- Wenn Sie die Abfrage akzeptieren, werden OpenCode-OpenAI-OAuth-Anmeldedaten aus OpenCode `auth.json`, OpenCode- und GitHub-Copilot-Einträge aus OpenCode `auth.json` sowie die [unterstützten `.env`-Schlüssel](/de/cli/migrate#supported-env-keys) importiert. Hermes-`auth.json`-OAuth-Einträge werden für manuelle OpenAI-Reauthentifizierung oder Doctor-Reparatur gemeldet.
- Verwenden Sie `--no-auth-credentials` oder wählen Sie in der Abfrage Nein, um nur nicht geheimen Zustand zu importieren.
- Verwenden Sie `--include-secrets`, wenn Sie unbeaufsichtigt mit `--yes` ausführen.
- Verwenden Sie beim Import von Anmeldedaten über den Onboarding-Assistenten `--import-secrets`.
- Konfigurieren Sie bei SecretRef-verwalteten Anmeldedaten die SecretRef-Quelle, nachdem der Import abgeschlossen ist.

## JSON-Ausgabe für Automatisierung

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Mit `--json` und ohne `--yes` gibt die Anwendung den Plan aus und verändert den Zustand nicht. Dies ist der sicherste Modus für CI und gemeinsam genutzte Skripte.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Anwendung wird wegen Konflikten verweigert">
    Prüfen Sie die Planausgabe. Jeder Konflikt identifiziert den Quellpfad und das vorhandene Ziel. Entscheiden Sie pro Element, ob Sie es überspringen, das Ziel bearbeiten oder erneut mit `--overwrite` ausführen.
  </Accordion>
  <Accordion title="Hermes liegt außerhalb von ~/.hermes">
    Übergeben Sie `--from /actual/path` (CLI) oder `--import-source /actual/path` (Onboarding).
  </Accordion>
  <Accordion title="Onboarding verweigert den Import in eine vorhandene Einrichtung">
    Onboarding-Importe erfordern eine frische Einrichtung. Setzen Sie entweder den Zustand zurück und führen Sie das Onboarding erneut aus, oder verwenden Sie direkt `openclaw migrate apply hermes`, das `--overwrite` und explizite Backup-Steuerung unterstützt.
  </Accordion>
  <Accordion title="API-Schlüssel wurden nicht importiert">
    Das interaktive `openclaw migrate` importiert API-Schlüssel nur, wenn Sie die Abfrage zu Anmeldedaten akzeptieren. Nicht interaktive Läufe mit `--yes` erfordern `--include-secrets`; Onboarding-Importe erfordern `--import-secrets`. Nur die [unterstützten `.env`-Schlüssel](/de/cli/migrate#supported-env-keys) werden erkannt; andere Variablen in `.env` werden ignoriert.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Formen.
- [Onboarding](/de/cli/onboard): Assistentenablauf und nicht interaktive Flags.
- [Migration](/de/install/migrating): eine OpenClaw-Installation zwischen Maschinen verschieben.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach der Migration.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): wo `SOUL.md`, `AGENTS.md` und Speicherdateien liegen.
