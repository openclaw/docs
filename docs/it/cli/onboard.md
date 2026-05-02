---
read_when:
    - Vuoi una configurazione guidata per Gateway, area di lavoro, autenticazione, canali e Skills
summary: Riferimento CLI per `openclaw onboard` (configurazione iniziale interattiva)
title: Configurazione iniziale
x-i18n:
    generated_at: "2026-05-02T08:19:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding interattivo per la configurazione del Gateway locale o remoto.

## Guide correlate

<CardGroup cols={2}>
  <Card title="Hub di onboarding CLI" href="/it/start/wizard" icon="rocket">
    Guida dettagliata del flusso CLI interattivo.
  </Card>
  <Card title="Panoramica dell'onboarding" href="/it/start/onboarding-overview" icon="map">
    Come si integra l'onboarding di OpenClaw.
  </Card>
  <Card title="Riferimento per la configurazione CLI" href="/it/start/wizard-cli-reference" icon="book">
    Output, dettagli interni e comportamento per ogni passaggio.
  </Card>
  <Card title="Automazione CLI" href="/it/start/wizard-cli-automation" icon="terminal">
    Flag non interattivi e configurazioni tramite script.
  </Card>
  <Card title="Onboarding dell'app macOS" href="/it/start/onboarding" icon="apple">
    Flusso di onboarding per l'app della barra dei menu di macOS.
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

`--flow import` usa provider di migrazione di proprietà dei plugin, come Hermes. Viene eseguito solo su una configurazione OpenClaw nuova; se sono presenti configurazioni, credenziali, sessioni o file di memoria/identità dell'area di lavoro esistenti, reimposta o scegli una configurazione nuova prima di importare.

`--modern` avvia l'anteprima dell'onboarding conversazionale Crestodian. Senza
`--modern`, `openclaw onboard` mantiene il flusso di onboarding classico.

Per destinazioni `ws://` in testo normale su reti private (solo reti attendibili), imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.
Non esiste un equivalente in `openclaw.json` per questa misura di emergenza
del trasporto lato client.

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

`--custom-api-key` è opzionale in modalità non interattiva. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.
OpenClaw contrassegna automaticamente gli ID dei modelli vision comuni come compatibili con immagini. Passa `--custom-image-input` per ID vision personalizzati sconosciuti, oppure `--custom-text-input` per forzare metadati solo testo.

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

`--custom-base-url` ha come valore predefinito `http://127.0.0.1:11434`. `--custom-model-id` è opzionale; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Anche ID di modelli cloud come `kimi-k2.5:cloud` funzionano qui.

Archivia le chiavi provider come riferimenti invece che in testo normale:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive riferimenti basati su env invece di valori chiave in testo normale.
Per provider basati su profili di autenticazione, questo scrive voci `keyRef`; per provider personalizzati, scrive `models.providers.<id>.apiKey` come riferimento env (per esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità non interattiva `ref`:

- Imposta la variabile env del provider nell'ambiente del processo di onboarding (per esempio `OPENAI_API_KEY`).
- Non passare flag chiave inline (per esempio `--openai-api-key`) a meno che anche quella variabile env non sia impostata.
- Se viene passato un flag chiave inline senza la variabile env richiesta, l'onboarding fallisce subito con indicazioni.

Opzioni token Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` archivia un token in testo normale.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile env non vuota nell'ambiente del processo di onboarding.
- Con `--install-daemon`, quando l'autenticazione token richiede un token, i token gateway gestiti da SecretRef vengono convalidati ma non persistiti come testo normale risolto nei metadati dell'ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l'onboarding fallisce in modo chiuso con indicazioni di correzione.
- Con `--install-daemon`, se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'onboarding blocca l'installazione finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Se in seguito in un file di configurazione manca `gateway.mode`, trattalo come configurazione danneggiata o come modifica manuale incompleta, non come scorciatoia valida per la modalità locale.
- L'onboarding locale installa i Plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede.
- L'onboarding remoto scrive solo le informazioni di connessione per il Gateway remoto e non installa pacchetti Plugin locali.
- `--allow-unconfigured` è una misura di emergenza separata per il runtime gateway. Non significa che l'onboarding possa omettere `gateway.mode`.

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

Integrità del gateway locale non interattivo:

- A meno che tu non passi `--skip-health`, l'onboarding attende un gateway locale raggiungibile prima di uscire con successo.
- `--install-daemon` avvia prima il percorso di installazione del gateway gestito. Senza questo flag, devi avere già un gateway locale in esecuzione, per esempio `openclaw gateway run`.
- Se in automazione vuoi solo scritture di configurazione/area di lavoro/bootstrap, usa `--skip-health`.
- Se gestisci personalmente i file dell'area di lavoro, passa `--skip-bootstrap` per impostare `agents.defaults.skipBootstrap: true` e saltare la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima le Attività pianificate e ripiega su un elemento di accesso nella cartella Esecuzione automatica per utente se la creazione dell'attività viene negata.

Comportamento dell'onboarding interattivo con modalità riferimento:

- Scegli **Usa riferimento segreto** quando richiesto.
- Poi scegli una delle opzioni:
  - Variabile d'ambiente
  - Provider di segreti configurato (`file` o `exec`)
- L'onboarding esegue una rapida convalida preflight prima di salvare il riferimento.
  - Se la convalida fallisce, l'onboarding mostra l'errore e consente di riprovare.

### Scelte endpoint Z.AI non interattive

<Note>
`--auth-choice zai-api-key` rileva automaticamente il miglior endpoint Z.AI per la tua chiave (preferisce l'API generale con `zai/glm-5.1`). Se desideri specificamente gli endpoint del GLM Coding Plan, scegli `zai-coding-global` o `zai-coding-cn`.
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
    - `import`: esegue un provider di migrazione rilevato, mostra l'anteprima del piano, poi applica dopo la conferma.

  </Accordion>
  <Accordion title="Prefiltraggio dei provider">
    Quando una scelta di autenticazione implica un provider preferito, l'onboarding prefiltra i selettori del modello predefinito e della allowlist su quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti del coding plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se il filtro del provider preferito non restituisce ancora modelli caricati, l'onboarding ripiega sul catalogo non filtrato invece di lasciare vuoto il selettore.

  </Accordion>
  <Accordion title="Follow-up per ricerca web">
    Alcuni provider di ricerca web attivano prompt di follow-up specifici del provider:

    - **Grok** può offrire la configurazione opzionale di `x_search` con lo stesso `XAI_API_KEY` e una scelta di modello `x_search`.
    - **Kimi** può chiedere la regione dell'API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.

  </Accordion>
  <Accordion title="Altri comportamenti">
    - Comportamento dell'ambito DM nell'onboarding locale: [Riferimento per la configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals).
    - Prima chat più rapida: `openclaw dashboard` (Control UI, nessuna configurazione canale).
    - Provider personalizzato: collega qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi provider ospitati non elencati. Usa Unknown per il rilevamento automatico.
    - Se viene rilevato lo stato Hermes, l'onboarding offre un flusso di migrazione. Usa [Migrate](/it/cli/migrate) per piani dry-run, modalità sovrascrittura, report e mappature esatte.

  </Accordion>
</AccordionGroup>

## Comandi comuni successivi

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
