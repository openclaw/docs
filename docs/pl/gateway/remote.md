---
read_when:
    - Uruchamianie lub rozwiązywanie problemów ze zdalnymi konfiguracjami Gateway
summary: Zdalny dostęp przy użyciu Gateway WS, tuneli SSH i sieci tailnet
title: Dostęp zdalny
x-i18n:
    generated_at: "2026-07-12T15:09:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw uruchamia jeden Gateway (główny) na hoście i łączy z nim każdego klienta. Gateway zarządza sesjami, profilami uwierzytelniania, kanałami i stanem; wszystko inne jest klientem.

- **Operatorzy** (Ty lub aplikacja macOS): bezpośrednie połączenie WebSocket przez LAN/Tailnet jest najprostsze, gdy Gateway jest osiągalny; tunelowanie SSH stanowi uniwersalne rozwiązanie awaryjne.
- **Node’y** (iOS/Android i inne urządzenia): łączą się z **WebSocketem** Gateway (przez LAN/Tailnet lub tunel SSH).

## Główna idea

WebSocket Gateway domyślnie nasłuchuje na **interfejsie loopback**, na porcie `18789` (`gateway.port`). Aby korzystać z niego zdalnie, udostępnij go przez Tailscale Serve / zaufane powiązanie z LAN/Tailnet albo przekieruj port loopback przez SSH.

## Opcje topologii

| Konfiguracja                         | Gdzie działa Gateway                                                                                      | Najlepsze zastosowanie                                                                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale aktywny Gateway w Twoim tailnecie | Stały host (VPS lub serwer domowy), dostępny przez Tailscale lub SSH                                   | Laptopy, które często przechodzą w stan uśpienia, ale wymagają stale aktywnego agenta. Zobacz [exe.dev](/pl/install/exe-dev) (prosta maszyna wirtualna) lub [Hetzner](/pl/install/hetzner) (produkcyjny VPS). |
| Komputer stacjonarny w domu          | Komputer stacjonarny; laptop łączy się zdalnie przez tryb zdalny aplikacji macOS (Settings → Connection → OpenClaw runs) | Utrzymywanie agenta na sprzęcie, który pozostaje włączony. Instrukcja: [zdalny dostęp w macOS](/pl/platforms/mac/remote). |
| Laptop                               | Laptop bezpiecznie udostępniony przez tunel SSH lub Tailscale Serve (pozostaw `gateway.bind: "loopback"`) | Konfiguracje na jednym komputerze. Zobacz [Tailscale](/pl/gateway/tailscale) i [interfejs WWW](/pl/web). |

W przypadku konfiguracji stale aktywnej i laptopowej najlepiej pozostawić `gateway.bind: "loopback"` i używać **Tailscale Serve** dla interfejsu sterowania albo zaufanego powiązania z LAN/Tailnet wraz z `gateway.remote.transport: "direct"`. Tunel SSH jest rozwiązaniem awaryjnym działającym z każdego komputera.

## Przepływ poleceń (co i gdzie działa)

Jeden Gateway zarządza stanem i kanałami; Node’y są urządzeniami peryferyjnymi. Przykład (wiadomość Telegram przekierowana do narzędzia Node’a):

1. Wiadomość Telegram dociera do **Gateway**.
2. Gateway uruchamia **agenta**, który decyduje, czy wywołać narzędzie Node’a.
3. Gateway wywołuje **Node** przez WebSocket Gateway (RPC `node.invoke`).
4. Node zwraca wynik; Gateway odpowiada w Telegramie.

Node’y nie uruchamiają usługi Gateway. Na jednym hoście powinien działać tylko jeden Gateway, chyba że celowo uruchamiasz odizolowane profile (zobacz [Wiele instancji Gateway](/pl/gateway/multiple-gateways)). „Tryb Node’a” aplikacji macOS jest tylko klientem Node łączącym się przez WebSocket Gateway.

## Tunel SSH (CLI i narzędzia)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Gdy tunel jest aktywny, `openclaw health` i `openclaw status --deep` uzyskują dostęp do zdalnego Gateway przez `ws://127.0.0.1:18789`. Polecenia `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` mogą również wskazywać przekierowany adres URL za pomocą `--url`.

