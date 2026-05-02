---
read_when:
    - Aggiornare OpenClaw
    - Qualcosa non funziona dopo un aggiornamento
summary: Aggiornare OpenClaw in modo sicuro (installazione globale o da sorgente), con strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-05-02T08:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tipo di installazione (npm o git), recupera l'ultima versione, esegue `openclaw doctor` e riavvia il gateway.

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

`--channel beta` preferisce beta, ma il runtime torna a stable/latest quando
il tag beta manca o è più vecchio dell'ultima release stabile. Usa `--tag beta`
se vuoi il dist-tag npm beta grezzo per un aggiornamento pacchetto una tantum.

Consulta [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Passa tra installazioni npm e git

Usa i canali quando vuoi cambiare il tipo di installazione. L'updater conserva
stato, configurazione, credenziali e workspace in `~/.openclaw`; cambia solo
quale installazione del codice OpenClaw usano la CLI e il gateway.

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

Il canale `dev` assicura un checkout git, lo compila e installa la CLI globale
da quel checkout. I canali `stable` e `beta` usano installazioni da pacchetto. Se il
gateway è già installato, `openclaw update` aggiorna i metadati del servizio
e lo riavvia a meno che tu non passi `--no-restart`.

## Alternativa: riesegui l'installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per forzare un tipo di installazione specifico tramite
l'installer, passa `--install-method git --no-onboard` oppure
`--install-method npm --no-onboard`.

Se `openclaw update` fallisce dopo la fase di installazione del pacchetto npm, riesegui
l'installer. L'installer non chiama il vecchio updater; esegue direttamente
l'installazione del pacchetto globale e può recuperare un'installazione npm parzialmente aggiornata.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Per bloccare il recupero a una versione o dist-tag specifico, aggiungi `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manuale

```bash
npm i -g openclaw@latest
```

Quando `openclaw update` gestisce un'installazione npm globale, installa prima il target in
un prefisso npm temporaneo, verifica l'inventario `dist` confezionato, quindi scambia
l'albero pulito del pacchetto nel vero prefisso globale. Questo evita che npm sovrapponga un
nuovo pacchetto a file obsoleti del vecchio pacchetto. Se il comando di installazione fallisce,
OpenClaw ritenta una volta con `--omit=optional`. Questo tentativo aiuta gli host in cui le
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
  <Accordion title="Read-only package tree">
    OpenClaw tratta le installazioni globali confezionate come di sola lettura a runtime, anche quando la directory globale del pacchetto è scrivibile dall'utente corrente. Le installazioni dei pacchetti Plugin risiedono in radici npm/git di proprietà di OpenClaw sotto la directory di configurazione dell'utente, e l'avvio del Gateway non modifica l'albero del pacchetto OpenClaw.

    Alcune configurazioni npm su Linux installano i pacchetti globali in directory di proprietà di root come `/usr/lib/node_modules/openclaw`. OpenClaw supporta questa struttura perché i comandi di installazione/aggiornamento dei plugin scrivono fuori da quella directory globale del pacchetto.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Dai a OpenClaw accesso in scrittura alle sue radici di configurazione/stato così che installazioni Plugin esplicite, aggiornamenti Plugin e pulizia di doctor possano rendere persistenti le modifiche:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Prima degli aggiornamenti dei pacchetti e delle installazioni Plugin esplicite, OpenClaw tenta un controllo dello spazio su disco best-effort per il volume target. Lo spazio insufficiente produce un avviso con il percorso controllato, ma non blocca l'aggiornamento perché quote del filesystem, snapshot e volumi di rete possono cambiare dopo il controllo. L'installazione effettiva del package manager e la verifica post-installazione restano autorevoli.
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

| Canale   | Comportamento                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rollout distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica subito.                              |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                            |

Il gateway registra anche un suggerimento di aggiornamento all'avvio (disabilitalo con `update.checkOnStart: false`).
Per downgrade o recupero da incidente, imposta `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. I suggerimenti di aggiornamento all'avvio possono ancora essere eseguiti a meno che anche `update.checkOnStart` non sia disabilitato.

Gli aggiornamenti del package manager richiesti tramite l'handler del piano di controllo live del Gateway
forzano un riavvio di aggiornamento non differito e senza cooldown dopo lo scambio del pacchetto. Questo
evita di lasciare in esecuzione un vecchio processo in memoria abbastanza a lungo da caricare lazy chunk
da un albero di pacchetto già sostituito. `openclaw update` da shell
resta il percorso preferito per installazioni supervisionate perché può arrestare e
riavviare il servizio durante l'aggiornamento.

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, controlla le policy DM e verifica lo stato del gateway. Dettagli: [Doctor](/it/gateway/doctor)

### Riavvia il gateway

```bash
openclaw gateway restart
```

### Verifica

```bash
openclaw health
```

</Steps>

## Rollback

### Blocca una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra la versione pubblicata corrente.
</Tip>

### Blocca un commit (sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare all'ultima versione: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` su checkout sorgente, l'updater esegue automaticamente il bootstrap di `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (o riabilita `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di stato dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione delle versioni principali.
