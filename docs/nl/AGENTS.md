---
x-i18n:
    generated_at: "2026-04-29T22:22:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 16
---

# Documentatiegids

Deze directory beheert het schrijven van documentatie, Mintlify-linkregels en het i18n-beleid voor documentatie.

## Mintlify-regels

- Documentatie wordt gehost op Mintlify (`https://docs.openclaw.ai`).
- Interne documentatielinks in `docs/**/*.md` moeten root-relatief blijven zonder `.md`- of `.mdx`-suffix (voorbeeld: `[Config](/gateway/configuration)`).
- Kruisverwijzingen naar secties moeten anchors op root-relatieve paden gebruiken (voorbeeld: `[Hooks](/gateway/configuration-reference#hooks)`).
- Documentatiekoppen moeten em-dashes en apostroffen vermijden omdat Mintlify-anchor-generatie daar kwetsbaar voor is.
- README en andere door GitHub weergegeven documentatie moeten absolute documentatie-URL's behouden, zodat links buiten Mintlify werken.
- Documentatie-inhoud moet algemeen blijven: geen persoonlijke apparaatnamen, hostnamen of lokale paden; gebruik placeholders zoals `user@gateway-host`.

## Regels voor documentatie-inhoud

- Voor documentatie, UI-tekst en keuzelijsten: orden services/providers alfabetisch, tenzij de sectie expliciet runtimevolgorde of automatische detectievolgorde beschrijft.
- Houd de naamgeving van gebundelde Plugin consistent met de repo-brede Plugin-terminologieregels in de root-`AGENTS.md`.

## Documentatie-i18n

- Anderstalige documentatie wordt niet in deze repo onderhouden. De gegenereerde publicatie-output staat in de aparte `openclaw/docs`-repo (vaak lokaal gekloond als `../openclaw-docs`).
- Voeg hier geen gelokaliseerde documentatie toe onder `docs/<locale>/**` en bewerk die ook niet.
- Behandel Engelstalige documentatie in deze repo plus glossary-bestanden als de bron van waarheid.
- Pijplijn: werk Engelstalige documentatie hier bij, werk `docs/.i18n/glossary.<locale>.json` zo nodig bij, en laat daarna de synchronisatie van de publicatierepo en `scripts/docs-i18n` draaien in `openclaw/docs`.
- Voeg voordat je `scripts/docs-i18n` opnieuw uitvoert glossary-vermeldingen toe voor nieuwe technische termen, paginatitels of korte navigatielabels die Engels moeten blijven of een vaste vertaling moeten gebruiken.
- `pnpm docs:check-i18n-glossary` is de controle voor gewijzigde Engelstalige documentatietitels en korte interne documentatielabels.
- Vertaalgeheugen staat in gegenereerde `docs/.i18n/*.tm.jsonl`-bestanden in de publicatierepo.
- Zie `docs/.i18n/README.md`.
