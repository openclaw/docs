---
read_when:
    - Esame dei caricamenti per individuare abusi o violazioni delle policy
    - Scrittura di documentazione sulla moderazione o runbook per revisori
    - Decidere se una skill debba essere nascosta o un utente bloccato
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-12T15:42:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

Questa pagina descrive i tipi di skill e contenuti che ClawHub accetta, e i flussi di abuso che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di abuso end-to-end, non solo parole chiave isolate. Se una skill è creata per eludere le difese, abusare delle piattaforme, truffare le persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Pattern recenti che accettiamo esplicitamente

- Lavoro su frontend e design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione UI5 da JavaScript a TypeScript che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce dei controlli generati.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano prove e mantengono chiari i confini dell'approvazione umana.
- Automazione dei flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità di simulazione o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettabile

- Flussi di lavoro per aggirare la sicurezza o ottenere accessi non autorizzati.
  - Esempi: aggiramento dell'autenticazione, acquisizione di account, aggiramento di CAPTCHA, elusione di Cloudflare o di sistemi anti-bot, aggiramento dei limiti di frequenza, scraping furtivo progettato per superare le protezioni, acquisizione di chiamate live o agenti, furto riutilizzabile di sessioni, approvazione automatica di flussi di abbinamento per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account furtivi dopo ban, riscaldamento/coltivazione di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot di spam, automazione per marketplace o social costruita per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, outreach truffaldino, prova sociale falsa, strumenti che abilitano spese o addebiti senza chiara approvazione umana e controlli trasparenti, o flussi di identità sintetiche creati per generare account a fini di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping di dettagli di contatto su larga scala per spam, doxxing, stalking, estrazione di lead abbinata a outreach non richiesto, monitoraggio occulto, ricerca facciale o confronto biometrico usati senza chiaro consenso, oppure acquisto, pubblicazione, download o operazionalizzazione di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, profili falsi, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o ingannare.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disabilitata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o skill il cui scopo principale è il contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la skill ha realmente bisogno per essere eseguita.

## Pattern recenti che esplicitamente non accettiamo

- “Crea account venditore furtivi dopo ban da marketplace.”
- “Modifica l'abbinamento di Telegram in modo che gli utenti non approvati ricevano automaticamente i codici di abbinamento.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con controlli di sicurezza disabilitati.”
- “Raccogli lead tramite scraping, arricchisci contatti e avvia outreach a freddo su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in blocco account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un ambito difensivo ristretto o basato sul consenso e inaccettabile quando confezionato come flusso di abuso.
- Dovremmo privilegiare l'azione quando una skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie sono motivo per nascondere il contenuto e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente skill in violazione.
- Possiamo revocare token, eliminare in modo reversibile contenuti associati e bannare trasgressori recidivi o gravi.
- Non garantiamo un avviso prima dell'applicazione per abusi evidenti.
