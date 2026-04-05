---
read_when:
    - Edytujesz kontrakty IPC lub IPC aplikacji paska menu
summary: Architektura IPC macOS dla aplikacji OpenClaw, transportu węzła gateway i PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-05T14:00:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Architektura IPC OpenClaw dla macOS

**Obecny model:** lokalny Unix socket łączy **usługę hosta node** z **aplikacją macOS** dla zatwierdzeń exec i `system.run`. Do sprawdzania wykrywania/połączenia istnieje debugowe CLI `openclaw-mac`; akcje agentów nadal przechodzą przez WebSocket Gateway i `node.invoke`. Automatyzacja UI używa PeekabooBridge.

## Cele

- Jedna instancja aplikacji GUI zarządzająca całą pracą związaną z TCC (powiadomienia, nagrywanie ekranu, mikrofon, mowa, AppleScript).
- Mała powierzchnia dla automatyzacji: Gateway + polecenia node oraz PeekabooBridge dla automatyzacji UI.
- Przewidywalne uprawnienia: zawsze ten sam podpisany bundle ID, uruchamiany przez launchd, dzięki czemu uprawnienia TCC pozostają zachowane.

## Jak to działa

### Gateway + transport node

- Aplikacja uruchamia Gateway (tryb lokalny) i łączy się z nim jako node.
- Akcje agentów są wykonywane przez `node.invoke` (np. `system.run`, `system.notify`, `canvas.*`).

### Usługa node + IPC aplikacji

- Bezgłowa usługa hosta node łączy się z WebSocket Gateway.
- Żądania `system.run` są przekazywane do aplikacji macOS przez lokalny Unix socket.
- Aplikacja wykonuje exec w kontekście UI, wyświetla prompt, jeśli trzeba, i zwraca wynik.

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatyzacja UI)

- Automatyzacja UI używa osobnego UNIX socket o nazwie `bridge.sock` i protokołu JSON PeekabooBridge.
- Kolejność preferencji hosta (po stronie klienta): Peekaboo.app → Claude.app → OpenClaw.app → wykonanie lokalne.
- Bezpieczeństwo: hosty bridge wymagają dozwolonego TeamID; furtka awaryjna DEBUG-only dla tego samego UID jest chroniona przez `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konwencja Peekaboo).
- Zobacz: [Użycie PeekabooBridge](/platforms/mac/peekaboo), aby poznać szczegóły.

## Przepływy operacyjne

- Restart/rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Zabija istniejące instancje
  - `swift build` + pakowanie
  - Zapisuje/bootstrapuje/kickstartuje LaunchAgent
- Jedna instancja: aplikacja kończy działanie wcześnie, jeśli działa już inna instancja z tym samym bundle ID.

## Uwagi dotyczące utwardzania

- Preferuj wymaganie dopasowania TeamID dla wszystkich uprzywilejowanych powierzchni.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (tylko DEBUG) może dopuszczać wywołujących z tym samym UID podczas lokalnego developmentu.
- Cała komunikacja pozostaje tylko lokalna; żadne gniazda sieciowe nie są wystawiane.
- Prompty TCC pochodzą wyłącznie z bundle GUI aplikacji; utrzymuj stabilny podpisany bundle ID między rebuildami.
- Utwardzanie IPC: tryb gniazda `0600`, token, kontrole peer-UID, challenge/response HMAC, krótki TTL.
