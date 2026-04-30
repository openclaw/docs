---
read_when:
    - Modelle-CLI hinzufügen oder ändern (models list/set/scan/aliases/fallbacks)
    - Ändern des Fallback-Verhaltens von Modellen oder der Auswahl-UX
    - Aktualisieren der Modellscan-Prüfungen (Tools/Bilder)
sidebarTitle: Models CLI
summary: 'Modelle-CLI: list, set, aliases, fallbacks, scan, status'
title: Modelle-CLI
x-i18n:
    generated_at: "2026-04-30T06:49:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Rotation von Auth-Profilen, Cooldowns und wie dies mit Fallbacks zusammenwirkt.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers">
    Kurzer Provider-Überblick und Beispiele.
  </Card>
  <Card title="Agent-Runtimes" href="/de/concepts/agent-runtimes">
    PI, Codex und andere Agent-Loop-Runtimes.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults">
    Modell-Konfigurationsschlüssel.
  </Card>
</CardGroup>

Modell-Refs wählen einen Provider und ein Modell aus. Sie wählen normalerweise nicht die Low-Level-Agent-Runtime aus. Beispielsweise kann `openai/gpt-5.5` je nach `agents.defaults.agentRuntime.id` über den normalen OpenAI-Provider-Pfad oder über die Codex-App-Server-Runtime ausgeführt werden. Siehe [Agent-Runtimes](/de/concepts/agent-runtimes).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

