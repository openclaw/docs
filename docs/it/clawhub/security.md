---
read_when:
    - Comprendere gli esiti della scansione e della moderazione di ClawHub
    - Segnalazione di una skill o di un pacchetto
    - Recupero da una scheda in sospeso, nascosta o bloccata
summary: Comportamento di fiducia, scansione, segnalazione e moderazione di ClawHub.
x-i18n:
    generated_at: "2026-05-12T04:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza + Moderazione

ClawHub è aperto alla pubblicazione, ma gli elenchi pubblici passano comunque attraverso controlli di fiducia, scansione, segnalazione e moderazione. L'obiettivo è pratico: aiutare gli utenti a verificare cosa installano, offrire agli editori un percorso di recupero per i falsi positivi e tenere i pacchetti abusivi fuori dalla scoperta pubblica.

Vedi anche [Uso accettabile](/it/clawhub/acceptable-usage).

## Cosa possono verificare gli utenti

Prima di installare una skill o un plugin, controlla il relativo elenco ClawHub per:

- attribuzione del proprietario e della fonte
- versione più recente e changelog
- variabili d'ambiente o autorizzazioni richieste
- metadati di compatibilità per i plugin
- stato di scansione o moderazione
- segnalazioni, commenti, stelle, download e segnali di installazione dove mostrati

Installa solo contenuti che comprendi e di cui ti fidi.

## Stati di scansione

ClawHub può mostrare esiti di scansione o moderazione sulle pagine pubbliche e nella diagnostica visibile al proprietario.

Gli esiti comuni includono:

- `clean`: non è stato trovato alcun problema bloccante.
- `suspicious`: la release richiede cautela o revisione.
- `malicious`: la release è considerata non sicura.
- `pending`: i controlli non sono ancora terminati.
- `held`, `quarantined`, `revoked` o `hidden`: la release non è completamente disponibile sulle superfici di installazione pubbliche.

La formulazione esatta può variare in base alla superficie, ma il significato pratico è lo stesso: se una release è trattenuta o bloccata, gli utenti non dovrebbero installarla finché il proprietario non risolve il problema o la moderazione non la ripristina.

## Skills

Le scansioni delle skill esaminano il bundle della skill pubblicata, i metadati, i requisiti dichiarati e le istruzioni sospette.

ClawHub presta particolare attenzione alle discrepanze tra ciò che una skill dichiara e ciò che sembra fare. Ad esempio, una skill che fa riferimento a una chiave API richiesta dovrebbe dichiarare quel requisito in `SKILL.md`, così gli utenti possono vederlo prima dell'installazione.

I risultati della scansione sono basati sugli artefatti. Il comportamento previsto del provider, come credenziali API dichiarate, callback OAuth su localhost, pulizia di disinstallazione con ambito, codifica Basic Auth o caricamenti di file selezionati dall'utente verso il provider indicato, viene trattato diversamente dall'inoltro nascosto di credenziali, dall'accesso ampio a file privati, da destinazioni di rete non correlate o dall'abuso nascosto del browser.

Vedi [Formato skill](/it/clawhub/skill-format).

## Plugin

Le release dei plugin includono metadati del pacchetto, attribuzione della fonte, campi di compatibilità e informazioni sull'integrità degli artefatti.

OpenClaw verifica la compatibilità prima di installare plugin ospitati su ClawHub. I record dei pacchetti possono anche esporre metadati digest in modo che OpenClaw possa verificare gli artefatti scaricati. ClawScan include i metadati env/config `openclaw.environment` dichiarati dal pacchetto durante la revisione delle release dei plugin, così i requisiti di runtime dichiarati vengono confrontati con il comportamento osservato.

## Segnalazioni

Gli utenti autenticati possono segnalare skill, pacchetti e commenti.

Le segnalazioni devono essere specifiche e utilizzabili. L'abuso delle segnalazioni può a sua volta portare ad azioni sull'account.

Esempi di segnalazione:

- metadati fuorvianti
- requisiti di credenziali o autorizzazioni non dichiarati
- istruzioni di installazione sospette
- commenti truffaldini o impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuto che viola [Uso accettabile](/it/clawhub/acceptable-usage)

## Note ClawScan dell'editore

Gli editori possono fornire una nota ClawScan opzionale quando pubblicano una skill o un plugin. Questa nota fornisce a ClawScan contesto su comportamenti che altrimenti potrebbero sembrare insoliti, come accesso alla rete, accesso all'host nativo o credenziali specifiche del provider.

## Blocchi di moderazione

Quando lo scanner statico contrassegna una skill caricata come dannosa, l'editore viene automaticamente posto sotto un blocco di moderazione (`requiresModerationAt` impostato sull'utente). Questo nasconde tutte le skill dell'editore, fa sì che le pubblicazioni future inizino nascoste e crea una voce di log di audit `user.moderation.auto`.

I risultati statici sospetti vengono conservati come prove file/riga per i moderatori, ma da soli non nascondono il contenuto né decidono il verdetto di scansione pubblico. I nuovi caricamenti rimangono in stato di revisione/in sospeso finché la revisione LLM non si conclude. La scansione statica blocca immediatamente solo per firme dannose. Le rilevazioni dei motori VirusTotal rimangono prove di sicurezza visibili, ma i verdetti VirusTotal Code Insight/Palm sono consultivi e da soli non nascondono le skill. Le revisioni LLM di ClawScan mantengono le note allineate allo scopo come guida. I risultati di revisione medi rimangono visibili sull'artefatto, mentre il filtro sospetto è riservato a preoccupazioni LLM ad alto impatto, risultati dannosi o rilevazioni confermate dai motori AV.

Gli amministratori possono revocare un blocco dovuto a falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Questo cancella `requiresModerationAt` e `requiresModerationReason`, ripristina le skill nascoste dal blocco a livello utente e scrive una voce di log di audit `user.moderation.lift`. Le skill nascoste per altri motivi, o la cui scansione statica rimane dannosa, restano nascoste.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi possono comportare ban dell'account, revoca dei token, contenuti nascosti o elenchi rimossi.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia web per verificare lo stato dell'account. Se l'accesso o il normale accesso CLI è bloccato, contatta security@openclaw.ai per una revisione di recupero.

## Indicazioni per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- aggiungi una nota ClawScan dell'editore quando una release ha un comportamento insolito ma intenzionale
- evita comandi di installazione offuscati
- collega la fonte quando possibile
- usa dry run prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento del pacchetto
