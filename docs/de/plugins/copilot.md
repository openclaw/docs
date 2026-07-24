---
read_when:
    - Sie möchten das GitHub Copilot SDK-Harness für einen Agenten verwenden
    - Sie benötigen Konfigurationsbeispiele für die `copilot`-Runtime
    - Sie verbinden einen Agenten mit einem Copilot-Abonnement (github / openclaw / copilot) und möchten, dass er über die Copilot CLI ausgeführt wird.
summary: OpenClaw-Durchläufe des eingebetteten Agenten über das externe GitHub-Copilot-SDK-Harness ausführen
title: Copilot-SDK-Harness
x-i18n:
    generated_at: "2026-07-24T05:12:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b67959c2c72bda97a81d0b45bc32ba363373064ec40c54f9709705dd15dd9fc
    source_path: plugins/copilot.md
    workflow: 16
---

Das externe Plugin `@openclaw/copilot` führt eingebettete Copilot-
Agentenläufe für Abonnements über die GitHub Copilot CLI (`@github/copilot-sdk`) statt über
OpenClaws integriertes Harness aus. Die Copilot-CLI-Sitzung verwaltet die untergeordnete
Agentenschleife: native Tool-Ausführung, native Compaction (`infiniteSessions`) und
CLI-verwalteten Thread-Status unter `copilotHome`. OpenClaw verwaltet weiterhin Chat-
Kanäle, Sitzungsdateien, Modellauswahl, dynamische Tools (über eine Bridge), Genehmigungen,
Medienzustellung, die sichtbare Transkriptspiegelung, `/btw` Nebenfragen (siehe
[Nebenfragen (`/btw`)](#side-questions-btw)) und `openclaw doctor`.

Informationen zur umfassenderen Aufteilung von Modell, Provider und Laufzeit finden Sie unter
[Agentenlaufzeiten](/de/concepts/agent-runtimes).

## Anforderungen

- OpenClaw mit installiertem Plugin `@openclaw/copilot`.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie `copilot` ein (die vom
  Plugin deklarierte Manifest-ID). Ein Zulassungslisteneintrag für den npm-Paketnamen
  `@openclaw/copilot` stimmt nicht überein und lässt das Plugin blockiert, selbst wenn
  `agentRuntime.id: "copilot"` gesetzt ist.
- Ein GitHub-Copilot-Abonnement, das die Copilot CLI steuern kann, oder eine
  Umgebungsvariable `gitHubToken` bzw. ein Authentifizierungsprofileintrag für Headless- oder Cron-Ausführungen.
- Ein beschreibbares Verzeichnis `copilotHome`. Standardmäßig `<agentDir>/copilot`, wenn
  OpenClaw ein Agentenverzeichnis bereitstellt, andernfalls
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` führt den [Doctor-Vertrag](#doctor) des Plugins für
die Eigentümerschaft des Sitzungsstatus und zukünftige Konfigurationsmigrationen aus. Die
Copilot-CLI-Umgebung wird dabei nicht geprüft.

## Installation

Die Copilot-Laufzeit wird als externes Plugin ausgeliefert, damit das Kernpaket `openclaw`
weder `@github/copilot-sdk` noch dessen plattformspezifische
CLI-Binärdatei `@github/copilot-<platform>-<arch>` enthält (zusammen etwa 260 MB).
Installieren Sie es nur für Agenten, die diese Laufzeit ausdrücklich verwenden:

```bash
openclaw plugins install @openclaw/copilot
```

Der Einrichtungsassistent installiert das Plugin automatisch, wenn Sie erstmals
ein Modell vom Typ `github-copilot/*` auswählen **und** Ihre Konfiguration dieses Modell (oder dessen
Provider) über `agentRuntime: { id: "copilot" }` an die Copilot-Laufzeit weiterleitet; siehe
[Schnellstart](#quickstart). Ohne diese Aktivierung verwendet OpenClaw seinen integrierten
GitHub-Copilot-Provider und installiert dieses Plugin nie.

Die Laufzeit löst das SDK in dieser Reihenfolge auf:

1. `import("@github/copilot-sdk")` aus dem installierten Paket `@openclaw/copilot`.
2. Das Fallback-Verzeichnis `~/.openclaw/npm-runtime/copilot/` (veraltetes Ziel für
   bedarfsgesteuerte Installationen).

Ein fehlendes SDK erzeugt einen einzelnen Fehler mit dem Code `COPILOT_SDK_MISSING` und dem
oben aufgeführten Befehl zur Neuinstallation.

## Schnellstart

Weisen Sie ein Modell (oder einen Provider) fest dem Harness zu:

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

Legen Sie `agentRuntime.id` für einen einzelnen Modelleintrag fest, um nur dieses Modell über
das Harness weiterzuleiten, oder für einen Provider, um jedes Modell dieses Providers weiterzuleiten.

`github-copilot/auto` ist der portable Ausgangspunkt. Benannte Copilot-Modelle hängen
von Konto- und Organisationsrichtlinien ab; vergewissern Sie sich, dass Ihre authentifizierte
Copilot CLI ein Modell tatsächlich bereitstellt, bevor Sie es fest zuweisen.

## Unterstützte Provider

Das Harness unterstützt den kanonischen Provider `github-copilot` (verwaltet von
`extensions/github-copilot`) sowie benutzerdefinierte Einträge vom Typ `models.providers`, wenn das
Modell über einen nicht leeren Wert für `baseUrl` und eine dieser `api`-Formen verfügt:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI-kompatible Vervollständigungen)
- `openai-completions`
- `openai-responses`

Native Provider-IDs (`openai`, `anthropic`, `google`, `ollama`) bleiben Eigentum
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
ID sowie Kontext- und Ausgabelimits; die Provider-Transportlogik verbleibt im SDK und nicht
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

BYOK-Sitzungen erhalten eigene Schlüssel, getrennt von Abonnementsitzungen und anderen
BYOK-Endpunkten oder Anmeldedaten. Beim Rotieren des Schlüssels, der Header, des Modells oder des Endpunkts
wird eine neue Copilot-SDK-Sitzung gestartet, statt inkompatiblen Status fortzusetzen.

## Authentifizierung

Priorität, pro Agent während `runCopilotAttempt` angewendet:

1. **Explizites `useLoggedInUser: true`** in der Versuchseingabe — verwendet den
   angemeldeten Benutzer der Copilot CLI unter `copilotHome` des Agenten.
2. **Explizites `gitHubToken`** in der Versuchseingabe (erfordert `profileId` +
   `profileVersion`). Für direkte CLI-Aufrufe und Tests, die die
   Auflösung von Authentifizierungsprofilen umgehen müssen.
3. **Vertragsaufgelöstes `resolvedApiKey` + `authProfileId`** — der primäre
   Produktionspfad. Der Kern löst das konfigurierte Authentifizierungsprofil `github-copilot`
   (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) des Agenten auf, bevor
   das Harness aufgerufen wird, sodass ein Authentifizierungsprofil `github-copilot:<profile>`
   durchgängig für Headless-, Cron- oder Mehrprofilkonfigurationen ohne Umgebungsvariablen funktioniert.
4. **Umgebungsvariablen-Fallback**, in dieser Reihenfolge geprüft (der erste nicht leere Wert gewinnt,
   leere Zeichenfolgen gelten als nicht vorhanden; entspricht der ausgelieferten Priorität des Providers `github-copilot`
   in `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — Harness-spezifische Überschreibung; ermöglicht es, ein
      Token für das OpenClaw-Harness festzulegen, ohne die systemweite `gh`-/
      Copilot-CLI-Konfiguration zu beeinträchtigen.
   2. `COPILOT_GITHUB_TOKEN` — standardmäßige Umgebungsvariable des Copilot SDK bzw. der CLI.
   3. `GH_TOKEN` — standardmäßige Umgebungsvariable der CLI `gh`.
   4. `GITHUB_TOKEN` — generischer GitHub-Token-Fallback.

   Die synthetisierte Pool-Profil-ID lautet `env:<NAME>`; die Profilversion ist ein
   nicht umkehrbarer sha256-Fingerabdruck des Tokens, sodass eine Rotation des Umgebungswerts
   den Client-Pool zuverlässig invalidiert.

5. **Standardmäßiges `useLoggedInUser`**, wenn kein Token-Signal verfügbar ist.

Jeder Agent erhält ein eigenes `copilotHome`, damit Copilot-CLI-Tokens, Sitzungen und
Konfigurationen nie zwischen Agenten auf demselben Computer übertragen werden. Standard:
`<agentDir>/copilot` (hält den SDK-Status aus demselben Verzeichnis wie
OpenClaws `models.json` / `auth-profiles.json` heraus) oder
`~/.openclaw/agents/<agentId>/copilot`, wenn kein Agentenverzeichnis bereitgestellt wird.
Überschreiben Sie dies mit `copilotHome: <path>` in der Versuchseingabe, um einen benutzerdefinierten
Speicherort zu verwenden (zum Beispiel einen gemeinsam genutzten Einhängepunkt für die Migration).

Live-Harness-Tests verwenden `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` für ein direktes
Token. Die gemeinsam genutzte Einrichtung für Live-Tests entfernt `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
und `GITHUB_TOKEN`, nachdem echte Authentifizierungsprofile in der isolierten Test-
Umgebung bereitgestellt wurden. Dadurch verhindert ein über die dedizierte Variable übergebener Wert `gh auth token`
fälschliche Überspringungen, ohne in nicht zusammenhängende Test-Suites zu gelangen.

## Konfigurationsoberfläche

Das Harness liest die Konfiguration aus der Eingabe jedes Versuchs (`runCopilotAttempt({...})`)
sowie einer kleinen Gruppe von Umgebungsstandardwerten innerhalb von `extensions/copilot/src/`:

| Feld                     | Zweck                                                                                                                                                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | CLI-Statusverzeichnis pro Agent (Standardwerte siehe oben).                                                                                                                                                                                                                                     |
| `model`                  | Zeichenfolge oder `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Weglassen, um die normale Modellauswahl des Agenten zu verwenden; das Harness überprüft, ob der aufgelöste Provider unterstützt wird.                                                                                                 |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Wird aus der Auflösung von OpenClaws `ThinkLevel` / `ReasoningLevel` in `auto-reply/thinking.ts` abgeleitet.                                                                                                                                            |
| `infiniteSessionConfig`  | Optionale Überschreibung für den SDK-Block `infiniteSessions`, der durch `harness.compact` gesteuert wird. Kann unverändert bleiben.                                                                                                                                                             |
| `hooksConfig`            | Optionale native Copilot-SDK-Konfiguration `SessionHooks` für Tool-/MCP-, Benutzeraufforderungs-, Sitzungs- und Fehler-Callbacks. Getrennt von den portablen Lebenszyklus-Hooks von OpenClaw.                                                                                                  |
| `permissionPolicy`       | Optionale Überschreibung des SDK-Handlers `onPermissionRequest` für integrierte SDK-Tooltypen (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Standardmäßig `rejectAllPolicy` als Sicherheitsnetz; unter [Berechtigungen und ask_user](#permissions-and-ask_user) wird erläutert, warum er tatsächlich nie ausgelöst wird. |
| `enableSessionTelemetry` | Optionales Telemetrie-Flag für SDK-Sitzungen.                                                                                                                                                                                                                                                   |

OpenClaw-Plugin-Hooks benötigen keine Copilot-spezifische Versuchskonfiguration. Das
Harness führt `before_prompt_build`, `llm_input`, `llm_output` und `agent_end` über die
standardmäßigen Harness-Hilfsfunktionen aus. Erfolgreiche SDK-Compactions führen außerdem
`before_compaction` und `after_compaction` aus. Über eine Bridge angebundene OpenClaw-Tools führen
`before_tool_call` aus und melden `after_tool_call`; `hooksConfig` bleibt für
rein SDK-native Callbacks ohne portables Äquivalent vorgesehen.

Keine andere Komponente in OpenClaw muss diese Felder kennen. Andere Plugins,
Kanäle und Kernkomponenten sehen nur die Standardform `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Wenn `harness.compact` ausgeführt wird, führt das Copilot-SDK-Harness Folgendes aus:

1. Es setzt die verfolgte SDK-Sitzung fort, ohne ausstehende Arbeit fortzuführen.
2. Es ruft den sitzungsbezogenen RPC des SDK zur Verlaufskomprimierung auf.
3. Es gibt das Ergebnis der SDK-Compaction zurück, ohne Kompatibilitätsmarkierungsdateien
   im Arbeitsbereich zu schreiben.

Die OpenClaw-seitige Transkriptspiegelung (unten) empfängt weiterhin Nachrichten nach der Compaction,
sodass der für Benutzer sichtbare Chatverlauf konsistent bleibt.

## Transkriptspiegelung

`runCopilotAttempt` schreibt die spiegelbaren Nachrichten jeder Runde parallel in das
OpenClaw-Audit-Transkript über
`extensions/copilot/src/dual-write-transcripts.ts`. Der Spiegel ist auf die jeweilige
Sitzung (`copilot:${sessionId}`) begrenzt und wird nach Nachricht
(`${role}:${sha256_16(role,content)}`) verschlüsselt, sodass erneut ausgegebene Einträge
vorheriger Runden mit vorhandenen Schlüsseln auf dem Datenträger kollidieren, anstatt dupliziert zu werden.

Zwei Ebenen der Fehlerbegrenzung umschließen den Spiegel, sodass ein Fehler beim
Schreiben des Transkripts niemals den Versuch fehlschlagen lässt: ein interner Best-Effort-Wrapper sowie eine
gestaffelte `.catch(...)` auf Versuchsebene. Fehler werden protokolliert, nicht
nach außen weitergegeben.

## Nebenfragen (`/btw`)

`/btw` ist in diesem Harness **nicht** nativ. `createCopilotAgentHarness()`
lässt `harness.runSideQuestion` bewusst undefiniert
(bestätigt in `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
sodass der `/btw`-Dispatcher von OpenClaw (`src/agents/btw.ts`) auf denselben
Pfad zurückfällt, den er für jede Nicht-Codex-Runtime verwendet: Der konfigurierte Modell-Provider
wird direkt mit einem kurzen Nebenfragen-Prompt aufgerufen und über
`streamSimple` zurückgestreamt (keine CLI-Sitzung, kein zusätzlicher Pool-Slot).

Dadurch bleiben Copilot-CLI-Sitzungen für die Hauptrundenschleife des Agenten reserviert,
und das Verhalten von `/btw` bleibt mit anderen Nicht-Codex-Runtimes identisch.

## Doctor

`extensions/copilot/doctor-contract-api.ts` wird automatisch von
`src/plugins/doctor-contract-registry.ts` geladen. Es trägt Folgendes bei:

- Ein leeres `legacyConfigRules` (noch keine eingestellten Felder).
- Ein wirkungsloses `normalizeCompatibilityConfig` (beibehalten, damit künftige Feldeinstellungen
  einen stabilen Ort im Quellbaum haben).
- Ein `sessionRouteStateOwners`-Eintrag: Provider `github-copilot`, Runtime
  `copilot`, CLI-Sitzungsschlüssel `copilot`, Auth-Profilpräfix `github-copilot:`.

## Einschränkungen

- Der Harness beansprucht `github-copilot` sowie benutzerdefinierte BYOK-Provider-IDs ohne Besitzer.
  Manifest-eigene native Provider-IDs verbleiben bei ihrer zuständigen Runtime, selbst wenn
  `agentRuntime.id` auf `copilot` erzwungen wird.
- Keine TUI-Oberfläche; die TUI von PI bleibt der Fallback für Runtimes ohne
  Peer-Oberfläche.
- Der PI-Sitzungsstatus wird nicht migriert, wenn ein Agent zu `copilot` wechselt.
  Die Auswahl erfolgt pro Versuch; vorhandene PI-Sitzungen bleiben gültig.
- `ask_user` verwendet die Provider-neutrale Gateway-Fragen-Runtime. Die Control
  UI zeigt dieselbe Fragenkarte wie bei anderen OpenClaw-Fragen, unterstützte
  Kanäle stellen Auswahlschaltflächen dar, und die nächste eingereihte Klartextnachricht
  löst diesen Gateway-Datensatz auf, bevor die SDK-Anfrage zurückkehrt.

## Berechtigungen und ask_user

Die Durchsetzung von Berechtigungen für überbrückte OpenClaw-Tools erfolgt **innerhalb des Tool-
Wrappers**, nicht über den `onPermissionRequest`-Callback des SDK. Dieselbe
`wrapToolWithBeforeToolCallHook`, die PI verwendet
(`src/agents/agent-tools.before-tool-call.ts`), wird von
`createOpenClawCodingTools` auf jedes Coding-Tool angewendet: Schleifenerkennung, Richtlinien für
vertrauenswürdige Plugins, Hooks vor Tool-Aufrufen und zweiphasige Plugin-Genehmigungen über
das Gateway (`plugin.approval.request`) durchlaufen exakt denselben Codepfad
wie native PI-Versuche.

Jedes vom Copilot-Tool-Bridge zurückgegebene SDK-Tool ist wie folgt gekennzeichnet:

- `overridesBuiltInTool: true` — ersetzt das integrierte Tool der Copilot CLI mit
  demselben Namen (edit, read, write, bash, ...), sodass jeder Tool-Aufruf zurück
  zu OpenClaw geleitet wird.
- `skipPermission: true` — weist das SDK an,
  `onPermissionRequest({kind: "custom-tool"})` vor dem Aufruf des Tools nicht auszulösen. Die
  umschlossene `execute()` führt bereits die umfassendere OpenClaw-Richtlinienprüfung durch; eine
  Aufforderung auf SDK-Ebene würde die Durchsetzung durch OpenClaw entweder umgehen
  (alles zulassen) oder jeden Tool-Aufruf blockieren (alles ablehnen) — beides entspricht nicht
  der PI-Parität.

Der im Quellbaum enthaltene Codex-Harness verwendet dieselbe Trennung: Überbrückte OpenClaw-Tools werden
umschlossen (`extensions/codex/src/app-server/dynamic-tools.ts`), und die
eigenen nativen Genehmigungsarten des codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) werden über `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) geleitet. Das Äquivalent im Copilot SDK
— die Fail-Closed-`rejectAllPolicy` für jede Nicht-`custom-tool`-Art,
die jemals `onPermissionRequest` erreicht — ist dasselbe Sicherheitsnetz und wird
in der Praxis nie ausgelöst, da `overridesBuiltInTool: true` jedes
integrierte Tool verdrängt.

Damit die Ebene der umschlossenen Tools Richtlinienentscheidungen treffen kann, die PI entsprechen,
leitet der Harness den vollständigen PI-Kontext für Versuchstools an
`createOpenClawCodingTools` weiter: Identität (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), Kanal/Routing (`groupId`,
`currentChannelId`, `replyToMode`, Umschalter für Nachrichtentools), Authentifizierung
(`authProfileStore`), Ausführungsidentität (`sessionKey` / `runSessionKey`, abgeleitet
von `sandboxSessionKey`, `runId`), Modellkontext (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) und Ausführungs-Hooks
(`onToolOutcome`, `onYield`). Ohne diese Felder verweigern nur für Besitzer vorgesehene Zulassungslisten
standardmäßig stillschweigend, Plugin-Vertrauensrichtlinien können nicht dem richtigen
Gültigkeitsbereich zugeordnet werden, und `session_status: "current"` wird zu einem veralteten Sandbox-Schlüssel aufgelöst. Der
Bridge-Builder ist `extensions/copilot/src/tool-bridge.ts` und spiegelt den maßgeblichen PI-
Aufruf unter `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` löst den Sandbox-Kontext über die gemeinsame
`resolveSandboxContext`-Nahtstelle auf, übergibt dem SDK ein effektives Arbeitsverzeichnis
und leitet `sandbox` sowie den Arbeitsbereich für die Subagent-Erstellung an die Tool-
Bridge weiter. Die Bridge leitet außerdem die begrenzten Steuerelemente für die Tool-Erstellung weiter, die sie
an der SDK-Grenze durchsetzen kann: `includeCoreTools`, die Runtime-Tool-
Zulassungsliste und `toolConstructionPlan`.

Die Bridge verwendet außerdem den gemeinsamen Harness-Helfer für die Tool-Oberfläche aus
`openclaw/plugin-sdk/agent-harness-tool-runtime`, um PI-Parität zu gewährleisten. Wenn
die Tool-Suche aktiviert ist, sieht das SDK kompakte Steuerungstools sowie einen verborgenen
Katalog-Executor anstelle jedes OpenClaw-Tool-Schemas. Wenn der Codemodus
aktiviert ist, erstellt der Helfer dieselbe Codemodus-Steuerungsoberfläche und denselben Kataloglebenszyklus,
die von anderen Agent-Harnesses verwendet werden. Schlanke Standardeinstellungen für lokale Modelle,
Runtime-kompatible Schemafilterung, Verzeichnishydrierung und Katalog-
bereinigung verbleiben vollständig im gemeinsamen Helfer, damit Copilot- und Codex-nahe
Harnesses nicht auseinanderdriften.

### GitHub-Token auf Sitzungsebene

Der Copilot-SDK-Vertrag unterscheidet das GitHub-Token auf **Clientebene**
(`CopilotClientOptions.gitHubToken`, authentifiziert den CLI-Prozess selbst)
vom Token auf **Sitzungsebene** (`SessionConfig.gitHubToken`, bestimmt
Inhaltsausschluss, Modell-Routing und Kontingent für diese Sitzung; wird sowohl bei
`createSession` als auch `resumeSession` berücksichtigt). Der Harness löst die Authentifizierung einmal über
`resolveCopilotAuth` auf und setzt beide Felder, wenn der Authentifizierungsmodus `gitHubToken`
ist (ein explizites `auth.gitHubToken` oder ein vertragsgemäß aufgelöstes `resolvedApiKey` aus
einem konfigurierten `github-copilot`-Authentifizierungsprofil). Wenn der aufgelöste Modus
`useLoggedInUser` ist, wird das Feld auf Sitzungsebene weggelassen, sodass das SDK die
Identität weiterhin aus der angemeldeten Identität ableitet.

`ask_user` verwendet `SessionConfig.onUserInputRequest`. Die Bridge registriert SDK-
Auswahlmöglichkeiten oder Freitextaufforderungen ohne Optionen als Gateway-Fragen, akzeptiert Auswahl-
indizes oder Beschriftungen für Anfragen mit fester Auswahl und akzeptiert Freitextantworten,
wenn die SDK-Anfrage diese zulässt. Wird der OpenClaw-Versuch abgebrochen, wird der
Gateway-Datensatz verworfen und eine leere SDK-Antwort zurückgegeben.

## Verwandte Themen

- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Codex-Harness](/de/plugins/codex-harness)
- [Agent-Harness-Plugins (SDK-Referenz)](/de/plugins/sdk-agent-harness)
