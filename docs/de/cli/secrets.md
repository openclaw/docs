---
read_when:
    - Erneutes Auflösen von Secret-Referenzen zur Laufzeit
    - Prüfung auf Klartextreste und nicht aufgelöste Referenzen
    - SecretRefs konfigurieren und einseitige Bereinigungsänderungen anwenden
summary: CLI-Referenz für `openclaw secrets` (neu laden, prüfen, konfigurieren, anwenden)
title: Geheimnisse
x-i18n:
    generated_at: "2026-07-24T04:57:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61f6f81e358ca2e6a97ac9498186b32f7a74d16052d226c398dad0030d47211e
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRefs verwalten und den aktiven Runtime-Snapshot funktionsfähig halten.

| Befehl     | Aufgabe                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway-RPC (`secrets.reload`): Löst Referenzen erneut auf und veröffentlicht den eigentümerbezogenen Runtime-Snapshot atomar (ohne Konfigurationsschreibvorgänge); Fehler bei geeigneten Eigentümern können als Warnungen für einen kalten oder veralteten Zustand veröffentlicht werden |
| `audit`     | Schreibgeschützter Scan von Konfigurations-, Authentifizierungs- und generierten Modellspeichern sowie Legacy-Rückständen auf Klartext, nicht aufgelöste Referenzen und Abweichungen bei der Priorität (exec-Referenzen werden übersprungen, sofern nicht `--allow-exec`)                      |
| `configure` | Interaktiver Planer für die Provider-Einrichtung, Zielzuordnung und Vorabprüfung (erfordert ein TTY)                                                                                                       |
| `apply`     | Führt einen gespeicherten Plan aus (`--dry-run` validiert nur und überspringt exec-Prüfungen standardmäßig; der Schreibmodus lehnt Pläne mit exec-Inhalten ab, sofern nicht `--allow-exec`), und bereinigt anschließend die anvisierten Klartextrückstände |

Empfohlener Ablauf für den Betrieb:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Wenn Ihr Plan `exec`-SecretRefs/-Provider enthält, übergeben Sie `--allow-exec` sowohl beim Probelauf- als auch beim Schreibbefehl `apply`.

Exit-Codes für CI/Gates:

- `audit --check` gibt bei Befunden `1` zurück.
- Nicht aufgelöste Referenzen geben `2` zurück (unabhängig von `--check`).

Verwandte Themen: [Secret-Verwaltung](/de/gateway/secrets) · [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) · [Sicherheit](/de/gateway/security)

## Runtime-Snapshot neu laden

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Verwendet die Gateway-RPC-Methode `secrets.reload`. Funktionsfähige Eigentümer werden unabhängig voneinander aktualisiert. Fehlgeschlagene geeignete Eigentümer werden nur dann als veraltet eingestuft, wenn ihre Referenzidentitäten, Provider-Definitionen und ihr vollständiger nicht geheimer Eigentümervertrag unverändert sind; neue oder geänderte Fehler werden als kalt eingestuft. Diese eingeschränkte Aktivierung ist erfolgreich und meldet `warningCount`. Strikte oder nicht zugeordnete Fehler geben einen Fehler zurück und bewahren den zuvor aktiven Snapshot.

Optionen: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Audit

Durchsucht den OpenClaw-Zustand nach:

- Speicherung von Secrets im Klartext
- nicht aufgelösten Referenzen
- Abweichungen bei der Priorität (`auth-profiles.json`-Anmeldedaten, die `openclaw.json`-Referenzen überschreiben)
- generierten `agents/*/agent/models.json`-Rückständen (Provider-Werte für `apiKey` und sensible Provider-Header)
- Legacy-Rückständen (Einträge im Legacy-Authentifizierungsspeicher, OAuth-Erinnerungen)

Der `.env`-Scan umfasst das effektive Zustandsverzeichnis und das Verzeichnis, das die aktive Konfiguration enthält. Wenn beide Pfade dieselbe Datei bezeichnen, wird sie nur einmal gescannt.

