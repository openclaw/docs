---
read_when:
    - SecretRefs zur Laufzeit erneut auflösen
    - Prüfen auf Klartext-Rückstände und nicht aufgelöste Refs
    - SecretRefs konfigurieren und unidirektionale Bereinigungsänderungen anwenden
summary: CLI-Referenz für `openclaw secrets` (`reload`, `audit`, `configure`, `apply`)
title: Secrets
x-i18n:
    generated_at: "2026-04-24T06:32:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw secrets`

Verwenden Sie `openclaw secrets`, um SecretRefs zu verwalten und den aktiven Runtime-Snapshot in gutem Zustand zu halten.

Befehlsrollen:

- `reload`: Gateway-RPC (`secrets.reload`), die Refs erneut auflöst und den Runtime-Snapshot nur bei vollständigem Erfolg austauscht (keine Config-Schreibvorgänge).
- `audit`: schreibgeschützter Scan von Konfigurations-/Authentifizierungs-/generierten Modell-Stores und Legacy-Rückständen auf Klartext, nicht aufgelöste Refs und Prioritätsdrift (Exec-Refs werden übersprungen, sofern nicht `--allow-exec` gesetzt ist).
- `configure`: interaktiver Planer für Provider-Einrichtung, Zielzuordnung und Preflight (TTY erforderlich).
- `apply`: einen gespeicherten Plan ausführen (`--dry-run` nur zur Validierung; Dry-Run überspringt standardmäßig Exec-Prüfungen, und der Schreibmodus lehnt Pläne mit Exec-Inhalten ab, sofern nicht `--allow-exec` gesetzt ist), dann gezielte Klartext-Rückstände bereinigen.

Empfohlene Operator-Schleife:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Wenn Ihr Plan `exec`-SecretRefs/-Provider enthält, übergeben Sie `--allow-exec` sowohl bei Dry-Run- als auch bei Schreib-`apply`-Befehlen.

Hinweis zum Exit-Code für CI/Gates:

- `audit --check` gibt bei Findings `1` zurück.
- Nicht aufgelöste Refs geben `2` zurück.

Verwandt:

- Secrets-Anleitung: [Secrets Management](/de/gateway/secrets)
- Oberfläche für Zugangsdaten: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- Sicherheitsanleitung: [Security](/de/gateway/security)

## Runtime-Snapshot neu laden

SecretRefs erneut auflösen und den Runtime-Snapshot atomar austauschen.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Hinweise:

- Verwendet die Gateway-RPC-Methode `secrets.reload`.
- Wenn die Auflösung fehlschlägt, behält das Gateway den zuletzt bekannten funktionierenden Snapshot bei und gibt einen Fehler zurück (keine partielle Aktivierung).
- Die JSON-Antwort enthält `warningCount`.

Optionen:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

Den OpenClaw-Status scannen auf:

- Speicherung von Secrets im Klartext
- nicht aufgelöste Refs
- Prioritätsdrift (`auth-profiles.json`-Zugangsdaten, die `openclaw.json`-Refs überdecken)
- generierte `agents/*/agent/models.json`-Rückstände (Provider-`apiKey`-Werte und sensible Provider-Header)
- Legacy-Rückstände (Legacy-Einträge im Auth-Store, OAuth-Erinnerungen)

Hinweis zu Header-Rückständen:

