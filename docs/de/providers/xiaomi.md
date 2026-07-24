---
read_when:
    - Sie möchten Xiaomi-MiMo-Modelle in OpenClaw verwenden
    - Sie benötigen eine Xiaomi-MiMo-Authentifizierung oder eine Token-Plan-Einrichtung
summary: Xiaomi MiMo Pay-as-you-go- und Token-Plan-Modelle mit OpenClaw verwenden
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-24T04:54:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef79dea8332903c726f076c91b3b458e2d98534d402a412e7c156c06b2912a69
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. Das mitgelieferte `xiaomi`
Plugin (`enabledByDefault: true`, kein Installationsschritt) registriert zwei Text-
Provider sowie einen Sprachsynthese-Provider (TTS):

- `xiaomi` – nutzungsabhängig abgerechnete Schlüssel (`sk-...`)
- `xiaomi-token-plan` – Token-Plan-Schlüssel (`tp-...`) mit regionalen Endpunktvoreinstellungen

| Eigenschaft            | Wert                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-IDs           | `xiaomi` (nutzungsabhängig), `xiaomi-token-plan` (Token Plan)                                                                             |
| Auth.-Umgebungsvariablen | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                           |
| Onboarding-Flags       | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams`                                                                     |
| Direkte CLI-Flags      | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                                             |
| API                    | OpenAI-kompatible Chat Completions (`openai-completions`)                                                                                            |
| Sprachsynthesevertrag  | `speechProviders: ["xiaomi"]`                                                                                                                                 |
| Basis-URLs             | Nutzungsabhängig: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                                                               |
| Standardmodelle        | `xiaomi/mimo-v2.5`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                                             |
| TTS-Standard           | `mimo-v2.5-tts`, Stimme `mimo_default`; Voice-Design-Modell `mimo-v2.5-tts-voicedesign`                                                               |

## Erste Schritte

<Steps>
  <Step title="Den richtigen Schlüssel abrufen">
    Erstellen Sie einen nutzungsabhängig abgerechneten Schlüssel in der [Xiaomi-MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys), oder öffnen Sie die Abonnementseite Ihres Token Plans und kopieren Sie die regionale OpenAI-kompatible Basis-URL sowie den dazugehörigen `tp-...`-Schlüssel.
  </Step>

  <Step title="Onboarding ausführen">
    Nutzungsabhängige Abrechnung:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Alternativ können Sie die Schlüssel direkt übergeben:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
Das Onboarding validiert das Format des Schlüssels und warnt, wenn ein `tp-...`-Schlüssel im Pfad für die nutzungsabhängige Abrechnung oder ein `sk-...`-Schlüssel im Token-Plan-Pfad eingegeben wird.
</Tip>

## Katalog für nutzungsabhängige Abrechnung

| Modellreferenz         | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise       |
| ---------------------- | ----------- | --------- | ------------ | --------- | -------------- |
| `xiaomi/mimo-v2.5`     | Text, Bild  | 1,048,576 | 131,072      | Ja        | Standardmodell |
| `xiaomi/mimo-v2.5-pro`     | Text        | 1,048,576 | 131,072      | Ja        | Spitzenmodell  |

## Token-Plan-Katalog

Wählen Sie die Token-Plan-Authentifizierungsoption aus, die der regionalen Basis-URL entspricht, die in Xiaomis Abonnementoberfläche angezeigt wird:

| Authentifizierungsoption | Basis-URL                                  |
| ------------------------ | ------------------------------------------ |
| `xiaomi-token-plan-cn`       | `https://token-plan-cn.xiaomimimo.com/v1`                         |
| `xiaomi-token-plan-sgp`       | `https://token-plan-sgp.xiaomimimo.com/v1`                         |
| `xiaomi-token-plan-ams`       | `https://token-plan-ams.xiaomimimo.com/v1`                         |

| Modellreferenz                    | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise       |
| --------------------------------- | ----------- | --------- | ------------ | --------- | -------------- |
| `xiaomi-token-plan/mimo-v2.5-pro`                | Text        | 1,048,576 | 131,072      | Ja        | Standardmodell |
| `xiaomi-token-plan/mimo-v2.5`                | Text, Bild  | 1,048,576 | 131,072      | Ja        | Multimodal     |

`xiaomi-token-plan` benötigt zur Auflösung eine regionale Basis-URL. Der unterstützte Pfad
ist eine mitgelieferte Token-Plan-Onboarding-Option oder ein expliziter
`models.providers.xiaomi-token-plan`-Konfigurationsblock, in dem `baseUrl` festgelegt ist; ohne
eine dieser Optionen wird der Provider nicht angeboten.

## Reasoning-Modelle

`mimo-v2.5` und `mimo-v2.5-pro` unterstützen
OpenClaws [`/think`-Direktive](/de/tools/thinking) mit den Stufen `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` und `max` (Standard: `high`).

## Text-to-Speech

