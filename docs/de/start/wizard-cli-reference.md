---
read_when:
    - Sie benötigen detaillierte Informationen zum Verhalten eines bestimmten `openclaw onboard`-Schritts
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: 'Schrittweises Verhalten von `openclaw onboard`: Funktionsweise der einzelnen Schritte, geschriebene Konfiguration und interne Abläufe'
title: Referenz zur CLI-Einrichtung
x-i18n:
    generated_at: "2026-07-24T05:00:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 41bb9243ac7276b383274f4c27e3782b29e8ecf9d883229a44e3ab59aca5a34f
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Diese Seite behandelt Schritt für Schritt das Onboarding-Verhalten, die Ausgaben und die internen Abläufe.
Eine Anleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard). Die vollständige Referenz
der CLI-Flags (alle `--flag`, nicht interaktive Beispiele, providerspezifische
Befehle) finden Sie unter [`openclaw onboard`](/de/cli/onboard).

## Funktionsweise des Assistenten

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Authentifizierungseinrichtung (Anthropic, OAuth für das OpenAI-Code-Abonnement, xAI, OpenCode, benutzerdefinierte Endpunkte und weitere providerseitige Authentifizierungsabläufe)
- Arbeitsbereichsspeicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bindung, Authentifizierung, Tailscale)
- Kanäle und Provider (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere gebündelte oder Plugin-Kanäle)
- Provider für die Websuche (optional)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native geplante Windows-Aufgabe mit Ausweichlösung über den Autostartordner)
- Integritätsprüfung
- Einrichtung der Skills

