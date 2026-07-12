---
read_when:
    - Stai convalidando l'ottimizzazione delle prestazioni e delle dimensioni dei pacchetti di maggio 2026
    - Ti servono i dati alla base dell’articolo del blog sulle prestazioni e sulle dipendenze di OpenClaw
    - Stai modificando i criteri di rilascio, lo shrinkwrap dei pacchetti o i confini delle dipendenze dei plugin
summary: Riepilogo visivo e riscontri tecnici per l'ottimizzazione di maggio 2026 relativa a prestazioni, dimensioni dei pacchetti, dipendenze e shrinkwrap
title: Analisi delle prestazioni della release
x-i18n:
    generated_at: "2026-07-12T07:30:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Questa pagina raccoglie le evidenze alla base dell'intervento di maggio 2026 su prestazioni, dimensioni del pacchetto, dipendenze e pulizia dello shrinkwrap di OpenClaw. È il complemento tecnico
al post pubblico del blog.

Qui sono combinati due audit:

- **Analisi delle prestazioni delle release:** GitHub Releases da `v2026.5.28` fino alla
  versione stabile `v2026.4.23`, usando il workflow `OpenClaw Performance`,
  `profile=smoke` e il percorso del provider simulato. La maggior parte delle righe dei tag usa un singolo campione; le
  righe `v2026.5.27` e `v2026.5.28` usano gli artefatti più recenti con 3 ripetizioni del ramo di release.
- **Contesto precedente di aprile:** baseline pubblicate del provider simulato in
  `clawgrit-reports` da `v2026.4.1` a `v2026.5.2`, usate esclusivamente per evitare di considerare
  le release difettose di fine aprile come baseline pubblica delle prestazioni.
- **Analisi dell'ingombro dell'installazione:** installazioni pulite tramite `npm install --ignore-scripts`
  in pacchetti temporanei, con `du -sk node_modules` per le dimensioni e una scansione di
  `node_modules` per il conteggio delle istanze dei pacchetti.
- **Analisi delle dimensioni del pacchetto npm:** `npm pack openclaw@<version> --dry-run --json`
  per le release pubblicate, registrando le dimensioni del tarball compresso, le dimensioni dopo l'estrazione e
  il numero di file.

<Warning>
L'analisi principale delle prestazioni usa un campione smoke per tag, eccetto le
righe `v2026.5.27` e `v2026.5.28`, che usano gli artefatti più recenti con 3 ripetizioni
del ramo di release. Il contesto precedente di aprile usa le mediane pubblicate di 3 ripetizioni
da `clawgrit-reports`. Considera i numeri come evidenza delle tendenze e
segnale per la ricerca di regressioni, non come statistiche per i criteri di rilascio.
</Warning>

## Riepilogo

Copertura delle prestazioni: **77 release richieste**, **74 punti supportati da artefatti**
e **3 esecuzioni CI non disponibili**. Ultimo punto stabile misurato: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Turno stabile dell'agente" icon="gauge">
    **Turno a freddo 5,1 volte più veloce**

    - `v2026.4.14`: 9,8 s
    - `v2026.5.28`: 1,9 s

  </Card>
  <Card title="Pacchetto pubblicato" icon="package">
    **Tarball da 17,9 MB**

    Ultimo pacchetto stabile, in calo rispetto al picco di marzo di 43,3 MB.

  </Card>
  <Card title="Ultima installazione stabile" icon="hard-drive">
    **Installazione pulita da 361,7 MiB**

    Riduce nettamente l'albero annidato delle dipendenze di OpenClaw rispetto al picco dovuto
    all'introduzione dello shrinkwrap in `2026.5.22`, sebbene nell'audit dell'installazione locale
    rimanga ancora un albero annidato più piccolo da 259,7 MiB.

  </Card>
  <Card title="Grafo delle dipendenze" icon="boxes">
    **300 pacchetti installati**

    Misurati come radici univoche per nome/versione del pacchetto in un'installazione pulita con
    gli script disabilitati; 71 radici in meno rispetto alla precedente release stabile.

  </Card>
</CardGroup>

## Cosa è cambiato nella versione 5.28

La pulizia tra `v2026.5.27` e `v2026.5.28` ha ridotto il
grafo dell'installazione predefinita, anziché rimuovere le funzionalità stesse.

