---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw nutzen
    - Sie benötigen eine Anleitung zur MiniMax-Einrichtung
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T06:43:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax-Provider verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- Gebündelte Sprachsynthese über T2A v2
- Gebündeltes Bildverstehen über `MiniMax-VL-01`
- Gebündelte Musikgenerierung über `music-2.6`
- Gebündelte `web_search` über die MiniMax Token Plan Search API

Provider-Aufteilung:

| Provider-ID      | Authentifizierung | Funktionen                                                                                              |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `minimax`        | API-Schlüssel     | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverstehen, Sprache, Websuche             |
| `minimax-portal` | OAuth             | Text, Bildgenerierung, Musikgenerierung, Videogenerierung, Bildverstehen, Sprache                       |

## Integrierter Katalog

| Modell                   | Typ              | Beschreibung                                  |
| ------------------------ | ---------------- | --------------------------------------------- |
| `MiniMax-M2.7`           | Chat (Reasoning) | Standardmäßig gehostetes Reasoning-Modell     |
| `MiniMax-M2.7-highspeed` | Chat (Reasoning) | Schnellere M2.7-Reasoning-Stufe               |
| `MiniMax-VL-01`          | Vision           | Modell für Bildverstehen                      |
| `image-01`               | Bildgenerierung  | Text-zu-Bild- und Bild-zu-Bild-Bearbeitung    |
| `music-2.6`              | Musikgenerierung | Standard-Musikmodell                          |
| `music-2.5`              | Musikgenerierung | Vorherige Stufe für Musikgenerierung          |
| `music-2.0`              | Musikgenerierung | Legacy-Stufe für Musikgenerierung             |
| `MiniMax-Hailuo-2.3`     | Videogenerierung | Text-zu-Video- und Bildreferenz-Abläufe       |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Am besten für:** schnelle Einrichtung mit MiniMax Coding Plan über OAuth, kein API-Schlüssel erforderlich.

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
    OAuth-Einrichtungen verwenden die Provider-ID `minimax-portal`. Modellreferenzen folgen der Form `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Am besten für:** gehostetes MiniMax mit Anthropic-kompatibler API.

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
    Im Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw das MiniMax-Denken standardmäßig, sofern Sie `thinking` nicht selbst explizit festlegen. Der Streaming-Endpunkt von MiniMax gibt `reasoning_content` in Delta-Chunks im OpenAI-Stil aus, statt nativer Anthropic-Denkblöcke. Dadurch kann internes Reasoning in der sichtbaren Ausgabe erscheinen, wenn es implizit aktiviert bleibt.
    </Warning>

    <Note>
    API-Schlüssel-Einrichtungen verwenden die Provider-ID `minimax`. Modellreferenzen folgen der Form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax ohne Bearbeitung von JSON einzurichten:

<Steps>
  <Step title="Assistenten starten">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Modell/Auth auswählen">
    Wählen Sie **Modell/Auth** aus dem Menü.
  </Step>
  <Step title="MiniMax-Auth-Option auswählen">
    Wählen Sie eine der verfügbaren MiniMax-Optionen aus:

    | Auth-Auswahl | Beschreibung |
    | --- | --- |
    | `minimax-global-oauth` | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China-OAuth (Coding Plan) |
    | `minimax-global-api` | Internationaler API-Schlüssel |
    | `minimax-cn-api` | China-API-Schlüssel |

  </Step>
  <Step title="Standardmodell auswählen">
    Wählen Sie bei Aufforderung Ihr Standardmodell aus.
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

Das Plugin verwendet denselben `MINIMAX_API_KEY` oder dieselbe OAuth-Authentifizierung wie die Textmodelle. Es ist keine zusätzliche Konfiguration erforderlich, wenn MiniMax bereits eingerichtet ist.

Sowohl `minimax` als auch `minimax-portal` registrieren `image_generate` mit demselben
Modell `image-01`. Setups mit API-Schlüssel verwenden `MINIMAX_API_KEY`; OAuth-Setups können
stattdessen den gebündelten Auth-Pfad `minimax-portal` verwenden.

Die Bildgenerierung verwendet immer den dedizierten Bild-Endpunkt von MiniMax
(`/v1/image_generation`) und ignoriert `models.providers.minimax.baseUrl`,
da dieses Feld die Chat-/Anthropic-kompatible Basis-URL konfiguriert. Setzen Sie
`MINIMAX_API_HOST=https://api.minimaxi.com`, um die Bildgenerierung
über den CN-Endpunkt zu leiten; der globale Standardendpunkt ist
`https://api.minimax.io`.

