---
read_when:
    - Sie benötigen detaillierte Informationen zum Verhalten eines bestimmten Schritts von `openclaw onboard`
    - Sie debuggen Onboarding-Ergebnisse oder integrieren Onboarding-Clients
sidebarTitle: CLI reference
summary: 'Schrittweises Verhalten von `openclaw onboard`: Funktion der einzelnen Schritte, geschriebene Konfiguration und interne Abläufe'
title: CLI-Einrichtungsreferenz
x-i18n:
    generated_at: "2026-07-12T15:54:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56b318b3c5fbaeb37e99871e10b35eae38b209f3a2f683ff85816aca87a4ee6e
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Diese Seite beschreibt Schritt für Schritt das Onboarding-Verhalten, die Ausgaben und die internen Abläufe.
Eine Anleitung finden Sie unter [Onboarding (CLI)](/de/start/wizard). Die vollständige Referenz der CLI-Flags
(alle `--flag`-Optionen, nicht interaktive Beispiele und providerspezifische
Befehle) finden Sie unter [`openclaw onboard`](/de/cli/onboard).

## Funktionsweise des Assistenten

Der lokale Modus (Standard) führt Sie durch:

- Modell- und Authentifizierungseinrichtung (Anthropic, OAuth für das OpenAI-Code-Abonnement, xAI, OpenCode, benutzerdefinierte Endpunkte und weitere providerseitige Authentifizierungsabläufe)
- Workspace-Speicherort und Bootstrap-Dateien
- Gateway-Einstellungen (Port, Bindung, Authentifizierung, Tailscale)
- Kanäle und Provider (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und andere gebündelte oder Plugin-Kanäle)
- Provider für die Websuche (optional)
- Daemon-Installation (LaunchAgent, systemd-Benutzereinheit oder native geplante Windows-Aufgabe mit Ausweichlösung über den Autostartordner)
- Integritätsprüfung
- Einrichtung der Skills

Der Remote-Modus konfiguriert diesen Rechner für die Verbindung mit einem Gateway an einem anderen Ort. Er
installiert oder ändert nichts auf dem Remote-Host.

## Details zum lokalen Ablauf

