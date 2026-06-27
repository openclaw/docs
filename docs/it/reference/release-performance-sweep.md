---
read_when:
    - Stai convalidando la pulizia di maggio 2026 delle prestazioni e delle dimensioni dei pacchetti
    - Ti servono i numeri dietro il post del blog sulle prestazioni e le dipendenze di OpenClaw
    - Stai modificando i gate di rilascio, lo shrinkwrap del pacchetto o i confini delle dipendenze dei plugin
summary: Riepilogo visivo ed evidenza tecnica per la pulizia di maggio 2026 relativa a prestazioni, dimensione del pacchetto, dipendenze e shrinkwrap
title: Revisione delle prestazioni del rilascio
x-i18n:
    generated_at: "2026-06-27T18:13:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Questa pagina raccoglie le prove alla base della pulizia di maggio 2026 di prestazioni,
dimensione del pacchetto, dipendenze e shrinkwrap di OpenClaw. È il complemento tecnico
al post pubblico del blog.

Qui sono combinati due audit:

- **Analisi delle prestazioni di release:** GitHub Releases da `v2026.5.28` fino alla
  stabile `v2026.4.23`, usando il workflow `OpenClaw Performance`,
  `profile=smoke`, corsia mock-provider. La maggior parte delle righe dei tag è un campione; le
  righe `v2026.5.27` e `v2026.5.28` usano gli ultimi artefatti repeat-3 del ramo di release.
- **Contesto precedente di aprile:** baseline mock-provider pubblicate in
  `clawgrit-reports` da `v2026.4.1` a `v2026.5.2`, usate solo per evitare di trattare
  le release problematiche di fine aprile come baseline pubblica delle prestazioni.
- **Analisi dell'impronta di installazione:** installazioni fresche con `npm install --ignore-scripts`
  in pacchetti temporanei, con `du -sk node_modules` per la dimensione e una
  scansione di `node_modules` per i conteggi delle istanze di pacchetto.
- **Analisi della dimensione del pacchetto npm:** `npm pack openclaw@<version> --dry-run --json`
  per le release pubblicate, registrando la dimensione del tarball compresso, la dimensione decompressa e
  il conteggio dei file.

<Warning>
L'analisi principale delle prestazioni usa un campione smoke per tag, tranne le
righe `v2026.5.27` e `v2026.5.28`, che usano gli ultimi artefatti repeat-3
del ramo di release. Il contesto precedente di aprile usa le mediane repeat-3
pubblicate da `clawgrit-reports`. Considera i numeri come prova di tendenza e
segnale per la ricerca di regressioni, non come statistiche di gate di release.
</Warning>

## Istantanea

Copertura delle prestazioni: **77 release richieste**, **74 punti basati su artefatti**
e **3 esecuzioni CI non disponibili**. Ultimo punto stabile misurato: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **Turn cold 5,1x più veloce**

    - `v2026.4.14`: 9,8s
    - `v2026.5.28`: 1,9s

  </Card>
  <Card title="Published package" icon="package">
    **Tarball da 17,9MB**

    Ultimo pacchetto stabile, in calo rispetto al picco di dimensione del pacchetto di marzo di 43,3MB.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **Installazione fresca da 361,7MiB**

    `v2026.5.28` riduce drasticamente l'albero di dipendenze annidato di OpenClaw, ma
    nell'audit dell'installazione locale rimane ancora un albero annidato più piccolo da 259,7MiB.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 pacchetti installati**

    Ultima release stabile, misurata come radici uniche nome/versione di pacchetto in una
    installazione fresca con script disabilitati.

  </Card>
</CardGroup>

## Cronologia dell'impronta di installazione

<CardGroup cols={2}>
  <Card title="Monthly high" icon="triangle-alert">
    **645 dipendenze**

    `2026.2.26` è stato il massimo mensile del conteggio delle dipendenze in questo campione.

  </Card>
  <Card title="Shrinkwrap introduced" icon="lock">
    **Installazione da 1.020,6MB**

    `2026.5.22` ha aggiunto lo shrinkwrap radice e ha esposto un problema di forma del pacchetto:
    911,8MB sono finiti sotto `openclaw/node_modules` annidato.

  </Card>
  <Card title="Latest stable" icon="tag">
    **Installazione da 361,7MiB**

    `2026.5.28` riduce la dimensione dell'installazione fresca del 52,8% rispetto a `2026.5.27`, ma
    installa ancora un albero OpenClaw annidato da 259,7MiB.

  </Card>
  <Card title="Dependency graph" icon="scissors">
    **300 radici di pacchetto**

    `2026.5.28` installa 71 radici uniche nome/versione di pacchetto in meno rispetto a
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Lo shrinkwrap non era il problema di per sé. Lo era la forma errata del pacchetto.
`v2026.5.28` distribuisce ancora lo shrinkwrap, ma l'albero di dipendenze annidato è molto
più piccolo e il fanout canvas per tutte le piattaforme è sparito nell'audit locale.
</Tip>

