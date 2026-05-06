---
read_when:
    - Vuoi usare l'anteprima di Tencent Hy3 con OpenClaw
    - È necessario configurare la chiave API di TokenHub
summary: Configurazione di Tencent Cloud TokenHub per l'anteprima di Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:06:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud viene distribuito come Plugin provider in bundle in OpenClaw. Offre accesso a Tencent Hy3 preview tramite l'endpoint TokenHub (`tencent-tokenhub`) usando un'API compatibile con OpenAI.

| Proprietà        | Valore                                                |
| ---------------- | ----------------------------------------------------- |
| ID provider      | `tencent-tokenhub`                                    |
| Plugin           | in bundle, `enabledByDefault: true`                   |
| Variabile env di autenticazione | `TOKENHUB_API_KEY`                      |
| Flag di onboarding | `--auth-choice tokenhub-api-key`                    |
| Flag CLI diretto | `--tokenhub-api-key <key>`                            |
| API              | compatibile con OpenAI (`openai-completions`)         |
| URL base predefinito | `https://tokenhub.tencentmaas.com/v1`             |
| URL base globale | `https://tokenhub-intl.tencentmaas.com/v1` (override) |
| Modello predefinito | `tencent-tokenhub/hy3-preview`                     |

## Avvio rapido

<Steps>
  <Step title="Crea una chiave API TokenHub">
    Crea una chiave API in Tencent Cloud TokenHub. Se scegli un ambito di accesso limitato per la chiave, includi **Hy3 preview** nei modelli consentiti.
  </Step>
  <Step title="Esegui l'onboarding">
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
  <Step title="Verifica il modello">
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

| Riferimento modello             | Nome                   | Input | Contesto | Output massimo | Note                       |
| ------------------------------ | ---------------------- | ----- | -------- | -------------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000  | 64,000         | Predefinito; supporta il ragionamento |

Hy3 preview è il grande modello linguistico MoE di Tencent Hunyuan per ragionamento, istruzioni con contesto lungo, codice e flussi di lavoro con agenti. Gli esempi compatibili con OpenAI di Tencent usano `hy3-preview` come ID modello e supportano la chiamata di strumenti standard per chat completions oltre a `reasoning_effort`.

<Tip>
  L'ID modello è `hy3-preview`. Non confonderlo con i modelli `HY-3D-*` di Tencent, che sono API di generazione 3D e non sono il modello chat OpenClaw configurato da questo provider.
</Tip>

## Prezzi a livelli

Il catalogo in bundle include metadati di costo a livelli che scalano con la lunghezza della finestra di input, quindi le stime dei costi vengono popolate senza override manuali.

| Intervallo token di input | Tariffa input | Tariffa output | Lettura cache |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

Le tariffe sono per milione di token in USD come pubblicizzato da Tencent. Sovrascrivi i prezzi in `models.providers.tencent-tokenhub` solo quando ti serve una superficie diversa.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Override dell'endpoint">
    OpenClaw usa per impostazione predefinita l'endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent documenta anche un endpoint TokenHub internazionale:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Sovrascrivi l'endpoint solo quando il tuo account o la tua regione TokenHub lo richiede.

  </Accordion>

  <Accordion title="Disponibilità dell'ambiente per il daemon">
    Se il Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), `TOKENHUB_API_KEY` deve essere visibile a quel processo. Impostala in `~/.openclaw/.env` o tramite `env.shellEnv` affinché gli ambienti launchd, systemd o Docker exec possano leggerla.

    <Warning>
      Le chiavi impostate solo in `~/.profile` non sono visibili ai processi Gateway gestiti. Usa il file env o il seam di configurazione per una disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento di configurazione" href="/it/gateway/configuration" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Pagina prodotto TokenHub di Tencent Cloud.
  </Card>
  <Card title="Scheda modello Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Dettagli e benchmark di Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
