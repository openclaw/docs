---
read_when:
    - Ändern des Dateizugriffs, der Archivextraktion, der Workspace-Speicherung oder der Dateisystem-Hilfsfunktionen für Plugins
summary: Wie OpenClaw lokalen Dateizugriff sicher handhabt und warum der optionale fs-safe-Python-Helfer standardmäßig deaktiviert ist
title: Sichere Dateioperationen
x-i18n:
    generated_at: "2026-05-06T06:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw verwendet [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) für sicherheitsrelevante lokale Dateioperationen: auf ein Stammverzeichnis begrenzte Lese-/Schreibvorgänge, atomare Ersetzung, Archivextraktion, temporäre Arbeitsbereiche, JSON-Zustand und die Behandlung von Secret-Dateien.

Das Ziel ist ein konsistenter **Schutzmechanismus auf Bibliotheksebene** für vertrauenswürdigen OpenClaw-Code, der nicht vertrauenswürdige Pfadnamen erhält. Es ist keine Sandbox. Die Dateisystemberechtigungen des Hosts, Betriebssystembenutzer, Container und die Agent-/Tool-Richtlinie definieren weiterhin den tatsächlichen Auswirkungsbereich.

## Standard: kein Python-Hilfsprozess

OpenClaw setzt den fs-safe-POSIX-Python-Hilfsprozess standardmäßig auf **aus**.

Warum:

- Der Gateway sollte keinen persistenten Python-Sidecar starten, sofern ein Betreiber dies nicht ausdrücklich aktiviert hat;
- viele Installationen benötigen die zusätzliche Härtung gegen Änderungen übergeordneter Verzeichnisse nicht;
- das Deaktivieren von Python hält das Paket- und Laufzeitverhalten über Desktop-, Docker-, CI- und gebündelte App-Umgebungen hinweg besser vorhersagbar.

OpenClaw ändert nur den Standard. Wenn Sie ausdrücklich einen Modus festlegen, berücksichtigt fs-safe ihn:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Die generischen fs-safe-Namen funktionieren ebenfalls: `FS_SAFE_PYTHON_MODE` und `FS_SAFE_PYTHON`.

## Was ohne Python geschützt bleibt

Bei ausgeschaltetem Hilfsprozess verwendet OpenClaw weiterhin die Node-Pfade von fs-safe für:

- das Zurückweisen relativer Pfadausbrüche wie `..`, absoluter Pfade und Pfadtrennzeichen, wenn nur Namen erlaubt sind;
- das Auflösen von Operationen über ein vertrauenswürdiges Stamm-Handle statt über Ad-hoc-Prüfungen mit `path.resolve(...).startsWith(...)`;
- das Ablehnen von Symlink- und Hardlink-Mustern in APIs, die diese Richtlinie erfordern;
- das Öffnen von Dateien mit Identitätsprüfungen, wenn die API Dateiinhalte zurückgibt oder entgegennimmt;
- atomare Schreibvorgänge über temporäre Geschwisterdateien für Zustands-/Konfigurationsdateien;
- Byte-Limits für Lesevorgänge und Archivextraktion;
- private Modi für Secrets und Zustandsdateien, wenn die API sie erfordert.

Diese Schutzmaßnahmen decken das normale Bedrohungsmodell von OpenClaw ab: vertrauenswürdiger Gateway-Code, der nicht vertrauenswürdige Modell-/Plugin-/Kanal-Pfadeingaben innerhalb einer einzelnen vertrauenswürdigen Betreibergrenze verarbeitet.

## Was Python hinzufügt

Unter POSIX hält der optionale Hilfsprozess von fs-safe einen persistenten Python-Prozess vor und verwendet fd-relative Dateisystemoperationen für Änderungen an übergeordneten Verzeichnissen wie Umbenennen, Entfernen, Erstellen von Verzeichnissen, Stat-/List-Vorgänge und einige Schreibpfade.

Das verkleinert Race-Condition-Fenster mit derselben UID, in denen ein anderer Prozess ein übergeordnetes Verzeichnis zwischen Validierung und Änderung austauschen kann. Es ist Defense in Depth für Hosts, auf denen nicht vertrauenswürdige lokale Prozesse dieselben Verzeichnisse ändern können, in denen OpenClaw arbeitet.

Wenn Ihr Deployment dieses Risiko hat und Python garantiert vorhanden ist, verwenden Sie:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Verwenden Sie `require` statt `auto`, wenn der Hilfsprozess Teil Ihrer Sicherheitsstrategie ist; `auto` fällt absichtlich auf reines Node-Verhalten zurück, wenn der Hilfsprozess nicht verfügbar ist.

## Anleitung für Plugin und Kern

- Dateizugriff, der Plugins bereitgestellt wird, sollte über `openclaw/plugin-sdk/*`-Hilfsfunktionen erfolgen, nicht über rohes `fs`, wenn ein Pfad aus einer Nachricht, Modellausgabe, Konfiguration oder Plugin-Eingabe stammt.
- Kerncode sollte die lokalen fs-safe-Wrapper unter `src/infra/*` verwenden, damit die Prozessrichtlinie von OpenClaw konsistent angewendet wird.
- Archivextraktion sollte die fs-safe-Archivhilfsfunktionen mit expliziten Limits für Größe, Eintragsanzahl, Links und Ziel verwenden.
- Secrets sollten die Secret-Hilfsfunktionen von OpenClaw oder die fs-safe-Hilfsfunktionen für Secrets/privaten Zustand verwenden; implementieren Sie keine eigenen Modusprüfungen um `fs.writeFile` herum.
- Wenn Sie Isolation gegenüber feindlichen lokalen Benutzern benötigen, verlassen Sie sich nicht allein auf fs-safe. Führen Sie getrennte Gateways unter getrennten Betriebssystembenutzern/Hosts aus oder verwenden Sie Sandboxing.

Verwandt: [Sicherheit](/de/gateway/security), [Sandboxing](/de/gateway/sandboxing), [Exec-Genehmigungen](/de/tools/exec-approvals), [Secrets](/de/gateway/secrets).
