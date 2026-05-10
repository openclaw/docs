---
x-i18n:
    generated_at: "2026-05-10T19:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Guida alla documentazione

Questa directory gestisce la scrittura della documentazione, le regole dei link di Mintlify e la policy i18n della documentazione.

## Regole di Mintlify

- La documentazione è ospitata su Mintlify (`https://docs.openclaw.ai`).
- I link interni alla documentazione in `docs/**/*.md` devono rimanere relativi alla radice, senza suffisso `.md` o `.mdx` (esempio: `[Config](/gateway/configuration)`).
- I riferimenti incrociati alle sezioni dovrebbero usare ancore su percorsi relativi alla radice (esempio: `[Hooks](/gateway/configuration-reference#hooks)`).
- Le intestazioni della documentazione dovrebbero evitare trattini lunghi e apostrofi perché la generazione delle ancore di Mintlify è fragile in quei casi.
- Il README e altra documentazione renderizzata da GitHub dovrebbero mantenere URL assoluti della documentazione, così i link funzionano fuori da Mintlify.
- I contenuti della documentazione devono rimanere generici: niente nomi di dispositivi personali, nomi host o percorsi locali; usa segnaposto come `user@gateway-host`.

## Regole per i contenuti della documentazione

- Per documentazione, testi UI ed elenchi dei selettori, ordina servizi/provider alfabeticamente, a meno che la sezione descriva esplicitamente l'ordine di runtime o l'ordine di rilevamento automatico.
- Mantieni la denominazione dei plugin inclusi coerente con le regole terminologiche sui plugin valide in tutto il repo nel file `AGENTS.md` radice.

## Documentazione interna

- La documentazione privata di lungo periodo per operatori appartiene a `~/Projects/manager/docs/`.
- La documentazione interna locale al repo usata come appunti/mirror può risiedere sotto `docs/internal/` ignorato.
- Non aggiungere mai pagine `docs/internal/**` alla navigazione di `docs/docs.json` né collegarle dalla documentazione pubblica.
- `scripts/docs-sync-publish.mjs` esclude e rimuove `docs/internal/**` dal repo pubblico di pubblicazione `openclaw/docs` se una pagina viene aggiunta forzatamente in seguito.
- La documentazione interna può menzionare percorsi del repo, nomi di app private, nomi di elementi 1Password e runbook, ma non deve mai includere valori segreti.

## i18n della documentazione

- La documentazione in lingue straniere non è mantenuta in questo repo. L'output di pubblicazione generato vive nel repo separato `openclaw/docs` (spesso clonato localmente come `../openclaw-docs`).
- Non aggiungere né modificare qui documentazione localizzata sotto `docs/<locale>/**`.
- Considera la documentazione in inglese in questo repo, insieme ai file di glossario, come fonte di verità.
- Pipeline: aggiorna qui la documentazione in inglese, aggiorna `docs/.i18n/glossary.<locale>.json` secondo necessità, quindi lascia che la sincronizzazione del repo di pubblicazione e `scripts/docs-i18n` vengano eseguiti in `openclaw/docs`.
- Prima di rieseguire `scripts/docs-i18n`, aggiungi voci di glossario per qualsiasi nuovo termine tecnico, titolo di pagina o breve etichetta di navigazione che debba rimanere in inglese o usare una traduzione fissa.
- `pnpm docs:check-i18n-glossary` è la guardia per i titoli della documentazione in inglese modificati e le brevi etichette interne della documentazione.
- La memoria di traduzione vive nei file generati `docs/.i18n/*.tm.jsonl` nel repo di pubblicazione.
- Vedi `docs/.i18n/README.md`.
