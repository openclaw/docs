---
read_when:
    - Comprendere i risultati della scansione e della moderazione di ClawHub
    - Segnalare una skill o un pacchetto
    - Ripristino di una scheda sospesa, nascosta o bloccata
summary: Comportamento di attendibilità, scansione, segnalazione e moderazione di ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:57:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza + moderazione

ClawHub è aperto alla pubblicazione, ma gli elenchi pubblici passano comunque attraverso controlli di attendibilità,
scansione, segnalazione e moderazione. L'obiettivo è pratico: aiutare gli utenti
a esaminare ciò che installano, dare agli editori un percorso di recupero per i falsi positivi
e tenere i pacchetti abusivi fuori dalla scoperta pubblica.

Vedi anche [Utilizzo accettabile](/it/clawhub/acceptable-usage).

## Cosa possono ispezionare gli utenti

Prima di installare uno skill o un Plugin, controlla il relativo elenco ClawHub per:

- attribuzione di proprietario e origine
- versione più recente e changelog
- variabili di ambiente o permessi richiesti
- metadati di compatibilità per i Plugin
- stato di scansione o moderazione
- segnalazioni, commenti, stelle, download e segnali di installazione, dove mostrati

Installa solo contenuti che comprendi e di cui ti fidi.

## Stati di scansione

ClawHub può mostrare esiti di scansione o moderazione nelle pagine pubbliche e nella diagnostica
visibile al proprietario.

Gli esiti comuni includono:

- `clean`: non è stato trovato alcun problema bloccante.
- `suspicious`: la release richiede cautela o revisione.
- `malicious`: la release è considerata non sicura.
- `pending`: i controlli non sono ancora terminati.
- `held`, `quarantined`, `revoked` o `hidden`: la release non è completamente
  disponibile sulle superfici di installazione pubbliche.

La formulazione esatta può variare in base alla superficie, ma il significato pratico è lo stesso: se una
release è trattenuta o bloccata, gli utenti non devono installarla finché il proprietario non risolve
il problema o la moderazione non la ripristina.

## Skills

Le scansioni degli skill esaminano il bundle dello skill pubblicato, i metadati, i requisiti
dichiarati e le istruzioni sospette.

ClawHub presta particolare attenzione alle discrepanze tra ciò che uno skill dichiara e
ciò che sembra fare. Ad esempio, uno skill che fa riferimento a una chiave API richiesta
dovrebbe dichiarare tale requisito in `SKILL.md` in modo che gli utenti possano vederlo prima
dell'installazione.

I risultati della scansione sono basati sugli artefatti. Il comportamento previsto del provider, come credenziali
API dichiarate, callback OAuth localhost, pulizia di disinstallazione con ambito, codifica Basic Auth
o caricamenti di file selezionati dall'utente verso il provider dichiarato, viene trattato
diversamente dall'inoltro nascosto di credenziali, dall'accesso ampio a file privati,
da destinazioni di rete non correlate o dall'abuso furtivo del browser.

Vedi [Formato skill](/it/clawhub/skill-format).

## Plugin

Le release dei Plugin includono metadati del pacchetto, attribuzione dell'origine, campi di compatibilità
e informazioni sull'integrità degli artefatti.

OpenClaw verifica la compatibilità prima di installare Plugin ospitati su ClawHub. I record dei pacchetti
possono anche esporre metadati digest, così OpenClaw può verificare gli artefatti
scaricati. ClawScan include i metadati env/config dichiarati del pacchetto `openclaw.environment`
durante la revisione delle release dei Plugin, in modo che i requisiti di runtime dichiarati siano
confrontati con il comportamento osservato.

## Segnalazioni

Gli utenti che hanno effettuato l'accesso possono segnalare skill, pacchetti e commenti.

Le segnalazioni devono essere specifiche e utilizzabili. L'abuso delle segnalazioni può a sua volta portare a
provvedimenti sull'account.

Esempi di segnalazione:

- metadati fuorvianti
- requisiti di credenziali o permessi non dichiarati
- istruzioni di installazione sospette
- commenti fraudolenti o impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Utilizzo accettabile](/it/clawhub/acceptable-usage)

## Note ClawScan per gli editori

Gli editori possono fornire una nota ClawScan opzionale quando pubblicano uno skill o
un Plugin. Questa nota fornisce a ClawScan contesto per comportamenti che altrimenti potrebbero apparire
insoliti, come accesso alla rete, accesso all'host nativo o credenziali
specifiche del provider.

## Sospensioni di moderazione

Quando lo scanner statico segnala uno skill caricato come dannoso, l'editore viene
automaticamente posto sotto sospensione di moderazione (`requiresModerationAt` impostato sull'
utente). Questo nasconde tutti gli skill dell'editore, fa sì che le pubblicazioni future
inizino nascoste e crea una voce di log di audit `user.moderation.auto`.

I risultati statici sospetti vengono conservati come prova file/riga per i moderatori,
ma da soli non nascondono i contenuti né decidono il verdetto di scansione pubblico.
I nuovi caricamenti restano nello stato di revisione/in attesa finché la revisione LLM non si conclude. La scansione statica
blocca immediatamente solo in caso di firme dannose. I rilevamenti del motore VirusTotal
restano prove di sicurezza visibili, ma i verdetti VirusTotal Code Insight/Palm
sono consultivi e da soli non nascondono gli skill. Le revisioni LLM di ClawScan
mantengono le note allineate allo scopo come guida. I risultati di revisione medi restano visibili
sull'artefatto, mentre il filtro sospetto è riservato a problemi LLM
ad alto impatto, risultati dannosi o rilevamenti AV-engine corroborati.

Gli amministratori possono rimuovere una sospensione dovuta a falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Questo cancella `requiresModerationAt` e `requiresModerationReason`, ripristina
gli skill nascosti dalla sospensione a livello utente e scrive una voce di log di audit `user.moderation.lift`.
Gli skill nascosti per altri motivi, o la cui scansione statica resta
dannosa, rimangono nascosti.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Abusi gravi
possono comportare ban dell'account, revoca dei token, contenuti nascosti o rimozione
degli elenchi.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI
inizia a fallire dopo un provvedimento sull'account, accedi all'interfaccia web per verificare lo stato
dell'account. Se l'accesso o il normale accesso CLI è bloccato, contatta
security@openclaw.ai per una revisione del recupero.

## Guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili di ambiente e i permessi richiesti
- aggiungi una nota ClawScan dell'editore quando una release ha un comportamento insolito ma intenzionale
- evita comandi di installazione offuscati
- collega il codice sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare Plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento del pacchetto
