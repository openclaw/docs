---
read_when:
    - Konfigurowanie OpenClaw na Oracle Cloud
    - Szukanie taniego hostingu VPS dla OpenClaw
    - Chcesz uruchomić OpenClaw 24/7 na małym serwerze
summary: OpenClaw na Oracle Cloud (Always Free ARM)
title: Oracle Cloud (platforma)
x-i18n:
    generated_at: "2026-04-05T14:00:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw na Oracle Cloud (OCI)

## Cel

Uruchom trwałą bramę OpenClaw Gateway w warstwie **Always Free** ARM w Oracle Cloud.

Bezpłatna warstwa Oracle może świetnie pasować do OpenClaw (zwłaszcza jeśli masz już konto OCI), ale wiąże się z kompromisami:

- Architektura ARM (większość rzeczy działa, ale niektóre binaria mogą być dostępne tylko dla x86)
- Dostępność zasobów i sam proces rejestracji bywają kapryśne

## Porównanie kosztów (2026)

| Dostawca      | Plan            | Specyfikacja           | Cena/mies. | Uwagi                 |
| ------------- | --------------- | ---------------------- | ---------- | --------------------- |
| Oracle Cloud  | Always Free ARM | do 4 OCPU, 24 GB RAM   | $0         | ARM, ograniczona pojemność |
| Hetzner       | CX22            | 2 vCPU, 4 GB RAM       | ~ $4       | Najtańsza opcja płatna |
| DigitalOcean  | Basic           | 1 vCPU, 1 GB RAM       | $6         | Prosty interfejs, dobra dokumentacja |
| Vultr         | Cloud Compute   | 1 vCPU, 1 GB RAM       | $6         | Wiele lokalizacji     |
| Linode        | Nanode          | 1 vCPU, 1 GB RAM       | $5         | Teraz część Akamai    |

---

## Wymagania wstępne

