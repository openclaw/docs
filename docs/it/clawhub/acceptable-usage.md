---
read_when:
    - Esame dei caricamenti per individuare abusi o violazioni delle policy
    - Scrittura della documentazione di moderazione o dei runbook per i revisori
    - Decidere se una skill debba essere nascosta o un utente bannato
summary: 'Norme del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-13T04:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilizzo Accettabile

Questa pagina descrive i tipi di Skills e contenuti che ClawHub accetta, e i flussi di abuso che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di abuso end-to-end, non solo parole chiave isolate. Se una skill è costruita per eludere difese, abusare di piattaforme, truffare persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Pattern recenti che accettiamo esplicitamente

- Lavori su frontend e design system che usano componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione UI5 da JavaScript a TypeScript che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce di controllo generate.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano prove e mantengono chiari i confini dell'approvazione umana.
- Automazione di workflow basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettabile

- Workflow di bypass della sicurezza o di accesso non autorizzato.
  - Esempi: bypass dell'autenticazione, acquisizione di account, bypass di CAPTCHA, elusione di Cloudflare o anti-bot, bypass dei limiti di frequenza, scraping furtivo progettato per aggirare le protezioni, acquisizione di chiamate live o agenti, furto riutilizzabile di sessioni, approvazione automatica di flussi di pairing per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account furtivi dopo ban, riscaldamento/coltivazione di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, spam bot, automazione di marketplace o social costruita per evitare il rilevamento.

- Frode, truffe e workflow finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, outreach truffaldino, prova sociale falsa, strumenti che abilitano spese o addebiti senza una chiara approvazione umana e controlli trasparenti, o workflow di identità sintetiche costruiti per creare account a scopo di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping su larga scala di dettagli di contatto per spam, doxxing, stalking, estrazione di lead abbinata a outreach non richiesto, monitoraggio occulto, ricerca facciale o matching biometrico usati senza consenso chiaro, oppure acquisto, pubblicazione, download o operativizzazione di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, personaggi falsi, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o trarre in inganno.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disabilitata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o skill il cui scopo principale è contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso di chiavi private non dichiarato, esecuzione remota `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la skill ha realmente bisogno per essere eseguita.

## Pattern recenti che esplicitamente non accettiamo

- “Crea account venditore furtivi dopo ban dai marketplace.”
- “Modifica il pairing di Telegram in modo che utenti non approvati ricevano automaticamente i codici di pairing.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con controlli di sicurezza disabilitati.”
- “Scrapa lead, arricchisci contatti e avvia cold outreach su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in massa account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un contesto ristretto difensivo o basato sul consenso, e inaccettabile quando confezionato come workflow di abuso.
- Dovremmo propendere per l'azione quando una skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Upload ripetuti in queste categorie sono motivo per nascondere contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le skill in violazione.
- Possiamo revocare token, eliminare in modo reversibile i contenuti associati e bannare i recidivi o gli autori di violazioni gravi.
- Non garantiamo un'applicazione con avviso preventivo per abusi evidenti.
