---
x-i18n:
    generated_at: "2026-07-12T08:34:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Documentatiegids

Deze map is verantwoordelijk voor het schrijven van documentatie, de linkregels van Mintlify en het i18n-beleid voor documentatie.

## Mintlify-regels

- De documentatie wordt gehost op Mintlify (`https://docs.openclaw.ai`).
- Interne documentatielinks in `docs/**/*.md` moeten hoofdmaprelatief blijven, zonder het achtervoegsel `.md` of `.mdx` (voorbeeld: `[Configuratie](/gateway/configuration)`).
- Kruisverwijzingen naar secties moeten ankers op hoofdmaprelatieve paden gebruiken (voorbeeld: `[Hooks](/gateway/configuration-reference#hooks)`).
- Koppen in documentatie moeten gedachtestreepjes en apostroffen vermijden, omdat het genereren van ankers door Mintlify daarbij kwetsbaar is.
- De README en andere door GitHub weergegeven documentatie moeten absolute documentatie-URL's behouden, zodat links buiten Mintlify werken.
- De inhoud van de documentatie moet generiek blijven: geen persoonlijke apparaatnamen, hostnamen of lokale paden; gebruik tijdelijke aanduidingen zoals `user@gateway-host`.

## Regels voor documentatie-inhoud

- Sorteer services/providers in documentatie, UI-tekst en keuzelijsten alfabetisch, tenzij de sectie expliciet de uitvoeringsvolgorde of de volgorde van automatische detectie beschrijft.
- Houd de naamgeving van meegeleverde plugins consistent met de terminologieregels voor plugins die voor de hele repository gelden in het hoofdbestand `AGENTS.md`.
- Gegenereerde documentatie mag nooit handmatig worden bewerkt: `docs/plugins/reference/**`, `docs/plugins/reference.md` en `docs/plugins/plugin-inventory.md` worden gegenereerd met `pnpm plugins:inventory:gen`; `docs/docs_map.md` met `pnpm docs:map:gen`; `docs/maturity/**` met `pnpm maturity:render`.

## Interne documentatie

- Langdurig gebruikte privédocumentatie voor beheerders hoort thuis in `~/Projects/manager/docs/`.
- Interne, repositorylokale werk- of spiegeldocumentatie mag onder de genegeerde map `docs/internal/` staan.
- Voeg pagina's onder `docs/internal/**` nooit toe aan de navigatie in `docs/docs.json` en verwijs er niet naar vanuit openbare documentatie.
- `scripts/docs-sync-publish.mjs` sluit `docs/internal/**` uit en verwijdert deze map uit de openbare publicatierepository `openclaw/docs` als een pagina later geforceerd wordt toegevoegd.
- Interne documentatie mag repositorypaden, namen van privé-apps, namen van 1Password-items en draaiboeken vermelden, maar mag nooit geheime waarden bevatten.

## De volwassenheidsscorekaart bewerken

`taxonomy.yaml` en `qa/maturity-scores.yaml` zijn de broninvoer; gegenereerde volwassenheidsdocumentatie onder `docs/maturity/` is een afgeleide weergave en mag niet handmatig worden bewerkt voor scores, LTS, taxonomie, QA-profielen of bewijstabellen.
`scripts/qa/render-maturity-docs.ts` verzorgt de generatie; gebruik `pnpm maturity:render` om vastgelegde documentatie te vernieuwen en `pnpm maturity:check` om deze te verifiëren.
`.github/workflows/maturity-scorecard.yml` genereert voorbeeldartefacten en kan PR's voor gegenereerde documentatie openen; `.github/workflows/openclaw-release-checks.yml` start deze workflow voor release-QA.
Bewaar deterministische `qa-evidence.json.scorecard`-gegevens in GitHub Actions-artefacten, tenzij een maintainer expliciet om een opgeschoonde, vastgelegde afgeleide weergave vraagt.
Menselijke aanpassingen moeten de brontoestand in een PR wijzigen en de reden plus openbaar of geredigeerd bewijs toelichten.

## i18n voor documentatie

- Documentatie in andere talen wordt niet in deze repository onderhouden. De gegenereerde publicatie-uitvoer staat in de afzonderlijke repository `openclaw/docs` (die lokaal vaak als `../openclaw-docs` is gekloond).
- Voeg hier geen gelokaliseerde documentatie toe onder `docs/<locale>/**` en bewerk deze niet.
- Beschouw de Engelse documentatie in deze repository en de woordenlijstbestanden als de gezaghebbende bron.
- Pijplijn: werk hier de Engelse documentatie bij, werk zo nodig `docs/.i18n/glossary.<locale>.json` bij en laat daarna de synchronisatie met de publicatierepository en `scripts/docs-i18n` uitvoeren in `openclaw/docs`.
- Voeg vóór het opnieuw uitvoeren van `scripts/docs-i18n` woordenlijstvermeldingen toe voor nieuwe technische termen, paginatitels of korte navigatielabels die in het Engels moeten blijven of een vaste vertaling moeten gebruiken.
- `pnpm docs:check-i18n-glossary` bewaakt gewijzigde Engelse documentatietitels en korte interne documentatielabels.
- Het vertaalgeheugen staat in gegenereerde bestanden `docs/.i18n/*.tm.jsonl` in de publicatierepository.
- Zie `docs/.i18n/README.md`.
