---
read_when:
    - U moet weten welke omgevingsvariabelen worden geladen en in welke volgorde
    - Je spoort ontbrekende API-sleutels in de Gateway op
    - U documenteert providerauthenticatie of implementatieomgevingen
summary: Waar OpenClaw omgevingsvariabelen laadt en wat de voorrangsvolgorde is
title: Omgevingsvariabelen
x-i18n:
    generated_at: "2026-07-12T08:59:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw haalt omgevingsvariabelen uit meerdere bronnen. De regel is: **bestaande waarden nooit overschrijven**.
`.env`-bestanden in de werkruimte zijn een bron met een lager vertrouwensniveau: OpenClaw negeert providerreferenties en beveiligde runtimebesturingselementen uit de `.env` van de werkruimte voordat de prioriteitsvolgorde wordt toegepast.

## Prioriteitsvolgorde (van hoog naar laag)

1. **Procesomgeving** (wat het Gateway-proces al van de bovenliggende shell/daemon heeft).
2. **`.env` in de huidige werkmap** (standaardgedrag van dotenv; overschrijft niet; providerreferenties en beveiligde runtimebesturingselementen worden genegeerd).
3. **Globale `.env`** op `~/.openclaw/.env` (ook wel `$OPENCLAW_STATE_DIR/.env`; aanbevolen voor API-sleutels van providers; overschrijft niet).
4. **Configuratieblok `env`** in `~/.openclaw/openclaw.json` (alleen toegepast als de waarde ontbreekt).
5. **Optionele import uit de aanmeldingsshell** (`env.shellEnv.enabled` of `OPENCLAW_LOAD_SHELL_ENV=1`), alleen toegepast voor ontbrekende verwachte sleutels.

Bij nieuwe Ubuntu-installaties die de standaardstatusmap gebruiken, behandelt OpenClaw `~/.config/openclaw/gateway.env` ook als compatibiliteitsterugval na de globale `.env`. Als beide bestanden bestaan en elkaar tegenspreken, behoudt OpenClaw `~/.openclaw/.env` en wordt een waarschuwing weergegeven.

Als het configuratiebestand volledig ontbreekt, wordt stap 4 overgeslagen; de shellimport wordt nog steeds uitgevoerd als die is ingeschakeld.

## Providerreferenties en `.env` van de werkruimte