Das mitgelieferte `xiaomi`-Plugin registriert Xiaomi MiMo außerdem als Sprachsynthese-Provider
für `tts`. Es ruft Xiaomis Chat-Completions-TTS-Vertrag auf, wobei der
Text als `assistant`-Nachricht und optionale Stilvorgaben als `user`-
Nachricht übergeben werden.

| Eigenschaft | Wert                                     |
| ----------- | ---------------------------------------- |
| TTS-ID      | `xiaomi` (Alias `mimo`) |
| Auth.       | `XIAOMI_API_KEY`                       |
| API         | `POST /v1/chat/completions` mit `audio` |
| Standard    | `mimo-v2.5-tts`, Stimme `mimo_default` |
| Ausgabe     | Standardmäßig MP3; WAV bei entsprechender Konfiguration |

```json5
{
  tts: {
    auto: "always",
    provider: "xiaomi",
    providers: {
      xiaomi: {
        apiKey: "xiaomi_api_key",
        model: "mimo-v2.5-tts",
        speakerVoice: "mimo_default",
        format: "mp3",
        style: "Heller, natürlicher, dialogorientierter Ton.",
      },
    },
  },
}
```

Integrierte Stimmen: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Das Modell mit voreingestellten Stimmen `mimo-v2.5-tts` verwendet `audio.voice`, daher
sendet OpenClaw für dieses Modell `speakerVoice`.

Das Voice-Design-Modell `mimo-v2.5-tts-voicedesign` generiert die Stimme anhand einer
natürlichsprachlichen Stilvorgabe statt anhand einer voreingestellten Stimmen-ID. Setzen Sie `style` auf
die gewünschte Stimmbeschreibung; OpenClaw sendet sie als `user`-Nachricht, sendet
den gesprochenen Text als `assistant`-Nachricht und lässt `audio.voice` für dieses
Modell weg.

```json5
{
  tts: {
    provider: "xiaomi",
    providers: {
      xiaomi: {
        model: "mimo-v2.5-tts-voicedesign",
        format: "wav",
        style: "Warme, natürliche weibliche Stimme mit klarer Aussprache.",
      },
    },
  },
}
```

Für Kanäle, die ein Sprachmitteilungsziel für die Sprachsynthese anfordern (Discord, Feishu,
Matrix, Telegram und WhatsApp), transkodiert OpenClaw die Xiaomi-Ausgabe vor der Zustellung
mit `ffmpeg` in Mono-Opus mit 48 kHz.

## Konfigurationsbeispiel

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2.5" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Preis- und Kompatibilitäts-Flags stammen aus dem mitgelieferten Plugin-Manifest. Daher lässt das Konfigurationsbeispiel `cost` und `compat` aus, um Abweichungen vom Laufzeitverhalten zu vermeiden.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Die Preisgestaltung stammt aus dem mitgelieferten Manifest (Token-Plan-Modelle enthalten gestaffelte Preise für Cache-Lesezugriffe). Daher lässt das Konfigurationsbeispiel `cost` aus.

<AccordionGroup>
  <Accordion title="Verhalten bei automatischer Einbindung">
    Der Provider `xiaomi` wird automatisch aktiviert, wenn `XIAOMI_API_KEY` in Ihrer Umgebung festgelegt ist oder ein Authentifizierungsprofil vorhanden ist. `xiaomi-token-plan` benötigt eine regionale Basis-URL. Der unterstützte Pfad ist daher die mitgelieferte Token-Plan-Onboarding-Option oder ein expliziter `models.providers.xiaomi-token-plan`-Konfigurationsblock.
  </Accordion>

  <Accordion title="Modelldetails">
    - **mimo-v2.5** – Standardmodell für die nutzungsabhängige Abrechnung und multimodale V2.5-Route des Token Plans.
    - **mimo-v2.5-pro** – führendes Reasoning-Modell und Standardmodell des Token Plans.

    <Note>
    Modelle mit nutzungsabhängiger Abrechnung verwenden das Präfix `xiaomi/`. Token-Plan-Modelle verwenden das Präfix `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn keine Modelle angezeigt werden, überprüfen Sie, ob die relevante Schlüssel-Umgebungsvariable oder das Authentifizierungsprofil vorhanden und gültig ist.
    - Vergewissern Sie sich beim Token Plan, dass die ausgewählte Onboarding-Region der Basis-URL auf der Abonnementseite entspricht und der Schlüssel mit `tp-` beginnt.
    - Wenn der Gateway als Daemon ausgeführt wird, stellen Sie sicher, dass der Schlüssel für diesen Prozess verfügbar ist, beispielsweise in `~/.openclaw/.env` oder über `env.shellEnv`.

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell festgelegt sind, sind für von einem Daemon verwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie die Konfiguration `~/.openclaw/.env` oder `env.shellEnv`, um eine dauerhafte Verfügbarkeit sicherzustellen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Thinking-Stufen" href="/de/tools/thinking" icon="brain">
    Syntax der `/think`-Direktive und Zuordnung der Stufen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Xiaomi-MiMo-Konsole" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi-MiMo-Dashboard und Verwaltung von API-Schlüsseln.
  </Card>
</CardGroup>
