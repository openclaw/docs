---
read_when:
    - Sie verschieben OpenClaw auf einen neuen Laptop oder Server
    - Sie wechseln von einem anderen Agentensystem und möchten den Zustand beibehalten
    - Sie aktualisieren ein vorhandenes Plugin direkt.
summary: 'Migrationszentrale: systemübergreifende Importe, Übertragungen zwischen Rechnern und Plugin-Upgrades'
title: Migrationsleitfaden
x-i18n:
    generated_at: "2026-07-24T05:02:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e9ceb80045ab082c9cfc9e1aca59e079b6bf28b1d047265a0be40c03ebe5dac6
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw unterstützt drei Migrationspfade: den Import aus einem anderen Agentensystem, das Verschieben einer bestehenden Installation auf einen neuen Rechner und das direkte Upgrade eines Plugins.

## Aus einem anderen Agentensystem importieren

Mitgelieferte Migrations-Provider übernehmen Anweisungen, MCP-Server, Skills, Modellkonfigurationen und (optional) API-Schlüssel in OpenClaw. Pläne werden vor jeder Änderung in einer Vorschau angezeigt, und Geheimnisse werden in Berichten unkenntlich gemacht. Die eigenständige Ausführung von `openclaw migrate` wird durch eine verifizierte Sicherung abgesichert; Importe während eines neuen Onboardings stellen lokale Artefakte dagegen zunächst bereit und verifizieren sie, bevor sie veröffentlicht werden, wobei die Konfiguration vor jeder unumkehrbaren externen Aktivierung festgeschrieben wird.

<CardGroup cols={2}>
  <Card title="Migration von Claude" href="/de/install/migrating-claude" icon="brain">
    Importieren Sie den Zustand von Claude Code und Claude Desktop, einschließlich `CLAUDE.md`, MCP-Servern, Skills und Projektbefehlen.
  </Card>
  <Card title="Migration von Hermes" href="/de/install/migrating-hermes" icon="feather">
    Importieren Sie die Hermes-Konfiguration, Provider, MCP-Server, den Speicher, Skills und unterstützte `.env`-Schlüssel.
  </Card>
</CardGroup>

Der CLI-Einstiegspunkt ist [`openclaw migrate`](/de/cli/migrate). Das Onboarding kann auch eine Migration anbieten, wenn es eine bekannte Quelle erkennt (`openclaw onboard --flow import`).

## OpenClaw auf einen neuen Rechner verschieben

Kopieren Sie das **Zustandsverzeichnis** (standardmäßig `~/.openclaw/`) und Ihren **Arbeitsbereich**, um Folgendes beizubehalten:

- **Konfiguration** — `openclaw.json` und alle Gateway-Einstellungen.
- **Authentifizierung** — agentenspezifische `auth-profiles.json` (API-Schlüssel sowie OAuth) und sämtliche Kanal- oder Provider-Zustände unter `credentials/`.
- **Sitzungen** — Gesprächsverlauf und Agentenzustand.
- **Kanalzustand** — WhatsApp-Anmeldung, Telegram-Sitzung und Ähnliches.
- **Arbeitsbereichsdateien** — `MEMORY.md`, `USER.md`, Skills und Prompts.

<Tip>
Führen Sie auf dem alten Rechner `openclaw status` aus, um den Pfad Ihres Zustandsverzeichnisses zu bestätigen. Benutzerdefinierte Profile verwenden `~/.openclaw-<profile>/` oder einen über `OPENCLAW_STATE_DIR` festgelegten Pfad.
</Tip>

### Migrationsschritte

