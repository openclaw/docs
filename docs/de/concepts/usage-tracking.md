---
read_when:
    - Sie binden Oberflächen für Provider-Nutzung und -Kontingente an
    - Sie müssen das Verhalten der Nutzungsverfolgung oder die Authentifizierungsanforderungen erläutern
summary: Oberflächen zur Nutzungsverfolgung und Anforderungen an Zugangsdaten
title: Nutzungsverfolgung
x-i18n:
    generated_at: "2026-07-16T12:41:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Was es ist

- Ruft Nutzung und Kontingent direkt vom Nutzungsendpunkt jedes Providers ab. Keine geschätzte Provider-Abrechnung; ausschließlich vom Provider gemeldete Tarifnamen, Kontingentzeiträume, Guthaben, Ausgaben, Budgets, täglicher Kostenverlauf, Token-/Modellzuordnung oder Zusammenfassungen des Kontostatus.
- Die menschenlesbare Ausgabe für Kontingentzeiträume wird auf `X% left` normalisiert, selbst wenn ein Provider verbrauchtes Kontingent, verbleibendes Kontingent oder nur Rohwerte meldet. Bei Providern ohne zurücksetzbare Kontingentzeiträume wird stattdessen ein Zusammenfassungstext des Providers angezeigt (beispielsweise ein Guthaben).
- Das sitzungsbezogene `/status` und das Tool `session_status` greifen auf das Transkriptprotokoll der Sitzung zurück, wenn der Live-Sitzungssnapshot keine Token-/Modelldaten enthält. Dieser Rückgriff ergänzt fehlende Token-/Cache-Zähler, kann die Bezeichnung des aktiven Laufzeitmodells wiederherstellen und bevorzugt die größere, promptorientierte Gesamtsumme, wenn Sitzungsmetadaten fehlen oder kleiner sind (`totalTokensFresh !== true`, null oder unter dem aus dem Transkript abgeleiteten Wert). Von null verschiedene Live-Werte haben gegenüber dem Rückgriff immer Vorrang.

## Wo es angezeigt wird

- `/status` in Chats: Statuskarte mit Sitzungstokens und geschätzten Kosten (nur Modelle mit API-Schlüssel). Die Provider-Nutzung wird, sofern verfügbar, für den **Provider des aktuellen Modells** als normalisierter Zeitraum `X% left` oder als Zusammenfassungstext des Providers angezeigt.
- `/usage off|tokens|full` in Chats: Nutzungsfußzeile pro Antwort.
- `/usage cost` in Chats: lokale Kostenzusammenfassung, aggregiert aus OpenClaw-Sitzungsprotokollen.
- CLI: `openclaw status --usage` gibt eine vollständige Aufschlüsselung von Nutzung und Kontingent je Provider aus.
- CLI: `openclaw models status` listet OAuth-/Token-Authentifizierungsprofile auf und zeigt neben jedem Provider, für den eine solche Zusammenfassung verfügbar ist, eine Zusammenfassung des Nutzungszeitraums an.
- Control UI: **Nutzung** zeigt Tarif- und Abrechnungskarten des Providers oberhalb der aus Sitzungen abgeleiteten Analyse von Tokens und geschätzten Kosten durch OpenClaw. Anmeldedaten für die Anthropic- und OpenAI-Admin-API ergänzen vom Provider gemeldete Ausgaben für heute, 7 Tage und 30 Tage, tägliche Trends, Token-Gesamtsummen, meistgenutzte Modelle und Kostenkategorien.
- Control UI: Das Kontextkreis-Popover des Chat-Eingabefelds zeigt die **Tarifnutzung** für Abonnement-Provider – Balken je Zeitraum (5 Stunden, wöchentlich, modellspezifisch) mit Rücksetzzeiten, den Provider-Tarif, sofern bekannt (beispielsweise `Max (20x)`), sowie Guthaben für zusätzliche Nutzung. Über einen Tarif abgerechnete Sitzungen blenden Dollar-Schätzungen pro Token aus; API-abgerechnete Sitzungen behalten `Est. cost` und die Kostenaufschlüsselung nach Typ bei. Claude-Code-CLI-Konfigurationen (`claude-cli`) verwenden dieselbe Anthropic-Abonnementnutzung.
- macOS-Menüleiste: Unter „Kontext“ wird ein Hauptabschnitt „Nutzung“ angezeigt, wenn Snapshots der Provider-Nutzung verfügbar sind. Siehe [Menüleiste](/de/platforms/mac/menu-bar).

