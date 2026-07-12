---
read_when:
    - Revisione dei caricamenti per individuare abusi o violazioni delle norme
    - Redazione di documentazione sulla moderazione o di manuali operativi per i revisori
    - Decidere se una skill debba essere nascosta o un utente debba essere escluso
sidebarTitle: Acceptable Usage
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
title: Uso accettabile
x-i18n:
    generated_at: "2026-07-12T06:50:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilizzo accettabile

ClawHub ospita Skills, Plugin, pacchetti e metadati del marketplace per OpenClaw.
Usa questa pagina per determinare se i contenuti o le modalità di pubblicazione sono appropriati per
ClawHub.

Queste regole si applicano a ciò che fa una scheda, a ciò che chiede agli utenti di eseguire, al modo in cui
si presenta e a come gli editori utilizzano le funzionalità di individuazione, installazione e
attendibilità di ClawHub. Per gli stati di moderazione e la reputazione dell'account, consulta
[Moderazione e sicurezza dell'account](/clawhub/moderation). Per rivendicazioni relative al diritto d'autore o ad altri diritti,
consulta [Richieste relative ai diritti sui contenuti](/clawhub/content-rights).

## Contenuti consentiti

ClawHub accoglie contenuti utili, comprensibili e pubblicati in
buona fede.

| Categoria                                         | Consentiti quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produttività degli sviluppatori                           | La scheda aiuta gli utenti a creare, testare, migrare, eseguire il debug, documentare o gestire software.                                               |
| Flussi di lavoro per interfacce utente, dati e automazione               | L'ambito è chiaro, le credenziali richieste sono esplicite e le azioni rischiose prevedono percorsi di revisione, simulazione, anteprima o conferma. |
| Sicurezza difensiva, moderazione e verifica degli abusi | Lo strumento è presentato come destinato a verifiche autorizzate, conserva le prove e mantiene chiari i limiti dell'approvazione umana.                          |
| Flussi di lavoro personali o di gruppo                       | Il flusso di lavoro utilizza account basati sul consenso, una configurazione trasparente e autorizzazioni esplicite.                                            |
| Cataloghi mantenuti                              | Ogni scheda è distinta, utile, descritta accuratamente e sottoposta a una manutenzione ragionevole.                                                |

Il contesto è importante. Lo stesso argomento può essere accettabile in un contesto difensivo ristretto o
basato sul consenso e inaccettabile quando è confezionato come flusso di lavoro per abusi.

## Contenuti vietati

ClawHub non ospita contenuti il cui scopo principale sia l'abuso, l'inganno, l'esecuzione
non sicura o la violazione di diritti.

| Categoria                                                    | Non consentiti                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso non autorizzato o elusione delle misure di sicurezza                      | Elusione dell'autenticazione, acquisizione illecita di account, abuso dei limiti di frequenza, acquisizione illecita di chiamate in corso o agenti, furto riutilizzabile di sessioni o approvazione automatica dei flussi di associazione per utenti non autorizzati.                                                                                                                                                   |
| Abuso della piattaforma ed elusione dei ban                              | Account furtivi dopo un ban, preparazione o creazione massiva di account, interazioni false, automazione multi-account, pubblicazione di massa, bot di spam o automazioni progettate per evitare il rilevamento.                                                                                                                                          |
| Frodi, truffe e flussi finanziari ingannevoli             | Certificati o fatture falsi, flussi di pagamento ingannevoli, contatti finalizzati a truffe, false prove sociali, flussi di identità sintetiche per frodi o strumenti per effettuare spese o addebiti senza una chiara approvazione umana.                                                                                                                    |
| Arricchimento dei dati invasivo per la privacy o sorveglianza                 | Raccolta di contatti per spam, divulgazione di dati personali, stalking, estrazione di potenziali clienti abbinata a contatti non richiesti, monitoraggio occulto, confronto biometrico senza consenso o utilizzo di dati trapelati o archivi provenienti da violazioni.                                                                                                                  |
| Impersonificazione non consensuale o manipolazione dell'identità       | Scambio di volti, gemelli digitali, influencer clonati, identità fittizie o altri strumenti usati per impersonare o ingannare.                                                                                                                                                                                                 |
| Contenuti sessuali espliciti o generazione di contenuti per adulti con misure di sicurezza disabilitate | Generazione di immagini, video o contenuti NSFW; interfacce per contenuti per adulti basate su API di terze parti; oppure schede il cui scopo principale è la produzione di contenuti sessuali espliciti.                                                                                                                                                       |
| Requisiti di esecuzione nascosti, non sicuri o ingannevoli        | Comandi di installazione offuscati, programmi di installazione con invio diretto alla shell, come contenuti scaricati ed eseguiti con `sh` o `bash` senza una chiara possibilità di revisione, requisiti non dichiarati relativi a segreti o chiavi private, esecuzione remota di `npx @latest` senza una chiara possibilità di revisione o metadati che nascondono ciò di cui la scheda ha realmente bisogno per funzionare. |
| Materiale che viola il diritto d'autore o altri diritti           | Ripubblicazione senza autorizzazione di Skills, Plugin, documentazione, risorse del marchio o codice proprietario altrui; violazione dei termini di licenza; oppure impersonificazione dell'autore o dell'editore originale.                                                                                                                            |

## Comportamenti vietati nel marketplace

ClawHub esamina anche il modo in cui gli editori utilizzano il marketplace. Non utilizzare ClawHub per
manipolare l'individuazione, le metriche, i segnali di attendibilità, i sistemi di moderazione o
l'attenzione degli utenti.

I comportamenti vietati nel marketplace includono:

- pubblicare in massa un gran numero di schede di scarsa qualità, duplicate, segnaposto o
  generate automaticamente che non sembrano offrire un valore reale agli utenti
- inondare le superfici di ricerca o delle categorie con Skills o Plugin quasi identici
- pubblicare centinaia di schede con un utilizzo o una manutenzione scarsi o inesistenti, poca chiarezza
  sull'origine o nessuna differenziazione significativa
- aumentare artificialmente installazioni, download, stelle o altre metriche di
  coinvolgimento tramite automazione, cicli di auto-installazione, account falsi, attività
  coordinate, coinvolgimento a pagamento o altri comportamenti non organici
- creare o ruotare account per eludere la moderazione, i ban, i limiti imposti agli editori o
  la revisione del marketplace
- ingannare gli utenti riguardo alla proprietà, all'origine, alle funzionalità, al livello di sicurezza,
  ai requisiti di installazione o all'affiliazione con un altro progetto o editore
- caricare ripetutamente contenuti già nascosti, rimossi o bloccati
  senza risolvere il problema sottostante

La pubblicazione di grandi volumi non costituisce automaticamente un abuso. I cataloghi di grandi dimensioni sono accettabili
quando le schede sono significativamente diverse, descritte accuratamente, mantenute
e utilizzate da utenti reali. I cataloghi di grandi dimensioni diventano un problema di attendibilità e sicurezza quando
il volume si accompagna a schede superficiali, duplicate, ingannevoli, non mantenute o
promosse artificialmente.

## Diritti sui contenuti

Se ritieni che un contenuto su ClawHub violi il tuo diritto d'autore o altri diritti, utilizza
[Richieste relative ai diritti sui contenuti](/clawhub/content-rights). Non utilizzare le normali segnalazioni del marketplace
per rivendicazioni relative al diritto d'autore o ad altri diritti, a meno che la scheda non sia anche non sicura,
dannosa o ingannevole.

## Revisione e applicazione

ClawHub può utilizzare controlli automatizzati, indicatori statistici di abuso, segnalazioni degli utenti e
verifiche del personale per individuare contenuti non sicuri o comportamenti di pubblicazione abusivi. Un indicatore
non dimostra da solo un abuso; aiuta ClawHub a decidere cosa debba essere sottoposto a verifica.

Possiamo:

- nascondere, sospendere, rimuovere, eliminare in modo reversibile o, ove supportato per il tipo di risorsa,
  eliminare definitivamente le schede che violano le regole
- bloccare download o installazioni di versioni non sicure
- revocare i token API
- eliminare in modo reversibile i contenuti associati
- limitare l'accesso alla pubblicazione
- bandire i trasgressori recidivi o responsabili di violazioni gravi

Non garantiamo che venga sempre fornito un avviso prima di applicare misure in caso di abusi evidenti. Consulta
[Moderazione e sicurezza dell'account](/clawhub/moderation) per informazioni su segnalazioni, sospensioni per moderazione,
schede nascoste, ban e reputazione dell'account.
