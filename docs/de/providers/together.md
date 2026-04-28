---
read_when:
- Sie möchten Together AI mit OpenClaw verwenden
- You need the API key env var or CLI auth choice
summary: Einrichtung von Together AI (Auth + Modellauswahl)
title: Together AI
x-i18n:
  generated_at: '2026-04-24T06:56:17Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
  source_path: providers/together.md
  workflow: 15
---

[Together AI](https://together.ai) bietet über eine einheitliche API Zugriff auf führende Open-Source-
Modelle, darunter Llama, DeepSeek, Kimi und mehr.

| Eigenschaft | Wert                          |
| ----------- | ----------------------------- |
| Anbieter    | `together`                    |
| Auth        | `TOGETHER_API_KEY`            |
| API         | OpenAI-kompatibel             |
| Base-URL    | `https://api.together.xyz/v1` |

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel beziehen">
    Erstellen Sie einen API-Schlüssel unter
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Ein Standardmodell setzen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Das Onboarding-Preset setzt `together/moonshotai/Kimi-K2.5` als Standard-
modell.
</Note>

## Integrierter Katalog

OpenClaw liefert diesen gebündelten Together-Katalog aus:

| Modellreferenz                                               | Name                                   | Eingabe     | Kontext    | Hinweise                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | Text, Bild  | 262,144    | Standardmodell; Reasoning aktiviert |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | Text        | 202,752    | Allzweck-Textmodell              |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | Text        | 131,072    | Schnelles Instruct-Modell        |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | Text, Bild  | 10,000,000 | Multimodal                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | Text, Bild  | 20,000,000 | Multimodal                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | Text        | 131,072    | Allgemeines Textmodell           |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | Text        | 131,072    | Reasoning-Modell                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | Text        | 262,144    | Sekundäres Kimi-Textmodell       |

## Videogenerierung

Das gebündelte Plugin `together` registriert außerdem Videogenerierung über das
gemeinsame Tool `video_generate`.

| Eigenschaft            | Wert                                  |
| ---------------------- | ------------------------------------- |
| Standard-Videomodell   | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Modi                   | Text-zu-Video, Referenz mit Einzelbild |
| Unterstützte Parameter | `aspectRatio`, `resolution`           |

Um Together als Standardanbieter für Video zu verwenden:

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

<Tip>
Siehe [Videogenerierung](/de/tools/video-generation) für die gemeinsamen Tool-Parameter,
Anbieterauswahl und Failover-Verhalten.
</Tip>

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass
    `TOGETHER_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für daemonverwaltete
    Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv`, um
    dauerhafte Verfügbarkeit sicherzustellen.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Prüfen Sie, ob Ihr Schlüssel funktioniert: `openclaw models list --provider together`
    - Wenn keine Modelle erscheinen, bestätigen Sie, dass der API-Schlüssel in der korrekten
      Umgebung für Ihren Gateway-Prozess gesetzt ist.
    - Modellreferenzen verwenden das Format `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Anbieterregeln, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für das Tool zur Videogenerierung und Anbieterauswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Anbietereinstellungen.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dashboard, API-Dokumentation und Preise von Together AI.
  </Card>
</CardGroup>
