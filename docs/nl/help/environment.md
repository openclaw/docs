---
read_when:
    - Je moet weten welke omgevingsvariabelen worden geladen en in welke volgorde
    - Je debugt ontbrekende API-sleutels in de Gateway
    - Je documenteert provider-authenticatie of implementatieomgevingen
summary: Waar OpenClaw omgevingsvariabelen laadt en de prioriteitsvolgorde
title: Omgevingsvariabelen
x-i18n:
    generated_at: "2026-04-29T22:49:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw haalt omgevingsvariabelen uit meerdere bronnen. De regel is: **overschrijf nooit bestaande waarden**.

## Voorrang (hoogste → laagste)

1. **Procesomgeving** (wat het Gateway-proces al heeft vanuit de bovenliggende shell/daemon).
2. **`.env` in de huidige werkmap** (dotenv-standaard; overschrijft niet).
3. **Globale `.env`** op `~/.openclaw/.env` (ook wel `$OPENCLAW_STATE_DIR/.env`; overschrijft niet).
4. **Configuratie-`env`-blok** in `~/.openclaw/openclaw.json` (alleen toegepast als de waarde ontbreekt).
5. **Optionele import uit login-shell** (`env.shellEnv.enabled` of `OPENCLAW_LOAD_SHELL_ENV=1`), alleen toegepast voor ontbrekende verwachte sleutels.

Bij verse Ubuntu-installaties die de standaard state-map gebruiken, behandelt OpenClaw ook `~/.config/openclaw/gateway.env` als compatibiliteitsfallback na de globale `.env`. Als beide bestanden bestaan en elkaar tegenspreken, behoudt OpenClaw `~/.openclaw/.env` en toont het een waarschuwing.

Als het configuratiebestand volledig ontbreekt, wordt stap 4 overgeslagen; shell-import wordt nog steeds uitgevoerd als die is ingeschakeld.

## Configuratie-`env`-blok

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

## Shell-omgevingsimport

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

Equivalenten als omgevingsvariabele:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Tijdens runtime geïnjecteerde omgevingsvariabelen

OpenClaw injecteert ook contextmarkeringen in gestarte child-processen:

- `OPENCLAW_SHELL=exec`: ingesteld voor opdrachten die via de `exec`-tool worden uitgevoerd.
- `OPENCLAW_SHELL=acp`: ingesteld voor het starten van ACP-runtimebackendprocessen (bijvoorbeeld `acpx`).
- `OPENCLAW_SHELL=acp-client`: ingesteld voor `openclaw acp client` wanneer het het ACP-bridgeproces start.
- `OPENCLAW_SHELL=tui-local`: ingesteld voor lokale TUI-`!`-shellopdrachten.

Dit zijn runtimemarkeringen (geen vereiste gebruikersconfiguratie). Ze kunnen worden gebruikt in shell-/profiellogica
om contextspecifieke regels toe te passen.

## UI-omgevingsvariabelen

- `OPENCLAW_THEME=light`: forceer het lichte TUI-palet wanneer je terminal een lichte achtergrond heeft.
- `OPENCLAW_THEME=dark`: forceer het donkere TUI-palet.
- `COLORFGBG`: als je terminal dit exporteert, gebruikt OpenClaw de hint voor de achtergrondkleur om automatisch het TUI-palet te kiezen.

## Vervanging van omgevingsvariabelen in configuratie

Je kunt rechtstreeks naar omgevingsvariabelen verwijzen in stringwaarden van de configuratie met de syntaxis `${VAR_NAME}`:

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

Zie [Configuratie: vervanging van omgevingsvariabelen](/nl/gateway/configuration-reference#env-var-substitution) voor volledige details.

## Secret refs versus `${ENV}`-strings

OpenClaw ondersteunt twee omgevingsgestuurde patronen:

- `${VAR}`-stringvervanging in configuratiewaarden.
- SecretRef-objecten (`{ source: "env", provider: "default", id: "VAR" }`) voor velden die geheime verwijzingen ondersteunen.

Beide worden tijdens activering vanuit de procesomgeving omgezet. Details over SecretRef zijn gedocumenteerd in [Geheimenbeheer](/nl/gateway/secrets).

## Padgerelateerde omgevingsvariabelen

| Variabele              | Doel                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`        | Overschrijf de thuismap die wordt gebruikt voor alle interne padresolutie (`~/.openclaw/`, agentmappen, sessies, inloggegevens). Handig wanneer OpenClaw als toegewezen servicegebruiker draait. |
| `OPENCLAW_STATE_DIR`   | Overschrijf de state-map (standaard `~/.openclaw`).                                                                                                                                          |
| `OPENCLAW_CONFIG_PATH` | Overschrijf het pad naar het configuratiebestand (standaard `~/.openclaw/openclaw.json`).                                                                                                   |

## Logging

| Variabele             | Doel                                                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Overschrijf het logniveau voor zowel bestand als console (bijv. `debug`, `trace`). Heeft voorrang op `logging.level` en `logging.consoleLevel` in de configuratie. Ongeldige waarden worden genegeerd met een waarschuwing. |

### `OPENCLAW_HOME`

Wanneer ingesteld, vervangt `OPENCLAW_HOME` de systeemthuismap (`$HOME` / `os.homedir()`) voor alle interne padresolutie. Dit maakt volledige bestandssysteemisolatie mogelijk voor headless serviceaccounts.

**Voorrang:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

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

Als Node.js is geïnstalleerd via **nvm** (niet via de systeempakketbeheerder), gebruikt de ingebouwde `fetch()`
de meegeleverde CA-store van nvm, waarin moderne root-CA's kunnen ontbreken (ISRG Root X1/X2 voor Let's Encrypt,
DigiCert Global Root G2, enz.). Hierdoor faalt `web_fetch` met `"fetch failed"` op de meeste HTTPS-sites.

Op Linux detecteert OpenClaw nvm automatisch en past het de fix toe in de daadwerkelijke opstartomgeving:

- `openclaw gateway install` schrijft `NODE_EXTRA_CA_CERTS` naar de systemd-serviceomgeving
- het `openclaw`-CLI-entrypoint voert zichzelf opnieuw uit met `NODE_EXTRA_CA_CERTS` ingesteld vóór het starten van Node

**Handmatige fix (voor oudere versies of directe `node ...`-starts):**

Exporteer de variabele voordat je OpenClaw start:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Vertrouw er niet op dat je deze variabele alleen naar `~/.openclaw/.env` schrijft; Node leest
`NODE_EXTRA_CA_CERTS` bij het opstarten van het proces.

## Verouderde omgevingsvariabelen

OpenClaw leest alleen `OPENCLAW_*`-omgevingsvariabelen. De verouderde
`CLAWDBOT_*`- en `MOLTBOT_*`-prefixen uit eerdere releases worden stilzwijgend
genegeerd.

Als er bij het opstarten nog een of meer op het Gateway-proces zijn ingesteld, geeft OpenClaw een
enkele Node-deprecatiewaarschuwing (`OPENCLAW_LEGACY_ENV_VARS`) die de
gedetecteerde prefixen en het totale aantal vermeldt. Hernoem elke waarde door de
verouderde prefix te vervangen door `OPENCLAW_` (bijvoorbeeld `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); de oude namen hebben geen effect.

## Gerelateerd

- [Gateway-configuratie](/nl/gateway/configuration)
- [FAQ: omgevingsvariabelen en .env laden](/nl/help/faq#env-vars-and-env-loading)
- [Modellenoverzicht](/nl/concepts/models)
