---
read_when:
    - Sie pflegen ein OpenClaw-Plugin
    - Sie sehen eine Plugin-Kompatibilitätswarnung
    - Sie planen eine Migration des Plugin-SDK oder Manifests
summary: Plugin-Kompatibilitätsverträge, Metadaten zur Einstellung und Migrationserwartungen
title: Plugin-Kompatibilität
x-i18n:
    generated_at: "2026-07-24T05:04:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1554105e3499dd608237d638174b167d9a78c227fe05668ce1159d466a1f8c10
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw bindet ältere Plugin-Verträge über benannte Kompatibilitätsadapter
ein, bevor sie entfernt werden. Dies schützt vorhandene gebündelte und externe
Plugins, während sich die Verträge für SDK, Manifest, Einrichtung, Konfiguration
und Agent-Runtime weiterentwickeln.

## Kompatibilitätsregister

Plugin-Kompatibilitätsverträge werden im Kernregister unter
`src/plugins/compat/registry.ts` nachverfolgt. Jeder Eintrag enthält:

- einen stabilen Kompatibilitätscode
- Status: `active`, `deprecated`, `removal-pending` oder `removed`
- Verantwortlicher: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` oder `core`
- Einführungs- und Einstellungsdaten, sofern zutreffend
- Hinweise zum Ersatz
- Dokumentation, Diagnosefunktionen und Tests, die das alte und neue Verhalten abdecken

Das Register dient als Quelle für die Planung durch Maintainer und zukünftige
Prüfungen durch den Plugin-Inspektor. Wenn sich ein Plugin-bezogenes Verhalten
ändert, fügen Sie den Kompatibilitätseintrag in derselben Änderung hinzu oder
aktualisieren Sie ihn, in der auch der Adapter hinzugefügt wird.

Kompatibilität für Doctor-Reparaturen und -Migrationen wird separat unter
`src/commands/doctor/shared/deprecation-compat.ts` nachverfolgt. Diese Einträge decken alte
Konfigurationsstrukturen, Installationsbuch-Layouts und Reparatur-Shims ab,
die möglicherweise verfügbar bleiben müssen, nachdem der
Runtime-Kompatibilitätspfad entfernt wurde.

Release-Prüfungen sollten beide Register prüfen. Löschen Sie eine
Doctor-Migration nicht allein deshalb, weil der entsprechende Runtime- oder
Konfigurationskompatibilitätseintrag abgelaufen ist; prüfen Sie zunächst, ob
noch ein unterstützter Upgrade-Pfad vorhanden ist, der die Reparatur benötigt.
Validieren Sie bei der Release-Planung auch jede Ersatzanmerkung erneut, da
sich die Plugin-Verantwortung und der Konfigurationsumfang ändern können,
wenn Provider und Kanäle aus dem Kern ausgelagert werden.

## Einstellungsrichtlinie

OpenClaw sollte einen dokumentierten Plugin-Vertrag nicht in demselben Release
entfernen, in dem sein Ersatz eingeführt wird. Migrationsreihenfolge:

1. Den neuen Vertrag hinzufügen.
2. Das alte Verhalten über einen benannten Kompatibilitätsadapter eingebunden lassen.
3. Diagnosen oder Warnungen ausgeben, wenn Plugin-Autoren handeln können.
4. Den Ersatz und den Zeitplan dokumentieren.
5. Sowohl den alten als auch den neuen Pfad testen.
6. Das angekündigte Migrationsfenster abwarten.
7. Nur mit ausdrücklicher Genehmigung für ein inkompatibles Release entfernen.

Als veraltet markierte Einträge müssen ein Startdatum für die Warnung, einen
Ersatz, einen Dokumentationslink und ein endgültiges Entfernungsdatum
enthalten, das höchstens drei Monate nach Beginn der Warnung liegt. Fügen Sie
keinen als veraltet markierten Kompatibilitätspfad mit einem unbefristeten
Entfernungsfenster hinzu, es sei denn, die Maintainer entscheiden ausdrücklich,
dass es sich um dauerhafte Kompatibilität handelt, und markieren ihn stattdessen
als `active`.

## Aktuelle Kompatibilitätsbereiche

Bei der Prüfung im Juli 2026 wurden die abgelaufenen Aliasse für das Root-SDK,
Manifest, Provider, Runtime, Registry-Flags und Plugin-eigene Webkonfigurationen
entfernt. Doctor-Migrationen werden weiterhin separat nachverfolgt, damit
unterstützte Upgrade-Pfade alte Konfigurationen weiterhin reparieren können.

Die verbleibenden datierten Kompatibilitätsbereiche sind:

- die im Migrationsleitfaden aufgeführten SDK-Unterpfadfenster für August und September
- die Hook-Aliasse `api.on("deactivate", ...)` und `api.on("subagent_spawning", ...)`
- speicherspezifische Embedding-Registrierung und die Session-Store-Brücke aus beta.5
- die nachfolgend beschriebenen Aliasse für eingehende WhatsApp-Callbacks
- explizite Analyse von Kanalzielen und `openclaw/plugin-sdk/messaging-targets`
- eingebettete Pi-Agent-Aliasse
- die ausgelieferten SDK-Aliasse des Agent-Harness, deren Entfernung noch eine neue
  extern dokumentierte Migrationsentscheidung erfordert

Aktive, undatierte Registereinträge decken unterstütztes Verhalten statt
Entfernungsrückstände ab, darunter Aktivierungshinweise, Plugin-Erfassung,
Aktivierung gebündelter Plugins und der generierte Fallback für die
Kanalkonfiguration.

### Flache Aliasse für eingehende WhatsApp-Callbacks

WhatsApp-Runtime-Callbacks liefern `WebInboundMessage`: die kanonischen
verschachtelten Kontexte `event`, `payload`, `quote`, `group` und `platform` sowie
als veraltet markierte flache Aliasse für die ausgelieferten Callback-Felder.
Neuer Callback-Code sollte die verschachtelten Kontexte lesen. Code, der
saubere verschachtelte Callback-Nachrichten erstellt, kann `WebInboundCallbackMessage`
verwenden; Kompatibilitäts-Listener, die weiterhin alte flache Test- oder
Plugin-Nachrichten einspeisen, sollten `LegacyFlatWebInboundMessage` oder
`WebInboundMessageInput` verwenden.

Die flachen Aliasse bleiben bis zum **2026-08-30** verfügbar; dieses Fenster
gilt nur für den Zugriff über flache Aliasse, nicht für die verschachtelte
Struktur, die den kanonischen Runtime-Vertrag darstellt. Die
TypeScript-Annotation `@deprecated` jedes flachen Alias nennt dessen
genauen verschachtelten Ersatz. Häufige Beispiele:

- `id`, `timestamp` und `isBatched` werden unter `event` verschoben.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  und `untrustedStructuredContext` werden unter `payload` verschoben.
- `to`, `chatId`, Absender-/Selbstfelder, `sendComposing`, `reply(...)` und
  `sendMedia(...)` werden unter `platform` verschoben.
- Die Felder von `replyTo*` werden unter `quote` verschoben; Felder für Gruppenbetreff, Teilnehmer und Erwähnungen
  werden unter `group` verschoben.

`payload.untrustedStructuredContext` wird aus eingehenden Provider-
Nutzdaten extrahiert. Plugins sollten `label`, `source` und `type` prüfen, bevor
sie dessen `payload` als maßgeblich behandeln.

### Zulassungsfelder für eingehende WhatsApp-Nachrichten

Akzeptierte WhatsApp-Callback-Nachrichten enthalten `admission`, eine
öffentlich unbedenkliche Hülle für die Zugriffskontrollentscheidung, durch die
die Nachricht zugelassen wurde. Neuer Callback-Code sollte Zulassungsfakten aus
`msg.admission` statt aus den älteren Zulassungsfeldern der obersten Ebene
lesen.

Die Felder der obersten Ebene bleiben bis zum **2026-08-30** verfügbar. Die
TypeScript-Annotation `@deprecated` jedes Feldes nennt dessen Ersatz:

- `from` und `conversationId` werden nach `admission.conversation.id` verschoben.
- `accountId` wird nach `admission.accountId` verschoben.
- `accessControlPassed` ist eine abgeleitete Kompatibilitätsansicht von
  `admission.ingress.decision === "allow"`; bei Nachrichten, die bereits
  `admission` enthalten, schreibt das Setzen des alten booleschen Werts
  den Eingangsgraphen nicht neu.
- `chatType` wird nach `admission.conversation.kind` verschoben.

## Plugin-Inspektor-Paket

Der Plugin-Inspektor sollte außerhalb des OpenClaw-Kern-Repositorys als
separates Paket/Repository liegen und auf den versionierten Kompatibilitäts-
und Manifestverträgen basieren. Die CLI sollte vom ersten Tag an wie folgt
lauten:

```sh
openclaw-plugin-inspector ./my-plugin
```

Sie sollte die Manifest-/Schemavalidierung, die geprüfte
Vertragskompatibilitätsversion, Prüfungen der Installations-/Quellmetadaten,
Importprüfungen für selten ausgeführte Pfade sowie Einstellungs-/
Kompatibilitätswarnungen ausgeben. Verwenden Sie `--json` für eine
stabile maschinenlesbare Ausgabe in CI-Anmerkungen. Der OpenClaw-Kern sollte
Verträge und Fixtures bereitstellen, die der Inspektor verwenden kann, aber
das Inspektor-Binärprogramm nicht über das Hauptpaket `openclaw`
veröffentlichen.

### Abnahmepfad für Maintainer

Verwenden Sie für den Abnahmepfad installierbarer Pakete eine durch Crabbox
gestützte Blacksmith Testbox, wenn Sie den externen Inspektor anhand von
OpenClaw-Plugin-Paketen validieren. Führen Sie ihn nach dem Erstellen des
Pakets aus einem sauberen OpenClaw-Checkout aus:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Dieser Pfad sollte für Maintainer optional bleiben, da er ein externes
npm-Paket installiert und möglicherweise außerhalb des Repositorys geklonte
Plugin-Pakete prüft. Die lokalen Repository-Schutzprüfungen decken die
SDK-Exportzuordnung, die Metadaten des Kompatibilitätsregisters, den Abbau
veralteter SDK-Importe und die Importgrenzen gebündelter Erweiterungen ab;
der Testbox-Nachweis für den Inspektor deckt das Paket so ab, wie externe
Plugin-Autoren es verwenden.

## Versionshinweise

Die Versionshinweise sollten bevorstehende Plugin-Einstellungen mit Zieldaten
und Links zur Migrationsdokumentation enthalten, bevor ein Kompatibilitätspfad
in `removal-pending` oder `removed` übergeht.
