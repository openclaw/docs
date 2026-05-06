---
read_when:
    - Sie möchten Vydra-Mediengenerierung in OpenClaw
    - Sie benötigen eine Anleitung zur Einrichtung eines Vydra-API-Schlüssels
summary: Bild-, Video- und Sprachfunktionen von Vydra in OpenClaw verwenden
title: Vydra
x-i18n:
    generated_at: "2026-05-06T07:01:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Das gebündelte Vydra-Plugin fügt hinzu:

- Bildgenerierung über `vydra/grok-imagine`
- Videogenerierung über `vydra/veo3` und `vydra/kling`
- Sprachsynthese über Vydras ElevenLabs-gestützte TTS-Route

OpenClaw verwendet denselben `VYDRA_API_KEY` für alle drei Funktionen.

| Eigenschaft     | Wert                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| Provider-ID     | `vydra`                                                                   |
| Plugin          | gebündelt, `enabledByDefault: true`                                       |
| Auth-Env-Var    | `VYDRA_API_KEY`                                                           |
| Onboarding-Flag | `--auth-choice vydra-api-key`                                             |
| Direkter CLI-Flag | `--vydra-api-key <key>`                                                 |
| Verträge        | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Basis-URL       | `https://www.vydra.ai/api/v1` (verwenden Sie den Host `www`)              |

<Warning>
  Verwenden Sie `https://www.vydra.ai/api/v1` als Basis-URL. Vydras Apex-Host (`https://vydra.ai/api/v1`) leitet derzeit zu `www` weiter. Einige HTTP-Clients entfernen `Authorization` bei dieser hostübergreifenden Weiterleitung, wodurch aus einem gültigen API-Schlüssel ein irreführender Authentifizierungsfehler wird. Das gebündelte Plugin verwendet direkt die `www`-Basis-URL, um dies zu vermeiden.
</Warning>

## Einrichtung

<Steps>
  <Step title="Interaktives Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Oder setzen Sie die Env-Var direkt:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Standardfunktion auswählen">
    Wählen Sie eine oder mehrere der folgenden Funktionen aus (Bild, Video oder Sprache) und wenden Sie die passende Konfiguration an.
  </Step>
</Steps>

## Funktionen

<AccordionGroup>
  <Accordion title="Bildgenerierung">
    Standard-Bildmodell:

    - `vydra/grok-imagine`

    Legen Sie es als Standard-Bild-Provider fest:

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

    Die aktuelle gebündelte Unterstützung umfasst nur Text-zu-Bild. Vydras gehostete Bearbeitungsrouten erwarten Remote-Bild-URLs, und OpenClaw fügt im gebündelten Plugin noch keine Vydra-spezifische Upload-Bridge hinzu.

    <Note>
    Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Videogenerierung">
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

    - `vydra/veo3` ist nur als Text-zu-Video gebündelt.
    - `vydra/kling` erfordert derzeit eine Remote-Bild-URL-Referenz. Lokale Datei-Uploads werden vorab abgelehnt.
    - Vydras aktuelle `kling`-HTTP-Route war bisher inkonsistent darin, ob sie `image_url` oder `video_url` erfordert; der gebündelte Provider ordnet dieselbe Remote-Bild-URL beiden Feldern zu.
    - Das gebündelte Plugin bleibt konservativ und leitet keine undokumentierten Stiloptionen wie Seitenverhältnis, Auflösung, Wasserzeichen oder generiertes Audio weiter.

    <Note>
    Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Video-Live-Tests">
    Provider-spezifische Live-Abdeckung:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Die gebündelte Vydra-Live-Datei deckt jetzt ab:

    - `vydra/veo3` Text-zu-Video
    - `vydra/kling` Bild-zu-Video mit einer Remote-Bild-URL

    Überschreiben Sie die Remote-Bild-Fixture bei Bedarf:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sprachsynthese">
    Legen Sie Vydra als Sprach-Provider fest:

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

    Das gebündelte Plugin stellt derzeit eine bewährte Standardstimme bereit und gibt MP3-Audiodateien zurück.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Provider-Verzeichnis" href="/de/providers/index" icon="list">
    Durchsuchen Sie alle verfügbaren Provider.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardwerte und Modellkonfiguration.
  </Card>
</CardGroup>
