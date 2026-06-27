---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw
    - Sie benötigen eine Anleitung zur Einrichtung von MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:05:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaws MiniMax-Provider verwendet standardmäßig **MiniMax M3**.

MiniMax bietet außerdem:

- Mitgelieferte Sprachsynthese über T2A v2
- Mitgeliefertes Bildverstehen über `MiniMax-VL-01`
- Mitgelieferte Musikgenerierung über `music-2.6`
- Mitgeliefertes `web_search` über die MiniMax Token Plan Search API

Provider-Aufteilung:

| Provider-ID     | Auth          | Fähigkeiten                                                                                               |
| ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `minimax`        | API-Schlüssel | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverstehen, Sprache, Websuche              |
| `minimax-portal` | OAuth         | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverstehen, Sprache                        |

## Integrierter Katalog

| Modell                   | Typ                | Beschreibung                                      |
| ------------------------ | ------------------ | ------------------------------------------------- |
| `MiniMax-M3`             | Chat (Reasoning)   | Standardmäßig gehostetes Reasoning-Modell         |
| `MiniMax-M2.7`           | Chat (Reasoning)   | Vorheriges gehostetes Reasoning-Modell            |
| `MiniMax-M2.7-highspeed` | Chat (Reasoning)   | Schnellere M2.7-Reasoning-Stufe                   |
| `MiniMax-VL-01`          | Vision             | Modell für Bildverstehen                          |
| `image-01`               | Bildgenerierung    | Text-zu-Bild- und Bild-zu-Bild-Bearbeitung        |
| `music-2.6`              | Musikgenerierung   | Standard-Musikmodell                              |
| `music-2.5`              | Musikgenerierung   | Vorherige Stufe für Musikgenerierung              |
| `music-2.0`              | Musikgenerierung   | Legacy-Stufe für Musikgenerierung                 |
| `MiniMax-Hailuo-2.3`     | Videogenerierung   | Text-zu-Video- und Bildreferenz-Abläufe           |

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Am besten geeignet für:** schnelle Einrichtung mit dem MiniMax Coding Plan über OAuth, kein API-Schlüssel erforderlich.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Dies authentifiziert gegen `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Dies authentifiziert gegen `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth-Einrichtungen verwenden die Provider-ID `minimax-portal`. Modellreferenzen folgen der Form `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Empfehlungslink für den MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Am besten geeignet für:** gehostetes MiniMax mit Anthropic-kompatibler API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Dies konfiguriert `api.minimax.io` als Basis-URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Dies konfiguriert `api.minimaxi.com` als Basis-URL.
          </Step>
          <Step title="Verify the model is available">
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
    Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax M2.x Thinking standardmäßig, es sei denn, Sie setzen `thinking` ausdrücklich selbst. Der Streaming-Endpunkt von M2.x gibt `reasoning_content` in Delta-Chunks im OpenAI-Stil statt in nativen Anthropic-Thinking-Blöcken aus. Dadurch kann internes Reasoning in sichtbare Ausgaben gelangen, wenn es implizit aktiviert bleibt. MiniMax-M3 (und vorwärtskompatibles M3.x) ist von dieser Standardeinstellung ausgenommen: M3 gibt korrekte Anthropic-Thinking-Blöcke aus und benötigt aktives Thinking, um sichtbare Inhalte zu erzeugen. Daher belässt OpenClaw M3 auf dem ausgelassenen/adaptiven Thinking-Pfad des Providers.
    </Warning>

    <Note>
    API-Schlüssel-Einrichtungen verwenden die Provider-ID `minimax`. Modellreferenzen folgen der Form `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax ohne JSON-Bearbeitung einzurichten:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Wählen Sie **Model/auth** aus dem Menü.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Wählen Sie eine der verfügbaren MiniMax-Optionen aus:

    | Auth-Auswahl | Beschreibung |
    | --- | --- |
    | `minimax-global-oauth` | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China-OAuth (Coding Plan) |
    | `minimax-global-api` | Internationaler API-Schlüssel |
    | `minimax-cn-api` | China-API-Schlüssel |

  </Step>
  <Step title="Pick your default model">
    Wählen Sie Ihr Standardmodell aus, wenn Sie dazu aufgefordert werden.
  </Step>
