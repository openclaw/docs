---
read_when:
    - Edytowanie kontraktów IPC lub IPC aplikacji paska menu
summary: Architektura IPC macOS dla aplikacji OpenClaw, transportu węzła Gateway i PeekabooBridge
title: macOS IPC
x-i18n:
    generated_at: "2026-06-28T00:13:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Architektura IPC OpenClaw na macOS

**Obecny model:** lokalne gniazdo Unix łączy **usługę hosta node** z **aplikacją macOS** na potrzeby zatwierdzeń exec + `system.run`. Istnieje debugowy CLI `openclaw-mac` do sprawdzania wykrywania/połączenia; akcje agentów nadal przepływają przez Gateway WebSocket i `node.invoke`. Automatyzacja UI używa PeekabooBridge.

## Cele

- Pojedyncza instancja aplikacji GUI, która obsługuje całą pracę wymagającą TCC (powiadomienia, nagrywanie ekranu, mikrofon, mowa, AppleScript).
- Mała powierzchnia automatyzacji: Gateway + polecenia node oraz PeekabooBridge do automatyzacji UI.
- Przewidywalne uprawnienia: zawsze ten sam podpisany identyfikator pakietu, uruchamiany przez launchd, dzięki czemu zgody TCC pozostają trwałe.

## Jak to działa

### Transport Gateway + node

- Aplikacja uruchamia Gateway (tryb lokalny) i łączy się z nim jako node.
- Akcje agentów są wykonywane przez `node.invoke` (np. `system.run`, `system.notify`, `canvas.*`).
- Typowe polecenia node na Macu obejmują `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` i `system.notify`.
- Node zgłasza mapę `permissions`, aby agenci mogli sprawdzić, czy dostępne są uprawnienia do ekranu,
  kamery, mikrofonu, mowy, automatyzacji lub ułatwień dostępu.

### Usługa node + IPC aplikacji

- Bezinterfejsowa usługa hosta node łączy się z Gateway WebSocket.
- Żądania `system.run` są przekazywane do aplikacji macOS przez lokalne gniazdo Unix.
- Aplikacja wykonuje exec w kontekście UI, w razie potrzeby prosi o potwierdzenie i zwraca wynik.

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatyzacja UI)

- Automatyzacja UI używa osobnego gniazda UNIX o nazwie `bridge.sock` oraz protokołu JSON PeekabooBridge.
- Kolejność preferencji hostów (po stronie klienta): Peekaboo.app → Claude.app → OpenClaw.app → wykonanie lokalne.
- Bezpieczeństwo: hosty bridge wymagają dozwolonego TeamID; awaryjna ścieżka same-UID tylko dla DEBUG jest chroniona przez `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konwencja Peekaboo).
- Zobacz: [użycie PeekabooBridge](/pl/platforms/mac/peekaboo), aby poznać szczegóły.

## Przepływy operacyjne

- Restart/przebudowa: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Zamyka istniejące instancje
  - Swift build + package
  - Zapisuje/bootstrapuje/uruchamia ponownie LaunchAgent
- Pojedyncza instancja: aplikacja kończy działanie wcześnie, jeśli działa inna instancja z tym samym identyfikatorem pakietu.

## Uwagi dotyczące utwardzania

- Preferuj wymaganie zgodności TeamID dla wszystkich uprzywilejowanych powierzchni.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (tylko DEBUG) może zezwalać wywołującym same-UID podczas lokalnego rozwoju.
- Cała komunikacja pozostaje wyłącznie lokalna; żadne gniazda sieciowe nie są wystawiane.
- Monity TCC pochodzą wyłącznie z pakietu aplikacji GUI; utrzymuj stabilny podpisany identyfikator pakietu między przebudowami.
- Utwardzanie IPC: tryb gniazda `0600`, token, kontrole peer-UID, wyzwanie/odpowiedź HMAC, krótki TTL.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [przepływ IPC macOS (zatwierdzenia Exec)](/pl/tools/exec-approvals-advanced#macos-ipc-flow)
