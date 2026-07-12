---
read_when:
    - Erneutes Auflösen von Secret-Referenzen zur Laufzeit
    - Klartextreste und nicht aufgelöste Referenzen prüfen
    - SecretRefs konfigurieren und einseitige Bereinigungsänderungen anwenden
summary: CLI-Referenz für `openclaw secrets` (neu laden, prüfen, konfigurieren, anwenden)
title: Geheimnisse
x-i18n:
    generated_at: "2026-07-12T15:09:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Verwalten Sie SecretRefs und halten Sie den aktiven Laufzeit-Snapshot fehlerfrei.

| Befehl      | Funktion                                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway-RPC (`secrets.reload`): Löst Referenzen erneut auf und tauscht den Laufzeit-Snapshot nur bei vollständigem Erfolg aus (keine Konfigurationsänderungen)                                             |
| `audit`     | Schreibgeschützte Prüfung von Konfigurations-, Authentifizierungs- und generierten Modellspeichern sowie Legacy-Rückständen auf Klartext, nicht aufgelöste Referenzen und Abweichungen in der Priorität (Ausführungsreferenzen werden ohne `--allow-exec` übersprungen) |
| `configure` | Interaktiver Planer für die Provider-Einrichtung, Zielzuordnung und Vorabprüfung (erfordert ein TTY)                                                                                                      |
| `apply`     | Führt einen gespeicherten Plan aus (`--dry-run` validiert nur und überspringt standardmäßig Ausführungsprüfungen; der Schreibmodus lehnt Pläne mit Ausführungsanteilen ohne `--allow-exec` ab) und entfernt anschließend gezielt Klartext-Rückstände |

Empfohlener Ablauf für den Betrieb:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Wenn Ihr Plan `exec`-SecretRefs/-Provider enthält, übergeben Sie `--allow-exec` sowohl beim Probelauf als auch beim schreibenden `apply`-Befehl.

Exitcodes für CI/Gates:

- `audit --check` gibt bei Funden `1` zurück.
- Nicht aufgelöste Referenzen geben `2` zurück (unabhängig von `--check`).

Verwandte Themen: [Secret-Verwaltung](/de/gateway/secrets) · [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) · [Sicherheit](/de/gateway/security)

## Laufzeit-Snapshot neu laden

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Verwendet die Gateway-RPC-Methode `secrets.reload`. Wenn die Auflösung fehlschlägt, behält das Gateway seinen letzten als funktionsfähig bekannten Snapshot bei und gibt einen Fehler zurück (keine teilweise Aktivierung). Die JSON-Antwort enthält `warningCount`.

Optionen: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Prüfung

Durchsucht den OpenClaw-Status nach:

- Speicherung von Secrets im Klartext
- nicht aufgelösten Referenzen
- Abweichungen bei der Priorität (`auth-profiles.json`-Anmeldedaten überschreiben Referenzen aus `openclaw.json`)
- Rückständen in generierten `agents/*/agent/models.json`-Dateien (`apiKey`-Werte von Providern und sensible Provider-Header)
- veralteten Rückständen (Einträge im veralteten Authentifizierungsspeicher, OAuth-Erinnerungen)

