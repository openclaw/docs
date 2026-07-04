---
read_when:
    - Je wilt de meegeleverde Codex app-server-harness gebruiken
    - Je hebt configuratievoorbeelden voor de Codex-harness nodig
    - Je wilt dat Codex-only implementaties falen in plaats van terug te vallen op OpenClaw
summary: Voer OpenClaw embedded agent-turns uit via de meegeleverde Codex app-server-harness
title: Codex-harnas
x-i18n:
    generated_at: "2026-07-04T10:51:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

De meegeleverde `codex` Plugin laat OpenClaw ingebedde OpenAI-agentbeurten uitvoeren
via Codex app-server in plaats van de ingebouwde OpenClaw-harness.

Gebruik de Codex-harness wanneer je wilt dat Codex eigenaar is van de low-level agentsessie:
native thread hervatten, native toolvoortzetting, native compaction en
app-server-uitvoering. OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie,
dynamische OpenClaw-tools, goedkeuringen, medialevering en de zichtbare
transcriptspiegel.

De normale configuratie gebruikt canonieke OpenAI-modelrefs zoals `openai/gpt-5.5`.
Configureer geen verouderde Codex GPT-refs. Plaats de OpenAI-agent-authenticatievolgorde
onder `auth.order.openai`; oudere verouderde Codex-authenticatieprofiel-id's en
verouderde Codex-authenticatievolgorde-items zijn legacy state die wordt gerepareerd door
`openclaw doctor --fix`.

Wanneer er geen OpenClaw-sandbox actief is, start OpenClaw Codex app-server-threads
met de native Codex-codemodus ingeschakeld, terwijl code-mode-only standaard uit blijft.
Daardoor blijven de native Codex-werkruimte en codecapaciteiten beschikbaar terwijl
dynamische OpenClaw-tools blijven lopen via de app-server-bridge `item/tool/call`.
Actieve OpenClaw-sandboxing en beperkt toolbeleid schakelen native codemodus
volledig uit, tenzij je kiest voor het experimentele sandbox exec-server-pad.

Deze Codex-native functie staat los van
[OpenClaw-codemodus](/nl/reference/code-mode), een opt-in QuickJS-WASI-runtime
voor generieke OpenClaw-runs met een andere `exec`-invoervorm.

Begin voor de bredere splitsing tussen model/provider/runtime met
[Agentruntimes](/nl/concepts/agent-runtimes). De korte versie is:
`openai/gpt-5.5` is de modelref, `codex` is de runtime, en Telegram,
Discord, Slack of een ander kanaal blijft het communicatieoppervlak.

## Vereisten

- OpenClaw met de meegeleverde `codex` Plugin beschikbaar.
- Als je configuratie `plugins.allow` gebruikt, neem dan `codex` op.
- Codex app-server `0.125.0` of nieuwer. De meegeleverde Plugin beheert standaard een compatibele
  Codex app-server-binary, dus lokale `codex`-commando's op `PATH` hebben geen
  invloed op het normale opstarten van de harness.
- Codex-authenticatie beschikbaar via `openclaw models auth login --provider openai`,
  een app-server-account in de Codex-home van de agent, of een expliciet Codex API-key
  auth-profiel.

Zie voor authenticatieprioriteit, omgevingsisolatie, aangepaste app-server-commando's, modeldiscovery
en alle configuratievelden de
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Snelstart

De meeste gebruikers die Codex in OpenClaw willen, willen dit pad: meld je aan met een
ChatGPT/Codex-abonnement, schakel de meegeleverde `codex` Plugin in en gebruik een
canonieke `openai/gpt-*`-modelref.

Meld je aan met Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Schakel de meegeleverde `codex` Plugin in en selecteer een OpenAI-agentmodel:

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
beurt de harness uit de huidige configuratie oplost.

## Threads delen met Codex Desktop en CLI

De standaardinstelling `appServer.homeScope: "agent"` houdt elke OpenClaw-agent geïsoleerd
van de native Codex-state van de operator. Om een eigenaar OpenClaw dezelfde
native threads te laten inspecteren en beheren die door Codex Desktop en de Codex CLI worden getoond,
kies je voor de gebruikers-Codex-home:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

User-home-modus is alleen beschikbaar met lokaal stdio-transport. Het gebruikt
`$CODEX_HOME` wanneer ingesteld en anders `~/.codex`, inclusief de native
Codex-authenticatie, configuratie, plugins en threadstore van die home. OpenClaw injecteert geen
OpenClaw-authenticatieprofiel in deze app-server.

Eigenaarsbeurten krijgen de tool `codex_threads`. Die kan native threads weergeven, doorzoeken, lezen, forken,
hernoemen, archiveren en herstellen. Vraag de agent om een thread te forken wanneer
je die in OpenClaw wilt voortzetten; de fork wordt gekoppeld aan de huidige
OpenClaw-sessie en blijft zichtbaar voor andere native Codex-clients. Archiveren
vereist expliciete bevestiging dat de thread elders gesloten is.

