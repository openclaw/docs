---
read_when:
    - Sie möchten einen einzelnen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über Kilo Gateway in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von Kilo Gateway, um in OpenClaw auf viele Modelle zuzugreifen
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:04:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway stellt eine **einheitliche API** bereit, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI SDKs durch Wechseln der Basis-URL funktionieren.

| Eigenschaft | Wert                               |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | OpenAI-kompatibel                  |
| Basis-URL | `https://api.kilo.ai/api/gateway/` |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie dann den Gateway neu:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="Create an account">
    Gehen Sie zu [app.kilo.ai](https://app.kilo.ai), melden Sie sich an oder erstellen Sie ein Konto, navigieren Sie dann zu API Keys und generieren Sie einen neuen Schlüssel.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Oder setzen Sie die Umgebungsvariable direkt:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standardmodell

Das Standardmodell ist `kilocode/kilo/auto`, ein Provider-eigenes Smart-Routing-
Modell, das von Kilo Gateway verwaltet wird.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als stabile Standard-Ref, veröffentlicht
aber keine quellengestützte Zuordnung von Aufgaben zu Upstream-Modellen für diese Route. Das genaue
Upstream-Routing hinter `kilocode/kilo/auto` liegt bei Kilo Gateway und ist nicht
in OpenClaw fest codiert.
</Note>

## Integrierter Katalog

OpenClaw ermittelt beim Start dynamisch die verfügbaren Modelle aus dem Kilo Gateway. Verwenden Sie
`/models kilocode`, um die vollständige Liste der mit Ihrem Konto verfügbaren Modelle anzuzeigen.

Jedes auf dem Gateway verfügbare Modell kann mit dem Präfix `kilocode/` verwendet werden:

| Modell-Ref                              | Hinweise                           |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Standard - Smart Routing           |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic über Kilo                |
| `kilocode/openai/gpt-5.5`                | OpenAI über Kilo                   |
| `kilocode/google/gemini-3.1-pro-preview` | Google über Kilo                   |
| ...und viele weitere                     | Verwenden Sie `/models kilocode`, um alle aufzulisten |

<Tip>
Beim Start fragt OpenClaw `GET https://api.kilo.ai/api/gateway/models` ab und führt
erkannte Modelle vor dem statischen Fallback-Katalog zusammen. Der statische Fallback enthält immer
`kilocode/kilo/auto` (`Kilo Auto`) mit `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` und `maxTokens: 128000`.
</Tip>

## Konfigurationsbeispiel

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway ist im Quellcode als OpenRouter-kompatibel dokumentiert, daher bleibt es auf
    dem proxyartigen OpenAI-kompatiblen Pfad statt auf nativer OpenAI-Anfrageformung.

    - Gemini-gestützte Kilo-Refs bleiben auf dem Proxy-Gemini-Pfad, sodass OpenClaw dort
      die Bereinigung von Gemini-Gedankensignaturen beibehält, ohne native Gemini-
      Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
    - Kilo Gateway verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    Kilos gemeinsamer Stream-Wrapper fügt den Provider-App-Header hinzu und normalisiert
    Proxy-Reasoning-Payloads für unterstützte konkrete Modell-Refs.

    <Warning>
    `kilocode/kilo/auto` und andere Hinweise ohne Proxy-Reasoning-Unterstützung überspringen die Reasoning-
    Injektion. Wenn Sie Reasoning-Unterstützung benötigen, verwenden Sie eine konkrete Modell-Ref wie
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Wenn die Modellerkennung beim Start fehlschlägt, fällt OpenClaw auf den statischen Katalog mit `kilocode/kilo/auto` zurück.
    - Bestätigen Sie, dass Ihr API-Schlüssel gültig ist und dass in Ihrem Kilo-Konto die gewünschten Modelle aktiviert sind.
    - Wenn der Gateway als Daemon läuft, stellen Sie sicher, dass `KILOCODE_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway-Dashboard, API-Schlüssel und Kontoverwaltung.
  </Card>
</CardGroup>
