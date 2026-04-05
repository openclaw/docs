---
read_when:
    - Hostujesz PeekabooBridge w OpenClaw.app
    - Integrujesz Peekaboo przez Swift Package Manager
    - Zmieniasz protokół/ścieżki PeekabooBridge
summary: Integracja PeekabooBridge do automatyzacji UI na macOS
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T13:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (automatyzacja UI na macOS)

OpenClaw może hostować **PeekabooBridge** jako lokalny, świadomy uprawnień broker
automatyzacji UI. Dzięki temu CLI `peekaboo` może sterować automatyzacją UI, ponownie wykorzystując
uprawnienia TCC aplikacji macOS.

## Co to jest (i czym nie jest)

- **Host**: OpenClaw.app może działać jako host PeekabooBridge.
- **Client**: używaj CLI `peekaboo` (bez osobnej powierzchni `openclaw ui ...`).
- **UI**: nakładki wizualne pozostają w Peekaboo.app; OpenClaw jest cienkim hostem-brokerem.

## Włącz bridge

W aplikacji macOS:

- Settings → **Enable Peekaboo Bridge**

Po włączeniu OpenClaw uruchamia lokalny serwer gniazda UNIX. Po wyłączeniu host
jest zatrzymywany, a `peekaboo` wraca do innych dostępnych hostów.

## Kolejność discovery po stronie klienta

Klienci Peekaboo zwykle próbują hostów w tej kolejności:

1. Peekaboo.app (pełne UX)
2. Claude.app (jeśli zainstalowana)
3. OpenClaw.app (cienki broker)

Użyj `peekaboo bridge status --verbose`, aby sprawdzić, który host jest aktywny i której
ścieżki gniazda używa. Możesz to nadpisać:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bezpieczeństwo i uprawnienia

- Bridge weryfikuje **podpisy kodu wywołującego**; egzekwowana jest allowlista TeamID
  (TeamID hosta Peekaboo + TeamID aplikacji OpenClaw).
- Żądania wygasają po około 10 sekundach.
- Jeśli brakuje wymaganych uprawnień, bridge zwraca czytelny komunikat o błędzie
  zamiast otwierać System Settings.

## Zachowanie snapshotów (automatyzacja)

Snapshoty są przechowywane w pamięci i wygasają automatycznie po krótkim czasie.
Jeśli potrzebujesz dłuższego przechowywania, przechwyć je ponownie po stronie klienta.

## Rozwiązywanie problemów

- Jeśli `peekaboo` zgłasza „bridge client is not authorized”, upewnij się, że klient jest
  prawidłowo podpisany, albo uruchom host z `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  wyłącznie w trybie **debug**.
- Jeśli nie znaleziono żadnych hostów, otwórz jedną z aplikacji hosta (Peekaboo.app lub OpenClaw.app)
  i potwierdź, że uprawnienia zostały przyznane.
