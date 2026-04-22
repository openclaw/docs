---
read_when:
    - Sie möchten Tencent-Hy-Modelle mit OpenClaw verwenden.
    - Sie benötigen die Einrichtung des TokenHub-API-Schlüssels.
summary: Einrichtung von Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T06:23:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Der Tencent-Cloud-Provider bietet über den TokenHub-Endpunkt (`tencent-tokenhub`) Zugriff auf Tencent-Hy-Modelle.

Der Provider verwendet eine OpenAI-kompatible API.

## Schnellstart

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Nicht-interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provider und Endpunkte

| Provider           | Endpunkt                     | Anwendungsfall          |
| ------------------ | ---------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy über Tencent TokenHub |

## Verfügbare Modelle

### tencent-tokenhub

- **hy3-preview** — Hy3-Vorschau (256K-Kontext, Reasoning, Standard)

## Hinweise

- TokenHub-Modell-Refs verwenden `tencent-tokenhub/<modelId>`.
- Überschreiben Sie bei Bedarf Preis- und Kontextmetadaten in `models.providers`.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass `TOKENHUB_API_KEY` diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

## Zugehörige Dokumentation

- [OpenClaw-Konfiguration](/de/gateway/configuration)
- [Modell-Provider](/de/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
