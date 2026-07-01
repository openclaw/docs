---
read_when:
    - Revisione dei caricamenti per abusi o violazioni delle norme
    - Scrittura di documentazione sulla moderazione o runbook per revisori
    - Decidere se una skill debba essere nascosta o un utente bannato
sidebarTitle: Acceptable Usage
summary: 'Criteri del marketplace: cosa consente ClawHub e cosa non ospiterà.'
title: Uso accettabile
x-i18n:
    generated_at: "2026-07-01T20:23:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Accettabile

ClawHub ospita Skills, plugin, pacchetti e metadati del marketplace per OpenClaw.
Usa questa pagina per decidere se contenuti o comportamenti di pubblicazione appartengono a
ClawHub.

Queste regole si applicano a ciò che fa un'inserzione, a ciò che chiede agli utenti di eseguire, a come
rappresenta se stessa e a come gli editori usano le superfici di scoperta, installazione e
fiducia di ClawHub. Per gli stati di moderazione e la posizione dell'account, consulta
[Moderazione e sicurezza dell'account](/clawhub/moderation). Per copyright o altre rivendicazioni di diritti,
consulta [Richieste sui diritti dei contenuti](/it/clawhub/content-rights).

## Contenuti consentiti

ClawHub accoglie contenuti utili, comprensibili e pubblicati in buona
fede.

| Categoria                                         | Consentito quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produttività degli sviluppatori                           | L'inserzione aiuta gli utenti a creare, testare, migrare, eseguire debug, documentare o gestire software.                                               |
| Flussi di lavoro per UI, dati e automazione               | L'ambito è chiaro, le credenziali richieste sono esplicite e le azioni rischiose includono percorsi di revisione, dry run, anteprima o conferma. |
| Sicurezza difensiva, moderazione e revisione degli abusi | Lo strumento è presentato per revisioni autorizzate, conserva le prove e mantiene chiari i confini dell'approvazione umana.                          |
| Flussi di lavoro personali o di team                       | Il flusso di lavoro usa account basati sul consenso, configurazione trasparente e autorizzazioni esplicite.                                            |
| Cataloghi mantenuti                              | Ogni inserzione è distinta, utile, descritta accuratamente e mantenuta in modo ragionevole.                                                |

Il contesto conta. Lo stesso argomento può essere accettabile in un'impostazione difensiva ristretta o
basata sul consenso e inaccettabile quando viene confezionato come flusso di lavoro di abuso.

## Contenuti non consentiti

ClawHub non ospita contenuti il cui scopo principale sia abuso, inganno, esecuzione
non sicura o violazione di diritti.

| Categoria                                                    | Non consentito                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso non autorizzato o aggiramento della sicurezza                      | Aggiramento dell'autenticazione, compromissione di account, abuso dei limiti di frequenza, compromissione di chiamate live o agenti, furto riutilizzabile di sessioni o approvazione automatica di flussi di associazione per utenti non approvati.                                                                                                                                                   |
| Abuso della piattaforma ed elusione dei ban                              | Account furtivi dopo ban, riscaldamento o coltivazione di account, engagement falso, automazione multi-account, pubblicazione di massa, bot di spam o automazione costruita per evitare il rilevamento.                                                                                                                                          |
| Frodi, truffe e flussi di lavoro finanziari ingannevoli             | Certificati o fatture falsi, flussi di pagamento ingannevoli, contatti per truffe, prove sociali false, flussi di lavoro con identità sintetiche per frodi o strumenti di spesa/addebito senza chiara approvazione umana.                                                                                                                    |
| Arricchimento invasivo della privacy o sorveglianza                 | Raccolta di contatti per spam, doxxing, stalking, estrazione di lead abbinata a contatti non sollecitati, monitoraggio occulto, corrispondenza biometrica non consensuale o uso di dati trapelati o dump di violazioni.                                                                                                                  |
| Impersonificazione non consensuale o manipolazione dell'identità       | Face swap, gemelli digitali, influencer clonati, persone fittizie o altri strumenti usati per impersonare o fuorviare.                                                                                                                                                                                                 |
| Contenuti sessuali espliciti o generazione per adulti con sicurezze disattivate | Generazione di immagini, video o contenuti NSFW; wrapper per contenuti per adulti attorno ad API di terze parti; o inserzioni il cui scopo principale è il contenuto sessuale esplicito.                                                                                                                                                       |
| Requisiti di esecuzione nascosti, non sicuri o fuorvianti        | Comandi di installazione offuscati, installer pipe-to-shell come contenuti scaricati eseguiti con `sh` o `bash` senza chiara verificabilità, requisiti non dichiarati per segreti o chiavi private, esecuzione remota di `npx @latest` senza chiara verificabilità o metadati che nascondono ciò di cui l'inserzione ha davvero bisogno per essere eseguita. |
| Materiale che viola copyright o altri diritti           | Ripubblicare Skills, plugin, documentazione, asset di brand o codice proprietario di qualcun altro senza autorizzazione; violare i termini di licenza; o impersonare l'autore o l'editore originale.                                                                                                                            |

## Comportamento del marketplace non consentito

ClawHub esamina anche come gli editori usano il marketplace. Non usare ClawHub per
manipolare scoperta, metriche, segnali di fiducia, sistemi di moderazione o
attenzione degli utenti.

Il comportamento del marketplace non consentito include:

- pubblicazione in blocco di grandi numeri di inserzioni a basso sforzo, duplicative, segnaposto o
  generate automaticamente che non sembrano avere un reale valore per gli utenti
- inondare superfici di ricerca o categoria con Skills o plugin quasi identici
- pubblicare centinaia di inserzioni con poco o nessun utilizzo, manutenzione, chiarezza
  della fonte o differenziazione significativa
- gonfiare artificialmente installazioni, download, stelle o altre metriche di
  engagement tramite automazione, cicli di autoinstallazione, account falsi, attività
  coordinata, engagement a pagamento o altri comportamenti non organici
- creare o ruotare account per eludere moderazione, ban, limiti degli editori o
  revisione del marketplace
- fuorviare gli utenti su proprietà, fonte, capacità, postura di sicurezza,
  requisiti di installazione o affiliazione con un altro progetto o editore
- caricare ripetutamente contenuti che sono già stati nascosti, rimossi o bloccati
  senza correggere il problema sottostante

La pubblicazione ad alto volume non è automaticamente abuso. I cataloghi di grandi dimensioni sono accettabili
quando le inserzioni sono significativamente diverse, descritte accuratamente, mantenute
e usate da utenti reali. I cataloghi di grandi dimensioni diventano un problema di fiducia e sicurezza quando
il volume è abbinato a inserzioni scarne, duplicative, fuorvianti, non mantenute o
promosse artificialmente.

## Diritti dei contenuti

Se ritieni che contenuti su ClawHub violino il tuo copyright o altri diritti, usa
[Richieste sui diritti dei contenuti](/it/clawhub/content-rights). Non usare le normali segnalazioni del marketplace
per rivendicazioni di copyright o diritti, a meno che l'inserzione sia anche non sicura,
malevola o fuorviante.

## Revisione e applicazione

ClawHub può usare controlli automatizzati, segnali statistici di abuso, segnalazioni degli utenti e
revisione dello staff per identificare contenuti non sicuri o comportamenti di pubblicazione abusivi. Un segnale
non dimostra abuso da solo; aiuta ClawHub a decidere cosa richiede revisione.

Possiamo:

- nascondere, mettere in sospeso, rimuovere, eliminare in modo reversibile o, dove supportato per il tipo di risorsa,
  eliminare definitivamente inserzioni in violazione
- bloccare download o installazioni per release non sicure
- revocare token API
- eliminare in modo reversibile contenuti associati
- limitare l'accesso alla pubblicazione
- bannare trasgressori recidivi o gravi

Non garantiamo un'applicazione con avviso preventivo per abusi evidenti. Consulta
[Moderazione e sicurezza dell'account](/clawhub/moderation) per segnalazioni, sospensioni di moderazione,
inserzioni nascoste, ban e posizione dell'account.
