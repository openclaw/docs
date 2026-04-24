---
read_when:
    - Pierwsza konfiguracja od zera
    - Chcesz najszybszej drogi do działającego czatu
summary: Zainstaluj OpenClaw i uruchom swój pierwszy czat w kilka minut.
title: Pierwsze kroki
x-i18n:
    generated_at: "2026-04-24T09:33:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

Zainstaluj OpenClaw, uruchom onboarding i porozmawiaj ze swoim asystentem AI — wszystko w
około 5 minut. Na końcu będziesz mieć działający Gateway, skonfigurowane uwierzytelnianie
i działającą sesję czatu.

## Czego potrzebujesz

- **Node.js** — zalecany Node 24 (obsługiwany jest także Node 22.14+)
- **Klucz API** od dostawcy modelu (Anthropic, OpenAI, Google itd.) — onboarding poprosi Cię o niego

<Tip>
Sprawdź swoją wersję Node za pomocą `node --version`.
**Użytkownicy Windows:** obsługiwane są zarówno natywny Windows, jak i WSL2. WSL2 jest bardziej
stabilny i zalecany dla pełnego doświadczenia. Zobacz [Windows](/pl/platforms/windows).
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

    Zobacz [Onboarding (CLI)](/pl/start/wizard), aby uzyskać pełne informacje.

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

    To otworzy interfejs Control UI w Twojej przeglądarce. Jeśli się ładuje, wszystko działa.

  </Step>
  <Step title="Wyślij swoją pierwszą wiadomość">
    Wpisz wiadomość na czacie Control UI, a powinieneś otrzymać odpowiedź AI.

    Chcesz zamiast tego rozmawiać z telefonu? Najszybszym kanałem do skonfigurowania jest
    [Telegram](/pl/channels/telegram) (wystarczy token bota). Zobacz [Channels](/pl/channels),
    aby poznać wszystkie opcje.

  </Step>
</Steps>

<Accordion title="Zaawansowane: zamontowanie niestandardowej kompilacji Control UI">
  Jeśli utrzymujesz zlokalizowaną lub dostosowaną kompilację dashboardu, wskaż
  `gateway.controlUi.root` na katalog zawierający zbudowane statyczne
  zasoby i `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Skopiuj zbudowane pliki statyczne do tego katalogu.
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

## Co zrobić dalej

<Columns>
  <Card title="Połącz kanał" href="/pl/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo i nie tylko.
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
  Jeśli uruchamiasz OpenClaw jako konto usługi lub chcesz używać niestandardowych ścieżek:

- `OPENCLAW_HOME` — katalog domowy do wewnętrznego rozwiązywania ścieżek
- `OPENCLAW_STATE_DIR` — nadpisuje katalog stanu
- `OPENCLAW_CONFIG_PATH` — nadpisuje ścieżkę pliku konfiguracyjnego

Pełne informacje: [Zmienne środowiskowe](/pl/help/environment).
</Accordion>

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Przegląd Channels](/pl/channels)
- [Konfiguracja](/pl/start/setup)
