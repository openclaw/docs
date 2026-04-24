---
read_when:
    - Vuoi analizzare PDF dagli agenti
    - Hai bisogno di parametri e limiti esatti dello strumento pdf
    - Stai facendo debug della modalità PDF nativa rispetto al fallback di estrazione
summary: Analizzare uno o più documenti PDF con supporto nativo del provider e fallback di estrazione
title: Strumento PDF
x-i18n:
    generated_at: "2026-04-24T09:07:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analizza uno o più documenti PDF e restituisce testo.

Comportamento rapido:

- Modalità provider nativa per i provider di modelli Anthropic e Google.
- Modalità fallback di estrazione per altri provider (estrae prima il testo, poi le immagini delle pagine quando necessario).
- Supporta input singolo (`pdf`) o multiplo (`pdfs`), massimo 10 PDF per chiamata.

## Disponibilità

Lo strumento viene registrato solo quando OpenClaw riesce a risolvere una configurazione di modello capace di gestire PDF per l'agente:

1. `agents.defaults.pdfModel`
2. fallback a `agents.defaults.imageModel`
3. fallback al modello di sessione/predefinito risolto dell'agente
4. se i provider PDF nativi sono supportati da auth, vengono preferiti rispetto ai candidati generici di fallback immagine

Se non può essere risolto alcun modello utilizzabile, lo strumento `pdf` non viene esposto.

Note sulla disponibilità:

- La catena di fallback è consapevole dell'auth. Un `provider/model` configurato conta solo se
  OpenClaw può effettivamente autenticare quel provider per l'agente.
- I provider PDF nativi attualmente sono **Anthropic** e **Google**.
- Se il provider di sessione/predefinito già risolto ha un modello vision/PDF configurato,
  lo strumento PDF riutilizza quello prima di ripiegare su altri provider supportati da auth.

## Riferimento input

<ParamField path="pdf" type="string">
Un percorso o URL di un PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Più percorsi o URL PDF, fino a un totale di 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt di analisi.
</ParamField>

<ParamField path="pages" type="string">
Filtro delle pagine come `1-5` o `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Override facoltativo del modello nel formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite di dimensione per PDF in MB. Il valore predefinito è `agents.defaults.pdfMaxBytesMb` oppure `10`.
</ParamField>

Note sugli input:

- `pdf` e `pdfs` vengono uniti e deduplicati prima del caricamento.
- Se non viene fornito alcun input PDF, lo strumento restituisce un errore.
- `pages` viene analizzato come numeri di pagina indicizzati da 1, deduplicati, ordinati e limitati al massimo di pagine configurato.
- `maxBytesMb` ha come predefinito `agents.defaults.pdfMaxBytesMb` oppure `10`.

## Riferimenti PDF supportati

- percorso di file locale (inclusa l'espansione di `~`)
- URL `file://`
- URL `http://` e `https://`

Note sui riferimenti:

- Altri schemi URI (per esempio `ftp://`) vengono rifiutati con `unsupported_pdf_reference`.
- In modalità sandbox, gli URL remoti `http(s)` vengono rifiutati.
- Con la policy file solo-workspace abilitata, i percorsi di file locali fuori dalle root consentite vengono rifiutati.

## Modalità di esecuzione

### Modalità provider nativa

La modalità nativa viene usata per i provider `anthropic` e `google`.
Lo strumento invia i byte raw del PDF direttamente alle API del provider.

Limiti della modalità nativa:

- `pages` non è supportato. Se impostato, lo strumento restituisce un errore.
- L'input multi-PDF è supportato; ogni PDF viene inviato come blocco documento nativo /
  parte PDF inline prima del prompt.

### Modalità fallback di estrazione

La modalità fallback viene usata per provider non nativi.

Flusso:

1. Estrae il testo dalle pagine selezionate (fino a `agents.defaults.pdfMaxPages`, predefinito `20`).
2. Se la lunghezza del testo estratto è inferiore a `200` caratteri, renderizza le pagine selezionate come immagini PNG e le include.
3. Invia il contenuto estratto insieme al prompt al modello selezionato.

Dettagli del fallback:

- L'estrazione delle immagini di pagina usa un budget di pixel di `4,000,000`.
- Se il modello di destinazione non supporta input immagine e non c'è testo estraibile, lo strumento restituisce un errore.
- Se l'estrazione del testo riesce ma l'estrazione delle immagini richiederebbe vision su un
  modello solo testo, OpenClaw scarta le immagini renderizzate e continua con il
  testo estratto.
- Il fallback di estrazione richiede `pdfjs-dist` (e `@napi-rs/canvas` per il rendering delle immagini).

## Configurazione

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Vedi [Riferimento configurazione](/it/gateway/configuration-reference) per i dettagli completi dei campi.

## Dettagli dell'output

Lo strumento restituisce testo in `content[0].text` e metadati strutturati in `details`.

Campi `details` comuni:

- `model`: ref del modello risolto (`provider/model`)
- `native`: `true` per la modalità provider nativa, `false` per il fallback
- `attempts`: tentativi di fallback falliti prima del successo

Campi di percorso:

- input PDF singolo: `details.pdf`
- input PDF multipli: `details.pdfs[]` con voci `pdf`
- metadati di riscrittura del percorso sandbox (quando applicabile): `rewrittenFrom`

## Comportamento degli errori

- Input PDF mancante: genera `pdf required: provide a path or URL to a PDF document`
- Troppi PDF: restituisce un errore strutturato in `details.error = "too_many_pdfs"`
- Schema di riferimento non supportato: restituisce `details.error = "unsupported_pdf_reference"`
- Modalità nativa con `pages`: genera un chiaro errore `pages is not supported with native PDF providers`

## Esempi

PDF singolo:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

PDF multipli:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modello fallback con filtro di pagina:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti agente disponibili
- [Riferimento configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `pdfMaxBytesMb` e `pdfMaxPages`
