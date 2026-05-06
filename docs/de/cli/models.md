---
read_when:
    - Sie möchten Standardmodelle ändern oder den Authentifizierungsstatus des Providers anzeigen
    - Sie möchten verfügbare Modelle/Provider scannen und Auth-Profile debuggen
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliase, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-05-06T19:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
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

`openclaw models status` zeigt den aufgelösten Standard und die Fallbacks sowie eine Authentifizierungsübersicht.
Wenn Snapshots zur Provider-Nutzung verfügbar sind, enthält der Abschnitt zum OAuth/API-Schlüssel-Status
Nutzungsfenster der Provider und Kontingent-Snapshots.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Die Nutzungsauthentifizierung stammt aus Provider-spezifischen Hooks,
wenn verfügbar; andernfalls greift OpenClaw auf passende OAuth/API-Schlüssel-
Anmeldedaten aus Auth-Profilen, Umgebung oder Konfiguration zurück.
In der Ausgabe `--json` ist `auth.providers` die umgebungs-/konfigurations-/speicherbewusste Provider-
Übersicht, während `auth.oauth` nur den Zustand der Profile im Auth-Speicher enthält.
Fügen Sie `--probe` hinzu, um Live-Authentifizierungsprüfungen für jedes konfigurierte Provider-Profil auszuführen.
Prüfungen sind echte Anfragen (sie können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Authentifizierungszustand eines konfigurierten Agenten zu prüfen. Wenn dies weggelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, sofern gesetzt, andernfalls den
konfigurierten Standardagenten.
Prüfzeilen können aus Auth-Profilen, Umgebungsanmeldedaten oder `models.json` stammen.
Zur Fehlerbehebung bei Codex OAuth sind `openclaw models status`,
`openclaw models auth list --provider openai-codex` und
`openclaw config get agents.defaults.model --json` der schnellste Weg, um
zu bestätigen, ob ein Agent `openai-codex/*` über PI oder `openai/*`
über die native Codex-Laufzeit verwendet. Siehe [OpenAI-Provider-Einrichtung](/de/providers/openai#check-and-recover-codex-oauth-routing).

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Auth-Profile, vorhandenen Katalogzustand
  und Provider-eigene Katalogzeilen, schreibt aber `models.json`
  nicht neu.
- Die Spalte `Auth` ist Provider-weit und schreibgeschützt. Sie wird aus lokalen
  Auth-Profilmetadaten, Umgebungsmarkern, konfigurierten Provider-Schlüsseln, lokalen Provider-
  Markern, AWS-Bedrock-Umgebungs-/Profilmarkern und synthetischen Auth-Metadaten von Plugins berechnet;
  sie lädt keine Provider-Laufzeit, liest keine Keychain-Secrets, ruft keine Provider-
  APIs auf und belegt keine exakte Ausführungsbereitschaft pro Modell.
- `models list --all --provider <id>` kann Provider-eigene statische Katalogzeilen
  aus Plugin-Manifesten oder gebündelten Provider-Katalogmetadaten enthalten, auch wenn Sie
  sich noch nicht bei diesem Provider authentifiziert haben. Diese Zeilen werden weiterhin als
  nicht verfügbar angezeigt, bis passende Authentifizierung konfiguriert ist.
- `models list` hält die Steuerungsebene reaktionsfähig, während die Provider-Katalog-
  Erkennung langsam ist. Die Standard- und konfigurierten Ansichten fallen nach kurzer Wartezeit auf konfigurierte oder
  synthetische Modellzeilen zurück und lassen die Erkennung im
  Hintergrund abschließen. Verwenden Sie `--all`, wenn Sie den exakten vollständigen erkannten Katalog benötigen und
  bereit sind, auf die Provider-Erkennung zu warten.
- Ein breites `models list --all` führt Manifest-Katalogzeilen über Registry-Zeilen zusammen,
  ohne Provider-Laufzeit-Supplement-Hooks zu laden. Provider-gefilterte Manifest-
  Schnellpfade verwenden nur Provider, die als `static` markiert sind; Provider, die als `refreshable`
  markiert sind, bleiben Registry-/Cache-gestützt und hängen Manifestzeilen als Ergänzungen an, während
  Provider, die als `runtime` markiert sind, bei Registry-/Laufzeiterkennung bleiben.
- `models list` hält native Modellmetadaten und Laufzeitgrenzen getrennt. In der Tabellenausgabe
  zeigt `Ctx` `contextTokens/contextWindow`, wenn eine effektive Laufzeit-
  Grenze vom nativen Kontextfenster abweicht; JSON-Zeilen enthalten `contextTokens`,
  wenn ein Provider diese Grenze bereitstellt.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai-codex`. Es akzeptiert keine Anzeigebezeichnungen aus interaktiven Provider-
  Auswahlmenüs, etwa `Moonshot AI`.
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige Übereinstimmung bei konfigurierten Providern für diese exakte Modell-ID und fällt erst dann
  mit einer Veraltungswarnung auf den konfigurierten Standard-Provider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw
  auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, statt einen
  veralteten entfernten Provider-Standard anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), statt sie als Secrets zu maskieren.

### Modellscan

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und bewertet Kandidaten für
die Verwendung als Fallback. Der Katalog selbst ist öffentlich, daher benötigen reine Metadaten-Scans
keinen OpenRouter-Schlüssel.

Standardmäßig versucht OpenClaw, Tool- und Bildunterstützung mit Live-Modellaufrufen zu prüfen.
Wenn kein OpenRouter-Schlüssel konfiguriert ist, fällt der Befehl auf reine Metadaten-
Ausgabe zurück und erklärt, dass `:free`-Modelle für
Prüfungen und Inferenz weiterhin `OPENROUTER_API_KEY` benötigen.

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
Ergebnisse sind informativ und werden nicht auf die Konfiguration angewendet.

### Modellstatus

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlt, 2=läuft bald ab)
- `--probe` (Live-Prüfung konfigurierter Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholte oder kommagetrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agenten-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` reserviert stdout für die JSON-Nutzlast. Auth-Profil-, Provider-
und Startdiagnosen werden an stderr geleitet, sodass Skripte stdout direkt
in Tools wie `jq` weiterleiten können.

Statusgruppen für Prüfungen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Detail-/Grundcode-Fälle bei Prüfungen:

- `excluded_by_auth_order`: Ein gespeichertes Profil existiert, aber die explizite
  Angabe `auth.order.<provider>` hat es ausgelassen, sodass die Prüfung den Ausschluss meldet, statt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Profil ist vorhanden, aber nicht berechtigt/auflösbar.
- `no_model`: Provider-Authentifizierung existiert, aber OpenClaw konnte keinen prüfbaren
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

`models auth add` ist der interaktive Authentifizierungshelfer. Er kann je nach
gewähltem Provider einen Provider-Authentifizierungsablauf
(OAuth/API-Schlüssel) starten oder Sie zum manuellen Einfügen eines Tokens führen.

`models auth list` listet gespeicherte Auth-Profile für den ausgewählten Agenten auf, ohne
Token, API-Schlüssel oder OAuth-Secret-Material auszugeben. Verwenden Sie `--provider <id>`, um
auf einen Provider wie `openai-codex` zu filtern, und `--json` für Skripting.

`models auth login` führt den Authentifizierungsablauf eines Provider-Plugins (OAuth/API-Schlüssel) aus. Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.
Verwenden Sie `openclaw models auth --agent <id> <subcommand>`, um Authentifizierungsergebnisse in einen
bestimmten konfigurierten Agentenspeicher zu schreiben. Das übergeordnete Flag `--agent` wird von
`add`, `list`, `login`, `setup-token`, `paste-token` und
`login-github-copilot` berücksichtigt.

Beispiele:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Hinweise:

- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Authentifizierungsmethoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Authentifizierungs-
  Methode des Providers aus (standardmäßig die `setup-token`-Methode dieses Providers, wenn er
  eine bereitstellt).
- `paste-token` akzeptiert einen Token-String, der anderswo oder durch Automatisierung erzeugt wurde.
- `paste-token` erfordert `--provider`, fragt nach dem Token-Wert und schreibt
  ihn in die Standardprofil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert einen absoluten Token-Ablaufzeitpunkt aus einer
  relativen Dauer wie `365d` oder `12h`.
- Hinweis zu Anthropic: Anthropic-Mitarbeitende haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als sanktioniert, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
