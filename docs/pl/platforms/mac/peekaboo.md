---
read_when:
    - Hostowanie PeekabooBridge w OpenClaw.app
    - Integracja Peekaboo za pomocą Swift Package Manager
    - Zmiana protokołu/ścieżek PeekabooBridge
    - Wybór między PeekabooBridge, Codex Computer Use a cua-driver MCP
summary: Integracja PeekabooBridge do automatyzacji interfejsu użytkownika w macOS
title: Most Peekaboo
x-i18n:
    generated_at: "2026-07-12T15:18:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw może udostępniać **PeekabooBridge** jako lokalnego brokera automatyzacji interfejsu użytkownika, uwzględniającego uprawnienia (`PeekabooBridgeHostCoordinator`, korzystający z pakietu Swift `steipete/Peekaboo`). Dzięki temu CLI `peekaboo` może sterować automatyzacją interfejsu użytkownika, wykorzystując uprawnienia TCC aplikacji macOS.

## Czym jest (i czym nie jest)

- **Host**: OpenClaw.app może działać jako host PeekabooBridge.
- **Klient**: CLI `peekaboo` (nie istnieje osobny interfejs `openclaw ui ...`).
- **Interfejs użytkownika**: nakładki wizualne pozostają w Peekaboo.app; OpenClaw jest uproszczonym hostem brokera.

## Powiązanie z innymi metodami sterowania pulpitem

OpenClaw udostępnia cztery celowo rozdzielone metody sterowania pulpitem:

- **Host PeekabooBridge**: OpenClaw.app udostępnia lokalne gniazdo PeekabooBridge. CLI `peekaboo` jest klientem i korzysta z uprawnień macOS aplikacji OpenClaw.app do wykonywania zrzutów ekranu, kliknięć, obsługi menu i okien dialogowych, działań w Docku oraz zarządzania oknami.
- **Sterowanie komputerem przez agenta (`computer.act`)**: wbudowane narzędzie `computer` agenta Gateway wykonuje zrzuty ekranu za pomocą `screen.snapshot` oraz steruje wskaźnikiem i klawiaturą przy użyciu niebezpiecznego polecenia Node `computer.act`. Node systemu macOS realizuje `computer.act` wewnątrz procesu, korzystając z osadzonych usług automatyzacji Peekaboo udostępnianych przez ten most oraz ściśle ograniczonych mechanizmów CoreGraphics, bez używania gniazda PeekabooBridge ani CLI `peekaboo`. Zobacz [Sterowanie komputerem](/nodes/computer-use).
- **Codex Computer Use**: dołączony Plugin `codex` sprawdza Plugin MCP `computer-use` systemu Codex i może go zainstalować (`extensions/codex/src/app-server/computer-use.ts`), a następnie podczas tur w trybie Codex umożliwia systemowi Codex obsługę natywnych wywołań narzędzi sterujących pulpitem. OpenClaw nie pośredniczy w tych działaniach przez PeekabooBridge.
- **Bezpośredni MCP `cua-driver`**: OpenClaw może zarejestrować nadrzędny serwer `cua-driver mcp` projektu TryCua jako zwykły serwer MCP, udostępniając agentom własne schematy sterownika CUA oraz przepływ pracy oparty na identyfikatorach procesów, oknach i indeksach elementów, bez pośrednictwa platformy handlowej Codex ani gniazda PeekabooBridge.

Używaj Peekaboo, aby uzyskać szeroki zakres automatyzacji systemu macOS za pośrednictwem uwzględniającego uprawnienia hosta mostu w OpenClaw.app. Używaj sterowania komputerem przez agenta, gdy agent Gateway ma widzieć pulpit i sterować nim za pomocą jednolitego polecenia Node `computer.act`, którym może posługiwać się dowolny model wizyjny. Używaj Codex Computer Use, gdy agent działający w trybie Codex ma korzystać z natywnego Pluginu systemu Codex. Używaj bezpośrednio `cua-driver mcp`, aby udostępnić sterownik CUA dowolnemu środowisku wykonawczemu zarządzanemu przez OpenClaw jako zwykły serwer MCP.

## Włączanie mostu

W aplikacji macOS: **Settings -> Enable Peekaboo Bridge**.

Po włączeniu OpenClaw uruchamia lokalny serwer gniazda UNIX pod ścieżką `~/Library/Application Support/OpenClaw/<socket-name>`. Po wyłączeniu host zostaje zatrzymany, a `peekaboo` przełącza się na inne dostępne hosty. Koordynator utrzymuje również starsze dowiązania symboliczne gniazda (`clawdbot`, `clawdis`, `moltbot` w katalogu Application Support), wskazujące bieżące gniazdo na potrzeby starszych instalacji `peekaboo`.

## Kolejność wykrywania klientów

Klienci Peekaboo zazwyczaj próbują połączyć się z hostami w następującej kolejności:

1. Peekaboo.app (pełny interfejs użytkownika)
2. Claude.app (jeśli jest zainstalowana)
3. OpenClaw.app (uproszczony broker)

Użyj polecenia `peekaboo bridge status --verbose`, aby sprawdzić, który host jest aktywny i która ścieżka gniazda jest używana. Aby ją zastąpić, użyj:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bezpieczeństwo i uprawnienia

- Most weryfikuje **podpisy kodu wywołującego**; stosowana jest lista dozwolonych identyfikatorów TeamID (TeamID hosta Peekaboo oraz własny TeamID uruchomionej aplikacji).
- W przypadku uprawnień Dostępności preferuj podpisaną tożsamość mostu lub aplikacji zamiast ogólnego środowiska wykonawczego `node`. Przyznanie uprawnień Dostępności programowi `node` pozwala każdemu pakietowi uruchomionemu przez ten plik wykonywalny Node odziedziczyć dostęp do automatyzacji graficznego interfejsu użytkownika; zobacz [Uprawnienia systemu macOS](/pl/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Limit czasu żądań wynosi 10 sekund (`requestTimeoutSec: 10`).
- Jeśli brakuje wymaganych uprawnień, most zwraca czytelny komunikat o błędzie zamiast uruchamiać Ustawienia systemowe.

## Działanie migawek (automatyzacja)

Migawki są przechowywane w pamięci przez 10 minut, a ich maksymalna liczba wynosi 50 (`InMemorySnapshotManager`); artefakty nie są usuwane podczas czyszczenia. Jeśli potrzebujesz dłuższego okresu przechowywania, wykonaj ponowne przechwycenie po stronie klienta.

## Rozwiązywanie problemów

- Jeśli `peekaboo` zgłasza „klient mostu nie jest autoryzowany”, upewnij się, że klient jest prawidłowo podpisany, lub uruchom hosta ze zmienną `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` wyłącznie w trybie **debugowania**.
- Jeśli nie znaleziono żadnych hostów, otwórz jedną z aplikacji hosta (Peekaboo.app lub OpenClaw.app) i upewnij się, że przyznano uprawnienia.

## Powiązane materiały

- [Aplikacja macOS](/pl/platforms/macos)
- [Uprawnienia systemu macOS](/pl/platforms/mac/permissions)
