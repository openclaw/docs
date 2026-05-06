---
read_when:
    - Modelauthenticatie of OAuth-verloop debuggen
    - Authenticatie of opslag van inloggegevens documenteren
summary: 'Modelauthenticatie: OAuth, API-sleutels, hergebruik van Claude CLI en Anthropic setup-token'
title: Authenticatie
x-i18n:
    generated_at: "2026-05-06T09:11:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Deze pagina is de referentie voor authenticatie van **modelproviders** (API-sleutels, OAuth, hergebruik van Claude CLI en Anthropic setup-token). Voor authenticatie van **Gateway-verbindingen** (token, wachtwoord, trusted-proxy), zie [Configuratie](/nl/gateway/configuration) en [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth).
</Note>

OpenClaw ondersteunt OAuth en API-sleutels voor modelproviders. Voor altijd actieve Gateway
hosts zijn API-sleutels meestal de meest voorspelbare optie. Subscription-/OAuth-
flows worden ook ondersteund wanneer ze passen bij het accountmodel van je provider.

Zie [/concepts/oauth](/nl/concepts/oauth) voor de volledige OAuth-flow en opslagindeling.
Voor op SecretRef gebaseerde authenticatie (`env`/`file`/`exec` providers), zie [Geheimenbeheer](/nl/gateway/secrets).
Voor regels voor geschiktheid van referenties/reason-codes die door `models status --probe` worden gebruikt, zie
[Auth Credential Semantics](/nl/auth-credential-semantics).

## Aanbevolen installatie (API-sleutel, elke provider)

Als je een langlevende Gateway draait, begin dan met een API-sleutel voor je gekozen
provider.
Specifiek voor Anthropic blijft API-sleutel-authenticatie de meest voorspelbare server-
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

Herstart daarna de daemon (of herstart je Gateway-proces) en controleer opnieuw:

```bash
openclaw models status
openclaw doctor
```

Als je env vars liever niet zelf beheert, kan onboarding
API-sleutels opslaan voor gebruik door de daemon: `openclaw onboard`.

