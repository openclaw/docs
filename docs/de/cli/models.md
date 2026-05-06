---
read_when:
    - Sie möchten Standardmodelle ändern oder den Provider-Authentifizierungsstatus anzeigen
    - Sie möchten verfügbare Modelle/Provider durchsuchen und Auth-Profile debuggen
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-05-06T06:42:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

- Provider + Modelle: [Modelle](/de/providers/models)
- Konzepte zur Modellauswahl + `/models`-Slash-Befehl: [Modellkonzept](/de/concepts/models)
- Provider-Auth-Einrichtung: [Erste Schritte](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt den aufgelösten Standardwert/die Fallbacks sowie eine Auth-Übersicht.
Wenn Provider-Nutzungs-Snapshots verfügbar sind, enthält der Abschnitt zum OAuth/API-Key-Status
Provider-Nutzungsfenster und Kontingent-Snapshots.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Nutzungs-Auth stammt aus Provider-spezifischen Hooks,
wenn verfügbar; andernfalls fällt OpenClaw auf passende OAuth/API-Key-
Anmeldedaten aus Auth-Profilen, Env oder Konfiguration zurück.
In der `--json`-Ausgabe ist `auth.providers` die Env-/Config-/Store-bewusste Provider-
Übersicht, während `auth.oauth` nur den Zustand der Auth-Store-Profile darstellt.
Fügen Sie `--probe` hinzu, um Live-Auth-Probes gegen jedes konfigurierte Provider-Profil auszuführen.
Probes sind echte Anfragen (können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Auth-Zustand eines konfigurierten Agents zu prüfen. Wenn dies weggelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agent.
Probe-Zeilen können aus Auth-Profilen, Env-Anmeldedaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Auth-Profile, vorhandenen Katalog-
  Zustand und Provider-eigene Katalogzeilen, schreibt aber `models.json`
  nicht neu.
- Die Spalte `Auth` ist Provider-bezogen und schreibgeschützt. Sie wird aus lokalen
  Auth-Profilmetadaten, Env-Markern, konfigurierten Provider-Keys, Local-Provider-
  Markern, AWS-Bedrock-Env-/Profilmarkern und synthetischen Plugin-Auth-Metadaten berechnet;
  sie lädt keine Provider-Runtime, liest keine Keychain-Secrets, ruft keine Provider-
  APIs auf und belegt keine exakte Ausführungsbereitschaft pro Modell.
- `models list --all --provider <id>` kann Provider-eigene statische Katalog-
  Zeilen aus Plugin-Manifesten oder gebündelten Provider-Katalogmetadaten enthalten, auch wenn Sie
  sich bei diesem Provider noch nicht authentifiziert haben. Diese Zeilen werden weiterhin als
  nicht verfügbar angezeigt, bis passende Auth konfiguriert ist.
- `models list` hält die Steuerungsebene reaktionsfähig, während die Provider-Katalog-
  Erkennung langsam ist. Die Standard- und konfigurierten Ansichten fallen nach einer kurzen Wartezeit auf konfigurierte oder
  synthetische Modellzeilen zurück und lassen die Erkennung im
  Hintergrund abschließen. Verwenden Sie `--all`, wenn Sie den exakten vollständig erkannten Katalog benötigen und
  bereit sind, auf die Provider-Erkennung zu warten.
- Ein breites `models list --all` führt Manifest-Katalogzeilen über Registry-Zeilen zusammen,
  ohne Provider-Runtime-Supplement-Hooks zu laden. Provider-gefilterte Manifest-
  Schnellpfade verwenden nur Provider, die als `static` markiert sind; Provider, die als `refreshable`
  markiert sind, bleiben Registry-/Cache-basiert und hängen Manifestzeilen als Ergänzungen an, während
  Provider, die als `runtime` markiert sind, bei Registry-/Runtime-Erkennung bleiben.
- `models list` hält native Modellmetadaten und Runtime-Obergrenzen getrennt. In der Tabellen-
  Ausgabe zeigt `Ctx` `contextTokens/contextWindow`, wenn eine effektive Runtime-
  Obergrenze vom nativen Kontextfenster abweicht; JSON-Zeilen enthalten `contextTokens`,
  wenn ein Provider diese Obergrenze bereitstellt.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai-codex`. Es akzeptiert keine Anzeigelabels aus interaktiven Provider-
  Auswahlen, etwa `Moonshot AI`.
- Modell-Refs werden durch Aufteilen beim **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige konfigurierte-Provider-Übereinstimmung für genau diese Modell-ID, und erst dann
  fällt es mit einer Deprecation-Warnung auf den konfigurierten Standard-Provider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw
  auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen
  veralteten entfernten Provider-Standard anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), statt sie als Secrets zu maskieren.

### Modelle scannen

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und bewertet Kandidaten für
Fallback-Nutzung. Der Katalog selbst ist öffentlich, daher benötigen Scans nur mit Metadaten
keinen OpenRouter-Key.

Standardmäßig versucht OpenClaw, Tool- und Bildunterstützung mit Live-Modellaufrufen zu prüfen.
Wenn kein OpenRouter-Key konfiguriert ist, fällt der Befehl auf eine Ausgabe nur mit Metadaten
zurück und erklärt, dass `:free`-Modelle weiterhin `OPENROUTER_API_KEY` für
Probes und Inferenz benötigen.

Optionen:

- `--no-probe` (nur Metadaten; keine Config-/Secrets-Suche)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (Kataloganfrage und Timeout pro Probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` und `--set-image` erfordern Live-Probes; Scan-
Ergebnisse nur mit Metadaten dienen der Information und werden nicht auf die Konfiguration angewendet.

### Modellstatus

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlt, 2=läuft bald ab)
- `--probe` (Live-Probe konfigurierter Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholt oder kommagetrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` reserviert stdout für die JSON-Nutzdaten. Auth-Profil-, Provider-
und Startdiagnosen werden an stderr weitergeleitet, damit Skripte stdout direkt
in Tools wie `jq` pipen können.

Probe-Statusgruppen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Probe-Detail-/Reason-Code-Fälle:

- `excluded_by_auth_order`: Ein gespeichertes Profil existiert, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Probe den Ausschluss, statt
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
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` ist der interaktive Auth-Helfer. Er kann einen Provider-Auth-
Flow (OAuth/API-Key) starten oder Sie je nach ausgewähltem
Provider zum manuellen Einfügen eines Tokens führen.

`models auth list` listet gespeicherte Auth-Profile für den ausgewählten Agent auf, ohne
Token-, API-Key- oder OAuth-Secret-Material auszugeben. Verwenden Sie `--provider <id>`, um
auf einen Provider wie `openai-codex` zu filtern, und `--json` für Skripting.

`models auth login` führt den Auth-Flow eines Provider-Plugins aus (OAuth/API-Key). Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.
Verwenden Sie `openclaw models auth --agent <id> <subcommand>`, um Auth-Ergebnisse in einen
bestimmten konfigurierten Agent-Store zu schreiben. Das übergeordnete Flag `--agent` wird von
`add`, `list`, `login`, `setup-token`, `paste-token` und
`login-github-copilot` berücksichtigt.

Beispiele:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Hinweise:

- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Auth-
  Methode des Providers aus (standardmäßig die `setup-token`-Methode dieses Providers, wenn er
  eine bereitstellt).
- `paste-token` akzeptiert einen Token-String, der anderswo oder durch Automatisierung erzeugt wurde.
- `paste-token` erfordert `--provider`, fragt den Token-Wert ab und schreibt
  ihn in die Standardprofil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert einen absoluten Token-Ablauf aus einer
  relativen Dauer wie `365d` oder `12h`.
- Anthropic-Hinweis: Anthropic-Mitarbeiter haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw Claude-CLI-Wiederverwendung und `claude -p`-Nutzung als für diese Integration genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt Claude-CLI-Wiederverwendung und `claude -p`, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
