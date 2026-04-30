---
read_when:
    - Konfigurowanie OpenClaw w Oracle Cloud
    - Szukasz taniego hostingu VPS dla OpenClaw
    - Chcesz mieć OpenClaw 24/7 na małym serwerze
summary: OpenClaw w Oracle Cloud (zawsze bezpłatny ARM)
title: Oracle Cloud (platforma)
x-i18n:
    generated_at: "2026-04-30T10:05:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw w Oracle Cloud (OCI)

## Cel

Uruchom trwały OpenClaw Gateway w warstwie ARM **Always Free** Oracle Cloud.

Bezpłatna warstwa Oracle może być bardzo dobrym wyborem dla OpenClaw (zwłaszcza jeśli masz już konto OCI), ale wiąże się z kompromisami:

- Architektura ARM (większość rzeczy działa, ale niektóre pliki binarne mogą być dostępne tylko dla x86)
- Dostępność zasobów i rejestracja mogą być kapryśne

## Porównanie kosztów (2026)

| Dostawca     | Plan            | Specyfikacja           | Cena/mies. | Uwagi                       |
| ------------ | --------------- | ---------------------- | ---------- | --------------------------- |
| Oracle Cloud | Always Free ARM | do 4 OCPU, 24 GB RAM   | $0         | ARM, ograniczona dostępność |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM       | ~ $4       | Najtańsza płatna opcja      |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM       | $6         | Łatwy UI, dobra dokumentacja |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM       | $6         | Wiele lokalizacji           |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM       | $5         | Teraz część Akamai          |

---

## Wymagania wstępne

