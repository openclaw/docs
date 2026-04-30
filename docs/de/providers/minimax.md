---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T07:10:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaws MiniMax-Provider verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- Gebündelte Sprachsynthese über T2A v2
- Gebündeltes Bildverständnis über `MiniMax-VL-01`
- Gebündelte Musikerzeugung über `music-2.6`
- Gebündeltes `web_search` über die Such-API des MiniMax Coding Plan

Provider-Aufteilung:

| Provider-ID      | Authentifizierung | Funktionen                                                                                                      |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `minimax`        | API-Schlüssel     | Text, Bilderzeugung, Musikerzeugung, Videoerzeugung, Bildverständnis, Sprache, Websuche                         |
| `minimax-portal` | OAuth             | Text, Bilderzeugung, Musikerzeugung, Videoerzeugung, Bildverständnis, Sprache                                   |

## Integrierter Katalog

| Modell                   | Typ                 | Beschreibung                                            |
| ------------------------ | ------------------- | ------------------------------------------------------- |
| `MiniMax-M2.7`           | Chat (Reasoning)    | Standardmäßiges gehostetes Reasoning-Modell             |
| `MiniMax-M2.7-highspeed` | Chat (Reasoning)    | Schnellere M2.7-Reasoning-Stufe                         |
| `MiniMax-VL-01`          | Vision              | Modell für Bildverständnis                              |
| `image-01`               | Bilderzeugung       | Text-zu-Bild- und Bild-zu-Bild-Bearbeitung              |
| `music-2.6`              | Musikerzeugung      | Standard-Musikmodell                                    |
| `music-2.5`              | Musikerzeugung      | Vorherige Musikerzeugungsstufe                          |
| `music-2.0`              | Musikerzeugung      | Legacy-Musikerzeugungsstufe                             |
| `MiniMax-Hailuo-2.3`     | Videoerzeugung      | Text-zu-Video- und Bildreferenz-Flows                   |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode aus und folgen Sie den Einrichtungsschritten.

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
    OAuth-Einrichtungen verwenden die Provider-ID `minimax-portal`. Modellreferenzen folgen dem Format `minimax-portal/MiniMax-M2.7`.
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
    Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking standardmäßig, es sei denn, Sie setzen `thinking` ausdrücklich selbst. Der Streaming-Endpunkt von MiniMax gibt `reasoning_content` in Delta-Chunks im OpenAI-Stil statt nativer Anthropic-Thinking-Blöcke aus. Dadurch kann internes Reasoning in der sichtbaren Ausgabe erscheinen, wenn es implizit aktiviert bleibt.
    </Warning>

    <Note>
    Einrichtungen mit API-Schlüssel verwenden die Provider-ID `minimax`. Modellreferenzen folgen dem Format `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax ohne JSON-Bearbeitung einzurichten:

<Steps>
  <Step title="Assistent starten">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth auswählen">
    Wählen Sie **Model/auth** im Menü aus.
  </Step>
  <Step title="Eine MiniMax-Auth-Option wählen">
    Wählen Sie eine der verfügbaren MiniMax-Optionen aus:

    | Auth-Auswahl | Beschreibung |
    | --- | --- |
    | `minimax-global-oauth` | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China OAuth (Coding Plan) |
    | `minimax-global-api` | Internationaler API-Schlüssel |
    | `minimax-cn-api` | China-API-Schlüssel |

  </Step>
  <Step title="Ihr Standardmodell auswählen">
    Wählen Sie bei Aufforderung Ihr Standardmodell aus.
  </Step>
</Steps>

## Funktionen

### Bilderzeugung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate`. Es unterstützt:

- **Text-zu-Bild-Erzeugung** mit Steuerung des Seitenverhältnisses
- **Bild-zu-Bild-Bearbeitung** (Subjektreferenz) mit Steuerung des Seitenverhältnisses
- Bis zu **9 Ausgabebilder** pro Anfrage
- Bis zu **1 Referenzbild** pro Bearbeitungsanfrage
- Unterstützte Seitenverhältnisse: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Um MiniMax für die Bilderzeugung zu verwenden, legen Sie es als Provider für die Bilderzeugung fest:

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
Modell `image-01`. Einrichtungen mit API-Schlüssel verwenden `MINIMAX_API_KEY`; OAuth-Einrichtungen können stattdessen
den gebündelten Auth-Pfad `minimax-portal` verwenden.

