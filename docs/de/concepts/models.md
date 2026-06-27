---
read_when:
    - Modelle-CLI hinzufügen oder ändern (models list/set/scan/aliases/fallbacks)
    - Modell-Fallback-Verhalten oder Auswahl-UX ändern
    - Modellscan-Probes aktualisieren (Tools/Bilder)
sidebarTitle: Models CLI
summary: 'Models-CLI: auflisten, festlegen, Aliase, Fallbacks, scannen, Status'
title: Modelle-CLI
x-i18n:
    generated_at: "2026-06-27T17:24:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Rotation von Auth-Profilen, Cooldowns und wie dies mit Fallbacks zusammenspielt.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers">
    Kurzer Provider-Überblick und Beispiele.
  </Card>
  <Card title="Agent-Laufzeiten" href="/de/concepts/agent-runtimes">
    OpenClaw, Codex und andere Laufzeiten für Agent-Schleifen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults">
    Modell-Konfigurationsschlüssel.
  </Card>
</CardGroup>

Modellreferenzen wählen einen Provider und ein Modell aus. Normalerweise wählen sie nicht die Low-Level-Agent-Laufzeit aus. OpenAI-Agent-Referenzen sind die wichtigste Ausnahme: `openai/gpt-5.5` läuft beim offiziellen OpenAI-Provider standardmäßig über die Codex-App-Server-Laufzeit. Subscription-Copilot-Referenzen (`github-copilot/*`) können zusätzlich für das externe GitHub-Copilot-Agent-Laufzeit-Plugin aktiviert werden – dieser Pfad bleibt explizit (kein `auto`-Fallback). Explizite Laufzeitüberschreibungen gehören in die Provider-/Modellrichtlinie, nicht auf den gesamten Agent oder die gesamte Sitzung. Im Codex-Laufzeitmodus impliziert die Referenz `openai/gpt-*` keine Abrechnung über API-Schlüssel; die Authentifizierung kann über ein Codex-Konto oder ein `openai`-OAuth-Profil erfolgen. Siehe [Agent-Laufzeiten](/de/concepts/agent-runtimes) und [GitHub-Copilot-Agent-Laufzeit](/de/plugins/copilot).

## So funktioniert die Modellauswahl

OpenClaw wählt Modelle in dieser Reihenfolge aus:

