---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania z Maca
summary: Przepływ aplikacji macOS do sterowania zdalnym gateway OpenClaw przez SSH
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-04-05T14:00:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Zdalny OpenClaw (macOS ⇄ zdalny host)

Ten przepływ pozwala aplikacji macOS działać jako pełne zdalne sterowanie dla gateway OpenClaw działającego na innym hoście (desktop/serwer). To funkcja aplikacji **Remote over SSH** (zdalne uruchamianie). Wszystkie funkcje — sprawdzanie kondycji, przekazywanie Voice Wake i Web Chat — używają tej samej zdalnej konfiguracji SSH z _Settings → General_.

## Tryby

- **Local (ten Mac)**: Wszystko działa na laptopie. Bez udziału SSH.
- **Remote over SSH (domyślnie)**: Polecenia OpenClaw są wykonywane na zdalnym hoście. Aplikacja Mac otwiera połączenie SSH z `-o BatchMode` oraz wybraną tożsamością/kluczem i lokalnym przekierowaniem portu.
- **Remote direct (ws/wss)**: Bez tunelu SSH. Aplikacja Mac łączy się bezpośrednio z URL gateway (na przykład przez Tailscale Serve lub publiczny reverse proxy HTTPS).

## Zdalne transporty

Tryb zdalny obsługuje dwa transporty:

- **Tunel SSH** (domyślnie): Używa `ssh -N -L ...` do przekierowania portu gateway na localhost. Gateway będzie widział adres IP węzła jako `127.0.0.1`, ponieważ tunel używa loopback.
- **Direct (ws/wss)**: Łączy się bezpośrednio z URL gateway. Gateway widzi rzeczywisty adres IP klienta.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm i zbuduj/zainstaluj CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` jest w PATH dla nieinteraktywnych powłok (w razie potrzeby utwórz symlink w `/usr/local/bin` lub `/opt/homebrew/bin`).
3. Otwórz SSH z uwierzytelnianiem kluczem. Zalecamy adresy IP **Tailscale** dla stabilnej osiągalności poza LAN.

## Konfiguracja aplikacji macOS

1. Otwórz _Settings → General_.
2. W sekcji **OpenClaw runs** wybierz **Remote over SSH** i ustaw:
   - **Transport**: **SSH tunnel** albo **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcjonalnie `:port`).
     - Jeśli gateway znajduje się w tej samej sieci LAN i ogłasza się przez Bonjour, wybierz go z wykrytej listy, aby automatycznie wypełnić to pole.
   - **Gateway URL** (tylko Direct): `wss://gateway.example.ts.net` (lub `ws://...` dla lokalnej sieci/LAN).
   - **Identity file** (zaawansowane): ścieżka do Twojego klucza.
   - **Project root** (zaawansowane): ścieżka do zdalnego checkoutu używana dla poleceń.
   - **CLI path** (zaawansowane): opcjonalna ścieżka do uruchamialnego entrypointu/binary `openclaw` (uzupełniana automatycznie, gdy jest ogłaszana).
3. Kliknij **Test remote**. Sukces oznacza, że zdalne `openclaw status --json` działa poprawnie. Niepowodzenia zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie zostało znalezione zdalnie.
4. Sprawdzanie kondycji i Web Chat będą teraz automatycznie działać przez ten tunel SSH.

## Web Chat

- **Tunel SSH**: Web Chat łączy się z gateway przez przekierowany port sterowania WebSocket (domyślnie 18789).
- **Direct (ws/wss)**: Web Chat łączy się bezpośrednio z skonfigurowanym URL gateway.
- Nie ma już oddzielnego serwera HTTP WebChat.

## Uprawnienia

- Zdalny host potrzebuje tych samych zgód TCC co lokalny (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Uruchom onboarding na tej maszynie, aby nadać je jednorazowo.
- Węzły ogłaszają swój stan uprawnień przez `node.list` / `node.describe`, aby agenci wiedzieli, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj bind do loopback na zdalnym hoście i łącz się przez SSH lub Tailscale.
- Tunelowanie SSH używa ścisłego sprawdzania klucza hosta; najpierw zaufaj kluczowi hosta, aby istniał w `~/.ssh/known_hosts`.
- Jeśli bindujesz Gateway do interfejsu innego niż loopback, wymagaj prawidłowego uwierzytelniania Gateway: tokena, hasła lub reverse proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Security](/gateway/security) i [Tailscale](/gateway/tailscale).

## Przepływ logowania WhatsApp (zdalnie)

- Uruchom `openclaw channels login --verbose` **na zdalnym hoście**. Zeskanuj kod QR w WhatsApp na telefonie.
- Uruchom logowanie ponownie na tym hoście, jeśli uwierzytelnianie wygaśnie. Sprawdzanie kondycji pokaże problemy z połączeniem.

## Rozwiązywanie problemów

- **exit 127 / not found**: `openclaw` nie jest w PATH dla powłok bez logowania. Dodaj je do `/etc/paths`, pliku rc swojej powłoki albo utwórz symlink w `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: sprawdź osiągalność SSH, PATH i to, czy Baileys jest zalogowane (`openclaw status --json`).
- **Web Chat zawiesza się**: potwierdź, że gateway działa na zdalnym hoście i że przekierowany port odpowiada portowi WS gateway; UI wymaga zdrowego połączenia WS.
- **IP węzła pokazuje 127.0.0.1**: oczekiwane przy tunelu SSH. Przełącz **Transport** na **Direct (ws/wss)**, jeśli chcesz, aby gateway widział rzeczywisty adres IP klienta.
- **Voice Wake**: frazy wyzwalające są automatycznie przekazywane w trybie zdalnym; nie jest potrzebny osobny forwarder.

## Dźwięki powiadomień

Wybieraj dźwięki dla każdego powiadomienia ze skryptów przy użyciu `openclaw` i `node.invoke`, na przykład:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

W aplikacji nie ma już globalnego przełącznika „default sound”; wywołujący wybierają dźwięk (lub jego brak) osobno dla każdego żądania.
