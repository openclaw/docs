---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle in OpenClaw über Kilo Gateway ausführen
summary: Verwenden Sie die einheitliche API von Kilo Gateway, um auf viele Modelle in OpenClaw zuzugreifen
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T19:49:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway stellt eine **einheitliche API** bereit, die Anfragen hinter einem einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Ändern der Basis-URL.

| Eigenschaft | Wert                               |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Authentifizierung | `KILOCODE_API_KEY`                 |
| API      | OpenAI-kompatibel                  |
| Basis-URL | `https://api.kilo.ai/api/gateway/` |

## Erste Schritte

<Steps>
  <Step title="Konto erstellen">
    Gehen Sie zu [app.kilo.ai](https://app.kilo.ai), melden Sie sich an oder erstellen Sie ein Konto, navigieren Sie anschließend zu API Keys und generieren Sie einen neuen Schlüssel.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Oder legen Sie die Umgebungsvariable direkt fest:

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

Das Standardmodell ist `kilocode/kilo/auto`, ein Provider-eigenes Smart-Routing-
Modell, das von Kilo Gateway verwaltet wird.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als stabile Standardreferenz, veröffentlicht jedoch keine quellengestützte Zuordnung von Aufgaben zu Upstream-Modellen für diese Route. Das genaue
Upstream-Routing hinter `kilocode/kilo/auto` liegt bei Kilo Gateway und ist nicht
fest in OpenClaw kodiert.
</Note>

## Integrierter Katalog

OpenClaw ermittelt verfügbare Modelle beim Start dynamisch aus dem Kilo Gateway. Verwenden Sie
`/models kilocode`, um die vollständige Liste der mit Ihrem Konto verfügbaren Modelle anzuzeigen.

Jedes auf dem Gateway verfügbare Modell kann mit dem Präfix `kilocode/` verwendet werden:

| Modellreferenz                          | Hinweise                           |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Standard - Smart Routing           |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic über Kilo                |
| `kilocode/openai/gpt-5.5`                | OpenAI über Kilo                   |
| `kilocode/google/gemini-3.1-pro-preview` | Google über Kilo                   |
| ...und viele weitere                     | Verwenden Sie `/models kilocode`, um alle aufzulisten |

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
    Kilo Gateway ist im Quellcode als OpenRouter-kompatibel dokumentiert, daher bleibt es auf
    dem Proxy-artigen OpenAI-kompatiblen Pfad statt auf nativer OpenAI-Anfrageformung.

    - Gemini-gestützte Kilo-Referenzen bleiben auf dem Proxy-Gemini-Pfad, daher behält OpenClaw dort die
      Bereinigung von Gemini-Gedankensignaturen bei, ohne native Gemini-
      Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
    - Kilo Gateway verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

  </Accordion>

  <Accordion title="Stream-Wrapper und Reasoning">
    Kilos gemeinsamer Stream-Wrapper ergänzt den Provider-App-Header und normalisiert
    Proxy-Reasoning-Payloads für unterstützte konkrete Modellreferenzen.

    <Warning>
    `kilocode/kilo/auto` und andere Hinweise ohne Proxy-Reasoning-Unterstützung überspringen die Reasoning-
    Injection. Wenn Sie Reasoning-Unterstützung benötigen, verwenden Sie eine konkrete Modellreferenz wie
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn die Modellerkennung beim Start fehlschlägt, fällt OpenClaw auf den gebündelten statischen Katalog mit `kilocode/kilo/auto` zurück.
    - Stellen Sie sicher, dass Ihr API-Schlüssel gültig ist und dass für Ihr Kilo-Konto die gewünschten Modelle aktiviert sind.
    - Wenn der Gateway als Daemon läuft, stellen Sie sicher, dass `KILOCODE_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway-Dashboard, API-Schlüssel und Kontoverwaltung.
  </Card>
</CardGroup>
