---
read_when:
    - Chcesz uruchomić Gateway na serwerze Linux lub chmurowym VPS
    - Potrzebujesz szybkiego przeglądu przewodników hostingu
    - Chcesz ogólnego dostrajania OpenClaw dla serwera Linux
sidebarTitle: Linux Server
summary: Uruchom OpenClaw na serwerze Linux lub chmurowym VPS — wybór providera, architektura i dostrajanie
title: Serwer Linux
x-i18n:
    generated_at: "2026-04-24T09:39:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Uruchom Gateway OpenClaw na dowolnym serwerze Linux lub chmurowym VPS. Ta strona pomaga
wybrać providera, wyjaśnia, jak działają wdrożenia chmurowe, i omawia ogólne
dostrajanie Linuxa, które sprawdza się wszędzie.

## Wybierz providera

<CardGroup cols={2}>
  <Card title="Railway" href="/pl/install/railway">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="Northflank" href="/pl/install/northflank">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="DigitalOcean" href="/pl/install/digitalocean">Prosty płatny VPS</Card>
  <Card title="Oracle Cloud" href="/pl/install/oracle">Zawsze darmowa warstwa ARM</Card>
  <Card title="Fly.io" href="/pl/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pl/install/hetzner">Docker na VPS Hetzner</Card>
  <Card title="Hostinger" href="/pl/install/hostinger">VPS z konfiguracją jednym kliknięciem</Card>
  <Card title="GCP" href="/pl/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pl/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/pl/install/exe-dev">VM z proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pl/install/raspberry-pi">Self-hosted ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** również działa bardzo dobrze.
Przewodnik wideo przygotowany przez społeczność jest dostępny pod adresem
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(zasób społeczności — może stać się niedostępny).

## Jak działają konfiguracje chmurowe

- **Gateway działa na VPS** i przechowuje stan oraz obszar roboczy.
- Łączysz się z laptopa lub telefonu przez **Control UI** albo **Tailscale/SSH**.
- Traktuj VPS jako źródło prawdy i regularnie twórz **kopie zapasowe** stanu oraz obszaru roboczego.
- Bezpieczna konfiguracja domyślna: trzymaj Gateway na loopback i uzyskuj do niego dostęp przez tunel SSH albo Tailscale Serve.
  Jeśli bindowanie ustawisz na `lan` lub `tailnet`, wymagaj `gateway.auth.token` albo `gateway.auth.password`.

Powiązane strony: [Zdalny dostęp do Gateway](/pl/gateway/remote), [Hub platform](/pl/platforms).

## Współdzielony agent firmowy na VPS

Uruchomienie jednego agenta dla zespołu to poprawna konfiguracja, gdy wszyscy użytkownicy znajdują się w tej samej granicy zaufania, a agent służy wyłącznie do celów biznesowych.

- Utrzymuj go na dedykowanym środowisku uruchomieniowym (VPS/VM/kontener + dedykowany użytkownik/systemowe konta OS).
- Nie loguj tego środowiska do prywatnych kont Apple/Google ani do prywatnych profili przeglądarki/menedżera haseł.
- Jeśli użytkownicy są dla siebie wzajemnie antagonistyczni, rozdziel ich według gateway/hosta/użytkownika OS.

Szczegóły modelu bezpieczeństwa: [Security](/pl/gateway/security).

## Używanie node z VPS

Możesz trzymać Gateway w chmurze i sparować **Node** na lokalnych urządzeniach
(Mac/iOS/Android/headless). Node zapewniają lokalne możliwości screen/camera/canvas oraz `system.run`,
podczas gdy Gateway pozostaje w chmurze.

Dokumentacja: [Node](/pl/nodes), [CLI Node](/pl/cli/nodes).

## Dostrajanie uruchamiania dla małych VM i hostów ARM

Jeśli polecenia CLI wydają się wolne na słabszych VM (albo hostach ARM), włącz cache kompilacji modułów Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` poprawia czas uruchamiania przy kolejnych wywołaniach poleceń.
- `OPENCLAW_NO_RESPAWN=1` unika dodatkowego narzutu startowego wynikającego ze ścieżki self-respawn.
- Pierwsze uruchomienie polecenia rozgrzewa cache; kolejne uruchomienia są szybsze.
- Szczegóły dla Raspberry Pi znajdziesz w [Raspberry Pi](/pl/install/raspberry-pi).

### Lista kontrolna dostrajania systemd (opcjonalnie)

Dla hostów VM używających `systemd` rozważ:

- Dodanie zmiennych środowiskowych usługi dla stabilnej ścieżki uruchamiania:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Jawne ustawienie zachowania restartu:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferowanie dysków opartych na SSD dla ścieżek stanu/cache, aby ograniczyć kary cold-start związane z losowym I/O.

Dla standardowej ścieżki `openclaw onboard --install-daemon` edytuj unit użytkownika:

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

Jeśli celowo zainstalowano system unit, zamiast tego edytuj
`openclaw-gateway.service` przez `sudo systemctl edit openclaw-gateway.service`.

Jak polityki `Restart=` pomagają w automatycznym odzyskiwaniu działania:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Informacje o zachowaniu Linux OOM, wyborze ofiary w procesach potomnych i diagnostyce
`exit 137` znajdziesz w [Linux memory pressure and OOM kills](/pl/platforms/linux#memory-pressure-and-oom-kills).

## Powiązane

- [Przegląd instalacji](/pl/install)
- [DigitalOcean](/pl/install/digitalocean)
- [Fly.io](/pl/install/fly)
- [Hetzner](/pl/install/hetzner)
