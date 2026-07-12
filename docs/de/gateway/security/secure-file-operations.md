---
read_when:
    - Ändern des Dateizugriffs, der Archivextraktion, des Workspace-Speichers oder der Dateisystem-Hilfsfunktionen für Plugins
summary: Wie OpenClaw den lokalen Dateizugriff sicher handhabt und warum der optionale Python-Helfer fs-safe standardmäßig deaktiviert ist
title: Sichere Dateioperationen
x-i18n:
    generated_at: "2026-07-12T15:23:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw verwendet [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) für sicherheitskritische lokale Dateioperationen: auf ein Stammverzeichnis begrenzte Lese- und Schreibvorgänge, atomare Ersetzungen, Archivextraktion, temporäre Arbeitsbereiche, JSON-Zustandsdaten und die Handhabung geheimer Dateien.

Es handelt sich um eine **Schutzvorkehrung auf Bibliotheksebene** für vertrauenswürdigen OpenClaw-Code, der nicht vertrauenswürdige Pfadnamen empfängt, nicht um eine Sandbox. Die Dateisystemberechtigungen des Hosts, Betriebssystembenutzer, Container sowie die Richtlinien für Agenten und Tools bestimmen weiterhin den tatsächlichen Schadensradius.

## Standard: kein Python-Hilfsprozess

OpenClaw setzt den POSIX-Python-Hilfsprozess von fs-safe standardmäßig auf **aus**:

- Der Gateway sollte keinen dauerhaften Python-Begleitprozess starten, sofern ein Betreiber dies nicht ausdrücklich aktiviert.
- Die meisten Installationen benötigen die zusätzliche Absicherung gegen Änderungen an übergeordneten Verzeichnissen nicht.
- Die Deaktivierung von Python sorgt für ein vorhersehbares Laufzeitverhalten in Desktop-, Docker-, CI- und gebündelten App-Umgebungen.

OpenClaw ändert nur den _Standardwert_. Eine explizite Einstellung hat immer Vorrang:

```bash
# Standardverhalten von OpenClaw: reine Node-Fallbacks von fs-safe.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Hilfsprozess verwenden, wenn verfügbar, andernfalls auf den Fallback zurückgreifen.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Sicher abbrechen, wenn der Hilfsprozess nicht gestartet werden kann.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optionaler expliziter Pfad zum Interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Die generischen Umgebungsvariablennamen von fs-safe funktionieren ebenfalls: `FS_SAFE_PYTHON_MODE` und `FS_SAFE_PYTHON`.

Verwenden Sie `require` (nicht `auto`), wenn der Hilfsprozess Bestandteil Ihres Sicherheitskonzepts ist; `auto` greift stillschweigend auf das reine Node-Verhalten zurück, wenn der Hilfsprozess nicht gestartet werden kann.

## Was ohne Python weiterhin geschützt bleibt

Wenn der Hilfsprozess deaktiviert ist, profitiert OpenClaw weiterhin von den reinen Node-Schutzvorkehrungen von fs-safe:

- Verhindert das Verlassen des zulässigen Bereichs durch relative Pfade (`..`) sowie absolute Pfade und Pfadtrennzeichen, wenn nur einfache Namen zulässig sind.
- Führt Operationen über ein vertrauenswürdiges Handle des Stammverzeichnisses aus, statt auf improvisierte Prüfungen mit `path.resolve(...).startsWith(...)` zurückzugreifen.
- Lehnt Muster mit symbolischen und festen Verknüpfungen bei APIs ab, deren Richtlinie dies erfordert.
- Öffnet Dateien mit Identitätsprüfungen, wenn die API Dateiinhalte zurückgibt oder verarbeitet.
- Schreibt Zustands- und Konfigurationsdateien über eine atomare temporäre Datei im selben Verzeichnis mit anschließender Umbenennung.
- Erzwingt Byte-Limits für Lesevorgänge und die Archivextraktion.
- Wendet private Dateimodi auf geheime Dateien und Zustandsdateien an, wenn die API dies erfordert.

Dies deckt das normale Bedrohungsmodell von OpenClaw ab: Vertrauenswürdiger Gateway-Code verarbeitet nicht vertrauenswürdige Pfadeingaben von Modellen, Plugins oder Kanälen innerhalb der Vertrauensgrenze eines einzelnen vertrauenswürdigen Betreibers.

## Was Python zusätzlich bietet

Unter POSIX hält der optionale Hilfsprozess einen dauerhaften Python-Prozess bereit und verwendet relativ zu Dateideskriptoren ausgeführte Dateisystemoperationen für Änderungen an übergeordneten Verzeichnissen: Umbenennen, Entfernen, Verzeichnisse erstellen, Status abrufen und Inhalte auflisten sowie einige Schreibpfade.

Dies verkleinert Race-Condition-Zeitfenster bei gleicher UID, in denen ein anderer Prozess zwischen der Validierung und der Änderung ein übergeordnetes Verzeichnis austauscht – eine zusätzliche Sicherheitsebene auf Hosts, auf denen nicht vertrauenswürdige lokale Prozesse dieselben Verzeichnisse ändern können, in denen OpenClaw arbeitet.

Wenn dieses Risiko in Ihrer Bereitstellung besteht und die Verfügbarkeit von Python garantiert ist, legen Sie Folgendes fest:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Hinweise für Plugins und den Kern

- Dateizugriffe von Plugins sollten über Hilfsfunktionen aus `openclaw/plugin-sdk/*` und nicht über unverarbeitetes `fs` erfolgen, wenn ein Pfad aus einer Nachricht, einer Modellausgabe, einer Konfiguration oder einer Plugin-Eingabe stammt.
- Der Kerncode sollte die fs-safe-Wrapper unter `src/infra/*` verwenden, damit die Prozessrichtlinie von OpenClaw einheitlich angewendet wird.
- Für die Archivextraktion sollten die Archiv-Hilfsfunktionen von fs-safe mit expliziten Grenzwerten für Größe, Anzahl der Einträge, Verknüpfungen und Ziel verwendet werden.
- Für Geheimnisse sollten die Geheimnis-Hilfsfunktionen von OpenClaw oder die Hilfsfunktionen von fs-safe für Geheimnisse und private Zustandsdaten verwendet werden; implementieren Sie keine eigenen Modusprüfungen rund um `fs.writeFile`.
- Verlassen Sie sich zur Isolation vor feindseligen lokalen Benutzern nicht allein auf fs-safe. Führen Sie separate Gateways unter getrennten Betriebssystembenutzern beziehungsweise auf getrennten Hosts aus oder verwenden Sie Sandboxing.

Weiterführende Informationen: [Sicherheit](/de/gateway/security), [Sandboxing](/de/gateway/sandboxing), [Ausführungsgenehmigungen](/de/tools/exec-approvals), [Geheimnisse](/de/gateway/secrets).
