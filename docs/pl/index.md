---
read_when:
    - Przedstawiasz OpenClaw nowym użytkownikom
summary: OpenClaw to wielokanałowy gateway dla agentów AI, który działa w każdym systemie operacyjnym.
title: OpenClaw
x-i18n:
    generated_at: "2026-04-05T13:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c29a8d9fc41a94b650c524bb990106f134345560e6d615dac30e8815afff481
    source_path: index.md
    workflow: 15
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"EXFOLIATE! EXFOLIATE!"_ — Kosmiczny homar, prawdopodobnie

<p align="center">
  <strong>Gateway dla agentów AI na dowolnym systemie operacyjnym — obsługuje Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo i więcej.</strong><br />
  Wyślij wiadomość i otrzymaj odpowiedź agenta prosto do kieszeni. Uruchom jeden Gateway dla wbudowanych kanałów, dołączonych pluginów kanałów, WebChat i węzłów mobilnych.
</p>

<Columns>
  <Card title="Rozpocznij" href="/start/getting-started" icon="rocket">
    Zainstaluj OpenClaw i uruchom Gateway w kilka minut.
  </Card>
  <Card title="Uruchom wdrożenie" href="/start/wizard" icon="sparkles">
    Konfiguracja prowadzona z `openclaw onboard` i przepływami parowania.
  </Card>
  <Card title="Otwórz Control UI" href="/web/control-ui" icon="layout-dashboard">
    Uruchom dashboard w przeglądarce do czatu, konfiguracji i sesji.
  </Card>
</Columns>

## Czym jest OpenClaw?

OpenClaw to **samohostowany gateway**, który łączy Twoje ulubione aplikacje czatowe i powierzchnie kanałów — wbudowane kanały oraz dołączone lub zewnętrzne pluginy kanałów, takie jak Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo i inne — z agentami AI do programowania, takimi jak Pi. Uruchamiasz pojedynczy proces Gateway na własnym komputerze (lub serwerze), a on staje się mostem między Twoimi aplikacjami do wiadomości a zawsze dostępnym asystentem AI.

**Dla kogo to jest?** Dla programistów i zaawansowanych użytkowników, którzy chcą mieć osobistego asystenta AI, do którego można pisać z dowolnego miejsca — bez rezygnacji z kontroli nad swoimi danymi i bez polegania na usłudze hostowanej.

**Co go wyróżnia?**

- **Samohostowany**: działa na Twoim sprzęcie, na Twoich zasadach
- **Wielokanałowy**: jeden Gateway jednocześnie obsługuje wbudowane kanały oraz dołączone lub zewnętrzne pluginy kanałów
- **Natywny dla agentów**: zbudowany dla agentów programistycznych z użyciem narzędzi, sesjami, pamięcią i routingiem wielu agentów
- **Open source**: licencja MIT, rozwój napędzany przez społeczność

**Czego potrzebujesz?** Node 24 (zalecane) albo Node 22 LTS (`22.14+`) dla zgodności, klucza API od wybranego dostawcy i 5 minut. Dla najlepszej jakości i bezpieczeństwa używaj najmocniejszego dostępnego modelu najnowszej generacji.

## Jak to działa

```mermaid
flowchart LR
  A["Aplikacje czatowe + pluginy"] --> B["Gateway"]
  B --> C["Agent Pi"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["Aplikacja macOS"]
  B --> G["Węzły iOS i Android"]
```

Gateway jest jedynym źródłem prawdy dla sesji, routingu i połączeń kanałów.

## Kluczowe możliwości

<Columns>
  <Card title="Wielokanałowy gateway" icon="network">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i więcej w jednym procesie Gateway.
  </Card>
  <Card title="Pluginy kanałów" icon="plug">
    Dołączone pluginy dodają Matrix, Nostr, Twitch, Zalo i inne w zwykłych aktualnych wydaniach.
  </Card>
  <Card title="Routing wielu agentów" icon="route">
    Izolowane sesje według agenta, workspace lub nadawcy.
  </Card>
  <Card title="Obsługa multimediów" icon="image">
    Wysyłaj i odbieraj obrazy, audio i dokumenty.
  </Card>
  <Card title="Web Control UI" icon="monitor">
    Dashboard w przeglądarce do czatu, konfiguracji, sesji i węzłów.
  </Card>
  <Card title="Węzły mobilne" icon="smartphone">
    Paruj węzły iOS i Android dla Canvas, kamery i przepływów pracy z obsługą głosu.
  </Card>
</Columns>

## Szybki start

<Steps>
  <Step title="Zainstaluj OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Przejdź wdrożenie i zainstaluj usługę">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Czat">
    Otwórz Control UI w przeglądarce i wyślij wiadomość:

    ```bash
    openclaw dashboard
    ```

    Albo podłącz kanał ([Telegram](/pl/channels/telegram) jest najszybszy) i rozmawiaj z telefonu.

  </Step>
</Steps>

Potrzebujesz pełnej instalacji i konfiguracji deweloperskiej? Zobacz [Pierwsze kroki](/start/getting-started).

## Dashboard

Otwórz przeglądarkowe Control UI po uruchomieniu Gateway.

- Domyślnie lokalnie: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Dostęp zdalny: [Powierzchnie webowe](/web) i [Tailscale](/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Konfiguracja (opcjonalnie)

Konfiguracja znajduje się w `~/.openclaw/openclaw.json`.

- Jeśli **nic nie zrobisz**, OpenClaw użyje dołączonego binarium Pi w trybie RPC z sesjami per nadawca.
- Jeśli chcesz to ograniczyć, zacznij od `channels.whatsapp.allowFrom` i (dla grup) reguł wzmiankowania.

Przykład:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## Zacznij tutaj

<Columns>
  <Card title="Centra dokumentacji" href="/start/hubs" icon="book-open">
    Cała dokumentacja i przewodniki, uporządkowane według zastosowania.
  </Card>
  <Card title="Konfiguracja" href="/gateway/configuration" icon="settings">
    Podstawowe ustawienia Gateway, tokeny i konfiguracja dostawców.
  </Card>
  <Card title="Dostęp zdalny" href="/gateway/remote" icon="globe">
    Wzorce dostępu przez SSH i tailnet.
  </Card>
  <Card title="Kanały" href="/pl/channels/telegram" icon="message-square">
    Konfiguracja specyficzna dla kanałów, takich jak Feishu, Microsoft Teams, WhatsApp, Telegram, Discord i innych.
  </Card>
  <Card title="Węzły" href="/nodes" icon="smartphone">
    Węzły iOS i Android z parowaniem, Canvas, kamerą i działaniami urządzenia.
  </Card>
  <Card title="Pomoc" href="/help" icon="life-buoy">
    Typowe rozwiązania i punkt wejścia do rozwiązywania problemów.
  </Card>
</Columns>

## Dowiedz się więcej

<Columns>
  <Card title="Pełna lista funkcji" href="/concepts/features" icon="list">
    Pełne możliwości kanałów, routingu i multimediów.
  </Card>
  <Card title="Routing wielu agentów" href="/concepts/multi-agent" icon="route">
    Izolacja workspace i sesje per agent.
  </Card>
  <Card title="Security" href="/gateway/security" icon="shield">
    Tokeny, allowlisty i mechanizmy bezpieczeństwa.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/gateway/troubleshooting" icon="wrench">
    Diagnostyka Gateway i typowe błędy.
  </Card>
  <Card title="Informacje i podziękowania" href="/reference/credits" icon="info">
    Początki projektu, współtwórcy i licencja.
  </Card>
</Columns>
