---
read_when:
    - Revisione della postura di sicurezza o degli scenari di minaccia
    - Lavorare su funzionalità di sicurezza o risposte agli audit
summary: Modello di minaccia di OpenClaw mappato sul framework MITRE ATLAS
title: Modello di minaccia (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-24T09:01:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# Modello di minaccia OpenClaw v1.0

## Framework MITRE ATLAS

**Versione:** 1.0-draft
**Ultimo aggiornamento:** 2026-02-04
**Metodologia:** MITRE ATLAS + Diagrammi di flusso dei dati
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Attribuzione del framework

Questo modello di minaccia è costruito su [MITRE ATLAS](https://atlas.mitre.org/), il framework standard di settore per documentare le minacce avversarie ai sistemi AI/ML. ATLAS è mantenuto da [MITRE](https://www.mitre.org/) in collaborazione con la comunità della sicurezza AI.

**Risorse chiave ATLAS:**

- [Tecniche ATLAS](https://atlas.mitre.org/techniques/)
- [Tattiche ATLAS](https://atlas.mitre.org/tactics/)
- [Case study ATLAS](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Contribuire ad ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuire a questo modello di minaccia

Questo è un documento vivo mantenuto dalla community OpenClaw. Vedi [CONTRIBUTING-THREAT-MODEL.md](/it/security/CONTRIBUTING-THREAT-MODEL) per le linee guida su come contribuire:

- Segnalazione di nuove minacce
- Aggiornamento di minacce esistenti
- Proposta di catene di attacco
- Suggerimento di mitigazioni

---

## 1. Introduzione

### 1.1 Scopo

Questo modello di minaccia documenta le minacce avversarie alla piattaforma di agenti AI OpenClaw e al marketplace di Skills ClawHub, usando il framework MITRE ATLAS progettato specificamente per sistemi AI/ML.

### 1.2 Ambito

| Component              | Incluso | Note                                             |
| ---------------------- | ------- | ------------------------------------------------ |
| Runtime dell'agente OpenClaw | Sì      | Esecuzione del core dell'agente, chiamate agli strumenti, sessioni |
| Gateway                | Sì      | Autenticazione, instradamento, integrazione dei canali |
| Integrazioni di canale | Sì      | WhatsApp, Telegram, Discord, Signal, Slack, ecc. |
| Marketplace ClawHub    | Sì      | Pubblicazione, moderazione, distribuzione degli Skills |
| Server MCP             | Sì      | Provider di strumenti esterni                    |
| Dispositivi utente     | Parziale | App mobili, client desktop                      |

### 1.3 Fuori ambito

Nulla è esplicitamente fuori ambito per questo modello di minaccia.

---

## 2. Architettura del sistema

### 2.1 Confini di trust

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NON ATTENDIBILE                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONFINE DI TRUST 1: Accesso al canale              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                             │   │
│  │  • Associazione dispositivi (1h DM / 5m periodo di tolleranza per Node) │
│  │  • Validazione AllowFrom / AllowList                    │   │
│  │  • Auth token/password/Tailscale                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            CONFINE DI TRUST 2: Isolamento della sessione        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESSIONI DELL'AGENTE                   │   │
│  │  • Chiave sessione = agent:channel:peer                 │   │
│  │  • Policy degli strumenti per agente                    │   │
│  │  • Logging delle trascrizioni                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           CONFINE DI TRUST 3: Esecuzione degli strumenti        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                SANDBOX DI ESECUZIONE                     │   │
│  │  • Docker sandbox OPPURE Host (exec-approvals)          │   │
│  │  • Esecuzione remota Node                               │   │
│  │  • Protezione SSRF (DNS pinning + blocco IP)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          CONFINE DI TRUST 4: Contenuto esterno                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          URL / EMAIL / WEBHOOK RECUPERATI                │   │
│  │  • Wrapping del contenuto esterno (tag XML)              │   │
│  │  • Iniezione di avvisi di sicurezza                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          CONFINE DI TRUST 5: Supply chain                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Pubblicazione Skills (semver, SKILL.md obbligatorio)  │   │
│  │  • Flag di moderazione basati su pattern                 │   │
│  │  • Scansione VirusTotal (in arrivo)                      │   │
│  │  • Verifica dell'età dell'account GitHub                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flussi di dati

| Flow | Sorgente | Destinazione | Dati              | Protezione           |
| ---- | -------- | ------------ | ----------------- | -------------------- |
| F1   | Canale   | Gateway      | Messaggi utente   | TLS, AllowFrom       |
| F2   | Gateway  | Agente       | Messaggi instradati | Isolamento sessione |
| F3   | Agente   | Strumenti    | Invocazioni di strumenti | Applicazione della policy |
| F4   | Agente   | Esterno      | richieste web_fetch | Blocco SSRF        |
| F5   | ClawHub  | Agente       | Codice Skills     | Moderazione, scansione |
| F6   | Agente   | Canale       | Risposte          | Filtro dell'output   |

---

## 3. Analisi delle minacce per tattica ATLAS

### 3.1 Ricognizione (AML.TA0002)

#### T-RECON-001: Scoperta dell'endpoint dell'agente

| Attributo               | Valore                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Active Scanning                                          |
| **Descrizione**         | Un attaccante esegue la scansione di endpoint Gateway OpenClaw esposti |
| **Vettore di attacco**  | Scansione di rete, query shodan, enumerazione DNS                    |
| **Componenti interessati** | Gateway, endpoint API esposti                                    |
| **Mitigazioni attuali** | Opzione auth Tailscale, bind su loopback per impostazione predefinita |
| **Rischio residuo**     | Medio - I Gateway pubblici sono individuabili                        |
| **Raccomandazioni**     | Documentare una distribuzione sicura, aggiungere rate limiting sugli endpoint di discovery |

#### T-RECON-002: Probing dell'integrazione di canale

| Attributo               | Valore                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Active Scanning                                          |
| **Descrizione**         | Un attaccante esegue probing dei canali di messaggistica per identificare account gestiti da AI |
| **Vettore di attacco**  | Invio di messaggi di prova, osservazione dei pattern di risposta     |
| **Componenti interessati** | Tutte le integrazioni di canale                                  |
| **Mitigazioni attuali** | Nessuna specifica                                                    |
| **Rischio residuo**     | Basso - Valore limitato derivante dalla sola discovery               |
| **Raccomandazioni**     | Valutare la randomizzazione dei tempi di risposta                    |

---

### 3.2 Accesso iniziale (AML.TA0004)

#### T-ACCESS-001: Intercettazione del codice di associazione

| Attributo               | Valore                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                                                       |
| **Descrizione**         | L'attaccante intercetta il codice di associazione durante il periodo di tolleranza dell'associazione (1h per l'associazione DM del canale, 5m per l'associazione del Node) |
| **Vettore di attacco**  | Shoulder surfing, sniffing di rete, social engineering                                                          |
| **Componenti interessati** | Sistema di associazione dei dispositivi                                                                      |
| **Mitigazioni attuali** | Scadenza 1h (associazione DM) / 5m (associazione Node), codici inviati tramite canale esistente               |
| **Rischio residuo**     | Medio - Il periodo di tolleranza è sfruttabile                                                                  |
| **Raccomandazioni**     | Ridurre il periodo di tolleranza, aggiungere un passaggio di conferma                                           |

#### T-ACCESS-002: Spoofing di AllowFrom

| Attributo               | Valore                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                      |
| **Descrizione**         | L'attaccante falsifica l'identità di un mittente consentito nel canale         |
| **Vettore di attacco**  | Dipende dal canale - spoofing del numero di telefono, impersonificazione del nome utente |
| **Componenti interessati** | Validazione AllowFrom per canale                                            |
| **Mitigazioni attuali** | Verifica dell'identità specifica del canale                                    |
| **Rischio residuo**     | Medio - Alcuni canali sono vulnerabili allo spoofing                           |
| **Raccomandazioni**     | Documentare i rischi specifici del canale, aggiungere verifica crittografica dove possibile |

#### T-ACCESS-003: Furto di token

| Attributo               | Valore                                                         |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                      |
| **Descrizione**         | L'attaccante ruba token di autenticazione dai file di configurazione |
| **Vettore di attacco**  | Malware, accesso non autorizzato al dispositivo, esposizione del backup della configurazione |
| **Componenti interessati** | ~/.openclaw/credentials/, archiviazione della configurazione |
| **Mitigazioni attuali** | Permessi sui file                                              |
| **Rischio residuo**     | Alto - I token sono archiviati in chiaro                       |
| **Raccomandazioni**     | Implementare cifratura dei token a riposo, aggiungere rotazione dei token |

---

### 3.3 Esecuzione (AML.TA0005)

#### T-EXEC-001: Prompt Injection diretta

| Attributo               | Valore                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                                                 |
| **Descrizione**         | L'attaccante invia prompt costruiti per manipolare il comportamento dell'agente              |
| **Vettore di attacco**  | Messaggi del canale contenenti istruzioni avversarie                                         |
| **Componenti interessati** | LLM dell'agente, tutte le superfici di input                                              |
| **Mitigazioni attuali** | Rilevamento di pattern, wrapping del contenuto esterno                                       |
| **Rischio residuo**     | Critico - Solo rilevamento, nessun blocco; gli attacchi sofisticati aggirano le difese      |
| **Raccomandazioni**     | Implementare difesa multilivello, validazione dell'output, conferma utente per azioni sensibili |

#### T-EXEC-002: Prompt Injection indiretta

| Attributo               | Valore                                                         |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - LLM Prompt Injection: Indirect                 |
| **Descrizione**         | L'attaccante incorpora istruzioni malevole nel contenuto recuperato |
| **Vettore di attacco**  | URL malevoli, email avvelenate, Webhook compromessi            |
| **Componenti interessati** | web_fetch, ingestione email, fonti di dati esterne          |
| **Mitigazioni attuali** | Wrapping del contenuto con tag XML e avviso di sicurezza       |
| **Rischio residuo**     | Alto - L'LLM potrebbe ignorare le istruzioni del wrapper       |
| **Raccomandazioni**     | Implementare sanitizzazione del contenuto, contesti di esecuzione separati |

#### T-EXEC-003: Iniezione di argomenti degli strumenti

| Attributo               | Valore                                                         |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                   |
| **Descrizione**         | L'attaccante manipola gli argomenti degli strumenti tramite prompt injection |
| **Vettore di attacco**  | Prompt costruiti che influenzano i valori dei parametri degli strumenti |
| **Componenti interessati** | Tutte le invocazioni di strumenti                           |
| **Mitigazioni attuali** | Approvazioni exec per comandi pericolosi                       |
| **Rischio residuo**     | Alto - Fa affidamento sul giudizio dell'utente                 |
| **Raccomandazioni**     | Implementare validazione degli argomenti, chiamate agli strumenti parametrizzate |

#### T-EXEC-004: Bypass delle approvazioni exec

| Attributo               | Valore                                                         |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                             |
| **Descrizione**         | L'attaccante costruisce comandi che aggirano la allowlist delle approvazioni |
| **Vettore di attacco**  | Offuscamento dei comandi, sfruttamento di alias, manipolazione del percorso |
| **Componenti interessati** | exec-approvals.ts, allowlist dei comandi                    |
| **Mitigazioni attuali** | Allowlist + modalità ask                                       |
| **Rischio residuo**     | Alto - Nessuna sanitizzazione dei comandi                      |
| **Raccomandazioni**     | Implementare normalizzazione dei comandi, ampliare la blocklist |

---

### 3.4 Persistenza (AML.TA0006)

#### T-PERSIST-001: Installazione di Skills malevoli

| Attributo               | Valore                                                                      |
| ----------------------- | --------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software                        |
| **Descrizione**         | L'attaccante pubblica uno Skills malevolo su ClawHub                        |
| **Vettore di attacco**  | Creazione di account, pubblicazione di uno Skills con codice malevolo nascosto |
| **Componenti interessati** | ClawHub, caricamento degli Skills, esecuzione dell'agente                |
| **Mitigazioni attuali** | Verifica dell'età dell'account GitHub, flag di moderazione basati su pattern |
| **Rischio residuo**     | Critico - Nessun sandboxing, revisione limitata                             |
| **Raccomandazioni**     | Integrazione VirusTotal (in corso), sandboxing degli Skills, revisione della community |

#### T-PERSIST-002: Avvelenamento degli aggiornamenti degli Skills

| Attributo               | Valore                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software             |
| **Descrizione**         | L'attaccante compromette uno Skills popolare e pubblica un aggiornamento malevolo |
| **Vettore di attacco**  | Compromissione dell'account, social engineering del proprietario dello Skills |
| **Componenti interessati** | Versioning di ClawHub, flussi di auto-update                  |
| **Mitigazioni attuali** | Fingerprinting della versione                                    |
| **Rischio residuo**     | Alto - Gli auto-update possono scaricare versioni malevole       |
| **Raccomandazioni**     | Implementare firma degli aggiornamenti, capacità di rollback, version pinning |

#### T-PERSIST-003: Manomissione della configurazione dell'agente

| Attributo               | Valore                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.002 - Supply Chain Compromise: Data                    |
| **Descrizione**         | L'attaccante modifica la configurazione dell'agente per mantenere l'accesso |
| **Vettore di attacco**  | Modifica del file di configurazione, iniezione di impostazioni   |
| **Componenti interessati** | Configurazione dell'agente, policy degli strumenti            |
| **Mitigazioni attuali** | Permessi sui file                                                |
| **Rischio residuo**     | Medio - Richiede accesso locale                                  |
| **Raccomandazioni**     | Verifica di integrità della configurazione, audit logging per le modifiche di configurazione |

---

### 3.5 Elusione delle difese (AML.TA0007)

#### T-EVADE-001: Bypass dei pattern di moderazione

| Attributo               | Valore                                                                   |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                                       |
| **Descrizione**         | L'attaccante costruisce contenuti degli Skills per aggirare i pattern di moderazione |
| **Vettore di attacco**  | Omoglifi Unicode, trucchi di encoding, caricamento dinamico              |
| **Componenti interessati** | moderation.ts di ClawHub                                              |
| **Mitigazioni attuali** | `FLAG_RULES` basate su pattern                                           |
| **Rischio residuo**     | Alto - Semplici regex aggirabili facilmente                              |
| **Raccomandazioni**     | Aggiungere analisi comportamentale (VirusTotal Code Insight), rilevamento basato su AST |

#### T-EVADE-002: Escape del wrapper del contenuto

| Attributo               | Valore                                                      |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                          |
| **Descrizione**         | L'attaccante costruisce contenuti che sfuggono al contesto del wrapper XML |
| **Vettore di attacco**  | Manipolazione dei tag, confusione del contesto, override delle istruzioni |
| **Componenti interessati** | Wrapping del contenuto esterno                           |
| **Mitigazioni attuali** | Tag XML + avviso di sicurezza                               |
| **Rischio residuo**     | Medio - Nuove tecniche di escape vengono scoperte regolarmente |
| **Raccomandazioni**     | Più livelli di wrapping, validazione lato output            |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: Enumerazione degli strumenti

| Attributo               | Valore                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access               |
| **Descrizione**         | L'attaccante enumera gli strumenti disponibili tramite prompting |
| **Vettore di attacco**  | Query del tipo "Quali strumenti hai?"                   |
| **Componenti interessati** | Registro degli strumenti dell'agente                |
| **Mitigazioni attuali** | Nessuna specifica                                       |
| **Rischio residuo**     | Basso - Gli strumenti sono in genere documentati        |
| **Raccomandazioni**     | Valutare controlli di visibilità degli strumenti        |

#### T-DISC-002: Estrazione dei dati di sessione

| Attributo               | Valore                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access               |
| **Descrizione**         | L'attaccante estrae dati sensibili dal contesto della sessione |
| **Vettore di attacco**  | Query del tipo "Di cosa abbiamo parlato?", probing del contesto |
| **Componenti interessati** | Trascrizioni di sessione, finestra di contesto       |
| **Mitigazioni attuali** | Isolamento della sessione per mittente                  |
| **Rischio residuo**     | Medio - I dati all'interno della sessione sono accessibili |
| **Raccomandazioni**     | Implementare la redazione dei dati sensibili nel contesto |

---

### 3.7 Raccolta ed esfiltrazione (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Furto di dati tramite web_fetch

| Attributo               | Valore                                                                    |
| ----------------------- | ------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Collection                                                    |
| **Descrizione**         | L'attaccante esfiltra dati istruendo l'agente a inviarli a un URL esterno |
| **Vettore di attacco**  | Prompt injection che induce l'agente a fare POST di dati verso un server dell'attaccante |
| **Componenti interessati** | Strumento web_fetch                                                    |
| **Mitigazioni attuali** | Blocco SSRF per reti interne                                              |
| **Rischio residuo**     | Alto - Gli URL esterni sono consentiti                                    |
| **Raccomandazioni**     | Implementare allowlist di URL, consapevolezza della classificazione dei dati |

#### T-EXFIL-002: Invio non autorizzato di messaggi

| Attributo               | Valore                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0009 - Collection                                             |
| **Descrizione**         | L'attaccante induce l'agente a inviare messaggi contenenti dati sensibili |
| **Vettore di attacco**  | Prompt injection che induce l'agente a mandare messaggi all'attaccante |
| **Componenti interessati** | Strumento messaggi, integrazioni di canale                      |
| **Mitigazioni attuali** | Gating dei messaggi in uscita                                      |
| **Rischio residuo**     | Medio - Il gating può essere aggirato                              |
| **Raccomandazioni**     | Richiedere conferma esplicita per nuovi destinatari                |

#### T-EXFIL-003: Raccolta di credenziali

| Attributo               | Valore                                                    |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Collection                                    |
| **Descrizione**         | Uno Skills malevolo raccoglie credenziali dal contesto dell'agente |
| **Vettore di attacco**  | Il codice dello Skills legge variabili d'ambiente, file di configurazione |
| **Componenti interessati** | Ambiente di esecuzione degli Skills                    |
| **Mitigazioni attuali** | Nessuna specifica per gli Skills                          |
| **Rischio residuo**     | Critico - Gli Skills girano con i privilegi dell'agente   |
| **Raccomandazioni**     | Sandboxing degli Skills, isolamento delle credenziali     |

---

### 3.8 Impatto (AML.TA0011)

#### T-IMPACT-001: Esecuzione di comandi non autorizzata

| Attributo               | Valore                                                |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                  |
| **Descrizione**         | L'attaccante esegue comandi arbitrari sul sistema dell'utente |
| **Vettore di attacco**  | Prompt injection combinata con bypass dell'approvazione exec |
| **Componenti interessati** | Strumento Bash, esecuzione comandi                 |
| **Mitigazioni attuali** | Approvazioni exec, opzione Docker sandbox             |
| **Rischio residuo**     | Critico - Esecuzione host senza sandbox               |
| **Raccomandazioni**     | Rendere predefinita la sandbox, migliorare la UX delle approvazioni |

#### T-IMPACT-002: Esaurimento delle risorse (DoS)

| Attributo               | Valore                                               |
| ----------------------- | ---------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                 |
| **Descrizione**         | L'attaccante esaurisce crediti API o risorse di calcolo |
| **Vettore di attacco**  | Flood di messaggi automatizzato, chiamate costose agli strumenti |
| **Componenti interessati** | Gateway, sessioni dell'agente, provider API      |
| **Mitigazioni attuali** | Nessuna                                              |
| **Rischio residuo**     | Alto - Nessun rate limiting                          |
| **Raccomandazioni**     | Implementare rate limit per mittente, budget di costo |

#### T-IMPACT-003: Danno reputazionale

| Attributo               | Valore                                                    |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                      |
| **Descrizione**         | L'attaccante induce l'agente a inviare contenuti dannosi/offensivi |
| **Vettore di attacco**  | Prompt injection che provoca risposte inappropriate       |
| **Componenti interessati** | Generazione dell'output, messaggistica di canale       |
| **Mitigazioni attuali** | Policy di contenuto del provider LLM                      |
| **Rischio residuo**     | Medio - I filtri del provider non sono perfetti           |
| **Raccomandazioni**     | Livello di filtro dell'output, controlli utente           |

---

## 4. Analisi della supply chain ClawHub

### 4.1 Controlli di sicurezza attuali

| Controllo            | Implementazione               | Efficacia                                                  |
| -------------------- | ----------------------------- | ---------------------------------------------------------- |
| Età dell'account GitHub | `requireGitHubAccountAge()` | Medio - Alza la soglia per nuovi attaccanti                |
| Sanitizzazione del percorso | `sanitizePath()`       | Alto - Previene il path traversal                          |
| Validazione del tipo di file | `isTextFile()`        | Medio - Solo file di testo, ma possono comunque essere malevoli |
| Limiti di dimensione | bundle totale 50MB            | Alto - Previene l'esaurimento delle risorse                |
| SKILL.md obbligatorio | readme obbligatorio          | Basso valore di sicurezza - Solo informativo               |
| Moderazione a pattern | `FLAG_RULES` in moderation.ts | Basso - Facilmente aggirabile                              |
| Stato di moderazione | campo `moderationStatus`      | Medio - Possibile revisione manuale                        |

### 4.2 Pattern di flag della moderazione

Pattern attuali in `moderation.ts`:

```javascript
// Identificatori noti come malevoli
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Keyword sospette
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitazioni:**

- Controlla solo slug, displayName, summary, frontmatter, metadati, percorsi dei file
- Non analizza il contenuto del codice effettivo degli Skills
- Semplici regex facilmente aggirabili con offuscamento
- Nessuna analisi comportamentale

### 4.3 Miglioramenti pianificati

| Miglioramento          | Stato                                 | Impatto                                                              |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Integrazione VirusTotal | In corso                             | Alto - Analisi comportamentale con Code Insight                      |
| Segnalazione della community | Parziale (`skillReports` table exists) | Medio                                                            |
| Audit logging          | Parziale (`auditLogs` table exists)   | Medio                                                                |
| Sistema di badge       | Implementato                          | Medio - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matrice del rischio

### 5.1 Probabilità vs impatto

| Threat ID     | Probabilità | Impatto  | Livello di rischio | Priorità |
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

**Catena di attacco 1: furto di dati basato su Skills**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Pubblicare uno Skills malevolo) → (Aggirare la moderazione) → (Raccogliere credenziali)
```

**Catena di attacco 2: Prompt Injection verso RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Iniettare un prompt) → (Aggirare l'approvazione exec) → (Eseguire comandi)
```

**Catena di attacco 3: Iniezione indiretta tramite contenuto recuperato**

```
T-EXEC-002 → T-EXFIL-001 → Esfiltrazione esterna
(Avvelenare il contenuto di un URL) → (L'agente recupera e segue le istruzioni) → (Dati inviati all'attaccante)
```

---

## 6. Riepilogo delle raccomandazioni

### 6.1 Immediate (P0)

| ID    | Raccomandazione                              | Affronta                   |
| ----- | -------------------------------------------- | -------------------------- |
| R-001 | Completare l'integrazione con VirusTotal     | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementare il sandboxing degli Skills      | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Aggiungere validazione dell'output per azioni sensibili | T-EXEC-001, T-EXEC-002     |

### 6.2 Breve termine (P1)

| ID    | Raccomandazione                              | Affronta     |
| ----- | -------------------------------------------- | ------------ |
| R-004 | Implementare il rate limiting                | T-IMPACT-002 |
| R-005 | Aggiungere cifratura dei token a riposo      | T-ACCESS-003 |
| R-006 | Migliorare UX e validazione delle approvazioni exec | T-EXEC-004   |
| R-007 | Implementare allowlist di URL per web_fetch  | T-EXFIL-001  |

### 6.3 Medio termine (P2)

| ID    | Raccomandazione                                         | Affronta      |
| ----- | ------------------------------------------------------- | ------------- |
| R-008 | Aggiungere verifica crittografica del canale dove possibile | T-ACCESS-002  |
| R-009 | Implementare verifica di integrità della configurazione | T-PERSIST-003 |
| R-010 | Aggiungere firma degli aggiornamenti e version pinning  | T-PERSIST-002 |

---

## 7. Appendici

### 7.1 Mappatura delle tecniche ATLAS

| ATLAS ID      | Nome della tecnica             | Minacce OpenClaw                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                       |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                      |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                           |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002   |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                         |

### 7.2 File chiave di sicurezza

| Percorso                            | Scopo                        | Livello di rischio |
| ----------------------------------- | ---------------------------- | ------------------ |
| `src/infra/exec-approvals.ts`       | Logica di approvazione dei comandi | **Critico** |
| `src/gateway/auth.ts`               | Autenticazione del Gateway   | **Critico** |
| `src/infra/net/ssrf.ts`             | Protezione SSRF             | **Critico** |
| `src/security/external-content.ts`  | Mitigazione della Prompt Injection | **Critico** |
| `src/agents/sandbox/tool-policy.ts` | Applicazione della policy degli strumenti | **Critico** |
| `src/routing/resolve-route.ts`      | Isolamento della sessione    | **Medio**   |

### 7.3 Glossario

| Termine              | Definizione                                               |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems di MITRE      |
| **ClawHub**          | Marketplace di Skills di OpenClaw                         |
| **Gateway**          | Livello di instradamento dei messaggi e autenticazione di OpenClaw |
| **MCP**              | Model Context Protocol - interfaccia del provider di strumenti |
| **Prompt Injection** | Attacco in cui istruzioni malevole vengono incorporate nell'input |
| **Skills**           | Estensione scaricabile per gli agenti OpenClaw            |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Questo modello di minaccia è un documento vivo. Segnala i problemi di sicurezza a security@openclaw.ai_

## Correlati

- [Verifica formale](/it/security/formal-verification)
- [Contribuire al modello di minaccia](/it/security/CONTRIBUTING-THREAT-MODEL)
