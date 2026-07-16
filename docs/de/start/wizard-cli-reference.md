---
read_when:
    - Sie benötigen detaillierte Informationen zum Verhalten eines bestimmten Schritts von `openclaw onboard`
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: 'Schrittweises Verhalten von `openclaw onboard`: Funktion der einzelnen Schritte, geschriebene Konfiguration und interne Abläufe'
title: CLI-Einrichtungsreferenz
x-i18n:
    generated_at: "2026-07-16T13:29:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Diese Seite behandelt schrittweise das Onboarding-Verhalten, die Ausgaben und die internen Abläufe.
Eine Anleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard). Die vollständige Referenz
der CLI-Flags (jedes `--flag`, Beispiele für die nicht interaktive Verwendung, providerspezifische
Befehle) finden Sie unter [`openclaw onboard`](/de/cli/onboard).

## Funktionsweise des Assistenten

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Authentifizierungseinrichtung (Anthropic, OAuth für das OpenAI-Code-Abonnement, xAI, OpenCode, benutzerdefinierte Endpunkte und weitere providereigene Authentifizierungsabläufe)
- Speicherort des Arbeitsbereichs und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bindung, Authentifizierung, Tailscale)
- Kanäle und Provider (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere gebündelte oder Plugin-Kanäle)
- Provider für die Websuche (optional)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native geplante Windows-Aufgabe mit Ausweichlösung über den Autostartordner)
- Integritätsprüfung
- Einrichtung der Skills

