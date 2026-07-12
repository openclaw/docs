---
read_when:
    - Erneutes Auflösen von Geheimnisreferenzen zur Laufzeit
    - Prüfung auf Klartextreste und nicht aufgelöste Referenzen
    - SecretRefs konfigurieren und unidirektionale Bereinigungsänderungen anwenden
summary: CLI-Referenz für `openclaw secrets` (neu laden, prüfen, konfigurieren, anwenden)
title: Geheimnisse
x-i18n:
    generated_at: "2026-07-12T01:30:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Verwalten Sie SecretRefs und halten Sie den aktiven Laufzeit-Snapshot intakt.

| Befehl      | Funktion                                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway-RPC (`secrets.reload`): Löst Referenzen erneut auf und ersetzt den Laufzeit-Snapshot nur bei vollständigem Erfolg (keine Konfigurationsänderungen)                                                |
| `audit`     | Schreibgeschützte Prüfung von Konfigurations-, Authentifizierungs- und generierten Modellspeichern sowie veralteten Rückständen auf Klartext, nicht aufgelöste Referenzen und Prioritätsabweichungen (`exec`-Referenzen werden ohne `--allow-exec` übersprungen) |
| `configure` | Interaktiver Planungsassistent für die Provider-Einrichtung, Zielzuordnung und Vorabprüfung (erfordert ein TTY)                                                                                           |
| `apply`     | Führt einen gespeicherten Plan aus (`--dry-run` validiert nur und überspringt standardmäßig `exec`-Prüfungen; der Schreibmodus lehnt Pläne mit `exec` ohne `--allow-exec` ab) und bereinigt anschließend gezielt Klartextrückstände |

Empfohlener Betriebsablauf:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Wenn Ihr Plan `exec`-SecretRefs oder -Provider enthält, übergeben Sie `--allow-exec` sowohl beim Probelauf als auch beim schreibenden `apply`-Befehl.

Exitcodes für CI und Prüfschranken:

- `audit --check` gibt bei Befunden `1` zurück.
- Nicht aufgelöste Referenzen geben `2` zurück (unabhängig von `--check`).

Verwandte Themen: [Secret-Verwaltung](/de/gateway/secrets) · [Anmeldedatenoberfläche für SecretRef](/de/reference/secretref-credential-surface) · [Sicherheit](/de/gateway/security)

## Laufzeit-Snapshot neu laden

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Verwendet die Gateway-RPC-Methode `secrets.reload`. Wenn die Auflösung fehlschlägt, behält das Gateway seinen letzten als funktionsfähig bekannten Snapshot bei und gibt einen Fehler zurück (keine teilweise Aktivierung). Die JSON-Antwort enthält `warningCount`.

Optionen: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Prüfung

Prüft den OpenClaw-Zustand auf:

- Speicherung von Secrets im Klartext
- nicht aufgelöste Referenzen
- Prioritätsabweichungen (`auth-profiles.json`-Anmeldedaten, die Referenzen aus `openclaw.json` überlagern)
- Rückstände in generierten `agents/*/agent/models.json`-Dateien (`apiKey`-Werte von Providern und vertrauliche Provider-Header)
- veraltete Rückstände (Einträge im veralteten Authentifizierungsspeicher, OAuth-Hinweise)

