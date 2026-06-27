---
read_when:
    - Je wilt de meegeleverde Codex app-server-harnas gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - U wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op OpenClaw
summary: Voer OpenClaw embedded agent-beurten uit via de gebundelde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-06-27T17:51:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-Plugin laat OpenClaw ingebedde OpenAI-agentbeurten uitvoeren
via Codex app-server in plaats van de ingebouwde OpenClaw-harness.

Gebruik de Codex-harness wanneer je wilt dat Codex de low-level agentsessie beheert:
native thread hervatten, native toolvoortzetting, native Compaction en
app-server-uitvoering. OpenClaw blijft chatkanalen, sessiebestanden, modelselectie,
dynamische OpenClaw-tools, goedkeuringen, media-aflevering en de zichtbare
transcriptspiegel beheren.

De normale setup gebruikt canonieke OpenAI-modelrefs zoals `openai/gpt-5.5`.
Configureer geen verouderde Codex GPT-refs. Zet de OpenAI-agent-authenticatievolgorde
onder `auth.order.openai`; oudere verouderde Codex-authenticatieprofiel-id's en
verouderde Codex-authenticatievolgorde-items zijn legacy state die wordt gerepareerd door
`openclaw doctor --fix`.

Wanneer er geen OpenClaw-sandbox actief is, start OpenClaw Codex app-server-threads
met native Codex-code mode ingeschakeld, terwijl code-mode-only standaard uit blijft.
Daardoor blijven de native Codex-werkruimte en codemogelijkheden beschikbaar terwijl
dynamische OpenClaw-tools doorgaan via de app-server-bridge `item/tool/call`.
Actieve OpenClaw-sandboxing en beperkte toolbeleidsregels schakelen native code mode
volledig uit, tenzij je kiest voor het experimentele sandbox exec-server-pad.

Deze Codex-native functie staat los van
[OpenClaw code mode](/nl/reference/code-mode), een opt-in QuickJS-WASI-runtime
voor generieke OpenClaw-runs met een andere `exec`-invoervorm.

Begin voor de bredere splitsing tussen model, provider en runtime met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelref, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Vereisten

- OpenClaw met de gebundelde `codex`-Plugin beschikbaar.
- Als je configuratie `plugins.allow` gebruikt, neem dan `codex` op.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben geen
  invloed op het normale opstarten van de harness.
- Codex-authenticatie beschikbaar via `openclaw models auth login --provider openai`,
  een app-server-account in de Codex-home van de agent, of een expliciet Codex API-key-
  authenticatieprofiel.

Zie voor authenticatieprioriteit, omgevingsisolatie, aangepaste app-server-commando's, modelontdekking
en alle configuratievelden de
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Snelstart

De meeste gebruikers die Codex in OpenClaw willen, willen dit pad: meld je aan met een
ChatGPT/Codex-abonnement, schakel de gebundelde `codex`-Plugin in en gebruik een
canonieke `openai/gpt-*`-modelref.

Meld je aan met Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Schakel de gebundelde `codex`-Plugin in en selecteer een OpenAI-agentmodel:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Als je configuratie `plugins.allow` gebruikt, voeg daar dan ook `codex` toe:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Herstart de Gateway nadat je de Plugin-configuratie hebt gewijzigd. Als een bestaande chat al
een sessie heeft, gebruik dan `/new` of `/reset` voordat je runtimewijzigingen test, zodat de volgende
beurt de harness ophaalt uit de huidige configuratie.

## Configuratie

De snelstartconfiguratie is de minimaal werkbare Codex-harnessconfiguratie. Stel Codex-
harnessopties in de OpenClaw-configuratie in en gebruik de CLI alleen voor Codex-authenticatie:

| Behoefte                               | Instellen                                                                        | Waar                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| De harness inschakelen                 | `plugins.entries.codex.enabled: true`                                            | OpenClaw-configuratie              |
| Een allowlisted Plugin-installatie behouden | Neem `codex` op in `plugins.allow`                                               | OpenClaw-configuratie              |
| OpenAI-agentbeurten via Codex routeren | `agents.defaults.model` of `agents.list[].model` als `openai/gpt-*`              | OpenClaw-agentconfiguratie         |
| Aanmelden met ChatGPT/Codex OAuth      | `openclaw models auth login --provider openai`                                   | CLI-authenticatieprofiel           |
| API-key-back-up toevoegen voor Codex-runs | `openai:*` API-key-profiel vermeld na abonnementsauthenticatie in `auth.order.openai` | CLI-authenticatieprofiel + OpenClaw-configuratie |
| Fail closed wanneer Codex niet beschikbaar is | Provider- of model-`agentRuntime.id: "codex"`                                    | OpenClaw-model/providerconfiguratie |
| Direct OpenAI API-verkeer gebruiken    | Provider- of model-`agentRuntime.id: "openclaw"` met normale OpenAI-authenticatie | OpenClaw-model/providerconfiguratie |
| App-server-gedrag afstemmen            | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-configuratie          |
| Native Codex-Plugin-apps inschakelen   | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-configuratie          |
| Codex Computer Use inschakelen         | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-configuratie          |

