---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T15:48:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Das gebündelte `minimax`-Plugin registriert zwei Provider sowie fünf Funktionen: Chat, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverständnis, Sprachausgabe (T2A v2) und Websuche.

  | Provider-ID      | Authentifizierung | Funktionen                                                                                              |
  | ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
  | `minimax`        | API-Schlüssel      | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverständnis, Sprachausgabe, Websuche      |
  | `minimax-portal` | OAuth              | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverständnis, Sprachausgabe                 |

  <Tip>
  Empfehlungslink für den MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Integrierter Katalog

  | Modell                   | Typ                       | Beschreibung                                     |
  | ------------------------ | ------------------------- | ------------------------------------------------ |
  | `MiniMax-M3`             | Chat (Reasoning)          | Standardmäßig gehostetes Reasoning-Modell         |
  | `MiniMax-M2.7`           | Chat (Reasoning)          | Vorheriges gehostetes Reasoning-Modell            |
  | `MiniMax-M2.7-highspeed` | Chat (Reasoning)          | Schnellere M2.7-Reasoning-Stufe                    |
  | `MiniMax-VL-01`          | Bildverarbeitung          | Modell für Bildverständnis                        |
  | `image-01`               | Bildgenerierung           | Text-zu-Bild- und Bild-zu-Bild-Bearbeitung        |
  | `music-2.6`              | Musikgenerierung          | Standard-Musikmodell                              |
  | `MiniMax-Hailuo-2.3`     | Videogenerierung          | Text-zu-Video- und Bild-zu-Video-Abläufe          |

  Modellreferenzen richten sich nach dem Authentifizierungspfad: `minimax/<model>` für Einrichtungen mit API-Schlüssel, `minimax-portal/<model>` für Einrichtungen mit OAuth.

  ## Erste Schritte

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Am besten geeignet für:** schnelle Einrichtung mit dem MiniMax Coding Plan über OAuth, ohne erforderlichen API-Schlüssel.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Daraus resultierende Basis-URL des Providers: `api.minimax.io`.
          </Step>
          <Step title="Verfügbarkeit des Modells prüfen">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Daraus resultierende Basis-URL des Providers: `api.minimaxi.com`.
          </Step>
          <Step title="Verfügbarkeit des Modells prüfen">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth-Einrichtungen verwenden die Provider-ID `minimax-portal`. Modellreferenzen entsprechen dem Format `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** gehostetes MiniMax mit Anthropic-kompatibler API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Dadurch wird `api.minimax.io` als Basis-URL konfiguriert.
          </Step>
          <Step title="Verfügbarkeit des Modells prüfen">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Dadurch wird `api.minimaxi.com` als Basis-URL konfiguriert.
          </Step>
          <Step title="Verfügbarkeit des Modells prüfen">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
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

    <Warning>
    Der Anthropic-kompatible Streaming-Endpunkt von MiniMax-M2.x gibt `reasoning_content` in Delta-Blöcken im OpenAI-Stil statt in nativen Anthropic-Denkblöcken aus. Dadurch werden interne Schlussfolgerungen in der sichtbaren Ausgabe offengelegt, wenn das Denken implizit aktiviert bleibt. OpenClaw deaktiviert das Denken für M2.x standardmäßig, sofern Sie `thinking` nicht ausdrücklich selbst festlegen. MiniMax-M3 (und vorwärtskompatible M3.x-Versionen) ist davon ausgenommen: M3 gibt korrekte Anthropic-Denkblöcke aus und benötigt aktiviertes Denken, um sichtbare Inhalte zu erzeugen. Daher belässt OpenClaw M3 im adaptiven Denkpfad des Providers. Weitere Informationen finden Sie im Abschnitt zu den Standardeinstellungen für das Denken unter „Erweiterte Konfiguration“ weiter unten.
    </Warning>

    <Note>
    Einrichtungen mit API-Schlüssel verwenden die Provider-ID `minimax`. Modellreferenzen entsprechen dem Format `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Über `openclaw configure` konfigurieren

