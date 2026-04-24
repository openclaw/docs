---
read_when:
    - Vuoi usare Fireworks con OpenClaw
    - Hai bisogno della variabile env della chiave API Fireworks o dell'ID del modello predefinito
summary: Configurazione Fireworks (auth + selezione del modello)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T08:56:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) espone modelli open-weight e instradati tramite un'API compatibile con OpenAI. OpenClaw include un Plugin provider Fireworks incluso.

| Proprietà     | Valore                                                 |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions compatibile con OpenAI                |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Modello predefinito | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Per iniziare

<Steps>
  <Step title="Configura l'auth Fireworks tramite onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Questo memorizza la tua chiave Fireworks nella configurazione OpenClaw e imposta il modello iniziale Fire Pass come predefinito.

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Esempio non interattivo

Per configurazioni scriptate o CI, passa tutti i valori sulla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogo integrato

| Model ref                                              | Nome                        | Input      | Contesto | Output max | Note                                                                                                                                                 |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144  | 262,144    | Ultimo modello Kimi su Fireworks. Il thinking è disabilitato per le richieste Fireworks K2.6; instrada direttamente tramite Moonshot se ti serve l'output di thinking di Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000    | Modello iniziale predefinito incluso su Fireworks                                                                                                    |

<Tip>
Se Fireworks pubblica un modello più recente, come una nuova release Qwen o Gemma, puoi passare direttamente a quel modello usando il suo model id Fireworks senza aspettare un aggiornamento del catalogo incluso.
</Tip>

## Model id Fireworks personalizzati

OpenClaw accetta anche model id Fireworks dinamici. Usa l'esatto model o router id mostrato da Fireworks e anteponi `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Come funziona il prefisso del model id">
    Ogni model ref Fireworks in OpenClaw inizia con `fireworks/` seguito dall'esatto id o percorso router dalla piattaforma Fireworks. Per esempio:

    - Modello router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modello diretto: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw rimuove il prefisso `fireworks/` quando costruisce la richiesta API e invia il percorso rimanente all'endpoint Fireworks.

  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway gira fuori dalla tua shell interattiva, assicurati che `FIREWORKS_API_KEY` sia disponibile anche per quel processo.

    <Warning>
    Una chiave presente solo in `~/.profile` non aiuterà un daemon launchd/systemd a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per assicurarti che il processo gateway possa leggerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, model ref e comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