Die Bilderzeugung verwendet immer den dedizierten Bild-Endpunkt von MiniMax
(`/v1/image_generation`) und ignoriert `models.providers.minimax.baseUrl`,
da dieses Feld die Chat-/Anthropic-kompatible Basis-URL konfiguriert. Setzen Sie
`MINIMAX_API_HOST=https://api.minimaxi.com`, um die Bilderzeugung
über den CN-Endpunkt zu leiten; der globale Standardendpunkt ist
`https://api.minimax.io`.

Wenn das Onboarding oder die Einrichtung per API-Schlüssel explizite `models.providers.minimax`
-Einträge schreibt, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` als reine Text-Chatmodelle. Bildverständnis wird
separat über den Plugin-eigenen Medien-Provider `MiniMax-VL-01` bereitgestellt.

<Note>
Siehe [Bilderzeugung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Text-to-Speech

Das gebündelte `minimax`-Plugin registriert MiniMax T2A v2 als Sprach-Provider für
`messages.tts`.

- Standard-TTS-Modell: `speech-2.8-hd`
- Standardstimme: `English_expressive_narrator`
- Zu den unterstützten gebündelten Modell-IDs gehören `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` und `speech-01-turbo`.
- Die Auth-Auflösung ist `messages.tts.providers.minimax.apiKey`, dann
  `minimax-portal` OAuth-/Token-Auth-Profile, dann Token-Plan-Umgebungsschlüssel
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), dann `MINIMAX_API_KEY`.
- Wenn kein TTS-Host konfiguriert ist, verwendet OpenClaw den konfigurierten
  OAuth-Host `minimax-portal` erneut und entfernt Anthropic-kompatible Pfadsuffixe
  wie `/anthropic`.
- Normale Audioanhänge bleiben MP3.
- Ziele für Sprachnachrichten wie Feishu und Telegram werden von MiniMax
  MP3 mit `ffmpeg` in 48-kHz-Opus transkodiert, da die Feishu/Lark-Datei-API nur
  `file_type: "opus"` für native Audionachrichten akzeptiert.
- MiniMax T2A akzeptiert Dezimalwerte für `speed` und `vol`, aber `pitch` wird als
  Ganzzahl gesendet; OpenClaw schneidet Dezimalwerte für `pitch` vor der API-Anfrage ab.

| Einstellung                              | Umgebungsvariable      | Standard                      | Beschreibung                    |
| ---------------------------------------- | ---------------------- | ----------------------------- | ------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API-Host.           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS-Modell-ID.                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Für Sprachausgabe verwendete Voice-ID. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Wiedergabegeschwindigkeit, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Lautstärke, `(0, 10]`.          |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Ganzzahlige Tonhöhenverschiebung, `-12..12`. |

### Musikerzeugung

Das gebündelte MiniMax-Plugin registriert Musikerzeugung über das gemeinsame
Tool `music_generate` für sowohl `minimax` als auch `minimax-portal`.

- Standard-Musikmodell: `minimax/music-2.6`
- OAuth-Musikmodell: `minimax-portal/music-2.6`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Prompt-Steuerungen: `lyrics`, `instrumental`, `durationSeconds`
- Ausgabeformat: `mp3`
- Sitzungsbasierte Läufe lösen sich über den gemeinsamen Aufgaben-/Statusfluss ab, einschließlich `action: "status"`

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
Siehe [Musikerzeugung](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Videoerzeugung

Das gebündelte MiniMax-Plugin registriert Videoerzeugung über das gemeinsame
Tool `video_generate` für sowohl `minimax` als auch `minimax-portal`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3`
- OAuth-Videomodell: `minimax-portal/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video- und Einzelbild-Referenzflüsse
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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Textkatalog:

| Provider-ID      | Standard-Bildmodell |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Deshalb kann automatisches Medien-Routing MiniMax-Bildverständnis verwenden, auch
wenn der gebündelte Text-Provider-Katalog noch reine Text-M2.7-Chat-Refs anzeigt.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API des MiniMax Coding Plan.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierter Umgebungsalias: `MINIMAX_CODING_API_KEY`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn sie bereits auf ein Coding-Plan-Token verweist
- Regionswiederverwendung: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann MiniMax-Provider-Basis-URLs
- Die Suche bleibt auf der Provider-ID `minimax`; die globale/OAuth-CN-Einrichtung kann die Region weiterhin indirekt über `models.providers.minimax-portal.baseUrl` steuern

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Siehe [MiniMax-Suche](/de/tools/minimax-search) für die vollständige Websuchenkonfiguration und Nutzung.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen">
    | Option | Beschreibung |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` bevorzugen (Anthropic-kompatibel); `https://api.minimax.io/v1` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.api` | `anthropic-messages` bevorzugen; `openai-completions` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.apiKey` | MiniMax-API-Schlüssel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` definieren |
    | `agents.defaults.models` | Modelle aliasieren, die Sie in der Zulassungsliste haben möchten |
    | `models.mode` | `merge` beibehalten, wenn Sie MiniMax neben integrierten Modellen hinzufügen möchten |
  </Accordion>

  <Accordion title="Thinking-Standardwerte">
    Bei `api: "anthropic-messages"` fügt OpenClaw `thinking: { type: "disabled" }` ein, sofern Thinking nicht bereits explizit in Parametern/Konfiguration festgelegt ist.

    Dadurch wird verhindert, dass MiniMaxs Streaming-Endpunkt `reasoning_content` in OpenAI-artigen Delta-Chunks ausgibt, wodurch internes Reasoning in sichtbare Ausgaben gelangen würde.

  </Accordion>

  <Accordion title="Schneller Modus">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Stream-Pfad in `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten für:** Ihr stärkstes Modell der neuesten Generation als primäres Modell beibehalten und bei Bedarf auf MiniMax M2.7 ausweichen. Das folgende Beispiel verwendet Opus als konkretes primäres Modell; tauschen Sie es gegen Ihr bevorzugtes primäres Modell der neuesten Generation aus.

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
    - Coding-Plan-Nutzungs-API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - OpenClaw normalisiert die MiniMax-Coding-Plan-Nutzung auf dieselbe Anzeige für `% left`, die auch andere Provider verwenden. Die rohen Felder `usage_percent` / `usagePercent` von MiniMax sind verbleibende Quote, nicht verbrauchte Quote, daher invertiert OpenClaw sie. Zählbasierte Felder haben Vorrang, wenn vorhanden.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Chatmodell-Eintrag, leitet die Fensterbeschriftung bei Bedarf aus `start_time` / `end_time` ab und nimmt den ausgewählten Modellnamen in die Plan-Beschriftung auf, damit Coding-Plan-Fenster leichter zu unterscheiden sind.
    - Nutzungs-Snapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Quotenoberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor sie auf Umgebungsvariablen für den Coding-Plan-Schlüssel zurückfallen.

  </Accordion>
