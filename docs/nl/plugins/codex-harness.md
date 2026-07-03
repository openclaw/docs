---
read_when:
    - Je wilt de gebundelde Codex app-server-harness gebruiken
    - Je hebt voorbeelden van Codex-harnessconfiguratie nodig
    - Je wilt dat implementaties met alleen Codex falen in plaats van terug te vallen op OpenClaw
summary: Voer ingebedde OpenClaw-agentbeurten uit via het gebundelde Codex-app-serverharnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-07-03T17:29:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

De gebundelde `codex`-Plugin laat OpenClaw ingebedde OpenAI-agentbeurten
uitvoeren via Codex app-server in plaats van de ingebouwde OpenClaw-harness.

Gebruik de Codex-harness wanneer je wilt dat Codex eigenaar is van de
laag-niveau agentsessie: native thread hervatten, native toolvoortzetting,
native Compaction en app-server-uitvoering. OpenClaw blijft eigenaar van
chatkanalen, sessiebestanden, modelselectie, dynamische OpenClaw-tools,
goedkeuringen, medialevering en de zichtbare transcriptspiegel.

De normale installatie gebruikt canonieke OpenAI-modelverwijzingen zoals
`openai/gpt-5.5`. Configureer geen verouderde Codex GPT-verwijzingen. Plaats de
OpenAI-agent-authenticatievolgorde onder `auth.order.openai`; oudere
verouderde Codex-auth-profiel-id's en verouderde Codex-auth-volgordevermeldingen
zijn verouderde staat die wordt gerepareerd door `openclaw doctor --fix`.

Wanneer er geen OpenClaw-sandbox actief is, start OpenClaw Codex
app-server-threads met native Codex-codemodus ingeschakeld, terwijl
code-mode-only standaard uit blijft. Daardoor blijven native Codex-werkruimte-
en codemogelijkheden beschikbaar terwijl dynamische OpenClaw-tools doorgaan via
de app-server-bridge `item/tool/call`. Actieve OpenClaw-sandboxing en beperkt
toolbeleid schakelen native codemodus volledig uit, tenzij je kiest voor het
experimentele sandbox exec-server-pad.

Deze native Codex-functie staat los van
[OpenClaw-codemodus](/nl/reference/code-mode), een opt-in QuickJS-WASI-runtime voor
generieke OpenClaw-runs met een andere `exec`-invoervorm.

Voor de bredere splitsing tussen model/provider/runtime begin je met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelverwijzing, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Vereisten

- OpenClaw met de gebundelde `codex`-Plugin beschikbaar.
- Als je configuratie `plugins.allow` gebruikt, neem dan `codex` op.
- Codex app-server `0.125.0` of nieuwer. De gebundelde Plugin beheert standaard
  een compatibel Codex app-server-binair bestand, dus lokale `codex`-commando's
  op `PATH` hebben geen invloed op normaal opstarten van de harness.
- Codex-authenticatie beschikbaar via `openclaw models auth login --provider openai`,
  een app-server-account in de Codex-home van de agent, of een expliciet
  Codex-API-sleutel-auth-profiel.

Voor authenticatieprioriteit, omgevingsisolatie, aangepaste app-server-commando's,
modelontdekking en alle configuratievelden, zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Snelstart

De meeste gebruikers die Codex in OpenClaw willen, willen dit pad: meld je aan
met een ChatGPT/Codex-abonnement, schakel de gebundelde `codex`-Plugin in en
gebruik een canonieke `openai/gpt-*`-modelverwijzing.

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

Herstart de gateway nadat je Plugin-configuratie hebt gewijzigd. Als een
bestaande chat al een sessie heeft, gebruik dan `/new` of `/reset` voordat je
runtimewijzigingen test, zodat de volgende beurt de harness uit de huidige
configuratie oplost.

## Configuratie

De snelstartconfiguratie is de minimaal werkbare Codex-harnessconfiguratie. Stel
Codex-harnessopties in de OpenClaw-configuratie in en gebruik de CLI alleen voor
Codex-authenticatie:

| Behoefte                               | Instellen                                                                        | Waar                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| De harness inschakelen                 | `plugins.entries.codex.enabled: true`                                            | OpenClaw-configuratie              |
| Een allowlisted Plugin-installatie behouden | Neem `codex` op in `plugins.allow`                                          | OpenClaw-configuratie              |
| OpenAI-agentbeurten via Codex routeren | `agents.defaults.model` of `agents.list[].model` als `openai/gpt-*`              | OpenClaw-agentconfiguratie         |
| Aanmelden met ChatGPT/Codex OAuth      | `openclaw models auth login --provider openai`                                   | CLI-auth-profiel                   |
| API-sleutelback-up voor Codex-runs toevoegen | `openai:*` API-sleutelprofiel vermeld na abonnementsauth in `auth.order.openai` | CLI-auth-profiel + OpenClaw-configuratie |
| Fail-closed wanneer Codex niet beschikbaar is | Provider- of model-`agentRuntime.id: "codex"`                              | OpenClaw-model/provider-configuratie |
| Direct OpenAI API-verkeer gebruiken    | Provider- of model-`agentRuntime.id: "openclaw"` met normale OpenAI-auth         | OpenClaw-model/provider-configuratie |
| App-server-gedrag afstemmen            | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-configuratie          |
| Native Codex-Plugin-apps inschakelen   | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-configuratie          |
| Codex Computer Use inschakelen         | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-configuratie          |

