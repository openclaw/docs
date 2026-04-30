---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben api.registerEmbeddedExtensionFactory vor OpenClaw 2026.4.25 verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Migrieren Sie von der bisherigen Abwärtskompatibilitätsschicht zum modernen Plugin-SDK
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-04-30T07:07:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw wurde von einer breiten Abwärtskompatibilitätsschicht auf eine moderne Plugin-
Architektur mit fokussierten, dokumentierten Importen umgestellt. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles, was sie benötigten, aus einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Helfern erneut exportierte. Er wurde eingeführt, damit ältere Hook-basierte
  Plugins weiter funktionieren, während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/plugin-sdk/infra-runtime`** — ein breites Barrel für Laufzeithelfer, das
  Systemereignisse, Heartbeat-Status, Zustellwarteschlangen, Fetch-/Proxy-Helfer,
  Dateihelfer, Genehmigungstypen und nicht verwandte Hilfsprogramme vermischte.
- **`openclaw/plugin-sdk/config-runtime`** — ein breites Barrel für Konfigurationskompatibilität,
  das während des Migrationsfensters weiterhin veraltete direkte Lade-/Schreibhelfer enthält.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Helfer wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** — ein entfernter, nur für Pi bestimmter
  Hook für gebündelte Erweiterungen, der Ereignisse des eingebetteten Runners wie
  `tool_result` beobachten konnte.

Die breiten Importoberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit
noch, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten
migrieren, bevor sie mit dem nächsten Major Release entfernt werden. Die nur für Pi
bestimmte API zur Registrierung eingebetteter Erweiterungs-Factorys wurde entfernt;
verwenden Sie stattdessen Tool-Result-Middleware.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, die einen Ersatz einführt. Brechende Vertragsänderungen müssen zuerst
einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Abkündigungsfenster
durchlaufen. Das gilt für SDK-Importe, Manifestfelder, Setup-APIs, Hooks und das
Registrierungsverhalten zur Laufzeit.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einem zukünftigen Major Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
  Nur für Pi bestimmte Registrierungen eingebetteter Erweiterungs-Factorys werden bereits nicht mehr geladen.
</Warning>

## Warum diese Änderung vorgenommen wurde

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — das Importieren eines Helfers lud Dutzende nicht verwandter Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil oder intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, eigenständiges Modul mit einem klaren Zweck und einem dokumentierten Vertrag.

Legacy-Komfort-Seams für Provider gebündelter Channels sind ebenfalls entfernt.
Channel-gebrandete Helfer-Seams waren private Mono-Repo-Abkürzungen, keine stabilen
Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Halten Sie
innerhalb des gebündelten Plugin-Arbeitsbereichs Provider-eigene Helfer im eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins.

Aktuelle Beispiele gebündelter Provider:

- Anthropic hält Claude-spezifische Stream-Helfer in seiner eigenen `api.ts`- /
  `contract-api.ts`-Seam
- OpenAI hält Provider-Builder, Standardmodell-Helfer und Realtime-Provider-
  Builder in seiner eigenen `api.ts`
- OpenRouter hält Provider-Builder und Onboarding-/Konfigurationshelfer in seiner
  eigenen `api.ts`

## Kompatibilitätsrichtlinie

Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

1. den neuen Vertrag hinzufügen
2. das alte Verhalten über einen Kompatibilitätsadapter verdrahtet lassen
3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
4. beide Pfade in Tests abdecken
5. die Abkündigung und den Migrationspfad dokumentieren
6. erst nach dem angekündigten Migrationsfenster entfernen, üblicherweise in einem Major Release

Maintainer können die aktuelle Migrationswarteschlange mit
`pnpm plugins:boundary-report` prüfen. Verwenden Sie `pnpm plugins:boundary-report:summary` für
kompakte Zählwerte, `--owner <id>` für ein Plugin oder einen Kompatibilitätseigentümer und
`pnpm plugins:boundary-report:ci`, wenn ein CI-Gate bei fälligen
Kompatibilitätseinträgen, reservierten SDK-Importen über Eigentümergrenzen hinweg oder ungenutzten reservierten SDK-
Unterpfaden fehlschlagen soll. Der Bericht gruppiert veraltete
Kompatibilitätseinträge nach Entfernungsdatum, zählt lokale Code-/Dokumentationsverweise,
zeigt reservierte SDK-Importe über Eigentümergrenzen hinweg an und fasst die private
memory-host-SDK-Brücke zusammen, damit Kompatibilitätsbereinigung explizit bleibt, statt
sich auf Ad-hoc-Suchen zu verlassen. Reservierte SDK-Unterpfade müssen nachverfolgte
Eigentümerverwendung haben; ungenutzte reservierte Helferexporte sollten aus dem öffentlichen SDK entfernt werden.

Wenn ein Manifestfeld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden,
bis Dokumentation und Diagnosen etwas anderes angeben. Neuer Code sollte den dokumentierten
Ersatz bevorzugen, aber bestehende Plugins sollten bei normalen Minor Releases nicht brechen.

## So migrieren Sie

<Steps>
  <Step title="Laufzeithelfer zum Laden/Schreiben der Konfiguration migrieren">
    Gebündelte Plugins sollten
    `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` nicht mehr direkt aufrufen. Bevorzugen Sie Konfiguration,
    die bereits an den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten innerhalb von `execute` `ctx.getRuntimeConfig()` aus dem Tool-Kontext verwenden,
    damit ein Tool, das vor einem Konfigurationsschreibvorgang erstellt wurde, weiterhin die aktualisierte
    Laufzeitkonfiguration sieht.

    Konfigurationsschreibvorgänge müssen über die transaktionalen Helfer laufen und eine
    Nach-Schreib-Richtlinie wählen:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Verwenden Sie `afterWrite: { mode: "restart", reason: "..." }`, wenn der Aufrufer weiß,
    dass die Änderung einen sauberen Gateway-Neustart erfordert, und
    `afterWrite: { mode: "none", reason: "..." }` nur, wenn der Aufrufer die
    Folgemaßnahme besitzt und den Reload-Planer bewusst unterdrücken möchte.
    Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für Tests und Logging;
    das Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder einzuplanen.
    `loadConfig` und `writeConfigFile` bleiben während des Migrationsfensters als veraltete
    Kompatibilitätshelfer für externe Plugins erhalten und warnen einmal mit dem
    Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und Laufzeitcode des Repos
    werden durch Scanner-Leitplanken in
    `pnpm check:deprecated-internal-config-api` und
    `pnpm check:no-runtime-action-load-config` geschützt: Neue Produktions-Plugin-Nutzung
    schlägt direkt fehl, direkte Konfigurationsschreibvorgänge schlagen fehl, Gateway-Servermethoden müssen
    den Laufzeit-Snapshot der Anfrage verwenden, Helfer für Laufzeit-Channel-Send/Action/Client
    müssen Konfiguration von ihrer Grenze erhalten, und langlebige Laufzeitmodule haben
    null erlaubte umgebende `loadConfig()`-Aufrufe.

    Neuer Plugin-Code sollte außerdem vermeiden, das breite Kompatibilitäts-Barrel
    `openclaw/plugin-sdk/config-runtime` zu importieren. Verwenden Sie den schmalen
    SDK-Unterpfad, der zur Aufgabe passt:

    | Bedarf | Import |
    | --- | --- |
    | Konfigurationstypen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Assertions für bereits geladene Konfiguration und Konfigurationssuche für Plugin-Einstiege | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lesen aktueller Laufzeit-Snapshots | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Konfigurationsschreibvorgänge | `openclaw/plugin-sdk/config-mutation` |
    | Helfer für Session-Speicher | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellenkonfiguration | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Laufzeithelfer für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Auflösung geheimer Eingaben | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Session-Overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests werden durch Scanner gegen das breite
    Barrel geschützt, damit Importe und Mocks lokal bei dem Verhalten bleiben, das sie benötigen. Das breite
    Barrel existiert weiterhin für externe Kompatibilität, aber neuer Code sollte nicht
    davon abhängen.

  </Step>

  <Step title="Pi-Tool-Result-Erweiterungen zu Middleware migrieren">
    Gebündelte Plugins müssen nur für Pi bestimmte
    `api.registerEmbeddedExtensionFactory(...)`-Tool-Result-Handler durch
    laufzeitneutrale Middleware ersetzen.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aktualisieren Sie gleichzeitig das Plugin-Manifest:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Externe Plugins können keine Tool-Result-Middleware registrieren, weil sie
    hochvertrauenswürdige Tool-Ausgabe umschreiben kann, bevor das Modell sie sieht.

  </Step>

  <Step title="Genehmigungsnative Handler zu Capability-Fakten migrieren">
    Genehmigungsfähige Channel-Plugins stellen natives Genehmigungsverhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Laufzeitkontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie genehmigungsspezifische Authentifizierung/Zustellung von der Legacy-Verdrahtung
      `plugin.auth` / `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschieben Sie delivery/native/render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Flows erhalten; Genehmigungs-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie Channel-eigene Laufzeitobjekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine Plugin-eigenen Umleitungsmitteilungen aus nativen Genehmigungs-Handlern;
      der Core besitzt jetzt anderweitig geroutete Mitteilungen aus tatsächlichen Zustellergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Genehmigungs-Capability.

  </Step>

  <Step title="Fallback-Verhalten von Windows-Wrappern prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`-/`.bat`-Wrapper jetzt geschlossen fehl, sofern Sie nicht explizit
    `allowShellFallback: true` übergeben.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Importe finden">
    Durchsuchen Sie Ihr Plugin nach Importen aus einer der veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Importe ersetzen">
    Jeder Export aus der alten Oberfläche wird einem bestimmten modernen Importpfad zugeordnet:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Verwenden Sie für hostseitige Helfer die injizierte Plugin-Laufzeit, statt
    direkt zu importieren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Bridge-Hilfsfunktionen:

    | Alter Import | Moderne Entsprechung |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Session-Store-Hilfsfunktionen | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Breite infra-runtime-Importe ersetzen">
    `openclaw/plugin-sdk/infra-runtime` existiert weiterhin für externe
    Kompatibilität, aber neuer Code sollte die fokussierte Hilfsoberfläche importieren,
    die er tatsächlich benötigt:

    | Bedarf | Import |
    | --- | --- |
    | Hilfsfunktionen für die Systemereignis-Warteschlange | `openclaw/plugin-sdk/system-event-runtime` |
    | Hilfsfunktionen für Heartbeat-Ereignisse und Sichtbarkeit | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leeren der Warteschlange für ausstehende Zustellungen | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie zur Kanalaktivität | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-Memory-Dedupe-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Sichere Hilfsfunktionen für lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewusstes Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- und geschützte Fetch-Hilfsfunktionen | `openclaw/plugin-sdk/fetch-runtime` |
    | Typen für SSRF-Dispatcher-Richtlinien | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Genehmigungsanfragen und -auflösungen | `openclaw/plugin-sdk/approval-runtime` |
    | Hilfsfunktionen für Genehmigungsantwort-Payload und -Befehle | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hilfsfunktionen zur Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Wartefunktionen für Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Hilfsfunktionen für sichere Token | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit für asynchrone Tasks | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerische Umwandlung | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokaler asynchroner Lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dateisperren | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins sind durch Scanner gegen `infra-runtime` geschützt, sodass Repo-Code
    nicht zum breiten Barrel zurückfallen kann.

  </Step>

  <Step title="Hilfsfunktionen für Kanalrouten migrieren">
    Neuer Kanalrouten-Code sollte `openclaw/plugin-sdk/channel-route` verwenden.
    Die älteren Route-Key- und Comparable-Target-Namen bleiben während des
    Migrationsfensters als Kompatibilitätsaliasse erhalten, aber neue Plugins sollten die Routennamen verwenden,
    die das Verhalten direkt beschreiben:

    | Alte Hilfsfunktion | Moderne Hilfsfunktion |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Die modernen Routen-Hilfsfunktionen normalisieren `{ channel, to, accountId, threadId }`
    konsistent über native Genehmigungen, Antwortunterdrückung, eingehende Deduplizierung,
    Cron-Zustellung und Sitzungsrouting hinweg. Wenn Ihr Plugin eine eigene Zielgrammatik
    besitzt, verwenden Sie `resolveChannelRouteTargetWithParser(...)`, um diesen
    Parser an denselben Routenziel-Vertrag anzupassen.

  </Step>

  <Step title="Erstellen und testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz für Importpfade

  <Accordion title="Common import path table">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Einstiegshilfe für Plugins | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter Sammel-Re-Export für Channel-Eintragsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Einstiegshilfe für einzelne Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Channel-Eintragsdefinitionen und Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Einrichtungsassistenten | Allowlist-Eingabeaufforderungen, Builder für den Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Laufzeit-Hilfsfunktionen für die Einrichtung | Importsichere Adapter für Einrichtungs-Patches, Hilfsfunktionen für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungs-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Einrichtungsadapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Einrichtungswerkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten, Konfiguration und Aktions-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche | Hilfsfunktionen für Kontosuche und Standard-Fallbacks |
  | `plugin-sdk/account-helpers` | Schmale Konto-Hilfsfunktionen | Hilfsfunktionen für Kontolisten und Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Kopplung | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwortpräfix, Tippen und Quellenzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter und Hilfsfunktionen für DM-Zugriff | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Gemeinsame Primitive für Channel-Konfigurationsschemata und nur der generische Builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebündelte Konfigurationsschemata | Nur von OpenClaw gepflegte gebündelte Plugins; neue Plugins müssen Plugin-lokale Schemas definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebündelte Konfigurationsschemata | Nur Kompatibilitätsalias; verwenden Sie `plugin-sdk/bundled-channel-config-schema` für gepflegte gebündelte Plugins |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hilfsfunktionen für Kontostatus und Lebenszyklus von Entwurfsstreams | `createAccountStatusSink`, Hilfsfunktionen zur Finalisierung der Entwurfsvorschau |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Umschläge | Gemeinsame Hilfsfunktionen für Route und Umschlag-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen zum Aufzeichnen und Weiterleiten |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Hilfsfunktionen für ausgehende Sendeabhängigkeiten | Leichtgewichtiger `resolveOutboundSendDep`-Lookup ohne Import der vollständigen ausgehenden Laufzeit |
  | `plugin-sdk/outbound-runtime` | Hilfsfunktionen für die ausgehende Laufzeit | Hilfsfunktionen für ausgehende Zustellung, Identitäts-/Sende-Delegates, Sitzung, Formatierung und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindung | Hilfsfunktionen für Lebenszyklus und Adapter der Thread-Bindung |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen für Medien-Payloads | Builder für Agent-Medien-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Channel-Laufzeitdienstprogramme |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Laufzeit, Protokollierung, Sicherung und Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für Laufzeitumgebungen | Logger-/Laufzeitumgebung, Timeout-, Wiederholungs- und Backoff-Hilfsfunktionen |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Plugin-Befehle, Hooks, HTTP und Interaktivität |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Lazy-Laufzeit-Hilfsfunktionen | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Hilfsfunktionen | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Befehlsformatierung, Wartezeiten und Versionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Gateway-Client, Start-Hilfsfunktion für Event-Loop-Bereitschaft und Hilfsfunktionen für Channel-Status-Patches |
  | `plugin-sdk/config-runtime` | Veralteter Kompatibilitäts-Shim für Konfiguration | Bevorzugen Sie `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Validierung von Telegram-Befehlen, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Genehmigungsabfragen | Exec-/Plugin-Genehmigungs-Payload, Hilfsfunktionen für Genehmigungsfähigkeit/-profil, Routing-/Laufzeit-Hilfsfunktionen für native Genehmigungen und Formatierung strukturierter Genehmigungsanzeigepfade |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigungsautorisierung | Auflösung von Genehmigenden, Autorisierung von Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Genehmigungsclients | Hilfsfunktionen für Profil/Filter nativer Exec-Genehmigungen |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Genehmigungszustellung | Adapter für Fähigkeit/Zustellung nativer Genehmigungen |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen für Genehmigungs-Gateway | Gemeinsame Hilfsfunktion zur Auflösung des Genehmigungs-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Genehmigungsadapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für heiße Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Genehmigungshandler | Breitere Laufzeit-Hilfsfunktionen für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Genehmigungsziele | Hilfsfunktionen für native Genehmigungsziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Genehmigungsantworten | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für Channel-Laufzeitkontext | Generische Hilfsfunktionen zum Registrieren/Abrufen/Beobachten von Channel-Laufzeitkontext |
  | `plugin-sdk/security-runtime` | Sicherheits-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Geheimnissammlung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | Hilfsfunktionen für SSRF-Laufzeit | Pinned-Dispatcher, geschützter Fetch, Hilfsfunktionen für SSRF-Richtlinien |
  | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereignisse | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Hilfsfunktionen | Hilfsfunktionen für Heartbeat-Ereignis und Sichtbarkeit |
  | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktionen für Zustellungswarteschlangen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hilfsfunktionen für Channel-Aktivität | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Deduplizierungs-Hilfsfunktionen | In-Memory-Deduplizierungs-Caches |
  | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für Dateizugriff | Hilfsfunktionen für sichere lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Hilfsfunktionen für Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umschlossenen Fetch/Proxy | `resolveFetch`, Proxy-Hilfsfunktionen, Hilfsfunktionen für EnvHttpProxyAgent-Optionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Wiederholungs-Hilfsfunktionen | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hilfsfunktionen für Befehls-Gating und Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Senderautorisierung, Hilfsfunktionen für Befehlsregistries einschließlich Formatierung dynamischer Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing geheimer Eingaben | Hilfsfunktionen für geheime Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Webhook-Zieldienstprogramme |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Webhook-Body-Guards | Hilfsfunktionen zum Lesen/Begrenzen von Anfragebodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwortlaufzeit | Eingehende Weiterleitung, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwortweiterleitung | Finalisieren, Provider-Weiterleitung und Hilfsfunktionen für Konversationslabels |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicher | Hilfsfunktionen für Speicherpfad und Aktualisiert-am |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für Zustandspfade | Hilfsfunktionen für Zustands- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen für Sitzungsschlüssel-Normalisierung |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Channel-Status | Builder für Channel-/Kontostatuszusammenfassungen, Standardwerte für Laufzeitstatus, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Zielauflöser | Gemeinsame Hilfsfunktionen für Zielauflöser |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Anfrage-URLs | String-URLs aus anfrageähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Gemeinsame Parameterleser für Tools/CLI |
  | `plugin-sdk/tool-payload` | Tool-Payload-Extraktion | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Tool-Sendeextraktion | Kanonische Sendeziel-Felder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen fuer temporaere Pfade | Gemeinsame Hilfsfunktionen fuer temporaere Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Subsystem-Logger und Hilfsfunktionen zur Redaktion |
  | `plugin-sdk/markdown-table-runtime` | Markdown-Tabellen-Hilfsfunktionen | Hilfsfunktionen fuer den Markdown-Tabellenmodus |
  | `plugin-sdk/reply-payload` | Typen fuer Nachrichtenantworten | Antwort-Payload-Typen |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen fuer lokale/selbst gehostete Provider-Einrichtung | Hilfsfunktionen fuer Erkennung/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen fuer OpenAI-kompatible selbst gehostete Provider-Einrichtung | Dieselben Hilfsfunktionen fuer Erkennung/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen fuer Provider-Laufzeit-Authentifizierung | Hilfsfunktionen zur Laufzeitaufloesung von API-Schluesseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen fuer Provider-API-Schluessel-Einrichtung | Hilfsfunktionen fuer API-Schluessel-Onboarding und Profilschreibvorgaenge |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen fuer Provider-Authentifizierungsergebnisse | Standard-Builder fuer OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen fuer interaktive Provider-Anmeldung | Gemeinsame Hilfsfunktionen fuer interaktive Anmeldung |
  | `plugin-sdk/provider-selection-runtime` | Hilfsfunktionen fuer Provider-Auswahl | Konfigurierte oder automatische Provider-Auswahl und Zusammenfuehrung roher Provider-Konfigurationen |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen fuer Provider-Umgebungsvariablen | Hilfsfunktionen zum Nachschlagen von Provider-Authentifizierungsumgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen fuer Provider-Modelle/Replays | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder fuer Replay-Richtlinien, Provider-Endpunkt-Hilfsfunktionen und Hilfsfunktionen zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen fuer Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-Onboarding-Patches | Hilfsfunktionen fuer Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Provider-HTTP-Hilfsfunktionen | Generische Hilfsfunktionen fuer Provider-HTTP/Endpunkt-Capabilities, einschliesslich Hilfsfunktionen fuer Multipart-Formulare zur Audiotranskription |
  | `plugin-sdk/provider-web-fetch` | Provider-Web-Fetch-Hilfsfunktionen | Hilfsfunktionen fuer Web-Fetch-Provider-Registrierung/Cache |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen fuer Provider-Websuche-Konfiguration | Schmale Websuche-Konfigurations-/Anmeldeinformations-Hilfsfunktionen fuer Provider, die keine Plugin-Aktivierungsverdrahtung benoetigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen fuer Provider-Websuche-Contract | Schmale Contract-Hilfsfunktionen fuer Websuche-Konfiguration/Anmeldeinformationen wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter fuer Anmeldeinformationen |
  | `plugin-sdk/provider-web-search` | Provider-Websuche-Hilfsfunktionen | Hilfsfunktionen fuer Websuche-Provider-Registrierung/Cache/Laufzeit |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen fuer Provider-Tool-/Schema-Kompatibilitaet | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnosen und xAI-Kompatibilitaets-Hilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen fuer Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfsfunktionen fuer Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen fuer Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfsfunktionen fuer Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen fuer Provider-Transport | Native Provider-Transport-Hilfsfunktionen wie geschuetzter Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Ereignisstreams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Warteschlange | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medien-Hilfsfunktionen | Hilfsfunktionen fuer Medienabruf/-transformation/-speicherung, ffprobe-gestuetzte Ermittlung von Videodimensionen und Builder fuer Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen fuer Mediengenerierung | Gemeinsame Failover-Hilfsfunktionen, Kandidatenauswahl und Meldungen bei fehlenden Modellen fuer Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen fuer Medienverstehen | Provider-Typen fuer Medienverstehen sowie Provider-seitige Bild-/Audio-Hilfsexporte |
  | `plugin-sdk/text-runtime` | Gemeinsame Text-Hilfsfunktionen | Entfernen von assistentensichtbarem Text, Markdown-Render-/Chunking-/Tabellen-Hilfsfunktionen, Hilfsfunktionen zur Redaktion, Directive-Tag-Hilfsfunktionen, Safe-Text-Dienstprogramme und verwandte Text-/Logging-Hilfsfunktionen |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen fuer Text-Chunking | Hilfsfunktion fuer ausgehendes Text-Chunking |
  | `plugin-sdk/speech` | Sprach-Hilfsfunktionen | Speech-Provider-Typen sowie Provider-seitige Hilfsfunktionen fuer Direktiven, Registry und Validierung und OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Kern | Speech-Provider-Typen, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen fuer Echtzeittranskription | Provider-Typen, Registry-Hilfsfunktionen und gemeinsamer WebSocket-Sitzungshelfer |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen fuer Echtzeitstimme | Provider-Typen, Registry-/Aufloesungs-Hilfsfunktionen und Bridge-Sitzungshelfer |
  | `plugin-sdk/image-generation` | Hilfsfunktionen fuer Bildgenerierung | Bildgenerierungs-Provider-Typen sowie Hilfsfunktionen fuer Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Kern fuer Bildgenerierung | Bildgenerierungstypen, Failover, Authentifizierung und Registry-Hilfsfunktionen |
  | `plugin-sdk/music-generation` | Hilfsfunktionen fuer Musikgenerierung | Provider-/Anfrage-/Ergebnistypen fuer Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Kern fuer Musikgenerierung | Musikgenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/video-generation` | Hilfsfunktionen fuer Videogenerierung | Provider-/Anfrage-/Ergebnistypen fuer Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Kern fuer Videogenerierung | Videogenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen fuer interaktive Antworten | Normalisierung/Reduktion von Payloads interaktiver Antworten |
  | `plugin-sdk/channel-config-primitives` | Primitive fuer Kanal-Konfiguration | Schmale Primitive fuer Kanal-Konfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen fuer Schreibvorgaenge in Kanal-Konfiguration | Autorisierungs-Hilfsfunktionen fuer Schreibvorgaenge in Kanal-Konfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Praeludium | Gemeinsame Kanal-Plugin-Praeludium-Exporte |
  | `plugin-sdk/channel-status` | Kanalstatus-Hilfsfunktionen | Gemeinsame Hilfsfunktionen fuer Kanalstatus-Snapshots/-Zusammenfassungen |
  | `plugin-sdk/allowlist-config-edit` | Allowlist-Konfigurations-Hilfsfunktionen | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen fuer Gruppenzugriff | Gemeinsame Entscheidungs-Hilfsfunktionen fuer Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Direct-DM-Hilfsfunktionen | Gemeinsame Authentifizierungs-/Schutz-Hilfsfunktionen fuer Direct-DM |
  | `plugin-sdk/extension-shared` | Gemeinsame Extension-Hilfsfunktionen | Primitive fuer passive Kanaele/Status und Ambient-Proxy-Hilfsfunktionen |
  | `plugin-sdk/webhook-targets` | Webhook-Ziel-Hilfsfunktionen | Webhook-Ziel-Registry und Hilfsfunktionen fuer Routeninstallation |
  | `plugin-sdk/webhook-path` | Webhook-Pfad-Hilfsfunktionen | Hilfsfunktionen zur Webhook-Pfadnormalisierung |
  | `plugin-sdk/web-media` | Gemeinsame Webmedien-Hilfsfunktionen | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` fuer Konsumenten des Plugin SDK |
  | `plugin-sdk/memory-core` | Gebuendelte memory-core-Hilfsfunktionen | Hilfsoberflaeche fuer Memory-Manager/-Konfiguration/-Datei/-CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade fuer Memory-Engine | Laufzeit-Fassade fuer Memory-Index/-Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-Host-Foundation-Engine | Exporte der Memory-Host-Foundation-Engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Engine | Memory-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen; konkrete Remote-Provider leben in ihren eigenen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-Host-QMD-Engine | Exporte der Memory-Host-QMD-Engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-Host-Speicher-Engine | Exporte der Memory-Host-Speicher-Engine |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Hilfsfunktionen | Multimodale Memory-Host-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-query` | Memory-Host-Abfrage-Hilfsfunktionen | Memory-Host-Abfrage-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-secret` | Memory-Host-Geheimnis-Hilfsfunktionen | Memory-Host-Geheimnis-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen fuer Memory-Host-Ereignisjournal | Hilfsfunktionen fuer Memory-Host-Ereignisjournal |
  | `plugin-sdk/memory-core-host-status` | Memory-Host-Status-Hilfsfunktionen | Memory-Host-Status-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Laufzeit | Hilfsfunktionen fuer Memory-Host-CLI-Laufzeit |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Kernlaufzeit | Hilfsfunktionen fuer Memory-Host-Kernlaufzeit |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Laufzeit-Hilfsfunktionen | Memory-Host-Datei-/Laufzeit-Hilfsfunktionen |
  | `plugin-sdk/memory-host-core` | Alias fuer Memory-Host-Kernlaufzeit | Herstellerneutraler Alias fuer Hilfsfunktionen der Memory-Host-Kernlaufzeit |
  | `plugin-sdk/memory-host-events` | Alias fuer Memory-Host-Ereignisjournal | Herstellerneutraler Alias fuer Hilfsfunktionen des Memory-Host-Ereignisjournals |
  | `plugin-sdk/memory-host-files` | Alias fuer Memory-Host-Datei-/Laufzeit | Herstellerneutraler Alias fuer Memory-Host-Datei-/Laufzeit-Hilfsfunktionen |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen fuer verwaltetes Markdown | Gemeinsame Hilfsfunktionen fuer verwaltetes Markdown fuer Memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Such-Fassade fuer Active Memory | Lazy-Laufzeit-Fassade fuer Active-Memory-Suchmanager |
  | `plugin-sdk/memory-host-status` | Alias fuer Memory-Host-Status | Herstellerneutraler Alias fuer Memory-Host-Status-Hilfsfunktionen |
  | `plugin-sdk/testing` | Test-Dienstprogramme | Legacy-Barrel fuer breite Kompatibilitaet; bevorzugen Sie fokussierte Test-Unterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

Diese Tabelle ist absichtlich die gemeinsame Migrations-Teilmenge, nicht die vollständige SDK-Oberfläche. Die vollständige Liste mit über 200 Einstiegspunkten befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Hilfsseams für gebündelte Plugins wurden aus der Export-Map des öffentlichen SDK entfernt, mit Ausnahme ausdrücklich dokumentierter Kompatibilitäts-Fassaden wie dem veralteten `plugin-sdk/discord`-Shim, der für das veröffentlichte Paket `@openclaw/discord@2026.3.13` beibehalten wird. Owner-spezifische Helfer befinden sich im jeweiligen Plugin-Paket; gemeinsames Host-Verhalten sollte über generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` laufen.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden, prüfen Sie die Quelle unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welcher generische Vertrag dafür zuständig sein sollte.