- Konto Oracle Cloud ([rejestracja](https://www.oracle.com/cloud/free/)) — zobacz [społecznościowy poradnik rejestracji](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), jeśli napotkasz problemy
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
   - **SSH key:** Dodaj swój klucz publiczny
4. Kliknij **Create**
5. Zanotuj publiczny adres IP

**Wskazówka:** Jeśli tworzenie instancji kończy się błędem „Out of capacity”, spróbuj innej domeny dostępności albo ponów próbę później. Pojemność warstwy bezpłatnej jest ograniczona.

## 2) Połącz się i zaktualizuj system

```bash
# Połącz przez publiczny adres IP
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

# Włącz lingering (utrzymuje usługi użytkownika po wylogowaniu)
sudo loginctl enable-linger ubuntu
```

## 4) Zainstaluj Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

To włącza Tailscale SSH, dzięki czemu możesz łączyć się przez `ssh openclaw` z dowolnego urządzenia w swojej tailnet — bez potrzeby używania publicznego IP.

Sprawdź:

```bash
tailscale status
```

**Od teraz łącz się przez Tailscale:** `ssh ubuntu@openclaw` (lub użyj adresu IP Tailscale).

## 5) Zainstaluj OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Gdy pojawi się pytanie „How do you want to hatch your bot?”, wybierz **„Do this later”**.

> Uwaga: Jeśli napotkasz problemy z natywnym buildem dla ARM, zacznij od pakietów systemowych (na przykład `sudo apt install -y build-essential`), zanim sięgniesz po Homebrew.

## 6) Skonfiguruj Gateway (local loopback + uwierzytelnianie tokenem) i włącz Tailscale Serve

Jako domyślnego ustaw uwierzytelnianie tokenem. Jest przewidywalne i pozwala uniknąć flag „insecure auth” w interfejsie Control UI.

```bash
# Zachowaj prywatność Gateway na VM
openclaw config set gateway.bind loopback

# Wymagaj uwierzytelniania dla Gateway i Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Udostępnij przez Tailscale Serve (HTTPS + dostęp z tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` w tym przypadku służy wyłącznie do obsługi przekazywanego IP i klienta lokalnego przez lokalny proxy Tailscale Serve. To **nie jest** `gateway.auth.mode: "trusted-proxy"`. Trasy podglądu diffów zachowują w tej konfiguracji bezpieczne domyślne blokowanie: surowe żądania widoku do `127.0.0.1` bez nagłówków przekazanych przez proxy mogą zwracać `Diff not found`. Użyj `mode=file` / `mode=both` dla załączników albo świadomie włącz zdalne widoki i ustaw `plugins.entries.diffs.config.viewerBaseUrl` (lub przekaż proxy `baseUrl`), jeśli potrzebujesz linków do widoku, które można udostępniać.

## 7) Weryfikacja

```bash
# Sprawdź wersję
openclaw --version

# Sprawdź stan demona
systemctl --user status openclaw-gateway.service

# Sprawdź Tailscale Serve
tailscale serve status

# Przetestuj lokalną odpowiedź
curl http://localhost:18789
```

## 8) Zabezpiecz listy bezpieczeństwa VCN

Gdy wszystko już działa, ogranicz reguły VCN, aby blokować cały ruch poza Tailscale. Virtual Cloud Network OCI działa jak zapora na brzegu sieci — ruch jest blokowany, zanim dotrze do instancji.

1. Przejdź do **Networking → Virtual Cloud Networks** w OCI Console
2. Kliknij swoją VCN → **Security Lists** → Default Security List
3. **Usuń** wszystkie reguły ruchu przychodzącego poza:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Zachowaj domyślne reguły ruchu wychodzącego (zezwalające na cały ruch wychodzący)

To blokuje SSH na porcie 22, HTTP, HTTPS i wszystko inne na brzegu sieci. Od teraz możesz łączyć się wyłącznie przez Tailscale.

---

## Dostęp do Control UI

Z dowolnego urządzenia w swojej sieci Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Zastąp `<tailnet-name>` nazwą swojej tailnet (widoczną w `tailscale status`).

Tunel SSH nie jest potrzebny. Tailscale zapewnia:

- Szyfrowanie HTTPS (automatyczne certyfikaty)
- Uwierzytelnianie przez tożsamość Tailscale
- Dostęp z dowolnego urządzenia w twojej tailnet (laptop, telefon itp.)

---

## Bezpieczeństwo: VCN + Tailscale (zalecana baza)

Przy zablokowanym VCN (otwarte tylko UDP 41641) i Gateway powiązanym z local loopback otrzymujesz solidną ochronę warstwową: ruch publiczny jest blokowany na brzegu sieci, a dostęp administracyjny odbywa się przez twoją tailnet.

Ta konfiguracja często eliminuje _potrzebę_ dodatkowych reguł zapory na hoście tylko po to, aby zatrzymać zmasowane próby SSH z Internetu — ale nadal warto aktualizować system, uruchamiać `openclaw security audit` i sprawdzać, czy nic przypadkiem nie nasłuchuje na publicznych interfejsach.

### Już chronione

| Tradycyjny krok   | Potrzebny?  | Dlaczego                                                                     |
| ----------------- | ----------- | ----------------------------------------------------------------------------- |
| Zapora UFW        | Nie         | VCN blokuje ruch, zanim dotrze do instancji                                   |
| fail2ban          | Nie         | Brak brute force, jeśli port 22 jest zablokowany na poziomie VCN              |
| Hardening `sshd`  | Nie         | Tailscale SSH nie używa `sshd`                                                |
| Wyłączenie logowania root | Nie | Tailscale używa tożsamości Tailscale, a nie użytkowników systemowych         |
| Tylko uwierzytelnianie kluczem SSH | Nie | Tailscale uwierzytelnia przez twoją tailnet                        |
| Hardening IPv6    | Zwykle nie  | Zależy od ustawień VCN/podsieci; sprawdź, co faktycznie jest przypisane i wystawione |

### Nadal zalecane

- **Uprawnienia do poświadczeń:** `chmod 700 ~/.openclaw`
- **Audyt bezpieczeństwa:** `openclaw security audit`
- **Aktualizacje systemu:** regularnie `sudo apt update && sudo apt upgrade`
- **Monitorowanie Tailscale:** przeglądaj urządzenia w [konsoli administracyjnej Tailscale](https://login.tailscale.com/admin)

### Zweryfikuj stan bezpieczeństwa

```bash
# Potwierdź, że nie nasłuchują żadne publiczne porty
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Sprawdź, czy Tailscale SSH jest aktywne
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opcjonalnie: całkowicie wyłącz sshd
sudo systemctl disable --now ssh
```

---

## Wariant awaryjny: tunel SSH

Jeśli Tailscale Serve nie działa, użyj tunelu SSH:

```bash
# Z komputera lokalnego (przez Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Następnie otwórz `http://localhost:18789`.

---

## Rozwiązywanie problemów

### Tworzenie instancji kończy się niepowodzeniem („Out of capacity”)

Instancje ARM z warstwy bezpłatnej są popularne. Spróbuj:

- Innej domeny dostępności
- Ponowienia próby poza godzinami szczytu (wczesnym rankiem)
- Użycia filtra „Always Free” podczas wyboru kształtu instancji

### Tailscale nie łączy się

```bash
# Sprawdź stan
sudo tailscale status

# Uwierzytelnij ponownie
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway nie uruchamia się

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Brak dostępu do Control UI

```bash
# Sprawdź, czy Tailscale Serve działa
tailscale serve status

# Sprawdź, czy gateway nasłuchuje
curl http://localhost:18789

# Uruchom ponownie, jeśli potrzeba
systemctl --user restart openclaw-gateway.service
```

### Problemy z binariami ARM

Niektóre narzędzia mogą nie mieć buildów dla ARM. Sprawdź:

```bash
uname -m  # Powinno zwrócić aarch64
```

Większość pakietów npm działa bez problemu. W przypadku binariów szukaj wydań `linux-arm64` lub `aarch64`.

---

## Trwałość danych

Cały stan znajduje się w:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` dla poszczególnych agentów, stan kanałów/dostawców oraz dane sesji
- `~/.openclaw/workspace/` — workspace (SOUL.md, pamięć, artefakty)

Twórz kopie zapasowe okresowo:

```bash
openclaw backup create
```

---

## Zobacz także

- [Zdalny dostęp do Gateway](/pl/gateway/remote) — inne wzorce zdalnego dostępu
- [Integracja z Tailscale](/pl/gateway/tailscale) — pełna dokumentacja Tailscale
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
- [Przewodnik po DigitalOcean](/pl/install/digitalocean) — jeśli chcesz opcję płatną z prostszą rejestracją
- [Przewodnik po Hetzner](/pl/install/hetzner) — alternatywa oparta na Dockerze
