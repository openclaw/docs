---
read_when:
    - Modelauthenticatie of OAuth-verloop debuggen
    - Authenticatie of opslag van inloggegevens documenteren
summary: 'Modelauthenticatie: OAuth, API-sleutels, Claude CLI-hergebruik en Anthropic setup-token'
title: Authenticatie
x-i18n:
    generated_at: "2026-05-07T13:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Deze pagina is de authenticatiereferentie voor **modelproviders** (API-sleutels, OAuth, hergebruik van Claude CLI en Anthropic setup-token). Voor authenticatie voor **Gateway-verbindingen** (token, wachtwoord, trusted-proxy), zie [Configuratie](/nl/gateway/configuration) en [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth).
</Note>

OpenClaw ondersteunt OAuth en API-sleutels voor modelproviders. Voor altijd actieve Gateway-
hosts zijn API-sleutels meestal de meest voorspelbare optie. Abonnement-/OAuth-
flows worden ook ondersteund wanneer ze passen bij het accountmodel van je provider.

Zie [/concepts/oauth](/nl/concepts/oauth) voor de volledige OAuth-flow en opslag-
indeling.
Voor SecretRef-gebaseerde authenticatie (`env`/`file`/`exec`-providers), zie [Geheimenbeheer](/nl/gateway/secrets).
Voor regels voor geschiktheid van verificatiegegevens en redencodes die worden gebruikt door `models status --probe`, zie
[Semantiek van verificatiegegevens](/nl/auth-credential-semantics).

## Aanbevolen installatie (API-sleutel, elke provider)

Als je een langlopende Gateway gebruikt, begin dan met een API-sleutel voor je gekozen
provider.
Specifiek voor Anthropic blijft authenticatie met een API-sleutel de meest voorspelbare server-
installatie, maar OpenClaw ondersteunt ook het hergebruiken van een lokale Claude CLI-login.

1. Maak een API-sleutel aan in de console van je provider.
2. Plaats deze op de **Gateway-host** (de machine waarop `openclaw gateway` draait).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Als de Gateway onder systemd/launchd draait, plaats de sleutel dan bij voorkeur in
   `~/.openclaw/.env` zodat de daemon deze kan lezen:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Start daarna de daemon opnieuw (of start je Gateway-proces opnieuw) en controleer opnieuw:

```bash
openclaw models status
openclaw doctor
```

Als je liever niet zelf env-vars beheert, kan onboarding
API-sleutels opslaan voor gebruik door de daemon: `openclaw onboard`.