</Steps>

## Fähigkeiten

### Bildgenerierung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate`. Es unterstützt:

- **Text-zu-Bild-Generierung** mit Steuerung des Seitenverhältnisses
- **Bild-zu-Bild-Bearbeitung** (Motivreferenz) mit Steuerung des Seitenverhältnisses
- Bis zu **9 Ausgabebilder** pro Anfrage
- Bis zu **1 Referenzbild** pro Bearbeitungsanfrage
- Unterstützte Seitenverhältnisse: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Um MiniMax für die Bildgenerierung zu verwenden, legen Sie es als Provider für die Bildgenerierung fest:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Das Plugin verwendet denselben `MINIMAX_API_KEY` oder dieselbe OAuth-Authentifizierung wie die Textmodelle. Wenn MiniMax bereits eingerichtet ist, ist keine zusätzliche Konfiguration erforderlich.

Sowohl `minimax` als auch `minimax-portal` registrieren `image_generate` mit demselben
Modell `image-01`. API-Schlüssel-Einrichtungen verwenden `MINIMAX_API_KEY`; OAuth-Einrichtungen können stattdessen
den mitgelieferten Auth-Pfad `minimax-portal` verwenden.

Die Bildgenerierung verwendet immer den dedizierten Bild-Endpunkt von MiniMax
(`/v1/image_generation`) und ignoriert `models.providers.minimax.baseUrl`,
da dieses Feld die Chat-/Anthropic-kompatible Basis-URL konfiguriert. Setzen Sie
`MINIMAX_API_HOST=https://api.minimaxi.com`, um die Bildgenerierung
über den CN-Endpunkt zu leiten; der standardmäßige globale Endpunkt ist
`https://api.minimax.io`.

Wenn Onboarding oder API-Schlüssel-Einrichtung explizite Einträge für `models.providers.minimax`
schreibt, materialisiert OpenClaw `MiniMax-M3`, `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` als Chat-Modelle. M3 weist Text- und Bildeingabe aus;
Bildverstehen bleibt separat über den Plugin-eigenen
Medien-Provider `MiniMax-VL-01` verfügbar.

<Note>
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Text-zu-Sprache

Das mitgelieferte Plugin `minimax` registriert MiniMax T2A v2 als Sprach-Provider für
`messages.tts`.

- Standard-TTS-Modell: `speech-2.8-hd`
- Standardstimme: `English_expressive_narrator`
- Unterstützte mitgelieferte Modell-IDs umfassen `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` und `speech-01-turbo`.
- Die Auth-Auflösung ist `messages.tts.providers.minimax.apiKey`, dann
  OAuth-/Token-Auth-Profile für `minimax-portal`, dann Token-Plan-Umgebungs-
  schlüssel (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), dann `MINIMAX_API_KEY`.
- Wenn kein TTS-Host konfiguriert ist, verwendet OpenClaw den konfigurierten
  OAuth-Host `minimax-portal` erneut und entfernt Anthropic-kompatible Pfadsuffixe
  wie `/anthropic`.
- Normale Audioanhänge bleiben MP3.
- Sprachnotiz-Ziele wie Feishu und Telegram werden mit `ffmpeg` von MiniMax-
  MP3 in 48-kHz-Opus transkodiert, da die Feishu/Lark-Datei-API für native
  Audionachrichten nur `file_type: "opus"` akzeptiert.
- MiniMax T2A akzeptiert gebrochene Werte für `speed` und `vol`, aber `pitch` wird als
  Ganzzahl gesendet; OpenClaw kürzt gebrochene `pitch`-Werte vor der API-Anfrage.

