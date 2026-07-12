---
read_when:
    - Der Hub zur Fehlerbehebung hat Sie zur eingehenderen Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
sidebarTitle: Troubleshooting
summary: Ausführliches Fehlerbehebungshandbuch für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-07-12T15:28:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Dies ist das ausführliche Runbook. Beginnen Sie zunächst unter [/help/troubleshooting](/de/help/troubleshooting) mit dem schnellen Triage-Ablauf.

## Befehlsabfolge

Führen Sie die Befehle in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Anzeichen für einen fehlerfreien Zustand:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations- oder Dienstprobleme.
- `openclaw channels status --probe` zeigt den aktuellen Transportstatus für jedes Konto und, sofern unterstützt, `works` oder `audit ok`.

## Nach einer Aktualisierung

Verwenden Sie diese Schritte, wenn eine Aktualisierung abgeschlossen ist, der Gateway jedoch nicht läuft, keine Channels angezeigt werden oder Modellaufrufe mit 401-Fehlern scheitern.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Achten Sie auf Folgendes:

- `Update restart` in `openclaw status` / `openclaw status --all`. Bei ausstehenden oder fehlgeschlagenen Übergaben wird der als Nächstes auszuführende Befehl angegeben.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` unter „Channels“: Die Channel-Konfiguration ist weiterhin vorhanden, aber die Plugin-Registrierung ist fehlgeschlagen, bevor der Channel geladen werden konnte.
- Provider-401-Fehler nach erneuter Authentifizierung: `openclaw doctor --fix` sucht nach veralteten agentenspezifischen Schattenkopien der OAuth-Authentifizierung und entfernt alte Kopien, damit alle Agenten das aktuelle gemeinsame Profil verwenden.

## Parallele Installationen und Schutz vor neuerer Konfiguration

Verwenden Sie diese Schritte, wenn ein Gateway-Dienst nach einer Aktualisierung unerwartet beendet wird oder die Protokolle zeigen, dass ein `openclaw`-Programm älter ist als die Version, die `openclaw.json` zuletzt geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Schreibgeschützte Befehle können eine von einer neueren OpenClaw-Version geschriebene Konfiguration untersuchen, aber Prozess- und Dienständerungen werden von einem älteren Programm nicht ausgeführt. Folgende Aktionen werden blockiert: Starten, Beenden, Neustarten und Deinstallieren des Gateway-Dienstes, erzwungene Neuinstallation des Dienstes, Starten des Gateways im Dienstmodus sowie die Portbereinigung mit `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH korrigieren">
    Korrigieren Sie `PATH`, sodass `openclaw` auf die neuere Installation verweist, und führen Sie die Aktion anschließend erneut aus.
  </Step>
  <Step title="Gateway-Dienst neu installieren">
    Installieren Sie den vorgesehenen Gateway-Dienst aus der neueren Installation erneut:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Veraltete Wrapper entfernen">
    Entfernen Sie veraltete Systempakete oder alte Wrapper-Einträge, die noch auf ein altes `openclaw`-Programm verweisen.
  </Step>
</Steps>

<Warning>
Legen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ausschließlich für eine beabsichtigte Herabstufung oder Notfallwiederherstellung und nur für den einzelnen Befehl fest. Lassen Sie die Variable im normalen Betrieb ungesetzt.
</Warning>

## Protokollabweichung nach einem Rollback