Die Erkennung sensibler Provider-Header basiert auf einer Namensheuristik: Sie kennzeichnet Header, deren Name mit gängigen Fragmenten für Authentifizierung oder Anmeldedaten übereinstimmt (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

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

## Konfigurieren (interaktiver Helfer)

Provider- und SecretRef-Änderungen interaktiv erstellen, die Vorabprüfung ausführen und sie optional anwenden:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Ablauf: zuerst Provider-Einrichtung (`secrets.providers`-Aliase hinzufügen/bearbeiten/entfernen), dann Zuordnung der Anmeldedaten (Felder auswählen, `{source, provider, id}`-Referenzen zuweisen), anschließend Vorabprüfung und optionales Anwenden.

Flags:

- `--providers-only`: nur `secrets.providers` konfigurieren, Zuordnung der Anmeldedaten überspringen
- `--skip-provider-setup`: Provider-Einrichtung überspringen, Anmeldedaten vorhandenen Providern zuordnen
- `--agent <id>`: Ermittlung und Schreibvorgänge für `auth-profiles.json`-Ziele auf den Speicher eines einzelnen Agenten beschränken
- `--allow-exec`: Prüfungen von exec-SecretRefs während der Vorabprüfung/des Anwendens zulassen (kann Provider-Befehle ausführen)

`--providers-only` und `--skip-provider-setup` können nicht kombiniert werden.

Hinweise:

- Erfordert ein interaktives TTY.
- Zielt auf Secret-enthaltende Felder in `openclaw.json` sowie auf `auth-profiles.json` für den ausgewählten Agentenbereich; kanonische unterstützte Oberfläche: [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface).
- Unterstützt die direkte Erstellung neuer `auth-profiles.json`-Zuordnungen im Auswahlablauf.
- Führt vor dem Anwenden eine Vorabauflösung durch.
- Bei generierten Plänen sind die Bereinigungsoptionen standardmäßig aktiviert (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Das Anwenden kann für bereinigte Klartextwerte nicht rückgängig gemacht werden.
- `--plan-out` verweigert die Erstellung eines Plans, dessen UTF-8-serialisierte Form 16 MiB (16,777,216 Byte) überschreitet; dies entspricht dem Eingabelimit von `apply --from`.
- Ohne `--apply` fordert die CLI nach der Vorabprüfung weiterhin zu `Apply this plan now?` auf.
- Mit `--apply` (und ohne `--yes`) fordert die CLI eine zusätzliche Bestätigung für die irreversible Migration an.
- `--json` gibt den Plan und den Vorabprüfungsbericht aus, erfordert jedoch weiterhin ein interaktives TTY.

### Sicherheit von exec-Providern

Homebrew-Installationen stellen häufig über symbolische Verknüpfungen eingebundene Binärdateien unter `/opt/homebrew/bin/*` bereit. Legen Sie `allowSymlinkCommand: true` nur bei Bedarf für vertrauenswürdige Paketmanagerpfade fest, zusammen mit `trustedDirs` (zum Beispiel `["/opt/homebrew"]`). Wenn unter Windows die ACL-Überprüfung für einen Provider-Pfad nicht verfügbar ist, verweigert OpenClaw sicherheitshalber die Ausführung; legen Sie nur für vertrauenswürdige Pfade `allowInsecurePath: true` für diesen Provider fest, um die Pfadsicherheitsprüfung zu umgehen.

## Gespeicherten Plan anwenden

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` validiert die Vorabprüfung, ohne Dateien zu schreiben; Prüfungen von exec-SecretRefs werden beim Probelauf standardmäßig übersprungen. Der Schreibmodus lehnt Pläne ab, die exec-SecretRefs/-Provider enthalten, sofern nicht `--allow-exec`. Verwenden Sie `--allow-exec`, um Prüfungen bzw. die Ausführung von exec-Providern in beiden Modi zuzulassen.

`--from` muss auf eine reguläre Datei mit einer maximalen Größe von 16 MiB (16,777,216 Byte) verweisen. Das Bytelimit gilt für die vollständige serialisierte Datei einschließlich Leerraum.

Was `apply` aktualisieren kann:

- `openclaw.json` (SecretRef-Ziele und Einfügen/Aktualisieren/Löschen von Providern)
- `auth-profiles.json` (Bereinigung von Provider-Zielen)
- Legacy-Rückstände von `auth.json`
- `.env`-Dateien in den effektiven Zustands- und aktiven Konfigurationsverzeichnissen für bekannte Secret-Schlüssel, deren Werte migriert wurden

Details zum Planvertrag (zulässige Zielpfade, Validierungsregeln, Fehlersemantik): [Vertrag für den Secrets-Anwendungsplan](/de/gateway/secrets-plan-contract).

### Warum keine Rollback-Sicherungen

`secrets apply` schreibt absichtlich keine Rollback-Sicherungen, die alte Klartextwerte enthalten. Die Sicherheit ergibt sich aus der strikten Vorabprüfung und dem weitgehend atomaren Anwenden mit einer nach bestem Bemühen durchgeführten Wiederherstellung im Arbeitsspeicher bei einem Fehler.

## Beispiel

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Wenn `audit --check` weiterhin Klartextbefunde meldet, aktualisieren Sie die verbleibenden gemeldeten Zielpfade und führen Sie das Audit erneut aus.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Secret-Verwaltung](/de/gateway/secrets)
- [Vault-SecretRefs](/de/plugins/vault)
