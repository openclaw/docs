---
x-i18n:
    generated_at: "2026-06-27T17:08:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Documentatiegids

Deze map beheert het schrijven van documentatie, Mintlify-linkregels en het beleid voor documentatie-i18n.

## Mintlify-regels

- Documentatie wordt gehost op Mintlify (`https://docs.openclaw.ai`).
- Interne documentatielinks in `docs/**/*.md` moeten root-relatief blijven zonder `.md`- of `.mdx`-achtervoegsel (voorbeeld: `[Config](/gateway/configuration)`).
- Kruisverwijzingen naar secties moeten anchors gebruiken op root-relatieve paden (voorbeeld: `[Hooks](/gateway/configuration-reference#hooks)`).
- Documentatiekoppen moeten em-dashes en apostrofs vermijden, omdat Mintlify-anchor-generatie daar kwetsbaar voor is.
- README en andere door GitHub weergegeven documentatie moeten absolute documentatie-URL's behouden, zodat links buiten Mintlify werken.
- Documentatie-inhoud moet generiek blijven: geen persoonlijke apparaatnamen, hostnamen of lokale paden; gebruik placeholders zoals `user@gateway-host`.

## Regels voor documentatie-inhoud

- Voor documentatie, UI-tekst en keuzelijsten: orden services/providers alfabetisch, tenzij de sectie expliciet runtime-volgorde of auto-detectievolgorde beschrijft.
- Houd de naamgeving van gebundelde plugins consistent met de repo-brede regels voor Plugin-terminologie in de root-`AGENTS.md`.

## Interne documentatie

- Langlevende private operatordocumentatie hoort thuis in `~/Projects/manager/docs/`.
- Repo-lokale interne scratch-/spiegeldocumentatie mag onder genegeerde `docs/internal/` staan.
- Voeg nooit `docs/internal/**`-pagina's toe aan de navigatie in `docs/docs.json` en link er niet naar vanuit publieke documentatie.
- `scripts/docs-sync-publish.mjs` sluit `docs/internal/**` uit en verwijdert deze uit de publieke `openclaw/docs`-publicatierepo als een pagina later geforceerd wordt toegevoegd.
- Interne documentatie mag repo-paden, private app-namen, 1Password-itemnamen en runbooks vermelden, maar mag nooit geheime waarden bevatten.

## Maturity-scorecard bewerken

`taxonomy.yaml` en `qa/maturity-scores.yaml` zijn de broninvoer; gegenereerde maturity-documentatie onder `docs/maturity/` zijn projecties en mogen niet handmatig worden bewerkt voor score, LTS, taxonomie, QA-profiel of bewijstabellen.
`scripts/qa/render-maturity-docs.ts` beheert de generatie; gebruik `pnpm maturity:render` om gecommitte documentatie te vernieuwen en `pnpm maturity:check` om deze te verifiëren.
`.github/workflows/maturity-scorecard.yml` rendert artifact-previews en kan PR's voor gegenereerde documentatie openen; `.github/workflows/openclaw-release-checks.yml` dispatcht deze voor release-QA.
Bewaar deterministische `qa-evidence.json.scorecard`-gegevens in GitHub Actions-artifacts, tenzij een maintainer expliciet vraagt om een opgeschoonde gecommitte projectie.
Menselijke overrides moeten de bronstatus in een PR wijzigen en de reden plus publiek of geredigeerd bewijs uitleggen.

## Documentatie-i18n

- Documentatie in andere talen wordt niet in deze repo onderhouden. De gegenereerde publicatie-output staat in de aparte `openclaw/docs`-repo (vaak lokaal gekloond als `../openclaw-docs`).
- Voeg hier geen gelokaliseerde documentatie toe onder `docs/<locale>/**` en bewerk die niet.
- Behandel Engelse documentatie in deze repo plus woordenlijstbestanden als de bron van waarheid.
- Pipeline: werk Engelse documentatie hier bij, werk `docs/.i18n/glossary.<locale>.json` bij waar nodig, en laat daarna de publicatierepo-sync en `scripts/docs-i18n` draaien in `openclaw/docs`.
- Voeg vóór het opnieuw uitvoeren van `scripts/docs-i18n` woordenlijstvermeldingen toe voor nieuwe technische termen, paginatitels of korte navigatielabels die in het Engels moeten blijven of een vaste vertaling moeten gebruiken.
- `pnpm docs:check-i18n-glossary` is de controle voor gewijzigde Engelse documentatietitels en korte interne documentatielabels.
- Vertaalgeheugen staat in gegenereerde `docs/.i18n/*.tm.jsonl`-bestanden in de publicatierepo.
- Zie `docs/.i18n/README.md`.
