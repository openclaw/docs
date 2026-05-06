---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung von Konfiguration/Zustand durchführen
    - Sie möchten sichere "fix"-Vorschläge anwenden (Berechtigungen, Standardwerte verschärfen)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheits-Fallstricke prüfen und beheben)
title: Sicherheit
x-i18n:
    generated_at: "2026-05-06T17:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Sicherheitstools (Audit + optionale Korrekturen).

Weiterführend:

- Sicherheitsleitfaden: [Sicherheit](/de/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Ein einfaches `security audit` bleibt auf dem kalten Pfad für Konfiguration, Dateisystem und schreibgeschützten Zugriff. Es erkennt standardmäßig keine Sicherheits-Collector der Plugin-Laufzeit, sodass routinemäßige Audits nicht jede installierte Plugin-Laufzeit laden. Verwenden Sie `--deep`, um Best-Effort-Live-Prüfungen des Gateway und Plugin-eigene Sicherheitsaudit-Collector einzubeziehen; explizite interne Aufrufer können diese Plugin-eigenen Collector ebenfalls aktivieren, wenn sie bereits über einen passenden Laufzeit-Scope verfügen.

Das Audit warnt, wenn mehrere DM-Absender dieselbe Hauptsitzung teilen, und empfiehlt den **sicheren DM-Modus**: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Kanäle mit mehreren Konten) für gemeinsam genutzte Posteingänge.
Dies dient der Härtung kooperativer/gemeinsam genutzter Posteingänge. Ein einzelnes Gateway, das von gegenseitig nicht vertrauenswürdigen oder gegnerischen Operatoren gemeinsam genutzt wird, ist keine empfohlene Konfiguration; trennen Sie Vertrauensgrenzen mit separaten Gateways (oder separaten OS-Benutzern/Hosts).
Es gibt außerdem `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration auf wahrscheinlich gemeinsam genutzten Benutzer-Ingress hindeutet (zum Beispiel offene DM-/Gruppenrichtlinie, konfigurierte Gruppenziele oder Platzhalterregeln für Absender), und erinnert Sie daran, dass OpenClaw standardmäßig ein Vertrauensmodell für persönliche Assistenten ist.
Für beabsichtigte Setups mit mehreren Benutzern empfiehlt das Audit, alle Sitzungen zu sandboxen, den Dateisystemzugriff auf den Workspace zu beschränken und persönliche/private Identitäten oder Anmeldedaten von dieser Laufzeit fernzuhalten.
Es warnt außerdem, wenn kleine Modelle (`<=300B`) ohne Sandboxing und mit aktivierten Web-/Browser-Tools verwendet werden.
Für Webhook-Ingress warnt es, wenn `hooks.token` den Gateway-Token wiederverwendet, wenn `hooks.token` kurz ist, wenn `hooks.path="/"`, wenn `hooks.defaultSessionKey` nicht gesetzt ist, wenn `hooks.allowedAgentIds` uneingeschränkt ist, wenn `sessionKey`-Overrides in Anfragen aktiviert sind und wenn Overrides ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind.
Es warnt außerdem, wenn Sandbox-Docker-Einstellungen konfiguriert sind, während der Sandbox-Modus deaktiviert ist, wenn `gateway.nodes.denyCommands` unwirksame musterähnliche oder unbekannte Einträge verwendet (nur exakte Übereinstimmung mit Node-Befehlsnamen, keine Shell-Textfilterung), wenn `gateway.nodes.allowCommands` gefährliche Node-Befehle explizit aktiviert, wenn globales `tools.profile="minimal"` durch Agent-Tool-Profile überschrieben wird, wenn offene Gruppen Laufzeit-/Dateisystem-Tools ohne Sandbox-/Workspace-Schutz verfügbar machen und wenn installierte Plugin-Tools unter einer permissiven Tool-Richtlinie erreichbar sein könnten.
Es markiert außerdem `gateway.allowRealIpFallback=true` (Risiko von Header-Spoofing bei falsch konfigurierten Proxys) und `discovery.mdns.mode="full"` (Metadatenleckage über mDNS-TXT-Datensätze).
Es warnt außerdem, wenn der Sandbox-Browser das Docker-`bridge`-Netzwerk ohne `sandbox.browser.cdpSourceRange` verwendet.
Es markiert außerdem gefährliche Sandbox-Docker-Netzwerkmodi (einschließlich `host` und Namespace-Beitritte mit `container:*`).
Es warnt außerdem, wenn vorhandene Docker-Container des Sandbox-Browsers fehlende/veraltete Hash-Labels haben (zum Beispiel Container vor der Migration ohne `openclaw.browserConfigEpoch`) und empfiehlt `openclaw sandbox recreate --browser --all`.
Es warnt außerdem, wenn npm-basierte Plugin-/Hook-Installationsdatensätze nicht gepinnt sind, Integritätsmetadaten fehlen oder von den aktuell installierten Paketversionen abweichen.
Es warnt, wenn Kanal-Allowlists auf veränderlichen Namen/E-Mails/Tags statt auf stabilen IDs beruhen (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-Scopes, sofern anwendbar).
Es warnt, wenn `gateway.auth.mode="none"` Gateway-HTTP-APIs ohne gemeinsames Secret erreichbar lässt (`/tools/invoke` plus jeden aktivierten `/v1/*`-Endpunkt).
Einstellungen mit dem Präfix `dangerous`/`dangerously` sind explizite Break-Glass-Overrides des Operators; eine solche Einstellung zu aktivieren ist für sich genommen kein Bericht über eine Sicherheitslücke.
Das vollständige Inventar gefährlicher Parameter finden Sie im Abschnitt „Zusammenfassung unsicherer oder gefährlicher Flags“ in [Sicherheit](/de/gateway/security).

SecretRef-Verhalten:

- `security audit` löst unterstützte SecretRefs für seine Zielpfade im schreibgeschützten Modus auf.
- Wenn ein SecretRef im aktuellen Befehlspfad nicht verfügbar ist, fährt das Audit fort und meldet `secretDiagnostics` (statt abzustürzen).
- `--token` und `--password` überschreiben nur die Authentifizierung für Deep-Probes für diesen Befehlsaufruf; sie schreiben weder die Konfiguration noch SecretRef-Zuordnungen um.

## JSON-Ausgabe

Verwenden Sie `--json` für CI-/Richtlinienprüfungen:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Wenn `--fix` und `--json` kombiniert werden, enthält die Ausgabe sowohl Korrekturaktionen als auch den abschließenden Bericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

`--fix` wendet sichere, deterministische Abhilfen an:

- stellt gängiges `groupPolicy="open"` auf `groupPolicy="allowlist"` um (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie auf `allowlist` umgestellt wird, wird `groupAllowFrom` aus
  der gespeicherten `allowFrom`-Datei befüllt, wenn diese Liste vorhanden ist und die Konfiguration
  `allowFrom` nicht bereits definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft Berechtigungen für Status-/Konfigurationsdateien und gängige sensible Dateien
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, Sitzungs-
  `*.jsonl`)
- verschärft außerdem Berechtigungen für Konfigurations-Include-Dateien, auf die aus `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Zurücksetzungen unter Windows

`--fix` führt **keine** der folgenden Aktionen aus:

- Tokens/Passwörter/API-Schlüssel rotieren
- Tools deaktivieren (`gateway`, `cron`, `exec` usw.)
- Entscheidungen zu Gateway-Bindung/Auth/Netzwerkexposition ändern
- Plugins/Skills entfernen oder umschreiben

## Weiterführend

- [CLI-Referenz](/de/cli)
- [Sicherheitsaudit](/de/gateway/security)
