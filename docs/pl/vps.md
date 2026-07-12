---
read_when:
    - Chcesz uruchomić Gateway na serwerze z systemem Linux lub wirtualnym serwerze prywatnym (VPS) w chmurze
    - Potrzebujesz szybkiego przeglądu przewodników dotyczących hostingu
    - Chcesz przeprowadzić ogólną optymalizację serwera Linux pod kątem OpenClaw
sidebarTitle: Linux Server
summary: Uruchamianie OpenClaw na serwerze Linux lub VPS w chmurze — wybór dostawcy, architektura i optymalizacja
title: Serwer Linuxowy
x-i18n:
    generated_at: "2026-07-12T15:47:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Uruchom Gateway OpenClaw na dowolnym serwerze Linux lub wirtualnym serwerze prywatnym w chmurze. Ta strona pomoże Ci
wybrać dostawcę, wyjaśnia działanie wdrożeń chmurowych i opisuje ogólne
dostrajanie systemu Linux, które ma zastosowanie w każdym środowisku.

## Wybór dostawcy

<CardGroup cols={2}>
  <Card title="Azure" href="/pl/install/azure">Maszyna wirtualna z systemem Linux</Card>
  <Card title="DigitalOcean" href="/pl/install/digitalocean">Prosty płatny VPS</Card>
  <Card title="exe.dev" href="/pl/install/exe-dev">Maszyna wirtualna z serwerem proxy HTTPS</Card>
  <Card title="Fly.io" href="/pl/install/fly">Maszyny Fly</Card>
  <Card title="GCP" href="/pl/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/pl/install/hetzner">Docker na VPS-ie Hetzner</Card>
  <Card title="Hostinger" href="/pl/install/hostinger">VPS z konfiguracją jednym kliknięciem</Card>
  <Card title="Northflank" href="/pl/install/northflank">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="Oracle Cloud" href="/pl/install/oracle">Zawsze bezpłatny poziom ARM</Card>
  <Card title="Railway" href="/pl/install/railway">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="Raspberry Pi" href="/pl/install/raspberry-pi">Samodzielny hosting na ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / bezpłatny poziom)** również dobrze się sprawdza.
Samouczek wideo przygotowany przez społeczność jest dostępny pod adresem
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(materiał społecznościowy — może przestać być dostępny).

## Jak działają konfiguracje chmurowe

- **Gateway działa na VPS-ie** i przechowuje stan oraz przestrzeń roboczą.
- Łączysz się z laptopa lub telefonu za pośrednictwem **interfejsu sterowania** albo **Tailscale/SSH**.
- Traktuj VPS jako źródło prawdy i regularnie twórz **kopie zapasowe** stanu oraz przestrzeni roboczej.
- Bezpieczne ustawienie domyślne: pozostaw Gateway na local loopback i uzyskuj do niego dostęp przez tunel SSH lub Tailscale Serve.
  Jeśli powiążesz go z `lan` lub `tailnet`, Gateway wymaga współdzielonego sekretu
  (`gateway.auth.token` lub `gateway.auth.password`), chyba że uwierzytelnianie zostanie przekazane
  zaufanemu serwerowi proxy.

Powiązane strony: [Zdalny dostęp do Gateway](/pl/gateway/remote), [Centrum platform](/pl/platforms).

## Najpierw zabezpiecz dostęp administracyjny

Przed zainstalowaniem OpenClaw na publicznym VPS-ie zdecyduj, jak chcesz administrować
samym serwerem.

- Aby ograniczyć dostęp administracyjny wyłącznie do sieci Tailnet: najpierw zainstaluj Tailscale, dołącz VPS
  do swojej sieci tailnet, zweryfikuj drugą sesję SSH przez adres IP Tailscale lub nazwę MagicDNS,
  a następnie ogranicz publiczny dostęp SSH.
- Bez Tailscale: zastosuj równoważne zabezpieczenia ścieżki SSH przed
  udostępnieniem kolejnych usług.
