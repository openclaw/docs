---
read_when:
    - Je koppelt gebruiks- en quotuminterfaces van providers aan elkaar
    - Je moet het gedrag van gebruiksregistratie of de authenticatievereisten uitleggen
summary: Oppervlakken voor gebruiksregistratie en vereisten voor inloggegevens
title: Gebruiksregistratie
x-i18n:
    generated_at: "2026-07-12T08:48:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Wat het is

- Haalt gebruik/quota van providers rechtstreeks op via het gebruikseindpunt van elke provider. Geen geschatte providerfacturering; alleen door de provider gerapporteerde abonnementsnamen, quotavensters, saldi, uitgaven, budgetten, dagelijkse kostengeschiedenis, toewijzing aan tokens/modellen of samenvattingen van de accountstatus.
- Leesbare uitvoer van quotavensters wordt genormaliseerd naar `X% over`, zelfs wanneer een provider verbruikt quota, resterend quota of alleen ruwe aantallen rapporteert. Providers zonder quotavensters die kunnen worden gereset, tonen in plaats daarvan een samenvattingstekst van de provider (bijvoorbeeld een saldo).
- `/status` op sessieniveau en de tool `session_status` vallen terug op het transcriptlogboek van de sessie wanneer de momentopname van de actieve sessie geen token-/modelgegevens bevat. Die terugval vult ontbrekende token-/cachetellers aan, kan het actieve runtimemodellabel herstellen en geeft de voorkeur aan het hogere promptgerichte totaal wanneer sessiemetadata ontbreekt of lager is (`totalTokensFresh !== true`, nul of lager dan de uit het transcript afgeleide waarde). Livewaarden die niet nul zijn, hebben altijd voorrang op de terugval.

## Waar het verschijnt

- `/status` in chats: statuskaart met sessietokens en geschatte kosten (alleen modellen met API-sleutel). Providergebruik wordt indien beschikbaar weergegeven voor de **provider van het huidige model**, als een genormaliseerd venster met `X% over` of als samenvattingstekst van de provider.
- `/usage off|tokens|full` in chats: gebruiksvoettekst per antwoord.
- `/usage cost` in chats: lokale kostensamenvatting, geaggregeerd uit OpenClaw-sessielogboeken.
- CLI: `openclaw status --usage` toont een volledig overzicht van gebruik/quota per provider.
- CLI: `openclaw models status` vermeldt OAuth-/tokenauthenticatieprofielen en toont naast elke provider die er een heeft een samenvatting van het gebruiksvenster.
- Control UI: **Gebruik** toont kaarten voor providerabonnementen en -facturering boven de uit OpenClaw-sessies afgeleide analyse van tokens en geschatte kosten. Referenties voor de Anthropic- en OpenAI Admin API voegen door de provider gerapporteerde uitgaven van vandaag, 7 dagen en 30 dagen, dagelijkse trends, tokentotalen, topmodellen en kostencategorieën toe.
- Control UI: de pop-over van de contextring van de chatopsteller toont **abonnementsgebruik** voor abonnementsproviders — balken per venster (5 uur, wekelijks, modelspecifiek) met resettijden, het providerabonnement indien bekend (bijvoorbeeld `Max (20x)`) en tegoeden voor extra gebruik. Sessies die via een abonnement worden gefactureerd, verbergen dollarschattingen per token; via de API gefactureerde sessies behouden `Geschatte kosten` en de uitsplitsing van kosten per type. Configuraties van de Claude Code CLI (`claude-cli`) hergebruiken hetzelfde Anthropic-abonnementsgebruik.
- macOS-menubalk: er verschijnt een hoofdsectie 'Gebruik' onder Context wanneer momentopnamen van providergebruik beschikbaar zijn. Zie [Menubalk](/nl/platforms/mac/menu-bar).

`openclaw channels list` toont geen providergebruik meer; in plaats daarvan worden gebruikers verwezen naar `openclaw status` of `openclaw models list`.

## Kostengeschiedenis van Anthropic en OpenAI

Abonnementsquota en API-facturering zijn verschillende provideroppervlakken:

- Referenties voor Anthropic-abonnementen/configuraties blijven Claude-quotavensters en optionele budgetten voor extra gebruik tonen. Stel `ANTHROPIC_ADMIN_KEY` of `ANTHROPIC_ADMIN_API_KEY` in om in plaats daarvan de organisatiegeschiedenis uit de Usage en Cost API te tonen. Een Anthropic-providerreferentie die begint met `sk-ant-admin` wordt automatisch gedetecteerd.
- OpenAI ChatGPT/Codex OAuth blijft het abonnement, quotavensters en tegoedsaldo tonen. Stel `OPENAI_ADMIN_KEY` in om in plaats daarvan de organisatiegeschiedenis voor kosten en voltooiingsgebruik te tonen; stel eventueel `OPENAI_PROJECT_ID` in om deze tot één project te beperken. OpenClaw verzendt nooit inferentiereferenties uit `OPENAI_API_KEY`, de providerconfiguratie of authenticatieprofielen naar organisatie-API's, omdat die sleutels bij aangepaste eindpunten kunnen horen.

Beheerdersreferenties hebben voorrang, omdat ze de werkelijke organisatiefacturering leveren. OpenClaw combineert deze door providers gerapporteerde totalen niet met zijn lokale sessieschattingen; de twee secties beantwoorden bewust verschillende vragen.

## Standaardmodus voor de gebruiksvoettekst

`/usage off|tokens|full` stelt de voettekst voor een sessie in en wordt voor die
sessie onthouden. `messages.responseUsage` initialiseert die modus voor sessies die
er nog geen hebben gekozen, zodat de voettekst standaard ingeschakeld kan zijn zonder telkens
`/usage` te typen.