Wenn Onboarding oder die Einrichtung per API-Schlüssel explizite Einträge unter `models.providers.minimax`
schreibt, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` als reine Text-Chat-Modelle. Bildverständnis wird
separat über den Plugin-eigenen Medien-Provider `MiniMax-VL-01` bereitgestellt.

<Note>
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Text-zu-Sprache

Das gebündelte Plugin `minimax` registriert MiniMax T2A v2 als Sprach-Provider für
`messages.tts`.

- Standard-TTS-Modell: `speech-2.8-hd`
- Standardstimme: `English_expressive_narrator`
- Unterstützte gebündelte Modell-IDs sind unter anderem `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` und `speech-01-turbo`.
- Die Auth-Auflösung erfolgt über `messages.tts.providers.minimax.apiKey`, dann
  OAuth-/Token-Auth-Profile von `minimax-portal`, dann Umgebungsschlüssel des
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) und dann `MINIMAX_API_KEY`.
- Wenn kein TTS-Host konfiguriert ist, verwendet OpenClaw den konfigurierten
  OAuth-Host von `minimax-portal` wieder und entfernt Anthropic-kompatible Pfadsuffixe
  wie `/anthropic`.
- Normale Audioanhänge bleiben MP3.
- Sprachnotiz-Ziele wie Feishu und Telegram werden mit `ffmpeg` von MiniMax
  MP3 in 48-kHz-Opus transkodiert, weil die Feishu/Lark-Datei-API für native
  Audionachrichten nur `file_type: "opus"` akzeptiert.
- MiniMax T2A akzeptiert gebrochene Werte für `speed` und `vol`, aber `pitch` wird als
  Ganzzahl gesendet; OpenClaw kürzt gebrochene `pitch`-Werte vor der API-Anfrage.

| Einstellung                              | Env-Var                | Standard                      | Beschreibung                    |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API-Host.           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS-Modell-ID.                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Für Sprachausgabe verwendete Stimmen-ID. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Wiedergabegeschwindigkeit, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Lautstärke, `(0, 10]`.          |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Ganzzahlige Tonhöhenverschiebung, `-12..12`. |

### Musikgenerierung

Das gebündelte MiniMax-Plugin registriert die Musikgenerierung über das gemeinsame
Tool `music_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Musikmodell: `minimax/music-2.6`
- OAuth-Musikmodell: `minimax-portal/music-2.6`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Prompt-Steuerungen: `lyrics`, `instrumental`, `durationSeconds`
- Ausgabeformat: `mp3`
- Sitzungsbasierte Läufe werden über den gemeinsamen Aufgaben-/Statusablauf abgekoppelt, einschließlich `action: "status"`

Um MiniMax als Standard-Provider für Musik zu verwenden:

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

Das gebündelte MiniMax-Plugin registriert die Videogenerierung über das gemeinsame
Tool `video_generate` sowohl für `minimax` als auch für `minimax-portal`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3`
- OAuth-Videomodell: `minimax-portal/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video und Abläufe mit Einzelbildreferenz
- Unterstützt `aspectRatio` und `resolution`

Um MiniMax als Standard-Provider für Video zu verwenden:

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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsam genutzte Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Textkatalog:

