---
read_when:
    - Stai modificando la formattazione Markdown o la suddivisione in blocchi per i canali in uscita
    - Stai aggiungendo un nuovo formattatore di canale o una nuova mappatura di stile
    - Stai eseguendo il debug delle regressioni di formattazione tra i vari canali
summary: Pipeline di formattazione Markdown per i canali in uscita
title: Formattazione Markdown
x-i18n:
    generated_at: "2026-07-12T07:00:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw converte il Markdown in uscita in una rappresentazione intermedia
(IR) condivisa prima di generare l'output specifico per ciascun canale. L'IR mantiene il testo normale insieme
agli intervalli di stile e dei collegamenti, così un'unica fase di analisi serve ogni canale e la suddivisione in blocchi non
interrompe mai la formattazione a metà intervallo.

## Pipeline

1. **Analizza il Markdown nell'IR** (`markdownToIR`) - testo normale insieme a intervalli di stile
   (grassetto, corsivo, barrato, codice, blocco di codice, spoiler, citazione,
   intestazioni 1-6) e intervalli dei collegamenti. Gli offset sono unità di codice UTF-16, così gli
   intervalli di stile di Signal si allineano direttamente alla sua API. Le tabelle vengono analizzate solo quando il canale
   abilita una modalità tabella.
2. **Suddividi l'IR in blocchi** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - la suddivisione avviene sul testo dell'IR prima della generazione, così gli stili in linea e i
     collegamenti vengono separati per blocco anziché essere interrotti in corrispondenza di un limite.
3. **Genera l'output per ciascun canale** (`renderMarkdownWithMarkers`) - una mappa degli indicatori di stile
   trasforma gli intervalli nel markup nativo del canale.

| Canale                                                           | Generatore                                                                            | Note                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Slack                                                            | token mrkdwn (`*grassetto*`, `_corsivo_`, `` `codice` ``, delimitatori di codice)     | I collegamenti diventano `<url\|etichetta>`; i collegamenti automatici sono disabilitati durante l'analisi per evitare duplicazioni |
| Telegram                                                         | tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`)  | Supporta anche tabelle nei messaggi avanzati e intestazioni (`<h1>`-`<h6>`) quando `richMessages` è attivo         |
| Signal                                                           | testo normale + intervalli `text-style`                                                | I collegamenti vengono generati come `etichetta (url)` quando l'etichetta è diversa dall'URL                     |
| Discord, WhatsApp, iMessage, Microsoft Teams e altri canali      | testo normale                                                                         | Nessuno stile basato sull'IR; la conversione delle tabelle Markdown viene comunque eseguita tramite `convertMarkdownTables` |

## Esempio di IR

Markdown di input:
__OC_I18N_900000__
IR (schema):
__OC_I18N_900001__
## Gestione delle tabelle

`markdown.tables` controlla il modo in cui un canale converte le tabelle Markdown, per
canale e, facoltativamente, per account:

| Modalità  | Comportamento                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `code`    | Genera una tabella ASCII allineata all'interno di un blocco di codice (impostazione predefinita di riserva) |
| `bullets` | Converte ogni riga in punti elenco `etichetta: valore`                                                |
| `block`   | Mantiene le tabelle native dove il trasporto le supporta; altrimenti ripiega su `code`                 |
| `off`     | Disabilita l'analisi delle tabelle; il testo non elaborato della tabella viene trasmesso senza modifiche |

Impostazioni predefinite dei Plugin per canale: Signal, WhatsApp e Matrix usano
`bullets` per impostazione predefinita; Mattermost usa `off`; Telegram usa `block` (che
si risolve in `code` a meno che l'account non abbia `richMessages` abilitato). Qualsiasi
canale privo di un'impostazione predefinita esplicita del Plugin ripiega su `code`.
__OC_I18N_900002__
## Regole di suddivisione in blocchi

- I limiti dei blocchi provengono dagli adattatori o dalla configurazione del canale e si applicano al testo dell'IR, non
  all'output generato.
- I blocchi di codice delimitati vengono mantenuti come un unico blocco con un carattere di nuova riga finale, affinché
  i canali generino correttamente il delimitatore di chiusura.
- I prefissi degli elenchi e delle citazioni fanno parte del testo dell'IR, quindi la suddivisione non
  avviene mai a metà prefisso.
- Gli stili in linea non vengono mai suddivisi tra blocchi; il generatore riapre uno
  stile aperto all'inizio del blocco successivo.

Consulta [Streaming e suddivisione in blocchi](/concepts/streaming) per il comportamento relativo ai limiti dei blocchi e
alla consegna tra i diversi canali.

## Criteri per i collegamenti

- **Slack:** `[etichetta](url)` -> `<url|etichetta>`; gli URL semplici restano invariati.
- **Telegram:** `[etichetta](url)` -> `<a href="url">etichetta</a>` (modalità di analisi HTML).
- **Signal:** `[etichetta](url)` -> `etichetta (url)`, a meno che l'etichetta non
  corrisponda già all'URL.

## Spoiler

Gli indicatori di spoiler (`||spoiler||`) vengono analizzati per Signal (mappati agli intervalli di stile
`SPOILER`) e Telegram (mappati a `<tg-spoiler>`). Gli altri canali trattano
`||...||` come testo normale.

## Aggiunta o aggiornamento del formattatore di un canale

1. **Analizza una sola volta** con `markdownToIR(...)`, passando le opzioni appropriate
   per il canale (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Genera l'output** con `renderMarkdownWithMarkers(...)` e una mappa degli indicatori di stile (oppure
   una logica personalizzata per gli intervalli di stile per trasporti come Signal).
3. **Suddividi in blocchi** con `chunkMarkdownIR(...)` o
   `renderMarkdownIRChunksWithinLimit(...)` prima di generare ogni blocco.
4. **Collega l'adattatore** affinché richiami il nuovo sistema di suddivisione e il generatore dal
   percorso di invio in uscita.
5. **Verifica** con test di formattazione e un test di consegna in uscita, se il canale
   suddivide i messaggi in blocchi.

## Problemi comuni

- I token di Slack tra parentesi angolari (`<@U123>`, `<#C123>`, `<https://...>`) devono
  rimanere intatti durante l'escape; l'HTML non elaborato deve comunque essere sottoposto a escape in sicurezza.
- L'HTML di Telegram richiede l'escape del testo esterno ai tag per evitare markup non valido.
- Gli intervalli di stile di Signal usano offset UTF-16, non offset di punti di codice.
- Mantieni i caratteri di nuova riga finali nei blocchi di codice delimitati, affinché l'indicatore di chiusura
  si trovi su una riga separata.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Streaming e suddivisione in blocchi" href="/it/concepts/streaming" icon="bars-staggered">
    Comportamento dello streaming in uscita, limiti dei blocchi e consegna specifica per canale.
  </Card>
  <Card title="Prompt di sistema" href="/it/concepts/system-prompt" icon="message-lines">
    Ciò che il modello vede prima della conversazione, inclusi i file dell'area di lavoro inseriti.
  </Card>
</CardGroup>
