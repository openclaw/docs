---
read_when:
    - Je sluit oppervlakken voor providergebruik/quota aan
    - Je moet het gedrag van gebruiksregistratie of authenticatievereisten uitleggen
summary: Gebruiksregistratie-oppervlakken en vereisten voor referenties
title: Gebruik bijhouden
x-i18n:
    generated_at: "2026-06-27T17:30:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Wat het is

- Haalt providergebruik/quota rechtstreeks op uit hun gebruikseindpunten.
- Geen geschatte kosten; alleen door de provider gerapporteerde quotavensters of
  samenvattingen van accountstatus.
- Menselijk leesbare statusuitvoer voor quotavensters wordt genormaliseerd naar `X% left`, zelfs
  wanneer een upstream-API verbruikt quotum, resterend quotum of alleen ruwe
  aantallen rapporteert. Providers zonder resetbare quotavensters kunnen in plaats daarvan
  providersamenvattingstekst tonen, zoals een saldo.
- `/status` en `session_status` op sessieniveau kunnen terugvallen op de nieuwste
  gebruiksvermelding in het transcript wanneer de live sessiesnapshot beperkt is. Die
  terugval vult ontbrekende token-/cachetellers aan, kan het label van het actieve runtime-
  model herstellen, en geeft de voorkeur aan het grotere promptgerichte totaal wanneer
  sessiemetadata ontbreken of kleiner zijn. Bestaande niet-nul live waarden blijven voorgaan.

## Waar het verschijnt

- `/status` in chats: emoji-rijke statuskaart met sessietokens + geschatte kosten (alleen API-sleutel). Providergebruik wordt voor de **huidige modelprovider** getoond wanneer beschikbaar als een genormaliseerd `X% left`-venster of providersamenvattingstekst.
- `/usage off|tokens|full` in chats: gebruiksvoettekst per antwoord (OAuth toont alleen tokens).
- `/usage cost` in chats: lokale kostensamenvatting geaggregeerd uit OpenClaw-sessielogs.
- CLI: `openclaw status --usage` drukt een volledige uitsplitsing per provider af.
- CLI: `openclaw channels list` drukt dezelfde gebruikssnapshot af naast de providerconfiguratie (gebruik `--no-usage` om over te slaan).
- macOS-menubalk: sectie "Gebruik" onder Context (alleen indien beschikbaar).

## Standaardmodus voor gebruiksvoettekst

`/usage off|tokens|full` stelt de voettekst voor een sessie in en wordt voor die
sessie onthouden. `messages.responseUsage` vult die modus vooraf in voor sessies die
er nog geen hebben gekozen, zodat de voettekst standaard aan kan staan zonder elke keer
`/usage` te typen.

Stel één modus in voor elk kanaal, of een kaart per kanaal met een `default`-terugval:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Drie verschillende sessiestatussen

Het veld `responseUsage` van een sessie heeft drie representeerbare statussen, elk met
andere semantiek:

| Status              | Opgeslagen waarde                 | Effectieve modus                                                       |
| ------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| **Niet ingesteld / erven** | `undefined` (afwezig)       | Valt door naar de configuratiestandaard `messages.responseUsage`, daarna `off`. |
| **Expliciet uit**   | `"off"` (opgeslagen)              | Altijd uit — een niet-uit configuratiestandaard kan de voettekst niet opnieuw inschakelen. |
| **Expliciet aan**   | `"tokens"` of `"full"` (opgeslagen) | Die modus, ongeacht de configuratiestandaard.                         |

### Prioriteit

Effectieve modus = sessie-override → kanaalconfiguratievermelding → `default` → `off`.

Een expliciete `/usage off` wordt **blijvend opgeslagen** als de letterlijke waarde `"off"` in de
sessie, niet hetzelfde als "niet ingesteld." Dit betekent dat een niet-uit `messages.responseUsage`-
standaard de voettekst niet opnieuw kan inschakelen zodra de gebruiker deze expliciet heeft uitgeschakeld.

### Resetten versus uitschakelen

- `/usage off` — dwingt de voettekst uit en slaat die keuze blijvend op. Een geconfigureerde
  niet-uit standaard kan dit niet overschrijven.
- `/usage reset` (aliassen: `inherit`, `clear`, `default`) — wist de sessie-
  override. De sessie **erft** daarna de effectieve configuratiestandaard
  (`messages.responseUsage`). Als er geen standaard is geconfigureerd, is de voettekst uit
  (ongewijzigd ten opzichte van eerder). Gebruik dit om "terug te gaan naar standaard" zonder de
  voettekst expliciet in te schakelen.
- Een volledige sessiereset (`/reset` of `/new`) of een sessierollover **behoudt**
  de expliciete voorkeur voor de gebruiksmodus, zodat de weergavekeuze van de gebruiker
  sessierollovers overleeft. Alleen `/usage reset` (en de aliassen daarvan) wist de
  override daadwerkelijk.

### Schakelgedrag

`/usage` zonder argumenten doorloopt: off → tokens → full → off. Het startpunt
voor de cyclus is de **effectieve** huidige modus (sessie-override die doorvalt naar
de configuratiestandaard wanneer niet ingesteld), zodat de cyclus altijd overeenkomt met wat
de gebruiker in de voettekst ziet.

### Configuratie

Zonder configuratie blijft het eerdere gedrag gelden (voettekst uit tot `/usage`). Gebruik
`/usage reset` om een sessie-override te wissen en opnieuw de geconfigureerde standaard te erven.

## Aangepaste `/usage full`-voettekst

