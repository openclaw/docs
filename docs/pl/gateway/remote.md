---
read_when:
    - Uruchamianie lub rozwiązywanie problemów z konfiguracjami zdalnego Gateway
summary: Zdalny dostęp przy użyciu Gateway WS, tuneli SSH i tailnetów
title: Dostęp zdalny
x-i18n:
    generated_at: "2026-07-03T23:43:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

To repo obsługuje zdalny dostęp do Gateway przez utrzymywanie pojedynczego Gateway (głównego) działającego na dedykowanym hoście (komputerze stacjonarnym/serwerze) i podłączanie do niego klientów.

- Dla **operatorów (Ty / aplikacja macOS)**: bezpośredni WebSocket przez LAN/Tailnet jest najprostszy, gdy gateway jest osiągalny; tunelowanie SSH to uniwersalny mechanizm awaryjny.
- Dla **węzłów (iOS/Android i przyszłe urządzenia)**: łącz się z Gateway **WebSocket** (LAN/tailnet lub tunel SSH w razie potrzeby).

## Główna idea

- WebSocket Gateway zwykle wiąże się z **loopback** na skonfigurowanym porcie (domyślnie 18789).
- Do użytku zdalnego udostępnij go przez Tailscale Serve albo zaufane wiązanie LAN/Tailnet, lub przekaż port loopback przez SSH.

## Typowe konfiguracje VPN i tailnet

Traktuj **host Gateway** jako miejsce, w którym działa agent. Jest właścicielem sesji, profili uwierzytelniania, kanałów i stanu. Twój laptop, komputer stacjonarny i węzły łączą się z tym hostem.

### Stale działający Gateway w Twoim tailnet

Uruchom Gateway na trwałym hoście (VPS lub serwer domowy) i łącz się z nim przez **Tailscale** albo SSH.

- **Najlepszy UX:** zachowaj `gateway.bind: "loopback"` i używaj **Tailscale Serve** dla Control UI.
- **Zaufany LAN/Tailnet:** powiąż gateway z prywatnym interfejsem i łącz się bezpośrednio z `gateway.remote.transport: "direct"`.
- **Mechanizm awaryjny:** zachowaj loopback oraz tunel SSH z dowolnej maszyny, która potrzebuje dostępu.
- **Przykłady:** [exe.dev](/pl/install/exe-dev) (prosty VM) albo [Hetzner](/pl/install/hetzner) (produkcyjny VPS).

Idealne, gdy Twój laptop często przechodzi w uśpienie, ale chcesz mieć agenta zawsze włączonego.

### Domowy komputer stacjonarny uruchamia Gateway

Laptop **nie** uruchamia agenta. Łączy się zdalnie:

- Użyj trybu zdalnego aplikacji macOS (Settings → General → OpenClaw runs).
- Aplikacja łączy się bezpośrednio, gdy gateway jest osiągalny w LAN/Tailnet, albo otwiera i zarządza tunelem SSH, gdy wybierzesz SSH.

Procedura: [zdalny dostęp macOS](/pl/platforms/mac/remote).

### Laptop uruchamia Gateway

Zachowaj Gateway lokalnie, ale udostępnij go bezpiecznie:

- tunel SSH do laptopa z innych maszyn albo
- Tailscale Serve dla Control UI i Gateway wyłącznie przez loopback.

Przewodniki: [Tailscale](/pl/gateway/tailscale) i [omówienie Web](/pl/web).

## Przepływ poleceń (co działa gdzie)

Jedna usługa gateway zarządza stanem i kanałami. Węzły są urządzeniami peryferyjnymi.

Przykład przepływu (Telegram → węzeł):

- Wiadomość Telegram dociera do **Gateway**.
- Gateway uruchamia **agenta** i decyduje, czy wywołać narzędzie węzła.
- Gateway wywołuje **węzeł** przez Gateway WebSocket (`node.*` RPC).
- Węzeł zwraca wynik; Gateway odpowiada z powrotem do Telegram.

Uwagi:

- **Węzły nie uruchamiają usługi gateway.** Na host powinien działać tylko jeden gateway, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)).
- „Tryb węzła” aplikacji macOS to po prostu klient węzła przez Gateway WebSocket.

## Tunel SSH (CLI + narzędzia)

Utwórz lokalny tunel do zdalnego Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Gdy tunel jest aktywny:

- `openclaw health` i `openclaw status --deep` docierają teraz do zdalnego gateway przez `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` mogą też kierować się do przekazanego URL przez `--url`, gdy jest to potrzebne.

<Note>
Zastąp `18789` skonfigurowanym `gateway.port` (albo `--port` lub `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Gdy przekazujesz `--url`, CLI nie wraca do danych logowania z konfiguracji ani środowiska. Podaj jawnie `--token` albo `--password`. Brak jawnych danych logowania jest błędem.
</Warning>

## Zdalne wartości domyślne CLI

Możesz utrwalić zdalny cel, aby polecenia CLI używały go domyślnie:

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

Gdy gateway jest dostępny tylko przez loopback, pozostaw URL jako `ws://127.0.0.1:18789` i najpierw otwórz tunel SSH.
W transporcie tunelu SSH aplikacji macOS wykryte nazwy hostów gateway należą do
`gateway.remote.sshTarget`; `gateway.remote.url` pozostaje lokalnym URL tunelu.
Jeśli te porty się różnią, ustaw `gateway.remote.remotePort` na port gateway na
hoście SSH.
Weryfikacja klucza hosta jest domyślnie rygorystyczna. Zarządzane aliasy mogą jawnie używać
swojej efektywnej polityki zaufania OpenSSH przez
`gateway.remote.sshHostKeyPolicy: "openssh"`; przed włączeniem sprawdź pasujące ustawienia SSH użytkownika i systemu.

Dla gateway już osiągalnego w zaufanym LAN albo Tailnet użyj trybu bezpośredniego:

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

## Priorytet danych logowania

Rozwiązywanie danych logowania Gateway stosuje jeden wspólny kontrakt w ścieżkach call/probe/status oraz w monitorowaniu zatwierdzania wykonania Discord. Host węzła używa tego samego bazowego kontraktu z jednym wyjątkiem trybu lokalnego (celowo ignoruje `gateway.remote.*`):

- Jawne dane logowania (`--token`, `--password` lub narzędzie `gatewayToken`) zawsze wygrywają w ścieżkach wywołań, które akceptują jawne uwierzytelnianie.
- Bezpieczeństwo nadpisania URL:
  - Nadpisania URL w CLI (`--url`) nigdy nie używają ponownie niejawnych danych logowania z konfiguracji/środowiska.
  - Nadpisania URL ze środowiska (`OPENCLAW_GATEWAY_URL`) mogą używać wyłącznie danych logowania ze środowiska (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Domyślne wartości trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (zdalny mechanizm awaryjny ma zastosowanie tylko wtedy, gdy lokalne wejście tokena uwierzytelniania nie jest ustawione)
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (zdalny mechanizm awaryjny ma zastosowanie tylko wtedy, gdy lokalne wejście hasła uwierzytelniania nie jest ustawione)
- Domyślne wartości trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek trybu lokalnego hosta węzła: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Zdalne kontrole tokena probe/status są domyślnie rygorystyczne: używają tylko `gateway.remote.token` (bez lokalnego awaryjnego tokena), gdy celują w tryb zdalny.
- Nadpisania środowiskowe Gateway używają wyłącznie `OPENCLAW_GATEWAY_*`.

## Zdalny dostęp do interfejsu czatu

WebChat nie używa już osobnego portu HTTP. Interfejs czatu SwiftUI łączy się bezpośrednio z Gateway WebSocket.

- Przekaż `18789` przez SSH (zobacz wyżej), a następnie łącz klientów z `ws://127.0.0.1:18789`.
- W trybie bezpośrednim LAN/Tailnet łącz klientów ze skonfigurowanym prywatnym URL `ws://` albo bezpiecznym URL `wss://`.
- W macOS preferuj tryb zdalny aplikacji, który automatycznie zarządza wybranym transportem.

## Tryb zdalny aplikacji macOS

Aplikacja paska menu macOS może obsłużyć tę samą konfigurację od początku do końca (zdalne kontrole statusu, WebChat i przekazywanie Voice Wake).

Procedura: [zdalny dostęp macOS](/pl/platforms/mac/remote).

## Reguły bezpieczeństwa (remote/VPN)

W skrócie: **utrzymuj Gateway wyłącznie na loopback**, chyba że masz pewność, że potrzebujesz wiązania.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsza wartość domyślna (brak publicznej ekspozycji).
- Zwykły tekst `ws://` jest akceptowany dla loopback, LAN, link-local, `.local`, `.ts.net` i hostów Tailscale CGNAT. Publiczne hosty zdalne muszą używać `wss://`.
- **Wiązania inne niż loopback** (`lan`/`tailnet`/`custom` albo `auto`, gdy loopback jest niedostępny) muszą używać uwierzytelniania gateway: tokena, hasła albo identity-aware reverse proxy z `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` są źródłami danych logowania klienta. Same **nie** konfigurują uwierzytelniania serwera.
- Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako mechanizmu awaryjnego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania przez zdalny mechanizm awaryjny).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS przy użyciu `wss://`, w tym w trybie bezpośrednim macOS. Bez skonfigurowanego lub wcześniej zapisanego przypięcia macOS przypina certyfikat pierwszego użycia dopiero po przejściu normalnego zaufania systemowego; gatewaye z certyfikatem samopodpisanym lub prywatnym CA, któremu macOS jeszcze nie ufa, wymagają jawnego fingerprintu albo Remote przez SSH.
- **Tailscale Serve** może uwierzytelniać ruch Control UI/WebSocket przez nagłówki tożsamości
  przy `gateway.auth.allowTailscale: true`; punkty końcowe HTTP API nie
  używają tego uwierzytelniania nagłówkiem Tailscale i zamiast tego stosują normalny tryb
  uwierzytelniania HTTP gateway. Ten przepływ bez tokena zakłada, że host gateway jest zaufany. Ustaw go na
  `false`, jeśli chcesz wszędzie używać uwierzytelniania współdzielonym sekretem.
- Uwierzytelnianie **trusted-proxy** domyślnie oczekuje konfiguracji identity-aware proxy poza loopback.
  Reverse proxy na tym samym hoście przez loopback wymaga jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
- Traktuj kontrolę przez przeglądarkę jak dostęp operatora: tylko tailnet + celowe parowanie węzłów.

Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

Dla klientów macOS łączących się ze zdalnym gateway najprostsza trwała konfiguracja używa wpisu konfiguracji SSH `LocalForward` oraz LaunchAgent, aby utrzymać tunel przy życiu po restartach i awariach.

#### Krok 1: dodaj konfigurację SSH

Edytuj `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` swoimi wartościami.

#### Krok 2: skopiuj klucz SSH (jednorazowo)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Krok 3: skonfiguruj token gateway

Zapisz token w konfiguracji, aby przetrwał restarty:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Krok 4: utwórz LaunchAgent

Zapisz to jako `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

Tunel będzie uruchamiał się automatycznie przy logowaniu, restartował po awarii i utrzymywał przekazany port aktywny.

<Note>
Jeśli masz pozostały LaunchAgent `com.openclaw.ssh-tunnel` ze starszej konfiguracji, wyładuj go i usuń.
</Note>

#### Rozwiązywanie problemów

Sprawdź, czy tunel działa:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Zrestartuj tunel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Zatrzymaj tunel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Wpis konfiguracji                    | Co robi                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Przekazuje lokalny port 18789 na zdalny port 18789           |
| `ssh -N`                             | SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portu) |
| `KeepAlive`                          | Automatycznie restartuje tunel, jeśli ulegnie awarii         |
| `RunAtLoad`                          | Uruchamia tunel, gdy LaunchAgent ładuje się przy logowaniu   |

## Powiązane

- [Tailscale](/pl/gateway/tailscale)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Konfiguracja zdalnego gateway](/pl/gateway/remote-gateway-readme)
