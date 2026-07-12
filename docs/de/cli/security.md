---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung der Konfiguration und des Zustands durchführen
    - Sie möchten sichere „Fix“-Vorschläge anwenden (Berechtigungen, restriktivere Standardeinstellungen)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheitsfallen prüfen und beheben)
title: Sicherheit
x-i18n:
    generated_at: "2026-07-12T15:11:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Sicherheitswerkzeuge: Audit sowie optionale sichere Korrekturen. Siehe auch: [Sicherheit](/de/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Audit-Modi

Ein einfacher `security audit` verbleibt auf dem inaktiven, schreibgeschützten Pfad für Konfiguration und Dateisystem: Er ermittelt keine Sicherheits-Collector der Plugin-Laufzeit, sodass routinemäßige Audits nicht jede installierte Plugin-Laufzeit laden. `--deep` ergänzt nach bestem Bemühen Live-Prüfungen des Gateway und Plugin-eigene Sicherheits-Audit-Collector (explizite interne Aufrufer können diese Collector ebenfalls aktivieren, wenn sie bereits über einen geeigneten Laufzeitbereich verfügen).

Wenn die Gateway-Passwortauthentifizierung nur beim Start bereitgestellt wird, übergeben Sie denselben Wert mit `--auth password --password <password>`, damit das Audit ihn mit `hooks.token` abgleichen kann.

## Was geprüft wird

**DM-/Vertrauensmodell**

