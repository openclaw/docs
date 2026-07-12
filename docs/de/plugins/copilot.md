---
read_when:
    - Sie möchten das GitHub Copilot SDK-Harness für einen Agenten verwenden
    - Sie benötigen Konfigurationsbeispiele für die `copilot`-Laufzeit
    - Sie verbinden einen Agenten mit einem Copilot-Abonnement (github / openclaw / copilot) und möchten ihn über die Copilot CLI ausführen.
summary: OpenClaw-Turns mit eingebettetem Agenten über das externe GitHub Copilot SDK-Harness ausführen
title: Copilot-SDK-Harness
x-i18n:
    generated_at: "2026-07-12T15:41:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Das externe Plugin `@openclaw/copilot` führt eingebettete Copilot-Agentenläufe im Rahmen eines Abonnements über die GitHub Copilot CLI (`@github/copilot-sdk`) statt über das integrierte Harness von OpenClaw aus. Die Copilot-CLI-Sitzung verwaltet die Low-Level-Agentenschleife: native Werkzeugausführung, native Compaction (`infiniteSessions`) und den von der CLI verwalteten Thread-Zustand unter `copilotHome`. OpenClaw verwaltet weiterhin Chatkanäle, Sitzungsdateien, Modellauswahl, dynamische Werkzeuge (über eine Bridge), Genehmigungen, Medienzustellung, die sichtbare Transkriptspiegelung, `/btw`-Nebenfragen (siehe [Nebenfragen (`/btw`)](#side-questions-btw)) und `openclaw doctor`.

Einen Überblick über die allgemeine Aufteilung zwischen Modell, Provider und Laufzeit finden Sie unter [Agentenlaufzeiten](/de/concepts/agent-runtimes).

## Anforderungen

