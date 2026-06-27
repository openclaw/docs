---
read_when:
    - Je moet weten welke env vars worden geladen, en in welke volgorde
    - Je debugt ontbrekende API-sleutels in de Gateway
    - Je documenteert provider-authenticatie of implementatieomgevingen
summary: Waar OpenClaw omgevingsvariabelen laadt en de prioriteitsvolgorde
title: Omgevingsvariabelen
x-i18n:
    generated_at: "2026-06-27T17:39:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw haalt omgevingsvariabelen uit meerdere bronnen. De regel is: **overschrijf nooit bestaande waarden**.
Workspace-`.env`-bestanden zijn een bron met lager vertrouwen: OpenClaw negeert providerreferenties en beschermde runtime-instellingen uit workspace-`.env` voordat de voorrang wordt toegepast.

## Voorrang (hoogste → laagste)

1. **Procesomgeving** (wat het Gateway-proces al heeft van de bovenliggende shell/daemon).
2. **`.env` in de huidige werkdirectory** (dotenv-standaard; overschrijft niet; providerreferenties en beschermde runtime-instellingen worden genegeerd).
3. **Globale `.env`** op `~/.openclaw/.env` (ook bekend als `$OPENCLAW_STATE_DIR/.env`; aanbevolen voor provider-API-sleutels; overschrijft niet).
4. **Config-`env`-blok** in `~/.openclaw/openclaw.json` (alleen toegepast als de waarde ontbreekt).
5. **Optionele login-shell-import** (`env.shellEnv.enabled` of `OPENCLAW_LOAD_SHELL_ENV=1`), alleen toegepast voor ontbrekende verwachte sleutels.

Op verse Ubuntu-installaties die de standaard state-dir gebruiken, behandelt OpenClaw ook `~/.config/openclaw/gateway.env` als compatibiliteitsfallback na de globale `.env`. Als beide bestanden bestaan en elkaar tegenspreken, behoudt OpenClaw `~/.openclaw/.env` en toont het een waarschuwing.

Als het configuratiebestand volledig ontbreekt, wordt stap 4 overgeslagen; shell-import wordt nog steeds uitgevoerd als deze is ingeschakeld.

## Providerreferenties en workspace-`.env`

Bewaar provider-API-sleutels niet alleen in een workspace-`.env`. OpenClaw negeert providerreferentie-omgevingsvariabelen uit workspace-`.env`-bestanden, inclusief gangbare sleutels zoals `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY` en `FIRECRAWL_API_KEY`.

Gebruik een van deze vertrouwde bronnen voor providerreferenties:

- De Gateway-procesomgeving, zoals een shell, launchd/systemd-unit, container secret of CI secret.
- Het globale runtime-dotenv-bestand op `~/.openclaw/.env` of `$OPENCLAW_STATE_DIR/.env`.
- Het config-`env`-blok in `~/.openclaw/openclaw.json`.
- Optionele login-shell-import wanneer `env.shellEnv.enabled` of `OPENCLAW_LOAD_SHELL_ENV=1` is ingeschakeld.

Als je provider-sleutels eerder alleen in een workspace-`.env` hebt opgeslagen, verplaats ze dan naar een van de vertrouwde bronnen hierboven. Workspace-`.env` kan nog steeds gewone projectvariabelen leveren die geen referenties, endpoint-omleidingen, host-overschrijvingen of `OPENCLAW_*`-runtime-instellingen zijn.

