---
read_when:
    - Hostowanie PeekabooBridge w OpenClaw.app.
    - Integracja Peekaboo przez Swift Package Manager.
    - Zmiana protokołu/ścieżek PeekabooBridge.
summary: Integracja PeekabooBridge do automatyzacji UI na macOS
title: Most Peekaboo
x-i18n:
    generated_at: "2026-04-24T09:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw może hostować **PeekabooBridge** jako lokalny, świadomy uprawnień broker automatyzacji UI. Dzięki temu CLI `peekaboo` może sterować automatyzacją UI, ponownie wykorzystując uprawnienia TCC aplikacji macOS.

## Czym to jest (i czym nie jest)

- **Host**: OpenClaw.app może działać jako host PeekabooBridge.
- **Klient**: używaj CLI `peekaboo` (bez osobnej powierzchni `openclaw ui ...`).
- **UI**: nakładki wizualne pozostają w Peekaboo.app; OpenClaw jest cienkim hostem brokera.

## Włącz most

W aplikacji macOS:

- Settings → **Enable Peekaboo Bridge**

Po włączeniu OpenClaw uruchamia lokalny serwer gniazda UNIX. Jeśli funkcja jest wyłączona, host
zostaje zatrzymany, a `peekaboo` użyje fallbacku do innych dostępnych hostów.

## Kolejność wykrywania klienta

Klienci Peekaboo zwykle próbują hostów w tej kolejności:

1. Peekaboo.app (pełny UX)
2. Claude.app (jeśli zainstalowana)
3. OpenClaw.app (cienki broker)

Użyj `peekaboo bridge status --verbose`, aby zobaczyć, który host jest aktywny i której
ścieżki gniazda używa. Możesz to nadpisać przez:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bezpieczeństwo i uprawnienia

- Most waliduje **sygnatury kodu wywołujących**; egzekwowana jest allowlist TeamID
  (TeamID hosta Peekaboo + TeamID aplikacji OpenClaw).
- Żądania mają timeout po około 10 sekundach.
- Jeśli brakuje wymaganych uprawnień, most zwraca czytelny komunikat błędu
  zamiast uruchamiać System Settings.

## Zachowanie snapshotów (automatyzacja)

Snapshoty są przechowywane w pamięci i automatycznie wygasają po krótkim czasie.
Jeśli potrzebujesz dłuższego przechowywania, przechwyć je ponownie po stronie klienta.

## Rozwiązywanie problemów

- Jeśli `peekaboo` zgłasza „bridge client is not authorized”, upewnij się, że klient jest
  poprawnie podpisany albo uruchom host z `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  tylko w trybie **debug**.
- Jeśli nie znaleziono żadnych hostów, otwórz jedną z aplikacji hosta (Peekaboo.app albo OpenClaw.app)
  i potwierdź, że uprawnienia zostały przyznane.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
