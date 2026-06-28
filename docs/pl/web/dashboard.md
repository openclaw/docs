---
read_when:
    - Zmiana uwierzytelniania panelu lub trybów udostępniania
summary: Dostęp i uwierzytelnianie panelu Gateway (interfejs sterowania)
title: Panel
x-i18n:
    generated_at: "2026-05-11T20:40:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Panel Gateway to przeglądarkowy interfejs sterowania serwowany domyślnie pod `/`
(nadpisz za pomocą `gateway.controlUi.basePath`).

Szybkie otwarcie (lokalny Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))
- Gdy `gateway.tls.enabled: true`, użyj `https://127.0.0.1:18789/` oraz
  `wss://127.0.0.1:18789` jako punktu końcowego WebSocket.

Kluczowe odwołania:

- [Interfejs sterowania](/pl/web/control-ui) do użycia i możliwości interfejsu.
- [Tailscale](/pl/gateway/tailscale) do automatyzacji Serve/Funnel.
- [Powierzchnie webowe](/pl/web) do trybów wiązania i uwag dotyczących bezpieczeństwa.

Uwierzytelnianie jest egzekwowane podczas uzgadniania WebSocket przez skonfigurowaną ścieżkę
uwierzytelniania Gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Zobacz `gateway.auth` w [konfiguracji Gateway](/pl/gateway/configuration).

Uwaga dotycząca bezpieczeństwa: interfejs sterowania to **powierzchnia administracyjna** (czat, konfiguracja, zatwierdzenia exec).
Nie udostępniaj go publicznie. Interfejs przechowuje tokeny URL panelu w sessionStorage
dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway oraz usuwa je z adresu URL po załadowaniu.
Preferuj localhost, Tailscale Serve albo tunel SSH.

## Szybka ścieżka (zalecane)

- Po onboardingu CLI automatycznie otwiera panel i wypisuje czysty link (bez tokena).
- Otwórz ponownie w dowolnym momencie: `openclaw dashboard` (kopiuje link, otwiera przeglądarkę, jeśli to możliwe, pokazuje wskazówkę SSH w środowisku headless).
- Jeśli dostarczenie przez schowek i przeglądarkę się nie powiedzie, `openclaw dashboard` nadal wypisuje
  czysty URL i mówi, aby użyć tokena z `OPENCLAW_GATEWAY_TOKEN` albo
  `gateway.auth.token` jako klucza fragmentu URL `token`; nie wypisuje wartości tokenów
  w logach.
- Jeśli interfejs poprosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token albo
  hasło w ustawieniach interfejsu sterowania.

## Podstawy uwierzytelniania (lokalnie vs zdalnie)

- **Localhost**: otwórz `http://127.0.0.1:18789/`.
- **TLS Gateway**: gdy `gateway.tls.enabled: true`, linki panelu/statusu używają
  `https://`, a linki WebSocket interfejsu sterowania używają `wss://`.
- **Źródło tokena współdzielonego sekretu**: `gateway.auth.token` (albo
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` może przekazać go przez fragment URL
  do jednorazowego bootstrapu, a interfejs sterowania przechowuje go w sessionStorage dla
  bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway zamiast w localStorage.
- Jeśli `gateway.auth.token` jest zarządzany przez SecretRef, `openclaw dashboard`
  celowo wypisuje/kopiuje/otwiera URL bez tokena. Pozwala to uniknąć ujawniania
  zewnętrznie zarządzanych tokenów w logach powłoki, historii schowka lub argumentach
  uruchamiania przeglądarki.
- Jeśli `gateway.auth.token` jest skonfigurowany jako SecretRef i nie został rozwiązany w Twojej
  bieżącej powłoce, `openclaw dashboard` nadal wypisuje URL bez tokena oraz
  praktyczne wskazówki konfiguracji uwierzytelniania.
- **Hasło współdzielonego sekretu**: użyj skonfigurowanego `gateway.auth.password` (albo
  `OPENCLAW_GATEWAY_PASSWORD`). Panel nie zachowuje haseł między
  przeładowaniami.
- **Tryby z tożsamością**: Tailscale Serve może spełnić uwierzytelnianie interfejsu sterowania/WebSocket
  przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`, a
  zwrotne proxy obsługujące tożsamość poza local loopback może spełnić
  `gateway.auth.mode: "trusted-proxy"`. W tych trybach panel nie
  potrzebuje wklejonego współdzielonego sekretu dla WebSocket.
- **Nie localhost**: użyj Tailscale Serve, wiązania współdzielonego sekretu poza local loopback,
  zwrotnego proxy obsługującego tożsamość poza local loopback z
  `gateway.auth.mode: "trusted-proxy"` albo tunelu SSH. Interfejsy API HTTP nadal używają
  uwierzytelniania współdzielonym sekretem, chyba że celowo uruchomisz prywatne wejście
  `gateway.auth.mode: "none"` albo uwierzytelnianie HTTP zaufanego proxy. Zobacz
  [Powierzchnie webowe](/pl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Jeśli zobaczysz "unauthorized" / 1008

- Upewnij się, że Gateway jest osiągalny (lokalnie: `openclaw status`; zdalnie: tunel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, następnie otwórz `http://127.0.0.1:18789/`).
- Dla `AUTH_TOKEN_MISMATCH` klienci mogą wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia, gdy Gateway zwraca wskazówki ponownej próby. Ta ponowna próba z buforowanym tokenem ponownie używa buforowanych zatwierdzonych zakresów tokena; wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują swój żądany zestaw zakresów. Jeśli uwierzytelnianie nadal nie powiedzie się po tej ponownej próbie, rozwiąż rozjazd tokenów ręcznie.
- Dla `AUTH_SCOPE_MISMATCH` token urządzenia został rozpoznany, ale nie ma żądanych przez panel zakresów; sparuj ponownie albo zatwierdź żądany kontrakt zakresów zamiast rotować współdzielony token Gateway.
- Poza tą ścieżką ponownej próby pierwszeństwo uwierzytelniania połączenia to najpierw jawny współdzielony token/hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrapu.
- W asynchronicznej ścieżce interfejsu sterowania Tailscale Serve nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter nieudanego uwierzytelniania je zarejestruje, więc
  druga równoczesna błędna ponowna próba może już pokazać `retry later`.
- Kroki naprawy rozjazdu tokenów znajdziesz w [liście kontrolnej odzyskiwania po rozjeździe tokenów](/pl/cli/devices#token-drift-recovery-checklist).
- Pobierz albo podaj współdzielony sekret z hosta Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Hasło: rozwiąż skonfigurowane `gateway.auth.password` albo
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token zarządzany przez SecretRef: rozwiąż zewnętrznego dostawcę sekretów albo wyeksportuj
    `OPENCLAW_GATEWAY_TOKEN` w tej powłoce, a następnie ponownie uruchom `openclaw dashboard`
  - Brak skonfigurowanego współdzielonego sekretu: `openclaw doctor --generate-gateway-token`
- W ustawieniach panelu wklej token albo hasło w polu uwierzytelniania,
  a następnie połącz.
- Selektor języka interfejsu znajduje się w **Przegląd -> Dostęp do Gateway -> Język**.
  Jest częścią karty dostępu, a nie sekcji Wygląd.

## Powiązane

- [Interfejs sterowania](/pl/web/control-ui)
- [WebChat](/pl/web/webchat)