Zie [Help](/nl/help) voor details over env-overerving (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibiliteit met Claude CLI en tokens

Anthropic setup-token-authenticatie is nog steeds beschikbaar in OpenClaw als ondersteund token-
pad. Anthropic-medewerkers hebben ons sindsdien verteld dat OpenClaw-achtig Claude CLI-gebruik
weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en `claude -p`-gebruik als
goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Wanneer
hergebruik van Claude CLI beschikbaar is op de host, is dat nu het voorkeursmethode.

Voor langlevende Gateway-hosts blijft een Anthropic API-sleutel de meest voorspelbare
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
2. Laat OpenClaw Anthropic-modelselectie overschakelen naar de lokale `claude-cli`
   backend en sla het bijbehorende OpenClaw-authenticatieprofiel op.

Als `claude` niet op `PATH` staat, installeer dan eerst Claude Code of stel
`agents.defaults.cliBackends.claude-cli.command` in op het echte binaire pad.

Handmatige tokeninvoer (elke provider; schrijft `auth-profiles.json` + werkt config bij):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` slaat alleen referenties op. De canonieke vorm is:

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

OpenClaw verwacht tijdens runtime de canonieke vorm met `version` + `profiles`. Als een oudere installatie nog een plat bestand heeft zoals `{ "openrouter": { "apiKey": "..." } }`, voer dan `openclaw doctor --fix` uit om dit te herschrijven als een `openrouter:default` API-sleutelprofiel; doctor bewaart een `.legacy-flat.*.bak`-kopie naast het origineel. Endpointdetails zoals `baseUrl`, `api`, model-id's, headers en time-outs horen onder `models.providers.<id>` in `openclaw.json` of `models.json`, niet in `auth-profiles.json`.

Auth-profielrefs worden ook ondersteund voor statische referenties:

- `api_key`-referenties kunnen `keyRef: { source, provider, id }` gebruiken
- `token`-referenties kunnen `tokenRef: { source, provider, id }` gebruiken
- OAuth-modusprofielen ondersteunen geen SecretRef-referenties; als `auth.profiles.<id>.mode` is ingesteld op `"oauth"`, wordt SecretRef-ondersteunde `keyRef`/`tokenRef`-invoer voor dat profiel geweigerd.

Automatiseringsvriendelijke controle (exit `1` wanneer verlopen/ontbrekend, `2` wanneer bijna verlopen):

```bash
openclaw models status --check
```

Live-authenticatieprobes:

```bash
openclaw models status --probe
```

Opmerkingen:

- Proberijen kunnen afkomstig zijn van auth-profielen, env-referenties of `models.json`.
- Als expliciete `auth.order.<provider>` een opgeslagen profiel weglaat, meldt probe
  `excluded_by_auth_order` voor dat profiel in plaats van het te proberen.
- Als authenticatie bestaat maar OpenClaw geen probeerbare modelkandidaat voor
  die provider kan oplossen, meldt probe `status: no_model`.
- Rate-limit-cooldowns kunnen modelspecifiek zijn. Een profiel dat afkoelt voor één
  model kan nog steeds bruikbaar zijn voor een verwant model bij dezelfde provider.

Optionele ops-scripts (systemd/Termux) zijn hier gedocumenteerd:
[Auth-monitoringscripts](/nl/help/scripts#auth-monitoring-scripts)

## Anthropic-opmerking

De Anthropic `claude-cli` backend wordt weer ondersteund.

- Anthropic-medewerkers hebben ons verteld dat dit OpenClaw-integratiepad weer is toegestaan.
- OpenClaw behandelt hergebruik van Claude CLI en `claude -p`-gebruik daarom als goedgekeurd
  voor door Anthropic ondersteunde runs, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic API-sleutels blijven de meest voorspelbare keuze voor langlevende Gateway-
  hosts en expliciete server-side factureringscontrole.

## Model-authenticatiestatus controleren

```bash
openclaw models status
openclaw doctor
```

## Rotatiegedrag van API-sleutels (Gateway)

Sommige providers ondersteunen het opnieuw proberen van een request met alternatieve sleutels wanneer een API-call
een provider-rate-limit raakt.

- Prioriteitsvolgorde:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-providers nemen ook `GOOGLE_API_KEY` op als extra fallback.
- Dezelfde sleutellijst wordt voor gebruik gededupliceerd.
- OpenClaw probeert opnieuw met de volgende sleutel alleen bij rate-limit-fouten (bijvoorbeeld
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, of
  `workers_ai ... quota limit exceeded`).
- Niet-rate-limit-fouten worden niet opnieuw geprobeerd met alternatieve sleutels.
- Als alle sleutels falen, wordt de uiteindelijke fout van de laatste poging teruggegeven.

## Bepalen welke referentie wordt gebruikt

### Per sessie (chatopdracht)

Gebruik `/model <alias-or-id>@<profileId>` om een specifieke providerreferentie vast te pinnen voor de huidige sessie (voorbeeldprofiel-id's: `anthropic:default`, `anthropic:work`).

Gebruik `/model` (of `/model list`) voor een compacte kiezer; gebruik `/model status` voor de volledige weergave (kandidaten + volgend auth-profiel, plus provider-endpointdetails wanneer geconfigureerd).

### Per agent (CLI-override)

Stel een expliciete override voor auth-profielvolgorde in voor een agent (opgeslagen in de `auth-state.json` van die agent):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gebruik `--agent <id>` om een specifieke agent te targeten; laat dit weg om de geconfigureerde standaardagent te gebruiken.
Wanneer je volgordeproblemen debugt, toont `openclaw models status --probe` weggelaten
opgeslagen profielen als `excluded_by_auth_order` in plaats van ze stilzwijgend over te slaan.
Wanneer je cooldownproblemen debugt, onthoud dan dat rate-limit-cooldowns gekoppeld kunnen zijn
aan één model-id in plaats van aan het volledige providerprofiel.

## Problemen oplossen

### "No credentials found"

Als het Anthropic-profiel ontbreekt, configureer dan een Anthropic API-sleutel op de
**Gateway-host** of stel het Anthropic setup-token-pad in, en controleer daarna opnieuw:

```bash
openclaw models status
```

### Token bijna verlopen/verlopen

Voer `openclaw models status` uit om te bevestigen welk profiel bijna verloopt. Als een
Anthropic-tokenprofiel ontbreekt of verlopen is, vernieuw die installatie dan via
setup-token of migreer naar een Anthropic API-sleutel.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Externe toegang](/nl/gateway/remote)
- [Auth-opslag](/nl/concepts/oauth)
