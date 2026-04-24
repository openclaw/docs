---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania na Macu
summary: Przepływ aplikacji macOS do sterowania zdalną Gateway OpenClaw przez SSH
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-04-24T09:21:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Zdalny OpenClaw (macOS ⇄ zdalny host)

Ten przepływ pozwala aplikacji macOS działać jako pełne zdalne sterowanie dla Gateway OpenClaw działającej na innym hoście (desktop/serwer). To funkcja aplikacji **Remote over SSH** (zdalne uruchamianie). Wszystkie funkcje — kontrole kondycji, przekazywanie Voice Wake i Web Chat — używają tej samej konfiguracji zdalnego SSH z _Settings → General_.

## Tryby

- **Local (ten Mac)**: wszystko działa na laptopie. SSH nie jest używane.
- **Remote over SSH (domyślnie)**: polecenia OpenClaw są wykonywane na zdalnym hoście. Aplikacja Mac otwiera połączenie SSH z `-o BatchMode` oraz wybraną tożsamością/kluczem i lokalnym przekierowaniem portu.
- **Remote direct (ws/wss)**: bez tunelu SSH. Aplikacja Mac łączy się bezpośrednio z URL Gateway (na przykład przez Tailscale Serve albo publiczny reverse proxy HTTPS).

## Zdalne transporty

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślnie): używa `ssh -N -L ...` do przekierowania portu Gateway na localhost. Gateway zobaczy IP node jako `127.0.0.1`, ponieważ tunel działa przez loopback.
- **Direct (ws/wss)**: łączy się bezpośrednio z URL Gateway. Gateway widzi prawdziwy adres IP klienta.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm i zbuduj/zainstaluj CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest na PATH dla nieinteraktywnych powłok (w razie potrzeby dodaj symlink do `/usr/local/bin` albo `/opt/homebrew/bin`).
3. Włącz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale** dla stabilnej osiągalności poza LAN.

## Konfiguracja aplikacji macOS

1. Otwórz _Settings → General_.
2. W sekcji **OpenClaw runs** wybierz **Remote over SSH** i ustaw:
   - **Transport**: **SSH tunnel** albo **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcjonalnie `:port`).
     - Jeśli Gateway znajduje się w tym samym LAN i reklamuje się przez Bonjour, wybierz ją z wykrytej listy, aby automatycznie uzupełnić to pole.
   - **Gateway URL** (tylko Direct): `wss://gateway.example.ts.net` (albo `ws://...` dla lokalnego/LAN).
   - **Identity file** (zaawansowane): ścieżka do twojego klucza.
   - **Project root** (zaawansowane): ścieżka do zdalnego checkout używana przez polecenia.
   - **CLI path** (zaawansowane): opcjonalna ścieżka do uruchamialnego entrypoint/binarnego `openclaw` (uzupełniana automatycznie, gdy jest reklamowana).
3. Kliknij **Test remote**. Sukces oznacza, że zdalne `openclaw status --json` działa poprawnie. Błędy zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie zostało znalezione zdalnie.
4. Kontrole kondycji i Web Chat będą teraz automatycznie działać przez ten tunel SSH.

## Web Chat

- **Tunel SSH**: Web Chat łączy się z Gateway przez przekierowany port kontrolny WebSocket (domyślnie 18789).
- **Direct (ws/wss)**: Web Chat łączy się bezpośrednio z skonfigurowanym URL Gateway.
- Nie ma już osobnego serwera HTTP WebChat.

## Uprawnienia

- Zdalny host potrzebuje tych samych zatwierdzeń TCC co lokalny (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Uruchom onboarding na tej maszynie, aby nadać je jednorazowo.
- Node reklamują swój stan uprawnień przez `node.list` / `node.describe`, aby agenci wiedzieli, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj bind do loopback na zdalnym hoście i łącz się przez SSH albo Tailscale.
- Tunelowanie SSH używa ścisłego sprawdzania klucza hosta; najpierw zaufaj kluczowi hosta, aby istniał w `~/.ssh/known_hosts`.
- Jeśli bindowanie Gateway odbywa się do interfejsu innego niż loopback, wymagaj poprawnego uwierzytelniania Gateway: tokena, hasła albo reverse proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalnie)

- Uruchom `openclaw channels login --verbose` **na zdalnym hoście**. Zeskanuj kod QR w WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnianie wygaśnie. Kontrola kondycji pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **exit 127 / not found**: `openclaw` nie znajduje się na PATH dla powłok bez logowania. Dodaj je do `/etc/paths`, pliku rc swojej powłoki albo dodaj symlink do `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: sprawdź osiągalność SSH, PATH i czy Baileys jest zalogowany (`openclaw status --json`).
- **Web Chat utknął**: potwierdź, że Gateway działa na zdalnym hoście i że przekierowany port odpowiada portowi WS Gateway; interfejs wymaga zdrowego połączenia WS.
- **Node IP pokazuje 127.0.0.1**: to oczekiwane przy tunelu SSH. Przełącz **Transport** na **Direct (ws/wss)**, jeśli chcesz, aby Gateway widziała prawdziwy IP klienta.
- **Voice Wake**: frazy wyzwalające są przekazywane automatycznie w trybie zdalnym; nie jest potrzebny osobny forwarder.

## Dźwięki powiadomień

Wybieraj dźwięki dla każdego powiadomienia ze skryptów za pomocą `openclaw` i `node.invoke`, na przykład:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

W aplikacji nie ma już globalnego przełącznika „default sound”; wywołujący wybierają dźwięk (albo brak) dla każdego żądania osobno.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Dostęp zdalny](/pl/gateway/remote)
