---
read_when:
    - Vuoi passare tra stabile/beta/dev
    - Vuoi bloccare una versione, un tag o uno SHA specifico
    - Stai etichettando o pubblicando versioni preliminari
sidebarTitle: Release Channels
summary: 'Canali stable, beta e dev: semantica, cambio, pinning e tagging'
title: Canali di rilascio
x-i18n:
    generated_at: "2026-04-30T08:57:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Canali di sviluppo

OpenClaw distribuisce tre canali di aggiornamento:

- **stable**: npm dist-tag `latest`. Consigliato per la maggior parte degli utenti.
- **beta**: npm dist-tag `beta` quando è corrente; se beta manca o è precedente alla
  versione stabile più recente, il flusso di aggiornamento ripiega su `latest`.
- **dev**: head mobile di `main` (git). npm dist-tag: `dev` (quando pubblicato).
  Il branch `main` è destinato alla sperimentazione e allo sviluppo attivo. Può contenere
  funzionalità incomplete o modifiche incompatibili. Non usarlo per Gateway di produzione.

Di solito distribuiamo prima le build stabili su **beta**, le testiamo lì, quindi eseguiamo un
passaggio esplicito di promozione che sposta la build verificata su `latest` senza
cambiare il numero di versione. I manutentori possono anche pubblicare una release stabile
direttamente su `latest` quando necessario. I dist-tag sono la fonte di verità per le
installazioni npm.

## Cambio di canale

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` mantiene la scelta nella configurazione (`update.channel`) e allinea il
metodo di installazione:

- **`stable`** (installazioni da pacchetto): aggiorna tramite npm dist-tag `latest`.
- **`beta`** (installazioni da pacchetto): preferisce npm dist-tag `beta`, ma ripiega su
  `latest` quando `beta` manca o è precedente al tag stabile corrente.
- **`stable`** (installazioni git): esegue il checkout dell'ultimo tag git stabile.
- **`beta`** (installazioni git): preferisce l'ultimo tag git beta, ma ripiega
  sull'ultimo tag git stabile quando beta manca o è precedente.
- **`dev`**: assicura un checkout git (predefinito `~/openclaw`, sostituibile con
  `OPENCLAW_GIT_DIR`), passa a `main`, esegue il rebase sull'upstream, compila e
  installa la CLI globale da quel checkout.

<Tip>
Se vuoi stable e dev in parallelo, mantieni due cloni e punta il tuo Gateway a quello stable.
</Tip>

## Targeting una tantum di versione o tag

Usa `--tag` per scegliere come target uno specifico dist-tag, versione o package spec per un singolo
aggiornamento **senza** cambiare il canale mantenuto:

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
- Il tag non viene mantenuto. Il prossimo `openclaw update` usa il canale configurato
  come di consueto.
- Protezione dal downgrade: se la versione target è precedente alla versione corrente,
  OpenClaw richiede conferma (salta con `--yes`).
- `--channel beta` è diverso da `--tag beta`: il flusso del canale può ripiegare
  su stable/latest quando beta manca o è precedente, mentre `--tag beta` punta al
  dist-tag `beta` grezzo per quella singola esecuzione.

## Esecuzione di prova

Visualizza in anteprima cosa farebbe `openclaw update` senza apportare modifiche:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

L'esecuzione di prova mostra il canale effettivo, la versione target, le azioni pianificate e
se sarebbe richiesta una conferma di downgrade.

## Plugin e canali

Quando cambi canale con `openclaw update`, OpenClaw sincronizza anche le sorgenti dei Plugin:

- `dev` preferisce i Plugin inclusi nel checkout git.
- `stable` e `beta` ripristinano i pacchetti Plugin installati da npm.
- I Plugin installati da npm vengono aggiornati dopo il completamento dell'aggiornamento core.

## Controllo dello stato corrente

```bash
openclaw update status
```

Mostra il canale attivo, il tipo di installazione (git o pacchetto), la versione corrente e
la sorgente (configurazione, tag git, branch git o predefinita).

## Buone pratiche per i tag

- Applica tag alle release su cui vuoi che arrivino i checkout git (`vYYYY.M.D` per stable,
  `vYYYY.M.D-beta.N` per beta).
- `vYYYY.M.D.beta.N` è riconosciuto anche per compatibilità, ma preferisci `-beta.N`.
- I tag legacy `vYYYY.M.D-<patch>` sono ancora riconosciuti come stable (non beta).
- Mantieni i tag immutabili: non spostare né riutilizzare mai un tag.
- I dist-tag npm rimangono la fonte di verità per le installazioni npm:
  - `latest` -> stable
  - `beta` -> build candidata o build stabile beta-first
  - `dev` -> snapshot di main (opzionale)

## Disponibilità dell'app macOS

Le build beta e dev potrebbero **non** includere una release dell'app macOS. Va bene così:

- Il tag git e il dist-tag npm possono comunque essere pubblicati.
- Indica "nessuna build macOS per questa beta" nelle note di release o nel changelog.

## Correlati

- [Aggiornamento](/it/install/updating)
- [Interni dell'installer](/it/install/installer)
