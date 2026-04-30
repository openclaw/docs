---
read_when:
    - Sie möchten Standardmodelle ändern oder den Provider-Authentifizierungsstatus anzeigen
    - Sie möchten verfügbare Modelle/Provider scannen und Authentifizierungsprofile debuggen
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-04-30T06:46:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

- Provider + Modelle: [Modelle](/de/providers/models)
- Konzepte zur Modellauswahl + Slash-Befehl `/models`: [Modellkonzept](/de/concepts/models)
- Auth-Einrichtung für Provider: [Erste Schritte](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt die aufgelösten Standardwerte/Fallbacks sowie eine Auth-Übersicht.
Wenn Nutzungs-Snapshots von Providern verfügbar sind, enthält der Abschnitt zum OAuth-/API-Schlüsselstatus
Provider-Nutzungsfenster und Kontingent-Snapshots.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Nutzungs-Auth stammt aus Provider-spezifischen Hooks,
wenn verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-
Anmeldedaten aus Auth-Profilen, der Umgebung oder der Konfiguration zurück.
In der Ausgabe `--json` ist `auth.providers` die umgebungs-/konfigurations-/speicherbezogene Provider-
Übersicht, während `auth.oauth` nur den Zustand der Auth-Store-Profile darstellt.
Fügen Sie `--probe` hinzu, um Live-Auth-Prüfungen für jedes konfigurierte Provider-Profil auszuführen.
Prüfungen sind echte Anfragen (sie können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Auth-Zustand eines konfigurierten Agents zu prüfen. Wenn dies ausgelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agent.
Prüfzeilen können aus Auth-Profilen, Umgebungs-Anmeldedaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Auth-Profile, vorhandenen Katalogzustand
  und Provider-eigene Katalogzeilen, schreibt `models.json` jedoch nicht neu.
- Die Spalte `Auth` ist Provider-bezogen und schreibgeschützt. Sie wird aus lokalen
  Auth-Profilmetadaten, Umgebungsmarkern, konfigurierten Provider-Schlüsseln, lokalen Provider-
  Markern, AWS-Bedrock-Umgebungs-/Profilmarkern und synthetischen Auth-Metadaten von Plugins berechnet;
  sie lädt keine Provider-Laufzeit, liest keine Schlüsselbund-Secrets, ruft keine Provider-
  APIs auf und belegt keine exakte Ausführungsbereitschaft pro Modell.
- `models list --all --provider <id>` kann Provider-eigene statische Katalogzeilen
  aus Plugin-Manifesten oder gebündelten Provider-Katalogmetadaten enthalten, selbst wenn Sie
  sich bei diesem Provider noch nicht authentifiziert haben. Diese Zeilen werden weiterhin als
  nicht verfügbar angezeigt, bis passende Auth konfiguriert ist.
- Breites `models list --all` führt Manifest-Katalogzeilen über Registry-Zeilen zusammen,
  ohne Ergänzungs-Hooks der Provider-Laufzeit zu laden. Provider-gefilterte Manifest-
  Schnellpfade verwenden nur Provider, die als `static` markiert sind; als `refreshable`
  markierte Provider bleiben Registry-/Cache-gestützt und hängen Manifest-Zeilen als Ergänzungen an, während
  als `runtime` markierte Provider bei Registry-/Laufzeiterkennung bleiben.
- `models list` hält native Modellmetadaten und Laufzeitgrenzen getrennt. In der Tabellen-
  ausgabe zeigt `Ctx` `contextTokens/contextWindow`, wenn eine effektive Laufzeitgrenze
  vom nativen Kontextfenster abweicht; JSON-Zeilen enthalten `contextTokens`,
  wenn ein Provider diese Grenze bereitstellt.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai-codex`. Es akzeptiert keine Anzeigelabels aus interaktiven Provider-
  Auswahlen, etwa `Moonshot AI`.
- Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider auslassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige Übereinstimmung bei konfigurierten Providern für genau diese Modell-ID und erst danach
  als Rückfall auf den konfigurierten Standard-Provider mit einer Veraltungswarnung.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw
  auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen
  veralteten entfernten Provider-Standard anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), statt sie als Secrets zu maskieren.

### Modelle scannen

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und bewertet Kandidaten für
die Nutzung als Fallback. Der Katalog selbst ist öffentlich, daher benötigen reine Metadaten-Scans
keinen OpenRouter-Schlüssel.

Standardmäßig versucht OpenClaw, Tool- und Bildunterstützung mit Live-Modellaufrufen zu prüfen.
Wenn kein OpenRouter-Schlüssel konfiguriert ist, fällt der Befehl auf eine reine Metadaten-
Ausgabe zurück und erklärt, dass `:free`-Modelle weiterhin `OPENROUTER_API_KEY` für
Prüfungen und Inferenz benötigen.

Optionen:

- `--no-probe` (nur Metadaten; keine Konfigurations-/Secrets-Suche)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (Kataloganfrage und Timeout pro Prüfung)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` und `--set-image` erfordern Live-Prüfungen; reine Metadaten-Scan-
Ergebnisse dienen der Information und werden nicht auf die Konfiguration angewendet.

### Modellstatus

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Prüfung konfigurierter Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholte oder kommagetrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` hält stdout für die JSON-Nutzlast reserviert. Auth-Profil-, Provider-
und Startdiagnosen werden nach stderr geleitet, sodass Skripte stdout direkt
an Tools wie `jq` weiterleiten können.

Prüfstatus-Kategorien:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Fälle für Prüfdetail-/Ursachencodes:

- `excluded_by_auth_order`: Ein gespeichertes Profil existiert, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Prüfung den Ausschluss, statt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Profil ist vorhanden, aber nicht berechtigt/auflösbar.
- `no_model`: Provider-Auth existiert, aber OpenClaw konnte keinen prüfbaren
  Modellkandidaten für diesen Provider auflösen.

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

`models auth add` ist der interaktive Auth-Helfer. Er kann einen Provider-Auth-
Ablauf (OAuth/API-Schlüssel) starten oder Sie zum manuellen Einfügen eines Tokens führen, abhängig vom
ausgewählten Provider.

`models auth login` führt den Auth-Ablauf eines Provider-Plugins aus (OAuth/API-Schlüssel). Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.
Verwenden Sie `openclaw models auth --agent <id> <subcommand>`, um Auth-Ergebnisse in einen
bestimmten konfigurierten Agent-Speicher zu schreiben. Das übergeordnete Flag `--agent` wird von
`add`, `login`, `setup-token`, `paste-token` und `login-github-copilot` berücksichtigt.

Beispiele:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Hinweise:

- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Auth-
  Methode des Providers aus (standardmäßig die Methode `setup-token` dieses Providers, wenn er
  eine bereitstellt).
- `paste-token` akzeptiert einen Token-String, der anderswo oder durch Automatisierung generiert wurde.
- `paste-token` erfordert `--provider`, fragt den Token-Wert ab und schreibt
  ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert einen absoluten Tokenablauf aus einer
  relativen Dauer wie `365d` oder `12h`.
- Anthropic-Hinweis: Anthropic-Mitarbeitende haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als für diese Integration sanktioniert, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
