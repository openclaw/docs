---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben vor OpenClaw 2026.4.25 api.registerEmbeddedExtensionFactory verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Migrieren Sie von der veralteten Abwärtskompatibilitätsschicht zum modernen Plugin-SDK
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-07-12T15:38:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw hat eine umfassende Abwärtskompatibilitätsschicht durch eine moderne Plugin-
Architektur ersetzt, die aus kleinen, gezielten Importen aufgebaut ist. Wenn Ihr Plugin vor dieser
Änderung erstellt wurde, führt dieser Leitfaden es auf die aktuellen Verträge über.

## Was sich geändert hat

Zwei weit offene Importoberflächen ermöglichten Plugins früher, über einen
einzigen Einstiegspunkt auf nahezu alles zuzugreifen:

- **`openclaw/plugin-sdk/compat`** – exportierte Dutzende Hilfsfunktionen erneut, damit
  ältere Hook-basierte Plugins weiterhin funktionierten, während die neue Architektur entwickelt wurde.
- **`openclaw/plugin-sdk/infra-runtime`** – ein umfassendes Barrel, das Systemereignisse,
  Heartbeat-Status, Zustellungswarteschlangen, Fetch-/Proxy-Hilfsfunktionen, Dateihilfen,
  Genehmigungstypen und nicht zusammengehörige Hilfsfunktionen vermischte.
- **`openclaw/plugin-sdk/config-runtime`** – ein umfassendes Konfigurations-Barrel, das während
  des Migrationszeitraums weiterhin veraltete direkte Hilfsfunktionen zum Laden/Schreiben enthielt.
