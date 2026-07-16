---
read_when:
    - Een specifieke onboardingstap of vlag opzoeken
    - Onboarding automatiseren met de niet-interactieve modus
    - Onboardinggedrag debuggen
sidebarTitle: Onboarding Reference
summary: 'Volledig naslagwerk voor onboarding via de CLI: elke stap, vlag en elk configuratieveld'
title: Referentie voor onboarding
x-i18n:
    generated_at: "2026-07-16T16:33:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Dit is de volledige referentie voor `openclaw onboard`.
Zie [Onboarding (CLI)](/nl/start/wizard) voor een overzicht op hoofdlijnen. Zie voor stapsgewijs
gedrag en uitvoer de [CLI-installatiereferentie](/nl/start/wizard-cli-reference).

## Details van het proces (lokale modus)

<Steps>
  <Step title="Opnieuw instellen (optioneel)">
    - `--reset` stelt de status opnieuw in voordat de installatie wordt uitgevoerd; zonder deze optie behoudt het opnieuw uitvoeren van de onboarding
      de bestaande configuratie en hergebruikt die als standaardwaarden.
    - `--reset-scope` bepaalt wat `--reset` verwijdert: `config` (alleen het configuratiebestand
      ), `config+creds+sessions` (standaard), of `full` (verwijdert ook de
      werkruimte).
    - Als het configuratiebestand ongeldig is, stopt de onboarding en krijg je de instructie om eerst
      `openclaw doctor` uit te voeren en daarna de installatie opnieuw uit te voeren.
    - Bij opnieuw instellen wordt de status naar de prullenmand verplaatst (nooit rechtstreeks verwijderd).

  </Step>
  <Step title="Risico's bevestigen">
    - Bij de eerste uitvoering (of elke uitvoering voordat `wizard.securityAcknowledgedAt` is ingesteld)
      wordt je gevraagd te bevestigen dat je begrijpt dat agents krachtig zijn en dat volledige
      systeemtoegang riskant is.
    - `--non-interactive` vereist expliciet `--accept-risk`; zonder deze optie
      wordt de onboarding met een fout afgesloten in plaats van om invoer te vragen.
    - Bij interactieve uitvoeringen verschijnt een bevestigingsvraag in plaats van de vlag; als je weigert,
      wordt de installatie geannuleerd.

  </Step>
  <Step title="Model/authenticatie">
    - **Anthropic-API-sleutel**: gebruikt `ANTHROPIC_API_KEY` indien aanwezig of vraagt om een sleutel en slaat deze vervolgens op voor gebruik door de daemon.
    - **Anthropic Claude CLI**: lokaal voorkeurspad wanneer er al een aanmelding bij de Claude CLI bestaat; OpenClaw ondersteunt authenticatie met een Anthropic-installatietoken nog steeds als alternatief.
    - **OpenAI Code (Codex)-abonnement (OAuth)**: browserproces; plak de `code#state`.
      - Bij een nieuwe installatie zonder primair model wordt `agents.defaults.model` via de Codex-runtime ingesteld op `openai/gpt-5.6-sol`.
    - **OpenAI Code (Codex)-abonnement (apparaatkoppeling)**: browsergebaseerd koppelingsproces met een kortlevende apparaatcode.
      - Bij een nieuwe installatie zonder primair model wordt `agents.defaults.model` via de Codex-runtime ingesteld op `openai/gpt-5.6-sol`.
    - **OpenAI-API-sleutel**: gebruikt `OPENAI_API_KEY` indien aanwezig of vraagt om een sleutel en slaat deze vervolgens op in authenticatieprofielen.
      - Bij een nieuwe installatie zonder primair model wordt `agents.defaults.model` ingesteld op `openai/gpt-5.6`; de kale model-id voor de rechtstreekse API wordt omgezet naar de Sol-laag.
    - Bij het toevoegen of opnieuw authenticeren van OpenAI blijft een bestaand, expliciet primair model behouden, waaronder `openai/gpt-5.5`. Als het account geen GPT-5.6 beschikbaar stelt, selecteer je expliciet `openai/gpt-5.5`; OpenClaw schakelt het model niet stilzwijgend terug.
    - **xAI OAuth**: browseraanmelding met apparaatcode waarvoor geen localhost-callback nodig is, zodat deze ook via SSH/Docker/VPS werkt (`--auth-choice xai-oauth`).
    - **xAI-API-sleutel**: vraagt om `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` werkt nog steeds als uitsluitend handmatig te gebruiken compatibiliteitsalias voor hetzelfde xAI OAuth-proces met apparaatcode; gebruik `xai-oauth` voor nieuwe scripts.
    - **OpenCode**: vraagt om `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`, verkrijgbaar via https://opencode.ai/auth) en laat je de Zen- of Go-catalogus kiezen.
    - **Ollama**: biedt eerst **Cloud + lokaal**, **Alleen cloud** of **Alleen lokaal** aan. `Cloud only` vraagt om `OLLAMA_API_KEY` en gebruikt `https://ollama.com`; de hostgebaseerde modi vragen om de Ollama-basis-URL (standaard `http://127.0.0.1:11434`), detecteren beschikbare modellen en halen het geselecteerde lokale model indien nodig automatisch op; `Cloud + Local` controleert ook of die Ollama-host voor cloudtoegang is aangemeld.
    - Meer informatie: [Ollama](/nl/providers/ollama)
    - **API-sleutel**: slaat de sleutel voor je op.
    - **Vercel AI Gateway (proxy voor meerdere modellen)**: vraagt om `AI_GATEWAY_API_KEY`.
    - Meer informatie: [Vercel AI Gateway](/nl/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: vraagt om Account ID, Gateway ID en `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Meer informatie: [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
    - **MiniMax**: de configuratie wordt automatisch geschreven; de gehoste standaardwaarde is `MiniMax-M3`.
      Installatie met een API-sleutel gebruikt `minimax/...` en installatie met OAuth gebruikt
      `minimax-portal/...`.
    - Meer informatie: [MiniMax](/nl/providers/minimax)
    - **StepFun**: de configuratie wordt automatisch geschreven voor StepFun Standard of Step Plan op Chinese of wereldwijde eindpunten.
    - Standard gebruikt momenteel standaard `step-3.5-flash`; Step Plan bevat ook `step-3.5-flash-2603`.
    - Meer informatie: [StepFun](/nl/providers/stepfun)
    - **Synthetic (compatibel met Anthropic)**: vraagt om `SYNTHETIC_API_KEY`.
    - Meer informatie: [Synthetic](/nl/providers/synthetic)
    - **Moonshot (Kimi K2)**: de configuratie wordt automatisch geschreven.
    - **Kimi Coding**: de configuratie wordt automatisch geschreven.
    - Meer informatie: [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot)
    - **Aangepaste provider**: werkt met eindpunten die compatibel zijn met OpenAI, OpenAI Responses of Anthropic. Niet-interactieve vlaggen: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (optioneel; valt terug op `CUSTOM_API_KEY`), `--custom-provider-id` (optioneel; automatisch afgeleid van de basis-URL), `--custom-compatibility openai|openai-responses|anthropic` (standaard `openai`), `--custom-image-input` / `--custom-text-input` (overschrijft de afgeleide detectie van beeldmodellen).
    - **Overslaan**: er is nog geen authenticatie geconfigureerd.
    - Kies een standaardmodel uit de gedetecteerde opties (of voer handmatig een provider/model in). Kies voor de beste kwaliteit en een lager risico op promptinjectie het krachtigste model van de nieuwste generatie dat in je providerstack beschikbaar is.
    - De onboarding voert een modelcontrole uit en waarschuwt als het geconfigureerde model onbekend is of authenticatie ontbreekt.
    - De opslagmodus voor API-sleutels gebruikt standaard platte tekstwaarden in authenticatieprofielen. Gebruik `--secret-input-mode ref` om in plaats daarvan door omgevingsvariabelen ondersteunde verwijzingen op te slaan (bijvoorbeeld `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); de omgevingsvariabele waarnaar wordt verwezen, moet al zijn ingesteld, anders mislukt de onboarding onmiddellijk.
    - Authenticatieprofielen staan in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-sleutels + OAuth). `~/.openclaw/credentials/oauth.json` is uitsluitend bedoeld voor het importeren van verouderde gegevens.
    - Meer informatie: [OAuth](/nl/concepts/oauth)
    <Note>
    Tip voor headless systemen/servers: voltooi OAuth op een machine met een browser en kopieer vervolgens
    de `auth-profiles.json` van die agent (bijvoorbeeld
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, of het bijbehorende
    `$OPENCLAW_STATE_DIR/...`-pad) naar de Gateway-host. `credentials/oauth.json`
    is uitsluitend een verouderde importbron.
    </Note>
  </Step>
  <Step title="Werkruimte">
    - Standaard `~/.openclaw/workspace` (configureerbaar).
    - Maakt de werkruimtebestanden aan die nodig zijn voor het bootstrapritueel van de agent.
    - Volledige indeling van de werkruimte + back-uphandleiding: [Agentwerkruimte](/nl/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Poort (standaard **18789**), binding, authenticatiemodus, Tailscale-blootstelling.
    - Authenticatieadvies: behoud **Token**, zelfs voor loopback, zodat lokale WS-clients zich moeten authenticeren.
    - In de tokenmodus biedt de interactieve installatie:
      - **Token in platte tekst genereren/opslaan** (standaard)
      - **SecretRef gebruiken** (optioneel)
      - De snelstart hergebruikt bestaande `gateway.auth.token`-SecretRefs voor `env`-, `file`- en `exec`-providers voor de onboardingcontrole en het opstarten van het dashboard.
      - Als die SecretRef is geconfigureerd maar niet kan worden omgezet, mislukt de onboarding vroegtijdig met een duidelijk herstelbericht in plaats van de runtime-authenticatie stilzwijgend te verslechteren.
    - In de wachtwoordmodus ondersteunt de interactieve installatie ook opslag als platte tekst of SecretRef.
    - Niet-interactief SecretRef-pad voor tokens: `--gateway-token-ref-env <ENV_VAR>`.
      - Vereist een niet-lege omgevingsvariabele in de procesomgeving van de onboarding.
      - Kan niet worden gecombineerd met `--gateway-token`.
    - Schakel authenticatie alleen uit als je elk lokaal proces volledig vertrouwt.
    - Bindingen die geen loopback gebruiken, vereisen nog steeds authenticatie.

  </Step>
  <Step title="Kanalen">
    - [WhatsApp](/nl/channels/whatsapp): optionele QR-aanmelding.
    - [Telegram](/nl/channels/telegram): bottoken.
    - [Discord](/nl/channels/discord): bottoken.
    - [Google Chat](/nl/channels/googlechat): JSON van serviceaccount + webhookdoelgroep.
    - [Mattermost](/nl/channels/mattermost) (plugin): bottoken + basis-URL.
    - [Signal](/nl/channels/signal) (plugin): optionele installatie van `signal-cli` + accountconfiguratie.
    - [iMessage](/nl/channels/imessage): CLI-pad van `imsg` + toegang tot de Messages-database; gebruik een SSH-wrapper wanneer de Gateway buiten een Mac wordt uitgevoerd.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack en andere kanalen worden geleverd als
      plugins die onboarding voor je kan installeren. Volledige catalogus: [Kanalen](/nl/channels).
    - DM-beveiliging: standaard wordt koppeling gebruikt. De eerste DM stuurt een code; keur deze goed via `openclaw pairing approve <channel> <code>` of gebruik toelatingslijsten.

  </Step>
  <Step title="Zoeken op het web">
    - Kies een ondersteunde provider, zoals Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG of Tavily (of sla deze stap over).
    - Providers die een API gebruiken, kunnen omgevingsvariabelen of een bestaande configuratie gebruiken voor een snelle installatie; providers zonder sleutel gebruiken in plaats daarvan hun providerspecifieke vereisten.
    - Sla over met `--skip-search`.
    - Later configureren: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon installeren">
    - macOS: LaunchAgent
      - Vereist een aangemelde gebruikerssessie; gebruik voor headless systemen een aangepaste LaunchDaemon (niet meegeleverd).
    - Linux (en Windows via WSL2): systemd-gebruikerseenheid
      - Onboarding probeert lingering in te schakelen via `loginctl enable-linger <user>`, zodat de Gateway actief blijft na afmelden.
      - Kan om sudo vragen (schrijft `/var/lib/systemd/linger`); eerst wordt het zonder sudo geprobeerd.
    - Native Windows: eerst een geplande taak; als het maken van de taak wordt geweigerd, valt OpenClaw terug op een aanmeldingsitem per gebruiker in de map Opstarten en wordt de Gateway onmiddellijk gestart.
    - **Runtimeselectie:** Node is vereist omdat de canonieke opslag voor runtimestatus `node:sqlite` gebruikt. Verouderde Bun-services worden tijdens herstel naar Node gemigreerd.
    - Als tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert de daemoninstallatie deze, maar worden omgezette tokenwaarden in platte tekst niet blijvend opgeslagen in de omgevingsmetadata van de supervisorservice.
    - Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden omgezet, wordt de daemoninstallatie geblokkeerd met bruikbare instructies.
    - Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt de daemoninstallatie geblokkeerd totdat de modus expliciet is ingesteld.

  </Step>
  <Step title="Statuscontrole">
    - Start de Gateway (indien nodig) en voert `openclaw health` uit.
    - Tip: `openclaw status --deep` voegt de live Gateway-statuscontrole toe aan de statusuitvoer, inclusief kanaalcontroles wanneer deze worden ondersteund (vereist een bereikbare Gateway).

  </Step>
  <Step title="Skills (aanbevolen)">
    - Leest de beschikbare Skills en controleert de vereisten.
    - Laat je een Node-manager kiezen: **npm / pnpm / bun**.
    - Installeert automatisch optionele afhankelijkheden voor vertrouwde, meegeleverde Skills (sommige gebruiken Homebrew op macOS).
    - Slaat Skills over waarvan de vereiste Homebrew-, uv- of Go-installatietool niet beschikbaar is, groepeert ze met instructies voor handmatige installatie en verwijst je naar `openclaw doctor` zodra de vereiste is geïnstalleerd.

  </Step>
  <Step title="Voltooien">
    - Samenvatting + vervolgstappen, inclusief de vraag **Hoe wil je je agent uit het ei laten komen?** voor Terminal, Browser of later.

  </Step>
</Steps>

<Note>
Als er geen GUI wordt gedetecteerd, toont de onboarding SSH-instructies voor poortdoorsturing naar de Control UI in plaats van een browser te openen.
Als de assets van de Control UI ontbreken, probeert de onboarding deze te bouwen; de terugvaloptie is `pnpm ui:build` (installeert UI-afhankelijkheden automatisch).
</Note>

## Niet-interactieve modus

Gebruik `--non-interactive --accept-risk` om de onboarding te automatiseren of via scripts uit te voeren (de
vlag is de vereiste risico-erkenning; zonder deze vlag wordt de onboarding met een fout
afgesloten):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Voeg `--json` toe voor een machineleesbare samenvatting.

SecretRef voor het Gateway-token in niet-interactieve modus:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` en `--gateway-token-ref-env` sluiten elkaar wederzijds uit.

<Note>
`--json` impliceert **niet** de niet-interactieve modus. Gebruik `--non-interactive --accept-risk` (en `--workspace`) voor scripts.
</Note>

Providerspecifieke opdrachtvoorbeelden staan in [CLI-automatisering](/nl/start/wizard-cli-automation#provider-specific-examples).
Gebruik deze referentiepagina voor de betekenis van vlaggen en de volgorde van stappen.

### Agent toevoegen (niet-interactief)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` is een gereserveerde agent-id en kan niet worden gebruikt voor `openclaw agents add`.

## RPC van de Gateway-wizard

De Gateway stelt de onboardingflow beschikbaar via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clients (macOS-app, Control UI) kunnen stappen weergeven zonder de onboardinglogica opnieuw te implementeren.

## Signal instellen (signal-cli)

De onboarding detecteert of `signal-cli` zich in `PATH` bevindt en biedt aan het te installeren als het ontbreekt:

- Linux x86-64: downloadt de officiële systeemeigen GraalVM-build uit de GitHub-releases van `signal-cli` en slaat deze op onder `~/.openclaw/tools/signal-cli/<version>/`.
- macOS en andere architecturen: installeert in plaats daarvan via Homebrew.
- Systeemeigen Windows: wordt nog niet ondersteund; voer de onboarding binnen WSL2 uit om het Linux-installatiepad te gebruiken.
- Schrijft in beide gevallen `channels.signal.cliPath` naar je configuratie.

## Wat de wizard schrijft

Gebruikelijke velden in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` wanneer `--skip-bootstrap` wordt doorgegeven
- `agents.defaults.model` / `models.providers` (als Minimax is gekozen)
- `tools.profile` (lokale onboarding gebruikt standaard `"coding"` als dit niet is ingesteld; bestaande expliciete waarden blijven behouden)
- `gateway.*` (modus, binding, authenticatie, Tailscale)
- `session.dmScope` (lokale onboarding stelt dit standaard in op `"per-channel-peer"` als het niet is ingesteld; bestaande expliciete waarden blijven behouden. Details: [Referentie voor CLI-installatie](/nl/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Toegestane afzenders voor privéberichten per kanaal wanneer je hiervoor kiest tijdens de kanaalprompts. Discord, Matrix, Microsoft Teams en Slack zetten namen waar mogelijk om naar id's; andere kanalen gebruiken rechtstreeks id's (bijvoorbeeld numerieke afzender-id's van Telegram of WhatsApp-telefoonnummers).
- `skills.install.nodeManager`
  - `setup --node-manager` accepteert `npm`, `pnpm` of `bun`.
  - Handmatige configuratie kan nog steeds `yarn` gebruiken door `skills.install.nodeManager` rechtstreeks in te stellen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` schrijft `agents.list[]` en optioneel `bindings`.

WhatsApp-referenties worden opgeslagen onder `~/.openclaw/credentials/whatsapp/<accountId>/`.
Actieve sessies en transcripties worden opgeslagen in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. De map
`~/.openclaw/agents/<agentId>/sessions/` wordt gebruikt voor invoer voor verouderde migraties
en archief- en ondersteuningsartefacten.

Sommige kanalen worden als plugins geleverd. Wanneer je er tijdens de installatie een kiest, vraagt de onboarding
je om deze te installeren (via npm of een lokaal pad) voordat deze kan worden geconfigureerd.

## Gerelateerde documentatie

- Overzicht van de onboarding: [Onboarding (CLI)](/nl/start/wizard)
- Referentie voor CLI-installatie: [Referentie voor CLI-installatie](/nl/start/wizard-cli-reference)
- Onboarding van de macOS-app: [Onboarding](/nl/start/onboarding)
- Configuratiereferentie: [Gateway-configuratie](/nl/gateway/configuration)
- Providers: [WhatsApp](/nl/channels/whatsapp), [Telegram](/nl/channels/telegram), [Discord](/nl/channels/discord), [Google Chat](/nl/channels/googlechat), [Signal](/nl/channels/signal), [iMessage](/nl/channels/imessage)
- Skills: [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config)
