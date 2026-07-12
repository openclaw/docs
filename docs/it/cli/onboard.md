---
read_when:
    - Vuoi configurare l'inferenza, quindi completare la configurazione con Crestodian
summary: Riferimento CLI per `openclaw onboard` (configurazione iniziale interattiva)
title: Configurazione iniziale
x-i18n:
    generated_at: "2026-07-12T06:56:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configurazione guidata che stabilisce innanzitutto l'inferenza: rileva l'accesso esistente all'IA,
richiede un completamento in tempo reale, conserva solo il percorso funzionante e quindi avvia
Crestodian per configurare il resto. `openclaw setup` è lo stesso punto di ingresso;
`openclaw setup --baseline` scrive solo la configurazione di base e lo spazio di lavoro.

<CardGroup cols={2}>
  <Card title="Centro di onboarding della CLI" href="/it/start/wizard" icon="rocket">
    Guida dettagliata al flusso interattivo della CLI.
  </Card>
  <Card title="Panoramica dell'onboarding" href="/it/start/onboarding-overview" icon="map">
    Come si integrano tra loro le varie parti dell'onboarding di OpenClaw.
  </Card>
  <Card title="Riferimento per la configurazione tramite CLI" href="/it/start/wizard-cli-reference" icon="book">
    Output, funzionamento interno e comportamento di ogni passaggio.
  </Card>
  <Card title="Automazione della CLI" href="/it/start/wizard-cli-automation" icon="terminal">
    Flag non interattivi e configurazioni tramite script.
  </Card>
  <Card title="Onboarding dell'app macOS" href="/it/start/onboarding" icon="apple">
    Flusso di onboarding per l'app della barra dei menu di macOS.
  </Card>
</CardGroup>

## Esempi

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: apre la procedura guidata completa, passaggio per passaggio. Non può essere combinato con
  `--non-interactive`; ometti `--classic` per la configurazione automatizzata.
- `--flow quickstart`: apre la procedura guidata classica con richieste minime e
  genera automaticamente un token del Gateway.
- `--flow manual` (alias `advanced`): apre la procedura guidata classica con tutte le richieste
  relative a porta, associazione e autenticazione.
- `--flow import`: esegue un provider di migrazione rilevato (ad esempio Hermes tramite `--import-from hermes`), mostra un'anteprima del piano e lo applica dopo la conferma. L'importazione viene eseguita solo su una nuova configurazione di OpenClaw: se esistono già, reimposta prima configurazione, credenziali, sessioni e stato dello spazio di lavoro. Usa [`openclaw migrate`](/it/cli/migrate) per piani di simulazione, modalità di sovrascrittura, report e mappature esatte.
- `--modern` è un alias di compatibilità per l'assistente di configurazione conversazionale Crestodian.
  Usa lo stesso controllo dell'inferenza in tempo reale di `openclaw crestodian` e
  accetta solo `--workspace`, `--accept-risk`,
  `--non-interactive` e `--json`. Gli altri flag di configurazione vengono rifiutati anziché
  essere ignorati senza avviso.

## Flusso guidato

Il semplice comando `openclaw onboard` avvia il flusso guidato. Mostra l'avviso di sicurezza,
rileva l'accesso all'IA già disponibile tramite modelli configurati, variabili d'ambiente
con chiavi API e CLI locali supportate, quindi verifica il candidato consigliato
con un completamento reale. Se quel candidato non funziona, l'onboarding mostra
il motivo e prova automaticamente il candidato utilizzabile successivo.

Se il rilevamento automatico esaurisce le opzioni, scegli un altro candidato rilevato oppure inserisci
la chiave API di un provider in una richiesta con input mascherato. Una chiave inserita manualmente viene verificata tramite lo stesso
percorso di completamento in tempo reale. L'onboarding guidato
non offre Crestodian né un'uscita che salti l'IA prima che un candidato superi la verifica. OpenClaw
conserva solo il percorso del modello verificato e le relative credenziali dopo il superamento
del test; un candidato non riuscito non sostituisce il modello configurato né salva le
credenziali provate. La configurazione dello spazio di lavoro e del Gateway rimane invariata finché
Crestodian non viene avviato.

