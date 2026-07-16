---
read_when:
    - Si desidera che OpenClaw apprenda procedure riutilizzabili dalle conversazioni completate
    - Si sta decidendo se abilitare le proposte autonome di skill
    - È necessario comprendere la sicurezza, i costi, l’idoneità o la risoluzione dei problemi dell’autoapprendimento
sidebarTitle: Self-learning
summary: Consenti a OpenClaw di proporre Skills riutilizzabili sulla base delle correzioni e del lavoro sostanziale completato
title: Autoapprendimento
x-i18n:
    generated_at: "2026-07-16T15:09:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

L'autoapprendimento consente a OpenClaw di trasformare le evidenze utili ricavate dalle conversazioni in proposte in sospeso di
[Skill Workshop](/it/tools/skill-workshop). Non addestra i pesi del modello,
non modifica le skill attive né cambia silenziosamente il comportamento dell'agente. Ogni procedura
appresa rimane in sospeso finché un operatore non la esamina e la applica.

L'autoapprendimento è **disabilitato per impostazione predefinita**. Abilitarlo solo quando
un'ulteriore esecuzione del modello in background e la revisione della trascrizione sono appropriate
per lo spazio di lavoro.

## Abilitare l'autoapprendimento

Nella Control UI, aprire **Plugin → Workshop** e attivare **Autoapprendimento**. La
modifica ha effetto immediato; quando un altro processo di scrittura della configurazione ha aggiornato il
file, la Control UI aggiorna l'istantanea della configurazione e ritenta l'attivazione senza
ricaricare la pagina o il Gateway.

