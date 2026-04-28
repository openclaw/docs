---
read_when:
    - Sie möchten einen einzigen API-Key für viele LLMs.
    - Sie möchten Modelle über Kilo Gateway in OpenClaw ausführen.
summary: Die einheitliche API von Kilo Gateway verwenden, um in OpenClaw auf viele Modelle zuzugreifen
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T06:54:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway bietet eine **einheitliche API**, die Anfragen hinter einem einzigen
Endpunkt und API-Key an viele Modelle weiterleitet. Es ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch das Umstellen der Base URL.

| Eigenschaft | Wert                               |
| ----------- | ---------------------------------- |
| Provider    | `kilocode`                         |
| Auth        | `KILOCODE_API_KEY`                 |
| API         | OpenAI-kompatibel                  |
| Base URL    | `https://api.kilo.ai/api/gateway/` |

## Erste Schritte

<Steps>
  <Step title="Ein Konto erstellen">
    Gehen Sie zu [app.kilo.ai](https://app.kilo.ai), melden Sie sich an oder erstellen Sie ein Konto und navigieren Sie dann zu API Keys, um einen neuen Schlüssel zu erzeugen.
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
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standardmodell

Das Standardmodell ist `kilocode/kilo/auto`, ein providerspezifisches Modell für Smart Routing,
das von Kilo Gateway verwaltet wird.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als stabile Standardreferenz, veröffentlicht aber
keine quellgestützte Zuordnung von Aufgaben zu Upstream-Modellen für diese Route. Exaktes
Upstream-Routing hinter `kilocode/kilo/auto` liegt in der Verantwortung von Kilo Gateway und ist nicht
hart in OpenClaw codiert.
</Note>

## Eingebauter Katalog

OpenClaw erkennt verfügbare Modelle beim Start dynamisch von Kilo Gateway. Verwenden Sie
`/models kilocode`, um die vollständige Liste der mit Ihrem Konto verfügbaren Modelle zu sehen.

Jedes Modell, das im Gateway verfügbar ist, kann mit dem Präfix `kilocode/` verwendet werden:

| Modellreferenz                        | Hinweise                           |
| ------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                  | Standard — Smart Routing           |
| `kilocode/anthropic/claude-sonnet-4`  | Anthropic über Kilo                |
| `kilocode/openai/gpt-5.5`             | OpenAI über Kilo                   |
| `kilocode/google/gemini-3-pro-preview` | Google über Kilo                  |
| ...und viele mehr                     | Verwenden Sie `/models kilocode`, um alle aufzulisten |

<Tip>
Beim Start fragt OpenClaw `GET https://api.kilo.ai/api/gateway/models` ab und führt
erkannte Modelle vor dem statischen Fallback-Katalog zusammen. Der gebündelte Fallback enthält immer
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
  <Accordion title="Transport und Kompatibilität">
    Kilo Gateway ist im Source-Code als OpenRouter-kompatibel dokumentiert und bleibt daher auf
    dem Proxy-artigen OpenAI-kompatiblen Pfad statt nativer OpenAI-Request-Formung.

    - Gemini-gestützte Kilo-Referenzen bleiben auf dem Proxy-Gemini-Pfad, daher behält OpenClaw dort
      die Bereinigung von Gemini-Thought-Signaturen bei, ohne native Gemini-
      Replay-Validierung oder Bootstrap-Rewrites zu aktivieren.
    - Kilo Gateway verwendet unter der Haube ein Bearer-Token mit Ihrem API-Key.

  </Accordion>

  <Accordion title="Stream-Wrapper und Reasoning">
    Kilos gemeinsamer Stream-Wrapper fügt den Provider-App-Header hinzu und normalisiert
    Proxy-Reasoning-Nutzlasten für unterstützte konkrete Modellreferenzen.

    <Warning>
    `kilocode/kilo/auto` und andere Hinweise ohne Unterstützung für Proxy-Reasoning überspringen die Injektion von Reasoning.
    Wenn Sie Reasoning-Unterstützung benötigen, verwenden Sie eine konkrete Modellreferenz wie
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn die Modellerkennung beim Start fehlschlägt, fällt OpenClaw auf den gebündelten statischen Katalog zurück, der `kilocode/kilo/auto` enthält.
    - Bestätigen Sie, dass Ihr API-Key gültig ist und dass in Ihrem Kilo-Konto die gewünschten Modelle aktiviert sind.
    - Wenn das Gateway als Daemon läuft, stellen Sie sicher, dass `KILOCODE_API_KEY` diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo-Gateway-Dashboard, API-Keys und Kontoverwaltung.
  </Card>
</CardGroup>