In modalità guidata, `--workspace <dir>` fornisce lo spazio di lavoro proposto da Crestodian
e il contesto di inferenza isolato. Non viene conservato finché non approvi la
proposta di configurazione di Crestodian. L'onboarding classico e quello non interattivo conservano il proprio
spazio di lavoro tramite il rispettivo flusso di configurazione normale.

Dopo il superamento dell'inferenza, l'onboarding guidato avvia immediatamente Crestodian con
il modello verificato. Crestodian può quindi configurare lo spazio di lavoro, il Gateway,
i canali, gli agenti, i plugin e altre funzionalità facoltative. All'interno di Crestodian, usa
`open channel wizard for <channel>` per affidare la raccolta delle credenziali del canale a una
procedura guidata del terminale con input mascherato. Per cambiare il provider del modello o la relativa autenticazione,
esci da Crestodian ed esegui `openclaw onboard`; Crestodian non apre i flussi guidati
o classici per i provider.

In un'installazione configurata, eseguendo nuovamente `openclaw onboard` viene prima verificato il
modello predefinito corrente, pertanto lo stesso flusso funge da passaggio di verifica e riparazione.
Se tale controllo non riesce, il modello configurato non viene mai sostituito automaticamente:
l'onboarding si interrompe e chiede come continuare. Il controllo viene eseguito al di fuori dello
spazio di lavoro, quindi un modello fornito da un plugin dello spazio di lavoro potrebbe non funzionare qui pur continuando
a funzionare nell'agente.
Usa `openclaw onboard --classic` per l'autenticazione specifica del provider, i canali, le Skills,
la configurazione remota del Gateway, le importazioni o i controlli completi del Gateway. Per la configurazione
conversazionale non relativa all'inferenza e per la riparazione, esegui `openclaw crestodian`; `openclaw onboard
--modern` è un alias di compatibilità che usa lo stesso controllo dell'inferenza. La procedura guidata
classica può facoltativamente verificare il modello predefinito con un completamento in tempo reale, ma
Crestodian non verrà avviato finché il suo controllo dell'inferenza in tempo reale non viene superato.

In un terminale interattivo, il semplice comando `openclaw` (senza sottocomando) determina il percorso in base allo stato
della configurazione:

- Se il file di configurazione attivo manca o non contiene impostazioni definite dall'utente (è vuoto o
  contiene solo metadati), avvia l'onboarding guidato.
- Se il file di configurazione esiste ma non supera la convalida, avvia il percorso di onboarding
  classico con le indicazioni di `openclaw doctor`. Crestodian richiede un'inferenza
  funzionante e non viene usato per riparare questo stato precedente all'inferenza.
- Se il file di configurazione è valido, apre la normale TUI dell'agente. Un Gateway configurato
  e raggiungibile con un agente e un modello porta direttamente a tale interfaccia senza
  onboarding né Crestodian. In un'installazione configurata, accedi a Crestodian con
  `/crestodian` all'interno della TUI oppure con `openclaw crestodian`.

Gli URL del Gateway in testo non crittografato `ws://` sono accettati per local loopback, indirizzi IP privati, `.local` e Tailnet `*.ts.net`. Per altri nomi DNS privati attendibili, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.

