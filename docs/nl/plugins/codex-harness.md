---
read_when:
    - Je wilt de meegeleverde Codex-app-server-harness gebruiken
    - Je hebt Codex-harnessconfiguratievoorbeelden nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op OpenClaw
summary: Voer OpenClaw-turns van embedded agents uit via de gebundelde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-06-30T14:13:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-Plugin laat OpenClaw ingebedde OpenAI-agentbeurten uitvoeren
via Codex app-server in plaats van de ingebouwde OpenClaw-harness.

Gebruik de Codex-harness wanneer je wilt dat Codex eigenaar is van de
low-level agentsessie: native thread hervatten, native toolvoortzetting, native
Compaction en uitvoering via app-server. OpenClaw blijft eigenaar van
chatkanalen, sessiebestanden, modelselectie, dynamische OpenClaw-tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

De normale installatie gebruikt canonieke OpenAI-modelrefs zoals
`openai/gpt-5.5`. Configureer geen verouderde Codex GPT-refs. Plaats de
OpenAI-agentauthenticatievolgorde onder `auth.order.openai`; oudere verouderde
Codex-authprofiel-id's en verouderde Codex-authvolgordevermeldingen zijn
verouderde state die wordt gerepareerd door `openclaw doctor --fix`.

Wanneer er geen OpenClaw-sandbox actief is, start OpenClaw Codex
app-server-threads met native Codex-codemodus ingeschakeld, terwijl
code-mode-only standaard uit blijft. Zo blijven de native Codex-workspace en
codemogelijkheden beschikbaar terwijl dynamische OpenClaw-tools via de
app-server-bridge `item/tool/call` blijven lopen. Actieve OpenClaw-sandboxing en
beperkt toolbeleid schakelen native codemodus volledig uit, tenzij je kiest voor
het experimentele sandbox exec-server-pad.

Deze Codex-native functie staat los van
[OpenClaw-codemodus](/nl/reference/code-mode), een opt-in QuickJS-WASI-runtime voor
generieke OpenClaw-runs met een andere `exec`-invoervorm.

Begin voor de bredere scheiding tussen model/provider/runtime met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelref, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Vereisten

- OpenClaw met de gebundelde `codex`-Plugin beschikbaar.
- Als je configuratie `plugins.allow` gebruikt, neem dan `codex` op.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard
  een compatibele Codex app-server-binary, dus lokale `codex`-commando's op
  `PATH` hebben geen invloed op het normaal opstarten van de harness.
- Codex-authenticatie beschikbaar via `openclaw models auth login --provider openai`,
  een app-server-account in de Codex-home van de agent, of een expliciet
  Codex API-key-authprofiel.

Zie voor authenticatieprioriteit, omgevingsisolatie, aangepaste
app-server-commando's, modeldetectie en alle configuratievelden de
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Snelstart

De meeste gebruikers die Codex in OpenClaw willen, willen dit pad: meld je aan
met een ChatGPT/Codex-abonnement, schakel de gebundelde `codex`-Plugin in en
gebruik een canonieke `openai/gpt-*`-modelref.

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

Herstart de gateway nadat je de Plugin-configuratie hebt gewijzigd. Als een
bestaande chat al een sessie heeft, gebruik dan `/new` of `/reset` voordat je
runtimewijzigingen test, zodat de volgende beurt de harness vanuit de huidige
configuratie oplost.

## Configuratie

De snelstartconfiguratie is de minimaal bruikbare Codex-harnessconfiguratie. Stel
Codex-harnessopties in de OpenClaw-configuratie in en gebruik de CLI alleen voor
Codex-authenticatie:

| Behoefte                              | Stel in                                                                          | Waar                               |
| ------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| De harness inschakelen                | `plugins.entries.codex.enabled: true`                                            | OpenClaw-configuratie              |
| Een allowlisted Plugin-installatie behouden | Neem `codex` op in `plugins.allow`                                          | OpenClaw-configuratie              |
| OpenAI-agentbeurten via Codex routeren | `agents.defaults.model` of `agents.list[].model` als `openai/gpt-*`             | OpenClaw-agentconfiguratie         |
| Aanmelden met ChatGPT/Codex OAuth     | `openclaw models auth login --provider openai`                                   | CLI-authprofiel                    |
| API-key-back-up toevoegen voor Codex-runs | `openai:*` API-key-profiel vermeld na abonnementsauthenticatie in `auth.order.openai` | CLI-authprofiel + OpenClaw-configuratie |
| Fail-closed wanneer Codex niet beschikbaar is | Provider- of model-`agentRuntime.id: "codex"`                              | OpenClaw-model/provider-configuratie |
| Direct OpenAI API-verkeer gebruiken   | Provider- of model-`agentRuntime.id: "openclaw"` met normale OpenAI-authenticatie | OpenClaw-model/provider-configuratie |
| App-server-gedrag afstemmen           | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-configuratie          |
| Native Codex-Plugin-apps inschakelen  | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-configuratie          |
| Codex Computer Use inschakelen        | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-configuratie          |