Gebruik `openai/gpt-*`-modelverwijzingen voor door Codex ondersteunde
OpenAI-agentbeurten. Geef de voorkeur aan `auth.order.openai` voor de volgorde
abonnement-eerst/API-sleutel-als-back-up. Bestaande verouderde
Codex-auth-profiel-id's en verouderde Codex-auth-volgorde zijn doctor-only
verouderde staat; schrijf geen nieuwe verouderde Codex GPT-verwijzingen.

Stel `compaction.model` of `compaction.provider` niet in op door Codex
ondersteunde agents. Codex comprimeert via zijn native app-server-threadstaat,
dus OpenClaw negeert die lokale summarizer-overschrijvingen tijdens runtime en
`openclaw doctor --fix` verwijdert ze wanneer de agent Codex gebruikt.

Lossless blijft ondersteund als context-engine voor assemblage, opname en
onderhoud rond Codex-beurten. Configureer dit via
`plugins.slots.contextEngine: "lossless-claw"` en
`plugins.entries.lossless-claw.config.summaryModel`, niet via
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migreert de oude
vorm `compaction.provider: "lossless-claw"` naar de Lossless context-engine-slot
wanneer Codex de actieve runtime is, maar native Codex blijft eigenaar van
Compaction.

De native Codex app-server-harness ondersteunt context-engines die
pre-promptassemblage vereisen. Generieke CLI-backends, waaronder `codex-cli`,
bieden die hostmogelijkheid niet.

Voor door Codex ondersteunde agents start `/compact` native Codex
app-server-Compaction op de gebonden thread. OpenClaw wacht niet op voltooiing,
legt geen OpenClaw-time-out op, herstart de gedeelde app-server niet en valt
niet terug op een context-engine of publieke OpenAI-summarizer. Als de native
Codex-threadbinding ontbreekt of verouderd is, faalt het commando fail-closed,
zodat de operator de echte runtimegrens ziet in plaats van stilzwijgend van
Compaction-backend te wisselen.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In die vorm lopen beide profielen nog steeds via Codex voor `openai/gpt-*`-
agentbeurten. De API-sleutel is alleen een authenticatiefallback, geen verzoek
om over te schakelen naar OpenClaw of gewone OpenAI Responses.

De rest van deze pagina behandelt veelvoorkomende varianten waar gebruikers
tussen moeten kiezen: implementatievorm, fail-closed-routering,
guardian-goedkeuringsbeleid, native Codex-Plugins en Computer Use. Voor volledige
optielijsten, standaardwaarden, enums, ontdekking, omgevingsisolatie,
time-outs en app-server-transportvelden, zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Codex-runtime verifiëren

Gebruik `/status` in de chat waar je Codex verwacht. Een door Codex ondersteunde
OpenAI-agentbeurt toont:

```text
Runtime: OpenAI Codex
```

Controleer daarna de Codex app-server-staat:

```text
/codex status
/codex models
```

