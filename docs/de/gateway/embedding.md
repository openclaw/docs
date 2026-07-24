---
read_when:
    - OpenClaw in eine Desktop- oder Serveranwendung einbetten
    - Überwachen des Gateways als untergeordneter Prozess
    - Umgang mit Gateway-Bereitschaft, Neustart, Herunterfahren oder ungültiger Konfiguration ohne Auswertung von Logs
summary: Den OpenClaw Gateway als untergeordneten Prozess aus Electron oder einer anderen Host-Anwendung überwachen
title: OpenClaw einbetten
x-i18n:
    generated_at: "2026-07-24T03:51:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca67e03994f21446bfeca58c95c2cb624dde767b9983a89982627145f80dfb90
    source_path: gateway/embedding.md
    workflow: 16
---

Ein einbettender Host sollte die installierte ausführbare Datei `openclaw` überwachen, das
Gateway-WebSocket-Protokoll als Steuerungsebene verwenden und den untergeordneten Prozess als
austauschbare Laufzeit behandeln. Dadurch bleiben Prozessverantwortung, Bereitschaft, Fehlerbehebung
und Upgrades explizit, ohne von der privaten Zustandsstruktur von OpenClaw abhängig zu sein.

Informationen zur Client-Authentifizierung und zum Wiederverbindungsstatus finden Sie unter
[Erstellen eines Gateway-Clients](https://docs.openclaw.ai/gateway/clients).

## Untergeordneten Prozess mit einer Einbettungsvoreinstellung starten

Verwenden Sie eine echte `node_modules`-Installation und starten Sie die ausführbare Datei des Pakets. Eine sinnvolle
Ausgangsbasis für einen Host, der Erkennung, Neustart und den Lebenszyklus der Kanäle verwaltet, ist:

```ts
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Geben Sie einen absoluten Pfad zu einer echten Node-Laufzeit an, die von der Hostanwendung verwaltet wird.
declare const hostNodeExecutable: string;

const packageEntry = fileURLToPath(import.meta.resolve("openclaw"));
const openclawEntry = resolve(dirname(packageEntry), "..", "openclaw.mjs");
const gateway = spawn(hostNodeExecutable, [openclawEntry, "gateway", "--allow-unconfigured"], {
  env: {
    ...process.env,
    OPENCLAW_DISABLE_BONJOUR: "1",
    OPENCLAW_EXEC_SHELL_SNAPSHOT: "0",
    OPENCLAW_NO_RESPAWN: "1",
    OPENCLAW_SKIP_CHANNELS: "1",
  },
  stdio: ["ignore", "inherit", "inherit"],
});
```

Lösen Sie OpenClaw wie gezeigt über das installierte Paket auf; gehen Sie nicht davon aus, dass eine
projektlokale `openclaw`-Binärdatei im `PATH` des Hostprozesses verfügbar ist. Das Beispiel
übernimmt die Ausgabe, damit der untergeordnete Prozess nicht durch volle stdout- oder stderr-Pipes blockiert wird. Wenn der
Host diese Streams stattdessen erfasst, schließen Sie unmittelbar nach dem Starten Verbraucher an.

| Einstellung                          | Auswirkung auf die Einbettung                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DISABLE_BONJOUR=1`     | Deaktiviert die Gateway-eigene LAN-Multicast-Ankündigung, wenn der Host die Erkennung verwaltet.                                                                                                             |
| `OPENCLAW_NO_RESPAWN=1`          | Verhindert in einem nicht verwalteten eingebetteten untergeordneten Prozess, dass OpenClaw einen Update-Neustart an einen abgekoppelten untergeordneten Prozess übergibt. Routinemäßige Neustarts verbleiben im Prozess, sodass der Host die Kontrolle über die verfolgte PID behält. |
| `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` | Deaktiviert die Erfassung eines Login-Shell-Snapshots für Host-Ausführungsbefehle.                                                                                                                              |
| `OPENCLAW_SKIP_CHANNELS=1`       | Überspringt den Start und das Neuladen von Kanälen. Legen Sie dies nur fest, wenn die einbettende App ein Gateway ausschließlich für die Steuerungsebene oder WebChat benötigt.                                                                        |

`--allow-unconfigured` umgeht ausschließlich die Startsperre `gateway.mode=local`. Es
schreibt keine Konfiguration und repariert keine ungültige Datei. Lassen Sie es weg, wenn die einbettende
App über das Onboarding, die Konfigurations-CLI oder Gateway-RPC eine normale lokale Konfiguration
bereitstellt.

### Warnung zum Electron-Shell-Snapshot

Die Shell-Snapshot-Erfassung führt `process.execPath -e <script>` aus einer Login-Shell aus. In
einem normalen Node-Prozess ist `process.execPath` die ausführbare Node-Datei. Unter Electron
ist es die Electron-Binärdatei, die den Aufruf als Anwendungsstart interpretieren
und ein Popup „Unable to find Electron app“ anzeigen kann. Legen Sie
`OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in der Umgebung des untergeordneten Gateway-Prozesses fest, nicht nur im
Renderer-Prozess. Aus demselben Grund muss `hostNodeExecutable` auf eine
echte Node-Laufzeit und nicht auf `process.execPath` von Electron verweisen.

## Ungültige Konfiguration anhand des Exitcodes behandeln

Der Gateway-Start verwendet den Exitcode `78` (`EX_CONFIG`) für konfigurationsbezogene
Startfehler, einschließlich einer ungültigen Konfiguration. Verzweigen Sie anhand des Exitcodes, statt
menschenlesbares stderr zu analysieren:

1. Führen Sie `openclaw doctor --fix --yes --non-interactive` mit derselben Konfigurations- und
   Zustandsumgebung wie der untergeordnete Gateway-Prozess aus.
2. Versuchen Sie den Gateway-Start einmal erneut, nachdem doctor erfolgreich beendet wurde.
3. Wenn der untergeordnete Prozess erneut mit `78` beendet wird, beenden Sie die Reparaturschleife und zeigen Sie dem Benutzer den
   Konfigurationsfehler an.

Behalten Sie stderr für die Diagnose bei, treffen Sie jedoch keine Entscheidungen über den Lebenszyklus anhand des Wortlauts.

Nach einem erfolgreichen Start hat eine ungültige Änderung der Live-Konfiguration weniger schwerwiegende Folgen. Der
Konfigurations-Watcher protokolliert, dass das Neuladen übersprungen wurde, und verwendet weiterhin die zuletzt akzeptierte
Konfiguration im Arbeitsspeicher. Reparieren Sie die Datei und lassen Sie den Watcher anschließend den nächsten gültigen
Snapshot übernehmen.

## Auf Protokollbereitschaft warten

Verwenden Sie WebSocket-Signale anstelle eines Teilstrings im Protokoll:

1. Öffnen Sie den Gateway-WebSocket.
2. Warten Sie auf das Ereignis `connect.challenge`. Es bestätigt, dass der Listener den
   WebSocket akzeptiert hat und der Challenge-Handshake beginnen kann.
3. Senden Sie `connect` mit der an die Challenge gebundenen Gerätesignatur.
4. Betrachten Sie `hello-ok` als Anwendungsbereitschaft für authentifiziertes RPC.

Die Challenge erfolgt bewusst vor der vollständigen Initialisierung. Falls ausstehende
Start-Sidecars noch nicht abgeschlossen sind, gibt `connect` einen wiederholbaren Fehler `UNAVAILABLE` mit
`details.reason: "startup-sidecars"` und einem begrenzten `retryAfterMs` zurück und schließt anschließend
mit dem Code `1013` und dem Grund `gateway starting`. Verwenden Sie
`resolveGatewayStartupRetryAfterMs` aus
`@openclaw/gateway-protocol/startup-unavailable` oder die integrierte Richtlinie des Referenzclients und stellen Sie dann die Verbindung erneut her.

## Neustart und Herunterfahren interpretieren

Vor einem geordneten Schließen sendet das Gateway ein Ereignis `shutdown` mit `reason`
und `restartExpectedMs`. Ein von null verschiedener Wert für `restartExpectedMs` bedeutet, dass ein prozessinterner oder
überwachter Neustart erwartet wird; `null` bedeutet ein endgültiges Herunterfahren.

Der anschließende WebSocket-Schließcode lautet in beiden Fällen `1012`. Der gewöhnliche
Client-Schließgrund lautet ebenfalls in beiden Fällen `service restart`, daher unterscheiden weder der Schließcode noch
der Grund zwischen Neustart und Herunterfahren. Bewahren Sie die vorherige `shutdown`-Nutzlast
auf, wenn sie eintrifft, und kombinieren Sie sie mit der eigenen Stoppabsicht des Hosts und dem
Exitstatus des untergeordneten Prozesses. Wenn die Verbindung ohne das Ereignis abbricht, verwenden Sie die normale
begrenzte Richtlinie für Wiederverbindungen und die Überwachung des untergeordneten Prozesses.

## RPC anstelle von Zustandsdateien verwenden

Behalten Sie das Gateway als alleinigen Eigentümer des OpenClaw-Zustands bei. Für gängige Einbettungsvorgänge
sind bereits RPC-Methoden verfügbar:

| Aufgabe                          | RPC-Methoden                                          |
| ----------------------------- | ---------------------------------------------------- |
| Sitzungskatalog und Lebenszyklus | `sessions.list`, `sessions.patch`, `sessions.delete` |
| Transkriptanzeige            | `chat.history`                                       |
| Kosten- und Nutzungsberichte        | `usage.cost`, `sessions.usage`                       |
| Status der Modellanmeldedaten       | `models.authStatus`                                  |
| Konfiguration                 | `config.get`, `config.patch`                         |

`config.get` schwärzt sensible Werte und SecretRef-Bezeichner, bevor der
Snapshot zurückgegeben wird. Schreibmethoden geben ebenfalls eine geschwärzte Konfiguration zurück. Ein Client muss den
Schwärzungsplatzhalter als undurchsichtig behandeln und den dokumentierten Vertrag zum Schreiben der Konfiguration verwenden;
er darf niemals erwarten, dass das Gateway Geheimnisse im Klartext zurückgibt.

Lesen oder verändern Sie keine Dateien, SQLite-Tabellen, Transkriptdateien oder Cache-Verzeichnisse
unter `~/.openclaw`, um App-Funktionen zu implementieren. Diese Strukturen sind private Implementierungsdetails der Laufzeit
und können ohne Protokollkompatibilität verschoben oder geändert werden.

## Installieren; nicht abflachen

Das Root-Paket `openclaw` eignet sich nicht zur Einbindung als einzelne Datei. Gebündelte Laufzeitdateien
unter `dist/extensions` behalten unveränderte Selbstimporte wie
`openclaw/plugin-sdk/*` bei, während das npm-Paket
erweiterungsspezifische `node_modules`-Verzeichnisbäume absichtlich ausschließt.

Installieren Sie OpenClaw über npm, pnpm oder eine andere normale Node-Paketinstallation, damit
Node die Paketexporte und den Abhängigkeitsbaum des Root-Pakets auflösen kann. Starten Sie die installierte
ausführbare Datei `openclaw`. Kopieren Sie nicht nur `dist`, flachen Sie das Paket nicht in einem App-
Bundle ab und binden Sie keine ausgewählten Erweiterungsdateien direkt ein.

## Verwandte Themen

- [Erstellen eines Gateway-Clients](https://docs.openclaw.ai/gateway/clients)
- [Gateway-Protokoll](https://docs.openclaw.ai/gateway/protocol)
- [Gateway-CLI](https://docs.openclaw.ai/cli/gateway)
- [Gateway-Integrationen für externe Apps](https://docs.openclaw.ai/gateway/external-apps)
