---
read_when:
    - Je hebt elk configuratieveld van de Codex-harness nodig
    - Je wijzigt transport-, authenticatie-, discovery- of timeoutgedrag van app-server
    - Je debugt het opstarten van de Codex-harness, modeldetectie of omgevingsisolatie
summary: Configuratie-, authenticatie-, discovery- en app-serverreferentie voor de Codex-harness
title: Codex-harnasreferentie
x-i18n:
    generated_at: "2026-07-01T08:16:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Deze referentie behandelt de gedetailleerde configuratie voor de gebundelde `codex`
Plugin. Begin voor setup- en routeringsbeslissingen met
[Codex-harnas](/nl/plugins/codex-harness).

## Plugin-configuratieoppervlak

Alle Codex-harnasinstellingen staan onder `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Ondersteunde velden op het hoogste niveau:

| Veld                       | Standaard                | Betekenis                                                                                                                                 |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | ingeschakeld             | Instellingen voor modeldetectie voor Codex app-server `model/list`.                                                                       |
| `appServer`                | beheerde stdio-app-server | Instellingen voor transport, opdracht, auth, goedkeuring, sandbox en time-out.                                                            |
| `codexDynamicToolsLoading` | `"searchable"`           | Gebruik `"direct"` om dynamische OpenClaw-tools direct in de initiële Codex-toolcontext te plaatsen.                                      |
| `codexDynamicToolsExclude` | `[]`                     | Aanvullende namen van dynamische OpenClaw-tools die moeten worden weggelaten uit Codex app-server-rondes.                                 |
| `codexPlugins`             | uitgeschakeld            | Native ondersteuning voor Codex-Plugin/app voor gemigreerde, vanuit broncode geïnstalleerde samengestelde Plugins. Zie [Native Codex-Plugins](/nl/plugins/codex-native-plugins). |
| `computerUse`              | uitgeschakeld            | Setup voor Codex Computer Use. Zie [Codex Computer Use](/nl/plugins/codex-computer-use).                                                     |

## App-servertransport

Standaard start OpenClaw het beheerde Codex-binaire bestand dat met de gebundelde
Plugin wordt meegeleverd:

```bash
codex app-server --listen stdio://
```

Hierdoor blijft de app-serverversie gekoppeld aan de gebundelde `codex` Plugin in plaats van
aan welke afzonderlijke Codex CLI toevallig lokaal is geïnstalleerd. Stel
`appServer.command` alleen in wanneer je bewust een ander uitvoerbaar bestand wilt
draaien.

Gebruik WebSocket-transport voor een app-server die al draait:

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Ondersteunde `appServer`-velden:

| Veld                                          | Standaard                                             | Betekenis                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` start Codex; `"websocket"` maakt verbinding met `url`.                                                                                                                                                                                                                                                                                                                                  |
| `command`                                     | beheerd Codex-binair bestand                          | Uitvoerbaar bestand voor stdio-transport. Laat dit leeg om het beheerde binaire bestand te gebruiken.                                                                                                                                                                                                                                                                                             |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumenten voor stdio-transport.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | niet ingesteld                                        | WebSocket-URL van de app-server.                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | niet ingesteld                                        | Bearer-token voor WebSocket-transport. Accepteert een letterlijke tekenreeks of SecretInput zoals `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                  | Extra WebSocket-headers. Headerwaarden accepteren letterlijke tekenreeksen of SecretInput-waarden, bijvoorbeeld `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                  |
| `clearEnv`                                    | `[]`                                                  | Extra namen van omgevingsvariabelen die worden verwijderd uit het gestarte stdio-app-serverproces nadat OpenClaw de overgenomen omgeving heeft opgebouwd.                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | niet ingesteld                                        | Externe workspace-root van de Codex-app-server. Wanneer dit is ingesteld, leidt OpenClaw de lokale workspace-root af uit de opgeloste OpenClaw-workspace, behoudt het huidige cwd-achtervoegsel onder deze externe root en stuurt het alleen de uiteindelijke app-server-cwd naar Codex. Als de cwd buiten de opgeloste OpenClaw-workspace-root ligt, faalt OpenClaw gesloten in plaats van een gateway-lokaal pad naar de externe app-server te sturen. |
| `requestTimeoutMs`                            | `60000`                                               | Timeout voor app-server-aanroepen van het besturingsvlak.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Stille periode nadat Codex een beurt accepteert of na een beurtgebonden app-serververzoek terwijl OpenClaw wacht op `turn/completed`.                                                                                                                                                                                                                                                             |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Inactiviteits- en voortgangsbewaking voor voltooiing die wordt gebruikt na een tool-overdracht, voltooiing van een native tool, voortgang van een raw assistant na een tool, voltooiing van raw reasoning, of voortgang van reasoning terwijl OpenClaw wacht op `turn/completed`. Gebruik dit voor vertrouwde of zware workloads waarbij synthese na een tool legitiem langer stil kan blijven dan het uiteindelijke vrijgavebudget van de assistant. |
| `mode`                                        | `"yolo"` tenzij lokale Codex-vereisten YOLO verbieden | Preset voor YOLO of door guardian beoordeelde uitvoering.                                                                                                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` of een toegestaan guardian-goedkeuringsbeleid | Native Codex-goedkeuringsbeleid dat naar thread-start, hervatten en beurt wordt gestuurd.                                                                                                                                                                                                                                                                                                         |
| `sandbox`                                     | `"danger-full-access"` of een toegestane guardian-sandbox | Native Codex-sandboxmodus die naar thread-start en hervatten wordt gestuurd. Actieve OpenClaw-sandboxes beperken `danger-full-access`-beurten tot Codex `workspace-write`; de netwerkvlag van de beurt volgt de OpenClaw-sandbox-egress.                                                                                                                                                         |
| `approvalsReviewer`                           | `"user"` of een toegestane guardian-reviewer          | Gebruik `"auto_review"` om Codex native goedkeuringsprompts te laten beoordelen wanneer dat is toegestaan.                                                                                                                                                                                                                                                                                         |
| `defaultWorkspaceDir`                         | huidige procesmap                                     | Workspace die door `/codex bind` wordt gebruikt wanneer `--cwd` is weggelaten.                                                                                                                                                                                                                                                                                                                    |
| `serviceTier`                                 | niet ingesteld                                        | Optionele service-tier voor de Codex-app-server. `"priority"` schakelt fast-mode-routering in, `"flex"` vraagt flex-verwerking aan en `null` wist de override. Legacy `"fast"` wordt geaccepteerd als `"priority"`.                                                                                                                                                                               |
| `networkProxy`                                | uitgeschakeld                                         | Schakel Codex-netwerking met permissieprofiel in voor app-servercommando's. OpenClaw definieert de geselecteerde `permissions.<profile>.network`-configuratie en selecteert die met `default_permissions` in plaats van `sandbox` te sturen.                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                               | Preview-opt-in die een door de OpenClaw-sandbox ondersteunde Codex-omgeving registreert bij Codex app-server 0.132.0 of nieuwer, zodat native Codex-uitvoering binnen de actieve OpenClaw-sandbox kan draaien.                                                                                                                                                                                     |

`appServer.networkProxy` is expliciet omdat dit het Codex-sandboxcontract
wijzigt. Wanneer dit is ingeschakeld, stelt OpenClaw ook `features.network_proxy.enabled` en
`default_permissions` in de Codex-threadconfiguratie in, zodat het gegenereerde permissieprofiel
door Codex beheerde netwerking kan starten. Standaard genereert OpenClaw een
botsingsbestendige profielnaam `openclaw-network-<fingerprint>` op basis van de
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
inschakelen van `networkProxy` workspace-achtige bestandssysteemtoegang voor het gegenereerde
permissieprofiel. Door Codex beheerde netwerkhandhaving is gesandboxte netwerking,
dus een full-access-profiel zou uitgaand verkeer niet beschermen.

De Plugin blokkeert oudere of niet-geversioneerde app-server-handshakes. Codex app-server
moet stabiele versie `0.125.0` of nieuwer rapporteren.

OpenClaw behandelt niet-loopback WebSocket app-server-URL's als extern en vereist
identiteitsdragende WebSocket-authenticatie via `appServer.authToken` of een
`Authorization`-header. `appServer.authToken` en elke `appServer.headers.*`-waarde
kunnen een SecretInput zijn; de secrets-runtime lost SecretRefs en env-shorthand
op voordat OpenClaw app-server-startopties bouwt, en niet-opgeloste
gestructureerde SecretRefs falen voordat er een token of header wordt verzonden.
Wanneer native Codex-plugins zijn geconfigureerd, gebruikt OpenClaw het plugin control
plane van de verbonden app-server om die plugins te installeren of te vernieuwen
en vernieuwt daarna de app-inventaris zodat apps die eigendom zijn van plugins
zichtbaar zijn voor de Codex-thread. `app/list` blijft de gezaghebbende bron voor
inventaris en metadata, maar OpenClaw-beleid bepaalt of `thread/start`
`config.apps[appId].enabled = true` verzendt voor een vermelde toegankelijke app,
zelfs als Codex deze momenteel als uitgeschakeld markeert. Onbekende of ontbrekende
app-id's blijven fail-closed; dit pad activeert marketplace-plugins alleen via
`plugin/install` en vernieuwt de inventaris. Verbind OpenClaw alleen met externe
app-servers die worden vertrouwd om door OpenClaw beheerde plugininstallaties en
app-inventarisvernieuwingen te accepteren.

## Goedkeurings- en sandboxmodi

Lokale stdio-app-serversessies gebruiken standaard de YOLO-modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` en
`sandbox: "danger-full-access"`. Deze vertrouwde lokale operatorhouding laat
onbeheerde OpenClaw-beurten en heartbeats voortgang maken zonder native
goedkeuringsprompts waarvoor niemand aanwezig is om te antwoorden.

