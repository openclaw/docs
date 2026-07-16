---
read_when:
    - CLI-Onboarding ausführen oder konfigurieren
    - Einrichten eines neuen Rechners
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI-Onboarding: Inferenz verifizieren, dann die verbleibende Einrichtung an OpenClaw übergeben'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-07-16T13:18:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Das CLI-Onboarding ist der empfohlene Einrichtungsweg im Terminal unter macOS, Linux und
Windows (nativ oder WSL2). Standardmäßig erkennt es den bereits auf dem
Rechner verfügbaren KI-Zugriff, überprüft ihn mit einer echten Vervollständigung und startet OpenClaw, um
den Arbeitsbereich, das Gateway und optionale Funktionen zu konfigurieren. `openclaw setup` führt denselben Ablauf aus ([Einrichtung](/de/cli/setup) behandelt
die reine Konfigurationsvariante `--baseline`). Benutzer der Windows-Desktopanwendung können auch
über den [Windows Hub](/de/platforms/windows) beginnen.

Das geführte Onboarding richtet zuerst die Inferenz ein. Es erkennt verfügbaren KI-Zugriff,
erfordert eine echte Vervollständigung und startet erst dann [OpenClaw](/cli/openclaw),
um den Rest von OpenClaw zu konfigurieren. Wenn Sie **Vorerst überspringen** auswählen, wird das Onboarding
beendet, ohne OpenClaw zu starten.

Der klassische Assistent bleibt für benutzerdefinierte Provider, die Einrichtung eines entfernten Gateways,
die Kanalkopplung, Daemon-Steuerung, Skills und Importe verfügbar. Starten Sie ihn ausdrücklich
mit `openclaw onboard --classic`; die geführte Inferenz-Auswahl delegiert
nicht an ihn. Nachdem die Inferenzprüfung bestanden wurde, kann OpenClaw mit `open channel wizard for
<channel>` die Einrichtung von Kanälen, die Geheimnisse erfordert, an einen maskierten Terminalassistenten übergeben.
Um den Modell-Provider oder dessen Authentifizierung zu ändern, beenden Sie OpenClaw und führen Sie
`openclaw onboard` aus; OpenClaw öffnet keine geführten oder klassischen Provider-Abläufe.

<Info>
Schnellster erster Chat: Schließen Sie die geführte Einrichtung ab, führen Sie `openclaw dashboard` aus und chatten Sie
im Browser über die Control UI. Dokumentation: [Dashboard](/de/web/dashboard).
</Info>

## Gebietsschema

Der Assistent lokalisiert fest vorgegebene Onboarding-Texte. Auflösungsreihenfolge: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, anschließend Englisch. Unterstützte Gebietsschemas: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Produktnamen, Befehle, Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs sowie
Plugin-/Kanalbezeichnungen bleiben unabhängig vom Gebietsschema auf Englisch.

