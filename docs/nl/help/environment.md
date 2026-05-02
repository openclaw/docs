---
read_when:
    - Je moet weten welke omgevingsvariabelen worden geladen en in welke volgorde
    - Je debugt ontbrekende API-sleutels in de Gateway
    - Je documenteert authenticatie voor providers of uitrolomgevingen
summary: Waar OpenClaw omgevingsvariabelen laadt en in welke prioriteitsvolgorde
title: Omgevingsvariabelen
x-i18n:
    generated_at: "2026-05-02T11:18:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw haalt omgevingsvariabelen uit meerdere bronnen. De regel is: **overschrijf nooit bestaande waarden**.

## Prioriteit (hoogste → laagste)

1. **Procesomgeving** (wat het Gateway-proces al heeft van de bovenliggende shell/daemon).
2. **`.env` in de huidige werkmap** (dotenv-standaard; overschrijft niet).
3. **Globale `.env`** op `~/.openclaw/.env` (oftewel `$OPENCLAW_STATE_DIR/.env`; overschrijft niet).
4. **Config-`env`-blok** in `~/.openclaw/openclaw.json` (alleen toegepast als het ontbreekt).
5. **Optionele login-shellimport** (`env.shellEnv.enabled` of `OPENCLAW_LOAD_SHELL_ENV=1`), alleen toegepast voor ontbrekende verwachte sleutels.

Bij nieuwe Ubuntu-installaties die de standaard statusmap gebruiken, behandelt OpenClaw ook `~/.config/openclaw/gateway.env` als compatibiliteitsfallback na de globale `.env`. Als beide bestanden bestaan en van elkaar verschillen, behoudt OpenClaw `~/.openclaw/.env` en toont het een waarschuwing.

Als het configbestand helemaal ontbreekt, wordt stap 4 overgeslagen; shellimport wordt nog steeds uitgevoerd als die is ingeschakeld.

## Config-`env`-blok

Twee equivalente manieren om inline omgevingsvariabelen in te stellen (beide overschrijven niet):

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

## Shell-env importeren

`env.shellEnv` voert je login-shell uit en importeert alleen **ontbrekende** verwachte sleutels:

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

Equivalenten als omgevingsvariabelen:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Tijdens runtime geïnjecteerde omgevingsvariabelen

OpenClaw injecteert ook contextmarkeringen in gestarte kindprocessen:

- `OPENCLAW_SHELL=exec`: ingesteld voor opdrachten die via de `exec`-tool worden uitgevoerd.
- `OPENCLAW_SHELL=acp`: ingesteld voor processtarts van de ACP-runtimebackend (bijvoorbeeld `acpx`).
- `OPENCLAW_SHELL=acp-client`: ingesteld voor `openclaw acp client` wanneer dit het ACP-bridgeproces start.
- `OPENCLAW_SHELL=tui-local`: ingesteld voor lokale TUI-`!`-shellopdrachten.

Dit zijn runtimemarkeringen (geen vereiste gebruikersconfiguratie). Ze kunnen worden gebruikt in shell-/profiel-logica
om contextspecifieke regels toe te passen.

## UI-omgevingsvariabelen

- `OPENCLAW_THEME=light`: forceer het lichte TUI-palet wanneer je terminal een lichte achtergrond heeft.
- `OPENCLAW_THEME=dark`: forceer het donkere TUI-palet.
- `COLORFGBG`: als je terminal dit exporteert, gebruikt OpenClaw de hint voor de achtergrondkleur om het TUI-palet automatisch te kiezen.

## Vervanging van omgevingsvariabelen in config

Je kunt rechtstreeks naar omgevingsvariabelen verwijzen in stringwaarden van de config met de syntaxis `${VAR_NAME}`:

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

## Geheime refs versus `${ENV}`-strings

OpenClaw ondersteunt twee patronen op basis van omgevingsvariabelen:

- `${VAR}`-stringvervanging in configwaarden.
- SecretRef-objecten (`{ source: "env", provider: "default", id: "VAR" }`) voor velden die verwijzingen naar secrets ondersteunen.