<CardGroup cols={2}>
  <Card title="Grafo radice predefinito" icon="git-branch">
    Le radici univoche per nome/versione del pacchetto sono scese da **371** a **300**. Le istanze dei pacchetti
    sono scese da **372** a **301**.
  </Card>
  <Card title="Albero annidato" icon="unplug">
    Il percorso annidato `openclaw/node_modules` è sceso da **656,1 MiB** a **259,7 MiB** nello
    stesso audit dell'installazione locale.
  </Card>
  <Card title="Coni nativi opzionali" icon="cpu">
    Il cono dei pacchetti nativi multipiattaforma di `@napi-rs/canvas` non viene più incluso
    nell'installazione predefinita.
  </Card>
  <Card title="Superficie della catena di fornitura" icon="shield">
    Meno pacchetti predefiniti significano meno tarball, manutentori, binari nativi,
    comportamenti in fase di installazione e percorsi di aggiornamento transitivi da considerare attendibili per impostazione predefinita.
  </Card>
</CardGroup>

<Tip>
Lo shrinkwrap non era di per sé il problema. Lo era la struttura inadeguata del pacchetto.
`v2026.5.28` include ancora lo shrinkwrap, ma l'albero annidato delle dipendenze è molto
più piccolo e nell'audit locale è stata eliminata la distribuzione multipiattaforma di canvas.
</Tip>

## Dati principali

Non usare le righe difettose di fine aprile come baseline pubbliche delle prestazioni.
`v2026.4.23` e `v2026.4.29` sono utili come evidenza di regressione, ma le grandi
variazioni nell'ordine di `14x` descrivono principalmente il recupero da una serie di release problematica.

Per la narrazione del blog, usa la baseline pubblicata all'inizio di aprile come riferimento di scala.
La baseline è `v2026.4.14` dell'esecuzione pubblicata con provider simulato in
`clawgrit-reports` (3 ripetizioni; tale esecuzione non è riuscita soltanto perché non è stata
generata la sequenza temporale diagnostica, quindi le mediane a freddo, a caldo e RSS restano comunque utili
come indicazione approssimativa). Considerala come contesto narrativo, non come statistica
per i criteri di rilascio.

| Metrica         | Baseline di inizio aprile | `v2026.5.28` |                         Variazione |
| --------------- | ------------------------: | -----------: | ---------------------------------: |
| Turno dell'agente a freddo |          9.819 ms |     1.908 ms | 80,6% in meno, 5,1 volte più veloce |
| Turno dell'agente a caldo |           7.458 ms |     1.870 ms | 74,9% in meno, 4,0 volte più veloce |
| Picco RSS dell'agente |                 686,2 MB |      581,0 MB |                     15,3% in meno |

Nell'analisi di maggio, l'ultima riga del ramo di release è migliorata in modo sostanziale rispetto a
`v2026.5.2`:

| Metrica         | `v2026.5.2` | `v2026.5.28` |    Variazione |
| --------------- | ----------: | -----------: | ------------: |
| Turno dell'agente a freddo |  3.897 ms |     1.908 ms | 51,0% in meno |
| Turno dell'agente a caldo |   3.610 ms |     1.870 ms | 48,2% in meno |
| Picco RSS dell'agente |          613,7 MB |      581,0 MB |  5,3% in meno |

Rispetto alla precedente release stabile:

| Metrica         | `v2026.5.27` | `v2026.5.28` |    Variazione |
| --------------- | -----------: | -----------: | ------------: |
| Turno dell'agente a freddo |   2.231 ms |     1.908 ms | 14,5% in meno |
| Turno dell'agente a caldo |    2.226 ms |     1.870 ms | 16,0% in meno |
| Picco RSS dell'agente |           649,0 MB |      581,0 MB | 10,5% in meno |

### Ingombro dell'installazione

| Metrica                                         | Baseline | `v2026.5.28` |    Variazione |
| ----------------------------------------------- | -------: | -----------: | ------------: |
| Dimensioni dell'installazione dal picco `2026.5.22` | 1.020,6 MB | 361,7 MiB | 64,6% in meno |
| Dimensioni dell'installazione dall'ultima release `2026.5.27` | 767,1 MiB | 361,7 MiB | 52,8% in meno |
| Dipendenze dal massimo mensile `2026.2.26`      |      645 |          300 | 53,5% in meno |
| Dipendenze dall'ultima release `2026.5.27`      |      371 |          300 | 19,1% in meno |
| Percorso annidato `openclaw/node_modules` da `2026.5.22` | 911,8 MB | 259,7 MiB | 71,5% in meno |
| Percorso annidato `openclaw/node_modules` da `2026.5.27` | 656,1 MiB | 259,7 MiB | 60,4% in meno |

