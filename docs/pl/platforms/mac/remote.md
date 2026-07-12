---
read_when:
    - Konfigurowanie lub debugowanie zdalnego sterowania komputerem Mac
summary: Przepływ aplikacji macOS do sterowania zdalnym Gateway OpenClaw
title: Zdalne sterowanie
x-i18n:
    generated_at: "2026-07-12T15:20:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Ten przepływ pozwala aplikacji macOS działać jako pełny pilot zdalnego sterowania Gatewayem OpenClaw uruchomionym na innym hoście (komputerze stacjonarnym/serwerze). Aplikacja łączy się bezpośrednio z zaufanymi adresami URL Gatewaya w sieci LAN/Tailnet albo zarządza tunelem SSH, gdy zdalny Gateway nasłuchuje wyłącznie przez local loopback. Kontrole kondycji, przekazywanie funkcji Voice Wake i Web Chat korzystają z tej samej konfiguracji zdalnej z _Settings -> General_.

## Tryby

- **Lokalnie (ten Mac)**: wszystko działa na laptopie; SSH nie jest używane.
- **Zdalnie przez SSH (domyślnie)**: polecenia OpenClaw są uruchamiane na zdalnym hoście. Aplikacja otwiera połączenie SSH z opcją `-o BatchMode`, wybraną tożsamością/kluczem i lokalnym przekierowaniem portu.
- **Bezpośrednio zdalnie (ws/wss)**: bez tunelu SSH; aplikacja łączy się bezpośrednio z adresem URL Gatewaya (LAN, Tailscale, Tailscale Serve lub publiczne odwrotne proxy HTTPS).

## Transporty zdalne

- **Tunel SSH** (domyślnie): używa `ssh -N -L ...`, aby przekierować port Gatewaya do localhosta. Gateway widzi adres IP Node'a jako `127.0.0.1`, ponieważ tunel korzysta z local loopback.
- **Bezpośredni (ws/wss)**: łączy się wprost z adresem URL Gatewaya. Gateway widzi rzeczywisty adres IP klienta.

Aplikacja wyłącza multipleksowanie połączeń SSH i przechodzenie w tło po uwierzytelnieniu dla własnych procesów SSH, aby mogła monitorować i ponownie uruchamiać dokładnie ten proces, nawet jeśli wybrany alias włącza `ControlMaster` lub `ForkAfterAuthentication`.

Weryfikacja klucza hosta SSH jest domyślnie rygorystyczna, ponieważ dane uwierzytelniające Gatewaya są przesyłane przez ten tunel. Aby użyć własnego sposobu ustalania zaufania zarządzanego aliasu SSH, ustaw `--ssh-host-key-policy openssh` za pomocą `openclaw-mac configure-remote` albo ustaw bezpośrednio `gateway.remote.sshHostKeyPolicy` na `"openssh"`. Przed włączeniem tej opcji sprawdź alias oraz każdą pasującą konfigurację `Host *` lub konfigurację systemową. Zmiana celu SSH (w aplikacji lub za pomocą `configure-remote`) przywraca zasadę `strict`, chyba że ponownie jawnie włączysz tę opcję dla nowego celu.

W trybie tunelu SSH wykryte nazwy hostów LAN/Tailnet są zapisywane jako `gateway.remote.sshTarget`. Aplikacja pozostawia `gateway.remote.url` ustawiony na lokalny punkt końcowy tunelu (na przykład `ws://127.0.0.1:18789`), dzięki czemu CLI, Web Chat i lokalna usługa hosta Node'a używają tego samego transportu local loopback. Gdy wykrywanie zwraca zarówno nieprzetworzone adresy IP Tailnet, jak i stabilne nazwy hostów, aplikacja preferuje nazwy Tailscale MagicDNS lub LAN, aby połączenia lepiej znosiły zmiany adresów. Jeśli lokalny port tunelu różni się od portu zdalnego Gatewaya, ustaw `gateway.remote.remotePort` na port używany na zdalnym hoście.

