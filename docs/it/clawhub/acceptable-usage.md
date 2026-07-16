---
read_when:
    - Revisione dei caricamenti per individuare abusi o violazioni delle norme
    - Redazione di documentazione sulla moderazione o di manuali operativi per revisori
    - Decidere se nascondere una skill o escludere un utente
sidebarTitle: Acceptable Usage
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
title: Uso accettabile
x-i18n:
    generated_at: "2026-07-16T14:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilizzo accettabile

ClawHub ospita Skills, Plugin, pacchetti e metadati del marketplace per OpenClaw.
Utilizzare questa pagina per stabilire se un contenuto o un comportamento di pubblicazione è appropriato per
ClawHub.

Queste regole si applicano a ciò che fa una voce, a ciò che chiede agli utenti di eseguire, al modo in cui
si presenta e al modo in cui gli editori utilizzano le funzionalità di individuazione, installazione e
attendibilità di ClawHub. Per gli stati di moderazione e la regolarità dell'account, consultare
[Moderazione e sicurezza dell'account](/clawhub/moderation). Per rivendicazioni relative al copyright o ad altri diritti,
consultare [Richieste relative ai diritti sui contenuti](/clawhub/content-rights).

## Contenuti consentiti

ClawHub accoglie contenuti utili, comprensibili e pubblicati in
buona fede.

| Categoria                                         | Consentito quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produttività degli sviluppatori                           | La voce aiuta gli utenti a sviluppare, testare, migrare, eseguire il debug, documentare o gestire software.                                               |
| Interfaccia utente, dati e flussi di lavoro di automazione               | L'ambito è chiaro, le credenziali richieste sono esplicite e le azioni rischiose includono procedure di revisione, esecuzione simulata, anteprima o conferma. |
| Sicurezza difensiva, moderazione e verifica degli abusi | Lo strumento è presentato come destinato a verifiche autorizzate, conserva le prove e mantiene chiari i limiti dell'approvazione umana.                          |
| Flussi di lavoro personali o di gruppo                       | Il flusso di lavoro utilizza account basati sul consenso, una configurazione trasparente e autorizzazioni esplicite.                                            |
| Cataloghi mantenuti                              | Ogni voce è distinta, utile, descritta accuratamente e mantenuta in modo ragionevole.                                                |

Il contesto è importante. Lo stesso argomento può essere accettabile in un contesto difensivo circoscritto o
basato sul consenso e inaccettabile quando viene proposto come flusso di lavoro per commettere abusi.

## Contenuti vietati

ClawHub non ospita contenuti il cui scopo principale sia l'abuso, l'inganno, l'esecuzione
non sicura o la violazione di diritti.

| Categoria                                                    | Non consentito                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso non autorizzato o elusione delle misure di sicurezza                      | Elusione dell'autenticazione, acquisizione indebita di account, abuso dei limiti di frequenza, acquisizione di chiamate in corso o agenti, furto riutilizzabile di sessioni o approvazione automatica dei flussi di associazione per utenti non autorizzati.                                                                                                                                                   |
| Abuso delle piattaforme ed elusione dei divieti                              | Account clandestini creati dopo un divieto, preparazione o coltivazione di account, interazioni false, automazione di più account, pubblicazione di massa, bot di spam o automazioni progettate per evitare il rilevamento.                                                                                                                                          |
| Frodi, truffe e flussi di lavoro finanziari ingannevoli             | Certificati o fatture falsi, flussi di pagamento ingannevoli, attività promozionali fraudolente, prove sociali false, flussi di lavoro basati su identità sintetiche per commettere frodi o strumenti di spesa/addebito privi di una chiara approvazione umana.                                                                                                                    |
| Arricchimento invasivo della privacy o sorveglianza                 | Raccolta di contatti per spam, doxxing, stalking, estrazione di contatti commerciali associata a comunicazioni non richieste, monitoraggio occulto, confronto biometrico non consensuale o utilizzo di dati divulgati illegalmente o archivi provenienti da violazioni.                                                                                                                  |
| Impersonificazione o manipolazione dell'identità senza consenso       | Sostituzione di volti, gemelli digitali, influencer clonati, personaggi falsi o altri strumenti utilizzati per impersonare o ingannare.                                                                                                                                                                                                 |
| Contenuti sessuali espliciti o generazione di contenuti per adulti con protezioni disattivate | Generazione di immagini, video o contenuti NSFW; wrapper per contenuti per adulti basati su API di terze parti; oppure voci il cui scopo principale è la produzione di contenuti sessuali espliciti.                                                                                                                                                       |
| Requisiti di esecuzione nascosti, non sicuri o ingannevoli        | Comandi di installazione offuscati, programmi di installazione pipe-to-shell, ad esempio contenuti scaricati eseguiti con `sh` o `bash` senza una chiara possibilità di revisione, requisiti non dichiarati relativi a segreti o chiavi private, esecuzione remota di `npx @latest` senza una chiara possibilità di revisione o metadati che nascondono ciò di cui la voce ha realmente bisogno per essere eseguita. |
| Materiale che viola il copyright o altri diritti           | Ripubblicazione senza autorizzazione di Skills, Plugin, documentazione, risorse del marchio o codice proprietario altrui; violazione dei termini di licenza; oppure impersonificazione dell'autore o dell'editore originale.                                                                                                                            |

## Comportamenti vietati nel marketplace

ClawHub verifica anche il modo in cui gli editori utilizzano il marketplace. Non utilizzare ClawHub per
manipolare l'individuazione, le metriche, gli indicatori di attendibilità, i sistemi di moderazione o
l'attenzione degli utenti.

I comportamenti vietati nel marketplace includono:

- pubblicare in massa un gran numero di voci approssimative, duplicate, segnaposto o
  generate automaticamente che non sembrano offrire un reale valore agli utenti
- inondare le superfici di ricerca o delle categorie con Skills o Plugin pressoché identici
- pubblicare centinaia di voci con un utilizzo, una manutenzione, una chiarezza delle fonti
  o una differenziazione significativa scarsi o inesistenti
- gonfiare artificialmente installazioni, download, stelle o altre metriche di coinvolgimento
  mediante automazione, cicli di autoinstallazione, account falsi, attività coordinate,
  coinvolgimento a pagamento o altri comportamenti non organici
- creare o alternare account per eludere la moderazione, i divieti, i limiti degli editori o
  la verifica del marketplace
- ingannare gli utenti riguardo a proprietà, origine, funzionalità, livello di sicurezza,
  requisiti di installazione o affiliazione con un altro progetto o editore
- caricare ripetutamente contenuti già nascosti, rimossi o bloccati
  senza correggere il problema sottostante

La pubblicazione di grandi volumi non costituisce automaticamente un abuso. I cataloghi di grandi dimensioni sono accettabili
quando le voci sono significativamente diverse, descritte accuratamente, mantenute
e utilizzate da utenti reali. I cataloghi di grandi dimensioni diventano un problema di attendibilità e sicurezza quando
il volume è associato a voci superficiali, duplicate, ingannevoli, non mantenute o
promosse artificialmente.

## Diritti sui contenuti

Se si ritiene che un contenuto su ClawHub violi il proprio copyright o altri diritti, utilizzare
[Richieste relative ai diritti sui contenuti](/clawhub/content-rights). Non utilizzare le normali segnalazioni del marketplace
per rivendicazioni relative al copyright o ad altri diritti, a meno che la voce sia anche non sicura,
dannosa o ingannevole.

## Verifica e applicazione delle regole

ClawHub può utilizzare controlli automatizzati, indicatori statistici di abuso, segnalazioni degli utenti e
verifiche da parte del personale per identificare contenuti non sicuri o comportamenti di pubblicazione abusivi. Un indicatore
non dimostra da solo un abuso; aiuta ClawHub a stabilire ciò che richiede una verifica.

ClawHub può:

- nascondere, sospendere, rimuovere, eliminare logicamente o, laddove supportato dal tipo di risorsa,
  eliminare definitivamente le voci che violano le regole
- bloccare download o installazioni per le versioni non sicure
- revocare i token API
- eliminare logicamente i contenuti associati
- limitare l'accesso alla pubblicazione
- escludere chi commette violazioni ripetute o gravi

Non è garantito che venga prima inviato un avviso in caso di abusi evidenti. Consultare
[Moderazione e sicurezza dell'account](/clawhub/moderation) per segnalazioni, sospensioni per moderazione,
voci nascoste, divieti e regolarità dell'account.