### Dimensioni del pacchetto npm

| Versione    | Tarball compresso | Pacchetto estratto |   File | Note                                      |
| ----------- | -----------------: | -----------------: | -----: | ----------------------------------------- |
| `2026.1.30` |            12,8 MB |            33,5 MB |  4.607 | primo pacchetto con il nuovo marchio      |
| `2026.2.26` |            23,6 MB |            82,9 MB | 10.125 | crescita delle funzionalità               |
| `2026.3.31` |            43,3 MB |           182,6 MB | 21.037 | picco delle dimensioni del pacchetto      |
| `2026.4.29` |            22,9 MB |            74,6 MB |  9.309 | riduzione del pacchetto visibile          |
| `2026.5.12` |            23,4 MB |            80,1 MB | 12.035 | importante separazione dei Plugin esterni |
| `2026.5.22` |            17,2 MB |            76,9 MB | 12.386 | documentazione/risorse escluse dal pacchetto |
| `2026.5.27` |            17,8 MB |            79,0 MB | 12.509 | precedente pacchetto stabile              |
| `2026.5.28` |            17,9 MB |            81,0 MB |  9.082 | ultimo pacchetto stabile                  |

`2026.5.12` è il traguardo visibile dell'estrazione dei Plugin nel changelog:
Amazon Bedrock, Bedrock Mantle, Slack, sandbox OpenShell, Anthropic Vertex,
Matrix e WhatsApp sono stati rimossi dal percorso delle dipendenze principali, in modo che i relativi coni di dipendenze
vengano installati con tali Plugin anziché con ogni installazione del nucleo.

## Riepilogo dei turni dell'agente Kova

La serie stabile di aprile contiene due storie diverse. L'inizio di aprile era lento,
ma riconoscibile. La fine di aprile ha segnato un crollo dovuto a una regressione. `v2026.5.2` è il punto in cui
il percorso del provider simulato scende per la prima volta nell'intervallo di 3-5 secondi e inizia a
riuscire con costanza nell'analisi fornita.

Contesto pubblicato in precedenza:

| Release      | Kova | Turno a freddo | Turno a caldo | Picco RSS dell'agente |
| ------------ | ---- | --------------: | -------------: | --------------------: |
| `v2026.4.10` | NON RIUSCITO | 11.031 ms |  7.962 ms | 679,0 MB |
| `v2026.4.12` | NON RIUSCITO | 11.965 ms |  8.289 ms | 713,5 MB |
| `v2026.4.14` | NON RIUSCITO |  9.819 ms |  7.458 ms | 686,2 MB |
| `v2026.4.20` | NON RIUSCITO | 22.314 ms | 18.811 ms | 810,8 MB |
| `v2026.4.22` | NON RIUSCITO |  9.630 ms |  7.459 ms | 743,0 MB |

Analisi fornita:

| Release             | Kova | Turno a freddo | Turno a caldo | Picco RSS dell'agente |
| ------------------- | ---- | --------------: | -------------: | --------------------: |
| `v2026.4.23`        | NON RIUSCITO | 47.847 ms |  8.010 ms | 1.082,7 MB |
| `v2026.4.24`        | NON RIUSCITO | 48.264 ms | 25.483 ms |   996,0 MB |
| `v2026.4.25`        | NON RIUSCITO | 81.080 ms | 59.172 ms | 1.113,9 MB |
| `v2026.4.26`        | NON RIUSCITO | 76.771 ms | 54.941 ms | 1.140,8 MB |
| `v2026.4.27`        | NON RIUSCITO | 60.902 ms | 33.699 ms | 1.156,0 MB |
| `v2026.4.29`        | NON RIUSCITO | 94.031 ms | 57.334 ms | 3.613,7 MB |
| `v2026.5.2`         | RIUSCITO |  3.897 ms |  3.610 ms | 613,7 MB |
| `v2026.5.7`         | RIUSCITO |  3.923 ms |  3.693 ms | 654,1 MB |
| `v2026.5.12`        | RIUSCITO |  7.248 ms |  6.629 ms | 834,8 MB |
| `v2026.5.18`        | RIUSCITO |  3.301 ms |  2.913 ms | 630,3 MB |
| `v2026.5.20`        | RIUSCITO |  3.413 ms |  2.952 ms | 643,2 MB |
| `v2026.5.22`        | RIUSCITO |  4.494 ms |  4.093 ms | 654,3 MB |
| `v2026.5.26`        | RIUSCITO |  2.626 ms |  2.282 ms | 660,4 MB |
| `v2026.5.27-beta.1` | RIUSCITO |  2.575 ms |  2.217 ms | 635,3 MB |
| `v2026.5.27`        | RIUSCITO |  2.231 ms |  2.226 ms | 649,0 MB |
| `v2026.5.28`        | RIUSCITO |  1.908 ms |  1.870 ms | 581,0 MB |

