---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bilderzeugung verwenden
    - Sie möchten OpenRouter zur Musikgenerierung verwenden
    - Sie möchten OpenRouter für die Videogenerierung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf zahlreiche Modelle zuzugreifen.
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T02:05:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter leitet Anfragen über eine API und einen Schlüssel an zahlreiche Modelle weiter. Es ist OpenAI-kompatibel, daher kommuniziert OpenClaw damit über denselben Transport im Stil von `openai-completions`, der auch für andere Proxy-Provider verwendet wird.

## Erste Schritte

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth-Einrichtung ausführen">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw öffnet den browsergestützten Anmeldeablauf von OpenRouter (PKCE), tauscht den Code gegen einen OpenRouter-API-Schlüssel aus und speichert ihn im standardmäßigen OpenRouter-Authentifizierungsprofil. Auf entfernten oder monitorlosen Hosts gibt OpenClaw die Anmelde-URL aus und fordert Sie nach der Anmeldung auf, die Weiterleitungs-URL einzufügen.
      </Step>
      <Step title="(Optional) Zu einem bestimmten Modell wechseln">
        Bei der Einrichtung wird standardmäßig `openrouter/auto` verwendet. Sie können später ein konkretes Modell auswählen:

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
      <Step title="Einrichtung mit API-Schlüssel ausführen">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Zu einem bestimmten Modell wechseln">
        Bei der Einrichtung wird standardmäßig `openrouter/auto` verwendet. Sie können später ein konkretes Modell auswählen:

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
Modellreferenzen folgen dem Muster `openrouter/<provider>/<model>`. Eine vollständige Liste der verfügbaren Provider und Modelle finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
</Note>

Mitgelieferte Ausweichmodelle, die verwendet werden, wenn die Live-Katalogerkennung nicht verfügbar ist:

| Modellreferenz                    | Hinweise                              |
| --------------------------------- | ------------------------------------- |
| `openrouter/auto`                 | Automatische Weiterleitung durch OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 über MoonshotAI             |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 über MoonshotAI             |

