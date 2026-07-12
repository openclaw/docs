---
read_when:
    - Chcesz, aby OpenClaw działał całodobowo w GCP
    - Potrzebujesz gotowego do pracy produkcyjnej, działającego bez przerwy Gateway na własnej maszynie wirtualnej
    - Chcesz mieć pełną kontrolę nad trwałością danych, plikami binarnymi i zachowaniem podczas ponownego uruchamiania
summary: Uruchamiaj OpenClaw Gateway 24/7 na maszynie wirtualnej GCP Compute Engine (Docker) z trwałym stanem
title: GCP
x-i18n:
    generated_at: "2026-07-12T15:14:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Uruchom trwały Gateway OpenClaw na maszynie wirtualnej GCP Compute Engine przy użyciu Dockera, z trwałym stanem, wbudowanymi plikami binarnymi i bezpiecznym zachowaniem podczas ponownego uruchamiania.

Ceny różnią się zależnie od typu maszyny i regionu; wybierz najmniejszą maszynę wirtualną odpowiednią do obciążenia i zwiększ jej rozmiar, jeśli wystąpią błędy braku pamięci.

Dostęp do Gateway można uzyskać z laptopa przez przekierowanie portów SSH albo przez bezpośrednie udostępnienie portu, jeśli samodzielnie zarządzasz zaporą sieciową i tokenami.

W tym przewodniku używany jest Debian na GCP Compute Engine. Ubuntu również działa; odpowiednio dostosuj pakiety. Ogólny proces korzystania z Dockera opisano w sekcji [Docker](/pl/install/docker).

## Czego potrzebujesz

