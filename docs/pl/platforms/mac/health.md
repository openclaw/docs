---
read_when:
    - Debugowanie wskaźników stanu aplikacji Mac
summary: Jak aplikacja macOS raportuje stany zdrowia gateway/Baileys
title: Kontrole stanu (macOS)
x-i18n:
    generated_at: "2026-04-05T13:59:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Kontrole stanu na macOS

Jak sprawdzić w aplikacji paska menu, czy połączony kanał działa prawidłowo.

## Pasek menu

- Kropka statusu odzwierciedla teraz stan Baileys:
  - Zielona: połączono + gniazdo zostało niedawno otwarte.
  - Pomarańczowa: łączenie/ponawianie próby.
  - Czerwona: wylogowano lub sonda się nie powiodła.
- Druga linia pokazuje „linked · auth 12m” albo wyświetla przyczynę awarii.
- Pozycja menu „Run Health Check” uruchamia sondę na żądanie.

## Ustawienia

- Zakładka General zyskuje kartę Health pokazującą: wiek powiązanego auth, ścieżkę/liczbę wpisów magazynu sesji, czas ostatniego sprawdzenia, ostatni błąd/kod statusu oraz przyciski Run Health Check / Reveal Logs.
- Używa buforowanej migawki, dzięki czemu UI ładuje się natychmiast i zachowuje się płynnie po przejściu offline.
- **Zakładka Channels** pokazuje status kanału + kontrolki dla WhatsApp/Telegram (QR logowania, wylogowanie, sonda, ostatnie rozłączenie/błąd).

## Jak działa sonda

- Aplikacja uruchamia `openclaw health --json` przez `ShellExecutor` mniej więcej co 60 s oraz na żądanie. Sonda ładuje poświadczenia i raportuje stan bez wysyłania wiadomości.
- Buforuj ostatnią dobrą migawkę i ostatni błąd osobno, aby uniknąć migotania; pokazuj znacznik czasu każdego z nich.

## W razie wątpliwości

- Nadal możesz użyć przepływu CLI z [Gateway health](/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) i śledzić `/tmp/openclaw/openclaw-*.log` pod kątem `web-heartbeat` / `web-reconnect`.
