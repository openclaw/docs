---
read_when:
    - Hostowanie PeekabooBridge w OpenClaw.app
    - Integracja Peekaboo za pomocą Swift Package Manager
    - Zmiana protokołu/ścieżek PeekabooBridge
    - Wybór między PeekabooBridge, Codex Computer Use a cua-driver MCP
summary: Integracja PeekabooBridge do automatyzacji interfejsu użytkownika w macOS
title: Most Peekaboo
x-i18n:
    generated_at: "2026-07-16T18:46:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw może hostować **PeekabooBridge** jako lokalnego brokera automatyzacji interfejsu użytkownika, uwzględniającego uprawnienia (`PeekabooBridgeHostCoordinator`, opartego na pakiecie Swift `steipete/Peekaboo`). Dzięki temu CLI `peekaboo` może sterować automatyzacją interfejsu użytkownika, korzystając z uprawnień TCC aplikacji macOS.

## Czym to jest (a czym nie jest)

- **Host**: OpenClaw.app może działać jako host PeekabooBridge.
- **Klient**: CLI `peekaboo` (nie ma oddzielnego interfejsu `openclaw ui ...`).
- **Interfejs użytkownika**: nakładki wizualne pozostają w Peekaboo.app; OpenClaw jest uproszczonym hostem brokera.

## Relacja z innymi metodami sterowania pulpitem

OpenClaw oferuje cztery celowo odrębne metody sterowania pulpitem:

- **Host PeekabooBridge**: OpenClaw.app hostuje lokalne gniazdo PeekabooBridge. CLI `peekaboo` jest klientem i korzysta z uprawnień macOS aplikacji OpenClaw.app do wykonywania zrzutów ekranu, kliknięć, obsługi menu i okien dialogowych, działań w Docku oraz zarządzania oknami.
- **Sterowanie komputerem przez agenta (`computer.act`)**: wbudowane narzędzie `computer` agenta Gateway wykonuje zrzuty ekranu za pośrednictwem `screen.snapshot` oraz steruje wskaźnikiem i klawiaturą przy użyciu niebezpiecznego polecenia węzła `computer.act`. Węzeł macOS realizuje `computer.act` wewnątrz procesu, korzystając z osadzonych usług automatyzacji Peekaboo udostępnianych przez ten most oraz wyspecjalizowanych prymitywów CoreGraphics, bez używania gniazda PeekabooBridge ani CLI `peekaboo`. Zobacz [Sterowanie komputerem](/pl/nodes/computer-use).
- **Codex Computer Use**: dołączony Plugin `codex` sprawdza Plugin MCP `computer-use` systemu Codex (`extensions/codex/src/app-server/computer-use.ts`) i może go zainstalować, a następnie pozwala systemowi Codex zarządzać natywnymi wywołaniami narzędzi do sterowania pulpitem podczas tur w trybie Codex. OpenClaw nie przekazuje tych działań przez PeekabooBridge.
- **Bezpośredni MCP `cua-driver`**: OpenClaw może zarejestrować nadrzędny serwer `cua-driver mcp` projektu TryCua jako zwykły serwer MCP, zapewniając agentom własne schematy sterownika CUA oraz przepływ pracy oparty na identyfikatorach pid, oknach i indeksach elementów, bez przekazywania przez platformę handlową Codex ani gniazdo PeekabooBridge.

Peekaboo należy używać do obsługi szerokiego zakresu automatyzacji macOS za pośrednictwem uwzględniającego uprawnienia hosta mostu aplikacji OpenClaw.app. Sterowanie komputerem przez agenta należy stosować, gdy agent Gateway ma widzieć pulpit i sterować nim za pomocą jednolitego polecenia węzła `computer.act`, którym może sterować dowolny model wizyjny. Codex Computer Use należy stosować, gdy agent w trybie Codex ma korzystać z natywnego Pluginu systemu Codex. Bezpośredniego `cua-driver mcp` należy używać, aby udostępnić sterownik CUA dowolnemu środowisku wykonawczemu zarządzanemu przez OpenClaw jako zwykły serwer MCP.

## Włączanie mostu

W aplikacji macOS: **Settings -> Enable Peekaboo Bridge**. Przełącznik wymaga włączenia opcji **Allow Computer Control**, ponieważ obie funkcje przyznają możliwość lokalnej automatyzacji interfejsu użytkownika; gdy funkcja Computer Control jest wyłączona, przełącznik jest nieaktywny, a host nie działa. Aby sterować Peekaboo bez funkcji Computer Control, należy zamiast tego uruchomić własną aplikację Peekaboo dla komputerów Mac jako hosta.

Po włączeniu tej funkcji (oraz funkcji Computer Control) OpenClaw uruchamia lokalny serwer gniazda UNIX w `~/Library/Application Support/OpenClaw/<socket-name>`. Po jej wyłączeniu host zatrzymuje się, a `peekaboo` przełącza się na inne dostępne hosty. Koordynator utrzymuje również starsze dowiązania symboliczne gniazd (`clawdbot`, `clawdis`, `moltbot` w katalogu Application Support), wskazujące bieżące gniazdo na potrzeby starszych instalacji `peekaboo`.

## Kolejność wykrywania klientów

Klienci Peekaboo zwykle próbują połączyć się z hostami w następującej kolejności:

1. Peekaboo.app (pełny interfejs użytkownika)
2. Claude.app (jeśli jest zainstalowana)
3. OpenClaw.app (uproszczony broker)

Aby sprawdzić, który host jest aktywny i która ścieżka gniazda jest używana, należy użyć `peekaboo bridge status --verbose`. Można ją zastąpić za pomocą:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bezpieczeństwo i uprawnienia

- Most weryfikuje **podpisy kodu wywołujących**; egzekwowana jest lista dozwolonych identyfikatorów TeamID (TeamID hosta Peekaboo oraz własny TeamID uruchomionej aplikacji).
- W przypadku ułatwień dostępu należy preferować podpisaną tożsamość mostu/aplikacji zamiast ogólnego środowiska wykonawczego `node`. Przyznanie ułatwień dostępu elementowi `node` sprawia, że każdy pakiet uruchomiony przez ten plik wykonywalny Node dziedziczy dostęp do automatyzacji interfejsu graficznego; zobacz [Uprawnienia macOS](/pl/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Limit czasu żądań wynosi 10 sekund (`requestTimeoutSec: 10`).
- Jeśli brakuje wymaganych uprawnień, most zwraca czytelny komunikat o błędzie zamiast uruchamiać Ustawienia systemowe.

## Działanie migawek (automatyzacja)

Migawki są przechowywane w pamięci przez 10 minut, a ich maksymalna liczba wynosi 50 (`InMemorySnapshotManager`); artefakty nie są usuwane podczas czyszczenia. Jeśli wymagane jest dłuższe przechowywanie, należy ponownie wykonać przechwycenie po stronie klienta.

## Rozwiązywanie problemów

- Jeśli `peekaboo` zgłasza „bridge client is not authorized”, należy upewnić się, że klient jest prawidłowo podpisany, lub uruchomić hosta z `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` wyłącznie w trybie **debug**.
- Jeśli nie znaleziono żadnych hostów, należy otworzyć jedną z aplikacji hosta (Peekaboo.app lub OpenClaw.app) i potwierdzić przyznanie uprawnień.

## Powiązane materiały

- [Aplikacja macOS](/pl/platforms/macos)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
