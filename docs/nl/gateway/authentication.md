---
read_when:
    - Modelauthenticatie of OAuth-verloop debuggen
    - Authenticatie of opslag van inloggegevens documenteren
summary: 'Modelauthenticatie: OAuth, API-sleutels, hergebruik van Claude CLI en Anthropic setup-token'
title: Authenticatie
x-i18n:
    generated_at: "2026-04-29T22:42:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Deze pagina is de authenticatiereferentie voor **modelproviders** (API-sleutels, OAuth, hergebruik van Claude CLI en Anthropic setup-token). Voor authenticatie van **Gateway-verbindingen** (token, password, trusted-proxy), zie [Configuratie](/nl/gateway/configuration) en [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth).
</Note>

OpenClaw ondersteunt OAuth en API-sleutels voor modelproviders. Voor altijd actieve Gateway-hosts
zijn API-sleutels meestal de meest voorspelbare optie. Subscription/OAuth-
flows worden ook ondersteund wanneer ze passen bij het accountmodel van je provider.

Zie [/concepts/oauth](/nl/concepts/oauth) voor de volledige OAuth-flow en opslag-
indeling.
Voor authenticatie op basis van SecretRef (`env`/`file`/`exec` providers), zie [Geheimenbeheer](/nl/gateway/secrets).
Voor regels voor credential-geschiktheid/reason-code die worden gebruikt door `models status --probe`, zie
[Semantiek van authenticatiecredentials](/nl/auth-credential-semantics).

## Aanbevolen configuratie (API-sleutel, elke provider)

Als je een langlevende Gateway uitvoert, begin dan met een API-sleutel voor je gekozen
provider.
Specifiek voor Anthropic is authenticatie met een API-sleutel nog steeds de meest voorspelbare server-
configuratie, maar OpenClaw ondersteunt ook het hergebruiken van een lokale Claude CLI-login.

1. Maak een API-sleutel in je providerconsole.
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

Start daarna de daemon opnieuw (of herstart je Gateway-proces) en controleer opnieuw:

```bash
openclaw models status
openclaw doctor
```

Als je liever niet zelf env vars beheert, kan onboarding
API-sleutels opslaan voor gebruik door de daemon: `openclaw onboard`.

