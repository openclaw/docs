---
read_when:
    - Sie wechseln von Hermes und möchten Ihre Modellkonfiguration, Prompts, Ihren Speicher und Ihre Skills beibehalten
    - Sie möchten wissen, was OpenClaw automatisch importiert und was ausschließlich im Archiv verbleibt.
    - Sie benötigen einen sauberen, skriptgesteuerten Migrationspfad (CI, neuer Laptop, Automatisierung)
summary: Mit einem vorab geprüften, reversiblen Import von Hermes zu OpenClaw wechseln
title: Migration von Hermes
x-i18n:
    generated_at: "2026-07-24T04:38:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f8cdb7a77cfb8ecb0504ccc322b5600c6ed671a8bf9ac866d964fdf4b3494000
    source_path: install/migrating-hermes.md
    workflow: 16
---

Der mitgelieferte Hermes-Migrations-Provider folgt `HERMES_HOME` und dem aktiven Hermes-Profil; als Fallback verwendet er unter macOS/Linux `~/.hermes` oder unter Windows `%LOCALAPPDATA%\hermes`. Er zeigt vor der Anwendung eine Vorschau jeder Änderung an und schwärzt Geheimnisse in Plänen und Berichten. Das eigenständige `openclaw migrate` erstellt eine verifizierte Sicherung; beim neuen Onboarding-Ablauf werden Konfiguration, Anmeldedaten und Dateien zunächst bereitgestellt und erst veröffentlicht, nachdem die importierte Inferenz verifiziert wurde. Ein expliziter `--from`-Pfad hat immer Vorrang.

<Note>
Importe erfordern eine neue OpenClaw-Einrichtung. Wenn bereits lokaler OpenClaw-Status vorhanden ist, setzen Sie zunächst Konfiguration, Anmeldedaten, Sitzungen und den Arbeitsbereich zurück, oder verwenden Sie nach Prüfung des Plans `openclaw migrate apply hermes` direkt mit `--overwrite`.
</Note>

## Zwei Importmöglichkeiten

