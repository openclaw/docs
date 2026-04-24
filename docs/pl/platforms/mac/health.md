---
read_when:
    - Debugowanie wskaźników health aplikacji Mac.
summary: Jak aplikacja macOS raportuje stany health gateway/Baileys
title: Health checks (macOS)
x-i18n:
    generated_at: "2026-04-24T09:20:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Health Checks na macOS

Jak sprawdzić w aplikacji paska menu, czy powiązany kanał jest zdrowy.

## Pasek menu

- Kropka statusu odzwierciedla teraz health Baileys:
  - Zielona: połączony + socket został niedawno otwarty.
  - Pomarańczowa: trwa łączenie/ponawianie.
  - Czerwona: wylogowano albo probe zakończył się błędem.
- Druga linia pokazuje „linked · auth 12m” albo wyświetla powód błędu.
- Pozycja menu „Run Health Check” uruchamia probe na żądanie.

## Ustawienia

- Karta General zyskuje kartę Health pokazującą: wiek powiązanego auth, ścieżkę/liczbę wpisów magazynu sesji, czas ostatniej kontroli, ostatni błąd/kod statusu oraz przyciski Run Health Check / Reveal Logs.
- Używa cache'owanego snapshotu, więc UI ładuje się natychmiast i działa z łagodnym fallbackiem offline.
- **Karta Channels** pokazuje status kanałów + kontrolki dla WhatsApp/Telegram (QR logowania, wylogowanie, probe, ostatnie rozłączenie/błąd).

## Jak działa probe

- Aplikacja uruchamia `openclaw health --json` przez `ShellExecutor` co około 60 s i na żądanie. Probe ładuje poświadczenia i raportuje status bez wysyłania wiadomości.
- Cache'uj osobno ostatni dobry snapshot i ostatni błąd, aby uniknąć migotania; pokazuj znacznik czasu każdego z nich.

## Gdy masz wątpliwości

- Nadal możesz używać przepływu CLI opisanego w [health Gateway](/pl/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) i śledzić `/tmp/openclaw/openclaw-*.log` pod kątem `web-heartbeat` / `web-reconnect`.

## Powiązane

- [Health Gateway](/pl/gateway/health)
- [Aplikacja macOS](/pl/platforms/macos)
