---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden.
    - Sie benötigen eine Anleitung zur Einrichtung von MiniMax.
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:55:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

Der MiniMax-Provider von OpenClaw verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- Gebündelte Sprachsynthese über T2A v2
- Gebündeltes Bildverständnis über `MiniMax-VL-01`
- Gebündelte Musikgenerierung über `music-2.6`
- Gebündelte `web_search` über die Such-API von MiniMax Coding Plan

Provider-Aufteilung:

| Provider-ID      | Auth      | Funktionen                                                      |
| ---------------- | --------- | --------------------------------------------------------------- |
| `minimax`        | API-Schlüssel | Text, Bildgenerierung, Bildverständnis, Sprache, Websuche |
| `minimax-portal` | OAuth     | Text, Bildgenerierung, Bildverständnis, Sprache                |

## Integrierter Katalog

| Modell                   | Typ               | Beschreibung                                |
| ------------------------ | ----------------- | ------------------------------------------- |
| `MiniMax-M2.7`           | Chat (Reasoning)  | Standardmodell für gehostetes Reasoning     |
| `MiniMax-M2.7-highspeed` | Chat (Reasoning)  | Schnellere M2.7-Reasoning-Stufe             |
| `MiniMax-VL-01`          | Vision            | Modell für Bildverständnis                  |
| `image-01`               | Bildgenerierung   | Text-zu-Bild und Bild-zu-Bild-Bearbeitung   |
| `music-2.6`              | Musikgenerierung  | Standard-Musikmodell                        |
| `music-2.5`              | Musikgenerierung  | Vorherige Stufe der Musikgenerierung        |
| `music-2.0`              | Musikgenerierung  | Legacy-Stufe der Musikgenerierung           |
| `MiniMax-Hailuo-2.3`     | Videogenerierung  | Text-zu-Video- und bildreferenzierte Abläufe |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Am besten geeignet für:** schnelle Einrichtung mit MiniMax Coding Plan über OAuth, kein API-Schlüssel erforderlich.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Dadurch wird die Authentifizierung gegen `api.minimax.io` durchgeführt.
          </Step>
          <Step title="Prüfen, ob das Modell verfügbar ist">
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

            Dadurch wird die Authentifizierung gegen `api.minimaxi.com` durchgeführt.
          </Step>
          <Step title="Prüfen, ob das Modell verfügbar ist">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth-Einrichtungen verwenden die Provider-ID `minimax-portal`. Modellreferenzen folgen dem Format `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

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
          <Step title="Prüfen, ob das Modell verfügbar ist">
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
          <Step title="Prüfen, ob das Modell verfügbar ist">
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking standardmäßig, sofern Sie `thinking` nicht selbst explizit festlegen. Der Streaming-Endpunkt von MiniMax gibt `reasoning_content` in Delta-Chunks im OpenAI-Stil statt in nativen Anthropic-Thinking-Blöcken aus, wodurch internes Reasoning in der sichtbaren Ausgabe erscheinen kann, wenn es implizit aktiviert bleibt.
    </Warning>

    <Note>
    Einrichtungen mit API-Schlüssel verwenden die Provider-ID `minimax`. Modellreferenzen folgen dem Format `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax einzurichten, ohne JSON zu bearbeiten:

<Steps>
  <Step title="Assistenten starten">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth auswählen">
    Wählen Sie im Menü **Model/auth**.
  </Step>
  <Step title="Eine MiniMax-Authentifizierungsoption wählen">
    Wählen Sie eine der verfügbaren MiniMax-Optionen:

    | Auth-Auswahl | Beschreibung |
    | --- | --- |
    | `minimax-global-oauth` | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China-OAuth (Coding Plan) |
    | `minimax-global-api` | Internationaler API-Schlüssel |
    | `minimax-cn-api` | China-API-Schlüssel |

  </Step>
  <Step title="Standardmodell auswählen">
    Wählen Sie Ihr Standardmodell aus, wenn Sie dazu aufgefordert werden.
  </Step>
</Steps>

## Funktionen

### Bildgenerierung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate`. Es unterstützt:

- **Text-zu-Bild-Generierung** mit Steuerung des Seitenverhältnisses
- **Bild-zu-Bild-Bearbeitung** (Subjektreferenz) mit Steuerung des Seitenverhältnisses
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

