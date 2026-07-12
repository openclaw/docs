---
read_when:
    - Pierwsza konfiguracja od zera
    - Chcesz jak najszybciej uruchomić działający czat
summary: Zainstaluj OpenClaw i rozpocznij pierwszy czat w kilka minut.
title: Pierwsze kroki
x-i18n:
    generated_at: "2026-07-12T15:38:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Zainstaluj OpenClaw, przeprowadź wdrażanie i rozpocznij rozmowę ze swoim asystentem AI w około 5
minut. Po zakończeniu będziesz mieć uruchomiony Gateway, skonfigurowane uwierzytelnianie oraz
działającą sesję czatu.

## Czego potrzebujesz

- **Node.js 22.19+, 23.11+ lub 24+** (wersja 24 jest zalecanym wyborem domyślnym)
- **Klucz API** od dostawcy modelu (Anthropic, OpenAI, Google itp.) — kreator wdrażania poprosi o jego podanie

<Tip>
Sprawdź wersję Node za pomocą polecenia `node --version`.
**Użytkownicy systemu Windows:** natywna aplikacja Windows Hub jest najłatwiejszym rozwiązaniem na komputery stacjonarne. Obsługiwane są również
instalator PowerShell i Gateway w środowisku WSL2. Zobacz [Windows](/pl/platforms/windows).
Musisz zainstalować Node? Zobacz [Konfiguracja Node](/pl/install/node).
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
  <Step title="Przeprowadź wdrażanie">
    ```bash
    openclaw onboard --install-daemon
    ```

    Kreator przeprowadzi Cię przez wybór dostawcy modelu, ustawienie klucza API
    i konfigurację Gateway. QuickStart zwykle zajmuje tylko kilka minut, ale
    logowanie u dostawcy, parowanie kanałów, instalacja demona, pobieranie danych z sieci, Skills
    lub opcjonalne pluginy mogą wydłużyć pełne wdrażanie. Pomiń opcjonalne
    kroki i wróć do nich później za pomocą polecenia `openclaw configure`.

    Pełną dokumentację znajdziesz w sekcji [Wdrażanie (CLI)](/pl/start/wizard).

  </Step>
  <Step title="Sprawdź, czy Gateway działa">
    ```bash
    openclaw gateway status
    ```

    Powinna pojawić się informacja, że Gateway nasłuchuje na porcie 18789.

  </Step>
  <Step title="Otwórz panel sterowania">
    ```bash
    openclaw dashboard
    ```

    Spowoduje to otwarcie interfejsu Control UI w przeglądarce. Jeśli się załaduje, wszystko działa prawidłowo.

  </Step>
  <Step title="Wyślij pierwszą wiadomość">
    Wpisz wiadomość na czacie w interfejsie Control UI. Powinna pojawić się odpowiedź od AI.

    Wolisz rozmawiać przez telefon? Najszybszym kanałem do skonfigurowania jest
    [Telegram](/pl/channels/telegram) (wystarczy token bota). Wszystkie opcje znajdziesz w sekcji [Kanały](/pl/channels).

  </Step>
</Steps>

<Accordion title="Zaawansowane: zamontuj niestandardową kompilację Control UI">
  Jeśli utrzymujesz zlokalizowaną lub dostosowaną kompilację panelu sterowania, ustaw
  `gateway.controlUi.root` na katalog zawierający skompilowane zasoby statyczne
  i plik `index.html`.

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

Uruchom ponownie Gateway i ponownie otwórz panel sterowania:

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
    Kontroluj, kto może wysyłać wiadomości do Twojego agenta.
  </Card>
  <Card title="Skonfiguruj Gateway" href="/pl/gateway/configuration" icon="settings">
    Modele, narzędzia, piaskownica i ustawienia zaawansowane.
  </Card>
  <Card title="Przeglądaj narzędzia" href="/pl/tools" icon="wrench">
    Przeglądarka, wykonywanie poleceń, wyszukiwanie w sieci, Skills i pluginy.
  </Card>
</Columns>

<Accordion title="Zaawansowane: zmienne środowiskowe">
  Jeśli uruchamiasz OpenClaw za pomocą konta usługi lub chcesz użyć niestandardowych ścieżek:

- `OPENCLAW_HOME` — katalog domowy używany do wewnętrznego rozpoznawania ścieżek
- `OPENCLAW_STATE_DIR` — zastępuje katalog stanu
- `OPENCLAW_CONFIG_PATH` — zastępuje ścieżkę pliku konfiguracyjnego

Pełna dokumentacja: [Zmienne środowiskowe](/pl/help/environment).
</Accordion>

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Omówienie kanałów](/pl/channels)
- [Konfiguracja](/pl/start/setup)
