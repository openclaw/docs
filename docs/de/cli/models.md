---
read_when:
    - Sie möchten Standardmodelle ändern oder den Authentifizierungsstatus des Providers anzeigen.
    - Sie möchten verfügbare Modelle/Provider scannen und Authentifizierungsprofile debuggen.
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-04-26T11:26:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Authentifizierungsprofile).

Verwandte Inhalte:

- Provider + Modelle: [Modelle](/de/providers/models)
- Konzepte zur Modellauswahl + Slash-Befehl `/models`: [Modellkonzept](/de/concepts/models)
- Einrichtung der Provider-Authentifizierung: [Erste Schritte](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt die aufgelösten Standardwerte/Fallbacks sowie eine Authentifizierungsübersicht.
Wenn Snapshots zur Providernutzung verfügbar sind, enthält der Abschnitt zum OAuth-/API-Key-Status
Nutzungsfenster und Quota-Snapshots der Provider.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Nutzungsauthentifizierung stammt aus providerspezifischen Hooks,
wenn verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Key-
Anmeldedaten aus Authentifizierungsprofilen, der Umgebung oder der Konfiguration zurück.
In der Ausgabe mit `--json` ist `auth.providers` die umgebungs-/konfigurations-/storebewusste
Provider-Übersicht, während `auth.oauth` nur der Gesundheitsstatus der Auth-Store-Profile ist.
Fügen Sie `--probe` hinzu, um Live-Authentifizierungsprüfungen gegen jedes konfigurierte Providerprofil auszuführen.
Prüfungen sind echte Anfragen (können Tokens verbrauchen und Ratenlimits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Authentifizierungsstatus eines konfigurierten Agenten zu prüfen. Wenn dies weggelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standardagenten.
Probe-Zeilen können aus Authentifizierungsprofilen, Umgebungs-Anmeldedaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Authentifizierungsprofile, vorhandenen Katalogstatus
  und providerseitige Katalogzeilen, schreibt aber `models.json`
  nicht neu.
- `models list --all --provider <id>` kann providerseitige statische Katalogzeilen
  aus Plugin-Manifesten oder Metadaten gebündelter Provider-Kataloge einbeziehen, selbst wenn Sie
  sich bei diesem Provider noch nicht authentifiziert haben. Diese Zeilen werden weiterhin als
  nicht verfügbar angezeigt, bis passende Authentifizierung konfiguriert ist.
- `models list` hält native Modellmetadaten und Laufzeitlimits getrennt. In der
  Tabellenausgabe zeigt `Ctx` `contextTokens/contextWindow`, wenn sich ein effektives Laufzeitlimit
  vom nativen Kontextfenster unterscheidet; JSON-Zeilen enthalten `contextTokens`,
  wenn ein Provider dieses Limit bereitstellt.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai-codex`. Anzeige-Labels aus interaktiven Provider-Auswahlen, wie
  `Moonshot AI`, werden nicht akzeptiert.
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID ein `/` enthält (im Stil von OpenRouter), fügen Sie das Provider-Präfix hinzu (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutigen Treffer eines konfigurierten Providers für genau diese Modell-ID und greift erst dann
  mit einer Veraltungswarnung auf den konfigurierten Standardprovider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw
  auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten Standard eines entfernten Providers
  anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), statt sie als Geheimnisse zu maskieren.

### `models scan`

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und bewertet Kandidaten
für die Verwendung als Fallback. Der Katalog selbst ist öffentlich, daher benötigen reine Metadaten-Scans
keinen OpenRouter-Key.

Standardmäßig versucht OpenClaw, Tool- und Bildunterstützung mit Live-Modellaufrufen zu prüfen.
Wenn kein OpenRouter-Key konfiguriert ist, greift der Befehl auf reine Metadaten-Ausgabe zurück und erklärt,
dass `:free`-Modelle weiterhin `OPENROUTER_API_KEY` für Prüfungen und Inferenz benötigen.

Optionen:

- `--no-probe` (nur Metadaten; keine Konfigurations-/Secrets-Abfrage)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (Timeout für Kataloganfrage und pro Prüfung)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` und `--set-image` erfordern Live-Prüfungen; Ergebnisse aus reinen Metadaten-Scans
sind informativ und werden nicht auf die Konfiguration angewendet.

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlt, 2=läuft bald ab)
- `--probe` (Live-Prüfung konfigurierte Authentifizierungsprofile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholt oder kommagetrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Statuskategorien für Prüfungen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Fälle für Prüfungsdetails/Grundcodes:

- `excluded_by_auth_order`: ein gespeichertes Profil existiert, aber ein explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Prüfung den Ausschluss, statt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Profil ist vorhanden, aber nicht zulässig/auflösbar.
- `no_model`: Provider-Authentifizierung existiert, aber OpenClaw konnte
  kein prüfbares Modell für diesen Provider auflösen.

## Aliasse + Fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Authentifizierungsprofile

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` ist die interaktive Authentifizierungshilfe. Sie kann einen Provider-Authentifizierungsfluss
(OAuth/API-Key) starten oder Sie abhängig vom gewählten Provider
zum manuellen Einfügen eines Tokens führen.

`models auth login` führt den Authentifizierungsfluss eines Provider-Plugins aus (OAuth/API-Key). Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.
Verwenden Sie `openclaw models auth --agent <id> <subcommand>`, um Authentifizierungsergebnisse in einen
spezifischen konfigurierten Agent-Store zu schreiben. Das übergeordnete Flag `--agent` wird von
`add`, `login`, `setup-token`, `paste-token` und `login-github-copilot` berücksichtigt.

Beispiele:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Hinweise:

- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Authentifizierungsmethoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Authentifizierungsmethode des Providers aus
  (standardmäßig die Methode `setup-token` dieses Providers, wenn er eine solche bereitstellt).
- `paste-token` akzeptiert eine anderswo oder durch Automatisierung erzeugte Token-Zeichenfolge.
- `paste-token` erfordert `--provider`, fragt nach dem Token-Wert und schreibt
  ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert ein absolutes Token-Ablaufdatum aus einer
  relativen Dauer wie `365d` oder `12h`.
- Hinweis zu Anthropic: Anthropic-Mitarbeitende haben uns mitgeteilt, dass die Nutzung im Stil der Claude CLI mit OpenClaw wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

## Verwandte Inhalte

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
