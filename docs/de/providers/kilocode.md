---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über Kilo Gateway in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von Kilo Gateway, um in OpenClaw auf zahlreiche Modelle zuzugreifen
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-24T05:13:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0246a1a77f4265168b213e0167360e1cd89dc2ca864997f08cae5331037f9e89
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway leitet Anfragen an zahlreiche Modelle hinter einem einzigen OpenAI-kompatiblen Endpunkt und API-Schlüssel weiter.

| Eigenschaft | Wert                             |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Authentifizierung | `KILOCODE_API_KEY`                 |
| API      | OpenAI-kompatibel                  |
| Basis-URL | `https://api.kilo.ai/api/gateway/` |

## Plugin installieren

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Einrichtung

<Steps>
  <Step title="Konto erstellen">
    Rufen Sie [app.kilo.ai](https://app.kilo.ai) auf, melden Sie sich an oder erstellen Sie ein Konto und generieren Sie anschließend einen API-Schlüssel.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Alternativ können Sie die Umgebungsvariable direkt festlegen:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standardmodell und Katalog

Das Standardmodell ist `kilocode/kilo-auto/balanced`, die ausgewogene intelligente Routing-Stufe von Kilo Gateway.
OpenClaw veröffentlicht dafür keine Zuordnung von Aufgaben zu Upstream-Modellen; das Routing hinter
`kilo-auto/balanced` wird von Kilo Gateway verwaltet.

Beim Start fragt OpenClaw `GET https://api.kilo.ai/api/gateway/models` ab und führt erkannte Modelle
vor einem statischen Ausweichkatalog zusammen. Der statische Ausweichkatalog enthält ausschließlich
`kilocode/kilo-auto/balanced` (`Auto Balanced`, `input: ["text", "image"]`, `reasoning: true`,
`contextWindow: 1000000`, `maxTokens: 65536`).

Jedes Modell auf dem Gateway kann als `kilocode/<upstream-id>` adressiert werden (zum Beispiel
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Führen Sie `/models kilocode` oder
`openclaw models list --provider kilocode` aus, um die vollständige Liste der erkannten Modelle anzuzeigen.

## Konfigurationsbeispiel

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo-auto/balanced" },
    },
  },
}
```

## Hinweise zum Verhalten

<AccordionGroup>
  <Accordion title="Transport und Kompatibilität">
    Kilo Gateway ist mit OpenRouter kompatibel und verwendet daher den Proxy-basierten OpenAI-kompatiblen
    Anfragepfad statt der nativen OpenAI-Anfrageformung (kein `store`, keine OpenAI-Nutzlast für den Reasoning-Aufwand).

    - Auf Gemini basierende Kilo-Referenzen verbleiben auf dem Proxy-Gemini-Pfad: OpenClaw bereinigt dort Gemini-Denksignaturen,
      aktiviert jedoch weder die native Gemini-Validierung für die Wiedergabe noch Bootstrap-Umschreibungen.
    - Anfragen verwenden ein aus Ihrem API-Schlüssel erstelltes Bearer-Token.

  </Accordion>

  <Accordion title="Stream-Wrapper und Reasoning">
    Der Kilo-Stream-Wrapper fügt einen `X-KILOCODE-FEATURE`-Anfrageheader hinzu (standardmäßig `openclaw`,
    überschreibbar mit der Umgebungsvariable `KILOCODE_FEATURE`) und normalisiert Nutzlasten für den Reasoning-Aufwand bei
    Modellen, die dies unterstützen.

    <Warning>
    Die Referenzen `kilocode/kilo-auto/balanced` und `x-ai/*` überspringen das Einfügen des Reasoning-Aufwands. Verwenden Sie eine konkrete
    Modellreferenz wie `kilocode/anthropic/claude-sonnet-4`, wenn Sie Reasoning-Unterstützung benötigen.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn die Modellerkennung beim Start fehlschlägt, greift OpenClaw auf den statischen Katalog mit `kilocode/kilo-auto/balanced` zurück.
    - Stellen Sie sicher, dass Ihr API-Schlüssel gültig ist und die gewünschten Modelle für Ihr Kilo-Konto aktiviert sind.
    - Wenn der Gateway als Daemon ausgeführt wird, stellen Sie sicher, dass `KILOCODE_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo-Gateway-Dashboard, API-Schlüssel und Kontoverwaltung.
  </Card>
</CardGroup>
