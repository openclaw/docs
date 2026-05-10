---
read_when:
    - Revisione dei caricamenti per rilevare abusi o violazioni delle policy
    - Scrittura di documentazione sulla moderazione o runbook per revisori
    - Decidere se nascondere una skill o escludere un utente
summary: 'Criteri del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-10T19:25:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

Questa pagina descrive i tipi di skill e contenuti che ClawHub accetta, e i flussi di abuso che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di abuso end-to-end, non solo parole chiave isolate. Se una skill è costruita per eludere difese, abusare di piattaforme, truffare persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Schemi recenti che accettiamo esplicitamente

- Lavoro frontend e su design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione UI5 da JavaScript a TypeScript che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce di controllo generate.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano prove e mantengono chiari i confini dell’approvazione umana.
- Automazione di flussi di lavoro basata sul consenso per account personali o di team, con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test circoscritti al software che supportano.

## Non accettabile

- Flussi di bypass della sicurezza o di accesso non autorizzato.
  - Esempi: bypass dell’autenticazione, takeover di account, bypass CAPTCHA, elusione di Cloudflare o anti-bot, bypass dei limiti di frequenza, scraping stealth progettato per aggirare protezioni, takeover di chiamate live o agenti, furto riutilizzabile di sessioni, approvazione automatica di flussi di pairing per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account stealth dopo ban, warming/farming di account, engagement falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot di spam, automazione per marketplace o social progettata per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, contatti per truffe, prove sociali false, strumenti che consentono spese o addebiti senza una chiara approvazione umana e controlli trasparenti, o flussi con identità sintetiche creati per aprire account a scopo di frode.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping su larga scala di dettagli di contatto per spam, doxxing, stalking, estrazione di lead abbinata a contatti non sollecitati, monitoraggio occulto, ricerca facciale o matching biometrico usati senza chiaro consenso, oppure acquisto, pubblicazione, download o messa in uso operativo di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell’identità.
  - Esempi: face swap, gemelli digitali, personas false, influencer clonati o altri strumenti di manipolazione dell’identità usati per impersonare o trarre in inganno.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disattivata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o skill il cui scopo principale è il contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la skill ha realmente bisogno per funzionare.

## Schemi recenti che esplicitamente non accettiamo

- “Crea account venditore stealth dopo ban da marketplace.”
- “Modifica il pairing di Telegram in modo che gli utenti non approvati ricevano automaticamente codici di pairing.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con i controlli di sicurezza disattivati.”
- “Esegui scraping di lead, arricchisci contatti e avvia contatti a freddo su larga scala.”
- “Acquista, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in massa account email o social con identità sintetiche o risoluzione CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un ambito ristretto difensivo o basato sul consenso, e inaccettabile quando viene confezionato come flusso di abuso.
- Dovremmo propendere per l’intervento quando una skill è chiaramente ottimizzata per elusione, inganno o uso non consensuale.
- Upload ripetuti in queste categorie sono motivo per nascondere il contenuto e bannare l’account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente le skill che violano le regole.
- Possiamo revocare token, eliminare temporaneamente contenuti associati e bannare i trasgressori recidivi o gravi.
- Non garantiamo un’applicazione con avviso preventivo per abusi evidenti.