<Steps>
  <Step title="Assistenten starten">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Modell/Authentifizierung auswählen">
    Wählen Sie im Menü **Model/auth** aus.
  </Step>
  <Step title="Eine MiniMax-Authentifizierungsoption auswählen">
    | Authentifizierungsoption | Beschreibung                         |
    | ------------------------ | ------------------------------------ |
    | `minimax-global-oauth`   | Internationales OAuth (Coding Plan)  |
    | `minimax-cn-oauth`       | China-OAuth (Coding Plan)            |
    | `minimax-global-api`     | Internationaler API-Schlüssel        |
    | `minimax-cn-api`         | China-API-Schlüssel                   |
  </Step>
  <Step title="Standardmodell auswählen">
    Wählen Sie bei Aufforderung Ihr Standardmodell aus.
  </Step>
</Steps>

## Funktionen

### Bildgenerierung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate` sowohl bei `minimax` als auch bei `minimax-portal` und verwendet dabei denselben `MINIMAX_API_KEY` beziehungsweise dieselbe OAuth-Authentifizierung wie die Textmodelle.

- Text-zu-Bild-Generierung und Bild-zu-Bild-Bearbeitung (Motivreferenz), jeweils mit Steuerung des Seitenverhältnisses
- Bis zu 9 Ausgabebilder pro Anfrage, 1 Referenzbild pro Bearbeitungsanfrage
- Unterstützte Seitenverhältnisse: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Die Bildgenerierung verwendet immer den dedizierten Bild-Endpunkt von MiniMax (`/v1/image_generation`) und ignoriert `models.providers.minimax.baseUrl`, da dieses Feld stattdessen die mit Chat/Anthropic kompatible Basis-URL konfiguriert. Legen Sie `MINIMAX_API_HOST=https://api.minimaxi.com` fest, um die Bildgenerierung über den CN-Endpunkt zu leiten; der globale Standardendpunkt ist `https://api.minimax.io`.

<Note>
Unter [Bildgenerierung](/de/tools/image-generation) finden Sie Informationen zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum Failover-Verhalten.
</Note>

### Text-zu-Sprache

Das enthaltene `minimax`-Plugin registriert MiniMax T2A v2 als Sprachausgabe-Provider für `messages.tts`.

- TTS-Standardmodell: `speech-2.8-hd`
- Standardstimme: `English_expressive_narrator`
- Enthaltene Modell-IDs: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Reihenfolge der Authentifizierungsauflösung: `messages.tts.providers.minimax.apiKey`, dann OAuth-/Token-Authentifizierungsprofile von `minimax-portal`, dann Umgebungsschlüssel des Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), dann `MINIMAX_API_KEY`
- Wenn kein TTS-Host konfiguriert ist, verwendet OpenClaw den konfigurierten OAuth-Host von `minimax-portal` wieder und entfernt mit Anthropic kompatible Pfadsuffixe wie `/anthropic`
- Normale Audioanhänge bleiben im MP3-Format. Ziele für Sprachnachrichten (Feishu, Telegram und andere Kanäle, die einen mit Sprachnachrichten kompatiblen Anhang anfordern) werden mit `ffmpeg` von MiniMax-MP3 in Opus mit 48 kHz transkodiert, da beispielsweise die Datei-API von Feishu/Lark für native Audionachrichten ausschließlich `file_type: "opus"` akzeptiert
- MiniMax T2A akzeptiert für `speed` und `vol` Dezimalwerte, `pitch` wird jedoch als Ganzzahl gesendet; OpenClaw schneidet den Dezimalanteil von `pitch`-Werten vor der API-Anfrage ab

| Einstellung                              | Umgebungsvariable       | Standard                      | Beschreibung                                      |
| ---------------------------------------- | ----------------------- | ----------------------------- | ------------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`      | `https://api.minimax.io`      | MiniMax-T2A-API-Host.                             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`     | `speech-2.8-hd`               | TTS-Modell-ID.                                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`  | `English_expressive_narrator` | Für die Sprachausgabe verwendete Stimmen-ID.      |
| `messages.tts.providers.minimax.speed`   |                         | `1.0`                         | Wiedergabegeschwindigkeit, `0.5..2.0`.            |
| `messages.tts.providers.minimax.vol`     |                         | `1.0`                         | Lautstärke, `(0, 10]`.                            |
| `messages.tts.providers.minimax.pitch`   |                         | `0`                           | Ganzzahlige Tonhöhenverschiebung, `-12..12`.      |

