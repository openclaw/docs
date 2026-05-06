---
read_when:
    - Sie möchten Xiaomi MiMo-Modelle in OpenClaw verwenden
    - Sie müssen XIAOMI_API_KEY einrichten.
summary: Xiaomi MiMo-Modelle mit OpenClaw verwenden
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T07:01:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. OpenClaw enthält ein gebündeltes `xiaomi`-Plugin, das sowohl einen OpenAI-kompatiblen Chat-Provider als auch einen Sprach-Provider (TTS) mit demselben `XIAOMI_API_KEY` registriert.

| Eigenschaft     | Wert                                     |
| --------------- | ---------------------------------------- |
| Provider-ID     | `xiaomi`                                 |
| Plugin          | gebündelt, `enabledByDefault: true`      |
| Auth-Env-Var    | `XIAOMI_API_KEY`                         |
| Onboarding-Flag | `--auth-choice xiaomi-api-key`           |
| Direkte CLI-Flag | `--xiaomi-api-key <key>`                |
| Verträge        | Chat-Completions + `speechProviders`     |
| API             | OpenAI-kompatibel (`openai-completions`) |
| Basis-URL       | `https://api.xiaomimimo.com/v1`          |
| Standardmodell  | `xiaomi/mimo-v2-flash`                   |
| TTS-Standard    | `mimo-v2.5-tts`, Stimme `mimo_default`   |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel in der [Xiaomi MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Oder übergeben Sie den Schlüssel direkt:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verfügbarkeit des Modells prüfen">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Integrierter Katalog

| Modell-Ref             | Eingabe     | Kontext  | Maximale Ausgabe | Reasoning | Hinweise       |
| ---------------------- | ----------- | -------- | ---------------- | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | Text        | 262.144  | 8.192            | Nein      | Standardmodell |
| `xiaomi/mimo-v2-pro`   | Text        | 1.048.576 | 32.000          | Ja        | Großer Kontext |
| `xiaomi/mimo-v2-omni`  | Text, Bild  | 262.144  | 32.000           | Ja        | Multimodal     |

<Tip>
Die Standard-Modell-Ref ist `xiaomi/mimo-v2-flash`. Der Provider wird automatisch injiziert, wenn `XIAOMI_API_KEY` gesetzt ist oder ein Auth-Profil vorhanden ist.
</Tip>

## Text-to-Speech

Das gebündelte `xiaomi`-Plugin registriert Xiaomi MiMo außerdem als Sprach-Provider für
`messages.tts`. Es ruft Xiaomis Chat-Completions-TTS-Vertrag mit dem Text als
`assistant`-Nachricht und optionalen Stilvorgaben als `user`-Nachricht auf.

| Eigenschaft | Wert                                     |
| ----------- | ---------------------------------------- |
| TTS-ID      | `xiaomi` (`mimo`-Alias)                  |
| Auth        | `XIAOMI_API_KEY`                         |
| API         | `POST /v1/chat/completions` mit `audio`  |
| Standard    | `mimo-v2.5-tts`, Stimme `mimo_default`   |
| Ausgabe     | Standardmäßig MP3; WAV bei entsprechender Konfiguration |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Zu den unterstützten integrierten Stimmen gehören `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` und `Dean`. `mimo-v2-tts` wird für ältere MiMo-
TTS-Konten unterstützt; der Standard verwendet das aktuelle MiMo-V2.5-TTS-Modell. Für Sprachnotiz-
Ziele wie Feishu und Telegram transkodiert OpenClaw die Xiaomi-Ausgabe vor der Zustellung mit
`ffmpeg` in 48-kHz-Opus.

## Konfigurationsbeispiel

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verhalten bei automatischer Injektion">
    Der `xiaomi`-Provider wird automatisch injiziert, wenn `XIAOMI_API_KEY` in Ihrer Umgebung gesetzt ist oder ein Auth-Profil vorhanden ist. Sie müssen den Provider nicht manuell konfigurieren, es sei denn, Sie möchten Modellmetadaten oder die Basis-URL überschreiben.
  </Accordion>

  <Accordion title="Modelldetails">
    - **mimo-v2-flash** — leichtgewichtig und schnell, ideal für allgemeine Textaufgaben. Keine Reasoning-Unterstützung.
    - **mimo-v2-pro** — unterstützt Reasoning mit einem Kontextfenster von 1 Mio. Token für Workloads mit langen Dokumenten.
    - **mimo-v2-omni** — Reasoning-fähiges multimodales Modell, das sowohl Text- als auch Bildeingaben akzeptiert.

    <Note>
    Alle Modelle verwenden das Präfix `xiaomi/` (zum Beispiel `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn Modelle nicht angezeigt werden, bestätigen Sie, dass `XIAOMI_API_KEY` gesetzt und gültig ist.
    - Wenn der Gateway als Daemon ausgeführt wird, stellen Sie sicher, dass der Schlüssel für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für vom Daemon verwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv` für dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Xiaomi MiMo-Konsole" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo-Dashboard und API-Schlüsselverwaltung.
  </Card>
</CardGroup>
