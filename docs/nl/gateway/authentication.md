---
read_when:
    - Foutopsporing voor modelauthenticatie of OAuth-verloop
    - Authenticatie of opslag van inloggegevens documenteren
summary: 'Modelauthenticatie: OAuth, API-sleutels, hergebruik van Claude CLI en Anthropic setup-token'
title: Authenticatie
x-i18n:
    generated_at: "2026-06-27T17:31:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Deze pagina is de authenticatiereferentie voor **modelproviders** (API-sleutels, OAuth, hergebruik van Claude CLI en Anthropic setup-token). Zie [Configuratie](/nl/gateway/configuration) en [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth) voor authenticatie van de **Gateway-verbinding** (token, wachtwoord, trusted-proxy).
</Note>

OpenClaw ondersteunt OAuth en API-sleutels voor modelproviders. Voor altijd actieve Gateway-
hosts zijn API-sleutels meestal de meest voorspelbare optie. Abonnements-/OAuth-
flows worden ook ondersteund wanneer ze aansluiten op het accountmodel van je provider.

Zie [/concepts/oauth](/nl/concepts/oauth) voor de volledige OAuth-flow en opslag-
indeling.
Zie [Secrets Management](/nl/gateway/secrets) voor SecretRef-gebaseerde authenticatie (`env`/`file`/`exec` providers).
Zie [Auth Credential Semantics](/nl/auth-credential-semantics) voor regels voor geschiktheid van credentials/redencodes die worden gebruikt door `models status --probe`.

## Aanbevolen setup (API-sleutel, elke provider)

Als je een langlevende Gateway draait, begin dan met een API-sleutel voor je gekozen
provider.
Specifiek voor Anthropic blijft authenticatie met API-sleutel de meest voorspelbare server-
setup, maar OpenClaw ondersteunt ook hergebruik van een lokale Claude CLI-login.

1. Maak een API-sleutel aan in de console van je provider.
2. Plaats deze op de **Gateway-host** (de machine waarop `openclaw gateway` draait).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Als de Gateway onder systemd/launchd draait, zet de sleutel dan bij voorkeur in
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

Als je env-vars liever niet zelf beheert, kan onboarding
API-sleutels opslaan voor gebruik door de daemon: `openclaw onboard`.