Als het lokale systeemvereistenbestand van Codex impliciete YOLO-goedkeurings-,
reviewer- of sandboxwaarden niet toestaat, behandelt OpenClaw de impliciete
standaard in plaats daarvan als guardian en selecteert toegestane
guardian-machtigingen. `tools.exec.mode: "auto"` forceert ook door guardian
gereviewde Codex-goedkeuringen en behoudt geen onveilige legacy-overrides
`approvalPolicy: "never"` of `sandbox: "danger-full-access"`; stel
`tools.exec.mode: "full"` in voor een bewuste houding zonder goedkeuring.
Hostnaam-matching
`[[remote_sandbox_config]]`-vermeldingen in hetzelfde vereistenbestand worden
gerespecteerd voor de beslissing over de sandboxstandaard.

Stel `appServer.mode: "guardian"` in voor door Codex guardian-gereviewde goedkeuringen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

De preset `guardian` wordt uitgebreid naar `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` en `sandbox: "workspace-write"` wanneer die
waarden zijn toegestaan. Afzonderlijke beleidsvelden overschrijven `mode`. De oudere
reviewerwaarde `guardian_subagent` wordt nog steeds geaccepteerd als
compatibiliteitsalias, maar nieuwe configuraties moeten `auto_review` gebruiken.

