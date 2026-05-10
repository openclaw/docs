---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus native Codex-Plugins verwenden.
    - Sie migrieren aus dem Quellcode installierte, von openai kuratierte Codex-Plugins
    - Sie beheben Probleme mit codexPlugins, dem App-Inventar, destruktiven Aktionen oder Plugin-App-Diagnosen
summary: Migrierte native Codex-Plugins für OpenClaw-Agenten im Codex-Modus konfigurieren
title: Native Codex-Plugins
x-i18n:
    generated_at: "2026-05-10T19:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Die native Codex-Plugin-Unterstützung ermöglicht einem OpenClaw-Agenten im Codex-Modus, die eigenen App- und Plugin-Funktionen des Codex app-server im selben Codex-Thread zu verwenden, der den OpenClaw-Turn verarbeitet.

OpenClaw übersetzt Codex-Plugins nicht in synthetische `codex_plugin_*` dynamische OpenClaw-Tools. Plugin-Aufrufe bleiben im nativen Codex-Transkript, und Codex app-server ist für die app-gestützte MCP-Ausführung zuständig.

Verwenden Sie diese Seite, nachdem das grundlegende [Codex-Harness](/de/plugins/codex-harness) funktioniert.

## Anforderungen

- Die ausgewählte OpenClaw-Agentenlaufzeit muss das native Codex-Harness sein.
- `plugins.entries.codex.enabled` muss true sein.
- `plugins.entries.codex.config.codexPlugins.enabled` muss true sein.
- V1 unterstützt nur `openai-curated` Plugins, die die Migration als
  quellinstalliert im Codex-Home der Quelle erkannt hat.
- Der Ziel-Codex app-server muss den erwarteten Marketplace sowie das Plugin- und App-Inventar sehen können.

`codexPlugins` hat keine Auswirkung auf PI-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversationsbindungen oder andere Harnesses, weil diese Pfade keine Codex app-server-Threads mit nativer `apps`-Konfiguration erstellen.

## Schnellstart

Migration aus dem Codex-Home der Quelle in der Vorschau anzeigen:

```bash
openclaw migrate codex --dry-run
```

Wenden Sie die Migration an, wenn der Plan korrekt aussieht:

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
            allow_destructive_actions: false,
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

Verwenden Sie nach Änderungen an `codexPlugins` `/new`, `/reset`, oder starten Sie den Gateway neu, damit zukünftige Codex-Harness-Sitzungen mit dem aktualisierten App-Set starten.

## Funktionsweise der nativen Plugin-Einrichtung

Die Integration hat drei separate Zustände:

- Installiert: Codex hat das lokale Plugin-Bundle in der Ziel-app-server-Laufzeit.
- Aktiviert: Die OpenClaw-Konfiguration ist bereit, das Plugin für Codex-Harness-Turns verfügbar zu machen.
- Zugänglich: Codex app-server bestätigt, dass die App-Einträge des Plugins für das aktive Konto verfügbar sind und der migrierten Plugin-Identität zugeordnet werden können.

Die Migration ist der dauerhafte Installations- und Berechtigungsschritt. Das Laufzeit-App-Inventar ist die Zugänglichkeitsprüfung. Die Einrichtung der Codex-Harness-Sitzung berechnet anschließend eine restriktive Thread-App-Konfiguration für die aktivierten und zugänglichen Plugin-Apps.

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung herstellt oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn neu berechnet.

## Unterstützungsumfang von V1

V1 ist absichtlich eng gefasst:

- Nur `openai-curated` Plugins, die bereits im app-server-Inventar der Codex-Quelle installiert waren, sind migrationsberechtigt.
- Die Migration schreibt explizite Plugin-Identitäten mit `marketplaceName` und `pluginName`; sie schreibt keine lokalen `marketplacePath`-Cache-Pfade.
- `codexPlugins.enabled` ist der globale Aktivierungsschalter.
- Es gibt keinen `plugins["*"]`-Wildcard und keinen Konfigurationsschlüssel, der beliebige Installationsberechtigungen gewährt.
- Nicht unterstützte Marketplaces, zwischengespeicherte Plugin-Bundles, Hooks und Codex-Konfigurationsdateien bleiben im Migrationsbericht zur manuellen Prüfung erhalten.

## App-Inventar und Eigentümerschaft

OpenClaw liest das Codex-App-Inventar über app-server `app/list`, speichert es eine Stunde lang im Cache und aktualisiert veraltete oder fehlende Einträge asynchron.