`openclaw channels list` gibt die Provider-Nutzung nicht mehr aus, sondern verweist Benutzer stattdessen auf `openclaw status` oder `openclaw models list`.

## Kostenverlauf von Anthropic und OpenAI

Abonnementkontingent und API-Abrechnung sind unterschiedliche Provider-Oberflächen:

- Anmeldedaten für Anthropic-Abonnements/-Konfigurationen zeigen weiterhin Claude-Kontingentzeiträume und optionale Budgets für zusätzliche Nutzung an. Legen Sie `ANTHROPIC_ADMIN_KEY` oder `ANTHROPIC_ADMIN_API_KEY` fest, um stattdessen den Verlauf der organisationsweiten Usage and Cost API anzuzeigen. Anmeldedaten eines Anthropic-Providers, die mit `sk-ant-admin` beginnen, werden automatisch erkannt.
- OpenAI ChatGPT/Codex OAuth zeigt weiterhin Tarif, Kontingentzeiträume und Guthaben an. Legen Sie `OPENAI_ADMIN_KEY` fest, um stattdessen den Verlauf der organisationsweiten Kosten und Completion-Nutzung anzuzeigen; optional können Sie `OPENAI_PROJECT_ID` festlegen, um ihn auf ein Projekt zu beschränken. OpenClaw sendet niemals Inferenzanmeldedaten aus `OPENAI_API_KEY`, der Provider-Konfiguration oder Authentifizierungsprofilen an Organisations-APIs, da diese Schlüssel zu benutzerdefinierten Endpunkten gehören können.

Admin-Anmeldedaten haben Vorrang, da sie die tatsächliche Organisationsabrechnung bereitstellen. OpenClaw kombiniert diese vom Provider gemeldeten Gesamtsummen nicht mit seinen lokalen Sitzungsschätzungen; die beiden Abschnitte beantworten bewusst unterschiedliche Fragen.

## Standardmodus der Nutzungsfußzeile

`/usage off|tokens|full` legt die Fußzeile für eine Sitzung fest und wird für diese
Sitzung gespeichert. `messages.responseUsage` legt diesen Modus initial für Sitzungen fest, die noch
keinen ausgewählt haben, sodass die Fußzeile standardmäßig aktiviert sein kann, ohne jedes Mal `/usage` einzugeben.

