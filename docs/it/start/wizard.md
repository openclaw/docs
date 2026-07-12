---
read_when:
    - Esecuzione o configurazione dell'onboarding tramite CLI
    - Configurazione di un nuovo computer
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding tramite CLI: verifica l''inferenza, quindi affida la configurazione rimanente a Crestodian'
title: Configurazione iniziale (CLI)
x-i18n:
    generated_at: "2026-07-12T07:35:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

L’onboarding tramite CLI è il percorso di configurazione da terminale consigliato su macOS, Linux e Windows (nativo o WSL2). Per impostazione predefinita rileva l’accesso all’IA già disponibile sul computer, lo verifica con un completamento reale e avvia Crestodian per configurare lo spazio di lavoro, il Gateway e le funzionalità facoltative. `openclaw setup` esegue lo stesso flusso ([Configurazione](/it/cli/setup) descrive la variante `--baseline` che configura solo le impostazioni). Gli utenti desktop Windows possono anche iniziare da [Windows Hub](/it/platforms/windows).

L’onboarding guidato configura innanzitutto l’inferenza. Rileva l’accesso all’IA disponibile, richiede un completamento reale e solo successivamente avvia [Crestodian](/it/cli/crestodian) per configurare il resto di OpenClaw. Nel flusso guidato non è possibile avviare Crestodian prima dell’inferenza né saltare la configurazione dell’IA.

La procedura guidata classica rimane disponibile per l’accesso al provider, la configurazione di un Gateway remoto, l’associazione dei canali, i controlli del daemon, le Skills e le importazioni. Avviala esplicitamente con `openclaw onboard --classic`; la schermata guidata dei candidati per l’inferenza non vi delega l’esecuzione. Dopo il superamento della verifica dell’inferenza, Crestodian può usare `open channel wizard for <channel>` per affidare la configurazione dei canali che richiedono segreti a una procedura guidata da terminale con input mascherato. Per cambiare il provider del modello o la relativa autenticazione, esci da Crestodian ed esegui `openclaw onboard`; Crestodian non apre i flussi guidati o classici dei provider.

<Info>
Per iniziare la prima chat nel modo più rapido: completa la configurazione guidata, esegui `openclaw dashboard` e chatta nel browser tramite la Control UI. Documentazione: [Dashboard](/it/web/dashboard).
</Info>

## Impostazioni locali

La procedura guidata localizza il testo fisso dell’onboarding. Ordine di risoluzione: `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG`, quindi inglese. Impostazioni locali supportate: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

I nomi dei prodotti, i comandi, le chiavi di configurazione, gli URL, gli ID dei provider, gli ID dei modelli e le etichette di Plugin e canali rimangono in inglese indipendentemente dalle impostazioni locali.

Per riconfigurare in seguito le impostazioni non relative all’inferenza:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non attiva automaticamente la modalità non interattiva. Per gli script, usa `--non-interactive` (consulta [Automazione della CLI](/it/start/wizard-cli-automation)).
</Note>

<Tip>
La procedura guidata classica include un passaggio per la ricerca sul web in cui puoi scegliere un provider: Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily. Alcuni richiedono una chiave API, mentre altri non ne richiedono alcuna. Configura questa opzione in seguito con `openclaw configure --section web`. Documentazione: [Strumenti web](/it/tools/web).
</Tip>

## Flusso guidato predefinito

Il semplice comando `openclaw onboard` segue questo percorso:

1. Accetta l’avviso di sicurezza.
2. Rileva i modelli configurati, le variabili d’ambiente contenenti chiavi API e le CLI locali per l’IA supportate.
3. Verifica il primo candidato rilevato con un completamento reale. In caso di errore, mostra il motivo e prosegue con il candidato utilizzabile successivo.
4. Se il rilevamento non produce altri candidati, riprova un candidato rilevato oppure inserisci la chiave API di un provider in un prompt mascherato. L’onboarding guidato non consente di avviare Crestodian o di uscire saltando l’IA prima che l’inferenza funzioni.
5. Salva soltanto il percorso del modello verificato e gli eventuali stati delle credenziali o dei Plugin necessari. Le impostazioni dello spazio di lavoro e del Gateway rimangono invariate.
6. Avvia Crestodian con il modello verificato affinché possa configurare lo spazio di lavoro, il Gateway, i canali, gli agenti, i Plugin e le restanti opzioni di configurazione facoltative.

