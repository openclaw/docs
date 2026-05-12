---
read_when:
    - Sie möchten, dass OpenClaw-Agenten im Codex-Modus native Codex-Plugins verwenden
    - Sie migrieren aus dem Quellcode installierte, von OpenAI kuratierte Codex-Plugins
    - Sie beheben Probleme mit codexPlugins, dem App-Inventar, destruktiven Aktionen oder der Plugin-App-Diagnostik
summary: Migrierte native Codex-Plugins für OpenClaw-Agenten im Codex-Modus konfigurieren
title: Native Codex-Plugins
x-i18n:
    generated_at: "2026-05-12T00:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex-Plugin-Unterstützung ermöglicht einem OpenClaw-Agenten im Codex-Modus, die eigenen App- und Plugin-Funktionen des Codex-App-Servers im selben Codex-Thread zu verwenden, der den OpenClaw-Turn verarbeitet.

OpenClaw übersetzt Codex-Plugins nicht in synthetische dynamische OpenClaw-Tools `codex_plugin_*`. Plugin-Aufrufe bleiben im nativen Codex-Transkript, und der Codex-App-Server ist für die App-gestützte MCP-Ausführung zuständig.

Verwenden Sie diese Seite, nachdem der grundlegende [Codex-Harness](/de/plugins/codex-harness) funktioniert.

## Anforderungen

- Die ausgewählte OpenClaw-Agentenlaufzeit muss der native Codex-Harness sein.
- `plugins.entries.codex.enabled` muss true sein.
- `plugins.entries.codex.config.codexPlugins.enabled` muss true sein.
- V1 unterstützt nur `openai-curated`-Plugins, die bei der Migration als in der Quell-Codex-Home source-installiert erkannt wurden.
- Der Ziel-Codex-App-Server muss den erwarteten Marketplace sowie das erwartete Plugin- und App-Inventar sehen können.

`codexPlugins` hat keine Auswirkung auf PI-Ausführungen, normale OpenAI-Provider-Ausführungen, ACP-Konversationsbindungen oder andere Harnesses, weil diese Pfade keine Codex-App-Server-Threads mit nativer `apps`-Konfiguration erstellen.

## Schnellstart

Migration aus der Quell-Codex-Home als Vorschau anzeigen:

```bash
openclaw migrate codex --dry-run
```

Wenden Sie die Migration an, wenn der Plan korrekt aussieht:

```bash
openclaw migrate apply codex --yes
```

Die Migration schreibt explizite `codexPlugins`-Einträge für berechtigte Plugins und ruft für ausgewählte Plugins `plugin/install` des Codex-App-Servers auf. Eine typische migrierte Konfiguration sieht so aus:

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

Nachdem Sie `codexPlugins` geändert haben, verwenden Sie `/new`, `/reset` oder starten Sie den Gateway neu, damit künftige Codex-Harness-Sitzungen mit dem aktualisierten App-Satz starten.

## Funktionsweise der nativen Plugin-Einrichtung

Die Integration hat drei getrennte Zustände:

- Installiert: Codex verfügt über das lokale Plugin-Bundle in der Ziel-App-Server-Laufzeit.
- Aktiviert: Die OpenClaw-Konfiguration ist bereit, das Plugin für Codex-Harness-Turns verfügbar zu machen.
- Zugänglich: Der Codex-App-Server bestätigt, dass die App-Einträge des Plugins für das aktive Konto verfügbar sind und der migrierten Plugin-Identität zugeordnet werden können.

Die Migration ist der dauerhafte Installations- und Berechtigungsschritt. Das Laufzeit-App-Inventar ist die Zugänglichkeitsprüfung. Die Einrichtung der Codex-Harness-Sitzung berechnet anschließend eine restriktive Thread-App-Konfiguration für die aktivierten und zugänglichen Plugin-Apps.

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung einrichtet oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn neu berechnet.

## V1-Unterstützungsgrenze

V1 ist absichtlich eng gefasst:

- Nur `openai-curated`-Plugins, die bereits im Quell-Codex-App-Server-Inventar installiert waren, sind für die Migration berechtigt.
- Die Migration schreibt explizite Plugin-Identitäten mit `marketplaceName` und `pluginName`; sie schreibt keine lokalen `marketplacePath`-Cache-Pfade.
- `codexPlugins.enabled` ist der globale Aktivierungsschalter.
- Es gibt keinen `plugins["*"]`-Wildcard und keinen Konfigurationsschlüssel, der beliebige Installationsberechtigung gewährt.
- Nicht unterstützte Marketplaces, zwischengespeicherte Plugin-Bundles, Hooks und Codex-Konfigurationsdateien bleiben im Migrationsbericht zur manuellen Prüfung erhalten.

## App-Inventar und Besitz

