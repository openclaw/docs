---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa smette di funzionare dopo un aggiornamento
summary: Aggiornare OpenClaw in modo sicuro (installazione globale o da sorgente), con strategia di ripristino
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-30T08:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
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
openclaw update --dry-run   # anteprima senza applicare
```

`--channel beta` preferisce beta, ma il runtime ripiega su stable/latest quando
il tag beta manca o è più vecchio dell'ultima release stabile. Usa `--tag beta`
se vuoi il dist-tag beta npm grezzo per un aggiornamento una tantum del pacchetto.

Vedi [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Passare tra installazioni npm e git

Usa i canali quando vuoi cambiare il tipo di installazione. L'updater mantiene
stato, configurazione, credenziali e workspace in `~/.openclaw`; cambia solo
quale installazione del codice OpenClaw usano la CLI e il Gateway.

```bash
# installazione pacchetto npm -> checkout git modificabile
openclaw update --channel dev

# checkout git -> installazione pacchetto npm
openclaw update --channel stable
```

Esegui prima con `--dry-run` per vedere in anteprima l'esatto cambio di modalità di installazione:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Il canale `dev` assicura un checkout git, lo compila e installa la CLI globale
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
l'installazione del pacchetto globale e può ripristinare un'installazione npm aggiornata parzialmente.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Per vincolare il ripristino a una versione o a un dist-tag specifico, aggiungi `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm o bun manuali

```bash
npm i -g openclaw@latest
```

Quando `openclaw update` gestisce un'installazione npm globale, installa prima il target in
un prefisso npm temporaneo, verifica l'inventario `dist` pacchettizzato, poi sostituisce
l'albero pulito del pacchetto nel vero prefisso globale. Questo evita che npm sovrapponga
un nuovo pacchetto a file obsoleti del vecchio pacchetto. Se il comando di installazione fallisce,
OpenClaw riprova una volta con `--omit=optional`. Quel tentativo aiuta gli host in cui le dipendenze
opzionali native non possono compilare, mantenendo comunque visibile l'errore originale
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
    OpenClaw tratta le installazioni globali pacchettizzate come di sola lettura a runtime, anche quando la directory globale del pacchetto è scrivibile dall'utente corrente. Le dipendenze di runtime dei Plugin in bundle vengono predisposte in una directory di runtime scrivibile invece di modificare l'albero del pacchetto. Questo impedisce a `openclaw update` di entrare in conflitto con un Gateway in esecuzione o con un agente locale che sta riparando le dipendenze dei Plugin durante la stessa installazione.

    Alcune configurazioni npm su Linux installano i pacchetti globali in directory di proprietà di root, come `/usr/lib/node_modules/openclaw`. OpenClaw supporta questo layout tramite lo stesso percorso esterno di staging.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Imposta una directory di staging scrivibile inclusa in `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` accetta anche un elenco di percorsi. OpenClaw risolve le dipendenze di runtime dei Plugin in bundle da sinistra a destra tra le radici elencate, tratta le radici precedenti come livelli preinstallati di sola lettura e installa o ripara solo nella radice finale scrivibile:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Se `OPENCLAW_PLUGIN_STAGE_DIR` non è impostato, OpenClaw usa `$STATE_DIRECTORY` quando systemd lo fornisce, poi ripiega su `~/.openclaw/plugin-runtime-deps`. Il passaggio di riparazione tratta quello stage come una radice di pacchetti locale di proprietà di OpenClaw e ignora il prefisso npm dell'utente e le impostazioni globali, quindi la configurazione npm per installazioni globali non reindirizza le dipendenze dei Plugin in bundle in `~/node_modules` o nell'albero globale del pacchetto.

  </Accordion>
  <Accordion title="Disk-space preflight">
    Prima degli aggiornamenti dei pacchetti e delle riparazioni delle dipendenze di runtime in bundle, OpenClaw tenta un controllo best-effort dello spazio su disco per il volume di destinazione. Lo spazio insufficiente produce un avviso con il percorso controllato, ma non blocca l'aggiornamento perché quote del filesystem, snapshot e volumi di rete possono cambiare dopo il controllo. L'installazione npm effettiva, la copia e la verifica post-installazione restano definitive.
  </Accordion>
  <Accordion title="Bundled plugin runtime dependencies">
    Le installazioni pacchettizzate tengono le dipendenze di runtime dei Plugin in bundle fuori dall'albero del pacchetto di sola lettura. All'avvio e durante `openclaw doctor --fix`, OpenClaw ripara le dipendenze di runtime solo per i Plugin in bundle attivi nella configurazione, attivi tramite la configurazione legacy del canale o abilitati dal default del loro manifest in bundle. Lo stato di autenticazione del canale persistito da solo non attiva la riparazione delle dipendenze di runtime all'avvio del Gateway.

    La disabilitazione esplicita prevale. Un Plugin o un canale disabilitato non fa riparare le proprie dipendenze di runtime solo perché esiste nel pacchetto. I Plugin esterni e i percorsi di caricamento personalizzati continuano a usare `openclaw plugins install` o `openclaw plugins update`.

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
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rollout distribuito).    |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                          |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                                |

Il Gateway registra anche un suggerimento di aggiornamento all'avvio (disabilitabile con `update.checkOnStart: false`).
Per downgrade o ripristino da incidente, imposta `OPENCLAW_NO_AUTO_UPDATE=1` nell'ambiente del Gateway per bloccare le applicazioni automatiche anche quando `update.auto.enabled` è configurato. I suggerimenti di aggiornamento all'avvio possono comunque essere eseguiti, a meno che anche `update.checkOnStart` sia disabilitato.

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

Per tornare all'ultima versione: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` su checkout sorgente, l'updater inizializza automaticamente `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (o riabilita `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install): tutti i metodi di installazione.
- [Doctor](/it/gateway/doctor): controlli di integrità dopo gli aggiornamenti.
- [Migrazione](/it/install/migrating): guide alla migrazione delle versioni principali.
