---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Jak działa piaskownica OpenClaw: tryby, zakresy, dostęp do obszaru roboczego i obrazy'
title: Piaskownica
x-i18n:
    generated_at: "2026-07-12T15:10:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw może uruchamiać wykonywanie narzędzi w backendzie piaskownicy, aby ograniczyć zakres potencjalnych szkód. Piaskownica jest domyślnie wyłączona i kontrolowana przez `agents.defaults.sandbox` (globalnie) lub `agents.list[].sandbox` (dla poszczególnych agentów). Proces Gateway zawsze pozostaje na hoście; po włączeniu piaskownicy przenoszone jest do niej wyłącznie wykonywanie narzędzi.

<Note>
Nie jest to doskonała granica bezpieczeństwa, ale znacząco ogranicza dostęp do systemu plików i procesów, gdy model zrobi coś nierozsądnego.
</Note>

## Co jest uruchamiane w piaskownicy

- Wykonywanie narzędzi: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.
- Opcjonalna przeglądarka w piaskownicy (`agents.defaults.sandbox.browser`).

Poza piaskownicą:

- Sam proces Gateway.
- Każde narzędzie, któremu jawnie zezwolono na działanie poza piaskownicą za pomocą `tools.elevated`. Uprzywilejowane wykonywanie poleceń omija piaskownicę i działa w skonfigurowanym miejscu wyjścia (`gateway` domyślnie lub `node`, gdy celem wykonywania jest `node`). Jeśli piaskownica jest wyłączona, `tools.elevated` niczego nie zmienia, ponieważ polecenia i tak są już wykonywane na hoście. Zobacz [Tryb uprzywilejowany](/pl/tools/elevated).

## Tryby, zakres i backend

Zachowanie piaskownicy kontrolują trzy niezależne ustawienia:

