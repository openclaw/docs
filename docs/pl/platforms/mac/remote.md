---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania komputerem Mac
summary: Przepływ aplikacji macOS do sterowania zdalnym Gateway OpenClaw
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-06-28T00:12:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ten przepływ pozwala aplikacji macOS działać jako pełny pilot zdalnego sterowania dla OpenClaw Gateway uruchomionego na innym hoście (komputerze/serwerze). Aplikacja może łączyć się bezpośrednio z zaufanymi adresami URL Gateway w sieci LAN/Tailnet albo zarządzać tunelem SSH, gdy zdalny Gateway jest dostępny tylko przez loopback. Kontrole stanu, przekazywanie Voice Wake i Web Chat używają tej samej zdalnej konfiguracji z _Ustawienia → Ogólne_.

## Tryby

- **Lokalny (ten Mac)**: Wszystko działa na laptopie. SSH nie jest używane.
- **Zdalny przez SSH (domyślny)**: Polecenia OpenClaw są wykonywane na zdalnym hoście. Aplikacja na Maca otwiera połączenie SSH z `-o BatchMode` oraz wybraną tożsamością/kluczem i lokalnym przekierowaniem portu.
- **Zdalny bezpośredni (ws/wss)**: Bez tunelu SSH. Aplikacja na Maca łączy się bezpośrednio z adresem URL Gateway (na przykład przez LAN, Tailscale, Tailscale Serve albo publiczny zwrotny serwer proxy HTTPS).

## Zdalne transporty

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślny): Używa `ssh -N -L ...`, aby przekierować port Gateway na localhost. Gateway zobaczy adres IP Node jako `127.0.0.1`, ponieważ tunel działa przez loopback.
- **Bezpośredni (ws/wss)**: Łączy się bezpośrednio z adresem URL Gateway. Gateway widzi rzeczywisty adres IP klienta.

W trybie tunelu SSH wykryte nazwy hostów LAN/tailnet są zapisywane jako
`gateway.remote.sshTarget`. Aplikacja utrzymuje `gateway.remote.url` na lokalnym
punkcie końcowym tunelu, na przykład `ws://127.0.0.1:18789`, więc CLI, Web Chat i
lokalna usługa hosta Node używają tego samego bezpiecznego transportu loopback.
Gdy wykrywanie zwraca zarówno surowe adresy IP Tailnet, jak i stabilne nazwy hostów, aplikacja
preferuje Tailscale MagicDNS lub nazwy LAN, aby zdalne połączenia lepiej przetrwały
zmiany adresów.
Jeśli lokalny port tunelu różni się od portu zdalnego Gateway, ustaw
`gateway.remote.remotePort` na port na zdalnym hoście.

Automatyzacja przeglądarki w trybie zdalnym należy do hosta Node CLI, a nie do
natywnego Node aplikacji macOS. Aplikacja uruchamia zainstalowaną usługę hosta Node, gdy
to możliwe; jeśli potrzebujesz sterowania przeglądarką z tego Maca, zainstaluj/uruchom ją za pomocą
`openclaw node install ...` i `openclaw node start` (albo uruchom
`openclaw node run ...` na pierwszym planie), a następnie wybierz jako cel ten Node
z obsługą przeglądarki.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm i zbuduj/zainstaluj OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest w PATH dla powłok nieinteraktywnych (w razie potrzeby utwórz symlink do `/usr/local/bin` albo `/opt/homebrew/bin`).
3. Tylko dla transportu SSH: otwórz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale**, aby zapewnić stabilną osiągalność poza siecią LAN.

## Konfiguracja aplikacji macOS

Aby wstępnie skonfigurować aplikację bez przepływu powitalnego:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Dla Gateway, który jest już osiągalny w zaufanej sieci LAN albo Tailnet, całkowicie pomiń SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

To zapisuje zdalną konfigurację, oznacza onboarding jako ukończony i pozwala aplikacji zarządzać
wybranym transportem przy starcie.

1. Otwórz _Ustawienia → Ogólne_.
2. W sekcji **OpenClaw działa** wybierz **Zdalnie** i ustaw:
   - **Transport**: **Tunel SSH** albo **Bezpośredni (ws/wss)**.
   - **Cel SSH**: `user@host` (opcjonalnie `:port`).
     - Jeśli Gateway jest w tej samej sieci LAN i ogłasza się przez Bonjour, wybierz go z wykrytej listy, aby automatycznie wypełnić to pole.
   - **Adres URL Gateway** (tylko bezpośredni): `wss://gateway.example.ts.net` (albo `ws://...` dla lokalnego/LAN).
   - **Plik tożsamości** (zaawansowane): ścieżka do klucza.
   - **Katalog główny projektu** (zaawansowane): zdalna ścieżka checkoutu używana dla poleceń.
   - **Ścieżka CLI** (zaawansowane): opcjonalna ścieżka do uruchamialnego punktu wejścia/pliku binarnego `openclaw` (wypełniana automatycznie, gdy jest ogłaszana).
