---
read_when:
    - Hinzufügen oder Ändern der Models CLI (`models list/set/scan/aliases/fallbacks`)
    - Ändern des Modell-Fallback-Verhaltens oder der Auswahl-UX
    - Aktualisieren von Modell-Scan-Probes (Tools/Bilder)
summary: 'Models CLI: auflisten, festlegen, Aliasse, Fallbacks, Scan, Status'
title: Models CLI
x-i18n:
    generated_at: "2026-04-06T03:07:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 299602ccbe0c3d6bbdb2deab22bc60e1300ef6843ed0b8b36be574cc0213c155
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

Siehe [/concepts/model-failover](/de/concepts/model-failover) für die Rotation von
Authentifizierungsprofilen, Cooldowns und wie dies mit Fallbacks interagiert.
Kurzer Überblick über Anbieter + Beispiele: [/concepts/model-providers](/de/concepts/model-providers).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

1. **Primäres** Modell (`agents.defaults.model.primary` oder `agents.defaults.model`).
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in Reihenfolge).
3. **Provider-Auth-Failover** findet innerhalb eines Anbieters statt, bevor zum
   nächsten Modell gewechselt wird.

Verwandt:

- `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliasse).
- `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das primäre Modell keine Bilder akzeptieren kann.
- `agents.defaults.pdfModel` wird vom `pdf`-Tool verwendet. Wenn es weggelassen wird, greift das Tool auf `agents.defaults.imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `agents.defaults.imageGenerationModel` wird von der gemeinsamen Bildgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `image_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die übrigen registrierten Bildgenerierungsanbieter in der Reihenfolge ihrer Provider-IDs. Wenn Sie einen bestimmten Anbieter/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung bzw. den API-Schlüssel dieses Anbieters.
- `agents.defaults.musicGenerationModel` wird von der gemeinsamen Musikgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `music_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die übrigen registrierten Musikgenerierungsanbieter in der Reihenfolge ihrer Provider-IDs. Wenn Sie einen bestimmten Anbieter/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung bzw. den API-Schlüssel dieses Anbieters.
- `agents.defaults.videoGenerationModel` wird von der gemeinsamen Videogenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `video_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die übrigen registrierten Videogenerierungsanbieter in der Reihenfolge ihrer Provider-IDs. Wenn Sie einen bestimmten Anbieter/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung bzw. den API-Schlüssel dieses Anbieters.
- Standards pro Agent können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [/concepts/multi-agent](/de/concepts/multi-agent)).

## Kurze Modellrichtlinie

- Setzen Sie Ihr primäres Modell auf das stärkste Modell der neuesten Generation, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzsensitive Aufgaben und Chat mit geringerer Relevanz.
- Vermeiden Sie bei toolfähigen Agenten oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht von Hand bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Anbieter einrichten, darunter **OpenAI Code (Codex)
subscription** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliasse + Provider-Parameter)
- `models.providers` (benutzerdefinierte Anbieter, die in `models.json` geschrieben werden)

Modellreferenzen werden auf Kleinbuchstaben normalisiert. Provider-Aliasse wie `z.ai/*` werden
zu `zai/*` normalisiert.

Beispiele für die Anbieterkonfiguration (einschließlich OpenCode) finden Sie unter
[/providers/opencode](/de/providers/opencode).

## „Model is not allowed“ (und warum Antworten stoppen)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für
Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist,
gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Dies geschieht **bevor** eine normale Antwort generiert wird, daher kann sich die Nachricht so anfühlen,
als hätte es „nicht geantwortet“. Die Lösung besteht darin:

- das Modell zu `agents.defaults.models` hinzuzufügen, oder
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

