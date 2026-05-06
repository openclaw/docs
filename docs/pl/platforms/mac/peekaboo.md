---
read_when:
    - Hostowanie PeekabooBridge w OpenClaw.app
    - Integracja Peekaboo za pomocą Swift Package Manager
    - Zmiana protokołu/ścieżek PeekabooBridge
    - Wybór między PeekabooBridge, Codex Computer Use i cua-driver MCP
summary: Integracja PeekabooBridge z automatyzacją interfejsu użytkownika macOS
title: Most Peekaboo
x-i18n:
    generated_at: "2026-05-06T09:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw może hostować **PeekabooBridge** jako lokalnego, świadomego uprawnień brokera automatyzacji UI. Dzięki temu CLI `peekaboo` może sterować automatyzacją UI, ponownie wykorzystując uprawnienia TCC aplikacji macOS.

## Czym to jest (a czym nie jest)

- **Host**: OpenClaw.app może działać jako host PeekabooBridge.
- **Klient**: użyj CLI `peekaboo` (bez osobnej powierzchni `openclaw ui ...`).
- **UI**: wizualne nakładki pozostają w Peekaboo.app; OpenClaw jest lekkim hostem brokera.

## Relacja do Computer Use

OpenClaw ma trzy ścieżki sterowania pulpitem i celowo pozostają one oddzielne:

- **Host PeekabooBridge**: OpenClaw.app może hostować lokalny socket PeekabooBridge. CLI `peekaboo` pozostaje klientem i używa uprawnień macOS aplikacji OpenClaw.app dla prymitywów automatyzacji Peekaboo, takich jak zrzuty ekranu, kliknięcia, menu, okna dialogowe, akcje Docka i zarządzanie oknami.
- **Codex Computer Use**: dołączony Plugin `codex` przygotowuje serwer aplikacji Codex, weryfikuje, że serwer MCP `computer-use` Codex jest dostępny, a następnie pozwala Codex przejąć natywne wywołania narzędzi sterowania pulpitem podczas tur w trybie Codex. OpenClaw nie pośredniczy w tych akcjach przez PeekabooBridge.
- **Bezpośredni MCP `cua-driver`**: OpenClaw może zarejestrować nadrzędny serwer `cua-driver mcp` TryCua jako zwykły serwer MCP. Daje to agentom własne schematy sterownika CUA oraz przepływ pracy pid/okno/indeks-elementu bez routingu przez marketplace Codex ani socket PeekabooBridge.

Użyj Peekaboo, gdy chcesz mieć szeroką powierzchnię automatyzacji macOS oraz świadomy uprawnień host mostu OpenClaw.app. Użyj Codex Computer Use, gdy agent w trybie Codex powinien polegać na natywnym Plugin do computer-use Codex. Użyj bezpośredniego `cua-driver mcp`, gdy chcesz udostępnić sterownik CUA dowolnemu środowisku uruchomieniowemu zarządzanemu przez OpenClaw jako zwykły serwer MCP.

## Włącz most

W aplikacji macOS:

- Ustawienia → **Włącz Peekaboo Bridge**

Po włączeniu OpenClaw uruchamia lokalny serwer socketu UNIX. Jeśli jest wyłączony, host zostaje zatrzymany, a `peekaboo` przełączy się na inne dostępne hosty.

## Kolejność wykrywania klienta

Klienci Peekaboo zwykle próbują hostów w tej kolejności:

1. Peekaboo.app (pełny UX)
2. Claude.app (jeśli zainstalowana)
3. OpenClaw.app (lekki broker)

Użyj `peekaboo bridge status --verbose`, aby zobaczyć, który host jest aktywny i która ścieżka socketu jest używana. Możesz nadpisać to za pomocą:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bezpieczeństwo i uprawnienia

- Most weryfikuje **podpisy kodu wywołującego**; wymuszana jest lista dozwolonych TeamID (TeamID hosta Peekaboo + TeamID aplikacji OpenClaw).
- Żądania wygasają po około 10 sekundach.
- Jeśli brakuje wymaganych uprawnień, most zwraca jasny komunikat o błędzie zamiast uruchamiać Ustawienia systemowe.

## Zachowanie migawek (automatyzacja)

Migawki są przechowywane w pamięci i wygasają automatycznie po krótkim czasie. Jeśli potrzebujesz dłuższego przechowywania, przechwyć je ponownie z klienta.

## Rozwiązywanie problemów

- Jeśli `peekaboo` zgłasza „bridge client is not authorized”, upewnij się, że klient jest prawidłowo podpisany, albo uruchom host z `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` wyłącznie w trybie **debug**.
- Jeśli nie znaleziono żadnych hostów, otwórz jedną z aplikacji hosta (Peekaboo.app lub OpenClaw.app) i potwierdź, że uprawnienia zostały przyznane.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [uprawnienia macOS](/pl/platforms/mac/permissions)
