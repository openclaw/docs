---
read_when:
    - Pierwsza konfiguracja od zera
    - Chcesz najszybciej uruchomić działający czat
summary: Zainstaluj OpenClaw i uruchom swój pierwszy czat w kilka minut.
title: Pierwsze kroki
x-i18n:
    generated_at: "2026-06-27T18:22:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

Zainstaluj OpenClaw, uruchom onboarding i porozmawiaj ze swoim asystentem AI — wszystko w
około 5 minut. Na koniec będziesz mieć działający Gateway, skonfigurowane uwierzytelnianie
i działającą sesję czatu.

## Czego potrzebujesz

- **Node.js** — zalecany Node 24 (obsługiwany jest też Node 22.19+)
- **Klucz API** od dostawcy modelu (Anthropic, OpenAI, Google itd.) — onboarding poprosi Cię o niego

<Tip>
Sprawdź wersję Node poleceniem `node --version`.
**Użytkownicy Windows:** natywna aplikacja Windows Hub to najłatwiejsza ścieżka desktopowa. Obsługiwane są też
instalator PowerShell i ścieżki Gateway w WSL2. Zobacz [Windows](/pl/platforms/windows).
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

    Powinien być widoczny Gateway nasłuchujący na porcie 18789.

  </Step>
  <Step title="Otwórz panel">
    ```bash
    openclaw dashboard
    ```

    To otwiera Control UI w przeglądarce. Jeśli się załaduje, wszystko działa.

  </Step>
  <Step title="Wyślij pierwszą wiadomość">
    Wpisz wiadomość na czacie Control UI, a powinieneś otrzymać odpowiedź AI.

    Wolisz czatować z telefonu? Najszybszym kanałem do skonfigurowania jest
    [Telegram](/pl/channels/telegram) (wystarczy token bota). Zobacz [Kanały](/pl/channels),
    aby poznać wszystkie opcje.

  </Step>
</Steps>

<Accordion title="Zaawansowane: zamontuj niestandardową kompilację Control UI">
  Jeśli utrzymujesz zlokalizowaną lub dostosowaną kompilację panelu, wskaż
  `gateway.controlUi.root` na katalog zawierający zbudowane statyczne
  zasoby oraz `index.html`.

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

## Co zrobić dalej

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
    Przeglądarka, exec, wyszukiwanie w sieci, Skills i pluginy.
  </Card>
</Columns>

<Accordion title="Zaawansowane: zmienne środowiskowe">
  Jeśli uruchamiasz OpenClaw jako konto usługi albo chcesz użyć niestandardowych ścieżek:

- `OPENCLAW_HOME` — katalog domowy do wewnętrznego rozpoznawania ścieżek
- `OPENCLAW_STATE_DIR` — nadpisuje katalog stanu
- `OPENCLAW_CONFIG_PATH` — nadpisuje ścieżkę pliku konfiguracyjnego

Pełna dokumentacja: [Zmienne środowiskowe](/pl/help/environment).
</Accordion>

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Omówienie kanałów](/pl/channels)
- [Konfiguracja](/pl/start/setup)