## Aktive Veraltungen

Engere Veraltungen, die für das gesamte Plugin-SDK, den Provider-Vertrag, die Runtime-Oberfläche und das Manifest gelten. Jede davon funktioniert heute noch, wird aber in einem zukünftigen Major-Release entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrem kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth-Hilfe-Builder → command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: gleiche Signaturen, gleiche
    Exporte — nur aus dem engeren Unterpfad importiert. `command-auth`
    re-exportiert sie als Kompatibilitäts-Stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention-Gating-Helfer → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` — gibt ein
    einzelnes Entscheidungsobjekt statt zwei getrennter Aufrufe zurück.

    Nachgelagerte Channel-Plugins (Slack, Discord, Matrix, MS Teams) wurden bereits
    umgestellt.

  </Accordion>

  <Accordion title="Channel-Runtime-Shim und Channel-Actions-Helfer">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Channel-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context` zum Registrieren von Runtime-
    Objekten.

    `channelActions*`-Helfer in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen „actions“-Channel-Exporten veraltet. Stellen Sie
    Fähigkeiten stattdessen über die semantische `presentation`-Oberfläche bereit —
    Channel-Plugins deklarieren, was sie rendern (Karten, Buttons, Auswahllisten),
    statt welche rohen Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="Websuche-Provider-tool()-Helfer → createTool() im Plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt den SDK-Helfer nicht mehr, um den Tool-Wrapper zu
    registrieren.

  </Accordion>

  <Accordion title="Klartext-Channel-Envelopes → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`) zum Erstellen eines flachen
    Klartext-Prompt-Envelopes aus eingehenden Channel-Nachrichten.

    **Neu**: `BodyForAgent` plus strukturierte Blöcke für Benutzerkontext. Channel-
    Plugins hängen Routing-Metadaten (Thread, Thema, Antwort-auf, Reaktionen) als
    typisierte Felder an, statt sie in eine Prompt-Zeichenkette zu konkatenieren. Der
    Helfer `formatAgentEnvelope(...)` wird für synthetisierte, an den Assistant
    gerichtete Envelopes weiterhin unterstützt, aber eingehende Klartext-Envelopes
    werden auslaufen.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes eigene
    Channel-Plugin, das `channelEnvelope`-Text nachbearbeitet hat.

  </Accordion>

  <Accordion title="Provider-Discovery-Typen → Provider-Katalogtypen">
    Vier Discovery-Typaliasse sind jetzt dünne Wrapper über die
    Typen der Katalog-Ära:

    | Alter Alias               | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Außerdem der alte statische Container `ProviderCapabilities` — Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` verwenden statt eines statischen
    Objekts.

  </Accordion>

  <Accordion title="Thinking-Policy-Hooks → resolveThinkingProfile">
    **Alt** (drei getrennte Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    einer geordneten Stufenliste zurückgibt. OpenClaw stuft veraltete gespeicherte
    Werte automatisch anhand des Profilrangs herunter.

    Implementieren Sie einen Hook statt drei. Die alten Hooks funktionieren während
    des Veraltungsfensters weiter, werden aber nicht mit dem Profilergebnis
    kombiniert.

  </Accordion>

  <Accordion title="Externer OAuth-Provider-Fallback → contracts.externalAuthProviders">
    **Alt**: `resolveExternalOAuthProfiles(...)` implementieren, ohne
    den Provider im Plugin-Manifest zu deklarieren.

    **Neu**: Deklarieren Sie `contracts.externalAuthProviders` im Plugin-Manifest
    **und** implementieren Sie `resolveExternalAuthProfiles(...)`. Der alte „auth
    fallback“-Pfad gibt zur Laufzeit eine Warnung aus und wird entfernt.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider-Env-Var-Lookup → setup.providers[].envVars">
    **Altes** Manifest-Feld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie denselben Env-Var-Lookup in `setup.providers[].envVars`
    im Manifest. Dadurch werden Setup-/Status-Env-Metadaten an einem Ort
    konsolidiert, und es ist nicht mehr nötig, die Plugin-Runtime nur für
    Env-Var-Lookups zu starten.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Veraltungsfenster geschlossen wird.

  </Accordion>

  <Accordion title="Memory-Plugin-Registrierung → registerMemoryCapability">
    **Alt**: drei getrennte Aufrufe —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der Memory-State-API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, ein einzelner Registrierungsaufruf. Additive Memory-Helfer
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) sind nicht betroffen.

  </Accordion>

  <Accordion title="Subagent-Session-Nachrichtentypen umbenannt">
    Zwei alte Typaliasse werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Runtime-Methode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Gleiche Signatur; die alte Methode ruft die
    neue durch.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-TaskFlow-Accessor zurück.

    **Neu**: `runtime.tasks.managedFlows` behält die verwaltete TaskFlow-
    Mutations-Runtime für Plugins bei, die Child-Tasks aus einem Flow erstellen,
    aktualisieren, abbrechen oder ausführen. Verwenden Sie `runtime.tasks.flows`,
    wenn das Plugin nur DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Eingebettete Extension-Factories → Agent-Tool-Result-Middleware">
    Oben unter „Migration durchführen → Pi-Tool-Result-Extensions zu Middleware
    migrieren“ behandelt. Der Vollständigkeit halber hier aufgeführt: Der entfernte,
    nur für Pi vorgesehene Pfad `api.registerEmbeddedExtensionFactory(...)` wird durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Runtime-
    Liste in `contracts.agentToolResultMiddleware` ersetzt.
  </Accordion>

  <Accordion title="OpenClawSchemaType-Alias → OpenClawConfig">
    `OpenClawSchemaType`, re-exportiert aus `openclaw/plugin-sdk`, ist jetzt ein
    einzeiliger Alias für `OpenClawConfig`. Bevorzugen Sie den kanonischen Namen.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Veraltungen auf Extension-Ebene (innerhalb gebündelter Channel-/Provider-Plugins unter
`extensions/`) werden in ihren eigenen `api.ts`- und `runtime-api.ts`-Barrels
nachverfolgt. Sie betreffen keine Verträge von Drittanbieter-Plugins und sind hier
nicht aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt
verwenden, lesen Sie vor dem Upgrade die Veraltungskommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Runtime-Warnungen aus                       |
| **Nächstes Major-Release** | Veraltete Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem nächsten
Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Ausweg, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) — Ihr erstes Plugin erstellen
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Unterpfad-Importe
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin-Manifest](/de/plugins/manifest) — Referenz zum Manifest-Schema