### Musikgenerierung

Das enthaltene MiniMax-Plugin registriert die Musikgenerierung über das gemeinsame Tool `music_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Musikmodell: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Unterstützt außerdem `music-2.6-free`, `music-cover` und `music-cover-free`
- Prompt-Steuerungen: `lyrics`, `instrumental`
- Ausgabeformat: `mp3`
- Sitzungsgebundene Ausführungen werden über den gemeinsamen Task-/Statusablauf abgekoppelt, einschließlich `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Unter [Musikgenerierung](/de/tools/music-generation) finden Sie Informationen zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum Failover-Verhalten.
</Note>

### Videogenerierung

Das enthaltene MiniMax-Plugin registriert die Videogenerierung über das gemeinsame Tool `video_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Unterstützt außerdem `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` und `I2V-01`
- Modi: Text-zu-Video und Abläufe mit einem einzelnen Bild als Referenz
- Unterstützt `resolution` (`768P` oder `1080P` bei Hailuo-2.3/02-Modellen); `aspectRatio` wird nicht unterstützt und ignoriert

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Unter [Videogenerierung](/de/tools/video-generation) finden Sie gemeinsame Tool-Parameter, die Provider-Auswahl und das Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert das Bildverständnis getrennt vom Textkatalog:

| Provider-ID      | Standard-Bildmodell | PDF-Textextraktion |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

Deshalb kann das automatische Medien-Routing das Bildverständnis von MiniMax verwenden, auch wenn der gebündelte Katalog der Text-Provider ebenfalls bildfähige M3-Chat-Referenzen enthält. Das PDF-Verständnis verwendet `MiniMax-M2.7` ausschließlich zur Textextraktion; MiniMax registriert keinen Konvertierungspfad von PDF zu Bild.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API des MiniMax Token Plan (`/v1/coding_plan/search`).

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Ausschnitte, verwandte Suchanfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierte Umgebungsvariablen-Aliasse: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn sie bereits auf Anmeldedaten für einen Token-Plan verweist
- Wiederverwendung der Region: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann die Basis-URLs des MiniMax-Providers
- Die Suche bleibt bei der Provider-ID `minimax`; die OAuth-Einrichtung für CN/global kann die Region indirekt über `models.providers.minimax-portal.baseUrl` steuern und über `MINIMAX_OAUTH_TOKEN` eine Bearer-Authentifizierung bereitstellen

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Unter [MiniMax-Suche](/de/tools/minimax-search) finden Sie die vollständige Konfiguration und Verwendung der Websuche.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen">
    | Option | Beschreibung |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Bevorzugen Sie `https://api.minimax.io/anthropic` (Anthropic-kompatibel); `https://api.minimax.io/v1` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.api` | Bevorzugen Sie `anthropic-messages`; `openai-completions` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.apiKey` | MiniMax-API-Schlüssel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definieren Sie `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Vergeben Sie Aliasse für Modelle, die Sie in der Zulassungsliste verwenden möchten |
    | `models.mode` | Behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu den integrierten Modellen hinzufügen möchten |
  </Accordion>

  <Accordion title="Standardwerte für das Denken">
    Bei `api: "anthropic-messages"` fügt OpenClaw für MiniMax-M2.x-Modelle `thinking: { type: "disabled" }` ein, sofern nicht bereits ein früherer Wrapper das Feld `thinking` in der Payload gesetzt hat. Dadurch wird verhindert, dass der Streaming-Endpunkt von M2.x `reasoning_content` in Delta-Blöcken im OpenAI-Stil ausgibt, wodurch interne Gedankengänge in die sichtbare Ausgabe gelangen würden.

    MiniMax-M3 (und M3.x) ist ausgenommen: M3 gibt ein leeres `content`-Array mit `stop_reason: "end_turn"` zurück, wenn das Denken deaktiviert ist. Daher entfernt OpenClaw für M3 den impliziten deaktivierten Standardwert und erzwingt stattdessen `thinking: { type: "adaptive" }`, wenn eine Denkstufe festgelegt ist.

    Verfügbare Denkstufen nach Modellfamilie:

    | Modellfamilie   | Stufen                                    | Standard   |
    | --------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`    | `off`, `adaptive`                         | `adaptive` |
    | `MiniMax-M2.x`  | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Schnellmodus">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Streaming-Pfad (`api: "anthropic-messages"`, Provider `minimax` oder `minimax-portal`) in `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten geeignet für:** Behalten Sie Ihr leistungsstärkstes Modell der neuesten Generation als primäres Modell bei und wechseln Sie bei einem Ausfall zu MiniMax M2.7. Das folgende Beispiel verwendet Opus als konkretes primäres Modell; ersetzen Sie es durch Ihr bevorzugtes primäres Modell der neuesten Generation.

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

  </Accordion>

  <Accordion title="Details zur Nutzung des Coding Plan">
    - API für die Nutzung des Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` oder `https://api.minimax.io/v1/token_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - Die Nutzungsabfrage leitet den Host aus `models.providers.minimax-portal.baseUrl` oder `models.providers.minimax.baseUrl` ab, wenn diese konfiguriert sind. Globale Einrichtungen mit `https://api.minimax.io/anthropic` fragen daher `api.minimax.io` ab. Fehlende oder fehlerhafte Basis-URLs behalten aus Kompatibilitätsgründen den CN-Fallback bei.
    - OpenClaw normalisiert die MiniMax-Nutzung des Coding Plan auf dieselbe Anzeige `% left`, die auch andere Provider verwenden. Die Rohfelder `usage_percent` / `usagePercent` von MiniMax geben das verbleibende Kontingent und nicht das verbrauchte Kontingent an, daher invertiert OpenClaw sie. Anzahlbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag des Chatmodells, leitet bei Bedarf die Bezeichnung des Zeitfensters aus `start_time` / `end_time` ab und nimmt den Namen des ausgewählten Modells in die Planbezeichnung auf, damit sich die Zeitfenster des Coding Plan leichter unterscheiden lassen.
    - Nutzungs-Snapshots behandeln `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` als dieselbe MiniMax-Kontingentoberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor sie auf Umgebungsvariablen für Coding-Plan-Schlüssel zurückgreifen.

  </Accordion>
