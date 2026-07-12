---
read_when:
    - Vuoi utilizzare Tencent hy3 con OpenClaw
    - È necessario configurare la chiave API di TokenHub o TokenPlan
summary: Configurazione di Tencent Cloud TokenHub e TokenPlan per hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T07:26:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Installa il Plugin provider ufficiale di Tencent Cloud per accedere a Tencent Hy3 tramite due endpoint — TokenHub (`tencent-tokenhub`) e TokenPlan (`tencent-tokenplan`) — utilizzando un'API compatibile con OpenAI.

| Proprietà                         | Valore                                                |
| --------------------------------- | ----------------------------------------------------- |
| ID dei provider                   | `tencent-tokenhub`, `tencent-tokenplan`               |
| Pacchetto                         | `@openclaw/tencent-provider`                          |
| Variabile d'ambiente di autenticazione TokenHub  | `TOKENHUB_API_KEY`                                    |
| Variabile d'ambiente di autenticazione TokenPlan | `TOKENPLAN_API_KEY`                                   |
| Flag di onboarding TokenHub       | `--auth-choice tokenhub-api-key`                      |
| Flag di onboarding TokenPlan      | `--auth-choice tokenplan-api-key`                     |
| Flag CLI diretto TokenHub         | `--tokenhub-api-key <key>`                            |
| Flag CLI diretto TokenPlan        | `--tokenplan-api-key <key>`                           |
| API                               | Compatibile con OpenAI (`openai-completions`)         |
| URL di base TokenHub              | `https://tokenhub.tencentmaas.com/v1`                 |
| URL di base globale TokenHub      | `https://tokenhub-intl.tencentmaas.com/v1` (override) |
| URL di base TokenPlan             | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Modello predefinito               | `tencent-tokenhub/hy3`                                |

## Avvio rapido

<Steps>
  <Step title="Crea una chiave API Tencent">
    Crea una chiave API per Tencent Cloud TokenHub e TokenPlan. Se scegli un ambito di accesso limitato per la chiave, includi **hy3** (e **hy3 preview** se prevedi di utilizzarlo su TokenHub) tra i modelli consentiti.
  </Step>
  <Step title="Esegui l'onboarding">
    <CodeGroup>

```bash Onboarding TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Flag diretto TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Onboarding TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Flag diretto TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Solo variabili d'ambiente
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifica il modello">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Configurazione non interattiva

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` è obbligatorio insieme a `--non-interactive`.
</Note>

## Catalogo integrato

| Riferimento del modello          | Nome                   | Input | Contesto | Output massimo | Note                         |
| -------------------------------- | ---------------------- | ----- | -------- | -------------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview`   | hy3 preview (TokenHub) | testo | 256.000  | 64.000         | supporta il ragionamento     |
| `tencent-tokenhub/hy3`           | hy3 (TokenHub)         | testo | 256.000  | 64.000         | supporta il ragionamento     |
| `tencent-tokenplan/hy3`          | hy3 (TokenPlan)        | testo | 256.000  | 64.000         | supporta il ragionamento     |

hy3 è il modello linguistico MoE di grandi dimensioni di Tencent Hunyuan per il ragionamento, l'esecuzione di istruzioni con contesti estesi, il codice e i flussi di lavoro degli agenti. Gli esempi di Tencent compatibili con OpenAI utilizzano `hy3` come ID del modello e supportano le chiamate agli strumenti standard delle API di completamento chat, oltre a `reasoning_effort`.

<Tip>
  L'ID del modello è `hy3`. Non confonderlo con i modelli `HY-3D-*` di Tencent, che sono API per la generazione 3D e non costituiscono il modello di chat OpenClaw configurato da questo provider.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Override dell'endpoint">
    Il catalogo integrato di OpenClaw utilizza l'endpoint `https://tokenhub.tencentmaas.com/v1` di Tencent Cloud. Esegui l'override solo se il tuo account TokenHub o la tua regione richiede un endpoint diverso:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Disponibilità delle variabili d'ambiente per il demone">
    Se il Gateway viene eseguito come servizio gestito (launchd, systemd, Docker), `TOKENHUB_API_KEY` e `TOKENPLAN_API_KEY` devono essere visibili a tale processo. Impostale in `~/.openclaw/.env` o tramite `env.shellEnv`, in modo che gli ambienti di esecuzione di launchd, systemd o Docker possano leggerle.

    <Warning>
      Le chiavi esportate esclusivamente in una shell interattiva non sono visibili ai processi Gateway gestiti. Utilizza il file delle variabili d'ambiente o il punto di configurazione per garantirne la disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo, incluse le impostazioni dei provider.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Pagina del prodotto TokenHub di Tencent Cloud.
  </Card>
  <Card title="Scheda del modello Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Dettagli e benchmark di anteprima di Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