- OpenClaw mit installiertem Plugin `@openclaw/copilot`.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, fügen Sie `copilot` hinzu (die vom Plugin deklarierte Manifest-ID). Ein Zulassungslisteneintrag für den npm-Paketnamen `@openclaw/copilot` stimmt nicht überein und lässt das Plugin blockiert, selbst wenn `agentRuntime.id: "copilot"` festgelegt ist.
- Ein GitHub-Copilot-Abonnement, das die Copilot CLI ausführen kann, oder eine Umgebungsvariable `gitHubToken` bzw. ein Authentifizierungsprofileintrag für Headless- oder Cron-Läufe.
- Ein beschreibbares Verzeichnis `copilotHome`. Der Standardwert ist `<agentDir>/copilot`, wenn OpenClaw ein Agentenverzeichnis bereitstellt, andernfalls `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` führt den [Doctor-Vertrag](#doctor) des Plugins für die Zuständigkeit für den Sitzungszustand und zukünftige Konfigurationsmigrationen aus. Die Copilot-CLI-Umgebung wird dabei nicht geprüft.

## Installation

Die Copilot-Laufzeit wird als externes Plugin ausgeliefert, damit das Kernpaket `openclaw` weder `@github/copilot-sdk` noch dessen plattformspezifische CLI-Binärdatei `@github/copilot-<platform>-<arch>` enthält (zusammen ungefähr 260 MB). Installieren Sie es nur für Agenten, die diese Laufzeit ausdrücklich verwenden:

```bash
openclaw plugins install @openclaw/copilot
```

Der Einrichtungsassistent installiert das Plugin automatisch, wenn Sie erstmals ein Modell vom Typ `github-copilot/*` auswählen **und** Ihre Konfiguration dieses Modell (oder dessen Provider) über `agentRuntime: { id: "copilot" }` an die Copilot-Laufzeit weiterleitet; siehe [Schnellstart](#quickstart). Ohne diese ausdrückliche Aktivierung verwendet OpenClaw seinen integrierten GitHub-Copilot-Provider und installiert dieses Plugin nie.

Die Laufzeit löst das SDK in dieser Reihenfolge auf:

1. `import("@github/copilot-sdk")` aus dem installierten Paket `@openclaw/copilot`.
2. Das Ausweichverzeichnis `~/.openclaw/npm-runtime/copilot/` (veraltetes Ziel für bedarfsgesteuerte Installationen).

Ein fehlendes SDK erzeugt einen einzelnen Fehler mit dem Code `COPILOT_SDK_MISSING` und dem oben angegebenen Befehl zur Neuinstallation.

## Schnellstart

Ordnen Sie dem Harness ein Modell (oder einen Provider) fest zu:

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

Legen Sie `agentRuntime.id` für einen einzelnen Modelleintrag fest, um nur dieses Modell über das Harness weiterzuleiten, oder für einen Provider, um jedes Modell dieses Providers weiterzuleiten.

`github-copilot/auto` ist der portable Ausgangspunkt. Benannte Copilot-Modelle hängen vom Konto und von den Organisationsrichtlinien ab; vergewissern Sie sich vor der festen Zuordnung, dass Ihre authentifizierte Copilot CLI ein Modell tatsächlich bereitstellt.

## Unterstützte Provider

Das Harness unterstützt den kanonischen Provider `github-copilot` (verwaltet von `extensions/github-copilot`) sowie benutzerdefinierte `models.providers`-Einträge, wenn das Modell über eine nicht leere `baseUrl` und eine der folgenden `api`-Formen verfügt:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI-kompatible Vervollständigungen)
- `openai-completions`
- `openai-responses`

Native Provider-IDs (`openai`, `anthropic`, `google`, `ollama`) bleiben ihren nativen Laufzeiten zugeordnet. Verwenden Sie stattdessen eine separate benutzerdefinierte Provider-ID, um einen Endpunkt über Copilot BYOK weiterzuleiten.

Copilot-BYOK-Endpunkte müssen öffentliche HTTPS-URLs sein. Das Harness stellt dem Copilot SDK für jeden Versuch einen Loopback-Proxy bereit und leitet den Provider-Datenverkehr anschließend über den abgesicherten Abrufpfad von OpenClaw weiter, sodass DNS-Pinning und SSRF-Richtlinien weiterhin von OpenClaw verwaltet werden. Verwenden Sie die native OpenClaw-Laufzeit für lokale Ollama-, LM-Studio- oder LAN-Modellserver.

## BYOK

Copilot BYOK verwendet den benutzerdefinierten Provider-Vertrag des SDK auf Sitzungsebene. OpenClaw übergibt den aufgelösten Modellendpunkt, API-Schlüssel, Bearer-Token-Modus, Header, die Modell-ID sowie Kontext- und Ausgabelimits; die Provider-Transportlogik verbleibt im SDK und nicht im Kern.

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

BYOK-Sitzungen erhalten separate Schlüssel gegenüber Abonnementsitzungen sowie anderen BYOK-Endpunkten oder Anmeldedaten. Wenn Sie den Schlüssel, die Header, das Modell oder den Endpunkt ändern, wird eine neue Copilot-SDK-Sitzung gestartet, anstatt einen inkompatiblen Zustand fortzusetzen.

## Authentifizierung

Priorität, die während `runCopilotAttempt` für jeden Agenten angewendet wird:

1. **Explizites `useLoggedInUser: true`** in der Versuchseingabe – verwendet den in der Copilot CLI angemeldeten Benutzer unter dem `copilotHome` des Agenten.
2. **Explizites `gitHubToken`** in der Versuchseingabe (erfordert `profileId` und `profileVersion`). Für direkte CLI-Aufrufe und Tests, die die Auflösung des Authentifizierungsprofils umgehen müssen.
3. **Vertragsseitig aufgelöste Werte `resolvedApiKey` und `authProfileId`** – der Hauptpfad für den Produktivbetrieb. Der Kern löst das konfigurierte Authentifizierungsprofil `github-copilot` des Agenten (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) auf, bevor er das Harness aufruft. Dadurch funktioniert ein Authentifizierungsprofil `github-copilot:<profile>` durchgängig für Headless-, Cron- oder Mehrprofilkonfigurationen, ohne dass Umgebungsvariablen erforderlich sind.
4. **Ausweichlösung über Umgebungsvariablen**, in dieser Reihenfolge geprüft (der erste nicht leere Wert gewinnt; leere Zeichenfolgen gelten als nicht vorhanden; entspricht der Priorität des ausgelieferten Providers `github-copilot` in `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` – Harness-spezifische Überschreibung; damit können Sie ein Token für das OpenClaw-Harness festlegen, ohne die systemweite Konfiguration von `gh` bzw. der Copilot CLI zu verändern.
   2. `COPILOT_GITHUB_TOKEN` – standardmäßige Umgebungsvariable des Copilot SDK bzw. der CLI.
   3. `GH_TOKEN` – standardmäßige Umgebungsvariable der CLI `gh`.
   4. `GITHUB_TOKEN` – allgemeine Ausweichlösung für GitHub-Token.

   Die synthetisierte Profil-ID des Pools lautet `env:<NAME>`; die Profilversion ist ein nicht umkehrbarer SHA-256-Fingerabdruck des Tokens. Dadurch wird der Client-Pool beim Ändern des Umgebungswerts ordnungsgemäß verworfen.

5. **Standardmäßiges `useLoggedInUser`**, wenn kein Token-Signal verfügbar ist.

Jeder Agent erhält ein eigenes `copilotHome`, damit Copilot-CLI-Token, Sitzungen und Konfigurationen niemals zwischen Agenten auf demselben Rechner übertragen werden. Standard: `<agentDir>/copilot` (hält den SDK-Zustand aus demselben Verzeichnis wie die OpenClaw-Dateien `models.json` und `auth-profiles.json` heraus) oder `~/.openclaw/agents/<agentId>/copilot`, wenn kein Agentenverzeichnis angegeben wird. Überschreiben Sie den Wert mit `copilotHome: <path>` in der Versuchseingabe, um einen benutzerdefinierten Speicherort zu verwenden (beispielsweise einen gemeinsam genutzten Einhängepunkt für eine Migration).

Live-Harness-Tests verwenden `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` für ein direktes Token. Die gemeinsame Live-Test-Einrichtung entfernt `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` und `GITHUB_TOKEN`, nachdem echte Authentifizierungsprofile im isolierten Testverzeichnis bereitgestellt wurden. Dadurch verhindert ein über die spezielle Variable übergebener Wert von `gh auth token` fälschliche Überspringungen, ohne in andere Testsuiten zu gelangen.

## Konfigurationsoberfläche

Das Harness liest die Konfiguration aus der Eingabe für jeden Versuch (`runCopilotAttempt({...})`) sowie aus einer kleinen Gruppe von Umgebungsstandardwerten innerhalb von `extensions/copilot/src/`:

| Feld                     | Zweck                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | CLI-Zustandsverzeichnis pro Agent (Standardwerte siehe oben).                                                                                                                                                                                                                                                                                               |
| `model`                  | Zeichenfolge oder `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Lassen Sie den Wert weg, um die normale Modellauswahl des Agenten zu verwenden; das Harness überprüft, ob der aufgelöste Provider unterstützt wird.                                                                                                                               |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Wird aus der Auflösung von `ThinkLevel` bzw. `ReasoningLevel` von OpenClaw in `auto-reply/thinking.ts` abgebildet.                                                                                                                                                                                                |
| `infiniteSessionConfig`  | Optionale Überschreibung für den durch `harness.compact` gesteuerten SDK-Block `infiniteSessions`. Kann unverändert bleiben.                                                                                                                                                                                                                                 |
| `hooksConfig`            | Optionale native Copilot-SDK-Konfiguration `SessionHooks` für Werkzeug-/MCP-, Benutzeraufforderungs-, Sitzungs- und Fehler-Callbacks. Unabhängig von den portablen Lebenszyklus-Hooks von OpenClaw.                                                                                                                                                           |
| `permissionPolicy`       | Optionale Überschreibung des SDK-Handlers `onPermissionRequest` für integrierte SDK-Werkzeugtypen (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Standardmäßig wird als Sicherheitsnetz `rejectAllPolicy` verwendet; unter [Berechtigungen und ask_user](#permissions-and-ask_user) erfahren Sie, warum der Handler tatsächlich nie ausgelöst wird. |
| `enableSessionTelemetry` | Optionales SDK-Flag für die Sitzungstelemetrie.                                                                                                                                                                                                                                                                                                             |

OpenClaw-Plugin-Hooks benötigen keine Copilot-spezifische Versuchskonfiguration. Das Harness führt `before_prompt_build` (und den veralteten Kompatibilitäts-Hook `before_agent_start`), `llm_input`, `llm_output` und `agent_end` über die standardmäßigen Harness-Hilfsfunktionen aus. Erfolgreiche SDK-Compactions führen außerdem `before_compaction` und `after_compaction` aus. Über die Bridge angebundene OpenClaw-Werkzeuge führen `before_tool_call` aus und melden `after_tool_call`; `hooksConfig` bleibt für ausschließlich native SDK-Callbacks ohne portables Äquivalent vorgesehen.

Keine andere Komponente in OpenClaw muss diese Felder kennen. Andere Plugins, Kanäle und der Kern sehen ausschließlich die Standardform `AgentHarnessAttemptParams` bzw. `AgentHarnessAttemptResult`.

## Compaction

Wenn `harness.compact` ausgeführt wird, führt das Copilot-SDK-Harness folgende Schritte aus:

1. Es setzt die verfolgte SDK-Sitzung fort, ohne ausstehende Arbeit weiterzuführen.
2. Es ruft den sitzungsbezogenen RPC des SDK für die Verlaufskomprimierung auf.
3. Es gibt das Ergebnis der SDK-Compaction zurück, ohne Kompatibilitäts-Markierungsdateien im Arbeitsbereich zu schreiben.

Die OpenClaw-seitige Transkriptspiegelung (siehe unten) empfängt weiterhin Nachrichten nach der Compaction, sodass der für Benutzer sichtbare Chatverlauf konsistent bleibt.

## Transkriptspiegelung

`runCopilotAttempt` schreibt die spiegelbaren Nachrichten jedes Laufs parallel über `extensions/copilot/src/dual-write-transcripts.ts` in das OpenClaw-Audittranskript. Die Spiegelung ist nach Sitzung abgegrenzt (`copilot:${sessionId}`) und wird pro Nachricht mit einem Schlüssel versehen (`${role}:${sha256_16(role,content)}`). Dadurch kollidieren erneut ausgegebene Einträge früherer Läufe mit bereits auf dem Datenträger vorhandenen Schlüsseln, anstatt dupliziert zu werden.

Zwei Ebenen der Fehlerisolierung umschließen die Spiegelung, sodass ein
Fehler beim Schreiben des Transkripts niemals den Versuch fehlschlagen lässt:
ein interner Best-Effort-Wrapper sowie ein Defense-in-Depth-`.catch(...)` auf
Versuchsebene. Fehler werden protokolliert, nicht nach außen weitergegeben.

## Nebenfragen (`/btw`)

`/btw` ist in diesem Harness **nicht** nativ. `createCopilotAgentHarness()`
lässt `harness.runSideQuestion` bewusst undefiniert
(bestätigt in `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
sodass der `/btw`-Dispatcher von OpenClaw (`src/agents/btw.ts`) auf denselben
Pfad zurückfällt, den er für jede Nicht-Codex-Laufzeit verwendet: Der
konfigurierte Modell-Provider wird direkt mit einem kurzen
Nebenfragen-Prompt aufgerufen und die Antwort über `streamSimple`
zurückgestreamt (keine CLI-Sitzung, kein zusätzlicher Pool-Slot).

Dadurch bleiben Copilot-CLI-Sitzungen für die Hauptschleife der
Agentenverarbeitung reserviert, und das Verhalten von `/btw` bleibt mit
anderen Nicht-Codex-Laufzeiten identisch.

## Doctor

`extensions/copilot/doctor-contract-api.ts` wird automatisch von
`src/plugins/doctor-contract-registry.ts` geladen. Es stellt Folgendes bereit:

- Leere `legacyConfigRules` (noch keine außer Betrieb genommenen Felder).
- Eine wirkungslose `normalizeCompatibilityConfig` (wird beibehalten, damit
  zukünftige Außerdienststellungen von Feldern einen stabilen Ort im
  Quellbaum haben).
- Einen `sessionRouteStateOwners`-Eintrag: Provider `github-copilot`,
  Laufzeit `copilot`, CLI-Sitzungsschlüssel `copilot`,
  Authentifizierungsprofil-Präfix `github-copilot:`.

## Einschränkungen

- Der Harness beansprucht `github-copilot` sowie benutzerdefinierte
  BYOK-Provider-IDs ohne Eigentümer. Native Provider-IDs mit
  Manifest-Eigentümer verbleiben bei ihrer zuständigen Laufzeit, selbst wenn
  `agentRuntime.id` auf `copilot` erzwungen wird.
- Keine TUI-Oberfläche; die TUI von PI bleibt der Fallback für Laufzeiten ohne
  gleichwertige Oberfläche.
- Der PI-Sitzungszustand wird nicht migriert, wenn ein Agent zu `copilot`
  wechselt. Die Auswahl erfolgt pro Versuch; bestehende PI-Sitzungen bleiben
  gültig.
- `ask_user` verwendet denselben Prompt-und-Antwort-Pfad von OpenClaw wie der
  Codex-Harness: Wenn das Copilot SDK Benutzereingaben anfordert, sendet
  OpenClaw einen blockierenden Prompt an den aktiven Kanal/die aktive TUI,
  und die nächste eingereihte Benutzernachricht erfüllt die SDK-Anfrage.

## Berechtigungen und ask_user

Die Durchsetzung von Berechtigungen für überbrückte OpenClaw-Tools erfolgt
**innerhalb des Tool-Wrappers**, nicht über den
`onPermissionRequest`-Callback des SDK. Derselbe
`wrapToolWithBeforeToolCallHook`, den PI verwendet
(`src/agents/agent-tools.before-tool-call.ts`), wird von
`createOpenClawCodingTools` auf jedes Coding-Tool angewendet:
Schleifenerkennung, Richtlinien für vertrauenswürdige Plugins,
Before-Tool-Call-Hooks und zweiphasige Plugin-Genehmigungen über den Gateway
(`plugin.approval.request`) durchlaufen exakt denselben Codepfad wie native
PI-Versuche.

Das von `convertOpenClawToolToSdkTool` zurückgegebene SDK-Tool ist wie folgt
gekennzeichnet:

- `overridesBuiltInTool: true` — ersetzt das integrierte Tool der Copilot CLI
  mit demselben Namen (edit, read, write, bash, ...), sodass jeder Tool-Aufruf
  an OpenClaw zurückgeleitet wird.
- `skipPermission: true` — weist das SDK an, vor dem Aufruf des Tools kein
  `onPermissionRequest({kind: "custom-tool"})` auszulösen. Das umschlossene
  `execute()` führt bereits die umfassendere Richtlinienprüfung von OpenClaw
  durch; ein Prompt auf SDK-Ebene würde die Durchsetzung von OpenClaw
  entweder kurzschließen (alles zulassen) oder jeden Tool-Aufruf blockieren
  (alles ablehnen) — beides entspricht nicht der Parität mit PI.

Der Codex-Harness im Quellbaum verwendet dieselbe Aufteilung: Überbrückte
OpenClaw-Tools werden umschlossen
(`extensions/codex/src/app-server/dynamic-tools.ts`), und die eigenen nativen
Genehmigungsarten des codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) werden über `plugin.approval.request`
geleitet (`extensions/codex/src/app-server/approval-bridge.ts`). Das
Copilot-SDK-Äquivalent — die Fail-Closed-`rejectAllPolicy` für jede
Nicht-`custom-tool`-Art, die jemals `onPermissionRequest` erreicht — ist
dasselbe Sicherheitsnetz. In der Praxis wird es nie ausgelöst, weil
`overridesBuiltInTool: true` jedes integrierte Tool verdrängt.

Damit die Ebene der umschlossenen Tools Richtlinienentscheidungen treffen
kann, die PI entsprechen, leitet der Harness den vollständigen
Versuchs-Tool-Kontext von PI an `createOpenClawCodingTools` weiter:
Identität (`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, ...),
Kanal/Routing (`groupId`, `currentChannelId`, `replyToMode`,
Message-Tool-Umschalter), Authentifizierung (`authProfileStore`),
Ausführungsidentität (`sessionKey` / `runSessionKey`, abgeleitet von
`sandboxSessionKey`, `runId`), Modellkontext (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) und
Ausführungs-Hooks (`onToolOutcome`, `onYield`). Ohne diese Felder lehnen
Allowlists, die ausschließlich für Eigentümer gelten, standardmäßig
unbemerkt ab, Plugin-Vertrauensrichtlinien können nicht dem richtigen
Geltungsbereich zugeordnet werden, und `session_status: "current"` wird zu
einem veralteten Sandbox-Schlüssel aufgelöst. Der Bridge-Builder befindet
sich in `extensions/copilot/src/tool-bridge.ts` und spiegelt den maßgeblichen
PI-Aufruf unter `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` löst den Sandbox-Kontext über die gemeinsame
`resolveSandboxContext`-Nahtstelle auf, übergibt dem SDK ein effektives
Arbeitsverzeichnis und leitet `sandbox` sowie den Arbeitsbereich für das
Erzeugen von Subagenten an die Tool-Bridge weiter. Die Bridge leitet
außerdem die begrenzten Steuerelemente für die Tool-Erstellung weiter, die
sie an der SDK-Grenze durchsetzen kann: `includeCoreTools`, die
Tool-Allowlist der Laufzeit und `toolConstructionPlan`.

Die Bridge verwendet für die PI-Parität außerdem den gemeinsamen
Harness-Helfer für Tool-Oberflächen aus
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Wenn die Tool-Suche
aktiviert ist, sieht das SDK kompakte Steuerungs-Tools sowie einen
verborgenen Katalog-Executor anstelle jedes OpenClaw-Tool-Schemas. Wenn der
Code-Modus aktiviert ist, erstellt der Helfer dieselbe
Code-Modus-Steuerungsoberfläche und denselben Kataloglebenszyklus, die von
anderen Agent-Harnesses verwendet werden. Schlanke Standardwerte für lokale
Modelle, laufzeitkompatible Schemafilterung, Verzeichnis-Hydration und
Katalogbereinigung verbleiben im gemeinsamen Helfer, damit Copilot- und
Codex-nahe Harnesses nicht auseinanderdriften.

### GitHub-Token auf Sitzungsebene

Der Vertrag des Copilot SDK unterscheidet das GitHub-Token auf
**Client-Ebene** (`CopilotClientOptions.gitHubToken`, authentifiziert den
CLI-Prozess selbst) vom Token auf **Sitzungsebene**
(`SessionConfig.gitHubToken`, bestimmt Inhaltsausschluss, Modell-Routing und
Kontingent für diese Sitzung; wird sowohl bei `createSession` als auch bei
`resumeSession` berücksichtigt). Der Harness löst die Authentifizierung
einmal über `resolveCopilotAuth` auf und setzt beide Felder, wenn der
Authentifizierungsmodus `gitHubToken` ist (ein explizites
`auth.gitHubToken` oder ein vertragsgemäß aufgelöster `resolvedApiKey` aus
einem konfigurierten `github-copilot`-Authentifizierungsprofil). Wenn der
aufgelöste Modus `useLoggedInUser` ist, wird das Feld auf Sitzungsebene
weggelassen, sodass das SDK die Identität weiterhin von der angemeldeten
Identität ableitet.

`ask_user` verwendet `SessionConfig.onUserInputRequest`. Die Bridge
akzeptiert Auswahlindizes oder Beschriftungen für Anfragen mit festen
Auswahlmöglichkeiten, akzeptiert Freitextantworten, wenn die SDK-Anfrage
diese zulässt, und bricht eine ausstehende Anfrage ab, wenn der
OpenClaw-Versuch abgebrochen wird.

## Verwandte Themen

- [Agentenlaufzeiten](/de/concepts/agent-runtimes)
- [Codex-Harness](/de/plugins/codex-harness)
- [Agent-Harness-Plugins (SDK-Referenz)](/de/plugins/sdk-agent-harness)
