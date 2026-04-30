---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie benötigen eine Anleitung zur Einrichtung von Baidu Qianfan
summary: Verwenden Sie Qianfans einheitliche API, um in OpenClaw auf zahlreiche Modelle zuzugreifen
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T07:11:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan ist Baidus MaaS-Plattform und stellt eine **vereinheitlichte API** bereit, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Ändern der Basis-URL.

| Eigenschaft | Wert                              |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Authentifizierung | `QIANFAN_API_KEY`                 |
| API      | OpenAI-kompatibel                 |
| Basis-URL | `https://qianfan.baidubce.com/v2` |

## Erste Schritte

<Steps>
  <Step title="Baidu-Cloud-Konto erstellen">
    Registrieren Sie sich oder melden Sie sich in der [Qianfan-Konsole](https://console.bce.baidu.com/qianfan/ais/console/apiKey) an und stellen Sie sicher, dass der Qianfan-API-Zugriff für Sie aktiviert ist.
  </Step>
  <Step title="API-Schlüssel generieren">
    Erstellen Sie eine neue Anwendung oder wählen Sie eine vorhandene aus und generieren Sie dann einen API-Schlüssel. Das Schlüsselformat ist `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verfügbarkeit des Modells prüfen">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Integrierter Katalog

| Modellreferenz                       | Eingabe     | Kontext | Maximale Ausgabe | Reasoning | Hinweise       |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | Text        | 98,304  | 32,768     | Ja        | Standardmodell |
| `qianfan/ernie-5.0-thinking-preview` | Text, Bild  | 119,000 | 64,000     | Ja        | Multimodal     |

<Tip>
Die standardmäßig gebündelte Modellreferenz ist `qianfan/deepseek-v3.2`. Sie müssen `models.providers.qianfan` nur überschreiben, wenn Sie eine benutzerdefinierte Basis-URL oder Modellmetadaten benötigen.
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
    Qianfan läuft über den OpenAI-kompatiblen Transportpfad, nicht über natives OpenAI-Request-Shaping. Das bedeutet, dass Standardfunktionen von OpenAI-SDKs funktionieren, Provider-spezifische Parameter jedoch möglicherweise nicht weitergeleitet werden.
  </Accordion>

  <Accordion title="Katalog und Überschreibungen">
    Der gebündelte Katalog enthält derzeit `deepseek-v3.2` und `ernie-5.0-thinking-preview`. Fügen Sie `models.providers.qianfan` nur hinzu oder überschreiben Sie es, wenn Sie eine benutzerdefinierte Basis-URL oder Modellmetadaten benötigen.

    <Note>
    Modellreferenzen verwenden das Präfix `qianfan/` (zum Beispiel `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Stellen Sie sicher, dass Ihr API-Schlüssel mit `bce-v3/ALTAK-` beginnt und der Qianfan-API-Zugriff in der Baidu-Cloud-Konsole aktiviert ist.
    - Wenn Modelle nicht aufgelistet werden, prüfen Sie, ob der Qianfan-Dienst für Ihr Konto aktiviert ist.
    - Die Standard-Basis-URL ist `https://qianfan.baidubce.com/v2`. Ändern Sie sie nur, wenn Sie einen benutzerdefinierten Endpunkt oder Proxy verwenden.

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
  <Card title="Agent-Einrichtung" href="/de/concepts/agent" icon="robot">
    Konfiguration von Agent-Standards und Modellzuweisungen.
  </Card>
  <Card title="Qianfan-API-Dokumentation" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Offizielle Qianfan-API-Dokumentation.
  </Card>
</CardGroup>