Usare la CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Oppure modificare `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Disabilitarlo nuovamente con:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

La creazione di skill richiesta dall'utente, `/learn` e le operazioni manuali di Skill Workshop
continuano a funzionare mentre l'autoapprendimento è disabilitato.

## Esaminare manualmente le sessioni precedenti

La revisione manuale della cronologia è l'alternativa più prudente all'acquisizione autonoma.
Aprire **Plugin → Workshop** nella Control UI e selezionare **Trova idee per le skill**.
Questa operazione non modifica `skills.workshop.autonomous.enabled`.

Ogni scansione:

- inizia dalle sessioni non ancora esaminate più recenti e procede a ritroso;
- esamina fino a 20 sessioni sostanziali con almeno sei turni del modello;
- ignora le sessioni Cron, Heartbeat, hook, subagente, ACP, di proprietà dei Plugin e di revisione
  interna;
- oscura i segreti riconosciuti e limita il pacchetto della trascrizione prima di inviarlo
  al modello configurato dell'agente selezionato;
- applica gli stessi criteri rigorosi della revisione autonoma dell'esperienza; e
- può creare o rivedere al massimo tre proposte in sospeso, mai skill attive.

Il Workshop segnala il numero cumulativo di sessioni, l'intervallo di date coperto e le idee trovate.
Selezionare **Scansiona attività precedenti** per la finestra successiva più vecchia. Quando il cursore raggiunge
l'inizio della cronologia idonea, l'azione diventa **Scansiona nuova attività**.
OpenClaw conserva nel database di stato condiviso solo il cursore e i metadati di copertura;
non crea un secondo archivio delle trascrizioni.

Le sessioni vengono scansionate solo quando OpenClaw può dimostrarne la titolarità ed escludere
il contenuto proveniente da hook esterni. Dopo un aggiornamento, la trascrizione corrente precedente
all'aggiornamento può essere classificata localmente, ma le trascrizioni ruotate precedenti all'aggiornamento
senza provenienza per singola esecuzione vengono ignorate. Le nuove trascrizioni mantengono questa provenienza anche dopo la rotazione.

Le scansioni manuali comportano comunque costi del provider del modello e inviano il contenuto
idoneo delle conversazioni al provider configurato. Utilizzarle solo quando tale revisione è conforme
ai requisiti di privacy e trattamento dei dati dello spazio di lavoro.

## Che cosa può apprendere OpenClaw

L'autoapprendimento segue due percorsi prudenti:

1. **Istruzioni dirette e correzioni.** OpenClaw rileva formulazioni persistenti
   come «d'ora in poi», «la prossima volta» e le correzioni a un approccio non riuscito.
   Con l'autoapprendimento abilitato, può trasformare questi segnali in proposte in sospeso
   senza attendere un altro prompt. Questo percorso deterministico può raggruppare istruzioni
   correlate in un massimo di tre proposte, indirizzarle a una skill scrivibile dello spazio di lavoro
   o rivedere una propria proposta correlata in sospeso. Viene eseguito anche dopo turni non riusciti,
   perché acquisisce le istruzioni dell'utente anziché valutare il completamento.
2. **Revisione dell'esperienza.** Dopo un turno in primo piano riuscito e sostanziale,
   OpenClaw può esaminare il lavoro completato per individuare una tecnica di ripristino riutilizzabile o
   una procedura stabile che elimini almeno due futuri cicli di interazione
   con il modello o gli strumenti.

Tra i candidati validi rientrano:

- un ripristino affidabile dopo ripetuti errori degli strumenti o del modello;
- un vincolo di ordinamento non ovvio che ha impedito un errore ricorrente;
- un flusso di lavoro stabile in più passaggi che ha richiesto esplorazioni ripetute; oppure
- un controllo preliminare riutilizzabile che eviterebbe più chiamate future.

Il revisore dovrebbe astenersi per attività ordinarie riuscite, richieste una tantum,
dati personali, preferenze semplici, errori temporanei dell'ambiente, consigli generici,
affermazioni negative non supportate e segreti.

## Quando viene eseguita la revisione dell'esperienza

La revisione dell'esperienza viene deliberatamente ritardata e limitata:

- Il turno in primo piano deve terminare correttamente.
- Il turno corrente deve contenere almeno dieci iterazioni del modello.
- Sono escluse le sessioni Cron, Heartbeat, di memoria, overflow, hook, subagente e
  revisione.
- L'esecuzione in primo piano deve aver risolto un provider e un modello e deve avere
  effettivamente avuto accesso a `skill_workshop`.
- OpenClaw attende 30 secondi dopo il completamento. Un successivo completamento in primo piano
  nella stessa sessione riavvia tale periodo di inattività.
- Se un'esecuzione dell'agente o di risposta è ancora attiva, la revisione attende altri 30 secondi.
- Viene eseguita una sola revisione dell'esperienza alla volta.
- La revisione ritardata è un'attività del Gateway locale al processo. Il Gateway deve rimanere in esecuzione
  durante la finestra di inattività; i runtime locali monouso e quelli basati sulla CLI non conservano
  un contesto sufficiente della traiettoria e della disponibilità degli strumenti per pianificarla.

La risposta in primo piano non viene mai ritardata per l'apprendimento. Un turno non riuscito o non idoneo
non avvia la revisione dell'esperienza, sebbene le correzioni dirette dell'utente possano
comunque essere proposte come suggerimento quando l'autonomia è disabilitata.

## Che cosa riceve il revisore

Il revisore in background riceve solo il turno corrente, a partire dal suo
messaggio utente più recente. La traiettoria renderizzata è limitata a 60,000 caratteri;
quando necessario, OpenClaw conserva il primo messaggio e le evidenze più recenti e
contrassegna la parte centrale omessa.

Il revisore riutilizza il provider e il modello risolti. Riutilizza il profilo
di autenticazione dell'esecuzione in primo piano quando tale identità è disponibile e disabilita i fallback del modello. La
revisione avvia quindi un'ulteriore esecuzione del modello sul provider configurato.
Tale esecuzione può effettuare più di una richiesta al provider quando esamina o redige una
proposta. Si applicano i prezzi e le condizioni di trattamento dei dati del provider, come
per il turno in primo piano.

Prima dell'avvio, OpenClaw ricarica la configurazione corrente del runtime e ricontrolla
la sandbox effettiva e la policy degli strumenti della conversazione originale. Se l'esecuzione è
in sandbox, la policy non consente più `skill_workshop` oppure mancano dati obbligatori
del runtime, la revisione si interrompe in modo sicuro e non crea nulla.

<Warning>
  L'abilitazione dell'autoapprendimento consente di inviare al provider del modello
  selezionato il contenuto idoneo delle conversazioni, inclusi gli input e i risultati
  degli strumenti del turno corrente, per un'ulteriore revisione. Non abilitarlo in uno
  spazio di lavoro in cui tale revisione violerebbe i requisiti di trattamento dei dati.
</Warning>

## Sicurezza delle proposte

Il revisore viene eseguito in una sessione isolata con una superficie degli strumenti
deliberatamente limitata:

- Può solo elencare o esaminare le proposte del Workshop e creare o rivedere una
  proposta in sospeso.
- Non può aggiornare una skill attiva, applicare una proposta, rifiutare una proposta, mettere in quarantena
  una proposta, inviare un messaggio o utilizzare strumenti generici dell'agente.
- Un unico budget di modifica viene condiviso tra i tentativi del modello, pertanto una revisione può creare o
  rivedere al massimo una proposta.
- La traiettoria esaminata viene trattata come evidenza non attendibile, non come istruzioni
  per l'agente in background.
- Skill Workshop analizza il contenuto delle proposte e rifiuta le credenziali letterali
  riconosciute prima che lo stato della proposta venga scritto.

Continuano ad applicarsi i normali limiti del Workshop, inclusi `maxPending`, `maxSkillBytes`,
le restrizioni sui file di supporto, i controlli dello scanner e le scritture limitate allo spazio di lavoro. L'impostazione
`approvalPolicy: "auto"` non concede al revisore in background l'accesso
alle azioni del ciclo di vita.

## Esaminare le proposte apprese

L'autoapprendimento produce le stesse proposte in sospeso dell'uso manuale del Workshop.
Esaminarle prima di applicarle:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Rivedere, rifiutare o mettere in quarantena le proposte utili ma non ancora pronte:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Troppo specifica"
openclaw skills workshop quarantine <proposal-id> --reason "Richiede una revisione della sicurezza"
```

