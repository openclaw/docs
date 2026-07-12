---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus native Codex-Plugins verwenden
    - Sie migrieren aus dem Quellcode installierte, von OpenAI kuratierte Codex-Plugins
    - Sie konfigurieren ein vorhandenes Codex-Plugin im Workspace-Verzeichnis
    - Sie beheben Probleme mit codexPlugins, dem App-Inventar, destruktiven Aktionen oder der Plugin-App-Diagnose.
summary: Native Codex-Plugins für OpenClaw-Agenten im Codex-Modus konfigurieren
title: Native Codex-Plugins
x-i18n:
    generated_at: "2026-07-12T15:32:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Die native Unterstützung für Codex-Plugins ermöglicht es einem OpenClaw-Agenten im Codex-Modus, die app- und Plugin-Funktionen des Codex
app-server innerhalb desselben Codex-Threads zu verwenden, der den
OpenClaw-Durchlauf verarbeitet. Plugin-Aufrufe verbleiben im nativen Codex-Transkript;
Codex app-server verwaltet die App-gestützte MCP-Ausführung. OpenClaw übersetzt
Codex-Plugins nicht in synthetische dynamische OpenClaw-Tools vom Typ `codex_plugin_*`.

Verwenden Sie diese Seite, nachdem das grundlegende [Codex-Harness](/de/plugins/codex-harness)
funktioniert.

## Anforderungen

- Die Agent-Laufzeit muss das native Codex-Harness sein.
- `plugins.entries.codex.enabled` ist `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` ist `true`.
- Der Ziel-Codex-app-server kann das erwartete Marketplace-, Plugin- und
  App-Inventar sehen.
- Die Migration unterstützt nur `openai-curated`-Plugins, die im Codex-Ausgangsverzeichnis
  als aus dem Quellcode installiert erkannt wurden.
- Manuell konfigurierte `workspace-directory`-Plugins erfordern einen Codex-app-server,
  dessen `plugin/list` `marketplaceKinds` akzeptiert und dessen pfadlose Workspace-
  Zusammenfassungen `remotePluginId` enthalten. Das Plugin muss bereits installiert und
  aktiviert sein, und seine zugehörigen Apps müssen in `app/list` zugänglich sein.

`codexPlugins` hat keine Auswirkung auf Läufe mit dem OpenClaw-Provider, ACP-Konversations-
bindungen oder andere Harnesses, da diese Pfade niemals Codex-
app-server-Threads mit nativer `apps`-Konfiguration erstellen.

