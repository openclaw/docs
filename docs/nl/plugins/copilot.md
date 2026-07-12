---
read_when:
    - Je wilt de GitHub Copilot SDK-harnas gebruiken voor een agent
    - U hebt configuratievoorbeelden nodig voor de `copilot`-runtime
    - Je koppelt een agent aan een Copilot-abonnement (github / openclaw / copilot) en wilt deze via de Copilot CLI uitvoeren
summary: Voer beurten van de ingebouwde OpenClaw-agent uit via de externe GitHub Copilot SDK-harnasomgeving
title: Copilot SDK-harnas
x-i18n:
    generated_at: "2026-07-12T09:03:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

De externe Plugin `@openclaw/copilot` voert ingebedde Copilot-agentbeurten voor abonnementen uit via de GitHub Copilot CLI (`@github/copilot-sdk`) in plaats van via de ingebouwde harness van OpenClaw. De Copilot CLI-sessie beheert de agentlus op laag niveau: native tooluitvoering, native compaction (`infiniteSessions`) en door de CLI beheerde threadstatus onder `copilotHome`. OpenClaw blijft verantwoordelijk voor chatkanalen, sessiebestanden, modelselectie, dynamische tools (via een bridge), goedkeuringen, medialevering, de zichtbare transcriptspiegel, `/btw`-tussenvragen (zie [Tussenvragen (`/btw`)](#side-questions-btw)) en `openclaw doctor`.

Begin voor de bredere verdeling tussen model, provider en runtime bij
[Agentruntimes](/nl/concepts/agent-runtimes).

## Vereisten

- OpenClaw met de Plugin `@openclaw/copilot` geïnstalleerd.
- Als uw configuratie `plugins.allow` gebruikt, neem dan `copilot` op (de manifest-id die de Plugin declareert). Een vermelding in de toelatingslijst met de npm-pakketnaam `@openclaw/copilot` komt niet overeen en laat de Plugin geblokkeerd, zelfs wanneer `agentRuntime.id: "copilot"` is ingesteld.
- Een GitHub Copilot-abonnement waarmee de Copilot CLI kan worden aangestuurd, of een omgevingsvariabele `gitHubToken`/vermelding in een authenticatieprofiel voor headless- of Cron-uitvoeringen.
- Een beschrijfbare map `copilotHome`. Standaard is dit `<agentDir>/copilot` wanneer OpenClaw een agentmap levert, en anders `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` voert het [doctor-contract](#doctor) van de Plugin uit voor het eigenaarschap van de sessiestatus en toekomstige configuratiemigraties. Het controleert de Copilot CLI-omgeving niet.

## Installatie

De Copilot-runtime wordt als externe Plugin geleverd, zodat het kernpakket `openclaw` niet `@github/copilot-sdk` of het platformspecifieke CLI-binaire bestand `@github/copilot-<platform>-<arch>` hoeft mee te leveren (samen ongeveer 260 MB). Installeer deze alleen voor agents die expliciet voor deze runtime kiezen:

```bash
openclaw plugins install @openclaw/copilot
```

De installatiewizard installeert de Plugin automatisch wanneer u voor het eerst een `github-copilot/*`-model selecteert **en** uw configuratie dat model (of de provider ervan) via `agentRuntime: { id: "copilot" }` naar de Copilot-runtime routeert; zie [Snel aan de slag](#quickstart). Zonder die expliciete keuze gebruikt OpenClaw de ingebouwde GitHub Copilot-provider en installeert het deze Plugin nooit.

De runtime zoekt de SDK in deze volgorde:

1. `import("@github/copilot-sdk")` vanuit het geïnstalleerde pakket `@openclaw/copilot`.
2. De terugvalmap `~/.openclaw/npm-runtime/copilot/` (verouderd installatiedoel op aanvraag).

Een ontbrekende SDK levert één fout op met code `COPILOT_SDK_MISSING` en de bovenstaande herinstallatieopdracht.

## Snel aan de slag

Koppel één model (of één provider) vast aan de harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Stel `agentRuntime.id` in bij één modelvermelding om alleen dat model via de harness te routeren, of bij een provider om elk model onder die provider te routeren.

`github-copilot/auto` is het overdraagbare uitgangspunt. Benoemde Copilot-modellen zijn afhankelijk van account- en organisatiebeleid; controleer of uw geauthenticeerde Copilot CLI een model daadwerkelijk beschikbaar stelt voordat u het vastlegt.

## Ondersteunde providers

De harness ondersteunt de canonieke provider `github-copilot` (in eigendom van `extensions/github-copilot`), plus aangepaste vermeldingen in `models.providers` wanneer het model een niet-lege `baseUrl` en een van deze `api`-vormen heeft:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI-compatibele aanvullingen)
- `openai-completions`
- `openai-responses`

Native provider-id's (`openai`, `anthropic`, `google`, `ollama`) blijven in eigendom van hun native runtimes. Gebruik in plaats daarvan een afzonderlijke aangepaste provider-id om een eindpunt via Copilot BYOK te routeren.

Copilot BYOK-eindpunten moeten openbare HTTPS-URL's zijn. De harness geeft de Copilot SDK per poging een loopback-proxy en stuurt vervolgens providerverkeer door via het beveiligde fetch-pad van OpenClaw, zodat DNS-pinning en SSRF-beleid onder het beheer van OpenClaw blijven. Gebruik de native OpenClaw-runtime voor lokale Ollama-, LM Studio- of LAN-modelservers.

## BYOK

Copilot BYOK gebruikt het contract voor aangepaste providers op sessieniveau van de SDK. OpenClaw geeft het opgeloste modeleindpunt, de API-sleutel, de bearer-tokenmodus, headers, model-id en context-/uitvoerlimieten door; de transportlogica van de provider blijft in de SDK en niet in de kern.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK-sessies krijgen afzonderlijke sleutels ten opzichte van abonnementssessies en andere BYOK-eindpunten of referenties. Het roteren van de sleutel, headers, het model of eindpunt start een nieuwe Copilot SDK-sessie in plaats van incompatibele status te hervatten.

## Authenticatie

Prioriteit, per agent toegepast tijdens `runCopilotAttempt`:

1. **Expliciete `useLoggedInUser: true`** in de invoer van de poging — gebruikt de aangemelde gebruiker van de Copilot CLI onder `copilotHome` van de agent.
2. **Expliciete `gitHubToken`** in de invoer van de poging (vereist `profileId` + `profileVersion`). Voor directe CLI-aanroepen en tests die het oplossen van authenticatieprofielen moeten omzeilen.
3. **Door het contract opgeloste `resolvedApiKey` + `authProfileId`** — het hoofdpad voor productie. De kern lost het geconfigureerde authenticatieprofiel `github-copilot` van de agent op (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) voordat de harness wordt aangeroepen, zodat een authenticatieprofiel `github-copilot:<profile>` van begin tot eind werkt voor headless-, Cron- of multiprofielconfiguraties zonder omgevingsvariabelen.
4. **Terugval op omgevingsvariabelen**, in deze volgorde gecontroleerd (de eerste niet-lege waarde wint; lege tekenreeksen gelden als afwezig; dit weerspiegelt de prioriteit van de geleverde provider `github-copilot` in `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — specifieke overschrijving voor de harness; hiermee kunt u een token voor de OpenClaw-harness vastleggen zonder de systeembrede configuratie van `gh`/Copilot CLI te verstoren.
   2. `COPILOT_GITHUB_TOKEN` — standaard omgevingsvariabele voor de Copilot SDK/CLI.
   3. `GH_TOKEN` — standaard omgevingsvariabele voor de `gh`-CLI.
   4. `GITHUB_TOKEN` — algemene terugval voor een GitHub-token.

   De samengestelde profiel-id van de pool is `env:<NAME>`; de profielversie is een niet-omkeerbare sha256-vingerafdruk van het token, zodat het roteren van de omgevingswaarde de clientpool netjes ongeldig maakt.

5. **Standaard `useLoggedInUser`** wanneer er geen tokensignaal beschikbaar is.

Elke agent krijgt een eigen `copilotHome`, zodat Copilot CLI-tokens, sessies en configuratie nooit tussen agents op dezelfde machine lekken. Standaard: `<agentDir>/copilot` (houdt SDK-status buiten dezelfde map als `models.json`/`auth-profiles.json` van OpenClaw), of `~/.openclaw/agents/<agentId>/copilot` wanneer geen agentmap wordt opgegeven. Overschrijf dit met `copilotHome: <path>` in de invoer van de poging voor een aangepaste locatie (bijvoorbeeld een gedeelde koppeling voor migratie).

Live harness-tests gebruiken `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` voor een rechtstreeks token. De gedeelde live-testconfiguratie wist `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` en `GITHUB_TOKEN` nadat echte authenticatieprofielen in de geïsoleerde testhome zijn klaargezet, zodat een via de speciale variabele doorgegeven waarde van `gh auth token` onterechte overslagen voorkomt zonder naar niet-gerelateerde testsuites te lekken.

## Configuratieoppervlak

De harness leest configuratie uit de invoer per poging (`runCopilotAttempt({...})`) plus een kleine reeks standaardwaarden uit omgevingsvariabelen binnen `extensions/copilot/src/`:

| Veld                     | Doel                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | CLI-statusmap per agent (standaardwaarden hierboven).                                                                                                                                                                                                                                                                                            |
| `model`                  | Tekenreeks of `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Laat weg om de normale modelselectie van de agent te gebruiken; de harness controleert of de opgeloste provider wordt ondersteund.                                                                                                                                       |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Wordt toegewezen vanuit de resolutie van `ThinkLevel`/`ReasoningLevel` van OpenClaw in `auto-reply/thinking.ts`.                                                                                                                                                                                        |
| `infiniteSessionConfig`  | Optionele overschrijving voor het SDK-blok `infiniteSessions`, aangestuurd door `harness.compact`. Kan veilig ongewijzigd blijven.                                                                                                                                                                                                               |
| `hooksConfig`            | Optionele configuratie voor native Copilot SDK-`SessionHooks` voor tool-/MCP-, gebruikersprompt-, sessie- en foutcallbacks. Staat los van de overdraagbare levenscyclushooks van OpenClaw.                                                                                                                                                         |
| `permissionPolicy`       | Optionele overschrijving voor de SDK-handler `onPermissionRequest` voor ingebouwde SDK-toolsoorten (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Standaard is dit `rejectAllPolicy` als veiligheidsnet; zie [Machtigingen en ask_user](#permissions-and-ask_user) waarom deze in de praktijk nooit wordt geactiveerd. |
| `enableSessionTelemetry` | Optionele vlag voor SDK-sessietelemetrie.                                                                                                                                                                                                                                                                                                       |

OpenClaw-Plugin-hooks hebben geen Copilot-specifieke configuratie per poging nodig. De harness voert `before_prompt_build` (en de verouderde compatibiliteitshook `before_agent_start`), `llm_input`, `llm_output` en `agent_end` uit via de standaard harness-helpers. Geslaagde SDK-compactions voeren ook `before_compaction` en `after_compaction` uit. Via een bridge gekoppelde OpenClaw-tools voeren `before_tool_call` uit en rapporteren `after_tool_call`; `hooksConfig` blijft bestemd voor uitsluitend native SDK-callbacks zonder overdraagbaar equivalent.

Niets anders in OpenClaw hoeft deze velden te kennen. Andere Plugins, kanalen en kerncode zien alleen de standaardvorm `AgentHarnessAttemptParams`/`AgentHarnessAttemptResult`.

## Compaction

Wanneer `harness.compact` wordt uitgevoerd, doet de Copilot SDK-harness het volgende:

1. Hervat de bijgehouden SDK-sessie zonder werk in behandeling voort te zetten.
2. Roept de sessiegebonden RPC voor geschiedeniscompaction van de SDK aan.
3. Retourneert het resultaat van de SDK-compaction zonder compatibiliteitsmarkeringsbestanden onder de werkruimte te schrijven.

De transcriptspiegel aan de OpenClaw-zijde (hieronder) blijft berichten na compaction ontvangen, zodat de voor gebruikers zichtbare chatgeschiedenis consistent blijft.

## Transcriptspiegeling

`runCopilotAttempt` schrijft de spiegelbare berichten van elke beurt dubbel naar het OpenClaw-audittranscript via `extensions/copilot/src/dual-write-transcripts.ts`. De spiegel wordt per sessie afgebakend (`copilot:${sessionId}`) en per bericht voorzien van een sleutel (`${role}:${sha256_16(role,content)}`), zodat opnieuw uitgegeven vermeldingen uit eerdere beurten samenvallen met bestaande sleutels op schijf in plaats van te worden gedupliceerd.

Twee lagen voor foutisolatie omhullen de mirror, zodat een fout bij het schrijven van een transcript
de poging nooit laat mislukken: een interne best-effort-wrapper, plus een
defense-in-depth-`.catch(...)` op pogingsniveau. Fouten worden gelogd, niet
doorgegeven.

## Nevenvragen (`/btw`)

`/btw` is **niet** native in dit harnas. `createCopilotAgentHarness()`
laat `harness.runSideQuestion` bewust ongedefinieerd
(bevestigd in `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
zodat OpenClaws `/btw`-dispatcher (`src/agents/btw.ts`) terugvalt op
hetzelfde pad dat voor elke niet-Codex-runtime wordt gebruikt: de geconfigureerde modelprovider
wordt rechtstreeks aangeroepen met een korte prompt voor een nevenvraag en het antwoord wordt via
`streamSimple` teruggestreamd (geen CLI-sessie, geen extra plek in de pool).

Hierdoor blijven Copilot CLI-sessies gereserveerd voor de hoofdcyclus van de agentbeurt en
blijft het gedrag van `/btw` identiek aan dat van andere niet-Codex-runtimes.

## Doctor

`extensions/copilot/doctor-contract-api.ts` wordt automatisch geladen door
`src/plugins/doctor-contract-registry.ts`. Het levert:

- Een lege `legacyConfigRules` (nog geen uitgefaseerde velden).
- Een `normalizeCompatibilityConfig` die niets doet (behouden zodat toekomstige uitfaseringen van velden
  een stabiele plek in de broncode hebben).
- Eén `sessionRouteStateOwners`-vermelding: provider `github-copilot`, runtime
  `copilot`, CLI-sessiesleutel `copilot`, voorvoegsel voor authenticatieprofielen `github-copilot:`.

## Beperkingen

- Het harnas claimt `github-copilot` plus aangepaste BYOK-provider-id's zonder eigenaar.
  Native provider-id's die eigendom zijn van het manifest, blijven bij hun eigen runtime, zelfs wanneer
  `agentRuntime.id` wordt geforceerd naar `copilot`.
- Geen TUI-oppervlak; de TUI van PI blijft de terugvaloptie voor runtimes zonder een gelijkwaardig
  oppervlak.
- De sessiestatus van PI wordt niet gemigreerd wanneer een agent overschakelt naar `copilot`.
  De selectie gebeurt per poging; bestaande PI-sessies blijven geldig.
- `ask_user` gebruikt hetzelfde prompt-en-antwoordpad van OpenClaw als het Codex-
  harnas: wanneer de Copilot SDK om gebruikersinvoer vraagt, plaatst OpenClaw een
  blokkerende prompt in het actieve kanaal/de actieve TUI, waarna het volgende
  gebruikersbericht in de wachtrij het SDK-verzoek afhandelt.

## Machtigingen en ask_user

De handhaving van machtigingen voor gekoppelde OpenClaw-tools vindt **binnen de toolwrapper**
plaats, niet via de callback `onPermissionRequest` van de SDK. Dezelfde
`wrapToolWithBeforeToolCallHook` die PI gebruikt
(`src/agents/agent-tools.before-tool-call.ts`), wordt door
`createOpenClawCodingTools` op elke programmeertool toegepast: lusdetectie, beleid voor vertrouwde
plugins, hooks vóór toolaanroepen en tweefasige plugingoedkeuringen via
de Gateway (`plugin.approval.request`) lopen allemaal via exact hetzelfde codepad
als native PI-pogingen.

De SDK Tool die `convertOpenClawToolToSdkTool` retourneert, wordt gemarkeerd met:

- `overridesBuiltInTool: true` — vervangt de ingebouwde tool van Copilot CLI met
  dezelfde naam (edit, read, write, bash, ...), zodat elke toolaanroep wordt teruggeleid
  naar OpenClaw.
- `skipPermission: true` — vertelt de SDK om
  `onPermissionRequest({kind: "custom-tool"})` niet te activeren voordat de tool wordt aangeroepen. De
  verpakte `execute()` voert de uitgebreidere beleidscontrole van OpenClaw al uit; een
  prompt op SDK-niveau zou de handhaving van OpenClaw omzeilen
  (alles toestaan) of elke toolaanroep blokkeren (alles afwijzen) — geen van beide komt overeen met
  PI-pariteit.

Het Codex-harnas in de broncode gebruikt dezelfde scheiding: gekoppelde OpenClaw-tools worden
verpakt (`extensions/codex/src/app-server/dynamic-tools.ts`) en de eigen
native goedkeuringstypen van de codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) worden via `plugin.approval.request` geleid
(`extensions/codex/src/app-server/approval-bridge.ts`). Het equivalent in de Copilot SDK
— het fail-closed `rejectAllPolicy` voor elk ander type dan `custom-tool`
dat ooit `onPermissionRequest` bereikt — vormt hetzelfde vangnet en wordt
in de praktijk nooit geactiveerd, omdat `overridesBuiltInTool: true` elke
ingebouwde tool vervangt.

Om de laag met verpakte tools beleidsbeslissingen te laten nemen die gelijkwaardig zijn aan die van PI, stuurt het
harnas de volledige PI-context voor tools tijdens een poging door naar
`createOpenClawCodingTools`: identiteit (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kanaal/routering (`groupId`,
`currentChannelId`, `replyToMode`, schakelaars voor berichtentools), authenticatie
(`authProfileStore`), uitvoeringsidentiteit (`sessionKey` / `runSessionKey` afgeleid
van `sandboxSessionKey`, `runId`), modelcontext (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) en uitvoeringshooks
(`onToolOutcome`, `onYield`). Zonder deze velden weigeren allowlists die alleen voor de eigenaar gelden
standaard stilzwijgend, kan beleid voor pluginvertrouwen niet naar het juiste
bereik worden herleid en wordt `session_status: "current"` herleid naar een verouderde sandboxsleutel. De
bridgebouwer is `extensions/copilot/src/tool-bridge.ts` en weerspiegelt de gezaghebbende PI-
aanroep op `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` bepaalt de sandboxcontext via het gedeelde
`resolveSandboxContext`-koppelpunt, geeft de SDK een effectieve werkmap
en stuurt `sandbox` plus de werkruimte voor het starten van subagents door naar de tool-
bridge. De bridge stuurt ook de begrensde besturingselementen voor toolconstructie door die bij de SDK-grens kunnen worden afgedwongen: `includeCoreTools`, de allowlist voor runtimetools
en `toolConstructionPlan`.

De bridge gebruikt voor PI-pariteit ook de gedeelde helper voor het tooloppervlak van het harnas uit
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Wanneer
toolzoeken is ingeschakeld, ziet de SDK compacte besturingstools plus een verborgen
catalogusuitvoerder in plaats van elk OpenClaw-toolschema. Wanneer de codemodus is
ingeschakeld, bouwt de helper hetzelfde besturingsoppervlak voor de codemodus en dezelfde cataloguslevenscyclus
die door andere agentharnassen worden gebruikt. Slanke standaardinstellingen voor lokale modellen,
runtimecompatibele schemafiltering, mapinitialisatie en catalogusopschoning
blijven allemaal in de gedeelde helper, zodat Copilot en aan Codex grenzende
harnassen niet uiteenlopen.

### GitHub-token op sessieniveau

Het contract van de Copilot SDK maakt onderscheid tussen het GitHub-token op **clientniveau**
(`CopilotClientOptions.gitHubToken`, authenticeert het CLI-proces zelf)
en het token op **sessieniveau** (`SessionConfig.gitHubToken`, bepaalt
inhouduitsluiting, modelroutering en quota voor die sessie; wordt gerespecteerd bij
zowel `createSession` als `resumeSession`). Het harnas bepaalt de authenticatie eenmaal via
`resolveCopilotAuth` en stelt beide velden in wanneer de authenticatiemodus `gitHubToken` is
(een expliciete `auth.gitHubToken` of een contractueel bepaalde `resolvedApiKey` uit
een geconfigureerd `github-copilot`-authenticatieprofiel). Wanneer de bepaalde modus
`useLoggedInUser` is, wordt het veld op sessieniveau weggelaten, zodat de SDK
de identiteit blijft afleiden van de aangemelde identiteit.

`ask_user` gebruikt `SessionConfig.onUserInputRequest`. De bridge accepteert keuze-
indexen of labels voor verzoeken met vaste keuzes, accepteert vrije antwoorden wanneer
het SDK-verzoek die toestaat en annuleert een openstaand verzoek wanneer de OpenClaw-
poging wordt afgebroken.

## Gerelateerd

- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Plugins voor agentharnassen (SDK-referentie)](/nl/plugins/sdk-agent-harness)