Wanneer een OpenClaw-sandbox actief is, draait het lokale Codex-app-serverproces nog steeds
op de Gateway-host. Daarom schakelt OpenClaw voor die beurt native Code Mode van
Codex, MCP-servers van gebruikers en app-ondersteunde pluginuitvoering uit in plaats
van host-side sandboxing van Codex als equivalent aan de OpenClaw-sandboxbackend
te behandelen. Shelltoegang wordt blootgesteld via door de OpenClaw-sandbox
ondersteunde dynamische tools zoals `sandbox_exec` en `sandbox_process` wanneer
de normale exec-/proces-tools beschikbaar zijn.

Op Ubuntu/AppArmor-hosts kan Codex bwrap onder `workspace-write` falen voordat
de shellopdracht start wanneer je bewust native Codex `workspace-write` uitvoert
zonder actieve OpenClaw-sandboxing. Als je
`bwrap: setting up uid map: Permission denied` of
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ziet, voer dan
`openclaw doctor` uit en herstel het gemelde host-namespacebeleid voor de
OpenClaw-servicegebruiker in plaats van bredere Docker-containerprivileges toe te
kennen. Geef de voorkeur aan een scoped AppArmor-profiel voor het serviceproces; de
fallback `kernel.apparmor_restrict_unprivileged_userns=0` geldt hostbreed en heeft
beveiligingstrade-offs.

## Gesandboxte native uitvoering

De stabiele standaard is fail-closed: actieve OpenClaw-sandboxing schakelt native
Codex-uitvoeringsoppervlakken uit die anders vanaf de Codex-app-serverhost zouden
draaien. Gebruik `appServer.experimental.sandboxExecServer: true` alleen wanneer
je Codex-ondersteuning voor externe omgevingen wilt proberen met de
sandboxbackend van OpenClaw. Dit previewpad vereist Codex-app-server 0.132.0 of
nieuwer.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Wanneer de vlag aan staat en de huidige OpenClaw-sessie is gesandboxed, start
OpenClaw een lokale local loopback exec-server, ondersteund door de actieve
sandbox, registreert deze bij Codex-app-server en start de Codex-thread en -beurt
met die omgeving die eigendom is van OpenClaw. Als de app-server de omgeving niet
kan registreren, faalt de run fail-closed in plaats van stilzwijgend terug te vallen
op hostuitvoering.

