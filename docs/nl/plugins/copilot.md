---
read_when:
    - Je wilt het GitHub Copilot SDK-harnas gebruiken voor een agent
    - Je hebt configuratievoorbeelden nodig voor de runtime van `copilot`
    - Je koppelt een agent aan abonnements-Copilot (github / openclaw / copilot) en wilt dat deze via de Copilot CLI draait
summary: Voer OpenClaw-ingebedde agentbeurten uit via de externe GitHub Copilot SDK-harness
title: Copilot SDK-harnas
x-i18n:
    generated_at: "2026-06-27T17:53:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

De externe `@openclaw/copilot`-Plugin laat OpenClaw ingesloten agentbeurten met een Copilot-abonnement uitvoeren via de GitHub Copilot CLI (`@github/copilot-sdk`) in plaats van het ingebouwde PI-harnas.

Gebruik het Copilot SDK-harnas wanneer je wilt dat de Copilot CLI-sessie de low-level agentlus beheert: native tooluitvoering, native Compaction (`infiniteSessions`) en door de CLI beheerde threadstatus onder `copilotHome`. OpenClaw blijft eigenaar van chatkanalen, sessiebestanden, modelselectie, dynamische OpenClaw-tools (gebrugd), goedkeuringen, medialevering, de zichtbare transcriptspiegel, `/btw`-zijvragen (afgehandeld door de in-tree PI-fallback — zie [Zijvragen (`/btw`)](#side-questions-btw)) en `openclaw doctor`.

Begin voor de bredere splitsing tussen model/provider/runtime met [Agentruntimes](/nl/concepts/agent-runtimes).

## Vereisten

- OpenClaw met de `@openclaw/copilot`-Plugin geïnstalleerd.
- Als je configuratie `plugins.allow` gebruikt, neem dan `copilot` op (de manifest-id die door de Plugin is gedeclareerd). Een beperkende allowlist die de npm-achtige pakketnaam `@openclaw/copilot` gebruikt, laat de Plugin geblokkeerd en de runtime wordt niet geladen, zelfs niet met `agentRuntime.id: "copilot"`.
- Een GitHub Copilot-abonnement dat de Copilot CLI kan aansturen (of een `gitHubToken`-env/auth-profielvermelding voor headless/cron-runs).
- Een schrijfbare `copilotHome`-map. Het harnas gebruikt standaard `<agentDir>/copilot` wanneer OpenClaw een agentmap levert, anders `~/.openclaw/agents/<agentId>/copilot` voor volledige isolatie per agent.

`openclaw doctor` voert het [doctor-contract](#doctor) van de Plugin uit voor declaratief eigenaarschap van sessiestatus en toekomstige compatibiliteitsmigraties. Het voert geen omgevingsprobes voor de Copilot CLI uit.

## Plugin installeren

De Copilot-runtime is een externe Plugin, zodat het kernpakket `openclaw` de afhankelijkheid `@github/copilot-sdk` of de platformspecifieke CLI-binary `@github/copilot-<platform>-<arch>` niet hoeft mee te leveren. Samen voegen ze ongeveer 260 MB toe, dus installeer ze alleen voor agents die zich aanmelden voor deze runtime:

```bash
openclaw plugins install @openclaw/copilot
```

De wizard installeert de Plugin de eerste keer dat je een `github-copilot/*`-model selecteert **en** je configuratie het model (of de provider ervan) aanmeldt voor de Copilot-agentruntime via `agentRuntime: { id: "copilot" }` (zie [Snelstart](#quickstart) hieronder). Zonder die aanmelding gebruikt openclaw de ingebouwde GitHub Copilot-provider en installeert het de runtime-Plugin nooit.

De runtime lost de SDK in deze volgorde op:

1. `import("@github/copilot-sdk")` vanuit het geïnstalleerde `@openclaw/copilot`-pakket.
2. De bekende fallbackmap `~/.openclaw/npm-runtime/copilot/` (het legacy doel voor installatie op aanvraag).

Een ontbrekende SDK levert één fout op met code `COPILOT_SDK_MISSING` en de Plugin-herinstallatieopdracht hierboven.

## Snelstart

Pin één model (of één provider) aan het harnas:

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

Beide routes zijn equivalent. Gebruik `agentRuntime.id` op één modelvermelding wanneer alleen dat model via het harnas moet worden gerouteerd; stel `agentRuntime.id` in op een provider wanneer elk model onder die provider het moet gebruiken.

`github-copilot/auto` is het draagbare startpunt. Benoemde Copilot-modellen zijn afhankelijk van account- en organisatiebeleid, dus pin er pas een nadat je hebt bevestigd dat de geauthenticeerde Copilot CLI het beschikbaar maakt.

## Ondersteunde providers

Het harnas adverteert ondersteuning voor de canonieke `github-copilot`-provider (dezelfde id die eigendom is van `extensions/github-copilot`):

- `github-copilot`

Het ondersteunt ook aangepaste `models.providers`-vermeldingen wanneer het geselecteerde model een niet-lege `baseUrl` heeft en een van deze API-vormen gebruikt:

- `openai-responses`
- `openai-completions`
- `ollama` (OpenAI-compatibele completions)
- `azure-openai-responses`
- `anthropic-messages`

Native provider-id's zoals `openai`, `anthropic`, `google` en `ollama` blijven eigendom van hun native runtimes. Gebruik een afzonderlijke aangepaste provider-id wanneer je een endpoint via Copilot BYOK routeert.

Copilot BYOK-endpoints moeten HTTPS-URL's op het openbare netwerk zijn. Het harnas geeft de Copilot SDK per poging een loopback-proxy-URL en stuurt providerverkeer vervolgens door via het bewaakte fetch-pad van OpenClaw, zodat DNS-pinning en SSRF-beleid eigendom blijven van OpenClaw. Gebruik de native OpenClaw-runtime voor lokale Ollama, LM Studio of LAN-modelservers.

## BYOK

Copilot BYOK gebruikt het contract voor aangepaste providers op sessieniveau van de SDK. OpenClaw geeft het opgeloste modelendpoint, de API-sleutel, bearer-tokenmodus, headers, model-id en context-/uitvoerlimieten door zonder providertransportlogica naar core te verplaatsen.

Bijvoorbeeld:

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

BYOK-sessies worden apart gesleuteld van abonnementssessies en van andere endpoints of referentie-vingerafdrukken. Het roteren van de sleutel, headers, het model of endpoint maakt een nieuwe Copilot SDK-sessie aan in plaats van incompatibele status te hervatten.

## Auth

Voorrang per agent, toegepast tijdens `runCopilotAttempt`:

1. **Expliciete `useLoggedInUser: true`** op de poginginput. Gebruikt de ingelogde gebruiker van de Copilot CLI die onder de `copilotHome` van de agent is opgelost.
2. **Expliciete `gitHubToken`** op de poginginput (met `profileId` + `profileVersion`). Nuttig voor directe CLI-aanroepen en tests waarbij de caller auth-profieloplossing wil omzeilen.
3. **Via contract opgeloste `resolvedApiKey` + `authProfileId`** uit de vorm `EmbeddedRunAttemptParams`. Dit is het **hoofdpad in productie**: core lost het geconfigureerde `github-copilot`-auth-profiel van de agent op (via `src/infra/provider-usage.auth.ts:resolveProviderAuths`) voordat het harnas wordt aangeroepen, en het harnas gebruikt beide velden direct. Daardoor werkt een `github-copilot:<profile>`-auth-profiel end-to-end voor headless/cron/multi-profielopstellingen zonder env-vars.
4. **Env-var-fallback** voor directe CLI-/dogfood-runs waarbij geen auth-profiel is geconfigureerd. De runtime controleert de volgende variabelen in volgorde van voorrang, overeenkomstig de meegeleverde `github-copilot`-provider (`extensions/github-copilot/auth.ts`) en de gedocumenteerde Copilot SDK-installatie:
   1. `OPENCLAW_GITHUB_TOKEN` -- harnasspecifieke override; stel dit in om een token voor het OpenClaw-harnas te pinnen zonder systeembrede `gh`-/Copilot CLI-configuratie te verstoren.
   2. `COPILOT_GITHUB_TOKEN` -- standaard Copilot SDK-/CLI-env-var.
   3. `GH_TOKEN` -- standaard `gh` CLI-env-var (komt overeen met de bestaande `github-copilot`-providervolgorde).
   4. `GITHUB_TOKEN` -- generieke GitHub-tokenfallback.

   De eerste niet-lege waarde wint; lege strings worden als afwezig behandeld. De gesynthetiseerde poolprofiel-id is `env:<NAME>` en de profileVersion is een niet-omkeerbare sha256-vingerafdruk van het token, zodat het roteren van de env-waarde de clientpool netjes ongeldig maakt.

5. **Standaard `useLoggedInUser`** wanneer er geen tokensignaal beschikbaar is.

Elke agent krijgt een eigen `copilotHome`, zodat Copilot CLI-tokens, sessies en configuratie niet lekken tussen agents op dezelfde machine. De standaardwaarde is `<agentDir>/copilot` wanneer de host het harnas een agentmap geeft (waarbij SDK-status wordt geïsoleerd van OpenClaw's `models.json` / `auth-profiles.json` in dezelfde map), of anders `~/.openclaw/agents/<agentId>/copilot`. Overschrijf met `copilotHome: <path>` op de poginginput wanneer je een aangepaste locatie nodig hebt (bijvoorbeeld een gedeelde mount voor migratie).

Live harnastests gebruiken `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` wanneer een direct token nodig is. De gedeelde live-testopzet wist bewust `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` en `GITHUB_TOKEN` nadat echte auth-profielen in de geïsoleerde testhome zijn klaargezet, dus het doorgeven van een `gh auth token`-waarde via de speciale live-testvariabele voorkomt onterechte skips zonder het token bloot te stellen aan niet-gerelateerde suites.

## Configuratieoppervlak

Het harnas leest zijn configuratie uit input per poging (`runCopilotAttempt({...})`) plus een kleine set env-standaarden binnen `extensions/copilot/src/`:

- `copilotHome` — CLI-statusmap per agent (standaarden hierboven gedocumenteerd).
- `model` — string of `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Wanneer weggelaten gebruikt OpenClaw de normale modelselectie van de agent en verifieert het harnas dat de opgeloste provider wordt ondersteund.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Wordt gemapt vanuit OpenClaw's `ThinkLevel`-/`ReasoningLevel`-oplossing in `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — optionele override voor het SDK-`infiniteSessions`-blok dat wordt aangestuurd door `harness.compact`. De standaardwaarden kunnen veilig zo blijven.
- `hooksConfig` — optionele native Copilot SDK-compatibiliteitsconfiguratie voor `SessionHooks` voor callbacks voor tool/MCP, gebruikersprompt, sessie en fouten. Deze staat los van de draagbare lifecycle-hooks van OpenClaw.
- `permissionPolicy` — optionele override voor de SDK-`onPermissionRequest`-handler die wordt gebruikt voor ingebouwde SDK-toolsoorten (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Standaard `rejectAllPolicy` als vangnet; in de praktijk roept de SDK nooit een van die soorten aan, omdat elke gebrugde OpenClaw-tool is geregistreerd met `overridesBuiltInTool: true` en `skipPermission: true`, zodat 100% van de toolcalls via OpenClaw's verpakte `execute()` loopt. Zie [Machtigingen en ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — optionele vlag voor SDK-sessietelemetrie.

OpenClaw-Plugin-hooks hebben geen Copilot-specifieke pogingconfiguratie nodig. Het harnas voert `before_prompt_build` (en de legacy compatibiliteitshook `before_agent_start`), `llm_input`, `llm_output` en `agent_end` uit via de standaard harnashulpfuncties. Succesvolle SDK-Compactions voeren ook `before_compaction` en `after_compaction` uit. Gebrugde OpenClaw-tools blijven `before_tool_call` uitvoeren en `after_tool_call` rapporteren; `hooksConfig` blijft bestaan voor native SDK-only callbacks zonder draagbaar equivalent.

Niets in de rest van OpenClaw hoeft van deze velden te weten. Andere Plugins, kanalen en core-code zien alleen de standaardvorm `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Wanneer `harness.compact` wordt uitgevoerd, doet het Copilot SDK-harnas het volgende:

1. Het hervat de gevolgde SDK-sessie zonder lopend werk voort te zetten.
2. Het roept de sessiegebonden RPC voor geschiedenis-Compaction van de SDK aan.
3. Het retourneert de SDK-Compaction-uitkomst zonder compatibiliteitsmarkerbestanden onder de workspace te schrijven.

De transcriptspiegel aan de OpenClaw-zijde (zie hieronder) blijft de berichten na Compaction ontvangen, zodat chatgeschiedenis die zichtbaar is voor gebruikers consistent blijft.

## Transcriptspiegeling

`runCopilotAttempt` schrijft de spiegelbare berichten van elke beurt dubbel naar het OpenClaw-audittranscript via `extensions/copilot/src/dual-write-transcripts.ts`. De spiegel is per sessie gescoped (`copilot:${sessionId}`) en gebruikt een identiteit per bericht (`${role}:${sha256_16(role,content)}`), zodat opnieuw uitgezonden items uit eerdere beurten botsen met bestaande sleutels op schijf en niet worden gedupliceerd.

De spiegel is verpakt in twee lagen voor foutbeheersing, zodat een schrijffout in het transcript de poging niet kan laten mislukken: een interne best-effort-wrapper en een defense-in-depth `.catch(...)` op pogingniveau. Fouten worden gelogd maar niet zichtbaar gemaakt.

## Zijvragen (`/btw`)

`/btw` is **niet** native op dit harnas. `createCopilotAgentHarness()`
laat `harness.runSideQuestion` bewust undefined, zodat OpenClaw's `/btw`
dispatcher (`src/agents/btw.ts`) terugvalt op hetzelfde PI-fallbackpad in de
repository dat het gebruikt voor elke niet-Codex-runtime: de geconfigureerde
modelprovider wordt rechtstreeks aangeroepen met een korte prompt voor een
zijvraag en teruggestreamd via `streamSimple` (geen CLI-sessie, geen extra
poolslot).

Dit houdt Copilot CLI-sessies gereserveerd voor de hoofdturn-loop van de agent,
en houdt het gedrag van `/btw` identiek aan andere PI-ondersteunde runtimes. Het contract wordt
bevestigd in
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
onder `describe("runSideQuestion")`.

## Doctor

`extensions/copilot/doctor-contract-api.ts` wordt automatisch geladen door
`src/plugins/doctor-contract-registry.ts`. Het draagt bij:

- Een lege `legacyConfigRules` (geen gepensioneerde velden bij MVP).
- Een no-op `normalizeCompatibilityConfig` (behouden zodat toekomstige
  veldpensioneringen een stabiele plek in de repository hebben).
- Eén `sessionRouteStateOwners`-vermelding die provider `github-copilot` claimt;
  runtime `copilot`; CLI-sessiesleutel `copilot`; auth-profiel
  prefix `github-copilot:`.

## Beperkingen

- Het harnas claimt `github-copilot` plus niet-eigen aangepaste BYOK-provider-id's.
  Manifest-eigen native provider-id's blijven op hun eigen runtime, zelfs wanneer
  `agentRuntime.id` wordt geforceerd naar `copilot`.
- Het harnas levert geen TUI; de TUI van PI blijft onaangetast en blijft de
  fallback voor alle runtimes die geen peer-oppervlak hebben.
- PI-sessiestatus wordt niet gemigreerd wanneer een agent overschakelt naar `copilot`.
  Selectie gebeurt per poging; bestaande PI-sessies blijven geldig.
- `ask_user` gebruikt hetzelfde prompt-en-antwoordpad van OpenClaw als het Codex-
  harnas. Wanneer de Copilot SDK om gebruikersinvoer vraagt, plaatst OpenClaw een
  blokkerende prompt in het actieve kanaal/de TUI en lost het volgende in de wachtrij geplaatste gebruikersbericht
  het SDK-verzoek op.

## Machtigingen en ask_user

Machtigingshandhaving voor gebridgede OpenClaw-tools gebeurt **binnen de
tool-wrapper**, niet via de `onPermissionRequest`-callback van de SDK. De
zelfde `wrapToolWithBeforeToolCallHook` die PI gebruikt
(`src/agents/pi-tools.before-tool-call.ts`) wordt door
`createOpenClawCodingTools` toegepast op elke coding-tool: loopdetectie,
beleid voor vertrouwde Plugins, before-tool-call-hooks en tweefasen-
Plugin-goedkeuringen via de Gateway (`plugin.approval.request`) lopen allemaal via
exact hetzelfde codepad als native PI-pogingen.

Om die wrapper de beslissing te laten bezitten, wordt de SDK Tool die door
`convertOpenClawToolToSdkTool` wordt teruggegeven gemarkeerd met:

- `overridesBuiltInTool: true` — vervangt de ingebouwde tool van dezelfde naam
  van de Copilot CLI (edit, read, write, bash, …), zodat elke toolaanroep
  terug naar OpenClaw wordt gerouteerd.
- `skipPermission: true` — vertelt de SDK om
  `onPermissionRequest({kind: "custom-tool"})` niet te activeren voordat de tool wordt aangeroepen.
  De gewrapte `execute()` voert intern de rijkere OpenClaw-beleidscontrole uit;
  een prompt op SDK-niveau zou ofwel de handhaving van OpenClaw omzeilen
  (als we alles toestaan) of elke toolaanroep blokkeren (als we alles
  afwijzen) — geen van beide komt overeen met PI-pariteit.

Het Codex-harnas in de repository gebruikt dezelfde scheiding: gebridgede OpenClaw-tools
worden gewrapt (`extensions/codex/src/app-server/dynamic-tools.ts`) en
de _eigen_ native goedkeuringssoorten van de codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) worden gerouteerd via
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Het equivalent in de Copilot SDK
— fail-closed `rejectAllPolicy` voor elke niet-`custom-tool`-soort
die ooit `onPermissionRequest` bereikt — is hetzelfde veiligheidsnet,
en het vuurt in de praktijk niet omdat `overridesBuiltInTool: true`
elke ingebouwde tool verdringt.

Om de gewrapte-toollaag beleidsbeslissingen te laten nemen die equivalent zijn aan PI,
stuurt het harnas de volledige PI attempt-tool-context door naar
`createOpenClawCodingTools` — identiteit (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), kanaal/routering
(`groupId`, `currentChannelId`, `replyToMode`, message-tool-schakelaars),
auth (`authProfileStore`), run-identiteit
(`sessionKey`/`runSessionKey` afgeleid van `sandboxSessionKey`,
`runId`), modelcontext (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`) en run-hooks (`onToolOutcome`,
`onYield`). Zonder die velden gedragen owner-only allowlists zich stilzwijgend
als deny-by-default, kunnen Plugin-trust-beleidsregels niet naar de
juiste scope resolven, en wordt `session_status: "current"` opgelost naar een verouderde
sandbox-sleutel. De bridge-builder staat in
`extensions/copilot/src/tool-bridge.ts` en spiegelt de gezaghebbende PI-
aanroep op
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt`
lost sandboxcontext al op via de gedeelde
`resolveSandboxContext`-naad, geeft de SDK een effectieve werkdirectory door
en stuurt `sandbox` plus de subagent-spawn-werkruimte door naar
de tool-bridge. De bridge stuurt ook de begrensde toolconstructie-
controles door die hij aan de SDK-grens kan afdwingen: `includeCoreTools`, de
runtime-toolallowlist en `toolConstructionPlan`.

De bridge gebruikt ook de gedeelde hulpfunctie voor het harnas-tooloppervlak uit
`openclaw/plugin-sdk/agent-harness-tool-runtime` voor PI-pariteit. Wanneer
tool-search is ingeschakeld, ziet de SDK compacte besturingstools plus een verborgen
catalog-executor in plaats van elk OpenClaw-toolschema. Wanneer code mode is
ingeschakeld, bouwt de hulpfunctie hetzelfde code-mode-besturingsoppervlak en dezelfde catalogus-
levenscyclus die door andere agentharnassen worden gebruikt. Lean defaults voor lokale modellen,
runtime-compatibele schemafiltering, directory-hydratatie en catalogus-
opschoning blijven allemaal in de gedeelde hulpfunctie, zodat Copilot- en Codex-aangrenzende
harnassen niet uiteenlopen.

### GitHub-token op sessieniveau

Het Copilot SDK-contract onderscheidt het **clientniveau** GitHub-
token (`CopilotClientOptions.gitHubToken`, gebruikt om het
CLI-proces zelf te authenticeren) van het **sessieniveau** token
(`SessionConfig.gitHubToken`, dat contentuitsluiting,
modelroutering en quota voor die sessie bepaalt en wordt geëerbiedigd bij zowel
`createSession` als `resumeSession`). Het harnas lost auth één keer op
via `resolveCopilotAuth` en stelt beide velden in wanneer de auth-modus
`gitHubToken` is (een expliciete `auth.gitHubToken` of een contract-opgeloste
`resolvedApiKey` uit een geconfigureerd `github-copilot` auth-profiel).
Wanneer de opgeloste modus `useLoggedInUser` is, wordt het veld op sessieniveau
weggelaten zodat de SDK identiteit blijft afleiden uit de ingelogde
identiteit.

`ask_user` gebruikt `SessionConfig.onUserInputRequest`. De bridge accepteert
keuze-indexen of labels voor verzoeken met vaste keuzes, accepteert vrije
antwoorden wanneer het SDK-verzoek die toestaat, en annuleert een hangend verzoek
wanneer de OpenClaw-poging wordt afgebroken.

## Gerelateerd

- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Agentharnas-Plugins (SDK-referentie)](/nl/plugins/sdk-agent-harness)