Zie [Help](/nl/help) voor details over env-overerving (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI en tokencompatibiliteit

Anthropic setup-token-authenticatie is nog steeds beschikbaar in OpenClaw als een ondersteund token-
pad. Anthropic-medewerkers hebben ons sindsdien verteld dat OpenClaw-achtig gebruik van Claude CLI weer
is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als
gesanctioneerd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Wanneer
hergebruik van Claude CLI beschikbaar is op de host, is dat nu het voorkeurspad.

Voor langlevende Gateway-hosts is een Anthropic API-sleutel nog steeds de meest voorspelbare
configuratie. Als je een bestaande Claude-login op dezelfde host wilt hergebruiken, gebruik dan het
Anthropic Claude CLI-pad in onboarding/configure.

Aanbevolen hostconfiguratie voor hergebruik van Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dit is een configuratie in twee stappen:

1. Log Claude Code zelf in bij Anthropic op de Gateway-host.
2. Laat OpenClaw de Anthropic-modelselectie overschakelen naar de lokale `claude-cli`-
   backend en sla het bijbehorende OpenClaw-authenticatieprofiel op.

Als `claude` niet op `PATH` staat, installeer dan eerst Claude Code of stel
`agents.defaults.cliBackends.claude-cli.command` in op het echte binaire pad.

Handmatige tokeninvoer (elke provider; schrijft `auth-profiles.json` + werkt config bij):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` slaat alleen credentials op. De canonieke vorm is:

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

OpenClaw verwacht tijdens runtime de canonieke vorm met `version` + `profiles`. Als een oudere installatie nog een plat bestand heeft, zoals `{ "openrouter": { "apiKey": "..." } }`, voer dan `openclaw doctor --fix` uit om dit te herschrijven als een `openrouter:default` API-sleutelprofiel; doctor bewaart een `.legacy-flat.*.bak`-kopie naast het origineel. Endpointdetails zoals `baseUrl`, `api`, model ids, headers en timeouts horen onder `models.providers.<id>` in `openclaw.json` of `models.json`, niet in `auth-profiles.json`.

Auth-profielrefs worden ook ondersteund voor statische credentials:

- `api_key` credentials kunnen `keyRef: { source, provider, id }` gebruiken
- `token` credentials kunnen `tokenRef: { source, provider, id }` gebruiken
- Profielen in OAuth-modus ondersteunen geen SecretRef-credentials; als `auth.profiles.<id>.mode` is ingesteld op `"oauth"`, wordt invoer met SecretRef-ondersteunde `keyRef`/`tokenRef` voor dat profiel geweigerd.

Automatiseringsvriendelijke controle (exit `1` wanneer verlopen/ontbrekend, `2` wanneer bijna verlopen):

```bash
openclaw models status --check
```

Live authenticatieprobes:

```bash
openclaw models status --probe
```

Opmerkingen:

- Probe-rijen kunnen afkomstig zijn van auth-profielen, env-credentials of `models.json`.
- Als expliciete `auth.order.<provider>` een opgeslagen profiel weglaat, meldt probe
  `excluded_by_auth_order` voor dat profiel in plaats van het te proberen.
- Als authenticatie bestaat maar OpenClaw geen probeerbare modelkandidaat voor
  die provider kan bepalen, meldt probe `status: no_model`.
- Rate-limit-cooldowns kunnen modelspecifiek zijn. Een profiel dat afkoelt voor één
  model kan nog steeds bruikbaar zijn voor een verwant model bij dezelfde provider.

Optionele ops-scripts (systemd/Termux) worden hier gedocumenteerd:
[Scripts voor authenticatiemonitoring](/nl/help/scripts#auth-monitoring-scripts)

## Anthropic-opmerking

De Anthropic `claude-cli`-backend wordt weer ondersteund.

- Anthropic-medewerkers vertelden ons dat dit OpenClaw-integratiepad weer is toegestaan.
- OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` daarom als gesanctioneerd
  voor runs met Anthropic-backend, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic API-sleutels blijven de meest voorspelbare keuze voor langlevende Gateway-
  hosts en expliciete server-side factureringscontrole.

## Model-authenticatiestatus controleren

```bash
openclaw models status
openclaw doctor
```

## Gedrag bij rotatie van API-sleutels (Gateway)

Sommige providers ondersteunen het opnieuw proberen van een request met alternatieve sleutels wanneer een API-call
een rate limit van de provider raakt.

- Prioriteitsvolgorde:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-providers nemen ook `GOOGLE_API_KEY` op als extra fallback.
- Dezelfde sleutellijst wordt vóór gebruik gededupliceerd.
- OpenClaw probeert het opnieuw met de volgende sleutel alleen voor rate-limit-fouten (bijvoorbeeld
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` of
  `workers_ai ... quota limit exceeded`).
- Fouten die geen rate-limit-fouten zijn, worden niet opnieuw geprobeerd met alternatieve sleutels.
- Als alle sleutels falen, wordt de uiteindelijke fout van de laatste poging geretourneerd.

## Bepalen welke credential wordt gebruikt

### Per sessie (chatopdracht)

Gebruik `/model <alias-or-id>@<profileId>` om een specifieke providercredential vast te zetten voor de huidige sessie (voorbeeldprofiel-ids: `anthropic:default`, `anthropic:work`).

Gebruik `/model` (of `/model list`) voor een compacte kiezer; gebruik `/model status` voor de volledige weergave (kandidaten + volgend auth-profiel, plus provider-endpointdetails wanneer geconfigureerd).

### Per agent (CLI-override)

Stel een expliciete override voor de volgorde van auth-profielen in voor een agent (opgeslagen in de `auth-state.json` van die agent):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gebruik `--agent <id>` om een specifieke agent te targeten; laat dit weg om de geconfigureerde standaardagent te gebruiken.
Wanneer je volgordeproblemen debugt, toont `openclaw models status --probe` weggelaten
opgeslagen profielen als `excluded_by_auth_order` in plaats van ze stilzwijgend over te slaan.
Wanneer je cooldownproblemen debugt, onthoud dan dat rate-limit-cooldowns kunnen zijn gekoppeld
aan één model-id in plaats van aan het hele providerprofiel.

## Probleemoplossing

### "No credentials found"

Als het Anthropic-profiel ontbreekt, configureer dan een Anthropic API-sleutel op de
**Gateway-host** of stel het Anthropic setup-token-pad in en controleer daarna opnieuw:

```bash
openclaw models status
```

### Token verloopt/bijna verlopen

Voer `openclaw models status` uit om te bevestigen welk profiel bijna verloopt. Als een
Anthropic-tokenprofiel ontbreekt of verlopen is, vernieuw die configuratie dan via
setup-token of migreer naar een Anthropic API-sleutel.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Externe toegang](/nl/gateway/remote)
- [Auth-opslag](/nl/concepts/oauth)
