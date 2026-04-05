---
read_when:
    - Vuoi passare tra stable/beta/dev
    - Vuoi fissare una versione, un tag o uno SHA specifico
    - Stai eseguendo tagging o pubblicando prerelease
sidebarTitle: Release Channels
summary: 'Canali stable, beta e dev: semantica, cambio, pinning e tagging'
title: Canali di rilascio
x-i18n:
    generated_at: "2026-04-05T13:54:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Canali di sviluppo

OpenClaw distribuisce tre canali di aggiornamento:

- **stable**: npm dist-tag `latest`. Consigliato per la maggior parte degli utenti.
- **beta**: npm dist-tag `beta` quando è attuale; se beta manca o è più vecchio
  dell'ultima release stable, il flusso di aggiornamento torna a `latest`.
- **dev**: head mobile di `main` (git). npm dist-tag: `dev` (quando pubblicato).
  Il branch `main` è destinato a sperimentazione e sviluppo attivo. Può contenere
  funzionalità incomplete o modifiche incompatibili. Non usarlo per gateway di produzione.

Di solito distribuiamo prima le build stable su **beta**, le testiamo lì, poi eseguiamo un
passaggio di promozione esplicito che sposta la build verificata in `latest` senza
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

- **`stable`** (installazioni package): aggiorna tramite npm dist-tag `latest`.
- **`beta`** (installazioni package): preferisce npm dist-tag `beta`, ma torna a
  `latest` quando `beta` manca o è più vecchio dell'attuale tag stable.
- **`stable`** (installazioni git): esegue il checkout dell'ultimo tag git stable.
- **`beta`** (installazioni git): preferisce l'ultimo tag git beta, ma torna
  all'ultimo tag git stable quando beta manca o è più vecchio.
- **`dev`**: garantisce un checkout git (predefinito `~/openclaw`, sovrascrivibile con
  `OPENCLAW_GIT_DIR`), passa a `main`, fa rebase su upstream, esegue la build e
  installa la CLI globale da quel checkout.

Suggerimento: se vuoi stable + dev in parallelo, mantieni due cloni e fai puntare il tuo
gateway a quello stable.

## Targeting una tantum di versione o tag

Usa `--tag` per puntare a un dist-tag, una versione o uno package spec specifico per un singolo
aggiornamento **senza** modificare il canale persistente:

```bash
# Installa una versione specifica
openclaw update --tag 2026.4.1-beta.1

# Installa dal dist-tag beta (una tantum, non persistente)
openclaw update --tag beta

# Installa dal branch GitHub main (tarball npm)
openclaw update --tag main

# Installa uno package spec npm specifico
openclaw update --tag openclaw@2026.4.1-beta.1
```

Note:

- `--tag` si applica **solo alle installazioni package (npm)**. Le installazioni git lo ignorano.
- Il tag non viene reso persistente. Il tuo prossimo `openclaw update` userà normalmente il canale configurato.
- Protezione dal downgrade: se la versione target è più vecchia della tua versione corrente,
  OpenClaw chiede conferma (salta con `--yes`).
- `--channel beta` è diverso da `--tag beta`: il flusso del canale può tornare
  a stable/latest quando beta manca o è più vecchio, mentre `--tag beta` punta al
  dist-tag `beta` grezzo per quella singola esecuzione.

## Dry run

Anteprima di ciò che farebbe `openclaw update` senza apportare modifiche:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Il dry run mostra il canale effettivo, la versione target, le azioni pianificate e
se sarebbe richiesta una conferma di downgrade.

## Plugins e canali

Quando cambi canale con `openclaw update`, OpenClaw sincronizza anche le sorgenti dei plugin:

- `dev` preferisce i plugin inclusi dal checkout git.
- `stable` e `beta` ripristinano i pacchetti plugin installati tramite npm.
- I plugin installati tramite npm vengono aggiornati dopo il completamento dell'aggiornamento del core.

## Controllo dello stato corrente

```bash
openclaw update status
```

Mostra il canale attivo, il tipo di installazione (git o package), la versione corrente e
la sorgente (configurazione, tag git, branch git o predefinita).

## Best practice per il tagging

- Applica tag alle release su cui vuoi che i checkout git arrivino (`vYYYY.M.D` per stable,
  `vYYYY.M.D-beta.N` per beta).
- Anche `vYYYY.M.D.beta.N` è riconosciuto per compatibilità, ma preferisci `-beta.N`.
- I tag legacy `vYYYY.M.D-<patch>` sono ancora riconosciuti come stable (non-beta).
- Mantieni i tag immutabili: non spostare né riutilizzare mai un tag.
- I dist-tag npm restano la fonte di verità per le installazioni npm:
  - `latest` -> stable
  - `beta` -> build candidata o build stable pubblicata prima su beta
  - `dev` -> snapshot di main (facoltativo)

## Disponibilità dell'app macOS

Le build beta e dev potrebbero **non** includere una release dell'app macOS. Va bene così:

- Il tag git e il dist-tag npm possono comunque essere pubblicati.
- Indica "nessuna build macOS per questa beta" nelle note di rilascio o nel changelog.
