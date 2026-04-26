---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden.
    - Sie benötigen Anleitungen zur Einrichtung von MiniMax.
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

Der MiniMax-Provider von OpenClaw verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- Gebündelte Sprachsynthese über T2A v2
- Gebündeltes Bildverständnis über `MiniMax-VL-01`
- Gebündelte Musikgenerierung über `music-2.6`
- Gebündeltes `web_search` über die Such-API des MiniMax Coding Plan

Aufteilung der Provider:

| Provider-ID      | Authentifizierung | Fähigkeiten                                                                                         |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API-Key           | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverständnis, Sprache, Websuche      |
| `minimax-portal` | OAuth             | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverständnis, Sprache                 |

## Eingebauter Katalog

| Modell                   | Typ               | Beschreibung                             |
| ------------------------ | ----------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (Reasoning)  | Standardmäßig gehostetes Reasoning-Modell |
| `MiniMax-M2.7-highspeed` | Chat (Reasoning)  | Schnellere M2.7-Reasoning-Stufe          |
| `MiniMax-VL-01`          | Vision            | Modell für Bildverständnis               |
| `image-01`               | Bildgenerierung   | Text-zu-Bild und Bild-zu-Bild-Bearbeitung |
| `music-2.6`              | Musikgenerierung  | Standardmodell für Musik                 |
| `music-2.5`              | Musikgenerierung  | Vorherige Stufe der Musikgenerierung     |
| `music-2.0`              | Musikgenerierung  | Legacy-Stufe der Musikgenerierung        |
| `MiniMax-Hailuo-2.3`     | Videogenerierung  | Text-zu-Video- und Bildreferenz-Workflows |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Setup-Schritten.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Am besten geeignet für:** schnelles Setup mit MiniMax Coding Plan über OAuth, kein API-Key erforderlich.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Dies authentifiziert gegen `api.minimax.io`.
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

            Dies authentifiziert gegen `api.minimaxi.com`.
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
    OAuth-Setups verwenden die Provider-ID `minimax-portal`. Modellreferenzen folgen dem Format `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API-Key">
    **Am besten geeignet für:** gehostetes MiniMax mit Anthropic-kompatibler API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Dies konfiguriert `api.minimax.io` als Basis-URL.
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

            Dies konfiguriert `api.minimaxi.com` als Basis-URL.
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
    Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking standardmäßig, sofern Sie `thinking` nicht explizit selbst setzen. Der Streaming-Endpunkt von MiniMax gibt `reasoning_content` in OpenAI-artigen Delta-Chunks statt in nativen Anthropic-Thinking-Blöcken aus, was internes Reasoning in sichtbare Ausgabe durchsickern lassen kann, wenn es implizit aktiviert bleibt.
    </Warning>

    <Note>
    API-Key-Setups verwenden die Provider-ID `minimax`. Modellreferenzen folgen dem Format `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax einzurichten, ohne JSON zu bearbeiten:

<Steps>
  <Step title="Den Assistenten starten">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth auswählen">
    Wählen Sie **Model/auth** aus dem Menü.
  </Step>
  <Step title="Eine MiniMax-Authentifizierungsoption wählen">
    Wählen Sie eine der verfügbaren MiniMax-Optionen:

    | Auth choice | Beschreibung |
    | --- | --- |
    | `minimax-global-oauth` | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China-OAuth (Coding Plan) |
    | `minimax-global-api` | Internationaler API-Key |
    | `minimax-cn-api` | China-API-Key |

  </Step>
  <Step title="Standardmodell auswählen">
    Wählen Sie bei Aufforderung Ihr Standardmodell aus.
  </Step>
</Steps>

## Fähigkeiten

### Bildgenerierung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate`. Es unterstützt:

- **Text-zu-Bild-Generierung** mit Steuerung des Seitenverhältnisses
- **Bild-zu-Bild-Bearbeitung** (Subjektreferenz) mit Steuerung des Seitenverhältnisses
- Bis zu **9 Ausgabebilder** pro Anfrage
- Bis zu **1 Referenzbild** pro Bearbeitungsanfrage
- Unterstützte Seitenverhältnisse: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Um MiniMax für die Bildgenerierung zu verwenden, setzen Sie es als Provider für Bildgenerierung:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Das Plugin verwendet denselben `MINIMAX_API_KEY` oder dieselbe OAuth-Authentifizierung wie die Textmodelle. Zusätzliche Konfiguration ist nicht erforderlich, wenn MiniMax bereits eingerichtet ist.

Sowohl `minimax` als auch `minimax-portal` registrieren `image_generate` mit demselben
Modell `image-01`. API-Key-Setups verwenden `MINIMAX_API_KEY`; OAuth-Setups können stattdessen
den gebündelten Authentifizierungspfad `minimax-portal` verwenden.

