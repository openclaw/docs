---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten Codex-Abonnement-Auth anstelle von API-Schlüsseln verwenden
summary: OpenAI in OpenClaw per API-Schlüsseln oder Codex-Abonnement verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-06T03:11:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e04db5787f6ed7b1eda04d965c10febae10809fc82ae4d9769e7163234471f5
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI bietet Entwickler-APIs für GPT-Modelle. Codex unterstützt **ChatGPT-Anmeldung** für abonnementbasierten
Zugriff oder **API-Schlüssel**-Anmeldung für nutzungsbasierte Abrechnung. Codex Cloud erfordert die ChatGPT-Anmeldung.
OpenAI unterstützt die Verwendung von Abonnement-OAuth in externen Tools/Workflows wie OpenClaw ausdrücklich.

## Standard-Interaktionsstil

OpenClaw kann sowohl für `openai/*`- als auch für
`openai-codex/*`-Ausführungen ein kleines OpenAI-spezifisches Prompt-Overlay hinzufügen. Standardmäßig hält das
Overlay den Assistenten warm, kollaborativ, prägnant, direkt und ein wenig emotional
ausdrucksstärker, ohne den grundlegenden OpenClaw-System-Prompt zu ersetzen. Das freundliche Overlay
erlaubt außerdem gelegentlich ein Emoji, wenn es natürlich passt, hält die Gesamtausgabe aber
prägnant.

Konfigurationsschlüssel:

`plugins.entries.openai.config.personality`

Zulässige Werte:

- `"friendly"`: Standard; aktiviert das OpenAI-spezifische Overlay.
- `"off"`: deaktiviert das Overlay und verwendet nur den grundlegenden OpenClaw-Prompt.

Geltungsbereich:

- Gilt für `openai/*`-Modelle.
- Gilt für `openai-codex/*`-Modelle.
- Betrifft keine anderen Provider.

Dieses Verhalten ist standardmäßig aktiviert. Behalten Sie `"friendly"` explizit bei, wenn Sie möchten, dass dies
künftige lokale Konfigurationsänderungen überdauert:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Das OpenAI-Prompt-Overlay deaktivieren

Wenn Sie den unveränderten grundlegenden OpenClaw-Prompt möchten, setzen Sie das Overlay auf `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Sie können es auch direkt mit der Konfigurations-CLI setzen:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## Option A: OpenAI-API-Schlüssel (OpenAI Platform)

**Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.
Holen Sie sich Ihren API-Schlüssel aus dem OpenAI-Dashboard.

### CLI-Setup

```bash
openclaw onboard --auth-choice openai-api-key
# oder nicht interaktiv
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Konfigurations-Snippet

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

Die aktuellen API-Modell-Dokumente von OpenAI führen `gpt-5.4` und `gpt-5.4-pro` für die direkte
Verwendung der OpenAI-API auf. OpenClaw leitet beide über den `openai/*`-Responses-Pfad weiter.
OpenClaw unterdrückt die veraltete Zeile `openai/gpt-5.3-codex-spark` absichtlich,
weil direkte OpenAI-API-Aufrufe sie im Live-Traffic ablehnen.

OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** auf dem direkten OpenAI-
API-Pfad bereit. `pi-ai` liefert zwar weiterhin eine eingebaute Zeile für dieses Modell, aber Live-OpenAI-API-
Requests lehnen es derzeit ab. Spark wird in OpenClaw als nur für Codex behandelt.

## Bildgenerierung

Das gebündelte `openai`-Plugin registriert außerdem Bildgenerierung über das gemeinsame
Tool `image_generate`.

- Standard-Bildmodell: `openai/gpt-image-1`
- Generieren: bis zu 4 Bilder pro Request
- Bearbeitungsmodus: aktiviert, bis zu 5 Referenzbilder
- Unterstützt `size`
- Aktuelle OpenAI-spezifische Einschränkung: OpenClaw leitet `aspectRatio`- oder
  `resolution`-Überschreibungen derzeit nicht an die OpenAI Images API weiter

