---
read_when:
    - Sie möchten Together AI mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die Authentifizierungsauswahl der CLI
summary: Einrichtung von Together AI (Authentifizierung + Modellauswahl)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:07:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) bietet Zugriff auf führende Open-Source-
Modelle wie Llama, DeepSeek, Kimi und weitere über eine einheitliche API.

| Eigenschaft | Wert                          |
| ----------- | ----------------------------- |
| Provider    | `together`                    |
| Auth        | `TOGETHER_API_KEY`            |
| API         | OpenAI-kompatibel             |
| Basis-URL   | `https://api.together.xyz/v1` |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Standardmodell festlegen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
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
Die Onboarding-Voreinstellung legt
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` als Standardmodell fest.
</Note>

## Integrierter Katalog

OpenClaw liefert diesen gebündelten Together-Katalog mit:

| Modell-Ref                                         | Name                         | Eingabe     | Kontext | Hinweise             |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | Text        | 131.072 | Standardmodell       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | Text, Bild  | 262.144 | Kimi Reasoning Model |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | Text        | 512.000 | Reasoning-Textmodell |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | Text        | 32.768  | Schnelles Textmodell |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | Text        | 202.752 | Reasoning-Textmodell |

## Videogenerierung

Das gebündelte `together`-Plugin registriert außerdem die Videogenerierung über das
gemeinsame Tool `video_generate`.

| Eigenschaft            | Wert                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Standard-Videomodell   | `together/Wan-AI/Wan2.2-T2V-A14B`                                                        |
| Modi                   | Text-zu-Video; Einzelbildreferenz nur mit `Wan-AI/Wan2.2-I2V-A14B`                       |
| Unterstützte Parameter | `aspectRatio`, `resolution`                                                              |

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

<Tip>
Siehe [Videogenerierung](/de/tools/video-generation) für die gemeinsamen Tool-Parameter,
Provider-Auswahl und das Failover-Verhalten.
</Tip>

<AccordionGroup>
  <Accordion title="Umgebungshinweis">
    Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher,
    dass `TOGETHER_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für von Daemons
    verwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie die Konfiguration
    `~/.openclaw/.env` oder `env.shellEnv` für dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Prüfen Sie, ob Ihr Schlüssel funktioniert: `openclaw models list --provider together`
    - Wenn Modelle nicht angezeigt werden, bestätigen Sie, dass der API-Schlüssel in der richtigen
      Umgebung für Ihren Gateway-Prozess gesetzt ist.
    - Modell-Refs verwenden die Form `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Tool-Parameter für die Videogenerierung und Provider-Auswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI-Dashboard, API-Dokumentation und Preise.
  </Card>
</CardGroup>