Der Remote-Modus konfiguriert diesen Rechner für die Verbindung mit einem Gateway an einem anderen Ort. Er
installiert oder ändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie **Aktuelle Werte beibehalten**, **Überprüfen und aktualisieren** oder **Vor der Einrichtung zurücksetzen**.
    - Ein erneutes Ausführen des Assistenten löscht nichts, sofern Sie nicht ausdrücklich „Zurücksetzen“ wählen (oder `--reset` übergeben).
    - CLI `--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um auch den Arbeitsbereich zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, hält der Assistent an und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Beim Zurücksetzen wird der Zustand in den Papierkorb verschoben (niemals direkt gelöscht), wobei folgende Umfänge angeboten werden:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Arbeitsbereich)

  </Step>
  <Step title="Modell und Authentifizierung">
    - Die vollständige Optionsmatrix finden Sie unter [Authentifizierungs- und Modelloptionen](#auth-and-model-options).

  </Step>
  <Step title="Arbeitsbereich">
    - Standardmäßig `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt die für den Bootstrap beim ersten Start erforderlichen Arbeitsbereichsdateien.
    - Bei erneuter Ausführung behält eine vorhandene Agentenliste ihren flottenweiten Arbeitsbereich bei, sofern
      Sie die Verschiebung nicht ausdrücklich bestätigen. Nicht interaktive erneute Ausführungen warnen und behalten
      den aktuellen Wert bei.
    - Arbeitsbereichsstruktur: [Agentenarbeitsbereich](/de/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Fragt Port, Bindung, Authentifizierungsmodus und Tailscale-Freigabe ab.
    - Empfohlen: Lassen Sie die Token-Authentifizierung auch für Loopback aktiviert, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (optional)
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls die Speicherung als Klartext oder SecretRef.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie die Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Nicht-Loopback-Bindungen erfordern weiterhin eine Authentifizierung.

  </Step>
  <Step title="Kanäle">
    - [WhatsApp](/de/channels/whatsapp): optionale QR-Anmeldung
    - [Telegram](/de/channels/telegram): Bot-Token
    - [Discord](/de/channels/discord): Bot-Token
    - [Google Chat](/de/channels/googlechat): Dienstkonto-JSON + Webhook-Zielgruppe
    - [Mattermost](/de/channels/mattermost): Bot-Token + Basis-URL
    - [Signal](/de/channels/signal): optionale Installation von `signal-cli` + Kontokonfiguration
    - [iMessage](/de/channels/imessage): CLI-Pfad für `imsg` + Zugriff auf die Messages-Datenbank; verwenden Sie einen SSH-Wrapper, wenn das Gateway nicht auf einem Mac ausgeführt wird
    - DM-Sicherheit: Standardmäßig wird eine Kopplung verwendet. Die erste DM sendet einen Code; genehmigen Sie ihn über
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Zulassungslisten.
  </Step>
  <Step title="Websuche">
    - Wählen Sie einen Provider (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) oder überspringen Sie diesen Schritt.
    - Überspringen Sie diesen Schritt mit `--skip-search`; konfigurieren Sie ihn später mit `openclaw configure --section web` neu.

  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; verwenden Sie für den Betrieb ohne Benutzeroberfläche einen benutzerdefinierten LaunchDaemon (nicht enthalten).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Assistent versucht `loginctl enable-linger <user>`, damit das Gateway nach der Abmeldung weiterläuft.
      - Möglicherweise wird sudo angefordert (schreibt `/var/lib/systemd/linger`); zunächst wird es ohne sudo versucht.
    - Natives Windows: zuerst eine geplante Aufgabe
      - Wenn die Aufgabenerstellung verweigert wird, weicht OpenClaw auf einen benutzerspezifischen Anmeldeeintrag im Autostartordner aus und startet das Gateway sofort.
      - Geplante Aufgaben werden weiterhin bevorzugt, da sie einen besseren Supervisor-Status bieten.
    - Laufzeitauswahl: Node ist erforderlich, da der kanonische Laufzeitzustandsspeicher von OpenClaw `node:sqlite` verwendet.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls erforderlich) und führt `openclaw health` aus.
    - `openclaw status --deep` fügt der Statusausgabe die Live-Integritätsprüfung des Gateways hinzu, einschließlich Kanalprüfungen, sofern unterstützt.

  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills ein und prüft die Anforderungen.
    - Ermöglicht die Auswahl des Node-Managers: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten für vertrauenswürdige gebündelte Skills, wenn das erforderliche
      Installationsprogramm verfügbar ist.
    - Überspringt nicht verfügbare Installationsprogramme für Homebrew, uv und Go und gruppiert anschließend die betroffenen
      Skills mit Anleitungen zur manuellen Einrichtung. Führen Sie `openclaw doctor` aus, nachdem Sie
      die fehlenden Voraussetzungen installiert haben.

  </Step>
  <Step title="Abschluss">
    - Zusammenfassung und nächste Schritte, einschließlich Optionen für iOS-, Android- und macOS-Apps.

  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent SSH-Portweiterleitungsanweisungen für die Control UI aus, anstatt einen Browser zu öffnen.
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu erstellen; als Ausweichlösung dient `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details zum Remote-Modus

Der Remote-Modus konfiguriert diesen Rechner für die Verbindung mit einem Gateway an einem anderen Ort. Er
installiert oder ändert nichts auf dem Remote-Host.

Ihre Einstellungen:

- Remote-Gateway-URL (`ws://...` oder `wss://...`)
- Token, Passwort oder keine Authentifizierung, entsprechend der Konfiguration des Remote-Gateways

