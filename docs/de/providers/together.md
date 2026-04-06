---
read_when:
    - Sie möchten Together AI mit OpenClaw verwenden
    - Sie benötigen die API-Key-Umgebungsvariable oder die CLI-Authentifizierungsoption
summary: Einrichtung von Together AI (Authentifizierung + Modellauswahl)
title: Together AI
x-i18n:
    generated_at: "2026-04-06T03:11:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b68fdc15bfcac8d59e3e0c06a39162abd48d9d41a9a64a0ac622cd8e3f80a595
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) bietet Zugriff auf führende Open-Source-Modelle wie Llama, DeepSeek, Kimi und weitere über eine einheitliche API.

- Provider: `together`
- Auth: `TOGETHER_API_KEY`
- API: OpenAI-kompatibel
- Base URL: `https://api.together.xyz/v1`

## Schnellstart

1. Setzen Sie den API-Key (empfohlen: für das Gateway speichern):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Setzen Sie ein Standardmodell:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Dadurch wird `together/moonshotai/Kimi-K2.5` als Standardmodell gesetzt.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `TOGETHER_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Together-Katalog aus:

| Model ref                                                    | Name                                   | Eingabe     | Kontext    | Hinweise                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | Text, Bild  | 262,144    | Standardmodell; Reasoning aktiviert |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | Text        | 202,752    | Allgemeines Textmodell           |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | Text        | 131,072    | Schnelles Instruct-Modell        |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | Text, Bild  | 10,000,000 | Multimodal                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | Text, Bild  | 20,000,000 | Multimodal                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | Text        | 131,072    | Allgemeines Textmodell           |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | Text        | 131,072    | Reasoning-Modell                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | Text        | 262,144    | Sekundäres Kimi-Textmodell       |

Das Onboarding-Preset setzt `together/moonshotai/Kimi-K2.5` als Standardmodell.

## Videogenerierung

Das gebündelte Plugin `together` registriert auch Videogenerierung über das
gemeinsame Tool `video_generate`.

- Standard-Videomodell: `together/Wan-AI/Wan2.2-T2V-A14B`
- Modi: Text-zu-Video und Abläufe mit Einzelbild-Referenz
- Unterstützt `aspectRatio` und `resolution`

So verwenden Sie Together als Standard-Video-Provider:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

Unter [Videogenerierung](/tools/video-generation) finden Sie die gemeinsamen Tool-
Parameter, die Provider-Auswahl und das Failover-Verhalten.