Dit previewpad is alleen lokaal. Een externe WebSocket-app-server kan de
loopback exec-server niet bereiken tenzij deze op dezelfde host draait, dus
OpenClaw wijst die combinatie af.

## Authenticatie en omgevingsisolatie

Authenticatie wordt in deze volgorde geselecteerd:

1. Een expliciet OpenClaw Codex-authenticatieprofiel voor de agent.
2. Het bestaande account van de app-server in de Codex-home van die agent.
3. Alleen voor lokale stdio-app-serverstarts: `CODEX_API_KEY`, daarna
   `OPENAI_API_KEY`, wanneer er geen app-serveraccount aanwezig is en OpenAI-authenticatie
   nog steeds vereist is.

Wanneer OpenClaw een Codex-authenticatieprofiel in ChatGPT-abonnementsstijl ziet,
verwijdert het `CODEX_API_KEY` en `OPENAI_API_KEY` uit het gespawnde
Codex-childproces. Daardoor blijven API-sleutels op Gateway-niveau beschikbaar voor
embeddings of directe OpenAI-modellen zonder dat native Codex-app-serverbeurten
per ongeluk via de API worden gefactureerd.

Expliciete Codex-API-sleutelprofielen en lokale stdio-env-sleutelfallback gebruiken
app-serverlogin in plaats van geërfde childproces-env. WebSocket-app-serververbindingen
ontvangen geen Gateway-env-API-sleutelfallback; gebruik een expliciet
authenticatieprofiel of het eigen account van de externe app-server.

Stdio-app-serverstarts erven standaard de procesomgeving van OpenClaw.
OpenClaw beheert de Codex-app-serveraccountbrug en stelt `CODEX_HOME` in op een
per-agentmap onder de OpenClaw-state van die agent. Daardoor blijven Codex-configuratie,
accounts, plugincache/-gegevens en threadstatus scoped tot de OpenClaw-agent in
plaats van binnen te lekken vanuit de persoonlijke `~/.codex`-home van de operator.

OpenClaw herschrijft `HOME` niet voor normale lokale app-serverstarts. Subprocessen
die door Codex worden uitgevoerd, zoals `openclaw`, `gh`, `git`, cloud-CLI's en
shellopdrachten, zien de normale proces-home en kunnen configuratie en tokens in de
user-home vinden. Codex kan ook `$HOME/.agents/skills` en
`$HOME/.agents/plugins/marketplace.json` ontdekken; die `.agents`-ontdekking wordt
bewust gedeeld met de operator-home en staat los van geïsoleerde `~/.codex`-state.

OpenClaw-plugins en OpenClaw-skill-snapshots blijven via het eigen
pluginregister en de skillloader van OpenClaw lopen. Persoonlijke Codex-`~/.codex`-assets
doen dat niet. Als je nuttige Codex CLI-skills of plugins hebt uit een Codex-home
die onderdeel moeten worden van een OpenClaw-agent, inventariseer ze dan expliciet:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Als een deployment aanvullende omgevingsisolatie nodig heeft, voeg die variabelen
toe aan `appServer.clearEnv`:

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

`appServer.clearEnv` beïnvloedt alleen het gespawnde Codex-app-server-childproces.
OpenClaw verwijdert `CODEX_HOME` en `HOME` uit deze lijst tijdens lokale
startnormalisatie: `CODEX_HOME` blijft per-agent, en `HOME` blijft geërfd zodat
subprocessen normale user-home-state kunnen gebruiken.

## Dynamische tools

Dynamische Codex-tools gebruiken standaard `searchable`-laden. OpenClaw stelt
geen dynamische tools beschikbaar die native Codex-workspacebewerkingen dupliceren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