| Ustawienie | Klucz                            | Wartości                     | Domyślnie |
| ----------- | -------------------------------- | ---------------------------- | --------- |
| Tryb        | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`     |
| Zakres      | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`   |
| Backend     | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`  |

**Tryb** określa, kiedy używana jest piaskownica:

- `off`: bez piaskownicy.
- `non-main`: piaskownica dla każdej sesji z wyjątkiem głównej sesji agenta. Kluczem głównej sesji jest zawsze `agent:<agentId>:main` (lub `global`, gdy `session.scope` ma wartość `"global"`); nie można go konfigurować. Sesje grup i kanałów używają własnych kluczy, dlatego zawsze są uznawane za inne niż główna i działają w piaskownicy.
- `all`: każda sesja działa w piaskownicy.

**Zakres** określa liczbę tworzonych kontenerów lub środowisk:

- `agent`: jeden kontener na agenta.
- `session`: jeden kontener na sesję.
- `shared`: jeden kontener współdzielony przez wszystkie sesje działające w piaskownicy (w tym zakresie ignorowane są nadpisania `docker`/`ssh`/`browser` dla poszczególnych agentów).

**Backend** określa środowisko uruchomieniowe wykonujące narzędzia w piaskownicy. Konfiguracja właściwa dla SSH znajduje się w `agents.defaults.sandbox.ssh`, a konfiguracja właściwa dla OpenShell — w `plugins.entries.openshell.config`.

|                           | Docker                              | SSH                                    | OpenShell                                                    |
| ------------------------- | ----------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| **Miejsce działania**     | Lokalny kontener                    | Dowolny host dostępny przez SSH        | Piaskownica zarządzana przez OpenShell                        |
| **Konfiguracja**          | `scripts/sandbox-setup.sh`          | Klucz SSH i host docelowy              | Włączony plugin OpenShell                                    |
| **Model obszaru roboczego** | Montowanie lub kopiowanie         | Zdalny jako kanoniczny (jednorazowe zainicjowanie) | `mirror` lub `remote`                             |
| **Kontrola sieci**        | `docker.network` (domyślnie: brak)  | Zależy od hosta zdalnego               | Zależy od OpenShell                                          |
| **Piaskownica przeglądarki** | Obsługiwana                      | Nieobsługiwana                         | Jeszcze nieobsługiwana                                       |
| **Montowania powiązane**  | `docker.binds`                      | Nie dotyczy                            | Nie dotyczy                                                  |
| **Najlepsze zastosowanie** | Programowanie lokalne, pełna izolacja | Przenoszenie obciążenia na maszynę zdalną | Zarządzane zdalne piaskownice z opcjonalną synchronizacją dwukierunkową |

## Backend Docker

Docker jest domyślnym backendem po włączeniu piaskownicy. Uruchamia narzędzia i przeglądarki piaskownicy lokalnie za pośrednictwem gniazda demona Docker (`/var/run/docker.sock`); izolację zapewniają przestrzenie nazw Docker.

Wartości domyślne: `network: "none"` (brak ruchu wychodzącego), `readOnlyRoot: true`, `capDrop: ["ALL"]`, obraz `openclaw-sandbox:bookworm-slim`.

Aby udostępnić procesory graficzne hosta, ustaw `agents.defaults.sandbox.docker.gpus` (lub nadpisanie dla danego agenta) na wartość taką jak `"all"` albo `"device=GPU-uuid"`. Wartość ta jest przekazywana do flagi Docker `--gpus` i wymaga zgodnego środowiska uruchomieniowego hosta, takiego jak NVIDIA Container Toolkit.

<Warning>
**Docker poza Dockerem (DooD) — ograniczenia**

Jeśli sam Gateway OpenClaw jest wdrożony jako kontener Docker, zarządza równorzędnymi kontenerami piaskownicy za pomocą gniazda Docker hosta (DooD). Wprowadza to ograniczenie dotyczące mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: `workspace` w `openclaw.json` musi zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Demon Docker interpretuje ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie względem przestrzeni nazw samego Gateway.
- **Wymagane identyczne mapowanie woluminu**: proces Gateway zapisuje również pliki Heartbeat i mostu w tej ścieżce `workspace`. Nadaj kontenerowi Gateway identyczne mapowanie woluminu (`-v /home/user/.openclaw:/home/user/.openclaw`), aby ta sama ścieżka hosta była poprawnie rozpoznawana także wewnątrz kontenera Gateway. Niezgodne mapowania powodują błąd `EACCES`, gdy Gateway próbuje zapisać Heartbeat.
- **Tryb kodu Codex**: gdy piaskownica OpenClaw jest aktywna, OpenClaw wyłącza na czas danego przebiegu natywny tryb kodu serwera aplikacji Codex, serwery MCP użytkownika oraz wykonywanie pluginów wspieranych przez aplikacje (działają one z procesu serwera aplikacji na hoście Gateway, a nie z backendu piaskownicy OpenClaw), chyba że polityka narzędzi piaskownicy udostępnia wymagane narzędzia i włączysz eksperymentalną ścieżkę serwera wykonywania poleceń w piaskownicy. Dostęp do powłoki jest wtedy kierowany przez narzędzia OpenClaw korzystające z backendu piaskownicy, takie jak `sandbox_exec` i `sandbox_process`. Nie montuj gniazda Docker hosta w kontenerach piaskownicy agentów ani w niestandardowych piaskownicach Codex. Pełny opis zachowania znajdziesz w [Uprzęży Codex](/pl/plugins/codex-harness).

Na hostach Ubuntu/AppArmor z włączonym trybem piaskownicy Docker wykonywanie poleceń powłoki w trybie `workspace-write` serwera aplikacji Codex wymaga nieuprzywilejowanych przestrzeni nazw użytkownika wewnątrz kontenera piaskownicy i może zakończyć się niepowodzeniem jeszcze przed uruchomieniem powłoki, jeśli użytkownik usługi nie może ich utworzyć. Gdy ruch wychodzący z piaskownicy Docker jest wyłączony (`network: "none"`, wartość domyślna), wymagana jest również nieuprzywilejowana przestrzeń nazw sieci. Typowe objawy to: `bwrap: setting up uid map: Permission denied` oraz `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Uruchom `openclaw doctor`; jeśli zgłosi niepowodzenie testu przestrzeni nazw bwrap Codex, preferuj profil AppArmor, który przyznaje procesowi usługi OpenClaw dostęp do wymaganych przestrzeni nazw. `kernel.apparmor_restrict_unprivileged_userns=0` jest rozwiązaniem awaryjnym obejmującym cały host i wiąże się z kompromisami w zakresie bezpieczeństwa; używaj go tylko wtedy, gdy taka konfiguracja zabezpieczeń hosta jest akceptowalna.
</Warning>

### Przeglądarka w piaskownicy

