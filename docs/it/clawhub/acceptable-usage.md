---
read_when:
    - Revisione dei caricamenti per rilevare abusi o violazioni delle norme
    - Redazione di documentazione di moderazione o runbook per revisori
    - Stabilire se una competenza debba essere nascosta o se un utente debba essere escluso
summary: 'Politica del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-12T23:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

Questa pagina descrive i tipi di Skills e contenuti che ClawHub accetta, e i flussi di lavoro abusivi che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di lavoro abusivi end-to-end, non solo parole chiave isolate. Se una skill è progettata per eludere difese, abusare di piattaforme, truffare persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Pattern recenti che accettiamo esplicitamente

- Lavori di frontend e design system che usano componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione da JavaScript a TypeScript per UI5 che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce dei controlli generati.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano evidenze e mantengono chiari i confini dell'approvazione umana.
- Automazione dei flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utility per sviluppatori e fixture di test limitati al software che supportano.

## Non accettabile

- Flussi di lavoro per bypass di sicurezza o accesso non autorizzato.
  - Esempi: bypass dell'autenticazione, takeover di account, bypass di CAPTCHA, evasione di Cloudflare o anti-bot, bypass dei limiti di frequenza, scraping stealth progettato per aggirare le protezioni, takeover di chiamate live o agent, furto riutilizzabile di sessioni, approvazione automatica dei flussi di pairing per utenti non approvati.

- Abuso di piattaforme ed evasione dei ban.
  - Esempi: account stealth dopo ban, riscaldamento/coltivazione di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot di spam, automazione di marketplace o social costruita per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, outreach truffaldino, social proof falso, strumenti che abilitano spese o addebiti senza una chiara approvazione umana e controlli trasparenti, o flussi di lavoro con identità sintetiche costruiti per creare account a fini di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping di dettagli di contatto su larga scala per spam, doxxing, stalking, estrazione di lead abbinata a outreach non richiesto, monitoraggio occulto, ricerca facciale o matching biometrico usati senza consenso chiaro, oppure acquisto, pubblicazione, download o messa in uso operativa di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, persone fittizie, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o fuorviare.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disabilitata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper di contenuti per adulti intorno ad API di terze parti, o Skills il cui scopo principale è contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la skill ha davvero bisogno per funzionare.

## Pattern recenti che non accettiamo esplicitamente

- “Crea account venditore stealth dopo ban da marketplace.”
- “Modifica il pairing di Telegram in modo che gli utenti non approvati ricevano automaticamente codici di pairing.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con controlli di sicurezza disabilitati.”
- “Scrapa lead, arricchisci contatti e avvia cold outreach su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in massa account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un ambito difensivo ristretto o basato sul consenso e inaccettabile quando confezionato come flusso di lavoro abusivo.
- Dovremmo propendere per l'azione quando una skill è chiaramente ottimizzata per evasione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie sono motivo per nascondere contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente Skills che violano le regole.
- Possiamo revocare token, eliminare logicamente contenuti associati e bannare trasgressori recidivi o gravi.
- Non garantiamo un'applicazione preceduta da avviso per abusi evidenti.