So verwenden Sie OpenAI als Standard-Provider für Bilder:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Unter [Image Generation](/de/tools/image-generation) finden Sie die gemeinsamen Tool-
Parameter, die Provider-Auswahl und das Failover-Verhalten.

## Videogenerierung

Das gebündelte `openai`-Plugin registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `openai/sora-2`
- Modi: Text-zu-Video, Bild-zu-Video und Abläufe für einzelne Video-Referenzen/Bearbeitungen
- Aktuelle Grenzen: 1 Bild- oder 1 Video-Referenzeingabe
- Aktuelle OpenAI-spezifische Einschränkung: OpenClaw leitet derzeit nur `size`-
  Überschreibungen für native OpenAI-Videogenerierung weiter. Nicht unterstützte optionale Überschreibungen
  wie `aspectRatio`, `resolution`, `audio` und `watermark` werden ignoriert
  und als Tool-Warnung zurückgemeldet.

So verwenden Sie OpenAI als Standard-Provider für Video:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Unter [Video Generation](/tools/video-generation) finden Sie die gemeinsamen Tool-
Parameter, die Provider-Auswahl und das Failover-Verhalten.

## Option B: OpenAI Code (Codex)-Abonnement

**Am besten geeignet für:** die Verwendung von ChatGPT-/Codex-Abonnementzugriff anstelle eines API-Schlüssels.
Codex Cloud erfordert die ChatGPT-Anmeldung, während die Codex-CLI die Anmeldung per ChatGPT oder API-Schlüssel unterstützt.

### CLI-Setup (Codex OAuth)

```bash
# Codex OAuth im Assistenten ausführen
openclaw onboard --auth-choice openai-codex

# Oder OAuth direkt ausführen
openclaw models auth login --provider openai-codex
```

### Konfigurations-Snippet (Codex-Abonnement)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Die aktuellen Codex-Dokumente von OpenAI führen `gpt-5.4` als aktuelles Codex-Modell auf. OpenClaw
ordnet dies `openai-codex/gpt-5.4` für die Verwendung mit ChatGPT-/Codex-OAuth zu.

Wenn das Onboarding eine vorhandene Codex-CLI-Anmeldung wiederverwendet, bleiben diese Zugangsdaten
durch die Codex-CLI verwaltet. Nach Ablauf liest OpenClaw zuerst die externe Codex-Quelle erneut
ein und schreibt die aktualisierten Zugangsdaten, wenn der Provider sie aktualisieren kann,
zurück in den Codex-Speicher, statt die Verwaltung in einer separaten rein von OpenClaw verwalteten
Kopie zu übernehmen.

Wenn Ihr Codex-Konto für Codex Spark berechtigt ist, unterstützt OpenClaw außerdem:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw behandelt Codex Spark als nur für Codex. Es stellt keinen direkten
API-Schlüssel-Pfad `openai/gpt-5.3-codex-spark` bereit.

OpenClaw bewahrt außerdem `openai-codex/gpt-5.3-codex-spark`, wenn `pi-ai`
es entdeckt. Behandeln Sie es als abhängig von Berechtigungen und experimentell: Codex Spark ist
von GPT-5.4 `/fast` getrennt, und die Verfügbarkeit hängt vom angemeldeten Codex-/
ChatGPT-Konto ab.

### Obergrenze des Codex-Context-Window

OpenClaw behandelt die Codex-Modellmetadaten und die Laufzeitobergrenze für den Kontext als getrennte
Werte.

Für `openai-codex/gpt-5.4`:

- natives `contextWindow`: `1050000`
- standardmäßige Laufzeitobergrenze `contextTokens`: `272000`

Dadurch bleiben die Modellmetadaten korrekt, während gleichzeitig das kleinere Standard-Laufzeit-
Fenster beibehalten wird, das in der Praxis bessere Latenz- und Qualitätsmerkmale aufweist.

