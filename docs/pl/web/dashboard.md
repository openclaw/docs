---
read_when:
    - Zmienianie uwierzytelniania panelu lub trybów ekspozycji
summary: Dostęp i uwierzytelnianie do panelu Gateway (Control UI)
title: Panel
x-i18n:
    generated_at: "2026-04-24T09:39:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Panel Gateway to interfejs Control UI przeglądarki serwowany domyślnie pod `/`
(nadpisanie przez `gateway.controlUi.basePath`).

Szybkie otwarcie (lokalny Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Kluczowe odniesienia:

- [Control UI](/pl/web/control-ui) — użycie i możliwości interfejsu.
- [Tailscale](/pl/gateway/tailscale) — automatyzacja Serve/Funnel.
- [Powierzchnie webowe](/pl/web) — tryby bindowania i uwagi dotyczące bezpieczeństwa.

Uwierzytelnianie jest egzekwowane podczas handshake WebSocket przez skonfigurowaną
ścieżkę uwierzytelniania gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- Nagłówki tożsamości trusted-proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Zobacz `gateway.auth` w [Konfiguracja Gateway](/pl/gateway/configuration).

Uwaga dotycząca bezpieczeństwa: Control UI to **powierzchnia administracyjna** (czat, konfiguracja, zatwierdzenia exec).
Nie wystawiaj jej publicznie. Interfejs przechowuje tokeny URL panelu w `sessionStorage`
dla bieżącej sesji karty przeglądarki i wybranego URL gateway, a po załadowaniu usuwa je z URL.
Preferuj localhost, Tailscale Serve lub tunel SSH.

## Szybka ścieżka (zalecane)

- Po onboardingu CLI automatycznie otwiera panel i wypisuje czysty link (bez tokena).
- Otwórz ponownie w dowolnym momencie: `openclaw dashboard` (kopiuje link, otwiera przeglądarkę, jeśli to możliwe, i pokazuje wskazówkę SSH, jeśli działa bez interfejsu).
- Jeśli interfejs prosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token lub
  hasło do ustawień Control UI.

## Podstawy uwierzytelniania (lokalnie vs zdalnie)

- **Localhost**: otwórz `http://127.0.0.1:18789/`.
- **Źródło tokena współdzielonego sekretu**: `gateway.auth.token` (lub
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` może przekazać go przez fragment URL
  do jednorazowego bootstrapu, a Control UI przechowuje go w `sessionStorage` dla
  bieżącej sesji karty przeglądarki i wybranego URL gateway zamiast w `localStorage`.
- Jeśli `gateway.auth.token` jest zarządzany jako SecretRef, `openclaw dashboard`
  celowo wypisuje/kopiuje/otwiera URL bez tokena. Pozwala to uniknąć ujawniania
  zewnętrznie zarządzanych tokenów w logach powłoki, historii schowka lub argumentach
  uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest skonfigurowany jako SecretRef i nie jest rozwiązany w Twojej
  bieżącej powłoce, `openclaw dashboard` nadal wypisze URL bez tokena oraz
  praktyczne wskazówki konfiguracji uwierzytelniania.
- **Hasło współdzielonego sekretu**: użyj skonfigurowanego `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_PASSWORD`). Panel nie przechowuje haseł między
  przeładowaniami.
- **Tryby z tożsamością**: Tailscale Serve może spełniać wymagania uwierzytelniania Control UI/WebSocket
  przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`, a
  reverse proxy rozumiejące tożsamość poza loopback może spełniać wymagania przy
  `gateway.auth.mode: "trusted-proxy"`. W tych trybach panel nie
  potrzebuje wklejonego współdzielonego sekretu dla WebSocket.
- **Nie localhost**: użyj Tailscale Serve, bindowania współdzielonego sekretu poza loopback, reverse proxy poza loopback rozumiejącego tożsamość z
  `gateway.auth.mode: "trusted-proxy"` lub tunelu SSH. API HTTP nadal używają
  uwierzytelniania współdzielonym sekretem, chyba że świadomie uruchamiasz prywatny ingress z
  `gateway.auth.mode: "none"` albo uwierzytelnianiem HTTP trusted-proxy. Zobacz
  [Powierzchnie webowe](/pl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jeśli widzisz „unauthorized” / 1008

- Upewnij się, że gateway jest osiągalny (lokalnie: `openclaw status`; zdalnie: tunel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, a następnie otwórz `http://127.0.0.1:18789/`).
- W przypadku `AUTH_TOKEN_MISMATCH` klienci mogą wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia, gdy gateway zwraca wskazówki ponowienia. Ta ponowna próba z buforowanym tokenem ponownie używa buforowanego zestawu zatwierdzonych zakresów tokena; wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują żądany zestaw zakresów. Jeśli uwierzytelnianie nadal kończy się błędem po tej ponownej próbie, ręcznie napraw rozjazd tokenów.
- Poza tą ścieżką ponownej próby pierwszeństwo uwierzytelniania połączenia jest następujące: jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
- Na asynchronicznej ścieżce Control UI Tailscale Serve nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter nieudanego uwierzytelniania je zarejestruje, więc
  druga równoległa błędna próba może już pokazać `retry later`.
- Kroki naprawy rozjazdu tokenów znajdziesz w [Liście kontrolnej odzyskiwania po rozjeździe tokenów](/pl/cli/devices#token-drift-recovery-checklist).
- Pobierz lub podaj współdzielony sekret z hosta gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Hasło: rozwiąż skonfigurowane `gateway.auth.password` lub
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token zarządzany przez SecretRef: rozwiąż zewnętrznego dostawcę sekretów lub wyeksportuj
    `OPENCLAW_GATEWAY_TOKEN` w tej powłoce, a następnie ponownie uruchom `openclaw dashboard`
  - Brak skonfigurowanego współdzielonego sekretu: `openclaw doctor --generate-gateway-token`
- W ustawieniach panelu wklej token lub hasło do pola uwierzytelniania,
  a następnie połącz się.
- Wybór języka interfejsu znajduje się w **Overview -> Gateway Access -> Language**.
  Jest częścią karty dostępu, a nie sekcji Appearance.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [WebChat](/pl/web/webchat)
