---
read_when:
    - Vuoi passare tra stabile/beta/dev
    - Vuoi fissare una versione, un tag o uno SHA specifico
    - Stai taggando o pubblicando prerelease
sidebarTitle: Release Channels
summary: 'Canali stable, beta e dev: semantica, cambio, blocco della versione e tagging'
title: Canali di rilascio
x-i18n:
    generated_at: "2026-06-27T17:39:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribuisce tre canali di aggiornamento:

- **stable**: dist-tag npm `latest`. Consigliato per la maggior parte degli utenti.
- **beta**: dist-tag npm `beta` quando è corrente; se beta manca o è più vecchio della
  release stable più recente, il flusso di aggiornamento ripiega su `latest`.
- **dev**: head mobile di `main` (git). dist-tag npm: `dev` (quando pubblicato).
  Il branch `main` è destinato alla sperimentazione e allo sviluppo attivo. Può contenere
  funzionalità incomplete o modifiche incompatibili. Non usarlo per Gateway di produzione.

Di solito pubblichiamo prima le build stable su **beta**, le testiamo lì, poi eseguiamo un
passaggio esplicito di promozione che sposta la build verificata su `latest` senza
modificare il numero di versione. I manutentori possono anche pubblicare una release stable
direttamente su `latest` quando necessario. I dist-tag sono la fonte di verità per le
installazioni npm.

## Cambio di canale

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` salva la tua scelta nella configurazione (`update.channel`) e allinea il
metodo di installazione:

- **`stable`** (installazioni da pacchetto): aggiorna tramite il dist-tag npm `latest`.
- **`beta`** (installazioni da pacchetto): preferisce il dist-tag npm `beta`, ma ripiega su
  `latest` quando `beta` manca o è più vecchio del tag stable corrente.
- **`stable`** (installazioni git): esegue il checkout del tag git stable più recente, escludendo
  i tag semver di prerelease come `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` e altri suffissi di prerelease.
- **`beta`** (installazioni git): preferisce il tag git beta più recente, ma ripiega sul
  tag git stable più recente quando beta manca o è più vecchio.
- **`dev`**: garantisce un checkout git (predefinito `~/openclaw`, oppure
  `$OPENCLAW_HOME/openclaw` quando `OPENCLAW_HOME` è impostato; sovrascrivilo con
  `OPENCLAW_GIT_DIR`), passa a `main`, esegue il rebase sull'upstream, compila e
  installa la CLI globale da quel checkout.

<Tip>
Se vuoi stable e dev in parallelo, mantieni due cloni e punta il tuo Gateway a quello stable.
</Tip>

## Puntamento occasionale a versione o tag

Usa `--tag` per puntare a uno specifico dist-tag, versione o specifica di pacchetto per un singolo
aggiornamento **senza** modificare il canale salvato:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Note:

- `--tag` si applica **solo alle installazioni da pacchetto (npm)**. Le installazioni git lo ignorano.
- Il tag non viene salvato. Il prossimo `openclaw update` userà come al solito il
  canale configurato.
- Per le installazioni da pacchetto, OpenClaw preconfeziona le specifiche sorgente GitHub/git in un
  tarball temporaneo prima dell'installazione npm staged. Usa `--channel dev` o
  `--install-method git --version main` quando vuoi il checkout mobile di `main`
  come installazione persistente.
- Protezione dal downgrade: se la versione di destinazione è più vecchia della versione corrente,
  OpenClaw chiede conferma (salta con `--yes`).
- `--channel beta` è diverso da `--tag beta`: il flusso del canale può ripiegare
  su stable/latest quando beta manca o è più vecchio, mentre `--tag beta` punta al
  dist-tag `beta` grezzo per quella singola esecuzione.

## Dry run

Visualizza in anteprima cosa farebbe `openclaw update` senza apportare modifiche:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Il dry run mostra il canale effettivo, la versione di destinazione, le azioni pianificate e
se sarebbe richiesta una conferma di downgrade.

## Plugin e canali

Quando cambi canale con `openclaw update`, OpenClaw sincronizza anche le sorgenti dei Plugin:

- `dev` preferisce i Plugin inclusi dal checkout git.
- `stable` e `beta` ripristinano i pacchetti Plugin installati tramite npm.
- I Plugin installati tramite npm vengono aggiornati dopo il completamento dell'aggiornamento del core.

## Controllo dello stato corrente

```bash
openclaw update status
```

Mostra il canale attivo, il tipo di installazione (git o pacchetto), la versione corrente e
la sorgente (configurazione, tag git, branch git o predefinita).

## Best practice per i tag

- Tagga le release su cui vuoi che approdino i checkout git (`vYYYY.M.PATCH` per stable,
  `vYYYY.M.PATCH-beta.N` per beta; i suffissi semver di prerelease denominati come
  `-alpha.N`, `-rc.N` e `-next.N` non sono destinazioni stable).
- I tag stable numerici legacy come `vYYYY.M.PATCH-1` e `v1.0.1-1` sono ancora
  riconosciuti come tag git stable per compatibilità.
- Anche `vYYYY.M.PATCH.beta.N` è riconosciuto per compatibilità, ma preferisci `-beta.N`.
- Mantieni i tag immutabili: non spostare né riutilizzare mai un tag.
- I dist-tag npm restano la fonte di verità per le installazioni npm:
  - `latest` -> stable
  - `beta` -> build candidata o build stable pubblicata prima su beta
  - `dev` -> snapshot di main (facoltativo)

## Disponibilità dell'app macOS

Le build beta e dev potrebbero **non** includere una release dell'app macOS. Va bene:

- Il tag git e il dist-tag npm possono comunque essere pubblicati.
- Indica "nessuna build macOS per questa beta" nelle note di release o nel changelog.

## Correlati

- [Aggiornamento](/it/install/updating)
- [Dettagli interni dell'installer](/it/install/installer)