- Die Erkennung sensibler Provider-Header basiert auf Namensheuristiken (gängige Header-Namen und Fragmente für Authentifizierung/Zugangsdaten wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Exit-Verhalten:

- `--check` beendet sich bei Findings mit einem Nicht-Null-Code.
- Nicht aufgelöste Refs beenden sich mit einem höher priorisierten Nicht-Null-Code.

Wichtige Punkte der Berichtsform:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- Finding-Codes:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (interaktiver Helfer)

Provider- und SecretRef-Änderungen interaktiv erstellen, Preflight ausführen und optional anwenden:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Ablauf:

- Zuerst Provider-Einrichtung (`add/edit/remove` für `secrets.providers`-Aliase).
- Danach Zuordnung der Zugangsdaten (Felder auswählen und `{source, provider, id}`-Refs zuweisen).
- Zum Schluss Preflight und optionales Anwenden.

Flags:

- `--providers-only`: nur `secrets.providers` konfigurieren, Zuordnung der Zugangsdaten überspringen.
- `--skip-provider-setup`: Provider-Einrichtung überspringen und Zugangsdaten vorhandenen Providern zuordnen.
- `--agent <id>`: `auth-profiles.json`-Zielerkennung und Schreibvorgänge auf einen Agent-Store beschränken.
- `--allow-exec`: Exec-SecretRef-Prüfungen während Preflight/Apply erlauben (kann Provider-Befehle ausführen).

Hinweise:

- Erfordert ein interaktives TTY.
- `--providers-only` kann nicht mit `--skip-provider-setup` kombiniert werden.
- `configure` zielt auf secret-haltige Felder in `openclaw.json` sowie auf `auth-profiles.json` für den ausgewählten Agent-Bereich.
- `configure` unterstützt das direkte Erstellen neuer `auth-profiles.json`-Zuordnungen im Picker-Ablauf.
- Kanonisch unterstützte Oberfläche: [SecretRef Credential Surface](/de/reference/secretref-credential-surface).
- Führt vor dem Anwenden eine Preflight-Auflösung aus.
- Wenn Preflight/Apply Exec-Refs enthält, lassen Sie `--allow-exec` für beide Schritte gesetzt.
- Generierte Pläne verwenden standardmäßig Bereinigungsoptionen (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` alle aktiviert).
- Der Apply-Pfad ist für bereinigte Klartextwerte einseitig.
- Ohne `--apply` fragt die CLI nach dem Preflight weiterhin `Apply this plan now?`.
- Mit `--apply` (und ohne `--yes`) fragt die CLI zusätzlich eine irreversible Bestätigung ab.
- `--json` gibt den Plan + Preflight-Bericht aus, aber der Befehl erfordert weiterhin ein interaktives TTY.

Hinweis zur Sicherheit von Exec-Providern:

- Homebrew-Installationen stellen Binärdateien oft als Symlinks unter `/opt/homebrew/bin/*` bereit.
- Setzen Sie `allowSymlinkCommand: true` nur dann, wenn es für vertrauenswürdige Paketmanager-Pfade nötig ist, und kombinieren Sie es mit `trustedDirs` (zum Beispiel `["/opt/homebrew"]`).
- Unter Windows schlägt OpenClaw fail-closed fehl, wenn die ACL-Prüfung für einen Provider-Pfad nicht verfügbar ist. Setzen Sie nur für vertrauenswürdige Pfade `allowInsecurePath: true` für diesen Provider, um die Pfadsicherheitsprüfungen zu umgehen.

## Einen gespeicherten Plan anwenden

Einen zuvor generierten Plan anwenden oder per Preflight prüfen:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec-Verhalten:

- `--dry-run` validiert den Preflight, ohne Dateien zu schreiben.
- Exec-SecretRef-Prüfungen werden im Dry-Run standardmäßig übersprungen.
- Der Schreibmodus lehnt Pläne ab, die Exec-SecretRefs/-Provider enthalten, sofern nicht `--allow-exec` gesetzt ist.
- Verwenden Sie `--allow-exec`, um in beiden Modi in Exec-Provider-Prüfungen/-Ausführung einzuwilligen.

Details zum Planvertrag (zulässige Zielpfade, Validierungsregeln und Fehlverhaltenssemantik):

- [Secrets Apply Plan Contract](/de/gateway/secrets-plan-contract)

Was `apply` aktualisieren kann:

- `openclaw.json` (SecretRef-Ziele + Provider-Upserts/-Deletes)
- `auth-profiles.json` (Bereinigung providerbezogener Ziele)
- Legacy-`auth.json`-Rückstände
- bekannte Secret-Schlüssel in `~/.openclaw/.env`, deren Werte migriert wurden

## Warum keine Rollback-Backups

`secrets apply` schreibt absichtlich keine Rollback-Backups, die alte Klartextwerte enthalten.

Die Sicherheit ergibt sich aus strengem Preflight + nahezu atomarem Apply mit Best-Effort-Wiederherstellung im Speicher bei Fehlern.

## Beispiel

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Wenn `audit --check` weiterhin Klartext-Findings meldet, aktualisieren Sie die verbleibenden gemeldeten Zielpfade und führen Sie das Audit erneut aus.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Secrets management](/de/gateway/secrets)