De meeste resterende OpenClaw-integratietools, zoals messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond` en `web_search`, zijn beschikbaar
via Codex-toolzoekopdrachten onder de namespace `openclaw`. Dit houdt de initiële
modelcontext kleiner. `sessions_yield` en bronantwoorden die alleen message-tool
gebruiken blijven direct omdat dat turn-controlcontracten zijn. `sessions_spawn`
blijft searchable zodat de native `spawn_agent` van Codex het primaire
Codex-subagentoppervlak blijft, terwijl expliciete OpenClaw- of ACP-delegatie nog
steeds beschikbaar is via de dynamische-toolnamespace `openclaw`.

Stel `codexDynamicToolsLoading: "direct"` alleen in wanneer je verbinding maakt
met een aangepaste Codex-app-server die uitgestelde dynamische tools niet kan
doorzoeken of wanneer je de volledige toolpayload debugt.

## Time-outs

Dynamische toolcalls die eigendom zijn van OpenClaw worden onafhankelijk begrensd
van `appServer.requestTimeoutMs`. Elk Codex-`item/tool/call`-verzoek gebruikt de
eerste beschikbare time-out in deze volgorde:

- Een positief per-call-argument `timeoutMs`.
- Voor `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Voor `image_generate` zonder geconfigureerde time-out, de standaard van 120 seconden
  voor beeldgeneratie.
- Voor de media-understanding-tool `image`, `tools.media.image.timeoutSeconds`
  geconverteerd naar milliseconden, of de mediastandaard van 60 seconden. Voor
  beeldbegrip geldt dit voor het verzoek zelf en wordt het niet verminderd door
  eerdere voorbereidingswerkzaamheden.
- De standaard van 90 seconden voor dynamische tools.

Deze watchdog is het buitenste budget voor dynamische `item/tool/call`. Providerspecifieke
request-time-outs draaien binnen die call en behouden hun eigen time-outsemantiek.
Budgetten voor dynamische tools zijn afgetopt op 600000 ms. Bij time-out breekt
OpenClaw het toolsignaal af waar ondersteund en retourneert het een mislukte
dynamic-tool-response aan Codex zodat de beurt kan doorgaan in plaats van de sessie
in `processing` te laten staan.

Nadat Codex een beurt accepteert, en nadat OpenClaw heeft gereageerd op een
turn-scoped app-serververzoek, verwacht de harness dat Codex voortgang maakt in de
huidige beurt en uiteindelijk de native beurt afrondt met `turn/completed`. Als de
app-server stilvalt gedurende `appServer.turnCompletionIdleTimeoutMs`, onderbreekt
OpenClaw naar beste kunnen de Codex-beurt, registreert een diagnostische time-out
en geeft de OpenClaw-sessielane vrij zodat vervolgchatberichten niet achter een
verouderde native beurt in de wachtrij blijven staan.

De meeste niet-terminale meldingen voor dezelfde beurt schakelen die korte watchdog uit
omdat Codex heeft bewezen dat de beurt nog leeft. Tool-overdrachten gebruiken een langer
post-tool-inactiviteitsbudget: nadat OpenClaw een `item/tool/call`-respons retourneert, nadat
native toolitems zoals `commandExecution` zijn voltooid, na ruwe
`custom_tool_call_output`-voltooiingen, en na ruwe assistant-voortgang na tools,
ruwe reasoning-voltooiingen of reasoning-voortgang. De bewaker gebruikt
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` wanneer geconfigureerd en
valt anders terug op vijf minuten. Datzelfde post-toolbudget verlengt ook de
voortgangs-watchdog voor het stille synthesewindow voordat Codex de volgende
gebeurtenis van de huidige beurt uitzendt. Reasoning-voltooiingen, commentary
`agentMessage`-voltooiingen en ruwe reasoning- of assistant-voortgang vóór tools kunnen
worden gevolgd door een automatisch eindantwoord, dus gebruiken ze de antwoordbewaker
na voortgang in plaats van de sessielane direct vrij te geven. Alleen
definitieve/niet-commentary voltooide `agentMessage`-items en ruwe assistant-voltooiingen
vóór tools activeren de vrijgave voor assistant-uitvoer: als Codex daarna stilvalt zonder
`turn/completed`, onderbreekt OpenClaw naar beste vermogen de native beurt en geeft het
de sessielane vrij. Replay-veilige stdio-app-serverfouten, waaronder
inactiviteitstime-outs voor beurtvoltooiing zonder bewijs van assistant, tool, actief item
of bijwerking, worden één keer opnieuw geprobeerd met een nieuwe app-serverpoging. Onveilige
time-outs verwijderen nog steeds de vastgelopen app-serverclient en geven de OpenClaw-
sessielane vrij. Ze wissen ook de verouderde native threadbinding in plaats van automatisch
opnieuw te worden afgespeeld. Time-outs van de voltooiingsbewaking tonen Codex-specifieke
time-outtekst: replay-veilige gevallen zeggen dat de respons mogelijk onvolledig is, terwijl
onveilige gevallen de gebruiker vragen de huidige staat te verifiëren voordat ze opnieuw
proberen. Publieke time-outdiagnostiek bevat structurele velden zoals de laatste
app-servermeldingsmethode, id/type/rol van het ruwe assistant-responsitem, aantallen actieve
requests/items en de ingeschakelde bewakingsstatus. Wanneer de laatste melding een ruw
assistant-responsitem is, bevatten ze ook een begrensde preview van de assistant-tekst. Ze
bevatten geen ruwe prompt- of toolinhoud.

## Modelontdekking

Standaard vraagt de Codex Plugin de app-server om beschikbare modellen. Modelbeschikbaarheid
is eigendom van de Codex app-server, dus de lijst kan veranderen wanneer OpenClaw de gebundelde
`@openai/codex`-versie upgrade of wanneer een deployment
`appServer.command` naar een andere Codex-binary laat wijzen. Beschikbaarheid kan ook
accountgebonden zijn. Gebruik `/codex models` op een draaiende Gateway om de livecatalogus
voor die harness en dat account te zien.

Als ontdekking mislukt of een time-out krijgt, gebruikt OpenClaw een gebundelde fallbackcatalogus voor:

- GPT-5.5
- GPT-5.4 mini

De huidige gebundelde harness is `@openai/codex` `0.142.4`. Een `model/list`-probe
tegen die gebundelde app-server in een workspace met GPT-5.6 ingeschakeld retourneerde deze
publieke picker-rijen:

| Model-id              | Invoermodaliteiten | Reasoning-inspanningen               |
| --------------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`         | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image        | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image        | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text               | low, medium, high, xhigh             |

