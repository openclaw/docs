---
read_when:
    - Je wilt de officiële Codex-app-serverharness gebruiken
    - Je hebt voorbeelden van Codex-harnasconfiguraties nodig
    - Je wilt dat implementaties met alleen Codex mislukken in plaats van terug te vallen op OpenClaw
summary: Voer beurten van de ingebouwde OpenClaw-agent uit via de officiële Codex-app-serverharnas
title: Codex-harnas
x-i18n:
    generated_at: "2026-07-16T16:05:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

De officiële `codex`-plugin voert ingebedde OpenAI-agentbeurten uit via Codex
app-server in plaats van via de ingebouwde OpenClaw-harness. Codex beheert de
agentsessie op laag niveau: native hervatting van threads, native voortzetting van tools,
native Compaction en uitvoering via app-server. OpenClaw beheert nog steeds chatkanalen,
sessiebestanden, modelselectie, dynamische OpenClaw-tools, goedkeuringen,
medialevering en de zichtbare transcriptiespiegel.

Gebruik canonieke OpenAI-modelverwijzingen zoals `openai/gpt-5.6-sol`. Configureer geen
verouderde Codex GPT-verwijzingen; plaats de authenticatievolgorde voor OpenAI-agenten onder `auth.order.openai`.
Verouderde profiel-ID's voor Codex-authenticatie en verouderde vermeldingen in de Codex-authenticatievolgorde worden
hersteld door `openclaw doctor --fix`.

