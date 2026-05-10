---
x-i18n:
    generated_at: "2026-05-10T19:20:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Documentatiehandleiding

Deze directory is eigenaar van het schrijven van documentatie, Mintlify-linkregels en het i18n-beleid voor documentatie.

## Mintlify-regels

- Documentatie wordt gehost op Mintlify (`https://docs.openclaw.ai`).
- Interne documentatielinks in `docs/**/*.md` moeten root-relatief blijven zonder `.md`- of `.mdx`-suffix (voorbeeld: `[Config](/gateway/configuration)`).
- Kruisverwijzingen naar secties moeten anchors op root-relatieve paden gebruiken (voorbeeld: `[Hooks](/gateway/configuration-reference#hooks)`).
- Documentatiekoppen moeten gedachtestreepjes en apostroffen vermijden, omdat Mintlify-anchorgeneratie daar kwetsbaar is.
- README en andere door GitHub weergegeven documentatie moeten absolute documentatie-URL's behouden, zodat links buiten Mintlify werken.
- Documentatie-inhoud moet generiek blijven: geen persoonlijke apparaatnamen, hostnamen of lokale paden; gebruik placeholders zoals `user@gateway-host`.

## Regels voor documentatie-inhoud

- Voor documentatie, UI-tekst en keuzelijsten moeten services/providers alfabetisch worden geordend, tenzij de sectie expliciet runtime-volgorde of automatische-detectievolgorde beschrijft.
- Houd de naamgeving van gebundelde Plugins consistent met de repo-brede Plugin-terminologieregels in de root `AGENTS.md`.

## Interne documentatie

- Langlopende private operatordocumentatie hoort thuis in `~/Projects/manager/docs/`.
- Repo-lokale interne klad-/spiegeldocumentatie mag onder genegeerde `docs/internal/` staan.
- Voeg nooit `docs/internal/**`-pagina's toe aan de navigatie in `docs/docs.json` en link er niet naar vanuit openbare documentatie.
- `scripts/docs-sync-publish.mjs` sluit `docs/internal/**` uit en verwijdert het uit de openbare publicatierepo `openclaw/docs` als een pagina later geforceerd wordt toegevoegd.
- Interne documentatie mag repo-paden, private app-namen, 1Password-itemnamen en runbooks noemen, maar mag nooit geheime waarden bevatten.

## Documentatie-i18n

- Documentatie in vreemde talen wordt niet in deze repo onderhouden. De gegenereerde publicatie-uitvoer staat in de aparte repo `openclaw/docs` (vaak lokaal gekloond als `../openclaw-docs`).
- Voeg hier geen gelokaliseerde documentatie toe onder `docs/<locale>/**` en bewerk die niet.
- Behandel Engelse documentatie in deze repo plus woordenlijstbestanden als de bron van waarheid.
- Pipeline: werk Engelse documentatie hier bij, werk `docs/.i18n/glossary.<locale>.json` zo nodig bij en laat daarna de publicatierepo-synchronisatie en `scripts/docs-i18n` draaien in `openclaw/docs`.
- Voeg voordat je `scripts/docs-i18n` opnieuw uitvoert woordenlijstitems toe voor nieuwe technische termen, paginatitels of korte navigatielabels die in het Engels moeten blijven of een vaste vertaling moeten gebruiken.
- `pnpm docs:check-i18n-glossary` is de guard voor gewijzigde Engelse documentatietitels en korte interne documentatielabels.
- Translation memory staat in gegenereerde `docs/.i18n/*.tm.jsonl`-bestanden in de publicatierepo.
- Zie `docs/.i18n/README.md`.