Zie [Workspace-`.env`-bestanden](/nl/gateway/security#workspace-env-files) voor de beveiligingsreden.

## Config-`env`-blok

Twee equivalente manieren om inline env-vars in te stellen (beide overschrijven niet):

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

Het config-`env`-blok accepteert alleen letterlijke stringwaarden. Het breidt
`file:...`-waarden niet uit; bijvoorbeeld `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
wordt precies als die string doorgegeven aan providers.

Gebruik voor provider-sleutels die door bestanden worden ondersteund een SecretRef op het referentieveld dat
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

Zie [Secrets-beheer](/nl/gateway/secrets) en het
[SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface) voor
ondersteunde velden.

## Shell-env-import

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

Equivalenten als env-var:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Exec-shell-snapshots

Op niet-Windows Gateway-hosts gebruiken bash- en zsh-`exec`-opdrachten standaard een opstartsnapshot.
Stel `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in de Gateway-procesomgeving in om dit pad uit te schakelen.
Waarden `false`, `no` en `off` schakelen het ook uit. Per-aanroep-`exec.env`-waarden kunnen
snapshots niet omschakelen of de snapshotcache omleiden.

## Door runtime geïnjecteerde env-vars

OpenClaw injecteert ook contextmarkeringen in gestarte childprocessen:

- `OPENCLAW_SHELL=exec`: ingesteld voor opdrachten die via de `exec`-tool worden uitgevoerd.
- `OPENCLAW_SHELL=acp`: ingesteld voor ACP-runtime-backendprocesstarts (bijvoorbeeld `acpx`).
- `OPENCLAW_SHELL=acp-client`: ingesteld voor `openclaw acp client` wanneer het het ACP-bridgeproces start.
- `OPENCLAW_SHELL=tui-local`: ingesteld voor lokale TUI-`!`-shellopdrachten.
- `OPENCLAW_CLI=1`: ingesteld voor childprocessen die door het CLI-entrypoint worden gestart.

Dit zijn runtimemarkeringen (geen vereiste gebruikersconfiguratie). Ze kunnen worden gebruikt in shell-/profiellogica
om contextspecifieke regels toe te passen.

## UI-env-vars

- `OPENCLAW_THEME=light`: forceer het lichte TUI-palet wanneer je terminal een lichte achtergrond heeft.
- `OPENCLAW_THEME=dark`: forceer het donkere TUI-palet.
- `COLORFGBG`: als je terminal dit exporteert, gebruikt OpenClaw de achtergrondkleurhint om automatisch het TUI-palet te kiezen.

## Env-var-substitutie in config

Je kunt direct naar env-vars verwijzen in config-stringwaarden met de `${VAR_NAME}`-syntaxis:

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

Zie [Configuratie: env-var-substitutie](/nl/gateway/configuration-reference#env-var-substitution) voor volledige details.

## Secret refs versus `${ENV}`-strings

OpenClaw ondersteunt twee env-gestuurde patronen:

- `${VAR}`-stringsubstitutie in configwaarden.
- SecretRef-objecten (`{ source: "env", provider: "default", id: "VAR" }`) voor velden die secret-referenties ondersteunen.

Beide worden bij activatie opgelost vanuit de procesomgeving. SecretRef-details zijn gedocumenteerd in [Secrets-beheer](/nl/gateway/secrets).
Het config-`env`-blok zelf lost geen SecretRefs of `file:...`-
stenowaarden op.

## Padgerelateerde env-vars

| Variabele                | Doel                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Overschrijf de homedirectory die wordt gebruikt voor interne OpenClaw-padstandaarden (`~/.openclaw/`, agentdirs, sessies, referenties, installer-onboarding en de standaard dev-checkout). Nuttig wanneer OpenClaw als toegewijde servicegebruiker draait. |
| `OPENCLAW_STATE_DIR`     | Overschrijf de state-directory (standaard `~/.openclaw`).                                                                                                                                                                         |
| `OPENCLAW_CONFIG_PATH`   | Overschrijf het pad naar het configuratiebestand (standaard `~/.openclaw/openclaw.json`).                                                                                                                                         |
| `OPENCLAW_INCLUDE_ROOTS` | Padlijst van directories waar `$include`-directieven bestanden buiten de configdirectory mogen oplossen (standaard: geen — `$include` is beperkt tot de configdir). Tilde wordt uitgebreid.                                      |

## Logging

| Variabele                        | Doel                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Overschrijf het logniveau voor zowel bestand als console (bijv. `debug`, `trace`). Heeft voorrang op `logging.level` en `logging.consoleLevel` in config. Ongeldige waarden worden genegeerd met een waarschuwing. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Geef gerichte timingdiagnostiek voor modelverzoeken/-antwoorden op `info`-niveau zonder globale debuglogs in te schakelen.                                                                        |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Modelpayloaddiagnostiek: `summary`, `tools` of `full-redacted`. `full-redacted` is begrensd en geredigeerd, maar kan prompt-/berichttekst bevatten.                                               |
| `OPENCLAW_DEBUG_SSE`             | Streamingdiagnostiek: `events` voor first/done-timing, `peek` om de eerste vijf geredigeerde SSE-events op te nemen.                                                                              |
| `OPENCLAW_DEBUG_CODE_MODE`       | Code-mode-modeloppervlakdiagnostiek, inclusief verbergen van provider-tools en afdwinging van alleen exec/wait.                                                                                   |

### `OPENCLAW_HOME`

Wanneer ingesteld, vervangt `OPENCLAW_HOME` de systeemhomedirectory (`$HOME` / `os.homedir()`) voor interne OpenClaw-padstandaarden. Dit omvat de standaard state-directory, het configuratiepad, agentdirectories, referenties, installer-onboardingworkspace en de standaard dev-checkout die wordt gebruikt door `openclaw update --channel dev`.

**Voorrang:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Termux `PREFIX`-homefallback op Android > `os.homedir()`

**Voorbeeld** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kan ook worden ingesteld op een tildepad (bijv. `~/svc`), dat vóór gebruik wordt uitgebreid met dezelfde OS-homefallbackketen.

Expliciete padvariabelen zoals `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` en `OPENCLAW_GIT_DIR` hebben nog steeds voorrang. OS-accounttaken zoals detectie van shell-opstartbestanden, package-manager-setup en host-`~`-uitbreiding kunnen nog steeds de echte systeemhome gebruiken.

## nvm-gebruikers: web_fetch TLS-fouten

Als Node.js is geïnstalleerd via **nvm** (niet via de systeempakketbeheerder), gebruikt de ingebouwde `fetch()`
de gebundelde CA-store van nvm, waarin moderne root-CA's kunnen ontbreken (ISRG Root X1/X2 voor Let's Encrypt,
DigiCert Global Root G2, enz.). Daardoor faalt `web_fetch` op de meeste HTTPS-sites met `"fetch failed"`.

Op Linux detecteert OpenClaw nvm automatisch en past het de fix toe in de daadwerkelijke opstartomgeving:

- `openclaw gateway install` schrijft `NODE_EXTRA_CA_CERTS` naar de systemd-serviceomgeving
- het `openclaw`-CLI-entrypoint voert zichzelf opnieuw uit met `NODE_EXTRA_CA_CERTS` ingesteld vóór het opstarten van Node

**Handmatige fix (voor oudere versies of directe `node ...`-starts):**

Exporteer de variabele voordat je OpenClaw start:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Vertrouw voor deze variabele niet op alleen schrijven naar `~/.openclaw/.env`; Node leest
`NODE_EXTRA_CA_CERTS` bij het opstarten van het proces.

## Legacy-omgevingsvariabelen

OpenClaw leest alleen `OPENCLAW_*`-omgevingsvariabelen. De legacy-
`CLAWDBOT_*`- en `MOLTBOT_*`-prefixen uit eerdere releases worden stilzwijgend
genegeerd.

Als er bij het opstarten nog steeds een van deze op het Gateway-proces is ingesteld, geeft OpenClaw een
enkele Node-deprecationwaarschuwing (`OPENCLAW_LEGACY_ENV_VARS`) die de
gedetecteerde prefixen en het totale aantal vermeldt. Hernoem elke waarde door het
legacy-prefix te vervangen door `OPENCLAW_` (bijvoorbeeld `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); de oude namen hebben geen effect.

## Gerelateerd

- [Gateway-configuratie](/nl/gateway/configuration)
- [FAQ: env-vars en .env laden](/nl/help/faq#env-vars-and-env-loading)
- [Modellenoverzicht](/nl/concepts/models)