Beide worden tijdens activatie vanuit de procesomgeving opgelost. Details over SecretRef zijn gedocumenteerd in [Secrets-beheer](/nl/gateway/secrets).

## Padgerelateerde omgevingsvariabelen

| Variabele                | Doel                                                                                                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Overschrijf de home-directory die wordt gebruikt voor alle interne padresolutie (`~/.openclaw/`, agentmappen, sessies, credentials). Nuttig wanneer OpenClaw als een speciale servicegebruiker wordt uitgevoerd.              |
| `OPENCLAW_STATE_DIR`     | Overschrijf de statusmap (standaard `~/.openclaw`).                                                                                                                                                                          |
| `OPENCLAW_CONFIG_PATH`   | Overschrijf het pad naar het configbestand (standaard `~/.openclaw/openclaw.json`).                                                                                                                                          |
| `OPENCLAW_INCLUDE_ROOTS` | Padlijst van mappen waar `$include`-directieven bestanden buiten de configmap mogen oplossen (standaard: geen — `$include` is beperkt tot de configmap). Tilde wordt uitgebreid.                                             |

## Logboekregistratie

| Variabele             | Doel                                                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Overschrijf het logniveau voor zowel bestand als console (bijv. `debug`, `trace`). Heeft prioriteit boven `logging.level` en `logging.consoleLevel` in de config. Ongeldige waarden worden genegeerd met een waarschuwing. |

### `OPENCLAW_HOME`

Wanneer dit is ingesteld, vervangt `OPENCLAW_HOME` de systeem-home-directory (`$HOME` / `os.homedir()`) voor alle interne padresolutie. Dit maakt volledige bestandssysteemisolatie mogelijk voor headless serviceaccounts.

**Prioriteit:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Voorbeeld** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kan ook worden ingesteld op een tildepad (bijv. `~/svc`), dat vóór gebruik wordt uitgebreid met `$HOME`.

## nvm-gebruikers: TLS-fouten met web_fetch

Als Node.js is geïnstalleerd via **nvm** (niet via de pakketbeheerder van het systeem), gebruikt de ingebouwde `fetch()`
de gebundelde CA-store van nvm, waarin moderne root-CA's kunnen ontbreken (ISRG Root X1/X2 voor Let's Encrypt,
DigiCert Global Root G2, enz.). Hierdoor mislukt `web_fetch` met `"fetch failed"` op de meeste HTTPS-sites.

Op Linux detecteert OpenClaw nvm automatisch en past het de oplossing toe in de daadwerkelijke opstartomgeving:

- `openclaw gateway install` schrijft `NODE_EXTRA_CA_CERTS` naar de systemd-serviceomgeving
- het `openclaw` CLI-entrypoint voert zichzelf opnieuw uit met `NODE_EXTRA_CA_CERTS` ingesteld vóór het opstarten van Node

**Handmatige oplossing (voor oudere versies of directe `node ...`-starts):**

Exporteer de variabele voordat je OpenClaw start:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Vertrouw er voor deze variabele niet op dat je alleen naar `~/.openclaw/.env` schrijft; Node leest
`NODE_EXTRA_CA_CERTS` bij het opstarten van het proces.

## Verouderde omgevingsvariabelen

OpenClaw leest alleen `OPENCLAW_*`-omgevingsvariabelen. De verouderde
`CLAWDBOT_*`- en `MOLTBOT_*`-prefixen uit eerdere releases worden stilzwijgend
genegeerd.

Als er bij het opstarten nog variabelen op het Gateway-proces zijn ingesteld, geeft OpenClaw één
Node-deprecationwaarschuwing (`OPENCLAW_LEGACY_ENV_VARS`) met de gedetecteerde
prefixen en het totale aantal. Hernoem elke waarde door de verouderde prefix te vervangen door
`OPENCLAW_` (bijvoorbeeld `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); de oude namen hebben geen effect.

## Gerelateerd

- [Gateway-configuratie](/nl/gateway/configuration)
- [FAQ: omgevingsvariabelen en .env laden](/nl/help/faq#env-vars-and-env-loading)
- [Modeloverzicht](/nl/concepts/models)
