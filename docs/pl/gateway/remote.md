---
read_when:
    - Uruchamianie lub rozwiązywanie problemów ze zdalnymi konfiguracjami Gateway
summary: Zdalny dostęp przy użyciu Gateway WS, tuneli SSH i sieci tailnet
title: Dostęp zdalny
x-i18n:
    generated_at: "2026-06-27T17:36:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

To repozytorium obsługuje zdalny dostęp do Gateway przez utrzymywanie pojedynczego Gateway (mastera) działającego na dedykowanym hoście (komputerze stacjonarnym/serwerze) i podłączanie do niego klientów.

- Dla **operatorów (Ty / aplikacja macOS)**: bezpośredni WebSocket przez LAN/Tailnet jest najprostszy, gdy Gateway jest osiągalny; tunel SSH jest uniwersalnym rozwiązaniem awaryjnym.
- Dla **węzłów (iOS/Android i przyszłe urządzenia)**: łącz się z **WebSocket** Gateway (LAN/tailnet albo tunel SSH zależnie od potrzeb).

## Główna idea

- WebSocket Gateway zwykle wiąże się z **loopback** na skonfigurowanym porcie (domyślnie 18789).
- Do użytku zdalnego udostępnij go przez Tailscale Serve albo zaufane powiązanie LAN/Tailnet, lub przekieruj port loopback przez SSH.

## Typowe konfiguracje VPN i tailnet

Traktuj **host Gateway** jako miejsce, w którym działa agent. To on jest właścicielem sesji, profili uwierzytelniania, kanałów i stanu. Twój laptop, komputer stacjonarny i węzły łączą się z tym hostem.

### Stale działający Gateway w Twoim tailnet

Uruchom Gateway na trwałym hoście (VPS lub serwer domowy) i łącz się z nim przez **Tailscale** albo SSH.

- **Najlepszy UX:** pozostaw `gateway.bind: "loopback"` i użyj **Tailscale Serve** dla Control UI.
- **Zaufany LAN/Tailnet:** powiąż gateway z prywatnym interfejsem i łącz się bezpośrednio z `gateway.remote.transport: "direct"`.
- **Rozwiązanie awaryjne:** pozostaw loopback oraz tunel SSH z każdej maszyny, która potrzebuje dostępu.
- **Przykłady:** [exe.dev](/pl/install/exe-dev) (łatwa VM) albo [Hetzner](/pl/install/hetzner) (produkcyjny VPS).

Idealne, gdy Twój laptop często przechodzi w uśpienie, ale chcesz, aby agent działał stale.

### Domowy komputer stacjonarny uruchamia Gateway

Laptop **nie** uruchamia agenta. Łączy się zdalnie:

- Użyj trybu zdalnego aplikacji macOS (Ustawienia → Ogólne → OpenClaw runs).
- Aplikacja łączy się bezpośrednio, gdy gateway jest osiągalny w LAN/Tailnet, albo otwiera tunel SSH i nim zarządza, gdy wybierzesz SSH.

Procedura: [zdalny dostęp macOS](/pl/platforms/mac/remote).

### Laptop uruchamia Gateway

Pozostaw Gateway lokalnie, ale bezpiecznie go udostępnij:

- tunel SSH do laptopa z innych maszyn albo
- Tailscale Serve dla Control UI i pozostaw Gateway dostępny tylko przez loopback.

Przewodniki: [Tailscale](/pl/gateway/tailscale) i [omówienie Web](/pl/web).

## Przepływ poleceń (co działa gdzie)

Jedna usługa gateway jest właścicielem stanu i kanałów. Węzły są urządzeniami peryferyjnymi.

Przykład przepływu (Telegram → węzeł):

- Wiadomość Telegram trafia do **Gateway**.
- Gateway uruchamia **agenta** i decyduje, czy wywołać narzędzie węzła.
- Gateway wywołuje **węzeł** przez WebSocket Gateway (`node.*` RPC).
- Węzeł zwraca wynik; Gateway odpowiada z powrotem do Telegram.

Uwagi:

- **Węzły nie uruchamiają usługi gateway.** Na host powinien działać tylko jeden gateway, chyba że celowo uruchamiasz izolowane profile (zobacz [wiele gateway](/pl/gateway/multiple-gateways)).
- „Tryb węzła” aplikacji macOS to po prostu klient węzła przez WebSocket Gateway.

## Tunel SSH (CLI + narzędzia)

Utwórz lokalny tunel do zdalnego Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Po uruchomieniu tunelu:

- `openclaw health` i `openclaw status --deep` docierają teraz do zdalnego gateway przez `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` mogą też w razie potrzeby kierować ruch na przekierowany URL przez `--url`.