<Steps>
  <Step title="Erkennung (optional)">
    Wenn `dns-sd` (macOS) oder `avahi-browse` (Linux) verfügbar ist, bietet das Onboarding
    die Suche nach Bonjour-/mDNS-Gateway-Beacons an, bevor auf die
    manuelle URL-Eingabe zurückgegriffen wird. Bei entsprechender Konfiguration wird auch eine Weitbereichs-DNS-SD-Erkennung
    versucht. Dokumentation: [Gateway-Erkennung](/de/gateway/discovery), [Bonjour](/de/gateway/bonjour).
  </Step>
  <Step title="Verbindungsmethode">
    Wenn ein Beacon ausgewählt wurde, wählen Sie eine direkte WebSocket-Verbindung oder einen SSH-Tunnel:
    - **Direkt**: Stellt eine Verbindung über `wss://` her und fordert Sie auf, dem erkannten
      TLS-Fingerabdruck zu vertrauen (Pinning nach dem Trust-on-First-Use-Prinzip; wird nur angeheftet, wenn Sie zustimmen).
    - **SSH-Tunnel**: Gibt einen `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`-
      Befehl aus, den Sie zuerst ausführen müssen, und stellt anschließend eine Verbindung mit dem lokalen Tunnelendpunkt her.
  </Step>
  <Step title="Authentifizierung">
    Wählen Sie Token (empfohlen), Passwort oder keine Authentifizierung und speichern Sie die Angabe dann optional
    als SecretRef statt als Klartext.
  </Step>
</Steps>

<Note>
Wenn das Gateway ausschließlich an Loopback gebunden und nicht auffindbar ist, verwenden Sie manuell einen SSH-Tunnel oder ein Tailnet.
Klartext-`ws://` wird für Loopback, private IP-Literale, `.local` und Tailnet-`*.ts.net`-URLs akzeptiert; andere private DNS-Namen benötigen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Authentifizierungs- und Modelloptionen

