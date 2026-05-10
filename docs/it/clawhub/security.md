---
read_when:
    - Comprendere gli esiti della scansione e della moderazione di ClawHub
    - Segnalare una skill o un pacchetto
    - Ripristino di una scheda trattenuta, nascosta o bloccata
summary: Comportamento di attendibilità, scansione, segnalazione, ricorso e moderazione di ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza + moderazione

ClawHub è aperto alla pubblicazione, ma gli elenchi pubblici passano comunque attraverso controlli di attendibilità,
scansione, segnalazione e moderazione. L'obiettivo è pratico: aiutare gli utenti
a ispezionare ciò che installano, offrire agli editori un percorso di recupero per i falsi positivi
e tenere i pacchetti abusivi fuori dalla scoperta pubblica.

Vedi anche [Uso accettabile](/it/clawhub/acceptable-usage).

## Cosa possono ispezionare gli utenti

Prima di installare uno skill o un plugin, controlla il relativo elenco ClawHub per:

- proprietario e attribuzione della fonte
- versione più recente e changelog
- variabili di ambiente o permessi richiesti
- metadati di compatibilità per i plugin
- stato di scansione o moderazione
- segnalazioni, commenti, stelle, download e segnali di installazione dove mostrati

Installa solo contenuti che comprendi e di cui ti fidi.

## Stati di scansione

ClawHub può mostrare gli esiti di scansione o moderazione nelle pagine pubbliche e nella diagnostica
visibile al proprietario.

Gli esiti comuni includono:

- `clean`: non è stato trovato alcun problema bloccante.
- `suspicious`: la release richiede cautela o revisione.
- `malicious`: la release è considerata non sicura.
- `pending`: i controlli non sono ancora terminati.
- `held`, `quarantined`, `revoked` o `hidden`: la release non è completamente
  disponibile sulle superfici di installazione pubbliche.

La formulazione esatta può variare in base alla superficie, ma il significato pratico è lo stesso: se una
release è trattenuta o bloccata, gli utenti non dovrebbero installarla finché il proprietario non risolve
il problema o la moderazione non la ripristina.

## Skills

Le scansioni degli skill esaminano il bundle dello skill pubblicato, i metadati, i requisiti
dichiarati e le istruzioni sospette.

ClawHub presta particolare attenzione alle discrepanze tra ciò che uno skill dichiara e
ciò che sembra fare. Ad esempio, uno skill che fa riferimento a una chiave API richiesta
dovrebbe dichiarare tale requisito in `SKILL.md` in modo che gli utenti possano vederlo prima
dell'installazione.

I risultati delle scansioni sono basati sugli artefatti. Il comportamento previsto del provider, come
credenziali API dichiarate, callback OAuth localhost, pulizia di disinstallazione con ambito, codifica Basic Auth
o caricamenti di file selezionati dall'utente verso il provider dichiarato, viene trattato
diversamente dall'inoltro nascosto di credenziali, dall'accesso ampio a file privati,
da destinazioni di rete non correlate o dall'abuso furtivo del browser.

Vedi [Formato degli skill](/it/clawhub/skill-format).

## Plugin

Le release dei plugin includono metadati del pacchetto, attribuzione della fonte, campi
di compatibilità e informazioni sull'integrità degli artefatti.

OpenClaw controlla la compatibilità prima di installare plugin ospitati su ClawHub. I record dei pacchetti
possono anche esporre metadati di digest così che OpenClaw possa verificare gli
artefatti scaricati. ClawScan include i metadati env/config dichiarati del pacchetto `openclaw.environment`
quando revisiona le release dei plugin, in modo che i requisiti di runtime dichiarati vengano
confrontati con il comportamento osservato.

## Segnalazioni

Gli utenti autenticati possono segnalare skill, pacchetti e commenti.

Le segnalazioni devono essere specifiche e azionabili. Anche l'abuso delle segnalazioni può portare
a provvedimenti sull'account.

Esempi di segnalazione:

- metadati fuorvianti
- requisiti di credenziali o permessi non dichiarati
- istruzioni di installazione sospette
- commenti truffaldini o impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano l'[Uso accettabile](/it/clawhub/acceptable-usage)

## Segnalazioni in malafede o relative a marchi

ClawHub usa la stessa pipeline di segnalazione e moderazione dello staff per registrazioni in malafede,
impersonificazione e dispute relative ai marchi. Queste segnalazioni richiedono
contesto sufficiente affinché lo staff identifichi il reclamante, l'elenco contestato e
l'azione richiesta.

Includi:

- l'URL canonico dello skill o del pacchetto ClawHub e l'handle del proprietario
- il marchio, progetto, azienda o nome di prodotto in questione
- prove pubbliche della titolarità o dell'autorità del reclamante
- perché il proprietario attuale non è autorizzato a pubblicare con quel nome
- l'azione richiesta, come nascondere in attesa di revisione, trasferire la proprietà, rinominare
  o rimuovere

Non inserire segreti privati o documenti legali sensibili nelle segnalazioni pubbliche. Apri
una issue GitHub con prove non sensibili e chiedi ai manutentori un percorso di passaggio
privato quando necessario.

## Ricorsi e nuove scansioni

I proprietari possono richiedere una nuova scansione quando ritengono che uno skill o un pacchetto sia stato
trattenuto o contrassegnato erroneamente. I moderatori e gli amministratori della piattaforma possono richiedere nuove scansioni per qualsiasi
skill o pacchetto durante la gestione di segnalazioni o richieste di supporto:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Per i contenuti moderati, i proprietari potrebbero poter inviare un ricorso dalle
superfici ClawHub visibili al proprietario. I ricorsi devono spiegare cosa è cambiato o perché il
contrassegno è errato.

## Sospensioni di moderazione

Quando lo scanner statico contrassegna uno skill caricato come malevolo, l'editore viene
automaticamente posto sotto una sospensione di moderazione (`requiresModerationAt` impostato sull'
utente). Questo nasconde tutti gli skill dell'editore, fa sì che le pubblicazioni future
partano nascoste e crea una voce di log di audit `user.moderation.auto`.

I risultati statici sospetti vengono conservati come prove file/riga per i moderatori,
ma da soli non nascondono i contenuti né decidono il verdetto pubblico della scansione.
I nuovi caricamenti restano in stato di revisione/in sospeso finché le revisioni VirusTotal e LLM
non si stabilizzano; la scansione statica blocca immediatamente solo in presenza di firme malevole.
Le revisioni LLM di ClawScan mantengono note allineate allo scopo come guida; restituiscono un
verdetto Review/suspicious solo quando la revisione strutturata include un problema sostanziale.

Gli amministratori possono rimuovere una sospensione dovuta a falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Questo cancella `requiresModerationAt` e `requiresModerationReason`, ripristina gli
skill nascosti dalla sospensione a livello utente e scrive una voce di log di audit `user.moderation.lift`.
Gli skill nascosti per altri motivi, o la cui scansione statica rimane
malevola, restano nascosti.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Abusi gravi
possono comportare ban dell'account, revoca dei token, contenuti nascosti o
elenchi rimossi.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI
inizia a fallire dopo un provvedimento sull'account, accedi all'interfaccia web per esaminare lo
stato dell'account o contatta i manutentori tramite il canale di supporto previsto del progetto.

## Indicazioni per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili di ambiente e i permessi richiesti
- evita comandi di installazione offuscati
- collega il codice sorgente quando possibile
- usa prove a secco prima di pubblicare plugin
- rispondi con chiarezza se utenti o moderatori chiedono informazioni sul comportamento del pacchetto
