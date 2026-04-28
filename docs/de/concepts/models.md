---
read_when:
    - Hinzufügen oder Ändern der Models-CLI (`models list/set/scan/aliases/fallbacks`)
    - Ändern des Modell-Fallback-Verhaltens oder der Auswahl-UX
    - Aktualisieren von Modell-Scan-Probes (Tools/Bilder)
sidebarTitle: Models CLI
summary: 'Models-CLI: auflisten, festlegen, Aliasse, Fallbacks, Scan, Status'
title: Models-CLI
x-i18n:
    generated_at: "2026-04-26T11:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Modell-Failover" href="/de/concepts/model-failover">
    Rotation von Auth-Profilen, Cooldowns und wie das mit Fallbacks zusammenwirkt.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers">
    Kurzer Überblick über Provider und Beispiele.
  </Card>
  <Card title="Agent-Laufzeitumgebungen" href="/de/concepts/agent-runtimes">
    PI, Codex und andere Laufzeitumgebungen der Agent-Schleife.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults">
    Modell-Konfigurationsschlüssel.
  </Card>
</CardGroup>

Modell-Refs wählen einen Provider und ein Modell. Sie wählen normalerweise nicht die Low-Level-Agent-Laufzeitumgebung. Zum Beispiel kann `openai/gpt-5.5` je nach `agents.defaults.agentRuntime.id` über den normalen OpenAI-Providerpfad oder über die Codex-App-Server-Laufzeitumgebung laufen. Siehe [Agent-Laufzeitumgebungen](/de/concepts/agent-runtimes).

## Wie die Modellauswahl funktioniert

OpenClaw wählt Modelle in dieser Reihenfolge aus:

<Steps>
  <Step title="Primäres Modell">
    `agents.defaults.model.primary` (oder `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (in Reihenfolge).
  </Step>
  <Step title="Provider-Auth-Failover">
    Auth-Failover findet innerhalb eines Providers statt, bevor zum nächsten Modell gewechselt wird.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Verwandte Modelloberflächen">
    - `agents.defaults.models` ist die Allowlist/der Katalog der Modelle, die OpenClaw verwenden kann (plus Aliasse).
    - `agents.defaults.imageModel` wird **nur dann** verwendet, wenn das primäre Modell keine Bilder akzeptieren kann.
    - `agents.defaults.pdfModel` wird vom Tool `pdf` verwendet. Wenn es weggelassen wird, fällt das Tool auf `agents.defaults.imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
    - `agents.defaults.imageGenerationModel` wird von der gemeinsamen Funktion zur Bildgenerierung verwendet. Wenn es weggelassen wird, kann `image_generate` trotzdem einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Provider für Bildgenerierung in der Reihenfolge der Provider-IDs. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/API-Schlüssel dieses Providers.
    - `agents.defaults.musicGenerationModel` wird von der gemeinsamen Funktion zur Musikgenerierung verwendet. Wenn es weggelassen wird, kann `music_generate` trotzdem einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Provider für Musikgenerierung in der Reihenfolge der Provider-IDs. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/API-Schlüssel dieses Providers.
    - `agents.defaults.videoGenerationModel` wird von der gemeinsamen Funktion zur Videogenerierung verwendet. Wenn es weggelassen wird, kann `video_generate` trotzdem einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Provider für Videogenerierung in der Reihenfolge der Provider-IDs. Wenn Sie einen bestimmten Provider/ein bestimmtes Modell festlegen, konfigurieren Sie auch die Auth/API-Schlüssel dieses Providers.
    - Standards pro Agent können `agents.defaults.model` über `agents.list[].model` plus Bindings überschreiben (siehe [Multi-Agent-Routing](/de/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Schnelle Modellrichtlinie

- Setzen Sie Ihr primäres Modell auf das stärkste aktuelle Modell, das Ihnen zur Verfügung steht.
- Verwenden Sie Fallbacks für kosten-/latenzempfindliche Aufgaben und Chat mit geringerer Bedeutung.
- Vermeiden Sie bei toolfähigen Agents oder nicht vertrauenswürdigen Eingaben ältere/schwächere Modellstufen.

## Onboarding (empfohlen)

Wenn Sie die Konfiguration nicht von Hand bearbeiten möchten, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Es kann Modell + Auth für gängige Provider einrichten, einschließlich **OpenAI Code (Codex) subscription** (OAuth) und **Anthropic** (API-Schlüssel oder Claude CLI).

## Konfigurationsschlüssel (Überblick)

- `agents.defaults.model.primary` und `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` und `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` und `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` und `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` und `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (Allowlist + Aliasse + Provider-Parameter)
- `models.providers` (benutzerdefinierte Provider, die in `models.json` geschrieben werden)

<Note>
Modell-Refs werden auf Kleinbuchstaben normalisiert. Provider-Aliasse wie `z.ai/*` werden zu `zai/*` normalisiert.

Beispiele für Provider-Konfigurationen (einschließlich OpenCode) finden Sie unter [OpenCode](/de/providers/opencode).
</Note>

### Sichere Bearbeitungen der Allowlist

Verwenden Sie additive Schreibvorgänge, wenn Sie `agents.defaults.models` von Hand aktualisieren:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regeln zum Schutz vor Überschreiben">
    `openclaw config set` schützt Modell-/Provider-Maps vor versehentlichem Überschreiben. Eine einfache Objektzuweisung an `agents.defaults.models`, `models.providers` oder `models.providers.<id>.models` wird abgelehnt, wenn dadurch vorhandene Einträge entfernt würden. Verwenden Sie `--merge` für additive Änderungen; verwenden Sie `--replace` nur, wenn der angegebene Wert zum vollständigen Zielwert werden soll.

    Die interaktive Provider-Einrichtung und `openclaw configure --section model` führen ebenfalls Provider-bezogene Auswahlen in die bestehende Allowlist zusammen, sodass das Hinzufügen von Codex, Ollama oder einem anderen Provider keine nicht verwandten Modelleinträge entfernt. Configure behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Provider-Auth erneut angewendet wird. Explizite Befehle zum Setzen des Standards wie `openclaw models auth login --provider <id> --set-default` und `openclaw models set <model>` ersetzen weiterhin `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## „Model is not allowed“ (und warum Antworten ausbleiben)

Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und für Sitzungsüberschreibungen. Wenn ein Benutzer ein Modell auswählt, das nicht in dieser Allowlist enthalten ist, gibt OpenClaw Folgendes zurück:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Dies geschieht **bevor** eine normale Antwort erzeugt wird, daher kann es sich so anfühlen, als hätte es „nicht geantwortet“. Die Lösung ist entweder:

- Das Modell zu `agents.defaults.models` hinzuzufügen, oder
- die Allowlist zu leeren (`agents.defaults.models` entfernen), oder
- ein Modell aus `/model list` auszuwählen.

</Warning>

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
  <Accordion title="Verhalten des Pickers">
    - `/model` (und `/model list`) ist ein kompakter, nummerierter Picker (Modellfamilie + verfügbare Provider).
    - Auf Discord öffnen `/model` und `/models` einen interaktiven Picker mit Dropdowns für Provider und Modell sowie einem Schritt zum Absenden.
    - `/models add` ist veraltet und gibt jetzt eine Veraltungsmeldung zurück, anstatt Modelle aus dem Chat zu registrieren.
    - `/model <#>` wählt aus diesem Picker aus.

  </Accordion>
  <Accordion title="Persistenz und Live-Wechsel">
    - `/model` speichert die neue Sitzungsauswahl sofort.
    - Wenn der Agent untätig ist, verwendet der nächste Lauf sofort das neue Modell.
    - Wenn bereits ein Lauf aktiv ist, markiert OpenClaw einen Live-Wechsel als ausstehend und startet erst an einem sauberen Wiederholungspunkt mit dem neuen Modell neu.
    - Wenn Tool-Aktivität oder Antwortausgabe bereits begonnen hat, kann der ausstehende Wechsel bis zu einer späteren Wiederholungsmöglichkeit oder bis zur nächsten Benutzereingabe in der Warteschlange bleiben.
    - `/model status` ist die detaillierte Ansicht (Auth-Kandidaten und, falls konfiguriert, Provider-Endpunkt `baseUrl` + `api`-Modus).

  </Accordion>
  <Accordion title="Ref-Parsing">
    - Modell-Refs werden durch Aufteilen am **ersten** `/` geparst. Verwenden Sie `provider/model`, wenn Sie `/model <ref>` eingeben.
    - Wenn die Modell-ID selbst `/` enthält (OpenRouter-Stil), müssen Sie das Provider-Präfix angeben (Beispiel: `/model openrouter/moonshotai/kimi-k2`).
    - Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe in dieser Reihenfolge auf:
      1. Alias-Treffer
      2. eindeutiger Treffer eines konfigurierten Providers für genau diese Modell-ID ohne Präfix
      3. veralteter Fallback auf den konfigurierten Standard-Provider — wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw stattdessen auf das erste konfigurierte Provider-/Modellpaar zurück, um keinen veralteten entfernten Provider-Standard anzuzeigen.
  </Accordion>
</AccordionGroup>

Vollständiges Befehlsverhalten/Komfiguration: [Slash commands](/de/tools/slash-commands).

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

<ParamField path="--all" type="boolean">
  Vollständiger Katalog. Enthält gebündelte statische Katalogzeilen im Besitz von Providern, bevor Auth konfiguriert ist, sodass reine Discovery-Ansichten Modelle anzeigen können, die erst verfügbar sind, wenn Sie passende Provider-Zugangsdaten hinzufügen.
</ParamField>
<ParamField path="--local" type="boolean">
  Nur lokale Provider.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Nach Provider-ID filtern, zum Beispiel `moonshot`. Anzeige-Bezeichnungen aus interaktiven Pickern werden nicht akzeptiert.
</ParamField>
<ParamField path="--plain" type="boolean">
  Ein Modell pro Zeile.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbare Ausgabe.
</ParamField>

### `models status`

Zeigt das aufgelöste primäre Modell, Fallbacks, Bildmodell und eine Auth-Übersicht der konfigurierten Provider. Es macht auch den OAuth-Ablaufstatus für Profile sichtbar, die im Auth-Speicher gefunden wurden (warnt standardmäßig innerhalb von 24 Stunden). `--plain` gibt nur das aufgelöste primäre Modell aus.

<AccordionGroup>
  <Accordion title="Auth- und Probe-Verhalten">
    - Der OAuth-Status wird immer angezeigt (und in der `--json`-Ausgabe enthalten). Wenn ein konfigurierter Provider keine Zugangsdaten hat, gibt `models status` einen Abschnitt **Missing auth** aus.
    - JSON enthält `auth.oauth` (Warnfenster + Profile) und `auth.providers` (effektive Auth pro Provider, einschließlich env-gestützter Zugangsdaten). `auth.oauth` ist nur die Profilgesundheit des Auth-Speichers; reine Env-Provider erscheinen dort nicht.
    - Verwenden Sie `--check` für Automatisierung (Exit `1` bei fehlend/abgelaufen, `2` bei bald ablaufend).
    - Verwenden Sie `--probe` für Live-Auth-Prüfungen; Probe-Zeilen können aus Auth-Profilen, Env-Zugangsdaten oder `models.json` stammen.
    - Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet Probe `excluded_by_auth_order`, statt es zu versuchen. Wenn Auth vorhanden ist, aber für diesen Provider kein prüfbares Modell aufgelöst werden kann, meldet Probe `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Die Wahl der Auth ist von Provider/Konto abhängig. Für immer aktive Gateway-Hosts sind API-Schlüssel meist am vorhersehbarsten; Wiederverwendung von Claude CLI und vorhandene Anthropic-OAuth-/Token-Profile werden ebenfalls unterstützt.
</Note>

Beispiel (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scanning (kostenlose OpenRouter-Modelle)

`openclaw models scan` prüft den **freien Modellkatalog** von OpenRouter und kann optional Modelle auf Tool- und Bildunterstützung testen.

<ParamField path="--no-probe" type="boolean">
  Live-Probes überspringen (nur Metadaten).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimale Parametergröße (Milliarden).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Ältere Modelle überspringen.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filter nach Provider-Präfix.
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
Der OpenRouter-Katalog `/models` ist öffentlich, daher können Scans nur mit Metadaten freie Kandidaten auch ohne Schlüssel auflisten. Probing und Inferenz erfordern weiterhin einen OpenRouter-API-Schlüssel (aus Auth-Profilen oder `OPENROUTER_API_KEY`). Wenn kein Schlüssel verfügbar ist, fällt `openclaw models scan` auf eine Ausgabe nur mit Metadaten zurück und lässt die Konfiguration unverändert. Verwenden Sie `--no-probe`, um ausdrücklich den Modus nur mit Metadaten anzufordern.
</Note>

Scannergebnisse werden sortiert nach:

1. Bildunterstützung
2. Tool-Latenz
3. Kontextgröße
4. Parameteranzahl

Eingabe:

- OpenRouter-Liste `/models` (Filter `:free`)
- Live-Probes erfordern einen OpenRouter-API-Schlüssel aus Auth-Profilen oder `OPENROUTER_API_KEY` (siehe [Environment variables](/de/help/environment))
- Optionale Filter: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Steuerung von Anfragen/Probes: `--timeout`, `--concurrency`

Wenn Live-Probes in einem TTY laufen, können Sie Fallbacks interaktiv auswählen. Im nicht interaktiven Modus übergeben Sie `--yes`, um die Standardwerte zu akzeptieren. Ergebnisse nur mit Metadaten sind informativ; `--set-default` und `--set-image` erfordern Live-Probes, damit OpenClaw kein unbrauchbares OpenRouter-Modell ohne Schlüssel konfiguriert.

## Modellregister (`models.json`)

Benutzerdefinierte Provider in `models.providers` werden in `models.json` unter dem Agent-Verzeichnis geschrieben (Standard `~/.openclaw/agents/<agentId>/agent/models.json`). Diese Datei wird standardmäßig zusammengeführt, sofern `models.mode` nicht auf `replace` gesetzt ist.

<AccordionGroup>
  <Accordion title="Priorität im Merge-Modus">
    Priorität im Merge-Modus für übereinstimmende Provider-IDs:

    - Bereits vorhandenes, nicht leeres `baseUrl` in der `models.json` des Agent hat Vorrang.
    - Nicht leeres `apiKey` in der `models.json` des Agent hat nur dann Vorrang, wenn dieser Provider im aktuellen Kontext von config/Auth-Profilen nicht durch SecretRef verwaltet wird.
    - Durch SecretRef verwaltete `apiKey`-Werte von Providern werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs), statt aufgelöste Secrets dauerhaft zu speichern.
    - Durch SecretRef verwaltete Header-Werte von Providern werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs).
    - Leeres oder fehlendes `apiKey`/`baseUrl` des Agent fällt auf config `models.providers` zurück.
    - Andere Provider-Felder werden aus der Konfiguration und normalisierten Katalogdaten aktualisiert.

  </Accordion>
</AccordionGroup>

<Note>
Die Persistenz von Markern ist quellmaßgeblich: OpenClaw schreibt Marker aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung), nicht aus aufgelösten Secret-Werten der Laufzeit. Dies gilt immer dann, wenn OpenClaw `models.json` neu erzeugt, einschließlich befehlsgesteuerter Pfade wie `openclaw agent`.
</Note>

## Verwandt

- [Agent-Laufzeitumgebungen](/de/concepts/agent-runtimes) — PI, Codex und andere Laufzeitumgebungen der Agent-Schleife
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modell-Konfigurationsschlüssel
- [Bildgenerierung](/de/tools/image-generation) — Konfiguration von Bildmodellen
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten
- [Modell-Provider](/de/concepts/model-providers) — Provider-Routing und Auth
- [Musikgenerierung](/de/tools/music-generation) — Konfiguration von Musikmodellen
- [Videogenerierung](/de/tools/video-generation) — Konfiguration von Videomodellen
