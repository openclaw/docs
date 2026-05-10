---
read_when:
    - Hinzufügen oder Ändern der models-CLI (models list/set/scan/aliases/fallbacks)
    - Fallback-Verhalten oder Auswahl-UX für Modelle ändern
    - Modellscan-Probes aktualisieren (Tools/Bilder)
sidebarTitle: Models CLI
summary: 'Modelle-CLI: Auflisten, Festlegen, Aliasse, Fallbacks, Scannen, Status'
title: Modelle-CLI
x-i18n:
    generated_at: "2026-05-10T19:32:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Rotation von Authentifizierungsprofilen, Cooldowns und wie dies mit Fallbacks interagiert.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers">
    Kurzer Provider-Überblick und Beispiele.
  </Card>
  <Card title="Agent-Runtimes" href="/de/concepts/agent-runtimes">
    PI, Codex und andere Agent-Loop-Runtimes.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults">
    Modellkonfigurationsschlüssel.
  </Card>
</CardGroup>

Modell-Refs wählen einen Provider und ein Modell aus. Sie wählen normalerweise nicht die Low-Level-Agent-Runtime aus. OpenAI-Agent-Refs sind die wichtigste Ausnahme: `openai/gpt-5.5` läuft beim offiziellen OpenAI-Provider standardmäßig über die Codex-App-Server-Runtime. Explizite Runtime-Überschreibungen gehören in die Provider-/Modellrichtlinie, nicht auf den gesamten Agent oder die gesamte Sitzung. Im Codex-Runtime-Modus bedeutet die Ref `openai/gpt-*` keine API-Key-Abrechnung; die Authentifizierung kann von einem Codex-Konto oder einem `openai-codex`-Auth-Profil kommen. Siehe [Agent-Runtimes](/de/concepts/agent-runtimes).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

