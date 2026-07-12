---
read_when:
    - Sie möchten die Alibaba-Wan-Videogenerierung in OpenClaw verwenden
    - Für die Videogenerierung müssen Sie einen Model-Studio- oder DashScope-API-Schlüssel einrichten
summary: Alibaba Model Studio Wan-Videogenerierung in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T15:50:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Das gebündelte `alibaba`-Plugin registriert einen Provider zur Videogenerierung für Wan-Modelle in Alibaba Model Studio (der internationale Name für DashScope). Es ist standardmäßig aktiviert; benötigt wird lediglich ein API-Schlüssel.

| Eigenschaft       | Wert                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| Provider-ID       | `alibaba`                                                                       |
| Plugin            | gebündelt, `enabledByDefault: true`                                              |
| Auth-Umgebungsvariablen | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (der erste Treffer wird verwendet) |
| Onboarding-Flag   | `--auth-choice alibaba-model-studio-api-key`                                    |
| Direktes CLI-Flag | `--alibaba-model-studio-api-key <key>`                                          |
| Standardmodell    | `alibaba/wan2.6-t2v`                                                            |
| Standard-Basis-URL | `https://dashscope-intl.aliyuncs.com`                                          |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Speichern Sie den Schlüssel beim Provider `alibaba` über das Onboarding:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Oder übergeben Sie den Schlüssel direkt:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Oder exportieren Sie vor dem Start des Gateway eine der akzeptierten Umgebungsvariablen:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # oder DASHSCOPE_API_KEY=...
    # oder QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Standardmodell für Videos festlegen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Konfiguration des Providers überprüfen">
    ```bash
    openclaw models list --provider alibaba
    ```

    Die Liste enthält alle fünf gebündelten Wan-Modelle. Wenn `MODELSTUDIO_API_KEY` nicht aufgelöst werden kann, meldet `openclaw models status --json` die fehlenden Anmeldedaten unter `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Das Alibaba-Plugin und das [Qwen-Plugin](/de/providers/qwen) authentifizieren sich beide bei DashScope und akzeptieren sich überschneidende Umgebungsvariablen. Verwenden Sie Modell-IDs mit `alibaba/...` für die dedizierte Wan-Videooberfläche und IDs mit `qwen/...` für Qwen-Chat, Einbettungen oder Medienverständnis.
</Note>

## Integrierte Wan-Modelle

| Modellreferenz             | Modus                              |
| -------------------------- | ---------------------------------- |
| `alibaba/wan2.6-t2v`       | Text-zu-Video (Standard)           |
| `alibaba/wan2.6-i2v`       | Bild-zu-Video                      |
| `alibaba/wan2.6-r2v`       | Referenz-zu-Video                  |
| `alibaba/wan2.6-r2v-flash` | Referenz-zu-Video (schnell)        |
| `alibaba/wan2.7-r2v`       | Referenz-zu-Video                  |

## Funktionen und Beschränkungen

Für alle drei Modi gelten dieselbe maximale Videoanzahl und dieselbe maximale Dauer pro Anfrage; lediglich die Eingabeform unterscheidet sich.

| Modus              | Max. Ausgabevideos | Max. Eingabebilder | Max. Eingabevideos | Max. Dauer | Unterstützte Steuerungsoptionen                           |
| ------------------ | ------------------- | ------------------ | ------------------- | ---------- | --------------------------------------------------------- |
| Text-zu-Video      | 1                   | nicht zutreffend   | nicht zutreffend    | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Bild-zu-Video      | 1                   | 1                  | nicht zutreffend    | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referenz-zu-Video  | 1                   | nicht zutreffend   | 4                   | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Bei einer Anfrage ohne `durationSeconds` wird der von DashScope akzeptierte Standardwert von **5 Sekunden** verwendet. Legen Sie `durationSeconds` im [Tool zur Videogenerierung](/de/tools/video-generation) explizit fest, um die Dauer auf bis zu 10 s zu verlängern.

<Warning>
  Referenzbild- und Referenzvideoeingaben müssen entfernte `http(s)`-URLs sein; die Referenzmodi von DashScope lehnen lokale Dateipfade ab. Laden Sie die Dateien zuerst in einen Objektspeicher hoch oder verwenden Sie den Ablauf des [Medien-Tools](/de/tools/media-overview), der bereits eine öffentliche URL erzeugt.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="DashScope-Basis-URL überschreiben">
    Der Provider verwendet standardmäßig den internationalen DashScope-Endpunkt. So verwenden Sie stattdessen den Endpunkt für die Region China:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Der Provider entfernt abschließende Schrägstriche, bevor er die URLs für AIGC-Aufgaben erstellt.

  </Accordion>

  <Accordion title="Priorität der Authentifizierungs-Umgebungsvariablen">
    OpenClaw löst den Alibaba-API-Schlüssel in dieser Reihenfolge aus Umgebungsvariablen auf und verwendet dabei den ersten nicht leeren Wert:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Konfigurierte Einträge in `auth.profiles` (festgelegt über `openclaw models auth login`) haben Vorrang vor der Auflösung über Umgebungsvariablen. Informationen zur Profilrotation, Abklingzeit und Überschreibungslogik finden Sie unter [Authentifizierungsprofile in den Modell-FAQ](/de/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them).

  </Accordion>

  <Accordion title="Beziehung zum Qwen-Plugin">
    Beide gebündelten Plugins kommunizieren mit DashScope und akzeptieren sich überschneidende API-Schlüssel. Verwenden Sie:

    - IDs mit `alibaba/wan*.*` für den dedizierten Wan-Video-Provider, der auf dieser Seite dokumentiert ist.
    - IDs mit `qwen/*` für Qwen-Chat, Einbettungen und Medienverständnis (siehe [Qwen](/de/providers/qwen)).

    Wenn Sie `MODELSTUDIO_API_KEY` einmal festlegen, werden beide Plugins authentifiziert, da sich die Listen der Authentifizierungs-Umgebungsvariablen absichtlich überschneiden; ein separates Onboarding für jedes Plugin ist nicht erforderlich.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Auswahl des Providers.
  </Card>
  <Card title="Qwen" href="/de/providers/qwen" icon="microchip">
    Einrichtung von Qwen-Chat, Einbettungen und Medienverständnis mit derselben DashScope-Authentifizierung.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen und Modellkonfiguration.
  </Card>
  <Card title="Modell-FAQ" href="/de/help/faq-models" icon="circle-question">
    Authentifizierungsprofile, Modellwechsel und Behebung von „kein Profil“-Fehlern.
  </Card>
</CardGroup>