GPT-5.6-toegang is accountgebonden tijdens de beperkte preview. `max` is een
reasoning-inspanning van het model. `ultra` is afzonderlijke Codex-metadata voor
multi-agentorkestratie, geen standaard OpenAI-reasoning-inspanning.

Verborgen modellen kunnen door de app-servercatalogus worden geretourneerd voor interne of
gespecialiseerde flows, maar het zijn geen normale keuzes in de modelpicker.

Stem ontdekking af onder `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Schakel ontdekking uit wanneer je wilt dat startup geen Codex probeert en alleen de
fallbackcatalogus gebruikt:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Workspace-bootstrapbestanden

Codex verwerkt `AGENTS.md` zelf via native project-docontdekking. OpenClaw
schrijft geen synthetische Codex-project-docbestanden en is niet afhankelijk van Codex fallback-
bestandsnamen voor personabestanden, omdat Codex fallbacks alleen gelden wanneer
`AGENTS.md` ontbreekt.

Voor OpenClaw-workspacepariteit lost de Codex-harness de andere bootstrapbestanden op.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` en `USER.md` worden doorgestuurd als
OpenClaw Codex developer-instructies omdat ze de actieve agent, beschikbare
workspace-richtlijnen en het gebruikersprofiel definiëren. De compacte OpenClaw Skills-
lijst wordt doorgestuurd als beurtgebonden developer-instructies voor samenwerking.
`HEARTBEAT.md`-inhoud wordt niet geïnjecteerd; Heartbeat-beurten krijgen een pointer in
samenwerkingsmodus om het bestand te lezen wanneer het bestaat en niet leeg is. `MEMORY.md`-
inhoud uit de geconfigureerde agent-workspace wordt niet in de native Codex-beurtinvoer geplakt
wanneer memory-tools beschikbaar zijn voor die workspace; wanneer het bestaat, voegt de harness
een kleine workspace-memory-pointer toe aan beurtgebonden developer-instructies voor samenwerking
en moet Codex `memory_search` of `memory_get` gebruiken wanneer duurzame memory relevant is.
Als tools zijn uitgeschakeld, memory search niet beschikbaar is of de actieve workspace verschilt
van de agent-memory-workspace, gebruikt `MEMORY.md` het normale begrensde pad voor beurtcontext.
`BOOTSTRAP.md` wordt, wanneer aanwezig, doorgestuurd als OpenClaw-referentiecontext voor
beurtinvoer.

## Omgevingsoverschrijvingen

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` voor eenmalig lokaal testen. Config heeft
de voorkeur voor herhaalbare deployments omdat dit het Plugin-gedrag in hetzelfde
gereviewde bestand houdt als de rest van de Codex-harnessconfiguratie.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Native Codex plugins](/nl/plugins/codex-native-plugins)
- [Codex Computer Use](/nl/plugins/codex-computer-use)
- [OpenAI-provider](/nl/providers/openai)
- [Configuratiereferentie](/nl/gateway/configuration-reference)