## Sonde del codice sorgente

Le sonde del codice sorgente sono state omesse per 17 riferimenti precedenti riusciti perché i relativi alberi
del codice sorgente non disponevano ancora dei punti di ingresso richiesti per le sonde. Le metriche dei turni dell'agente
esistono comunque per tali riferimenti.

Punti rappresentativi delle sonde del codice sorgente:

| Release             | `readyz` predefinito p50 | `readyz` con 50 Plugin p50 | Integrità CLI p50 | RSS massimo dei Plugin |
| ------------------- | -----------------------: | --------------------------: | ----------------: | ---------------------: |
| `v2026.4.29`        |                 2.819 ms |                    2.618 ms |          1.679 ms |               389,0 MB |
| `v2026.5.2`         |                 2.324 ms |                    2.013 ms |          1.384 ms |               377,2 MB |
| `v2026.5.7`         |                 1.649 ms |                    1.540 ms |          1.175 ms |               387,6 MB |
| `v2026.5.18`        |                 1.942 ms |                    1.927 ms |            607 ms |               426,5 MB |
| `v2026.5.20`        |                 1.966 ms |                    1.987 ms |            621 ms |               455,0 MB |
| `v2026.5.22`        |                 2.081 ms |                    1.884 ms |          5.095 ms |               444,2 MB |
| `v2026.5.26`        |                 1.546 ms |                    1.634 ms |            656 ms |               400,4 MB |
| `v2026.5.27-beta.1` |                 1.462 ms |                    1.548 ms |            548 ms |               394,0 MB |
| `v2026.5.27`        |                 1.491 ms |                    1.571 ms |            553 ms |               401,5 MB |
| `v2026.5.28`        |                 1.457 ms |                    1.474 ms |            623 ms |               386,1 MB |

Il picco di integrità della CLI in `v2026.5.22` è visibile in questa tabella, anche se il
percorso dei turni dell'agente è comunque riuscito. Mantieni le sonde del codice sorgente quando analizzi
regressioni mirate della CLI o del Gateway.

## Audit dell'ingombro dell'installazione

I campioni delle dipendenze usano una release stabile per mese, oltre all'evento di
introduzione dello shrinkwrap in `2026.5.22` e all'ultima release `2026.5.28`.

| Punto              | Dipendenze installate | Installazione pulita | Pacchetto OpenClaw | `openclaw/node_modules` annidato | Shrinkwrap radice | Comportamento di installazione di Canvas            |
| ------------------ | ---------------------: | -------------------: | -----------------: | --------------------------------: | ----------------- | --------------------------------------------------- |
| Gen `2026.1.30`    |                    605 |              438.4MB |             45.8MB |                             2.4MB | no                | wrapper di primo livello + `darwin-arm64`            |
| Feb `2026.2.26`    |                    645 |              575.7MB |            110.1MB |                             3.5MB | no                | wrapper di primo livello + `darwin-arm64`            |
| Mar `2026.3.31`    |                    438 |              584.1MB |            234.8MB |                               0MB | no                | wrapper di primo livello + `darwin-arm64`            |
| Apr `2026.4.29`    |                    392 |              335.0MB |             97.4MB |                               0MB | no                | nessuno installato                                   |
| `2026.5.22`        |                    401 |            1,020.6MB |          1,020.4MB |                           911.8MB | sì                | annidati: tutti i 12 pacchetti `@napi-rs/canvas`     |
| Mag `2026.5.26`    |                    371 |              767.5MB |            767.4MB |                           656.4MB | sì                | annidati: tutti i 12 pacchetti `@napi-rs/canvas`     |
| `2026.5.27`        |                    371 |             767.1MiB |           766.9MiB |                          656.1MiB | sì                | annidati: tutti i 12 pacchetti `@napi-rs/canvas`     |
| Più recente `2026.5.28` |              300 |             361.7MiB |           361.6MiB |                          259.7MiB | sì                | nessuno installato                                   |

