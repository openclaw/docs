---
read_when:
    - Chcesz pełnej listy tego, co obsługuje OpenClaw
summary: Możliwości OpenClaw w zakresie kanałów, routingu, multimediów i UX.
title: Funkcje
x-i18n:
    generated_at: "2026-05-07T01:51:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## Najważniejsze

<Columns>
  <Card title="Channels" icon="message-square" href="/pl/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i inne z jednym Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/pl/tools/plugin">
    Dołączone pluginy dodają Matrix, Nextcloud Talk, Nostr, Twitch, Zalo i inne bez osobnych instalacji w typowych bieżących wydaniach.
  </Card>
  <Card title="Routing" icon="route" href="/pl/concepts/multi-agent">
    Routing wieloagentowy z izolowanymi sesjami.
  </Card>
  <Card title="Media" icon="image" href="/pl/nodes/images">
    Obrazy, audio, wideo, dokumenty oraz generowanie obrazów/wideo.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/pl/web/control-ui">
    Web Control UI i aplikacja towarzysząca dla macOS.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/pl/nodes">
    Węzły iOS i Android z parowaniem, głosem/czatem oraz rozbudowanymi poleceniami urządzenia.
  </Card>
</Columns>

## Pełna lista

**Kanały:**

- Wbudowane kanały obejmują Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat i WhatsApp
- Dołączone kanały pluginów obejmują BlueBubbles jako starszy most iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal
- Opcjonalne, instalowane osobno pluginy kanałów obejmują Voice Call oraz pakiety firm trzecich, takie jak WeChat
- Pluginy kanałów firm trzecich mogą dodatkowo rozszerzać Gateway, na przykład o WeChat
- Obsługa czatów grupowych z aktywacją opartą na wzmiankach
- Bezpieczeństwo wiadomości DM dzięki listom dozwolonych i parowaniu

**Agent:**

- Wbudowane środowisko uruchomieniowe agenta ze strumieniowaniem narzędzi
- Routing wieloagentowy z izolowanymi sesjami dla każdego obszaru roboczego lub nadawcy
- Sesje: czaty bezpośrednie są scalane we współdzielone `main`; grupy są izolowane
- Strumieniowanie i dzielenie na fragmenty dla długich odpowiedzi

**Uwierzytelnianie i dostawcy:**

- Ponad 35 dostawców modeli (Anthropic, OpenAI, Google i inni)
- Uwierzytelnianie subskrypcji przez OAuth (np. OpenAI Codex)
- Obsługa dostawców niestandardowych i hostowanych samodzielnie (vLLM, SGLang, Ollama oraz dowolny endpoint zgodny z OpenAI lub Anthropic)

**Media:**

- Obrazy, audio, wideo i dokumenty na wejściu i wyjściu
- Współdzielone powierzchnie możliwości generowania obrazów i wideo
- Transkrypcja notatek głosowych
- Zamiana tekstu na mowę z wieloma dostawcami

**Aplikacje i interfejsy:**

- WebChat i przeglądarkowy Control UI
- Aplikacja towarzysząca na pasku menu macOS
- Węzeł iOS z parowaniem, Canvas, kamerą, nagrywaniem ekranu, lokalizacją i głosem
- Węzeł Android z parowaniem, czatem, głosem, Canvas, kamerą i poleceniami urządzenia

**Narzędzia i automatyzacja:**

- Automatyzacja przeglądarki, exec, sandboxing
- Wyszukiwanie w sieci (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Zadania Cron i planowanie Heartbeat
- Skills, pluginy i potoki workflow (Lobster)

## Powiązane

<CardGroup cols={2}>
  <Card title="Experimental features" href="/pl/concepts/experimental-features" icon="flask">
    Funkcje opcjonalne, które nie trafiły jeszcze do domyślnej powierzchni.
  </Card>
  <Card title="Agent runtime" href="/pl/concepts/agent" icon="robot">
    Model środowiska uruchomieniowego agenta i sposób wysyłania uruchomień.
  </Card>
  <Card title="Channels" href="/pl/channels" icon="message-square">
    Połącz Telegram, WhatsApp, Discord, Slack i inne z jednego Gateway.
  </Card>
  <Card title="Plugins" href="/pl/tools/plugin" icon="plug">
    Dołączone pluginy i pluginy firm trzecich rozszerzające OpenClaw.
  </Card>
</CardGroup>
