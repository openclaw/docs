---
read_when:
    - Models-CLI hinzufügen oder ändern (models list/set/scan/aliases/fallbacks)
    - Fallback-Verhalten von Modellen oder die UX der Modellauswahl ändern
    - Modell-Scan-Probes aktualisieren (Tools/Bilder)
summary: 'Models-CLI: auflisten, festlegen, Aliasse, Fallbacks, Scan, Status'
title: Models-CLI
x-i18n:
    generated_at: "2026-04-25T13:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Siehe [/concepts/model-failover](/de/concepts/model-failover) für die Rotation von Auth-Profilen,
Cooldowns und wie das mit Fallbacks zusammenspielt.
Kurzer Provider-Überblick + Beispiele: [/concepts/model-providers](/de/concepts/model-providers).
Model-Refs wählen einen Provider und ein Modell. Sie wählen normalerweise nicht die
niedrigstufige Agent-Laufzeit. Zum Beispiel kann `openai/gpt-5.5` über den
normalen OpenAI-Provider-Pfad oder über die Codex-App-Server-Laufzeit laufen, abhängig
von `agents.defaults.embeddedHarness.runtime`. Siehe
[/concepts/agent-runtimes](/de/concepts/agent-runtimes).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

1. **Primäres** Modell (`agents.defaults.model.primary` oder `agents.defaults.model`).
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in Reihenfolge).
3. **Provider-Auth-Failover** erfolgt innerhalb eines Providers, bevor zum
   nächsten Modell gewechselt wird.

Verwandt:

