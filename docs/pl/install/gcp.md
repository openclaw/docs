---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na GCP
    - Chcesz mieć produkcyjną, zawsze aktywną Gateway na własnej maszynie wirtualnej
    - Chcesz mieć pełną kontrolę nad trwałością, plikami binarnymi i zachowaniem przy restartach
summary: Uruchamiaj Gateway OpenClaw 24/7 na maszynie wirtualnej GCP Compute Engine (Docker) z trwałym stanem
title: GCP
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T09:16:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw na GCP Compute Engine (Docker, produkcyjny przewodnik po VPS)

## Cel

Uruchom trwałą Gateway OpenClaw na maszynie wirtualnej GCP Compute Engine przy użyciu Docker, z trwałym stanem, wgranymi plikami binarnymi i bezpiecznym zachowaniem przy restartach.

Jeśli chcesz „OpenClaw 24/7 za ~$5-12/mies.”, to jest niezawodna konfiguracja na Google Cloud.
Ceny różnią się zależnie od typu maszyny i regionu; wybierz najmniejszą maszynę, która pasuje do twojego obciążenia, i zwiększ ją, jeśli trafisz na OOM.

## Co robimy (prosto)?

- Tworzymy projekt GCP i włączamy billing
- Tworzymy VM w Compute Engine
- Instalujemy Docker (izolowane środowisko uruchomieniowe aplikacji)
- Uruchamiamy Gateway OpenClaw w Docker
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/przebudowy)
- Uzyskujemy dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Dostęp do Gateway można uzyskać przez:

- przekierowanie portu SSH z laptopa
- bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz firewallem i tokenami

Ten przewodnik używa Debiana na GCP Compute Engine.
Ubuntu również działa; odpowiednio dopasuj pakiety.
Dla ogólnego przepływu Docker zobacz [Docker](/pl/install/docker).

---

## Szybka ścieżka (dla doświadczonych operatorów)

1. Utwórz projekt GCP + włącz Compute Engine API
2. Utwórz VM w Compute Engine (e2-small, Debian 12, 20GB)
3. Połącz się z VM przez SSH
4. Zainstaluj Docker
5. Sklonuj repozytorium OpenClaw
6. Utwórz trwałe katalogi hosta
7. Skonfiguruj `.env` i `docker-compose.yml`
8. Wgraj wymagane pliki binarne, zbuduj i uruchom

---

## Czego potrzebujesz

