---
read_when:
    - Chcesz uruchomić OpenClaw 24/7 na GCP
    - Chcesz mieć produkcyjny, stale działający Gateway na własnej maszynie wirtualnej
    - Chcesz mieć pełną kontrolę nad trwałością, binariami i zachowaniem po restarcie
summary: Uruchamiaj OpenClaw Gateway 24/7 na maszynie wirtualnej GCP Compute Engine (Docker) z trwałym stanem
title: GCP
x-i18n:
    generated_at: "2026-04-05T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73daaee3de71dad5175f42abf3e11355f2603b2f9e2b2523eac4d4c7015e3ebc
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw na GCP Compute Engine (Docker, przewodnik produkcyjny dla VPS)

## Cel

Uruchomić trwały Gateway OpenClaw na maszynie wirtualnej GCP Compute Engine przy użyciu Dockera, z trwałym stanem, wbudowanymi binariami i bezpiecznym zachowaniem po restarcie.

Jeśli chcesz „OpenClaw 24/7 za około 5–12 USD/mies.”, to jest niezawodna konfiguracja na Google Cloud.
Ceny różnią się zależnie od typu maszyny i regionu; wybierz najmniejszą maszynę wirtualną, która pasuje do Twojego obciążenia, i zwiększ ją, jeśli zaczniesz trafiać na OOM-y.

## Co robimy (prostymi słowami)?

- Tworzymy projekt GCP i włączamy płatności
- Tworzymy maszynę wirtualną Compute Engine
- Instalujemy Docker (izolowane środowisko uruchomieniowe aplikacji)
- Uruchamiamy Gateway OpenClaw w Dockerze
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/przebudowy)
- Uzyskujemy dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, plik per agent
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Dostęp do Gateway można uzyskać przez:

- przekierowanie portów SSH z laptopa
- bezpośrednią ekspozycję portu, jeśli samodzielnie zarządzasz firewallem i tokenami

Ten przewodnik używa Debiana na GCP Compute Engine.
Ubuntu też działa; odpowiednio dopasuj pakiety.
Ogólny przepływ Docker opisano w [Docker](/install/docker).

---

## Szybka ścieżka (dla doświadczonych operatorów)

1. Utwórz projekt GCP + włącz Compute Engine API
2. Utwórz maszynę wirtualną Compute Engine (e2-small, Debian 12, 20GB)
3. Połącz się z maszyną przez SSH
4. Zainstaluj Docker
5. Sklonuj repozytorium OpenClaw
6. Utwórz trwałe katalogi hosta
7. Skonfiguruj `.env` i `docker-compose.yml`
8. Wbuduj wymagane binaria, zbuduj i uruchom

---

## Czego potrzebujesz

