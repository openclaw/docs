---
read_when:
    - Vuoi passare da stable a extended-stable, beta o dev
    - Vuoi fissare una versione, un tag o uno SHA specifici
    - Stai contrassegnando o pubblicando versioni preliminari
sidebarTitle: Release Channels
summary: 'Canali stabile, stabile con supporto esteso, beta e di sviluppo: semantica, passaggio, blocco della versione e assegnazione dei tag'
title: Canali di rilascio
x-i18n:
    generated_at: "2026-07-12T07:10:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw viene distribuito tramite quattro canali di aggiornamento:

- **stable**: dist-tag npm `latest`. Consigliato per la maggior parte degli utenti.
- **extended-stable**: dist-tag npm `extended-stable`. Un nuovo canale di pacchetti
  relativo a un mese supportato precedente. È disponibile solo come pacchetto
  e l'installazione avviene esclusivamente in primo piano. Una selezione salvata
  riceve indicazioni di aggiornamento di sola lettura quando `update.checkOnStart`
  è abilitato, ma gli aggiornamenti non vengono mai applicati automaticamente.
- **beta**: dist-tag npm `beta`. Ripiega su `latest` quando `beta` non è disponibile
  o è precedente alla versione stabile corrente.
- **dev**: versione più recente e in continuo movimento di `main` (git). dist-tag
  npm `dev`, quando pubblicato. `main` è destinato alla sperimentazione e allo
  sviluppo attivo; può contenere funzionalità incomplete o modifiche incompatibili.
  Non utilizzarlo per Gateway di produzione.

Le build stabili vengono solitamente distribuite prima su **beta**, verificate
in tale canale e quindi promosse a **latest** senza incrementare la versione.
I manutentori possono anche pubblicare direttamente su `latest`. I dist-tag
costituiscono la fonte autorevole per le installazioni npm.

## Passaggio da un canale all'altro

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` salva la scelta in `update.channel` nella configurazione e determina
entrambi i percorsi di installazione:

| Canale            | Installazioni npm/pacchetto                                                                                                                                                                                                        | Installazioni git                                                                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                                                                   | tag git stabile più recente (esclude `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` e altri suffissi di prerelease denominati)                                                         |
| `extended-stable` | risolve il selettore npm pubblico `extended-stable`, verifica esattamente il pacchetto selezionato e installa quella versione esatta. In caso di errore si interrompe senza ripiegare su `latest`, `beta` o `dev`.                    | non supportato: OpenClaw lascia invariato il checkout e richiede di utilizzare un'installazione tramite pacchetto                                                                                                                     |
| `beta`            | dist-tag `beta`, con ripiego su `latest` quando `beta` non è disponibile o è precedente                                                                                                                                           | tag git beta più recente, con ripiego sul tag git stabile più recente quando la versione beta non è disponibile o è precedente                                                                                                      |
| `dev`             | dist-tag `dev` (raro; la maggior parte degli utenti dev utilizza installazioni git)                                                                                                                                                 | esegue il recupero, applica il rebase del checkout sul ramo `main` upstream, compila e reinstalla la CLI globale                                                                                                                      |

Per le installazioni git `dev`, il checkout predefinito è `~/openclaw` (oppure
`$OPENCLAW_HOME/openclaw` quando è impostato `OPENCLAW_HOME`); è possibile
sovrascriverlo con `OPENCLAW_GIT_DIR`.

<Tip>
Per mantenere stable e dev in parallelo, utilizza due checkout separati e indirizza ciascun Gateway al proprio checkout.
</Tip>

## Selezione temporanea di una versione o di un tag

Utilizza `--tag` per selezionare uno specifico dist-tag, una versione o una
specifica di pacchetto per un singolo aggiornamento **senza** modificare il
canale salvato:

```bash
# Installa una versione specifica
openclaw update --tag 2026.4.1-beta.1

# Installa dal dist-tag beta (una sola volta, senza salvare la scelta)
openclaw update --tag beta

# Passa al checkout mobile main di GitHub (persistente)
openclaw update --channel dev

# Installa una specifica di pacchetto npm
openclaw update --tag openclaw@2026.4.1-beta.1