Gebruik `openai/gpt-*`-modelrefs voor door Codex ondersteunde OpenAI-agentbeurten. Geef de voorkeur aan
`auth.order.openai` voor volgorde met abonnement eerst en API-key als back-up. Bestaande
verouderde Codex-authenticatieprofiel-id's en verouderde Codex-authenticatievolgorde zijn doctor-only
legacy state; schrijf geen nieuwe verouderde Codex GPT-refs.

Stel `compaction.model` of `compaction.provider` niet in op door Codex ondersteunde agents.
Codex comprimeert via de native app-server-threadstate, dus OpenClaw negeert
die lokale summarizer-overrides tijdens runtime en `openclaw doctor --fix` verwijdert
ze wanneer de agent Codex gebruikt.

Lossless blijft ondersteund als contextengine voor assemblage, opname en
onderhoud rond Codex-beurten. Configureer dit via
`plugins.slots.contextEngine: "lossless-claw"` en
`plugins.entries.lossless-claw.config.summaryModel`, niet via
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migreert de oude
`compaction.provider: "lossless-claw"`-vorm naar de Lossless-contextengine-slot
wanneer Codex de actieve runtime is, maar native Codex blijft Compaction beheren.

De native Codex app-server-harness ondersteunt contextengines die
pre-prompt-assemblage vereisen. Generieke CLI-backends, waaronder `codex-cli`, bieden
die hostmogelijkheid niet.

Voor door Codex ondersteunde agents start `/compact` native Codex app-server-Compaction op
de gebonden thread. OpenClaw wacht niet op voltooiing, legt geen OpenClaw-
timeout op, herstart de gedeelde app-server niet en valt niet terug op een contextengine of
publieke OpenAI-summarizer. Als de native Codex-threadbinding ontbreekt of
verouderd is, faalt het commando closed zodat de operator de echte runtimegrens ziet
in plaats van stilzwijgend van Compaction-backend te wisselen.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In die vorm lopen beide profielen nog steeds via Codex voor `openai/gpt-*`-agentbeurten.
De API-key is alleen een authenticatiefallback, geen verzoek om over te schakelen naar OpenClaw of
gewone OpenAI Responses.

De rest van deze pagina behandelt veelvoorkomende varianten waar gebruikers tussen moeten kiezen:
deploymentvorm, fail-closed-routing, guardian-goedkeuringsbeleid, native Codex-
Plugins en Computer Use. Zie voor volledige optielijsten, standaardwaarden, enums, ontdekking,
omgevingsisolatie, time-outs en app-server-transportvelden de
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Codex-runtime verifiëren

Gebruik `/status` in de chat waar je Codex verwacht. Een door Codex ondersteunde OpenAI-agentbeurt
toont:

```text
Runtime: OpenAI Codex
```

Controleer daarna de Codex app-server-state:

```text
/codex status
/codex models
```

