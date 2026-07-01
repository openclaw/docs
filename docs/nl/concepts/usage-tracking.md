---
read_when:
    - Je koppelt interfaces voor providergebruik en quota
    - Je moet het gedrag van gebruiksregistratie of authenticatievereisten uitleggen
summary: Gebruikstraceringsoppervlakken en referentievereisten
title: Gebruik bijhouden
x-i18n:
    generated_at: "2026-07-01T18:16:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Wat het is

- Haalt providergebruik/quota rechtstreeks op uit hun gebruikseindpunten.
- Geen geschatte kosten; alleen door de aanbieder gerapporteerde quotavensters of
  samenvattingen van accountstatus.
- Menselijk leesbare statusuitvoer voor quotavensters wordt genormaliseerd naar `X% over`, zelfs
  wanneer een upstream-API verbruikte quota, resterende quota of alleen ruwe
  aantallen rapporteert. Aanbieders zonder resetbare quotavensters kunnen in plaats daarvan
  samenvattende aanbiedertekst tonen, zoals een saldo.
- `/status` en `session_status` op sessieniveau kunnen terugvallen op de nieuwste
  transcript-gebruiksvermelding wanneer de live sessiesnapshot beperkt is. Die
  fallback vult ontbrekende token-/cachetellers aan, kan het actieve runtime-
  modellabel herstellen, en geeft de voorkeur aan het grotere promptgerichte totaal wanneer sessie-
  metadata ontbreekt of kleiner is. Bestaande niet-nul live waarden blijven leidend.

## Waar het verschijnt

- `/status` in chats: statuskaart met veel emoji's, met sessietokens + geschatte kosten (alleen API-sleutel). Providergebruik wordt voor de **huidige modelaanbieder** getoond wanneer beschikbaar als een genormaliseerd venster `X% over` of samenvattende aanbiedertekst.
- `/usage off|tokens|full` in chats: gebruiksvoettekst per antwoord.
- `/usage cost` in chats: lokale kostensamenvatting, geaggregeerd uit OpenClaw-sessielogs.
- CLI: `openclaw status --usage` print een volledige uitsplitsing per aanbieder.
- CLI: `openclaw channels list` print dezelfde gebruikssnapshot naast de aanbiederconfiguratie (gebruik `--no-usage` om over te slaan).
- macOS-menubalk: sectie "Gebruik" onder Context (alleen indien beschikbaar).

## Standaardmodus voor gebruiksvoettekst

`/usage off|tokens|full` stelt de voettekst voor een sessie in en wordt voor die
sessie onthouden. `messages.responseUsage` vult die modus vooraf in voor sessies die nog geen
keuze hebben gemaakt, zodat de voettekst standaard aan kan staan zonder elke keer
`/usage` te typen.

Stel één modus in voor elk kanaal, of een kaart per kanaal met een `default`-fallback:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Drie onderscheidende sessiestatussen

Het veld `responseUsage` van een sessie heeft drie representeerbare statussen, elk met
andere semantiek:

| Status                    | Opgeslagen waarde              | Effectieve modus                                                       |
| ------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| **Niet ingesteld / erven** | `undefined` (afwezig)          | Valt door naar de configuratiestandaard `messages.responseUsage`, daarna `off`. |
| **Expliciet uit**          | `"off"` (opgeslagen)           | Altijd uit — een niet-uit configuratiestandaard kan de voettekst niet opnieuw inschakelen. |
| **Expliciet aan**          | `"tokens"` of `"full"` (opgeslagen) | Die modus, ongeacht de configuratiestandaard.                           |

### Prioriteit

Effectieve modus = sessie-override → kanaalconfiguratie-item → `default` → `off`.

Een expliciete `/usage off` wordt **blijvend opgeslagen** als de letterlijke waarde `"off"` in de
sessie, niet hetzelfde als "niet ingesteld". Dit betekent dat een niet-uit
standaard voor `messages.responseUsage` de voettekst niet weer kan inschakelen nadat de gebruiker die expliciet heeft uitgeschakeld.