| Einstellung                                      | Env-Var                | Standard                      | Beschreibung                                |
| ----------------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax-T2A-API-Host.                       |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS-Modell-ID.                              |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Stimm-ID für Sprachausgabe.                 |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Wiedergabegeschwindigkeit, `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Lautstärke, `(0, 10]`.                      |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Ganzzahlige Tonhöhenverschiebung, `-12..12`. |

### Musikgenerierung

Das mitgelieferte MiniMax-Plugin registriert Musikgenerierung über das gemeinsame
Tool `music_generate` für sowohl `minimax` als auch `minimax-portal`.

- Standard-Musikmodell: `minimax/music-2.6`
- OAuth-Musikmodell: `minimax-portal/music-2.6`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Prompt-Steuerungen: `lyrics`, `instrumental`
- Ausgabeformat: `mp3`
- Sitzungsbasierte Läufe werden über den gemeinsamen Aufgaben-/Statusfluss entkoppelt, einschließlich `action: "status"`

So verwenden Sie MiniMax als Standard-Musik-Provider:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Siehe [Musikgenerierung](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Videogenerierung

Das gebündelte MiniMax-Plugin registriert Videogenerierung über das gemeinsame
Tool `video_generate` für sowohl `minimax` als auch `minimax-portal`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3`
- OAuth-Videomodell: `minimax-portal/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video- und Referenzflüsse mit Einzelbild
- Unterstützt `aspectRatio` und `resolution`

So verwenden Sie MiniMax als Standard-Video-Provider:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Textkatalog:

| Provider-ID      | Standard-Bildmodell |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Deshalb kann automatisches Medienrouting das MiniMax-Bildverständnis verwenden,
auch wenn der gebündelte Text-Provider-Katalog ebenfalls M3-chatfähige Referenzen mit Bildunterstützung enthält.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die MiniMax Token Plan
Search API.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierte Umgebungsaliasnamen: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn sie bereits auf eine Token-Plan-Berechtigung verweist
- Regionswiederverwendung: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann MiniMax-Provider-Basis-URLs
- Die Suche bleibt auf der Provider-ID `minimax`; die OAuth-Einrichtung für CN/global kann die Region indirekt über `models.providers.minimax-portal.baseUrl` steuern und Bearer-Authentifizierung über `MINIMAX_OAUTH_TOKEN` bereitstellen

Die Konfiguration liegt unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Siehe [MiniMax-Suche](/de/tools/minimax-search) für die vollständige Websuchkonfiguration und Nutzung.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen">
    | Option | Beschreibung |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Bevorzugt `https://api.minimax.io/anthropic` (Anthropic-kompatibel); `https://api.minimax.io/v1` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.api` | Bevorzugt `anthropic-messages`; `openai-completions` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.apiKey` | MiniMax-API-Schlüssel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definiert `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Weisen Sie Modellen, die Sie in der Allowlist haben möchten, Aliasnamen zu |
    | `models.mode` | Behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu den integrierten Providern hinzufügen möchten |
  </Accordion>

  <Accordion title="Thinking-Standards">
    Bei `api: "anthropic-messages"` injiziert OpenClaw `thinking: { type: "disabled" }` für MiniMax-M2.x-Modelle, sofern Thinking nicht bereits explizit in Parametern/Konfiguration gesetzt ist.

    Dadurch wird verhindert, dass der Streaming-Endpunkt von M2.x `reasoning_content` in OpenAI-artigen Delta-Chunks ausgibt, was internes Reasoning in sichtbare Ausgaben leaken würde.

    MiniMax-M3 (und M3.x) ist ausgenommen: M3 gibt korrekte Anthropic-Thinking-Blöcke aus und liefert ein leeres `content`-Array mit `stop_reason: "end_turn"`, wenn Thinking deaktiviert ist. Deshalb belässt der Wrapper M3 auf dem ausgelassenen/adaptiven Thinking-Pfad des Providers.

  </Accordion>

  <Accordion title="Schnellmodus">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Stream-Pfad zu `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten für:** Ihr stärkstes Modell der neuesten Generation als primäres Modell behalten und bei Bedarf auf MiniMax M2.7 ausweichen. Das folgende Beispiel verwendet Opus als konkretes primäres Modell; ersetzen Sie es durch Ihr bevorzugtes primäres Modell der neuesten Generation.

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

  <Accordion title="Nutzungsdetails zum Coding Plan">
    - Coding-Plan-Nutzungs-API: `https://api.minimaxi.com/v1/token_plan/remains` oder `https://api.minimax.io/v1/token_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - Das Nutzungs-Polling leitet den Host aus `models.providers.minimax-portal.baseUrl` oder `models.providers.minimax.baseUrl` ab, wenn konfiguriert. Globale Setups mit `https://api.minimax.io/anthropic` pollen daher `api.minimax.io`. Fehlende oder fehlerhafte Basis-URLs behalten aus Kompatibilitätsgründen den CN-Fallback bei.
    - OpenClaw normalisiert die MiniMax-Coding-Plan-Nutzung auf dieselbe Anzeige für `% left`, die auch von anderen Providern verwendet wird. Die Rohfelder `usage_percent` / `usagePercent` von MiniMax stehen für verbleibendes Kontingent, nicht verbrauchtes Kontingent, daher invertiert OpenClaw sie. Zählerbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Chat-Modell-Eintrag, leitet bei Bedarf die Fensterbezeichnung aus `start_time` / `end_time` ab und nimmt den ausgewählten Modellnamen in die Planbezeichnung auf, damit Coding-Plan-Fenster leichter zu unterscheiden sind.
    - Nutzungssnapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingentfläche und bevorzugen gespeichertes MiniMax OAuth, bevor sie auf Umgebungsvariablen für den Coding-Plan-Schlüssel zurückfallen.

  </Accordion>
