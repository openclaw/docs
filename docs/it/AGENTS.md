---
x-i18n:
    generated_at: "2026-04-23T08:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Guida alla documentazione

Questa directory gestisce l’authoring della documentazione, le regole dei link di Mintlify e la policy di i18n della documentazione.

## Regole di Mintlify

- La documentazione è ospitata su Mintlify (`https://docs.openclaw.ai`).
- I link interni alla documentazione in `docs/**/*.md` devono restare root-relative senza suffisso `.md` o `.mdx` (esempio: `[Config](/gateway/configuration)`).
- I riferimenti incrociati alle sezioni devono usare ancore su percorsi root-relative (esempio: `[Hooks](/gateway/configuration-reference#hooks)`).
- Le intestazioni della documentazione dovrebbero evitare lineette lunghe ed apostrofi perché la generazione delle ancore di Mintlify è fragile in quei casi.
- README e altri documenti renderizzati su GitHub devono mantenere URL assoluti della documentazione affinché i link funzionino anche fuori da Mintlify.
- Il contenuto della documentazione deve restare generico: niente nomi personali di dispositivi, hostname o percorsi locali; usare segnaposto come `user@gateway-host`.

## Regole sui contenuti della documentazione

- Per la documentazione, il testo dell’interfaccia e gli elenchi nei selettori, ordinare servizi/provider alfabeticamente, a meno che la sezione non descriva esplicitamente l’ordine di esecuzione o l’ordine di rilevamento automatico.
- Mantenere coerente la denominazione dei plugin inclusi con le regole terminologiche repo-wide sui plugin nel `AGENTS.md` radice.

## i18n della documentazione

- La documentazione in lingua straniera non viene mantenuta in questo repository. L’output pubblicato generato si trova nel repository separato `openclaw/docs` (spesso clonato localmente come `../openclaw-docs`).
- Non aggiungere né modificare documentazione localizzata in `docs/<locale>/**` qui.
- Trattare la documentazione in inglese in questo repository, insieme ai file di glossario, come fonte di verità.
- Pipeline: aggiornare qui la documentazione inglese, aggiornare `docs/.i18n/glossary.<locale>.json` se necessario, quindi lasciare che il sync del repository di pubblicazione e `scripts/docs-i18n` vengano eseguiti in `openclaw/docs`.
- Prima di rieseguire `scripts/docs-i18n`, aggiungere voci di glossario per eventuali nuovi termini tecnici, titoli di pagina o brevi etichette di navigazione che devono restare in inglese o usare una traduzione fissa.
- `pnpm docs:check-i18n-glossary` è il controllo per i titoli della documentazione inglese modificati e per le brevi etichette interne della documentazione.
- La translation memory si trova nei file generati `docs/.i18n/*.tm.jsonl` nel repository di pubblicazione.
- Vedere `docs/.i18n/README.md`.