Zie [Help](/nl/help) voor details over env-overerving (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI en tokencompatibiliteit

Anthropic setup-token-authenticatie is nog steeds beschikbaar in OpenClaw als ondersteund token-
pad. Medewerkers van Anthropic hebben ons sindsdien verteld dat OpenClaw-achtig Claude CLI-gebruik
weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als
goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Wanneer
hergebruik van Claude CLI beschikbaar is op de host, is dat nu het voorkeurspad.

Voor langlopende Gateway-hosts blijft een Anthropic API-sleutel de meest voorspelbare
installatie. Als je een bestaande Claude-login op dezelfde host wilt hergebruiken, gebruik dan het
Anthropic Claude CLI-pad in onboarding/configure.

Aanbevolen hostinstallatie voor hergebruik van Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dit is een installatie in twee stappen:

1. Log Claude Code zelf in bij Anthropic op de Gateway-host.
2. Geef OpenClaw opdracht om de Anthropic-modelselectie over te schakelen naar de lokale `claude-cli`-
   backend en het bijbehorende OpenClaw-authenticatieprofiel op te slaan.

Als `claude` niet op `PATH` staat, installeer dan eerst Claude Code of stel
`agents.defaults.cliBackends.claude-cli.command` in op het echte pad naar het binaire bestand.

Handmatige tokeninvoer (elke provider; schrijft `auth-profiles.json` + werkt config bij):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` slaat alleen verificatiegegevens op. De canonieke vorm is:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw verwacht tijdens runtime de canonieke vorm met `version` + `profiles`. Als een oudere installatie nog een plat bestand heeft, zoals `{ "openrouter": { "apiKey": "..." } }`, voer dan `openclaw doctor --fix` uit om dit te herschrijven als een `openrouter:default` API-sleutelprofiel; doctor bewaart een `.legacy-flat.*.bak`-kopie naast het origineel. Endpointdetails zoals `baseUrl`, `api`, model-id's, headers en time-outs horen onder `models.providers.<id>` in `openclaw.json` of `models.json`, niet in `auth-profiles.json`.

Externe authenticatieroutes zoals Bedrock `auth: "aws-sdk"` zijn ook geen verificatiegegevens. Als je een benoemde Bedrock-route wilt, zet dan `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json`; schrijf geen `type: "aws-sdk"` naar `auth-profiles.json`. `openclaw doctor --fix` verplaatst verouderde AWS SDK-markeringen uit de opslag voor verificatiegegevens naar configuratiemetadata.

Auth-profielrefs worden ook ondersteund voor statische verificatiegegevens:

- `api_key`-verificatiegegevens kunnen `keyRef: { source, provider, id }` gebruiken
- `token`-verificatiegegevens kunnen `tokenRef: { source, provider, id }` gebruiken
- Profielen in OAuth-modus ondersteunen geen SecretRef-verificatiegegevens; als `auth.profiles.<id>.mode` is ingesteld op `"oauth"`, wordt SecretRef-ondersteunde `keyRef`/`tokenRef`-invoer voor dat profiel geweigerd.

Automatiseringsvriendelijke controle (exit `1` wanneer verlopen/ontbrekend, `2` wanneer bijna verlopen):

```bash
openclaw models status --check
```

Live authenticatieprobes:

```bash
openclaw models status --probe
```

Opmerkingen:

- Proberijen kunnen afkomstig zijn van auth-profielen, env-verificatiegegevens of `models.json`.
- Als expliciete `auth.order.<provider>` een opgeslagen profiel weglaat, rapporteert probe
  `excluded_by_auth_order` voor dat profiel in plaats van het te proberen.
- Als authenticatie bestaat maar OpenClaw geen probeerbare modelkandidaat voor
  die provider kan bepalen, rapporteert probe `status: no_model`.
- Rate-limit-cooldowns kunnen modelspecifiek zijn. Een profiel dat afkoelt voor één
  model kan nog steeds bruikbaar zijn voor een verwant model op dezelfde provider.

Optionele ops-scripts (systemd/Termux) worden hier gedocumenteerd:
[Scripts voor authenticatiebewaking](/nl/help/scripts#auth-monitoring-scripts)

## Anthropic-opmerking

De Anthropic `claude-cli`-backend wordt weer ondersteund.

- Medewerkers van Anthropic hebben ons verteld dat dit OpenClaw-integratiepad weer is toegestaan.
- OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` daarom als goedgekeurd
  voor door Anthropic ondersteunde runs, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic API-sleutels blijven de meest voorspelbare keuze voor langlopende Gateway-
  hosts en expliciete server-side factureringscontrole.

## Status van modelauthenticatie controleren

```bash
openclaw models status
openclaw doctor
```

## Rotatiegedrag van API-sleutels (Gateway)

Sommige providers ondersteunen het opnieuw proberen van een aanvraag met alternatieve sleutels wanneer een API-aanroep
een rate limit van de provider raakt.

- Prioriteitsvolgorde:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-providers nemen ook `GOOGLE_API_KEY` op als aanvullende fallback.
- Dezelfde sleutellijst wordt vóór gebruik ontdubbeld.
- OpenClaw probeert het opnieuw met de volgende sleutel alleen bij rate-limit-fouten (bijvoorbeeld
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, of
  `workers_ai ... quota limit exceeded`).
- Fouten die geen rate-limit-fouten zijn, worden niet opnieuw geprobeerd met alternatieve sleutels.
- Als alle sleutels falen, wordt de uiteindelijke fout van de laatste poging teruggegeven.

## Bepalen welke verificatiegegevens worden gebruikt

### Per sessie (chatopdracht)

Gebruik `/model <alias-or-id>@<profileId>` om specifieke verificatiegegevens van een provider vast te zetten voor de huidige sessie (voorbeeldprofiel-id's: `anthropic:default`, `anthropic:work`).

Gebruik `/model` (of `/model list`) voor een compacte picker; gebruik `/model status` voor de volledige weergave (kandidaten + volgend auth-profiel, plus provider-endpointdetails wanneer geconfigureerd).

### Per agent (CLI-override)

Stel een expliciete override voor de volgorde van auth-profielen in voor een agent (opgeslagen in de `auth-state.json` van die agent):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gebruik `--agent <id>` om een specifieke agent te kiezen; laat dit weg om de geconfigureerde standaardagent te gebruiken.
Wanneer je volgordeproblemen debugt, toont `openclaw models status --probe` weggelaten
opgeslagen profielen als `excluded_by_auth_order` in plaats van ze stilzwijgend over te slaan.
Wanneer je cooldownproblemen debugt, onthoud dan dat rate-limit-cooldowns gekoppeld kunnen zijn
aan één model-id in plaats van aan het volledige providerprofiel.

## Problemen oplossen

### "Geen verificatiegegevens gevonden"

Als het Anthropic-profiel ontbreekt, configureer dan een Anthropic API-sleutel op de
**Gateway-host** of stel het Anthropic setup-token-pad in en controleer daarna opnieuw:

```bash
openclaw models status
```

### Token verloopt bijna/is verlopen

Voer `openclaw models status` uit om te bevestigen welk profiel bijna verloopt. Als een
Anthropic-tokenprofiel ontbreekt of verlopen is, vernieuw die installatie dan via
setup-token of migreer naar een Anthropic API-sleutel.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Externe toegang](/nl/gateway/remote)
- [Authenticatieopslag](/nl/concepts/oauth)