L'applicazione è l'unica operazione che scrive una `SKILL.md` attiva. Consultare
[Skill Workshop](/it/tools/skill-workshop) per il ciclo di vita completo e il modello
di archiviazione.

## Configurazione

| Impostazione                                | Valore predefinito | Effetto sull'autoapprendimento                                                                                                    |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Abilita l'acquisizione diretta delle correzioni e la revisione ritardata dell'esperienza.                                          |
| `skills.workshop.approvalPolicy`           | `"auto"` | Controlla le richieste di approvazione per le normali azioni del ciclo di vita avviate dall'agente; non amplia le autorizzazioni del revisore in background. |
| `skills.workshop.maxPending`               | `50`     | Limita le proposte in sospeso e in quarantena per spazio di lavoro.                                                               |
| `skills.workshop.maxSkillBytes`            | `40000`  | Limita la dimensione del corpo della proposta in byte.                                                                            |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Influisce solo sul comportamento di applicazione; l'autoapprendimento scrive lo stato della proposta, non le destinazioni delle skill attive. |

Per lo schema completo, gli intervalli e le relative impostazioni delle skill, consultare
[Configurazione delle skill](/it/tools/skills-config#workshop-skills-workshop).

## Risoluzione dei problemi

### Non appare alcuna proposta dopo un turno lungo

Verificare quanto segue:

1. `skills.workshop.autonomous.enabled` è `true` nella configurazione attiva del Gateway.
2. Il turno è riuscito e ha incluso almeno dieci iterazioni del modello dopo il
   messaggio utente più recente.
3. La conversazione era una normale esecuzione in primo piano, non un'esecuzione pianificata, di memoria,
   hook o subagente.
4. L'esecuzione originale aveva accesso a `skill_workshop` e non era in sandbox.
5. Il sistema è rimasto inattivo abbastanza a lungo per la revisione ritardata.
6. Il processo Gateway di lunga durata è rimasto attivo per tutta la finestra di inattività; un
   comando locale monouso non attende la revisione ritardata.

Una revisione idonea potrebbe comunque non produrre alcuna proposta. L'astensione è il risultato
previsto quando le evidenze non superano i criteri richiesti per una procedura riutilizzabile.

### Doctor segnala che lo strumento Workshop è nascosto

Quando l'autoapprendimento è abilitato, `openclaw doctor` verifica se la policy effettiva
degli strumenti dell'agente predefinito consente `skill_workshop`. Applicare la modifica
`tools.allow` o `tools.alsoAllow` segnalata oppure disabilitare l'autoapprendimento.

### Appaiono troppe proposte di scarso valore

Disabilitare l'autoapprendimento e continuare a utilizzare `/learn` o richieste esplicite al Workshop:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Le proposte in sospeso rimangono esaminabili dopo la disabilitazione della funzionalità. La disabilitazione
dell'autoapprendimento non le applica, rifiuta o elimina.

## Contenuti correlati

- [Skill Workshop](/it/tools/skill-workshop) per la revisione, l'approvazione e
  l'archiviazione delle proposte
- [Creazione delle Skills](/it/tools/creating-skills) per le Skills create manualmente e
  la struttura `SKILL.md`
- [Configurazione delle Skills](/it/tools/skills-config) per tutte le impostazioni di `skills.*`
- [CLI delle Skills](/it/cli/skills) per i comandi Workshop e del curatore
