---
read_when:
    - Aggiornare OpenClaw
    - Qualcosa si rompe dopo un aggiornamento
summary: Aggiornare OpenClaw in modo sicuro (installazione globale o da sorgente) e strategia di ripristino
title: Aggiornamento
x-i18n:
    generated_at: "2026-05-04T07:06:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tuo tipo di installazione (npm o git), recupera la versione più recente, esegue `openclaw doctor` e riavvia il Gateway.

```bash
openclaw update
```

Per cambiare canale o puntare a una versione specifica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` non accetta `--verbose`. Per la diagnostica degli aggiornamenti, usa
`--dry-run` per visualizzare in anteprima le azioni pianificate, `--json` per risultati strutturati oppure
`openclaw update status --json` per ispezionare lo stato del canale e della disponibilità. L'
installer ha il proprio flag `--verbose`, ma quel flag non fa parte di
`openclaw update`.

`--channel beta` preferisce beta, ma il runtime ricorre a stable/latest quando
il tag beta manca o è precedente all'ultima release stable. Usa `--tag beta`
se vuoi il dist-tag beta npm grezzo per un aggiornamento di pacchetto una tantum.

Vedi [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Passare tra installazioni npm e git

Usa i canali quando vuoi cambiare il tipo di installazione. L'updater conserva il tuo
stato, la configurazione, le credenziali e il workspace in `~/.openclaw`; cambia solo
quale installazione del codice OpenClaw viene usata dalla CLI e dal Gateway.

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

Il canale `dev` garantisce un checkout git, lo compila e installa la CLI globale
da quel checkout. I canali `stable` e `beta` usano installazioni da pacchetto. Se il
Gateway è già installato, `openclaw update` aggiorna i metadati del servizio
e lo riavvia, a meno che tu non passi `--no-restart`.

## Alternativa: riesegui l'installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per forzare un tipo di installazione specifico tramite
l'installer, passa `--install-method git --no-onboard` oppure
`--install-method npm --no-onboard`.

Se `openclaw update` fallisce dopo la fase di installazione del pacchetto npm, riesegui
l'installer. L'installer non chiama il vecchio updater; esegue direttamente
l'installazione del pacchetto globale e può recuperare un'installazione npm aggiornata parzialmente.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Per fissare il ripristino a una versione o a un dist-tag specifico, aggiungi `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manuali

```bash
npm i -g openclaw@latest
```

Preferisci `openclaw update` per le installazioni supervisionate, perché può coordinare lo
scambio del pacchetto con il servizio Gateway in esecuzione. Se aggiorni manualmente mentre un
Gateway gestito è in esecuzione, riavvia il Gateway subito dopo che il package manager
ha terminato, così il vecchio processo non continua a servire da file di pacchetto sostituiti.

Quando `openclaw update` gestisce un'installazione npm globale, installa prima la destinazione in
un prefisso npm temporaneo, verifica l'inventario `dist` del pacchetto e poi scambia
l'albero pulito del pacchetto nel vero prefisso globale. Questo evita che npm sovrapponga un
nuovo pacchetto a file obsoleti del vecchio pacchetto. Se il comando di installazione fallisce,
OpenClaw riprova una volta con `--omit=optional`. Quel tentativo aiuta gli host in cui le
dipendenze opzionali native non possono essere compilate, mantenendo visibile l'errore originale
se anche il fallback fallisce.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Argomenti avanzati sull'installazione npm

<AccordionGroup>
  <Accordion title="Albero dei pacchetti in sola lettura">
    OpenClaw tratta le installazioni globali pacchettizzate come in sola lettura a runtime, anche quando la directory del pacchetto globale è scrivibile dall'utente corrente. Le installazioni dei pacchetti dei Plugin risiedono in radici npm/git di proprietà di OpenClaw sotto la directory di configurazione dell'utente, e l'avvio del Gateway non modifica l'albero dei pacchetti OpenClaw.

    Alcune configurazioni npm Linux installano pacchetti globali sotto directory di proprietà di root, come `/usr/lib/node_modules/openclaw`. OpenClaw supporta questo layout perché i comandi di installazione/aggiornamento dei Plugin scrivono al di fuori di quella directory del pacchetto globale.

  </Accordion>
  <Accordion title="Unità systemd rafforzate">
    Concedi a OpenClaw accesso in scrittura alle sue radici di configurazione/stato, così le installazioni esplicite dei Plugin, gli aggiornamenti dei Plugin e la pulizia di doctor possono rendere persistenti le modifiche:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Controllo preliminare dello spazio su disco">
    Prima degli aggiornamenti dei pacchetti e delle installazioni esplicite dei Plugin, OpenClaw prova un controllo best-effort dello spazio su disco per il volume di destinazione. Lo spazio ridotto produce un avviso con il percorso controllato, ma non blocca l'aggiornamento perché quote del filesystem, snapshot e volumi di rete possono cambiare dopo il controllo. L'installazione effettiva tramite package manager e la verifica post-installazione restano autorevoli.
  </Accordion>
</AccordionGroup>

## Auto-updater

L'auto-updater è disattivato per impostazione predefinita. Abilitalo in `~/.openclaw/openclaw.json`:

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

| Canale   | Comportamento                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rollout distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica subito.                             |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                           |

Il Gateway registra anche un suggerimento di aggiornamento all'avvio (disabilita con `update.checkOnStart: false`).
Per downgrade o ripristino da incidente, imposta `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. I suggerimenti di aggiornamento all'avvio possono comunque essere eseguiti, a meno che anche `update.checkOnStart` sia disabilitato.

Gli aggiornamenti tramite package manager richiesti attraverso l'handler live del control plane del Gateway
forzano un riavvio di aggiornamento non differito e senza cooldown dopo lo scambio del pacchetto. Questo
evita di lasciare in giro un vecchio processo in memoria abbastanza a lungo da caricare pigramente chunk
da un albero dei pacchetti che è già stato sostituito. Shell `openclaw update`
resta il percorso preferito per le installazioni supervisionate, perché può arrestare e
riavviare il servizio intorno all'aggiornamento.

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, verifica le policy DM e controlla lo stato del Gateway. Dettagli: [Doctor](/it/gateway/doctor)

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

### Fissa una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra la versione pubblicata corrente.
</Tip>

### Fissa un commit (sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare all'ultima versione: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` su checkout sorgente, l'updater esegue automaticamente il bootstrap di `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (oppure riabilita `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di integrità dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione delle versioni principali.