# Installa una volta da main di GitHub senza salvare il canale
openclaw update --tag main
```

Note:

- `--tag` si applica **solo alle installazioni tramite pacchetto (npm)**; le
  installazioni git lo ignorano.
- Il tag non viene salvato; il successivo `openclaw update` utilizza il canale
  configurato.
- `--tag main` viene associato alla specifica compatibile con npm
  `github:openclaw/openclaw#main` per quella singola esecuzione. Per
  un'installazione persistente e mobile di `main`, utilizza
  `openclaw update --channel dev` (le installazioni tramite pacchetto passano
  a un checkout git) oppure reinstalla con il metodo git del programma di
  installazione:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Il percorso di installazione npm rifiuta esplicitamente le destinazioni
  basate su sorgenti GitHub/git e indirizza invece al metodo git.
- Protezione dal downgrade: se la versione di destinazione è precedente a
  quella corrente, OpenClaw richiede una conferma (ignorabile con `--yes`).
- Extended-stable utilizza sempre la propria destinazione esatta e verificata
  del pacchetto. Non è un alias temporaneo di `--tag extended-stable` e `--tag`
  non può essere combinato con un canale extended-stable effettivo.
- `--channel beta` è diverso da `--tag beta`: il flusso del canale può ripiegare
  su stable/latest quando beta non è disponibile o è precedente, mentre
  `--tag beta` seleziona sempre direttamente il dist-tag `beta` per quella
  singola esecuzione.

## Esecuzione di prova

Visualizza in anteprima le operazioni che `openclaw update` eseguirebbe senza
apportare modifiche:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

L'esecuzione di prova indica il canale effettivo, la versione di destinazione,
le azioni pianificate e se sarebbe necessaria una conferma per il downgrade.

## Plugin e canali

Il passaggio da un canale all'altro con `openclaw update` sincronizza anche le
sorgenti dei Plugin:

- `dev` riporta i Plugin installati che hanno una controparte inclusa alla
  rispettiva sorgente inclusa (checkout git).
- `stable` e `beta` ripristinano i pacchetti Plugin installati tramite npm o
  ClawHub.
- `extended-stable` risolve i Plugin npm ufficiali idonei con intento
  semplice/predefinito o `latest` alla stessa versione esatta del core
  installato. Non interroga i tag `@extended-stable` dei Plugin durante
  l'esecuzione.
- I Plugin installati tramite npm vengono aggiornati dopo il completamento
  dell'aggiornamento del core.

## Verifica dello stato corrente

```bash
openclaw update status
```

Mostra il canale attivo (insieme alla fonte che lo ha determinato:
configurazione, tag git, ramo git, versione installata o valore predefinito),
il tipo di installazione (git o pacchetto), la versione corrente e la
disponibilità di aggiornamenti.

## Procedure consigliate per i tag

- Assegna tag alle release che vuoi rendere disponibili ai checkout git:
  `vYYYY.M.PATCH` per stable, `vYYYY.M.PATCH-beta.N` per beta. I suffissi di
  prerelease denominati, come `-alpha.N`, `-rc.N` e `-next.N`, non sono
  destinazioni stable o beta.
- I tag stabili numerici precedenti, come `vYYYY.M.PATCH-1` e `v1.0.1-1`,
  vengono ancora riconosciuti come tag git stabili per compatibilità.
- Anche `vYYYY.M.PATCH.beta.N` (con separazione tramite punti) viene
  riconosciuto per compatibilità; preferisci `-beta.N`.
- Mantieni immutabili i tag: non spostare né riutilizzare mai un tag.
- I dist-tag npm restano la fonte autorevole per le installazioni npm:
  - `latest` -> stable
  - `extended-stable` -> release del pacchetto relativa a un mese supportato precedente
  - `beta` -> build candidata o build stabile pubblicata prima su beta
  - `dev` -> snapshot di main (facoltativa)

## Disponibilità dell'app per macOS

Le build beta e dev potrebbero **non** includere una release dell'app per
macOS. Non è un problema:

- Il tag git e il dist-tag npm possono comunque essere pubblicati
  autonomamente.
- Specifica "nessuna build macOS per questa beta" nelle note di rilascio o
  nel registro delle modifiche.

## Contenuti correlati

- [Aggiornamento](/it/install/updating)
- [Funzionamento interno del programma di installazione](/it/install/installer)
