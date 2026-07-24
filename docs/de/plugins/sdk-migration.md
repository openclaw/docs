---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben api.registerEmbeddedExtensionFactory vor OpenClaw 2026.4.25 verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Migrieren Sie von der veralteten Abwärtskompatibilitätsschicht zum modernen Plugin-SDK
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-07-24T04:02:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8090cc95f34456cd4659acf1f290e87ecf80efaccd474c0c6d48dddd534e76e9
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw hat eine umfassende Abwärtskompatibilitätsschicht durch eine moderne Plugin-
Architektur ersetzt, die aus kleinen, gezielten Imports besteht. Wenn Ihr Plugin aus der Zeit vor dieser
Änderung stammt, führt dieser Leitfaden es auf die aktuellen Verträge über.

## Was sich geändert hat

Mehrere weitreichende Importoberflächen ermöglichten Plugins früher, über einen
einzigen Einstiegspunkt auf nahezu alles zuzugreifen:

- **`openclaw/plugin-sdk`** und **`openclaw/plugin-sdk/compat`** – re-exportierten
  Dutzende Hilfsfunktionen, während das fokussierte SDK entwickelt wurde. Beide Wurzeln wurden nun
  entfernt; importieren Sie stattdessen einen dokumentierten Unterpfad.
- **`openclaw/plugin-sdk/infra-runtime`** – ein umfassender Barrel-Export, der Systemereignisse,
  Heartbeat-Zustand, Zustellungswarteschlangen, Fetch-/Proxy-Hilfsfunktionen, Dateihilfsfunktionen,
  Genehmigungstypen und nicht zusammengehörige Hilfsprogramme vermischte.
- **`openclaw/plugin-sdk/config-runtime`** – ein umfassender Konfigurations-Barrel-Export, der
  nur für sein späteres Kompatibilitätsfenster beibehalten wurde; direkte Hilfsfunktionen zum Laden/Schreiben
  zur Laufzeit wurden entfernt.
- **`openclaw/extension-api`** – eine entfernte Brücke, die Plugins direkten
  Zugriff auf hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gewährte.
