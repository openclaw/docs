---
read_when:
    - Chcesz uruchomić Gateway na serwerze z systemem Linux lub na serwerze VPS w chmurze
    - Potrzebujesz krótkiego przeglądu przewodników po hostingu
    - Chcesz ogólnej optymalizacji serwera Linux dla OpenClaw
sidebarTitle: Linux Server
summary: Uruchamianie OpenClaw na serwerze Linux lub VPS w chmurze — wybór dostawcy, architektura i dostrajanie
title: Serwer Linux
x-i18n:
    generated_at: "2026-04-30T10:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

Uruchom OpenClaw Gateway na dowolnym serwerze Linux lub chmurowym VPS. Ta strona pomaga
wybrać dostawcę, wyjaśnia, jak działają wdrożenia w chmurze, i omawia ogólne
dostrajanie Linux, które ma zastosowanie wszędzie.

## Wybierz dostawcę

<CardGroup cols={2}>
  <Card title="Railway" href="/pl/install/railway">Konfiguracja w przeglądarce jednym kliknięciem</Card>
  <Card title="Northflank" href="/pl/install/northflank">Konfiguracja w przeglądarce jednym kliknięciem</Card>
  <Card title="DigitalOcean" href="/pl/install/digitalocean">Prosty płatny VPS</Card>
  <Card title="Oracle Cloud" href="/pl/install/oracle">Warstwa Always Free ARM</Card>
  <Card title="Fly.io" href="/pl/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pl/install/hetzner">Docker na VPS Hetzner</Card>
  <Card title="Hostinger" href="/pl/install/hostinger">VPS z konfiguracją jednym kliknięciem</Card>
  <Card title="GCP" href="/pl/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pl/install/azure">Maszyna wirtualna Linux</Card>
  <Card title="exe.dev" href="/pl/install/exe-dev">Maszyna wirtualna z proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pl/install/raspberry-pi">Samodzielny hosting ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / warstwa bezpłatna)** również działa dobrze.
Społecznościowy film z instruktażem jest dostępny pod adresem
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(zasób społecznościowy -- może stać się niedostępny).

## Jak działają konfiguracje w chmurze

- **Gateway działa na VPS** i jest właścicielem stanu oraz obszaru roboczego.
- Łączysz się z laptopa lub telefonu przez **Control UI** albo **Tailscale/SSH**.
- Traktuj VPS jako źródło prawdy i regularnie **twórz kopie zapasowe** stanu oraz obszaru roboczego.
- Bezpieczne ustawienie domyślne: pozostaw Gateway na loopback i uzyskuj do niego dostęp przez tunel SSH albo Tailscale Serve.
  Jeśli bindujesz do `lan` lub `tailnet`, wymagaj `gateway.auth.token` albo `gateway.auth.password`.

Powiązane strony: [Zdalny dostęp do Gateway](/pl/gateway/remote), [Centrum platform](/pl/platforms).

## Najpierw utwardź dostęp administracyjny

Zanim zainstalujesz OpenClaw na publicznym VPS, zdecyduj, jak chcesz administrować
samą maszyną.

- Jeśli chcesz dostęp administracyjny tylko przez Tailnet, najpierw zainstaluj Tailscale, dołącz VPS
  do swojego tailnet, zweryfikuj drugą sesję SSH przez adres IP Tailscale albo
  nazwę MagicDNS, a następnie ogranicz publiczny SSH.
- Jeśli nie używasz Tailscale, zastosuj równoważne utwardzenie dla swojej ścieżki
  SSH przed wystawieniem większej liczby usług.
- To jest niezależne od dostępu do Gateway. Nadal możesz pozostawić OpenClaw zbindowany do
  loopback i używać tunelu SSH albo Tailscale Serve dla panelu.

Opcje Gateway specyficzne dla Tailscale znajdują się w [Tailscale](/pl/gateway/tailscale).

## Współdzielony agent firmowy na VPS

Uruchamianie jednego agenta dla zespołu jest poprawną konfiguracją, gdy każdy użytkownik znajduje się w tej samej granicy zaufania, a agent jest przeznaczony wyłącznie do pracy firmowej.

- Umieść go w dedykowanym środowisku uruchomieniowym (VPS/VM/kontener + dedykowany użytkownik/konta systemu operacyjnego).
- Nie loguj tego środowiska uruchomieniowego do osobistych kont Apple/Google ani osobistych profili przeglądarki/menedżera haseł.
- Jeśli użytkownicy są wobec siebie adwersarialni, rozdziel ich według Gateway/hosta/użytkownika systemu operacyjnego.

Szczegóły modelu bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security).

## Używanie węzłów z VPS

Możesz utrzymać Gateway w chmurze i parować **węzły** na swoich urządzeniach lokalnych
(Mac/iOS/Android/headless). Węzły udostępniają lokalny ekran/kamerę/canvas oraz możliwości `system.run`,
podczas gdy Gateway pozostaje w chmurze.

Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

## Dostrajanie uruchamiania dla małych maszyn wirtualnych i hostów ARM

Jeśli polecenia CLI działają wolno na maszynach wirtualnych o niskiej mocy (lub hostach ARM), włącz pamięć podręczną kompilacji modułów Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` poprawia czasy uruchamiania powtarzanych poleceń.
- `OPENCLAW_NO_RESPAWN=1` pozwala uniknąć dodatkowego narzutu uruchamiania związanego ze ścieżką samodzielnego ponownego uruchamiania.
- Pierwsze uruchomienie polecenia rozgrzewa pamięć podręczną; kolejne uruchomienia są szybsze.
- Szczegóły dotyczące Raspberry Pi znajdziesz w [Raspberry Pi](/pl/install/raspberry-pi).

### Lista kontrolna dostrajania systemd (opcjonalnie)

Dla hostów VM używających `systemd` rozważ:

- Dodanie zmiennych środowiskowych usługi dla stabilnej ścieżki uruchamiania:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Jawne ustawienie zachowania restartu:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferowanie dysków opartych na SSD dla ścieżek stanu/pamięci podręcznej, aby zmniejszyć kary zimnego startu wynikające z losowego I/O.

Dla standardowej ścieżki `openclaw onboard --install-daemon` edytuj jednostkę użytkownika:

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

Jeśli celowo zainstalowano zamiast tego jednostkę systemową, edytuj
`openclaw-gateway.service` przez `sudo systemctl edit openclaw-gateway.service`.

Jak zasady `Restart=` pomagają w automatycznym odzyskiwaniu:
[systemd może automatyzować odzyskiwanie usług](https://www.redhat.com/en/blog/systemd-automate-recovery).

Informacje o zachowaniu Linux przy OOM, wyborze procesu potomnego jako ofiary oraz diagnostyce `exit 137`
znajdziesz w [Presja pamięci w Linux i zabijanie przez OOM](/pl/platforms/linux#memory-pressure-and-oom-kills).

## Powiązane

- [Omówienie instalacji](/pl/install)
- [DigitalOcean](/pl/install/digitalocean)
- [Fly.io](/pl/install/fly)
- [Hetzner](/pl/install/hetzner)
