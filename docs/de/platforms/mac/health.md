---
read_when:
    - Fehlerbehebung bei Zustandsindikatoren der Mac-App
summary: Wie die macOS-App den Zustand von Gateway und Kanälen meldet
title: Systemprüfungen (macOS)
x-i18n:
    generated_at: "2026-07-24T03:57:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 095abdbefa7db7c0d14435e2c5db7d1ebc03afa0c539555a7abdd9170d015fb8
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

Die zweite Zeile zeigt „verknüpft · Authentifizierung vor 12 Min.“ oder den Fehlergrund an.
„Run Health Check Now“ im Menü löst eine bedarfsgesteuerte Prüfung aus.

## Einstellungen

- Die Registerkarte „Allgemein“ zeigt eine Integritätskarte: Statuspunkt, Zusammenfassungszeile (Verknüpfungsstatus +
  Alter der Authentifizierung) und eine optionale Zeile mit Fehlerdetails sowie die Schaltflächen **Jetzt erneut versuchen** und
  **Protokolle öffnen**.
- Die **Registerkarte „Kanäle“** zeigt den Status und die Steuerelemente pro Kanal (QR-Code für die Anmeldung,
  Abmeldung, Prüfung, letzte Trennung/letzter Fehler) für WhatsApp und Telegram an.

## Funktionsweise der Prüfung

Die App ruft alle ~60 s und bei Bedarf den `health`-RPC des Gateways über ihre bestehende WebSocket-
Verbindung auf (nicht über einen CLI-Shell-Aufruf). Der RPC lädt
Anmeldedaten und meldet den Status, ohne Nachrichten zu senden. Die App speichert den letzten
erfolgreichen Snapshot und den letzten Fehler separat zwischen, damit die Benutzeroberfläche sofort geladen wird und
im Offlinebetrieb nicht flackert.

## Im Zweifelsfall

Verwenden Sie den CLI-Ablauf unter [Gateway-Integrität](/de/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) und führen Sie
`openclaw logs --follow` aus, gefiltert nach `web-heartbeat` / `web-reconnect`.

## Verwandte Themen

- [Gateway-Integrität](/de/gateway/health)
- [macOS-App](/de/platforms/macos)
