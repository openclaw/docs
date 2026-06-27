---
read_when:
    - Vuoi usare l'anteprima di Tencent Hy3 con OpenClaw
    - Devi configurare la chiave API di TokenHub
summary: Configurazione di Tencent Cloud TokenHub per l'anteprima Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:10:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Installa il Plugin provider ufficiale Tencent Cloud per accedere a Tencent Hy3 preview tramite l'endpoint TokenHub (`tencent-tokenhub`) usando un'API compatibile con OpenAI.

| Proprietà        | Valore                                                |
| ---------------- | ----------------------------------------------------- |
| ID provider      | `tencent-tokenhub`                                    |
| Pacchetto        | `@openclaw/tencent-provider`                          |
| Variabile env auth | `TOKENHUB_API_KEY`                                  |
| Flag di onboarding | `--auth-choice tokenhub-api-key`                    |
| Flag CLI diretto | `--tokenhub-api-key <key>`                            |
| API              | Compatibile con OpenAI (`openai-completions`)         |
| URL base predefinito | `https://tokenhub.tencentmaas.com/v1`             |
| URL base globale | `https://tokenhub-intl.tencentmaas.com/v1` (override) |
| Modello predefinito | `tencent-tokenhub/hy3-preview`                     |

## Avvio rapido

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    Crea una chiave API in Tencent Cloud TokenHub. Se scegli un ambito di accesso limitato per la chiave, includi **Hy3 preview** nei modelli consentiti.
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Configurazione non interattiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogo integrato

| Rif. modello                   | Nome                   | Input | Contesto | Output max | Note                       |
| ------------------------------ | ---------------------- | ----- | -------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000  | 64,000     | Predefinito; reasoning abilitato |

Hy3 preview è il grande modello linguistico MoE di Tencent Hunyuan per reasoning, esecuzione di istruzioni a contesto lungo, codice e workflow agentici. Gli esempi compatibili con OpenAI di Tencent usano `hy3-preview` come ID modello e supportano la chiamata strumenti standard delle chat completions più `reasoning_effort`.

<Tip>
  L'ID modello è `hy3-preview`. Non confonderlo con i modelli `HY-3D-*` di Tencent, che sono API di generazione 3D e non sono il modello chat OpenClaw configurato da questo provider.
</Tip>

## Prezzi a scaglioni

Il catalogo del provider include metadati di costo a scaglioni che scalano con la lunghezza della finestra di input, quindi le stime dei costi vengono popolate senza override manuali.

| Intervallo token di input | Tariffa input | Tariffa output | Lettura cache |
| ------------------------- | ------------- | -------------- | ------------- |
| 0 - 16,000                | 0.176         | 0.587          | 0.059         |
| 16,000 - 32,000           | 0.235         | 0.939          | 0.088         |
| 32,000+                   | 0.293         | 1.173          | 0.117         |

Le tariffe sono per milione di token in USD, come pubblicizzato da Tencent. Esegui l'override dei prezzi in `models.providers.tencent-tokenhub` solo quando hai bisogno di una superficie diversa.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw usa per impostazione predefinita l'endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent documenta anche un endpoint TokenHub internazionale:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Esegui l'override dell'endpoint solo quando il tuo account TokenHub o la tua regione lo richiede.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Se il Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), `TOKENHUB_API_KEY` deve essere visibile a quel processo. Impostalo in `~/.openclaw/.env` o tramite `env.shellEnv` in modo che gli ambienti launchd, systemd o Docker exec possano leggerlo.

    <Warning>
      Le chiavi esportate solo in una shell interattiva non sono visibili ai processi gateway gestiti. Usa il file env o la seam di configurazione per una disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model providers" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Pagina prodotto TokenHub di Tencent Cloud.
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Dettagli e benchmark di Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