Legen Sie einen Modus für alle Kanäle oder eine kanalspezifische Zuordnung mit einem `default`-Rückgriff fest:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // oder: { "default": "off", "discord": "full" }
  },
}
```

Akzeptierte Werte: `"off"`, `"tokens"`, `"full"` und der veraltete Alias `"on"` (wird als `"tokens"` behandelt).

### Drei unterschiedliche Sitzungszustände

Das Feld `responseUsage` einer Sitzung besitzt drei darstellbare Zustände mit jeweils
unterschiedlicher Semantik:

| Zustand                  | Gespeicherter Wert                        | Wirksamer Modus                                                                 |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------- |
| **Nicht gesetzt / erben** | `undefined` (nicht vorhanden)     | Greift auf den Konfigurationsstandard `messages.responseUsage`, danach auf `off` zurück. |
| **Explizit aus**         | `"off"` (gespeichert)          | Immer aus; ein Konfigurationsstandard ungleich „aus“ kann die Fußzeile nicht wieder aktivieren. |
| **Explizit an**          | `"tokens"` oder `"full"` (gespeichert) | Dieser Modus gilt unabhängig vom Konfigurationsstandard.                        |

### Vorrang

Wirksamer Modus = Sitzungsüberschreibung → Kanalkonfigurationseintrag → `default` → `off`.

Ein explizites `/usage off` wird als Literalwert `"off"` in der
Sitzung **gespeichert** und entspricht nicht „nicht gesetzt“. Ein von „aus“ abweichender Standardwert
`messages.responseUsage` kann die Fußzeile nicht wieder aktivieren, nachdem der Benutzer sie ausdrücklich deaktiviert hat.

### Zurücksetzen im Vergleich zum Ausschalten

- `/usage off` erzwingt das Ausschalten der Fußzeile und speichert diese Auswahl. Ein konfigurierter
  Standardwert ungleich „aus“ kann dies nicht überschreiben.
- `/usage reset` (Aliasse: `default`, `inherit`, `inherited`, `clear`, `unpin`) entfernt die Sitzungsüberschreibung.
  Die Sitzung **erbt** anschließend den wirksamen Konfigurationsstandard
  (`messages.responseUsage`). Ist kein Standard konfiguriert, bleibt die Fußzeile ausgeschaltet.
- Ein vollständiges Zurücksetzen der Sitzung (`/reset` oder `/new`) oder ein Sitzungswechsel **bewahrt**
  die explizite Einstellung des Nutzungsmodus, sodass die Anzeigeauswahl des Benutzers
  Sitzungswechsel überdauert. Nur `/usage reset` (und dessen Aliasse) entfernt die Überschreibung.

### Umschaltverhalten

`/usage` ohne Argumente durchläuft: aus → Tokens → vollständig → aus. Ausgangspunkt
des Zyklus ist der **wirksame** aktuelle Modus (die Sitzungsüberschreibung greift, wenn nicht gesetzt,
auf den Konfigurationsstandard zurück), sodass der Zyklus stets dem entspricht, was
der Benutzer aktuell in der Fußzeile sieht.

### Konfiguration

Ohne Konfiguration bleibt das bisherige Verhalten bestehen (Fußzeile aus, bis `/usage`). Verwenden Sie
`/usage reset`, um eine Sitzungsüberschreibung zu entfernen und den konfigurierten Standard erneut zu erben.

## Benutzerdefinierte `/usage full`-Fußzeile

`/usage tokens` rendert immer eine einfache `Usage: X in / Y out`-Zeile (zuzüglich Cache- und
geschätzter Kostenzusätze, sofern verfügbar). Nur `/usage full` rendert die nachfolgend beschriebene
umfangreichere Fußzeile.

`/usage full` zeigt eine integrierte kompakte Fußzeile mit Modell, Reasoning, schnell/langsam,
Kontextfenster und Kosten an, sofern diese Felder verfügbar sind. Für die integrierte Fußzeile ist
keine Vorlagendatei erforderlich.

`messages.usageTemplate` ist ausschließlich für erweiterte benutzerdefinierte Layouts vorgesehen. Der Wert ist ein
JSON-Dateipfad (unterstützt `~`) oder ein Inline-Objekt und ersetzt bei Gültigkeit die integrierte
Fußzeile. Ein Dateipfad wird überwacht und bei Änderungen live neu geladen.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Fehlende oder leere Vorlagen greifen ohne Meldung auf die integrierte Fußzeile zurück. Nicht lesbare
oder ungültige konfigurierte Vorlagen (fehlerhaftes JSON oder eine Struktur ohne renderbare
Ausgabeteile) greifen ebenfalls auf die integrierte Fußzeile zurück und geben eine Warnung für den Betreiber aus.

Beginnen Sie benutzerdefinierte Vorlagen mit der integrierten Struktur und bearbeiten Sie anschließend die Teile, die Sie
ändern möchten:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Struktur

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "Zeichen von niedrig bis hoch" }, // Zeichenfolge (1 Glyphe/Zeichen) oder Array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // verbindet verbleibende Teile
    "default": [/* pieces */], // Rückgriff für jede Oberfläche
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

Jede Oberfläche ist eine geordnete Liste von **Teilen**; die Engine rendert jeden Teil, verwirft
leere Teile und verbindet die verbleibenden mit `sep`. Eine Oberfläche ohne Eintrag verwendet
`output.default`.

### Vertragspfade

Ein Teil liest Werte anhand eines Punktpfads aus dem Vertrag pro Durchlauf. Fehlende Werte sind
leer (sodass eine `when`-Bedingung oder ein `|fallback` den Teil sauber hält).

| Pfad                                                                                | Bedeutung                                                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | Kanal-ID (`discord`/`telegram`/usw.)                                                               |
| `agentId` / `chat_type`                                                             | ID des zuständigen Agenten / Art der Chat-Oberfläche                                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | Modell-ID / Anzeigename / Provider-ID                                                                |
| `model.actual`, `model.resolved_ref`                                                | tatsächlich für den Turn verwendete Provider-/Modellreferenz                                                        |
| `model.requested`                                                                   | angeforderte Provider-/Modellreferenz (vor dem Fallback)                                                       |
| `model.reasoning`                                                                   | Aufwand (`off` bis `xhigh`)                                                                       |
| `model.is_fallback` / `model.is_override`                                           | boolescher Wert: Fallback verwendet / Modell fixiert                                                                   |
| `model.override_source` / `model.auth_mode`                                         | Bezeichnung der Override-Quelle / Anmeldedatenmodus (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | boolescher Wert: schnell oder langsam                                                                                   |
| `state.compactions`                                                                 | Anzahl der Compactions für die Sitzung                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | Fensterbudget / belegte Token / 0–100 verwendet                                                         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | Turn-Aggregat                                                                                       |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | Cache-Lese- und Cache-Schreib-Token für den Turn                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | Schutzbedingungen für die Token-Anzeige                                                                                 |
| `usage.cache_hit_pct`                                                               | Anteil der aus dem Cache gelesenen Token an allen Prompt-Token                                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | nur der letzte Modellaufruf (enthält außerdem `cache_read_tokens`, `cache_write_tokens`, `total_tokens`)           |
| `cost.turn_usd` / `cost.available`                                                  | geschätzte Turn-Kosten / ob eine Kostentabelle aufgelöst wurde                                                  |
| `timing.duration_ms`                                                                | Turn-Dauer nach verstrichener Echtzeit                                                                             |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | Name der Agentenidentität / Emoji / Avatar                                                                 |
| `session.id`                                                                        | Sitzungs-ID                                                                                           |

(Zeitfenster für Provider-Ratenlimits sind **nicht** Teil dieses Vertrags; derzeit gibt es keinen Pfad mit einem Array-Wert, sodass ein `each`-Element nichts zum Iterieren hat.)

### Verben

Leiten Sie einen Wert von links nach rechts durch Verben; ein Segment, das kein Verb ist, dient als Fallback.

| Verb            | Wirkung                                | Beispiel                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | kompakte Anzahl                         | `272000 -> 272k`                  |
| `fixed:N`       | N Dezimalstellen (Standardwert 2)                | `0.0377`                          |
| `dur`           | Sekunden in eine Dauer umwandeln                   | `14820 -> 4h07m`                  |
| `pct`           | `%` anhängen                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | für die Umwandlung von verwendet in verbleibend             |
| `alias:TABLE`   | in `aliases` nachschlagen, nicht aufgeführte Werte unverändert ausgeben | `medium -> 🌗`                    |
| `meter:W:SCALE` | W-Zellen-Glyphenleiste für einen Wert von 0–100   | `[⣿⣿⠐⠐⠐]` (`meter:1` = eine Glyphe) |

### Elementformen

- `{ "text": "📚 {context.max_tokens|num}" }`: Literal + Interpolation.
- `{ "when": "<path>", "text": "..." }`: nur rendern, wenn der Pfad einen Wahrheitswert ergibt.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: Wert in Glyphe umwandeln (ein `_default`-Fall deckt nicht übereinstimmende Werte ab).
- `{ "each": "<array-path>", "item": "{label}" }`: über einen Pfad mit Array-Wert iterieren (derzeit ist kein Vertragspfad ein Array).

### Beispiel

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

rendert z. B. `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Provider + Anmeldedaten

