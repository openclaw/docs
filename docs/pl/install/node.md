---
read_when:
    - Przed zainstalowaniem OpenClaw należy zainstalować Node.js
    - Zainstalowano OpenClaw, ale nie znaleziono polecenia `openclaw`
    - npm install -g kończy się niepowodzeniem z powodu problemów z uprawnieniami lub zmienną PATH
summary: Instalowanie i konfigurowanie Node.js dla OpenClaw — wymagania dotyczące wersji, opcje instalacji i rozwiązywanie problemów ze zmienną PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-16T18:45:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw wymaga **Node 22.22.3+, Node 24.15+ lub Node 25.9+**. **Node 24 jest domyślnym i zalecanym środowiskiem uruchomieniowym** dla instalacji, CI i procesów wydawania; Node 22 pozostaje obsługiwany w ramach aktywnej linii LTS. Node 23 nie jest obsługiwany. [Skrypt instalacyjny](/pl/install#alternative-install-methods) automatycznie wykrywa i instaluje Node — z tej strony należy skorzystać, aby samodzielnie skonfigurować Node (wersje, PATH, instalacje globalne).

## Sprawdzanie wersji

```bash
node -v
```

`v24.15.0` lub nowsza wersja 24.x jest zalecaną wersją domyślną. `v22.22.3` lub nowsza wersja 22.x jest obsługiwaną ścieżką Node 22 LTS; Node `v25.9.0+` jest również obsługiwany. Node 23 nie jest obsługiwany. Jeśli Node nie jest zainstalowany lub jego wersja jest poza obsługiwanym zakresem, należy wybrać jedną z poniższych metod instalacji.

## Instalowanie Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (zalecane):

    ```bash
    brew install node
    ```

    Można też pobrać instalator dla systemu macOS ze strony [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Można też użyć menedżera wersji (patrz poniżej).

  </Tab>
  <Tab title="Windows">
    **winget** (zalecane):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Można też pobrać instalator dla systemu Windows ze strony [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Korzystanie z menedżera wersji (nvm, fnm, mise, asdf)">
  Menedżery wersji umożliwiają łatwe przełączanie między wersjami Node. Popularne opcje:

- [**fnm**](https://github.com/Schniz/fnm) - szybki, wieloplatformowy
- [**nvm**](https://github.com/nvm-sh/nvm) - powszechnie używany w systemach macOS/Linux
- [**mise**](https://mise.jdx.dev/) - obsługuje wiele języków (Node, Python, Ruby itp.)

Przykład z użyciem fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Menedżer wersji należy zainicjować w pliku startowym powłoki (`~/.zshrc` lub `~/.bashrc`). W przeciwnym razie polecenie `openclaw` może nie zostać znalezione w nowych sesjach terminala, ponieważ PATH nie będzie zawierać katalogu bin Node.
  </Warning>
</Accordion>

## Rozwiązywanie problemów

### `openclaw: command not found`

Prawie zawsze oznacza to, że globalny katalog bin npm nie znajduje się w PATH.

<Steps>
  <Step title="Znajdowanie globalnego prefiksu npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Sprawdzanie, czy znajduje się w PATH">
    ```bash
    echo "$PATH"
    ```

    W danych wyjściowych należy odszukać `<npm-prefix>/bin` (macOS/Linux) lub `<npm-prefix>` (Windows).

  </Step>
  <Step title="Dodawanie do pliku startowego powłoki">
    <Tabs>
      <Tab title="macOS / Linux">
        Należy dodać do `~/.zshrc` lub `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Następnie należy otworzyć nowy terminal (lub uruchomić `rehash` w zsh albo `hash -r` w bash).
      </Tab>
      <Tab title="Windows">
        Należy dodać wynik polecenia `npm prefix -g` do systemowej zmiennej PATH za pomocą opcji Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Błędy uprawnień podczas wykonywania `npm install -g` (Linux)

Jeśli występują błędy `EACCES`, należy zmienić globalny prefiks npm na katalog z prawem zapisu dla użytkownika:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Aby zachować tę zmianę na stałe, należy dodać wiersz `export PATH=...` do pliku `~/.bashrc` lub `~/.zshrc`.

## Powiązane materiały

- [Omówienie instalacji](/pl/install) - wszystkie metody instalacji
- [Aktualizowanie](/pl/install/updating) - utrzymywanie aktualnej wersji OpenClaw
- [Pierwsze kroki](/pl/start/getting-started) - pierwsze kroki po instalacji
