---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über Kilo Gateway in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von Kilo Gateway, um in OpenClaw auf viele Modelle zuzugreifen.
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:59:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway stellt eine **einheitliche API** bereit, die Anfragen über einen einzelnen
Endpoint und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI SDKs durch Wechseln der Base URL funktionieren.

| Eigenschaft | Wert                               |
| ----------- | ---------------------------------- |
| Provider    | `kilocode`                         |
| Auth        | `KILOCODE_API_KEY`                 |
| API         | OpenAI-kompatibel                  |
| Base URL    | `https://api.kilo.ai/api/gateway/` |

## Erste Schritte

<Steps>
  <Step title="Konto erstellen">
    Rufen Sie [app.kilo.ai](https://app.kilo.ai) auf, melden Sie sich an oder erstellen Sie ein Konto, navigieren Sie dann zu API Keys und generieren Sie einen neuen Schlüssel.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Oder setzen Sie die Umgebungsvariable direkt:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verfügbarkeit des Modells prüfen">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standardmodell

Das Standardmodell ist `kilocode/kilo/auto`, ein vom Provider verwaltetes Smart-Routing-
Modell, das von Kilo Gateway verwaltet wird.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als stabile Standard-Ref, veröffentlicht aber keine
quellengestützte Zuordnung von Aufgaben zu Upstream-Modellen für diese Route. Das genaue
Upstream-Routing hinter `kilocode/kilo/auto` liegt bei Kilo Gateway und ist nicht
in OpenClaw fest codiert.
</Note>

## Integrierter Katalog

OpenClaw erkennt verfügbare Modelle beim Start dynamisch über Kilo Gateway. Verwenden Sie
`/models kilocode`, um die vollständige Liste der mit Ihrem Konto verfügbaren Modelle anzuzeigen.

Jedes auf dem Gateway verfügbare Modell kann mit dem Präfix `kilocode/` verwendet werden:

| Modell-Ref                            | Hinweise                           |
| ------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                  | Standard — Smart Routing           |
| `kilocode/anthropic/claude-sonnet-4`  | Anthropic über Kilo                |
| `kilocode/openai/gpt-5.5`             | OpenAI über Kilo                   |
| `kilocode/google/gemini-3-pro-preview` | Google über Kilo                  |
| ...und viele weitere                  | Verwenden Sie `/models kilocode`, um alle aufzulisten |

<Tip>
Beim Start fragt OpenClaw `GET https://api.kilo.ai/api/gateway/models` ab und führt
erkannte Modelle vor dem statischen Fallback-Katalog zusammen. Der gebündelte Fallback
enthält immer `kilocode/kilo/auto` (`Kilo Auto`) mit `input: ["text", "image"]`,
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
  <Accordion title="Transport und Kompatibilität">
    Kilo Gateway ist im Quelltext als OpenRouter-kompatibel dokumentiert und bleibt daher auf
    dem Proxy-artigen OpenAI-kompatiblen Pfad statt auf nativem OpenAI Request Shaping.

    - Gemini-gestützte Kilo-Refs bleiben auf dem Proxy-Gemini-Pfad, sodass OpenClaw dort
      die Bereinigung von Gemini-Gedankensignaturen beibehält, ohne native Gemini
      Replay-Validierung oder Bootstrap-Rewrites zu aktivieren.
    - Kilo Gateway verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

  </Accordion>

  <Accordion title="Stream-Wrapper und Reasoning">
    Kilos gemeinsamer Stream-Wrapper fügt den Provider-App-Header hinzu und normalisiert
    Proxy-Reasoning-Payloads für unterstützte konkrete Modell-Refs.

    <Warning>
    `kilocode/kilo/auto` und andere Hinweise ohne Proxy-Reasoning-Unterstützung überspringen die Reasoning-
    Injection. Wenn Sie Reasoning-Unterstützung benötigen, verwenden Sie eine konkrete Modell-Ref wie
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Problembehebung">
    - Wenn die Modellerkennung beim Start fehlschlägt, fällt OpenClaw auf den gebündelten statischen Katalog mit `kilocode/kilo/auto` zurück.
    - Stellen Sie sicher, dass Ihr API-Schlüssel gültig ist und dass in Ihrem Kilo-Konto die gewünschten Modelle aktiviert sind.
    - Wenn der Gateway als Daemon ausgeführt wird, stellen Sie sicher, dass `KILOCODE_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway-Dashboard, API-Schlüssel und Kontoverwaltung.
  </Card>
</CardGroup>
