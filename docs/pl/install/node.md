---
read_when:
    - Musisz zainstalować Node.js przed instalacją OpenClaw
    - Zainstalowano OpenClaw, ale `openclaw` zwraca „command not found”
    - '`npm install -g` kończy się błędem uprawnień lub problemami z PATH'
summary: Zainstaluj i skonfiguruj Node.js dla OpenClaw — wymagania wersji, opcje instalacji i rozwiązywanie problemów z PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-05T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw wymaga **Node 22.14 lub nowszego**. **Node 24 jest domyślnym i zalecanym środowiskiem runtime** dla instalacji, CI i procesów wydawniczych. Node 22 pozostaje obsługiwany w ramach aktywnej linii LTS. [Skrypt instalacyjny](/install#alternative-install-methods) automatycznie wykryje i zainstaluje Node — ta strona jest przeznaczona dla sytuacji, gdy chcesz samodzielnie skonfigurować Node i upewnić się, że wszystko jest poprawnie połączone (wersje, PATH, instalacje globalne).

## Sprawdź swoją wersję

```bash
node -v
```

Jeśli polecenie wypisze `v24.x.x` lub nowszą wersję, używasz zalecanej domyślnej wersji. Jeśli wypisze `v22.14.x` lub nowszą wersję, korzystasz z obsługiwanej ścieżki Node 22 LTS, ale nadal zalecamy aktualizację do Node 24, gdy będzie to wygodne. Jeśli Node nie jest zainstalowany albo wersja jest zbyt stara, wybierz jedną z metod instalacji poniżej.

## Zainstaluj Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (zalecane):

    ```bash
    brew install node
    ```

    Możesz też pobrać instalator macOS z [nodejs.org](https://nodejs.org/).

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

    Możesz też użyć menedżera wersji (zobacz poniżej).

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

    Możesz też pobrać instalator Windows z [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Użycie menedżera wersji (nvm, fnm, mise, asdf)">
  Menedżery wersji pozwalają łatwo przełączać się między wersjami Node. Popularne opcje:

- [**fnm**](https://github.com/Schniz/fnm) — szybki, wieloplatformowy
- [**nvm**](https://github.com/nvm-sh/nvm) — szeroko używany na macOS/Linux
- [**mise**](https://mise.jdx.dev/) — wielojęzyczny (Node, Python, Ruby itd.)

Przykład z fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Upewnij się, że menedżer wersji jest inicjalizowany w pliku startowym powłoki (`~/.zshrc` lub `~/.bashrc`). W przeciwnym razie `openclaw` może nie być znajdowane w nowych sesjach terminala, ponieważ PATH nie będzie zawierać katalogu binarnego Node.
  </Warning>
</Accordion>

## Rozwiązywanie problemów

### `openclaw: command not found`

Prawie zawsze oznacza to, że globalny katalog binarny npm nie znajduje się w PATH.

<Steps>
  <Step title="Znajdź globalny prefiks npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Sprawdź, czy jest w PATH">
    ```bash
    echo "$PATH"
    ```

    Poszukaj `<npm-prefix>/bin` (macOS/Linux) lub `<npm-prefix>` (Windows) w danych wyjściowych.

  </Step>
  <Step title="Dodaj go do pliku startowego powłoki">
    <Tabs>
      <Tab title="macOS / Linux">
        Dodaj do `~/.zshrc` lub `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Następnie otwórz nowy terminal (lub uruchom `rehash` w zsh / `hash -r` w bash).
      </Tab>
      <Tab title="Windows">
        Dodaj dane wyjściowe `npm prefix -g` do systemowego PATH przez Ustawienia → System → Zmienne środowiskowe.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Błędy uprawnień przy `npm install -g` (Linux)

Jeśli widzisz błędy `EACCES`, przełącz globalny prefiks npm na katalog zapisywalny przez użytkownika:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Dodaj linię `export PATH=...` do `~/.bashrc` lub `~/.zshrc`, aby zmiana była trwała.

## Powiązane

- [Przegląd instalacji](/install) — wszystkie metody instalacji
- [Aktualizowanie](/install/updating) — utrzymywanie OpenClaw w aktualnym stanie
- [Pierwsze kroki](/start/getting-started) — pierwsze kroki po instalacji
