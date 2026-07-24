---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus native Codex-Plugins verwenden.
    - Sie migrieren aus dem Quellcode installierte, von OpenAI kuratierte Codex-Plugins
    - Sie konfigurieren ein vorhandenes Codex-Plugin in einem Workspace-Verzeichnis.
    - Sie beheben Probleme mit codexPlugins, dem App-Inventar, destruktiven Aktionen oder der Diagnose von Plugin-Apps.
summary: Native Codex-Plugins für OpenClaw-Agenten im Codex-Modus konfigurieren
title: Native Codex-Plugins
x-i18n:
    generated_at: "2026-07-24T04:01:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex-Plugin-Unterstützung ermöglicht es einem OpenClaw-Agenten im Codex-Modus, die eigenen App- und Plugin-Funktionen des Codex
app-server innerhalb desselben Codex-Threads zu verwenden, der den
OpenClaw-Turn verarbeitet. Plugin-Aufrufe verbleiben im nativen Codex-Transkript;
Codex app-server ist für die App-gestützte MCP-Ausführung zuständig. OpenClaw übersetzt
Codex-Plugins nicht in synthetische dynamische `codex_plugin_*`-OpenClaw-Tools.

Verwenden Sie diese Seite, nachdem das grundlegende [Codex-Harness](/de/plugins/codex-harness)
funktioniert.

## Anforderungen

- Die Agenten-Runtime muss das native Codex-Harness sein.
- `plugins.entries.codex.enabled` ist `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` ist `true`.
- Der Codex app-server des Ziels kann das erwartete Marketplace-, Plugin- und
  App-Inventar sehen.
- Die Migration unterstützt nur `openai-curated`-Plugins, die sie im Codex-Ausgangsverzeichnis
  als aus dem Quellcode installiert erkannt hat.
- Manuell konfigurierte `workspace-directory`-Plugins erfordern einen Codex app-server,
  dessen `plugin/list` `marketplaceKinds` akzeptiert und dessen pfadlose Workspace-
  Zusammenfassungen `remotePluginId` enthalten. Das Plugin muss bereits installiert und
  aktiviert sein, und seine zugehörigen Apps müssen in `app/list` zugänglich sein.

`codexPlugins` hat keine Auswirkung auf Läufe mit dem OpenClaw-Provider, ACP-Konversations-
Bindungen oder andere Harnesses, da diese Pfade niemals Codex-
app-server-Threads mit nativer `apps`-Konfiguration erstellen.

