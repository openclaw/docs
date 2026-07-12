---
read_when:
    - Fehlerbehebung bei Zustandsanzeigen der Mac-App
summary: Wie die macOS-App den Status des Gateways und der Kanäle meldet
title: Systemprüfungen (macOS)
x-i18n:
    generated_at: "2026-07-12T01:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Integritätsprüfungen unter macOS

So lesen Sie den Integritätsstatus verknüpfter Kanäle in der Menüleisten-App ab.

## Menüleiste

Statuspunkt:

- Grün: verknüpft und Prüfung erfolgreich.
- Orange: verknüpft, aber eine Kanalprüfung meldet eine Beeinträchtigung oder fehlende Verbindung.
- Rot: noch nicht verknüpft.

Die zweite Zeile lautet „verknüpft · Authentifizierung vor 12 Min.“ oder zeigt den Fehlergrund an.
„Integritätsprüfung jetzt ausführen“ im Menü löst eine bedarfsgesteuerte Prüfung aus.

## Einstellungen

- Die Registerkarte „Allgemein“ zeigt eine Integritätskarte mit Statuspunkt, Zusammenfassungszeile (Verknüpfungsstatus und Alter der Authentifizierung) und einer optionalen Zeile mit Fehlerdetails sowie den Schaltflächen **Jetzt erneut versuchen** und **Protokolle öffnen**.
- Die **Registerkarte „Kanäle“** zeigt für WhatsApp und Telegram den jeweiligen Kanalstatus und Steuerelemente (QR-Code zur Anmeldung, Abmeldung, Prüfung, letzte Verbindungstrennung/letzter Fehler).

## Funktionsweise der Prüfung

Die App ruft etwa alle 60 Sekunden und bei Bedarf den RPC `health` des Gateways über ihre bestehende WebSocket-Verbindung auf (nicht durch Ausführung eines CLI-Befehls in einer Shell). Der RPC lädt die Anmeldedaten und meldet den Status, ohne Nachrichten zu senden. Die App speichert den letzten erfolgreichen Snapshot und den letzten Fehler getrennt zwischen, damit die Benutzeroberfläche sofort geladen wird und im Offlinebetrieb nicht flackert.

## Im Zweifelsfall

Verwenden Sie den CLI-Ablauf unter [Gateway-Integrität](/de/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) und verfolgen Sie `/tmp/openclaw/openclaw-*.log`, gefiltert nach `web-heartbeat` / `web-reconnect`.

## Verwandte Themen

- [Gateway-Integrität](/de/gateway/health)
- [macOS-App](/de/platforms/macos)
