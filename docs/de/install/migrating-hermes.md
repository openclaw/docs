---
read_when:
    - Sie wechseln von Hermes und möchten Ihre Modellkonfiguration, Prompts, Ihren Speicher und Ihre Skills beibehalten
    - Sie möchten wissen, was OpenClaw automatisch importiert und was ausschließlich im Archiv verbleibt
    - Sie benötigen einen sauberen, skriptgesteuerten Migrationspfad (CI, neuer Laptop, Automatisierung)
summary: Wechseln Sie von Hermes zu OpenClaw mit einem vorab angezeigten, rückgängig zu machenden Import
title: Migration von Hermes
x-i18n:
    generated_at: "2026-07-12T15:27:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Der mitgelieferte Hermes-Migrations-Provider erkennt den Zustand unter `~/.hermes`, zeigt vor der Anwendung eine Vorschau jeder Änderung an, schwärzt Geheimnisse in Plänen und Berichten und erstellt eine verifizierte OpenClaw-Sicherung, bevor er Änderungen vornimmt.

<Note>
Importe erfordern eine neue OpenClaw-Einrichtung. Wenn bereits lokaler OpenClaw-Zustand vorhanden ist, setzen Sie zuerst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, oder verwenden Sie nach Prüfung des Plans direkt `openclaw migrate apply hermes` mit `--overwrite`.
</Note>

## Zwei Importmöglichkeiten

<Tabs>
  <Tab title="Einrichtungsassistent">
    Erkennt Hermes unter `~/.hermes` und zeigt vor der Anwendung eine Vorschau an.

    ```bash
    openclaw onboard --flow import
    ```

    Oder geben Sie eine bestimmte Quelle an:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Verwenden Sie `openclaw migrate` für skriptgesteuerte oder wiederholbare Ausführungen. Die vollständige Referenz finden Sie unter [`openclaw migrate`](/de/cli/migrate).

    ```bash
    openclaw migrate hermes --dry-run    # nur Vorschau
    openclaw migrate apply hermes --yes  # anwenden, ohne Bestätigung abzufragen
    ```

    Fügen Sie `--from <path>` hinzu, wenn sich Hermes außerhalb von `~/.hermes` befindet.

  </Tab>
</Tabs>

## Was importiert wird

