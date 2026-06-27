---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania Macem
summary: Przepływ aplikacji macOS do sterowania zdalnym Gateway OpenClaw
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-06-27T17:47:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ten przepływ pozwala aplikacji macOS działać jako pełny zdalny pilot dla Gateway OpenClaw uruchomionego na innym hoście (komputerze/serwerze). Aplikacja może łączyć się bezpośrednio z zaufanymi adresami URL Gateway w sieci LAN/Tailnet albo zarządzać tunelem SSH, gdy zdalny Gateway jest dostępny tylko przez local loopback. Kontrole kondycji, przekazywanie Voice Wake i Web Chat używają tej samej konfiguracji zdalnej z _Settings → General_.

## Tryby

- **Lokalny (ten Mac)**: Wszystko działa na laptopie. Bez SSH.
- **Zdalny przez SSH (domyślny)**: Polecenia OpenClaw są wykonywane na zdalnym hoście. Aplikacja na Macu otwiera połączenie SSH z `-o BatchMode` oraz wybraną tożsamością/kluczem i lokalnym przekierowaniem portu.
- **Zdalny bezpośredni (ws/wss)**: Bez tunelu SSH. Aplikacja na Macu łączy się bezpośrednio z adresem URL Gateway (na przykład przez LAN, Tailscale, Tailscale Serve albo publiczny odwrotny proxy HTTPS).

## Zdalne transporty

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślny): Używa `ssh -N -L ...`, aby przekierować port Gateway do localhost. Gateway zobaczy adres IP węzła jako `127.0.0.1`, ponieważ tunel używa local loopback.
- **Bezpośredni (ws/wss)**: Łączy się prosto z adresem URL Gateway. Gateway widzi rzeczywisty adres IP klienta.

W trybie tunelu SSH wykryte nazwy hostów LAN/tailnet są zapisywane jako
`gateway.remote.sshTarget`. Aplikacja utrzymuje `gateway.remote.url` na lokalnym
punkcie końcowym tunelu, na przykład `ws://127.0.0.1:18789`, dzięki czemu CLI, Web Chat i
lokalna usługa hosta węzła używają tego samego bezpiecznego transportu local loopback.
Jeśli lokalny port tunelu różni się od portu zdalnego Gateway, ustaw
`gateway.remote.remotePort` na port na zdalnym hoście.

Automatyzacja przeglądarki w trybie zdalnym należy do hosta węzła CLI, a nie do
natywnego węzła aplikacji macOS. Aplikacja uruchamia zainstalowaną usługę hosta węzła, gdy
to możliwe; jeśli potrzebujesz sterowania przeglądarką z tego Maca, zainstaluj/uruchom ją za pomocą
`openclaw node install ...` i `openclaw node start` (albo uruchom
`openclaw node run ...` na pierwszym planie), a następnie kieruj zadania do tego
węzła z obsługą przeglądarki.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm i zbuduj/zainstaluj CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest w PATH dla powłok nieinteraktywnych (w razie potrzeby utwórz dowiązanie symboliczne w `/usr/local/bin` albo `/opt/homebrew/bin`).
3. Tylko dla transportu SSH: otwórz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale** dla stabilnej dostępności poza LAN.

## Konfiguracja aplikacji macOS

Aby wstępnie skonfigurować aplikację bez przepływu powitalnego:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

W przypadku Gateway dostępnego już w zaufanej sieci LAN albo Tailnet całkowicie pomiń SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

To zapisuje konfigurację zdalną, oznacza wdrożenie jako ukończone i pozwala aplikacji zarządzać
wybranym transportem po uruchomieniu.

1. Otwórz _Settings → General_.
2. W sekcji **OpenClaw runs** wybierz **Remote** i ustaw:
   - **Transport**: **SSH tunnel** albo **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcjonalnie `:port`).
     - Jeśli Gateway jest w tej samej sieci LAN i ogłasza się przez Bonjour, wybierz go z listy wykrytych, aby automatycznie wypełnić to pole.
   - **Gateway URL** (tylko Direct): `wss://gateway.example.ts.net` (albo `ws://...` dla lokalnego/LAN).
   - **Identity file** (zaawansowane): ścieżka do klucza.
   - **Project root** (zaawansowane): ścieżka zdalnego checkoutu używana do poleceń.
   - **CLI path** (zaawansowane): opcjonalna ścieżka do uruchamialnego punktu wejścia/pliku binarnego `openclaw` (wypełniana automatycznie, gdy jest ogłaszana).
