---
read_when:
    - Konfigurowanie OpenClaw na Oracle Cloud
    - Szukasz taniego hostingu VPS dla OpenClaw
    - Chcesz mieć OpenClaw 24/7 na małym serwerze
summary: OpenClaw na Oracle Cloud (Always Free ARM)
title: Oracle Cloud (platforma)
x-i18n:
    generated_at: "2026-04-24T09:21:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw na Oracle Cloud (OCI)

## Cel

Uruchom trwały Gateway OpenClaw na darmowej warstwie ARM **Always Free** Oracle Cloud.

Darmowa warstwa Oracle może dobrze pasować do OpenClaw (szczególnie jeśli masz już konto OCI), ale wiąże się z kompromisami:

- Architektura ARM (większość rzeczy działa, ale niektóre binaria mogą być tylko dla x86)
- Pojemność i rejestracja bywają kapryśne

## Porównanie kosztów (2026)

| Provider     | Plan            | Specyfikacja            | Cena/mies. | Uwagi                 |
| ------------ | --------------- | ----------------------- | ---------- | --------------------- |
| Oracle Cloud | Always Free ARM | do 4 OCPU, 24 GB RAM    | $0         | ARM, ograniczona pojemność |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM        | ~ $4       | Najtańsza opcja płatna |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM        | $6         | Łatwy interfejs, dobra dokumentacja |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM        | $6         | Wiele lokalizacji     |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM        | $5         | Teraz część Akamai    |

---

## Wymagania wstępne

