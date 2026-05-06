---
read_when:
    - Je sluit interfaces voor aanbiedergebruik en quota aan
    - Je moet gedrag rond gebruiksregistratie of authenticatievereisten uitleggen
summary: Oppervlakken voor gebruiksregistratie en vereisten voor inloggegevens
title: Gebruiksregistratie
x-i18n:
    generated_at: "2026-05-06T09:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Wat het is

- Haalt providergebruik/quota rechtstreeks op uit hun usage-endpoints.
- Geen geschatte kosten; alleen de door de provider gerapporteerde vensters.
- Voor mensen leesbare statusuitvoer wordt genormaliseerd naar `X% left`, zelfs wanneer een
  upstream-API verbruikt quota, resterend quota of alleen ruwe aantallen rapporteert.
- `/status` op sessieniveau en `session_status` kunnen terugvallen op de nieuwste
  transcriptgebruikvermelding wanneer de live sessie-snapshot beperkt is. Die
  fallback vult ontbrekende token-/cachetellers aan, kan het label van het actieve runtime
  model herstellen, en geeft de voorkeur aan het grotere prompt-georienteerde totaal wanneer
  sessiemetadata ontbreekt of kleiner is. Bestaande niet-nul live waarden blijven leidend.

## Waar het verschijnt

- `/status` in chats: statuskaart met veel emoji's met sessietokens + geschatte kosten (alleen API-sleutel). Providergebruik wordt getoond voor de **huidige modelprovider** wanneer beschikbaar als een genormaliseerd `X% left`-venster.
- `/usage off|tokens|full` in chats: gebruiksvoetregel per antwoord (OAuth toont alleen tokens).
- `/usage cost` in chats: lokale kostensamenvatting geaggregeerd uit OpenClaw-sessielogs.
- CLI: `openclaw status --usage` print een volledig overzicht per provider.
- CLI: `openclaw channels list` print dezelfde usage-snapshot naast providerconfiguratie (gebruik `--no-usage` om over te slaan).
- macOS-menubalk: sectie "Gebruik" onder Context (alleen indien beschikbaar).

## Providers + referenties

- **Anthropic (Claude)**: OAuth-tokens in auth-profielen.
- **GitHub Copilot**: OAuth-tokens in auth-profielen.
- **Gemini CLI**: OAuth-tokens in auth-profielen.
  - JSON-gebruik valt terug op `stats`; `stats.cached` wordt genormaliseerd naar
    `cacheRead`.
- **OpenAI Codex**: OAuth-tokens in auth-profielen (`accountId` wordt gebruikt wanneer aanwezig).
- **MiniMax**: API-sleutel of MiniMax OAuth-auth-profiel. OpenClaw behandelt
  `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quotumoppervlak,
  geeft de voorkeur aan opgeslagen MiniMax OAuth wanneer aanwezig, en valt anders terug
  op `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` of `MINIMAX_API_KEY`.
  Gebruikspolling leidt de Coding Plan-host af uit `models.providers.minimax-portal.baseUrl`
  of `models.providers.minimax.baseUrl` wanneer geconfigureerd, en gebruikt anders de
  MiniMax CN-host.
  MiniMax' ruwe velden `usage_percent` / `usagePercent` betekenen **resterend**
  quota, dus OpenClaw keert ze om voor weergave; op telling gebaseerde velden krijgen voorrang wanneer
  aanwezig.
  - Coding-plan-vensterlabels komen uit provideruren-/minutenvelden wanneer
    aanwezig, en vallen daarna terug op het `start_time` / `end_time`-bereik.
  - Als het coding-plan-endpoint `model_remains` retourneert, geeft OpenClaw de voorkeur aan de
    chatmodelvermelding, leidt het vensterlabel af uit tijdstempels wanneer expliciete
    velden `window_hours` / `window_minutes` ontbreken, en neemt de modelnaam op
    in het planlabel.
- **Xiaomi MiMo**: API-sleutel via env/config/auth-store (`XIAOMI_API_KEY`).
- **z.ai**: API-sleutel via env/config/auth-store.

Gebruik wordt verborgen wanneer er geen bruikbare provider usage-auth kan worden opgelost. Providers
kunnen Plugin-specifieke gebruiksauthenticatielogica leveren; anders valt OpenClaw terug op
overeenkomende OAuth-/API-sleutelreferenties uit auth-profielen, omgevingsvariabelen
of config.

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
