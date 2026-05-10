---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung für Konfiguration/Zustand durchführen
    - Sie möchten sichere „fix“-Vorschläge anwenden (Berechtigungen, Standardwerte strenger setzen)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheits-Fallstricke prüfen und beheben)
title: Sicherheit
x-i18n:
    generated_at: "2026-05-10T19:29:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Sicherheitswerkzeuge (Audit + optionale Korrekturen).

Verwandt:

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

Ein einfaches `security audit` bleibt auf dem kalten, schreibgeschützten Pfad für Konfiguration/Dateisystem. Es erkennt standardmäßig keine Sicherheits-Collectors der Plugin-Runtime, sodass Routine-Audits nicht jede installierte Plugin-Runtime laden. Verwenden Sie `--deep`, um Best-Effort-Live-Probes des Gateway und Plugin-eigene Sicherheits-Audit-Collectors einzubeziehen; explizite interne Aufrufer können sich ebenfalls für diese Plugin-eigenen Collectors entscheiden, wenn sie bereits über einen passenden Runtime-Scope verfügen.

Der Audit warnt, wenn mehrere DM-Absender dieselbe Hauptsitzung teilen, und empfiehlt den **sicheren DM-Modus**: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Kanäle mit mehreren Konten) für gemeinsam genutzte Posteingänge.
Dies dient der Härtung kooperativer/gemeinsam genutzter Posteingänge. Ein einzelnes Gateway, das von gegenseitig nicht vertrauenswürdigen/feindlichen Betreibern gemeinsam genutzt wird, ist keine empfohlene Einrichtung; trennen Sie Vertrauensgrenzen mit separaten Gateways (oder separaten OS-Benutzern/Hosts).
Er gibt außerdem `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration auf wahrscheinlich gemeinsam genutzten Benutzerzugang hindeutet (zum Beispiel offene DM-/Gruppenrichtlinie, konfigurierte Gruppenziele oder Wildcard-Absenderregeln), und erinnert Sie daran, dass OpenClaw standardmäßig einem Vertrauensmodell für persönliche Assistenten folgt.
Für absichtliche Setups mit mehreren Benutzern empfiehlt der Audit, alle Sitzungen zu sandboxen, den Dateisystemzugriff auf den Workspace zu beschränken und persönliche/private Identitäten oder Zugangsdaten von dieser Runtime fernzuhalten.
Er warnt außerdem, wenn kleine Modelle (`<=300B`) ohne Sandboxing und mit aktivierten Web-/Browser-Tools verwendet werden.
Beim Webhook-Zugang warnt er, wenn `hooks.token` das Gateway-Token wiederverwendet, wenn `hooks.token` kurz ist, wenn `hooks.path="/"`, wenn `hooks.defaultSessionKey` nicht gesetzt ist, wenn `hooks.allowedAgentIds` uneingeschränkt ist, wenn Anfrage-Overrides für `sessionKey` aktiviert sind und wenn Overrides ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind.
Er warnt außerdem, wenn Sandbox-Docker-Einstellungen konfiguriert sind, während der Sandbox-Modus deaktiviert ist, wenn `gateway.nodes.denyCommands` wirkungslose musterartige/unbekannte Einträge verwendet (nur exakter Abgleich von Node-Befehlsnamen, kein Shell-Text-Filtering), wenn `gateway.nodes.allowCommands` gefährliche Node-Befehle explizit aktiviert, wenn das globale `tools.profile="minimal"` durch Agent-Tool-Profile überschrieben wird, wenn Schreib-/Bearbeitungs-Tools deaktiviert sind, aber `exec` weiterhin ohne einschränkende Sandbox-Dateisystemgrenze verfügbar ist, wenn offene Gruppen Runtime-/Dateisystem-Tools ohne Sandbox-/Workspace-Schutzmaßnahmen verfügbar machen, und wenn installierte Plugin-Tools unter permissiver Tool-Richtlinie erreichbar sein können.
Er markiert außerdem `gateway.allowRealIpFallback=true` (Risiko von Header-Spoofing bei falsch konfigurierten Proxys) und `discovery.mdns.mode="full"` (Metadatenleckage über mDNS-TXT-Einträge).
Er warnt außerdem, wenn der Sandbox-Browser das Docker-`bridge`-Netzwerk ohne `sandbox.browser.cdpSourceRange` verwendet.
Er markiert außerdem gefährliche Sandbox-Docker-Netzwerkmodi (einschließlich `host` und Namespace-Beitritten vom Typ `container:*`).
Er warnt außerdem, wenn vorhandene Docker-Container des Sandbox-Browsers fehlende/veraltete Hash-Labels haben (zum Beispiel Container vor der Migration ohne `openclaw.browserConfigEpoch`) und empfiehlt `openclaw sandbox recreate --browser --all`.
Er warnt außerdem, wenn npm-basierte Installationsdatensätze für Plugin/Hook nicht gepinnt sind, Integritätsmetadaten fehlen oder von den aktuell installierten Paketversionen abweichen.
Er warnt, wenn Kanal-Allowlists auf veränderlichen Namen/E-Mails/Tags statt auf stabilen IDs beruhen (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-Scopes, wo zutreffend).
Er warnt, wenn `gateway.auth.mode="none"` Gateway-HTTP-APIs ohne ein gemeinsames Secret erreichbar lässt (`/tools/invoke` plus alle aktivierten `/v1/*`-Endpunkte).
Einstellungen mit dem Präfix `dangerous`/`dangerously` sind ausdrückliche Break-Glass-Operator-Overrides; eine Aktivierung ist für sich genommen kein Bericht über eine Sicherheitslücke.
Das vollständige Inventar gefährlicher Parameter finden Sie im Abschnitt „Zusammenfassung unsicherer oder gefährlicher Flags“ unter [Sicherheit](/de/gateway/security).

SecretRef-Verhalten:

- `security audit` löst unterstützte SecretRefs im schreibgeschützten Modus für seine Zielpfade auf.
- Wenn ein SecretRef im aktuellen Befehlspfad nicht verfügbar ist, läuft der Audit weiter und meldet `secretDiagnostics` (statt abzustürzen).
- `--token` und `--password` überschreiben nur die Deep-Probe-Authentifizierung für diesen Befehlsaufruf; sie schreiben weder die Konfiguration noch SecretRef-Zuordnungen um.

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

- stellt gängige `groupPolicy="open"` auf `groupPolicy="allowlist"` um (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie auf `allowlist` umgestellt wird, befüllt es `groupAllowFrom` aus
  der gespeicherten Datei `allowFrom`, sofern diese Liste vorhanden ist und die Konfiguration nicht bereits
  `allowFrom` definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft Berechtigungen für Status-/Konfigurationsdateien und gängige sensible Dateien
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, Sitzungsdateien
  `*.jsonl`)
- verschärft außerdem Konfigurations-Include-Dateien, auf die aus `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Resets unter Windows

`--fix` führt **nicht** Folgendes aus:

- Tokens/Passwörter/API-Schlüssel rotieren
- Tools deaktivieren (`gateway`, `cron`, `exec` usw.)
- Entscheidungen zu Gateway-Bindung/-Authentifizierung/-Netzwerkexponierung ändern
- Plugins/Skills entfernen oder umschreiben

## Verwandt

- [CLI-Referenz](/de/cli)
- [Sicherheitsaudit](/de/gateway/security)