Die Bildgenerierung verwendet immer den dedizierten Bild-Endpunkt von MiniMax
(`/v1/image_generation`) und ignoriert `models.providers.minimax.baseUrl`,
da dieses Feld die Chat-/Anthropic-kompatible Basis-URL konfiguriert. Setzen Sie
`MINIMAX_API_HOST=https://api.minimaxi.com`, um die Bildgenerierung über den
CN-Endpunkt zu leiten; der globale Standardendpunkt ist
`https://api.minimax.io`.

Wenn Onboarding oder die Einrichtung mit API-Key explizite Einträge in `models.providers.minimax`
schreiben, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` als reine Text-Chatmodelle. Bildverständnis wird
separat über den pluginseitigen Medienprovider `MiniMax-VL-01` bereitgestellt.

<Note>
Unter [Bildgenerierung](/de/tools/image-generation) finden Sie gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

### Text-to-Speech

Das gebündelte Plugin `minimax` registriert MiniMax T2A v2 als Sprachprovider für
`messages.tts`.

- Standard-TTS-Modell: `speech-2.8-hd`
- Standardstimme: `English_expressive_narrator`
- Unterstützte gebündelte Modell-IDs umfassen `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` und `speech-01-turbo`.
- Die Reihenfolge der Authentifizierungsauflösung ist `messages.tts.providers.minimax.apiKey`, dann
  OAuth-/Token-Authentifizierungsprofile von `minimax-portal`, dann Umgebungs-
  Keys des Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), dann `MINIMAX_API_KEY`.
- Wenn kein TTS-Host konfiguriert ist, verwendet OpenClaw den konfigurierten
  OAuth-Host von `minimax-portal` weiter und entfernt Anthropic-kompatible Pfadsuffixe
  wie `/anthropic`.
- Normale Audioanhänge bleiben MP3.
- Ziele für Sprachnotizen wie Feishu und Telegram werden mit `ffmpeg` von MiniMax-
  MP3 nach 48-kHz-Opus transkodiert, weil die Feishu-/Lark-Datei-API für native
  Audionachrichten nur `file_type: "opus"` akzeptiert.
- MiniMax T2A akzeptiert gebrochene Werte für `speed` und `vol`, aber `pitch` wird als
  Ganzzahl gesendet; OpenClaw schneidet gebrochene `pitch`-Werte vor der API-Anfrage ab.

| Einstellung                               | Env-Variable            | Standard                      | Beschreibung                    |
| ----------------------------------------- | ----------------------- | ----------------------------- | ------------------------------- |
| `messages.tts.providers.minimax.baseUrl`  | `MINIMAX_API_HOST`      | `https://api.minimax.io`      | Host der MiniMax-T2A-API.       |
| `messages.tts.providers.minimax.model`    | `MINIMAX_TTS_MODEL`     | `speech-2.8-hd`               | ID des TTS-Modells.             |
| `messages.tts.providers.minimax.voiceId`  | `MINIMAX_TTS_VOICE_ID`  | `English_expressive_narrator` | Voice-ID für die Sprachausgabe. |
| `messages.tts.providers.minimax.speed`    |                         | `1.0`                         | Wiedergabegeschwindigkeit, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`      |                         | `1.0`                         | Lautstärke, `(0, 10]`.          |
| `messages.tts.providers.minimax.pitch`    |                         | `0`                           | Ganzzahliger Pitch-Shift, `-12..12`. |

### Musikgenerierung

Das gebündelte MiniMax-Plugin registriert Musikgenerierung über das gemeinsame
Tool `music_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Musikmodell: `minimax/music-2.6`
- OAuth-Musikmodell: `minimax-portal/music-2.6`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Steuerung per Prompt: `lyrics`, `instrumental`, `durationSeconds`
- Ausgabeformat: `mp3`
- Sitzungsbasierte Läufe werden über den gemeinsamen Task-/Status-Flow abgekoppelt, einschließlich `action: "status"`

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
Unter [Musikgenerierung](/de/tools/music-generation) finden Sie gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

### Videogenerierung

