---
read_when:
    - Sie möchten Xiaomi-MiMo-Modelle in OpenClaw verwenden
    - Sie müssen die Xiaomi-MiMo-Authentifizierung oder den Token Plan einrichten
summary: Nutzen Sie die Pay-as-you-go- und Token-Plan-Modelle von Xiaomi MiMo mit OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T15:50:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. Das gebündelte `xiaomi`-
Plugin (`enabledByDefault: true`, kein Installationsschritt) registriert zwei Text-
Provider sowie einen Sprachausgabe-Provider (TTS):

- `xiaomi` – nutzungsabhängig abgerechnete Schlüssel (`sk-...`)
- `xiaomi-token-plan` – Token-Plan-Schlüssel (`tp-...`) mit regionalen Endpunktvorgaben

| Eigenschaft          | Wert                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-IDs         | `xiaomi` (nutzungsabhängige Abrechnung), `xiaomi-token-plan` (Token Plan)                                                                           |
| Auth.-Umgebungsvar.  | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Onboarding-Flags     | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Direkte CLI-Flags    | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                  | OpenAI-kompatible Chat Completions (`openai-completions`)                                                                                          |
| Sprachvertrag        | `speechProviders: ["xiaomi"]`                                                                                                                      |
| Basis-URLs           | Nutzungsabhängig: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                         |
| Standardmodelle      | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS-Standard         | `mimo-v2.5-tts`, Stimme `mimo_default`; Voice-Design-Modell `mimo-v2.5-tts-voicedesign`                                                             |

## Erste Schritte

<Steps>
  <Step title="Den richtigen Schlüssel beziehen">
    Erstellen Sie einen nutzungsabhängig abgerechneten Schlüssel in der [Xiaomi-MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys), oder öffnen Sie die Abonnementseite Ihres Token Plan und kopieren Sie die regionale OpenAI-kompatible Basis-URL sowie den zugehörigen `tp-...`-Schlüssel.
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
Das Onboarding validiert das Format des Schlüssels und warnt, wenn ein `tp-...`-Schlüssel im Pfad für nutzungsabhängige Abrechnung oder ein `sk-...`-Schlüssel im Token-Plan-Pfad eingegeben wird.
</Tip>

## Katalog für nutzungsabhängige Abrechnung

| Modellreferenz         | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise       |
| ---------------------- | ----------- | --------- | ------------- | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | Text        | 262,144   | 8,192         | Nein      | Standardmodell |
| `xiaomi/mimo-v2-pro`   | Text        | 1,048,576 | 32,000        | Ja        | Großer Kontext |
| `xiaomi/mimo-v2-omni`  | Text, Bild  | 262,144   | 32,000        | Ja        | Multimodal     |

## Token-Plan-Katalog

Wählen Sie die Token-Plan-Authentifizierungsoption, die der regionalen Basis-URL in der Abonnementoberfläche von Xiaomi entspricht:

| Authentifizierungsoption | Basis-URL                                  |
| ------------------------ | ------------------------------------------ |
| `xiaomi-token-plan-cn`   | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp`  | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams`  | `https://token-plan-ams.xiaomimimo.com/v1` |

| Modellreferenz                    | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise       |
| --------------------------------- | ----------- | --------- | ------------- | --------- | -------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | Text        | 1,048,576 | 131,072       | Ja        | Standardmodell |
| `xiaomi-token-plan/mimo-v2.5`     | Text, Bild  | 1,048,576 | 131,072       | Ja        | Multimodal     |

`xiaomi-token-plan` benötigt zur Auflösung eine regionale Basis-URL. Der unterstützte
Pfad ist eine gebündelte Token-Plan-Onboarding-Option oder ein expliziter
`models.providers.xiaomi-token-plan`-Konfigurationsblock mit gesetztem `baseUrl`;
ohne eine dieser Optionen wird der Provider nicht angeboten.

