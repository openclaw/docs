---
read_when:
    - Sie möchten Inkling von Thinking Machines Lab in OpenClaw ausführen
    - Sie möchten eine OpenAI-kompatible API für die von Baseten gehosteten Modelle
summary: Baseten-Einrichtung für Inkling und gehostete Modell-APIs
title: Baseten
x-i18n:
    generated_at: "2026-07-24T05:18:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2ccc3b5cf64b01859f9f022d7bc15a69a1cb42c87d4f914c118276c1151020de
    source_path: providers/baseten.md
    workflow: 16
---

[Baseten-Modell-APIs](https://docs.baseten.co/inference/model-apis/overview) bieten gehosteten, OpenAI-kompatiblen Zugriff auf Frontier-Modelle. Das offizielle externe Plugin verwendet authentifizierte Erkennung, sodass OpenClaw dem vollständigen Modellsatz folgt, der für Ihr Baseten-Konto aktiviert ist. Sein Offline-Fallback enthält jede Modell-API, die zum Zeitpunkt der Erstellung dieser OpenClaw-Version verfügbar war.

| Eigenschaft      | Wert                                                     |
| --------------- | -------------------------------------------------------- |
| Provider-ID     | `baseten`                                                |
| Plugin          | offizielles externes Paket (`@openclaw/baseten-provider`) |
| Auth-Umgebungsvariable | `BASETEN_API_KEY`                                        |
| Onboarding-Flag | `--auth-choice baseten-api-key`                          |
| Direktes CLI-Flag | `--baseten-api-key <key>`                                |
| API             | OpenAI-kompatibel (`openai-completions`)                 |
| Basis-URL       | `https://inference.baseten.co/v1`                        |
| Standardmodell  | `baseten/thinkingmachines/inkling`                       |

## Plugin installieren

```bash
openclaw plugins install @openclaw/baseten-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="Baseten-Konto und API-Schlüssel erstellen">
    Für den Basic-Tarif von Baseten fällt keine monatliche Plattformgebühr an; Modell-API-Aufrufe werden nach Nutzung abgerechnet. Erstellen Sie unter [Baseten-API-Schlüsseleinstellungen](https://app.baseten.co/settings/api_keys) einen Schlüssel und prüfen Sie die aktuellen Tarife auf der [Preisseite](https://www.baseten.co/pricing).
  </Step>
  <Step title="Onboarding ausführen">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice baseten-api-key
```

```bash Direktes Flag
openclaw onboard --non-interactive \
  --auth-choice baseten-api-key \
  --baseten-api-key "$BASETEN_API_KEY"
```

```bash Nur Umgebungsvariable
export BASETEN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Live-Katalog überprüfen">
    ```bash
    openclaw models list --provider baseten
    ```

    Mit verwendbarer Authentifizierung fordert das Plugin `GET /v1/models` an und listet jedes für das Konto zurückgegebene Modell auf. Ohne Authentifizierung bleibt es offline und verwendet das gebündelte Fallback.

  </Step>
</Steps>

## Inkling

[Inkling von Thinking Machines Lab](https://thinkingmachines.ai/news/introducing-inkling/) ist das Standardmodell. In OpenClaw unterstützt es Text- und Bildeingaben, Tool-Aufrufe, strukturierte Tool-Schemas, konfigurierbaren Reasoning-Aufwand, ein Kontextfenster mit 1.048M Token und bis zu 32k Ausgabe-Token:

```json5
{
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
}
```

Verwenden Sie `/model baseten/thinkingmachines/inkling`, um einen bestehenden Chat umzustellen.

## Gebündelter Fallback-Katalog

Der authentifizierte Live-Katalog ist maßgeblich. Diese Zeilen sorgen dafür, dass Einrichtung und Modellauswahl bereits vor erfolgreicher Erkennung verwendet werden können:

| Modellreferenz                                     | Eingabe     | Kontext | Max. Ausgabe |
| -------------------------------------------------- | ----------- | ------: | ---------: |
| `baseten/deepseek-ai/DeepSeek-V4-Pro`              | Text        |    262k |       262k |
| `baseten/zai-org/GLM-4.7`                          | Text        |    200k |       200k |
| `baseten/zai-org/GLM-5`                            | Text        |    202k |       202k |
| `baseten/zai-org/GLM-5.1`                          | Text        |    202k |       202k |
| `baseten/zai-org/GLM-5.2`                          | Text        |    202k |       202k |
| `baseten/thinkingmachines/inkling`                 | Text, Bild |  1.048M |        32k |
| `baseten/moonshotai/Kimi-K2.5`                     | Text, Bild |    262k |       262k |
| `baseten/moonshotai/Kimi-K2.6`                     | Text, Bild |    262k |       262k |
| `baseten/moonshotai/Kimi-K2.7-Code`                | Text, Bild |    262k |       262k |
| `baseten/nvidia/Nemotron-120B-A12B`                | Text        |    202k |       202k |
| `baseten/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B` | Text        |    202k |       202k |
| `baseten/openai/gpt-oss-120b`                      | Text        |    128k |       128k |

Alle gebündelten Modelle unterstützen Tool-Aufrufe und Reasoning. OpenClaw ordnet seine Denkstufen Modellen mit nativem `reasoning_effort` zu. Bei den optionalen GLM-, Kimi- und Nemotron-Modellen von Baseten ist das Denken standardmäßig deaktiviert; die meisten bieten eine binäre Aus-/Ein-Steuerung, während GLM 5.2 die Stufen aus, hoch und maximal bietet. OpenClaw übermittelt diese Auswahl über die Baseten-Steuerung `chat_template_args.enable_thinking` und bei GLM 5.2 über den validierten Top-Level-Parameter `reasoning_effort`.

<Note>
Baseten kann Modell-APIs unabhängig von OpenClaw-Versionen hinzufügen, entfernen oder ändern. Das Plugin aktualisiert Modell-IDs, Kontextlimits, Ausgabelimits sowie die Preise für Eingabe, zwischengespeicherte Eingabe und Ausgabe über die authentifizierte API und behält dabei die modellspezifische Transport-Richtlinie von OpenClaw bei.
</Note>

## Manuelle Konfiguration

Für die meisten Einrichtungen ist nur der API-Schlüssel erforderlich. So legen Sie den Provider ausdrücklich fest:

```json5
{
  env: { BASETEN_API_KEY: "..." },
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      baseten: {
        baseUrl: "https://inference.baseten.co/v1",
        apiKey: "${BASETEN_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "thinkingmachines/inkling",
            name: "Inkling",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<Note>
Wenn der Gateway als Daemon ausgeführt wird (launchd, systemd, Docker), stellen Sie sicher, dass `BASETEN_API_KEY` für diesen Prozess verfügbar ist. Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, ist für einen bereits laufenden verwalteten Dienst nicht sichtbar.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    Wählen Sie die Reasoning-Aufwandsstufen von OpenClaw aus.
  </Card>
  <Card title="Modell-CLI" href="/de/cli/models" icon="terminal">
    Erkannte Modelle auflisten, untersuchen und auswählen.
  </Card>
  <Card title="Modell-FAQ" href="/de/help/faq-models" icon="circle-question">
    Fehlerbehebung bei Authentifizierungsprofilen und der Modellauswahl.
  </Card>
</CardGroup>
