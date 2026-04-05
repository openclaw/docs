---
read_when:
    - Zmieniasz uwierzytelnianie dashboard albo tryby ekspozycji
summary: Dostęp do dashboard Gateway (Control UI) i auth
title: Dashboard
x-i18n:
    generated_at: "2026-04-05T14:10:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

Dashboard Gateway to browserowe Control UI serwowane domyślnie pod `/`
(nadpisywane przez `gateway.controlUi.basePath`).

Szybkie otwarcie (lokalny Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (albo [http://localhost:18789/](http://localhost:18789/))

Kluczowa dokumentacja:

- [Control UI](/web/control-ui) — użycie i możliwości UI.
- [Tailscale](/gateway/tailscale) — automatyzacja Serve/Funnel.
- [Web surfaces](/web) — tryby bind i uwagi bezpieczeństwa.

Uwierzytelnianie jest wymuszane podczas handshake WebSocket przez skonfigurowaną
ścieżkę auth gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości trusted-proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Zobacz `gateway.auth` w [Gateway configuration](/gateway/configuration).

Uwaga bezpieczeństwa: Control UI to **powierzchnia administracyjna** (czat, konfiguracja, exec approvals).
Nie wystawiaj jej publicznie. UI przechowuje tokeny URL dashboard w sessionStorage
dla bieżącej sesji karty browser i wybranego URL gateway, a po załadowaniu usuwa je z URL.
Preferuj localhost, Tailscale Serve albo SSH tunnel.

## Szybka ścieżka (zalecana)

- Po onboardingu CLI automatycznie otwiera dashboard i wypisuje czysty link (bez tokena w URL).
- Otwórz ponownie w dowolnym momencie: `openclaw dashboard` (kopiuje link, otwiera browser jeśli to możliwe, pokazuje wskazówkę SSH, jeśli działa headless).
- Jeśli UI wyświetli prompt o auth opartym na współdzielonym sekrecie, wklej skonfigurowany token lub
  hasło do ustawień Control UI.

## Podstawy auth (local vs remote)

- **Localhost**: otwórz `http://127.0.0.1:18789/`.
- **Źródło tokena współdzielonego sekretu**: `gateway.auth.token` (albo
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` może przekazać go przez fragment URL
  dla jednorazowego bootstrapu, a Control UI przechowuje go w sessionStorage dla
  bieżącej sesji karty browser i wybranego URL gateway zamiast w localStorage.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, `openclaw dashboard`
  celowo wypisuje/kopiuje/otwiera URL bez tokena. Zapobiega to ujawnieniu
  zewnętrznie zarządzanych tokenów w logach shell, historii schowka albo argumentach
  uruchamiania browser.
- Jeśli `gateway.auth.token` jest skonfigurowany jako SecretRef i nie jest rozwiązany w
  bieżącym shell, `openclaw dashboard` nadal wypisuje URL bez tokena oraz
  praktyczne wskazówki konfiguracji auth.
- **Hasło współdzielonego sekretu**: użyj skonfigurowanego `gateway.auth.password` (albo
  `OPENCLAW_GATEWAY_PASSWORD`). Dashboard nie zachowuje haseł po przeładowaniu.
- **Tryby przenoszące tożsamość**: Tailscale Serve może spełnić wymagania auth Control UI/WebSocket
  przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`, a
  nie-loopbackowe identity-aware reverse proxy może spełnić
  `gateway.auth.mode: "trusted-proxy"`. W tych trybach dashboard nie
  potrzebuje wklejanego współdzielonego sekretu dla WebSocket.
- **Poza localhost**: użyj Tailscale Serve, nie-loopbackowego bind współdzielonym sekretem,
  nie-loopbackowego identity-aware reverse proxy z
  `gateway.auth.mode: "trusted-proxy"` albo SSH tunnel. API HTTP nadal używają
  auth współdzielonym sekretem, chyba że celowo uruchamiasz prywatny ingress
  `gateway.auth.mode: "none"` albo auth HTTP trusted-proxy. Zobacz
  [Web surfaces](/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jeśli widzisz „unauthorized” / 1008

- Upewnij się, że gateway jest osiągalny (lokalnie: `openclaw status`; zdalnie: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`).
- Dla `AUTH_TOKEN_MISMATCH` klienci mogą wykonać jedną zaufaną próbę ponowną z cache'owanym device tokenem, gdy gateway zwraca wskazówki retry. Taka próba z cache'owanym tokenem używa zapisanych w cache zatwierdzonych zakresów tego tokena; wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują żądany zestaw zakresów. Jeśli auth nadal nie przejdzie po tej próbie, rozwiąż drift tokena ręcznie.
- Poza tą ścieżką retry kolejność auth dla connect to: najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany device token, a na końcu bootstrap token.
- W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są sekwencjonowane, zanim limiter failed-auth je zarejestruje, więc
  drugie równoczesne złe ponowienie może już pokazać `retry later`.
- Kroki naprawy driftu tokena znajdziesz w [Token drift recovery checklist](/cli/devices#token-drift-recovery-checklist).
- Pobierz lub podaj współdzielony sekret z hosta gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Hasło: rozwiąż skonfigurowane `gateway.auth.password` albo
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token zarządzany przez SecretRef: rozwiąż zewnętrznego providera sekretów albo wyeksportuj
    `OPENCLAW_GATEWAY_TOKEN` w tym shell, a potem uruchom ponownie `openclaw dashboard`
  - Brak skonfigurowanego współdzielonego sekretu: `openclaw doctor --generate-gateway-token`
- W ustawieniach dashboard wklej token lub hasło do pola auth,
  a następnie się połącz.
