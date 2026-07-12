---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter zur Bilderzeugung verwenden
    - Sie möchten OpenRouter zur Musikgenerierung verwenden
    - Sie möchten OpenRouter für die Videogenerierung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf zahlreiche Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T15:44:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter leitet Anfragen an viele Modelle hinter einer API und einem Schlüssel weiter. Es ist
OpenAI-kompatibel, sodass OpenClaw über denselben
Transport im Stil von `openai-completions` mit ihm kommuniziert, der auch für andere Proxy-Provider verwendet wird.

## Erste Schritte

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth-Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw öffnet den browserbasierten Anmeldevorgang von OpenRouter (PKCE), tauscht den
        Code gegen einen OpenRouter-API-Schlüssel aus und speichert ihn im standardmäßigen
        OpenRouter-Authentifizierungsprofil. Auf Remote-Hosts bzw. Hosts ohne grafische Oberfläche gibt OpenClaw die
        Anmelde-URL aus und fordert Sie auf, nach der Anmeldung die Weiterleitungs-URL einzufügen.
      </Step>
      <Step title="(Optional) Zu einem bestimmten Modell wechseln">
        Beim Onboarding wird standardmäßig `openrouter/auto` verwendet. Wählen Sie später ein konkretes Modell aus:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API-Schlüssel">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie unter [openrouter.ai/keys](https://openrouter.ai/keys) einen API-Schlüssel.
      </Step>
      <Step title="Onboarding mit API-Schlüssel ausführen">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Zu einem bestimmten Modell wechseln">
        Beim Onboarding wird standardmäßig `openrouter/auto` verwendet. Wählen Sie später ein konkretes Modell aus:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfigurationsbeispiel

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Modellreferenzen

<Note>
Modellreferenzen folgen dem Muster `openrouter/<provider>/<model>`. Eine vollständige Liste der
verfügbaren Provider und Modelle finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
</Note>

Mitgelieferte Fallback-Modelle, die verwendet werden, wenn die Live-Katalogermittlung nicht verfügbar ist:

| Modellreferenz                    | Hinweise                             |
| --------------------------------- | ------------------------------------ |
| `openrouter/auto`                 | Automatisches Routing von OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 über MoonshotAI            |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 über MoonshotAI            |

