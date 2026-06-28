---
read_when:
    - Stai modificando la formattazione Markdown o la suddivisione in blocchi per i canali in uscita
    - Stai aggiungendo un nuovo formattatore di canale o una mappatura di stile
    - Stai eseguendo il debug delle regressioni di formattazione nei diversi canali
summary: Pipeline di formattazione Markdown per i canali in uscita
title: Formattazione Markdown
x-i18n:
    generated_at: "2026-05-12T12:50:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw formatta il Markdown in uscita convertendolo in una rappresentazione
intermedia (IR) condivisa prima di generare l'output specifico del canale. L'IR mantiene
intatto il testo sorgente e trasporta intervalli di stile/link, così che suddivisione in chunk e rendering possano
restare coerenti tra i canali.

## Obiettivi

- **Coerenza:** un solo passaggio di parsing, più renderer.
- **Suddivisione sicura in chunk:** divide il testo prima del rendering, così la formattazione inline non si
  interrompe mai tra i chunk.
- **Adattamento al canale:** mappa la stessa IR su Slack mrkdwn, HTML di Telegram e intervalli di stile
  Signal senza rieseguire il parsing del Markdown.

## Pipeline

1. **Parsing del Markdown -> IR**
   - L'IR è testo semplice più intervalli di stile (bold/italic/strike/code/spoiler) e intervalli di link.
   - Gli offset sono unità di codice UTF-16, così gli intervalli di stile Signal si allineano alla sua API.
   - Le tabelle vengono analizzate solo quando un canale abilita la conversione delle tabelle.
2. **Suddivisione dell'IR in chunk (prima il formato)**
   - La suddivisione in chunk avviene sul testo dell'IR prima del rendering.
   - La formattazione inline non viene divisa tra chunk; gli intervalli vengono ritagliati per ciascun chunk.
3. **Rendering per canale**
   - **Slack:** token mrkdwn (bold/italic/strike/code), link come `<url|label>`.
   - **Telegram:** tag HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** testo semplice + intervalli `text-style`; i link diventano `label (url)` quando l'etichetta è diversa.

## Esempio di IR

Markdown di input:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (schematica):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Dove viene usata

- Gli adattatori in uscita di Slack, Telegram e Signal eseguono il rendering dall'IR.
- Altri canali (WhatsApp, iMessage, Microsoft Teams, Discord) usano ancora testo semplice o
  le proprie regole di formattazione, con la conversione delle tabelle Markdown applicata prima della
  suddivisione in chunk quando è abilitata.

## Gestione delle tabelle

Le tabelle Markdown non sono supportate in modo coerente tra i client di chat. Usa
`markdown.tables` per controllare la conversione per canale (e per account).

- `code`: renderizza le tabelle come blocchi di codice (predefinito per la maggior parte dei canali).
- `bullets`: converte ogni riga in punti elenco (predefinito per Matrix, Signal e WhatsApp).
- `off`: disabilita parsing e conversione delle tabelle; il testo grezzo della tabella passa invariato.

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

## Regole di suddivisione in chunk

- I limiti dei chunk provengono dagli adattatori/configurazioni dei canali e vengono applicati al testo dell'IR.
- I blocchi di codice delimitati sono preservati come un unico blocco con una nuova riga finale, così i canali
  li renderizzano correttamente.
- I prefissi degli elenchi e delle citazioni sono parte del testo dell'IR, quindi la suddivisione in chunk
  non interrompe un prefisso a metà.
- Gli stili inline (bold/italic/strike/inline-code/spoiler) non vengono mai divisi tra
  chunk; il renderer riapre gli stili dentro ciascun chunk.

Se ti servono altri dettagli sul comportamento di suddivisione in chunk tra i canali, consulta
[Streaming + suddivisione in chunk](/it/concepts/streaming).

## Criteri per i link

- **Slack:** `[label](url)` -> `<url|label>`; gli URL nudi restano nudi. L'autolink
  è disabilitato durante il parsing per evitare doppi collegamenti.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modalità di parsing HTML).
- **Signal:** `[label](url)` -> `label (url)` a meno che l'etichetta non corrisponda all'URL.

## Spoiler

I marcatori spoiler (`||spoiler||`) vengono analizzati solo per Signal, dove vengono mappati a
intervalli di stile SPOILER. Gli altri canali li trattano come testo semplice.

## Come aggiungere o aggiornare un formatter di canale

1. **Parsing una volta:** usa l'helper condiviso `markdownToIR(...)` con opzioni appropriate per il canale
   (autolink, stile dei titoli, prefisso delle citazioni).
2. **Rendering:** implementa un renderer con `renderMarkdownWithMarkers(...)` e una
   mappa dei marcatori di stile (o intervalli di stile Signal).
3. **Suddivisione in chunk:** chiama `chunkMarkdownIR(...)` prima del rendering; renderizza ogni chunk.
4. **Collega l'adattatore:** aggiorna l'adattatore in uscita del canale per usare il nuovo chunker
   e renderer.
5. **Test:** aggiungi o aggiorna i test di formato e un test di consegna in uscita se il
   canale usa la suddivisione in chunk.

## Problemi comuni

- I token Slack tra parentesi angolari (`<@U123>`, `<#C123>`, `<https://...>`) devono essere
  preservati; esegui l'escape dell'HTML grezzo in modo sicuro.
- L'HTML di Telegram richiede l'escape del testo fuori dai tag per evitare markup non valido.
- Gli intervalli di stile Signal dipendono dagli offset UTF-16; non usare offset basati sui punti di codice.
- Preserva le nuove righe finali per i blocchi di codice delimitati, così i marcatori di chiusura finiscono sulla
  propria riga.

## Correlati

<CardGroup cols={2}>
  <Card title="Streaming e suddivisione in chunk" href="/it/concepts/streaming" icon="bars-staggered">
    Comportamento dello streaming in uscita, confini dei chunk e consegna specifica del canale.
  </Card>
  <Card title="Prompt di sistema" href="/it/concepts/system-prompt" icon="message-lines">
    Cosa vede il modello prima della conversazione, inclusi i file dell'area di lavoro iniettati.
  </Card>
</CardGroup>