<Tabs>
  <Tab title="Onboarding-Assistent">
    Erkennt das aktive Hermes-Basisverzeichnis/-Profil und zeigt vor der Anwendung eine Vorschau an.

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
    openclaw migrate apply hermes --yes  # anwenden und Bestätigung überspringen
    ```

    Fügen Sie `--from <path>` hinzu, um die Erkennung des Hermes-Basisverzeichnisses/-Profils zu überschreiben.

  </Tab>
</Tabs>

## Was importiert wird

<AccordionGroup>
  <Accordion title="Modellkonfiguration">
    - Standardmodellauswahl aus Hermes `config.yaml`.
    - Konfigurierte Modell-Provider und benutzerdefinierte Endpunkte aus `model`, `providers` und `custom_providers`, einschließlich der aktuellen Hermes-Transporte für Chat Completions, Codex Responses und Anthropic Messages.

  </Accordion>
  <Accordion title="MCP-Server">
    MCP-Serverdefinitionen aus `mcp_servers` oder `mcp.servers`, einschließlich deaktiviertem Status, Zeitüberschreitungen, Unterstützung paralleler Tools, OAuth-Berechtigungsumfang, kompatiblen TLS-Feldern und Richtlinien für native Tools, Ressourcen-Tools und Prompt-Tools. Literale Umgebungsvariablen und Header erfordern die Zustimmung zum Import von Anmeldedaten. Hermes-spezifische Einstellungen für Lebenszyklus, Sampling, Elicitation, Vorabprüfung, Keepalive, CA-Bundle, passwortgeschützte Client-Schlüssel und vorregistrierte OAuth-Clients werden zu Elementen für die manuelle Prüfung, statt zu ungültiger OpenClaw-Konfiguration.
  </Accordion>
  <Accordion title="Arbeitsbereichsdateien">
    - `SOUL.md` und `AGENTS.md` werden in den OpenClaw-Agentenarbeitsbereich kopiert.
    - `memories/MEMORY.md` und `memories/USER.md` werden an die entsprechenden OpenClaw-Speicherdateien **angehängt**, statt sie zu überschreiben.
    - Reine Speicheroberflächen verhalten sich anders: Die Speicherseite des Onboardings und die Speicherimportseite der Control UI kopieren diese beiden Dateien für den indizierten Abruf unter `memory/imports/hermes/` und lassen den vorhandenen Arbeitsbereichsspeicher unverändert.

  </Accordion>
  <Accordion title="Speicherkonfiguration">
    Standardwerte der Speicherkonfiguration für den OpenClaw-Dateispeicher. Externe Speicher-Provider wie Honcho werden als Archiv- oder manuell zu prüfende Elemente erfasst, damit sie bewusst verschoben werden können.
  </Accordion>
  <Accordion title="Skills">
    Skills mit einer `SKILL.md`-Datei an einer beliebigen Stelle unter `skills/` werden rekursiv erkannt, in das Skill-Verzeichnis des OpenClaw-Arbeitsbereichs überführt und zusammen mit ihren unterstützenden Dateien kopiert. Skill-spezifische Konfigurationswerte aus `skills.config` bleiben erhalten.
  </Accordion>
  <Accordion title="Authentifizierungsdaten">
    Das interaktive `openclaw migrate` fragt vor dem Import von Authentifizierungsdaten nach, wobei „Ja“ standardmäßig ausgewählt ist. Akzeptierte Importe umfassen aktuelle Hermes-Einträge für OpenAI Codex OAuth, OpenCode-Einträge für OpenAI OAuth und GitHub Copilot sowie die [unterstützten Hermes-Schlüssel `.env`](/de/cli/migrate#supported-env-keys). Verwenden Sie `--include-secrets` für einen nicht interaktiven Import, `--no-auth-credentials` zum Überspringen der Anmeldedaten oder das Onboarding-Flag `--import-secrets`. Lassen Sie Hermes und OpenClaw nach dem Import von Hermes OAuth nicht dieselbe Aktualisierungsberechtigung verwenden; authentifizieren Sie eine Seite erneut, bevor Sie beide gleichzeitig ausführen.
  </Accordion>
</AccordionGroup>

## Was ausschließlich archiviert wird

Der Provider kopiert Folgendes zur manuellen Prüfung in das Verzeichnis des Migrationsberichts, lädt es jedoch **nicht** in die aktive OpenClaw-Konfiguration oder die Anmeldedaten:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `plans/`, `workspace/`, `skins/` und `kanban/`
- `pairing/`- und `platforms/`-Speicher sowie Gateway-Routing- und Prozessstatus
- `state.db`, `hermes_state.db`, `projects.db`, `response_store.db`, `memory_store.db`, `verification_evidence.db`, `kanban.db` und `retaindb_queue.db`

OpenClaw weigert sich, diesen Status automatisch auszuführen oder ihm zu vertrauen, da Formate und Vertrauensannahmen zwischen Systemen auseinanderlaufen können. Verschieben Sie nach Prüfung des Archivs manuell, was benötigt wird.

## Empfohlener Ablauf

<Steps>
  <Step title="Vorschau des Plans anzeigen">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Der Plan führt alle Änderungen auf, einschließlich Konflikten, übersprungenen Elementen und vertraulichen Elementen. Verschachtelte Schlüssel, die wie Geheimnisse aussehen, werden in der Ausgabe geschwärzt.

  </Step>
  <Step title="Mit Sicherung anwenden">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw erstellt und verifiziert vor der Anwendung eine Sicherung. Dieses nicht interaktive Beispiel importiert nur nicht geheime Zustandsdaten. Führen Sie den Befehl ohne `--yes` aus, um die Abfrage zu den Anmeldedaten interaktiv zu beantworten, oder fügen Sie `--include-secrets` hinzu, um unterstützte Anmeldedaten bei einer unbeaufsichtigten Ausführung einzubeziehen.

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

    Vergewissern Sie sich, dass das Gateway fehlerfrei funktioniert und das importierte Modell, der Speicher und die Skills geladen sind.

  </Step>
</Steps>

## Konfliktbehandlung

Die Anwendung wird nicht fortgesetzt, wenn der Plan Konflikte meldet (eine Datei oder ein Konfigurationswert ist am Ziel bereits vorhanden).

<Warning>
Führen Sie den Vorgang nur dann erneut mit `--overwrite` aus, wenn das vorhandene Ziel absichtlich ersetzt werden soll. Provider können weiterhin Sicherungen einzelner überschriebener Dateien im Verzeichnis des Migrationsberichts erstellen.
</Warning>

Bei einer neuen Installation sind Konflikte ungewöhnlich. Sie treten typischerweise auf, wenn Sie den Import für eine Einrichtung erneut ausführen, die bereits Benutzeränderungen enthält.

Wenn während der Anwendung ein Konflikt auftritt (beispielsweise ein unerwarteter Wettlauf bei einer Konfigurationsdatei), wird dieses Element als Konflikt gemeldet, während unabhängige Dateien, Skills, Anmeldedaten, Archive und Konfigurationseinträge weiterverarbeitet werden. Beheben Sie das betroffene Element und führen Sie den Import erneut aus; identische Speicherimporte sind idempotent.

## Geheimnisse

Das interaktive `openclaw migrate` fragt, ob erkannte Authentifizierungsdaten importiert werden sollen, wobei „Ja“ standardmäßig ausgewählt ist.

- Bei Zustimmung werden aktuelle Hermes-Einträge für OpenAI Codex OAuth, OpenCode-Einträge für OpenAI OAuth und GitHub Copilot sowie die [unterstützten Schlüssel `.env`](/de/cli/migrate#supported-env-keys) importiert.
- Verwenden Sie `--no-auth-credentials` oder antworten Sie bei der Abfrage mit „Nein“, um nur nicht geheime Zustandsdaten zu importieren.
- Verwenden Sie `--include-secrets`, um Anmeldedaten bei einer unbeaufsichtigten `--yes`-Ausführung zu importieren.
- Verwenden Sie das Flag `--import-secrets` des Onboarding-Assistenten, um Anmeldedaten über den Assistenten zu importieren.

## JSON-Ausgabe für die Automatisierung

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Mit `--json` und ohne `--yes` gibt die Anwendung den Plan aus und verändert den Status nicht – dies ist der sicherste Modus für CI und gemeinsam genutzte Skripte.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Die Anwendung wird wegen Konflikten verweigert">
    Prüfen Sie die Planausgabe. Jeder Konflikt nennt den Quellpfad und das vorhandene Ziel. Entscheiden Sie für jedes Element, ob es übersprungen, das Ziel bearbeitet oder der Vorgang mit `--overwrite` erneut ausgeführt werden soll.
  </Accordion>
  <Accordion title="Hermes befindet sich außerhalb von ~/.hermes">
    Übergeben Sie `--from /actual/path` (CLI) oder `--import-source /actual/path` (Onboarding).
  </Accordion>
  <Accordion title="Onboarding verweigert den Import in eine vorhandene Einrichtung">
    Onboarding-Importe erfordern eine neue Einrichtung. Setzen Sie entweder den Status zurück und führen Sie das Onboarding erneut durch, oder verwenden Sie direkt `openclaw migrate apply hermes`, das `--overwrite` und eine explizite Sicherungssteuerung unterstützt.
  </Accordion>
  <Accordion title="API-Schlüssel wurden nicht importiert">
    Das interaktive `openclaw migrate` importiert API-Schlüssel nur, wenn Sie der Abfrage zu den Anmeldedaten zustimmen. Nicht interaktive `--yes`-Ausführungen benötigen `--include-secrets`; Onboarding-Importe benötigen `--import-secrets`. Nur die [unterstützten Schlüssel `.env`](/de/cli/migrate#supported-env-keys) werden erkannt – andere `.env`-Variablen werden ignoriert.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): vollständige CLI-Referenz, Plugin-Vertrag und JSON-Strukturen.
- [Onboarding](/de/cli/onboard): Assistentenablauf und nicht interaktive Flags.
- [Migration](/de/install/migrating): Verschieben einer OpenClaw-Installation zwischen Computern.
- [Doctor](/de/gateway/doctor): Systemzustandsprüfung nach der Migration.
- [Agentenarbeitsbereich](/de/concepts/agent-workspace): Speicherort von `SOUL.md`, `AGENTS.md` und Speicherdateien.
