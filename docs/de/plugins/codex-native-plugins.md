---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus native Codex-Plugins verwenden
    - Sie migrieren aus dem Quellcode installierte, von OpenAI kuratierte Codex-Plugins
    - Sie beheben Probleme mit codexPlugins, App-Inventar, destruktiven Aktionen oder Plugin-App-Diagnosen
summary: Migrierte native Codex-Plugins für OpenClaw-Agenten im Codex-Modus konfigurieren
title: Native Codex-Plugins
x-i18n:
    generated_at: "2026-06-27T17:46:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex-Plugin-Unterstützung ermöglicht es einem OpenClaw-Agenten im Codex-Modus, die eigenen App- und Plugin-Funktionen des Codex app-server innerhalb desselben Codex-Threads zu verwenden, der den OpenClaw-Turn verarbeitet.

OpenClaw übersetzt Codex-Plugins nicht in synthetische dynamische OpenClaw-Tools `codex_plugin_*`. Plugin-Aufrufe bleiben im nativen Codex-Transkript, und Codex app-server besitzt die app-gestützte MCP-Ausführung.

Verwenden Sie diese Seite, nachdem der grundlegende [Codex-Harness](/de/plugins/codex-harness) funktioniert.

## Anforderungen

- Die ausgewählte OpenClaw-Agentenlaufzeit muss der native Codex-Harness sein.
- `plugins.entries.codex.enabled` muss true sein.
- `plugins.entries.codex.config.codexPlugins.enabled` muss true sein.
- V1 unterstützt nur `openai-curated`-Plugins, die die Migration als quelleninstalliert im Quell-Codex-Home erkannt hat.
- Der Ziel-Codex-app-server muss das erwartete Marketplace-, Plugin- und App-Inventar sehen können.

`codexPlugins` hat keine Auswirkung auf OpenClaw-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversationsbindungen oder andere Harnesses, da diese Pfade keine Codex-app-server-Threads mit nativer `apps`-Konfiguration erstellen.

