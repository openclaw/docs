---
read_when:
    - Comprendere gli esiti della scansione e della moderazione di ClawHub
    - Segnalare una skill o un pacchetto
    - Ripristino di una scheda in sospeso, nascosta o bloccata
summary: Comportamento di attendibilità, scansione, segnalazione e moderazione di ClawHub.
x-i18n:
    generated_at: "2026-05-13T02:52:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza + Moderazione

ClawHub è aperto alla pubblicazione, ma le inserzioni pubbliche passano comunque attraverso controlli di affidabilità,
scansione, segnalazione e moderazione. L'obiettivo è pratico: aiutare gli utenti
a ispezionare ciò che installano, offrire agli editori un percorso di recupero per i falsi positivi
e tenere i pacchetti abusivi fuori dalla scoperta pubblica.

Vedi anche [Utilizzo accettabile](/it/clawhub/acceptable-usage).

## Cosa possono ispezionare gli utenti

Prima di installare una skill o un plugin, controlla la sua inserzione ClawHub per:

- proprietario e attribuzione della sorgente
- ultima versione e changelog
- variabili d'ambiente o permessi richiesti
- metadati di compatibilità per i plugin
- stato di scansione o moderazione
- segnalazioni, commenti, stelle, download e segnali di installazione dove mostrati

Installa solo contenuti che comprendi e di cui ti fidi.

## Stati di scansione

ClawHub può mostrare gli esiti di scansione o moderazione sulle pagine pubbliche e nella diagnostica
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

Le scansioni delle Skills esaminano il bundle della skill pubblicato, i metadati, i requisiti
dichiarati e le istruzioni sospette.

ClawHub presta particolare attenzione alle discrepanze tra ciò che una skill dichiara e
ciò che sembra fare. Ad esempio, una skill che fa riferimento a una chiave API richiesta
dovrebbe dichiarare tale requisito in `SKILL.md` in modo che gli utenti possano vederlo prima
dell'installazione.

I risultati della scansione sono basati sugli artefatti. Il comportamento previsto del provider, come credenziali
API dichiarate, callback OAuth localhost, pulizia di disinstallazione con ambito, codifica Basic Auth
o caricamenti di file selezionati dall'utente verso il provider dichiarato, viene trattato
diversamente dall'inoltro nascosto di credenziali, dall'accesso ampio a file privati,
da destinazioni di rete non correlate o dall'abuso stealth del browser.

Vedi [Formato delle skill](/it/clawhub/skill-format).

## Plugins

Le release dei Plugin includono metadati del pacchetto, attribuzione della sorgente, campi
di compatibilità e informazioni sull'integrità degli artefatti.

OpenClaw controlla la compatibilità prima di installare plugin ospitati su ClawHub. I record dei pacchetti
possono anche esporre metadati digest in modo che OpenClaw possa verificare gli
artefatti scaricati. ClawScan include i metadati env/config dichiarati del pacchetto `openclaw.environment`
durante la revisione delle release dei plugin, in modo che i requisiti di runtime dichiarati siano
confrontati con il comportamento osservato.

## Segnalazioni

Gli utenti autenticati possono segnalare Skills, pacchetti e commenti.

Le segnalazioni devono essere specifiche e azionabili. L'abuso delle segnalazioni può a sua volta portare ad
azioni sull'account.

Esempi di segnalazione:

- metadati fuorvianti
- requisiti di credenziali o permessi non dichiarati
- istruzioni di installazione sospette
- commenti truffaldini o impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Utilizzo accettabile](/it/clawhub/acceptable-usage)

## Note ClawScan dell'editore

Gli editori possono fornire una nota ClawScan facoltativa quando pubblicano una skill o un
plugin. Questa nota offre a ClawScan contesto per comportamenti che altrimenti potrebbero sembrare
insoliti, come accesso alla rete, accesso all'host nativo o credenziali
specifiche del provider.

## Blocchi di moderazione

Quando lo scanner statico contrassegna una skill caricata come malevola, l'editore viene
automaticamente posto sotto un blocco di moderazione (`requiresModerationAt` impostato sull'
utente). Questo nasconde tutte le Skills dell'editore, fa sì che le pubblicazioni future
partano nascoste e crea una voce di registro di audit `user.moderation.auto`.

I risultati statici sospetti vengono conservati come evidenza file/riga per i moderatori,
ma da soli non nascondono contenuti né decidono il verdetto di scansione pubblico.
I nuovi caricamenti restano in stato di revisione/in sospeso finché la revisione LLM non si stabilizza. La scansione statica
blocca immediatamente solo in caso di firme malevole. I riscontri dei motori
VirusTotal restano evidenza di sicurezza visibile, ma i verdetti VirusTotal Code Insight/Palm
sono consultivi e da soli non nascondono le Skills. Le revisioni LLM di ClawScan
mantengono le note allineate allo scopo come guida. I risultati di revisione medi restano visibili
sull'artefatto, mentre il filtro sospetto è riservato a preoccupazioni LLM
ad alto impatto, risultati malevoli o rilevamenti corroborati da motori AV.

Gli amministratori possono rimuovere un blocco da falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Questo cancella `requiresModerationAt` e `requiresModerationReason`, ripristina
le Skills nascoste dal blocco a livello utente e scrive una voce di registro di audit `user.moderation.lift`.
Le Skills nascoste per altri motivi, o la cui scansione statica rimane
malevola, restano nascoste.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi
possono comportare ban dell'account, revoca dei token, contenuti nascosti o rimozione
delle inserzioni.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI
inizia a fallire dopo un'azione sull'account, accedi alla UI web per rivedere lo stato
dell'account. Se l'accesso o il normale accesso CLI è bloccato, contatta
security@openclaw.ai per una revisione di recupero.

## Linee guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e i permessi richiesti
- aggiungi una nota ClawScan dell'editore quando una release ha un comportamento insolito ma intenzionale
- evita comandi di installazione offuscati
- collega la sorgente quando possibile
- usa dry run prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento del pacchetto
