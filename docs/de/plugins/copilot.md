---
read_when:
    - Sie möchten das GitHub Copilot SDK-Harness für einen Agenten verwenden
    - Sie benötigen Konfigurationsbeispiele für die `copilot`-Runtime
    - Sie verbinden einen Agenten mit dem Abonnement-Copilot (github / openclaw / copilot) und möchten, dass er über die Copilot-CLI läuft
summary: OpenClaw-Embedded-Agent-Turns über den externen GitHub Copilot SDK-Harness ausführen
title: Copilot-SDK-Testumgebung
x-i18n:
    generated_at: "2026-06-27T17:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Das externe Plugin `@openclaw/copilot` ermöglicht OpenClaw, eingebettete Subscription-
Copilot-Agent-Turns über die GitHub Copilot CLI (`@github/copilot-sdk`)
statt über den integrierten PI-Harness auszuführen.

Verwenden Sie den Copilot SDK-Harness, wenn die Copilot CLI-Sitzung die
Low-Level-Agent-Schleife besitzen soll: native Tool-Ausführung, native Compaction
(`infiniteSessions`) und CLI-verwalteter Thread-Zustand unter `copilotHome`.
OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl,
dynamische OpenClaw-Tools (überbrückt), Genehmigungen, Medienzustellung, den
sichtbaren Transcript-Spiegel, `/btw`-Nebenfragen (verarbeitet durch den
im Repository enthaltenen PI-Fallback – siehe
[Nebenfragen (`/btw`)](#side-questions-btw)) und `openclaw doctor`.

Für die umfassendere Aufteilung von Modell/Provider/Runtime beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes).

## Anforderungen

- OpenClaw mit installiertem Plugin `@openclaw/copilot`.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie `copilot` auf
  (die vom Plugin deklarierte Manifest-ID). Eine restriktive Allowlist, die
  den npm-artigen Paketnamen `@openclaw/copilot` verwendet, lässt das Plugin
  blockiert, und die Runtime wird auch mit `agentRuntime.id: "copilot"` nicht
  geladen.
- Ein GitHub Copilot-Abonnement, das die Copilot CLI steuern kann (oder ein
  `gitHubToken`-Env-/Auth-Profile-Entry für headless-/Cron-Läufe).
- Ein beschreibbares `copilotHome`-Verzeichnis. Der Harness verwendet
  standardmäßig `<agentDir>/copilot`, wenn OpenClaw ein Agent-Verzeichnis
  bereitstellt, andernfalls `~/.openclaw/agents/<agentId>/copilot` für
  vollständige Isolation pro Agent.

`openclaw doctor` führt den
[Doctor-Vertrag](#doctor) des Plugins für deklarative Zuständigkeit über
Sitzungszustand und zukünftige Kompatibilitätsmigrationen aus. Er führt keine
Umgebungsprüfungen der Copilot CLI aus.

## Plugin-Installation

Die Copilot-Runtime ist ein externes Plugin, damit das Kernpaket `openclaw`
weder die Abhängigkeit `@github/copilot-sdk` noch deren plattformspezifisches
CLI-Binary `@github/copilot-<platform>-<arch>` enthält. Zusammen fügen sie etwa
260 MB hinzu; installieren Sie sie daher nur für Agents, die sich für diese
Runtime entscheiden:

```bash
openclaw plugins install @openclaw/copilot
```

Der Assistent installiert das Plugin beim ersten Mal, wenn Sie ein
`github-copilot/*`-Modell auswählen **und** Ihre Konfiguration das Modell (oder
dessen Provider) über `agentRuntime: { id: "copilot" }` für die
Copilot-Agent-Runtime auswählt (siehe [Schnellstart](#quickstart) unten).
Ohne diese Opt-in-Einstellung verwendet openclaw seinen integrierten
GitHub Copilot-Provider und installiert das Runtime-Plugin nie.

Die Runtime löst das SDK in dieser Reihenfolge auf:

1. `import("@github/copilot-sdk")` aus dem installierten Paket
   `@openclaw/copilot`.
2. Das bekannte Fallback-Verzeichnis `~/.openclaw/npm-runtime/copilot/` (das
   ältere On-Demand-Installationsziel).

Ein fehlendes SDK erscheint als einzelner Fehler mit dem Code
`COPILOT_SDK_MISSING` und dem oben genannten Befehl zur Neuinstallation des
Plugins.

## Schnellstart

Pinnen Sie ein Modell (oder einen Provider) an den Harness:

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

Beide Wege sind gleichwertig. Verwenden Sie `agentRuntime.id` bei einem
einzelnen Modelleintrag, wenn nur dieses Modell über den Harness geleitet
werden soll; setzen Sie `agentRuntime.id` bei einem Provider, wenn jedes Modell
unter diesem Provider ihn verwenden soll.

`github-copilot/auto` ist der portable Ausgangspunkt. Benannte Copilot-Modelle
hängen von Konto- und Organisationsrichtlinien ab; pinnen Sie daher erst eines,
nachdem Sie bestätigt haben, dass die authentifizierte Copilot CLI es anbietet.

## Unterstützte Provider

Der Harness weist Unterstützung für den kanonischen Provider `github-copilot`
aus (dieselbe ID, die `extensions/github-copilot` besitzt):

- `github-copilot`

Er unterstützt außerdem benutzerdefinierte `models.providers`-Einträge, wenn
das ausgewählte Modell eine nicht leere `baseUrl` und eine dieser API-Formen
hat:

- `openai-responses`
- `openai-completions`
- `ollama` (OpenAI-kompatible Completions)
- `azure-openai-responses`
- `anthropic-messages`

Native Provider-IDs wie `openai`, `anthropic`, `google` und `ollama` bleiben
im Besitz ihrer nativen Runtimes. Verwenden Sie eine eigene benutzerdefinierte
Provider-ID, wenn ein Endpunkt über Copilot BYOK geleitet wird.

Copilot-BYOK-Endpunkte müssen öffentliche HTTPS-URLs sein. Der Harness gibt dem
Copilot SDK eine pro Versuch gültige local loopback-Proxy-URL und leitet dann
Provider-Traffic über den geschützten Fetch-Pfad von OpenClaw weiter, damit
DNS-Pinning und SSRF-Richtlinie bei OpenClaw bleiben. Verwenden Sie die native
OpenClaw-Runtime für lokales Ollama, LM Studio oder LAN-Modellserver.

## BYOK

Copilot BYOK verwendet den sitzungsbezogenen Custom-Provider-Vertrag des SDK.
OpenClaw übergibt den aufgelösten Modellendpunkt, API-Schlüssel,
Bearer-Token-Modus, Header, Modell-ID sowie Kontext-/Ausgabelimits, ohne
Provider-Transportlogik in den Kern zu verschieben.

Zum Beispiel:

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

BYOK-Sitzungen werden getrennt von Subscription-Sitzungen und von anderen
Endpunkten oder Zugangsdaten-Fingerprints geschlüsselt. Das Rotieren des
Schlüssels, der Header, des Modells oder des Endpunkts erzeugt eine neue
Copilot SDK-Sitzung, statt inkompatiblen Zustand fortzusetzen.

## Authentifizierung

Priorität pro Agent, angewendet während `runCopilotAttempt`:

1. **Explizites `useLoggedInUser: true`** in der Versuchseingabe. Verwendet den
   eingeloggten Benutzer der Copilot CLI, aufgelöst unter dem `copilotHome` des
   Agents.
2. **Explizites `gitHubToken`** in der Versuchseingabe (mit `profileId` +
   `profileVersion`). Nützlich für direkte CLI-Aufrufe und Tests, bei denen der
   Aufrufer die Auth-Profile-Auflösung umgehen möchte.
3. **Vertragsseitig aufgelöstes `resolvedApiKey` + `authProfileId`** aus der
   Form `EmbeddedRunAttemptParams`. Dies ist der **Produktions-Hauptpfad**:
   Der Kern löst das konfigurierte Auth-Profile des Agents für
   `github-copilot` auf (über
   `src/infra/provider-usage.auth.ts:resolveProviderAuths`), bevor er den
   Harness aufruft, und der Harness nutzt beide Felder direkt. Dadurch
   funktioniert ein Auth-Profile `github-copilot:<profile>` durchgängig für
   headless-/Cron-/Multi-Profile-Setups ohne Env-Vars.
4. **Env-Var-Fallback** für direkte CLI-/Dogfood-Läufe, bei denen kein
   Auth-Profile konfiguriert ist. Die Runtime prüft die folgenden Variablen in
   Prioritätsreihenfolge und spiegelt damit den ausgelieferten Provider
   `github-copilot` (`extensions/github-copilot/auth.ts`) sowie die
   dokumentierte Copilot SDK-Einrichtung:
   1. `OPENCLAW_GITHUB_TOKEN` -- Harness-spezifische Überschreibung; setzen Sie
      dies, um ein Token für den OpenClaw-Harness zu pinnen, ohne die
      systemweite Konfiguration von `gh` / Copilot CLI zu stören.
   2. `COPILOT_GITHUB_TOKEN` -- Standard-Env-Var des Copilot SDK / der CLI.
   3. `GH_TOKEN` -- Standard-Env-Var der `gh` CLI (entspricht der bestehenden
      Priorität des Providers `github-copilot`).
   4. `GITHUB_TOKEN` -- generischer GitHub-Token-Fallback.

   Der erste nicht leere Wert gewinnt; leere Strings werden als nicht vorhanden
   behandelt. Die synthetisierte Pool-Profile-ID ist `env:<NAME>`, und
   `profileVersion` ist ein nicht umkehrbarer sha256-Fingerprint des Tokens,
   sodass das Rotieren des Env-Werts den Client-Pool sauber invalidiert.

5. **Standardmäßiges `useLoggedInUser`**, wenn kein Token-Signal verfügbar ist.

Jeder Agent erhält ein dediziertes `copilotHome`, damit Copilot CLI-Tokens,
Sitzungen und Konfiguration nicht zwischen Agents auf derselben Maschine
durchsickern. Standard ist `<agentDir>/copilot`, wenn der Host dem Harness ein
Agent-Verzeichnis übergibt (wodurch SDK-Zustand von OpenClaws `models.json` /
`auth-profiles.json` im selben Verzeichnis isoliert wird), andernfalls
`~/.openclaw/agents/<agentId>/copilot`. Überschreiben Sie dies mit
`copilotHome: <path>` in der Versuchseingabe, wenn Sie einen eigenen Ort
benötigen (zum Beispiel einen gemeinsamen Mount für eine Migration).

Live-Harness-Tests verwenden `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`, wenn ein
direktes Token benötigt wird. Die gemeinsame Live-Test-Einrichtung entfernt
absichtlich `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` und `GITHUB_TOKEN`, nachdem echte
Auth-Profiles im isolierten Test-Home bereitgestellt wurden. Daher vermeidet
das Durchreichen eines `gh auth token`-Werts über die dedizierte
Live-Test-Variable falsche Skips, ohne das Token für nicht verwandte Suiten
offenzulegen.

## Konfigurationsoberfläche

Der Harness liest seine Konfiguration aus der Versuchseingabe
(`runCopilotAttempt({...})`) plus einer kleinen Menge von Env-Defaults in
`extensions/copilot/src/`:

- `copilotHome` — CLI-Zustandsverzeichnis pro Agent (Standards oben
  dokumentiert).
- `model` — String oder `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  Wenn ausgelassen, verwendet OpenClaw die normale Modellauswahl des Agents,
  und der Harness prüft, ob der aufgelöste Provider unterstützt wird.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Wird aus
  OpenClaws `ThinkLevel`-/`ReasoningLevel`-Auflösung in
  `auto-reply/thinking.ts` abgebildet.
- `infiniteSessionConfig` — optionale Überschreibung für den SDK-Block
  `infiniteSessions`, der von `harness.compact` gesteuert wird. Die Defaults
  können sicher unverändert bleiben.
- `hooksConfig` — optionale native Copilot SDK-Kompatibilitätskonfiguration
  `SessionHooks` für Tool/MCP-, Benutzer-Prompt-, Sitzungs- und Fehler-Callbacks.
  Sie ist von OpenClaws portablen Lifecycle-Hooks getrennt.
- `permissionPolicy` — optionale Überschreibung für den SDK-Handler
  `onPermissionRequest`, der für integrierte SDK-Tool-Arten (`shell`, `write`,
  `read`, `url`, `mcp`, `memory`, `hook`) verwendet wird. Standardmäßig wird
  `rejectAllPolicy` als Sicherheitsnetz verwendet; in der Praxis ruft das SDK
  keine dieser Arten auf, weil jedes überbrückte OpenClaw-Tool mit
  `overridesBuiltInTool: true` und `skipPermission: true` registriert ist,
  sodass 100 % der Tool-Aufrufe durch OpenClaws umschlossenes `execute()`
  fließen. Siehe [Berechtigungen und ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — optionales SDK-Flag für Sitzungstelemetrie.

OpenClaw-Plugin-Hooks benötigen keine Copilot-spezifische
Versuchskonfiguration. Der Harness führt `before_prompt_build` (und den
Legacy-Kompatibilitätshook `before_agent_start`), `llm_input`, `llm_output` und
`agent_end` über die Standard-Harness-Helfer aus. Erfolgreiche SDK-Compactions
führen außerdem `before_compaction` und `after_compaction` aus. Überbrückte
OpenClaw-Tools führen weiterhin `before_tool_call` aus und melden
`after_tool_call`; `hooksConfig` bleibt für native SDK-only-Callbacks bestehen,
für die es kein portables Äquivalent gibt.

Nichts im übrigen OpenClaw muss diese Felder kennen. Andere Plugins, Kanäle und
Kerncode sehen nur die Standardform
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Wenn `harness.compact` läuft, führt der Copilot SDK-Harness Folgendes aus:

1. Er setzt die verfolgte SDK-Sitzung fort, ohne ausstehende Arbeit
   fortzuführen.
2. Er ruft den sitzungsbezogenen History-Compaction-RPC des SDK auf.
3. Er gibt das SDK-Compaction-Ergebnis zurück, ohne Kompatibilitätsmarkerdateien
   unter dem Workspace zu schreiben.

Der OpenClaw-seitige Transcript-Spiegel (siehe unten) erhält weiterhin die
Nach-Compaction-Nachrichten, sodass die benutzerseitige Chat-Historie
konsistent bleibt.

## Transcript-Spiegelung

`runCopilotAttempt` schreibt die spiegelbaren Nachrichten jedes Turns zusätzlich
in das OpenClaw-Audit-Transcript über
`extensions/copilot/src/dual-write-transcripts.ts`. Der Spiegel ist pro Sitzung
begrenzt (`copilot:${sessionId}`) und verwendet eine Identität pro Nachricht
(`${role}:${sha256_16(role,content)}`), sodass erneut ausgegebene Einträge aus
früheren Turns mit vorhandenen On-Disk-Schlüsseln kollidieren und nicht
dupliziert werden.

Der Spiegel ist in zwei Ebenen der Fehlerbegrenzung eingeschlossen, damit ein
Transcript-Schreibfehler den Versuch nicht fehlschlagen lassen kann: ein
interner Best-Effort-Wrapper und ein Defense-in-Depth-`.catch(...)` auf
Versuchsebene. Fehler werden protokolliert, aber nicht angezeigt.

## Nebenfragen (`/btw`)

`/btw` ist auf diesem Harness **nicht** nativ. `createCopilotAgentHarness()`
lässt `harness.runSideQuestion` absichtlich undefiniert, sodass OpenClaws
`/btw`-Dispatcher (`src/agents/btw.ts`) auf denselben repositoryinternen
PI-Fallbackpfad zurückfällt, den er für jede Nicht-Codex-Runtime verwendet:
Der konfigurierte Modell-Provider wird direkt mit einem kurzen Nebenfragen-
Prompt aufgerufen und über `streamSimple` zurückgestreamt (keine CLI-Sitzung,
kein zusätzlicher Pool-Slot).

Dadurch bleiben Copilot-CLI-Sitzungen für die Hauptschleife des Agents
reserviert, und das `/btw`-Verhalten bleibt identisch mit anderen
PI-gestützten Runtimes. Der Vertrag wird in
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
unter `describe("runSideQuestion")` abgesichert.

## Doctor

`extensions/copilot/doctor-contract-api.ts` wird automatisch von
`src/plugins/doctor-contract-registry.ts` geladen. Es steuert bei:

- Ein leeres `legacyConfigRules` (keine stillgelegten Felder im MVP).
- Ein No-op-`normalizeCompatibilityConfig` (beibehalten, damit zukünftige
  Feldstilllegungen einen stabilen repositoryinternen Ort haben).
- Einen `sessionRouteStateOwners`-Eintrag, der Provider `github-copilot`,
  Runtime `copilot`, CLI-Sitzungsschlüssel `copilot` und Auth-Profilpräfix
  `github-copilot:` beansprucht.

## Einschränkungen

- Der Harness beansprucht `github-copilot` sowie nicht besessene
  benutzerdefinierte BYOK-Provider-IDs. Manifest-eigene native Provider-IDs
  bleiben auf ihrer besitzenden Runtime, selbst wenn `agentRuntime.id` auf
  `copilot` erzwungen wird.
- Der Harness liefert keine TUI; die TUI von PI bleibt unberührt und bleibt
  der Fallback für alle Runtimes, die keine gleichrangige Oberfläche haben.
- Der PI-Sitzungszustand wird nicht migriert, wenn ein Agent zu `copilot`
  wechselt. Die Auswahl gilt pro Versuch; vorhandene PI-Sitzungen bleiben
  gültig.
- `ask_user` verwendet denselben Prompt-und-Antwort-Pfad von OpenClaw wie der
  Codex-Harness. Wenn das Copilot-SDK Benutzereingaben anfordert, postet
  OpenClaw einen blockierenden Prompt in den aktiven Kanal bzw. die aktive TUI,
  und die nächste eingereihte Benutzernachricht löst die SDK-Anfrage auf.

## Berechtigungen und ask_user

Die Durchsetzung von Berechtigungen für überbrückte OpenClaw-Tools erfolgt
**innerhalb des Tool-Wrappers**, nicht über den `onPermissionRequest`-Callback
des SDK. Dasselbe `wrapToolWithBeforeToolCallHook`, das PI verwendet
(`src/agents/pi-tools.before-tool-call.ts`), wird von
`createOpenClawCodingTools` auf jedes Coding-Tool angewendet:
Schleifenerkennung, Richtlinien für vertrauenswürdige Plugins,
Before-Tool-Call-Hooks und zweiphasige Plugin-Genehmigungen über das Gateway
(`plugin.approval.request`) laufen alle über exakt denselben Codepfad wie
native PI-Versuche.

Damit dieser Wrapper die Entscheidung besitzt, wird das von
`convertOpenClawToolToSdkTool` zurückgegebene SDK-Tool mit Folgendem markiert:

- `overridesBuiltInTool: true` — ersetzt das eingebaute Tool der Copilot-CLI
  mit demselben Namen (edit, read, write, bash, …), sodass jeder Tool-Aufruf
  zurück zu OpenClaw geroutet wird.
- `skipPermission: true` — weist das SDK an, vor dem Aufruf des Tools kein
  `onPermissionRequest({kind: "custom-tool"})` auszulösen. Das umschlossene
  `execute()` führt intern die umfassendere OpenClaw-Richtlinienprüfung aus;
  ein SDK-seitiger Prompt würde entweder die Durchsetzung von OpenClaw umgehen
  (wenn wir alles erlauben) oder jeden Tool-Aufruf blockieren (wenn wir alles
  ablehnen) — beides entspricht nicht der PI-Parität.

Der repositoryinterne Codex-Harness verwendet dieselbe Aufteilung:
Überbrückte OpenClaw-Tools werden umschlossen
(`extensions/codex/src/app-server/dynamic-tools.ts`), und die _eigenen_
nativen Genehmigungsarten des codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) werden über
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) geroutet. Das
Copilot-SDK-Äquivalent — eine fail-closed `rejectAllPolicy` für jede
Nicht-`custom-tool`-Art, die jemals `onPermissionRequest` erreicht — ist
dasselbe Sicherheitsnetz, und es wird praktisch nicht ausgelöst, weil
`overridesBuiltInTool: true` jedes eingebaute Tool verdrängt.

Damit die Wrapped-Tool-Ebene Richtlinienentscheidungen treffen kann, die PI
entsprechen, leitet der Harness den vollständigen PI-Versuchs-Tool-Kontext an
`createOpenClawCodingTools` weiter: Identität (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), Kanal/Routing
(`groupId`, `currentChannelId`, `replyToMode`, Umschalter für
Nachrichten-Tools), Auth (`authProfileStore`), Laufidentität
(`sessionKey`/`runSessionKey`, abgeleitet aus `sandboxSessionKey`, `runId`),
Modellkontext (`modelApi`, `modelContextWindowTokens`, `modelCompat`,
`modelHasVision`) und Lauf-Hooks (`onToolOutcome`, `onYield`). Ohne diese
Felder verhalten sich Owner-only-Allowlists stillschweigend wie Deny-by-default,
Plugin-Vertrauensrichtlinien können nicht auf den richtigen Scope aufgelöst
werden, und `session_status: "current"` wird auf einen veralteten
Sandbox-Schlüssel aufgelöst. Der Bridge-Builder befindet sich in
`extensions/copilot/src/tool-bridge.ts` und spiegelt den maßgeblichen
PI-Aufruf unter `src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`.
`runAttempt` löst den Sandbox-Kontext bereits über die gemeinsame
`resolveSandboxContext`-Schnittstelle auf, übergibt dem SDK ein effektives
Arbeitsverzeichnis und leitet `sandbox` sowie den Workspace für
Subagent-Spawns in die Tool-Bridge weiter. Die Bridge leitet außerdem die
begrenzten Tool-Konstruktionssteuerungen weiter, die sie an der SDK-Grenze
durchsetzen kann: `includeCoreTools`, die Runtime-Tool-Allowlist und
`toolConstructionPlan`.

Die Bridge verwendet außerdem den gemeinsamen Harness-Tool-Surface-Helfer aus
`openclaw/plugin-sdk/agent-harness-tool-runtime` für PI-Parität. Wenn
Tool-Suche aktiviert ist, sieht das SDK kompakte Steuerungs-Tools plus einen
versteckten Katalog-Executor anstelle jedes OpenClaw-Tool-Schemas. Wenn
Code-Modus aktiviert ist, baut der Helfer dieselbe Code-Modus-Steuerungsfläche
und denselben Kataloglebenszyklus auf, die andere Agent-Harnesse verwenden.
Schlanke Standardwerte für lokale Modelle, runtimekompatible Schemafilterung,
Verzeichnis-Hydration und Katalogbereinigung bleiben alle im gemeinsamen
Helfer, damit Copilot- und Codex-nahe Harnesse nicht auseinanderlaufen.

### GitHub-Token auf Sitzungsebene

Der Vertrag des Copilot-SDK unterscheidet den **clientseitigen** GitHub-Token
(`CopilotClientOptions.gitHubToken`, verwendet zur Authentifizierung des
CLI-Prozesses selbst) vom **sitzungsseitigen** Token
(`SessionConfig.gitHubToken`, der Inhaltsausschluss, Modellrouting und Quote
für diese Sitzung bestimmt und sowohl bei `createSession` als auch bei
`resumeSession` berücksichtigt wird). Der Harness löst Auth einmal über
`resolveCopilotAuth` auf und setzt beide Felder, wenn der Auth-Modus
`gitHubToken` ist (ein explizites `auth.gitHubToken` oder ein vertragsgemäß
aufgelöstes `resolvedApiKey` aus einem konfigurierten
`github-copilot`-Auth-Profil). Wenn der aufgelöste Modus `useLoggedInUser`
ist, wird das sitzungsseitige Feld ausgelassen, sodass das SDK die Identität
weiterhin aus der angemeldeten Identität ableitet.

`ask_user` verwendet `SessionConfig.onUserInputRequest`. Die Bridge akzeptiert
Auswahlindizes oder Labels für Anfragen mit festen Auswahlmöglichkeiten,
akzeptiert Freiformantworten, wenn die SDK-Anfrage sie erlaubt, und bricht eine
ausstehende Anfrage ab, wenn der OpenClaw-Versuch abgebrochen wird.

## Verwandte Themen

- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Codex-Harness](/de/plugins/codex-harness)
- [Agent-Harness-Plugins (SDK-Referenz)](/de/plugins/sdk-agent-harness)
