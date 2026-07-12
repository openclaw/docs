---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus native Codex-Plugins verwenden
    - Sie migrieren aus dem Quellcode installierte, von OpenAI kuratierte Codex-Plugins
    - Sie konfigurieren ein vorhandenes Codex-Plugin im Workspace-Verzeichnis
    - Sie beheben Probleme mit `codexPlugins`, dem App-Inventar, destruktiven Aktionen oder der Diagnose von Plugin-Apps.
summary: Native Codex-Plugins für OpenClaw-Agenten im Codex-Modus konfigurieren
title: Native Codex-Plugins
x-i18n:
    generated_at: "2026-07-12T01:53:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex-Plugin-Unterstützung ermöglicht es einem OpenClaw-Agenten im Codex-Modus, die eigenen App- und Plugin-Funktionen des Codex app-server innerhalb desselben Codex-Threads zu verwenden, der den OpenClaw-Durchlauf verarbeitet. Plugin-Aufrufe verbleiben im nativen Codex-Transkript; der Codex app-server steuert die App-gestützte MCP-Ausführung. OpenClaw übersetzt Codex-Plugins nicht in synthetische dynamische OpenClaw-Tools vom Typ `codex_plugin_*`.

Verwenden Sie diese Seite, nachdem das grundlegende [Codex-Harness](/de/plugins/codex-harness) funktioniert.

## Anforderungen

- Die Agentenlaufzeit muss das native Codex-Harness sein.
- `plugins.entries.codex.enabled` ist `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` ist `true`.
- Der Ziel-Codex-app-server kann auf den erwarteten Marketplace sowie den erwarteten Plugin- und App-Bestand zugreifen.
- Die Migration unterstützt nur `openai-curated`-Plugins, die im Quell-Codex-Home als aus der Quelle installiert erkannt wurden.
- Manuell konfigurierte `workspace-directory`-Plugins benötigen einen Codex app-server, dessen `plugin/list` den Parameter `marketplaceKinds` akzeptiert und dessen pfadlose Workspace-Zusammenfassungen `remotePluginId` enthalten. Das Plugin muss bereits installiert und aktiviert sein, und seine zugehörigen Apps müssen in `app/list` zugänglich sein.

`codexPlugins` hat keine Auswirkung auf Durchläufe mit dem OpenClaw-Provider, ACP-Konversationsbindungen oder andere Harnesses, da diese Pfade niemals Codex-app-server-Threads mit nativer `apps`-Konfiguration erstellen.

