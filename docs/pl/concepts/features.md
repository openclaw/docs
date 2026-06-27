---
read_when:
    - Chcesz pełnej listy tego, co obsługuje OpenClaw
summary: Możliwości OpenClaw w kanałach, routingu, mediach i UX.
title: Funkcje
x-i18n:
    generated_at: "2026-06-27T17:26:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Najważniejsze funkcje

<Columns>
  <Card title="Kanały" icon="message-square" href="/pl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i inne z jednym Gateway.
  </Card>
  <Card title="Pluginy" icon="plug" href="/pl/tools/plugin">
    Dołączone pluginy dodają Matrix, Nextcloud Talk, Nostr, Twitch, Zalo i inne bez osobnych instalacji w zwykłych bieżących wydaniach.
  </Card>
  <Card title="Routing" icon="route" href="/pl/concepts/multi-agent">
    Routing wielu agentów z izolowanymi sesjami.
  </Card>
  <Card title="Media" icon="image" href="/pl/nodes/images">
    Obrazy, dźwięk, wideo, dokumenty oraz generowanie obrazów/wideo.
  </Card>
  <Card title="Aplikacje i UI" icon="monitor" href="/pl/platforms">
    Windows Hub, Web Control UI, aplikacja macOS i węzły mobilne.
  </Card>
  <Card title="Węzły mobilne" icon="smartphone" href="/pl/nodes">
    Węzły iOS i Android z parowaniem, głosem/czatem oraz rozbudowanymi poleceniami urządzenia.
  </Card>
</Columns>

## Pełna lista

**Kanały:**

- Wbudowane kanały obejmują Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat i WhatsApp
- Dołączone kanały pluginów obejmują Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal
- Opcjonalne, osobno instalowane pluginy kanałów obejmują Voice Call i pakiety zewnętrzne, takie jak WeChat
- Zewnętrzne pluginy kanałów mogą dalej rozszerzać Gateway, na przykład o WeChat
- Obsługa czatów grupowych z aktywacją przez wzmianki
- Bezpieczeństwo DM dzięki listom dozwolonych i parowaniu

**Agent:**

- Osadzony runtime agenta ze strumieniowaniem narzędzi
- Routing wielu agentów z izolowanymi sesjami na workspace lub nadawcę
- Sesje: czaty bezpośrednie zwijają się do wspólnego `main`; grupy są izolowane
- Strumieniowanie i dzielenie długich odpowiedzi na fragmenty

**Uwierzytelnianie i dostawcy:**

- Ponad 35 dostawców modeli (Anthropic, OpenAI, Google i inni)
- Uwierzytelnianie subskrypcyjne przez OAuth (np. OpenAI Codex)
- Obsługa niestandardowych i samodzielnie hostowanych dostawców (vLLM, SGLang, Ollama oraz dowolny punkt końcowy zgodny z OpenAI lub Anthropic)

**Media:**

- Obrazy, dźwięk, wideo i dokumenty na wejściu i wyjściu
- Wspólne powierzchnie możliwości generowania obrazów i wideo
- Transkrypcja notatek głosowych
- Zamiana tekstu na mowę z wieloma dostawcami

**Aplikacje i interfejsy:**

- WebChat i przeglądarkowy Control UI
- Towarzysząca aplikacja paska menu dla macOS
- Węzeł iOS z parowaniem, Canvas, kamerą, nagrywaniem ekranu, lokalizacją i głosem
- Węzeł Android z parowaniem, czatem, głosem, Canvas, kamerą i poleceniami urządzenia

**Narzędzia i automatyzacja:**

- Automatyzacja przeglądarki, exec, sandboxing
- Wyszukiwanie w sieci (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Zadania Cron i harmonogram Heartbeat
- Skills, pluginy i potoki workflow (Lobster)

## Powiązane

<CardGroup cols={2}>
  <Card title="Funkcje eksperymentalne" href="/pl/concepts/experimental-features" icon="flask">
    Funkcje opcjonalne, które nie trafiły jeszcze do domyślnej powierzchni.
  </Card>
  <Card title="Runtime agenta" href="/pl/concepts/agent" icon="robot">
    Model runtime agenta i sposób uruchamiania przebiegów.
  </Card>
  <Card title="Kanały" href="/pl/channels" icon="message-square">
    Połącz Telegram, WhatsApp, Discord, Slack i inne z jednego Gateway.
  </Card>
  <Card title="Pluginy" href="/pl/tools/plugin" icon="plug">
    Dołączone i zewnętrzne pluginy rozszerzające OpenClaw.
  </Card>
</CardGroup>