- **`api.registerEmbeddedExtensionFactory(...)`** – ein entfernter, ausschließlich für den eingebetteten Runner
  bestimmter Hook, der Ereignisse des eingebetteten Runners wie `tool_result` beobachtete. Verwenden Sie stattdessen
  Middleware für Agent-Tool-Ergebnisse (siehe [Eingebettete Erweiterungen für Tool-Ergebnisse
  zu Middleware migrieren](#how-to-migrate)).

Das Stamm-SDK, der Kompatibilitäts-Barrel-Export, die Erweiterungsbrücke und die Factory für eingebettete Erweiterungen
wurden entfernt. `infra-runtime` und `config-runtime` bleiben ausschließlich für ihre
separat erfassten späteren Zeitfenster erhalten; neue Plugins sollten fokussierte Unterpfade verwenden.

<Warning>
  Plugins, die die entfernten Stamm-, Kompatibilitäts- oder Erweiterungsoberflächen importieren, werden nicht mehr
  geladen. Befolgen Sie vor dem Upgrade die nachstehenden Zuordnungen.
</Warning>

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, mit der ein Ersatz eingeführt wird. Inkompatible Vertragsänderungen durchlaufen zunächst
einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Deprecation-Zeitfenster. Dies
gilt für SDK-Imports, Manifestfelder, Einrichtungs-APIs, Hooks und das Registrierungsverhalten
zur Laufzeit.

### Warum

- **Langsamer Start** – der Import einer Hilfsfunktion lud Dutzende nicht zusammengehörige Module.
- **Zirkuläre Abhängigkeiten** – umfassende Re-Exports erleichterten das Erzeugen
  von Importzyklen.
- **Unklare API-Oberfläche** – stabile Exporte konnten nicht von internen unterschieden werden.

Jedes `openclaw/plugin-sdk/<subpath>` ist nun ein kleines, eigenständiges Modul mit
einem dokumentierten Vertrag.

Alte Provider-Komfortschnittstellen für gebündelte Kanäle wurden ebenfalls entfernt –
kanalspezifische Kurzformen für Hilfsfunktionen waren private Komfortfunktionen des Monorepos und keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale, generische SDK-Unterpfade. Behalten Sie im
Arbeitsbereich des gebündelten Plugins Provider-eigene Hilfsfunktionen im jeweiligen
`api.ts` oder `runtime-api.ts` dieses Plugins:

- Anthropic verwaltet Claude-spezifische Stream-Hilfsfunktionen in seiner eigenen `api.ts`-/
  `contract-api.ts`-Schnittstelle.
- OpenAI verwaltet Provider-Builder, Hilfsfunktionen für Standardmodelle und Echtzeit-Provider-
  Builder in seinem eigenen `api.ts`.
- OpenRouter verwaltet den Provider-Builder sowie Hilfsfunktionen für Onboarding und Konfiguration in seinem eigenen
  `api.ts`.

## Kompatibilitätsrichtlinie

Kompatibilitätsarbeiten für externe Plugins erfolgen in dieser Reihenfolge:

1. Fügen Sie den neuen Vertrag hinzu.
2. Binden Sie das alte Verhalten weiterhin über einen Kompatibilitätsadapter ein.
3. Geben Sie eine Diagnose oder Warnung aus, die den alten Pfad und den Ersatz nennt.
4. Decken Sie beide Pfade durch Tests ab.
5. Dokumentieren Sie die Deprecation und den Migrationspfad.
6. Entfernen Sie den alten Pfad erst nach dem angekündigten Migrationszeitfenster, üblicherweise in einem Major-
   Release.

Wenn ein Manifestfeld weiterhin akzeptiert wird, verwenden Sie es weiter, bis Dokumentation und
Diagnosen etwas anderes angeben. Neuer Code sollte den dokumentierten Ersatz bevorzugen;
bestehende Plugins dürfen bei gewöhnlichen Minor-Releases nicht beeinträchtigt werden.

### Kompatibilität der Einrichtung veröffentlichter Kanäle

Über `2026.7.1` veröffentlichte Pakete für Slack, Discord, Signal und Microsoft Teams
importieren kanalspezifische Konfigurationsschemas aus
`openclaw/plugin-sdk/bundled-channel-config-schema`. Die veröffentlichten Pakete für Slack und
Discord importieren außerdem `createLegacyCompatChannelDmPolicy` und
`promptLegacyChannelAllowFromForAccount` aus
`openclaw/plugin-sdk/setup-runtime`.

Diese Exporte bleiben als veraltete Laufzeit-Kompatibilitätsadapter verfügbar.
Neue und erneut veröffentlichte Plugins sollten ihre Konfigurationsschemas und Einrichtungsrichtlinien
lokal verwalten und dafür generische Grundelemente aus `channel-config-schema` und
`setup-runtime` verwenden. Die Kompatibilitätsexporte dürfen erst entfernt werden, wenn sie
von den mindestens unterstützten Versionen veröffentlichter Pakete nicht mehr importiert werden.

### Kompatibilität der Eingabefelder für die Kanaleinrichtung

`ChannelSetupInput` typisiert nun dauerhaft nur noch die kanalübergreifende
Einrichtungshülle. Kanalspezifische Felder bleiben in einer veralteten Kompatibilitätsstufe
typisiert, damit bestehende externe Plugins weiterhin kompiliert werden, während Plugin-Autoren diese
Felder in Plugin-lokale Eingabetypen für die Einrichtung verschieben.

OpenClaw veröffentlicht keine Major-Releases. Eine Registry-Prüfung am 2026-07-22 untersuchte
426 veröffentlichte, außerhalb des Quellbaums verwaltete Kanal-Plugins und entfernte 21 Felder ohne Leser.
Die 22 beibehaltenen Felder haben jeweils einen bekannten veröffentlichten Leser. Jedes weitere Feld wird
gelöscht, sobald kein veröffentlichtes Plugin es mehr liest; die beibehaltene Menge schrumpft, während
Plugin-Autoren auf Plugin-lokale Eingabetypen für die Einrichtung migrieren.

Dieselbe Prüfung entfernte 23 alte Promotion-Schlüssel für nicht deklarierte Adapter ohne
veröffentlichte Abhängige. Sechs allgemeine Schlüssel und der nur für die Einrichtung bestimmte Schlüssel `rooms` bleiben erhalten.
Auch diese Menge schrumpft, während veröffentlichte Plugins `singleAccountKeysToMove` deklarieren.

Der gemeinsame Typ besitzt keine Indexsignatur. Plugin-eigene Schlüssel können weiterhin
in Laufzeiteingabeobjekten vorhanden sein; deklarieren Sie sie in einer Plugin-lokalen Schnittmenge oder grenzen
Sie sie über das Einrichtungsschema des zuständigen Plugins ein.

| `code`                                  | `owner`   | `replacement`                                                                                    | Bedingung für die Entfernung                                                     |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `plugin-sdk-channel-setup-input-fields` | `channel` | Bilden Sie eine Schnittmenge aus `ChannelSetupInput` und einem Plugin-lokalen Typ, der die Felder des zuständigen Kanals deklariert | Löschen Sie ein Feld, wenn die Registry-Prüfung veröffentlichter Plugins keinen Leser findet |

Die alte Promotion-Stufe für nicht deklarierte Adapter folgt derselben lesergesteuerten
Richtlinie. Deklarieren Sie `singleAccountKeysToMove`, einschließlich eines leeren Arrays, wenn das
Plugin keine zusätzlichen Promotion-Schlüssel benötigt, damit der gemeinsame Fallback schlüsselweise entfernt
werden kann.

#### Leser überprüfen

1. Blättern Sie mit jedem `nextCursor` durch `https://clawhub.ai/api/v1/packages?family=code-plugin&limit=100`, und behalten Sie Pakete bei, deren `categories` `channels` enthalten.
2. Fügen Sie npm-Kandidaten aus `npm search --json --searchlimit=1000 "openclaw channel plugin"` hinzu. Fügen Sie reine Quellcodekandidaten aus GitHub-Codesuchen nach `openclaw/plugin-sdk/channel-setup`, `openclaw/plugin-sdk/setup` und `openclaw/plugin-sdk/core` hinzu.
3. Ermitteln Sie für jeden Kandidaten die neueste veröffentlichte Version. Führen Sie `npm pack <package>@<version> --json --pack-destination <temp-dir>` aus, entpacken Sie das Ergebnis und untersuchen Sie den ausgelieferten `dist`-JavaScript-Code sowie die Deklarationen auf direkte oder destrukturierte Feldzugriffe. Laden Sie das ClawHub-Artefakt herunter, wenn ein Paket keine npm-Veröffentlichung besitzt.
4. Erfassen Sie Paket, Version, Feld oder Promotion-Schlüssel und die übereinstimmende Datei. Ein Feld oder Schlüssel darf nur gelöscht werden, wenn kein veröffentlichtes Plugin-Artefakt darauf zugreift. Halten Sie die Lesernamen in den Codekommentaren neben den Listen der beibehaltenen Felder und Schlüssel mit der Prüfung synchron.

Dies ist lediglich ein Kompatibilitätsdatensatz für Quellcode und Typen. Er besitzt keinen Laufzeitadapter oder
Eintrag in der Kompatibilitäts-Registry, da Laufzeiteingabeobjekte für die Einrichtung und das Einrichtungsverhalten
unverändert bleiben.

Prüfen Sie die aktuelle Migrationswarteschlange mit `pnpm plugins:boundary-report`:

| Flag                                                    | Wirkung                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (oder `pnpm plugins:boundary-report:summary`) | Kompakte Anzahlen anstelle vollständiger Details.                                         |
| `--json`                                                | Maschinenlesbarer Bericht.                                                       |
| `--owner <id>`                                          | Auf ein Plugin oder einen Kompatibilitätsverantwortlichen filtern.                                   |
| `--fail-on-cross-owner`                                 | Bei reservierten SDK-Imports über Verantwortlichkeitsgrenzen hinweg mit einem von null verschiedenen Status beenden.                             |
| `--fail-on-eligible-compat`                             | Mit einem von null verschiedenen Status beenden, wenn das `removeAfter`-Datum eines veralteten Kompatibilitätsdatensatzes überschritten ist. |
| `--fail-on-unclassified-unused-reserved`                | Bei ungenutzten reservierten SDK-Shims mit einem von null verschiedenen Status beenden.                                    |

`pnpm plugins:boundary-report:ci` wird mit allen drei Fehler-Flags ausgeführt. Jeder
Kompatibilitätsdatensatz besitzt ein explizites `removeAfter`-Datum (nicht ein vages „nächstes
Major-Release“) – der Bericht gruppiert veraltete Datensätze nach diesem Datum, zählt
lokale Code-/Dokumentationsreferenzen, zeigt reservierte SDK-Imports über Verantwortlichkeitsgrenzen hinweg an und
fasst die private SDK-Brücke zum Memory-Host zusammen. Reservierte SDK-Unterpfade müssen
eine nachverfolgte Nutzung durch den Verantwortlichen aufweisen; ungenutzte reservierte Exporte sollten aus dem öffentlichen
SDK entfernt werden.

## Migration

<Steps>
  <Step title="Hilfsfunktionen zum Laden/Schreiben der Laufzeitkonfiguration migrieren">
    Gebündelte Plugins sollten `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` nicht mehr direkt aufrufen. Bevorzugen Sie die Konfiguration, die bereits
    an den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten `ctx.getRuntimeConfig()` innerhalb von `execute` lesen, damit ein Tool,
    das vor einem Konfigurationsschreibvorgang erstellt wurde, weiterhin die aktualisierte Konfiguration erkennt.

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

    Verwenden Sie `afterWrite: { mode: "restart", reason: "..." }`, wenn die Änderung
    einen sauberen Neustart des Gateways erfordert, und `afterWrite: { mode: "none", reason: "..." }`
    nur, wenn der Aufrufer für die Folgemaßnahme verantwortlich ist und den
    Planer für das erneute Laden bewusst unterdrückt. Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für
    Tests und Protokollierung; das Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder
    zu planen.

    `loadConfig` und `writeConfigFile` wurden aus der Plugin-
    Laufzeit entfernt. Gebündelte Plugins und der Laufzeitcode des Repositories werden durch
    `pnpm check:deprecated-api-usage` und
    `pnpm check:no-runtime-action-load-config` geschützt: Eine neue Verwendung in
    produktivem Plugin-Code schlägt unmittelbar fehl, direkte Konfigurationsschreibvorgänge schlagen fehl, Gateway-Servermethoden müssen
    den Laufzeit-Snapshot der Anfrage verwenden, Laufzeit-Hilfsfunktionen für das Senden, Aktionen und Clients von Kanälen
    müssen die Konfiguration von ihrer Schnittstellengrenze erhalten, und langlebige Laufzeitmodule
    erlauben keinerlei umgebungsabhängige Aufrufe von `loadConfig()`.

    Neuer Plugin-Code sollte den umfassenden `openclaw/plugin-sdk/config-runtime`-
    Barrel-Export vermeiden. Verwenden Sie den schmalen Unterpfad für die jeweilige Aufgabe:

    | Bedarf | Import |
    | --- | --- |
    | Konfigurationstypen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Konfigurationssuche am Plugin-Einstiegspunkt | `api.pluginConfig` |
    | Zusammenführen von Konfigurationen | Plugin-lokale Logik an der Konfigurationsgrenze |
    | Lesen des aktuellen Laufzeit-Snapshots | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Konfigurationsschreibvorgänge | `openclaw/plugin-sdk/config-mutation` |
    | Hilfsfunktionen für den Sitzungsspeicher | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellenkonfiguration | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Laufzeit-Hilfsfunktionen für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Auflösung geheimer Eingaben | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Sitzungsüberschreibungen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests werden durch Scanner vor dem umfassenden
    Barrel-Export geschützt, damit Imports und Mocks lokal auf das benötigte Verhalten beschränkt bleiben. Der
    Barrel-Export bleibt für die externe Kompatibilität bestehen, neuer Code sollte jedoch nicht
    von ihm abhängen.

  </Step>

  <Step title="Eingebettete Tool-Ergebnis-Erweiterungen zu Middleware migrieren">
    Gebündelte Plugins müssen die nur für den eingebetteten Runner vorgesehenen
    `api.registerEmbeddedExtensionFactory(...)`-Tool-Ergebnis-Handler durch
    laufzeitneutrale Middleware ersetzen:

    ```typescript
    // OpenClaw-Laufzeit-Tools und dynamische Tools der Codex-Laufzeit (das Ergebnis kann
    // transformiert werden). Codex-native Tool-Ergebnisse werden zur Beobachtung ebenfalls weitergeleitet,
    // ihre transformierte Ausgabe erreicht das Modell jedoch nie: Der
    // PostToolUse-Hook-Vertrag von Codex kann eine native Tool-Antwort nicht ersetzen.
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

    Installierte Plugins können ebenfalls Tool-Ergebnis-Middleware registrieren, wenn sie ausdrücklich
    aktiviert ist und jede angesprochene Laufzeit in
    `contracts.agentToolResultMiddleware` deklariert ist. Nicht deklarierte Middleware-
    Registrierungen installierter Plugins werden abgelehnt.

  </Step>

  <Step title="Native Genehmigungs-Handler zu Capability-Fakten migrieren">
    Genehmigungsfähige Kanal-Plugins stellen natives Genehmigungsverhalten über
    `approvalCapability.nativeRuntime` sowie die gemeinsame Laufzeitkontext-
    Registry bereit:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`.
    - Verschieben Sie genehmigungsspezifische Authentifizierung/Zustellung aus der veralteten `plugin.auth`-/
      `plugin.approvals`-Verdrahtung nach `approvalCapability`.
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen
      Kanal-Plugin-Vertrag entfernt; verschieben Sie Felder für Zustellung, native Verarbeitung und Rendering nach
      `approvalCapability`.
    - `plugin.auth` bleibt ausschließlich für Anmelde-/Abmeldeabläufe von Kanälen bestehen; der Kern
      liest dort keine Authentifizierungs-Hooks für Genehmigungen mehr.
    - Registrieren Sie kanaleigene Laufzeitobjekte (Clients, Tokens, Bolt-Apps)
      über `openclaw/plugin-sdk/channel-runtime-context`.
    - Senden Sie keine Plugin-eigenen Umleitungshinweise aus nativen Genehmigungs-Handlern;
      der Kern verwaltet Hinweise zur anderweitigen Weiterleitung anhand tatsächlicher Zustellungsergebnisse.
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit – partielle Stubs werden
      abgelehnt.

    Das aktuelle Layout der Genehmigungs-Capability finden Sie unter [Kanal-Plugins](/de/plugins/sdk-channel-plugins).

  </Step>

  <Step title="Fallback-Verhalten von Windows-Wrappern prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`-/`.bat`-Wrapper jetzt geschlossen fehl, sofern Sie nicht ausdrücklich
    `allowShellFallback: true` übergeben:

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Legen Sie dies nur für vertrauenswürdige Kompatibilitätsaufrufer fest, die einen
      // durch die Shell vermittelten Fallback bewusst akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht bewusst auf den Shell-Fallback angewiesen ist, setzen Sie
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
    Jeder Export der alten Oberfläche wird einem bestimmten modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (veraltete Abwärtskompatibilitätsschicht)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Nachher (moderne gezielte Importe)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Verwenden Sie für hostseitige Hilfsfunktionen die injizierte Plugin-Laufzeit, anstatt
    sie direkt zu importieren:

    ```typescript
    // Vorher (veraltete extension-api-Brücke)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Nachher (injizierte Laufzeit)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere veraltete Brücken-Hilfsfunktionen:

    | Alter Import | Modernes Äquivalent |
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
    `openclaw/plugin-sdk/infra-runtime` besteht für externe
    Kompatibilität weiterhin, neuer Code sollte jedoch die tatsächlich benötigte gezielte Oberfläche
    importieren:

    | Bedarf | Import |
    | --- | --- |
    | Hilfsfunktionen für die Systemereignis-Warteschlange | `openclaw/plugin-sdk/system-event-runtime` |
    | Hilfsfunktionen für Heartbeat-Aktivierung, Ereignisse und Sichtbarkeit | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Ausstehende Zustellungswarteschlange leeren | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie der Kanalaktivität | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Speicherinterne und persistent gestützte Deduplizierungs-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Hilfsfunktionen für sichere lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-berücksichtigender Abruf | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- und abgesicherte Abruf-Hilfsfunktionen | `openclaw/plugin-sdk/fetch-runtime` |
    | Richtlinientypen für SSRF-Dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Genehmigungsanfragen/-entscheidungen | `openclaw/plugin-sdk/approval-runtime` |
    | Hilfsfunktionen für Genehmigungsantwort-Payloads und Befehle | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hilfsfunktionen zur Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Warten auf Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Hilfsfunktionen für sichere Tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit asynchroner Aufgaben | `openclaw/plugin-sdk/concurrency-runtime` |
    | Pflichtwert-Zusicherungen für beweisbare Invarianten | `openclaw/plugin-sdk/expect-runtime` |
    | Numerische Konvertierung | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokale asynchrone Sperre | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dateisperren | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins werden durch Scanner vor `infra-runtime` geschützt, sodass Repo-Code
    nicht auf den breiten Barrel-Export zurückfallen kann.

  </Step>

  <Step title="Hilfsfunktionen für Kanalrouten migrieren">
    Neuer Code für Kanalrouten verwendet `openclaw/plugin-sdk/channel-route`. Die älteren
    Routenschlüssel-Namen bleiben als Kompatibilitätsaliase bestehen:

    | Alte Hilfsfunktion | Moderne Hilfsfunktion |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Die modernen Routen-Hilfsfunktionen normalisieren `{ channel, to, accountId, threadId }`
    konsistent für native Genehmigungen, Antwortunterdrückung, eingehende Deduplizierung,
    Cron-Zustellung und Sitzungsrouting.

    Fügen Sie keine neuen Verwendungen von `ChannelMessagingAdapter.parseExplicitTarget` oder
    `resolveChannelRouteTargetWithParser(...)` aus
    `plugin-sdk/channel-route` hinzu – diese sind veraltet und bleiben nur für ältere
    Plugins bestehen. Neue Kanal-Plugins sollten
    `messaging.targetResolver.resolveTarget(...)` für die Normalisierung der Ziel-ID
    und den Fallback bei fehlendem Verzeichnistreffer,
    `messaging.inferTargetChatType(...)`, wenn der Kern frühzeitig eine Peer-Art benötigt,
    sowie `messaging.resolveOutboundSessionRoute(...)` für Provider-native
    Sitzungs- und Thread-Identität verwenden.

  </Step>

  <Step title="Erstellen und testen">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referenz für Importpfade

Die öffentliche Exportzuordnung des Pakets ist die maßgebliche Quelle für importierbare SDK-
Unterpfade. Verwenden Sie die thematischen SDK-Leitfäden, die in der [SDK-Übersicht](/de/plugins/sdk-overview)
verlinkt sind, und bevorzugen Sie den engsten dokumentierten öffentlichen Unterpfad. Das Compiler-Inventar in
`scripts/lib/plugin-sdk-entrypoints.json` enthält außerdem privat-lokale Einträge, die
zum Erstellen gebündelter Plugins verwendet werden; ihr Vorhandensein dort macht sie nicht zu öffentlichen Paketexporten.

Diese Tabelle stellt die übliche Migrations-Teilmenge dar, nicht die vollständige SDK-Oberfläche. Das
Inventar der Compiler-Einstiegspunkte befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
Paketexporte werden aus der öffentlichen Teilmenge generiert.

Reservierte Hilfsoberflächen für gebündelte Plugins wurden aus der öffentlichen SDK-
Exportzuordnung entfernt, mit Ausnahme ausdrücklich dokumentierter Kompatibilitätsfassaden wie dem
veralteten `plugin-sdk/discord`-Shim, der für externe Plugins beibehalten wird, die weiterhin
das veröffentlichte Paket `@openclaw/discord` direkt importieren. Eigentümerspezifische
Hilfsfunktionen befinden sich innerhalb des zugehörigen Plugin-Pakets; gemeinsames Hostverhalten wird
über generische SDK-Verträge wie `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` und die injizierte Plugin-API bereitgestellt.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden,
prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welcher generische
Vertrag dafür zuständig sein sollte.

## Entfernte Kompatibilitätsoberflächen

Bei der Bereinigung im Juli 2026 wurden die SDK- und Kompatibilitäts-Barrels auf Root-Ebene, die extension API-
Brücke, die abgelaufenen SDK-Unterpfad-Aliase, nicht verwendete SDK-Unterpfade und die öffentlichen
Exporte für ausschließlich gebündelte SDK-Module entfernt. Ausschließlich gebündelte Module bleiben ihren
Repository-Eigentümern über privat-lokale Build-Zuordnungen verfügbar; sie können nicht
aus dem veröffentlichten Paket importiert werden.

### Prozessglobale Veröffentlichung von API-Providern

`registerApiProvider(...)` und `unregisterApiProviders(...)` wurden aus
`openclaw/plugin-sdk/llm` entfernt. Sie veröffentlichten API-Transporte in einem prozessglobalen
Zustand, den lebenszyklusverwaltete Modelllaufzeiten anschließend in jede vorbereitete
Registry kopieren mussten.

Provider-Plugins sollten Textinferenz-Provider über
`api.registerProvider(...)` registrieren. Hosteigener Code und Tests, die eine
`ApiRegistry` erstellen, sollten direkt in dieser Registry registrieren, damit Provider-Eigentümerschaft
und Bereinigung auf die vorbereitete Laufzeit beschränkt bleiben.

### Privater Test-Barrel

`openclaw/plugin-sdk/testing` war Repo-lokal und von ausgelieferten Paket-
Artefakten ausgeschlossen, daher wurde es vor seinem `removeAfter`-Datum 2026-07-28 entfernt. Repository-
Tests verwenden gezielte Unterpfade wie `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env` und `plugin-sdk/test-fixtures`.

## Migrationsreferenz

Diese Zuordnungen decken sowohl die im Juli 2026 entfernten Oberflächen als auch aktive
Veraltungen mit späterem Zeitfenster ab. Eine Zuordnung ist eine Migrationsanleitung und kein Nachweis dafür, dass die alte
Oberfläche weiterhin verfügbar ist; den aktuellen Status finden Sie in der Kompatibilitäts-Registry und im Zeitplan
der Entfernung.

<AccordionGroup>
  <Accordion title="Hilfsfunktionen für command-auth -> command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: dieselben Signaturen, importiert
    aus dem engeren Unterpfad. Die `command-auth`-Kompatibilitäts-Reexporte
    wurden entfernt.

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

    Übernommen für Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp und Zalo. Slacks eigenes `app_mention`-Ereignismodell
    verwendet diese Hilfsfunktion nicht.

  </Accordion>

  <Accordion title="Kanal-Laufzeit-Shim und Hilfsfunktionen für Kanalaktionen">
    `openclaw/plugin-sdk/channel-runtime` wurde entfernt. Verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context` zum Registrieren von Laufzeitobjekten.

    Die Hilfsfunktionen für native Nachrichtenschemas in `openclaw/plugin-sdk/channel-actions`
    wurden zusammen mit den rohen „actions“-Kanalexporten entfernt. Stellen Sie Capabilities
    stattdessen über die semantische `presentation`-Oberfläche bereit – Kanal-Plugins
    deklarieren, was sie rendern (Karten, Schaltflächen, Auswahlelemente), statt welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="Hilfsfunktion tool() des Websuche-Providers -> createTool() im Plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt den SDK-Helper nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Klartext-Channel-Umschläge -> BodyForAgent">
    **Alt**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (und das Feld
    `channelEnvelope` in eingehenden Nachrichtenobjekten), um aus eingehenden
    Channel-Nachrichten einen flachen Klartext-Prompt-Umschlag zu erstellen.

    **Neu**: `BodyForAgent` plus strukturierte Benutzerkontextblöcke. Channel-
    Plugins hängen Routing-Metadaten (Thread, Thema, Antwort auf, Reaktionen) als
    typisierte Felder an, statt sie zu einem Prompt-String zu verketten. Der
    Helper `formatAgentEnvelope(...)` wird weiterhin für synthetisierte,
    an den Assistenten gerichtete Umschläge unterstützt, aber eingehende
    Klartext-Umschläge werden schrittweise abgeschafft.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes
    benutzerdefinierte Channel-Plugin, das den alten Umschlagtext nachverarbeitet hat.

  </Accordion>

  <Accordion title="deactivate-Hook -> gateway_stop">
    **Alt**: `api.on("deactivate", handler)`.

    **Neu**: `api.on("gateway_stop", handler)`. Derselbe Vertrag zur Bereinigung beim
    Herunterfahren; nur der Hook-Name ändert sich.

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

    `deactivate` bleibt als veralteter Kompatibilitätsalias eingebunden, bis er
    nach dem 2026-08-16 entfernt wird.

  </Accordion>

  <Accordion title="subagent_spawning-Hook -> Kern-Thread-Bindung">
    **Alt**: `api.on("subagent_spawning", handler)`, das
    `threadBindingReady` oder `deliveryOrigin` zurückgibt.

    **Neu**: Lassen Sie den Kern die Bindungen für `thread: true`-Subagenten über
    den Adapter für Channel-Sitzungsbindungen vorbereiten. Verwenden Sie `api.on("subagent_spawned", handler)`
    nur für die Beobachtung nach dem Start.

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
    veraltete Kompatibilitätsschnittstellen bestehen, während externe Plugins migrieren,
    und werden nach dem 2026-08-30 entfernt.

  </Accordion>

  <Accordion title="Provider-Ermittlungstypen -> Provider-Katalogtypen">
    Vier Typaliase für die Ermittlung sind jetzt dünne Wrapper um die Typen
    der Katalogära:

    | Alter Alias                | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Die Aliase und der alte statische Container `ProviderCapabilities` wurden
    entfernt. Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` anstelle eines statischen Objekts verwenden.

  </Accordion>

  <Accordion title="Hooks für Denkstrategien -> resolveThinkingProfile">
    **Alt** (drei separate Hooks für `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit dem kanonischen `id`, einem optionalen `label` und einer
    nach Rang sortierten Stufenliste zurückgibt. OpenClaw stuft veraltete gespeicherte Werte anhand des Profilrangs
    automatisch herab.

    Der Kontext enthält `provider`, `modelId`, optionale zusammengeführte `reasoning`-Fakten
    und optionale zusammengeführte Modellfakten aus `compat`. Provider-Plugins können diese
    Katalogfakten verwenden, um nur dann ein modellspezifisches Profil bereitzustellen, wenn der konfigurierte
    Anfragevertrag dies unterstützt.

    Implementieren Sie einen Hook statt drei. Die alten Hooks wurden entfernt.

  </Accordion>

  <Accordion title="Externe Authentifizierungs-Provider -> contracts.externalAuthProviders">
    **Alt**: Implementieren externer Authentifizierungs-Hooks, ohne den Provider
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

    **Neu**: Spiegeln Sie dieselbe Suche nach Umgebungsvariablen in `setup.providers[].envVars`
    im Manifest. Dadurch werden Umgebungsmetadaten für Einrichtung und Status an einer Stelle
    zusammengeführt, und es wird vermieden, die Plugin-Laufzeit nur zur Beantwortung von
    Umgebungsvariablenabfragen zu starten.

    `providerAuthEnvVars` wird nicht mehr akzeptiert.

  </Accordion>

  <Accordion title="Registrierung des Speicher-Plugins -> registerMemoryCapability">
    **Alt**: drei separate Aufrufe – `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf der Speicherstatus-API –
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dieselben Slots, ein einziger Registrierungsaufruf. Additive Prompt- und Korpus-Helper
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) sind
    nicht betroffen.

  </Accordion>

  <Accordion title="API für Provider von Speicher-Embeddings">
    **Alt**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Neu**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Der generische Vertrag für Embedding-Provider ist außerhalb des Speichers wiederverwendbar und
    der unterstützte Pfad für neue Provider. Die speicherspezifische Registrierungs-API
    bleibt als veraltete Kompatibilität eingebunden, während bestehende Provider
    migrieren. Die Plugin-Inspektion meldet die nicht gebündelte Nutzung als
    Kompatibilitätsschuld.

  </Accordion>

  <Accordion title="Unverarbeitete Channel-Sendeergebnisse -> OutboundDeliveryResult">
    **Alt**: `{ ok, messageId, error }` über
    `ChannelSendRawResult` zurückgeben und mit
    `createRawChannelSendResultAdapter(...)` normalisieren.

    **Neu**: Geben Sie `OutboundDeliveryResult`-Felder zurück und hängen Sie den Channel mit
    `createAttachedChannelResultAdapter(...)` an. Fehlgeschlagene Sendevorgänge sollten eine Ausnahme auslösen,
    statt einen Fehler-String zurückzugeben. Der unverarbeitete Ergebnistyp bleibt bis
    zur nächsten Hauptversion des Plugin-SDK verfügbar.

  </Accordion>

  <Accordion title="Typen für Subagent-Sitzungsnachrichten umbenannt">
    Zwei alte Typaliase werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Laufzeitmethode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Gleiche Signatur; die alte Methode delegiert
    an die neue.

  </Accordion>

  <Accordion title="Entfernte APIs für Sitzungs- und Transkriptdateien">
    Die Umstellung von Sitzungen und Transkripten auf SQLite entfernt oder verwirft Plugin-seitige APIs,
    die aktive `sessions.json`-Speicher, JSONL-Transkriptpfade oder Listen
    von Sitzungsdateien offengelegt haben. Laufzeit-Plugins sollten die Sitzungsidentität und SDK-Laufzeit-
    Helper verwenden, statt aktive Dateien aufzulösen oder zu verändern.

    | Zu migrierende Schnittstelle | Ersatz |
    | ----------------- | ----------- |
    | Veraltete `loadSessionStore(...)`, `updateSessionStore(...)` und `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`, `listSessionEntries(...)` und Sitzungsmutationen auf Zeilenebene. |
    | Veraltetes `resolveSessionFilePath(...)` | Sitzungsidentität (`sessionKey`, `sessionId` und SDK-Laufzeitziel-Helper) sowie Gateway-Methoden, die auf der aktuellen Sitzung arbeiten. |
    | Entferntes `saveSessionStore(...)` | Gateway-eigene Sitzungslaufzeit-APIs; Plugin-Code sollte den Sitzungsstatus über dokumentierte Laufzeit-/Kontext-Helper abfragen oder verändern, statt die aktive Speicherdatei zu schreiben. |
    | Entfernte `resolveSessionTranscriptPathInDir(...)` und `resolveAndPersistSessionFile(...)` | Sitzungsidentität und Gateway-Methoden, die auf der aktuellen Sitzung arbeiten. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Identitätsgestützte Transkriptleser, die vom aktuellen Laufzeitkontext bereitgestellt werden, oder Gateway-Verlaufs-/Sitzungsmethoden, wenn sich das Plugin außerhalb des Eigentümerpfads des Transkripts befindet. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` mit `agentId`, `sessionKey` und `sessionId`. |
    | Speichersynchronisierungseingaben wie `sessionFiles` | Vom Host bereitgestellte identitätsgestützte Transkript-/Sitzungsquellen; durchsuchen Sie für Live-Sitzungen keine aktiven JSONL-Dateien. |
    | Laufzeitoptionen namens `transcriptPath` oder `sessionFile` für aktive Sitzungen | `sessionTarget`-/Laufzeitzielobjekte, die eine speicherneutrale Sitzungsidentität enthalten. |

    Alte JSONL-Transkriptdateien bleiben als Import-, Archiv-, Export- und
    Support-Artefakte gültig. Sie sind nicht mehr der dauerhafte Laufzeitvertrag für
    aktive Sitzungen.

    Mit `v2026.7.1-beta.5` veröffentlichte offizielle Plugins importierten die vier
    oben genannten veralteten Helper. `openclaw/plugin-sdk/session-store-runtime` erhält
    genau diese Brücke bis zum 2026-10-12 aufrecht; neue Plugins müssen die Ersatzlösungen verwenden.
    `resolveStorePath(...)` bleibt ein unterstützter SDK-Helper und ist nicht Teil
    dieser Veraltung.

    `openclaw plugins inspect --all --runtime` meldet nicht gebündelte Plugins, deren
    Ladefehler oder Diagnosen weiterhin auf diese entfernten Datei-APIs verweisen. Der
    Beratungslauf `@openclaw/plugin-inspector` muss Version `0.3.17` oder
    neuer verwenden, damit Scans externer Pakete vor der Veröffentlichung auch Helper für vollständige Sitzungsspeicher,
    Helper für Sitzungsdateipfade, alte Transkriptdateiziele und Low-Level-
    Transkript-Helper kennzeichnen.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-TaskFlow-
    Zugriff zurück.

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

    Die alten Aliase wurden im Juli 2026 entfernt.

  </Accordion>

  <Accordion title="Eingebettete Erweiterungsfabriken -> Middleware für Agent-Tool-Ergebnisse">
    Dies wird unter [Migrationsanleitung](#how-to-migrate) weiter oben behandelt. Der Vollständigkeit
    halber hier aufgeführt: Der entfernte, ausschließlich für eingebettete Runner bestimmte Pfad
    `api.registerEmbeddedExtensionFactory(...)` wird durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Laufzeitliste
    in `contracts.agentToolResultMiddleware` ersetzt.
  </Accordion>

  <Accordion title="OpenClawSchemaType-Alias -> OpenClawConfig">
    Der Root-SDK-Alias `OpenClawSchemaType` wurde entfernt. Verwenden Sie den kanonischen
    Namen `OpenClawConfig`.

    ```typescript
    // Vorher
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Nachher
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Veraltungen auf Erweiterungsebene (innerhalb gebündelter Channel-/Provider-Plugins unter
`extensions/`) werden in ihren eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie wirken sich nicht auf Verträge für Drittanbieter-Plugins aus und werden hier
nicht aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt verwenden, lesen Sie vor
dem Upgrade die Veraltungskommentare in diesem Barrel.
</Note>

## Migration von Talk und Echtzeit-Sprache

Echtzeit-Sprachkommunikation, Telefonie, Meetings und browserbasierter Talk-Code verwenden gemeinsam einen Talk-
Sitzungscontroller, der von `openclaw/plugin-sdk/realtime-voice` exportiert wird. Der
Controller verwaltet die gemeinsame Talk-Ereignishülle, den Status des aktiven Turns, den Erfassungs-
status, den Ausgab_audio-Status, den Verlauf der letzten Ereignisse und die Zurückweisung veralteter Turns.
Provider-Plugins verwalten anbieterspezifische Echtzeitsitzungen. Browser-Meeting-Plugins
verwenden `openclaw/plugin-sdk/meeting-runtime` für Sitzungs-, Browser-, Audio-, Node-Host-,
Agent-Consult- und Sprachanrufmechanismen und implementieren anschließend `MeetingPlatformAdapter`
für URL-Regeln, DOM-Skripte, die Zuordnung manueller Aktionen, Untertitel, Erstellung und Einwahl-
pläne. Plattform-REST-APIs, OAuth, Artefakte, Selektoren und Wire-Namen verbleiben im
Plugin. Browser-Berechtigungspläne erhalten die angeforderte Meeting-URL, damit jede
Plattform ausschließlich ihre exakt unterstützten Ursprünge freigeben kann. Sitzungslaufzeiten müssen außerdem
den plattformspezifischen Live-Zustand nach einem bestätigten Verlassen des Browsers normalisieren;
historische Transkriptfelder dürfen erhalten bleiben, aber die Bereitschaft für Untertitel und Audio darf
nach dem Verlassen nicht aktiv bleiben.

Alle gebündelten Oberflächen verwenden den gemeinsamen Controller: Browser-Relay,
Übergabe verwalteter Räume, Echtzeit-Sprachanrufe, Streaming-STT für Sprachanrufe, Google
Meet in Echtzeit und natives Push-to-Talk. Das Gateway kündigt einen einzigen Live-Talk-Ereignis-
kanal in `hello-ok.features.events` an: `talk.event`.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, sofern
nicht ein Low-Level-Adapter oder ein Test-Fixture implementiert wird. Verwenden Sie den gemeinsamen Controller, damit
Turn-bezogene Ereignisse nicht ohne Turn-ID ausgegeben werden können, veraltete `turnEnd`- /
`turnCancel`-Aufrufe keinen neueren aktiven Turn löschen können und Ereignisse des Ausgab_audio-
Lebenszyklus über Telefonie, Meetings, Browser-Relay,
Übergabe verwalteter Räume und native Talk-Clients hinweg konsistent bleiben.

Die öffentliche API-Struktur:

```typescript
// Vom Gateway verwaltete Talk-Sitzungs-API.
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

// Vom Client verwaltete Provider-Sitzungs-API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Browserseitig verwaltete WebRTC-/Provider-WebSocket-Sitzungen verwenden `talk.client.create`,
da der Browser die Provider-Aushandlung und den Medientransport verwaltet, während das
Gateway Anmeldedaten, Anweisungen und Tool-Richtlinien verwaltet. `talk.session.*` ist
die gemeinsame, vom Gateway verwaltete Oberfläche für Gateway-Relay-Echtzeitkommunikation, Gateway-Relay-
Transkription und native STT-/TTS-Sitzungen verwalteter Räume.

Legacy-Konfigurationen, die Echtzeitselektoren neben `talk.provider` /
`talk.providers` platzieren, sollten mit `openclaw doctor --fix` repariert werden; Talk zur Laufzeit
interpretiert die Konfiguration von Sprach-/TTS-Providern nicht als Konfiguration von Echtzeit-Providern um.

Die unterstützten `talk.session.create`-Kombinationen sind bewusst begrenzt:

| Modus           | Transport       | Brain           | Verantwortlicher    | Hinweise                                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Vollduplex-Provider-Audio wird über das Gateway überbrückt; Tool-Aufrufe werden über das Agent-Consult-Tool weitergeleitet.          |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabeaudio und empfangen Transkriptereignisse.                                                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Nativer/Client-Raum | Push-to-Talk- und Walkie-Talkie-artige Räume, in denen der Client Erfassung/Wiedergabe und das Gateway den Turn-Status verwaltet.    |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Nativer/Client-Raum | Nur für Administratoren vorgesehener Raummodus für vertrauenswürdige Erstanbieter-Oberflächen, die Gateway-Tool-Aktionen direkt ausführen. |

Methodenzuordnung für Leser, die von den älteren `talk.realtime.*`- /
`talk.transcription.*`- / `talk.handoff.*`-Familien migrieren (alle entfernt):

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

Das vereinheitlichte Steuerungsvokabular ist ebenfalls bewusst eng gefasst:

| Methode                         | Gilt für                                                | Vertrag                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Fügt der Provider-Sitzung, die derselben Gateway-Verbindung gehört, einen base64-codierten PCM-Audioblock hinzu.                                                                                                           |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Startet einen Benutzer-Turn in einem verwalteten Raum.                                                                                                                                                                     |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beendet den aktiven Turn nach der Prüfung auf einen veralteten Turn.                                                                                                                                                        |
| `talk.session.cancelTurn`       | alle vom Gateway verwalteten Sitzungen                   | Bricht aktive Erfassungs-, Provider-, Agenten- und TTS-Arbeit für einen Turn ab.                                                                                                                                            |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppt die Audioausgabe des Assistenten, ohne den Benutzer-Turn zwingend zu beenden.                                                                                                                                        |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließt einen Provider-Tool-Aufruf nach einem von seiner Bridge bereitgestellten asynchronen Abschluss ab; übergeben Sie `options.willContinue` für eine Zwischenausgabe oder, sofern unterstützt, `options.suppressResponse`, um eine weitere Assistentenantwort zu vermeiden. |
| `talk.session.steer`            | agentengestützte Talk-Sitzungen                          | Sendet die gesprochene Steuerung `status`, `steer`, `cancel` oder `followup` an den aktiven eingebetteten Lauf, der aus der Talk-Sitzung aufgelöst wurde.                           |
| `talk.session.close`            | alle vereinheitlichten Sitzungen                         | Stoppt Relay-Sitzungen oder widerruft den Status verwalteter Räume und verwirft anschließend die vereinheitlichte Sitzungs-ID.                                                                                              |

Führen Sie keine Sonderfälle für Provider oder Plattformen im Kern ein, um dies zu ermöglichen.
Der Kern verwaltet die Semantik von Talk-Sitzungen. Provider-Plugins verwalten die Einrichtung von Anbietersitzungen.
Sprachanruf und Google Meet verwalten Telefonie-/Meeting-Adapter. Browser- und native
Apps verwalten die UX für Geräteerfassung und -wiedergabe.

## Zeitplan für die Entfernung

| Zeitpunkt                                   | Vorgang                                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Jetzt**                                   | Veraltete Oberflächen mit Warnfunktion geben Laufzeitwarnungen aus; Repository-Prüfungen weisen veraltete SDK-Importe aus dem Kern und gebündelten Plugins zurück. |
| **`removeAfter`-Datum jedes Kompatibilitätsdatensatzes** | Die jeweilige Oberfläche kann entfernt werden; `pnpm plugins:boundary-report --fail-on-eligible-compat` lässt die CI nach Ablauf des Datums fehlschlagen.    |
| **Nächste Hauptversion**                    | Alle noch nicht migrierten Oberflächen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl.                              |

Für die verbleibenden öffentlichen SDK-Unterpfade unten gelten Registry-gestützte Entfernungszeiträume.
Die Zeilen vom 30. Juli wurden nach ihrer frühen, von den Maintainern genehmigten Bereinigung entfernt:
Nicht verwendete Unterpfade wurden gelöscht, frühere Kompatibilitätsaliase wurden gelöscht und
nur gebündelte Module wurden zu privaten lokalen Build-Zuordnungen herabgestuft.

| `removeAfter` | Stufe                              | SDK-Unterpfade                                                                                                                                                          |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | Frühere Kompatibilitätsveraltungen | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | Frühere Kompatibilitätsveraltungen | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

Alle Kern-Plugins wurden bereits migriert. Externe Plugins sollten
vor der nächsten Hauptversion migriert werden. Führen Sie `pnpm plugins:boundary-report` aus, um zu sehen, welche
Kompatibilitätsdatensätze für die von Ihrem Plugin verwendeten Oberflächen am ehesten fällig sind.

## Warnungen vorübergehend unterdrücken

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist eine vorübergehende Ausweichlösung, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) - erstellen Sie Ihr erstes Plugin
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Referenz für Subpfadimporte
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) - Kanal-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
- [Interner Aufbau von Plugins](/de/plugins/architecture) - detaillierter Einblick in die Architektur
- [Plugin-Manifest](/de/plugins/manifest) - Referenz für das Manifest-Schema