So konfigurieren Sie Einstellungen, die nicht die Inferenz betreffen, später neu:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` bedeutet nicht, dass der nicht interaktive Modus verwendet wird. Verwenden Sie für Skripte `--non-interactive` (siehe [CLI-Automatisierung](/de/start/wizard-cli-automation)).
</Note>

<Tip>
Der klassische Assistent enthält einen Schritt zur Websuche, in dem Sie einen Provider auswählen können: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG oder Tavily. Einige benötigen einen API-Schlüssel, andere
kommen ohne Schlüssel aus. Konfigurieren Sie dies später mit `openclaw configure --section web`. Dokumentation:
[Webtools](/de/tools/web).
</Tip>

## Geführter Standardablauf

Ein einfacher Aufruf von `openclaw onboard` folgt diesem Ablauf:

1. Akzeptieren Sie den Sicherheitshinweis.
2. Erkennen Sie konfigurierte Modelle, Umgebungsvariablen für API-Schlüssel, unterstützte lokale KI-
   CLIs und bereits installierte werkzeugfähige Modelle von erreichbaren Ollama- oder LM-
   Studio-Servern auf dem Gateway-Host. Dieser schreibgeschützte Durchlauf lädt niemals ein
   Modell herunter. Installationen von Gemini CLI und Antigravity werden gemeldet, aber nicht automatisch getestet,
   da sie keine werkzeugfreie Prüfung erzwingen können.
3. Testen Sie den ersten erkannten Kandidaten mit einer echten Vervollständigung. Zeigen Sie bei einem Fehler den
   Grund an und fahren Sie mit dem nächsten verwendbaren Kandidaten fort.
4. Wenn die Erkennung keine weiteren Ergebnisse liefert, wählen Sie OpenAI, Anthropic, xAI (Grok), Google oder
   OpenRouter aus oder wählen Sie **Mehr…** für die übrigen Provider. Die
   Regionen, Tarife und unterstützten Browser-, Geräte-, API-Schlüssel- oder Token-Methoden jedes Providers
   erscheinen in einem zweiten Menü und werden mit derselben echten Vervollständigung getestet.
   Wählen Sie **Vorerst überspringen**, um den Vorgang zu beenden, ohne OpenClaw zu starten.
5. Speichern Sie nur die verifizierte Modellroute und alle dafür erforderlichen Anmeldedaten-/Plugin-Zustände.
   Die Einstellungen für Arbeitsbereich und Gateway bleiben unverändert.
6. Starten Sie OpenClaw mit dem verifizierten Modell, damit es den Arbeitsbereich,
   das Gateway, Kanäle, Agenten, Plugins und die verbleibende optionale Einrichtung konfigurieren kann.

Wenn Sie den Befehl in einer konfigurierten Installation erneut ausführen, wird zuerst das aktuelle Standardmodell
getestet, wodurch der geführte Ablauf als Überprüfungs- und Reparaturdurchlauf dient. Eine fehlgeschlagene
Prüfung ersetzt das konfigurierte Modell niemals automatisch; das Onboarding wird angehalten und
fragt, wie fortgefahren werden soll. Führen Sie `openclaw channels add` oder `openclaw configure` für
spätere Ergänzungen außerhalb der Inferenz aus; verwenden Sie `openclaw onboard` für Änderungen an
Provider- oder Authentifizierungsrouten.

## Klassischer Assistent: Schnellstart oder Erweitert

Führen Sie `openclaw onboard --classic` aus, um den vollständigen Assistenten zu öffnen. Er beginnt mit einer
Auswahl zwischen **Schnellstart** (Standardwerte) und **Erweitert** (vollständige Kontrolle). Übergeben Sie
`--flow quickstart` oder `--flow advanced` (Alias `manual`), um den klassischen
Ablauf auszuwählen und diese Abfrage zu überspringen.

<Tabs>
  <Tab title="Schnellstart (Standardwerte)">
    - Lokales Gateway, Bindung an die Loopback-Adresse
    - Standardarbeitsbereich (oder vorhandener Arbeitsbereich)
    - Gateway-Port **18789**
    - Gateway-Authentifizierung **Token** (automatisch generiert, auch bei Loopback)
    - Werkzeugrichtlinie: `tools.profile: "coding"` für neue Einrichtungen (ein vorhandenes explizites Profil bleibt erhalten)
    - DM-Isolierung: `session.dmScope: "per-channel-peer"` für neue Einrichtungen. Details: [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale-Bereitstellung **Aus**
    - DMs von Telegram und WhatsApp verwenden standardmäßig eine **Zulassungsliste**: Telegram fragt nach einer numerischen Telegram-Benutzer-ID, WhatsApp nach einer Telefonnummer

  </Tab>
  <Tab title="Erweitert (vollständige Kontrolle)">
    - Zeigt jeden Schritt an: Modus, Arbeitsbereich, Gateway, Kanäle, Daemon, Skills

  </Tab>
</Tabs>

Der Remote-Modus (`--mode remote`) verwendet immer den erweiterten Ablauf; er
konfiguriert diesen Rechner lediglich für die Verbindung mit einem anderen Gateway und installiert
oder ändert niemals etwas auf dem entfernten Host.

## Was das klassische Onboarding konfiguriert

Der lokale Modus (Standard) führt durch diese Schritte:

1. **Modell/Authentifizierung** – Wählen Sie einen Authentifizierungsablauf des Providers (API-Schlüssel, OAuth oder
   eine providerspezifische manuelle Authentifizierung), einschließlich eines benutzerdefinierten Providers
   (OpenAI-kompatibel, mit OpenAI Responses kompatibel, Anthropic-kompatibel oder
   automatische Erkennung bei unbekanntem Typ). Wählen Sie ein Standardmodell aus.
   Eine neue Einrichtung mit OpenAI-API-Schlüssel verwendet standardmäßig `openai/gpt-5.6` (die reine Direct-API-
   ID wird zu Sol aufgelöst); eine neue ChatGPT-/Codex-Einrichtung verwendet standardmäßig
   `openai/gpt-5.6-sol`. Bei einer erneuten Ausführung der Einrichtung bleibt ein vorhandenes explizites Modell
   einschließlich `openai/gpt-5.5` erhalten. Wählen Sie `openai/gpt-5.5` ausdrücklich aus, wenn das
   Konto GPT-5.6 nicht bereitstellt.
   Sicherheitshinweis: Wenn dieser Agent Werkzeuge ausführt oder Webhook-/Hook-
   Inhalte verarbeitet, verwenden Sie vorzugsweise das stärkste verfügbare Modell der neuesten Generation und halten Sie
   die Werkzeugrichtlinie streng – schwächere oder ältere Stufen sind anfälliger für Prompt-Injection.
   Bei nicht interaktiven Ausführungen speichert `--secret-input-mode ref` umgebungsvariablenbasierte Referenzen
   anstelle von API-Schlüsselwerten im Klartext; die referenzierte Umgebungsvariable muss bereits
   gesetzt sein, andernfalls schlägt das Onboarding sofort fehl. Im interaktiven Modus für Geheimnisreferenzen kann
   auf eine Umgebungsvariable oder eine konfigurierte Provider-Referenz verwiesen werden (`file` oder
   `exec`); vor dem Speichern erfolgt eine schnelle Vorabprüfung. Nach der Modell-/Authentifizierungseinrichtung
   bietet der Assistent einen optionalen Live-Vervollständigungstest an; bei einem Fehler kann einmal zur
   Modell-/Authentifizierungseinrichtung zurückgekehrt oder der Fehler ignoriert werden, ohne den restlichen
   klassischen Assistenten zu blockieren. Durch das Ignorieren wird OpenClaw nicht freigeschaltet; die dialogbasierte Einrichtung
   erfordert weiterhin eine bestandene Inferenzprüfung.
2. **Arbeitsbereich** – Verzeichnis für Agentendateien (Standard: `~/.openclaw/workspace`). Erstellt Bootstrap-Dateien.
3. **Gateway** – Port, Bindungsadresse, Authentifizierungsmodus, Tailscale-Bereitstellung. Im
   interaktiven Token-Modus können Sie die Speicherung des Tokens im Klartext (Standard) wählen oder
   eine SecretRef verwenden. Nicht interaktiver SecretRef-Pfad: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanäle** – integrierte Chatkanäle und offizielle Plugin-Chatkanäle, darunter
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
5. **Daemon** – installiert einen LaunchAgent (macOS), eine systemd-Benutzereinheit
   (Linux/WSL2) oder eine native geplante Windows-Aufgabe mit einem benutzerspezifischen
   Fallback über den Autostartordner.
   Wenn Token-Authentifizierung erforderlich ist und `gateway.auth.token` über SecretRef verwaltet wird,
   validiert die Daemon-Installation die Referenz, speichert jedoch kein aufgelöstes Token dauerhaft in
   den Umgebungsmetadaten des Supervisor-Dienstes; eine nicht auflösbare SecretRef blockiert
   die Installation und zeigt entsprechende Anweisungen an. Wenn sowohl `gateway.auth.token` als auch
   `gateway.auth.password` gesetzt sind, während `gateway.auth.mode` nicht gesetzt ist, wird die Installation
   blockiert, bis Sie den Modus ausdrücklich festlegen.
6. **Funktionsprüfung** – startet das Gateway und überprüft dessen Erreichbarkeit.
7. **Skills** – installiert empfohlene Skills und deren optionale Abhängigkeiten.

<Note>
Bei einer erneuten Ausführung des Onboardings wird **nichts** gelöscht, sofern Sie nicht ausdrücklich
**Zurücksetzen** auswählen (oder `--reset` übergeben). Der CLI-Aufruf `--reset` betrifft standardmäßig Konfiguration, Anmeldedaten
und Sitzungen; verwenden Sie `--reset-scope full`, um zusätzlich den Arbeitsbereich zu entfernen. Wenn die
Konfiguration ungültig ist oder veraltete Schlüssel enthält, fordert das Onboarding Sie auf, zuerst
`openclaw doctor` auszuführen.
</Note>

`--flow import` führt im klassischen Assistenten einen erkannten Migrationsablauf (beispielsweise für Hermes)
anstelle einer neuen Einrichtung aus; siehe [Migrieren](/de/cli/migrate) und die Migrationsanleitungen unter
[Installation](/de/install/migrating-hermes). `openclaw onboard --modern` ist ein
Kompatibilitätsalias für [OpenClaw](/cli/openclaw). Er verwendet dieselbe
Inferenzprüfung wie `openclaw setup`: Eine verifizierte Inferenz startet den
Assistenten, während ein interaktiver Fehler zur geführten Inferenzeinrichtung zurückführt.

## Weiteren Agenten hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agenten mit eigenem
Arbeitsbereich sowie eigenen Sitzungen und Authentifizierungsprofilen zu erstellen. Eine Ausführung ohne `--workspace` startet
einen interaktiven Ablauf für Name, Arbeitsbereich, Authentifizierung, Kanäle und Bindungen – dies ist
nicht der vollständige Assistent `openclaw onboard`.

Festgelegte Werte:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standardarbeitsbereich: `~/.openclaw/workspace-<agentId>` (oder unter
  `agents.defaults.workspace`, falls dies festgelegt ist).
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten an diesen Agenten weiterzuleiten (das Onboarding kann dies für Sie übernehmen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Vollständige Referenz

Ausführliche Informationen zum schrittweisen Verhalten und zu den Konfigurationsausgaben finden Sie in der
[Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference).
Nicht interaktive Beispiele finden Sie unter [CLI-Automatisierung](/de/start/wizard-cli-automation).
Die vollständige Flag-Referenz finden Sie unter [`openclaw onboard`](/de/cli/onboard).

## Verwandte Dokumentation

- CLI-Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
- Onboarding-Übersicht: [Onboarding-Übersicht](/de/start/onboarding-overview)
- Onboarding der macOS-App: [Onboarding](/de/start/onboarding)
- Erststartritual des Agenten: [Agent-Bootstrapping](/de/start/bootstrapping)
