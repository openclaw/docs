---
read_when:
    - Comprendere gli esiti della scansione e della moderazione di ClawHub
    - Segnalare una skill o un pacchetto
    - Ripristino di una scheda trattenuta, nascosta o bloccata
summary: Comportamento di ClawHub relativo a fiducia, scansione, segnalazione, ricorso e moderazione.
x-i18n:
    generated_at: "2026-05-11T20:24:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza + Moderazione

ClawHub è aperto alla pubblicazione, ma le inserzioni pubbliche passano comunque attraverso controlli di fiducia,
scansione, segnalazione e moderazione. L'obiettivo è pratico: aiutare gli utenti
a ispezionare ciò che installano, offrire agli editori un percorso di recupero per i falsi positivi
e tenere i pacchetti abusivi fuori dalla scoperta pubblica.

Vedi anche [Uso accettabile](/it/clawhub/acceptable-usage).

## Cosa possono ispezionare gli utenti

Prima di installare una skill o un plugin, controlla nella sua inserzione ClawHub:

- attribuzione del proprietario e della sorgente
- ultima versione e changelog
- variabili d'ambiente o autorizzazioni richieste
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

Le scansioni delle skill esaminano il bundle di skill pubblicato, i metadati, i requisiti
dichiarati e le istruzioni sospette.

ClawHub presta particolare attenzione alle discrepanze tra ciò che una skill dichiara e
ciò che sembra fare. Per esempio, una skill che fa riferimento a una chiave API richiesta
dovrebbe dichiarare tale requisito in `SKILL.md` così che gli utenti possano vederlo prima
dell'installazione.

I risultati della scansione sono basati sugli artefatti. Il comportamento previsto del provider, come
credenziali API dichiarate, callback OAuth localhost, pulizia di disinstallazione con ambito definito, codifica Basic Auth
o caricamenti di file selezionati dall'utente verso il provider dichiarato, viene trattato
diversamente dall'inoltro nascosto di credenziali, dall'accesso ampio a file privati,
da destinazioni di rete non correlate o dall'abuso furtivo del browser.

Vedi [Formato delle skill](/it/clawhub/skill-format).

## Plugin

Le release dei plugin includono metadati del pacchetto, attribuzione della sorgente, campi di compatibilità
e informazioni sull'integrità degli artefatti.

OpenClaw verifica la compatibilità prima di installare plugin ospitati su ClawHub. I record dei pacchetti
possono anche esporre metadati digest così che OpenClaw possa verificare gli
artefatti scaricati. ClawScan include i metadati env/config dichiarati del pacchetto `openclaw.environment`
durante la revisione delle release dei plugin, così che i requisiti di runtime dichiarati siano
confrontati con il comportamento osservato.

## Segnalazioni

Gli utenti autenticati possono segnalare skill, pacchetti e commenti.

Le segnalazioni devono essere specifiche e utilizzabili. L'abuso delle segnalazioni può a sua volta portare
ad azioni sull'account.

Esempi di segnalazione:

- metadati fuorvianti
- requisiti di credenziali o autorizzazioni non dichiarati
- istruzioni di installazione sospette
- commenti truffaldini o impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Uso accettabile](/it/clawhub/acceptable-usage)

## Segnalazioni in malafede o relative a marchi

ClawHub usa la stessa pipeline di segnalazione e moderazione dello staff per registrazioni in malafede,
impersonificazione e controversie relative ai marchi. Queste segnalazioni richiedono
contesto sufficiente perché lo staff possa identificare il ricorrente, l'inserzione contestata e
l'azione richiesta.

Includi:

- l'URL canonico della skill o del pacchetto ClawHub e l'handle del proprietario
- il marchio, progetto, azienda o nome di prodotto in questione
- prove pubbliche della proprietà o dell'autorità del ricorrente
- perché il proprietario attuale non è autorizzato a pubblicare con quel nome
- l'azione richiesta, come nascondere in attesa di revisione, trasferire la proprietà, rinominare
  o rimuovere

Non inserire segreti privati o documenti legali sensibili nelle segnalazioni pubbliche. Apri
una issue GitHub con prove non sensibili e chiedi ai maintainer un percorso di passaggio
privato quando necessario.

## Ricorsi e nuove scansioni

I proprietari possono richiedere una nuova scansione quando ritengono che una skill o un pacchetto sia stato erroneamente
trattenuto o segnalato. I moderatori e gli amministratori della piattaforma possono richiedere nuove scansioni per qualsiasi
skill o pacchetto durante la gestione di segnalazioni o richieste di supporto:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Per i contenuti moderati, i proprietari potrebbero poter inviare un ricorso dalle superfici ClawHub
visibili al proprietario. I ricorsi dovrebbero spiegare cosa è cambiato o perché la
segnalazione è errata.

## Blocchi di moderazione

Quando lo scanner statico segnala una skill caricata come dannosa, l'editore viene
automaticamente sottoposto a un blocco di moderazione (`requiresModerationAt` impostato sull'
utente). Questo nasconde tutte le skill dell'editore, fa sì che le pubblicazioni future
inizino nascoste e crea una voce di audit log `user.moderation.auto`.

I risultati statici sospetti vengono conservati come prove file/riga per i moderatori,
ma da soli non nascondono i contenuti né determinano il verdetto di scansione pubblico.
I nuovi caricamenti restano in stato di revisione/in sospeso finché la revisione LLM non si conclude. La scansione statica
blocca immediatamente solo per firme dannose. I riscontri dei motori VirusTotal
restano prove di sicurezza visibili, ma i verdetti VirusTotal Code Insight/Palm
sono consultivi e da soli non nascondono le skill. Le revisioni ClawScan LLM
mantengono come guida le note allineate allo scopo. I risultati di revisione medi restano visibili
sull'artefatto, mentre il filtro sospetto è riservato a preoccupazioni LLM
ad alto impatto, risultati dannosi o rilevamenti corroborati da motori AV.

Gli amministratori possono rimuovere un blocco dovuto a falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Questo cancella `requiresModerationAt` e `requiresModerationReason`, ripristina
le skill nascoste dal blocco a livello utente e scrive una voce di audit log `user.moderation.lift`.
Le skill nascoste per altri motivi, o la cui scansione statica resta
dannosa, rimangono nascoste.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi
possono comportare ban dell'account, revoca dei token, contenuti nascosti o inserzioni
rimosse.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI
inizia a fallire dopo un'azione sull'account, accedi all'interfaccia web per verificare lo
stato dell'account o contatta i maintainer tramite il canale di supporto previsto del progetto.

## Indicazioni per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega la sorgente quando possibile
- usa dry run prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento del pacchetto