Das Plugin verwendet dieselbe Authentifizierung über `MINIMAX_API_KEY` oder OAuth wie die Textmodelle. Es ist keine zusätzliche Konfiguration erforderlich, wenn MiniMax bereits eingerichtet ist.

Sowohl `minimax` als auch `minimax-portal` registrieren `image_generate` mit demselben
Modell `image-01`. Setups mit API-Schlüssel verwenden `MINIMAX_API_KEY`; OAuth-Setups können stattdessen
den gebündelten Auth-Pfad `minimax-portal` verwenden.

Wenn beim Onboarding oder bei der Einrichtung mit API-Schlüssel explizite Einträge unter `models.providers.minimax`
geschrieben werden, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` als reine Text-Chatmodelle. Bildverständnis wird
separat über den Plugin-eigenen Medienprovider `MiniMax-VL-01` bereitgestellt.

<Note>
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Text-to-Speech

Das gebündelte Plugin `minimax` registriert MiniMax T2A v2 als Sprachprovider für
`messages.tts`.

- Standard-TTS-Modell: `speech-2.8-hd`
- Standardstimme: `English_expressive_narrator`
- Unterstützte gebündelte Modell-IDs umfassen `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` und `speech-01-turbo`.
- Die Auth-Auflösung ist `messages.tts.providers.minimax.apiKey`, dann
  Auth-Profile für OAuth/Token von `minimax-portal`, dann Umgebungs-
  schlüssel für Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), dann `MINIMAX_API_KEY`.
- Wenn kein TTS-Host konfiguriert ist, verwendet OpenClaw den konfigurierten
  OAuth-Host von `minimax-portal` erneut und entfernt Anthropic-kompatible Pfadsuffixe
  wie `/anthropic`.
- Normale Audioanhänge bleiben MP3.
- Ziele für Sprachnachrichten wie Feishu und Telegram werden von MiniMax-
  MP3 mit `ffmpeg` in 48-kHz-Opus transkodiert, da die Feishu-/Lark-Datei-API nur
  `file_type: "opus"` für native Audionachrichten akzeptiert.
- MiniMax T2A akzeptiert gebrochene Werte für `speed` und `vol`, aber `pitch` wird als
  Ganzzahl gesendet; OpenClaw schneidet gebrochene `pitch`-Werte vor der API-Anfrage ab.

| Einstellung                              | Umgebungsvariable     | Standard                      | Beschreibung                     |
| ---------------------------------------- | --------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`    | `https://api.minimax.io`      | API-Host für MiniMax T2A.        |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`   | `speech-2.8-hd`               | TTS-Modell-ID.                   |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Voice-ID für die Sprachausgabe. |
| `messages.tts.providers.minimax.speed`   |                       | `1.0`                         | Wiedergabegeschwindigkeit, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                       | `1.0`                         | Lautstärke, `(0, 10]`.           |
| `messages.tts.providers.minimax.pitch`   |                       | `0`                           | Ganzzahliger Pitch-Shift, `-12..12`. |

### Musikgenerierung

Das gebündelte Plugin `minimax` registriert außerdem Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `minimax/music-2.6`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Prompt-Steuerungen: `lyrics`, `instrumental`, `durationSeconds`
- Ausgabeformat: `mp3`
- Sitzungsbasierte Ausführungen werden über den gemeinsamen Ablauf für Aufgaben/Status abgetrennt, einschließlich `action: "status"`

Um MiniMax als Standardprovider für Musik zu verwenden:

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
Siehe [Music Generation](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Videogenerierung

Das gebündelte Plugin `minimax` registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video und Abläufe mit Einzelbildreferenz
- Unterstützt `aspectRatio` und `resolution`

Um MiniMax als Standardprovider für Video zu verwenden:

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
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Textkatalog:

| Provider-ID      | Standard-Bildmodell |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Deshalb kann automatisches Medienrouting MiniMax-Bildverständnis verwenden, selbst
wenn der gebündelte Katalog des Text-Providers weiterhin reine M2.7-Chat-Referenzen anzeigt.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API von MiniMax Coding Plan.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierter Umgebungsalias: `MINIMAX_CODING_API_KEY`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn er bereits auf ein Coding-Plan-Token verweist
- Regionswiederverwendung: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann Basis-URLs des MiniMax-Providers
- Die Suche bleibt auf der Provider-ID `minimax`; das OAuth-CN-/Global-Setup kann die Region weiterhin indirekt über `models.providers.minimax-portal.baseUrl` steuern

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Siehe [MiniMax Search](/de/tools/minimax-search) für die vollständige Konfiguration und Verwendung der Websuche.
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
    | `agents.defaults.models` | Alias-Modelle, die Sie in der Allowlist haben möchten |
    | `models.mode` | Behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu integrierten Providern hinzufügen möchten |
  </Accordion>

  <Accordion title="Thinking-Standardeinstellungen">
    Bei `api: "anthropic-messages"` fügt OpenClaw `thinking: { type: "disabled" }` ein, sofern Thinking nicht bereits explizit in Parametern/Konfiguration festgelegt ist.

    Dadurch wird verhindert, dass der Streaming-Endpunkt von MiniMax `reasoning_content` in Delta-Chunks im OpenAI-Stil ausgibt, wodurch internes Reasoning in der sichtbaren Ausgabe offengelegt würde.

  </Accordion>

  <Accordion title="Schnellmodus">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Streaming-Pfad zu `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten geeignet für:** Behalten Sie Ihr stärkstes Modell der neuesten Generation als primäres Modell und verwenden Sie MiniMax M2.7 als Fallback. Das folgende Beispiel nutzt Opus als konkretes primäres Modell; ersetzen Sie es durch Ihr bevorzugtes primäres Modell der neuesten Generation.

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

  <Accordion title="Nutzungsdetails zu Coding Plan">
    - Coding-Plan-Nutzungs-API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - OpenClaw normalisiert die Nutzung des MiniMax Coding Plan auf dieselbe Anzeige `% verbleibend`, die auch bei anderen Providern verwendet wird. Die Rohfelder `usage_percent` / `usagePercent` von MiniMax geben die verbleibende Quote an, nicht die verbrauchte Quote, daher invertiert OpenClaw sie. Zählbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag des Chat-Modells, leitet das Fensterlabel bei Bedarf aus `start_time` / `end_time` ab und schließt den ausgewählten Modellnamen in das Plan-Label ein, damit Coding-Plan-Fenster leichter unterschieden werden können.
    - Nutzungs-Snapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Quotenoberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor auf Umgebungsvariablen für Coding-Plan-Schlüssel zurückgegriffen wird.
  </Accordion>
