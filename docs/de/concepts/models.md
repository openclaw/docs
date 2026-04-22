---
read_when:
    - Hinzufügen oder Ändern der Models-CLI (`models list/set/scan/aliases/fallbacks`)
    - Ändern des Modell-Fallback-Verhaltens oder der Auswahl-UX
    - Aktualisieren der Modellscan-Prüfungen (Tools/Bilder)
summary: 'Models-CLI: auflisten, festlegen, Aliasse, Fallbacks, Scan, Status'
title: Models-CLI
x-i18n:
    generated_at: "2026-04-22T04:22:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# Models-CLI

Siehe [/concepts/model-failover](/de/concepts/model-failover) für Rotation von Auth-Profilen, Cooldowns und wie das mit Fallbacks zusammenspielt.
Kurzer Überblick über Provider + Beispiele: [/concepts/model-providers](/de/concepts/model-providers).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

1. **Primäres** Modell (`agents.defaults.model.primary` oder `agents.defaults.model`).
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in Reihenfolge).
3. **Provider-Auth-Failover** erfolgt innerhalb eines Providers, bevor zum nächsten Modell gewechselt wird.

Verwandt:

- `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliasse).
- `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das primäre Modell keine Bilder akzeptieren kann.
- `agents.defaults.pdfModel` wird vom `pdf`-Tool verwendet. Wenn es weggelassen wird, greift das Tool auf `agents.defaults.imageModel` zurück, dann auf das aufgelöste Sitzungs-/Standardmodell.
- `agents.defaults.imageGenerationModel` wird von der gemeinsamen Bildgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `image_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/den API-Key dieses Providers.
- `agents.defaults.musicGenerationModel` wird von der gemeinsamen Musikgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `music_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/den API-Key dieses Providers.
- `agents.defaults.videoGenerationModel` wird von der gemeinsamen Videogenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `video_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/den API-Key dieses Providers.
- Standards pro Agent können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [/concepts/multi-agent](/de/concepts/multi-agent)).

## Kurze Modellrichtlinie

- Setzen Sie Ihr primäres Modell auf das stärkste Modell der neuesten Generation, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzsensible Aufgaben und Chats mit geringerem Risiko.
- Bei Agenten mit aktivierten Tools oder nicht vertrauenswürdigen Eingaben sollten Sie ältere/schwächere Modellstufen vermeiden.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht von Hand bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Provider einrichten, einschließlich **OpenAI Code (Codex) subscription** (OAuth) und **Anthropic** (API-Key oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliasse + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

Modellreferenzen werden auf Kleinbuchstaben normalisiert. Provider-Aliasse wie `z.ai/*` werden zu `zai/*` normalisiert.

Beispiele für Provider-Konfigurationen (einschließlich OpenCode) finden sich unter
[/providers/opencode](/de/providers/opencode).

## „Model is not allowed“ (und warum Antworten ausbleiben)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist, gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Das geschieht **bevor** eine normale Antwort generiert wird, sodass es so wirken kann, als hätte die Nachricht „nicht geantwortet“. Die Lösung ist entweder:

- Das Modell zu `agents.defaults.models` hinzuzufügen, oder
- die Allowlist zu leeren (`agents.defaults.models` entfernen), oder
- ein Modell aus `/model list` auszuwählen.

Beispiel für eine Allowlist-Konfiguration:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Modelle im Chat wechseln (`/model`)

Sie können Modelle für die aktuelle Sitzung wechseln, ohne neu zu starten:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Hinweise:

- `/model` (und `/model list`) ist ein kompakter, nummerierter Picker (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell plus einem Submit-Schritt.
- `/model <#>` wählt aus diesem Picker aus.
- `/model` speichert die neue Sitzungsauswahl sofort.
- Wenn der Agent inaktiv ist, verwendet der nächste Lauf das neue Modell sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder bis zur nächsten Benutzerinteraktion in der Warteschlange bleiben.
- `/model status` ist die detaillierte Ansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
- Wenn die Modell-ID selbst `/` enthält (im OpenRouter-Stil), müssen Sie das Provider-Präfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
  1. Alias-Treffer
  2. eindeutiger Treffer eines konfigurierten Providers für genau diese Modell-ID ohne Präfix
  3. veralteter Fallback auf den konfigurierten Standard-Provider
     Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, greift OpenClaw stattdessen auf das erste konfigurierte Provider-/Modellpaar zurück, um zu vermeiden, dass ein veralteter entfernter Provider-Standard angezeigt wird.

Vollständiges Befehlsverhalten/Konfiguration: [Slash commands](/de/tools/slash-commands).

## CLI-Befehle

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (ohne Unterbefehl) ist eine Abkürzung für `models status`.

### `models list`

Zeigt standardmäßig konfigurierte Modelle an. Nützliche Flags:

- `--all`: vollständiger Katalog
- `--local`: nur lokale Provider
- `--provider <name>`: nach Provider filtern
- `--plain`: ein Modell pro Zeile
- `--json`: maschinenlesbare Ausgabe

`--all` enthält statische Katalogzeilen gebündelter Provider bereits vor der Konfiguration von Auth, sodass reine Discovery-Ansichten Modelle anzeigen können, die erst nach dem Hinzufügen passender Provider-Anmeldedaten verfügbar sind.

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, Bildmodell und eine Auth-Übersicht der konfigurierten Provider an. Außerdem wird der OAuth-Ablaufstatus für im Auth-Store gefundene Profile angezeigt (standardmäßig Warnung innerhalb von 24 h). `--plain` gibt nur das aufgelöste primäre Modell aus.
Der OAuth-Status wird immer angezeigt (und ist in der `--json`-Ausgabe enthalten). Wenn einem konfigurierten Provider Anmeldedaten fehlen, gibt `models status` einen Abschnitt **Missing auth** aus.
JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers` (effektive Auth pro Provider, einschließlich env-gestützter Anmeldedaten). `auth.oauth` ist nur der Gesundheitsstatus von Profilen im Auth-Store; Provider, die nur über env konfiguriert sind, erscheinen dort nicht.
Verwenden Sie `--check` für Automatisierung (Exit-Code `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
Verwenden Sie `--probe` für Live-Auth-Prüfungen; Probe-Zeilen können aus Auth-Profilen, env-Anmeldedaten oder `models.json` stammen.
Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet Probe `excluded_by_auth_order`, statt es zu versuchen. Wenn Auth vorhanden ist, aber für diesen Provider kein probebares Modell aufgelöst werden kann, meldet Probe `status: no_model`.

Die Auth-Auswahl ist vom Provider/Konto abhängig. Für dauerhaft aktive Gateway-Hosts sind API-Keys in der Regel am vorhersehbarsten; Wiederverwendung der Claude CLI und bestehende Anthropic-OAuth-/Token-Profile werden ebenfalls unterstützt.

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scanning (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **Katalog kostenloser Modelle** von OpenRouter und kann optional Modelle auf Tool- und Bildunterstützung testen.

Wichtige Flags:

- `--no-probe`: Live-Probes überspringen (nur Metadaten)
- `--min-params <b>`: minimale Parametergröße (Milliarden)
- `--max-age-days <days>`: ältere Modelle überspringen
- `--provider <name>`: Filter nach Provider-Präfix
- `--max-candidates <n>`: Größe der Fallback-Liste
- `--set-default`: `agents.defaults.model.primary` auf die erste Auswahl setzen
- `--set-image`: `agents.defaults.imageModel.primary` auf die erste Bildauswahl setzen

Probing erfordert einen OpenRouter-API-Key (aus Auth-Profilen oder
`OPENROUTER_API_KEY`). Ohne Key verwenden Sie `--no-probe`, um nur Kandidaten aufzulisten.

Scan-Ergebnisse werden wie folgt eingestuft:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe

- OpenRouter-Liste `/models` (Filter `:free`)
- Erfordert OpenRouter-API-Key aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [/environment](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe-Steuerung: `--timeout`, `--concurrency`

Wenn in einem TTY ausgeführt, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven Modus übergeben Sie `--yes`, um die Standardwerte zu akzeptieren.

## Models-Registry (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` im Agent-Verzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei wird standardmäßig zusammengeführt, es sei denn, `models.mode` ist auf `replace` gesetzt.

Vorrang im Merge-Modus für übereinstimmende Provider-IDs:

- Bereits vorhandenes nicht leeres `baseUrl` in der `models.json` des Agenten hat Vorrang.
- Nicht leeres `apiKey` in der `models.json` des Agenten hat nur dann Vorrang, wenn dieser Provider im aktuellen Kontext von Konfiguration/Auth-Profil nicht durch SecretRef verwaltet wird.
- Durch SecretRef verwaltete `apiKey`-Werte von Providern werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für file-/exec-Referenzen), statt aufgelöste Secrets dauerhaft zu speichern.
- Durch SecretRef verwaltete Header-Werte von Providern werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für file-/exec-Referenzen).
- Leeres oder fehlendes `apiKey`/`baseUrl` des Agenten fällt auf Konfiguration `models.providers` zurück.
- Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

Die Persistenz von Markern ist quellenautoritativ: OpenClaw schreibt Marker aus dem aktiven Konfigurations-Snapshot der Quelle (vor der Auflösung), nicht aus aufgelösten Runtime-Secret-Werten.
Dies gilt immer dann, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.

## Verwandt

- [Model Providers](/de/concepts/model-providers) — Provider-Routing und Auth
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Image Generation](/de/tools/image-generation) — Konfiguration von Bildmodellen
- [Music Generation](/de/tools/music-generation) — Konfiguration von Musikmodellen
- [Video Generation](/de/tools/video-generation) — Konfiguration von Videomodellen
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Modell-Konfigurationsschlüssel