Verwenden Sie diese Schritte, wenn die Protokolle nach einer Herabstufung oder einem Rollback weiterhin `protocol mismatch` ausgeben. Ein älterer Gateway läuft, aber ein neuerer lokaler Clientprozess stellt weiterhin Verbindungen mit einem Protokollbereich her, den der ältere Gateway nicht unterstützt.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Achten Sie auf Folgendes:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` in den Gateway-Protokollen.
- `Established clients:` in `openclaw gateway status --deep` oder `Gateway clients` in `openclaw doctor --deep`: aktive TCP-Clients, die mit dem Gateway-Port verbunden sind, einschließlich PIDs und Befehlszeilen, sofern das Betriebssystem dies zulässt.
- Einen Clientprozess, dessen Befehlszeile auf die neuere OpenClaw-Installation oder den Wrapper verweist, von dem Sie das Rollback durchgeführt haben.

Behebung:

1. Beenden Sie den von `gateway status --deep` angezeigten veralteten OpenClaw-Clientprozess oder starten Sie ihn neu.
2. Starten Sie Anwendungen oder Wrapper neu, die OpenClaw einbetten: lokale Dashboards, Editoren, App-Server-Hilfsprogramme oder langlebige Shells mit `openclaw logs --follow`.
3. Führen Sie `openclaw gateway status --deep` oder `openclaw doctor --deep` erneut aus und vergewissern Sie sich, dass die PID des veralteten Clients nicht mehr vorhanden ist.

Versuchen Sie nicht, einen älteren Gateway zur Annahme eines neueren inkompatiblen Protokolls zu veranlassen. Protokollaktualisierungen schützen den Kommunikationsvertrag; die Wiederherstellung nach einem Rollback erfordert eine Bereinigung von Prozessen und Versionen.

## Skill-Symlink wegen Pfadüberschreitung übersprungen

Verwenden Sie diese Schritte, wenn die Protokolle Folgendes enthalten:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

Jedes Skill-Stammverzeichnis bildet eine Begrenzung. Ein Symlink unter `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` oder `~/.openclaw/skills` wird übersprungen, wenn sein tatsächliches Ziel außerhalb dieses Stammverzeichnisses liegt, sofern das Ziel nicht ausdrücklich als vertrauenswürdig eingestuft wurde.

Prüfen Sie den Link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Wenn das Ziel beabsichtigt ist, konfigurieren Sie sowohl das direkte Skill-Stammverzeichnis als auch das zulässige Symlink-Ziel:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Starten Sie anschließend eine neue Sitzung oder warten Sie, bis die Skill-Überwachung die Daten aktualisiert. Starten Sie den Gateway neu, wenn der laufende Prozess vor der Konfigurationsänderung gestartet wurde.

Verwenden Sie keine weit gefassten Ziele wie `~`, `/` oder einen gesamten synchronisierten Projektordner. Beschränken Sie `allowSymlinkTargets` auf das tatsächliche Skill-Stammverzeichnis, das vertrauenswürdige `SKILL.md`-Verzeichnisse enthält.

Wenn „Skill Workshop apply“ auch über diese vertrauenswürdigen, per Symlink eingebundenen Workspace-Skill-Pfade schreiben soll, aktivieren Sie `skills.workshop.allowSymlinkTargetWrites`. Lassen Sie die Option für schreibgeschützte gemeinsame Skill-Stammverzeichnisse deaktiviert.

Verwandte Themen:

- [Skills-Konfiguration](/de/tools/skills-config#symlinked-skill-roots)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: Zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie diese Schritte, wenn Protokolle oder Fehler Folgendes enthalten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Modell ist ein allgemein verfügbares, 1M-fähiges Claude-4.x-Modell (Opus 4.6/4.7/4.8, Sonnet 4.6), oder die Modellkonfiguration enthält noch den veralteten Wert `params.context1m: true`.
- Die aktuellen Anthropic-Anmeldedaten sind nicht für die Nutzung langer Kontexte berechtigt.
- Anfragen scheitern nur bei langen Sitzungen oder Modellläufen, die den 1M-Kontextpfad benötigen.

Behebungsoptionen:

<Steps>
  <Step title="Standardkontextfenster verwenden">
    Wechseln Sie zu einem Modell mit Standardfenster oder entfernen Sie das veraltete `context1m` aus einer älteren
    Modellkonfiguration, die nicht allgemein für 1M-Kontext verfügbar ist.
  </Step>
  <Step title="Berechtigte Anmeldedaten verwenden">
    Verwenden Sie Anthropic-Anmeldedaten, die für Anfragen mit langem Kontext berechtigt sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
  </Step>
  <Step title="Fallback-Modelle konfigurieren">
    Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic Anfragen mit langem Kontext ablehnt.
  </Step>
</Steps>

Verwandte Themen:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Warum wird HTTP 429 von Anthropic angezeigt?](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Vom Upstream blockierte 403-Antworten

Verwenden Sie diese Schritte, wenn ein vorgelagerter LLM-Provider einen generischen `403`-Fehler wie `Your request was blocked` zurückgibt.

Gehen Sie nicht davon aus, dass dies immer ein OpenClaw-Konfigurationsproblem ist. Die Antwort kann von einer vorgelagerten Sicherheitsschicht wie einem CDN, einer WAF, einer Bot-Management-Regel oder einem Reverse-Proxy vor einem OpenAI-kompatiblen Endpunkt stammen.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Mehrere Modelle desselben Providers scheitern auf dieselbe Weise.
- HTML oder generischer Sicherheitstext anstelle eines normalen Provider-API-Fehlers.
- Providerseitige Sicherheitsereignisse zum selben Anfragezeitpunkt.
- Eine minimale direkte `curl`-Prüfung ist erfolgreich, während normale SDK-förmige Anfragen scheitern.

Beheben Sie zuerst die providerseitige Filterung, wenn die Hinweise auf eine WAF-/CDN-Blockierung hindeuten. Bevorzugen Sie eine eng begrenzte Zulassungs- oder Überspringungsregel für den von OpenClaw verwendeten API-Pfad, und deaktivieren Sie den Schutz nicht für die gesamte Website.

<Warning>
Eine erfolgreiche minimale `curl`-Anfrage garantiert nicht, dass echte SDK-typische Anfragen dieselbe vorgelagerte Sicherheitsschicht passieren.
</Warning>

Verwandte Themen:

- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)
- [Provider-Konfiguration](/de/providers)
- [Protokolle](/de/logging)

## Lokales OpenAI-kompatibles Backend besteht direkte Prüfungen, aber Agentenläufe scheitern

Verwenden Sie diese Schritte, wenn:

- `curl ... /v1/models` funktioniert.
- Kleine direkte Aufrufe von `/v1/chat/completions` funktionieren.
- OpenClaw-Modellläufe nur bei normalen Agentendurchläufen scheitern.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Kleine direkte Aufrufe sind erfolgreich, aber OpenClaw-Läufe scheitern nur bei größeren Prompts.
- `model_not_found`- oder 404-Fehler, obwohl direkte Aufrufe von `/v1/chat/completions` mit derselben reinen Modell-ID funktionieren.
- Backend-Fehler, laut denen `messages[].content` eine Zeichenfolge sein muss.
- Sporadische Warnungen `incomplete turn detected ... stopReason=stop payloads=0` bei einem lokalen OpenAI-kompatiblen Backend.
- Backend-Abstürze, die nur bei einer größeren Anzahl von Prompt-Tokens oder vollständigen Prompts der Agentenlaufzeit auftreten.

<AccordionGroup>
  <Accordion title="Häufige Fehlerbilder">
    - `model_not_found` bei einem lokalen Server im MLX-/vLLM-Stil: Vergewissern Sie sich, dass `baseUrl` `/v1` enthält, `api` für Backends mit `/v1/chat/completions` auf `"openai-completions"` gesetzt ist und `models.providers.<provider>.models[].id` die reine providerlokale ID enthält. Wählen Sie das Modell einmal mit dem Provider-Präfix aus, beispielsweise `mlx/mlx-community/Qwen3-30B-A3B-6bit`; belassen Sie den Katalogeintrag als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: Das Backend lehnt strukturierte Inhaltsteile von Chat Completions ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` oder zulässige Nachrichtenschlüssel wie `["role","content"]`: Das Backend lehnt OpenAI-typische Wiedergabemetadaten in Chat-Completions-Nachrichten ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: Das Backend hat die Chat-Completions-Anfrage abgeschlossen, für diesen Durchlauf jedoch keinen für Benutzer sichtbaren Assistententext zurückgegeben. OpenClaw wiederholt wiedergabesichere leere OpenAI-kompatible Durchläufe einmal; dauerhafte Fehler bedeuten in der Regel, dass das Backend leere oder nicht textuelle Inhalte ausgibt oder den Text der endgültigen Antwort unterdrückt.
    - Kleine direkte Anfragen sind erfolgreich, aber OpenClaw-Agentenläufe scheitern mit Backend- oder Modellabstürzen (beispielsweise Gemma bei einigen `inferrs`-Builds): Der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Prompt-Struktur der Agentenlaufzeit.
    - Die Fehler nehmen nach dem Deaktivieren von Tools ab, verschwinden aber nicht: Die Tool-Schemas haben zur Belastung beigetragen, das verbleibende Problem liegt jedoch weiterhin bei der Kapazität des vorgelagerten Modells oder Servers oder bei einem Backend-Fehler.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die ausschließlich Zeichenfolgen unterstützen.
    2. Setzen Sie `compat.strictMessageKeys: true` für strikte Chat-Completions-Backends, die bei jeder Nachricht nur `role` und `content` akzeptieren.
    3. Setzen Sie `compat.supportsTools: false` für Modelle oder Backends, die die Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
    4. Reduzieren Sie nach Möglichkeit die Prompt-Belastung: kleinerer Workspace-Bootstrap, kürzerer Sitzungsverlauf, weniger anspruchsvolles lokales Modell oder ein Backend mit besserer Unterstützung für lange Kontexte.
    5. Wenn kleine direkte Anfragen weiterhin erfolgreich sind, während OpenClaw-Agentendurchläufe dennoch innerhalb des Backends abstürzen, behandeln Sie dies als Einschränkung des vorgelagerten Servers oder Modells und melden Sie dort eine Reproduktion mit der akzeptierten Payload-Struktur.
  </Accordion>