Gebruik `openai/gpt-*`-modelrefs voor Codex-backed OpenAI-agentbeurten. Geef de
voorkeur aan `auth.order.openai` voor de volgorde abonnement-eerst/API-key-back-up.
Bestaande verouderde Codex-authprofiel-id's en verouderde Codex-authvolgorde zijn
doctor-only verouderde state; schrijf geen nieuwe verouderde Codex GPT-refs.

Stel `compaction.model` of `compaction.provider` niet in op Codex-backed agents.
Codex comprimeert via zijn native app-server-threadstate, dus OpenClaw negeert
die lokale summarizer-overschrijvingen tijdens runtime en `openclaw doctor --fix`
verwijdert ze wanneer de agent Codex gebruikt.

Lossless blijft ondersteund als contextengine voor assemblage, ingestie en
onderhoud rond Codex-beurten. Configureer dit via
`plugins.slots.contextEngine: "lossless-claw"` en
`plugins.entries.lossless-claw.config.summaryModel`, niet via
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migreert de oude
vorm `compaction.provider: "lossless-claw"` naar de Lossless-contextengine-slot
wanneer Codex de actieve runtime is, maar native Codex blijft eigenaar van
Compaction.

De native Codex app-server-harness ondersteunt contextengines die
pre-promptassemblage vereisen. Generieke CLI-backends, waaronder `codex-cli`,
bieden die hostmogelijkheid niet.

Voor Codex-backed agents start `/compact` native Codex app-server-Compaction op
de gebonden thread. OpenClaw wacht niet op voltooiing, legt geen
OpenClaw-time-out op, herstart de gedeelde app-server niet en valt niet terug op
een contextengine of publieke OpenAI-summarizer. Als de native Codex-threadbinding
ontbreekt of verouderd is, faalt het commando fail-closed zodat de operator de
echte runtimegrens ziet in plaats van dat er stilzwijgend van
Compaction-backend wordt gewisseld.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In die vorm lopen beide profielen nog steeds via Codex voor
`openai/gpt-*`-agentbeurten. De API-key is alleen een authenticatiefallback, geen
verzoek om over te schakelen naar OpenClaw of gewone OpenAI Responses.

De rest van deze pagina behandelt veelvoorkomende varianten waar gebruikers
tussen moeten kiezen: deploymentvorm, fail-closed-routering, guardian
goedkeuringsbeleid, native Codex-Plugins en Computer Use. Zie voor volledige
optielijsten, standaardwaarden, enums, detectie, omgevingsisolatie, time-outs en
app-server-transportvelden de
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Codex-runtime verifiëren

Gebruik `/status` in de chat waar je Codex verwacht. Een Codex-backed
OpenAI-agentbeurt toont:

```text
Runtime: OpenAI Codex
```

Controleer daarna de Codex app-server-state:

```text
/codex status
/codex models
```

