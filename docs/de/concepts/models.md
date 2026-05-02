---
read_when:
    - models-CLI hinzufügen oder ändern (models list/set/scan/aliases/fallbacks)
    - Ändern des Modell-Fallback-Verhaltens oder der Auswahl-UX
    - Modellscan-Probes aktualisieren (Tools/Bilder)
sidebarTitle: Models CLI
summary: 'Modell-CLI: auflisten, festlegen, Aliase, Fallbacks, scannen, Status'
title: Modelle-CLI
x-i18n:
    generated_at: "2026-05-02T06:31:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 620df60ee1117a32f0232bf4b56fbc5a9558be5cc3b73a31336f8ab64fd29ebb
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Rotation von Auth-Profilen, Cooldowns und wie dies mit Fallbacks interagiert.
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

Modell-Refs wählen einen Provider und ein Modell aus. Sie wählen normalerweise nicht die Low-Level-Agent-Runtime aus. Beispielsweise kann `openai/gpt-5.5` je nach `agents.defaults.agentRuntime.id` über den normalen OpenAI-Provider-Pfad oder über die Codex-App-Server-Runtime ausgeführt werden. Im Codex-Runtime-Modus bedeutet die Ref `openai/gpt-*` keine Abrechnung per API-Schlüssel; die Authentifizierung kann über ein Codex-Konto oder ein `openai-codex`-Auth-Profil erfolgen. Siehe [Agent-Runtimes](/de/concepts/agent-runtimes).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