3. Naciśnij **Testuj zdalne**. Sukces oznacza, że zdalne `openclaw status --json` działa poprawnie. Błędy zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie znaleziono zdalnie.
4. Kontrole stanu i Web Chat będą teraz automatycznie działać przez wybrany transport.

## Web Chat

- **Tunel SSH**: Web Chat łączy się z Gateway przez przekierowany port sterowania WebSocket (domyślnie 18789).
- **Bezpośredni (ws/wss)**: Web Chat łączy się bezpośrednio ze skonfigurowanym adresem URL Gateway.
- Nie ma już oddzielnego serwera HTTP WebChat.

## Uprawnienia

- Zdalny host potrzebuje tych samych zgód TCC co lokalny (Automatyzacja, Dostępność, Nagrywanie ekranu, Mikrofon, Rozpoznawanie mowy, Powiadomienia). Uruchom onboarding na tej maszynie, aby przyznać je raz.
- Node ogłaszają swój stan uprawnień przez `node.list` / `node.describe`, dzięki czemu agenci wiedzą, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj wiązania loopback na zdalnym hoście i łącz się przez SSH, Tailscale Serve albo zaufany bezpośredni adres URL Tailnet/LAN.
- Tunelowanie SSH używa ścisłego sprawdzania klucza hosta; najpierw zaufaj kluczowi hosta, aby znalazł się w `~/.ssh/known_hosts`.
- Jeśli wiążesz Gateway z interfejsem innym niż loopback, wymagaj prawidłowego uwierzytelniania Gateway: tokenu, hasła albo zwrotnego serwera proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalny)

- Uruchom `openclaw channels login --verbose` **na zdalnym hoście**. Zeskanuj kod QR za pomocą WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnienie wygaśnie. Kontrola stanu pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **kod wyjścia 127 / nie znaleziono**: `openclaw` nie jest w PATH dla powłok bez logowania. Dodaj go do `/etc/paths`, pliku rc powłoki albo utwórz symlink do `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda stanu nie powiodła się**: sprawdź osiągalność SSH, PATH oraz czy Baileys jest zalogowany (`openclaw status --json`).
- **Web Chat się zawiesił**: potwierdź, że Gateway działa na zdalnym hoście i że przekierowany port odpowiada portowi WS Gateway; interfejs wymaga zdrowego połączenia WS.
- **Adres IP Node pokazuje 127.0.0.1**: oczekiwane przy tunelu SSH. Przełącz **Transport** na **Bezpośredni (ws/wss)**, jeśli chcesz, aby Gateway widział rzeczywisty adres IP klienta.
- **Dashboard działa, ale możliwości Maca są offline**: oznacza to, że połączenie operatora/sterowania aplikacji jest zdrowe, ale połączenie towarzyszącego Node nie jest połączone albo brakuje mu powierzchni poleceń. Otwórz sekcję urządzenia na pasku menu i sprawdź, czy Mac jest `paired · disconnected`. Dla punktów końcowych Tailscale Serve `wss://*.ts.net` aplikacja wykrywa nieaktualne starsze piny liścia TLS po rotacji certyfikatu, czyści nieaktualny pin, gdy macOS ufa nowemu certyfikatowi, i automatycznie ponawia próbę. Jeśli certyfikat nie jest zaufany przez system albo host nie jest nazwą Tailscale Serve, ustaw `gateway.remote.tlsFingerprint` na oczekiwany odcisk palca certyfikatu, przejrzyj certyfikat albo przełącz na **Zdalny przez SSH**.
- **Voice Wake**: frazy wybudzające są przekazywane automatycznie w trybie zdalnym; oddzielny forwarder nie jest potrzebny.

## Dźwięki powiadomień

Wybieraj dźwięki dla poszczególnych powiadomień ze skryptów za pomocą `openclaw` i `node.invoke`, np.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Nie ma już w aplikacji globalnego przełącznika „domyślnego dźwięku”; wywołujący wybierają dźwięk (albo jego brak) dla każdego żądania.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Zdalny dostęp](/pl/gateway/remote)
