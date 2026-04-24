---
read_when:
    - Musisz zainstalować Node.js przed instalacją OpenClaw
    - Zainstalowałeś OpenClaw, ale `openclaw` zwraca „command not found”
    - '`npm install -g` kończy się błędem z powodu uprawnień lub problemów z PATH'
summary: Instalacja i konfiguracja Node.js dla OpenClaw — wymagania dotyczące wersji, opcje instalacji i rozwiązywanie problemów z PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-24T09:17:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw wymaga **Node 22.14 lub nowszego**. **Node 24 to domyślny i zalecany runtime** dla instalacji, CI i workflow wydań. Node 22 pozostaje obsługiwany przez aktywną linię LTS. [Skrypt instalacyjny](/pl/install#alternative-install-methods) wykryje i zainstaluje Node automatycznie — ta strona jest przeznaczona na sytuacje, gdy chcesz skonfigurować Node samodzielnie i upewnić się, że wszystko jest poprawnie podłączone (wersje, PATH, instalacje globalne).

## Sprawdź swoją wersję

```bash
node -v
```

Jeśli to wypisuje `v24.x.x` lub nowszą, używasz zalecanego domyślnego środowiska. Jeśli wypisuje `v22.14.x` lub nowszą, jesteś na obsługiwanej ścieżce Node 22 LTS, ale nadal zalecamy aktualizację do Node 24, gdy będzie to wygodne. Jeśli Node nie jest zainstalowany albo wersja jest zbyt stara, wybierz jedną z metod instalacji poniżej.

## Zainstaluj Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (zalecane):

    ```bash
    brew install node
    ```

    Albo pobierz instalator macOS z [nodejs.org](https://nodejs.org/).

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

    Albo użyj menedżera wersji (zobacz poniżej).

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

    Albo pobierz instalator Windows z [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
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
  Upewnij się, że menedżer wersji jest inicjalizowany w pliku startowym powłoki (`~/.zshrc` lub `~/.bashrc`). Jeśli nie, `openclaw` może nie być znajdowane w nowych sesjach terminala, ponieważ PATH nie będzie zawierał katalogu `bin` Node.
  </Warning>
</Accordion>

## Rozwiązywanie problemów

### `openclaw: command not found`

To prawie zawsze oznacza, że globalny katalog `bin` npm nie znajduje się w PATH.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Poszukaj `<npm-prefix>/bin` (macOS/Linux) albo `<npm-prefix>` (Windows) w danych wyjściowych.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Dodaj do `~/.zshrc` albo `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Następnie otwórz nowy terminal (albo uruchom `rehash` w zsh / `hash -r` w bash).
      </Tab>
      <Tab title="Windows">
        Dodaj wynik `npm prefix -g` do systemowego PATH przez Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Błędy uprawnień przy `npm install -g` (Linux)

Jeśli widzisz błędy `EACCES`, przełącz globalny prefiks npm na katalog, do którego użytkownik może zapisywać:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Dodaj wiersz `export PATH=...` do `~/.bashrc` albo `~/.zshrc`, aby zmiana była trwała.

## Powiązane

- [Install Overview](/pl/install) — wszystkie metody instalacji
- [Updating](/pl/install/updating) — utrzymywanie OpenClaw na bieżąco
- [Getting Started](/pl/start/getting-started) — pierwsze kroki po instalacji
