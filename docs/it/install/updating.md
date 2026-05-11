---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa non funziona dopo un aggiornamento
summary: Aggiornamento sicuro di OpenClaw (installazione globale o da sorgente), più strategia di ripristino
title: Aggiornamento
x-i18n:
    generated_at: "2026-05-11T20:31:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tipo di installazione (npm o git), recupera la versione più recente, esegue `openclaw doctor` e riavvia il Gateway.

```bash
openclaw update
```

Per cambiare canale o scegliere una versione specifica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` non accetta `--verbose`. Per la diagnostica degli aggiornamenti, usa
`--dry-run` per visualizzare in anteprima le azioni pianificate, `--json` per risultati strutturati oppure
`openclaw update status --json` per ispezionare lo stato del canale e della disponibilità. Il
programma di installazione ha il proprio flag `--verbose`, ma quel flag non fa parte di
`openclaw update`.

`--channel beta` preferisce beta, ma il runtime ripiega su stable/latest quando
il tag beta manca o è più vecchio dell'ultima release stabile. Usa `--tag beta`
se vuoi il dist-tag beta npm grezzo per un aggiornamento pacchetto una tantum.

Per i plugin gestiti, il fallback del canale beta è un avviso: l'aggiornamento del core può
comunque riuscire mentre un plugin usa la propria release predefinita/latest registrata perché non
è disponibile alcuna beta del plugin.

Vedi [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Passare tra installazioni npm e git

Usa i canali quando vuoi cambiare il tipo di installazione. L'aggiornatore mantiene
stato, configurazione, credenziali e workspace in `~/.openclaw`; cambia solo
quale installazione del codice OpenClaw viene usata da CLI e Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Esegui prima con `--dry-run` per visualizzare in anteprima l'esatto cambio di modalità di installazione:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Il canale `dev` garantisce un checkout git, lo compila e installa la CLI globale
da quel checkout. I canali `stable` e `beta` usano installazioni da pacchetto. Se il
Gateway è già installato, `openclaw update` aggiorna i metadati del servizio
e lo riavvia, a meno che tu non passi `--no-restart`.

## Alternativa: rieseguire il programma di installazione

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per forzare un tipo di installazione specifico tramite
il programma di installazione, passa `--install-method git --no-onboard` oppure
`--install-method npm --no-onboard`.

Se `openclaw update` fallisce dopo la fase di installazione del pacchetto npm, riesegui il
programma di installazione. Il programma di installazione non chiama il vecchio aggiornatore; esegue direttamente
l'installazione del pacchetto globale e può recuperare un'installazione npm parzialmente aggiornata.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Per vincolare il recupero a una versione specifica o a un dist-tag, aggiungi `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manuale

```bash
npm i -g openclaw@latest
```

Preferisci `openclaw update` per installazioni supervisionate, perché può coordinare lo
scambio del pacchetto con il servizio Gateway in esecuzione. Se aggiorni manualmente mentre un
Gateway gestito è in esecuzione, riavvia il Gateway subito dopo che il package
manager ha terminato, così il vecchio processo non continua a servire file da un pacchetto
sostituito.

Quando `openclaw update` gestisce un'installazione npm globale, installa prima la destinazione in
un prefisso npm temporaneo, verifica l'inventario `dist` impacchettato, quindi scambia
l'albero del pacchetto pulito nel vero prefisso globale. Questo evita che npm sovrapponga un
nuovo pacchetto a file obsoleti del vecchio pacchetto. Se il comando di installazione fallisce,
OpenClaw riprova una volta con `--omit=optional`. Quel nuovo tentativo aiuta gli host in cui le
dipendenze native opzionali non possono essere compilate, mantenendo visibile l'errore originale
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
    OpenClaw tratta le installazioni globali impacchettate come in sola lettura in runtime, anche quando la directory del pacchetto globale è scrivibile dall'utente corrente. Le installazioni dei pacchetti plugin risiedono in radici npm/git di proprietà di OpenClaw sotto la directory di configurazione utente, e l'avvio del Gateway non modifica l'albero dei pacchetti OpenClaw.

    Alcune configurazioni npm Linux installano i pacchetti globali in directory di proprietà di root, come `/usr/lib/node_modules/openclaw`. OpenClaw supporta quel layout perché i comandi di installazione/aggiornamento dei plugin scrivono fuori da quella directory del pacchetto globale.

  </Accordion>
  <Accordion title="Unità systemd rafforzate">
    Concedi a OpenClaw l'accesso in scrittura alle sue radici di configurazione/stato, così installazioni esplicite di plugin, aggiornamenti di plugin e pulizia di doctor possono persistere le modifiche:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Controllo preliminare dello spazio su disco">
    Prima degli aggiornamenti dei pacchetti e delle installazioni esplicite di plugin, OpenClaw prova a eseguire un controllo best-effort dello spazio su disco per il volume di destinazione. Lo spazio insufficiente produce un avviso con il percorso controllato, ma non blocca l'aggiornamento perché quote del filesystem, snapshot e volumi di rete possono cambiare dopo il controllo. L'installazione effettiva del package manager e la verifica post-installazione restano autorevoli.
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

| Canale   | Comportamento                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rilascio distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                       |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                             |

Il Gateway registra anche un suggerimento di aggiornamento all'avvio (disabilitalo con `update.checkOnStart: false`).
Per downgrade o recupero da incidenti, imposta `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. I suggerimenti di aggiornamento all'avvio possono comunque essere eseguiti, a meno che anche `update.checkOnStart` sia disabilitato.

Gli aggiornamenti del package manager richiesti tramite l'handler live del piano di controllo del Gateway
forzano un riavvio di aggiornamento non differito e senza cooldown dopo lo scambio del pacchetto. Questo
evita di lasciare in giro un vecchio processo in memoria abbastanza a lungo da caricare lazy chunk
da un albero di pacchetti che è già stato sostituito. `openclaw update` da shell
rimane il percorso preferito per installazioni supervisionate perché può arrestare e
riavviare il servizio durante l'aggiornamento.

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, controlla le policy DM e verifica lo stato del Gateway. Dettagli: [Doctor](/it/gateway/doctor)

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

### Vincolare una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra la versione pubblicata corrente.
</Tip>

### Vincolare un commit (sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare alla più recente: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` sui checkout sorgente, l'aggiornatore esegue automaticamente il bootstrap di `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (o riabilita `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di integrità dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione di versioni principali.
