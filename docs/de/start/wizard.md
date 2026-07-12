---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Einrichten eines neuen Computers
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: Inferenz überprüfen, dann die verbleibende Einrichtung an Crestodian übergeben'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-07-12T16:02:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Das CLI-Onboarding ist der empfohlene Einrichtungsweg im Terminal unter macOS, Linux und
Windows (nativ oder WSL2). Standardmäßig erkennt es den bereits auf dem
Computer verfügbaren KI-Zugriff, überprüft ihn mit einer echten Vervollständigung und startet Crestodian, um
den Arbeitsbereich, das Gateway und optionale Funktionen zu konfigurieren. `openclaw setup` führt denselben Ablauf aus ([Einrichtung](/de/cli/setup) beschreibt
die reine Konfigurationsvariante `--baseline`). Benutzer der Windows-Desktop-App können auch über
den [Windows Hub](/de/platforms/windows) beginnen.

Das geführte Onboarding richtet zuerst die Inferenz ein. Es erkennt verfügbaren KI-Zugriff,
erfordert eine echte Vervollständigung und startet erst danach [Crestodian](/de/cli/crestodian),
um den Rest von OpenClaw zu konfigurieren. Im geführten Ablauf gibt es weder Crestodian
vor der Inferenz noch eine Möglichkeit, die KI-Einrichtung zu überspringen.

Der klassische Assistent bleibt für die Provider-Anmeldung, die Einrichtung eines entfernten Gateways,
die Kanalkopplung, Daemon-Steuerung, Skills und Importe verfügbar. Starten Sie ihn ausdrücklich
mit `openclaw onboard --classic`; die Kandidatenauswahl der geführten Inferenz
leitet nicht zu ihm weiter. Nachdem die Inferenz erfolgreich war, kann Crestodian mit `open channel
wizard for <channel>` eine Kanaleinrichtung, die Geheimnisse benötigt, an einen maskierten
Terminalassistenten übergeben. Um den Modell-Provider oder dessen Authentifizierung zu ändern, beenden Sie
Crestodian und führen Sie `openclaw onboard` aus; Crestodian öffnet weder geführte noch
klassische Provider-Abläufe.

<Info>
Schnellster Weg zum ersten Chat: Schließen Sie die geführte Einrichtung ab, führen Sie `openclaw dashboard` aus und chatten Sie
über die Steuerungsoberfläche im Browser. Dokumentation: [Dashboard](/de/web/dashboard).
</Info>

## Gebietsschema

Der Assistent lokalisiert fest vorgegebene Onboarding-Texte. Reihenfolge der Ermittlung: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, dann Englisch. Unterstützte Gebietsschemata: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Produktnamen, Befehle, Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs sowie
Plugin- und Kanalbezeichnungen bleiben unabhängig vom Gebietsschema auf Englisch.

