---
read_when:
    - Vuoi analizzare PDF dagli agenti
    - Ti servono parametri e limiti esatti dello strumento PDF
    - Stai eseguendo il debug della modalità PDF nativa rispetto al fallback di estrazione
summary: Analizza uno o più documenti PDF con supporto nativo del provider e fallback di estrazione
title: Strumento PDF
x-i18n:
    generated_at: "2026-07-12T07:34:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analizza uno o più documenti PDF e restituisce del testo. Usa l'input nativo dei documenti sui modelli Anthropic e Google e, per tutti gli altri provider, ricorre all'estrazione di testo e immagini.

## Disponibilità

Lo strumento viene registrato solo quando OpenClaw riesce a individuare un modello compatibile con i PDF per l'agente. Ordine di risoluzione:

1. `agents.defaults.pdfModel` (modello primario/fallback espliciti)
2. `agents.defaults.imageModel` (modello primario/fallback espliciti)
3. Il modello risolto per la sessione/predefinito dell'agente, se il relativo provider supporta l'input PDF nativo (Anthropic, Google) o dispone già di un modello di visione configurato
4. Provider compatibili con immagini/visione rilevati automaticamente e dotati di autenticazione utilizzabile, dando priorità ai provider con PDF nativi

L'autenticazione di ogni candidato di fallback viene verificata prima dell'uso, quindi un `provider/model` configurato viene considerato solo se OpenClaw può autenticare tale provider per l'agente. Se non viene individuato alcun modello utilizzabile, lo strumento `pdf` non viene esposto.

## Riferimento degli input

<ParamField path="pdf" type="string">
Un percorso o URL di un PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Più percorsi o URL di PDF, fino a un totale di 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt di analisi.
</ParamField>

<ParamField path="pages" type="string">
Filtro delle pagine, ad esempio `1-5` o `1,3,7-9`. Non supportato nella modalità nativa del provider.
</ParamField>

<ParamField path="password" type="string">
Password per i PDF crittografati. Si applica a ogni PDF nella richiesta; viene usata solo dalla modalità di fallback con estrazione.
</ParamField>

<ParamField path="model" type="string">
Sostituzione facoltativa del modello nel formato `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite di dimensione per PDF in MB. Il valore predefinito è `agents.defaults.pdfMaxBytesMb` oppure `10` se non impostato.
</ParamField>

Note:

- `pdf` e `pdfs` vengono uniti e deduplicati prima del caricamento; è necessario specificarne almeno uno.
- `pages` viene interpretato come numeri di pagina con indice iniziale 1, deduplicati, ordinati e limitati a `agents.defaults.pdfMaxPages` (valore predefinito `20`). Un intervallo che non corrisponde ad alcuna pagina entro i limiti genera un errore prima della chiamata al modello.

## Riferimenti PDF supportati

- Percorso di un file locale (inclusa l'espansione di `~`)
- URL `file://`
- URL `http://` e `https://`
- Riferimenti in ingresso gestiti da OpenClaw, come `media://inbound/<id>`

Gli altri schemi URI, ad esempio `ftp://`, restituiscono `details.error = "unsupported_pdf_reference"`. Gli URL remoti `http(s)` vengono rifiutati quando lo strumento viene eseguito in sandbox. Quando è abilitata la politica che limita i file all'area di lavoro, i percorsi locali esterni alle radici consentite vengono rifiutati; sono comunque permessi i riferimenti in ingresso gestiti e i percorsi riprodotti nell'archivio dei contenuti multimediali in ingresso di OpenClaw.

## Modalità di esecuzione

### Modalità nativa del provider

Utilizzata per i provider `anthropic` e `google`, gli unici che attualmente dichiarano il supporto nativo dei documenti PDF. I byte PDF non elaborati vengono inviati direttamente all'API del provider come documento nativo/parte PDF incorporata per ciascun file.

Limiti:

- `pages` non è supportato; se impostato, lo strumento genera `pages is not supported with native PDF providers`.
- `password` non è supportato; se impostato, lo strumento genera `password is not supported with native PDF providers`. Per i PDF crittografati, usa un modello non nativo.

### Modalità di fallback con estrazione

Utilizzata per tutti gli altri provider.

1. Estrae il testo dalle pagine selezionate (fino a `agents.defaults.pdfMaxPages`, valore predefinito `20`) tramite il plugin `document-extract` incluso, che usa il pacchetto `clawpdf` (PDFium WebAssembly) per estrarre testo e immagini.
2. Se il testo estratto contiene meno di `200` caratteri, converte le stesse pagine in immagini PNG. Il budget di rendering è di `4,000,000` pixel complessivi, condivisi tra tutte le pagine che richiedono immagini (assegnati proporzionalmente per ogni pagina rimanente, non per singola pagina); le pagine che contengono già una quantità sufficiente di testo non vengono quindi convertite.
3. Invia al modello selezionato il testo estratto, le eventuali immagini convertite e il prompt.

Dettagli:

- I PDF crittografati vengono aperti con il parametro `password` di primo livello.
- Se il modello non supporta l'input di immagini e non è presente testo estraibile, lo strumento genera un errore.
- Se il rendering delle immagini non riesce, OpenClaw elimina le immagini e prosegue con il testo estratto.
- Se il modello di destinazione supporta solo il testo e l'estrazione ha prodotto immagini, OpenClaw elimina le immagini e invia esclusivamente il testo.

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

| Chiave                          | Valore predefinito | Significato                                                                                                                    |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `agents.defaults.pdfModel`      | non impostato      | Modelli PDF primario/fallback espliciti; usa come fallback `imageModel`, quindi il modello della sessione.                     |
| `agents.defaults.pdfMaxBytesMb` | `10`               | Limite di dimensione per PDF in MB.                                                                                            |
| `agents.defaults.pdfMaxPages`   | `20`               | Numero massimo di pagine elaborate per PDF.                                                                                    |

Consulta il [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) per i dettagli completi sui campi.

## Dettagli dell'output

Lo strumento restituisce il testo in `content[0].text` e i metadati strutturati in `details`.

Campi `details` comuni:

- `model`: riferimento del modello risolto (`provider/model`)
- `native`: `true` per la modalità nativa del provider, `false` per il fallback
- `attempts`: tentativi di fallback non riusciti prima del successo

Campi dei percorsi:

- Input di un singolo PDF: `details.pdf`
- Input di più PDF: `details.pdfs[]` con voci `pdf`
- Metadati di riscrittura del percorso della sandbox (quando applicabile): `rewrittenFrom`

## Comportamento in caso di errore

| Condizione                         | Risultato                                                       |
| ---------------------------------- | --------------------------------------------------------------- |
| Nessun PDF in input                | Genera `pdf required: provide a path or URL to a PDF document`   |
| Più di 10 PDF                      | `details.error = "too_many_pdfs"`                               |
| Schema di riferimento non supportato | `details.error = "unsupported_pdf_reference"`                 |
| `pages` con un provider nativo     | Genera `pages is not supported with native PDF providers`       |
| `password` con un provider nativo  | Genera `password is not supported with native PDF providers`    |

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

Modello di fallback con filtro delle pagine:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF crittografato con fallback di estrazione:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Correlati

- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti disponibili per gli agenti
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) - configurazione di pdfMaxBytesMb e pdfMaxPages
