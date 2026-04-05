---
x-i18n:
    generated_at: "2026-04-05T13:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f07671afbba2efa77f5fb43ebed242d0fdca835f7810fdd60998e537b73d1efc
    source_path: .i18n/README.md
    workflow: 15
---

# Risorse i18n della documentazione di OpenClaw

Questa cartella archivia la configurazione di traduzione per il repository sorgente della documentazione.

Gli alberi delle lingue generati e la translation memory live ora si trovano nel repository di pubblicazione:

- repository: `openclaw/docs`
- checkout locale: `~/Projects/openclaw-docs`

## Fonte di verità

- La documentazione in inglese viene creata in `openclaw/openclaw`.
- L'albero della documentazione sorgente si trova in `docs/`.
- Il repository sorgente non conserva più alberi di lingue generati versionati come `docs/zh-CN/**`, `docs/ja-JP/**`, `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**` o `docs/pl/**`.

## Flusso end-to-end

1. Modifica la documentazione in inglese in `openclaw/openclaw`.
2. Esegui il push su `main`.
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` rispecchia l'albero della documentazione in `openclaw/docs`.
4. Lo script di sincronizzazione riscrive `docs/docs.json` di pubblicazione in modo che i blocchi del selettore delle lingue generati esistano lì anche se non sono più versionati nel repository sorgente.
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` aggiorna `docs/zh-CN/**` una volta al giorno, su richiesta e dopo i dispatch di release del repository sorgente.
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` fa lo stesso per `docs/ja-JP/**`.
7. `openclaw/docs/.github/workflows/translate-es.yml`, `translate-pt-br.yml`, `translate-ko.yml`, `translate-de.yml`, `translate-fr.yml`, `translate-ar.yml`, `translate-it.yml`, `translate-tr.yml`, `translate-id.yml` e `translate-pl.yml` fanno lo stesso per `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**` e `docs/pl/**`.

## Perché esiste questa separazione

- Mantenere l'output delle lingue generate fuori dal repository principale del prodotto.
- Mantenere Mintlify su un unico albero di documentazione pubblicato.
- Preservare il selettore di lingua integrato lasciando che il repository di pubblicazione gestisca gli alberi delle lingue generate.

## File in questa cartella

- `glossary.<lang>.json` — mappature dei termini preferiti usate come guida del prompt.
- `ar-navigation.json`, `de-navigation.json`, `es-navigation.json`, `fr-navigation.json`, `id-navigation.json`, `it-navigation.json`, `ja-navigation.json`, `ko-navigation.json`, `pl-navigation.json`, `pt-BR-navigation.json`, `tr-navigation.json`, `zh-Hans-navigation.json` — blocchi del selettore delle lingue di Mintlify reinseriti nel repository di pubblicazione durante la sincronizzazione.
- `<lang>.tm.jsonl` — translation memory indicizzata per workflow + modello + hash del testo.

In questo repository, i file TM delle lingue generate come `docs/.i18n/zh-CN.tm.jsonl`, `docs/.i18n/ja-JP.tm.jsonl`, `docs/.i18n/es.tm.jsonl`, `docs/.i18n/pt-BR.tm.jsonl`, `docs/.i18n/ko.tm.jsonl`, `docs/.i18n/de.tm.jsonl`, `docs/.i18n/fr.tm.jsonl`, `docs/.i18n/ar.tm.jsonl`, `docs/.i18n/it.tm.jsonl`, `docs/.i18n/tr.tm.jsonl`, `docs/.i18n/id.tm.jsonl` e `docs/.i18n/pl.tm.jsonl` intenzionalmente non vengono più versionati.

## Formato del glossario

`glossary.<lang>.json` è un array di voci:

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

Campi:

- `source`: frase inglese (o sorgente) da preferire.
- `target`: output di traduzione preferito.

## Meccanica della traduzione

- `scripts/docs-i18n` continua a gestire la generazione delle traduzioni.
- La modalità documentazione scrive `x-i18n.source_hash` in ogni pagina tradotta.
- Ogni workflow di pubblicazione precalcola un elenco di file in sospeso confrontando l'hash corrente della sorgente inglese con il `x-i18n.source_hash` della lingua memorizzato.
- Se il conteggio dei file in sospeso è `0`, il costoso passaggio di traduzione viene saltato completamente.
- Se ci sono file in sospeso, il workflow traduce solo quei file.
- Il workflow di pubblicazione ritenta gli errori transitori di formato del modello, ma i file invariati restano saltati perché lo stesso controllo hash viene eseguito a ogni nuovo tentativo.
- Il repository sorgente invia anche aggiornamenti per zh-CN, ja-JP, es, pt-BR, ko, de, fr, ar, it, tr, id e pl dopo le release GitHub pubblicate, così la documentazione di release può aggiornarsi senza attendere il cron giornaliero.

## Note operative

- I metadati di sincronizzazione vengono scritti in `.openclaw-sync/source.json` nel repository di pubblicazione.
- Secret del repository sorgente: `OPENCLAW_DOCS_SYNC_TOKEN`
- Secret del repository di pubblicazione: `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- Se l'output di una lingua sembra obsoleto, controlla prima il workflow `Translate <locale>` corrispondente in `openclaw/docs`.
