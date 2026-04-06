---
read_when:
    - Consultar uma etapa ou flag específica do onboarding
    - Automatizar o onboarding com o modo não interativo
    - Depurar o comportamento do onboarding
sidebarTitle: Onboarding Reference
summary: 'Referência completa do onboarding pela CLI: cada etapa, flag e campo de config'
title: Referência de onboarding
x-i18n:
    generated_at: "2026-04-06T03:12:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e02a4da4a39ba335199095723f5d3b423671eb12efc2d9e4f9e48c1e8ee18419
    source_path: reference/wizard.md
    workflow: 15
---

# Referência de onboarding

Esta é a referência completa para `openclaw onboard`.
Para uma visão geral de alto nível, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Detecção de config existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha **Keep / Modify / Reset**.
    - Executar o onboarding novamente **não** apaga nada, a menos que você escolha explicitamente **Reset**
      (ou passe `--reset`).
    - A flag `--reset` da CLI usa por padrão `config+creds+sessions`; use `--reset-scope full`
      para também remover o workspace.
    - Se a config for inválida ou contiver chaves legadas, o assistente para e pede
      que você execute `openclaw doctor` antes de continuar.
    - O reset usa `trash` (nunca `rm`) e oferece escopos:
      - Somente config
      - Config + credenciais + sessões
      - Reset completo (também remove o workspace)
  </Step>
  <Step title="Model/Auth">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave e depois a salva para uso pelo daemon.
    - **Chave de API da Anthropic**: opção preferida de assistente Anthropic no onboarding/configure.
    - **Setup-token da Anthropic (legado/manual)**: está disponível novamente em onboarding/configure, mas a Anthropic informou aos usuários do OpenClaw que o caminho de login do Claude no OpenClaw conta como uso de harness de terceiros e exige **Extra Usage** na conta Claude.
    - **Assinatura OpenAI Code (Codex) (Codex CLI)**: se `~/.codex/auth.json` existir, o onboarding pode reutilizá-lo. Credenciais reutilizadas do Codex CLI continuam sendo gerenciadas pelo Codex CLI; ao expirar, o OpenClaw relê primeiro essa origem e, quando o provedor consegue atualizá-la, grava a credencial renovada de volta no armazenamento do Codex em vez de assumir esse gerenciamento.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo no navegador; cole `code#state`.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.4` quando o model não estiver definido ou for `openai/*`.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave e depois a armazena em perfis de auth.
      - Define `agents.defaults.model` como `openai/gpt-5.4` quando o model não estiver definido, for `openai/*` ou `openai-codex/*`.
    - **Chave de API do xAI (Grok)**: solicita `XAI_API_KEY` e configura o xAI como provedor de model.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: solicita a base URL do Ollama, oferece os modos **Cloud + Local** ou **Local**, descobre os models disponíveis e faz auto-pull do model local selecionado quando necessário.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a config é gravada automaticamente; o padrão hospedado é `MiniMax-M2.7`.
      A configuração com chave de API usa `minimax/...`, e a configuração com OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/pt-BR/providers/minimax)
    - **StepFun**: a config é gravada automaticamente para StepFun standard ou Step Plan em endpoints da China ou globais.
    - O standard atualmente inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/pt-BR/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/pt-BR/providers/synthetic)
    - **Moonshot (Kimi K2)**: a config é gravada automaticamente.
    - **Kimi Coding**: a config é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
    - **Skip**: ainda não configura auth.
    - Escolha um model padrão entre as opções detectadas (ou informe `provider/model` manualmente). Para melhor qualidade e menor risco de prompt injection, escolha o model mais forte e de geração mais recente disponível na sua pilha de provedores.
    - O onboarding executa uma verificação de model e avisa se o model configurado é desconhecido ou se falta auth.
    - O modo de armazenamento da chave de API usa por padrão valores em texto simples no perfil de auth. Use `--secret-input-mode ref` para armazenar referências baseadas em env no lugar (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Os perfis de auth ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é legado e usado apenas para importação.
    - Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)
    <Note>
    Dica para headless/servidor: conclua o OAuth em uma máquina com navegador e depois copie
    o `auth-profiles.json` desse agente (por exemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
    `$OPENCLAW_STATE_DIR/...`) para o host do gateway. `credentials/oauth.json`
    é apenas uma origem legada de importação.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Preenche os arquivos do workspace necessários para o ritual de bootstrap do agente.
    - Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de auth, exposição Tailscale.
    - Recomendação de auth: mantenha **Token** mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Generate/store plaintext token** (padrão)
      - **Use SecretRef** (opt-in)
      - O início rápido reutiliza SecretRefs existentes de `gateway.auth.token` entre os provedores `env`, `file` e `exec` para sondagem de onboarding/bootstrap do dashboard.
      - Se esse SecretRef estiver configurado, mas não puder ser resolvido, o onboarding falha cedo com uma mensagem clara de correção em vez de degradar silenciosamente a auth em runtime.
    - No modo senha, a configuração interativa também oferece suporte a armazenamento em texto simples ou SecretRef.
    - Caminho não interativo de SecretRef do token: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a auth somente se você confiar totalmente em todos os processos locais.
    - Binds que não sejam loopback ainda exigem auth.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR.
    - [Telegram](/pt-BR/channels/telegram): token de bot.
    - [Discord](/pt-BR/channels/discord): token de bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON de conta de serviço + webhook audience.
    - [Mattermost](/pt-BR/channels/mattermost) (plugin): token de bot + base URL.
    - [Signal](/pt-BR/channels/signal): instalação opcional do `signal-cli` + config da conta.
    - [BlueBubbles](/pt-BR/channels/bluebubbles): **recomendado para iMessage**; URL do servidor + senha + webhook.
    - [iMessage](/pt-BR/channels/imessage): caminho legado do CLI `imsg` + acesso ao banco de dados.
    - Segurança de DM: o padrão é pairing. O primeiro DM envia um código; aprove com `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Web search">
    - Escolha um provedor compatível, como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou ignore).
    - Provedores baseados em API podem usar variáveis de ambiente ou config existente para configuração rápida; provedores sem chave usam os pré-requisitos específicos de cada provedor.
    - Ignore com `--skip-search`.
    - Configure depois: `openclaw configure --section web`.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário autenticada; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux (e Windows via WSL2): unidade systemd de usuário
      - O onboarding tenta ativar lingering via `loginctl enable-linger <user>` para que o Gateway permaneça ativo após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); tenta primeiro sem sudo.
    - **Seleção de runtime:** Node (recomendado; exigido para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a auth por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
    - Se a auth por token exigir um token e o SecretRef configurado do token não puder ser resolvido, a instalação do daemon é bloqueada com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
  </Step>
  <Step title="Health check">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sonda de health do gateway ativo à saída de status, incluindo sondas de canal quando compatíveis (requer um gateway acessível).
  </Step>
  <Step title="Skills (recomendado)">
    - Lê as Skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de Node: **npm / pnpm** (bun não recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Concluir">
    - Resumo + próximos passos, incluindo apps iOS/Android/macOS para recursos extras.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o onboarding imprime instruções de encaminhamento de porta SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o onboarding tenta compilá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
</Note>

## Modo não interativo

Use `--non-interactive` para automatizar ou criar scripts de onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Adicione `--json` para um resumo legível por máquina.

SecretRef de token do gateway no modo não interativo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.

<Note>
`--json` **não** implica modo não interativo. Use `--non-interactive` (e `--workspace`) em scripts.
</Note>

Exemplos de comandos específicos de provedores ficam em [Automação da CLI](/pt-BR/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para semântica de flags e ordem das etapas.

### Adicionar agente (não interativo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC do assistente do Gateway

O Gateway expõe o fluxo de onboarding por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clientes (app macOS, Control UI) podem renderizar etapas sem reimplementar a lógica do onboarding.

## Configuração do Signal (signal-cli)

O onboarding pode instalar `signal-cli` a partir das releases do GitHub:

- Baixa o asset de release apropriado.
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`.
- Grava `channels.signal.cliPath` na sua config.

Observações:

- Builds JVM exigem **Java 21**.
- Builds nativas são usadas quando disponíveis.
- O Windows usa WSL2; a instalação do signal-cli segue o fluxo Linux dentro do WSL.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa por padrão `"coding"` quando não estiver definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, auth, tailscale)
- `session.dmScope` (detalhes de comportamento: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack/Discord/Matrix/Microsoft Teams) quando você optar por elas durante os prompts (nomes são resolvidos para IDs quando possível).
- `skills.install.nodeManager`
  - `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A config manual ainda pode usar `yarn` definindo `skills.install.nodeManager` diretamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.openclaw/agents/<agentId>/sessions/`.

Alguns canais são fornecidos como plugins. Quando você escolhe um deles durante a configuração, o onboarding
solicita a instalação (npm ou caminho local) antes que ele possa ser configurado.

## Documentação relacionada

- Visão geral do onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Onboarding do app macOS: [Onboarding](/pt-BR/start/onboarding)
- Referência de config: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [BlueBubbles](/pt-BR/channels/bluebubbles) (iMessage), [iMessage](/pt-BR/channels/imessage) (legado)
- Skills: [Skills](/pt-BR/tools/skills), [Config de Skills](/pt-BR/tools/skills-config)