- `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliasse).
- `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das primäre Modell keine Bilder akzeptieren kann.
- `agents.defaults.pdfModel` wird vom Tool `pdf` verwendet. Wenn es fehlt, greift das Tool auf
  `agents.defaults.imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `agents.defaults.imageGenerationModel` wird von der gemeinsamen Bildgenerierungsfunktion verwendet. Wenn es fehlt, kann `image_generate` trotzdem einen Auth-gestützten Provider-Standard ableiten. Zuerst wird der aktuelle Standard-Provider versucht, dann die übrigen registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn du einen bestimmten Provider/ein bestimmtes Modell setzt, konfiguriere auch die Auth/API-Key dieses Providers.
- `agents.defaults.musicGenerationModel` wird von der gemeinsamen Musikgenerierungsfunktion verwendet. Wenn es fehlt, kann `music_generate` trotzdem einen Auth-gestützten Provider-Standard ableiten. Zuerst wird der aktuelle Standard-Provider versucht, dann die übrigen registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn du einen bestimmten Provider/ein bestimmtes Modell setzt, konfiguriere auch die Auth/API-Key dieses Providers.
- `agents.defaults.videoGenerationModel` wird von der gemeinsamen Videogenerierungsfunktion verwendet. Wenn es fehlt, kann `video_generate` trotzdem einen Auth-gestützten Provider-Standard ableiten. Zuerst wird der aktuelle Standard-Provider versucht, dann die übrigen registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge. Wenn du einen bestimmten Provider/ein bestimmtes Modell setzt, konfiguriere auch die Auth/API-Key dieses Providers.
- Standards pro Agent können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [/concepts/multi-agent](/de/concepts/multi-agent)).

## Kurze Modellrichtlinie

- Setze dein primäres Modell auf das stärkste Modell der neuesten Generation, das dir zur Verfügung steht.
- Verwende Fallbacks für kosten-/latenzsensible Aufgaben und Chat mit geringerer Kritikalität.
- Vermeide bei Agenten mit aktivierten Tools oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn du die Konfiguration nicht von Hand bearbeiten möchtest, führe das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Provider einrichten, einschließlich **OpenAI Code (Codex)
subscription** (OAuth) und **Anthropic** (API-Key oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliasse + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

Model-Refs werden zu Kleinbuchstaben normalisiert. Provider-Aliasse wie `z.ai/*` werden
zu `zai/*` normalisiert.

Beispiele für die Provider-Konfiguration (einschließlich OpenCode) findest du unter
[/providers/opencode](/de/providers/opencode).

### Sichere Bearbeitungen der Allowlist

Verwende additive Schreibvorgänge, wenn du `agents.defaults.models` von Hand aktualisierst:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine
einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder
`models.providers.<id>.models` wird abgelehnt, wenn dadurch bestehende
Einträge entfernt würden. Verwende `--merge` für additive Änderungen; verwende `--replace` nur,
wenn der bereitgestellte Wert zum vollständigen Zielwert werden soll.

Die interaktive Provider-Einrichtung und `openclaw configure --section model` mergen ebenfalls
providerbezogene Auswahlen in die bestehende Allowlist, sodass das Hinzufügen von Codex,
Ollama oder einem anderen Provider keine nicht zusammenhängenden Modelleinträge entfernt.
Configure behält ein bestehendes `agents.defaults.model.primary` bei, wenn die Provider-Auth
erneut angewendet wird. Explizite Befehle zum Setzen des Standards wie
`openclaw models auth login --provider <id> --set-default` und
`openclaw models set <model>` ersetzen weiterhin `agents.defaults.model.primary`.

## „Model is not allowed“ (und warum Antworten aufhören)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für
Sitzungs-Overrides. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist,
gibt OpenClaw zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Das passiert **bevor** eine normale Antwort generiert wird, daher kann sich die Nachricht so anfühlen,
als hätte sie „nicht geantwortet“. Die Lösung ist entweder:

- das Modell zu `agents.defaults.models` hinzuzufügen, oder
- die Allowlist zu leeren ( `agents.defaults.models` entfernen), oder
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

Du kannst Modelle für die aktuelle Sitzung wechseln, ohne neu zu starten:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Hinweise:

- `/model` (und `/model list`) ist ein kompakter nummerierter Picker (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell plus einem Submit-Schritt.
- `/models add` ist veraltet und gibt jetzt statt der Registrierung von Modellen aus dem Chat eine Deprecation-Nachricht zurück.
- `/model <#>` wählt aus diesem Picker aus.
- `/model` persistiert die neue Sitzungsauswahl sofort.
- Wenn der Agent untätig ist, verwendet der nächste Lauf das neue Modell sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen haben, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder zum nächsten Benutzer-Turn in der Warteschlange bleiben.
- `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).
- Model-Refs werden durch Aufteilen am **ersten** `/` geparst. Verwende `provider/model`, wenn du `/model <ref>` eingibst.
- Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), musst du den Provider-Präfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
- Wenn du den Provider weglässt, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
  1. Alias-Match
  2. eindeutiges Match für exakt diese Modell-ID ohne Präfix innerhalb der konfigurierten Provider
  3. veralteter Fallback auf den konfigurierten Standard-Provider
     Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw
     stattdessen auf das erste konfigurierte Provider-/Modellpaar zurück, um
     keinen veralteten entfernten Provider-Standard anzuzeigen.

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

`openclaw models` (ohne Unterbefehl) ist eine Kurzform für `models status`.

### `models list`

Zeigt standardmäßig konfigurierte Modelle an. Nützliche Flags:

- `--all`: vollständiger Katalog
- `--local`: nur lokale Provider
- `--provider <id>`: nach Provider-ID filtern, zum Beispiel `moonshot`; Anzeige-
  beschriftungen aus interaktiven Pickern werden nicht akzeptiert
- `--plain`: ein Modell pro Zeile
- `--json`: maschinenlesbare Ausgabe

`--all` enthält gebündelte, provider-eigene statische Katalogzeilen bereits vor der
Konfiguration der Auth, sodass rein auf Erkennung basierende Ansichten Modelle anzeigen können, die erst
nach dem Hinzufügen passender Provider-Zugangsdaten verfügbar sind.

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, Bildmodell und einen Auth-Überblick
über konfigurierte Provider an. Außerdem wird der Ablaufstatus von OAuth für im Auth-Store gefundene Profile angezeigt
(Standardwarnung innerhalb von 24 h). `--plain` gibt nur das
aufgelöste primäre Modell aus.
Der OAuth-Status wird immer angezeigt (und in die `--json`-Ausgabe aufgenommen). Wenn einem konfigurierten
Provider Zugangsdaten fehlen, gibt `models status` einen Abschnitt **Missing auth** aus.
JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers`
(effektive Auth pro Provider, einschließlich env-gestützter Zugangsdaten). `auth.oauth`
ist nur der Gesundheitszustand von Auth-Store-Profilen; reine env-Provider erscheinen dort nicht.
Verwende `--check` für Automatisierung (Exit `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
Verwende `--probe` für Live-Auth-Prüfungen; Probe-Zeilen können aus Auth-Profilen, env-
Zugangsdaten oder `models.json` stammen.
Wenn ein explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Probe
`excluded_by_auth_order`, anstatt es zu versuchen. Wenn Auth existiert, aber kein probebares
Modell für diesen Provider aufgelöst werden kann, meldet die Probe `status: no_model`.

Die Wahl der Auth hängt von Provider/Konto ab. Für Always-on-Gateway-Hosts sind API-
Keys normalerweise am vorhersehbarsten; Wiederverwendung von Claude CLI und vorhandene Anthropic-
OAuth-/Token-Profile werden ebenfalls unterstützt.

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scanning (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **Katalog kostenloser Modelle** von OpenRouter und kann
optional Modelle auf Tool- und Bildunterstützung testen.

Wichtige Flags:

- `--no-probe`: Live-Probes überspringen (nur Metadaten)
- `--min-params <b>`: Mindestgröße der Parameter (Milliarden)
- `--max-age-days <days>`: ältere Modelle überspringen
- `--provider <name>`: Filter für Provider-Präfix
- `--max-candidates <n>`: Größe der Fallback-Liste
- `--set-default`: `agents.defaults.model.primary` auf die erste Auswahl setzen
- `--set-image`: `agents.defaults.imageModel.primary` auf die erste Bild-Auswahl setzen

Der OpenRouter-Katalog `/models` ist öffentlich, daher können Scans nur mit Metadaten
kostenlose Kandidaten auch ohne Key auflisten. Probing und Inferenz erfordern weiterhin einen
OpenRouter-API-Key (aus Auth-Profilen oder `OPENROUTER_API_KEY`). Wenn kein Key
verfügbar ist, greift `openclaw models scan` auf eine reine Metadaten-Ausgabe zurück und lässt die
Konfiguration unverändert. Verwende `--no-probe`, um den Metadatenmodus explizit anzufordern.

Scan-Ergebnisse werden gerankt nach:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe

- OpenRouter-`/models`-Liste (Filter `:free`)
- Live-Probes erfordern OpenRouter-API-Key aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [/environment](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Request-/Probe-Steuerung: `--timeout`, `--concurrency`

Wenn Live-Probes in einem TTY laufen, kannst du Fallbacks interaktiv auswählen. Im
nicht interaktiven Modus übergib `--yes`, um die Standardwerte zu akzeptieren. Ergebnisse nur mit Metadaten sind
informativ; `--set-default` und `--set-image` erfordern Live-Probes, damit
OpenClaw kein unbenutzbares OpenRouter-Modell ohne Schlüssel konfiguriert.

## Modell-Registry (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` unter dem
Agent-Verzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei
wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

Vorrang bei Matching-Provider-IDs im Merge-Modus:

- Eine nicht leere `baseUrl`, die bereits in der Agent-`models.json` vorhanden ist, hat Vorrang.
- Ein nicht leerer `apiKey` in der Agent-`models.json` hat nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profil-Kontext nicht per SecretRef verwaltet wird.
- Per SecretRef verwaltete Provider-`apiKey`-Werte werden aus Quell-Markern aktualisiert (`ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs), anstatt aufgelöste Secrets zu persistieren.
- Per SecretRef verwaltete Provider-Header-Werte werden aus Quell-Markern aktualisiert (`secretref-env:ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs).
- Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` aus der Konfiguration zurück.
- Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

Die Persistierung von Markern ist quellenautoritatativ: OpenClaw schreibt Marker aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung), nicht aus aufgelösten Laufzeit-Secret-Werten.
Das gilt immer dann, wenn OpenClaw `models.json` neu erzeugt, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.

## Verwandt

- [Model Providers](/de/concepts/model-providers) — Provider-Routing und Auth
- [Agent Runtimes](/de/concepts/agent-runtimes) — PI, Codex und andere Laufzeiten der Agent-Schleife
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Image Generation](/de/tools/image-generation) — Bildmodell-Konfiguration
- [Music Generation](/de/tools/music-generation) — Musikmodell-Konfiguration
- [Video Generation](/de/tools/video-generation) — Videomodell-Konfiguration
- [Configuration Reference](/de/gateway/config-agents#agent-defaults) — Modell-Konfigurationsschlüssel
