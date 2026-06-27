---
read_when:
    - Sie möchten Xiaomi-MiMo-Modelle in OpenClaw
    - Sie benötigen die Einrichtung von Xiaomi MiMo Auth oder Token Plan
summary: Xiaomi MiMo Pay-as-you-go- und Token-Plan-Modelle mit OpenClaw verwenden
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:08:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo ist die API-Plattform für **MiMo**-Modelle. OpenClaw enthält ein gebündeltes Xiaomi-Plugin mit zwei Text-Provider-Voreinstellungen:

- `xiaomi` für nutzungsbasierte Schlüssel (`sk-...`)
- `xiaomi-token-plan` für Token-Plan-Schlüssel (`tp-...`) mit regionalen Endpoint-Voreinstellungen

Dasselbe Plugin registriert auch den `xiaomi`-Speech-Provider (TTS).

| Eigenschaft          | Wert                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-IDs         | `xiaomi` (nutzungsbasiert), `xiaomi-token-plan` (Token Plan)                                                                                       |
| Plugin               | gebündelt, `enabledByDefault: true`                                                                                                                |
| Auth-Umgebungsvariablen | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                   |
| Onboarding-Flags     | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Direkte CLI-Flags    | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Verträge             | Chat Completions + `speechProviders`                                                                                                               |
| API                  | OpenAI-kompatibel (`openai-completions`)                                                                                                           |
| Basis-URLs           | Nutzungsbasiert: `https://api.xiaomimimo.com/v1`; Token-Plan-Voreinstellungen: `token-plan-{cn,sgp,ams}...`                                       |
| Standardmodelle      | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS-Standard         | `mimo-v2.5-tts`, Stimme `mimo_default`; Voicedesign-Modell `mimo-v2.5-tts-voicedesign`                                                             |

## Erste Schritte

