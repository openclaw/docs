---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa non funziona dopo un aggiornamento
summary: Aggiornamento sicuro di OpenClaw (installazione globale o da sorgente) e strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-07-16T14:32:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Mantieni OpenClaw aggiornato.

Per la sostituzione delle immagini di Docker, Podman e Kubernetes, consulta
[Aggiornamento delle immagini dei container](/it/install/docker#upgrading-container-images). Il
Gateway esegue le operazioni di aggiornamento sicure all'avvio prima di dichiararsi pronto e si arresta se lo
stato montato richiede una riparazione manuale.

## Consigliato: `openclaw update`

Rileva il tipo di installazione (npm, pnpm, Bun o git), recupera la versione più recente, esegue `openclaw doctor` e riavvia il Gateway.

```bash
openclaw update
```

Per cambiare canale o scegliere una versione specifica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # anteprima senza applicare modifiche
```

`openclaw update` non dispone del flag `--verbose` (il programma di installazione sì). Per la diagnostica, utilizzare
`--dry-run` per visualizzare in anteprima le azioni pianificate, `--json` per ottenere risultati strutturati oppure
`openclaw update status --json` per esaminare lo stato del canale e della disponibilità.

`--channel beta` preferisce il dist-tag npm beta, ma ripiega su stable/latest
quando il tag beta non è presente o la relativa versione è precedente all'ultima versione
stabile. Per un aggiornamento occasionale del pacchetto vincolato direttamente al dist-tag
npm beta, utilizzare invece `--tag beta`.

`--channel extended-stable` riguarda solo il pacchetto e l'installazione rimane
esclusivamente in primo piano. OpenClaw legge il selettore pubblico npm `extended-stable`,
verifica l'esatto pacchetto selezionato e installa quella versione precisa. Dati del
registro mancanti o incoerenti provocano un arresto sicuro; non viene mai usato `latest` come ripiego.
Se la versione selezionata è precedente a quella installata, si applica comunque la normale
conferma del downgrade. La CLI rende persistente il canale dopo un
aggiornamento del core riuscito; un comando diretto `npm install -g openclaw@extended-stable`
non aggiorna `update.channel`.
Dopo la sostituzione del core, i Plugin npm ufficiali idonei con intento predefinito/non specificato o
`latest` convergono esattamente alla versione del core. I vincoli esatti e i tag espliciti
diversi da `latest`, i Plugin di terze parti e le fonti non npm rimangono invariati.
Le installazioni dal catalogo create dalle versioni correnti di OpenClaw mantengono tale intento
predefinito. I record meno recenti che contengono soltanto una versione esatta rimangono vincolati perché
OpenClaw non può distinguere in modo sicuro un vecchio vincolo automatico da uno impostato dall'utente; eseguire
`openclaw plugins update @openclaw/name` una volta sul canale extended-stable
per riattivare per quel Plugin il monitoraggio esatto della versione del core.

`--channel dev` fornisce un checkout GitHub `main` mobile e persistente. Per un aggiornamento
occasionale del pacchetto, `--tag main` viene associato alla specifica del pacchetto
`github:openclaw/openclaw#main` e installato direttamente tramite il gestore di pacchetti di destinazione (npm/pnpm/bun).

Per i Plugin gestiti, l'assenza di una versione beta genera un avviso, non un errore:
l'aggiornamento del core può comunque riuscire mentre un Plugin ripiega sulla propria
versione predefinita/più recente registrata.

Per la semantica dei canali, consulta [Canali di rilascio](/it/install/development-channels).

## Passare tra installazioni npm e git

Utilizzare i canali per modificare il tipo di installazione. Il programma di aggiornamento conserva stato, configurazione,
credenziali e spazio di lavoro in `~/.openclaw`; cambia soltanto l'installazione
del codice OpenClaw utilizzata dalla CLI e dal Gateway.

```bash
# installazione del pacchetto npm -> checkout git modificabile
openclaw update --channel dev

# checkout git -> installazione del pacchetto npm
openclaw update --channel stable
```

Visualizzare prima in anteprima il cambio della modalità di installazione:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantisce la presenza di un checkout git, lo compila e installa la CLI globale da tale
checkout. I canali `stable`, `extended-stable` e `beta` utilizzano installazioni da
pacchetto. Extended-stable viene rifiutato su un checkout git senza modificarlo né
convertirlo. Se il Gateway è già installato, `openclaw update` aggiorna
i metadati del servizio e lo riavvia, a meno che non venga passato `--no-restart`.

Per le installazioni da pacchetto con un servizio Gateway gestito, `openclaw update` usa come destinazione
la radice del pacchetto utilizzata da tale servizio. Se il comando di shell `openclaw` proviene
da un'installazione diversa, il programma di aggiornamento mostra entrambe le radici e il percorso di Node
del servizio gestito, quindi verifica tale versione di Node rispetto al requisito
`engines.node` della versione di destinazione prima di sostituire il pacchetto.

## Alternativa: eseguire nuovamente il programma di installazione

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungere `--no-onboard` per saltare l'onboarding. Per imporre un tipo di installazione specifico, passare
`--install-method git --no-onboard` oppure `--install-method npm --no-onboard`.

Se `openclaw update` non riesce dopo la fase di installazione del pacchetto npm, eseguire nuovamente il
programma di installazione. Non richiama il programma di aggiornamento; esegue direttamente
l'installazione globale del pacchetto e può ripristinare un'installazione npm aggiornata solo parzialmente.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Per vincolare il ripristino a una versione o a un dist-tag specifico, utilizzare `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manualmente

```bash
npm i -g openclaw@latest
```

Per le installazioni supervisionate, preferire `openclaw update`: può coordinare la sostituzione del pacchetto
con il servizio Gateway in esecuzione. Se un'installazione supervisionata viene aggiornata manualmente,
arrestare prima il Gateway gestito. I gestori di pacchetti sostituiscono i file
direttamente e, in caso contrario, un Gateway in esecuzione potrebbe tentare di caricare file del core o dei Plugin
durante la sostituzione. Riavviare il Gateway al termine dell'operazione del gestore di pacchetti affinché utilizzi
la nuova installazione.

Per un'installazione globale di sistema Linux di proprietà di root, se `openclaw update` non riesce con
`EACCES`, eseguire il ripristino con npm di sistema mantenendo il Gateway arrestato durante la
sostituzione manuale. Utilizzare gli stessi flag di profilo o le stesse variabili d'ambiente normalmente impiegati per
quel Gateway. Sostituire `/usr/bin/npm` con l'npm di sistema che gestisce il
prefisso globale di proprietà di root sull'host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Quindi verificare:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Quando `openclaw update` gestisce un'installazione npm globale, installa prima la destinazione
in un prefisso npm temporaneo. Il pacchetto candidato convalida la versione di Node
dell'host durante `preinstall`; solo successivamente OpenClaw verifica l'inventario
`dist` del pacchetto e sostituisce l'albero pulito del pacchetto nel prefisso globale effettivo. Una
protezione di completamento inclusa nel pacchetto viene omessa dall'inventario previsto e rimossa soltanto
dopo il completamento riuscito di `preinstall`, pertanto anche gli script del ciclo di vita ignorati provocano un errore prima della
sostituzione. Con npm 12 e versioni successive, il programma di aggiornamento approva soltanto il ciclo di vita
del pacchetto OpenClaw candidato; gli script delle dipendenze transitive rimangono bloccati. In questo modo si evita che npm
sovrapponga un nuovo pacchetto ai file obsoleti di quello precedente. Se il comando di installazione
non riesce, OpenClaw riprova una volta con `--omit=optional`, utile sugli host
in cui non è possibile compilare le dipendenze native facoltative.

I comandi di aggiornamento npm e di aggiornamento dei Plugin gestiti da OpenClaw disattivano inoltre, per il
processo npm figlio, la quarantena della catena di fornitura `min-release-age` di npm (o la precedente chiave
di configurazione `before`). Tale criterio offre una protezione generale, ma un
aggiornamento esplicito di OpenClaw significa «installare subito la versione selezionata».

```bash
pnpm add -g openclaw@latest
```

Se pnpm 11 ha installato OpenClaw 2026.7.1, eseguire una volta tale comando manuale. Quella
versione è precedente al layout isolato dei pacchetti globali di pnpm 11, pertanto il relativo programma di aggiornamento potrebbe
confondere un'altra installazione npm con la CLI in esecuzione. Le versioni successive mantengono
la proprietà di pnpm e seguono la radice del pacchetto sostitutivo durante gli aggiornamenti. Utilizzano
inoltre la directory bin globale dichiarata dal gestore proprietario e si arrestano prima
di apportare modifiche quando il comando pnpm disponibile indica un'altra radice globale o versione principale,
oppure quando il pacchetto invocante è orfano o non è l'unica installazione OpenClaw
attiva in tale posizione.

Se OpenClaw condivide un gruppo di installazione globale di pnpm 11 con un altro pacchetto, il
programma di aggiornamento automatico si arresta prima di modificare il gruppo. Aggiornare manualmente il
gruppo originale separato da virgole, in modo che i pacchetti associati e i criteri di compilazione rimangano
intatti.

```bash
bun add -g openclaw@latest
```

### Argomenti avanzati per l'installazione npm

<AccordionGroup>
  <Accordion title="Albero dei pacchetti di sola lettura">
    OpenClaw considera le installazioni globali da pacchetto di sola lettura durante l'esecuzione, anche quando la directory globale dei pacchetti è scrivibile dall'utente corrente. Le installazioni dei pacchetti dei Plugin si trovano nelle radici npm/git di proprietà di OpenClaw all'interno della directory di configurazione dell'utente e l'avvio del Gateway non modifica l'albero dei pacchetti OpenClaw.

    Alcune configurazioni npm su Linux installano i pacchetti globali in directory di proprietà di root, come `/usr/lib/node_modules/openclaw`. OpenClaw supporta tale layout perché i comandi di installazione e aggiornamento dei Plugin scrivono all'esterno di quella directory globale dei pacchetti.

  </Accordion>
  <Accordion title="Unità systemd rafforzate">
    Concedere a OpenClaw l'accesso in scrittura alle proprie radici di configurazione e stato, affinché le installazioni esplicite dei Plugin, gli aggiornamenti dei Plugin e la pulizia eseguita da doctor possano rendere persistenti le modifiche:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Controllo preliminare dello spazio su disco">
    Prima degli aggiornamenti dei pacchetti e delle installazioni esplicite dei Plugin, OpenClaw tenta di eseguire un controllo non vincolante dello spazio su disco per il volume di destinazione. Se lo spazio è insufficiente, viene generato un avviso con il percorso controllato, ma l'aggiornamento non viene bloccato perché quote del file system, snapshot e volumi di rete possono cambiare dopo il controllo. L'installazione effettiva tramite il gestore di pacchetti e la verifica successiva all'installazione rimangono definitive.
  </Accordion>
</AccordionGroup>

## Programma di aggiornamento automatico

Disattivato per impostazione predefinita. Attivarlo in `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canale            | Comportamento                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Attende `stableDelayHours` (valore predefinito: 6), quindi applica l'aggiornamento con una variazione deterministica nell'intervallo `stableJitterHours` (valore predefinito: 12) per una distribuzione graduale. |
| `extended-stable` | Controlla la presenza di un avviso di aggiornamento di sola lettura all'avvio e ogni 24 ore quando `checkOnStart` è attivato. Non applica mai l'aggiornamento automaticamente. |
| `beta`            | Esegue il controllo ogni `betaCheckIntervalHours` (valore predefinito: 1) e applica immediatamente l'aggiornamento.                                  |
| `dev`             | Nessuna applicazione automatica. Utilizzare `openclaw update` manualmente.                                                                   |

Il Gateway registra inoltre un avviso di aggiornamento all'avvio (disattivabile con
`update.checkOnStart: false`). Le selezioni extended-stable memorizzate utilizzano questo
percorso di avviso di sola lettura e l'intervallo di avviso esistente di 24 ore, ma non avviano mai
l'installazione automatica, il passaggio di consegne, il riavvio, il ritardo o la variazione del canale stable né il polling del canale beta.
Per eseguire un downgrade o il ripristino in seguito a un incidente, impostare `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. Gli avvisi di aggiornamento all'avvio possono comunque essere eseguiti, a meno che non venga disattivato anche `update.checkOnStart`.

Gli aggiornamenti del gestore di pacchetti richiesti tramite il piano di controllo del Gateway attivo
(`update.run`) non sostituiscono l'albero dei pacchetti all'interno del processo Gateway
in esecuzione. Nelle installazioni con servizio gestito, il Gateway avvia un passaggio di consegne separato,
si arresta e consente al normale percorso CLI `openclaw update --yes --json` di arrestare il
servizio, sostituire il pacchetto, aggiornare i metadati del servizio, riavviare, verificare la
versione e la raggiungibilità del Gateway e, quando possibile, ripristinare un LaunchAgent macOS
installato ma non caricato. Se il Gateway non può eseguire tale passaggio in sicurezza,
`update.run` restituisce un comando shell sicuro invece di eseguire il gestore di
pacchetti all'interno del processo.

La scheda di aggiornamento nella barra laterale della Control UI mostra **Aggiorna il Gateway** quando avvierà
direttamente questo flusso `update.run`. Ciò si applica alla Control UI ospitata nel browser, ai Gateway
remoti e ai Gateway locali gestiti manualmente.

Nell'app macOS firmata, per un Gateway locale gestito dall'app la scheda cambia in
**Aggiorna l'app Mac + il Gateway**. Sparkle aggiorna prima l'app; dopo il riavvio, l'app
esegue `openclaw update --tag <app-version> --json`, riavvia il proprio Gateway
e ne verifica l'integrità in una finestra di avanzamento simile a quella della configurazione. La finestra appare solo
quando il Gateway gestito richiede un aggiornamento, una riparazione o un'installazione; gli aggiornamenti della sola app riavviano
direttamente l'app. I dettagli degli errori rimangono visibili con le azioni Riprova, [Guida all'aggiornamento](/it/install/updating) e
[Discord](https://discord.gg/clawd). L'app non utilizza mai questo percorso coordinato
per un Gateway remoto o gestito esternamente, non esegue mai il downgrade di un Gateway
più recente e non ignora mai il pin del canale `extended-stable`.

Quando l'aggiornamento riesce, l'app accoda un evento di benvenuto una tantum per la
sessione diretta di primo livello più recente con un'interazione reale di un utente o canale. Le esecuzioni Cron,
gli heartbeat e gli aggiornamenti delle sessioni eseguiti solo in background non modificano tale selezione. In
modalità remota, l'app aggiorna solo il runtime del Node Mac locale e invia l'evento
solo quando il Gateway remoto connesso è almeno altrettanto recente quanto l'app.

## Dopo l'aggiornamento

<Steps>

### Eseguire doctor

```bash
openclaw doctor
```

Esegue la migrazione della configurazione, verifica i criteri dei DM e controlla l'integrità del Gateway. Dettagli: [Doctor](/it/gateway/doctor)

### Riavviare il Gateway

```bash
openclaw gateway restart
```

### Verificare

```bash
openclaw health
```

</Steps>

## Rollback

Il rollback prevede due livelli:

1. Reinstallare una versione precedente del codice di OpenClaw mantenendo lo stato corrente.
2. Ripristinare lo stato precedente all'aggiornamento solo quando il codice meno recente non può utilizzare una configurazione
   o un database migrati.

Iniziare con un rollback del solo codice. Il ripristino dello stato elimina le modifiche apportate dopo
il backup.

### Prima dell'aggiornamento: creare un backup verificato

`openclaw update` conserva automaticamente una copia della configurazione precedente all'aggiornamento, ma non
crea un punto di ripristino completo dello stato. Prima di un aggiornamento significativo, crearne uno
esplicitamente:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Il manifesto dell'archivio registra la versione di OpenClaw e i percorsi di origine inclusi
nel backup. L'archivio può contenere credenziali, profili di autenticazione e lo stato dei
canali; pertanto, conservarlo con autorizzazioni riservate esclusivamente al proprietario e con la stessa protezione della
directory dello stato attivo. Consultare [Backup](/it/cli/backup) per i file inclusi e quelli omessi
intenzionalmente.

Per un punto di ripristino identico byte per byte che includa gli artefatti volatili omessi
dall'archivio portabile, arrestare il Gateway e utilizzare uno snapshot del filesystem, del volume o della VM
fornito dalla piattaforma.

### Eseguire il rollback di un'installazione del pacchetto

Elencare le versioni pubblicate, quindi visualizzare l'anteprima e installare la versione nota come funzionante:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` è preferibile rispetto a un'installazione diretta tramite il gestore di pacchetti. Tale comando
rileva il downgrade, richiede conferma, esegue la convergenza gestita dei Plugin
e i controlli di compatibilità rispetto alla destinazione installata, aggiorna i metadati
del servizio, riavvia il Gateway e verifica la versione in esecuzione. Se il canale memorizzato
è `extended-stable`, utilizzare
`--channel stable --tag <known-good-version>`, poiché i tag esatti usati una sola volta non possono
essere combinati con il selettore `extended-stable`.

