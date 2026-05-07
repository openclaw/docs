---
read_when:
    - Przed zainstalowaniem OpenClaw musisz zainstalować Node.js
    - Zainstalowano OpenClaw, ale polecenie `openclaw` nie zostało znalezione
    - npm install -g kończy się niepowodzeniem z powodu problemów z uprawnieniami lub PATH
summary: Zainstaluj i skonfiguruj Node.js dla OpenClaw - wymagania dotyczące wersji, opcje instalacji i rozwiązywanie problemów z PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw wymaga **Node 22.16 lub nowszego**. **Node 24 jest domyślnym i zalecanym środowiskiem uruchomieniowym** dla instalacji, CI i przepływów wydań. Node 22 pozostaje wspierany w ramach aktywnej linii LTS. [Skrypt instalacyjny](/pl/install#alternative-install-methods) automatycznie wykryje i zainstaluje Node - ta strona jest przeznaczona dla sytuacji, gdy chcesz samodzielnie skonfigurować Node i upewnić się, że wszystko jest poprawnie połączone (wersje, PATH, instalacje globalne).

## Sprawdź swoją wersję

```bash
node -v
```

Jeśli polecenie wypisze `v24.x.x` lub nowszą wersję, używasz zalecanej wartości domyślnej. Jeśli wypisze `v22.16.x` lub nowszą wersję, używasz obsługiwanej ścieżki Node 22 LTS, ale nadal zalecamy przejście na Node 24, gdy będzie to wygodne. Jeśli Node nie jest zainstalowany albo wersja jest zbyt stara, wybierz jedną z metod instalacji poniżej.

## Zainstaluj Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (zalecane):

    ```bash
    brew install node
    ```

    Albo pobierz instalator dla macOS z [nodejs.org](https://nodejs.org/).

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

    Albo pobierz instalator dla Windows z [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Menedżery wersji pozwalają łatwo przełączać się między wersjami Node. Popularne opcje:

- [**fnm**](https://github.com/Schniz/fnm) - szybki, wieloplatformowy
- [**nvm**](https://github.com/nvm-sh/nvm) - powszechnie używany na macOS/Linux
- [**mise**](https://mise.jdx.dev/) - wielojęzykowy (Node, Python, Ruby itd.)

Przykład z fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Upewnij się, że menedżer wersji jest inicjalizowany w pliku startowym powłoki (`~/.zshrc` lub `~/.bashrc`). Jeśli nie jest, `openclaw` może nie być znajdowany w nowych sesjach terminala, ponieważ PATH nie będzie zawierać katalogu bin Node.
  </Warning>
</Accordion>

## Rozwiązywanie problemów

### `openclaw: command not found`

To prawie zawsze oznacza, że globalny katalog bin npm nie znajduje się w PATH.

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

    Poszukaj `<npm-prefix>/bin` (macOS/Linux) lub `<npm-prefix>` (Windows) w wyniku.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Dodaj do `~/.zshrc` lub `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Następnie otwórz nowy terminal (albo uruchom `rehash` w zsh / `hash -r` w bash).
      </Tab>
      <Tab title="Windows">
        Dodaj wynik `npm prefix -g` do systemowej zmiennej PATH przez Ustawienia → System → Zmienne środowiskowe.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Błędy uprawnień przy `npm install -g` (Linux)

Jeśli widzisz błędy `EACCES`, zmień globalny prefiks npm na katalog zapisywalny przez użytkownika:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Dodaj wiersz `export PATH=...` do `~/.bashrc` lub `~/.zshrc`, aby zmiana była trwała.

## Powiązane

- [Przegląd instalacji](/pl/install) - wszystkie metody instalacji
- [Aktualizowanie](/pl/install/updating) - utrzymywanie OpenClaw na bieżąco
- [Pierwsze kroki](/pl/start/getting-started) - pierwsze kroki po instalacji