Die Erkennung sensibler Provider-Header basiert auf Namensheuristiken: Sie kennzeichnet Header, deren Name mit gängigen Authentifizierungs- oder Anmeldedatenbestandteilen übereinstimmt (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

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
- Fundcodes: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Konfigurieren (interaktiver Assistent)

Erstellen Sie interaktiv Änderungen an Providern und SecretRef, führen Sie eine Vorabprüfung durch und wenden Sie die Änderungen optional an:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Ablauf: zuerst Provider-Einrichtung (`secrets.providers`-Aliase hinzufügen/bearbeiten/entfernen), dann Zuordnung der Anmeldedaten (Felder auswählen, `{source, provider, id}`-Referenzen zuweisen), anschließend Vorabprüfung und optionale Anwendung.

Flags:

- `--providers-only`: nur `secrets.providers` konfigurieren, Zuordnung der Anmeldedaten überspringen
- `--skip-provider-setup`: Provider-Einrichtung überspringen, Anmeldedaten vorhandenen Providern zuordnen
- `--agent <id>`: Zielermittlung und Schreibvorgänge für `auth-profiles.json` auf den Speicher eines Agents beschränken
- `--allow-exec`: Prüfungen von exec-SecretRefs während Vorabprüfung/Anwendung erlauben (kann Provider-Befehle ausführen)

`--providers-only` und `--skip-provider-setup` können nicht kombiniert werden.

Hinweise:

- Erfordert ein interaktives TTY.
- Erfasst geheimnishaltige Felder in `openclaw.json` sowie `auth-profiles.json` für den ausgewählten Agent-Bereich; kanonisch unterstützte Oberfläche: [Anmeldedaten-Oberfläche für SecretRefs](/de/reference/secretref-credential-surface).
- Unterstützt das direkte Erstellen neuer Zuordnungen in `auth-profiles.json` im Auswahlablauf.
- Führt vor der Anwendung eine Vorabauflösung durch.
- Bei generierten Plänen sind die Bereinigungsoptionen standardmäßig aktiviert (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Die Anwendung ist für bereinigte Klartextwerte unumkehrbar.
- Ohne `--apply` fragt die CLI nach der Vorabprüfung dennoch `Apply this plan now?`.
- Mit `--apply` (und ohne `--yes`) fordert die CLI eine zusätzliche Bestätigung der unumkehrbaren Migration an.
- `--json` gibt den Plan und den Vorabprüfungsbericht aus, erfordert aber weiterhin ein interaktives TTY.

### Sicherheit von exec-Providern

Homebrew-Installationen stellen häufig symbolisch verknüpfte Binärdateien unter `/opt/homebrew/bin/*` bereit. Setzen Sie `allowSymlinkCommand: true` nur bei Bedarf für vertrauenswürdige Paketmanagerpfade und zusammen mit `trustedDirs` (zum Beispiel `["/opt/homebrew"]`). Wenn unter Windows die ACL-Prüfung für einen Provider-Pfad nicht verfügbar ist, bricht OpenClaw sicherheitshalber ab; setzen Sie ausschließlich für vertrauenswürdige Pfade bei diesem Provider `allowInsecurePath: true`, um die Pfadsicherheitsprüfung zu umgehen.

## Einen gespeicherten Plan anwenden

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` validiert die Vorabprüfung, ohne Dateien zu schreiben; Prüfungen von exec-SecretRefs werden beim Probelauf standardmäßig übersprungen. Der Schreibmodus lehnt Pläne mit exec-SecretRefs/-Providern ab, sofern `--allow-exec` nicht angegeben ist. Verwenden Sie `--allow-exec`, um Prüfungen beziehungsweise die Ausführung von exec-Providern in beiden Modi ausdrücklich zuzulassen.

Was `apply` aktualisieren kann:

- `openclaw.json` (SecretRef-Ziele sowie Hinzufügen/Aktualisieren oder Löschen von Providern)
- `auth-profiles.json` (Bereinigung von Provider-Zielen)
- veraltete Rückstände in `auth.json`
- bekannte geheime Schlüssel in `~/.openclaw/.env`, deren Werte migriert wurden

Details zum Planvertrag (zulässige Zielpfade, Validierungsregeln, Fehlersemantik): [Vertrag für den Secrets-Anwendungsplan](/de/gateway/secrets-plan-contract).

### Warum es keine Rollback-Sicherungen gibt

`secrets apply` legt absichtlich keine Rollback-Sicherungen mit alten Klartextwerten an. Die Sicherheit beruht auf einer strikten Vorabprüfung und einer weitgehend atomaren Anwendung sowie auf einer bestmöglichen Wiederherstellung im Arbeitsspeicher bei einem Fehler.

## Beispiel

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Wenn `audit --check` weiterhin Klartextbefunde meldet, aktualisieren Sie die übrigen gemeldeten Zielpfade und führen Sie die Prüfung erneut aus.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Secrets-Verwaltung](/de/gateway/secrets)
- [Vault-SecretRefs](/plugins/vault)
