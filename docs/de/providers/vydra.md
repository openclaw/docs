---
read_when:
    - Sie möchten Vydra-Mediengenerierung in OpenClaw
    - Sie benötigen eine Anleitung zur Einrichtung des Vydra-API-Schlüssels
summary: Vydra für Bild, Video und Sprache in OpenClaw verwenden
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:08:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Das mitgelieferte Vydra-Plugin ergänzt:

- Bildgenerierung über `vydra/grok-imagine`
- Videogenerierung über `vydra/veo3` und `vydra/kling`
- Sprachsynthese über Vydras ElevenLabs-gestützte TTS-Route

OpenClaw verwendet denselben `VYDRA_API_KEY` für alle drei Fähigkeiten.

| Eigenschaft             | Wert                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| Provider id             | `vydra`                                                                   |
| Plugin                  | mitgeliefert, `enabledByDefault: true`                                    |
| Auth-Umgebungsvariable  | `VYDRA_API_KEY`                                                           |
| Onboarding-Flag         | `--auth-choice vydra-api-key`                                             |
| Direkter CLI-Flag       | `--vydra-api-key <key>`                                                   |
| Verträge                | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Basis-URL               | `https://www.vydra.ai/api/v1` (den `www`-Host verwenden)                  |

<Warning>
  Verwenden Sie `https://www.vydra.ai/api/v1` als Basis-URL. Vydras Apex-Host (`https://vydra.ai/api/v1`) leitet derzeit auf `www` um. Einige HTTP-Clients verwerfen `Authorization` bei dieser hostübergreifenden Weiterleitung, wodurch ein gültiger API-Schlüssel zu einem irreführenden Authentifizierungsfehler wird. Das mitgelieferte Plugin verwendet direkt die `www`-Basis-URL, um das zu vermeiden.
</Warning>

## Einrichtung

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Oder setzen Sie die Umgebungsvariable direkt:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    Wählen Sie eine oder mehrere der folgenden Fähigkeiten aus (Bild, Video oder Sprache) und wenden Sie die passende Konfiguration an.
  </Step>
</Steps>

## Fähigkeiten

<AccordionGroup>
  <Accordion title="Image generation">
    Standard-Bildmodell:

    - `vydra/grok-imagine`

    Legen Sie es als Standard-Provider für Bilder fest:

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

    Die aktuelle mitgelieferte Unterstützung umfasst nur Text-zu-Bild. Vydras gehostete Bearbeitungsrouten erwarten entfernte Bild-URLs, und OpenClaw fügt im mitgelieferten Plugin noch keine Vydra-spezifische Upload-Bridge hinzu.

    <Note>
    Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    Registrierte Videomodelle:

    - `vydra/veo3` für Text-zu-Video
    - `vydra/kling` für Bild-zu-Video

    Legen Sie Vydra als Standard-Provider für Videos fest:

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

    - `vydra/veo3` wird nur als Text-zu-Video mitgeliefert.
    - `vydra/kling` erfordert derzeit eine entfernte Bild-URL-Referenz. Lokale Datei-Uploads werden vorab abgelehnt.
    - Vydras aktuelle HTTP-Route `kling` war uneinheitlich darin, ob sie `image_url` oder `video_url` erfordert; der mitgelieferte Provider ordnet dieselbe entfernte Bild-URL beiden Feldern zu.
    - Das mitgelieferte Plugin bleibt konservativ und leitet keine undokumentierten Stil-Regler wie Seitenverhältnis, Auflösung, Wasserzeichen oder generiertes Audio weiter.

    <Note>
    Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    Provider-spezifische Live-Abdeckung:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Die mitgelieferte Vydra-Live-Datei deckt jetzt Folgendes ab:

    - `vydra/veo3` Text-zu-Video
    - `vydra/kling` Bild-zu-Video mit einer entfernten Bild-URL

    Überschreiben Sie die entfernte Bild-Fixture bei Bedarf:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    Legen Sie Vydra als Sprach-Provider fest:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Standardwerte:

    - Modell: `elevenlabs/tts`
    - Voice id: `21m00Tcm4TlvDq8ikWAM`

    Das mitgelieferte Plugin stellt derzeit eine bekannte, funktionierende Standardstimme bereit und gibt MP3-Audiodateien zurück.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Provider directory" href="/de/providers/index" icon="list">
    Durchsuchen Sie alle verfügbaren Provider.
  </Card>
  <Card title="Image generation" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardwerte und Modellkonfiguration.
  </Card>
</CardGroup>