- Jest to niezależne od dostępu do Gateway. Nadal możesz pozostawić OpenClaw powiązany z
  local loopback i używać tunelu SSH lub Tailscale Serve do uzyskiwania dostępu do panelu.

Opcje Gateway specyficzne dla Tailscale opisano na stronie [Tailscale](/pl/gateway/tailscale).

## Współdzielony agent firmowy na VPS-ie

Uruchamianie jednego agenta dla zespołu jest prawidłową konfiguracją, jeśli wszyscy użytkownicy znajdują się w
tej samej granicy zaufania, a agent służy wyłącznie do celów służbowych.

- Uruchamiaj go w dedykowanym środowisku (VPS/maszyna wirtualna/kontener oraz dedykowany użytkownik systemu operacyjnego/konta).
- Nie loguj tego środowiska na osobiste konta Apple/Google ani do osobistych profili przeglądarki lub menedżera haseł.
- Jeśli użytkownicy mogą działać przeciwko sobie, rozdziel ich według Gateway/hosta/użytkownika systemu operacyjnego.

Szczegóły modelu zabezpieczeń: [Bezpieczeństwo](/pl/gateway/security).

## Korzystanie z węzłów z VPS-em

Możesz pozostawić Gateway w chmurze i sparować **węzły** na urządzeniach lokalnych
(Mac/iOS/Android/bez interfejsu graficznego). Węzły udostępniają lokalne funkcje ekranu, kamery, obszaru roboczego i `system.run`,
podczas gdy Gateway pozostaje w chmurze.

Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

## Dostrajanie uruchamiania dla małych maszyn wirtualnych i hostów ARM

Jeśli polecenia CLI działają wolno na maszynach wirtualnych o niewielkiej mocy obliczeniowej (lub hostach ARM), włącz pamięć podręczną kompilacji modułów Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` skraca czas uruchamiania kolejnych poleceń; pierwsze uruchomienie zapełnia pamięć podręczną.
- `OPENCLAW_NO_RESPAWN=1` utrzymuje rutynowe ponowne uruchomienia Gateway w tym samym procesie, co pozwala uniknąć dodatkowego przekazywania między procesami i upraszcza śledzenie identyfikatora PID na małych hostach.
- Informacje dotyczące Raspberry Pi znajdziesz na stronie [Raspberry Pi](/pl/install/raspberry-pi).

### Lista kontrolna dostrajania systemd (opcjonalna)

W przypadku hostów maszyn wirtualnych korzystających z `systemd` rozważ:

- Zmienne środowiskowe usługi zapewniające stabilną ścieżkę uruchamiania: `OPENCLAW_NO_RESPAWN=1` i
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Jawne zachowanie ponownego uruchamiania: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Dyski SSD dla ścieżek stanu i pamięci podręcznej, aby ograniczyć opóźnienia zimnego startu wynikające z losowych operacji wejścia/wyjścia.

Standardowa ścieżka `openclaw onboard --install-daemon` instaluje jednostkę użytkownika systemd;
edytuj ją za pomocą:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Jeśli celowo zainstalowano jednostkę systemową, edytuj ją za pomocą
`sudo systemctl edit openclaw-gateway.service`.

Jak zasady `Restart=` wspomagają automatyczne odzyskiwanie:
[systemd może automatyzować odzyskiwanie usług](https://www.redhat.com/en/blog/systemd-automate-recovery).

Informacje o zachowaniu mechanizmu OOM w systemie Linux, wyborze procesu podrzędnego do zakończenia i
diagnostyce `exit 137` znajdziesz na stronie [Presja na pamięć i zakończenia OOM w systemie Linux](/pl/platforms/linux#memory-pressure-and-oom-kills).

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [DigitalOcean](/pl/install/digitalocean)
- [Fly.io](/pl/install/fly)
- [Hetzner](/pl/install/hetzner)
