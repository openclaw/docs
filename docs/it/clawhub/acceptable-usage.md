---
read_when:
    - Revisione dei caricamenti per abusi o violazioni delle norme
    - Scrivere documentazione sulla moderazione o manuali operativi per i revisori
    - Decidere se una skill debba essere nascosta o se un utente debba essere bannato
summary: 'Criteri del marketplace: ciò che ClawHub consente e ciò che non ospiterà.'
x-i18n:
    generated_at: "2026-05-12T12:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

Questa pagina descrive i tipi di Skills e contenuti che ClawHub considera accettabili, e i flussi di lavoro abusivi che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi abusivi end-to-end, non solo parole chiave isolate. Se una Skill è creata per eludere le difese, abusare di piattaforme, truffare persone, invadere la privacy o abilitare comportamenti non consensuali, non ha posto su ClawHub.

## Pattern recenti che consideriamo esplicitamente accettabili

- Lavoro su frontend e design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione da JavaScript a TypeScript per UI5 che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce di controllo generate.
- Revisioni di sicurezza difensive, strumenti di moderazione e prompt per il rilevamento degli abusi che mostrano prove e mantengono chiari i confini dell’approvazione umana.
- Automazione di flussi di lavoro basata sul consenso per account personali o di team, con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettabile

- Flussi di lavoro per aggirare la sicurezza o ottenere accesso non autorizzato.
  - Esempi: bypass dell’autenticazione, takeover di account, bypass CAPTCHA, elusione di Cloudflare o anti-bot, bypass dei limiti di frequenza, scraping furtivo progettato per superare le protezioni, takeover di chiamate live o agenti, furto riutilizzabile di sessioni, approvazione automatica di flussi di associazione per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account furtivi dopo ban, riscaldamento/coltivazione di account, coinvolgimento falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot di spam, automazione per marketplace o social costruita per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, contatti per truffe, prove sociali false, strumenti che consentono spese o addebiti senza chiara approvazione umana e controlli trasparenti, o flussi con identità sintetiche costruiti per creare account a fini di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping su larga scala di dettagli di contatto per spam, doxxing, stalking, estrazione di lead associata a contatti non sollecitati, monitoraggio occulto, ricerca facciale o matching biometrico usati senza chiaro consenso, oppure acquisto, pubblicazione, download o messa in opera di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell’identità.
  - Esempi: face swap, gemelli digitali, personaggi falsi, influencer clonati o altri strumenti di manipolazione dell’identità usati per impersonare o trarre in inganno.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disabilitata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o Skills il cui scopo principale è contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la Skill ha davvero bisogno per essere eseguita.

## Pattern recenti che consideriamo esplicitamente non accettabili

- “Crea account venditore furtivi dopo ban da marketplace.”
- “Modifica l’associazione Telegram in modo che utenti non approvati ricevano automaticamente codici di associazione.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con i controlli di sicurezza disabilitati.”
- “Raccogli lead tramite scraping, arricchisci i contatti e avvia contatti a freddo su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in blocco account email o social con identità sintetiche o risoluzione CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso tema può essere legittimo in un ambito difensivo ristretto o basato sul consenso e inaccettabile quando confezionato come flusso di lavoro abusivo.
- Dovremmo orientarci verso l’azione quando una Skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie sono motivo per nascondere il contenuto e bannare l’account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le Skills in violazione.
- Possiamo revocare token, eliminare temporaneamente contenuti associati e bannare i trasgressori recidivi o gravi.
- Non garantiamo un’applicazione preceduta da avviso per abusi evidenti.
