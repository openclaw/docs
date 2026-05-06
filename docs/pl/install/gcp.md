---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na GCP
    - Chcesz mieć Gateway klasy produkcyjnej, działający non stop na własnej maszynie wirtualnej
    - Chcesz mieć pełną kontrolę nad trwałością danych, plikami binarnymi i zachowaniem przy ponownym uruchomieniu
summary: Uruchom OpenClaw Gateway 24/7 na maszynie wirtualnej GCP Compute Engine (Docker) z trwałym stanem
title: GCP
x-i18n:
    generated_at: "2026-05-06T17:57:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 678253bd90f0694668400ffddba957e442f8aaed3f5308af3c2481940e104733
    source_path: install/gcp.md
    workflow: 16
---

Uruchom trwały OpenClaw Gateway na maszynie wirtualnej GCP Compute Engine przy użyciu Docker, z trwałym stanem, wbudowanymi plikami binarnymi i bezpiecznym zachowaniem przy ponownym uruchamianiu.

Jeśli chcesz „OpenClaw 24/7 za około 5-12 USD/mies.”, to jest niezawodna konfiguracja w Google Cloud.
Ceny różnią się zależnie od typu maszyny i regionu; wybierz najmniejszą maszynę wirtualną pasującą do obciążenia i zwiększ skalę, jeśli pojawią się błędy OOM.

## Co robimy (prosto)?

