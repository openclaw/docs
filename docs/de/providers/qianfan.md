---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie benötigen eine Anleitung zur Einrichtung von Baidu Qianfan
summary: Verwenden Sie die einheitliche API von Qianfan, um auf viele Modelle in OpenClaw zuzugreifen
title: Qianfan
x-i18n:
    generated_at: "2026-07-24T04:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan ist Baidus MaaS-Plattform: eine einheitliche, OpenAI-kompatible API, die Anfragen über einen einzigen Endpunkt und API-Schlüssel an zahlreiche Modelle weiterleitet. OpenClaw stellt sie als offizielles externes Plugin `@openclaw/qianfan-provider` bereit.

| Eigenschaft   | Wert                                     |
| ------------- | ---------------------------------------- |
| Provider      | `qianfan`                       |
| Authentifizierung | `QIANFAN_API_KEY`                  |
| API           | OpenAI-kompatibel (`openai-completions`)   |
| Basis-URL     | `https://qianfan.baidubce.com/v2`                       |
| Standardmodell | `qianfan/deepseek-v3.2`                      |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend das Gateway neu:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="Baidu-Cloud-Konto erstellen">
    Registrieren Sie sich bei der [Qianfan-Konsole](https://console.bce.baidu.com/qianfan/ais/console/apiKey) oder melden Sie sich dort an und stellen Sie sicher, dass der Qianfan-API-Zugriff für Sie aktiviert ist.
  </Step>
  <Step title="API-Schlüssel generieren">
    Erstellen Sie eine neue Anwendung oder wählen Sie eine vorhandene aus und generieren Sie anschließend einen API-Schlüssel. Baidu-Cloud-Schlüssel verwenden das Format `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Nicht interaktive Ausführungen lesen den Schlüssel aus `--qianfan-api-key <key>` oder
    `QIANFAN_API_KEY`. Das Onboarding schreibt die Provider-Konfiguration, fügt den Alias
    `QIANFAN` für das Standardmodell hinzu und legt `qianfan/deepseek-v3.2`
    als Standardmodell fest, wenn keines konfiguriert ist.

  </Step>
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Integrierter Katalog

| Modellreferenz                       | Eingabe     | Kontext | Maximale Ausgabe | Reasoning | Hinweise       |
| ------------------------------------ | ----------- | ------- | ---------------- | --------- | -------------- |
| `qianfan/deepseek-v3.2`                   | Text        | 98,304  | 32,768           | Ja        | Standardmodell |
| `qianfan/ernie-5.0-thinking-preview`                   | Text, Bild  | 119,000 | 64,000           | Ja        | Multimodal     |

Der Katalog ist statisch; es gibt keine Live-Modellerkennung.

<Tip>
Sie müssen `models.providers.qianfan` nur überschreiben, wenn Sie eine benutzerdefinierte Basis-URL oder benutzerdefinierte Modellmetadaten benötigen.
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

<Note>
Modellreferenzen verwenden das Präfix `qianfan/` (zum Beispiel `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transport und Kompatibilität">
    Qianfan verwendet den OpenAI-kompatiblen Transportpfad und nicht die native Formung von OpenAI-Anfragen. Standardfunktionen des OpenAI SDK funktionieren, providerspezifische Parameter werden jedoch möglicherweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Stellen Sie sicher, dass Ihr API-Schlüssel mit `bce-v3/ALTAK-` beginnt und der Qianfan-API-Zugriff in der Baidu-Cloud-Konsole aktiviert ist.
    - Wenn keine Modelle aufgeführt werden, prüfen Sie, ob der Qianfan-Dienst für Ihr Konto aktiviert ist.
    - Ändern Sie die Basis-URL nur, wenn Sie einen benutzerdefinierten Endpunkt oder Proxy verwenden.

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
    Konfiguration von Agent-Standardeinstellungen und Modellzuweisungen.
  </Card>
  <Card title="Qianfan-API-Dokumentation" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Offizielle Qianfan-API-Dokumentation.
  </Card>
</CardGroup>
