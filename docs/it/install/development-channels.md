---
read_when:
    - Vuoi passare tra stable/beta/dev
    - Vuoi fissare una versione, un tag o uno SHA specifico
    - Stai creando tag o pubblicando prerelease
sidebarTitle: Release Channels
summary: 'Canali stable, beta e dev: semantica, cambio, pinning e tagging'
title: Canali di rilascio
x-i18n:
    generated_at: "2026-04-24T08:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Canali di sviluppo

OpenClaw distribuisce tre canali di aggiornamento:

- **stable**: dist-tag npm `latest`. Consigliato per la maggior parte degli utenti.
- **beta**: dist-tag npm `beta` quando è attuale; se beta manca o è più vecchio
  dell'ultima release stable, il flusso di aggiornamento usa come fallback `latest`.
- **dev**: head mobile di `main` (git). dist-tag npm: `dev` (quando pubblicato).
  Il branch `main` è destinato a sperimentazione e sviluppo attivo. Può contenere
  funzionalità incomplete o breaking change. Non usarlo per Gateway di produzione.

Di solito distribuiamo prima le build stable su **beta**, le testiamo lì, poi eseguiamo un
passaggio di promozione esplicito che sposta la build verificata su `latest` senza
cambiare il numero di versione. I maintainer possono anche pubblicare una release stable
direttamente su `latest` quando necessario. I dist-tag sono la fonte di verità per le
installazioni npm.

## Passare da un canale all'altro

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` rende persistente la tua scelta nella configurazione (`update.channel`) e allinea il
metodo di installazione:

- **`stable`** (installazioni package): aggiorna tramite dist-tag npm `latest`.
- **`beta`** (installazioni package): preferisce il dist-tag npm `beta`, ma usa come fallback
  `latest` quando `beta` manca o è più vecchio del tag stable corrente.
- **`stable`** (installazioni git): esegue checkout dell'ultimo tag git stable.
- **`beta`** (installazioni git): preferisce l'ultimo tag git beta, ma usa come fallback
  l'ultimo tag git stable quando beta manca o è più vecchio.
- **`dev`**: garantisce un checkout git (predefinito `~/openclaw`, sovrascrivibile con
  `OPENCLAW_GIT_DIR`), passa a `main`, esegue rebase sull'upstream, builda e
  installa la CLI globale da quel checkout.

Suggerimento: se vuoi stable + dev in parallelo, mantieni due cloni e punta il tuo
Gateway a quello stable.

## Targeting one-off di una versione o tag

Usa `--tag` per puntare a un dist-tag, una versione o una specifica di package specifici per un singolo
aggiornamento **senza** modificare il canale reso persistente:

```bash
# Installa una versione specifica
openclaw update --tag 2026.4.1-beta.1

# Installa dal dist-tag beta (one-off, non viene reso persistente)
openclaw update --tag beta

# Installa dal branch GitHub main (tarball npm)
openclaw update --tag main

# Installa una specifica di package npm specifica
openclaw update --tag openclaw@2026.4.1-beta.1
```

Note:

- `--tag` si applica **solo alle installazioni package (npm)**. Le installazioni git lo ignorano.
- Il tag non viene reso persistente. Il successivo `openclaw update` userà il canale configurato come di consueto.
- Protezione dal downgrade: se la versione target è più vecchia della versione corrente,
  OpenClaw chiede conferma (salta con `--yes`).
- `--channel beta` è diverso da `--tag beta`: il flusso del canale può usare come fallback
  stable/latest quando beta manca o è più vecchio, mentre `--tag beta` punta al
  dist-tag `beta` raw solo per quell'esecuzione.

## Dry run

Anteprima di cosa farebbe `openclaw update` senza apportare modifiche:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulazione mostra il canale effettivo, la versione target, le azioni pianificate e
se sarebbe richiesta una conferma di downgrade.

## Plugin e canali

Quando cambi canale con `openclaw update`, OpenClaw sincronizza anche le fonti dei
Plugin:

- `dev` preferisce i Plugin inclusi dal checkout git.
- `stable` e `beta` ripristinano i pacchetti Plugin installati via npm.
- I Plugin installati via npm vengono aggiornati dopo il completamento dell'aggiornamento del core.

## Verificare lo stato corrente

```bash
openclaw update status
```

Mostra il canale attivo, il tipo di installazione (git o package), la versione corrente e
la sorgente (configurazione, tag git, branch git o predefinita).

## Best practice per i tag

- Taga le release su cui vuoi che atterrino i checkout git (`vYYYY.M.D` per stable,
  `vYYYY.M.D-beta.N` per beta).
- `vYYYY.M.D.beta.N` è ancora riconosciuto per compatibilità, ma preferisci `-beta.N`.
- I tag legacy `vYYYY.M.D-<patch>` sono ancora riconosciuti come stable (non-beta).
- Mantieni i tag immutabili: non spostare né riutilizzare mai un tag.
- I dist-tag npm restano la fonte di verità per le installazioni npm:
  - `latest` -> stable
  - `beta` -> build candidata o build stable distribuita prima su beta
  - `dev` -> snapshot di main (facoltativo)

## Disponibilità dell'app macOS

Le build beta e dev potrebbero **non** includere una release dell'app macOS. Questo va bene:

- Il tag git e il dist-tag npm possono comunque essere pubblicati.
- Specifica "nessuna build macOS per questa beta" nelle note di rilascio o nel changelog.

## Correlati

- [Aggiornamento](/it/install/updating)
- [Dettagli interni dell'installer](/it/install/installer)
