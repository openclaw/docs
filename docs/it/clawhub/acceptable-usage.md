---
read_when:
    - Revisione dei caricamenti per individuare abusi o violazioni delle norme
    - Scrivere documentazione sulla moderazione o manuali operativi per revisori
    - Decidere se una skill debba essere nascosta o se un utente debba essere bannato
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-11T22:19:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Accettabile

Questa pagina descrive i tipi di skill e contenuti che ClawHub accetta, e i flussi di abuso che non ospiterà.

Queste regole sono volutamente pratiche. Ci interessano soprattutto i flussi di abuso end-to-end, non solo parole chiave isolate. Se una skill è costruita per eludere le difese, abusare delle piattaforme, truffare le persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Schemi recenti che accettiamo esplicitamente

- Lavoro frontend e sui design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione UI5 da JavaScript a TypeScript che preserva i commenti, usa tipi UI5 concreti e mantiene verificabili le interfacce di controllo generate.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano prove e mantengono chiari i confini di approvazione umana.
- Automazione dei flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettato

- Flussi di lavoro per aggirare la sicurezza o ottenere accesso non autorizzato.
  - Esempi: aggiramento dell'autenticazione, takeover di account, aggiramento di CAPTCHA, elusione di Cloudflare o anti-bot, aggiramento dei rate limit, scraping furtivo progettato per superare le protezioni, takeover di chiamate live o agent, furto riutilizzabile di sessioni, approvazione automatica dei flussi di pairing per utenti non approvati.

- Abuso delle piattaforme ed elusione dei ban.
  - Esempi: account furtivi dopo ban, account warming/farming, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione massiva, bot di spam, automazione per marketplace o social costruita per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, outreach truffaldino, prova sociale falsa, strumenti che abilitano spese o addebiti senza chiara approvazione umana e controlli trasparenti, oppure flussi di identità sintetica costruiti per creare account a scopo di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping su larga scala di dati di contatto per spam, doxxing, stalking, estrazione di lead abbinata a outreach non richiesto, monitoraggio occulto, ricerca facciale o matching biometrico usati senza chiaro consenso, oppure acquisto, pubblicazione, download o messa in uso operativo di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, personaggi falsi, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o fuorviare.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disabilitata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, oppure skill il cui scopo principale è contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara verificabilità, metadati fuorvianti che nascondono ciò di cui la skill ha davvero bisogno per funzionare.

## Schemi recenti che esplicitamente non accettiamo

- “Crea account venditore furtivi dopo ban dai marketplace.”
- “Modifica il pairing di Telegram in modo che utenti non approvati ricevano automaticamente i codici di pairing.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con i controlli di sicurezza disabilitati.”
- “Raccogli lead tramite scraping, arricchisci contatti e avvia cold outreach su larga scala.”
- “Compra, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in massa account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un ambito ristretto difensivo o basato sul consenso e inaccettabile quando confezionato come flusso di abuso.
- Dovremmo tendere ad agire quando una skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie sono motivo per nascondere contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le skill che violano le regole.
- Possiamo revocare token, eliminare temporaneamente i contenuti associati e bannare i trasgressori recidivi o gravi.
- Non garantiamo un'applicazione preceduta da avviso per abusi evidenti.
