---
read_when:
    - Sie ziehen OpenClaw auf einen neuen Laptop oder Server um
    - Sie kommen von einem anderen Agentensystem und möchten den Zustand beibehalten
    - Sie aktualisieren ein Plugin direkt am bestehenden Ort
summary: 'Migrationszentrale: systemübergreifende Importe, Umzüge von Maschine zu Maschine und Plugin-Upgrades'
title: Migrationsleitfaden
x-i18n:
    generated_at: "2026-05-02T06:38:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw unterstützt drei Migrationspfade: den Import aus einem anderen Agentensystem, den Umzug einer bestehenden Installation auf einen neuen Rechner und das direkte Upgrade eines Plugins.

## Import aus einem anderen Agentensystem

Verwenden Sie die mitgelieferten Migrations-Provider, um Anweisungen, MCP-Server, Skills, Modellkonfiguration und optional API-Schlüssel in OpenClaw zu übernehmen. Pläne werden vor jeder Änderung in der Vorschau angezeigt, Geheimnisse werden in Berichten redigiert, und die Anwendung wird durch ein verifiziertes Backup abgesichert.

<CardGroup cols={2}>
  <Card title="Migration von Claude" href="/de/install/migrating-claude" icon="brain">
    Importieren Sie den Zustand von Claude Code und Claude Desktop, einschließlich `CLAUDE.md`, MCP-Servern, Skills und Projektbefehlen.
  </Card>
  <Card title="Migration von Hermes" href="/de/install/migrating-hermes" icon="feather">
    Importieren Sie Hermes-Konfiguration, Provider, MCP-Server, Speicher, Skills und unterstützte `.env`-Schlüssel.
  </Card>
</CardGroup>

Der CLI-Einstiegspunkt ist [`openclaw migrate`](/de/cli/migrate). Das Onboarding kann ebenfalls eine Migration anbieten, wenn es eine bekannte Quelle erkennt (`openclaw onboard --flow import`).

## OpenClaw auf einen neuen Rechner umziehen

Kopieren Sie das **Zustandsverzeichnis** (standardmäßig `~/.openclaw/`) und Ihren **Arbeitsbereich**, um Folgendes zu erhalten:

- **Konfiguration** — `openclaw.json` und alle Gateway-Einstellungen.
- **Authentifizierung** — agentenspezifische `auth-profiles.json` (API-Schlüssel plus OAuth) sowie beliebiger Channel- oder Provider-Zustand unter `credentials/`.
- **Sitzungen** — Konversationsverlauf und Agentenzustand.
- **Channel-Zustand** — WhatsApp-Anmeldung, Telegram-Sitzung und Ähnliches.
- **Arbeitsbereichsdateien** — `MEMORY.md`, `USER.md`, Skills und Prompts.

<Tip>
Führen Sie `openclaw status` auf dem alten Rechner aus, um den Pfad Ihres Zustandsverzeichnisses zu bestätigen. Benutzerdefinierte Profile verwenden `~/.openclaw-<profile>/` oder einen über `OPENCLAW_STATE_DIR` festgelegten Pfad.
</Tip>

### Migrationsschritte

