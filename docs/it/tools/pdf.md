---
read_when:
    - Vuoi analizzare PDF dagli agenti
    - Hai bisogno dei parametri e dei limiti esatti dello strumento pdf
    - Stai eseguendo il debug della modalità PDF nativa rispetto al fallback di estrazione
summary: Analizza uno o più documenti PDF con supporto nativo del provider e fallback di estrazione
title: Strumento PDF
x-i18n:
    generated_at: "2026-04-05T14:07:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# strumento PDF

`pdf` analizza uno o più documenti PDF e restituisce testo.

Comportamento rapido:

- Modalità provider nativa per i provider di modelli Anthropic e Google.
- Modalità fallback di estrazione per gli altri provider (prima estrae il testo, poi le immagini delle pagine quando necessario).
- Supporta input singolo (`pdf`) o multiplo (`pdfs`), massimo 10 PDF per chiamata.

## Disponibilità

Lo strumento viene registrato solo quando OpenClaw può risolvere una configurazione di modello compatibile con PDF per l'agente:

1. `agents.defaults.pdfModel`
2. fallback a `agents.defaults.imageModel`
3. fallback al modello di sessione/predefinito risolto dell'agente
4. se i provider PDF nativi sono supportati da auth, vengono preferiti rispetto ai candidati generici di fallback per immagini

Se non è possibile risolvere alcun modello utilizzabile, lo strumento `pdf` non viene esposto.

Note sulla disponibilità:

- La catena di fallback è consapevole dell'auth. Un `provider/model` configurato conta solo se
  OpenClaw può effettivamente autenticare quel provider per l'agente.
- I provider PDF nativi attualmente sono **Anthropic** e **Google**.
- Se il provider di sessione/predefinito risolto ha già un modello vision/PDF configurato,
  lo strumento PDF lo riutilizza prima di passare ad altri
  provider supportati da auth.

## Riferimento input

- `pdf` (`string`): un percorso o URL PDF
- `pdfs` (`string[]`): più percorsi o URL PDF, fino a 10 in totale
- `prompt` (`string`): prompt di analisi, valore predefinito `Analyze this PDF document.`
- `pages` (`string`): filtro pagine come `1-5` o `1,3,7-9`
- `model` (`string`): override facoltativo del modello (`provider/model`)
- `maxBytesMb` (`number`): limite di dimensione per PDF in MB

Note sull'input:

- `pdf` e `pdfs` vengono uniti e deduplicati prima del caricamento.
- Se non viene fornito alcun input PDF, lo strumento restituisce un errore.
- `pages` viene analizzato come numeri di pagina a base 1, deduplicati, ordinati e limitati al numero massimo di pagine configurato.
- `maxBytesMb` usa come valore predefinito `agents.defaults.pdfMaxBytesMb` oppure `10`.

## Riferimenti PDF supportati

- percorso file locale (inclusa l'espansione di `~`)
- URL `file://`
- URL `http://` e `https://`

Note sui riferimenti:

- Altri schemi URI (per esempio `ftp://`) vengono rifiutati con `unsupported_pdf_reference`.
- In modalità sandbox, gli URL remoti `http(s)` vengono rifiutati.
- Con la policy file limitata al workspace abilitata, i percorsi di file locali al di fuori delle radici consentite vengono rifiutati.

## Modalità di esecuzione

### Modalità provider nativa

La modalità nativa viene usata per i provider `anthropic` e `google`.
Lo strumento invia direttamente i byte PDF grezzi alle API del provider.

Limiti della modalità nativa:

- `pages` non è supportato. Se impostato, lo strumento restituisce un errore.
- L'input multi-PDF è supportato; ogni PDF viene inviato come blocco documento nativo /
  parte PDF inline prima del prompt.

### Modalità fallback di estrazione

La modalità fallback viene usata per i provider non nativi.

Flusso:

1. Estrae il testo dalle pagine selezionate (fino a `agents.defaults.pdfMaxPages`, valore predefinito `20`).
2. Se la lunghezza del testo estratto è inferiore a `200` caratteri, esegue il rendering delle pagine selezionate in immagini PNG e le include.
3. Invia il contenuto estratto più il prompt al modello selezionato.

Dettagli del fallback:

- L'estrazione delle immagini di pagina usa un budget pixel di `4,000,000`.
- Se il modello di destinazione non supporta input immagine e non c'è testo estraibile, lo strumento restituisce un errore.
- Se l'estrazione del testo riesce ma l'estrazione delle immagini richiederebbe la vision su un
  modello solo testo, OpenClaw elimina le immagini renderizzate e continua con il testo
  estratto.
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

## Dettagli output

Lo strumento restituisce testo in `content[0].text` e metadati strutturati in `details`.

Campi `details` comuni:

- `model`: riferimento modello risolto (`provider/model`)
- `native`: `true` per la modalità provider nativa, `false` per il fallback
- `attempts`: tentativi di fallback falliti prima del successo

Campi di percorso:

- input PDF singolo: `details.pdf`
- input PDF multiplo: `details.pdfs[]` con voci `pdf`
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

- [Panoramica degli strumenti](/tools) — tutti gli strumenti disponibili per gli agenti
- [Riferimento configurazione](/it/gateway/configuration-reference#agent-defaults) — configurazione `pdfMaxBytesMb` e `pdfMaxPages`
