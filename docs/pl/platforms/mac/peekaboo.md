---
read_when:
    - Hostowanie PeekabooBridge w OpenClaw.app
    - Integrowanie Peekaboo za pomocą Swift Package Manager
    - Zmiana protokołu/ścieżek PeekabooBridge
    - Decydowanie między PeekabooBridge, Codex Computer Use i cua-driver MCP
summary: Integracja PeekabooBridge do automatyzacji UI w macOS
title: Most Peekaboo
x-i18n:
    generated_at: "2026-06-27T17:47:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw może hostować **PeekabooBridge** jako lokalnego, świadomego uprawnień brokera automatyzacji UI. Dzięki temu CLI `peekaboo` może sterować automatyzacją UI, ponownie wykorzystując uprawnienia TCC aplikacji macOS.

## Czym to jest (i czym nie jest)

- **Host**: OpenClaw.app może działać jako host PeekabooBridge.
- **Klient**: użyj CLI `peekaboo` (bez osobnej powierzchni `openclaw ui ...`).
- **UI**: nakładki wizualne pozostają w Peekaboo.app; OpenClaw jest cienkim hostem brokera.

## Relacja do Computer Use

OpenClaw ma trzy ścieżki sterowania pulpitem i celowo pozostają one oddzielne:

- **Host PeekabooBridge**: OpenClaw.app może hostować lokalne gniazdo PeekabooBridge.
  CLI `peekaboo` pozostaje klientem i używa uprawnień macOS aplikacji OpenClaw.app
  dla prymitywów automatyzacji Peekaboo, takich jak zrzuty ekranu, kliknięcia,
  menu, okna dialogowe, działania Docka i zarządzanie oknami.
- **Codex Computer Use**: dołączony Plugin `codex` przygotowuje serwer aplikacji Codex,
  sprawdza, czy serwer MCP `computer-use` Codex jest dostępny, a następnie pozwala
  Codex przejąć natywne wywołania narzędzi sterowania pulpitem podczas tur w trybie Codex.
  OpenClaw nie pośredniczy w tych działaniach przez PeekabooBridge.
- **Bezpośredni MCP `cua-driver`**: OpenClaw może zarejestrować nadrzędny serwer
  `cua-driver mcp` TryCua jako zwykły serwer MCP. Daje to agentom własne schematy
  sterownika CUA oraz przepływ pracy pid/okno/indeks-elementu bez routingu przez
  marketplace Codex ani gniazdo PeekabooBridge.

Użyj Peekaboo, gdy potrzebujesz szerokiej powierzchni automatyzacji macOS i świadomego uprawnień hosta mostu OpenClaw.app. Użyj Codex Computer Use, gdy agent w trybie Codex powinien polegać na natywnym Plugin computer-use Codex. Użyj bezpośredniego `cua-driver mcp`, gdy chcesz udostępnić sterownik CUA dowolnemu środowisku uruchomieniowemu zarządzanemu przez OpenClaw jako zwykły serwer MCP.

## Włącz most

W aplikacji macOS:

- Ustawienia → **Włącz Peekaboo Bridge**

Po włączeniu OpenClaw uruchamia lokalny serwer gniazda UNIX. Jeśli zostanie wyłączony, host zostaje zatrzymany, a `peekaboo` przełączy się awaryjnie na inne dostępne hosty.

## Kolejność wykrywania klienta

Klienci Peekaboo zwykle próbują hostów w tej kolejności:

1. Peekaboo.app (pełne UX)
2. Claude.app (jeśli zainstalowana)
3. OpenClaw.app (cienki broker)

Użyj `peekaboo bridge status --verbose`, aby zobaczyć, który host jest aktywny i która ścieżka gniazda jest używana. Możesz nadpisać to za pomocą:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Bezpieczeństwo i uprawnienia

- Most weryfikuje **sygnatury kodu wywołujących**; egzekwowana jest lista dozwolonych TeamID
  (TeamID hosta Peekaboo + TeamID aplikacji OpenClaw).
- Preferuj podpisaną tożsamość mostu/aplikacji zamiast ogólnego środowiska uruchomieniowego `node`
  dla Dostępności. Przyznanie Dostępności `node` pozwala każdemu pakietowi uruchomionemu przez
  ten plik wykonywalny Node odziedziczyć dostęp do automatyzacji GUI; zobacz
  [uprawnienia macOS](/pl/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Żądania wygasają po około 10 sekundach.
- Jeśli brakuje wymaganych uprawnień, most zwraca czytelny komunikat o błędzie
  zamiast uruchamiać Ustawienia systemowe.

## Zachowanie migawek (automatyzacja)

Migawki są przechowywane w pamięci i automatycznie wygasają po krótkim czasie.
Jeśli potrzebujesz dłuższego przechowywania, przechwyć je ponownie z klienta.

## Rozwiązywanie problemów

- Jeśli `peekaboo` zgłasza „bridge client is not authorized”, upewnij się, że klient jest
  poprawnie podpisany albo uruchom host z `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  wyłącznie w trybie **debug**.
- Jeśli nie znaleziono żadnych hostów, otwórz jedną z aplikacji hosta (Peekaboo.app lub OpenClaw.app)
  i potwierdź, że uprawnienia zostały przyznane.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [uprawnienia macOS](/pl/platforms/mac/permissions)
