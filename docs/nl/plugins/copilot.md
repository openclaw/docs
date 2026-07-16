---
read_when:
    - Je wilt het GitHub Copilot SDK-harnas voor een agent gebruiken
    - Je hebt configuratievoorbeelden nodig voor de `copilot`-runtime
    - Je koppelt een agent aan een Copilot-abonnement (github / openclaw / copilot) en wilt dat deze via de Copilot CLI wordt uitgevoerd
summary: Voer ingebedde OpenClaw-agentbeurten uit via de externe GitHub Copilot SDK-harnasomgeving
title: Copilot SDK-harnas
x-i18n:
    generated_at: "2026-07-16T15:58:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

De externe `@openclaw/copilot`-plugin voert ingebedde Copilot-agentbeurten voor abonnementen uit via de GitHub Copilot CLI (`@github/copilot-sdk`) in plaats van
OpenClaws ingebouwde harness. De Copilot CLI-sessie beheert de onderliggende
agentlus: systeemeigen tooluitvoering, systeemeigen compaction (`infiniteSessions`) en
door de CLI beheerde threadstatus onder `copilotHome`. OpenClaw blijft verantwoordelijk voor chatkanalen,
sessiebestanden, modelselectie, dynamische tools (via een bridge), goedkeuringen,
medialevering, de zichtbare transcriptspiegel, `/btw`-nevenvragen (zie
[Nevenvragen (`/btw`)](#side-questions-btw)) en `openclaw doctor`.

Begin voor de bredere scheiding tussen model, provider en runtime met
[Agentruntimes](/nl/concepts/agent-runtimes).

## Vereisten

- OpenClaw met de `@openclaw/copilot`-plugin geïnstalleerd.
- Als je configuratie `plugins.allow` gebruikt, neem dan `copilot` op (de manifest-id die de
  plugin declareert). Een vermelding in de toelatingslijst voor de npm-pakketnaam
  `@openclaw/copilot` komt niet overeen, waardoor de plugin geblokkeerd blijft, zelfs als
  `agentRuntime.id: "copilot"` is ingesteld.
- Een GitHub Copilot-abonnement dat de Copilot CLI kan aansturen, of een
  omgevingsvariabele `gitHubToken` / verificatieprofielvermelding voor headless- of cron-uitvoeringen.
- Een beschrijfbare map `copilotHome`. Standaard is dit `<agentDir>/copilot` wanneer
  OpenClaw een agentmap levert, en anders
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` voert het [doctor-contract](#doctor) van de plugin uit voor
eigenaarschap van sessiestatus en toekomstige configuratiemigraties. Het onderzoekt de
Copilot CLI-omgeving niet.

## Installatie

De Copilot-runtime wordt als externe plugin geleverd, zodat het kernpakket `openclaw`
`@github/copilot-sdk` of het platformspecifieke
`@github/copilot-<platform>-<arch>` CLI-binaire bestand (samen ongeveer 260 MB) niet bevat.
Installeer deze alleen voor agents die voor deze runtime kiezen:

```bash
openclaw plugins install @openclaw/copilot
```

De installatiewizard installeert de plugin automatisch wanneer je voor het eerst
een `github-copilot/*`-model selecteert **en** je configuratie dat model (of de
provider ervan) via `agentRuntime: { id: "copilot" }` naar de Copilot-runtime routeert; zie
[Snel aan de slag](#quickstart). Zonder die expliciete keuze gebruikt OpenClaw zijn ingebouwde
GitHub Copilot-provider en installeert het deze plugin nooit.

De runtime zoekt de SDK in deze volgorde:

1. `import("@github/copilot-sdk")` uit het geïnstalleerde `@openclaw/copilot`-
   pakket.
2. De terugvalmap `~/.openclaw/npm-runtime/copilot/` (verouderd installatiedoel
   op aanvraag).

Een ontbrekende SDK levert één fout op met code `COPILOT_SDK_MISSING` en de
bovenstaande opdracht voor herinstallatie.

## Snel aan de slag

Koppel één model (of één provider) aan de harness:

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

Stel `agentRuntime.id` in op één modelvermelding om alleen dat model via
de harness te routeren, of op een provider om elk model van die provider te routeren.

`github-copilot/auto` is het overdraagbare uitgangspunt. Benoemde Copilot-modellen zijn
afhankelijk van account- en organisatiebeleid; controleer of je geverifieerde
Copilot CLI een model daadwerkelijk beschikbaar stelt voordat je het vastzet.

## Ondersteunde providers

De harness ondersteunt de canonieke provider `github-copilot` (eigendom van
`extensions/github-copilot`), plus aangepaste `models.providers`-vermeldingen wanneer het
model een niet-lege `baseUrl` en een van deze `api`-vormen heeft:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI-compatibele completions)
- `openai-completions`
- `openai-responses`

Systeemeigen provider-id's (`openai`, `anthropic`, `google`, `ollama`) blijven eigendom van
hun systeemeigen runtimes. Gebruik in plaats daarvan een afzonderlijke aangepaste provider-id om een eindpunt
via Copilot BYOK te routeren.

Copilot BYOK-eindpunten moeten openbare HTTPS-URL's zijn. De harness geeft de
Copilot SDK per poging een loopbackproxy en stuurt vervolgens providerverkeer door
via OpenClaws beveiligde fetch-pad, zodat DNS-vastzetting en SSRF-beleid
onder verantwoordelijkheid van OpenClaw blijven. Gebruik de systeemeigen OpenClaw-runtime voor lokale Ollama-, LM
Studio- of LAN-modelservers.

## BYOK

Copilot BYOK gebruikt het contract van de SDK voor aangepaste providers op sessieniveau. OpenClaw
geeft het opgeloste modeleindpunt, de API-sleutel, bearer-tokenmodus, headers, model-
id en context-/uitvoerlimieten door; de transportlogica van de provider blijft in de SDK en niet
in de kern.

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

BYOK-sessies krijgen afzonderlijke sleutels ten opzichte van abonnementssessies en andere
BYOK-eindpunten of aanmeldgegevens. Als je de sleutel, headers, het model of eindpunt
roteert, wordt een nieuwe Copilot SDK-sessie gestart in plaats van incompatibele status te hervatten.

## Verificatie

Voorrang, per agent toegepast tijdens `runCopilotAttempt`:

1. **Expliciete `useLoggedInUser: true`** in de invoer van de poging — gebruikt de
   aangemelde gebruiker van de Copilot CLI onder de `copilotHome` van de agent.
2. **Expliciete `gitHubToken`** in de invoer van de poging (vereist `profileId` +
   `profileVersion`). Voor directe CLI-aanroepen en tests die
   het oplossen van verificatieprofielen moeten omzeilen.
3. **Via contract opgeloste `resolvedApiKey` + `authProfileId`** — het belangrijkste
   productiepad. De kern lost het geconfigureerde `github-copilot`-verificatieprofiel van de agent
   (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) op voordat
   de harness wordt aangeroepen, zodat een `github-copilot:<profile>`-verificatieprofiel
   end-to-end werkt voor headless-, cron- of multiprofielconfiguraties zonder omgevingsvariabelen.
4. **Terugval op omgevingsvariabelen**, gecontroleerd in deze volgorde (de eerste niet-lege waarde wint,
   lege tekenreeksen gelden als afwezig; dit weerspiegelt de geleverde voorrang van de provider `github-copilot`
   in `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — harnessspecifieke overschrijving; hiermee kun je een
      token vastzetten voor de OpenClaw-harness zonder de systeembrede `gh`- /
      Copilot CLI-configuratie te verstoren.
   2. `COPILOT_GITHUB_TOKEN` — standaardomgevingsvariabele voor de Copilot SDK / CLI.
   3. `GH_TOKEN` — standaardomgevingsvariabele voor de `gh` CLI.
   4. `GITHUB_TOKEN` — algemene terugval op een GitHub-token.

   De samengestelde profiel-id van de pool is `env:<NAME>`; de profielversie is een
   niet-omkeerbare sha256-vingerafdruk van het token, zodat het roteren van de omgevingswaarde
   de clientpool volledig vernieuwt.

5. **Standaard-`useLoggedInUser`** wanneer geen tokensignaal beschikbaar is.

Elke agent krijgt een eigen `copilotHome`, zodat Copilot CLI-tokens, -sessies en
-configuratie nooit tussen agents op dezelfde machine uitlekken. Standaard:
`<agentDir>/copilot` (houdt SDK-status buiten dezelfde map als
OpenClaws `models.json` / `auth-profiles.json`), of
`~/.openclaw/agents/<agentId>/copilot` wanneer geen agentmap wordt opgegeven.
Overschrijf dit met `copilotHome: <path>` in de invoer van de poging voor een aangepaste
locatie (bijvoorbeeld een gedeelde koppeling voor migratie).

Live-harnesstests gebruiken `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` voor een direct
token. De gedeelde live-testconfiguratie wist `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
en `GITHUB_TOKEN` nadat echte verificatieprofielen in de geïsoleerde test-
thuismap zijn geplaatst, zodat een `gh auth token`-waarde die via de speciale variabele wordt doorgegeven
onjuiste overslagen voorkomt zonder naar niet-gerelateerde suites uit te lekken.

## Configuratieoppervlak

De harness leest configuratie uit de invoer per poging (`runCopilotAttempt({...})`)
plus een kleine reeks omgevingsstandaardwaarden binnen `extensions/copilot/src/`:

| Veld                     | Doel                                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | CLI-statusmap per agent (standaardwaarden hierboven).                                                                                                                                                                                                                                            |
| `model`                  | Tekenreeks of `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Laat weg om de normale modelselectie van de agent te gebruiken; de harness controleert of de opgeloste provider wordt ondersteund.                                                                                                         |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Wordt toegewezen vanuit OpenClaws oplossing van `ThinkLevel` / `ReasoningLevel` in `auto-reply/thinking.ts`.                                                                                                                                             |
| `infiniteSessionConfig`  | Optionele overschrijving voor het SDK-`infiniteSessions`-blok dat door `harness.compact` wordt aangestuurd. Kan veilig ongewijzigd blijven.                                                                                                                                                       |
| `hooksConfig`            | Optionele systeemeigen Copilot SDK-`SessionHooks`-configuratie voor tool-/MCP-, gebruikersprompt-, sessie- en foutcallbacks. Staat los van OpenClaws overdraagbare levenscyclus-hooks.                                                                                                             |
| `permissionPolicy`       | Optionele overschrijving voor de `onPermissionRequest`-handler van de SDK voor ingebouwde SDK-tooltypen (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Standaard `rejectAllPolicy` als vangnet; zie [Machtigingen en ask_user](#permissions-and-ask_user) voor waarom deze nooit daadwerkelijk wordt geactiveerd. |
| `enableSessionTelemetry` | Optionele vlag voor SDK-sessietelemetrie.                                                                                                                                                                                                                                                       |

OpenClaw-pluginhooks vereisen geen Copilot-specifieke pogingconfiguratie. De
harness voert `before_prompt_build` (en de verouderde compatibiliteitshook `before_agent_start`),
`llm_input`, `llm_output` en `agent_end` uit via de
standaardharnasshelpers. Bij succesvolle SDK-compactions worden ook
`before_compaction` en `after_compaction` uitgevoerd. Via een bridge gekoppelde OpenClaw-tools voeren
`before_tool_call` uit en rapporteren `after_tool_call`; `hooksConfig` blijft behouden voor
systeemeigen callbacks die uitsluitend in de SDK bestaan en geen overdraagbaar equivalent hebben.

Niets anders in OpenClaw hoeft van deze velden op de hoogte te zijn. Andere plugins,
kanalen en kerncode zien alleen de standaardvorm `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Wanneer `harness.compact` wordt uitgevoerd, doet de Copilot SDK-harness het volgende:

1. Hervat de bijgehouden SDK-sessie zonder werk in behandeling voort te zetten.
2. Roept de sessiespecifieke RPC voor geschiedeniscompaction van de SDK aan.
3. Retourneert het SDK-compactionresultaat zonder compatibiliteitsmarkerbestanden
   onder de werkruimte te schrijven.

De transcriptspiegel aan OpenClaw-zijde (hieronder) blijft berichten na compaction
ontvangen, zodat de voor gebruikers zichtbare chatgeschiedenis consistent blijft.

## Transcriptspiegeling

`runCopilotAttempt` schrijft de spiegelbare berichten van elke beurt dubbel naar het
OpenClaw-audittranscript via
`extensions/copilot/src/dual-write-transcripts.ts`. De spiegel is afgebakend per
sessie (`copilot:${sessionId}`) en heeft een sleutel per bericht
(`${role}:${sha256_16(role,content)}`), zodat opnieuw uitgegeven items uit eerdere beurten
botsen met bestaande sleutels op schijf in plaats van te worden gedupliceerd.

Twee lagen voor foutinsluiting omringen de spiegel, zodat een schrijffout in het transcript
de poging nooit laat mislukken: een interne best-effort-wrapper, plus een
defense-in-depth-`.catch(...)` op pogingsniveau. Fouten worden gelogd, niet
doorgegeven.

## Nevenvragen (`/btw`)

`/btw` is **niet** systeemeigen in deze harness. `createCopilotAgentHarness()`
laat `harness.runSideQuestion` bewust ongedefinieerd
(bevestigd in `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
zodat OpenClaws `/btw`-dispatcher (`src/agents/btw.ts`) terugvalt op het
zelfde pad dat wordt gebruikt voor elke niet-Codex-runtime: de geconfigureerde modelprovider
wordt rechtstreeks aangeroepen met een korte prompt voor een nevenvraag en teruggestreamd via
`streamSimple` (geen CLI-sessie, geen extra poolslot).

Hierdoor blijven Copilot CLI-sessies gereserveerd voor de hoofdbeurtlus van de agent en
blijft het gedrag van `/btw` identiek aan dat van andere niet-Codex-runtimes.

## Doctor

`extensions/copilot/doctor-contract-api.ts` wordt automatisch geladen door
`src/plugins/doctor-contract-registry.ts`. Het draagt het volgende bij:

- Een lege `legacyConfigRules` (nog geen uitgefaseerde velden).
- Een no-op-`normalizeCompatibilityConfig` (behouden zodat toekomstige uitfaseringen van velden
  een stabiele plek binnen de bronstructuur hebben).
- Eén `sessionRouteStateOwners`-item: provider `github-copilot`, runtime
  `copilot`, CLI-sessiesleutel `copilot`, voorvoegsel voor authenticatieprofielen `github-copilot:`.

## Beperkingen

- De harness claimt `github-copilot` plus aangepaste BYOK-provider-id's zonder eigenaar.
  Systeemeigen provider-id's die eigendom zijn van een manifest, blijven bij de runtime van hun eigenaar, zelfs wanneer
  `agentRuntime.id` wordt geforceerd naar `copilot`.
- Geen TUI-oppervlak; de TUI van PI blijft de fallback voor runtimes zonder een gelijkwaardig
  oppervlak.
- De sessiestatus van PI wordt niet gemigreerd wanneer een agent overschakelt naar `copilot`.
  De selectie geldt per poging; bestaande PI-sessies blijven geldig.
- `ask_user` gebruikt hetzelfde prompt-en-antwoordpad van OpenClaw als de Codex-
  harness: wanneer de Copilot SDK om gebruikersinvoer vraagt, plaatst OpenClaw een
  blokkerende prompt in het actieve kanaal/de actieve TUI en lost het volgende in de wachtrij geplaatste gebruikersbericht
  het SDK-verzoek op.

## Machtigingen en ask_user

Machtigingshandhaving voor overbrugde OpenClaw-tools vindt **binnen de tool-
wrapper** plaats, niet via de `onPermissionRequest`-callback van de SDK. Dezelfde
`wrapToolWithBeforeToolCallHook` die PI gebruikt
(`src/agents/agent-tools.before-tool-call.ts`) wordt door
`createOpenClawCodingTools` toegepast op elke programmeertool: lusdetectie, beleid voor vertrouwde
plugins, hooks vóór toolaanroepen en tweefasige plugingoedkeuringen via
de Gateway (`plugin.approval.request`) lopen allemaal via exact hetzelfde codepad
als systeemeigen PI-pogingen.

Elke SDK-tool die door de Copilot-toolbrug wordt geretourneerd, is gemarkeerd met:

- `overridesBuiltInTool: true` — vervangt de ingebouwde tool van de Copilot CLI met
  dezelfde naam (edit, read, write, bash, ...), zodat elke toolaanroep wordt teruggeleid
  naar OpenClaw.
- `skipPermission: true` — geeft de SDK opdracht
  `onPermissionRequest({kind: "custom-tool"})` niet te activeren voordat de tool wordt aangeroepen. De
  omwikkelde `execute()` voert de uitgebreidere OpenClaw-beleidscontrole al uit; een
  prompt op SDK-niveau zou de handhaving van OpenClaw omzeilen
  (alles toestaan) of elke toolaanroep blokkeren (alles weigeren) — geen van beide komt overeen met
  PI-pariteit.

De Codex-harness binnen de bronstructuur gebruikt dezelfde scheiding: overbrugde OpenClaw-tools worden
omwikkeld (`extensions/codex/src/app-server/dynamic-tools.ts`) en de
eigen systeemeigen goedkeuringstypen van codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) worden geleid via `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Het Copilot SDK-
equivalent — fail-closed `rejectAllPolicy` voor elk niet-`custom-tool`-type
dat ooit `onPermissionRequest` bereikt — is hetzelfde vangnet en wordt
in de praktijk nooit geactiveerd omdat `overridesBuiltInTool: true` elk
ingebouwd onderdeel vervangt.

Om de omwikkelde-toollaag beleidsbeslissingen te laten nemen die gelijkwaardig zijn aan PI, stuurt de
harness de volledige PI-context voor pogingstools door naar
`createOpenClawCodingTools`: identiteit (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kanaal/routering (`groupId`,
`currentChannelId`, `replyToMode`, schakelaars voor berichttools), authenticatie
(`authProfileStore`), uitvoeringsidentiteit (`sessionKey` / `runSessionKey` afgeleid
van `sandboxSessionKey`, `runId`), modelcontext (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) en uitvoeringshooks
(`onToolOutcome`, `onYield`). Zonder deze velden weigeren allowlists die alleen voor de eigenaar gelden
standaard stilzwijgend, kan beleid voor pluginvertrouwen niet naar het juiste
bereik worden herleid en wordt `session_status: "current"` herleid naar een verouderde sandboxsleutel. De
brugbuilder is `extensions/copilot/src/tool-bridge.ts` en weerspiegelt de gezaghebbende PI-
aanroep in `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` bepaalt de sandboxcontext via de gedeelde
`resolveSandboxContext`-naad, geeft de SDK een effectieve werkmap door
en stuurt `sandbox` plus de werkruimte voor het starten van subagents door naar de toolbrug.
De brug stuurt ook de begrensde besturingselementen voor toolconstructie door die deze
aan de SDK-grens kan afdwingen: `includeCoreTools`, de allowlist voor runtimetools
en `toolConstructionPlan`.

De brug gebruikt voor PI-pariteit ook de gedeelde helper voor het harness-tooloppervlak uit
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Wanneer
toolzoeken is ingeschakeld, ziet de SDK compacte besturingstools plus een verborgen
catalogusuitvoerder in plaats van elk OpenClaw-toolschema. Wanneer de codemodus is
ingeschakeld, bouwt de helper hetzelfde besturingsoppervlak voor de codemodus en dezelfde cataloguslevenscyclus
die door andere agentharnesses worden gebruikt. Slanke standaardinstellingen voor lokale modellen,
runtimecompatibele schemafiltering, mapinitialisatie en catalogusopschoning
blijven allemaal in de gedeelde helper, zodat Copilot en aan Codex grenzende
harnesses niet uit elkaar gaan lopen.

### GitHub-token op sessieniveau

Het Copilot SDK-contract maakt onderscheid tussen het GitHub-token op **clientniveau**
(`CopilotClientOptions.gitHubToken`, authenticeert het CLI-proces zelf)
en het token op **sessieniveau** (`SessionConfig.gitHubToken`, bepaalt
inhouduitsluiting, modelroutering en quota voor die sessie; wordt gerespecteerd voor
zowel `createSession` als `resumeSession`). De harness bepaalt de authenticatie eenmaal via
`resolveCopilotAuth` en stelt beide velden in wanneer de authenticatiemodus `gitHubToken` is
(een expliciete `auth.gitHubToken` of een contractueel bepaalde `resolvedApiKey` uit
een geconfigureerd `github-copilot`-authenticatieprofiel). Wanneer de bepaalde modus
`useLoggedInUser` is, wordt het veld op sessieniveau weggelaten, zodat de SDK
de identiteit blijft afleiden van de aangemelde identiteit.

`ask_user` gebruikt `SessionConfig.onUserInputRequest`. De brug accepteert keuze-
indexen of labels voor verzoeken met vaste keuzes, accepteert vrije antwoorden wanneer
het SDK-verzoek die toestaat en annuleert een openstaand verzoek wanneer de OpenClaw-
poging wordt afgebroken.

## Gerelateerd

- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Codex-harness](/nl/plugins/codex-harness)
- [Agent-harnessplugins (SDK-referentie)](/nl/plugins/sdk-agent-harness)
