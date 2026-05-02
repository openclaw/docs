---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung von Konfiguration/Zustand durchführen
    - Sie möchten sichere „fix“-Vorschläge anwenden (Berechtigungen, Standardeinstellungen verschärfen)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheitsfallen prüfen und beheben)
title: Sicherheit
x-i18n:
    generated_at: "2026-05-02T06:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Sicherheitstools (Audit + optionale Korrekturen).

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

Ein einfaches `security audit` bleibt auf dem kalten Config-/Dateisystem-/Nur-Lese-Pfad. Es erkennt standardmäßig keine Plugin-Runtime-Sicherheits-Collectors, sodass routinemäßige Audits nicht jede installierte Plugin-Runtime laden. Verwenden Sie `--deep`, um Best-Effort-Live-Gateway-Probes und Plugin-eigene Sicherheits-Audit-Collectors einzubeziehen; explizite interne Aufrufer können sich ebenfalls für diese Plugin-eigenen Collectors entscheiden, wenn sie bereits über einen passenden Runtime-Scope verfügen.

Der Audit warnt, wenn mehrere DM-Absender die Hauptsitzung gemeinsam nutzen, und empfiehlt den **sicheren DM-Modus**: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Mehrkonto-Kanäle) für geteilte Posteingänge.
Dies dient der Härtung kooperativer/geteilter Posteingänge. Ein einzelner Gateway, der von gegenseitig nicht vertrauenswürdigen/adversarialen Betreibern geteilt wird, ist keine empfohlene Einrichtung; trennen Sie Vertrauensgrenzen mit separaten Gateways (oder separaten Betriebssystembenutzern/-Hosts).
Er gibt außerdem `security.trust_model.multi_user_heuristic` aus, wenn die Config auf wahrscheinlich geteilten Benutzer-Ingress hindeutet (zum Beispiel offene DM-/Gruppenrichtlinie, konfigurierte Gruppenziele oder Wildcard-Absenderregeln), und erinnert Sie daran, dass OpenClaw standardmäßig ein Vertrauensmodell für persönliche Assistenten ist.
Für absichtlich geteilte Benutzer-Setups empfiehlt der Audit, alle Sitzungen zu sandboxen, Dateisystemzugriff auf den Workspace zu beschränken und persönliche/private Identitäten oder Zugangsdaten von dieser Runtime fernzuhalten.
Er warnt außerdem, wenn kleine Modelle (`<=300B`) ohne Sandboxing und mit aktivierten Web-/Browser-Tools verwendet werden.
Für Webhook-Ingress warnt er, wenn `hooks.token` den Gateway-Token wiederverwendet, wenn `hooks.token` kurz ist, wenn `hooks.path="/"`, wenn `hooks.defaultSessionKey` nicht gesetzt ist, wenn `hooks.allowedAgentIds` uneingeschränkt ist, wenn `sessionKey`-Overrides in Requests aktiviert sind und wenn Overrides ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind.
Er warnt außerdem, wenn Sandbox-Docker-Einstellungen konfiguriert sind, während der Sandbox-Modus aus ist, wenn `gateway.nodes.denyCommands` unwirksame musterartige/unbekannte Einträge verwendet (nur exakter Abgleich von Node-Befehlsnamen, keine Shell-Textfilterung), wenn `gateway.nodes.allowCommands` gefährliche Node-Befehle explizit aktiviert, wenn globales `tools.profile="minimal"` durch Agent-Tool-Profile überschrieben wird, wenn offene Gruppen Runtime-/Dateisystem-Tools ohne Sandbox-/Workspace-Schutz verfügbar machen und wenn installierte Plugin-Tools unter permissiver Tool-Policy erreichbar sein können.
Er markiert außerdem `gateway.allowRealIpFallback=true` (Header-Spoofing-Risiko bei falsch konfigurierten Proxys) und `discovery.mdns.mode="full"` (Metadatenleckage über mDNS-TXT-Einträge).
Er warnt außerdem, wenn der Sandbox-Browser das Docker-Netzwerk `bridge` ohne `sandbox.browser.cdpSourceRange` verwendet.
Er markiert außerdem gefährliche Sandbox-Docker-Netzwerkmodi (einschließlich `host` und `container:*`-Namespace-Joins).
Er warnt außerdem, wenn vorhandene Sandbox-Browser-Docker-Container fehlende/veraltete Hash-Labels haben (zum Beispiel Container vor der Migration ohne `openclaw.browserConfigEpoch`), und empfiehlt `openclaw sandbox recreate --browser --all`.
Er warnt außerdem, wenn npm-basierte Plugin-/Hook-Installationsdatensätze nicht gepinnt sind, Integritätsmetadaten fehlen oder sie von den aktuell installierten Paketversionen abweichen.
Er warnt, wenn Kanal-Allowlists auf veränderlichen Namen/E-Mails/Tags statt auf stabilen IDs beruhen (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-Scopes, sofern zutreffend).
Er warnt, wenn `gateway.auth.mode="none"` Gateway-HTTP-APIs ohne gemeinsames Secret erreichbar lässt (`/tools/invoke` plus jeder aktivierte `/v1/*`-Endpunkt).
Einstellungen mit dem Präfix `dangerous`/`dangerously` sind explizite Break-Glass-Betreiber-Overrides; deren Aktivierung ist für sich genommen kein Bericht über eine Sicherheitslücke.
Das vollständige Inventar gefährlicher Parameter finden Sie im Abschnitt „Zusammenfassung unsicherer oder gefährlicher Flags“ unter [Sicherheit](/de/gateway/security).

SecretRef-Verhalten:

- `security audit` löst unterstützte SecretRefs im Nur-Lese-Modus für seine Zielpfade auf.
- Wenn ein SecretRef im aktuellen Befehlspfad nicht verfügbar ist, läuft der Audit weiter und meldet `secretDiagnostics` (anstatt abzustürzen).
- `--token` und `--password` überschreiben nur die Deep-Probe-Authentifizierung für diesen Befehlsaufruf; sie schreiben weder die Config noch SecretRef-Zuordnungen um.

## JSON-Ausgabe

Verwenden Sie `--json` für CI-/Policy-Prüfungen:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Wenn `--fix` und `--json` kombiniert werden, enthält die Ausgabe sowohl Korrekturaktionen als auch den Abschlussbericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

`--fix` wendet sichere, deterministische Behebungen an:

- stellt gängiges `groupPolicy="open"` auf `groupPolicy="allowlist"` um (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie auf `allowlist` umgestellt wird, initialisiert es `groupAllowFrom` aus
  der gespeicherten `allowFrom`-Datei, wenn diese Liste vorhanden ist und die Config noch kein
  `allowFrom` definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft Berechtigungen für Status-/Config-Dateien und gängige sensible Dateien
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, Sitzungs-
  `*.jsonl`)
- verschärft außerdem Config-Include-Dateien, auf die aus `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Zurücksetzungen unter Windows

`--fix` führt **nicht** Folgendes aus:

- Tokens/Passwörter/API-Schlüssel rotieren
- Tools deaktivieren (`gateway`, `cron`, `exec` usw.)
- Gateway-Bind-/Auth-/Netzwerkexpositionsentscheidungen ändern
- Plugins/Skills entfernen oder umschreiben

## Verwandt

- [CLI-Referenz](/de/cli)
- [Sicherheits-Audit](/de/gateway/security)