### Resetten versus uitschakelen

- `/usage off` — forceert de voettekst uit en slaat die keuze blijvend op. Een geconfigureerde
  niet-uit standaard kan dit niet overschrijven.
- `/usage reset` (aliassen: `inherit`, `clear`, `default`) — wist de sessie-
  override. De sessie **erft** daarna de effectieve configuratiestandaard
  (`messages.responseUsage`). Als er geen standaard is geconfigureerd, staat de voettekst uit
  (ongewijzigd ten opzichte van eerder). Gebruik dit om "terug te gaan naar standaard" zonder de voettekst expliciet
  in te schakelen.
- Een volledige sessiereset (`/reset` of `/new`) of een sessierollover **behoudt**
  de expliciete voorkeur voor de gebruiksmodus, zodat de weergavekeuze van de gebruiker
  sessierollovers overleeft. Alleen `/usage reset` (en de aliassen ervan) wist daadwerkelijk de
  override.

### Toggle-gedrag

`/usage` zonder argumenten doorloopt: uit → tokens → volledig → uit. Het startpunt
voor de cyclus is de **effectieve** huidige modus (sessie-override die doorvalt
naar de configuratiestandaard wanneer niet ingesteld), dus de cyclus is altijd consistent met wat
de gebruiker in de voettekst ziet.

### Configuratie

Zonder configuratie blijft het eerdere gedrag gelden (voettekst uit tot `/usage`). Gebruik
`/usage reset` om een sessie-override te wissen en de geconfigureerde standaard opnieuw te erven.

## Aangepaste voettekst voor `/usage full`

`/usage full` toont een ingebouwde compacte voettekst met model, redenering, snel/langzaam,
contextvenster en kosten wanneer die velden beschikbaar zijn. Token- en cachevelden
blijven beschikbaar voor aangepaste templates. Er is geen templatebestand vereist.

`messages.usageTemplate` is alleen voor geavanceerde aangepaste indelingen. De waarde is een
JSON-bestandspad (ondersteunt `~`) of een inline object, en vervangt de ingebouwde
voettekst wanneer geldig:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Ontbrekende of lege templates vallen stil terug op de ingebouwde voettekst. Onleesbare
of ongeldige geconfigureerde templates vallen ook terug op de ingebouwde voettekst en geven een
operatorwaarschuwing.

Begin aangepaste templates vanuit de ingebouwde vorm en bewerk daarna de onderdelen die je wilt
wijzigen:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Vorm

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Elk oppervlak is een geordende lijst van **onderdelen**; de engine rendert elk onderdeel, verwijdert
lege onderdelen en voegt overblijvende onderdelen samen met `sep`. Een oppervlak zonder item gebruikt
`output.default`.

### Contractpaden

Een onderdeel leest waarden uit het per-beurt-contract via een puntpad. Afwezige waarden zijn
leeg (dus een `when`-guard of een `|fallback` houdt het onderdeel schoon).

| Pad                                                                                 | Betekenis                              |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | kanaal-id (`discord`/`telegram`/enz.)  |
| `model.provider` / `model.display_name`                                             | aanbieder-id / model-id                |
| `model.reasoning`                                                                   | inspanning (`off` tot en met `xhigh`)  |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback gebruikt / model vastgezet |
| `state.fast_mode`                                                                   | bool: snel versus langzaam             |
| `context.max_tokens` / `context.pct_used`                                           | vensterbudget / 0-100 gebruikt         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | aggregaat per beurt                    |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guards voor tokenweergave en cachepercentage |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | alleen laatste modelaanroep            |
| `cost.turn_usd`                                                                     | geschatte beurtkosten                  |
| `identity.name` / `identity.emoji`                                                  | agentnaam / gekozen emoji              |