<Steps>
  <Step title="Primäres Modell">
    `agents.defaults.model.primary` (oder `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (in dieser Reihenfolge).
  </Step>
  <Step title="Provider-Auth-Failover">
    Auth-Failover erfolgt innerhalb eines Providers, bevor zum nächsten Modell gewechselt wird.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Verwandte Modelloberflächen">
    - `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliase). Verwenden Sie `provider/*`-Einträge, um sichtbare Provider einzuschränken und die Provider-Erkennung trotzdem dynamisch zu halten.
    - `agents.defaults.imageModel` wird **nur verwendet, wenn** das primäre Modell keine Bilder akzeptieren kann.
    - `agents.defaults.pdfModel` wird vom `pdf`-Tool verwendet. Wenn ausgelassen, fällt das Tool auf `agents.defaults.imageModel` zurück und danach auf das aufgelöste Sitzungs-/Standardmodell.
    - `agents.defaults.imageGenerationModel` wird von der gemeinsamen Bildgenerierungsfähigkeit verwendet. Wenn ausgelassen, kann `image_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, danach die übrigen registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Key dieses Providers.
    - `agents.defaults.musicGenerationModel` wird von der gemeinsamen Musikgenerierungsfähigkeit verwendet. Wenn ausgelassen, kann `music_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, danach die übrigen registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Key dieses Providers.
    - `agents.defaults.videoGenerationModel` wird von der gemeinsamen Videogenerierungsfähigkeit verwendet. Wenn ausgelassen, kann `video_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, danach die übrigen registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Key dieses Providers.
    - Agent-spezifische Standards können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [Multi-Agent-Routing](/de/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Auswahlquelle und Fallback-Verhalten

Dasselbe `provider/model` kann je nach Herkunft Unterschiedliches bedeuten:

- Konfigurierte Standards (`agents.defaults.model.primary` und Agent-spezifische primäre Modelle) sind der normale Ausgangspunkt und verwenden `agents.defaults.model.fallbacks`.
- Automatische Fallback-Auswahlen sind temporärer Wiederherstellungszustand. Sie werden mit `modelOverrideSource: "auto"` gespeichert, damit spätere Turns die Fallback-Kette weiter verwenden können, ohne zuerst ein bekanntermaßen fehlerhaftes primäres Modell zu prüfen.
- Benutzersitzungsauswahlen sind exakt. `/model`, der Modell-Picker, `session_status(model=...)` und `sessions.patch` speichern `modelOverrideSource: "user"`; wenn dieser ausgewählte Provider/dieses ausgewählte Modell nicht erreichbar ist, schlägt OpenClaw sichtbar fehl, statt auf ein anderes konfiguriertes Modell durchzufallen.
- Cron `--model` / Payload `model` ist ein primäres Modell pro Job. Es verwendet weiterhin konfigurierte Fallbacks, außer der Job liefert explizite Payload-`fallbacks` (verwenden Sie `fallbacks: []` für einen strikten Cron-Lauf).
- CLI-Standardmodell- und Allowlist-Picker berücksichtigen `models.mode: "replace"`, indem sie explizite `models.providers.*.models` auflisten, statt den vollständigen integrierten Katalog zu laden.
- Der Modell-Picker der Control UI fragt beim Gateway seine konfigurierte Modellansicht ab: `agents.defaults.models`, wenn vorhanden, einschließlich Provider-weiter `provider/*`-Einträge, andernfalls explizite `models.providers.*.models` plus Provider mit nutzbarer Authentifizierung. Der vollständige integrierte Katalog ist expliziten Browse-Ansichten wie `models.list` mit `view: "all"` oder `openclaw models list --all` vorbehalten.

## Schnelle Modellrichtlinie

- Setzen Sie Ihr primäres Modell auf das stärkste Modell der neuesten Generation, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzempfindliche Aufgaben und Chats mit geringerem Risiko.
- Vermeiden Sie für Tool-aktivierte Agents oder nicht vertrauenswürdige Eingaben ältere/schwächere Modellklassen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht manuell bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Authentifizierung für gängige Provider einrichten, einschließlich **OpenAI Code (Codex) subscription** (OAuth) und **Anthropic** (API-Key oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliase + Provider-Parameter + dynamische `provider/*`-Provider-Einträge)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

<Note>
Modell-Refs werden in Kleinschreibung normalisiert. Provider-Aliase wie `z.ai/*` werden zu `zai/*` normalisiert.

Provider-Konfigurationsbeispiele (einschließlich OpenCode) befinden sich in [OpenCode](/de/providers/opencode).
</Note>

### Sichere Allowlist-Bearbeitungen

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` manuell aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regeln zum Überschreibschutz">
    `openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder `models.providers.<id>.models` wird abgelehnt, wenn dadurch vorhandene Einträge entfernt würden. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur, wenn der angegebene Wert zum vollständigen Zielwert werden soll.

    Die interaktive Provider-Einrichtung und `openclaw configure --section model` führen Provider-spezifische Auswahlen ebenfalls mit der bestehenden Allowlist zusammen, sodass das Hinzufügen von Codex, Ollama oder einem anderen Provider keine nicht zugehörigen Modelleinträge entfernt. Configure behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Provider-Auth erneut angewendet wird. Explizite Befehle zum Setzen des Standards wie `openclaw models auth login --provider <id> --set-default` und `openclaw models set <model>` ersetzen weiterhin `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Modell ist nicht erlaubt" (und warum Antworten stoppen)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist, gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Dies geschieht **bevor** eine normale Antwort generiert wird, sodass sich die Nachricht anfühlen kann, als hätte sie "nicht geantwortet". Die Lösung ist eine der folgenden Optionen:

- Fügen Sie das Modell zu `agents.defaults.models` hinzu, oder
- Leeren Sie die Allowlist (entfernen Sie `agents.defaults.models`), oder
- Wählen Sie ein Modell aus `/model list`.

</Warning>

Wenn der abgelehnte Befehl eine Runtime-Überschreibung wie `/model openai/gpt-5.5 --runtime codex` enthielt, korrigieren Sie zuerst die Allowlist und versuchen Sie danach denselben Befehl `/model ... --runtime ...` erneut. Für native Codex-Ausführung ist das ausgewählte Modell weiterhin `openai/gpt-5.5`; die Runtime `codex` wählt das Harness aus und verwendet Codex-Auth separat.

Für lokale/GGUF-Modelle speichern Sie die vollständige Provider-präfixierte Ref in der Allowlist,
zum Beispiel `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` oder das
exakte `provider/model`, das von `openclaw models list --provider <provider>` angezeigt wird.
Bloße lokale Dateinamen oder Anzeigenamen reichen nicht aus, wenn die Allowlist
aktiv ist.

Wenn Sie Provider begrenzen möchten, ohne jedes Modell manuell aufzulisten, fügen Sie
`provider/*`-Einträge zu `agents.defaults.models` hinzu:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Mit dieser Richtlinie zeigen `/model`, `/models` und Modell-Picker den erkannten
Katalog nur für diese Provider an. Neue Modelle der ausgewählten Provider können
erscheinen, ohne die Allowlist zu bearbeiten. Exakte `provider/model`-Einträge können
mit `provider/*`-Einträgen gemischt werden, wenn Sie ein bestimmtes Modell eines anderen Providers benötigen.

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

<AccordionGroup>
  <Accordion title="Picker-Verhalten">
    - `/model` (und `/model list`) ist ein kompakter, nummerierter Picker (Modellfamilie + verfügbare Provider).
    - Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Provider- und Modell-Dropdowns plus einem Submit-Schritt.
    - Auf Telegram sind `/models`-Picker-Auswahlen sitzungsbezogen; sie ändern nicht den persistenten Standard des Agents in `openclaw.json`.
    - `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren.
    - `/model <#>` wählt aus diesem Picker aus.

  </Accordion>
  <Accordion title="Persistenz und Live-Wechsel">
    - `/model` speichert die neue Sitzungsauswahl sofort persistent.
    - Wenn der Agent im Leerlauf ist, verwendet der nächste Lauf sofort das neue Modell.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
    - Eine vom Benutzer ausgewählte `/model`-Ref ist für diese Sitzung strikt: Wenn der ausgewählte Provider/das ausgewählte Modell nicht erreichbar ist, schlägt die Antwort sichtbar fehl, statt stillschweigend aus `agents.defaults.model.fallbacks` zu antworten. Dies unterscheidet sich von konfigurierten Standards und primären Cron-Job-Modellen, die weiterhin Fallback-Ketten verwenden können.
    - `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).

  </Accordion>
  <Accordion title="Referenz-Parsing">
    - Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
    - Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), müssen Sie das Provider-Präfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
    - Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
      1. Alias-Übereinstimmung
      2. eindeutige Übereinstimmung mit einem konfigurierten Provider für genau diese Modell-ID ohne Präfix
      3. veralteter Fallback auf den konfigurierten Standard-Provider — wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw stattdessen auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, um zu vermeiden, dass ein veralteter Standard eines entfernten Providers sichtbar wird.
  </Accordion>
</AccordionGroup>

Vollständiges Befehlsverhalten/Konfiguration: [Slash-Befehle](/de/tools/slash-commands).

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

Zeigt standardmäßig konfigurierte/bei Authentifizierung verfügbare Modelle. Nützliche Flags:

<ParamField path="--all" type="boolean">
  Vollständiger Katalog. Enthält gebündelte, Provider-eigene statische Katalogzeilen, bevor die Authentifizierung konfiguriert ist, sodass reine Discovery-Ansichten Modelle anzeigen können, die erst verfügbar sind, nachdem Sie passende Provider-Anmeldedaten hinzugefügt haben.
</ParamField>
<ParamField path="--local" type="boolean">
  Nur lokale Provider.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Nach Provider-ID filtern, zum Beispiel `moonshot`. Anzeigebezeichnungen aus interaktiven Auswahllisten werden nicht akzeptiert.
</ParamField>
<ParamField path="--plain" type="boolean">
  Ein Modell pro Zeile.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare Ausgabe.
</ParamField>

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, das Bildmodell und eine Authentifizierungsübersicht der konfigurierten Provider. Außerdem wird der OAuth-Ablaufstatus für Profile angezeigt, die im Authentifizierungsspeicher gefunden wurden (standardmäßig Warnung innerhalb von 24 Stunden). `--plain` gibt nur das aufgelöste primäre Modell aus.

<AccordionGroup>
  <Accordion title="Authentifizierungs- und Prüfverhalten">
    - Der OAuth-Status wird immer angezeigt (und in der `--json`-Ausgabe enthalten). Wenn ein konfigurierter Provider keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Fehlende Authentifizierung** aus.
    - JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers` (effektive Authentifizierung pro Provider, einschließlich env-gestützter Anmeldedaten). `auth.oauth` beschreibt nur den Zustand von Authentifizierungsspeicher-Profilen; Provider, die ausschließlich über env konfiguriert sind, erscheinen dort nicht.
    - Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
    - Verwenden Sie `--probe` für Live-Authentifizierungsprüfungen; Prüfzeilen können aus Authentifizierungsprofilen, env-Anmeldedaten oder `models.json` stammen.
    - Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung `excluded_by_auth_order`, anstatt es zu versuchen. Wenn Authentifizierung vorhanden ist, aber für diesen Provider kein prüfbares Modell aufgelöst werden kann, meldet die Prüfung `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Die Wahl der Authentifizierung hängt vom Provider/Konto ab. Für dauerhaft laufende Gateway-Hosts sind API-Schlüssel normalerweise am vorhersehbarsten; die Wiederverwendung der Claude CLI und vorhandene Anthropic-OAuth-/Tokenprofile werden ebenfalls unterstützt.
</Note>

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scannen (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **kostenlosen Modellkatalog** von OpenRouter und kann Modelle optional auf Tool- und Bildunterstützung prüfen.

<ParamField path="--no-probe" type="boolean">
  Live-Prüfungen überspringen (nur Metadaten).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Mindestparametergröße (Milliarden).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Ältere Modelle überspringen.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filter für Provider-Präfix.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Größe der Fallback-Liste.
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` auf die erste Auswahl setzen.
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` auf die erste Bildauswahl setzen.
</ParamField>

<Note>
Der OpenRouter-Katalog `/models` ist öffentlich, daher können reine Metadaten-Scans kostenlose Kandidaten ohne Schlüssel auflisten. Prüfungen und Inferenz erfordern weiterhin einen OpenRouter-API-Schlüssel (aus Authentifizierungsprofilen oder `OPENROUTER_API_KEY`). Wenn kein Schlüssel verfügbar ist, fällt `openclaw models scan` auf eine Ausgabe nur mit Metadaten zurück und lässt die Konfiguration unverändert. Verwenden Sie `--no-probe`, um den Nur-Metadaten-Modus ausdrücklich anzufordern.
</Note>

Scan-Ergebnisse werden nach Folgendem sortiert:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe:

- OpenRouter-Liste `/models` (Filter `:free`)
- Live-Prüfungen erfordern einen OpenRouter-API-Schlüssel aus Authentifizierungsprofilen oder `OPENROUTER_API_KEY` (siehe [Umgebungsvariablen](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Anfrage-/Prüfsteuerung: `--timeout`, `--concurrency`

Wenn Live-Prüfungen in einem TTY ausgeführt werden, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven Modus übergeben Sie `--yes`, um Standards zu akzeptieren. Ergebnisse nur mit Metadaten dienen zur Information; `--set-default` und `--set-image` erfordern Live-Prüfungen, damit OpenClaw kein nicht nutzbares OpenRouter-Modell ohne Schlüssel konfiguriert.

## Modell-Registry (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` im Agent-Verzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

<AccordionGroup>
  <Accordion title="Rangfolge im Zusammenführungsmodus">
    Rangfolge im Zusammenführungsmodus für übereinstimmende Provider-IDs:

    - Eine nicht leere `baseUrl`, die bereits in der Agent-`models.json` vorhanden ist, gewinnt.
    - Ein nicht leerer `apiKey` in der Agent-`models.json` gewinnt nur, wenn dieser Provider im aktuellen Konfigurations-/Authentifizierungsprofil-Kontext nicht SecretRef-verwaltet ist.
    - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkierungen (`ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert, anstatt aufgelöste Secrets dauerhaft zu speichern.
    - SecretRef-verwaltete Provider-Headerwerte werden aus Quellmarkierungen aktualisiert (`secretref-env:ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen).
    - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf Konfigurationswerte aus `models.providers` zurück.
    - Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

<Note>
Die Marker-Persistenz ist quellenautoritativ: OpenClaw schreibt Marker aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten Laufzeit-Secret-Werten. Dies gilt immer dann, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.
</Note>

## Verwandte Themen

- [Agent-Laufzeiten](/de/concepts/agent-runtimes) — Pi, Codex und andere Agent-Loop-Laufzeiten
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modellkonfigurationsschlüssel
- [Bildgenerierung](/de/tools/image-generation) — Bildmodellkonfiguration
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Authentifizierung
- [Musikgenerierung](/de/tools/music-generation) — Musikmodellkonfiguration
- [Videogenerierung](/de/tools/video-generation) — Videomodellkonfiguration
