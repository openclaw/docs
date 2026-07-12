---
read_when:
    - Konfigurowanie OpenClaw w Oracle Cloud
    - Szukasz bezpłatnego hostingu VPS dla OpenClaw
    - Chcesz, aby OpenClaw działał całodobowo na małym serwerze
summary: Hostuj OpenClaw w bezpłatnej warstwie ARM Always Free usługi Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T15:16:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Uruchom trwały Gateway OpenClaw w warstwie ARM **Always Free** Oracle Cloud (do 4 OCPU, 24 GB RAM i 200 GB pamięci masowej) bez żadnych kosztów.

## Wymagania wstępne

- Konto Oracle Cloud ([rejestracja](https://www.oracle.com/cloud/free/)) — w razie problemów zobacz [społecznościowy przewodnik po rejestracji](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Konto Tailscale (bezpłatne na [tailscale.com](https://tailscale.com))
- Para kluczy SSH
- Około 30 minut

## Konfiguracja

<Steps>
  <Step title="Utwórz instancję OCI">
    1. Zaloguj się do [konsoli Oracle Cloud](https://cloud.oracle.com/).
    2. Przejdź do **Compute > Instances > Create Instance**.
    3. Skonfiguruj:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (lub maksymalnie 4)
       - **Memory:** 12 GB (lub maksymalnie 24 GB)
       - **Boot volume:** 50 GB (bezpłatnie do 200 GB)
       - **SSH key:** Dodaj swój klucz publiczny
    4. Kliknij **Create** i zanotuj publiczny adres IP.

    <Tip>
    Jeśli tworzenie instancji zakończy się niepowodzeniem z komunikatem „Out of capacity”, wybierz inną domenę dostępności lub spróbuj ponownie później. Zasoby warstwy bezpłatnej są ograniczone.
    </Tip>

  </Step>

  <Step title="Połącz się i zaktualizuj system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    Pakiet `build-essential` jest wymagany do kompilowania niektórych zależności dla architektury ARM.

  </Step>

  <Step title="Skonfiguruj użytkownika i nazwę hosta">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Włączenie mechanizmu linger pozwala usługom użytkownika działać po wylogowaniu.

  </Step>

  <Step title="Zainstaluj Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Od tej chwili łącz się przez Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Zainstaluj OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Gdy pojawi się pytanie „How do you want to hatch your bot?”, wybierz **Do this later**.

  </Step>

  <Step title="Skonfiguruj Gateway">
    Użyj uwierzytelniania tokenem wraz z Tailscale Serve, aby zapewnić bezpieczny dostęp zdalny.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Ustawienie `gateway.trustedProxies=["127.0.0.1"]` dotyczy tutaj wyłącznie obsługi przekazanego adresu IP i klienta lokalnego przez lokalny serwer proxy Tailscale Serve. **Nie** jest to `gateway.auth.mode: "trusted-proxy"`. W tej konfiguracji trasy przeglądarki różnic zachowują zasadę bezpiecznego odrzucania: bezpośrednie żądania przeglądarki do `127.0.0.1` bez przekazanych nagłówków serwera proxy zwracają `Diff not found`. W przypadku załączników użyj `mode=file` / `mode=both`. Jeśli potrzebujesz udostępnialnych łączy do przeglądarki, świadomie włącz zdalne przeglądarki i ustaw `plugins.entries.diffs.config.viewerBaseUrl` (lub przekaż `baseUrl` serwera proxy).

  </Step>

  <Step title="Ogranicz dostęp w zabezpieczeniach VCN">
    Zablokuj na granicy sieci cały ruch z wyjątkiem Tailscale:

    1. W konsoli OCI przejdź do **Networking > Virtual Cloud Networks**.
    2. Kliknij swoją sieć VCN, a następnie **Security Lists > Default Security List**.
    3. **Usuń** wszystkie reguły ruchu przychodzącego z wyjątkiem `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Zachowaj domyślne reguły ruchu wychodzącego (zezwalające na cały ruch wychodzący).

    Spowoduje to zablokowanie SSH na porcie 22, protokołów HTTP i HTTPS oraz całego pozostałego ruchu na granicy sieci. Od tej chwili możesz łączyć się wyłącznie przez Tailscale.

  </Step>

  <Step title="Zweryfikuj konfigurację">
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

    Zastąp `<tailnet-name>` nazwą swojej sieci tailnet (widoczną w wyniku polecenia `tailscale status`).

  </Step>
</Steps>

## Weryfikacja poziomu zabezpieczeń

Po ograniczeniu dostępu do VCN (otwarty jest tylko port UDP 41641) i powiązaniu Gateway z local loopback ruch publiczny zostaje zablokowany na granicy sieci, a dostęp administracyjny jest możliwy wyłącznie z sieci tailnet. Eliminuje to potrzebę stosowania kilku tradycyjnych metod zabezpieczania serwera VPS:

| Tradycyjne działanie                 | Wymagane?       | Dlaczego                                                                 |
| ------------------------------------ | --------------- | ------------------------------------------------------------------------ |
| Zapora UFW                           | Nie             | VCN blokuje ruch, zanim dotrze on do instancji.                          |
| fail2ban                             | Nie             | Port 22 jest zablokowany przez VCN, więc nie ma powierzchni ataku siłowego. |
| Wzmacnianie zabezpieczeń sshd        | Nie             | Tailscale SSH nie korzysta z sshd.                                       |
| Wyłączenie logowania użytkownika root | Nie            | Tailscale uwierzytelnia na podstawie tożsamości tailnet, a nie użytkowników systemu. |
| Uwierzytelnianie SSH tylko kluczem   | Nie             | Tak samo — tożsamość tailnet zastępuje systemowe klucze SSH.             |
| Wzmacnianie zabezpieczeń IPv6        | Zwykle nie      | Zależy od ustawień VCN/podsieci; sprawdź, co zostało faktycznie przypisane i udostępnione. |

Nadal zalecane:

- `chmod 700 ~/.openclaw`, aby ograniczyć uprawnienia do plików poświadczeń.
- `openclaw security audit`, aby sprawdzić zabezpieczenia specyficzne dla OpenClaw.
- Regularne wykonywanie `sudo apt update && sudo apt upgrade` w celu instalowania poprawek systemu operacyjnego.
- Okresowe przeglądanie urządzeń w [konsoli administracyjnej Tailscale](https://login.tailscale.com/admin).

Polecenia do szybkiej weryfikacji:

```bash
# Potwierdź, że żadne porty publiczne nie nasłuchują
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Sprawdź, czy Tailscale SSH jest aktywne
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opcjonalnie: całkowicie wyłącz sshd po potwierdzeniu, że Tailscale SSH działa
sudo systemctl disable --now ssh
```

## Uwagi dotyczące ARM

Warstwa Always Free korzysta z architektury ARM (`aarch64`). Większość funkcji OpenClaw działa prawidłowo, ale niewielka liczba natywnych plików binarnych wymaga kompilacji dla ARM:

- Node.js, Telegram, WhatsApp (Baileys): czysty JavaScript, bez problemów.
- Większość pakietów npm z kodem natywnym: dostępne są gotowe artefakty `linux-arm64`.
- Opcjonalne narzędzia pomocnicze CLI (np. pliki binarne Go/Rust dostarczane przez Skills): przed instalacją sprawdź dostępność wydania `aarch64` / `linux-arm64`.

Sprawdź architekturę za pomocą polecenia `uname -m` (powinno wyświetlić `aarch64`). Pliki binarne bez kompilacji dla ARM zainstaluj ze źródeł lub pomiń.

## Trwałość danych i kopie zapasowe

Stan OpenClaw znajduje się w następujących katalogach:

- `~/.openclaw/` — `openclaw.json`, pliki `auth-profiles.json` poszczególnych agentów, stan kanałów/dostawców i dane sesji.
- `~/.openclaw/workspace/` — obszar roboczy agenta (SOUL.md, pamięć, artefakty).

Dane te są zachowywane po ponownym uruchomieniu. Aby utworzyć przenośną migawkę:

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

**Tworzenie instancji kończy się niepowodzeniem („Out of capacity”)** — instancje ARM w warstwie bezpłatnej są popularne. Wybierz inną domenę dostępności lub spróbuj ponownie poza godzinami szczytu.

**Tailscale nie może się połączyć** — uruchom `sudo tailscale up --ssh --hostname=openclaw --reset`, aby ponownie się uwierzytelnić.

**Gateway nie uruchamia się** — uruchom `openclaw doctor --non-interactive` i sprawdź dzienniki za pomocą polecenia `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemy z plikami binarnymi ARM** — większość pakietów npm działa na ARM64. W przypadku natywnych plików binarnych szukaj wydań `linux-arm64` lub `aarch64`. Sprawdź architekturę za pomocą polecenia `uname -m`.

## Następne kroki

- [Kanały](/pl/channels) — połącz Telegram, WhatsApp, Discord i inne usługi
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) — utrzymuj OpenClaw w aktualnej wersji

## Powiązane materiały

- [Przegląd instalacji](/pl/install)
- [GCP](/pl/install/gcp)
- [Hosting VPS](/pl/vps)