</AccordionGroup>

Verwandte Themen:

- [Konfiguration](/de/gateway/configuration)
- [Lokale Modelle](/de/gateway/local-models)
- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn die Channels aktiv sind, aber keine Antworten eingehen, prüfen Sie Routing und Richtlinien, bevor Sie eine erneute Verbindung herstellen.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf:

- Ausstehendes Pairing für DM-Absender.
- Erwähnungsbeschränkung in Gruppen (`requireMention`, `mentionPatterns`).
- Abweichungen bei Channel-/Gruppen-Zulassungslisten.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird bis zu einer Erwähnung ignoriert.
- `pairing request` → Absender benötigt eine Genehmigung.
- `blocked` / `allowlist` → Absender/Channel wurde durch eine Richtlinie herausgefiltert.

Verwandte Themen:

- [Fehlerbehebung für Channels](/de/channels/troubleshooting)
- [Gruppen](/de/channels/groups)
- [Pairing](/de/channels/pairing)

## Konnektivität der Dashboard-Control-UI

Wenn die Dashboard-/Control-UI keine Verbindung herstellt, überprüfen Sie die URL, den Authentifizierungsmodus und die Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf:

- Korrekte Prüf-URL und Dashboard-URL.
- Nicht übereinstimmender Authentifizierungsmodus bzw. Token zwischen Client und Gateway.
- Verwendung von HTTP, obwohl eine Geräteidentität erforderlich ist.

Wenn ein lokaler Browser nach einem Update keine Verbindung zu `127.0.0.1:18789` herstellen kann, stellen Sie zuerst den lokalen Gateway-Dienst wieder her und vergewissern Sie sich, dass er das Dashboard bereitstellt:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Wenn `curl` OpenClaw-HTML zurückgibt, funktioniert das Gateway, und das verbleibende Problem ist wahrscheinlich der Browser-Cache, ein alter Deep Link oder ein veralteter Tab-Zustand. Öffnen Sie `http://127.0.0.1:18789` direkt und navigieren Sie vom Dashboard aus. Wenn der Dienst nach dem Neustart nicht weiter ausgeführt wird, führen Sie `openclaw gateway start` aus und prüfen Sie `openclaw gateway status` erneut.

