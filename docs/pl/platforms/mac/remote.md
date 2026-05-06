---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania komputerem Mac
summary: Przepływ aplikacji macOS do sterowania zdalnym Gateway OpenClaw przez SSH
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-05-06T09:21:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ten przepływ pozwala aplikacji macOS działać jako pełny zdalny pilot dla Gateway OpenClaw działającego na innym hoście (komputerze stacjonarnym/serwerze). To funkcja **Zdalnie przez SSH** (uruchamianie zdalne) aplikacji. Wszystkie funkcje: kontrole kondycji, przekazywanie Voice Wake oraz Web Chat, ponownie używają tej samej zdalnej konfiguracji SSH z _Ustawienia → Ogólne_.

## Tryby

- **Lokalnie (ten Mac)**: Wszystko działa na laptopie. SSH nie jest używane.
- **Zdalnie przez SSH (domyślnie)**: Polecenia OpenClaw są wykonywane na zdalnym hoście. Aplikacja na Maca otwiera połączenie SSH z `-o BatchMode`, wybraną tożsamością/kluczem oraz lokalnym przekierowaniem portu.
- **Zdalnie bezpośrednio (ws/wss)**: Bez tunelu SSH. Aplikacja na Maca łączy się bezpośrednio z adresem URL Gateway (na przykład przez Tailscale Serve albo publiczny odwrotny proxy HTTPS).

## Zdalne transporty

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślnie): Używa `ssh -N -L ...`, aby przekierować port Gateway do localhost. Gateway zobaczy adres IP węzła jako `127.0.0.1`, ponieważ tunel jest loopback.
- **Bezpośrednio (ws/wss)**: Łączy się wprost z adresem URL Gateway. Gateway widzi rzeczywisty adres IP klienta.

W trybie tunelu SSH wykryte nazwy hostów LAN/tailnet są zapisywane jako
`gateway.remote.sshTarget`. Aplikacja zachowuje `gateway.remote.url` na lokalnym
punkcie końcowym tunelu, na przykład `ws://127.0.0.1:18789`, dzięki czemu CLI, Web Chat i
lokalna usługa hosta węzła używają tego samego bezpiecznego transportu loopback.

Automatyzacja przeglądarki w trybie zdalnym należy do hosta węzła CLI, a nie do
natywnego węzła aplikacji macOS. Aplikacja uruchamia zainstalowaną usługę hosta węzła, gdy
jest to możliwe; jeśli potrzebujesz sterowania przeglądarką z tego Maca, zainstaluj/uruchom ją za pomocą
`openclaw node install ...` i `openclaw node start` (albo uruchom
`openclaw node run ...` na pierwszym planie), a następnie wybierz jako cel ten węzeł
obsługujący przeglądarkę.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm i zbuduj/zainstaluj CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest na PATH dla powłok nieinteraktywnych (w razie potrzeby utwórz dowiązanie symboliczne w `/usr/local/bin` albo `/opt/homebrew/bin`).
3. Otwórz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale** dla stabilnej osiągalności poza LAN.

## Konfiguracja aplikacji macOS

1. Otwórz _Ustawienia → Ogólne_.
2. W sekcji **OpenClaw działa** wybierz **Zdalnie przez SSH** i ustaw:
   - **Transport**: **Tunel SSH** albo **Bezpośrednio (ws/wss)**.
   - **Cel SSH**: `user@host` (opcjonalnie `:port`).
     - Jeśli Gateway jest w tej samej sieci LAN i ogłasza się przez Bonjour, wybierz go z wykrytej listy, aby automatycznie wypełnić to pole.
   - **URL Gateway** (tylko bezpośrednio): `wss://gateway.example.ts.net` (albo `ws://...` dla lokalnie/LAN).
   - **Plik tożsamości** (zaawansowane): ścieżka do klucza.
   - **Katalog główny projektu** (zaawansowane): ścieżka zdalnego checkoutu używana dla poleceń.
   - **Ścieżka CLI** (zaawansowane): opcjonalna ścieżka do uruchamialnego punktu wejścia/pliku binarnego `openclaw` (wypełniana automatycznie, gdy jest ogłaszana).
