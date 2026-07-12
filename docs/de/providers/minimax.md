---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T02:05:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Das gebündelte `minimax`-Plugin registriert zwei Provider sowie fünf Funktionen: Chat, Bilderzeugung, Musikerzeugung, Videoerzeugung, Bildverständnis, Sprache (T2A v2) und Websuche.

  | Provider-ID      | Authentifizierung | Funktionen                                                                                                 |
  | ---------------- | ------------------ | ---------------------------------------------------------------------------------------------------------- |
  | `minimax`        | API-Schlüssel      | Text, Bilderzeugung, Musikerzeugung, Videoerzeugung, Bildverständnis, Sprache, Websuche                     |
  | `minimax-portal` | OAuth              | Text, Bilderzeugung, Musikerzeugung, Videoerzeugung, Bildverständnis, Sprache                               |

  <Tip>
  Empfehlungslink für den MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Integrierter Katalog

  | Modell                   | Typ                         | Beschreibung                                      |
  | ------------------------ | --------------------------- | ------------------------------------------------- |
  | `MiniMax-M3`             | Chat (Reasoning)            | Standardmäßiges gehostetes Reasoning-Modell        |
  | `MiniMax-M2.7`           | Chat (Reasoning)            | Vorheriges gehostetes Reasoning-Modell             |
  | `MiniMax-M2.7-highspeed` | Chat (Reasoning)            | Schnellere M2.7-Reasoning-Stufe                    |
  | `MiniMax-VL-01`          | Bildverarbeitung            | Modell für Bildverständnis                         |
  | `image-01`               | Bilderzeugung               | Text-zu-Bild- und Bild-zu-Bild-Bearbeitung         |
  | `music-2.6`              | Musikerzeugung              | Standardmäßiges Musikmodell                        |
  | `MiniMax-Hailuo-2.3`     | Videoerzeugung              | Text-zu-Video- und Bild-zu-Video-Abläufe           |

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

            Daraus resultierende Provider-Basis-URL: `api.minimax.io`.
          </Step>
          <Step title="Verfügbarkeit des Modells überprüfen">
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

            Daraus resultierende Provider-Basis-URL: `api.minimaxi.com`.
          </Step>
          <Step title="Verfügbarkeit des Modells überprüfen">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Einrichtungen mit OAuth verwenden die Provider-ID `minimax-portal`. Modellreferenzen entsprechen dem Format `minimax-portal/MiniMax-M3`.
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
          <Step title="Verfügbarkeit des Modells überprüfen">
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
          <Step title="Verfügbarkeit des Modells überprüfen">
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
    Der Anthropic-kompatible Streaming-Endpunkt von MiniMax-M2.x gibt `reasoning_content` in Delta-Blöcken im OpenAI-Stil statt in nativen Anthropic-Denkblöcken aus. Dadurch werden interne Überlegungen in der sichtbaren Ausgabe offengelegt, wenn das Denken implizit aktiviert bleibt. OpenClaw deaktiviert das Denken für M2.x standardmäßig, sofern Sie `thinking` nicht ausdrücklich selbst festlegen. MiniMax-M3 (und vorwärtskompatible M3.x-Modelle) ist davon ausgenommen: M3 gibt korrekte Anthropic-Denkblöcke aus und erfordert aktives Denken, um sichtbare Inhalte zu erzeugen. Daher behält OpenClaw M3 im adaptiven Denkpfad des Providers. Weitere Informationen finden Sie im Abschnitt zu den Standardwerten für das Denken unter „Erweiterte Konfiguration“ weiter unten.
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
    Wählen Sie im Menü **Modell/Authentifizierung** aus.
  </Step>
  <Step title="Eine MiniMax-Authentifizierungsoption auswählen">
    | Authentifizierungsoption | Beschreibung                       |
    | ------------------------ | ---------------------------------- |
    | `minimax-global-oauth`   | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth`       | OAuth für China (Coding Plan)      |
    | `minimax-global-api`     | Internationaler API-Schlüssel      |
    | `minimax-cn-api`         | API-Schlüssel für China            |
  </Step>
  <Step title="Standardmodell auswählen">
    Wählen Sie nach Aufforderung Ihr Standardmodell aus.
  </Step>
</Steps>

## Funktionen

### Bilderzeugung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate` sowohl unter `minimax` als auch unter `minimax-portal` und verwendet dabei denselben `MINIMAX_API_KEY` beziehungsweise dieselbe OAuth-Authentifizierung wie die Textmodelle.