So konfigurieren Sie Einstellungen, die nicht die Inferenz betreffen, später neu:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` aktiviert nicht automatisch den nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (siehe [CLI-Automatisierung](/de/start/wizard-cli-automation)).
</Note>

<Tip>
Der klassische Assistent enthält einen Schritt zur Websuche, in dem Sie einen Provider auswählen können: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG oder Tavily. Einige benötigen einen API-Schlüssel, andere
funktionieren ohne Schlüssel. Konfigurieren Sie dies später mit `openclaw configure --section web`. Dokumentation:
[Web-Werkzeuge](/de/tools/web).
</Tip>

## Geführter Standardablauf

Der einfache Aufruf `openclaw onboard` folgt diesem Ablauf:

1. Akzeptieren Sie den Sicherheitshinweis.
2. Erkennen Sie konfigurierte Modelle, Umgebungsvariablen für API-Schlüssel und unterstützte lokale
   KI-CLIs.
3. Testen Sie den ersten erkannten Kandidaten mit einer echten Vervollständigung. Zeigen Sie bei einem Fehler den
   Grund an und fahren Sie mit dem nächsten verwendbaren Kandidaten fort.
4. Wenn die Erkennung keine weiteren Kandidaten liefert, versuchen Sie einen erkannten Kandidaten erneut oder geben Sie einen
   Provider-API-Schlüssel in einer maskierten Eingabeaufforderung ein. Das geführte Onboarding
   bietet weder Crestodian noch eine Möglichkeit zum Überspringen der KI-Einrichtung an, bevor die Inferenz funktioniert.
5. Speichern Sie nur die verifizierte Modellroute und alle dafür erforderlichen Anmeldedaten-
   oder Plugin-Zustände. Die Einstellungen für Arbeitsbereich und Gateway bleiben unverändert.
6. Starten Sie Crestodian mit dem verifizierten Modell, damit es den Arbeitsbereich,
   das Gateway, Kanäle, Agenten, Plugins und die verbleibende optionale Einrichtung konfigurieren kann.

Wenn Sie den Befehl in einer konfigurierten Installation erneut ausführen, wird zuerst das aktuelle Standardmodell
getestet. Dadurch dient der geführte Ablauf als Überprüfungs- und Reparaturdurchlauf. Eine fehlgeschlagene
Prüfung ersetzt das konfigurierte Modell niemals automatisch; das Onboarding hält an und
fragt, wie fortgefahren werden soll. Führen Sie `openclaw channels add` oder `openclaw configure` für
spätere Ergänzungen aus, die nicht die Inferenz betreffen; verwenden Sie `openclaw onboard` für Änderungen am
Provider oder an der Authentifizierungsroute.

## Klassischer Assistent: Schnellstart oder Erweitert

Führen Sie `openclaw onboard --classic` aus, um den vollständigen Assistenten zu öffnen. Er beginnt mit einer
Auswahl zwischen **Schnellstart** (Standardeinstellungen) und **Erweitert** (vollständige Kontrolle). Übergeben Sie
`--flow quickstart` oder `--flow advanced` (Alias `manual`), um den klassischen
Ablauf auszuwählen und diese Abfrage zu überspringen.

<Tabs>
  <Tab title="Schnellstart (Standardeinstellungen)">
    - Lokales Gateway, Bindung an die Loopback-Adresse
    - Standardarbeitsbereich (oder vorhandener Arbeitsbereich)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung per **Token** (automatisch generiert, auch bei Loopback)
    - Werkzeugrichtlinie: `tools.profile: "coding"` für neue Einrichtungen (ein vorhandenes ausdrücklich festgelegtes Profil bleibt erhalten)
    - DM-Isolierung: `session.dmScope: "per-channel-peer"` für neue Einrichtungen. Details: [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Freigabe **Aus**
    - Telegram- und WhatsApp-DMs verwenden standardmäßig eine **Zulassungsliste**: Telegram fragt nach einer numerischen Telegram-Benutzer-ID, WhatsApp nach einer Telefonnummer

  </Tab>
  <Tab title="Erweitert (vollständige Kontrolle)">
    - Stellt jeden Schritt bereit: Modus, Arbeitsbereich, Gateway, Kanäle, Daemon, Skills

  </Tab>
</Tabs>

Der entfernte Modus (`--mode remote`) verwendet immer den erweiterten Ablauf; er
konfiguriert lediglich diesen Computer für die Verbindung mit einem anderen Gateway und installiert
oder ändert niemals etwas auf dem entfernten Host.

## Was das klassische Onboarding konfiguriert

Der lokale Modus (Standard) führt durch diese Schritte:

1. **Modell/Authentifizierung** – Wählen Sie einen Authentifizierungsablauf des Providers (API-Schlüssel, OAuth oder
   providerspezifische manuelle Authentifizierung), einschließlich eines benutzerdefinierten Providers
   (OpenAI-kompatibel, mit OpenAI Responses kompatibel, Anthropic-kompatibel oder
   automatische Erkennung als „Unbekannt“). Wählen Sie ein Standardmodell.
   Eine neue Einrichtung mit OpenAI-API-Schlüssel verwendet standardmäßig `openai/gpt-5.6` (die reine Direct-API-
   ID wird als Sol aufgelöst); eine neue ChatGPT-/Codex-Einrichtung verwendet standardmäßig
   `openai/gpt-5.6-sol`. Bei erneuter Ausführung der Einrichtung bleibt ein vorhandenes ausdrücklich festgelegtes Modell erhalten,
   einschließlich `openai/gpt-5.5`. Wählen Sie `openai/gpt-5.5` ausdrücklich aus, wenn das
   Konto GPT-5.6 nicht bereitstellt.
   Sicherheitshinweis: Wenn dieser Agent Werkzeuge ausführt oder Inhalte von Webhooks/Hooks
   verarbeitet, verwenden Sie vorzugsweise das leistungsstärkste verfügbare Modell der neuesten Generation und halten Sie
   die Werkzeugrichtlinie streng – schwächere oder ältere Modellklassen sind anfälliger für Prompt-Injection.
   Bei nicht interaktiven Ausführungen speichert `--secret-input-mode ref` umgebungsvariablenbasierte Referenzen
   anstelle von API-Schlüsselwerten im Klartext; die referenzierte Umgebungsvariable muss bereits
   gesetzt sein, andernfalls bricht das Onboarding sofort ab. Im interaktiven Referenzmodus für Geheimnisse kann
   auf eine Umgebungsvariable oder eine konfigurierte Provider-Referenz (`file` oder
   `exec`) verwiesen werden; vor dem Speichern erfolgt eine schnelle Vorabprüfung. Nach der Modell-/Authentifizierungseinrichtung
   bietet der Assistent einen optionalen Live-Test der Vervollständigung an; bei einem Fehler kann einmal zur
   Modell-/Authentifizierungseinrichtung zurückgekehrt oder der Fehler ignoriert werden, ohne den Rest des
   klassischen Assistenten zu blockieren. Das Ignorieren schaltet Crestodian nicht frei; die dialoggestützte Einrichtung
   erfordert weiterhin eine erfolgreiche Inferenzprüfung.
2. **Arbeitsbereich** – Verzeichnis für Agentendateien (Standard: `~/.openclaw/workspace`). Legt Bootstrap-Dateien an.
3. **Gateway** – Port, Bindungsadresse, Authentifizierungsmodus, Tailscale-Freigabe. Wählen Sie im
   interaktiven Token-Modus die Speicherung des Tokens im Klartext (Standard) oder
   entscheiden Sie sich für eine SecretRef. Nicht interaktiver SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** – Integrierte und offizielle Plugin-Chatkanäle, darunter
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** – Installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit
   (Linux/WSL2) oder eine native geplante Windows-Aufgabe mit einem benutzerspezifischen
   Ausweichmechanismus über den Autostartordner.
   Wenn Token-Authentifizierung erforderlich ist und `gateway.auth.token` über SecretRef verwaltet wird,
   validiert die Daemon-Installation die Referenz, speichert jedoch kein aufgelöstes Token in
   den Umgebungsmetadaten des Supervisor-Dienstes; eine nicht aufgelöste SecretRef blockiert
   die Installation und zeigt entsprechende Anweisungen an. Wenn sowohl `gateway.auth.token` als auch
   `gateway.auth.password` festgelegt sind, während `gateway.auth.mode` nicht gesetzt ist, wird die Installation
   blockiert, bis Sie den Modus ausdrücklich festlegen.
6. **Integritätsprüfung** – Startet das Gateway und überprüft, ob es erreichbar ist.
7. **Skills** – Installiert empfohlene Skills und deren optionale Abhängigkeiten.

<Note>
Bei erneuter Ausführung löscht das Onboarding **nichts**, es sei denn, Sie wählen ausdrücklich
**Zurücksetzen** (oder übergeben `--reset`). CLI-`--reset` setzt standardmäßig Konfiguration, Anmeldedaten
und Sitzungen zurück; verwenden Sie `--reset-scope full`, um auch den Arbeitsbereich zu entfernen. Wenn die
Konfiguration ungültig ist oder veraltete Schlüssel enthält, fordert das Onboarding Sie auf, zuerst
`openclaw doctor` auszuführen.
</Note>

`--flow import` führt im klassischen Assistenten anstelle einer neuen Einrichtung einen erkannten Migrationsablauf
(beispielsweise Hermes) aus; siehe [Migrieren](/de/cli/migrate) und die Migrationsanleitungen unter
[Installation](/de/install/migrating-hermes). `openclaw onboard --modern` ist ein
Kompatibilitätsalias für [Crestodian](/de/cli/crestodian). Es verwendet dieselbe
Inferenzvoraussetzung wie `openclaw crestodian`: Eine verifizierte Inferenz startet den
Assistenten, während ein interaktiver Fehler zur geführten Inferenzeinrichtung zurückführt.

## Weiteren Agenten hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agenten mit eigenem
Arbeitsbereich, eigenen Sitzungen und eigenen Authentifizierungsprofilen zu erstellen. Die Ausführung ohne `--workspace` startet
einen interaktiven Ablauf für Name, Arbeitsbereich, Authentifizierung, Kanäle und Bindungen – dies ist
nicht der vollständige Assistent von `openclaw onboard`.

Festgelegte Werte:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standardarbeitsbereich: `~/.openclaw/workspace-<agentId>` (oder unter
  `agents.defaults.workspace`, falls dieser Wert festgelegt ist).
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten an diesen Agenten weiterzuleiten (das Onboarding kann dies für Sie übernehmen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Detaillierte Informationen zum schrittweisen Verhalten und zu den Konfigurationsausgaben finden Sie in der
[Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference).
Nicht interaktive Beispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation).
Die vollständige Flag-Referenz finden Sie unter [`openclaw onboard`](/de/cli/onboard).

## Verwandte Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Ritual beim ersten Start eines Agenten: [Agenten-Bootstrapping](/de/start/bootstrapping)
