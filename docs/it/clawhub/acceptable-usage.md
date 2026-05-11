---
read_when:
    - Revisione dei caricamenti per rilevare abusi o violazioni delle policy
    - Scrittura di documentazione di moderazione o runbook per revisori
    - Decidere se una Skill debba essere nascosta o se un utente debba essere bannato
summary: 'Criteri del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-11T20:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

Questa pagina descrive i tipi di skill e contenuti accettati da ClawHub e i workflow di abuso che non ospiterà.

Queste regole sono volutamente pratiche. Ci interessano soprattutto i workflow di abuso end-to-end, non solo parole chiave isolate. Se una skill è creata per eludere le difese, abusare delle piattaforme, truffare le persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Pattern recenti che consideriamo esplicitamente accettabili

- Lavoro su frontend e design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione da JavaScript a TypeScript per UI5 che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce dei controlli generati.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano evidenze e mantengono chiari i confini dell’approvazione umana.
- Automazione di workflow basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utility per sviluppatori e fixture di test circoscritti al software che supportano.

## Non accettabile

- Workflow di aggiramento della sicurezza o accesso non autorizzato.
  - Esempi: aggiramento dell’autenticazione, acquisizione di account, aggiramento di CAPTCHA, evasione di Cloudflare o sistemi anti-bot, aggiramento dei rate limit, scraping furtivo progettato per eludere le protezioni, acquisizione di chiamate live o agenti, furto riutilizzabile di sessioni, approvazione automatica dei flussi di pairing per utenti non approvati.

- Abuso di piattaforme ed evasione dei ban.
  - Esempi: account furtivi dopo ban, riscaldamento/coltivazione di account, coinvolgimento falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot spam, automazione di marketplace o social progettata per evitare il rilevamento.

- Frodi, truffe e workflow finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, contatti per truffe, prove sociali false, strumenti che consentono spese o addebiti senza chiara approvazione umana e controlli trasparenti, o workflow di identità sintetiche creati per creare account a fini di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping su larga scala di dati di contatto per spam, doxxing, stalking, estrazione di lead abbinata a contatti non richiesti, monitoraggio occulto, ricerca facciale o matching biometrico usati senza consenso chiaro, oppure acquisto, pubblicazione, download o operativizzazione di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell’identità.
  - Esempi: face swap, gemelli digitali, personaggi falsi, influencer clonati o altri strumenti di manipolazione dell’identità usati per impersonare o ingannare.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disattivata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o skill il cui scopo principale è il contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso di chiavi private non dichiarato, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la skill ha realmente bisogno per essere eseguita.

## Pattern recenti che consideriamo esplicitamente non accettabili

- “Crea account venditore furtivi dopo ban dai marketplace.”
- “Modifica il pairing di Telegram in modo che gli utenti non approvati ricevano automaticamente i codici di pairing.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con controlli di sicurezza disattivati.”
- “Esegui scraping di lead, arricchisci i contatti e avvia contatti a freddo su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in blocco account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un contesto difensivo ristretto o basato sul consenso e inaccettabile quando confezionato come workflow di abuso.
- Dovremmo tendere all’azione quando una skill è chiaramente ottimizzata per evasione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie sono motivo per nascondere i contenuti e bannare l’account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le skill in violazione.
- Possiamo revocare token, eliminare in modo soft i contenuti associati e bannare recidivi o trasgressori gravi.
- Non garantiamo un’applicazione preceduta da avviso per abusi evidenti.
