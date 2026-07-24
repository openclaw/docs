---
read_when:
    - Ändern von Dateizugriff, Archivextraktion, Workspace-Speicherung oder Plugin-Dateisystemhilfen
summary: Wie OpenClaw den lokalen Dateizugriff sicher handhabt und warum der optionale Python-Helfer fs-safe standardmäßig deaktiviert ist
title: Sichere Dateioperationen
x-i18n:
    generated_at: "2026-07-24T04:27:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw verwendet [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) für sicherheitskritische lokale Dateioperationen: auf ein Stammverzeichnis beschränkte Lese-/Schreibvorgänge, atomare Ersetzung, Archivextraktion, temporäre Arbeitsbereiche, JSON-Zustand und die Handhabung von Geheimnisdateien.

Es handelt sich um eine **Schutzvorkehrung auf Bibliotheksebene** für vertrauenswürdigen OpenClaw-Code, der nicht vertrauenswürdige Pfadnamen empfängt, nicht um eine Sandbox. Die Berechtigungen des Hostdateisystems, Betriebssystembenutzer, Container sowie die Richtlinien für Agenten und Tools bestimmen weiterhin den tatsächlichen potenziellen Schadensumfang.

## Standard: keine Python-Hilfskomponente

OpenClaw deaktiviert die POSIX-Python-Hilfskomponente von fs-safe standardmäßig:

- Der Gateway sollte keinen persistenten Python-Sidecar-Prozess starten, sofern sich ein Operator nicht ausdrücklich dafür entscheidet;
- die meisten Installationen benötigen die zusätzliche Absicherung gegen Änderungen übergeordneter Verzeichnisse nicht;
- die Deaktivierung von Python sorgt für vorhersehbares Laufzeitverhalten in Desktop-, Docker-, CI- und gebündelten App-Umgebungen.

OpenClaw ändert nur den _Standardwert_. Eine explizite Einstellung hat immer Vorrang:

```bash
# Standardverhalten von OpenClaw: reine Node-Fallbacks von fs-safe.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Hilfskomponente verwenden, wenn sie verfügbar ist, andernfalls auf den Fallback zurückgreifen.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Sicher abbrechen, wenn die Hilfskomponente nicht gestartet werden kann.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optionaler expliziter Pfad zum Interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Die generischen Umgebungsvariablennamen von fs-safe funktionieren ebenfalls: `FS_SAFE_PYTHON_MODE` und `FS_SAFE_PYTHON`.

Verwenden Sie `require` (nicht `auto`), wenn die Hilfskomponente Teil Ihres Sicherheitskonzepts ist; `auto` greift unbemerkt auf reines Node-Verhalten zurück, wenn die Hilfskomponente nicht gestartet werden kann.

## Was ohne Python weiterhin geschützt bleibt

Bei deaktivierter Hilfskomponente erhält OpenClaw weiterhin die reinen Node-Schutzvorkehrungen von fs-safe:

- weist Ausbrüche aus relativen Pfaden (`..`), absolute Pfade und Pfadtrennzeichen zurück, wenn nur einfache Namen zulässig sind;
- führt Operationen über ein vertrauenswürdiges Stammverzeichnis-Handle aus statt über improvisierte `path.resolve(...).startsWith(...)`-Prüfungen;
- verweigert Symlink- und Hardlink-Muster bei APIs, die diese Richtlinie erfordern;
- öffnet Dateien mit Identitätsprüfungen, wenn die API Dateiinhalte zurückgibt oder verarbeitet;
- schreibt Zustands-/Konfigurationsdateien über eine atomare temporäre Datei im selben Verzeichnis und anschließendes Umbenennen;
- setzt Bytegrenzen für Lesevorgänge und die Archivextraktion durch;
- wendet private Dateimodi auf Geheimnisse und Zustandsdateien an, wenn die API diese erfordert.

Dies deckt das normale Bedrohungsmodell von OpenClaw ab: Vertrauenswürdiger Gateway-Code verarbeitet nicht vertrauenswürdige Pfadeingaben von Modellen, Plugins und Kanälen innerhalb einer einzigen vertrauenswürdigen Operatorgrenze.

## Was Python hinzufügt

Unter POSIX unterhält die optionale Hilfskomponente einen persistenten Python-Prozess und verwendet auf Dateideskriptoren bezogene Dateisystemoperationen für Änderungen an übergeordneten Verzeichnissen: Umbenennen, Entfernen, Erstellen von Verzeichnissen, Statusabfrage/Auflistung und einige Schreibpfade.

Dies verkleinert Race-Condition-Zeitfenster unter derselben UID, in denen ein anderer Prozess zwischen Validierung und Änderung ein übergeordnetes Verzeichnis austauscht — als mehrstufige Absicherung auf Hosts, auf denen nicht vertrauenswürdige lokale Prozesse dieselben Verzeichnisse ändern können, in denen OpenClaw arbeitet.

Wenn dieses Risiko in Ihrer Bereitstellung besteht und die Verfügbarkeit von Python gewährleistet ist, legen Sie Folgendes fest:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Hinweise für Plugins und Core

- Der Dateizugriff für Plugins sollte über die Hilfsfunktionen von `openclaw/plugin-sdk/*` und nicht direkt über `fs` erfolgen, wenn ein Pfad aus einer Nachricht, einer Modellausgabe, einer Konfiguration oder einer Plugin-Eingabe stammt.
- Core-Code sollte die fs-safe-Wrapper unter `src/infra/*` verwenden, damit die Prozessrichtlinie von OpenClaw einheitlich angewendet wird.
- Für die Archivextraktion sollten die fs-safe-Archivhilfsfunktionen mit expliziten Grenzwerten für Größe, Eintragsanzahl, Links und Ziel verwendet werden.
- Für Geheimnisse sollten die Geheimnishilfsfunktionen von OpenClaw oder die fs-safe-Hilfsfunktionen für Geheimnisse/private Zustände verwendet werden; implementieren Sie keine eigenen Modusprüfungen rund um `fs.writeFile`.
- Verlassen Sie sich zur Isolation gegenüber böswilligen lokalen Benutzern nicht allein auf fs-safe. Führen Sie separate Gateways unter separaten Betriebssystembenutzern/Hosts aus oder verwenden Sie Sandboxing.

Verwandte Themen: [Sicherheit](/de/gateway/security), [Sandboxing](/de/gateway/sandboxing), [Ausführungsgenehmigungen](/de/tools/exec-approvals), [Geheimnisse](/de/gateway/secrets).
