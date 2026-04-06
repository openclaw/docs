---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den Auth-Ablauf mit API-Schlüssel
summary: Einrichtung von Google Gemini (API-Schlüssel, Bildgenerierung, Medienverständnis, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-06T03:11:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358d33a68275b01ebd916a3621dd651619cb9a1d062e2fb6196a7f3c501c015a
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video) und Websuche über
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API

## Schnellstart

1. API-Schlüssel festlegen:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Ein Standardmodell festlegen:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## Funktionen

| Funktion                | Unterstützt         |
| ----------------------- | ------------------- |
| Chat-Completions        | Ja                  |
| Bildgenerierung         | Ja                  |
| Musikgenerierung        | Ja                  |
| Bildverständnis         | Ja                  |
| Audiotranskription      | Ja                  |
| Videoverständnis        | Ja                  |
| Websuche (Grounding)    | Ja                  |
| Thinking/Reasoning      | Ja (Gemini 3.1+)    |

## Wiederverwendung des direkten Gemini-Cache

Für direkte Gemini-API-Ausführungen (`api: "google-generative-ai"`) reicht OpenClaw jetzt
ein konfiguriertes `cachedContent`-Handle an Gemini-Requests weiter.

- Konfigurieren Sie pro Modell oder globalen Parametern entweder
  `cachedContent` oder das veraltete `cached_content`
- Wenn beide vorhanden sind, hat `cachedContent` Vorrang
- Beispielwert: `cachedContents/prebuilt-context`
- Die Usage von Gemini-Cache-Treffern wird in OpenClaw-`cacheRead` aus dem
  Upstream-Wert `cachedContentTokenCount` normalisiert

Beispiel:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Bildgenerierung

Der gebündelte Provider für Bildgenerierung `google` verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt außerdem `google/gemini-3-pro-image-preview`
- Generieren: bis zu 4 Bilder pro Request
- Bearbeitungsmodus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerungen: `size`, `aspectRatio` und `resolution`

Bildgenerierung, Medienverständnis und Gemini Grounding bleiben alle auf der
Provider-ID `google`.

So verwenden Sie Google als Standard-Provider für Bilder:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

Unter [Image Generation](/de/tools/image-generation) finden Sie die gemeinsamen Tool-
Parameter, die Provider-Auswahl und das Failover-Verhalten.

## Videogenerierung

Das gebündelte Plugin `google` registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Abläufe mit einzelner Videoreferenz
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Begrenzung der Dauer: **4 bis 8 Sekunden**

So verwenden Sie Google als Standard-Provider für Video:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

Unter [Video Generation](/tools/video-generation) finden Sie die gemeinsamen Tool-
Parameter, die Provider-Auswahl und das Failover-Verhalten.

## Musikgenerierung

Das gebündelte Plugin `google` registriert außerdem Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt außerdem `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` bei `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsbasierte Ausführungen werden über den gemeinsamen Task-/Status-Ablauf entkoppelt, einschließlich `action: "status"`

So verwenden Sie Google als Standard-Provider für Musik:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

Unter [Music Generation](/tools/music-generation) finden Sie die gemeinsamen Tool-
Parameter, die Provider-Auswahl und das Failover-Verhalten.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