Die Nutzung wird ausgeblendet, wenn keine verwendbare Provider-Authentifizierung für Nutzungsdaten aufgelöst werden kann. OpenClaw
erkennt automatisch aktivierte Provider-Plugins, die
`contracts.usageProviders` deklarieren und sowohl `resolveUsageAuth` als auch
`fetchUsageSnapshot` implementieren; es gibt keine separate Provider-Zulassungsliste im Kern. Der statische
Vertrag begrenzt den Umfang der Erkennung, ohne jedes Provider-Plugin zu importieren. Jedes
Plugin ist für seinen Upstream-Endpunkt und die Zuordnung der Antworten zuständig. Der
gemeinsame Snapshot hält Tarifnamen, Kontingentfenster, Guthaben, Ausgaben und Budgets
Provider-neutral für Nutzer der CLI, App und Control UI.

- **Anthropic (Claude)**: OAuth-Token in Authentifizierungsprofilen. Wenn dem OAuth-Token der
  Geltungsbereich `user:profile` fehlt, erfolgt bei entsprechender Konfiguration ein Fallback auf eine
  `claude.ai`-Websitzung (`CLAUDE_AI_SESSION_KEY`, `CLAUDE_WEB_SESSION_KEY` oder ein
  `sessionKey=`-Cookie in `CLAUDE_WEB_COOKIE`).
  Modellspezifische Limits sowie aktivierte monatliche Ausgaben/Budgets für Zusatznutzung werden
  einbezogen, wenn Anthropic sie meldet. Ein expliziter Anthropic-Admin-API-Schlüssel oder ein
  automatisch erkanntes `sk-ant-admin...`-Provider-Profil zeigt stattdessen die
  Organisationskosten der letzten 30 Tage und den Verlauf der Messages API an.