Der Remote-Modus konfiguriert diesen Computer für die Verbindung mit einem anderen Gateway. Auf dem
Remote-Host wird nichts installiert oder geändert.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie **Aktuelle Werte beibehalten**, **Prüfen und aktualisieren** oder **Vor der Einrichtung zurücksetzen**.
    - Beim erneuten Ausführen des Assistenten wird nichts gelöscht, sofern Sie nicht ausdrücklich „Zurücksetzen“ wählen (oder `--reset` übergeben).
    - Der CLI-Wert `--reset` ist standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um zusätzlich den Arbeitsbereich zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, hält der Assistent an und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Beim Zurücksetzen wird der Zustand in den Papierkorb verschoben (niemals direkt gelöscht), wobei folgende Bereiche angeboten werden:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Arbeitsbereich)

  </Step>
  <Step title="Modell und Authentifizierung">
    - Die vollständige Optionsmatrix finden Sie unter [Authentifizierungs- und Modelloptionen](#auth-and-model-options).

  </Step>
  <Step title="Arbeitsbereich">
    - Standardmäßig `~/.openclaw/workspace` (konfigurierbar).
    - Erstellt die Arbeitsbereichsdateien, die für den Bootstrap beim ersten Start erforderlich sind.
    - Aufbau des Arbeitsbereichs: [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Fragt Port, Bindung, Authentifizierungsmodus und Tailscale-Freigabe ab.
    - Empfehlung: Lassen Sie die Token-Authentifizierung auch für Loopback aktiviert, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung folgende Optionen:
      - **Klartext-Token generieren/speichern** (Standard)
      - **SecretRef verwenden** (optional)
    - Im Passwortmodus unterstützt die interaktive Einrichtung ebenfalls die Speicherung als Klartext oder SecretRef.
    - Nicht interaktiver Token-SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
      - Erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
      - Kann nicht mit `--gateway-token` kombiniert werden.
    - Deaktivieren Sie die Authentifizierung nur, wenn Sie jedem lokalen Prozess vollständig vertrauen.
    - Bindungen außerhalb von Loopback erfordern weiterhin eine Authentifizierung.

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
      - Erfordert eine angemeldete Benutzersitzung; verwenden Sie für den Headless-Betrieb einen benutzerdefinierten LaunchDaemon (nicht enthalten).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Assistent versucht, `loginctl enable-linger <user>` auszuführen, damit das Gateway nach der Abmeldung weiterläuft.
      - Fordert möglicherweise zur Eingabe für sudo auf (schreibt `/var/lib/systemd/linger`); zunächst wird es ohne sudo versucht.
    - Natives Windows: zuerst geplante Aufgabe
      - Wenn die Erstellung der Aufgabe verweigert wird, verwendet OpenClaw ersatzweise ein benutzerspezifisches Anmeldeelement im Autostartordner und startet das Gateway sofort.
      - Geplante Aufgaben bleiben die bevorzugte Option, da sie einen besseren Supervisor-Status bereitstellen.
    - Laufzeitauswahl: Node ist erforderlich, da der kanonische Laufzeit-Zustandsspeicher von OpenClaw `node:sqlite` verwendet.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls erforderlich) und führt `openclaw health` aus.
    - `openclaw status --deep` ergänzt die Statusausgabe um die Live-Integritätsprüfung des Gateways, einschließlich Kanalprüfungen, sofern unterstützt.

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
Wenn die Control-UI-Assets fehlen, versucht der Assistent, sie zu erstellen; als Ausweichlösung dient `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
</Note>

## Details zum Remote-Modus

Der Remote-Modus konfiguriert diesen Computer für die Verbindung mit einem anderen Gateway. Auf dem
Remote-Host wird nichts installiert oder geändert.

Ihre Angaben:

- Remote-Gateway-URL (`ws://...` oder `wss://...`)
- Token, Passwort oder keine Authentifizierung, entsprechend der Konfiguration des Remote-Gateways

<Steps>
  <Step title="Erkennung (optional)">
    Wenn `dns-sd` (macOS) oder `avahi-browse` (Linux) verfügbar ist, bietet das Onboarding
    an, nach Bonjour-/mDNS-Gateway-Beacons zu suchen, bevor auf die
    manuelle URL-Eingabe zurückgegriffen wird. Sofern konfiguriert, wird auch eine Wide-Area-DNS-SD-Erkennung
    versucht. Dokumentation: [Gateway-Erkennung](/de/gateway/discovery), [Bonjour](/de/gateway/bonjour).
  </Step>
  <Step title="Verbindungsmethode">
    Wenn ein Beacon ausgewählt ist, wählen Sie eine direkte WebSocket-Verbindung oder einen SSH-Tunnel:
    - **Direkt**: Stellt eine Verbindung über `wss://` her und fordert Sie auf, dem erkannten
      TLS-Fingerabdruck zu vertrauen (Trust-on-First-Use-Pinning; wird nur angeheftet, wenn Sie zustimmen).
    - **SSH-Tunnel**: Gibt einen `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`-
      Befehl aus, der zuerst ausgeführt werden muss, und verbindet sich anschließend mit dem lokalen Tunnelendpunkt.
  </Step>
  <Step title="Authentifizierung">
    Wählen Sie Token (empfohlen), Passwort oder keine Authentifizierung und speichern Sie die Angabe anschließend optional
    als SecretRef statt als Klartext.
  </Step>
</Steps>

<Note>
Wenn das Gateway ausschließlich an Loopback gebunden und nicht auffindbar ist, verwenden Sie manuell einen SSH-Tunnel oder ein Tailnet.
Klartext-`ws://` wird für Loopback, private IP-Literale, `.local` und Tailnet-URLs des Typs `*.ts.net` akzeptiert; andere private DNS-Namen benötigen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Authentifizierungs- und Modelloptionen

Wenn ein Schritt zur Provider-Einrichtung im interaktiven Onboarding fehlschlägt (beispielsweise eine Option zur Wiederverwendung der CLI
ohne lokale Anmeldung), zeigt der Assistent den Fehler an und kehrt zur Provider-Auswahl zurück,
statt das Programm zu beenden. Explizite Ausführungen mit `--auth-choice` schlagen für Automatisierungen weiterhin sofort fehl.

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, sofern vorhanden, oder fragt nach einem Schlüssel und speichert ihn anschließend für die Verwendung durch den Daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Bevorzugter lokaler Pfad beim interaktiven Onboarding bzw. bei der interaktiven Konfiguration; verwendet eine vorhandene Claude-CLI-Anmeldung wieder, sofern verfügbar.
  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (OAuth)">
    Browserablauf; fügen Sie `code#state` ein.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Laufzeit auf
    `openai/gpt-5.6-sol` gesetzt.

  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (Gerätekopplung)">
    Browserbasierter Kopplungsablauf mit einem kurzlebigen Gerätecode.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Laufzeit auf
    `openai/gpt-5.6-sol` gesetzt.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, sofern vorhanden, oder fragt nach einem Schlüssel und speichert die Anmeldedaten anschließend in Authentifizierungsprofilen.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` auf
    `openai/gpt-5.6` gesetzt; die reine Modell-ID der direkten API wird der Sol-Stufe zugeordnet.

    Beim Hinzufügen oder erneuten Authentifizieren von OpenAI bleibt ein vorhandenes, ausdrücklich festgelegtes primäres
    Modell erhalten, einschließlich `openai/gpt-5.5`. Wenn das Konto GPT-5.6 nicht bereitstellt,
    wählen Sie ausdrücklich `openai/gpt-5.5`; OpenClaw stuft es nicht stillschweigend herab.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Browseranmeldung für berechtigte SuperGrok- oder X-Premium-Konten. Dies ist für
    die meisten Benutzer der empfohlene xAI-Weg. OpenClaw speichert das resultierende
    Authentifizierungsprofil für Grok-Modelle, Grok `web_search`, `x_search` und `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) Gerätecode">
    Für Remote-Systeme geeignete Browseranmeldung mit einem kurzen Code anstelle eines
    localhost-Callbacks. Verwenden Sie dies auf SSH-, Docker- oder VPS-Hosts.
  </Accordion>
  <Accordion title="xAI (Grok) API-Schlüssel">
    Fragt nach `XAI_API_KEY` und konfiguriert xAI als Modell-Provider. Verwenden Sie dies,
    wenn Sie anstelle eines Abonnement-OAuth einen API-Schlüssel der xAI Console verwenden möchten.
  </Accordion>
  <Accordion title="OpenCode">
    Fragt nach `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) und lässt Sie den Zen- oder Go-Katalog auswählen (ein API-Schlüssel gilt für beide).
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
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standardwert ist `MiniMax-M3`; die Einrichtung mit API-Schlüssel verwendet
    `minimax/...`, und die OAuth-Einrichtung verwendet `minimax-portal/...`.
    Weitere Details: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf chinesischen oder globalen Endpunkten geschrieben.
    Standard umfasst derzeit `step-3.5-flash`, und Step Plan umfasst außerdem `step-3.5-flash-2603`.
    Weitere Details: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fragt nach `SYNTHETIC_API_KEY`.
    Weitere Details: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud und lokale offene Modelle)">
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

    Das interaktive Onboarding unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere API-Schlüssel-Abläufe für Provider:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Secret-Referenz verwenden** (Umgebungsvariablen-Referenz oder konfigurierte Provider-Referenz, mit Vorabvalidierung)

    Das Onboarding erkennt die Bildunterstützung für gängige IDs von Vision-Modellen (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral und ähnliche) und fragt nur nach, wenn der Modellname unbekannt ist.

    Flags für den nicht interaktiven Modus:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; verwendet ersatzweise `CUSTOM_API_KEY`)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optional; Standardwert `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; überschreibt die abgeleitete Eingabefähigkeit des Modells)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt die Authentifizierung unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie das Standardmodell aus den erkannten Optionen aus, oder geben Sie Provider und Modell manuell ein.
