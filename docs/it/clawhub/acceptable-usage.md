---
read_when:
    - Esaminare i caricamenti per individuare abusi o violazioni delle norme
    - Redazione di documentazione di moderazione o di procedure operative per revisori
    - Decidere se una skill debba essere nascosta o un utente escluso
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-13T02:51:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

Questa pagina descrive i tipi di Skills e contenuti accettati da ClawHub e i flussi di abuso che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessa soprattutto l'abuso end-to-end dei flussi di lavoro, non solo parole chiave isolate. Se una Skill è creata per eludere le difese, abusare delle piattaforme, truffare le persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Modelli recenti che approviamo esplicitamente

- Lavoro su frontend e design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione da JavaScript a TypeScript per UI5 che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce dei controlli generati.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano evidenze e mantengono chiari i confini dell'approvazione umana.
- Automazione dei flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utility per sviluppatori e fixture di test limitati al software che supportano.

## Non consentito

- Flussi di lavoro per aggirare la sicurezza o ottenere accessi non autorizzati.
  - Esempi: bypass dell'autenticazione, compromissione di account, bypass di CAPTCHA, elusione di Cloudflare o sistemi anti-bot, bypass dei limiti di frequenza, scraping stealth progettato per sconfiggere le protezioni, acquisizione di chiamate live o di agenti, furto riutilizzabile di sessioni, approvazione automatica dei flussi di pairing per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account stealth dopo ban, warming/farming di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot spam, automazione per marketplace o social progettata per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, contatti per truffe, falsa riprova sociale, strumenti che permettono spese o addebiti senza chiara approvazione umana e controlli trasparenti, o flussi di identità sintetiche creati per aprire account a fini fraudolenti.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping di dettagli di contatto su larga scala per spam, doxxing, stalking, estrazione di lead abbinata a contatti non richiesti, monitoraggio occulto, ricerca facciale o corrispondenza biometrica usata senza chiaro consenso, oppure acquisto, pubblicazione, download o operativizzazione di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, personas false, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o fuorviare.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disattivata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti intorno ad API di terze parti, o Skills il cui scopo principale è il contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso di chiavi private non dichiarato, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la Skill ha realmente bisogno per essere eseguita.

## Modelli recenti che non approviamo esplicitamente

- “Crea account venditore stealth dopo ban dai marketplace.”
- “Modifica il pairing di Telegram in modo che utenti non approvati ricevano automaticamente i codici di pairing.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con controlli di sicurezza disattivati.”
- “Esegui scraping di lead, arricchisci contatti e avvia outreach a freddo su larga scala.”
- “Compra, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in blocco account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un'impostazione difensiva ristretta o basata sul consenso e inaccettabile quando confezionato come flusso di lavoro di abuso.
- Dovremmo privilegiare l'azione quando una Skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Upload ripetuti in queste categorie sono motivo per nascondere contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le Skills in violazione.
- Possiamo revocare token, eliminare temporaneamente i contenuti associati e bannare i trasgressori recidivi o gravi.
- Non garantiamo l'applicazione con avviso preventivo in caso di abuso evidente.