Hervat of schrijf dezelfde thread niet gelijktijdig vanuit OpenClaw en een andere
Codex-client. Codex coördineert live schrijvers binnen één app-server-proces, niet
over onafhankelijke Desktop-, CLI- en OpenClaw-processen heen. Forken maakt een
afzonderlijke voortzetting aan en is het veilige pad voor naast elkaar bestaan.

## Configuratie

De snelstartconfiguratie is de minimaal werkbare Codex-harnessconfiguratie. Stel Codex-
harnessopties in de OpenClaw-configuratie in en gebruik de CLI alleen voor Codex-authenticatie:

| Behoefte                               | Instellen                                                                        | Waar                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| De harness inschakelen                 | `plugins.entries.codex.enabled: true`                                            | OpenClaw-configuratie              |
| Een allowlisted Plugin-installatie behouden | Neem `codex` op in `plugins.allow`                                           | OpenClaw-configuratie              |
| OpenAI-agentbeurten via Codex routeren | `agents.defaults.model` of `agents.list[].model` als `openai/gpt-*`              | OpenClaw-agentconfiguratie         |
| Aanmelden met ChatGPT/Codex OAuth      | `openclaw models auth login --provider openai`                                   | CLI-authenticatieprofiel           |
| API-key-back-up toevoegen voor Codex-runs | `openai:*` API-key-profiel vermeld na abonnementsauthenticatie in `auth.order.openai` | CLI-authenticatieprofiel + OpenClaw-configuratie |
| Gesloten falen wanneer Codex niet beschikbaar is | Provider- of model-`agentRuntime.id: "codex"`                             | OpenClaw-model/provider-configuratie |
| Direct OpenAI API-verkeer gebruiken    | Provider- of model-`agentRuntime.id: "openclaw"` met normale OpenAI-authenticatie | OpenClaw-model/provider-configuratie |
| App-server-gedrag afstemmen            | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin-configuratie          |
| Native Codex Plugin-apps inschakelen   | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin-configuratie          |
| Codex Computer Use inschakelen         | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin-configuratie          |

Gebruik `openai/gpt-*`-modelrefs voor door Codex ondersteunde OpenAI-agentbeurten. Geef de voorkeur aan
`auth.order.openai` voor de volgorde abonnement-eerst/API-key-back-up. Bestaande
verouderde Codex-authenticatieprofiel-id's en verouderde Codex-authenticatievolgorde zijn doctor-only
legacy state; schrijf geen nieuwe verouderde Codex GPT-refs.

Stel `compaction.model` of `compaction.provider` niet in op door Codex ondersteunde agents.
Codex voert Compaction uit via zijn native app-server-threadstate, dus OpenClaw negeert
die lokale summarizer-overrides tijdens runtime en `openclaw doctor --fix` verwijdert
ze wanneer de agent Codex gebruikt.

Lossless blijft ondersteund als contextengine voor assemblage, ingestie en
onderhoud rond Codex-beurten. Configureer dit via
`plugins.slots.contextEngine: "lossless-claw"` en
`plugins.entries.lossless-claw.config.summaryModel`, niet via
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migreert de oude
vorm `compaction.provider: "lossless-claw"` naar de Lossless-contextengine-slot
wanneer Codex de actieve runtime is, maar native Codex blijft eigenaar van Compaction.

De native Codex app-server-harness ondersteunt contextengines die
pre-prompt-assemblage vereisen. Generieke CLI-backends, inclusief `codex-cli`, bieden
die hostcapaciteit niet.

Voor door Codex ondersteunde agents start `/compact` native Codex app-server-Compaction op
de gebonden thread. OpenClaw wacht niet op voltooiing, legt geen OpenClaw-time-out op,
herstart de gedeelde app-server niet en valt niet terug op een contextengine of
publieke OpenAI-summarizer. Als de native Codex-threadbinding ontbreekt of
verouderd is, faalt het commando gesloten zodat de operator de echte runtimegrens ziet
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