- Wenn das Onboarding mit der Authentifizierungsauswahl eines Providers beginnt, bevorzugt die Modellauswahl
  diesen Provider automatisch. Bei Volcengine und BytePlus umfasst diese Präferenz
  auch deren Coding-Plan-Varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser Filter für den bevorzugten Provider leer wäre, greift die Auswahl
  auf den vollständigen Katalog zurück, anstatt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung durch und warnt, wenn das konfigurierte Modell unbekannt ist oder die Authentifizierung fehlt.

Pfade für Anmeldedaten und Profile:

- Authentifizierungsprofile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import von Legacy-OAuth: `~/.openclaw/credentials/oauth.json`

Speichermodus für Anmeldedaten:

- Das Standardverhalten des Onboardings speichert API-Schlüssel als Klartextwerte in Authentifizierungsprofilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus anstelle der Speicherung von Schlüsseln im Klartext.
  Bei der interaktiven Einrichtung können Sie zwischen Folgendem wählen:
  - Umgebungsvariablen-Referenz (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Referenz (`file` oder `exec`) mit Provider-Alias und ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Vorabvalidierung durch.
  - Umgebungsvariablen-Referenzen: Validiert den Variablennamen und einen nicht leeren Wert in der aktuellen Onboarding-Umgebung.
  - Provider-Referenzen: Validiert die Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn die Vorabvalidierung fehlschlägt, zeigt das Onboarding den Fehler an und ermöglicht einen erneuten Versuch.
- Im nicht interaktiven Modus ist `--secret-input-mode ref` ausschließlich umgebungsvariablengestützt.
  - Setzen Sie die Umgebungsvariable des Providers in der Prozessumgebung des Onboardings.
  - Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`) setzen voraus, dass diese Umgebungsvariable gesetzt ist; andernfalls bricht das Onboarding sofort ab.
  - Bei benutzerdefinierten Providern speichert der nicht interaktive Modus `ref` den Wert `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall eines benutzerdefinierten Providers setzt `--custom-api-key` voraus, dass `CUSTOM_API_KEY` gesetzt ist; andernfalls bricht das Onboarding sofort ab.
- Gateway-Authentifizierungsdaten unterstützen bei der interaktiven Einrichtung die Auswahl zwischen Klartext und SecretRef:
  - Token-Modus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Einrichtungen funktionieren unverändert weiter.

<Note>
Tipp für Headless- und Serversysteme: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie anschließend
die Datei `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
Pfad `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
ist nur eine Legacy-Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (lokales Onboarding verwendet standardmäßig `"coding"`, wenn der Wert nicht gesetzt ist; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bindung, Authentifizierung, Tailscale)
- `session.dmScope` (lokales Onboarding setzt diesen Wert standardmäßig auf `per-channel-peer`, wenn er nicht gesetzt ist; vorhandene explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Zulassungslisten (Discord, iMessage, Signal, Slack, Telegram, WhatsApp), wenn Sie diese während der Eingabeaufforderungen aktivieren; Discord und Slack lösen eingegebene Namen außerdem in IDs auf
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Die manuelle Konfiguration kann `skills.install.nodeManager: "yarn"` weiterhin später festlegen.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` schreibt `agents.list[]` und optional `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` gespeichert.
Aktive Sitzungen und Transkripte werden in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` gespeichert. Das Verzeichnis
`~/.openclaw/agents/<agentId>/sessions/` wird für Eingaben der Legacy-Migration
und Archiv-/Support-Artefakte verwendet.

<Note>
Einige Kanäle werden als Plugins bereitgestellt. Wenn sie während der Einrichtung ausgewählt werden, fordert der Assistent
vor der Kanalkonfiguration zur Installation des Plugins (npm oder lokaler Pfad) auf.
</Note>

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

## Verhalten der Signal-Einrichtung

- Lädt das passende Release-Artefakt aus den offiziellen GitHub-Releases von `signal-cli` herunter (nativer Build, nur Linux x86-64)
- Installiert auf anderen Plattformen (macOS, Linux ohne x64) stattdessen über Homebrew
- Speichert die Installation des Release-Artefakts unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- Natives Windows wird noch nicht unterstützt; führen Sie das Onboarding innerhalb von WSL2 aus, um den Linux-Installationspfad zu erhalten

## Verwandte Dokumentation

- Onboarding-Zentrale: [Onboarding (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
