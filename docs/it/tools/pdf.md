---
read_when:
    - Vuoi analizzare PDF provenienti dagli agenti
    - Sono necessari i parametri e i limiti esatti dello strumento PDF
    - Stai eseguendo il debug della modalità PDF nativa rispetto al fallback di estrazione
summary: Analizza uno o più documenti PDF con supporto nativo del provider e meccanismo di ripiego per l'estrazione
title: Strumento PDF
x-i18n:
    generated_at: "2026-05-06T09:13:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analizza uno o più documenti PDF e restituisce testo.

Comportamento rapido:

- Modalità provider nativa per provider di modelli Anthropic e Google.
- Modalità fallback di estrazione per altri provider (estrae prima il testo, poi le immagini delle pagine quando necessario).
- Supporta input singolo (`pdf`) o multiplo (`pdfs`), massimo 10 PDF per chiamata.

## Disponibilità

Lo strumento viene registrato solo quando OpenClaw riesce a risolvere una configurazione di modello compatibile con PDF per l'agente:

1. `agents.defaults.pdfModel`
2. fallback a `agents.defaults.imageModel`
3. fallback al modello sessione/predefinito risolto dell'agente
4. se i provider PDF nativi sono supportati da autenticazione, preferirli prima dei candidati fallback generici per immagini

Se non è possibile risolvere alcun modello utilizzabile, lo strumento `pdf` non viene esposto.

Note sulla disponibilità:

- La catena di fallback è consapevole dell'autenticazione. Un `provider/model` configurato conta solo se
  OpenClaw può effettivamente autenticare quel provider per l'agente.
- I provider PDF nativi sono attualmente **Anthropic** e **Google**.
- Se il provider sessione/predefinito risolto ha già un modello vision/PDF
  configurato, lo strumento PDF lo riutilizza prima di ricorrere ad altri
  provider supportati da autenticazione.

## Riferimento input

<ParamField path="pdf" type="string">
Un percorso o URL PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Più percorsi o URL PDF, fino a 10 in totale.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt di analisi.
</ParamField>

<ParamField path="pages" type="string">
Filtro pagine come `1-5` o `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Override opzionale del modello nel formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite dimensione per PDF in MB. Valore predefinito: `agents.defaults.pdfMaxBytesMb` o `10`.
</ParamField>

Note sull'input:

- `pdf` e `pdfs` vengono uniti e deduplicati prima del caricamento.
- Se non viene fornito alcun input PDF, lo strumento restituisce un errore.
- `pages` viene interpretato come numeri di pagina a base 1, deduplicato, ordinato e limitato al massimo di pagine configurato.
- `maxBytesMb` usa come valore predefinito `agents.defaults.pdfMaxBytesMb` o `10`.

## Riferimenti PDF supportati

- percorso file locale (inclusa l'espansione di `~`)
- URL `file://`
- URL `http://` e `https://`
- riferimenti inbound gestiti da OpenClaw come `media://inbound/<id>`

Note sui riferimenti:

- Altri schemi URI (per esempio `ftp://`) vengono rifiutati con `unsupported_pdf_reference`.
- In modalità sandbox, gli URL remoti `http(s)` vengono rifiutati.
- Con la policy file solo workspace abilitata, i percorsi file locali fuori dalle radici consentite vengono rifiutati.
- I riferimenti inbound gestiti e i percorsi riprodotti nell'archivio media inbound di OpenClaw sono consentiti con la policy file solo workspace.

## Modalità di esecuzione

### Modalità provider nativa

La modalità nativa viene usata per i provider `anthropic` e `google`.
Lo strumento invia i byte PDF grezzi direttamente alle API del provider.

Limiti della modalità nativa:

- `pages` non è supportato. Se impostato, lo strumento restituisce un errore.
- L'input multi-PDF è supportato; ogni PDF viene inviato come blocco documento nativo /
  parte PDF inline prima del prompt.

### Modalità fallback di estrazione

La modalità fallback viene usata per provider non nativi.

Flusso:

1. Estrae il testo dalle pagine selezionate (fino a `agents.defaults.pdfMaxPages`, valore predefinito `20`).
2. Se la lunghezza del testo estratto è inferiore a `200` caratteri, renderizza le pagine selezionate come immagini PNG e le include.
3. Invia il contenuto estratto più il prompt al modello selezionato.

Dettagli del fallback:

- L'estrazione delle immagini delle pagine usa un budget pixel di `4,000,000`.
- Se il modello di destinazione non supporta input immagine e non c'è testo estraibile, lo strumento restituisce un errore.
- Se l'estrazione del testo riesce ma l'estrazione delle immagini richiederebbe vision su un
  modello solo testo, OpenClaw elimina le immagini renderizzate e prosegue con il
  testo estratto.
- Il fallback di estrazione usa il Plugin `document-extract` incluso. Il Plugin possiede
  `pdfjs-dist`; `@napi-rs/canvas` viene usato solo quando è disponibile il fallback
  di rendering immagini.

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

Consulta [Riferimento configurazione](/it/gateway/configuration-reference) per i dettagli completi dei campi.

## Dettagli output

Lo strumento restituisce testo in `content[0].text` e metadati strutturati in `details`.

Campi `details` comuni:

- `model`: riferimento modello risolto (`provider/model`)
- `native`: `true` per modalità provider nativa, `false` per fallback
- `attempts`: tentativi di fallback non riusciti prima del successo

Campi percorso:

- input PDF singolo: `details.pdf`
- input PDF multiplo: `details.pdfs[]` con voci `pdf`
- metadati di riscrittura percorso sandbox (quando applicabile): `rewrittenFrom`

## Comportamento degli errori

- Input PDF mancante: genera `pdf required: provide a path or URL to a PDF document`
- Troppi PDF: restituisce errore strutturato in `details.error = "too_many_pdfs"`
- Schema riferimento non supportato: restituisce `details.error = "unsupported_pdf_reference"`
- Modalità nativa con `pages`: genera un errore chiaro `pages is not supported with native PDF providers`

## Esempi

PDF singolo:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Più PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modello fallback con filtro pagine:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Correlati

- [Panoramica strumenti](/it/tools) - tutti gli strumenti disponibili dell'agente
- [Riferimento configurazione](/it/gateway/config-agents#agent-defaults) - configurazione pdfMaxBytesMb e pdfMaxPages