OpenClaw liest das Codex-App-Inventar über `app/list` des App-Servers, speichert es eine Stunde lang zwischen und aktualisiert veraltete oder fehlende Einträge asynchron.

Eine Plugin-App wird nur offengelegt, wenn OpenClaw sie über stabilen Besitz wieder dem migrierten Plugin zuordnen kann:

- exakte App-ID aus den Plugin-Details
- bekannter MCP-Servername
- eindeutige stabile Metadaten

Nur nach Anzeigename übereinstimmender oder mehrdeutiger Besitz wird ausgeschlossen, bis die nächste Inventaraktualisierung den Besitz nachweist.

## Thread-App-Konfiguration

OpenClaw fügt einen restriktiven `config.apps`-Patch für den Codex-Thread ein: `_default` ist deaktiviert, und nur Apps im Besitz aktivierter migrierter Plugins sind aktiviert.

OpenClaw setzt `destructive_enabled` auf App-Ebene anhand der effektiven globalen oder Plugin-spezifischen `allow_destructive_actions`-Richtlinie und lässt Codex destruktive Tool-Metadaten aus seinen nativen App-Tool-Annotationen durchsetzen. Die `_default`-App-Konfiguration ist mit `open_world_enabled: false` deaktiviert. Aktivierte Plugin-Apps werden mit `open_world_enabled: true` ausgegeben; OpenClaw stellt keinen separaten Plugin-Schalter für eine Open-World-Richtlinie bereit und pflegt keine Plugin-spezifischen Sperrlisten für destruktive Tool-Namen.

Der Tool-Genehmigungsmodus ist standardmäßig für Plugin-Apps automatisch, damit nicht destruktive Lese-Tools ohne Genehmigungsoberfläche im selben Thread ausgeführt werden können. Destruktive Tools bleiben durch die jeweilige `destructive_enabled`-Richtlinie der App gesteuert.

## Richtlinie für destruktive Aktionen

Destruktive Plugin-Elicitations sind für migrierte Codex-Plugins standardmäßig erlaubt, während unsichere Schemata und mehrdeutiger Besitz weiterhin geschlossen fehlschlagen:

- Globales `allow_destructive_actions` ist standardmäßig `true`.
- Plugin-spezifisches `allow_destructive_actions` überschreibt die globale Richtlinie für dieses Plugin.
- Wenn die Richtlinie `false` ist, gibt OpenClaw eine deterministische Ablehnung zurück.
- Wenn die Richtlinie `true` ist, akzeptiert OpenClaw automatisch nur sichere Schemata, die einer Genehmigungsantwort zugeordnet werden können, etwa ein boolesches Genehmigungsfeld.
- Fehlende Plugin-Identität, mehrdeutiger Besitz, eine fehlende Turn-ID, eine falsche Turn-ID oder ein unsicheres Elicitation-Schema führen zu einer Ablehnung statt zu einer Eingabeaufforderung.

## Fehlerbehebung

**`auth_required`:** Die Migration hat das Plugin installiert, aber eine seiner Apps benötigt weiterhin Authentifizierung. Der explizite Plugin-Eintrag wird deaktiviert geschrieben, bis Sie ihn erneut autorisieren und aktivieren.

**`marketplace_missing` oder `plugin_missing`:** Der Ziel-Codex-App-Server kann den erwarteten `openai-curated`-Marketplace oder das erwartete Plugin nicht sehen. Führen Sie die Migration gegen die Ziellaufzeit erneut aus oder prüfen Sie den Plugin-Status des Codex-App-Servers.

**`app_inventory_missing` oder `app_inventory_stale`:** Die App-Bereitschaft stammte aus einem leeren oder veralteten Cache. OpenClaw plant eine asynchrone Aktualisierung und schließt Plugin-Apps aus, bis Besitz und Bereitschaft bekannt sind.

**`app_ownership_ambiguous`:** Das App-Inventar stimmte nur anhand des Anzeigenamens überein, daher wird die App dem Codex-Thread nicht offengelegt.

**Konfiguration geändert, aber der Agent kann das Plugin nicht sehen:** Verwenden Sie `/new`, `/reset` oder starten Sie den Gateway neu. Bestehende Codex-Thread-Bindungen behalten die App-Konfiguration, mit der sie gestartet wurden, bis OpenClaw eine neue Harness-Sitzung einrichtet oder eine veraltete Bindung ersetzt.

**Destruktive Aktion wird abgelehnt:** Prüfen Sie die globalen und Plugin-spezifischen `allow_destructive_actions`-Werte. Selbst wenn die Richtlinie wahr ist, schlagen unsichere Elicitation-Schemata und mehrdeutige Plugin-Identität weiterhin geschlossen fehl.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Konfigurationsreferenz](/de/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate-CLI](/de/cli/migrate)