Stel één modus in voor elk kanaal, of een toewijzing per kanaal met een `default`-terugval:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // of: { "default": "off", "discord": "full" }
  },
}
```

Geaccepteerde waarden: `"off"`, `"tokens"`, `"full"` en de verouderde alias `"on"` (behandeld als `"tokens"`).

### Drie afzonderlijke sessiestatussen

Het veld `responseUsage` van een sessie heeft drie weergeefbare statussen, elk met
een andere semantiek:

| Status                       | Opgeslagen waarde                  | Effectieve modus                                                              |
| ---------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| **Niet ingesteld / overerven** | `undefined` (afwezig)            | Valt terug op de configuratiestandaard `messages.responseUsage`, daarna `off`. |
| **Expliciet uit**            | `"off"` (opgeslagen)               | Altijd uit; een configuratiestandaard die niet `off` is, kan de voettekst niet opnieuw inschakelen. |
| **Expliciet aan**            | `"tokens"` of `"full"` (opgeslagen) | Die modus, ongeacht de configuratiestandaard.                                 |

### Voorrangsvolgorde

Effectieve modus = sessie-overschrijving → kanaalconfiguratie-item → `default` → `off`.

Een expliciete `/usage off` wordt **opgeslagen** als de letterlijke waarde `"off"` in de
sessie en is niet hetzelfde als 'niet ingesteld'. Een standaardwaarde voor `messages.responseUsage`
die niet `off` is, kan de voettekst niet opnieuw inschakelen nadat de gebruiker deze expliciet heeft uitgeschakeld.

### Resetten versus uitschakelen

- `/usage off` schakelt de voettekst gedwongen uit en slaat die keuze op. Een geconfigureerde
  standaardwaarde die niet `off` is, kan dit niet overschrijven.
- `/usage reset` (aliassen: `default`, `inherit`, `inherited`, `clear`, `unpin`) wist de sessie-
  overschrijving. De sessie **erft** daarna de effectieve configuratiestandaard
  (`messages.responseUsage`). Als geen standaardwaarde is geconfigureerd, blijft de voettekst uit.
- Een volledige sessiereset (`/reset` of `/new`) of een sessieovergang **behoudt**
  de expliciete voorkeur voor de gebruiksmodus, zodat de weergavekeuze van de gebruiker
  sessieovergangen overleeft. Alleen `/usage reset` (en de aliassen daarvan) wist de overschrijving.

### Schakelgedrag

`/usage` zonder argumenten doorloopt: uit → tokens → volledig → uit. Het beginpunt
van de cyclus is de **effectieve** huidige modus (waarbij de sessie-overschrijving bij
afwezigheid terugvalt op de configuratiestandaard), zodat de cyclus altijd overeenkomt met wat
de gebruiker momenteel in de voettekst ziet.

### Configuratie

Zonder configuratie blijft het eerdere gedrag gelden (voettekst uit tot `/usage`). Gebruik
`/usage reset` om een sessie-overschrijving te wissen en de geconfigureerde standaardwaarde opnieuw te erven.

## Aangepaste voettekst voor `/usage full`

`/usage tokens` toont altijd een eenvoudige regel `Gebruik: X in / Y uit` (plus achtervoegsels voor cache en
geschatte kosten indien beschikbaar). Alleen `/usage full` toont de uitgebreidere
voettekst die hieronder wordt beschreven.

`/usage full` toont een ingebouwde compacte voettekst met model, redenering, snel/langzaam,
contextvenster en kosten wanneer die velden beschikbaar zijn. Voor de ingebouwde voettekst is
geen sjabloonbestand vereist.

`messages.usageTemplate` is alleen bedoeld voor geavanceerde aangepaste indelingen. De waarde is een
pad naar een JSON-bestand (ondersteunt `~`) of een inline-object en vervangt de ingebouwde
voettekst wanneer deze geldig is. Een bestandspad wordt bewaakt en bij wijzigingen live opnieuw geladen.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Ontbrekende of lege sjablonen vallen geruisloos terug op de ingebouwde voettekst. Onleesbare
of ongeldige geconfigureerde sjablonen (ongeldige JSON of een structuur zonder weergeefbare
uitvoeronderdelen) vallen eveneens terug op de ingebouwde voettekst en geven een waarschuwing aan de beheerder.

Begin aangepaste sjablonen met de ingebouwde structuur en bewerk vervolgens de onderdelen die u wilt
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
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Structuur

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "glyphs van laag naar hoog" }, // tekenreeks (1 glyph/teken) of array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // voegt overgebleven onderdelen samen
    "default": [/* onderdelen */], // terugval voor elk oppervlak
    "surfaces": {
      "discord": [/* onderdelen */],
      "telegram": [/* onderdelen */],
    },
  },
}
```

Elk oppervlak is een geordende lijst van **onderdelen**; de engine geeft elk onderdeel weer, verwijdert
lege onderdelen en voegt de overgebleven onderdelen samen met `sep`. Een oppervlak zonder item gebruikt
`output.default`.

### Contractpaden

Een onderdeel leest waarden uit het contract per beurt via een puntpad. Ontbrekende waarden zijn
leeg (zodat een `when`-voorwaarde of een `|fallback` het onderdeel schoon houdt).

