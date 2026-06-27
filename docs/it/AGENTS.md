---
x-i18n:
    generated_at: "2026-06-27T17:08:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Guida alla documentazione

Questa directory gestisce la redazione della documentazione, le regole dei link di Mintlify e la policy i18n della documentazione.

## Regole di Mintlify

- La documentazione è ospitata su Mintlify (`https://docs.openclaw.ai`).
- I link interni alla documentazione in `docs/**/*.md` devono restare relativi alla radice, senza suffisso `.md` o `.mdx` (esempio: `[Config](/gateway/configuration)`).
- I riferimenti incrociati alle sezioni dovrebbero usare anchor su percorsi relativi alla radice (esempio: `[Hooks](/gateway/configuration-reference#hooks)`).
- I titoli della documentazione dovrebbero evitare trattini lunghi e apostrofi perché la generazione degli anchor di Mintlify è fragile in quei casi.
- README e altra documentazione renderizzata da GitHub dovrebbero mantenere URL assoluti della documentazione, così i link funzionano fuori da Mintlify.
- I contenuti della documentazione devono restare generici: niente nomi di dispositivi personali, hostname o percorsi locali; usa placeholder come `user@gateway-host`.

## Regole sui contenuti della documentazione

- Per documentazione, testi dell'interfaccia e liste di selezione, ordina servizi/provider alfabeticamente, a meno che la sezione non descriva esplicitamente l'ordine di runtime o l'ordine di rilevamento automatico.
- Mantieni la nomenclatura dei Plugin inclusi coerente con le regole terminologiche sui Plugin valide per tutto il repo nel file `AGENTS.md` radice.

## Documentazione interna

- La documentazione privata di lunga durata per gli operatori va in `~/Projects/manager/docs/`.
- La documentazione interna locale al repo usata come appunti/mirror può stare sotto `docs/internal/`, che è ignorato.
- Non aggiungere mai pagine `docs/internal/**` alla navigazione di `docs/docs.json` né collegarle dalla documentazione pubblica.
- `scripts/docs-sync-publish.mjs` esclude e rimuove `docs/internal/**` dal repo di pubblicazione pubblico `openclaw/docs` se una pagina viene aggiunta forzatamente in seguito.
- La documentazione interna può menzionare percorsi del repo, nomi di app private, nomi di elementi 1Password e runbook, ma non deve mai includere valori segreti.

## Modifica della scheda di valutazione della maturità

`taxonomy.yaml` e `qa/maturity-scores.yaml` sono gli input sorgente; la documentazione di maturità generata sotto `docs/maturity/` è una proiezione e non dovrebbe essere modificata a mano per punteggio, LTS, tassonomia, profilo QA o tabelle delle evidenze.
`scripts/qa/render-maturity-docs.ts` gestisce la generazione; usa `pnpm maturity:render` per aggiornare la documentazione commitata e `pnpm maturity:check` per verificarla.
`.github/workflows/maturity-scorecard.yml` renderizza anteprime degli artefatti e può aprire PR di documentazione generata; `.github/workflows/openclaw-release-checks.yml` lo avvia per la QA di release.
Mantieni i dati deterministici `qa-evidence.json.scorecard` negli artefatti di GitHub Actions, a meno che un maintainer non chieda esplicitamente una proiezione sanificata e commitata.
Gli override umani devono modificare lo stato sorgente in una PR e spiegare il motivo insieme a evidenze pubbliche o oscurate.

## i18n della documentazione

- La documentazione in lingue straniere non è mantenuta in questo repo. L'output di pubblicazione generato vive nel repo separato `openclaw/docs` (spesso clonato localmente come `../openclaw-docs`).
- Non aggiungere né modificare qui documentazione localizzata sotto `docs/<locale>/**`.
- Considera la documentazione in inglese in questo repo più i file di glossario come fonte autorevole.
- Pipeline: aggiorna qui la documentazione in inglese, aggiorna `docs/.i18n/glossary.<locale>.json` secondo necessità, quindi lascia che la sincronizzazione del repo di pubblicazione e `scripts/docs-i18n` vengano eseguiti in `openclaw/docs`.
- Prima di rieseguire `scripts/docs-i18n`, aggiungi voci di glossario per eventuali nuovi termini tecnici, titoli di pagina o brevi etichette di navigazione che devono restare in inglese o usare una traduzione fissa.
- `pnpm docs:check-i18n-glossary` è il controllo per i titoli della documentazione inglese modificati e le brevi etichette interne della documentazione.
- La memoria di traduzione vive nei file generati `docs/.i18n/*.tm.jsonl` nel repo di pubblicazione.
- Vedi `docs/.i18n/README.md`.