- Konto Oracle Cloud ([rejestracja](https://www.oracle.com/cloud/free/)) — jeśli napotkasz problemy, zobacz [społecznościowy przewodnik rejestracji](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Konto Tailscale (bezpłatne na [tailscale.com](https://tailscale.com))
- ~30 minut

## 1) Utwórz instancję OCI

1. Zaloguj się do [Oracle Cloud Console](https://cloud.oracle.com/)
2. Przejdź do **Compute → Instances → Create Instance**
3. Skonfiguruj:
   - **Nazwa:** `openclaw`
   - **Obraz:** Ubuntu 24.04 (aarch64)
   - **Kształt:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU:** 2 (lub do 4)
   - **Pamięć:** 12 GB (lub do 24 GB)
   - **Wolumin rozruchowy:** 50 GB (do 200 GB bezpłatnie)
   - **Klucz SSH:** Dodaj swój klucz publiczny
4. Kliknij **Create**
5. Zanotuj publiczny adres IP

**Wskazówka:** Jeśli tworzenie instancji nie powiedzie się z komunikatem „Out of capacity”, spróbuj użyć innej domeny dostępności albo ponów próbę później. Pojemność bezpłatnej warstwy jest ograniczona.

## 2) Połącz się i zaktualizuj

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Uwaga:** `build-essential` jest wymagany do kompilacji niektórych zależności na ARM.

## 3) Skonfiguruj użytkownika i nazwę hosta

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Zainstaluj Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Włącza to Tailscale SSH, dzięki czemu możesz łączyć się przez `ssh openclaw` z dowolnego urządzenia w swoim tailnecie — bez potrzeby używania publicznego IP.

Zweryfikuj:

```bash
tailscale status
```

**Od teraz łącz się przez Tailscale:** `ssh ubuntu@openclaw` (albo użyj IP Tailscale).

## 5) Zainstaluj OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Gdy pojawi się pytanie „How do you want to hatch your bot?”, wybierz **„Do this later”**.

> Uwaga: Jeśli napotkasz problemy z natywną kompilacją na ARM, zacznij od pakietów systemowych (np. `sudo apt install -y build-essential`), zanim sięgniesz po Homebrew.

## 6) Skonfiguruj Gateway (loopback + uwierzytelnianie tokenem) i włącz Tailscale Serve

Użyj uwierzytelniania tokenem jako domyślnego. Jest przewidywalne i pozwala uniknąć potrzeby używania flag „insecure auth” w Control UI.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` tutaj służy wyłącznie do obsługi forwarded-IP/local-client przez lokalny proxy Tailscale Serve. To **nie** jest `gateway.auth.mode: "trusted-proxy"`. W tej konfiguracji trasy przeglądarki różnic zachowują działanie fail-closed: surowe żądania przeglądarki do `127.0.0.1` bez nagłówków przekazanych przez proxy mogą zwrócić `Diff not found`. Użyj `mode=file` / `mode=both` dla załączników albo celowo włącz zdalne przeglądarki i ustaw `plugins.entries.diffs.config.viewerBaseUrl` (lub przekaż proxy `baseUrl`), jeśli potrzebujesz udostępnialnych linków do przeglądarki.

## 7) Zweryfikuj

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Zablokuj zabezpieczenia VCN

Gdy wszystko działa, zablokuj VCN, aby blokować cały ruch poza Tailscale. Virtual Cloud Network w OCI działa jak zapora na brzegu sieci — ruch jest blokowany, zanim dotrze do instancji.

1. Przejdź do **Networking → Virtual Cloud Networks** w konsoli OCI
2. Kliknij swój VCN → **Security Lists** → Default Security List
3. **Usuń** wszystkie reguły przychodzące poza:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Zachowaj domyślne reguły wychodzące (zezwalaj na cały ruch wychodzący)

Blokuje to SSH na porcie 22, HTTP, HTTPS i wszystko inne na brzegu sieci. Od teraz możesz łączyć się tylko przez Tailscale.

---

## Dostęp do Control UI

Z dowolnego urządzenia w sieci Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Zastąp `<tailnet-name>` nazwą swojego tailnetu (widoczną w `tailscale status`).

Tunel SSH nie jest potrzebny. Tailscale zapewnia:

- Szyfrowanie HTTPS (automatyczne certyfikaty)
- Uwierzytelnianie przez tożsamość Tailscale
- Dostęp z dowolnego urządzenia w Twoim tailnecie (laptop, telefon itp.)

---

## Bezpieczeństwo: VCN + Tailscale (zalecana podstawa)

Przy zablokowanym VCN (otwarty tylko UDP 41641) i Gateway związanym z loopback zyskujesz silną ochronę warstwową: ruch publiczny jest blokowany na brzegu sieci, a dostęp administracyjny odbywa się przez Twój tailnet.

Taka konfiguracja często usuwa _potrzebę_ dodatkowych reguł zapory na hoście wyłącznie po to, aby zatrzymać masowe próby brute force SSH z Internetu — ale nadal należy aktualizować system operacyjny, uruchamiać `openclaw security audit` i sprawdzać, czy przypadkowo nie nasłuchujesz na publicznych interfejsach.

### Już chronione

| Tradycyjny krok              | Potrzebne?      | Dlaczego                                                                     |
| ---------------------------- | --------------- | ---------------------------------------------------------------------------- |
| Zapora UFW                   | Nie             | VCN blokuje ruch, zanim dotrze do instancji                                  |
| fail2ban                     | Nie             | Brak brute force, jeśli port 22 jest zablokowany w VCN                       |
| Utwardzanie sshd             | Nie             | Tailscale SSH nie używa sshd                                                 |
| Wyłączenie logowania root    | Nie             | Tailscale używa tożsamości Tailscale, nie użytkowników systemowych           |
| Uwierzytelnianie tylko kluczem SSH | Nie       | Tailscale uwierzytelnia przez Twój tailnet                                   |
| Utwardzanie IPv6             | Zwykle nie      | Zależy od ustawień VCN/podsieci; sprawdź, co jest faktycznie przypisane/wystawione |

### Nadal zalecane

- **Uprawnienia poświadczeń:** `chmod 700 ~/.openclaw`
- **Audyt bezpieczeństwa:** `openclaw security audit`
- **Aktualizacje systemu:** regularnie `sudo apt update && sudo apt upgrade`
- **Monitorowanie Tailscale:** Przeglądaj urządzenia w [konsoli administratora Tailscale](https://login.tailscale.com/admin)

### Zweryfikuj stan zabezpieczeń

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Awaryjnie: tunel SSH

Jeśli Tailscale Serve nie działa, użyj tunelu SSH:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Następnie otwórz `http://localhost:18789`.

---

## Rozwiązywanie problemów

### Tworzenie instancji kończy się niepowodzeniem („Out of capacity”)

Instancje ARM w bezpłatnej warstwie są popularne. Spróbuj:

- Innej domeny dostępności
- Ponowić próbę poza godzinami szczytu (wczesnym rankiem)
- Użyć filtra „Always Free” przy wyborze kształtu

### Tailscale nie chce się połączyć

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway nie chce się uruchomić

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Nie można uzyskać dostępu do Control UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Problemy z plikami binarnymi ARM

Niektóre narzędzia mogą nie mieć kompilacji ARM. Sprawdź:

```bash
uname -m  # Should show aarch64
```

Większość pakietów npm działa poprawnie. W przypadku plików binarnych szukaj wydań `linux-arm64` lub `aarch64`.

---

## Trwałość

Cały stan znajduje się w:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/dostawców oraz dane sesji
- `~/.openclaw/workspace/` — workspace (SOUL.md, pamięć, artefakty)

Okresowo twórz kopie zapasowe:

```bash
openclaw backup create
```

---

## Powiązane

- [Zdalny dostęp do Gateway](/pl/gateway/remote) — inne wzorce zdalnego dostępu
- [Integracja Tailscale](/pl/gateway/tailscale) — pełna dokumentacja Tailscale
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
- [Przewodnik DigitalOcean](/pl/install/digitalocean) — jeśli chcesz płatną opcję i łatwiejszą rejestrację
- [Przewodnik Hetzner](/pl/install/hetzner) — alternatywa oparta na Dockerze
