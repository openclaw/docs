---
read_when:
    - Revisione dei caricamenti per abusi o violazioni delle norme
    - Scrivere documentazione sulla moderazione o guide operative per revisori
    - Decidere se una skill debba essere nascosta o un utente escluso
summary: 'Norme del marketplace: cosa consente ClawHub e cosa non ospiterà.'
x-i18n:
    generated_at: "2026-05-13T05:32:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso accettabile

Questa pagina descrive i tipi di competenze e contenuti che ClawHub accetta, e i flussi di abuso che non ospiterà.

Queste regole sono intenzionalmente pratiche. Ci interessano soprattutto i flussi di abuso end-to-end, non solo parole chiave isolate. Se una competenza è creata per eludere le difese, abusare di piattaforme, truffare persone, invadere la privacy o abilitare comportamenti non consensuali, non appartiene a ClawHub.

## Modelli recenti che accettiamo esplicitamente

- Lavoro su frontend e design system che usa componenti reali, token semantici, stati accessibili e flussi utente testati.
- Composizione shadcn/ui che usa componenti sorgente installati, alias di progetto e varianti documentate invece di markup una tantum.
- Conversione UI5 da JavaScript a TypeScript che preserva i commenti, usa tipi UI5 concreti e mantiene revisionabili le interfacce di controllo generate.
- Revisione di sicurezza difensiva, strumenti di moderazione e prompt di rilevamento degli abusi che mostrano prove e mantengono chiari i confini di approvazione umana.
- Automazione dei flussi di lavoro basata sul consenso per account personali o di team con credenziali esplicite, configurazione trasparente e modalità dry-run o anteprima.
- Documentazione, runbook di migrazione, utilità per sviluppatori e fixture di test limitati al software che supportano.

## Non accettabile

- Flussi di lavoro per aggirare la sicurezza o ottenere accesso non autorizzato.
  - Esempi: aggiramento dell'autenticazione, presa di controllo di account, aggiramento di CAPTCHA, evasione di Cloudflare o anti-bot, aggiramento dei limiti di frequenza, scraping furtivo progettato per superare le protezioni, presa di controllo di chiamate o agenti live, furto riutilizzabile di sessioni, approvazione automatica di flussi di abbinamento per utenti non approvati.

- Abuso di piattaforme ed elusione dei ban.
  - Esempi: account furtivi dopo ban, riscaldamento/coltivazione di account, coinvolgimento falso, coltivazione di karma o follower, automazione multi-account, pubblicazione di massa, bot spam, automazione di marketplace o social costruita per evitare il rilevamento.

- Frodi, truffe e flussi finanziari ingannevoli.
  - Esempi: certificati falsi, fatture false, flussi di pagamento ingannevoli, contatti per truffe, prove sociali false, strumenti che consentono spese o addebiti senza chiara approvazione umana e controlli trasparenti, oppure flussi di identità sintetiche creati per creare account per frodi.

- Scraping, arricchimento o sorveglianza invasivi della privacy.
  - Esempi: scraping di dettagli di contatto su larga scala per spam, doxxing, stalking, estrazione di lead abbinata a contatti non richiesti, monitoraggio occulto, ricerca facciale o corrispondenza biometrica usata senza chiaro consenso, oppure acquisto, pubblicazione, download o operazionalizzazione di dati trapelati o dump di violazioni.

- Impersonificazione non consensuale o manipolazione ingannevole dell'identità.
  - Esempi: face swap, gemelli digitali, persone fittizie, influencer clonati o altri strumenti di manipolazione dell'identità usati per impersonare o ingannare.

- Contenuti sessuali espliciti e generazione per adulti con sicurezza disattivata.
  - Esempi: generazione di immagini/video/contenuti NSFW, wrapper per contenuti per adulti attorno ad API di terze parti, o competenze il cui scopo principale è il contenuto sessuale esplicito.

- Requisiti di esecuzione nascosti, non sicuri o fuorvianti.
  - Esempi: comandi di installazione offuscati, `curl | sh`, requisiti di segreti non dichiarati, uso non dichiarato di chiavi private, esecuzione remota di `npx @latest` senza chiara revisionabilità, metadati fuorvianti che nascondono ciò di cui la competenza ha realmente bisogno per funzionare.

## Modelli recenti che esplicitamente non accettiamo

- “Crea account venditore furtivi dopo ban del marketplace.”
- “Modifica l'abbinamento Telegram in modo che utenti non approvati ricevano automaticamente i codici di abbinamento.”
- “Coltiva account Reddit/Twitter con automazione non rilevabile.”
- “Genera certificati professionali o fatture per uso arbitrario.”
- “Genera contenuti NSFW con i controlli di sicurezza disattivati.”
- “Raccogli lead tramite scraping, arricchisci i contatti e avvia contatti a freddo su larga scala.”
- “Compra, pubblica o scarica dati trapelati o dump di violazioni.”
- “Crea in massa account email o social con identità sintetiche o risoluzione di CAPTCHA.”

## Note per i revisori

- Il contesto conta. Lo stesso argomento può essere legittimo in un'impostazione difensiva ristretta o basata sul consenso e inaccettabile quando confezionato come flusso di abuso.
- Dovremmo tendere all'azione quando una competenza è chiaramente ottimizzata per evasione, inganno o uso non consensuale.
- Caricamenti ripetuti in queste categorie sono motivo per nascondere contenuti e bannare l'account.

## Applicazione

- Possiamo nascondere, rimuovere o eliminare definitivamente competenze in violazione.
- Possiamo revocare token, eliminare temporaneamente contenuti associati e bannare trasgressori recidivi o gravi.
- Non garantiamo un'applicazione preceduta da avviso per abusi evidenti.
