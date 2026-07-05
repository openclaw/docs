---
read_when:
    - Revisione dei caricamenti per abuso o violazioni delle norme
    - Scrittura di documentazione di moderazione o runbook per revisori
    - Decidere se una skill debba essere nascosta o un utente bannato
sidebarTitle: Acceptable Usage
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
title: Utilizzo accettabile
x-i18n:
    generated_at: "2026-07-05T05:09:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilizzo accettabile

ClawHub ospita Skills, Plugin, pacchetti e metadati del marketplace per OpenClaw.
Usa questa pagina per decidere se un contenuto o un comportamento di pubblicazione appartiene a
ClawHub.

Queste regole si applicano a ciò che fa un'inserzione, a ciò che chiede agli utenti di eseguire, a come
si presenta e a come gli editori usano le superfici di scoperta, installazione e
fiducia di ClawHub. Per gli stati di moderazione e la reputazione dell'account, vedi
[Moderazione e sicurezza dell'account](/clawhub/moderation). Per copyright o altre rivendicazioni di diritti,
vedi [Richieste relative ai diritti sui contenuti](/it/clawhub/content-rights).

## Contenuti consentiti

ClawHub accoglie contenuti utili, comprensibili e pubblicati in buona
fede.

| Categoria                                        | Consentito quando                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Produttività degli sviluppatori                  | L'inserzione aiuta gli utenti a creare, testare, migrare, eseguire debug, documentare o gestire software.                             |
| Flussi di lavoro di UI, dati e automazione       | L'ambito è chiaro, le credenziali richieste sono esplicite e le azioni rischiose includono percorsi di revisione, dry-run, anteprima o conferma. |
| Sicurezza difensiva, moderazione e revisione degli abusi | Lo strumento è presentato per revisioni autorizzate, preserva le prove e mantiene chiari i confini dell'approvazione umana.           |
| Flussi di lavoro personali o di team             | Il flusso di lavoro usa account basati sul consenso, configurazione trasparente e autorizzazioni esplicite.                           |
| Cataloghi mantenuti                              | Ogni inserzione è distinta, utile, descritta accuratamente e mantenuta ragionevolmente.                                                |

Il contesto conta. Lo stesso argomento può essere accettabile in un contesto difensivo ristretto o
basato sul consenso e inaccettabile quando confezionato come flusso di lavoro per abusi.

## Contenuti non consentiti

ClawHub non ospita contenuti il cui scopo principale è abuso, inganno, esecuzione non sicura
o violazione dei diritti.

| Categoria                                                   | Non consentito                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso non autorizzato o aggiramento della sicurezza       | Aggiramento dell'autenticazione, acquisizione di account, abuso dei limiti di frequenza, acquisizione di chiamate live o agenti, furto di sessioni riutilizzabili o approvazione automatica di flussi di associazione per utenti non approvati.                                                            |
| Abuso della piattaforma ed elusione dei ban                 | Account furtivi dopo i ban, riscaldamento o coltivazione di account, coinvolgimento falso, automazione multi-account, pubblicazione di massa, bot spam o automazione creata per evitare il rilevamento.                                                                                                    |
| Frodi, truffe e flussi di lavoro finanziari ingannevoli     | Certificati o fatture falsi, flussi di pagamento ingannevoli, outreach truffaldino, prove sociali false, flussi di lavoro con identità sintetiche per frodi o strumenti di spesa/addebito senza chiara approvazione umana.                                                                                |
| Arricchimento o sorveglianza invasivi della privacy         | Raccolta di contatti per spam, doxxing, stalking, estrazione di lead abbinata a outreach non richiesto, monitoraggio occulto, confronto biometrico non consensuale o uso di dati trapelati o dump di violazioni.                                                                                           |
| Impersonificazione non consensuale o manipolazione dell'identità | Face swap, gemelli digitali, influencer clonati, profili falsi o altri strumenti usati per impersonare o fuorviare.                                                                                                                                                                                       |
| Contenuti sessuali espliciti o generazione per adulti con sicurezza disattivata | Generazione di immagini, video o contenuti NSFW; wrapper per contenuti per adulti attorno ad API di terze parti; o inserzioni il cui scopo principale è contenuto sessuale esplicito.                                                                                                                      |
| Requisiti di esecuzione nascosti, non sicuri o fuorvianti   | Comandi di installazione offuscati, installer pipe-to-shell come contenuti scaricati eseguiti con `sh` o `bash` senza chiara verificabilità, requisiti di segreti o chiavi private non dichiarati, esecuzione remota `npx @latest` senza chiara verificabilità o metadati che nascondono ciò di cui l'inserzione ha realmente bisogno per essere eseguita. |
| Materiale che viola copyright o altri diritti               | Ripubblicazione di skill, plugin, documentazione, asset di brand o codice proprietario di altri senza autorizzazione; violazione dei termini di licenza; o impersonificazione dell'autore o editore originale.                                                                                              |

## Comportamento non consentito nel marketplace

ClawHub esamina anche come gli editori usano il marketplace. Non usare ClawHub per
manipolare scoperta, metriche, segnali di fiducia, sistemi di moderazione o attenzione degli
utenti.

Il comportamento non consentito nel marketplace include:

- pubblicare in massa grandi numeri di inserzioni a basso impegno, duplicative, segnaposto o
  generate automaticamente che non sembrano avere reale valore per gli utenti
- saturare le superfici di ricerca o di categoria con Skills o Plugin quasi identici
- pubblicare centinaia di inserzioni con poco o nessun utilizzo, manutenzione, chiarezza della fonte
  o differenziazione significativa
- gonfiare artificialmente installazioni, download, stelle o altre metriche di coinvolgimento
  tramite automazione, cicli di auto-installazione, account falsi, attività coordinata,
  coinvolgimento a pagamento o altri comportamenti non organici
- creare o ruotare account per eludere moderazione, ban, limiti per editori o
  revisione del marketplace
- ingannare gli utenti su proprietà, fonte, capacità, postura di sicurezza,
  requisiti di installazione o affiliazione con un altro progetto o editore
- caricare ripetutamente contenuti che sono già stati nascosti, rimossi o bloccati
  senza correggere il problema sottostante

La pubblicazione ad alto volume non è automaticamente abuso. I cataloghi di grandi dimensioni sono accettabili
quando le inserzioni sono significativamente diverse, descritte accuratamente, mantenute
e usate da utenti reali. I cataloghi di grandi dimensioni diventano un problema di fiducia e sicurezza quando
il volume è associato a inserzioni scarne, duplicative, fuorvianti, non mantenute o
promosse artificialmente.

## Diritti sui contenuti

Se ritieni che un contenuto su ClawHub violi il tuo copyright o altri diritti, usa
[Richieste relative ai diritti sui contenuti](/it/clawhub/content-rights). Non usare le normali segnalazioni del marketplace
per copyright o rivendicazioni di diritti, a meno che l'inserzione non sia anche non sicura,
dannosa o fuorviante.

## Revisione e applicazione delle regole

ClawHub può usare controlli automatizzati, segnali statistici di abuso, segnalazioni degli utenti e
revisione dello staff per identificare contenuti non sicuri o comportamenti di pubblicazione abusivi. Un segnale
non prova da solo un abuso; aiuta ClawHub a decidere cosa richiede revisione.

Possiamo:

- nascondere, trattenere, rimuovere, eliminare in modo reversibile o, dove supportato per il tipo di risorsa,
  eliminare definitivamente le inserzioni che violano le regole
- bloccare download o installazioni per release non sicure
- revocare token API
- eliminare in modo reversibile contenuti associati
- limitare l'accesso alla pubblicazione
- bannare i trasgressori recidivi o gravi

Non garantiamo l'applicazione delle regole con avviso preventivo per abusi evidenti. Vedi
[Moderazione e sicurezza dell'account](/clawhub/moderation) per segnalazioni, sospensioni di moderazione,
inserzioni nascoste, ban e reputazione dell'account.
