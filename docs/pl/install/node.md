---
read_when:
    - Przed zainstalowaniem OpenClaw musisz zainstalować Node.js
    - Zainstalowano OpenClaw, ale `openclaw` zgłasza błąd „nie znaleziono polecenia”
    - npm install -g kończy się niepowodzeniem z powodu problemów z uprawnieniami lub PATH
summary: Instalacja i konfiguracja Node.js dla OpenClaw - wymagania dotyczące wersji, opcje instalacji i rozwiązywanie problemów z PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-06T09:19:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa445f3b9e6472af755c2fc4c3f08b6134e308f290ab750549411f12d8d247db
    source_path: install/node.md
    workflow: 16
---

OpenClaw wymaga **Node 22.14 lub nowszego**. **Node 24 jest domyślnym i zalecanym środowiskiem uruchomieniowym** dla instalacji, CI i przepływów wydań. Node 22 pozostaje obsługiwany przez aktywną linię LTS. [Skrypt instalacyjny](/pl/install#alternative-install-methods) automatycznie wykryje i zainstaluje Node - ta strona jest przeznaczona na sytuacje, gdy chcesz samodzielnie skonfigurować Node i upewnić się, że wszystko jest poprawnie połączone (wersje, PATH, instalacje globalne).

## Sprawdź swoją wersję

```bash
node -v
```

Jeśli polecenie wypisze `v24.x.x` lub wyższą wersję, używasz zalecanej domyślnej wersji. Jeśli wypisze `v22.14.x` lub wyższą wersję, używasz obsługiwanej ścieżki Node 22 LTS, ale nadal zalecamy przejście na Node 24, gdy będzie to wygodne. Jeśli Node nie jest zainstalowany albo wersja jest zbyt stara, wybierz jedną z metod instalacji poniżej.

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

<Accordion title="Używanie menedżera wersji (nvm, fnm, mise, asdf)">
  Menedżery wersji pozwalają łatwo przełączać się między wersjami Node. Popularne opcje:

- [**fnm**](https://github.com/Schniz/fnm) - szybki, wieloplatformowy
- [**nvm**](https://github.com/nvm-sh/nvm) - powszechnie używany w macOS/Linux
- [**mise**](https://mise.jdx.dev/) - wielojęzyczny (Node, Python, Ruby itd.)

Przykład z fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Upewnij się, że menedżer wersji jest inicjowany w pliku startowym powłoki (`~/.zshrc` lub `~/.bashrc`). Jeśli tak nie jest, `openclaw` może nie być znajdowany w nowych sesjach terminala, ponieważ PATH nie będzie obejmować katalogu bin Node.
  </Warning>
</Accordion>

## Rozwiązywanie problemów

### `openclaw: command not found`

To niemal zawsze oznacza, że globalny katalog bin npm nie znajduje się w PATH.

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

    Poszukaj `<npm-prefix>/bin` (macOS/Linux) albo `<npm-prefix>` (Windows) w wyniku polecenia.

  </Step>
  <Step title="Dodaj go do pliku startowego powłoki">
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
- [Aktualizowanie](/pl/install/updating) - utrzymywanie OpenClaw w aktualnej wersji
- [Pierwsze kroki](/pl/start/getting-started) - pierwsze kroki po instalacji
