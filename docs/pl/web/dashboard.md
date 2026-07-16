---
read_when:
    - Zmiana uwierzytelniania pulpitu nawigacyjnego lub trybów jego udostępniania
summary: Dostęp do panelu Gateway (interfejsu sterowania) i uwierzytelnianie
title: Panel sterowania
x-i18n:
    generated_at: "2026-07-16T19:12:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Panel Gateway to interfejs Control UI w przeglądarce, domyślnie udostępniany pod adresem `/` (można go zmienić za pomocą `gateway.controlUi.basePath`).

Szybkie otwieranie (lokalny Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))
- W przypadku `gateway.tls.enabled: true` jako punktu końcowego WebSocket należy użyć `https://127.0.0.1:18789/` i `wss://127.0.0.1:18789`.

Najważniejsze materiały:

- [Control UI](/pl/web/control-ui) — informacje o użytkowaniu i możliwościach interfejsu.
- [Tailscale](/pl/gateway/tailscale) — automatyzacja Serve/Funnel.
- [Interfejsy internetowe](/pl/web) — tryby powiązania i uwagi dotyczące bezpieczeństwa.

Uwierzytelnianie jest wymuszane podczas uzgadniania połączenia WebSocket za pośrednictwem skonfigurowanej ścieżki uwierzytelniania Gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego serwera proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Zobacz `gateway.auth` w sekcji [Konfiguracja Gateway](/pl/gateway/configuration).

<Warning>
Control UI jest **interfejsem administracyjnym** (czat, konfiguracja, zatwierdzanie wykonywania poleceń). Nie należy udostępniać go publicznie. Interfejs przechowuje tokeny z adresu URL panelu w sessionStorage dla bieżącej karty przeglądarki i wybranego adresu URL Gateway, a po załadowaniu usuwa je z adresu URL. Zaleca się używanie localhost, Tailscale Serve lub tunelu SSH.
</Warning>

## Szybka ścieżka (zalecana)

- Po wdrożeniu początkowym CLI automatycznie otwiera panel i wyświetla czysty odnośnik (bez tokenu).
- Ponowne otwarcie w dowolnym momencie: `openclaw dashboard` (kopiuje odnośnik, otwiera przeglądarkę, jeśli to możliwe, i wyświetla wskazówkę dotyczącą SSH w środowisku bez interfejsu graficznego).
- Jeśli przekazanie odnośnika do schowka i przeglądarki nie powiedzie się, `openclaw dashboard` nadal wyświetli czysty adres URL i poleci dołączyć token (z `OPENCLAW_GATEWAY_TOKEN` lub `gateway.auth.token`) jako klucz fragmentu adresu URL `token`; wartość tokenu nigdy nie jest wyświetlana w dziennikach.
- Jeśli interfejs poprosi o uwierzytelnienie za pomocą współdzielonego sekretu, należy wkleić skonfigurowany token lub hasło w ustawieniach Control UI.

## Podstawy uwierzytelniania (lokalnie i zdalnie)

- **Localhost**: otwórz `http://127.0.0.1:18789/`.
- **TLS Gateway**: gdy `gateway.tls.enabled: true`, odnośniki do panelu i stanu używają `https://`, a odnośniki WebSocket Control UI używają `wss://`.
- **Źródło tokenu współdzielonego sekretu**: `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` może przekazać go we fragmencie adresu URL w celu jednorazowego uruchomienia początkowego; Control UI przechowuje go w sessionStorage dla bieżącej karty i wybranego adresu URL Gateway, a nie w localStorage.
- Jeśli `gateway.auth.token` jest zarządzany za pomocą SecretRef, `openclaw dashboard` celowo wyświetla, kopiuje i otwiera adres URL bez tokenu, aby uniknąć ujawnienia tokenów zarządzanych zewnętrznie w dziennikach powłoki, historii schowka lub argumentach uruchamiania przeglądarki. Jeśli odwołania nie można rozpoznać w bieżącej powłoce, polecenie nadal wyświetla adres URL bez tokenu wraz z praktycznymi wskazówkami dotyczącymi konfiguracji uwierzytelniania.
- **Hasło współdzielonego sekretu**: należy użyć skonfigurowanego `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`). Panel nie zachowuje haseł po ponownym załadowaniu.
- **Tryby przekazujące tożsamość**: Tailscale Serve spełnia wymagania uwierzytelniania Control UI/WebSocket za pomocą nagłówków tożsamości, gdy `gateway.auth.allowTailscale: true`; serwer reverse proxy obsługujący tożsamość i działający poza interfejsem loopback spełnia wymagania `gateway.auth.mode: "trusted-proxy"`. Żaden z tych trybów nie wymaga wklejenia współdzielonego sekretu dla połączenia WebSocket.
- **Poza localhost**: należy użyć Tailscale Serve, powiązania poza interfejsem loopback ze współdzielonym sekretem, serwera reverse proxy obsługującego tożsamość i działającego poza interfejsem loopback z `gateway.auth.mode: "trusted-proxy"` albo tunelu SSH. Interfejsy API HTTP nadal używają uwierzytelniania współdzielonym sekretem, chyba że celowo uruchomiono prywatny ruch przychodzący `gateway.auth.mode: "none"` lub uwierzytelnianie HTTP zaufanego serwera proxy. Zobacz [Interfejsy internetowe](/pl/web).