Die Erkennung vertraulicher Provider-Header basiert auf einer Heuristik für Namen: Sie kennzeichnet Header, deren Name mit gängigen Bestandteilen für Authentifizierung oder Anmeldedaten übereinstimmt (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Berichtsstruktur:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- Befundcodes: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Konfigurieren (interaktiver Assistent)

Erstellen Sie Änderungen an Providern und SecretRefs interaktiv, führen Sie die Vorabprüfung aus und wenden Sie sie optional an:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Ablauf: zuerst die Provider-Einrichtung (Aliasse unter `secrets.providers` hinzufügen, bearbeiten oder entfernen), dann die Zuordnung von Anmeldedaten (Felder auswählen und Referenzen der Form `{source, provider, id}` zuweisen), anschließend die Vorabprüfung und optionale Anwendung.

Flags:

- `--providers-only`: Nur `secrets.providers` konfigurieren und die Zuordnung von Anmeldedaten überspringen
- `--skip-provider-setup`: Provider-Einrichtung überspringen und Anmeldedaten vorhandenen Providern zuordnen
- `--agent <id>`: Zielermittlung und Schreibvorgänge für `auth-profiles.json` auf den Speicher eines Agents beschränken
- `--allow-exec`: Prüfungen von `exec`-SecretRefs während der Vorabprüfung und Anwendung zulassen (kann Provider-Befehle ausführen)

`--providers-only` und `--skip-provider-setup` können nicht kombiniert werden.

Hinweise:

- Erfordert ein interaktives TTY.
- Verarbeitet Felder mit Secrets in `openclaw.json` sowie `auth-profiles.json` für den ausgewählten Agent-Geltungsbereich; kanonische unterstützte Oberfläche: [Anmeldedatenoberfläche für SecretRef](/de/reference/secretref-credential-surface).
- Unterstützt das direkte Erstellen neuer Zuordnungen in `auth-profiles.json` innerhalb des Auswahlablaufs.
- Führt vor der Anwendung eine Vorabprüfung der Auflösung aus.
- Bei generierten Plänen sind die Bereinigungsoptionen standardmäßig aktiviert (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Die Anwendung kann für bereinigte Klartextwerte nicht rückgängig gemacht werden.
- Ohne `--apply` fragt die CLI nach der Vorabprüfung dennoch `Apply this plan now?` ab.
- Mit `--apply` (und ohne `--yes`) fordert die CLI eine zusätzliche Bestätigung für die unumkehrbare Migration an.
- `--json` gibt den Plan und den Bericht der Vorabprüfung aus, erfordert aber weiterhin ein interaktives TTY.

### Sicherheit von Exec-Providern

Homebrew-Installationen stellen häufig über symbolische Verknüpfungen eingebundene Binärdateien unter `/opt/homebrew/bin/*` bereit. Setzen Sie `allowSymlinkCommand: true` nur dann, wenn dies für vertrauenswürdige Paketmanagerpfade erforderlich ist, und verwenden Sie zusätzlich `trustedDirs` (beispielsweise `["/opt/homebrew"]`). Wenn unter Windows die ACL-Prüfung für einen Provider-Pfad nicht verfügbar ist, verweigert OpenClaw den Vorgang standardmäßig. Setzen Sie ausschließlich für vertrauenswürdige Pfade bei diesem Provider `allowInsecurePath: true`, um die Pfadsicherheitsprüfung zu umgehen.

## Gespeicherten Plan anwenden

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` validiert die Vorabprüfung, ohne Dateien zu schreiben; Prüfungen von `exec`-SecretRefs werden bei einem Probelauf standardmäßig übersprungen. Der Schreibmodus lehnt Pläne mit `exec`-SecretRefs oder -Providern ohne `--allow-exec` ab. Verwenden Sie `--allow-exec`, um Prüfungen und die Ausführung von Exec-Providern in beiden Modi ausdrücklich zuzulassen.

Was `apply` aktualisieren kann:

- `openclaw.json` (SecretRef-Ziele sowie Einfügen/Aktualisieren und Löschen von Providern)
- `auth-profiles.json` (Bereinigung für Provider-Ziele)
- veraltete Rückstände in `auth.json`
- bekannte Secret-Schlüssel in `~/.openclaw/.env`, deren Werte migriert wurden

Details zum Planvertrag (zulässige Zielpfade, Validierungsregeln, Fehlersemantik): [Vertrag für Pläne zur Anwendung von Secrets](/de/gateway/secrets-plan-contract).

### Warum es keine Backups für das Zurücksetzen gibt

`secrets apply` erstellt bewusst keine Backups für das Zurücksetzen, die alte Klartextwerte enthalten. Die Sicherheit ergibt sich aus der strengen Vorabprüfung und einer weitgehend atomaren Anwendung mit einer bestmöglichen Wiederherstellung im Arbeitsspeicher bei einem Fehler.

## Beispiel

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Wenn `audit --check` weiterhin Klartextbefunde meldet, aktualisieren Sie die verbleibenden gemeldeten Zielpfade und führen Sie die Prüfung erneut aus.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Secret-Verwaltung](/de/gateway/secrets)
- [Vault-SecretRefs](/plugins/vault)