`/codex status` rapporteert app-server-connectiviteit, account, rate limits,
MCP-servers en Skills. `/codex models` vermeldt de live Codex
app-server-catalogus voor de harness en het account. Als `/status` onverwacht
is, zie [Probleemoplossing](#troubleshooting).

## Routering en modelselectie

Houd providerrefs en runtimebeleid gescheiden:

- Gebruik `openai/gpt-*` voor OpenAI-agentbeurten via Codex.
- Gebruik geen verouderde Codex GPT-refs in de configuratie. Voer
  `openclaw doctor --fix` uit om verouderde refs en oude sessieroutepins te
  repareren.
- `agentRuntime.id: "codex"` is optioneel voor normale OpenAI-automodus, maar
  nuttig wanneer een deployment fail-closed moet zijn als Codex niet beschikbaar
  is.
- `agentRuntime.id: "openclaw"` laat een provider of model kiezen voor de
  ingebedde OpenClaw-runtime wanneer dat de bedoeling is.
- `/codex ...` beheert native Codex app-server-gesprekken vanuit de chat.
- ACP/acpx is een afzonderlijk extern harnesspad. Gebruik dit alleen wanneer de
  gebruiker vraagt om ACP/acpx of een externe harnessadapter.

Veelvoorkomende commandoroutering:

| Gebruikersintentie                                  | Gebruik                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| De huidige chat koppelen                            | `/codex bind [--cwd <path>]`                                                                          |
| Een bestaande Codex-thread hervatten                | `/codex resume <thread-id>`                                                                           |
| Codex-threads weergeven of filteren                 | `/codex threads [filter]`                                                                             |
| Native Codex-Plugins weergeven                      | `/codex plugins list`                                                                                 |
| Een geconfigureerde native Codex-Plugin in- of uitschakelen | `/codex plugins enable <name>`, `/codex plugins disable <name>`                              |
| Een bestaande Codex CLI-sessie op een gekoppelde node koppelen | `/codex sessions --host <node> [filter]`, daarna `/codex resume <session-id> --host <node> --bind here` |
| Alleen Codex-feedback verzenden                     | `/codex diagnostics [note]`                                                                           |
| Een ACP/acpx-taak starten                           | ACP/acpx-sessiecommando's, niet `/codex`                                                              |

| Usecase                                              | Configureren                                                          | Verifiëren                              | Opmerkingen                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime    | `openai/gpt-*` plus ingeschakelde `codex`-plugin                      | `/status` toont `Runtime: OpenAI Codex` | Aanbevolen pad                        |
| Gesloten falen als Codex niet beschikbaar is         | Provider of model `agentRuntime.id: "codex"`                          | Turn mislukt in plaats van ingebedde fallback | Gebruik voor Codex-only deployments |
| Rechtstreeks OpenAI API-key-verkeer via OpenClaw     | Provider of model `agentRuntime.id: "openclaw"` en normale OpenAI-auth | `/status` toont OpenClaw-runtime        | Alleen gebruiken wanneer OpenClaw bewust is |
| Legacy-config                                        | legacy Codex GPT-refs                                                 | `openclaw doctor --fix` herschrijft dit | Schrijf nieuwe config niet op deze manier |
| ACP/acpx Codex-adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                              | ACP-taak-/sessiestatus                  | Afzonderlijk van native Codex-harnas  |

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik `openai/gpt-*`
voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer beeldbegrip
via een begrensde Codex app-server-turn moet lopen. Gebruik geen
legacy Codex GPT-refs; doctor herschrijft die legacy-prefix naar `openai/gpt-*`.

## Deploymentpatronen

### Basale Codex-deployment

Gebruik de quickstart-config wanneer alle OpenAI-agent-turns standaard Codex
moeten gebruiken.

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

### Gemengde provider-deployment

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

Met deze config gebruikt de `main`-agent zijn normale providerpad en de
`codex`-agent gebruikt Codex app-server.

### Gesloten falende Codex-deployment

Voor OpenAI-agent-turns wordt `openai/gpt-*` al naar Codex omgezet wanneer de
gebundelde plugin beschikbaar is. Voeg expliciet runtimebeleid toe wanneer je een
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

Met afgedwongen Codex faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
app-server te oud is, of de app-server niet kan starten.

## App-serverbeleid

Standaard start de plugin de door OpenClaw beheerde Codex-binary lokaal met stdio-
transport. Stel `appServer.command` alleen in wanneer je bewust een ander
uitvoerbaar bestand wilt draaien. Gebruik WebSocket-transport alleen wanneer elders al
een app-server draait:

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

Lokale stdio app-server-sessies gebruiken standaard de vertrouwde lokale operatorhouding:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Als lokale Codex-vereisten die
impliciete YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan toegestane guardian-permissies.
Wanneer een OpenClaw-sandbox actief is voor de sessie, schakelt OpenClaw Codex
native Code Mode, gebruikers-MCP-servers en app-ondersteunde pluginuitvoering voor die
turn uit in plaats van te vertrouwen op Codex host-side sandboxing. Shelltoegang wordt
via door OpenClaw-sandbox ondersteunde dynamische tools zoals `sandbox_exec` en
`sandbox_process` beschikbaar gemaakt wanneer de normale exec-/proces-tools beschikbaar zijn.

Gebruik genormaliseerde OpenClaw exec-modus wanneer je Codex native auto-review wilt vóór
sandbox-escapes of extra permissies:

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

Voor Codex app-server-sessies koppelt OpenClaw `tools.exec.mode: "auto"` aan door Codex
Guardian beoordeelde approvals, meestal
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en
`sandbox: "workspace-write"` wanneer de lokale vereisten die waarden toestaan.
In `tools.exec.mode: "auto"` behoudt OpenClaw geen legacy onveilige Codex-
`approvalPolicy: "never"`- of `sandbox: "danger-full-access"`-overrides; gebruik
`tools.exec.mode: "full"` voor een bewuste Codex-houding zonder approval. De
legacy-preset `plugins.entries.codex.config.appServer.mode: "guardian"` werkt nog
steeds, maar `tools.exec.mode: "auto"` is het genormaliseerde OpenClaw-oppervlak.

Voor de vergelijking op modusniveau met host-exec-approvals en ACPX-permissies,
zie [Permissiemodi](/nl/tools/permission-modes).

Voor elk app-server-veld, auth-volgorde, omgevingsisolatie, discovery en
timeoutgedrag, zie [Codex-harnasreferentie](/nl/plugins/codex-harness-reference).

## Commando's en diagnostiek

De gebundelde plugin registreert `/codex` als slash-command op elk kanaal dat
OpenClaw-tekstcommando's ondersteunt.

Native uitvoering en besturing vereisen een owner of een `operator.admin` Gateway-
client. Dit omvat het binden of hervatten van threads, het verzenden of stoppen van turns,
het wijzigen van model, fast-mode of permissiestatus, compacten of reviewen, en
het loskoppelen van een binding. Andere geautoriseerde afzenders behouden alleen-lezen status-, help-,
account-, model-, thread-, MCP-server-, skill- en bindinginspectiecommando's.

Veelvoorkomende vormen:

- `/codex status` controleert app-serverconnectiviteit, modellen, account, rate limits,
  MCP-servers en skills.
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
- `/codex skills` toont Codex app-server-skills.

Begin voor de meeste supportrapporten met `/diagnostics [note]` in het gesprek
waar de bug plaatsvond. Dit maakt één Gateway-diagnoserapport en vraagt, voor Codex-
harnassessies, toestemming om de relevante Codex-feedbackbundel te verzenden.
Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en gedrag in
groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload wilt voor de momenteel gekoppelde thread zonder de volledige Gateway-
diagnosebundel.

### Codex-threads lokaal inspecteren

De snelste manier om een slechte Codex-run te inspecteren is vaak om de native Codex-
thread rechtstreeks te openen:

```bash
codex resume <thread-id>
```

Haal de thread-id uit het voltooide `/diagnostics`-antwoord, `/codex binding` of
`/codex threads [filter]`.

Voor uploadmechanica en diagnostiekgrenzen op runtimeniveau, zie
[Codex-harnasruntime](/nl/plugins/codex-harness-runtime#codex-feedback-upload).

Auth wordt in deze volgorde geselecteerd:

1. Geordende OpenAI-authprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Voer `openclaw doctor --fix` uit om oudere
   legacy Codex-authprofiel-id's en legacy Codex-authvolgorde te migreren.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts, `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Daardoor
blijven API-keys op Gateway-niveau beschikbaar voor embeddings of rechtstreekse OpenAI-modellen
zonder dat native Codex app-server-turns per ongeluk via de API worden gefactureerd.
Expliciete Codex API-key-profielen en lokale stdio env-key-fallback gebruiken app-server-
login in plaats van geërfde childproces-env. WebSocket app-server-verbindingen
ontvangen geen Gateway env API-key-fallback; gebruik een expliciet authprofiel of het
eigen account van de externe app-server.
Wanneer native Codex-plugins zijn geconfigureerd, installeert of ververst OpenClaw die
plugins via de verbonden app-server voordat plugin-owned apps aan
de Codex-thread worden blootgesteld. `app/list` blijft de bron van waarheid voor app-id's,
toegankelijkheid en metadata, maar OpenClaw bezit de beslissing over inschakeling per thread:
als beleid een vermelde toegankelijke app toestaat, stuurt OpenClaw
`thread/start.config.apps[appId].enabled = true`, zelfs wanneer `app/list` momenteel
rapporteert dat die app uitgeschakeld is. Dit pad verzint geen appinstallatie voor
onbekende id's; OpenClaw activeert alleen marketplace-plugins met `plugin/install`
en ververst daarna de inventaris.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw de resettijd
wanneer Codex er een rapporteert en probeert het het volgende geordende authprofiel voor dezelfde
Codex-run. Wanneer de resettijd voorbij is, komt het abonnementsprofiel weer in aanmerking
zonder het geselecteerde `openai/gpt-*`-model of de Codex-runtime te wijzigen.

Voor lokale stdio app-server-starts stelt OpenClaw `CODEX_HOME` in op een directory per agent
zodat Codex-config, auth-/accountbestanden, plugincache/-data en native
threadstatus standaard niet de persoonlijke `~/.codex` van de operator lezen of schrijven.
OpenClaw behoudt de normale proces-`HOME`; door Codex uitgevoerde subprocessen
kunnen nog steeds user-home-config en tokens vinden, en Codex kan gedeelde
`$HOME/.agents/skills`- en `$HOME/.agents/plugins/marketplace.json`-entries ontdekken.

Als een deployment extra omgevingsisolatie nodig heeft, voeg die variabelen toe aan
`appServer.clearEnv`:

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

`appServer.clearEnv` beïnvloedt alleen het gespawnde Codex app-server-childproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens lokale start-
normalisatie: `CODEX_HOME` blijft per agent, en `HOME` blijft geërfd zodat
subprocessen normale user-home-status kunnen gebruiken.

Dynamische Codex-tools gebruiken standaard `searchable` laden. OpenClaw stelt geen
dynamische tools beschikbaar die Codex-native werkruimtebewerkingen dupliceren:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` en `update_plan`. De
meeste resterende OpenClaw-integratietools, zoals berichten, media, Cron,
browser, nodes, Gateway en `heartbeat_respond`, zijn beschikbaar via
Codex-toolzoekfunctie onder de naamruimte `openclaw`, waardoor de initiële
modelcontext kleiner blijft. Webzoeken gebruikt standaard Codex' gehoste
`web_search`-tool wanneer zoeken is ingeschakeld en er geen beheerde provider is
geselecteerd. Native gehost zoeken en OpenClaw's beheerde dynamische
`web_search`-tool sluiten elkaar uit, zodat beheerd zoeken native
domeinbeperkingen niet kan omzeilen. OpenClaw gebruikt de beheerde tool wanneer
gehost zoeken niet beschikbaar is, expliciet is uitgeschakeld of wordt vervangen
door een geselecteerde beheerde provider. OpenClaw houdt Codex' zelfstandige
`web.run`-extensie uitgeschakeld omdat verkeer van de productie-app-server de
door de gebruiker gedefinieerde `web`-naamruimte weigert.
`tools.web.search.enabled: false` schakelt beide paden uit, net als
tool-uitgeschakelde LLM-only runs. Codex behandelt `"cached"` als een voorkeur
en lost dit op naar live externe toegang voor onbeperkte app-server-beurten.
Automatische beheerde fallback faalt gesloten wanneer native `allowedDomains`
zijn ingesteld, zodat de allowlist niet kan worden omzeild. Persistente
wijzigingen in effectief zoekbeleid roteren de gebonden Codex-thread vóór de
volgende beurt. Tijdelijke beperkingen per beurt gebruiken een tijdelijke
beperkte thread en behouden de bestaande binding voor later hervatten.
`sessions_yield` en bronantwoorden met alleen berichttools blijven direct omdat
dat beurtcontrolecontracten zijn. `sessions_spawn` blijft doorzoekbaar, zodat
Codex' native `spawn_agent` het primaire Codex-subagentoppervlak blijft, terwijl
expliciete OpenClaw- of ACP-delegatie nog steeds beschikbaar is via de
dynamische toolnaamruimte `openclaw`. Heartbeat-samenwerkingsinstructies
vertellen Codex om naar `heartbeat_respond` te zoeken voordat een
Heartbeat-beurt wordt beëindigd wanneer de tool nog niet is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt
met een aangepaste Codex-app-server die uitgestelde dynamische tools niet kan
zoeken, of bij het debuggen van de volledige toolpayload.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard      | Betekenis                                                                                      |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om OpenClaw-dynamische tools direct in de initiële Codex-toolcontext te zetten. |
| `codexDynamicToolsExclude` | `[]`           | Extra namen van OpenClaw-dynamische tools om weg te laten uit Codex-app-server-beurten.         |
| `codexPlugins`             | uitgeschakeld  | Native Codex-plugin-/app-ondersteuning voor gemigreerde, vanuit bron geïnstalleerde curated plugins. |

Ondersteunde `appServer`-velden:

| Veld                                          | Standaard                                              | Betekenis                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                                |
| `command`                                     | beheerd Codex-binair bestand                           | Uitvoerbaar bestand voor stdio-transport. Laat dit uitgeschakeld om het beheerde binaire bestand te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                         | WebSocket-URL voor de app-server.                                                                                                                                                                                                                                                                                                                                                               |
| `authToken`                                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                   | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                   | Extra namen van omgevingsvariabelen die worden verwijderd uit het voortgebrachte stdio-app-serverproces nadat OpenClaw de overgenomen omgeving heeft opgebouwd. OpenClaw behoudt per agent `CODEX_HOME` en overgenomen `HOME` voor lokale starts.                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | Kies voor het tooloppervlak van Codex dat alleen voor code-modus is. Dynamische OpenClaw-tools blijven geregistreerd bij Codex, zodat geneste `tools.*`-aanroepen terugkomen via de app-serverbrug `item/tool/call`.                                                                                                                                                                            |
| `remoteWorkspaceRoot`                         | niet ingesteld                                         | Externe werkruimteroot van de Codex-app-server. Wanneer dit is ingesteld, leidt OpenClaw de lokale werkruimteroot af uit de opgeloste OpenClaw-werkruimte, behoudt het huidige cwd-achtervoegsel onder deze externe root en stuurt het alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-werkruimteroot ligt, faalt OpenClaw gesloten in plaats van een gateway-lokaal pad naar de externe app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                                | Time-out voor control-plane-aanroepen van de app-server.                                                                                                                                                                                                                                                                                                                                        |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Stil venster nadat Codex een beurt accepteert of na een beurtgebonden app-serververzoek terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                             |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bewaking voor voltooiingsinactiviteit en voortgang die wordt gebruikt na een tool-overdracht, voltooiing van een native tool, ruwe assistentvoortgang na een tool, voltooiing van ruwe redenering of redeneervoortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij synthese na een tool terecht langer stil kan blijven dan het budget voor de uiteindelijke assistent-release. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO niet toestaan | Voorinstelling voor YOLO- of door guardian beoordeelde uitvoering. Lokale stdio-vereisten die `danger-full-access`, `never`-goedkeuring of de `user`-beoordelaar weglaten, maken guardian de impliciete standaard.                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` of een toegestane guardian-goedkeuringspolicy | Native Codex-goedkeuringspolicy die naar thread starten/hervatten/beurt wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"on-request"` wanneer toegestaan.                                                                                                                                                                                                                           |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread starten/hervatten wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"workspace-write"` wanneer toegestaan, anders `"read-only"`. Wanneer een OpenClaw-sandbox actief is, gebruiken `danger-full-access`-beurten Codex `workspace-write` met netwerktoegang afgeleid van de egress-instelling van de OpenClaw-sandbox.                         |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-beoordelaar         | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer toegestaan, anders `guardian_subagent` of `user`. `guardian_subagent` blijft een legacy alias.                                                                                                                                                                                                          |
| `serviceTier`                                 | niet ingesteld                                         | Optionele servicelaag van de Codex-app-server. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan, `null` wist de overschrijving en legacy `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                        |
| `networkProxy`                                | uitgeschakeld                                          | Kies voor Codex permissions-profile-netwerken voor app-serveropdrachten. OpenClaw definieert de geselecteerde configuratie `permissions.<profile>.network` en selecteert deze met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | Preview-opt-in die een door de OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan draaien.                                                                                                                                                                                  |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook
`features.network_proxy.enabled` en `default_permissions` in de Codex-threadconfiguratie in,
zodat het gegenereerde permissieprofiel door Codex beheerd netwerken kan starten.
Standaard genereert OpenClaw een botsingsbestendige profielnaam
`openclaw-network-<fingerprint>` uit de profielbody; gebruik `profileName`
alleen wanneer een stabiele lokale naam vereist is.

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

Als de normale app-serverruntime `danger-full-access` zou zijn, gebruikt het
inschakelen van `networkProxy` bestandssysteemtoegang in werkruimtestijl voor
het gegenereerde permissieprofiel. Door Codex beheerde netwerkhandhaving is
gesandboxed netwerken, dus een full-access-profiel zou uitgaand verkeer niet
beschermen. Domeinvermeldingen gebruiken `allow` of `deny`; Unix-socketvermeldingen
gebruiken de Codex-waarden `allow` of `none`.

OpenClaw-eigen dynamische hulpmiddelaanroepen worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: Codex-`item/tool/call`-verzoeken gebruiken standaard
een OpenClaw-bewaker van 90 seconden. Een positief `timeoutMs`-argument per aanroep verlengt
of verkort dat specifieke hulpmiddelbudget. Het `image_generate`-hulpmiddel gebruikt
`agents.defaults.imageGenerationModel.timeoutMs` wanneer de hulpmiddelaanroep geen
eigen time-out opgeeft, of anders een standaardwaarde van 120 seconden voor afbeeldingsgeneratie.
Het `image`-hulpmiddel voor mediabegrip gebruikt
`tools.media.image.timeoutSeconds` of de standaardwaarde van 60 seconden voor media. Voor afbeeldingsbegrip
geldt die time-out voor het verzoek zelf en wordt deze niet
verminderd door eerder voorbereidingswerk. Dynamische hulpmiddelbudgetten worden
afgetopt op 600000 ms. Bij een time-out breekt OpenClaw het hulpmiddelsignaal af
waar dit wordt ondersteund en retourneert het een mislukte dynamische-hulpmiddelrespons aan Codex zodat de beurt
kan doorgaan in plaats van de sessie in `processing` achter te laten.
Deze bewaker is het buitenste dynamische `item/tool/call`-budget; aanbiederspecifieke
verzoektime-outs lopen binnen die aanroep en behouden hun eigen time-outsemantiek.

Nadat Codex een beurt accepteert, en nadat OpenClaw reageert op een beurtgebonden
app-serververzoek, verwacht het harnas dat Codex voortgang maakt in de huidige beurt en
uiteindelijk de eigen beurt afrondt met `turn/completed`. Als de app-server
stilvalt gedurende `appServer.turnCompletionIdleTimeoutMs`, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert het een diagnostische time-out en geeft het de
OpenClaw-sessierij vrij zodat vervolgchatberichten niet achter een vastgelopen
eigen beurt worden geplaatst. De meeste niet-terminale meldingen voor dezelfde beurt schakelen die korte
bewaker uit omdat Codex heeft bewezen dat de beurt nog actief is. Hulpmiddeloverdrachten gebruiken een
langer post-hulpmiddel-inactiviteitsbudget: nadat OpenClaw een `item/tool/call`-
respons retourneert, nadat eigen hulpmiddelitems zoals `commandExecution` zijn voltooid, na ruwe
`custom_tool_call_output`-voltooiingen, en na ruwe assistentvoortgang na een hulpmiddel,
ruwe redeneervoltooiingen of redeneervoortgang. De bewaker gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer dit is geconfigureerd en
valt anders terug op vijf minuten. Datzelfde post-hulpmiddelbudget verlengt ook de
voortgangsbewaker voor het stille syntheservenster voordat Codex de volgende
huidige-beurtgebeurtenis uitzendt. Globale app-servermeldingen, zoals updates over snelheidslimieten,
resetten de voortgang bij beurtinactiviteit niet. Redeneervoltooiingen, voltooiingen van commentaar-
`agentMessage`, en ruwe redeneer- of assistentvoortgang vóór een hulpmiddel kunnen
worden gevolgd door een automatisch eindantwoord, dus ze gebruiken de antwoordbewaker na voortgang
in plaats van de sessierij direct vrij te geven. Alleen
voltooide definitieve/niet-commentaar-`agentMessage`-items en ruwe
assistentvoltooiingen vóór een hulpmiddel activeren de vrijgave op assistentuitvoer: als Codex daarna stilvalt
zonder `turn/completed`, onderbreekt OpenClaw naar beste vermogen de eigen beurt en
geeft het de sessierij vrij. Herhalingsveilige stdio-app-serverfouten, inclusief
time-outs bij beurtvoltooiingsinactiviteit zonder bewijs van assistent, hulpmiddel, actief item of
neveneffect, worden één keer opnieuw geprobeerd op een nieuwe app-serverpoging. Onveilige
time-outs beëindigen nog steeds de vastgelopen app-serverclient en geven de OpenClaw-
sessierij vrij. Ze wissen ook de verouderde binding met de eigen thread in plaats van
automatisch opnieuw te worden afgespeeld. Time-outs van voltooiingsbewaking tonen Codex-specifieke time-outtekst:
herhalingsveilige gevallen zeggen dat de respons mogelijk onvolledig is, terwijl onveilige gevallen
de gebruiker vertellen de huidige staat te verifiëren voordat opnieuw wordt geprobeerd. Publieke time-outdiagnostiek
bevat structurele velden zoals de laatste app-servermeldingsmethode,
id/type/rol van het ruwe assistentresponsitem, aantallen actieve verzoeken/items en de geactiveerde
bewakingsstatus. Wanneer de laatste melding een ruw assistentresponsitem is, bevatten ze
ook een begrensd voorbeeld van assistenttekst. Ze bevatten geen ruwe prompt- of
hulpmiddelinhoud.

Omgevingsoverschrijvingen blijven beschikbaar voor lokaal testen:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt het beheerde binaire bestand wanneer
`appServer.command` niet is ingesteld.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Configuratie heeft
de voorkeur voor herhaalbare implementaties omdat dit het Plugin-gedrag in hetzelfde
beoordeelde bestand houdt als de rest van de Codex-harnasconfiguratie.

## Native Codex-plugins

Ondersteuning voor native Codex-plugins gebruikt de eigen app- en Plugin-
mogelijkheden van Codex app-server in dezelfde Codex-thread als de OpenClaw-harnasbeurt. OpenClaw
vertaalt Codex-plugins niet naar synthetische `codex_plugin_*` OpenClaw-
dynamische hulpmiddelen.

`codexPlugins` heeft alleen invloed op sessies die het native Codex-harnas selecteren. Het
heeft geen effect op ingebouwde harnasuitvoeringen, normale OpenAI-aanbiederuitvoeringen, ACP-gespreks-
bindingen of andere harnassen.

Minimale gemigreerde configuratie:

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

De app-configuratie van de thread wordt berekend wanneer OpenClaw een Codex-harnassessie tot stand brengt
of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw berekend.
Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset`, of herstart de Gateway zodat
toekomstige Codex-harnassessies starten met de bijgewerkte app-set.

Zie voor geschiktheid voor migratie, app-inventaris, beleid voor destructieve acties,
uitvragingen en native Plugin-diagnostiek
[Native Codex-plugins](/nl/plugins/codex-native-plugins).

App- en Plugin-toegang aan OpenAI-zijde wordt beheerd door het aangemelde Codex-account
en, voor Business- en Enterprise/Edu-werkruimten, app-beheer in de werkruimte. Zie
[Codex gebruiken met je ChatGPT-abonnement](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
voor OpenAI's overzicht van account- en werkruimtebeheer.

## Computer Use

Computer Use wordt behandeld in een eigen installatiehandleiding:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw levert de desktopbesturingsapp niet mee en voert zelf geen
desktopacties uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex vervolgens de eigen MCP-
hulpmiddelaanroepen beheren tijdens beurten in Codex-modus.

## Runtimegrenzen

Het Codex-harnas wijzigt alleen de laag-niveau ingebedde agentuitvoerder.

- OpenClaw-dynamische hulpmiddelen worden ondersteund. Codex vraagt OpenClaw om die
  hulpmiddelen uit te voeren, dus OpenClaw blijft in het uitvoeringspad.
- Codex-eigen shell-, patch-, MCP- en native app-hulpmiddelen zijn eigendom van Codex.
  OpenClaw kan geselecteerde native gebeurtenissen observeren of blokkeren via het ondersteunde
  relais, maar herschrijft geen argumenten van native hulpmiddelen.
- Codex beheert native Compaction. OpenClaw houdt een transcriptspiegel bij voor kanaal-
  geschiedenis, zoeken, `/new`, `/reset`, en toekomstige model- of harnaswisselingen, maar
  vervangt Codex Compaction niet door een OpenClaw- of context-engine-
  samenvatter.
- Mediageneratie, mediabegrip, TTS, goedkeuringen en uitvoer van berichtentools
  blijven verlopen via de overeenkomende OpenClaw-aanbieder-/modelinstellingen.
- `tool_result_persist` is van toepassing op OpenClaw-eigen transcripthulpmiddelresultaten, niet op
  Codex-native hulpmiddelresultaatrecords.

Zie voor haaklagen, ondersteunde V1-oppervlakken, native machtigingsafhandeling, wachtrij-
sturing, uploadmechanica voor Codex-feedback en Compaction-details
[Codex-harnasruntime](/nl/plugins/codex-harness-runtime).

## Probleemoplossing

**Codex verschijnt niet als een normale `/model`-aanbieder:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt het ingebouwde harnas in plaats van Codex:** zorg ervoor dat de modelverwijzing
`openai/gpt-*` is op de officiële OpenAI-aanbieder en dat de Codex-Plugin is
geïnstalleerd en ingeschakeld. Als je strikt bewijs nodig hebt tijdens het testen, stel dan aanbieder- of
model-`agentRuntime.id: "codex"` in. Een geforceerde Codex-runtime faalt in plaats van
terug te vallen op OpenClaw.

**OpenAI Codex-runtime valt terug op het API-sleutelpad:** verzamel een geredigeerd
Gateway-fragment dat het model, de runtime, de geselecteerde aanbieder en de fout toont.
Vraag getroffen medewerkers om deze alleen-lezen opdracht op hun OpenClaw-host uit te voeren:

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
`No API key`-resultaat. Een gecorrigeerde uitvoering zou het OpenAI OAuth-
pad moeten tonen in plaats van een gewone OpenAI API-sleutelfout.

**Verouderde configuratie met Codex-modelverwijzingen blijft aanwezig:** voer `openclaw doctor --fix` uit.
Doctor herschrijft verouderde modelverwijzingen naar `openai/*`, verwijdert verouderde sessie- en
runtimepinnen voor hele agents, en behoudt bestaande overschrijvingen van authenticatieprofielen.

**De app-server wordt geweigerd:** gebruik Codex app-server `0.125.0` of nieuwer.
Pre-releases met dezelfde versie of versies met buildsuffix zoals
`0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat OpenClaw de
stabiele protocolondergrens `0.125.0` test.

**`/codex status` kan geen verbinding maken:** controleer of de meegeleverde `codex`-Plugin is
ingeschakeld, dat `plugins.allow` deze bevat wanneer een toestemmingslijst is geconfigureerd, en
dat eventuele aangepaste `appServer.command`, `url`, `authToken` of headers geldig zijn.

**Modelontdekking is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel ontdekking uit. Zie
[Codex-harnasreferentie](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
headers, en dat de externe app-server dezelfde Codex app-server-
protocolversie spreekt.

**Native shell- of patchhulpmiddelen worden geblokkeerd met `Native hook relay unavailable`:**
de Codex-thread probeert nog steeds een native haakrelais-id te gebruiken dat OpenClaw niet
langer heeft geregistreerd. Dit is een native Codex-haaktransportprobleem, geen ACP-
backend-, aanbieder-, GitHub- of shellopdrachtfout. Start een nieuwe sessie in
de getroffen chat met `/new` of `/reset`, en probeer daarna opnieuw een onschuldige opdracht. Als dat
één keer werkt maar de volgende native hulpmiddelaanroep opnieuw faalt, behandel `/new` dan alleen als tijdelijke
oplossing: kopieer de prompt naar een nieuwe sessie nadat je Codex
app-server of OpenClaw Gateway opnieuw hebt gestart zodat oude threads worden verwijderd en native haak-
registraties opnieuw worden aangemaakt.

**Een niet-Codex-model gebruikt het ingebouwde harnas:** dat is verwacht tenzij
aanbieder- of modelruntimebeleid het naar een ander harnas routeert. Gewone niet-OpenAI-
aanbiederverwijzingen blijven in `auto`-modus op hun normale aanbiederpad.

**Computer Use is geïnstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan het herstel voor native hook relay hierboven. Zie
[Codex Computer Use](/nl/plugins/codex-computer-use#troubleshooting).

## Gerelateerd

- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [OpenAI Codex-help](https://help.openai.com/en/collections/14937394-codex)
- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
- [Plugin-hooks](/nl/plugins/hooks)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Status](/nl/cli/status)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