Wenn Sie eine andere effektive Obergrenze möchten, setzen Sie `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Verwenden Sie `contextWindow` nur dann, wenn Sie native Modellmetadaten deklarieren oder überschreiben.
Verwenden Sie `contextTokens`, wenn Sie das Laufzeitbudget für den Kontext begrenzen möchten.

### Standardtransport

OpenClaw verwendet `pi-ai` für Modell-Streaming. Für sowohl `openai/*` als auch
`openai-codex/*` ist der Standardtransport `"auto"` (zuerst WebSocket, dann SSE-
Fallback).

Im Modus `"auto"` versucht OpenClaw außerdem einen frühen, erneut versuchbaren WebSocket-Fehler
einmal erneut, bevor auf SSE zurückgefallen wird. Der erzwungene Modus `"websocket"` zeigt Transport-
Fehler weiterhin direkt an, statt sie hinter einem Fallback zu verbergen.

Nach einem Verbindungs- oder frühen Turn-WebSocket-Fehler im Modus `"auto"` markiert OpenClaw
den WebSocket-Pfad dieser Sitzung für etwa 60 Sekunden als beeinträchtigt und sendet
nachfolgende Turns während dieser Abkühlphase über SSE, statt zwischen den
Transporten hin- und herzuschwanken.

Für native Endpunkte der OpenAI-Familie (`openai/*`, `openai-codex/*` und Azure
OpenAI Responses) hängt OpenClaw außerdem stabile Sitzungs- und Turn-Identitätszustände
an Requests an, damit Retries, Reconnects und SSE-Fallback an derselben
Konversationsidentität ausgerichtet bleiben. Auf nativen Routen der OpenAI-Familie umfasst dies stabile
Sitzungs-/Turn-Request-Identity-Header plus passende Transportmetadaten.

OpenClaw normalisiert außerdem OpenAI-Usage-Zähler über Transportvarianten hinweg, bevor
sie Oberflächen für Sitzung/Status erreichen. Nativer OpenAI-/Codex-Responses-Traffic kann
Usage entweder als `input_tokens` / `output_tokens` oder
`prompt_tokens` / `completion_tokens` melden; OpenClaw behandelt diese als dieselben Eingabe-
und Ausgabezähler für `/status`, `/usage` und Sitzungsprotokolle. Wenn nativer
WebSocket-Traffic `total_tokens` weglässt (oder `0` meldet), fällt OpenClaw auf
die normalisierte Summe aus Eingabe + Ausgabe zurück, damit Anzeigen für Sitzung/Status gefüllt bleiben.

Sie können `agents.defaults.models.<provider/model>.params.transport` setzen:

- `"sse"`: SSE erzwingen
- `"websocket"`: WebSocket erzwingen
- `"auto"`: WebSocket versuchen, dann auf SSE zurückfallen

Für `openai/*` (Responses API) aktiviert OpenClaw außerdem standardmäßig WebSocket-Warm-up
(`openaiWsWarmup: true`), wenn WebSocket-Transport verwendet wird.

Zugehörige OpenAI-Dokumentation:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI-WebSocket-Warm-up

Die OpenAI-Dokumentation beschreibt Warm-up als optional. OpenClaw aktiviert es standardmäßig für
`openai/*`, um die Latenz des ersten Turns bei der Verwendung von WebSocket-Transport zu verringern.

### Warm-up deaktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Warm-up explizit aktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Prioritätsverarbeitung für OpenAI und Codex

Die API von OpenAI stellt Prioritätsverarbeitung über `service_tier=priority` bereit. In
OpenClaw setzen Sie `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
um dieses Feld auf nativen OpenAI-/Codex-Responses-Endpunkten durchzureichen.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Unterstützte Werte sind `auto`, `default`, `flex` und `priority`.

OpenClaw leitet `params.serviceTier` sowohl an direkte `openai/*`-Responses-
Requests als auch an `openai-codex/*`-Codex-Responses-Requests weiter, wenn diese Modelle
auf die nativen OpenAI-/Codex-Endpunkte zeigen.

Wichtiges Verhalten:

- direktes `openai/*` muss auf `api.openai.com` zielen
- `openai-codex/*` muss auf `chatgpt.com/backend-api` zielen
- wenn Sie einen der beiden Provider über eine andere Basis-URL oder einen Proxy routen, lässt OpenClaw `service_tier` unverändert

### OpenAI-Schnellmodus

OpenClaw stellt einen gemeinsamen Schnellmodus-Schalter für sowohl `openai/*`- als auch
`openai-codex/*`-Sitzungen bereit:

- Chat/UI: `/fast status|on|off`
- Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Wenn der Schnellmodus aktiviert ist, ordnet OpenClaw ihn der Prioritätsverarbeitung von OpenAI zu:

- direkte `openai/*`-Responses-Aufrufe an `api.openai.com` senden `service_tier = "priority"`
- `openai-codex/*`-Responses-Aufrufe an `chatgpt.com/backend-api` senden ebenfalls `service_tier = "priority"`
- vorhandene Payload-`service_tier`-Werte bleiben erhalten
- der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um

Speziell für GPT 5.4 ist das häufigste Setup:

- senden Sie `/fast on` in einer Sitzung mit `openai/gpt-5.4` oder `openai-codex/gpt-5.4`
- oder setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- wenn Sie zusätzlich Codex OAuth verwenden, setzen Sie auch `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

Beispiel:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn die Sitzungsüberschreibung in der Sessions-UI gelöscht wird,
kehrt die Sitzung zum konfigurierten Standard zurück.

### Native OpenAI- gegenüber OpenAI-kompatiblen Routen

OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders
als generische OpenAI-kompatible `/v1`-Proxys:

- native `openai/*`-, `openai-codex/*`- und Azure-OpenAI-Routen behalten
  `reasoning: { effort: "none" }` intakt, wenn Sie Reasoning explizit deaktivieren
- native Routen der OpenAI-Familie setzen Tool-Schemas standardmäßig in den Strict-Modus
- versteckte OpenClaw-Attributions-Header (`originator`, `version` und
  `User-Agent`) werden nur an verifizierten nativen OpenAI-Hosts
  (`api.openai.com`) und nativen Codex-Hosts (`chatgpt.com/backend-api`) angehängt
- native OpenAI-/Codex-Routen behalten nur für OpenAI geltende Request-Formung wie
  `service_tier`, Responses-`store`, OpenAI-Reasoning-Kompatibilitäts-Payloads und
  Prompt-Cache-Hinweise bei
- proxyartige OpenAI-kompatible Routen behalten das lockerere Kompatibilitätsverhalten bei und
  erzwingen weder Strict-Tool-Schemas noch nur native Request-Formung oder versteckte
  OpenAI-/Codex-Attributions-Header

Azure OpenAI bleibt für Transport- und Kompatibilitätsverhalten in der Kategorie nativer Routen,
erhält jedoch nicht die versteckten OpenAI-/Codex-Attributions-Header.

Dadurch bleibt das aktuelle native Verhalten von OpenAI Responses erhalten, ohne ältere
OpenAI-kompatible Shims auf Drittanbieter-Backends mit `/v1` zu erzwingen.

### Serverseitige Kompaktierung von OpenAI Responses

Für direkte OpenAI-Responses-Modelle (`openai/*` mit `api: "openai-responses"` und
`baseUrl` auf `api.openai.com`) aktiviert OpenClaw jetzt automatisch Payload-Hinweise für die
serverseitige Kompaktierung von OpenAI:

- Erzwingt `store: true` (es sei denn, Modell-Kompatibilität setzt `supportsStore: false`)
- Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`

Standardmäßig ist `compact_threshold` `70%` des Modell-`contextWindow` (oder `80000`,
wenn nicht verfügbar).

### Serverseitige Kompaktierung explizit aktivieren

Verwenden Sie dies, wenn Sie die Injektion von `context_management` bei kompatiblen
Responses-Modellen erzwingen möchten (zum Beispiel Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Mit einem benutzerdefinierten Schwellenwert aktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Serverseitige Kompaktierung deaktivieren

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` steuert nur die Injektion von `context_management`.
Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, es sei denn, die Kompatibilität setzt
`supportsStore: false`.

## Hinweise

- Modell-Referenzen verwenden immer `provider/model` (siehe [/concepts/models](/de/concepts/models)).
- Auth-Details + Wiederverwendungsregeln finden Sie unter [/concepts/oauth](/de/concepts/oauth).