<AccordionGroup>
  <Accordion title="Modellkonfiguration">
    - Standardmodellauswahl aus der Hermes-Datei `config.yaml`.
    - Konfigurierte Modell-Provider und benutzerdefinierte OpenAI-kompatible Endpunkte aus `providers` und `custom_providers`.

  </Accordion>
  <Accordion title="MCP-Server">
    MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`.
  </Accordion>
  <Accordion title="Arbeitsbereichsdateien">
    - `SOUL.md` und `AGENTS.md` werden in den OpenClaw-Agentenarbeitsbereich kopiert.
    - `memories/MEMORY.md` und `memories/USER.md` werden an die entsprechenden OpenClaw-Speicherdateien **angehängt**, statt sie zu überschreiben.

  </Accordion>
  <Accordion title="Speicherkonfiguration">
    Standardwerte der Speicherkonfiguration für den OpenClaw-Dateispeicher. Externe Speicher-Provider wie Honcho werden als Archiv- oder Einträge zur manuellen Prüfung erfasst, damit Sie sie gezielt übertragen können.
  </Accordion>
  <Accordion title="Skills">
    Skills mit einer `SKILL.md`-Datei unter `skills/<name>/` werden zusammen mit den Skill-spezifischen Konfigurationswerten aus `skills.config` kopiert.
  </Accordion>
  <Accordion title="Authentifizierungsdaten">
    Das interaktive `openclaw migrate` fragt vor dem Import von Authentifizierungsdaten nach, wobei „Ja“ standardmäßig ausgewählt ist. Bei Zustimmung werden OpenCode-OpenAI-OAuth- und GitHub-Copilot-Einträge aus der OpenCode-Datei `auth.json` sowie die [unterstützten Hermes-`.env`-Schlüssel](/de/cli/migrate#supported-env-keys) importiert. Die OAuth-Einträge in Hermes’ eigener Datei `auth.json` sind veralteter Zustand: Sie werden als Eintrag für eine manuelle erneute Authentifizierung oder Doctor-Prüfung aufgeführt, statt in die aktive Authentifizierung importiert zu werden. Verwenden Sie `--include-secrets`, um Anmeldedaten bei einer nicht interaktiven Ausführung zu importieren, `--no-auth-credentials`, um den Import von Anmeldedaten vollständig zu überspringen, oder das Flag `--import-secrets` des Einrichtungsassistenten.
  </Accordion>
</AccordionGroup>

## Was ausschließlich archiviert wird

Der Provider kopiert Folgendes zur manuellen Prüfung in das Verzeichnis des Migrationsberichts, lädt es jedoch **nicht** in die aktive OpenClaw-Konfiguration oder die Anmeldedaten:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw lehnt es ab, diesen Zustand automatisch auszuführen oder ihm zu vertrauen, da Formate und Vertrauensannahmen zwischen Systemen voneinander abweichen können. Übertragen Sie nach Prüfung des Archivs die benötigten Elemente manuell.

## Empfohlener Ablauf

<Steps>
  <Step title="Vorschau des Plans anzeigen">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Der Plan führt alle geplanten Änderungen auf, einschließlich Konflikten, übersprungenen Elementen und vertraulichen Elementen. Verschachtelte Schlüssel, die wie Geheimnisse aussehen, werden in der Ausgabe geschwärzt.

  </Step>
  <Step title="Mit Sicherung anwenden">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw erstellt und verifiziert vor der Anwendung eine Sicherung. Dieses nicht interaktive Beispiel importiert ausschließlich nicht geheimen Zustand. Führen Sie den Befehl ohne `--yes` aus, um die Abfrage der Anmeldedaten interaktiv zu beantworten, oder fügen Sie `--include-secrets` hinzu, um unterstützte Anmeldedaten bei einer unbeaufsichtigten Ausführung einzubeziehen.

  </Step>
  <Step title="Doctor ausführen">
    ```bash
    openclaw doctor
    ```

    [Doctor](/de/gateway/doctor) wendet alle ausstehenden Konfigurationsmigrationen erneut an und prüft auf Probleme, die während des Imports entstanden sind.

  </Step>
  <Step title="Neu starten und überprüfen">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Vergewissern Sie sich, dass das Gateway fehlerfrei arbeitet und das importierte Modell, der Speicher und die Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Die Anwendung wird nicht fortgesetzt, wenn der Plan Konflikte meldet (eine Datei oder ein Konfigurationswert ist am Ziel bereits vorhanden).

<Warning>
Führen Sie den Vorgang nur dann erneut mit `--overwrite` aus, wenn das vorhandene Ziel absichtlich ersetzt werden soll. Provider können für überschriebene Dateien weiterhin Sicherungen auf Elementebene im Verzeichnis des Migrationsberichts erstellen.
</Warning>

Bei einer neuen Installation sind Konflikte ungewöhnlich. Sie treten typischerweise auf, wenn Sie den Import für eine Einrichtung erneut ausführen, die bereits Benutzeränderungen enthält.

Wenn während der Anwendung ein Konflikt auftritt (beispielsweise ein unerwarteter Wettlauf um eine Konfigurationsdatei), kennzeichnet Hermes die verbleibenden abhängigen Konfigurationselemente als `skipped` mit dem Grund `blocked by earlier apply conflict`, statt sie teilweise zu schreiben. Der Migrationsbericht erfasst jedes blockierte Element, damit Sie den ursprünglichen Konflikt beheben und den Import erneut ausführen können.

## Geheimnisse

Das interaktive `openclaw migrate` fragt, ob erkannte Authentifizierungsdaten importiert werden sollen, wobei „Ja“ standardmäßig ausgewählt ist.

- Bei Zustimmung werden OpenCode-OpenAI-OAuth- und GitHub-Copilot-Einträge aus der OpenCode-Datei `auth.json` sowie die [unterstützten `.env`-Schlüssel](/de/cli/migrate#supported-env-keys) importiert. Die OAuth-Einträge in Hermes’ eigener Datei `auth.json` werden stattdessen für eine manuelle erneute OpenAI-Authentifizierung oder eine Reparatur durch Doctor gemeldet.
- Verwenden Sie `--no-auth-credentials` oder antworten Sie bei der Abfrage mit „Nein“, um ausschließlich nicht geheimen Zustand zu importieren.
- Verwenden Sie `--include-secrets`, um Anmeldedaten bei einer unbeaufsichtigten Ausführung mit `--yes` zu importieren.
- Verwenden Sie das Flag `--import-secrets` des Einrichtungsassistenten, um Anmeldedaten über den Assistenten zu importieren.

## JSON-Ausgabe für die Automatisierung

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Mit `--json` und ohne `--yes` gibt die Anwendung den Plan aus und verändert den Zustand nicht – der sicherste Modus für CI und gemeinsam verwendete Skripte.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Anwendung wird aufgrund von Konflikten verweigert">
    Prüfen Sie die Planausgabe. Jeder Konflikt nennt den Quellpfad und das vorhandene Ziel. Entscheiden Sie für jedes Element, ob es übersprungen, das Ziel bearbeitet oder der Vorgang mit `--overwrite` erneut ausgeführt werden soll.
  </Accordion>
  <Accordion title="Hermes befindet sich außerhalb von ~/.hermes">
    Übergeben Sie `--from /actual/path` (CLI) oder `--import-source /actual/path` (Einrichtung).
  </Accordion>
  <Accordion title="Die Einrichtung verweigert den Import in eine vorhandene Installation">
    Importe über die Einrichtung erfordern eine neue Installation. Setzen Sie entweder den Zustand zurück und führen Sie die Einrichtung erneut durch oder verwenden Sie direkt `openclaw migrate apply hermes`, das `--overwrite` und eine explizite Steuerung der Sicherung unterstützt.
  </Accordion>
  <Accordion title="API-Schlüssel wurden nicht importiert">
    Das interaktive `openclaw migrate` importiert API-Schlüssel nur, wenn Sie der Abfrage der Anmeldedaten zustimmen. Nicht interaktive Ausführungen mit `--yes` benötigen `--include-secrets`; Importe über die Einrichtung benötigen `--import-secrets`. Nur die [unterstützten `.env`-Schlüssel](/de/cli/migrate#supported-env-keys) werden erkannt – andere `.env`-Variablen werden ignoriert.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Strukturen.
- [Einrichtung](/de/cli/onboard): Assistentenablauf und Flags für die nicht interaktive Verwendung.
- [Migration](/de/install/migrating): eine OpenClaw-Installation zwischen Rechnern übertragen.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach der Migration.
- [Agentenarbeitsbereich](/de/concepts/agent-workspace): Speicherort von `SOUL.md`, `AGENTS.md` und Speicherdateien.