`/usage full` toont een ingebouwde compacte voettekst met model, redenering, snel/traag,
contextvenster, beurtokens, cache en kosten wanneer die velden beschikbaar zijn. Er is geen
sjabloonbestand vereist.

`messages.usageTemplate` is alleen bedoeld voor geavanceerde aangepaste lay-outs. De waarde is een
JSON-bestandspad (ondersteunt `~`) of een inline object, en vervangt de ingebouwde
voettekst wanneer geldig:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Ontbrekende of lege sjablonen vallen stil terug op de ingebouwde voettekst. Onleesbare
of ongeldige geconfigureerde sjablonen vallen ook terug op de ingebouwde voettekst en geven een
operatorwaarschuwing.

Begin aangepaste sjablonen vanuit de ingebouwde vorm en bewerk daarna de onderdelen die je wilt
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
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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

Elk oppervlak is een geordende lijst van **stukken**; de engine rendert elk stuk, laat
lege stukken vallen en voegt overblijvers samen met `sep`. Een oppervlak zonder vermelding gebruikt
`output.default`.

### Contractpaden

Een stuk leest waarden uit het contract per beurt via een puntpad. Afwezige waarden zijn
leeg (zodat een `when`-guard of een `|fallback` het stuk schoon houdt).

| Pad                                                                                 | Betekenis                              |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | kanaal-id (`discord`/`telegram`/enz.)  |
| `model.provider` / `model.display_name`                                             | provider-id / model-id                 |
| `model.reasoning`                                                                   | inspanning (`off` tot en met `xhigh`)  |
| `model.is_fallback` / `model.is_override`                                           | bool: terugval gebruikt / model vastgezet |
| `state.fast_mode`                                                                   | bool: snel versus traag                |
| `context.max_tokens` / `context.pct_used`                                           | vensterbudget / 0-100 gebruikt         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | beurtaggregaat                         |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | tokenweergaveguards en cachepercentage |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | alleen laatste modelaanroep            |
| `cost.turn_usd`                                                                     | geschatte beurtkosten                  |
| `identity.name` / `identity.emoji`                                                  | agentnaam / gekozen emoji              |

(Provider-rate-limitvensters staan **niet** in dit contract.)

### Werkwoorden

Leid een waarde van links naar rechts door werkwoorden; een niet-werkwoordsegment is de terugval.

| Werkwoord       | Effect                                | Voorbeeld                         |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | compacte telling                      | `272000 -> 272k`                  |
| `fixed:N`       | N decimalen (standaard 2)             | `0.0377`                          |
| `dur`           | seconden naar duur                    | `14820 -> 4h07m`                  |
| `pct`           | voeg `%` toe                          | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | voor gebruikt naar resterend      |
| `alias:TABLE`   | opzoeken in `aliases`, echo indien niet vermeld | `medium -> 🌗`          |
| `meter:W:SCALE` | W-cellige glyphbalk over een 0-100-waarde | `[⣿⣿⠐⠐⠐]` (`meter:1` = één glyph) |

### Stukvormen

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

wordt bijvoorbeeld weergegeven als `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Providers + referenties

- **Anthropic (Claude)**: OAuth-tokens in auth-profielen.
- **GitHub Copilot**: OAuth-tokens in auth-profielen.
- **Gemini CLI**: OAuth-tokens in auth-profielen.
  - JSON-gebruik valt terug op `stats`; `stats.cached` wordt genormaliseerd naar
    `cacheRead`.
- **OpenAI Codex**: OAuth-tokens in auth-profielen (`accountId` wordt gebruikt indien aanwezig).
- **MiniMax**: API-sleutel of MiniMax OAuth-auth-profiel. OpenClaw behandelt
  `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quotumoppervlak,
  geeft de voorkeur aan opgeslagen MiniMax OAuth wanneer aanwezig, en valt anders terug
  op `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` of `MINIMAX_API_KEY`.
  Gebruikspeiling leidt de Coding Plan-host af van `models.providers.minimax-portal.baseUrl`
  of `models.providers.minimax.baseUrl` wanneer geconfigureerd, en gebruikt anders de
  MiniMax CN-host.
  De ruwe velden `usage_percent` / `usagePercent` van MiniMax betekenen **resterend**
  quotum, dus OpenClaw keert ze om vóór weergave; op aantallen gebaseerde velden hebben voorrang wanneer
  aanwezig.
  - Vensterlabels voor coding plans komen uit de uren-/minutenvelden van de provider wanneer
    aanwezig, en vallen daarna terug op de periode `start_time` / `end_time`.
  - Als het coding-plan-eindpunt `model_remains` retourneert, geeft OpenClaw de voorkeur aan de
    chatmodelvermelding, leidt het vensterlabel af uit tijdstempels wanneer expliciete
    velden `window_hours` / `window_minutes` ontbreken, en neemt het de modelnaam
    op in het planlabel.
- **Xiaomi MiMo**: API-sleutel via env/config/auth-opslag (`XIAOMI_API_KEY`).
- **z.ai**: API-sleutel via env/config/auth-opslag.
- **DeepSeek**: API-sleutel via env/config/auth-opslag (`DEEPSEEK_API_KEY`).
  OpenClaw roept het saldopunt van DeepSeek aan en toont het door de provider gerapporteerde
  saldo als tekst in plaats van een quotavenster met resterend percentage.

Gebruik wordt verborgen wanneer er geen bruikbare auth voor providergebruik kan worden opgelost. Providers
kunnen Pluginspecifieke auth-logica voor gebruik leveren; anders valt OpenClaw terug op
overeenkomende OAuth-/API-sleutelreferenties uit auth-profielen, omgevingsvariabelen
of config.

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