Das Codex-Konto auf OpenAI-Seite, die App-Verfügbarkeit und die App-/Plugin-Steuerung
für den Workspace stammen aus dem angemeldeten Codex-Konto. Weitere Informationen
zum OpenAI-Konto- und Administrationsmodell finden Sie unter
[Codex mit Ihrem ChatGPT-Tarif verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Schnellstart

Zeigen Sie eine Vorschau der Migration aus dem Codex-Ausgangsverzeichnis an:

```bash
openclaw migrate codex --dry-run
```

Fügen Sie `--verify-plugin-apps` hinzu, damit die Migration `app/list` der Quelle
aufruft und erfordert, dass jede zugehörige App vorhanden, aktiviert und zugänglich
ist, bevor die native Aktivierung geplant wird:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Wenden Sie die Migration an, wenn der Plan korrekt aussieht:

```bash
openclaw migrate apply codex --yes
```

Die Migration schreibt explizite `codexPlugins`-Einträge für geeignete Plugins und
ruft für ausgewählte Plugins `plugin/install` des Codex-app-server auf. Eine migrierte
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
Marketplace-qualifizierten `summary.id` hinzu, die von `plugin/list` zurückgegeben
wird. Wenn Codex beispielsweise `example-plugin@workspace-directory` zurückgibt,
konfigurieren Sie diesen vollständigen Wert anstelle seines Anzeigenamens:

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

OpenClaw ruft für ein `workspace-directory`-Plugin weder `plugin/install` auf noch
startet es die Authentifizierung. Installieren, aktivieren und authentifizieren Sie
es in Codex, bevor Sie die OpenClaw-Richtlinie hinzufügen oder aktivieren. OpenClaw
hält Apps verborgen, wenn in der Antwort der exakte Marketplace, die Plugin-ID, die
Detail-ID oder der Nachweis der App-Bereitschaft fehlt. Wenn Codex die explizite
Workspace-Anfrage an `plugin/list` ablehnt, meldet OpenClaw für jedes aktivierte
Workspace-Plugin `marketplace_missing` und hält unabhängig erkannte kuratierte
Plugins weiterhin verfügbar.

Nach einer Änderung an `codexPlugins` übernehmen neue Codex-Konversationen den
aktualisierten App-Satz automatisch. Führen Sie `/new` oder `/reset` aus, um die
aktuelle Konversation zu aktualisieren. Für Änderungen an der Aktivierung oder
Deaktivierung von Plugins ist kein Neustart des Gateway erforderlich.

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
konfigurierte Plugin den Schlüssel, den Ein-/Aus-Status, den Codex-Plugin-Namen und
den Marketplace aus `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` schreiben nur in `~/.openclaw/openclaw.json`; sie bearbeiten
niemals `~/.codex/config.toml` und installieren keine neuen Codex-Plugins. Nur der
Eigentümer oder ein Gateway-Client mit dem Geltungsbereich `operator.admin` kann sie
ausführen.

Durch das Aktivieren eines konfigurierten Plugins wird auch der globale Schalter
`codexPlugins.enabled` aktiviert. Wenn ein kuratiertes Plugin deaktiviert geschrieben
wurde, weil die Migration `auth_required` zurückgegeben hat, autorisieren Sie die App
in Codex erneut, bevor Sie sie in OpenClaw aktivieren. Bei einem
`workspace-directory`-Eintrag ändert die Aktivierung hier nur die OpenClaw-Richtlinie;
das Plugin und die App müssen bereits in Codex aktiv sein.

## Funktionsweise der nativen Plugin-Einrichtung

Die Integration verfolgt drei Zustände:

| Status      | Bedeutung                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Installiert | Codex verfügt über das Plugin-Paket in der Ziel-app-server-Laufzeit.                                                                  |
| Aktiviert   | Codex meldet das Plugin als aktiviert, und die OpenClaw-Konfiguration lässt es für Codex-Harness-Durchläufe zu.                        |
| Zugänglich  | Codex-app-server bestätigt, dass die App-Einträge des Plugins für das aktive Konto verfügbar sind und der konfigurierten Plugin-Identität zugeordnet werden können. |

Für `openai-curated`-Plugins ist die Migration der dauerhafte Installations- und
Berechtigungsschritt:

- Während der Planung liest OpenClaw die `plugin/read`-Details des Quell-Codex und
  prüft, ob das Konto des Quell-Codex-app-server ein ChatGPT-Abonnementkonto ist.
  Bei einer Antwort mit einem Nicht-ChatGPT-Konto oder einem fehlenden Konto werden
  App-gestützte Plugins mit `codex_subscription_required` übersprungen.
- Standardmäßig überspringt die Migration den Aufruf von `app/list` der Quelle:
  App-gestützte Quell-Plugins, die die Kontoprüfung bestehen, werden ohne Überprüfung
  der Zugänglichkeit der Quell-App geplant, und Übertragungsfehler bei der
  Kontoabfrage führen zum Überspringen mit `codex_account_unavailable`.
- Mit `--verify-plugin-apps` erstellt die Migration einen neuen Snapshot von
  `app/list` der Quelle und erfordert, dass jede zugehörige App vorhanden, aktiviert
  und zugänglich ist, bevor die native Aktivierung geplant wird. Übertragungsfehler
  bei der Kontoabfrage fallen dann auf die Prüfung des App-Inventars der Quelle
  zurück, statt unmittelbar zum Überspringen zu führen.

Für `workspace-directory`-Plugins erfolgt die Einrichtung außerhalb von OpenClaw.
OpenClaw fragt diesen Marketplace nur ab, wenn mindestens ein aktivierter
Workspace-Eintrag konfiguriert ist, löst jedes Plugin anhand der exakten `summary.id`
auf und verwendet die vorhandenen Prüfungen für die `plugin/read`-Eigentümerschaft
und die `app/list`-Bereitschaft erneut. Ein nicht installiertes, deaktiviertes,
unzugängliches oder nicht authentifiziertes Plugin stellt keine Apps bereit;
OpenClaw versucht weder eine Installation noch eine Authentifizierung.

Das App-Inventar der Laufzeit dient sowohl bei migrierten kuratierten Plugins als
auch bei manuell konfigurierten Workspace-Plugins als Zugänglichkeitsprüfung der
Zielsitzung. Bei der Einrichtung der Codex-Harness-Sitzung wird aus den aktivierten
und zugänglichen Plugin-Apps eine restriktive Thread-App-Konfiguration berechnet;
sie wird nicht bei jedem Durchlauf neu berechnet, daher wirken sich
`/codex plugins enable`/`disable` nur auf neue Codex-Konversationen aus. Verwenden
Sie `/new` oder `/reset`, um die Änderung in der aktuellen Konversation zu
übernehmen.

## V1-Unterstützungsgrenze

- Nur `openai-curated`-Plugins, die bereits im app-server-Inventar des Quell-Codex
  installiert sind, kommen für die Migration infrage.
- Die Laufzeit unterstützt außerdem explizite `workspace-directory`-Einträge auf
  app-server-Builds, deren `plugin/list` `marketplaceKinds` implementiert und
  `remotePluginId` für pfadlose Workspace-Zusammenfassungen zurückgibt. Diese Einträge
  müssen ihre exakte Marketplace-qualifizierte `summary.id` verwenden und bereits
  installiert, aktiviert und für Apps zugänglich sein. Eine abgelehnte Workspace-
  Listenanfrage erzeugt die vorhandene Diagnose `marketplace_missing` pro Plugin;
  bei fehlendem Marketplace-, Plugin-, Detail- oder App-Nachweis wird keine
  Workspace-App bereitgestellt. Das kuratierte Inventar aus der standardmäßigen
  Listenanfrage bleibt verwendbar.
- App-gestützte Quell-Plugins müssen die Abonnementprüfung zur Migrationszeit
  bestehen. `--verify-plugin-apps` fügt die Prüfung des Quell-App-Inventars hinzu.
  Konten, die an der Abonnementprüfung scheitern, sowie im Verifizierungsmodus
  unzugängliche, deaktivierte oder fehlende Quell-Apps oder Fehler beim Aktualisieren
  des App-Inventars werden als übersprungene manuelle Elemente gemeldet, statt als
  aktivierte Konfigurationseinträge. Nicht lesbare Plugin-Details werden vor der
  App-Inventarprüfung übersprungen.
- Die Migration schreibt explizite Plugin-Identitäten (`marketplaceName` und
  `pluginName`); sie schreibt keine lokalen Cache-Pfade vom Typ `marketplacePath`.
- `codexPlugins.enabled` ist der einzige globale Aktivierungsschalter; es gibt weder
  einen Platzhalter `plugins["*"]` noch einen Konfigurationsschlüssel, der eine
  beliebige Installationsberechtigung erteilt.
- Nicht kuratierte Marketplaces, zwischengespeicherte Plugin-Pakete, Hooks und
  Codex-Konfigurationsdateien werden im Migrationsbericht zur manuellen Prüfung
  beibehalten und nicht automatisch aktiviert. Die Laufzeit akzeptiert manuell
  konfigurierte `workspace-directory`-Einträge; andere Marketplaces werden weiterhin
  nicht unterstützt.

## App-Inventar und Eigentümerschaft

OpenClaw liest das Codex-App-Inventar über `app/list` des app-server, speichert es
eine Stunde lang im Arbeitsspeicher zwischen und aktualisiert veraltete oder fehlende
Einträge asynchron. Der Cache ist prozesslokal; ein Neustart der CLI oder des Gateway
verwirft ihn, und OpenClaw erstellt ihn beim nächsten Lesen von `app/list` neu.

Migration und Laufzeit verwenden separate Cache-Schlüssel:

- Die Überprüfung der Quellmigration verwendet das Codex-Ausgangsverzeichnis und die
  Startoptionen der Quelle. Sie wird nur mit `--verify-plugin-apps` ausgeführt und
  erzwingt für diesen Planungslauf eine neue Traversierung von `app/list` der Quelle.
- Die Einrichtung der Ziellaufzeit verwendet die Codex-app-server-Identität des
  Ziel-Agenten, wenn die Thread-App-Konfiguration erstellt wird. Die Aktivierung
  eines kuratierten Plugins invalidiert diesen Ziel-Cache-Schlüssel und aktualisiert
  ihn anschließend nach `plugin/install` erzwungen. Die Einrichtung von
  `workspace-directory` durchläuft diesen Aktivierungspfad niemals.

Eine Plugin-App wird nur bereitgestellt, wenn OpenClaw sie über eine stabile
Eigentümerschaft dem konfigurierten Plugin zuordnen kann: eine exakte App-ID aus den
Plugin-Details, einen bekannten MCP-Servernamen oder eindeutige stabile Metadaten.
Eine nur auf dem Anzeigenamen beruhende oder mehrdeutige Eigentümerschaft wird
ausgeschlossen, bis die nächste Inventaraktualisierung die Eigentümerschaft
nachweist.

## Apps verbundener Konten

Von Eigentümern betriebene Agenten können sich für alle Apps entscheiden, die
bereits mit ihrem Codex-Konto verbunden sind, ohne dass ein entsprechendes
Plugin-Paket erforderlich ist:

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

`allow_all_plugins: true` erstellt beim Aufbau eines neuen nativen Codex-Threads
einen vollständigen Snapshot von `app/list` und lässt nur Apps zu, die für dieses
Konto als zugänglich markiert sind. Es installiert, authentifiziert oder aktiviert
Apps nicht global. Bestehende Threads behalten ihren persistenten App-Satz;
verwenden Sie `/new`, `/reset` oder starten Sie das Gateway neu, um neu verbundene
oder widerrufene Apps zu übernehmen.

Konto-Apps übernehmen den globalen Wert
`codexPlugins.allow_destructive_actions`, der `true`, `false`, `"auto"` oder
`"ask"` akzeptiert. Explizite Richtlinien pro Plugin überschreiben die globale
Richtlinie bei sich überschneidenden App-IDs. Inventarfehler werden nach dem
Fail-Closed-Prinzip behandelt, statt auf eine uneingeschränkte Standardeinstellung
zurückzufallen.

## Thread-App-Konfiguration

OpenClaw fügt für den Codex-Thread einen restriktiven `config.apps`-Patch ein:
`_default` ist deaktiviert, und nur Apps, die aktivierten konfigurierten Plugins gehören, oder
zugängliche Konto-Apps, die durch `allow_all_plugins` zugelassen sind, werden aktiviert.

`destructive_enabled` für jede App ergibt sich aus der effektiven globalen oder
Plugin-spezifischen Richtlinie `allow_destructive_actions`; `true`, `"auto"` und `"ask"`
setzen jeweils `destructive_enabled: true`, während `false` den Wert auf `false` setzt. Codex
erzwingt weiterhin die Metadaten destruktiver Tools aus seinen nativen App-Tool-Annotationen.
`_default` ist mit `open_world_enabled: false` deaktiviert; aktivierte Plugin-Apps
erhalten `open_world_enabled: true`. OpenClaw stellt keinen separaten
Plugin-spezifischen Open-World-Richtlinienregler bereit und führt keine Plugin-spezifischen
Sperrlisten für Namen destruktiver Tools.

Der Tool-Genehmigungsmodus ist für zugelassene Apps standardmäßig automatisch, sodass nicht destruktive
Lese-Tools ohne Genehmigungsaufforderung im selben Thread ausgeführt werden. Destruktive Tools bleiben
durch die jeweilige `destructive_enabled`-Richtlinie der App gesteuert.

## Richtlinie für destruktive Aktionen

Destruktive Plugin-Abfragen sind für konfigurierte Codex-
Plugins standardmäßig zulässig, während unsichere Schemas und mehrdeutige Eigentümerschaft restriktiv abgelehnt werden:

- Global ist `allow_destructive_actions` standardmäßig auf `true` gesetzt.
- Plugin-spezifisches `allow_destructive_actions` überschreibt die globale Richtlinie für
  dieses Plugin.
- `false`: OpenClaw gibt eine deterministische Ablehnung zurück.
- `true`: OpenClaw akzeptiert nur sichere Schemas automatisch, die es einer Genehmigungsantwort
  zuordnen kann, beispielsweise einem booleschen Genehmigungsfeld.
- `"auto"`: OpenClaw macht destruktive Plugin-Aktionen für Codex verfügbar und
  wandelt anschließend MCP-Genehmigungsabfragen mit nachgewiesener Eigentümerschaft in OpenClaw-Plugin-
  Genehmigungen um, bevor die Codex-Genehmigungsantwort zurückgegeben wird.
- `"ask"`: OpenClaw verwendet dieselbe Codex-Sperrlogik für Schreibvorgänge und destruktive Aktionen wie
  `"auto"`, löscht dauerhafte Plugin-spezifische Codex-Genehmigungsüberschreibungen für die App,
  bevor der Thread beginnt, und bietet nur einmalige Genehmigung oder Ablehnung an, damit
  dauerhafte Genehmigungen spätere Aufforderungen für Schreibaktionen nicht unterdrücken können. Für jede
  zugelassene App mit `"ask"` wählt OpenClaw den Codex-Prüfer für menschliche Genehmigungen
  für diese App aus, sodass Codex seine Genehmigungsabfragen an
  OpenClaw sendet; andere Apps und Genehmigungen im Thread, die keine Apps betreffen, behalten ihren konfigurierten
  Prüfer und ihre Richtlinie.
- Eine fehlende Plugin-Identität, mehrdeutige Eigentümerschaft, eine fehlende oder nicht übereinstimmende
  Turn-ID oder ein unsicheres Abfrageschema führt zur Ablehnung statt zu einer Aufforderung.

## Fehlerbehebung

| Code                                              | Bedeutung                                                                                                                              | Behebung                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | Die Migration hat das Plugin installiert, aber eine seiner Apps benötigt weiterhin eine Authentifizierung. Der Eintrag wird deaktiviert geschrieben, bis Sie die Autorisierung erneut durchführen. | Autorisieren Sie die App in Codex erneut und aktivieren Sie anschließend das Plugin in OpenClaw.                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | Mit `--verify-plugin-apps` zeigte der Bestand der Codex-Quell-Apps nicht alle zugehörigen Apps als vorhanden, aktiviert und zugänglich an.         | Autorisieren oder aktivieren Sie die App in Codex erneut und führen Sie anschließend die Migration mit `--verify-plugin-apps` erneut aus.                              |
| `app_inventory_unavailable`                       | Eine strikte Überprüfung der Quell-Apps wurde angefordert, aber die Aktualisierung des Bestands der Codex-Quell-Apps ist fehlgeschlagen.                                      | Beheben Sie den Zugriff auf den Codex-Quell-App-Server oder versuchen Sie es ohne `--verify-plugin-apps` erneut, um den schnelleren kontobeschränkten Plan zu akzeptieren.   |
| `codex_subscription_required`                     | Das Konto des Codex-Quell-App-Servers war kein ChatGPT-Abonnementkonto.                                                          | Melden Sie sich mit der Abonnementauthentifizierung bei der Codex-App an und führen Sie anschließend die Migration erneut aus.                                                  |
| `codex_account_unavailable`                       | Das Konto des Codex-Quell-App-Servers konnte nicht gelesen werden.                                                                               | Beheben Sie die Authentifizierung des Codex-Quell-App-Servers oder führen Sie den Vorgang mit `--verify-plugin-apps` erneut aus, damit der Bestand der Quell-Apps über die Berechtigung entscheidet. |
| `marketplace_missing`, `plugin_missing`           | Der Marketplace oder das genaue Plugin ist nicht verfügbar; die explizite Kataloganfrage des Workspace wurde möglicherweise abgelehnt; Workspace-Apps werden restriktiv abgelehnt.  | Überprüfen Sie den unten beschriebenen kompatiblen App-Server-Vertrag und die genaue ID.                                                |
| `plugin_detail_unavailable`                       | OpenClaw konnte die Eigentümerschaftsdetails des Plugins nicht lesen.                                                                                    | Prüfen Sie die Antworten `plugin/list` und `plugin/read` des Ziel-App-Servers.                                             |
| `plugin_disabled`                                 | Codex meldet, dass das Plugin installiert, aber deaktiviert ist.                                                                                     | Eine kuratierte Aktivierung kann dies möglicherweise beheben; aktivieren Sie vor einem erneuten Versuch ein Workspace-Plugin in Codex.                                  |
| `plugin_activation_failed`                        | Die Plugin-Aktivierung wurde nicht abgeschlossen.                                                                                                  | Verwenden Sie die beigefügte Diagnose, um zwischen Marketplace-, Authentifizierungs-, Aktualisierungs- oder Workspace-Bereitschaftsfehlern zu unterscheiden.                |
| `app_inventory_missing`, `app_inventory_stale`    | Die App-Bereitschaft stammte aus einem leeren oder veralteten Cache.                                                                                     | OpenClaw plant automatisch eine asynchrone Aktualisierung; Plugin-Apps bleiben ausgeschlossen, bis Eigentümerschaft und Bereitschaft bekannt sind.  |
| `app_ownership_ambiguous`                         | Der App-Bestand stimmte nur anhand des Anzeigenamens überein.                                                                                          | Die App bleibt im Codex-Thread verborgen, bis eine spätere Aktualisierung die Eigentümerschaft nachweist.                                     |

**Das Workspace-Plugin ist installiert, aber nicht sichtbar:** Vergewissern Sie sich, dass das Workspace-
Ergebnis von `plugin/list` die genaue konfigurierte ID als installiert und aktiviert meldet,
und vergewissern Sie sich anschließend, dass `app/list` jede zugehörige App für dasselbe Codex-
Konto als zugänglich meldet. OpenClaw kann eine zugängliche App für den Thread aktivieren, selbst wenn der
Kontobestand diese App derzeit als deaktiviert meldet. Wenn Sie diesen Status geändert haben, nachdem der Gateway den App-
Bestand zwischengespeichert hat, warten Sie auf die stündliche Cache-Aktualisierung oder starten Sie den Gateway neu und verwenden Sie anschließend
`/new` oder `/reset`. OpenClaw repariert oder authentifiziert keine Workspace-Plugins.
Wenn die explizite Workspace-Listenanfrage abgelehnt wird, meldet jeder aktivierte Workspace-
Eintrag `marketplace_missing`; nicht damit zusammenhängende kuratierte Einträge werden weiterhin
aus der Standard-Listenantwort verarbeitet.

Für `plugin_detail_unavailable` muss eine pfadlose Workspace-Zusammenfassung
`remotePluginId` enthalten; OpenClaw hält zugehörige Apps verborgen, wenn dieser Selektor oder das
nachfolgende Ergebnis von `plugin/read` nicht verfügbar ist. Bei
`plugin_activation_failed` können kuratierte Plugins einen Marketplace-, Authentifizierungs- oder
Aktualisierungsfehler nach der Installation melden. Ein Workspace-Plugin meldet diesen Code, wenn es
noch nicht aktiv ist; installieren, aktivieren und authentifizieren Sie es außerhalb von OpenClaw.

**Die Konfiguration wurde geändert, aber der Agent kann das Plugin nicht sehen:** Führen Sie `/codex plugins
list` aus, um den konfigurierten Status zu bestätigen, und anschließend `/new` oder `/reset`. Bestehende
Codex-Thread-Bindungen behalten die App-Konfiguration bei, mit der sie gestartet wurden, bis OpenClaw
eine neue Harness-Sitzung einrichtet oder eine veraltete Bindung ersetzt.

**Die destruktive Aktion wird abgelehnt:** Prüfen Sie die globalen und Plugin-spezifischen
Werte von `allow_destructive_actions`. Selbst bei `true`, `"auto"` oder `"ask"`
werden unsichere Abfrageschemas und eine mehrdeutige Plugin-Identität weiterhin restriktiv abgelehnt.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrations-CLI](/de/cli/migrate)