<Steps>
  <Step title="Gateway stoppen und Sicherung erstellen">
    Stoppen Sie auf dem **alten** Rechner das Gateway, damit sich die Dateien während des Kopierens nicht ändern, und erstellen Sie anschließend ein Archiv:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Wenn Sie mehrere Profile verwenden (zum Beispiel `~/.openclaw-work`), archivieren Sie jedes separat.

  </Step>

  <Step title="OpenClaw auf dem neuen Rechner installieren">
    [Installieren](/de/install) Sie die CLI (und bei Bedarf Node) auf dem neuen Rechner. Es ist unproblematisch, wenn das Onboarding eine neue `~/.openclaw/` erstellt — diese wird im nächsten Schritt überschrieben.
  </Step>

  <Step title="Zustandsverzeichnis und Arbeitsbereich kopieren">
    Übertragen Sie das Archiv über `scp`, `rsync -a` oder ein externes Laufwerk und entpacken Sie es anschließend:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Vergewissern Sie sich, dass versteckte Verzeichnisse enthalten sind und die Dateieigentümerschaft dem Benutzer entspricht, der das Gateway ausführen wird.

  </Step>

  <Step title="Doctor ausführen und Installation überprüfen">
    Führen Sie auf dem neuen Rechner [Doctor](/de/gateway/doctor) aus, um Konfigurationsmigrationen anzuwenden und Dienste zu reparieren:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Wenn Telegram oder Discord den standardmäßigen Umgebungsvariablen-Fallback verwendet (`TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN`), prüfen Sie, ob die Datei `.env` im migrierten Zustandsverzeichnis diese Schlüssel enthält, ohne die geheimen Werte auszugeben:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` warnt außerdem, wenn für ein aktiviertes standardmäßiges Telegram- oder Discord-Konto kein Token konfiguriert ist und die entsprechende Umgebungsvariable für den Doctor-Prozess nicht verfügbar ist.

### Häufige Stolperfallen

<AccordionGroup>
  <Accordion title="Abweichendes Profil oder Zustandsverzeichnis">
    Wenn das alte Gateway `--profile` oder `OPENCLAW_STATE_DIR` verwendet hat, das neue jedoch nicht, erscheinen Kanäle als abgemeldet und Sitzungen sind leer. Starten Sie das Gateway mit demselben Profil beziehungsweise Zustandsverzeichnis, das Sie migriert haben, und führen Sie anschließend `openclaw doctor` erneut aus.
  </Accordion>

  <Accordion title="Nur openclaw.json kopieren">
    Die Konfigurationsdatei allein reicht nicht aus. Profile für die Modellauthentifizierung befinden sich unter `agents/<agentId>/agent/auth-profiles.json`, Kanal- und Provider-Zustände unter `credentials/`. Migrieren Sie immer das **gesamte** Zustandsverzeichnis.
  </Accordion>

  <Accordion title="Berechtigungen und Eigentümerschaft">
    Wenn Sie die Dateien als Root kopiert oder den Benutzer gewechselt haben, kann das Gateway möglicherweise nicht auf die Anmeldedaten zugreifen. Stellen Sie sicher, dass das Zustandsverzeichnis und der Arbeitsbereich dem Benutzer gehören, der das Gateway ausführt.
  </Accordion>

  <Accordion title="Remote-Modus">
    Wenn Ihre Benutzeroberfläche auf ein **entferntes** Gateway verweist, befinden sich die Sitzungen und der Arbeitsbereich auf dem entfernten Host. Migrieren Sie den Gateway-Host selbst, nicht Ihren lokalen Laptop. Siehe [FAQ](/de/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Geheimnisse in Sicherungen">
    Das Zustandsverzeichnis enthält Authentifizierungsprofile, Kanal-Anmeldedaten und weitere Provider-Zustände. Speichern Sie Sicherungen verschlüsselt, vermeiden Sie unsichere Übertragungskanäle und erneuern Sie Schlüssel, wenn Sie eine Offenlegung vermuten.
  </Accordion>
</AccordionGroup>

### Prüfliste zur Verifizierung

Prüfen Sie auf dem neuen Rechner Folgendes:

- [ ] `openclaw status` zeigt an, dass das Gateway ausgeführt wird.
- [ ] Die Kanäle sind weiterhin verbunden (keine erneute Kopplung erforderlich).
- [ ] Das Dashboard lässt sich öffnen und zeigt die vorhandenen Sitzungen an.
- [ ] Die Arbeitsbereichsdateien (Speicher, Konfigurationen) sind vorhanden.

## Ein Plugin direkt aktualisieren

Direkte Plugin-Upgrades behalten dieselbe Plugin-ID und dieselben Konfigurationsschlüssel bei, können jedoch den auf dem Datenträger gespeicherten Zustand in das aktuelle Layout verschieben. Pluginspezifische Upgrade-Anleitungen befinden sich bei den jeweiligen Kanälen:

- [Matrix-Migration](/de/channels/matrix-migration): Wiederherstellungsgrenzen für verschlüsselte Zustände, automatisches Snapshot-Verhalten und manuelle Wiederherstellungsbefehle.

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): CLI-Referenz für systemübergreifende Importe.
- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach der Migration.
- [Deinstallation](/de/install/uninstall): OpenClaw vollständig entfernen.
