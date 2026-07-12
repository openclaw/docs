---
read_when:
    - Fouten opsporen in modelauthenticatie of verlopen OAuth-toegang
    - Authenticatie of opslag van aanmeldgegevens documenteren
summary: 'Modelauthenticatie: OAuth, API-sleutels, hergebruik van de Claude CLI en Anthropic-installatietoken'
title: Authenticatie
x-i18n:
    generated_at: "2026-07-12T08:52:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Deze pagina behandelt authenticatie bij **modelproviders** (API-sleutels, OAuth, hergebruik van Claude CLI, Anthropic-setup-token). Zie [Configuratie](/nl/gateway/configuration) en [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth) voor authenticatie van de **Gateway-verbinding** (token, wachtwoord, vertrouwde proxy).
</Note>

OpenClaw ondersteunt OAuth en API-sleutels voor modelproviders. Voor een Gateway-host die permanent actief is, is een API-sleutel de meest voorspelbare optie; abonnements- en OAuth-stromen werken ook wanneer deze aansluiten op het accountmodel van je provider.

- Volledige OAuth-stroom en opslagindeling: [/concepts/oauth](/nl/concepts/oauth)
- Authenticatie op basis van SecretRef (`env`/`file`/`exec`-providers): [Geheimenbeheer](/nl/gateway/secrets)
- Geschiktheids- en redencodes voor inloggegevens die door `models status --probe` worden gebruikt: [Semantiek van authenticatiegegevens](/nl/auth-credential-semantics)

## Aanbevolen configuratie: API-sleutel (elke provider)

1. Maak een API-sleutel aan in de beheerconsole van je provider.
2. Plaats deze op de **Gateway-host** (de machine waarop `openclaw gateway` wordt uitgevoerd):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Als de Gateway onder systemd/launchd draait, plaats je de sleutel in `~/.openclaw/.env`, zodat de daemon deze kan lezen:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Herstart het Gateway-proces (of de daemon) en controleer het daarna opnieuw:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` kan API-sleutels ook voor gebruik door de daemon opslaan als je omgevingsvariabelen niet zelf wilt beheren. Zie [Omgevingsvariabelen](/nl/help/environment) voor de volledige voorrangsvolgorde bij het laden van omgevingsvariabelen (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: hergebruik van Claude CLI

Authenticatie via een Anthropic-setup-token blijft een ondersteunde werkwijze. Hergebruik van Claude CLI (gebruik in de stijl van `claude -p`) is eveneens toegestaan voor deze integratie; wanneer op de host een aanmelding bij Claude CLI beschikbaar is, heeft die aanpak de voorkeur voor lokaal- en desktopgebruik. Voor lang actieve Gateway-hosts blijft een Anthropic-API-sleutel de meest voorspelbare keuze, met expliciete controle over facturering aan de serverzijde.

Hostconfiguratie voor hergebruik van Claude CLI:

```bash
# Uitvoeren op de Gateway-host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dit bestaat uit twee stappen: meld Claude Code op de host aan bij Anthropic en geef OpenClaw vervolgens opdracht om de selectie van Anthropic-modellen via de lokale `claude-cli`-backend te routeren en het bijbehorende OpenClaw-authenticatieprofiel op te slaan.

Als `claude` niet in `PATH` staat, installeer je Claude Code of stel je `agents.defaults.cliBackends.claude-cli.command` in op het pad naar het binaire bestand.

## Handmatige tokeninvoer