- Konto GCP (e2-micro kwalifikuje się do darmowego poziomu)
- Zainstalowany CLI gcloud (albo użyj Cloud Console)
- Dostęp SSH z laptopa
- Podstawowa swoboda pracy z SSH + kopiuj/wklej
- ~20–30 minut
- Docker i Docker Compose
- Dane uwierzytelniające modeli
- Opcjonalne dane uwierzytelniające dostawców
  - QR WhatsApp
  - token bota Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Zainstaluj CLI gcloud (albo użyj Console)">
    **Opcja A: CLI gcloud** (zalecane do automatyzacji)

    Zainstaluj z [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Zainicjalizuj i uwierzytelnij:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opcja B: Cloud Console**

    Wszystkie kroki można wykonać przez interfejs webowy pod adresem [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Utwórz projekt GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Włącz płatności na [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (wymagane dla Compute Engine).

    Włącz Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Przejdź do IAM & Admin > Create Project
    2. Nadaj nazwę i utwórz projekt
    3. Włącz płatności dla projektu
    4. Przejdź do APIs & Services > Enable APIs > wyszukaj „Compute Engine API” > Enable

  </Step>

  <Step title="Utwórz maszynę wirtualną">
    **Typy maszyn:**

    | Typ       | Parametry                 | Koszt              | Uwagi                                        |
    | --------- | ------------------------- | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM           | ~25 USD/mies.      | Najbardziej niezawodna do lokalnych buildów Dockera |
    | e2-small  | 2 vCPU, 2GB RAM           | ~12 USD/mies.      | Minimalna zalecana do builda Dockera         |
    | e2-micro  | 2 vCPU (współdzielone), 1GB RAM | kwalifikuje się do darmowego poziomu | Często kończy się OOM podczas builda Dockera (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Przejdź do Compute Engine > VM instances > Create instance
    2. Nazwa: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Typ maszyny: `e2-small`
    5. Dysk startowy: Debian 12, 20GB
    6. Utwórz

  </Step>

  <Step title="Połącz się z maszyną przez SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Kliknij przycisk „SSH” obok swojej maszyny wirtualnej w panelu Compute Engine.

    Uwaga: propagacja klucza SSH może zająć 1–2 minuty po utworzeniu maszyny wirtualnej. Jeśli połączenie jest odrzucane, poczekaj i spróbuj ponownie.

  </Step>

  <Step title="Zainstaluj Docker (na maszynie wirtualnej)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Wyloguj się i zaloguj ponownie, aby zmiana grupy zaczęła działać:

    ```bash
    exit
    ```

    Następnie połącz się ponownie przez SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Zweryfikuj:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Sklonuj repozytorium OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Ten przewodnik zakłada, że zbudujesz niestandardowy obraz, aby zagwarantować trwałość binariów.

  </Step>

  <Step title="Utwórz trwałe katalogi hosta">
    Kontenery Docker są efemeryczne.
    Cały długotrwały stan musi znajdować się na hoście.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz `.env` w katalogu głównym repozytorium.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Wygeneruj silne sekrety:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy do środowiska kontenera/runtime, na przykład `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane uwierzytelnianie dostawców OAuth/klucz API znajduje się w zamontowanym
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Konfiguracja Docker Compose">
    Utwórz lub zaktualizuj `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Zalecane: pozostaw Gateway tylko na loopback na maszynie wirtualnej; uzyskuj dostęp przez tunel SSH.
          # Aby wystawić go publicznie, usuń prefiks `127.0.0.1:` i odpowiednio skonfiguruj firewall.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` służy tylko do wygodnego bootstrapu, nie zastępuje poprawnej konfiguracji gateway. Nadal ustaw uwierzytelnianie (`gateway.auth.token` lub hasło) i używaj bezpiecznych ustawień bind dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska Docker VM">
    Dla wspólnego przepływu hosta Docker użyj przewodnika środowiska współdzielonego:

    - [Wbuduj wymagane binaria do obrazu](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Budowanie i uruchamianie](/install/docker-vm-runtime#build-and-launch)
    - [Co i gdzie jest zachowywane](/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Uwagi uruchomieniowe specyficzne dla GCP">
    Na GCP, jeśli build zakończy się błędem `Killed` lub `exit code 137` podczas `pnpm install --frozen-lockfile`, maszyna wirtualna ma za mało pamięci. Użyj co najmniej `e2-small`, albo `e2-medium` dla bardziej niezawodnych pierwszych buildów.

    Przy bindowaniu do LAN (`OPENCLAW_GATEWAY_BIND=lan`) skonfiguruj zaufane pochodzenie przeglądarki, zanim przejdziesz dalej:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Jeśli zmieniłeś port gateway, zastąp `18789` skonfigurowanym portem.

  </Step>

  <Step title="Dostęp z laptopa">
    Utwórz tunel SSH do przekierowania portu Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Otwórz w przeglądarce:

    `http://127.0.0.1:18789/`

    Ponownie wypisz czysty link do dashboardu:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jeśli UI prosi o uwierzytelnianie współdzielonym sekretem, wklej skonfigurowany token lub
    hasło do ustawień Control UI. Ten przepływ Docker domyślnie zapisuje token;
    jeśli zmienisz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

    Jeśli Control UI pokazuje `unauthorized` lub `disconnected (1008): pairing required`, zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Potrzebujesz ponownie dokumentacji trwałości i aktualizacji?
    Zobacz [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) i [aktualizacje Docker VM Runtime](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Rozwiązywanie problemów

**Połączenie SSH odrzucone**

Propagacja klucza SSH może zająć 1–2 minuty po utworzeniu maszyny wirtualnej. Poczekaj i spróbuj ponownie.

**Problemy z OS Login**

Sprawdź swój profil OS Login:

```bash
gcloud compute os-login describe-profile
```

Upewnij się, że Twoje konto ma wymagane uprawnienia IAM (Compute OS Login lub Compute OS Admin Login).

**Brak pamięci (OOM)**

Jeśli build Dockera kończy się błędem `Killed` i `exit code 137`, maszyna wirtualna została ubita przez OOM. Zwiększ do e2-small (minimum) albo e2-medium (zalecane do niezawodnych lokalnych buildów):

```bash
# Najpierw zatrzymaj maszynę wirtualną
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Zmień typ maszyny
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Uruchom maszynę wirtualną
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Konta usługi (najlepsza praktyka bezpieczeństwa)

Do użytku osobistego Twoje domyślne konto użytkownika w pełni wystarcza.

Dla automatyzacji lub pipeline'ów CI/CD utwórz dedykowane konto usługi z minimalnymi uprawnieniami:

1. Utwórz konto usługi:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Przyznaj rolę Compute Instance Admin (lub węższą rolę niestandardową):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Unikaj używania roli Owner do automatyzacji. Stosuj zasadę najmniejszych uprawnień.

Szczegóły ról IAM znajdziesz pod adresem [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Kolejne kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Sparuj lokalne urządzenia jako węzły: [Nodes](/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/gateway/configuration)