<Steps>
  <Step title="Den richtigen Schlüssel abrufen">
    Erstellen Sie einen nutzungsbasierten Schlüssel in der [Xiaomi MiMo-Konsole](https://platform.xiaomimimo.com/#/console/api-keys), oder öffnen Sie Ihre Token-Plan-Abonnementseite und kopieren Sie die regionale OpenAI-kompatible Basis-URL sowie den passenden `tp-...`-Schlüssel.
  </Step>

  <Step title="Onboarding ausführen">
    Nutzungsbasiert:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Oder übergeben Sie die Schlüssel direkt:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Nutzungsbasierter Katalog

| Modellreferenz         | Eingabe     | Kontext  | Max. Ausgabe | Reasoning | Hinweise       |
| ---------------------- | ----------- | -------- | ------------ | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | Text        | 262,144  | 8,192        | Nein      | Standardmodell |
| `xiaomi/mimo-v2-pro`   | Text        | 1,048,576 | 32,000      | Ja        | Großer Kontext |
| `xiaomi/mimo-v2-omni`  | Text, Bild  | 262,144  | 32,000       | Ja        | Multimodal     |

<Tip>
Die Standardmodellreferenz ist `xiaomi/mimo-v2-flash`. Der Provider wird automatisch injiziert, wenn `XIAOMI_API_KEY` gesetzt ist oder ein Auth-Profil vorhanden ist.
</Tip>

## Token-Plan-Katalog

Wählen Sie die Token-Plan-Auth-Option, die zur regionalen Basis-URL passt, die in Xiaomis Abonnement-UI angezeigt wird:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Modellreferenz                    | Eingabe     | Kontext   | Max. Ausgabe | Reasoning | Hinweise       |
| --------------------------------- | ----------- | --------- | ------------ | --------- | -------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | Text        | 1,048,576 | 131,072      | Ja        | Standardmodell |
| `xiaomi-token-plan/mimo-v2.5`     | Text, Bild  | 1,048,576 | 131,072      | Ja        | Multimodal     |

<Tip>
Das Token-Plan-Onboarding validiert die Schlüsselform und warnt, wenn ein `tp-...`-Schlüssel im nutzungsbasierten Pfad eingegeben wird oder ein `sk-...`-Schlüssel im Token-Plan-Pfad.
</Tip>

## Text-to-Speech

Das gebündelte `xiaomi`-Plugin registriert Xiaomi MiMo auch als Speech-Provider für
`messages.tts`. Es ruft Xiaomis Chat-Completions-TTS-Vertrag mit dem Text als
`assistant`-Nachricht und optionalen Stilhinweisen als `user`-Nachricht auf.

| Eigenschaft | Wert                                     |
| ----------- | ---------------------------------------- |
| TTS-ID      | `xiaomi` (`mimo`-Alias)                  |
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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Unterstützte integrierte Stimmen sind unter anderem `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` und `Dean`. Modelle mit voreingestellten Stimmen verwenden `audio.voice`, daher
sendet OpenClaw `speakerVoice` für `mimo-v2.5-tts` und `mimo-v2-tts`.

Xiaomis Voicedesign-Modell `mimo-v2.5-tts-voicedesign` erzeugt die Stimme
aus einem natürlichsprachlichen Stil-Prompt statt aus einer voreingestellten Stimm-ID. Konfigurieren Sie
`style` mit der gewünschten Stimmbeschreibung; OpenClaw sendet sie als `user`-
Nachricht, sendet den gesprochenen Text als `assistant`-Nachricht und lässt
`audio.voice` für dieses Modell weg.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Für Sprachnotiz-Ziele wie Feishu und Telegram transkodiert OpenClaw die Xiaomi-
Ausgabe vor der Zustellung mit `ffmpeg` in 48-kHz-Opus.

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

Preise und Kompatibilitäts-Flags stammen aus dem gebündelten Plugin-Manifest, daher lässt das Konfigurationsbeispiel `cost` und `compat` weg, um Abweichungen vom Laufzeitverhalten zu vermeiden.

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

Die Preise stammen aus dem gebündelten Manifest (Token-Plan-Modelle enthalten gestaffelte Preise für Cache-Lesezugriffe), daher lässt das Konfigurationsbeispiel `cost` weg.

<AccordionGroup>
  <Accordion title="Verhalten bei automatischer Injektion">
    Der `xiaomi`-Provider wird automatisch injiziert, wenn `XIAOMI_API_KEY` in Ihrer Umgebung gesetzt ist oder ein Auth-Profil vorhanden ist. `xiaomi-token-plan` benötigt eine regionale Basis-URL, daher ist der unterstützte Pfad die gebündelte Token-Plan-Onboarding-Option oder ein expliziter Konfigurationsblock `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Modelldetails">
    - **mimo-v2-flash** — leichtgewichtig und schnell, ideal für allgemeine Textaufgaben. Keine Reasoning-Unterstützung.
    - **mimo-v2-pro** — unterstützt Reasoning mit einem Kontextfenster von 1 Mio. Token für Workloads mit langen Dokumenten.
    - **mimo-v2-omni** — Reasoning-fähiges multimodales Modell, das sowohl Text- als auch Bildeingaben akzeptiert.
    - **mimo-v2.5-pro** — Token-Plan-Standard mit Xiaomis aktuellem V2.5-Reasoning-Stack.
    - **mimo-v2.5** — multimodale V2.5-Route für Token Plan.

    <Note>
    Nutzungsbasierte Modelle verwenden das Präfix `xiaomi/`. Token-Plan-Modelle verwenden das Präfix `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Problembehandlung">
    - Wenn Modelle nicht erscheinen, prüfen Sie, ob die relevante Schlüssel-Umgebungsvariable oder das Auth-Profil vorhanden und gültig ist.
    - Prüfen Sie bei Token Plan, ob die ausgewählte Onboarding-Region zur Basis-URL der Abonnementseite passt und ob der Schlüssel mit `tp-` beginnt.
    - Wenn der Gateway als Daemon ausgeführt wird, stellen Sie sicher, dass der Schlüssel für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für daemonverwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv` für dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Xiaomi MiMo-Konsole" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo-Dashboard und API-Schlüsselverwaltung.
  </Card>
</CardGroup>
