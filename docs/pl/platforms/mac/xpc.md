---
read_when:
    - Edytowanie kontraktów IPC lub IPC aplikacji w pasku menu
summary: Architektura IPC macOS dla aplikacji OpenClaw, transportu Node Gateway i PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-24T09:21:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Architektura IPC OpenClaw na macOS

**Obecny model:** lokalne gniazdo Unix łączy **usługę hosta node** z **aplikacją macOS** dla zatwierdzeń exec i `system.run`. Istnieje debugowe CLI `openclaw-mac` do sprawdzania discovery/connect; akcje agenta nadal przepływają przez WebSocket Gateway i `node.invoke`. Automatyzacja UI używa PeekabooBridge.

## Cele

- Jedna instancja aplikacji GUI, która jest właścicielem całej pracy związanej z TCC (powiadomienia, nagrywanie ekranu, mikrofon, mowa, AppleScript).
- Mała powierzchnia automatyzacji: Gateway + polecenia node oraz PeekabooBridge do automatyzacji UI.
- Przewidywalne uprawnienia: zawsze ten sam podpisany bundle ID, uruchamiany przez launchd, dzięki czemu przyznania TCC pozostają trwałe.

## Jak to działa

### Gateway + transport node

- Aplikacja uruchamia Gateway (tryb lokalny) i łączy się z nim jako node.
- Akcje agenta są wykonywane przez `node.invoke` (np. `system.run`, `system.notify`, `canvas.*`).

### Usługa node + IPC aplikacji

- Bezgłowa usługa hosta node łączy się z WebSocket Gateway.
- Żądania `system.run` są przekazywane do aplikacji macOS przez lokalne gniazdo Unix.
- Aplikacja wykonuje exec w kontekście UI, w razie potrzeby pokazuje prompt i zwraca dane wyjściowe.

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatyzacja UI)

- Automatyzacja UI używa osobnego gniazda UNIX o nazwie `bridge.sock` oraz protokołu JSON PeekabooBridge.
- Kolejność preferencji hosta (po stronie klienta): Peekaboo.app → Claude.app → OpenClaw.app → wykonanie lokalne.
- Bezpieczeństwo: hosty bridge wymagają dozwolonego TeamID; awaryjna ścieżka DEBUG-only dla tego samego UID jest chroniona przez `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konwencja Peekaboo).
- Zobacz: [Użycie PeekabooBridge](/pl/platforms/mac/peekaboo), aby poznać szczegóły.

## Przepływy operacyjne

- Restart/przebudowa: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Zabija istniejące instancje
  - Swift build + package
  - Zapisuje/bootstrappuje/kickstartuje LaunchAgent
- Pojedyncza instancja: aplikacja kończy się od razu, jeśli działa już inna instancja z tym samym bundle ID.

## Uwagi o utwardzaniu

- Preferuj wymaganie zgodności TeamID dla wszystkich uprzywilejowanych powierzchni.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (tylko DEBUG) może zezwalać na wywołujących z tym samym UID do lokalnego developmentu.
- Cała komunikacja pozostaje wyłącznie lokalna; żadne gniazda sieciowe nie są wystawiane.
- Monity TCC pochodzą tylko z pakietu aplikacji GUI; utrzymuj stabilny podpisany bundle ID między przebudowami.
- Utwardzanie IPC: tryb gniazda `0600`, token, sprawdzanie peer-UID, challenge/response HMAC, krótki TTL.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Przepływ IPC macOS (zatwierdzenia Exec)](/pl/tools/exec-approvals-advanced#macos-ipc-flow)
