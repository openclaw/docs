---
read_when:
    - Chcesz poznać pełną listę funkcji obsługiwanych przez OpenClaw
summary: Możliwości OpenClaw w kanałach, trasowaniu, mediach i UX.
title: Funkcje
x-i18n:
    generated_at: "2026-04-05T13:50:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Funkcje

## Najważniejsze cechy

<Columns>
  <Card title="Kanały" icon="message-square">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat i inne z jedną Gateway.
  </Card>
  <Card title="Plugins" icon="plug">
    Dołączone plugins dodają Matrix, Nextcloud Talk, Nostr, Twitch, Zalo i inne bez osobnych instalacji w normalnych bieżących wydaniach.
  </Card>
  <Card title="Trasowanie" icon="route">
    Trasowanie wielu agentów z izolowanymi sesjami.
  </Card>
  <Card title="Media" icon="image">
    Obrazy, audio, wideo, dokumenty oraz generowanie obrazów i wideo.
  </Card>
  <Card title="Aplikacje i interfejs" icon="monitor">
    Web Control UI i aplikacja towarzysząca macOS.
  </Card>
  <Card title="Mobilne nodes" icon="smartphone">
    Nodes iOS i Android z parowaniem, głosem/czatem i rozbudowanymi poleceniami urządzenia.
  </Card>
</Columns>

## Pełna lista

**Kanały:**

- Wbudowane kanały obejmują Discord, Google Chat, iMessage (legacy), IRC, Signal, Slack, Telegram, WebChat i WhatsApp
- Kanały dołączonych plugins obejmują BlueBubbles dla iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal
- Opcjonalne osobno instalowane plugins kanałów obejmują Voice Call i pakiety zewnętrzne, takie jak WeChat
- Plugins kanałów innych firm mogą dalej rozszerzać Gateway, na przykład o WeChat
- Obsługa czatów grupowych z aktywacją opartą na wzmiankach
- Bezpieczeństwo DM z listami dozwolonych i parowaniem

**Agent:**

- Osadzone środowisko uruchomieniowe agenta ze strumieniowaniem narzędzi
- Trasowanie wielu agentów z izolowanymi sesjami dla każdej przestrzeni roboczej lub nadawcy
- Sesje: czaty bezpośrednie są łączone do współdzielonego `main`; grupy są izolowane
- Strumieniowanie i dzielenie na fragmenty dla długich odpowiedzi

**Uwierzytelnianie i providery:**

- Ponad 35 providerów modeli (Anthropic, OpenAI, Google i inni)
- Uwierzytelnianie subskrypcyjne przez OAuth (np. OpenAI Codex)
- Obsługa niestandardowych i self-hosted providerów (vLLM, SGLang, Ollama oraz dowolny endpoint zgodny z OpenAI lub Anthropic)

**Media:**

- Obrazy, audio, wideo i dokumenty na wejściu i wyjściu
- Współdzielone powierzchnie możliwości generowania obrazów i wideo
- Transkrypcja notatek głosowych
- Text-to-speech z wieloma providerami

**Aplikacje i interfejsy:**

- WebChat i przeglądarkowy Control UI
- Aplikacja towarzysząca macOS w pasku menu
- Node iOS z parowaniem, Canvas, kamerą, nagrywaniem ekranu, lokalizacją i głosem
- Node Android z parowaniem, czatem, głosem, Canvas, kamerą i poleceniami urządzenia

**Narzędzia i automatyzacja:**

- Automatyzacja przeglądarki, exec, sandboxing
- Wyszukiwanie w sieci (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Zadania cron i harmonogram heartbeat
- Skills, plugins i pipeline’y workflow (Lobster)