Codex-Konto, App-Verfügbarkeit und Workspace-App-/Plugin-Steuerung auf OpenAI-Seite
stammen aus dem angemeldeten Codex-Konto. Weitere Informationen zum OpenAI-Konto-
und Administrationsmodell finden Sie unter
[Codex mit Ihrem ChatGPT-Tarif verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Schnellstart

Vorschau der Migration aus dem Codex-Ausgangsverzeichnis:

```bash
openclaw migrate codex --dry-run
```

Fügen Sie `--verify-plugin-apps` hinzu, damit die Migration die Quell-`app/list` aufruft und
verlangt, dass jede zugehörige App vorhanden, aktiviert und zugänglich ist, bevor
die native Aktivierung geplant wird:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Wenden Sie die Migration an, wenn der Plan korrekt aussieht:

```bash
openclaw migrate apply codex --yes
```

Die Migration schreibt explizite `codexPlugins`-Einträge für geeignete Plugins und
ruft Codex app-server `plugin/install` für ausgewählte Plugins auf. Eine migrierte
Konfiguration sieht folgendermaßen aus:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Die Migration bleibt auf `openai-curated` beschränkt. Um ein vorhandenes
`workspace-directory`-Plugin zu verwenden, fügen Sie es manuell mit der exakten
Marketplace-qualifizierten `summary.id` hinzu, die von `plugin/list` zurückgegeben wird. Wenn
Codex beispielsweise `example-plugin@workspace-directory` zurückgibt, konfigurieren Sie diesen vollständigen
Wert anstelle seines Anzeigenamens:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw ruft weder `plugin/install` auf noch startet es die Authentifizierung für ein
`workspace-directory`-Plugin. Installieren, aktivieren und authentifizieren Sie es in Codex,
bevor Sie die OpenClaw-Richtlinie hinzufügen oder aktivieren. OpenClaw hält Apps verborgen, wenn
in der Antwort der exakte Marketplace, die Plugin-ID, die Detail-ID oder der Nachweis
der App-Bereitschaft fehlt. Wenn Codex die explizite Workspace-Anfrage `plugin/list` ablehnt,
meldet OpenClaw für jedes aktivierte Workspace-Plugin `marketplace_missing` und
hält unabhängig erkannte kuratierte Plugins weiterhin verfügbar.

Nach einer Änderung an `codexPlugins` übernehmen neue Codex-Konversationen automatisch die aktualisierte
App-Gruppe. Führen Sie `/new` oder `/reset` aus, um die aktuelle
Konversation zu aktualisieren. Für Änderungen an der Aktivierung oder Deaktivierung von Plugins
ist kein Neustart des Gateways erforderlich.

## Plugins über den Chat verwalten

`/codex plugins` prüft oder ändert konfigurierte native Codex-Plugins aus demselben
Chat, in dem Sie das Codex-Harness bedienen:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` ist ein Alias für `/codex plugins list`. Die Liste zeigt für jedes
konfigurierte Plugin den Schlüssel, den Ein-/Aus-Status, den Codex-Plugin-Namen und den Marketplace
aus `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` schreiben ausschließlich in `~/.openclaw/openclaw.json`; sie bearbeiten niemals
`~/.codex/config.toml` und installieren keine neuen Codex-Plugins. Nur der Eigentümer oder ein
Gateway-Client mit dem Geltungsbereich `operator.admin` kann sie ausführen.

Durch das Aktivieren eines konfigurierten Plugins wird auch der globale Schalter `codexPlugins.enabled`
aktiviert. Wenn ein kuratiertes Plugin deaktiviert geschrieben wurde, weil die Migration
`auth_required` zurückgegeben hat, autorisieren Sie die App erneut in Codex, bevor Sie sie in OpenClaw aktivieren.
Bei einem `workspace-directory`-Eintrag ändert dessen Aktivierung hier nur die OpenClaw-
Richtlinie; das Plugin und die App müssen bereits in Codex aktiv sein.

## Funktionsweise der nativen Plugin-Einrichtung

Die Integration verfolgt drei Zustände:

| Zustand     | Bedeutung                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Installiert | Codex verfügt über das Plugin-Bundle in der Runtime des Ziel-app-server.                                                             |
| Aktiviert   | Codex meldet das Plugin als aktiviert, und die OpenClaw-Konfiguration erlaubt es für Codex-Harness-Turns.                            |
| Zugänglich  | Codex app-server bestätigt, dass die App-Einträge des Plugins für das aktive Konto verfügbar sind und der konfigurierten Plugin-Identität zugeordnet werden können. |

Für `openai-curated`-Plugins ist die Migration der dauerhafte Installations-/Eignungsschritt:

- Während der Planung liest OpenClaw die Details von Codex `plugin/read` in der Quelle und
  prüft, ob das Konto des Quell-Codex-app-server ein ChatGPT-Abonnementkonto
  ist. Bei einer Antwort mit einem Nicht-ChatGPT-Konto oder einem fehlenden Konto werden App-gestützte
  Plugins mit `codex_subscription_required` übersprungen.
- Standardmäßig überspringt die Migration den Quellaufruf `app/list`: App-gestützte Quell-
  Plugins, die die Kontoprüfung bestehen, werden ohne Prüfung der Zugänglichkeit der Quell-App
  geplant, und Transportfehler bei der Kontoabfrage führen zum Überspringen mit
  `codex_account_unavailable`.
- Mit `--verify-plugin-apps` erstellt die Migration einen neuen Quell-Snapshot `app/list`
  und verlangt, dass jede zugehörige App vorhanden, aktiviert und
  zugänglich ist, bevor die native Aktivierung geplant wird. Transportfehler bei der Kontoabfrage
  fallen dann auf die Prüfung des Quell-App-Inventars zurück, anstatt
  direkt zum Überspringen zu führen.

Für `workspace-directory`-Plugins erfolgt die Einrichtung außerhalb von OpenClaw. OpenClaw
fragt diesen Marketplace nur ab, wenn mindestens ein aktivierter Workspace-Eintrag
konfiguriert ist, löst jedes Plugin anhand der exakten `summary.id` auf und verwendet die vorhandenen
Prüfungen für die Eigentümerschaft von `plugin/read` und die Bereitschaft von `app/list` erneut. Ein nicht installiertes,
deaktiviertes, unzugängliches oder nicht authentifiziertes Plugin stellt keine Apps bereit; OpenClaw
versucht weder eine Installation noch eine Authentifizierung.

Das App-Inventar der Runtime ist sowohl für migrierte kuratierte Plugins als auch für manuell
konfigurierte Workspace-Plugins die Zugänglichkeitsprüfung der Zielsitzung. Bei der Einrichtung der Codex-
Harness-Sitzung wird aus den aktivierten und zugänglichen Plugin-Apps eine restriktive
Thread-App-Konfiguration berechnet; diese wird nicht bei jedem Turn neu berechnet, daher
wirken sich `/codex plugins enable`/`disable` nur auf
neue Codex-Konversationen aus. Verwenden Sie `/new` oder `/reset`, um die Änderung in der
aktuellen Konversation zu übernehmen.

## V1-Unterstützungsgrenze

- Nur `openai-curated`-Plugins, die bereits im app-server-Inventar des Codex-Ausgangssystems
  installiert sind, kommen für die Migration infrage.
- Die Runtime unterstützt außerdem explizite `workspace-directory`-Einträge auf app-server-
  Builds, deren `plugin/list` `marketplaceKinds` implementiert und
  `remotePluginId` für pfadlose Workspace-Zusammenfassungen zurückgibt. Diese Einträge müssen
  ihre exakte Marketplace-qualifizierte `summary.id` verwenden und bereits installiert,
  aktiviert und für Apps zugänglich sein. Eine abgelehnte Workspace-Listenanfrage erzeugt die
  vorhandene pluginspezifische Diagnose `marketplace_missing`; bei fehlendem Marketplace-,
  Plugin-, Detail- oder App-Nachweis wird keine Workspace-App bereitgestellt. Das kuratierte Inventar
  aus der standardmäßigen Listenanfrage bleibt nutzbar.
- App-gestützte Quell-Plugins müssen die Abonnementprüfung während der Migration bestehen.
  `--verify-plugin-apps` fügt die Prüfung des Quell-App-Inventars hinzu. Konten, die an der
  Abonnementprüfung scheitern, sowie im Prüfmodus unzugängliche, deaktivierte oder fehlende Quell-
  Apps oder Fehler bei der Aktualisierung des App-Inventars werden als übersprungene manuelle
  Elemente statt als aktivierte Konfigurationseinträge gemeldet. Nicht lesbare Plugin-Details werden
  vor der Prüfung des App-Inventars übersprungen.
- Die Migration schreibt explizite Plugin-Identitäten (`marketplaceName` und
  `pluginName`); sie schreibt keine lokalen `marketplacePath`-Cache-Pfade.
- `codexPlugins.enabled` ist der einzige globale Aktivierungsschalter; es gibt weder einen
  `plugins["*"]`-Platzhalter noch einen Konfigurationsschlüssel, der beliebige Installations-
  berechtigungen gewährt.
- Nicht kuratierte Marketplaces, zwischengespeicherte Plugin-Bundles, Hooks und Codex-Konfigurations-
  dateien werden im Migrationsbericht zur manuellen Überprüfung beibehalten und nicht
  automatisch aktiviert. Die Runtime akzeptiert manuell konfigurierte `workspace-directory`-
  Einträge; andere Marketplaces werden weiterhin nicht unterstützt.

## App-Inventar und Eigentümerschaft

OpenClaw liest das Codex-App-Inventar über app-server `app/list`, speichert es
eine Stunde lang im Arbeitsspeicher zwischen und aktualisiert veraltete oder fehlende Einträge
asynchron. Der Cache ist prozesslokal; ein Neustart der CLI oder des Gateways
verwirft ihn, und OpenClaw baut ihn beim nächsten Lesevorgang von `app/list` neu auf.

Migration und Runtime verwenden getrennte Cache-Schlüssel:

- Die Überprüfung der Quellmigration verwendet das Codex-Ausgangsverzeichnis und die Start-
  optionen der Quelle. Sie wird nur mit `--verify-plugin-apps` ausgeführt und erzwingt für diesen Planungslauf
  eine neue Traversierung der Quell-`app/list`.
- Die Einrichtung der Ziel-Runtime verwendet beim Erstellen der Thread-App-Konfiguration die Codex-app-server-
  Identität des Zielagenten. Die Aktivierung kuratierter Plugins invalidiert diesen
  Ziel-Cache-Schlüssel und erzwingt anschließend nach `plugin/install` dessen Aktualisierung.
  Bei der Einrichtung von `workspace-directory` wird dieser Aktivierungspfad nie ausgeführt.

Eine Plugin-App wird nur bereitgestellt, wenn OpenClaw sie durch stabile Eigentümerschaft
dem konfigurierten Plugin zuordnen kann: über eine exakte App-ID aus den Plugin-Details, einen bekannten
MCP-Servernamen oder eindeutige stabile Metadaten. Eine Zuordnung nur anhand des Anzeigenamens oder eine mehrdeutige
Eigentümerschaft wird ausgeschlossen, bis die nächste Inventaraktualisierung die Eigentümerschaft bestätigt.

## Apps verbundener Konten

Von Eigentümern betriebene Agenten können alle Apps zulassen, die bereits mit ihrem Codex-
Konto verbunden sind, ohne dass ein passendes Plugin-Paket erforderlich ist:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` erstellt einen vollständigen `app/list`-Snapshot, wenn ein neuer nativer
Codex-Thread eingerichtet wird, und lässt nur Apps zu, die für dieses
Konto als zugänglich gekennzeichnet sind. Es installiert, authentifiziert oder aktiviert Apps nicht global. Bestehende
Threads behalten ihre persistierte App-Gruppe; verwenden Sie `/new`, `/reset` oder starten Sie das
Gateway neu, um neu verbundene oder widerrufene Apps zu übernehmen.

Konto-Apps übernehmen den globalen Wert `codexPlugins.allow_destructive_actions`,
der `true`, `false`, `"auto"` oder `"ask"` akzeptiert. Eine explizite Richtlinie pro Plugin
überschreibt die globale Richtlinie für sich überschneidende App-IDs. Fehler bei der Bestandserfassung führen
zu einer geschlossenen Ablehnung, statt auf einen uneingeschränkten Standardwert zurückzufallen.

## Konfiguration der Thread-Apps

OpenClaw fügt einen restriktiven `config.apps`-Patch für den Codex-Thread ein:
`_default` ist deaktiviert, und nur Apps, die aktivierten konfigurierten Plugins gehören, oder
zugängliche Konto-Apps, die durch `allow_all_plugins` zugelassen sind, werden aktiviert.

`destructive_enabled` für jede App stammt aus der wirksamen globalen oder
Plugin-spezifischen `allow_destructive_actions`-Richtlinie; `true`, `"auto"` und `"ask"`
setzen alle `destructive_enabled: true`, während `false` den Wert auf `false` setzt. Codex
erzwingt weiterhin die Metadaten destruktiver Tools aus seinen nativen App-Tool-Annotationen.
`_default` wird mit `open_world_enabled: false` deaktiviert; aktivierte Plugin-Apps
erhalten `open_world_enabled: true`. OpenClaw stellt keinen separaten
Plugin-weiten Richtlinienparameter für eine offene Welt bereit und verwaltet keine Plugin-spezifischen
Sperrlisten mit Namen destruktiver Tools.

Der Tool-Genehmigungsmodus ist für zugelassene Apps standardmäßig automatisch, sodass nicht destruktive
Lese-Tools ohne Genehmigungsaufforderung im selben Thread ausgeführt werden. Destruktive Tools bleiben
durch die `destructive_enabled`-Richtlinie der jeweiligen App gesteuert.

## Richtlinie für destruktive Aktionen

Destruktive Plugin-Abfragen sind für konfigurierte Codex-
Plugins standardmäßig zulässig, während unsichere Schemas und eine mehrdeutige Zuordnung zu einer geschlossenen Ablehnung führen:

- Der globale Wert `allow_destructive_actions` ist standardmäßig `true`.
- Der Plugin-spezifische Wert `allow_destructive_actions` überschreibt die globale Richtlinie für
  dieses Plugin.
- `false`: OpenClaw gibt eine deterministische Ablehnung zurück.
- `true`: OpenClaw akzeptiert nur sichere Schemas automatisch, die einer Genehmigungsantwort
  zugeordnet werden können, beispielsweise ein boolesches Genehmigungsfeld.
- `"auto"`: OpenClaw stellt Codex destruktive Plugin-Aktionen bereit und
  wandelt anschließend MCP-Genehmigungsabfragen mit nachgewiesener Zuordnung in OpenClaw-Plugin-
  Genehmigungen um, bevor die Codex-Genehmigungsantwort zurückgegeben wird.
- `"ask"`: OpenClaw verwendet dieselbe Codex-Sperrlogik für Schreibvorgänge und destruktive Aktionen wie
  `"auto"`, löscht vor dem Start des Threads dauerhafte Codex-Genehmigungsüberschreibungen pro Tool für die App
  und bietet nur eine einmalige Genehmigung oder Ablehnung an, damit
  dauerhafte Genehmigungen spätere Aufforderungen für Schreibaktionen nicht unterdrücken können. Für jede
  zugelassene App, die `"ask"` verwendet, wählt OpenClaw den Codex-Prüfer für menschliche Genehmigungen
  für diese App aus, damit Codex seine Genehmigungsabfragen an
  OpenClaw sendet; andere Apps und Thread-Genehmigungen außerhalb von Apps behalten ihren konfigurierten
  Prüfer und ihre konfigurierte Richtlinie.
- Eine fehlende Plugin-Identität, eine mehrdeutige Zuordnung, eine fehlende oder nicht übereinstimmende
  Turn-ID oder ein unsicheres Abfrageschema führt zur Ablehnung, statt eine Aufforderung anzuzeigen.

## Fehlerbehebung

| Code                                              | Bedeutung                                                                                                                              | Behebung                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | Die Migration hat das Plugin installiert, aber eine seiner Apps muss noch authentifiziert werden. Der Eintrag wird deaktiviert angelegt, bis Sie die App erneut autorisieren. | Autorisieren Sie die App in Codex erneut und aktivieren Sie anschließend das Plugin in OpenClaw.                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | Mit `--verify-plugin-apps` zeigte der Bestand der Codex-Quell-Apps nicht alle zugehörigen Apps als vorhanden, aktiviert und zugänglich an.         | Autorisieren oder aktivieren Sie die App in Codex erneut und führen Sie anschließend die Migration mit `--verify-plugin-apps` erneut aus.                              |
| `app_inventory_unavailable`                       | Eine strikte Überprüfung der Quell-App wurde angefordert, aber die Aktualisierung des Bestands der Codex-Quell-Apps ist fehlgeschlagen.                                      | Beheben Sie den Zugriff auf den Codex-App-Server der Quelle oder versuchen Sie es ohne `--verify-plugin-apps` erneut, um den schnelleren kontobeschränkten Plan zu akzeptieren.   |
| `codex_subscription_required`                     | Das Konto des Codex-App-Servers der Quelle war kein ChatGPT-Abonnementkonto.                                                          | Melden Sie sich mit einer Abonnementauthentifizierung bei der Codex-App an und führen Sie die Migration erneut aus.                                                  |
| `codex_account_unavailable`                       | Das Konto des Codex-App-Servers der Quelle konnte nicht gelesen werden.                                                                               | Beheben Sie die Authentifizierung des Codex-App-Servers der Quelle oder führen Sie den Vorgang mit `--verify-plugin-apps` erneut aus, damit der Bestand der Quell-Apps über die Eignung entscheidet. |
| `marketplace_missing`, `plugin_missing`           | Marketplace oder exaktes Plugin nicht verfügbar; die explizite Workspace-Kataloganfrage wurde möglicherweise abgelehnt; Workspace-Apps führen zu einer geschlossenen Ablehnung.  | Überprüfen Sie den nachfolgend beschriebenen kompatiblen App-Server-Vertrag und die exakte ID.                                                |
| `plugin_detail_unavailable`                       | OpenClaw konnte die Details zur Plugin-Zuordnung nicht lesen.                                                                                    | Prüfen Sie die Antworten `plugin/list` und `plugin/read` des Ziel-App-Servers.                                             |
| `plugin_disabled`                                 | Codex meldet, dass das Plugin installiert, aber deaktiviert ist.                                                                                     | Eine kuratierte Aktivierung kann dies möglicherweise beheben; aktivieren Sie vor einem erneuten Versuch ein Workspace-Plugin in Codex.                                  |
| `plugin_activation_failed`                        | Die Plugin-Aktivierung wurde nicht abgeschlossen.                                                                                                  | Verwenden Sie die angefügte Diagnose, um zwischen Fehlern des Marketplace, der Authentifizierung, der Aktualisierung oder der Workspace-Bereitschaft zu unterscheiden.                |
| `app_inventory_missing`, `app_inventory_stale`    | Die App-Bereitschaft stammte aus einem leeren oder veralteten Cache.                                                                                     | OpenClaw plant automatisch eine asynchrone Aktualisierung; Plugin-Apps bleiben ausgeschlossen, bis Zuordnung und Bereitschaft bekannt sind.  |
| `app_ownership_ambiguous`                         | Der App-Bestand stimmte nur anhand des Anzeigenamens überein.                                                                                          | Die App bleibt für den Codex-Thread verborgen, bis eine spätere Aktualisierung die Zuordnung bestätigt.                                     |

**Workspace-Plugin ist installiert, aber nicht sichtbar:** Vergewissern Sie sich, dass das Ergebnis
`plugin/list` des Workspace die exakt konfigurierte ID als installiert und aktiviert meldet,
und vergewissern Sie sich anschließend, dass `app/list` jede zugehörige App für dasselbe Codex-
Konto als zugänglich meldet. OpenClaw kann eine zugängliche App für den Thread aktivieren, selbst wenn der
Kontobestand diese App derzeit als deaktiviert meldet. Wenn Sie diesen Zustand geändert haben, nachdem der Gateway den App-
Bestand zwischengespeichert hat, warten Sie auf die stündliche Cache-Aktualisierung oder starten Sie den Gateway neu und verwenden Sie anschließend
`/new` oder `/reset`. OpenClaw repariert oder authentifiziert keine Workspace-Plugins.
Wenn die explizite Anfrage für die Workspace-Liste abgelehnt wird, meldet jeder aktivierte Workspace-
Eintrag `marketplace_missing`; nicht zugehörige kuratierte Einträge werden weiterhin
anhand der Antwort der Standardliste verarbeitet.

Für `plugin_detail_unavailable` muss eine Workspace-Zusammenfassung ohne Pfadangabe
`remotePluginId` enthalten; OpenClaw hält zugehörige Apps verborgen, wenn dieser Selektor oder das
nachfolgende Ergebnis `plugin/read` nicht verfügbar ist. Bei
`plugin_activation_failed` können kuratierte Plugins einen Marketplace-, Authentifizierungs- oder
Aktualisierungsfehler nach der Installation melden. Ein Workspace-Plugin meldet diesen Code, wenn es
noch nicht aktiv ist; installieren, aktivieren und authentifizieren Sie es außerhalb von OpenClaw.

**Konfiguration geändert, aber der Agent kann das Plugin nicht sehen:** Führen Sie `/codex plugins
list` aus, um den konfigurierten Zustand zu bestätigen, und anschließend `/new` oder `/reset`. Bestehende
Codex-Thread-Bindungen behalten die App-Konfiguration bei, mit der sie gestartet wurden, bis OpenClaw
eine neue Harness-Sitzung einrichtet oder eine veraltete Bindung ersetzt.

**Destruktive Aktion wird abgelehnt:** Prüfen Sie die globalen und Plugin-spezifischen
Werte von `allow_destructive_actions`. Selbst mit `true`, `"auto"` oder `"ask"`
führen unsichere Abfrageschemas und eine mehrdeutige Plugin-Identität weiterhin zu einer geschlossenen Ablehnung.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrations-CLI](/de/cli/migrate)