- Text-zu-Bild-Erzeugung und Bild-zu-Bild-Bearbeitung (Motivreferenz), jeweils mit Steuerung des Seitenverhältnisses
- Bis zu 9 Ausgabebilder pro Anfrage und 1 Referenzbild pro Bearbeitungsanfrage
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

Die Bilderzeugung verwendet immer den dedizierten Bild-Endpunkt von MiniMax (`/v1/image_generation`) und ignoriert `models.providers.minimax.baseUrl`, da dieses Feld stattdessen die Chat-/Anthropic-kompatible Basis-URL konfiguriert. Legen Sie `MINIMAX_API_HOST=https://api.minimaxi.com` fest, um die Bilderzeugung über den chinesischen Endpunkt zu leiten; der globale Standardendpunkt ist `https://api.minimax.io`.

<Note>
Unter [Bilderzeugung](/de/tools/image-generation) finden Sie Informationen zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum Failover-Verhalten.
</Note>

### Text-zu-Sprache

Das mitgelieferte `minimax`-Plugin registriert MiniMax T2A v2 als Sprach-Provider für `messages.tts`.

- Standard-TTS-Modell: `speech-2.8-hd`
- Standardstimme: `English_expressive_narrator`
- Mitgelieferte Modell-IDs: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Reihenfolge der Authentifizierungsauflösung: `messages.tts.providers.minimax.apiKey`, dann OAuth-/Token-Authentifizierungsprofile von `minimax-portal`, dann Umgebungsschlüssel des Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), dann `MINIMAX_API_KEY`
- Wenn kein TTS-Host konfiguriert ist, verwendet OpenClaw den konfigurierten OAuth-Host von `minimax-portal` und entfernt Anthropic-kompatible Pfadsuffixe wie `/anthropic`
- Normale Audioanhänge bleiben im MP3-Format. Für Sprachnachrichtenziele (Feishu, Telegram und andere Kanäle, die einen mit Sprachnachrichten kompatiblen Anhang anfordern) wird MiniMax-MP3 mit `ffmpeg` in Opus mit 48 kHz transkodiert, da beispielsweise die Datei-API von Feishu/Lark für native Audionachrichten ausschließlich `file_type: "opus"` akzeptiert
- MiniMax T2A akzeptiert Dezimalwerte für `speed` und `vol`, `pitch` wird jedoch als Ganzzahl gesendet; OpenClaw schneidet bei `pitch` Dezimalstellen vor der API-Anfrage ab

| Einstellung                              | Umgebungsvariable       | Standard                      | Beschreibung                                      |
| ---------------------------------------- | ----------------------- | ----------------------------- | ------------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`      | `https://api.minimax.io`      | API-Host für MiniMax T2A.                         |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`     | `speech-2.8-hd`               | TTS-Modell-ID.                                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`  | `English_expressive_narrator` | Für die Sprachausgabe verwendete Stimmen-ID.      |
| `messages.tts.providers.minimax.speed`   |                         | `1.0`                         | Wiedergabegeschwindigkeit, `0.5..2.0`.             |
| `messages.tts.providers.minimax.vol`     |                         | `1.0`                         | Lautstärke, `(0, 10]`.                            |
| `messages.tts.providers.minimax.pitch`   |                         | `0`                           | Ganzzahlige Tonhöhenverschiebung, `-12..12`.      |

### Musikerzeugung

