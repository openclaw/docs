---
read_when:
    - Sie möchten Together AI mit OpenClaw verwenden
    - Sie benötigen die API-Schlüssel-Umgebungsvariable oder die CLI-Authentifizierungsauswahl.
summary: Einrichtung von Together AI (Authentifizierung + Modellauswahl)
title: Together AI
x-i18n:
    generated_at: "2026-07-24T04:53:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9b08cae93c1ea7df46e1d2fbe78692f73bb3e56809122f70a56eec8b3dc5d8a4
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) bietet über eine einheitliche API Zugriff auf führende Open-Source-
Modelle, darunter Llama, DeepSeek, Kimi und weitere.
OpenClaw bündelt es als Provider `together`.

| Eigenschaft | Wert                         |
| -------- | ----------------------------- |
| Provider | `together`                    |
| Authentifizierung     | `TOGETHER_API_KEY`            |
| API      | OpenAI-kompatibel             |
| Basis-URL | `https://api.together.xyz/v1` |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie unter
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) einen API-Schlüssel.
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
Beim Onboarding wird `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` als
Standardmodell festgelegt.
</Note>

## Integrierter Katalog

Die Kosten werden in USD pro Million Token angegeben.

| Modellreferenz                                          | Name                         | Eingabe       | Kontext | Maximale Ausgabe | Kosten (Ein-/Ausgabe) | Hinweise               |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | Text        | 131,072 | 8,192      | 0.88 / 0.88   | Standardmodell       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | Text, Bild | 262,144 | 32,768     | 1.20 / 4.50   | Reasoning-Modell     |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | Text        | 512,000 | 8,192      | 2.10 / 4.40   | Reasoning-Modell     |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | Text        | 32,768  | 8,192      | 0.30 / 0.30   | Schnell, ohne Reasoning |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | Text        | 202,752 | 8,192      | 1.40 / 4.40   | Reasoning-Modell     |

## Videogenerierung

Das gebündelte Plugin `together` registriert außerdem die Videogenerierung über das
gemeinsame Tool `video_generate`.

| Eigenschaft             | Wert                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Standard-Videomodell  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| Weitere Modelle         | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/hailuo-02`, `kwaivgI/kling-2.1-master`                 |
| Modi                | Text-zu-Video; Bild-zu-Video nur mit `Wan-AI/Wan2.2-I2V-A14B` (einzelnes Referenzbild) |
| Dauer             | 1-10 Sekunden                                                                              |
| Unterstützte Parameter | `size` (als `<width>x<height>` geparst); `aspectRatio`/`resolution` werden nicht gelesen            |

So verwenden Sie Together als Standard-Provider für Videos:

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
Unter [Videogenerierung](/de/tools/video-generation) finden Sie die gemeinsamen Tool-Parameter,
die Provider-Auswahl und das Failover-Verhalten.
</Tip>

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher,
    dass `TOGETHER_API_KEY` für diesen Prozess verfügbar ist (beispielsweise in
    `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell festgelegt sind, sind für von einem Daemon verwaltete
    Gateway-Prozesse nicht sichtbar. Verwenden Sie für die
    dauerhafte Verfügbarkeit die Konfiguration `~/.openclaw/.env` oder `env.shellEnv`.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Überprüfen Sie, ob Ihr Schlüssel funktioniert: `openclaw models list --provider together`
    - Wenn Modelle nicht angezeigt werden, vergewissern Sie sich, dass der API-Schlüssel in der richtigen
      Umgebung für Ihren Gateway-Prozess festgelegt ist.
    - Modellreferenzen verwenden das Format `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Videogenerierungs-Tools und Provider-Auswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich der Provider-Einstellungen.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together-AI-Dashboard, API-Dokumentation und Preise.
  </Card>
</CardGroup>
