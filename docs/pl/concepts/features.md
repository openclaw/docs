---
read_when:
    - Potrzebujesz pełnej listy tego, co obsługuje OpenClaw
summary: Możliwości OpenClaw w kanałach, routingu, mediach i UX.
title: Funkcje
x-i18n:
    generated_at: "2026-05-10T19:31:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## Najważniejsze informacje

<Columns>
  <Card title="Kanały" icon="message-square" href="/pl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i inne za pomocą jednego Gateway.
  </Card>
  <Card title="Pluginy" icon="plug" href="/pl/tools/plugin">
    Dołączone pluginy dodają Matrix, Nextcloud Talk, Nostr, Twitch, Zalo i inne bez osobnych instalacji w zwykłych bieżących wydaniach.
  </Card>
  <Card title="Routing" icon="route" href="/pl/concepts/multi-agent">
    Routing wieloagentowy z izolowanymi sesjami.
  </Card>
  <Card title="Media" icon="image" href="/pl/nodes/images">
    Obrazy, audio, wideo, dokumenty oraz generowanie obrazów/wideo.
  </Card>
  <Card title="Aplikacje i UI" icon="monitor" href="/pl/web/control-ui">
    Web Control UI i aplikacja towarzysząca dla macOS.
  </Card>
  <Card title="Węzły mobilne" icon="smartphone" href="/pl/nodes">
    Węzły iOS i Android z parowaniem, głosem/czatem oraz rozbudowanymi poleceniami urządzenia.
  </Card>
</Columns>

## Pełna lista

**Kanały:**

- Wbudowane kanały obejmują Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat i WhatsApp
- Dołączone kanały pluginów obejmują Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal
- Opcjonalne, instalowane osobno pluginy kanałów obejmują Voice Call oraz pakiety firm trzecich, takie jak WeChat
- Pluginy kanałów firm trzecich mogą dalej rozszerzać Gateway, na przykład WeChat
- Obsługa czatów grupowych z aktywacją opartą na wzmiankach
- Bezpieczeństwo wiadomości prywatnych dzięki listom dozwolonych i parowaniu

**Agent:**

- Wbudowane środowisko uruchomieniowe agenta ze strumieniowaniem narzędzi
- Routing wieloagentowy z izolowanymi sesjami dla każdego obszaru roboczego lub nadawcy
- Sesje: czaty bezpośrednie są scalane we współdzielonym `main`; grupy są izolowane
- Strumieniowanie i dzielenie na fragmenty dla długich odpowiedzi

**Uwierzytelnianie i dostawcy:**

- Ponad 35 dostawców modeli (Anthropic, OpenAI, Google i inni)
- Uwierzytelnianie subskrypcji przez OAuth (np. OpenAI Codex)
- Obsługa dostawców niestandardowych i hostowanych samodzielnie (vLLM, SGLang, Ollama oraz dowolny punkt końcowy zgodny z OpenAI lub Anthropic)

**Media:**

- Obrazy, audio, wideo i dokumenty na wejściu i wyjściu
- Wspólne powierzchnie funkcji generowania obrazów i generowania wideo
- Transkrypcja notatek głosowych
- Zamiana tekstu na mowę z wieloma dostawcami

**Aplikacje i interfejsy:**

- WebChat i przeglądarkowy Control UI
- Aplikacja towarzysząca na pasku menu macOS
- Węzeł iOS z parowaniem, Canvas, aparatem, nagrywaniem ekranu, lokalizacją i głosem
- Węzeł Android z parowaniem, czatem, głosem, Canvas, aparatem i poleceniami urządzenia

**Narzędzia i automatyzacja:**

- Automatyzacja przeglądarki, exec, sandboxing
- Wyszukiwanie w sieci (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Zadania Cron i planowanie Heartbeat
- Skills, pluginy i potoki przepływu pracy (Lobster)

## Powiązane

<CardGroup cols={2}>
  <Card title="Funkcje eksperymentalne" href="/pl/concepts/experimental-features" icon="flask">
    Funkcje opcjonalne, które nie zostały jeszcze udostępnione w domyślnej powierzchni.
  </Card>
  <Card title="Środowisko uruchomieniowe agenta" href="/pl/concepts/agent" icon="robot">
    Model środowiska uruchomieniowego agenta i sposób wysyłania uruchomień.
  </Card>
  <Card title="Kanały" href="/pl/channels" icon="message-square">
    Połącz Telegram, WhatsApp, Discord, Slack i inne z jednego Gateway.
  </Card>
  <Card title="Pluginy" href="/pl/tools/plugin" icon="plug">
    Dołączone pluginy i pluginy firm trzecich, które rozszerzają OpenClaw.
  </Card>
</CardGroup>