3. Kliknij **Test remote**. Powodzenie oznacza, że zdalne `openclaw status --json` działa poprawnie. Błędy zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie znaleziono zdalnie.
4. Kontrole kondycji i Web Chat będą teraz automatycznie działać przez wybrany transport.

## Web Chat

- **Tunel SSH**: Web Chat łączy się z Gateway przez przekierowany port sterowania WebSocket (domyślnie 18789).
- **Bezpośredni (ws/wss)**: Web Chat łączy się prosto ze skonfigurowanym adresem URL Gateway.
- Nie ma już osobnego serwera HTTP WebChat.

## Uprawnienia

- Zdalny host potrzebuje tych samych zgód TCC co lokalny (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Uruchom wdrożenie na tej maszynie, aby przyznać je raz.
- Węzły ogłaszają swój stan uprawnień przez `node.list` / `node.describe`, aby agenci wiedzieli, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj wiązania local loopback na zdalnym hoście i łącz się przez SSH, Tailscale Serve albo zaufany bezpośredni adres URL Tailnet/LAN.
- Tunelowanie SSH używa ścisłego sprawdzania klucza hosta; najpierw zaufaj kluczowi hosta, aby znalazł się w `~/.ssh/known_hosts`.
- Jeśli powiążesz Gateway z interfejsem innym niż local loopback, wymagaj prawidłowego uwierzytelniania Gateway: tokenu, hasła albo odwrotnego proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalny)

- Uruchom `openclaw channels login --verbose` **na zdalnym hoście**. Zeskanuj kod QR za pomocą WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnienie wygaśnie. Kontrola kondycji pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **kod wyjścia 127 / nie znaleziono**: `openclaw` nie jest w PATH dla powłok nielogowania. Dodaj go do `/etc/paths`, pliku rc powłoki albo utwórz dowiązanie symboliczne w `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda kondycji nie powiodła się**: sprawdź dostępność SSH, PATH oraz czy Baileys jest zalogowany (`openclaw status --json`).
- **Web Chat utknął**: potwierdź, że Gateway działa na zdalnym hoście i że przekierowany port pasuje do portu WS Gateway; interfejs użytkownika wymaga zdrowego połączenia WS.
- **Adres IP węzła pokazuje 127.0.0.1**: oczekiwane przy tunelu SSH. Przełącz **Transport** na **Direct (ws/wss)**, jeśli chcesz, aby Gateway widział rzeczywisty adres IP klienta.
- **Dashboard działa, ale możliwości Maca są offline**: oznacza to, że połączenie operatora/sterowania aplikacji jest zdrowe, ale połączenie węzła towarzyszącego nie jest podłączone albo brakuje mu powierzchni poleceń. Otwórz sekcję urządzenia na pasku menu i sprawdź, czy Mac jest `paired · disconnected`. Dla punktów końcowych Tailscale Serve `wss://*.ts.net` aplikacja wykrywa przestarzałe stare przypięcia liścia TLS po rotacji certyfikatu, czyści przestarzałe przypięcie, gdy macOS ufa nowemu certyfikatowi, i ponawia próbę automatycznie. Jeśli certyfikat nie jest zaufany przez system albo host nie jest nazwą Tailscale Serve, ustaw `gateway.remote.tlsFingerprint` na oczekiwany odcisk certyfikatu, przejrzyj certyfikat albo przełącz na **Remote over SSH**.
- **Voice Wake**: frazy wyzwalające są automatycznie przekazywane w trybie zdalnym; osobny mechanizm przekazywania nie jest potrzebny.

## Dźwięki powiadomień

Wybieraj dźwięki dla poszczególnych powiadomień ze skryptów za pomocą `openclaw` i `node.invoke`, np.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

W aplikacji nie ma już globalnego przełącznika „domyślnego dźwięku”; wywołujący wybierają dźwięk (albo jego brak) dla każdego żądania.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Dostęp zdalny](/pl/gateway/remote)
