---
read_when:
    - Konfigurujesz OpenClaw na Oracle Cloud
    - Szukasz darmowego hostingu VPS dla OpenClaw
    - Chcesz mieć OpenClaw 24/7 na małym serwerze
summary: Hostowanie OpenClaw na warstwie Always Free ARM Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T13:58:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Uruchom trwałą Gateway OpenClaw na warstwie **Always Free** ARM Oracle Cloud (do 4 OCPU, 24 GB RAM, 200 GB storage) bez kosztów.

## Wymagania wstępne

- konto Oracle Cloud ([rejestracja](https://www.oracle.com/cloud/free/)) -- jeśli napotkasz problemy, zobacz [przewodnik rejestracji od społeczności](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- konto Tailscale (bezpłatne na [tailscale.com](https://tailscale.com))
- para kluczy SSH
- około 30 minut

## Konfiguracja

<Steps>
  <Step title="Utwórz instancję OCI">
    1. Zaloguj się do [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Przejdź do **Compute > Instances > Create Instance**.
    3. Skonfiguruj:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (lub do 4)
       - **Memory:** 12 GB (lub do 24 GB)
       - **Boot volume:** 50 GB (do 200 GB za darmo)
       - **SSH key:** dodaj swój klucz publiczny
    4. Kliknij **Create** i zanotuj publiczny adres IP.

    <Tip>
    Jeśli tworzenie instancji kończy się błędem „Out of capacity”, spróbuj innej domeny dostępności albo ponów próbę później. Pojemność warstwy bezpłatnej jest ograniczona.
    </Tip>

  </Step>

  <Step title="Połącz się i zaktualizuj system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` jest wymagane do kompilacji ARM niektórych zależności.

  </Step>

  <Step title="Skonfiguruj użytkownika i nazwę hosta">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Włączenie linger pozwala usługom użytkownika działać po wylogowaniu.

  </Step>

  <Step title="Zainstaluj Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Od tej pory łącz się przez Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Zainstaluj OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Gdy pojawi się pytanie „How do you want to hatch your bot?”, wybierz **Do this later**.

  </Step>

  <Step title="Skonfiguruj gateway">
    Użyj uwierzytelniania tokenem z Tailscale Serve, aby zapewnić bezpieczny zdalny dostęp.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` w tym miejscu służy wyłącznie do obsługi przekazanego IP/klienta lokalnego przez lokalny proxy Tailscale Serve. To **nie** jest `gateway.auth.mode: "trusted-proxy"`. Trasy przeglądu diffów zachowują w tej konfiguracji tryb fail-closed: surowe żądania przeglądarki `127.0.0.1` bez nagłówków forwarded proxy mogą zwracać `Diff not found`. Dla załączników użyj `mode=file` / `mode=both`, albo celowo włącz zdalne przeglądarki i ustaw `plugins.entries.diffs.config.viewerBaseUrl` (lub przekaż proxy `baseUrl`), jeśli potrzebujesz linków przeglądarki do udostępniania.

  </Step>

  <Step title="Zabezpiecz VCN">
    Zablokuj cały ruch poza Tailscale na brzegu sieci:

    1. W OCI Console przejdź do **Networking > Virtual Cloud Networks**.
    2. Kliknij swoją VCN, następnie **Security Lists > Default Security List**.
    3. **Usuń** wszystkie reguły ingress poza `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Zachowaj domyślne reguły egress (zezwól na cały ruch wychodzący).

    To blokuje SSH na porcie 22, HTTP, HTTPS i wszystko inne na brzegu sieci. Od tego momentu możesz łączyć się tylko przez Tailscale.

  </Step>

  <Step title="Zweryfikuj">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Uzyskaj dostęp do Control UI z dowolnego urządzenia w swoim tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Zamień `<tailnet-name>` na nazwę swojego tailnet (widoczną w `tailscale status`).

  </Step>
</Steps>

## Fallback: tunel SSH

Jeśli Tailscale Serve nie działa, użyj tunelu SSH ze swojej lokalnej maszyny:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Następnie otwórz `http://localhost:18789`.

## Rozwiązywanie problemów

**Tworzenie instancji kończy się błędem („Out of capacity”)** -- instancje ARM warstwy bezpłatnej są popularne. Spróbuj innej domeny dostępności albo ponów próbę poza godzinami szczytu.

**Tailscale nie chce się połączyć** -- uruchom `sudo tailscale up --ssh --hostname=openclaw --reset`, aby ponownie przeprowadzić uwierzytelnienie.

**Gateway nie uruchamia się** -- uruchom `openclaw doctor --non-interactive` i sprawdź logi poleceniem `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemy z binarkami ARM** -- większość pakietów npm działa na ARM64. Dla natywnych binarek szukaj wydań `linux-arm64` lub `aarch64`. Zweryfikuj architekturę poleceniem `uname -m`.

## Następne kroki

- [Channels](/pl/channels) -- podłącz Telegram, WhatsApp, Discord i inne
- [Gateway configuration](/gateway/configuration) -- wszystkie opcje konfiguracji
- [Updating](/install/updating) -- utrzymuj OpenClaw na bieżąco
