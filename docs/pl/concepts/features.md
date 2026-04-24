---
read_when:
    - Chcesz pełną listę tego, co obsługuje OpenClaw
summary: Możliwości OpenClaw w kanałach, routingu, multimediach i UX.
title: Funkcje
x-i18n:
    generated_at: "2026-04-24T09:05:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Najważniejsze elementy

<Columns>
  <Card title="Kanały" icon="message-square" href="/pl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i inne przez jeden Gateway.
  </Card>
  <Card title="Pluginy" icon="plug" href="/pl/tools/plugin">
    Dołączone Pluginy dodają Matrix, Nextcloud Talk, Nostr, Twitch, Zalo i inne bez osobnych instalacji w standardowych bieżących wydaniach.
  </Card>
  <Card title="Routing" icon="route" href="/pl/concepts/multi-agent">
    Routing wielu agentów z izolowanymi sesjami.
  </Card>
  <Card title="Multimedia" icon="image" href="/pl/nodes/images">
    Obrazy, audio, wideo, dokumenty oraz generowanie obrazów/wideo.
  </Card>
  <Card title="Aplikacje i interfejs użytkownika" icon="monitor" href="/pl/web/control-ui">
    Web Control UI i aplikacja towarzysząca dla macOS.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/pl/nodes">
    Node iOS i Android z parowaniem, głosem/czatem i rozbudowanymi poleceniami urządzenia.
  </Card>
</Columns>

## Pełna lista

**Kanały:**

- Wbudowane kanały obejmują Discord, Google Chat, iMessage (starsze), IRC, Signal, Slack, Telegram, WebChat i WhatsApp
- Kanały z dołączonych Pluginów obejmują BlueBubbles dla iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal
- Opcjonalne kanały Pluginów instalowanych osobno obejmują Voice Call i pakiety zewnętrzne, takie jak WeChat
- Zewnętrzne Pluginy kanałów mogą dalej rozszerzać Gateway, na przykład o WeChat
- Obsługa czatów grupowych z aktywacją opartą na wzmiankach
- Bezpieczeństwo wiadomości prywatnych dzięki allowlistom i parowaniu

**Agent:**

- Osadzone środowisko wykonawcze agenta ze strumieniowaniem narzędzi
- Routing wielu agentów z izolowanymi sesjami per obszar roboczy lub nadawca
- Sesje: czaty prywatne są zwijane do współdzielonego `main`; grupy są izolowane
- Strumieniowanie i chunking dla długich odpowiedzi

**Uwierzytelnianie i dostawcy:**

- Ponad 35 dostawców modeli (Anthropic, OpenAI, Google i inni)
- Uwierzytelnianie subskrypcyjne przez OAuth (np. OpenAI Codex)
- Obsługa niestandardowych i self-hosted dostawców (vLLM, SGLang, Ollama oraz dowolny punkt końcowy zgodny z OpenAI lub Anthropic)

**Multimedia:**

- Obrazy, audio, wideo i dokumenty w obu kierunkach
- Współdzielone powierzchnie możliwości generowania obrazów i generowania wideo
- Transkrypcja notatek głosowych
- Zamiana tekstu na mowę z wieloma dostawcami

**Aplikacje i interfejsy:**

- WebChat i przeglądarkowy Control UI
- Aplikacja towarzysząca dla macOS na pasku menu
- Node iOS z parowaniem, Canvas, kamerą, nagrywaniem ekranu, lokalizacją i głosem
- Node Android z parowaniem, czatem, głosem, Canvas, kamerą i poleceniami urządzenia

**Narzędzia i automatyzacja:**

- Automatyzacja przeglądarki, exec, sandboxing
- Wyszukiwanie w internecie (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Zadania Cron i harmonogramowanie Heartbeat
- Skills, Pluginy i potoki workflow (Lobster)

## Powiązane

- [Funkcje eksperymentalne](/pl/concepts/experimental-features)
- [Środowisko wykonawcze agenta](/pl/concepts/agent)