## Cosa è cambiato nella 5.28

La pulizia tra `v2026.5.27` e `v2026.5.28` ha ridotto il grafo dell'installazione predefinita invece di rimuovere le capacità stesse.

<CardGroup cols={2}>
  <Card title="Grafo radice predefinito" icon="git-branch">
    Le radici univoche nome/versione dei pacchetti sono scese da **371** a **300**. Le istanze dei pacchetti sono scese da **372** a **301**.
  </Card>
  <Card title="Albero annidato" icon="unplug">
    `openclaw/node_modules` annidato è sceso da **656.1MiB** a **259.7MiB** nello stesso audit dell'installazione locale.
  </Card>
  <Card title="Coni nativi opzionali" icon="cpu">
    Il cono di pacchetti nativi multipiattaforma `@napi-rs/canvas` ha smesso di finire nell'installazione predefinita.
  </Card>
  <Card title="Superficie della catena di fornitura" icon="shield">
    Meno pacchetti predefiniti significano meno tarball, maintainer, binari nativi, comportamenti in fase di installazione e percorsi di aggiornamento transitivi da considerare affidabili per impostazione predefinita.
  </Card>
</CardGroup>

## Numeri principali

Non usare le righe rotte di fine aprile come baseline pubbliche delle prestazioni. `v2026.4.23` e `v2026.4.29` sono utili come prova di regressione, ma i grandi delta in stile `14x` descrivono soprattutto il recupero da una linea di release problematica.

Per la narrazione del blog, usa come scala la baseline pubblicata di inizio aprile:

| Metrica          | Baseline di inizio aprile | `v2026.5.28` |                    Delta |
| --------------- | ---------------------: | -----------: | -----------------------: |
| Turno agente a freddo |                9,819ms |      1,908ms | 80.6% in meno, 5.1x più veloce |
| Turno agente a caldo |                7,458ms |      1,870ms | 74.9% in meno, 4.0x più veloce |
| RSS di picco agente  |                686.2MB |      581.0MB |              15.3% in meno |

La baseline di inizio aprile è `v2026.4.14` dalla run mock-provider pubblicata in `clawgrit-reports`. Quella run usava repeat 3 ed è fallita solo perché la timeline diagnostica non è stata emessa; le mediane a freddo, a caldo e RSS restano utili come scala approssimativa. Considerala contesto narrativo, non una statistica da gate di release.

All'interno dello sweep di maggio, l'ultima riga del branch di release si è spostata in modo materiale da `v2026.5.2`:

| Metrica          | `v2026.5.2` | `v2026.5.28` |       Delta |
| --------------- | ----------: | -----------: | ----------: |
| Turno agente a freddo |     3,897ms |      1,908ms | 51.0% in meno |
| Turno agente a caldo |     3,610ms |      1,870ms | 48.2% in meno |
| RSS di picco agente  |     613.7MB |      581.0MB |  5.3% in meno |

Rispetto alla release stabile precedente:

| Metrica          | `v2026.5.27` | `v2026.5.28` |       Delta |
| --------------- | -----------: | -----------: | ----------: |
| Turno agente a freddo |      2,231ms |      1,908ms | 14.5% in meno |
| Turno agente a caldo |      2,226ms |      1,870ms | 16.0% in meno |
| RSS di picco agente  |      649.0MB |      581.0MB | 10.5% in meno |

### Impronta dell'installazione

