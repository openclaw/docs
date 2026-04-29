---
read_when:
    - Gezondheidsindicatoren van de Mac-app debuggen
summary: Hoe de macOS-app Gateway-/Baileys-gezondheidsstatussen rapporteert
title: Gezondheidscontroles (macOS)
x-i18n:
    generated_at: "2026-04-29T22:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 16
---

# Gezondheidscontroles op macOS

Hoe je vanuit de menubalk-app ziet of het gekoppelde kanaal gezond is.

## Menubalk

- Statuspunt geeft nu de gezondheid van Baileys weer:
  - Groen: gekoppeld + socket onlangs geopend.
  - Oranje: verbinden/opnieuw proberen.
  - Rood: uitgelogd of controle mislukt.
- Secundaire regel toont "gekoppeld · verificatie 12m" of toont de reden van de fout.
- Menu-item "Gezondheidscontrole uitvoeren" start een controle op aanvraag.

## Instellingen

- Het tabblad Algemeen krijgt een gezondheidskaart met: leeftijd van gekoppelde verificatie, pad/aantal van de sessieopslag, tijd van laatste controle, laatste fout/statuscode en knoppen voor Gezondheidscontrole uitvoeren / Logs weergeven.
- Gebruikt een gecachte momentopname zodat de UI direct laadt en netjes terugvalt wanneer offline.
- **Tabblad Kanalen** toont kanaalstatus + bediening voor WhatsApp/Telegram (inlog-QR, uitloggen, controle, laatste verbroken verbinding/fout).

## Hoe de controle werkt

- App voert elke ~60s en op aanvraag `openclaw health --json` uit via `ShellExecutor`. De controle laadt inloggegevens en rapporteert de status zonder berichten te verzenden.
- Cache de laatste goede momentopname en de laatste fout apart om flikkering te voorkomen; toon de tijdstempel van elk.

## Bij twijfel

- Je kunt nog steeds de CLI-flow in [Gateway-gezondheid](/nl/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) gebruiken en `/tmp/openclaw/openclaw-*.log` volgen voor `web-heartbeat` / `web-reconnect`.

## Gerelateerd

- [Gateway-gezondheid](/nl/gateway/health)
- [macOS-app](/nl/platforms/macos)