- Warnt, wenn mehrere DM-Absender dieselbe Hauptsitzung gemeinsam nutzen, und empfiehlt den sicheren DM-Modus: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Kanäle mit mehreren Konten) für gemeinsam genutzte Posteingänge. Dies dient der Absicherung kooperativer/gemeinsam genutzter Posteingänge und nicht der Isolation gegenseitig nicht vertrauenswürdiger Betreiber; trennen Sie solche Vertrauensgrenzen durch separate Gateways (oder separate Betriebssystembenutzer/Hosts).
- Gibt `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration auf einen wahrscheinlich gemeinsam genutzten Benutzerzugang hindeutet (beispielsweise eine offene DM-/Gruppenrichtlinie, konfigurierte Gruppenziele oder Platzhalterregeln für Absender) – das standardmäßige Vertrauensmodell von OpenClaw ist ein persönlicher Assistent (ein Betreiber), keine feindselige Mehrmandantenisolation. Für bewusst gemeinsam genutzte Einrichtungen: Führen Sie alle Sitzungen in einer Sandbox aus, beschränken Sie den Dateisystemzugriff auf den Arbeitsbereich und halten Sie persönliche/private Identitäten oder Anmeldedaten von dieser Laufzeit fern.
- Warnt, wenn kleine Modelle (`<=300B` Parameter) ohne Sandbox und mit aktivierten Web-/Browserwerkzeugen verwendet werden.

**Webhook/Hook**

Beim Start wird eine nicht schwerwiegende Sicherheitswarnung protokolliert, und das Audit kennzeichnet die Wiederverwendung aktiver Werte für die Shared-Secret-Authentifizierung des Gateway als `hooks.token` (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Es warnt außerdem, wenn:

- `hooks.token` kurz ist
- `hooks.path="/"` gesetzt ist
- `hooks.defaultSessionKey` nicht gesetzt ist
- `hooks.allowedAgentIds` uneingeschränkt ist
- Überschreibungen von `sessionKey` in Anfragen aktiviert sind
- Überschreibungen ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind

Führen Sie `openclaw doctor --fix` aus, um ein dauerhaft gespeichertes, wiederverwendetes `hooks.token` zu rotieren, und aktualisieren Sie anschließend externe Hook-Absender, damit sie das neue Token verwenden.

**Sandbox/Werkzeuge**

- Warnt, wenn Docker-Einstellungen für die Sandbox konfiguriert sind, während der Sandbox-Modus deaktiviert ist.
- Warnt, wenn `gateway.nodes.denyCommands` unwirksame musterähnliche/unbekannte Einträge verwendet (der Abgleich erfolgt ausschließlich anhand des exakten Node-Befehlsnamens, nicht durch Filterung von Shell-Text).
- Warnt, wenn `gateway.nodes.allowCommands` ausdrücklich gefährliche Node-Befehle aktiviert.
- Warnt, wenn das globale `tools.profile="minimal"` durch Werkzeugprofile von Agenten überschrieben wird.
- Warnt, wenn Schreib-/Bearbeitungswerkzeuge deaktiviert sind, `exec` jedoch weiterhin ohne einschränkende Dateisystemgrenze der Sandbox verfügbar ist.
- Warnt, wenn offene DMs oder Gruppen Laufzeit-/Dateisystemwerkzeuge ohne Sandbox-/Arbeitsbereichsschutz zugänglich machen.
- Warnt, wenn Werkzeuge installierter Plugins unter einer freizügigen Werkzeugrichtlinie erreichbar sein könnten.

**Sandbox-Browser**

- Warnt, wenn der Sandbox-Browser das Docker-Netzwerk `bridge` ohne `sandbox.browser.cdpSourceRange` verwendet.
- Kennzeichnet gefährliche Docker-Netzwerkmodi der Sandbox, einschließlich `host` und Verknüpfungen mit `container:*`-Namespaces.
- Warnt, wenn vorhandene Docker-Container des Sandbox-Browsers fehlende/veraltete Hash-Labels aufweisen (beispielsweise Container von vor der Migration, denen `openclaw.browserConfigEpoch` fehlt), und empfiehlt `openclaw sandbox recreate --browser --all`.

**Netzwerk/Ermittlung**

- Kennzeichnet `gateway.allowRealIpFallback=true` (Risiko der Manipulation von Headern bei falsch konfigurierten Proxys).
- Kennzeichnet `discovery.mdns.mode="full"` (Offenlegung von Metadaten über mDNS-TXT-Einträge).
- Warnt, wenn `gateway.auth.mode="none"` die HTTP-APIs des Gateway ohne Shared Secret erreichbar lässt (`/tools/invoke` sowie alle aktivierten `/v1/*`-Endpunkte).

**Plugins/Kanäle**

- Warnt, wenn npm-basierte Plugin-/Hook-Installationsdatensätze nicht auf eine feste Version festgelegt sind, Integritätsmetadaten fehlen oder sie von den derzeit installierten Paketversionen abweichen.
- Warnt, wenn Kanal-Zulassungslisten veränderliche Namen/E-Mail-Adressen/Tags anstelle stabiler IDs verwenden (Discord, Slack, Google Chat, Microsoft Teams, Mattermost und gegebenenfalls IRC-Geltungsbereiche).

Einstellungen mit dem Präfix `dangerous`/`dangerously` sind explizite Notfall-Ausnahmen für Betreiber; ihre Aktivierung stellt für sich genommen keine Meldung einer Sicherheitslücke dar. Eine vollständige Übersicht der gefährlichen Parameter finden Sie unter „Zusammenfassung unsicherer oder gefährlicher Flags“ in [Sicherheit](/de/gateway/security).

## Verhalten von SecretRef

`security audit` löst unterstützte SecretRefs für die von der Prüfung erfassten Pfade im schreibgeschützten Modus auf. Wenn eine SecretRef im aktuellen Befehlspfad nicht verfügbar ist, wird die Prüfung fortgesetzt und meldet `secretDiagnostics`, anstatt abzustürzen. `--token` und `--password` überschreiben nur die Authentifizierung für die Tiefenprüfung bei diesem Befehlsaufruf; sie ändern weder die Konfiguration noch SecretRef-Zuordnungen.

## Unterdrückungen

Akzeptieren Sie bewusst dauerhaft bestehende Befunde mit `security.audit.suppressions`. Jede Unterdrückung entspricht einer exakten `checkId` und kann mit den Teilzeichenfolgen `titleIncludes` und/oder `detailIncludes`, bei denen die Groß-/Kleinschreibung nicht berücksichtigt wird, eingegrenzt werden:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Aktivierte Erweiterungs-Plugins: gbrain",
          "reason": "vertrauenswürdiges lokales Operator-Plugin"
        }
      ]
    }
  }
}
```

Unterdrückte Befunde werden aus der aktiven `summary` und der Liste `findings` entfernt. Die JSON-Ausgabe behält sie zur Nachvollziehbarkeit unter `suppressedFindings` bei. Wenn Unterdrückungen konfiguriert sind, enthält die aktive Ausgabe außerdem einen nicht unterdrückbaren Informationsbefund `security.audit.suppressions.active`, damit Leser erkennen können, dass das Audit gefiltert wurde. Gefährliche Konfigurations-Flags werden einzeln als jeweils eigener Befund ausgegeben. Dadurch werden beim Akzeptieren eines gefährlichen Flags keine anderen aktivierten Flags ausgeblendet, die dieselbe `config.insecure_or_dangerous_flags`-checkId verwenden.

Da Unterdrückungen bestehende Risiken verbergen können, erfordert ihr Hinzufügen oder Entfernen über von Agenten ausgeführte Shell-Befehle eine Ausführungsgenehmigung, sofern die Ausführung für vertrauenswürdige lokale Automatisierung nicht bereits mit `security="full"` und `ask="off"` erfolgt.

## JSON-Ausgabe

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Mit `--fix --json` enthält die Ausgabe sowohl die Korrekturaktionen als auch den abschließenden Bericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

Wendet sichere, deterministische Korrekturen an:

- ändert gängige Einstellungen von `groupPolicy="open"` zu `groupPolicy="allowlist"` (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie zu `allowlist` geändert wird, wird `groupAllowFrom` aus der gespeicherten `allowFrom`-Datei befüllt, sofern diese Liste vorhanden ist und die Konfiguration `allowFrom` nicht bereits definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft die Berechtigungen für Status-/Konfigurationsdateien und gängige sensible Dateien (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` und veraltete Sitzungsartefakte)
- verschärft außerdem die Berechtigungen für Konfigurations-Include-Dateien, auf die in `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und setzt Berechtigungen unter Windows mit `icacls` zurück

`--fix` führt Folgendes **nicht** aus:

- Tokens/Passwörter/API-Schlüssel rotieren
- Tools deaktivieren (`gateway`, `cron`, `exec` usw.)
- Entscheidungen zur Gateway-Bindung, -Authentifizierung oder -Netzwerkfreigabe ändern
- Plugins/Skills entfernen oder umschreiben

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Sicherheitsaudit](/de/gateway/security)
