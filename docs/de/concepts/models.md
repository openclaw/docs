---
read_when:
    - Modelle-CLI hinzufügen oder ändern (models list/set/scan/aliases/fallbacks)
    - Ändern des Fallback-Verhaltens für Modelle oder der Auswahl-UX
    - Aktualisieren von Modellscan-Prüfungen (Tools/Bilder)
sidebarTitle: Models CLI
summary: 'Modelle-CLI: list, set, aliases, fallbacks, scan, status'
title: Modelle-CLI
x-i18n:
    generated_at: "2026-05-05T01:45:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Auth-Profil-Rotation, Cooldowns und wie dies mit Fallbacks zusammenspielt.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers">
    Kurzer Provider-Überblick und Beispiele.
  </Card>
  <Card title="Agent-Laufzeiten" href="/de/concepts/agent-runtimes">
    PI, Codex und andere Agent-Loop-Laufzeiten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults">
    Modell-Konfigurationsschlüssel.
  </Card>
</CardGroup>

Modellreferenzen wählen einen Provider und ein Modell aus. Sie wählen normalerweise nicht die Low-Level-Agent-Laufzeit aus. Beispielsweise kann `openai/gpt-5.5` je nach `agents.defaults.agentRuntime.id` über den normalen OpenAI-Provider-Pfad oder über die Codex-App-Server-Laufzeit ausgeführt werden. Im Codex-Laufzeitmodus bedeutet die Referenz `openai/gpt-*` keine Abrechnung über API-Schlüssel; die Authentifizierung kann aus einem Codex-Konto oder einem `openai-codex`-Auth-Profil stammen. Siehe [Agent-Laufzeiten](/de/concepts/agent-runtimes).

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
    Auth-Failover findet innerhalb eines Providers statt, bevor zum nächsten Modell gewechselt wird.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Verwandte Modelloberflächen">
    - `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliase).
    - `agents.defaults.imageModel` wird **nur verwendet, wenn** das primäre Modell keine Bilder akzeptieren kann.
    - `agents.defaults.pdfModel` wird vom `pdf`-Tool verwendet. Wenn es ausgelassen wird, fällt das Tool auf `agents.defaults.imageModel` und danach auf das aufgelöste Sitzungs-/Standardmodell zurück.
    - `agents.defaults.imageGenerationModel` wird von der gemeinsam genutzten Bildgenerierungsfähigkeit verwendet. Wenn es ausgelassen wird, kann `image_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.musicGenerationModel` wird von der gemeinsam genutzten Musikgenerierungsfähigkeit verwendet. Wenn es ausgelassen wird, kann `music_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.videoGenerationModel` wird von der gemeinsam genutzten Videogenerierungsfähigkeit verwendet. Wenn es ausgelassen wird, kann `video_generate` dennoch einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - Pro-Agent-Standards können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [Multi-Agent-Routing](/de/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Auswahlquelle und Fallback-Verhalten

Dasselbe `provider/model` kann je nach Herkunft Unterschiedliches bedeuten:

- Konfigurierte Standards (`agents.defaults.model.primary` und agent-spezifische primäre Modelle) sind der normale Ausgangspunkt und verwenden `agents.defaults.model.fallbacks`.
- Automatische Fallback-Auswahlen sind ein temporärer Wiederherstellungszustand. Sie werden mit `modelOverrideSource: "auto"` gespeichert, damit spätere Turns die Fallback-Kette weiter verwenden können, ohne zuerst ein bekanntermaßen fehlerhaftes primäres Modell zu prüfen.
- Benutzersitzungsauswahlen sind exakt. `/model`, der Modellauswähler, `session_status(model=...)` und `sessions.patch` speichern `modelOverrideSource: "user"`; wenn dieser ausgewählte Provider/dieses Modell nicht erreichbar ist, schlägt OpenClaw sichtbar fehl, statt auf ein anderes konfiguriertes Modell durchzufallen.
- Cron `--model` / Payload `model` ist ein primäres Modell pro Job. Es verwendet weiterhin konfigurierte Fallbacks, sofern der Job keine expliziten Payload-`fallbacks` bereitstellt (verwenden Sie `fallbacks: []` für einen strikten Cron-Lauf).
- CLI-Standardmodell- und Allowlist-Auswähler respektieren `models.mode: "replace"`, indem sie explizite `models.providers.*.models` auflisten, anstatt den vollständigen integrierten Katalog zu laden.
- Der Modellauswähler in der Control UI fragt beim Gateway die konfigurierte Modellansicht ab: `agents.defaults.models`, sofern vorhanden, andernfalls explizite `models.providers.*.models` plus Provider mit nutzbarer Authentifizierung. Der vollständige integrierte Katalog ist expliziten Browse-Ansichten wie `models.list` mit `view: "all"` oder `openclaw models list --all` vorbehalten.

## Schnelle Modellrichtlinie

- Legen Sie Ihr primäres Modell auf das stärkste Modell der neuesten Generation fest, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzsensible Aufgaben und Chat mit geringerem Risiko.
- Vermeiden Sie bei tool-fähigen Agents oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht von Hand bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Provider einrichten, einschließlich **OpenAI Code (Codex)-Abonnement** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliase + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

<Note>
Modellreferenzen werden in Kleinbuchstaben normalisiert. Provider-Aliase wie `z.ai/*` werden zu `zai/*` normalisiert.

Provider-Konfigurationsbeispiele (einschließlich OpenCode) finden Sie in [OpenCode](/de/providers/opencode).
</Note>

### Sichere Allowlist-Bearbeitungen

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` von Hand aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regeln zum Schutz vor Überschreiben">
    `openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder `models.providers.<id>.models` wird abgelehnt, wenn sie vorhandene Einträge entfernen würde. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur, wenn der bereitgestellte Wert zum vollständigen Zielwert werden soll.

    Die interaktive Provider-Einrichtung und `openclaw configure --section model` führen Provider-bezogene Auswahlen ebenfalls mit der vorhandenen Allowlist zusammen, sodass das Hinzufügen von Codex, Ollama oder einem anderen Provider keine nicht verwandten Modelleinträge entfernt. Configure bewahrt ein vorhandenes `agents.defaults.model.primary`, wenn Provider-Auth erneut angewendet wird. Explizite Befehle zum Setzen von Standards wie `openclaw models auth login --provider <id> --set-default` und `openclaw models set <model>` ersetzen weiterhin `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Modell ist nicht erlaubt" (und warum Antworten stoppen)

Wenn `agents.defaults.models` festgelegt ist, wird es zur **Allowlist** für `/model` und für Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist steht, gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Dies geschieht **bevor** eine normale Antwort generiert wird, sodass die Nachricht wirken kann, als hätte sie "nicht geantwortet". Die Lösung ist, entweder:

- Das Modell zu `agents.defaults.models` hinzuzufügen, oder
- die Allowlist zu leeren (`agents.defaults.models` entfernen), oder
- ein Modell aus `/model list` auszuwählen.

</Warning>

Wenn der abgelehnte Befehl eine Laufzeitüberschreibung wie `/model openai/gpt-5.5 --runtime codex` enthielt, korrigieren Sie zuerst die Allowlist und versuchen Sie dann denselben Befehl `/model ... --runtime ...` erneut. Für native Codex-Ausführung bleibt das ausgewählte Modell `openai/gpt-5.5`; die `codex`-Laufzeit wählt das Harness aus und verwendet Codex-Auth separat.

Speichern Sie für lokale/GGUF-Modelle die vollständige Provider-präfixierte Referenz in der Allowlist,
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
  <Accordion title="Picker-Verhalten">
    - `/model` (und `/model list`) ist ein kompakter, nummerierter Picker (Modellfamilie + verfügbare Provider).
    - Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Provider- und Modell-Dropdowns plus einem Absenden-Schritt.
    - Auf Telegram sind Picker-Auswahlen über `/models` sitzungsbezogen; sie ändern den persistenten Standard des Agents in `openclaw.json` nicht.
    - `/models add` ist veraltet und gibt nun eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren.
    - `/model <#>` wählt aus diesem Picker aus.

  </Accordion>
  <Accordion title="Persistenz und Live-Wechsel">
    - `/model` speichert die neue Sitzungsauswahl sofort.
    - Wenn der Agent im Leerlauf ist, verwendet der nächste Lauf sofort das neue Modell.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zum nächsten Benutzer-Turn in der Warteschlange bleiben.
    - Eine vom Benutzer ausgewählte `/model`-Referenz ist für diese Sitzung strikt: Wenn der ausgewählte Provider/das ausgewählte Modell nicht erreichbar ist, schlägt die Antwort sichtbar fehl, statt stillschweigend aus `agents.defaults.model.fallbacks` zu antworten. Dies unterscheidet sich von konfigurierten Standards und primären Cron-Job-Modellen, die weiterhin Fallback-Ketten verwenden können.
    - `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).

  </Accordion>
  <Accordion title="Referenz-Parsing">
    - Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
    - Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), müssen Sie das Provider-Präfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
    - Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
      1. Alias-Übereinstimmung
      2. eindeutige Übereinstimmung eines konfigurierten Providers für genau diese nicht präfixierte Modell-ID
      3. veralteter Fallback auf den konfigurierten Standard-Provider — wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw stattdessen auf den ersten konfigurierten Provider/das erste konfigurierte Modell zurück, um zu vermeiden, dass ein veralteter Standard eines entfernten Providers angezeigt wird.
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

Zeigt standardmäßig konfigurierte bzw. mit verfügbarer Authentifizierung nutzbare Modelle an. Nützliche Flags:

<ParamField path="--all" type="boolean">
  Vollständiger Katalog. Enthält gebündelte, Provider-eigene statische Katalogzeilen, bevor die Authentifizierung konfiguriert ist, damit reine Erkennungsansichten Modelle anzeigen können, die erst verfügbar sind, wenn Sie passende Provider-Anmeldedaten hinzufügen.
</ParamField>
<ParamField path="--local" type="boolean">
  Nur lokale Provider.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Nach Provider-ID filtern, zum Beispiel `moonshot`. Anzeigebezeichnungen aus interaktiven Auswahldialogen werden nicht akzeptiert.
</ParamField>
<ParamField path="--plain" type="boolean">
  Ein Modell pro Zeile.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare Ausgabe.
</ParamField>

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, Bildmodell und eine Authentifizierungsübersicht der konfigurierten Provider an. Außerdem wird der Ablaufstatus von OAuth für Profile angezeigt, die im Auth-Store gefunden wurden (warnt standardmäßig innerhalb von 24 Stunden). `--plain` gibt nur das aufgelöste primäre Modell aus.

<AccordionGroup>
  <Accordion title="Authentifizierungs- und Prüfverhalten">
    - Der OAuth-Status wird immer angezeigt (und in die `--json`-Ausgabe aufgenommen). Wenn ein konfigurierter Provider keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Fehlende Authentifizierung** aus.
    - JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers` (effektive Authentifizierung pro Provider, einschließlich env-gestützter Anmeldedaten). `auth.oauth` ist nur die Integrität von Auth-Store-Profilen; reine env-Provider erscheinen dort nicht.
    - Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlender/abgelaufener Authentifizierung, `2` bei bald ablaufender Authentifizierung).
    - Verwenden Sie `--probe` für Live-Authentifizierungsprüfungen; Prüfzeilen können aus Auth-Profilen, env-Anmeldedaten oder `models.json` stammen.
    - Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung `excluded_by_auth_order`, statt es zu versuchen. Wenn Authentifizierung vorhanden ist, aber für diesen Provider kein prüfbares Modell aufgelöst werden kann, meldet die Prüfung `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Die Wahl der Authentifizierung hängt vom Provider/Konto ab. Für ständig aktive Gateway-Hosts sind API-Schlüssel normalerweise am berechenbarsten; die Wiederverwendung der Claude CLI und vorhandene Anthropic OAuth-/Token-Profile werden ebenfalls unterstützt.
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
  Mindestgröße der Parameter (Milliarden).
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
Der OpenRouter-`/models`-Katalog ist öffentlich, daher können reine Metadatenscans kostenlose Kandidaten ohne Schlüssel auflisten. Prüfungen und Inferenz erfordern weiterhin einen OpenRouter-API-Schlüssel (aus Auth-Profilen oder `OPENROUTER_API_KEY`). Wenn kein Schlüssel verfügbar ist, fällt `openclaw models scan` auf reine Metadatenausgabe zurück und lässt die Konfiguration unverändert. Verwenden Sie `--no-probe`, um den reinen Metadatenmodus explizit anzufordern.
</Note>

Scan-Ergebnisse werden nach folgenden Kriterien sortiert:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe:

- OpenRouter-`/models`-Liste (Filter `:free`)
- Live-Prüfungen erfordern einen OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [Umgebungsvariablen](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Anfrage-/Prüfsteuerung: `--timeout`, `--concurrency`

Wenn Live-Prüfungen in einem TTY ausgeführt werden, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven Modus übergeben Sie `--yes`, um Standardwerte zu akzeptieren. Reine Metadatenergebnisse dienen nur zur Information; `--set-default` und `--set-image` erfordern Live-Prüfungen, damit OpenClaw kein unbrauchbares schlüsselloses OpenRouter-Modell konfiguriert.

## Modellregistrierung (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` im Agent-Verzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

<AccordionGroup>
  <Accordion title="Rangfolge des Zusammenführungsmodus">
    Rangfolge des Zusammenführungsmodus für übereinstimmende Provider-IDs:

    - Eine nicht leere `baseUrl`, die bereits in der Agent-`models.json` vorhanden ist, gewinnt.
    - Ein nicht leerer `apiKey` in der Agent-`models.json` gewinnt nur, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profilkontext nicht SecretRef-verwaltet ist.
    - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkern (`ENV_VAR_NAME` für env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert, statt aufgelöste Geheimnisse dauerhaft zu speichern.
    - SecretRef-verwaltete Provider-Header-Werte werden aus Quellmarkern (`secretref-env:ENV_VAR_NAME` für env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert.
    - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf die Konfiguration `models.providers` zurück.
    - Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

<Note>
Marker-Persistenz ist quellautoritativ: OpenClaw schreibt Marker aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten Laufzeit-Geheimniswerten. Dies gilt immer, wenn OpenClaw `models.json` neu erzeugt, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.
</Note>

## Verwandte Themen

- [Agent-Laufzeiten](/de/concepts/agent-runtimes) — PI, Codex und andere Agent-Loop-Laufzeiten
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modellkonfigurationsschlüssel
- [Bildgenerierung](/de/tools/image-generation) — Bildmodellkonfiguration
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Authentifizierung
- [Musikgenerierung](/de/tools/music-generation) — Musikmodellkonfiguration
- [Videogenerierung](/de/tools/video-generation) — Videomodellkonfiguration
