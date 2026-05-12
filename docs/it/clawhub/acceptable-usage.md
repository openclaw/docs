---
read_when:
    - Esaminare i caricamenti per rilevare abusi o violazioni delle norme
    - Redazione di documentazione sulla moderazione o di guide operative per revisori
    - Decidere se una skill debba essere nascosta o un utente bloccato
summary: 'Policy del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-12T04:09:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Accettabile

Questa pagina descrive i tipi di skill e contenuti che ClawHub accetta, e i flussi di abuso che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di abuso end-to-end, non solo parole chiave isolate. Se una skill è creata per eludere le difese, abusare di piattaforme, truffare persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Pattern recenti che accettiamo esplicitamente

- Lavoro su frontend e design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione da JavaScript a TypeScript per UI5 che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce di controllo generate.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano prove e mantengono chiari i limiti di approvazione umana.
- Automazione dei flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettabile

- Flussi per bypassare la sicurezza o ottenere accesso non autorizzato.
  - Esempi: bypass dell'autenticazione, acquisizione di account, bypass di CAPTCHA, elusione di Cloudflare o di sistemi anti-bot, bypass dei limiti di frequenza, scraping stealth progettato per aggirare le protezioni, acquisizione di chiamate live o agenti, furto riutilizzabile di sessioni, approvazione automatica dei flussi di pairing per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account stealth dopo ban, riscaldamento/coltivazione di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot spam, automazione di marketplace o social progettata per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, outreach per truffe, prove sociali false, strumenti che abilitano spese o addebiti senza chiara approvazione umana e controlli trasparenti, oppure flussi di identità sintetica creati per creare account a fini di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping di dettagli di contatto su larga scala per spam, doxxing, stalking, estrazione di lead abbinata a outreach non richiesto, monitoraggio occulto, ricerca facciale o matching biometrico usati senza consenso chiaro, oppure acquisto, pubblicazione, download o operativizzazione di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, profili falsi, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o ingannare.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disattivata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o skill il cui scopo principale è il contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la skill ha realmente bisogno per essere eseguita.

## Pattern recenti che esplicitamente non accettiamo

- "Crea account venditore stealth dopo ban dai marketplace."
- "Modifica il pairing di Telegram in modo che gli utenti non approvati ricevano automaticamente i codici di pairing."
- "Coltiva account Reddit/Twitter con automazione non rilevabile."
- "Genera certificati professionali o fatture per uso arbitrario."
- "Genera contenuti NSFW con i controlli di sicurezza disattivati."
- "Raccogli lead tramite scraping, arricchisci contatti e avvia cold outreach su larga scala."
- "Acquista, pubblica o scarica dati trapelati o dump di violazioni."
- "Crea in massa account email o social con identità sintetiche o risoluzione di CAPTCHA."

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un contesto difensivo ristretto o basato sul consenso e inaccettabile quando viene confezionato come flusso di abuso.
- Dovremmo propendere per l'azione quando una skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie costituiscono motivo per nascondere i contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le skill che violano le regole.
- Possiamo revocare token, eliminare in modo reversibile i contenuti associati e bannare i trasgressori recidivi o gravi.
- Non garantiamo un'applicazione con avviso preliminare per abusi evidenti.
