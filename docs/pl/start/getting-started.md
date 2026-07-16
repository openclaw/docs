---
read_when:
    - Pierwsza konfiguracja od zera
    - Zależy Ci na najszybszym sposobie uruchomienia działającego czatu
summary: Zainstaluj OpenClaw i rozpocznij pierwszy czat w ciągu kilku minut.
title: Pierwsze kroki
x-i18n:
    generated_at: "2026-07-16T19:02:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Zainstaluj OpenClaw, przeprowadź proces wdrażania i rozpocznij rozmowę z asystentem AI w około 5
minut. Po zakończeniu Gateway będzie działać, uwierzytelnianie będzie skonfigurowane, a
sesja czatu będzie gotowa do użycia.

## Wymagania

- **Node.js 22.22.3+, 24.15+ lub 25.9+** (24 jest zalecaną wersją domyślną)
- **Klucz API** od dostawcy modelu (Anthropic, OpenAI, Google itp.) — kreator wdrażania poprosi o jego podanie

<Tip>
Wersję Node można sprawdzić za pomocą `node --version`.
**Użytkownicy systemu Windows:** natywna aplikacja Windows Hub to najprostszy sposób korzystania na komputerze. Obsługiwane są również
instalator PowerShell i Gateway w WSL2. Zobacz [Windows](/pl/platforms/windows).
Trzeba zainstalować Node? Zobacz [Konfiguracja Node](/pl/install/node).
</Tip>

## Szybka konfiguracja

<Steps>
  <Step title="Zainstaluj OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Proces skryptu instalacyjnego"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Inne metody instalacji (Docker, Nix, npm): [Instalacja](/pl/install).
    </Note>

  </Step>
  <Step title="Przeprowadź proces wdrażania">
    ```bash
    openclaw onboard --install-daemon
    ```

    Kreator przeprowadza przez wybór dostawcy modelu, ustawienie klucza API
    i konfigurację Gateway. QuickStart zajmuje zwykle tylko kilka minut, ale
    logowanie u dostawcy, parowanie kanału, instalacja demona, pobieranie danych z sieci, Skills
    lub opcjonalne Pluginy mogą wydłużyć pełny proces wdrażania. Opcjonalne
    kroki można pominąć i wrócić do nich później za pomocą `openclaw configure`.

    Pełną dokumentację zawiera strona [Wdrażanie (CLI)](/pl/start/wizard).

  </Step>
  <Step title="Sprawdź, czy Gateway działa">
    ```bash
    openclaw gateway status
    ```

    Powinna pojawić się informacja, że Gateway nasłuchuje na porcie 18789.

  </Step>
  <Step title="Otwórz panel">
    ```bash
    openclaw dashboard
    ```

    Spowoduje to otwarcie interfejsu sterowania w przeglądarce. Jeśli się wczyta, wszystko działa.

  </Step>
  <Step title="Wyślij pierwszą wiadomość">
    Wpisz wiadomość na czacie interfejsu sterowania — powinna nadejść odpowiedź od AI.

    Wolisz rozmawiać przez telefon? Najszybszym kanałem do skonfigurowania jest
    [Telegram](/pl/channels/telegram) (wystarczy token bota). Wszystkie opcje opisano na stronie [Kanały](/pl/channels).

  </Step>
</Steps>

<Accordion title="Zaawansowane: montowanie niestandardowej kompilacji interfejsu sterowania">
  W przypadku utrzymywania zlokalizowanej lub dostosowanej kompilacji panelu należy wskazać
  w `gateway.controlUi.root` katalog zawierający skompilowane zasoby
  statyczne oraz `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Skopiuj skompilowane pliki statyczne do tego katalogu.
```

Następnie ustaw:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Uruchom ponownie Gateway i ponownie otwórz panel:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Co dalej

<Columns>
  <Card title="Połącz kanał" href="/pl/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo i inne.
  </Card>
  <Card title="Parowanie i bezpieczeństwo" href="/pl/channels/pairing" icon="shield">
    Określ, kto może wysyłać wiadomości do agenta.
  </Card>
  <Card title="Skonfiguruj Gateway" href="/pl/gateway/configuration" icon="settings">
    Modele, narzędzia, piaskownica i ustawienia zaawansowane.
  </Card>
  <Card title="Przeglądaj narzędzia" href="/pl/tools" icon="wrench">
    Przeglądarka, wykonywanie poleceń, wyszukiwanie w internecie, Skills i Pluginy.
  </Card>
</Columns>

<Accordion title="Zaawansowane: zmienne środowiskowe">
  Jeśli OpenClaw działa jako konto usługi lub wymagane są niestandardowe ścieżki:

- `OPENCLAW_HOME` — katalog domowy do wewnętrznego rozpoznawania ścieżek
- `OPENCLAW_STATE_DIR` — zastępuje katalog stanu
- `OPENCLAW_CONFIG_PATH` — zastępuje ścieżkę pliku konfiguracyjnego

Pełna dokumentacja: [Zmienne środowiskowe](/pl/help/environment).
</Accordion>

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Omówienie kanałów](/pl/channels)
- [Konfiguracja](/pl/start/setup)
