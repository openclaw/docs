---
read_when:
    - Vuoi i modelli Xiaomi MiMo in OpenClaw
    - Ti serve l'autenticazione Xiaomi MiMo oppure la configurazione di Token Plan
summary: Usare i modelli a consumo e Token Plan di Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:11:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo è la piattaforma API per i modelli **MiMo**. OpenClaw include un Plugin Xiaomi integrato con due preset di provider di testo:

- `xiaomi` per chiavi con pagamento a consumo (`sk-...`)
- `xiaomi-token-plan` per chiavi Token Plan (`tp-...`) con preset di endpoint regionali

Lo stesso Plugin registra anche il provider vocale (TTS) `xiaomi`.

| Proprietà        | Valore                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID provider      | `xiaomi` (pagamento a consumo), `xiaomi-token-plan` (Token Plan)                                                                                   |
| Plugin           | integrato, `enabledByDefault: true`                                                                                                                |
| Variabili env di auth | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                 |
| Flag di onboarding | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flag CLI diretti | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Contratti        | completamenti chat + `speechProviders`                                                                                                             |
| API              | compatibile con OpenAI (`openai-completions`)                                                                                                      |
| URL base         | Pagamento a consumo: `https://api.xiaomimimo.com/v1`; preset Token Plan: `token-plan-{cn,sgp,ams}...`                                              |
| Modelli predefiniti | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                       |
| TTS predefinito  | `mimo-v2.5-tts`, voce `mimo_default`; modello voicedesign `mimo-v2.5-tts-voicedesign`                                                              |

## Per iniziare

<Steps>
  <Step title="Ottieni la chiave corretta">
    Crea una chiave con pagamento a consumo nella [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), oppure apri la pagina del tuo abbonamento Token Plan e copia l'URL base regionale compatibile con OpenAI insieme alla chiave `tp-...` corrispondente.
  </Step>

  <Step title="Esegui l'onboarding">
    Pagamento a consumo:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Oppure passa direttamente le chiavi:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Catalogo con pagamento a consumo

| Rif. modello           | Input       | Contesto  | Output max | Ragionamento | Note                 |
| ---------------------- | ----------- | --------- | ---------- | ------------ | -------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | No           | Modello predefinito  |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | Sì           | Contesto ampio       |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | Sì           | Multimodale          |

<Tip>
Il riferimento del modello predefinito è `xiaomi/mimo-v2-flash`. Il provider viene iniettato automaticamente quando `XIAOMI_API_KEY` è impostata o quando esiste un profilo di auth.
</Tip>

## Catalogo Token Plan

Scegli l'opzione di auth Token Plan che corrisponde all'URL base regionale mostrato nell'interfaccia di abbonamento di Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Rif. modello                      | Input       | Contesto  | Output max | Ragionamento | Note                 |
| --------------------------------- | ----------- | --------- | ---------- | ------------ | -------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | text        | 1,048,576 | 131,072    | Sì           | Modello predefinito  |
| `xiaomi-token-plan/mimo-v2.5`     | text, image | 1,048,576 | 131,072    | Sì           | Multimodale          |

<Tip>
L'onboarding Token Plan convalida il formato della chiave e avvisa quando una chiave `tp-...` viene inserita nel percorso con pagamento a consumo, oppure quando una chiave `sk-...` viene inserita nel percorso Token Plan.
</Tip>

## Sintesi vocale

Il Plugin integrato `xiaomi` registra anche Xiaomi MiMo come provider vocale per
`messages.tts`. Chiama il contratto TTS dei completamenti chat di Xiaomi con il testo come
messaggio `assistant` e indicazioni di stile facoltative come messaggio `user`.

| Proprietà | Valore                                   |
| --------- | ---------------------------------------- |
| ID TTS    | `xiaomi` (alias `mimo`)                  |
| Auth      | `XIAOMI_API_KEY`                         |
| API       | `POST /v1/chat/completions` con `audio`  |
| Predefinito | `mimo-v2.5-tts`, voce `mimo_default`  |
| Output    | MP3 per impostazione predefinita; WAV quando configurato |

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

Le voci integrate supportate includono `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` e `Dean`. I modelli con voce preset usano `audio.voice`, quindi
OpenClaw invia `speakerVoice` per `mimo-v2.5-tts` e `mimo-v2-tts`.

Il modello voicedesign di Xiaomi, `mimo-v2.5-tts-voicedesign`, genera la voce
da un prompt di stile in linguaggio naturale invece che da un ID voce preset. Configura
`style` con la descrizione della voce desiderata; OpenClaw la invia come messaggio
`user`, invia il testo parlato come messaggio `assistant` e omette
`audio.voice` per questo modello.

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

Per destinazioni di note vocali come Feishu e Telegram, OpenClaw transcodifica l'output
di Xiaomi in Opus a 48 kHz con `ffmpeg` prima della consegna.

## Esempio di configurazione

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

I prezzi e i flag di compatibilità provengono dal manifest del Plugin integrato, quindi l'esempio di configurazione omette `cost` e `compat` per evitare divergenze dal comportamento runtime.

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

I prezzi provengono dal manifest integrato (i modelli Token Plan includono prezzi a livelli per la lettura dalla cache), quindi l'esempio di configurazione omette `cost`.

<AccordionGroup>
  <Accordion title="Comportamento di iniezione automatica">
    Il provider `xiaomi` viene iniettato automaticamente quando `XIAOMI_API_KEY` è impostata nel tuo ambiente o quando esiste un profilo di auth. `xiaomi-token-plan` richiede un URL base regionale, quindi il percorso supportato è l'opzione di onboarding Token Plan integrata o un blocco di configurazione `models.providers.xiaomi-token-plan` esplicito.
  </Accordion>

  <Accordion title="Dettagli dei modelli">
    - **mimo-v2-flash** — leggero e veloce, ideale per attività di testo generiche. Nessun supporto al ragionamento.
    - **mimo-v2-pro** — supporta il ragionamento con una finestra di contesto da 1M token per carichi di lavoro su documenti lunghi.
    - **mimo-v2-omni** — modello multimodale con ragionamento abilitato che accetta input sia di testo sia di immagini.
    - **mimo-v2.5-pro** — predefinito Token Plan con lo stack di ragionamento V2.5 attuale di Xiaomi.
    - **mimo-v2.5** — route V2.5 multimodale Token Plan.

    <Note>
    I modelli con pagamento a consumo usano il prefisso `xiaomi/`. I modelli Token Plan usano il prefisso `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se i modelli non vengono visualizzati, conferma che la variabile env della chiave pertinente o il profilo di auth sia presente e valido.
    - Per Token Plan, conferma che la regione di onboarding scelta corrisponda all'URL base della pagina di abbonamento e che la chiave inizi con `tp-`.
    - Quando il Gateway viene eseguito come daemon, assicurati che la chiave sia disponibile per quel processo (per esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella shell interattiva non sono visibili ai processi Gateway gestiti da daemon. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per la disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dashboard Xiaomi MiMo e gestione delle chiavi API.
  </Card>
</CardGroup>
