---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung von Konfiguration/Zustand durchführen
    - Sie möchten sichere „fix“-Vorschläge anwenden (Berechtigungen, Defaults verschärfen)
summary: CLI-Referenz für `openclaw security` (prüfen und häufige Sicherheits-Footguns beheben)
title: Sicherheit
x-i18n:
    generated_at: "2026-06-27T17:20:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

Ein einfaches `security audit` bleibt auf dem kalten Konfigurations-/Dateisystem-/Nur-Lese-Pfad. Es erkennt Plugin-Laufzeit-Sicherheits-Collectors standardmäßig nicht, sodass Routine-Audits nicht jede installierte Plugin-Laufzeit laden. Verwenden Sie `--deep`, um Best-Effort-Live-Gateway-Probes und Plugin-eigene Sicherheits-Audit-Collectors einzubeziehen; explizite interne Aufrufer können sich ebenfalls für diese Plugin-eigenen Collectors entscheiden, wenn sie bereits einen passenden Laufzeit-Scope haben.

Der Audit warnt, wenn mehrere DM-Absender die Hauptsitzung teilen, und empfiehlt den **sicheren DM-Modus**: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Kanäle mit mehreren Konten) für gemeinsam genutzte Posteingänge.
Dies dient der Härtung kooperativer/gemeinsam genutzter Posteingänge. Ein einzelner Gateway, der von gegenseitig nicht vertrauenswürdigen/adversarialen Betreibern gemeinsam genutzt wird, ist kein empfohlenes Setup; trennen Sie Vertrauensgrenzen mit separaten Gateways (oder separaten Betriebssystembenutzern/-Hosts).
Er gibt außerdem `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration auf wahrscheinlich gemeinsam genutzten Benutzer-Ingress hindeutet (zum Beispiel offene DM-/Gruppenrichtlinie, konfigurierte Gruppenziele oder Wildcard-Absenderregeln), und erinnert Sie daran, dass OpenClaw standardmäßig ein Vertrauensmodell für persönliche Assistenten ist.
Für absichtliche Setups mit gemeinsam genutzten Benutzern lautet die Audit-Empfehlung, alle Sitzungen zu sandboxen, Dateisystemzugriff auf den Workspace zu beschränken und persönliche/private Identitäten oder Anmeldedaten von dieser Laufzeit fernzuhalten.
Er warnt außerdem, wenn kleine Modelle (`<=300B`) ohne Sandboxing und mit aktivierten Web-/Browser-Tools verwendet werden.
Für Webhook-Ingress protokolliert der Start eine nicht-fatale Sicherheitswarnung, und der Audit markiert die Wiederverwendung aktiver gemeinsamer Gateway-Secret-Authentifizierungswerte durch `hooks.token`, einschließlich `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` und `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Er warnt außerdem, wenn:

- `hooks.token` kurz ist
- `hooks.path="/"`
- `hooks.defaultSessionKey` nicht gesetzt ist
- `hooks.allowedAgentIds` uneingeschränkt ist
- `sessionKey`-Überschreibungen für Anfragen aktiviert sind
- Überschreibungen ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind

Wenn die Gateway-Passwortauthentifizierung nur beim Start bereitgestellt wird, übergeben Sie denselben Wert an `openclaw security audit --auth password --password <password>`, damit der Audit ihn gegen `hooks.token` prüfen kann.
Führen Sie `openclaw doctor --fix` aus, um ein persistiertes wiederverwendetes `hooks.token` zu rotieren, und aktualisieren Sie anschließend externe Hook-Sender so, dass sie das neue Hook-Token verwenden.