</AccordionGroup>

## Hinweise

- Standard-Chatmodell: `MiniMax-M3`. Alternative Chatmodelle: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding und die direkte Einrichtung mit API-Schlüssel schreiben Modelldefinitionen für M3 und beide M2.7-Varianten
- Das Bildverständnis verwendet den Plugin-eigenen Medien-Provider `MiniMax-VL-01`
- Aktualisieren Sie die Preiswerte in `models.json`, wenn Sie eine genaue Kostenverfolgung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie anschließend mit `openclaw models set minimax/MiniMax-M3` oder `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Unter [Modell-Provider](/de/concepts/model-providers) finden Sie die Regeln für Provider.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unbekanntes Modell: minimax/MiniMax-M3"'>
    Dies bedeutet normalerweise, dass der **MiniMax-Provider nicht konfiguriert ist** (es wurde weder ein passender Provider-Eintrag noch ein MiniMax-Authentifizierungsprofil oder -Umgebungsschlüssel gefunden). So beheben Sie das Problem:

    - Führen Sie `openclaw configure` aus und wählen Sie eine **MiniMax**-Authentifizierungsoption aus oder
    - fügen Sie den passenden Block `models.providers.minimax` oder `models.providers.minimax-portal` manuell hinzu oder
    - legen Sie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Authentifizierungsprofil fest, damit der passende Provider eingefügt werden kann.

    Beachten Sie, dass bei der Modell-ID **zwischen Groß- und Kleinschreibung unterschieden wird**:

    - Pfad mit API-Schlüssel: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - OAuth-Pfad: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

    Überprüfen Sie anschließend erneut mit:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter des Musik-Tools und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="MiniMax-Suche" href="/de/tools/minimax-search" icon="magnifying-glass">
    Konfiguration der Websuche über den MiniMax Token Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
