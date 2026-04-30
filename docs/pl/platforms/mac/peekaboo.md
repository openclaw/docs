---
read_when:
    - Hostowanie PeekabooBridge w OpenClaw.app
    - Integracja Peekaboo za pomocą Swift Package Manager
    - Zmiana protokołu/ścieżek PeekabooBridge
    - Wybór między PeekabooBridge, Codex Computer Use i cua-driver MCP
summary: Integracja PeekabooBridge do automatyzacji interfejsu użytkownika w macOS
title: Mostek a kuku
x-i18n:
    generated_at: "2026-04-30T10:05:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw może hostować **PeekabooBridge** jako lokalnego, świadomego uprawnień brokera automatyzacji interfejsu użytkownika. Pozwala to CLI `peekaboo` sterować automatyzacją interfejsu użytkownika, ponownie wykorzystując uprawnienia TCC aplikacji macOS.

## Czym to jest (i czym nie jest)

- **Host**: OpenClaw.app może działać jako host PeekabooBridge.
- **Klient**: użyj CLI `peekaboo` (bez osobnej powierzchni `openclaw ui ...`).
- **Interfejs użytkownika**: wizualne nakładki pozostają w Peekaboo.app; OpenClaw jest lekkim hostem brokera.

## Relacja do Computer Use

OpenClaw ma trzy ścieżki sterowania pulpitem i celowo pozostają one oddzielne:

- **Host PeekabooBridge**: OpenClaw.app może hostować lokalny socket PeekabooBridge. CLI `peekaboo` pozostaje klientem i używa uprawnień macOS aplikacji OpenClaw.app dla prymitywów automatyzacji Peekaboo, takich jak zrzuty ekranu, kliknięcia, menu, okna dialogowe, działania Docka i zarządzanie oknami.
- **Codex Computer Use**: dołączony Plugin `codex` przygotowuje serwer aplikacji Codex, weryfikuje dostępność serwera MCP `computer-use` Codex, a następnie pozwala Codex przejąć natywne wywołania narzędzi sterowania pulpitem podczas tur w trybie Codex. OpenClaw nie pośredniczy w tych działaniach przez PeekabooBridge.
- **Bezpośredni MCP `cua-driver`**: OpenClaw może zarejestrować upstreamowy serwer `cua-driver mcp` TryCua jako zwykły serwer MCP. Daje to agentom własne schematy sterownika CUA oraz przepływ pracy oparty na pid/oknie/indeksie elementu, bez trasowania przez marketplace Codex ani socket PeekabooBridge.

Użyj Peekaboo, gdy chcesz mieć szeroką powierzchnię automatyzacji macOS oraz świadomy uprawnień host mostu OpenClaw.app. Użyj Codex Computer Use, gdy agent w trybie Codex powinien polegać na natywnym Plugin użycia komputera Codex. Użyj bezpośredniego `cua-driver mcp`, gdy chcesz udostępnić sterownik CUA dowolnemu środowisku uruchomieniowemu zarządzanemu przez OpenClaw jako zwykły serwer MCP.

## Włącz most

W aplikacji macOS:

- Ustawienia → **Włącz Peekaboo Bridge**

Po włączeniu OpenClaw uruchamia lokalny serwer socketu UNIX. Po wyłączeniu host zostaje zatrzymany, a `peekaboo` przełączy się na inne dostępne hosty.

## Kolejność wykrywania klientów

Klienci Peekaboo zwykle próbują hostów w tej kolejności:

1. Peekaboo.app (pełny UX)
2. Claude.app (jeśli zainstalowana)
3. OpenClaw.app (lekki broker)

Użyj `peekaboo bridge status --verbose`, aby sprawdzić, który host jest aktywny i która ścieżka socketu jest używana. Możesz nadpisać to ustawienie za pomocą:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bezpieczeństwo i uprawnienia

- Most weryfikuje **podpisy kodu wywołującego**; egzekwowana jest lista dozwolonych TeamID (TeamID hosta Peekaboo + TeamID aplikacji OpenClaw).
- Żądania wygasają po około 10 sekundach.
- Jeśli brakuje wymaganych uprawnień, most zwraca jasny komunikat o błędzie zamiast uruchamiać Ustawienia systemowe.

## Zachowanie migawek (automatyzacja)

Migawki są przechowywane w pamięci i automatycznie wygasają po krótkim czasie. Jeśli potrzebujesz dłuższego przechowywania, przechwyć je ponownie z klienta.

## Rozwiązywanie problemów

- Jeśli `peekaboo` zgłasza „bridge client is not authorized”, upewnij się, że klient jest poprawnie podpisany, albo uruchom hosta z `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` tylko w trybie **debugowania**.
- Jeśli nie znaleziono żadnych hostów, otwórz jedną z aplikacji hosta (Peekaboo.app lub OpenClaw.app) i potwierdź, że uprawnienia zostały przyznane.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [uprawnienia macOS](/pl/platforms/mac/permissions)
