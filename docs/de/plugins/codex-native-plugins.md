---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus native Codex-Plugins verwenden
    - Sie migrieren aus dem Quellcode installierte, von OpenAI kuratierte Codex-Plugins
    - Sie beheben Probleme mit codexPlugins, App-Bestand, destruktiven Aktionen oder Plugin-App-Diagnosen
summary: Migrierte native Codex-Plugins für OpenClaw-Agenten im Codex-Modus konfigurieren
title: Native Codex-Plugins
x-i18n:
    generated_at: "2026-07-02T00:50:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex-Plugin-Unterstützung ermöglicht es einem OpenClaw-Agenten im Codex-Modus, die eigenen App- und Plugin-Funktionen des Codex app-server innerhalb desselben Codex-Threads zu verwenden, der den OpenClaw-Turn verarbeitet.

OpenClaw übersetzt Codex-Plugins nicht in synthetische dynamische OpenClaw-Tools `codex_plugin_*`. Plugin-Aufrufe bleiben im nativen Codex-Transkript, und der Codex app-server besitzt die app-gestützte MCP-Ausführung.

Verwenden Sie diese Seite, nachdem der grundlegende [Codex-Harness](/de/plugins/codex-harness) funktioniert.

## Anforderungen

- Die ausgewählte OpenClaw-Agentenruntime muss der native Codex-Harness sein.
- `plugins.entries.codex.enabled` muss true sein.
- `plugins.entries.codex.config.codexPlugins.enabled` muss true sein.
- V1 unterstützt nur `openai-curated`-Plugins, die die Migration als quellinstalliert im Codex-Home der Quelle erkannt hat.
- Der Ziel-Codex app-server muss den erwarteten Marketplace sowie das erwartete Plugin- und App-Inventar sehen können.

`codexPlugins` hat keine Auswirkung auf OpenClaw-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversationsbindungen oder andere Harnesses, da diese Pfade keine Codex app-server-Threads mit nativer `apps`-Konfiguration erstellen.

