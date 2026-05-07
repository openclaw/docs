---
read_when:
    - Sie möchten Standardmodelle ändern oder den Authentifizierungsstatus des Providers anzeigen
    - Sie möchten verfügbare Modelle/Provider scannen und Auth-Profile debuggen
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-05-07T13:14:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modellerkennung, Scans und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

- Provider + Modelle: [Modelle](/de/providers/models)
- Konzepte zur Modellauswahl + Slash-Befehl `/models`: [Modelle-Konzept](/de/concepts/models)
- Provider-Auth-Einrichtung: [Erste Schritte](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt die aufgelöste Standard-/Fallback-Konfiguration sowie eine Auth-Übersicht.
Wenn Provider-Nutzungs-Snapshots verfügbar sind, enthält der Abschnitt zum OAuth/API-Key-Status
Provider-Nutzungsfenster und Quota-Snapshots.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Nutzungs-Auth stammt, wenn verfügbar, aus Provider-spezifischen Hooks;
andernfalls greift OpenClaw auf passende OAuth/API-Key-
Anmeldedaten aus Auth-Profilen, Env oder Konfiguration zurück.
In der Ausgabe von `--json` ist `auth.providers` die env-/config-/store-bewusste Provider-
Übersicht, während `auth.oauth` nur den Zustand der Auth-Store-Profile beschreibt.
Fügen Sie `--probe` hinzu, um Live-Auth-Probes gegen jedes konfigurierte Provider-Profil auszuführen.
Probes sind echte Anfragen (sie können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Auth-Zustand eines konfigurierten Agents zu prüfen. Wenn es weggelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agent.
Probe-Zeilen können aus Auth-Profilen, Env-Anmeldedaten oder `models.json` stammen.
Für die Fehlersuche bei Codex OAuth sind `openclaw models status`,
`openclaw models auth list --provider openai-codex` und
`openclaw config get agents.defaults.model --json` der schnellste Weg, um zu
bestätigen, ob ein Agent ein verwendbares `openai-codex`-Auth-Profil für
`openai/*` über die native Codex-Laufzeit hat. Siehe [OpenAI-Provider-Einrichtung](/de/providers/openai#check-and-recover-codex-oauth-routing).

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Auth-Profile, bestehenden Katalogzustand
  und Provider-eigene Katalogzeilen, schreibt aber `models.json` nicht um.
- Die Spalte `Auth` ist Provider-weit und schreibgeschützt. Sie wird aus lokalen
  Auth-Profil-Metadaten, Env-Markern, konfigurierten Provider-Schlüsseln, Local-Provider-
  Markern, AWS-Bedrock-Env-/Profil-Markern und synthetischen Auth-Metadaten von Plugins berechnet;
  sie lädt keine Provider-Laufzeit, liest keine Keychain-Secrets, ruft keine Provider-
  APIs auf und weist keine exakte Ausführungsbereitschaft pro Modell nach.
- `models list --all --provider <id>` kann Provider-eigene statische Katalogzeilen
  aus Plugin-Manifesten oder gebündelten Provider-Katalogmetadaten enthalten, selbst wenn Sie sich
  noch nicht bei diesem Provider authentifiziert haben. Diese Zeilen werden weiterhin als
  nicht verfügbar angezeigt, bis passende Auth konfiguriert ist.
- `models list` hält die Control Plane reaktionsfähig, während die Provider-Katalog-
  Erkennung langsam ist. Die Standard- und konfigurierten Ansichten fallen nach kurzer Wartezeit
  auf konfigurierte oder synthetische Modellzeilen zurück und lassen die Erkennung im
  Hintergrund abschließen. Verwenden Sie `--all`, wenn Sie den exakten vollständigen erkannten Katalog benötigen und
  bereit sind, auf die Provider-Erkennung zu warten.
- Ein breites `models list --all` führt Manifest-Katalogzeilen über Registry-Zeilen
  zusammen, ohne Provider-Laufzeit-Supplement-Hooks zu laden. Provider-gefilterte Manifest-
  Schnellpfade verwenden nur Provider, die als `static` markiert sind; Provider, die als `refreshable`
  markiert sind, bleiben Registry-/Cache-gestützt und hängen Manifest-Zeilen als Ergänzungen an, während
  Provider, die als `runtime` markiert sind, bei Registry-/Laufzeit-Erkennung bleiben.
- `models list` hält native Modellmetadaten und Laufzeit-Caps getrennt. In der Tabellen-
  Ausgabe zeigt `Ctx` `contextTokens/contextWindow`, wenn ein effektives Laufzeit-
  Cap vom nativen Kontextfenster abweicht; JSON-Zeilen enthalten `contextTokens`,
  wenn ein Provider dieses Cap bereitstellt.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai-codex`. Es akzeptiert keine Anzeigenamen aus interaktiven Provider-
  Auswahlen, etwa `Moonshot AI`.
- Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige Übereinstimmung eines konfigurierten Providers für diese exakte Modell-ID und erst danach
  fällt es mit einer Deprecation-Warnung auf den konfigurierten Standard-Provider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw
  auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, anstatt einen
  veralteten entfernten Provider-Standard anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), anstatt sie als Secrets zu maskieren.

### Modelle scannen

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und bewertet Kandidaten für
die Fallback-Nutzung. Der Katalog selbst ist öffentlich, daher benötigen reine Metadaten-Scans keinen
OpenRouter-Schlüssel.

Standardmäßig versucht OpenClaw, Tool- und Bildunterstützung mit Live-Modellaufrufen zu prüfen.
Wenn kein OpenRouter-Schlüssel konfiguriert ist, fällt der Befehl auf eine reine Metadaten-
Ausgabe zurück und erklärt, dass `:free`-Modelle weiterhin `OPENROUTER_API_KEY` für
Probes und Inferenz benötigen.

Optionen:

- `--no-probe` (nur Metadaten; keine Konfigurations-/Secrets-Suche)
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

`--set-default` und `--set-image` erfordern Live-Probes; reine Metadaten-Scan-
Ergebnisse sind informativ und werden nicht auf die Konfiguration angewendet.

### Modellstatus

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Probe konfigurierter Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholte oder kommagetrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` hält stdout für die JSON-Nutzlast reserviert. Auth-Profil-, Provider-
und Startdiagnosen werden an stderr geleitet, sodass Skripte stdout direkt
in Tools wie `jq` leiten können.

Probe-Statusgruppen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Detail-/Reason-Code-Fälle für Probes:

- `excluded_by_auth_order`: Ein gespeichertes Profil existiert, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Probe den Ausschluss, anstatt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Profil ist vorhanden, aber nicht berechtigt/auflösbar.
- `no_model`: Provider-Auth existiert, aber OpenClaw konnte keinen prüfbaren
  Modellkandidaten für diesen Provider auflösen.

## Aliase + Fallbacks

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
Flow (OAuth/API-Key) starten oder Sie je nach gewähltem Provider zum manuellen Einfügen eines Tokens führen.

`models auth list` listet gespeicherte Auth-Profile für den ausgewählten Agent auf, ohne
Token-, API-Key- oder OAuth-Secret-Material auszugeben. Verwenden Sie `--provider <id>`, um
auf einen Provider wie `openai-codex` zu filtern, und `--json` für Scripting.

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
- `paste-token` akzeptiert eine Token-Zeichenfolge, die an anderer Stelle oder durch Automatisierung erzeugt wurde.
- `paste-token` erfordert `--provider`, fragt nach dem Token-Wert und schreibt
  ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert einen absoluten Token-Ablaufzeitpunkt aus einer
  relativen Dauer wie `365d` oder `12h`.
- Anthropic-Hinweis: Anthropic-Mitarbeiter haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
