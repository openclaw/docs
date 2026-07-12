---
read_when:
    - Statusindicatoren van de Mac-app debuggen
summary: Hoe de macOS-app de status van de Gateway en kanalen rapporteert
title: Statuscontroles (macOS)
x-i18n:
    generated_at: "2026-07-12T09:04:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Statuscontroles op macOS

Zo leest u de status van gekoppelde kanalen af in de menubalk-app.

## Menubalk

Statusstip:

- Groen: gekoppeld + controle in orde.
- Oranje: gekoppeld, maar een kanaalcontrole meldt een verminderde werking/geen verbinding.
- Rood: nog niet gekoppeld.

De tweede regel luidt ‘gekoppeld · authenticatie 12 m’ of toont de reden van de fout.
‘Statuscontrole nu uitvoeren’ in het menu activeert een controle op aanvraag.

## Instellingen

- Het tabblad Algemeen toont een statuskaart: statusstip, samenvattingsregel (koppelingsstatus +
  ouderdom van authenticatie) en een optionele detailregel over de fout, met de knoppen **Nu opnieuw proberen** en
  **Logboeken openen**.
- Het **tabblad Kanalen** toont de status en bedieningselementen per kanaal (QR-code voor aanmelden,
  afmelden, controle, laatste verbrekings- of foutmelding) voor WhatsApp en Telegram.

## Zo werkt de controle

De app roept ongeveer elke 60 seconden en op aanvraag de `health`-RPC van de Gateway aan via de bestaande WebSocket-
verbinding (dus niet via een CLI-shellopdracht). De RPC laadt
aanmeldgegevens en rapporteert de status zonder berichten te verzenden. De app slaat de laatste
goede momentopname en de laatste fout afzonderlijk op, zodat de gebruikersinterface direct wordt geladen en
niet flikkert wanneer er geen verbinding is.

## Bij twijfel

Gebruik de CLI-procedure in [Gateway-status](/nl/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) en volg
`/tmp/openclaw/openclaw-*.log`, gefilterd op `web-heartbeat` / `web-reconnect`.

## Gerelateerd

- [Gateway-status](/nl/gateway/health)
- [macOS-app](/nl/platforms/macos)
