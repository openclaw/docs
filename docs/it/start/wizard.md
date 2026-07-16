---
read_when:
    - Esecuzione o configurazione dell'onboarding tramite CLI
    - Configurazione di un nuovo computer
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding tramite CLI: verificare l''inferenza, quindi affidare a OpenClaw la configurazione rimanente'
title: Configurazione iniziale (CLI)
x-i18n:
    generated_at: "2026-07-16T15:03:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

L'onboarding tramite CLI è il percorso di configurazione da terminale consigliato su macOS, Linux e
Windows (nativo o WSL2). Per impostazione predefinita rileva l'accesso all'IA già disponibile sul
computer, lo verifica con un completamento reale e avvia OpenClaw per
configurare lo spazio di lavoro, il Gateway e le funzionalità facoltative. `openclaw setup` esegue lo stesso flusso ([Configurazione](/it/cli/setup) descrive
la variante `--baseline` che configura soltanto le impostazioni). Gli utenti desktop Windows possono anche iniziare
da [Windows Hub](/it/platforms/windows).

L'onboarding guidato configura innanzitutto l'inferenza. Rileva l'accesso all'IA disponibile,
richiede un completamento reale e solo allora avvia [OpenClaw](/cli/openclaw)
per configurare il resto di OpenClaw. Selezionando **Salta per ora** si esce dall'onboarding
senza avviare OpenClaw.