## Reimpostazione

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` cancella lo stato prima di eseguire la configurazione. `--reset-scope` controlla l'entità della cancellazione: `config` (solo la configurazione), `config+creds+sessions` (valore predefinito quando viene passato `--reset` senza un ambito) oppure `full` (reimposta anche lo spazio di lavoro). Lo spazio di lavoro viene reimpostato solo con `--reset-scope full`.

## Impostazioni locali

L'onboarding interattivo usa le impostazioni locali della procedura guidata della CLI per i testi fissi della configurazione. Ordine di risoluzione:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Ripiego sull'inglese

Le impostazioni locali supportate dalla procedura guidata sono `en`, `zh-CN` e `zh-TW`. I valori delle impostazioni locali possono usare il carattere di sottolineatura o suffissi POSIX, ad esempio `zh_CN.UTF-8`. I nomi dei prodotti, i nomi dei comandi, le chiavi di configurazione, gli URL, gli ID dei provider, gli ID dei modelli e le etichette di plugin e canali rimangono invariati.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Configurazione non interattiva

`--non-interactive` richiede `--accept-risk` (conferma che gli agenti sono potenti e che l'accesso completo al sistema comporta rischi). Il valore predefinito di `--mode` è `local`.

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

`--custom-api-key` è facoltativo; se omesso, l'onboarding controlla `CUSTOM_API_KEY` nell'ambiente. OpenClaw contrassegna automaticamente come compatibili con le immagini gli ID dei modelli visivi comuni (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral e simili). Passa `--custom-image-input` per ID visivi personalizzati sconosciuti oppure `--custom-text-input` per imporre metadati di solo testo. Usa `--custom-compatibility openai-responses` per endpoint compatibili con OpenAI che supportano `/v1/responses` ma non `/v1/chat/completions`; i valori validi sono `openai` (predefinito), `openai-responses`, `anthropic`.

LM Studio dispone anche di un flag specifico del provider per la chiave:

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

Il valore predefinito di `--custom-base-url` è `http://127.0.0.1:11434`. `--custom-model-id` è facoltativo; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID dei modelli cloud come `kimi-k2.5:cloud` funzionano in questo caso.

Archivia le chiavi dei provider come riferimenti anziché come testo non crittografato:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive riferimenti basati sull'ambiente anziché valori delle chiavi in testo non crittografato: per i provider basati su profili di autenticazione scrive `keyRef: { source: "env", provider: "default", id: <envVar> }`; per i provider personalizzati scrive `models.providers.<id>.apiKey` nello stesso modo (ad esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contratto: imposta la variabile d'ambiente del provider nell'ambiente del processo di onboarding (ad esempio `OPENAI_API_KEY`) e non passare anche un flag con una chiave incorporata, a meno che tale variabile d'ambiente sia impostata; il valore di un flag senza la variabile d'ambiente corrispondente causa un errore immediato con indicazioni per la risoluzione.

### Autenticazione del Gateway (non interattiva)

- `--gateway-auth token --gateway-token <token>` archivia un token in testo non crittografato. `token` è la modalità di autenticazione predefinita.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef di ambiente. Richiede una variabile d'ambiente non vuota con tale nome nell'ambiente del processo di onboarding.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- Con `--install-daemon`: un `gateway.auth.token` gestito tramite SecretRef viene convalidato, ma non viene conservato come testo non crittografato risolto nei metadati dell'ambiente del servizio supervisore; se il riferimento non viene risolto, l'installazione si interrompe in modo sicuro con indicazioni per la risoluzione. Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Un file di configurazione successivo privo di `gateway.mode` indica un danneggiamento della configurazione o una modifica manuale incompleta, non una scorciatoia valida per la modalità locale.
- L'onboarding locale installa i plugin scaricabili richiesti dal percorso di configurazione scelto (ad esempio un plugin di runtime Codex o Copilot per le relative opzioni di autenticazione). L'onboarding remoto scrive solo le informazioni di connessione per il Gateway remoto: non installa mai pacchetti di plugin locali.
- `--allow-unconfigured` è una via d'uscita separata di `openclaw gateway run`; non consente all'onboarding di ignorare `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Stato del Gateway locale

- A meno che non venga passato `--skip-health`, l'onboarding attende che un Gateway locale sia raggiungibile prima di terminare correttamente.
- `--install-daemon` avvia prima il percorso di installazione del Gateway gestito. Senza di esso, un Gateway locale deve essere già in esecuzione (ad esempio `openclaw gateway run`).
- `--skip-health` salta l'attesa se nell'automazione vuoi solo scrivere configurazione, spazio di lavoro e bootstrap.
- `--skip-bootstrap` imposta `agents.defaults.skipBootstrap: true` e salta la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima le attività pianificate e, se la creazione dell'attività viene negata, ripiega su un elemento di accesso per utente nella cartella Esecuzione automatica.

### Modalità di riferimento interattiva

- Quando richiesto, scegli **Usa riferimento al segreto**, quindi **Variabile d'ambiente** oppure un provider di segreti configurato (`file` o `exec`).
- L'onboarding esegue una rapida convalida preliminare prima di salvare il riferimento e consente di riprovare in caso di errore.

### Opzioni dell'endpoint Z.AI

<Note>
`--auth-choice zai-api-key` rileva automaticamente l'endpoint e il modello Z.AI migliori per la tua chiave: gli endpoint Coding Plan preferiscono `zai/glm-5.2` (con ripiego su `glm-5.1` se non disponibile); gli endpoint API generali usano per impostazione predefinita `zai/glm-5.1`. Per forzare un endpoint Coding Plan, scegli direttamente `zai-coding-global` o `zai-coding-cn`.
</Note>

```bash
# Selezione dell'endpoint senza prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Altre opzioni di endpoint Z.AI: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Flag aggiuntivi per la modalità non interattiva