(Limietvensters voor providertarieven staan **niet** in dit contract.)

### Bewerkingen

Leid een waarde van links naar rechts door bewerkingen; een segment dat geen bewerking is, is de fallback.

| Bewerking       | Effect                                | Voorbeeld                         |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | compact aantal                        | `272000 -> 272k`                  |
| `fixed:N`       | N decimalen (standaard 2)             | `0.0377`                          |
| `dur`           | seconden naar duur                    | `14820 -> 4h07m`                  |
| `pct`           | voeg `%` toe                          | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | van gebruikt naar resterend       |
| `alias:TABLE`   | zoek op in `aliases`, echo als niet vermeld | `medium -> 🌗`                    |
| `meter:W:SCALE` | W-cellige glyphbalk over een 0-100-waarde | `[⣿⣿⠐⠐⠐]` (`meter:1` = één glyph) |

### Onderdeelvormen

- `{ "text": "📚 {context.max_tokens|num}" }`: letterlijk + interpolatie.
- `{ "when": "<path>", "text": "..." }`: render alleen als het pad truthy is.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: waarde naar glyph.
- `{ "each": "limits.windows", "item": "{label}" }`: itereer over een array.

### Voorbeeld

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

rendert bijvoorbeeld `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Aanbieders + inloggegevens

- **Anthropic (Claude)**: OAuth-tokens in auth-profielen.
- **GitHub Copilot**: OAuth-tokens in auth-profielen.
- **Gemini CLI**: OAuth-tokens in auth-profielen.
  - JSON-gebruik valt terug op `stats`; `stats.cached` wordt genormaliseerd naar
    `cacheRead`.
- **OpenAI Codex**: OAuth-tokens in auth-profielen (`accountId` wordt gebruikt wanneer aanwezig).
- **MiniMax**: API-sleutel of MiniMax OAuth-auth-profiel. OpenClaw behandelt
  `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quotumoppervlak,
  geeft de voorkeur aan opgeslagen MiniMax OAuth wanneer aanwezig en valt anders terug
  op `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` of `MINIMAX_API_KEY`.
  Gebruikspolling leidt de Coding Plan-host af uit `models.providers.minimax-portal.baseUrl`
  of `models.providers.minimax.baseUrl` wanneer geconfigureerd, en gebruikt anders de
  MiniMax CN-host.
  De ruwe MiniMax-velden `usage_percent` / `usagePercent` betekenen **resterend**
  quotum, dus OpenClaw keert ze om vóór weergave; op aantallen gebaseerde velden krijgen voorrang wanneer
  aanwezig.
  - Vensterlabels voor coding-plan komen uit de uren-/minutenvelden van de provider wanneer
    aanwezig, en vallen daarna terug op het bereik `start_time` / `end_time`.
  - Als het coding-plan-eindpunt `model_remains` retourneert, geeft OpenClaw de voorkeur aan de
    chatmodel-vermelding, leidt het vensterlabel af uit tijdstempels wanneer expliciete
    velden `window_hours` / `window_minutes` ontbreken, en neemt de modelnaam op
    in het planlabel.
- **Xiaomi MiMo**: API-sleutel via env/config/auth-store (`XIAOMI_API_KEY`).
- **z.ai**: API-sleutel via env/config/auth-store.
- **DeepSeek**: API-sleutel via env/config/auth-store (`DEEPSEEK_API_KEY`).
  OpenClaw roept het saldo-eindpunt van DeepSeek aan en toont het door de provider gerapporteerde
  saldo als tekst in plaats van een quotumvenster met resterend percentage.

Gebruik wordt verborgen wanneer er geen bruikbare providergebruiks-auth kan worden opgelost. Providers
kunnen plugin-specifieke gebruiks-auth-logica leveren; anders valt OpenClaw terug op
overeenkomende OAuth-/API-sleutelreferenties uit auth-profielen, omgevingsvariabelen
of configuratie.

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