Gli aggiornamenti dei pacchetti preparano e verificano il candidato prima dell'attivazione. Se lo
scambio nel filesystem o la sostituzione dello shim del comando non riesce, OpenClaw ripristina automaticamente il
pacchetto precedente. Dopo uno scambio riuscito, un successivo errore di integrità del Gateway
segnala la versione precedente e le istruzioni per il rollback manuale anziché
sostituire nuovamente il pacchetto in automatico.

Se il percorso di aggiornamento della CLI non è disponibile, utilizzare lo stesso gestore di pacchetti e lo stesso
ambito di installazione a cui appartiene il Gateway corrente:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Sostituire `npm` con `pnpm` o `bun` quando tale gestore è responsabile dell'installazione. Durante
il ripristino in seguito a un incidente, impedire a un programma di aggiornamento automatico abilitato di applicare immediatamente una
versione più recente impostando `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway.

### Eseguire il rollback di un checkout dei sorgenti

Utilizzare un checkout pulito e selezionare un tag o un commit noto come funzionante:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare alla versione più recente: `git checkout main && git pull`.

Il programma di aggiornamento riporta automaticamente un checkout Git al branch e allo
SHA precedenti quando l'installazione delle dipendenze, la build, la build della UI o doctor non riesce dopo l'avvio di un
aggiornamento Git. Il checkout manuale è comunque necessario quando si sceglie intenzionalmente
un commit meno recente.

### Eseguire il downgrade oltre la migrazione delle sessioni a SQLite

Prima di avviare una versione precedente di OpenClaw basata su file, utilizzare la CLI corrente per
ripristinare gli artefatti archiviati delle trascrizioni legacy:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Questa operazione non elimina i dati SQLite. Le sessioni create dopo la migrazione a SQLite
esistono solo in SQLite e non saranno visibili al runtime precedente. Consultare
[Downgrade dopo la migrazione delle sessioni a SQLite](/it/cli/doctor#downgrading-after-session-sqlite-migration).

### Ripristinare lo stato solo quando necessario

Se il codice precedente non riesce a leggere una configurazione o uno schema di database più recente, arrestare il
Gateway e ripristinare lo snapshot verificato del filesystem, del volume o della VM precedente all'aggiornamento.
Conservare separatamente lo stato corrente prima del ripristino, perché questa operazione elimina
le modifiche apportate dopo lo snapshot.

Gli archivi generali `openclaw backup create` supportano la creazione e la verifica, ma
non l'attivazione diretta dell'intero archivio. Estrarre un archivio generale in una directory
di staging e utilizzare la relativa mappatura da origine ad archivio `manifest.json` per un ripristino
offline. Analogamente, `openclaw backup sqlite restore` scrive un database verificato
in una nuova destinazione; l'attivazione di tale destinazione rimane un'operazione offline esplicita
dell'amministratore.

### Verificare il rollback

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## In caso di problemi

- Eseguire nuovamente `openclaw doctor` e leggere attentamente l'output.
- Per `openclaw update --channel dev` nei checkout dei sorgenti, il programma di aggiornamento configura automaticamente `pnpm` quando necessario. Se viene visualizzato un errore di bootstrap di pnpm/corepack, installare manualmente `pnpm` (oppure riabilitare `corepack`) ed eseguire nuovamente l'aggiornamento.
- Consultare: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedere su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Contenuti correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di integrità dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione tra versioni principali.
