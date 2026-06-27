---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa si rompe dopo un aggiornamento
summary: Aggiornare OpenClaw in sicurezza (installazione globale o da sorgente), più strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-06-27T17:41:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tipo di installazione (npm o git), recupera la versione più recente, esegue `openclaw doctor` e riavvia il Gateway.

```bash
openclaw update
```

Per cambiare canale o puntare a una versione specifica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` non accetta `--verbose`. Per la diagnostica dell'aggiornamento, usa `--dry-run` per visualizzare in anteprima le azioni pianificate, `--json` per risultati strutturati oppure `openclaw update status --json` per ispezionare lo stato del canale e della disponibilità. L'installer ha il proprio flag `--verbose`, ma quel flag non fa parte di `openclaw update`.

`--channel beta` preferisce beta, ma il runtime ripiega su stable/latest quando il tag beta manca o è precedente all'ultima release stabile. Usa `--tag beta` se vuoi il dist-tag beta npm grezzo per un aggiornamento di pacchetto una tantum.

Usa `--channel dev` per un checkout GitHub `main` mobile e persistente. Per gli aggiornamenti dei pacchetti, `--tag main` viene mappato a `github:openclaw/openclaw#main` per una sola esecuzione, e le specifiche sorgente GitHub/git vengono impacchettate in un tarball temporaneo prima dell'installazione npm staged.

Per i Plugin gestiti, il fallback del canale beta è un avviso: l'aggiornamento core può comunque riuscire mentre un Plugin usa la sua release predefinita/latest registrata perché non è disponibile alcuna beta del Plugin.

