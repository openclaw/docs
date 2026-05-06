---
read_when:
    - Sie möchten die Videogenerierung von Alibaba Wan in OpenClaw verwenden
    - Für die Videogenerierung müssen Sie einen API-Schlüssel für Model Studio oder DashScope einrichten
summary: Videogenerierung mit Alibaba Model Studio Wan in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T06:59:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw liefert ein gebündeltes `alibaba`-Plugin mit, das einen Video-Generierungs-Provider für Wan-Modelle auf Alibaba Model Studio (dem internationalen Namen für DashScope) registriert. Das Plugin ist standardmäßig aktiviert; Sie müssen nur einen API-Schlüssel festlegen.

| Eigenschaft        | Wert                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| Provider-ID        | `alibaba`                                                                       |
| Plugin             | gebündelt, `enabledByDefault: true`                                             |
| Auth-Env-Vars      | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (erster Treffer zählt) |
| Onboarding-Flag    | `--auth-choice alibaba-model-studio-api-key`                                    |
| Direktes CLI-Flag  | `--alibaba-model-studio-api-key <key>`                                          |
| Standardmodell     | `alibaba/wan2.6-t2v`                                                            |
| Standard-Basis-URL | `https://dashscope-intl.aliyuncs.com`                                           |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Verwenden Sie das Onboarding, um den Schlüssel für den `alibaba`-Provider zu speichern:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Oder übergeben Sie den Schlüssel direkt während der Installation/des Onboardings:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Oder exportieren Sie eine der akzeptierten Env-Vars, bevor Sie den Gateway starten:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Standard-Videomodell festlegen">
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
  <Step title="Prüfen, ob der Provider konfiguriert ist">
    ```bash
    openclaw models list --provider alibaba
    ```

    Die Liste sollte alle fünf gebündelten Wan-Modelle enthalten. Wenn `MODELSTUDIO_API_KEY` nicht aufgelöst wird, meldet `openclaw models status --json` die fehlende Anmeldeinformation unter `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Das Alibaba-Plugin und das [Qwen-Plugin](/de/providers/qwen) authentifizieren sich beide bei DashScope und akzeptieren sich überschneidende Env-Vars. Verwenden Sie `alibaba/...`-Modell-IDs, um die dedizierte Wan-Videooberfläche zu nutzen; verwenden Sie `qwen/...`-IDs, wenn Sie Qwens Chat-, Embedding- oder Medienverständnis-Oberfläche benötigen.
</Note>

## Integrierte Wan-Modelle

| Modell-Referenz            | Modus                          |
| -------------------------- | ------------------------------ |
| `alibaba/wan2.6-t2v`       | Text-zu-Video (Standard)       |
| `alibaba/wan2.6-i2v`       | Bild-zu-Video                  |
| `alibaba/wan2.6-r2v`       | Referenz-zu-Video              |
| `alibaba/wan2.6-r2v-flash` | Referenz-zu-Video (schnell)    |
| `alibaba/wan2.7-r2v`       | Referenz-zu-Video              |

## Funktionen und Limits

Der gebündelte Provider spiegelt die Limits der DashScope-Wan-Video-API wider. Alle drei Modi teilen sich dieselbe Obergrenze für Videoanzahl und Dauer pro Anfrage; nur die Eingabeform unterscheidet sich.

| Modus              | Max. Ausgabevideos | Max. Eingabebilder | Max. Eingabevideos | Max. Dauer | Unterstützte Steuerelemente                              |
| ------------------ | ------------------ | ------------------ | ------------------ | ---------- | --------------------------------------------------------- |
| Text-zu-Video      | 1                  | n/a                | n/a                | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Bild-zu-Video      | 1                  | 1                  | n/a                | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referenz-zu-Video  | 1                  | n/a                | 4                  | 10 s       | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Wenn eine Anfrage `durationSeconds` auslässt, sendet der Provider den von DashScope akzeptierten Standardwert von **5 Sekunden**. Setzen Sie `durationSeconds` explizit im [Video-Generierungs-Tool](/de/tools/video-generation), um die Dauer auf bis zu 10 s zu erhöhen.

<Warning>
  Referenzbild- und Videoeingaben müssen entfernte `http(s)`-URLs sein. Lokale Dateipfade werden von DashScopes Referenzmodi nicht akzeptiert; laden Sie sie zuerst in einen Objektspeicher hoch oder verwenden Sie den Ablauf des [Medien-Tools](/de/tools/media-overview), der bereits eine öffentliche URL erzeugt.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="DashScope-Basis-URL überschreiben">
    Der Provider verwendet standardmäßig den internationalen DashScope-Endpunkt. Um den Endpunkt für die China-Region zu verwenden, legen Sie Folgendes fest:

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

    Der Provider entfernt abschließende Schrägstriche, bevor er AIGC-Aufgaben-URLs erstellt.

  </Accordion>

  <Accordion title="Priorität der Auth-Env-Vars">
    OpenClaw löst den Alibaba-API-Schlüssel in dieser Reihenfolge aus Umgebungsvariablen auf und verwendet den ersten nicht leeren Wert:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Konfigurierte `auth.profiles`-Einträge (festgelegt über `openclaw models auth login`) überschreiben die Env-Var-Auflösung. Weitere Informationen zu Profilrotation, Cooldown und Override-Mechanik finden Sie unter [Auth-Profile in der Modelle-FAQ](/de/help/faq-models#what-is-an-auth-profile).

  </Accordion>

  <Accordion title="Beziehung zum Qwen-Plugin">
    Beide gebündelten Plugins kommunizieren mit DashScope und akzeptieren sich überschneidende API-Schlüssel. Verwenden Sie:

    - `alibaba/wan*.*`-IDs, um den dedizierten Wan-Video-Provider zu nutzen, der auf dieser Seite dokumentiert ist.
    - `qwen/*`-IDs für Qwen-Chat, Embeddings und Medienverständnis (siehe [Qwen](/de/providers/qwen)).

    Wenn Sie `MODELSTUDIO_API_KEY` einmal festlegen, authentifiziert das beide Plugins, da sich die Liste der Auth-Env-Vars absichtlich überschneidet; Sie müssen nicht jedes Plugin separat onboarden.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Video-Generierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Videotool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Qwen" href="/de/providers/qwen" icon="microchip">
    Einrichtung von Qwen-Chat, Embeddings und Medienverständnis mit derselben DashScope-Authentifizierung.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standards und Modellkonfiguration.
  </Card>
  <Card title="Modelle-FAQ" href="/de/help/faq-models" icon="circle-question">
    Auth-Profile, Modellwechsel und Behebung von „kein Profil“-Fehlern.
  </Card>
</CardGroup>
