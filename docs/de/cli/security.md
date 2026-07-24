---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung der Konfiguration und des Zustands durchführen
    - Sie möchten sichere „Fix“-Vorschläge anwenden (Berechtigungen, Standardeinstellungen verschärfen)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheitsfallen prüfen und beheben)
title: Sicherheit
x-i18n:
    generated_at: "2026-07-24T03:46:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b5f9ea5cb746bfd29ff4d096062e81595abe99a883fc3b1113b45a3527d42d9
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Sicherheitstools: Prüfung sowie optionale sichere Korrekturen. Siehe auch: [Sicherheit](/de/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Prüfmodi

Ein einfacher Aufruf von `security audit` bleibt auf dem inaktiven, schreibgeschützten Konfigurations-/Dateisystempfad: Er ermittelt keine Sicherheitsprüfer der Plugin-Laufzeit, sodass routinemäßige Prüfungen nicht die Laufzeit jedes installierten Plugins laden. `--deep` ergänzt nach Möglichkeit Live-Prüfungen des Gateways sowie Plugin-eigene Sicherheitsprüfer (explizite interne Aufrufer können diese Prüfer ebenfalls aktivieren, wenn ihnen bereits ein geeigneter Laufzeitbereich zur Verfügung steht).

Wenn die Gateway-Passwortauthentifizierung nur beim Start angegeben wird, übergeben Sie denselben Wert mit `--auth password --password <password>`, damit die Prüfung ihn mit `hooks.token` abgleichen kann.

## Was geprüft wird

**DM-/Vertrauensmodell**

- Warnt, wenn mehrere DM-Absender dieselbe Hauptsitzung verwenden, und empfiehlt für gemeinsam genutzte Posteingänge den sicheren DM-Modus: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Kanäle mit mehreren Konten). Dies dient der Absicherung kooperativer, gemeinsam genutzter Posteingänge und nicht der Isolation gegenseitig nicht vertrauenswürdiger Betreiber; trennen Sie solche Vertrauensbereiche durch separate Gateways (oder separate Betriebssystembenutzer/-hosts).
- Gibt `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration auf einen wahrscheinlich von mehreren Benutzern verwendeten Eingang hindeutet (beispielsweise offene DM-/Gruppenrichtlinien, konfigurierte Gruppenziele oder Platzhalterregeln für Absender) – das standardmäßige Vertrauensmodell von OpenClaw ist ein persönlicher Assistent (ein Betreiber), keine feindselige Mehrmandantenisolation. Bei absichtlich von mehreren Benutzern verwendeten Einrichtungen: Verwenden Sie für alle Sitzungen eine Sandbox, beschränken Sie den Dateisystemzugriff auf den Arbeitsbereich und halten Sie persönliche/private Identitäten oder Anmeldedaten von dieser Laufzeit fern.
- Warnt, wenn kleine Modelle (`<=300B` Parameter) ohne Sandbox und mit aktivierten Web-/Browser-Tools verwendet werden.

**Webhook/Hook-Funktionen**

Beim Start wird eine nicht schwerwiegende Sicherheitswarnung protokolliert, und die Prüfung meldet die `hooks.token`-Wiederverwendung aktiver gemeinsamer geheimer Authentifizierungswerte des Gateways (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Außerdem wird gewarnt, wenn:

- `hooks.token` kurz ist
- `hooks.path="/"`
- `hooks.defaultSessionKey` nicht festgelegt ist
- `hooks.allowedAgentIds` uneingeschränkt ist
- Überschreibungen von `sessionKey` für Anfragen aktiviert sind
- Überschreibungen ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind

Führen Sie `openclaw doctor --fix` aus, um ein dauerhaft gespeichertes, wiederverwendetes `hooks.token` zu rotieren, und aktualisieren Sie anschließend externe Hook-Absender, sodass sie das neue Token verwenden.

**Sandbox/Tools**

- Warnt, wenn Docker-Einstellungen für die Sandbox konfiguriert sind, während der Sandbox-Modus deaktiviert ist.
- Warnt, wenn `gateway.nodes.commands.deny` wirkungslose musterartige oder unbekannte Einträge verwendet (der Abgleich erfolgt ausschließlich anhand des exakten Node-Befehlsnamens, nicht durch Filterung des Shell-Texts).
- Warnt, wenn `gateway.nodes.commands.allow` gefährliche Node-Befehle ausdrücklich aktiviert.
- Warnt, wenn das globale `tools.profile="minimal"` durch Tool-Profile von Agenten überschrieben wird.
- Warnt, wenn Schreib-/Bearbeitungstools deaktiviert sind, `exec` jedoch weiterhin ohne begrenzende Sandbox-Dateisystemgrenze verfügbar ist.
- Warnt, wenn offene DMs oder Gruppen Laufzeit-/Dateisystemtools ohne Sandbox-/Arbeitsbereichsschutz zugänglich machen.
- Warnt, wenn Tools installierter Plugins unter einer permissiven Tool-Richtlinie erreichbar sein könnten.

**Sandbox-Browser**

- Warnt, wenn der Sandbox-Browser das Docker-Netzwerk `bridge` ohne `sandbox.browser.cdpSourceRange` verwendet.
- Meldet gefährliche Docker-Netzwerkmodi der Sandbox, einschließlich `host` und der Verknüpfung mit `container:*`-Namespaces.
- Warnt, wenn vorhandene Docker-Container des Sandbox-Browsers fehlende oder veraltete Hash-Labels aufweisen (beispielsweise vor der Migration erstellte Container ohne `openclaw.browserConfigEpoch`), und empfiehlt `openclaw sandbox recreate --browser --all`.

**Netzwerk/Ermittlung**

- Meldet `gateway.allowRealIpFallback=true` (Risiko gefälschter Header bei fehlerhaft konfigurierten Proxys).
- Meldet `discovery.mdns.mode="full"` (Offenlegung von Metadaten über mDNS-TXT-Einträge).
- Warnt, wenn `gateway.auth.mode="none"` die HTTP-APIs des Gateways ohne gemeinsames Geheimnis erreichbar lässt (`/tools/invoke` sowie alle aktivierten `/v1/*`-Endpunkte).

**Plugins/Kanäle**

- Warnt, wenn npm-basierte Installationsdatensätze von Plugins/Hooks nicht auf eine Version festgelegt sind, Integritätsmetadaten fehlen oder sie von den derzeit installierten Paketversionen abweichen.
- Warnt, wenn Zulassungslisten für Kanäle veränderliche Namen/E-Mail-Adressen/Tags statt stabiler IDs verwenden (soweit zutreffend für Discord, Slack, Google Chat, Microsoft Teams, Mattermost und IRC-Bereiche).

Einstellungen mit dem Präfix `dangerous`/`dangerously` sind ausdrückliche Notfallüberschreibungen durch den Betreiber; ihre Aktivierung stellt für sich genommen keinen Bericht über eine Sicherheitslücke dar. Eine vollständige Übersicht der gefährlichen Parameter finden Sie unter „Zusammenfassung unsicherer oder gefährlicher Flags“ in [Sicherheit](/de/gateway/security).

## Verhalten von SecretRef

`security audit` löst unterstützte SecretRefs für die jeweiligen Zielpfade im schreibgeschützten Modus auf. Wenn eine SecretRef im aktuellen Befehlspfad nicht verfügbar ist, wird die Prüfung fortgesetzt und meldet `secretDiagnostics`, anstatt abzustürzen. `--token` und `--password` überschreiben nur die Authentifizierung für die Tiefenprüfung dieses Befehlsaufrufs; sie ändern weder die Konfiguration noch SecretRef-Zuordnungen.

## Unterdrückungen

Akzeptieren Sie bewusst dauerhaft bestehende Befunde mit `security.audit.suppressions`. Jede Unterdrückung stimmt mit einer exakten `checkId` überein und kann mit Teilzeichenfolgen für `titleIncludes` und/oder `detailIncludes` ohne Beachtung der Groß-/Kleinschreibung eingegrenzt werden:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Aktivierte Erweiterungs-Plugins: gbrain",
          "reason": "vertrauenswürdiges Plugin eines lokalen Betreibers"
        }
      ]
    }
  }
}
```

Unterdrückte Befunde werden aus der aktiven Liste `summary` und `findings` entfernt. Die JSON-Ausgabe behält sie zur Nachvollziehbarkeit unter `suppressedFindings` bei. Wenn Unterdrückungen konfiguriert sind, enthält die aktive Ausgabe außerdem einen nicht unterdrückbaren Informationsbefund `security.audit.suppressions.active`, damit Leser erkennen können, dass die Prüfung gefiltert wurde. Gefährliche Konfigurations-Flags werden einzeln als Befund ausgegeben, sodass die Akzeptanz eines gefährlichen Flags keine anderen aktivierten Flags verbirgt, die dieselbe `config.insecure_or_dangerous_flags`-checkId verwenden.

Da Unterdrückungen dauerhafte Risiken verbergen können, erfordert ihr Hinzufügen oder Entfernen durch von Agenten ausgeführte Shell-Befehle eine Ausführungsgenehmigung, sofern die Ausführung für vertrauenswürdige lokale Automatisierung nicht bereits mit `security="full"` und `ask="off"` erfolgt.

## JSON-Ausgabe

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Mit `--fix --json` enthält die Ausgabe sowohl die Korrekturaktionen als auch den Abschlussbericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

Wendet sichere, deterministische Behebungsmaßnahmen an:

- ändert gängige `groupPolicy="open"` in `groupPolicy="allowlist"` (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie zu `allowlist` geändert wird, wird `groupAllowFrom` aus der gespeicherten Datei `allowFrom` befüllt, sofern diese Liste vorhanden ist und die Konfiguration `allowFrom` noch nicht definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft die Berechtigungen für Status-/Konfigurationsdateien und gängige sensible Dateien (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` und veraltete Sitzungsartefakte)
- verschärft außerdem die Berechtigungen für Konfigurations-Include-Dateien, auf die in `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Zurücksetzungen unter Windows

`--fix` führt **Folgendes nicht aus**:

- Rotation von Tokens/Passwörtern/API-Schlüsseln
- Deaktivierung von Tools (`gateway`, `cron`, `exec` usw.)
- Änderung der Auswahl für Gateway-Bindung/-Authentifizierung/-Netzwerkfreigabe
- Entfernung oder Änderung von Plugins/Skills

## Siehe auch

- [CLI-Referenz](/de/cli)
- [Sicherheitsprüfung](/de/gateway/security)
