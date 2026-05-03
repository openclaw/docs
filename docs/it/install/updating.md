---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa non funziona dopo un aggiornamento
summary: Aggiornare OpenClaw in sicurezza (installazione globale o da sorgente), più una strategia di ripristino
title: Aggiornamento
x-i18n:
    generated_at: "2026-05-03T21:36:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
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
openclaw update --tag main
openclaw update --dry-run   # anteprima senza applicare
```

`openclaw update` non accetta `--verbose`. Per la diagnostica degli aggiornamenti, usa
`--dry-run` per visualizzare in anteprima le azioni pianificate, `--json` per risultati strutturati oppure
`openclaw update status --json` per ispezionare lo stato del canale e della disponibilità. L'
installer ha il proprio flag `--verbose`, ma quel flag non fa parte di
`openclaw update`.

`--channel beta` preferisce beta, ma il runtime torna a stable/latest quando
il tag beta manca o è precedente all'ultima versione stabile. Usa `--tag beta`
se vuoi il dist-tag beta grezzo di npm per un aggiornamento pacchetto una tantum.

Consulta [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Passare tra installazioni npm e git

Usa i canali quando vuoi cambiare il tipo di installazione. L'updater mantiene
stato, configurazione, credenziali e workspace in `~/.openclaw`; cambia solo
quale installazione del codice OpenClaw viene usata dalla CLI e dal Gateway.

```bash
# installazione pacchetto npm -> checkout git modificabile
openclaw update --channel dev

# checkout git -> installazione pacchetto npm
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

## Alternativa: rieseguire l'installer

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

Per fissare il recupero a una versione o a un dist-tag specifico, aggiungi `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manuale

```bash
npm i -g openclaw@latest
```

Quando `openclaw update` gestisce un'installazione globale npm, installa prima il target in
un prefisso npm temporaneo, verifica l'inventario `dist` del pacchetto, quindi sostituisce
l'albero del pacchetto pulito nel prefisso globale reale. Questo evita che npm sovrascriva
un nuovo pacchetto sopra file obsoleti del vecchio pacchetto. Se il comando di installazione fallisce,
OpenClaw riprova una volta con `--omit=optional`. Quel tentativo aiuta gli host in cui le
dipendenze opzionali native non possono essere compilate, mantenendo visibile il fallimento originale
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
    OpenClaw tratta le installazioni globali pacchettizzate come in sola lettura a runtime, anche quando la directory globale del pacchetto è scrivibile dall'utente corrente. Le installazioni dei pacchetti Plugin risiedono in radici npm/git di proprietà di OpenClaw sotto la directory di configurazione utente, e l'avvio del Gateway non modifica l'albero del pacchetto OpenClaw.

    Alcune configurazioni npm su Linux installano i pacchetti globali in directory di proprietà di root, come `/usr/lib/node_modules/openclaw`. OpenClaw supporta questo layout perché i comandi di installazione/aggiornamento dei plugin scrivono al di fuori di quella directory globale del pacchetto.

  </Accordion>
  <Accordion title="Unità systemd rafforzate">
    Concedi a OpenClaw accesso in scrittura alle sue radici di configurazione/stato in modo che installazioni esplicite dei plugin, aggiornamenti dei plugin e pulizia del doctor possano rendere persistenti le loro modifiche:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Controllo preliminare dello spazio su disco">
    Prima degli aggiornamenti dei pacchetti e delle installazioni esplicite dei plugin, OpenClaw prova un controllo best-effort dello spazio su disco per il volume di destinazione. Lo spazio insufficiente produce un avviso con il percorso controllato, ma non blocca l'aggiornamento perché quote del filesystem, snapshot e volumi di rete possono cambiare dopo il controllo. L'installazione effettiva del package manager e la verifica post-installazione restano autorevoli.
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

| Canale   | Comportamento                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rollout distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                              |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                                           |

Il Gateway registra anche un suggerimento di aggiornamento all'avvio (disabilita con `update.checkOnStart: false`).
Per il downgrade o il recupero da incidente, imposta `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. I suggerimenti di aggiornamento all'avvio possono comunque essere eseguiti, a meno che anche `update.checkOnStart` non sia disabilitato.

Gli aggiornamenti del package manager richiesti tramite l'handler live del control-plane del Gateway
forzano un riavvio di aggiornamento non differito e senza cooldown dopo lo scambio del pacchetto. Questo
evita di lasciare in esecuzione un vecchio processo in memoria abbastanza a lungo da caricare in modo lazy chunk
da un albero dei pacchetti che è già stato sostituito. `openclaw update` dalla shell
rimane il percorso preferito per installazioni supervisionate perché può arrestare e
riavviare il servizio attorno all'aggiornamento.

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

### Fissare una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra la versione attualmente pubblicata.
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
- Consulta: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di stato dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione delle versioni principali.