Das Codex-Konto, die App-Verfügbarkeit und die App-/Plugin-Steuerung für Workspaces auf OpenAI-Seite stammen aus dem angemeldeten Codex-Konto. Informationen zum OpenAI-Konto- und Administrationsmodell finden Sie unter [Codex mit Ihrem ChatGPT-Tarif verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Schnellstart

Zeigen Sie eine Vorschau der Migration aus dem Quell-Codex-Home an:

```bash
openclaw migrate codex --dry-run
```

Fügen Sie `--verify-plugin-apps` hinzu, damit die Migration `app/list` der Quelle aufruft und vor der Planung der nativen Aktivierung verlangt, dass jede zugehörige App vorhanden, aktiviert und zugänglich ist:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Wenden Sie die Migration an, wenn der Plan korrekt aussieht:

```bash
openclaw migrate apply codex --yes
```

Die Migration schreibt explizite `codexPlugins`-Einträge für geeignete Plugins und ruft für ausgewählte Plugins `plugin/install` des Codex app-server auf. Eine migrierte Konfiguration sieht wie folgt aus:

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

Die Migration bleibt auf `openai-curated` beschränkt. Um ein vorhandenes `workspace-directory`-Plugin zu verwenden, fügen Sie es manuell mit der exakten, durch den Marketplace qualifizierten `summary.id` hinzu, die von `plugin/list` zurückgegeben wird. Wenn Codex beispielsweise `example-plugin@workspace-directory` zurückgibt, konfigurieren Sie diesen vollständigen Wert anstelle seines Anzeigenamens:

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

OpenClaw ruft für ein `workspace-directory`-Plugin weder `plugin/install` auf noch startet es eine Authentifizierung. Installieren, aktivieren und authentifizieren Sie es in Codex, bevor Sie die OpenClaw-Richtlinie hinzufügen oder aktivieren. OpenClaw blendet Apps weiterhin aus, wenn die Antwort nicht den exakten Marketplace, die Plugin-ID, die Detail-ID oder einen Nachweis der App-Bereitschaft enthält. Wenn Codex die explizite Workspace-Anfrage an `plugin/list` ablehnt, meldet OpenClaw für jedes aktivierte Workspace-Plugin `marketplace_missing` und hält unabhängig erkannte kuratierte Plugins weiterhin verfügbar.

Nach einer Änderung an `codexPlugins` übernehmen neue Codex-Konversationen automatisch den aktualisierten App-Satz. Führen Sie `/new` oder `/reset` aus, um die aktuelle Konversation zu aktualisieren. Für Änderungen an der Aktivierung oder Deaktivierung von Plugins ist kein Neustart des Gateway erforderlich.

## Plugins über den Chat verwalten

Mit `/codex plugins` können konfigurierte native Codex-Plugins in demselben Chat geprüft oder geändert werden, in dem Sie das Codex-Harness verwenden:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` ist ein Alias für `/codex plugins list`. Die Liste zeigt für jedes konfigurierte Plugin den Schlüssel, den Ein-/Aus-Status, den Codex-Plugin-Namen und den Marketplace aus `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` schreiben ausschließlich in `~/.openclaw/openclaw.json`; sie bearbeiten niemals `~/.codex/config.toml` und installieren keine neuen Codex-Plugins. Nur der Eigentümer oder ein Gateway-Client mit dem Geltungsbereich `operator.admin` kann sie ausführen.

Beim Aktivieren eines konfigurierten Plugins wird außerdem der globale Schalter `codexPlugins.enabled` aktiviert. Wenn ein kuratiertes Plugin deaktiviert eingetragen wurde, weil die Migration `auth_required` zurückgegeben hat, autorisieren Sie die App erneut in Codex, bevor Sie sie in OpenClaw aktivieren. Bei einem `workspace-directory`-Eintrag ändert die Aktivierung an dieser Stelle nur die OpenClaw-Richtlinie; das Plugin und die App müssen bereits in Codex aktiv sein.

## Funktionsweise der nativen Plugin-Einrichtung

Die Integration verfolgt drei Zustände:

| Zustand     | Bedeutung                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installiert | Codex verfügt in der Laufzeit des Ziel-app-server über das Plugin-Paket.                                                                                          |
| Aktiviert   | Codex meldet das Plugin als aktiviert, und die OpenClaw-Konfiguration erlaubt es für Durchläufe des Codex-Harness.                                                |
| Zugänglich  | Der Codex app-server bestätigt, dass die App-Einträge des Plugins für das aktive Konto verfügbar sind und der konfigurierten Plugin-Identität zugeordnet werden. |

Bei `openai-curated`-Plugins ist die Migration der dauerhafte Installations- und Eignungsschritt:

- Während der Planung liest OpenClaw die Details aus `plugin/read` der Codex-Quelle und prüft, ob das Konto des Quell-Codex-app-server ein ChatGPT-Abonnementkonto ist. Bei einer Antwort mit einem anderen Konto als ChatGPT oder ohne Konto werden App-gestützte Plugins mit `codex_subscription_required` übersprungen.
- Standardmäßig überspringt die Migration den Aufruf von `app/list` der Quelle: App-gestützte Quell-Plugins, welche die Kontoprüfung bestehen, werden ohne Überprüfung der Zugänglichkeit der Quell-App eingeplant, und Transportfehler bei der Kontoabfrage führen zum Überspringen mit `codex_account_unavailable`.
- Mit `--verify-plugin-apps` erstellt die Migration einen aktuellen Snapshot von `app/list` der Quelle und verlangt vor der Planung der nativen Aktivierung, dass jede zugehörige App vorhanden, aktiviert und zugänglich ist. Transportfehler bei der Kontoabfrage führen dann zur Prüfung des Quell-App-Bestands, statt den Eintrag sofort zu überspringen.

Bei `workspace-directory`-Plugins erfolgt die Einrichtung außerhalb von OpenClaw. OpenClaw fragt diesen Marketplace nur ab, wenn mindestens ein aktivierter Workspace-Eintrag konfiguriert ist, löst jedes Plugin anhand der exakten `summary.id` auf und verwendet die bestehenden Prüfungen der Eigentümerschaft über `plugin/read` sowie der Bereitschaft über `app/list` erneut. Ein nicht installiertes, deaktiviertes, unzugängliches oder nicht authentifiziertes Plugin stellt keine Apps bereit; OpenClaw versucht weder eine Installation noch eine Authentifizierung.

Der App-Bestand der Laufzeit dient sowohl für migrierte kuratierte Plugins als auch für manuell konfigurierte Workspace-Plugins als Zugänglichkeitsprüfung der Zielsitzung. Beim Einrichten einer Codex-Harness-Sitzung wird aus den aktivierten und zugänglichen Plugin-Apps eine restriktive App-Konfiguration für den Thread berechnet. Diese wird nicht bei jedem Durchlauf neu berechnet, sodass `/codex plugins enable`/`disable` nur neue Codex-Konversationen beeinflussen. Verwenden Sie `/new` oder `/reset`, um die Änderung in der aktuellen Konversation zu übernehmen.

## Unterstützungsgrenzen von V1

- Nur `openai-curated`-Plugins, die bereits im app-server-Bestand der Codex-Quelle installiert sind, kommen für die Migration infrage.
- Die Laufzeit unterstützt außerdem explizite `workspace-directory`-Einträge bei app-server-Builds, deren `plugin/list` `marketplaceKinds` implementiert und `remotePluginId` für pfadlose Workspace-Zusammenfassungen zurückgibt. Diese Einträge müssen ihre exakte, durch den Marketplace qualifizierte `summary.id` verwenden und bereits installiert, aktiviert sowie für Apps zugänglich sein. Eine abgelehnte Workspace-Listenanfrage erzeugt die vorhandene Diagnose `marketplace_missing` pro Plugin; bei fehlenden Nachweisen für Marketplace, Plugin, Details oder App wird keine Workspace-App bereitgestellt. Der kuratierte Bestand aus der standardmäßigen Listenanfrage bleibt nutzbar.
- App-gestützte Quell-Plugins müssen die Abonnementprüfung während der Migration bestehen. `--verify-plugin-apps` fügt die Prüfung des Quell-App-Bestands hinzu. Konten, die an der Abonnementprüfung scheitern, sowie im Prüfmodus unzugängliche, deaktivierte oder fehlende Quell-Apps oder Fehler beim Aktualisieren des App-Bestands werden als übersprungene manuelle Einträge statt als aktivierte Konfigurationseinträge gemeldet. Nicht lesbare Plugin-Details werden vor der Prüfung des App-Bestands übersprungen.
- Die Migration schreibt explizite Plugin-Identitäten (`marketplaceName` und `pluginName`); lokale Cache-Pfade in `marketplacePath` werden nicht geschrieben.
- `codexPlugins.enabled` ist der einzige globale Aktivierungsschalter; es gibt weder einen Platzhalter `plugins["*"]` noch einen Konfigurationsschlüssel, der eine uneingeschränkte Installationsberechtigung gewährt.
- Nicht kuratierte Marketplaces, zwischengespeicherte Plugin-Pakete, Hooks und Codex-Konfigurationsdateien werden im Migrationsbericht zur manuellen Prüfung beibehalten und nicht automatisch aktiviert. Die Laufzeit akzeptiert manuell konfigurierte `workspace-directory`-Einträge; andere Marketplaces werden weiterhin nicht unterstützt.

## App-Bestand und Eigentümerschaft

OpenClaw liest den Codex-App-Bestand über `app/list` des app-server, speichert ihn eine Stunde lang im Arbeitsspeicher zwischen und aktualisiert veraltete oder fehlende Einträge asynchron. Der Cache ist prozesslokal; beim Neustart der CLI oder des Gateway wird er verworfen, und OpenClaw erstellt ihn beim nächsten Lesen von `app/list` neu.

Migration und Laufzeit verwenden separate Cache-Schlüssel:

- Die Prüfung der Quellmigration verwendet das Quell-Codex-Home und die Startoptionen. Sie wird nur mit `--verify-plugin-apps` ausgeführt und erzwingt für diesen Planungslauf eine vollständige, aktuelle Abfrage von `app/list` der Quelle.
- Die Einrichtung der Ziellaufzeit verwendet beim Erstellen der App-Konfiguration für den Thread die Identität des Codex-app-server des Zielagenten. Die Aktivierung eines kuratierten Plugins invalidiert diesen Ziel-Cache-Schlüssel und erzwingt nach `plugin/install` dessen Aktualisierung. Die Einrichtung von `workspace-directory` verwendet diesen Aktivierungspfad niemals.

Eine Plugin-App wird nur bereitgestellt, wenn OpenClaw sie über eine stabile Eigentümerschaft dem konfigurierten Plugin zuordnen kann: eine exakte App-ID aus den Plugin-Details, einen bekannten MCP-Servernamen oder eindeutige stabile Metadaten. Eine ausschließlich auf dem Anzeigenamen basierende oder mehrdeutige Eigentümerschaft wird ausgeschlossen, bis die nächste Bestandsaktualisierung die Eigentümerschaft bestätigt.

## Apps verbundener Konten

Vom Eigentümer betriebene Agenten können alle Apps verwenden, die bereits mit ihrem Codex-Konto verbunden sind, ohne dass ein entsprechendes Plugin-Paket erforderlich ist:

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

`allow_all_plugins: true` erstellt beim Einrichten eines neuen nativen Codex-Threads einen vollständigen Snapshot von `app/list` und lässt nur Apps zu, die für dieses Konto als zugänglich markiert sind. Apps werden dadurch weder installiert noch authentifiziert oder global aktiviert. Bestehende Threads behalten ihren gespeicherten App-Satz; verwenden Sie `/new`, `/reset` oder starten Sie das Gateway neu, um neu verbundene oder widerrufene Apps zu übernehmen.

Apps des Kontos übernehmen den globalen Wert `codexPlugins.allow_destructive_actions`, der `true`, `false`, `"auto"` oder `"ask"` akzeptiert. Explizite Richtlinien einzelner Plugins überschreiben bei sich überschneidenden App-IDs die globale Richtlinie. Bei Fehlern des Bestands wird der Zugriff standardmäßig verweigert, statt auf einen uneingeschränkten Standardwert zurückzufallen.

## App-Konfiguration des Threads

OpenClaw fügt für den Codex-Thread einen restriktiven Patch für `config.apps` ein:
`_default` ist deaktiviert, und aktiviert werden ausschließlich Apps, die aktivierten konfigurierten Plugins gehören, oder zugängliche Konto-Apps, die durch `allow_all_plugins` zugelassen sind.

`destructive_enabled` wird bei jeder App aus der wirksamen globalen oder Plugin-spezifischen Richtlinie `allow_destructive_actions` abgeleitet; `true`, `"auto"` und `"ask"` setzen jeweils `destructive_enabled: true`, während `false` den Wert auf `false` setzt. Codex berücksichtigt weiterhin Metadaten für destruktive Tools aus seinen nativen App-Tool-Annotationen.
`_default` ist mit `open_world_enabled: false` deaktiviert; aktivierte Plugin-Apps erhalten `open_world_enabled: true`. OpenClaw stellt keinen separaten Schalter für eine Plugin-spezifische Open-World-Richtlinie bereit und verwaltet keine Plugin-spezifischen Sperrlisten für Namen destruktiver Tools.

Der Modus für Tool-Genehmigungen ist für zugelassene Apps standardmäßig automatisch, sodass nicht destruktive Lese-Tools ohne Genehmigungsabfrage im selben Thread ausgeführt werden. Destruktive Tools unterliegen weiterhin der jeweiligen `destructive_enabled`-Richtlinie der App.

## Richtlinie für destruktive Aktionen

Destruktive Plugin-Abfragen sind für konfigurierte Codex-Plugins standardmäßig zulässig, während unsichere Schemas und eine nicht eindeutige Eigentümerschaft nach dem Fail-Closed-Prinzip abgelehnt werden:

- Der globale Wert `allow_destructive_actions` ist standardmäßig `true`.
- Der Plugin-spezifische Wert `allow_destructive_actions` überschreibt die globale Richtlinie für dieses Plugin.
- `false`: OpenClaw gibt eine deterministische Ablehnung zurück.
- `true`: OpenClaw akzeptiert ausschließlich sichere Schemas automatisch, die einer Genehmigungsantwort zugeordnet werden können, beispielsweise ein boolesches Genehmigungsfeld.
- `"auto"`: OpenClaw stellt Codex destruktive Plugin-Aktionen zur Verfügung und wandelt anschließend MCP-Genehmigungsabfragen mit nachgewiesener Eigentümerschaft in OpenClaw-Plugin-Genehmigungen um, bevor die Codex-Genehmigungsantwort zurückgegeben wird.
- `"ask"`: OpenClaw verwendet dieselbe Codex-Sperrlogik für Schreibvorgänge und destruktive Aktionen wie bei `"auto"`, löscht vor dem Start des Threads dauerhafte Codex-Genehmigungsüberschreibungen für einzelne Tools der App und bietet ausschließlich eine einmalige Genehmigung oder Ablehnung an, sodass dauerhafte Genehmigungen spätere Abfragen für Schreibaktionen nicht unterdrücken können. Für jede zugelassene App mit `"ask"` wählt OpenClaw den Codex-Prüfer für menschliche Genehmigungen dieser App aus, damit Codex seine Genehmigungsabfragen an OpenClaw sendet; andere Apps und Thread-Genehmigungen außerhalb von Apps behalten ihren konfigurierten Prüfer und ihre Richtlinie.
- Eine fehlende Plugin-Identität, eine nicht eindeutige Eigentümerschaft, eine fehlende oder nicht übereinstimmende Turn-ID oder ein unsicheres Abfrageschema führen zu einer Ablehnung statt zu einer Abfrage.

## Fehlerbehebung

| Code                                              | Bedeutung                                                                                                                                                 | Lösung                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | Die Migration hat das Plugin installiert, aber eine seiner Apps erfordert weiterhin eine Authentifizierung. Der Eintrag wird bis zur erneuten Autorisierung deaktiviert gespeichert. | Autorisieren Sie die App in Codex erneut und aktivieren Sie anschließend das Plugin in OpenClaw.                                                 |
| `app_inaccessible`, `app_disabled`, `app_missing` | Bei Verwendung von `--verify-plugin-apps` wurden im App-Bestand der Codex-Quelle nicht alle zugehörigen Apps als vorhanden, aktiviert und zugänglich angezeigt. | Autorisieren oder aktivieren Sie die App in Codex erneut und führen Sie die Migration anschließend erneut mit `--verify-plugin-apps` aus.       |
| `app_inventory_unavailable`                       | Eine strikte Überprüfung der Quell-Apps wurde angefordert, aber die Aktualisierung des App-Bestands der Codex-Quelle ist fehlgeschlagen.                   | Beheben Sie den Zugriff auf den App-Server der Codex-Quelle oder wiederholen Sie den Vorgang ohne `--verify-plugin-apps`, um den schnelleren, kontobeschränkten Plan zu akzeptieren. |
| `codex_subscription_required`                     | Das Konto des App-Servers der Codex-Quelle war kein ChatGPT-Abonnementkonto.                                                                               | Melden Sie sich bei der Codex-App mit einer Abonnementauthentifizierung an und führen Sie die Migration erneut aus.                              |
| `codex_account_unavailable`                       | Das Konto des App-Servers der Codex-Quelle konnte nicht gelesen werden.                                                                                    | Beheben Sie die Authentifizierung des App-Servers der Codex-Quelle oder führen Sie den Vorgang erneut mit `--verify-plugin-apps` aus, damit der Quell-App-Bestand über die Berechtigung entscheidet. |
| `marketplace_missing`, `plugin_missing`           | Der Marketplace oder das angegebene Plugin ist nicht verfügbar; die explizite Kataloganfrage für den Workspace wurde möglicherweise abgelehnt; Workspace-Apps werden nach dem Fail-Closed-Prinzip abgelehnt. | Überprüfen Sie den unten beschriebenen kompatiblen App-Server-Vertrag und die exakte ID.                                                         |
| `plugin_detail_unavailable`                       | OpenClaw konnte die Details zur Plugin-Eigentümerschaft nicht lesen.                                                                                       | Prüfen Sie die Antworten `plugin/list` und `plugin/read` des Ziel-App-Servers.                                                                  |
| `plugin_disabled`                                 | Codex meldet, dass das Plugin installiert, aber deaktiviert ist.                                                                                           | Eine kuratierte Aktivierung kann dies möglicherweise beheben; aktivieren Sie vor einem erneuten Versuch ein Workspace-Plugin in Codex.          |
| `plugin_activation_failed`                        | Die Aktivierung des Plugins wurde nicht abgeschlossen.                                                                                                    | Verwenden Sie die beigefügte Diagnose, um zwischen Fehlern des Marketplace, der Authentifizierung, der Aktualisierung oder der Workspace-Bereitschaft zu unterscheiden. |
| `app_inventory_missing`, `app_inventory_stale`    | Die App-Bereitschaft wurde aus einem leeren oder veralteten Cache abgeleitet.                                                                              | OpenClaw plant automatisch eine asynchrone Aktualisierung; Plugin-Apps bleiben ausgeschlossen, bis Eigentümerschaft und Bereitschaft bekannt sind. |
| `app_ownership_ambiguous`                         | Der App-Bestand stimmte nur anhand des Anzeigenamens überein.                                                                                              | Die App bleibt für den Codex-Thread ausgeblendet, bis eine spätere Aktualisierung die Eigentümerschaft nachweist.                               |

**Workspace-Plugin ist installiert, aber nicht sichtbar:** Vergewissern Sie sich, dass das Workspace-Ergebnis von `plugin/list` die exakt konfigurierte ID als installiert und aktiviert meldet. Vergewissern Sie sich anschließend, dass `app/list` alle zugehörigen Apps für dasselbe Codex-Konto als zugänglich meldet. OpenClaw kann eine zugängliche App für den Thread aktivieren, selbst wenn der Kontobestand diese App derzeit als deaktiviert meldet. Wenn Sie diesen Status geändert haben, nachdem der Gateway den App-Bestand zwischengespeichert hat, warten Sie auf die stündliche Cache-Aktualisierung oder starten Sie den Gateway neu und verwenden Sie anschließend `/new` oder `/reset`. OpenClaw repariert oder authentifiziert keine Workspace-Plugins.
Wenn die explizite Anfrage der Workspace-Liste abgelehnt wird, meldet jeder aktivierte Workspace-Eintrag `marketplace_missing`; nicht zugehörige kuratierte Einträge werden weiterhin anhand der Antwort der Standardliste verarbeitet.

Bei `plugin_detail_unavailable` muss eine Workspace-Zusammenfassung ohne Pfadangabe `remotePluginId` enthalten; OpenClaw hält zugehörige Apps ausgeblendet, wenn dieser Selektor oder das nachfolgende Ergebnis von `plugin/read` nicht verfügbar ist. Bei `plugin_activation_failed` können kuratierte Plugins einen Fehler des Marketplace, der Authentifizierung oder der Aktualisierung nach der Installation melden. Ein Workspace-Plugin meldet diesen Code, wenn es noch nicht aktiv ist; installieren, aktivieren und authentifizieren Sie es außerhalb von OpenClaw.

**Konfiguration geändert, aber der Agent kann das Plugin nicht sehen:** Führen Sie `/codex plugins list` aus, um den konfigurierten Status zu bestätigen, und verwenden Sie anschließend `/new` oder `/reset`. Bestehende Bindungen von Codex-Threads behalten die App-Konfiguration bei, mit der sie gestartet wurden, bis OpenClaw eine neue Harness-Sitzung herstellt oder eine veraltete Bindung ersetzt.

**Destruktive Aktion wird abgelehnt:** Prüfen Sie die globalen und Plugin-spezifischen Werte von `allow_destructive_actions`. Selbst bei `true`, `"auto"` oder `"ask"` werden unsichere Abfrageschemas und eine nicht eindeutige Plugin-Identität weiterhin nach dem Fail-Closed-Prinzip abgelehnt.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate-CLI](/de/cli/migrate)
