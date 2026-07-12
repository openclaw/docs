---
read_when:
    - Fehlerbehebung bei Zustandsanzeigen der Mac-App
summary: Wie die macOS-App den Integritätsstatus von Gateway und Kanälen meldet
title: Systemdiagnosen (macOS)
x-i18n:
    generated_at: "2026-07-12T15:30:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Integritätsprüfungen unter macOS

So lesen Sie den Integritätsstatus des verknüpften Kanals in der Menüleisten-App ab.

## Menüleiste

Statuspunkt:

- Grün: verknüpft + Prüfung erfolgreich.
- Orange: verknüpft, aber eine Kanalprüfung meldet eine Beeinträchtigung/keine Verbindung.
- Rot: noch nicht verknüpft.

Die zweite Zeile lautet „verknüpft · Authentifizierung 12 Min.“ oder zeigt den Fehlergrund an.
„Integritätsprüfung jetzt ausführen“ im Menü löst eine Prüfung bei Bedarf aus.

## Einstellungen

- Die Registerkarte „Allgemein“ zeigt eine Integritätskarte: Statuspunkt, Zusammenfassungszeile (Verknüpfungsstatus +
  Alter der Authentifizierung) und eine optionale Zeile mit Fehlerdetails sowie die Schaltflächen **Jetzt erneut versuchen** und
  **Protokolle öffnen**.
- Die **Registerkarte „Kanäle“** zeigt für WhatsApp und Telegram den Status und die Steuerelemente der einzelnen Kanäle (QR-Code zur Anmeldung,
  Abmeldung, Prüfung, letzte Trennung/letzter Fehler).

## Funktionsweise der Prüfung

Die App ruft etwa alle 60 Sekunden und bei Bedarf über ihre bestehende WebSocket-
Verbindung (nicht durch Aufruf einer CLI-Shell) den `health`-RPC des Gateways auf. Der RPC lädt
die Anmeldedaten und meldet den Status, ohne Nachrichten zu senden. Die App speichert den letzten
erfolgreichen Snapshot und den letzten Fehler getrennt im Cache, damit die Benutzeroberfläche sofort geladen wird und
im Offlinebetrieb nicht flackert.

## Im Zweifelsfall

Verwenden Sie den CLI-Ablauf unter [Gateway-Integrität](/de/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) und verfolgen Sie
`/tmp/openclaw/openclaw-*.log`, gefiltert nach `web-heartbeat` / `web-reconnect`.

## Verwandte Themen

- [Gateway-Integrität](/de/gateway/health)
- [macOS-App](/de/platforms/macos)