Er warnt außerdem, wenn Sandbox-Docker-Einstellungen konfiguriert sind, während der Sandbox-Modus deaktiviert ist, wenn `gateway.nodes.denyCommands` unwirksame musterartige/unbekannte Einträge verwendet (nur exakter Abgleich von Node-Befehlsnamen, keine Shell-Text-Filterung), wenn `gateway.nodes.allowCommands` gefährliche Node-Befehle explizit aktiviert, wenn globales `tools.profile="minimal"` durch Agent-Tool-Profile überschrieben wird, wenn Schreib-/Bearbeitungstools deaktiviert sind, aber `exec` weiterhin ohne einschränkende Sandbox-Dateisystemgrenze verfügbar ist, wenn offene DMs oder Gruppen Laufzeit-/Dateisystemtools ohne Sandbox-/Workspace-Schutz verfügbar machen, und wenn installierte Plugin-Tools unter permissiver Tool-Richtlinie erreichbar sein könnten.
Er markiert außerdem `gateway.allowRealIpFallback=true` (Risiko von Header-Spoofing bei falsch konfigurierten Proxys) und `discovery.mdns.mode="full"` (Metadaten-Leckage über mDNS-TXT-Einträge).
Er warnt außerdem, wenn der Sandbox-Browser das Docker-Netzwerk `bridge` ohne `sandbox.browser.cdpSourceRange` verwendet.
Er markiert außerdem gefährliche Sandbox-Docker-Netzwerkmodi (einschließlich `host` und `container:*`-Namespace-Beitritten).
Er warnt außerdem, wenn vorhandene Sandbox-Browser-Docker-Container fehlende/veraltete Hash-Labels haben (zum Beispiel Container vor der Migration ohne `openclaw.browserConfigEpoch`) und empfiehlt `openclaw sandbox recreate --browser --all`.
Er warnt außerdem, wenn npm-basierte Plugin-/Hook-Installationsdatensätze nicht gepinnt sind, Integritätsmetadaten fehlen oder sie von den aktuell installierten Paketversionen abweichen.
Er warnt, wenn Kanal-Allowlists statt stabiler IDs auf veränderliche Namen/E-Mails/Tags setzen (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-Scopes, soweit zutreffend).
Er warnt, wenn `gateway.auth.mode="none"` Gateway-HTTP-APIs ohne gemeinsames Secret erreichbar lässt (`/tools/invoke` plus jeder aktivierte `/v1/*`-Endpunkt).
Einstellungen mit Präfix `dangerous`/`dangerously` sind explizite Break-Glass-Betreiberüberschreibungen; eine davon zu aktivieren, ist für sich genommen kein Bericht über eine Sicherheitslücke.
Das vollständige Inventar gefährlicher Parameter finden Sie im Abschnitt „Zusammenfassung unsicherer oder gefährlicher Flags“ in [Sicherheit](/de/gateway/security).

Absichtliche dauerhafte Befunde können mit `security.audit.suppressions` akzeptiert werden.
Jede Suppression entspricht einer exakten `checkId` und kann mit
`titleIncludes` und/oder `detailIncludes` als substrings ohne Beachtung der Groß-/Kleinschreibung eingegrenzt werden:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Unterdrückte Befunde werden aus der aktiven Liste `summary` und `findings` entfernt.
Die JSON-Ausgabe behält sie unter `suppressedFindings` zur Auditierbarkeit bei.
Wenn Suppressions konfiguriert sind, behält die aktive Ausgabe außerdem einen nicht unterdrückbaren
`security.audit.suppressions.active`-Info-Befund bei, damit Leser erkennen können, dass der Audit
gefiltert wurde. Gefährliche Konfigurations-Flags werden als ein Flag pro Befund ausgegeben, sodass
das Akzeptieren eines gefährlichen Flags keine anderen aktivierten Flags ausblendet, die dieselbe
`config.insecure_or_dangerous_flags`-`checkId` teilen.
Da Suppressions dauerhafte Risiken verbergen können, erfordert das Hinzufügen oder Entfernen über
Shell-Befehle eines Agent-Laufs eine exec-Genehmigung, sofern exec nicht bereits
mit `security="full"` und `ask="off"` für vertrauenswürdige lokale Automatisierung ausgeführt wird.

SecretRef-Verhalten:

- `security audit` löst unterstützte SecretRefs im Nur-Lese-Modus für seine Zielpfade auf.
- Wenn ein SecretRef im aktuellen Befehlspfad nicht verfügbar ist, fährt der Audit fort und meldet `secretDiagnostics` (statt abzustürzen).
- `--token` und `--password` überschreiben nur die Authentifizierung für Deep-Probes für diesen Befehlsaufruf; sie schreiben weder die Konfiguration noch SecretRef-Zuordnungen um.

## JSON-Ausgabe

Verwenden Sie `--json` für CI-/Richtlinienprüfungen:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Wenn `--fix` und `--json` kombiniert werden, enthält die Ausgabe sowohl Korrekturaktionen als auch den Abschlussbericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

`--fix` wendet sichere, deterministische Abhilfen an:

- stellt übliches `groupPolicy="open"` auf `groupPolicy="allowlist"` um (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie auf `allowlist` umgestellt wird, initialisiert es `groupAllowFrom` aus
  der gespeicherten `allowFrom`-Datei, wenn diese Liste existiert und die Konfiguration nicht bereits
  `allowFrom` definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft Berechtigungen für Status-/Konfigurationsdateien und gängige sensible Dateien
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, Sitzungs-
  `*.jsonl`)
- verschärft außerdem Konfigurations-Include-Dateien, auf die aus `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Resets unter Windows

`--fix` tut **nicht** Folgendes:

- Tokens/Passwörter/API-Schlüssel rotieren
- Tools deaktivieren (`gateway`, `cron`, `exec` usw.)
- Gateway-Bind-/Auth-/Netzwerkexpositionsentscheidungen ändern
- Plugins/Skills entfernen oder umschreiben

## Verwandt

- [CLI-Referenz](/de/cli)
- [Sicherheitsaudit](/de/gateway/security)