`/codex status` rapporteert app-serverconnectiviteit, account, rate limits,
MCP-servers en Skills. `/codex models` vermeldt de live Codex app-server-catalogus
voor de harness en het account. Als `/status` verrassend is, zie
[Probleemoplossing](#troubleshooting).

## Routering en modelselectie

Houd providerverwijzingen en runtimebeleid gescheiden:

- Gebruik `openai/gpt-*` voor OpenAI-agentbeurten via Codex.
- Gebruik geen verouderde Codex GPT-verwijzingen in configuratie. Voer
  `openclaw doctor --fix` uit om verouderde verwijzingen en verouderde
  sessieroutepinnen te repareren.
- `agentRuntime.id: "codex"` is optioneel voor normale OpenAI-automodus, maar
  nuttig wanneer een implementatie fail-closed moet zijn als Codex niet
  beschikbaar is.
- `agentRuntime.id: "openclaw"` laat een provider of model kiezen voor de
  ingebedde OpenClaw-runtime wanneer dat de bedoeling is.
- `/codex ...` bestuurt native Codex app-server-gesprekken vanuit chat.
- ACP/acpx is een apart extern harnesspad. Gebruik dit alleen wanneer de
  gebruiker vraagt om ACP/acpx of een externe harnessadapter.

Veelvoorkomende commandoroutering:

| Gebruikersintentie                                  | Gebruik                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| De huidige chat koppelen                            | `/codex bind [--cwd <path>]`                                                                          |
| Een bestaande Codex-thread hervatten                | `/codex resume <thread-id>`                                                                           |
| Codex-threads weergeven of filteren                 | `/codex threads [filter]`                                                                             |
| Native Codex-Plugins weergeven                      | `/codex plugins list`                                                                                 |
| Een geconfigureerde native Codex-Plugin in- of uitschakelen | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                |
| Een bestaande Codex CLI-sessie op een gekoppeld knooppunt koppelen | `/codex sessions --host <node> [filter]`, daarna `/codex resume <session-id> --host <node> --bind here` |
| Alleen Codex-feedback verzenden                     | `/codex diagnostics [note]`                                                                           |
| Een ACP/acpx-taak starten                           | ACP/acpx-sessiecommando's, niet `/codex`                                                              |

| Usecase                                             | Configureren                                                           | Verifiëren                              | Opmerkingen                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime    | `openai/gpt-*` plus ingeschakelde `codex`-plugin                       | `/status` toont `Runtime: OpenAI Codex` | Aanbevolen pad                        |
| Gesloten falen als Codex niet beschikbaar is         | Provider of model `agentRuntime.id: "codex"`                           | Turn faalt in plaats van ingesloten fallback | Gebruik voor Codex-only implementaties |
| Direct OpenAI API-key-verkeer via OpenClaw           | Provider of model `agentRuntime.id: "openclaw"` en normale OpenAI-auth | `/status` toont OpenClaw-runtime        | Gebruik alleen wanneer OpenClaw bewust is gekozen |
| Legacy-configuratie                                  | legacy Codex GPT-refs                                                  | `openclaw doctor --fix` herschrijft dit | Schrijf nieuwe configuratie niet op deze manier |
| ACP/acpx Codex-adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP-taak-/sessiestatus                  | Los van native Codex-harnas           |

`agents.defaults.imageModel` volgt dezelfde prefix-splitsing. Gebruik `openai/gpt-*`
voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer beeldbegrip
via een begrensde Codex app-server-turn moet lopen. Gebruik geen
legacy Codex GPT-refs; doctor herschrijft die legacy-prefix naar `openai/gpt-*`.

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

Met deze configuratie gebruikt de `main`-agent zijn normale providerpad en gebruikt de
`codex`-agent de Codex app-server.

### Fail-closed Codex-implementatie

Voor OpenAI-agentturns wordt `openai/gpt-*` al naar Codex geresolved wanneer de
gebundelde plugin beschikbaar is. Voeg expliciet runtimebeleid toe wanneer je een geschreven
fail-closed-regel wilt:

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

Met geforceerde Codex faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld, de
app-server te oud is, of de app-server niet kan starten.

## App-serverbeleid

Standaard start de plugin OpenClaw's beheerde Codex-binary lokaal met stdio-
transport. Stel `appServer.command` alleen in wanneer je bewust een ander
uitvoerbaar bestand wilt uitvoeren. Gebruik WebSocket-transport alleen wanneer er al elders een app-server
draait:

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
impliciete YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan toegestane guardian-machtigingen.
Wanneer een OpenClaw-sandbox actief is voor de sessie, schakelt OpenClaw Codex
native Code Mode, gebruikers-MCP-servers en app-backed pluginuitvoering voor die
turn uit, in plaats van te vertrouwen op Codex-hostside sandboxing. Shelltoegang wordt beschikbaar gesteld
via dynamische tools met OpenClaw-sandbox zoals `sandbox_exec` en
`sandbox_process` wanneer de normale exec-/proces-tools beschikbaar zijn.

Gebruik genormaliseerde OpenClaw-execmodus wanneer je Codex native auto-review wilt vóór
sandboxontsnappingen of extra machtigingen:

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

Voor Codex app-server-sessies mappt OpenClaw `tools.exec.mode: "auto"` naar door Codex
Guardian gereviewde goedkeuringen, meestal
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en
`sandbox: "workspace-write"` wanneer de lokale vereisten die waarden toestaan.
In `tools.exec.mode: "auto"` behoudt OpenClaw geen legacy onveilige Codex-
`approvalPolicy: "never"`- of `sandbox: "danger-full-access"`-overrides; gebruik
`tools.exec.mode: "full"` voor een bewuste Codex-houding zonder goedkeuringen. De
legacy-preset `plugins.entries.codex.config.appServer.mode: "guardian"` werkt nog steeds,
maar `tools.exec.mode: "auto"` is het genormaliseerde OpenClaw-oppervlak.

Zie [Machtigingsmodi](/nl/tools/permission-modes) voor de vergelijking op modusniveau met host-execgoedkeuringen en ACPX-machtigingen.

Zie [Codex-harnasreferentie](/nl/plugins/codex-harness-reference) voor elk app-serverveld, auth-volgorde, omgevingsisolatie, discovery en
timeoutgedrag.

## Commando's en diagnostiek

De gebundelde plugin registreert `/codex` als slashcommando op elk kanaal dat
OpenClaw-tekstcommando's ondersteunt.

Native uitvoering en controle vereisen een eigenaar of een `operator.admin` Gateway-
client. Dit omvat het binden of hervatten van threads, het verzenden of stoppen van turns,
het wijzigen van model, fast-mode of machtigingsstatus, compacten of reviewen, en
het loskoppelen van een binding. Andere geautoriseerde afzenders behouden alleen-lezen status-, help-,
account-, model-, thread-, MCP-server-, skill- en bindingsinspectiecommando's.

Veelvoorkomende vormen:

- `/codex status` controleert app-serverconnectiviteit, modellen, account, rate limits,
  MCP-servers en Skills.
- `/codex models` geeft live Codex app-servermodellen weer.
- `/codex threads [filter]` geeft recente Codex app-serverthreads weer.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een
  bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te compacten.
- `/codex review` start Codex native review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat Codex-feedback voor de
  gekoppelde thread wordt verzonden.
- `/codex account` toont account- en rate-limitstatus.
- `/codex mcp` geeft Codex app-server MCP-serverstatus weer.
- `/codex skills` geeft Codex app-server Skills weer.

Begin voor de meeste supportrapporten met `/diagnostics [note]` in het gesprek
waar de bug plaatsvond. Dit maakt één Gateway-diagnostiekrapport en vraagt, voor Codex-
harnassessies, om goedkeuring om de relevante Codex-feedbackbundel te verzenden.
Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en gedrag in
groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload voor de momenteel gekoppelde thread wilt, zonder de volledige Gateway-
diagnostiekbundel.

### Codex-threads lokaal inspecteren

De snelste manier om een slechte Codex-run te inspecteren is vaak om de native Codex-
thread direct te openen:

```bash
codex resume <thread-id>
```

Haal de thread-id op uit het voltooide `/diagnostics`-antwoord, `/codex binding` of
`/codex threads [filter]`.

Zie [Codex-harnasruntime](/nl/plugins/codex-harness-runtime#codex-feedback-upload) voor uploadmechanica en diagnostiekgrenzen op runtimeniveau.

Auth wordt in deze volgorde geselecteerd:

1. Geordende OpenAI-authprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Voer `openclaw doctor --fix` uit om oudere
   legacy Codex-authprofiel-id's en legacy Codex-authvolgorde te migreren.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert het
`CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-childproces. Daardoor
blijven API-keys op Gateway-niveau beschikbaar voor embeddings of directe OpenAI-modellen,
zonder dat native Codex app-server-turns per ongeluk via de API worden gefactureerd.
Expliciete Codex API-key-profielen en lokale stdio env-key-fallback gebruiken app-server-
login in plaats van geërfde childproces-env. WebSocket app-serververbindingen
ontvangen geen Gateway env API-key-fallback; gebruik een expliciet authprofiel of het
eigen account van de externe app-server.
Wanneer native Codex-plugins zijn geconfigureerd, installeert of ververst OpenClaw die
plugins via de verbonden app-server voordat plugin-owned apps aan
de Codex-thread worden aangeboden. `app/list` blijft de bron van waarheid voor app-id's,
toegankelijkheid en metadata, maar OpenClaw bezit de enablementbeslissing per thread:
als beleid een vermelde toegankelijke app toestaat, verzendt OpenClaw
`thread/start.config.apps[appId].enabled = true`, zelfs wanneer `app/list` momenteel
rapporteert dat die app uitgeschakeld is. Dit pad verzint geen appinstallatie voor
onbekende id's; OpenClaw activeert alleen marketplace-plugins met `plugin/install`
en ververst daarna de inventaris.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw de reset-
tijd wanneer Codex er een rapporteert en probeert het volgende geordende authprofiel voor dezelfde
Codex-run. Wanneer de reset-tijd voorbij is, komt het abonnementsprofiel weer in aanmerking
zonder het geselecteerde `openai/gpt-*`-model of de Codex-runtime te wijzigen.

Voor lokale stdio app-serverstarts stelt OpenClaw `CODEX_HOME` in op een per-agent
directory, zodat Codex-configuratie, auth-/accountbestanden, plugin-cache/-data en native
threadstatus standaard niet de persoonlijke `~/.codex` van de operator lezen of schrijven.
OpenClaw behoudt het normale proces-`HOME`; subprocessen die door Codex worden uitgevoerd,
kunnen nog steeds gebruikershomeconfiguratie en tokens vinden, en Codex kan gedeelde
`$HOME/.agents/skills`- en `$HOME/.agents/plugins/marketplace.json`-vermeldingen ontdekken.

Als een implementatie extra omgevingsisolatie nodig heeft, voeg die variabelen dan toe aan
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
subprocessen normale gebruikershomestatus kunnen gebruiken.

Codex-dynamische tools laden standaard als `searchable`. OpenClaw stelt geen
dynamische tools beschikbaar die Codex-native werkruimtebewerkingen dupliceren:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` en `update_plan`. De
meeste resterende OpenClaw-integratietools, zoals berichten, media, cron,
browser, nodes, gateway en `heartbeat_respond`, zijn beschikbaar via Codex-toolzoekopdrachten onder
de `openclaw`-namespace, waardoor de initiële modelcontext kleiner blijft. Webzoekopdrachten
gebruiken standaard Codex' gehoste `web_search`-tool wanneer zoeken is ingeschakeld en er geen
beheerde provider is geselecteerd. Native gehost zoeken en OpenClaw's beheerde
dynamische `web_search`-tool sluiten elkaar uit, zodat beheerd zoeken native
domeinbeperkingen niet kan omzeilen. OpenClaw gebruikt de beheerde tool wanneer gehost zoeken
niet beschikbaar is, expliciet is uitgeschakeld of is vervangen door een geselecteerde beheerde provider.
OpenClaw houdt Codex' zelfstandige `web.run`-extensie uitgeschakeld, omdat
productie-app-serververkeer de door de gebruiker gedefinieerde `web`-namespace weigert.
`tools.web.search.enabled: false` schakelt beide paden uit, net als tool-uitgeschakelde
LLM-only runs. Codex behandelt `"cached"` als een voorkeur en zet dit om naar live
externe toegang voor onbeperkte app-serverbeurten. Automatische beheerde fallback
faalt gesloten wanneer native `allowedDomains` zijn ingesteld, zodat de allowlist niet kan worden
omzeild. Persistente wijzigingen in het effectieve zoekbeleid roteren de gekoppelde Codex-thread
vóór de volgende beurt. Tijdelijke beperkingen per beurt gebruiken een tijdelijke
beperkte thread en behouden de bestaande koppeling om later te hervatten.
`sessions_yield` en bronantwoorden met alleen berichtentools blijven direct, omdat
dat beurtcontrolecontracten zijn. `sessions_spawn` blijft doorzoekbaar, zodat Codex' native
`spawn_agent` het primaire Codex-subagentoppervlak blijft, terwijl expliciete
OpenClaw- of ACP-delegatie nog steeds beschikbaar is via de dynamische
toolnamespace `openclaw`. Heartbeat-samenwerkingsinstructies vertellen Codex om te zoeken naar
`heartbeat_respond` voordat een Heartbeat-beurt wordt beëindigd wanneer de tool nog niet
is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt met een aangepaste Codex
app-server die uitgestelde dynamische tools niet kan doorzoeken, of wanneer je de volledige
toolpayload debugt.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard      | Betekenis                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om OpenClaw-dynamische tools direct in de initiële Codex-toolcontext te plaatsen. |
| `codexDynamicToolsExclude` | `[]`           | Aanvullende namen van OpenClaw-dynamische tools die uit Codex app-serverbeurten moeten worden weggelaten. |
| `codexPlugins`             | uitgeschakeld  | Native Codex-plugin-/app-ondersteuning voor gemigreerde, vanuit de bron geïnstalleerde gecureerde plugins. |

Ondersteunde `appServer`-velden:

| Veld                                          | Standaardwaarde                                        | Betekenis                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                                |
| `command`                                     | beheerd Codex-binair bestand                           | Uitvoerbaar bestand voor stdio-transport. Laat dit niet ingesteld om het beheerde binaire bestand te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                         | WebSocket-URL van de app-server.                                                                                                                                                                                                                                                                                                                                                                |
| `authToken`                                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                   | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio app-server-proces nadat OpenClaw de overgenomen omgeving heeft opgebouwd. OpenClaw behoudt per-agent `CODEX_HOME` en overgenomen `HOME` voor lokale starts.                                                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | Schakel expliciet het tooloppervlak van Codex in dat alleen voor codemodus is. Dynamische OpenClaw-tools blijven bij Codex geregistreerd zodat geneste `tools.*`-aanroepen terugkeren via de app-server-bridge `item/tool/call`.                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | niet ingesteld                                         | Werkruimteroot van de externe Codex app-server. Wanneer dit is ingesteld, leidt OpenClaw de lokale werkruimteroot af uit de opgeloste OpenClaw-werkruimte, behoudt het huidige cwd-achtervoegsel onder deze externe root en stuurt het alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-werkruimteroot ligt, faalt OpenClaw gesloten in plaats van een gateway-lokaal pad naar de externe app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                                | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                                                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Stiltevenster nadat Codex een beurt accepteert of na een beurtgebonden app-server-verzoek terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Completion-inactiviteits- en voortgangsbewaking die wordt gebruikt na een tool-overdracht, voltooiing van een native tool, raw assistant-voortgang na een tool, voltooiing van raw reasoning, of reasoning-voortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij synthese na een tool legitiem langer stil kan blijven dan het uiteindelijke releasebudget van de assistent. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden  | Preset voor YOLO of door guardian beoordeelde uitvoering. Lokale stdio-vereisten die `danger-full-access`, `never`-goedkeuring of de `user`-reviewer weglaten, maken guardian de impliciete standaard.                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` of een toegestane guardian-goedkeuringspolicy | Native Codex-goedkeuringspolicy die naar thread start/resume/turn wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"on-request"` wanneer toegestaan.                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread start/resume wordt gestuurd. Guardian-standaarden geven de voorkeur aan `"workspace-write"` wanneer toegestaan, anders `"read-only"`. Wanneer een OpenClaw-sandbox actief is, gebruiken `danger-full-access`-beurten Codex `workspace-write` met netwerktoegang afgeleid van de egress-instelling van de OpenClaw-sandbox.                         |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-reviewer           | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer toegestaan, anders `guardian_subagent` of `user`. `guardian_subagent` blijft een legacy-alias.                                                                                                                                                                                                          |
| `serviceTier`                                 | niet ingesteld                                         | Optionele Codex app-server-servicetier. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan, `null` wist de overschrijving, en legacy `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                               |
| `networkProxy`                                | uitgeschakeld                                          | Schakel expliciet Codex permissions-profile-netwerken in voor app-server-commando's. OpenClaw definieert de geselecteerde configuratie `permissions.<profile>.network` en selecteert die met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                          |
| `experimental.sandboxExecServer`              | `false`                                                | Preview-opt-in die een door een OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan draaien.                                                                                                                                                                                 |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook
`features.network_proxy.enabled` en `default_permissions` in de Codex-threadconfiguratie
in, zodat het gegenereerde rechtenprofiel door Codex beheerd netwerken kan
starten. Standaard genereert OpenClaw een botsingsbestendige profielnaam
`openclaw-network-<fingerprint>` op basis van de profielbody; gebruik
`profileName` alleen wanneer een stabiele lokale naam vereist is.

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

Als de normale app-server-runtime `danger-full-access` zou zijn, gebruikt het
inschakelen van `networkProxy` werkruimte-achtige bestandssysteemtoegang voor het
gegenereerde rechtenprofiel. Door Codex beheerde netwerkhandhaving is
gesandboxed netwerken, dus een profiel met volledige toegang zou uitgaand
verkeer niet beschermen.
Domeinvermeldingen gebruiken `allow` of `deny`; Unix-socketvermeldingen gebruiken
de Codex-waarden `allow` of `none`.

OpenClaw-beheerde dynamische toolaanroepen worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: Codex-`item/tool/call`-aanvragen gebruiken standaard een OpenClaw-watchdog van 90 seconden. Een positief `timeoutMs`-argument per aanroep verlengt
of verkort dat specifieke toolbudget. De `image_generate`-tool gebruikt
`agents.defaults.imageGenerationModel.timeoutMs` wanneer de toolaanroep geen
eigen timeout opgeeft, of anders een standaardtimeout van 120 seconden voor afbeeldingsgeneratie.
De media-understanding-`image`-tool gebruikt
`tools.media.image.timeoutSeconds` of de mediastandaard van 60 seconden. Voor image
understanding is die timeout van toepassing op de aanvraag zelf en wordt die niet
verminderd door eerder voorbereidend werk. Dynamische toolbudgetten zijn
begrensd op 600000 ms. Bij een timeout breekt OpenClaw het toolsignaal af
waar dat wordt ondersteund en retourneert het een mislukte dynamic-tool-respons aan Codex zodat de beurt
kan doorgaan in plaats van de sessie in `processing` achter te laten.
Deze watchdog is het buitenste dynamische `item/tool/call`-budget; providerspecifieke
aanvraag-timeouts draaien binnen die aanroep en behouden hun eigen timeoutsemantiek.

Nadat Codex een beurt accepteert, en nadat OpenClaw reageert op een beurtgebonden
app-serveraanvraag, verwacht de harness dat Codex voortgang maakt in de huidige beurt en
uiteindelijk de native beurt afrondt met `turn/completed`. Als de app-server
stil blijft gedurende `appServer.turnCompletionIdleTimeoutMs`, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert het een diagnostische timeout en geeft het de
OpenClaw-sessiebaan vrij zodat vervolggesprekken niet achter een verlopen
native beurt in de wachtrij komen te staan. De meeste niet-terminale meldingen voor dezelfde beurt schakelen die korte
watchdog uit omdat Codex heeft aangetoond dat de beurt nog actief is. Tooloverdrachten gebruiken een
langer post-tool idle-budget: nadat OpenClaw een `item/tool/call`-respons
retourneert, nadat native toolitems zoals `commandExecution` zijn voltooid, na onbewerkte
`custom_tool_call_output`-voltooiingen, en na onbewerkte post-tool assistent-
voortgang, onbewerkte redeneervoltooiingen of redeneervoortgang. De bewaker gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer geconfigureerd en
valt anders terug op vijf minuten. Datzelfde post-tool-budget verlengt ook de
voortgangswatchdog voor het stille synthesevenster voordat Codex de volgende
current-turn-gebeurtenis uitzendt. Globale app-servermeldingen, zoals rate-limit-updates,
resetten de turn-idle-voortgang niet. Redeneervoltooiingen, commentary-
`agentMessage`-voltooiingen en onbewerkte pre-tool redeneer- of assistentvoortgang kunnen
worden gevolgd door een automatisch eindantwoord, dus gebruiken ze de antwoordbewaker na voortgang
in plaats van de sessiebaan onmiddellijk vrij te geven. Alleen
definitieve/niet-commentary voltooide `agentMessage`-items en onbewerkte pre-tool
assistentvoltooiingen activeren de assistant-output-vrijgave: als Codex daarna stil blijft
zonder `turn/completed`, onderbreekt OpenClaw naar beste vermogen de native beurt en
geeft het de sessiebaan vrij. Als een andere beurtwatch die vrijgaverace wint,
accepteert OpenClaw nog steeds het voltooide definitieve assistentitem zodra er geen native
aanvraag, item of dynamische toolvoltooiing meer actief is en de
assistant-output-vrijgave nog steeds bij het laatst voltooide item hoort, zonder
latere itemvoltooiing. Dit kan het definitieve antwoord behouden na voltooid toolwerk
zonder de beurt opnieuw af te spelen. Gedeeltelijke assistentdelta's, verlopen eerdere
antwoorden en lege latere voltooiingen komen niet in aanmerking. Replay-veilige stdio-
app-serverfouten,
waaronder turn-completion idle-timeouts zonder assistent-, tool-, actief-item-
of side-effect-bewijs, worden eenmaal opnieuw geprobeerd met een nieuwe app-serverpoging. Onveilige
timeouts beëindigen nog steeds de vastgelopen app-serverclient en geven de OpenClaw-
sessiebaan vrij. Ze wissen ook de verlopen native threadbinding in plaats van automatisch
opnieuw te worden afgespeeld. Completion-watch-timeouts tonen Codex-specifieke timeouttekst:
replay-veilige gevallen zeggen dat de respons mogelijk onvolledig is, terwijl onveilige gevallen
de gebruiker vragen de huidige staat te verifiëren voordat opnieuw wordt geprobeerd. Openbare timeoutdiagnostiek
bevat structurele velden zoals de laatste app-servermeldingsmethode,
id/type/rol van het onbewerkte assistentresponsitem, aantallen actieve aanvragen/items en de geactiveerde
watchstatus. Wanneer de laatste melding een onbewerkt assistentresponsitem is,
bevatten ze ook een begrensde preview van de assistenttekst. Ze bevatten geen onbewerkte prompt- of
toolinhoud.

Omgevingsoverschrijvingen blijven beschikbaar voor lokaal testen:

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
de voorkeur voor herhaalbare deployments omdat het Plugin-gedrag in hetzelfde
beoordeelde bestand houdt als de rest van de Codex-harnessinstellingen.

## Native Codex-Plugins

Ondersteuning voor native Codex-Plugins gebruikt de eigen app- en Plugin-
mogelijkheden van Codex app-server in dezelfde Codex-thread als de OpenClaw-harnessbeurt. OpenClaw
vertaalt Codex-Plugins niet naar synthetische `codex_plugin_*` OpenClaw
dynamische tools.

`codexPlugins` beïnvloedt alleen sessies die de native Codex-harness selecteren. Het
heeft geen effect op ingebouwde harnessruns, normale OpenAI-providerruns, ACP-gespreks-
bindingen of andere harnesses.

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

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harnesssessie opzet
of een verlopen Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw berekend.
Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset` of herstart de Gateway zodat
toekomstige Codex-harnesssessies starten met de bijgewerkte appset.

Voor migratiegeschiktheid, app-inventaris, beleid voor destructieve acties,
elicitations en native Plugin-diagnostiek, zie
[Native Codex-Plugins](/nl/plugins/codex-native-plugins).

OpenAI-zijdige app- en Plugintoegang wordt beheerd door het ingelogde Codex-account
en, voor Business- en Enterprise/Edu-werkruimten, werkruimte-appcontroles. Zie
[Codex gebruiken met je ChatGPT-abonnement](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
voor OpenAI's overzicht van account- en werkruimtecontroles.

## Computer Use

Computer Use wordt behandeld in een eigen installatiegids:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw levert de desktop-control-app niet mee en voert
desktopacties niet zelf uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is, en laat Codex vervolgens eigenaar zijn van de native MCP-
toolaanroepen tijdens beurten in Codex-modus.

## Runtimegrenzen

De Codex-harness wijzigt alleen de laag-niveau embedded agent executor.

- OpenClaw dynamische tools worden ondersteund. Codex vraagt OpenClaw om die
  tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.
- Codex-native shell-, patch-, MCP- en native app-tools zijn eigendom van Codex.
  OpenClaw kan geselecteerde native gebeurtenissen observeren of blokkeren via de ondersteunde
  relay, maar herschrijft native toolargumenten niet.
- Codex is eigenaar van native Compaction. OpenClaw houdt een transcriptspiegel bij voor kanaal-
  geschiedenis, zoeken, `/new`, `/reset` en toekomstige model- of harnesswissels, maar
  vervangt Codex Compaction niet door een OpenClaw- of context-engine-
  samenvatter.
- Mediageneratie, mediabegrip, TTS, goedkeuringen en uitvoer van messaging-tools
  blijven via de bijpassende OpenClaw-provider/modelinstellingen lopen.
- `tool_result_persist` is van toepassing op OpenClaw-beheerde transcript-toolresultaten, niet op
  Codex-native toolresultaatrecords.

Voor hooklagen, ondersteunde V1-oppervlakken, native machtigingsafhandeling, wachtrij-
sturing, uploadmechanica voor Codex-feedback en Compaction-details, zie
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime).

## Probleemoplossing

**Codex verschijnt niet als een normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt de ingebouwde harness in plaats van Codex:** zorg ervoor dat de modelref
`openai/gpt-*` is op de officiële OpenAI-provider en dat de Codex-Plugin is
geïnstalleerd en ingeschakeld. Als je strikt bewijs nodig hebt tijdens het testen, stel provider- of
model-`agentRuntime.id: "codex"` in. Een geforceerde Codex-runtime faalt in plaats van
terug te vallen op OpenClaw.

**OpenAI Codex-runtime valt terug op het API-key-pad:** verzamel een geredigeerd
Gateway-fragment dat het model, de runtime, de geselecteerde provider en de fout toont.
Vraag getroffen bijdragers om deze read-only opdracht uit te voeren op hun OpenClaw-host:

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

Bruikbare fragmenten bevatten meestal `openai/gpt-5.5` of `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` of `harnessRuntime`,
`candidateProvider: "openai"` en een `401`-, `Incorrect API key`- of
`No API key`-resultaat. Een gecorrigeerde run zou het OpenAI OAuth-
pad moeten tonen in plaats van een gewone OpenAI API-key-fout.

**Legacy Codex-modelrefsconfiguratie blijft bestaan:** voer `openclaw doctor --fix` uit.
Doctor herschrijft legacy modelrefs naar `openai/*`, verwijdert verlopen sessie- en
whole-agent runtime-pins en behoudt bestaande auth-profieloverschrijvingen.

**De app-server wordt geweigerd:** gebruik Codex app-server `0.125.0` of nieuwer.
Prereleases met dezelfde versie of build-suffixversies zoals
`0.125.0-alpha.2` of `0.125.0+custom` worden geweigerd omdat OpenClaw de
stabiele `0.125.0`-protocolondergrens test.

**`/codex status` kan geen verbinding maken:** controleer of de gebundelde `codex`-Plugin is
ingeschakeld, of `plugins.allow` deze bevat wanneer een allowlist is geconfigureerd, en
of eventuele aangepaste `appServer.command`, `url`, `authToken` of headers geldig zijn.

**Modelontdekking is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel ontdekking uit. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
headers en of de externe app-server dezelfde Codex app-server-
protocolversie spreekt.

**Native shell- of patch-tools worden geblokkeerd met `Native hook relay unavailable`:**
de Codex-thread probeert nog steeds een native hook relay-id te gebruiken dat OpenClaw niet
meer heeft geregistreerd. Dit is een probleem met het native Codex hook-transport, geen fout in een ACP-
backend, provider, GitHub of shell-opdracht. Start een nieuwe sessie in
de getroffen chat met `/new` of `/reset` en probeer daarna opnieuw een onschadelijke opdracht. Als dat
eenmaal werkt maar de volgende native tool-aanroep opnieuw mislukt, behandel `/new` dan alleen als tijdelijke
workaround: kopieer de prompt naar een nieuwe sessie nadat je de Codex
app-server of OpenClaw Gateway opnieuw hebt gestart, zodat oude threads worden verwijderd en native hook-
registraties opnieuw worden gemaakt.

**Een niet-Codex-model gebruikt het ingebouwde harnas:** dat is verwacht, tenzij
provider- of model-runtimebeleid het naar een ander harnas routeert. Gewone niet-OpenAI
providerrefs blijven in de modus `auto` op hun normale providerpad.

**Computer Use is geinstalleerd maar tools worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een tool
`Native hook relay unavailable` meldt, gebruik dan het bovenstaande native hook relay-herstel. Zie
[Codex Computer Use](/nl/plugins/codex-computer-use#troubleshooting).

## Gerelateerd

- [Codex-harnasreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnasruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [OpenAI Codex-hulp](https://help.openai.com/en/collections/14937394-codex)
- [Agent-harnasplugins](/nl/plugins/sdk-agent-harness)
- [Plugin-hooks](/nl/plugins/hooks)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Status](/nl/cli/status)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