<Note>
Zastąp `18789` skonfigurowaną wartością `gateway.port` (lub `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Opcja `--url` nigdy nie korzysta awaryjnie z poświadczeń z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`; bez nich klient nie wysyła żadnych poświadczeń, a połączenie zakończy się niepowodzeniem, jeśli docelowy Gateway wymaga uwierzytelniania.
</Warning>

## Domyślne ustawienia zdalne CLI

Zapisz zdalny cel, aby polecenia CLI domyślnie z niego korzystały:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Gdy Gateway nasłuchuje wyłącznie na interfejsie loopback, pozostaw adres URL `ws://127.0.0.1:18789` i najpierw otwórz tunel SSH. W transporcie tunelu SSH aplikacji macOS wykryta nazwa hosta Gateway trafia do `gateway.remote.sshTarget` (`user@host` lub `user@host:port`); `gateway.remote.url` pozostaje lokalnym adresem URL tunelu. Jeśli port zdalny różni się od lokalnego, ustaw `gateway.remote.remotePort`.

Weryfikacja klucza hosta jest domyślnie rygorystyczna (`gateway.remote.sshHostKeyPolicy: "strict"`). Ustaw wartość `"openssh"`, aby zamiast tego powierzyć ją obowiązującej konfiguracji OpenSSH; przed włączeniem tej opcji przejrzyj ustawienia SSH użytkownika i systemu.

Dla Gateway, który jest już osiągalny w zaufanej sieci LAN lub Tailnet, użyj trybu bezpośredniego:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Pierwszeństwo poświadczeń

Rozpoznawanie poświadczeń Gateway podlega jednej wspólnej umowie w ścieżkach wywołań, sondowania i stanu oraz podczas monitorowania zatwierdzeń wykonania w Discordzie. Host Node’a używa tej samej umowy z jednym wyjątkiem dla trybu lokalnego (ignoruje `gateway.remote.*`).

- Jawne poświadczenia (`--token`, `--password` lub `gatewayToken` narzędzia) zawsze mają pierwszeństwo w ścieżkach wywołań obsługujących jawne uwierzytelnianie.
- Bezpieczeństwo nadpisania adresu URL:
  - Opcja CLI `--url` nigdy nie używa niejawnych poświadczeń z konfiguracji ani środowiska.
  - Zmienna środowiskowa `OPENCLAW_GATEWAY_URL` może używać wyłącznie poświadczeń ze środowiska (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Domyślne ustawienia trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (zdalna wartość awaryjna tylko wtedy, gdy token lokalny nie jest ustawiony)
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (zdalna wartość awaryjna tylko wtedy, gdy hasło lokalne nie jest ustawione)
- Domyślne ustawienia trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek trybu lokalnego hosta Node’a: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Zdalne kontrole tokena podczas sondowania/sprawdzania stanu są domyślnie rygorystyczne: gdy celem jest tryb zdalny, używają wyłącznie `gateway.remote.token` (bez awaryjnego użycia tokena lokalnego).
- Nadpisania środowiskowe Gateway używają wyłącznie `OPENCLAW_GATEWAY_*`.

## Zdalny dostęp do interfejsu czatu

WebChat nie ma osobnego portu HTTP; interfejs czatu SwiftUI łączy się bezpośrednio z WebSocketem Gateway.

- Przekieruj `18789` przez SSH (zobacz wyżej), a następnie połącz klientów z `ws://127.0.0.1:18789`.
- W trybie bezpośrednim LAN/Tailnet połącz klientów ze skonfigurowanym prywatnym adresem `ws://` lub bezpiecznym adresem URL `wss://`.
- W systemie macOS tryb zdalny aplikacji automatycznie zarządza wybranym transportem.

## Tryb zdalny aplikacji macOS

Aplikacja paska menu systemu macOS obsługuje tę samą konfigurację od początku do końca: zdalne kontrole stanu, WebChat i przekazywanie funkcji Voice Wake. Instrukcja: [zdalny dostęp w macOS](/pl/platforms/mac/remote).

## Reguły bezpieczeństwa (dostęp zdalny/VPN)

Pozostaw Gateway dostępny **wyłącznie przez interfejs loopback**, chyba że masz pewność, że potrzebujesz innego powiązania.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsze ustawienie domyślne (bez publicznego udostępniania).
- Nieszyfrowany protokół `ws://` jest akceptowany dla interfejsu loopback, sieci prywatnych/LAN (RFC 1918), adresów lokalnych dla łącza, CGNAT oraz hostów `.local` i `.ts.net`. Publiczne hosty zdalne muszą używać `wss://`.
- **Powiązania inne niż loopback** (`lan`/`tailnet`/`custom` lub `auto`, gdy loopback jest niedostępny) muszą korzystać z uwierzytelniania Gateway: tokena, hasła lub odwrotnego serwera proxy rozpoznającego tożsamość z ustawieniem `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` są źródłami poświadczeń klienta; same nie konfigurują uwierzytelniania serwera.
- Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako wartości awaryjnej tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` skonfigurowano jawnie za pomocą SecretRef, ale nie uda się ich rozpoznać, rozpoznawanie kończy się bezpieczną odmową (bez maskującego awaryjnego użycia ustawień zdalnych).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS dla `wss://`, również w trybie bezpośrednim macOS. Bez zapisanego odcisku palca system macOS przypina certyfikat przy pierwszym użyciu dopiero po pomyślnym przejściu standardowej weryfikacji zaufania systemowego; Gateway z certyfikatem samopodpisanym lub prywatnym urzędem certyfikacji wymaga jawnego odcisku palca albo połączenia zdalnego przez SSH.
- **Tailscale Serve** może uwierzytelniać ruch interfejsu sterowania/WebSocket za pomocą nagłówków tożsamości, gdy `gateway.auth.allowTailscale: true`. Punkty końcowe API HTTP nie używają tego uwierzytelniania nagłówkowego i zamiast tego stosują standardowy tryb uwierzytelniania HTTP Gateway. Ten przepływ bez tokena zakłada, że host Gateway jest zaufany; ustaw wartość `false`, aby wszędzie używać uwierzytelniania współdzielonym sekretem.
- Uwierzytelnianie **zaufanego serwera proxy** domyślnie oczekuje serwera proxy rozpoznającego tożsamość, który nie działa na interfejsie loopback. Odwrotne serwery proxy działające na tym samym hoście i interfejsie loopback wymagają jawnego ustawienia `gateway.auth.trustedProxy.allowLoopback = true`.
- Traktuj sterowanie przez przeglądarkę jak dostęp operatora: tylko w tailnecie i z celowym parowaniem Node’a.

Szczegółowe informacje: [Bezpieczeństwo](/pl/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

W przypadku klientów macOS najłatwiejsza trwała konfiguracja korzysta z wpisu `LocalForward` w konfiguracji SSH oraz LaunchAgent, który utrzymuje tunel po ponownym uruchomieniu systemu i awarii.

#### Krok 1: dodaj konfigurację SSH

Edytuj `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` własnymi wartościami.

#### Krok 2: skopiuj klucz SSH (jednorazowo)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Krok 3: skonfiguruj token Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Jeśli zdalny Gateway korzysta z uwierzytelniania hasłem, użyj zamiast tego `gateway.remote.password`. `OPENCLAW_GATEWAY_TOKEN` nadal jest prawidłowym nadpisaniem na poziomie powłoki, ale trwała konfiguracja klienta zdalnego korzysta z `gateway.remote.token` / `gateway.remote.password`.

#### Krok 4: utwórz LaunchAgent

Zapisz jako `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Krok 5: załaduj LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunel uruchamia się automatycznie po zalogowaniu, wznawia działanie po awarii i utrzymuje przekierowany port aktywny.

<Note>
Jeśli pozostał Ci LaunchAgent `com.openclaw.ssh-tunnel` ze starszej konfiguracji, wyładuj go i usuń.
</Note>

#### Rozwiązywanie problemów

```bash
# Sprawdź, czy tunel działa
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Uruchom tunel ponownie
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Zatrzymaj tunel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Wpis konfiguracji                    | Działanie                                                     |
| ------------------------------------ | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Przekierowuje lokalny port 18789 na zdalny port 18789         |
| `ssh -N`                             | SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portu) |
| `KeepAlive`                          | Automatycznie uruchamia tunel ponownie po awarii              |
| `RunAtLoad`                          | Uruchamia tunel po załadowaniu LaunchAgent podczas logowania  |

## Powiązane materiały

- [Tailscale](/pl/gateway/tailscale)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Konfiguracja zdalnego Gateway](/pl/gateway/remote-gateway-readme)