- `/model` (und `/model list`) ist ein kompakter, nummerierter Auswahldialog (Modellfamilie + verfügbare Anbieter).
- In Discord öffnen `/model` und `/models` einen interaktiven Auswahldialog mit Dropdowns für Anbieter und Modell plus einem Schritt zum Absenden.
- `/model <#>` wählt aus diesem Auswahldialog aus.
- `/model` speichert die neue Sitzungsauswahl sofort.
- Wenn der Agent inaktiv ist, verwendet der nächste Lauf das neue Modell sofort.
- Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungszeitpunkt mit dem neuen Modell neu.
- Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zur nächsten Benutzereingabe in der Warteschlange bleiben.
- `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).
- Modellreferenzen werden geparst, indem am **ersten** `/` getrennt wird. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
- Wenn die Modell-ID selbst ein `/` enthält (im OpenRouter-Stil), müssen Sie das Anbieterpräfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Anbieter weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
  1. Alias-Treffer
  2. eindeutiger Treffer eines konfigurierten Anbieters für genau diese nicht präfixierte Modell-ID
  3. veralteter Fallback auf den konfigurierten Standardanbieter
     Wenn dieser Anbieter das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw stattdessen auf das erste konfigurierte Anbieter-/Modellpaar zurück, um nicht einen veralteten entfernten Provider-Standard anzuzeigen.

Vollständiges Befehlsverhalten/-konfiguration: [Slash-Befehle](/de/tools/slash-commands).

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
- `--local`: nur lokale Anbieter
- `--provider <name>`: nach Anbieter filtern
- `--plain`: ein Modell pro Zeile
- `--json`: maschinenlesbare Ausgabe

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, Bildmodell und einen Auth-Überblick
über konfigurierte Anbieter an. Außerdem wird der Ablaufstatus von OAuth für Profile im
Auth-Speicher angezeigt (standardmäßig Warnung innerhalb von 24 h). `--plain` gibt nur das
aufgelöste primäre Modell aus.
Der OAuth-Status wird immer angezeigt (und ist in der `--json`-Ausgabe enthalten). Wenn ein konfigurierter
Anbieter keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Missing auth** aus.
JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers`
(effektive Auth pro Anbieter, einschließlich umgebungsvariablenbasierter Anmeldedaten). `auth.oauth`
bezieht sich nur auf den Profilzustand des Auth-Speichers; Anbieter, die nur über Umgebungsvariablen konfiguriert sind, erscheinen dort nicht.
Verwenden Sie `--check` für Automatisierung (Exit-Code `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
Verwenden Sie `--probe` für Live-Auth-Prüfungen; Probe-Zeilen können aus Auth-Profilen, Umgebungsvariablen-
Anmeldedaten oder `models.json` stammen.
Wenn ein explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Probe
`excluded_by_auth_order`, statt es zu versuchen. Wenn Auth vorhanden ist, aber kein probefähiges
Modell für diesen Anbieter aufgelöst werden kann, meldet die Probe `status: no_model`.

Die Auth-Auswahl hängt von Anbieter/Konto ab. Für Gateway-Hosts, die immer aktiv sind, sind API-
Schlüssel in der Regel am vorhersehbarsten; die Wiederverwendung von Claude CLI und vorhandene Anthropic-
OAuth-/Token-Profile werden ebenfalls unterstützt.

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scan (kostenlose OpenRouter-Modelle)

`openclaw models scan` untersucht den **Katalog kostenloser Modelle** von OpenRouter und kann
optional Modelle auf Tool- und Bildunterstützung prüfen.

Wichtige Flags:

- `--no-probe`: Live-Probes überspringen (nur Metadaten)
- `--min-params <b>`: minimale Parametergröße (Milliarden)
- `--max-age-days <days>`: ältere Modelle überspringen
- `--provider <name>`: Filter für Anbieterpräfix
- `--max-candidates <n>`: Größe der Fallback-Liste
- `--set-default`: `agents.defaults.model.primary` auf die erste Auswahl setzen
- `--set-image`: `agents.defaults.imageModel.primary` auf die erste Bildauswahl setzen

Für Probing ist ein OpenRouter-API-Schlüssel erforderlich (aus Auth-Profilen oder
`OPENROUTER_API_KEY`). Ohne Schlüssel verwenden Sie `--no-probe`, um nur Kandidaten aufzulisten.

Scan-Ergebnisse werden sortiert nach:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe

- OpenRouter-Liste `/models` (Filter `:free`)
- Erfordert einen OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [/environment](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Probe-Steuerung: `--timeout`, `--concurrency`

Wenn der Befehl in einem TTY ausgeführt wird, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven
Modus übergeben Sie `--yes`, um die Standardwerte zu übernehmen.

## Modellregister (`models.json`)

Benutzerdefinierte Anbieter in `models.providers` werden unter dem
Agent-Verzeichnis in `models.json` geschrieben (standardmäßig `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei
wird standardmäßig zusammengeführt, es sei denn, `models.mode` ist auf `replace` gesetzt.

Priorität im Merge-Modus für übereinstimmende Anbieter-IDs:

- Bereits vorhandenes nicht leeres `baseUrl` in der `models.json` des Agenten hat Vorrang.
- Nicht leeres `apiKey` in der `models.json` des Agenten hat nur dann Vorrang, wenn dieser Anbieter im aktuellen Kontext von Konfiguration/Auth-Profil nicht SecretRef-verwaltet ist.
- `apiKey`-Werte von SecretRef-verwalteten Anbietern werden anhand von Quellmarkierungen aktualisiert (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs), statt aufgelöste Geheimnisse dauerhaft zu speichern.
- Header-Werte von SecretRef-verwalteten Anbietern werden anhand von Quellmarkierungen aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs).
- Leeres oder fehlendes `apiKey`/`baseUrl` des Agenten greift auf `models.providers` aus der Konfiguration zurück.
- Andere Anbieterfelder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

Die Persistenz von Markierungen ist quellenautoritativ: OpenClaw schreibt Markierungen aus dem aktiven Konfigurations-Snapshot der Quelle (vor der Auflösung), nicht aus aufgelösten Laufzeit-Geheimwerten.
Dies gilt immer dann, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.

## Verwandt

- [Model Providers](/de/concepts/model-providers) — Provider-Routing und Auth
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Image Generation](/de/tools/image-generation) — Konfiguration von Bildmodellen
- [Music Generation](/tools/music-generation) — Konfiguration von Musikmodellen
- [Video Generation](/tools/video-generation) — Konfiguration von Videomodellen
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Konfigurationsschlüssel für Modelle