## Otwieranie w Telegram

Boty Telegram mogą otwierać panel jako Telegram Mini App za pomocą `/dashboard`.

Wymagania:

- `gateway.tailscale.mode: "serve"` lub `"funnel"`, aby Telegram otrzymał adres URL HTTPS aplikacji Mini App.
- Nadawca w Telegram musi być właścicielem bota: numerycznym identyfikatorem użytkownika Telegram w `commands.ownerAllowFrom` lub efektywną wartością `channels.telegram.allowFrom` wybranego konta.
- Należy uruchomić `/dashboard` w wiadomości prywatnej z botem. Wywołania w grupach jedynie informują o konieczności otwarcia polecenia w wiadomości prywatnej i nie zawierają przycisku.
- Instalacje Docker: tryby Serve/Funnel wymagają powiązania Gateway z interfejsem loopback obok `tailscaled`, czego nie można osiągnąć za pomocą sieci mostkowej z opublikowanymi portami. Kontener Gateway należy uruchomić z `network_mode: host` oraz zamontować w nim gniazdo hosta `tailscaled` (`/var/run/tailscale`) i CLI `tailscale`.

Mini App wykonuje jednorazowe przekazanie właściciela i przekierowuje do Control UI z krótkotrwałym tokenem uruchomienia początkowego. Nie ujawnia współdzielonego tokenu Gateway w adresie URL.

Elementy poza zakresem wersji v1:

- Ramka iframe Telegram Web nie jest obsługiwana.
- Tailscale Serve/Funnel jest jedyną obsługiwaną ścieżką publikowanego adresu URL.

<a id="if-you-see-unauthorized-1008"></a>

## Jeśli pojawi się „unauthorized” / 1008

- Należy potwierdzić, że Gateway jest osiągalny: lokalnie `openclaw status`; zdalnie należy utworzyć tunel SSH `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, a następnie otworzyć `http://127.0.0.1:18789/`.
- W przypadku `AUTH_TOKEN_MISMATCH` klienci mogą wykonać jedną zaufaną ponowną próbę z buforowanym tokenem urządzenia, gdy Gateway zwróci wskazówki dotyczące ponowienia; ta próba wykorzystuje buforowane zatwierdzone zakresy tokenu (wywołujący, którzy jawnie określają `deviceToken`/`scopes`, zachowują żądany zestaw zakresów). Jeśli uwierzytelnianie nadal nie powiedzie się po tej próbie, należy ręcznie usunąć rozbieżność tokenów.
- W przypadku `AUTH_SCOPE_MISMATCH` token urządzenia został rozpoznany, ale nie obejmuje żądanych zakresów; zamiast zmieniać współdzielony token Gateway, należy ponownie sparować urządzenie lub zatwierdzić nowy zestaw zakresów.
- Poza tą ścieżką ponawiania kolejność pierwszeństwa uwierzytelniania połączenia jest następująca: jawny współdzielony token lub hasło, następnie jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token uruchomienia początkowego.
- W asynchronicznej ścieżce Tailscale Serve nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim ogranicznik nieudanych prób uwierzytelniania je zarejestruje, dlatego druga równoczesna błędna próba może już wyświetlić `retry later`.
- Instrukcje naprawy rozbieżności tokenów zawiera [Lista kontrolna odzyskiwania po rozbieżności tokenów](/pl/cli/devices#token-drift-recovery-checklist).
- Należy pobrać lub podać współdzielony sekret z hosta Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Hasło: rozpoznaj skonfigurowany `gateway.auth.password` lub `OPENCLAW_GATEWAY_PASSWORD`
  - Token zarządzany za pomocą SecretRef: rozpoznaj zewnętrznego dostawcę sekretu lub wyeksportuj `OPENCLAW_GATEWAY_TOKEN` w tej powłoce i ponownie uruchom `openclaw dashboard`
  - Brak skonfigurowanego współdzielonego sekretu: `openclaw doctor --generate-gateway-token`
- W ustawieniach panelu należy wkleić token lub hasło w polu uwierzytelniania, a następnie nawiązać połączenie.
- Selektor języka interfejsu znajduje się w **Settings -> General -> Language**, a nie w sekcji Appearance.

## Powiązane materiały

- [Control UI](/pl/web/control-ui)
- [WebChat](/pl/web/webchat)