Za automatyzację przeglądarki w trybie zdalnym odpowiada host Node'a CLI, a nie natywny Node aplikacji macOS. Gdy jest to możliwe, aplikacja uruchamia zainstalowaną usługę hosta Node'a; aby włączyć sterowanie przeglądarką z tego Maca, zainstaluj/uruchom ją za pomocą `openclaw node install ...` i `openclaw node start` (albo uruchom `openclaw node run ...` na pierwszym planie), a następnie wybierz jako cel Node obsługujący przeglądarkę.

## Wymagania wstępne na zdalnym hoście

1. Zainstaluj Node + pnpm oraz zbuduj/zainstaluj CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Upewnij się, że `openclaw` znajduje się w PATH dla powłok nieinteraktywnych (w razie potrzeby utwórz dowiązanie symboliczne w `/usr/local/bin` lub `/opt/homebrew/bin`).
3. Dla transportu SSH: skonfiguruj uwierzytelnianie SSH oparte na kluczach. Adresy IP Tailscale są zalecane w celu zapewnienia stabilnej dostępności spoza sieci LAN.

## Konfiguracja aplikacji macOS

Aby wstępnie skonfigurować aplikację bez przechodzenia przez ekran powitalny, za pośrednictwem SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Lub w przypadku Gatewaya dostępnego już w zaufanej sieci LAN lub Tailnet całkowicie pomiń SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Obie formy zapisują `~/.openclaw/openclaw.json`, oznaczają wdrażanie jako ukończone i pozwalają aplikacji zarządzać wybranym transportem przy następnym uruchomieniu. Domyślna wartość opcji `--local-port`/`--remote-port` to `18789`. Inne flagi: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Uruchom `openclaw-mac configure-remote --help`, aby wyświetlić pełną dokumentację.

Aby zamiast tego skonfigurować aplikację w interfejsie użytkownika:

1. Otwórz _Settings -> General_.
2. W sekcji **OpenClaw runs** wybierz **Remote** i ustaw:
   - **Transport**: **SSH tunnel** lub **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcjonalnie `:port`). Jeśli Gateway znajduje się w tej samej sieci LAN i rozgłasza się przez Bonjour, wybierz go z listy wykrytych urządzeń, aby automatycznie wypełnić to pole.
   - **Gateway URL** (tylko tryb bezpośredni): `wss://gateway.example.ts.net` (lub `ws://...` dla połączenia lokalnego/LAN).
   - **Identity file** (zaawansowane): ścieżka do klucza.
   - **Project root** (zaawansowane): ścieżka zdalnego repozytorium używana do wykonywania poleceń.
   - **CLI path** (zaawansowane): opcjonalna ścieżka do uruchamialnego punktu wejścia/pliku binarnego `openclaw` (wypełniana automatycznie, gdy jest rozgłaszana).
3. Naciśnij **Test remote**. Powodzenie oznacza, że zdalne polecenie `openclaw status --json` zostało wykonane prawidłowo. Niepowodzenia zwykle oznaczają problemy z PATH/CLI; kod wyjścia 127 oznacza, że CLI nie zostało znalezione na zdalnym hoście.
4. Kontrole kondycji i Web Chat działają teraz automatycznie przez wybrany transport.

## Web Chat

- **Tunel SSH**: łączy się z Gatewayem przez przekierowany port sterowania WebSocket (domyślnie 18789).
- **Bezpośredni (ws/wss)**: łączy się wprost ze skonfigurowanym adresem URL Gatewaya.
- Nie istnieje osobny serwer HTTP Web Chat.

## Uprawnienia

