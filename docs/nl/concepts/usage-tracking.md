---
read_when:
    - Je sluit interfaces voor providergebruik/quota aan
    - Je moet het gedrag van gebruiksregistratie of authenticatievereisten uitleggen
summary: Interfaces voor gebruikstracking en vereisten voor referenties
title: Gebruiksregistratie
x-i18n:
    generated_at: "2026-04-29T22:41:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Wat het is

- Haalt providergebruik/quotum rechtstreeks op uit hun gebruikseindpunten.
- Geen geschatte kosten; alleen de door de provider gerapporteerde vensters.
- Menselijk leesbare statusuitvoer wordt genormaliseerd naar `X% left`, zelfs wanneer een
  upstream-API verbruikt quotum, resterend quotum of alleen ruwe aantallen rapporteert.
- `/status` en `session_status` op sessieniveau kunnen terugvallen op de nieuwste
  transcriptgebruikspost wanneer de live sessiemomentopname beperkt is. Die
  fallback vult ontbrekende token-/cachetellers aan, kan het actieve runtime-
  modellabel herstellen, en geeft de voorkeur aan het grotere promptgerichte totaal wanneer sessie-
  metadata ontbreekt of kleiner is. Bestaande niet-nul live waarden blijven winnen.

## Waar het verschijnt

- `/status` in chats: emoji-rijke statuskaart met sessietokens + geschatte kosten (alleen API-sleutel). Providergebruik wordt voor de **huidige modelprovider** getoond wanneer beschikbaar als een genormaliseerd `X% left`-venster.
- `/usage off|tokens|full` in chats: gebruiksvoettekst per antwoord (OAuth toont alleen tokens).
- `/usage cost` in chats: lokale kostensamenvatting geaggregeerd uit OpenClaw-sessielogs.
- CLI: `openclaw status --usage` drukt een volledige uitsplitsing per provider af.
- CLI: `openclaw channels list` drukt dezelfde gebruiksmomentopname af naast providerconfiguratie (gebruik `--no-usage` om over te slaan).
- macOS-menubalk: sectie “Gebruik” onder Context (alleen indien beschikbaar).

## Providers + inloggegevens

- **Anthropic (Claude)**: OAuth-tokens in auth-profielen.
- **GitHub Copilot**: OAuth-tokens in auth-profielen.
- **Gemini CLI**: OAuth-tokens in auth-profielen.
  - JSON-gebruik valt terug op `stats`; `stats.cached` wordt genormaliseerd naar
    `cacheRead`.
- **OpenAI Codex**: OAuth-tokens in auth-profielen (accountId wordt gebruikt wanneer aanwezig).
- **MiniMax**: API-sleutel of MiniMax OAuth-auth-profiel. OpenClaw behandelt
  `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quotum-
  oppervlak, geeft de voorkeur aan opgeslagen MiniMax OAuth wanneer aanwezig, en valt anders terug
  op `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` of `MINIMAX_API_KEY`.
  De ruwe velden `usage_percent` / `usagePercent` van MiniMax betekenen **resterend**
  quotum, dus OpenClaw keert ze om vóór weergave; op aantallen gebaseerde velden winnen wanneer
  aanwezig.
  - Vensterlabels voor coding-plans komen uit provideruren-/minutenvelden wanneer
    aanwezig, en vallen daarna terug op de `start_time` / `end_time`-spanne.
  - Als het coding-plan-eindpunt `model_remains` retourneert, geeft OpenClaw de voorkeur aan de
    chatmodelvermelding, leidt het vensterlabel af uit tijdstempels wanneer expliciete
    velden `window_hours` / `window_minutes` ontbreken, en neemt de modelnaam
    op in het planlabel.
- **Xiaomi MiMo**: API-sleutel via env/config/auth-opslag (`XIAOMI_API_KEY`).
- **z.ai**: API-sleutel via env/config/auth-opslag.

Gebruik wordt verborgen wanneer geen bruikbare auth voor providergebruik kan worden herleid. Providers
kunnen Plugin-specifieke gebruiksauth-logica leveren; anders valt OpenClaw terug op
overeenkomende OAuth-/API-sleutelinloggegevens uit auth-profielen, omgevingsvariabelen
of configuratie.

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