- konto GCP (e2-micro kwalifikuje się do free tier)
- zainstalowane gcloud CLI (albo użyj Cloud Console)
- dostęp SSH z laptopa
- podstawowa swoboda w używaniu SSH + kopiowania/wklejania
- ~20-30 minut
- Docker i Docker Compose
- poświadczenia uwierzytelniania modeli
- opcjonalne poświadczenia providerów
  - QR WhatsApp
  - token bota Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Zainstaluj gcloud CLI (albo użyj Console)">
    **Opcja A: gcloud CLI** (zalecane do automatyzacji)

    Zainstaluj z [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Zainicjalizuj i uwierzytelnij:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opcja B: Cloud Console**

    Wszystkie kroki można wykonać przez interfejs webowy pod [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Utwórz projekt GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Włącz billing na [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (wymagane dla Compute Engine).

    Włącz Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Przejdź do IAM & Admin > Create Project
    2. Nadaj nazwę i utwórz projekt
    3. Włącz billing dla projektu
    4. Przejdź do APIs & Services > Enable APIs > wyszukaj „Compute Engine API” > Enable

  </Step>

  <Step title="Utwórz VM">
    **Typy maszyn:**

    | Typ       | Parametry                | Koszt              | Uwagi                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/mies.         | Najbardziej niezawodny do lokalnych buildów Docker |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/mies.         | Minimalnie zalecany do buildów Docker        |
    | e2-micro  | 2 vCPU (współdzielone), 1GB RAM | kwalifikuje się do free tier | Często kończy się OOM przy buildzie Docker (exit 137) |

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
    5. Dysk rozruchowy: Debian 12, 20GB
    6. Utwórz

  </Step>

  <Step title="Połącz się z VM przez SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Kliknij przycisk „SSH” obok swojej VM w panelu Compute Engine.

    Uwaga: propagacja kluczy SSH może potrwać 1-2 minuty po utworzeniu VM. Jeśli połączenie jest odrzucane, poczekaj i spróbuj ponownie.

  </Step>

  <Step title="Zainstaluj Docker (na VM)">
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

    Ten przewodnik zakłada, że zbudujesz własny obraz, aby zagwarantować trwałość plików binarnych.

  </Step>

  <Step title="Utwórz trwałe katalogi hosta">
    Kontenery Docker są efemeryczne.
    Cały długowieczny stan musi znajdować się na hoście.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz `.env` w katalogu głównym repozytorium.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Pozostaw `OPENCLAW_GATEWAY_TOKEN` puste, chyba że jawnie chcesz
    zarządzać nim przez `.env`; OpenClaw zapisuje losowy token Gateway do
    konfiguracji przy pierwszym uruchomieniu. Wygeneruj hasło keyringu i wklej je do
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy do env kontenera/runtime, takich jak `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane uwierzytelnianie providera OAuth/kluczem API znajduje się w zamontowanym
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
          # Zalecane: utrzymuj Gateway dostępną tylko przez loopback na VM; korzystaj z tunelu SSH.
          # Aby wystawić ją publicznie, usuń prefiks `127.0.0.1:` i odpowiednio skonfiguruj firewall.
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

    `--allow-unconfigured` służy tylko do wygodnego bootstrap; nie zastępuje poprawnej konfiguracji gateway. Nadal ustaw uwierzytelnianie (`gateway.auth.token` albo hasło) i używaj bezpiecznych ustawień bind odpowiednich dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska uruchomieniowego Docker VM">
    Użyj współdzielonego przewodnika runtime dla wspólnego przepływu hosta Docker:

    - [Wgraj wymagane pliki binarne do obrazu](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Budowanie i uruchamianie](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co i gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Uwagi dotyczące uruchomienia specyficzne dla GCP">
    Na GCP, jeśli build kończy się błędem `Killed` albo `exit code 137` podczas `pnpm install --frozen-lockfile`, VM ma za mało pamięci. Użyj co najmniej `e2-small`, albo `e2-medium` dla bardziej niezawodnych pierwszych buildów.

    Przy bindowaniu do LAN (`OPENCLAW_GATEWAY_BIND=lan`) skonfiguruj zaufany origin przeglądarki, zanim przejdziesz dalej:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Jeśli zmieniłeś port gateway, zastąp `18789` swoim skonfigurowanym portem.

  </Step>

  <Step title="Dostęp z laptopa">
    Utwórz tunel SSH, aby przekierować port Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Otwórz w przeglądarce:

    `http://127.0.0.1:18789/`

    Wypisz ponownie czysty link Dashboard:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jeśli interfejs prosi o uwierzytelnienie współdzielonym sekretem, wklej skonfigurowany token albo
    hasło w ustawieniach Control UI. Ten przepływ Docker domyślnie zapisuje token;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

    Jeśli Control UI pokazuje `unauthorized` albo `disconnected (1008): pairing required`, zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Potrzebujesz ponownie dokumentacji współdzielonej trwałości i aktualizacji?
    Zobacz [Środowisko uruchomieniowe Docker VM](/pl/install/docker-vm-runtime#what-persists-where) i [aktualizacje środowiska uruchomieniowego Docker VM](/pl/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Rozwiązywanie problemów

**Połączenie SSH odrzucone**

Propagacja kluczy SSH może potrwać 1-2 minuty po utworzeniu VM. Poczekaj i spróbuj ponownie.

**Problemy z OS Login**

Sprawdź swój profil OS Login:

```bash
gcloud compute os-login describe-profile
```

Upewnij się, że twoje konto ma wymagane uprawnienia IAM (Compute OS Login albo Compute OS Admin Login).

**Brak pamięci (OOM)**

Jeśli build Docker kończy się błędem `Killed` i `exit code 137`, VM została zabita przez OOM. Przejdź na e2-small (minimum) albo e2-medium (zalecane do niezawodnych lokalnych buildów):

```bash
# Najpierw zatrzymaj VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Zmień typ maszyny
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Uruchom VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Konta serwisowe (najlepsza praktyka bezpieczeństwa)

Do użytku osobistego twoje domyślne konto użytkownika w zupełności wystarcza.

Dla automatyzacji albo potoków CI/CD utwórz dedykowane konto serwisowe z minimalnymi uprawnieniami:

1. Utwórz konto serwisowe:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Nadaj rolę Compute Instance Admin (albo węższą rolę niestandardową):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Unikaj używania roli Owner do automatyzacji. Stosuj zasadę najmniejszych uprawnień.

Zobacz [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles), aby poznać szczegóły ról IAM.

---

## Następne kroki

- Skonfiguruj kanały wiadomości: [Kanały](/pl/channels)
- Sparuj lokalne urządzenia jako Node: [Node](/pl/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Azure](/pl/install/azure)
- [Hosting VPS](/pl/vps)