- Przeglądarka piaskownicy uruchamia się automatycznie (zapewniając dostępność CDP), gdy wymaga jej narzędzie przeglądarki. Skonfiguruj ją za pomocą `agents.defaults.sandbox.browser.autoStart` (domyślnie `true`) i `autoStartTimeoutMs` (domyślnie 12 s).
- Kontenery przeglądarki piaskownicy korzystają z dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`. Skonfiguruj ją za pomocą `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza przychodzący ruch CDP na granicy kontenera za pomocą listy dozwolonych zakresów CIDR (na przykład `172.21.0.1/32`).
- Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw generuje adres URL z krótkotrwałym tokenem, który udostępnia lokalną stronę inicjującą i otwiera noVNC z hasłem we fragmencie adresu URL (nie w ciągu zapytania ani dziennikach nagłówków).
- `agents.defaults.sandbox.browser.allowHostControl` (domyślnie `false`) umożliwia sesjom w piaskownicy jawne wskazanie przeglądarki hosta jako celu.
- Opcjonalne listy dozwolonych wartości kontrolują `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Użyj `backend: "ssh"`, aby uruchamiać `exec`, narzędzia plikowe i odczyty multimediów w piaskownicy na dowolnej maszynie dostępnej przez SSH.

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

Wartości domyślne: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Cykl życia**: OpenClaw tworzy zdalny katalog główny dla każdego zakresu w `sandbox.ssh.workspaceRoot`. Przy pierwszym użyciu po utworzeniu lub ponownym utworzeniu jednorazowo inicjuje ten zdalny obszar roboczy z lokalnego obszaru roboczego. Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty multimediów na potrzeby promptów oraz przygotowywanie przychodzących multimediów działają bezpośrednio na zdalnym obszarze roboczym przez SSH. OpenClaw nie synchronizuje automatycznie zmian zdalnych z powrotem do lokalnego obszaru roboczego.
- **Materiały uwierzytelniające**: `identityFile`/`certificateFile`/`knownHostsFile` wskazują istniejące pliki lokalne. `identityData`/`certificateData`/`knownHostsData` przyjmują ciągi podane bezpośrednio lub odwołania SecretRefs, rozwiązywane przez standardową migawkę środowiska uruchomieniowego sekretów, zapisywane w plikach tymczasowych z trybem `0600` i usuwane po zakończeniu sesji SSH. Jeśli dla tego samego elementu ustawiono zarówno wariant `*File`, jak i `*Data`, w danej sesji pierwszeństwo ma `*Data`.
- **Konsekwencje zdalnego stanu kanonicznego**: po początkowym zainicjowaniu zdalny obszar roboczy SSH staje się rzeczywistym stanem piaskownicy. Lokalne zmiany na hoście wprowadzone poza OpenClaw po etapie inicjowania nie są widoczne zdalnie, dopóki nie utworzysz piaskownicy ponownie. `openclaw sandbox recreate` usuwa zdalny katalog główny danego zakresu i przy następnym użyciu ponownie inicjuje go z lokalnego obszaru roboczego. Ten backend nie obsługuje piaskownicy przeglądarki, a ustawienia `sandbox.docker.*` nie mają do niego zastosowania.

## Backend OpenShell

Użyj `backend: "openshell"`, aby uruchamiać narzędzia w piaskownicy w zdalnym środowisku zarządzanym przez OpenShell. OpenShell używa tego samego transportu SSH i mostu zdalnego systemu plików co ogólny backend SSH, a ponadto zapewnia obsługę cyklu życia OpenShell (`sandbox create/get/delete/ssh-config`) oraz opcjonalny tryb synchronizacji obszaru roboczego `mirror`.

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (domyślny) zachowuje lokalny obszar roboczy jako kanoniczny: OpenClaw synchronizuje dane lokalne z piaskownicą przed `exec`, a następnie synchronizuje zmiany z powrotem. `mode: "remote"` jednorazowo inicjuje zdalny obszar roboczy z lokalnego, po czym uruchamia `exec`/`read`/`write`/`edit`/`apply_patch` bezpośrednio na zdalnym obszarze roboczym bez synchronizowania zmian z powrotem; lokalne zmiany po zainicjowaniu są niewidoczne, dopóki nie uruchomisz `openclaw sandbox recreate`. W przypadku `scope: "agent"` lub `scope: "shared"` ten zdalny obszar roboczy jest współdzielony w tym samym zakresie. Obecne ograniczenia: piaskownica przeglądarki nie jest jeszcze obsługiwana, a `sandbox.docker.binds` nie ma zastosowania do tego backendu.

Polecenia `openclaw sandbox list`/`recreate`/prune traktują środowiska uruchomieniowe OpenShell tak samo jak środowiska Docker; logika czyszczenia uwzględnia backend.

Pełne wymagania wstępne, opis konfiguracji, porównanie trybów obszaru roboczego i szczegóły cyklu życia znajdziesz w sekcji [OpenShell](/pl/gateway/openshell).

## Dostęp do obszaru roboczego

`agents.defaults.sandbox.workspaceAccess` określa, co jest widoczne dla piaskownicy:

| Wartość          | Zachowanie                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `none` (domyślne) | Narzędzia korzystają z izolowanego obszaru roboczego piaskownicy w `~/.openclaw/sandboxes`.       |
| `ro`             | Montuje obszar roboczy agenta tylko do odczytu w `/agent` (wyłącza `write`/`edit`/`apply_patch`). |
| `rw`             | Montuje obszar roboczy agenta do odczytu i zapisu w `/workspace`.                                 |

W przypadku backendu OpenShell tryb `mirror` nadal używa lokalnego obszaru roboczego jako źródła kanonicznego między wywołaniami `exec`, tryb `remote` po początkowym zainicjowaniu używa jako źródła kanonicznego zdalnego obszaru roboczego OpenShell, a `workspaceAccess: "ro"`/`"none"` nadal ogranicza możliwość zapisu w taki sam sposób.

Przychodzące multimedia są kopiowane do aktywnego obszaru roboczego piaskownicy (`media/inbound/*`).

<Note>
**Skills**: narzędzie `read` jest ograniczone do katalogu głównego piaskownicy. Przy `workspaceAccess: "none"` OpenClaw kopiuje kwalifikujące się Skills do obszaru roboczego piaskownicy (`.../skills`), aby można było je odczytać. Przy `"rw"` Skills z obszaru roboczego są dostępne do odczytu w `/workspace/skills`, a kwalifikujące się zarządzane, dołączone lub pochodzące z Pluginów Skills są umieszczane w wygenerowanej ścieżce tylko do odczytu `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Niestandardowe montowania typu bind

`agents.defaults.sandbox.docker.binds` montuje w kontenerze dodatkowe katalogi hosta. Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne montowania typu bind i montowania przypisane do poszczególnych agentów są scalane (a nie zastępowane). Przy `scope: "shared"` montowania przypisane do poszczególnych agentów są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta wyłącznie w kontenerze **przeglądarki piaskownicy**. Gdy ta opcja jest ustawiona (również na `[]`), zastępuje `docker.binds` dla kontenera przeglądarki; gdy ją pominięto, kontener przeglądarki używa `docker.binds`.

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
**Bezpieczeństwo montowań typu bind**

- Montowania typu bind omijają system plików piaskownicy: udostępniają ścieżki hosta z ustawionym przez Ciebie trybem (`:ro` lub `:rw`).
- OpenClaw domyślnie blokuje niebezpieczne źródła montowań typu bind: ścieżki systemowe (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), katalogi gniazd Dockera (`/run`, `/var/run` oraz znajdujące się w nich warianty `docker.sock`) i typowe katalogi poświadczeń w katalogu domowym (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Walidacja normalizuje ścieżkę źródłową, a następnie ponownie ją rozwiązuje poprzez najgłębszy istniejący katalog nadrzędny przed ponownym sprawdzeniem zablokowanych ścieżek i dozwolonych katalogów głównych. Dzięki temu próby ucieczki przez dowiązanie symboliczne w katalogu nadrzędnym są bezpiecznie odrzucane, nawet jeśli końcowy element ścieżki jeszcze nie istnieje (np. `/workspace/run-link/new-file` nadal jest rozwiązywane jako `/var/run/...`, jeśli `run-link` wskazuje tę lokalizację).
- Cele montowań typu bind, które przesłaniają zarezerwowane punkty montowania kontenera (`/workspace`, `/agent`), również są domyślnie blokowane; można to zmienić za pomocą `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Źródła montowań typu bind spoza dozwolonych katalogów głównych obszaru roboczego lub obszaru roboczego agenta są domyślnie blokowane; można to zmienić za pomocą `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Dozwolone katalogi główne są kanonizowane w ten sam sposób, dlatego ścieżka, która tylko przed rozwiązaniem dowiązań symbolicznych wygląda na znajdującą się na liście dozwolonych, nadal zostanie odrzucona jako leżąca poza dozwolonymi katalogami głównymi.
- Wrażliwe montowania (sekrety, klucze SSH, poświadczenia usług) powinny mieć tryb `:ro`, chyba że zapis jest bezwzględnie wymagany.
- Połącz to z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu obszaru roboczego; tryby montowań typu bind pozostają niezależne.
- Zobacz [Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby dowiedzieć się, jak montowania typu bind współdziałają z zasadami narzędzi i wykonywaniem z podwyższonymi uprawnieniami.

</Warning>

## Obrazy i konfiguracja

Domyślny obraz Dockera: `openclaw-sandbox:bookworm-slim`

<Note>
**Kopia robocza źródeł a instalacja z npm**

Skrypty pomocnicze `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` i `scripts/sandbox-browser-setup.sh` są dostępne tylko podczas uruchamiania z [kopii roboczej źródeł](https://github.com/openclaw/openclaw). Nie są zawarte w pakiecie npm.

Jeśli zainstalowano OpenClaw za pomocą `npm install -g openclaw`, użyj zamiast nich pokazanych poniżej wbudowanych poleceń `docker build`.
</Note>

<Steps>
  <Step title="Zbuduj domyślny obraz">
    Z kopii roboczej źródeł:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Z instalacji npm (kopia robocza źródeł nie jest wymagana):

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

    Domyślny obraz **nie** zawiera środowiska Node. Jeśli Skill wymaga Node (lub innych środowisk uruchomieniowych), zbuduj niestandardowy obraz albo zainstaluj je za pomocą `sandbox.docker.setupCommand` (wymaga wychodzącego dostępu do sieci, zapisywalnego głównego systemu plików i użytkownika root).

    Gdy brakuje `openclaw-sandbox:bookworm-slim`, OpenClaw nie zastępuje go po cichu zwykłym obrazem `debian:bookworm-slim`. Uruchomienia piaskownicy korzystające z domyślnego obrazu natychmiast kończą się niepowodzeniem i wyświetlają instrukcję budowania, dopóki go nie zbudujesz, ponieważ dołączony obraz zawiera `python3` wymagany przez narzędzia pomocnicze piaskownicy do zapisu i edycji.

  </Step>
  <Step title="Opcjonalnie: zbuduj obraz ze wspólnymi narzędziami">
    Aby uzyskać bardziej funkcjonalny obraz piaskownicy ze wspólnymi narzędziami (na przykład `curl`, `jq`, Node 24, pnpm, `python3` i `git`):

    Z kopii roboczej źródeł:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    W przypadku instalacji npm najpierw zbuduj domyślny obraz (zobacz wyżej), a następnie zbuduj na jego podstawie obraz ze wspólnymi narzędziami, używając pliku [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) z repozytorium.

    Następnie ustaw `agents.defaults.sandbox.docker.image` na `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcjonalnie: zbuduj obraz przeglądarki piaskownicy">
    Z kopii roboczej źródeł:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    W przypadku instalacji npm zbuduj obraz przy użyciu pliku [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) z repozytorium.

  </Step>
</Steps>

Domyślnie kontenery piaskownicy Dockera działają **bez dostępu do sieci**. Można to zmienić za pomocą `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Domyślne ustawienia Chromium w przeglądarce piaskownicy">
    Dołączony obraz przeglądarki piaskownicy stosuje zachowawcze flagi uruchamiania Chromium dla obciążeń działających w kontenerach:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new`, gdy włączono `browser.headless`.
    - `--no-sandbox --disable-setuid-sandbox`, gdy włączono `browser.noSandbox`.
    - Domyślnie `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`; te flagi zwiększające bezpieczeństwo grafiki pomagają w kontenerach bez obsługi GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli Twoje obciążenie wymaga WebGL lub innych funkcji 3D.
    - Domyślnie `--disable-extensions`; ustaw `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
    - Domyślnie `--renderer-process-limit=2`; steruje tym `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje ustawienie domyślne Chromium.

    Jeśli potrzebujesz innego profilu środowiska uruchomieniowego, użyj niestandardowego obrazu przeglądarki i własnego punktu wejścia. W przypadku lokalnych profili Chromium (poza kontenerem) użyj `browser.extraArgs`, aby dołączyć dodatkowe flagi uruchamiania.

  </Accordion>
  <Accordion title="Domyślne ustawienia bezpieczeństwa sieci">
    - `network: "host"` jest zablokowane.
    - `network: "container:<id>"` jest domyślnie zablokowane (ryzyko obejścia izolacji przez dołączenie do przestrzeni nazw).
    - Awaryjne obejście zabezpieczeń: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Informacje o instalacjach Dockera i Gateway działającym w kontenerze znajdują się tutaj: [Docker](/pl/install/docker)

W przypadku wdrożeń Gateway w Dockerze skrypt `scripts/docker/setup.sh` może zainicjować konfigurację piaskownicy. Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Pełna konfiguracja i dokumentacja zmiennych środowiskowych: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` jest uruchamiane **raz** po utworzeniu kontenera piaskownicy (a nie przy każdym uruchomieniu). Jest wykonywane wewnątrz kontenera za pomocą `sh -lc`.

Ścieżki:

- Globalna: `agents.defaults.sandbox.docker.setupCommand`
- Dla agenta: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Typowe pułapki">
    - Domyślna wartość `docker.network` to `"none"` (brak ruchu wychodzącego), dlatego instalowanie pakietów zakończy się niepowodzeniem.
    - `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i służy wyłącznie jako awaryjne obejście zabezpieczeń.
    - `readOnlyRoot: true` uniemożliwia zapis; ustaw `readOnlyRoot: false` lub zbuduj niestandardowy obraz.
    - Podczas instalowania pakietów `user` musi wskazywać użytkownika root (pomiń `user` lub ustaw `user: "0:0"`).
    - Polecenia wykonywane w piaskownicy **nie** dziedziczą `process.env` hosta. Klucze API dla Skills należy przekazywać przez `agents.defaults.sandbox.docker.env` (lub umieścić w niestandardowym obrazie).
    - Wartości z `agents.defaults.sandbox.docker.env` są przekazywane jako jawne zmienne środowiskowe kontenera Dockera. Każda osoba mająca dostęp do demona Dockera może je sprawdzić za pomocą poleceń metadanych Dockera, takich jak `docker inspect`. Jeśli takie ujawnienie w metadanych jest niedopuszczalne, użyj niestandardowego obrazu, zamontowanego pliku z sekretem lub innej metody dostarczania sekretów.

  </Accordion>
</AccordionGroup>

## Zasady narzędzi i drogi obejścia zabezpieczeń

Zasady zezwalania na narzędzia i blokowania ich nadal obowiązują przed regułami piaskownicy. Jeśli narzędzie jest zablokowane globalnie lub dla konkretnego agenta, piaskownica nie przywraca do niego dostępu.

`tools.elevated` jest jawnym mechanizmem obejścia, który uruchamia `exec` poza piaskownicą (domyślnie na `gateway`, a na `node`, gdy celem wykonania jest `node`). Dyrektywy `/exec` mają zastosowanie tylko do autoryzowanych nadawców i są zachowywane w ramach sesji; aby całkowicie wyłączyć `exec`, zablokuj je w zasadach narzędzi (zobacz [Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- `openclaw sandbox list` wyświetla kontenery piaskownicy, ich stan, zgodność obrazu, wiek, czas bezczynności oraz powiązaną sesję lub agenta.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` sprawdza obowiązujący tryb piaskownicy, obszar roboczy hosta, katalog roboczy środowiska uruchomieniowego, montowania Dockera, zasady narzędzi i klucze konfiguracji służące do rozwiązania problemu. Pole `workspaceRoot` nadal zawiera skonfigurowany katalog główny piaskownicy; `effectiveHostWorkspaceRoot` wskazuje rzeczywistą lokalizację aktywnego obszaru roboczego.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` usuwa kontenery lub środowiska, aby przy następnym użyciu zostały ponownie utworzone zgodnie z bieżącą konfiguracją.
- Zobacz [Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby poznać model mentalny odpowiadający na pytanie „dlaczego to jest zablokowane?”.

## Ustawienia zastępcze dla wielu agentów

Każdy agent może zastąpić ustawienia piaskownicy i narzędzi: `agents.list[].sandbox` oraz `agents.list[].tools` (a także `agents.list[].tools.sandbox.tools` w przypadku zasad narzędzi piaskownicy). Kolejność pierwszeństwa opisano w sekcji [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools).

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

- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania dla poszczególnych agentów i kolejność pierwszeństwa
- [OpenShell](/pl/gateway/openshell) -- konfiguracja zarządzanego zaplecza piaskownicy, tryby obszaru roboczego i dokumentacja konfiguracji
- [Konfiguracja piaskownicy](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- diagnozowanie problemu „dlaczego jest to blokowane?”
- [Bezpieczeństwo](/pl/gateway/security)
