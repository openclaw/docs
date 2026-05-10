---
read_when:
    - Vuoi una configurazione guidata per Gateway, area di lavoro, autenticazione, canali e Skills
summary: Riferimento CLI per `openclaw onboard` (onboarding interattivo)
title: Integra
x-i18n:
    generated_at: "2026-05-10T19:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guidato completo per la configurazione del Gateway locale o remoto. Usalo quando vuoi che OpenClaw ti accompagni attraverso autenticazione del modello, workspace, gateway, canali, Skills e stato di salute in un unico flusso.

## Guide correlate

<CardGroup cols={2}>
  <Card title="Hub di onboarding CLI" href="/it/start/wizard" icon="rocket">
    Guida dettagliata del flusso CLI interattivo.
  </Card>
  <Card title="Panoramica dell'onboarding" href="/it/start/onboarding-overview" icon="map">
    Come si integra l'onboarding di OpenClaw.
  </Card>
  <Card title="Riferimento per la configurazione CLI" href="/it/start/wizard-cli-reference" icon="book">
    Output, componenti interni e comportamento per ogni passaggio.
  </Card>
  <Card title="Automazione CLI" href="/it/start/wizard-cli-automation" icon="terminal">
    Flag non interattivi e configurazioni tramite script.
  </Card>
  <Card title="Onboarding dell'app macOS" href="/it/start/onboarding" icon="apple">
    Flusso di onboarding per l'app nella barra dei menu di macOS.
  </Card>
</CardGroup>

## Esempi

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` usa provider di migrazione di proprietà dei plugin, come Hermes. Viene eseguito solo su una configurazione OpenClaw nuova; se sono presenti configurazione, credenziali, sessioni o file di memoria/identità del workspace esistenti, reimposta o scegli una configurazione nuova prima di importare.

`--modern` avvia l'anteprima dell'onboarding conversazionale Crestodian. Senza
`--modern`, `openclaw onboard` mantiene il flusso di onboarding classico.

Per destinazioni `ws://` in testo normale su reti private (solo reti attendibili), imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.
Non esiste un equivalente `openclaw.json` per questo break-glass del trasporto
lato client.

Provider personalizzato non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` è facoltativo in modalità non interattiva. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.
OpenClaw contrassegna automaticamente gli ID comuni dei modelli vision come compatibili con le immagini. Passa `--custom-image-input` per ID vision personalizzati sconosciuti, oppure `--custom-text-input` per forzare metadati solo testo.

LM Studio supporta anche un flag chiave specifico del provider in modalità non interattiva:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` predefinisce `http://127.0.0.1:11434`. `--custom-model-id` è facoltativo; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID dei modelli cloud come `kimi-k2.5:cloud` funzionano qui.