<Note>
Zastąp `18789` skonfigurowanym `gateway.port` (albo `--port` lub `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Gdy przekażesz `--url`, CLI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Dołącz jawnie `--token` albo `--password`. Brak jawnych danych uwierzytelniających jest błędem.
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

Dla gateway, który jest już osiągalny w zaufanym LAN albo Tailnet, użyj trybu bezpośredniego:

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

## Priorytet danych uwierzytelniających

Rozwiązywanie danych uwierzytelniających Gateway korzysta z jednej wspólnej umowy dla ścieżek call/probe/status i monitorowania zatwierdzania exec w Discord. Node-host używa tej samej umowy bazowej z jednym wyjątkiem trybu lokalnego (celowo ignoruje `gateway.remote.*`):

- Jawne dane uwierzytelniające (`--token`, `--password` albo narzędziowe `gatewayToken`) zawsze wygrywają na ścieżkach wywołań, które akceptują jawne uwierzytelnianie.
- Bezpieczeństwo nadpisania URL:
  - Nadpisania URL w CLI (`--url`) nigdy nie używają ponownie niejawnych danych uwierzytelniających z konfiguracji/środowiska.
  - Nadpisania URL ze środowiska (`OPENCLAW_GATEWAY_URL`) mogą używać tylko danych uwierzytelniających ze środowiska (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Domyślne wartości trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (zdalne rozwiązanie awaryjne ma zastosowanie tylko wtedy, gdy lokalne wejście tokenu uwierzytelniania nie jest ustawione)
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (zdalne rozwiązanie awaryjne ma zastosowanie tylko wtedy, gdy lokalne wejście hasła uwierzytelniania nie jest ustawione)
- Domyślne wartości trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek trybu lokalnego Node-host: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Zdalne kontrole tokenu probe/status są domyślnie rygorystyczne: używają tylko `gateway.remote.token` (bez lokalnego awaryjnego tokenu), gdy celem jest tryb zdalny.
- Nadpisania środowiskowe Gateway używają tylko `OPENCLAW_GATEWAY_*`.

## Zdalny dostęp Chat UI

WebChat nie używa już osobnego portu HTTP. Chat UI SwiftUI łączy się bezpośrednio z WebSocket Gateway.

- Przekieruj `18789` przez SSH (zobacz wyżej), a następnie połącz klientów z `ws://127.0.0.1:18789`.
- Dla trybu bezpośredniego LAN/Tailnet połącz klientów ze skonfigurowanym prywatnym URL `ws://` albo bezpiecznym URL `wss://`.
- Na macOS preferuj tryb zdalny aplikacji, który automatycznie zarządza wybranym transportem.

## Tryb zdalny aplikacji macOS

Aplikacja paska menu macOS może obsłużyć tę samą konfigurację od początku do końca (zdalne kontrole statusu, WebChat i przekazywanie Voice Wake).

Procedura: [zdalny dostęp macOS](/pl/platforms/mac/remote).

## Reguły bezpieczeństwa (zdalnie/VPN)

Krótko: **pozostaw Gateway dostępny tylko przez loopback**, chyba że masz pewność, że potrzebujesz powiązania.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsza wartość domyślna (brak publicznego wystawienia).
- Nieszyfrowany `ws://` jest akceptowany dla loopback, LAN, link-local, `.local`, `.ts.net` i hostów Tailscale CGNAT. Publiczne zdalne hosty muszą używać `wss://`.
- **Powiązania inne niż loopback** (`lan`/`tailnet`/`custom` albo `auto`, gdy loopback jest niedostępny) muszą używać uwierzytelniania gateway: tokenu, hasła albo rozpoznającego tożsamość reverse proxy z `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` są źródłami danych uwierzytelniających klienta. Same **nie** konfigurują uwierzytelniania serwera.
- Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako rozwiązania awaryjnego tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nie zostanie rozwiązane, rozwiązywanie kończy się zamknięciem dostępu (bez maskowania przez zdalne rozwiązanie awaryjne).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS przy użyciu `wss://`, w tym w trybie bezpośrednim macOS. Bez skonfigurowanego albo wcześniej zapisanego przypięcia macOS przypina certyfikat pierwszego użycia dopiero po przejściu normalnej weryfikacji zaufania systemowego; gateway z certyfikatem self-signed albo prywatnym CA, któremu macOS jeszcze nie ufa, wymagają jawnego odcisku palca albo Remote over SSH.
- **Tailscale Serve** może uwierzytelniać ruch Control UI/WebSocket przez nagłówki
  tożsamości, gdy `gateway.auth.allowTailscale: true`; punkty końcowe HTTP API nie
  używają tego uwierzytelniania nagłówkami Tailscale i zamiast tego stosują normalny
  tryb uwierzytelniania HTTP gateway. Ten przepływ bez tokenu zakłada, że host gateway jest zaufany. Ustaw go na
  `false`, jeśli chcesz wszędzie uwierzytelniania współdzielonym sekretem.
- Uwierzytelnianie **trusted-proxy** domyślnie oczekuje konfiguracji proxy rozpoznających tożsamość innych niż loopback.
  Reverse proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
- Traktuj kontrolę przez przeglądarkę jak dostęp operatora: tylko tailnet + celowe parowanie węzłów.

Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

Dla klientów macOS łączących się ze zdalnym gateway najłatwiejsza trwała konfiguracja używa wpisu konfiguracji SSH `LocalForward` oraz LaunchAgent, aby utrzymywać tunel przy życiu po restartach i awariach.

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

Zapisz token w konfiguracji, aby utrzymywał się po restartach:

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

Tunel uruchomi się automatycznie przy logowaniu, zrestartuje się po awarii i utrzyma aktywny przekierowany port.

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
| `LocalForward 18789 127.0.0.1:18789` | Przekierowuje lokalny port 18789 na zdalny port 18789        |
| `ssh -N`                             | SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portów) |
| `KeepAlive`                          | Automatycznie restartuje tunel, jeśli ulegnie awarii         |
| `RunAtLoad`                          | Uruchamia tunel, gdy LaunchAgent ładuje się przy logowaniu   |

## Powiązane

- [Tailscale](/pl/gateway/tailscale)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Konfiguracja zdalnego gateway](/pl/gateway/remote-gateway-readme)
