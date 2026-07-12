---
read_when:
    - Sie möchten Vydra-Mediengenerierung in OpenClaw verwenden
    - Sie benötigen eine Anleitung zum Einrichten des Vydra-API-Schlüssels
summary: Vydra-Bilder, -Videos und -Sprachausgabe in OpenClaw verwenden
title: Vydra
x-i18n:
    generated_at: "2026-07-12T15:55:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Das mitgelieferte Vydra-Plugin bietet:

- Bildgenerierung über `vydra/grok-imagine`
- Videogenerierung über `vydra/veo3` (Text-zu-Video) und `vydra/kling` (Bild-zu-Video)
- Sprachsynthese über Vydras auf ElevenLabs basierende TTS-Route

OpenClaw verwendet für alle drei Funktionen denselben `VYDRA_API_KEY`.

| Eigenschaft              | Wert                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| Provider-ID              | `vydra`                                                                   |
| Plugin                   | mitgeliefert, `enabledByDefault: true`                                     |
| Umgebungsvariable für Authentifizierung | `VYDRA_API_KEY`                                              |
| Onboarding-Flag          | `--auth-choice vydra-api-key`                                             |
| Direktes CLI-Flag        | `--vydra-api-key <key>`                                                   |
| Verträge                 | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Basis-URL                | `https://www.vydra.ai/api/v1` (verwenden Sie den Host `www`)              |

<Warning>
Verwenden Sie `https://www.vydra.ai/api/v1` als Basis-URL. Vydras Apex-Host (`https://vydra.ai/api/v1`) leitet derzeit zu `www` weiter. Einige HTTP-Clients verwerfen bei dieser hostübergreifenden Weiterleitung den Header `Authorization`, wodurch ein gültiger API-Schlüssel zu einem irreführenden Authentifizierungsfehler führt. Das mitgelieferte Plugin normalisiert jede konfigurierte `vydra.ai`-Basis-URL zu `www.vydra.ai`, um dies zu vermeiden.
</Warning>

## Einrichtung

<Steps>
  <Step title="Interaktives Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Oder legen Sie die Umgebungsvariable direkt fest:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Standardfunktion auswählen">
    Wählen Sie unten eine oder mehrere Funktionen (Bild, Video oder Sprache) aus und wenden Sie die entsprechende Konfiguration an.
  </Step>
</Steps>

## Funktionen

<AccordionGroup>
  <Accordion title="Bildgenerierung">
    Standardmäßiges und einziges mitgeliefertes Bildmodell:

    - `vydra/grok-imagine`

    Legen Sie es als standardmäßigen Bild-Provider fest:

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

    Die mitgelieferte Unterstützung umfasst ausschließlich Text-zu-Bild mit höchstens einem Bild pro Anfrage. Vydras gehostete Bearbeitungsrouten erwarten Remote-Bild-URLs, und das mitgelieferte Plugin fügt keine Vydra-spezifische Upload-Brücke hinzu.

    <Note>
    Unter [Bildgenerierung](/de/tools/image-generation) finden Sie Informationen zu gemeinsamen Werkzeugparametern, zur Provider-Auswahl und zum Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Videogenerierung">
    Registrierte Videomodelle:

    - `vydra/veo3` für Text-zu-Video (lehnt Bildreferenzeingaben ab)
    - `vydra/kling` für Bild-zu-Video (erfordert genau eine Remote-Bild-URL)

    Legen Sie Vydra als standardmäßigen Video-Provider fest:

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

    - `vydra/kling` lehnt Uploads lokaler Dateien von vornherein ab; nur eine Referenz auf eine Remote-Bild-URL funktioniert.
    - Vydras `kling`-HTTP-Route war hinsichtlich der Frage, ob sie `image_url` oder `video_url` erfordert, inkonsistent; der mitgelieferte Provider sendet dieselbe Remote-Bild-URL in beiden Feldern.
    - Das mitgelieferte Plugin verhält sich konservativ und leitet undokumentierte Stiloptionen wie Seitenverhältnis, Auflösung, Wasserzeichen oder generiertes Audio nicht weiter.

    <Note>
    Unter [Videogenerierung](/de/tools/video-generation) finden Sie Informationen zu gemeinsamen Werkzeugparametern, zur Provider-Auswahl und zum Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Live-Tests für Video">
    Provider-spezifische Live-Testabdeckung:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Die mitgelieferte Vydra-Live-Testdatei deckt Folgendes ab:

    - `vydra/veo3` Text-zu-Video
    - `vydra/kling` Bild-zu-Video unter Verwendung einer Remote-Bild-URL

    Überschreiben Sie bei Bedarf die Remote-Bild-Testressource:

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
    - Stimmen-ID: `21m00Tcm4TlvDq8ikWAM` („Rachel“)

    Das mitgelieferte Plugin stellt diese eine bewährte Standardstimme bereit und gibt MP3-Audiodateien zurück.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Provider-Verzeichnis" href="/de/providers/index" icon="list">
    Durchsuchen Sie alle verfügbaren Provider.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bildwerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Videowerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardwerte und Modellkonfiguration.
  </Card>
</CardGroup>
