---
read_when:
    - Sie möchten das GitHub Copilot SDK-Harness für einen Agenten verwenden
    - Sie benötigen Konfigurationsbeispiele für die `copilot`-Runtime.
    - Sie verbinden einen Agenten mit dem Copilot-Abonnement (github / openclaw / copilot) und möchten, dass er über die Copilot CLI ausgeführt wird.
summary: Führen Sie eingebettete OpenClaw-Agentendurchläufe über das externe GitHub-Copilot-SDK-Harness aus
title: Copilot-SDK-Harness
x-i18n:
    generated_at: "2026-07-16T13:00:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

Das externe Plugin `@openclaw/copilot` führt eingebettete Agent-Durchläufe des Copilot-Abonnements über die GitHub Copilot CLI (`@github/copilot-sdk`) statt über das integrierte Harness von OpenClaw aus. Die Copilot-CLI-Sitzung verwaltet die interne Agent-Schleife: native Werkzeugausführung, native Compaction (`infiniteSessions`) und den von der CLI verwalteten Thread-Zustand unter `copilotHome`. OpenClaw verwaltet weiterhin Chatkanäle, Sitzungsdateien, Modellauswahl, dynamische Werkzeuge (über eine Bridge), Genehmigungen, Medienzustellung, die sichtbare Transkriptspiegelung, `/btw` Nebenfragen (siehe
[Nebenfragen (`/btw`)](#side-questions-btw)) und `openclaw doctor`.

Beginnen Sie für die allgemeine Aufteilung zwischen Modell, Provider und Laufzeit mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes).

## Voraussetzungen

- OpenClaw mit installiertem Plugin `@openclaw/copilot`.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie `copilot` auf (die vom
  Plugin deklarierte Manifest-ID). Ein Eintrag für den npm-Paketnamen
  `@openclaw/copilot` in der Zulassungsliste stimmt nicht überein und lässt das Plugin gesperrt, selbst wenn
  `agentRuntime.id: "copilot"` festgelegt ist.
- Ein GitHub-Copilot-Abonnement, das die Copilot CLI verwenden kann, oder eine
  Umgebungsvariable `gitHubToken` bzw. ein Authentifizierungsprofileintrag für Headless- oder Cron-Ausführungen.
- Ein beschreibbares Verzeichnis `copilotHome`. Standardmäßig `<agentDir>/copilot`, wenn
  OpenClaw ein Agent-Verzeichnis bereitstellt, andernfalls
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` führt den [Doctor-Vertrag](#doctor) des Plugins für die
Verwaltung des Sitzungszustands und zukünftige Konfigurationsmigrationen aus. Die
Copilot-CLI-Umgebung wird dabei nicht geprüft.

## Installation

Die Copilot-Laufzeit wird als externes Plugin ausgeliefert, damit das Kernpaket `openclaw`
weder `@github/copilot-sdk` noch dessen plattformspezifische
CLI-Binärdatei `@github/copilot-<platform>-<arch>` enthält (zusammen ungefähr 260 MB).
Installieren Sie es nur für Agenten, die diese Laufzeit verwenden:

```bash
openclaw plugins install @openclaw/copilot
```

Der Einrichtungsassistent installiert das Plugin automatisch, wenn Sie erstmals
ein Modell `github-copilot/*` auswählen **und** Ihre Konfiguration dieses Modell (oder dessen
Provider) über `agentRuntime: { id: "copilot" }` an die Copilot-Laufzeit weiterleitet; siehe
[Schnellstart](#quickstart). Ohne diese Aktivierung verwendet OpenClaw seinen integrierten
GitHub-Copilot-Provider und installiert dieses Plugin nie.

Die Laufzeit löst das SDK in dieser Reihenfolge auf:

1. `import("@github/copilot-sdk")` aus dem installierten Paket `@openclaw/copilot`.
2. Das Ausweichverzeichnis `~/.openclaw/npm-runtime/copilot/` (veraltetes Ziel für die bedarfsgesteuerte
   Installation).

Ein fehlendes SDK erzeugt einen Fehler mit dem Code `COPILOT_SDK_MISSING` und dem
oben angegebenen Befehl zur Neuinstallation.

## Schnellstart

Weisen Sie ein Modell (oder einen Provider) dem Harness fest zu:

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

Legen Sie `agentRuntime.id` in einem einzelnen Modelleintrag fest, um nur dieses Modell über
das Harness weiterzuleiten, oder bei einem Provider, um jedes Modell dieses Providers weiterzuleiten.

`github-copilot/auto` ist der portable Ausgangspunkt. Benannte Copilot-Modelle sind
von den Konto- und Organisationsrichtlinien abhängig; vergewissern Sie sich vor der festen Zuweisung, dass Ihre authentifizierte
Copilot CLI ein Modell tatsächlich bereitstellt.

## Unterstützte Provider

Das Harness unterstützt den kanonischen Provider `github-copilot` (verwaltet von
`extensions/github-copilot`) sowie benutzerdefinierte Einträge `models.providers`, wenn das
Modell einen nicht leeren Wert `baseUrl` und eine dieser Formen von `api` besitzt:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI-kompatible Vervollständigungen)
- `openai-completions`
- `openai-responses`

Native Provider-IDs (`openai`, `anthropic`, `google`, `ollama`) bleiben im Besitz
ihrer nativen Laufzeiten. Verwenden Sie stattdessen eine eindeutige benutzerdefinierte Provider-ID, um einen Endpunkt
über Copilot BYOK weiterzuleiten.

Copilot-BYOK-Endpunkte müssen öffentliche HTTPS-URLs sein. Das Harness stellt dem
Copilot SDK für jeden Versuch einen Loopback-Proxy bereit und leitet den Provider-Datenverkehr anschließend
über den abgesicherten Abrufpfad von OpenClaw weiter, sodass DNS-Pinning und SSRF-Richtlinien
weiterhin von OpenClaw verwaltet werden. Verwenden Sie die native OpenClaw-Laufzeit für lokale Ollama-, LM-
Studio- oder LAN-Modellserver.

## BYOK

Copilot BYOK verwendet den benutzerdefinierten Provider-Vertrag des SDK auf Sitzungsebene. OpenClaw
übergibt den aufgelösten Modellendpunkt, API-Schlüssel, Bearer-Token-Modus, Header, die Modell-
ID sowie Kontext- und Ausgabelimits; die Transportlogik des Providers verbleibt im SDK und nicht
im Kern.

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

BYOK-Sitzungen erhalten separate Schlüssel gegenüber Abonnementsitzungen sowie anderen
BYOK-Endpunkten oder Anmeldedaten. Das Ersetzen des Schlüssels, der Header, des Modells oder des Endpunkts
startet eine neue Copilot-SDK-Sitzung, statt einen inkompatiblen Zustand fortzusetzen.

## Authentifizierung

Rangfolge, die während `runCopilotAttempt` pro Agent angewendet wird:

1. **Explizites `useLoggedInUser: true`** in der Eingabe des Versuchs – verwendet den
   in der Copilot CLI angemeldeten Benutzer unter `copilotHome` des Agenten.
2. **Explizites `gitHubToken`** in der Eingabe des Versuchs (erfordert `profileId` +
   `profileVersion`). Für direkte CLI-Aufrufe und Tests, die die
   Auflösung von Authentifizierungsprofilen umgehen müssen.
3. **Vertragsgemäß aufgelöstes `resolvedApiKey` + `authProfileId`** – der produktive
   Hauptpfad. Der Kern löst das konfigurierte Authentifizierungsprofil `github-copilot` des Agenten
   (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) auf, bevor
   das Harness aufgerufen wird, sodass ein Authentifizierungsprofil `github-copilot:<profile>`
   für Headless-, Cron- oder Mehrprofilkonfigurationen ohne Umgebungsvariablen durchgängig funktioniert.
4. **Rückgriff auf Umgebungsvariablen**, geprüft in dieser Reihenfolge (der erste nicht leere Wert wird verwendet,
   leere Zeichenfolgen gelten als nicht vorhanden; entspricht der ausgelieferten Rangfolge des Providers `github-copilot`
   in `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` – Harness-spezifische Überschreibung; ermöglicht die feste Zuweisung eines
      Tokens für das OpenClaw-Harness, ohne die systemweite Konfiguration von `gh` /
      der Copilot CLI zu verändern.
   2. `COPILOT_GITHUB_TOKEN` – standardmäßige Umgebungsvariable des Copilot SDK / der Copilot CLI.
   3. `GH_TOKEN` – standardmäßige Umgebungsvariable der CLI `gh`.
   4. `GITHUB_TOKEN` – generischer Rückgriff auf ein GitHub-Token.

   Die synthetisierte Pool-Profil-ID lautet `env:<NAME>`; die Profilversion ist ein
   nicht umkehrbarer sha256-Fingerabdruck des Tokens, sodass eine Änderung des Umgebungswerts
   den Client-Pool zuverlässig ungültig macht.

5. **Standardwert `useLoggedInUser`**, wenn kein Token-Signal verfügbar ist.

Jeder Agent erhält ein eigenes `copilotHome`, damit Copilot-CLI-Token, Sitzungen und
Konfigurationen niemals zwischen Agenten auf demselben Rechner durchsickern. Standard:
`<agentDir>/copilot` (hält den SDK-Zustand aus demselben Verzeichnis wie
`models.json` / `auth-profiles.json` von OpenClaw heraus) oder
`~/.openclaw/agents/<agentId>/copilot`, wenn kein Agent-Verzeichnis bereitgestellt wird.
Überschreiben Sie dies mit `copilotHome: <path>` in der Eingabe des Versuchs, um einen benutzerdefinierten
Speicherort zu verwenden (beispielsweise einen gemeinsam genutzten Einhängepunkt für die Migration).

Live-Harness-Tests verwenden `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` für ein direktes
Token. Die gemeinsame Einrichtung für Live-Tests entfernt `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
und `GITHUB_TOKEN`, nachdem echte Authentifizierungsprofile in der isolierten Test-
Umgebung bereitgestellt wurden. Dadurch verhindert ein über die dedizierte Variable übergebener Wert `gh auth token`
fälschliches Überspringen, ohne in andere Testsuiten einzudringen.

## Konfigurationsoberfläche

Das Harness liest die Konfiguration aus der versuchsspezifischen Eingabe (`runCopilotAttempt({...})`)
sowie aus einigen wenigen Umgebungsstandardwerten innerhalb von `extensions/copilot/src/`:

| Feld                     | Zweck                                                                                                                                                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | CLI-Zustandsverzeichnis pro Agent (Standardwerte siehe oben).                                                                                                                                                                                                                                    |
| `model`                  | Zeichenfolge oder `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Weglassen, um die normale Modellauswahl des Agenten zu verwenden; das Harness überprüft, ob der aufgelöste Provider unterstützt wird.                                                                                                                       |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Wird aus der Auflösung von `ThinkLevel` / `ReasoningLevel` durch OpenClaw in `auto-reply/thinking.ts` abgebildet.                                                                                                                                                            |
| `infiniteSessionConfig`  | Optionale Überschreibung für den SDK-Block `infiniteSessions`, der durch `harness.compact` gesteuert wird. Kann unverändert bleiben.                                                                                                                                                              |
| `hooksConfig`            | Optionale native Copilot-SDK-Konfiguration `SessionHooks` für Werkzeug-/MCP-, Benutzeraufforderungs-, Sitzungs- und Fehler-Callbacks. Getrennt von den portablen Lebenszyklus-Hooks von OpenClaw.                                                                                                |
| `permissionPolicy`       | Optionale Überschreibung für den SDK-Handler `onPermissionRequest` für integrierte SDK-Werkzeugtypen (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Verwendet standardmäßig `rejectAllPolicy` als Sicherheitsnetz; unter [Berechtigungen und ask_user](#permissions-and-ask_user) erfahren Sie, weshalb er tatsächlich nie ausgelöst wird. |
| `enableSessionTelemetry` | Optionales Telemetrie-Flag für SDK-Sitzungen.                                                                                                                                                                                                                                                    |

OpenClaw-Plugin-Hooks benötigen keine Copilot-spezifische Versuchskonfiguration. Das
Harness führt `before_prompt_build` (sowie den veralteten Kompatibilitäts-Hook `before_agent_start`),
`llm_input`, `llm_output` und `agent_end` über die
standardmäßigen Harness-Hilfsfunktionen aus. Erfolgreiche SDK-Compactions führen außerdem
`before_compaction` und `after_compaction` aus. Über eine Bridge angebundene OpenClaw-Werkzeuge führen
`before_tool_call` aus und melden `after_tool_call`; `hooksConfig` bleibt für
native, ausschließlich SDK-interne Callbacks ohne portables Gegenstück erhalten.

Keine andere Komponente in OpenClaw muss diese Felder kennen. Andere Plugins,
Kanäle und der Kern sehen nur die Standardform `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Wenn `harness.compact` ausgeführt wird, führt das Copilot-SDK-Harness Folgendes aus:

1. Es setzt die nachverfolgte SDK-Sitzung fort, ohne ausstehende Arbeit weiterzuführen.
2. Es ruft den sitzungsspezifischen RPC des SDK zur Komprimierung des Verlaufs auf.
3. Es gibt das Ergebnis der SDK-Compaction zurück, ohne Kompatibilitätsmarkierungsdateien
   im Arbeitsbereich zu schreiben.

Die OpenClaw-seitige Transkriptspiegelung (unten) empfängt weiterhin Nachrichten
nach der Compaction, sodass der für Benutzer sichtbare Chatverlauf konsistent bleibt.

## Transkriptspiegelung

`runCopilotAttempt` schreibt die spiegelbaren Nachrichten jedes Durchlaufs zusätzlich über
`extensions/copilot/src/dual-write-transcripts.ts` in das
OpenClaw-Audit-Transkript. Die Spiegelung ist pro
Sitzung (`copilot:${sessionId}`) abgegrenzt und pro Nachricht
(`${role}:${sha256_16(role,content)}`) verschlüsselt, sodass erneut ausgegebene Einträge vorheriger Durchläufe
mit vorhandenen Schlüsseln auf dem Datenträger kollidieren, statt dupliziert zu werden.

Zwei Ebenen der Fehlerbegrenzung umschließen die Spiegelung, damit ein Fehler beim Schreiben
des Transkripts niemals den Versuch fehlschlagen lässt: ein interner Best-Effort-Wrapper sowie ein
Defense-in-Depth-`.catch(...)` auf Versuchsebene. Fehler werden protokolliert, nicht
nach außen weitergegeben.

## Nebenfragen (`/btw`)

`/btw` ist in diesem Harness **nicht** nativ. `createCopilotAgentHarness()`
lässt `harness.runSideQuestion` bewusst undefiniert
(bestätigt in `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
sodass der `/btw`-Dispatcher von OpenClaw (`src/agents/btw.ts`) auf denselben
Pfad zurückfällt, den er für jede Nicht-Codex-Runtime verwendet: Der konfigurierte Modell-Provider
wird direkt mit einem kurzen Nebenfragen-Prompt aufgerufen und die Antwort über
`streamSimple` zurückgestreamt (keine CLI-Sitzung, kein zusätzlicher Pool-Slot).

Dadurch bleiben Copilot-CLI-Sitzungen für die Hauptschleife der Agent-Durchläufe reserviert und
das Verhalten von `/btw` bleibt mit anderen Nicht-Codex-Runtimes identisch.

## Doctor

`extensions/copilot/doctor-contract-api.ts` wird automatisch von
`src/plugins/doctor-contract-registry.ts` geladen. Es steuert Folgendes bei:

- Ein leeres `legacyConfigRules` (noch keine eingestellten Felder).
- Ein wirkungsloses `normalizeCompatibilityConfig` (wird beibehalten, damit zukünftige Feldeinstellungen
  einen stabilen Ort im Quellbaum haben).
- Ein `sessionRouteStateOwners`-Eintrag: Provider `github-copilot`, Runtime
  `copilot`, CLI-Sitzungsschlüssel `copilot`, Auth-Profilpräfix `github-copilot:`.

## Einschränkungen

- Der Harness beansprucht `github-copilot` sowie nicht zugeordnete benutzerdefinierte BYOK-Provider-IDs.
  Manifest-eigene native Provider-IDs verbleiben in ihrer jeweiligen Runtime, selbst wenn
  `agentRuntime.id` auf `copilot` erzwungen wird.
- Keine TUI-Oberfläche; die TUI von PI bleibt der Fallback für Runtimes ohne gleichwertige
  Oberfläche.
- Der PI-Sitzungszustand wird nicht migriert, wenn ein Agent zu `copilot` wechselt.
  Die Auswahl erfolgt pro Versuch; vorhandene PI-Sitzungen bleiben gültig.
- `ask_user` verwendet denselben OpenClaw-Prompt-und-Antwort-Pfad wie der Codex-
  Harness: Wenn das Copilot SDK Benutzereingaben anfordert, veröffentlicht OpenClaw einen
  blockierenden Prompt im aktiven Kanal beziehungsweise in der aktiven TUI, und die nächste
  eingereihte Benutzernachricht erfüllt die SDK-Anfrage.

## Berechtigungen und ask_user

Die Durchsetzung von Berechtigungen für überbrückte OpenClaw-Tools erfolgt **innerhalb des Tool-
Wrappers**, nicht über den `onPermissionRequest`-Callback des SDK. Derselbe
`wrapToolWithBeforeToolCallHook`, den PI verwendet
(`src/agents/agent-tools.before-tool-call.ts`), wird von
`createOpenClawCodingTools` auf jedes Coding-Tool angewendet: Schleifenerkennung, Richtlinien für vertrauenswürdige
Plugins, Hooks vor Tool-Aufrufen und zweiphasige Plugin-Genehmigungen über
das Gateway (`plugin.approval.request`) durchlaufen exakt denselben Codepfad
wie native PI-Versuche.

Jedes vom Copilot-Tool-Bridge zurückgegebene SDK-Tool ist mit Folgendem gekennzeichnet:

- `overridesBuiltInTool: true` — ersetzt das integrierte Tool der Copilot CLI mit
  demselben Namen (edit, read, write, bash, ...), sodass jeder Tool-Aufruf zurück
  zu OpenClaw geleitet wird.
- `skipPermission: true` — weist das SDK an, vor dem Aufruf des Tools
  `onPermissionRequest({kind: "custom-tool"})` nicht auszulösen. Der
  umschlossene `execute()` führt bereits die umfassendere OpenClaw-Richtlinienprüfung durch; ein
  Prompt auf SDK-Ebene würde die Durchsetzung durch OpenClaw entweder umgehen
  (alles zulassen) oder jeden Tool-Aufruf blockieren (alles ablehnen) — beides entspricht nicht
  der Parität mit PI.

Der Codex-Harness im Quellbaum verwendet dieselbe Trennung: Überbrückte OpenClaw-Tools werden
umschlossen (`extensions/codex/src/app-server/dynamic-tools.ts`), und die
eigenen nativen Genehmigungsarten des codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) werden über `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) geleitet. Das Copilot-SDK-
Äquivalent — ein geschlossen fehlschlagender `rejectAllPolicy` für jede Nicht-`custom-tool`-Art,
die jemals `onPermissionRequest` erreicht — ist dasselbe Sicherheitsnetz und wird
in der Praxis nie ausgelöst, da `overridesBuiltInTool: true` jedes
integrierte Tool verdrängt.

Damit die Ebene der umschlossenen Tools Richtlinienentscheidungen treffen kann, die denen von PI entsprechen,
leitet der Harness den vollständigen PI-Kontext für Versuchstools an
`createOpenClawCodingTools` weiter: Identität (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), Kanal/Routing (`groupId`,
`currentChannelId`, `replyToMode`, Umschalter für Nachrichtentools), Authentifizierung
(`authProfileStore`), Ausführungsidentität (`sessionKey` / `runSessionKey`, abgeleitet
aus `sandboxSessionKey`, `runId`), Modellkontext (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) und Ausführungs-Hooks
(`onToolOutcome`, `onYield`). Ohne diese Felder verweigern nur für Eigentümer geltende Zulassungslisten
standardmäßig stillschweigend den Zugriff, Richtlinien zum Plugin-Vertrauen können nicht dem richtigen
Geltungsbereich zugeordnet werden und `session_status: "current"` wird zu einem veralteten Sandbox-Schlüssel aufgelöst. Der
Bridge-Builder ist `extensions/copilot/src/tool-bridge.ts` und spiegelt den maßgeblichen PI-
Aufruf unter `src/agents/embedded-agent-runner/run/attempt.ts:1262` wider.
`runAttempt` löst den Sandbox-Kontext über die gemeinsame
`resolveSandboxContext`-Nahtstelle auf, übergibt dem SDK ein wirksames Arbeitsverzeichnis
und leitet `sandbox` sowie den Arbeitsbereich für das Erzeugen von Subagenten an die Tool-
Bridge weiter. Die Bridge leitet außerdem die begrenzten Steuerelemente für die Tool-Erstellung weiter, die sie
an der SDK-Grenze durchsetzen kann: `includeCoreTools`, die Tool-
Zulassungsliste der Runtime und `toolConstructionPlan`.

Die Bridge verwendet für die Parität mit PI außerdem den gemeinsamen Harness-Helfer für die Tool-Oberfläche aus
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Wenn
die Tool-Suche aktiviert ist, sieht das SDK kompakte Steuerungstools sowie einen verborgenen
Katalog-Executor anstelle sämtlicher OpenClaw-Tool-Schemas. Wenn der Codemodus
aktiviert ist, erstellt der Helfer dieselbe Steuerungsoberfläche für den Codemodus und denselben Katalog-
Lebenszyklus, die von anderen Agent-Harnesses verwendet werden. Schlanke Standardwerte für lokale Modelle,
Runtime-kompatible Schemafilterung, Verzeichnis-Hydratisierung und Katalog-
Bereinigung verbleiben vollständig im gemeinsamen Helfer, damit Copilot- und Codex-nahe
Harnesses nicht auseinanderdriften.

### GitHub-Token auf Sitzungsebene

Der Vertrag des Copilot SDK unterscheidet das GitHub-Token auf **Client-Ebene**
(`CopilotClientOptions.gitHubToken`, authentifiziert den CLI-Prozess selbst)
vom Token auf **Sitzungsebene** (`SessionConfig.gitHubToken`, bestimmt
Inhaltsausschluss, Modell-Routing und Kontingent für diese Sitzung; wird sowohl bei
`createSession` als auch bei `resumeSession` berücksichtigt). Der Harness löst die Authentifizierung einmalig über
`resolveCopilotAuth` auf und setzt beide Felder, wenn der Authentifizierungsmodus `gitHubToken` ist
(ein explizites `auth.gitHubToken` oder ein vertragsgemäß aufgelöstes `resolvedApiKey` aus
einem konfigurierten `github-copilot`-Authentifizierungsprofil). Wenn der aufgelöste Modus
`useLoggedInUser` ist, wird das Feld auf Sitzungsebene ausgelassen, sodass das SDK die
Identität weiterhin aus der angemeldeten Identität ableitet.

`ask_user` verwendet `SessionConfig.onUserInputRequest`. Die Bridge akzeptiert Auswahl-
indizes oder Beschriftungen für Anfragen mit festgelegten Auswahlmöglichkeiten, akzeptiert Freitextantworten, wenn
die SDK-Anfrage diese zulässt, und bricht eine ausstehende Anfrage ab, wenn der OpenClaw-
Versuch abgebrochen wird.

## Verwandte Themen

- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Codex-Harness](/de/plugins/codex-harness)
- [Agent-Harness-Plugins (SDK-Referenz)](/de/plugins/sdk-agent-harness)