Autenticazione del modello basata su token (utilizzata con `--auth-choice token`):

| Flag                            | Descrizione                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | ID del provider di token che emette il token                                                                                             |
| `--token <token>`               | Valore del token per l'autenticazione del modello                                                                                        |
| `--token-profile-id <id>`       | ID del profilo di autenticazione (predefinito: `<provider>:manual`; alcuni flussi gestiti dal provider usano un proprio valore predefinito, come `anthropic:default`) |
| `--token-expires-in <duration>` | Durata facoltativa prima della scadenza del token (ad es. `365d`, `12h`)                                                                  |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Controllo dell'installazione del daemon: `--no-install-daemon` / `--skip-daemon` (alias; ignorano l'installazione del servizio Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (valore predefinito: `npm`), `--skip-skills`.

Configurazione dell'interfaccia utente e degli hook: `--skip-ui` (ignora i prompt di Control UI/TUI), `--skip-hooks` (ignora la configurazione di webhook/hook), `--skip-channels`, `--skip-search`.

Output: `--suppress-gateway-token-output` sopprime l'output di Gateway/interfaccia utente contenente token (suggerimenti relativi ai token, URL di accesso automatico con token incorporato e avvio automatico di Control UI), utile nei terminali condivisi e nella CI.

<Note>
`--json` non implica la modalità non interattiva nell'onboarding guidato o classico.
Con `--modern`, JSON fornisce una panoramica Crestodian una tantum e termina dopo
quel singolo risultato. Usa `--non-interactive` per gli altri script.
</Note>

## Prefiltro dei provider

Quando una scelta di autenticazione implica un provider preferito, l'onboarding prefiltra i selettori del modello predefinito e dell'elenco consentito mostrando i modelli di tale provider. Il filtro include anche gli altri provider gestiti dallo stesso plugin, coprendo le varianti dei piani di programmazione come `volcengine`/`volcengine-plan` e `byteplus`/`byteplus-plan`. Se il filtro del provider preferito non restituisce alcun modello caricato, l'onboarding torna al catalogo non filtrato anziché lasciare vuoto il selettore.

## Richieste successive per la ricerca web

Alcuni provider di ricerca web attivano richieste successive specifiche del provider durante l'onboarding:

- **Grok** può proporre la configurazione facoltativa di `x_search` con la stessa autenticazione xAI e la scelta di un modello `x_search`.
- **Kimi** può chiedere la regione dell'API Moonshot (`api.moonshot.ai` oppure `api.moonshot.cn`) e il modello predefinito di Kimi per la ricerca web.

## Altri comportamenti

- Comportamento dell'ambito dei messaggi diretti nell'onboarding locale: [riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference#outputs-and-internals).
- Prima chat più rapida: `openclaw dashboard` (Control UI, senza configurazione dei canali).
- Provider personalizzato: collega qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi i provider ospitati non elencati. Usa la compatibilità **Sconosciuta** per eseguire il rilevamento automatico tramite una verifica in tempo reale.
- Se viene rilevato lo stato di Hermes, l'onboarding propone un flusso di migrazione (vedi `--flow import` sopra).

## Comandi successivi comuni

Usa in seguito `openclaw configure` per modifiche mirate non basate sull'inferenza e `openclaw
channels add` per configurare soltanto i canali. Per modificare il provider del modello o il percorso di autenticazione,
esegui invece `openclaw onboard`.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