<AccordionGroup>
  <Accordion title="Verbindungs-/Authentifizierungssignaturen">
    - `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
    - `origin not allowed` → der Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` enthalten (oder Sie stellen die Verbindung über einen Browser-Ursprung außerhalb von Loopback ohne explizite Zulassungsliste her).
    - `device nonce required` / `device nonce mismatch` → der Client schließt den Challenge-basierten Ablauf der Geräteauthentifizierung nicht ab (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → der Client hat für den aktuellen Handshake die falschen Nutzdaten (oder einen veralteten Zeitstempel) signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → der Client kann einen vertrauenswürdigen Wiederholungsversuch mit dem zwischengespeicherten Geräte-Token durchführen.
    - Dieser Wiederholungsversuch mit dem zwischengespeicherten Token verwendet erneut den zwischengespeicherten Berechtigungssatz, der mit dem Token des gekoppelten Geräts gespeichert wurde. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Berechtigungssatz bei.
    - `AUTH_SCOPE_MISMATCH` → das Geräte-Token wurde erkannt, seine genehmigten Berechtigungen decken diese Verbindungsanfrage jedoch nicht ab; koppeln Sie das Gerät erneut oder genehmigen Sie den angeforderten Berechtigungsvertrag, anstatt ein gemeinsam verwendetes Gateway-Token zu rotieren.
    - Außerhalb dieses Wiederholungspfads gilt bei der Verbindungsauthentifizierung folgende Priorität: zuerst explizites gemeinsam verwendetes Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token und schließlich Bootstrap-Token.
    - Im asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe Kombination `{scope, ip}` serialisiert, bevor der Begrenzer den Fehlschlag erfasst. Zwei gleichzeitige fehlerhafte Wiederholungsversuche desselben Clients können daher beim zweiten Versuch `retry later` statt zweier einfacher Abweichungen ergeben.
    - `too many failed authentication attempts (retry later)` von einem Loopback-Client mit Browser-Ursprung → wiederholte Fehlschläge von demselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Ursprung verwendet einen separaten Bereich.
    - Wiederholtes `unauthorized` nach diesem Wiederholungsversuch → Abweichung zwischen gemeinsam verwendetem Token und Geräte-Token; aktualisieren Sie die Token-Konfiguration und genehmigen oder rotieren Sie das Geräte-Token bei Bedarf erneut.
    - `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

  </Accordion>
</AccordionGroup>

### Schnellübersicht der Authentifizierungsdetailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                   | Bedeutung                                                                                                                                                                                    | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Der Client hat ein erforderliches gemeinsam verwendetes Token nicht gesendet.                                                                                                                | Fügen Sie das Token im Client ein bzw. legen Sie es dort fest und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token`, dann in die Einstellungen der Control-UI einfügen.                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Das gemeinsam verwendete Token stimmte nicht mit dem Gateway-Authentifizierungs-Token überein.                                                                                                | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Wiederholungsversuche mit zwischengespeicherten Tokens verwenden erneut die gespeicherten genehmigten Berechtigungen; Aufrufer mit explizitem `deviceToken` / `scopes` behalten die angeforderten Berechtigungen. Wenn der Fehler weiterhin auftritt, führen Sie die [Checkliste zur Behebung von Token-Abweichungen](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte gerätespezifische Token ist veraltet oder wurde widerrufen.                                                                                                          | Rotieren bzw. genehmigen Sie das Geräte-Token mithilfe der [Geräte-CLI](/de/cli/devices) erneut und stellen Sie dann die Verbindung wieder her.                                                                                                                                             |
| `AUTH_SCOPE_MISMATCH`        | Das Geräte-Token ist gültig, aber seine genehmigte Rolle bzw. seine genehmigten Berechtigungen decken diese Verbindungsanfrage nicht ab.                                                       | Koppeln Sie das Gerät erneut oder genehmigen Sie den angeforderten Berechtigungsvertrag; behandeln Sie dies nicht als Abweichung des gemeinsam verwendeten Tokens.                                                                                                                       |
| `PAIRING_REQUIRED`           | Die Geräteidentität muss genehmigt werden. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade` und verwenden Sie `requestId` / `remediationHint`, sofern vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list`, dann `openclaw devices approve <requestId>`. Für Berechtigungs-/Rollen-Upgrades gilt derselbe Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                |

<Note>
Direkte Loopback-Backend-RPCs, die mit dem gemeinsam verwendeten Gateway-Token/Passwort authentifiziert werden, sollten nicht von der Berechtigungsgrundlage der gekoppelten Geräte der CLI abhängen. Wenn Subagenten oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, überprüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und keine explizite `deviceIdentity` bzw. kein Geräte-Token erzwingt.
</Note>

Prüfung der Migration auf Geräteauthentifizierung v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn die Protokolle Nonce-/Signaturfehler anzeigen, aktualisieren Sie den verbindungsherstellenden Client und überprüfen Sie ihn:

<Steps>
  <Step title="Auf connect.challenge warten">
    Der Client wartet auf das vom Gateway ausgegebene `connect.challenge`.
  </Step>
  <Step title="Nutzdaten signieren">
    Der Client signiert die an die Challenge gebundenen Nutzdaten.
  </Step>
  <Step title="Geräte-Nonce senden">
    Der Client sendet `connect.params.device.nonce` mit derselben Challenge-Nonce.
  </Step>
</Steps>

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet abgelehnt wird:

- Sitzungen mit Tokens gekoppelter Geräte können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht zusätzlich über `operator.admin` verfügt.
- `openclaw devices rotate --scope ...` kann nur Operator-Berechtigungen anfordern, über die die Sitzung des Aufrufers bereits verfügt.

Verwandte Themen:

- [Konfiguration](/de/gateway/configuration) (Gateway-Authentifizierungsmodi)
- [Control-UI](/de/web/control-ui)
- [Geräte](/de/cli/devices)
- [Remotezugriff](/de/gateway/remote)
- [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth)

## Gateway-Dienst wird nicht ausgeführt

Verwenden Sie diesen Abschnitt, wenn der Dienst installiert ist, der Prozess jedoch nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # auch systemweite Dienste prüfen
```

Achten Sie auf:

- `Runtime: stopped` mit Hinweisen zum Beenden.
- Abweichende Dienstkonfiguration (`Config (cli)` gegenüber `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen bei Verwendung von `--deep`.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert oder die Konfigurationsdatei wurde überschrieben und `gateway.mode` ging verloren. Behebung: Legen Sie `gateway.mode="local"` in Ihrer Konfiguration fest oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus wieder einzutragen. Wenn Sie OpenClaw über Podman ausführen, lautet der Standardkonfigurationspfad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Bindung außerhalb von Loopback ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder, falls konfiguriert, vertrauenswürdiger Proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Einheiten sind vorhanden. Bei den meisten Konfigurationen sollte pro Rechner ein Gateway beibehalten werden. Wenn Sie mehr als eines benötigen, isolieren Sie Ports sowie Konfiguration, Zustand und Arbeitsbereich. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` von Doctor → eine systemweite systemd-Einheit ist vorhanden, während der Dienst auf Benutzerebene fehlt. Entfernen oder deaktivieren Sie das Duplikat, bevor Sie Doctor die Installation eines Benutzerdiensts erlauben, oder legen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external` fest, wenn die Systemeinheit als vorgesehener Supervisor dient.
    - `Gateway service port does not match current gateway config` → der installierte Supervisor verwendet weiterhin den alten `--port`. Führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus und starten Sie anschließend den Gateway-Dienst neu.

  </Accordion>
</AccordionGroup>

Verwandte Themen:

- [Hintergrundausführung und Prozesswerkzeug](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## macOS-Gateway reagiert unbemerkt nicht mehr und setzt den Betrieb fort, wenn Sie das Dashboard verwenden

Verwenden Sie diesen Abschnitt, wenn Channels (Telegram, WhatsApp usw.) auf einem macOS-Host für jeweils mehrere Minuten bis Stunden verstummen und das Gateway offenbar genau dann zurückkehrt, wenn Sie die Control-UI öffnen, sich per SSH anmelden oder anderweitig mit dem Host interagieren. In `openclaw status` ist normalerweise kein offensichtliches Symptom zu sehen, da das Gateway zu dem Zeitpunkt, an dem Sie nachsehen, bereits wieder aktiv ist.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Achten Sie auf:

- Ein oder mehrere `*-uncaught_exception.json`-Pakete in `~/.openclaw/logs/stability/`, bei denen `error.code` auf einen vorübergehenden Netzwerkcode wie `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` oder `ECONNREFUSED` gesetzt ist.
- Zeilen aus `pmset -g log` wie `Entering Sleep state due to 'Maintenance Sleep'` oder `en0 driver is slow (msg: WillChangeState to 0)`, die zeitlich mit den Abstürzen übereinstimmen. Power Nap / Maintenance Sleep versetzt den WLAN-Treiber kurzzeitig in Zustand 0; jeder ausgehende `connect()`-Aufruf, der in dieses Zeitfenster fällt, kann mit `ENETDOWN` fehlschlagen, selbst wenn der Host ansonsten über vollständige Netzwerkkonnektivität verfügt.
- Eine Ausgabe von `launchctl print`, die `state = not running` mit mehreren kürzlich erfolgten `runs` und einem Exit-Code zeigt, insbesondere wenn zwischen dem Absturz und dem nächsten Start ungefähr eine Stunde statt nur weniger Sekunden liegt. macOS launchd wendet nach einer Serie von Abstürzen eine undokumentierte Schutzsperre gegen wiederholte Starts an, durch die `KeepAlive=true` möglicherweise nicht mehr berücksichtigt wird, bis ein externer Auslöser wie eine interaktive Anmeldung, eine Dashboard-Verbindung oder `launchctl kickstart` den Mechanismus wieder aktiviert.

Häufige Anzeichen:

- Ein Stabilitätspaket, dessen `error.code` den Wert `ENETDOWN` oder einen verwandten Code enthält und dessen Aufruf-Stack auf `lookupAndConnect` / `Socket.connect` in Node `net` verweist. OpenClaw `2026.5.26` und neuer stuft diese Fehler als harmlose vorübergehende Netzwerkfehler ein, sodass sie nicht mehr bis zum unbehandelten Handler auf oberster Ebene weitergegeben werden; wenn Sie eine ältere Version verwenden, führen Sie zuerst ein Upgrade durch.
- Lange Ruhephasen, die genau dann enden, wenn Sie sich mit der Control UI verbinden oder per SSH beim Host anmelden: Die für den Benutzer sichtbare Aktivität aktiviert die Schutzsperre für erneute Starts von launchd wieder, nicht eine Aktion des Dashboards am Gateway.
- Ein im Tagesverlauf steigender `runs`-Zähler ohne entsprechende Zeile `received SIG*; shutting down` in `~/Library/Logs/openclaw/gateway.log`: Bei ordnungsgemäßen Beendigungen wird ein Signal protokolliert, bei vorübergehenden Abstürzen nicht.

Vorgehensweise:

1. **Führen Sie ein Upgrade des Gateways durch**, wenn Sie eine Version vor `2026.5.26` verwenden. Nach dem Upgrade werden zukünftige `ENETDOWN`-Fehler als Warnungen protokolliert, statt den Prozess zu beenden.
2. **Reduzieren Sie die Maintenance-Sleep-Aktivität** auf Mac-mini-/Desktop-Hosts, die als ständig verfügbare Server betrieben werden sollen:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Dadurch wird das zugrunde liegende kurzzeitige Aussetzen des Treibers deutlich reduziert, jedoch nicht vollständig verhindert. Unabhängig von diesen Flags kann das System weiterhin einige Maintenance-Sleep-Vorgänge für TCP-Keepalive und die mDNS-Wartung durchführen.

3. **Fügen Sie einen Liveness-Watchdog hinzu**, damit eine zukünftige Absturzserie, die von launchd angehalten wird, schnell erkannt wird:

   ```bash
   # Beispiel für eine launchd-fähige Liveness-Prüfung, geeignet für einen 5-minütigen Cron oder LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Ziel ist es, die Schutzsperre für erneute Starts extern wieder zu aktivieren; `KeepAlive=true` allein reicht unter macOS nach einer Absturzserie nicht aus.

Weiterführende Informationen:

- [Hinweise zur macOS-Plattform](/de/platforms/macos)
- [Protokollierung](/de/logging)
- [Doctor](/de/gateway/doctor)

## macOS-launchd-Supervisor-Schleife mit doppelten Gateway-/Node-LaunchAgents

Verwenden Sie diesen Abschnitt, wenn eine macOS-Installation alle paar Sekunden neu startet, die `openclaw`-Integritätsprüfungen zwischen verfügbar und nicht verfügbar wechseln und der Kanalversand stockt, obwohl der Dienst anscheinend ausgeführt wird.

Dies wurde bei älteren Installationen beobachtet, auf denen sowohl die LaunchAgents `ai.openclaw.gateway` als auch `ai.openclaw.node` aktiv waren und beide `OPENCLAW_LAUNCHD_LABEL` einschleusten. In diesem Zustand kann OpenClaw die Überwachung durch launchd erkennen, versuchen, den Neustart wieder an launchd zu übergeben, und statt eines stabilen Gateway-Prozesses in eine schnelle `EADDRINUSE`-/Neustartschleife geraten.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Achten Sie auf:

- Mehr als eine Gateway-PID innerhalb der 30-sekündigen Stichprobe statt eines stabilen Prozesses.
- `EADDRINUSE`, `another gateway instance is already listening` oder wiederholte Neustart-/Übergabezeilen in `gateway.log`.
- Sowohl `~/Library/LaunchAgents/ai.openclaw.gateway.plist` als auch `~/Library/LaunchAgents/ai.openclaw.node.plist` sind gleichzeitig auf einem Host geladen, auf dem nur ein verwalteter Gateway-Dienst ausgeführt werden sollte.

Vorgehensweise:

1. Wenn auf diesem Host nur der Gateway-Dienst ausgeführt werden soll, entfernen Sie den verwalteten Node-Dienst über OpenClaw. **Überspringen Sie diesen Schritt**, wenn Sie den Node-Dienst aktiv für Remote-Node-Funktionen verwenden; durch seine Deinstallation werden diese Funktionen auf diesem Host beendet:

   ```bash
   openclaw node uninstall
   ```

2. Installieren Sie einen dauerhaften Gateway-Wrapper, der die geerbten launchd-Markierungen vor dem Start von OpenClaw entfernt. Verwenden Sie die unterstützte Option `--wrapper`; bearbeiten Sie nicht die generierte Datei unter `~/.openclaw/service-env/`, da diese Datei bei einer Neuinstallation oder Aktualisierung des Dienstes sowie bei einer Reparatur durch Doctor neu generiert wird:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` speichert den Wrapper-Pfad dauerhaft über erzwungene Neuinstallationen, Aktualisierungen und Reparaturen durch Doctor hinweg.

3. Überprüfen Sie, ob das Gateway stabil ist und RPC bereitstellt, statt lediglich Verbindungen anzunehmen:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   Die PID-Stichprobe sollte einen stabilen Prozess statt einer wechselnden Gruppe von PIDs zeigen, und der eingehende Kanalversand sollte wieder funktionieren.

4. Entfernen Sie nach dem Upgrade auf eine Version, in der die zugrunde liegende Schleife aus zwei LaunchAgents behoben ist, die Problemumgehung und installieren Sie den normalen verwalteten Dienst neu:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Weiterführende Informationen:

- [Hinweise zur macOS-Plattform](/de/platforms/mac/bundled-gateway)
- [Doctor](/de/gateway/doctor)
- [Gateway-CLI](/de/cli/gateway)

## Gateway wird bei hoher Speicherauslastung beendet

Verwenden Sie diesen Abschnitt, wenn das Gateway unter Last verschwindet, der Supervisor einen Neustart nach Art eines OOM-Ereignisses meldet oder in den Protokollen `critical memory pressure bundle written` erwähnt wird.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Achten Sie auf:

- `Reason: diagnostic.memory.pressure.critical` im neuesten Stabilitätspaket.
- `Memory pressure:` mit `critical/rss_threshold`, `critical/heap_threshold` oder `critical/rss_growth`.
- `V8 heap:`-Werte nahe der Heap-Grenze.
- Einträge unter `Largest session files:` wie `agents/<agent>/sessions/<session>.jsonl` oder `sessions/<session>.jsonl`.
- Linux-cgroup-Speicherzähler, wenn das Gateway in einem Container oder einem Dienst mit Speicherbegrenzung ausgeführt wird.

Häufige Anzeichen:

- `critical memory pressure bundle written` erscheint kurz vor dem Neustart → OpenClaw hat ein Stabilitätspaket vor dem OOM-Ereignis erfasst. Untersuchen Sie es mit `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` erscheint in den Gateway-Protokollen → OpenClaw hat einen kritischen Speicherdruck erkannt, aber die Stabilitätsmomentaufnahme vor dem OOM-Ereignis ist deaktiviert.
- `Largest session files:` verweist auf einen sehr großen bereinigten Transkriptpfad → Reduzieren Sie den beibehaltenen Sitzungsverlauf, untersuchen Sie das Wachstum der Sitzung oder verschieben Sie alte Transkripte vor dem Neustart aus dem aktiven Speicher.
- Die belegten Bytes unter `V8 heap:` liegen nahe der Heap-Grenze → Reduzieren Sie den Prompt-/Sitzungsdruck und die Anzahl gleichzeitiger Aufgaben oder erhöhen Sie die Node-Heap-Grenze erst, nachdem Sie bestätigt haben, dass die Arbeitslast zu erwarten ist.
- `Memory pressure: critical/rss_growth` → Der Speicherverbrauch ist innerhalb eines Abtastintervalls schnell gestiegen. Prüfen Sie die neuesten Protokolle auf einen großen Import, außer Kontrolle geratene Werkzeugausgaben, wiederholte Versuche oder eine Reihe in die Warteschlange eingereihter Agent-Aufgaben.
- In den Protokollen erscheint kritischer Speicherdruck, aber es ist kein Paket vorhanden → Dies ist die Standardeinstellung. Setzen Sie `diagnostics.memoryPressureSnapshot: true`, um bei zukünftigen Ereignissen mit kritischem Speicherdruck ein Stabilitätspaket vor dem OOM-Ereignis zu erfassen.

Das Stabilitätspaket enthält keine Nutzdaten. Es umfasst betriebliche Speicherinformationen und bereinigte relative Dateipfade, jedoch keine Nachrichtentexte, Webhook-Inhalte, Anmeldedaten, Token, Cookies oder unverarbeiteten Sitzungs-IDs. Hängen Sie den Diagnoseexport an Fehlerberichte an, statt unverarbeitete Protokolle zu kopieren.

Weiterführende Informationen:

- [Gateway-Integrität](/de/gateway/health)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Sitzungen](/de/cli/sessions)

## Gateway hat eine ungültige Konfiguration abgelehnt

Verwenden Sie diesen Abschnitt, wenn der Gateway-Start mit `Invalid config` fehlschlägt oder die Hot-Reload-Protokolle melden, dass eine ungültige Änderung übersprungen wurde.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Achten Sie auf:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Eine mit einem Zeitstempel versehene Datei `openclaw.json.rejected.*` neben der aktiven Konfiguration.
- Eine mit einem Zeitstempel versehene Datei `openclaw.json.clobbered.*`, wenn `doctor --fix` eine fehlerhafte direkte Bearbeitung repariert hat.
- OpenClaw behält für jeden Konfigurationspfad die neuesten 32 `.clobbered.*`-Dateien und entfernt ältere bei der Rotation.

<AccordionGroup>
  <Accordion title="Was ist geschehen?">
    - Die Konfiguration konnte beim Start, beim Hot Reload oder bei einem von OpenClaw ausgeführten Schreibvorgang nicht validiert werden.
    - Der Gateway-Start schlägt sicher fehl, statt `openclaw.json` neu zu schreiben.
    - Hot Reload überspringt ungültige externe Änderungen und hält die aktuelle Laufzeitkonfiguration aktiv.
    - Von OpenClaw ausgeführte Schreibvorgänge lehnen ungültige/destruktive Nutzdaten vor dem Commit ab und speichern `.rejected.*`.
    - `openclaw doctor --fix` ist für die Reparatur zuständig. Der Befehl kann Präfixe entfernen, die nicht zu JSON gehören, oder die letzte als fehlerfrei bekannte Kopie wiederherstellen und dabei die abgelehnten Nutzdaten als `.clobbered.*` aufbewahren.
    - Wenn für einen Konfigurationspfad viele Reparaturen erfolgen, rotiert OpenClaw ältere `.clobbered.*`-Dateien, sodass die neuesten reparierten Nutzdaten weiterhin verfügbar sind.

  </Accordion>
  <Accordion title="Untersuchen und reparieren">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Häufige Anzeichen">
    - `.clobbered.*` ist vorhanden → Doctor hat eine fehlerhafte externe Bearbeitung aufbewahrt, während die aktive Konfiguration repariert wurde.
    - `.rejected.*` ist vorhanden → Ein von OpenClaw ausgeführter Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Überschreibungsprüfungen gescheitert.
    - `Config write rejected:` → Der Schreibvorgang hat versucht, die erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder eine ungültige Konfiguration zu speichern.
    - `config reload skipped (invalid config):` → Eine direkte Bearbeitung ist bei der Validierung fehlgeschlagen und wurde vom laufenden Gateway ignoriert.
    - `Invalid config at ...` → Der Start ist fehlgeschlagen, bevor die Gateway-Dienste gestartet wurden.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → Ein von OpenClaw ausgeführter Schreibvorgang wurde abgelehnt, weil gegenüber der letzten als fehlerfrei bekannten Sicherung Felder oder Dateigröße verloren gingen.
    - `Config last-known-good promotion skipped` → Der Kandidat enthielt bereinigte Platzhalter für Geheimnisse wie `***`.

  </Accordion>
  <Accordion title="Reparaturoptionen">
    1. Führen Sie `openclaw doctor --fix` aus, damit Doctor eine Konfiguration mit Präfixen oder Überschreibungen repariert oder die letzte als fehlerfrei bekannte Version wiederherstellt.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie anschließend mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie vor dem Neustart `openclaw config validate` aus.
    4. Wenn Sie die Datei manuell bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das Teilobjekt, das Sie ändern wollten.
  </Accordion>
</AccordionGroup>

Weiterführende Informationen:

- [Konfiguration](/de/cli/config)
- [Konfiguration: Hot Reload](/de/gateway/configuration#config-hot-reload)
- [Konfiguration: strikte Validierung](/de/gateway/configuration#strict-validation)
- [Doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber dennoch einen Warnungsblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf den SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Authentifizierungsreferenzen bezieht.

Häufige Meldungen:

- `SSH tunnel failed to start; falling back to direct probes.` → Die SSH-Einrichtung ist fehlgeschlagen, der Befehl hat jedoch weiterhin direkte konfigurierte Ziele bzw. Loopback-Ziele geprüft.
- `multiple reachable gateway identities detected` → Unterschiedliche Gateways haben geantwortet oder OpenClaw konnte nicht nachweisen, dass die erreichbaren Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway wird als ein Gateway mit mehreren Transportwegen behandelt, selbst wenn sich die Transport-Ports unterscheiden.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Die Verbindung wurde hergestellt, aber Detail-RPCs sind durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → Die Verbindung wurde hergestellt, aber der vollständige Satz diagnostischer RPCs ist wegen Zeitüberschreitung fehlgeschlagen oder anderweitig fehlgeschlagen. Behandeln Sie dies als erreichbares Gateway mit eingeschränkter Diagnose; vergleichen Sie `connect.ok` und `connect.rpcOk` in der Ausgabe von `--json`.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → Das Gateway hat geantwortet, aber dieser Client muss noch gekoppelt bzw. genehmigt werden, bevor der normale Operatorzugriff möglich ist.
- Nicht aufgelöster SecretRef-Warntext zu `gateway.auth.*` / `gateway.remote.*` → Für das fehlgeschlagene Ziel war in diesem Befehlspfad kein Authentifizierungsmaterial verfügbar.

Verwandte Themen:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remotezugriff](/de/gateway/remote)

## Kanal verbunden, aber Nachrichten werden nicht übertragen

Wenn der Kanalstatus „verbunden“ lautet, aber keine Nachrichten übertragen werden, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellungsregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Zulassungsliste und Erwähnungsanforderungen.
- Fehlende API-Berechtigungen/Scopes des Kanals.

Häufige Meldungen:

- `mention required` → Die Nachricht wurde aufgrund der Richtlinie für Gruppenerwähnungen ignoriert.
- `pairing` / Ablaufspuren einer ausstehenden Genehmigung → Der Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit der Authentifizierung oder den Berechtigungen des Kanals.

Verwandte Themen:

- [Fehlerbehebung bei Kanälen](/de/channels/troubleshooting)
- [Discord](/de/channels/discord)
- [Telegram](/de/channels/telegram)
- [WhatsApp](/de/channels/whatsapp)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht ausgeführt oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Status und anschließend das Zustellungsziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf:

- Cron ist aktiviert und der nächste Aktivierungszeitpunkt ist vorhanden.
- Status im Verlauf der Auftragsausführungen (`ok`, `skipped`, `error`).
- Gründe für das Überspringen des Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Häufige Meldungen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
    - `cron: timer tick failed` → Der Scheduler-Takt ist fehlgeschlagen; prüfen Sie Datei-, Protokoll- und Laufzeitfehler.
    - `heartbeat skipped` mit `reason=quiet-hours` → Außerhalb des Zeitfensters der aktiven Stunden.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` ist vorhanden, enthält aber nur leere Zeilen, Kommentare, Überschriften, Codeblöcke oder ein leeres Checklisten-Gerüst, weshalb OpenClaw den Modellaufruf überspringt.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber bei diesem Takt ist keine der Aufgaben fällig.
    - `heartbeat: unknown accountId` → Ungültige Konto-ID für das Heartbeat-Zustellungsziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Das Heartbeat-Ziel wurde als DM-artiges Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder die agentenspezifische Überschreibung) auf `block` gesetzt ist.

  </Accordion>
</AccordionGroup>

Verwandte Themen:

- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting)

## Node gekoppelt, Tool schlägt fehl

Wenn ein Node gekoppelt ist, Tools jedoch fehlschlagen, grenzen Sie den Vordergrund-, Berechtigungs- und Genehmigungsstatus ein.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf:

- Der Node ist mit den erwarteten Funktionen online.
- Betriebssystemberechtigungen für Kamera, Mikrofon, Standort und Bildschirm.
- Status der Ausführungsgenehmigungen und der Zulassungsliste.

Häufige Meldungen:

- `NODE_BACKGROUND_UNAVAILABLE` → Die Node-App muss sich im Vordergrund befinden.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → Eine Betriebssystemberechtigung fehlt.
- `SYSTEM_RUN_DENIED: approval required` → Die Ausführungsgenehmigung steht noch aus.
- `SYSTEM_RUN_DENIED: allowlist miss` → Der Befehl wurde durch die Zulassungsliste blockiert.

Verwandte Themen:

- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
- [Fehlerbehebung bei Nodes](/de/nodes/troubleshooting)
- [Nodes](/de/nodes/index)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Aktionen des Browser-Tools fehlschlagen, obwohl das Gateway selbst fehlerfrei funktioniert.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Achten Sie auf:

- Ob `plugins.allow` festgelegt ist und `browser` enthält.
- Einen gültigen Pfad zur ausführbaren Browserdatei.
- Erreichbarkeit des CDP-Profils.
- Lokale Verfügbarkeit von Chrome für die Profile `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin- / Programmdatei-Meldungen">
    - `unknown command "browser"` oder `unknown command 'browser'` → Das mitgelieferte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt bzw. ist nicht verfügbar, obwohl `browser.enabled=true` gilt → `plugins.allow` schließt `browser` aus, sodass das Plugin nie geladen wurde.
    - `Failed to start Chrome CDP on port` → Der Browserprozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → Der konfigurierte Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → Die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → Die konfigurierte CDP-URL enthält einen ungültigen Port oder einen Port außerhalb des zulässigen Bereichs.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → Der aktuellen Gateway-Installation fehlt die zentrale Browser-Laufzeitabhängigkeit; installieren oder aktualisieren Sie OpenClaw erneut und starten Sie anschließend das Gateway neu. ARIA-Snapshots und einfache Screenshots der Seite können weiterhin funktionieren, Navigation, KI-Snapshots, Element-Screenshots mit CSS-Selektoren und der PDF-Export bleiben jedoch nicht verfügbar.

  </Accordion>
  <Accordion title="Chrome-MCP- / existing-session-Meldungen">
    - `Could not find DevToolsActivePort for chrome` → Die vorhandene Chrome-MCP-Sitzung konnte noch keine Verbindung mit dem ausgewählten Browser-Datenverzeichnis herstellen. Öffnen Sie die Inspektionsseite des Browsers, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Verbindungsanfrage und versuchen Sie es erneut. Wenn kein angemeldeter Zustand erforderlich ist, verwenden Sie vorzugsweise das verwaltete Profil `openclaw`.
    - `No browser tabs found for profile="user"` → Im Chrome-MCP-Verbindungsprofil sind keine lokalen Chrome-Tabs geöffnet.
    - `Remote CDP for profile "<name>" is not reachable` → Der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → Das Nur-Verbindungs-Profil hat kein erreichbares Ziel oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte dennoch nicht geöffnet werden.

  </Accordion>
  <Accordion title="Element- / Screenshot- / Upload-Meldungen">
    - `fullPage is not supported for element screenshots` → Die Screenshot-Anfrage kombinierte `--full-page` mit `--ref` oder `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe mit Chrome MCP / `existing-session` müssen die Seitenerfassung oder eine Snapshot-Referenz mit `--ref` verwenden, nicht ein CSS-Element mit `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks von Chrome MCP benötigen Snapshot-Referenzen, keine CSS-Selektoren.
    - `existing-session file uploads currently support one file at a time.` → Senden Sie bei Chrome-MCP-Profilen pro Aufruf eine Datei zum Hochladen.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks von Chrome-MCP-Profilen unterstützen keine Überschreibung des Zeitlimits.
    - `existing-session type does not support timeoutMs overrides.` → Lassen Sie `timeoutMs` für `act:type` bei `profile="user"` / Chrome-MCP-Profilen mit vorhandener Sitzung weg oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefiniertes Zeitlimit erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein ungekapseltes CDP-Profil.
    - Veraltete Überschreibungen für Ansichtsbereich, Dunkelmodus, Gebietsschema oder Offlinemodus bei Nur-Verbindungs- oder Remote-CDP-Profilen → Führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Playwright-/CDP-Emulationsstatus freizugeben, ohne das gesamte Gateway neu zu starten.

  </Accordion>
</AccordionGroup>

Verwandte Themen:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Fehlerbehebung für Browser](/de/tools/browser-linux-troubleshooting)

## Wenn nach einem Upgrade plötzlich etwas nicht mehr funktioniert

Die meisten Fehler nach einem Upgrade werden durch abweichende Konfigurationen oder nun durchgesetzte strengere Standardwerte verursacht.

<AccordionGroup>
  <Accordion title="1. Verhalten von Authentifizierungs- und URL-Überschreibungen geändert">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Zu prüfen:

    - Wenn `gateway.mode=remote` gilt, können CLI-Aufrufe auf das Remote-Gateway abzielen, obwohl Ihr lokaler Dienst fehlerfrei funktioniert.
    - Explizite Aufrufe mit `--url` greifen nicht auf gespeicherte Anmeldedaten zurück.

    Häufige Meldungen:

    - `gateway connect failed:` → Falsches URL-Ziel.
    - `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

  </Accordion>
  <Accordion title="2. Schutzmechanismen für Bindung und Authentifizierung sind strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Zu prüfen:

    - Nicht-Loopback-Bindungen (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: Authentifizierung über ein gemeinsames Token/Passwort oder eine korrekt konfigurierte Nicht-Loopback-Bereitstellung mit `trusted-proxy`.
    - Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

    Häufige Meldungen:

    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bindung ohne gültigen Gateway-Authentifizierungspfad.
    - `Connectivity probe: failed`, während die Laufzeit aktiv ist → Das Gateway ist aktiv, aber mit der aktuellen Authentifizierung bzw. URL nicht erreichbar.

  </Accordion>
  <Accordion title="3. Kopplungs- und Geräteidentitätsstatus geändert">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Zu prüfen:

    - Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
    - Ausstehende Genehmigungen für die DM-Kopplung nach Richtlinien- oder Identitätsänderungen.

    Häufige Meldungen:

    - `device identity required` → Geräteauthentifizierung nicht erfüllt.
    - `pairing required` → Absender/Gerät muss genehmigt werden.

  </Accordion>
</AccordionGroup>

Wenn Dienstkonfiguration und Laufzeit nach diesen Prüfungen weiterhin voneinander abweichen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandte Themen:

- [Authentifizierung](/de/gateway/authentication)
- [Hintergrundausführung und Prozess-Tool](/de/gateway/background-process)
- [Node-Kopplung](/de/gateway/pairing)

## Verwandte Themen

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Betriebshandbuch](/de/gateway)
