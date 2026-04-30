---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania Maciem
summary: Przepływ aplikacji macOS do sterowania zdalnym Gateway OpenClaw przez SSH
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-04-30T16:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# Zdalny OpenClaw (macOS ⇄ host zdalny)

Ten przepływ pozwala aplikacji macOS działać jako pełny pilot zdalnego sterowania dla Gateway OpenClaw uruchomionego na innym hoście (komputerze stacjonarnym/serwerze). Jest to funkcja **Remote over SSH** (uruchamianie zdalne) aplikacji. Wszystkie funkcje — kontrole kondycji, przekazywanie Voice Wake oraz Web Chat — używają tej samej zdalnej konfiguracji SSH z _Settings → General_.

## Tryby

- **Lokalnie (ten Mac)**: Wszystko działa na laptopie. SSH nie jest używane.
- **Remote over SSH (domyślnie)**: Polecenia OpenClaw są wykonywane na hoście zdalnym. Aplikacja mac otwiera połączenie SSH z `-o BatchMode` oraz wybraną tożsamością/kluczem i lokalnym przekierowaniem portu.
- **Zdalnie bezpośrednio (ws/wss)**: Bez tunelu SSH. Aplikacja mac łączy się bezpośrednio z adresem URL Gateway (na przykład przez Tailscale Serve albo publiczny zwrotny serwer proxy HTTPS).

## Transporty zdalne

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślnie): Używa `ssh -N -L ...`, aby przekierować port Gateway na localhost. Gateway zobaczy adres IP węzła jako `127.0.0.1`, ponieważ tunel używa local loopback.
- **Bezpośredni (ws/wss)**: Łączy się prosto z adresem URL Gateway. Gateway widzi rzeczywisty adres IP klienta.

W trybie tunelu SSH wykryte nazwy hostów LAN/tailnet są zapisywane jako
`gateway.remote.sshTarget`. Aplikacja utrzymuje `gateway.remote.url` na lokalnym
punkcie końcowym tunelu, na przykład `ws://127.0.0.1:18789`, dzięki czemu CLI, Web Chat i
lokalna usługa hosta węzła używają tego samego bezpiecznego transportu local loopback.

Automatyzacja przeglądarki w trybie zdalnym należy do hosta węzła CLI, a nie do
natywnego węzła aplikacji macOS. Aplikacja uruchamia zainstalowaną usługę hosta węzła, gdy
to możliwe; jeśli potrzebujesz sterowania przeglądarką z tego Maca, zainstaluj/uruchom ją za pomocą
`openclaw node install ...` i `openclaw node start` (albo uruchom
`openclaw node run ...` na pierwszym planie), a następnie wskaż ten węzeł obsługujący
przeglądarkę.

## Wymagania wstępne na hoście zdalnym

1. Zainstaluj Node + pnpm i zbuduj/zainstaluj CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest w PATH dla powłok nieinteraktywnych (w razie potrzeby dodaj dowiązanie symboliczne do `/usr/local/bin` albo `/opt/homebrew/bin`).
3. Otwórz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale**, aby zapewnić stabilną osiągalność spoza LAN.

## Konfiguracja aplikacji macOS

1. Otwórz _Settings → General_.
2. W sekcji **OpenClaw runs** wybierz **Remote over SSH** i ustaw:
   - **Transport**: **Tunel SSH** albo **Bezpośredni (ws/wss)**.
   - **SSH target**: `user@host` (opcjonalnie `:port`).
     - Jeśli Gateway jest w tej samej sieci LAN i ogłasza się przez Bonjour, wybierz go z wykrytej listy, aby automatycznie uzupełnić to pole.
   - **Gateway URL** (tylko tryb bezpośredni): `wss://gateway.example.ts.net` (albo `ws://...` dla lokalnego/LAN).
   - **Identity file** (zaawansowane): ścieżka do klucza.
   - **Project root** (zaawansowane): ścieżka zdalnego checkoutu używana dla poleceń.
   - **CLI path** (zaawansowane): opcjonalna ścieżka do uruchamialnego punktu wejścia/pliku binarnego `openclaw` (uzupełniana automatycznie, gdy jest ogłaszana).