Se esegui nuovamente il comando su un’installazione già configurata, viene verificato prima il modello predefinito corrente, trasformando il flusso guidato in un processo di verifica e riparazione. Una verifica non riuscita non sostituisce mai automaticamente il modello configurato; l’onboarding si interrompe e chiede come procedere. Esegui `openclaw channels add` o `openclaw configure` per aggiungere in seguito elementi non relativi all’inferenza; usa `openclaw onboard` per modificare il provider o il percorso di autenticazione.

## Procedura guidata classica: Avvio rapido e Avanzata

Esegui `openclaw onboard --classic` per aprire la procedura guidata completa. Inizia proponendo la scelta tra **Avvio rapido** (impostazioni predefinite) e **Avanzata** (controllo completo). Passa `--flow quickstart` o `--flow advanced` (alias `manual`) per selezionare il flusso classico e saltare questa richiesta.

<Tabs>
  <Tab title="Avvio rapido (impostazioni predefinite)">
    - Gateway locale, associazione loopback
    - Spazio di lavoro predefinito (o spazio di lavoro esistente)
    - Porta del Gateway **18789**
    - Autenticazione del Gateway tramite **token** (generato automaticamente, anche su loopback)
    - Criterio degli strumenti: `tools.profile: "coding"` per le nuove configurazioni (un profilo esplicito esistente viene mantenuto)
    - Isolamento dei messaggi diretti: `session.dmScope: "per-channel-peer"` per le nuove configurazioni. Dettagli: [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione tramite Tailscale **disattivata**
    - I messaggi diretti di Telegram e WhatsApp usano per impostazione predefinita una **lista consentita**: Telegram richiede un ID utente Telegram numerico, mentre WhatsApp richiede un numero di telefono

  </Tab>
  <Tab title="Avanzata (controllo completo)">
    - Mostra ogni passaggio: modalità, spazio di lavoro, Gateway, canali, daemon, Skills

  </Tab>
</Tabs>

La modalità remota (`--mode remote`) usa sempre il flusso avanzato; configura soltanto questo computer per connettersi a un Gateway situato altrove e non installa né modifica mai alcunché sull’host remoto.

## Elementi configurati dall’onboarding classico

La modalità locale (predefinita) guida attraverso questi passaggi:

1. **Modello/autenticazione** - scegli un flusso di autenticazione del provider (chiave API, OAuth o autenticazione manuale specifica del provider), incluso un provider personalizzato (compatibile con OpenAI, compatibile con OpenAI Responses, compatibile con Anthropic o con rilevamento automatico sconosciuto). Scegli un modello predefinito.
   Una nuova configurazione tramite chiave API OpenAI usa per impostazione predefinita `openai/gpt-5.6` (l’ID semplice per l’API diretta viene risolto in Sol); una nuova configurazione ChatGPT/Codex usa per impostazione predefinita `openai/gpt-5.6-sol`. La riesecuzione della configurazione mantiene un modello esplicito esistente, incluso `openai/gpt-5.5`. Seleziona esplicitamente `openai/gpt-5.5` se l’account non rende disponibile GPT-5.6.
   Nota sulla sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti provenienti da Webhook o hook, preferisci il modello di ultima generazione più potente disponibile e mantieni rigorosi i criteri degli strumenti; i livelli meno potenti o più datati sono più vulnerabili alla prompt injection.
   Per le esecuzioni non interattive, `--secret-input-mode ref` memorizza riferimenti basati su variabili d’ambiente anziché valori di chiavi API in testo normale; la variabile d’ambiente indicata deve essere già impostata, altrimenti l’onboarding termina immediatamente con un errore. La modalità interattiva con riferimento al segreto può puntare a una variabile d’ambiente o a un riferimento del provider configurato (`file` o `exec`), con una rapida verifica preliminare prima del salvataggio. Dopo la configurazione del modello e dell’autenticazione, la procedura guidata propone una verifica facoltativa tramite completamento reale; in caso di errore è possibile tornare una volta alla configurazione del modello e dell’autenticazione oppure ignorare l’errore senza bloccare il resto della procedura guidata classica. Ignorarlo non sblocca Crestodian; la configurazione conversazionale richiede comunque il superamento della verifica dell’inferenza.
2. **Spazio di lavoro** - directory per i file dell’agente (impostazione predefinita: `~/.openclaw/workspace`). Crea i file iniziali.
3. **Gateway** - porta, indirizzo di associazione, modalità di autenticazione ed esposizione tramite Tailscale. Nella modalità interattiva con token, scegli se memorizzare il token in testo normale (impostazione predefinita) oppure usare un SecretRef. Percorso SecretRef non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** - canali di chat integrati e dei Plugin ufficiali, inclusi Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** - installa un LaunchAgent (macOS), un’unità utente systemd (Linux/WSL2) oppure un’attività pianificata nativa di Windows, con ripiego nella cartella di avvio per utente.
   Se è richiesta l’autenticazione tramite token e `gateway.auth.token` è gestito tramite SecretRef, l’installazione del daemon lo convalida ma non salva il token risolto nei metadati dell’ambiente del servizio supervisor; un SecretRef non risolto blocca l’installazione e mostra le indicazioni necessarie. Se `gateway.auth.token` e `gateway.auth.password` sono entrambi impostati mentre `gateway.auth.mode` non lo è, l’installazione viene bloccata finché non imposti esplicitamente la modalità.
6. **Verifica dello stato** - avvia il Gateway e verifica che sia raggiungibile.
7. **Skills** - installa le Skills consigliate e le relative dipendenze facoltative.

<Note>
La riesecuzione dell’onboarding **non** elimina nulla, a meno che tu non scelga esplicitamente **Reimposta** o passi `--reset`. Per impostazione predefinita, l’opzione CLI `--reset` reimposta configurazione, credenziali e sessioni; usa `--reset-scope full` per rimuovere anche lo spazio di lavoro. Se la configurazione non è valida o contiene chiavi obsolete, l’onboarding richiede prima di eseguire `openclaw doctor`.
</Note>

`--flow import` esegue nella procedura guidata classica un flusso di migrazione rilevato, ad esempio Hermes, anziché una nuova configurazione; consulta [Migrazione](/it/cli/migrate) e le guide alla migrazione nella sezione [Installazione](/it/install/migrating-hermes). `openclaw onboard --modern` è un alias di compatibilità per [Crestodian](/it/cli/crestodian). Usa lo stesso controllo dell’inferenza di `openclaw crestodian`: un’inferenza verificata avvia l’assistente, mentre un errore interattivo riporta alla configurazione guidata dell’inferenza.

## Aggiungere un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con un proprio spazio di lavoro, sessioni e profili di autenticazione. L’esecuzione senza `--workspace` avvia un flusso interattivo per nome, spazio di lavoro, autenticazione, canali e associazioni; non si tratta della procedura guidata completa di `openclaw onboard`.

Elementi impostati:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- Spazio di lavoro predefinito: `~/.openclaw/workspace-<agentId>` oppure all’interno di `agents.defaults.workspace`, se impostato.
- Aggiungi `bindings` per indirizzare i messaggi in entrata a questo agente; l’onboarding può farlo automaticamente.
- Opzioni non interattive: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per il comportamento dettagliato di ogni passaggio e i risultati della configurazione, consulta il [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, consulta [Automazione della CLI](/it/start/wizard-cli-automation).
Per il riferimento completo delle opzioni, consulta [`openclaw onboard`](/it/cli/onboard).

## Documentazione correlata

- Riferimento dei comandi CLI: [`openclaw onboard`](/it/cli/onboard)
- Panoramica dell’onboarding: [Panoramica dell’onboarding](/it/start/onboarding-overview)
- Onboarding dell’app macOS: [Onboarding](/it/start/onboarding)
- Procedura di primo avvio dell’agente: [Avvio iniziale dell’agente](/it/start/bootstrapping)