Wenn ein Schritt zur Provider-Einrichtung beim interaktiven Onboarding fehlschlägt (beispielsweise eine Option zur Wiederverwendung der CLI
ohne lokale Anmeldung), zeigt der Assistent den Fehler an und kehrt zur Provider-Auswahl zurück,
anstatt sich zu beenden. Explizite `--auth-choice`-Ausführungen schlagen für die Automatisierung weiterhin sofort fehl.

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert ihn anschließend zur Verwendung durch den Daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Bevorzugter lokaler Pfad beim interaktiven Onboarding bzw. bei der interaktiven Konfiguration; verwendet eine vorhandene Claude-CLI-Anmeldung, sofern verfügbar.
  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (OAuth)">
    Browserablauf; fügen Sie `code#state` ein.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Laufzeit
    auf `openai/gpt-5.6-sol` gesetzt.

  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (Gerätekopplung)">
    Browserbasierter Kopplungsablauf mit einem kurzlebigen Gerätecode.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Laufzeit
    auf `openai/gpt-5.6-sol` gesetzt.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fragt nach einem Schlüssel und speichert die Anmeldedaten anschließend in Authentifizierungsprofilen.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model`
    auf `openai/gpt-5.6` gesetzt; die reine Modell-ID der direkten API wird der Sol-Stufe zugeordnet.

    Beim Hinzufügen oder erneuten Authentifizieren von OpenAI bleibt ein vorhandenes, explizit festgelegtes primäres
    Modell erhalten, einschließlich `openai/gpt-5.5`. Wenn das Konto GPT-5.6 nicht bereitstellt,
    wählen Sie ausdrücklich `openai/gpt-5.5`; OpenClaw stuft es nicht stillschweigend herab.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Browseranmeldung für berechtigte SuperGrok- oder X-Premium-Konten. Dies ist für
    die meisten Benutzer der empfohlene xAI-Weg. OpenClaw speichert das resultierende
    Authentifizierungsprofil für Grok-Modelle, Grok `web_search`, `x_search` und `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) Gerätecode">
    Für Remote-Umgebungen geeignete Browseranmeldung mit einem kurzen Code anstelle
    eines localhost-Callbacks. Verwenden Sie dies auf SSH-, Docker- oder VPS-Hosts.
  </Accordion>
  <Accordion title="xAI (Grok) API-Schlüssel">
    Fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider. Verwenden Sie dies,
    wenn Sie anstelle von Abonnement-OAuth einen API-Schlüssel der xAI Console verwenden möchten.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) und ermöglicht Ihnen die Auswahl des Zen- oder Go-Katalogs (ein API-Schlüssel gilt für beide).
    Einrichtungs-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Schlüssel (generisch)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fragt nach `AI_GATEWAY_API_KEY`.
    Weitere Details: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fragt nach Konto-ID, Gateway-ID und `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Weitere Details: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standardwert ist `MiniMax-M3`; die Einrichtung per API-Schlüssel verwendet
    `minimax/...`, die OAuth-Einrichtung verwendet `minimax-portal/...`.
    Weitere Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan an chinesischen oder globalen Endpunkten geschrieben.
    Standard umfasst derzeit `step-3.5-flash`, Step Plan umfasst zusätzlich `step-3.5-flash-2603`.
    Weitere Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Weitere Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud- und lokale offene Modelle)">
    Fragt zuerst nach `Cloud + Local`, `Cloud only` oder `Local only`.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen nach der Basis-URL (Standardwert `http://127.0.0.1:11434`), ermitteln verfügbare Modelle und schlagen Standardwerte vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff angemeldet ist.
    Weitere Details: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Die Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Weitere Details: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen, OpenAI-Responses-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Das interaktive Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere API-Schlüssel-Abläufe von Providern:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Secret-Referenz verwenden** (Umgebungsvariablen-Referenz oder konfigurierte Provider-Referenz, mit Vorabvalidierung)

    Das Onboarding erkennt die Bildunterstützung für gängige IDs von Vision-Modellen (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral und ähnliche) und fragt nur nach, wenn der Modellname unbekannt ist.

    Flags für den nicht interaktiven Betrieb:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; fällt auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optional; Standardwert `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; überschreibt die abgeleitete Modelleingabefähigkeit)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt die Authentifizierung unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie das Standardmodell aus den erkannten Optionen aus oder geben Sie Provider und Modell manuell ein.
- Wenn das Onboarding mit der Auswahl einer Provider-Authentifizierung beginnt, bevorzugt die Modellauswahl
  diesen Provider automatisch. Bei Volcengine und BytePlus berücksichtigt dieselbe Präferenz
  auch deren Coding-Plan-Varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser Filter für den bevorzugten Provider leer wäre, greift die Auswahl auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung aus und warnt, wenn das konfigurierte Modell unbekannt ist oder die Authentifizierung fehlt.

Pfade für Anmeldedaten und Profile:

- Authentifizierungsprofile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import von Legacy-OAuth: `~/.openclaw/credentials/oauth.json`

Speichermodus für Anmeldedaten:

- Standardmäßig speichert das Onboarding API-Schlüssel als Klartextwerte in Authentifizierungsprofilen.
- `--secret-input-mode ref` aktiviert anstelle der Klartextspeicherung von Schlüsseln den Referenzmodus.
  Bei der interaktiven Einrichtung können Sie zwischen folgenden Optionen wählen:
  - Umgebungsvariablen-Referenz (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Referenz (`file` oder `exec`) mit Provider-Alias und ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Vorabvalidierung aus.
  - Umgebungsvariablen-Referenzen: Validiert den Variablennamen und einen nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Referenzen: Validiert die Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn die Vorabvalidierung fehlschlägt, zeigt das Onboarding den Fehler an und ermöglicht einen erneuten Versuch.
- Im nicht interaktiven Modus wird `--secret-input-mode ref` ausschließlich durch Umgebungsvariablen gestützt.
  - Setzen Sie die Umgebungsvariable des Providers in der Prozessumgebung des Onboardings.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) setzen voraus, dass diese Umgebungsvariable gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
  - Bei benutzerdefinierten Providern speichert der nicht interaktive Modus `ref` den Wert `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall eines benutzerdefinierten Providers setzt `--custom-api-key` voraus, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls schlägt das Onboarding sofort fehl.
- Gateway-Authentifizierungsdaten unterstützen bei der interaktiven Einrichtung Klartext- und SecretRef-Optionen:
  - Token-Modus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Einrichtungen funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Serverumgebungen: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie anschließend
`auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
`$OPENCLAW_STATE_DIR/...`-Pfad) auf den Gateway-Host. `credentials/oauth.json`
dient nur als Legacy-Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet bei nicht gesetztem Wert standardmäßig `"coding"`; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bindung, Authentifizierung, Tailscale)
- `session.dmScope` (das Onboarding behält explizite Werte bei und lässt den Wert andernfalls ungesetzt, sodass der Standardwert `main` alle Direktnachrichten kanalübergreifend in der fortlaufenden Hauptsitzung des Agenten hält – der Standard für persönliche Agenten. Verwenden Sie für gemeinsam genutzte Posteingänge oder Posteingänge mit mehreren Benutzern `per-channel-peer`; `openclaw security audit` empfiehlt eine Isolierung, wenn Direktnachrichtenverkehr von mehreren Benutzern erkannt wird)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Zulassungslisten (Discord, iMessage, Signal, Slack, Telegram, WhatsApp), wenn Sie sich während der Abfragen dafür entscheiden; Discord und Slack lösen eingegebene Namen außerdem in IDs auf
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - In der manuellen Konfiguration kann `skills.install.nodeManager: "yarn"` weiterhin später festgelegt werden.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` schreibt `agents.entries.*` und optional `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` gespeichert.
Aktive Sitzungen und Transkripte werden in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` gespeichert. Das
Verzeichnis `~/.openclaw/agents/<agentId>/sessions/` wird für Eingaben zur Legacy-Migration
sowie für Archiv- und Supportartefakte verwendet.

<Note>
Einige Kanäle werden als Plugins bereitgestellt. Wenn sie während der Einrichtung ausgewählt werden, fordert der Assistent
vor der Kanalkonfiguration zur Installation des Plugins (npm oder lokaler Pfad) auf.
</Note>

### Empfehlungen für installierte Apps

Nachdem die Prüfung des Modellzugriffs erfolgreich war, durchsucht das klassische interaktive Onboarding unter macOS Anwendungsnamen und Bundle-IDs, ohne macOS-Datenschutzberechtigungen anzufordern. Es durchsucht die offiziellen Plugin-Kataloge und ClawHub und bittet anschließend das konfigurierte Modell, falsche Namensübereinstimmungen zu verwerfen und relevante Plugins oder Skills zu empfehlen. Empfohlene Treffer sind standardmäßig ausgewählt; optionale Treffer erfordern eine explizite Auswahl.

Der Ergebnisbildschirm führt die erkannten Anwendungen auf und zeigt Folgendes an: „App-Namen wurden mithilfe Ihres konfigurierten Modells und der ClawHub-Suche abgeglichen.“ Setzen Sie `wizard.appRecommendations` auf `false`, um sowohl diesen Onboarding-Schritt als auch den Gateway-Zugriff auf App-Inventare von Nodes zu deaktivieren. Der Scan wird weder im Schnellstart noch beim Onboarding außerhalb von macOS verwendet.

## Nicht interaktive Einrichtung

`--non-interactive` erfordert `--accept-risk` (bestätigt, dass Agenten
leistungsfähig sind und vollständiger Systemzugriff riskant ist):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Vollständige Flag-Referenz und providerspezifische Beispiele: [`openclaw onboard`](/de/cli/onboard), [CLI-Automatisierung](/de/start/wizard-cli-automation).

## RPC des Gateway-Assistenten

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte darstellen, ohne die Onboarding-Logik erneut zu implementieren.

## Verhalten bei der Signal-Einrichtung

- Lädt das passende Release-Artefakt aus den offiziellen GitHub-Releases von `signal-cli` herunter (nativer Build, nur Linux x86-64)
- Installiert auf anderen Plattformen (macOS, Linux ohne x64) stattdessen über Homebrew
- Speichert die Installation des Release-Artefakts unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.transport.cliPath` mit `kind: "managed-native"` in die Konfiguration
- Natives Windows wird noch nicht unterstützt; führen Sie das Onboarding in WSL2 aus, um den Linux-Installationspfad zu erhalten

## Zugehörige Dokumentation

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