De rest van deze pagina behandelt veelvoorkomende varianten waartussen gebruikers moeten kiezen:
deploymentvorm, fail-closed-routing, guardian-goedkeuringsbeleid, native Codex-
plugins en Computer Use. Zie voor volledige optielijsten, standaardwaarden, enums, discovery,
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
servers en Skills. `/codex models` geeft de live Codex app-server-catalogus weer voor
de harness en het account. Als `/status` verrassend is, zie
[Probleemoplossing](#troubleshooting).

## Routing en modelselectie

Houd providerrefs en runtimebeleid gescheiden:

- Gebruik `openai/gpt-*` voor OpenAI-agentbeurten via Codex.
- Gebruik geen verouderde Codex GPT-refs in configuratie. Voer `openclaw doctor --fix` uit om
  verouderde refs en oude sessieroutepinnen te repareren.
- `agentRuntime.id: "codex"` is optioneel voor normale OpenAI-automodus, maar nuttig
  wanneer een deployment gesloten moet falen als Codex niet beschikbaar is.
- `agentRuntime.id: "openclaw"` laat een provider of model de ingebedde OpenClaw-
  runtime gebruiken wanneer dat de bedoeling is.
- `/codex ...` bestuurt native Codex app-server-gesprekken vanuit chat.
- ACP/acpx is een afzonderlijk extern harnesspad. Gebruik het alleen wanneer de gebruiker vraagt
  om ACP/acpx of een externe harnessadapter.

Veelvoorkomende commandorouting:

| Gebruikersintentie                                  | Gebruik                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| De huidige chat koppelen                            | `/codex bind [--cwd <path>]`                                                                          |
| Een bestaande Codex-thread hervatten                | `/codex resume <thread-id>`                                                                           |
| Codex-threads weergeven of filteren                 | `/codex threads [filter]`                                                                             |
| Native Codex-plugins weergeven                      | `/codex plugins list`                                                                                 |
| Een geconfigureerde native Codex-plugin in- of uitschakelen | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Een bestaande Codex CLI-sessie op een gekoppelde node koppelen | `/codex sessions --host <node> [filter]`, daarna `/codex resume <session-id> --host <node> --bind here` |
| Alleen Codex-feedback verzenden                     | `/codex diagnostics [note]`                                                                           |
| Een ACP/acpx-taak starten                           | ACP/acpx-sessiecommando's, niet `/codex`                                                              |

| Gebruikssituatie                                    | Configureren                                                            | Verifiëren                              | Opmerkingen                           |
| --------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ChatGPT/Codex-abonnement met native Codex-runtime   | `openai/gpt-*` plus ingeschakelde `codex`-plugin                        | `/status` toont `Runtime: OpenAI Codex` | Aanbevolen pad                        |
| Fail closed als Codex niet beschikbaar is           | Provider of model `agentRuntime.id: "codex"`                            | Turn faalt in plaats van embedded fallback | Gebruik voor implementaties met alleen Codex |
| Rechtstreeks OpenAI API-key-verkeer via OpenClaw    | Provider of model `agentRuntime.id: "openclaw"` en normale OpenAI-auth  | `/status` toont OpenClaw-runtime        | Gebruik alleen wanneer OpenClaw bewust bedoeld is |
| Legacy-config                                       | legacy Codex GPT-verwijzingen                                           | `openclaw doctor --fix` herschrijft dit | Schrijf nieuwe config niet op deze manier |
| ACP/acpx Codex-adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                                | ACP-taak-/sessiestatus                  | Los van native Codex-harness          |

`agents.defaults.imageModel` volgt dezelfde prefixscheiding. Gebruik `openai/gpt-*`
voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer beeldbegrip
via een begrensde Codex app-server-turn moet lopen. Gebruik geen
legacy Codex GPT-verwijzingen; doctor herschrijft die legacy-prefix naar `openai/gpt-*`.

## Implementatiepatronen

### Basis-Codex-implementatie

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

Met deze config gebruikt de `main`-agent zijn normale providerpad en gebruikt de
`codex`-agent Codex app-server.

### Fail-closed Codex-implementatie

Voor OpenAI-agent-turns wordt `openai/gpt-*` al naar Codex omgezet wanneer de
gebundelde plugin beschikbaar is. Voeg expliciet runtimebeleid toe wanneer je een
vastgelegde fail-closed-regel wilt:

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

Met geforceerde Codex faalt OpenClaw vroeg als de Codex-plugin is uitgeschakeld,
de app-server te oud is, of de app-server niet kan starten.

## App-serverbeleid

Standaard start de plugin de door OpenClaw beheerde Codex-binary lokaal met stdio
transport. Stel `appServer.command` alleen in wanneer je bewust een ander
uitvoerbaar bestand wilt draaien. Gebruik WebSocket-transport alleen wanneer er
al elders een app-server draait:

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

Lokale stdio app-server-sessies gebruiken standaard de vertrouwde lokale
operatorhouding: `approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Als lokale Codex-vereisten die impliciete
YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan toegestane
guardian-machtigingen. Wanneer een OpenClaw-sandbox actief is voor de sessie,
schakelt OpenClaw native Code Mode van Codex, gebruikers-MCP-servers en
app-backed pluginuitvoering voor die turn uit in plaats van te vertrouwen op
host-side sandboxing van Codex. Shelltoegang wordt beschikbaar gemaakt via
OpenClaw sandbox-backed dynamische tools zoals `sandbox_exec` en
`sandbox_process` wanneer de normale exec/process-tools beschikbaar zijn.

Gebruik genormaliseerde OpenClaw-execmodus wanneer je native auto-review van
Codex wilt vóór sandbox-escapes of extra machtigingen:

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

Voor Codex app-server-sessies mapt OpenClaw `tools.exec.mode: "auto"` naar door
Codex Guardian beoordeelde goedkeuringen, meestal
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` en
`sandbox: "workspace-write"` wanneer de lokale vereisten die waarden toestaan.
In `tools.exec.mode: "auto"` behoudt OpenClaw geen legacy onveilige Codex
`approvalPolicy: "never"`- of `sandbox: "danger-full-access"`-overrides; gebruik
`tools.exec.mode: "full"` voor een bewuste Codex-houding zonder goedkeuringen. De
legacy preset `plugins.entries.codex.config.appServer.mode: "guardian"` werkt nog
steeds, maar `tools.exec.mode: "auto"` is het genormaliseerde OpenClaw-oppervlak.

Zie [Machtigingsmodi](/nl/tools/permission-modes) voor de vergelijking op modusniveau
met host-execgoedkeuringen en ACPX-machtigingen.

Zie [Codex-harnessreferentie](/nl/plugins/codex-harness-reference) voor elk
app-server-veld, auth-volgorde, omgevingsisolatie, ontdekking en timeoutgedrag.

## Commando's en diagnostiek

De gebundelde plugin registreert `/codex` als slashcommando op elk kanaal dat
OpenClaw-tekstcommando's ondersteunt.

Native uitvoering en beheer vereisen een eigenaar of een `operator.admin`
Gateway-client. Dit omvat het koppelen of hervatten van threads, het verzenden of
stoppen van turns, het wijzigen van model-, fast-mode- of machtigingsstatus,
compacteren of reviewen, en het loskoppelen van een binding. Andere
geautoriseerde afzenders behouden alleen-lezen commando's voor status, hulp,
account, model, thread, MCP-server, skill en inspectie van bindingen.

Veelvoorkomende vormen:

- `/codex status` controleert app-server-connectiviteit, modellen, account, rate limits,
  MCP-servers en skills.
- `/codex models` toont live Codex app-server-modellen.
- `/codex threads [filter]` toont recente Codex app-server-threads.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een
  bestaande Codex-thread.
- `/codex compact` vraagt Codex app-server om de gekoppelde thread te compacten.
- `/codex review` start native Codex-review voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt toestemming voordat Codex-feedback voor de
  gekoppelde thread wordt verzonden.
- `/codex account` toont account- en rate-limitstatus.
- `/codex mcp` toont de status van Codex app-server MCP-servers.
- `/codex skills` toont Codex app-server-skills.

Begin voor de meeste supportrapporten met `/diagnostics [note]` in het gesprek
waar de bug plaatsvond. Dit maakt één Gateway-diagnoserapport en vraagt, voor
Codex-harnessessies, om goedkeuring om de relevante Codex-feedbackbundel te
verzenden. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het privacymodel en
gedrag in groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de
Codex-feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige
Gateway-diagnosebundel.

### Codex-threads lokaal inspecteren

De snelste manier om een slechte Codex-run te inspecteren is vaak om de native
Codex-thread rechtstreeks te openen:

```bash
codex resume <thread-id>
```

Haal de thread-id uit het voltooide `/diagnostics`-antwoord, `/codex binding` of
`/codex threads [filter]`.

Zie [Codex-harnessruntime](/nl/plugins/codex-harness-runtime#codex-feedback-upload)
voor uploadmechanica en diagnosegrenzen op runtimeniveau.

In de standaard home per agent wordt auth in deze volgorde geselecteerd:

1. Geordende OpenAI-auth-profielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Voer `openclaw doctor --fix` uit om oudere
   legacy Codex-auth-profiel-id's en legacy Codex-authvolgorde te migreren.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio app-server-starts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-server-account aanwezig is en OpenAI-auth
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authprofiel in ChatGPT-abonnementsstijl ziet, verwijdert
het `CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde Codex-child process. Zo
blijven API-keys op Gateway-niveau beschikbaar voor embeddings of rechtstreekse
OpenAI-modellen zonder dat native Codex app-server-turns per ongeluk via de API
worden gefactureerd. Expliciete Codex API-key-profielen en lokale stdio
env-key-fallback gebruiken app-server-login in plaats van geërfde child-process
env. WebSocket app-server-verbindingen ontvangen geen Gateway env API-key-fallback;
gebruik een expliciet authprofiel of het eigen account van de externe app-server.
Wanneer native Codex-plugins zijn geconfigureerd, installeert of vernieuwt
OpenClaw die plugins via de verbonden app-server voordat plugin-owned apps aan de
Codex-thread worden blootgesteld. `app/list` blijft de bron van waarheid voor
app-id's, toegankelijkheid en metadata, maar OpenClaw bezit de enablement-beslissing
per thread: als beleid een vermelde toegankelijke app toestaat, verzendt OpenClaw
`thread/start.config.apps[appId].enabled = true`, zelfs wanneer `app/list` die app
momenteel als uitgeschakeld rapporteert. Dit pad verzint geen app-installatie voor
onbekende id's; OpenClaw activeert alleen marketplace-plugins met `plugin/install`
en vernieuwt daarna de inventaris.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw
de resettijd wanneer Codex die rapporteert en probeert het volgende geordende
authprofiel voor dezelfde Codex-run. Wanneer de resettijd voorbij is, komt het
abonnementsprofiel opnieuw in aanmerking zonder het geselecteerde `openai/gpt-*`-
model of de Codex-runtime te wijzigen.

Voor lokale stdio app-server-starts stelt OpenClaw `CODEX_HOME` in op een directory per agent, zodat Codex-configuratie, auth-/accountbestanden, Plugin-cache/-data en native threadstatus standaard niet lezen uit of schrijven naar de persoonlijke `~/.codex` van de operator. OpenClaw behoudt de normale proceswaarde van `HOME`; door Codex uitgevoerde sub-processen kunnen nog steeds configuratie en tokens in de thuismap van de gebruiker vinden, en Codex kan gedeelde vermeldingen in `$HOME/.agents/skills` en `$HOME/.agents/plugins/marketplace.json` ontdekken. Met `appServer.homeScope: "user"` gebruikt OpenClaw in plaats daarvan de native Codex-thuismap van de gebruiker en het bestaande account daarvan, zonder een OpenClaw-authprofiel te injecteren.

Als een implementatie extra omgevingsisolatie nodig heeft, voeg die variabelen dan toe aan `appServer.clearEnv`:

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

`appServer.clearEnv` heeft alleen invloed op het voortgebrachte Codex app-server-childproces. OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens normalisatie van lokale starts: `CODEX_HOME` blijft wijzen naar het geselecteerde agent- of gebruikersbereik, en `HOME` blijft overgenomen zodat sub-processen normale gebruikers-thuismapstatus kunnen gebruiken.

Dynamische Codex-tools gebruiken standaard `searchable` laden. OpenClaw stelt geen dynamische tools beschikbaar die native Codex-werkruimtebewerkingen dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` en `update_plan`. De meeste overige OpenClaw-integratietools, zoals messaging, media, Cron, browser, nodes, Gateway en `heartbeat_respond`, zijn beschikbaar via Codex-toolzoekopdrachten onder de `openclaw`-naamruimte, waardoor de initiële modelcontext kleiner blijft. Webzoekopdrachten gebruiken standaard de gehoste `web_search`-tool van Codex wanneer zoeken is ingeschakeld en er geen beheerde provider is geselecteerd. Native gehost zoeken en de beheerde dynamische OpenClaw-tool `web_search` sluiten elkaar uit, zodat beheerd zoeken native domeinbeperkingen niet kan omzeilen. OpenClaw gebruikt de beheerde tool wanneer gehost zoeken niet beschikbaar, expliciet uitgeschakeld of vervangen is door een geselecteerde beheerde provider. OpenClaw houdt de zelfstandige `web.run`-extensie van Codex uitgeschakeld omdat productie-app-serververkeer de door de gebruiker gedefinieerde `web`-naamruimte ervan weigert. `tools.web.search.enabled: false` schakelt beide paden uit, net als tool-uitgeschakelde runs met alleen LLM. Codex behandelt `"cached"` als voorkeur en zet dit voor onbeperkte app-serverbeurten om naar live externe toegang. Automatische beheerde fallback faalt gesloten wanneer native `allowedDomains` zijn ingesteld, zodat de allowlist niet kan worden omzeild. Persistente wijzigingen in effectief zoekbeleid roteren de gebonden Codex-thread vóór de volgende beurt. Tijdelijke beperkingen per beurt gebruiken een tijdelijke beperkte thread en behouden de bestaande binding voor later hervatten. `sessions_yield` en bronantwoorden met alleen berichttools blijven direct omdat dit beurtbeheercontracten zijn. `sessions_spawn` blijft doorzoekbaar zodat de native `spawn_agent` van Codex het primaire Codex-subagentoppervlak blijft, terwijl expliciete OpenClaw- of ACP-delegatie nog steeds beschikbaar is via de dynamische toolnaamruimte `openclaw`. Heartbeat-samenwerkingsinstructies vertellen Codex om naar `heartbeat_respond` te zoeken voordat een Heartbeat-beurt wordt beëindigd wanneer de tool nog niet is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt met een aangepaste Codex app-server die uitgestelde dynamische tools niet kan zoeken of wanneer je de volledige toolpayload debugt.

Ondersteunde Codex Plugin-velden op topniveau:

| Veld                       | Standaard      | Betekenis                                                                                              |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om dynamische OpenClaw-tools direct in de initiële Codex-toolcontext te plaatsen. |
| `codexDynamicToolsExclude` | `[]`           | Extra namen van dynamische OpenClaw-tools om weg te laten uit Codex app-server-beurten.              |
| `codexPlugins`             | uitgeschakeld  | Native Codex-plugin-/app-ondersteuning voor gemigreerde, uit broncode geïnstalleerde samengestelde plugins. |

Ondersteunde `appServer`-velden:

| Veld                                          | Standaardwaarde                                        | Betekenis                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoleert Codex-status per OpenClaw-agent. `"user"` deelt de native `$CODEX_HOME` of `~/.codex`, gebruikt native authenticatie en schakelt threadbeheer alleen voor eigenaars in. Gebruikersscope vereist stdio.                                                                                                                                                                      |
| `command`                                     | beheerd Codex-binair bestand                           | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om het beheerde binaire bestand te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                         | WebSocket app-server-URL.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                   | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                   | Extra namen van omgevingsvariabelen die uit het gestarte stdio app-server-proces worden verwijderd nadat OpenClaw de overgenomen omgeving heeft opgebouwd. OpenClaw behoudt de geselecteerde `CODEX_HOME` en overgenomen `HOME` voor lokale starts.                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Schakel het tooloppervlak van Codex alleen voor codemodus in. Dynamische OpenClaw-tools blijven bij Codex geregistreerd, zodat geneste `tools.*`-aanroepen terugkeren via de app-server-bridge `item/tool/call`.                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | niet ingesteld                                         | Root van de remote Codex app-server-workspace. Wanneer ingesteld, leidt OpenClaw de lokale workspaceroot af uit de opgeloste OpenClaw-workspace, behoudt het huidige cwd-achtervoegsel onder deze remote root en stuurt alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-workspaceroot ligt, faalt OpenClaw gesloten in plaats van een gateway-lokaal pad naar de remote app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                                | Time-out voor control-plane-aanroepen naar de app-server.                                                                                                                                                                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Stil venster nadat Codex een beurt accepteert of na een beurtgebonden app-server-aanvraag terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bewaking voor voltooiingsinactiviteit en voortgang die wordt gebruikt na een tooloverdracht, native toolvoltooiing, raw assistant-voortgang na een tool, raw reasoning-voltooiing of reasoning-voortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij synthese na tools terecht langer stil kan blijven dan het uiteindelijke budget voor assistant-release. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden  | Preset voor YOLO- of guardian-beoordeelde uitvoering. Lokale stdio-vereisten die `danger-full-access`, `never`-goedkeuring of de `user`-reviewer weglaten, maken de impliciete standaard guardian.                                                                                                                                                                                              |
| `approvalPolicy`                              | `"never"` of een toegestane guardian-goedkeuringspolicy | Native Codex-goedkeuringspolicy die naar threadstart/hervatten/beurt wordt gestuurd. Guardian-standaardwaarden geven de voorkeur aan `"on-request"` wanneer toegestaan.                                                                                                                                                                                                                        |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar threadstart/hervatten wordt gestuurd. Guardian-standaardwaarden geven de voorkeur aan `"workspace-write"` wanneer toegestaan, anders `"read-only"`. Wanneer een OpenClaw-sandbox actief is, gebruiken `danger-full-access`-beurten Codex `workspace-write` met netwerktoegang afgeleid van de egress-instelling van de OpenClaw-sandbox.                    |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-reviewer           | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer toegestaan, anders `guardian_subagent` of `user`. `guardian_subagent` blijft een legacy-alias.                                                                                                                                                                                                          |
| `serviceTier`                                 | niet ingesteld                                         | Optionele Codex app-server-servicelaag. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan, `null` wist de overschrijving en legacy `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                               |
| `networkProxy`                                | uitgeschakeld                                          | Schakel Codex permissions-profile-netwerken in voor app-server-commando's. OpenClaw definieert de geselecteerde config `permissions.<profile>.network` en selecteert die met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                                | Preview-opt-in die een door OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan draaien.                                                                                                                                                                                     |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook
`features.network_proxy.enabled` en `default_permissions` in de Codex-threadconfig
in, zodat het gegenereerde permissieprofiel door Codex beheerd netwerken kan
starten. Standaard genereert OpenClaw een botsingsbestendige profielnaam
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

Als de normale app-serverruntime `danger-full-access` zou zijn, gebruikt het inschakelen van
`networkProxy` werkruimte-achtige bestandssysteemtoegang voor het gegenereerde
machtigingsprofiel. Door Codex beheerde netwerkhandhaving is gesandboxte networking,
dus een profiel met volledige toegang zou uitgaand verkeer niet beschermen.
Domeinvermeldingen gebruiken `allow` of `deny`; Unix-socketvermeldingen gebruiken Codex'
waarden `allow` of `none`.

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: Codex-`item/tool/call`-aanvragen gebruiken standaard een
OpenClaw-watchdog van 90 seconden. Een positief per-aanroep-argument `timeoutMs` verlengt
of verkort dat specifieke toolbudget. De tool `image_generate` gebruikt
`agents.defaults.imageGenerationModel.timeoutMs` wanneer de toolaanroep geen eigen timeout
opgeeft, of anders een standaardwaarde van 120 seconden voor beeldgeneratie.
De media-understanding-`image`-tool gebruikt
`tools.media.image.timeoutSeconds` of de media-standaard van 60 seconden. Voor
beeldbegrip geldt die timeout voor de aanvraag zelf en wordt die niet
verminderd door eerder voorbereidingswerk. Dynamische toolbudgetten worden
begrensd op 600000 ms. Bij een timeout breekt OpenClaw het toolsignaal af
waar dat wordt ondersteund en retourneert het een mislukte dynamic-tool-respons aan Codex,
zodat de beurt kan doorgaan in plaats van de sessie in `processing` achter te laten.
Deze watchdog is het buitenste dynamische `item/tool/call`-budget; providerspecifieke
aanvraagtime-outs lopen binnen die aanroep en behouden hun eigen timeoutsemantiek.

Nadat Codex een beurt accepteert, en nadat OpenClaw reageert op een beurt-gebonden
app-serveraanvraag, verwacht de harness dat Codex voortgang maakt in de huidige beurt en
uiteindelijk de native beurt afrondt met `turn/completed`. Als de app-server
`appServer.turnCompletionIdleTimeoutMs` lang stil blijft, onderbreekt OpenClaw naar beste vermogen
de Codex-beurt, registreert het een diagnostische timeout en geeft het de
OpenClaw-sessiebaan vrij zodat opvolgende chatberichten niet achter een vastgelopen
native beurt in de wachtrij blijven staan. De meeste niet-terminale meldingen voor dezelfde
beurt deactiveren die korte watchdog omdat Codex heeft bewezen dat de beurt nog leeft.
Tooloverdrachten gebruiken een langer idle-budget na tools: nadat OpenClaw een
`item/tool/call`-respons retourneert, nadat native toolitems zoals `commandExecution`
voltooid zijn, na ruwe `custom_tool_call_output`-voltooiingen, en na ruwe assistant-voortgang
na tools, ruwe reasoning-voltooiingen of reasoning-voortgang. De guard gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer geconfigureerd en
valt anders terug op vijf minuten. Datzelfde budget na tools verlengt ook de
voortgangswatchdog voor het stille synthesatievenster voordat Codex de volgende
huidige-beurtgebeurtenis uitzendt. Globale app-servermeldingen, zoals updates over
rate limits, resetten de beurt-idlevoortgang niet. Reasoning-voltooiingen, commentary
`agentMessage`-voltooiingen, en ruwe reasoning- of assistant-voortgang vóór tools kunnen
worden gevolgd door een automatisch definitief antwoord, dus ze gebruiken de antwoordguard
na voortgang in plaats van de sessiebaan onmiddellijk vrij te geven. Alleen definitieve/
niet-commentary voltooide `agentMessage`-items en ruwe assistant-voltooiingen vóór tools
activeren de vrijgave bij assistant-uitvoer: als Codex daarna stil blijft zonder
`turn/completed`, onderbreekt OpenClaw naar beste vermogen de native beurt en geeft het
de sessiebaan vrij. Als een andere beurtwatch die vrijgaverace wint, accepteert OpenClaw
nog steeds het voltooide definitieve assistant-item zodra er geen native aanvraag, item
of dynamische toolvoltooiing meer actief is en de vrijgave bij assistant-uitvoer nog steeds
bij het laatst voltooide item hoort, zonder latere itemvoltooiing. Dit kan het definitieve
antwoord na voltooid toolwerk behouden zonder de beurt opnieuw af te spelen. Gedeeltelijke
assistant-delta's, verouderde eerdere antwoorden en lege latere voltooiingen komen niet in
aanmerking. Replay-veilige stdio-app-serverfouten,
waaronder idle-time-outs bij beurtvoltooiing zonder bewijs van assistant, tool, actief item
of side effects, worden eenmaal opnieuw geprobeerd op een nieuwe app-serverpoging. Onveilige
timeouts nemen de vastgelopen app-serverclient nog steeds uit gebruik en geven de
OpenClaw-sessiebaan vrij. Ze wissen ook de verouderde native threadbinding in plaats van
automatisch opnieuw te worden afgespeeld. Completion-watch-timeouts tonen Codex-specifieke
timeouttekst: replay-veilige gevallen zeggen dat de respons mogelijk onvolledig is, terwijl
onveilige gevallen de gebruiker vragen de huidige status te controleren voordat ze opnieuw
proberen. Openbare timeoutdiagnostiek bevat structurele velden zoals de laatste
app-servermeldingsmethode, ruwe assistant-responsitem-id/type/rol, aantallen actieve
aanvragen/items en gewapende watchstatus. Wanneer de laatste melding een ruw
assistant-responsitem is, bevat die ook een begrensde tekstpreview van de assistant.
Ze bevatten geen ruwe prompt- of toolinhoud.

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
de voorkeur voor herhaalbare deployments omdat dit het plugingedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessinstellingen.

## Native Codex-plugins

Native Codex-pluginondersteuning gebruikt de eigen app- en plugincapaciteiten van de
Codex-app-server in dezelfde Codex-thread als de OpenClaw-harnessbeurt. OpenClaw
vertaalt Codex-plugins niet naar synthetische `codex_plugin_*` dynamische OpenClaw-tools.

`codexPlugins` beïnvloedt alleen sessies die de native Codex-harness selecteren. Het
heeft geen effect op ingebouwde harnessruns, normale OpenAI-provider-runs, ACP-gespreksbindingen
of andere harnesses.

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
of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw
berekend. Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset`, of herstart de Gateway
zodat toekomstige Codex-harnesssessies starten met de bijgewerkte appset.

Voor migratiegeschiktheid, app-inventaris, beleid voor destructieve acties,
elicitations en native plugindiagnostiek, zie
[Native Codex-plugins](/nl/plugins/codex-native-plugins).

OpenAI-zijdige app- en plugintoegang wordt beheerd door het aangemelde Codex-account
en, voor Business- en Enterprise/Edu-werkruimten, appcontroles op werkruimteniveau. Zie
[Codex gebruiken met je ChatGPT-abonnement](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
voor OpenAI's overzicht van account- en werkruimtecontroles.

## Computer Use

Computer Use wordt behandeld in een eigen installatiehandleiding:
[Codex Computer Use](/nl/plugins/codex-computer-use).

De korte versie: OpenClaw levert de desktop-control-app niet mee en voert
desktopacties niet zelf uit. Het bereidt Codex app-server voor, verifieert dat de
`computer-use` MCP-server beschikbaar is en laat Codex vervolgens eigenaar zijn van de
native MCP-toolaanroepen tijdens Codex-modusbeurten.

## Runtimegrenzen

De Codex-harness wijzigt alleen de low-level ingebedde agentexecutor.

- Dynamische OpenClaw-tools worden ondersteund. Codex vraagt OpenClaw om die
  tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.
- Codex-native shell-, patch-, MCP- en native apptools zijn eigendom van Codex.
  OpenClaw kan geselecteerde native gebeurtenissen observeren of blokkeren via de ondersteunde
  relay, maar herschrijft native toolargumenten niet.
- Codex is eigenaar van native Compaction. OpenClaw houdt een transcriptmirror bij voor kanaalgeschiedenis,
  zoeken, `/new`, `/reset`, en toekomstige model- of harnesswisselingen, maar
  vervangt Codex Compaction niet door een OpenClaw- of context-engine-samenvatter.
- Mediageneratie, mediabegrip, TTS, goedkeuringen en uitvoer van messaging-tools
  blijven via de overeenkomende OpenClaw-provider-/modelinstellingen lopen.
- `tool_result_persist` geldt voor transcript-toolresultaten die eigendom zijn van OpenClaw, niet
  voor Codex-native toolresultaatrecords.

Voor hooklagen, ondersteunde V1-oppervlakken, native machtigingsafhandeling, queue
steering, uploadmechanica voor Codex-feedback en Compaction-details, zie
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime).

## Problemen oplossen

**Codex verschijnt niet als normale `/model`-provider:** dat is verwacht voor
nieuwe configuraties. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt de ingebouwde harness in plaats van Codex:** zorg ervoor dat de modelref
`openai/gpt-*` is op de officiële OpenAI-provider en dat de Codex-plugin is
geïnstalleerd en ingeschakeld. Als je strikt bewijs nodig hebt tijdens het testen, stel dan provider- of
model-`agentRuntime.id: "codex"` in. Een geforceerde Codex-runtime faalt in plaats van
terug te vallen op OpenClaw.

**OpenAI Codex-runtime valt terug op het API-key-pad:** verzamel een geredigeerd
Gateway-fragment dat het model, de runtime, de geselecteerde provider en de fout toont.
Vraag getroffen medewerkers deze alleen-lezen-opdracht op hun OpenClaw-host uit te voeren:

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
`No API key`-resultaat. Een gecorrigeerde run zou het OpenAI OAuth-pad moeten tonen
in plaats van een gewone OpenAI API-key-fout.

**Legacy Codex-modelrefsconfiguratie blijft staan:** voer `openclaw doctor --fix` uit.
Doctor herschrijft legacy modelrefs naar `openai/*`, verwijdert verouderde sessie- en
whole-agent runtime pins, en behoudt bestaande auth-profile-overschrijvingen.

**De app-server wordt geweigerd:** gebruik Codex app-server `0.125.0` of nieuwer.
Prereleases met dezelfde versie of versies met buildsuffix, zoals
`0.125.0-alpha.2` of `0.125.0+custom`, worden geweigerd omdat OpenClaw test op de
stabiele `0.125.0`-protocolondergrens.

**`/codex status` kan geen verbinding maken:** controleer dat de gebundelde `codex`-plugin is
ingeschakeld, dat `plugins.allow` deze bevat wanneer een allowlist is geconfigureerd, en
dat eventuele aangepaste `appServer.command`, `url`, `authToken`, of headers geldig zijn.

**Modelontdekking is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel discovery uit. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport faalt onmiddellijk:** controleer `appServer.url`, `authToken`,
headers, en dat de externe app-server dezelfde Codex-app-server
protocolversie spreekt.

**Native shell- of patchtools worden geblokkeerd met `Native hook relay unavailable`:**
de Codex-thread probeert nog steeds een native hook relay-id te gebruiken dat OpenClaw niet
langer heeft geregistreerd. Dit is een probleem met het native Codex-hooktransport, geen fout in een ACP-
backend, provider, GitHub of shellopdracht. Start een nieuwe sessie in
de getroffen chat met `/new` of `/reset` en probeer daarna opnieuw een onschuldige opdracht. Als dat
één keer werkt maar de volgende native toolaanroep opnieuw mislukt, behandel `/new` dan alleen als tijdelijke
workaround: kopieer de prompt naar een nieuwe sessie nadat je de Codex
app-server of OpenClaw Gateway opnieuw hebt gestart, zodat oude threads worden verwijderd en native hook-
registraties opnieuw worden aangemaakt.

**Een niet-Codex-model gebruikt de ingebouwde harness:** dat is verwacht, tenzij
provider- of modelruntimebeleid het naar een andere harness routeert. Gewone niet-OpenAI
providerrefs blijven in de `auto`-modus op hun normale providerpad.

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
- [OpenAI Codex-hulp](https://help.openai.com/en/collections/14937394-codex)
- [Agentharnessplugins](/nl/plugins/sdk-agent-harness)
- [Plugin-hooks](/nl/plugins/hooks)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Status](/nl/cli/status)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
