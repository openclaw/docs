---
read_when:
    - Pierwsza konfiguracja od zera
    - Chcesz jak najszybciej uruchomić działający czat
summary: Zainstaluj OpenClaw i rozpocznij pierwszy czat w kilka minut.
title: Pierwsze kroki
x-i18n:
    generated_at: "2026-05-07T13:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

Zainstaluj OpenClaw, uruchom onboarding i czatuj ze swoim asystentem AI — wszystko w
około 5 minut. Na końcu będziesz mieć uruchomiony Gateway, skonfigurowane uwierzytelnianie
i działającą sesję czatu.

## Czego potrzebujesz

- **Node.js** — zalecany Node 24 (obsługiwany jest także Node 22.16+)
- **Klucz API** od dostawcy modelu (Anthropic, OpenAI, Google itd.) — onboarding poprosi Cię o niego

<Tip>
Sprawdź wersję Node poleceniem `node --version`.
**Użytkownicy Windows:** obsługiwane są zarówno natywny Windows, jak i WSL2. WSL2 jest bardziej
stabilny i zalecany do pełnego doświadczenia. Zobacz [Windows](/pl/platforms/windows).
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
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Kreator przeprowadzi Cię przez wybór dostawcy modelu, ustawienie klucza API
    i konfigurację Gateway. Zajmuje to około 2 minut.

    Pełną dokumentację znajdziesz w [Onboarding (CLI)](/pl/start/wizard).

  </Step>
  <Step title="Sprawdź, czy Gateway działa">
    ```bash
    openclaw gateway status
    ```

    Powinieneś zobaczyć, że Gateway nasłuchuje na porcie 18789.

  </Step>
  <Step title="Otwórz panel">
    ```bash
    openclaw dashboard
    ```

    To otworzy Control UI w przeglądarce. Jeśli się ładuje, wszystko działa.

  </Step>
  <Step title="Wyślij pierwszą wiadomość">
    Wpisz wiadomość w czacie Control UI, a powinieneś otrzymać odpowiedź AI.

    Wolisz czatować z telefonu? Najszybszym kanałem do skonfigurowania jest
    [Telegram](/pl/channels/telegram) (wystarczy token bota). Zobacz [Kanały](/pl/channels),
    aby poznać wszystkie opcje.

  </Step>
</Steps>

<Accordion title="Zaawansowane: zamontuj niestandardową kompilację Control UI">
  Jeśli utrzymujesz zlokalizowaną lub dostosowaną kompilację panelu, ustaw
  `gateway.controlUi.root` na katalog zawierający zbudowane statyczne
  zasoby i `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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
    Kontroluj, kto może wysyłać wiadomości do Twojego agenta.
  </Card>
  <Card title="Skonfiguruj Gateway" href="/pl/gateway/configuration" icon="settings">
    Modele, narzędzia, sandbox i ustawienia zaawansowane.
  </Card>
  <Card title="Przeglądaj narzędzia" href="/pl/tools" icon="wrench">
    Przeglądarka, exec, wyszukiwanie w sieci, Skills i Plugin.
  </Card>
</Columns>

<Accordion title="Zaawansowane: zmienne środowiskowe">
  Jeśli uruchamiasz OpenClaw jako konto usługi albo chcesz użyć niestandardowych ścieżek:

- `OPENCLAW_HOME` — katalog domowy do wewnętrznego rozwiązywania ścieżek
- `OPENCLAW_STATE_DIR` — zastępuje katalog stanu
- `OPENCLAW_CONFIG_PATH` — zastępuje ścieżkę pliku konfiguracyjnego

Pełna dokumentacja: [Zmienne środowiskowe](/pl/help/environment).
</Accordion>

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Omówienie kanałów](/pl/channels)
- [Konfiguracja](/pl/start/setup)
