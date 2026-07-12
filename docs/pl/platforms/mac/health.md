---
read_when:
    - Debugowanie wskaźników kondycji aplikacji na Maca
summary: Jak aplikacja na macOS zgłasza stany kondycji Gateway i kanałów
title: Kontrole kondycji (macOS)
x-i18n:
    generated_at: "2026-07-12T15:20:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Kontrole stanu na macOS

Jak odczytywać stan kondycji połączonego kanału w aplikacji na pasku menu.

## Pasek menu

Kropka stanu:

- Zielona: połączono + sonda działa prawidłowo.
- Pomarańczowa: połączono, ale sonda kanału zgłasza obniżoną sprawność/brak połączenia.
- Czerwona: jeszcze nie połączono.

W drugim wierszu widnieje „połączono · uwierzytelnienie 12 min” albo powód błędu.
Opcja „Uruchom kontrolę stanu teraz” w menu uruchamia sondę na żądanie.

## Ustawienia

- Karta Ogólne zawiera panel kondycji: kropkę stanu, wiersz podsumowania (stan połączenia +
  czas od uwierzytelnienia) oraz opcjonalny wiersz ze szczegółami błędu, a także przyciski **Spróbuj ponownie teraz** i
  **Otwórz dzienniki**.
- **Karta Kanały** przedstawia stan i elementy sterujące poszczególnych kanałów (kod QR
  logowania, wylogowanie, sonda, ostatnie rozłączenie/błąd) dla WhatsApp i Telegram.

## Jak działa sonda

Aplikacja wywołuje RPC `health` Gateway przez istniejące połączenie WebSocket
(a nie przez uruchomienie polecenia CLI w powłoce) co około 60 s i na żądanie. RPC wczytuje
dane uwierzytelniające i zgłasza stan bez wysyłania wiadomości. Aplikacja osobno buforuje ostatnią
prawidłową migawkę i ostatni błąd, dzięki czemu interfejs użytkownika wczytuje się natychmiast i
nie migocze w trybie offline.

## W razie wątpliwości

Użyj procedury CLI opisanej w sekcji [Kondycja Gateway](/pl/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) i śledź
`/tmp/openclaw/openclaw-*.log`, filtrując wpisy `web-heartbeat` / `web-reconnect`.

## Powiązane

- [Kondycja Gateway](/pl/gateway/health)
- [Aplikacja na macOS](/pl/platforms/macos)