3. Naciśnij **Testuj zdalnie**. Sukces oznacza, że zdalne `openclaw status --json` działa poprawnie. Niepowodzenia zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie znaleziono zdalnie.
4. Kontrole kondycji i Web Chat będą teraz automatycznie działać przez ten tunel SSH.

## Web Chat

- **Tunel SSH**: Web Chat łączy się z Gateway przez przekierowany port sterowania WebSocket (domyślnie 18789).
- **Bezpośrednio (ws/wss)**: Web Chat łączy się wprost ze skonfigurowanym adresem URL Gateway.
- Nie ma już osobnego serwera HTTP WebChat.

## Uprawnienia

- Zdalny host potrzebuje tych samych zatwierdzeń TCC co lokalny (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Uruchom wdrożenie na tej maszynie, aby nadać je raz.
- Węzły ogłaszają swój stan uprawnień przez `node.list` / `node.describe`, aby agenci wiedzieli, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj wiązania loopback na zdalnym hoście i łącz się przez SSH lub Tailscale.
- Tunelowanie SSH używa ścisłego sprawdzania klucza hosta; najpierw zaufaj kluczowi hosta, aby istniał w `~/.ssh/known_hosts`.
- Jeśli powiążesz Gateway z interfejsem innym niż loopback, wymagaj prawidłowego uwierzytelniania Gateway: tokenu, hasła albo odwrotnego proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalnie)

- Uruchom `openclaw channels login --verbose` **na zdalnym hoście**. Zeskanuj kod QR za pomocą WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnienie wygaśnie. Kontrola kondycji pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **kod wyjścia 127 / nie znaleziono**: `openclaw` nie jest na PATH dla powłok innych niż logowania. Dodaj go do `/etc/paths`, pliku rc powłoki albo utwórz dowiązanie symboliczne w `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda kondycji nie powiodła się**: sprawdź osiągalność SSH, PATH oraz czy Baileys jest zalogowany (`openclaw status --json`).
- **Web Chat zablokowany**: potwierdź, że Gateway działa na zdalnym hoście i że przekierowany port odpowiada portowi WS Gateway; UI wymaga zdrowego połączenia WS.
- **Adres IP węzła pokazuje 127.0.0.1**: oczekiwane przy tunelu SSH. Przełącz **Transport** na **Bezpośrednio (ws/wss)**, jeśli chcesz, aby Gateway widział rzeczywisty adres IP klienta.
- **Panel działa, ale możliwości Maca są offline**: oznacza to, że połączenie operatora/sterowania aplikacji jest zdrowe, ale połączenie węzła towarzyszącego nie jest połączone albo brakuje mu powierzchni poleceń. Otwórz sekcję urządzenia na pasku menu i sprawdź, czy Mac jest `paired · disconnected`. Dla punktów końcowych Tailscale Serve `wss://*.ts.net` aplikacja wykrywa nieaktualne starsze przypięcia liści TLS po rotacji certyfikatu, czyści nieaktualne przypięcie, gdy macOS ufa nowemu certyfikatowi, i ponawia próbę automatycznie. Jeśli certyfikat nie jest zaufany przez system albo host nie jest nazwą Tailscale Serve, sprawdź certyfikat albo przełącz na **Zdalnie przez SSH**.
- **Voice Wake**: frazy wyzwalające są automatycznie przekazywane w trybie zdalnym; osobny mechanizm przekazywania nie jest potrzebny.

## Dźwięki powiadomień

Wybieraj dźwięki dla poszczególnych powiadomień ze skryptów za pomocą `openclaw` i `node.invoke`, np.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

W aplikacji nie ma już globalnego przełącznika „domyślny dźwięk”; wywołujący wybierają dźwięk (albo jego brak) dla każdego żądania.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Zdalny dostęp](/pl/gateway/remote)