Das mitgelieferte MiniMax-Plugin registriert die Musikerzeugung über das gemeinsame Tool `music_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Musikmodell: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Unterstützt außerdem `music-2.6-free`, `music-cover` und `music-cover-free`
- Prompt-Steuerungen: `lyrics`, `instrumental`
- Ausgabeformat: `mp3`
- Sitzungsgestützte Ausführungen werden über den gemeinsamen Aufgaben-/Statusablauf abgekoppelt, einschließlich `action: "status"`

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
Unter [Musikerzeugung](/de/tools/music-generation) finden Sie Informationen zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum Failover-Verhalten.
</Note>

### Videoerzeugung

Das mitgelieferte MiniMax-Plugin registriert die Videoerzeugung über das gemeinsame Tool `video_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Unterstützt außerdem `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` und `I2V-01`
- Modi: Text-zu-Video und Abläufe mit einem einzelnen Bild als Referenz
- Unterstützt `resolution` (`768P` oder `1080P` bei den Modellen Hailuo 2.3/02); `aspectRatio` wird nicht unterstützt und ignoriert

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

Deshalb kann das automatische Medien-Routing das Bildverständnis von MiniMax verwenden, selbst wenn der mitgelieferte Text-Provider-Katalog auch bildfähige M3-Chatreferenzen enthält. Das PDF-Verständnis verwendet `MiniMax-M2.7` ausschließlich zur Textextraktion; MiniMax registriert keinen Konvertierungspfad von PDF zu Bild.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API des MiniMax Token Plan (`/v1/coding_plan/search`).

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Ausschnitte, verwandte Suchanfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierte Umgebungsvariablen-Aliasse: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn die Variable bereits auf Zugangsdaten für den Token Plan verweist
- Wiederverwendung der Region: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann die Basis-URLs des MiniMax-Providers
- Die Suche bleibt bei der Provider-ID `minimax`; die globale bzw. CN-spezifische OAuth-Einrichtung kann die Region indirekt über `models.providers.minimax-portal.baseUrl` steuern und über `MINIMAX_OAUTH_TOKEN` eine Bearer-Authentifizierung bereitstellen

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Unter [MiniMax-Suche](/de/tools/minimax-search) finden Sie die vollständige Konfiguration und Verwendung der Websuche.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen">
    | Option | Beschreibung |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Bevorzugen Sie `https://api.minimax.io/anthropic` (Anthropic-kompatibel); `https://api.minimax.io/v1` ist für OpenAI-kompatible Payloads optional |
    | `models.providers.minimax.api` | Bevorzugen Sie `anthropic-messages`; `openai-completions` ist für OpenAI-kompatible Payloads optional |
    | `models.providers.minimax.apiKey` | MiniMax-API-Schlüssel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definieren Sie `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Versehen Sie Modelle, die Sie in der Zulassungsliste benötigen, mit Aliasnamen |
    | `models.mode` | Behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu den integrierten Modellen hinzufügen möchten |
  </Accordion>

  <Accordion title="Standardwerte für das Denken">
    Bei `api: "anthropic-messages"` fügt OpenClaw für MiniMax-M2.x-Modelle `thinking: { type: "disabled" }` ein, sofern nicht bereits ein früherer Wrapper das Feld `thinking` in der Payload gesetzt hat. Dadurch wird verhindert, dass der Streaming-Endpunkt von M2.x `reasoning_content` in Delta-Blöcken im OpenAI-Stil ausgibt, wodurch interne Schlussfolgerungen in die sichtbare Ausgabe gelangen würden.

    MiniMax-M3 (und M3.x) ist davon ausgenommen: M3 gibt bei deaktiviertem Denken ein leeres `content`-Array mit `stop_reason: "end_turn"` zurück. Daher entfernt OpenClaw für M3 den impliziten Standardwert zur Deaktivierung und erzwingt stattdessen `thinking: { type: "adaptive" }`, wenn eine Denkstufe festgelegt ist.

    Verfügbare Denkstufen je Modellfamilie:

    | Modellfamilie  | Stufen                                    | Standardwert |
    | -------------- | ----------------------------------------- | ------------ |
    | `MiniMax-M3`   | `off`, `adaptive`                         | `adaptive`   |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`        |

  </Accordion>

  <Accordion title="Schnellmodus">
    `/fast on` oder `params.fastMode: true` ersetzt `MiniMax-M2.7` im Anthropic-kompatiblen Streaming-Pfad (`api: "anthropic-messages"`, Provider `minimax` oder `minimax-portal`) durch `MiniMax-M2.7-highspeed`.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten geeignet für:** Behalten Sie Ihr leistungsstärkstes Modell der neuesten Generation als Primärmodell bei und wechseln Sie bei einem Ausfall zu MiniMax M2.7. Das folgende Beispiel verwendet Opus als konkretes Primärmodell; ersetzen Sie es durch Ihr bevorzugtes Primärmodell der neuesten Generation.

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
    - API zur Nutzung des Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` oder `https://api.minimax.io/v1/token_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - Die Nutzungsabfrage leitet den Host aus `models.providers.minimax-portal.baseUrl` oder `models.providers.minimax.baseUrl` ab, sofern konfiguriert. Dadurch fragt eine globale Einrichtung mit `https://api.minimax.io/anthropic` den Host `api.minimax.io` ab. Bei fehlenden oder fehlerhaften Basis-URLs bleibt aus Kompatibilitätsgründen der CN-Fallback erhalten.
    - OpenClaw normalisiert die Nutzung des MiniMax Coding Plan auf dieselbe Anzeige `% verbleibend`, die auch andere Provider verwenden. Die MiniMax-Rohfelder `usage_percent` / `usagePercent` geben das verbleibende und nicht das verbrauchte Kontingent an, weshalb OpenClaw sie invertiert. Mengenbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag des Chatmodells, leitet bei Bedarf die Bezeichnung des Zeitfensters aus `start_time` / `end_time` ab und nimmt den Namen des ausgewählten Modells in die Planbezeichnung auf, damit sich die Zeitfenster des Coding Plan leichter unterscheiden lassen.
    - Nutzungsschnappschüsse behandeln `minimax`, `minimax-cn`, `minimax-portal` und `minimax-portal-cn` als dieselbe MiniMax-Kontingentoberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor sie auf Umgebungsvariablen für Coding-Plan-Schlüssel zurückgreifen.

  </Accordion>
