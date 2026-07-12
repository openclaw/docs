---
x-i18n:
    generated_at: "2026-07-12T06:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Guida alla documentazione

Questa directory contiene le regole per la redazione della documentazione, i collegamenti Mintlify e i criteri di internazionalizzazione della documentazione.

## Regole di Mintlify

- La documentazione è ospitata su Mintlify (`https://docs.openclaw.ai`).
- I collegamenti interni alla documentazione in `docs/**/*.md` devono rimanere relativi alla radice, senza suffisso `.md` o `.mdx` (esempio: `[Configurazione](/gateway/configuration)`).
- I riferimenti incrociati alle sezioni devono utilizzare ancore su percorsi relativi alla radice (esempio: `[Hook](/gateway/configuration-reference#hooks)`).
- I titoli della documentazione devono evitare i trattini lunghi e gli apostrofi, poiché in questi casi la generazione delle ancore di Mintlify è fragile.
- I README e gli altri documenti visualizzati da GitHub devono mantenere URL assoluti della documentazione, affinché i collegamenti funzionino al di fuori di Mintlify.
- Il contenuto della documentazione deve rimanere generico: niente nomi di dispositivi personali, nomi host o percorsi locali; utilizzare segnaposto come `user@gateway-host`.

## Regole per il contenuto della documentazione

- Nella documentazione, nei testi dell'interfaccia utente e negli elenchi di selezione, ordinare alfabeticamente servizi e provider, a meno che la sezione non descriva esplicitamente l'ordine di esecuzione o di rilevamento automatico.
- Mantenere la denominazione dei plugin inclusi coerente con le regole terminologiche sui plugin valide per l'intero repository nel file `AGENTS.md` radice.
- Documentazione generata, da non modificare mai manualmente: `docs/plugins/reference/**`, `docs/plugins/reference.md` e `docs/plugins/plugin-inventory.md` derivano da `pnpm plugins:inventory:gen`; `docs/docs_map.md` da `pnpm docs:map:gen`; `docs/maturity/**` da `pnpm maturity:render`.

## Documentazione interna

- La documentazione privata e duratura per gli operatori deve risiedere in `~/Projects/manager/docs/`.
- La documentazione interna temporanea o di mirroring, locale al repository, può risiedere nella directory ignorata `docs/internal/`.
- Non aggiungere mai pagine `docs/internal/**` alla navigazione di `docs/docs.json` e non collegarle dalla documentazione pubblica.
- `scripts/docs-sync-publish.mjs` esclude e rimuove `docs/internal/**` dal repository pubblico di pubblicazione `openclaw/docs` se una pagina viene successivamente aggiunta forzatamente.
- La documentazione interna può menzionare percorsi del repository, nomi di applicazioni private, nomi di elementi di 1Password e procedure operative, ma non deve mai includere valori segreti.

## Modifica della scheda di valutazione della maturità

`taxonomy.yaml` e `qa/maturity-scores.yaml` sono gli input di origine; i documenti di maturità generati in `docs/maturity/` sono proiezioni e non devono essere modificati manualmente per punteggi, LTS, tassonomia, profili di controllo qualità o tabelle delle prove.
`scripts/qa/render-maturity-docs.ts` gestisce la generazione; utilizzare `pnpm maturity:render` per aggiornare i documenti registrati e `pnpm maturity:check` per verificarli.
`.github/workflows/maturity-scorecard.yml` genera anteprime degli artefatti e può aprire PR per i documenti generati; `.github/workflows/openclaw-release-checks.yml` lo avvia per il controllo qualità delle versioni.
Mantenere i dati deterministici `qa-evidence.json.scorecard` negli artefatti di GitHub Actions, a meno che un manutentore non richieda esplicitamente una proiezione ripulita da registrare nel repository.
Le sostituzioni manuali devono modificare lo stato di origine in una PR e spiegarne il motivo, includendo prove pubbliche o oscurate.

## Internazionalizzazione della documentazione

- La documentazione in lingue diverse dall'inglese non viene gestita in questo repository. L'output di pubblicazione generato si trova nel repository separato `openclaw/docs` (spesso clonato localmente come `../openclaw-docs`).
- Non aggiungere né modificare qui la documentazione localizzata in `docs/<locale>/**`.
- Considerare la documentazione inglese in questo repository e i file di glossario come fonte ufficiale.
- Pipeline: aggiornare qui la documentazione inglese, aggiornare `docs/.i18n/glossary.<locale>.json` secondo necessità, quindi lasciare che vengano eseguiti la sincronizzazione del repository di pubblicazione e `scripts/docs-i18n` in `openclaw/docs`.
- Prima di rieseguire `scripts/docs-i18n`, aggiungere voci al glossario per eventuali nuovi termini tecnici, titoli di pagina o brevi etichette di navigazione che devono rimanere in inglese o utilizzare una traduzione fissa.
- `pnpm docs:check-i18n-glossary` è il controllo di protezione per i titoli modificati della documentazione inglese e le brevi etichette interne della documentazione.
- La memoria di traduzione risiede nei file generati `docs/.i18n/*.tm.jsonl` nel repository di pubblicazione.
- Consultare `docs/.i18n/README.md`.
