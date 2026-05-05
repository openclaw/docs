---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
    - Sie möchten OpenRouter für die Videogenerierung verwenden
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter stellt eine **einheitliche API** bereit, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Umstellen der Basis-URL.

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Zu einem bestimmten Modell wechseln">
    Beim Onboarding ist `openrouter/auto` voreingestellt. Wählen Sie später ein konkretes Modell:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

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
Modellreferenzen folgen dem Muster `openrouter/<provider>/<model>`. Die vollständige Liste der
verfügbaren Provider und Modelle finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
</Note>

Mitgelieferte Fallback-Beispiele:

| Modellreferenz                   | Hinweise                         |
| --------------------------------- | -------------------------------- |
| `openrouter/auto`                 | Automatisches Routing von OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 über MoonshotAI        |

## Bilderzeugung

OpenRouter kann auch das Tool `image_generate` unterstützen. Verwenden Sie ein OpenRouter-Bildmodell unter `agents.defaults.imageGenerationModel`:

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

OpenClaw sendet Bildanfragen an die Chat-Completions-Bild-API von OpenRouter mit `modalities: ["image", "text"]`. Gemini-Bildmodelle erhalten unterstützte Hinweise für `aspectRatio` und `resolution` über `image_config` von OpenRouter. Verwenden Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsamere OpenRouter-Bildmodelle; der `timeoutMs`-Parameter pro Aufruf des Tools `image_generate` hat weiterhin Vorrang.

## Videoerzeugung

OpenRouter kann auch das Tool `video_generate` über seine asynchrone `/videos`-API unterstützen. Verwenden Sie ein OpenRouter-Videomodell unter `agents.defaults.videoGenerationModel`:

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

OpenClaw übermittelt Text-zu-Video- und Bild-zu-Video-Jobs an OpenRouter, fragt
die zurückgegebene `polling_url` ab und lädt das fertige Video von
`unsigned_urls` von OpenRouter oder dem dokumentierten Job-Inhaltsendpunkt herunter.
Referenzbilder werden standardmäßig als Bilder für den ersten/letzten Frame gesendet; Bilder,
die mit `reference_image` markiert sind, werden als OpenRouter-Eingabereferenzen gesendet. Der
mitgelieferte Standard `google/veo-3.1-fast` bewirbt die derzeit unterstützten Dauern von 4/6/8
Sekunden, Auflösungen `720P`/`1080P` und Seitenverhältnisse `16:9`/`9:16`.
Video-zu-Video ist für OpenRouter nicht registriert, da die vorgelagerte
Videoerzeugungs-API derzeit Text- und Bildreferenzen akzeptiert.

## Text-to-Speech

OpenRouter kann auch als TTS-Provider über seinen OpenAI-kompatiblen
Endpunkt `/audio/speech` verwendet werden.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Wenn `messages.tts.providers.openrouter.apiKey` ausgelassen wird, verwendet TTS erneut
`models.providers.openrouter.apiKey` und danach `OPENROUTER_API_KEY`.

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten App-Attributions-Header von OpenRouter hinzu:

| Header                    | Wert                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Basis-URL umstellen, injiziert OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Markierungen **nicht**.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Antwort-Caching">
    OpenRouter-Antwort-Caching ist Opt-in. Aktivieren Sie es pro OpenRouter-Modell mit
    Modellparametern:

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

    OpenClaw sendet `X-OpenRouter-Cache: true` und, wenn konfiguriert,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` erzwingt eine Aktualisierung für
    die aktuelle Anfrage und speichert die ersetzende Antwort. Snake_case-Aliasse
    (`response_cache`, `response_cache_ttl_seconds` und
    `response_cache_clear`) werden ebenfalls akzeptiert.

    Dies ist getrennt vom Prompt-Caching des Providers und von den Anthropic-Markierungen
    `cache_control` von OpenRouter. Es wird nur auf verifizierte
    `openrouter.ai`-Routen angewendet, nicht auf benutzerdefinierte Proxy-Basis-URLs.

  </Accordion>

  <Accordion title="Anthropic-Cache-Markierungen">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen die
    OpenRouter-spezifischen Anthropic-Markierungen `cache_control` bei, die OpenClaw für
    bessere Wiederverwendung des Prompt-Cache in System-/Developer-Prompt-Blöcken nutzt.
  </Accordion>

  <Accordion title="Anthropic-Reasoning-Prefill">
    Auf verifizierten OpenRouter-Routen verwerfen Anthropic-Modellreferenzen mit aktiviertem Reasoning
    abschließende Assistant-Prefill-Turns, bevor die Anfrage OpenRouter erreicht.
    Das entspricht der Anforderung von Anthropic, dass Reasoning-Konversationen mit einem User-
    Turn enden.
  </Accordion>

  <Accordion title="Thinking- / Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen ordnet OpenClaw die ausgewählte Thinking-Stufe
    OpenRouter-Proxy-Reasoning-Payloads zu. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion. Hunter Alpha überspringt außerdem
    Proxy-Reasoning für veraltete konfigurierte Modellreferenzen, da OpenRouter
    für diese eingestellte Route endgültigen Antworttext in Reasoning-Feldern zurückgeben könnte.
  </Accordion>

  <Accordion title="DeepSeek-V4-Reasoning-Replay">
    Auf verifizierten OpenRouter-Routen füllen `openrouter/deepseek/deepseek-v4-flash` und
    `openrouter/deepseek/deepseek-v4-pro` fehlenden `reasoning_content` bei
    wiedergegebenen Assistant-Turns auf, sodass Thinking-/Tool-Konversationen die für DeepSeek V4
    erforderliche Follow-up-Form behalten. OpenClaw sendet von OpenRouter unterstützte
    `reasoning_effort`-Werte für diese Routen; `xhigh` ist die höchste beworbene
    Stufe, und veraltete `max`-Overrides werden `xhigh` zugeordnet.
  </Accordion>

  <Accordion title="Nur-OpenAI-Anfrageformung">
    OpenRouter läuft weiterhin über den Proxy-artigen OpenAI-kompatiblen Pfad, daher
    wird native, nur für OpenAI geltende Anfrageformung wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-Kompatibilitätspayloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Referenzen bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält
    dort die Bereinigung von Gemini-Denksignaturen bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Rewrites.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    es als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