- Konto GCP (`e2-micro` kwalifikuje się do bezpłatnej warstwy)
- CLI `gcloud` albo [Cloud Console](https://console.cloud.google.com)
- Dostęp SSH z laptopa
- Docker i Docker Compose
- Dane uwierzytelniające do modelu
- Opcjonalne dane uwierzytelniające dostawców (kod QR WhatsApp, token bota Telegram, OAuth Gmail)
- Około 20–30 minut

## Szybka ścieżka

1. Utwórz projekt GCP, włącz rozliczenia i interfejs API Compute Engine
2. Utwórz maszynę wirtualną Compute Engine (`e2-small`, Debian 12, 20 GB)
3. Połącz się z maszyną wirtualną przez SSH i zainstaluj Dockera
4. Sklonuj repozytorium OpenClaw
5. Utwórz trwałe katalogi na hoście
6. Skonfiguruj `.env` i `docker-compose.yml`
7. Wbuduj wymagane pliki binarne, zbuduj obraz i uruchom usługę

<Steps>
  <Step title="Zainstaluj CLI gcloud (lub użyj konsoli)">
    Zainstaluj je zgodnie z instrukcjami na stronie [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), a następnie uruchom:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Zamiast tego możesz wykonać wszystkie poniższe kroki w interfejsie internetowym [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Utwórz projekt GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Włącz rozliczenia na stronie [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (jest to wymagane przez Compute Engine).

    Odpowiednik w konsoli: IAM & Admin > Create Project, włącz rozliczenia, a następnie APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Utwórz maszynę wirtualną">
    | Typ       | Parametry                 | Koszt                         | Uwagi                                                        |
    | --------- | ------------------------- | ----------------------------- | ------------------------------------------------------------ |
    | e2-medium | 2 vCPU, 4 GB RAM          | Około 25 USD/mies.            | Najbardziej niezawodna opcja do lokalnego budowania Dockera   |
    | e2-small  | 2 vCPU, 2 GB RAM          | Około 12 USD/mies.            | Zalecane minimum do budowania obrazu Dockera                  |
    | e2-micro  | 2 vCPU (współdzielone), 1 GB RAM | Kwalifikuje się do bezpłatnej warstwy | Budowanie obrazu Dockera często kończy się brakiem pamięci (kod wyjścia 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Połącz się z maszyną wirtualną przez SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Konsola: kliknij "SSH" obok maszyny wirtualnej w panelu Compute Engine.

    Propagacja klucza SSH po utworzeniu maszyny wirtualnej może potrwać 1–2 minuty; jeśli połączenie zostanie odrzucone, odczekaj chwilę i spróbuj ponownie.

  </Step>

  <Step title="Zainstaluj Dockera (na maszynie wirtualnej)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Wyloguj się i zaloguj ponownie, aby zmiana grupy zaczęła obowiązywać, a następnie ponownie połącz się przez SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Sprawdź instalację:

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

    Ten przewodnik opisuje budowanie niestandardowego obrazu, dzięki czemu wbudowane pliki binarne przetrwają ponowne uruchomienia.

  </Step>

  <Step title="Utwórz trwałe katalogi na hoście">
    Kontenery Dockera są nietrwałe; cały stan długoterminowy musi znajdować się na hoście.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz plik `.env` w katalogu głównym repozytorium:

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

    Ustaw `OPENCLAW_GATEWAY_TOKEN`, aby zarządzać stałym tokenem Gateway za pomocą
    pliku `.env`; w przeciwnym razie skonfiguruj `gateway.auth.token`, zanim zaczniesz
    polegać na klientach działających po ponownych uruchomieniach. Jeśli żadna z tych
    wartości nie jest ustawiona, OpenClaw używa tokenu dostępnego tylko w czasie
    działania tego uruchomienia. Wygeneruj hasło magazynu kluczy dla `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie zatwierdzaj tego pliku w repozytorium.** Zawiera on zmienne środowiskowe
    kontenera i środowiska uruchomieniowego, takie jak `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane dane uwierzytelniające OAuth lub klucza API dostawcy znajdują się
    w zamontowanym pliku `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Konfiguracja Docker Compose">
    Utwórz lub zaktualizuj plik `docker-compose.yml`:

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
          # Zalecane: pozostaw Gateway dostępny tylko przez interfejs sprzężenia zwrotnego na maszynie wirtualnej; uzyskuj dostęp przez tunel SSH.
          # Aby udostępnić go publicznie, usuń prefiks `127.0.0.1:` i odpowiednio skonfiguruj zaporę sieciową.
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

    `--allow-unconfigured` służy wyłącznie do ułatwienia początkowego uruchomienia i nie zastępuje prawidłowej konfiguracji Gateway. Nadal ustaw uwierzytelnianie (`gateway.auth.token` lub hasło) oraz bezpieczny tryb powiązania odpowiedni dla wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska uruchomieniowego maszyny wirtualnej z Dockerem">
    Postępuj zgodnie ze wspólnym przewodnikiem środowiska uruchomieniowego dla typowej konfiguracji hosta Dockera:

    - [Wbuduj wymagane pliki binarne w obraz](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co i gdzie jest przechowywane trwale](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Uwagi dotyczące uruchamiania w GCP">
    Jeśli podczas wykonywania `pnpm install --frozen-lockfile` budowanie zakończy się komunikatem `Killed` lub `exit code 137`, maszynie wirtualnej zabrakło pamięci. Użyj co najmniej `e2-small` albo `e2-medium`, aby pierwsze budowanie było bardziej niezawodne.

    W przypadku powiązania z siecią LAN (`OPENCLAW_GATEWAY_BIND=lan`) przed kontynuowaniem skonfiguruj zaufane źródło przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Jeśli port został zmieniony, zastąp `18789` skonfigurowanym numerem portu.

  </Step>

  <Step title="Uzyskaj dostęp z laptopa">
    Utwórz tunel SSH przekierowujący port Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Otwórz `http://127.0.0.1:18789/` w przeglądarce.

    Ponownie wyświetl czysty odnośnik do panelu:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jeśli interfejs poprosi o uwierzytelnienie za pomocą współdzielonego sekretu,
    wklej skonfigurowany token lub hasło w ustawieniach interfejsu Control UI
    (ten proces Dockera domyślnie zapisuje token; jeśli przełączono się na
    uwierzytelnianie hasłem, użyj skonfigurowanego hasła).

    Jeśli Control UI wyświetla `unauthorized` lub `disconnected (1008): pairing required`, zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    W sekcji [Środowisko uruchomieniowe maszyny wirtualnej z Dockerem](/pl/install/docker-vm-runtime#what-persists-where) znajdziesz wspólną mapę trwałości, a w sekcji [proces aktualizacji](/pl/install/docker-vm-runtime#updates) — instrukcje aktualizacji.

  </Step>
</Steps>

## Rozwiązywanie problemów

**Połączenie SSH odrzucone**

Propagacja klucza SSH po utworzeniu maszyny wirtualnej może potrwać 1–2 minuty. Odczekaj chwilę i spróbuj ponownie.

**Problemy z OS Login**

Sprawdź swój profil OS Login:

```bash
gcloud compute os-login describe-profile
```

Upewnij się, że konto ma wymagane uprawnienia IAM (Compute OS Login lub Compute OS Admin Login).

**Brak pamięci**

Jeśli budowanie obrazu Dockera zakończy się komunikatem `Killed` i kodem `exit code 137`, proces maszyny wirtualnej został zakończony z powodu braku pamięci:

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

## Konta usług (zalecane zabezpieczenie)

Do użytku osobistego wystarczy domyślne konto użytkownika. Na potrzeby automatyzacji lub CI/CD utwórz dedykowane konto usługi z minimalnym zakresem uprawnień:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Nie używaj roli Owner do automatyzacji; wybierz rolę o najwęższym zakresie, który wystarcza do działania. Zobacz [Opis ról](https://cloud.google.com/iam/docs/understanding-roles).

## Następne kroki

- Skonfiguruj kanały komunikacji: [Kanały](/pl/channels)
- Sparuj urządzenia lokalne jako węzły: [Węzły](/pl/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Azure](/pl/install/azure)
- [Hosting VPS](/pl/vps)
