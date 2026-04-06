---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden
    - Sie benötigen Einrichtungsanleitungen für MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-04-06T03:11:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ca35c43cdde53f6f09d9e12d48ce09e4c099cf8cbe1407ac6dbb45b1422507e
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Der MiniMax-Provider von OpenClaw verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- gebündelte Sprachsynthese über T2A v2
- gebündeltes Bildverständnis über `MiniMax-VL-01`
- gebündelte Musikgenerierung über `music-2.5+`
- gebündelte `web_search` über die MiniMax Coding Plan Search API

Provider-Aufteilung:

- `minimax`: Text-Provider mit API-Schlüssel, plus gebündelte Bildgenerierung, Bildverständnis, Sprache und Websuche
- `minimax-portal`: Text-Provider mit OAuth, plus gebündelte Bildgenerierung und Bildverständnis

## Modellübersicht

- `MiniMax-M2.7`: standardmäßiges gehostetes Reasoning-Modell.
- `MiniMax-M2.7-highspeed`: schnellere M2.7-Reasoning-Stufe.
- `image-01`: Modell zur Bildgenerierung (Generierung und Bild-zu-Bild-Bearbeitung).

## Bildgenerierung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate`. Es unterstützt:

- **Text-zu-Bild-Generierung** mit Steuerung des Seitenverhältnisses.
- **Bild-zu-Bild-Bearbeitung** (Motivreferenz) mit Steuerung des Seitenverhältnisses.
- Bis zu **9 Ausgabebilder** pro Anfrage.
- Bis zu **1 Referenzbild** pro Bearbeitungsanfrage.
- Unterstützte Seitenverhältnisse: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Um MiniMax für die Bildgenerierung zu verwenden, setzen Sie es als Provider für die Bildgenerierung:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Das Plugin verwendet denselben `MINIMAX_API_KEY` oder dieselbe OAuth-Authentifizierung wie die Textmodelle. Wenn MiniMax bereits eingerichtet ist, ist keine zusätzliche Konfiguration erforderlich.

Sowohl `minimax` als auch `minimax-portal` registrieren `image_generate` mit demselben
Modell `image-01`. Setups mit API-Schlüssel verwenden `MINIMAX_API_KEY`; OAuth-Setups können stattdessen
den gebündelten Auth-Pfad `minimax-portal` verwenden.

Wenn Onboarding oder die Einrichtung per API-Schlüssel explizite Einträge unter `models.providers.minimax`
schreibt, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` mit `input: ["text", "image"]`.

Der integrierte gebündelte MiniMax-Textkatalog selbst bleibt Metadaten nur für Text, bis
diese explizite Provider-Konfiguration vorhanden ist. Das Bildverständnis wird separat über
den plugin-eigenen Medien-Provider `MiniMax-VL-01` bereitgestellt.

Siehe [Image Generation](/de/tools/image-generation) für die gemeinsamen Tool-
Parameter, Provider-Auswahl und Failover-Verhalten.

## Musikgenerierung

Das gebündelte Plugin `minimax` registriert auch Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `minimax/music-2.5+`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Prompt-Steuerungen: `lyrics`, `instrumental`, `durationSeconds`
- Ausgabeformat: `mp3`
- Sitzungsbasierte Ausführungen werden über den gemeinsamen Task-/Status-Ablauf entkoppelt, einschließlich `action: "status"`

Um MiniMax als Standard-Provider für Musik zu verwenden:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

Siehe [Music Generation](/tools/music-generation) für die gemeinsamen Tool-
Parameter, Provider-Auswahl und Failover-Verhalten.

## Videoerzeugung

Das gebündelte Plugin `minimax` registriert auch Videoerzeugung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video und Abläufe mit Einzelbild-Referenz
- Unterstützt `aspectRatio` und `resolution`

Um MiniMax als Standard-Provider für Video zu verwenden:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

Siehe [Video Generation](/tools/video-generation) für die gemeinsamen Tool-
Parameter, Provider-Auswahl und Failover-Verhalten.

## Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Text-
Katalog:

- `minimax`: Standard-Bildmodell `MiniMax-VL-01`
- `minimax-portal`: Standard-Bildmodell `MiniMax-VL-01`

Deshalb kann automatisches Medienrouting das Bildverständnis von MiniMax verwenden, selbst
wenn der gebündelte Text-Provider-Katalog weiterhin nur textbasierte M2.7-Chat-Referenzen anzeigt.

## Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die MiniMax Coding Plan
Search API.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierter Env-Alias: `MINIMAX_CODING_API_KEY`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn er bereits auf ein Coding-Plan-Token zeigt
- Wiederverwendung der Region: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann MiniMax-Provider-Basis-URLs
- Die Suche bleibt auf der Provider-ID `minimax`; OAuth-CN-/globales Setup kann die Region weiterhin indirekt über `models.providers.minimax-portal.baseUrl` steuern

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.
Siehe [MiniMax Search](/de/tools/minimax-search).

## Ein Setup auswählen

### MiniMax OAuth (Coding Plan) - empfohlen

**Am besten geeignet für:** schnelle Einrichtung mit MiniMax Coding Plan über OAuth, kein API-Schlüssel erforderlich.

Authentifizieren Sie sich mit der expliziten regionalen OAuth-Auswahl:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# oder
openclaw onboard --auth-choice minimax-cn-oauth
```

