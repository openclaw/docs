---
read_when:
    - Creazione o riorganizzazione delle schede e dei widget dell'area di lavoro
    - Consentire a un agente di comporre uno spazio di lavoro
    - Revisione del modello di approvazione e sandbox per i widget personalizzati
summary: Spazi di lavoro componibili dagli agenti nell'interfaccia di controllo
title: Spazi di lavoro
x-i18n:
    generated_at: "2026-07-12T07:37:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

La scheda **Aree di lavoro** nell'[interfaccia di controllo](/it/web/control-ui) è uno spazio che tu e i tuoi
agenti organizzate insieme. Le schede, i widget, le loro posizioni su una griglia a 12 colonne e i relativi
collegamenti dati risiedono tutti in un unico documento. Qualsiasi elemento in grado di modificare tale documento può comporre
l'area di lavoro: tu, la CLI `openclaw workspaces` o un agente che richiama gli strumenti `workspace_*`.

Ogni scrittura segue lo stesso percorso convalidato, quindi il layout di un utente e quello di un agente
non possono divergere. Ogni scrittura accettata incrementa una versione e trasmette
`plugin.workspaces.changed`, così la modifica di un agente appare in un browser già aperto senza
ricaricare la pagina.

## Abilitare le aree di lavoro

Il Plugin Workspaces incluso è disabilitato per impostazione predefinita. Nell'interfaccia di controllo, apri **Plugins**,
trova **Workspaces** e seleziona **Enable**. Puoi abilitarlo anche dalla CLI:

```sh
openclaw plugins enable workspaces
```

L'abilitazione del Plugin aggiunge la scheda **Aree di lavoro** e rende disponibili la CLI `openclaw workspaces`
e gli strumenti per agenti `workspace_*`. La disabilitazione rimuove queste interfacce senza
eliminare il database delle aree di lavoro o le risorse dei widget.

## L'area di lavoro predefinita

Al primo caricamento viene visualizzata un'area di lavoro **Panoramica**: schede di costi e token, stato delle istanze,
sessioni, stato Cron e un feed delle attività. Si tratta di normali contenuti dell'area di lavoro: trascinali,
comprimili, nascondili o eliminali.

## Widget integrati

Nove widget attendibili vengono distribuiti con il Plugin e sono visualizzati come interfaccia proprietaria:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

I widget dichiarano i dati tramite **collegamenti** e non li recuperano mai autonomamente:

| Collegamento | Risoluzione                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `static`     | Un valore letterale memorizzato nel documento (massimo 8 KB).                                             |
| `file`       | Un file JSON, Markdown o CSV in `<stateDir>/workspaces/data/`, facoltativamente ristretto da un puntatore JSON. |
| `rpc`        | Uno dei metodi Gateway di sola lettura inclusi in un elenco consentito fisso, risolto dall'interfaccia di controllo attendibile. |

Il collegamento `file` è il modo più semplice per inserire i propri valori numerici in un'area di lavoro: scrivi un
file JSON nella directory dei dati e indirizza un `stat-card` verso di esso.

## Provenienza

Le schede e i widget includono un'indicazione `createdBy` — `user`, `system` o `agent:<id>` — impostata in base
all'autore della scrittura. Il chiamante non può specificarla, quindi un agente non può attribuirti il proprio
lavoro e il contrassegno "IA" su un widget creato da un agente indica sempre esattamente ciò che dichiara.

## Widget personalizzati

Un agente può creare un vero widget HTML con `workspace_widget_scaffold` (oppure puoi farlo tu con
`openclaw workspaces widget-scaffold <name>`). Il codice creato dagli agenti è considerato ostile:

- Un widget generato viene inserito nel registro come **in attesa**. Non viene creato alcun iframe e la
  route delle risorse restituisce 404 per i relativi file finché un operatore non lo approva.
- L'approvazione è una decisione distinta dalla modifica di un layout: `workspaces.widget.approve`
  richiede l'ambito `operator.approvals`, lo stesso che protegge le approvazioni di esecuzione.
- Un widget approvato viene visualizzato in un `<iframe sandbox="allow-scripts">` — mai
  `allow-same-origin` — quindi la sua origine è opaca e non può accedere al DOM,
  all'archiviazione o ai cookie del genitore.
- Le sue risorse vengono fornite con `connect-src 'none'`, bloccando le connessioni di rete degli script, come
  `fetch`, XHR e WebSocket. Non possiede credenziali e non comunica mai con il Gateway.
- I dati lo raggiungono esclusivamente tramite un bridge `postMessage` con versione. Il codice personalizzato può ricevere
  i collegamenti `static` dichiarati, che sono valori dell'area di lavoro già creati da un agente o da un operatore.
  I collegamenti RPC e file rimangono nei widget integrati attendibili: i browser consentono a un
  elemento figlio in sandbox di navigare nel proprio frame, quindi i dati privilegiati non vengono mai inviati
  al codice HTML creato dagli agenti.

L'invio di un prompt nella chat da un widget richiede inoltre una funzionalità nel manifest, una
conferma per ogni chiamata che riporti il testo esatto ed è soggetto a un limite di frequenza.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` richiede un dispositivo associato all'ambito `operator.approvals`; l'approvazione
dall'interfaccia di controllo non lo richiede, perché il browser lo possiede già.

## Archiviazione

Il documento dell'area di lavoro, il registro dei widget personalizzati e un anello di annullamento con 20 voci risiedono in
`<stateDir>/workspaces/workspaces.sqlite`. Le risorse dei widget creati dagli agenti rimangono sul disco in
`<stateDir>/workspaces/widgets/<name>/` e i dati dei collegamenti file in
`<stateDir>/workspaces/data/`, perché un agente li crea con normali strumenti per file e
la route dei widget ne distribuisce i byte.