Zie [Help](/nl/help) voor details over env-overerving (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibiliteit met Claude CLI en tokens

Anthropic setup-token-authenticatie is nog steeds beschikbaar in OpenClaw als ondersteund token-
pad. Anthropic-medewerkers hebben ons inmiddels verteld dat Claude CLI-gebruik in OpenClaw-stijl
weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als
goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Wanneer
hergebruik van Claude CLI beschikbaar is op de host, is dat nu het voorkeursprofiel.

Voor langlevende Gateway-hosts blijft een Anthropic API-sleutel de meest voorspelbare
setup. Als je een bestaande Claude-login op dezelfde host wilt hergebruiken, gebruik dan het
Anthropic Claude CLI-pad in onboarding/configure.

Aanbevolen hostsetup voor hergebruik van Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dit is een setup in twee stappen:

1. Log Claude Code zelf in bij Anthropic op de Gateway-host.
2. Vertel OpenClaw om Anthropic-modelselectie over te schakelen naar de lokale `claude-cli`-
   backend en het bijpassende OpenClaw-authenticatieprofiel op te slaan.

Als `claude` niet op `PATH` staat, installeer dan eerst Claude Code of stel
`agents.defaults.cliBackends.claude-cli.command` in op het echte binaire pad.

Handmatige tokeninvoer (elke provider; schrijft de SQLite-authenticatieopslag per agent + werkt config bij):

```bash
openclaw models auth paste-token --provider openrouter
```

De opslag voor authenticatieprofielen bewaart alleen credentials. Verouderde `auth-profiles.json`-bestanden gebruikten deze canonieke vorm:

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

OpenClaw leest authenticatieprofielen nu uit de `openclaw-agent.sqlite` van elke agent. Als een oudere installatie nog `auth-profiles.json`, `auth-state.json` of een plat authenticatieprofielbestand heeft, zoals `{ "openrouter": { "apiKey": "..." } }`, voer dan `openclaw doctor --fix` uit om het in SQLite te importeren; doctor bewaart back-ups met tijdstempel naast de oorspronkelijke JSON-bestanden. Endpointdetails zoals `baseUrl`, `api`, model-id's, headers en time-outs horen onder `models.providers.<id>` in `openclaw.json` of `models.json`, niet in authenticatieprofielen.

Externe authenticatieroutes zoals Bedrock `auth: "aws-sdk"` zijn ook geen credentials. Als je een benoemde Bedrock-route wilt, zet dan `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json`; schrijf geen `type: "aws-sdk"` naar de opslag voor authenticatieprofielen. `openclaw doctor --fix` verplaatst verouderde AWS SDK-markeringen vanuit de credentialopslag naar configmetadata.

Authenticatieprofielrefs worden ook ondersteund voor statische credentials:

- `api_key` credentials kunnen `keyRef: { source, provider, id }` gebruiken
- `token` credentials kunnen `tokenRef: { source, provider, id }` gebruiken
- Profielen in OAuth-modus ondersteunen geen SecretRef-credentials; als `auth.profiles.<id>.mode` is ingesteld op `"oauth"`, wordt door SecretRef ondersteunde `keyRef`/`tokenRef`-invoer voor dat profiel geweigerd.

Automatiseringsvriendelijke controle (exit `1` wanneer verlopen/ontbrekend, `2` wanneer bijna verlopen):

```bash
openclaw models status --check
```

Live-authenticatieprobes:

```bash
openclaw models status --probe
```

Opmerkingen:

- Proberijen kunnen afkomstig zijn uit authenticatieprofielen, env-credentials of `models.json`.
- Als expliciete `auth.order.<provider>` een opgeslagen profiel weglaat, rapporteert probe
  `excluded_by_auth_order` voor dat profiel in plaats van het te proberen.
- Als authenticatie bestaat maar OpenClaw geen probeerbare modelkandidaat voor
  die provider kan oplossen, rapporteert probe `status: no_model`.
- Cooldowns voor snelheidslimieten kunnen modelspecifiek zijn. Een profiel dat afkoelt voor één
  model kan nog steeds bruikbaar zijn voor een zustermodel bij dezelfde provider.

Optionele ops-scripts (systemd/Termux) worden hier gedocumenteerd:
[Auth-monitoringscripts](/nl/help/scripts#auth-monitoring-scripts)

## Anthropic-opmerking

De Anthropic `claude-cli`-backend wordt weer ondersteund.

- Anthropic-medewerkers hebben ons verteld dat dit OpenClaw-integratiepad weer is toegestaan.
- OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` daarom als goedgekeurd
  voor runs met Anthropic-backend, tenzij Anthropic een nieuw beleid publiceert.
- Anthropic API-sleutels blijven de meest voorspelbare keuze voor langlevende Gateway-
  hosts en expliciete server-side factureringscontrole.

## Modelauthenticatiestatus controleren

```bash
openclaw models status
openclaw doctor
```

## Gedrag bij API-sleutelrotatie (Gateway)

Sommige providers ondersteunen het opnieuw proberen van een verzoek met alternatieve sleutels wanneer een API-call
een snelheidslimiet van de provider raakt.

- Prioriteitsvolgorde:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-providers nemen ook `GOOGLE_API_KEY` op als extra fallback.
- Dezelfde sleutellijst wordt ontdubbeld vóór gebruik.
- OpenClaw probeert alleen opnieuw met de volgende sleutel voor fouten door snelheidslimieten (bijvoorbeeld
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` of
  `workers_ai ... quota limit exceeded`).
- Fouten die geen snelheidslimietfouten zijn, worden niet opnieuw geprobeerd met alternatieve sleutels.
- Als alle sleutels mislukken, wordt de uiteindelijke fout van de laatste poging geretourneerd.

## Providerauthenticatie verwijderen terwijl de Gateway draait

Wanneer providerauthenticatie via het Gateway-control-plane wordt verwijderd, verwijdert OpenClaw
de opgeslagen authenticatieprofielen voor die provider en breekt actieve chat- of agentruns af
waarvan de geselecteerde modelprovider overeenkomt met de verwijderde provider. De afgebroken runs zenden
de normale chatannulering en lifecycle-events uit met
`stopReason: "auth-revoked"`, zodat verbonden clients kunnen tonen dat de run is
gestopt omdat credentials zijn verwijderd.

Het verwijderen van opgeslagen authenticatie trekt sleutels niet in bij de provider. Roteer of trek de
sleutel in via het providerdashboard wanneer je provider-side ongeldigmaking nodig hebt.

## Bepalen welke credential wordt gebruikt

### OpenAI en verouderde `openai-codex`-id's

OpenAI API-sleutelprofielen en ChatGPT/Codex OAuth-profielen gebruiken allebei de canonieke
provider-id `openai`. Nieuwe config moet `openai:*`-profiel-id's en
`auth.order.openai` gebruiken.

Als je `openai-codex` ziet in oudere config, authenticatieprofiel-id's of
`auth.order.openai-codex`, behandel dit dan als verouderde migratie-invoer. Maak geen nieuwe
`openai-codex`-profielen. Voer uit:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor herschrijft verouderde `openai-codex:*`-profiel-id's en
`auth.order.openai-codex`-vermeldingen naar de canonieke `openai`-authenticatieroute. Zie
[OpenAI](/nl/providers/openai) voor OpenAI-specifieke model-/runtimerouting.

### Tijdens login (CLI)

Gebruik `openclaw models auth login --provider <id> --profile-id <profileId>` voor
providers die benoemde authenticatieprofielen tijdens login ondersteunen.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Dit is de eenvoudigste manier om meerdere OAuth-logins voor dezelfde provider
gescheiden te houden binnen één agent.

Gebruik `--force` wanneer een opgeslagen providerprofiel vastzit, verlopen is of aan het
verkeerde account is gekoppeld en de normale loginopdracht het blijft hergebruiken. `--force` verwijdert
de opgeslagen authenticatieprofielen voor die provider in de geselecteerde agentdirectory en
voert daarna dezelfde providerauthenticatieflow opnieuw uit. Het trekt credentials niet in bij de
provider; roteer of trek ze in via het providerdashboard wanneer je
provider-side ongeldigmaking nodig hebt.

```bash
openclaw models auth login --provider anthropic --force
```

### Per sessie (chatopdracht)

Gebruik `/model <alias-or-id>@<profileId>` om een specifieke providercredential vast te zetten voor de huidige sessie (voorbeeldprofiel-id's: `anthropic:default`, `anthropic:work`).

Gebruik `/model` (of `/model list`) voor een compacte picker; gebruik `/model status` voor de volledige weergave (kandidaten + volgend authenticatieprofiel, plus providerendpointdetails wanneer geconfigureerd).

### Per agent (CLI-override)

Stel een expliciete override voor de volgorde van authenticatieprofielen in voor een agent (opgeslagen in de SQLite-authenticatiestatus van die agent):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gebruik `--agent <id>` om een specifieke agent te targeten; laat dit weg om de geconfigureerde standaardagent te gebruiken.
Wanneer je volgordeproblemen debugt, toont `openclaw models status --probe` weggelaten
opgeslagen profielen als `excluded_by_auth_order` in plaats van ze stilzwijgend over te slaan.
Wanneer je cooldownproblemen debugt, onthoud dan dat cooldowns voor snelheidslimieten gekoppeld kunnen zijn
aan één model-id in plaats van aan het volledige providerprofiel.

Als je de authenticatievolgorde of profielpinning wijzigt voor een chat die al draait,
stuur dan `/new` of `/reset` in die chat om een nieuwe sessie te starten. Bestaande
sessies kunnen hun huidige model-/profielselectie behouden tot reset.

## Probleemoplossing

### "No credentials found"

Als het Anthropic-profiel ontbreekt, configureer dan een Anthropic API-sleutel op de
**Gateway-host** of stel het Anthropic setup-token-pad in en controleer daarna opnieuw:

```bash
openclaw models status
```

### Token verloopt/is verlopen

Voer `openclaw models status` uit om te bevestigen welk profiel verloopt. Als een
Anthropic-tokenprofiel ontbreekt of verlopen is, vernieuw die setup dan via
setup-token of migreer naar een Anthropic API-sleutel.

## Gerelateerd

- [Secrets management](/nl/gateway/secrets)
- [Externe toegang](/nl/gateway/remote)
- [Authenticatieopslag](/nl/concepts/oauth)