Alle anderen Referenzen im Format `openrouter/<provider>/<model>`, einschließlich
`openrouter/openrouter/fusion` (siehe [Fusion-Router](#fusion-router)), werden
dynamisch anhand des Live-Modellkatalogs von OpenRouter aufgelöst.

## Bilderzeugung

OpenRouter kann als Backend für das Tool `image_generate` dienen. Legen Sie ein OpenRouter-Bildmodell
unter `agents.defaults.imageGenerationModel` fest:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw sendet Bildanfragen mit
`modalities: ["image", "text"]` an die Chat-Completions-Bild-API von OpenRouter. Gemini-Bildmodelle erhalten über
`image_config` von OpenRouter zusätzlich Hinweise zu `aspectRatio` und `resolution`; andere
Bildmodelle erhalten diese nicht. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für
langsamere Modelle; der aufrufbezogene Wert `timeoutMs` des Tools `image_generate` hat weiterhin Vorrang.

## Videoerzeugung

OpenRouter kann über seine asynchrone
`/videos`-API als Backend für das Tool `video_generate` dienen. Legen Sie ein OpenRouter-Videomodell unter
`agents.defaults.videoGenerationModel` fest:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw übermittelt Aufträge für Text-zu-Video und Bild-zu-Video, fragt regelmäßig die zurückgegebene
`polling_url` ab und lädt das fertige Video von den
`unsigned_urls` von OpenRouter oder dem Inhaltsendpunkt des Auftrags herunter. Referenzbilder werden standardmäßig als
Bilder für das erste bzw. letzte Einzelbild verwendet; mit `reference_image` gekennzeichnete Bilder werden stattdessen als
Eingabereferenzen gesendet. Der mitgelieferte Standardwert `google/veo-3.1-fast` unterstützt Laufzeiten von 4/6/8
Sekunden, Auflösungen von `720P`/`1080P` und Seitenverhältnisse von `16:9`/`9:16`.
Video-zu-Video wird nicht unterstützt: Die vorgelagerte API akzeptiert nur Text- und Bildreferenzen.

## Musikerzeugung

OpenRouter kann über die Audioausgabe von Chat-Completions als Backend für das Tool `music_generate`
dienen. Legen Sie ein OpenRouter-Audiomodell unter
`agents.defaults.musicGenerationModel` fest:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Der mitgelieferte OpenRouter-Musik-Provider verwendet standardmäßig `google/lyria-3-pro-preview`
und stellt außerdem `google/lyria-3-clip-preview` bereit. OpenClaw sendet `modalities:
["text", "audio"]`, streamt die Antwort, sammelt die Audiosegmente und speichert
das Ergebnis als generierte Medien für die Zustellung über den Kanal. Lyria-Modelle akzeptieren über den gemeinsamen Parameter
`music_generate image=...` ein Referenzbild.
Streaming-Audio, die Aufbewahrung des Transkripts und der abgeleitete SSE-Ereignisumschlag werden durch
`agents.defaults.mediaMaxMb` begrenzt (die standardmäßige Audiogrenze beträgt 16 MB).

## Text-zu-Sprache

OpenRouter kann über seinen OpenAI-kompatiblen Endpunkt
`/audio/speech` als TTS-Provider fungieren.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Wenn `messages.tts.providers.openrouter.apiKey` nicht angegeben ist, greift TTS zunächst auf
`models.providers.openrouter.apiKey` und anschließend auf `OPENROUTER_API_KEY` zurück.

## Sprache-zu-Text (eingehendes Audio)

OpenRouter kann eingehende Sprach-/Audioanhänge über den gemeinsamen Pfad
`tools.media.audio` mithilfe seines STT-Endpunkts (`/audio/transcriptions`) transkribieren.
Dies gilt für jedes Kanal-Plugin, das eingehende Sprach-/Audiodaten an die
Vorabprüfung für das Medienverständnis weiterleitet.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw sendet OpenRouter-STT-Anfragen als JSON mit Base64-Audiodaten unter
`input_audio` (OpenRouters STT-Vertrag), nicht als mehrteilige OpenAI-Formular-
Uploads.

## Fusion-Router

OpenRouter Fusion sendet eine OpenClaw-Modellreferenz parallel an mehrere OpenRouter-Modelle,
lässt OpenRouter deren Antworten bewerten und gibt über den normalen OpenRouter-Endpunkt
eine endgültige Antwort zurück. Der Slug des Upstream-Modells lautet
`openrouter/fusion`, daher enthält die OpenClaw-Modellreferenz sowohl das OpenClaw-
Provider-Präfix als auch den OpenRouter-Upstream-Namespace:

```bash
openclaw models set openrouter/openrouter/fusion
```

Konfigurieren Sie das Panel und das Bewertungsmodell von Fusion über `params.extraBody`
des Modells; diese Felder werden direkt an den Request-Body für Chat Completions von
OpenRouter weitergeleitet. Fusion funktioniert sowohl mit OAuth- als auch mit API-Schlüssel-Onboarding;
wenn Sie OAuth verwenden, lassen Sie die Zeile `env.OPENROUTER_API_KEY` unten weg.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` ist das parallele Panel; `model` innerhalb der Konfiguration des
Fusion-Plugins ist das Bewertungsmodell. Setzen Sie bei normalen Agenten-/Chat-Turns
`tool_choice` auf oberster Ebene nicht auf `"required"`, um Fusion erzwingen zu wollen:
OpenClaw-Turns können eigene Tool-Definitionen enthalten, und eine auf oberster Ebene
vorgeschriebene Tool-Auswahl könnte statt des Fusion-Routers eines davon auswählen.
Wenn diese Fusion-Plugin-Konfiguration vorhanden ist, fügt OpenClaw der System-Prompt
einen bereinigten Hinweis mit den konfigurierten Analysemodellen und dem Bewertungsmodell
hinzu, damit der Agent Fragen zu seinem eigenen Fusion-Panel beantworten kann. Andere
`extraBody`-Felder werden nicht in die Prompt kopiert.

Fusion ist absichtlich langsamer: OpenRouter verteilt die Prompt an mehrere
Analysemodelle und führt anschließend einen Bewertungs-/Syntheseschritt aus, sodass
die Latenz höher ist als bei einer direkten Anfrage an ein einzelnes Modell. Verwenden
Sie es für wohlüberlegte, hochwertige Antworten oder Eskalationspfade, nicht als
latenzempfindliche Standardeinstellung. Halten Sie das Panel klein und wählen Sie für
schnellere Antworten schnellere Analyse- und Bewertungsmodelle.

Testen Sie eine konfigurierte Referenz mit einem einmaligen lokalen Aufruf:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Antworten Sie exakt mit: FUSION_OK" \
  --json
```

## Authentifizierung und Header

OpenRouter verwendet ein Bearer-Token aus Ihrem API-Schlüssel. OpenRouter OAuth ist ein
PKCE-Anmeldeverfahren, das einen OpenRouter-API-Schlüssel ausstellt. Daher speichert OpenClaw
das Ergebnis im selben API-Schlüssel-Authentifizierungsprofil `openrouter:default`, das auch
bei der manuellen Einrichtung eines API-Schlüssels verwendet wird.

So melden Sie sich bei einer bestehenden Installation an oder rotieren den gespeicherten
Schlüssel, ohne das vollständige Onboarding erneut auszuführen:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Bei verifizierten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw
die dokumentierten Header zur App-Zuordnung von OpenRouter hinzu:

| Header                    | Wert                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL
umstellen, fügt OpenClaw diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker
**nicht** ein.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Antwort-Caching">
    Das Antwort-Caching von OpenRouter ist optional. Aktivieren Sie es pro Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw sendet `X-OpenRouter-Cache: true` und, sofern konfiguriert,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` erzwingt eine Aktualisierung
    für die aktuelle Anfrage und speichert die Ersatzantwort. Snake-Case-Aliasse
    (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`) werden ebenso akzeptiert wie `responseCacheTtl` /
    `response_cache_ttl` ohne das Suffix `Seconds`.

    Dies ist vom Provider-Prompt-Caching und von OpenRouters
    Anthropic-`cache_control`-Markern getrennt. Es gilt nur für verifizierte
    `openrouter.ai`-Routen, nicht für benutzerdefinierte Proxy-Basis-URLs.

  </Accordion>

  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    Anthropic-`cache_control`-Marker von OpenRouter bei, um die Wiederverwendung des
    Prompt-Caches für System-/Entwickler-Prompt-Blöcke zu verbessern.
  </Accordion>

  <Accordion title="Anthropic-Reasoning-Prefill">
    Auf verifizierten OpenRouter-Routen entfernen Anthropic-Modellreferenzen mit aktiviertem Reasoning
    abschließende Assistant-Prefill-Turns, bevor die Anfrage
    OpenRouter erreicht. Dies entspricht der Anthropic-Anforderung, dass Reasoning-Konversationen
    mit einem User-Turn enden.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen ordnet OpenClaw die ausgewählte Thinking-Stufe
    den Proxy-Reasoning-Payloads von OpenRouter zu. Bei `openrouter/auto` und nicht unterstützten
    Modellhinweisen wird diese Injektion übersprungen. Veraltete `openrouter/hunter-alpha`-Referenzen
    überspringen sie ebenfalls, da OpenRouter auf dieser eingestellten Route den endgültigen Antworttext
    in Reasoning-Feldern zurückgeben konnte.
  </Accordion>

  <Accordion title="DeepSeek-V4-Reasoning-Wiedergabe">
    Auf verifizierten OpenRouter-Routen ergänzen `openrouter/deepseek/deepseek-v4-flash` und
    `openrouter/deepseek/deepseek-v4-pro` fehlendes `reasoning_content` bei
    wiedergegebenen Assistant-Turns, sodass Thinking-/Tool-Konversationen die für DeepSeek
    V4 erforderliche Folgeform beibehalten. OpenClaw sendet die von OpenRouter unterstützten
    `reasoning.effort`-Werte für diese Routen: `xhigh`/`max` werden `xhigh` zugeordnet,
    jede andere nicht deaktivierte Stufe wird `high` zugeordnet.
  </Accordion>

  <Accordion title="Nur für OpenAI geltende Anfrageformung">
    OpenRouter wird über den Proxy-artigen, OpenAI-kompatiblen Pfad ausgeführt, sodass native,
    ausschließlich für OpenAI geltende Anfrageformungen wie `serviceTier`, Responses-`store`,
    OpenAI-Reasoning-Kompatibilitäts-Payloads und Prompt-Cache-Hinweise nicht weitergeleitet werden.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Referenzen verbleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Bereinigung von Gemini-Thought-Signaturen bei, aktiviert jedoch keine native
    Gemini-Wiedergabevalidierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    OpenRouter unterstützt ein `provider`-Anfrageobjekt für das Routing des zugrunde liegenden Providers.
    Konfigurieren Sie mit `models.providers.openrouter.params.provider` eine Standardrichtlinie für alle
    OpenRouter-Textmodell-Anfragen:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw leitet dieses Objekt als `provider`-Payload der Anfrage an OpenRouter weiter.
    Verwenden Sie die dokumentierten snake_case-Felder von OpenRouter, darunter `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` und `enforce_distillable_text`.

    Modellbezogene Parameter überschreiben das Provider-weite Routing-Objekt:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Dies gilt nur für Chat-Completions-Routen von OpenRouter. Direkte Routen von Anthropic,
    Google, OpenAI oder benutzerdefinierten Providern ignorieren die OpenRouter-Routing-Parameter.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
