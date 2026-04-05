---
read_when:
    - Revisione della postura di sicurezza o degli scenari di minaccia
    - Lavoro su funzionalità di sicurezza o risposte agli audit
summary: Modello di minaccia di OpenClaw mappato al framework MITRE ATLAS
title: Modello di minaccia (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-05T14:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Modello di minaccia di OpenClaw v1.0

## Framework MITRE ATLAS

**Versione:** 1.0-draft
**Ultimo aggiornamento:** 2026-02-04
**Metodologia:** MITRE ATLAS + diagrammi di flusso dei dati
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Panorama delle minacce avversarie per i sistemi di IA)

### Attribuzione del framework

Questo modello di minaccia è basato su [MITRE ATLAS](https://atlas.mitre.org/), il framework standard del settore per documentare le minacce avversarie ai sistemi di IA/ML. ATLAS è mantenuto da [MITRE](https://www.mitre.org/) in collaborazione con la comunità della sicurezza dell'IA.

**Risorse chiave di ATLAS:**

- [Tecniche ATLAS](https://atlas.mitre.org/techniques/)
- [Tattiche ATLAS](https://atlas.mitre.org/tactics/)
- [Casi di studio ATLAS](https://atlas.mitre.org/studies/)
- [GitHub di ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuire ad ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuire a questo modello di minaccia

Questo è un documento vivo mantenuto dalla comunità OpenClaw. Consulta [CONTRIBUTING-THREAT-MODEL.md](/it/security/CONTRIBUTING-THREAT-MODEL) per le linee guida su come contribuire:

- Segnalazione di nuove minacce
- Aggiornamento di minacce esistenti
- Proposta di catene di attacco
- Suggerimento di mitigazioni

---

## 1. Introduzione

### 1.1 Scopo

Questo modello di minaccia documenta le minacce avversarie alla piattaforma di agenti IA OpenClaw e al marketplace di Skills ClawHub, utilizzando il framework MITRE ATLAS progettato specificamente per i sistemi di IA/ML.

### 1.2 Ambito

| Componente             | Incluso | Note                                             |
| ---------------------- | ------- | ------------------------------------------------ |
| Runtime dell'agente OpenClaw | Sì      | Esecuzione core dell'agente, chiamate agli strumenti, sessioni |
| Gateway                | Sì      | Autenticazione, instradamento, integrazione dei canali |
| Integrazioni dei canali   | Sì      | WhatsApp, Telegram, Discord, Signal, Slack, ecc. |
| Marketplace ClawHub    | Sì      | Pubblicazione di Skills, moderazione, distribuzione |
| Server MCP             | Sì      | Provider di strumenti esterni                    |
| Dispositivi utente     | Parziale  | App mobili, client desktop                     |

### 1.3 Fuori ambito

Nulla è esplicitamente fuori ambito per questo modello di minaccia.

---

## 2. Architettura del sistema

### 2.1 Confini di fiducia

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NON AFFIDABILE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│            CONFINE DI FIDUCIA 1: Accesso al canale              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Pairing del dispositivo (1 h DM / 5 min periodo di grazia del nodo) │   │
│  │  • Validazione AllowFrom / AllowList                     │   │
│  │  • Autenticazione con token/password/Tailscale          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          CONFINE DI FIDUCIA 2: Isolamento della sessione        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SESSIONI DELL'AGENTE                     │   │
│  │  • Chiave sessione = agent:channel:peer                 │   │
│  │  • Policy degli strumenti per agente                    │   │
│  │  • Registrazione delle trascrizioni                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         CONFINE DI FIDUCIA 3: Esecuzione degli strumenti        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                SANDBOX DI ESECUZIONE                     │   │
│  │  • Sandbox Docker O Host (exec-approvals)               │   │
│  │  • Esecuzione remota Node                                │   │
│  │  • Protezione SSRF (pinning DNS + blocco IP)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        CONFINE DI FIDUCIA 4: Contenuti esterni                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          URL / EMAIL / WEBHOOK RECUPERATI                │   │
│  │  • Wrapping dei contenuti esterni (tag XML)              │   │
│  │  • Inserimento di avvisi di sicurezza                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          CONFINE DI FIDUCIA 5: Catena di fornitura              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Pubblicazione di Skills (semver, SKILL.md obbligatorio) │   │
│  │  • Flag di moderazione basati su pattern                │   │
│  │  • Scansione VirusTotal (in arrivo)                     │   │
│  │  • Verifica dell'età dell'account GitHub                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flussi di dati

| Flusso | Origine | Destinazione | Dati               | Protezione           |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Canale | Gateway     | Messaggi utente      | TLS, AllowFrom       |
| F2   | Gateway | Agente       | Messaggi instradati    | Isolamento della sessione    |
| F3   | Agente   | Strumenti       | Invocazioni degli strumenti   | Applicazione delle policy   |
| F4   | Agente   | Esterno    | richieste `web_fetch` | Blocco SSRF        |
| F5   | ClawHub | Agente       | Codice delle Skills         | Moderazione, scansione |
| F6   | Agente   | Canale     | Risposte          | Filtraggio dell'output     |

---

## 3. Analisi delle minacce per tattica ATLAS

### 3.1 Ricognizione (AML.TA0002)

#### T-RECON-001: Individuazione degli endpoint dell'agente

| Attributo               | Valore                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Scansione attiva                                          |
| **Descrizione**         | L'attaccante esegue una scansione per trovare endpoint gateway OpenClaw esposti                |
| **Vettore di attacco**       | Scansione di rete, query shodan, enumerazione DNS                    |
| **Componenti interessati** | Gateway, endpoint API esposti                                       |
| **Mitigazioni attuali** | Opzione di autenticazione Tailscale, bind su loopback per impostazione predefinita                   |
| **Rischio residuo**       | Medio - Gateway pubblici individuabili                                |
| **Raccomandazioni**     | Documentare il deployment sicuro, aggiungere rate limiting sugli endpoint di individuazione |

#### T-RECON-002: Sondaggio delle integrazioni dei canali

| Attributo               | Valore                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0006 - Scansione attiva                                        |
| **Descrizione**         | L'attaccante sonda i canali di messaggistica per identificare account gestiti da IA |
| **Vettore di attacco**       | Invio di messaggi di test, osservazione dei pattern di risposta                 |
| **Componenti interessati** | Tutte le integrazioni dei canali                                           |
| **Mitigazioni attuali** | Nessuna specifica                                                      |
| **Rischio residuo**       | Basso - Valore limitato dalla sola individuazione                           |
| **Raccomandazioni**     | Valutare la randomizzazione dei tempi di risposta                             |

---

### 3.2 Accesso iniziale (AML.TA0004)

#### T-ACCESS-001: Intercettazione del codice di pairing

| Attributo               | Valore                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello IA                                                                     |
| **Descrizione**         | L'attaccante intercetta il codice di pairing durante il periodo di grazia del pairing (1 h per il pairing del canale DM, 5 min per il pairing del nodo) |
| **Vettore di attacco**       | Shoulder surfing, sniffing di rete, ingegneria sociale                                                        |
| **Componenti interessati** | Sistema di pairing del dispositivo                                                                                         |
| **Mitigazioni attuali** | Scadenza di 1 h (pairing DM) / scadenza di 5 min (pairing nodo), codici inviati tramite canale esistente                            |
| **Rischio residuo**       | Medio - Periodo di grazia sfruttabile                                                                             |
| **Raccomandazioni**     | Ridurre il periodo di grazia, aggiungere una fase di conferma                                                                    |

#### T-ACCESS-002: Spoofing di AllowFrom

| Attributo               | Valore                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello IA                                      |
| **Descrizione**         | L'attaccante falsifica l'identità del mittente consentito nel canale                             |
| **Vettore di attacco**       | Dipende dal canale - spoofing del numero di telefono, impersonificazione del nome utente             |
| **Componenti interessati** | Validazione AllowFrom per canale                                               |
| **Mitigazioni attuali** | Verifica dell'identità specifica per canale                                         |
| **Rischio residuo**       | Medio - Alcuni canali vulnerabili allo spoofing                                  |
| **Raccomandazioni**     | Documentare i rischi specifici per canale, aggiungere verifica crittografica dove possibile |

#### T-ACCESS-003: Furto di token

| Attributo               | Valore                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello IA                   |
| **Descrizione**         | L'attaccante ruba token di autenticazione dai file di configurazione     |
| **Vettore di attacco**       | Malware, accesso non autorizzato al dispositivo, esposizione dei backup di configurazione |
| **Componenti interessati** | `~/.openclaw/credentials/`, archiviazione della configurazione                    |
| **Mitigazioni attuali** | Permessi dei file                                            |
| **Rischio residuo**       | Alto - Token archiviati in chiaro                           |
| **Raccomandazioni**     | Implementare la cifratura dei token a riposo, aggiungere la rotazione dei token      |

---

### 3.3 Esecuzione (AML.TA0005)

#### T-EXEC-001: Prompt injection diretta

| Attributo               | Valore                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - LLM Prompt Injection: diretta                                              |
| **Descrizione**         | L'attaccante invia prompt predisposti per manipolare il comportamento dell'agente                               |
| **Vettore di attacco**       | Messaggi del canale contenenti istruzioni avversarie                                      |
| **Componenti interessati** | LLM dell'agente, tutte le superfici di input                                                             |
| **Mitigazioni attuali** | Rilevamento di pattern, wrapping dei contenuti esterni                                              |
| **Rischio residuo**       | Critico - Solo rilevamento, nessun blocco; gli attacchi sofisticati aggirano le difese                      |
| **Raccomandazioni**     | Implementare una difesa multilivello, validazione dell'output, conferma dell'utente per azioni sensibili |

#### T-EXEC-002: Prompt injection indiretta

| Attributo               | Valore                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - LLM Prompt Injection: indiretta              |
| **Descrizione**         | L'attaccante incorpora istruzioni malevole nei contenuti recuperati   |
| **Vettore di attacco**       | URL malevoli, email avvelenate, webhook compromessi       |
| **Componenti interessati** | `web_fetch`, ingestione email, fonti di dati esterne           |
| **Mitigazioni attuali** | Wrapping del contenuto con tag XML e avviso di sicurezza          |
| **Rischio residuo**       | Alto - L'LLM può ignorare le istruzioni del wrapper                  |
| **Raccomandazioni**     | Implementare la sanitizzazione dei contenuti, contesti di esecuzione separati |

#### T-EXEC-003: Iniezione negli argomenti degli strumenti

| Attributo               | Valore                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - LLM Prompt Injection: diretta                 |
| **Descrizione**         | L'attaccante manipola gli argomenti degli strumenti tramite prompt injection |
| **Vettore di attacco**       | Prompt predisposti che influenzano i valori dei parametri degli strumenti         |
| **Componenti interessati** | Tutte le invocazioni degli strumenti                                         |
| **Mitigazioni attuali** | Approvazioni di esecuzione per comandi pericolosi                        |
| **Rischio residuo**       | Alto - Si basa sul giudizio dell'utente                               |
| **Raccomandazioni**     | Implementare la validazione degli argomenti, chiamate agli strumenti parametrizzate      |

#### T-EXEC-004: Bypass dell'approvazione di esecuzione

| Attributo               | Valore                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Creazione di dati avversari                         |
| **Descrizione**         | L'attaccante costruisce comandi che aggirano la allowlist di approvazione    |
| **Vettore di attacco**       | Offuscamento dei comandi, sfruttamento di alias, manipolazione dei percorsi |
| **Componenti interessati** | `exec-approvals.ts`, allowlist dei comandi                       |
| **Mitigazioni attuali** | Allowlist + modalità ask                                       |
| **Rischio residuo**       | Alto - Nessuna sanitizzazione dei comandi                             |
| **Raccomandazioni**     | Implementare la normalizzazione dei comandi, ampliare la blocklist          |

---

### 3.4 Persistenza (AML.TA0006)

#### T-PERSIST-001: Installazione di Skill malevole

| Attributo               | Valore                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Compromissione della catena di fornitura: software IA                     |
| **Descrizione**         | L'attaccante pubblica una Skill malevola su ClawHub                            |
| **Vettore di attacco**       | Creare un account, pubblicare una Skill con codice malevolo nascosto                 |
| **Componenti interessati** | ClawHub, caricamento delle Skills, esecuzione dell'agente                                  |
| **Mitigazioni attuali** | Verifica dell'età dell'account GitHub, flag di moderazione basati su pattern          |
| **Rischio residuo**       | Critico - Nessun sandboxing, revisione limitata                                 |
| **Raccomandazioni**     | Integrazione VirusTotal (in corso), sandboxing delle Skills, revisione della comunità |

#### T-PERSIST-002: Avvelenamento degli aggiornamenti delle Skill

| Attributo               | Valore                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Compromissione della catena di fornitura: software IA           |
| **Descrizione**         | L'attaccante compromette una Skill popolare e distribuisce un aggiornamento malevolo |
| **Vettore di attacco**       | Compromissione dell'account, ingegneria sociale del proprietario della Skill          |
| **Componenti interessati** | Versionamento di ClawHub, flussi di aggiornamento automatico                          |
| **Mitigazioni attuali** | Fingerprinting della versione                                         |
| **Rischio residuo**       | Alto - Gli aggiornamenti automatici possono recuperare versioni malevole                |
| **Raccomandazioni**     | Implementare la firma degli aggiornamenti, capacità di rollback, pinning delle versioni |

#### T-PERSIST-003: Manomissione della configurazione dell'agente

| Attributo               | Valore                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Compromissione della catena di fornitura: dati                   |
| **Descrizione**         | L'attaccante modifica la configurazione dell'agente per mantenere l'accesso         |
| **Vettore di attacco**       | Modifica del file di configurazione, iniezione di impostazioni                    |
| **Componenti interessati** | Configurazione dell'agente, policy degli strumenti                                     |
| **Mitigazioni attuali** | Permessi dei file                                                |
| **Rischio residuo**       | Medio - Richiede accesso locale                                  |
| **Raccomandazioni**     | Verifica dell'integrità della configurazione, audit logging per le modifiche di configurazione |

---

### 3.5 Elusione delle difese (AML.TA0007)

#### T-EVADE-001: Aggiramento dei pattern di moderazione

| Attributo               | Valore                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Creazione di dati avversari                                     |
| **Descrizione**         | L'attaccante crea contenuti delle Skill per eludere i pattern di moderazione             |
| **Vettore di attacco**       | Omoglifi Unicode, trucchi di codifica, caricamento dinamico                   |
| **Componenti interessati** | `ClawHub moderation.ts`                                                  |
| **Mitigazioni attuali** | `FLAG_RULES` basate su pattern                                               |
| **Rischio residuo**       | Alto - Regex semplici facilmente aggirabili                                    |
| **Raccomandazioni**     | Aggiungere analisi comportamentale (VirusTotal Code Insight), rilevamento basato su AST |

#### T-EVADE-002: Fuga dal wrapper del contenuto

| Attributo               | Valore                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Creazione di dati avversari                        |
| **Descrizione**         | L'attaccante crea contenuti che evadono il contesto del wrapper XML  |
| **Vettore di attacco**       | Manipolazione dei tag, confusione del contesto, override delle istruzioni |
| **Componenti interessati** | Wrapping dei contenuti esterni                                 |
| **Mitigazioni attuali** | Tag XML + avviso di sicurezza                                |
| **Rischio residuo**       | Medio - Nuove tecniche di evasione vengono scoperte regolarmente               |
| **Raccomandazioni**     | Più livelli di wrapper, validazione lato output           |

---

### 3.6 Individuazione (AML.TA0008)

#### T-DISC-001: Enumerazione degli strumenti

| Attributo               | Valore                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello IA             |
| **Descrizione**         | L'attaccante enumera gli strumenti disponibili tramite prompting |
| **Vettore di attacco**       | Query del tipo "Quali strumenti hai?"               |
| **Componenti interessati** | Registro degli strumenti dell'agente                                   |
| **Mitigazioni attuali** | Nessuna specifica                                         |
| **Rischio residuo**       | Basso - Gli strumenti sono generalmente documentati                      |
| **Raccomandazioni**     | Valutare controlli di visibilità degli strumenti                     |

#### T-DISC-002: Estrazione dei dati di sessione

| Attributo               | Valore                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accesso all'API di inferenza del modello IA             |
| **Descrizione**         | L'attaccante estrae dati sensibili dal contesto della sessione |
| **Vettore di attacco**       | Query del tipo "Di cosa abbiamo parlato?", sondaggio del contesto       |
| **Componenti interessati** | Trascrizioni di sessione, finestra di contesto                   |
| **Mitigazioni attuali** | Isolamento della sessione per mittente                          |
| **Rischio residuo**       | Medio - Dati della sessione accessibili all'interno della sessione               |
| **Raccomandazioni**     | Implementare la redazione dei dati sensibili nel contesto         |

---

### 3.7 Raccolta ed esfiltrazione (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Furto di dati tramite web_fetch

| Attributo               | Valore                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                                 |
| **Descrizione**         | L'attaccante esfiltra dati istruendo l'agente a inviarli a un URL esterno |
| **Vettore di attacco**       | Prompt injection che induce l'agente a eseguire il POST dei dati verso un server dell'attaccante         |
| **Componenti interessati** | Strumento `web_fetch`                                                         |
| **Mitigazioni attuali** | Blocco SSRF per le reti interne                                    |
| **Rischio residuo**       | Alto - URL esterni consentiti                                         |
| **Raccomandazioni**     | Implementare allowlist di URL, consapevolezza della classificazione dei dati              |

#### T-EXFIL-002: Invio di messaggi non autorizzato

| Attributo               | Valore                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                           |
| **Descrizione**         | L'attaccante induce l'agente a inviare messaggi contenenti dati sensibili |
| **Vettore di attacco**       | Prompt injection che induce l'agente a inviare messaggi all'attaccante               |
| **Componenti interessati** | Strumento di messaggistica, integrazioni dei canali                               |
| **Mitigazioni attuali** | Gating della messaggistica in uscita                                        |
| **Rischio residuo**       | Medio - Il gating può essere aggirato                                  |
| **Raccomandazioni**     | Richiedere conferma esplicita per nuovi destinatari                 |

#### T-EXFIL-003: Raccolta di credenziali

| Attributo               | Valore                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Raccolta                                  |
| **Descrizione**         | Una Skill malevola raccoglie credenziali dal contesto dell'agente |
| **Vettore di attacco**       | Il codice della Skill legge variabili d'ambiente, file di configurazione    |
| **Componenti interessati** | Ambiente di esecuzione della Skill                             |
| **Mitigazioni attuali** | Nessuna specifica per le Skills                                 |
| **Rischio residuo**       | Critico - Le Skills vengono eseguite con i privilegi dell'agente             |
| **Raccomandazioni**     | Sandboxing delle Skills, isolamento delle credenziali                  |

---

### 3.8 Impatto (AML.TA0011)

#### T-IMPACT-001: Esecuzione di comandi non autorizzata

| Attributo               | Valore                                               |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosione dell'integrità del modello IA                |
| **Descrizione**         | L'attaccante esegue comandi arbitrari sul sistema dell'utente |
| **Vettore di attacco**       | Prompt injection combinata con bypass dell'approvazione di esecuzione |
| **Componenti interessati** | Strumento Bash, esecuzione dei comandi                        |
| **Mitigazioni attuali** | Approvazioni di esecuzione, opzione sandbox Docker               |
| **Rischio residuo**       | Critico - Esecuzione sull'host senza sandbox           |
| **Raccomandazioni**     | Impostare il sandbox come predefinito, migliorare la UX di approvazione             |

#### T-IMPACT-002: Esaurimento delle risorse (DoS)

| Attributo               | Valore                                              |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosione dell'integrità del modello IA               |
| **Descrizione**         | L'attaccante esaurisce crediti API o risorse di calcolo |
| **Vettore di attacco**       | Flooding automatizzato di messaggi, chiamate costose agli strumenti   |
| **Componenti interessati** | Gateway, sessioni dell'agente, provider API              |
| **Mitigazioni attuali** | Nessuna                                               |
| **Rischio residuo**       | Alto - Nessun rate limiting                            |
| **Raccomandazioni**     | Implementare limiti di frequenza per mittente, budget di costo     |

#### T-IMPACT-003: Danno reputazionale

| Attributo               | Valore                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Erosione dell'integrità del modello IA                    |
| **Descrizione**         | L'attaccante induce l'agente a inviare contenuti dannosi/offensivi |
| **Vettore di attacco**       | Prompt injection che causa risposte inappropriate        |
| **Componenti interessati** | Generazione dell'output, messaggistica sui canali                    |
| **Mitigazioni attuali** | Policy sui contenuti del provider LLM                           |
| **Rischio residuo**       | Medio - I filtri del provider sono imperfetti                     |
| **Raccomandazioni**     | Livello di filtraggio dell'output, controlli utente                   |

---

## 4. Analisi della catena di fornitura di ClawHub

### 4.1 Controlli di sicurezza attuali

| Controllo              | Implementazione              | Efficacia                                        |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Età dell'account GitHub   | `requireGitHubAccountAge()` | Media - Alza la soglia per i nuovi attaccanti                |
| Sanitizzazione dei percorsi    | `sanitizePath()`            | Alta - Previene l'attraversamento dei percorsi                       |
| Validazione del tipo di file | `isTextFile()`              | Media - Solo file di testo, ma possono comunque essere malevoli |
| Limiti di dimensione          | 50 MB di bundle totale           | Alta - Previene l'esaurimento delle risorse                  |
| `SKILL.md` obbligatorio    | Readme obbligatorio            | Valore di sicurezza basso - Solo informativo              |
| Moderazione basata su pattern   | `FLAG_RULES` in `moderation.ts` | Bassa - Facilmente aggirabile                                |
| Stato di moderazione    | campo `moderationStatus`    | Media - Possibile revisione manuale                      |

### 4.2 Pattern dei flag di moderazione

Pattern attuali in `moderation.ts`:

```javascript
// Identificatori noti come dannosi
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Parole chiave sospette
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitazioni:**

- Controlla solo slug, `displayName`, summary, frontmatter, metadati, percorsi dei file
- Non analizza il contenuto reale del codice della Skill
- Regex semplici facilmente aggirabili con l'offuscamento
- Nessuna analisi comportamentale

### 4.3 Miglioramenti pianificati

| Miglioramento            | Stato                                | Impatto                                                                |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Integrazione VirusTotal | In corso                           | Alto - Analisi comportamentale di Code Insight                               |
| Segnalazione della comunità    | Parziale (esiste la tabella `skillReports`) | Medio                                                                |
| Audit logging          | Parziale (esiste la tabella `auditLogs`)    | Medio                                                                |
| Sistema di badge           | Implementato                           | Medio - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matrice del rischio

### 5.1 Probabilità vs impatto

| ID minaccia     | Probabilità | Impatto   | Livello di rischio   | Priorità |
| ------------- | ---------- | -------- | ------------ | -------- |
| T-EXEC-001    | Alta       | Critico | **Critico** | P0       |
| T-PERSIST-001 | Alta       | Critico | **Critico** | P0       |
| T-EXFIL-003   | Media     | Critico | **Critico** | P0       |
| T-IMPACT-001  | Media     | Critico | **Alto**     | P1       |
| T-EXEC-002    | Alta       | Alto     | **Alto**     | P1       |
| T-EXEC-004    | Media     | Alto     | **Alto**     | P1       |
| T-ACCESS-003  | Media     | Alto     | **Alto**     | P1       |
| T-EXFIL-001   | Media     | Alto     | **Alto**     | P1       |
| T-IMPACT-002  | Alta       | Medio   | **Alto**     | P1       |
| T-EVADE-001   | Alta       | Medio   | **Medio**   | P2       |
| T-ACCESS-001  | Bassa        | Alto     | **Medio**     | P2       |
| T-ACCESS-002  | Bassa        | Alto     | **Medio**     | P2       |
| T-PERSIST-002 | Bassa        | Alto     | **Medio**     | P2       |

### 5.2 Catene di attacco del percorso critico

**Catena di attacco 1: Furto di dati basato su Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Pubblicare una Skill malevola) → (Eludere la moderazione) → (Raccogliere credenziali)
```

**Catena di attacco 2: Prompt injection verso RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Iniettare un prompt) → (Aggirare l'approvazione di esecuzione) → (Eseguire comandi)
```

**Catena di attacco 3: Iniezione indiretta tramite contenuti recuperati**

```
T-EXEC-002 → T-EXFIL-001 → Esfiltrazione esterna
(Avvelenare il contenuto dell'URL) → (L'agente recupera e segue le istruzioni) → (Dati inviati all'attaccante)
```

---

## 6. Riepilogo delle raccomandazioni

### 6.1 Immediate (P0)

| ID    | Raccomandazione                              | Affronta                  |
| ----- | ------------------------------------------- | -------------------------- |
| R-001 | Completare l'integrazione VirusTotal             | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementare il sandboxing delle Skills                  | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Aggiungere la validazione dell'output per le azioni sensibili | T-EXEC-001, T-EXEC-002     |

### 6.2 Breve termine (P1)

| ID    | Raccomandazione                           | Affronta    |
| ----- | ---------------------------------------- | ------------ |
| R-004 | Implementare il rate limiting                  | T-IMPACT-002 |
| R-005 | Aggiungere la cifratura dei token a riposo             | T-ACCESS-003 |
| R-006 | Migliorare la UX di approvazione di esecuzione e la validazione  | T-EXEC-004   |
| R-007 | Implementare allowlist di URL per `web_fetch` | T-EXFIL-001  |

### 6.3 Medio termine (P2)

| ID    | Raccomandazione                                        | Affronta     |
| ----- | ----------------------------------------------------- | ------------- |
| R-008 | Aggiungere la verifica crittografica dei canali dove possibile | T-ACCESS-002  |
| R-009 | Implementare la verifica dell'integrità della configurazione               | T-PERSIST-003 |
| R-010 | Aggiungere la firma degli aggiornamenti e il pinning delle versioni                | T-PERSIST-002 |

---

## 7. Appendici

### 7.1 Mappatura delle tecniche ATLAS

| ID ATLAS      | Nome della tecnica                 | Minacce OpenClaw                                                 |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Scansione attiva                | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Raccolta                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Catena di fornitura: software IA      | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Catena di fornitura: dati             | T-PERSIST-003                                                    |
| AML.T0031     | Erosione dell'integrità del modello IA       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Accesso all'API di inferenza del modello IA  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Creazione di dati avversari         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM Prompt Injection: diretta   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM Prompt Injection: indiretta | T-EXEC-002                                                       |

### 7.2 File di sicurezza chiave

| Percorso                                | Scopo                     | Livello di rischio   |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logica di approvazione dei comandi      | **Critico** |
| `src/gateway/auth.ts`               | Autenticazione del Gateway      | **Critico** |
| `src/infra/net/ssrf.ts`             | Protezione SSRF             | **Critico** |
| `src/security/external-content.ts`  | Mitigazione della prompt injection | **Critico** |
| `src/agents/sandbox/tool-policy.ts` | Applicazione delle policy degli strumenti     | **Critico** |
| `src/routing/resolve-route.ts`      | Isolamento della sessione           | **Medio**   |

### 7.3 Glossario

| Termine                 | Definizione                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Panorama delle minacce avversarie per i sistemi di IA di MITRE       |
| **ClawHub**          | Marketplace di Skills di OpenClaw                              |
| **Gateway**          | Livello di instradamento dei messaggi e autenticazione di OpenClaw       |
| **MCP**              | Model Context Protocol - interfaccia del provider di strumenti          |
| **Prompt Injection** | Attacco in cui istruzioni malevole sono incorporate nell'input |
| **Skill**            | Estensione scaricabile per agenti OpenClaw                |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Questo modello di minaccia è un documento vivo. Segnala i problemi di sicurezza a security@openclaw.ai_
