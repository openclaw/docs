---
read_when:
    - Sie möchten Tencent Hy3 preview mit OpenClaw verwenden.
    - Sie benötigen die Einrichtung des TokenHub-API-Schlüssels.
summary: Einrichtung von Tencent Cloud TokenHub für die Hy3-Vorschau
title: Tencent Cloud (TokenHub)
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T06:56:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud wird in OpenClaw als **gebündeltes Provider-Plugin** ausgeliefert. Es bietet Zugriff auf Tencent Hy3 preview über den TokenHub-Endpunkt (`tencent-tokenhub`).

Der Provider verwendet eine OpenAI-kompatible API.

| Eigenschaft    | Wert                                       |
| -------------- | ------------------------------------------ |
| Provider       | `tencent-tokenhub`                         |
| Standardmodell | `tencent-tokenhub/hy3-preview`             |
| Auth           | `TOKENHUB_API_KEY`                         |
| API            | OpenAI-kompatible Chat Completions         |
| Base-URL       | `https://tokenhub.tencentmaas.com/v1`      |
| Globale URL    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Schnellstart

<Steps>
  <Step title="Einen TokenHub-API-Schlüssel erstellen">
    Erstellen Sie einen API-Schlüssel in Tencent Cloud TokenHub. Wenn Sie für den Schlüssel einen eingeschränkten Zugriffsbereich wählen, schließen Sie **Hy3 preview** in die erlaubten Modelle ein.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Das Modell verifizieren">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Nicht-interaktives Setup

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Eingebauter Katalog

| Modell-Referenz                | Name                   | Input | Kontext | Max. Output | Hinweise                     |
| ------------------------------ | ---------------------- | ----- | ------- | ----------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256.000 | 64.000      | Standard; Reasoning aktiviert |

Hy3 preview ist das große MoE-Sprachmodell von Tencent Hunyuan für Reasoning, Long-Context-Instruktionsbefolgung, Code und Agent-Workflows. In den OpenAI-kompatiblen Beispielen von Tencent wird `hy3-preview` als Modell-ID verwendet und es unterstützt Standard-Tool-Calling für Chat-Completions sowie `reasoning_effort`.

<Tip>
Die Modell-ID ist `hy3-preview`. Verwechseln Sie sie nicht mit den `HY-3D-*`-Modellen von Tencent, bei denen es sich um 3D-Generierungs-APIs handelt und nicht um das von diesem Provider konfigurierte OpenClaw-Chatmodell.
</Tip>

## Überschreibung des Endpunkts

Standardmäßig verwendet OpenClaw den Tencent-Cloud-Endpunkt `https://tokenhub.tencentmaas.com/v1`. Tencent dokumentiert außerdem einen internationalen TokenHub-Endpunkt:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Überschreiben Sie den Endpunkt nur, wenn Ihr TokenHub-Konto oder Ihre Region dies erfordert.

## Hinweise

- TokenHub-Modell-Referenzen verwenden `tencent-tokenhub/<modelId>`.
- Der gebündelte Katalog enthält derzeit `hy3-preview`.
- Das Plugin markiert Hy3 preview als reasoning-fähig und streaming-usage-fähig.
- Das Plugin enthält gestaffelte Preismetadaten für Hy3, sodass Kostenschätzungen ohne manuelle Preisüberschreibungen befüllt werden.
- Überschreiben Sie Preis-, Kontext- oder Endpunktmetadaten in `models.providers` nur bei Bedarf.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `TOKENHUB_API_KEY`
diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Verwandte Dokumentation

- [OpenClaw Configuration](/de/gateway/configuration)
- [Model Providers](/de/concepts/model-providers)
- [Tencent-TokenHub-Produktseite](https://cloud.tencent.com/product/tokenhub)
- [Tencent TokenHub Textgenerierung](https://cloud.tencent.com/document/product/1823/130079)
- [Tencent TokenHub Cline setup for Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Tencent Hy3 preview model card](https://huggingface.co/tencent/Hy3-preview)