<Steps>
  <Step title="Gateway stoppen und Backup erstellen">
    Stoppen Sie auf dem **alten** Rechner das Gateway, damit sich Dateien während des Kopierens nicht ändern, und archivieren Sie anschließend:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Wenn Sie mehrere Profile verwenden (zum Beispiel `~/.openclaw-work`), archivieren Sie jedes separat.

  </Step>

  <Step title="OpenClaw auf dem neuen Rechner installieren">
    [Installieren](/de/install) Sie die CLI (und Node, falls erforderlich) auf dem neuen Rechner. Es ist in Ordnung, wenn das Onboarding ein frisches `~/.openclaw/` erstellt. Sie überschreiben es im nächsten Schritt.
  </Step>

  <Step title="Zustandsverzeichnis und Arbeitsbereich kopieren">
    Übertragen Sie das Archiv per `scp`, `rsync -a` oder über ein externes Laufwerk und extrahieren Sie es dann:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Stellen Sie sicher, dass versteckte Verzeichnisse enthalten waren und der Dateibesitz dem Benutzer entspricht, der das Gateway ausführen wird.

  </Step>

  <Step title="Doctor ausführen und überprüfen">
    Führen Sie auf dem neuen Rechner [Doctor](/de/gateway/doctor) aus, um Konfigurationsmigrationen anzuwenden und Dienste zu reparieren:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Wenn Telegram oder Discord den standardmäßigen Env-Fallback (`TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN`) verwendet, verifizieren Sie, dass die migrierte `.env` im Zustandsverzeichnis diese Schlüssel enthält, ohne die geheimen Werte auszugeben:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` warnt außerdem, wenn ein aktiviertes Standardkonto für Telegram oder Discord kein konfiguriertes Token hat und die passende Umgebungsvariable für den Doctor-Prozess nicht verfügbar ist.

### Häufige Fallstricke

<AccordionGroup>
  <Accordion title="Profil- oder Zustandsverzeichnis stimmt nicht überein">
    Wenn das alte Gateway `--profile` oder `OPENCLAW_STATE_DIR` verwendet hat und das neue nicht, erscheinen Channels als abgemeldet und Sitzungen sind leer. Starten Sie das Gateway mit demselben Profil oder Zustandsverzeichnis, das Sie migriert haben, und führen Sie dann erneut `openclaw doctor` aus.
  </Accordion>

  <Accordion title="Nur openclaw.json kopieren">
    Die Konfigurationsdatei allein reicht nicht aus. Modell-Authentifizierungsprofile liegen unter `agents/<agentId>/agent/auth-profiles.json`, und Channel- sowie Provider-Zustand liegt unter `credentials/`. Migrieren Sie immer das **gesamte** Zustandsverzeichnis.
  </Accordion>

  <Accordion title="Berechtigungen und Besitz">
    Wenn Sie als root kopiert oder den Benutzer gewechselt haben, kann das Gateway möglicherweise keine Zugangsdaten lesen. Stellen Sie sicher, dass das Zustandsverzeichnis und der Arbeitsbereich dem Benutzer gehören, der das Gateway ausführt.
  </Accordion>

  <Accordion title="Remote-Modus">
    Wenn Ihre UI auf ein **entferntes** Gateway zeigt, besitzt der entfernte Host Sitzungen und Arbeitsbereich. Migrieren Sie den Gateway-Host selbst, nicht Ihren lokalen Laptop. Siehe [FAQ](/de/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Geheimnisse in Backups">
    Das Zustandsverzeichnis enthält Authentifizierungsprofile, Channel-Zugangsdaten und anderen Provider-Zustand. Speichern Sie Backups verschlüsselt, vermeiden Sie unsichere Übertragungskanäle und rotieren Sie Schlüssel, wenn Sie eine Offenlegung vermuten.
  </Accordion>
</AccordionGroup>

### Prüfliste zur Verifizierung

Bestätigen Sie auf dem neuen Rechner:

- [ ] `openclaw status` zeigt, dass das Gateway läuft.
- [ ] Channels sind weiterhin verbunden (keine erneute Kopplung erforderlich).
- [ ] Das Dashboard öffnet sich und zeigt bestehende Sitzungen.
- [ ] Arbeitsbereichsdateien (Speicher, Konfigurationen) sind vorhanden.

## Plugin direkt upgraden

Direkte Plugin-Upgrades behalten dieselbe Plugin-ID und dieselben Konfigurationsschlüssel bei, können aber den Zustand auf dem Datenträger in das aktuelle Layout verschieben. Plugin-spezifische Upgrade-Anleitungen befinden sich neben ihren Channels:

- [Matrix-Migration](/de/channels/matrix-migration): Grenzen der Wiederherstellung verschlüsselten Zustands, automatisches Snapshot-Verhalten und manuelle Wiederherstellungsbefehle.

## Verwandte Themen

- [`openclaw migrate`](/de/cli/migrate): CLI-Referenz für systemübergreifende Importe.
- [Installationsübersicht](/de/install): alle Installationsmethoden.
- [Doctor](/de/gateway/doctor): Integritätsprüfung nach der Migration.
- [Deinstallation](/de/install/uninstall): OpenClaw sauber entfernen.