<Steps>
  <Step title="Erkennung vorhandener Konfiguration">
    - Wenn `~/.openclaw/openclaw.json` vorhanden ist, wählen Sie **Aktuelle Werte beibehalten**, **Prüfen und aktualisieren** oder **Vor der Einrichtung zurücksetzen**.
    - Beim erneuten Ausführen des Assistenten wird nichts gelöscht, sofern Sie nicht ausdrücklich „Zurücksetzen“ wählen (oder `--reset` übergeben).
    - CLI `--reset` verwendet standardmäßig `config+creds+sessions`; verwenden Sie `--reset-scope full`, um auch den Workspace zu entfernen.
    - Wenn die Konfiguration ungültig ist oder veraltete Schlüssel enthält, hält der Assistent an und fordert Sie auf, `openclaw doctor` auszuführen, bevor Sie fortfahren.
    - Beim Zurücksetzen wird der Zustand in den Papierkorb verschoben (niemals direkt gelöscht), und folgende Bereiche stehen zur Auswahl:
      - Nur Konfiguration
      - Konfiguration + Anmeldedaten + Sitzungen
      - Vollständiges Zurücksetzen (entfernt auch den Workspace)

  </Step>
  <Step title="Modell und Authentifizierung">
    - Die vollständige Optionsmatrix finden Sie unter [Authentifizierungs- und Modelloptionen](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Standardmäßig `~/.openclaw/workspace` (konfigurierbar).
    - Legt die für den Bootstrap beim ersten Start erforderlichen Workspace-Dateien an.
    - Workspace-Struktur: [Agent-Workspace](/de/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Fragt Port, Bindung, Authentifizierungsmodus und Tailscale-Freigabe ab.
    - Empfehlung: Lassen Sie die Token-Authentifizierung auch für Loopback aktiviert, damit sich lokale WS-Clients authentifizieren müssen.
    - Im Token-Modus bietet die interaktive Einrichtung Folgendes:
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
    - [iMessage](/de/channels/imessage): Pfad zur `imsg`-CLI + Zugriff auf die Messages-Datenbank; verwenden Sie einen SSH-Wrapper, wenn das Gateway nicht auf einem Mac ausgeführt wird
    - DM-Sicherheit: Standardmäßig wird eine Kopplung verwendet. Die erste DM sendet einen Code; genehmigen Sie ihn über
      `openclaw pairing approve <channel> <code>` oder verwenden Sie Zulassungslisten.
  </Step>
  <Step title="Websuche">
    - Wählen Sie einen Provider (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) oder überspringen Sie den Schritt.
    - Überspringen Sie diesen Schritt mit `--skip-search`; konfigurieren Sie ihn später mit `openclaw configure --section web` neu.

  </Step>
  <Step title="Daemon-Installation">
    - macOS: LaunchAgent
      - Erfordert eine angemeldete Benutzersitzung; verwenden Sie für einen Headless-Betrieb einen benutzerdefinierten LaunchDaemon (nicht enthalten).
    - Linux und Windows über WSL2: systemd-Benutzereinheit
      - Der Assistent versucht, `loginctl enable-linger <user>` auszuführen, damit das Gateway nach der Abmeldung weiterläuft.
      - Fordert möglicherweise zur Verwendung von sudo auf (schreibt nach `/var/lib/systemd/linger`); zunächst wird es ohne sudo versucht.
    - Natives Windows: zuerst eine geplante Aufgabe
      - Wenn die Erstellung der Aufgabe verweigert wird, weicht OpenClaw auf ein benutzerspezifisches Anmeldeelement im Autostartordner aus und startet das Gateway sofort.
      - Geplante Aufgaben werden weiterhin bevorzugt, da sie bessere Statusinformationen zur Überwachung bereitstellen.
    - Runtime-Auswahl: Interaktiv wird nur Node angeboten. Bun kann bei der erneuten Verbindung von WhatsApp/Telegram den Speicher beschädigen und wird für diese Kanäle nicht als Daemon-Runtime unterstützt; übergeben Sie `--daemon-runtime bun` nur außerhalb dieser Kombination.

  </Step>
  <Step title="Integritätsprüfung">
    - Startet das Gateway (falls erforderlich) und führt `openclaw health` aus.
    - `openclaw status --deep` ergänzt die Statusausgabe um die Live-Integritätsprüfung des Gateways, einschließlich Kanalprüfungen, sofern unterstützt.

  </Step>
  <Step title="Skills">
    - Liest verfügbare Skills ein und prüft die Voraussetzungen.
    - Lässt Sie einen Node-Manager auswählen: npm, pnpm oder bun.
    - Installiert optionale Abhängigkeiten für vertrauenswürdige gebündelte Skills, wenn das erforderliche
      Installationsprogramm verfügbar ist.
    - Überspringt nicht verfügbare Installationsprogramme für Homebrew, uv und Go und gruppiert anschließend die betroffenen
      Skills mit Anweisungen zur manuellen Einrichtung. Führen Sie `openclaw doctor` aus, nachdem Sie
      die fehlenden Voraussetzungen installiert haben.

  </Step>
  <Step title="Abschluss">
    - Zusammenfassung und nächste Schritte, einschließlich Optionen für iOS-, Android- und macOS-Apps.

  </Step>
</Steps>

<Note>
Wenn keine GUI erkannt wird, gibt der Assistent SSH-Portweiterleitungsanweisungen für die Control UI aus, statt einen Browser zu öffnen.
Wenn Assets der Control UI fehlen, versucht der Assistent, sie zu erstellen; die Ausweichlösung ist `pnpm ui:build` (installiert UI-Abhängigkeiten automatisch).
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
    an, nach Bonjour-/mDNS-Beacons von Gateways zu suchen, bevor auf die
    manuelle URL-Eingabe zurückgegriffen wird. Wenn konfiguriert, wird auch eine
    Wide-Area-DNS-SD-Erkennung versucht. Dokumentation: [Gateway-Erkennung](/de/gateway/discovery), [Bonjour](/de/gateway/bonjour).
  </Step>
  <Step title="Verbindungsmethode">
    Wenn ein Beacon ausgewählt ist, wählen Sie eine direkte WebSocket-Verbindung oder einen SSH-Tunnel:
    - **Direkt**: Stellt eine Verbindung über `wss://` her und fordert Sie auf, dem erkannten
      TLS-Fingerabdruck zu vertrauen (Pinning nach dem Trust-on-First-Use-Prinzip; wird nur gespeichert, wenn Sie zustimmen).
    - **SSH-Tunnel**: Gibt einen Befehl `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      aus, den Sie zuerst ausführen müssen, und stellt anschließend eine Verbindung mit dem lokalen Tunnelendpunkt her.
  </Step>
  <Step title="Authentifizierung">
    Wählen Sie Token (empfohlen), Passwort oder keine Authentifizierung und speichern Sie die Angabe anschließend optional
    als SecretRef statt als Klartext.
  </Step>
</Steps>

<Note>
Wenn das Gateway ausschließlich an Loopback gebunden und nicht erkennbar ist, verwenden Sie manuell einen SSH-Tunnel oder ein Tailnet.
Klartext-`ws://` wird für Loopback, private IP-Literale, `.local`- und Tailnet-URLs der Form `*.ts.net` akzeptiert; andere private DNS-Namen erfordern `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Authentifizierungs- und Modelloptionen

Wenn ein Schritt zur Provider-Einrichtung beim interaktiven Onboarding fehlschlägt (beispielsweise eine Option zur Wiederverwendung der CLI
ohne lokale Anmeldung), zeigt der Assistent den Fehler an und kehrt zur Providerauswahl zurück,
anstatt beendet zu werden. Explizite Ausführungen mit `--auth-choice` schlagen für Automatisierungen weiterhin sofort fehl.

<AccordionGroup>
  <Accordion title="Anthropic-API-Schlüssel">
    Verwendet `ANTHROPIC_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert ihn anschließend zur Verwendung durch den Daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Bevorzugter lokaler Pfad beim interaktiven Onboarding bzw. bei der interaktiven Konfiguration; verwendet eine vorhandene Anmeldung der Claude CLI, sofern verfügbar.
  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (OAuth)">
    Browserablauf; fügen Sie `code#state` ein.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Runtime auf
    `openai/gpt-5.6-sol` gesetzt.

  </Accordion>
  <Accordion title="OpenAI-Code-Abonnement (Gerätekopplung)">
    Browserbasierter Kopplungsablauf mit einem kurzlebigen Gerätecode.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` über die Codex-Runtime auf
    `openai/gpt-5.6-sol` gesetzt.

  </Accordion>
  <Accordion title="OpenAI-API-Schlüssel">
    Verwendet `OPENAI_API_KEY`, falls vorhanden, oder fordert zur Eingabe eines Schlüssels auf und speichert die Anmeldedaten anschließend in Authentifizierungsprofilen.

    Bei einer neuen Einrichtung ohne primäres Modell wird `agents.defaults.model` auf
    `openai/gpt-5.6` gesetzt; die einfache Modell-ID der direkten API wird der Sol-Stufe zugeordnet.

    Beim Hinzufügen oder erneuten Authentifizieren von OpenAI bleibt ein vorhandenes explizites primäres
    Modell erhalten, einschließlich `openai/gpt-5.5`. Wenn das Konto GPT-5.6 nicht bereitstellt,
    wählen Sie ausdrücklich `openai/gpt-5.5`; OpenClaw führt kein stilles Downgrade durch.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Browseranmeldung für berechtigte SuperGrok- oder X-Premium-Konten. Dies ist für die
    meisten Benutzer der empfohlene xAI-Pfad. OpenClaw speichert das resultierende Authentifizierungsprofil
    für Grok-Modelle sowie Grok `web_search`, `x_search` und `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok)-Gerätecode">
    Für Remote-Systeme geeignete Browseranmeldung mit einem kurzen Code anstelle eines localhost-
    Callbacks. Verwenden Sie dies auf SSH-, Docker- oder VPS-Hosts.
  </Accordion>
  <Accordion title="xAI (Grok)-API-Schlüssel">
    Fordert zur Eingabe von `XAI_API_KEY` auf und konfiguriert xAI als Modell-Provider. Verwenden Sie dies,
    wenn Sie statt Abonnement-OAuth einen API-Schlüssel der xAI Console verwenden möchten.
  </Accordion>
  <Accordion title="OpenCode">
    Fordert zur Eingabe von `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`) auf und lässt Sie den Zen- oder Go-Katalog auswählen (ein API-Schlüssel deckt beide ab).
    Einrichtungs-URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-Schlüssel (generisch)">
    Speichert den Schlüssel für Sie.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Fordert zur Eingabe von `AI_GATEWAY_API_KEY` auf.
    Weitere Einzelheiten: [Vercel AI Gateway](/de/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Fordert zur Eingabe der Konto-ID, der Gateway-ID und von `CLOUDFLARE_AI_GATEWAY_API_KEY` auf.
    Weitere Einzelheiten: [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Die Konfiguration wird automatisch geschrieben. Der gehostete Standard ist `MiniMax-M3`; die Einrichtung mit API-Schlüssel verwendet
    `minimax/...`, die OAuth-Einrichtung hingegen `minimax-portal/...`.
    Weitere Einzelheiten: [MiniMax](/de/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Die Konfiguration wird automatisch für StepFun Standard oder Step Plan auf chinesischen oder globalen Endpunkten geschrieben.
    Standard umfasst derzeit `step-3.5-flash`, und Step Plan umfasst zusätzlich `step-3.5-flash-2603`.
    Weitere Einzelheiten: [StepFun](/de/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    Fordert zur Eingabe von `SYNTHETIC_API_KEY` auf.
    Weitere Einzelheiten: [Synthetic](/de/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud- und lokale offene Modelle)">
    Fordert Sie zunächst zur Auswahl von `Cloud + Local`, `Cloud only` oder `Local only` auf.
    `Cloud only` verwendet `OLLAMA_API_KEY` mit `https://ollama.com`.
    Die hostgestützten Modi fragen die Basis-URL ab (Standard `http://127.0.0.1:11434`), erkennen verfügbare Modelle und schlagen Standardwerte vor.
    `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff angemeldet ist.
    Weitere Einzelheiten: [Ollama](/de/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot und Kimi Coding">
    Die Konfigurationen für Moonshot (Kimi K2) und Kimi Coding werden automatisch geschrieben.
    Weitere Einzelheiten: [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).
  </Accordion>
  <Accordion title="Benutzerdefinierter Provider">
    Funktioniert mit OpenAI-kompatiblen, OpenAI-Responses-kompatiblen und Anthropic-kompatiblen Endpunkten.

    Die interaktive Ersteinrichtung unterstützt dieselben Speicheroptionen für API-Schlüssel wie andere Abläufe für Provider-API-Schlüssel:
    - **API-Schlüssel jetzt einfügen** (Klartext)
    - **Geheimnisreferenz verwenden** (Umgebungsreferenz oder konfigurierte Provider-Referenz, mit Vorabvalidierung)

    Die Ersteinrichtung erkennt die Bildunterstützung für gängige IDs von Vision-Modellen (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral und ähnliche) automatisch und fragt nur nach, wenn der Modellname unbekannt ist.

    Flags für den nicht interaktiven Modus:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; greift ersatzweise auf `CUSTOM_API_KEY` zurück)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optional; Standardwert `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; überschreibt die erkannte Eingabefähigkeit des Modells)

  </Accordion>
  <Accordion title="Überspringen">
    Lässt die Authentifizierung unkonfiguriert.
  </Accordion>
</AccordionGroup>

Modellverhalten:

- Wählen Sie das Standardmodell aus den erkannten Optionen aus oder geben Sie Provider und Modell manuell ein.
- Wenn die Ersteinrichtung mit der Auswahl einer Provider-Authentifizierung beginnt, bevorzugt die Modellauswahl
  automatisch diesen Provider. Bei Volcengine und BytePlus umfasst diese Präferenz
  auch deren Coding-Plan-Varianten (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Wenn dieser Filter für den bevorzugten Provider keine Ergebnisse liefern würde, greift die Auswahl auf
  den vollständigen Katalog zurück, statt keine Modelle anzuzeigen.
- Der Assistent führt eine Modellprüfung durch und warnt, wenn das konfigurierte Modell unbekannt ist oder die Authentifizierung fehlt.

Pfade für Anmeldedaten und Profile:

- Authentifizierungsprofile (API-Schlüssel + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import von älterem OAuth: `~/.openclaw/credentials/oauth.json`

Speichermodus für Anmeldedaten:

- Standardmäßig speichert die Ersteinrichtung API-Schlüssel als Klartextwerte in Authentifizierungsprofilen.
- `--secret-input-mode ref` aktiviert den Referenzmodus anstelle der Speicherung von Schlüsseln im Klartext.
  Bei der interaktiven Einrichtung können Sie zwischen Folgendem wählen:
  - Umgebungsvariablenreferenz (zum Beispiel `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - konfigurierte Provider-Referenz (`file` oder `exec`) mit Provider-Alias und ID
- Der interaktive Referenzmodus führt vor dem Speichern eine schnelle Vorabvalidierung durch.
  - Umgebungsreferenzen: Überprüft den Variablennamen und einen nicht leeren Wert in der aktuellen Ersteinrichtungsumgebung.
  - Provider-Referenzen: Überprüft die Provider-Konfiguration und löst die angeforderte ID auf.
  - Wenn die Vorabvalidierung fehlschlägt, zeigt die Ersteinrichtung den Fehler an und ermöglicht einen erneuten Versuch.
- Im nicht interaktiven Modus wird `--secret-input-mode ref` ausschließlich durch Umgebungsvariablen unterstützt.
  - Legen Sie die Provider-Umgebungsvariable in der Prozessumgebung der Ersteinrichtung fest.
  - Direkte Schlüssel-Flags (zum Beispiel `--openai-api-key`) setzen voraus, dass diese Umgebungsvariable festgelegt ist; andernfalls bricht die Ersteinrichtung sofort ab.
  - Bei benutzerdefinierten Providern speichert der nicht interaktive Modus `ref` den Wert `models.providers.<id>.apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In diesem Fall eines benutzerdefinierten Providers setzt `--custom-api-key` voraus, dass `CUSTOM_API_KEY` festgelegt ist; andernfalls bricht die Ersteinrichtung sofort ab.
- Gateway-Authentifizierungsdaten unterstützen bei der interaktiven Einrichtung Klartext- und SecretRef-Optionen:
  - Token-Modus: **Klartext-Token generieren/speichern** (Standard) oder **SecretRef verwenden**.
  - Passwortmodus: Klartext oder SecretRef.
- Nicht interaktiver SecretRef-Pfad für Token: `--gateway-token-ref-env <ENV_VAR>`.
- Bestehende Klartext-Einrichtungen funktionieren unverändert weiter.

<Note>
Tipp für Headless-Systeme und Server: Schließen Sie OAuth auf einem Computer mit Browser ab und kopieren Sie anschließend
die Datei `auth-profiles.json` dieses Agenten (zum Beispiel
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oder den entsprechenden
Pfad unter `$OPENCLAW_STATE_DIR/...`) auf den Gateway-Host. `credentials/oauth.json`
dient nur als ältere Importquelle.
</Note>

## Ausgaben und Interna

Typische Felder in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, wenn `--skip-bootstrap` übergeben wird
- `agents.defaults.model` / `models.providers` (wenn Minimax ausgewählt wurde)
- `tools.profile` (bei lokaler Ersteinrichtung standardmäßig `"coding"`, wenn nicht festgelegt; vorhandene explizite Werte bleiben erhalten)
- `gateway.*` (Modus, Bindung, Authentifizierung, Tailscale)
- `session.dmScope` (bei lokaler Ersteinrichtung standardmäßig `per-channel-peer`, wenn nicht festgelegt; vorhandene explizite Werte bleiben erhalten)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Kanal-Zulassungslisten (Discord, iMessage, Signal, Slack, Telegram, WhatsApp), wenn Sie diese während der Eingabeaufforderungen aktivieren; Discord und Slack lösen eingegebene Namen außerdem in IDs auf
- `skills.install.nodeManager`
  - Das Flag `setup --node-manager` akzeptiert `npm`, `pnpm` oder `bun`.
  - Bei manueller Konfiguration kann später weiterhin `skills.install.nodeManager: "yarn"` festgelegt werden.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` schreibt `agents.list[]` und optionale `bindings`.

WhatsApp-Anmeldedaten werden unter `~/.openclaw/credentials/whatsapp/<accountId>/` gespeichert.
Aktive Sitzungen und Transkripte werden in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` gespeichert. Das Verzeichnis
`~/.openclaw/agents/<agentId>/sessions/` wird für Eingaben älterer Migrationen
und Archiv-/Supportartefakte verwendet.

<Note>
Einige Kanäle werden als Plugins bereitgestellt. Wenn sie während der Einrichtung ausgewählt werden, fordert der Assistent
Sie auf, das Plugin (über npm oder einen lokalen Pfad) vor der Kanalkonfiguration zu installieren.
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

## Gateway-Assistent-RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS-App und Control UI) können Schritte darstellen, ohne die Ersteinrichtungslogik neu zu implementieren.

## Verhalten bei der Signal-Einrichtung

- Lädt das passende Release-Artefakt aus den offiziellen GitHub-Releases von `signal-cli` herunter (nativer Build, nur Linux x86-64)
- Auf anderen Plattformen (macOS, Linux ohne x64) erfolgt die Installation stattdessen über Homebrew
- Speichert die Installation des Release-Artefakts unter `~/.openclaw/tools/signal-cli/<version>/`
- Schreibt `channels.signal.cliPath` in die Konfiguration
- Natives Windows wird noch nicht unterstützt; führen Sie die Ersteinrichtung innerhalb von WSL2 aus, um den Linux-Installationspfad zu erhalten

## Verwandte Dokumentation

- Ersteinrichtungsübersicht: [Ersteinrichtung (CLI)](/de/start/wizard)
- Automatisierung und Skripte: [CLI-Automatisierung](/de/start/wizard-cli-automation)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