Das gebündelte MiniMax-Plugin registriert Videogenerierung über das gemeinsame
Tool `video_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3`
- OAuth-Videomodell: `minimax-portal/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video und Workflows mit einem einzelnen Referenzbild
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
Unter [Videogenerierung](/de/tools/video-generation) finden Sie gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Text-
Katalog:

| Provider-ID      | Standard-Bildmodell |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Deshalb kann automatisches Medien-Routing Bildverständnis von MiniMax verwenden, selbst
wenn der gebündelte Katalog des Text-Providers weiterhin nur textbasierte M2.7-Chat-Referenzen zeigt.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API des
MiniMax Coding Plan.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Env-Variable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierter Env-Alias: `MINIMAX_CODING_API_KEY`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn dieser bereits auf ein Coding-Plan-Token zeigt
- Wiederverwendung der Region: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann die Basis-URLs der MiniMax-Provider
- Die Suche bleibt auf der Provider-ID `minimax`; ein OAuth-CN-/Global-Setup kann die Region weiterhin indirekt über `models.providers.minimax-portal.baseUrl` steuern

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Unter [MiniMax Search](/de/tools/minimax-search) finden Sie die vollständige Konfiguration und Nutzung der Websuche.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen">
    | Option | Beschreibung |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Bevorzugt `https://api.minimax.io/anthropic` (Anthropic-kompatibel); `https://api.minimax.io/v1` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.api` | Bevorzugt `anthropic-messages`; `openai-completions` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.apiKey` | MiniMax-API-Key (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` definieren |
    | `agents.defaults.models` | Modelle aliasieren, die Sie in der Allowlist haben möchten |
    | `models.mode` | Behalten Sie `merge`, wenn Sie MiniMax zusätzlich zu den eingebauten Providern hinzufügen möchten |
  </Accordion>

  <Accordion title="Thinking-Standardeinstellungen">
    Bei `api: "anthropic-messages"` fügt OpenClaw `thinking: { type: "disabled" }` ein, sofern Thinking nicht bereits explizit in `params`/der Konfiguration gesetzt ist.

    Dadurch wird verhindert, dass der Streaming-Endpunkt von MiniMax `reasoning_content` in OpenAI-artigen Delta-Chunks ausgibt, was internes Reasoning in sichtbare Ausgabe durchsickern lassen würde.

  </Accordion>

  <Accordion title="Fast Mode">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Stream-Pfad zu `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten geeignet für:** Ihr stärkstes Modell der neuesten Generation als primäres Modell behalten und bei Bedarf auf MiniMax M2.7 zurückfallen. Das Beispiel unten verwendet Opus als konkretes primäres Modell; ersetzen Sie es durch Ihr bevorzugtes Primärmodell der neuesten Generation.

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

  <Accordion title="Nutzungsdetails des Coding Plan">
    - Nutzungs-API des Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (erfordert einen Coding-Plan-Key).
    - OpenClaw normalisiert die Nutzung des MiniMax Coding Plan auf dieselbe Anzeige „% verbleibend“, die auch bei anderen Providern verwendet wird. Die rohen Felder `usage_percent` / `usagePercent` von MiniMax stehen für verbleibende Quota, nicht für verbrauchte Quota, daher invertiert OpenClaw sie. Zählbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag des Chat-Modells, leitet bei Bedarf die Fensterbezeichnung aus `start_time` / `end_time` ab und nimmt den ausgewählten Modellnamen in die Plan-Bezeichnung auf, damit sich Fenster des Coding Plan leichter unterscheiden lassen.
    - Usage-Snapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Quota-Oberfläche und bevorzugen gespeichertes MiniMax OAuth, bevor auf Env-Variablen mit Coding-Plan-Keys zurückgegriffen wird.
  </Accordion>
</AccordionGroup>

## Hinweise

- Modellreferenzen folgen dem Authentifizierungspfad:
  - API-Key-Setup: `minimax/<model>`
  - OAuth-Setup: `minimax-portal/<model>`
- Standard-Chatmodell: `MiniMax-M2.7`
- Alternatives Chatmodell: `MiniMax-M2.7-highspeed`
- Onboarding und direkte API-Key-Einrichtung schreiben reine Textmodell-Definitionen für beide M2.7-Varianten
- Bildverständnis verwendet den pluginseitigen Medienprovider `MiniMax-VL-01`
- Aktualisieren Sie Preiswerte in `models.json`, wenn Sie exakte Kostenerfassung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu prüfen, und wechseln Sie dann mit `openclaw models set minimax/MiniMax-M2.7` oder `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Die Provider-Regeln finden Sie unter [Modell-Provider](/de/concepts/model-providers).
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Das bedeutet normalerweise, dass der **MiniMax-Provider nicht konfiguriert** ist (kein passender Providereintrag und kein MiniMax-Authentifizierungsprofil/Env-Key gefunden). Eine Korrektur für diese Erkennung ist in **2026.1.12** enthalten. Beheben Sie das Problem wie folgt:

    - Aktualisieren Sie auf **2026.1.12** (oder führen Sie den Quellcode aus `main` aus) und starten Sie dann das Gateway neu.
    - Führen Sie `openclaw configure` aus und wählen Sie eine **MiniMax**-Authentifizierungsoption, oder
    - fügen Sie den passenden Block `models.providers.minimax` oder `models.providers.minimax-portal` manuell hinzu, oder
    - setzen Sie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Authentifizierungsprofil, damit der passende Provider injiziert werden kann.

    Achten Sie darauf, dass die Modell-ID **case-sensitiv** ist:

    - API-Key-Pfad: `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - OAuth-Pfad: `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

    Prüfen Sie danach erneut mit:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Inhalte

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
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
    Konfiguration der Websuche über MiniMax Coding Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
