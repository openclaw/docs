---
read_when:
    - Przed zainstalowaniem OpenClaw musisz zainstalować Node.js
    - 'Zainstalowano OpenClaw, ale pojawia się błąd `openclaw`: nie znaleziono polecenia'
    - '`npm install -g` kończy się niepowodzeniem z powodu uprawnień lub problemów ze zmienną `PATH`'
summary: Instalowanie i konfigurowanie Node.js dla OpenClaw — wymagania dotyczące wersji, opcje instalacji i rozwiązywanie problemów ze zmienną PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-12T15:14:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw wymaga **Node 22.19+, Node 23.11+ lub Node 24+**. **Node 24 jest domyślnym i zalecanym środowiskiem uruchomieniowym** dla instalacji, CI i procesów wydawniczych; Node 22 pozostaje obsługiwany w ramach aktywnej linii LTS. [Skrypt instalacyjny](/pl/install#alternative-install-methods) automatycznie wykrywa i instaluje Node — skorzystaj z tej strony, jeśli chcesz samodzielnie skonfigurować Node (wersje, PATH, instalacje globalne).

## Sprawdź swoją wersję

```bash
node -v
```

Zalecanym domyślnym wyborem jest `v24.x.x` lub nowsza wersja. Obsługiwana ścieżka Node 22 LTS wymaga wersji `v22.19.x` lub nowszej (przejdź na Node 24, gdy będzie to dogodne). Wydania Node 23 starsze niż `v23.11.0` nie są obsługiwane. Jeśli brakuje Node lub jego wersja nie mieści się w obsługiwanym zakresie, wybierz jedną z poniższych metod instalacji.

## Zainstaluj Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (zalecane):

    ```bash
    brew install node
    ```

    Możesz też pobrać instalator dla systemu macOS ze strony [nodejs.org](https://nodejs.org/).

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

    Możesz też użyć menedżera wersji (patrz poniżej).

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

    Możesz też pobrać instalator dla systemu Windows ze strony [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Korzystanie z menedżera wersji (nvm, fnm, mise, asdf)">
  Menedżery wersji umożliwiają łatwe przełączanie się między wersjami Node. Popularne rozwiązania:

- [**fnm**](https://github.com/Schniz/fnm) — szybki i wieloplatformowy
- [**nvm**](https://github.com/nvm-sh/nvm) — powszechnie używany w systemach macOS/Linux
- [**mise**](https://mise.jdx.dev/) — obsługuje wiele języków (Node, Python, Ruby itp.)

Przykład z użyciem fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Zainicjuj menedżer wersji w pliku startowym powłoki (`~/.zshrc` lub `~/.bashrc`). Jeśli pominiesz ten krok, polecenie `openclaw` może nie być dostępne w nowych sesjach terminala, ponieważ PATH nie będzie zawierać katalogu binarnego Node.
  </Warning>
</Accordion>

## Rozwiązywanie problemów

### `openclaw: command not found`

Prawie zawsze oznacza to, że globalny katalog plików binarnych npm nie znajduje się w PATH.

<Steps>
  <Step title="Znajdź globalny prefiks npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Sprawdź, czy znajduje się w PATH">
    ```bash
    echo "$PATH"
    ```

    Poszukaj w danych wyjściowych wpisu `<npm-prefix>/bin` (macOS/Linux) lub `<npm-prefix>` (Windows).

  </Step>
  <Step title="Dodaj go do pliku startowego powłoki">
    <Tabs>
      <Tab title="macOS / Linux">
        Dodaj do pliku `~/.zshrc` lub `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Następnie otwórz nowy terminal (lub uruchom `rehash` w powłoce zsh albo `hash -r` w powłoce bash).
      </Tab>
      <Tab title="Windows">
        Dodaj wynik polecenia `npm prefix -g` do systemowej zmiennej PATH za pomocą opcji Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Błędy uprawnień podczas wykonywania `npm install -g` (Linux)

Jeśli pojawiają się błędy `EACCES`, zmień globalny prefiks npm na katalog z prawem zapisu dla użytkownika:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Dodaj wiersz `export PATH=...` do pliku `~/.bashrc` lub `~/.zshrc`, aby zmiana była trwała.

## Powiązane materiały

- [Omówienie instalacji](/pl/install) — wszystkie metody instalacji
- [Aktualizowanie](/pl/install/updating) — utrzymywanie aktualnej wersji OpenClaw
- [Pierwsze kroki](/pl/start/getting-started) — pierwsze czynności po instalacji
