---
read_when:
    - Du möchtest Standardmodelle ändern oder den Provider-Auth-Status anzeigen
    - Du möchtest verfügbare Modelle/Provider scannen und Auth-Profile debuggen
summary: CLI-Referenz für `openclaw models` (`status`/`list`/`set`/`scan`, Aliasse, Fallbacks, Auth)
title: models
x-i18n:
    generated_at: "2026-04-23T06:27:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bf7b864ff57af0649bc31443ce77b193d6b3dbb200c53b69ea584fa2e12cbf7
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

- Provider + Modelle: [Models](/de/providers/models)
- Einrichtung der Provider-Auth: [Getting started](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt das aufgelöste Standardmodell/die Fallbacks plus eine Auth-Übersicht.
Wenn Snapshots zur Provider-Nutzung verfügbar sind, enthält der Abschnitt zum OAuth/API-Key-Status
Nutzungsfenster und Kontingent-Snapshots der Provider.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Nutzungs-Auth stammt aus providerspezifischen Hooks,
wenn verfügbar; andernfalls greift OpenClaw auf passende OAuth/API-Key-
Anmeldedaten aus Auth-Profilen, Env oder Konfiguration zurück.
In der Ausgabe mit `--json` ist `auth.providers` die Env-/Konfigurations-/Store-bewusste
Provider-Übersicht, während `auth.oauth` nur der Profilzustand des Auth-Stores ist.
Füge `--probe` hinzu, um Live-Auth-Probes gegen jedes konfigurierte Provider-Profil auszuführen.
Probes sind echte Anfragen (können Tokens verbrauchen und Rate-Limits auslösen).
Verwende `--agent <id>`, um den Modell-/Auth-Status eines konfigurierten Agenten zu prüfen. Wenn weggelassen,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agenten.
Probe-Zeilen können aus Auth-Profilen, Env-Anmeldedaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list --all` enthält auch gebündelte statische Katalogeinträge im Besitz von Providern,
  selbst wenn du dich bei diesem Provider noch nicht authentifiziert hast. Diese Einträge werden weiterhin als nicht verfügbar angezeigt, bis passende Auth konfiguriert ist.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai-codex`. Es akzeptiert keine Anzeigenamen aus interaktiven Provider-
  Auswahlen, etwa `Moonshot AI`.
- Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (im Stil von OpenRouter), füge das Provider-Präfix ein (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn du den Provider weglässt, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige configured-provider-Übereinstimmung für genau diese Modell-ID und greift erst dann
  mit einer Deprecation-Warnung auf den konfigurierten Standard-Provider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw
  auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt einen
  veralteten Standard eines entfernten Providers anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), anstatt sie als Geheimnisse zu maskieren.

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Probe konfigurierte Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholt oder durch Kommas getrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Buckets für Probe-Status:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Fälle für Probe-Details/Reason-Codes:

- `excluded_by_auth_order`: ein gespeichertes Profil existiert, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Probe den Ausschluss, statt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Profil ist vorhanden, aber nicht zulässig/auflösbar.
- `no_model`: Provider-Auth existiert, aber OpenClaw konnte kein probefähiges
  Modell für diesen Provider auflösen.

## Aliasse + Fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth-Profile

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` ist die interaktive Auth-Hilfe. Sie kann einen Provider-Auth-
Ablauf starten (OAuth/API-Key) oder dich je nach gewähltem
Provider durch das manuelle Einfügen eines Tokens führen.

`models auth login` führt den Auth-Ablauf eines Provider-Plugins aus (OAuth/API-Key). Verwende
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.

Beispiele:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Hinweise:

- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Auth-
  Methode des Providers aus (standardmäßig die `setup-token`-Methode dieses Providers, wenn er
  eine solche bereitstellt).
- `paste-token` akzeptiert eine Token-Zeichenfolge, die anderswo oder durch Automatisierung erzeugt wurde.
- `paste-token` erfordert `--provider`, fragt nach dem Tokenwert und schreibt
  ihn in die Standard-Profil-ID `<provider>:manual`, sofern du nicht
  `--profile-id` übergibst.
- `paste-token --expires-in <duration>` speichert ein absolutes Token-Ablaufdatum aus einer
  relativen Dauer wie `365d` oder `12h`.
- Hinweis zu Anthropic: Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung von Claude CLI im OpenClaw-Stil wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
