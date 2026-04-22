---
read_when:
    - Chcesz pełną listę tego, co obsługuje OpenClaw
summary: Możliwości OpenClaw w kanałach, routingu, mediach i UX.
title: Funkcje
x-i18n:
    generated_at: "2026-04-22T04:22:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Funkcje

## Najważniejsze

<Columns>
  <Card title="Kanały" icon="message-square" href="/pl/channels">
    Discord, Google Chat, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i inne z jednym Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/pl/tools/plugin">
    Bundled plugins dodają Matrix, Nextcloud Talk, Nostr, Twitch, Zalo i inne bez osobnych instalacji w standardowych bieżących wydaniach.
  </Card>
  <Card title="Routing" icon="route" href="/pl/concepts/multi-agent">
    Routing multi-agent z izolowanymi sesjami.
  </Card>
  <Card title="Media" icon="image" href="/pl/nodes/images">
    Obrazy, audio, wideo, dokumenty oraz generowanie obrazów/wideo.
  </Card>
  <Card title="Aplikacje i UI" icon="monitor" href="/web/control-ui">
    Web Control UI i aplikacja towarzysząca dla macOS.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/pl/nodes">
    Node iOS i Android z parowaniem, głosem/czatem i rozbudowanymi poleceniami urządzenia.
  </Card>
</Columns>

## Pełna lista

**Kanały:**

- Wbudowane kanały obejmują Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat i WhatsApp
- Kanały bundled plugin obejmują BlueBubbles dla iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal
- Opcjonalne osobno instalowane plugins kanałów obejmują Voice Call i pakiety firm trzecich, takie jak WeChat
- Plugins kanałów firm trzecich mogą dalej rozszerzać Gateway, na przykład o WeChat
- Obsługa czatów grupowych z aktywacją opartą na wzmiankach
- Bezpieczeństwo DM dzięki allowlistom i parowaniu

**Agent:**

- Wbudowane środowisko uruchomieniowe agenta ze streamingiem narzędzi
- Routing multi-agent z izolowanymi sesjami dla każdego obszaru roboczego lub nadawcy
- Sesje: czaty bezpośrednie są zwijane do współdzielonego `main`; grupy są izolowane
- Streaming i chunking dla długich odpowiedzi

**Uwierzytelnianie i providerzy:**

- Ponad 35 providerów modeli (Anthropic, OpenAI, Google i inne)
- Uwierzytelnianie subskrypcji przez OAuth (np. OpenAI Codex)
- Obsługa providerów niestandardowych i self-hosted (vLLM, SGLang, Ollama oraz dowolny endpoint zgodny z OpenAI lub Anthropic)

**Media:**

- Obrazy, audio, wideo i dokumenty przychodzące oraz wychodzące
- Współdzielone powierzchnie możliwości generowania obrazów i generowania wideo
- Transkrypcja notatek głosowych
- Zamiana tekstu na mowę z wieloma providerami

**Aplikacje i interfejsy:**

- WebChat i przeglądarkowe Control UI
- Aplikacja towarzysząca w pasku menu macOS
- Node iOS z parowaniem, Canvas, kamerą, nagrywaniem ekranu, lokalizacją i głosem
- Node Android z parowaniem, czatem, głosem, Canvas, kamerą i poleceniami urządzenia

**Narzędzia i automatyzacja:**

- Automatyzacja przeglądarki, exec, sandboxing
- Wyszukiwanie w sieci (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Zadania Cron i harmonogram Heartbeat
- Skills, plugins i potoki workflow (Lobster)