Eine Plugin-App wird nur offengelegt, wenn OpenClaw sie über stabile Eigentümerschaft dem migrierten Plugin zuordnen kann:

- exakte App-ID aus den Plugin-Details
- bekannter MCP-Servername
- eindeutige stabile Metadaten

Nur über Anzeigenamen gefundene oder mehrdeutige Eigentümerschaft wird ausgeschlossen, bis die nächste Inventaraktualisierung die Eigentümerschaft nachweist.

## Thread-App-Konfiguration

OpenClaw injiziert einen restriktiven `config.apps`-Patch für den Codex-Thread: `_default` ist deaktiviert, und nur Apps, die aktivierten migrierten Plugins gehören, sind aktiviert.

OpenClaw setzt `destructive_enabled` auf App-Ebene anhand der wirksamen globalen oder Plugin-spezifischen `allow_destructive_actions`-Richtlinie und lässt Codex destruktive Tool-Metadaten aus seinen nativen App-Tool-Annotationen erzwingen. Die `_default`-App-Konfiguration wird mit `open_world_enabled: false` deaktiviert. Aktivierte Plugin-Apps werden mit `open_world_enabled: true` ausgegeben; OpenClaw stellt keinen separaten Plugin-Richtlinienregler für Open World bereit und pflegt keine Plugin-spezifischen Sperrlisten für destruktive Tool-Namen.

Der Tool-Genehmigungsmodus wird für Plugin-Apps standardmäßig abgefragt, weil OpenClaw in diesem Same-Thread-Pfad keine interaktive App-Elicitation-UI hat.

## Richtlinie für destruktive Aktionen

Destruktive Plugin-Elicitations schlagen standardmäßig geschlossen fehl:

- Globales `allow_destructive_actions` ist standardmäßig `false`.
- Plugin-spezifisches `allow_destructive_actions` überschreibt die globale Richtlinie für dieses Plugin.
- Wenn die Richtlinie `false` ist, gibt OpenClaw eine deterministische Ablehnung zurück.
- Wenn die Richtlinie `true` ist, akzeptiert OpenClaw automatisch nur sichere Schemas, die es einer Genehmigungsantwort zuordnen kann, etwa einem booleschen Genehmigungsfeld.
- Fehlende Plugin-Identität, mehrdeutige Eigentümerschaft, eine fehlende Turn-ID, eine falsche Turn-ID oder ein unsicheres Elicitation-Schema führen zur Ablehnung, statt eine Abfrage auszulösen.

## Fehlerbehebung

**`auth_required`:** Die Migration hat das Plugin installiert, aber eine seiner Apps benötigt noch Authentifizierung. Der explizite Plugin-Eintrag wird deaktiviert geschrieben, bis Sie erneut autorisieren und ihn aktivieren.

**`marketplace_missing` oder `plugin_missing`:** Der Ziel-Codex app-server kann den erwarteten `openai-curated` Marketplace oder das Plugin nicht sehen. Führen Sie die Migration erneut gegen die Ziellaufzeit aus oder prüfen Sie den Plugin-Status von Codex app-server.

**`app_inventory_missing` oder `app_inventory_stale`:** Die App-Bereitschaft stammt aus einem leeren oder veralteten Cache. OpenClaw plant eine asynchrone Aktualisierung und schließt Plugin-Apps aus, bis Eigentümerschaft und Bereitschaft bekannt sind.

**`app_ownership_ambiguous`:** Das App-Inventar wurde nur anhand des Anzeigenamens abgeglichen, daher wird die App dem Codex-Thread nicht offengelegt.

**Konfiguration geändert, aber der Agent kann das Plugin nicht sehen:** Verwenden Sie `/new`, `/reset`, oder starten Sie den Gateway neu. Bestehende Codex-Thread-Bindungen behalten die App-Konfiguration, mit der sie gestartet wurden, bis OpenClaw eine neue Harness-Sitzung herstellt oder eine veraltete Bindung ersetzt.

**Destruktive Aktion wird abgelehnt:** Prüfen Sie die globalen und Plugin-spezifischen `allow_destructive_actions`-Werte. Selbst wenn die Richtlinie true ist, schlagen unsichere Elicitation-Schemas und mehrdeutige Plugin-Identität weiterhin geschlossen fehl.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate-CLI](/de/cli/migrate)