| Metrica                                          |  Baseline | `v2026.5.28` |       Delta |
| ----------------------------------------------- | --------: | -----------: | ----------: |
| Dimensione dell'installazione dal picco `2026.5.22`              | 1,020.6MB |     361.7MiB | 64.6% in meno |
| Dimensione dell'installazione dall'ultima release `2026.5.27`    |  767.1MiB |     361.7MiB | 52.8% in meno |
| Dipendenze dal massimo mensile `2026.2.26`      |       645 |          300 | 53.5% in meno |
| Dipendenze dall'ultima release `2026.5.27`    |       371 |          300 | 19.1% in meno |
| `openclaw/node_modules` annidato da `2026.5.22` |   911.8MB |     259.7MiB | 71.5% in meno |
| `openclaw/node_modules` annidato da `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% in meno |

### Dimensione del pacchetto npm

| Versione     | Tarball compresso | Pacchetto decompresso |  File | Note                             |
| ----------- | -----------------: | ---------------: | -----: | --------------------------------- |
| `2026.1.30` |             12.8MB |           33.5MB |  4,607 | pacchetto iniziale con nuovo brand           |
| `2026.2.26` |             23.6MB |           82.9MB | 10,125 | crescita delle funzionalità                    |
| `2026.3.31` |             43.3MB |          182.6MB | 21,037 | massimo della dimensione del pacchetto           |
| `2026.4.29` |             22.9MB |           74.6MB |  9,309 | potatura del pacchetto visibile           |
| `2026.5.12` |             23.4MB |           80.1MB | 12,035 | grande separazione dei plugin esterni       |
| `2026.5.22` |             17.2MB |           76.9MB | 12,386 | docs/asset esclusi dal pacchetto |
| `2026.5.27` |             17.8MB |           79.0MB | 12,509 | pacchetto stabile precedente           |
| `2026.5.28` |             17.9MB |           81.0MB |  9,082 | ultimo pacchetto stabile             |

`2026.5.12` è il milestone visibile dell'estrazione dei plugin nel changelog: Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex, Matrix e WhatsApp sono usciti dal percorso delle dipendenze core, così i loro coni di dipendenze vengono installati con quei plugin invece che con ogni installazione core.

## Riepilogo dei turni agente Kova

La linea stabile di aprile contiene due storie diverse. L'inizio di aprile era lento ma riconoscibile. La fine di aprile è diventata un precipizio di regressione. `v2026.5.2` è il punto in cui la lane mock-provider scende per la prima volta nell'intervallo 3-5s e inizia a passare in modo costante nello sweep fornito.

Contesto pubblicato precedente:

| Release      | Kova | Turno a freddo | Turno a caldo | RSS di picco agente |
| ------------ | ---- | --------: | --------: | -------------: |
| `v2026.4.10` | FAIL |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | FAIL |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | FAIL |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | FAIL |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | FAIL |   9,630ms |   7,459ms |        743.0MB |

Sweep fornito:

| Release             | Kova | Turno a freddo | Turno a caldo | RSS di picco agente |
| ------------------- | ---- | --------: | --------: | -------------: |
| `v2026.4.23`        | FAIL |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | FAIL |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | FAIL |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | FAIL |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | FAIL |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | FAIL |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | PASS |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | PASS |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | PASS |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | PASS |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | PASS |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | PASS |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | PASS |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | PASS |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | PASS |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | PASS |   1,908ms |   1,870ms |        581.0MB |

## Probe sorgente

Le probe sorgente sono state saltate per 17 ref precedenti riuscite perché quegli alberi sorgente non avevano ancora gli entry point di probe richiesti. Le metriche dei turni agente esistono comunque per quelle ref.

Punti rappresentativi delle probe sorgente:

| Release             | `readyz` predefinito p50 | 50 plugin `readyz` p50 | Health CLI p50 | RSS massimo plugin |
| ------------------- | -------------------: | ----------------------: | -------------: | -------------: |
| `v2026.4.29`        |              2,819ms |                 2,618ms |        1,679ms |        389.0MB |
| `v2026.5.2`         |              2,324ms |                 2,013ms |        1,384ms |        377.2MB |
| `v2026.5.7`         |              1,649ms |                 1,540ms |        1,175ms |        387.6MB |
| `v2026.5.18`        |              1,942ms |                 1,927ms |          607ms |        426.5MB |
| `v2026.5.20`        |              1,966ms |                 1,987ms |          621ms |        455.0MB |
| `v2026.5.22`        |              2,081ms |                 1,884ms |        5,095ms |        444.2MB |
| `v2026.5.26`        |              1,546ms |                 1,634ms |          656ms |        400.4MB |
| `v2026.5.27-beta.1` |              1,462ms |                 1,548ms |          548ms |        394.0MB |
| `v2026.5.27`        |              1,491ms |                 1,571ms |          553ms |        401.5MB |
| `v2026.5.28`        |              1,457ms |                 1,474ms |          623ms |        386.1MB |

Il picco di salute della CLI `v2026.5.22` è visibile in questa tabella anche se la
lane agent-turn è comunque passata. Conserva le sonde sorgente quando indaghi
regressioni mirate della CLI o del Gateway.

## Audit dell'impronta di installazione

I campioni delle dipendenze usano una release stabile per mese, più l'evento di
introduzione dello shrinkwrap `2026.5.22` e l'ultima release `2026.5.28`.

| Punto              | Dipendenze installate | Installazione fresca | Pacchetto OpenClaw | `openclaw/node_modules` annidato | Shrinkwrap root | Comportamento di installazione di Canvas  |
| ------------------ | --------------------: | -------------------: | -----------------: | --------------------------------: | --------------- | ----------------------------------------- |
| Gen `2026.1.30`    |                   605 |              438.4MB |             45.8MB |                             2.4MB | no              | wrapper di primo livello + `darwin-arm64` |
| Feb `2026.2.26`    |                   645 |              575.7MB |            110.1MB |                             3.5MB | no              | wrapper di primo livello + `darwin-arm64` |
| Mar `2026.3.31`    |                   438 |              584.1MB |            234.8MB |                               0MB | no              | wrapper di primo livello + `darwin-arm64` |
| Apr `2026.4.29`    |                   392 |              335.0MB |             97.4MB |                               0MB | no              | nessuno installato                        |
| `2026.5.22`        |                   401 |            1,020.6MB |          1,020.4MB |                           911.8MB | sì              | annidati: tutti i 12 pacchetti `@napi-rs/canvas` |
| Mag `2026.5.26`    |                   371 |              767.5MB |            767.4MB |                           656.4MB | sì              | annidati: tutti i 12 pacchetti `@napi-rs/canvas` |
| `2026.5.27`        |                   371 |             767.1MiB |           766.9MiB |                          656.1MiB | sì              | annidati: tutti i 12 pacchetti `@napi-rs/canvas` |
| Ultima `2026.5.28` |                   300 |             361.7MiB |           361.6MiB |                          259.7MiB | sì              | nessuno installato                        |

### Confine dello shrinkwrap

<CardGroup cols={2}>
  <Card title="Prima dello shrinkwrap" icon="unlock">
    `2026.5.20` non ha uno shrinkwrap root né un grande albero annidato di
    dipendenze OpenClaw.
  </Card>
  <Card title="Introdotto" icon="lock">
    `2026.5.22` aggiunge lo shrinkwrap root e installa 911.8MB sotto
    `openclaw/node_modules` annidato.
  </Card>
  <Card title="Ultima stabile" icon="tag">
    `2026.5.28` mantiene lo shrinkwrap e installa ancora 259.7MiB sotto
    `openclaw/node_modules` annidato.
  </Card>
  <Card title="Fanout di Canvas corretto" icon="check">
    `2026.5.28` non installa più alcun pacchetto `@napi-rs/canvas` nell'audit
    locale di installazione fresca.
  </Card>
</CardGroup>

L'ispezione dei tarball pubblicati verifica il confine:

| Versione    | Stabile pubblicata? | `npm-shrinkwrap.json` root | Note                                      |
| ----------- | ------------------- | -------------------------- | ----------------------------------------- |
| `2026.5.20` | sì                  | no                         | ultima release stabile prima dello shrinkwrap |
| `2026.5.21` | no                  | n/d                        | nessuna release npm stabile               |
| `2026.5.22` | sì                  | sì                         | shrinkwrap introdotto                     |
| `2026.5.23` | no                  | n/d                        | nessuna release npm stabile               |
| `2026.5.24` | no                  | n/d                        | nessuna release npm stabile               |
| `2026.5.25` | no                  | n/d                        | nessuna release npm stabile               |
| `2026.5.26` | sì                  | sì                         | albero di dipendenze annidato ancora presente |
| `2026.5.27` | sì                  | sì                         | albero di dipendenze annidato ancora presente |
| `2026.5.28` | sì                  | sì                         | albero di dipendenze annidato molto più piccolo |

La distinzione importante: **lo shrinkwrap in sé non è il problema**.
`v2026.5.28` distribuisce ancora lo shrinkwrap root. Il problema era la forma del
pacchetto che faceva materializzare a npm un grande albero annidato di
dipendenze OpenClaw e tutti i 12 pacchetti di piattaforma
`@napi-rs/canvas`. L'albero annidato è più piccolo in `v2026.5.28` e il fanout
delle piattaforme canvas non compare più nell'audit locale.

Per una spiegazione in linguaggio semplice dello shrinkwrap e dei controlli dei
pacchetti a livello di manutentore, consulta [npm shrinkwrap](/it/gateway/security/shrinkwrap).

## Interpretazione della supply chain

Il conteggio delle dipendenze è una metrica di sicurezza operativa, non solo una
metrica della dimensione di installazione. Ogni pacchetto espande l'insieme di
manutentori, tarball, aggiornamenti transitivi, binari nativi opzionali e
comportamenti in fase di installazione di cui gli operatori devono fidarsi.

La direzione della pulizia è:

- mantenere le capacità pesanti e opzionali fuori dall'installazione core predefinita
- fare in modo che i pacchetti Plugin possiedano il proprio grafo di dipendenze di runtime
- evitare riparazioni del gestore pacchetti a runtime durante l'avvio del Gateway
- preservare installazioni deterministiche senza causare la materializzazione di pacchetti
  nativi per tutte le piattaforme
- mantenere gli script di installazione disabilitati nei percorsi di accettazione e misurazione dei pacchetti
- intercettare alberi di dipendenze annidati ed esplosioni di dipendenze opzionali native prima
  della pubblicazione

Documentazione correlata:

- [Risoluzione delle dipendenze dei Plugin](/it/plugins/dependency-resolution)
- [Inventario dei Plugin](/it/plugins/plugin-inventory)
- [Validazione completa della release](/it/reference/full-release-validation)