## Reasoning-Modelle

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` und `mimo-v2.5-pro` unterstützen
die [`/think`-Direktive](/de/tools/thinking) von OpenClaw mit den Stufen `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` und `max` (Standard: `high`).
`mimo-v2-flash` unterstützt kein Reasoning.

## Text-to-Speech

Das gebündelte `xiaomi`-Plugin registriert Xiaomi MiMo außerdem als Sprachausgabe-
Provider für `messages.tts`. Es ruft Xiaomis Chat-Completions-TTS-Vertrag auf,
wobei der Text als `assistant`-Nachricht und optionale Stilvorgaben als `user`-
Nachricht übermittelt werden.

| Eigenschaft | Wert                                          |
| ----------- | --------------------------------------------- |
| TTS-ID      | `xiaomi` (`mimo`-Alias)                       |
| Auth.       | `XIAOMI_API_KEY`                              |
| API         | `POST /v1/chat/completions` mit `audio`       |
| Standard    | `mimo-v2.5-tts`, Stimme `mimo_default`        |
| Ausgabe     | Standardmäßig MP3; bei Konfiguration WAV      |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Heller, natürlicher, dialogorientierter Ton.",
        },
      },
    },
  },
}
```

Integrierte Stimmen: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Modelle mit voreingestellten Stimmen (`mimo-v2.5-tts`, `mimo-v2-tts`)
verwenden `audio.voice`; daher sendet OpenClaw für diese Modelle `speakerVoice`.

Das Voice-Design-Modell `mimo-v2.5-tts-voicedesign` erzeugt die Stimme aus einer
natürlichsprachlichen Stilvorgabe statt aus einer voreingestellten Stimmen-ID.
Setzen Sie `style` auf die gewünschte Stimmenbeschreibung; OpenClaw sendet sie als
`user`-Nachricht, den gesprochenen Text als `assistant`-Nachricht und lässt bei
diesem Modell `audio.voice` weg.

```json5
{
  messages: {
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
  },
}
```

Für Kanäle, die ein Sprachmitteilungs-Syntheseziel anfordern (Discord, Feishu,
Matrix, Telegram und WhatsApp), transkodiert OpenClaw die Xiaomi-Ausgabe vor der
Zustellung mit `ffmpeg` in 48-kHz-Mono-Opus.

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Preis- und Kompatibilitäts-Flags stammen aus dem Manifest des gebündelten Plugins. Daher lässt das Konfigurationsbeispiel `cost` und `compat` aus, um Abweichungen vom Laufzeitverhalten zu vermeiden.

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

Die Preisangaben stammen aus dem gebündelten Manifest (Token-Plan-Modelle enthalten gestaffelte Preise für Cache-Lesezugriffe). Daher lässt das Konfigurationsbeispiel `cost` aus.

<AccordionGroup>
  <Accordion title="Verhalten der automatischen Einbindung">
    Der Provider `xiaomi` wird automatisch aktiviert, wenn `XIAOMI_API_KEY` in Ihrer Umgebung gesetzt ist oder ein Authentifizierungsprofil vorhanden ist. `xiaomi-token-plan` benötigt eine regionale Basis-URL. Der unterstützte Pfad ist daher die gebündelte Token-Plan-Onboarding-Option oder ein expliziter `models.providers.xiaomi-token-plan`-Konfigurationsblock.
  </Accordion>

  <Accordion title="Modelldetails">
    - **mimo-v2-flash** – schlank und schnell, ideal für allgemeine Textaufgaben. Keine Reasoning-Unterstützung.
    - **mimo-v2-pro** – unterstützt Reasoning mit einem Kontextfenster von 1M Token für die Verarbeitung langer Dokumente.
    - **mimo-v2-omni** – Reasoning-fähiges multimodales Modell, das sowohl Text- als auch Bildeingaben akzeptiert.
    - **mimo-v2.5-pro** – Token-Plan-Standard mit Xiaomis aktuellem V2.5-Reasoning-Stack.
    - **mimo-v2.5** – multimodale V2.5-Route des Token Plan.

    <Note>
    Modelle mit nutzungsabhängiger Abrechnung verwenden das Präfix `xiaomi/`. Token-Plan-Modelle verwenden das Präfix `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn Modelle nicht angezeigt werden, stellen Sie sicher, dass die entsprechende Umgebungsvariable für den Schlüssel oder ein Authentifizierungsprofil vorhanden und gültig ist.
    - Stellen Sie beim Token Plan sicher, dass die im Onboarding gewählte Region der Basis-URL auf der Abonnementseite entspricht und der Schlüssel mit `tp-` beginnt.
    - Wenn der Gateway als Daemon ausgeführt wird, stellen Sie sicher, dass der Schlüssel für diesen Prozess verfügbar ist, beispielsweise in `~/.openclaw/.env` oder über `env.shellEnv`.

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für Daemon-verwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv`, um dauerhafte Verfügbarkeit zu gewährleisten.
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
