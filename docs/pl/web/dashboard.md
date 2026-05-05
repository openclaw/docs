---
read_when:
    - Zmiana uwierzytelniania pulpitu nawigacyjnego lub trybów ekspozycji
summary: Dostęp i uwierzytelnianie w panelu Gateway (interfejs sterowania)
title: Panel sterowania
x-i18n:
    generated_at: "2026-05-05T01:51:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Panel Gateway to przeglądarkowy interfejs sterowania serwowany domyślnie pod `/`
(można nadpisać za pomocą `gateway.controlUi.basePath`).

Szybkie otwarcie (lokalny Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))
- Gdy `gateway.tls.enabled: true`, użyj `https://127.0.0.1:18789/` oraz
  `wss://127.0.0.1:18789` jako endpointu WebSocket.

Kluczowe materiały referencyjne:

- [Interfejs sterowania](/pl/web/control-ui) dotyczący użycia i możliwości UI.
- [Tailscale](/pl/gateway/tailscale) dotyczący automatyzacji Serve/Funnel.
- [Powierzchnie webowe](/pl/web) dotyczące trybów bindowania i uwag bezpieczeństwa.

Uwierzytelnianie jest wymuszane podczas uzgadniania WebSocket przez skonfigurowaną ścieżkę
uwierzytelniania gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Zobacz `gateway.auth` w [konfiguracji Gateway](/pl/gateway/configuration).

Uwaga dotycząca bezpieczeństwa: interfejs sterowania to **powierzchnia administracyjna** (czat, konfiguracja, zatwierdzanie wykonywania poleceń).
Nie wystawiaj go publicznie. UI przechowuje tokeny URL panelu w sessionStorage
dla bieżącej sesji karty przeglądarki i wybranego URL gateway oraz usuwa je z URL po załadowaniu.
Preferuj localhost, Tailscale Serve albo tunel SSH.

## Szybka ścieżka (zalecana)

- Po onboardingu CLI automatycznie otwiera panel i wypisuje czysty link (bez tokena).
- Otwórz ponownie w dowolnym momencie: `openclaw dashboard` (kopiuje link, otwiera przeglądarkę, jeśli to możliwe, pokazuje wskazówkę SSH w środowisku bez graficznego interfejsu).
- Jeśli dostarczenie przez schowek i przeglądarkę się nie powiedzie, `openclaw dashboard` nadal wypisuje
  czysty URL i mówi, aby użyć tokena z `OPENCLAW_GATEWAY_TOKEN` lub
  `gateway.auth.token` jako klucza fragmentu URL `token`; nie wypisuje wartości tokenów
  w logach.
- Jeśli UI poprosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token lub
  hasło w ustawieniach interfejsu sterowania.

## Podstawy uwierzytelniania (lokalnie vs zdalnie)

- **Localhost**: otwórz `http://127.0.0.1:18789/`.
- **Gateway TLS**: gdy `gateway.tls.enabled: true`, linki panelu/statusu używają
  `https://`, a linki WebSocket interfejsu sterowania używają `wss://`.
- **Źródło tokena współdzielonego sekretu**: `gateway.auth.token` (lub
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` może przekazać go przez fragment URL
  do jednorazowego bootstrapu, a interfejs sterowania przechowuje go w sessionStorage dla
  bieżącej sesji karty przeglądarki i wybranego URL gateway zamiast w localStorage.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, `openclaw dashboard`
  z założenia wypisuje/kopiuje/otwiera URL bez tokena. Pozwala to uniknąć ujawniania
  zewnętrznie zarządzanych tokenów w logach powłoki, historii schowka lub argumentach
  uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest skonfigurowany jako SecretRef i nie został rozwiązany w Twojej
  bieżącej powłoce, `openclaw dashboard` nadal wypisuje URL bez tokena oraz
  praktyczne wskazówki konfiguracji uwierzytelniania.
- **Hasło współdzielonego sekretu**: użyj skonfigurowanego `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_PASSWORD`). Panel nie zachowuje haseł między
  przeładowaniami.
- **Tryby z tożsamością**: Tailscale Serve może spełnić uwierzytelnianie interfejsu sterowania/WebSocket
  przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`, a
  reverse proxy spoza loopback, świadome tożsamości, może spełnić
  `gateway.auth.mode: "trusted-proxy"`. W tych trybach panel nie
  potrzebuje wklejonego współdzielonego sekretu dla WebSocket.
- **Nie localhost**: użyj Tailscale Serve, bindowania współdzielonego sekretu poza loopback,
  reverse proxy spoza loopback, świadomego tożsamości, z
  `gateway.auth.mode: "trusted-proxy"`, albo tunelu SSH. API HTTP nadal używają
  uwierzytelniania współdzielonym sekretem, chyba że celowo uruchamiasz prywatny ingress
  `gateway.auth.mode: "none"` albo uwierzytelnianie HTTP przez zaufane proxy. Zobacz
  [powierzchnie webowe](/pl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jeśli widzisz "unauthorized" / 1008

- Upewnij się, że gateway jest osiągalny (lokalnie: `openclaw status`; zdalnie: tunel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`).
- Dla `AUTH_TOKEN_MISMATCH` klienci mogą wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia, gdy gateway zwróci wskazówki ponowienia. Ta ponowna próba z buforowanym tokenem ponownie używa zatwierdzonych zakresów z pamięci podręcznej tokena; wywołania z jawnym `deviceToken` / jawnymi `scopes` zachowują żądany zestaw zakresów. Jeśli uwierzytelnianie nadal kończy się niepowodzeniem po tej ponownej próbie, ręcznie rozwiąż rozjazd tokenów.
- Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, następnie jawny `deviceToken`, następnie zapisany token urządzenia, a potem token bootstrapu.
- Na asynchronicznej ścieżce Tailscale Serve interfejsu sterowania nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter nieudanego uwierzytelniania je zarejestruje, więc
  druga równoczesna błędna ponowna próba może już pokazać `retry later`.
- Kroki naprawy rozjazdu tokenów znajdziesz w [liście kontrolnej odzyskiwania po rozjeździe tokenów](/pl/cli/devices#token-drift-recovery-checklist).
- Pobierz lub podaj współdzielony sekret z hosta gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Hasło: rozwiąż skonfigurowane `gateway.auth.password` lub
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token zarządzany przez SecretRef: rozwiąż zewnętrznego dostawcę sekretów albo wyeksportuj
    `OPENCLAW_GATEWAY_TOKEN` w tej powłoce, a następnie uruchom ponownie `openclaw dashboard`
  - Brak skonfigurowanego współdzielonego sekretu: `openclaw doctor --generate-gateway-token`
- W ustawieniach panelu wklej token lub hasło w polu uwierzytelniania,
  a następnie połącz.
- Selektor języka UI znajduje się w **Overview -> Gateway Access -> Language**.
  Jest częścią karty dostępu, a nie sekcji Appearance.

## Powiązane

- [Interfejs sterowania](/pl/web/control-ui)
- [WebChat](/pl/web/webchat)
