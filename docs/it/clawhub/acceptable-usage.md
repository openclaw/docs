---
read_when:
    - Esame dei caricamenti per abusi o violazioni delle policy
    - Scrittura di documentazione sulla moderazione o runbook per revisori
    - Decidere se una skill debba essere nascosta o un utente bannato
sidebarTitle: Acceptable Usage
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
title: Uso accettabile
x-i18n:
    generated_at: "2026-07-04T10:43:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilizzo accettabile

ClawHub ospita Skills, Plugin, pacchetti e metadati del mercato per OpenClaw.
Usa questa pagina per decidere se un contenuto o un comportamento di pubblicazione appartiene a
ClawHub.

Queste regole si applicano a ciò che fa una scheda, a ciò che chiede agli utenti di eseguire, a come
si rappresenta e a come gli editori usano le superfici di scoperta, installazione e
fiducia di ClawHub. Per gli stati di moderazione e la reputazione dell'account, vedi
[Moderazione e sicurezza dell'account](/clawhub/moderation). Per copyright o altre rivendicazioni di diritti,
vedi [Richieste sui diritti dei contenuti](/it/clawhub/content-rights).

## Contenuti consentiti

ClawHub accoglie contenuti utili, comprensibili e pubblicati in buona
fede.

| Categoria                                        | Consentito quando                                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Produttività degli sviluppatori                  | La scheda aiuta gli utenti a creare, testare, migrare, eseguire il debug, documentare o gestire software.                       |
| Flussi di lavoro di interfaccia, dati e automazione | L'ambito è chiaro, le credenziali richieste sono esplicite e le azioni rischiose includono percorsi di revisione, esecuzione di prova, anteprima o conferma. |
| Sicurezza difensiva, moderazione e revisione degli abusi | Lo strumento è presentato per una revisione autorizzata, conserva le prove e mantiene chiari i confini dell'approvazione umana. |
| Flussi di lavoro personali o di team             | Il flusso di lavoro usa account basati sul consenso, configurazione trasparente e autorizzazioni esplicite.                     |
| Cataloghi mantenuti                              | Ogni scheda è distinta, utile, descritta accuratamente e ragionevolmente mantenuta.                                              |

Il contesto conta. Lo stesso argomento può essere accettabile in un'impostazione difensiva ristretta o
basata sul consenso e inaccettabile quando è confezionato come flusso di lavoro di abuso.

## Contenuti non consentiti

ClawHub non ospita contenuti il cui scopo principale sia abuso, inganno, esecuzione non sicura
o violazione dei diritti.

| Categoria                                                   | Non consentito                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso non autorizzato o aggiramento della sicurezza       | Aggiramento dell'autenticazione, acquisizione di account, abuso dei limiti di frequenza, acquisizione di chiamate live o agenti, furto riutilizzabile di sessioni o approvazione automatica di flussi di associazione per utenti non approvati.                                                                  |
| Abuso della piattaforma ed elusione dei ban                 | Account furtivi dopo ban, riscaldamento o coltivazione di account, coinvolgimento falso, automazione multi-account, pubblicazione di massa, bot di spam o automazione costruita per evitare il rilevamento.                                                                                                     |
| Frodi, truffe e flussi finanziari ingannevoli              | Certificati o fatture falsi, flussi di pagamento ingannevoli, contatti per truffe, falsa prova sociale, flussi di lavoro con identità sintetiche per frode o strumenti di spesa/addebito senza chiara approvazione umana.                                                                                       |
| Arricchimento invasivo della privacy o sorveglianza         | Raccolta di contatti per spam, doxxing, stalking, estrazione di lead abbinata a contatti non richiesti, monitoraggio occulto, confronto biometrico non consensuale o uso di dati trapelati o dump di violazioni.                                                                                                |
| Impersonificazione non consensuale o manipolazione dell'identità | Scambio di volti, gemelli digitali, influencer clonati, persone fittizie o altri strumenti usati per impersonare o trarre in inganno.                                                                                                                                                                           |
| Contenuti sessuali espliciti o generazione per adulti con sicurezza disabilitata | Generazione di immagini, video o contenuti NSFW; wrapper di contenuti per adulti attorno ad API di terze parti; o schede il cui scopo principale è il contenuto sessuale esplicito.                                                                                                                              |
| Requisiti di esecuzione nascosti, non sicuri o fuorvianti   | Comandi di installazione offuscati, programmi di installazione pipe-to-shell come contenuti scaricati eseguiti con `sh` o `bash` senza chiara revisionabilità, requisiti di segreti o chiavi private non dichiarati, esecuzione remota di `npx @latest` senza chiara revisionabilità o metadati che nascondono ciò di cui la scheda ha davvero bisogno per essere eseguita. |
| Materiale che viola copyright o diritti                     | Ripubblicare Skill, Plugin, documentazione, risorse di marca o codice proprietario di qualcun altro senza autorizzazione; violare i termini di licenza; o impersonare l'autore o l'editore originale.                                                                                                          |

## Comportamento non consentito nel mercato

ClawHub esamina anche come gli editori usano il mercato. Non usare ClawHub per
manipolare scoperta, metriche, segnali di fiducia, sistemi di moderazione o
attenzione degli utenti.

Il comportamento non consentito nel mercato include:

- pubblicare in massa grandi numeri di schede a basso impegno, duplicative, segnaposto o
  generate automaticamente che non sembrano avere reale valore per gli utenti
- inondare le superfici di ricerca o categoria con Skill o Plugin quasi identici
- pubblicare centinaia di schede con poco o nessun utilizzo, manutenzione, chiarezza
  della fonte o differenziazione significativa
- gonfiare artificialmente installazioni, download, stelle o altre metriche di
  coinvolgimento tramite automazione, cicli di autoinstallazione, account falsi, attività
  coordinata, coinvolgimento pagato o altro comportamento non organico
- creare o ruotare account per eludere moderazione, ban, limiti degli editori o
  revisione del mercato
- fuorviare gli utenti su proprietà, fonte, capacità, postura di sicurezza,
  requisiti di installazione o affiliazione con un altro progetto o editore
- caricare ripetutamente contenuti che sono già stati nascosti, rimossi o bloccati
  senza risolvere il problema sottostante

La pubblicazione ad alto volume non è automaticamente abuso. I cataloghi grandi sono accettabili
quando le schede sono significativamente diverse, descritte accuratamente, mantenute
e usate da utenti reali. I cataloghi grandi diventano un problema di fiducia e sicurezza quando
il volume è abbinato a schede scarne, duplicative, fuorvianti, non mantenute o
promosse artificialmente.

## Diritti dei contenuti

Se ritieni che un contenuto su ClawHub violi il tuo copyright o altri diritti, usa
[Richieste sui diritti dei contenuti](/it/clawhub/content-rights). Non usare le normali segnalazioni del mercato
per rivendicazioni di copyright o diritti a meno che la scheda non sia anche non sicura,
dannosa o fuorviante.

## Revisione e applicazione

ClawHub può usare controlli automatizzati, segnali statistici di abuso, segnalazioni degli utenti e
revisione del personale per identificare contenuti non sicuri o comportamenti di pubblicazione abusivi. Un segnale
non prova da solo l'abuso; aiuta ClawHub a decidere cosa richiede revisione.

Possiamo:

- nascondere, sospendere, rimuovere, eliminare in modo reversibile o, dove supportato per il tipo di risorsa,
  eliminare definitivamente le schede in violazione
- bloccare download o installazioni per release non sicure
- revocare token API
- eliminare in modo reversibile i contenuti associati
- limitare l'accesso alla pubblicazione
- bannare i trasgressori recidivi o gravi

Non garantiamo un'applicazione con avviso preventivo per abusi evidenti. Vedi
[Moderazione e sicurezza dell'account](/clawhub/moderation) per segnalazioni, sospensioni di moderazione,
schede nascoste, ban e reputazione dell'account.