- **`openclaw/extension-api`** – eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gewährte.
- **`api.registerEmbeddedExtensionFactory(...)`** – ein entfernter, ausschließlich für den eingebetteten Runner
  vorgesehener Hook, der Ereignisse des eingebetteten Runners wie `tool_result` beobachtete. Verwenden Sie
  stattdessen Agent-Middleware für Tool-Ergebnisse (siehe [Eingebettete Erweiterungen für Tool-Ergebnisse
  zu Middleware migrieren](#how-to-migrate)).

Diese Oberflächen sind **veraltet**: Sie funktionieren weiterhin, neue Plugins dürfen sie jedoch
nicht verwenden, und bestehende Plugins sollten vor dem nächsten Major-Release migriert werden,
in dem sie entfernt werden. `registerEmbeddedExtensionFactory` wurde bereits entfernt;
veraltete Registrierungen werden nicht mehr geladen.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, funktionieren danach nicht mehr.
</Warning>

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, in der ein Ersatz eingeführt wird. Nicht abwärtskompatible Vertragsänderungen durchlaufen
zunächst einen Kompatibilitätsadapter, Diagnosen, Dokumentation und einen Übergangszeitraum.
Dies gilt für SDK-Importe, Manifestfelder, Einrichtungs-APIs, Hooks und das
Registrierungsverhalten zur Laufzeit.

### Warum

- **Langsamer Start** – das Importieren einer Hilfsfunktion lud Dutzende nicht zusammengehöriger Module.
- **Zirkuläre Abhängigkeiten** – umfassende Re-Exporte erleichterten das
  Erzeugen von Importzyklen.
- **Unklare API-Oberfläche** – stabile Exporte ließen sich nicht von internen unterscheiden.

Jedes `openclaw/plugin-sdk/<subpath>` ist jetzt ein kleines, eigenständiges Modul mit
einem dokumentierten Vertrag.

Auch die bisherigen Provider-Komfortschnittstellen für gebündelte Kanäle wurden entfernt –
kanalspezifische Hilfsabkürzungen waren private Annehmlichkeiten des Monorepos und keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen gezielte generische SDK-Unterpfade. Behalten Sie
im Arbeitsbereich des gebündelten Plugins Provider-eigene Hilfsfunktionen in der plugin-eigenen
`api.ts` oder `runtime-api.ts`:

- Anthropic behält Claude-spezifische Stream-Hilfsfunktionen in seiner eigenen `api.ts`- /
  `contract-api.ts`-Schnittstelle.
- OpenAI behält Provider-Builder, Hilfsfunktionen für Standardmodelle und Builder für
  Echtzeit-Provider in seiner eigenen `api.ts`.
- OpenRouter behält Provider-Builder und Hilfsfunktionen für Onboarding/Konfiguration in seiner eigenen
  `api.ts`.

## Kompatibilitätsrichtlinie

Kompatibilitätsarbeiten für externe Plugins erfolgen in dieser Reihenfolge:

1. Fügen Sie den neuen Vertrag hinzu.
2. Binden Sie das bisherige Verhalten weiterhin über einen Kompatibilitätsadapter ein.
3. Geben Sie eine Diagnose oder Warnung aus, die den bisherigen Pfad und dessen Ersatz nennt.
4. Decken Sie beide Pfade durch Tests ab.
5. Dokumentieren Sie die Veraltung und den Migrationspfad.
6. Entfernen Sie das bisherige Verhalten erst nach dem angekündigten Migrationszeitraum, üblicherweise in einem Major-
   Release.

Wenn ein Manifestfeld weiterhin akzeptiert wird, verwenden Sie es weiter, bis Dokumentation und
Diagnosen etwas anderes angeben. Neuer Code sollte den dokumentierten Ersatz bevorzugen;
bestehende Plugins dürfen bei gewöhnlichen Minor-Releases nicht funktionsunfähig werden.

Prüfen Sie die aktuelle Migrationswarteschlange mit `pnpm plugins:boundary-report`:

| Flag                                                    | Auswirkung                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `--summary` (oder `pnpm plugins:boundary-report:summary`) | Kompakte Anzahlen anstelle vollständiger Details.                               |
| `--json`                                                | Maschinenlesbarer Bericht.                                                      |
| `--owner <id>`                                          | Auf ein Plugin oder einen Kompatibilitätsverantwortlichen filtern.              |
| `--fail-on-cross-owner`                                 | Bei reservierten SDK-Importen über Verantwortlichkeitsgrenzen hinweg mit einem von null verschiedenen Status beenden. |
| `--fail-on-eligible-compat`                             | Mit einem von null verschiedenen Status beenden, wenn das `removeAfter`-Datum eines veralteten Kompatibilitätseintrags überschritten wurde. |
| `--fail-on-unclassified-unused-reserved`                | Bei ungenutzten, nicht klassifizierten reservierten SDK-Shims mit einem von null verschiedenen Status beenden. |

`pnpm plugins:boundary-report:ci` wird mit allen drei Fehler-Flags ausgeführt. Jeder
Kompatibilitätseintrag besitzt ein ausdrückliches `removeAfter`-Datum (nicht ein vages „nächstes
Major-Release“) – der Bericht gruppiert veraltete Einträge nach diesem Datum, zählt
lokale Code-/Dokumentationsreferenzen, zeigt reservierte SDK-Importe über Verantwortlichkeitsgrenzen hinweg an und
fasst die private SDK-Brücke zum Memory-Host zusammen. Reservierte SDK-Unterpfade müssen
nachverfolgte Nutzung durch den Verantwortlichen aufweisen; ungenutzte reservierte Exporte sollten aus dem öffentlichen
SDK entfernt werden.

## Migration

<Steps>
  <Step title="Hilfsfunktionen zum Laden/Schreiben der Laufzeitkonfiguration migrieren">
    Gebündelte Plugins sollten `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` nicht mehr direkt aufrufen. Verwenden Sie vorzugsweise die Konfiguration,
    die bereits an den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten innerhalb von `execute` `ctx.getRuntimeConfig()` lesen, damit ein Tool,
    das vor dem Schreiben einer Konfiguration erstellt wurde, weiterhin die aktualisierte Konfiguration sieht.

    Konfigurationsschreibvorgänge erfolgen über die transaktionale Hilfsfunktion mit einer expliziten
    Richtlinie für die Zeit nach dem Schreiben:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Verwenden Sie `afterWrite: { mode: "restart", reason: "..." }`, wenn die Änderung einen
    sauberen Neustart des Gateways erfordert, und `afterWrite: { mode: "none", reason: "..." }`
    nur, wenn der Aufrufer die Folgeaktion verantwortet und die
    Neu­ladeplanung bewusst unterdrückt. Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für
    Tests und Protokollierung; das Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder
    zu planen.

    `loadConfig` und `writeConfigFile` bleiben als veraltete Kompatibilitäts-
    Hilfsfunktionen für externe Plugins erhalten und warnen einmalig mit dem
    Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und der Laufzeitcode des Repos
    werden durch `pnpm check:deprecated-api-usage` und
    `pnpm check:no-runtime-action-load-config` geschützt: Neue Nutzung in produktivem Plugin-Code
    schlägt unmittelbar fehl, direkte Konfigurationsschreibvorgänge schlagen fehl, Gateway-Servermethoden müssen den
    Laufzeit-Snapshot der Anfrage verwenden, Laufzeit-Hilfsfunktionen für Kanalversand/-aktionen/-Clients
    müssen Konfiguration von ihrer Schnittstellengrenze erhalten, und langlebige Laufzeitmodule
    dürfen keine umgebungsbezogenen `loadConfig()`-Aufrufe enthalten.

    Neuer Plugin-Code sollte das umfassende Barrel `openclaw/plugin-sdk/config-runtime`
    vermeiden. Verwenden Sie den gezielten Unterpfad für die jeweilige Aufgabe:

    | Bedarf | Import |
    | --- | --- |
    | Konfigurationstypen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Zusicherungen für bereits geladene Konfiguration und Konfigurationsabfrage am Plugin-Einstieg | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lesen des aktuellen Laufzeit-Snapshots | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Konfigurationsschreibvorgänge | `openclaw/plugin-sdk/config-mutation` |
    | Hilfsfunktionen für den Sitzungsspeicher | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellenkonfiguration | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Laufzeit-Hilfsfunktionen für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Auflösung geheimer Eingaben | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Sitzungsüberschreibungen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests werden durch Scanner gegen das umfassende
    Barrel geschützt, damit Importe und Mocks auf das benötigte Verhalten beschränkt bleiben. Das
    Barrel besteht aus Gründen der externen Kompatibilität weiterhin, neuer Code sollte jedoch nicht
    davon abhängen.

  </Step>

  <Step title="Eingebettete Erweiterungen für Tool-Ergebnisse zu Middleware migrieren">
    Gebündelte Plugins müssen ausschließlich für den eingebetteten Runner vorgesehene
    Tool-Ergebnis-Handler von `api.registerEmbeddedExtensionFactory(...)` durch
    laufzeitneutrale Middleware ersetzen:

    ```typescript
    // Dynamische Tools der OpenClaw- und Codex-Laufzeit
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Aktualisieren Sie gleichzeitig das Plugin-Manifest:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Installierte Plugins können ebenfalls Middleware für Tool-Ergebnisse registrieren, wenn dies ausdrücklich
    aktiviert ist und jede Ziel-Laufzeit in
    `contracts.agentToolResultMiddleware` deklariert wurde. Nicht deklarierte Middleware-
    Registrierungen installierter Plugins werden abgelehnt.

  </Step>

  <Step title="Genehmigungsnative Handler zu Fähigkeitsfakten migrieren">
    Genehmigungsfähige Kanal-Plugins stellen natives Genehmigungsverhalten über
    `approvalCapability.nativeRuntime` sowie die gemeinsame Registry für den Laufzeitkontext
    bereit:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`.
    - Verschieben Sie genehmigungsspezifische Authentifizierung/Zustellung aus der bisherigen Verdrahtung über `plugin.auth` /
      `plugin.approvals` nach `approvalCapability`.
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen
      Kanal-Plugin-Vertrag entfernt; verschieben Sie Zustellungs-/Native-/Rendering-Felder nach
      `approvalCapability`.
    - `plugin.auth` bleibt ausschließlich für An-/Abmeldeabläufe des Kanals erhalten; der Kern
      liest dort keine Authentifizierungs-Hooks für Genehmigungen mehr.
    - Registrieren Sie kanaleigene Laufzeitobjekte (Clients, Tokens, Bolt-Apps)
      über `openclaw/plugin-sdk/channel-runtime-context`.
    - Senden Sie keine Plugin-eigenen Umleitungshinweise aus nativen Genehmigungs-Handlern;
      der Kern verantwortet Hinweise zur Zustellung an anderer Stelle auf Grundlage tatsächlicher Zustellungsergebnisse.
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit – unvollständige Stubs werden
      abgelehnt.

    Informationen zur aktuellen Struktur der Genehmigungsfähigkeit finden Sie unter [Kanal-Plugins](/de/plugins/sdk-channel-plugins).

  </Step>

  <Step title="Fallback-Verhalten von Windows-Wrappern prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    Wrapper mit `.cmd`/`.bat` jetzt geschlossen fehl, sofern Sie nicht ausdrücklich
    `allowShellFallback: true` übergeben:

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Legen Sie dies nur für vertrauenswürdige Kompatibilitätsaufrufer fest, die absichtlich
      // einen über die Shell vermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf den Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Importe finden">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Durch gezielte Importe ersetzen">
    Jeder Export der bisherigen Oberfläche ist einem bestimmten modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (veraltete Abwärtskompatibilitätsschicht)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Nachher (moderne, gezielte Importe)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Verwenden Sie für hostseitige Hilfsfunktionen die injizierte Plugin-Runtime,
    statt sie direkt zu importieren:

    ```typescript
    // Vorher (veraltete extension-api-Brücke)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Nachher (injizierte Runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Hilfsfunktionen der alten Brücke:

    | Alter Import | Moderne Entsprechung |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Hilfsfunktionen für den Sitzungsspeicher | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Breite infra-runtime-Importe ersetzen">
    `openclaw/plugin-sdk/infra-runtime` bleibt für die externe Kompatibilität
    bestehen, neuer Code sollte jedoch die tatsächlich benötigte, gezielte
    Schnittstelle importieren:

    | Bedarf | Import |
    | --- | --- |
    | Hilfsfunktionen für die Systemereignis-Warteschlange | `openclaw/plugin-sdk/system-event-runtime` |
    | Hilfsfunktionen für Heartbeat-Aktivierung, Ereignisse und Sichtbarkeit | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Abarbeiten der Warteschlange ausstehender Zustellungen | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie der Kanalaktivität | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Speicherinterne und persistenzgestützte Deduplizierungs-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Hilfsfunktionen für sichere lokale Datei- und Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-berücksichtigender Abruf | `openclaw/plugin-sdk/runtime-fetch` |
    | Hilfsfunktionen für Proxy- und abgesicherte Abrufe | `openclaw/plugin-sdk/fetch-runtime` |
    | Richtlinientypen für den SSRF-Dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Genehmigungsanfragen und -entscheidungen | `openclaw/plugin-sdk/approval-runtime` |
    | Hilfsfunktionen für Genehmigungsantwort-Nutzdaten und -befehle | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hilfsfunktionen zur Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Warten auf Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Hilfsfunktionen für sichere Token | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Parallelität asynchroner Aufgaben | `openclaw/plugin-sdk/concurrency-runtime` |
    | Pflichtwert-Prüfungen für beweisbare Invarianten | `openclaw/plugin-sdk/expect-runtime` |
    | Numerische Typumwandlung | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokale asynchrone Sperre | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dateisperren | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins werden durch einen Scanner vor der Verwendung von
    `infra-runtime` geschützt, sodass Repository-Code nicht auf das breite
    Barrel zurückfallen kann.

  </Step>

  <Step title="Hilfsfunktionen für Kanalrouten migrieren">
    Neuer Code für Kanalrouten verwendet `openclaw/plugin-sdk/channel-route`.
    Die älteren Namen für Routenschlüssel und vergleichbare Ziele bleiben als
    Kompatibilitätsaliase erhalten:

    | Alte Hilfsfunktion | Moderne Hilfsfunktion |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Die modernen Routen-Hilfsfunktionen normalisieren
    `{ channel, to, accountId, threadId }` konsistent für native Genehmigungen,
    Antwortunterdrückung, Deduplizierung eingehender Nachrichten,
    Cron-Zustellung und Sitzungsrouting.

    Fügen Sie keine neuen Verwendungen von
    `ChannelMessagingAdapter.parseExplicitTarget`, den parsergestützten
    Hilfsfunktionen für geladene Routen (`parseExplicitTargetForLoadedChannel`,
    `resolveRouteTargetForLoadedChannel`) oder
    `resolveChannelRouteTargetWithParser(...)` aus
    `plugin-sdk/channel-route` hinzu – diese sind veraltet und bleiben nur für
    ältere Plugins erhalten. Neue Kanal-Plugins sollten
    `messaging.targetResolver.resolveTarget(...)` für die Normalisierung der
    Ziel-ID und den Fallback bei fehlendem Verzeichnistreffer,
    `messaging.inferTargetChatType(...)`, wenn der Kern frühzeitig eine
    Peer-Art benötigt, und `messaging.resolveOutboundSessionRoute(...)` für
    Provider-native Sitzungs- und Thread-Identitäten verwenden.

  </Step>

  <Step title="Erstellen und testen">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referenz der Importpfade

  <Accordion title="Common import path table">
  | Importpfad | Zweck | Zentrale Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für den Plugin-Einstieg | `definePluginEntry` |
  | `plugin-sdk/core` | Übergreifender Legacy-Re-Export für Definitionen/Builder von Kanaleinstiegen | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Stammkonfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für den Einstieg eines einzelnen Providers | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Definitionen und Builder für Kanaleinstiege | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Einrichtungsassistenten | Übersetzer für die Einrichtung, Allowlist-Eingabeaufforderungen, Builder für den Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Laufzeithilfen für die Einrichtung | `createSetupTranslator`, importsichere Patch-Adapter für die Einrichtung, Hilfsfunktionen für Suchhinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungs-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Veralteter Alias für den Einrichtungsadapter | `plugin-sdk/setup-runtime` verwenden |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Einrichtungswerkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten, Konfiguration und Aktionsfreigaben |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für die Kontosuche | Hilfsfunktionen für die Kontosuche und den Standard-Fallback |
  | `plugin-sdk/account-helpers` | Eng gefasste Kontohilfen | Hilfsfunktionen für Kontolisten und Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Grundbausteine für die DM-Kopplung | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwortpräfix, Tippanzeige und Quellzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter und Hilfsfunktionen für den DM-Zugriff | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Nur gemeinsame Grundbausteine für Kanalkonfigurationsschemas und der generische Builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebündelte Konfigurationsschemas | Nur von OpenClaw gepflegte gebündelte Plugins; neue Plugins müssen Plugin-lokale Schemas definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebündelte Konfigurationsschemas | Nur Kompatibilitätsalias; für gepflegte gebündelte Plugins `plugin-sdk/bundled-channel-config-schema` verwenden |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für die Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzung von Beschreibungen, Validierung auf Duplikate/Konflikte |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Umschläge | Gemeinsame Hilfsfunktionen für Routen und Umschlag-Builder |
  | `plugin-sdk/channel-inbound` | Hilfsfunktionen für den eingehenden Empfang | Kontexterstellung, Formatierung, Stammverzeichnisse, Runner, vorbereitete Antwortweiterleitung und Weiterleitungsprädikate |
  | `plugin-sdk/messaging-targets` | Veralteter Importpfad für die Zielanalyse | `plugin-sdk/channel-targets` für generische Hilfsfunktionen zur Zielanalyse, `plugin-sdk/channel-route` für den Routenvergleich und Plugin-eigene `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` für die Provider-spezifische Zielauflösung verwenden |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/channel-outbound` | Hilfsfunktionen für den Lebenszyklus ausgehender Nachrichten | Nachrichtenadapter, Empfangsbestätigungen, Hilfsfunktionen für dauerhaften Versand, Live-Vorschau-/Streaming-Hilfen, Antwortoptionen, Lebenszyklushilfen, ausgehende Identität und Nutzlastplanung |
  | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindungen | Hilfsfunktionen für Lebenszyklus und Adapter von Thread-Bindungen |
  | `plugin-sdk/agent-media-payload` | Legacy-Hilfsfunktionen für Mediennutzlasten | Builder für Agent-Mediennutzlasten bei Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur Legacy-Hilfsprogramme für die Kanallaufzeit |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Umfassende Laufzeithilfen | Hilfsfunktionen für Laufzeit, Protokollierung, Sicherung und Plugin-Installation |
  | `plugin-sdk/runtime-env` | Eng gefasste Hilfsfunktionen für die Laufzeitumgebung | Hilfsfunktionen für Logger/Laufzeitumgebung, Zeitüberschreitungen, Wiederholungen und Backoff |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für die Plugin-Laufzeit | Hilfsfunktionen für Plugin-Befehle, Hooks, HTTP und Interaktivität |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Verzögert geladene Laufzeithilfen | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshilfen | Gemeinsame Hilfsfunktionen für die Ausführung |
  | `plugin-sdk/cli-runtime` | Hilfsfunktionen für die CLI-Laufzeit | Befehlsformatierung, Wartevorgänge, Versionshilfen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Gateway-Client, startbereite Hilfsfunktion für die Ereignisschleife, Auflösung des angekündigten LAN-Hosts und Hilfsfunktionen für Kanalstatus-Patches |
  | `plugin-sdk/config-runtime` | Veralteter Kompatibilitäts-Shim für die Konfiguration | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` bevorzugen |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Validierung von Telegram-Befehlen, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Genehmigungsaufforderungen | Genehmigungsnutzlast für Ausführung/Plugin, Hilfsfunktionen für Genehmigungsfähigkeit/-profil, native Hilfsfunktionen für Genehmigungsrouting/-laufzeit und formatierte Pfade zur strukturierten Genehmigungsanzeige |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für die Genehmigungsautorisierung | Auflösung der genehmigenden Person, Aktionsautorisierung im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Genehmigungsclients | Native Profil-/Filterhilfen für Ausführungsgenehmigungen |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für die Genehmigungszustellung | Native Adapter für Genehmigungsfähigkeit/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Gateway-Hilfsfunktionen für Genehmigungen | Gemeinsamer Resolver für das Genehmigungs-Gateway |
  | `plugin-sdk/approval-reference-runtime` | Transportreferenzen für Genehmigungen | Deterministische Hilfsfunktion für dauerhafte Lokatoren bei transportbeschränkten Callbacks |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Genehmigungsadapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für häufig aufgerufene Kanaleinstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Genehmigungshandler | Umfassendere Laufzeithilfen für Genehmigungshandler; bevorzugen Sie die enger gefassten Adapter-/Gateway-Schnittstellen, wenn diese ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Genehmigungsziele | Native Hilfsfunktionen zur Bindung von Genehmigungszielen/Konten |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Genehmigungsantworten | Hilfsfunktionen für Antwortnutzlasten bei Ausführungs-/Plugin-Genehmigungen |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für den Kanallaufzeitkontext | Generische Hilfsfunktionen zum Registrieren/Abrufen/Überwachen des Kanallaufzeitkontexts |
  | `plugin-sdk/security-runtime` | Sicherheitshilfen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Freigaben, auf Stammverzeichnisse begrenzte Dateien/Pfade, externe Inhalte und das Erfassen von Secrets |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeithilfen | Fixierter Dispatcher, geschützter Abruf, Hilfsfunktionen für SSRF-Richtlinien |
  | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereignisse | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Hilfsfunktionen | Hilfsfunktionen für Heartbeat-Aktivierung, -Ereignisse und -Sichtbarkeit |
  | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktionen für die Zustellungswarteschlange | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hilfsfunktionen für Kanalaktivitäten | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen zur Deduplizierung | Arbeitsspeicherinterne und persistent gestützte Deduplizierungs-Caches |
  | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für den Dateizugriff | Sichere Hilfsfunktionen für lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Hilfsfunktionen für die Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Richtlinienhilfen für Ausführungsgenehmigungen | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnosefreigaben | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Fehlerhilfen | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umschlossene Abrufe/Proxys | `resolveFetch`, Proxy-Hilfsfunktionen, Hilfsfunktionen für EnvHttpProxyAgent-Optionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für die Hostnormalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungen | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung und Eingabezuordnung | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hilfsfunktionen für Befehlsfreigaben und Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für die Absenderautorisierung, Hilfsfunktionen für die Befehlsregistrierung einschließlich der dynamischen Formatierung von Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse von Secret-Eingaben | Hilfsfunktionen für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Dienstprogramme für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Schutzfunktionen für Webhook-Anfragetexte | Hilfsfunktionen zum Lesen/Begrenzen von Anfragetexten |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwortlaufzeit | Eingehende Weiterleitung, Heartbeat, Antwortplanung, Aufteilung |
  | `plugin-sdk/reply-dispatch-runtime` | Eng gefasste Hilfsfunktionen für die Antwortweiterleitung | Finalisierung, Provider-Weiterleitung und Hilfsfunktionen für Konversationsbezeichnungen |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für den Antwortverlauf | `createChannelHistoryWindow`; veraltete Kompatibilitätsexporte für Zuordnungshilfen wie `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwortblöcke | Hilfsfunktionen zur Aufteilung von Text/Markdown |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für den Sitzungsspeicher | Hilfsfunktionen für bereichsgebundene Sitzungszeilen, Speicherpfade und das Lesen des Aktualisierungszeitpunkts |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für Zustandspfade | Hilfsfunktionen für Zustands- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für den Kanalstatus | Builder für Kanal-/Kontostatus-Zusammenfassungen, Standardwerte für den Laufzeitstatus, Hilfsfunktionen für Problemmetadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen zur Zielauflösung | Gemeinsame Hilfsfunktionen zur Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur Zeichenfolgennormalisierung | Hilfsfunktionen zur Slug-/Zeichenfolgennormalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Anfrage-URLs | Zeichenfolgen-URLs aus anfrageähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Zeitgesteuerter Befehls-Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Allgemeine Parameterleser für Tools/CLI |
  | `plugin-sdk/tool-payload` | Extraktion der Tool-Nutzlast | Normalisierte Nutzlasten aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendeparametern | Kanonische Felder des Sendeziels aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Downloadpfade |
  | `plugin-sdk/logging-core` | Hilfsfunktionen für die Protokollierung | Hilfsfunktionen für Subsystem-Logger und Schwärzung |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtantworten | Typen für Antwortnutzlasten |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen zur Einrichtung lokaler/selbst gehosteter Provider | Hilfsfunktionen zur Erkennung/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Spezialisierte Hilfsfunktionen zur Einrichtung OpenAI-kompatibler selbst gehosteter Provider | Dieselben Hilfsfunktionen zur Erkennung/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen für die Provider-Laufzeitauthentifizierung | Hilfsfunktionen zur Laufzeitauflösung von API-Schlüsseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen zur Einrichtung von Provider-API-Schlüsseln | Hilfsfunktionen für das Onboarding mit API-Schlüssel und das Schreiben von Profilen |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-selection-runtime` | Hilfsfunktionen zur Provider-Auswahl | Konfigurierte oder automatische Provider-Auswahl und Zusammenführung der Provider-Rohkonfiguration |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen zur Suche nach Provider-Authentifizierungsumgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/Wiedergabe | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Wiedergaberichtlinien, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für das Provider-Onboarding | Hilfsfunktionen für die Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | HTTP-Hilfsfunktionen für Provider | Allgemeine Hilfsfunktionen für HTTP-/Endpunktfunktionen von Providern, einschließlich Hilfsfunktionen für Multipart-Formulare zur Audiotranskription |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Provider-Webabrufe | Hilfsfunktionen zur Registrierung/Zwischenspeicherung von Webabruf-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen für die Websuchkonfiguration von Providern | Eng gefasste Hilfsfunktionen für Websuchkonfiguration/Anmeldedaten für Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für den Websuchvertrag von Providern | Eng gefasste Hilfsfunktionen für den Vertrag von Websuchkonfiguration/Anmeldedaten, beispielsweise `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsspezifische Setter/Getter für Anmeldedaten |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für die Provider-Websuche | Hilfsfunktionen zur Registrierung/Zwischenspeicherung/Laufzeit von Websuch-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für die Kompatibilität von Provider-Tools/-Schemas | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und Schemabereinigung + Diagnose für DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für die Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfsfunktionen für die Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für den Provider-Transport | Native Hilfsfunktionen für den Provider-Transport, beispielsweise abgesicherte Abrufe, Textextraktion aus Tool-Ergebnissen, Transformationen von Transportnachrichten und beschreibbare Transportereignisströme |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Warteschlange | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medienhilfsfunktionen | Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Mediennutzlasten |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen zur Mediengenerierung | Gemeinsame Hilfsfunktionen für Failover, Kandidatenauswahl und Meldungen über fehlende Modelle bei der Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen zum Medienverständnis | Provider-Typen für das Medienverständnis sowie providerseitige Exporte von Bild-/Audiohilfsfunktionen |
  | `plugin-sdk/text-runtime` | Veralteter breiter Kompatibilitätsexport für Text | Verwenden Sie `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` und `logging-core` |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen zur Textaufteilung | Hilfsfunktion zur Aufteilung ausgehender Texte |
  | `plugin-sdk/speech` | Sprachhilfsfunktionen | Sprach-Provider-Typen sowie providerseitige Hilfsfunktionen für Direktiven, Registry und Validierung und ein OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprachkern | Sprach-Provider-Typen, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Echtzeittranskription | Provider-Typen, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktion für WebSocket-Sitzungen |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Echtzeitsprache | Provider-Typen, Registry-/Auflösungshilfsfunktionen, Hilfsfunktionen für Bridge-Sitzungen, gemeinsame Warteschlangen für Agent-Rückmeldungen, Sprachsteuerung aktiver Ausführungen, Integrität von Transkripten/Ereignissen, Echounterdrückung, Abgleich von Konsultationsfragen, Koordination erzwungener Konsultationen, Verfolgung des Turn-Kontexts, Verfolgung der Ausgabeaktivität und Hilfsfunktionen für schnelle Kontextkonsultationen |
  | `plugin-sdk/image-generation` | Hilfsfunktionen zur Bildgenerierung | Provider-Typen für die Bildgenerierung sowie Hilfsfunktionen für Bildassets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Kern für die Bildgenerierung | Typen für die Bildgenerierung sowie Hilfsfunktionen für Failover, Authentifizierung und Registry |
  | `plugin-sdk/music-generation` | Hilfsfunktionen zur Musikgenerierung | Provider-/Anfrage-/Ergebnistypen für die Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Kern für die Musikgenerierung | Typen für die Musikgenerierung, Failover-Hilfsfunktionen, Provider-Suche und Analyse von Modellreferenzen |
  | `plugin-sdk/video-generation` | Hilfsfunktionen zur Videogenerierung | Provider-/Anfrage-/Ergebnistypen für die Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Kern für die Videogenerierung | Typen für die Videogenerierung, Failover-Hilfsfunktionen, Provider-Suche und Analyse von Modellreferenzen |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwortnutzlasten |
  | `plugin-sdk/channel-config-primitives` | Primitive für die Kanalkonfiguration | Eng gefasste Primitive für Kanalkonfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen zum Schreiben der Kanalkonfiguration | Hilfsfunktionen zur Autorisierung von Schreibvorgängen an der Kanalkonfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsamer Kanal-Prolog | Gemeinsame Exporte des Kanal-Plugin-Prologs |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für den Kanalstatus | Gemeinsame Hilfsfunktionen für Momentaufnahmen/Zusammenfassungen des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für die Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen für den Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden | Verwenden Sie `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Schutz-Hilfsfunktionen für direkte DMs | Eng gefasste Hilfsfunktionen für Schutzrichtlinien vor der Kryptografie |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungshilfsfunktionen | Primitive für passive Kanäle/Status und Umgebungs-Proxy-Hilfsfunktionen |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Veralteter Alias für den Webhook-Pfad | Verwenden Sie `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Webmedien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Reexport für Zod | Importieren Sie `zod` direkt aus `zod` |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für den Speicherkern | Hilfsoberfläche für Speicherverwaltung/-konfiguration/-dateien/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeitfassade der Speicher-Engine | Laufzeitfassade für Speicherindex/-suche |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry für Speichereinbettungen | Leichtgewichtige Hilfsfunktionen für die Registry von Providern für Speichereinbettungen |
  | `plugin-sdk/memory-core-host-engine-foundation` | Fundament-Engine des Speicher-Hosts | Exporte der Fundament-Engine des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Einbettungs-Engine des Speicher-Hosts | Verträge für Speichereinbettungen, Registry-Zugriff, lokaler Provider und allgemeine Hilfsfunktionen für Stapelverarbeitung/Remote-Zugriff; konkrete Remote-Provider befinden sich in den jeweils zuständigen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine des Speicher-Hosts | Exporte der QMD-Engine des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-engine-storage` | Speicher-Engine des Speicher-Hosts | Exporte der Speicher-Engine des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen des Speicher-Hosts | Multimodale Hilfsfunktionen des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-query` | Abfragehilfsfunktionen des Speicher-Hosts | Abfragehilfsfunktionen des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-secret` | Geheimnishilfsfunktionen des Speicher-Hosts | Geheimnishilfsfunktionen des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-events` | Veralteter Alias für Speicherereignisse | Verwenden Sie `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Statushilfsfunktionen des Speicher-Hosts | Statushilfsfunktionen des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit des Speicher-Hosts | Hilfsfunktionen für die CLI-Laufzeit des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-runtime-core` | Kernlaufzeit des Speicher-Hosts | Hilfsfunktionen für die Kernlaufzeit des Speicher-Hosts |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeithilfsfunktionen des Speicher-Hosts | Datei-/Laufzeithilfsfunktionen des Speicher-Hosts |
  | `plugin-sdk/memory-host-core` | Alias für die Kernlaufzeit des Speicher-Hosts | Herstellerneutraler Alias für Hilfsfunktionen der Kernlaufzeit des Speicher-Hosts |
  | `plugin-sdk/memory-host-events` | Alias für das Ereignisjournal des Speicher-Hosts | Herstellerneutraler Alias für Hilfsfunktionen des Ereignisjournals des Speicher-Hosts |
  | `plugin-sdk/memory-host-files` | Veralteter Alias für Speicherdateien/-laufzeit | Verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen für verwaltetes Markdown | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für speichernahe Plugins |
  | `plugin-sdk/memory-host-search` | Suchfassade für Active Memory | Lazy-Laufzeitfassade des Suchmanagers für Active Memory |
  | `plugin-sdk/memory-host-status` | Veralteter Alias für den Status des Speicher-Hosts | Verwenden Sie `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhilfsprogramme | Veraltetes repo-lokales Kompatibilitäts-Barrel; verwenden Sie fokussierte repo-lokale Testunterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

  Diese Tabelle bildet die gemeinsame Teilmenge für Migrationen ab, nicht die vollständige SDK-Oberfläche. Das
  Inventar der Compiler-Einstiegspunkte befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
  Paketexporte werden aus der öffentlichen Teilmenge generiert.

  Reservierte Hilfsschnittstellen für gebündelte Plugins wurden aus der öffentlichen SDK-
  Exportzuordnung entfernt, mit Ausnahme ausdrücklich dokumentierter Kompatibilitätsfassaden wie dem
  veralteten `plugin-sdk/discord`-Shim, der für externe Plugins beibehalten wird, die weiterhin
  das veröffentlichte Paket `@openclaw/discord` direkt importieren. Eigentümerspezifische
  Hilfsfunktionen befinden sich im Paket des jeweiligen Plugins; gemeinsam genutztes Host-Verhalten wird
  über generische SDK-Verträge wie `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` bereitgestellt.

  Verwenden Sie den spezifischsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden,
  prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welchem generischen
  Vertrag er zugeordnet werden sollte.

  ## Aktive Veraltungen

  Spezifischere Veraltungen innerhalb des Plugin-SDK, des Provider-Vertrags, der Runtime-
  Oberfläche und des Manifests. Alle funktionieren derzeit noch, werden jedoch in einer zukünftigen
  Hauptversion entfernt. Jeder Eintrag ordnet die alte API ihrem kanonischen Ersatz zu.

  <AccordionGroup>
  <Accordion title="Hilfsfunktionen für command-auth -> command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: dieselben Signaturen, dieselben
    Exporte – sie werden lediglich über den spezifischeren Unterpfad importiert. `command-auth`
    reexportiert sie als Kompatibilitäts-Stubs.

    ```typescript
    // Vorher
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Nachher
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Hilfsfunktionen für Mention-Gating -> resolveInboundMentionDecision">
    **Alt**: `resolveMentionGating(params)` und
    `resolveMentionGatingWithBypass(params)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` – ein Entscheidungsobjekt
    anstelle zweier getrennter Aufrufformen.

    Wird in Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp und Zalo verwendet. Slacks eigenes `app_mention`-Ereignismodell
    verwendet diese Hilfsfunktion nicht.

  </Accordion>

  <Accordion title="Channel-Runtime-Shim und Hilfsfunktionen für Channel-Aktionen">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Channel-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context`, um Runtime-
    Objekte zu registrieren.

    Die `channelActions*`-Hilfsfunktionen in `openclaw/plugin-sdk/channel-actions` sind
    ebenso veraltet wie rohe „actions“-Channel-Exporte. Stellen Sie Fähigkeiten
    stattdessen über die semantische `presentation`-Oberfläche bereit – Channel-Plugins
    deklarieren, was sie darstellen (Karten, Schaltflächen, Auswahlelemente), und nicht, welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="Hilfsfunktion tool() für Websuche-Provider -> createTool() im Plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt die SDK-Hilfsfunktion nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Klartext-Channel-Umschläge -> BodyForAgent">
    **Alt**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (und das
    Feld `channelEnvelope` in eingehenden Nachrichtenobjekten), um aus eingehenden
    Channel-Nachrichten einen flachen Klartext-Prompt-Umschlag zu erstellen.

    **Neu**: `BodyForAgent` sowie strukturierte Benutzerkontextblöcke. Channel-
    Plugins hängen Routing-Metadaten (Thread, Thema, Antwortbezug, Reaktionen) als
    typisierte Felder an, anstatt sie zu einer Prompt-Zeichenfolge zu verketten. Die
    Hilfsfunktion `formatAgentEnvelope(...)` wird für synthetisch erzeugte
    assistentenseitige Umschläge weiterhin unterstützt, eingehende Klartext-Umschläge werden jedoch
    abgeschafft.

    Betroffene Bereiche: `inbound_claim`, `message_received` und alle benutzerdefinierten
    Channel-Plugins, die den alten Umschlagtext nachverarbeitet haben.

  </Accordion>

  <Accordion title="deactivate-Hook -> gateway_stop">
    **Alt**: `api.on("deactivate", handler)`.

    **Neu**: `api.on("gateway_stop", handler)`. Derselbe Vertrag für die Bereinigung beim
    Herunterfahren; lediglich der Name des Hooks ändert sich.

    ```typescript
    // Vorher
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Nachher
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` bleibt als veralteter Kompatibilitätsalias angebunden, bis es
    nach dem 2026-08-16 entfernt wird.

  </Accordion>

  <Accordion title="subagent_spawning-Hook -> Thread-Bindung im Kern">
    **Alt**: `api.on("subagent_spawning", handler)` mit Rückgabe von
    `threadBindingReady` oder `deliveryOrigin`.

    **Neu**: Lassen Sie den Kern Subagent-Bindungen mit `thread: true` über den
    Adapter für Channel-Sitzungsbindungen vorbereiten. Verwenden Sie `api.on("subagent_spawned", handler)`
    ausschließlich zur Beobachtung nach dem Start.

    ```typescript
    // Vorher
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Nachher
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` und
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` bleiben nur als
    veraltete Kompatibilitätsoberflächen erhalten, während externe Plugins migriert werden, und werden
    nach dem 2026-08-30 entfernt.

  </Accordion>

  <Accordion title="Provider-Ermittlungstypen -> Provider-Katalogtypen">
    Vier Typaliase für die Ermittlung sind jetzt dünne Wrapper um die Typen der
    Katalogära:

    | Alter Alias                | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Hinzu kommt der veraltete statische Container `ProviderCapabilities` – Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` anstelle eines statischen Objekts verwenden.

  </Accordion>

  <Accordion title="Hooks für Denkregeln -> resolveThinkingProfile">
    **Alt** (drei separate Hooks in `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: eine einzelne Funktion `resolveThinkingProfile(ctx)`, die ein
    `ProviderThinkingProfile` mit der kanonischen `id`, einem optionalen `label` und einer
    nach Rang geordneten Liste von Stufen zurückgibt. OpenClaw stuft veraltete gespeicherte Werte anhand des Profilrangs
    automatisch herab.

    Der Kontext enthält `provider`, `modelId`, optional zusammengeführte `reasoning`-
    sowie optional zusammengeführte `compat`-Fakten des Modells. Provider-Plugins können diese
    Katalogfakten verwenden, um ein modellspezifisches Profil nur dann bereitzustellen, wenn der konfigurierte
    Anfragevertrag dies unterstützt.

    Implementieren Sie einen Hook anstelle von drei. Die veralteten Hooks funktionieren während
    des Veraltungszeitraums weiterhin, werden jedoch nicht mit dem Profilergebnis kombiniert.

  </Accordion>

  <Accordion title="Externe Authentifizierungs-Provider -> contracts.externalAuthProviders">
    **Alt**: Implementierung externer Authentifizierungs-Hooks, ohne den Provider
    im Plugin-Manifest zu deklarieren.

    **Neu**: Deklarieren Sie `contracts.externalAuthProviders` im Plugin-Manifest
    **und** implementieren Sie `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Suche nach Provider-Umgebungsvariablen -> setup.providers[].envVars">
    **Altes** Manifestfeld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie dieselbe Suche nach Umgebungsvariablen in
    `setup.providers[].envVars` im Manifest. Dadurch werden Umgebungsmetadaten für Einrichtung und Status an einer Stelle
    zusammengeführt, und es wird vermieden, die Plugin-Runtime nur für die Suche nach Umgebungsvariablen
    zu starten.

    `providerAuthEnvVars` wird über einen Kompatibilitätsadapter weiterhin unterstützt,
    bis der Veraltungszeitraum endet.

  </Accordion>

  <Accordion title="Registrierung des Memory-Plugins -> registerMemoryCapability">
    **Alt**: drei separate Aufrufe – `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf über die Memory-State-API –
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dieselben Slots, ein einziger Registrierungsaufruf. Additive Prompt- und Korpus-Hilfsfunktionen
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) sind
    nicht betroffen.

  </Accordion>

  <Accordion title="API für Memory-Embedding-Provider">
    **Alt**: `api.registerMemoryEmbeddingProvider(...)` sowie
    `contracts.memoryEmbeddingProviders`.

    **Neu**: `api.registerEmbeddingProvider(...)` sowie
    `contracts.embeddingProviders`.

    Der generische Vertrag für Embedding-Provider kann außerhalb von Memory wiederverwendet werden und ist
    der unterstützte Weg für neue Provider. Die Memory-spezifische Registrierungs-API
    bleibt als veraltete Kompatibilitätsoberfläche angebunden, während vorhandene Provider
    migriert werden. Die Plugin-Inspektion meldet eine nicht gebündelte Verwendung als Kompatibilitätsschuld.

  </Accordion>

  <Accordion title="Typen für Subagent-Sitzungsnachrichten umbenannt">
    Zwei veraltete Typaliase werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Runtime-Methode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Gleiche Signatur; die alte Methode delegiert an die
    neue.

  </Accordion>

  <Accordion title="Entfernte APIs für Sitzungs- und Transkriptdateien">
    Die Umstellung von Sitzungen und Transkripten auf SQLite entfernt oder verwirft Plugin-seitige APIs,
    die aktive `sessions.json`-Speicher, JSONL-Transkriptpfade oder Listen
    von Sitzungsdateien offengelegt haben. Runtime-Plugins sollten Sitzungsidentitäten und SDK-Runtime-
    Hilfsfunktionen verwenden, anstatt aktive Dateien aufzulösen oder zu verändern.

    | Zu migrierende Oberfläche | Ersatz |
    | ----------------- | ----------- |
    | Veraltete `loadSessionStore(...)`, `updateSessionStore(...)` und `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`, `listSessionEntries(...)` und Sitzungsmutationen auf Zeilenebene. |
    | Veraltete `resolveSessionFilePath(...)` | Sitzungsidentität (`sessionKey`, `sessionId` und SDK-Laufzeitziel-Helfer) sowie Gateway-Methoden, die auf der aktuellen Sitzung arbeiten. |
    | Entfernte `saveSessionStore(...)` | Gateway-eigene Sitzungs-Laufzeit-APIs; Plugin-Code sollte den Sitzungszustand über dokumentierte Laufzeit-/Kontext-Helfer abfragen oder ändern, statt die aktive Speicherdatei zu schreiben. |
    | Entfernte `resolveSessionTranscriptPathInDir(...)` und `resolveAndPersistSessionFile(...)` | Sitzungsidentität und Gateway-Methoden, die auf der aktuellen Sitzung arbeiten. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Identitätsgestützte Transkriptleser, die vom aktuellen Laufzeitkontext bereitgestellt werden, oder Gateway-Verlaufs-/Sitzungsmethoden, wenn sich das Plugin außerhalb des Eigentümerpfads des Transkripts befindet. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` mit `agentId`, `sessionKey` und `sessionId`. |
    | Eingaben für die Speichersynchronisierung wie `sessionFiles` | Identitätsgestützte Transkript-/Sitzungsquellen, die vom Host bereitgestellt werden; durchsuchen Sie für aktive Sitzungen keine aktiven JSONL-Dateien. |
    | Laufzeitoptionen namens `transcriptPath` oder `sessionFile` für aktive Sitzungen | `sessionTarget`-/Laufzeitzielobjekte, die eine speicherneutrale Sitzungsidentität enthalten. |

    Alte JSONL-Transkriptdateien bleiben als Import-, Archiv-, Export- und
    Support-Artefakte gültig. Sie sind nicht mehr der dauerhafte Laufzeitvertrag für
    aktive Sitzungen.

    Mit `v2026.7.1-beta.5` veröffentlichte offizielle Plugins importierten die vier
    oben genannten veralteten Helfer. `openclaw/plugin-sdk/session-store-runtime` behält
    genau diese Brücke bis zum 2026-10-12 bei; neue Plugins müssen die Ersatzlösungen verwenden.
    `resolveStorePath(...)` bleibt ein unterstützter SDK-Helfer und ist nicht Teil
    dieser Veraltung.

    `openclaw plugins inspect --all --runtime` meldet nicht gebündelte Plugins, deren
    Ladefehler oder Diagnosen weiterhin auf diese entfernten Datei-APIs verweisen. Der
    Hinweisscan von `@openclaw/plugin-inspector` muss Version `0.3.17` oder
    neuer verwenden, damit Scans externer Pakete auch Sitzungsspeicher-Helfer für den gesamten Speicher,
    Helfer für Sitzungspfade, alte Transkriptdateiziele und Low-Level-
    Transkripthelfer vor der Veröffentlichung kennzeichnen.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-Zugriff
    auf den Aufgabenablauf zurück.

    **Neu**: `runtime.tasks.managedFlows` behält die verwaltete TaskFlow-Mutations-
    laufzeit für Plugins bei, die untergeordnete Aufgaben aus einem Ablauf erstellen,
    aktualisieren, abbrechen oder ausführen. Verwenden Sie `runtime.tasks.flows`, wenn das Plugin nur
    DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Vorher
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Nachher
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Entfernt nach dem 2026-07-26.

  </Accordion>

  <Accordion title="Eingebettete Erweiterungsfabriken -> Middleware für Agenten-Werkzeugergebnisse">
    Wird oben unter [Migration](#how-to-migrate) behandelt. Der Vollständigkeit
    halber hier ebenfalls aufgeführt: Der entfernte, ausschließlich für eingebettete Runner bestimmte
    Pfad `api.registerEmbeddedExtensionFactory(...)` wird durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Laufzeitliste
    in `contracts.agentToolResultMiddleware` ersetzt.
  </Accordion>

  <Accordion title="OpenClawSchemaType-Alias -> OpenClawConfig">
    Der aus `openclaw/plugin-sdk` erneut exportierte Typ `OpenClawSchemaType` ist jetzt ein
    einzeiliger Alias für `OpenClawConfig`. Bevorzugen Sie den kanonischen Namen.

    ```typescript
    // Vorher
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Nachher
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Veraltungen auf Erweiterungsebene (innerhalb gebündelter Kanal-/Provider-Plugins unter
`extensions/`) werden in deren eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie wirken sich nicht auf Plugin-Verträge von Drittanbietern aus und werden hier
nicht aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt verwenden, lesen Sie vor dem
Upgrade die Hinweise zur Veraltung in diesem Barrel.
</Note>

## Migration von Talk und Echtzeitsprachfunktionen

Echtzeitsprach-, Telefonie-, Besprechungs- und Browser-Talk-Code verwendet gemeinsam einen Talk-
Sitzungscontroller, der von `openclaw/plugin-sdk/realtime-voice` exportiert wird. Der
Controller verwaltet die gemeinsame Talk-Ereignishülle, den Zustand des aktiven Gesprächsabschnitts, den Aufnahme-
zustand, den Ausgabeaudiozustand, den Verlauf der jüngsten Ereignisse und die Zurückweisung veralteter Gesprächsabschnitte.
Provider-Plugins verwalten anbieterspezifische Echtzeitsitzungen; Oberflächen-Plugins verwalten
Besonderheiten bei Aufnahme, Wiedergabe, Telefonie und Besprechungen.

Alle gebündelten Oberflächen verwenden den gemeinsamen Controller: Browser-Relay,
Übergabe an verwaltete Räume, Echtzeit-Sprachanrufe, Streaming-STT für Sprachanrufe, Google
Meet in Echtzeit und natives Push-to-Talk. Gateway kündigt in
`hello-ok.features.events` einen Live-Talk-Ereigniskanal an: `talk.event`.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, es sei denn,
er implementiert einen Low-Level-Adapter oder eine Test-Fixture. Verwenden Sie den gemeinsamen Controller, damit
auf Gesprächsabschnitte beschränkte Ereignisse nicht ohne Gesprächsabschnitts-ID ausgegeben werden können, veraltete Aufrufe von `turnEnd` /
`turnCancel` keinen neueren aktiven Gesprächsabschnitt löschen können und Ereignisse des
Ausgabeaudio-Lebenszyklus über Telefonie, Besprechungen, Browser-Relay,
Übergabe an verwaltete Räume und native Talk-Clients hinweg konsistent bleiben.

Die öffentliche API-Struktur:

```typescript
// Gateway-eigene Talk-Sitzungs-API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-eigene Provider-Sitzungs-API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Browsereigene WebRTC-/Provider-WebSocket-Sitzungen verwenden `talk.client.create`,
da der Browser die Provider-Aushandlung und den Medientransport verwaltet, während das
Gateway Anmeldedaten, Anweisungen und Werkzeugrichtlinien verwaltet. `talk.session.*` ist
die gemeinsame, vom Gateway verwaltete Oberfläche für Echtzeit über Gateway-Relay, Transkription über Gateway-Relay
und native STT-/TTS-Sitzungen in verwalteten Räumen.

Alte Konfigurationen, die Echtzeitselektoren neben `talk.provider` /
`talk.providers` platzieren, sollten mit `openclaw doctor --fix` repariert werden; die Talk-Laufzeit
interpretiert Sprach-/TTS-Provider-Konfigurationen nicht als Echtzeit-Provider-Konfigurationen um.

Die unterstützten Kombinationen für `talk.session.create` sind bewusst begrenzt:

| Modus           | Transport       | Logik           | Eigentümer          | Hinweise                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Vollduplex-Provider-Audio, das über das Gateway überbrückt wird; Werkzeugaufrufe werden über das Agent-Consult-Werkzeug weitergeleitet. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabeaudio und empfangen Transkriptereignisse.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Nativer/Client-Raum | Räume im Push-to-Talk- und Walkie-Talkie-Stil, in denen der Client Aufnahme/Wiedergabe und das Gateway den Gesprächsabschnittszustand verwaltet. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Nativer/Client-Raum | Nur für Administratoren vorgesehener Raummodus für vertrauenswürdige Erstanbieter-Oberflächen, die Gateway-Werkzeugaktionen direkt ausführen. |

Methodenzuordnung für Leser, die von den älteren Familien `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` migrieren (alle entfernt):

| Alt                              | Neu                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` oder `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Das vereinheitlichte Steuerungsvokabular ist ebenfalls bewusst begrenzt:

| Methode                         | Gilt für                                                | Vertrag                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Hängt einen base64-codierten PCM-Audioabschnitt an die Provider-Sitzung an, die derselben Gateway-Verbindung zugeordnet ist.                                                                                              |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Startet einen Benutzer-Turn in einem verwalteten Raum.                                                                                                                                                                   |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beendet den aktiven Turn nach der Validierung auf einen veralteten Turn.                                                                                                                                                  |
| `talk.session.cancelTurn`       | alle Gateway-eigenen Sitzungen                          | Bricht die aktive Erfassung sowie laufende Provider-, Agenten- und TTS-Vorgänge für einen Turn ab.                                                                                                                        |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppt die Audioausgabe des Assistenten, ohne den Benutzer-Turn zwingend zu beenden.                                                                                                                                      |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließt einen Provider-Tool-Aufruf nach einem von dessen Bridge bereitgestellten asynchronen Abschluss ab; übergeben Sie `options.willContinue` für eine Zwischenausgabe oder, sofern unterstützt, `options.suppressResponse`, um eine weitere Assistentenantwort zu vermeiden. |
| `talk.session.steer`            | agentengestützte Talk-Sitzungen                         | Sendet die gesprochene Steuerung `status`, `steer`, `cancel` oder `followup` an den aktiven eingebetteten Lauf, der aus der Talk-Sitzung ermittelt wurde.                                                                  |
| `talk.session.close`            | alle vereinheitlichten Sitzungen                        | Stoppt Relay-Sitzungen oder widerruft den Zustand des verwalteten Raums und verwirft anschließend die vereinheitlichte Sitzungs-ID.                                                                                       |

Führen Sie keine Provider- oder Plattformsonderfälle im Kern ein, damit dies funktioniert.
Der Kern ist für die Semantik der Talk-Sitzungen zuständig. Provider-Plugins sind für die Einrichtung der Anbietersitzungen zuständig.
Voice-call und Google Meet sind für Telefonie-/Meeting-Adapter zuständig. Browser und native
Apps sind für die UX der Geräteerfassung und -wiedergabe zuständig.

## Zeitplan für die Entfernung

| Zeitpunkt                                   | Was geschieht                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Jetzt**                                   | Veraltete Oberflächen geben Laufzeitwarnungen aus.                                                                                        |
| **Das `removeAfter`-Datum jedes Kompatibilitätseintrags** | Diese bestimmte Oberfläche kann entfernt werden; `pnpm plugins:boundary-report --fail-on-eligible-compat` lässt die CI fehlschlagen, sobald das Datum überschritten ist. |
| **Nächste Hauptversion**                    | Alle noch nicht migrierten Oberflächen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl.                              |

Alle Kern-Plugins wurden bereits migriert. Externe Plugins sollten
vor der nächsten Hauptversion migriert werden. Führen Sie `pnpm plugins:boundary-report` aus, um zu sehen, welche
Kompatibilitätseinträge für die von Ihrem Plugin verwendeten Oberflächen als Nächstes fällig sind.

## Warnungen vorübergehend unterdrücken

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Notausgang, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) - Erstellen Sie Ihr erstes Plugin
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Importe
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) - Kanal-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) - ausführliche Erläuterung der Architektur
- [Plugin-Manifest](/de/plugins/manifest) - Referenz des Manifest-Schemas
