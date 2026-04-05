---
read_when:
    - Pierwsza konfiguracja od zera
    - Chcesz najszybszej drogi do działającego czatu
summary: Zainstaluj OpenClaw i uruchom swój pierwszy czat w kilka minut.
title: Pierwsze kroki
x-i18n:
    generated_at: "2026-04-05T14:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# Pierwsze kroki

Zainstaluj OpenClaw, uruchom onboarding i rozmawiaj ze swoim asystentem AI — a wszystko to
w około 5 minut. Na końcu będziesz mieć uruchomioną bramę Gateway, skonfigurowane auth
i działającą sesję czatu.

## Czego potrzebujesz

- **Node.js** — zalecany Node 24 (obsługiwany jest także Node 22.14+)
- **Klucza API** od dostawcy modeli (Anthropic, OpenAI, Google itp.) — onboarding o niego poprosi

<Tip>
Sprawdź wersję Node poleceniem `node --version`.
**Użytkownicy Windows:** obsługiwane są zarówno natywny Windows, jak i WSL2. WSL2 jest bardziej
stabilny i zalecany dla pełnego doświadczenia. Zobacz [Windows](/platforms/windows).
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

    Kreator przeprowadzi Cię przez wybór dostawcy modeli, ustawienie klucza API
    i konfigurację Gateway. Zajmuje to około 2 minut.

    Pełne odniesienie znajdziesz w [Onboarding (CLI)](/start/wizard).

  </Step>
  <Step title="Sprawdź, czy Gateway działa">
    ```bash
    openclaw gateway status
    ```

    Powinieneś zobaczyć, że Gateway nasłuchuje na porcie 18789.

  </Step>
  <Step title="Otwórz dashboard">
    ```bash
    openclaw dashboard
    ```

    To otworzy Control UI w przeglądarce. Jeśli się załaduje, wszystko działa.

  </Step>
  <Step title="Wyślij swoją pierwszą wiadomość">
    Wpisz wiadomość na czacie w Control UI, a powinieneś otrzymać odpowiedź AI.

    Chcesz zamiast tego rozmawiać z telefonu? Najszybszym kanałem do skonfigurowania jest
    [Telegram](/pl/channels/telegram) (wystarczy token bota). Wszystkie opcje znajdziesz w [Kanały](/pl/channels).

  </Step>
</Steps>

<Accordion title="Zaawansowane: zamontuj niestandardowy build Control UI">
  Jeśli utrzymujesz zlokalizowany lub zmodyfikowany build dashboardu, ustaw
  `gateway.controlUi.root` na katalog zawierający zbudowane statyczne
  zasoby i `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Skopiuj do tego katalogu swoje zbudowane pliki statyczne.
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

Uruchom ponownie gateway i ponownie otwórz dashboard:

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
    Kontroluj, kto może wysyłać wiadomości do twojego agenta.
  </Card>
  <Card title="Skonfiguruj Gateway" href="/pl/gateway/configuration" icon="settings">
    Modele, narzędzia, sandbox i ustawienia zaawansowane.
  </Card>
  <Card title="Przeglądaj narzędzia" href="/tools" icon="wrench">
    Browser, exec, web search, Skills i wtyczki.
  </Card>
</Columns>

<Accordion title="Zaawansowane: zmienne środowiskowe">
  Jeśli uruchamiasz OpenClaw jako konto usługi lub chcesz używać niestandardowych ścieżek:

- `OPENCLAW_HOME` — katalog domowy do wewnętrznego rozpoznawania ścieżek
- `OPENCLAW_STATE_DIR` — nadpisuje katalog stanu
- `OPENCLAW_CONFIG_PATH` — nadpisuje ścieżkę pliku konfiguracji

Pełne odniesienie: [Zmienne środowiskowe](/pl/help/environment).
</Accordion>