</AccordionGroup>

## Hinweise

- Modellreferenzen folgen dem Auth-Pfad:
  - Einrichtung mit API-Schlüssel: `minimax/<model>`
  - OAuth-Einrichtung: `minimax-portal/<model>`
- Standard-Chatmodell: `MiniMax-M2.7`
- Alternatives Chatmodell: `MiniMax-M2.7-highspeed`
- Onboarding und direkte Einrichtung mit API-Schlüssel schreiben reine Text-Modelldefinitionen für beide M2.7-Varianten
- Bildverständnis verwendet den Plugin-eigenen Medienprovider `MiniMax-VL-01`
- Aktualisieren Sie die Preiswerte in `models.json`, wenn Sie eine genaue Kostenverfolgung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit `openclaw models set minimax/MiniMax-M2.7` oder `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Siehe [Model providers](/de/concepts/model-providers) für Provider-Regeln.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Das bedeutet in der Regel, dass der **MiniMax-Provider nicht konfiguriert ist** (kein passender Provider-Eintrag und kein MiniMax-Auth-Profil/Umgebungsschlüssel gefunden). Ein Fix für diese Erkennung ist in **2026.1.12** enthalten. Beheben Sie das Problem folgendermaßen:

    - Upgrade auf **2026.1.12** (oder Ausführung aus dem Source-Branch `main`), dann Gateway neu starten.
    - `openclaw configure` ausführen und eine **MiniMax**-Auth-Option auswählen, oder
    - den passenden Block `models.providers.minimax` oder `models.providers.minimax-portal` manuell hinzufügen, oder
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Auth-Profil setzen, damit der passende Provider eingefügt werden kann.

    Stellen Sie sicher, dass die Modell-ID **groß-/kleinschreibungssensitiv** ist:

    - API-Schlüssel-Pfad: `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - OAuth-Pfad: `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

    Danach erneut prüfen mit:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Troubleshooting](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Musik-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="MiniMax Search" href="/de/tools/minimax-search" icon="magnifying-glass">
    Websuchkonfiguration über MiniMax Coding Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
