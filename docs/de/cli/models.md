---
read_when:
    - Sie möchten Standardmodelle ändern oder den Authentifizierungsstatus von Providern anzeigen
    - Sie möchten verfügbare Modelle/Provider scannen und Fehler bei Auth-Profilen beheben
summary: CLI-Referenz für `openclaw models` (`status`/`list`/`set`/`scan`, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-04-25T13:44:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

- Provider + Modelle: [Models](/de/providers/models)
- Konzepte zur Modellauswahl + Slash-Befehl `/models`: [Models concept](/de/concepts/models)
- Einrichtung der Provider-Authentifizierung: [Erste Schritte](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt das aufgelöste Standardmodell/die aufgelösten Fallbacks sowie eine Auth-Übersicht.
Wenn Snapshots der Provider-Nutzung verfügbar sind, enthält
der OAuth/API-Key-Statusabschnitt Nutzungsfenster und Quoten-Snapshots der Provider.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Die Nutzungsauthentifizierung stammt aus providerspezifischen Hooks,
wenn verfügbar; andernfalls greift OpenClaw auf passende OAuth/API-Key-
Zugangsdaten aus Auth-Profilen, Umgebungsvariablen oder der Konfiguration zurück.
In der Ausgabe von `--json` ist `auth.providers` die providerbezogene
Übersicht, die Umgebungsvariablen/Konfiguration/Store berücksichtigt, während `auth.oauth` nur die Integrität der Auth-Store-Profile abbildet.
Fügen Sie `--probe` hinzu, um Live-Auth-Probes gegen jedes konfigurierte Provider-Profil auszuführen.
Probes sind echte Anfragen (können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Auth-Status eines konfigurierten Agenten zu prüfen. Wenn ausgelassen,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agenten.
Probe-Zeilen können aus Auth-Profilen, Umgebungsvariablen-Zugangsdaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Auth-Profile, bestehenden Katalogstatus
  und providerverwaltete Katalogzeilen, schreibt aber `models.json`
  nicht neu.
- `models list --all` schließt gebündelte providerverwaltete statische Katalogzeilen ein, selbst
  wenn Sie sich bei diesem Provider noch nicht authentifiziert haben. Diese Zeilen werden weiterhin
  als nicht verfügbar angezeigt, bis passende Auth konfiguriert ist.
- `models list` hält native Modellmetadaten und Laufzeitlimits getrennt. In der Tabellenausgabe
  zeigt `Ctx` `contextTokens/contextWindow`, wenn ein effektives Laufzeitlimit vom
  nativen Kontextfenster abweicht; JSON-Zeilen enthalten `contextTokens`,
  wenn ein Provider dieses Limit bereitstellt.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder
  `openai-codex`. Es akzeptiert keine Anzeigenamen aus interaktiven Provider-
  Auswahlen wie `Moonshot AI`.
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (im Stil von OpenRouter), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutigen Treffer unter konfigurierten Providern für genau diese Modell-ID und greift erst dann
  mit einer Veraltungswarnung auf den konfigurierten Standard-Provider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw
  auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt ein
  veraltetes Standardmodell eines entfernten Providers anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), anstatt sie als Geheimnisse zu maskieren.

### `models scan`

`models scan` liest OpenRouters öffentlichen `:free`-Katalog und bewertet Kandidaten für die
Verwendung als Fallback. Der Katalog selbst ist öffentlich, daher benötigen reine Metadaten-Scans
keinen OpenRouter-Schlüssel.

Standardmäßig versucht OpenClaw, Tool- und Bildunterstützung mit Live-Modellaufrufen zu prüfen.
Wenn kein OpenRouter-Schlüssel konfiguriert ist, greift der Befehl auf reine Metadatenausgabe zurück
und erklärt, dass `:free`-Modelle dennoch `OPENROUTER_API_KEY` für
Probes und Inferenz benötigen.

Optionen:

- `--no-probe` (nur Metadaten; keine Suche in Konfiguration/Secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (Timeout für Kataloganfrage und einzelne Probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` und `--set-image` erfordern Live-Probes; Ergebnisse reiner Metadaten-Scans
dienen nur zur Information und werden nicht auf die Konfiguration angewendet.

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit-Code 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Probe der konfigurierten Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholbar oder kommagetrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agenten-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Statuskategorien für Probes:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Fälle bei Probe-Details/Reason-Codes:

- `excluded_by_auth_order`: Ein gespeichertes Profil existiert, aber eine explizite
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Probe den Ausschluss, anstatt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Das Profil ist vorhanden, aber nicht geeignet/auflösbar.
- `no_model`: Provider-Auth existiert, aber OpenClaw konnte für diesen Provider
  kein probefähiges Modell auflösen.

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
Ablauf (OAuth/API-Key) starten oder Sie abhängig vom gewählten Provider
durch das manuelle Einfügen eines Tokens führen.

`models auth login` führt den Auth-Ablauf eines Provider-Plugins aus (OAuth/API-Key). Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.

Beispiele:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Hinweise:

- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Auth-Methode
  des Providers aus (standardmäßig dessen Methode `setup-token`, wenn sie
  vorhanden ist).
- `paste-token` akzeptiert einen anderswo oder durch Automatisierung erzeugten Token-String.
- `paste-token` erfordert `--provider`, fragt nach dem Token-Wert und schreibt
  ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert ein absolutes Token-Ablaufdatum aus einer
  relativen Dauer wie `365d` oder `12h`.
- Hinweis zu Anthropic: Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt nun die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