</AccordionGroup>

## Hinweise

- Standard-Chatmodell: `MiniMax-M3`. Alternative Chatmodelle: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Das Onboarding und die direkte Einrichtung per API-Schlüssel schreiben Modelldefinitionen für M3 und beide M2.7-Varianten
- Das Bildverständnis verwendet den Plugin-eigenen Medien-Provider `MiniMax-VL-01`
- Aktualisieren Sie die Preiswerte in `models.json`, wenn Sie eine genaue Kostenverfolgung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie anschließend mit `openclaw models set minimax/MiniMax-M3` oder `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Unter [Modell-Provider](/de/concepts/model-providers) finden Sie die Regeln für Provider.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unbekanntes Modell: minimax/MiniMax-M3"'>
    Dies bedeutet normalerweise, dass der **MiniMax-Provider nicht konfiguriert ist** (kein passender Provider-Eintrag und weder ein MiniMax-Authentifizierungsprofil noch ein Umgebungsschlüssel gefunden). So beheben Sie das Problem:

    - Führen Sie `openclaw configure` aus und wählen Sie eine **MiniMax**-Authentifizierungsoption aus oder
    - fügen Sie den passenden Block `models.providers.minimax` oder `models.providers.minimax-portal` manuell hinzu oder
    - legen Sie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Authentifizierungsprofil fest, damit der passende Provider eingefügt werden kann.

    Beachten Sie, dass bei der Modell-ID die **Groß-/Kleinschreibung berücksichtigt wird**:

    - API-Schlüssel-Pfad: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - OAuth-Pfad: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

    Prüfen Sie anschließend erneut mit:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [Häufig gestellte Fragen](/de/help/faq).
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
    Konfiguration der Websuche über MiniMax Token Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und häufig gestellte Fragen.
  </Card>
</CardGroup>
