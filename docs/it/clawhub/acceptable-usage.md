---
read_when:
    - Revisione dei caricamenti per rilevare abusi o violazioni delle norme
    - Scrittura di documentazione per la moderazione o di manuali operativi per revisori
    - Decidere se nascondere una skill o bannare un utente
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-12T08:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilizzo accettabile

Questa pagina descrive i tipi di Skills e contenuti che ClawHub accetta, e i flussi di abuso che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di abuso end-to-end, non solo parole chiave isolate. Se una Skill è creata per eludere le difese, abusare delle piattaforme, truffare le persone, violare la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Modelli recenti che accettiamo esplicitamente

- Lavoro su frontend e design-system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione da JavaScript a TypeScript per UI5 che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce di controllo generate.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano evidenze e mantengono chiari i confini di approvazione umana.
- Automazione dei flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettato

- Flussi di aggiramento della sicurezza o accesso non autorizzato.
  - Esempi: aggiramento dell'autenticazione, acquisizione di account, aggiramento dei CAPTCHA, elusione di Cloudflare o dei sistemi anti-bot, aggiramento dei limiti di frequenza, scraping occulto progettato per superare le protezioni, acquisizione di chiamate live o agenti, furto di sessioni riutilizzabili, approvazione automatica dei flussi di abbinamento per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account occulti dopo ban, riscaldamento/coltivazione di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione massiva, bot spam, automazione di marketplace o social progettata per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, contatti per truffe, prova sociale falsa, strumenti che abilitano spese o addebiti senza chiara approvazione umana e controlli trasparenti, o flussi di identità sintetiche creati per aprire account a scopo di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping di dettagli di contatto su larga scala per spam, doxxing, stalking, estrazione di lead abbinata a contatti non richiesti, monitoraggio occulto, ricerca facciale o matching biometrico usati senza chiaro consenso, o acquisto, pubblicazione, download o messa in uso operativo di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, personaggi falsi, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o trarre in inganno.

- Contenuti sessuali espliciti e generazione di contenuti per adulti con sicurezza disabilitata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o Skills il cui scopo principale è il contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso di chiavi private non dichiarato, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la Skill ha realmente bisogno per funzionare.

## Modelli recenti che esplicitamente non accettiamo

- “Crea account venditore occulti dopo ban dai marketplace.”
- “Modifica l'abbinamento di Telegram in modo che gli utenti non approvati ricevano automaticamente codici di abbinamento.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per usi arbitrari.”
- “Genera contenuti NSFW con i controlli di sicurezza disabilitati.”
- “Raccogli lead, arricchisci contatti e avvia contatti a freddo su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in blocco account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un contesto difensivo ristretto o basato sul consenso e inaccettabile quando confezionato come flusso di abuso.
- Dovremmo propendere per l'azione quando una Skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie sono motivo per nascondere i contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le Skills che violano le regole.
- Possiamo revocare token, eliminare logicamente i contenuti associati e bannare i trasgressori recidivi o gravi.
- Non garantiamo un'applicazione preceduta da avviso per abusi evidenti.
