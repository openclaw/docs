---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen repo-gestützter QA-Szenarien
    - Aufbau realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: Form der privaten QA-Automatisierung für qa-lab, qa-channel, vorab befüllte Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-06T03:06:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: df35f353d5ab0e0432e6a828c82772f9a88edb41c20ec5037315b7ba310b28e6
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalnahe Weise prüfen, als es ein einzelner Unit-Test leisten kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeitung und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und grundlegende QA-
  Szenarien.

Das langfristige Ziel ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und dem Szenarioplan.

So kann ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-Mission geben, das
reale Kanalverhalten beobachten und festhalten, was funktioniert hat, fehlgeschlagen ist oder
weiterhin blockiert blieb.

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Diese liegen bewusst in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist. Die Grundliste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Abruf
- Modellwechsel
- Übergabe an Subagenten
- Lesen des Repos und der Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien sich zu ergänzen lohnen

## Verwandte Dokumentation

- [Testing](/de/help/testing)
- [QA Channel](/channels/qa-channel)
- [Dashboard](/web/dashboard)