`/codex status` rapporteert app-server-connectiviteit, account, rate limits, MCP-
servers en Skills. `/codex models` vermeldt de live Codex app-server-catalogus voor
de harness en het account. Als `/status` verrassend is, zie
[Probleemoplossing](#troubleshooting).

## Routing en modelselectie

Houd providerrefs en runtimebeleid gescheiden:

- Gebruik `openai/gpt-*` voor OpenAI-agentbeurten via Codex.
- Gebruik geen verouderde Codex GPT-refs in configuratie. Voer `openclaw doctor --fix` uit om
  verouderde refs en oude sessieroute-pins te repareren.
- `agentRuntime.id: "codex"` is optioneel voor normale OpenAI-automodus, maar nuttig
  wanneer een deployment fail closed moet zijn als Codex niet beschikbaar is.
- `agentRuntime.id: "openclaw"` zet een provider of model bewust op de ingebedde
  OpenClaw-runtime.
- `/codex ...` beheert native Codex app-server-gesprekken vanuit chat.
- ACP/acpx is een apart extern harnesspad. Gebruik het alleen wanneer de gebruiker vraagt
  om ACP/acpx of een externe harnessadapter.

Veelvoorkomende commandorouting:

| Gebruikersintentie                                  | Gebruik                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| De huidige chat koppelen                            | `/codex bind [--cwd <path>]`                                                                          |
| Een bestaande Codex-thread hervatten                | `/codex resume <thread-id>`                                                                           |
| Codex-threads weergeven of filteren                 | `/codex threads [filter]`                                                                             |
| Native Codex-Plugins weergeven                      | `/codex plugins list`                                                                                 |
| Een geconfigureerde native Codex-Plugin in- of uitschakelen | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Een bestaande Codex CLI-sessie op een gekoppelde node koppelen | `/codex sessions --host <node> [filter]`, daarna `/codex resume <session-id> --host <node> --bind here` |
| Alleen Codex-feedback verzenden                     | `/codex diagnostics [note]`                                                                           |
| Een ACP/acpx-taak starten                           | ACP/acpx-sessiecommando's, niet `/codex`                                                              |

| Gebruiksscenario                                    | Configureren                                                           | Verifiëren                              | Opmerkingen                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*` plus ingeschakelde `codex`-Plugin                       | `/status` toont `Runtime: OpenAI Codex` | Aanbevolen pad                        |
| Gesloten falen als Codex niet beschikbaar is         | Provider of model `agentRuntime.id: "codex"`                           | Turn faalt in plaats van ingebouwde fallback | Gebruik voor implementaties met alleen Codex |
| Rechtstreeks OpenAI API-key-verkeer via OpenClaw     | Provider of model `agentRuntime.id: "openclaw"` en normale OpenAI-auth | `/status` toont OpenClaw-runtime        | Alleen gebruiken wanneer OpenClaw bewust is gekozen |
| Legacy-configuratie                                  | legacy Codex GPT-referenties                                           | `openclaw doctor --fix` herschrijft dit | Schrijf nieuwe configuratie niet op deze manier |
| ACP/acpx Codex-adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP-taak-/sessiestatus                  | Afzonderlijk van native Codex-harness |

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik `openai/gpt-*`
voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer beeldbegrip
via een begrensde Codex app-server-turn moet lopen. Gebruik geen
legacy Codex GPT-referenties; doctor herschrijft die legacy-prefix naar `openai/gpt-*`.

## Implementatiepatronen

### Basis-Codex-implementatie

Gebruik de quickstart-configuratie wanneer alle OpenAI-agentturns standaard
Codex moeten gebruiken.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### Implementatie met gemengde providers

Deze vorm houdt Claude als standaardagent en voegt een benoemde Codex-agent toe:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

Met deze configuratie gebruikt de `main`-agent zijn normale providerpad en gebruikt
de `codex`-agent Codex app-server.

### Gesloten falende Codex-implementatie

Voor OpenAI-agentturns wordt `openai/gpt-*` al naar Codex herleid wanneer de
gebundelde Plugin beschikbaar is. Voeg expliciet runtimebeleid toe wanneer je een
geschreven regel voor gesloten falen wilt:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Wanneer Codex wordt afgedwongen, faalt OpenClaw vroeg als de Codex-Plugin is
uitgeschakeld, de app-server te oud is of de app-server niet kan starten.

## App-serverbeleid

Standaard start de Plugin de door OpenClaw beheerde Codex-binary lokaal met
stdio-transport. Stel `appServer.command` alleen in wanneer je bewust een
ander uitvoerbaar bestand wilt uitvoeren. Gebruik WebSocket-transport alleen
wanneer er al elders een app-server draait:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Lokale stdio-app-serversessies gebruiken standaard de vertrouwde lokale
operatorhouding: `approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Als lokale Codex-vereisten die impliciete
YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan toegestane
guardian-machtigingen. Wanneer een OpenClaw-sandbox actief is voor de sessie,
schakelt OpenClaw Codex native Code Mode, MCP-servers van gebruikers en
app-ondersteunde Plugin-uitvoering voor die turn uit, in plaats van te vertrouwen
op sandboxing aan de Codex-hostzijde. Shelltoegang wordt beschikbaar gesteld
via door de OpenClaw-sandbox ondersteunde dynamische tools zoals `sandbox_exec` en
`sandbox_process` wanneer de normale exec-/proces-tools beschikbaar zijn.

Gebruik genormaliseerde OpenClaw-execmodus wanneer je Codex native auto-review
wilt vóór sandbox-ontsnappingen of extra machtigingen:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Voor Codex app-server-sessies koppelt OpenClaw `tools.exec.mode: "auto"` aan door
Codex Guardian beoordeelde goedkeuringen, meestal
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en
`sandbox: "workspace-write"` wanneer de lokale vereisten die waarden toestaan.
In `tools.exec.mode: "auto"` behoudt OpenClaw geen legacy onveilige Codex-
overrides voor `approvalPolicy: "never"` of `sandbox: "danger-full-access"`; gebruik
`tools.exec.mode: "full"` voor een bewuste Codex-houding zonder goedkeuring. De
legacy preset `plugins.entries.codex.config.appServer.mode: "guardian"` werkt nog
steeds, maar `tools.exec.mode: "auto"` is het genormaliseerde OpenClaw-oppervlak.

Zie [Machtigingsmodi](/nl/tools/permission-modes) voor de vergelijking op modusniveau
met host-execgoedkeuringen en ACPX-machtigingen.

Zie [Codex-harnessreferentie](/nl/plugins/codex-harness-reference) voor elk
app-serverveld, de auth-volgorde, omgevingsisolatie, ontdekking en
time-outgedrag.

## Opdrachten en diagnostiek

De gebundelde Plugin registreert `/codex` als slash-opdracht op elk kanaal dat
OpenClaw-tekstopdrachten ondersteunt.

Gebruikelijke vormen:

- `/codex status` controleert app-serverconnectiviteit, modellen, account, rate limits,
  MCP-servers en Skills.
- `/codex models` toont live Codex app-server-modellen.
- `/codex threads [filter]` toont recente Codex app-server-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een
  bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te compacten.
- `/codex review` start Codex native review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt toestemming voordat Codex-feedback voor de
  gekoppelde thread wordt verzonden.
- `/codex account` toont account- en rate-limitstatus.
- `/codex mcp` toont Codex app-server MCP-serverstatus.
- `/codex skills` toont Codex app-server-Skills.

Begin voor de meeste supportrapporten met `/diagnostics [note]` in het gesprek
waar de bug optrad. Dit maakt één Gateway-diagnoserapport en vraagt, voor
Codex-harnesssessies, toestemming om de relevante Codex-feedbackbundel te
verzenden. Zie [Diagnose-export](/nl/gateway/diagnostics) voor het privacymodel en
gedrag in groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de
Codex-feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige
Gateway-diagnosebundel.

### Codex-threads lokaal inspecteren

De snelste manier om een mislukte Codex-run te inspecteren is vaak om de native
Codex-thread rechtstreeks te openen:

```bash
codex resume <thread-id>
```

Haal de thread-id uit het voltooide `/diagnostics`-antwoord, `/codex binding` of
`/codex threads [filter]`.

Zie [Codex-harnessruntime](/nl/plugins/codex-harness-runtime#codex-feedback-upload)
voor uploadmechaniek en diagnostische grenzen op runtimeniveau.

Auth wordt in deze volgorde geselecteerd:

1. Geordende OpenAI-authprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Voer `openclaw doctor --fix` uit om oudere
   legacy Codex-authprofiel-id's en legacy Codex-authvolgorde te migreren.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth
   nog vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Daardoor
blijven API-keys op Gateway-niveau beschikbaar voor embeddings of rechtstreekse
OpenAI-modellen, zonder dat native Codex app-server-turns per ongeluk via de API
worden gefactureerd. Expliciete Codex API-key-profielen en lokale stdio
env-key-fallback gebruiken app-serverlogin in plaats van geërfde childproces-env.
WebSocket-app-serververbindingen ontvangen geen Gateway env API-key-fallback;
gebruik een expliciet authprofiel of het eigen account van de externe app-server.
Wanneer native Codex-Plugins zijn geconfigureerd, installeert of vernieuwt OpenClaw
die Plugins via de verbonden app-server voordat Plugin-eigen apps aan de
Codex-thread worden blootgesteld. `app/list` blijft de bron van waarheid voor
app-id's, toegankelijkheid en metadata, maar OpenClaw is eigenaar van de
inschakelbeslissing per thread: als beleid een vermelde toegankelijke app toestaat,
verzendt OpenClaw `thread/start.config.apps[appId].enabled = true`, zelfs wanneer
`app/list` die app momenteel als uitgeschakeld rapporteert. Dit pad verzint geen
app-installatie voor onbekende id's; OpenClaw activeert alleen marketplace-Plugins
met `plugin/install` en vernieuwt daarna de inventaris.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw de
resettijd wanneer Codex die rapporteert en probeert het volgende geordende
authprofiel voor dezelfde Codex-run. Wanneer de resettijd voorbij is, wordt het
abonnementsprofiel opnieuw geschikt zonder het geselecteerde `openai/gpt-*`-model
of de Codex-runtime te wijzigen.

Voor lokale stdio-app-serverstarts stelt OpenClaw `CODEX_HOME` in op een
per-agent-map, zodat Codex-configuratie, auth-/accountbestanden, Plugin-cache/data
en native threadstatus standaard niet lezen uit of schrijven naar de persoonlijke
`~/.codex` van de operator. OpenClaw behoudt de normale proces-`HOME`;
subprocessen die door Codex worden uitgevoerd kunnen nog steeds configuratie en
tokens in de user-home vinden, en Codex kan gedeelde vermeldingen in
`$HOME/.agents/skills` en `$HOME/.agents/plugins/marketplace.json` ontdekken.

Als een implementatie extra omgevingsisolatie nodig heeft, voeg die variabelen toe
aan `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` heeft alleen invloed op het gespawnde Codex app-server-childproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens normalisatie van
lokale starts: `CODEX_HOME` blijft per agent, en `HOME` blijft geërfd zodat
subprocessen de normale user-home-status kunnen gebruiken.

Dynamische tools van Codex worden standaard met `searchable` geladen. OpenClaw stelt geen
dynamische tools beschikbaar die Codex-native werkruimtebewerkingen dupliceren:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` en `update_plan`.
De meeste resterende OpenClaw-integratietools, zoals berichten, media, Cron,
browser, nodes, Gateway en `heartbeat_respond`, zijn beschikbaar via de
toolzoekfunctie van Codex onder de naamruimte `openclaw`, waardoor de initiële
modelcontext kleiner blijft. Webzoekopdrachten gebruiken standaard Codex'
gehoste `web_search`-tool wanneer zoeken is ingeschakeld en er geen beheerde
provider is geselecteerd. Native gehost zoeken en OpenClaw's beheerde dynamische
tool `web_search` sluiten elkaar wederzijds uit, zodat beheerd zoeken native
domeinbeperkingen niet kan omzeilen. OpenClaw gebruikt de beheerde tool wanneer
gehost zoeken niet beschikbaar is, expliciet is uitgeschakeld of is vervangen
door een geselecteerde beheerde provider. OpenClaw houdt Codex' zelfstandige
`web.run`-extensie uitgeschakeld omdat productie-appserververkeer de door de
gebruiker gedefinieerde naamruimte `web` weigert. `tools.web.search.enabled:
false` schakelt beide paden uit, net als tool-uitgeschakelde runs met alleen
LLM. Codex behandelt `"cached"` als een voorkeur en zet dit om naar live externe
toegang voor onbeperkte appserverbeurten. Automatische beheerde fallback faalt
gesloten wanneer native `allowedDomains` zijn ingesteld, zodat de allowlist niet
kan worden omzeild. Permanente wijzigingen in het effectieve zoekbeleid roteren
de gebonden Codex-thread vóór de volgende beurt. Tijdelijke beperkingen per
beurt gebruiken een tijdelijke beperkte thread en behouden de bestaande binding
voor later hervatten. `sessions_yield` en bronantwoorden met alleen
berichtentools blijven direct omdat dit beurtcontrolecontracten zijn.
`sessions_spawn` blijft doorzoekbaar, zodat Codex' native `spawn_agent` het
primaire Codex-subagentoppervlak blijft, terwijl expliciete delegatie via
OpenClaw of ACP nog steeds beschikbaar is via de dynamische-toolnaamruimte
`openclaw`. Heartbeat-samenwerkingsinstructies vertellen Codex om naar
`heartbeat_respond` te zoeken voordat een Heartbeat-beurt wordt beëindigd
wanneer de tool nog niet is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in bij verbinding met een
aangepaste Codex-appserver die uitgestelde dynamische tools niet kan zoeken, of
bij het debuggen van de volledige toolpayload.

Ondersteunde Codex-pluginvelden op topniveau:

| Veld                       | Standaard      | Betekenis                                                                                      |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om dynamische OpenClaw-tools direct in de initiële Codex-toolcontext te zetten. |
| `codexDynamicToolsExclude` | `[]`           | Extra namen van dynamische OpenClaw-tools die uit Codex-appserverbeurten moeten worden weggelaten. |
| `codexPlugins`             | uitgeschakeld  | Native Codex-plugin-/app-ondersteuning voor gemigreerde, vanuit bron geïnstalleerde samengestelde plugins. |

Ondersteunde `appServer`-velden:

| Veld                                          | Standaard                                             | Betekenis                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                                |
| `command`                                     | beheerd Codex-binair bestand                         | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om het beheerde binaire bestand te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                        | WebSocket-URL van de app-server.                                                                                                                                                                                                                                                                                                                                                                |
| `authToken`                                   | niet ingesteld                                        | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                  | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                  | Extra namen van omgevingsvariabelen die uit het gestarte stdio-app-serverproces worden verwijderd nadat OpenClaw de geërfde omgeving heeft opgebouwd. OpenClaw behoudt per-agent `CODEX_HOME` en geërfde `HOME` voor lokale launches.                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                               | Kies voor Codex' tool-oppervlak dat alleen voor code-mode is. Dynamische OpenClaw-tools blijven bij Codex geregistreerd, zodat geneste `tools.*`-aanroepen via de app-server-bridge `item/tool/call` terugkeren.                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | niet ingesteld                                        | Remote workspace-root van de Codex-app-server. Wanneer ingesteld, leidt OpenClaw de lokale workspace-root af uit de opgeloste OpenClaw-workspace, behoudt het huidige cwd-suffix onder deze remote-root en stuurt alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-workspace-root ligt, faalt OpenClaw gesloten in plaats van een gateway-lokaal pad naar de remote app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                               | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                                                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Stille periode nadat Codex een turn accepteert of na een turn-gebonden app-serververzoek terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Completion-idle- en voortgangsbewaking gebruikt na een tool-handoff, voltooiing van een native tool, raw assistant-voortgang na een tool, voltooiing van raw reasoning of reasoning-voortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij synthese na een tool legitiem langer stil kan blijven dan het budget voor de uiteindelijke assistant-release. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden | Preset voor YOLO of door guardian beoordeelde uitvoering. Lokale stdio-vereisten die `danger-full-access`, `never`-goedkeuring of de `user`-reviewer weglaten, maken guardian de impliciete standaard.                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` of een toegestane guardian-goedkeuringspolicy | Native Codex-goedkeuringspolicy die naar thread start/resume/turn wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"on-request"` wanneer toegestaan.                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"workspace-write"` wanneer toegestaan, anders `"read-only"`. Wanneer een OpenClaw-sandbox actief is, gebruiken `danger-full-access`-turns Codex `workspace-write` met netwerktoegang afgeleid van de egress-instelling van de OpenClaw-sandbox.                                  |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-reviewer          | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer toegestaan, anders `guardian_subagent` of `user`. `guardian_subagent` blijft een legacy-alias.                                                                                                                                                                                                           |
| `serviceTier`                                 | niet ingesteld                                        | Optionele servicelaag voor de Codex-app-server. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan, `null` wist de overschrijving en legacy `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                        |
| `networkProxy`                                | uitgeschakeld                                         | Kies voor Codex permissions-profile-netwerken voor app-servercommando's. OpenClaw definieert de geselecteerde `permissions.<profile>.network`-config en selecteert die met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                               | Preview-opt-in die een door OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan draaien.                                                                                                                                                                                     |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer ingeschakeld, stelt OpenClaw ook `features.network_proxy.enabled` en
`default_permissions` in de Codex-threadconfiguratie in, zodat het gegenereerde permissieprofiel
door Codex beheerd netwerken kan starten. Standaard genereert OpenClaw een
botsingsbestendige profielnaam `openclaw-network-<fingerprint>` uit de
profielinhoud; gebruik `profileName` alleen wanneer een stabiele lokale naam vereist is.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Als de normale app-serverruntime `danger-full-access` zou zijn, gebruikt het inschakelen van
`networkProxy` workspace-achtige bestandssysteemtoegang voor het gegenereerde
permissieprofiel. Door Codex beheerde netwerkhandhaving is gesandboxed netwerken,
dus een full-access-profiel zou uitgaand verkeer niet beschermen.
Domeinvermeldingen gebruiken `allow` of `deny`; Unix-socketvermeldingen gebruiken Codex'
waarden `allow` of `none`.

Dynamische tool-aanroepen die eigendom zijn van OpenClaw worden onafhankelijk van
`appServer.requestTimeoutMs` begrensd: Codex `item/tool/call`-requests gebruiken standaard een
OpenClaw-watchdog van 90 seconden. Een positief per-aanroep-argument `timeoutMs` verlengt
of verkort dat specifieke toolbudget. De tool `image_generate` gebruikt
`agents.defaults.imageGenerationModel.timeoutMs` wanneer de tool-aanroep geen eigen timeout
opgeeft, of anders een standaardwaarde van 120 seconden voor image generation.
De media-understanding-tool `image` gebruikt
`tools.media.image.timeoutSeconds` of de mediastandaard van 60 seconden. Voor image
understanding geldt die timeout voor de request zelf en wordt die niet
verminderd door eerder voorbereidingswerk. Dynamische toolbudgetten worden
afgetopt op 600000 ms. Bij een timeout breekt OpenClaw het toolsignaal af
waar dit wordt ondersteund en retourneert het een mislukte dynamic-tool-response aan Codex zodat de beurt
kan doorgaan in plaats van de sessie in `processing` te laten staan.
Deze watchdog is het buitenste dynamische `item/tool/call`-budget; providerspecifieke
requesttimeouts lopen binnen die aanroep en behouden hun eigen timeoutsemantiek.

Nadat Codex een beurt accepteert, en nadat OpenClaw reageert op een beurtgebonden
app-server-request, verwacht de harness dat Codex voortgang maakt in de huidige beurt en
uiteindelijk de native beurt afrondt met `turn/completed`. Als de app-server
stil blijft gedurende `appServer.turnCompletionIdleTimeoutMs`, onderbreekt OpenClaw naar beste kunnen
de Codex-beurt, registreert het een diagnostische timeout en geeft het de
OpenClaw-sessielane vrij zodat opvolgende chatberichten niet achter een verouderde
native beurt in de wachtrij blijven staan. De meeste niet-terminale meldingen voor dezelfde beurt schakelen die korte
watchdog uit omdat Codex heeft aangetoond dat de beurt nog actief is. Tool-overdrachten gebruiken een
langer post-tool-idlebudget: nadat OpenClaw een `item/tool/call`-
response retourneert, nadat native toolitems zoals `commandExecution` zijn voltooid, na ruwe
`custom_tool_call_output`-voltooiingen, en na post-tool ruwe assistant-
voortgang, ruwe reasoning-voltooiingen of reasoning-voortgang. De guard gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer dit is geconfigureerd en
valt anders terug op vijf minuten. Datzelfde post-toolbudget verlengt ook de
voortgangswatchdog voor het stille synthesewindow voordat Codex de volgende
huidige-beurtgebeurtenis uitzendt. Globale app-servermeldingen, zoals rate-limit-updates,
resetten de turn-idle-voortgang niet. Reasoning-voltooiingen, commentary
`agentMessage`-voltooiingen, en pre-tool ruwe reasoning- of assistant-voortgang kunnen
worden gevolgd door een automatisch eindantwoord, dus gebruiken ze de post-progress-reply-
guard in plaats van de sessielane direct vrij te geven. Alleen
definitieve/niet-commentary voltooide `agentMessage`-items en pre-tool ruwe
assistant-voltooiingen activeren de assistant-output-release: als Codex daarna stil blijft
zonder `turn/completed`, onderbreekt OpenClaw naar beste kunnen de native beurt en
geeft het de sessielane vrij. Replay-veilige stdio app-serverfouten, inclusief
turn-completion-idletimeouts zonder bewijs van assistant, tool, active-item of
side-effect, worden eenmaal opnieuw geprobeerd met een nieuwe app-serverpoging. Onveilige
timeouts pensioneren nog steeds de vastgelopen app-serverclient en geven de OpenClaw-
sessielane vrij. Ze wissen ook de verouderde native threadbinding in plaats van
automatisch opnieuw te worden afgespeeld. Completion-watch-timeouts tonen Codex-specifieke timeouttekst:
replay-veilige gevallen zeggen dat de response mogelijk onvolledig is, terwijl onveilige gevallen
de gebruiker vragen de huidige status te verifiëren voordat opnieuw wordt geprobeerd. Publieke timeoutdiagnostiek
bevat structurele velden zoals de laatste app-server-notificationmethode,
ruwe assistant-response-item-id/type/role, aantallen actieve requests/items, en de ingeschakelde
watchstatus. Wanneer de laatste melding een ruw assistant-response-item is, bevat die
ook een begrensde preview van assistant-tekst. Ze bevatten geen ruwe prompt- of
toolcontent.

Environment-overrides blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt de beheerde binary wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie heeft
de voorkeur voor herhaalbare deployments omdat dit het plugin-gedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Native Codex-plugins

Native Codex-pluginondersteuning gebruikt de eigen app- en plugin-
mogelijkheden van Codex app-server in dezelfde Codex-thread als de OpenClaw-harnessbeurt. OpenClaw
vertaalt Codex-plugins niet naar synthetische `codex_plugin_*` OpenClaw
dynamische tools.

`codexPlugins` beïnvloedt alleen sessies die de native Codex-harness selecteren. Het
heeft geen effect op ingebouwde harness-runs, normale OpenAI-provider-runs, ACP conversation-
bindings of andere harnesses.

Minimale gemigreerde config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harnesssessie
opzet of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw berekend.
Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset`, of herstart de gateway zodat
toekomstige Codex-harnesssessies met de bijgewerkte appset starten.

Zie voor migratiegeschiktheid, app-inventaris, beleid voor destructieve acties,
elicitations en native plugindiagnostiek
[Native Codex-plugins](/nl/plugins/codex-native-plugins).

OpenAI-side app- en plugintoegang wordt beheerd door het ingelogde Codex-account
en, voor Business- en Enterprise/Edu-workspaces, workspace-appcontroles. Zie
[Codex gebruiken met je ChatGPT-abonnement](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
voor OpenAI's overzicht van account- en workspacecontroles.

## Computer Use

Computer Use wordt behandeld in een eigen installatiehandleiding:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw vendort de desktop-control-app niet en voert
desktopacties niet zelf uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is en laat Codex vervolgens eigenaar zijn van de native MCP-
tool-aanroepen tijdens Codex-mode-beurten.

## Runtimegrenzen

De Codex-harness wijzigt alleen de low-level embedded agent executor.

- OpenClaw dynamische tools worden ondersteund. Codex vraagt OpenClaw om die
  tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.
- Codex-native shell-, patch-, MCP- en native app-tools zijn eigendom van Codex.
  OpenClaw kan geselecteerde native gebeurtenissen observeren of blokkeren via de ondersteunde
  relay, maar herschrijft native toolargumenten niet.
- Codex is eigenaar van native Compaction. OpenClaw houdt een transcriptmirror bij voor kanaal-
  geschiedenis, zoeken, `/new`, `/reset`, en toekomstige model- of harnesswisseling, maar
  vervangt Codex Compaction niet door een OpenClaw- of context-engine-
  summarizer.
- Mediageneratie, media understanding, TTS, approvals en messaging-tool-
  output blijven lopen via de overeenkomende OpenClaw-provider/modelinstellingen.
- `tool_result_persist` is van toepassing op transcripttoolresultaten die eigendom zijn van OpenClaw, niet op
  Codex-native toolresultaatrecords.

Zie voor hooklagen, ondersteunde V1-oppervlakken, native permission handling, queue-
sturing, Codex-feedbackuploadmechanismen en Compaction-details
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime).

## Probleemoplossing

**Codex verschijnt niet als een normale `/model`-provider:** dat is verwacht voor
nieuwe configs. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in, en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt de ingebouwde harness in plaats van Codex:** zorg dat de modelref
`openai/gpt-*` is op de officiële OpenAI-provider en dat de Codex-plugin is
geïnstalleerd en ingeschakeld. Als je strikte bewijslast nodig hebt tijdens het testen, stel provider- of
model-`agentRuntime.id: "codex"` in. Een geforceerde Codex-runtime faalt in plaats van
terug te vallen op OpenClaw.

**OpenAI Codex-runtime valt terug op het API-key-pad:** verzamel een geredigeerd
gatewayfragment dat het model, de runtime, de geselecteerde provider en de fout toont.
Vraag betrokken collaborators om deze read-only opdracht uit te voeren op hun OpenClaw-host:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Nuttige fragmenten bevatten meestal `openai/gpt-5.5` of `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` of `harnessRuntime`,
`candidateProvider: "openai"`, en een `401`-, `Incorrect API key`- of
`No API key`-resultaat. Een gecorrigeerde run zou het OpenAI OAuth-
pad moeten tonen in plaats van een gewone OpenAI API-key-fout.

**Legacy Codex-modelrefsconfig blijft bestaan:** voer `openclaw doctor --fix` uit.
Doctor herschrijft legacy modelrefs naar `openai/*`, verwijdert verouderde sessie- en
whole-agent-runtimepins, en behoudt bestaande auth-profile-overrides.

**De app-server wordt geweigerd:** gebruik Codex app-server `0.125.0` of nieuwer.
Prereleases met dezelfde versie of build-suffixversies zoals
`0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat OpenClaw de
stabiele `0.125.0`-protocolvloer test.

**`/codex status` kan geen verbinding maken:** controleer of de gebundelde `codex`-plugin is
ingeschakeld, dat `plugins.allow` deze bevat wanneer een allowlist is geconfigureerd, en
dat eventuele aangepaste `appServer.command`, `url`, `authToken` of headers geldig zijn.

**Model discovery is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel discovery uit. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
headers, en dat de remote app-server dezelfde Codex app-server-
protocolversie spreekt.

**Native shell- of patch-tools worden geblokkeerd met `Native hook relay unavailable`:**
de Codex-thread probeert nog steeds een native hook relay-id te gebruiken dat OpenClaw niet
langer heeft geregistreerd. Dit is een native Codex-hooktransportprobleem, geen ACP-
backend-, provider-, GitHub- of shell-command-fout. Start een nieuwe sessie in
de betrokken chat met `/new` of `/reset`, en probeer daarna opnieuw een onschuldige opdracht. Als dat
eenmaal werkt maar de volgende native tool-aanroep weer faalt, behandel `/new` dan alleen als tijdelijke
workaround: kopieer de prompt naar een nieuwe sessie nadat je de Codex
app-server of OpenClaw Gateway opnieuw hebt gestart zodat oude threads worden verwijderd en native hook-
registraties opnieuw worden aangemaakt.

**Een niet-Codex-model gebruikt de ingebouwde harness:** dat is verwacht tenzij
provider- of modelruntimebeleid het naar een andere harness routeert. Gewone niet-OpenAI
providerrefs blijven op hun normale providerpad in `auto`-modus.

**Computer Use is geïnstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan het herstel voor de native hook relay hierboven. Zie
[Codex Computer Use](/nl/plugins/codex-computer-use#troubleshooting).

## Gerelateerd

- [Codex harness-referentie](/nl/plugins/codex-harness-reference)
- [Codex harness-runtime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [OpenAI Codex-help](https://help.openai.com/en/collections/14937394-codex)
- [Agent harness-plugins](/nl/plugins/sdk-agent-harness)
- [Plugin-hooks](/nl/plugins/hooks)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Status](/nl/cli/status)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