Als het runtimebeleid voor provider/model niet is ingesteld of `auto` is, selecteert alleen het voorvoegsel `openai/*`
deze harness nooit. OpenAI mag Codex alleen impliciet selecteren voor een
exacte officiële HTTPS-route voor Platform Responses of ChatGPT Responses zonder
expliciete aanvraagoverschrijving. Zie
[Impliciete OpenAI-agentruntime](/nl/providers/openai#implicit-agent-runtime).
Als Codex de authenticatie beheert voordat de routering tussen Platform en ChatGPT bekend is, vereist OpenClaw
nog steeds dat elke kandidaatroute Codex-compatibiliteit declareert. Alleen native
beheer van authenticatie omzeilt die routecontrole nooit.

Wanneer geen OpenClaw-sandbox actief is, start OpenClaw Codex-app-serverthreads
met de native codemodus van Codex ingeschakeld (alleen-codemodus blijft standaard uitgeschakeld), zodat
native werkruimte- en codemogelijkheden beschikbaar blijven naast dynamische OpenClaw-tools
die via de app-serverbrug `item/tool/call` worden gerouteerd. Een actieve
OpenClaw-sandbox of beperkt toolbeleid schakelt de native codemodus volledig uit,
tenzij je je aanmeldt voor het experimentele exec-serverpad van de sandbox.

Met de standaardwaarde `tools.exec.host: "auto"` en zonder actieve OpenClaw-sandbox
ontvangt Codex ook de tools `node_exec` en `node_process` voor opdrachten op gekoppelde
Nodes. De native shell blijft op de host en in de werkruimte van Codex app-server
(lokaal op de Gateway voor de standaardimplementatie via stdio); `node_exec` selecteert een Node op
naam of ID en houdt het goedkeuringsbeleid van OpenClaw voor Nodes van kracht. Als een eindige
runtime-allowlist de native codemodus uitschakelt en de beurt zonder
uitvoeringsomgeving achterlaat, houdt OpenClaw in plaats daarvan de door beleid gefilterde tools `exec` en `process`
beschikbaar voor directe uitvoering zonder sandbox.

Deze native Codex-functie staat los van
[OpenClaw-codemodus](/nl/reference/code-mode), een optionele QuickJS-WASI-runtime
voor algemene OpenClaw-uitvoeringen met een andere invoervorm voor `exec`. Begin voor de
bredere verdeling tussen model/provider/runtime bij
[Agentruntimes](/nl/concepts/agent-runtimes): `openai/gpt-5.6-sol` is de modelverwijzing,
`codex` is de runtime en Telegram, Discord, Slack of een ander
kanaal is het communicatieoppervlak.

## Vereisten

- De officiële `@openclaw/codex`-plugin is geïnstalleerd. Neem `codex` op in
  `plugins.allow` als je configuratie een allowlist gebruikt.
- Codex app-server `0.143.0` of nieuwer. De plugin beheert standaard een compatibel
  binair bestand, zodat een opdracht `codex` op `PATH` de normale
  opstartprocedure niet beïnvloedt.
- Codex-authenticatie via `openclaw models auth login --provider openai`, een
  app-serveraccount dat al aanwezig is in de Codex-home van de agent, of een
  expliciet Codex-authenticatieprofiel met API-sleutel.

Zie voor authenticatieprioriteit, omgevingsisolatie, aangepaste app-serveropdrachten,
modeldetectie en de volledige lijst met configuratievelden
[Referentie voor de Codex-harness](/nl/plugins/codex-harness-reference).

## Snel aan de slag

Installeer de officiële plugin en meld je vervolgens aan met Codex OAuth:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Schakel de `codex`-plugin in en selecteer een OpenAI-agentmodel:

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
      model: "openai/gpt-5.6-sol",
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

Start de Gateway opnieuw nadat je de pluginconfiguratie hebt gewijzigd. Als een chat al een
sessie heeft, voer dan eerst `/new` of `/reset` uit, zodat de volgende beurt de harness
op basis van de huidige configuratie bepaalt.

## Threads delen met Codex Desktop en CLI

De standaardwaarde `appServer.homeScope: "agent"` isoleert elke OpenClaw-agent van
de native Codex-status van de beheerder. Om een eigenaar dezelfde native threads te laten inspecteren en beheren
die door Codex Desktop en de Codex CLI worden weergegeven, schakel je de
Codex-home van de gebruiker in:

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

De gebruikershomemodus ondersteunt een lokaal beheerd stdio-proces of het gedeelde
Unix-sockettransport. Deze gebruikt `$CODEX_HOME` wanneer dat is ingesteld en anders `~/.codex`, inclusief
de native Codex-authenticatie, configuratie, plugins en threadopslag van die home. OpenClaw
injecteert geen OpenClaw-authenticatieprofiel in deze app-server.

Beurten van de eigenaar krijgen de tool `codex_threads`: native threads weergeven, zoeken, lezen, afsplitsen, hernoemen,
archiveren en herstellen. Splits een thread af om deze voort te zetten in
OpenClaw; de afsplitsing wordt aan de huidige OpenClaw-sessie gekoppeld en blijft
zichtbaar voor andere native Codex-clients. Voor archivering is expliciete
bevestiging vereist dat de thread elders is gesloten. Wanneer supervisie ook
is ingeschakeld, vereisen transcriptievelden en mutaties de bijbehorende
aanmelding via `supervision.allowRawTranscripts` of `supervision.allowWriteControls`.

Hervat of beschrijf dezelfde thread niet gelijktijdig via onafhankelijke beheerde
stdio App Servers. Codex coördineert actieve schrijvers binnen één App Server, niet
tussen afzonderlijke processen. Afsplitsen is het veilige co-existentiepad voor normale
stdio-sessies met een gebruikershome.

Alleen `appServer.homeScope: "user"` beheert de vlootcatalogus niet. Detectie van native
sessies is ingeschakeld zolang de plugin actief is; stel
`sessionCatalog.enabled: false` in om deze uit de OpenClaw-zijbalk te verwijderen zonder
Codex uit te schakelen. De catalogus gebruikt een afzonderlijke supervisieverbinding; zonder
expliciete verbindingsinstellingen voor `appServer` gebruikt die verbinding standaard beheerde
stdio met gebruikershome, terwijl de gewone harness agentspecifiek blijft. Expliciete
instellingen voor `appServer` worden door beide paden gerespecteerd. Stel `homeScope: "user"`
expliciet in, zoals hierboven, wanneer de gewone harness ook native status moet delen.

## Toezicht houden op Codex-sessies

Dezelfde `codex`-plugin kan niet-gearchiveerde Codex-sessies van de Gateway-
computer en aangemelde gekoppelde Nodes weergeven. Een opgeslagen of inactieve lokale Gateway-sessie kan
een modelvergrendelde chat maken die de begrensde, blijvend opgeslagen geschiedenis van gebruikers en assistenten
spiegelt. De privébinding gebruikt de supervisieverbinding voor de native
momentopname, canonieke branch en latere beurten, terwijl gewone Codex-sessies
agentspecifiek blijven. Bij de eerste canonieke start worden exact het model en de provider gebruikt die
Codex voor de afsplitsing van de momentopname retourneert. Bij latere hervattingen wordt de selectie overgelaten aan de
native configuratie van Codex; het buitenste OpenClaw-model en de fallback-keten vervangen
deze nooit. Opgeslagen en inactieve rijen kunnen worden gearchiveerd na expliciete bevestiging
dat er geen andere uitvoerder actief is. Actieve bronnen kunnen geen branch maken en niet worden gearchiveerd; een bestaande
chat onder supervisie kan nog steeds worden geopend. Sessies op gekoppelde Nodes blijven beperkt tot metagegevens.

Zie [Toezicht houden op Codex-sessies](/plugins/codex-supervision) voor configuratie, regels voor afsplitsing,
beperkingen van gekoppelde Nodes, blootstelling van metagegevens en probleemoplossing.

## Configuratie

| Behoefte                                            | Instellen                                                                                       | Waar                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| De harness inschakelen                              | `plugins.entries.codex.enabled: true`                                                            | OpenClaw-configuratie              |
| Detectie van native Codex-sessies verbergen         | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex-pluginconfiguratie           |
| Een plugininstallatie met allowlist behouden        | Neem `codex` op in `plugins.allow`                                                               | OpenClaw-configuratie              |
| Geschikte OpenAI-beurten impliciet Codex laten gebruiken | Exacte officiële HTTPS-route voor Responses/ChatGPT, geen expliciete aanvraagoverschrijving, runtime niet ingesteld/`auto` | OpenAI-provider-/modelconfiguratie |
| Aanmelden met ChatGPT/Codex OAuth                   | `openclaw models auth login --provider openai`                                                   | CLI-authenticatieprofiel           |
| Reserve-API-sleutel voor Codex-uitvoeringen toevoegen | `openai:*`-profiel met API-sleutel, na abonnementsauthenticatie vermeld in `auth.order.openai`                 | CLI-authenticatieprofiel + OpenClaw-configuratie |
| Gesloten falen wanneer Codex niet beschikbaar is    | Provider of model `agentRuntime.id: "codex"`                                                     | OpenClaw-model-/providerconfiguratie |
| Rechtstreeks OpenAI API-verkeer gebruiken           | Provider of model `agentRuntime.id: "openclaw"` met normale OpenAI-authenticatie                          | OpenClaw-model-/providerconfiguratie |
| Gedrag van app-server afstemmen                     | `plugins.entries.codex.config.appServer.*`                                                       | Codex-pluginconfiguratie           |
| Native Codex-pluginapps inschakelen                 | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex-pluginconfiguratie           |
| Codex Computer Use inschakelen                      | `plugins.entries.codex.config.computerUse.*`                                                     | Codex-pluginconfiguratie           |

Geef de voorkeur aan `auth.order.openai` voor de volgorde abonnement-eerst/API-sleutel-als-reserve.
Bestaande verouderde profiel-ID's voor Codex-authenticatie en de verouderde Codex-authenticatievolgorde zijn
verouderde status die alleen door doctor wordt verwerkt; schrijf geen nieuwe verouderde Codex GPT-verwijzingen.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Voor een effectieve Codex-compatibele route blijven beide bovenstaande profielen kandidaten
voor dezelfde Codex-uitvoering. De profielvolgorde kiest referenties, niet de runtime.
Het wijzigen van de authenticatievolgorde maakt een aangepaste route, Completions-route, HTTP-route of
route met aanvraagoverschrijving niet Codex-compatibel.

### Compaction

Stel `compaction.model` of `compaction.provider` niet in voor door Codex ondersteunde
agenten. Codex voert Compaction uit via de native threadstatus van app-server, zodat
OpenClaw die lokale overschrijvingen van de samenvatter tijdens runtime negeert en
`openclaw doctor --fix` ze verwijdert wanneer de agent Codex gebruikt.

Lossless blijft ondersteund als contextengine voor samenstelling, opname en
onderhoud rond Codex-beurten, geconfigureerd via
`plugins.slots.contextEngine: "lossless-claw"` en
`plugins.entries.lossless-claw.config.summaryModel`, niet via
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migreert de
oude vorm `compaction.provider: "lossless-claw"` naar de Lossless-
contextenginesleuf wanneer Codex de actieve runtime is, maar native Codex blijft
Compaction beheren. De native app-serverharness ondersteunt contextengines
die samenstelling vóór de prompt nodig hebben; algemene CLI-backends, waaronder `codex-cli`,
bieden die hostmogelijkheid niet.

Voor door Codex ondersteunde agenten start `/compact` native Codex-app-server-
Compaction op de gebonden thread. OpenClaw wacht niet tot deze is voltooid,
legt geen OpenClaw-time-out op, start de gedeelde app-server niet opnieuw en valt niet terug op een
contextengine of openbare OpenAI-samenvatter. Als de native Codex-threadbinding
ontbreekt of verouderd is, faalt de opdracht gesloten in plaats van stilzwijgend
van Compaction-backend te wisselen.

De rest van deze pagina behandelt de implementatievorm, routering die gesloten faalt, het
goedkeuringsbeleid van de bewaker, native Codex-plugins en Computer Use. Zie voor volledige lijsten met
opties, standaardwaarden, enums, detectie, omgevingsisolatie, time-outs en
transportvelden van app-server
[Referentie voor de Codex-harness](/nl/plugins/codex-harness-reference).

## Codex-runtime verifiëren

Gebruik `/status` in de chat waarin je Codex verwacht. Een door Codex ondersteunde agentbeurt van OpenAI
toont:

```text
Runtime: OpenAI Codex
```

Controleer vervolgens de status van de Codex-app-server:

```text
/codex status
/codex models
```

`/codex status` rapporteert de verbinding met de app-server, het account, de frequentielimieten, MCP-
servers en Skills. `/codex models` vermeldt de actuele Codex-app-servercatalogus
voor de harness en het account. Als `/status` onverwacht is, raadpleeg dan
[Problemen oplossen](#troubleshooting).

## Routering en modelselectie

Houd providerreferenties en runtimebeleid gescheiden:

- Gebruik `openai/gpt-*` voor de canonieke selectie van OpenAI-modellen. Alleen het voorvoegsel
  selecteert Codex nooit.
- Als de runtime niet is ingesteld of `auto` is, mag alleen een exacte officiële HTTPS-route voor Platform Responses
  of ChatGPT Responses zonder een zelf opgegeven verzoekoverschrijving Codex
  impliciet selecteren.
- Gebruik geen verouderde Codex GPT-referenties in de configuratie; voer `openclaw doctor --fix` uit om
  verouderde referenties en achterhaalde routeringskoppelingen van sessies te herstellen.
- `agentRuntime.id: "codex"` maakt Codex een fail-closed-vereiste voor een
  compatibele route. Het maakt een incompatibele effectieve route niet compatibel.
- `agentRuntime.id: "openclaw"` laat een provider of model de ingebedde
  OpenClaw-runtime gebruiken wanneer dat de bedoeling is.
- `/codex ...` beheert systeemeigen gesprekken met de Codex-app-server vanuit de chat.
- ACP/acpx is een afzonderlijk extern harnesspad. Gebruik het alleen wanneer de gebruiker
  om ACP/acpx of een externe harnessadapter vraagt.

| Bedoeling van de gebruiker                                  | Gebruik                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| De huidige chat koppelen                                   | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Een bestaande Codex-thread hervatten                       | `/codex resume <thread-id>`                                                                           |
| Codex-threads vermelden of filteren                         | `/codex threads [filter]`                                                                             |
| Systeemeigen Codex-plugins vermelden                        | `/codex plugins list`                                                                                 |
| Een geconfigureerde systeemeigen Codex-plugin in- of uitschakelen | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Een opgeslagen Codex CLI-sessie hervatten als een beurt van een gekoppelde Node | `/codex sessions --host <node> [filter]`, daarna `/codex resume <session-id> --host <node> --bind here` |
| Niet-gearchiveerde Codex-sessies op verschillende computers bekijken | Schakel Codex-supervisie in en open **Codex Sessions**                                                  |
| Het model, de snelle modus of de machtigingen van de gekoppelde thread wijzigen | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| De actieve beurt stoppen of bijsturen                      | `/codex stop`, `/codex steer <text>`                                                                  |
| De huidige koppeling losmaken                              | `/codex detach` (alias `/codex unbind`)                                                               |
| Alleen Codex-feedback verzenden                            | `/codex diagnostics [note]`                                                                           |
| Een ACP/acpx-taak starten                                  | ACP/acpx-sessieopdrachten, niet `/codex`                                                               |

| Gebruikssituatie                                | Configureren                                                                                                 | Verifiëren                              | Opmerkingen                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Geschikte OpenAI-route met systeemeigen Codex-runtime | Exacte officiële HTTPS-route voor Responses/ChatGPT zonder zelf opgegeven verzoekoverschrijving, plus ingeschakelde Plugin `codex` | `/status` toont `Runtime: OpenAI Codex` | Impliciet pad wanneer de runtime niet is ingesteld/`auto` |
| Fail-closed als Codex niet beschikbaar is       | Provider of model `agentRuntime.id: "codex"`                                                                | Beurt mislukt in plaats van ingebedde terugval | Gebruik voor implementaties die uitsluitend Codex gebruiken |
| Rechtstreeks OpenAI API-sleutelverkeer via OpenClaw | Provider of model `agentRuntime.id: "openclaw"` en normale OpenAI-authenticatie                                      | `/status` toont de OpenClaw-runtime        | Alleen gebruiken wanneer OpenClaw bewust is gekozen |
| Verouderde configuratie                         | verouderde Codex GPT-referenties                                                                              | `openclaw doctor --fix` herschrijft deze     | Schrijf nieuwe configuratie niet op deze manier |
| Codex-adapter voor ACP/acpx                     | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP-taak-/sessiestatus                 | Afzonderlijk van de systeemeigen Codex-harness |

`agents.defaults.imageModel` volgt dezelfde splitsing op basis van het voorvoegsel. Gebruik `openai/gpt-*`
voor de normale OpenAI-route en `codex/gpt-*` alleen wanneer beeldbegrip
via een begrensde beurt van de Codex-app-server moet worden uitgevoerd. Doctor herschrijft verouderde
Codex GPT-referenties naar `openai/gpt-*`.

## Implementatiepatronen

### Eenvoudige Codex-implementatie

Gebruik de snelstartconfiguratie voor een OpenAI-model waarvan de effectieve officiële HTTPS-
route geschikt is om Codex impliciet te selecteren:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Implementatie met meerdere providers

Houd Claude als standaardagent en voeg een benoemde Codex-agent toe:

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

De agent `main` gebruikt zijn normale providerpad. De agent `codex` gebruikt de Codex-
app-server wanneer zijn effectieve OpenAI-route compatibel blijft; voeg expliciet
modelgebonden `agentRuntime.id: "codex"` toe wanneer dit een fail-closed-
vereiste moet zijn.

### Fail-closed Codex-implementatie

Een geschikte, exacte officiële HTTPS-route van OpenAI kan naar Codex worden omgezet wanneer de
meegeleverde Plugin beschikbaar is. Voeg expliciet runtimebeleid toe voor een vastgelegde
fail-closed-regel:

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
      model: "openai/gpt-5.6-sol",
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

Wanneer Codex wordt afgedwongen, mislukt OpenClaw vroegtijdig als de effectieve route niet als
Codex-compatibel is gedeclareerd, de Plugin is uitgeschakeld, de app-server te oud is of de
app-server niet kan starten.

## App-serverbeleid

Standaard start de Plugin het door OpenClaw beheerde Codex-binaire bestand lokaal met
stdio-transport. Stel `appServer.command` alleen in om bewust een
ander uitvoerbaar bestand te gebruiken. Gebruik WebSocket-transport alleen wanneer elders al
een app-server actief is:

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

Lokale app-serversessies via stdio gebruiken standaard de vertrouwde lokale operator-
houding: `approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Als lokale Codex-vereisten die
impliciete YOLO-houding niet toestaan, selecteert OpenClaw in plaats daarvan toegestane Guardian-machtigingen.
Wanneer voor de sessie een OpenClaw-sandbox actief is, schakelt OpenClaw
voor die beurt de systeemeigen Code Mode van Codex, MCP-servers van de gebruiker en de uitvoering
van app-ondersteunde plugins uit, in plaats van te vertrouwen op sandboxing aan de hostzijde van Codex.
Shelltoegang verloopt in plaats daarvan via dynamische tools die door de OpenClaw-sandbox worden ondersteund,
zoals `sandbox_exec` en `sandbox_process`, wanneer de normale tools voor uitvoering/processen
beschikbaar zijn.

Gebruik de genormaliseerde uitvoermodus van OpenClaw voor systeemeigen automatische beoordeling door Codex vóór
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

Voor Codex-app-serversessies wordt `tools.exec.mode: "auto"` gekoppeld aan door Codex
Guardian beoordeelde goedkeuringen: doorgaans `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"` wanneer
de lokale vereisten deze waarden toestaan. In `tools.exec.mode: "auto"`
behoudt OpenClaw geen verouderde onveilige Codex-overschrijvingen `approvalPolicy: "never"` of
`sandbox: "danger-full-access"`; gebruik `tools.exec.mode: "full"` voor
een bewust gekozen Codex-houding zonder goedkeuringen. De verouderde voorinstelling
`plugins.entries.codex.config.appServer.mode: "guardian"`
werkt nog steeds, maar `tools.exec.mode: "auto"` is het genormaliseerde OpenClaw-oppervlak.

Zie [Machtigingsmodi](/nl/tools/permission-modes) voor de vergelijking op modusniveau met goedkeuringen voor hostuitvoering en ACPX-
machtigingen. Zie [Codex-harnessreferentie](/nl/plugins/codex-harness-reference) voor elk
app-serverveld, de authenticatievolgorde, omgevingsisolatie en het time-outgedrag.

## Opdrachten en diagnostiek

De Plugin `codex` registreert `/codex` als een slashopdracht op elk kanaal dat
OpenClaw-tekstopdrachten ondersteunt.

Voor systeemeigen uitvoering en bediening is een eigenaar of een Gateway-client met `operator.admin`
vereist: threads koppelen of hervatten, beurten verzenden of stoppen,
het model, de snelle modus of de machtigingsstatus wijzigen, comprimeren of beoordelen en
een koppeling losmaken. Andere geautoriseerde afzenders behouden alleen-lezenopdrachten voor status, hulp,
account, model, thread, MCP-server, Skills en inspectie van koppelingen.

Veelgebruikte vormen:

- `/codex status` controleert de verbinding met de app-server, modellen, het account, frequentie-
  limieten, MCP-servers en Skills.
- `/codex models` vermeldt actuele modellen van de Codex-app-server.
- `/codex threads [filter]` vermeldt recente threads van de Codex-app-server.
- `/codex resume <thread-id>` koppelt de huidige OpenClaw-sessie aan een
  bestaande Codex-thread.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  koppelt de huidige chat.
- `/codex detach` (of `/codex unbind`) maakt de huidige koppeling los.
- `/codex binding` beschrijft de huidige koppeling.
- `/codex stop` stopt de actieve beurt; `/codex steer <text>` stuurt deze bij.
- `/codex model <model>`, `/codex fast [on|off|status]` en
  `/codex permissions [default|yolo|status]` wijzigen de status per gesprek.
- `/codex compact` vraagt de Codex-app-server om de gekoppelde thread te comprimeren.
- `/codex review` start een systeemeigen Codex-beoordeling voor de gekoppelde thread.
- `/codex diagnostics [note]` vraagt om bevestiging voordat Codex-feedback voor de
  gekoppelde thread wordt verzonden.
- `/codex account` toont de account- en frequentielimietstatus.
- `/codex mcp` vermeldt de status van MCP-servers van de Codex-app-server.
- `/codex skills` vermeldt de Skills van de Codex-app-server.
- `/codex plugins list`, `/codex plugins enable <name>` en
  `/codex plugins disable <name>` beheren geconfigureerde systeemeigen Codex-plugins.
- `/codex computer-use [status|install]` beheert Codex Computer Use.
- `/codex help` vermeldt de volledige opdrachtstructuur.

Voor de meeste ondersteuningsmeldingen begin je met `/diagnostics [note]` in het
gesprek waarin de bug optrad. Hiermee wordt één diagnostisch Gateway-rapport
gemaakt en wordt voor Codex-harnesssessies om toestemming gevraagd om de
relevante Codex-feedbackbundel te verzenden. Zie
[Diagnostische export](/nl/gateway/diagnostics) voor het privacymodel en het gedrag
in groepschats. Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek
de Codex-feedback voor de momenteel gekoppelde thread wilt uploaden zonder
de volledige diagnostische Gateway-bundel.

### Codex-threads lokaal inspecteren

De snelste manier om een mislukte Codex-uitvoering te inspecteren, is vaak de
native Codex-thread rechtstreeks te openen:

```bash
codex resume <thread-id>
```

Haal de thread-id op uit het voltooide antwoord van `/diagnostics`, `/codex binding`
of `/codex threads [filter]`.

Zie voor het uploadmechanisme en de grenzen van diagnostiek op runtimeniveau
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime#codex-feedback-upload).

### Authenticatievolgorde

In de standaard persoonlijke map per agent wordt authenticatie in deze volgorde geselecteerd:

1. Geordende OpenAI-authenticatieprofielen voor de agent, bij voorkeur onder
   `auth.order.openai`. Voer `openclaw doctor --fix` uit om oudere verouderde
   Codex-authenticatieprofiel-id's en de verouderde Codex-authenticatievolgorde te migreren.
2. Het bestaande account van de app-server in de persoonlijke Codex-map van die agent.
3. Alleen voor lokale app-serverstarts via stdio: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel voor een ChatGPT-abonnement aantreft,
verwijdert het `CODEX_API_KEY` en `OPENAI_API_KEY` uit het gestarte onderliggende Codex-
proces. Zo blijven API-sleutels op Gateway-niveau beschikbaar voor embeddings of
rechtstreekse OpenAI-modellen, zonder dat native Codex-app-serverbeurten
per ongeluk via de API worden gefactureerd. Expliciete Codex-profielen met een
API-sleutel en lokale terugval op een omgevingssleutel via stdio gebruiken de
app-serveraanmelding in plaats van de overgenomen omgeving van het onderliggende
proces. App-serververbindingen via WebSocket ontvangen geen terugval op een
Gateway-API-sleutel uit de omgeving; gebruik een expliciet authenticatieprofiel of
het eigen account van de externe app-server.

Als een abonnementsprofiel een Codex-gebruikslimiet bereikt, registreert OpenClaw
het tijdstip waarop de limiet opnieuw wordt ingesteld wanneer Codex dit meldt, en
probeert het voor dezelfde Codex-uitvoering het volgende geordende
authenticatieprofiel. Zodra het tijdstip voor opnieuw instellen is verstreken,
komt het abonnementsprofiel weer in aanmerking zonder het geselecteerde
`openai/gpt-*`-model of de Codex-runtime te wijzigen.

Wanneer native Codex-plugins zijn geconfigureerd, installeert of vernieuwt
OpenClaw die plugins via de verbonden app-server voordat apps die eigendom zijn
van plugins beschikbaar worden gesteld aan de Codex-thread. `app/list` blijft
de bron van waarheid voor app-id's, toegankelijkheid en metadata, maar OpenClaw
beheert de activeringsbeslissing per thread: als het beleid een vermelde
toegankelijke app toestaat, verzendt OpenClaw `thread/start.config.apps[appId].enabled = true`, zelfs wanneer
`app/list` momenteel meldt dat die app is uitgeschakeld. Dit pad
verzint geen app-installaties voor onbekende id's; OpenClaw activeert alleen
marketplace-plugins met `plugin/install` en vernieuwt daarna de inventaris.

### Omgevingsisolatie

Voor lokale app-serverstarts via stdio stelt OpenClaw `CODEX_HOME` in op een
map per agent, zodat Codex-configuratie, authenticatie-/accountbestanden,
plugincache/-gegevens en native threadstatus standaard niet de persoonlijke
`~/.codex` van de beheerder lezen of beschrijven. OpenClaw behoudt de normale
`HOME` van het proces; subprocessen van Codex-uitvoeringen kunnen nog
steeds configuratie en tokens in de persoonlijke gebruikersmap vinden, en
Codex kan gedeelde vermeldingen in `$HOME/.agents/skills` en
`$HOME/.agents/plugins/marketplace.json` vinden. Met
`appServer.homeScope: "user"` gebruikt OpenClaw in plaats daarvan de native persoonlijke
Codex-map van de gebruiker en het bestaande account daarvan, zonder een
OpenClaw-authenticatieprofiel te injecteren.

Als een implementatie aanvullende omgevingsisolatie nodig heeft, voeg je die
variabelen toe aan `appServer.clearEnv`:

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

`appServer.clearEnv` is alleen van invloed op het gestarte onderliggende Codex-app-serverproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` tijdens
de normalisatie van lokale starts uit deze lijst: `CODEX_HOME` blijft verwijzen
naar het geselecteerde agent- of gebruikersbereik en `HOME` blijft
overgenomen, zodat subprocessen de normale status uit de persoonlijke gebruikersmap kunnen gebruiken.

### Dynamische tools en zoeken op het web

Dynamische Codex-tools gebruiken standaard `searchable`-laden. OpenClaw stelt
normaal gesproken geen dynamische tools beschikbaar die native
Codex-werkruimtebewerkingen dupliceren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` en `tool_search_code`. De meeste
overige OpenClaw-integratietools, zoals berichten, media, Cron,
browser, Nodes, Gateway en `heartbeat_respond`, zijn via
Codex-toolzoeken beschikbaar onder de naamruimte `openclaw`, waardoor de
aanvankelijke modelcontext kleiner blijft. De shell-terugval voor beperkte beurten
vormt de uitzondering voor `exec` en `process` wanneer een eindige
toegestane lijst de native Code Mode uitschakelt; toegestane runtimelijsten en
`codexDynamicToolsExclude` blijven van toepassing.

Tools die zijn gemarkeerd als `catalogMode: "direct-only"`, waaronder de OpenClaw-tool
`computer`, gebruiken in plaats daarvan de naamruimte `openclaw_direct`.
Codex behandelt die naamruimte als `DirectModelOnly`, zodat deze tools in normale
threads en threads die uitsluitend Code Mode gebruiken rechtstreeks zichtbaar
blijven voor het model, in plaats van geneste Code Mode-aanroepen van
`tools.*` te doorlopen.

Zoeken op het web gebruikt standaard de gehoste Codex-tool `web_search` wanneer
zoeken is ingeschakeld en er geen beheerde provider is geselecteerd. Native
gehost zoeken en de beheerde dynamische tool `web_search` van OpenClaw
sluiten elkaar uit, zodat beheerd zoeken de native domeinbeperkingen niet kan
omzeilen. OpenClaw gebruikt de beheerde tool wanneer gehost zoeken niet
beschikbaar of expliciet uitgeschakeld is, of is vervangen door een
geselecteerde beheerde provider. OpenClaw houdt de zelfstandige Codex-extensie
`web.run` uitgeschakeld, omdat productieapp-serververkeer de door de
gebruiker gedefinieerde naamruimte `web` afwijst. `tools.web.search.enabled: false`
schakelt beide paden uit, evenals LLM-only-uitvoeringen waarbij tools zijn
uitgeschakeld. Codex behandelt `"cached"` als een voorkeur en zet deze om
in actuele externe toegang voor onbeperkte app-serverbeurten. Automatische
beheerde terugval wordt niet uitgevoerd wanneer native `allowedDomains` zijn
ingesteld, zodat de toegestane lijst niet kan worden omzeild. Aanhoudende
wijzigingen in het effectieve zoekbeleid laten de gekoppelde Codex-thread vóór
de volgende beurt roteren; tijdelijke beperkingen per beurt gebruiken een
tijdelijke beperkte thread en behouden de bestaande koppeling om later te hervatten.

`sessions_yield` en bronantwoorden die alleen berichtentools gebruiken, blijven
rechtstreeks verlopen omdat dit contracten voor beurtbesturing zijn.
`sessions_spawn` blijft doorzoekbaar, zodat de native `spawn_agent` van Codex
het primaire Codex-subagentoppervlak blijft, terwijl expliciete delegatie via
OpenClaw of ACP nog steeds beschikbaar is via de dynamische toolnaamruimte
`openclaw`. Samenwerkingsinstructies voor Heartbeat geven Codex opdracht
om vóór het beëindigen van een Heartbeat-beurt naar `heartbeat_respond` te zoeken
wanneer de tool nog niet is geladen.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt met een aangepaste
Codex-app-server die niet naar uitgestelde dynamische tools kan zoeken, of wanneer
je de volledige toolpayload debugt.

### Configuratievelden

Ondersteunde Codex-pluginvelden op het hoogste niveau:

| Veld                       | Standaard      | Betekenis                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gebruik `"direct"` om dynamische OpenClaw-tools rechtstreeks in de initiële Codex-toolcontext te plaatsen. |
| `codexDynamicToolsExclude` | `[]`           | Aanvullende namen van dynamische OpenClaw-tools die uit Codex-app-serverbeurten moeten worden weggelaten. |
| `codexPlugins`             | uitgeschakeld  | Ondersteuning voor native Codex-plugins/apps voor gemigreerde, vanuit de bron geïnstalleerde gecureerde plugins. |
| `sessionCatalog`           | ingeschakeld   | Zijbalkdetectie voor native Codex-sessies op deze Gateway en in aanmerking komende gekoppelde Nodes. |
| `supervision`              | uitgeschakeld  | Beleid voor transcripties en schrijfbeheer van native sessies, gericht op agents.        |

Ondersteunde velden voor `appServer`:

| Veld                                          | Standaardwaarde                                        | Betekenis                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` start Codex; expliciete `"unix"` maakt verbinding met de lokale besturingssocket; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                    |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoleert de normale harnasstatus per OpenClaw-agent. `"user"` is een expliciete opt-in die de systeemeigen `$CODEX_HOME` of `~/.codex` deelt, systeemeigen authenticatie gebruikt en threadbeheer alleen voor de eigenaar inschakelt. Het gebruikersbereik ondersteunt lokale stdio of Unix-transport. Voor de afzonderlijke supervisieverbinding wordt een niet-ingestelde waarde omgezet naar `"user"` voor stdio of Unix en `"agent"` voor WebSocket.     |
| `command`                                     | beheerd Codex-binair bestand                           | Uitvoerbaar bestand voor stdio-transport. Laat dit niet ingesteld om het beheerde binaire bestand te gebruiken; stel het alleen in voor een expliciete overschrijving.                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | niet ingesteld                                         | WebSocket-URL van de app-server of `unix://`-URL. Een expliciet leeg Unix-pad selecteert de canonieke besturingssocket in de thuismap van de gebruiker.                                                                                                                                                                                                                                         |
| `authToken`                                   | niet ingesteld                                         | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput, zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | Aanvullende WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                   | Namen van aanvullende omgevingsvariabelen die uit het gestarte stdio-app-serverproces worden verwijderd nadat OpenClaw de overgenomen omgeving heeft opgebouwd. OpenClaw behoudt de geselecteerde `CODEX_HOME` en de overgenomen `HOME` voor lokale starts.                                                                                                                                    |
| `codeModeOnly`                                | `false`                                                | Schakel optioneel het uitsluitend op codemodus gerichte tooloppervlak van Codex in. Normale dynamische OpenClaw-tools blijven beschikbaar via geneste `tools.*`-aanroepen; `openclaw_direct`-tools blijven rechtstreeks zichtbaar voor het model.                                                                                                                                                      |
| `remoteWorkspaceRoot`                         | niet ingesteld                                         | Externe hoofdmap van de Codex-app-serverwerkruimte. Wanneer deze is ingesteld, leidt OpenClaw de lokale hoofdmap van de werkruimte af uit de herleide OpenClaw-werkruimte, behoudt het huidige cwd-achtervoegsel onder deze externe hoofdmap en stuurt alleen de uiteindelijke cwd van de app-server naar Codex. Als de cwd buiten de herleide hoofdmap van de OpenClaw-werkruimte valt, sluit OpenClaw de bewerking af in plaats van een gateway-lokaal pad naar de externe app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                                | Time-out voor aanroepen van het besturingsvlak van de app-server.                                                                                                                                                                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Stille periode nadat Codex een beurt accepteert of na een app-serververzoek binnen een beurt, terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                     |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Bewaking voor inactiviteit na voltooiing en voortgang, gebruikt na een tooloverdracht, voltooiing van een systeemeigen tool, onbewerkte assistentvoortgang na een tool, voltooiing van onbewerkte redenering of redeneervoortgang terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware werklasten waarbij synthese na een tool terecht langer stil kan blijven dan het budget voor de definitieve assistentuitvoer.                                |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO niet toestaan | Voorinstelling voor YOLO of door een toezichthouder beoordeelde uitvoering. Lokale stdio-vereisten zonder `danger-full-access`, `never`-goedkeuring of de `user`-beoordelaar maken de toezichthouder de impliciete standaardwaarde.                                                                                                                                                            |
| `approvalPolicy`                              | `"never"` of een toegestaan goedkeuringsbeleid voor de toezichthouder | Systeemeigen Codex-goedkeuringsbeleid dat naar het starten/hervatten van een thread en naar een beurt wordt gestuurd. Standaardwaarden voor de toezichthouder geven de voorkeur aan `"on-request"` wanneer dit is toegestaan.                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` of een toegestane sandbox voor de toezichthouder | Systeemeigen Codex-sandboxmodus die naar het starten/hervatten van een thread wordt gestuurd. Standaardwaarden voor de toezichthouder geven de voorkeur aan `"workspace-write"` wanneer dit is toegestaan, en anders aan `"read-only"`. Wanneer een OpenClaw-sandbox actief is, gebruiken `danger-full-access`-beurten Codex `workspace-write` met netwerktoegang die is afgeleid van de uitgaande-verbindingsinstelling van de OpenClaw-sandbox.                                                                                     |
| `approvalsReviewer`                           | `"user"` of een toegestane beoordelaar voor de toezichthouder | Gebruik `"auto_review"` om Codex systeemeigen goedkeuringsprompts te laten beoordelen wanneer dit is toegestaan; gebruik anders `guardian_subagent` of `user`. `guardian_subagent` blijft een verouderde alias.                                                                                                                                                                         |
| `serviceTier`                                 | niet ingesteld                                         | Optionele servicelaag voor de Codex-app-server. `"priority"` schakelt routering in snelle modus in, `"flex"` vraagt flexibele verwerking aan, `null` wist de overschrijving en de verouderde `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                        |
| `networkProxy`                                | uitgeschakeld                                          | Schakel optioneel netwerken via het Codex-machtigingsprofiel in voor app-serveropdrachten. OpenClaw definieert de geselecteerde `permissions.<profile>.network`-configuratie en selecteert deze met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                        |
| `experimental.sandboxExecServer`              | `false`                                                | Preview-opt-in waarmee een door een OpenClaw-sandbox ondersteunde Codex-omgeving bij de ondersteunde Codex-app-server wordt geregistreerd, zodat systeemeigen Codex-uitvoering binnen de actieve OpenClaw-sandbox kan plaatsvinden.                                                                                                                                                                |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook `features.network_proxy.enabled`
en `default_permissions` in de Codex-threadconfiguratie in, zodat het gegenereerde
machtigingsprofiel door Codex beheerd netwerken kan starten. OpenClaw
genereert standaard een botsingsbestendige `openclaw-network-<fingerprint>`-profielnaam
uit de profielinhoud; gebruik `profileName` alleen wanneer een stabiele lokale naam
vereist is.

```json5
{
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
}
```

Als de normale app-serverruntime `danger-full-access` zou zijn, gebruikt het inschakelen van
`networkProxy` bestandssysteemtoegang in werkruimtestijl voor het gegenereerde
machtigingsprofiel: door Codex beheerde netwerkhandhaving is netwerken binnen
de sandbox, dus een profiel met volledige toegang zou uitgaand verkeer niet beschermen.
Domeinvermeldingen gebruiken `allow` of `deny`; Unix-socketvermeldingen gebruiken de
waarden `allow` of `none` van Codex.

### Dynamische time-outs voor toolaanroepen

Dynamische toolaanroepen die eigendom zijn van OpenClaw worden onafhankelijk begrensd van
`appServer.requestTimeoutMs`: Codex-`item/tool/call`-verzoeken gebruiken standaard een
OpenClaw-waakhond van 90 seconden. Een positief `timeoutMs`-argument per aanroep
verlengt of verkort het specifieke toolbudget, met een maximum van 600000 ms.
De `image_generate`-tool gebruikt `agents.defaults.imageGenerationModel.timeoutMs`
wanneer de toolaanroep geen eigen time-out opgeeft, en anders een standaardwaarde van
120 seconden voor het genereren van afbeeldingen. De `image`-tool voor mediabegrip
gebruikt `tools.media.image.timeoutSeconds` of de standaardwaarde van 60 seconden voor media; voor
afbeeldingsbegrip geldt die time-out voor het verzoek zelf en wordt deze niet
verminderd door eerder voorbereidend werk. Bij een time-out breekt OpenClaw waar ondersteund het
toolsignaal af en retourneert het een mislukte respons van de dynamische tool aan Codex,
zodat de beurt kan doorgaan in plaats van de sessie in `processing` achter te laten.
Deze waakhond is het buitenste dynamische `item/tool/call`-budget; providerspecifieke
time-outs voor verzoeken worden binnen die aanroep uitgevoerd en behouden hun eigen time-outsemantiek.

Nadat Codex een beurt accepteert en nadat OpenClaw reageert op een tot de beurt beperkt
app-serververzoek, verwacht de harness dat Codex binnen de huidige beurt voortgang boekt
en de native beurt uiteindelijk afrondt met `turn/completed`. Als de
app-server `appServer.turnCompletionIdleTimeoutMs` stil blijft, onderbreekt OpenClaw
naar beste vermogen de Codex-beurt, registreert het een diagnostische time-out en
maakt het de OpenClaw-sessiebaan vrij, zodat volgende chatberichten niet
achter een verouderde native beurt in de wachtrij blijven staan. De meeste niet-terminale meldingen voor
dezelfde beurt schakelen die korte waakhond uit, omdat Codex heeft bewezen dat de beurt
nog actief is.

Tooloverdrachten gebruiken een langer inactiviteitsbudget na een tool: nadat OpenClaw een
`item/tool/call`-respons retourneert, nadat native toolitems zoals
`commandExecution` zijn voltooid, na onbewerkte `custom_tool_call_output`-
voltooiingen en na onbewerkte assistentvoortgang na een tool, onbewerkte redeneer-
voltooiingen of redeneervoortgang. De bewaking gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer dit is geconfigureerd en
standaard anders vijf minuten; hetzelfde budget verlengt ook de
voortgangswaakhond voor het stille synthesevenster voordat Codex de
volgende gebeurtenis van de huidige beurt uitzendt. Globale app-servermeldingen, zoals
updates over snelheidslimieten, stellen de voortgang bij inactiviteit van de beurt niet opnieuw in. Redeneervoltooiingen,
voltooiingen van commentary-`agentMessage` en onbewerkte redeneer- of
assistentvoortgang vóór een tool kunnen worden gevolgd door een automatisch definitief antwoord, dus gebruiken ze
de antwoordbewaking na voortgang in plaats van de sessiebaan
onmiddellijk vrij te geven.

Alleen voltooide definitieve/niet-commentary `agentMessage`-items en onbewerkte
assistentvoltooiingen vóór een tool activeren de vrijgave bij assistentuitvoer: als Codex daarna
stil blijft zonder `turn/completed`, onderbreekt OpenClaw naar beste vermogen de native
beurt en geeft het de sessiebaan vrij. Als een andere bewaking van een beurt die vrijgavewedloop
wint, accepteert OpenClaw het voltooide definitieve assistentitem alsnog zodra er geen
native verzoek, item of voltooiing van een dynamische tool meer actief is en de
vrijgave bij assistentuitvoer nog steeds bij het laatst voltooide item hoort, zonder
een latere itemvoltooiing. Hierdoor kan het definitieve antwoord na
voltooid toolwerk behouden blijven zonder de beurt opnieuw af te spelen. Gedeeltelijke assistentdelta's,
verouderde eerdere antwoorden en lege latere voltooiingen komen niet in aanmerking.

Stdio-app-serverfouten die veilig opnieuw kunnen worden afgespeeld, waaronder time-outs door inactiviteit
bij voltooiing van de beurt zonder bewijs van een assistent, tool, actief item of neveneffect,
worden één keer opnieuw geprobeerd met een nieuwe app-serverpoging. Onveilige time-outs stellen de
vastgelopen app-serverclient alsnog buiten gebruik en geven de OpenClaw-sessiebaan vrij; ze
wissen ook de verouderde native threadkoppeling in plaats van automatisch
opnieuw te worden afgespeeld. Time-outs van de voltooiingsbewaking tonen Codex-specifieke
time-outtekst: gevallen die veilig opnieuw kunnen worden afgespeeld melden dat de respons mogelijk onvolledig is, terwijl onveilige
gevallen de gebruiker vertellen de huidige status te controleren voordat deze het opnieuw probeert. Openbare diagnostiek voor time-outs
bevat structurele velden zoals de methode van de laatste app-servermelding,
de id/het type/de rol van het onbewerkte assistentresponsitem, aantallen actieve
verzoeken/items en de status van geactiveerde bewaking; wanneer de laatste melding een
onbewerkt assistentresponsitem is, bevat deze ook een begrensd tekstvoorbeeld van de
assistent. Ze bevatten geen onbewerkte prompt- of toolinhoud.

### Omgevingsoverschrijvingen voor lokale tests

- `OPENCLAW_CODEX_APP_SERVER_BIN` omzeilt het beheerde binaire bestand wanneer
  `appServer.command` niet is ingesteld.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` is verwijderd. Gebruik in plaats daarvan
`plugins.entries.codex.config.appServer.mode: "guardian"`, of
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor een eenmalige lokale test. Configuratie
heeft de voorkeur voor herhaalbare implementaties, omdat het gedrag van de plugin
in hetzelfde beoordeelde bestand blijft als de rest van de Codex-harnessconfiguratie.

## Native Codex-plugins

Ondersteuning voor native Codex-plugins gebruikt de eigen app- en pluginmogelijkheden
van de Codex-app-server in dezelfde Codex-thread als de OpenClaw-harnessbeurt. OpenClaw
vertaalt Codex-plugins niet naar synthetische dynamische OpenClaw-tools van het type
`codex_plugin_*`.

`codexPlugins` beïnvloedt alleen sessies die de native Codex-harness selecteren.
Het heeft geen effect op uitvoeringen met de ingebouwde harness, normale uitvoeringen met de OpenAI-provider, ACP-
gesprekskoppelingen of andere harnesses.

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

De app-configuratie van de thread wordt berekend wanneer OpenClaw een Codex-harness-
sessie tot stand brengt of een verouderde Codex-threadkoppeling vervangt; deze wordt niet bij
elke beurt opnieuw berekend. Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset` of herstart
de Gateway, zodat toekomstige Codex-harnesssessies met de bijgewerkte verzameling apps
beginnen.

Zie voor migratiegeschiktheid, app-inventaris, beleid voor destructieve acties,
uitlokverzoeken en diagnostiek van native plugins
[Native Codex-plugins](/nl/plugins/codex-native-plugins).

Toegang tot apps en plugins aan de zijde van OpenAI wordt beheerd door het aangemelde Codex-
account en, voor Business- en Enterprise/Edu-werkruimten, door de app-
instellingen van de werkruimte. Zie
[Codex gebruiken met je ChatGPT-abonnement](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
voor het overzicht van OpenAI over account- en werkruimte-instellingen.

## Computergebruik

Computergebruik heeft een eigen installatiehandleiding:
[Codex-computergebruik](/nl/plugins/codex-computer-use).

Kort samengevat: OpenClaw levert de desktopbedieningsapp niet mee en voert
zelf geen desktopacties uit. Het bereidt de Codex-app-server voor, controleert of de
`computer-use`-MCP-server beschikbaar is en laat Codex vervolgens de native
MCP-toolaanroepen beheren tijdens beurten in Codex-modus.

## Runtimegrenzen

De Codex-harness wijzigt alleen de ingebedde agentexecutor op laag niveau.

- Dynamische OpenClaw-tools worden ondersteund. Codex vraagt OpenClaw om
  die tools uit te voeren, zodat OpenClaw deel blijft uitmaken van het uitvoeringspad.
- Codex-native shell-, patch-, MCP- en native app-tools worden beheerd door Codex.
  OpenClaw kan geselecteerde native gebeurtenissen observeren of blokkeren via het
  ondersteunde relais, maar herschrijft geen argumenten van native tools.
- Codex beheert native Compaction. OpenClaw houdt een transcriptspiegel bij voor
  kanaalgeschiedenis, zoeken, `/new`, `/reset` en toekomstige wisselingen van model of harness,
  maar vervangt Codex Compaction niet door een OpenClaw- of
  context-engine-samenvatter.
- Mediageneratie, mediabegrip, TTS, goedkeuringen en uitvoer van berichtentools
  blijven verlopen via de bijbehorende provider-/modelinstellingen van OpenClaw.
- `tool_result_persist` is van toepassing op toolresultaten in transcripten die eigendom zijn van OpenClaw,
  niet op Codex-native toolresultaatrecords.

Zie voor hooklagen, ondersteunde V1-oppervlakken, afhandeling van native machtigingen, sturing van
wachtrijen, de werking van het uploaden van Codex-feedback en details over Compaction
[Codex-harnessruntime](/nl/plugins/codex-harness-runtime).

## Problemen oplossen

**Codex verschijnt niet als een normale `/model`-provider:** dit wordt verwacht voor nieuwe
configuraties. Selecteer een `openai/gpt-*`-model, schakel
`plugins.entries.codex.enabled` in en controleer of `plugins.allow`
`codex` uitsluit.

**OpenClaw gebruikt de ingebouwde harness in plaats van Codex:** controleer of de effectieve
route exact een officiële HTTPS-route voor Platform Responses of ChatGPT Responses is,
geen zelfgeschreven verzoekoverschrijving bevat en of de Codex-plugin is geïnstalleerd en
ingeschakeld. Alleen het voorvoegsel `openai/gpt-*` is niet voldoende. Stel voor strikt bewijs tijdens
tests `agentRuntime.id: "codex"` in voor de provider of het model; geforceerd Codex mislukt
in plaats van terug te vallen wanneer de route of harness incompatibel is.

**De OpenAI Codex-runtime valt terug op het API-sleutelpad:** verzamel een geredigeerd
Gateway-fragment dat het model, de runtime, de geselecteerde provider en de
fout toont. Vraag betrokken medewerkers om deze alleen-lezenopdracht op hun
OpenClaw-host uit te voeren:

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

Nuttige fragmenten bevatten doorgaans `openai/gpt-5.6-sol` of `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` of `harnessRuntime`,
`candidateProvider: "openai"` en een resultaat van `401`, `Incorrect API key` of
`No API key`. Een gecorrigeerde uitvoering moet het OpenAI OAuth-pad
tonen in plaats van een gewone fout met de OpenAI API-sleutel.

**Configuratie met verouderde Codex-modelverwijzingen blijft bestaan:** voer `openclaw doctor --fix` uit.
Doctor herschrijft verouderde modelverwijzingen naar `openai/*`, verwijdert verouderde runtimepinnen voor sessies en
de volledige agent en behoudt bestaande overschrijvingen van authenticatieprofielen.

**De app-server wordt geweigerd:** gebruik Codex-app-server `0.143.0` of nieuwer.
Voorlopige versies met hetzelfde versienummer of versies met een buildsuffix, zoals
`0.143.0-alpha.2` of `0.143.0+custom`, worden geweigerd omdat OpenClaw
de stabiele protocolondergrens `0.143.0` test.

**`/codex status` kan geen verbinding maken:** controleer of de Plugin `codex`
is ingeschakeld, of `plugins.allow` deze bevat wanneer een toelatingslijst is
geconfigureerd en of eventuele aangepaste `appServer.command`, `url`, `authToken` of
headers geldig zijn.

**Modeldetectie is traag:** verlaag
`plugins.entries.codex.config.discovery.timeoutMs` of schakel detectie uit.
Zie [Naslaginformatie voor de Codex-harness](/nl/plugins/codex-harness-reference#model-discovery).

**WebSocket-transport mislukt onmiddellijk:** controleer `appServer.url`,
`authToken`, headers en of de externe app-server dezelfde versie van het
Codex-app-serverprotocol gebruikt.

**Systeemeigen shell- of patchhulpmiddelen worden geblokkeerd met `Native hook relay
unavailable`:** de Codex-thread probeert nog steeds een systeemeigen hook-relay-id te gebruiken
dat niet meer bij OpenClaw is geregistreerd. Dit is een transportprobleem met
systeemeigen Codex-hooks, geen fout in een ACP-backend, provider, GitHub of
shellopdracht. Start met `/new` of `/reset` een nieuwe sessie in de getroffen chat
en probeer daarna opnieuw een onschadelijke opdracht. Als dat eenmaal werkt,
maar de volgende aanroep van een systeemeigen hulpmiddel opnieuw mislukt,
behandel `/new` dan alleen als een tijdelijke oplossing: kopieer de
prompt naar een nieuwe sessie nadat je de Codex-app-server of OpenClaw Gateway
opnieuw hebt gestart, zodat oude threads worden verwijderd en registraties van
systeemeigen hooks opnieuw worden aangemaakt.

**Codex-hulpmiddelaanroepen maken te veel kortlevende hookprocessen aan:** stel
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
in en start de Gateway opnieuw. Hiermee wordt alleen het Codex-subproces
`PreToolUse` uitgeschakeld dat wordt gebruikt voor OpenClaw-lusdetectie en
de bijbehorende markering voor ontbrekend beleid. Vereiste relays voor
`before_tool_call` en beleid voor vertrouwde hulpmiddelen blijven ingeschakeld.

**Een niet-Codex-model gebruikt de ingebouwde harness:** dit is te verwachten,
tenzij provider- of modelruntimebeleid het naar een andere harness routeert.
Gewone providerverwijzingen die niet van OpenAI zijn, blijven in de modus
`auto` hun normale providerpad gebruiken.

**Computer Use is geïnstalleerd, maar hulpmiddelen worden niet uitgevoerd:** controleer
`/codex computer-use status` vanuit een nieuwe sessie. Als een hulpmiddel
`Native hook relay unavailable` meldt, gebruik dan het bovenstaande herstel voor de systeemeigen hook-relay.
Zie [Codex Computer Use](/nl/plugins/codex-computer-use#troubleshooting).

## Gerelateerd

- [Naslaginformatie voor de Codex-harness](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Codex-toezicht](/plugins/codex-supervision)
- [Systeemeigen Codex-plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Modelproviders](/nl/concepts/model-providers)
- [OpenAI-provider](/nl/providers/openai)
- [Hulp voor OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins voor agentharnassen](/nl/plugins/sdk-agent-harness)
- [Plugin-hooks](/nl/plugins/hooks)
- [Diagnostische gegevens exporteren](/nl/gateway/diagnostics)
- [Status](/nl/cli/status)
- [Testen](/nl/help/testing-live#live-codex-app-server-harness-smoke)
