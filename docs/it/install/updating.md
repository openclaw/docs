---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa smette di funzionare dopo un aggiornamento
summary: Aggiornamento sicuro di OpenClaw (installazione globale o da sorgente) e strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-07-12T07:10:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Mantieni OpenClaw aggiornato.

Per la sostituzione delle immagini Docker, Podman e Kubernetes, consulta
[Aggiornamento delle immagini dei container](/it/install/docker#upgrading-container-images). Il
Gateway esegue operazioni di aggiornamento sicure all'avvio prima di risultare pronto e termina se
lo stato montato richiede una riparazione manuale.

## Consigliato: `openclaw update`

Rileva il tipo di installazione (npm o git), recupera la versione più recente, esegue `openclaw doctor` e riavvia il Gateway.

```bash
openclaw update
```

Cambia canale o seleziona una versione specifica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # anteprima senza applicare
```

`openclaw update` non dispone dell'opzione `--verbose` (il programma di installazione sì). Per la diagnostica, usa
`--dry-run` per visualizzare in anteprima le azioni pianificate, `--json` per ottenere risultati strutturati oppure
`openclaw update status --json` per esaminare lo stato del canale e della disponibilità.

`--channel beta` preferisce il dist-tag beta di npm, ma ripiega su stable/latest
quando il tag beta non è presente o la relativa versione è precedente all'ultima versione
stabile. Usa invece `--tag beta` per un aggiornamento una tantum del pacchetto vincolato al dist-tag
beta grezzo di npm.

`--channel extended-stable` è disponibile solo per i pacchetti e l'installazione rimane
eseguibile solo in primo piano. OpenClaw legge il selettore pubblico npm `extended-stable`,
verifica esattamente il pacchetto selezionato e installa quella versione precisa. Se i dati
del registro sono mancanti o incoerenti, l'operazione termina in modo sicuro; non ripiega mai su `latest`.
Se la versione selezionata è precedente a quella installata, si applica comunque la normale
conferma del downgrade. La CLI memorizza il canale dopo un
aggiornamento del nucleo riuscito; un comando diretto `npm install -g openclaw@extended-stable`
non aggiorna `update.channel`.
Dopo la sostituzione del nucleo, i Plugin npm ufficiali idonei con intento
predefinito/non specificato o `latest` convergono esattamente a quella versione del nucleo. I vincoli esatti e i tag
espliciti diversi da `latest`, i Plugin di terze parti e le origini diverse da npm rimangono invariati.
Le installazioni da catalogo create dalle versioni correnti di OpenClaw mantengono tale intento
predefinito. I record meno recenti che contengono solo una versione esatta rimangono vincolati perché
OpenClaw non può distinguere in modo sicuro un vecchio vincolo automatico da uno impostato dall'utente; esegui
una volta `openclaw plugins update @openclaw/name` sul canale extended-stable
per riattivare per quel Plugin il monitoraggio della versione esatta del nucleo.

`--channel dev` fornisce un checkout persistente e mobile del ramo GitHub `main`. Per un aggiornamento
una tantum del pacchetto, `--tag main` corrisponde alla specifica del pacchetto
`github:openclaw/openclaw#main` e lo installa direttamente tramite il gestore di pacchetti di destinazione (npm/pnpm/bun).

Per i Plugin gestiti, l'assenza di una versione beta genera un avviso, non un errore:
l'aggiornamento del nucleo può comunque riuscire mentre un Plugin ripiega sulla propria versione
predefinita/latest registrata.

Consulta [Canali di rilascio](/it/install/development-channels) per la semantica dei canali.

## Passaggio tra installazioni npm e git

Usa i canali per cambiare il tipo di installazione. Il programma di aggiornamento conserva stato, configurazione,
credenziali e area di lavoro in `~/.openclaw`; cambia soltanto l'installazione del codice OpenClaw
usata dalla CLI e dal Gateway.

```bash
# installazione da pacchetto npm -> checkout git modificabile
openclaw update --channel dev

# checkout git -> installazione da pacchetto npm
openclaw update --channel stable
```

Visualizza prima un'anteprima del cambio della modalità di installazione:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantisce la presenza di un checkout git, lo compila e installa la CLI globale da tale
checkout. I canali `stable`, `extended-stable` e `beta` usano installazioni da
pacchetto. Extended-stable viene rifiutato su un checkout git senza modificarlo né
convertirlo. Se il Gateway è già installato, `openclaw update` aggiorna
i metadati del servizio e lo riavvia, a meno che non venga specificato `--no-restart`.

Per le installazioni da pacchetto con un servizio Gateway gestito, `openclaw update` usa come destinazione
la radice del pacchetto utilizzata da tale servizio. Se il comando della shell `openclaw` proviene
da un'altra installazione, il programma di aggiornamento mostra entrambe le radici e il percorso di Node
del servizio gestito, quindi verifica tale versione di Node rispetto al requisito
`engines.node` della versione di destinazione prima di sostituire il pacchetto.

## Alternativa: rieseguire il programma di installazione

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare la configurazione iniziale. Per imporre un tipo di installazione specifico, passa
`--install-method git --no-onboard` oppure `--install-method npm --no-onboard`.

Se `openclaw update` non riesce dopo la fase di installazione del pacchetto npm, riesegui invece il
programma di installazione. Questo non richiama il programma di aggiornamento; esegue direttamente l'installazione
globale del pacchetto e può ripristinare un'installazione npm aggiornata solo parzialmente.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Vincola il ripristino a una versione o a un dist-tag specifico con `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manualmente

```bash
npm i -g openclaw@latest
```

Preferisci `openclaw update` per le installazioni supervisionate: può coordinare la sostituzione del pacchetto
con il servizio Gateway in esecuzione. Se esegui un aggiornamento manuale su un'installazione supervisionata,
arresta prima il Gateway gestito. I gestori di pacchetti sostituiscono i file
sul posto e, in caso contrario, un Gateway in esecuzione potrebbe tentare di caricare file del nucleo o dei Plugin
durante la sostituzione. Riavvia il Gateway al termine dell'operazione del gestore di pacchetti affinché utilizzi
la nuova installazione.

Per un'installazione globale di sistema Linux di proprietà di root, se `openclaw update` non riesce con
`EACCES`, esegui il ripristino con npm di sistema mantenendo il Gateway arrestato durante la
sostituzione manuale. Usa le stesse opzioni di profilo/variabili d'ambiente che usi normalmente per
quel Gateway. Sostituisci `/usr/bin/npm` con l'eseguibile npm di sistema che gestisce il
prefisso globale di proprietà di root sull'host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Quindi verifica:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Quando `openclaw update` gestisce un'installazione npm globale, installa prima la destinazione
in un prefisso npm temporaneo, verifica l'inventario `dist` del pacchetto, quindi
sostituisce l'albero pulito del pacchetto nel prefisso globale effettivo, evitando che npm
sovrapponga un nuovo pacchetto ai file obsoleti di quello precedente. Se il comando di installazione
non riesce, OpenClaw riprova una volta con `--omit=optional`, soluzione utile sugli host
in cui le dipendenze native facoltative non possono essere compilate.

I comandi di aggiornamento npm e di aggiornamento dei Plugin gestiti da OpenClaw disattivano inoltre la
quarantena della catena di fornitura `min-release-age` di npm (o la precedente chiave di configurazione `before`)
per il processo npm figlio. Tale criterio offre una protezione generale, ma un
aggiornamento esplicito di OpenClaw significa «installa ora la versione selezionata».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Argomenti avanzati sull'installazione npm

<AccordionGroup>
  <Accordion title="Albero dei pacchetti di sola lettura">
    OpenClaw considera le installazioni globali da pacchetto come di sola lettura durante l'esecuzione, anche quando la directory globale dei pacchetti è scrivibile dall'utente corrente. Le installazioni dei pacchetti dei Plugin risiedono nelle radici npm/git di proprietà di OpenClaw all'interno della directory di configurazione dell'utente e l'avvio del Gateway non modifica l'albero dei pacchetti di OpenClaw.

    Alcune configurazioni npm su Linux installano i pacchetti globali in directory di proprietà di root, come `/usr/lib/node_modules/openclaw`. OpenClaw supporta questa disposizione perché i comandi di installazione e aggiornamento dei Plugin scrivono al di fuori di tale directory globale dei pacchetti.

  </Accordion>
  <Accordion title="Unità systemd con sicurezza rafforzata">
    Concedi a OpenClaw l'accesso in scrittura alle proprie radici di configurazione/stato, affinché le installazioni esplicite dei Plugin, gli aggiornamenti dei Plugin e la pulizia eseguita da doctor possano rendere persistenti le modifiche:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Controllo preliminare dello spazio su disco">
    Prima degli aggiornamenti dei pacchetti e delle installazioni esplicite dei Plugin, OpenClaw tenta di eseguire, senza garanzia di riuscita, un controllo dello spazio su disco per il volume di destinazione. Se lo spazio è insufficiente, viene generato un avviso con il percorso controllato, ma l'aggiornamento non viene bloccato perché le quote del file system, gli snapshot e i volumi di rete possono cambiare dopo il controllo. L'installazione effettiva tramite il gestore di pacchetti e la verifica successiva all'installazione restano determinanti.
  </Accordion>
</AccordionGroup>

## Aggiornamento automatico

Disattivato per impostazione predefinita. Abilitalo in `~/.openclaw/openclaw.json`:

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

| Canale            | Comportamento                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Attende `stableDelayHours` (valore predefinito: 6), quindi applica l'aggiornamento con una variazione deterministica nell'arco di `stableJitterHours` (valore predefinito: 12) per una distribuzione graduale. |
| `extended-stable` | Verifica la presenza di un'indicazione di aggiornamento di sola lettura all'avvio e ogni 24 ore quando `checkOnStart` è abilitato. Non applica mai automaticamente l'aggiornamento.                 |
| `beta`            | Verifica ogni `betaCheckIntervalHours` (valore predefinito: 1) e applica immediatamente l'aggiornamento.                                                                                  |
| `dev`             | Nessuna applicazione automatica. Usa manualmente `openclaw update`.                                                                                                                      |

Il Gateway registra inoltre un'indicazione di aggiornamento all'avvio (disattivabile con
`update.checkOnStart: false`). Le selezioni extended-stable memorizzate usano questo
percorso di indicazione di sola lettura e l'intervallo esistente di 24 ore, ma non richiamano mai
l'installazione automatica, il passaggio di controllo, il riavvio, il ritardo/la variazione stable o il polling beta.
Per eseguire un downgrade o il ripristino in seguito a un incidente, imposta `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. Le indicazioni di aggiornamento all'avvio possono comunque essere eseguite, a meno che non venga disabilitato anche `update.checkOnStart`.

Gli aggiornamenti tramite gestore di pacchetti richiesti attraverso il piano di controllo del Gateway attivo
(`update.run`) non sostituiscono l'albero dei pacchetti all'interno del processo Gateway in esecuzione.
Nelle installazioni come servizio gestito, il Gateway avvia un passaggio di controllo separato,
termina e consente al normale percorso CLI `openclaw update --yes --json` di arrestare il
servizio, sostituire il pacchetto, aggiornare i metadati del servizio, riavviare, verificare la
versione e la raggiungibilità del Gateway e, quando possibile, ripristinare un LaunchAgent macOS
installato ma non caricato. Se il Gateway non può eseguire tale passaggio di controllo in sicurezza,
`update.run` restituisce un comando shell sicuro anziché eseguire il gestore di
pacchetti all'interno del processo.

La scheda di aggiornamento nella barra laterale della Control UI avvia lo stesso flusso `update.run`. Nell'app
macOS firmata, la scheda aggiorna prima l'app tramite Sparkle; dopo il riavvio,
l'app porta il Gateway locale gestito alla versione corrispondente.

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, verifica i criteri dei messaggi diretti e controlla lo stato del Gateway. Dettagli: [Doctor](/it/gateway/doctor)

### Riavvia il Gateway

```bash
openclaw gateway restart
```

### Verifica

```bash
openclaw health
```

</Steps>

## Ripristino

### Vincola una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra la versione attualmente pubblicata.
</Tip>

### Vincola un commit (codice sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare alla versione più recente: `git checkout main && git pull`.

## In caso di problemi

- Esegui nuovamente `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` nei checkout del codice sorgente, il programma di aggiornamento inizializza automaticamente `pnpm` quando necessario. Se viene visualizzato un errore di inizializzazione di pnpm/corepack, installa `pnpm` manualmente (oppure riabilita `corepack`) e riesegui l'aggiornamento.
- Consulta: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di integrità dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione tra versioni principali.
