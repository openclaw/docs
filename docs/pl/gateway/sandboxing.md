---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Jak działa izolacja w piaskownicy OpenClaw: tryby, zakresy, dostęp do obszaru roboczego i obrazy'
title: Izolacja w piaskownicy
x-i18n:
    generated_at: "2026-05-03T21:33:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw może uruchamiać **narzędzia wewnątrz backendów piaskownicy**, aby zmniejszyć zasięg potencjalnych szkód. Jest to **opcjonalne** i kontrolowane przez konfigurację (`agents.defaults.sandbox` lub `agents.list[].sandbox`). Jeśli piaskownica jest wyłączona, narzędzia działają na hoście. Gateway pozostaje na hoście; po włączeniu wykonywanie narzędzi odbywa się w izolowanej piaskownicy.

<Note>
Nie jest to doskonała granica bezpieczeństwa, ale istotnie ogranicza dostęp do systemu plików i procesów, gdy model zrobi coś nierozsądnego.
</Note>

## Co trafia do piaskownicy

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka w piaskownicy (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Szczegóły przeglądarki w piaskownicy">
    - Domyślnie przeglądarka w piaskownicy uruchamia się automatycznie (zapewnia dostępność CDP), gdy narzędzie przeglądarki jej potrzebuje. Skonfiguruj przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Domyślnie kontenery przeglądarki w piaskownicy używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`. Skonfiguruj za pomocą `agents.defaults.sandbox.browser.network`.
    - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza przychodzący ruch CDP na krawędzi kontenera za pomocą listy dozwolonych CIDR (na przykład `172.21.0.1/32`).
    - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkotrwały URL z tokenem, który udostępnia lokalną stronę startową i otwiera noVNC z hasłem we fragmencie URL (nie w logach zapytania/nagłówków).
    - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom w piaskownicy jawnie wskazywać przeglądarkę hosta jako cel.
    - Opcjonalne listy dozwolonych bramkują `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Nie trafia do piaskownicy:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do działania poza piaskownicą (np. `tools.elevated`).
  - **Exec z podwyższonymi uprawnieniami omija piaskownicę i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie albo `node`, gdy celem exec jest `node`).**
  - Jeśli piaskownica jest wyłączona, `tools.elevated` nie zmienia wykonywania (już odbywa się na hoście). Zobacz [Tryb z podwyższonymi uprawnieniami](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje, **kiedy** używana jest piaskownica:

<Tabs>
  <Tab title="off">
    Bez piaskownicy.
  </Tab>
  <Tab title="non-main">
    Piaskownica tylko dla sesji **innych niż główne** (domyślne, jeśli chcesz, aby zwykłe czaty działały na hoście).

    `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grup/kanałów używają własnych kluczy, więc są liczone jako inne niż główne i będą uruchamiane w piaskownicy.

  </Tab>
  <Tab title="all">
    Każda sesja działa w piaskownicy.
  </Tab>
</Tabs>

## Zakres

`agents.defaults.sandbox.scope` kontroluje, **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sesje w piaskownicy.

## Backend

`agents.defaults.sandbox.backend` kontroluje, **który runtime** zapewnia piaskownicę:

- `"docker"` (domyślnie, gdy piaskownica jest włączona): lokalny runtime piaskownicy oparty na Dockerze.
- `"ssh"`: ogólny zdalny runtime piaskownicy oparty na SSH.
- `"openshell"`: runtime piaskownicy oparty na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się w `agents.defaults.sandbox.ssh`. Konfiguracja specyficzna dla OpenShell znajduje się w `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Piaskownica zarządzana przez OpenShell              |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony Plugin OpenShell                           |
| **Model obszaru roboczego** | Montowanie bind lub kopiowanie | Zdalny kanoniczny (jednorazowe zasilenie) | `mirror` lub `remote`                                |
| **Kontrola sieci**  | `docker.network` (domyślnie: brak) | Zależy od zdalnego hosta       | Zależy od OpenShell                                 |
| **Piaskownica przeglądarki** | Obsługiwana              | Nieobsługiwana                 | Jeszcze nieobsługiwana                              |
| **Montowania bind** | `docker.binds`                   | N/D                            | N/D                                                 |
| **Najlepsze dla**   | Lokalny development, pełna izolacja | Przeniesienie obciążenia na zdalną maszynę | Zarządzane zdalne piaskownice z opcjonalną dwukierunkową synchronizacją |

### Backend Docker

Piaskownica jest domyślnie wyłączona. Jeśli włączysz piaskownicę i nie wybierzesz backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i przeglądarki w piaskownicy lokalnie przez gniazdo demona Docker (`/var/run/docker.sock`). Izolacja kontenera piaskownicy jest określana przez przestrzenie nazw Docker.

Aby udostępnić GPU hosta piaskownicom Docker, ustaw `agents.defaults.sandbox.docker.gpus` albo nadpisanie dla agenta `agents.list[].sandbox.docker.gpus`. Wartość jest przekazywana do flagi Docker `--gpus` jako osobny argument, na przykład `"all"` lub `"device=GPU-uuid"`, i wymaga zgodnego runtime hosta, takiego jak NVIDIA Container Toolkit.

<Warning>
**Ograniczenia Docker-out-of-Docker (DooD)**

Jeśli wdrażasz sam OpenClaw Gateway jako kontener Docker, orkiestruje on siostrzane kontenery piaskownicy za pomocą gniazda Docker hosta (DooD). Wprowadza to konkretne ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie piaskownicy, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość mostu FS (identyczna mapa wolumenów)**: natywny proces OpenClaw Gateway zapisuje także pliki Heartbeat i mostu w katalogu `workspace`. Ponieważ Gateway ocenia dokładnie ten sam ciąg (ścieżkę hosta) z wnętrza własnego skonteneryzowanego środowiska, wdrożenie Gateway MUSI zawierać identyczną mapę wolumenów łączącą natywnie przestrzeń nazw hosta (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jeśli mapujesz ścieżki wewnętrznie bez parzystości bezwzględnej ścieżki hosta, OpenClaw natywnie zgłasza błąd uprawnień `EACCES` przy próbie zapisania swojego Heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.
</Warning>

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw uruchamiał w piaskownicy `exec`, narzędzia plikowe i odczyty multimediów na dowolnej maszynie dostępnej przez SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Jak to działa">
    - OpenClaw tworzy zdalny katalog główny dla danego zakresu w `sandbox.ssh.workspaceRoot`.
    - Przy pierwszym użyciu po utworzeniu lub odtworzeniu OpenClaw jednorazowo zasila ten zdalny obszar roboczy z lokalnego obszaru roboczego.
    - Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty multimediów z promptu i przygotowanie przychodzących multimediów działają bezpośrednio na zdalnym obszarze roboczym przez SSH.
    - OpenClaw nie synchronizuje automatycznie zdalnych zmian z powrotem do lokalnego obszaru roboczego.

  </Accordion>
  <Accordion title="Materiał uwierzytelniający">
    - `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących plików lokalnych i przekazują je przez konfigurację OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline albo SecretRefs. OpenClaw rozwiązuje je przez normalną migawkę runtime sekretów, zapisuje do plików tymczasowych z `0600` i usuwa je po zakończeniu sesji SSH.
    - Jeśli zarówno `*File`, jak i `*Data` są ustawione dla tego samego elementu, `*Data` ma pierwszeństwo w tej sesji SSH.

  </Accordion>
  <Accordion title="Konsekwencje zdalnego kanonicznego modelu">
    To jest model **zdalny kanoniczny**. Zdalny obszar roboczy SSH staje się rzeczywistym stanem piaskownicy po początkowym zasileniu.

    - Lokalne na hoście edycje wykonane poza OpenClaw po kroku zasilenia nie są widoczne zdalnie, dopóki nie odtworzysz piaskownicy.
    - `openclaw sandbox recreate` usuwa zdalny katalog główny dla danego zakresu i ponownie zasila go z lokalnego obszaru roboczego przy następnym użyciu.
    - Piaskownica przeglądarki nie jest obsługiwana w backendzie SSH.
    - Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw uruchamiał narzędzia w piaskownicy w zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji, referencję konfiguracji i porównanie trybów obszaru roboczego znajdziesz na dedykowanej [stronie OpenShell](/pl/gateway/openshell).

OpenShell ponownie wykorzystuje ten sam główny transport SSH i zdalny most systemu plików co ogólny backend SSH oraz dodaje cykl życia specyficzny dla OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) wraz z opcjonalnym trybem obszaru roboczego `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Tryby OpenShell:

- `mirror` (domyślnie): lokalny obszar roboczy pozostaje kanoniczny. OpenClaw synchronizuje pliki lokalne do OpenShell przed exec i synchronizuje zdalny obszar roboczy z powrotem po exec.
- `remote`: obszar roboczy OpenShell jest kanoniczny po utworzeniu piaskownicy. OpenClaw jednorazowo zasila zdalny obszar roboczy z lokalnego obszaru roboczego, a następnie narzędzia plikowe i exec działają bezpośrednio na zdalnej piaskownicy bez synchronizowania zmian z powrotem.

<AccordionGroup>
  <Accordion title="Szczegóły zdalnego transportu">
    - OpenClaw prosi OpenShell o konfigurację SSH specyficzną dla piaskownicy przez `openshell sandbox ssh-config <name>`.
    - Rdzeń zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i ponownie wykorzystuje ten sam zdalny most systemu plików używany przez `backend: "ssh"`.
    - W trybie `mirror` różni się tylko cykl życia: synchronizacja lokalnego obszaru do zdalnego przed exec, a następnie synchronizacja z powrotem po exec.

  </Accordion>
  <Accordion title="Obecne ograniczenia OpenShell">
    - piaskownica przeglądarki nie jest jeszcze obsługiwana
    - `sandbox.docker.binds` nie jest obsługiwane w backendzie OpenShell
    - parametry runtime specyficzne dla Docker w `sandbox.docker.*` nadal dotyczą tylko backendu Docker

  </Accordion>
</AccordionGroup>

#### Tryby obszaru roboczego

OpenShell ma dwa modele obszaru roboczego. To część, która w praktyce ma największe znaczenie.

<Tabs>
  <Tab title="mirror (lokalny kanoniczny)">
    Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny obszar roboczy pozostał kanoniczny**.

    Zachowanie:

    - Przed `exec` OpenClaw synchronizuje lokalny obszar roboczy do piaskownicy OpenShell.
    - Po `exec` OpenClaw synchronizuje zdalny obszar roboczy z powrotem do lokalnego obszaru roboczego.
    - Narzędzia plikowe nadal działają przez most piaskownicy, ale lokalny obszar roboczy pozostaje źródłem prawdy między turami.

    Użyj tego, gdy:

    - edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany automatycznie pojawiały się w sandboxie
    - chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker
    - chcesz, aby obszar roboczy hosta odzwierciedlał zapisy sandboxa po każdym wykonaniu exec

    Kompromis: dodatkowy koszt synchronizacji przed i po exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **obszar roboczy OpenShell stał się kanoniczny**.

    Zachowanie:

    - Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo zasila zdalny obszar roboczy z lokalnego obszaru roboczego.
    - Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnym obszarze roboczym OpenShell.
    - OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego obszaru roboczego po exec.
    - Odczyty multimediów w czasie promptu nadal działają, ponieważ narzędzia plików i multimediów czytają przez most sandboxa zamiast zakładać lokalną ścieżkę hosta.
    - Transport odbywa się przez SSH do sandboxa OpenShell zwróconego przez `openshell sandbox ssh-config`.

    Ważne konsekwencje:

    - Jeśli po kroku zasilania edytujesz pliki na hoście poza OpenClaw, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
    - Jeśli sandbox zostanie odtworzony, zdalny obszar roboczy zostanie ponownie zasilony z lokalnego obszaru roboczego.
    - Przy `scope: "agent"` lub `scope: "shared"` ten zdalny obszar roboczy jest współdzielony w tym samym zakresie.

    Użyj tego, gdy:

    - sandbox powinien działać głównie po zdalnej stronie OpenShell
    - chcesz obniżyć narzut synchronizacji na turę
    - nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandboxa

  </Tab>
</Tabs>

Wybierz `mirror`, jeśli traktujesz sandbox jako tymczasowe środowisko wykonywania. Wybierz `remote`, jeśli traktujesz sandbox jako rzeczywisty obszar roboczy.

#### Cykl życia OpenShell

Sandboxy OpenShell są nadal zarządzane przez normalny cykl życia sandboxa:

- `openclaw sandbox list` pokazuje środowiska uruchomieniowe OpenShell oraz Docker
- `openclaw sandbox recreate` usuwa bieżące środowisko uruchomieniowe i pozwala OpenClaw odtworzyć je przy następnym użyciu
- logika czyszczenia również uwzględnia backend

W trybie `remote` odtworzenie jest szczególnie ważne:

- odtworzenie usuwa kanoniczny zdalny obszar roboczy dla tego zakresu
- następne użycie zasila świeży zdalny obszar roboczy z lokalnego obszaru roboczego

W trybie `mirror` odtworzenie głównie resetuje zdalne środowisko wykonywania, ponieważ lokalny obszar roboczy i tak pozostaje kanoniczny.

## Dostęp do obszaru roboczego

`agents.defaults.sandbox.workspaceAccess` kontroluje **co sandbox może widzieć**:

<Tabs>
  <Tab title="none (default)">
    Narzędzia widzą obszar roboczy sandboxa pod `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Montuje obszar roboczy agenta tylko do odczytu w `/agent` (wyłącza `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Montuje obszar roboczy agenta do odczytu i zapisu w `/workspace`.
  </Tab>
</Tabs>

Z backendem OpenShell:

- tryb `mirror` nadal używa lokalnego obszaru roboczego jako kanonicznego źródła między turami exec
- tryb `remote` używa zdalnego obszaru roboczego OpenShell jako kanonicznego źródła po początkowym zasileniu
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Przychodzące multimedia są kopiowane do aktywnego obszaru roboczego sandboxa (`media/inbound/*`).

<Note>
**Uwaga dotycząca Skills:** narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"` OpenClaw odzwierciedla kwalifikujące się Skills w obszarze roboczym sandboxa (`.../skills`), aby można je było odczytać. Przy `"rw"` Skills obszaru roboczego są czytelne z `/workspace/skills`.
</Note>

## Niestandardowe montowania bind

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta w kontenerze. Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne i przypisane do agenta montowania bind są **scalane** (nie zastępowane). Przy `scope: "shared"` montowania bind przypisane do agenta są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko w kontenerze **przeglądarki sandboxa**.

- Gdy jest ustawione (w tym `[]`), zastępuje `agents.defaults.sandbox.docker.binds` dla kontenera przeglądarki.
- Gdy jest pominięte, kontener przeglądarki używa zastępczo `agents.defaults.sandbox.docker.binds` (zgodność wsteczna).

Przykład (źródło tylko do odczytu + dodatkowy katalog danych):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**Bezpieczeństwo bind**

- Montowania bind omijają system plików sandboxa: ujawniają ścieżki hosta w ustawionym przez Ciebie trybie (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła bind (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz montowania nadrzędne, które by je ujawniły).
- OpenClaw blokuje również typowe katalogi poświadczeń w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bind nie jest tylko dopasowaniem tekstu. OpenClaw normalizuje ścieżkę źródłową, a następnie ponownie rozwiązuje ją przez najgłębszego istniejącego przodka, zanim ponownie sprawdzi zablokowane ścieżki i dozwolone katalogi główne.
- Oznacza to, że ucieczki przez nadrzędny symlink nadal kończą się odmową, nawet gdy końcowy element jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozwiązuje się jako `/var/run/...`, jeśli `run-link` tam wskazuje.
- Dozwolone katalogi główne źródeł są kanonizowane w ten sam sposób, więc ścieżka, która wygląda na mieszczącą się na liście dozwolonych dopiero przed rozwiązaniem symlinku, nadal jest odrzucana jako `outside allowed roots`.
- Montowania wrażliwe (sekrety, klucze SSH, poświadczenia usług) powinny być `:ro`, chyba że zapis jest bezwzględnie wymagany.
- Połącz z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu w obszarze roboczym; tryby bind pozostają niezależne.
- Zobacz [Sandbox kontra zasady narzędzi kontra podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby dowiedzieć się, jak bind współdziała z zasadami narzędzi i podniesionym exec.

</Warning>

## Obrazy i konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout źródłowy kontra instalacja npm**

Skrypty pomocnicze `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` i `scripts/sandbox-browser-setup.sh` są dostępne tylko podczas uruchamiania z [checkoutu źródłowego](https://github.com/openclaw/openclaw). Nie są zawarte w pakiecie npm.

Jeśli zainstalowano OpenClaw przez `npm install -g openclaw`, użyj zamiast tego pokazanych poniżej wbudowanych poleceń `docker build`.
</Note>

<Steps>
  <Step title="Build the default image">
    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Z instalacji npm (checkout źródłowy nie jest potrzebny):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    Domyślny obraz **nie** zawiera Node. Jeśli Skill wymaga Node (lub innych środowisk uruchomieniowych), przygotuj niestandardowy obraz albo zainstaluj przez `sandbox.docker.setupCommand` (wymaga wyjścia do sieci + zapisywalnego katalogu głównego + użytkownika root).

    OpenClaw nie zastępuje po cichu brakującego `openclaw-sandbox:bookworm-slim` zwykłym `debian:bookworm-slim`. Uruchomienia sandboxa wskazujące domyślny obraz szybko kończą się błędem z instrukcją budowania, dopóki go nie zbudujesz, ponieważ dołączony obraz zawiera `python3` dla pomocników zapisu/edycji sandboxa.

  </Step>
  <Step title="Optional: build the common image">
    Dla bardziej funkcjonalnego obrazu sandboxa z typowymi narzędziami (na przykład `curl`, `jq`, `nodejs`, `python3`, `git`):

    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Z instalacji npm najpierw zbuduj domyślny obraz (patrz wyżej), a następnie zbuduj na nim obraz common, używając [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) z repozytorium.

    Następnie ustaw `agents.defaults.sandbox.docker.image` na `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Z checkoutu źródłowego:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Z instalacji npm zbuduj przy użyciu [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) z repozytorium.

  </Step>
</Steps>

Domyślnie kontenery sandboxa Docker działają **bez sieci**. Nadpisz to za pomocą `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    Dołączony obraz przeglądarki sandboxa stosuje również konserwatywne domyślne ustawienia startowe Chromium dla obciążeń kontenerowych. Bieżące ustawienia domyślne kontenera obejmują:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `--no-sandbox`, gdy `noSandbox` jest włączone.
    - Trzy flagi utwardzania grafiki (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i przydatne, gdy kontenery nie mają obsługi GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli Twoje obciążenie wymaga WebGL lub innych funkcji 3D/przeglądarki.
    - `--disable-extensions` jest domyślnie włączone i można je wyłączyć przez `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
    - `--renderer-process-limit=2` jest kontrolowane przez `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślne ustawienie Chromium.

    Jeśli potrzebujesz innego profilu środowiska uruchomieniowego, użyj niestandardowego obrazu przeglądarki i podaj własny punkt wejścia. Dla lokalnych (niekontenerowych) profili Chromium użyj `browser.extraArgs`, aby dodać dodatkowe flagi startowe.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` jest blokowane.
    - `network: "container:<id>"` jest domyślnie blokowane (ryzyko obejścia przez dołączenie do przestrzeni nazw).
    - Awaryjne obejście: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalacje Docker i skonteneryzowany Gateway znajdują się tutaj: [Docker](/pl/install/docker)

W przypadku wdrożeń Gateway Docker `scripts/docker/setup.sh` może zainicjować konfigurację sandboxa. Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Możesz nadpisać lokalizację gniazda za pomocą `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i dokumentacja env: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera sandboxa (nie przy każdym uruchomieniu). Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalnie: `agents.defaults.sandbox.docker.setupCommand`
- Dla agenta: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Typowe pułapki">
    - Domyślne `docker.network` to `"none"` (brak ruchu wychodzącego), więc instalacje pakietów zakończą się niepowodzeniem.
    - `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest przeznaczone wyłącznie do sytuacji awaryjnych.
    - `readOnlyRoot: true` uniemożliwia zapisy; ustaw `readOnlyRoot: false` albo przygotuj niestandardowy obraz.
    - `user` musi być rootem do instalacji pakietów (pomiń `user` albo ustaw `user: "0:0"`).
    - Wykonanie w piaskownicy **nie** dziedziczy hostowego `process.env`. Użyj `agents.defaults.sandbox.docker.env` (albo niestandardowego obrazu) dla kluczy API Skills.

  </Accordion>
</AccordionGroup>

## Polityka narzędzi i wyjścia awaryjne

Zasady zezwalania/odmawiania narzędzi nadal obowiązują przed regułami piaskownicy. Jeśli narzędzie jest zabronione globalnie albo dla danego agenta, piaskownica go nie przywróci.

`tools.elevated` to jawne wyjście awaryjne, które uruchamia `exec` poza piaskownicą (domyślnie `gateway`, albo `node`, gdy celem exec jest `node`). Dyrektywy `/exec` mają zastosowanie tylko do autoryzowanych nadawców i utrzymują się w ramach sesji; aby trwale wyłączyć `exec`, użyj odmowy w polityce narzędzi (zobacz [Piaskownica kontra polityka narzędzi kontra podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb piaskownicy, politykę narzędzi i klucze konfiguracji do naprawy.
- Zobacz [Piaskownica kontra polityka narzędzi kontra podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby poznać model myślowy dla pytania „dlaczego to jest zablokowane?”.

Utrzymuj to zablokowane.

## Nadpisania wieloagentowe

Każdy agent może nadpisać piaskownicę i narzędzia: `agents.list[].sandbox` oraz `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla polityki narzędzi piaskownicy). Zobacz [Wieloagentowa piaskownica i narzędzia](/pl/tools/multi-agent-sandbox-tools), aby poznać pierwszeństwo.

## Minimalny przykład włączenia

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Powiązane

- [Wieloagentowa piaskownica i narzędzia](/pl/tools/multi-agent-sandbox-tools) — nadpisania dla poszczególnych agentów i pierwszeństwo
- [OpenShell](/pl/gateway/openshell) — konfiguracja zarządzanego zaplecza piaskownicy, tryby obszaru roboczego i odniesienie konfiguracji
- [Konfiguracja piaskownicy](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Piaskownica kontra polityka narzędzi kontra podniesione uprawnienia](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie pytania „dlaczego to jest zablokowane?”
- [Bezpieczeństwo](/pl/gateway/security)