Vedi [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Passare tra installazioni npm e git

Usa i canali quando vuoi cambiare il tipo di installazione. L'updater mantiene stato, configurazione, credenziali e workspace in `~/.openclaw`; cambia solo quale installazione del codice OpenClaw usano la CLI e il Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Esegui prima con `--dry-run` per visualizzare in anteprima il cambio esatto della modalità di installazione:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Il canale `dev` assicura un checkout git, lo compila e installa la CLI globale da quel checkout. I canali `stable` e `beta` usano installazioni da pacchetto. Se il Gateway è già installato, `openclaw update` aggiorna i metadati del servizio e lo riavvia, a meno che tu non passi `--no-restart`.

Per installazioni da pacchetto con un servizio Gateway gestito, `openclaw update` punta alla radice del pacchetto usata da quel servizio. Se il comando shell `openclaw` proviene da un'installazione diversa, l'updater stampa entrambe le radici e il percorso Node del servizio gestito. L'aggiornamento del pacchetto usa il package manager proprietario della radice del servizio e verifica il Node del servizio gestito rispetto al motore della release di destinazione prima di sostituire il pacchetto.

## Alternativa: rieseguire l'installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per forzare un tipo di installazione specifico tramite l'installer, passa `--install-method git --no-onboard` o `--install-method npm --no-onboard`.

Se `openclaw update` fallisce dopo la fase di installazione del pacchetto npm, riesegui l'installer. L'installer non chiama il vecchio updater; esegue direttamente l'installazione del pacchetto globale e può ripristinare un'installazione npm parzialmente aggiornata.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Per fissare il ripristino a una versione o a un dist-tag specifico, aggiungi `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manuale

```bash
npm i -g openclaw@latest
```

Preferisci `openclaw update` per installazioni supervisionate perché può coordinare lo scambio del pacchetto con il servizio Gateway in esecuzione. Se aggiorni manualmente un'installazione supervisionata, arresta il Gateway gestito prima che il package manager parta. I package manager sostituiscono i file sul posto, e un Gateway in esecuzione potrebbe altrimenti provare a caricare file core o Plugin mentre l'albero dei pacchetti è temporaneamente sostituito solo a metà. Riavvia il Gateway dopo che il package manager ha terminato, così il servizio rileva la nuova installazione.

Per un'installazione globale di sistema Linux di proprietà root, se `openclaw update` fallisce con `EACCES` e recuperi con npm di sistema, mantieni il Gateway arrestato durante la sostituzione manuale del pacchetto. Usa gli stessi flag di profilo `openclaw` o lo stesso ambiente che usi normalmente per quel Gateway. Sostituisci `/usr/bin/npm` con l'npm di sistema che possiede il prefisso globale di proprietà root sul tuo host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Poi verifica il servizio:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Quando `openclaw update` gestisce un'installazione npm globale, installa prima la destinazione in un prefisso npm temporaneo, verifica l'inventario `dist` del pacchetto e poi scambia l'albero dei pacchetti pulito nel prefisso globale reale. Questo evita che npm sovrapponga un nuovo pacchetto a file obsoleti del vecchio pacchetto. Se il comando di installazione fallisce, OpenClaw riprova una volta con `--omit=optional`. Quel tentativo aiuta gli host in cui le dipendenze opzionali native non possono essere compilate, mantenendo visibile l'errore originale se anche il fallback fallisce.

I comandi di aggiornamento npm e di aggiornamento Plugin gestiti da OpenClaw cancellano anche la quarantena npm `min-release-age` per il processo npm figlio. npm può riportare quella policy come soglia derivata `before`; entrambe sono utili per policy generali di quarantena della supply chain, ma un aggiornamento OpenClaw esplicito significa "installa ora la release OpenClaw selezionata."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Argomenti avanzati sull'installazione npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw tratta le installazioni globali pacchettizzate come di sola lettura a runtime, anche quando la directory globale del pacchetto è scrivibile dall'utente corrente. Le installazioni dei pacchetti Plugin risiedono in radici npm/git di proprietà OpenClaw sotto la directory di configurazione dell'utente, e l'avvio del Gateway non modifica l'albero dei pacchetti OpenClaw.

    Alcune configurazioni npm Linux installano i pacchetti globali sotto directory di proprietà root, come `/usr/lib/node_modules/openclaw`. OpenClaw supporta questo layout perché i comandi di installazione/aggiornamento dei Plugin scrivono fuori da quella directory globale del pacchetto.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Concedi a OpenClaw accesso in scrittura alle sue radici di configurazione/stato, così le installazioni esplicite dei Plugin, gli aggiornamenti dei Plugin e la pulizia di doctor possono rendere persistenti le loro modifiche:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Prima degli aggiornamenti dei pacchetti e delle installazioni esplicite dei Plugin, OpenClaw prova a eseguire un controllo best-effort dello spazio su disco per il volume di destinazione. Lo spazio insufficiente produce un avviso con il percorso controllato, ma non blocca l'aggiornamento perché quote del filesystem, snapshot e volumi di rete possono cambiare dopo il controllo. L'installazione effettiva tramite package manager e la verifica post-installazione restano autorevoli.
  </Accordion>
</AccordionGroup>

## Aggiornamento automatico

L'aggiornamento automatico è disattivato per impostazione predefinita. Abilitalo in `~/.openclaw/openclaw.json`:

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

| Canale   | Comportamento                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rollout distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                       |
| `dev`    | Nessuna applicazione automatica. Usa manualmente `openclaw update`.                                             |

Il Gateway registra anche un suggerimento di aggiornamento all'avvio (disabilitalo con `update.checkOnStart: false`).
Per downgrade o ripristino da incidente, imposta `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. I suggerimenti di aggiornamento all'avvio possono comunque essere eseguiti, a meno che anche `update.checkOnStart` non sia disabilitato.

Gli aggiornamenti del package manager richiesti tramite l'handler live del control plane Gateway non sostituiscono l'albero dei pacchetti dentro il processo Gateway in esecuzione. Nelle installazioni con servizio gestito, il Gateway avvia un handoff separato, esce e lascia che il normale percorso CLI `openclaw update --yes --json` arresti il servizio, sostituisca il pacchetto, aggiorni i metadati del servizio, riavvii, verifichi la versione e la raggiungibilità del Gateway e recuperi un LaunchAgent macOS installato ma non caricato quando possibile. Se il Gateway non può effettuare quell'handoff in modo sicuro, `update.run` riporta un comando shell sicuro invece di eseguire il package manager nel processo.

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, verifica le policy DM e controlla la salute del Gateway. Dettagli: [Doctor](/it/gateway/doctor)

### Riavvia il Gateway

```bash
openclaw gateway restart
```

### Verifica

```bash
openclaw health
```

</Steps>

## Rollback

### Fissare una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra la versione pubblicata corrente.
</Tip>

### Fissare un commit (sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare all'ultima versione: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` su checkout sorgente, l'updater inizializza automaticamente `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (o riabilita `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di salute dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione delle versioni principali.