Werkt voor elke provider; schrijft naar de SQLite-authenticatieopslag per agent en werkt de configuratie bij:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw leest authenticatieprofielen uit het bestand `openclaw-agent.sqlite` van elke agent. Endpointgegevens (`baseUrl`, `api`, model-id's, headers, time-outs) horen onder `models.providers.<id>` in `openclaw.json` of `models.json`, niet in authenticatieprofielen.

Als een oudere installatie nog `auth-profiles.json`, `auth-state.json` of een platte structuur zoals `{ "openrouter": { "apiKey": "..." } }` bevat, voer je `openclaw doctor --fix` uit om deze in SQLite te importeren; doctor bewaart back-ups met tijdstempels naast de oorspronkelijke JSON-bestanden.

Externe authenticatieroutes zoals Bedrock `auth: "aws-sdk"` zijn geen inloggegevens. Stel voor een benoemde Bedrock-route `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json` in — schrijf geen `type: "aws-sdk"` naar de opslag voor authenticatieprofielen. `openclaw doctor --fix` migreert verouderde AWS SDK-markeringen vanuit de opslag voor inloggegevens naar de configuratiemetadata.

### Inloggegevens op basis van SecretRef

- `api_key`-inloggegevens kunnen `keyRef: { source, provider, id }` gebruiken
- `token`-inloggegevens kunnen `tokenRef: { source, provider, id }` gebruiken
- Profielen in OAuth-modus weigeren SecretRef-inloggegevens: als `auth.profiles.<id>.mode` gelijk is aan `"oauth"`, wordt een op SecretRef gebaseerde `keyRef`/`tokenRef` voor dat profiel geweigerd.

## De authenticatiestatus van modellen controleren

```bash
openclaw models status
openclaw doctor
```

Automatiseringsvriendelijke controle, met afsluitcode `1` bij verlopen/ontbreken en `2` bij bijna verlopen:

```bash
openclaw models status --check
```

Live-authenticatiecontroles (voeg `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` of `--probe-max-tokens` toe om het bereik te beperken):

```bash
openclaw models status --probe
```

Opmerkingen:

- Controleregels kunnen afkomstig zijn uit authenticatieprofielen, inloggegevens uit omgevingsvariabelen of `models.json`.
- Als `auth.order.<provider>` een opgeslagen profiel weglaat, rapporteert de controle `excluded_by_auth_order` voor dat profiel in plaats van het te proberen.
- Als authenticatie aanwezig is, maar OpenClaw geen controleerbaar model voor die provider kan bepalen, rapporteert de controle `status: no_model`.
- Afkoelperioden voor frequentielimieten kunnen modelspecifiek zijn: een profiel dat voor één model in een afkoelperiode zit, kan nog steeds een verwant model van dezelfde provider bedienen.

Optionele beheerscripts (systemd/Termux): [Scripts voor authenticatiebewaking](/nl/help/scripts#auth-monitoring-scripts).

## Rotatie van API-sleutels (Gateway)

Sommige providers proberen een aanvraag opnieuw met een andere geconfigureerde sleutel wanneer een aanroep de frequentielimiet van een provider bereikt.

Prioriteitsvolgorde van sleutels per provider:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (één overschrijving, zet één sleutel vast)
2. `<PROVIDER>_API_KEYS` (lijst gescheiden door komma's, spaties of puntkomma's)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (elke omgevingsvariabele met dit voorvoegsel)

Google-providers (`google`, `google-vertex`) vallen daarnaast terug op `GOOGLE_API_KEY`. Dubbele waarden worden vóór gebruik uit de gecombineerde lijst verwijderd.

OpenClaw roteert alleen naar de volgende sleutel wanneer het foutbericht overeenkomt met: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` of `too many requests`. Andere fouten worden niet opnieuw geprobeerd met alternatieve sleutels. Als alle sleutels mislukken, wordt de laatste fout van de laatste poging geretourneerd.

<Note>
Providerspecifieke formuleringen zoals `ThrottlingException`, `concurrency limit reached` of `workers_ai ... quota limit exceeded` bepalen de **classificatie voor failover/opnieuw proberen** (bij herhaalde fouten wisselen van model of provider), een mechanisme dat losstaat van de bovenstaande rotatie van API-sleutels.
</Note>

Het verwijderen van opgeslagen authenticatie trekt de sleutel bij de provider niet in — roteer de sleutel of trek deze in via het dashboard van de provider wanneer je deze aan de providerzijde ongeldig wilt maken.

## Providerauthenticatie verwijderen terwijl de Gateway actief is

Wanneer je providerauthenticatie via het beheervlak van de Gateway verwijdert, verwijdert OpenClaw de opgeslagen authenticatieprofielen voor die provider en breekt het actieve chat- en agentuitvoeringen af waarvan de geselecteerde modelprovider overeenkomt met de verwijderde provider. Afgebroken uitvoeringen genereren de gebruikelijke annulerings- en levenscyclusgebeurtenissen met `stopReason: "auth-revoked"`, zodat verbonden clients kunnen weergeven dat de uitvoering is gestopt omdat inloggegevens zijn verwijderd.

## Bepalen welke inloggegevens worden gebruikt

### OpenAI en verouderde `openai-codex`-id's

OpenAI-profielen met API-sleutels en ChatGPT/Codex-profielen met OAuth gebruiken beide de canonieke provider-id `openai`. Gebruik `openai:*`-profiel-id's en `auth.order.openai` voor nieuwe configuraties.

Als je `openai-codex` in een oudere configuratie, authenticatieprofiel-id's of `auth.order.openai-codex` ziet, behandel dit dan als invoer voor een verouderde migratie — maak geen nieuwe `openai-codex`-profielen aan. Voer het volgende uit:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor herschrijft verouderde `openai-codex:*`-profiel-id's en vermeldingen in `auth.order.openai-codex` naar de canonieke `openai`-route. Zie [OpenAI](/nl/providers/openai) voor OpenAI-specifieke routering van modellen en runtimes.

### Tijdens het aanmelden (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` houdt meerdere OAuth-aanmeldingen voor dezelfde provider binnen één agent gescheiden.

`--force` verwijdert de opgeslagen authenticatieprofielen voor die provider in de geselecteerde agentmap en voert vervolgens dezelfde authenticatiestroom opnieuw uit. Gebruik dit wanneer een opgeslagen profiel vastzit, verlopen is of aan het verkeerde account is gekoppeld. Hiermee worden inloggegevens bij de provider niet ingetrokken.

```bash
openclaw models auth login --provider anthropic --force
```

### Per sessie (chatopdracht)

- `/model <alias-or-id>@<profileId>` zet specifieke inloggegevens voor een provider vast voor de huidige sessie (voorbeeldprofiel-id's: `anthropic:default`, `anthropic:work`).
- `/model` (of `/model list`) toont een compacte keuzelijst; `/model status` toont de volledige weergave (kandidaten + volgend authenticatieprofiel, plus endpointgegevens van de provider wanneer deze zijn geconfigureerd).

Als je de authenticatievolgorde of het vastgezette profiel wijzigt voor een chat die al actief is, stuur je `/new` of `/reset` om een nieuwe sessie te starten — bestaande sessies behouden hun huidige model-/profielselectie totdat ze opnieuw worden ingesteld.

### Per agent (CLI-overschrijving)

Overschrijvingen van de authenticatievolgorde worden opgeslagen in de SQLite-authenticatiestatus van die agent:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gebruik `--agent <id>` om een specifieke agent te selecteren; laat dit weg om de geconfigureerde standaardagent te gebruiken. `openclaw models status --probe` toont weggelaten opgeslagen profielen als `excluded_by_auth_order` in plaats van ze stilzwijgend over te slaan.

## Probleemoplossing

### "Geen inloggegevens gevonden"

Configureer een Anthropic-API-sleutel op de **Gateway-host** of stel de Anthropic-setup-tokenroute in en controleer het daarna opnieuw:

```bash
openclaw models status
```

### Token verloopt bijna/is verlopen

Voer `openclaw models status` uit om te zien welk profiel bijna verloopt. Als een Anthropic-tokenprofiel ontbreekt of verlopen is, vernieuw het dan via een setup-token of migreer naar een Anthropic-API-sleutel.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Externe toegang](/nl/gateway/remote)
- [Authenticatieopslag](/nl/concepts/oauth)