- **ClawRouter**: API-Schlüssel (`CLAWROUTER_API_KEY`). Zeigt bei entsprechender Konfiguration ein monatliches Budgetfenster
  und ein typisiertes USD-Budget an; andernfalls werden die Gesamtausgaben sowie eine
  Zusammenfassung von Anfragen, Token und Kosten angezeigt.
- **DeepSeek**: API-Schlüssel über Umgebung/Konfiguration/Authentifizierungsspeicher (`DEEPSEEK_API_KEY`).
  Zeigt jedes vom Provider gemeldete Währungsguthaben an.
- **GitHub Copilot**: OAuth-Token in Authentifizierungsprofilen.
- **Gemini CLI**: OAuth-Token in Authentifizierungsprofilen.
- **MiniMax**: API-Schlüssel oder MiniMax-OAuth-Authentifizierungsprofil. OpenClaw behandelt
  `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingentoberfläche,
  bevorzugt vorhandenes gespeichertes MiniMax-OAuth und greift andernfalls auf
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY` zurück.
  Die Nutzungsabfrage leitet den Host des Coding Plans aus `models.providers.minimax-portal.baseUrl`
  oder `models.providers.minimax.baseUrl` ab, sofern konfiguriert, und verwendet andernfalls den
  MiniMax-CN-Host.
  Die Rohfelder `usage_percent` / `usagePercent` von MiniMax bedeuten **verbleibendes**
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige; anzahlbasierte Felder haben
  Vorrang, wenn sie vorhanden sind.
  - Fensterbezeichnungen stammen aus den Stunden-/Minutenfeldern des Providers, wenn diese vorhanden sind, und
    greifen anschließend auf die Spanne `start_time` / `end_time` zurück.
  - Wenn der Coding-Plan-Endpunkt `model_remains` zurückgibt, bevorzugt OpenClaw den
    Chatmodell-Eintrag, leitet die Fensterbezeichnung aus Zeitstempeln ab, wenn explizite
    Felder `window_hours` / `window_minutes` fehlen, und nimmt den Modellnamen
    in die Tarifbezeichnung auf.
- **OpenAI (Codex-/ChatGPT-Tarif)**: OAuth-Token in Authentifizierungsprofilen (`ChatGPT-Account-Id`-
  Header wird gesendet, wenn eine Konto-ID vorhanden ist). Zeigt den ChatGPT-Tarif, zurücksetzbare
  Codex-Fenster und ein Guthaben an, wenn diese gemeldet werden. Guthaben bleibt
  Provider-Guthaben; OpenClaw bezeichnet es nicht als Dollar. `OPENAI_ADMIN_KEY` ergänzt
  die Organisationskosten der letzten 30 Tage und den Verlauf der Completions-Nutzung, wenn der Schlüssel Zugriff auf das Usage
  Dashboard hat. Inferenz-Anmeldedaten werden niemals an Organisations-APIs weitergeleitet.
- **OpenRouter**: API-Schlüssel oder OAuth-gestützter API-Schlüssel (`OPENROUTER_API_KEY` oder ein
  Authentifizierungsprofil). Kombiniert den Endpunkt für Kontoguthaben mit dem Endpunkt für Schlüsselkontingente,
  sodass Kontostand/-ausgaben, Schlüsselbudget sowie tägliche/wöchentliche/monatliche Nutzung
  angezeigt werden, wenn die Anmeldedaten darauf zugreifen können. Beide Endpunkte können den Snapshot
  unabhängig voneinander anreichern.
- **Venice**: API-Schlüssel über Umgebung/Konfiguration/Authentifizierungsspeicher (`VENICE_API_KEY`). Zeigt USD- und
  DIEM-Guthaben sowie die Nutzung der DIEM-Epochenzuweisung an, wenn diese gemeldet werden.
- **Xiaomi MiMo**: zwei separate Nutzungsoberflächen. Nutzungsabhängige Abrechnung verwendet einen API-Schlüssel
  (`XIAOMI_API_KEY`); der Token-Tarif verwendet einen separaten Schlüssel (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Derzeit meldet keiner von beiden Kontingentfenster.
- **z.ai**: API-Schlüssel über Umgebung/Konfiguration/Authentifizierungsspeicher (`ZAI_API_KEY` oder `Z_AI_API_KEY`).

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Menüleiste](/de/platforms/mac/menu-bar)