- Zdalny host wymaga tych samych zatwierdzeń TCC co host lokalny (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Uruchom raz wdrażanie na tym komputerze, aby je nadać.
- Node'y ogłaszają stan swoich uprawnień za pośrednictwem `node.list` / `node.describe`, dzięki czemu agenci wiedzą, co jest dostępne.

## Uwagi dotyczące bezpieczeństwa

- Preferuj powiązania local loopback na zdalnym hoście i łącz się przez SSH, Tailscale Serve albo bezpośredni, zaufany adres URL Tailnet/LAN.
- Tunelowanie SSH domyślnie wymaga wcześniej zaufanego klucza hosta. Najpierw zaufaj kluczowi hosta (dodaj go do skonfigurowanego pliku znanych hostów) albo jawnie ustaw `gateway.remote.sshHostKeyPolicy: "openssh"` dla zarządzanego aliasu, którego zasady zaufania OpenSSH akceptujesz.
- Jeśli powiążesz Gateway z interfejsem innym niż local loopback, wymagaj prawidłowego uwierzytelniania Gatewaya: tokenu, hasła lub odwrotnego proxy rozpoznającego tożsamość z ustawieniem `gateway.auth.mode: "trusted-proxy"`.
- Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Tailscale](/pl/gateway/tailscale).

## Proces logowania do WhatsApp (zdalnie)

- Uruchom `openclaw channels login --channel whatsapp --verbose` **na zdalnym hoście**. Zeskanuj kod QR za pomocą WhatsApp na telefonie.
- Jeśli uwierzytelnienie wygaśnie, ponownie wykonaj logowanie na tym hoście. Kontrola kondycji zgłasza problemy z połączeniem.

## Rozwiązywanie problemów

| Objaw                                           | Przyczyna / rozwiązanie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `exit 127` / nie znaleziono                     | Polecenie `openclaw` nie znajduje się w zmiennej PATH dla powłok bez logowania. Dodaj je do `/etc/paths` lub pliku rc swojej powłoki albo utwórz dowiązanie symboliczne w `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Sonda kondycji nie powiodła się                 | Sprawdź dostępność przez SSH, zmienną PATH oraz czy Baileys (WhatsApp) jest zalogowany (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Czat internetowy nie odpowiada                  | Upewnij się, że Gateway działa na zdalnym hoście, a przekierowany port odpowiada portowi WS Gateway; interfejs użytkownika wymaga prawidłowego połączenia WS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Adres IP węzła to `127.0.0.1`                   | Jest to oczekiwane w przypadku tunelu SSH. Przełącz **Transport** na **Direct (ws/wss)**, jeśli chcesz, aby Gateway widział rzeczywisty adres IP klienta.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Panel działa, ale funkcje Maca są niedostępne   | Połączenie operatora/sterujące działa prawidłowo, ale połączenie węzła towarzyszącego nie jest nawiązane albo brakuje w nim dostępnych poleceń. Otwórz sekcję urządzeń na pasku menu i sprawdź, czy Mac ma stan `paired · disconnected`. W przypadku punktów końcowych Tailscale Serve `wss://*.ts.net` aplikacja wykrywa nieaktualne przypięcia certyfikatów TLS pozostałe po rotacji certyfikatu, usuwa takie przypięcie, gdy system macOS zaufa nowemu certyfikatowi, i automatycznie ponawia próbę. Jeśli certyfikat nie jest zaufany przez system lub host nie ma nazwy Tailscale Serve, ustaw `gateway.remote.tlsFingerprint` na oczekiwany odcisk certyfikatu, sprawdź certyfikat albo przełącz na **Zdalnie przez SSH**. |
| Wybudzanie głosowe                              | Frazy wyzwalające są automatycznie przekazywane w trybie zdalnym; osobny mechanizm przekazujący nie jest potrzebny.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Dźwięki powiadomień

Wybieraj dźwięki osobno dla każdego powiadomienia ze skryptów korzystających z `openclaw nodes notify`, na przykład:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Zdalny Gateway jest gotowy" --sound Glass
```

Aplikacja nie ma globalnego przełącznika domyślnego dźwięku; kod wywołujący wybiera dźwięk (lub jego brak) dla każdego żądania.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Dostęp zdalny](/pl/gateway/remote)