<Steps>
  <Step title="Primäres Modell">
    `agents.defaults.model.primary` (oder `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (in der angegebenen Reihenfolge).
  </Step>
  <Step title="Provider-Auth-Failover">
    Auth-Failover erfolgt innerhalb eines Providers, bevor zum nächsten Modell gewechselt wird.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Verwandte Modelloberflächen">
    - `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliase).
    - `agents.defaults.imageModel` wird **nur verwendet, wenn** das primäre Modell keine Bilder akzeptieren kann.
    - `agents.defaults.pdfModel` wird vom `pdf`-Tool verwendet. Wenn ausgelassen, fällt das Tool auf `agents.defaults.imageModel` und danach auf das aufgelöste Sitzungs-/Standardmodell zurück.
    - `agents.defaults.imageGenerationModel` wird von der gemeinsamen Fähigkeit zur Bilderzeugung verwendet. Wenn ausgelassen, kann `image_generate` weiterhin einen durch Auth abgesicherten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Bilderzeugungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.musicGenerationModel` wird von der gemeinsamen Fähigkeit zur Musikerzeugung verwendet. Wenn ausgelassen, kann `music_generate` weiterhin einen durch Auth abgesicherten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Musikerzeugungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.videoGenerationModel` wird von der gemeinsamen Fähigkeit zur Videoerzeugung verwendet. Wenn ausgelassen, kann `video_generate` weiterhin einen durch Auth abgesicherten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Videoerzeugungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - Agent-spezifische Standards können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [Multi-Agent-Routing](/de/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Auswahlquelle und Fallback-Verhalten

Dasselbe `provider/model` kann unterschiedliche Bedeutungen haben, je nachdem, woher es stammt:

- Konfigurierte Standards (`agents.defaults.model.primary` und Agent-spezifische primäre Modelle) sind der normale Ausgangspunkt und verwenden `agents.defaults.model.fallbacks`.
- Automatische Fallback-Auswahlen sind temporärer Wiederherstellungszustand. Sie werden mit `modelOverrideSource: "auto"` gespeichert, damit spätere Turns die Fallback-Kette weiter verwenden können, ohne zuerst ein bekannt fehlerhaftes primäres Modell zu testen.
- Benutzersitzungsauswahlen sind exakt. `/model`, der Modell-Picker, `session_status(model=...)` und `sessions.patch` speichern `modelOverrideSource: "user"`; wenn der ausgewählte Provider/das ausgewählte Modell nicht erreichbar ist, schlägt OpenClaw sichtbar fehl, statt auf ein anderes konfiguriertes Modell auszuweichen.
- Cron `--model` / Payload `model` ist ein pro Job primäres Modell. Es verwendet weiterhin konfigurierte Fallbacks, sofern der Job keine expliziten Payload-`fallbacks` liefert (verwenden Sie `fallbacks: []` für einen strikten Cron-Lauf).
- CLI-Standardmodell- und Allowlist-Picker respektieren `models.mode: "replace"`, indem sie explizite `models.providers.*.models` auflisten, statt den vollständigen integrierten Katalog zu laden.
- Der Control-UI-Modell-Picker fragt beim Gateway seine konfigurierte Modellansicht ab: `agents.defaults.models`, wenn vorhanden, andernfalls explizite `models.providers.*.models` plus Provider mit nutzbarer Authentifizierung. Der vollständige integrierte Katalog ist expliziten Browse-Ansichten wie `models.list` mit `view: "all"` oder `openclaw models list --all` vorbehalten.

## Kurze Modellrichtlinie

- Setzen Sie Ihr primäres Modell auf das stärkste verfügbare Modell der neuesten Generation, auf das Sie Zugriff haben.
- Verwenden Sie Fallbacks für kosten-/latenzempfindliche Aufgaben und Chats mit geringerem Risiko.
- Vermeiden Sie bei Tool-aktivierten Agents oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht manuell bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Authentifizierung für gängige Provider einrichten, einschließlich **OpenAI Code (Codex)-Abonnement** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliase + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

<Note>
Modell-Refs werden in Kleinschreibung normalisiert. Provider-Aliase wie `z.ai/*` werden zu `zai/*` normalisiert.

Provider-Konfigurationsbeispiele (einschließlich OpenCode) finden Sie unter [OpenCode](/de/providers/opencode).
</Note>

### Sichere Allowlist-Bearbeitungen

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` manuell aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Clobber-Schutzregeln">
    `openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder `models.providers.<id>.models` wird abgelehnt, wenn sie vorhandene Einträge entfernen würde. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur, wenn der bereitgestellte Wert zum vollständigen Zielwert werden soll.

    Die interaktive Provider-Einrichtung und `openclaw configure --section model` führen Provider-spezifische Auswahlen ebenfalls in die vorhandene Allowlist ein, sodass das Hinzufügen von Codex, Ollama oder einem anderen Provider keine nicht verwandten Modelleinträge entfernt. Configure bewahrt ein vorhandenes `agents.defaults.model.primary`, wenn Provider-Auth erneut angewendet wird. Explizite Befehle zum Setzen von Standards wie `openclaw models auth login --provider <id> --set-default` und `openclaw models set <model>` ersetzen weiterhin `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Modell ist nicht erlaubt" (und warum Antworten stoppen)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist, gibt OpenClaw zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Dies geschieht **bevor** eine normale Antwort erzeugt wird, sodass es wirken kann, als hätte die Nachricht "nicht geantwortet". Die Lösung ist eine der folgenden:

- Fügen Sie das Modell zu `agents.defaults.models` hinzu, oder
- Leeren Sie die Allowlist (entfernen Sie `agents.defaults.models`), oder
- Wählen Sie ein Modell aus `/model list`.

</Warning>

Speichern Sie für lokale/GGUF-Modelle die vollständige Provider-präfixierte Ref in der Allowlist,
zum Beispiel `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` oder das
exakte Provider/Modell, das von `openclaw models list --provider <provider>` angezeigt wird.
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
    - `/models add` ist veraltet und gibt nun eine Deprecation-Meldung zurück, statt Modelle aus dem Chat zu registrieren.
    - `/model <#>` wählt aus diesem Picker aus.

  </Accordion>
  <Accordion title="Persistenz und Live-Wechsel">
    - `/model` persistiert die neue Sitzungsauswahl sofort.
    - Wenn der Agent inaktiv ist, verwendet der nächste Lauf das neue Modell sofort.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
    - Eine vom Benutzer ausgewählte `/model`-Ref ist für diese Sitzung strikt: Wenn der ausgewählte Provider/das ausgewählte Modell nicht erreichbar ist, schlägt die Antwort sichtbar fehl, statt stillschweigend aus `agents.defaults.model.fallbacks` zu antworten. Dies unterscheidet sich von konfigurierten Standards und primären Cron-Job-Modellen, die weiterhin Fallback-Ketten verwenden können.
    - `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).

  </Accordion>
  <Accordion title="Ref-Parsing">
    - Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
    - Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), müssen Sie das Provider-Präfix einschließen (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
    - Wenn Sie den Provider auslassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
      1. Alias-Übereinstimmung
      2. eindeutige Übereinstimmung mit einem konfigurierten Provider für diese exakte Modell-ID ohne Präfix
      3. veralteter Fallback auf den konfigurierten Standard-Provider — wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw stattdessen auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, um keinen veralteten, entfernten Provider-Standard anzuzeigen.
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

Zeigt standardmäßig konfigurierte/per Auth verfügbare Modelle an. Nützliche Flags:

<ParamField path="--all" type="boolean">
  Vollständiger Katalog. Enthält gebündelte, Provider-eigene statische Katalogzeilen, bevor die Authentifizierung konfiguriert ist, sodass reine Discovery-Ansichten Modelle anzeigen können, die nicht verfügbar sind, bis Sie passende Provider-Anmeldedaten hinzufügen.
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

Zeigt das aufgelöste primäre Modell, Fallbacks, das Bildmodell und eine Authentifizierungsübersicht der konfigurierten Provider. Außerdem wird der OAuth-Ablaufstatus für Profile angezeigt, die im Authentifizierungsspeicher gefunden wurden (warnt standardmäßig innerhalb von 24 Stunden). `--plain` gibt nur das aufgelöste primäre Modell aus.

<AccordionGroup>
  <Accordion title="Authentifizierungs- und Prüfverhalten">
    - Der OAuth-Status wird immer angezeigt (und in der `--json`-Ausgabe enthalten). Wenn ein konfigurierter Provider keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Fehlende Authentifizierung** aus.
    - JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers` (effektive Authentifizierung pro Provider, einschließlich env-gestützter Anmeldedaten). `auth.oauth` ist nur die Profilintegrität im Authentifizierungsspeicher; reine env-Provider erscheinen dort nicht.
    - Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
    - Verwenden Sie `--probe` für Live-Authentifizierungsprüfungen; Prüfzeilen können aus Authentifizierungsprofilen, env-Anmeldedaten oder `models.json` stammen.
    - Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung `excluded_by_auth_order`, statt es zu versuchen. Wenn Authentifizierung vorhanden ist, aber kein prüfbares Modell für diesen Provider aufgelöst werden kann, meldet die Prüfung `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Die Wahl der Authentifizierung hängt vom Provider/Konto ab. Für dauerhaft aktive Gateway-Hosts sind API-Schlüssel normalerweise am vorhersehbarsten; die Wiederverwendung der Claude CLI sowie vorhandene Anthropic-OAuth-/Token-Profile werden ebenfalls unterstützt.
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
Der OpenRouter-Katalog `/models` ist öffentlich, sodass reine Metadaten-Scans kostenlose Kandidaten ohne Schlüssel auflisten können. Prüfungen und Inferenz erfordern weiterhin einen OpenRouter-API-Schlüssel (aus Authentifizierungsprofilen oder `OPENROUTER_API_KEY`). Wenn kein Schlüssel verfügbar ist, fällt `openclaw models scan` auf eine reine Metadaten-Ausgabe zurück und lässt die Konfiguration unverändert. Verwenden Sie `--no-probe`, um den reinen Metadatenmodus explizit anzufordern.
</Note>

Scan-Ergebnisse werden eingestuft nach:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe:

- OpenRouter-Liste `/models` (Filter `:free`)
- Live-Prüfungen erfordern einen OpenRouter-API-Schlüssel aus Authentifizierungsprofilen oder `OPENROUTER_API_KEY` (siehe [Umgebungsvariablen](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Anfrage-/Prüfsteuerung: `--timeout`, `--concurrency`

Wenn Live-Prüfungen in einem TTY ausgeführt werden, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven Modus übergeben Sie `--yes`, um Standardwerte zu akzeptieren. Reine Metadaten-Ergebnisse dienen der Information; `--set-default` und `--set-image` erfordern Live-Prüfungen, damit OpenClaw kein unbrauchbares schlüsselloses OpenRouter-Modell konfiguriert.

## Modellregistrierung (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden unter dem Agent-Verzeichnis in `models.json` geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

<AccordionGroup>
  <Accordion title="Priorität des Zusammenführungsmodus">
    Priorität des Zusammenführungsmodus für übereinstimmende Provider-IDs:

    - Eine nicht leere `baseUrl`, die bereits in der Agent-`models.json` vorhanden ist, gewinnt.
    - Ein nicht leerer `apiKey` in der Agent-`models.json` gewinnt nur, wenn dieser Provider im aktuellen Konfigurations-/Authentifizierungsprofilkontext nicht SecretRef-verwaltet ist.
    - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkierungen (`ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert, statt aufgelöste Geheimnisse dauerhaft zu speichern.
    - SecretRef-verwaltete Provider-Headerwerte werden aus Quellmarkierungen (`secretref-env:ENV_VAR_NAME` für env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert.
    - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf die Konfiguration `models.providers` zurück.
    - Andere Provider-Felder werden aus Konfiguration und normalisierten Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

<Note>
Die Persistenz von Markierungen ist quellenautoritativ: OpenClaw schreibt Markierungen aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten Laufzeit-Geheimniswerten. Dies gilt immer dann, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgetriebener Pfade wie `openclaw agent`.
</Note>

## Verwandt

- [Agent-Laufzeiten](/de/concepts/agent-runtimes) — PI, Codex und andere Agent-Loop-Laufzeiten
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modellkonfigurationsschlüssel
- [Bilderzeugung](/de/tools/image-generation) — Bildmodellkonfiguration
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Authentifizierung
- [Musikerzeugung](/de/tools/music-generation) — Musikmodellkonfiguration
- [Videoerzeugung](/de/tools/video-generation) — Videomodellkonfiguration
