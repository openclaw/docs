---
read_when:
    - Sie möchten Standardmodelle ändern oder den Authentifizierungsstatus des Providers anzeigen
    - Sie möchten verfügbare Modelle/Provider scannen und Auth-Profile debuggen
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliasse, Fallbacks, Auth)
title: Modelle
x-i18n:
    generated_at: "2026-06-27T17:19:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modellerkennung, Scans und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

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

`openclaw models status` zeigt die aufgelösten Standard-/Fallbacks sowie eine Auth-Übersicht.
Wenn Momentaufnahmen der Provider-Nutzung verfügbar sind, enthält der Abschnitt zum OAuth-/API-Schlüsselstatus
Nutzungsfenster und Kontingent-Momentaufnahmen des Providers.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi und z.ai. Nutzungs-Auth stammt aus Provider-spezifischen Hooks,
wenn verfügbar; andernfalls fällt OpenClaw auf passende OAuth-/API-Schlüssel-
Anmeldedaten aus Auth-Profilen, Env oder Konfiguration zurück.
In der `--json`-Ausgabe ist `auth.providers` die env-/config-/store-bewusste Provider-
Übersicht, während `auth.oauth` nur den Zustand der Auth-Store-Profile beschreibt.
Fügen Sie `--probe` hinzu, um Live-Auth-Probes für jedes konfigurierte Provider-Profil auszuführen.
Probes sind echte Anfragen (können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Auth-Status eines konfigurierten Agents zu prüfen. Wenn dies ausgelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agent.
Probe-Zeilen können aus Auth-Profilen, Env-Anmeldedaten oder `models.json` stammen.
Zur Fehlerbehebung bei OpenAI ChatGPT/Codex OAuth sind `openclaw models status`,
`openclaw models auth list --provider openai` und
`openclaw config get agents.defaults.model --json` der schnellste Weg, um zu
bestätigen, ob ein Agent ein nutzbares `openai`-OAuth-Profil für
`openai/*` über die native Codex-Runtime hat. Siehe [OpenAI-Provider einrichten](/de/providers/openai#check-and-recover-codex-oauth-routing).

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Auth-Profile, vorhandenen Katalog-
  Status und Provider-eigene Katalogzeilen, schreibt aber
  `models.json` nicht um.
- Die Spalte `Auth` ist Provider-bezogen und schreibgeschützt. Sie wird aus lokalen
  Auth-Profilmetadaten, Env-Markern, konfigurierten Provider-Schlüsseln, Local-Provider-
  Markern, AWS-Bedrock-Env-/Profilmarkern und synthetischen Auth-Metadaten von Plugins berechnet;
  sie lädt keine Provider-Runtime, liest keine Keychain-Secrets, ruft keine Provider-
  APIs auf und weist keine exakte Ausführungsbereitschaft pro Modell nach.
- `models list --all --provider <id>` kann Provider-eigene statische Katalog-
  Zeilen aus Plugin-Manifesten oder gebündelten Provider-Katalogmetadaten enthalten, auch wenn Sie
  sich bei diesem Provider noch nicht authentifiziert haben. Diese Zeilen werden weiterhin als
  nicht verfügbar angezeigt, bis passende Auth konfiguriert ist.
- `models list` hält die Control Plane reaktionsfähig, während die Provider-Katalog-
  Erkennung langsam ist. Die Standard- und konfigurierten Ansichten fallen nach kurzer Wartezeit auf konfigurierte oder
  synthetische Modellzeilen zurück und lassen die Erkennung im
  Hintergrund fertigstellen. Verwenden Sie `--all`, wenn Sie den exakt vollständigen erkannten Katalog benötigen und
  bereit sind, auf die Provider-Erkennung zu warten.
- Breites `models list --all` führt Manifest-Katalogzeilen über Registry-Zeilen zusammen,
  ohne Provider-Runtime-Supplement-Hooks zu laden. Provider-gefilterte Manifest-
  Schnellpfade verwenden nur Provider, die als `static` markiert sind; Provider, die als `refreshable`
  markiert sind, bleiben Registry-/Cache-gestützt und hängen Manifest-Zeilen als Ergänzungen an, während
  Provider, die als `runtime` markiert sind, bei Registry-/Runtime-Erkennung bleiben.
- `models list` hält native Modellmetadaten und Runtime-Obergrenzen getrennt. In der Tabellen-
  Ausgabe zeigt `Ctx` `contextTokens/contextWindow`, wenn eine effektive Runtime-
  Obergrenze vom nativen Kontextfenster abweicht; JSON-Zeilen enthalten `contextTokens`,
  wenn ein Provider diese Obergrenze bereitstellt.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai`. Es akzeptiert keine Anzeigenamen aus interaktiven Provider-
  Auswahlmenüs, etwa `Moonshot AI`.
- Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (OpenRouter-Stil), fügen Sie das Provider-Präfix hinzu (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider auslassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige Übereinstimmung eines konfigurierten Providers für genau diese Modell-ID und erst dann
  fällt es mit einer Deprecation-Warnung auf den konfigurierten Standard-Provider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw
  auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen
  veralteten Standard eines entfernten Providers auszugeben.
- `models status` kann `marker(<value>)` in der Auth-Ausgabe für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), statt sie als Secrets zu maskieren.

### Modelle scannen

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und bewertet Kandidaten für
Fallback-Nutzung. Der Katalog selbst ist öffentlich, daher benötigen nur Metadaten betreffende Scans
keinen OpenRouter-Schlüssel.

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
Ergebnisse dienen nur zur Information und werden nicht auf die Konfiguration angewendet.

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
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`)

`--json` reserviert stdout für die JSON-Nutzlast. Auth-Profil-, Provider-
und Startdiagnosen werden an stderr geleitet, damit Skripte stdout direkt
in Tools wie `jq` weiterleiten können.

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

- `excluded_by_auth_order`: Ein gespeichertes Profil ist vorhanden, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Probe den Ausschluss, statt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Profil ist vorhanden, aber nicht berechtigt/auflösbar.
- `no_model`: Provider-Auth ist vorhanden, aber OpenClaw konnte keinen prüfbaren
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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` ist der interaktive Auth-Helfer. Er kann einen Provider-Auth-
Flow (OAuth/API-Schlüssel) starten oder Sie je nach ausgewähltem
Provider zum manuellen Einfügen eines Tokens führen.

`models auth list` listet gespeicherte Auth-Profile für den ausgewählten Agent auf, ohne
Token-, API-Schlüssel- oder OAuth-Secret-Material auszugeben. Verwenden Sie `--provider <id>`, um
auf einen Provider wie `openai` zu filtern, und `--json` für Skripting.

`models auth login` führt den Auth-Flow eines Provider-Plugins aus (OAuth/API-Schlüssel). Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.
Verwenden Sie `openclaw models auth --agent <id> <subcommand>`, um Auth-Ergebnisse in einen
bestimmten konfigurierten Agent-Store zu schreiben. Das übergeordnete Flag `--agent` wird von
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token` und
`login-github-copilot` berücksichtigt.

Für OpenAI-Modelle verwendet `--provider openai` standardmäßig die ChatGPT/Codex-Kontoanmeldung.
Verwenden Sie `--method api-key` nur, wenn Sie ein OpenAI-API-Schlüsselprofil hinzufügen möchten,
üblicherweise als Backup für Codex-Abonnementlimits. Führen Sie `openclaw doctor --fix` aus,
um ältere Legacy-Auth-/Profilzustände mit OpenAI-Codex-Präfix zu `openai` zu migrieren.

Beispiele:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Hinweise:

- `login` akzeptiert `--profile-id <id>` für Provider, die benannte
  Profile während der Anmeldung unterstützen. Verwenden Sie dies, um mehrere Anmeldungen für denselben
  Provider getrennt zu halten.
- `paste-api-key` akzeptiert API-Schlüssel, die anderswo generiert wurden, fragt nach dem Schlüssel-
  Wert und schreibt ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben. Leiten Sie in der Automatisierung den Schlüssel über stdin weiter, zum Beispiel
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Auth-
  Methode des Providers aus (standardmäßig die `setup-token`-Methode dieses Providers, wenn er
  eine bereitstellt).
- `paste-token` akzeptiert eine Token-Zeichenfolge, die anderswo oder durch Automatisierung generiert wurde.
- `paste-token` erfordert `--provider`, fragt standardmäßig nach dem Token-Wert
  und schreibt ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- Leiten Sie in der Automatisierung das Token über stdin weiter, statt es als Argument zu übergeben, damit
  Provider-Anmeldedaten nicht in Shell-Verlauf oder Prozesslisten erscheinen.
- `paste-token --expires-in <duration>` speichert ein absolutes Token-Ablaufdatum aus einer
  relativen Dauer wie `365d` oder `12h`.
- Für `openai` sind OpenAI-API-Schlüssel und ChatGPT-/OAuth-Tokenmaterial
  unterschiedliche Auth-Formen. Verwenden Sie `paste-api-key` für `sk-...`-OpenAI-API-Schlüssel und
  `paste-token` nur für Token-Auth-Material.
- Anthropic-Hinweis: Anthropic-Mitarbeiter haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist; daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
