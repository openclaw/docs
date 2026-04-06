---
read_when:
    - Sie möchten Vydra-Mediengenerierung in OpenClaw verwenden
    - Sie benötigen Hinweise zur Einrichtung des Vydra-API-Schlüssels
summary: Vydra-Bild-, Video- und Sprachfunktionen in OpenClaw verwenden
title: Vydra
x-i18n:
    generated_at: "2026-04-06T03:11:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fe999e8a5414b8a31a6d7d127bc6bcfc3b4492b8f438ab17dfa9680c5b079b7
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Das gebündelte Vydra-Plugin fügt Folgendes hinzu:

- Bildgenerierung über `vydra/grok-imagine`
- Videogenerierung über `vydra/veo3` und `vydra/kling`
- Sprachsynthese über Vydras ElevenLabs-gestützte TTS-Route

OpenClaw verwendet denselben `VYDRA_API_KEY` für alle drei Funktionen.

## Wichtige Basis-URL

Verwenden Sie `https://www.vydra.ai/api/v1`.

Der Apex-Host von Vydra (`https://vydra.ai/api/v1`) leitet derzeit auf `www` um. Einige HTTP-Clients verwerfen `Authorization` bei dieser hostübergreifenden Weiterleitung, wodurch ein gültiger API-Schlüssel zu einem irreführenden Authentifizierungsfehler wird. Das gebündelte Plugin verwendet die `www`-Basis-URL daher direkt, um dies zu vermeiden.

## Einrichtung

Interaktives Onboarding:

```bash
openclaw onboard --auth-choice vydra-api-key
```

Oder setzen Sie die Umgebungsvariable direkt:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Bildgenerierung

Standard-Bildmodell:

- `vydra/grok-imagine`

Legen Sie es als Standard-Bildprovider fest:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

Die aktuell gebündelte Unterstützung ist nur Text-zu-Bild. Die gehosteten Bearbeitungsrouten von Vydra erwarten entfernte Bild-URLs, und OpenClaw fügt im gebündelten Plugin derzeit noch keine Vydra-spezifische Upload-Bridge hinzu.

Siehe [Image Generation](/de/tools/image-generation) für gemeinsames Tool-Verhalten.

## Videogenerierung

Registrierte Videomodelle:

- `vydra/veo3` für Text-zu-Video
- `vydra/kling` für Bild-zu-Video

Legen Sie Vydra als Standard-Video-Provider fest:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

Hinweise:

- `vydra/veo3` ist gebündelt nur als Text-zu-Video verfügbar.
- `vydra/kling` erfordert derzeit eine Referenz auf eine entfernte Bild-URL. Uploads lokaler Dateien werden vorab abgelehnt.
- Das gebündelte Plugin bleibt konservativ und leitet nicht dokumentierte Stilparameter wie Seitenverhältnis, Auflösung, Wasserzeichen oder generiertes Audio nicht weiter.

Siehe [Video Generation](/tools/video-generation) für gemeinsames Tool-Verhalten.

## Sprachsynthese

Legen Sie Vydra als Sprachprovider fest:

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

Standardwerte:

- Modell: `elevenlabs/tts`
- Voice-ID: `21m00Tcm4TlvDq8ikWAM`

Das gebündelte Plugin stellt derzeit eine bekannte, funktionierende Standardstimme bereit und gibt MP3-Audiodateien zurück.

## Verwandt

- [Provider Directory](/de/providers/index)
- [Image Generation](/de/tools/image-generation)
- [Video Generation](/tools/video-generation)