<Steps>
  <Step title="Primäres Modell">
    `agents.defaults.model.primary` (oder `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (in der Reihenfolge).
  </Step>
  <Step title="Provider-Auth-Failover">
    Auth-Failover erfolgt innerhalb eines Providers, bevor zum nächsten Modell gewechselt wird.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Verwandte Modelloberflächen">
    - `agents.defaults.models` ist die Allowlist/der Katalog von Modellen, die OpenClaw verwenden kann (plus Aliasse).
    - `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das primäre Modell keine Bilder akzeptieren kann.
    - `agents.defaults.pdfModel` wird vom `pdf`-Tool verwendet. Wenn es ausgelassen wird, fällt das Tool auf `agents.defaults.imageModel` zurück, dann auf das aufgelöste Sitzungs-/Standardmodell.
    - `agents.defaults.imageGenerationModel` wird von der gemeinsamen Bildgenerierungsfunktion verwendet. Wenn es ausgelassen wird, kann `image_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.musicGenerationModel` wird von der gemeinsamen Musikgenerierungsfunktion verwendet. Wenn es ausgelassen wird, kann `music_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.videoGenerationModel` wird von der gemeinsamen Videogenerierungsfunktion verwendet. Wenn es ausgelassen wird, kann `video_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - Agent-spezifische Standards können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [Multi-Agent-Routing](/de/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Auswahlquelle und Fallback-Verhalten

Dasselbe `provider/model` kann je nach Herkunft unterschiedliche Bedeutungen haben:

- Konfigurierte Standards (`agents.defaults.model.primary` und Agent-spezifische Primärmodelle) sind der normale Ausgangspunkt und verwenden `agents.defaults.model.fallbacks`.
- Automatische Fallback-Auswahlen sind ein temporärer Wiederherstellungszustand. Sie werden mit `modelOverrideSource: "auto"` gespeichert, damit spätere Turns die Fallback-Kette weiterverwenden können, ohne zuerst ein bekanntermaßen fehlerhaftes Primärmodell zu prüfen.
- Benutzersitzungs-Auswahlen sind exakt. `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` speichern `modelOverrideSource: "user"`; wenn dieser ausgewählte Provider/dieses Modell nicht erreichbar ist, schlägt OpenClaw sichtbar fehl, statt auf ein anderes konfiguriertes Modell durchzufallen.
- Cron `--model` / Payload `model` ist ein Primärmodell pro Job. Es verwendet weiterhin konfigurierte Fallbacks, es sei denn, der Job liefert explizite Payload-`fallbacks` (verwenden Sie `fallbacks: []` für einen strikten Cron-Lauf).
- CLI-Standardmodell- und Allowlist-Auswahlen respektieren `models.mode: "replace"`, indem sie explizite `models.providers.*.models` auflisten, statt den vollständigen integrierten Katalog zu laden.
- Die Control-UI-Modellauswahl fragt beim Gateway die konfigurierte Modellansicht ab: `agents.defaults.models`, wenn vorhanden, andernfalls explizite `models.providers.*.models` plus Provider mit nutzbarer Authentifizierung. Der vollständige integrierte Katalog ist expliziten Browse-Ansichten wie `models.list` mit `view: "all"` oder `openclaw models list --all` vorbehalten.

## Kurze Modellrichtlinie

- Setzen Sie Ihr Primärmodell auf das stärkste Modell der neuesten Generation, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzempfindliche Aufgaben und Chat mit geringerem Risiko.
- Vermeiden Sie bei Tool-fähigen Agents oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht manuell bearbeiten möchten, führen Sie Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Authentifizierung für gängige Provider einrichten, einschließlich **OpenAI Code (Codex) subscription** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliasse + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

<Note>
Modell-Refs werden in Kleinbuchstaben normalisiert. Provider-Aliasse wie `z.ai/*` werden zu `zai/*` normalisiert.

Provider-Konfigurationsbeispiele (einschließlich OpenCode) befinden sich unter [OpenCode](/de/providers/opencode).
</Note>

### Sichere Allowlist-Bearbeitungen

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` manuell aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Clobber-Schutzregeln">
    `openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder `models.providers.<id>.models` wird abgelehnt, wenn sie vorhandene Einträge entfernen würde. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur, wenn der bereitgestellte Wert zum vollständigen Zielwert werden soll.

    Interaktive Provider-Einrichtung und `openclaw configure --section model` führen Provider-bezogene Auswahlen ebenfalls in die vorhandene Allowlist zusammen, sodass das Hinzufügen von Codex, Ollama oder einem anderen Provider keine nicht verwandten Modelleinträge entfernt. Configure behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Provider-Auth erneut angewendet wird. Explizite Befehle zum Setzen des Standards wie `openclaw models auth login --provider <id> --set-default` und `openclaw models set <model>` ersetzen weiterhin `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model is not allowed“ (und warum Antworten stoppen)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist, gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Dies passiert, **bevor** eine normale Antwort generiert wird, sodass es so wirken kann, als hätte die Nachricht „nicht geantwortet“. Die Lösung besteht darin, entweder:

- das Modell zu `agents.defaults.models` hinzuzufügen oder
- die Allowlist zu leeren (`agents.defaults.models` entfernen) oder
- ein Modell aus `/model list` auszuwählen.

</Warning>

Speichern Sie bei lokalen/GGUF-Modellen die vollständige Provider-präfixierte Ref in der Allowlist,
zum Beispiel `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` oder die
exakte Provider-/Modellangabe, die von `openclaw models list --provider <provider>` angezeigt wird.
Bloße lokale Dateinamen oder Anzeigenamen reichen nicht aus, wenn die Allowlist
aktiv ist.

Beispiel-Allowlist-Konfiguration:

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

Sie können Modelle für die aktuelle Sitzung ohne Neustart wechseln:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Auswahlverhalten">
    - `/model` (und `/model list`) ist eine kompakte, nummerierte Auswahl (Modellfamilie + verfügbare Provider).
    - Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und Modell-Dropdowns sowie einem Submit-Schritt.
    - `/models add` ist veraltet und gibt jetzt eine Veraltungsnachricht zurück, statt Modelle aus dem Chat zu registrieren.
    - `/model <#>` wählt aus dieser Auswahl aus.

  </Accordion>
  <Accordion title="Persistenz und Live-Wechsel">
    - `/model` persistiert die neue Sitzungsauswahl sofort.
    - Wenn der Agent im Leerlauf ist, verwendet der nächste Lauf das neue Modell sofort.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Retry-Punkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Retry-Gelegenheit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
    - Eine vom Benutzer ausgewählte `/model`-Ref ist für diese Sitzung strikt: Wenn der ausgewählte Provider/das ausgewählte Modell nicht erreichbar ist, schlägt die Antwort sichtbar fehl, statt stillschweigend aus `agents.defaults.model.fallbacks` zu antworten. Dies unterscheidet sich von konfigurierten Standards und Cron-Job-Primärmodellen, die weiterhin Fallback-Ketten verwenden können.
    - `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).

  </Accordion>
  <Accordion title="Ref-Parsing">
    - Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
    - Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), müssen Sie das Provider-Präfix einschließen (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
    - Wenn Sie den Provider auslassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
      1. Alias-Treffer
      2. eindeutiger Treffer eines konfigurierten Providers für genau diese Modell-ID ohne Präfix
      3. veralteter Fallback auf den konfigurierten Standard-Provider — wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw stattdessen auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, um zu vermeiden, dass ein veralteter Standard eines entfernten Providers angezeigt wird.
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

`openclaw models` (ohne Unterbefehl) ist eine Abkürzung für `models status`.

### `models list`

Zeigt standardmäßig konfigurierte/auth-verfügbare Modelle. Nützliche Flags:

<ParamField path="--all" type="boolean">
  Vollständiger Katalog. Enthält gebündelte, Provider-eigene statische Katalogzeilen, bevor Authentifizierung konfiguriert ist, sodass reine Discovery-Ansichten Modelle anzeigen können, die nicht verfügbar sind, bis Sie passende Provider-Anmeldedaten hinzufügen.
</ParamField>
<ParamField path="--local" type="boolean">
  Nur lokale Provider.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Nach Provider-ID filtern, zum Beispiel `moonshot`. Anzeigelabels aus interaktiven Auswahlen werden nicht akzeptiert.
</ParamField>
<ParamField path="--plain" type="boolean">
  Ein Modell pro Zeile.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare Ausgabe.
</ParamField>

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, Bildmodell und eine Authentifizierungsübersicht der konfigurierten Provider. Außerdem wird der OAuth-Ablaufstatus für Profile angezeigt, die im Auth-Speicher gefunden wurden (standardmäßig Warnung innerhalb von 24 Stunden). `--plain` gibt nur das aufgelöste primäre Modell aus.

<AccordionGroup>
  <Accordion title="Authentifizierungs- und Prüfverhalten">
    - Der OAuth-Status wird immer angezeigt (und in der `--json`-Ausgabe enthalten). Wenn ein konfigurierter Provider keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Fehlende Authentifizierung** aus.
    - JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers` (effektive Authentifizierung pro Provider, einschließlich env-gestützter Anmeldedaten). `auth.oauth` ist nur der Zustand der Auth-Speicherprofile; reine env-Provider erscheinen dort nicht.
    - Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
    - Verwenden Sie `--probe` für Live-Authentifizierungsprüfungen; Prüfzeilen können aus Auth-Profilen, env-Anmeldedaten oder `models.json` stammen.
    - Wenn ein explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung `excluded_by_auth_order`, statt es zu versuchen. Wenn Authentifizierung vorhanden ist, aber für diesen Provider kein prüfbares Modell aufgelöst werden kann, meldet die Prüfung `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Die Authentifizierungsauswahl hängt vom Provider/Konto ab. Für dauerhaft laufende Gateway-Hosts sind API-Schlüssel normalerweise am vorhersehbarsten; die Wiederverwendung der Claude CLI sowie vorhandene Anthropic-OAuth-/Tokenprofile werden ebenfalls unterstützt.
</Note>

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scannen (kostenlose OpenRouter-Modelle)

`openclaw models scan` untersucht den **kostenlosen Modellkatalog** von OpenRouter und kann Modelle optional auf Tool- und Bildunterstützung prüfen.

<ParamField path="--no-probe" type="boolean">
  Live-Prüfungen überspringen (nur Metadaten).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimale Parametergröße (Milliarden).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Ältere Modelle überspringen.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Provider-Präfixfilter.
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
Der OpenRouter-Katalog `/models` ist öffentlich, daher können reine Metadatenscans kostenlose Kandidaten ohne Schlüssel auflisten. Prüfungen und Inferenz erfordern weiterhin einen OpenRouter-API-Schlüssel (aus Auth-Profilen oder `OPENROUTER_API_KEY`). Wenn kein Schlüssel verfügbar ist, fällt `openclaw models scan` auf eine reine Metadatenausgabe zurück und lässt die Konfiguration unverändert. Verwenden Sie `--no-probe`, um den reinen Metadatenmodus explizit anzufordern.
</Note>

Scanergebnisse werden sortiert nach:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe:

- OpenRouter-`/models`-Liste (Filter `:free`)
- Live-Prüfungen erfordern einen OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [Umgebungsvariablen](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Anfrage-/Prüfsteuerungen: `--timeout`, `--concurrency`

Wenn Live-Prüfungen in einem TTY ausgeführt werden, können Sie Fallbacks interaktiv auswählen. Übergeben Sie im nicht interaktiven Modus `--yes`, um die Standardwerte zu akzeptieren. Reine Metadatenergebnisse dienen der Information; `--set-default` und `--set-image` erfordern Live-Prüfungen, damit OpenClaw kein unbrauchbares OpenRouter-Modell ohne Schlüssel konfiguriert.

## Modellregistrierung (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden im Agent-Verzeichnis in `models.json` geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

<AccordionGroup>
  <Accordion title="Priorität im Zusammenführungsmodus">
    Priorität im Zusammenführungsmodus für übereinstimmende Provider-IDs:

    - Eine nicht leere `baseUrl`, die bereits in der `models.json` des Agent vorhanden ist, gewinnt.
    - Ein nicht leerer `apiKey` in der `models.json` des Agent gewinnt nur, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profilkontext nicht SecretRef-verwaltet ist.
    - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkierungen aktualisiert (`ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen), statt aufgelöste Geheimnisse dauerhaft zu speichern.
    - SecretRef-verwaltete Provider-Headerwerte werden aus Quellmarkierungen aktualisiert (`secretref-env:ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen).
    - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` aus der Konfiguration zurück.
    - Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

<Note>
Die Markierungspersistenz ist quellenautoritativ: OpenClaw schreibt Markierungen aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten Laufzeit-Geheimniswerten. Dies gilt immer, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.
</Note>

## Verwandt

- [Agent-Laufzeiten](/de/concepts/agent-runtimes) — PI, Codex und andere Agent-Loop-Laufzeiten
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modellkonfigurationsschlüssel
- [Bildgenerierung](/de/tools/image-generation) — Bildmodellkonfiguration
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Authentifizierung
- [Musikgenerierung](/de/tools/music-generation) — Musikmodellkonfiguration
- [Videogenerierung](/de/tools/video-generation) — Videomodellkonfiguration