Zuordnung der Auswahl:

- `minimax-global-oauth`: internationale Benutzer (`api.minimax.io`)
- `minimax-cn-oauth`: Benutzer in China (`api.minimaxi.com`)

Siehe die README des MiniMax-Plugin-Pakets im OpenClaw-Repository für Details.

### MiniMax M2.7 (API-Schlüssel)

**Am besten geeignet für:** gehostetes MiniMax mit Anthropic-kompatibler API.

Über die CLI konfigurieren:

- Interaktives Onboarding:

```bash
openclaw onboard --auth-choice minimax-global-api
# oder
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: internationale Benutzer (`api.minimax.io`)
- `minimax-cn-api`: Benutzer in China (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw jetzt standardmäßig das MiniMax-
Thinking, es sei denn, Sie setzen `thinking` selbst ausdrücklich. Der
Streaming-Endpoint von MiniMax sendet `reasoning_content` in Delta-Chunks im OpenAI-Stil
anstelle nativer Anthropic-Thinking-Blöcke, was internes Reasoning
in sichtbare Ausgaben leaken kann, wenn es implizit aktiviert bleibt.

### MiniMax M2.7 als Fallback (Beispiel)

**Am besten geeignet für:** Ihr stärkstes aktuelles Modell als primäres Modell beibehalten und bei Bedarf auf MiniMax M2.7 zurückfallen.
Das folgende Beispiel verwendet Opus als konkretes primäres Modell; ersetzen Sie es durch Ihr bevorzugtes aktuelles primäres Modell.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax ohne Bearbeitung von JSON einzurichten:

1. Führen Sie `openclaw configure` aus.
2. Wählen Sie **Model/auth**.
3. Wählen Sie eine **MiniMax**-Authentifizierungsoption.
4. Wählen Sie bei Aufforderung Ihr Standardmodell aus.

Aktuelle MiniMax-Authentifizierungsoptionen im Assistenten/in der CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Konfigurationsoptionen

- `models.providers.minimax.baseUrl`: bevorzugt `https://api.minimax.io/anthropic` (Anthropic-kompatibel); `https://api.minimax.io/v1` ist optional für OpenAI-kompatible Payloads.
- `models.providers.minimax.api`: bevorzugt `anthropic-messages`; `openai-completions` ist optional für OpenAI-kompatible Payloads.
- `models.providers.minimax.apiKey`: MiniMax-API-Schlüssel (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` definieren.
- `agents.defaults.models`: Aliasnamen für Modelle, die Sie in der Allowlist haben möchten.
- `models.mode`: behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu den integrierten Providern hinzufügen möchten.

## Hinweise

- Modellreferenzen folgen dem Auth-Pfad:
  - API-Schlüssel-Setup: `minimax/<model>`
  - OAuth-Setup: `minimax-portal/<model>`
- Standard-Chat-Modell: `MiniMax-M2.7`
- Alternatives Chat-Modell: `MiniMax-M2.7-highspeed`
- Bei `api: "anthropic-messages"` injiziert OpenClaw
  `thinking: { type: "disabled" }`, sofern Thinking nicht bereits ausdrücklich in
  Parametern/Konfiguration gesetzt ist.
- `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Stream-Pfad in
  `MiniMax-M2.7-highspeed` um.
- Onboarding und direkte API-Schlüssel-Einrichtung schreiben explizite Modelldefinitionen mit
  `input: ["text", "image"]` für beide M2.7-Varianten
- Der gebündelte Provider-Katalog stellt die Chat-Referenzen derzeit als reine Text-
  Metadaten bereit, bis eine explizite MiniMax-Provider-Konfiguration existiert
- Coding Plan Usage API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
- OpenClaw normalisiert die MiniMax-Coding-Plan-Nutzung auf dieselbe Anzeige von `% verbleibend`,
  die auch von anderen Providern verwendet wird. Die rohen Felder `usage_percent` / `usagePercent` von MiniMax
  geben das verbleibende Kontingent an, nicht das verbrauchte Kontingent, daher invertiert OpenClaw sie.
  Zählbasierte Felder haben Vorrang, wenn sie vorhanden sind. Wenn die API `model_remains` zurückgibt,
  bevorzugt OpenClaw den Chat-Modell-Eintrag, leitet das Fenster-Label bei Bedarf aus
  `start_time` / `end_time` ab und schließt den Namen des ausgewählten Modells
  in das Plan-Label ein, damit Coding-Plan-Fenster leichter zu unterscheiden sind.
- Nutzungs-Snapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe
  MiniMax-Kontingentoberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor auf Env-Variablen für Coding-Plan-Schlüssel zurückgegriffen wird.
- Aktualisieren Sie Preiswerte in `models.json`, wenn Sie eine exakte Kostenverfolgung benötigen.
- Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Siehe [/concepts/model-providers](/de/concepts/model-providers) für Provider-Regeln.
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit
  `openclaw models set minimax/MiniMax-M2.7` oder
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Fehlerbehebung

### "Unknown model: minimax/MiniMax-M2.7"

Das bedeutet normalerweise, dass der **MiniMax-Provider nicht konfiguriert ist** (kein passender
Provider-Eintrag und kein gefundener MiniMax-Authentifizierungsprofil-/Env-Schlüssel). Ein Fix für diese
Erkennung ist in **2026.1.12** enthalten. Beheben Sie das Problem durch:

- Upgrade auf **2026.1.12** (oder Ausführung aus dem Quellcode von `main`), dann Neustart des Gateways.
- Ausführen von `openclaw configure` und Auswählen einer **MiniMax**-Authentifizierungsoption, oder
- manuelles Hinzufügen des passenden Blocks `models.providers.minimax` oder
  `models.providers.minimax-portal`, oder
- Setzen von `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder eines MiniMax-Authentifizierungsprofils,
  sodass der passende Provider injiziert werden kann.

Stellen Sie sicher, dass die Modell-ID **groß-/kleinschreibungssensitiv** ist:

- API-Schlüssel-Pfad: `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
- OAuth-Pfad: `minimax-portal/MiniMax-M2.7` oder
  `minimax-portal/MiniMax-M2.7-highspeed`

Prüfen Sie dann erneut mit:

```bash
openclaw models list
```