- Utworzenie projektu GCP i włączenie rozliczeń
- Utworzenie maszyny wirtualnej Compute Engine
- Instalacja Docker (izolowane środowisko uruchomieniowe aplikacji)
- Uruchomienie OpenClaw Gateway w Docker
- Utrwalenie `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa ponowne uruchomienia/przebudowy)
- Dostęp do Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, właściwy dla każdego agenta
`agents/<agentId>/agent/auth-profiles.json` oraz `.env`.

Dostęp do Gateway można uzyskać przez:

- Przekierowanie portu SSH z laptopa
- Bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz zaporą i tokenami

Ten przewodnik używa Debian w GCP Compute Engine.
Ubuntu również działa; odpowiednio dopasuj pakiety.
Ogólny przepływ Docker znajdziesz w [Docker](/pl/install/docker).

---

## Szybka ścieżka (doświadczeni operatorzy)

1. Utwórz projekt GCP i włącz Compute Engine API
2. Utwórz maszynę wirtualną Compute Engine (`e2-small`, Debian 12, 20 GB)
3. Połącz się z maszyną wirtualną przez SSH
4. Zainstaluj Docker
5. Sklonuj repozytorium OpenClaw
6. Utwórz trwałe katalogi hosta
7. Skonfiguruj `.env` i `docker-compose.yml`
8. Wbuduj wymagane pliki binarne, zbuduj i uruchom

---

## Czego potrzebujesz

- Konto GCP (kwalifikujące się do bezpłatnego poziomu `e2-micro`)
- Zainstalowany gcloud CLI (albo użycie Cloud Console)
- Dostęp SSH z laptopa
- Podstawowa swoboda pracy z SSH i kopiowaniem/wklejaniem
- Około 20-30 minut
- Docker i Docker Compose
- Dane uwierzytelniające modelu
- Opcjonalne dane uwierzytelniające dostawców
  - Kod QR WhatsApp
  - Token bota Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Zainstaluj gcloud CLI (albo użyj Console)">
    **Opcja A: gcloud CLI** (zalecane do automatyzacji)

    Zainstaluj z [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Zainicjuj i uwierzytelnij:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opcja B: Cloud Console**

    Wszystkie kroki można wykonać w interfejsie webowym pod adresem [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Utwórz projekt GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Włącz rozliczenia na [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (wymagane dla Compute Engine).

    Włącz Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Przejdź do IAM & Admin > Create Project
    2. Nadaj nazwę i utwórz
    3. Włącz rozliczenia dla projektu
    4. Przejdź do APIs & Services > Enable APIs > wyszukaj „Compute Engine API” > Enable

  </Step>

  <Step title="Utwórz maszynę wirtualną">
    **Typy maszyn:**

    | Typ       | Specyfikacja              | Koszt              | Uwagi                                        |
    | --------- | ------------------------- | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4 GB RAM          | około 25 USD/mies. | Najbardziej niezawodne dla lokalnych buildów Docker |
    | e2-small  | 2 vCPU, 2 GB RAM          | około 12 USD/mies. | Zalecane minimum do buildu Docker            |
    | e2-micro  | 2 vCPU (współdzielone), 1 GB RAM | Kwalifikuje się do bezpłatnego poziomu | Często kończy się niepowodzeniem przy buildzie Docker z OOM (`exit 137`) |

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
    3. Region: `us-central1`, strefa: `us-central1-a`
    4. Typ maszyny: `e2-small`
    5. Dysk rozruchowy: Debian 12, 20 GB
    6. Utwórz

  </Step>

  <Step title="Połącz się z maszyną wirtualną przez SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Kliknij przycisk „SSH” obok swojej maszyny wirtualnej w panelu Compute Engine.

    Uwaga: propagacja klucza SSH może potrwać 1-2 minuty po utworzeniu maszyny wirtualnej. Jeśli połączenie zostanie odrzucone, poczekaj i spróbuj ponownie.

  </Step>

  <Step title="Zainstaluj Docker (na maszynie wirtualnej)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Wyloguj się i zaloguj ponownie, aby zmiana grupy zaczęła obowiązywać:

    ```bash
    exit
    ```

    Następnie ponownie połącz się przez SSH:

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

    Ten przewodnik zakłada, że zbudujesz niestandardowy obraz, aby zagwarantować trwałość plików binarnych.

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
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Ustaw `OPENCLAW_GATEWAY_TOKEN`, gdy chcesz zarządzać stabilnym tokenem Gateway
    przez `.env`; w przeciwnym razie skonfiguruj `gateway.auth.token` przed
    poleganiem na klientach między ponownymi uruchomieniami. Jeśli żadne ze źródeł nie istnieje, OpenClaw używa
    tokenu tylko na czas działania dla tego uruchomienia. Wygeneruj hasło keyring i wklej
    je do `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy do zmiennych środowiskowych kontenera/środowiska uruchomieniowego, takich jak `OPENCLAW_GATEWAY_TOKEN`.
    Przechowywane uwierzytelnianie OAuth/kluczem API dostawcy znajduje się w zamontowanym
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
          # Zalecane: pozostaw Gateway dostępny tylko przez loopback na maszynie wirtualnej; uzyskuj dostęp przez tunel SSH.
          # Aby wystawić go publicznie, usuń prefiks `127.0.0.1:` i odpowiednio skonfiguruj zaporę.
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

    `--allow-unconfigured` służy tylko wygodzie podczas bootstrapu; nie zastępuje właściwej konfiguracji Gateway. Nadal ustaw uwierzytelnianie (`gateway.auth.token` albo hasło) i używaj bezpiecznych ustawień bindowania dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska uruchomieniowego maszyny wirtualnej Docker">
    Użyj wspólnego przewodnika środowiska uruchomieniowego dla typowego przepływu hosta Docker:

    - [Wbuduj wymagane pliki binarne do obrazu](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co gdzie jest utrwalane](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Uwagi uruchomieniowe specyficzne dla GCP">
    W GCP, jeśli build kończy się niepowodzeniem z `Killed` albo `exit code 137` podczas `pnpm install --frozen-lockfile`, maszynie wirtualnej zabrakło pamięci. Użyj co najmniej `e2-small` albo `e2-medium` dla bardziej niezawodnych pierwszych buildów.

    Przy bindowaniu do sieci LAN (`OPENCLAW_GATEWAY_BIND=lan`) skonfiguruj zaufane źródło przeglądarki przed kontynuowaniem:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Jeśli zmieniono port Gateway, zastąp `18789` skonfigurowanym portem.

  </Step>

  <Step title="Dostęp z laptopa">
    Utwórz tunel SSH, aby przekierować port Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Otwórz w przeglądarce:

    `http://127.0.0.1:18789/`

    Ponownie wyświetl czysty link do panelu:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jeśli UI poprosi o uwierzytelnianie wspólnym sekretem, wklej skonfigurowany token albo
    hasło w ustawieniach Control UI. Ten przepływ Docker domyślnie zapisuje token;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

    Jeśli Control UI pokazuje `unauthorized` albo `disconnected (1008): pairing required`, zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Potrzebujesz ponownie odniesienia do wspólnej trwałości i aktualizacji?
    Zobacz [Docker VM Runtime](/pl/install/docker-vm-runtime#what-persists-where) oraz [aktualizacje Docker VM Runtime](/pl/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Rozwiązywanie problemów

**Połączenie SSH odrzucone**

Propagacja klucza SSH może potrwać 1-2 minuty po utworzeniu maszyny wirtualnej. Poczekaj i spróbuj ponownie.

**Problemy z OS Login**

Sprawdź swój profil OS Login:

```bash
gcloud compute os-login describe-profile
```

Upewnij się, że Twoje konto ma wymagane uprawnienia IAM (Compute OS Login albo Compute OS Admin Login).

**Brak pamięci (OOM)**

Jeśli build Docker kończy się niepowodzeniem z `Killed` i `exit code 137`, maszyna wirtualna została zabita przez OOM. Przejdź na `e2-small` (minimum) albo `e2-medium` (zalecane dla niezawodnych lokalnych buildów):

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

Do użytku osobistego domyślne konto użytkownika działa poprawnie.

Dla automatyzacji albo potoków CI/CD utwórz dedykowane konto usługi z minimalnymi uprawnieniami:

1. Utwórz konto usługi:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Przyznaj rolę Compute Instance Admin (albo węższą rolę niestandardową):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Unikaj używania roli Owner do automatyzacji. Stosuj zasadę najmniejszych uprawnień.

Szczegóły ról IAM znajdziesz na [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Następne kroki

- Skonfiguruj kanały komunikacji: [Kanały](/pl/channels)
- Sparuj urządzenia lokalne jako węzły: [Węzły](/pl/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Azure](/pl/install/azure)
- [Hosting VPS](/pl/vps)
