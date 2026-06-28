---
read_when:
    - Konfigurowanie OpenClaw w Oracle Cloud
    - Szukasz darmowego hostingu VPS dla OpenClaw
    - Chcesz mieć OpenClaw 24/7 na małym serwerze
summary: Uruchom OpenClaw w warstwie ARM Always Free Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T09:19:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Uruchom trwały OpenClaw Gateway w warstwie ARM **Always Free** Oracle Cloud (do 4 OCPU, 24 GB RAM, 200 GB przestrzeni dyskowej) bez kosztów.

## Wymagania wstępne

- Konto Oracle Cloud ([rejestracja](https://www.oracle.com/cloud/free/)) -- jeśli napotkasz problemy, zobacz [społecznościowy przewodnik rejestracji](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Konto Tailscale (bezpłatne na [tailscale.com](https://tailscale.com))
- Para kluczy SSH
- Około 30 minut

## Konfiguracja

<Steps>
  <Step title="Utwórz instancję OCI">
    1. Zaloguj się do [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Przejdź do **Compute > Instances > Create Instance**.
    3. Skonfiguruj:
       - **Nazwa:** `openclaw`
       - **Obraz:** Ubuntu 24.04 (aarch64)
       - **Kształt:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (lub do 4)
       - **Pamięć:** 12 GB (lub do 24 GB)
       - **Wolumin rozruchowy:** 50 GB (do 200 GB bezpłatnie)
       - **Klucz SSH:** Dodaj swój klucz publiczny
    4. Kliknij **Create** i zanotuj publiczny adres IP.

    <Tip>
    Jeśli utworzenie instancji kończy się błędem „Out of capacity”, spróbuj użyć innej domeny dostępności albo ponów próbę później. Pojemność warstwy bezpłatnej jest ograniczona.
    </Tip>

  </Step>

  <Step title="Połącz się i zaktualizuj system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` jest wymagany do kompilacji ARM niektórych zależności.

  </Step>

  <Step title="Skonfiguruj użytkownika i nazwę hosta">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Włączenie linger utrzymuje usługi użytkownika po wylogowaniu.

  </Step>

  <Step title="Zainstaluj Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Od teraz łącz się przez Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Zainstaluj OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Po wyświetleniu pytania „How do you want to hatch your bot?” wybierz **Do this later**.

  </Step>

  <Step title="Skonfiguruj Gateway">
    Użyj uwierzytelniania tokenem z Tailscale Serve, aby zapewnić bezpieczny dostęp zdalny.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` tutaj służy tylko do obsługi przekazywanego adresu IP/klienta lokalnego przez lokalne proxy Tailscale Serve. To **nie** jest `gateway.auth.mode: "trusted-proxy"`. Trasy podglądu różnic zachowują w tej konfiguracji tryb bezpiecznego zamknięcia: surowe żądania podglądu z `127.0.0.1` bez przekazywanych nagłówków proxy mogą zwrócić `Diff not found`. Użyj `mode=file` / `mode=both` dla załączników albo świadomie włącz zdalne podglądy i ustaw `plugins.entries.diffs.config.viewerBaseUrl` (lub przekaż proxy `baseUrl`), jeśli potrzebujesz udostępnialnych linków do podglądu.

  </Step>

  <Step title="Zablokuj zabezpieczenia VCN">
    Zablokuj cały ruch z wyjątkiem Tailscale na brzegu sieci:

    1. Przejdź do **Networking > Virtual Cloud Networks** w konsoli OCI.
    2. Kliknij swoją VCN, a następnie **Security Lists > Default Security List**.
    3. **Usuń** wszystkie reguły ruchu przychodzącego poza `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Zachowaj domyślne reguły ruchu wychodzącego (zezwól na cały ruch wychodzący).

    Blokuje to SSH na porcie 22, HTTP, HTTPS i wszystko inne na brzegu sieci. Od tego momentu możesz łączyć się tylko przez Tailscale.

  </Step>

  <Step title="Zweryfikuj">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Uzyskaj dostęp do interfejsu sterowania z dowolnego urządzenia w swojej sieci tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Zastąp `<tailnet-name>` nazwą swojej sieci tailnet (widoczną w `tailscale status`).

  </Step>
</Steps>

## Zweryfikuj stan zabezpieczeń

Przy zablokowanej VCN (otwarty tylko UDP 41641) i Gateway powiązanym z loopback, ruch publiczny jest blokowany na brzegu sieci, a dostęp administracyjny jest dostępny tylko w sieci tailnet. Eliminuje to potrzebę kilku tradycyjnych kroków utwardzania VPS:

| Tradycyjny krok                | Potrzebny?       | Dlaczego                                                                 |
| ------------------------------ | ---------------- | ------------------------------------------------------------------------ |
| Zapora UFW                     | Nie              | VCN blokuje ruch, zanim dotrze on do instancji.                          |
| fail2ban                       | Nie              | Port 22 jest zablokowany w VCN; brak powierzchni do ataków brute-force.  |
| Utwardzanie sshd               | Nie              | Tailscale SSH nie używa sshd.                                            |
| Wyłączenie logowania root      | Nie              | Tailscale uwierzytelnia przez tożsamość tailnet, nie użytkowników systemu. |
| Uwierzytelnianie tylko kluczem SSH | Nie          | To samo — tożsamość tailnet zastępuje systemowe klucze SSH.              |
| Utwardzanie IPv6               | Zwykle nie       | Zależy od ustawień VCN/podsieci; sprawdź, co faktycznie jest przypisane/eksponowane. |

Nadal zalecane:

- `chmod 700 ~/.openclaw`, aby ograniczyć uprawnienia plików poświadczeń.
- `openclaw security audit` do sprawdzenia stanu zabezpieczeń specyficznego dla OpenClaw.
- Regularne `sudo apt update && sudo apt upgrade` dla poprawek systemu operacyjnego.
- Okresowo przeglądaj urządzenia w [konsoli administracyjnej Tailscale](https://login.tailscale.com/admin).

Szybkie polecenia weryfikacyjne:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Uwagi dotyczące ARM

Warstwa Always Free używa ARM (`aarch64`). Większość funkcji OpenClaw działa poprawnie; niewielka liczba natywnych plików binarnych wymaga kompilacji ARM:

- Node.js, Telegram, WhatsApp (Baileys): czysty JavaScript, bez problemów.
- Większość pakietów npm z kodem natywnym: dostępne są wstępnie zbudowane artefakty `linux-arm64`.
- Opcjonalne pomocniki CLI (np. pliki binarne Go/Rust dostarczane przez Skills): przed instalacją sprawdź, czy istnieje wydanie `aarch64` / `linux-arm64`.

Zweryfikuj architekturę za pomocą `uname -m` (powinno wypisać `aarch64`). W przypadku plików binarnych bez kompilacji ARM zainstaluj je ze źródeł albo je pomiń.

## Trwałość i kopie zapasowe

Stan OpenClaw znajduje się w:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, stan kanałów/dostawców i dane sesji.
- `~/.openclaw/workspace/` — przestrzeń robocza agenta (SOUL.md, pamięć, artefakty).

Przetrwają one ponowne uruchomienia. Aby utworzyć przenośną migawkę:

```bash
openclaw backup create
```

## Rozwiązanie awaryjne: tunel SSH

Jeśli Tailscale Serve nie działa, użyj tunelu SSH z komputera lokalnego:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Następnie otwórz `http://localhost:18789`.

## Rozwiązywanie problemów

**Utworzenie instancji kończy się błędem („Out of capacity”)** -- Instancje ARM w warstwie bezpłatnej są popularne. Spróbuj użyć innej domeny dostępności albo ponów próbę poza godzinami szczytu.

**Tailscale nie łączy się** -- Uruchom `sudo tailscale up --ssh --hostname=openclaw --reset`, aby ponownie się uwierzytelnić.

**Gateway nie uruchamia się** -- Uruchom `openclaw doctor --non-interactive` i sprawdź dzienniki za pomocą `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemy z plikami binarnymi ARM** -- Większość pakietów npm działa na ARM64. W przypadku natywnych plików binarnych szukaj wydań `linux-arm64` lub `aarch64`. Zweryfikuj architekturę za pomocą `uname -m`.

## Następne kroki

- [Kanały](/pl/channels) -- połącz Telegram, WhatsApp, Discord i więcej
- [Konfiguracja Gateway](/pl/gateway/configuration) -- wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) -- utrzymuj OpenClaw w aktualnej wersji

## Powiązane

- [Omówienie instalacji](/pl/install)
- [GCP](/pl/install/gcp)
- [Hosting VPS](/pl/vps)
