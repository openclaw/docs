---
read_when:
    - Sie möchten einen einzelnen API key für viele LLMs נוצן
    - Sie benötigen eine Anleitung zur Einrichtung von Baidu Qianfan
summary: Qianfans vereinheitlichte API verwenden, um in OpenClaw auf viele Modelle zuzugreifen
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T06:55:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan ist Baidus MaaS-Plattform und bietet eine **vereinheitlichte API**, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Umstellen der Base-URL.

| Eigenschaft | Wert                              |
| ----------- | --------------------------------- |
| Provider    | `qianfan`                         |
| Auth        | `QIANFAN_API_KEY`                 |
| API         | OpenAI-kompatibel                 |
| Base-URL    | `https://qianfan.baidubce.com/v2` |

## Erste Schritte

<Steps>
  <Step title="Ein Baidu-Cloud-Konto erstellen">
    Registrieren Sie sich oder melden Sie sich bei der [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) an und stellen Sie sicher, dass der Zugriff auf die Qianfan-API aktiviert ist.
  </Step>
  <Step title="Einen API-Schlüssel generieren">
    Erstellen Sie eine neue Anwendung oder wählen Sie eine bestehende aus und generieren Sie dann einen API-Schlüssel. Das Schlüsselformat ist `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Integrierter Katalog

| Modell-Ref                           | Eingabe     | Kontext | Max. Ausgabe | Reasoning | Hinweise       |
| ------------------------------------ | ----------- | ------- | ------------ | --------- | -------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768       | Ja        | Standardmodell |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000       | Ja        | Multimodal     |

<Tip>
Die standardmäßig gebündelte Modell-Ref ist `qianfan/deepseek-v3.2`. Sie müssen `models.providers.qianfan` nur dann überschreiben, wenn Sie eine benutzerdefinierte Base-URL oder Modellmetadaten benötigen.
</Tip>

## Konfigurationsbeispiel

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport und Kompatibilität">
    Qianfan läuft über den OpenAI-kompatiblen Transportpfad, nicht über natives OpenAI-Request-Shaping. Das bedeutet, dass Standardfunktionen von OpenAI-SDKs funktionieren, providerspezifische Parameter aber möglicherweise nicht weitergeleitet werden.
  </Accordion>

  <Accordion title="Katalog und Überschreibungen">
    Der gebündelte Katalog enthält derzeit `deepseek-v3.2` und `ernie-5.0-thinking-preview`. Fügen Sie `models.providers.qianfan` nur dann hinzu oder überschreiben Sie es, wenn Sie eine benutzerdefinierte Base-URL oder Modellmetadaten benötigen.

    <Note>
    Modell-Refs verwenden das Präfix `qianfan/` (zum Beispiel `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Stellen Sie sicher, dass Ihr API-Schlüssel mit `bce-v3/ALTAK-` beginnt und in der Baidu-Cloud-Konsole Zugriff auf die Qianfan-API aktiviert hat.
    - Wenn keine Modelle aufgelistet werden, prüfen Sie, ob Ihr Konto den Qianfan-Dienst aktiviert hat.
    - Die Standard-Base-URL ist `https://qianfan.baidubce.com/v2`. Ändern Sie sie nur, wenn Sie einen benutzerdefinierten Endpunkt oder Proxy verwenden.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Agent-Einrichtung" href="/de/concepts/agent" icon="robot">
    Standardwerte für Agenten und Modellzuweisungen konfigurieren.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Offizielle Qianfan-API-Dokumentation.
  </Card>
</CardGroup>