Archivia le chiavi del provider come riferimenti invece che in testo normale:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive riferimenti basati su variabili d'ambiente invece dei valori delle chiavi in testo normale.
Per i provider basati su profili di autenticazione, questo scrive voci `keyRef`; per i provider personalizzati, questo scrive `models.providers.<id>.apiKey` come riferimento env (per esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità `ref` non interattiva:

- Imposta la variabile d'ambiente del provider nell'ambiente del processo di onboarding (per esempio `OPENAI_API_KEY`).
- Non passare flag chiave inline (per esempio `--openai-api-key`) a meno che quella variabile d'ambiente non sia anch'essa impostata.
- Se viene passato un flag chiave inline senza la variabile d'ambiente richiesta, l'onboarding fallisce rapidamente con indicazioni.

Opzioni token del Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` archivia un token in testo normale.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile d'ambiente non vuota nell'ambiente del processo di onboarding.
- Con `--install-daemon`, quando l'autenticazione tramite token richiede un token, i token gateway gestiti da SecretRef vengono convalidati ma non salvati come testo normale risolto nei metadati dell'ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l'onboarding fallisce in modo chiuso con indicazioni di correzione.
- Con `--install-daemon`, se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'onboarding blocca l'installazione finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Se in seguito in un file di configurazione manca `gateway.mode`, trattalo come una configurazione danneggiata o una modifica manuale incompleta, non come una scorciatoia valida per la modalità locale.
- L'onboarding locale installa i plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede.
- L'onboarding remoto scrive solo le informazioni di connessione per il Gateway remoto e non installa pacchetti plugin locali.
- `--allow-unconfigured` è una scappatoia separata del runtime del gateway. Non significa che l'onboarding possa omettere `gateway.mode`.

Esempio:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Stato di salute del gateway locale non interattivo:

- A meno che tu non passi `--skip-health`, l'onboarding attende che un gateway locale sia raggiungibile prima di terminare con successo.
- `--install-daemon` avvia prima il percorso di installazione del gateway gestito. Senza di esso, devi avere già un gateway locale in esecuzione, per esempio `openclaw gateway run`.
- Se in automazione vuoi solo scrivere configurazione/workspace/bootstrap, usa `--skip-health`.
- Se gestisci direttamente i file del workspace, passa `--skip-bootstrap` per impostare `agents.defaults.skipBootstrap: true` e saltare la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima le Attività pianificate e, se la creazione dell'attività viene negata, ripiega su un elemento di login nella cartella Startup per utente.

Comportamento dell'onboarding interattivo con modalità riferimento:

- Scegli **Usa riferimento segreto** quando richiesto.
- Poi scegli una delle seguenti opzioni:
  - Variabile d'ambiente
  - Provider di segreti configurato (`file` o `exec`)
- L'onboarding esegue una convalida preflight rapida prima di salvare il riferimento.
  - Se la convalida fallisce, l'onboarding mostra l'errore e ti consente di riprovare.

### Scelte di endpoint Z.AI non interattive

<Note>
`--auth-choice zai-api-key` rileva automaticamente il miglior endpoint Z.AI per la tua chiave (preferisce l'API generale con `zai/glm-5.1`). Se vuoi specificamente gli endpoint GLM Coding Plan, scegli `zai-coding-global` o `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Esempio Mistral non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Note sul flusso

<AccordionGroup>
  <Accordion title="Tipi di flusso">
    - `quickstart`: prompt minimi, genera automaticamente un token gateway.
    - `manual`: prompt completi per porta, bind e autenticazione (alias di `advanced`).
    - `import`: esegue un provider di migrazione rilevato, mostra un'anteprima del piano, quindi applica dopo la conferma.

  </Accordion>
  <Accordion title="Prefiltraggio dei provider">
    Quando una scelta di autenticazione implica un provider preferito, l'onboarding prefiltra i selettori del modello predefinito e della allowlist su quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti del coding plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se il filtro del provider preferito non produce ancora modelli caricati, l'onboarding ripiega sul catalogo non filtrato invece di lasciare vuoto il selettore.

  </Accordion>
  <Accordion title="Follow-up della ricerca web">
    Alcuni provider di ricerca web attivano prompt di follow-up specifici del provider:

    - **Grok** può offrire la configurazione facoltativa di `x_search` con lo stesso `XAI_API_KEY` e una scelta di modello `x_search`.
    - **Kimi** può chiedere la regione dell'API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e il modello predefinito di ricerca web Kimi.

  </Accordion>
  <Accordion title="Altri comportamenti">
    - Comportamento dell'ambito DM dell'onboarding locale: [Riferimento per la configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals).
    - Prima chat più rapida: `openclaw dashboard` (UI di controllo, nessuna configurazione del canale).
    - Provider personalizzato: collega qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi provider ospitati non elencati. Usa Unknown per il rilevamento automatico.
    - Se viene rilevato lo stato Hermes, l'onboarding offre un flusso di migrazione. Usa [Migra](/it/cli/migrate) per piani dry-run, modalità sovrascrittura, report e mappature esatte.

  </Accordion>
</AccordionGroup>

## Comandi di follow-up comuni

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa invece `openclaw setup` quando hai bisogno solo della configurazione/workspace di base. Usa `openclaw configure` in seguito per modifiche mirate e `openclaw channels add` per la configurazione solo dei canali.

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
