---
read_when:
    - Vuoi passare tra stable/beta/dev
    - Vuoi fissare una versione, un tag o uno SHA specifico
    - Stai contrassegnando o pubblicando versioni preliminari
sidebarTitle: Release Channels
summary: 'Canali stabile, beta e dev: semantica, cambio, pinning e tagging'
title: Canali di rilascio
x-i18n:
    generated_at: "2026-05-07T01:53:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribuisce tre canali di aggiornamento:

- **stable**: npm dist-tag `latest`. Consigliato per la maggior parte degli utenti.
- **beta**: npm dist-tag `beta` quando è corrente; se beta manca o è più vecchio della
  release stable più recente, il flusso di aggiornamento ripiega su `latest`.
- **dev**: head mobile di `main` (git). npm dist-tag: `dev` (quando pubblicato).
  Il branch `main` è pensato per sperimentazione e sviluppo attivo. Può contenere
  funzionalità incomplete o modifiche incompatibili. Non usarlo per gateway di produzione.

Di solito pubblichiamo prima le build stable su **beta**, le testiamo lì, poi eseguiamo un
passaggio esplicito di promozione che sposta la build verificata su `latest` senza
cambiare il numero di versione. I maintainer possono anche pubblicare una release stable
direttamente su `latest` quando necessario. I dist-tag sono la fonte di riferimento per le
installazioni npm.

## Linee di supporto mensili pianificate

OpenClaw non distribuisce ancora un canale LTS o di supporto mensile. Stiamo lavorando
verso linee di supporto mensili compatibili con SemVer, così gli utenti possano rimanere su una linea più stabile
mentre `latest` continua a muoversi rapidamente.

La forma di versione pianificata è `YYYY.M.PATCH`:

- `YYYY` è l'anno.
- `M` è la linea di release mensile, senza zero iniziale.
- `PATCH` incrementa all'interno di quella linea mensile e può superare 100 se necessario.

Esempi di tag futuri:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` per la linea di giugno.
- `v2026.6.3-beta.1` per una prerelease sul treno fast/latest.
- Un futuro dist-tag di linea di supporto come `stable-2026-6` o `lts-2026-6` potrebbe
  puntare a una linea mensile, ma oggi non è disponibile alcun canale di questo tipo.

Finché quella migrazione non sarà completata, i canali di aggiornamento pubblici restano `stable`, `beta`
e `dev`.

## Cambio di canale

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` salva la tua scelta nella configurazione (`update.channel`) e allinea il
metodo di installazione:

- **`stable`** (installazioni da pacchetto): aggiorna tramite npm dist-tag `latest`.
- **`beta`** (installazioni da pacchetto): preferisce npm dist-tag `beta`, ma ripiega su
  `latest` quando `beta` manca o è più vecchio del tag stable corrente.
- **`stable`** (installazioni git): esegue il checkout del tag git stable più recente.
- **`beta`** (installazioni git): preferisce il tag git beta più recente, ma ripiega sul
  tag git stable più recente quando beta manca o è più vecchio.
- **`dev`**: garantisce un checkout git (predefinito `~/openclaw`, sovrascrivibile con
  `OPENCLAW_GIT_DIR`), passa a `main`, esegue il rebase su upstream, compila e
  installa la CLI globale da quel checkout.

<Tip>
Se vuoi stable e dev in parallelo, mantieni due cloni e punta il gateway a quello stable.
</Tip>

## Targeting una tantum di versione o tag

Usa `--tag` per puntare a un dist-tag, una versione o una specifica di pacchetto specifici per un singolo
aggiornamento **senza** cambiare il canale salvato:

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
- Il tag non viene salvato. Il prossimo `openclaw update` userà come di consueto il tuo
  canale configurato.
- Protezione dal downgrade: se la versione di destinazione è più vecchia della tua versione corrente,
  OpenClaw chiede conferma (salta con `--yes`).
- `--channel beta` è diverso da `--tag beta`: il flusso del canale può ripiegare
  su stable/latest quando beta manca o è più vecchio, mentre `--tag beta` punta al
  dist-tag `beta` grezzo per quella singola esecuzione.

## Simulazione

Visualizza in anteprima cosa farebbe `openclaw update` senza apportare modifiche:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulazione mostra il canale effettivo, la versione di destinazione, le azioni pianificate e
se sarebbe richiesta una conferma di downgrade.

## Plugin e canali

Quando cambi canale con `openclaw update`, OpenClaw sincronizza anche le sorgenti dei plugin:

- `dev` preferisce i plugin inclusi dal checkout git.
- `stable` e `beta` ripristinano i pacchetti plugin installati tramite npm.
- I plugin installati tramite npm vengono aggiornati dopo il completamento dell'aggiornamento core.

## Verifica dello stato corrente

```bash
openclaw update status
```

Mostra il canale attivo, il tipo di installazione (git o pacchetto), la versione corrente e
la sorgente (configurazione, tag git, branch git o predefinita).

## Buone pratiche per i tag

- Tagga le release su cui vuoi che i checkout git arrivino (`vYYYY.M.D` per le release
  stable correnti, `vYYYY.M.D-beta.N` per le release beta correnti).
- `vYYYY.M.D.beta.N` è riconosciuto anche per compatibilità, ma preferisci `-beta.N`.
- I tag legacy `vYYYY.M.D-<patch>` sono ancora riconosciuti come stable (non beta),
  ma il modello di supporto mensile pianificato userà normali numeri di patch
  (`vYYYY.M.PATCH`) invece di un suffisso di correzione con trattino.
- Mantieni i tag immutabili: non spostare né riutilizzare mai un tag.
- I dist-tag npm restano la fonte di riferimento per le installazioni npm:
  - `latest` -> stable
  - `beta` -> build candidata o build stable pubblicata prima su beta
  - `dev` -> snapshot di main (opzionale)

## Disponibilità dell'app macOS

Le build beta e dev potrebbero **non** includere una release dell'app macOS. Va bene:

- Il tag git e il dist-tag npm possono comunque essere pubblicati.
- Indica "nessuna build macOS per questa beta" nelle note di release o nel changelog.

## Correlati

- [Aggiornamento](/it/install/updating)
- [Interni dell'installer](/it/install/installer)
