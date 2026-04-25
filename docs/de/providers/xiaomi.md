---
read_when:
    - Sie möchten Xiaomi-MiMo-Modelle in OpenClaw ഉപയോഗել
    - Sie benötigen die Einrichtung von `XIAOMI_API_KEY`
summary: Xiaomi-MiMo-Modelle mit OpenClaw verwenden
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. OpenClaw verwendet den
OpenAI-kompatiblen Endpoint von Xiaomi mit API-Key-Authentifizierung.

| Eigenschaft | Wert                            |
| ----------- | ------------------------------- |
| Provider    | `xiaomi`                        |
| Auth        | `XIAOMI_API_KEY`                |
| API         | OpenAI-kompatibel               |
| Base URL    | `https://api.xiaomimimo.com/v1` |

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel in der [Xiaomi MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Oder den Schlüssel direkt übergeben:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Integrierter Katalog

| Modell-Ref             | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise      |
| ---------------------- | ----------- | --------- | ------------ | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | Text        | 262.144   | 8.192        | Nein      | Standardmodell |
| `xiaomi/mimo-v2-pro`   | Text        | 1.048.576 | 32.000       | Ja        | Großer Kontext |
| `xiaomi/mimo-v2-omni`  | Text, Bild  | 262.144   | 32.000       | Ja        | Multimodal    |

<Tip>
Die Standard-Modell-Ref ist `xiaomi/mimo-v2-flash`. Der Provider wird automatisch eingefügt, wenn `XIAOMI_API_KEY` gesetzt ist oder ein Auth-Profil existiert.
</Tip>

## Text-to-Speech

Das gebündelte `xiaomi`-Plugin registriert Xiaomi MiMo auch als Speech-Provider für
`messages.tts`. Es verwendet Xiaomis TTS-Vertrag für Chat-Completions mit dem Text als
`assistant`-Nachricht und optionaler Stilvorgabe als `user`-Nachricht.

| Eigenschaft | Wert                                     |
| ----------- | ---------------------------------------- |
| TTS-ID      | `xiaomi` (Alias `mimo`)                  |
| Auth        | `XIAOMI_API_KEY`                         |
| API         | `POST /v1/chat/completions` mit `audio`  |
| Standard    | `mimo-v2.5-tts`, Stimme `mimo_default`   |
| Ausgabe     | Standardmäßig MP3; WAV bei Konfiguration |

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

Unterstützte integrierte Stimmen sind unter anderem `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` und `Dean`. `mimo-v2-tts` wird für ältere MiMo-
TTS-Konten unterstützt; standardmäßig wird das aktuelle MiMo-V2.5-TTS-Modell verwendet. Für Ziele mit Sprachnotizen
wie Feishu und Telegram transkodiert OpenClaw die Xiaomi-Ausgabe vor der Zustellung mit `ffmpeg` in 48-kHz-
Opus.

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
  <Accordion title="Verhalten bei automatischem Einfügen">
    Der Provider `xiaomi` wird automatisch eingefügt, wenn `XIAOMI_API_KEY` in Ihrer Umgebung gesetzt ist oder ein Auth-Profil existiert. Sie müssen den Provider nicht manuell konfigurieren, es sei denn, Sie möchten Modellmetadaten oder die Base-URL überschreiben.
  </Accordion>

  <Accordion title="Modelldetails">
    - **mimo-v2-flash** — leichtgewichtig und schnell, ideal für allgemeine Textaufgaben. Keine Unterstützung für Reasoning.
    - **mimo-v2-pro** — unterstützt Reasoning mit einem Kontextfenster von 1M Tokens für Workloads mit langen Dokumenten.
    - **mimo-v2-omni** — multimodales Modell mit aktiviertem Reasoning, das sowohl Text- als auch Bildeingaben akzeptiert.

    <Note>
    Alle Modelle verwenden das Präfix `xiaomi/` (zum Beispiel `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn Modelle nicht erscheinen, prüfen Sie, ob `XIAOMI_API_KEY` gesetzt und gültig ist.
    - Wenn das Gateway als Daemon läuft, stellen Sie sicher, dass der Schlüssel diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für vom Daemon verwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv` für dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Xiaomi MiMo-Konsole" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi-MiMo-Dashboard und API-Key-Verwaltung.
  </Card>
</CardGroup>
