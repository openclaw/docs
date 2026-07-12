---
read_when:
    - Vuoi usare DeepSeek con OpenClaw
    - È necessaria la variabile d’ambiente della chiave API oppure la scelta di autenticazione della CLI
summary: Configurazione di DeepSeek (autenticazione + selezione del modello)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T07:24:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fornisce potenti modelli di IA tramite un'API compatibile con OpenAI.

| Proprietà     | Valore                     |
| ------------- | -------------------------- |
| Fornitore     | `deepseek`                 |
| Autenticazione | `DEEPSEEK_API_KEY`        |
| API           | Compatibile con OpenAI     |
| URL di base   | `https://api.deepseek.com` |

## Installare il Plugin

Installa il Plugin ufficiale, quindi riavvia il Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Guida introduttiva

<Steps>
  <Step title="Ottieni la chiave API">
    Crea una chiave API su [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Esegui la configurazione iniziale">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Richiede la chiave API e imposta `deepseek/deepseek-v4-flash` come modello predefinito.

  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider deepseek
    ```

    Per esaminare il catalogo statico del Plugin senza un Gateway in esecuzione:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configurazione non interattiva">
    Per le installazioni tramite script o senza interfaccia grafica, passa direttamente tutte le opzioni:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che
`DEEPSEEK_API_KEY` sia disponibile per tale processo (ad esempio, in
`~/.openclaw/.env` o tramite `env.shellEnv`).
</Warning>

## Catalogo integrato

| Riferimento modello          | Nome              | Input | Contesto  | Output massimo | Note                                                        |
| ---------------------------- | ----------------- | ----- | --------- | -------------- | ----------------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | testo | 1,000,000 | 384,000        | Modello predefinito; interfaccia V4 con capacità di ragionamento |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | testo | 1,000,000 | 384,000        | Interfaccia V4 con capacità di ragionamento                 |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | testo | 1,000,000 | 384,000        | Nome di compatibilità deprecato per V4 Flash senza ragionamento |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | testo | 1,000,000 | 384,000        | Nome di compatibilità deprecato per V4 Flash con ragionamento |

<Warning>
DeepSeek ritirerà `deepseek-chat` e `deepseek-reasoner` il 24 luglio 2026
alle 15:59 UTC. Attualmente vengono instradati rispettivamente a DeepSeek V4 Flash
in modalità senza ragionamento e con ragionamento. Prima della scadenza, modifica
i riferimenti dei modelli configurati in `deepseek/deepseek-v4-flash` o
`deepseek/deepseek-v4-pro`.
</Warning>

Le stime locali dei costi di OpenClaw seguono le tariffe pubblicate da DeepSeek
per riscontri nella cache, riscontri mancati nella cache e output. DeepSeek può
modificare tali tariffe; la pagina
[Modelli e prezzi](https://api-docs.deepseek.com/quick_start/pricing/) è la
fonte autorevole per la fatturazione.

<Tip>
I modelli V4 supportano il controllo `thinking` di DeepSeek. OpenClaw riproduce
anche il `reasoning_content` di DeepSeek nei turni successivi, consentendo la
prosecuzione delle sessioni di ragionamento con chiamate agli strumenti.
Usa `/think xhigh` o `/think max` con i modelli DeepSeek V4 per richiedere il
massimo `reasoning_effort` di DeepSeek; entrambi corrispondono a `"max"`.
</Tip>

## Ragionamento e strumenti

Nelle sessioni di ragionamento di DeepSeek V4, i messaggi dell'assistente
riprodotti da un turno con ragionamento abilitato devono includere
`reasoning_content` nelle richieste successive. Il Plugin DeepSeek di OpenClaw
compila automaticamente tale campo, quindi il normale utilizzo degli strumenti
su più turni funziona con `deepseek/deepseek-v4-flash` e
`deepseek/deepseek-v4-pro` anche quando la cronologia proviene da un altro
fornitore compatibile con OpenAI (senza `reasoning_content` nativo) o da un
semplice messaggio dell'assistente. Non è necessario usare `/new` dopo aver
cambiato fornitore durante una sessione.

Quando il ragionamento è disabilitato (inclusa la selezione **None** nell'interfaccia),
OpenClaw invia `thinking: { type: "disabled" }` e rimuove il
`reasoning_content` riprodotto dalla cronologia in uscita, mantenendo la sessione
sul percorso DeepSeek senza ragionamento.

Usa `deepseek/deepseek-v4-flash` come percorso rapido predefinito. Usa
`deepseek/deepseek-v4-pro` per il modello più potente quando puoi accettare costi
o latenza maggiori.

## Test dal vivo

Per eseguire soltanto i controlli diretti dei modelli DeepSeek V4 dalla moderna
suite di test dal vivo dei modelli:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Verifica che entrambi i modelli V4 completino l'esecuzione e che i turni
successivi con ragionamento e strumenti conservino il payload riprodotto
richiesto da DeepSeek.

## Esempio di configurazione

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei fornitori, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e fornitori.
  </Card>
</CardGroup>