OpenAI-seitiger Codex-Zugriff, App-Verfügbarkeit und Arbeitsbereichskontrollen für Apps/Plugins stammen aus dem angemeldeten Codex-Konto. Informationen zum OpenAI-Konto und Admin-Modell finden Sie unter [Codex mit Ihrem ChatGPT-Plan verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Schnellstart

Vorschau der Migration aus dem Codex-Home der Quelle:

```bash
openclaw migrate codex --dry-run
```

Verwenden Sie strikte Quell-App-Verifizierung, wenn die Migration vor der Planung der nativen Plugin-Aktivierung die Zugänglichkeit der Quell-App prüfen soll:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Wenden Sie die Migration an, wenn der Plan richtig aussieht:

```bash
openclaw migrate apply codex --yes
```

Die Migration schreibt explizite `codexPlugins`-Einträge für berechtigte Plugins und ruft Codex app-server `plugin/install` für ausgewählte Plugins auf. Eine typische migrierte Konfiguration sieht so aus:

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

Nach Änderungen an `codexPlugins` übernehmen neue Codex-Konversationen automatisch den aktualisierten App-Satz. Verwenden Sie `/new` oder `/reset`, um die aktuelle Konversation zu aktualisieren. Ein Gateway-Neustart ist für Änderungen zum Aktivieren oder Deaktivieren von Plugins nicht erforderlich.

## Plugins aus dem Chat verwalten

Verwenden Sie `/codex plugins`, wenn Sie konfigurierte native Codex-Plugins aus demselben Chat prüfen oder ändern möchten, in dem Sie den Codex-Harness betreiben:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` ist ein Alias für `/codex plugins list`. Die Listenausgabe zeigt die konfigurierten Plugin-Schlüssel, den Ein/Aus-Zustand, den Codex-Plugin-Namen und den Marketplace aus `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` und `disable` schreiben nur in die OpenClaw-Konfiguration unter `~/.openclaw/openclaw.json`; sie bearbeiten weder `~/.codex/config.toml` noch installieren sie neue Codex-Plugins. Nur der Eigentümer oder ein Gateway-Client mit dem Scope `operator.admin` kann den Plugin-Zustand ändern.

Das Aktivieren eines konfigurierten Plugins schaltet auch den globalen Schalter `codexPlugins.enabled` ein. Wenn das Plugin deaktiviert geschrieben wurde, weil die Migration `auth_required` zurückgegeben hat, autorisieren Sie die App in Codex erneut, bevor Sie sie in OpenClaw aktivieren.

## Funktionsweise der nativen Plugin-Einrichtung

Die Integration hat drei getrennte Zustände:

- Installiert: Codex hat das lokale Plugin-Bundle in der Ziel-app-server-Runtime.
- Aktiviert: Die OpenClaw-Konfiguration ist bereit, das Plugin für Codex-Harness-Turns verfügbar zu machen.
- Zugänglich: Der Codex app-server bestätigt, dass die App-Einträge des Plugins für das aktive Konto verfügbar sind und der migrierten Plugin-Identität zugeordnet werden können.

Die Migration ist der dauerhafte Installations-/Berechtigungsschritt. Während der Planung liest OpenClaw Details aus Codex `plugin/read` der Quelle und prüft, ob die Antwort des Quell-Codex app-server-Kontos ein ChatGPT-Abonnementkonto ist. Nicht-ChatGPT- oder fehlende Kontoantworten überspringen app-gestützte Plugins mit `codex_subscription_required`. Standardmäßig ruft die Migration kein Quell-`app/list` auf; app-gestützte Quell-Plugins, die die Kontoprüfung bestehen, werden ohne Verifizierung der Zugänglichkeit der Quell-App geplant, und Transportfehler bei der Kontoabfrage werden mit `codex_account_unavailable` übersprungen. Mit `--verify-plugin-apps` erstellt die Migration einen frischen Quell-`app/list`-Snapshot und verlangt, dass jede eigene App vorhanden, aktiviert und zugänglich ist, bevor eine native Aktivierung geplant wird. In diesem Modus fallen Transportfehler bei der Kontoabfrage auf die Quell-App-Inventarprüfung zurück. Das Runtime-App-Inventar ist die Prüfung der Zugänglichkeit der Zielsitzung nach der Migration. Die Codex-Harness-Sitzungseinrichtung berechnet dann eine restriktive Thread-App-Konfiguration für die aktivierten und zugänglichen Plugin-Apps.

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung herstellt oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn neu berechnet, daher wirken sich `/codex plugins enable` und `/codex plugins disable` auf neue Codex-Konversationen aus. Verwenden Sie `/new` oder `/reset`, wenn die aktuelle Konversation den aktualisierten App-Satz übernehmen soll.

## V1-Supportgrenze

V1 ist absichtlich eng gefasst:

- Nur `openai-curated`-Plugins, die bereits im Quell-Codex app-server-Inventar installiert waren, sind migrationsberechtigt.
- App-gestützte Quell-Plugins müssen die abonnementbezogene Prüfung zur Migrationszeit bestehen. `--verify-plugin-apps` fügt die Quell-App-Inventarprüfung hinzu. Konten, die durch ein Abonnement gesperrt sind, sowie im Verifizierungsmodus unzugängliche, deaktivierte oder fehlende Quell-Apps oder Fehler beim Aktualisieren des Quell-App-Inventars werden als übersprungene manuelle Elemente statt als aktivierte Konfigurationseinträge gemeldet. Nicht lesbare Plugin-Details werden vor der Quell-App-Inventarprüfung übersprungen.
- Die Migration schreibt explizite Plugin-Identitäten mit `marketplaceName` und `pluginName`; sie schreibt keine lokalen `marketplacePath`-Cachepfade.
- `codexPlugins.enabled` ist der globale Aktivierungsschalter.
- Es gibt keinen Platzhalter `plugins["*"]` und keinen Konfigurationsschlüssel, der beliebige Installationsberechtigung gewährt.
- Nicht unterstützte Marketplaces, zwischengespeicherte Plugin-Bundles, Hooks und Codex-Konfigurationsdateien bleiben im Migrationsbericht zur manuellen Prüfung erhalten.

## App-Inventar und Eigentümerschaft

OpenClaw liest das Codex-App-Inventar über app-server `app/list`, speichert es eine Stunde lang zwischen und aktualisiert veraltete oder fehlende Einträge asynchron. Der Cache befindet sich nur im Arbeitsspeicher; ein Neustart der CLI oder des Gateway verwirft ihn, und OpenClaw baut ihn aus dem nächsten `app/list`-Lesevorgang neu auf.

Migration und Runtime verwenden getrennte Cache-Schlüssel:

- Die Quell-Migrationsverifizierung verwendet das Codex-Home der Quelle und die Startoptionen des Quell-app-server. Dies läuft nur, wenn `--verify-plugin-apps` gesetzt ist, und erzwingt für diesen Planungslauf eine frische Quell-`app/list`-Traversierung.
- Die Ziel-Runtime-Einrichtung verwendet die Codex app-server-Identität des Ziel-Agenten, wenn sie die Codex-Thread-App-Konfiguration erstellt. Plugin-Aktivierung invalidiert diesen Ziel-Cache-Schlüssel und erzwingt danach nach `plugin/install` eine Aktualisierung.

Eine Plugin-App wird nur offengelegt, wenn OpenClaw sie über stabile Eigentümerschaft dem migrierten Plugin zuordnen kann:

- exakte App-ID aus den Plugin-Details
- bekannter MCP-Servername
- eindeutige stabile Metadaten

Nur über Anzeigenamen passende oder uneindeutige Eigentümerschaft wird ausgeschlossen, bis die nächste Inventaraktualisierung die Eigentümerschaft belegt.

## Thread-App-Konfiguration

OpenClaw injiziert einen restriktiven `config.apps`-Patch für den Codex-Thread: `_default` ist deaktiviert, und nur Apps, die aktivierten migrierten Plugins gehören, werden aktiviert.

OpenClaw setzt `destructive_enabled` auf App-Ebene aus der effektiven globalen oder pro Plugin gesetzten Richtlinie `allow_destructive_actions` und lässt Codex destruktive Tool-Metadaten aus den nativen App-Tool-Annotationen erzwingen. `true`, `"auto"` und `"ask"` setzen `destructive_enabled: true`; `false` setzt es auf false. Die App-Konfiguration `_default` wird mit `open_world_enabled: false` deaktiviert. Aktivierte Plugin-Apps werden mit `open_world_enabled: true` ausgegeben; OpenClaw stellt keinen separaten Plugin-Regler für die Open-World-Richtlinie bereit und pflegt keine pro Plugin geführten Deny-Listen für destruktive Tool-Namen.

Der Tool-Genehmigungsmodus ist für Plugin-Apps standardmäßig automatisch, sodass nicht destruktive Lese-Tools ohne Genehmigungs-UI im selben Thread ausgeführt werden können. Destruktive Tools bleiben durch die jeweilige `destructive_enabled`-Richtlinie der App gesteuert.

## Richtlinie für destruktive Aktionen

Destruktive Plugin-Elicitations sind für migrierte Codex-Plugins standardmäßig erlaubt, während unsichere Schemas und uneindeutige Eigentümerschaft weiterhin geschlossen fehlschlagen:

- Globales `allow_destructive_actions` ist standardmäßig `true`.
- Pro Plugin gesetztes `allow_destructive_actions` überschreibt die globale Richtlinie für dieses Plugin.
- Wenn die Richtlinie `false` ist, gibt OpenClaw eine deterministische Ablehnung zurück.
- Wenn die Richtlinie `true` ist, akzeptiert OpenClaw automatisch nur sichere Schemas, die es einer Genehmigungsantwort zuordnen kann, etwa einem booleschen Genehmigungsfeld.
- Wenn die Richtlinie `"auto"` ist, stellt OpenClaw destruktive Plugin-Aktionen Codex zur Verfügung, wandelt aber eigentumsbelegte MCP-Genehmigungs-Elicitations in OpenClaw-Plugin-Genehmigungen um, bevor die Codex-Genehmigungsantwort zurückgegeben wird.
- Wenn die Richtlinie `"ask"` ist, verwendet OpenClaw dasselbe Codex-Schreib-/Destruktiv-Gating wie `"auto"`, löscht dauerhafte Codex-Genehmigungsüberschreibungen pro Tool für die App, bevor der Thread startet, und bietet nur einmalige Genehmigung oder Ablehnung an, damit dauerhafte Genehmigungen spätere Prompts für Schreibaktionen nicht unterdrücken können.
- Für jede zugelassene App, die `"ask"` verwendet, wählt OpenClaw den Codex-Reviewer für menschliche Genehmigungen für diese App aus, damit Codex seine Genehmigungs-Elicitations an OpenClaw sendet. Andere Apps und Nicht-App-Thread-Genehmigungen behalten ihren konfigurierten Reviewer und ihre Richtlinie.
- Fehlende Plugin-Identität, uneindeutige Eigentümerschaft, eine fehlende Turn-ID, eine falsche Turn-ID oder ein unsicheres Elicitation-Schema führen zu einer Ablehnung statt zu einer Nachfrage.

## Fehlerbehebung

**`auth_required`:** Die Migration hat das Plugin installiert, aber eine seiner Apps benötigt noch Authentifizierung. Der explizite Plugin-Eintrag wird deaktiviert geschrieben, bis Sie erneut autorisieren und ihn aktivieren.

**`app_inaccessible`, `app_disabled` oder `app_missing`:**
Die Migration hat das Plugin nicht installiert, weil das Quell-Codex-App-Inventar nicht alle eigenen Apps als vorhanden, aktiviert und zugänglich angezeigt hat, während `--verify-plugin-apps` gesetzt war. Autorisieren oder aktivieren Sie die App in Codex erneut und führen Sie die Migration dann erneut mit `--verify-plugin-apps` aus.

**`app_inventory_unavailable`:** Die Migration hat das Plugin nicht installiert, weil strikte Quell-App-Verifizierung angefordert wurde und die Aktualisierung des Quell-Codex-App-Inventars fehlgeschlagen ist. Beheben Sie den Zugriff auf den Quell-Codex app-server oder versuchen Sie es ohne `--verify-plugin-apps` erneut, wenn Sie den schnelleren kontogeprüften Plan akzeptieren.

**`codex_subscription_required`:** Die Migration hat das app-gestützte Plugin nicht installiert, weil das Quell-Codex app-server-Konto nicht mit einem ChatGPT-Abonnementkonto angemeldet war. Melden Sie sich in der Codex-App mit Abonnementauthentifizierung an und führen Sie die Migration dann erneut aus.

**`codex_account_unavailable`:** Die Migration hat das app-gestützte Plugin nicht installiert, weil das Quell-Codex app-server-Konto nicht gelesen werden konnte. Beheben Sie die Authentifizierung des Quell-Codex app-server oder führen Sie den Vorgang mit `--verify-plugin-apps` erneut aus, wenn das Quell-App-Inventar bei fehlgeschlagener Kontoabfrage über die Berechtigung entscheiden soll.

**`marketplace_missing` oder `plugin_missing`:** Der Ziel-Codex app-server kann den erwarteten `openai-curated`-Marketplace oder das erwartete Plugin nicht sehen. Führen Sie die Migration erneut gegen die Ziel-Runtime aus oder prüfen Sie den Plugin-Status des Codex app-server.

**`app_inventory_missing` oder `app_inventory_stale`:** Die App-Bereitschaft stammt aus einem leeren oder veralteten Cache. OpenClaw plant eine asynchrone Aktualisierung und schließt Plugin-Apps aus, bis Eigentümerschaft und Bereitschaft bekannt sind.

**`app_ownership_ambiguous`:** Das App-Inventar stimmte nur nach Anzeigename überein, daher wird die App dem Codex-Thread nicht offengelegt.

**Konfiguration geändert, aber der Agent kann das Plugin nicht sehen:** Verwenden Sie `/codex plugins
list`, um den konfigurierten Zustand zu bestätigen, und verwenden Sie dann `/new` oder `/reset`. Bestehende
Codex-Thread-Bindungen behalten die App-Konfiguration, mit der sie gestartet wurden, bis OpenClaw
eine neue Harness-Sitzung herstellt oder eine veraltete Bindung ersetzt.

**Destruktive Aktion wird abgelehnt:** Prüfen Sie die globalen und Plugin-spezifischen
`allow_destructive_actions`-Werte. Selbst wenn die Richtlinie `true`, `"auto"` oder
`"ask"` ist, schlagen unsichere Elicitation-Schemas und mehrdeutige Plugin-Identität weiterhin
geschlossen fehl.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrieren](/de/cli/migrate)