- Konto Oracle Cloud ([rejestracja](https://www.oracle.com/cloud/free/)) — jeśli napotkasz problemy, zobacz [społecznościowy przewodnik rejestracji](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Konto Tailscale (bezpłatne na [tailscale.com](https://tailscale.com))
- Około 30 minut

## 1) Utwórz instancję OCI

1. Zaloguj się do [Oracle Cloud Console](https://cloud.oracle.com/)
2. Przejdź do **Compute → Instances → Create Instance**
3. Skonfiguruj:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (lub do 4)
   - **Memory:** 12 GB (lub do 24 GB)
   - **Boot volume:** 50 GB (do 200 GB za darmo)
   - **SSH key:** dodaj swój klucz publiczny
4. Kliknij **Create**
5. Zanotuj publiczny adres IP

**Wskazówka:** jeśli tworzenie instancji kończy się błędem „Out of capacity”, spróbuj innej availability domain albo ponów próbę później. Pojemność darmowej warstwy jest ograniczona.

## 2) Połącz się i zaktualizuj system

```bash
# Połącz przez publiczny IP
ssh ubuntu@YOUR_PUBLIC_IP

# Zaktualizuj system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Uwaga:** `build-essential` jest wymagane do kompilacji ARM niektórych zależności.

## 3) Skonfiguruj użytkownika i nazwę hosta

```bash
# Ustaw nazwę hosta
sudo hostnamectl set-hostname openclaw

# Ustaw hasło dla użytkownika ubuntu
sudo passwd ubuntu

# Włącz lingering (utrzymuje usługi użytkownika uruchomione po wylogowaniu)
sudo loginctl enable-linger ubuntu
```

## 4) Zainstaluj Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

To włącza Tailscale SSH, dzięki czemu możesz łączyć się przez `ssh openclaw` z dowolnego urządzenia w swoim tailnet — bez potrzeby używania publicznego IP.

Zweryfikuj:

```bash
tailscale status
```

**Od tej chwili łącz się przez Tailscale:** `ssh ubuntu@openclaw` (albo użyj adresu IP Tailscale).

## 5) Zainstaluj OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Gdy pojawi się pytanie „How do you want to hatch your bot?”, wybierz **„Do this later”**.

> Uwaga: jeśli napotkasz problemy z natywną kompilacją ARM, zacznij od pakietów systemowych (np. `sudo apt install -y build-essential`), zanim sięgniesz po Homebrew.

## 6) Skonfiguruj Gateway (loopback + auth tokenem) i włącz Tailscale Serve

Użyj auth tokenem jako ustawienia domyślnego. Jest przewidywalne i pozwala uniknąć konieczności używania flag „insecure auth” dla interfejsu Control UI.

```bash
# Zachowaj prywatność Gateway na VM
openclaw config set gateway.bind loopback

# Wymagaj auth dla Gateway + interfejsu Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Wystaw przez Tailscale Serve (HTTPS + dostęp tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` jest tutaj używane tylko do obsługi przekazywanego IP i wykrywania lokalnego klienta dla lokalnego proxy Tailscale Serve. To **nie** jest `gateway.auth.mode: "trusted-proxy"`. Trasy diff viewer zachowują w tej konfiguracji tryb fail-closed: surowe żądania viewer pod `127.0.0.1` bez przekazanych nagłówków proxy mogą zwracać `Diff not found`. Użyj `mode=file` / `mode=both` dla załączników albo celowo włącz zdalne viewery i ustaw `plugins.entries.diffs.config.viewerBaseUrl` (lub przekaż proxy `baseUrl`), jeśli potrzebujesz współdzielalnych linków viewer.

## 7) Zweryfikuj

```bash
# Sprawdź wersję
openclaw --version

# Sprawdź status daemon
systemctl --user status openclaw-gateway.service

# Sprawdź Tailscale Serve
tailscale serve status

# Przetestuj lokalną odpowiedź
curl http://localhost:18789
```

## 8) Zablokuj zabezpieczenia VCN

Gdy wszystko działa, zablokuj VCN, aby blokować cały ruch poza Tailscale. Virtual Cloud Network OCI działa jak firewall na brzegu sieci — ruch jest blokowany, zanim dotrze do Twojej instancji.

1. Przejdź do **Networking → Virtual Cloud Networks** w OCI Console
2. Kliknij swój VCN → **Security Lists** → Default Security List
3. **Usuń** wszystkie reguły ingress poza:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Zachowaj domyślne reguły egress (zezwól na cały ruch wychodzący)

To blokuje SSH na porcie 22, HTTP, HTTPS i wszystko inne na brzegu sieci. Od tej pory możesz łączyć się tylko przez Tailscale.

---

## Dostęp do interfejsu Control UI

Z dowolnego urządzenia w Twojej sieci Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Zastąp `<tailnet-name>` nazwą swojego tailnet (widoczną w `tailscale status`).

Nie jest potrzebny tunel SSH. Tailscale zapewnia:

- szyfrowanie HTTPS (automatyczne certyfikaty)
- uwierzytelnianie przez tożsamość Tailscale
- dostęp z dowolnego urządzenia w tailnet (laptop, telefon itd.)

---

## Bezpieczeństwo: VCN + Tailscale (zalecana baza)

Przy zablokowanym VCN (otwarte tylko UDP 41641) i Gateway zbindowanym do loopback otrzymujesz silne defense-in-depth: ruch publiczny jest blokowany na brzegu sieci, a dostęp administracyjny odbywa się przez tailnet.

Ta konfiguracja często usuwa _potrzebę_ dodatkowych reguł firewalla na hoście tylko po to, aby zatrzymać globalny brute force na SSH z internetu — ale nadal powinieneś aktualizować system OS, uruchamiać `openclaw security audit` i sprawdzać, czy nie nasłuchujesz przypadkiem na publicznych interfejsach.

### Już chronione

| Tradycyjny krok    | Potrzebny?  | Dlaczego                                                                     |
| ------------------ | ----------- | ----------------------------------------------------------------------------- |
| Firewall UFW       | Nie         | VCN blokuje ruch, zanim dotrze do instancji                                   |
| fail2ban           | Nie         | Brak brute force, jeśli port 22 jest zablokowany na VCN                       |
| Hardening sshd     | Nie         | Tailscale SSH nie używa sshd                                                  |
| Wyłączenie logowania root | Nie  | Tailscale używa tożsamości Tailscale, a nie użytkowników systemowych          |
| Auth SSH tylko kluczem | Nie     | Tailscale uwierzytelnia przez Twój tailnet                                    |
| Hardening IPv6     | Zwykle nie  | Zależy od ustawień VCN/subnet; sprawdź, co jest faktycznie przypisane/wystawione |

### Nadal zalecane

- **Uprawnienia do poświadczeń:** `chmod 700 ~/.openclaw`
- **Audyt bezpieczeństwa:** `openclaw security audit`
- **Aktualizacje systemu:** regularnie `sudo apt update && sudo apt upgrade`
- **Monitoruj Tailscale:** przeglądaj urządzenia w [konsoli administracyjnej Tailscale](https://login.tailscale.com/admin)

### Zweryfikuj postawę bezpieczeństwa

```bash
# Potwierdź, że nie nasłuchują żadne porty publiczne
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Zweryfikuj, że Tailscale SSH jest aktywne
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opcjonalnie: całkowicie wyłącz sshd
sudo systemctl disable --now ssh
```

---

## Fallback: tunel SSH

Jeśli Tailscale Serve nie działa, użyj tunelu SSH:

```bash
# Na lokalnej maszynie (przez Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Następnie otwórz `http://localhost:18789`.

---

## Rozwiązywanie problemów

### Tworzenie instancji nie działa („Out of capacity”)

Instancje ARM darmowej warstwy są popularne. Spróbuj:

- Innej availability domain
- Ponowienia próby poza godzinami szczytu (wcześnie rano)
- Użycia filtra „Always Free” przy wyborze shape

### Tailscale nie chce się połączyć

```bash
# Sprawdź status
sudo tailscale status

# Uwierzytelnij ponownie
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway nie chce się uruchomić

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Nie można otworzyć interfejsu Control UI

```bash
# Zweryfikuj, że działa Tailscale Serve
tailscale serve status

# Sprawdź, czy gateway nasłuchuje
curl http://localhost:18789

# W razie potrzeby uruchom ponownie
systemctl --user restart openclaw-gateway.service
```

### Problemy z binariami ARM

Niektóre narzędzia mogą nie mieć kompilacji ARM. Sprawdź:

```bash
uname -m  # Powinno pokazać aarch64
```

Większość pakietów npm działa poprawnie. W przypadku binariów szukaj wydań `linux-arm64` lub `aarch64`.

---

## Trwałość

Cały stan znajduje się w:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/providerów oraz dane sesji
- `~/.openclaw/workspace/` — obszar roboczy (SOUL.md, pamięć, artefakty)

Regularnie wykonuj kopie zapasowe:

```bash
openclaw backup create
```

---

## Powiązane

- [Zdalny dostęp do Gateway](/pl/gateway/remote) — inne wzorce zdalnego dostępu
- [Integracja Tailscale](/pl/gateway/tailscale) — pełna dokumentacja Tailscale
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
- [Przewodnik DigitalOcean](/pl/install/digitalocean) — jeśli chcesz płatnej opcji + łatwiejszej rejestracji
- [Przewodnik Hetzner](/pl/install/hetzner) — alternatywa oparta na Docker
