---
read_when:
    - Potrzebujesz pełnej listy funkcji obsługiwanych przez OpenClaw
summary: Możliwości OpenClaw w zakresie kanałów, routingu, multimediów i UX.
title: Funkcje
x-i18n:
    generated_at: "2026-07-12T14:58:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Najważniejsze funkcje

<Columns>
  <Card title="Kanały" icon="message-square" href="/pl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i inne kanały za pośrednictwem jednego Gateway.
  </Card>
  <Card title="Pluginy" icon="plug" href="/pl/tools/plugin">
    Oficjalne pluginy dodają Matrix, Nextcloud Talk, Nostr, Twitch, Zalo i dziesiątki innych za pomocą jednego polecenia instalacji.
  </Card>
  <Card title="Trasowanie" icon="route" href="/pl/concepts/multi-agent">
    Trasowanie między wieloma agentami z odizolowanymi sesjami.
  </Card>
  <Card title="Multimedia" icon="image" href="/pl/nodes/images">
    Obrazy, dźwięk, filmy, dokumenty oraz generowanie obrazów i filmów.
  </Card>
  <Card title="Aplikacje i interfejs użytkownika" icon="monitor" href="/pl/platforms">
    Windows Hub, przeglądarkowy interfejs sterowania, aplikacja na pasku menu systemu macOS i węzły mobilne.
  </Card>
  <Card title="Węzły mobilne" icon="smartphone" href="/pl/nodes">
    Węzły iOS i Android z parowaniem, obsługą głosu i czatu oraz rozbudowanymi poleceniami urządzenia.
  </Card>
</Columns>

## Pełna lista

**Kanały:**

- iMessage, Telegram i WebChat są dostarczane z instalacją podstawową; każdy inny kanał jest
  oficjalnym pluginem instalowanym za pomocą `openclaw plugins install @openclaw/<id>` (lub na żądanie
  podczas `openclaw onboard` / `openclaw channels add`)
- Kanały oficjalnych pluginów: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo i Zalo Personal
- Kanały zewnętrznych pluginów utrzymywane poza repozytorium OpenClaw: WeChat, Yuanbao i Zalo ClawBot
- Obsługa czatów grupowych z aktywacją przez wzmiankę
- Bezpieczeństwo wiadomości prywatnych dzięki listom dozwolonych i parowaniu

**Agent:**

- Wbudowane środowisko uruchomieniowe agenta ze strumieniowym przesyłaniem wywołań narzędzi
- Trasowanie między wieloma agentami z odizolowanymi sesjami dla każdego obszaru roboczego lub nadawcy
- Sesje: bezpośrednie czaty są łączone we współdzielonej sesji `main`; grupy są odizolowane
- Strumieniowanie i dzielenie długich odpowiedzi na części

**Uwierzytelnianie i dostawcy:**

- Ponad 35 dostawców modeli (Anthropic, OpenAI, Google i inni)
- Uwierzytelnianie subskrypcji przez OAuth (np. OpenAI Codex)
- Obsługa niestandardowych i samodzielnie hostowanych dostawców (vLLM, SGLang, Ollama, llama.cpp, LM Studio oraz
  dowolny punkt końcowy zgodny z OpenAI lub Anthropic)

**Multimedia:**

- Obsługa przychodzących i wychodzących obrazów, dźwięku, filmów i dokumentów
- Wspólne interfejsy funkcji generowania obrazów i filmów
- Transkrypcja notatek głosowych
- Zamiana tekstu na mowę z użyciem wielu dostawców

**Aplikacje i interfejsy:**

- WebChat i przeglądarkowy interfejs sterowania
- Aplikacja towarzysząca na pasku menu systemu macOS
- Węzeł iOS z parowaniem, Canvas, aparatem, nagrywaniem ekranu, lokalizacją i obsługą głosu
- Węzeł Android z parowaniem, czatem, obsługą głosu, Canvas, aparatem i poleceniami urządzenia

**Narzędzia i automatyzacja:**

- Automatyzacja przeglądarki, wykonywanie poleceń i izolacja
- Wyszukiwanie w internecie (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Zadania Cron i planowanie Heartbeat
- Skills, pluginy i potoki przepływów pracy (Lobster)

## Powiązane

<CardGroup cols={2}>
  <Card title="Funkcje eksperymentalne" href="/pl/concepts/experimental-features" icon="flask">
    Funkcje opcjonalne, które nie zostały jeszcze udostępnione w domyślnym interfejsie.
  </Card>
  <Card title="Środowisko uruchomieniowe agenta" href="/pl/concepts/agent" icon="robot">
    Model środowiska uruchomieniowego agenta i sposób przekazywania uruchomień.
  </Card>
  <Card title="Kanały" href="/pl/channels" icon="message-square">
    Połącz Telegram, WhatsApp, Discord, Slack i inne kanały za pośrednictwem jednego Gateway.
  </Card>
  <Card title="Pluginy" href="/pl/tools/plugin" icon="plug">
    Oficjalne i zewnętrzne pluginy rozszerzające OpenClaw.
  </Card>
</CardGroup>
