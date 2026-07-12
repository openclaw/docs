---
read_when:
    - Revisione della postura di sicurezza o degli scenari di minaccia
    - Lavorare sulle funzionalità di sicurezza o sulle risposte agli audit
summary: Modello di minaccia di OpenClaw mappato al framework MITRE ATLAS
title: Modello di minaccia (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T07:33:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Versione:** 1.0-bozza | **Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (panorama delle minacce avversarie per i sistemi di IA) + diagrammi di flusso dei dati

Questo modello delle minacce documenta le minacce avversarie alla piattaforma di agenti di IA OpenClaw e al marketplace di Skills ClawHub. È un documento dinamico gestito dalla comunità OpenClaw. Consulta [Contribuire al modello delle minacce](/it/security/CONTRIBUTING-THREAT-MODEL) per informazioni su come segnalare nuove minacce, proporre catene di attacco o suggerire mitigazioni.

**Risorse ATLAS principali:** [Tecniche](https://atlas.mitre.org/techniques/) | [Tattiche](https://atlas.mitre.org/tactics/) | [Casi di studio](https://atlas.mitre.org/studies/) | [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data) | [Contribuire ad ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Ambito

| Componente                    | Incluso      | Note                                                    |
| ----------------------------- | ------------ | ------------------------------------------------------- |
| Runtime dell'agente OpenClaw  | Sì           | Esecuzione principale dell'agente, chiamate agli strumenti, sessioni |
| Gateway                       | Sì           | Autenticazione, instradamento, integrazione dei canali   |
| Integrazioni dei canali       | Sì           | WhatsApp, Telegram, Discord, Signal, Slack, ecc.         |
| Marketplace ClawHub           | Sì           | Pubblicazione, moderazione e distribuzione delle Skills  |
| Server MCP                    | Sì           | Fornitori di strumenti esterni                          |
| Dispositivi degli utenti      | Parzialmente | App mobili, client desktop                              |

Le segnalazioni fuori ambito e i modelli di falsi positivi (esposizione alla rete Internet pubblica, catene basate unicamente sull'iniezione di prompt senza aggiramento di un confine, operatori reciprocamente non attendibili che condividono lo stesso host Gateway e altri) sono elencati in [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); tale file, e non questa pagina, è l'attuale fonte autorevole per l'ambito delle segnalazioni di vulnerabilità.

## 2. Architettura del sistema

### 2.1 Confini di attendibilità

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NON ATTENDIBILE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CONFINE DI ATTENDIBILITÀ 1: Accesso ai canali    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Associazione dispositivo (TTL di 1 h per associazione  │   │
│  │    tramite DM / 5 min per associazione Node)              │   │
│  │  • Convalida di AllowFrom / elenco consentiti             │   │
│  │  • Autenticazione tramite token / password / Tailscale    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CONFINE DI ATTENDIBILITÀ 2: Isolamento sessioni  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESSIONI DEGLI AGENTI                   │   │
│  │  • Chiave di sessione = agent:channel:peer                │   │
│  │  • Criteri degli strumenti per ogni agente                │   │
│  │  • Registrazione delle trascrizioni                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CONFINE DI ATTENDIBILITÀ 3: Esecuzione strumenti │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SANDBOX DI ESECUZIONE                    │   │
│  │  • Sandbox Docker (predefinita) o host (approvazioni exec)│   │
│  │  • Esecuzione remota tramite Node                         │   │
│  │  • Protezione SSRF (blocco DNS + blocco IP)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CONFINE DI ATTENDIBILITÀ 4: Contenuti esterni    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              URL / E-MAIL / WEBHOOK RECUPERATI            │   │
│  │  • Incapsulamento dei contenuti esterni (tag XML con      │   │
│  │    delimitatori casuali)                                  │   │
│  │  • Inserimento di avvisi di sicurezza                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CONFINE DI ATTENDIBILITÀ 5: Catena di fornitura  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Pubblicazione di Skills (semver, SKILL.md obbligatorio)│   │
│  │  • Scansione di moderazione con pattern statici e analisi │   │
│  │    prossima all'AST                                       │   │
│  │  • Valutazione agentica dei rischi basata su LLM +        │   │
│  │    scansione VirusTotal                                   │   │
│  │  • Verifica dell'età dell'account GitHub (14 giorni)      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flussi di dati

| Flusso | Origine | Destinazione | Dati                   | Protezione                      |
| ------ | ------- | ------------ | ---------------------- | ------------------------------- |
| F1     | Canale  | Gateway      | Messaggi degli utenti  | TLS, AllowFrom                  |
| F2     | Gateway | Agente       | Messaggi instradati    | Isolamento delle sessioni       |
| F3     | Agente  | Strumenti    | Invocazioni di strumenti | Applicazione dei criteri       |
| F4     | Agente  | Esterno      | Richieste `web_fetch`  | Blocco SSRF                     |
| F5     | ClawHub | Agente       | Codice delle Skills    | Moderazione, scansione          |
| F6     | Agente  | Canale       | Risposte               | Filtraggio dell'output          |

---

## 3. Analisi delle minacce per tattica ATLAS

### 3.1 Ricognizione (AML.TA0002)

#### T-RECON-001: Individuazione degli endpoint degli agenti

| Attributo                  | Valore                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| **ID ATLAS**               | AML.T0006 - Scansione attiva                                                 |
| **Descrizione**            | L'attaccante cerca endpoint Gateway OpenClaw esposti                         |
| **Vettore di attacco**     | Scansione della rete, query Shodan, enumerazione DNS                         |
| **Componenti interessati** | Gateway, endpoint API esposti                                                |
| **Mitigazioni attuali**    | Opzione di autenticazione Tailscale, associazione a local loopback per impostazione predefinita |
| **Rischio residuo**        | Medio: i Gateway pubblici sono individuabili                                 |
| **Raccomandazioni**        | Documentare la distribuzione sicura, aggiungere la limitazione della frequenza agli endpoint di individuazione |

#### T-RECON-002: Analisi delle integrazioni dei canali

| Attributo                  | Valore                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| **ID ATLAS**               | AML.T0006 - Scansione attiva                                                 |
| **Descrizione**            | L'attaccante analizza i canali di messaggistica per identificare gli account gestiti dall'IA |
| **Vettore di attacco**     | Invio di messaggi di prova, osservazione dei modelli di risposta             |
| **Componenti interessati** | Tutte le integrazioni dei canali                                              |
| **Mitigazioni attuali**    | Nessuna specifica                                                            |
| **Rischio residuo**        | Basso: valore limitato della sola individuazione                             |
| **Raccomandazioni**        | Valutare la randomizzazione dei tempi di risposta                            |

---

### 3.2 Accesso iniziale (AML.TA0004)

#### T-ACCESS-001: Intercettazione del codice di associazione

| Attributo                | Valore                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - Accesso all'API di inferenza del modello di IA                                                          |
| **Descrizione**          | L'attaccante intercetta un codice di associazione durante la finestra di associazione (1 h per DM/associazione generica, 5 min per l'associazione del Node) |
| **Vettore di attacco**   | Osservazione furtiva, intercettazione della rete, ingegneria sociale                                                |
| **Componenti interessati** | Sistema di associazione dei dispositivi                                                                           |
| **Mitigazioni attuali**  | TTL di 1 h (DM/associazione generica), TTL di 5 min (associazione del Node); codici inviati tramite il canale esistente |
| **Rischio residuo**      | Medio - la finestra di associazione è sfruttabile                                                                   |
| **Raccomandazioni**      | Ridurre la finestra di associazione, aggiungere un passaggio di conferma                                             |

#### T-ACCESS-002: Falsificazione di AllowFrom

| Attributo                | Valore                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - Accesso all'API di inferenza del modello di IA                                     |
| **Descrizione**          | L'attaccante falsifica l'identità di un mittente autorizzato su un canale                       |
| **Vettore di attacco**   | Dipendente dal canale: falsificazione del numero di telefono, impersonificazione del nome utente |
| **Componenti interessati** | Convalida di AllowFrom per ciascun canale                                                     |
| **Mitigazioni attuali**  | Verifica dell'identità specifica per il canale                                                  |
| **Rischio residuo**      | Medio - alcuni canali rimangono vulnerabili alla falsificazione                                 |
| **Raccomandazioni**      | Documentare i rischi specifici dei canali, aggiungere la verifica crittografica ove possibile   |

#### T-ACCESS-003: Furto di token

| Attributo                | Valore                                                                          |
| ------------------------ | ------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0040 - Accesso all'API di inferenza del modello di IA                      |
| **Descrizione**          | L'attaccante sottrae i token di autenticazione dai file di configurazione/credenziali |
| **Vettore di attacco**   | Malware, accesso non autorizzato al dispositivo, esposizione dei backup di configurazione |
| **Componenti interessati** | Archiviazione delle credenziali di canali/provider, archiviazione della configurazione |
| **Mitigazioni attuali**  | Permessi dei file                                                               |
| **Rischio residuo**      | Alto - i token sono archiviati in chiaro sul disco                              |
| **Raccomandazioni**      | Implementare la cifratura dei token inattivi, aggiungere la rotazione dei token  |

---

### 3.3 Esecuzione (AML.TA0005)

#### T-EXEC-001: Iniezione diretta nel prompt

| Attributo                | Valore                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.000 - Iniezione nel prompt dell'LLM: diretta                                                                                         |
| **Descrizione**          | L'attaccante invia prompt appositamente predisposti per manipolare il comportamento dell'agente                                                 |
| **Vettore di attacco**   | Messaggi del canale contenenti istruzioni malevole                                                                                             |
| **Componenti interessati** | LLM dell'agente, tutte le superfici di input                                                                                                 |
| **Mitigazioni attuali**  | Rilevamento di schemi, incapsulamento dei contenuti esterni; considerata fuori dall'ambito delle segnalazioni di vulnerabilità in assenza dell'aggiramento di un confine di sicurezza (vedere `SECURITY.md`) |
| **Rischio residuo**      | Critico - solo rilevamento, nessun blocco; gli attacchi sofisticati lo aggirano                                                                |
| **Raccomandazioni**      | Convalida dell'output e conferma dell'utente per le azioni sensibili, in aggiunta al rilevamento esistente                                      |

#### T-EXEC-002: Iniezione indiretta nel prompt

| Attributo                | Valore                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.001 - Iniezione nel prompt dell'LLM: indiretta                                                                         |
| **Descrizione**          | L'attaccante incorpora istruzioni malevole nei contenuti recuperati                                                              |
| **Vettore di attacco**   | URL malevoli, email compromesse, Webhook compromessi                                                                             |
| **Componenti interessati** | `web_fetch`, acquisizione delle email, fonti di dati esterne                                                                    |
| **Mitigazioni attuali**  | Incapsulamento dei contenuti con marcatori in stile XML dai confini casuali, normalizzazione di omoglifi/token speciali e avviso di sicurezza |
| **Rischio residuo**      | Alto - l'LLM potrebbe comunque ignorare le istruzioni dell'incapsulamento                                                        |
| **Raccomandazioni**      | Contesti di esecuzione separati per i contenuti incapsulati                                                                      |

#### T-EXEC-003: Iniezione negli argomenti degli strumenti

| Attributo                | Valore                                                                           |
| ------------------------ | -------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0051.000 - Iniezione nel prompt dell'LLM: diretta                           |
| **Descrizione**          | L'attaccante manipola gli argomenti degli strumenti tramite l'iniezione nel prompt |
| **Vettore di attacco**   | Prompt appositamente predisposti che influenzano i valori dei parametri degli strumenti |
| **Componenti interessati** | Tutte le invocazioni degli strumenti                                           |
| **Mitigazioni attuali**  | Approvazioni dell'esecuzione per i comandi pericolosi                            |
| **Rischio residuo**      | Alto - dipende dal giudizio dell'utente                                           |
| **Raccomandazioni**      | Convalida degli argomenti, chiamate agli strumenti parametrizzate                 |

#### T-EXEC-004: Aggiramento dell'approvazione dell'esecuzione

| Attributo                | Valore                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0043 - Creazione di dati malevoli                                                                                                                                             |
| **Descrizione**          | L'attaccante crea comandi che aggirano l'elenco delle autorizzazioni                                                                                                               |
| **Vettore di attacco**   | Offuscamento dei comandi, sfruttamento degli alias, manipolazione dei percorsi                                                                                                      |
| **Componenti interessati** | `src/infra/exec-approvals*.ts`, elenco delle autorizzazioni                                                                                                                       |
| **Mitigazioni attuali**  | Elenco delle autorizzazioni + modalità di richiesta, oltre alla normalizzazione dei comandi (rimozione degli involucri di invio, rilevamento della valutazione in linea, analisi delle catene di shell) |
| **Rischio residuo**      | Alto - la normalizzazione riduce ma non elimina l'aggiramento tramite offuscamento; i rilievi relativi alla sola parità tra percorsi di esecuzione sono considerati misure di rafforzamento, non vulnerabilità (vedere `SECURITY.md`) |
| **Raccomandazioni**      | Continuare ad ampliare la copertura della normalizzazione dei comandi contro nuove tecniche di offuscamento                                                                         |

---

### 3.4 Persistenza (AML.TA0006)

#### T-PERSIST-001: Installazione di una skill malevola

| Attributo                | Valore                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **ID ATLAS**             | AML.T0010.001 - Compromissione della catena di fornitura: software di IA                                                       |
| **Descrizione**          | L'attaccante pubblica una skill malevola su ClawHub                                                                             |
| **Vettore di attacco**   | Creazione di un account, pubblicazione di una skill con codice malevolo nascosto                                                 |
| **Componenti interessati** | ClawHub, caricamento delle skill, esecuzione dell'agente                                                                       |
| **Mitigazioni attuali**  | Verifica dell'età dell'account GitHub, scansione statica di schemi e strutture adiacenti all'AST, revisione agentica dei rischi basata su LLM, scansione VirusTotal |
| **Rischio residuo**      | Alto - esistono livelli di rilevamento, ma le skill vengono comunque eseguite con i privilegi dell'agente e senza isolamento dell'esecuzione |
| **Raccomandazioni**      | Isolamento dell'esecuzione delle skill, ampliamento della revisione da parte della comunità                                      |

#### T-PERSIST-002: Avvelenamento dell'aggiornamento di una skill

| Attributo                | Valore                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **ID ATLAS**             | AML.T0010.001 - Compromissione della catena di fornitura: software di IA               |
| **Descrizione**          | L'attaccante compromette una skill popolare e distribuisce un aggiornamento malevolo    |
| **Vettore di attacco**   | Compromissione dell'account, ingegneria sociale ai danni del proprietario della skill   |
| **Componenti interessati** | Controllo delle versioni di ClawHub, flussi di aggiornamento automatico               |
| **Mitigazioni attuali**  | Impronta digitale della versione, nuova esecuzione della moderazione/scansione sulle nuove versioni |
| **Rischio residuo**      | Alto - gli aggiornamenti automatici possono scaricare versioni malevole prima del completamento della revisione |
| **Raccomandazioni**      | Firma degli aggiornamenti, funzionalità di ripristino, blocco della versione            |

#### T-PERSIST-003: Manomissione della configurazione dell'agente

| Attributo               | Valore                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Compromissione della catena di fornitura: dati         |
| **Descrizione**         | L'attaccante modifica la configurazione dell'agente per mantenere l'accesso |
| **Vettore di attacco**  | Modifica del file di configurazione, inserimento di impostazioni       |
| **Componenti interessati** | Configurazione dell'agente, criteri degli strumenti                 |
| **Mitigazioni attuali** | Permessi dei file                                                      |
| **Rischio residuo**     | Medio - richiede accesso locale                                        |
| **Raccomandazioni**     | Verifica dell'integrità della configurazione, registrazione di audit delle modifiche alla configurazione |

---

### 3.5 Elusione delle difese (AML.TA0007)

#### T-EVADE-001: Elusione dei modelli di moderazione

| Attributo               | Valore                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Creazione di dati avversari                                                        |
| **Descrizione**         | L'attaccante crea contenuti delle Skills per eludere i controlli di moderazione di ClawHub      |
| **Vettore di attacco**  | Omoglifi Unicode, espedienti di codifica, caricamento dinamico                                 |
| **Componenti interessati** | Pipeline di moderazione/scansione di ClawHub                                                |
| **Mitigazioni attuali** | Regole basate su modelli statici, scansione del codice adiacente all'AST, revisione del rischio agentico tramite LLM, VirusTotal |
| **Rischio residuo**     | Medio - nuove tecniche di offuscamento possono ancora superare le euristiche multilivello      |
| **Raccomandazioni**     | Continuare ad ampliare il corpus di modelli e comportamenti man mano che vengono scoperte nuove tecniche di elusione |

#### T-EVADE-002: Evasione dal wrapper dei contenuti

| Attributo               | Valore                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Creazione di dati avversari                                                                        |
| **Descrizione**         | L'attaccante crea contenuti che evadono dal contesto del wrapper dei contenuti esterni                         |
| **Vettore di attacco**  | Manipolazione dei tag, confusione del contesto, sovrascrittura delle istruzioni                                |
| **Componenti interessati** | Incapsulamento dei contenuti esterni                                                                        |
| **Mitigazioni attuali** | Marcatori in stile XML con delimitatori casuali e avviso di sicurezza, oltre al rilevamento della falsificazione dei marcatori mediante omoglifi o varianti degli spazi |
| **Rischio residuo**     | Medio - vengono scoperte regolarmente nuove tecniche di evasione                                               |
| **Raccomandazioni**     | Validazione dell'output oltre all'incapsulamento dell'input                                                     |

---

### 3.6 Ricognizione (AML.TA0008)

#### T-DISC-001: Enumerazione degli strumenti

| Attributo               | Valore                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello di IA            |
| **Descrizione**         | L'attaccante enumera gli strumenti disponibili tramite prompt        |
| **Vettore di attacco**  | Query del tipo "Quali strumenti hai?"                                |
| **Componenti interessati** | Registro degli strumenti dell'agente                              |
| **Mitigazioni attuali** | Nessuna specifica                                                     |
| **Rischio residuo**     | Basso - gli strumenti sono generalmente documentati                  |
| **Raccomandazioni**     | Valutare controlli sulla visibilità degli strumenti                  |

#### T-DISC-002: Estrazione dei dati della sessione

| Attributo               | Valore                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello di IA            |
| **Descrizione**         | L'attaccante estrae dati sensibili dal contesto della sessione       |
| **Vettore di attacco**  | Query del tipo "Di cosa abbiamo discusso?", analisi del contesto      |
| **Componenti interessati** | Trascrizioni delle sessioni, finestra di contesto                  |
| **Mitigazioni attuali** | Isolamento della sessione per mittente (chiave `agent:channel:peer`)  |
| **Rischio residuo**     | Medio - i dati della sessione sono accessibili per progettazione     |
| **Raccomandazioni**     | Redazione dei dati sensibili nel contesto                             |

---

### 3.7 Raccolta ed esfiltrazione (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Furto di dati tramite web_fetch

| Attributo               | Valore                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                                                        |
| **Descrizione**         | L'attaccante esfiltra dati ordinando all'agente di inviarli a un URL esterno                |
| **Vettore di attacco**  | Prompt injection che induce l'agente a inviare dati tramite POST a un server dell'attaccante |
| **Componenti interessati** | Strumento `web_fetch`                                                                    |
| **Mitigazioni attuali** | Blocco SSRF per reti interne/private (blocco DNS + blocco IP)                               |
| **Rischio residuo**     | Alto - gli URL esterni arbitrari rimangono consentiti                                       |
| **Raccomandazioni**     | Elenco di URL consentiti, consapevolezza della classificazione dei dati                     |

#### T-EXFIL-002: Invio non autorizzato di messaggi

| Attributo               | Valore                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                                               |
| **Descrizione**         | L'attaccante induce l'agente a inviare messaggi contenenti dati sensibili          |
| **Vettore di attacco**  | Prompt injection che induce l'agente a inviare un messaggio all'attaccante         |
| **Componenti interessati** | Strumento di messaggistica, integrazioni dei canali                             |
| **Mitigazioni attuali** | Controllo dell'invio dei messaggi in uscita                                        |
| **Rischio residuo**     | Medio - il controllo potrebbe essere aggirato                                      |
| **Raccomandazioni**     | Conferma esplicita per i nuovi destinatari                                         |

#### T-EXFIL-003: Acquisizione fraudolenta di credenziali

| Attributo               | Valore                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                                                                                                                              |
| **Descrizione**         | Una Skill dannosa acquisisce credenziali dal contesto dell'agente                                                                                                 |
| **Vettore di attacco**  | Il codice della Skill legge variabili di ambiente e file di configurazione                                                                                        |
| **Componenti interessati** | Ambiente di esecuzione delle Skills                                                                                                                            |
| **Mitigazioni attuali** | Scansione dei modelli di credenziali di ClawHub (segreti codificati direttamente, accesso alle variabili di ambiente delle credenziali associato a invii di rete); nessun sandboxing dell'esecuzione per le Skills in fase di runtime |
| **Rischio residuo**     | Critico - le Skills vengono eseguite con i privilegi dell'agente                                                                                                  |
| **Raccomandazioni**     | Sandboxing dell'esecuzione delle Skills, isolamento delle credenziali                                                                                              |

---

### 3.8 Impatto (AML.TA0011)

#### T-IMPACT-001: Esecuzione non autorizzata di comandi

| Attributo               | Valore                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Compromissione dell'integrità del modello di IA                                                    |
| **Descrizione**         | L'attaccante esegue comandi arbitrari sul sistema dell'utente                                                  |
| **Vettore di attacco**  | Prompt injection combinata con l'elusione dell'approvazione dell'esecuzione                                    |
| **Componenti interessati** | Strumento Bash, esecuzione dei comandi                                                                      |
| **Mitigazioni attuali** | Approvazioni dell'esecuzione, opzione sandbox Docker (backend di runtime predefinito)                           |
| **Rischio residuo**     | Critico - l'esecuzione sull'host è possibile quando la sandbox è disabilitata                                  |
| **Raccomandazioni**     | Migliorare l'esperienza utente per le approvazioni; le distribuzioni senza sandbox rimangono una scelta deliberata dell'operatore, documentata come tale |

#### T-IMPACT-002: Esaurimento delle risorse (DoS)

| Attributo               | Valore                                                        |
| ----------------------- | ------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Compromissione dell'integrità del modello di IA    |
| **Descrizione**         | L'attaccante esaurisce i crediti API o le risorse di calcolo  |
| **Vettore di attacco**  | Invio automatizzato e massivo di messaggi, chiamate costose agli strumenti |
| **Componenti interessati** | Gateway, sessioni dell'agente, fornitore API                |
| **Mitigazioni attuali** | Nessuna                                                       |
| **Rischio residuo**     | Alto - nessuna limitazione della frequenza per mittente       |
| **Raccomandazioni**     | Limiti di frequenza per mittente, budget di spesa             |

#### T-IMPACT-003: Danno reputazionale

| Attributo               | Valore                                                                |
| ----------------------- | --------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Compromissione dell'integrità del modello di IA           |
| **Descrizione**         | L'attaccante induce l'agente a inviare contenuti dannosi o offensivi  |
| **Vettore di attacco**  | Prompt injection che causa risposte inappropriate                     |
| **Componenti interessati** | Generazione dell'output, messaggistica dei canali                   |
| **Mitigazioni attuali** | Criteri sui contenuti del fornitore LLM                               |
| **Rischio residuo**     | Medio - i filtri del fornitore non sono perfetti                      |
| **Raccomandazioni**     | Livello di filtraggio dell'output, controlli utente                   |

---

## 4. Analisi della catena di fornitura di ClawHub

### 4.1 Controlli di sicurezza attuali

| Controllo                              | Implementazione                                                                                  | Efficacia                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Età dell'account GitHub                 | `requireGitHubAccountAge()` (minimo 14 giorni)                                                   | Media - aumenta la difficoltà per i nuovi attaccanti                          |
| Sanificazione dei percorsi             | `sanitizePath()`                                                                                 | Alta - impedisce l'attraversamento dei percorsi                               |
| Convalida del tipo di file             | `isTextFile()`                                                                                   | Media - vengono analizzati solo i file di testo, ma sono comunque sfruttabili |
| Limiti di dimensione                   | Bundle totale di 50 MB (`MAX_PUBLISH_TOTAL_BYTES`)                                               | Alta - impedisce l'esaurimento delle risorse                                  |
| SKILL.md obbligatorio                  | File readme obbligatorio alla pubblicazione                                                      | Basso valore di sicurezza - solo informativo                                  |
| Analisi statica e adiacente all'AST    | Motore di pattern che copre esecuzione, esfiltrazione, raccolta di credenziali, offuscamento e altro | Medio-alta - copre molti pattern di abuso noti, ma resta basato su pattern     |
| Revisione agentica dei rischi con LLM  | Verdetto basato su prompt di sicurezza alla pubblicazione                                        | Medio-alta - rileva comportamenti non individuati dai pattern statici         |
| Analisi VirusTotal                     | Integrata nei flussi di pubblicazione e nuova analisi di Skills e release dei pacchetti, subordinata alla chiave API dell'operatore | Alta quando abilitata - rilevamento tramite motore statico |
| Stato di moderazione                   | Campo `moderationStatus`                                                                         | Media - consente la revisione manuale                                         |

### 4.2 Limitazioni della moderazione

L'analisi statica di ClawHub esamina direttamente il contenuto del codice delle Skills, non soltanto slug, metadati o frontmatter, e copre chiamate di esecuzione pericolose, esecuzione dinamica del codice, raccolta di credenziali, pattern di esfiltrazione, payload offuscati e altro. Lacune note:

- Il rilevamento basato su pattern può comunque essere eluso mediante tecniche di offuscamento sufficientemente innovative.
- La revisione basata su LLM e l'analisi VirusTotal dipendono dall'abilitazione delle chiavi API e della configurazione lato operatore.
- Nessuna sandbox di esecuzione isola una Skill dai privilegi dell'agente dopo l'installazione.

### 4.3 Badge

Skills e pacchetti dispongono di badge assegnati dai moderatori: `highlighted`, `official`, `deprecated`, `redactionApproved` (solo per le Skills). Le segnalazioni della comunità (`skillReports`) e la registrazione degli audit (`auditLogs`) supportano i flussi di lavoro di moderazione.

---

## 5. Matrice dei rischi

### 5.1 Probabilità rispetto all'impatto

| ID minaccia   | Probabilità | Impatto  | Livello di rischio | Priorità |
| ------------- | ----------- | -------- | ------------------ | -------- |
| T-EXEC-001    | Alta        | Critico  | **Critico**        | P0       |
| T-PERSIST-001 | Alta        | Critico  | **Critico**        | P0       |
| T-EXFIL-003   | Media       | Critico  | **Critico**        | P0       |
| T-IMPACT-001  | Media       | Critico  | **Alto**           | P1       |
| T-EXEC-002    | Alta        | Alto     | **Alto**           | P1       |
| T-EXEC-004    | Media       | Alto     | **Alto**           | P1       |
| T-ACCESS-003  | Media       | Alto     | **Alto**           | P1       |
| T-EXFIL-001   | Media       | Alto     | **Alto**           | P1       |
| T-IMPACT-002  | Alta        | Medio    | **Alto**           | P1       |
| T-EVADE-001   | Alta        | Medio    | **Medio**          | P2       |
| T-ACCESS-001  | Bassa       | Alto     | **Medio**          | P2       |
| T-ACCESS-002  | Bassa       | Alto     | **Medio**          | P2       |
| T-PERSIST-002 | Bassa       | Alto     | **Medio**          | P2       |

### 5.2 Catene di attacco del percorso critico

**Catena 1: furto di dati tramite Skill**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Pubblicazione di una Skill dannosa) → (Elusione della moderazione) → (Raccolta delle credenziali)
```

**Catena 2: dall'iniezione di prompt all'esecuzione remota di codice**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Iniezione del prompt) → (Elusione dell'approvazione dell'esecuzione) → (Esecuzione dei comandi)
```

**Catena 3: iniezione indiretta tramite contenuto recuperato**

```text
T-EXEC-002 → T-EXFIL-001 → Esfiltrazione esterna
(Avvelenamento del contenuto dell'URL) → (L'agente recupera e segue le istruzioni) → (Invio dei dati all'attaccante)
```

---

## 6. Riepilogo delle raccomandazioni

### 6.1 Immediate (P0)

| ID    | Raccomandazione                                                  | Minacce affrontate          |
| ----- | ---------------------------------------------------------------- | --------------------------- |
| R-002 | Implementare la sandbox per l'esecuzione delle Skills             | T-PERSIST-001, T-EXFIL-003  |
| R-003 | Aggiungere la convalida dell'output per le azioni sensibili       | T-EXEC-001, T-EXEC-002      |

### 6.2 A breve termine (P1)

| ID    | Raccomandazione                                                                  | Minacce affrontate |
| ----- | -------------------------------------------------------------------------------- | ------------------ |
| R-004 | Implementare la limitazione della frequenza per mittente                         | T-IMPACT-002       |
| R-005 | Aggiungere la cifratura dei token inattivi                                       | T-ACCESS-003       |
| R-006 | Migliorare l'esperienza utente per l'approvazione dell'esecuzione e continuare ad ampliare la normalizzazione dei comandi | T-EXEC-004 |
| R-007 | Implementare una lista di URL consentiti per `web_fetch`                         | T-EXFIL-001        |

### 6.3 A medio termine (P2)

| ID    | Raccomandazione                                                        | Minacce affrontate |
| ----- | ---------------------------------------------------------------------- | ------------------ |
| R-008 | Aggiungere la verifica crittografica dei canali ove possibile          | T-ACCESS-002       |
| R-009 | Implementare la verifica dell'integrità della configurazione           | T-PERSIST-003      |
| R-010 | Aggiungere la firma degli aggiornamenti e il blocco della versione     | T-PERSIST-002      |

---

## 7. Appendici

### 7.1 Mappatura delle tecniche ATLAS

| ID ATLAS      | Nome della tecnica                         | Minacce di OpenClaw                                               |
| ------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| AML.T0006     | Scansione attiva                           | T-RECON-001, T-RECON-002                                          |
| AML.T0009     | Raccolta                                   | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                             |
| AML.T0010.001 | Catena di fornitura: software di IA        | T-PERSIST-001, T-PERSIST-002                                      |
| AML.T0010.002 | Catena di fornitura: dati                  | T-PERSIST-003                                                     |
| AML.T0031     | Compromissione dell'integrità del modello di IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                     |
| AML.T0040     | Accesso all'API di inferenza del modello di IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Creazione di dati avversari                | T-EXEC-004, T-EVADE-001, T-EVADE-002                              |
| AML.T0051.000 | Iniezione di prompt LLM: diretta           | T-EXEC-001, T-EXEC-003                                            |
| AML.T0051.001 | Iniezione di prompt LLM: indiretta         | T-EXEC-002                                                        |

### 7.2 File di sicurezza principali

| Percorso                            | Scopo                                              | Livello di rischio |
| ----------------------------------- | -------------------------------------------------- | ------------------ |
| `src/infra/exec-approvals.ts`       | Logica di approvazione dei comandi                 | **Critico**        |
| `src/gateway/auth.ts`               | Autenticazione del Gateway                         | **Critico**        |
| `src/infra/net/ssrf.ts`             | Protezione SSRF                                    | **Critico**        |
| `src/security/external-content.ts`  | Mitigazione dell'iniezione di prompt               | **Critico**        |
| `src/agents/sandbox/tool-policy.ts` | Criteri di autorizzazione/negazione degli strumenti della sandbox | **Critico** |
| `src/routing/resolve-route.ts`      | Isolamento delle sessioni / instradamento          | **Medio**          |

### 7.3 Glossario

| Termine                 | Definizione                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS**               | Panorama delle minacce avversarie per i sistemi di IA di MITRE       |
| **ClawHub**             | Marketplace delle Skills di OpenClaw                                 |
| **Gateway**             | Livello di instradamento dei messaggi e autenticazione di OpenClaw   |
| **MCP**                 | Model Context Protocol - interfaccia del fornitore di strumenti      |
| **Iniezione di prompt** | Attacco in cui istruzioni dannose vengono incorporate nell'input     |
| **Skill**               | Estensione scaricabile per gli agenti OpenClaw                       |
| **SSRF**                | Falsificazione delle richieste lato server                           |

---

_Questo modello delle minacce è un documento in continua evoluzione. Segnala i problemi di sicurezza a `security@openclaw.ai` oppure consulta la [pagina sull'affidabilità](https://trust.openclaw.ai)._

## Contenuti correlati

- [Contribuire al modello delle minacce](/it/security/CONTRIBUTING-THREAT-MODEL)
- [Risposta agli incidenti](/it/security/incident-response)
- [Proxy di rete](/it/security/network-proxy)
- [Verifica formale](/it/security/formal-verification)
