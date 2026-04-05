---
read_when:
    - Stai modificando la formattazione Markdown o il chunking per i canali in uscita
    - Stai aggiungendo un nuovo formatter di canale o una nuova mappatura di stile
    - Stai eseguendo il debug di regressioni di formattazione tra i vari canali
summary: Pipeline di formattazione Markdown per i canali in uscita
title: Formattazione Markdown
x-i18n:
    generated_at: "2026-04-05T13:49:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Formattazione Markdown

OpenClaw formatta il Markdown in uscita convertendolo in una rappresentazione
intermedia (IR) condivisa prima di eseguire il rendering dell'output specifico
del canale. L'IR mantiene intatto il testo di origine trasportando al contempo
gli span di stile/link, così chunking e rendering possono
rimanere coerenti tra i vari canali.

## Obiettivi

- **Coerenza:** un solo passaggio di parsing, più renderer.
- **Chunking sicuro:** suddividere il testo prima del rendering in modo che la formattazione inline non
  si interrompa mai tra i chunk.
- **Adattamento al canale:** mappare lo stesso IR su Slack mrkdwn, Telegram HTML e Signal
  style ranges senza ripetere il parsing del Markdown.

## Pipeline

1. **Parsing Markdown -> IR**
   - L'IR è testo semplice più span di stile (grassetto/corsivo/barrato/codice/spoiler) e span di link.
   - Gli offset sono unità di codice UTF-16 in modo che gli style ranges di Signal siano allineati alla sua API.
   - Le tabelle vengono analizzate solo quando un canale abilita esplicitamente la conversione delle tabelle.
2. **Chunking IR (prima il formato)**
   - Il chunking avviene sul testo IR prima del rendering.
   - La formattazione inline non viene suddivisa tra i chunk; gli span vengono suddivisi per chunk.
3. **Rendering per canale**
   - **Slack:** token mrkdwn (grassetto/corsivo/barrato/codice), link come `<url|label>`.
   - **Telegram:** tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** testo semplice + range `text-style`; i link diventano `label (url)` quando l'etichetta è diversa.

## Esempio IR

Markdown di input:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (schema):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Dove viene usato

- Gli adapter in uscita di Slack, Telegram e Signal eseguono il rendering a partire dall'IR.
- Altri canali (WhatsApp, iMessage, Microsoft Teams, Discord) usano ancora testo semplice o
  proprie regole di formattazione, con la conversione delle tabelle Markdown applicata prima del
  chunking quando è abilitata.

## Gestione delle tabelle

Le tabelle Markdown non sono supportate in modo coerente tra i client di chat. Usa
`markdown.tables` per controllare la conversione per canale (e per account).

- `code`: esegue il rendering delle tabelle come blocchi di codice (predefinito per la maggior parte dei canali).
- `bullets`: converte ogni riga in punti elenco (predefinito per Signal + WhatsApp).
- `off`: disabilita il parsing e la conversione delle tabelle; il testo grezzo della tabella viene inoltrato così com'è.

Chiavi di configurazione:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Regole di chunking

- I limiti dei chunk provengono dagli adapter/configurazioni dei canali e vengono applicati al testo IR.
- I blocchi di codice delimitati sono conservati come un unico blocco con una newline finale in modo che i canali
  li rendano correttamente.
- I prefissi degli elenchi e delle citazioni a blocchi fanno parte del testo IR, quindi il chunking
  non si interrompe a metà prefisso.
- Gli stili inline (grassetto/corsivo/barrato/codice inline/spoiler) non vengono mai suddivisi tra
  chunk; il renderer riapre gli stili all'interno di ogni chunk.

Se hai bisogno di maggiori dettagli sul comportamento del chunking tra i vari canali, vedi
[Streaming + chunking](/concepts/streaming).

## Criterio per i link

- **Slack:** `[label](url)` -> `<url|label>`; gli URL semplici rimangono invariati. L'autolink
  è disabilitato durante il parsing per evitare il doppio collegamento.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modalità di parsing HTML).
- **Signal:** `[label](url)` -> `label (url)` a meno che l'etichetta non corrisponda all'URL.

## Spoiler

I marcatori spoiler (`||spoiler||`) vengono analizzati solo per Signal, dove vengono mappati su
range di stile SPOILER. Gli altri canali li trattano come testo semplice.

## Come aggiungere o aggiornare un formatter di canale

1. **Analizza una sola volta:** usa l'helper condiviso `markdownToIR(...)` con opzioni
   appropriate per il canale (autolink, stile dei titoli, prefisso delle citazioni a blocchi).
2. **Esegui il rendering:** implementa un renderer con `renderMarkdownWithMarkers(...)` e una
   mappa dei marcatori di stile (o gli style ranges di Signal).
3. **Chunking:** chiama `chunkMarkdownIR(...)` prima del rendering; esegui il rendering di ogni chunk.
4. **Collega l'adapter:** aggiorna l'adapter in uscita del canale in modo che usi il nuovo chunker
   e renderer.
5. **Testa:** aggiungi o aggiorna i test di formattazione e un test di consegna in uscita se il
   canale usa il chunking.

## Problemi comuni

- I token di Slack tra parentesi angolari (`<@U123>`, `<#C123>`, `<https://...>`) devono essere
  preservati; esegui l'escape dell'HTML grezzo in modo sicuro.
- L'HTML di Telegram richiede l'escape del testo fuori dai tag per evitare markup non valido.
- Gli style ranges di Signal dipendono dagli offset UTF-16; non usare offset di code point.
- Preserva le newline finali per i blocchi di codice delimitati, in modo che i marcatori di chiusura si trovino
  sulla propria riga.
