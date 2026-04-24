---
read_when:
    - Konfigurowanie OpenClaw na Oracle Cloud
    - Szukasz darmowego hostingu VPS dla OpenClaw
    - Chcesz mieć OpenClaw 24/7 na małym serwerze
summary: Hostuj OpenClaw na Always Free ARM tier Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T09:18:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

Uruchom trwałą Gateway OpenClaw na **Always Free** ARM tier Oracle Cloud (do 4 OCPU, 24 GB RAM, 200 GB storage) bez żadnych kosztów.

## Wymagania wstępne

- konto Oracle Cloud ([rejestracja](https://www.oracle.com/cloud/free/)) -- zobacz [społecznościowy przewodnik rejestracji](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), jeśli napotkasz problemy
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
       - **OCPUs:** 2 (albo do 4)
       - **Memory:** 12 GB (albo do 24 GB)
       - **Boot volume:** 50 GB (do 200 GB za darmo)
       - **SSH key:** dodaj swój klucz publiczny
    4. Kliknij **Create** i zanotuj publiczny adres IP.

    <Tip>
    Jeśli tworzenie instancji kończy się błędem „Out of capacity”, spróbuj innej domeny dostępności albo ponów próbę później. Pojemność free tier jest ograniczona.
    </Tip>

  </Step>

  <Step title="Połącz się i zaktualizuj system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` jest wymagane do kompilacji niektórych zależności na ARM.

  </Step>

  <Step title="Skonfiguruj użytkownika i hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Włączenie linger sprawia, że usługi użytkownika działają dalej po wylogowaniu.

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

    `gateway.trustedProxies=["127.0.0.1"]` jest tutaj używane wyłącznie do obsługi forwarded-IP/local-client lokalnego proxy Tailscale Serve. To **nie** jest `gateway.auth.mode: "trusted-proxy"`. Trasy przeglądarki diff zachowują w tej konfiguracji zachowanie fail-closed: surowe żądania przeglądarki `127.0.0.1` bez nagłówków proxy z przekazaniem mogą zwracać `Diff not found`. Użyj `mode=file` / `mode=both` dla załączników, albo świadomie włącz zdalne przeglądarki i ustaw `plugins.entries.diffs.config.viewerBaseUrl` (albo przekaż proxy `baseUrl`), jeśli potrzebujesz udostępnialnych linków do przeglądarki.

  </Step>

  <Step title="Zablokuj bezpieczeństwo VCN">
    Zablokuj cały ruch oprócz Tailscale na krawędzi sieci:

    1. Przejdź do **Networking > Virtual Cloud Networks** w OCI Console.
    2. Kliknij swój VCN, a następnie **Security Lists > Default Security List**.
    3. **Usuń** wszystkie reguły wejściowe poza `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Zachowaj domyślne reguły wyjściowe (zezwalają na cały ruch wychodzący).

    To blokuje SSH na porcie 22, HTTP, HTTPS i wszystko inne na krawędzi sieci. Od tego momentu możesz łączyć się tylko przez Tailscale.

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

    Zastąp `<tailnet-name>` nazwą swojego tailnet (widoczną w `tailscale status`).

  </Step>
</Steps>

## Fallback: tunel SSH

Jeśli Tailscale Serve nie działa, użyj tunelu SSH z lokalnej maszyny:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Następnie otwórz `http://localhost:18789`.

## Rozwiązywanie problemów

**Tworzenie instancji kończy się błędem („Out of capacity”)** -- instancje ARM free tier są popularne. Spróbuj innej domeny dostępności albo ponów próbę poza godzinami szczytu.

**Tailscale nie łączy się** -- uruchom `sudo tailscale up --ssh --hostname=openclaw --reset`, aby ponownie się uwierzytelnić.

**Gateway nie uruchamia się** -- uruchom `openclaw doctor --non-interactive` i sprawdź logi przez `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemy z plikami binarnymi ARM** -- większość pakietów npm działa na ARM64. Dla natywnych plików binarnych szukaj wydań `linux-arm64` albo `aarch64`. Zweryfikuj architekturę przez `uname -m`.

## Następne kroki

- [Kanały](/pl/channels) -- połącz Telegram, WhatsApp, Discord i inne
- [Konfiguracja Gateway](/pl/gateway/configuration) -- wszystkie opcje konfiguracji
- [Aktualizowanie](/pl/install/updating) -- utrzymuj OpenClaw w aktualnej wersji

## Powiązane

- [Przegląd instalacji](/pl/install)
- [GCP](/pl/install/gcp)
- [Hosting VPS](/pl/vps)