La procedura guidata classica resta disponibile per provider personalizzati, configurazione del Gateway
remoto, associazione dei canali, controlli del daemon, Skills e importazioni. Avviarla esplicitamente
con `openclaw onboard --classic`; il selettore guidato dell'inferenza non delega
a questa procedura. Una volta superata la verifica dell'inferenza, OpenClaw può usare `open channel wizard for
<channel>` per affidare la configurazione dei canali che richiede segreti a una procedura guidata nel terminale con dati mascherati.
Per cambiare il provider del modello o la relativa autenticazione, uscire da OpenClaw ed eseguire
`openclaw onboard`; OpenClaw non apre i flussi guidati o classici dei provider.

<Info>
Per avviare rapidamente la prima chat: completare la configurazione guidata, eseguire `openclaw dashboard` e conversare nel
browser tramite l'interfaccia di controllo. Documentazione: [Dashboard](/it/web/dashboard).
</Info>

## Impostazioni locali

La procedura guidata localizza i testi fissi dell'onboarding. Ordine di risoluzione: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, quindi inglese. Impostazioni locali supportate: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

I nomi dei prodotti, i comandi, le chiavi di configurazione, gli URL, gli ID dei provider, gli ID dei modelli e
le etichette di plugin e canali restano in inglese indipendentemente dalle impostazioni locali.

Per riconfigurare in seguito le impostazioni non relative all'inferenza:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Per gli script, usare `--non-interactive` (vedere [Automazione della CLI](/it/start/wizard-cli-automation)).
</Note>

<Tip>
La procedura guidata classica include un passaggio per la ricerca sul web in cui è possibile scegliere un provider: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG o Tavily. Alcuni richiedono una chiave API, mentre altri
non ne richiedono. Questa opzione può essere configurata in seguito con `openclaw configure --section web`. Documentazione:
[Strumenti web](/it/tools/web).
</Tip>

## Procedura guidata predefinita

Il semplice comando `openclaw onboard` segue questo percorso:

1. Accettare l'avviso di sicurezza.
2. Rilevare i modelli configurati, le variabili d'ambiente con chiavi API, le CLI locali per l'IA
   supportate e i modelli già installati con supporto degli strumenti sui server Ollama o LM
   Studio raggiungibili dall'host del Gateway. Questa analisi di sola lettura non scarica mai un
   modello. Le installazioni di Gemini CLI e Antigravity vengono segnalate ma non sottoposte automaticamente a test,
   perché non possono imporre un controllo senza strumenti.
3. Testare il primo candidato rilevato con un completamento reale. In caso di errore, mostrare il
   motivo e passare al candidato utilizzabile successivo.
4. Se il rilevamento non produce risultati, scegliere OpenAI, Anthropic, xAI (Grok), Google oppure
   OpenRouter, oppure selezionare **Altro…** per visualizzare i provider rimanenti. Le aree geografiche,
   i piani e i metodi supportati tramite browser, dispositivo, chiave API o token di ciascun provider
   vengono visualizzati in un secondo menu e testati con lo stesso completamento reale.
   Selezionare **Salta per ora** per uscire senza avviare OpenClaw.
5. Salvare soltanto il percorso del modello verificato e gli eventuali stati delle credenziali o dei plugin
   necessari. Le impostazioni dello spazio di lavoro e del Gateway restano invariate.
6. Avviare OpenClaw con il modello verificato affinché possa configurare lo spazio di lavoro,
   il Gateway, i canali, gli agenti, i plugin e le restanti opzioni facoltative.

La riesecuzione del comando in un'installazione configurata testa innanzitutto il modello
predefinito corrente, trasformando il flusso guidato in una procedura di verifica e riparazione. Un controllo
non riuscito non sostituisce mai automaticamente il modello configurato; l'onboarding si interrompe e
chiede come procedere. Eseguire `openclaw channels add` o `openclaw configure` per
successive aggiunte non relative all'inferenza; usare `openclaw onboard` per modificare il provider o il percorso
di autenticazione.

## Procedura guidata classica: avvio rapido o avanzato

Eseguire `openclaw onboard --classic` per aprire la procedura guidata completa. Inizia con la
scelta tra **Avvio rapido** (impostazioni predefinite) e **Avanzato** (controllo completo). Specificare
`--flow quickstart` o `--flow advanced` (alias `manual`) per selezionare il flusso classico
e saltare questa richiesta.

<Tabs>
  <Tab title="Avvio rapido (impostazioni predefinite)">
    - Gateway locale, associazione loopback
    - Spazio di lavoro predefinito (o spazio di lavoro esistente)
    - Porta del Gateway **18789**
    - Autenticazione del Gateway tramite **Token** (generato automaticamente, anche su loopback)
    - Criterio degli strumenti: `tools.profile: "coding"` per le nuove configurazioni (un profilo esplicito esistente viene mantenuto)
    - Isolamento dei messaggi diretti: `session.dmScope: "per-channel-peer"` per le nuove configurazioni. Dettagli: [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione tramite Tailscale **Disattivata**
    - Per impostazione predefinita, i messaggi diretti di Telegram e WhatsApp usano una **lista consentita**: Telegram richiede un ID utente Telegram numerico, mentre WhatsApp richiede un numero di telefono

  </Tab>
  <Tab title="Avanzato (controllo completo)">
    - Espone ogni passaggio: modalità, spazio di lavoro, Gateway, canali, daemon, Skills

  </Tab>
</Tabs>

La modalità remota (`--mode remote`) usa sempre il flusso avanzato; configura soltanto
questo computer per la connessione a un Gateway situato altrove e non installa né
modifica mai nulla sull'host remoto.

## Cosa configura l'onboarding classico

La modalità locale (predefinita) comprende i passaggi seguenti:

1. **Modello/Autenticazione** - scegliere un flusso di autenticazione del provider (chiave API, OAuth o
   autenticazione manuale specifica del provider), incluso un provider personalizzato
   (compatibile con OpenAI, compatibile con OpenAI Responses, compatibile con Anthropic oppure
   rilevamento automatico sconosciuto). Scegliere un modello predefinito.
   Una nuova configurazione con chiave API OpenAI usa per impostazione predefinita `openai/gpt-5.6` (l'ID
   API diretto senza qualificatori viene risolto in Sol); una nuova configurazione ChatGPT/Codex usa per impostazione predefinita
   `openai/gpt-5.6-sol`. La riesecuzione della configurazione mantiene un modello esplicito esistente,
   incluso `openai/gpt-5.5`. Selezionare esplicitamente `openai/gpt-5.5` se
   l'account non rende disponibile GPT-5.6.
   Nota sulla sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti provenienti da Webhook o hook,
   è preferibile usare il modello di ultima generazione più potente disponibile e mantenere
   restrittivi i criteri degli strumenti: i livelli meno potenti o meno recenti sono più vulnerabili alla prompt injection.
   Per le esecuzioni non interattive, `--secret-input-mode ref` memorizza riferimenti basati sull'ambiente
   anziché valori delle chiavi API in testo normale; la variabile d'ambiente indicata deve essere già
   impostata, altrimenti l'onboarding termina immediatamente con un errore. La modalità interattiva con riferimenti ai segreti può
   fare riferimento a una variabile d'ambiente o a un riferimento configurato del provider (`file` o
   `exec`), con una rapida verifica preliminare prima del salvataggio. Dopo la configurazione del modello e dell'autenticazione,
   la procedura guidata propone un test facoltativo con completamento reale; in caso di errore è possibile tornare una volta
   alla configurazione del modello e dell'autenticazione oppure ignorarlo senza bloccare il resto della
   procedura guidata classica. Ignorarlo non sblocca OpenClaw; la configurazione conversazionale
   richiede comunque il superamento della verifica dell'inferenza.
2. **Spazio di lavoro** - directory per i file dell'agente (impostazione predefinita `~/.openclaw/workspace`). Crea i file di bootstrap iniziali.
3. **Gateway** - porta, indirizzo di associazione, modalità di autenticazione, esposizione tramite Tailscale. Nella
   modalità interattiva con token, scegliere la memorizzazione del token in testo normale (predefinita) oppure
   scegliere un SecretRef. Percorso SecretRef non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** - canali di chat integrati e dei plugin ufficiali, inclusi
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** - installa un LaunchAgent (macOS), un'unità utente systemd
   (Linux/WSL2) oppure un'attività pianificata nativa di Windows, con una soluzione alternativa
   per utente nella cartella Esecuzione automatica.
   Se è richiesta l'autenticazione tramite token e `gateway.auth.token` è gestito tramite SecretRef,
   l'installazione del daemon lo convalida ma non salva un token risolto nei
   metadati dell'ambiente del servizio di supervisione; un SecretRef non risolto blocca
   l'installazione fornendo indicazioni. Se sia `gateway.auth.token` sia
   `gateway.auth.password` sono impostati mentre `gateway.auth.mode` non è impostato, l'installazione
   viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Controllo di integrità** - avvia il Gateway e verifica che sia raggiungibile.
7. **Skills** - installa le Skills consigliate e le relative dipendenze facoltative.

<Note>
La riesecuzione dell'onboarding **non** elimina nulla, a meno che non si scelga esplicitamente
**Reimposta** (o si specifichi `--reset`). Il comando CLI `--reset` elimina per impostazione predefinita configurazione, credenziali
e sessioni; usare `--reset-scope full` per rimuovere anche lo spazio di lavoro. Se la
configurazione non è valida o contiene chiavi obsolete, l'onboarding richiede di eseguire prima
`openclaw doctor`.
</Note>

`--flow import` esegue nella procedura guidata classica un flusso di migrazione rilevato, ad esempio Hermes,
anziché una nuova configurazione; vedere [Migrazione](/it/cli/migrate) e le guide alla migrazione in
[Installazione](/it/install/migrating-hermes). `openclaw onboard --modern` è un
alias di compatibilità per [OpenClaw](/cli/openclaw). Usa lo stesso
controllo dell'inferenza di `openclaw setup`: un'inferenza verificata avvia
l'assistente, mentre un errore interattivo riporta alla configurazione guidata dell'inferenza.

## Aggiungere un altro agente

Usare `openclaw agents add <name>` per creare un agente separato con un proprio
spazio di lavoro, sessioni e profili di autenticazione. L'esecuzione senza `--workspace` avvia
un flusso interattivo per nome, spazio di lavoro, autenticazione, canali e associazioni; non è
la procedura guidata completa `openclaw onboard`.

Impostazioni configurate:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- Spazio di lavoro predefinito: `~/.openclaw/workspace-<agentId>` (oppure sotto
  `agents.defaults.workspace`, se impostato).
- Aggiungere `bindings` per instradare i messaggi in arrivo a questo agente (l'onboarding può farlo automaticamente).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per informazioni dettagliate sul comportamento passo per passo e sugli output della configurazione, vedere
[Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, vedere [Automazione della CLI](/it/start/wizard-cli-automation).
Per il riferimento completo dei flag, vedere [`openclaw onboard`](/it/cli/onboard).

## Documentazione correlata

- Riferimento dei comandi CLI: [`openclaw onboard`](/it/cli/onboard)
- Panoramica dell'onboarding: [Panoramica dell'onboarding](/it/start/onboarding-overview)
- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Procedura di primo avvio dell'agente: [Bootstrap dell'agente](/it/start/bootstrapping)