3. Naciśnij **Test remote**. Sukces oznacza, że zdalne `openclaw status --json` działa poprawnie. Niepowodzenia zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie znaleziono zdalnie.
4. Kontrole kondycji i Web Chat będą teraz automatycznie działać przez ten tunel SSH.

## Web Chat

- **Tunel SSH**: Web Chat łączy się z Gateway przez przekierowany port kontrolny WebSocket (domyślnie 18789).
- **Bezpośredni (ws/wss)**: Web Chat łączy się prosto ze skonfigurowanym adresem URL Gateway.
- Nie ma już osobnego serwera HTTP WebChat.

## Uprawnienia

- Host zdalny potrzebuje tych samych zatwierdzeń TCC co lokalny (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Uruchom onboarding na tej maszynie, aby przyznać je raz.
- Węzły ogłaszają swój stan uprawnień przez `node.list` / `node.describe`, dzięki czemu agenci wiedzą, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj wiązania local loopback na hoście zdalnym i łącz się przez SSH albo Tailscale.
- Tunelowanie SSH używa ścisłego sprawdzania klucza hosta; najpierw zaufaj kluczowi hosta, aby istniał w `~/.ssh/known_hosts`.
- Jeśli wiążesz Gateway z interfejsem innym niż local loopback, wymagaj poprawnego uwierzytelniania Gateway: tokenu, hasła albo zwrotnego serwera proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalny)

- Uruchom `openclaw channels login --verbose` **na hoście zdalnym**. Zeskanuj kod QR za pomocą WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnianie wygaśnie. Kontrola kondycji pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **exit 127 / not found**: `openclaw` nie jest w PATH dla powłok bez logowania. Dodaj go do `/etc/paths`, pliku rc powłoki albo utwórz dowiązanie symboliczne w `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda kondycji nie powiodła się**: sprawdź osiągalność SSH, PATH oraz czy Baileys jest zalogowany (`openclaw status --json`).
- **Web Chat się zatrzymał**: potwierdź, że Gateway działa na hoście zdalnym i przekierowany port odpowiada portowi WS Gateway; UI wymaga zdrowego połączenia WS.
- **IP węzła pokazuje 127.0.0.1**: oczekiwane przy tunelu SSH. Przełącz **Transport** na **Bezpośredni (ws/wss)**, jeśli chcesz, aby Gateway widział rzeczywisty adres IP klienta.
- **Dashboard działa, ale możliwości Maca są offline**: oznacza to, że połączenie operatora/sterowania aplikacji jest zdrowe, ale połączenie węzła towarzyszącego nie jest połączone albo brakuje mu powierzchni poleceń. Otwórz sekcję urządzenia na pasku menu i sprawdź, czy Mac ma stan `paired · disconnected`. Dla punktów końcowych Tailscale Serve `wss://*.ts.net` aplikacja wykrywa nieaktualne starsze przypięcia liścia TLS po rotacji certyfikatu, czyści nieaktualne przypięcie, gdy macOS ufa nowemu certyfikatowi, i ponawia próbę automatycznie. Jeśli certyfikat nie jest zaufany przez system albo host nie jest nazwą Tailscale Serve, sprawdź certyfikat albo przełącz się na **Remote over SSH**.
- **Voice Wake**: frazy wyzwalające są automatycznie przekazywane w trybie zdalnym; osobny przekaźnik nie jest potrzebny.

## Dźwięki powiadomień

Wybieraj dźwięki dla każdego powiadomienia ze skryptów za pomocą `openclaw` i `node.invoke`, np.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

W aplikacji nie ma już globalnego przełącznika „domyślnego dźwięku”; wywołujący wybierają dźwięk (albo żaden) dla każdego żądania.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Dostęp zdalny](/pl/gateway/remote)