Codex-Zugriff auf OpenAI-Seite, App-Verfügbarkeit und App-/Plugin-Steuerungen im Workspace stammen aus dem angemeldeten Codex-Konto. Informationen zum OpenAI-Konto- und Admin-Modell finden Sie unter [Codex mit Ihrem ChatGPT-Tarif verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Schnellstart

Migration aus dem Quell-Codex-Home vorab anzeigen:

```bash
openclaw migrate codex --dry-run
```

Verwenden Sie eine strikte Quell-App-Verifizierung, wenn die Migration die Zugänglichkeit der Quell-App prüfen soll, bevor die native Plugin-Aktivierung geplant wird:

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

Nach Änderungen an `codexPlugins` übernehmen neue Codex-Konversationen automatisch das aktualisierte App-Set. Verwenden Sie `/new` oder `/reset`, um die aktuelle Konversation zu aktualisieren. Für Änderungen beim Aktivieren oder Deaktivieren von Plugins ist kein Neustart des Gateway erforderlich.

## Plugins aus dem Chat verwalten

Verwenden Sie `/codex plugins`, wenn Sie native Codex-Plugins aus demselben Chat prüfen oder ändern möchten, in dem Sie den Codex-Harness bedienen:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` ist ein Alias für `/codex plugins list`. Die Listenausgabe zeigt die konfigurierten Plugin-Schlüssel, den Ein-/Aus-Zustand, den Codex-Plugin-Namen und den Marketplace aus `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` und `disable` schreiben nur in die OpenClaw-Konfiguration unter `~/.openclaw/openclaw.json`; sie bearbeiten weder `~/.codex/config.toml` noch installieren sie neue Codex-Plugins. Nur der Owner oder ein Gateway-Client mit dem Scope `operator.admin` kann den Plugin-Zustand ändern.

Das Aktivieren eines konfigurierten Plugins schaltet auch den globalen Schalter `codexPlugins.enabled` ein. Wenn das Plugin deaktiviert geschrieben wurde, weil die Migration `auth_required` zurückgegeben hat, autorisieren Sie die App erneut in Codex, bevor Sie sie in OpenClaw aktivieren.

## Funktionsweise der nativen Plugin-Einrichtung

Die Integration hat drei getrennte Zustände:

- Installiert: Codex hat das lokale Plugin-Bundle in der Ziel-app-server-Laufzeit.
- Aktiviert: Die OpenClaw-Konfiguration ist bereit, das Plugin für Codex-Harness-Turns verfügbar zu machen.
- Zugänglich: Codex app-server bestätigt, dass die App-Einträge des Plugins für das aktive Konto verfügbar sind und der migrierten Plugin-Identität zugeordnet werden können.

Die Migration ist der dauerhafte Installations- und Berechtigungsschritt. Während der Planung liest OpenClaw Quell-Codex-Details aus `plugin/read` und prüft, ob die Kontoantwort des Quell-Codex-app-server ein ChatGPT-Abonnementkonto ist. Nicht-ChatGPT- oder fehlende Kontoantworten überspringen app-gestützte Plugins mit `codex_subscription_required`. Standardmäßig ruft die Migration kein Quell-`app/list` auf; app-gestützte Quell-Plugins, die die Konto-Gate-Prüfung bestehen, werden ohne Verifizierung der Quell-App-Zugänglichkeit geplant, und Transportfehler bei der Kontosuche werden mit `codex_account_unavailable` übersprungen. Mit `--verify-plugin-apps` erstellt die Migration einen frischen Quell-`app/list`-Snapshot und verlangt, dass jede besessene App vorhanden, aktiviert und zugänglich ist, bevor die native Aktivierung geplant wird. In diesem Modus fallen Transportfehler bei der Kontosuche auf das Quell-App-Inventar-Gate zurück. Das Laufzeit-App-Inventar ist die Zugänglichkeitsprüfung der Zielsitzung nach der Migration. Die Codex-Harness-Sitzungseinrichtung berechnet dann eine restriktive Thread-App-Konfiguration für die aktivierten und zugänglichen Plugin-Apps.

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung herstellt oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn neu berechnet, daher wirken sich `/codex plugins enable` und `/codex plugins disable` auf neue Codex-Konversationen aus. Verwenden Sie `/new` oder `/reset`, wenn die aktuelle Konversation das aktualisierte App-Set übernehmen soll.

## V1-Unterstützungsgrenze

V1 ist bewusst eng gefasst:

- Nur `openai-curated`-Plugins, die bereits im Quell-Codex-app-server-Inventar installiert waren, sind migrationsberechtigt.
- App-gestützte Quell-Plugins müssen das Abonnement-Gate zur Migrationszeit bestehen. `--verify-plugin-apps` fügt das Quell-App-Inventar-Gate hinzu. Konten mit Abonnement-Gate sowie, im Verifizierungsmodus, unzugängliche, deaktivierte, fehlende Quell-Apps oder fehlgeschlagene Aktualisierungen des Quell-App-Inventars werden als übersprungene manuelle Elemente gemeldet statt als aktivierte Konfigurationseinträge. Nicht lesbare Plugin-Details werden vor dem Quell-App-Inventar-Gate übersprungen.
- Die Migration schreibt explizite Plugin-Identitäten mit `marketplaceName` und `pluginName`; sie schreibt keine lokalen `marketplacePath`-Cache-Pfade.
- `codexPlugins.enabled` ist der globale Aktivierungsschalter.
- Es gibt keinen `plugins["*"]`-Wildcard und keinen Konfigurationsschlüssel, der beliebige Installationsberechtigung erteilt.
- Nicht unterstützte Marketplaces, zwischengespeicherte Plugin-Bundles, Hooks und Codex-Konfigurationsdateien bleiben im Migrationsbericht zur manuellen Prüfung erhalten.

## App-Inventar und Besitz

OpenClaw liest das Codex-App-Inventar über app-server `app/list`, cached es für eine Stunde und aktualisiert veraltete oder fehlende Einträge asynchron. Der Cache liegt nur im Arbeitsspeicher; ein Neustart der CLI oder des Gateway verwirft ihn, und OpenClaw baut ihn beim nächsten `app/list`-Lesevorgang neu auf.

Migration und Laufzeit verwenden separate Cache-Schlüssel:

- Die Quell-Migrationsverifizierung verwendet das Quell-Codex-Home und die Startoptionen des Quell-app-server. Dies läuft nur, wenn `--verify-plugin-apps` gesetzt ist, und erzwingt einen frischen Quell-`app/list`-Durchlauf für diesen Planungslauf.
- Die Ziel-Laufzeiteinrichtung verwendet die Codex-app-server-Identität des Ziel-Agenten, wenn sie die Codex-Thread-App-Konfiguration erstellt. Die Plugin-Aktivierung invalidiert diesen Ziel-Cache-Schlüssel und aktualisiert ihn danach nach `plugin/install` erzwungen neu.

Eine Plugin-App wird nur offengelegt, wenn OpenClaw sie über stabilen Besitz auf das migrierte Plugin zurückführen kann:

- exakte App-ID aus den Plugin-Details
- bekannter MCP-Servername
- eindeutige stabile Metadaten

Nur über Anzeigenamen gefundener oder mehrdeutiger Besitz wird ausgeschlossen, bis die nächste Inventaraktualisierung den Besitz nachweist.

## Thread-App-Konfiguration

OpenClaw injiziert einen restriktiven `config.apps`-Patch für den Codex-Thread: `_default` ist deaktiviert, und nur Apps, die aktivierten migrierten Plugins gehören, sind aktiviert.

OpenClaw setzt `destructive_enabled` auf App-Ebene aus der effektiven globalen oder Plugin-spezifischen `allow_destructive_actions`-Richtlinie und lässt Codex destruktive Tool-Metadaten aus seinen nativen App-Tool-Annotationen durchsetzen. `true`, `"auto"` und `"always"` setzen `destructive_enabled: true`; `false` setzt es auf false. Die `_default`-App-Konfiguration wird mit `open_world_enabled: false` deaktiviert. Aktivierte Plugin-Apps werden mit `open_world_enabled: true` ausgegeben; OpenClaw stellt keinen separaten Open-World-Richtlinienregler pro Plugin bereit und pflegt keine Plugin-spezifischen Deny-Listen für destruktive Tool-Namen.

Der Tool-Genehmigungsmodus ist standardmäßig automatisch für Plugin-Apps, damit nicht destruktive Lesetools ohne Genehmigungs-UI im selben Thread ausgeführt werden können. Destruktive Tools bleiben durch die jeweilige `destructive_enabled`-Richtlinie der App gesteuert.

## Richtlinie für destruktive Aktionen

Destruktive Plugin-Elicitations sind standardmäßig für migrierte Codex-Plugins erlaubt, während unsichere Schemas und mehrdeutiger Besitz weiterhin fail-closed behandelt werden:

- Globales `allow_destructive_actions` ist standardmäßig `true`.
- Plugin-spezifisches `allow_destructive_actions` überschreibt die globale Richtlinie für dieses Plugin.
- Wenn die Richtlinie `false` ist, gibt OpenClaw eine deterministische Ablehnung zurück.
- Wenn die Richtlinie `true` ist, akzeptiert OpenClaw automatisch nur sichere Schemas, die es einer Genehmigungsantwort zuordnen kann, etwa einem booleschen Genehmigungsfeld.
- Wenn die Richtlinie `"auto"` ist, stellt OpenClaw destruktive Plugin-Aktionen Codex bereit, wandelt aber besitznachgewiesene MCP-Genehmigungs-Elicitations in OpenClaw-Plugin-Genehmigungen um, bevor die Codex-Genehmigungsantwort zurückgegeben wird.
- Wenn die Richtlinie `"always"` ist, verwendet OpenClaw dasselbe Codex-Schreib-/Destruktiv-Gating wie `"auto"`, löscht dauerhafte Codex-Genehmigungsüberschreibungen pro Tool für die App, bevor der Thread startet, und bietet nur einmalige Genehmigung oder Ablehnung an, damit dauerhafte Genehmigungen spätere Prompts für Schreibaktionen nicht unterdrücken können.
- Fehlende Plugin-Identität, mehrdeutiger Besitz, eine fehlende Turn-ID, eine falsche Turn-ID oder ein unsicheres Elicitation-Schema führen zu einer Ablehnung statt zu einer Aufforderung.

## Fehlerbehebung

**`auth_required`:** Die Migration hat das Plugin installiert, aber eine seiner Apps benötigt noch Authentifizierung. Der explizite Plugin-Eintrag wird deaktiviert geschrieben, bis Sie erneut autorisieren und ihn aktivieren.

**`app_inaccessible`, `app_disabled` oder `app_missing`:**
Die Migration hat das Plugin nicht installiert, weil das Quell-Codex-App-Inventar nicht gezeigt hat, dass alle besessenen Apps vorhanden, aktiviert und zugänglich sind, während `--verify-plugin-apps` gesetzt war. Autorisieren oder aktivieren Sie die App in Codex erneut und führen Sie die Migration dann erneut mit `--verify-plugin-apps` aus.

**`app_inventory_unavailable`:** Die Migration hat das Plugin nicht installiert, weil strikte Quell-App-Verifizierung angefordert wurde und die Aktualisierung des Quell-Codex-App-Inventars fehlgeschlagen ist. Beheben Sie den Zugriff auf den Quell-Codex-app-server oder versuchen Sie es ohne `--verify-plugin-apps` erneut, wenn Sie den schnelleren konto-gesteuerten Plan akzeptieren.

**`codex_subscription_required`:** Die Migration hat das app-gestützte Plugin nicht installiert, weil das Quell-Codex-app-server-Konto nicht mit einem ChatGPT-Abonnementkonto angemeldet war. Melden Sie sich in der Codex-App mit Abonnementauthentifizierung an und führen Sie die Migration dann erneut aus.

**`codex_account_unavailable`:** Die Migration hat das app-gestützte Plugin nicht installiert, weil das Quell-Codex-app-server-Konto nicht gelesen werden konnte. Beheben Sie die Authentifizierung des Quell-Codex-app-server oder führen Sie die Migration erneut mit `--verify-plugin-apps` aus, wenn das Quell-App-Inventar bei fehlgeschlagener Kontosuche über die Berechtigung entscheiden soll.

**`marketplace_missing` oder `plugin_missing`:** Der Ziel-Codex-app-server kann den erwarteten `openai-curated`-Marketplace oder das erwartete Plugin nicht sehen. Führen Sie die Migration erneut gegen die Ziellaufzeit aus oder prüfen Sie den Plugin-Status des Codex app-server.

**`app_inventory_missing` oder `app_inventory_stale`:** Die App-Bereitschaft stammt aus einem leeren oder veralteten Cache. OpenClaw plant eine asynchrone Aktualisierung und schließt Plugin-Apps aus, bis Besitz und Bereitschaft bekannt sind.

**`app_ownership_ambiguous`:** Das App-Inventar wurde nur nach Anzeigenamen abgeglichen, daher wird die App dem Codex-Thread nicht offengelegt.

**Konfiguration geändert, aber der Agent kann das Plugin nicht sehen:** Verwenden Sie `/codex plugins list`, um den konfigurierten Zustand zu bestätigen, und verwenden Sie dann `/new` oder `/reset`. Bestehende Codex-Thread-Bindungen behalten die App-Konfiguration, mit der sie gestartet wurden, bis OpenClaw eine neue Harness-Sitzung herstellt oder eine veraltete Bindung ersetzt.

**Destruktive Aktion wird abgelehnt:** Prüfen Sie die globalen und Plugin-spezifischen
`allow_destructive_actions`-Werte. Selbst wenn die Richtlinie `true`, `"auto"` oder
`"always"` ist, schlagen unsichere Elicitation-Schemas und eine mehrdeutige Plugin-Identität weiterhin
geschlossen fehl.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrieren](/de/cli/migrate)