</AccordionGroup>

## Hinweise

- Modellreferenzen folgen dem Authentifizierungspfad:
  - API-Schlüssel-Setup: `minimax/<model>`
  - OAuth-Setup: `minimax-portal/<model>`
- Standard-Chatmodell: `MiniMax-M3`
- Alternative Chatmodelle: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding und direktes API-Schlüssel-Setup schreiben Modelldefinitionen für M3 und beide M2.7-Varianten
- Bildverständnis verwendet den Plugin-eigenen Medien-Provider `MiniMax-VL-01`
- Aktualisieren Sie Preiswerte in `models.json`, wenn Sie exakte Kostenerfassung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit `openclaw models set minimax/MiniMax-M3` oder `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Siehe [Modell-Provider](/de/concepts/model-providers) für Provider-Regeln.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unbekanntes Modell: minimax/MiniMax-M3"'>
    Das bedeutet in der Regel, dass der **MiniMax-Provider nicht konfiguriert ist** (kein passender Provider-Eintrag und kein MiniMax-Authentifizierungsprofil/Umgebungsschlüssel gefunden). Ein Fix für diese Erkennung ist in **2026.1.12** enthalten. Beheben Sie dies durch:

    - Upgrade auf **2026.1.12** (oder Ausführung aus Source `main`) und anschließenden Neustart des Gateways.
    - Ausführen von `openclaw configure` und Auswahl einer **MiniMax**-Authentifizierungsoption, oder
    - Manuelles Hinzufügen des passenden Blocks `models.providers.minimax` oder `models.providers.minimax-portal`, oder
    - Setzen von `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder eines MiniMax-Authentifizierungsprofils, damit der passende Provider injiziert werden kann.

    Stellen Sie sicher, dass die Modell-ID **Groß-/Kleinschreibung beachtet**:

    - API-Schlüssel-Pfad: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - OAuth-Pfad: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

    Prüfen Sie anschließend erneut mit:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter für Musik-Tools und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="MiniMax-Suche" href="/de/tools/minimax-search" icon="magnifying-glass">
    Websuchkonfiguration über MiniMax Token Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
