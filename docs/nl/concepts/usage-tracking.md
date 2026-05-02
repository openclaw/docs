---
read_when:
    - Je sluit providergebruiks- en quota-oppervlakken aan
    - Je moet het gedrag van gebruikstracking of de auth-vereisten uitleggen
summary: Oppervlakken voor gebruiksregistratie en vereisten voor inloggegevens
title: Gebruiksregistratie
x-i18n:
    generated_at: "2026-05-02T11:15:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Wat het is

- Haalt providergebruik/quota rechtstreeks op uit hun gebruikseindpunten.
- Geen geschatte kosten; alleen de door de provider gerapporteerde vensters.
- Voor mensen leesbare statusuitvoer wordt genormaliseerd naar `X% left`, zelfs wanneer een
  upstream-API verbruikt quota, resterend quota of alleen ruwe aantallen rapporteert.
- `/status` en `session_status` op sessieniveau kunnen terugvallen op de nieuwste
  gebruiksvermelding in het transcript wanneer de live sessiesnapshot onvolledig is. Die
  terugval vult ontbrekende token-/cachetellers aan, kan het actieve runtime-
  modellabel herstellen en geeft de voorkeur aan het grotere promptgerichte totaal wanneer sessie-
  metadata ontbreekt of kleiner is. Bestaande niet-nul live waarden blijven winnen.

## Waar het verschijnt

- `/status` in chats: emoji-rijke statuskaart met sessietokens + geschatte kosten (alleen API-sleutel). Providergebruik wordt voor de **huidige modelprovider** getoond wanneer beschikbaar als een genormaliseerd `X% left`-venster.
- `/usage off|tokens|full` in chats: gebruiksvoettekst per antwoord (OAuth toont alleen tokens).
- `/usage cost` in chats: lokale kostensamenvatting geaggregeerd uit OpenClaw-sessielogboeken.
- CLI: `openclaw status --usage` drukt een volledig overzicht per provider af.
- CLI: `openclaw channels list` drukt dezelfde gebruikssnapshot af naast de providerconfiguratie (gebruik `--no-usage` om over te slaan).
- macOS-menubalk: sectie “Gebruik” onder Context (alleen indien beschikbaar).

## Providers + referenties

- **Anthropic (Claude)**: OAuth-tokens in auth-profielen.
- **GitHub Copilot**: OAuth-tokens in auth-profielen.
- **Gemini CLI**: OAuth-tokens in auth-profielen.
  - JSON-gebruik valt terug op `stats`; `stats.cached` wordt genormaliseerd naar
    `cacheRead`.
- **OpenAI Codex**: OAuth-tokens in auth-profielen (`accountId` wordt gebruikt wanneer aanwezig).
- **MiniMax**: API-sleutel of MiniMax OAuth-auth-profiel. OpenClaw behandelt
  `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quota-
  oppervlak, geeft de voorkeur aan opgeslagen MiniMax OAuth wanneer aanwezig en valt anders terug
  op `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` of `MINIMAX_API_KEY`.
  Gebruikspolling leidt de Coding Plan-host af van `models.providers.minimax-portal.baseUrl`
  of `models.providers.minimax.baseUrl` wanneer geconfigureerd, en gebruikt anders de
  MiniMax CN-host.
  De ruwe velden `usage_percent` / `usagePercent` van MiniMax betekenen **resterend**
  quota, dus OpenClaw keert ze om vóór weergave; op aantallen gebaseerde velden winnen wanneer
  aanwezig.
  - Vensterlabels voor coding plans komen uit de provideruren/-minutenvelden wanneer
    aanwezig, en vallen daarna terug op het bereik `start_time` / `end_time`.
  - Als het coding-plan-eindpunt `model_remains` retourneert, geeft OpenClaw de voorkeur aan de
    chatmodelvermelding, leidt het vensterlabel af uit tijdstempels wanneer expliciete
    velden `window_hours` / `window_minutes` ontbreken, en neemt de model-
    naam op in het planlabel.
- **Xiaomi MiMo**: API-sleutel via env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: API-sleutel via env/config/auth store.

Gebruik wordt verborgen wanneer er geen bruikbare providergebruik-auth kan worden opgelost. Providers
kunnen Plugin-specifieke gebruiks-auth-logica leveren; anders valt OpenClaw terug op
overeenkomende OAuth-/API-sleutelreferenties uit auth-profielen, omgevingsvariabelen
of configuratie.

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
