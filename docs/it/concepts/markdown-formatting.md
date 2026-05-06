---
read_when:
    - Stai modificando la formattazione Markdown o la suddivisione in blocchi per i canali in uscita
    - Stai aggiungendo un nuovo formattatore di canale o una mappatura di stile
    - Stai eseguendo il debug delle regressioni di formattazione nei vari canali
summary: Pipeline di formattazione Markdown per i canali in uscita
title: Formattazione Markdown
x-i18n:
    generated_at: "2026-05-06T08:45:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw formatta il Markdown in uscita convertendolo in una rappresentazione intermedia
condivisa (IR) prima di generare l'output specifico per canale. L'IR mantiene
intatto il testo sorgente mentre trasporta intervalli di stile/link, così la suddivisione in blocchi e il rendering possono
restare coerenti tra i canali.

## Obiettivi

- **Coerenza:** un unico passaggio di parsing, più renderer.
- **Suddivisione sicura in blocchi:** suddivide il testo prima del rendering in modo che la formattazione inline non si
  interrompa mai tra i blocchi.
- **Adattamento al canale:** mappa la stessa IR su mrkdwn di Slack, HTML di Telegram e intervalli di
  stile di Signal senza ripetere il parsing del Markdown.

## Pipeline

1. **Parsing Markdown -> IR**
   - L'IR è testo semplice più intervalli di stile (grassetto/corsivo/barrato/codice/spoiler) e intervalli di link.
   - Gli offset sono unità di codice UTF-16, così gli intervalli di stile di Signal si allineano con la sua API.
   - Le tabelle vengono analizzate solo quando un canale abilita la conversione delle tabelle.
2. **Suddivisione IR in blocchi (prima il formato)**
   - La suddivisione avviene sul testo dell'IR prima del rendering.
   - La formattazione inline non viene divisa tra blocchi; gli intervalli vengono sezionati per ciascun blocco.
3. **Rendering per canale**
   - **Slack:** token mrkdwn (grassetto/corsivo/barrato/codice), link come `<url|label>`.
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
  suddivisione in blocchi quando è abilitata.

## Gestione delle tabelle

Le tabelle Markdown non sono supportate in modo coerente tra i client di chat. Usa
`markdown.tables` per controllare la conversione per canale (e per account).

- `code`: esegue il rendering delle tabelle come blocchi di codice (predefinito per la maggior parte dei canali).
- `bullets`: converte ogni riga in punti elenco (predefinito per Signal + WhatsApp).
- `off`: disabilita il parsing e la conversione delle tabelle; il testo grezzo della tabella passa invariato.

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

## Regole di suddivisione in blocchi

- I limiti dei blocchi provengono dagli adattatori/configurazione del canale e vengono applicati al testo dell'IR.
- I code fence vengono preservati come un unico blocco con una nuova riga finale, così i canali
  li rendono correttamente.
- I prefissi degli elenchi e delle citazioni a blocco fanno parte del testo dell'IR, quindi la suddivisione
  non avviene a metà prefisso.
- Gli stili inline (grassetto/corsivo/barrato/codice-inline/spoiler) non vengono mai divisi tra
  blocchi; il renderer riapre gli stili dentro ciascun blocco.

Se ti servono più dettagli sul comportamento della suddivisione in blocchi tra i canali, vedi
[Streaming + suddivisione in blocchi](/it/concepts/streaming).

## Criteri per i link

- **Slack:** `[label](url)` -> `<url|label>`; gli URL semplici restano semplici. Il collegamento automatico
  è disabilitato durante il parsing per evitare collegamenti doppi.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modalità di parsing HTML).
- **Signal:** `[label](url)` -> `label (url)` a meno che l'etichetta non corrisponda all'URL.

## Spoiler

I marcatori spoiler (`||spoiler||`) vengono analizzati solo per Signal, dove sono mappati a
intervalli di stile SPOILER. Gli altri canali li trattano come testo semplice.

## Come aggiungere o aggiornare un formatter di canale

1. **Parsing una sola volta:** usa l'helper condiviso `markdownToIR(...)` con opzioni appropriate per il canale
   (collegamento automatico, stile delle intestazioni, prefisso delle citazioni a blocco).
2. **Rendering:** implementa un renderer con `renderMarkdownWithMarkers(...)` e una
   mappa dei marcatori di stile (o intervalli di stile di Signal).
3. **Suddivisione in blocchi:** chiama `chunkMarkdownIR(...)` prima del rendering; esegui il rendering di ciascun blocco.
4. **Collegamento dell'adattatore:** aggiorna l'adattatore in uscita del canale per usare il nuovo suddivisore in blocchi
   e il renderer.
5. **Test:** aggiungi o aggiorna i test di formato e un test di consegna in uscita se il
   canale usa la suddivisione in blocchi.

## Problemi comuni

- I token di Slack tra parentesi angolari (`<@U123>`, `<#C123>`, `<https://...>`) devono essere
  preservati; esegui l'escape dell'HTML grezzo in modo sicuro.
- L'HTML di Telegram richiede l'escape del testo fuori dai tag per evitare markup non valido.
- Gli intervalli di stile di Signal dipendono dagli offset UTF-16; non usare offset basati su punti di codice.
- Preserva le nuove righe finali per i blocchi di codice delimitati, così i marcatori di chiusura finiscono sulla
  propria riga.

## Correlati

<CardGroup cols={2}>
  <Card title="Streaming e suddivisione in blocchi" href="/it/concepts/streaming" icon="bars-staggered">
    Comportamento dello streaming in uscita, confini dei blocchi e consegna specifica per canale.
  </Card>
  <Card title="Prompt di sistema" href="/it/concepts/system-prompt" icon="message-lines">
    Ciò che il modello vede prima della conversazione, inclusi i file dell'area di lavoro iniettati.
  </Card>
</CardGroup>