<Steps>
  <Step title="Primäres Modell">
    `agents.defaults.model.primary` (oder `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (in Reihenfolge).
  </Step>
  <Step title="Provider-Auth-Failover">
    Auth-Failover erfolgt innerhalb eines Providers, bevor zum nächsten Modell gewechselt wird.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Zugehörige Modelloberflächen">
    - `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliase). Verwenden Sie `provider/*`-Einträge, um sichtbare Provider zu begrenzen, während die Provider-Erkennung dynamisch bleibt.
    - `agents.defaults.imageModel` wird **nur verwendet, wenn** das primäre Modell keine Bilder akzeptieren kann.
    - `agents.defaults.pdfModel` wird vom Tool `pdf` verwendet. Wenn es weggelassen wird, fällt das Tool auf `agents.defaults.imageModel` zurück, dann auf das aufgelöste Sitzungs-/Standardmodell.
    - `agents.defaults.imageGenerationModel` wird von der gemeinsam genutzten Bildgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `image_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Bildgenerierungs-Provider in Reihenfolge der Provider-ID. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.musicGenerationModel` wird von der gemeinsam genutzten Musikgenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `music_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Musikgenerierungs-Provider in Reihenfolge der Provider-ID. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - `agents.defaults.videoGenerationModel` wird von der gemeinsam genutzten Videogenerierungsfunktion verwendet. Wenn es weggelassen wird, kann `video_generate` weiterhin einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Videogenerierungs-Provider in Reihenfolge der Provider-ID. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Authentifizierung/den API-Schlüssel dieses Providers.
    - Agent-spezifische Standards können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [Multi-Agent-Routing](/de/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Auswahlquelle und Fallback-Verhalten

Dasselbe `provider/model` kann je nach Herkunft unterschiedliche Dinge bedeuten:

- Konfigurierte Standards (`agents.defaults.model.primary` und agent-spezifische Primärmodelle) sind der normale Ausgangspunkt und verwenden `agents.defaults.model.fallbacks`.
- Automatische Fallback-Auswahlen sind temporärer Wiederherstellungszustand. Sie werden mit `modelOverrideSource: "auto"` gespeichert, damit spätere Durchläufe die Fallback-Kette weiter verwenden können, ohne jedes Mal ein bekannt defektes Primärmodell zu prüfen; OpenClaw prüft das ursprüngliche Primärmodell regelmäßig erneut, löscht die automatische Auswahl, wenn es sich erholt, und kündigt Fallback-/Wiederherstellungsübergänge einmal pro Zustandsänderung an.
- Benutzersitzungsauswahlen sind exakt. `/model`, die Modellauswahl, `session_status(model=...)` und `sessions.patch` speichern `modelOverrideSource: "user"`; wenn dieser ausgewählte Provider/dieses ausgewählte Modell nicht erreichbar ist, schlägt OpenClaw sichtbar fehl, statt auf ein anderes konfiguriertes Modell zurückzufallen.
- Das Ändern von `agents.defaults.model.primary` schreibt bestehende Sitzungsauswahlen nicht um. Wenn der Status `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` meldet, löschen Sie die aktuelle Sitzungsauswahl mit `/model default`, damit sie wieder das konfigurierte Primärmodell erbt.
- Cron `--model` / Payload `model` ist ein Primärmodell pro Job. Es verwendet weiterhin konfigurierte Fallbacks, sofern der Job keine expliziten Payload-`fallbacks` bereitstellt (verwenden Sie `fallbacks: []` für einen strikten Cron-Lauf).
- CLI-Standardmodell- und Allowlist-Auswahlen respektieren `models.mode: "replace"`, indem sie explizite `models.providers.*.models` auflisten, statt den vollständigen eingebauten Katalog zu laden.
- Die Control-UI-Modellauswahl fragt beim Gateway die konfigurierte Modellansicht ab: `agents.defaults.models`, falls vorhanden, einschließlich providerweiter `provider/*`-Einträge, andernfalls explizite `models.providers.*.models` plus Provider mit verwendbarer Authentifizierung. Der vollständige eingebaute Katalog ist expliziten Browsing-Ansichten vorbehalten, etwa `models.list` mit `view: "all"` oder `openclaw models list --all`.

## Kurze Modellrichtlinie

- Legen Sie Ihr Primärmodell auf das stärkste Modell der neuesten Generation fest, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzempfindliche Aufgaben und Chats mit geringeren Anforderungen.
- Vermeiden Sie bei Tool-fähigen Agenten oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht manuell bearbeiten möchten, führen Sie Onboarding aus:

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
- `agents.defaults.models` (Allowlist + Aliase + Provider-Parameter + dynamische Provider-Einträge `provider/*`)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

<Note>
Modellreferenzen werden in Kleinbuchstaben normalisiert. Provider-IDs sind ansonsten exakt; verwenden Sie die
vom Plugin angegebene Provider-ID.

Provider-Konfigurationsbeispiele (einschließlich OpenCode) finden Sie in [OpenCode](/de/providers/opencode).
</Note>

### Sichere Allowlist-Bearbeitungen

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` manuell aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regeln zum Schutz vor Überschreiben">
    `openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder `models.providers.<id>.models` wird abgelehnt, wenn dadurch bestehende Einträge entfernt würden. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur, wenn der bereitgestellte Wert zum vollständigen Zielwert werden soll.

    Interaktive Provider-Einrichtung und `openclaw configure --section model` führen Provider-spezifische Auswahlen ebenfalls in die bestehende Allowlist zusammen, sodass das Hinzufügen von Codex, Ollama oder einem anderen Provider keine nicht zusammenhängenden Modelleinträge entfernt. Configure bewahrt ein bestehendes `agents.defaults.model.primary`, wenn Provider-Authentifizierung erneut angewendet wird. Explizite Befehle zum Setzen von Standards wie `openclaw models auth login --provider <id> --set-default` und `openclaw models set <model>` ersetzen weiterhin `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Modell ist nicht erlaubt“ (und warum Antworten stoppen)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist, gibt OpenClaw zurück:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Dies geschieht **bevor** eine normale Antwort generiert wird, sodass es sich anfühlen kann, als hätte die Nachricht „nicht geantwortet“. Die Lösung ist entweder:

- Fügen Sie das Modell zu `agents.defaults.models` hinzu, oder
- Leeren Sie die Allowlist (entfernen Sie `agents.defaults.models`), oder
- Wählen Sie ein Modell aus `/model list`.

</Warning>

Wenn der abgelehnte Befehl eine Laufzeitüberschreibung wie `/model openai/gpt-5.5 --runtime codex` enthielt, beheben Sie zuerst die Allowlist und wiederholen Sie dann denselben Befehl `/model ... --runtime ...`. Für native Codex-Ausführung ist das ausgewählte Modell weiterhin `openai/gpt-5.5`; die Laufzeit `codex` wählt das Harness aus und verwendet Codex-Authentifizierung separat.

Speichern Sie für lokale/GGUF-Modelle die vollständige, providerpräfixierte Referenz in der Allowlist,
zum Beispiel `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` oder das
exakte Provider/Modell, das von `openclaw models list --provider <provider>` angezeigt wird.
Bloße lokale Dateinamen oder Anzeigenamen reichen nicht aus, wenn die Allowlist
aktiv ist.

Wenn Sie Provider begrenzen möchten, ohne jedes Modell manuell aufzulisten, fügen Sie
`provider/*`-Einträge zu `agents.defaults.models` hinzu:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Mit dieser Richtlinie zeigen `/model`, `/models` und Modellauswahlen den erkannten
Katalog nur für diese Provider an. Neue Modelle der ausgewählten Provider können
erscheinen, ohne die Allowlist zu bearbeiten. Exakte `provider/model`-Einträge können mit
`provider/*`-Einträgen gemischt werden, wenn Sie ein bestimmtes Modell eines anderen Providers benötigen.

Beispielkonfiguration für die Allowlist:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
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
/model default
/model status
```

<AccordionGroup>
  <Accordion title="Auswahlverhalten">
    - `/model` (und `/model list`) ist eine kompakte, nummerierte Auswahl (Modellfamilie + verfügbare Provider).
    - Auf Discord öffnen `/model` und `/models` eine interaktive Auswahl mit Provider- und Modell-Dropdowns plus einem Submit-Schritt.
    - Auf Telegram sind `/models`-Auswahlen sitzungsbezogen; sie ändern nicht den persistenten Standard des Agenten in `openclaw.json`.
    - `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, statt Modelle aus dem Chat zu registrieren.
    - `/model <#>` wählt aus dieser Auswahl aus.

  </Accordion>
  <Accordion title="Persistenz und Live-Umschaltung">
    - `/model` speichert die neue Sitzungsauswahl sofort.
    - Wenn der Agent inaktiv ist, verwendet der nächste Lauf sofort das neue Modell.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw eine Live-Umschaltung als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann die ausstehende Umschaltung bis zu einer späteren Wiederholungsmöglichkeit oder bis zur nächsten Benutzereingabe in der Warteschlange bleiben.
    - `/model default` löscht die Sitzungsauswahl und setzt die Sitzung auf das konfigurierte Standardmodell zurück.
    - Eine vom Benutzer ausgewählte `/model`-Referenz ist für diese Sitzung strikt: Wenn der ausgewählte Provider/das ausgewählte Modell nicht erreichbar ist, schlägt die Antwort sichtbar fehl, statt stillschweigend über `agents.defaults.model.fallbacks` zu antworten. Dies unterscheidet sich von konfigurierten Standards und Cron-Job-Primärmodellen, die weiterhin Fallback-Ketten verwenden können.
    - `/model status` ist die Detailansicht (Auth-Kandidaten und, wenn konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).

  </Accordion>
  <Accordion title="Referenzparsing">
    - Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
    - Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), müssen Sie das Provider-Präfix einschließen (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
    - Wenn Sie den Provider auslassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
      1. Alias-Übereinstimmung
      2. eindeutige Übereinstimmung eines konfigurierten Providers für genau diese Modell-ID ohne Präfix
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

`openclaw models` (ohne Unterbefehl) ist eine Abkürzung für `models status`.

### `models list`

Zeigt standardmäßig konfigurierte/auth-verfügbare Modelle. Nützliche Flags:

<ParamField path="--all" type="boolean">
  Vollständiger Katalog. Enthält gebündelte, vom Provider verwaltete statische Katalogzeilen, bevor Auth konfiguriert ist, sodass reine Discovery-Ansichten Modelle anzeigen können, die erst verfügbar sind, nachdem Sie passende Provider-Anmeldedaten hinzugefügt haben.
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

Zeigt das aufgelöste Primärmodell, Fallbacks, Bildmodell und eine Auth-Übersicht der konfigurierten Provider. Außerdem wird der OAuth-Ablaufstatus für Profile angezeigt, die im Auth-Speicher gefunden wurden (standardmäßig Warnung innerhalb von 24 h). `--plain` gibt nur das aufgelöste Primärmodell aus.

<AccordionGroup>
  <Accordion title="Auth- und Prüfverhalten">
    - Der OAuth-Status wird immer angezeigt (und in der `--json`-Ausgabe eingeschlossen). Wenn ein konfigurierter Provider keine Anmeldedaten hat, gibt `models status` einen Abschnitt **Fehlende Authentifizierung** aus.
    - JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers` (effektive Authentifizierung pro Provider, einschließlich env-gestützter Anmeldedaten). `auth.oauth` ist nur der Zustand der Auth-Speicherprofile; reine env-Provider erscheinen dort nicht.
    - Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
    - Verwenden Sie `--probe` für Live-Auth-Prüfungen; Prüfzeilen können aus Auth-Profilen, env-Anmeldedaten oder `models.json` stammen.
    - Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung `excluded_by_auth_order`, statt es zu versuchen. Wenn Auth vorhanden ist, aber für diesen Provider kein prüfbares Modell aufgelöst werden kann, meldet die Prüfung `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Die Auth-Auswahl hängt vom Provider/Konto ab. Für dauerhaft aktive Gateway-Hosts sind API-Schlüssel in der Regel am vorhersehbarsten; die Wiederverwendung der Claude CLI und vorhandene Anthropic-OAuth-/Token-Profile werden ebenfalls unterstützt.
</Note>

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scanning (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **kostenlosen Modellkatalog** von OpenRouter und kann optional Modelle auf Tool- und Bildunterstützung prüfen.

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
  Setzt `agents.defaults.model.primary` auf die erste Auswahl.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Setzt `agents.defaults.imageModel.primary` auf die erste Bildauswahl.
</ParamField>

<Note>
Der OpenRouter-`/models`-Katalog ist öffentlich, daher können reine Metadaten-Scans kostenlose Kandidaten ohne Schlüssel auflisten. Prüfungen und Inferenz erfordern weiterhin einen OpenRouter-API-Schlüssel (aus Auth-Profilen oder `OPENROUTER_API_KEY`). Wenn kein Schlüssel verfügbar ist, fällt `openclaw models scan` auf eine reine Metadaten-Ausgabe zurück und lässt die Konfiguration unverändert. Verwenden Sie `--no-probe`, um den reinen Metadatenmodus ausdrücklich anzufordern.
</Note>

Scan-Ergebnisse werden bewertet nach:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe:

- OpenRouter-`/models`-Liste (Filter `:free`)
- Live-Prüfungen erfordern einen OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [Umgebungsvariablen](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Anforderungs-/Prüfsteuerung: `--timeout`, `--concurrency`

Wenn Live-Prüfungen in einem TTY laufen, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven Modus übergeben Sie `--yes`, um Standardwerte zu akzeptieren. Ergebnisse nur mit Metadaten dienen der Information; `--set-default` und `--set-image` erfordern Live-Prüfungen, damit OpenClaw kein unbrauchbares OpenRouter-Modell ohne Schlüssel konfiguriert.

## Modellregistrierung (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` im Agent-Verzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Provider-Plugin-Kataloge werden als generierte, Plugin-eigene Katalog-Shards im Plugin-Status des Agents gespeichert und automatisch geladen. Diese Datei wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

<AccordionGroup>
  <Accordion title="Rangfolge im Zusammenführungsmodus">
    Rangfolge im Zusammenführungsmodus für übereinstimmende Provider-IDs:

    - Nicht leere `baseUrl`, die bereits in der Agent-`models.json` vorhanden ist, hat Vorrang.
    - Nicht leerer `apiKey` in der Agent-`models.json` hat nur Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profil-Kontext nicht SecretRef-verwaltet ist.
    - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkierungen (`ENV_VAR_NAME` für env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert, statt aufgelöste Secrets dauerhaft zu speichern.
    - SecretRef-verwaltete Provider-Header-Werte werden aus Quellmarkierungen (`secretref-env:ENV_VAR_NAME` für env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert.
    - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf Konfiguration `models.providers` zurück.
    - Andere Provider-Felder werden aus Konfiguration und normalisierten Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

<Note>
Marker-Persistenz ist quellenautoritativ: OpenClaw schreibt Marker aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten Runtime-Secret-Werten. Dies gilt immer, wenn OpenClaw `models.json` neu generiert, einschließlich befehlsgetriebener Pfade wie `openclaw agent`.
</Note>

## Verwandte Themen

- [Agent-Runtimes](/de/concepts/agent-runtimes) — OpenClaw, Codex und andere Agent-Loop-Runtimes
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modellkonfigurationsschlüssel
- [Bildgenerierung](/de/tools/image-generation) — Bildmodellkonfiguration
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Auth
- [Musikgenerierung](/de/tools/music-generation) — Musikmodellkonfiguration
- [Videogenerierung](/de/tools/video-generation) — Videomodellkonfiguration
