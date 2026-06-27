---
read_when:
    - Chcesz uruchomić Gateway na serwerze Linux lub VPS w chmurze
    - Potrzebujesz szybkiego przeglądu przewodników dotyczących hostingu
    - Chcesz ogólnego dostrajania serwera Linux dla OpenClaw
sidebarTitle: Linux Server
summary: Uruchamianie OpenClaw na serwerze Linux lub cloud VPS — wybór dostawcy, architektura i strojenie
title: Serwer Linux
x-i18n:
    generated_at: "2026-06-27T18:33:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Uruchom OpenClaw Gateway na dowolnym serwerze Linux lub VPS w chmurze. Ta strona pomaga
wybrać dostawcę, wyjaśnia, jak działają wdrożenia w chmurze, i omawia ogólne
strojenie Linux, które ma zastosowanie wszędzie.

## Wybierz dostawcę

<CardGroup cols={2}>
  <Card title="Railway" href="/pl/install/railway">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="Northflank" href="/pl/install/northflank">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="DigitalOcean" href="/pl/install/digitalocean">Prosty płatny VPS</Card>
  <Card title="Oracle Cloud" href="/pl/install/oracle">Zawsze bezpłatny poziom ARM</Card>
  <Card title="Fly.io" href="/pl/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pl/install/hetzner">Docker na VPS Hetzner</Card>
  <Card title="Hostinger" href="/pl/install/hostinger">VPS z konfiguracją jednym kliknięciem</Card>
  <Card title="GCP" href="/pl/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pl/install/azure">Maszyna wirtualna Linux</Card>
  <Card title="exe.dev" href="/pl/install/exe-dev">Maszyna wirtualna z proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pl/install/raspberry-pi">Samodzielnie hostowane ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / warstwa bezpłatna)** również działa dobrze.
Społecznościowy przewodnik wideo jest dostępny pod adresem
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(zasób społecznościowy -- może stać się niedostępny).

## Jak działają konfiguracje w chmurze

- **Gateway działa na VPS** i jest właścicielem stanu oraz przestrzeni roboczej.
- Łączysz się z laptopa lub telefonu przez **Control UI** albo **Tailscale/SSH**.
- Traktuj VPS jako źródło prawdy i regularnie **twórz kopie zapasowe** stanu oraz przestrzeni roboczej.
- Bezpieczna konfiguracja domyślna: trzymaj Gateway na loopback i uzyskuj dostęp przez tunel SSH lub Tailscale Serve.
  Jeśli wiążesz z `lan` lub `tailnet`, wymagaj `gateway.auth.token` albo `gateway.auth.password`.

Powiązane strony: [zdalny dostęp do Gateway](/pl/gateway/remote), [centrum platform](/pl/platforms).

## Najpierw wzmocnij dostęp administracyjny

Zanim zainstalujesz OpenClaw na publicznym VPS, zdecyduj, jak chcesz administrować
samym serwerem.

- Jeśli chcesz mieć dostęp administracyjny tylko przez tailnet, najpierw zainstaluj Tailscale, dołącz VPS
  do swojego tailnetu, zweryfikuj drugą sesję SSH przez adres IP Tailscale lub
  nazwę MagicDNS, a następnie ogranicz publiczny SSH.
- Jeśli nie używasz Tailscale, zastosuj równoważne wzmocnienie dla swojej ścieżki
  SSH przed udostępnieniem kolejnych usług.
- To jest oddzielne od dostępu do Gateway. Nadal możesz utrzymywać OpenClaw powiązany z
  loopback i używać tunelu SSH lub Tailscale Serve dla panelu.

Opcje Gateway specyficzne dla Tailscale znajdują się w [Tailscale](/pl/gateway/tailscale).

## Współdzielony agent firmowy na VPS

Uruchamianie jednego agenta dla zespołu jest poprawną konfiguracją, gdy każdy użytkownik znajduje się w tej samej granicy zaufania, a agent służy wyłącznie do pracy.

- Utrzymuj go w dedykowanym środowisku uruchomieniowym (VPS/VM/kontener + dedykowany użytkownik/konta systemu operacyjnego).
- Nie loguj tego środowiska uruchomieniowego do osobistych kont Apple/Google ani osobistych profili przeglądarki/menedżera haseł.
- Jeśli użytkownicy są wobec siebie nieufni, rozdziel ich według gateway/hosta/użytkownika systemu operacyjnego.

Szczegóły modelu bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security).

## Używanie węzłów z VPS

Możesz utrzymywać Gateway w chmurze i sparować **węzły** na swoich lokalnych urządzeniach
(Mac/iOS/Android/headless). Węzły zapewniają lokalny ekran/kamerę/canvas oraz możliwości `system.run`,
podczas gdy Gateway pozostaje w chmurze.

Dokumentacja: [Węzły](/pl/nodes), [CLI węzłów](/pl/cli/nodes).

## Strojenie startu dla małych maszyn wirtualnych i hostów ARM

Jeśli polecenia CLI wydają się wolne na maszynach wirtualnych o niskiej mocy (lub hostach ARM), włącz cache kompilacji modułów Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` poprawia czas startu powtarzanych poleceń.
- `OPENCLAW_NO_RESPAWN=1` utrzymuje rutynowe restarty Gateway w tym samym procesie, co pozwala uniknąć dodatkowych przekazań między procesami i upraszcza śledzenie PID na małych hostach.
- Pierwsze uruchomienie polecenia rozgrzewa cache; kolejne uruchomienia są szybsze.
- Szczegóły dotyczące Raspberry Pi znajdziesz w [Raspberry Pi](/pl/install/raspberry-pi).

### Lista kontrolna strojenia systemd (opcjonalna)

W przypadku hostów VM używających `systemd` rozważ:

- Dodanie zmiennych środowiskowych usługi dla stabilnej ścieżki startu:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Utrzymanie jawnego zachowania restartu:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferowanie dysków opartych na SSD dla ścieżek stanu/cache, aby zmniejszyć koszty zimnego startu wynikające z losowego I/O.

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
znajdziesz w [presji pamięci w Linux i zabijaniu przez OOM](/pl/platforms/linux#memory-pressure-and-oom-kills).

## Powiązane

- [Omówienie instalacji](/pl/install)
- [DigitalOcean](/pl/install/digitalocean)
- [Fly.io](/pl/install/fly)
- [Hetzner](/pl/install/hetzner)