| Pad                                                                                 | Betekenis                                                                                            |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | kanaal-id (`discord`/`telegram`/enz.)                                                                |
| `agentId` / `chat_type`                                                             | id van de beherende agent / type chatoppervlak                                                       |
| `model.id` / `model.display_name` / `model.provider`                                | model-id / weergavenaam / provider-id                                                               |
| `model.actual`, `model.resolved_ref`                                                | daadwerkelijk voor de beurt gebruikte provider-/modelreferentie                                      |
| `model.requested`                                                                   | aangevraagde provider-/modelreferentie (vóór terugval)                                               |
| `model.reasoning`                                                                   | inspanning (`off` tot en met `xhigh`)                                                                |
| `model.is_fallback` / `model.is_override`                                           | booleaans: terugval gebruikt / model vastgezet                                                       |
| `model.override_source` / `model.auth_mode`                                         | label van overschrijvingsbron / referentiemodus (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | booleaans: snel versus langzaam                                                                      |
| `state.compactions`                                                                 | aantal compacties voor de sessie                                                                     |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | vensterbudget / bezette tokens / 0-100 gebruikt                                                      |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | totaal voor de beurt                                                                                 |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | cachelees- en cacheschrijftokens voor de beurt                                                       |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | voorwaarden voor tokenweergave                                                                       |
| `usage.cache_hit_pct`                                                               | aandeel cachelezingen in het totale aantal prompttokens                                              |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | alleen de laatste modelaanroep (bevat ook `cache_read_tokens`, `cache_write_tokens`, `total_tokens`) |
| `cost.turn_usd` / `cost.available`                                                  | geschatte kosten van de beurt / of een kostentabel kon worden bepaald                               |
| `timing.duration_ms`                                                                | werkelijke duur van de beurt                                                                         |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | identiteitsnaam van de agent / emoji / avatar                                                        |
| `session.id`                                                                        | sessie-id                                                                                            |

(De vensters voor providerlimieten maken **geen** deel uit van dit contract; er is momenteel geen pad met een matrixwaarde, dus een `each`-onderdeel heeft niets om over te itereren.)

### Bewerkingen

Leid een waarde van links naar rechts door bewerkingen; een segment dat geen bewerking is, dient als terugvalwaarde.

| Bewerking       | Effect                                | Voorbeeld                         |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | compact getal                         | `272000 -> 272k`                  |
| `fixed:N`       | N decimalen (standaard 2)             | `0.0377`                          |
| `dur`           | seconden naar tijdsduur               | `14820 -> 4h07m`                  |
| `pct`           | voeg `%` toe                          | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | van gebruikt naar resterend       |
| `alias:TABLE`   | opzoeken in `aliases`, ongewijzigd indien niet vermeld | `medium -> 🌗`                    |
| `meter:W:SCALE` | gliefbalk van W cellen voor een waarde van 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = één glief) |

### Onderdeelvormen

- `{ "text": "📚 {context.max_tokens|num}" }`: letterlijke tekst + interpolatie.
- `{ "when": "<path>", "text": "..." }`: alleen weergeven als het pad waarheidsgetrouw is.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: waarde naar glief (een `_default`-geval dekt niet-overeenkomende waarden).
- `{ "each": "<array-path>", "item": "{label}" }`: itereren over een pad met een matrixwaarde (momenteel is geen enkel contractpad een matrix).

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

geeft bijvoorbeeld `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` weer.

## Providers + referenties

Gebruik wordt verborgen wanneer geen bruikbare autorisatie voor providergebruik kan worden bepaald. OpenClaw
ontdekt automatisch ingeschakelde providerplugins die
`contracts.usageProviders` declareren en zowel `resolveUsageAuth` als
`fetchUsageSnapshot` implementeren; er is geen afzonderlijke toelatingslijst voor providers in de kern. Het statische
contract houdt de detectie afgebakend zonder elke providerplugin te importeren. Elke
plugin beheert zijn eigen upstream-eindpunt en responstoewijzing. De
gedeelde momentopname houdt plannamen, quotumvensters, saldi, uitgaven en budgetten
providerneutraal voor gebruikers van de CLI, app en Control UI.

