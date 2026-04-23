---
read_when:
    - Hinzufügen oder Ändern der Models-CLI (`models list/set/scan/aliases/fallbacks`)
    - Ändern des Verhaltens von Modell-Fallbacks oder der UX für die Modellauswahl
    - Aktualisieren von Modell-Scan-Prüfungen (Tools/Bilder)
summary: 'Models-CLI: auflisten, festlegen, Aliase, Fallbacks, scannen, Status'
title: Models-CLI
x-i18n:
    generated_at: "2026-04-23T06:28:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# Models-CLI

Siehe [/concepts/model-failover](/de/concepts/model-failover) für die Rotation von Auth-Profilen,
Cooldowns und deren Zusammenspiel mit Fallbacks.
Kurzer Provider-Überblick + Beispiele: [/concepts/model-providers](/de/concepts/model-providers).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

1. **Primäres** Modell (`agents.defaults.model.primary` oder `agents.defaults.model`).
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in Reihenfolge).
3. **Provider-Auth-Failover** erfolgt innerhalb eines Providers, bevor zum
   nächsten Modell gewechselt wird.

Verwandt:

- `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliase).
- `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das primäre Modell keine Bilder akzeptieren kann.
- `agents.defaults.pdfModel` wird vom Tool `pdf` verwendet. Wenn es weggelassen wird, greift das Tool auf `agents.defaults.imageModel` zurück, dann auf das aufgelöste Sitzungs-/Standardmodell.
- `agents.defaults.imageGenerationModel` wird von der gemeinsamen Bildgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `image_generate` dennoch einen Auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Bildgenerierungs-Provider in der Reihenfolge der Provider-IDs. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/den API-Schlüssel dieses Providers.
- `agents.defaults.musicGenerationModel` wird von der gemeinsamen Musikgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `music_generate` dennoch einen Auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Musikgenerierungs-Provider in der Reihenfolge der Provider-IDs. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/den API-Schlüssel dieses Providers.
- `agents.defaults.videoGenerationModel` wird von der gemeinsamen Videogenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `video_generate` dennoch einen Auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Videogenerierungs-Provider in der Reihenfolge der Provider-IDs. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/den API-Schlüssel dieses Providers.
- Standards pro Agent können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [/concepts/multi-agent](/de/concepts/multi-agent)).

## Kurze Modellrichtlinie

- Setzen Sie Ihr primäres Modell auf das stärkste Modell der neuesten Generation, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzsensitive Aufgaben und weniger kritische Chats.
- Vermeiden Sie bei Tool-aktivierten Agents oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht von Hand bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Provider einrichten, einschließlich **OpenAI Code (Codex)
subscription** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliase + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

Modell-Refs werden zu Kleinbuchstaben normalisiert. Provider-Aliase wie `z.ai/*` werden zu
`zai/*` normalisiert.

Beispiele für Provider-Konfigurationen (einschließlich OpenCode) finden Sie unter
[/providers/opencode](/de/providers/opencode).

### Sichere Bearbeitungen der Allowlist

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` von Hand aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine
normale Objektzuweisung an `agents.defaults.models`, `models.providers` oder
`models.providers.<id>.models` wird abgelehnt, wenn dadurch vorhandene
Einträge entfernt würden. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur dann, wenn der bereitgestellte Wert zum vollständigen Zielwert werden soll.

Interaktive Provider-Einrichtung und `openclaw configure --section model` führen ebenfalls
providerbezogene Auswahlen in die bestehende Allowlist zusammen, sodass das Hinzufügen von Codex,
Ollama oder einem anderen Provider keine nicht zusammenhängenden Modelleinträge entfernt.

## „Model is not allowed“ (und warum Antworten ausbleiben)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für
Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist,
gibt OpenClaw zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dies geschieht **bevor** eine normale Antwort erzeugt wird, daher kann sich die Nachricht so anfühlen,
als hätte sie „nicht geantwortet“. Die Lösung besteht darin, entweder:

- das Modell zu `agents.defaults.models` hinzuzufügen, oder
- die Allowlist zu leeren (`agents.defaults.models` entfernen), oder
- ein Modell aus `/model list` auszuwählen.

Beispielkonfiguration für eine Allowlist:

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

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Hinweise:

- `/model` (und `/model list`) ist ein kompakter, nummerierter Picker (Modellfamilie + verfügbare Provider).
- Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell plus einem Absenden-Schritt.
- `/models add` ist standardmäßig verfügbar und kann mit `commands.modelsWrite=false` deaktiviert werden.
- Wenn aktiviert, ist `/models add <provider> <modelId>` der schnellste Weg; ein bloßes `/models add` startet, wo unterstützt, einen geführten Ablauf mit Provider-Auswahl zuerst.
- Nach `/models add` ist das neue Modell ohne Neustart des Gateways in `/models` und `/model` verfügbar.
- `/model <#>` wählt aus diesem Picker aus.
- `/model` speichert die neue Sitzungsauswahl sofort.
- Wenn der Agent inaktiv ist, verwendet der nächste Lauf sofort das neue Modell.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt in das neue Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen haben, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
- `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, `baseUrl` + `api`-Modus des Provider-Endpunkts).
- Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
- Wenn die Modell-ID selbst `/` enthält (im Stil von OpenRouter), müssen Sie das Provider-Präfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
  1. Alias-Treffer
  2. eindeutiger Treffer eines konfigurierten Providers für genau diese Modell-ID ohne Präfix
  3. veralteter Fallback auf den konfigurierten Standard-Provider
     Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw stattdessen auf das erste konfigurierte Provider-/Modellpaar zurück, um zu vermeiden, dass ein veralteter, entfernter Provider-Standard angezeigt wird.

Vollständiges Befehlsverhalten/Konfiguration: [Slash commands](/de/tools/slash-commands).

Beispiele:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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
- `--provider <id>`: nach Provider-ID filtern, zum Beispiel `moonshot`; Anzeige-
  labels aus interaktiven Pickern werden nicht akzeptiert
- `--plain`: ein Modell pro Zeile
- `--json`: maschinenlesbare Ausgabe

`--all` enthält gebündelte, provider-eigene statische Katalogzeilen, bevor Auth
konfiguriert ist, sodass reine Discovery-Ansichten Modelle anzeigen können, die erst verfügbar sind, wenn
Sie passende Provider-Anmeldedaten hinzufügen.

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, Bildmodell und einen Auth-Überblick
konfigurierter Provider an. Es zeigt außerdem den OAuth-Ablaufstatus für im Auth-Store gefundene Profile an
(warnt standardmäßig innerhalb von 24h). `--plain` druckt nur das
aufgelöste primäre Modell.
Der OAuth-Status wird immer angezeigt (und in die Ausgabe von `--json` aufgenommen). Wenn ein konfigurierter
Provider keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Missing auth** aus.
JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers`
(effektive Auth pro Provider, einschließlich env-gestützter Anmeldedaten). `auth.oauth`
ist nur der Gesundheitszustand von Auth-Store-Profilen; reine env-Provider erscheinen dort nicht.
Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlenden/abgelaufenen, `2` bei bald ablaufenden Daten).
Verwenden Sie `--probe` für Live-Auth-Prüfungen; Probe-Zeilen können aus Auth-Profilen, env-
Anmeldedaten oder `models.json` stammen.
Wenn `auth.order.<provider>` explizit ein gespeichertes Profil auslässt, meldet die Probe
`excluded_by_auth_order`, statt es zu versuchen. Wenn Auth existiert, aber kein probefähiges
Modell für diesen Provider aufgelöst werden kann, meldet die Probe `status: no_model`.