Alle anderen Referenzen im Format `openrouter/<provider>/<model>`, einschließlich `openrouter/openrouter/fusion` (siehe [Fusion-Router](#fusion-router)), werden dynamisch anhand des Live-Modellkatalogs von OpenRouter aufgelöst.

## Bilderzeugung

OpenRouter kann als Backend für das Werkzeug `image_generate` dienen. Legen Sie unter `agents.defaults.imageGenerationModel` ein OpenRouter-Bildmodell fest:

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

OpenClaw sendet Bildanfragen mit `modalities: ["image", "text"]` an die Bild-API für Chat-Vervollständigungen von OpenRouter. Gemini-Bildmodelle erhalten über `image_config` von OpenRouter zusätzlich Hinweise für `aspectRatio` und `resolution`; andere Bildmodelle erhalten diese nicht. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere Modelle; der aufrufbezogene Wert `timeoutMs` des Werkzeugs `image_generate` hat weiterhin Vorrang.

## Videoerzeugung

OpenRouter kann über seine asynchrone `/videos`-API als Backend für das Werkzeug `video_generate` dienen. Legen Sie unter `agents.defaults.videoGenerationModel` ein OpenRouter-Videomodell fest:

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

OpenClaw übermittelt Aufträge zur Text-zu-Video- und Bild-zu-Video-Erzeugung, fragt die zurückgegebene `polling_url` regelmäßig ab und lädt das fertige Video über die `unsigned_urls` von OpenRouter oder den Inhaltsendpunkt des Auftrags herunter. Referenzbilder werden standardmäßig als Bilder für das erste beziehungsweise letzte Einzelbild verwendet; mit `reference_image` gekennzeichnete Bilder werden stattdessen als Eingabereferenzen gesendet. Der mitgelieferte Standard `google/veo-3.1-fast` unterstützt eine Dauer von 4, 6 oder 8 Sekunden, die Auflösungen `720P` und `1080P` sowie die Seitenverhältnisse `16:9` und `9:16`. Video-zu-Video wird nicht unterstützt: Die vorgelagerte API akzeptiert nur Text- und Bildreferenzen.

## Musikerzeugung

OpenRouter kann über die Audioausgabe von Chat-Vervollständigungen als Backend für das Werkzeug `music_generate` dienen. Legen Sie unter `agents.defaults.musicGenerationModel` ein OpenRouter-Audiomodell fest:

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

Der mitgelieferte OpenRouter-Musik-Provider verwendet standardmäßig `google/lyria-3-pro-preview` und stellt außerdem `google/lyria-3-clip-preview` bereit. OpenClaw sendet `modalities: ["text", "audio"]`, streamt die Antwort, sammelt die Audiosegmente und speichert das Ergebnis als erzeugtes Medium für die Auslieferung über den Kanal. Lyria-Modelle akzeptieren über den gemeinsamen Parameter `music_generate image=...` ein Referenzbild. Streaming-Audio, die Aufbewahrung des Transkripts und die daraus abgeleitete SSE-Ereignishülle werden durch `agents.defaults.mediaMaxMb` begrenzt (die standardmäßige Audiogrenze beträgt 16 MB).

## Text-zu-Sprache

OpenRouter kann über seinen OpenAI-kompatiblen Endpunkt `/audio/speech` als TTS-Provider dienen.

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

Wenn `messages.tts.providers.openrouter.apiKey` nicht angegeben ist, greift TTS zunächst auf `models.providers.openrouter.apiKey` und anschließend auf `OPENROUTER_API_KEY` zurück.

## Sprache-zu-Text (eingehendes Audio)

OpenRouter kann eingehende Sprach- und Audioanhänge über den gemeinsamen Pfad `tools.media.audio` mithilfe seines STT-Endpunkts (`/audio/transcriptions`) transkribieren. Dies gilt für jedes Kanal-Plugin, das eingehende Sprach- oder Audiodaten an die Vorprüfung der Medienerkennung weiterleitet.

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

OpenClaw sendet STT-Anfragen an OpenRouter als JSON mit Base64-kodierten Audiodaten unter `input_audio` (gemäß dem STT-Vertrag von OpenRouter), nicht als mehrteilige OpenAI-Formularuploads.

## Fusion-Router

OpenRouter Fusion sendet eine OpenClaw-Modellreferenz parallel an mehrere OpenRouter-Modelle, lässt OpenRouter deren Antworten bewerten und gibt über den normalen OpenRouter-Endpunkt eine endgültige Antwort zurück. Der Modellbezeichner der vorgelagerten API lautet `openrouter/fusion`, weshalb die OpenClaw-Modellreferenz sowohl das OpenClaw-Providerpräfix als auch den vorgelagerten OpenRouter-Namensraum enthält:

```bash
openclaw models set openrouter/openrouter/fusion
```

Konfigurieren Sie das Panel und das Bewertungsmodell von Fusion über `params.extraBody` des Modells; diese Felder werden direkt an den Anfragetext für OpenRouter-Chat-Vervollständigungen weitergeleitet. Fusion funktioniert sowohl mit der OAuth- als auch mit der API-Schlüssel-Einrichtung. Wenn Sie OAuth verwenden, lassen Sie die nachfolgende Zeile `env.OPENROUTER_API_KEY` weg.

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

`analysis_models` ist das parallele Panel; `model` innerhalb der Konfiguration des Fusion-Plugins ist das Bewertungsmodell. Setzen Sie bei normalen Agenten- oder Chat-Durchläufen nicht das übergeordnete `tool_choice` auf `"required"`, um Fusion zu erzwingen: OpenClaw-Durchläufe können eigene Werkzeugdefinitionen enthalten, und eine übergeordnete verpflichtende Werkzeugauswahl kann statt des Fusion-Routers eines dieser Werkzeuge auswählen. Wenn diese Fusion-Plugin-Konfiguration vorhanden ist, ergänzt OpenClaw den System-Prompt um einen bereinigten Hinweis, der die konfigurierten Analysemodelle und das Bewertungsmodell aufführt. Dadurch kann der Agent Fragen zu seinem eigenen Fusion-Panel beantworten. Andere `extraBody`-Felder werden nicht in den Prompt kopiert.

Fusion ist absichtlich langsamer: OpenRouter verteilt den Prompt an mehrere Analysemodelle und führt anschließend einen Bewertungs- und Syntheseschritt aus. Daher ist die Latenz höher als bei einer direkten Anfrage an ein einzelnes Modell. Verwenden Sie Fusion für sorgfältig erarbeitete, hochwertige Antworten oder Eskalationspfade, nicht als latenzempfindliche Standardeinstellung. Halten Sie das Panel klein und wählen Sie schnellere Analyse- und Bewertungsmodelle, um kürzere Antwortzeiten zu erzielen.

Testen Sie eine konfigurierte Referenz mit einem einmaligen lokalen Aufruf:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authentifizierung und Header

OpenRouter verwendet ein Bearer-Token aus Ihrem API-Schlüssel. OpenRouter OAuth ist ein PKCE-Anmeldeablauf, der einen OpenRouter-API-Schlüssel ausstellt. Daher speichert OpenClaw das Ergebnis im selben API-Schlüssel-Authentifizierungsprofil `openrouter:default`, das auch bei der manuellen Einrichtung eines API-Schlüssels verwendet wird.

Um sich bei einer vorhandenen Installation anzumelden oder den gespeicherten Schlüssel zu rotieren, ohne die vollständige Einrichtung erneut auszuführen:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Bei verifizierten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw die dokumentierten Header zur App-Zuordnung von OpenRouter hinzu:

| Header                    | Wert                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL umstellen, fügt OpenClaw diese OpenRouter-spezifischen Header oder Anthropic-Cache-Markierungen **nicht** ein.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Antwort-Caching">
    Das Caching von OpenRouter-Antworten ist optional und muss ausdrücklich aktiviert werden. Aktivieren Sie es für jedes Modell einzeln:

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

    OpenClaw sendet `X-OpenRouter-Cache: true` und, sofern konfiguriert, `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` erzwingt eine Aktualisierung für die aktuelle Anfrage und speichert die Ersatzantwort. Aliasse in Snake-Case (`response_cache`, `response_cache_ttl_seconds`, `response_cache_clear`) werden ebenso akzeptiert wie `responseCacheTtl` beziehungsweise `response_cache_ttl` ohne das Suffix `Seconds`.

    Dies ist vom Prompt-Caching des Providers und von den Anthropic-Markierungen `cache_control` von OpenRouter getrennt. Es gilt nur für verifizierte Routen unter `openrouter.ai`, nicht für benutzerdefinierte Proxy-Basis-URLs.

  </Accordion>

  <Accordion title="Anthropic-Cache-Markierungen">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die Anthropic-Markierungen `cache_control` von OpenRouter bei, um die Wiederverwendung des Prompt-Caches für System- und Entwickler-Promptblöcke zu verbessern.
  </Accordion>

  <Accordion title="Anthropic-Reasoning-Prefill">
    Auf verifizierten OpenRouter-Routen entfernen Anthropic-Modellreferenzen mit aktiviertem Reasoning
    abschließende Assistant-Prefill-Turns, bevor die Anfrage
    OpenRouter erreicht. Dies entspricht der Anthropic-Anforderung, dass Reasoning-Unterhaltungen
    mit einem Benutzer-Turn enden.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Routen außer `auto` ordnet OpenClaw die ausgewählte Thinking-Stufe
    den Reasoning-Payloads des OpenRouter-Proxys zu. Bei `openrouter/auto` und nicht unterstützten
    Modellhinweisen wird diese Injektion übersprungen. Veraltete `openrouter/hunter-alpha`-Referenzen
    überspringen sie ebenfalls, da OpenRouter auf dieser eingestellten Route endgültigen Antworttext
    in Reasoning-Feldern zurückgeben konnte.
  </Accordion>

  <Accordion title="DeepSeek-V4-Reasoning-Wiedergabe">
    Auf verifizierten OpenRouter-Routen ergänzen `openrouter/deepseek/deepseek-v4-flash` und
    `openrouter/deepseek/deepseek-v4-pro` fehlendes `reasoning_content` bei
    wiedergegebenen Assistant-Turns, sodass Thinking-/Tool-Unterhaltungen die von DeepSeek
    V4 geforderte Form für Folgeanfragen beibehalten. OpenClaw sendet die von OpenRouter unterstützten
    `reasoning.effort`-Werte für diese Routen: `xhigh`/`max` werden `xhigh` zugeordnet,
    jede andere nicht deaktivierte Stufe wird `high` zugeordnet.
  </Accordion>

  <Accordion title="Nur für OpenAI geltende Anfrageanpassung">
    OpenRouter wird über den Proxy-artigen, OpenAI-kompatiblen Pfad ausgeführt. Daher werden native,
    ausschließlich für OpenAI geltende Anfrageanpassungen wie `serviceTier`, Responses `store`,
    OpenAI-Payloads zur Reasoning-Kompatibilität und Hinweise für den Prompt-Cache nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Referenzen verbleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Bereinigung von Gemini-Thought-Signaturen bei, aktiviert jedoch weder die native
    Gemini-Wiedergabevalidierung noch Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Metadaten für das Provider-Routing">
    OpenRouter unterstützt ein `provider`-Anfrageobjekt für das Routing des zugrunde liegenden Providers.
    Konfigurieren Sie mit `models.providers.openrouter.params.provider` eine Standardrichtlinie
    für alle OpenRouter-Anfragen an Textmodelle:

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

    OpenClaw leitet dieses Objekt als Anfrage-Payload `provider` an OpenRouter weiter.
    Verwenden Sie die von OpenRouter dokumentierten snake_case-Felder, darunter `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` und `enforce_distillable_text`.

    Modellspezifische Parameter überschreiben das Provider-weite Routing-Objekt:

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
    Google, OpenAI oder benutzerdefinierten Providern ignorieren die Routing-Parameter von OpenRouter.

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
