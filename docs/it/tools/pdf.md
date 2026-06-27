---
read_when:
    - Vuoi analizzare PDF provenienti dagli agenti
    - Ti servono i parametri e i limiti esatti dello strumento PDF
    - Stai eseguendo il debug della modalità PDF nativa rispetto al fallback di estrazione
summary: Analizza uno o più documenti PDF con supporto nativo del provider e fallback di estrazione
title: Strumento PDF
x-i18n:
    generated_at: "2026-06-27T18:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analizza uno o più documenti PDF e restituisce testo.

Comportamento rapido:

- Modalità provider nativa per i provider di modelli Anthropic e Google.
- Modalità di ripiego con estrazione per altri provider (prima estrae il testo, poi le immagini delle pagine quando necessario).
- Supporta input singolo (`pdf`) o multiplo (`pdfs`), massimo 10 PDF per chiamata.

## Disponibilità

Lo strumento viene registrato solo quando OpenClaw può risolvere una configurazione di modello compatibile con PDF per l’agente:

1. `agents.defaults.pdfModel`
2. ripiego su `agents.defaults.imageModel`
3. ripiego sul modello di sessione/predefinito risolto dell’agente
4. se i provider PDF nativi sono supportati da autenticazione, preferiscili rispetto ai candidati generici di ripiego per immagini

Se non è possibile risolvere alcun modello utilizzabile, lo strumento `pdf` non viene esposto.

Note sulla disponibilità:

- La catena di ripiego è consapevole dell’autenticazione. Un `provider/model` configurato conta solo se
  OpenClaw può effettivamente autenticare quel provider per l’agente.
- I provider PDF nativi sono attualmente **Anthropic** e **Google**.
- Se il provider di sessione/predefinito risolto ha già un modello di visione/PDF
  configurato, lo strumento PDF lo riutilizza prima di ricorrere ad altri
  provider supportati da autenticazione.

## Riferimento input

<ParamField path="pdf" type="string">
Un percorso o URL di PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Più percorsi o URL di PDF, fino a 10 in totale.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt di analisi.
</ParamField>

<ParamField path="pages" type="string">
Filtro delle pagine come `1-5` o `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
Password per PDF cifrati in modalità di ripiego con estrazione.
</ParamField>

<ParamField path="model" type="string">
Override opzionale del modello nel formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite di dimensione per PDF in MB. Il valore predefinito è `agents.defaults.pdfMaxBytesMb` o `10`.
</ParamField>

Note sull’input:

- `pdf` e `pdfs` vengono uniti e deduplicati prima del caricamento.
- Se non viene fornito alcun input PDF, lo strumento restituisce un errore.
- `pages` viene interpretato come numeri di pagina con base 1, deduplicato, ordinato e limitato al massimo di pagine configurato.
- `password` si applica a ogni PDF nella richiesta ed è usato solo dalla modalità di ripiego con estrazione.
- Il valore predefinito di `maxBytesMb` è `agents.defaults.pdfMaxBytesMb` o `10`.

## Riferimenti PDF supportati

- percorso di file locale (inclusa l’espansione di `~`)
- URL `file://`
- URL `http://` e `https://`
- riferimenti in ingresso gestiti da OpenClaw, come `media://inbound/<id>`

Note sui riferimenti:

- Altri schemi URI (per esempio `ftp://`) vengono rifiutati con `unsupported_pdf_reference`.
- In modalità sandbox, gli URL remoti `http(s)` vengono rifiutati.
- Con la policy file limitata al workspace abilitata, i percorsi di file locali esterni alle radici consentite vengono rifiutati.
- I riferimenti in ingresso gestiti e i percorsi riprodotti nell’archivio multimediale in ingresso di OpenClaw sono consentiti con la policy file limitata al workspace.

## Modalità di esecuzione

### Modalità provider nativa

La modalità nativa viene usata per i provider `anthropic` e `google`.
Lo strumento invia i byte PDF grezzi direttamente alle API dei provider.

Limiti della modalità nativa:

- `pages` non è supportato. Se impostato, lo strumento restituisce un errore.
- `password` non è supportato. Usa un modello non nativo per analizzare PDF cifrati.
- L’input multi-PDF è supportato; ogni PDF viene inviato come blocco documento nativo /
  parte PDF inline prima del prompt.

### Modalità di ripiego con estrazione

La modalità di ripiego viene usata per provider non nativi.

Flusso:

1. Estrai il testo dalle pagine selezionate (fino a `agents.defaults.pdfMaxPages`, valore predefinito `20`).
2. Se la lunghezza del testo estratto è inferiore a `200` caratteri, renderizza le pagine selezionate in immagini PNG e includile.
3. Invia il contenuto estratto più il prompt al modello selezionato.

Dettagli del ripiego:

- L’estrazione delle immagini delle pagine usa un budget di pixel di `4,000,000`.
- I PDF cifrati possono essere aperti con il parametro di primo livello `password`.
- Se il modello di destinazione non supporta input immagine e non c’è testo estraibile, lo strumento restituisce un errore.
- Se l’estrazione del testo riesce ma l’estrazione delle immagini richiederebbe la visione su un
  modello solo testo, OpenClaw scarta le immagini renderizzate e continua con il
  testo estratto.
- Il ripiego con estrazione usa il Plugin `document-extract` incluso. Il Plugin possiede
  `clawpdf`, che fornisce estrazione del testo e rendering delle immagini tramite PDFium
  WebAssembly.

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

- `model`: riferimento del modello risolto (`provider/model`)
- `native`: `true` per la modalità provider nativa, `false` per il ripiego
- `attempts`: tentativi di ripiego non riusciti prima del successo

Campi percorso:

- input PDF singolo: `details.pdf`
- input PDF multipli: `details.pdfs[]` con voci `pdf`
- metadati di riscrittura del percorso sandbox (quando applicabile): `rewrittenFrom`

## Comportamento degli errori

- Input PDF mancante: genera `pdf required: provide a path or URL to a PDF document`
- Troppi PDF: restituisce un errore strutturato in `details.error = "too_many_pdfs"`
- Schema di riferimento non supportato: restituisce `details.error = "unsupported_pdf_reference"`
- Modalità nativa con `pages`: genera un errore chiaro `pages is not supported with native PDF providers`

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

Modello di ripiego con filtro pagine:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF cifrato con ripiego tramite estrazione:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Correlati

- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti agente disponibili
- [Riferimento configurazione](/it/gateway/config-agents#agent-defaults) - configurazione di pdfMaxBytesMb e pdfMaxPages
