---
read_when:
    - Revisione dei caricamenti per individuare abusi o violazioni delle norme
    - Redazione di documentazione sulla moderazione o di runbook per revisori
    - Decidere se una skill debba essere nascosta o un utente escluso
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-12T00:56:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilizzo accettabile

Questa pagina descrive i tipi di skill e contenuti che ClawHub accetta, e i flussi di lavoro abusivi che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di lavoro abusivi end-to-end, non solo parole chiave isolate. Se una skill è progettata per eludere difese, abusare di piattaforme, truffare persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Pattern recenti che accettiamo esplicitamente

- Lavori su frontend e design system che usano componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione da JavaScript a TypeScript per UI5 che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce di controllo generate.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano evidenze e mantengono chiari i confini di approvazione umana.
- Automazione di flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettabile

- Flussi di lavoro per aggirare la sicurezza o ottenere accesso non autorizzato.
  - Esempi: aggiramento dell'autenticazione, acquisizione di account, aggiramento di CAPTCHA, evasione di Cloudflare o sistemi anti-bot, aggiramento dei limiti di frequenza, scraping furtivo progettato per superare le protezioni, acquisizione di chiamate live o agenti, furto riutilizzabile di sessioni, approvazione automatica dei flussi di pairing per utenti non approvati.

- Abuso di piattaforme ed evasione dei ban.
  - Esempi: account furtivi dopo ban, riscaldamento/coltivazione di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot di spam, automazione per marketplace o social progettata per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, outreach truffaldino, false prove sociali, strumenti che abilitano spese o addebiti senza una chiara approvazione umana e controlli trasparenti, o flussi di identità sintetica progettati per creare account a scopo di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping su larga scala di dettagli di contatto per spam, doxxing, stalking, estrazione di lead abbinata a outreach non sollecitato, monitoraggio occulto, ricerca facciale o corrispondenza biometrica usata senza consenso chiaro, oppure acquisto, pubblicazione, download o operazionalizzazione di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, identità fittizie, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o trarre in inganno.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disabilitata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o skill il cui scopo principale è contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la skill ha realmente bisogno per essere eseguita.

## Pattern recenti che esplicitamente non accettiamo

- “Crea account venditore furtivi dopo ban del marketplace.”
- “Modifica il pairing di Telegram in modo che gli utenti non approvati ricevano automaticamente i codici di pairing.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con i controlli di sicurezza disabilitati.”
- “Scrape di lead, arricchimento dei contatti e avvio di outreach a freddo su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in massa account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un contesto difensivo ristretto o basato sul consenso e inaccettabile quando confezionato come flusso di lavoro abusivo.
- Dovremmo tendere all'azione quando una skill è chiaramente ottimizzata per evasione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie costituiscono motivo per nascondere contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le skill in violazione.
- Possiamo revocare token, eliminare in modo reversibile i contenuti associati e bannare i trasgressori recidivi o gravi.
- Non garantiamo l'applicazione con avviso preventivo per abusi evidenti.
