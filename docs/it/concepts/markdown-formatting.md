---
read_when:
    - Stai modificando la formattazione Markdown o il chunking per i canali in uscita
    - Stai aggiungendo un nuovo formatter di canale o una nuova mappatura di stile
    - Stai eseguendo il debug di regressioni di formattazione tra canali diversi
summary: Pipeline di formattazione Markdown per i canali in uscita
title: Formattazione Markdown
x-i18n:
    generated_at: "2026-04-24T08:36:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw formatta il Markdown in uscita convertendolo in una rappresentazione
intermedia (IR) condivisa prima di renderizzare l'output specifico del canale. L'IR mantiene
intatto il testo sorgente mentre trasporta span di stile/link, così chunking e rendering possono
restare coerenti tra i vari canali.

## Obiettivi

- **Coerenza:** un unico passaggio di parsing, più renderer.
- **Chunking sicuro:** dividere il testo prima del rendering in modo che la formattazione inline non
  si rompa tra i chunk.
- **Adattamento al canale:** mappare la stessa IR in Slack mrkdwn, HTML Telegram e
  intervalli di stile Signal senza riparsare il Markdown.

## Pipeline

1. **Parse Markdown -> IR**
   - L'IR è testo semplice più span di stile (grassetto/corsivo/barrato/codice/spoiler) e span di link.
   - Gli offset sono unità di codice UTF-16 così gli intervalli di stile Signal si allineano con la sua API.
   - Le tabelle vengono analizzate solo quando un canale attiva la conversione delle tabelle.
2. **Chunk IR (prima il formato)**
   - Il chunking avviene sul testo IR prima del rendering.
   - La formattazione inline non si divide tra i chunk; gli span vengono ritagliati per chunk.
3. **Render per canale**
   - **Slack:** token mrkdwn (grassetto/corsivo/barrato/codice), link come `<url|label>`.
   - **Telegram:** tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** testo semplice + intervalli `text-style`; i link diventano `label (url)` quando la label differisce.

## Esempio IR

Input Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (schematico):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Dove viene usato

- Gli adattatori in uscita di Slack, Telegram e Signal eseguono il rendering dall'IR.
- Altri canali (WhatsApp, iMessage, Microsoft Teams, Discord) usano ancora testo semplice o
  proprie regole di formattazione, con la conversione delle tabelle Markdown applicata prima del
  chunking quando abilitata.

## Gestione delle tabelle

Le tabelle Markdown non sono supportate in modo coerente tra i client di chat. Usa
`markdown.tables` per controllare la conversione per canale (e per account).

- `code`: renderizza le tabelle come blocchi di codice (predefinito per la maggior parte dei canali).
- `bullets`: converte ogni riga in punti elenco (predefinito per Signal + WhatsApp).
- `off`: disattiva parsing e conversione delle tabelle; il testo grezzo della tabella passa invariato.

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

- I limiti dei chunk provengono dagli adattatori/configurazione del canale e vengono applicati al testo IR.
- Le recinzioni di codice vengono preservate come un singolo blocco con un newline finale così i canali
  le renderizzano correttamente.
- I prefissi degli elenchi e delle citazioni fanno parte del testo IR, quindi il chunking
  non divide a metà prefisso.
- Gli stili inline (grassetto/corsivo/barrato/codice inline/spoiler) non vengono mai divisi tra
  i chunk; il renderer riapre gli stili all'interno di ogni chunk.

Se ti serve altro sul comportamento del chunking tra i canali, vedi
[Streaming + chunking](/it/concepts/streaming).

## Criterio dei link

- **Slack:** `[label](url)` -> `<url|label>`; gli URL semplici restano semplici. L'autolink
  è disattivato durante il parsing per evitare doppio collegamento.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modalità parse HTML).
- **Signal:** `[label](url)` -> `label (url)` a meno che la label non corrisponda all'URL.

## Spoiler

I marcatori spoiler (`||spoiler||`) vengono analizzati solo per Signal, dove vengono mappati in
intervalli di stile SPOILER. Gli altri canali li trattano come testo semplice.

## Come aggiungere o aggiornare un formatter di canale

1. **Analizza una sola volta:** usa l'helper condiviso `markdownToIR(...)` con opzioni
   appropriate per il canale (autolink, stile dei titoli, prefisso blockquote).
2. **Renderizza:** implementa un renderer con `renderMarkdownWithMarkers(...)` e una
   mappa dei marcatori di stile (o intervalli di stile Signal).
3. **Chunk:** chiama `chunkMarkdownIR(...)` prima del rendering; renderizza ogni chunk.
4. **Collega l'adattatore:** aggiorna l'adattatore in uscita del canale per usare il nuovo chunker
   e renderer.
5. **Testa:** aggiungi o aggiorna test di formattazione e un test di consegna in uscita se il
   canale usa il chunking.

## Problemi comuni

- I token tra parentesi angolari di Slack (`<@U123>`, `<#C123>`, `<https://...>`) devono essere
  preservati; esegui l'escape sicuro dell'HTML grezzo.
- L'HTML di Telegram richiede l'escape del testo fuori dai tag per evitare markup non valido.
- Gli intervalli di stile di Signal dipendono dagli offset UTF-16; non usare offset per code point.
- Preserva i newline finali per i blocchi di codice delimitati, così i marcatori di chiusura finiscono
  sulla propria riga.

## Correlati

- [Streaming e chunking](/it/concepts/streaming)
- [System prompt](/it/concepts/system-prompt)
