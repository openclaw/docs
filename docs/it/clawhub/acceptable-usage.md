---
read_when:
    - Revisione dei caricamenti per abusi o violazioni delle norme
    - Scrittura di documentazione di moderazione o runbook per revisori
    - Decidere se una skill debba essere nascosta o un utente bannato
sidebarTitle: Acceptable Usage
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
title: Uso accettabile
x-i18n:
    generated_at: "2026-06-30T22:19:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

ClawHub ospita Skills, Plugin, pacchetti e metadati del marketplace per OpenClaw.
Usa questa pagina per decidere se un contenuto o un comportamento di pubblicazione appartiene a
ClawHub.

Queste regole si applicano a ciò che fa una scheda, a ciò che chiede agli utenti di eseguire, a come si
presenta e a come gli editori usano le superfici di scoperta, installazione e
fiducia di ClawHub. Per gli stati di moderazione e lo standing dell'account, vedi
[Moderazione e sicurezza dell'account](/clawhub/moderation). Per copyright o altre rivendicazioni di diritti,
vedi [Richieste sui diritti dei contenuti](/clawhub/content-rights).

## Contenuti consentiti

ClawHub accoglie contenuti utili, comprensibili e pubblicati in buona
fede.

| Categoria | Consentito quando |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produttività degli sviluppatori | La scheda aiuta gli utenti a creare, testare, migrare, eseguire il debug, documentare o gestire software. |
| Flussi di lavoro di UI, dati e automazione | L'ambito è chiaro, le credenziali richieste sono esplicite e le azioni rischiose includono percorsi di revisione, dry-run, anteprima o conferma. |
| Sicurezza difensiva, moderazione e revisione degli abusi | Lo strumento è inquadrato per una revisione autorizzata, preserva le prove e mantiene chiari i confini dell'approvazione umana. |
| Flussi di lavoro personali o di team | Il flusso di lavoro usa account basati sul consenso, una configurazione trasparente e autorizzazioni esplicite. |
| Cataloghi mantenuti | Ogni scheda è distinta, utile, descritta accuratamente e ragionevolmente mantenuta. |

Il contesto conta. Lo stesso argomento può essere accettabile in un contesto difensivo ristretto o
basato sul consenso e inaccettabile quando confezionato come flusso di lavoro di abuso.

## Contenuti non consentiti

ClawHub non ospita contenuti il cui scopo principale è abuso, inganno, esecuzione non sicura
o violazione dei diritti.

| Categoria | Non consentito |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso non autorizzato o aggiramento della sicurezza | Aggiramento dell'autenticazione, takeover dell'account, abuso dei limiti di frequenza, takeover di chiamate live o agenti, furto riutilizzabile di sessioni o approvazione automatica di flussi di abbinamento per utenti non approvati. |
| Abuso della piattaforma ed elusione dei ban | Account stealth dopo i ban, riscaldamento o farming di account, engagement falso, automazione multi-account, pubblicazione di massa, bot di spam o automazione creata per evitare il rilevamento. |
| Frodi, truffe e flussi di lavoro finanziari ingannevoli | Certificati o fatture falsi, flussi di pagamento ingannevoli, outreach truffaldino, falsa prova sociale, flussi di lavoro con identità sintetiche per frodi o strumenti di spesa/addebito senza chiara approvazione umana. |
| Arricchimento o sorveglianza invasivi della privacy | Scraping di contatti per spam, doxxing, stalking, estrazione di lead abbinata a outreach non richiesto, monitoraggio occulto, confronto biometrico non consensuale o uso di dati trapelati o dump di violazioni. |
| Impersonificazione non consensuale o manipolazione dell'identità | Face swap, gemelli digitali, influencer clonati, personaggi falsi o altri strumenti usati per impersonare o fuorviare. |
| Contenuti sessuali espliciti o generazione per adulti con sicurezza disabilitata | Generazione NSFW di immagini, video o contenuti; wrapper per contenuti per adulti attorno ad API di terze parti; oppure schede il cui scopo principale è contenuto sessuale esplicito. |
| Requisiti di esecuzione nascosti, non sicuri o fuorvianti | Comandi di installazione offuscati, installatori pipe-to-shell come contenuti scaricati eseguiti con `sh` o `bash` senza chiara possibilità di revisione, requisiti di segreti o chiavi private non dichiarati, esecuzione remota di `npx @latest` senza chiara possibilità di revisione o metadati che nascondono ciò di cui la scheda ha realmente bisogno per essere eseguita. |
| Materiale che viola copyright o diritti | Ripubblicare skill, Plugin, documentazione, asset di brand o codice proprietario di qualcun altro senza autorizzazione; violare i termini di licenza; oppure impersonare l'autore o l'editore originale. |

## Comportamento del marketplace non consentito

ClawHub esamina anche come gli editori usano il marketplace. Non usare ClawHub per
manipolare scoperta, metriche, segnali di fiducia, sistemi di moderazione o
attenzione degli utenti.

Il comportamento del marketplace non consentito include:

- pubblicazione in massa di grandi numeri di schede a basso impegno, duplicative, segnaposto o
  generate automaticamente che non sembrano avere reale valore per gli utenti
- saturazione delle superfici di ricerca o di categoria con skill o Plugin quasi identici
- pubblicazione di centinaia di schede con poco o nessun uso, manutenzione, chiarezza della fonte
  o differenziazione significativa
- gonfiare artificialmente installazioni, download, stelle o altre metriche di
  engagement tramite automazione, cicli di autoinstallazione, account falsi, attività
  coordinata, engagement pagato o altri comportamenti non organici
- creare o ruotare account per eludere moderazione, ban, limiti per editori o
  revisione del marketplace
- fuorviare gli utenti su proprietà, fonte, capacità, postura di sicurezza,
  requisiti di installazione o affiliazione con un altro progetto o editore
- caricare ripetutamente contenuti che sono già stati nascosti, rimossi o bloccati
  senza risolvere il problema sottostante

La pubblicazione ad alto volume non è automaticamente abuso. I grandi cataloghi sono accettabili
quando le schede sono significativamente diverse, descritte accuratamente, mantenute
e usate da utenti reali. I grandi cataloghi diventano un problema di fiducia e sicurezza quando
il volume è associato a schede scarne, duplicative, fuorvianti, non mantenute o
promosse artificialmente.

## Diritti sui contenuti

Se ritieni che contenuti su ClawHub violino il tuo copyright o altri diritti, usa
[Richieste sui diritti dei contenuti](/clawhub/content-rights). Non usare le normali segnalazioni del marketplace
per rivendicazioni di copyright o diritti, a meno che la scheda non sia anche non sicura,
dannosa o fuorviante.

## Revisione e applicazione

ClawHub può usare controlli automatizzati, segnali statistici di abuso, segnalazioni degli utenti e
revisione dello staff per identificare contenuti non sicuri o comportamenti di pubblicazione abusivi. Un segnale
non prova da solo un abuso; aiuta ClawHub a decidere cosa deve essere revisionato.

Possiamo:

- nascondere, mettere in sospeso, rimuovere, eliminare in modo reversibile o, dove supportato per il tipo di risorsa,
  eliminare definitivamente le schede in violazione
- bloccare download o installazioni per release non sicure
- revocare token API
- eliminare in modo reversibile i contenuti associati
- limitare l'accesso alla pubblicazione
- bandire trasgressori recidivi o gravi

Non garantiamo un'applicazione preceduta da avviso per abusi evidenti. Vedi
[Moderazione e sicurezza dell'account](/clawhub/moderation) per segnalazioni, sospensioni di moderazione,
schede nascoste, ban e standing dell'account.
