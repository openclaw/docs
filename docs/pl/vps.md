---
read_when:
    - Chcesz uruchomić Gateway na serwerze Linux lub cloud VPS
    - Potrzebujesz szybkiej mapy przewodników hostingowych
    - Chcesz poznać ogólne strojenie OpenClaw dla serwera Linux
sidebarTitle: Linux Server
summary: Uruchamianie OpenClaw na serwerze Linux lub cloud VPS — wybór dostawcy, architektura i strojenie
title: Serwer Linux
x-i18n:
    generated_at: "2026-04-05T14:10:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Serwer Linux

Uruchom Gateway OpenClaw na dowolnym serwerze Linux albo cloud VPS. Ta strona pomaga
wybrać dostawcę, wyjaśnia, jak działają wdrożenia chmurowe, i omawia ogólne strojenie Linuksa,
które działa wszędzie.

## Wybierz dostawcę

<CardGroup cols={2}>
  <Card title="Railway" href="/install/railway">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="Northflank" href="/install/northflank">Konfiguracja jednym kliknięciem w przeglądarce</Card>
  <Card title="DigitalOcean" href="/install/digitalocean">Prosty płatny VPS</Card>
  <Card title="Oracle Cloud" href="/install/oracle">Warstwa Always Free ARM</Card>
  <Card title="Fly.io" href="/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/install/hetzner">Docker na VPS Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/install/exe-dev">VM z proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** również działa dobrze.
Społecznościowy materiał wideo krok po kroku jest dostępny pod adresem
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(zasób społeczności -- może stać się niedostępny).

## Jak działają konfiguracje chmurowe

- **Gateway działa na VPS** i zarządza stanem + workspace.
- Łączysz się z laptopa lub telefonu przez **Control UI** albo **Tailscale/SSH**.
- Traktuj VPS jako źródło prawdy i regularnie wykonuj **kopie zapasowe** stanu + workspace.
- Bezpieczna wartość domyślna: utrzymuj Gateway na loopback i uzyskuj dostęp przez tunel SSH albo Tailscale Serve.
  Jeśli bindowanie ustawisz na `lan` albo `tailnet`, wymagaj `gateway.auth.token` albo `gateway.auth.password`.

Powiązane strony: [Zdalny dostęp do Gateway](/gateway/remote), [Hub platform](/platforms).

## Współdzielony agent firmowy na VPS

Uruchamianie jednego agenta dla zespołu jest poprawną konfiguracją, gdy wszyscy użytkownicy należą do tej samej granicy zaufania, a agent służy wyłącznie do celów biznesowych.

- Utrzymuj go na dedykowanym runtime (VPS/VM/kontener + dedykowany użytkownik OS / konta).
- Nie loguj tego runtime do osobistych kont Apple/Google ani osobistych profili przeglądarki / menedżera haseł.
- Jeśli użytkownicy są wobec siebie antagonistyczni, rozdziel ich według gateway / hosta / użytkownika OS.

Szczegóły modelu bezpieczeństwa: [Bezpieczeństwo](/gateway/security).

## Używanie node z VPS

Możesz utrzymywać Gateway w chmurze i parować **nody** na swoich urządzeniach lokalnych
(Mac/iOS/Android/headless). Nody udostępniają lokalne możliwości ekranu/kamery/canvas i `system.run`,
podczas gdy Gateway pozostaje w chmurze.

Dokumentacja: [Nodes](/nodes), [CLI Nodes](/cli/nodes).

## Strojenie startu dla małych VM i hostów ARM

Jeśli polecenia CLI działają wolno na słabszych VM (albo hostach ARM), włącz cache kompilacji modułów Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` poprawia czas uruchamiania kolejnych poleceń.
- `OPENCLAW_NO_RESPAWN=1` unika dodatkowego narzutu startowego ścieżki self-respawn.
- Pierwsze uruchomienie polecenia rozgrzewa cache; kolejne są szybsze.
- Szczegóły dotyczące Raspberry Pi znajdziesz w [Raspberry Pi](/install/raspberry-pi).

### Lista kontrolna strojenia systemd (opcjonalnie)

Dla hostów VM używających `systemd` rozważ:

- Dodanie env usługi dla stabilnej ścieżki startowej:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Jawne zachowanie restartu:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferowanie dysków opartych na SSD dla ścieżek state/cache, aby ograniczyć kary cold-start związane z losowym I/O.

Dla standardowej ścieżki `openclaw onboard --install-daemon` edytuj user unit:

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

Jeśli celowo zainstalowałeś system unit, zamiast tego edytuj
`openclaw-gateway.service` przez `sudo systemctl edit openclaw-gateway.service`.

Jak polityki `Restart=` pomagają w automatycznym odzyskiwaniu usług:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).