- **Anthropic (Claude)**: OAuth-tokens in autorisatieprofielen. Als het OAuth-token het
  bereik `user:profile` mist, wordt teruggevallen op een `claude.ai`-websessie (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY` of een `sessionKey=`-cookie in `CLAUDE_WEB_COOKIE`) wanneer die is ingesteld.
  Modelspecifieke limieten en ingeschakelde maandelijkse uitgaven/budgetten voor extra gebruik worden opgenomen
  wanneer Anthropic deze rapporteert. Een expliciete Anthropic Admin API-sleutel, of een
  automatisch gedetecteerd providerprofiel met `sk-ant-admin...`, toont in plaats daarvan de
  organisatiekosten over 30 dagen en de geschiedenis van de Messages API.
- **ClawRouter**: API-sleutel (`CLAWROUTER_API_KEY`). Toont een maandelijks budgetvenster
  en een getypeerd budget in USD wanneer dit is geconfigureerd; anders worden de totale uitgaven en een
  samenvatting van aanvragen/tokens/kosten getoond.
- **DeepSeek**: API-sleutel via omgeving/configuratie/autorisatieopslag (`DEEPSEEK_API_KEY`).
  Toont elk door de provider gerapporteerd valutasaldo.
- **GitHub Copilot**: OAuth-tokens in autorisatieprofielen.
- **Gemini CLI**: OAuth-tokens in autorisatieprofielen.
- **MiniMax**: API-sleutel of MiniMax OAuth-autorisatieprofiel. OpenClaw behandelt
  `minimax`, `minimax-cn` en `minimax-portal` als hetzelfde MiniMax-quotumoppervlak,
  geeft de voorkeur aan opgeslagen MiniMax OAuth wanneer aanwezig en valt anders terug
  op `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` of `MINIMAX_API_KEY`.
  Bij het opvragen van gebruik wordt de Coding Plan-host afgeleid van `models.providers.minimax-portal.baseUrl`
  of `models.providers.minimax.baseUrl` wanneer geconfigureerd; anders wordt de
  MiniMax CN-host gebruikt.
  De onbewerkte velden `usage_percent` / `usagePercent` van MiniMax betekenen het **resterende**
  quotum, dus OpenClaw keert deze vóór weergave om; op aantallen gebaseerde velden hebben voorrang wanneer
  aanwezig.
  - Vensterlabels komen uit de uren-/minutenvelden van de provider wanneer aanwezig en
    vallen daarna terug op de periode tussen `start_time` en `end_time`.
  - Als het Coding Plan-eindpunt `model_remains` retourneert, geeft OpenClaw de voorkeur aan de
    vermelding voor het chatmodel, leidt het vensterlabel af uit tijdstempels wanneer expliciete
    velden `window_hours` / `window_minutes` ontbreken en neemt de modelnaam
    op in het planlabel.
- **OpenAI (Codex/ChatGPT-abonnement)**: OAuth-tokens in autorisatieprofielen (`ChatGPT-Account-Id`-
  header wordt verzonden wanneer een account-id aanwezig is). Toont het ChatGPT-abonnement, opnieuw instelbare
  Codex-vensters en een creditsaldo wanneer dit wordt gerapporteerd. Credits blijven providercredits;
  OpenClaw duidt ze niet aan als dollars. `OPENAI_ADMIN_KEY` voegt
  organisatiekosten over 30 dagen en de gebruiksgeschiedenis van voltooiingen toe wanneer de sleutel toegang heeft tot het Usage
  Dashboard. Referenties voor inferentie worden nooit doorgestuurd naar organisatie-API's.
- **OpenRouter**: API-sleutel of door OAuth ondersteunde API-sleutel (`OPENROUTER_API_KEY` of een autorisatieprofiel).
  Combineert het eindpunt voor accountcredits met het eindpunt voor sleutelquota,
  zodat accountsaldo/-uitgaven, sleutelbudget en dagelijks/wekelijks/maandelijks gebruik verschijnen
  wanneer de referentie daar toegang toe heeft. Elk eindpunt kan de momentopname
  onafhankelijk verrijken.
- **Venice**: API-sleutel via omgeving/configuratie/autorisatieopslag (`VENICE_API_KEY`). Toont saldi in USD en
  DIEM plus het gebruik van de DIEM-epochtoewijzing wanneer gerapporteerd.
- **Xiaomi MiMo**: twee afzonderlijke gebruiksoppervlakken. Betalen naar gebruik gebruikt een API-sleutel
  (`XIAOMI_API_KEY`); het Token Plan gebruikt een afzonderlijke sleutel (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Geen van beide rapporteert momenteel quotumvensters.
- **z.ai**: API-sleutel via omgeving/configuratie/autorisatieopslag (`ZAI_API_KEY` of `Z_AI_API_KEY`).

## Gerelateerd

- [Tokengebruik en kosten](/nl/reference/token-use)
- [API-gebruik en kosten](/nl/reference/api-usage-costs)
- [Promptcaching](/nl/reference/prompt-caching)
- [Menubalk](/nl/platforms/mac/menu-bar)
