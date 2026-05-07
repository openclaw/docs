---
read_when:
    - Vuoi passare tra stable/beta/dev
    - Vuoi fissare una versione, un tag o uno SHA specifici
    - Stai creando tag o pubblicando versioni preliminari
sidebarTitle: Release Channels
summary: 'Canali stabile, beta e di sviluppo: semantica, cambio, blocco e assegnazione dei tag'
title: Canali di rilascio
x-i18n:
    generated_at: "2026-05-07T13:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw offre tre canali di aggiornamento:

- **stable**: dist-tag npm `latest`. Consigliato per la maggior parte degli utenti.
- **beta**: dist-tag npm `beta` quando è corrente; se beta manca o è più vecchio
  dell'ultima release stabile, il flusso di aggiornamento ripiega su `latest`.
- **dev**: head mobile di `main` (git). dist-tag npm: `dev` (quando pubblicato).
  Il branch `main` è destinato alla sperimentazione e allo sviluppo attivo. Può contenere
  funzionalità incomplete o modifiche incompatibili. Non usarlo per Gateway di produzione.

Di solito pubblichiamo le build stabili prima su **beta**, le testiamo lì, poi eseguiamo un
passaggio esplicito di promozione che sposta la build verificata su `latest` senza
modificare il numero di versione. I maintainer possono anche pubblicare una release stabile
direttamente su `latest` quando necessario. I dist-tag sono la fonte di verità per le
installazioni npm.

## Cambio di canale

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva la scelta nella configurazione (`update.channel`) e allinea il
metodo di installazione:

- **`stable`** (installazioni da pacchetto): aggiorna tramite il dist-tag npm `latest`.
- **`beta`** (installazioni da pacchetto): preferisce il dist-tag npm `beta`, ma ripiega su
  `latest` quando `beta` manca o è più vecchio del tag stabile corrente.
- **`stable`** (installazioni git): passa all'ultimo tag git stabile.
- **`beta`** (installazioni git): preferisce l'ultimo tag git beta, ma ripiega
  sull'ultimo tag git stabile quando beta manca o è più vecchio.
- **`dev`**: assicura un checkout git (predefinito `~/openclaw`, sovrascrivibile con
  `OPENCLAW_GIT_DIR`), passa a `main`, esegue il rebase su upstream, compila e
  installa la CLI globale da quel checkout.

<Tip>
Se vuoi stable e dev in parallelo, mantieni due cloni e punta il tuo Gateway a quello stable.
</Tip>

## Destinazione di una versione o di un tag una tantum

Usa `--tag` per puntare a un dist-tag, una versione o una spec di pacchetto specifici per un singolo
aggiornamento **senza** modificare il canale salvato:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Note:

- `--tag` si applica **solo alle installazioni da pacchetto (npm)**. Le installazioni git lo ignorano.
- Il tag non viene salvato. Il prossimo `openclaw update` userà come di consueto il
  canale configurato.
- Protezione dal downgrade: se la versione di destinazione è più vecchia della tua versione corrente,
  OpenClaw chiede conferma (salta con `--yes`).
- `--channel beta` è diverso da `--tag beta`: il flusso del canale può ripiegare
  su stable/latest quando beta manca o è più vecchio, mentre `--tag beta` punta al
  dist-tag `beta` grezzo per quella singola esecuzione.

## Prova a secco

Visualizza in anteprima cosa farebbe `openclaw update` senza apportare modifiche:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La prova a secco mostra il canale effettivo, la versione di destinazione, le azioni pianificate e
se sarebbe richiesta una conferma di downgrade.

## Plugin e canali

Quando cambi canale con `openclaw update`, OpenClaw sincronizza anche le sorgenti dei Plugin:

- `dev` preferisce i Plugin inclusi dal checkout git.
- `stable` e `beta` ripristinano i pacchetti Plugin installati da npm.
- I Plugin installati da npm vengono aggiornati dopo il completamento dell'aggiornamento del core.

## Verifica dello stato corrente

```bash
openclaw update status
```

Mostra il canale attivo, il tipo di installazione (git o pacchetto), la versione corrente e
l'origine (configurazione, tag git, branch git o predefinita).

## Migliori pratiche per i tag

- Tagga le release su cui vuoi che arrivino i checkout git (`vYYYY.M.D` per stable,
  `vYYYY.M.D-beta.N` per beta).
- Anche `vYYYY.M.D.beta.N` è riconosciuto per compatibilità, ma preferisci `-beta.N`.
- I tag legacy `vYYYY.M.D-<patch>` sono ancora riconosciuti come stabili (non beta).
- Mantieni i tag immutabili: non spostare né riutilizzare mai un tag.
- I dist-tag npm restano la fonte di verità per le installazioni npm:
  - `latest` -> stable
  - `beta` -> build candidata o build stabile prima in beta
  - `dev` -> snapshot di main (facoltativo)

## Disponibilità dell'app macOS

Le build beta e dev potrebbero **non** includere una release dell'app macOS. Va bene così:

- Il tag git e il dist-tag npm possono comunque essere pubblicati.
- Indica "nessuna build macOS per questa beta" nelle note di release o nel changelog.

## Correlati

- [Aggiornamento](/it/install/updating)
- [Interni dell'installer](/it/install/installer)