Die Wahl der Auth hängt vom Provider/Konto ab. Für Gateway-Hosts, die ständig laufen, sind API-
Schlüssel in der Regel am vorhersehbarsten; Wiederverwendung der Claude CLI und vorhandene Anthropic-
OAuth-/Token-Profile werden ebenfalls unterstützt.

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scannen (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **kostenlosen Modellkatalog** von OpenRouter und kann
optional Modelle auf Tool- und Bildunterstützung prüfen.

Wichtige Flags:

- `--no-probe`: Live-Prüfungen überspringen (nur Metadaten)
- `--min-params <b>`: minimale Parametergröße (Milliarden)
- `--max-age-days <days>`: ältere Modelle überspringen
- `--provider <name>`: Filter nach Provider-Präfix
- `--max-candidates <n>`: Größe der Fallback-Liste
- `--set-default`: `agents.defaults.model.primary` auf die erste Auswahl setzen
- `--set-image`: `agents.defaults.imageModel.primary` auf die erste Bildauswahl setzen

Prüfungen erfordern einen OpenRouter-API-Schlüssel (aus Auth-Profilen oder
`OPENROUTER_API_KEY`). Ohne Schlüssel verwenden Sie `--no-probe`, um nur Kandidaten aufzulisten.

Scan-Ergebnisse werden wie folgt gerankt:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe

- OpenRouter-`/models`-Liste (Filter `:free`)
- Erfordert einen OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [/environment](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Prüfsteuerungen: `--timeout`, `--concurrency`

Wenn der Befehl in einem TTY ausgeführt wird, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven
Modus übergeben Sie `--yes`, um die Standardwerte zu akzeptieren.

## Modellregister (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` unter dem
Agent-Verzeichnis geschrieben (Standard: `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei
wird standardmäßig zusammengeführt, es sei denn, `models.mode` ist auf `replace` gesetzt.

Vorrang im Merge-Modus für übereinstimmende Provider-IDs:

- Bereits vorhandenes nicht leeres `baseUrl` in der `models.json` des Agent hat Vorrang.
- Ein nicht leeres `apiKey` in der `models.json` des Agent hat nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profile-Kontext nicht über SecretRef verwaltet wird.
- Über SecretRef verwaltete Provider-`apiKey`-Werte werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs), statt aufgelöste Secrets zu persistieren.
- Über SecretRef verwaltete Provider-Headerwerte werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs).
- Leere oder fehlende `apiKey`/`baseUrl` des Agent greifen auf `models.providers` aus der Konfiguration zurück.
- Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

Die Persistenz von Markern ist quellautoritativ: OpenClaw schreibt Marker aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten Laufzeit-Secret-Werten.
Das gilt immer dann, wenn OpenClaw `models.json` neu erzeugt, einschließlich befehlsgetriebener Pfade wie `openclaw agent`.

## Verwandt

- [Model Providers](/de/concepts/model-providers) — Provider-Routing und Auth
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Image Generation](/de/tools/image-generation) — Konfiguration von Bildmodellen
- [Music Generation](/de/tools/music-generation) — Konfiguration von Musikmodellen
- [Video Generation](/de/tools/video-generation) — Konfiguration von Videomodellen
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Modell-Konfigurationsschlüssel
