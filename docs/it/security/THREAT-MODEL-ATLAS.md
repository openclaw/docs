---
read_when:
    - Analisi della postura di sicurezza o degli scenari di minaccia
    - Lavorare sulle funzionalità di sicurezza o sulle risposte agli audit
summary: Modello delle minacce di OpenClaw mappato al framework MITRE ATLAS
title: Modello di minaccia (MITRE ATLAS)
x-i18n:
    generated_at: "2026-05-06T18:01:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7371231e9795cd899d727b87dfba7a5cae963f1fd1e50226e3fbb7488ef7381
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## framework MITRE ATLAS

**Versione:** 1.0-draft
**Ultimo aggiornamento:** 2026-02-04
**Metodologia:** MITRE ATLAS + diagrammi di flusso dei dati
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (panorama delle minacce avversarie per sistemi di IA)

### Attribuzione del framework

Questo modello di minaccia è basato su [MITRE ATLAS](https://atlas.mitre.org/), il framework standard del settore per documentare le minacce avversarie ai sistemi di IA/ML. ATLAS è mantenuto da [MITRE](https://www.mitre.org/) in collaborazione con la comunità della sicurezza IA.

**Risorse ATLAS principali:**

- [Tecniche ATLAS](https://atlas.mitre.org/techniques/)
- [Tattiche ATLAS](https://atlas.mitre.org/tactics/)
- [Casi di studio ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuire ad ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuire a questo modello di minaccia

Questo è un documento in evoluzione mantenuto dalla comunità OpenClaw. Consulta [CONTRIBUTING-THREAT-MODEL.md](/it/security/CONTRIBUTING-THREAT-MODEL) per le linee guida su come contribuire:

- Segnalare nuove minacce
- Aggiornare minacce esistenti
- Proporre catene di attacco
- Suggerire mitigazioni

---

## 1. Introduzione

### 1.1 Scopo

Questo modello di minaccia documenta le minacce avversarie alla piattaforma di agenti IA OpenClaw e al marketplace di skill ClawHub, usando il framework MITRE ATLAS progettato specificamente per sistemi di IA/ML.

### 1.2 Ambito

| Componente             | Incluso   | Note                                             |
| ---------------------- | --------- | ------------------------------------------------ |
| Runtime agente OpenClaw | Sì        | Esecuzione principale dell'agente, chiamate agli strumenti, sessioni |
| Gateway                | Sì        | Autenticazione, instradamento, integrazione dei canali |
| Integrazioni dei canali | Sì       | WhatsApp, Telegram, Discord, Signal, Slack, ecc. |
| Marketplace ClawHub    | Sì        | Pubblicazione delle skill, moderazione, distribuzione |
| Server MCP             | Sì        | Provider di strumenti esterni                    |
| Dispositivi utente     | Parziale  | App mobili, client desktop                       |

### 1.3 Fuori ambito

Nulla è esplicitamente fuori ambito per questo modello di minaccia.

---

## 2. Architettura del sistema

### 2.1 Confini di fiducia

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flussi di dati

| Flusso | Origine | Destinazione | Dati               | Protezione           |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Canale | Gateway     | Messaggi utente    | TLS, AllowFrom       |
| F2   | Gateway | Agente       | Messaggi instradati | Isolamento della sessione |
| F3   | Agente   | Strumenti       | Invocazioni degli strumenti | Applicazione delle policy |
| F4   | Agente   | Esterno    | richieste web_fetch | Blocco SSRF        |
| F5   | ClawHub | Agente       | Codice della skill         | Moderazione, scansione |
| F6   | Agente   | Canale     | Risposte          | Filtraggio dell'output |

---

## 3. Analisi delle minacce per tattica ATLAS

### 3.1 Ricognizione (AML.TA0002)

#### T-RECON-001: Individuazione degli endpoint dell'agente

| Attributo               | Valore                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Scansione attiva                                          |
| **Descrizione**         | L'autore dell'attacco esegue scansioni alla ricerca di endpoint gateway OpenClaw esposti |
| **Vettore di attacco**       | Scansione di rete, query Shodan, enumerazione DNS                    |
| **Componenti interessati** | Gateway, endpoint API esposti                                       |
| **Mitigazioni attuali** | Opzione di autenticazione Tailscale, associazione a loopback per impostazione predefinita |
| **Rischio residuo**       | Medio - Gateway pubblici individuabili                                |
| **Raccomandazioni**     | Documentare la distribuzione sicura, aggiungere limitazione della frequenza sugli endpoint di individuazione |

#### T-RECON-002: Sondaggio dell'integrazione dei canali

| Attributo              | Valore                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0006 - Scansione attiva                                           |
| **Descrizione**        | L'attaccante sonda i canali di messaggistica per identificare account gestiti dall'IA |
| **Vettore di attacco** | Invio di messaggi di test, osservazione degli schemi di risposta       |
| **Componenti interessati** | Tutte le integrazioni dei canali                                   |
| **Mitigazioni attuali** | Nessuna specifica                                                     |
| **Rischio residuo**    | Basso - Valore limitato dalla sola scoperta                            |
| **Raccomandazioni**    | Considerare la randomizzazione dei tempi di risposta                   |

---

### 3.2 Accesso iniziale (AML.TA0004)

#### T-ACCESS-001: Intercettazione del codice di abbinamento

| Attributo              | Valore                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - Accesso all'API di inferenza del modello IA                                                        |
| **Descrizione**        | L'attaccante intercetta il codice di abbinamento durante il periodo di tolleranza per l'abbinamento (1 h per l'abbinamento del canale DM, 5 min per l'abbinamento del Node) |
| **Vettore di attacco** | Shoulder surfing, sniffing di rete, ingegneria sociale                                                         |
| **Componenti interessati** | Sistema di abbinamento dei dispositivi                                                                   |
| **Mitigazioni attuali** | Scadenza di 1 h (abbinamento DM) / scadenza di 5 min (abbinamento Node), codici inviati tramite il canale esistente |
| **Rischio residuo**    | Medio - Periodo di tolleranza sfruttabile                                                                      |
| **Raccomandazioni**    | Ridurre il periodo di tolleranza, aggiungere un passaggio di conferma                                          |

#### T-ACCESS-002: Spoofing di AllowFrom

| Attributo              | Valore                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0040 - Accesso all'API di inferenza del modello IA                         |
| **Descrizione**        | L'attaccante falsifica l'identità del mittente consentito nel canale            |
| **Vettore di attacco** | Dipende dal canale - spoofing del numero di telefono, impersonificazione del nome utente |
| **Componenti interessati** | Validazione AllowFrom per canale                                            |
| **Mitigazioni attuali** | Verifica dell'identità specifica del canale                                    |
| **Rischio residuo**    | Medio - Alcuni canali sono vulnerabili allo spoofing                            |
| **Raccomandazioni**    | Documentare i rischi specifici dei canali, aggiungere verifica crittografica dove possibile |

#### T-ACCESS-003: Furto di token

| Attributo              | Valore                                                       |
| ---------------------- | ------------------------------------------------------------ |
| **ID ATLAS**           | AML.T0040 - Accesso all'API di inferenza del modello IA      |
| **Descrizione**        | L'attaccante ruba token di autenticazione dai file di configurazione |
| **Vettore di attacco** | Malware, accesso non autorizzato al dispositivo, esposizione dei backup di configurazione |
| **Componenti interessati** | ~/.openclaw/credentials/, archiviazione della configurazione |
| **Mitigazioni attuali** | Permessi dei file                                           |
| **Rischio residuo**    | Alto - Token archiviati in testo normale                     |
| **Raccomandazioni**    | Implementare la crittografia dei token a riposo, aggiungere la rotazione dei token |

---

### 3.3 Esecuzione (AML.TA0005)

#### T-EXEC-001: Iniezione diretta di prompt

| Attributo              | Valore                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **ID ATLAS**           | AML.T0051.000 - Iniezione di prompt LLM: diretta                                           |
| **Descrizione**        | L'attaccante invia prompt creati ad hoc per manipolare il comportamento dell'agente         |
| **Vettore di attacco** | Messaggi di canale contenenti istruzioni avversarie                                        |
| **Componenti interessati** | LLM dell'agente, tutte le superfici di input                                           |
| **Mitigazioni attuali** | Rilevamento di pattern, incapsulamento del contenuto esterno                              |
| **Rischio residuo**    | Critico - Solo rilevamento, nessun blocco; gli attacchi sofisticati lo aggirano            |
| **Raccomandazioni**    | Implementare difesa multilivello, validazione dell'output, conferma dell'utente per azioni sensibili |

#### T-EXEC-002: Iniezione indiretta di prompt

| Attributo              | Valore                                                       |
| ---------------------- | ------------------------------------------------------------ |
| **ID ATLAS**           | AML.T0051.001 - Iniezione di prompt LLM: indiretta           |
| **Descrizione**        | L'attaccante incorpora istruzioni malevole nel contenuto recuperato |
| **Vettore di attacco** | URL malevoli, email avvelenate, Webhook compromessi          |
| **Componenti interessati** | web_fetch, acquisizione email, fonti di dati esterne     |
| **Mitigazioni attuali** | Incapsulamento del contenuto con tag XML e avviso di sicurezza |
| **Rischio residuo**    | Alto - L'LLM potrebbe ignorare le istruzioni dell'incapsulamento |
| **Raccomandazioni**    | Implementare la sanificazione del contenuto, separare i contesti di esecuzione |

#### T-EXEC-003: Iniezione di argomenti degli strumenti

| Attributo              | Valore                                                        |
| ---------------------- | ------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0051.000 - Iniezione di prompt LLM: diretta              |
| **Descrizione**        | L'attaccante manipola gli argomenti degli strumenti tramite iniezione di prompt |
| **Vettore di attacco** | Prompt creati ad hoc che influenzano i valori dei parametri degli strumenti |
| **Componenti interessati** | Tutte le invocazioni degli strumenti                      |
| **Mitigazioni attuali** | Approvazioni exec per comandi pericolosi                     |
| **Rischio residuo**    | Alto - Dipende dal giudizio dell'utente                       |
| **Raccomandazioni**    | Implementare la validazione degli argomenti, chiamate agli strumenti parametrizzate |

#### T-EXEC-004: Bypass dell'approvazione exec

| Attributo              | Valore                                                      |
| ---------------------- | ----------------------------------------------------------- |
| **ID ATLAS**           | AML.T0043 - Creazione di dati avversari                     |
| **Descrizione**        | L'attaccante crea comandi che aggirano l'elenco consentito per le approvazioni |
| **Vettore di attacco** | Offuscamento dei comandi, sfruttamento di alias, manipolazione dei percorsi |
| **Componenti interessati** | exec-approvals.ts, elenco consentito dei comandi       |
| **Mitigazioni attuali** | Elenco consentito + modalità di richiesta                  |
| **Rischio residuo**    | Alto - Nessuna sanificazione dei comandi                    |
| **Raccomandazioni**    | Implementare la normalizzazione dei comandi, espandere la blocklist |

---

### 3.4 Persistenza (AML.TA0006)

#### T-PERSIST-001: Installazione di Skill malevola

| Attributo              | Valore                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0010.001 - Compromissione della supply chain: software IA            |
| **Descrizione**        | L'attaccante pubblica una Skill malevola su ClawHub                       |
| **Vettore di attacco** | Creare un account, pubblicare una Skill con codice malevolo nascosto      |
| **Componenti interessati** | ClawHub, caricamento delle Skill, esecuzione dell'agente              |
| **Mitigazioni attuali** | Verifica dell'età dell'account GitHub, flag di moderazione basati su pattern |
| **Rischio residuo**    | Critico - Nessun sandboxing, revisione limitata                           |
| **Raccomandazioni**    | Integrazione VirusTotal (in corso), sandboxing delle Skill, revisione della community |

#### T-PERSIST-002: Avvelenamento dell'aggiornamento della Skill

| Attributo              | Valore                                                          |
| ---------------------- | --------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0010.001 - Compromissione della supply chain: software IA  |
| **Descrizione**        | L'attaccante compromette una Skill popolare e invia un aggiornamento malevolo |
| **Vettore di attacco** | Compromissione dell'account, ingegneria sociale del proprietario della Skill |
| **Componenti interessati** | Versioning di ClawHub, flussi di aggiornamento automatico  |
| **Mitigazioni attuali** | Fingerprinting della versione                                  |
| **Rischio residuo**    | Alto - Gli aggiornamenti automatici possono recuperare versioni malevole |
| **Raccomandazioni**    | Implementare la firma degli aggiornamenti, capacità di rollback, pinning delle versioni |

#### T-PERSIST-003: Manomissione della configurazione dell'agente

| Attributo              | Valore                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0010.002 - Compromissione della supply chain: dati          |
| **Descrizione**        | L'attaccante modifica la configurazione dell'agente per mantenere l'accesso |
| **Vettore di attacco** | Modifica dei file di configurazione, iniezione di impostazioni   |
| **Componenti interessati** | Configurazione dell'agente, policy degli strumenti          |
| **Mitigazioni attuali** | Permessi dei file                                               |
| **Rischio residuo**    | Medio - Richiede accesso locale                                  |
| **Raccomandazioni**    | Verifica dell'integrità della configurazione, logging di audit per modifiche alla configurazione |

---

### 3.5 Evasione della difesa (AML.TA0007)

#### T-EVADE-001: Bypass dei pattern di moderazione

| Attributo              | Valore                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| **ID ATLAS**           | AML.T0043 - Creazione di dati avversari                                 |
| **Descrizione**        | L'attaccante crea contenuto della Skill per eludere i pattern di moderazione |
| **Vettore di attacco** | Omoglifi Unicode, trucchi di codifica, caricamento dinamico             |
| **Componenti interessati** | moderation.ts di ClawHub                                            |
| **Mitigazioni attuali** | FLAG_RULES basate su pattern                                           |
| **Rischio residuo**    | Alto - Regex semplici facilmente aggirabili                             |
| **Raccomandazioni**    | Aggiungere analisi comportamentale (VirusTotal Code Insight), rilevamento basato su AST |

#### T-EVADE-002: Escape dall'incapsulamento del contenuto

| Attributo               | Valore                                                    |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Creazione di dati avversari                   |
| **Descrizione**         | L'attaccante crea contenuti che escono dal contesto del wrapper XML |
| **Vettore di attacco**  | Manipolazione dei tag, confusione del contesto, sovrascrittura delle istruzioni |
| **Componenti interessati** | Wrapping del contenuto esterno                         |
| **Mitigazioni attuali** | Tag XML + avviso di sicurezza                            |
| **Rischio residuo**     | Medio - Nuove evasioni vengono scoperte regolarmente      |
| **Raccomandazioni**     | Più livelli di wrapper, validazione lato output           |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: Enumerazione degli strumenti

| Attributo               | Valore                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello AI |
| **Descrizione**         | L'attaccante enumera gli strumenti disponibili tramite prompt |
| **Vettore di attacco**  | Query in stile "Quali strumenti hai?"                 |
| **Componenti interessati** | Registro degli strumenti dell'agente               |
| **Mitigazioni attuali** | Nessuna specifica                                     |
| **Rischio residuo**     | Basso - Gli strumenti sono generalmente documentati   |
| **Raccomandazioni**     | Considerare controlli sulla visibilità degli strumenti |

#### T-DISC-002: Estrazione dei dati di sessione

| Attributo               | Valore                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello AI |
| **Descrizione**         | L'attaccante estrae dati sensibili dal contesto della sessione |
| **Vettore di attacco**  | Query "Di cosa abbiamo discusso?", sondaggio del contesto |
| **Componenti interessati** | Trascrizioni di sessione, finestra di contesto      |
| **Mitigazioni attuali** | Isolamento della sessione per mittente                |
| **Rischio residuo**     | Medio - I dati all'interno della sessione sono accessibili |
| **Raccomandazioni**     | Implementare la redazione dei dati sensibili nel contesto |

---

### 3.7 Raccolta ed esfiltrazione (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Furto di dati tramite web_fetch

| Attributo               | Valore                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                                   |
| **Descrizione**         | L'attaccante esfiltra dati istruendo l'agente a inviarli a un URL esterno |
| **Vettore di attacco**  | Prompt injection che induce l'agente a inviare dati con POST al server dell'attaccante |
| **Componenti interessati** | Strumento web_fetch                                                 |
| **Mitigazioni attuali** | Blocco SSRF per reti interne                                           |
| **Rischio residuo**     | Alto - Gli URL esterni sono consentiti                                 |
| **Raccomandazioni**     | Implementare allowlist degli URL e consapevolezza della classificazione dei dati |

#### T-EXFIL-002: Invio non autorizzato di messaggi

| Attributo               | Valore                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                             |
| **Descrizione**         | L'attaccante induce l'agente a inviare messaggi contenenti dati sensibili |
| **Vettore di attacco**  | Prompt injection che induce l'agente a inviare un messaggio all'attaccante |
| **Componenti interessati** | Strumento di messaggistica, integrazioni dei canali            |
| **Mitigazioni attuali** | Controllo dell'invio di messaggi in uscita                       |
| **Rischio residuo**     | Medio - Il controllo può essere aggirato                         |
| **Raccomandazioni**     | Richiedere conferma esplicita per nuovi destinatari              |

#### T-EXFIL-003: Raccolta di credenziali

| Attributo               | Valore                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                   |
| **Descrizione**         | Una skill malevola raccoglie credenziali dal contesto dell'agente |
| **Vettore di attacco**  | Il codice della skill legge variabili d'ambiente e file di configurazione |
| **Componenti interessati** | Ambiente di esecuzione delle skill                   |
| **Mitigazioni attuali** | Nessuna specifica per le skill                         |
| **Rischio residuo**     | Critico - Le skill vengono eseguite con i privilegi dell'agente |
| **Raccomandazioni**     | Sandboxing delle skill, isolamento delle credenziali    |

---

### 3.8 Impatto (AML.TA0011)

#### T-IMPACT-001: Esecuzione non autorizzata di comandi

| Attributo               | Valore                                              |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosione dell'integrità del modello AI  |
| **Descrizione**         | L'attaccante esegue comandi arbitrari sul sistema dell'utente |
| **Vettore di attacco**  | Prompt injection combinata con bypass dell'approvazione exec |
| **Componenti interessati** | Strumento Bash, esecuzione di comandi            |
| **Mitigazioni attuali** | Approvazioni exec, opzione sandbox Docker           |
| **Rischio residuo**     | Critico - Esecuzione sull'host senza sandbox        |
| **Raccomandazioni**     | Usare la sandbox come impostazione predefinita, migliorare la UX di approvazione |

#### T-IMPACT-002: Esaurimento delle risorse (DoS)

| Attributo               | Valore                                             |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosione dell'integrità del modello AI |
| **Descrizione**         | L'attaccante esaurisce crediti API o risorse di calcolo |
| **Vettore di attacco**  | Flooding automatizzato di messaggi, chiamate a strumenti costose |
| **Componenti interessati** | Gateway, sessioni agente, provider API          |
| **Mitigazioni attuali** | Nessuna                                            |
| **Rischio residuo**     | Alto - Nessun rate limiting                        |
| **Raccomandazioni**     | Implementare limiti di frequenza per mittente e budget di costo |

#### T-IMPACT-003: Danno reputazionale

| Attributo               | Valore                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosione dell'integrità del modello AI      |
| **Descrizione**         | L'attaccante induce l'agente a inviare contenuti dannosi/offensivi |
| **Vettore di attacco**  | Prompt injection che provoca risposte inappropriate     |
| **Componenti interessati** | Generazione dell'output, messaggistica del canale    |
| **Mitigazioni attuali** | Policy sui contenuti del provider LLM                   |
| **Rischio residuo**     | Medio - I filtri del provider sono imperfetti           |
| **Raccomandazioni**     | Livello di filtraggio dell'output, controlli utente     |

---

## 4. Analisi della supply chain di ClawHub

### 4.1 Controlli di sicurezza attuali

| Controllo              | Implementazione             | Efficacia                                             |
| ---------------------- | --------------------------- | ----------------------------------------------------- |
| Età dell'account GitHub | `requireGitHubAccountAge()` | Media - Alza la barriera per i nuovi attaccanti       |
| Sanitizzazione dei percorsi | `sanitizePath()`        | Alta - Previene il path traversal                     |
| Validazione del tipo di file | `isTextFile()`         | Media - Solo file di testo, ma possono comunque essere malevoli |
| Limiti di dimensione   | Bundle totale di 50 MB       | Alta - Previene l'esaurimento delle risorse           |
| SKILL.md richiesto     | Readme obbligatorio          | Basso valore di sicurezza - Solo informativo          |
| Moderazione dei pattern | FLAG_RULES in moderation.ts | Bassa - Facilmente aggirabile                         |
| Stato della moderazione | Campo `moderationStatus`    | Media - Revisione manuale possibile                   |

### 4.2 Pattern dei flag di moderazione

Pattern attuali in `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitazioni:**

- Controlla solo slug, displayName, riepilogo, frontmatter, metadati e percorsi dei file
- Non analizza il contenuto effettivo del codice della skill
- Le regex semplici sono facilmente aggirabili con offuscamento
- Nessuna analisi comportamentale

### 4.3 Miglioramenti pianificati

| Miglioramento          | Stato                                 | Impatto                                                               |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Integrazione VirusTotal | In corso                             | Alto - Analisi comportamentale di Code Insight                        |
| Segnalazioni della community | Parziale (la tabella `skillReports` esiste) | Medio                                                         |
| Logging di audit       | Parziale (la tabella `auditLogs` esiste) | Medio                                                              |
| Sistema di badge       | Implementato                          | Medio - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matrice del rischio

### 5.1 Probabilità vs impatto

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

### 5.2 Catene di attacco critiche

**Catena di attacco 1: furto di dati basato su skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Pubblica una skill malevola) → (Elude la moderazione) → (Raccoglie credenziali)
```

**Catena di attacco 2: prompt injection verso RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inietta prompt) → (Aggira l'approvazione exec) → (Esegue comandi)
```

**Catena di attacco 3: iniezione indiretta tramite contenuto recuperato**

```
T-EXEC-002 → T-EXFIL-001 → Esfiltrazione esterna
(Avvelena il contenuto dell'URL) → (L'agente recupera e segue le istruzioni) → (Dati inviati all'attaccante)
```

---

## 6. Riepilogo delle raccomandazioni

### 6.1 Immediate (P0)

| ID    | Raccomandazione                                      | Affronta                   |
| ----- | ---------------------------------------------------- | -------------------------- |
| R-001 | Completare l'integrazione con VirusTotal             | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementare il sandboxing delle Skill               | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Aggiungere la validazione dell'output per le azioni sensibili | T-EXEC-001, T-EXEC-002     |

### 6.2 Breve termine (P1)

| ID    | Raccomandazione                                      | Affronta     |
| ----- | ---------------------------------------------------- | ------------ |
| R-004 | Implementare il rate limiting                        | T-IMPACT-002 |
| R-005 | Aggiungere la crittografia dei token a riposo        | T-ACCESS-003 |
| R-006 | Migliorare la UX e la validazione dell'approvazione di exec | T-EXEC-004   |
| R-007 | Implementare l'elenco di URL consentiti per web_fetch | T-EXFIL-001  |

### 6.3 Medio termine (P2)

| ID    | Raccomandazione                                      | Affronta      |
| ----- | ---------------------------------------------------- | ------------- |
| R-008 | Aggiungere la verifica crittografica dei canali ove possibile | T-ACCESS-002  |
| R-009 | Implementare la verifica dell'integrità della configurazione | T-PERSIST-003 |
| R-010 | Aggiungere la firma degli aggiornamenti e il blocco della versione | T-PERSIST-002 |

---

## 7. Appendici

### 7.1 Mappatura delle tecniche ATLAS

| ID ATLAS      | Nome della tecnica           | Minacce OpenClaw                                                |
| ------------- | ---------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Scansione attiva             | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Raccolta                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Catena di fornitura: software IA | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Catena di fornitura: dati    | T-PERSIST-003                                                    |
| AML.T0031     | Erosione dell'integrità del modello IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Accesso all'API di inferenza del modello IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Creazione di dati avversariali | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Prompt Injection LLM: diretta | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Prompt Injection LLM: indiretta | T-EXEC-002                                                       |

### 7.2 File di sicurezza chiave

| Percorso                            | Scopo                       | Livello di rischio |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logica di approvazione dei comandi | **Critico** |
| `src/gateway/auth.ts`               | Autenticazione del Gateway  | **Critico** |
| `src/infra/net/ssrf.ts`             | Protezione SSRF             | **Critico** |
| `src/security/external-content.ts`  | Mitigazione della Prompt Injection | **Critico** |
| `src/agents/sandbox/tool-policy.ts` | Applicazione della policy degli strumenti | **Critico** |
| `src/routing/resolve-route.ts`      | Isolamento della sessione   | **Medio**   |

### 7.3 Glossario

| Termine              | Definizione                                               |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems di MITRE      |
| **ClawHub**          | Marketplace di Skill di OpenClaw                          |
| **Gateway**          | Livello di instradamento dei messaggi e autenticazione di OpenClaw |
| **MCP**              | Model Context Protocol - interfaccia per provider di strumenti |
| **Prompt Injection** | Attacco in cui istruzioni dannose vengono incorporate nell'input |
| **Skill**            | Estensione scaricabile per gli agenti OpenClaw            |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Questo modello delle minacce è un documento vivo. Segnala i problemi di sicurezza a security@openclaw.ai_

## Correlati

- [Verifica formale](/it/security/formal-verification)
- [Contribuire al modello delle minacce](/it/security/CONTRIBUTING-THREAT-MODEL)
