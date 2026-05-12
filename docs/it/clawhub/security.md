---
read_when:
    - Comprendere gli esiti della scansione e della moderazione di ClawHub
    - Segnalazione di una skill o di un pacchetto
    - Ripristino di una scheda sospesa, nascosta o bloccata
summary: Comportamento di attendibilità, scansione, segnalazione e moderazione di ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza + Moderazione

ClawHub è aperto alla pubblicazione, ma le inserzioni pubbliche passano comunque attraverso controlli di attendibilità,
scansione, segnalazione e moderazione. L'obiettivo è pratico: aiutare gli utenti
a ispezionare ciò che installano, offrire agli editori un percorso di recupero per i falsi positivi
e tenere i pacchetti abusivi fuori dalla scoperta pubblica.

Vedi anche [Uso accettabile](/it/clawhub/acceptable-usage).

## Cosa possono ispezionare gli utenti

Prima di installare una skill o un plugin, controlla la relativa inserzione ClawHub per:

- proprietario e attribuzione della sorgente
- versione più recente e changelog
- variabili d'ambiente o autorizzazioni richieste
- metadati di compatibilità per i plugin
- stato di scansione o moderazione
- segnalazioni, commenti, stelle, download e segnali di installazione ove mostrati

Installa solo contenuti che comprendi e ritieni affidabili.

## Stati della scansione

ClawHub può mostrare esiti di scansione o moderazione nelle pagine pubbliche e nella
diagnostica visibile al proprietario.

Gli esiti comuni includono:

- `clean`: non è stato trovato alcun problema bloccante.
- `suspicious`: il rilascio richiede cautela o revisione.
- `malicious`: il rilascio è considerato non sicuro.
- `pending`: i controlli non sono ancora terminati.
- `held`, `quarantined`, `revoked` o `hidden`: il rilascio non è completamente
  disponibile sulle superfici di installazione pubbliche.

La formulazione esatta può variare a seconda della superficie, ma il significato pratico è lo stesso: se un
rilascio è trattenuto o bloccato, gli utenti non dovrebbero installarlo finché il proprietario non risolve
il problema o la moderazione non lo ripristina.

## Skills

Le scansioni delle skill esaminano il bundle della skill pubblicato, i metadati, i requisiti
dichiarati e le istruzioni sospette.

ClawHub presta particolare attenzione alle discrepanze tra ciò che una skill dichiara e
ciò che sembra fare. Ad esempio, una skill che fa riferimento a una chiave API richiesta
dovrebbe dichiarare tale requisito in `SKILL.md` in modo che gli utenti possano vederlo prima
dell'installazione.

I risultati della scansione sono basati sugli artefatti. I comportamenti attesi del provider, come
credenziali API dichiarate, callback OAuth localhost, pulizia dell'uninstall con ambito, codifica Basic Auth
o caricamenti di file selezionati dall'utente verso il provider dichiarato, sono trattati
diversamente dall'inoltro nascosto di credenziali, dall'accesso ampio a file privati,
da destinazioni di rete non correlate o dall'abuso stealth del browser.

Vedi [Formato delle skill](/it/clawhub/skill-format).

## Plugin

I rilasci dei Plugin includono metadati del pacchetto, attribuzione della sorgente, campi
di compatibilità e informazioni sull'integrità degli artefatti.

OpenClaw verifica la compatibilità prima di installare i plugin ospitati su ClawHub. I record dei pacchetti
possono anche esporre metadati digest in modo che OpenClaw possa verificare gli
artefatti scaricati. ClawScan include i metadati env/config `openclaw.environment` del pacchetto dichiarato
quando revisiona i rilasci dei plugin, così che i requisiti di runtime dichiarati siano
confrontati con il comportamento osservato.

## Segnalazioni

Gli utenti che hanno effettuato l'accesso possono segnalare skill, pacchetti e commenti.

Le segnalazioni devono essere specifiche e azionabili. L'abuso delle segnalazioni può a sua volta portare a
provvedimenti sull'account.

Esempi di segnalazione:

- metadati fuorvianti
- requisiti di credenziali o autorizzazioni non dichiarati
- istruzioni di installazione sospette
- commenti truffaldini o impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Uso accettabile](/it/clawhub/acceptable-usage)

## Note ClawScan dell'editore

Gli editori possono fornire una nota ClawScan facoltativa quando pubblicano una skill o un
plugin. Questa nota fornisce a ClawScan il contesto per comportamenti che altrimenti potrebbero sembrare
insoliti, come accesso alla rete, accesso a host nativi o credenziali
specifiche del provider.

## Blocchi di moderazione

Quando lo scanner statico contrassegna una skill caricata come dannosa, l'editore viene
automaticamente posto sotto un blocco di moderazione (`requiresModerationAt` impostato sull'
utente). Questo nasconde tutte le skill dell'editore, fa sì che le pubblicazioni future
inizino nascoste e crea una voce di log di audit `user.moderation.auto`.

I risultati statici sospetti vengono conservati come prove file/riga per i moderatori,
ma non nascondono i contenuti né decidono da soli il verdetto di scansione pubblico.
I nuovi caricamenti rimangono in stato di revisione/in sospeso finché la revisione LLM non si conclude. La scansione statica
blocca immediatamente solo per firme dannose. I riscontri del motore VirusTotal
restano prove di sicurezza visibili, ma i verdetti VirusTotal Code Insight/Palm
sono consultivi e non nascondono da soli le skill. Le revisioni LLM di ClawScan
mantengono come guida le note allineate allo scopo. I risultati di revisione medi restano visibili
sull'artefatto, mentre il filtro sospetto è riservato a preoccupazioni LLM
ad alto impatto, risultati dannosi o rilevamenti corroborati da motori AV.

Gli amministratori possono rimuovere un blocco da falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Questo cancella `requiresModerationAt` e `requiresModerationReason`, ripristina
le skill nascoste dal blocco a livello utente e scrive una voce di log di audit `user.moderation.lift`.
Le skill nascoste per altri motivi, o la cui scansione statica resta
dannosa, rimangono nascoste.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Abusi gravi
possono comportare ban dell'account, revoca dei token, contenuti nascosti o rimozione
delle inserzioni.

Gli account eliminati, bannati o disabilitati non possono usare token API di ClawHub. Se l'autenticazione CLI
inizia a non riuscire dopo un provvedimento sull'account, accedi all'interfaccia web per esaminare lo
stato dell'account. Se l'accesso o il normale accesso CLI è bloccato, contatta
security@openclaw.ai per una revisione di recupero.

## Linee guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- aggiungi una nota ClawScan dell'editore quando un rilascio presenta un comportamento insolito ma intenzionale
- evita comandi di installazione offuscati
- collega la sorgente quando possibile
- usa dry run prima di pubblicare plugin
- rispondi con chiarezza se utenti o moderatori chiedono informazioni sul comportamento del pacchetto