| Provider-ID      | Standard-Bildmodell |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Deshalb kann das automatische Medien-Routing das MiniMax-Bildverständnis auch dann nutzen, wenn der gebündelte Text-Provider-Katalog weiterhin reine Text-Chat-Referenzen für M2.7 anzeigt.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API des MiniMax Token Plan.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Abfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierte Umgebungsaliasse: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn sie bereits auf eine Token-Plan-Anmeldeinformation verweist
- Wiederverwendung der Region: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann MiniMax-Provider-Basis-URLs
- Die Suche bleibt bei der Provider-ID `minimax`; die OAuth-CN/globale Einrichtung kann die Region indirekt über `models.providers.minimax-portal.baseUrl` steuern und Bearer-Auth über `MINIMAX_OAUTH_TOKEN` bereitstellen

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Siehe [MiniMax-Suche](/de/tools/minimax-search) für die vollständige Websuchkonfiguration und Nutzung.
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
    | `agents.defaults.models` | Alias-Modelle, die Sie in der Zulassungsliste haben möchten |
    | `models.mode` | Behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu den integrierten Modellen hinzufügen möchten |
  </Accordion>

  <Accordion title="Thinking-Standards">
    Bei `api: "anthropic-messages"` injiziert OpenClaw `thinking: { type: "disabled" }`, sofern Thinking nicht bereits explizit in Parametern/Konfiguration gesetzt ist.

    Dadurch wird verhindert, dass der Streaming-Endpunkt von MiniMax `reasoning_content` in Delta-Chunks im OpenAI-Stil ausgibt, wodurch internes Reasoning in sichtbare Ausgaben gelangen würde.

  </Accordion>

  <Accordion title="Schneller Modus">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Stream-Pfad in `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten geeignet für:** Behalten Sie Ihr stärkstes Modell der neuesten Generation als primäres Modell bei und wechseln Sie bei einem Ausfall zu MiniMax M2.7. Das folgende Beispiel verwendet Opus als konkretes primäres Modell; ersetzen Sie es durch Ihr bevorzugtes primäres Modell der neuesten Generation.

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

  <Accordion title="Details zur Coding-Plan-Nutzung">
    - Coding-Plan-Nutzungs-API: `https://api.minimaxi.com/v1/token_plan/remains` oder `https://api.minimax.io/v1/token_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - Das Nutzungs-Polling leitet den Host aus `models.providers.minimax-portal.baseUrl` oder `models.providers.minimax.baseUrl` ab, wenn konfiguriert, sodass globale Setups mit `https://api.minimax.io/anthropic` `api.minimax.io` abfragen. Fehlende oder fehlerhafte Basis-URLs behalten aus Kompatibilitätsgründen den CN-Fallback bei.
    - OpenClaw normalisiert die MiniMax-Coding-Plan-Nutzung auf dieselbe Anzeige für `% left`, die auch andere Provider verwenden. Die rohen Felder `usage_percent` / `usagePercent` von MiniMax geben das verbleibende Kontingent an, nicht das verbrauchte Kontingent, daher invertiert OpenClaw sie. Anzahlbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Chat-Modell-Eintrag, leitet bei Bedarf die Fensterbeschriftung aus `start_time` / `end_time` ab und nimmt den ausgewählten Modellnamen in die Planbeschriftung auf, damit Coding-Plan-Fenster leichter zu unterscheiden sind.
    - Nutzungs-Snapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingentoberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor auf Coding-Plan-Schlüssel aus Umgebungsvariablen zurückgegriffen wird.

  </Accordion>
</AccordionGroup>

## Hinweise

- Modellreferenzen folgen dem Authentifizierungspfad:
  - API-Schlüssel-Setup: `minimax/<model>`
  - OAuth-Setup: `minimax-portal/<model>`
- Standard-Chat-Modell: `MiniMax-M2.7`
- Alternatives Chat-Modell: `MiniMax-M2.7-highspeed`
- Onboarding und direktes API-Schlüssel-Setup schreiben reine Textmodelldefinitionen für beide M2.7-Varianten
- Bildverständnis verwendet den Plugin-eigenen Medien-Provider `MiniMax-VL-01`
- Aktualisieren Sie die Preiswerte in `models.json`, wenn Sie eine exakte Kostenverfolgung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit `openclaw models set minimax/MiniMax-M2.7` oder `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Empfehlungslink für den MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Siehe [Modell-Provider](/de/concepts/model-providers) für Provider-Regeln.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unbekanntes Modell: minimax/MiniMax-M2.7"'>
    Das bedeutet normalerweise, dass der **MiniMax-Provider nicht konfiguriert ist** (kein passender Provider-Eintrag und kein MiniMax-Auth-Profil/Umgebungsschlüssel gefunden). Eine Korrektur für diese Erkennung ist in **2026.1.12** enthalten. Beheben Sie dies durch:

    - Upgrade auf **2026.1.12** (oder Ausführung aus dem Quellcode von `main`) und anschließenden Neustart des Gateway.
    - Ausführen von `openclaw configure` und Auswählen einer **MiniMax**-Authentifizierungsoption, oder
    - Manuelles Hinzufügen des passenden Blocks `models.providers.minimax` oder `models.providers.minimax-portal`, oder
    - Setzen von `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder eines MiniMax-Auth-Profils, damit der passende Provider injiziert werden kann.

    Stellen Sie sicher, dass bei der Modell-ID die **Groß- und Kleinschreibung beachtet wird**:

    - API-Schlüssel-Pfad: `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - OAuth-Pfad: `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

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
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bildwerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter des Musikwerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Videowerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="MiniMax-Suche" href="/de/tools/minimax-search" icon="magnifying-glass">
    Websuche-Konfiguration über den MiniMax Token Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
