---
read_when:
    - Edycja kontraktów IPC lub IPC aplikacji paska menu
summary: Architektura IPC systemu macOS dla aplikacji OpenClaw, transportu węzła Gateway i PeekabooBridge
title: IPC w macOS
x-i18n:
    generated_at: "2026-07-12T15:21:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Architektura IPC OpenClaw w systemie macOS

Lokalne gniazdo uniksowe łączy usługę hosta Node z aplikacją macOS na potrzeby zatwierdzania wykonywania poleceń i `system.run`. Dostępne jest debugowe CLI `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) do sprawdzania wykrywania i połączenia; działania agenta nadal przepływają przez WebSocket Gateway i `node.invoke`. Ścieżka `computer.act` obsługiwana przez Node uruchamia osadzoną automatyzację Peekaboo bezpośrednio w procesie; samodzielne klienty Peekaboo korzystają z PeekabooBridge.

## Cele

- Pojedyncza instancja aplikacji GUI obsługująca wszystkie operacje wymagające TCC (powiadomienia, nagrywanie ekranu, mikrofon, rozpoznawanie mowy, AppleScript).
- Niewielki interfejs automatyzacji: Gateway i polecenia Node, działające w procesie `computer.act` oraz PeekabooBridge dla samodzielnych klientów automatyzacji interfejsu.
- Przewidywalne uprawnienia: zawsze ten sam podpisany identyfikator pakietu, uruchamiany przez launchd, dzięki czemu zezwolenia TCC pozostają ważne.

## Jak to działa

### Transport Gateway + Node

- Aplikacja uruchamia Gateway (w trybie lokalnym) i łączy się z nim jako Node.
- Działania agenta są wykonywane za pośrednictwem `node.invoke` (np. `system.run`, `system.notify`, `canvas.*`).
- Polecenia Node obejmują `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` i `system.notify`.
- Node udostępnia mapę `permissions`, dzięki czemu agenci mogą sprawdzić dostępność uprawnień do ekranu, kamery, mikrofonu, rozpoznawania mowy, automatyzacji i ułatwień dostępu.

### Usługa Node + IPC aplikacji

- Bezinterfejsowa usługa hosta Node łączy się z WebSocketem Gateway.
- Żądania `system.run` są przekazywane do aplikacji macOS przez lokalne gniazdo uniksowe (`ExecApprovalsSocket.swift`).
- Aplikacja wykonuje polecenie w kontekście interfejsu, w razie potrzeby wyświetla monit i zwraca dane wyjściowe.

Diagram (SCI):

```text
Agent -> Gateway -> Usługa Node (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Aplikacja Mac (UI + TCC + system.run)
```

### PeekabooBridge (automatyzacja interfejsu)

- Wbudowane narzędzie agenta `computer` **nie** korzysta z tego gniazda. Sparowany Node macOS realizuje `computer.act` w procesie aplikacji za pomocą osadzonych usług Peekaboo.
- Automatyzacja interfejsu korzysta z osobnego gniazda UNIX (`~/Library/Application Support/OpenClaw/<socket>`) i protokołu JSON PeekabooBridge.
- Kolejność preferencji hostów (po stronie klienta): Peekaboo.app -> Claude.app -> OpenClaw.app -> wykonanie lokalne.
- Bezpieczeństwo: hosty mostu wymagają identyfikatora TeamID z listy dozwolonych (dołączony `PeekabooBridgeHostCoordinator` zezwala na stały zespół oraz własny zespół podpisujący aplikację); dostępne tylko w trybie DEBUG obejście dla tego samego UID jest chronione przez `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konwencja Peekaboo).
- Szczegółowe informacje: [korzystanie z PeekabooBridge](/pl/platforms/mac/peekaboo).

## Przepływy operacyjne

- Ponowne uruchomienie/przebudowa: `scripts/restart-mac.sh` kończy istniejące instancje, przebudowuje aplikację za pomocą Swift, ponownie ją pakuje i uruchamia. Automatycznie wykrywa dostępną tożsamość podpisującą, a jeśli jej nie znajdzie, przechodzi na `--no-sign`; przekaż `--sign`, aby wymagać podpisania (operacja kończy się niepowodzeniem, jeśli żaden klucz nie jest dostępny), lub `--no-sign`, aby wymusić ścieżkę bez podpisu. Zmienna `SIGN_IDENTITY` ustawiona w środowisku jest usuwana na ścieżce z podpisem, dzięki czemu własne automatyczne wykrywanie tożsamości przez `scripts/codesign-mac-app.sh` wybiera certyfikat.
- Pojedyncza instancja: aplikacja sprawdza `NSWorkspace.runningApplications` pod kątem zduplikowanego identyfikatora pakietu i kończy działanie, jeśli znajdzie więcej niż jedną instancję (`isDuplicateInstance()` w `MenuBar.swift`).

## Uwagi dotyczące zabezpieczeń

- Dla wszystkich uprzywilejowanych interfejsów należy preferować wymaganie zgodności TeamID.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (tylko w trybie DEBUG) może zezwalać wywołującym z tym samym UID na potrzeby lokalnego programowania.
- Cała komunikacja pozostaje wyłącznie lokalna; żadne gniazda sieciowe nie są udostępniane.
- Monity TCC pochodzą wyłącznie z pakietu aplikacji GUI; zachowaj stabilny identyfikator podpisanego pakietu między przebudowami.
- Zabezpieczenia gniazda zatwierdzania wykonywania poleceń: tryb pliku `0600`, współdzielony token, sprawdzanie UID drugiej strony (`getpeereid`), mechanizm wezwanie–odpowiedź HMAC-SHA256 oraz krótki TTL żądań.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [przepływ IPC w systemie macOS (zatwierdzanie wykonywania poleceń)](/pl/tools/exec-approvals-advanced#macos-ipc-flow)