</AccordionGroup>

## Hinweise

- Modell-Refs folgen dem Authentifizierungspfad:
  - API-Schlüssel-Einrichtung: `minimax/<model>`
  - OAuth-Einrichtung: `minimax-portal/<model>`
- Standard-Chatmodell: `MiniMax-M2.7`
- Alternatives Chatmodell: `MiniMax-M2.7-highspeed`
- Onboarding und direkte API-Schlüssel-Einrichtung schreiben reine Textmodelldefinitionen für beide M2.7-Varianten
- Bildverständnis verwendet den Plugin-eigenen Medien-Provider `MiniMax-VL-01`
- Aktualisieren Sie die Preiswerte in `models.json`, wenn Sie eine genaue Kostenerfassung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit `openclaw models set minimax/MiniMax-M2.7` oder `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Siehe [Modell-Provider](/de/concepts/model-providers) für Provider-Regeln.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unbekanntes Modell: minimax/MiniMax-M2.7"'>
    Dies bedeutet in der Regel, dass der **MiniMax-Provider nicht konfiguriert ist** (kein passender Provider-Eintrag und kein MiniMax-Authentifizierungsprofil/Umgebungsschlüssel gefunden). Eine Behebung für diese Erkennung ist in **2026.1.12** enthalten. Beheben Sie dies wie folgt:

    - Führen Sie ein Upgrade auf **2026.1.12** durch (oder führen Sie aus dem Quellcode von `main` aus) und starten Sie anschließend das Gateway neu.
    - Führen Sie `openclaw configure` aus und wählen Sie eine **MiniMax**-Authentifizierungsoption aus, oder
    - fügen Sie den passenden Block `models.providers.minimax` oder `models.providers.minimax-portal` manuell hinzu, oder
    - setzen Sie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Authentifizierungsprofil, damit der passende Provider injiziert werden kann.

    Stellen Sie sicher, dass bei der Modell-ID **Groß-/Kleinschreibung beachtet** wird:

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
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bildtool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Musiktool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Videotool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="MiniMax-Suche" href="/de/tools/minimax-search" icon="magnifying-glass">
    Websuchenkonfiguration über MiniMax Coding Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