Bewaar API-sleutels van providers niet uitsluitend in een `.env` van de werkruimte. OpenClaw blokkeert een groot aantal providerreferentie- en eindpuntomleidingssleutels uit `.env`-bestanden van de werkruimte, waaronder elke bekende omgevingsvariabele voor providerauthenticatie (bijvoorbeeld `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), plus elke sleutel die eindigt op `_API_HOST`, `_BASE_URL` of `_HOMESERVER`, en de volledige naamruimten `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` en `OPENAI_API_KEY_*`.

Gebruik in plaats daarvan een van deze vertrouwde bronnen voor providerreferenties:

- De procesomgeving van de Gateway, zoals een shell, launchd-/systemd-eenheid, containergeheim of CI-geheim.
- Het globale dotenv-runtimebestand op `~/.openclaw/.env` of `$OPENCLAW_STATE_DIR/.env`.
- Het configuratieblok `env` in `~/.openclaw/openclaw.json`.
- Optionele import uit de aanmeldingsshell wanneer `env.shellEnv.enabled` of `OPENCLAW_LOAD_SHELL_ENV=1` is ingeschakeld.

Als u eerder providersleutels uitsluitend in een `.env` van de werkruimte hebt opgeslagen, verplaatst u deze naar een van de bovenstaande vertrouwde bronnen. De `.env` van de werkruimte kan nog steeds gewone projectvariabelen leveren die geen referenties, eindpuntomleidingen, hostoverschrijvingen of `OPENCLAW_*`-runtimebesturingselementen zijn.

Zie [`.env`-bestanden van de werkruimte](/nl/gateway/security#workspace-env-files) voor de beveiligingsredenering.

## Configuratieblok `env`

Twee gelijkwaardige manieren om inline-omgevingsvariabelen in te stellen (beide overschrijven niet):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

Het configuratieblok `env` accepteert uitsluitend letterlijke tekenreekswaarden. Het vouwt
`file:...`-waarden niet uit; `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
wordt bijvoorbeeld als exact die tekenreeks aan providers doorgegeven.

Gebruik voor providersleutels uit bestanden een SecretRef in het referentieveld dat
dit ondersteunt:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Zie [Geheimenbeheer](/nl/gateway/secrets) en het
[SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface) voor
ondersteunde velden.

## Import van shellomgevingsvariabelen

`env.shellEnv` voert uw aanmeldingsshell uit en importeert uitsluitend **ontbrekende** verwachte sleutels:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Gelijkwaardige omgevingsvariabelen:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (standaard `15000`)

## Momentopnamen van de uitvoeringsshell

Op niet-Windows-Gateway-hosts gebruiken bash- en zsh-`exec`-opdrachten standaard een momentopname bij het opstarten.
Stel `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in de procesomgeving van de Gateway in om dit pad uit te schakelen.
De waarden `false`, `no` en `off` schakelen het ook uit. `exec.env`-waarden per aanroep kunnen
momentopnamen niet in- of uitschakelen en kunnen de cache voor momentopnamen niet omleiden.

## Tijdens runtime geïnjecteerde omgevingsvariabelen

OpenClaw injecteert ook contextmarkeringen in gestarte onderliggende processen:

- `OPENCLAW_SHELL=exec`: ingesteld voor opdrachten die via het hulpmiddel `exec` worden uitgevoerd.
- `OPENCLAW_SHELL=acp-client`: ingesteld voor `openclaw acp client` wanneer deze het ACP-brugproces start.
- `OPENCLAW_SHELL=tui-local`: ingesteld voor lokale TUI-`!`-shellopdrachten.
- `OPENCLAW_CLI=1`: ingesteld voor onderliggende processen die door het CLI-invoerpunt worden gestart.

Dit zijn runtimemarkeringen (geen vereiste gebruikersconfiguratie). Ze kunnen in shell-/profiellogica worden gebruikt
om contextspecifieke regels toe te passen.

## Omgevingsvariabelen voor de gebruikersinterface

- `OPENCLAW_THEME=light`: dwing het lichte TUI-palet af wanneer uw terminal een lichte achtergrond heeft.
- `OPENCLAW_THEME=dark`: dwing het donkere TUI-palet af.
- `COLORFGBG`: als uw terminal deze variabele exporteert, gebruikt OpenClaw de aanwijzing voor de achtergrondkleur om automatisch het TUI-palet te kiezen.

## Vervanging van omgevingsvariabelen in de configuratie

U kunt rechtstreeks naar omgevingsvariabelen verwijzen in tekenreekswaarden van de configuratie met de syntaxis `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Zie [Configuratie: vervanging van omgevingsvariabelen](/nl/gateway/configuration-reference#env-var-substitution) voor alle details.

## Geheimverwijzingen versus `${ENV}`-tekenreeksen

OpenClaw ondersteunt twee omgevingsgestuurde patronen:

- Vervanging van `${VAR}`-tekenreeksen in configuratiewaarden.
- SecretRef-objecten (`{ source: "env", provider: "default", id: "VAR" }`) voor velden die geheimverwijzingen ondersteunen.

Beide worden tijdens activering vanuit de procesomgeving omgezet. Details over SecretRef zijn gedocumenteerd in [Geheimenbeheer](/nl/gateway/secrets).
Het configuratieblok `env` zelf zet geen SecretRefs of verkorte `file:...`-waarden om.

## Padgerelateerde omgevingsvariabelen

| Variabele                | Doel                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Overschrijft de basismap die wordt gebruikt voor interne standaardpaden van OpenClaw (`~/.openclaw/`, agentmappen, sessies, referenties, onboarding van het installatieprogramma en de standaardontwikkelcheckout). Nuttig wanneer OpenClaw als een specifieke servicegebruiker wordt uitgevoerd. |
| `OPENCLAW_STATE_DIR`     | Overschrijft de statusmap (standaard `~/.openclaw`).                                                                                                                                                                                                        |
| `OPENCLAW_CONFIG_PATH`   | Overschrijft het pad van het configuratiebestand (standaard `~/.openclaw/openclaw.json`).                                                                                                                                                                   |
| `OPENCLAW_INCLUDE_ROOTS` | Lijst met mappaden waar `$include`-instructies bestanden buiten de configuratiemap mogen omzetten (standaard: geen — `$include` is beperkt tot de configuratiemap). Tildes worden uitgevouwen.                                                               |

## Logboekregistratie

| Variabele                         | Doel                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Overschrijft het logniveau voor zowel bestand als console (bijvoorbeeld `debug`, `trace`). Heeft voorrang op `logging.level` en `logging.consoleLevel` in de configuratie. Ongeldige waarden worden met een waarschuwing genegeerd. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Geeft gerichte diagnostiek over de timing van modelverzoeken en -antwoorden op niveau `info`, zonder globale foutopsporingslogboeken in te schakelen.                                                                               |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostiek van modelpayloads: `summary`, `tools` of `full-redacted`. `full-redacted` is begrensd en geredigeerd, maar kan prompt-/berichttekst bevatten.                                                                          |
| `OPENCLAW_DEBUG_SSE`             | Streamingdiagnostiek: `events` voor timing van het eerste/voltooide evenement, `peek` om de eerste vijf geredigeerde SSE-evenementen op te nemen.                                                                                  |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostiek van het modeloppervlak in codemodus, waaronder het verbergen van providerhulpmiddelen en compacte afdwinging van besturing/directe instructies.                                                                        |

### `OPENCLAW_HOME`

Wanneer `OPENCLAW_HOME` is ingesteld, vervangt deze de basismap van het systeem (`$HOME` / `os.homedir()`) voor interne standaardpaden van OpenClaw. Dit omvat de standaardstatusmap, het configuratiepad, agentmappen, referenties, de onboardingwerkruimte van het installatieprogramma en de standaardontwikkelcheckout die wordt gebruikt door `openclaw update --channel dev`.

**Prioriteit:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Termux-`PREFIX`-terugval voor de basismap op Android > `os.homedir()`

**Voorbeeld** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kan ook op een tildepad worden ingesteld (bijvoorbeeld `~/svc`), dat vóór gebruik wordt uitgevouwen met dezelfde terugvalketen voor de basismap van het besturingssysteem.

Expliciete padvariabelen zoals `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` en `OPENCLAW_GIT_DIR` behouden voorrang. Taken voor het besturingssysteemaccount, zoals detectie van opstartbestanden van de shell, configuratie van pakketbeheerders en uitbreiding van `~` op de host, kunnen nog steeds de werkelijke basismap van het systeem gebruiken.

## nvm-gebruikers: TLS-fouten van web_fetch

Als Node.js via **nvm** is geïnstalleerd (niet via de systeempakketbeheerder), gebruikt de ingebouwde `fetch()`
de gebundelde CA-opslag van nvm, waarin moderne basis-CA's kunnen ontbreken (ISRG Root X1/X2 voor Let's Encrypt,
DigiCert Global Root G2 enzovoort). Hierdoor mislukt `web_fetch` op de meeste HTTPS-sites met `"fetch failed"`.

Op Linux detecteert OpenClaw nvm automatisch en past het de oplossing toe in de daadwerkelijke opstartomgeving:

- `openclaw gateway install` schrijft `NODE_EXTRA_CA_CERTS` naar de omgeving van de systemd-service
- het CLI-invoerpunt `openclaw` voert zichzelf vóór het opstarten van Node opnieuw uit met `NODE_EXTRA_CA_CERTS` ingesteld

**Handmatige oplossing (voor oudere versies of directe starts met `node ...`):**

Exporteer de variabele voordat u OpenClaw start:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Vertrouw er voor deze variabele niet op dat u deze uitsluitend naar `~/.openclaw/.env` schrijft; Node leest
`NODE_EXTRA_CA_CERTS` bij het opstarten van het proces.

## Verouderde omgevingsvariabelen

OpenClaw leest uitsluitend `OPENCLAW_*`-omgevingsvariabelen. De verouderde
voorvoegsels `CLAWDBOT_*` en `MOLTBOT_*` uit eerdere releases worden stilzwijgend
genegeerd.

Als er bij het opstarten nog zulke variabelen voor het Gateway-proces zijn ingesteld, geeft OpenClaw
één Node-verouderingswaarschuwing (`OPENCLAW_LEGACY_ENV_VARS`) weer met de
gedetecteerde voorvoegsels en het totale aantal. Hernoem elke waarde door het
verouderde voorvoegsel te vervangen door `OPENCLAW_` (bijvoorbeeld `CLAWDBOT_GATEWAY_TOKEN` naar
`OPENCLAW_GATEWAY_TOKEN`); de oude namen hebben geen effect.

## Gerelateerd

- [Gateway-configuratie](/nl/gateway/configuration)
- [Veelgestelde vragen: omgevingsvariabelen en het laden van .env](/nl/help/faq#env-vars-and-env-loading)
- [Overzicht van modellen](/nl/concepts/models)