### Confine dello shrinkwrap

`2026.5.20` è stato distribuito senza uno shrinkwrap radice e senza un grande albero
di dipendenze OpenClaw annidato. `2026.5.22` ha introdotto lo shrinkwrap radice e installato 911.8MB
nel percorso annidato `openclaw/node_modules`. `2026.5.28` mantiene lo shrinkwrap e installa
ancora 259.7MiB nel percorso annidato `openclaw/node_modules`, ma non installa più
alcun pacchetto `@napi-rs/canvas` nel controllo locale dell'installazione pulita.

L'ispezione del tarball pubblicato verifica il confine:

| Versione     | Versione stabile pubblicata? | `npm-shrinkwrap.json` radice | Note                                               |
| ------------ | ----------------------------- | ---------------------------- | -------------------------------------------------- |
| `2026.5.20`  | sì                            | no                           | ultima versione stabile prima dello shrinkwrap     |
| `2026.5.21`  | no                            | n/d                          | nessuna versione npm stabile                       |
| `2026.5.22`  | sì                            | sì                           | shrinkwrap introdotto                              |
| `2026.5.23`  | no                            | n/d                          | nessuna versione npm stabile                       |
| `2026.5.24`  | no                            | n/d                          | nessuna versione npm stabile                       |
| `2026.5.25`  | no                            | n/d                          | nessuna versione npm stabile                       |
| `2026.5.26`  | sì                            | sì                           | albero di dipendenze annidato ancora presente      |
| `2026.5.27`  | sì                            | sì                           | albero di dipendenze annidato ancora presente      |
| `2026.5.28`  | sì                            | sì                           | albero di dipendenze annidato molto più piccolo    |

La distinzione importante: **lo shrinkwrap in sé non è il problema**.
`v2026.5.28` include ancora lo shrinkwrap radice. Il problema era la struttura del pacchetto
che induceva npm a materializzare un grande albero di dipendenze OpenClaw annidato e tutti i 12
pacchetti di piattaforma `@napi-rs/canvas`. L'albero annidato è più piccolo in `v2026.5.28`
e la proliferazione multipiattaforma di Canvas non compare più nel controllo locale.

Per una spiegazione in linguaggio semplice dello shrinkwrap e dei controlli dei pacchetti
a livello di manutentore, consulta [shrinkwrap npm](/it/gateway/security/shrinkwrap).

## Interpretazione della catena di fornitura

Il numero di dipendenze è una metrica di sicurezza operativa, non soltanto una metrica
delle dimensioni di installazione. Ogni pacchetto amplia l'insieme di manutentori, tarball,
aggiornamenti transitivi, binari nativi facoltativi e comportamenti durante l'installazione
di cui gli operatori devono fidarsi.

La direzione della razionalizzazione è:

- mantenere le funzionalità pesanti e facoltative fuori dall'installazione predefinita del nucleo
- fare in modo che i pacchetti dei Plugin siano responsabili del proprio grafo di dipendenze di runtime
- evitare interventi correttivi del gestore di pacchetti durante l'avvio del Gateway
- preservare installazioni deterministiche senza causare la materializzazione dei pacchetti
  nativi per tutte le piattaforme
- mantenere disabilitati gli script di installazione nei percorsi di accettazione e misurazione
  dei pacchetti
- rilevare gli alberi di dipendenze annidati e le esplosioni di dipendenze native facoltative prima
  della pubblicazione

Documentazione correlata:

- [Risoluzione delle dipendenze dei Plugin](/it/plugins/dependency-resolution)
- [Inventario dei Plugin](/it/plugins/plugin-inventory)
- [Convalida completa della versione](/it/reference/full-release-validation)
